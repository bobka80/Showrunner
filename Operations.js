/**
 * SM Showrunner (smuruner) - Clean 8 Architecture
 * Operations.js - Real-time Warehouse Operations, RFID Scanning & Checkout Logic
 */

// ==========================================
// --- START OPERATION (CHECK-OUT / CHECK-IN) ---
// ==========================================
// @INDEX: OPS_BACKEND -> Start Session
function startEventOperation(projectId, operationType, actor = "System UI") {
    return getLedgerRepo().startOperation(projectId, operationType, actor);
}

function startEventOperationSheets_(projectId, operationType, actor = "System UI") {
    return executeWithRetry(() => {
        assertActorCanPerformAssetOperations(actor);
        const sheets = verifyDatabaseSchema();
        let indexData = sheets.index.getDataRange().getValues();
        let iMap = {};
        if (indexData.length > 0) indexData[0].forEach((h, i) => iMap[h.toString().trim()] = i);

        // Autonomous Schema Expansion: Ensure operation columns exist in the Engine
        if (iMap['Active_Operation'] === undefined) {
            sheets.index.insertColumnAfter(indexData[0].length);
            sheets.index.getRange(1, indexData[0].length + 1).setValue('Active_Operation');
            iMap['Active_Operation'] = indexData[0].length;
        }
        if (iMap['Active_Session_UID'] === undefined) {
            sheets.index.insertColumnAfter(Object.keys(iMap).length);
            sheets.index.getRange(1, Object.keys(iMap).length + 1).setValue('Active_Session_UID');
            iMap['Active_Session_UID'] = Object.keys(iMap).length;
        }

        for (let i = 1; i < indexData.length; i++) {
            if (indexData[i][iMap['uid']] === projectId) {
                let currentOp = indexData[i][iMap['Active_Operation']];
                let currentSession = indexData[i][iMap['Active_Session_UID']];
                
                if (currentOp === operationType && currentSession) {
                    // Resume existing operation!
                    let ledgerData = sheets.opsLedger.getDataRange().getValues();
                    let lMap = {}; if(ledgerData.length>0) ledgerData[0].forEach((h,idx)=>lMap[h.toString().trim()]=idx);
                    let scannedMap = {};
                    let totalScanned = 0;
                    for(let j=1; j<ledgerData.length; j++) {
                        if(ledgerData[j][lMap['session_uid']] === currentSession) {
                            let aId = ledgerData[j][lMap['asset_uid']];
                            scannedMap[aId] = (scannedMap[aId] || 0) + 1;
                            totalScanned++;
                        }
                    }
                    return { success: true, message: `Resumed active ${operationType} session.`, resumed: true, scannedCount: totalScanned, scannedMap: scannedMap };
                }
                
                sheets.index.getRange(i + 1, iMap['Active_Operation'] + 1).setValue(operationType);
                let sessionUid = Utilities.getUuid();
                sheets.index.getRange(i + 1, iMap['Active_Session_UID'] + 1).setValue(sessionUid);
                
                dalLedgerInvalidateAfterOp_(projectId);
                writeToAuditLog(actor, "UPDATE", "OPERATIONS", projectId, projectId, `Started ${operationType} operation.`);
                return { success: true, message: `Operation ${operationType} started.` };
            }
        }
        throw new Error("Project not found.");
    });
}

// ==========================================
// --- RFID SCANNING ENGINE ---
// ==========================================
// @INDEX: OPS_BACKEND -> RFID Processor
function processRfidScan(projectId, rfidTag, actor = "System UI") {
    return getLedgerRepo().processRfidScan(projectId, rfidTag, actor);
}

