/**
 * SM Showrunner (smuruner) - Clean 8 Architecture
 * Logistics_Projects.js - Project Lifecycle & CRUD Operations
 */

// ==========================================
// --- CRUD: PROJECTS & TIMELINES ---
// ==========================================
// @INDEX: CRUD_PROJECTS -> Project & Checklists Save
function saveProjectData(projectData, timelinesArray, actor = "System UI") {
  return executeWithRetry(() => {
    projectData = enforceCrossRentOnlyProjectFields_(actor, projectData || {});
    const sheets = verifyDatabaseSchema();
    const projectId = projectData.Project_ID || Utilities.getUuid();
    const isNewProject = !projectData.Project_ID;
    let newTimestamp = new Date().toISOString();
    let resolvedProjectId = projectId;
    let mergedFromDuplicate = false;
    
    // 1. UPSERT PARENT (Projects_Index)
    let indexData = sheets.index.getDataRange().getValues();
    let iCols = indexData.length > 0 ? indexData[0].length : 8;
    let iMap = {};
    if(indexData.length > 0) indexData[0].forEach((h,i)=>iMap[h.toString().trim()]=i);
    let rowIndex = -1;
    let existingState = ""; // Deprecated JSON State
    let existingReadiness = "{}";
    
    // --- ANTI-DUPLICATION ENGINE (NEW PROJECTS) ---
    // Double-submit guard: reuse the row created in the last 60s, but still save timelines.
    if (isNewProject) {
        let targetName = String(projectData.Project_Name || "Unnamed Event").toLowerCase().trim();
        let nowEpoch = new Date().getTime();
        for (let i = 1; i < indexData.length; i++) {
            let dbName = String(indexData[i][iMap['Project_Name']] || "").toLowerCase().trim();
            if (dbName === targetName) {
                let dbTime = new Date(indexData[i][iMap['Last_Updated']]).getTime();
                if (nowEpoch - dbTime < 60000) {
                    resolvedProjectId = indexData[i][iMap['uid']];
                    mergedFromDuplicate = true;
                    break;
                }
            }
        }
    }
    // ----------------------------------------------

    // Find the row and perform concurrency check
    let existingDbName = "";
    let existingDbStatus = "";
    for (let i = 1; i < indexData.length; i++) {
      if (indexData[i][iMap['uid']] === resolvedProjectId) {
          if (!isNewProject && !mergedFromDuplicate && iMap['Last_Updated'] !== undefined) {
              let dbTimestamp = indexData[i][iMap['Last_Updated']];
              let clientTimestamp = projectData.Last_Updated;
              if (dbTimestamp && clientTimestamp) {
                  let t1 = new Date(dbTimestamp).getTime();
                  let t2 = new Date(clientTimestamp).getTime();
                  if (Math.abs(t1 - t2) > 2000) {
                      throw new Error("COLLISION_DETECTED: This project was modified by another user. Please refresh and try again.");
                  }
              }
          }
          if (iMap['Project_Name'] !== undefined) existingDbName = String(indexData[i][iMap['Project_Name']] || "");
          if (iMap['Status'] !== undefined) existingDbStatus = String(indexData[i][iMap['Status']] || "");
          rowIndex = i + 1;
          if (iMap['Checklist_State'] !== undefined) existingState = indexData[i][iMap['Checklist_State']];
          if (iMap['Readiness_State'] !== undefined) existingReadiness = indexData[i][iMap['Readiness_State']];
          break;
      }
    }

    if (!isNewProject && !verifyBackendPrivilege(actor, 'MANAGER')) {
      projectData.Project_Name = existingDbName || projectData.Project_Name;
      projectData.Status = existingDbStatus || projectData.Status;
    }
    
    let rowContent = new Array(iCols).fill("");
    if(iMap['uid'] !== undefined) rowContent[iMap['uid']] = resolvedProjectId;
    if(iMap['Project_Name'] !== undefined) rowContent[iMap['Project_Name']] = projectData.Project_Name || "Unnamed Event";
    if(iMap['Client'] !== undefined) rowContent[iMap['Client']] = projectData.Client || "";
    if(iMap['Status'] !== undefined) rowContent[iMap['Status']] = projectData.Status || "Draft";
    if(iMap['Folder_ID'] !== undefined) rowContent[iMap['Folder_ID']] = projectData.Folder_ID || "";
    if(iMap['Manager_Email'] !== undefined) rowContent[iMap['Manager_Email']] = projectData.Manager_Email || "";
    if(iMap['Project_Type'] !== undefined) rowContent[iMap['Project_Type']] = projectData.Type || "Event";
    if(iMap['Checklist_State'] !== undefined) rowContent[iMap['Checklist_State']] = existingState;
    if(iMap['Last_Updated'] !== undefined) rowContent[iMap['Last_Updated']] = newTimestamp;
    if(iMap['Readiness_State'] !== undefined) rowContent[iMap['Readiness_State']] = projectData.Readiness_State || existingReadiness;
    if(iMap['Location_URL'] !== undefined) rowContent[iMap['Location_URL']] = projectData.Location_URL || "";
    if(iMap['Difficulty_Multiplier'] !== undefined) rowContent[iMap['Difficulty_Multiplier']] = projectData.Difficulty_Multiplier || 1.0;
    
    if (rowIndex > -1) {
      sheets.index.getRange(rowIndex, 1, 1, rowContent.length).setValues([rowContent]);
    } else {
      sheets.index.appendRow(rowContent);
    }
    
    // 2. SYNC FRAGMENTED CHILDREN (Project_Timelines)
    let timelineData = sheets.timelines.getDataRange().getValues();
    let tCols = timelineData.length > 0 ? timelineData[0].length : 7;
    let tMap = {};
    if(timelineData.length > 0) timelineData[0].forEach((h,i)=>tMap[h.toString().trim()]=i);
    let tPidCol = tMap['project_uid'] !== undefined ? tMap['project_uid'] : tMap['Project_ID'];
    let keptRows = [timelineData[0]];
    
    // Identify existing rows for this project to wipe them (Swiss Cheese Sync)
    for (let i = 1; i < timelineData.length; i++) {
      let rowPid = (tPidCol !== undefined) ? timelineData[i][tPidCol] : timelineData[i][1];
      if (rowPid !== resolvedProjectId) keptRows.push(timelineData[i]);
    }
    sheets.timelines.clearContents();
    if (keptRows.length > 0) sheets.timelines.getRange(1, 1, keptRows.length, keptRows[0].length).setValues(keptRows);
    
    // Inject new fragmented rows
    if (timelinesArray && timelinesArray.length > 0) {
      let newRows = timelinesArray.map(t => {
        let r = new Array(tCols).fill("");
        if(tMap['uid'] !== undefined) r[tMap['uid']] = t.uid || t.id || Utilities.getUuid();
        if(tPidCol !== undefined) r[tPidCol] = resolvedProjectId;
        else if (r.length > 1) r[1] = resolvedProjectId;
        if(tMap['Sub_Event_Type'] !== undefined) r[tMap['Sub_Event_Type']] = t.Sub_Event_Type || "MAIN";
        if(tMap['Event_Date'] !== undefined) r[tMap['Event_Date']] = t.Event_Date || "";
        if(tMap['Start_Time'] !== undefined) r[tMap['Start_Time']] = t.Start_Time ? `'${t.Start_Time}` : "";
        if(tMap['End_Time'] !== undefined) r[tMap['End_Time']] = t.End_Time ? `'${t.End_Time}` : "";
        if(tMap['Note'] !== undefined) r[tMap['Note']] = t.Note || "";
        return r;
      });
      sheets.timelines.getRange(keptRows.length + 1, 1, newRows.length, tCols).setValues(newRows);
    }
    
    if (typeof flushCache !== 'undefined') flushCache();
    SpreadsheetApp.flush();
    let actionLabel = (isNewProject && !mergedFromDuplicate) ? "CREATE" : "UPDATE";
    writeToAuditLog(actor, actionLabel, "PROJECTS", resolvedProjectId, resolvedProjectId, `Saved project data & ${timelinesArray ? timelinesArray.length : 0} timeline fragment(s).`);
    return JSON.stringify({ id: resolvedProjectId, timestamp: newTimestamp });
  });
}

