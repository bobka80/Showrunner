/**
 * SM Showrunner (smuruner) - Clean 8 Architecture
 * Resources_Audit.js - Enterprise Audit Logger & Merge DB
 */

// ==========================================
// --- ENTERPRISE AUDIT LOGGER ---
// ==========================================
// @INDEX: AUDIT_LOG -> Enterprise Audit Logger

function verifyAuditSchema() {
  const ss = SpreadsheetApp.openById(AUDIT_LOG_SHEET_ID);
  let sheet = ss.getSheetByName("Audit_Logs");
  const headers = ["Timestamp", "Actor", "Action_Type", "Module", "Project_ID", "Target_Name", "Delta_Payload"];
  
  if (!sheet) {
    sheet = ss.insertSheet("Audit_Logs");
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#374151").setFontColor("#ffffff");
    sheet.setFrozenRows(1);
  } else {
    if (sheet.getMaxColumns() < headers.length) {
        sheet.insertColumnsAfter(sheet.getMaxColumns(), headers.length - sheet.getMaxColumns());
    }
    // Ensure headers exist (in case the file was completely blank)
    let firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
    if (firstRow[0] !== "Timestamp") {
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold").setBackground("#374151").setFontColor("#ffffff");
    }
  }
  return sheet;
}

function writeToAuditLog(actor, actionType, moduleName, projectId, targetName, deltaPayload) {
  try {
    let actorUid = (actor && actor.trim() !== "") ? actor.trim() : "System";
    if (actorUid !== "System" && actorUid !== "System UI") {
        try {
            const vaultSheets = verifyVaultSchema(true);
            const crewData = getSheetData(vaultSheets.crew);
            let cMap = crewData.hMap;
            for (let i = 1; i < crewData.length; i++) {
                let dbName = crewData[i][cMap['Name']] ? String(crewData[i][cMap['Name']]).trim().toLowerCase() : "";
                let dbEmail = crewData[i][cMap['Email']] ? String(crewData[i][cMap['Email']]).trim().toLowerCase() : "";
                let searchName = actorUid.toLowerCase();
                if (dbName === searchName || dbEmail === searchName) {
                    actorUid = crewData[i][cMap['uid']] || actorUid;
                    break;
                }
            }
        } catch(e) {}
    }

    const sheet = verifyAuditSchema();
    const timestamp = new Date().toISOString();
    const row = [timestamp, actorUid, actionType, moduleName, projectId || "GLOBAL", targetName || "", deltaPayload || ""];
    sheet.appendRow(row);
  } catch(e) {
    console.error("Audit Logger Failed: ", e);
  }
}

// Temporary test script so you can verify the connection
function TEST_AuditLogger() {
  writeToAuditLog("John Doe (john@av.local)", "CREATE", "SYSTEM_TEST", "PROJ-1234", "Test Database Connection", "System initialization test log.");
  return "Test log injected successfully!";
}

function getEntityAuditHistory(targetUid) {
  return executeWithRetry(() => {
    if (!targetUid || targetUid === 'NEW') return [];
    
    // --- REVERSE UID MAPPING ENGINE ---
    let uidToName = { "System UI": "System", "System": "System" };
    try {
        const vaultSheets = verifyVaultSchema(true);
        const crewData = getSheetData(vaultSheets.crew);
        const cMap = crewData.hMap;
        for (let i = 1; i < crewData.length; i++) {
            let uidKey = crewData[i][cMap['uid']];
            if (uidKey) {
                uidToName[String(uidKey).trim()] = crewData[i][cMap['Name']] || crewData[i][cMap['Email']];
            }
        }
    } catch(e) {}

    const ss = SpreadsheetApp.openById(AUDIT_LOG_SHEET_ID);
    const sheet = ss.getSheetByName("Audit_Logs");
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];

    let history = [];
    let hMap = {};
    data[0].forEach((h, i) => hMap[h.toString().trim()] = i);

    // Loop backwards so newest logs are at the top (Index 0)
    for (let i = data.length - 1; i > 0; i--) { 
        let rowTarget = String(data[i][hMap['Target_Name']]);
        let rowProject = String(data[i][hMap['Project_ID']]);

        // Match the specific item OR anything that happened inside this Project
        if (rowTarget === targetUid || rowProject === targetUid) {
            let rawActor = data[i][hMap['Actor']] ? String(data[i][hMap['Actor']]).trim() : "Unknown";
            let mappedActor = uidToName[rawActor] || rawActor;

            history.push({
                timestamp: data[i][hMap['Timestamp']],
                actor: mappedActor,
                action: data[i][hMap['Action_Type']],
                module: data[i][hMap['Module']],
                delta: data[i][hMap['Delta_Payload']]
            });
        }
    }
    return history;
  });
}

