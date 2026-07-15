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

/** Stale "opening" after client timeout / "committing" after crashed close — reclaim so START COLLAB is not dead. */
var DAL_STALE_OPENING_MS_ = 90 * 1000;
var DAL_STALE_COMMITTING_MS_ = 5 * 60 * 1000;

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

function dalSessionOpenedAtMs_(row) {
  if (!row || !row.map || row.map['Dal_Session_Opened_At'] === undefined) return 0;
  var raw = row.data[row.map['Dal_Session_Opened_At']];
  if (raw === null || raw === undefined || raw === '') return 0;
  if (Object.prototype.toString.call(raw) === '[object Date]') return raw.getTime();
  var t = new Date(raw).getTime();
  return isNaN(t) ? 0 : t;
}

/**
 * Clear stuck opening/committing rows so a failed START COLLAB does not permanently block the project.
 * Must be called inside executeWithRetry (holds sheet write lock).
 */
function dalReclaimStaleSessionRow_(indexSheet, row) {
  var status = String(row.data[row.map['Dal_Session_Status']] || '').toLowerCase();
  if (status !== 'opening' && status !== 'committing') return false;
  var openedMs = dalSessionOpenedAtMs_(row);
  var age = openedMs ? (Date.now() - openedMs) : Number.POSITIVE_INFINITY;
  var limit = status === 'opening' ? DAL_STALE_OPENING_MS_ : DAL_STALE_COMMITTING_MS_;
  if (age < limit) return false;
  dalWriteSessionIndexFields_(indexSheet, row.rowNum, row.map, {
    Dal_Session_Type: '',
    Dal_Session_Status: '',
    Dal_Session_UID: '',
    Dal_Session_Opened_At: '',
    Dal_Session_Opened_By: ''
  });
  row.data[row.map['Dal_Session_Type']] = '';
  row.data[row.map['Dal_Session_Status']] = '';
  row.data[row.map['Dal_Session_UID']] = '';
  flushCache();
  return true;
}

function dalAssertCanOpenSessionType_(sessionType, actor) {
  if (sessionType === DAL_SESSION_TYPE.TIMELINE_COLLAB) {
    assertActorCanEditTimeline(actor);
  } else if (sessionType === DAL_SESSION_TYPE.PREP) {
    assertActorCanManageDalPrepSession(actor);
  } else {
    throw new Error('Unknown session type: ' + sessionType);
  }
  if (!dalFirestoreIsConfigured_()) {
    throw new Error('Firebase service account not configured — cannot open session.');
  }
}

/**
 * Phase 1 of open — join existing same-type session, or reserve "opening".
 * Timeline UI chains this with finishDalSession so each google.script.run stays under timeout.
 */
function beginDalSession(projectId, sessionType, actor) {
  dalAssertCanOpenSessionType_(sessionType, actor);
  var sessionUid = Utilities.getUuid();
  var now = new Date().toISOString();

  return executeWithRetry(function () {
    var sheets = verifyDatabaseSchema();
    var row = dalGetProjectIndexRow_(projectId, sheets);
    if (!row) throw new Error('Project not found.');

    dalReclaimStaleSessionRow_(sheets.index, row);

    var curStatus = String(row.data[row.map['Dal_Session_Status']] || '').toLowerCase();
    var curType = String(row.data[row.map['Dal_Session_Type']] || '');
    var curUid = String(row.data[row.map['Dal_Session_UID']] || '');

    // Second user (or retry after timeout): join live same-type session — no re-snapshot.
    if (curStatus === 'open' && curType === sessionType) {
      return {
        success: true,
        joined: true,
        sessionUid: curUid,
        sessionType: sessionType,
        status: 'open'
      };
    }

    if (curStatus === 'open' || curStatus === 'committing' || curStatus === 'opening') {
      throw new Error(
        'A session is already ' + curStatus + ' on this project' +
        (curType ? ' (' + curType + ')' : '') +
        '. End that session first, or wait ~90s if a prior START COLLAB timed out.'
      );
    }

    dalWriteSessionIndexFields_(sheets.index, row.rowNum, row.map, {
      Dal_Session_Type: sessionType,
      Dal_Session_Status: 'opening',
      Dal_Session_UID: sessionUid,
      Dal_Session_Opened_At: now,
      Dal_Session_Opened_By: actor
    });
    flushCache();
    return {
      success: true,
      joined: false,
      sessionUid: sessionUid,
      sessionType: sessionType,
      status: 'opening'
    };
  });
}

/**
 * Phase 2 of open — Firestore snapshot + mark open (no ScriptLock across UrlFetch).
 */
