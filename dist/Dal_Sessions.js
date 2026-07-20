/**
 * SM Showrunner (smuruner) - Clean 8 Architecture
 * Dal_Sessions.js - DAL session registry + lifecycle (Phase 4 Slice B + Slice D dual-domain)
 *
 * Authoritative session flags on Projects_Index. Prep and timelineCollab use independent column families.
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
  'Dal_Session_Opened_By',
  'Dal_Prep_Session_Status',
  'Dal_Prep_Session_UID',
  'Dal_Prep_Session_Opened_At',
  'Dal_Prep_Session_Opened_By',
  'Dal_Timeline_Session_Status',
  'Dal_Timeline_Session_UID',
  'Dal_Timeline_Session_Opened_At',
  'Dal_Timeline_Session_Opened_By'
];

function dalSessionFamilyPrefix_(sessionType) {
  if (sessionType === DAL_SESSION_TYPE.PREP) return 'Dal_Prep_Session';
  if (sessionType === DAL_SESSION_TYPE.TIMELINE_COLLAB) return 'Dal_Timeline_Session';
  throw new Error('Unknown session type: ' + sessionType);
}

function dalDomainSessionCols_(sessionType) {
  var p = dalSessionFamilyPrefix_(sessionType);
  return {
    status: p + '_Status',
    uid: p + '_UID',
    openedAt: p + '_Opened_At',
    openedBy: p + '_Opened_By'
  };
}

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

function dalReadDomainSession_(row, sessionType) {
  var cols = dalDomainSessionCols_(sessionType);
  var m = row.map;
  var status = m[cols.status] !== undefined ? String(row.data[m[cols.status]] || '') : '';
  return {
    status: status,
    sessionUid: m[cols.uid] !== undefined ? String(row.data[m[cols.uid]] || '') : '',
    openedAt: m[cols.openedAt] !== undefined ? (row.data[m[cols.openedAt]] || '') : '',
    openedBy: m[cols.openedBy] !== undefined ? String(row.data[m[cols.openedBy]] || '') : '',
    sessionType: sessionType
  };
}

function dalWriteDomainSession_(indexSheet, rowNum, map, sessionType, fields) {
  var cols = dalDomainSessionCols_(sessionType);
  var write = {};
  if (fields.status !== undefined) write[cols.status] = fields.status;
  if (fields.sessionUid !== undefined) write[cols.uid] = fields.sessionUid;
  if (fields.openedAt !== undefined) write[cols.openedAt] = fields.openedAt;
  if (fields.openedBy !== undefined) write[cols.openedBy] = fields.openedBy;
  dalWriteSessionIndexFields_(indexSheet, rowNum, map, write);
}

function dalClearDomainSession_(indexSheet, rowNum, map, sessionType) {
  dalWriteDomainSession_(indexSheet, rowNum, map, sessionType, {
    status: '',
    sessionUid: '',
    openedAt: '',
    openedBy: ''
  });
}

/** Domain-scoped cache bump — must not flush the other live fork's readers. */
function dalFlushDomainCache_(projectId, sessionType) {
  var tag = (sessionType === DAL_SESSION_TYPE.TIMELINE_COLLAB)
    ? dalCacheTagTimeline_(projectId)
    : dalCacheTagPa_(projectId);
  if (typeof dalInvalidateCacheTags_ === 'function') {
    dalInvalidateCacheTags_([tag]);
  } else {
    flushCache();
  }
}

function dalDomainOpenedAtMs_(row, sessionType) {
  var cols = dalDomainSessionCols_(sessionType);
  if (!row || !row.map || row.map[cols.openedAt] === undefined) return 0;
  var raw = row.data[row.map[cols.openedAt]];
  if (raw === null || raw === undefined || raw === '') return 0;
  if (Object.prototype.toString.call(raw) === '[object Date]') return raw.getTime();
  var t = new Date(raw).getTime();
  return isNaN(t) ? 0 : t;
}

/**
 * Copy singleton Dal_Session_* into the matching domain family once, then clear legacy columns.
 */
