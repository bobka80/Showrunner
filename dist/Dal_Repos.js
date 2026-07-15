/**
 * SM Showrunner (smuruner) - Clean 8 Architecture
 * Dal_Repos.js - Data access layer: repository seams + SheetsAdapter (Phase 1)
 *
 * Zero behavior change: public GAS APIs delegate to repos; SheetsAdapter calls
 * *Sheets_* impl functions in Logistics_* / Operations.js (Slice B).
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
// --- ADAPTER REGISTRY (Sheets only — Phase 1) ---
// ==========================================

function getSheetsAdapter() {
  if (!__dalSheetsAdapterSingleton) {
    __dalSheetsAdapterSingleton = createSheetsAdapter_();
  }
  return __dalSheetsAdapterSingleton;
}

function getProjectAssetsRepo() {
  if (!__dalProjectAssetsRepoSingleton) {
    __dalProjectAssetsRepoSingleton = createProjectAssetsRepo_(getSheetsAdapter());
  }
  return __dalProjectAssetsRepoSingleton;
}

function getTimelineRepo() {
  if (!__dalTimelineRepoSingleton) {
    __dalTimelineRepoSingleton = createTimelineRepo_(getSheetsAdapter());
  }
  return __dalTimelineRepoSingleton;
}

function getLedgerRepo() {
  if (!__dalLedgerRepoSingleton) {
    __dalLedgerRepoSingleton = createLedgerRepo_(getSheetsAdapter());
  }
  return __dalLedgerRepoSingleton;
}

// ==========================================
// --- SHEETS ADAPTER (delegates to existing save/read paths) ---
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

function createProjectAssetsRepo_(adapter) {
  return {
    saveDelta: function (projectId, deltas, actor) {
      return adapter.persistProjectAssetsDelta(projectId, deltas, actor);
    },
    getForProject: function (projectId, startDateStr, endDateStr) {
      return adapter.fetchProjectAssets(projectId, startDateStr, endDateStr);
    }
  };
}

function createTimelineRepo_(adapter) {
  return {
    save: function (folderId, mode, shifts, crewUids, phases, overrides, clientTimestamp, actor, subEvents) {
      return adapter.persistTimelineData(folderId, mode, shifts, crewUids, phases, overrides, clientTimestamp, actor, subEvents);
    },
    getForProject: function (folderId, mode) {
      return adapter.fetchTimelineData(folderId, mode);
    }
  };
}

function createLedgerRepo_(adapter) {
  return {
    batchProcess: function (projectId, batch, actor) {
      return adapter.persistOperationsBatch(projectId, batch, actor);
    },
    startOperation: function (projectId, operationType, actor) {
      return adapter.startOperationSession(projectId, operationType, actor);
    },
    finalizeOperation: function (projectId, actor) {
      return adapter.finalizeOperationSession(projectId, actor);
    },
    processRfidScan: function (projectId, rfidTag, actor) {
      return adapter.processRfidScanOp(projectId, rfidTag, actor);
    }
  };
}
