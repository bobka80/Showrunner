/**
 * SM Showrunner (smuruner) - Clean 8 Architecture
 * Dal_Firebase.js - FirebaseAdapter (Phase 4 — PA prep + timeline collab fork via GAS Firestore REST)
 *
 * Prep session: PA reads/writes Firestore.
 * Timeline collab session: timeline reads/writes Firestore.
 * Ledger: Sheets SoT when cold; Campaign Room R3 warm path uses projects/{id}/logistics/state.
 */

// @INDEX: DAL -> Firebase adapter (Phase 4)

var __dalFirebaseAdapterSingleton = null;

var DAL_FIRESTORE_PA_COLLECTION = 'assets';
var DAL_FIRESTORE_TIMELINE_COLLECTION = 'timeline';
var DAL_FIRESTORE_META_COLLECTION = 'meta';
var DAL_FIRESTORE_LOGISTICS_COLLECTION = 'logistics';
var DAL_FIRESTORE_OPS_COLLECTION = 'ops';

/** H4 — keep in sync with scripts/lib/dal-state-size-mirror-core.js */
var DAL_STATE_WARN_BYTES = 512 * 1024;
var DAL_STATE_MAX_BYTES = 900 * 1024;
var DAL_STATE_WARN_COUNT = 1500;
var DAL_STATE_MAX_COUNT = 4000;

function dalStateSizeReport_(opts) {
  opts = opts || {};
  var bytes = 0;
  if (opts.json != null) bytes = String(opts.json).length;
  else if (opts.payload !== undefined) {
    try { bytes = JSON.stringify(opts.payload).length; } catch (e0) { bytes = 0; }
  }
  var count = Number(opts.count || 0) || 0;
  var overMax = bytes >= DAL_STATE_MAX_BYTES || count >= DAL_STATE_MAX_COUNT;
  var overWarn = !overMax && (bytes >= DAL_STATE_WARN_BYTES || count >= DAL_STATE_WARN_COUNT);
  return { bytes: bytes, count: count, overWarn: overWarn, overMax: overMax, ok: !overMax };
}

function dalPaFormulaIsAuto_(formula) {
  var f = String(formula || '');
  return f === 'Auto-Container' || f === 'Gen-Auto-Container' ||
    f.indexOf('[AUTO] ') === 0 || f.indexOf('[GEN_AUTO] ') === 0;
}

function dalPaFixtureIsAuto_(pa) {
  if (!pa) return true;
  if (pa.isAuto || pa.isGenericAuto) return true;
  return dalPaFormulaIsAuto_(pa.formula);
}

function dalPaFixtureSigRow_(pa) {
  pa = pa || {};
  return [
    String(pa.uid || ''),
    String(pa.assetId || pa.asset_uid || ''),
    String(pa.qty != null ? pa.qty : (pa.assigned_quantity != null ? pa.assigned_quantity : 1)),
    String(pa.location || 'General'),
    String(pa.formula || 'Standalone'),
    (pa.isShortage === true || pa.isShortage === 'true' || String(pa.formula || '').indexOf('[SHORT] ') === 0) ? '1' : '0',
    String(pa.overrideDept || pa.override_dept || ''),
    String(pa.containerUid || pa.container_uid || '')
  ].join('\t');
}

function dalPaMirrorCompare_(stateFixtures, collectionFixtures) {
  var stateBy = {};
  var colBy = {};
  (stateFixtures || []).forEach(function (pa) {
    if (!pa || !pa.uid || dalPaFixtureIsAuto_(pa)) return;
    stateBy[String(pa.uid)] = pa;
  });
  (collectionFixtures || []).forEach(function (pa) {
    if (!pa || !pa.uid || dalPaFixtureIsAuto_(pa)) return;
    colBy[String(pa.uid)] = pa;
  });
  var missingInCollection = [];
  var missingInState = [];
  var fieldMismatches = [];
  Object.keys(stateBy).forEach(function (uid) {
    if (!colBy[uid]) missingInCollection.push(uid);
    else if (dalPaFixtureSigRow_(stateBy[uid]) !== dalPaFixtureSigRow_(colBy[uid])) fieldMismatches.push(uid);
  });
  Object.keys(colBy).forEach(function (uid) {
    if (!stateBy[uid]) missingInState.push(uid);
  });
  var ok = !missingInCollection.length && !missingInState.length && !fieldMismatches.length;
  var parts = [];
  if (missingInCollection.length) parts.push('state-only:' + missingInCollection.length);
  if (missingInState.length) parts.push('collection-only:' + missingInState.length);
  if (fieldMismatches.length) parts.push('field-diff:' + fieldMismatches.length);
  return {
    ok: ok,
    missingInCollection: missingInCollection,
    missingInState: missingInState,
    fieldMismatches: fieldMismatches,
    summary: ok ? 'ok' : parts.join(' ')
  };
}

function dalReadPaStateFixtures_(projectId) {
  var doc = firestoreFetch_('get', dalFirestorePaCollection_(projectId) + '/state');
  if (!doc || !doc.fields) return { fixtures: [], fixturesJson: '[]', writeSeq: 0 };
  var plain = firestoreDecodeFields_(doc.fields);
  var fixtures = [];
  try { fixtures = JSON.parse(plain.fixturesJson || '[]'); } catch (e1) { fixtures = []; }
  if (!Array.isArray(fixtures)) fixtures = [];
  return {
    fixtures: fixtures,
    fixturesJson: plain.fixturesJson || JSON.stringify(fixtures),
    writeSeq: Number(plain.writeSeq || 0) || 0
  };
}

/**
 * Live assets/state fixture shape (camelCase truck fields) from a sheet-column PA object.
 * Keep flush / delta / truck-arrange / snapshot builders aligned.
 */
function dalPaObjToLiveFixture_(obj) {
  obj = obj || {};
  var formula = obj.formula || '';
  var isShortage = String(formula).indexOf('[SHORT] ') === 0;
  if (isShortage) formula = formula.substring(8);
  var isGenericAuto = false;
  var isAuto = false;
  if (String(formula).indexOf('[GEN_AUTO] ') === 0) {
    isGenericAuto = true;
    isAuto = true;
    formula = formula.substring(11);
  } else if (String(formula).indexOf('[AUTO] ') === 0) {
    isAuto = true;
    formula = formula.substring(7);
  } else if (formula === 'Gen-Auto-Container') {
    isGenericAuto = true;
    isAuto = true;
    formula = 'Standalone';
  } else if (formula === 'Auto-Container') {
    isAuto = true;
    formula = 'Standalone';
  }
  var fix = {
    uid: String(obj.uid || ''),
    assetId: String(obj.asset_uid || ''),
    qty: obj.assigned_quantity != null ? obj.assigned_quantity : 1,
    location: obj.location || 'General',
    formula: formula,
    isShortage: isShortage,
    isAuto: isAuto,
    isGenericAuto: isGenericAuto,
    creator: obj.creator || 'System',
    overrideDept: obj.override_dept || '',
    containerUid: obj.container_uid || '',
    scanStatus: obj.scan_status || 'Assigned',
    outboundTruckUid: '',
    outboundX: null,
    outboundY: null,
    outboundZ: null,
    outboundRotated: false,
    outboundStaged: false,
    inboundTruckUid: '',
    inboundX: null,
    inboundY: null,
    inboundZ: null,
    inboundRotated: false,
    inboundStaged: false
  };
  return fix;
}

function dalPaFixtureToCommitObj_(pa, projectId) {
  var formula = pa.formula || 'Standalone';
  if ((pa.isShortage === true || pa.isShortage === 'true') && String(formula).indexOf('[SHORT] ') !== 0) {
    formula = '[SHORT] ' + formula;
  }
  var obj = {
    uid: String(pa.uid || ''),
    project_uid: String(projectId || ''),
    asset_uid: String(pa.assetId || pa.asset_uid || ''),
    assigned_quantity: pa.qty != null ? pa.qty : (pa.assigned_quantity != null ? pa.assigned_quantity : 1),
    location: pa.location || 'General',
    formula: formula,
    creator: pa.creator || 'System',
    override_dept: pa.overrideDept || pa.override_dept || '',
    container_uid: pa.containerUid || pa.container_uid || '',
    scan_status: pa.scanStatus || pa.scan_status || 'Assigned'
  };
  // M4: movement lives on Logistics_Ledger — never commit truck cols onto Project_Assets
  return obj;
}

function getFirebaseAdapter() {
  if (!__dalFirebaseAdapterSingleton) {
    __dalFirebaseAdapterSingleton = createFirebaseAdapter_();
  }
  return __dalFirebaseAdapterSingleton;
}

function dalFirestorePaCollection_(projectId) {
  return 'projects/' + projectId + '/' + DAL_FIRESTORE_PA_COLLECTION;
}

function dalFirestoreLogisticsCollection_(projectId) {
  return 'projects/' + projectId + '/' + DAL_FIRESTORE_LOGISTICS_COLLECTION;
}

// ==========================================
// --- Campaign Room R3c — project identity on meta/state ---
// Room lifecycle fields stay flat on meta/state.
// Nested identity uses *Json string fields (same pattern as logistics legsJson).
// ==========================================

