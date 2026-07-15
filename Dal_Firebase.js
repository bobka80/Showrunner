/**
 * SM Showrunner (smuruner) - Clean 8 Architecture
 * Dal_Firebase.js - FirebaseAdapter (Phase 4 — PA prep + timeline collab fork via GAS Firestore REST)
 *
 * Prep session: PA reads/writes Firestore.
 * Timeline collab session: timeline reads/writes Firestore.
 * Ledger always Sheets. Saves during session still go through google.script.run.
 */

// @INDEX: DAL -> Firebase adapter (Phase 4)

var __dalFirebaseAdapterSingleton = null;

var DAL_FIRESTORE_PA_COLLECTION = 'assets';
var DAL_FIRESTORE_TIMELINE_COLLECTION = 'timeline';

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
    return doc._docId !== '_meta';
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
      firestoreWriteDocument_(basePath + '/' + docId, dalPaSheetRowToObject_(r.data, hdr.map));
    });
    classified.rowsToDelete.forEach(function (docId) {
      firestoreDeleteDocument_(basePath + '/' + docId);
    });
    classified.rowsToAppend.forEach(function (rowData) {
      var docId = String(rowData[hdr.map['uid']] || Utilities.getUuid());
      if (!rowData[hdr.map['uid']]) rowData[hdr.map['uid']] = docId;
      firestoreWriteDocument_(basePath + '/' + docId, dalPaSheetRowToObject_(rowData, hdr.map));
    });

    writeToAuditLog(actor, "UPDATE", "PROJECT_ASSETS_FIRESTORE", projectId, projectId, 'Applied ' + deltas.length + ' delta(s) on prep fork.');
    return "Saved Delta";
  });
}

function dalSnapshotPaToFirestore_(projectId, sessionUid, actor) {
  var hdr = dalGetProjectAssetsHeaderAndMap_();
  var projectRows = dalLoadPaProjectRowsFromSheet_(hdr.sheet, hdr.map, projectId);
  var basePath = dalFirestorePaCollection_(projectId);
  projectRows.forEach(function (r) {
    var obj = dalPaSheetRowToObject_(r.data, hdr.map);
    var docId = String(obj.uid || Utilities.getUuid());
    firestoreWriteDocument_(basePath + '/' + docId, obj);
  });
  firestoreSetSessionMeta_(projectId, {
    sessionUid: sessionUid,
    sessionType: DAL_SESSION_TYPE.PREP,
    openedAt: new Date().toISOString(),
    openedBy: actor,
    domain: 'assets'
  });
}

function dalCommitPaFromFirestore_(projectId) {
  var hdr = dalGetProjectAssetsHeaderAndMap_();
  var projectRows = dalLoadPaProjectRowsFromFirestore_(projectId, hdr.header, hdr.map);
  // Drop _meta first so live UI closes before the slower row drain finishes.
  firestoreDeleteDocument_('projects/' + projectId + '/assets/_meta');
  dalDeleteRowsByColumn_(hdr.sheet, 'project_uid', projectId);
  var rows = projectRows.map(function (r) { return r.data; });
  dalAppendRows_(hdr.sheet, rows);
  firestoreDeleteCollection_(dalFirestorePaCollection_(projectId));
}

function dalFirestoreTimelineCollection_(projectId) {
  return 'projects/' + projectId + '/' + DAL_FIRESTORE_TIMELINE_COLLECTION;
}

function dalWriteTimelineStateToFirestore_(projectId, mode, shifts, phases, overrides, actor) {
  firestoreWriteDocument_(dalFirestoreTimelineCollection_(projectId) + '/state', {
    mode: mode || 'main',
    shiftsJson: JSON.stringify(shifts || []),
    phasesJson: JSON.stringify(phases || []),
    overridesJson: JSON.stringify(overrides || {}),
    updatedAt: new Date().toISOString(),
    updatedBy: actor || 'System'
  });
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
  __dalTimelineSheetsDirect_ = true;
  var state;
  try {
    state = getTimelineDataSheets_(projectId, mode || 'main');
  } finally {
    __dalTimelineSheetsDirect_ = false;
  }
  dalWriteTimelineStateToFirestore_(projectId, mode || 'main', state.shifts || [], state.phases || [], state.overrides || {}, actor);
  firestoreSetTimelineSessionMeta_(projectId, {
    sessionUid: sessionUid,
    sessionType: DAL_SESSION_TYPE.TIMELINE_COLLAB,
    openedAt: new Date().toISOString(),
    openedBy: actor,
    domain: 'timeline',
    mode: mode || 'main'
  });
}

function dalCommitTimelineFromFirestore_(projectId, actor) {
  var snap = dalReadTimelineStateFromFirestore_(projectId);
  firestoreDeleteDocument_('projects/' + projectId + '/timeline/_meta');
  if (!snap) {
    firestoreDeleteCollection_(dalFirestoreTimelineCollection_(projectId));
    return;
  }
  // Commit through Sheets path without nested ScriptLock (caller already holds DAL session lock).
  __dalTimelineSheetsDirect_ = true;
  try {
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
  } finally {
    __dalTimelineSheetsDirect_ = false;
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
      return sheets.persistOperationsBatch(projectId, batch, actor);
    },
    startOperationSession: function (projectId, operationType, actor) {
      return sheets.startOperationSession(projectId, operationType, actor);
    },
    finalizeOperationSession: function (projectId, actor) {
      return sheets.finalizeOperationSession(projectId, actor);
    },
    processRfidScanOp: function (projectId, rfidTag, actor) {
      return sheets.processRfidScanOp(projectId, rfidTag, actor);
    }
  };
}