function dalMigrateLegacySessionToDomain_(indexSheet, row) {
  var legacyType = String(row.data[row.map['Dal_Session_Type']] || '');
  var legacyStatus = String(row.data[row.map['Dal_Session_Status']] || '');
  if (!legacyType || !legacyStatus) return false;

  var domain = dalReadDomainSession_(row, legacyType);
  if (!domain.status) {
    dalWriteDomainSession_(indexSheet, row.rowNum, row.map, legacyType, {
      status: legacyStatus,
      sessionUid: row.data[row.map['Dal_Session_UID']],
      openedAt: row.data[row.map['Dal_Session_Opened_At']],
      openedBy: row.data[row.map['Dal_Session_Opened_By']]
    });
    var cols = dalDomainSessionCols_(legacyType);
    row.data[row.map[cols.status]] = legacyStatus;
    row.data[row.map[cols.uid]] = row.data[row.map['Dal_Session_UID']];
    row.data[row.map[cols.openedAt]] = row.data[row.map['Dal_Session_Opened_At']];
    row.data[row.map[cols.openedBy]] = row.data[row.map['Dal_Session_Opened_By']];
  }

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

function dalFindSessionTypeForUid_(row, sessionUid) {
  if (!sessionUid) return '';
  var uid = String(sessionUid);
  var prep = dalReadDomainSession_(row, DAL_SESSION_TYPE.PREP);
  if (prep.sessionUid === uid) return DAL_SESSION_TYPE.PREP;
  var tl = dalReadDomainSession_(row, DAL_SESSION_TYPE.TIMELINE_COLLAB);
  if (tl.sessionUid === uid) return DAL_SESSION_TYPE.TIMELINE_COLLAB;
  if (String(row.data[row.map['Dal_Session_UID']] || '') === uid) {
    return String(row.data[row.map['Dal_Session_Type']] || '');
  }
  return '';
}

function dalDomainInfoPayload_(domain) {
  var openedAt = domain && domain.openedAt;
  if (openedAt && Object.prototype.toString.call(openedAt) === '[object Date]') {
    openedAt = openedAt.toISOString();
  } else if (openedAt === null || openedAt === undefined) {
    openedAt = '';
  } else {
    openedAt = String(openedAt);
  }
  return {
    status: domain ? String(domain.status || '') : '',
    sessionUid: domain ? String(domain.sessionUid || '') : '',
    openedAt: openedAt,
    openedBy: domain ? String(domain.openedBy || '') : '',
    sessionType: domain ? String(domain.sessionType || '') : ''
  };
}

/**
 * Legacy flat fields: only when exactly one domain is active.
 * When both prep + timeline are open, flat fields stay empty so clients cannot
 * mistake prep for timeline (Slice D dual-domain).
 */
function dalLegacyFlatFromDomains_(prep, timeline) {
  var prepOn = !!(prep && prep.status);
  var tlOn = !!(timeline && timeline.status);
  if (prepOn && tlOn) {
    return { status: '', sessionType: '', sessionUid: '', openedAt: '', openedBy: '' };
  }
  var pick = prepOn ? prep : (tlOn ? timeline : null);
  if (!pick) {
    return { status: '', sessionType: '', sessionUid: '', openedAt: '', openedBy: '' };
  }
  var flat = dalDomainInfoPayload_(pick);
  return {
    status: flat.status,
    sessionType: flat.sessionType,
    sessionUid: flat.sessionUid,
    openedAt: flat.openedAt,
    openedBy: flat.openedBy
  };
}

/**
 * Read session records for a project (google.script.run safe — read only).
 * Always includes flat prepStatus / timelineStatus fields (nested objects alone are unreliable for dual-domain UI).
 */
function getDalSessionInfo(projectId) {
  return executeWithRetry(function () {
    var sheets = verifyDatabaseSchema(true);
    var row = dalGetProjectIndexRow_(projectId, sheets);
    if (!row) {
      return {
        projectId: projectId,
        prepStatus: '',
        prepUid: '',
        prepOpenedAt: '',
        prepOpenedBy: '',
        timelineStatus: '',
        timelineUid: '',
        timelineOpenedAt: '',
        timelineOpenedBy: '',
        status: '',
        sessionType: '',
        sessionUid: '',
        openedAt: '',
        openedBy: ''
      };
    }

    dalMigrateLegacySessionToDomain_(sheets.index, row);

    var prep = dalDomainInfoPayload_(dalReadDomainSession_(row, DAL_SESSION_TYPE.PREP));
    var timeline = dalDomainInfoPayload_(dalReadDomainSession_(row, DAL_SESSION_TYPE.TIMELINE_COLLAB));
    var legacy = dalLegacyFlatFromDomains_(prep, timeline);
    return {
      projectId: projectId,
      prep: prep,
      timeline: timeline,
      prepStatus: prep.status,
      prepUid: prep.sessionUid,
      prepOpenedAt: prep.openedAt,
      prepOpenedBy: prep.openedBy,
      timelineStatus: timeline.status,
      timelineUid: timeline.sessionUid,
      timelineOpenedAt: timeline.openedAt,
      timelineOpenedBy: timeline.openedBy,
      status: legacy.status,
      sessionType: legacy.sessionType,
      sessionUid: legacy.sessionUid,
      openedAt: legacy.openedAt,
      openedBy: legacy.openedBy
    };
  }, 3, true);
}

/** True when domain session status means the fork is on Firebase (live or in transition). */
function dalStatusIsForkLive_(status) {
  var st = String(status || '').toLowerCase();
  return st === 'open' || st === 'opening' || st === 'committing';
}

/**
 * Lightweight map of projects with an active prep and/or timeline fork (calendar chrome).
 * Returns { [projectId]: { prep: boolean, timeline: boolean } } — only entries with at least one true.
 */
function getOpenDalForkMap() {
  return executeWithRetry(function () {
    var sheets = verifyDatabaseSchema(true);
    var indexData = sheets.index.getDataRange().getValues();
    if (!indexData.length) return {};
    var iMap = {};
    (indexData[0] || []).forEach(function (h, idx) {
      iMap[String(h || '').trim()] = idx;
    });
    var out = {};
    var prepCol = iMap['Dal_Prep_Session_Status'];
    var tlCol = iMap['Dal_Timeline_Session_Status'];
    var uidCol = iMap['uid'];
    for (var i = 1; i < indexData.length; i++) {
      var pid = uidCol !== undefined ? String(indexData[i][uidCol] || '') : '';
      if (!pid || pid === 'uid') continue;
      var prep = prepCol !== undefined && dalStatusIsForkLive_(indexData[i][prepCol]);
      var timeline = tlCol !== undefined && dalStatusIsForkLive_(indexData[i][tlCol]);
      if (prep || timeline) {
        out[pid] = { prep: !!prep, timeline: !!timeline };
      }
    }
    return out;
  }, 3, true);
}

function resolveDalSessionStatus_(projectId, domain) {
  try {
    var sheets = verifyDatabaseSchema(true);
    var row = dalGetProjectIndexRow_(projectId, sheets);
    if (!row) return DAL_SESSION.NORMAL;

    dalMigrateLegacySessionToDomain_(sheets.index, row);

    var sessionType = domain === DAL_DOMAIN.PROJECT_ASSETS
      ? DAL_SESSION_TYPE.PREP
      : DAL_SESSION_TYPE.TIMELINE_COLLAB;
    var d = dalReadDomainSession_(row, sessionType);
    var status = String(d.status || '').toLowerCase();

    if (status === 'committing') return DAL_SESSION.COMMITTING;
    if (status === 'open') return DAL_SESSION.SESSION_OPEN;
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

/** Stale "opening" after client timeout / "committing" after crashed close — reclaim per domain. */
var DAL_STALE_OPENING_MS_ = 90 * 1000;
var DAL_STALE_COMMITTING_MS_ = 5 * 60 * 1000;

function dalClearDomainSessionIfUid_(projectId, sessionType, sessionUid) {
  var sheets = verifyDatabaseSchema();
  var row = dalGetProjectIndexRow_(projectId, sheets);
  if (!row) return;
  var d = dalReadDomainSession_(row, sessionType);
  if (sessionUid && d.sessionUid !== String(sessionUid)) return;
  dalClearDomainSession_(sheets.index, row.rowNum, row.map, sessionType);
  dalFlushDomainCache_(projectId, sessionType);
}

function dalReclaimStaleDomainSession_(indexSheet, row, sessionType) {
  var cols = dalDomainSessionCols_(sessionType);
  var status = String(row.data[row.map[cols.status]] || '').toLowerCase();
  if (status !== 'opening' && status !== 'committing') return false;
  var openedMs = dalDomainOpenedAtMs_(row, sessionType);
  var age = openedMs ? (Date.now() - openedMs) : Number.POSITIVE_INFINITY;
  var limit = status === 'opening' ? DAL_STALE_OPENING_MS_ : DAL_STALE_COMMITTING_MS_;
  if (age < limit) return false;
  dalClearDomainSession_(indexSheet, row.rowNum, row.map, sessionType);
  row.data[row.map[cols.status]] = '';
  row.data[row.map[cols.uid]] = '';
  flushCache();
  return true;
}

function dalAssertCanOpenSessionType_(sessionType, actor) {
  dalAssertNotLiveForkExcluded_(actor);
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

/** Freelancer / tunneling crew stay on Sheets — never open or join live forks. */
function dalAssertNotLiveForkExcluded_(actor) {
  if (typeof getUserSecurityProfile !== 'function') return;
  var profile = getUserSecurityProfile(actor);
  if (!profile) return;
  if (profile.isFreelancer || profile.tunneling) {
    throw new Error('Live collaboration is not available for freelancer accounts.');
  }
}

/**
 * Phase 1 of open — join existing same-type session, or reserve "opening" on this domain only.
 */
/**
 * Phase 1 of open — join existing same-type session, or reserve "opening" on this domain only.
 * opts.takeOver: credentialed desktop may clear a stuck "opening" and reserve a new one (Part B2).
 */
function beginDalSession(projectId, sessionType, actor, opts) {
  opts = opts || {};
  dalAssertCanOpenSessionType_(sessionType, actor);
  var sessionUid = Utilities.getUuid();
  var now = new Date().toISOString();

  return executeWithRetry(function () {
    var sheets = verifyDatabaseSchema();
    var row = dalGetProjectIndexRow_(projectId, sheets);
    if (!row) throw new Error('Project not found.');

    dalMigrateLegacySessionToDomain_(sheets.index, row);
    dalReclaimStaleDomainSession_(sheets.index, row, sessionType);

    var cur = dalReadDomainSession_(row, sessionType);
    var curStatus = String(cur.status || '').toLowerCase();
    var curUid = cur.sessionUid;

    if (curStatus === 'open') {
      return {
        success: true,
        joined: true,
        sessionUid: curUid,
        sessionType: sessionType,
        status: 'open'
      };
    }

    if (curStatus === 'opening' && opts.takeOver) {
      var colsTake = dalDomainSessionCols_(sessionType);
      dalClearDomainSession_(sheets.index, row.rowNum, row.map, sessionType);
      if (row.map[colsTake.status] !== undefined) row.data[row.map[colsTake.status]] = '';
      if (row.map[colsTake.uid] !== undefined) row.data[row.map[colsTake.uid]] = '';
      curStatus = '';
      curUid = '';
      writeToAuditLog(actor, 'TAKEOVER', 'DAL_SESSION', projectId, '',
        'Took over stuck opening ' + sessionType + ' session.');
    } else if (curStatus === 'committing' || curStatus === 'opening') {
      throw new Error(
        'A ' + sessionType + ' session is already ' + curStatus + ' on this project.' +
        (curStatus === 'opening' ? ' Wait ~90s if a prior start timed out, or End Collab / End Prep to abort.' : ' End that session first.')
      );
    }

    dalWriteDomainSession_(sheets.index, row.rowNum, row.map, sessionType, {
      status: 'opening',
      sessionUid: sessionUid,
      openedAt: now,
      openedBy: actor
    });
    dalFlushDomainCache_(projectId, sessionType);
    return {
      success: true,
      joined: false,
      sessionUid: sessionUid,
      sessionType: sessionType,
      status: 'opening',
      openedBy: actor,
      openedAt: now
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

    dalMigrateLegacySessionToDomain_(sheets.index, row);
    var sessionType = dalFindSessionTypeForUid_(row, sessionUid);
    if (!sessionType) throw new Error('Session open raced — retry START COLLAB.');

    var cur = dalReadDomainSession_(row, sessionType);
    var status = String(cur.status || '').toLowerCase();
    if (status === 'open') {
      return {
        alreadyOpen: true,
        result: {
          success: true,
          joined: true,
          sessionUid: sessionUid,
          sessionType: sessionType,
          status: 'open'
        }
      };
    }
    if (status !== 'opening') {
      throw new Error('Session is not opening (status=' + status + '). Retry START COLLAB.');
    }
    dalAssertCanOpenSessionType_(sessionType, actor);
    return { alreadyOpen: false, sessionType: sessionType };
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
      executeWithRetry(function () { dalClearDomainSessionIfUid_(projectId, sessionType, sessionUid); });
    } catch (clearErr) { /* keep original error */ }
    throw snapErr;
  }

  return executeWithRetry(function () {
    var sheets = verifyDatabaseSchema();
    var row = dalGetProjectIndexRow_(projectId, sheets);
    if (!row) throw new Error('Project not found.');
    var resolvedType = dalFindSessionTypeForUid_(row, sessionUid);
    if (!resolvedType) throw new Error('Session open raced — retry.');
    var cur = dalReadDomainSession_(row, resolvedType);
    if (cur.sessionUid !== String(sessionUid)) throw new Error('Session open raced — retry.');
    dalWriteDomainSession_(sheets.index, row.rowNum, row.map, resolvedType, { status: 'open' });
    dalFlushDomainCache_(projectId, resolvedType);
    writeToAuditLog(actor, 'OPEN', 'DAL_SESSION', projectId, sessionUid, 'Opened ' + resolvedType + ' session.');
    return { success: true, joined: false, sessionUid: sessionUid, sessionType: resolvedType, status: 'open' };
  });
}

/**
 * Open a DAL session (prep or timelineCollab). Wrapper = begin + finish.
 */
function openDalSession(projectId, sessionType, actor) {
  var begin = beginDalSession(projectId, sessionType, actor);
  if (begin && begin.joined) return begin;
  return finishDalSession(projectId, begin.sessionUid, actor);
}

/**
 * Close one domain's DAL session — commit Firestore → Sheets, clear that fork only.
 * sessionType: 'prep' | 'timelineCollab' (required when both domains may be open).
 */
function closeDalSession(projectId, actor, sessionType) {
  if (!sessionType) {
    throw new Error('Missing session type — pass prep or timelineCollab.');
  }

  var gate = executeWithRetry(function () {
    var sheets = verifyDatabaseSchema();
    var row = dalGetProjectIndexRow_(projectId, sheets);
    if (!row) throw new Error('Project not found.');

    dalMigrateLegacySessionToDomain_(sheets.index, row);
    var cur = dalReadDomainSession_(row, sessionType);
    var curStatus = String(cur.status || '').toLowerCase();

    if (curStatus === 'opening') {
      if (sessionType === DAL_SESSION_TYPE.TIMELINE_COLLAB) assertActorCanEditTimeline(actor);
      else assertActorCanManageDalPrepSession(actor);
      dalClearDomainSession_(sheets.index, row.rowNum, row.map, sessionType);
      dalFlushDomainCache_(projectId, sessionType);
      return { abortOpening: true, type: sessionType };
    }

    if (curStatus !== 'open') throw new Error('No open ' + sessionType + ' session on this project.');

    if (sessionType === DAL_SESSION_TYPE.TIMELINE_COLLAB) {
      assertActorCanEditTimeline(actor);
    } else {
      assertActorCanManageDalPrepSession(actor);
    }

    dalWriteDomainSession_(sheets.index, row.rowNum, row.map, sessionType, { status: 'committing' });
    dalFlushDomainCache_(projectId, sessionType);
    return { abortOpening: false, type: sessionType, sessionUid: cur.sessionUid };
  });

  if (gate && gate.abortOpening) {
    try {
      if (gate.type === DAL_SESSION_TYPE.TIMELINE_COLLAB) {
        firestoreDeleteDocument_('projects/' + projectId + '/timeline/_meta');
        firestoreDeleteCollection_(dalFirestoreTimelineCollection_(projectId));
      } else if (gate.type === DAL_SESSION_TYPE.PREP) {
        firestoreDeleteDocument_('projects/' + projectId + '/assets/_meta');
      }
    } catch (cleanErr) { /* index already cleared */ }
    return { success: true, sessionType: gate.type, status: 'aborted' };
  }

  var closingType = gate.type;
  var closingUid = gate.sessionUid || '';

  try {
    if (closingType === DAL_SESSION_TYPE.PREP) {
      dalCommitPaFromFirestore_(projectId, closingUid, actor);
    } else if (closingType === DAL_SESSION_TYPE.TIMELINE_COLLAB) {
      dalCommitTimelineFromFirestore_(projectId, actor, closingUid);
    } else {
      throw new Error('Close not implemented for session type: ' + closingType);
    }
  } catch (commitErr) {
    // B fail-safe: reopen domain so floor can retry; fork/backup retained by commit helpers.
    try {
      executeWithRetry(function () {
        var sheets = verifyDatabaseSchema();
        var row = dalGetProjectIndexRow_(projectId, sheets);
        if (!row) return;
        var cur = dalReadDomainSession_(row, closingType);
        dalWriteDomainSession_(sheets.index, row.rowNum, row.map, closingType, {
          status: 'open',
          sessionUid: cur.sessionUid || closingUid,
          openedAt: cur.openedAt || new Date().toISOString(),
          openedBy: cur.openedBy || actor
        });
        dalFlushDomainCache_(projectId, closingType);
      });
    } catch (eReopen) { /* still throw original */ }
    throw commitErr;
  }

  return executeWithRetry(function () {
    var sheets = verifyDatabaseSchema();
    var row = dalGetProjectIndexRow_(projectId, sheets);
    if (!row) throw new Error('Project not found.');
    dalClearDomainSession_(sheets.index, row.rowNum, row.map, closingType);
    dalFlushDomainCache_(projectId, closingType);
    writeToAuditLog(actor, 'CLOSE', 'DAL_SESSION', projectId, projectId, 'Closed ' + closingType + ' session — committed to Sheets.');
    return { success: true, sessionType: closingType, status: 'closed' };
  });
}
