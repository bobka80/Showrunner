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
