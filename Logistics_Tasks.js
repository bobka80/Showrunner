/**
 * SM Showrunner (smuruner) - Clean 8 Architecture
 * Logistics_Tasks.js - Global Tasks & Notifications Engine
 */

// ==========================================
// --- ENGINE: TASKS & NOTIFICATIONS ---
// ==========================================
// @INDEX: TASKS_ENGINE -> Tasks & Notifications

function getTasksAndNotifs(crewName) {
  return executeWithRetry(() => {
    const profile = getUserSecurityProfile(crewName);
    const userUid = profile.uid || "unknown";
    const sheets = verifyDatabaseSchema(true);
    
    let tasks = [];
    let tData = getSheetData(sheets.tasks);
    let aData = getSheetData(sheets.taskAssignees);
    let tdData = getSheetData(sheets.taskTodos);
    let asData = getSheetData(sheets.taskAssets);
    const canGlobalTasks = effectiveBackendPermission(crewName, 'task_manage_global');
    
    for(let i=1; i<tData.length; i++) {
        let taskId = tData[i][tData.hMap['uid']];
        if(!taskId) continue;
        
        let assignees = [];
        for(let a=1; a<aData.length; a++) { if(aData[a][aData.hMap['task_uid']] === taskId) assignees.push(aData[a][aData.hMap['user_uid']]); }

        if (!canGlobalTasks && !actorIsAssignedToTask(profile, assignees)) continue;
        
        let todos = [];
        for(let t=1; t<tdData.length; t++) { if(tdData[t][tdData.hMap['task_uid']] === taskId) todos.push({ text: tdData[t][tdData.hMap['description']], done: tdData[t][tdData.hMap['is_done']] }); }
        
        let assets = [];
        for(let as=1; as<asData.length; as++) { if(asData[as][asData.hMap['task_uid']] === taskId) assets.push({ id: asData[as][asData.hMap['asset_uid']], name: "Asset ID: " + asData[as][asData.hMap['asset_uid']] }); }
        
        tasks.push({
            id: taskId, title: tData[i][tData.hMap['Title']], assignees: assignees,
            status: tData[i][tData.hMap['Status']], notes: tData[i][tData.hMap['Notes']], todos: todos, assets: assets, priority: tData[i][tData.hMap['Priority']] || 'Medium'
        });
    }
    
    let notifs = [];
    let nData = getSheetData(sheets.notifs);
    let now = new Date().getTime();
    for(let i=1; i<nData.length; i++) {
        if(nData[i][nData.hMap['user_uid']] === userUid) {
            let isRead = nData[i][nData.hMap['Is_Read']];
            let ts = new Date(nData[i][nData.hMap['Timestamp']]).getTime();
            
            // Hide instantly if read and older than 24 hours (86400000ms)
            if (isRead && (now - ts > 86400000)) continue; 
            
            notifs.push({
                id: nData[i][nData.hMap['uid']], message: nData[i][nData.hMap['Message']], isRead: isRead, timestamp: nData[i][nData.hMap['Timestamp']]
            });
        }
    }
    
    notifs.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
    return { tasks: tasks, notifs: notifs };
  });
}

function actorIsAssignedToTask(profile, assignees) {
  if (!profile || !assignees || !assignees.length) return false;
  const email = profile.email ? String(profile.email).toLowerCase().trim() : '';
  const uid = profile.uid ? String(profile.uid).trim() : '';
  return assignees.some(function(a) {
    const val = String(a || '').toLowerCase().trim();
    return (email && val === email) || (uid && val === uid);
  });
}

function getTaskAssignees_(sheets, taskId) {
  const aData = getSheetData(sheets.taskAssignees);
  const aMap = aData.hMap || {};
  const assignees = [];
  for (let i = 1; i < aData.length; i++) {
    if (aData[i][aMap['task_uid']] === taskId) assignees.push(aData[i][aMap['user_uid']]);
  }
  return assignees;
}

