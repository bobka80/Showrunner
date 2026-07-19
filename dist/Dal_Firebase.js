/**
 * SM Showrunner (smuruner) - Clean 8 Architecture
 * Dal_Firebase.js - FirebaseAdapter (Phase 4 — PA prep + timeline collab fork via GAS Firestore REST)
 *
 * Prep session: PA reads/writes Firestore.
 * Timeline collab session: timeline reads/writes Firestore.
 * Ledger: durable Sheets; atomic journal + verify via Dal_Ledger.js (not a fork).
 */

// @INDEX: DAL -> Firebase adapter (Phase 4)

var __dalFirebaseAdapterSingleton = null;

var DAL_FIRESTORE_PA_COLLECTION = 'assets';
var DAL_FIRESTORE_TIMELINE_COLLECTION = 'timeline';

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

function dalPaFixtureToCommitObj_(pa, projectId) {
  var formula = pa.formula || 'Standalone';
  if ((pa.isShortage === true || pa.isShortage === 'true') && String(formula).indexOf('[SHORT] ') !== 0) {
    formula = '[SHORT] ' + formula;
  }
  return {
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

function dalLoadPaProjectRowsFromFirestore_(projectId, header, map) {
  var docs = firestoreListCollection_(dalFirestorePaCollection_(projectId));
  return docs.filter(function (doc) {
    return doc._docId !== '_meta' && doc._docId !== 'state';
  }).map(function (doc) {
    var row = dalPaRowObjectToSheetArray_(doc, header, map);
    var docId = doc._docId || String(doc.uid || '');
    return { data: row, docId: docId };
  });
}

function dalFirestoreAssetFromRow_(row, map) {
  return {
    uid: row[map['uid']],
    assetId: String(row[map['asset_uid']]),
    qty: row[map['assigned_quantity']] || 1,
    location: row[map['location']] || "",
    formula: row[map['formula']] || "",
    creator: row[map['creator']] || "System",
    overrideDept: map['override_dept'] !== undefined ? (row[map['override_dept']] || "") : "",
    containerUid: row[map['container_uid']] || "",
    scanStatus: row[map['scan_status']] || "Assigned",
    outboundTruckUid: map['outbound_truck_uid'] !== undefined ? (row[map['outbound_truck_uid']] || "") : "",
    outboundX: map['outbound_x'] !== undefined && row[map['outbound_x']] !== "" ? Number(row[map['outbound_x']]) : null,
    outboundY: map['outbound_y'] !== undefined && row[map['outbound_y']] !== "" ? Number(row[map['outbound_y']]) : null,
    outboundZ: map['outbound_z'] !== undefined && row[map['outbound_z']] !== "" ? Number(row[map['outbound_z']]) : null,
    outboundRotated: map['outbound_rotated'] !== undefined && (row[map['outbound_rotated']] === true || row[map['outbound_rotated']] === 'true'),
    outboundStaged: map['outbound_staged'] !== undefined && (row[map['outbound_staged']] === true || row[map['outbound_staged']] === 'true'),
    inboundTruckUid: map['inbound_truck_uid'] !== undefined ? (row[map['inbound_truck_uid']] || "") : "",
    inboundX: map['inbound_x'] !== undefined && row[map['inbound_x']] !== "" ? Number(row[map['inbound_x']]) : null,
    inboundY: map['inbound_y'] !== undefined && row[map['inbound_y']] !== "" ? Number(row[map['inbound_y']]) : null,
    inboundZ: map['inbound_z'] !== undefined && row[map['inbound_z']] !== "" ? Number(row[map['inbound_z']]) : null,
    inboundRotated: map['inbound_rotated'] !== undefined && (row[map['inbound_rotated']] === true || row[map['inbound_rotated']] === 'true'),
    inboundStaged: map['inbound_staged'] !== undefined && (row[map['inbound_staged']] === true || row[map['inbound_staged']] === 'true')
  };
}

function getProjectAssetsFirestore_(projectId, startDateStr, endDateStr) {
  return executeWithRetry(function () {
    var hdr = dalGetProjectAssetsHeaderAndMap_();
    var projectRows = dalLoadPaProjectRowsFromFirestore_(projectId, hdr.header, hdr.map);
    var assets = projectRows.map(function (r) {
      return dalFirestoreAssetFromRow_(r.data, hdr.map);
    });

    var sheets = verifyDatabaseSchema(true);
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

function saveProjectAssetsDeltaFirestore_(projectId, deltas, actor) {
  return executeWithRetry(function () {
    assertActorCanEditProjectAssets(actor);
    if (!dalFirestoreIsConfigured_()) {
      throw new Error('Firebase not configured — cannot save during prep session.');
    }
    var hdr = dalGetProjectAssetsHeaderAndMap_();
    var projectRows = dalLoadPaProjectRowsFromFirestore_(projectId, hdr.header, hdr.map);
    var classified = dalApplyPaDeltas_(projectRows, deltas, hdr.map, hdr.colCount, projectId);
    var basePath = dalFirestorePaCollection_(projectId);

    classified.rowsToUpdate.forEach(function (r) {
      var docId = r.docId || String(r.data[hdr.map['uid']]);
      var obj = dalPaSheetRowToObject_(r.data, hdr.map);
      // Preserve/increment writeSeq — full PATCH replace would otherwise wipe host stamps
      // and reopen client LWW thrash against the live listener.
      try {
        var existing = firestoreFetch_('get', basePath + '/' + docId);
        if (existing && existing.fields) {
          var plain = firestoreDecodeFields_(existing.fields);
          obj.writeSeq = (Number(plain.writeSeq || 0) || 0) + 1;
        } else {
          obj.writeSeq = 1;
        }
      } catch (eSeq) {
        obj.writeSeq = 1;
      }
      obj.clientId = 'gas_' + String(actor || 'system');
      firestoreWriteDocument_(basePath + '/' + docId, obj);
    });
    classified.rowsToDelete.forEach(function (docId) {
      firestoreDeleteDocument_(basePath + '/' + docId);
    });
    classified.rowsToAppend.forEach(function (rowData) {
      var docId = String(rowData[hdr.map['uid']] || Utilities.getUuid());
      if (!rowData[hdr.map['uid']]) rowData[hdr.map['uid']] = docId;
      var obj = dalPaSheetRowToObject_(rowData, hdr.map);
      obj.writeSeq = 1;
      obj.clientId = 'gas_' + String(actor || 'system');
      firestoreWriteDocument_(basePath + '/' + docId, obj);
    });

    writeToAuditLog(actor, "UPDATE", "PROJECT_ASSETS_FIRESTORE", projectId, projectId, 'Applied ' + deltas.length + ' delta(s) on prep fork.');
    // Keep live state doc aligned (clients listen to assets/state, not only collection rows).
    try {
      var allRows = dalLoadPaProjectRowsFromFirestore_(projectId, hdr.header, hdr.map);
      var fixtures = (allRows || []).map(function (r) {
        var obj = dalPaSheetRowToObject_(r.data, hdr.map);
        var formula = obj.formula || '';
        var isShortage = String(formula).indexOf('[SHORT] ') === 0;
        if (isShortage) formula = formula.substring(8);
        return {
          uid: String(obj.uid || r.docId || ''),
          assetId: String(obj.asset_uid || ''),
          qty: obj.assigned_quantity != null ? obj.assigned_quantity : 1,
          location: obj.location || 'General',
          formula: formula,
          isShortage: isShortage,
          creator: obj.creator || 'System',
          overrideDept: obj.override_dept || '',
          containerUid: obj.container_uid || '',
          scanStatus: obj.scan_status || 'Assigned'
        };
      });
      var prevSeq = 0;
      try {
        var st = firestoreFetch_('get', basePath + '/state');
        if (st && st.fields) {
          var plain = firestoreDecodeFields_(st.fields);
          prevSeq = Number(plain.writeSeq || 0) || 0;
        }
      } catch (eSt) { prevSeq = 0; }
      firestoreWriteDocument_(basePath + '/state', {
        fixturesJson: JSON.stringify(fixtures),
        writeSeq: prevSeq + 1,
        clientId: 'gas_' + String(actor || 'system'),
        updatedAt: new Date().toISOString(),
        updatedBy: actor || 'System'
      });
    } catch (eState) { /* live clients may seed */ }
    return "Saved Delta";
  });
}

function dalSnapshotPaToFirestore_(projectId, sessionUid, actor) {
  var hdr = dalGetProjectAssetsHeaderAndMap_();
  var projectRows = dalLoadPaProjectRowsFromSheet_(hdr.sheet, hdr.map, projectId);
  var basePath = dalFirestorePaCollection_(projectId);
  var fixtures = [];
  projectRows.forEach(function (r) {
    var obj = dalPaSheetRowToObject_(r.data, hdr.map);
    var docId = String(obj.uid || Utilities.getUuid());
    firestoreWriteDocument_(basePath + '/' + docId, obj);
    var formula = obj.formula || '';
    var isShortage = String(formula).indexOf('[SHORT] ') === 0;
    if (isShortage) formula = formula.substring(8);
    fixtures.push({
      uid: docId,
      assetId: String(obj.asset_uid || ''),
      qty: obj.assigned_quantity != null ? obj.assigned_quantity : 1,
      location: obj.location || 'General',
      formula: formula,
      isShortage: isShortage,
      creator: obj.creator || 'System',
      overrideDept: obj.override_dept || '',
      containerUid: obj.container_uid || '',
      scanStatus: obj.scan_status || 'Assigned'
    });
  });
  // Live collab state doc (timeline twin) — transactional patch target for clients.
  firestoreWriteDocument_(basePath + '/state', {
    fixturesJson: JSON.stringify(fixtures),
    writeSeq: 1,
    clientId: 'snapshot',
    updatedAt: new Date().toISOString(),
    updatedBy: actor || 'System'
  });
  firestoreSetSessionMeta_(projectId, {
    sessionUid: sessionUid,
    sessionType: DAL_SESSION_TYPE.PREP,
    openedAt: new Date().toISOString(),
    openedBy: actor,
    domain: 'assets'
  });
}

function dalCommitPaFromFirestore_(projectId, sessionUid, actor) {
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
        'END PREP mirror mismatch: ' + mirror.summary + ' (committed from state fixtures + collection autos)');
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
  var commitObjs = [];
  var fixtureSource = stateFixtures;
  if ((!fixtureSource || !fixtureSource.length) && colFixtures.length) {
    fixtureSource = colFixtures;
  }
  (fixtureSource || []).forEach(function (pa) {
    if (!pa || !pa.uid || dalPaFixtureIsAuto_(pa)) return;
    commitObjs.push(dalPaFixtureToCommitObj_(pa, projectId));
  });
  colAutoRows.forEach(function (r) {
    commitObjs.push(dalPaSheetRowToObject_(r.data, hdr.map));
  });

  var projectRows = commitObjs.map(function (obj) {
    return { data: dalPaRowObjectToSheetArray_(obj, hdr.header, hdr.map) };
  });
  var intendedObjects = commitObjs;

  // Drop _meta first so live UI closes before the slower row drain finishes.
  firestoreDeleteDocument_('projects/' + projectId + '/assets/_meta');
  // Sheet write under its own short lock — caller must not hold ScriptLock across Firestore UrlFetch.
  executeWithRetry(function () {
    dalDeleteRowsByColumn_(hdr.sheet, 'project_uid', projectId);
    var rows = projectRows.map(function (r) { return r.data; });
    dalAppendRows_(hdr.sheet, rows);
    flushCache();
  });
  // Phase 5A — reconcile before wiping the fork collection (pocket needs intended rows).
  try {
    dalReconcilePaCommit_(projectId, sessionUid, intendedObjects, actor);
  } catch (reconErr) {
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
  firestoreDeleteCollection_(dalFirestorePaCollection_(projectId));
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

function dalSnapshotTimelineToFirestore_(projectId, sessionUid, actor, mode) {
  // Status is "opening" — Sheets path allowed. getTimelineDataSheets_ takes its own short lock.
  var state = getTimelineDataSheets_(projectId, mode || 'main');
  // Meta first so UI can see the fork sooner; state doc carries the payload.
  firestoreSetTimelineSessionMeta_(projectId, {
    sessionUid: sessionUid,
    sessionType: DAL_SESSION_TYPE.TIMELINE_COLLAB,
    openedAt: new Date().toISOString(),
    openedBy: actor,
    domain: 'timeline',
    mode: mode || 'main'
  });
  dalWriteTimelineStateToFirestore_(projectId, mode || 'main', state.shifts || [], state.phases || [], state.overrides || {}, actor, true);
}

function dalCommitTimelineFromFirestore_(projectId, actor, sessionUid) {
  var snap = dalReadTimelineStateFromFirestore_(projectId);
  firestoreDeleteDocument_('projects/' + projectId + '/timeline/_meta');
  if (!snap) {
    firestoreDeleteCollection_(dalFirestoreTimelineCollection_(projectId));
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
  // Status is "committing" — Sheets path allowed. saveTimelineDataSheets_ takes its own short lock.
  saveTimelineDataSheets_(
    projectId,
    snap.mode || 'main',
    snap.shifts || [],
    null,
    snap.phases || [],
    snap.overrides || {},
    null,
    actor || 'System UI',
    null
  );
  try {
    flushCache();
  } catch (eFlush) { /* continue */ }
  try {
    dalReconcileTimelineCommit_(projectId, sessionUid, snap, actor);
  } catch (reconErr) {
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
  firestoreDeleteCollection_(dalFirestoreTimelineCollection_(projectId));
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
          if (tMap['uid'] !== undefined) r[tMap['uid']] = Utilities.getUuid();
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
