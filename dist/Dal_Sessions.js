/**
 * SM Showrunner (smuruner) - Clean 8 Architecture
 * Dal_Sessions.js - DAL session registry + lifecycle (Phase 4 Slice B)
 *
 * Authoritative session flags on Projects_Index. PA prep fork uses Firestore via Dal_Firestore.js.
 */

// @INDEX: DAL -> Session registry (Phase 4)

var DAL_SESSION_TYPE = {
  PREP: 'prep',
  TIMELINE_COLLAB: 'timelineCollab'
};

var DAL_SESSION_INDEX_COLS = [
  'Dal_Session_Type',
  'Dal_Session_Status',
  'Dal_Session_UID',
  'Dal_Session_Opened_At',
  'Dal_Session_Opened_By'
];

/**
 * Lazy-add session columns on Projects_Index (same pattern as Active_Operation).
 */
function dalEnsureSessionIndexColumns_(indexSheet, indexData) {
  var iMap = dalHeaderMapFromRows_(indexData[0] || []);
  DAL_SESSION_INDEX_COLS.forEach(function (colName) {
    if (iMap[colName] !== undefined) return;
    var colIdx = indexData[0].length;
    indexSheet.getRange(1, colIdx + 1).setValue(colName);
    iMap[colName] = colIdx;
    indexData[0].push(colName);
  });
  return iMap;
}

function dalGetProjectIndexRow_(projectId, sheets) {
  var indexData = sheets.index.getDataRange().getValues();
  if (indexData.length === 0) return null;
  var iMap = dalEnsureSessionIndexColumns_(sheets.index, indexData);
  for (var i = 1; i < indexData.length; i++) {
    if (String(indexData[i][iMap['uid']]) === String(projectId)) {
      return { rowNum: i + 1, map: iMap, data: indexData[i] };
    }
  }
  return null;
}

/**
 * Read session record for a project (google.script.run safe — read only).
 */
function getDalSessionInfo(projectId) {
  return executeWithRetry(function () {
    var sheets = verifyDatabaseSchema(true);
    var row = dalGetProjectIndexRow_(projectId, sheets);
    if (!row) return { projectId: projectId, status: DAL_SESSION.NORMAL, sessionType: '', sessionUid: '' };
    var m = row.map;
    return {
      projectId: projectId,
      status: String(row.data[m['Dal_Session_Status']] || DAL_SESSION.NORMAL),
      sessionType: String(row.data[m['Dal_Session_Type']] || ''),
      sessionUid: String(row.data[m['Dal_Session_UID']] || ''),
      openedAt: row.data[m['Dal_Session_Opened_At']] || '',
      openedBy: row.data[m['Dal_Session_Opened_By']] || ''
    };
  }, 3, true);
}

function resolveDalSessionStatus_(projectId, domain) {
  try {
    var sheets = verifyDatabaseSchema(true);
    var row = dalGetProjectIndexRow_(projectId, sheets);
    if (!row) return DAL_SESSION.NORMAL;

    var m = row.map;
    var status = String(row.data[m['Dal_Session_Status']] || '').toLowerCase();
    var sessionType = String(row.data[m['Dal_Session_Type']] || '');

    if (status === 'committing') return DAL_SESSION.COMMITTING;
    if (status !== 'open') return DAL_SESSION.NORMAL;

    if (domain === DAL_DOMAIN.PROJECT_ASSETS && sessionType === DAL_SESSION_TYPE.PREP) {
      return DAL_SESSION.SESSION_OPEN;
    }
    if (domain === DAL_DOMAIN.TIMELINE && sessionType === DAL_SESSION_TYPE.TIMELINE_COLLAB) {
      return DAL_SESSION.SESSION_OPEN;
    }
    return DAL_SESSION.NORMAL;
  } catch (e) {
    return DAL_SESSION.NORMAL;
  }
}

function dalWriteSessionIndexFields_(indexSheet, rowNum, map, fields) {
  Object.keys(fields).forEach(function (col) {
    if (map[col] !== undefined) {
      indexSheet.getRange(rowNum, map[col] + 1).setValue(fields[col]);
    }
  });
}

/**
 * Clear Projects_Index session fields for a known sessionUid (rollback / finish close).
 */
function dalClearSessionIndexIfUid_(projectId, sessionUid) {
  var sheets = verifyDatabaseSchema();
  var row = dalGetProjectIndexRow_(projectId, sheets);
  if (!row) return;
  if (sessionUid && String(row.data[row.map['Dal_Session_UID']] || '') !== String(sessionUid)) return;
  dalWriteSessionIndexFields_(sheets.index, row.rowNum, row.map, {
    Dal_Session_Type: '',
    Dal_Session_Status: '',
    Dal_Session_UID: '',
    Dal_Session_Opened_At: '',
    Dal_Session_Opened_By: ''
  });
  flushCache();
}

/**
 * Open a DAL session. Prep → PA Firestore fork; timelineCollab → timeline Firestore fork.
 * Firestore network runs OUTSIDE ScriptLock so presence pings / other users are not lock-starved.
 */
