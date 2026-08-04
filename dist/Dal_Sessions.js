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

/**
 * Live forks switch — false = START PREP / START COLLAB + auto-start restored.
 * Was paused for Logistics Ledger campaign (2026-07-21 → 2026-07-24).
 */
var DAL_LIVE_FORKS_PAUSED = false;

function dalLiveForksPaused_() {
  return DAL_LIVE_FORKS_PAUSED === true;
}

/**
 * While paused: one-shot clear leftover Index fork flags (Sheets stay SoT).
 * While live: clear abandon latch so a future pause can abandon again.
 */
function dalEnsurePausedForksAbandoned_() {
  var props = PropertiesService.getScriptProperties();
  if (!dalLiveForksPaused_()) {
    try { props.deleteProperty('DAL_LIVE_FORKS_ABANDONED_V1'); } catch (eClr) { /* ignore */ }
    return;
  }
  if (props.getProperty('DAL_LIVE_FORKS_ABANDONED_V1') === '1') return;
  try {
    abandonAllOpenDalLiveForksAPI('System Pause');
    props.setProperty('DAL_LIVE_FORKS_ABANDONED_V1', '1');
  } catch (eAbandon) {
    // Retry on a later request — do not block reads.
  }
}

/** Client / ops probe. */
function isDalLiveForksPausedAPI() {
  try { dalEnsurePausedForksAbandoned_(); } catch (e0) { /* ignore */ }
  return { paused: dalLiveForksPaused_() };
}

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
  'Dal_Timeline_Session_Opened_By',
  // Campaign Room R1 — warm room registry (coexists with dual prep/timeline cols)
  'Dal_Campaign_Room_UID',
  'Dal_Campaign_Room_Status',
  'Dal_Campaign_Opened_At',
  'Dal_Campaign_Opened_By',
  'Dal_Campaign_Last_Activity_At',
  'Dal_Campaign_Last_Published_At'
];

/** Campaign room Index column names (status vocab mirrors domain forks: opening|open|committing). */
var DAL_CAMPAIGN_COLS_ = {
  uid: 'Dal_Campaign_Room_UID',
  status: 'Dal_Campaign_Room_Status',
  openedAt: 'Dal_Campaign_Opened_At',
  openedBy: 'Dal_Campaign_Opened_By',
  lastActivityAt: 'Dal_Campaign_Last_Activity_At',
  lastPublishedAt: 'Dal_Campaign_Last_Published_At'
};

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
function dalEmptyCampaignInfoFields_() {
  return {
    campaignRoomUid: '',
    campaignStatus: '',
    campaignOpenedAt: '',
    campaignOpenedBy: '',
    campaignLastActivityAt: '',
    campaignLastPublishedAt: '',
    campaignRoomWarm: false
  };
}

function dalReadCampaignRoom_(row) {
  var m = row.map;
  var c = DAL_CAMPAIGN_COLS_;
  var status = m[c.status] !== undefined ? String(row.data[m[c.status]] || '') : '';
  return {
    campaignRoomUid: m[c.uid] !== undefined ? String(row.data[m[c.uid]] || '') : '',
    campaignStatus: status,
    campaignOpenedAt: m[c.openedAt] !== undefined ? (row.data[m[c.openedAt]] || '') : '',
    campaignOpenedBy: m[c.openedBy] !== undefined ? String(row.data[m[c.openedBy]] || '') : '',
    campaignLastActivityAt: m[c.lastActivityAt] !== undefined ? (row.data[m[c.lastActivityAt]] || '') : '',
    campaignLastPublishedAt: m[c.lastPublishedAt] !== undefined ? (row.data[m[c.lastPublishedAt]] || '') : '',
    campaignRoomWarm: dalStatusIsForkLive_(status)
  };
}

function dalWriteCampaignRoom_(indexSheet, rowNum, map, fields) {
  var c = DAL_CAMPAIGN_COLS_;
  var write = {};
  if (fields.campaignRoomUid !== undefined) write[c.uid] = fields.campaignRoomUid;
  if (fields.campaignStatus !== undefined) write[c.status] = fields.campaignStatus;
  if (fields.campaignOpenedAt !== undefined) write[c.openedAt] = fields.campaignOpenedAt;
  if (fields.campaignOpenedBy !== undefined) write[c.openedBy] = fields.campaignOpenedBy;
  if (fields.campaignLastActivityAt !== undefined) write[c.lastActivityAt] = fields.campaignLastActivityAt;
  if (fields.campaignLastPublishedAt !== undefined) write[c.lastPublishedAt] = fields.campaignLastPublishedAt;
  dalWriteSessionIndexFields_(indexSheet, rowNum, map, write);
}