function savePersonalTaskData(taskObj, crewName) {
  return executeWithRetry(() => {
    if (!taskObj || !taskObj.id) {
      throw new Error('🛑 PERMISSION DENIED: Cannot create tasks without global task permission.');
    }
    if (!effectiveBackendPermission(crewName, 'task_manage_personal')) {
      throw new Error('🛑 PERMISSION DENIED: Cannot update tasks.');
    }
    const profile = getUserSecurityProfile(crewName);
    const sheets = verifyDatabaseSchema();
    const assignees = getTaskAssignees_(sheets, taskObj.id);
    if (!actorIsAssignedToTask(profile, assignees)) {
      throw new Error('🛑 PERMISSION DENIED: You are not assigned to this task.');
    }

    const getMap = (sheet) => {
      let data = sheet.getDataRange().getValues();
      let m = {};
      if (data.length > 0) data[0].forEach((h, i) => m[h.toString().trim()] = i);
      return { data: data, map: m };
    };

    let tSheet = getMap(sheets.tasks);
    let rowIndex = -1;
    for (let i = 1; i < tSheet.data.length; i++) {
      if (tSheet.data[i][tSheet.map['uid']] === taskObj.id) { rowIndex = i + 1; break; }
    }
    if (rowIndex < 0) throw new Error('Task not found.');

    if (tSheet.map['Status'] !== undefined) {
      sheets.tasks.getRange(rowIndex, tSheet.map['Status'] + 1).setValue(taskObj.status || 'Pending');
    }

    let tdSheet = getMap(sheets.taskTodos);
    let tdKept = [tdSheet.data[0]];
    for (let i = 1; i < tdSheet.data.length; i++) {
      if (tdSheet.data[i][tdSheet.map['task_uid']] !== taskObj.id) tdKept.push(tdSheet.data[i]);
    }
    sheets.taskTodos.clearContents();
    if (tdKept.length > 0) sheets.taskTodos.getRange(1, 1, tdKept.length, tdKept[0].length).setValues(tdKept);
    if (taskObj.todos && taskObj.todos.length > 0) {
      let newTd = taskObj.todos.map(function(t) {
        let r = new Array(Object.keys(tdSheet.map).length).fill('');
        if (tdSheet.map['uid'] !== undefined) r[tdSheet.map['uid']] = Utilities.getUuid();
        if (tdSheet.map['task_uid'] !== undefined) r[tdSheet.map['task_uid']] = taskObj.id;
        if (tdSheet.map['description'] !== undefined) r[tdSheet.map['description']] = t.text;
        if (tdSheet.map['is_done'] !== undefined) r[tdSheet.map['is_done']] = t.done;
        return r;
      });
      sheets.taskTodos.getRange(sheets.taskTodos.getLastRow() + 1, 1, newTd.length, Object.keys(tdSheet.map).length).setValues(newTd);
    }

    flushCache();
    writeToAuditLog(crewName || 'System', 'UPDATE', 'TASKS', 'PERSONAL', taskObj.id, 'Personal task progress update.');
    return 'Saved';
  });
}