function openDalSession(projectId, sessionType, actor) {
  if (sessionType === DAL_SESSION_TYPE.TIMELINE_COLLAB) {
    assertActorCanEditTimeline(actor);
  } else {
    assertActorCanManageDalPrepSession(actor);
  }
  if (!dalFirestoreIsConfigured_()) {
    throw new Error('Firebase service account not configured — cannot open session.');
  }
  if (sessionType !== DAL_SESSION_TYPE.PREP && sessionType !== DAL_SESSION_TYPE.TIMELINE_COLLAB) {
    throw new Error('Unknown session type: ' + sessionType);
  }

  var sessionUid = Utilities.getUuid();
  var now = new Date().toISOString();

  // 1) Short lock — reserve slot as "opening" (router still treats as normal until "open").
  executeWithRetry(function () {
    var sheets = verifyDatabaseSchema();
    var row = dalGetProjectIndexRow_(projectId, sheets);
    if (!row) throw new Error('Project not found.');

    var curStatus = String(row.data[row.map['Dal_Session_Status']] || '').toLowerCase();
    if (curStatus === 'open' || curStatus === 'committing' || curStatus === 'opening') {
      throw new Error('A session is already open on this project.');
    }

    dalWriteSessionIndexFields_(sheets.index, row.rowNum, row.map, {
      Dal_Session_Type: sessionType,
      Dal_Session_Status: 'opening',
      Dal_Session_UID: sessionUid,
      Dal_Session_Opened_At: now,
      Dal_Session_Opened_By: actor
    });
    flushCache();
  });

  // 2) Firestore snapshot — no ScriptLock (presence + other edits can proceed).
  try {
    if (sessionType === DAL_SESSION_TYPE.PREP) {
      dalSnapshotPaToFirestore_(projectId, sessionUid, actor);
    } else {
      dalSnapshotTimelineToFirestore_(projectId, sessionUid, actor, 'main');
    }
  } catch (snapErr) {
    try {
      executeWithRetry(function () { dalClearSessionIndexIfUid_(projectId, sessionUid); });
    } catch (clearErr) { /* keep original error */ }
    throw snapErr;
  }

  // 3) Short lock — mark open + audit.
  return executeWithRetry(function () {
    var sheets = verifyDatabaseSchema();
    var row = dalGetProjectIndexRow_(projectId, sheets);
    if (!row) throw new Error('Project not found.');
    if (String(row.data[row.map['Dal_Session_UID']] || '') !== sessionUid) {
      throw new Error('Session open raced — retry.');
    }
    dalWriteSessionIndexFields_(sheets.index, row.rowNum, row.map, {
      Dal_Session_Status: 'open'
    });
    flushCache();
    writeToAuditLog(actor, 'OPEN', 'DAL_SESSION', projectId, sessionUid, 'Opened ' + sessionType + ' session.');
    return { success: true, sessionUid: sessionUid, sessionType: sessionType, status: 'open' };
  });
}

/**
 * Close DAL session — commit Firestore → Sheets, clear fork.
 * Mark committing under short lock; Firestore+commit body outside so ScriptLock is not held for UrlFetch.
 */
function closeDalSession(projectId, actor) {
  var sessionType = executeWithRetry(function () {
    var sheets = verifyDatabaseSchema();
    var row = dalGetProjectIndexRow_(projectId, sheets);
    if (!row) throw new Error('Project not found.');

    var type = String(row.data[row.map['Dal_Session_Type']] || '');
    var curStatus = String(row.data[row.map['Dal_Session_Status']] || '').toLowerCase();
    if (curStatus !== 'open') throw new Error('No open session on this project.');

    if (type === DAL_SESSION_TYPE.TIMELINE_COLLAB) {
      assertActorCanEditTimeline(actor);
    } else {
      assertActorCanManageDalPrepSession(actor);
    }

    // Mark committing on Sheets first so polls never report "open" while Firestore drains.
    dalWriteSessionIndexFields_(sheets.index, row.rowNum, row.map, { Dal_Session_Status: 'committing' });
    flushCache();
    return type;
  });

  try {
    if (sessionType === DAL_SESSION_TYPE.PREP) {
      dalCommitPaFromFirestore_(projectId);
    } else if (sessionType === DAL_SESSION_TYPE.TIMELINE_COLLAB) {
      dalCommitTimelineFromFirestore_(projectId, actor);
    } else {
      throw new Error('Close not implemented for session type: ' + sessionType);
    }
  } catch (commitErr) {
    throw commitErr;
  }

  return executeWithRetry(function () {
    var sheets = verifyDatabaseSchema();
    var row = dalGetProjectIndexRow_(projectId, sheets);
    if (!row) throw new Error('Project not found.');
    dalWriteSessionIndexFields_(sheets.index, row.rowNum, row.map, {
      Dal_Session_Type: '',
      Dal_Session_Status: '',
      Dal_Session_UID: '',
      Dal_Session_Opened_At: '',
      Dal_Session_Opened_By: ''
    });
    flushCache();
    writeToAuditLog(actor, 'CLOSE', 'DAL_SESSION', projectId, projectId, 'Closed ' + sessionType + ' session — committed to Sheets.');
    return { success: true, sessionType: sessionType, status: 'closed' };
  });
}