function processRfidScanSheets_(projectId, rfidTag, actor = "System UI") {
    return executeWithRetry(() => {
        assertActorCanPerformAssetOperations(actor);
        const vaultSheets = verifyVaultSchema(true);
        const assetData = getSheetData(vaultSheets.assets);
        let aMap = assetData.hMap;
        
        let targetAsset = null;
        let searchTerm = rfidTag.toString().toLowerCase().trim();
        
        // 1. Identify Asset by RFID, UID, Unit Number, or Name
        for (let i = 1; i < assetData.length; i++) {
            let rfid = (assetData[i][aMap['rfid_tag']] || "").toString().toLowerCase().trim();
            let uid = (assetData[i][aMap['uid']] || "").toString().toLowerCase().trim();
            let unit = (assetData[i][aMap['unit_number']] || "").toString().toLowerCase().trim();
            let name = (assetData[i][aMap['name']] || "").toString().toLowerCase().trim();
            let nameUnit = name + (unit ? " #" + unit : "");
            let nameUnitSpace = name + (unit ? " " + unit : "");
            
            if (rfid === searchTerm || uid === searchTerm || unit === searchTerm || name === searchTerm || nameUnit === searchTerm || nameUnitSpace === searchTerm) {
                targetAsset = {
                    id: assetData[i][aMap['uid']],
                    assetCode: assetData[i][aMap['unit_number']] || "BULK",
                    name: assetData[i][aMap['name']],
                    department: assetData[i][aMap['department']],
                    tagValue: assetData[i][aMap['rfid_tag']] || "MANUAL_ENTRY",
                    status: assetData[i][aMap['status']],
                    type: assetData[i][aMap['type']]
                };
                break;
            }
        }
        
        if (!targetAsset) throw new Error("No equipment found matching: " + rfidTag);
        
        // 2. Delegate to the batch processor
        let res = batchProcessOperations(projectId, [{ action: 'scan', assetId: targetAsset.id, scanQty: 1 }], actor);
        return { success: true, equipment: targetAsset, scannedCount: res.scannedCount, scannedMap: res.scannedMap };
    });
}

// ==========================================
// --- BATCH OPERATIONS LEDGER ENGINE (OPTIMISTIC UI QUEUE) ---
// ==========================================
// @INDEX: OPS_BACKEND -> Ledger Committer
function batchProcessOperations(projectId, batch, actor = "System UI") {
    return getLedgerRepo().batchProcess(projectId, batch, actor);
}