function updateProjectFolderId(projectId, folderId) {
  return executeWithRetry(() => {
    const sheets = verifyDatabaseSchema();
    let indexData = sheets.index.getDataRange().getValues();
    let map = {};
    if(indexData.length > 0) indexData[0].forEach((h,i)=>map[h.toString().trim()]=i);
    for (let i = 1; i < indexData.length; i++) {
      if (indexData[i][map['uid']] === projectId) {
        sheets.index.getRange(i + 1, map['Folder_ID'] + 1).setValue(folderId); 
        break;
      }
    }
    if (typeof flushCache !== 'undefined') flushCache();
  });
}

// ==========================================
// --- CORE UI API CONTROLLERS (NATIVE DB) ---
// ==========================================

function getExistingProjects() {
  const sheets = verifyDatabaseSchema(true);
  const timelineData = getSheetData(sheets.timelines);
  const indexData = getSheetData(sheets.index);
  const checkData = getSheetData(sheets.projectChecklists);
  let tMap = timelineData.hMap;
  let iMap = indexData.hMap;
  let cMap = checkData.hMap;
  
  let projectMap = {};
  
  // 1. Map Parent Projects from the Index
  for (let i = 1; i < indexData.length; i++) {
    let pId = indexData[i][iMap['uid']];
    if (!pId || pId === "uid") continue; // Skip headers/empty rows

    projectMap[pId] = {
      id: pId, 
      title: indexData[i][iMap['Project_Name']], 
      fullTitle: indexData[i][iMap['Project_Name']], 
      folderId: indexData[i][iMap['Folder_ID']],
      status: indexData[i][iMap['Status']],
      lastUpdated: indexData[i][iMap['Last_Updated']] || null,
      type: indexData[i][iMap['Project_Type']] || "Event",
      locationUrl: indexData[i][iMap['Location_URL']] || "",
      difficultyMultiplier: parseFloat(indexData[i][iMap['Difficulty_Multiplier']]) || 1.0,
      checklistState: {},
      readinessState: {},
      start: null, end: null, fragments: [],
      dalPrepFork: false,
      dalTimelineFork: false
    };
    
    try { if (indexData[i][iMap['Readiness_State']]) projectMap[pId].readinessState = JSON.parse(indexData[i][iMap['Readiness_State']]); } catch(e) {}
    // Calendar chrome: orange/blue fork dots (read-only session columns; no open/close side effects)
    try {
      var prepSt = (iMap['Dal_Prep_Session_Status'] !== undefined)
        ? String(indexData[i][iMap['Dal_Prep_Session_Status']] || '') : '';
      var tlSt = (iMap['Dal_Timeline_Session_Status'] !== undefined)
        ? String(indexData[i][iMap['Dal_Timeline_Session_Status']] || '') : '';
      var liveFn = (typeof dalStatusIsForkLive_ === 'function') ? dalStatusIsForkLive_ : null;
      projectMap[pId].dalPrepFork = liveFn
        ? liveFn(prepSt)
        : (prepSt.toLowerCase() === 'open' || prepSt.toLowerCase() === 'opening' || prepSt.toLowerCase() === 'committing');
      projectMap[pId].dalTimelineFork = liveFn
        ? liveFn(tlSt)
        : (tlSt.toLowerCase() === 'open' || tlSt.toLowerCase() === 'opening' || tlSt.toLowerCase() === 'committing');
      projectMap[pId].dalPrepForkCommitting = String(prepSt).toLowerCase() === 'committing';
      projectMap[pId].dalTimelineForkCommitting = String(tlSt).toLowerCase() === 'committing';
    } catch (eFork) { /* ignore */ }
  }
  
  // 1.5 Map Relational Checklists
  for (let i = 1; i < checkData.length; i++) {
    let pId = checkData[i][cMap['project_uid']];
    if (projectMap[pId]) {
        projectMap[pId].checklistState[checkData[i][cMap['task_name']]] = {
            checked: (checkData[i][cMap['is_checked']] === true || checkData[i][cMap['is_checked']] === 'true' || checkData[i][cMap['is_checked']] === 1),
            copiedFileId: checkData[i][cMap['copied_file_id']] || ""
        };
    }
  }
  
  // 2. Evaluate "Swiss Cheese" Fragments
  for (let i = 1; i < timelineData.length; i++) {
    let pId = timelineData[i][tMap['project_uid']];
    let type = timelineData[i][tMap['Sub_Event_Type']];
    let rawDate = timelineData[i][tMap['Event_Date']];
    
    const extractTime = (val) => {
        if (val === undefined || val === null || val === "") return "";
        if (val instanceof Date) return ("0" + val.getHours()).slice(-2) + ":" + ("0" + val.getMinutes()).slice(-2);
        if (typeof val === 'number') {
            let totalMinutes = Math.round(val * 24 * 60);
            let h = Math.floor(totalMinutes / 60);
            let m = totalMinutes % 60;
            return ("0" + h).slice(-2) + ":" + ("0" + m).slice(-2);
        }
        let s = String(val).trim();
        let m = s.match(/(\d{1,2}):(\d{2})/);
        if (m) return ("0" + m[1]).slice(-2) + ":" + m[2];
        return s;
    };
    
    let startTime = extractTime(timelineData[i][tMap['Start_Time']]);
    let endTime = extractTime(timelineData[i][tMap['End_Time']]);
    let note = timelineData[i][tMap['Note']] || "";
    
    if (projectMap[pId] && rawDate) {
      let p = projectMap[pId];
      // SURGICAL FIX: Force YYYY-MM-DD formatting to prevent Google Sheets Date Object crashes
      let eDate = "";
      
      if (rawDate instanceof Date) {
         if (isNaN(rawDate.getTime())) continue; // Skip invalid dates
         let y = rawDate.getFullYear();
         let m = String(rawDate.getMonth() + 1).padStart(2, '0');
         let d = String(rawDate.getDate()).padStart(2, '0');
         eDate = `${y}-${m}-${d}`;
      } else {
         // SURGICAL FIX: Robust string parsing to prevent undefined/empty string crashes
         let dateStr = String(rawDate).trim();
         if (!dateStr || dateStr === "undefined" || dateStr === "null") continue;
         
         let isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
         if (isoMatch) {
             eDate = isoMatch[0];
         } else {
             let dObj = new Date(dateStr);
             if (!isNaN(dObj.getTime())) {
                 let y = dObj.getFullYear();
                 let m = String(dObj.getMonth() + 1).padStart(2, '0');
                 let d = String(dObj.getDate()).padStart(2, '0');
                 eDate = `${y}-${m}-${d}`;
             } else {
                 continue; // Skip invalid date completely to save the frontend
             }
         }
      }
      
      projectMap[pId].fragments.push({ uid: (tMap['uid'] !== undefined ? (timelineData[i][tMap['uid']] || '') : ''), type: type, date: eDate, startTime: startTime, endTime: endTime, note: note });
      
      // --- FIX: Calculate project span from ALL fragments, not just main/show days ---
      if (!p.start || eDate < p.start) p.start = eDate;
      if (!p.end || eDate > p.end) p.end = eDate;
    }
  }
  
  return Object.values(projectMap);
}