function dalClearCampaignRoom_(indexSheet, rowNum, map) {
  dalWriteCampaignRoom_(indexSheet, rowNum, map, {
    campaignRoomUid: '',
    campaignStatus: '',
    campaignOpenedAt: '',
    campaignOpenedBy: '',
    campaignLastActivityAt: '',
    campaignLastPublishedAt: ''
  });
}

function getDalSessionInfo(projectId) {
  return executeWithRetry(function () {
    // While forks paused, always report closed so clients do not soft-join Firebase.
    if (dalLiveForksPaused_()) {
      var pausedOut = {
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
        openedBy: '',
        liveForksPaused: true
      };
      var emptyCamp = dalEmptyCampaignInfoFields_();
      Object.keys(emptyCamp).forEach(function (k) { pausedOut[k] = emptyCamp[k]; });
      return pausedOut;
    }
    var sheets = verifyDatabaseSchema(true);
    var row = dalGetProjectIndexRow_(projectId, sheets);
    if (!row) {
      var missing = {
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
      var emptyCamp2 = dalEmptyCampaignInfoFields_();
      Object.keys(emptyCamp2).forEach(function (k) { missing[k] = emptyCamp2[k]; });
      return missing;
    }

    dalMigrateLegacySessionToDomain_(sheets.index, row);

    var prep = dalDomainInfoPayload_(dalReadDomainSession_(row, DAL_SESSION_TYPE.PREP));
    var timeline = dalDomainInfoPayload_(dalReadDomainSession_(row, DAL_SESSION_TYPE.TIMELINE_COLLAB));
    var legacy = dalLegacyFlatFromDomains_(prep, timeline);
    var campaign = dalReadCampaignRoom_(row);
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
      openedBy: legacy.openedBy,
      campaignRoomUid: campaign.campaignRoomUid,
      campaignStatus: campaign.campaignStatus,
      campaignOpenedAt: campaign.campaignOpenedAt,
      campaignOpenedBy: campaign.campaignOpenedBy,
      campaignLastActivityAt: campaign.campaignLastActivityAt,
      campaignLastPublishedAt: campaign.campaignLastPublishedAt,
      campaignRoomWarm: campaign.campaignRoomWarm
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
 * Returns { [projectId]: { prep, timeline, prepCommitting, timelineCommitting, room, roomCommitting } }
 * — only entries with at least one live domain or warm campaign room.
 */
function getOpenDalForkMap() {
  return executeWithRetry(function () {
    if (dalLiveForksPaused_()) return {};
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
    var roomCol = iMap[DAL_CAMPAIGN_COLS_.status];
    var uidCol = iMap['uid'];
    for (var i = 1; i < indexData.length; i++) {
      var pid = uidCol !== undefined ? String(indexData[i][uidCol] || '') : '';
      if (!pid || pid === 'uid') continue;
      var prepSt = prepCol !== undefined ? String(indexData[i][prepCol] || '').toLowerCase() : '';
      var tlSt = tlCol !== undefined ? String(indexData[i][tlCol] || '').toLowerCase() : '';
      var roomSt = roomCol !== undefined ? String(indexData[i][roomCol] || '').toLowerCase() : '';
      var prep = dalStatusIsForkLive_(prepSt);
      var timeline = dalStatusIsForkLive_(tlSt);
      var room = dalStatusIsForkLive_(roomSt);
      if (prep || timeline || room) {
        out[pid] = {
          prep: !!prep,
          timeline: !!timeline,
          prepCommitting: prepSt === 'committing',
          timelineCommitting: tlSt === 'committing',
          room: !!room,
          roomCommitting: roomSt === 'committing'
        };
      }
    }
    return out;
  }, 3, true);
}

function resolveDalSessionStatus_(projectId, domain) {
  try {
    // Pause = Sheets-only for PA + timeline even if Index still shows an old open flag.
    if (dalLiveForksPaused_()) {
      try { dalEnsurePausedForksAbandoned_(); } catch (e0) { /* ignore */ }
      return DAL_SESSION.NORMAL;
    }
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
  if (dalLiveForksPaused_()) {
    throw new Error(
      'DAL_LIVE_FORKS_PAUSED: Live prep and timeline collab are paused (Sheets-only). ' +
      'Set DAL_LIVE_FORKS_PAUSED=false and ship to restore.'
    );
  }
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
  // R2: stamp shared campaignRoomUid onto slice _meta (keep per-domain sessionUid).
  var roomUid = '';
  try {
    var roomEnsure = openOrJoinDalCampaignRoom(projectId, actor);
    if (roomEnsure && roomEnsure.campaignRoomUid) roomUid = String(roomEnsure.campaignRoomUid);
  } catch (eRoom) { /* domain open still proceeds */ }

  try {
    if (sessionType === DAL_SESSION_TYPE.PREP) {
      dalSnapshotPaToFirestore_(projectId, sessionUid, actor, roomUid);
      try { dalSnapshotLogisticsToFirestore_(projectId, roomUid, actor); } catch (eLlSnap) {
        // Soft: PA can open even if logistics snapshot fails; arrange will seed on first save.
        try {
          writeToAuditLog(actor, 'WARN', 'LOGISTICS_LEDGER', projectId, sessionUid,
            'Logistics snapshot skipped: ' + (eLlSnap && eLlSnap.message ? eLlSnap.message : eLlSnap));
        } catch (eAud) { /* ignore */ }
      }
      try {
        if (typeof dalEnsureOpsElevated_ === 'function') dalEnsureOpsElevated_(projectId, roomUid, actor);
      } catch (eOpsSnap) {
        try {
          writeToAuditLog(actor, 'WARN', 'OPERATIONS_LEDGER', projectId, sessionUid,
            'Ops snapshot skipped: ' + (eOpsSnap && eOpsSnap.message ? eOpsSnap.message : eOpsSnap));
        } catch (eAud2) { /* ignore */ }
      }
    } else if (sessionType === DAL_SESSION_TYPE.TIMELINE_COLLAB) {
      dalSnapshotTimelineToFirestore_(projectId, sessionUid, actor, 'main', roomUid);
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
    if (roomUid) {
      try {
        dalWriteCampaignRoom_(sheets.index, row.rowNum, row.map, {
          campaignLastActivityAt: new Date().toISOString()
        });
      } catch (eAct) { /* ignore */ }
    }
    dalFlushDomainCache_(projectId, resolvedType);
    writeToAuditLog(actor, 'OPEN', 'DAL_SESSION', projectId, sessionUid, 'Opened ' + resolvedType + ' session.');
    return {
      success: true,
      joined: false,
      sessionUid: sessionUid,
      sessionType: resolvedType,
      status: 'open',
      campaignRoomUid: roomUid || ''
    };
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

    if (curStatus !== 'open') {
      throw new Error(
        curStatus === 'committing'
          ? ('Commit already in progress for this ' + sessionType +
            ' session — wait for it to finish. If stuck, wait ~5 minutes for reclaim or contact support.')
          : ('No open ' + sessionType + ' session on this project.')
      );
    }

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
    var reopened = false;
    var attempt;
    for (attempt = 0; attempt < 3 && !reopened; attempt++) {
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
        reopened = true;
      } catch (eReopen) { /* retry */ }
    }
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

/**
 * Campaign Room R2 — explicit End: final-publish open prep + timeline slices, then clear room.
 * Soft leave / short idle must NOT call this while room is warm.
 */
function closeDalCampaignRoom(projectId, actor) {
  actor = actor || 'System';
  if (!projectId) throw new Error('Missing projectId.');

  var plan = executeWithRetry(function () {
    var sheets = verifyDatabaseSchema();
    var row = dalGetProjectIndexRow_(projectId, sheets);
    if (!row) throw new Error('Project not found.');
    var camp = dalReadCampaignRoom_(row);
    var prep = dalReadDomainSession_(row, DAL_SESSION_TYPE.PREP);
    var timeline = dalReadDomainSession_(row, DAL_SESSION_TYPE.TIMELINE_COLLAB);
    var roomWarm = dalStatusIsForkLive_(camp.campaignStatus) || !!camp.campaignRoomUid;
    var prepOpen = dalStatusIsForkLive_(prep.status);
    var tlOpen = dalStatusIsForkLive_(timeline.status);
    if (!roomWarm && !prepOpen && !tlOpen) {
      return { alreadyClosed: true, roomUid: '', prepOpen: false, tlOpen: false };
    }
    if (roomWarm || camp.campaignRoomUid) {
      dalWriteCampaignRoom_(sheets.index, row.rowNum, row.map, {
        campaignStatus: 'committing',
        campaignLastActivityAt: new Date().toISOString()
      });
      try { flushCache(); } catch (eFlush) { /* ignore */ }
    }
    return {
      alreadyClosed: false,
      roomUid: camp.campaignRoomUid || '',
      prepOpen: prepOpen,
      tlOpen: tlOpen
    };
  });

  if (plan.alreadyClosed) {
    return { success: true, alreadyClosed: true, closed: [], campaignRoomUid: '' };
  }

  var closed = [];

  // R3c: publish warm identity BEFORE meta status rewrite (PATCH replaces fields).
  try {
    if (typeof dalCommitCampaignIdentityFromFirestore_ === 'function') {
      var idRes = dalCommitCampaignIdentityFromFirestore_(projectId, actor);
      if (idRes && idRes.committed) closed.push('meta-identity');
      else if (idRes && idRes.empty) closed.push('meta-identity:empty');
    }
  } catch (eIdCommit) {
    try {
      writeToAuditLog(actor, 'ERROR', 'DAL_CAMPAIGN_ROOM', projectId, plan.roomUid || '',
        'Meta identity commit failed: ' + (eIdCommit && eIdCommit.message ? eIdCommit.message : eIdCommit));
    } catch (eAudId) { /* ignore */ }
    throw eIdCommit;
  }

  try {
    if (typeof firestoreSetCampaignMeta_ === 'function' && plan.roomUid) {
      // Merge lifecycle stamp onto existing identity fields (do not drop identity mid-End).
      var metaNow = {};
      try { metaNow = firestoreGetCampaignMeta_(projectId) || {}; } catch (eGet) { metaNow = {}; }
      metaNow.roomUid = plan.roomUid;
      metaNow.status = 'committing';
      metaNow.lastActivityAt = new Date().toISOString();
      metaNow.domain = 'meta';
      firestoreSetCampaignMeta_(projectId, metaNow);
    }
  } catch (eMetaC) { /* Index already committing */ }

  var closeDomainSafe_ = function (sessionType) {
    try {
      closeDalSession(projectId, actor, sessionType);
      closed.push(sessionType);
    } catch (err) {
      var msg = String((err && err.message) || err || '');
      if (/No open |already closed|not open|Missing session/i.test(msg)) {
        closed.push(sessionType + ':already-clear');
        return;
      }
      throw err;
    }
  };

  if (plan.prepOpen) closeDomainSafe_(DAL_SESSION_TYPE.PREP);
  if (plan.tlOpen) closeDomainSafe_(DAL_SESSION_TYPE.TIMELINE_COLLAB);

  // R3: publish warm logistics slice (Sheets lag until End / checkpoint).
  try {
    if (typeof dalCommitLogisticsFromFirestore_ === 'function') {
      var llRes = dalCommitLogisticsFromFirestore_(projectId, actor);
      if (llRes && llRes.committed) closed.push('logistics');
      else if (llRes && llRes.empty) closed.push('logistics:empty');
    }
  } catch (eLlCommit) {
    // Leave room committing so floor can retry End; do not clear Index yet.
    try {
      writeToAuditLog(actor, 'ERROR', 'DAL_CAMPAIGN_ROOM', projectId, plan.roomUid || '',
        'Logistics commit failed: ' + (eLlCommit && eLlCommit.message ? eLlCommit.message : eLlCommit));
    } catch (eAudLl) { /* ignore */ }
    throw eLlCommit;
  }

  // R3d: publish warm RFID ops slice.
  try {
    if (typeof dalCommitOpsFromFirestore_ === 'function') {
      var opsRes = dalCommitOpsFromFirestore_(projectId, actor);
      if (opsRes && opsRes.committed) closed.push('ops');
      else if (opsRes && opsRes.empty) closed.push('ops:empty');
    }
  } catch (eOpsCommit) {
    try {
      writeToAuditLog(actor, 'ERROR', 'DAL_CAMPAIGN_ROOM', projectId, plan.roomUid || '',
        'Ops commit failed: ' + (eOpsCommit && eOpsCommit.message ? eOpsCommit.message : eOpsCommit));
    } catch (eAudOps) { /* ignore */ }
    throw eOpsCommit;
  }

  executeWithRetry(function () {
    var sheets = verifyDatabaseSchema();
    var row = dalGetProjectIndexRow_(projectId, sheets);
    if (!row) return;
    dalClearCampaignRoom_(sheets.index, row.rowNum, row.map);
    try { flushCache(); } catch (eFlush2) { /* ignore */ }
  });

  try {
    firestoreDeleteDocument_('projects/' + projectId + '/meta/state');
  } catch (eDel) { /* ignore */ }

  try {
    writeToAuditLog(actor, 'CLOSE', 'DAL_CAMPAIGN_ROOM', projectId, plan.roomUid || '',
      'Closed Campaign Room — published: ' + (closed.join(', ') || 'none'));
  } catch (eAud) { /* ignore */ }

  return {
    success: true,
    alreadyClosed: false,
    closed: closed,
    campaignRoomUid: plan.roomUid || '',
    campaignRoomWarm: false
  };
}

/**
 * Campaign Room — open or join warm room from project editor entry.
 * Does not open prep/timeline forks. Soft-skips when paused / freelancer / no Firebase.
 * Status vocab: opening → open (warm). R2 End uses closeDalCampaignRoom.
 */
function openOrJoinDalCampaignRoom(projectId, actor) {
  actor = actor || 'System';
  if (!projectId) throw new Error('Missing projectId.');

  if (dalLiveForksPaused_()) {
    return { success: true, skipped: true, reason: 'paused', campaignRoomWarm: false };
  }
  try {
    dalAssertNotLiveForkExcluded_(actor);
  } catch (eEx) {
    return { success: true, skipped: true, reason: 'excluded', campaignRoomWarm: false };
  }
  if (typeof dalFirestoreIsConfigured_ === 'function' && !dalFirestoreIsConfigured_()) {
    return { success: true, skipped: true, reason: 'no_firebase', campaignRoomWarm: false };
  }

  var roomUid = Utilities.getUuid();
  var now = new Date().toISOString();
  var phase = executeWithRetry(function () {
    var sheets = verifyDatabaseSchema();
    var row = dalGetProjectIndexRow_(projectId, sheets);
    if (!row) throw new Error('Project not found.');

    var cur = dalReadCampaignRoom_(row);
    var st = String(cur.campaignStatus || '').toLowerCase();
    if (dalStatusIsForkLive_(st) && cur.campaignRoomUid) {
      return {
        joined: true,
        roomUid: cur.campaignRoomUid,
        status: st === 'committing' ? 'committing' : 'open',
        openedAt: cur.campaignOpenedAt,
        openedBy: cur.campaignOpenedBy,
        lastActivityAt: cur.campaignLastActivityAt,
        lastPublishedAt: cur.campaignLastPublishedAt
      };
    }

    dalWriteCampaignRoom_(sheets.index, row.rowNum, row.map, {
      campaignRoomUid: roomUid,
      campaignStatus: 'opening',
      campaignOpenedAt: now,
      campaignOpenedBy: actor,
      campaignLastActivityAt: now
    });
    try { flushCache(); } catch (eFlush) { /* ignore */ }
    return {
      joined: false,
      roomUid: roomUid,
      status: 'opening',
      openedAt: now,
      openedBy: actor,
      lastActivityAt: now,
      lastPublishedAt: ''
    };
  });

  if (phase.joined) {
    try {
      if (typeof dalEnsureCampaignIdentityElevated_ === 'function') {
        dalEnsureCampaignIdentityElevated_(projectId, phase.roomUid, actor);
      }
    } catch (eJoinId) { /* non-fatal — Sheets still SoT until elevated */ }
    return {
      success: true,
      joined: true,
      campaignRoomUid: phase.roomUid,
      campaignStatus: phase.status,
      campaignOpenedAt: phase.openedAt,
      campaignOpenedBy: phase.openedBy,
      campaignLastActivityAt: phase.lastActivityAt,
      campaignLastPublishedAt: phase.lastPublishedAt || '',
      campaignRoomWarm: true
    };
  }

  // Firestore meta outside Index lock / ScriptLock (same pattern as finishDalSession).
  try {
    if (typeof firestoreSetCampaignMeta_ === 'function') {
      firestoreSetCampaignMeta_(projectId, {
        roomUid: phase.roomUid,
        status: 'open',
        openedAt: phase.openedAt,
        openedBy: phase.openedBy,
        lastActivityAt: phase.lastActivityAt,
        lastPublishedAt: '',
        domain: 'meta'
      });
    }
    if (typeof dalEnsureCampaignIdentityElevated_ === 'function') {
      dalEnsureCampaignIdentityElevated_(projectId, phase.roomUid, actor);
    }
  } catch (eMeta) {
    try {
      executeWithRetry(function () {
        var sheets = verifyDatabaseSchema();
        var row = dalGetProjectIndexRow_(projectId, sheets);
        if (!row) return;
        var cur = dalReadCampaignRoom_(row);
        if (String(cur.campaignRoomUid || '') === String(phase.roomUid)) {
          dalClearCampaignRoom_(sheets.index, row.rowNum, row.map);
          try { flushCache(); } catch (e2) { /* ignore */ }
        }
      });
    } catch (eClr) { /* ignore */ }
    throw eMeta;
  }

  executeWithRetry(function () {
    var sheets = verifyDatabaseSchema();
    var row = dalGetProjectIndexRow_(projectId, sheets);
    if (!row) throw new Error('Project not found.');
    var cur = dalReadCampaignRoom_(row);
    if (String(cur.campaignRoomUid || '') !== String(phase.roomUid)) {
      throw new Error('Campaign room open raced — retry.');
    }
    dalWriteCampaignRoom_(sheets.index, row.rowNum, row.map, {
      campaignStatus: 'open',
      campaignLastActivityAt: phase.lastActivityAt
    });
    try { flushCache(); } catch (eFlush2) { /* ignore */ }
  });

  try {
    writeToAuditLog(actor, 'OPEN', 'DAL_CAMPAIGN_ROOM', projectId, phase.roomUid,
      'Opened Project Campaign Room (R1 registry + meta).');
  } catch (eAud) { /* ignore */ }

  return {
    success: true,
    joined: false,
    campaignRoomUid: phase.roomUid,
    campaignStatus: 'open',
    campaignOpenedAt: phase.openedAt,
    campaignOpenedBy: phase.openedBy,
    campaignLastActivityAt: phase.lastActivityAt,
    campaignLastPublishedAt: '',
    campaignRoomWarm: true
  };
}

/** True when Projects_Index shows a live Campaign Room for this project. */
function dalCampaignRoomIsWarmForProject_(projectId) {
  if (!projectId || projectId === 'NEW') return false;
  if (dalLiveForksPaused_()) return false;
  try {
    var sheets = verifyDatabaseSchema(true);
    var row = dalGetProjectIndexRow_(projectId, sheets);
    if (!row) return false;
    var camp = dalReadCampaignRoom_(row);
    return !!(camp.campaignRoomWarm || (camp.campaignRoomUid && dalStatusIsForkLive_(camp.campaignStatus)));
  } catch (e) {
    return false;
  }
}

/**
 * Campaign Room R3b — open/join prep for Hub under a warm room.
 * Completes an in-flight "opening" (finish) or takeOver if finish fails / stuck.
 * Avoids "already opening" when Hub modal seed races arrange save.
 */
function dalOpenPrepForWarmHub_(projectId, actor) {
  if (resolveDalSessionStatus_(projectId, DAL_DOMAIN.PROJECT_ASSETS) === DAL_SESSION.SESSION_OPEN) {
    return { success: true, joined: true, status: 'open' };
  }
  var sheets = verifyDatabaseSchema(true);
  var row = dalGetProjectIndexRow_(projectId, sheets);
  if (!row) throw new Error('Project not found.');
  dalMigrateLegacySessionToDomain_(sheets.index, row);
  var cur = dalReadDomainSession_(row, DAL_SESSION_TYPE.PREP);
  var st = String(cur.status || '').toLowerCase();
  if (st === 'opening' && cur.sessionUid) {
    try {
      return finishDalSession(projectId, cur.sessionUid, actor);
    } catch (eFin) {
      try {
        writeToAuditLog(actor, 'WARN', 'DAL_SESSION', projectId, cur.sessionUid,
          'Hub prep finish of in-flight opening failed — takeOver: ' + (eFin && eFin.message ? eFin.message : eFin));
      } catch (eAud) { /* ignore */ }
    }
  }
  var begin = beginDalSession(projectId, DAL_SESSION_TYPE.PREP, actor, { takeOver: true });
  if (begin && begin.joined) return begin;
  return finishDalSession(projectId, begin.sessionUid, actor);
}

/**
 * Same pattern for timeline when Hub GENERATE needs AUTO truck shifts.
 */
function dalOpenTimelineForWarmHub_(projectId, actor) {
  if (resolveDalSessionStatus_(projectId, DAL_DOMAIN.TIMELINE) === DAL_SESSION.SESSION_OPEN) {
    return { success: true, joined: true, status: 'open' };
  }
  var sheets = verifyDatabaseSchema(true);
  var row = dalGetProjectIndexRow_(projectId, sheets);
  if (!row) throw new Error('Project not found.');
  dalMigrateLegacySessionToDomain_(sheets.index, row);
  var cur = dalReadDomainSession_(row, DAL_SESSION_TYPE.TIMELINE_COLLAB);
  var st = String(cur.status || '').toLowerCase();
  if (st === 'opening' && cur.sessionUid) {
    try {
      return finishDalSession(projectId, cur.sessionUid, actor);
    } catch (eFin) {
      try {
        writeToAuditLog(actor, 'WARN', 'DAL_SESSION', projectId, cur.sessionUid,
          'Hub timeline finish of in-flight opening failed — takeOver: ' + (eFin && eFin.message ? eFin.message : eFin));
      } catch (eAud) { /* ignore */ }
    }
  }
  var begin = beginDalSession(projectId, DAL_SESSION_TYPE.TIMELINE_COLLAB, actor, { takeOver: true });
  if (begin && begin.joined) return begin;
  return finishDalSession(projectId, begin.sessionUid, actor);
}

/**
 * Campaign Room R3b — seed warm Hub workspace under the open room.
 * Opens prep (PA + logistics snapshot) when room is warm but prep closed.
 * Optionally opens timeline collab when Hub needs AUTO truck shifts.
 * Soft-returns { warm:false } when room cannot open (pause / excluded / no Firebase).
 */
function dalEnsureWarmHubWorkspace_(projectId, actor, opts) {
  actor = actor || 'System';
  opts = opts || {};
  if (!projectId || projectId === 'NEW') throw new Error('Missing projectId.');

  var room = openOrJoinDalCampaignRoom(projectId, actor);
  if (!room || !room.campaignRoomWarm) {
    return {
      warm: false,
      reason: (room && room.reason) || 'room_not_warm',
      campaignRoomUid: (room && room.campaignRoomUid) || '',
      prepOpen: false,
      timelineOpen: false
    };
  }

  var roomUid = String(room.campaignRoomUid || '');
  var prepOpen = resolveDalSessionStatus_(projectId, DAL_DOMAIN.PROJECT_ASSETS) === DAL_SESSION.SESSION_OPEN;
  var timelineOpen = resolveDalSessionStatus_(projectId, DAL_DOMAIN.TIMELINE) === DAL_SESSION.SESSION_OPEN;

  if (!prepOpen) {
    dalOpenPrepForWarmHub_(projectId, actor);
    prepOpen = resolveDalSessionStatus_(projectId, DAL_DOMAIN.PROJECT_ASSETS) === DAL_SESSION.SESSION_OPEN;
    if (!prepOpen) {
      throw new Error('WARM_HUB_SEED_FAILED: prep did not reach open after Hub seed.');
    }
  } else {
    // Prep already open — ensure logistics state exists for Hub arrange/clocks.
    try {
      var ll = dalReadLogisticsStateFromFirestore_(projectId);
      if (!ll || !ll.present) {
        dalSnapshotLogisticsToFirestore_(projectId, roomUid, actor);
      }
    } catch (eLl) {
      try { dalSnapshotLogisticsToFirestore_(projectId, roomUid, actor); } catch (eLl2) { /* arrange seeds */ }
    }
  }

  try {
    if (typeof dalEnsureOpsElevated_ === 'function') {
      dalEnsureOpsElevated_(projectId, roomUid, actor);
    }
  } catch (eOps) { /* ops seed non-fatal until first scan */ }

  if (opts.needTimeline && !timelineOpen) {
    dalOpenTimelineForWarmHub_(projectId, actor);
    timelineOpen = resolveDalSessionStatus_(projectId, DAL_DOMAIN.TIMELINE) === DAL_SESSION.SESSION_OPEN;
    if (!timelineOpen) {
      throw new Error('WARM_HUB_SEED_FAILED: timeline did not reach open after Hub seed.');
    }
  }

  try {
    var sheetsAct = verifyDatabaseSchema();
    var rowAct = dalGetProjectIndexRow_(projectId, sheetsAct);
    if (rowAct) {
      dalWriteCampaignRoom_(sheetsAct.index, rowAct.rowNum, rowAct.map, {
        campaignLastActivityAt: new Date().toISOString()
      });
    }
  } catch (eAct) { /* ignore */ }

  return {
    warm: true,
    campaignRoomUid: roomUid,
    prepOpen: prepOpen,
    timelineOpen: timelineOpen || !!opts.needTimeline,
    seeded: true
  };
}

/** google.script.run — Hub open / pack / arrange / generate warm gate. */
function ensureDalWarmHubWorkspace(projectId, actor, opts) {
  return dalEnsureWarmHubWorkspace_(projectId, actor, opts || {});
}

/**
 * Mass-abandon open/opening/committing prep + timeline flags on Projects_Index.
 * Does NOT commit Firebase → Sheets (Sheets stay SoT while forks are paused/broken).
 * Best-effort deletes Firestore _meta after Index clear (outside ScriptLock).
 * Only runs when DAL_LIVE_FORKS_PAUSED is true.
 */
function abandonAllOpenDalLiveForksAPI(actor) {
  actor = actor || 'System UI';
  if (!dalLiveForksPaused_()) {
    throw new Error('Refuse mass abandon while DAL_LIVE_FORKS_PAUSED is false.');
  }

  var cleared = executeWithRetry(function () {
    var sheets = verifyDatabaseSchema();
    var indexData = sheets.index.getDataRange().getValues();
    if (!indexData.length) return [];
    var iMap = dalEnsureSessionIndexColumns_(sheets.index, indexData);
    var out = [];
    var types = [DAL_SESSION_TYPE.PREP, DAL_SESSION_TYPE.TIMELINE_COLLAB];
    for (var i = 1; i < indexData.length; i++) {
      var pid = iMap['uid'] !== undefined ? String(indexData[i][iMap['uid']] || '') : '';
      if (!pid) continue;
      var row = { rowNum: i + 1, map: iMap, data: indexData[i] };
      types.forEach(function (sessionType) {
        var cur = dalReadDomainSession_(row, sessionType);
        var st = String(cur.status || '').toLowerCase();
        if (!dalStatusIsForkLive_(st)) return;
        dalClearDomainSession_(sheets.index, row.rowNum, row.map, sessionType);
        out.push({
          projectId: pid,
          sessionType: sessionType,
          wasStatus: st,
          sessionUid: cur.sessionUid || ''
        });
      });
      var camp = dalReadCampaignRoom_(row);
      if (dalStatusIsForkLive_(camp.campaignStatus)) {
        dalClearCampaignRoom_(sheets.index, row.rowNum, row.map);
        out.push({
          projectId: pid,
          sessionType: 'campaignRoom',
          wasStatus: String(camp.campaignStatus || '').toLowerCase(),
          sessionUid: camp.campaignRoomUid || ''
        });
      }
    }
    if (out.length) flushCache();
    writeToAuditLog(actor, 'PAUSE', 'DAL_SESSION', '', '',
      'Abandoned ' + out.length + ' live fork flag(s) — Sheets-only pause (no Firebase commit).');
    return out;
  });

  // Best-effort meta cleanup — no ScriptLock across UrlFetch
  (cleared || []).forEach(function (entry) {
    try {
      if (entry.sessionType === DAL_SESSION_TYPE.PREP) {
        firestoreDeleteDocument_('projects/' + entry.projectId + '/assets/_meta');
      } else if (entry.sessionType === DAL_SESSION_TYPE.TIMELINE_COLLAB) {
        firestoreDeleteDocument_('projects/' + entry.projectId + '/timeline/_meta');
      } else if (entry.sessionType === 'campaignRoom') {
        firestoreDeleteDocument_('projects/' + entry.projectId + '/meta/state');
      }
    } catch (eMeta) { /* Index already cleared */ }
  });

  return {
    success: true,
    paused: true,
    abandoned: cleared || [],
    count: (cleared || []).length
  };
}