function batchProcessOperationsSheets_(projectId, batch, actor = "System UI") {
    return executeWithRetry(() => {
        assertActorCanPerformAssetOperations(actor);
        const sheets = verifyDatabaseSchema();
        let indexData = sheets.index.getDataRange().getValues();
        let iMap = {};
        if (indexData.length > 0) indexData[0].forEach((h, i) => iMap[h.toString().trim()] = i);
        
        let operationType = "";
        let sessionUid = "";
        
        for (let i = 1; i < indexData.length; i++) {
            if (indexData[i][iMap['uid']] === projectId) {
                operationType = indexData[i][iMap['Active_Operation']];
                sessionUid = indexData[i][iMap['Active_Session_UID']];
                break;
            }
        }
        
        if (!operationType || !sessionUid) throw new Error("No active operation for this event. Start Check-out or Check-in first.");
        
        let ledgerData = sheets.opsLedger.getDataRange().getValues();
        let lMap = {};
        if (ledgerData.length > 0) ledgerData[0].forEach((h, i) => lMap[h.toString().trim()] = i);
        
        let sessionRows = [];
        for (let i = 1; i < ledgerData.length; i++) {
            if (ledgerData[i][lMap['session_uid']] === sessionUid) sessionRows.push(ledgerData[i]);
        }
        
        let paData = sheets.projectAssets.getDataRange().getValues();
        let pMap = {}; if(paData.length>0) paData[0].forEach((h,i)=>pMap[h.toString().trim()]=i);
        const vaultSheets = verifyVaultSchema(true);
        const vaultData = getSheetData(vaultSheets.assets);
        let vMap = vaultData.hMap;
        
        const getMeta = (id) => {
            for(let v=1; v<vaultData.length; v++) {
                if (String(vaultData[v][vMap['uid']]) === String(id)) {
                    return { id: id, assetCode: vaultData[v][vMap['unit_number']] || "BULK", name: vaultData[v][vMap['name']], department: vaultData[v][vMap['department']], tagValue: vaultData[v][vMap['rfid_tag']] || "UNASSIGNED", status: vaultData[v][vMap['status']], type: vaultData[v][vMap['type']] };
                }
            }
            return null;
        };
        
        batch.forEach(op => {
            let meta = getMeta(op.assetId);
            if (!meta) return;
            
            let familyToProcess = [];
            let limit = parseInt(op.scanQty || op.undoQty, 10) || 1;
            for(let q=0; q<limit; q++) familyToProcess.push(meta);
            
            // ALWAYS READ THE NEWEST VERSION (LIVE CONTAINER CONTENTS)
            for (let i = 1; i < paData.length; i++) {
                if (String(paData[i][pMap['project_uid']]) === String(projectId) && String(paData[i][pMap['container_uid']]) === String(op.assetId)) {
                    let childId = paData[i][pMap['asset_uid']];
                    let cQty = parseInt(paData[i][pMap['assigned_quantity']], 10) || 1;
                    let cMeta = getMeta(childId);
                    if (cMeta) { for(let q=0; q<(cQty * limit); q++) familyToProcess.push(cMeta); }
                }
            }
            
            if (op.action === 'scan') {
                familyToProcess.forEach(m => {
                    let alreadyExists = sessionRows.some(r => String(r[lMap['asset_uid']]) === String(m.id));
                    if (!alreadyExists || m.type === 'Bulk') {
                        let newRow = new Array(Object.keys(lMap).length).fill("");
                        if(lMap['uid'] !== undefined) newRow[lMap['uid']] = Utilities.getUuid();
                        if(lMap['session_uid'] !== undefined) newRow[lMap['session_uid']] = sessionUid;
                        if(lMap['project_uid'] !== undefined) newRow[lMap['project_uid']] = projectId;
                        if(lMap['operation_type'] !== undefined) newRow[lMap['operation_type']] = operationType;
                        if(lMap['asset_uid'] !== undefined) newRow[lMap['asset_uid']] = m.id;
                        if(lMap['asset_code'] !== undefined) newRow[lMap['asset_code']] = m.assetCode;
                        if(lMap['asset_name'] !== undefined) newRow[lMap['asset_name']] = m.name;
                        if(lMap['department'] !== undefined) newRow[lMap['department']] = m.department;
                        if(lMap['rfid_tag'] !== undefined) newRow[lMap['rfid_tag']] = m.tagValue;
                        if(lMap['timestamp'] !== undefined) newRow[lMap['timestamp']] = new Date().toISOString();
                        if(lMap['actor'] !== undefined) newRow[lMap['actor']] = actor;
                        sessionRows.push(newRow);
                    }
                });
            } else if (op.action === 'undo') {
                familyToProcess.forEach(m => {
                    for (let i = sessionRows.length - 1; i >= 0; i--) {
                        if (String(sessionRows[i][lMap['asset_uid']]) === String(m.id)) {
                            sessionRows.splice(i, 1);
                            break;
                        }
                    }
                });
            }
        });
        
        dalDeleteRowsByColumn_(sheets.opsLedger, 'session_uid', sessionUid);
        dalAppendRows_(sheets.opsLedger, sessionRows);
        
        dalLedgerInvalidateAfterOp_(projectId);
        
        let scannedMap = {};
        let totalScanned = 0;
        sessionRows.forEach(r => {
            let aId = r[lMap['asset_uid']];
            scannedMap[aId] = (scannedMap[aId] || 0) + 1;
            totalScanned++;
        });
        
        return { success: true, scannedCount: totalScanned, scannedMap: scannedMap };
   });
}

/**
 * Campaign Room R3d — warm RFID ops batch (Firebase ops slice; Sheets lag until END ROOM).
 */