// ==========================================
// --- STATUS, RESTORE & DELETE ---
// ==========================================
// @INDEX: CRUD_PROJECTS -> Status & Lifecycle

function setProjectStatus(projectId, status, actor = "System UI") {
  return executeWithRetry(() => {
    assertActorCanManageProject(actor);
    const sheets = verifyDatabaseSchema();
    let indexData = sheets.index.getDataRange().getValues();
    let map = {};
    if(indexData.length > 0) indexData[0].forEach((h,i)=>map[h.toString().trim()]=i);
    for (let i = 1; i < indexData.length; i++) {
      if (indexData[i][map['uid']] === projectId) {
        sheets.index.getRange(i + 1, map['Status'] + 1).setValue(status);
        if (typeof flushCache !== 'undefined') flushCache();
        writeToAuditLog(actor, "UPDATE", "PROJECTS", projectId, projectId, `Changed status to: ${status}`);
        return "Success";
      }
    }
    return "Project not found";
  });
}

function restoreProjectWithConflictCheck(projectId, actor = "System UI") {
  return executeWithRetry(() => {
    assertActorCanManageProject(actor);
    let globalData = getGlobalMonthData(); 
    let allShifts = globalData.shifts;
    
    allShifts.forEach(s => {
       if (s.baseDate) {
           let pts = s.baseDate.split('-');
           // FIX: The 's.start' value is the total offset from the project start. Using it directly double-counts the day offset. We must use modulo 24 to get the time of day.
           let shiftEpoch = Date.UTC(parseInt(pts[0], 10), parseInt(pts[1], 10) - 1, parseInt(pts[2], 10)) + ((Number(s.start) % 24) * 3600000);
           s.absStart = shiftEpoch / 3600000; 
           s.absEnd = s.absStart + Number(s.duration);
       } else {
           s.absStart = 0; s.absEnd = 0;
       }
    });

    let restoredShifts = allShifts.filter(s => s.projectId === projectId);
    let activeShifts = allShifts.filter(s => {
        let rawStatus = String(s.status || '').toUpperCase();
        return s.projectId !== projectId && rawStatus !== 'CANCELLED' && rawStatus !== 'TRASHED';
    });
    
    let shiftsToDelete = [];
    
    restoredShifts.forEach(rs => {
      let hasOverlap = activeShifts.some(as => {
         if (as.email !== rs.email) return false;
         return (rs.absStart < as.absEnd && rs.absEnd > as.absStart);
      });
      if (hasOverlap) {
         shiftsToDelete.push(rs.id);
      }
    });

    const sheets = verifyDatabaseSchema();
    if (shiftsToDelete.length > 0) {
       let shiftData = sheets.shifts.getDataRange().getValues();
       let sMap = {};
       if(shiftData.length > 0) shiftData[0].forEach((h,i)=>sMap[h.toString().trim()]=i);
       let keptRows = [shiftData[0]];
       for (let i = 1; i < shiftData.length; i++) {
          if (!shiftsToDelete.includes(shiftData[i][sMap['uid']])) keptRows.push(shiftData[i]);
       }
       sheets.shifts.clearContents();
       if (keptRows.length > 0) sheets.shifts.getRange(1, 1, keptRows.length, keptRows[0].length).setValues(keptRows);
    }
    
    let indexData = sheets.index.getDataRange().getValues();
    let iMap = {};
    if(indexData.length > 0) indexData[0].forEach((h,i)=>iMap[h.toString().trim()]=i);
    for (let i = 1; i < indexData.length; i++) {
      if (indexData[i][iMap['uid']] === projectId) {
        sheets.index.getRange(i + 1, iMap['Status'] + 1).setValue('Scheduled');
        break;
      }
    }
    
    if (typeof flushCache !== 'undefined') flushCache();
    writeToAuditLog(actor, "RESTORE", "PROJECTS", projectId, projectId, `Restored event. Removed ${shiftsToDelete.length} conflicting shifts.`);
    return `Project Restored. ${shiftsToDelete.length > 0 ? 'Removed ' + shiftsToDelete.length + ' overlapping shifts.' : 'No shift conflicts found.'}`;
  });
}

