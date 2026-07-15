/**
 * SM Showrunner (smuruner) - Clean 8 Architecture
 * Dal_Repos.js - Data access layer: repository seams + SheetsAdapter (Phase 1–2)
 *
 * Public GAS APIs → repos → projectDataRouter → SheetsAdapter → *Sheets_* impls.
 *
 * IMPORTANT (GAS): Adapter/repo method names must NOT mirror global server API
 * names (saveProjectAssetsDelta, getProjectAssets, …) — those names are reserved
 * for google.script.run entry points. Use persist- and fetch- prefixed names on the adapter.
 */

// @INDEX: DAL -> Repository layer (Phase 1)

var __dalSheetsAdapterSingleton = null;
var __dalProjectAssetsRepoSingleton = null;
var __dalTimelineRepoSingleton = null;
var __dalLedgerRepoSingleton = null;

// ==========================================
// --- ADAPTER REGISTRY ---
// ==========================================

function getSheetsAdapter() {
  if (!__dalSheetsAdapterSingleton) {
    __dalSheetsAdapterSingleton = createSheetsAdapter_();
  }
  return __dalSheetsAdapterSingleton;
}

function getProjectAssetsRepo() {
  if (!__dalProjectAssetsRepoSingleton) {
    __dalProjectAssetsRepoSingleton = createProjectAssetsRepo_();
  }
  return __dalProjectAssetsRepoSingleton;
}

function getTimelineRepo() {
  if (!__dalTimelineRepoSingleton) {
    __dalTimelineRepoSingleton = createTimelineRepo_();
  }
  return __dalTimelineRepoSingleton;
}

function getLedgerRepo() {
  if (!__dalLedgerRepoSingleton) {
    __dalLedgerRepoSingleton = createLedgerRepo_();
  }
  return __dalLedgerRepoSingleton;
}

function dalAdapterFor_(projectId, domain) {
  return projectDataRouter(domain, resolveDalSessionStatus_(projectId, domain));
}

// ==========================================
// --- SHEETS ADAPTER (delegates to *Sheets_* impls) ---
// ==========================================

function createSheetsAdapter_() {
  return {
    persistProjectAssetsDelta: function (projectId, deltas, actor) {
      return saveProjectAssetsDeltaSheets_(projectId, deltas, actor);
    },
    fetchProjectAssets: function (projectId, startDateStr, endDateStr) {
      return getProjectAssetsSheets_(projectId, startDateStr, endDateStr);
    },
    persistTimelineData: function (folderId, mode, shifts, crewUids, phases, overrides, clientTimestamp, actor, subEvents) {
      return saveTimelineDataSheets_(folderId, mode, shifts, crewUids, phases, overrides, clientTimestamp, actor, subEvents);
    },
    fetchTimelineData: function (folderId, mode) {
      return getTimelineDataSheets_(folderId, mode);
    },
    persistOperationsBatch: function (projectId, batch, actor) {
      return batchProcessOperationsSheets_(projectId, batch, actor);
    },
    startOperationSession: function (projectId, operationType, actor) {
      return startEventOperationSheets_(projectId, operationType, actor);
    },
    finalizeOperationSession: function (projectId, actor) {
      return finalizeEventOperationSheets_(projectId, actor);
    },
    processRfidScanOp: function (projectId, rfidTag, actor) {
      return processRfidScanSheets_(projectId, rfidTag, actor);
    }
  };
}

// ==========================================
// --- DOMAIN REPOSITORIES ---
// ==========================================

function createProjectAssetsRepo_() {
  return {
    saveDelta: function (projectId, deltas, actor) {
      return dalAdapterFor_(projectId, DAL_DOMAIN.PROJECT_ASSETS).persistProjectAssetsDelta(projectId, deltas, actor);
    },
    getForProject: function (projectId, startDateStr, endDateStr) {
      return dalAdapterFor_(projectId, DAL_DOMAIN.PROJECT_ASSETS).fetchProjectAssets(projectId, startDateStr, endDateStr);
    }
  };
}

function createTimelineRepo_() {
  return {
    save: function (folderId, mode, shifts, crewUids, phases, overrides, clientTimestamp, actor, subEvents) {
      return dalAdapterFor_(folderId, DAL_DOMAIN.TIMELINE).persistTimelineData(folderId, mode, shifts, crewUids, phases, overrides, clientTimestamp, actor, subEvents);
    },
    getForProject: function (folderId, mode) {
      return dalAdapterFor_(folderId, DAL_DOMAIN.TIMELINE).fetchTimelineData(folderId, mode);
    }
  };
}

function createLedgerRepo_() {
  return {
    batchProcess: function (projectId, batch, actor) {
      return dalAdapterFor_(projectId, DAL_DOMAIN.LEDGER).persistOperationsBatch(projectId, batch, actor);
    },
    startOperation: function (projectId, operationType, actor) {
      return dalAdapterFor_(projectId, DAL_DOMAIN.LEDGER).startOperationSession(projectId, operationType, actor);
    },
    finalizeOperation: function (projectId, actor) {
      return dalAdapterFor_(projectId, DAL_DOMAIN.LEDGER).finalizeOperationSession(projectId, actor);
    },
    processRfidScan: function (projectId, rfidTag, actor) {
      return dalAdapterFor_(projectId, DAL_DOMAIN.LEDGER).processRfidScanOp(projectId, rfidTag, actor);
    }
  };
}

// ==========================================
// --- PHASE 3 SHEET WRITE HELPERS (scoped rows — no clearContents) ---
// ==========================================

function dalHeaderMapFromRows_(headerRow) {
  var map = {};
  if (!headerRow) return map;
  headerRow.forEach(function (h, i) { map[h.toString().trim()] = i; });
  return map;
}

/**
 * Delete rows where column === matchValue (bottom-first). Returns header map + deleted row copies.
 */
function dalDeleteRowsByColumn_(sheet, columnName, matchValue) {
  var data = sheet.getDataRange().getValues();
  if (data.length === 0) return { map: {}, cols: 0, deletedRows: [] };
  var map = dalHeaderMapFromRows_(data[0]);
  var colIdx = map[columnName];
  if (colIdx === undefined) return { map: map, cols: data[0].length, deletedRows: [] };
  var deletedRows = [];
  var rowNums = [];
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][colIdx]) === String(matchValue)) {
      deletedRows.push(data[i]);
      rowNums.push(i + 1);
    }
  }
  rowNums.sort(function (a, b) { return b - a; }).forEach(function (r) { sheet.deleteRows(r, 1); });
  return { map: map, cols: data[0].length, deletedRows: deletedRows };
}

function dalAppendRows_(sheet, rows) {
  if (!rows || rows.length === 0) return;
  var startRow = Math.max(sheet.getLastRow(), 1) + 1;
  if (sheet.getLastRow() === 0) startRow = 1;
  sheet.getRange(startRow, 1, rows.length, rows[0].length).setValues(rows);
}

function dalUpdateSheetRow_(sheet, sheetRow, rowData) {
  sheet.getRange(sheetRow, 1, 1, rowData.length).setValues([rowData]);
}

function dalDeleteSheetRows_(sheet, rowNums) {
  rowNums.slice().sort(function (a, b) { return b - a; }).forEach(function (r) { sheet.deleteRows(r, 1); });
}