function saveTaskData(taskObj, crewName) {
  return executeWithRetry(() => {
    if (!effectiveBackendPermission(crewName, 'task_manage_global')) {
      return savePersonalTaskData(taskObj, crewName);
    }
    const sheets = verifyDatabaseSchema();
    let isNew = !taskObj.id;
    taskObj.id = taskObj.id || Utilities.getUuid();
    
    const getMap = (sheet) => {
       let data = sheet.getDataRange().getValues();
       let m = {};
       if(data.length>0) data[0].forEach((h,i)=>m[h.toString().trim()]=i);
       return {data, map:m};
    };
    
    let tSheet = getMap(sheets.tasks);
    let rowIndex = -1;
    for (let i = 1; i < tSheet.data.length; i++) {
      if (tSheet.data[i][tSheet.map['uid']] === taskObj.id) { rowIndex = i + 1; break; }
    }
    
    // 1. Save Parent Task (Nullifying JSON strings to prevent legacy duplication)
    let row = new Array(Object.keys(tSheet.map).length).fill("");
    if(tSheet.map['uid'] !== undefined) row[tSheet.map['uid']] = taskObj.id;
    if(tSheet.map['Title'] !== undefined) row[tSheet.map['Title']] = taskObj.title;
    if(tSheet.map['Status'] !== undefined) row[tSheet.map['Status']] = taskObj.status;
    if(tSheet.map['Notes'] !== undefined) row[tSheet.map['Notes']] = taskObj.notes;
    if(tSheet.map['Priority'] !== undefined) row[tSheet.map['Priority']] = taskObj.priority || 'Medium';
    if (rowIndex > -1) sheets.tasks.getRange(rowIndex, 1, 1, row.length).setValues([row]);
    else sheets.tasks.appendRow(row);
    
    // 2. Wipe & Insert Assignees (Junction)
    let aSheet = getMap(sheets.taskAssignees);
    let aKept = [aSheet.data[0]];
    for(let i=1; i<aSheet.data.length; i++) { if(aSheet.data[i][aSheet.map['task_uid']] !== taskObj.id) aKept.push(aSheet.data[i]); }
    sheets.taskAssignees.clearContents();
    if(aKept.length > 0) sheets.taskAssignees.getRange(1, 1, aKept.length, aKept[0].length).setValues(aKept);
    if(taskObj.assignees && taskObj.assignees.length > 0) {
        let newA = taskObj.assignees.map(u => {
            let r = new Array(Object.keys(aSheet.map).length).fill("");
            if(aSheet.map['uid'] !== undefined) r[aSheet.map['uid']] = Utilities.getUuid();
            if(aSheet.map['task_uid'] !== undefined) r[aSheet.map['task_uid']] = taskObj.id;
            if(aSheet.map['user_uid'] !== undefined) r[aSheet.map['user_uid']] = u;
            return r;
        });
        sheets.taskAssignees.getRange(sheets.taskAssignees.getLastRow() + 1, 1, newA.length, Object.keys(aSheet.map).length).setValues(newA);
    }
    
    // 3. Wipe & Insert Todos (Child)
    let tdSheet = getMap(sheets.taskTodos);
    let tdKept = [tdSheet.data[0]];
    for(let i=1; i<tdSheet.data.length; i++) { if(tdSheet.data[i][tdSheet.map['task_uid']] !== taskObj.id) tdKept.push(tdSheet.data[i]); }
    sheets.taskTodos.clearContents();
    if(tdKept.length > 0) sheets.taskTodos.getRange(1, 1, tdKept.length, tdKept[0].length).setValues(tdKept);
    if(taskObj.todos && taskObj.todos.length > 0) {
        let newTd = taskObj.todos.map(t => {
            let r = new Array(Object.keys(tdSheet.map).length).fill("");
            if(tdSheet.map['uid'] !== undefined) r[tdSheet.map['uid']] = Utilities.getUuid();
            if(tdSheet.map['task_uid'] !== undefined) r[tdSheet.map['task_uid']] = taskObj.id;
            if(tdSheet.map['description'] !== undefined) r[tdSheet.map['description']] = t.text;
            if(tdSheet.map['is_done'] !== undefined) r[tdSheet.map['is_done']] = t.done;
            return r;
        });
        sheets.taskTodos.getRange(sheets.taskTodos.getLastRow() + 1, 1, newTd.length, Object.keys(tdSheet.map).length).setValues(newTd);
    }
    
    // 4. Wipe & Insert Assets (Junction)
    let asSheet = getMap(sheets.taskAssets);
    let asKept = [asSheet.data[0]];
    for(let i=1; i<asSheet.data.length; i++) { if(asSheet.data[i][asSheet.map['task_uid']] !== taskObj.id) asKept.push(asSheet.data[i]); }
    sheets.taskAssets.clearContents();
    if(asKept.length > 0) sheets.taskAssets.getRange(1, 1, asKept.length, asKept[0].length).setValues(asKept);
    if(taskObj.assets && taskObj.assets.length > 0) {
        let newAs = taskObj.assets.map(a => {
            let r = new Array(Object.keys(asSheet.map).length).fill("");
            if(asSheet.map['uid'] !== undefined) r[asSheet.map['uid']] = Utilities.getUuid();
            if(asSheet.map['task_uid'] !== undefined) r[asSheet.map['task_uid']] = taskObj.id;
            if(asSheet.map['asset_uid'] !== undefined) r[asSheet.map['asset_uid']] = a.id || a;
            return r;
        });
        sheets.taskAssets.getRange(sheets.taskAssets.getLastRow() + 1, 1, newAs.length, Object.keys(asSheet.map).length).setValues(newAs);
    }
    
    if (isNew && taskObj.assignees && taskObj.assignees.length > 0) {
        let nSheet = getMap(sheets.notifs);
        taskObj.assignees.forEach(email => {
            let r = new Array(Object.keys(nSheet.map).length).fill("");
            if(nSheet.map['uid'] !== undefined) r[nSheet.map['uid']] = Utilities.getUuid();
            if(nSheet.map['user_uid'] !== undefined) r[nSheet.map['user_uid']] = email;
            if(nSheet.map['Message'] !== undefined) r[nSheet.map['Message']] = `You were assigned to task: ${taskObj.title}`;
            if(nSheet.map['Is_Read'] !== undefined) r[nSheet.map['Is_Read']] = false;
            if(nSheet.map['Timestamp'] !== undefined) r[nSheet.map['Timestamp']] = new Date().toISOString();
            sheets.notifs.appendRow(r);
        });
    }
    flushCache();
    writeToAuditLog(crewName || "System", isNew ? "CREATE" : "UPDATE", "TASKS", "GLOBAL", taskObj.id, `Saved task with ${taskObj.todos ? taskObj.todos.length : 0} to-dos and ${taskObj.assets ? taskObj.assets.length : 0} assets.`);
    return "Saved";
  });
}