function batchProcessOperationsFirestore_(projectId, batch, actor) {
  actor = actor || 'System UI';
  assertActorCanPerformAssetOperations(actor);
  if (!dalFirestoreIsConfigured_()) {
    throw new Error('Firebase not configured — cannot run ops while Campaign Room is warm.');
  }

  var peek = dalLedgerPeekActiveSession_(projectId);
  var operationType = String(peek.operationType || '');
  var sessionUid = String(peek.sessionUid || '');
  if (!operationType || !sessionUid) {
    throw new Error('No active operation for this event. Start Check-out or Check-in first.');
  }

  var roomUid = '';
  try {
    var sheetsAct = verifyDatabaseSchema(true);
    var rowAct = dalGetProjectIndexRow_(projectId, sheetsAct);
    if (rowAct) roomUid = dalReadCampaignRoom_(rowAct).campaignRoomUid || '';
  } catch (eRoom) { /* ignore */ }

  var snap = null;
  try { snap = dalReadOpsStateFromFirestore_(projectId); } catch (eRead) { snap = null; }
  if (!snap || !snap.present || String(snap.sessionUid || '') !== sessionUid) {
    try {
      if (typeof dalEnsureOpsElevated_ === 'function') {
        dalEnsureOpsElevated_(projectId, roomUid, actor);
      } else {
        dalSnapshotOpsToFirestore_(projectId, roomUid, actor);
      }
      snap = dalReadOpsStateFromFirestore_(projectId);
    } catch (eSnap) {
      throw new Error('WARM_OPS_SEED_FAILED: ' + (eSnap && eSnap.message ? eSnap.message : eSnap));
    }
  }

  var rows = (snap.rows || []).slice();
  var vaultSheets = verifyVaultSchema(true);
  var vaultData = getSheetData(vaultSheets.assets);
  var vMap = vaultData.hMap;

  var getMeta = function (id) {
    for (var v = 1; v < vaultData.length; v++) {
      if (String(vaultData[v][vMap['uid']]) === String(id)) {
        return {
          id: id,
          assetCode: vaultData[v][vMap['unit_number']] || 'BULK',
          name: vaultData[v][vMap['name']],
          department: vaultData[v][vMap['department']],
          tagValue: vaultData[v][vMap['rfid_tag']] || 'UNASSIGNED',
          status: vaultData[v][vMap['status']],
          type: vaultData[v][vMap['type']]
        };
      }
    }
    return null;
  };

  // Container children: prefer warm PA when prep open, else Sheets.
  var childByContainer = {};
  try {
    var paList = [];
    if (typeof resolveDalSessionStatus_ === 'function' &&
        resolveDalSessionStatus_(projectId, DAL_DOMAIN.PROJECT_ASSETS) === DAL_SESSION.SESSION_OPEN &&
        typeof getProjectAssetsFirestore_ === 'function') {
      var paRes = getProjectAssetsFirestore_(projectId, '', '');
      paList = (paRes && paRes.current) || [];
      paList.forEach(function (pa) {
        if (!pa || !pa.containerUid) return;
        var cUid = String(pa.containerUid);
        if (!childByContainer[cUid]) childByContainer[cUid] = [];
        childByContainer[cUid].push({
          assetId: pa.assetId,
          qty: parseInt(pa.qty, 10) || 1
        });
      });
    } else {
      var sheetsPa = verifyDatabaseSchema(true);
      var paData = sheetsPa.projectAssets.getDataRange().getValues();
      var pMap = {};
      if (paData.length > 0) paData[0].forEach(function (h, i) { pMap[h.toString().trim()] = i; });
      for (var pi = 1; pi < paData.length; pi++) {
        if (String(paData[pi][pMap['project_uid']]) !== String(projectId)) continue;
        var cUid2 = String(paData[pi][pMap['container_uid']] || '');
        if (!cUid2) continue;
        if (!childByContainer[cUid2]) childByContainer[cUid2] = [];
        childByContainer[cUid2].push({
          assetId: paData[pi][pMap['asset_uid']],
          qty: parseInt(paData[pi][pMap['assigned_quantity']], 10) || 1
        });
      }
    }
  } catch (ePa) { childByContainer = {}; }

  (batch || []).forEach(function (op) {
    if (!op || !op.assetId) return;
    var meta = getMeta(op.assetId);
    if (!meta) return;
    var familyToProcess = [];
    var limit = parseInt(op.scanQty || op.undoQty, 10) || 1;
    var q;
    for (q = 0; q < limit; q++) familyToProcess.push(meta);
    var kids = childByContainer[String(op.assetId)] || [];
    kids.forEach(function (kid) {
      var cMeta = getMeta(kid.assetId);
      if (!cMeta) return;
      var kq;
      for (kq = 0; kq < (kid.qty * limit); kq++) familyToProcess.push(cMeta);
    });

    if (op.action === 'scan') {
      familyToProcess.forEach(function (m) {
        var alreadyExists = rows.some(function (r) { return String(r.asset_uid) === String(m.id); });
        if (!alreadyExists || m.type === 'Bulk') {
          rows.push({
            uid: Utilities.getUuid(),
            session_uid: sessionUid,
            project_uid: projectId,
            operation_type: operationType,
            asset_uid: m.id,
            asset_code: m.assetCode,
            asset_name: m.name,
            department: m.department,
            rfid_tag: m.tagValue,
            timestamp: new Date().toISOString(),
            actor: actor
          });
        }
      });
    } else if (op.action === 'undo') {
      familyToProcess.forEach(function (m) {
        for (var i = rows.length - 1; i >= 0; i--) {
          if (String(rows[i].asset_uid) === String(m.id)) {
            rows.splice(i, 1);
            break;
          }
        }
      });
    }
  });

  var written = dalWriteOpsStateToFirestore_(projectId, rows, sessionUid, operationType, actor, roomUid);
  try {
    firestoreSetOpsSessionMeta_(projectId, {
      roomUid: roomUid,
      status: 'open',
      domain: 'ops',
      activeOperation: operationType,
      activeSessionUid: sessionUid,
      lastActivityAt: new Date().toISOString()
    });
  } catch (eMeta) { /* non-fatal */ }
  try {
    executeWithRetry(function () {
      var sheets = verifyDatabaseSchema();
      var row = dalGetProjectIndexRow_(projectId, sheets);
      if (!row) return;
      dalWriteCampaignRoom_(sheets.index, row.rowNum, row.map, {
        campaignLastActivityAt: new Date().toISOString()
      });
    });
  } catch (eAct) { /* non-fatal */ }

  writeToAuditLog(actor, 'UPDATE', 'DAL_OPS_FIRESTORE', projectId, sessionUid,
    'Warm ops batch (R3d). rows=' + rows.length);
  return {
    success: true,
    warm: true,
    scannedCount: written.scannedCount,
    scannedMap: written.scannedMap
  };
}

