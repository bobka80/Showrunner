/**
 * SM Showrunner (smuruner) - Clean 8 Architecture
 * Dal_Repos.js - Data access layer: repository seams + SheetsAdapter (Phase 1)
 *
 * Zero behavior change: adapter delegates to existing Logistics_* / Operations.js
 * functions. Public GAS entry points remain unchanged until Slice B rewiring.
 */

// @INDEX: DAL -> Repository layer (Phase 1)

// ==========================================
// --- ADAPTER REGISTRY (Sheets only — Phase 1) ---
// ==========================================

function getSheetsAdapter() {
  if (typeof getSheetsAdapter._instance === 'undefined') {
    getSheetsAdapter._instance = new SheetsAdapter_();
  }
  return getSheetsAdapter._instance;
}

function getProjectAssetsRepo() {
  if (typeof getProjectAssetsRepo._instance === 'undefined') {
    getProjectAssetsRepo._instance = new ProjectAssetsRepo_(getSheetsAdapter());
  }
  return getProjectAssetsRepo._instance;
}

function getTimelineRepo() {
  if (typeof getTimelineRepo._instance === 'undefined') {
    getTimelineRepo._instance = new TimelineRepo_(getSheetsAdapter());
  }
  return getTimelineRepo._instance;
}

function getLedgerRepo() {
  if (typeof getLedgerRepo._instance === 'undefined') {
    getLedgerRepo._instance = new LedgerRepo_(getSheetsAdapter());
  }
  return getLedgerRepo._instance;
}

// ==========================================
// --- SHEETS ADAPTER (delegates to existing save/read paths) ---
// ==========================================

function SheetsAdapter_() {}

SheetsAdapter_.prototype.saveProjectAssetsDelta = function (projectId, deltas, actor) {
  return saveProjectAssetsDelta(projectId, deltas, actor);
};

SheetsAdapter_.prototype.getProjectAssets = function (projectId, startDateStr, endDateStr) {
  return getProjectAssets(projectId, startDateStr, endDateStr);
};

SheetsAdapter_.prototype.saveTimelineData = function (folderId, mode, shifts, crewUids, phases, overrides, clientTimestamp, actor, subEvents) {
  return saveTimelineData(folderId, mode, shifts, crewUids, phases, overrides, clientTimestamp, actor, subEvents);
};

SheetsAdapter_.prototype.getTimelineData = function (folderId, mode) {
  return getTimelineData(folderId, mode);
};

SheetsAdapter_.prototype.batchProcessOperations = function (projectId, batch, actor) {
  return batchProcessOperations(projectId, batch, actor);
};

SheetsAdapter_.prototype.startEventOperation = function (projectId, operationType, actor) {
  return startEventOperation(projectId, operationType, actor);
};

SheetsAdapter_.prototype.finalizeEventOperation = function (projectId, actor) {
  return finalizeEventOperation(projectId, actor);
};

SheetsAdapter_.prototype.processRfidScan = function (projectId, rfidTag, actor) {
  return processRfidScan(projectId, rfidTag, actor);
};

// ==========================================
// --- DOMAIN REPOSITORIES ---
// ==========================================

function ProjectAssetsRepo_(adapter) {
  this._adapter = adapter;
}

ProjectAssetsRepo_.prototype.saveDelta = function (projectId, deltas, actor) {
  return this._adapter.saveProjectAssetsDelta(projectId, deltas, actor);
};

ProjectAssetsRepo_.prototype.getForProject = function (projectId, startDateStr, endDateStr) {
  return this._adapter.getProjectAssets(projectId, startDateStr, endDateStr);
};

function TimelineRepo_(adapter) {
  this._adapter = adapter;
}

TimelineRepo_.prototype.save = function (folderId, mode, shifts, crewUids, phases, overrides, clientTimestamp, actor, subEvents) {
  return this._adapter.saveTimelineData(folderId, mode, shifts, crewUids, phases, overrides, clientTimestamp, actor, subEvents);
};

TimelineRepo_.prototype.getForProject = function (folderId, mode) {
  return this._adapter.getTimelineData(folderId, mode);
};

function LedgerRepo_(adapter) {
  this._adapter = adapter;
}

LedgerRepo_.prototype.batchProcess = function (projectId, batch, actor) {
  return this._adapter.batchProcessOperations(projectId, batch, actor);
};

LedgerRepo_.prototype.startOperation = function (projectId, operationType, actor) {
  return this._adapter.startEventOperation(projectId, operationType, actor);
};

LedgerRepo_.prototype.finalizeOperation = function (projectId, actor) {
  return this._adapter.finalizeEventOperation(projectId, actor);
};

LedgerRepo_.prototype.processRfidScan = function (projectId, rfidTag, actor) {
  return this._adapter.processRfidScan(projectId, rfidTag, actor);
};