function deleteTaskData(taskId, actor = "System UI") {
  return executeWithRetry(() => {
    assertActorCanManageGlobalTasks(actor);
    const sheets = verifyDatabaseSchema();
    
    const wipeFromSheet = (sheet, colName) => {
        let data = sheet.getDataRange().getValues();
        let map = {};
        if(data.length > 0) data[0].forEach((h, i) => map[h.toString().trim()] = i);
        if(data.length <= 1 || map[colName] === undefined) return;
        let colIdx = map[colName];
        
        let keptRows = [data[0]];
        for (let i=1; i<data.length; i++) { if (data[i][colIdx] !== taskId) keptRows.push(data[i]); }
        sheet.clearContents();
        if(keptRows.length > 0) sheet.getRange(1, 1, keptRows.length, keptRows[0].length).setValues(keptRows);
    };
    
    let tData = sheets.tasks.getDataRange().getValues();
    let tMap = {}; if(tData.length>0) tData[0].forEach((h,i)=>tMap[h.toString().trim()]=i);
    let taskTitle = "Unknown Task";
    for(let i=1; i<tData.length; i++) {
        if(tData[i][tMap['uid']] === taskId) {
            taskTitle = tData[i][tMap['Title']];
            break;
        }
    }
    
    let aData = sheets.taskAssignees.getDataRange().getValues();
    let aMap = {}; if(aData.length>0) aData[0].forEach((h,i)=>aMap[h.toString().trim()]=i);
    let oldAssignees = [];
    for(let i=1; i<aData.length; i++) {
        if(aData[i][aMap['task_uid']] === taskId) {
            oldAssignees.push(aData[i][aMap['user_uid']]);
        }
    }

    wipeFromSheet(sheets.tasks, 'uid');
    wipeFromSheet(sheets.taskAssignees, 'task_uid');
    wipeFromSheet(sheets.taskTodos, 'task_uid');
    wipeFromSheet(sheets.taskAssets, 'task_uid');
    
    if (oldAssignees.length > 0) {
        let nData = sheets.notifs.getDataRange().getValues();
        let nMap = {}; if(nData.length>0) nData[0].forEach((h,i)=>nMap[h.toString().trim()]=i);
        let nowIso = new Date().toISOString();
        oldAssignees.forEach(email => {
            let r = new Array(nData[0].length).fill("");
            if(nMap['uid'] !== undefined) r[nMap['uid']] = Utilities.getUuid();
            if(nMap['user_uid'] !== undefined) r[nMap['user_uid']] = email;
            if(nMap['Message'] !== undefined) r[nMap['Message']] = `🗑️ Task deleted: ${taskTitle}`;
            if(nMap['Is_Read'] !== undefined) r[nMap['Is_Read']] = false;
            if(nMap['Timestamp'] !== undefined) r[nMap['Timestamp']] = nowIso;
            sheets.notifs.appendRow(r);
        });
    }

    flushCache();
    writeToAuditLog(actor, "DELETE", "TASKS", "GLOBAL", taskId, "Permanently deleted task and all references.");
    return "Deleted";
  });
}