function finishDalSession(projectId, sessionUid, actor) {
  if (!sessionUid) throw new Error('Missing sessionUid — call beginDalSession first.');

  var gate = executeWithRetry(function () {
    var sheets = verifyDatabaseSchema();
    var row = dalGetProjectIndexRow_(projectId, sheets);
    if (!row) throw new Error('Project not found.');
    if (String(row.data[row.map['Dal_Session_UID']] || '') !== String(sessionUid)) {
      throw new Error('Session open raced — retry START COLLAB.');
    }
    var status = String(row.data[row.map['Dal_Session_Status']] || '').toLowerCase();
    var type = String(row.data[row.map['Dal_Session_Type']] || '');
    if (status === 'open') {
      return {
        alreadyOpen: true,
        result: {
          success: true,
          joined: true,
          sessionUid: sessionUid,
          sessionType: type,
          status: 'open'
        }
      };
    }
    if (status !== 'opening') {
      throw new Error('Session is not opening (status=' + status + '). Retry START COLLAB.');
    }
    dalAssertCanOpenSessionType_(type, actor);
    return { alreadyOpen: false, sessionType: type };
  });

  if (gate.alreadyOpen) return gate.result;

  var sessionType = gate.sessionType;
  try {
    if (sessionType === DAL_SESSION_TYPE.PREP) {
      dalSnapshotPaToFirestore_(projectId, sessionUid, actor);
    } else if (sessionType === DAL_SESSION_TYPE.TIMELINE_COLLAB) {
      dalSnapshotTimelineToFirestore_(projectId, sessionUid, actor, 'main');
    } else {
      throw new Error('Unknown session type: ' + sessionType);
    }
  } catch (snapErr) {
    try {
      executeWithRetry(function () { dalClearSessionIndexIfUid_(projectId, sessionUid); });
    } catch (clearErr) { /* keep original error */ }
    throw snapErr;
  }

  return executeWithRetry(function () {
    var sheets = verifyDatabaseSchema();
    var row = dalGetProjectIndexRow_(projectId, sheets);
    if (!row) throw new Error('Project not found.');
    if (String(row.data[row.map['Dal_Session_UID']] || '') !== String(sessionUid)) {
      throw new Error('Session open raced — retry.');
    }
    dalWriteSessionIndexFields_(sheets.index, row.rowNum, row.map, {
      Dal_Session_Status: 'open'
    });
    flushCache();
    writeToAuditLog(actor, 'OPEN', 'DAL_SESSION', projectId, sessionUid, 'Opened ' + sessionType + ' session.');
    return { success: true, joined: false, sessionUid: sessionUid, sessionType: sessionType, status: 'open' };
  });
}

/**
 * Open a DAL session (prep or timelineCollab). Wrapper = begin + finish.
 * Timeline UI prefers beginDalSession → finishDalSession to avoid client timeout.
 */
function openDalSession(projectId, sessionType, actor) {
  var begin = beginDalSession(projectId, sessionType, actor);
  if (begin && begin.joined) return begin;
  return finishDalSession(projectId, begin.sessionUid, actor);
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

    // Abort a stuck/half-open reserve without commit (client timed out during START COLLAB).
    if (curStatus === 'opening') {
      if (type === DAL_SESSION_TYPE.TIMELINE_COLLAB) assertActorCanEditTimeline(actor);
      else assertActorCanManageDalPrepSession(actor);
      dalWriteSessionIndexFields_(sheets.index, row.rowNum, row.map, {
        Dal_Session_Type: '',
        Dal_Session_Status: '',
        Dal_Session_UID: '',
        Dal_Session_Opened_At: '',
        Dal_Session_Opened_By: ''
      });
      flushCache();
      return { abortOpening: true, type: type };
    }

    if (curStatus !== 'open') throw new Error('No open session on this project.');

    if (type === DAL_SESSION_TYPE.TIMELINE_COLLAB) {
      assertActorCanEditTimeline(actor);
    } else {
      assertActorCanManageDalPrepSession(actor);
    }

    // Mark committing on Sheets first so polls never report "open" while Firestore drains.
    dalWriteSessionIndexFields_(sheets.index, row.rowNum, row.map, { Dal_Session_Status: 'committing' });
    flushCache();
    return { abortOpening: false, type: type };
  });

  if (sessionType && sessionType.abortOpening) {
    try {
      if (sessionType.type === DAL_SESSION_TYPE.TIMELINE_COLLAB) {
        firestoreDeleteDocument_('projects/' + projectId + '/timeline/_meta');
        firestoreDeleteCollection_(dalFirestoreTimelineCollection_(projectId));
      } else if (sessionType.type === DAL_SESSION_TYPE.PREP) {
        firestoreDeleteDocument_('projects/' + projectId + '/assets/_meta');
      }
    } catch (cleanErr) { /* index already cleared */ }
    return { success: true, sessionType: sessionType.type, status: 'aborted' };
  }
  sessionType = sessionType.type;

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