// ==========================================
// --- EXTERNAL AUDIT & MERGE ENGINE ---
// ==========================================
// @INDEX: AUDIT_DB -> External Audit & Merge Engine
function verifyAuditDatabaseSchema() {
    const ss = SpreadsheetApp.openById(AUDIT_DB_SHEET_ID);
    let sheet = ss.getSheetByName("Merge_Flags");
    const headers = ["uid", "group_id", "asset_id", "conflict_type", "status"];
    if (!sheet) {
        sheet = ss.insertSheet("Merge_Flags");
        sheet.appendRow(headers);
        sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f59e0b").setFontColor("#ffffff");
        sheet.setFrozenRows(1);
    }
    return sheet;
}

function getAuditFlags() {
    return executeWithRetry(() => {
        let sheet = verifyAuditDatabaseSchema();
        let data = sheet.getDataRange().getValues();
        let flags = [];
        let map = {}; if (data.length > 0) data[0].forEach((h,i)=>map[h.toString().trim()]=i);
        for(let i=1; i<data.length; i++){
            if(data[i][map['status']] === 'Pending') {
                flags.push({
                    uid: String(data[i][map['uid']]), 
                    groupId: String(data[i][map['group_id']]),
                    assetId: String(data[i][map['asset_id']]), 
                    conflictType: String(data[i][map['conflict_type']])
                });
            }
        }
        return flags;
    });
}

function saveAuditGroups(groups) {
    return executeWithRetry(() => {
        let sheet = verifyAuditDatabaseSchema();
        let data = sheet.getDataRange().getValues();
        let map = {}; if (data.length > 0) data[0].forEach((h,i)=>map[h.toString().trim()]=i);
        
        let keptRows = [data[0]];
        for(let i=1; i<data.length; i++){ if(data[i][map['status']] !== 'Pending') keptRows.push(data[i]); }
        
        groups.forEach(g => {
            g.assetIds.forEach(aId => {
                let row = new Array(data[0].length).fill("");
                if (map['uid'] !== undefined) row[map['uid']] = Utilities.getUuid();
                if (map['group_id'] !== undefined) row[map['group_id']] = g.groupId;
                if (map['asset_id'] !== undefined) row[map['asset_id']] = aId;
                if (map['conflict_type'] !== undefined) row[map['conflict_type']] = g.type;
                if (map['status'] !== undefined) row[map['status']] = 'Pending';
                keptRows.push(row);
            });
        });
        sheet.clearContents();
        if (keptRows.length > 0) sheet.getRange(1, 1, keptRows.length, keptRows[0].length).setValues(keptRows);
        return "Saved";
    });
}

function clearAllAuditFlags() {
    return executeWithRetry(() => {
        let sheet = verifyAuditDatabaseSchema();
        let data = sheet.getDataRange().getValues();
        let keptRows = [data[0]];
        sheet.clearContents();
        if (keptRows.length > 0) sheet.getRange(1, 1, keptRows.length, keptRows[0].length).setValues(keptRows);
        
        // Clear the Reviewed tags as well
        let revSheet = verifyReviewedDatabaseSchema();
        if (revSheet) {
            let revData = revSheet.getDataRange().getValues();
            let revKeptRows = [revData[0]];
            revSheet.clearContents();
            if (revKeptRows.length > 0) revSheet.getRange(1, 1, 1, revKeptRows[0].length).setValues(revKeptRows);
        }
        return "Cleared";
    });
}