function deleteNotification(id, actor = "System UI") {
  return executeWithRetry(() => {
    const sheets = verifyDatabaseSchema();
    let data = sheets.notifs.getDataRange().getValues();
    let kept = [data[0]];
    for(let i=1; i<data.length; i++) { if(data[i][0] !== id) kept.push(data[i]); }
    sheets.notifs.clearContents();
    if(kept.length > 0) sheets.notifs.getRange(1, 1, kept.length, kept[0].length).setValues(kept);
    flushCache();
    writeToAuditLog(actor, "DELETE", "NOTIFICATIONS", "GLOBAL", id, "Deleted individual notification.");
  });
}

function postponeNotification(id, actor = "System UI") {
  return executeWithRetry(() => {
    const sheets = verifyDatabaseSchema();
    let data = sheets.notifs.getDataRange().getValues();
    for(let i=1; i<data.length; i++) {
      if(data[i][0] === id) {
         data[i][3] = false; // Mark Unread
         let future = new Date(Date.now() + 86400000); // 24 hours into the future
         data[i][4] = future.toISOString();
         sheets.notifs.getRange(i+1, 1, 1, data[i].length).setValues([data[i]]);
         break;
      }
    }
    flushCache();
    writeToAuditLog(actor, "UPDATE", "NOTIFICATIONS", "GLOBAL", id, "Postponed notification by 24 hours.");
  });
}

function clearAllNotifications(crewName) {
  return executeWithRetry(() => {
    const profile = getUserSecurityProfile(crewName);
    if(!profile.uid) return;
    const sheets = verifyDatabaseSchema();
    let data = sheets.notifs.getDataRange().getValues();
    let kept = [data[0]];
    for(let i=1; i<data.length; i++) { if(data[i][1] !== profile.uid) kept.push(data[i]); }
    sheets.notifs.clearContents();
    if(kept.length > 0) sheets.notifs.getRange(1, 1, kept.length, kept[0].length).setValues(kept);
    flushCache();
    writeToAuditLog(crewName || "System UI", "DELETE", "NOTIFICATIONS", "GLOBAL", "ALL", "Cleared all notifications for user.");
  });
}

function markNotificationsRead(crewName) {
  return executeWithRetry(() => {
    const profile = getUserSecurityProfile(crewName);
    if(!profile.uid) return "No UID";
    const sheets = verifyDatabaseSchema();
    let data = sheets.notifs.getDataRange().getValues();
    let updated = false;
            let keptRows = [data[0]];
            let now = new Date().getTime();
            
    for (let i=1; i<data.length; i++) {
               let isRead = data[i][3];
               let ts = new Date(data[i][4]).getTime();
               
               // Prune old read notifications from the Database entirely to keep it clean
               if (isRead && (now - ts > 86400000)) {
                   updated = true;
                   continue;
               }
               
       if (data[i][1] === profile.uid && data[i][3] === false) {
           data[i][3] = true;
           updated = true;
       }
               keptRows.push(data[i]);
    }
            if(updated) {
                sheets.notifs.clearContents();
                if (keptRows.length > 0) sheets.notifs.getRange(1, 1, keptRows.length, keptRows[0].length).setValues(keptRows);
            }
    flushCache();
    writeToAuditLog(crewName || "System UI", "UPDATE", "NOTIFICATIONS", "GLOBAL", "ALL", "Marked all active notifications as read.");
    return "Cleared";
  });
}