// ==========================================
// --- FINALIZE OPERATION & PDF GENERATION ---
// ==========================================
function finalizeEventOperation(projectId, actor = "System UI") {
    return getLedgerRepo().finalizeOperation(projectId, actor);
}

function finalizeEventOperationSheets_(projectId, actor = "System UI") {
    return executeWithRetry(() => {
        assertActorCanPerformAssetOperations(actor);
        const sheets = verifyDatabaseSchema();
        let indexData = sheets.index.getDataRange().getValues();
        let iMap = {};
        if (indexData.length > 0) indexData[0].forEach((h, i) => iMap[h.toString().trim()] = i);
        
        let eventRow = -1;
        let operationType = "";
        let sessionUid = "";
        
        for (let i = 1; i < indexData.length; i++) {
            if (indexData[i][iMap['uid']] === projectId) {
                eventRow = i + 1;
                operationType = indexData[i][iMap['Active_Operation']];
                sessionUid = indexData[i][iMap['Active_Session_UID']];
                break;
            }
        }
        
        if (!operationType || !sessionUid) throw new Error("No active operation found.");
        
        let ledgerData = sheets.opsLedger.getDataRange().getValues();
        let lMap = {};
        if (ledgerData.length > 0) ledgerData[0].forEach((h, i) => lMap[h.toString().trim()] = i);
        
        let scannedItems = [];
        for (let i = 1; i < ledgerData.length; i++) {
            if (ledgerData[i][lMap['session_uid']] === sessionUid) {
                scannedItems.push(ledgerData[i]);
            }
        }
        
        if (scannedItems.length === 0) throw new Error("No items were scanned in this operation.");
        
        // TODO: In the next phase, we will pass `scannedItems` to Google Docs to generate the PDF Protocol
        // just like Python did with `create_protocol_pdf`.
        
        let newStatus = "";
        if (operationType === 'CHECK-OUT') newStatus = 'Checked Out';
        if (operationType === 'CHECK-IN') newStatus = 'Returned';
        
        // Clear the operation state
        sheets.index.getRange(eventRow, iMap['Active_Operation'] + 1).setValue("");
        sheets.index.getRange(eventRow, iMap['Active_Session_UID'] + 1).setValue("");
        if (newStatus && iMap['Status'] !== undefined) {
            sheets.index.getRange(eventRow, iMap['Status'] + 1).setValue(newStatus);
        }
        
        // TODO: Update the actual Asset Locations in the Vault to show they are on the Truck/Event.
        
        dalLedgerInvalidateAfterOp_(projectId);
        writeToAuditLog(actor, "UPDATE", "OPERATIONS", projectId, projectId, `Finalized ${operationType}. Processed ${scannedItems.length} items.`);
        
        return { success: true, message: `Protocol Generated. ${scannedItems.length} items processed.`, newStatus: newStatus };
    });
}