function dalNormalizeSubEventFragment_(t) {
  if (!t) return null;
  var date = String(t.Event_Date || t.date || '').trim();
  if (!date) return null;
  return {
    uid: String(t.uid || t.id || ''),
    type: String(t.Sub_Event_Type || t.type || 'MAIN'),
    date: date,
    startTime: String(t.Start_Time || t.startTime || '').replace(/^'/, ''),
    endTime: String(t.End_Time || t.endTime || '').replace(/^'/, ''),
    note: String(t.Note || t.note || '')
  };
}

function dalParseSubEventsFromMeta_(meta) {
  if (!meta || meta.subEventsJson == null || meta.subEventsJson === '') return [];
  try {
    var arr = JSON.parse(meta.subEventsJson);
    if (!Array.isArray(arr)) return [];
    return arr.map(dalNormalizeSubEventFragment_).filter(Boolean);
  } catch (eParse) {
    return [];
  }
}

/** Cap concurrent warm Firebase overlays per Tracker/Conflicts open (meta calendar family). */
var DAL_WARM_READER_OVERLAY_CAP_ = 25;

function dalIndexRowCampaignWarm_(row, iMap) {
  if (!row || !iMap) return false;
  var col = iMap['Dal_Campaign_Room_Status'];
  if (col === undefined) return false;
  var roomSt = String(row[col] || '');
  if (typeof dalStatusIsForkLive_ === 'function') return dalStatusIsForkLive_(roomSt);
  var s = roomSt.toLowerCase();
  return s === 'open' || s === 'opening' || s === 'committing';
}

/** Warm Campaign Room project ids from Index sheet data (skip cancelled/trashed). */
function dalListWarmCampaignProjectIds_(indexData, iMap) {
  var out = [];
  if (!indexData || !iMap) return out;
  var uidCol = iMap['uid'] !== undefined ? iMap['uid'] : iMap['Project_ID'];
  var statusCol = iMap['Status'];
  for (var i = 1; i < indexData.length; i++) {
    var status = statusCol !== undefined ? String(indexData[i][statusCol] || '').toUpperCase() : '';
    if (status === 'CANCELLED' || status === 'TRASHED') continue;
    if (!dalIndexRowCampaignWarm_(indexData[i], iMap)) continue;
    var pid = uidCol !== undefined ? String(indexData[i][uidCol] || '') : '';
    if (!pid || pid === 'uid') continue;
    out.push(pid);
  }
  return out;
}

/**
 * W2 warm readers — one-shot Firebase overlay for Tracker/Conflicts.
 * Fail-open per project/slice. Caps successful project overlays (default 25).
 * PA/ledger replace only when Firebase returns non-empty rows/legs.
 */
function dalWarmReaderOneShotOverlay_(projectIds, opts) {
  opts = opts || {};
  var cap = opts.cap != null ? Number(opts.cap) : DAL_WARM_READER_OVERLAY_CAP_;
  if (!(cap > 0)) cap = DAL_WARM_READER_OVERLAY_CAP_;
  var wantMeta = opts.meta !== false;
  var wantPa = opts.pa !== false;
  var wantLl = opts.logistics !== false;
  var wantTl = !!opts.timeline;
  var out = {
    subEvents: {},
    names: {},
    paRows: {},
    paMap: null,
    ledger: {},
    timeline: {},
    count: 0
  };
  if (!projectIds || !projectIds.length) return out;
  var hdr = null;
  for (var i = 0; i < projectIds.length; i++) {
    if (out.count >= cap) break;
    var pid = String(projectIds[i] || '');
    if (!pid) continue;
    var got = false;
    if (wantMeta && typeof firestoreGetCampaignMeta_ === 'function') {
      try {
        var meta = firestoreGetCampaignMeta_(pid);
        if (meta) {
          if (meta.name) out.names[pid] = String(meta.name);
          var frags = dalParseSubEventsFromMeta_(meta);
          if (frags.length) {
            out.subEvents[pid] = frags;
            got = true;
          } else if (meta.identityUpdatedAt || meta.status) {
            got = true;
          }
        }
      } catch (eMeta) { /* Sheets fallthrough */ }
    }
    if (wantPa && typeof dalLoadPaProjectRowsFromFirebase_ === 'function' &&
        typeof dalGetProjectAssetsHeaderAndMap_ === 'function') {
      try {
        if (!hdr) hdr = dalGetProjectAssetsHeaderAndMap_();
        var rows = dalLoadPaProjectRowsFromFirebase_(pid, hdr.header, hdr.map);
        if (rows && rows.length) {
          out.paRows[pid] = rows.map(function (r) { return r.data; });
          out.paMap = hdr.map;
          got = true;
        }
      } catch (ePa) { /* Sheets fallthrough */ }
    }
    if (wantLl && typeof dalReadLogisticsStateFromFirebase_ === 'function' &&
        typeof logisticsLedgerLegsMapFromObjects_ === 'function') {
      try {
        var ll = dalReadLogisticsStateFromFirebase_(pid);
        if (ll && ll.present && ll.legs && ll.legs.length) {
          out.ledger[pid] = logisticsLedgerLegsMapFromObjects_(ll.legs);
          got = true;
        }
      } catch (eLl) { /* Sheets fallthrough */ }
    }
    if (wantTl && typeof dalReadTimelineStateFromFirebase_ === 'function') {
      try {
        var tl = dalReadTimelineStateFromFirebase_(pid);
        if (tl && ((tl.shifts && tl.shifts.length) || (tl.phases && tl.phases.length))) {
          out.timeline[pid] = tl;
          got = true;
        }
      } catch (eTl) { /* Sheets fallthrough */ }
    }
    if (got) out.count++;
  }
  return out;
}

/** Replace per-project PA sheet rows with warm Firebase rows (Sheets-shaped table + hMap). */
function dalMergeWarmPaSheetRows_(paData, paMap, warmPaRowsByPid) {
  if (!warmPaRowsByPid || !Object.keys(warmPaRowsByPid).length) return paData;
  var out = [];
  if (paData && paData.length) out.push(paData[0]);
  var pidCol = paMap && (paMap['project_uid'] !== undefined ? paMap['project_uid'] : paMap['Project_ID']);
  for (var i = 1; i < (paData ? paData.length : 0); i++) {
    var pUid = pidCol !== undefined ? String(paData[i][pidCol] || '') : '';
    if (warmPaRowsByPid[pUid]) continue;
    out.push(paData[i]);
  }
  Object.keys(warmPaRowsByPid).forEach(function (pid) {
    (warmPaRowsByPid[pid] || []).forEach(function (row) { out.push(row); });
  });
  out.hMap = paMap;
  return out;
}

/** Sheets → plain identity for elevation / commit compare. */
function dalReadProjectIdentityFromSheets_(projectId) {
  var sheets = verifyDatabaseSchema(true);
  var indexData = getSheetData(sheets.index);
  var timelineData = getSheetData(sheets.timelines);
  var iMap = indexData.hMap || {};
  var tMap = timelineData.hMap || {};
  var out = {
    name: '',
    client: '',
    projectStatus: 'Draft',
    type: 'Event',
    locationUrl: '',
    difficultyMultiplier: 1,
    folderId: '',
    managerEmail: '',
    readinessState: {},
    lastUpdated: '',
    subEvents: []
  };
  for (var i = 1; i < indexData.length; i++) {
    if (String(indexData[i][iMap['uid']] || '') !== String(projectId)) continue;
    out.name = String(indexData[i][iMap['Project_Name']] || '');
    out.client = iMap['Client'] !== undefined ? String(indexData[i][iMap['Client']] || '') : '';
    out.projectStatus = String(indexData[i][iMap['Status']] || 'Draft');
    out.type = String(indexData[i][iMap['Project_Type']] || 'Event');
    out.locationUrl = iMap['Location_URL'] !== undefined ? String(indexData[i][iMap['Location_URL']] || '') : '';
    out.difficultyMultiplier = parseFloat(indexData[i][iMap['Difficulty_Multiplier']]) || 1;
    out.folderId = iMap['Folder_ID'] !== undefined ? String(indexData[i][iMap['Folder_ID']] || '') : '';
    out.managerEmail = iMap['Manager_Email'] !== undefined ? String(indexData[i][iMap['Manager_Email']] || '') : '';
    out.lastUpdated = iMap['Last_Updated'] !== undefined ? String(indexData[i][iMap['Last_Updated']] || '') : '';
    try {
      if (iMap['Readiness_State'] !== undefined && indexData[i][iMap['Readiness_State']]) {
        out.readinessState = JSON.parse(indexData[i][iMap['Readiness_State']]);
      }
    } catch (eR) { out.readinessState = {}; }
    break;
  }
  var tPidCol = tMap['project_uid'] !== undefined ? tMap['project_uid'] : tMap['Project_ID'];
  for (var ti = 1; ti < timelineData.length; ti++) {
    var rowPid = tPidCol !== undefined ? timelineData[ti][tPidCol] : '';
    if (String(rowPid || '') !== String(projectId)) continue;
    var frag = dalNormalizeSubEventFragment_({
      uid: tMap['uid'] !== undefined ? timelineData[ti][tMap['uid']] : '',
      type: tMap['Sub_Event_Type'] !== undefined ? timelineData[ti][tMap['Sub_Event_Type']] : 'MAIN',
      date: tMap['Event_Date'] !== undefined ? timelineData[ti][tMap['Event_Date']] : '',
      startTime: tMap['Start_Time'] !== undefined ? timelineData[ti][tMap['Start_Time']] : '',
      endTime: tMap['End_Time'] !== undefined ? timelineData[ti][tMap['End_Time']] : '',
      note: tMap['Note'] !== undefined ? timelineData[ti][tMap['Note']] : ''
    });
    if (frag) {
      // Normalize Date objects from Sheets into YYYY-MM-DD
      if (timelineData[ti][tMap['Event_Date']] instanceof Date) {
        var d = timelineData[ti][tMap['Event_Date']];
        if (!isNaN(d.getTime())) {
          frag.date = d.getFullYear() + '-' +
            String(d.getMonth() + 1).padStart(2, '0') + '-' +
            String(d.getDate()).padStart(2, '0');
        }
      } else {
        var ds = String(frag.date || '');
        var iso = ds.match(/^(\d{4}-\d{2}-\d{2})/);
        if (iso) frag.date = iso[1];
      }
      if (frag.date) out.subEvents.push(frag);
    }
  }
  return out;
}

/** Overlay live Firebase identity onto a getExistingProjects row. */
function dalApplyCampaignIdentityOverlay_(projectObj, meta) {
  if (!projectObj || !meta || !meta.identityUpdatedAt) return projectObj;
  if (meta.name) {
    projectObj.title = meta.name;
    projectObj.fullTitle = meta.name;
  }
  if (meta.client !== undefined) projectObj.client = meta.client;
  if (meta.projectStatus) projectObj.status = meta.projectStatus;
  if (meta.type) projectObj.type = meta.type;
  if (meta.locationUrl !== undefined) projectObj.locationUrl = meta.locationUrl;
  if (meta.difficultyMultiplier !== undefined && meta.difficultyMultiplier !== '') {
    projectObj.difficultyMultiplier = parseFloat(meta.difficultyMultiplier) || 1;
  }
  if (meta.folderId) projectObj.folderId = meta.folderId;
  if (meta.readinessJson) {
    try { projectObj.readinessState = JSON.parse(meta.readinessJson); } catch (e0) { /* keep */ }
  }
  var frags = dalParseSubEventsFromMeta_(meta);
  if (frags.length) {
    projectObj.fragments = frags;
    projectObj.start = null;
    projectObj.end = null;
    frags.forEach(function (f) {
      if (!projectObj.start || f.date < projectObj.start) projectObj.start = f.date;
      if (!projectObj.end || f.date > projectObj.end) projectObj.end = f.date;
    });
  }
  projectObj.lastUpdated = meta.identityUpdatedAt || projectObj.lastUpdated;
  projectObj.identityFromMeta = true;
  return projectObj;
}

/**
 * Seed Sheets identity into meta/state when room opens (skip if already elevated).
 */
function dalSnapshotCampaignIdentityToFirestore_(projectId, roomUid, actor) {
  var cur = {};
  try { cur = firestoreGetCampaignMeta_(projectId) || {}; } catch (e0) { cur = {}; }
  if (cur.identityUpdatedAt) {
    return { elevated: true, already: true, skipped: true };
  }
  var id = dalReadProjectIdentityFromSheets_(projectId);
  var now = new Date().toISOString();
  var patch = {
    roomUid: String(roomUid || cur.roomUid || ''),
    status: cur.status || 'open',
    openedAt: cur.openedAt || now,
    openedBy: cur.openedBy || actor || 'System',
    lastActivityAt: now,
    lastPublishedAt: cur.lastPublishedAt || '',
    domain: 'meta',
    name: id.name || '',
    client: id.client || '',
    projectStatus: id.projectStatus || 'Draft',
    type: id.type || 'Event',
    locationUrl: id.locationUrl || '',
    difficultyMultiplier: id.difficultyMultiplier || 1,
    folderId: id.folderId || '',
    managerEmail: id.managerEmail || '',
    readinessJson: JSON.stringify(id.readinessState || {}),
    subEventsJson: JSON.stringify(id.subEvents || []),
    identityWriteSeq: 1,
    identityUpdatedAt: id.lastUpdated || now,
    identityUpdatedBy: actor || 'System'
  };
  firestoreSetCampaignMeta_(projectId, patch);
  return { elevated: true, already: false, subEventCount: (id.subEvents || []).length };
}

function dalEnsureCampaignIdentityElevated_(projectId, roomUid, actor) {
  try {
    return dalSnapshotCampaignIdentityToFirestore_(projectId, roomUid, actor);
  } catch (e) {
    return { elevated: false, error: String((e && e.message) || e) };
  }
}

/**
 * Warm Save & Sync — identity + sub-events live on Firebase meta; Sheets lag until END ROOM.
 */
function dalSaveProjectIdentityWarm_(projectData, timelinesArray, actor) {
  projectData = enforceCrossRentOnlyProjectFields_(actor, projectData || {});
  var projectId = String(projectData.Project_ID || '');
  if (!projectId || projectId === 'NEW') {
    throw new Error('Warm identity save requires an existing project id.');
  }
  if (typeof dalCampaignRoomIsWarmForProject_ === 'function' && !dalCampaignRoomIsWarmForProject_(projectId)) {
    throw new Error('Campaign room is not warm — use Sheets save.');
  }

  var cur = {};
  try { cur = firestoreGetCampaignMeta_(projectId) || {}; } catch (e0) { cur = {}; }
  if (!cur.identityUpdatedAt) {
    try { dalSnapshotCampaignIdentityToFirestore_(projectId, cur.roomUid || '', actor); } catch (eSeed) { /* continue */ }
    try { cur = firestoreGetCampaignMeta_(projectId) || cur; } catch (e1) { /* keep */ }
  }

  var clientTs = projectData.Last_Updated;
  var metaTs = cur.identityUpdatedAt || '';
  if (metaTs && clientTs) {
    var t1 = new Date(metaTs).getTime();
    var t2 = new Date(clientTs).getTime();
    if (!isNaN(t1) && !isNaN(t2) && Math.abs(t1 - t2) > 2000 && t1 > t2) {
      throw new Error('COLLISION_DETECTED: This project was modified by another user. Please refresh and try again.');
    }
  }

  if (!verifyBackendPrivilege(actor, 'MANAGER')) {
    projectData.Project_Name = cur.name || projectData.Project_Name;
    projectData.Status = cur.projectStatus || projectData.Status;
  }

  var frags = [];
  (timelinesArray || []).forEach(function (t) {
    var n = dalNormalizeSubEventFragment_(t);
    if (n) frags.push(n);
  });
  var now = new Date().toISOString();
  var seq = (Number(cur.identityWriteSeq) || 0) + 1;
  var readinessJson = projectData.Readiness_State;
  if (readinessJson && typeof readinessJson !== 'string') {
    readinessJson = JSON.stringify(readinessJson);
  }
  if (!readinessJson) readinessJson = cur.readinessJson || '{}';

  var patch = {
    roomUid: cur.roomUid || '',
    status: cur.status || 'open',
    openedAt: cur.openedAt || now,
    openedBy: cur.openedBy || actor || 'System',
    lastActivityAt: now,
    lastPublishedAt: cur.lastPublishedAt || '',
    domain: 'meta',
    name: projectData.Project_Name || cur.name || 'Unnamed Event',
    client: projectData.Client != null ? String(projectData.Client) : (cur.client || ''),
    projectStatus: projectData.Status || cur.projectStatus || 'Draft',
    type: projectData.Type || cur.type || 'Event',
    locationUrl: projectData.Location_URL != null ? String(projectData.Location_URL) : (cur.locationUrl || ''),
    difficultyMultiplier: projectData.Difficulty_Multiplier != null
      ? projectData.Difficulty_Multiplier
      : (cur.difficultyMultiplier || 1),
    folderId: projectData.Folder_ID || cur.folderId || '',
    managerEmail: projectData.Manager_Email || cur.managerEmail || '',
    readinessJson: readinessJson,
    subEventsJson: JSON.stringify(frags),
    identityWriteSeq: seq,
    identityUpdatedAt: now,
    identityUpdatedBy: actor || 'System'
  };
  firestoreSetCampaignMeta_(projectId, patch);

  try {
    executeWithRetry(function () {
      var sheets = verifyDatabaseSchema();
      var row = dalGetProjectIndexRow_(projectId, sheets);
      if (!row) return;
      dalWriteCampaignRoom_(sheets.index, row.rowNum, row.map, {
        campaignLastActivityAt: now
      });
      try { flushCache(); } catch (eF) { /* ignore */ }
    });
  } catch (eAct) { /* non-fatal */ }

  writeToAuditLog(actor, 'UPDATE', 'DAL_CAMPAIGN_META', projectId, projectId,
    'Warm identity save (R3c). subEvents=' + frags.length + ' seq=' + seq);
  return JSON.stringify({
    id: projectId,
    timestamp: now,
    warm: true,
    identityWriteSeq: seq
  });
}

/**
 * END ROOM / checkpoint — publish warm identity back to Index + Project_Timelines.
 */
function dalCommitCampaignIdentityFromFirestore_(projectId, actor) {
  var meta = null;
  try { meta = firestoreGetCampaignMeta_(projectId); } catch (e0) { meta = null; }
  if (!meta || !meta.identityUpdatedAt) {
    return { committed: false, empty: true };
  }
  var sheetsId = null;
  try { sheetsId = dalReadProjectIdentityFromSheets_(projectId); } catch (eSheets) { sheetsId = null; }
  var frags = dalParseSubEventsFromMeta_(meta);
  var timelinesArray = frags.map(function (f) {
    return {
      uid: f.uid,
      Sub_Event_Type: f.type,
      Event_Date: f.date,
      Start_Time: f.startTime,
      End_Time: f.endTime,
      Note: f.note
    };
  });
  var projectData = {
    Project_ID: projectId,
    Project_Name: meta.name || 'Unnamed Event',
    Client: meta.client || '',
    Status: meta.projectStatus || 'Draft',
    Type: meta.type || 'Event',
    Location_URL: meta.locationUrl || '',
    Difficulty_Multiplier: parseFloat(meta.difficultyMultiplier) || 1,
    Readiness_State: meta.readinessJson || '{}',
    Folder_ID: meta.folderId || (sheetsId && sheetsId.folderId) || '',
    Manager_Email: meta.managerEmail || (sheetsId && sheetsId.managerEmail) || '',
    Last_Updated: meta.identityUpdatedAt || ''
  };
  if (typeof saveProjectDataSheets_ !== 'function') {
    throw new Error('saveProjectDataSheets_ missing — cannot commit meta identity.');
  }
  var saveRaw = saveProjectDataSheets_(projectData, timelinesArray, actor || 'System', { skipCollision: true, fromMetaCommit: true });
  var indexLastUpdated = '';
  try {
    var parsed = (typeof saveRaw === 'string') ? JSON.parse(saveRaw) : saveRaw;
    if (parsed && parsed.timestamp) indexLastUpdated = String(parsed.timestamp);
  } catch (eTs) { /* ignore */ }
  try {
    if (typeof syncCalendarFromDatabase === 'function') syncCalendarFromDatabase();
  } catch (eCal) { /* Sheets commit still valid */ }
  return { committed: true, subEventCount: timelinesArray.length, indexLastUpdated: indexLastUpdated };
}

/** google.script.run — live meta identity for peers / debug. */
function getCampaignRoomMeta(projectId) {
  if (!projectId || projectId === 'NEW') return null;
  try {
    return firestoreGetCampaignMeta_(projectId);
  } catch (e) {
    return null;
  }
}

/**
 * Campaign Room R3 — snapshot Sheets Logistics_Ledger top legs → Firebase logistics/state.
 */
function dalSnapshotLogisticsToFirestore_(projectId, roomUid, actor) {
  var sheets = verifyDatabaseSchema(true);
  var legs = logisticsLedgerLoadProjectLegObjects_(sheets, projectId) || [];
  var legsJson = JSON.stringify(legs);
  var size = dalStateSizeReport_({ json: legsJson, count: legs.length });
  if (size.overMax) {
    throw new Error(
      'LOGISTICS_STATE_TOO_LARGE: ledger state is ' + size.bytes + ' bytes / ' + size.count +
      ' legs (max ' + DAL_STATE_MAX_BYTES + ' bytes or ' + DAL_STATE_MAX_COUNT + ').'
    );
  }
  var meta = {
    roomUid: roomUid ? String(roomUid) : '',
    status: 'open',
    openedAt: new Date().toISOString(),
    openedBy: actor || 'System',
    domain: 'logistics'
  };
  firestoreSetLogisticsSessionMeta_(projectId, meta);
  firestoreWriteDocument_(dalFirestoreLogisticsCollection_(projectId) + '/state', {
    legsJson: legsJson,
    writeSeq: 1,
    clientId: 'snapshot',
    updatedAt: new Date().toISOString(),
    updatedBy: actor || 'System',
    roomUid: roomUid ? String(roomUid) : ''
  });
  return { count: legs.length, bytes: size.bytes, overWarn: size.overWarn };
}

/**
 * Read warm logistics state.
 * @returns {{ present: boolean, legs: Array, writeSeq: number, roomUid: string, updatedAt: string, updatedBy: string }}
 * Throws LOGISTICS_STATE_CORRUPT / LOGISTICS_STATE_READ_FAILED — never silent empty on error.
 */
function dalReadLogisticsStateFromFirestore_(projectId) {
  var doc;
  try {
    doc = firestoreFetch_('get', dalFirestoreLogisticsCollection_(projectId) + '/state');
  } catch (e0) {
    throw new Error('LOGISTICS_STATE_READ_FAILED: ' + (e0 && e0.message ? e0.message : e0));
  }
  if (!doc || !doc.fields) {
    return { present: false, legs: [], writeSeq: 0, roomUid: '', updatedAt: '', updatedBy: '' };
  }
  var plain = firestoreDecodeFields_(doc.fields);
  var legs = [];
  if (plain.legsJson != null && plain.legsJson !== '') {
    try {
      legs = JSON.parse(plain.legsJson);
    } catch (eParse) {
      throw new Error('LOGISTICS_STATE_CORRUPT: legsJson parse failed');
    }
  }
  if (!Array.isArray(legs)) {
    throw new Error('LOGISTICS_STATE_CORRUPT: legsJson is not an array');
  }
  return {
    present: true,
    legs: legs,
    writeSeq: Number(plain.writeSeq || 0) || 0,
    roomUid: plain.roomUid || '',
    updatedAt: plain.updatedAt || '',
    updatedBy: plain.updatedBy || ''
  };
}

function dalWriteLogisticsStateToFirestore_(projectId, legs, actor, roomUid) {
  var legsJson = JSON.stringify(legs || []);
  var size = dalStateSizeReport_({ json: legsJson, count: (legs || []).length });
  if (size.overMax) {
    throw new Error(
      'LOGISTICS_STATE_TOO_LARGE: ledger state is ' + size.bytes + ' bytes / ' + size.count +
      ' legs (max ' + DAL_STATE_MAX_BYTES + ' bytes or ' + DAL_STATE_MAX_COUNT + ').'
    );
  }
  var prevSeq = 0;
  try {
    var st = dalReadLogisticsStateFromFirestore_(projectId);
    if (st && st.present) prevSeq = Number(st.writeSeq || 0) || 0;
  } catch (eSt) { prevSeq = 0; }
  firestoreWriteDocument_(dalFirestoreLogisticsCollection_(projectId) + '/state', {
    legsJson: legsJson,
    writeSeq: prevSeq + 1,
    clientId: 'gas_logistics_' + String(actor || 'system'),
    updatedAt: new Date().toISOString(),
    updatedBy: actor || 'System',
    roomUid: roomUid ? String(roomUid) : ''
  });
  try {
    if (typeof dalTouchCampaignActivity_ === 'function') {
      dalTouchCampaignActivity_(projectId, {});
    }
  } catch (eTouch) { /* ignore */ }
  return { count: (legs || []).length, bytes: size.bytes, overWarn: size.overWarn, writeSeq: prevSeq + 1 };
}

/** Final-publish Firebase logistics → Sheets Logistics_Ledger (top legs for project). */
function dalCommitLogisticsFromFirestore_(projectId, actor, opts) {
  opts = opts || {};
  var snap;
  try {
    snap = dalReadLogisticsStateFromFirestore_(projectId);
  } catch (eRead) {
    // Do not delete Firebase or wipe Sheets on transient/corrupt reads.
    throw eRead;
  }
  if (!snap || !snap.present) {
    if (!opts.keepLive) {
      try { firestoreDeleteDocument_(dalFirestoreLogisticsCollection_(projectId) + '/_meta'); } catch (e0) { /* ignore */ }
      try { firestoreDeleteDocument_(dalFirestoreLogisticsCollection_(projectId) + '/state'); } catch (e1) { /* ignore */ }
    }
    return { committed: false, empty: true };
  }
  var size = dalStateSizeReport_({
    json: JSON.stringify(snap.legs || []),
    count: (snap.legs || []).length
  });
  if (size.overMax) {
    throw new Error(
      'LOGISTICS_STATE_TOO_LARGE: cannot commit — ' + size.bytes + ' bytes / ' + size.count + ' legs.'
    );
  }
  var sheets = verifyDatabaseSchema();
  logisticsLedgerReplaceProjectTopLegsOnSheet_(sheets, projectId, snap.legs || []);
  try { logisticsLedgerStampClocksFromShiftSheet_(sheets, projectId); } catch (eClk) { /* optional */ }
  try { logisticsLedgerStampPhaseRefBestEffort_(sheets, projectId); } catch (ePh) { /* optional */ }
  if (!opts.keepLive) {
    try { firestoreDeleteDocument_(dalFirestoreLogisticsCollection_(projectId) + '/_meta'); } catch (eM) { /* ignore */ }
    try { firestoreDeleteDocument_(dalFirestoreLogisticsCollection_(projectId) + '/state'); } catch (eS) { /* ignore */ }
  }
  try { flushCache(); } catch (eC) { /* ignore */ }
  writeToAuditLog(actor || 'System', opts.keepLive ? 'CHECKPOINT' : 'CLOSE', 'LOGISTICS_LEDGER', projectId, projectId,
    (opts.keepLive ? 'Checkpoint' : 'Committed Campaign Room') +
    ' logistics slice to Sheets (' + (snap.legs || []).length + ' legs).');
  return { committed: true, count: (snap.legs || []).length, keepLive: !!opts.keepLive };
}

// ==========================================
// --- Campaign Room R3d — RFID Operations_Ledger warm slice ---
// Shape: ops/_meta + ops/state (rowsJson) + per-row ops/r_{uid} (fail-safe).
// Sheets lag until END ROOM / checkpoint.
// ==========================================

function dalFirestoreOpsCollection_(projectId) {
  return 'projects/' + projectId + '/' + DAL_FIRESTORE_OPS_COLLECTION;
}

function dalOpsRowDocId_(uid) {
  return 'r_' + String(uid || '').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 700);
}

function dalOpsPlainFromSheetRow_(row, lMap) {
  if (!row || !lMap) return null;
  var uid = lMap['uid'] !== undefined ? String(row[lMap['uid']] || '') : '';
  if (!uid) uid = Utilities.getUuid();
  return {
    uid: uid,
    session_uid: lMap['session_uid'] !== undefined ? String(row[lMap['session_uid']] || '') : '',
    project_uid: lMap['project_uid'] !== undefined ? String(row[lMap['project_uid']] || '') : '',
    operation_type: lMap['operation_type'] !== undefined ? String(row[lMap['operation_type']] || '') : '',
    asset_uid: lMap['asset_uid'] !== undefined ? String(row[lMap['asset_uid']] || '') : '',
    asset_code: lMap['asset_code'] !== undefined ? String(row[lMap['asset_code']] || '') : '',
    asset_name: lMap['asset_name'] !== undefined ? String(row[lMap['asset_name']] || '') : '',
    department: lMap['department'] !== undefined ? String(row[lMap['department']] || '') : '',
    rfid_tag: lMap['rfid_tag'] !== undefined ? String(row[lMap['rfid_tag']] || '') : '',
    timestamp: lMap['timestamp'] !== undefined ? String(row[lMap['timestamp']] || '') : '',
    actor: lMap['actor'] !== undefined ? String(row[lMap['actor']] || '') : ''
  };
}

function dalOpsScannedMapFromRows_(rows) {
  var scannedMap = {};
  var total = 0;
  (rows || []).forEach(function (r) {
    if (!r || !r.asset_uid) return;
    var aId = String(r.asset_uid);
    scannedMap[aId] = (scannedMap[aId] || 0) + 1;
    total++;
  });
  return { scannedMap: scannedMap, scannedCount: total };
}

function dalReadOpsStateFromFirestore_(projectId) {
  var doc;
  try {
    doc = firestoreFetch_('get', dalFirestoreOpsCollection_(projectId) + '/state');
  } catch (e0) {
    throw new Error('OPS_STATE_READ_FAILED: ' + (e0 && e0.message ? e0.message : e0));
  }
  if (!doc || !doc.fields) {
    return {
      present: false,
      rows: [],
      writeSeq: 0,
      sessionUid: '',
      operationType: '',
      roomUid: '',
      updatedAt: '',
      updatedBy: ''
    };
  }
  var plain = firestoreDecodeFields_(doc.fields);
  var rows = [];
  if (plain.rowsJson != null && plain.rowsJson !== '') {
    try {
      rows = JSON.parse(plain.rowsJson);
    } catch (eParse) {
      throw new Error('OPS_STATE_CORRUPT: rowsJson parse failed');
    }
  }
  if (!Array.isArray(rows)) {
    throw new Error('OPS_STATE_CORRUPT: rowsJson is not an array');
  }
  return {
    present: true,
    rows: rows,
    writeSeq: Number(plain.writeSeq || 0) || 0,
    sessionUid: plain.sessionUid || '',
    operationType: plain.operationType || '',
    roomUid: plain.roomUid || '',
    updatedAt: plain.updatedAt || '',
    updatedBy: plain.updatedBy || ''
  };
}

/**
 * Write warm ops working set + per-row docs (fail-safe ≥ PA B/C).
 * rows = plain objects with uid keys.
 */
function dalWriteOpsStateToFirestore_(projectId, rows, sessionUid, operationType, actor, roomUid) {
  rows = rows || [];
  var rowsJson = JSON.stringify(rows);
  var size = dalStateSizeReport_({ json: rowsJson, count: rows.length });
  if (size.overMax) {
    throw new Error(
      'OPS_STATE_TOO_LARGE: ops state is ' + size.bytes + ' bytes / ' + size.count +
      ' rows (max ' + DAL_STATE_MAX_BYTES + ' bytes or ' + DAL_STATE_MAX_COUNT + ').'
    );
  }
  var prevSeq = 0;
  try {
    var st = dalReadOpsStateFromFirestore_(projectId);
    if (st && st.present) prevSeq = Number(st.writeSeq || 0) || 0;
  } catch (eSt) { prevSeq = 0; }

  var prevIds = {};
  try {
    var prev = dalReadOpsStateFromFirestore_(projectId);
    (prev.rows || []).forEach(function (r) {
      if (r && r.uid) prevIds[String(r.uid)] = 1;
    });
  } catch (ePrev) { /* ignore */ }

  var nextIds = {};
  rows.forEach(function (r) {
    if (!r || !r.uid) return;
    var id = String(r.uid);
    nextIds[id] = 1;
    try {
      firestoreWriteDocument_(dalFirestoreOpsCollection_(projectId) + '/' + dalOpsRowDocId_(id), r);
    } catch (eRow) {
      throw new Error('OPS_ROW_WRITE_FAILED: ' + id + ' — ' + (eRow && eRow.message ? eRow.message : eRow));
    }
  });
  Object.keys(prevIds).forEach(function (id) {
    if (nextIds[id]) return;
    try {
      firestoreDeleteDocument_(dalFirestoreOpsCollection_(projectId) + '/' + dalOpsRowDocId_(id));
    } catch (eDel) { /* best-effort */ }
  });

  var counts = dalOpsScannedMapFromRows_(rows);
  firestoreWriteDocument_(dalFirestoreOpsCollection_(projectId) + '/state', {
    rowsJson: rowsJson,
    writeSeq: prevSeq + 1,
    sessionUid: String(sessionUid || ''),
    operationType: String(operationType || ''),
    scannedCount: counts.scannedCount,
    scannedMapJson: JSON.stringify(counts.scannedMap || {}),
    clientId: 'gas_ops_' + String(actor || 'system'),
    updatedAt: new Date().toISOString(),
    updatedBy: actor || 'System',
    roomUid: roomUid ? String(roomUid) : ''
  });
  try {
    if (typeof dalTouchCampaignActivity_ === 'function') {
      dalTouchCampaignActivity_(projectId, {});
    }
  } catch (eTouch) { /* ignore */ }
  return {
    count: rows.length,
    bytes: size.bytes,
    overWarn: size.overWarn,
    writeSeq: prevSeq + 1,
    scannedCount: counts.scannedCount,
    scannedMap: counts.scannedMap
  };
}

/** Prefer live Firebase ops for active session; seed from Sheets only when missing. */
function dalEnsureOpsElevated_(projectId, roomUid, actor) {
  var peek = typeof dalLedgerPeekActiveSession_ === 'function'
    ? dalLedgerPeekActiveSession_(projectId)
    : { operationType: '', sessionUid: '' };
  var sessionUid = String(peek.sessionUid || '');
  try {
    var live = dalReadOpsStateFromFirestore_(projectId);
    if (live && live.present && sessionUid && String(live.sessionUid || '') === sessionUid) {
      try {
        firestoreSetOpsSessionMeta_(projectId, {
          roomUid: roomUid ? String(roomUid) : '',
          status: 'open',
          domain: 'ops',
          activeOperation: String(peek.operationType || live.operationType || ''),
          activeSessionUid: sessionUid,
          lastActivityAt: new Date().toISOString()
        });
      } catch (eM) { /* ignore */ }
      return {
        elevated: true,
        already: true,
        scannedCount: dalOpsScannedMapFromRows_(live.rows || []).scannedCount,
        scannedMap: dalOpsScannedMapFromRows_(live.rows || []).scannedMap,
        rows: live.rows || []
      };
    }
  } catch (eLive) { /* seed below */ }
  var seeded = dalSnapshotOpsToFirestore_(projectId, roomUid, actor);
  var counts = dalOpsScannedMapFromRows_(
    (dalReadOpsStateFromFirestore_(projectId).rows || [])
  );
  return {
    elevated: true,
    already: false,
    scannedCount: counts.scannedCount,
    scannedMap: counts.scannedMap,
    writeSeq: seeded && seeded.writeSeq
  };
}

/** Snapshot active-session Operations_Ledger rows → Firebase ops slice. */
function dalSnapshotOpsToFirestore_(projectId, roomUid, actor) {
  var peek = typeof dalLedgerPeekActiveSession_ === 'function'
    ? dalLedgerPeekActiveSession_(projectId)
    : { operationType: '', sessionUid: '' };
  var sheets = verifyDatabaseSchema(true);
  var ledgerData = sheets.opsLedger.getDataRange().getValues();
  var lMap = {};
  if (ledgerData.length > 0) ledgerData[0].forEach(function (h, i) { lMap[h.toString().trim()] = i; });
  var rows = [];
  var sessionUid = String(peek.sessionUid || '');
  for (var i = 1; i < ledgerData.length; i++) {
    var rowPid = lMap['project_uid'] !== undefined ? String(ledgerData[i][lMap['project_uid']] || '') : '';
    var rowSid = lMap['session_uid'] !== undefined ? String(ledgerData[i][lMap['session_uid']] || '') : '';
    if (sessionUid) {
      if (rowSid !== sessionUid) continue;
    } else if (rowPid !== String(projectId)) {
      continue;
    }
    var plain = dalOpsPlainFromSheetRow_(ledgerData[i], lMap);
    if (plain) rows.push(plain);
  }
  var meta = {
    roomUid: roomUid ? String(roomUid) : '',
    status: 'open',
    openedAt: new Date().toISOString(),
    openedBy: actor || 'System',
    domain: 'ops',
    activeOperation: String(peek.operationType || ''),
    activeSessionUid: sessionUid
  };
  firestoreSetOpsSessionMeta_(projectId, meta);
  return dalWriteOpsStateToFirestore_(projectId, rows, sessionUid, peek.operationType || '', actor, roomUid);
}

/**
 * END ROOM — publish warm ops rows for active session → Sheets Operations_Ledger.
 * Fail closed: pocket + throw (no fake success / no silent scan loss).
 */
function dalCommitOpsFromFirestore_(projectId, actor, opts) {
  opts = opts || {};
  var snap;
  try {
    snap = dalReadOpsStateFromFirestore_(projectId);
  } catch (eRead) {
    try {
      dalPocketFailedWrite_({
        projectId: projectId,
        domain: 'ops',
        sessionUid: '',
        deltaId: 'ops_commit_read',
        expectedSig: 'readable',
        actualSig: 'read_failed',
        mismatchNote: String(eRead && eRead.message ? eRead.message : eRead),
        actor: actor || 'System',
        payload: { kind: 'ops_commit' }
      });
    } catch (eP) { /* ignore */ }
    throw eRead;
  }
  if (!snap || !snap.present) {
    if (!opts.keepLive) {
      try { firestoreDeleteDocument_(dalFirestoreOpsCollection_(projectId) + '/_meta'); } catch (e0) { /* ignore */ }
      try { firestoreDeleteDocument_(dalFirestoreOpsCollection_(projectId) + '/state'); } catch (e1) { /* ignore */ }
    }
    return { committed: false, empty: true };
  }

  var sessionUid = String(snap.sessionUid || '');
  var rows = snap.rows || [];
  var size = dalStateSizeReport_({ json: JSON.stringify(rows), count: rows.length });
  if (size.overMax) {
    throw new Error('OPS_STATE_TOO_LARGE: cannot commit — ' + size.bytes + ' bytes / ' + size.count + ' rows.');
  }

  try {
    executeWithRetry(function () {
      var sheets = verifyDatabaseSchema();
      var ledgerData = sheets.opsLedger.getDataRange().getValues();
      var lMap = {};
      if (ledgerData.length > 0) ledgerData[0].forEach(function (h, i) { lMap[h.toString().trim()] = i; });
      var colCount = ledgerData.length > 0 ? ledgerData[0].length : 11;

      if (sessionUid) {
        dalDeleteRowsByColumn_(sheets.opsLedger, 'session_uid', sessionUid);
      }

      if (rows.length) {
        var sheetRows = rows.map(function (r) {
          var arr = new Array(colCount).fill('');
          if (lMap['uid'] !== undefined) arr[lMap['uid']] = r.uid || Utilities.getUuid();
          if (lMap['session_uid'] !== undefined) arr[lMap['session_uid']] = r.session_uid || sessionUid;
          if (lMap['project_uid'] !== undefined) arr[lMap['project_uid']] = r.project_uid || projectId;
          if (lMap['operation_type'] !== undefined) arr[lMap['operation_type']] = r.operation_type || snap.operationType || '';
          if (lMap['asset_uid'] !== undefined) arr[lMap['asset_uid']] = r.asset_uid || '';
          if (lMap['asset_code'] !== undefined) arr[lMap['asset_code']] = r.asset_code || '';
          if (lMap['asset_name'] !== undefined) arr[lMap['asset_name']] = r.asset_name || '';
          if (lMap['department'] !== undefined) arr[lMap['department']] = r.department || '';
          if (lMap['rfid_tag'] !== undefined) arr[lMap['rfid_tag']] = r.rfid_tag || '';
          if (lMap['timestamp'] !== undefined) arr[lMap['timestamp']] = r.timestamp || new Date().toISOString();
          if (lMap['actor'] !== undefined) arr[lMap['actor']] = r.actor || actor || 'System';
          return arr;
        });
        dalAppendRows_(sheets.opsLedger, sheetRows);
      }
      try { flushCache(); } catch (eC) { /* ignore */ }
    });
  } catch (eCommit) {
    try {
      dalPocketFailedWrite_({
        projectId: projectId,
        domain: 'ops',
        sessionUid: sessionUid,
        deltaId: 'ops_commit',
        expectedSig: 'sheets_write',
        actualSig: 'failed',
        mismatchNote: String(eCommit && eCommit.message ? eCommit.message : eCommit),
        actor: actor || 'System',
        payload: { kind: 'ops_commit', rows: rows, sessionUid: sessionUid }
      });
      if (typeof dalAlertFailedWrite_ === 'function') {
        dalAlertFailedWrite_(projectId, 'ops', actor, 'Ops commit to Sheets failed — scans kept on Firebase.');
      }
    } catch (eP2) { /* ignore */ }
    throw eCommit;
  }

  // END ROOM clears fork; R4 checkpoint keepLive leaves ops live for peers.
  if (!opts.keepLive) {
    try {
      rows.forEach(function (r) {
        if (!r || !r.uid) return;
        try {
          firestoreDeleteDocument_(dalFirestoreOpsCollection_(projectId) + '/' + dalOpsRowDocId_(r.uid));
        } catch (eR) { /* ignore */ }
      });
    } catch (eList) { /* ignore */ }
    try { firestoreDeleteDocument_(dalFirestoreOpsCollection_(projectId) + '/_meta'); } catch (eM) { /* ignore */ }
    try { firestoreDeleteDocument_(dalFirestoreOpsCollection_(projectId) + '/state'); } catch (eS) { /* ignore */ }
  }

  writeToAuditLog(actor || 'System', opts.keepLive ? 'CHECKPOINT' : 'CLOSE', 'OPERATIONS_LEDGER', projectId, projectId,
    (opts.keepLive ? 'Checkpoint' : 'Committed Campaign Room') +
    ' ops slice to Sheets (' + rows.length + ' rows).');
  return { committed: true, count: rows.length, sessionUid: sessionUid, keepLive: !!opts.keepLive };
}

function dalLoadPaProjectRowsFromFirestore_(projectId, header, map) {
  var docs = firestoreListCollection_(dalFirestorePaCollection_(projectId));
  return docs.filter(function (doc) {
    return doc._docId !== '_meta' && doc._docId !== 'state';
  }).map(function (doc) {
    var row = dalPaRowObjectToSheetArray_(doc, header, map);
    var docId = doc._docId || String(doc.uid || '');
    // writeSeq lives on the Firestore doc, not the Sheets header — keep it for batch deltas (R3e).
    return { data: row, docId: docId, writeSeq: Number(doc.writeSeq || 0) || 0 };
  });
}

function dalFirestoreAssetFromRow_(row, map) {
  var formula = row[map['formula']] || '';
  var isShortage = String(formula).indexOf('[SHORT] ') === 0;
  if (isShortage) formula = formula.substring(8);
  var isGenericAuto = false;
  var isAuto = false;
  if (String(formula).indexOf('[GEN_AUTO] ') === 0) {
    isGenericAuto = true; isAuto = true; formula = formula.substring(11);
  } else if (String(formula).indexOf('[AUTO] ') === 0) {
    isAuto = true; formula = formula.substring(7);
  } else if (formula === 'Gen-Auto-Container') {
    isGenericAuto = true; isAuto = true; formula = 'Standalone';
  } else if (formula === 'Auto-Container') {
    isAuto = true; formula = 'Standalone';
  }
  return {
    uid: row[map['uid']],
    assetId: String(row[map['asset_uid']]),
    qty: row[map['assigned_quantity']] || 1,
    location: row[map['location']] || "",
    formula: formula,
    isShortage: isShortage,
    isAuto: isAuto,
    isGenericAuto: isGenericAuto,
    creator: row[map['creator']] || "System",
    overrideDept: map['override_dept'] !== undefined ? (row[map['override_dept']] || "") : "",
    containerUid: row[map['container_uid']] || "",
    scanStatus: row[map['scan_status']] || "Assigned",
    // M4: truck fields filled by Logistics_Ledger overlay in getProjectAssetsFirestore_
    outboundTruckUid: "",
    outboundX: null,
    outboundY: null,
    outboundZ: null,
    outboundRotated: false,
    outboundStaged: false,
    inboundTruckUid: "",
    inboundX: null,
    inboundY: null,
    inboundZ: null,
    inboundRotated: false,
    inboundStaged: false
  };
}

function getProjectAssetsFirestore_(projectId, startDateStr, endDateStr, opts) {
  opts = opts || {};
  return executeWithRetry(function () {
    var hdr = dalGetProjectAssetsHeaderAndMap_();
    var projectRows = dalLoadPaProjectRowsFromFirestore_(projectId, hdr.header, hdr.map);
    // Heal: if live assets/state was published thin/empty while collection still has rows,
    // rebuild the mirror so prep UI recovers without END ROOM.
    if (!opts.skipHeal) {
      try { dalHealPaLiveStateFromCollection_(projectId, hdr, projectRows); } catch (eHeal) { /* non-fatal */ }
    }
    var assets = projectRows.map(function (r) {
      return dalFirestoreAssetFromRow_(r.data, hdr.map);
    });

    var sheets = verifyDatabaseSchema(true);
    // R3: prefer warm logistics/state when it has legs. Present-but-empty must not blank
    // trucks that still live on Sheets (hub seed / warm-before-first-arrange).
    try {
      var legsMapFs = null;
      var liveLl = null;
      try {
        liveLl = dalReadLogisticsStateFromFirestore_(projectId);
      } catch (eLive) { liveLl = null; }
      if (liveLl && liveLl.present) {
        var warmLegs = liveLl.legs || [];
        if (warmLegs.length > 0) {
          legsMapFs = logisticsLedgerLegsMapFromObjects_(warmLegs);
        } else {
          var sheetsLegs = logisticsLedgerLegsByProject_(sheets, projectId);
          legsMapFs = (sheetsLegs && Object.keys(sheetsLegs).length) ? sheetsLegs : logisticsLedgerLegsMapFromObjects_(warmLegs);
        }
      } else {
        legsMapFs = logisticsLedgerLegsByProject_(sheets, projectId);
      }
      assets.forEach(function (a) { applyLedgerLegsOntoPaAsset_(a, legsMapFs); });
    } catch (eLlFs) { /* empty truck fields */ }
    var data = getSheetData(sheets.projectAssets);
    var map = data.hMap;
    var otherAssets = [];
    for (var i = 1; i < data.length; i++) {
      var pid = String(data[i][map['project_uid']]);
      var isShortage = (data[i][map['formula']] || "").startsWith("[SHORT]");
      if (pid !== String(projectId) && !isShortage) {
        otherAssets.push({
          pid: pid,
          aId: String(data[i][map['asset_uid']]),
          qty: parseInt(data[i][map['assigned_quantity']], 10) || 0
        });
      }
    }

    return getProjectAssetsSheets_buildOverlapResult_(projectId, startDateStr, endDateStr, assets, otherAssets, sheets);
  }, 3, true);
}

/**
 * If assets/state fixture count is far below PA collection count, republish state
 * from the collection (+ logistics overlay). Recovers Hub/arrange wipe of the live mirror.
 */
function dalHealPaLiveStateFromCollection_(projectId, hdr, projectRows) {
  if (!projectId || !hdr) return;
  var rows = projectRows;
  if (!rows) {
    rows = dalLoadPaProjectRowsFromFirestore_(projectId, hdr.header, hdr.map);
  }
  var collCount = 0;
  (rows || []).forEach(function (r) {
    if (!r || !r.data) return;
    var qty = parseInt(r.data[hdr.map['assigned_quantity']], 10) || 0;
    if (qty > 0) collCount++;
  });
  if (collCount === 0) return;

  var snap = null;
  try { snap = dalReadPaStateFixtures_(projectId); } catch (e0) { snap = null; }
  var fixCount = (snap && snap.fixtures && snap.fixtures.length) ? snap.fixtures.length : 0;
  // Heal when state empty/missing, or clearly thin vs collection (Hub wipe signature).
  if (fixCount > 0 && fixCount >= Math.max(1, Math.floor(collCount * 0.6))) return;

  var fixtures = [];
  var legsMap = null;
  try {
    var liveLl = dalReadLogisticsStateFromFirestore_(projectId);
    if (liveLl && liveLl.present && (liveLl.legs || []).length) {
      legsMap = logisticsLedgerLegsMapFromObjects_(liveLl.legs || []);
    }
  } catch (eLl) { legsMap = null; }

  (rows || []).forEach(function (r) {
    if (!r || !r.data) return;
    var uid = String(r.docId || r.data[hdr.map['uid']] || '');
    if (!uid) return;
    var qty = parseInt(r.data[hdr.map['assigned_quantity']], 10) || 0;
    if (qty <= 0) return;
    var obj = dalPaSheetRowToObject_(r.data, hdr.map);
    obj.writeSeq = Number(r.writeSeq || 0) || 0;
    var fix = dalPaObjToLiveFixture_(obj);
    if (!fix.uid) fix.uid = uid;
    if (legsMap) applyLedgerLegsOntoPaAsset_(fix, legsMap);
    fixtures.push(fix);
  });
  if (!fixtures.length) return;

  var basePath = dalFirestorePaCollection_(projectId);
  var prevSeq = (snap && snap.writeSeq) ? Number(snap.writeSeq) || 0 : 0;
  firestoreWriteDocument_(basePath + '/state', {
    fixturesJson: JSON.stringify(fixtures),
    writeSeq: prevSeq + 1,
    clientId: 'gas_heal_pa_state',
    updatedAt: new Date().toISOString(),
    updatedBy: 'System'
  });
  try {
    writeToAuditLog('System', 'HEAL', 'PROJECT_ASSETS_FIRESTORE', projectId, projectId,
      'Rebuilt assets/state from collection (' + fixCount + ' → ' + fixtures.length + ' fixtures).');
  } catch (eAud) { /* ignore */ }
}

/**
 * Warm PA delta flush (R3e batch): one collection list, then WRITE/DELETE only for
 * touched docs — no per-row GET for writeSeq. assets/state rebuilt from in-memory
 * post-delta rows (no second list). Hub GENERATE + pack autosave share this path.
 */
function saveProjectAssetsDeltaFirestore_(projectId, deltas, actor) {
  return executeWithRetry(function () {
    assertActorCanEditProjectAssets(actor);
    if (!dalFirestoreIsConfigured_()) {
      throw new Error('Firebase not configured — cannot save during prep session.');
    }
    var hdr = dalGetProjectAssetsHeaderAndMap_();
    var projectRows = dalLoadPaProjectRowsFromFirestore_(projectId, hdr.header, hdr.map);
    var seqByDoc = {};
    (projectRows || []).forEach(function (r) {
      if (r && r.docId) seqByDoc[String(r.docId)] = Number(r.writeSeq || 0) || 0;
    });
    var classified = dalApplyPaDeltas_(projectRows, deltas, hdr.map, hdr.colCount, projectId);
    var basePath = dalFirestorePaCollection_(projectId);
    var deleteSet = {};

    classified.rowsToUpdate.forEach(function (r) {
      var docId = r.docId || String(r.data[hdr.map['uid']]);
      var obj = dalPaSheetRowToObject_(r.data, hdr.map);
      // Increment from the list snapshot — avoid N× GET before PATCH (Hub pack storms).
      obj.writeSeq = (Number(seqByDoc[String(docId)] || 0) || 0) + 1;
      obj.clientId = 'gas_' + String(actor || 'system');
      firestoreWriteDocument_(basePath + '/' + docId, obj);
      seqByDoc[String(docId)] = obj.writeSeq;
      r.writeSeq = obj.writeSeq;
    });
    classified.rowsToDelete.forEach(function (docId) {
      deleteSet[String(docId)] = true;
      firestoreDeleteDocument_(basePath + '/' + docId);
    });
    classified.rowsToAppend.forEach(function (rowData) {
      var docId = String(rowData[hdr.map['uid']] || Utilities.getUuid());
      if (!rowData[hdr.map['uid']]) rowData[hdr.map['uid']] = docId;
      var obj = dalPaSheetRowToObject_(rowData, hdr.map);
      obj.writeSeq = 1;
      obj.clientId = 'gas_' + String(actor || 'system');
      firestoreWriteDocument_(basePath + '/' + docId, obj);
      seqByDoc[String(docId)] = 1;
      // Stamp the in-memory append shell (same rowData ref) — do not push a duplicate.
      for (var ai = 0; ai < projectRows.length; ai++) {
        var pr = projectRows[ai];
        if (!pr || pr.docId || pr.data !== rowData) continue;
        pr.docId = docId;
        pr.writeSeq = 1;
        break;
      }
    });

    writeToAuditLog(actor, "UPDATE", "PROJECT_ASSETS_FIRESTORE", projectId, projectId,
      'Batch applied ' + deltas.length + ' delta(s) on prep fork (updates=' +
      classified.rowsToUpdate.length + ' deletes=' + classified.rowsToDelete.length +
      ' appends=' + classified.rowsToAppend.length + ').');

    // Live mirror: ALWAYS re-list collection after writes. In-memory rebuild can under-count
    // (list truncation / map edge cases) and gas_* state then wipes the prep UI via live sync.
    try {
      var allRows = dalLoadPaProjectRowsFromFirestore_(projectId, hdr.header, hdr.map);
      var fixtures = [];
      (allRows || []).forEach(function (r) {
        if (!r || !r.data) return;
        var uid = String(r.docId || r.data[hdr.map['uid']] || '');
        if (!uid) return;
        var qty = parseInt(r.data[hdr.map['assigned_quantity']], 10) || 0;
        if (qty <= 0) return;
        var obj = dalPaSheetRowToObject_(r.data, hdr.map);
        obj.writeSeq = Number(r.writeSeq || seqByDoc[uid] || 0) || 0;
        var fix = dalPaObjToLiveFixture_(obj);
        if (!fix.uid) fix.uid = uid;
        fixtures.push(fix);
      });
      // Keep Arrange placement visible on live mirror after delta flushes (ledger SoT).
      try {
        var liveLlDelta = null;
        try { liveLlDelta = dalReadLogisticsStateFromFirestore_(projectId); } catch (eLl0) { liveLlDelta = null; }
        if (liveLlDelta && liveLlDelta.present && (liveLlDelta.legs || []).length) {
          var legsMapDelta = logisticsLedgerLegsMapFromObjects_(liveLlDelta.legs || []);
          fixtures.forEach(function (f) { applyLedgerLegsOntoPaAsset_(f, legsMapDelta); });
        }
      } catch (eLl1) { /* leave blank trucks */ }
      var prevSeq = 0;
      try {
        var st = firestoreFetch_('get', basePath + '/state');
        if (st && st.fields) {
          var plain = firestoreDecodeFields_(st.fields);
          prevSeq = Number(plain.writeSeq || 0) || 0;
        }
      } catch (eSt) { prevSeq = 0; }
      // Refuse to publish an empty mirror when the collection still has rows (wipe guard).
      if (fixtures.length === 0 && (allRows || []).length > 0) {
        writeToAuditLog(actor, "WARN", "PROJECT_ASSETS_FIRESTORE", projectId, projectId,
          'Skipped empty assets/state write — collection still has ' + allRows.length + ' doc(s).');
      } else {
        firestoreWriteDocument_(basePath + '/state', {
          fixturesJson: JSON.stringify(fixtures),
          writeSeq: prevSeq + 1,
          clientId: 'gas_' + String(actor || 'system'),
          updatedAt: new Date().toISOString(),
          updatedBy: actor || 'System'
        });
      }
    } catch (eState) { /* live clients may seed */ }
    try {
      if (typeof dalTouchCampaignActivity_ === 'function') {
        dalTouchCampaignActivity_(projectId, { skipLock: true });
      }
    } catch (eTouch) { /* ignore */ }
    return "Saved Delta";
  });
}

/**
 * Prep-open truck arrange (R3e batch): logistics-first.
 * Placement → one logistics/state write. PA collection rewritten only on qty-split /
 * deletes; auto orphans upserted without per-row GET. assets/state stamped once.
 */
function saveTruckArrangementFirestore_(projectId, layoutData, leg, actor) {
  return executeWithRetry(function () {
    assertActorCanEditProjectAssets(actor);
    if (!dalFirestoreIsConfigured_()) {
      throw new Error('Firebase not configured — cannot save truck layout during prep session.');
    }
    var hdr = dalGetProjectAssetsHeaderAndMap_();
    var projectRows = dalLoadPaProjectRowsFromFirestore_(projectId, hdr.header, hdr.map);
    var projectRowsMap = {};
    var oldUids = {};
    (projectRows || []).forEach(function (r) {
      var uid = String(r.data[hdr.map['uid']] || r.docId || '');
      if (!uid) return;
      projectRowsMap[uid] = r.data;
      oldUids[uid] = true;
    });

    var arranged = applyTruckLayoutToProjectRowsMap_(projectRowsMap, layoutData, leg || 'outbound', hdr.map);
    var resultRows = arranged.rows || [];
    var basePath = dalFirestorePaCollection_(projectId);
    var dualLegs = (leg === 'both') ? ['outbound', 'inbound'] : [String(leg || 'outbound')];

    var roomUid = '';
    try {
      var sheetsIdx = verifyDatabaseSchema(true);
      var idxRow = dalGetProjectIndexRow_(projectId, sheetsIdx);
      if (idxRow) {
        var camp = dalReadCampaignRoom_(idxRow);
        roomUid = camp.campaignRoomUid || '';
      }
    } catch (eRoom) { /* ignore */ }

    var existingLl = null;
    try {
      existingLl = dalReadLogisticsStateFromFirestore_(projectId);
    } catch (eExist) { existingLl = null; }
    var baseLegs = (existingLl && existingLl.present) ? (existingLl.legs || []) : null;
    if (!baseLegs) {
      var sheetsSeed = verifyDatabaseSchema(true);
      baseLegs = logisticsLedgerLoadProjectLegObjects_(sheetsSeed, projectId) || [];
    }
    var nextLegs = logisticsLedgerApplyLayoutItemsToObjects_(
      baseLegs, projectId, arranged.ledgerItems, dualLegs, actor
    );
    var legsMap = logisticsLedgerLegsMapFromObjects_(nextLegs);

    var resultUids = {};
    (resultRows || []).forEach(function (rowData) {
      var docId = String(rowData[hdr.map['uid']] || '');
      if (docId) resultUids[docId] = true;
    });
    var structuralChange = false;
    Object.keys(resultUids).forEach(function (uid) {
      if (!oldUids[uid]) structuralChange = true;
    });
    Object.keys(oldUids).forEach(function (uid) {
      if (!resultUids[uid]) structuralChange = true;
    });

    var orphanItems = [];
    (arranged.ledgerItems || []).forEach(function (item) {
      if (!item) return;
      var paUid = String(item.paUid || item.pa_uid || '');
      if (!paUid || oldUids[paUid] || resultUids[paUid]) return;
      orphanItems.push(item);
    });

    var fixtures = [];
    var newUids = {};

    function stampFixtureFromRow_(rowData, docId) {
      var obj = dalPaSheetRowToObject_(rowData, hdr.map);
      obj.uid = docId;
      obj.clientId = 'gas_truck_' + String(actor || 'system');
      var fix = dalPaObjToLiveFixture_(obj);
      applyLedgerLegsOntoPaAsset_(fix, legsMap);
      return { obj: obj, fix: fix };
    }

    function upsertOrphanAutos_() {
      orphanItems.forEach(function (item) {
        var paUid = String(item.paUid || item.pa_uid || '');
        if (!paUid || newUids[paUid]) return;
        var assetUid = String(item.assetUid || item.asset_uid || '');
        if (!assetUid && !item.isAuto) return;
        var formula = item.formula || 'Standalone';
        if (item.isGenericAuto && String(formula).indexOf('[GEN_AUTO] ') !== 0) {
          formula = '[GEN_AUTO] ' + formula;
        } else if (item.isAuto && String(formula).indexOf('[AUTO] ') !== 0 && String(formula).indexOf('[GEN_AUTO] ') !== 0) {
          formula = '[AUTO] ' + formula;
        }
        var obj = {
          uid: paUid,
          project_uid: String(projectId),
          asset_uid: assetUid,
          assigned_quantity: item.quantity != null ? item.quantity : 1,
          location: item.location || 'General',
          formula: formula,
          creator: item.creator || actor || 'System',
          override_dept: '',
          container_uid: '',
          scan_status: 'Assigned',
          writeSeq: 1,
          clientId: 'gas_truck_auto_' + String(actor || 'system')
        };
        try { firestoreWriteDocument_(basePath + '/' + paUid, obj); } catch (eUp) { /* logistics still holds placement */ }
        newUids[paUid] = true;
        var fixAuto = dalPaObjToLiveFixture_(obj);
        applyLedgerLegsOntoPaAsset_(fixAuto, legsMap);
        fixtures.push(fixAuto);
      });
    }

    if (structuralChange) {
      (resultRows || []).forEach(function (rowData) {
        var docId = String(rowData[hdr.map['uid']] || Utilities.getUuid());
        if (!rowData[hdr.map['uid']]) rowData[hdr.map['uid']] = docId;
        newUids[docId] = true;
        var stamped = stampFixtureFromRow_(rowData, docId);
        stamped.obj.writeSeq = 1;
        firestoreWriteDocument_(basePath + '/' + docId, stamped.obj);
        fixtures.push(stamped.fix);
      });
      Object.keys(oldUids).forEach(function (uid) {
        if (!newUids[uid]) {
          try { firestoreDeleteDocument_(basePath + '/' + uid); } catch (eDel) { /* continue */ }
        }
      });
      upsertOrphanAutos_();
    } else {
      (resultRows || []).forEach(function (rowData) {
        var docId = String(rowData[hdr.map['uid']] || '');
        if (!docId) return;
        newUids[docId] = true;
        fixtures.push(stampFixtureFromRow_(rowData, docId).fix);
      });
      upsertOrphanAutos_();
    }

    // Rebuild live mirror from full collection after writes (wipe guard — never publish
    // a partial in-memory fixture list that live sync would apply as the whole PA).
    fixtures = [];
    try {
      var allAfter = dalLoadPaProjectRowsFromFirestore_(projectId, hdr.header, hdr.map);
      (allAfter || []).forEach(function (r) {
        if (!r || !r.data) return;
        var docId = String(r.docId || r.data[hdr.map['uid']] || '');
        if (!docId) return;
        var qty = parseInt(r.data[hdr.map['assigned_quantity']], 10) || 0;
        if (qty <= 0) return;
        var stamped = stampFixtureFromRow_(r.data, docId);
        fixtures.push(stamped.fix);
      });
    } catch (eRelist) {
      // Fall back to in-memory fixtures already built above.
    }

    var prevSeq = 0;
    try {
      var st = firestoreFetch_('get', basePath + '/state');
      if (st && st.fields) {
        var plainSt = firestoreDecodeFields_(st.fields);
        prevSeq = Number(plainSt.writeSeq || 0) || 0;
      }
    } catch (eSt) { prevSeq = 0; }
    if (fixtures.length === 0 && Object.keys(oldUids).length > 0 && !structuralChange) {
      writeToAuditLog(actor, "WARN", "TRUCK_ARRANGEMENT_FIRESTORE", projectId, projectId,
        'Skipped empty assets/state write after arrange — refusing UI wipe.');
    } else {
      firestoreWriteDocument_(basePath + '/state', {
        fixturesJson: JSON.stringify(fixtures),
        writeSeq: prevSeq + 1,
        clientId: 'gas_truck_' + String(actor || 'system'),
        updatedAt: new Date().toISOString(),
        updatedBy: actor || 'System'
      });
    }

    try {
      dalWriteLogisticsStateToFirestore_(projectId, nextLegs, actor, roomUid);
      try {
        firestoreSetLogisticsSessionMeta_(projectId, {
          roomUid: roomUid || '',
          status: 'open',
          domain: 'logistics',
          updatedAt: new Date().toISOString(),
          updatedBy: actor || 'System'
        });
      } catch (eMeta) { /* ignore */ }
      try {
        if (roomUid) {
          var sheetsAct = verifyDatabaseSchema(true);
          var rowAct = dalGetProjectIndexRow_(projectId, sheetsAct);
          if (rowAct) {
            dalWriteCampaignRoom_(sheetsAct.index, rowAct.rowNum, rowAct.map, {
              campaignLastActivityAt: new Date().toISOString()
            });
          }
        }
      } catch (eAct) { /* ignore */ }
    } catch (eLl) {
      writeToAuditLog(actor, "ERROR", "LOGISTICS_LEDGER", projectId, projectId,
        "Firebase logistics write failed (truck path): " + (eLl && eLl.message ? eLl.message : eLl));
      throw eLl;
    }

    writeToAuditLog(actor, "UPDATE", "TRUCK_ARRANGEMENT_FIRESTORE", projectId, projectId,
      'Batch arrange save (' + (structuralChange ? 'structural' : 'placement') + ') for ' +
      ((layoutData && layoutData.length) || 0) + ' cases; orphans=' + orphanItems.length + '.');
    return {
      success: true,
      message: 'Saved Truck Layout',
      current: fixtures,
      batchMode: structuralChange ? 'structural' : 'placement'
    };
  });
}

function dalSnapshotPaToFirestore_(projectId, sessionUid, actor, roomUid) {
  var hdr = dalGetProjectAssetsHeaderAndMap_();
  var projectRows = dalLoadPaProjectRowsFromSheet_(hdr.sheet, hdr.map, projectId);
  var basePath = dalFirestorePaCollection_(projectId);
  var fixtures = [];
  projectRows.forEach(function (r) {
    var obj = dalPaSheetRowToObject_(r.data, hdr.map);
    var docId = String(obj.uid || Utilities.getUuid());
    firestoreWriteDocument_(basePath + '/' + docId, obj);
    var fix = dalPaObjToLiveFixture_(obj);
    fix.uid = docId;
    fixtures.push(fix);
  });
  // Live collab state doc (timeline twin) — transactional patch target for clients.
  firestoreWriteDocument_(basePath + '/state', {
    fixturesJson: JSON.stringify(fixtures),
    writeSeq: 1,
    clientId: 'snapshot',
    updatedAt: new Date().toISOString(),
    updatedBy: actor || 'System'
  });
  var meta = {
    sessionUid: sessionUid,
    sessionType: DAL_SESSION_TYPE.PREP,
    openedAt: new Date().toISOString(),
    openedBy: actor,
    domain: 'assets'
  };
  if (roomUid) meta.roomUid = String(roomUid);
  firestoreSetSessionMeta_(projectId, meta);
}

function dalCommitPaFromFirestore_(projectId, sessionUid, actor, opts) {
  opts = opts || {};
  var hdr = dalGetProjectAssetsHeaderAndMap_();
  var stateSnap = dalReadPaStateFixtures_(projectId);
  var stateFixtures = stateSnap.fixtures || [];
  var size = dalStateSizeReport_({
    json: stateSnap.fixturesJson,
    count: stateFixtures.filter(function (pa) { return pa && pa.uid && !dalPaFixtureIsAuto_(pa); }).length
  });
  if (size.overMax) {
    throw new Error(
      'PREP_STATE_TOO_LARGE: fixtures state is ' + size.bytes + ' bytes / ' + size.count +
      ' rows (max ' + DAL_STATE_MAX_BYTES + ' bytes or ' + DAL_STATE_MAX_COUNT +
      ' fixtures). Trim the list or split the project before END PREP.'
    );
  }

  var collectionRows = dalLoadPaProjectRowsFromFirestore_(projectId, hdr.header, hdr.map);
  var colFixtures = [];
  var colAutoRows = [];
  (collectionRows || []).forEach(function (r) {
    var obj = dalPaSheetRowToObject_(r.data, hdr.map);
    var asPa = {
      uid: obj.uid,
      assetId: obj.asset_uid,
      qty: obj.assigned_quantity,
      location: obj.location,
      formula: obj.formula,
      creator: obj.creator,
      overrideDept: obj.override_dept,
      containerUid: obj.container_uid,
      scanStatus: obj.scan_status,
      isShortage: String(obj.formula || '').indexOf('[SHORT] ') === 0
    };
    if (dalPaFormulaIsAuto_(obj.formula)) colAutoRows.push(r);
    else colFixtures.push(asPa);
  });

  var mirror = dalPaMirrorCompare_(stateFixtures, colFixtures);
  if (!mirror.ok) {
    try {
      writeToAuditLog(actor, 'WARN', 'PROJECT_ASSETS_MIRROR', projectId, projectId,
        'END PREP mirror mismatch (' + mirror.summary + ') — committing state SSOT + collection autos.');
    } catch (eAud) { /* ignore */ }
    try {
      dalAlertFailedWrite_(projectId, 'assets', actor,
        'END PREP mirror mismatch: ' + mirror.summary + ' (committed from state fixtures + collection autos)',
        { push: false, title: 'DAL prep mirror warn — assets' });
    } catch (eAlert) { /* ignore */ }
    try {
      dalPocketFailedWrite_({
        projectId: projectId,
        domain: 'assets',
        sessionUid: sessionUid,
        actor: actor,
        mismatchNote: 'END PREP mirror: ' + mirror.summary,
        payload: {
          missingInCollection: mirror.missingInCollection,
          missingInState: mirror.missingInState,
          fieldMismatches: mirror.fieldMismatches
        }
      });
    } catch (ePocket) { /* ignore */ }
  }

  // State fixtures = SSOT for non-autos; autos live only on collection (rebuild locally during prep).
  // Load Sheets BEFORE building commit (B fail-safe snapshot).
  var previousSheetRows = dalLoadPaProjectRowsFromSheet_(hdr.sheet, hdr.map, projectId) || [];

  var commitObjs = [];
  var fixtureSource = stateFixtures;
  if ((!fixtureSource || !fixtureSource.length) && colFixtures.length) {
    fixtureSource = colFixtures;
  }
  (fixtureSource || []).forEach(function (pa) {
    if (!pa || !pa.uid || dalPaFixtureIsAuto_(pa)) return;
    var commitObj = dalPaFixtureToCommitObj_(pa, projectId);
    commitObjs.push(commitObj);
  });
  colAutoRows.forEach(function (r) {
    commitObjs.push(dalPaSheetRowToObject_(r.data, hdr.map));
  });

  // B fail-safe: snapshot current Sheets BEFORE mutate; refuse empty wipe.
  var previousObjects = previousSheetRows.map(function (r) {
    return dalPaSheetRowToObject_(r.data, hdr.map);
  });
  if ((!commitObjs || !commitObjs.length) && previousObjects.length > 0) {
    throw new Error(
      'PREP_COMMIT_EMPTY_REFUSED: Firebase fork has 0 rows but Sheets has ' +
      previousObjects.length +
      ' for this project. Fork left intact — fix live list or restore, then End Prep again.'
    );
  }

  var intendedObjects = commitObjs;
  dalWritePaCommitBackup_(projectId, sessionUid, actor, previousObjects, intendedObjects);

  var projectRows = commitObjs.map(function (obj) {
    return { data: dalPaRowObjectToSheetArray_(obj, hdr.header, hdr.map) };
  });

  try {
    // Sheet write under its own short lock — do NOT delete Firebase _meta/collection yet.
    executeWithRetry(function () {
      dalDeleteRowsByColumn_(hdr.sheet, 'project_uid', projectId);
      var rows = projectRows.map(function (r) { return r.data; });
      dalAppendRows_(hdr.sheet, rows);
      flushCache();
    });
  } catch (sheetErr) {
    try {
      dalRestorePaSheetFromObjects_(projectId, previousObjects);
    } catch (restoreErr) {
      try {
        dalAlertFailedWrite_(projectId, 'assets', actor,
          'Sheets commit failed AND restore failed. Backup at dal_commit_backups. ' +
          (sheetErr.message || sheetErr) + ' / restore: ' + (restoreErr.message || restoreErr));
      } catch (eA) { /* ignore */ }
      dalMarkCommitRetryNeeded_(projectId, 'prep', sessionUid,
        'PREP_COMMIT_SHEETS_FAILED (restore also failed): ' + (sheetErr.message || sheetErr));
      throw new Error(
        'PREP_COMMIT_SHEETS_FAILED: ' + (sheetErr.message || sheetErr) +
        ' — restore also failed; Firebase fork + backup kept for retry.'
      );
    }
    try {
      dalAlertFailedWrite_(projectId, 'assets', actor,
        'Sheets commit failed; restored previous Sheets rows. Fork kept. ' + (sheetErr.message || sheetErr));
    } catch (eA2) { /* ignore */ }
    dalMarkCommitRetryNeeded_(projectId, 'prep', sessionUid,
      'PREP_COMMIT_SHEETS_FAILED: ' + (sheetErr.message || sheetErr));
    throw new Error(
      'PREP_COMMIT_SHEETS_FAILED: ' + (sheetErr.message || sheetErr) +
      ' — previous Sheets restored; Firebase fork kept for retry.'
    );
  }

  var reconOk = true;
  try {
    var recon = dalReconcilePaCommit_(projectId, sessionUid, intendedObjects, actor);
    if (recon && recon.ok === false) reconOk = false;
  } catch (reconErr) {
    reconOk = false;
    try {
      dalPocketFailedWrite_({
        projectId: projectId,
        domain: 'assets',
        sessionUid: sessionUid,
        actor: actor,
        mismatchNote: 'Reconcile threw: ' + (reconErr.message || reconErr),
        payload: { rows: intendedObjects }
      });
      dalAlertFailedWrite_(projectId, 'assets', actor, 'Reconcile threw: ' + (reconErr.message || reconErr));
    } catch (pocketErr) { /* already failing */ }
  }

  if (!reconOk) {
    try {
      dalRestorePaSheetFromObjects_(projectId, previousObjects);
    } catch (restoreErr2) {
      try {
        dalAlertFailedWrite_(projectId, 'assets', actor,
          'Reconcile mismatch; Sheets restore failed. Backup kept. ' + (restoreErr2.message || restoreErr2));
      } catch (eA3) { /* ignore */ }
      dalMarkCommitRetryNeeded_(projectId, 'prep', sessionUid, 'PREP_COMMIT_RECONCILE_FAILED (restore also failed)');
      throw new Error(
        'PREP_COMMIT_RECONCILE_FAILED: Sheets may be wrong; Firebase fork + backup kept for retry.'
      );
    }
    try {
      dalAlertFailedWrite_(projectId, 'assets', actor,
        'Reconcile mismatch after commit — restored previous Sheets; Firebase fork kept for retry.');
    } catch (eA4) { /* ignore */ }
    dalMarkCommitRetryNeeded_(projectId, 'prep', sessionUid, 'PREP_COMMIT_RECONCILE_FAILED');
    throw new Error(
      'PREP_COMMIT_RECONCILE_FAILED: previous Sheets restored; Firebase fork kept for retry.'
    );
  }

  // Verified — only now clear live fork + retry cue (unless keepLive checkpoint).
  dalClearCommitRetryNeeded_(projectId, 'prep');
  if (opts && opts.keepLive) {
    return { committed: true, keepLive: true, count: (commitObjs || []).length };
  }
  try {
    firestoreDeleteDocument_('projects/' + projectId + '/assets/_meta');
  } catch (eMeta) { /* continue */ }
  try {
    firestoreDeleteCollection_(dalFirestorePaCollection_(projectId));
  } catch (eCol) {
    try {
      dalAlertFailedWrite_(projectId, 'assets', actor,
        'Sheets committed OK but fork cleanup failed — clear assets collection manually if needed.',
        { push: false, title: 'DAL fork cleanup warn — assets' });
    } catch (eA5) { /* ignore */ }
  }
  return { committed: true, keepLive: false, count: (commitObjs || []).length };
}

/** Commit backup — outside assets/ so fork cleanup cannot wipe the safety net. */
function dalPaCommitBackupPath_(projectId, sessionUid) {
  return 'dal_commit_backups/' + String(projectId) + '__prep__' + String(sessionUid || 'unknown');
}

function dalWritePaCommitBackup_(projectId, sessionUid, actor, previousObjects, intendedObjects) {
  var prevJson = JSON.stringify(previousObjects || []);
  var intJson = JSON.stringify(intendedObjects || []);
  var doc = {
    projectId: String(projectId || ''),
    sessionUid: String(sessionUid || ''),
    actor: String(actor || 'System'),
    savedAt: new Date().toISOString(),
    previousCount: (previousObjects || []).length,
    intendedCount: (intendedObjects || []).length,
    pocketed: false,
    needsRetry: false,
    status: 'pre_commit',
    previousJson: prevJson,
    intendedJson: intJson
  };
  if (prevJson.length + intJson.length > 800000) {
    try {
      dalPocketFailedWrite_({
        projectId: projectId,
        domain: 'assets',
        sessionUid: sessionUid,
        actor: actor,
        mismatchNote: 'PRE_COMMIT_BACKUP_OVERSIZE',
        payload: { previous: previousObjects || [], intended: intendedObjects || [] }
      });
      doc.pocketed = true;
      doc.previousJson = '[]';
      doc.intendedJson = '[]';
      doc.note = 'Payload in failed_writes pocket (oversized for single backup doc).';
    } catch (ePocket) {
      throw new Error(
        'PREP_COMMIT_BACKUP_TOO_LARGE: cannot snapshot Sheets before commit (' +
        (ePocket.message || ePocket) + '). Fork left intact.'
      );
    }
  }
  firestoreWriteDocument_(dalPaCommitBackupPath_(projectId, sessionUid), doc);
}

/** Fail-safe C — pointer doc; red-dot only when needsRetry is true (not on every backup). */
function dalCommitRetryDocPath_(projectId) {
  return 'dal_commit_retry/' + String(projectId || '');
}

function dalMarkCommitRetryNeeded_(projectId, domain, sessionUid, reason) {
  projectId = String(projectId || '');
  if (!projectId) return;
  var kind = (domain === 'timeline' || domain === 'timelineCollab') ? 'timeline' : 'prep';
  var path = dalCommitRetryDocPath_(projectId);
  var existing = { projectId: projectId };
  try {
    var doc = firestoreFetch_('get', path);
    if (doc && doc.fields) existing = firestoreDecodeFields_(doc.fields) || existing;
  } catch (eRead) { /* new */ }
  var entry = {
    needsRetry: true,
    sessionUid: String(sessionUid || ''),
    reason: String(reason || '').slice(0, 500),
    at: new Date().toISOString()
  };
  if (kind === 'prep') existing.prep = entry;
  else existing.timeline = entry;
  existing.projectId = projectId;
  existing.updatedAt = entry.at;
  try {
    firestoreWriteDocument_(path, existing);
  } catch (eWrite) { /* best effort */ }
  try {
    var bakPath = kind === 'prep'
      ? dalPaCommitBackupPath_(projectId, sessionUid)
      : ('dal_commit_backups/' + projectId + '__timeline__' + String(sessionUid || 'unknown'));
    var bak = {};
    try {
      var bdoc = firestoreFetch_('get', bakPath);
      if (bdoc && bdoc.fields) bak = firestoreDecodeFields_(bdoc.fields) || {};
    } catch (eBak) { /* ignore */ }
    bak.needsRetry = true;
    bak.status = 'failed';
    bak.failReason = entry.reason;
    bak.failedAt = entry.at;
    bak.projectId = projectId;
    bak.sessionUid = String(sessionUid || '');
    firestoreWriteDocument_(bakPath, bak);
  } catch (eStamp) { /* ignore */ }
}

function dalClearCommitRetryNeeded_(projectId, domain) {
  projectId = String(projectId || '');
  if (!projectId) return;
  var kind = (domain === 'timeline' || domain === 'timelineCollab') ? 'timeline' : 'prep';
  var path = dalCommitRetryDocPath_(projectId);
  var existing = null;
  try {
    var doc = firestoreFetch_('get', path);
    if (doc && doc.fields) existing = firestoreDecodeFields_(doc.fields);
  } catch (eRead) { existing = null; }
  if (!existing) return;
  if (kind === 'prep') {
    if (existing.prep) {
      existing.prep.needsRetry = false;
      existing.prep.clearedAt = new Date().toISOString();
      existing.prep.status = 'ok';
    }
  } else if (existing.timeline) {
    existing.timeline.needsRetry = false;
    existing.timeline.clearedAt = new Date().toISOString();
    existing.timeline.status = 'ok';
  }
  existing.updatedAt = new Date().toISOString();
  var prepActive = existing.prep && existing.prep.needsRetry;
  var tlActive = existing.timeline && existing.timeline.needsRetry;
  try {
    if (!prepActive && !tlActive) {
      firestoreDeleteDocument_(path);
    } else {
      firestoreWriteDocument_(path, existing);
    }
  } catch (eWrite) { /* ignore */ }
}

/**
 * Client cue — only returns domains with needsRetry:true (server truth).
 * False auto-close alerts never set this pointer.
 */
function getDalCommitRetryStatus(projectId) {
  projectId = String(projectId || '');
  var empty = { projectId: projectId, prep: null, timeline: null };
  if (!projectId || projectId === 'NEW') return empty;
  try {
    var doc = firestoreFetch_('get', dalCommitRetryDocPath_(projectId));
    if (!doc || !doc.fields) return empty;
    var data = firestoreDecodeFields_(doc.fields) || {};
    var prep = (data.prep && data.prep.needsRetry) ? data.prep : null;
    var timeline = (data.timeline && data.timeline.needsRetry) ? data.timeline : null;
    return { projectId: projectId, prep: prep, timeline: timeline };
  } catch (e) {
    return empty;
  }
}

function dalPrepForkStillAlive_(projectId) {
  try {
    var meta = firestoreFetch_('get', 'projects/' + projectId + '/assets/_meta');
    if (meta && meta.fields) return true;
  } catch (e0) { /* ignore */ }
  try {
    var state = firestoreFetch_('get', 'projects/' + projectId + '/assets/state');
    if (state && state.fields) {
      var decoded = firestoreDecodeFields_(state.fields) || {};
      var fixtures = [];
      try { fixtures = JSON.parse(decoded.fixturesJson || '[]'); } catch (eP) { fixtures = []; }
      if (fixtures && fixtures.length) return true;
      if (Number(decoded.writeSeq || 0) > 0) return true;
    }
  } catch (e1) { /* ignore */ }
  return false;
}

function dalTimelineForkStillAlive_(projectId) {
  try {
    var meta = firestoreFetch_('get', 'projects/' + projectId + '/timeline/_meta');
    if (meta && meta.fields) return true;
  } catch (e0) { /* ignore */ }
  try {
    var state = firestoreFetch_('get', dalFirestoreTimelineCollection_(projectId) + '/state');
    if (state && state.fields) return true;
  } catch (e1) { /* ignore */ }
  return false;
}

/**
 * Fail-safe C — manual Retry only. Idempotent: no pointer / no fork → alreadyOk (no Sheets write).
 */
function retryDalFailedCommit(projectId, domain, actor) {
  projectId = String(projectId || '');
  if (!projectId || projectId === 'NEW') throw new Error('Missing project id.');
  var kind = (domain === 'timeline' || domain === 'timelineCollab') ? 'timeline' : 'prep';
  var sessionType = kind === 'timeline' ? DAL_SESSION_TYPE.TIMELINE_COLLAB : DAL_SESSION_TYPE.PREP;
  actor = actor || 'System';
  if (kind === 'prep') assertActorCanManageDalPrepSession(actor);
  else assertActorCanEditTimeline(actor);

  var st = getDalCommitRetryStatus(projectId);
  var entry = kind === 'prep' ? st.prep : st.timeline;
  if (!entry || !entry.needsRetry) {
    return { ok: true, alreadyOk: true, message: 'No failed commit pending — nothing to retry.' };
  }

  var info = getDalSessionInfo(projectId) || {};
  var curStatus = '';
  if (kind === 'prep') {
    curStatus = String(info.prepStatus || (info.prep && info.prep.status) || '').toLowerCase();
  } else {
    curStatus = String(info.timelineStatus || (info.timeline && info.timeline.status) || '').toLowerCase();
  }

  if (curStatus === 'committing') {
    throw new Error('Commit already in progress — wait for it to finish, then refresh.');
  }

  var forkAlive = kind === 'prep'
    ? dalPrepForkStillAlive_(projectId)
    : dalTimelineForkStillAlive_(projectId);

  if (!forkAlive && curStatus !== 'open' && curStatus !== 'opening') {
    dalClearCommitRetryNeeded_(projectId, kind);
    return {
      ok: true,
      alreadyOk: true,
      message: 'Commit already finished (no live fork) — cleared retry cue.'
    };
  }

  if (curStatus === 'opening') {
    throw new Error('Preparation/timeline is still opening — wait, then retry.');
  }

  if (curStatus !== 'open') {
    // Domain cleared but fork kept — reopen so closeDalSession can commit.
    executeWithRetry(function () {
      var sheets = verifyDatabaseSchema();
      var row = dalGetProjectIndexRow_(projectId, sheets);
      if (!row) throw new Error('Project not found.');
      dalMigrateLegacySessionToDomain_(sheets.index, row);
      dalWriteDomainSession_(sheets.index, row.rowNum, row.map, sessionType, {
        status: 'open',
        sessionUid: entry.sessionUid || Utilities.getUuid(),
        openedAt: new Date().toISOString(),
        openedBy: actor
      });
      dalFlushDomainCache_(projectId, sessionType);
    });
  }

  closeDalSession(projectId, actor, sessionType);
  // Successful close clears retry inside commit helpers; belt-and-suspenders:
  try { dalClearCommitRetryNeeded_(projectId, kind); } catch (eClr) { /* ignore */ }
  return { ok: true, retried: true, message: 'Commit retry completed.' };
}

function dalRestorePaSheetFromObjects_(projectId, rowObjects) {
  var hdr = dalGetProjectAssetsHeaderAndMap_();
  executeWithRetry(function () {
    dalDeleteRowsByColumn_(hdr.sheet, 'project_uid', projectId);
    var rows = (rowObjects || []).map(function (obj) {
      return dalPaRowObjectToSheetArray_(obj, hdr.header, hdr.map);
    });
    dalAppendRows_(hdr.sheet, rows);
    flushCache();
  });
}

function dalFirestoreTimelineCollection_(projectId) {
  return 'projects/' + projectId + '/' + DAL_FIRESTORE_TIMELINE_COLLECTION;
}

function dalWriteTimelineStateToFirestore_(projectId, mode, shifts, phases, overrides, actor, replaceAll) {
  var outShifts = shifts || [];
  var outPhases = phases || [];
  var outOverrides = overrides || {};
  // Live saves: upsert onto fork so a stale full payload cannot drop concurrent adds.
  // Snapshots / commits pass replaceAll=true for an authoritative rewrite.
  if (!replaceAll) {
    var remote = null;
    try { remote = dalReadTimelineStateFromFirestore_(projectId); } catch (eRead) { remote = null; }
    if (remote) {
      outShifts = dalFirebasePatchTimelineEntities_(remote.shifts || [], shifts || []);
      outPhases = dalFirebasePatchTimelineEntities_(remote.phases || [], phases || []);
      outOverrides = Object.assign({}, remote.overrides || {}, overrides || {});
    }
  }
  firestoreWriteDocument_(dalFirestoreTimelineCollection_(projectId) + '/state', {
    mode: mode || 'main',
    shiftsJson: JSON.stringify(outShifts),
    phasesJson: JSON.stringify(outPhases),
    overridesJson: JSON.stringify(outOverrides),
    updatedAt: new Date().toISOString(),
    updatedBy: actor || 'System'
  });
  try {
    if (typeof dalTouchCampaignActivity_ === 'function') {
      dalTouchCampaignActivity_(projectId, {});
    }
  } catch (eTouch) { /* ignore */ }
}

/** Upsert incoming by id onto remote; keep remote-only ids (never silent-drop concurrent adds). */
function dalFirebasePatchTimelineEntities_(remoteList, incomingList) {
  var map = {};
  (remoteList || []).forEach(function (e) {
    if (e && e.id) map[String(e.id)] = e;
  });
  (incomingList || []).forEach(function (e) {
    if (e && e.id) map[String(e.id)] = e;
  });
  return Object.keys(map).map(function (k) { return map[k]; });
}

function dalReadTimelineStateFromFirestore_(projectId) {
  var doc = firestoreFetch_('get', dalFirestoreTimelineCollection_(projectId) + '/state');
  if (!doc || !doc.fields) return null;
  var plain = firestoreDecodeFields_(doc.fields);
  var shifts = [];
  var phases = [];
  var overrides = {};
  try { shifts = JSON.parse(plain.shiftsJson || '[]'); } catch (e1) { shifts = []; }
  try { phases = JSON.parse(plain.phasesJson || '[]'); } catch (e2) { phases = []; }
  try { overrides = JSON.parse(plain.overridesJson || '{}'); } catch (e3) { overrides = {}; }
  return {
    mode: plain.mode || 'main',
    shifts: shifts,
    phases: phases,
    overrides: overrides,
    updatedAt: plain.updatedAt || '',
    updatedBy: plain.updatedBy || ''
  };
}

function dalSnapshotTimelineToFirestore_(projectId, sessionUid, actor, mode, roomUid) {
  // Status is "opening" — Sheets path allowed. getTimelineDataSheets_ takes its own short lock.
  var state = getTimelineDataSheets_(projectId, mode || 'main');
  var shiftsOut = (state && state.shifts) ? state.shifts.slice() : [];
  // Preserve Hub AUTO load/unload bars already on Firebase (Sheets lag until END ROOM).
  // Re-opening Timeline must not wipe warm GENERATE clocks with a cold Sheets snapshot.
  try {
    var existing = dalReadTimelineStateFromFirestore_(projectId);
    if (existing && existing.shifts && existing.shifts.length) {
      var haveId = {};
      shiftsOut.forEach(function (s) {
        if (s && s.id) haveId[String(s.id)] = true;
      });
      existing.shifts.forEach(function (s) {
        if (!s) return;
        var note = String(s.note || '');
        if (note.indexOf('AUTO-OUTBOUND') === -1 && note.indexOf('AUTO-INBOUND') === -1) return;
        if (s.id && haveId[String(s.id)]) return;
        shiftsOut.push(s);
        if (s.id) haveId[String(s.id)] = true;
      });
    }
  } catch (eKeep) { /* Sheets-only snapshot */ }
  // Meta first so UI can see the fork sooner; state doc carries the payload.
  var meta = {
    sessionUid: sessionUid,
    sessionType: DAL_SESSION_TYPE.TIMELINE_COLLAB,
    openedAt: new Date().toISOString(),
    openedBy: actor,
    domain: 'timeline',
    mode: mode || 'main'
  };
  if (roomUid) meta.roomUid = String(roomUid);
  firestoreSetTimelineSessionMeta_(projectId, meta);
  dalWriteTimelineStateToFirestore_(
    projectId, mode || 'main', shiftsOut, state.phases || [], state.overrides || {}, actor, true
  );
}

function dalCommitTimelineFromFirestore_(projectId, actor, sessionUid, opts) {
  opts = opts || {};
  var snap = dalReadTimelineStateFromFirestore_(projectId);
  if (!snap) {
    // Empty fork — do not touch Sheets; clear orphan meta/collection only.
    try { firestoreDeleteDocument_('projects/' + projectId + '/timeline/_meta'); } catch (e0) { /* ignore */ }
    try { firestoreDeleteCollection_(dalFirestoreTimelineCollection_(projectId)); } catch (e1) { /* ignore */ }
    return;
  }
  var tlSize = dalStateSizeReport_({
    payload: {
      shifts: snap.shifts || [],
      phases: snap.phases || [],
      overrides: snap.overrides || {}
    },
    count: (snap.shifts || []).length + (snap.phases || []).length +
      Object.keys(snap.overrides || {}).length
  });
  if (tlSize.overMax) {
    throw new Error(
      'TIMELINE_STATE_TOO_LARGE: collab state is ' + tlSize.bytes + ' bytes / ' + tlSize.count +
      ' entities (max ' + DAL_STATE_MAX_BYTES + ' bytes or ' + DAL_STATE_MAX_COUNT +
      '). Reduce shifts/phases before END COLLAB.'
    );
  }
  var mode = snap.mode || 'main';
  var previousSnap = null;
  var backupPath = 'dal_commit_backups/' + String(projectId) + '__timeline__' + String(sessionUid || 'unknown');
  try {
    var bakDoc = firestoreFetch_('get', backupPath);
    if (bakDoc && bakDoc.fields) {
      var bak = firestoreDecodeFields_(bakDoc.fields);
      if (bak.previousJson) {
        try { previousSnap = JSON.parse(bak.previousJson); } catch (eParse) { previousSnap = null; }
      }
    }
  } catch (eBakRead) { /* ignore */ }
  if (!previousSnap) {
    try {
      previousSnap = getTimelineDataSheets_(projectId, mode);
    } catch (ePrev) {
      previousSnap = null;
    }
    if (previousSnap) {
      try {
        firestoreWriteDocument_(backupPath, {
          projectId: String(projectId),
          sessionUid: String(sessionUid || ''),
          actor: String(actor || 'System'),
          savedAt: new Date().toISOString(),
          needsRetry: false,
          status: 'pre_commit',
          previousJson: JSON.stringify({
            mode: previousSnap.mode || mode,
            shifts: previousSnap.shifts || [],
            phases: previousSnap.phases || [],
            overrides: previousSnap.overrides || {}
          }),
          intendedJson: JSON.stringify({
            mode: mode,
            shifts: snap.shifts || [],
            phases: snap.phases || [],
            overrides: snap.overrides || {}
          })
        });
      } catch (eBakWrite) { /* continue — restore may be weaker */ }
    }
  }

  try {
    saveTimelineDataSheets_(
      projectId,
      mode,
      snap.shifts || [],
      null,
      snap.phases || [],
      snap.overrides || {},
      null,
      actor || 'System UI',
      null
    );
  } catch (sheetErr) {
    if (previousSnap) {
      try {
        saveTimelineDataSheets_(
          projectId,
          previousSnap.mode || mode,
          previousSnap.shifts || [],
          null,
          previousSnap.phases || [],
          previousSnap.overrides || {},
          null,
          actor || 'System UI',
          null
        );
      } catch (eRest) { /* ignore */ }
    }
    dalMarkCommitRetryNeeded_(projectId, 'timeline', sessionUid,
      'TIMELINE_COMMIT_SHEETS_FAILED: ' + (sheetErr.message || sheetErr));
    throw new Error(
      'TIMELINE_COMMIT_SHEETS_FAILED: ' + (sheetErr.message || sheetErr) +
      ' — Firebase fork kept for retry.'
    );
  }
  try {
    flushCache();
  } catch (eFlush) { /* continue */ }
  var reconOk = true;
  try {
    var recon = dalReconcileTimelineCommit_(projectId, sessionUid, snap, actor);
    if (recon && recon.ok === false) reconOk = false;
  } catch (reconErr) {
    reconOk = false;
    try {
      dalPocketFailedWrite_({
        projectId: projectId,
        domain: 'timeline',
        sessionUid: sessionUid,
        actor: actor,
        mismatchNote: 'Reconcile threw: ' + (reconErr.message || reconErr),
        payload: snap
      });
      dalAlertFailedWrite_(projectId, 'timeline', actor, 'Reconcile threw: ' + (reconErr.message || reconErr));
    } catch (pocketErr) { /* already failing */ }
  }
  if (!reconOk) {
    if (previousSnap) {
      try {
        saveTimelineDataSheets_(
          projectId,
          previousSnap.mode || mode,
          previousSnap.shifts || [],
          null,
          previousSnap.phases || [],
          previousSnap.overrides || {},
          null,
          actor || 'System UI',
          null
        );
        try { flushCache(); } catch (eF2) { /* ignore */ }
      } catch (restoreErr) {
        try {
          dalAlertFailedWrite_(projectId, 'timeline', actor,
            'Timeline reconcile failed AND Sheets restore failed. Fork kept. ' + (restoreErr.message || restoreErr));
        } catch (eA) { /* ignore */ }
        dalMarkCommitRetryNeeded_(projectId, 'timeline', sessionUid,
          'TIMELINE_COMMIT_RECONCILE_FAILED (restore also failed)');
        throw new Error(
          'TIMELINE_COMMIT_RECONCILE_FAILED: Sheets restore failed; Firebase fork kept for retry.'
        );
      }
      try {
        dalAlertFailedWrite_(projectId, 'timeline', actor,
          'Timeline reconcile mismatch — restored previous Sheets; Firebase fork kept for retry.');
      } catch (eA2) { /* ignore */ }
      dalMarkCommitRetryNeeded_(projectId, 'timeline', sessionUid, 'TIMELINE_COMMIT_RECONCILE_FAILED');
      throw new Error(
        'TIMELINE_COMMIT_RECONCILE_FAILED: previous Sheets restored; Firebase fork kept for retry.'
      );
    }
    try {
      dalAlertFailedWrite_(projectId, 'timeline', actor,
        'Timeline reconcile mismatch — no pre-commit Sheets snapshot available; Firebase fork kept. Check Sheets manually.');
    } catch (eA3) { /* ignore */ }
    dalMarkCommitRetryNeeded_(projectId, 'timeline', sessionUid,
      'TIMELINE_COMMIT_RECONCILE_FAILED (no snapshot)');
    throw new Error(
      'TIMELINE_COMMIT_RECONCILE_FAILED: no Sheets snapshot to restore; Firebase fork kept for retry.'
    );
  }
  dalClearCommitRetryNeeded_(projectId, 'timeline');
  if (opts && opts.keepLive) {
    return { committed: true, keepLive: true };
  }
  try { firestoreDeleteDocument_('projects/' + projectId + '/timeline/_meta'); } catch (eMeta) { /* ignore */ }
  try { firestoreDeleteCollection_(dalFirestoreTimelineCollection_(projectId)); } catch (eCol) { /* ignore */ }
  return { committed: true, keepLive: false };
}

function getTimelineDataFirestore_(folderId, mode) {
  return executeWithRetry(function () {
    var roster = getCrewSettings();
    var snap = dalReadTimelineStateFromFirestore_(folderId);
    if (!snap) {
      // Fail open to Sheets snapshot only if fork empty mid-session (should not happen).
      return getTimelineDataSheets_(folderId, mode);
    }
    var shifts = snap.shifts || [];
    var assigned = [];
    shifts.forEach(function (s) {
      var u = s.user_uid || s.email;
      if (u && assigned.indexOf(u) === -1) assigned.push(u);
    });
    return {
      roster: roster,
      assigned: assigned,
      shifts: shifts,
      phases: snap.phases || [],
      overrides: snap.overrides || {}
    };
  }, 3, true);
}

function saveTimelineDataFirestore_(folderId, mode, shifts, crewUids, phases, overrides, clientTimestamp, actor, subEvents) {
  return executeWithRetry(function () {
    assertActorCanEditTimeline(actor);
    if (!dalFirestoreIsConfigured_()) {
      throw new Error('Firebase not configured — cannot save during timeline collab session.');
    }
    dalWriteTimelineStateToFirestore_(folderId, mode, shifts, phases, overrides, actor);
    // Sub-events stay Sheets for Phase A (not on fork yet — logistics editor path).
    if (subEvents !== null) {
      var sheets = verifyDatabaseSchema();
      var tInfo = dalDeleteRowsByColumn_(sheets.timelines, 'project_uid', folderId);
      var tMap = tInfo.map;
      if (subEvents.length > 0) {
        var tlRows = subEvents.map(function (t) {
          var r = new Array(tInfo.cols).fill('');
          if (tMap['uid'] !== undefined) r[tMap['uid']] = t.uid || t.id || Utilities.getUuid();
          if (tMap['project_uid'] !== undefined) r[tMap['project_uid']] = folderId;
          if (tMap['Sub_Event_Type'] !== undefined) r[tMap['Sub_Event_Type']] = t.Sub_Event_Type || 'MAIN';
          if (tMap['Event_Date'] !== undefined) r[tMap['Event_Date']] = t.Event_Date || '';
          if (tMap['Start_Time'] !== undefined) r[tMap['Start_Time']] = t.Start_Time ? ("'" + t.Start_Time) : '';
          if (tMap['End_Time'] !== undefined) r[tMap['End_Time']] = t.End_Time ? ("'" + t.End_Time) : '';
          if (tMap['Note'] !== undefined) r[tMap['Note']] = t.Note || '';
          return r;
        });
        dalAppendRows_(sheets.timelines, tlRows);
      }
    }
    writeToAuditLog(actor, 'UPDATE', 'TIMELINE_FIRESTORE', folderId, folderId, 'Saved timeline on collab fork.');
    return { success: true, fork: true };
  });
}

function createFirebaseAdapter_() {
  var sheets = getSheetsAdapter();
  return {
    persistProjectAssetsDelta: function (projectId, deltas, actor) {
      if (resolveDalSessionStatus_(projectId, DAL_DOMAIN.PROJECT_ASSETS) === DAL_SESSION.SESSION_OPEN) {
        return saveProjectAssetsDeltaFirestore_(projectId, deltas, actor);
      }
      return sheets.persistProjectAssetsDelta(projectId, deltas, actor);
    },
    fetchProjectAssets: function (projectId, startDateStr, endDateStr) {
      if (resolveDalSessionStatus_(projectId, DAL_DOMAIN.PROJECT_ASSETS) === DAL_SESSION.SESSION_OPEN) {
        return getProjectAssetsFirestore_(projectId, startDateStr, endDateStr);
      }
      return sheets.fetchProjectAssets(projectId, startDateStr, endDateStr);
    },
    persistTimelineData: function (folderId, mode, shifts, crewUids, phases, overrides, clientTimestamp, actor, subEvents) {
      if (resolveDalSessionStatus_(folderId, DAL_DOMAIN.TIMELINE) === DAL_SESSION.SESSION_OPEN) {
        return saveTimelineDataFirestore_(folderId, mode, shifts, crewUids, phases, overrides, clientTimestamp, actor, subEvents);
      }
      return sheets.persistTimelineData(folderId, mode, shifts, crewUids, phases, overrides, clientTimestamp, actor, subEvents);
    },
    fetchTimelineData: function (folderId, mode) {
      if (resolveDalSessionStatus_(folderId, DAL_DOMAIN.TIMELINE) === DAL_SESSION.SESSION_OPEN) {
        return getTimelineDataFirestore_(folderId, mode);
      }
      return sheets.fetchTimelineData(folderId, mode);
    },
    persistOperationsBatch: function (projectId, batch, actor) {
      return batchProcessOperationsAtomic_(projectId, batch, actor);
    },
    startOperationSession: function (projectId, operationType, actor) {
      return startEventOperationAtomic_(projectId, operationType, actor);
    },
    finalizeOperationSession: function (projectId, actor) {
      return finalizeEventOperationAtomic_(projectId, actor);
    },
    processRfidScanOp: function (projectId, rfidTag, actor) {
      return processRfidScanSheets_(projectId, rfidTag, actor);
    }
  };
}
