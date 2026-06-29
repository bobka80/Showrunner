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
    const sheets = verifyDatabaseSchema(true);
    
    let tasks = [];
    let tData = getSheetData(sheets.tasks);
    let aData = getSheetData(sheets.taskAssignees);
    let tdData = getSheetData(sheets.taskTodos);
    let asData = getSheetData(sheets.taskAssets);
    const canGlobalTasks = canViewAllGlobalTasks_(crewName);
    
    for(let i=1; i<tData.length; i++) {
        let taskId = tData[i][tData.hMap['uid']];
        if(!taskId) continue;
        
        let assignees = [];
        for(let a=1; a<aData.length; a++) { if(aData[a][aData.hMap['task_uid']] === taskId) assignees.push(aData[a][aData.hMap['user_uid']]); }

        if (!canGlobalTasks && !actorIsAssignedToTask(profile, assignees, crewName)) continue;
        
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
        let rowUser = nData[i][nData.hMap['user_uid']];
        if (!notifBelongsToProfile_(rowUser, profile, crewName)) continue;
        let isRead = isSheetTruthy_(nData[i][nData.hMap['Is_Read']]);
        let ts = new Date(nData[i][nData.hMap['Timestamp']]).getTime();

        if (isRead && (now - ts > 86400000)) continue;

        notifs.push({
            id: nData[i][nData.hMap['uid']],
            message: nData[i][nData.hMap['Message']],
            isRead: isRead,
            timestamp: nData[i][nData.hMap['Timestamp']],
            linkType: nData.hMap['Link_Type'] !== undefined ? String(nData[i][nData.hMap['Link_Type']] || '').trim() : '',
            linkId: nData.hMap['Link_Id'] !== undefined ? String(nData[i][nData.hMap['Link_Id']] || '').trim() : ''
        });
    }
    
    notifs.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
    return { tasks: tasks, notifs: notifs };
  });
}

function actorIsAssignedToTask(profile, assignees, crewName) {
  if (!profile || !assignees || !assignees.length) return false;
  return assignees.some(function(a) {
    return identifierMatchesProfile_(a, profile, crewName);
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
    if (!actorIsAssignedToTask(profile, assignees, crewName)) {
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
            if(aSheet.map['user_uid'] !== undefined) r[aSheet.map['user_uid']] = normalizeTaskAssigneeId_(u);
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
        taskObj.assignees.forEach(function(assignee) {
            appendInAppNotification_(sheets.notifs, assignee, 'You were assigned to task: ' + taskObj.title, 'task', taskObj.id);
        });
        try {
            dispatchPushToIdentifiers(
                taskObj.assignees,
                'New task assigned',
                taskObj.title || 'You have a new task',
                getShowrunnerHostingLink_(),
                crewName
            );
        } catch (pushErr) { /* in-app notifs saved */ }
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
        oldAssignees.forEach(function(assignee) {
            appendInAppNotification_(sheets.notifs, assignee, '🗑️ Task deleted: ' + taskTitle);
        });
        try {
            dispatchPushToIdentifiers(
                oldAssignees,
                'Task removed',
                'Task deleted: ' + taskTitle,
                getShowrunnerHostingLink_(),
                actor
            );
        } catch (pushErr) { /* in-app notifs saved */ }
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
    if (data.length <= 1) return 'Deleted';
    const nMap = getHeaderMap(data);
    const idCol = nMap['uid'] !== undefined ? nMap['uid'] : 0;
    let kept = [data[0]];
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idCol]) !== String(id)) kept.push(data[i]);
    }
    sheets.notifs.clearContents();
    if (kept.length > 0) sheets.notifs.getRange(1, 1, kept.length, kept[0].length).setValues(kept);
    try { SpreadsheetApp.flush(); } catch (e) { /* ignore */ }
    flushCache();
    writeToAuditLog(actor, "DELETE", "NOTIFICATIONS", "GLOBAL", id, "Deleted individual notification.");
    return 'Deleted';
  });
}

function postponeNotification(id, actor = "System UI") {
  return executeWithRetry(() => {
    const sheets = verifyDatabaseSchema();
    let data = sheets.notifs.getDataRange().getValues();
    const nMap = getHeaderMap(data);
    const idCol = nMap['uid'] !== undefined ? nMap['uid'] : 0;
    const readCol = nMap['Is_Read'] !== undefined ? nMap['Is_Read'] : 3;
    const tsCol = nMap['Timestamp'] !== undefined ? nMap['Timestamp'] : 4;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idCol]) === String(id)) {
        data[i][readCol] = false;
        data[i][tsCol] = new Date(Date.now() + 86400000).toISOString();
        sheets.notifs.getRange(i + 1, 1, 1, data[i].length).setValues([data[i]]);
        try { SpreadsheetApp.flush(); } catch (e) { /* ignore */ }
        break;
      }
    }
    flushCache();
    writeToAuditLog(actor, "UPDATE", "NOTIFICATIONS", "GLOBAL", id, "Postponed notification by 24 hours.");
    return 'Postponed';
  });
}