function deleteProjectFull(projectId, projectName, oldDate, actor = "System UI") {
  return executeWithRetry(() => {
    assertActorCanManageProject(actor);
    const sheets = verifyDatabaseSchema();
    
    const processSheet = (sheet, colName) => {
      let data = sheet.getDataRange().getValues();
      if (data.length > 1) {
         let hMap = {};
         data[0].forEach((h, i) => hMap[h.toString().trim()] = i);
         let colIndexToMatch = hMap[colName];
         if (colIndexToMatch === undefined) return;
         
         let keptRows = [data[0]];
         for (let i = 1; i < data.length; i++) {
            if (data[i][colIndexToMatch] !== projectId) keptRows.push(data[i]);
         }
         sheet.clearContents();
         if (keptRows.length > 0) sheet.getRange(1, 1, keptRows.length, keptRows[0].length).setValues(keptRows);
      }
    };

    processSheet(sheets.index, 'uid');
    processSheet(sheets.timelines, 'project_uid');
    processSheet(sheets.shifts, 'project_uid');
    processSheet(sheets.blocks, 'project_uid');
    processSheet(sheets.projectChecklists, 'project_uid');
    processSheet(sheets.overrides, 'project_uid');

    if (typeof flushCache !== 'undefined') flushCache();
    writeToAuditLog(actor, "DELETE", "PROJECTS", projectId, projectId, "Deleted project and all associated data.");
    return "Deleted";
  });
}