function resolveAuditGroup(groupId, masterPayload, slaveIdsToDelete, totalQty, actor) {
    return executeWithRetry(() => {
        let res = provisionNewAsset(actor, masterPayload, masterPayload.id, totalQty);
        if (slaveIdsToDelete && slaveIdsToDelete.length > 0) deleteVaultAsset(actor, slaveIdsToDelete);
        let sheet = verifyAuditDatabaseSchema(); let data = sheet.getDataRange().getValues(); let map = {}; if(data.length>0) data[0].forEach((h,i)=>map[h.toString().trim()]=i); let updated = false;
        for(let i=1; i<data.length; i++){ if(data[i][map['group_id']] === groupId && data[i][map['status']] === 'Pending') { data[i][map['status']] = 'Resolved'; updated = true; } }
        if(updated) sheet.getRange(1, 1, data.length, data[0].length).setValues(data); return "Merged";
    });
}

function verifyReviewedDatabaseSchema() {
    const ss = SpreadsheetApp.openById(AUDIT_DB_SHEET_ID);
    let sheet = ss.getSheetByName("Reviewed_Assets");
    if (!sheet) {
        sheet = ss.insertSheet("Reviewed_Assets");
        sheet.appendRow(["asset_id", "timestamp", "actor"]);
        sheet.getRange(1, 1, 1, 3).setFontWeight("bold").setBackground("#10b981").setFontColor("#ffffff");
        sheet.setFrozenRows(1);
    }
    return sheet;
}

function getReviewedAssets() {
    return executeWithRetry(() => {
        let sheet = verifyReviewedDatabaseSchema();
        let data = sheet.getDataRange().getValues();
        let revs = [];
        let map = {}; if (data.length > 0) data[0].forEach((h,i)=>map[h.toString().trim()]=i);
        for(let i=1; i<data.length; i++){
            if(data[i][map['asset_id']]) revs.push(String(data[i][map['asset_id']]));
        }
        return revs;
    });
}

// ==========================================
// @INDEX: AUDIT_REVIEW -> Bulk Review Status Engine
// Processes arrays of IDs atomically to prevent backend API rate-limiting during UI bulk actions
function setAssetReviewedStatus(assetIds, isReviewed, actor) {
    return executeWithRetry(() => {
        let ids = Array.isArray(assetIds) ? assetIds : [assetIds];
        let sheet = verifyReviewedDatabaseSchema();
        let data = sheet.getDataRange().getValues();
        let map = {}; if (data.length > 0) data[0].forEach((h,i)=>map[h.toString().trim()]=i);
        let keptRows = [data[0]];
        let foundSet = new Set();
        
        for(let i=1; i<data.length; i++) { 
            let rowId = String(data[i][map['asset_id']]);
            if (ids.includes(rowId)) { 
                foundSet.add(rowId); 
                if (isReviewed) keptRows.push(data[i]); 
            } else { 
                keptRows.push(data[i]); 
            } 
        }
        
        if (isReviewed) { 
            ids.forEach(id => {
                if (!foundSet.has(id)) {
                    let row = new Array(data[0].length).fill(""); 
                    if (map['asset_id'] !== undefined) row[map['asset_id']] = id; 
                    if (map['timestamp'] !== undefined) row[map['timestamp']] = new Date().toISOString(); 
                    if (map['actor'] !== undefined) row[map['actor']] = actor; 
                    keptRows.push(row); 
                }
            });
        }
        sheet.clearContents();
        if (keptRows.length > 0) sheet.getRange(1, 1, keptRows.length, keptRows[0].length).setValues(keptRows);
        return "Success";
    });
}