function markSingleNotifRead(id) {
  return executeWithRetry(() => {
    const sheets = verifyDatabaseSchema();
    let data = sheets.notifs.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
       if (data[i][0] === id) {
           data[i][3] = true;
           sheets.notifs.getRange(i + 1, 1, 1, data[i].length).setValues([data[i]]);
           break;
       }
    }
    if (typeof flushCache !== 'undefined') flushCache();
    // Purposely not logging every single read action to audit log to prevent spam
    return "Read";
  });
}

// ==========================================
// --- AUTOMATED WEATHER DISPATCHER ---
// ==========================================

function dispatchWeatherAlerts(projectId, projectName, warningsArray) {
  return executeWithRetry(() => {
    const sheets = verifyDatabaseSchema();
    
    let shiftData = sheets.shifts.getDataRange().getValues();
    let sMap = {}; if(shiftData.length > 0) shiftData[0].forEach((h,i)=>sMap[h.toString().trim()]=i);
    
    let assignedEmails = new Set();
    for (let i = 1; i < shiftData.length; i++) {
        if (shiftData[i][sMap['project_uid']] === projectId) {
            let status = String(shiftData[i][sMap['status']] || '').toUpperCase();
            if (status !== 'CANCELLED' && status !== 'TRASHED') {
                assignedEmails.add(shiftData[i][sMap['email']]);
            }
        }
    }
    if (assignedEmails.size === 0) return "No crew assigned";
    
    let warningText = warningsArray.join(" | ");
    let msg = `🌦️ WEATHER ALERT for ${projectName}: ${warningText}`;
    
    let notifData = sheets.notifs.getDataRange().getValues();
    let nMap = {}; if(notifData.length>0) notifData[0].forEach((h,i)=>nMap[h.toString().trim()]=i);
    
    let nowIso = new Date().toISOString();
    let alreadySentEmails = new Set();
    let todayStr = nowIso.split('T')[0];
    
    // Anti-spam: prevent sending the exact same warning to the same user on the same day
    for (let i = Math.max(1, notifData.length - 500); i < notifData.length; i++) {
        let ts = String(notifData[i][nMap['Timestamp']] || '');
        if (ts.startsWith(todayStr)) {
            let dbMsg = String(notifData[i][nMap['Message']] || '');
            if (dbMsg === msg) alreadySentEmails.add(notifData[i][nMap['user_uid']]);
        }
    }
    
    let newRows = [];
    assignedEmails.forEach(email => {
        if (!alreadySentEmails.has(email)) {
            let r = new Array(notifData[0].length).fill("");
            if(nMap['uid'] !== undefined) r[nMap['uid']] = Utilities.getUuid();
            if(nMap['user_uid'] !== undefined) r[nMap['user_uid']] = email;
            if(nMap['Message'] !== undefined) r[nMap['Message']] = msg;
            if(nMap['Is_Read'] !== undefined) r[nMap['Is_Read']] = false;
            if(nMap['Timestamp'] !== undefined) r[nMap['Timestamp']] = nowIso;
            newRows.push(r);
        }
    });
    
    if (newRows.length > 0) {
        sheets.notifs.getRange(notifData.length + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
        flushCache();
        writeToAuditLog("System Engine", "UPDATE", "NOTIFICATIONS", projectId, "Weather Engine", `Dispatched ${newRows.length} weather alerts.`);
    }
    return `Alerts sent to ${newRows.length} crew members.`;
  });
}