function clearAllNotifications(crewName) {
  return executeWithRetry(() => {
    const profile = getUserSecurityProfile(crewName);
    const sheets = verifyDatabaseSchema();
    let data = sheets.notifs.getDataRange().getValues();
    if (data.length <= 1) return 'Cleared';
    const nMap = getHeaderMap(data);
    const userCol = nMap['user_uid'] !== undefined ? nMap['user_uid'] : 1;
    let kept = [data[0]];
    for (let i = 1; i < data.length; i++) {
      if (!notifBelongsToProfile_(data[i][userCol], profile, crewName)) kept.push(data[i]);
    }
    sheets.notifs.clearContents();
    if (kept.length > 0) sheets.notifs.getRange(1, 1, kept.length, kept[0].length).setValues(kept);
    try { SpreadsheetApp.flush(); } catch (e) { /* ignore */ }
    flushCache();
    writeToAuditLog(crewName || "System UI", "DELETE", "NOTIFICATIONS", "GLOBAL", "ALL", "Cleared all notifications for user.");
    return 'Cleared';
  });
}

function markNotificationsRead(crewName) {
  return executeWithRetry(() => {
    const profile = getUserSecurityProfile(crewName);
    const sheets = verifyDatabaseSchema();
    let data = sheets.notifs.getDataRange().getValues();
    if (data.length <= 1) return 'Cleared';
    const nMap = getHeaderMap(data);
    const userCol = nMap['user_uid'] !== undefined ? nMap['user_uid'] : 1;
    const readCol = nMap['Is_Read'] !== undefined ? nMap['Is_Read'] : 3;
    const tsCol = nMap['Timestamp'] !== undefined ? nMap['Timestamp'] : 4;
    let updated = false;
    let keptRows = [data[0]];
    let now = new Date().getTime();

    for (let i = 1; i < data.length; i++) {
      let isRead = isSheetTruthy_(data[i][readCol]);
      let ts = new Date(data[i][tsCol]).getTime();

      if (isRead && (now - ts > 86400000)) {
        updated = true;
        continue;
      }

      if (notifBelongsToProfile_(data[i][userCol], profile, crewName) && !isSheetTruthy_(data[i][readCol])) {
        data[i][readCol] = true;
        updated = true;
      }
      keptRows.push(data[i]);
    }
    if (updated) {
      sheets.notifs.clearContents();
      if (keptRows.length > 0) sheets.notifs.getRange(1, 1, keptRows.length, keptRows[0].length).setValues(keptRows);
      try { SpreadsheetApp.flush(); } catch (e) { /* ignore */ }
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
    const nMap = getHeaderMap(data);
    const idCol = nMap['uid'] !== undefined ? nMap['uid'] : 0;
    const readCol = nMap['Is_Read'] !== undefined ? nMap['Is_Read'] : 3;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idCol]) === String(id)) {
        data[i][readCol] = true;
        sheets.notifs.getRange(i + 1, 1, 1, data[i].length).setValues([data[i]]);
        try { SpreadsheetApp.flush(); } catch (e) { /* ignore */ }
        break;
      }
    }
    flushCache();
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
    
    let assignedIds = new Set();
    for (let i = 1; i < shiftData.length; i++) {
        if (shiftData[i][sMap['project_uid']] === projectId) {
            let crewId = shiftData[i][sMap['user_uid']];
            if (crewId && !isTruckShiftIdentifier_(crewId)) assignedIds.add(crewId);
        }
    }
    if (assignedIds.size === 0) return "No crew assigned";

    let warningText = warningsArray.join(" | ");
    let msg = '🌦️ WEATHER ALERT for ' + projectName + ': ' + warningText;

    let notifData = sheets.notifs.getDataRange().getValues();
    let nMap = {};
    if (notifData.length > 0) notifData[0].forEach(function(h, i) { nMap[h.toString().trim()] = i; });

    let nowIso = new Date().toISOString();
    let alreadySentUids = new Set();
    let todayStr = nowIso.split('T')[0];

    for (let i = Math.max(1, notifData.length - 500); i < notifData.length; i++) {
        let ts = String(notifData[i][nMap['Timestamp']] || '');
        if (ts.startsWith(todayStr)) {
            let dbMsg = String(notifData[i][nMap['Message']] || '');
            if (dbMsg === msg) {
                alreadySentUids.add(resolveNotifUserUid_(notifData[i][nMap['user_uid']]));
            }
        }
    }

    let pushRecipients = [];
    assignedIds.forEach(function(crewId) {
        let normUid = resolveNotifUserUid_(crewId);
        if (alreadySentUids.has(normUid)) return;
        appendInAppNotification_(sheets.notifs, crewId, msg, 'project', projectId);
        pushRecipients.push(crewId);
    });

    if (pushRecipients.length > 0) {
        flushCache();
        writeToAuditLog("System Engine", "UPDATE", "NOTIFICATIONS", projectId, "Weather Engine", 'Dispatched ' + pushRecipients.length + ' weather alerts.');
        try {
            dispatchPushToIdentifiers(
                pushRecipients,
                'Weather alert',
                projectName + ': ' + warningText,
                getShowrunnerHostingLink_(),
                'System Engine'
            );
        } catch (pushErr) { /* in-app notifs saved */ }
    }
    return 'Alerts sent to ' + pushRecipients.length + ' crew members.';
  });
}
