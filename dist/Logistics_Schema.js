/**
 * SM Showrunner (smuruner) - Clean 8 Architecture
 * Logistics_Schema.js - Engine Schema Bootstrap
 */

// ==========================================
// --- ENGINE SCHEMA BOOTSTRAP (SELF-HEALING) ---
// ==========================================
// @INDEX: SCHEMA_ENGINE -> Relational Engine Schema
function verifyDatabaseSchema(readOnly = false) {
  if (cachedEngineSheets && readOnly) return cachedEngineSheets;
  const ss = SpreadsheetApp.openById(ENGINE_SHEET_ID); 
  
  const sheetsArr = ss.getSheets();
  const sm = {};
  for (let i = 0; i < sheetsArr.length; i++) sm[sheetsArr[i].getName()] = sheetsArr[i];

  cachedEngineSheets = { index: sm["Projects_Index"], timelines: sm["Project_Timelines"], shifts: sm["Shift_Assignments"], blocks: sm["Phase_Blocks"], overrides: sm["Dept_Overrides"], leaves: sm["Leave_Tracker"], tasks: sm["Global_Tasks"], notifs: sm["Notifications"], taskAssignees: sm["Task_Assignees"], taskTodos: sm["Task_Todos"], taskAssets: sm["Task_Assets"], projectChecklists: sm["Project_Checklists"], projectAssets: sm["Project_Assets"], conflictOverrides: sm["Conflict_Overrides"], opsLedger: sm["Operations_Ledger"] };
  if (readOnly) return cachedEngineSheets;

  let indexSheet = sm["Projects_Index"];
  const indexHeaders = ["uid", "Project_Name", "Client", "Status", "Folder_ID", "Manager_Email", "Project_Type", "Checklist_State", "Last_Updated", "Readiness_State", "Location_URL", "Difficulty_Multiplier"];
  if (!indexSheet) { 
    indexSheet = ss.insertSheet("Projects_Index"); 
    indexSheet.appendRow(indexHeaders); 
    indexSheet.getRange(1, 1, 1, indexHeaders.length).setFontWeight("bold").setBackground("#111827").setFontColor("#ffffff"); 
    indexSheet.setFrozenRows(1); 
  } else {
    if (indexSheet.getMaxColumns() < indexHeaders.length) indexSheet.insertColumnsAfter(indexSheet.getMaxColumns(), indexHeaders.length - indexSheet.getMaxColumns());
    indexSheet.getRange(1, 1, 1, indexHeaders.length).setValues([indexHeaders]).setFontWeight("bold").setBackground("#111827").setFontColor("#ffffff");
  }
  
  let timelineSheet = sm["Project_Timelines"];
  const timelineHeaders = ["uid", "project_uid", "Sub_Event_Type", "Event_Date", "Start_Time", "End_Time", "Note"];
  if (!timelineSheet) { 
      timelineSheet = ss.insertSheet("Project_Timelines"); 
      timelineSheet.appendRow(timelineHeaders); 
      timelineSheet.getRange(1, 1, 1, timelineHeaders.length).setFontWeight("bold").setBackground("#1e3a8a").setFontColor("#ffffff"); timelineSheet.setFrozenRows(1); 
  } else {
      if (timelineSheet.getMaxColumns() < timelineHeaders.length) timelineSheet.insertColumnsAfter(timelineSheet.getMaxColumns(), timelineHeaders.length - timelineSheet.getMaxColumns());
      timelineSheet.getRange(1, 1, 1, timelineHeaders.length).setValues([timelineHeaders]).setFontWeight("bold").setBackground("#1e3a8a").setFontColor("#ffffff");
  }

  let shiftSheet = sm["Shift_Assignments"];
  const shiftHeaders = ["uid", "project_uid", "Phase_Mode", "user_uid", "Role", "Start", "Duration", "Has_Arrow", "Note", "payment_status", "paid_amount"];
  if (!shiftSheet) { 
      shiftSheet = ss.insertSheet("Shift_Assignments"); 
      shiftSheet.appendRow(shiftHeaders); 
      shiftSheet.getRange(1, 1, 1, shiftHeaders.length).setFontWeight("bold").setBackground("#059669").setFontColor("#ffffff"); shiftSheet.setFrozenRows(1); 
  } else {
      if (shiftSheet.getMaxColumns() < shiftHeaders.length) shiftSheet.insertColumnsAfter(shiftSheet.getMaxColumns(), shiftHeaders.length - shiftSheet.getMaxColumns());
      shiftSheet.getRange(1, 1, 1, shiftHeaders.length).setValues([shiftHeaders]).setFontWeight("bold").setBackground("#059669").setFontColor("#ffffff");
  }

  let blockSheet = sm["Phase_Blocks"];
  const blockHeaders = ["uid", "project_uid", "Phase_Mode", "Phase_Name", "Start", "Duration", "Note"];
  if (!blockSheet) { 
      blockSheet = ss.insertSheet("Phase_Blocks"); 
      blockSheet.appendRow(blockHeaders); 
      blockSheet.getRange(1, 1, 1, blockHeaders.length).setFontWeight("bold").setBackground("#d97706").setFontColor("#ffffff"); blockSheet.setFrozenRows(1); 
  } else {
      if (blockSheet.getMaxColumns() < blockHeaders.length) blockSheet.insertColumnsAfter(blockSheet.getMaxColumns(), blockHeaders.length - blockSheet.getMaxColumns());
      blockSheet.getRange(1, 1, 1, blockHeaders.length).setValues([blockHeaders]).setFontWeight("bold").setBackground("#d97706").setFontColor("#ffffff");
  }

  let overrideSheet = sm["Dept_Overrides"];
  const overrideHeaders = ["project_uid", "Phase_Mode", "user_uid", "Dept_Name"];
  if (!overrideSheet) { 
      overrideSheet = ss.insertSheet("Dept_Overrides"); 
      overrideSheet.appendRow(overrideHeaders); 
      overrideSheet.getRange(1, 1, 1, overrideHeaders.length).setFontWeight("bold").setBackground("#4f46e5").setFontColor("#ffffff"); overrideSheet.setFrozenRows(1); 
  } else {
      if (overrideSheet.getMaxColumns() < overrideHeaders.length) overrideSheet.insertColumnsAfter(overrideSheet.getMaxColumns(), overrideHeaders.length - overrideSheet.getMaxColumns());
      overrideSheet.getRange(1, 1, 1, overrideHeaders.length).setValues([overrideHeaders]).setFontWeight("bold").setBackground("#4f46e5").setFontColor("#ffffff");
  }
  
  let leaveSheet = sm["Leave_Tracker"];
  const leaveHeaders = ["uid", "user_uid", "Start_Date", "End_Date", "Reason"];
  if (!leaveSheet) { 
      leaveSheet = ss.insertSheet("Leave_Tracker"); 
      leaveSheet.appendRow(leaveHeaders); 
      leaveSheet.getRange(1, 1, 1, leaveHeaders.length).setFontWeight("bold").setBackground("#7f1d1d").setFontColor("#ffffff"); leaveSheet.setFrozenRows(1); 
  } else {
      if (leaveSheet.getMaxColumns() < leaveHeaders.length) leaveSheet.insertColumnsAfter(leaveSheet.getMaxColumns(), leaveHeaders.length - leaveSheet.getMaxColumns());
      leaveSheet.getRange(1, 1, 1, leaveHeaders.length).setValues([leaveHeaders]).setFontWeight("bold").setBackground("#7f1d1d").setFontColor("#ffffff");
  }
  
  let taskSheet = sm["Global_Tasks"];
  const taskHeaders = ["uid", "Title", "Assignees", "Status", "Notes", "Todos", "Assets", "Priority"];
  if (!taskSheet) { 
      taskSheet = ss.insertSheet("Global_Tasks"); 
      taskSheet.appendRow(taskHeaders); 
      taskSheet.getRange(1, 1, 1, taskHeaders.length).setFontWeight("bold").setBackground("#8b5cf6").setFontColor("#ffffff"); 
      taskSheet.setFrozenRows(1); 
  } else {
      if (taskSheet.getMaxColumns() < taskHeaders.length) taskSheet.insertColumnsAfter(taskSheet.getMaxColumns(), taskHeaders.length - taskSheet.getMaxColumns());
      taskSheet.getRange(1, 1, 1, taskHeaders.length).setValues([taskHeaders]).setFontWeight("bold").setBackground("#8b5cf6").setFontColor("#ffffff");
  }
  
  let notifSheet = sm["Notifications"];
  const notifHeaders = ["uid", "user_uid", "Message", "Is_Read", "Timestamp"];
  if (!notifSheet) { 
      notifSheet = ss.insertSheet("Notifications"); 
      notifSheet.appendRow(notifHeaders); 
      notifSheet.getRange(1, 1, 1, notifHeaders.length).setFontWeight("bold").setBackground("#f43f5e").setFontColor("#ffffff"); notifSheet.setFrozenRows(1); 
  } else {
      if (notifSheet.getMaxColumns() < notifHeaders.length) notifSheet.insertColumnsAfter(notifSheet.getMaxColumns(), notifHeaders.length - notifSheet.getMaxColumns());
      notifSheet.getRange(1, 1, 1, notifHeaders.length).setValues([notifHeaders]).setFontWeight("bold").setBackground("#f43f5e").setFontColor("#ffffff");
  }
  
  let taskAssigneesSheet = sm["Task_Assignees"];
  const taskAssigneesHeaders = ["uid", "task_uid", "user_uid"];
  if (!taskAssigneesSheet) { 
      taskAssigneesSheet = ss.insertSheet("Task_Assignees"); 
      taskAssigneesSheet.appendRow(taskAssigneesHeaders); 
      taskAssigneesSheet.getRange(1, 1, 1, taskAssigneesHeaders.length).setFontWeight("bold").setBackground("#8b5cf6").setFontColor("#ffffff"); taskAssigneesSheet.setFrozenRows(1); 
  } else {
      if (taskAssigneesSheet.getMaxColumns() < taskAssigneesHeaders.length) taskAssigneesSheet.insertColumnsAfter(taskAssigneesSheet.getMaxColumns(), taskAssigneesHeaders.length - taskAssigneesSheet.getMaxColumns());
      taskAssigneesSheet.getRange(1, 1, 1, taskAssigneesHeaders.length).setValues([taskAssigneesHeaders]).setFontWeight("bold").setBackground("#8b5cf6").setFontColor("#ffffff");
  }
  
  let taskTodosSheet = sm["Task_Todos"];
  const taskTodosHeaders = ["uid", "task_uid", "description", "is_done"];
  if (!taskTodosSheet) { 
      taskTodosSheet = ss.insertSheet("Task_Todos"); 
      taskTodosSheet.appendRow(taskTodosHeaders); 
      taskTodosSheet.getRange(1, 1, 1, taskTodosHeaders.length).setFontWeight("bold").setBackground("#8b5cf6").setFontColor("#ffffff"); taskTodosSheet.setFrozenRows(1); 
  } else {
      if (taskTodosSheet.getMaxColumns() < taskTodosHeaders.length) taskTodosSheet.insertColumnsAfter(taskTodosSheet.getMaxColumns(), taskTodosHeaders.length - taskTodosSheet.getMaxColumns());
      taskTodosSheet.getRange(1, 1, 1, taskTodosHeaders.length).setValues([taskTodosHeaders]).setFontWeight("bold").setBackground("#8b5cf6").setFontColor("#ffffff");
  }
  
  let taskAssetsSheet = sm["Task_Assets"];
  const taskAssetsHeaders = ["uid", "task_uid", "asset_uid", "assigned_quantity"];
  if (!taskAssetsSheet) { 
      taskAssetsSheet = ss.insertSheet("Task_Assets"); 
      taskAssetsSheet.appendRow(taskAssetsHeaders); 
      taskAssetsSheet.getRange(1, 1, 1, taskAssetsHeaders.length).setFontWeight("bold").setBackground("#8b5cf6").setFontColor("#ffffff"); taskAssetsSheet.setFrozenRows(1); 
  } else {
      if (taskAssetsSheet.getMaxColumns() < taskAssetsHeaders.length) taskAssetsSheet.insertColumnsAfter(taskAssetsSheet.getMaxColumns(), taskAssetsHeaders.length - taskAssetsSheet.getMaxColumns());
      taskAssetsSheet.getRange(1, 1, 1, taskAssetsHeaders.length).setValues([taskAssetsHeaders]).setFontWeight("bold").setBackground("#8b5cf6").setFontColor("#ffffff");
  }

  let projectChecklistsSheet = sm["Project_Checklists"];
  const projectChecklistsHeaders = ["uid", "project_uid", "task_name", "is_checked", "copied_file_id"];
  if (!projectChecklistsSheet) { 
      projectChecklistsSheet = ss.insertSheet("Project_Checklists"); 
      projectChecklistsSheet.appendRow(projectChecklistsHeaders); 
      projectChecklistsSheet.getRange(1, 1, 1, projectChecklistsHeaders.length).setFontWeight("bold").setBackground("#111827").setFontColor("#ffffff"); projectChecklistsSheet.setFrozenRows(1); 
  } else {
      if (projectChecklistsSheet.getMaxColumns() < projectChecklistsHeaders.length) projectChecklistsSheet.insertColumnsAfter(projectChecklistsSheet.getMaxColumns(), projectChecklistsHeaders.length - projectChecklistsSheet.getMaxColumns());
      projectChecklistsSheet.getRange(1, 1, 1, projectChecklistsHeaders.length).setValues([projectChecklistsHeaders]).setFontWeight("bold").setBackground("#111827").setFontColor("#ffffff");
  }

  let projectAssetsSheet = sm["Project_Assets"];
  const projectAssetsHeaders = ["uid", "project_uid", "asset_uid", "assigned_quantity", "location", "formula", "creator", "container_uid", "scan_status", "outbound_truck_uid", "outbound_x", "outbound_y", "outbound_z", "outbound_rotated", "outbound_staged", "inbound_truck_uid", "inbound_x", "inbound_y", "inbound_z", "inbound_rotated", "inbound_staged"];
  if (!projectAssetsSheet) { 
      projectAssetsSheet = ss.insertSheet("Project_Assets"); 
      projectAssetsSheet.appendRow(projectAssetsHeaders); 
      projectAssetsSheet.getRange(1, 1, 1, projectAssetsHeaders.length).setFontWeight("bold").setBackground("#10b981").setFontColor("#ffffff"); projectAssetsSheet.setFrozenRows(1); 
  } else {
      if (projectAssetsSheet.getMaxColumns() < projectAssetsHeaders.length) projectAssetsSheet.insertColumnsAfter(projectAssetsSheet.getMaxColumns(), projectAssetsHeaders.length - projectAssetsSheet.getMaxColumns());
      projectAssetsSheet.getRange(1, 1, 1, projectAssetsHeaders.length).setValues([projectAssetsHeaders]).setFontWeight("bold").setBackground("#10b981").setFontColor("#ffffff");
  }
  
  let conflictOverridesSheet = sm["Conflict_Overrides"];
  const conflictOverridesHeaders = ["uid", "project_uid", "conflict_type", "approved_by_uid", "timestamp"];
  if (!conflictOverridesSheet) { 
      conflictOverridesSheet = ss.insertSheet("Conflict_Overrides"); 
      conflictOverridesSheet.appendRow(conflictOverridesHeaders); 
      conflictOverridesSheet.getRange(1, 1, 1, conflictOverridesHeaders.length).setFontWeight("bold").setBackground("#f43f5e").setFontColor("#ffffff"); conflictOverridesSheet.setFrozenRows(1); 
  } else {
      if (conflictOverridesSheet.getMaxColumns() < conflictOverridesHeaders.length) conflictOverridesSheet.insertColumnsAfter(conflictOverridesSheet.getMaxColumns(), conflictOverridesHeaders.length - conflictOverridesSheet.getMaxColumns());
      conflictOverridesSheet.getRange(1, 1, 1, conflictOverridesHeaders.length).setValues([conflictOverridesHeaders]).setFontWeight("bold").setBackground("#f43f5e").setFontColor("#ffffff");
  }

  let opsLedgerSheet = sm["Operations_Ledger"];
  const opsLedgerHeaders = ["uid", "session_uid", "project_uid", "operation_type", "asset_uid", "asset_code", "asset_name", "department", "rfid_tag", "timestamp", "actor"];
  if (!opsLedgerSheet) { 
      opsLedgerSheet = ss.insertSheet("Operations_Ledger"); 
      opsLedgerSheet.appendRow(opsLedgerHeaders); 
      opsLedgerSheet.getRange(1, 1, 1, opsLedgerHeaders.length).setFontWeight("bold").setBackground("#059669").setFontColor("#ffffff"); opsLedgerSheet.setFrozenRows(1); 
  } else {
      if (opsLedgerSheet.getMaxColumns() < opsLedgerHeaders.length) opsLedgerSheet.insertColumnsAfter(opsLedgerSheet.getMaxColumns(), opsLedgerHeaders.length - opsLedgerSheet.getMaxColumns());
      opsLedgerSheet.getRange(1, 1, 1, opsLedgerHeaders.length).setValues([opsLedgerHeaders]).setFontWeight("bold").setBackground("#059669").setFontColor("#ffffff");
  }

  let ledgerSheet = sm["Financial_Ledger"];
  const ledgerHeaders = ["uid", "Date", "Category", "Description", "Amount", "Reference_ID", "Created_By"];
  if (!ledgerSheet) { 
      ledgerSheet = ss.insertSheet("Financial_Ledger"); 
      ledgerSheet.appendRow(ledgerHeaders); 
      ledgerSheet.getRange(1, 1, 1, ledgerHeaders.length).setFontWeight("bold").setBackground("#eab308").setFontColor("#000000"); ledgerSheet.setFrozenRows(1); 
  } else {
      if (ledgerSheet.getMaxColumns() < ledgerHeaders.length) ledgerSheet.insertColumnsAfter(ledgerSheet.getMaxColumns(), ledgerHeaders.length - ledgerSheet.getMaxColumns());
      ledgerSheet.getRange(1, 1, 1, ledgerHeaders.length).setValues([ledgerHeaders]).setFontWeight("bold").setBackground("#eab308").setFontColor("#000000");
  }

  cachedEngineSheets = { index: indexSheet, timelines: timelineSheet, shifts: shiftSheet, blocks: blockSheet, overrides: overrideSheet, leaves: leaveSheet, tasks: taskSheet, notifs: notifSheet, taskAssignees: taskAssigneesSheet, taskTodos: taskTodosSheet, taskAssets: taskAssetsSheet, projectChecklists: projectChecklistsSheet, projectAssets: projectAssetsSheet, conflictOverrides: conflictOverridesSheet, opsLedger: opsLedgerSheet, finLedger: ledgerSheet };
  return cachedEngineSheets;
}