function setProjectDifficultyMultiplier(projectId, mult, actor = "System UI") {
  return executeWithRetry(() => {
    const sheets = verifyDatabaseSchema();
    let indexData = sheets.index.getDataRange().getValues();
    let iMap = {};
    if(indexData.length > 0) indexData[0].forEach((h,i)=>iMap[h.toString().trim()]=i);
    for (let i = 1; i < indexData.length; i++) {
      if (indexData[i][iMap['uid']] === projectId) {
        if (iMap['Difficulty_Multiplier'] !== undefined) sheets.index.getRange(i + 1, iMap['Difficulty_Multiplier'] + 1).setValue(mult);
        if (typeof flushCache !== 'undefined') flushCache();
        writeToAuditLog(actor, "UPDATE", "PROJECTS", projectId, projectId, `Updated Event Multiplier to ${mult}x`);
        return "Success";
      }
    }
    throw new Error("Project not found");
  });
}

function updateProjectReadiness(projectId, stateStr, actor = "System UI") {
  return executeWithRetry(() => {
    if (!effectiveBackendPermission(actor, 'event_edit_timeline')
        && !effectiveBackendPermission(actor, 'event_assets_window')
        && !verifyBackendPrivilege(actor, 'MANAGER')) {
      throw new Error('🛑 PERMISSION DENIED: Cannot update project readiness.');
    }
    const sheets = verifyDatabaseSchema();
    let indexData = sheets.index.getDataRange().getValues();
    let iMap = {};
    if(indexData.length > 0) indexData[0].forEach((h,i)=>iMap[h.toString().trim()]=i);
    for (let i = 1; i < indexData.length; i++) {
      if (indexData[i][iMap['uid']] === projectId) {
        if(iMap['Readiness_State'] !== undefined) sheets.index.getRange(i + 1, iMap['Readiness_State'] + 1).setValue(stateStr);
        if (typeof flushCache !== 'undefined') flushCache();
        return "Success";
      }
    }
  });
}

// ==========================================
// --- UNIFIED UI EVENT SAVER ---
// ==========================================

function saveEventFromUI(projectData, timelinesArray, actor = "System UI") {
  try {
    assertActorCanSaveProject(actor, projectData || {});
    let newId = saveProjectData(projectData, timelinesArray, actor);
    
    // 2. Sync fragments natively to Google Calendar
    syncCalendarFromDatabase();
    
    return newId;
  } catch (e) {
    return "Error: " + e.toString();
  }
}