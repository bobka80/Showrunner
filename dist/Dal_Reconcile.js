/**
 * SM Showrunner — DAL Phase 5A + 5B
 * Dal_Reconcile.js — post-commit reconcile + failed_writes pocket + retry/purge
 *
 * Pocket path (even Firestore segments): failed_writes/{projectId}/items/{itemId}
 * Queue index for sweeps: dal_fw_queue/{itemId}
 * Keys always include projectId + domain + sessionUid. Never touches the other domain.
 */

// @INDEX: DAL -> Reconciliation (Phase 5)

var DAL_FAILED_WRITES_RETENTION_MS_ = 7 * 24 * 60 * 60 * 1000;
/** Backoff after attempt N failed (N = retryCount before this attempt). */
var DAL_FW_RETRY_DELAYS_MS_ = [30 * 1000, 60 * 1000, 5 * 60 * 1000, 30 * 60 * 1000];
var DAL_FW_RETRY_HANDLER_ = 'runDalFailedWritesRetrySweep';
var DAL_FW_MAX_PER_SWEEP_ = 8;

function dalReconcileDomainLabel_(domain) {
  if (domain === 'assets' || domain === DAL_SESSION_TYPE.PREP) return 'assets';
  if (domain === 'timeline' || domain === DAL_SESSION_TYPE.TIMELINE_COLLAB) return 'timeline';
  if (domain === 'ledger' || domain === DAL_DOMAIN.LEDGER) return 'ledger';
  return String(domain || 'unknown');
}

function dalFwSafeIdPart_(s) {
  return String(s || 'x').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
}

function dalFwItemId_(domain, sessionUid, deltaId) {
  return dalFwSafeIdPart_(domain) + '__' + dalFwSafeIdPart_(sessionUid) + '__' + dalFwSafeIdPart_(deltaId);
}

function dalFailedWritesDocPath_(projectId, domain, sessionUid, deltaId) {
  var itemId = dalFwItemId_(domain, sessionUid, deltaId);
  return 'failed_writes/' + String(projectId) + '/items/' + itemId;
}

function dalFwQueueDocPath_(itemId) {
  return 'dal_fw_queue/' + String(itemId);
}

function dalPaRowSignature_(obj) {
  if (!obj) return '';
  return [
    String(obj.uid || ''),
    String(obj.asset_uid || ''),
    String(obj.assigned_quantity != null ? obj.assigned_quantity : ''),
    String(obj.location || ''),
    String(obj.formula || ''),
    String(obj.container_uid || ''),
    String(obj.scan_status || '')
  ].join('|');
}

function dalPaPayloadSignature_(rowObjects) {
  var lines = (rowObjects || []).map(function (o) {
    return dalPaRowSignature_(o);
  });
  lines.sort();
  return lines.join('\n');
}

function dalTimelinePayloadSignature_(shifts, phases, overrides) {
  var s = (shifts || []).map(function (x) {
    return [x.id || '', x.user_uid || x.email || '', x.role || '', x.start, x.duration, x.hasArrow ? 1 : 0, x.note || ''].join(':');
  }).sort().join('|');
  var p = (phases || []).map(function (x) {
    return [x.id || '', x.type || '', x.start, x.duration, x.note || ''].join(':');
  }).sort().join('|');
  var oKeys = Object.keys(overrides || {}).sort();
  var o = oKeys.map(function (k) { return k + '=' + (overrides[k] || ''); }).join('|');
  return s + '##' + p + '##' + o;
}

function dalFwNextRetryAtIso_(retryCount) {
  var idx = Math.min(Math.max(0, retryCount), DAL_FW_RETRY_DELAYS_MS_.length - 1);
  return new Date(Date.now() + DAL_FW_RETRY_DELAYS_MS_[idx]).toISOString();
}

/**
 * Queue a failed commit for retry (7-day retention). Writes pocket + queue index.
 */
function dalPocketFailedWrite_(opts) {
  opts = opts || {};
  var projectId = String(opts.projectId || '');
  var domain = dalReconcileDomainLabel_(opts.domain);
  var sessionUid = String(opts.sessionUid || '');
  var deltaId = String(opts.deltaId || Utilities.getUuid());
  if (!projectId) throw new Error('dalPocketFailedWrite_: missing projectId');

  var itemId = dalFwItemId_(domain, sessionUid, deltaId);
  var path = dalFailedWritesDocPath_(projectId, domain, sessionUid, deltaId);
  var payloadJson = '';
  try {
    payloadJson = JSON.stringify(opts.payload || {});
  } catch (e1) {
    payloadJson = '{"error":"payload_stringify_failed"}';
  }
  if (payloadJson.length > 900000) {
    payloadJson = JSON.stringify({
      truncated: true,
      originalLength: payloadJson.length,
      expectedSig: opts.expectedSig || '',
      note: 'Payload too large for single pocket doc — inspect audit log + Sheets manually.'
    });
  }

  var nowIso = new Date().toISOString();
  var expireAt = new Date(Date.now() + DAL_FAILED_WRITES_RETENTION_MS_).toISOString();
  var nextRetryAt = dalFwNextRetryAtIso_(0);

  var doc = {
    projectId: projectId,
    domain: domain,
    sessionUid: sessionUid,
    deltaId: deltaId,
    itemId: itemId,
    status: 'pending',
    createdAt: nowIso,
    expireAt: expireAt,
    nextRetryAt: nextRetryAt,
    expectedSig: String(opts.expectedSig || ''),
    actualSig: String(opts.actualSig || ''),
    mismatchNote: String(opts.mismatchNote || ''),
    retryCount: 0,
    actor: String(opts.actor || 'System'),
    payloadJson: payloadJson
  };

  firestoreWriteDocument_(path, doc);
  firestoreWriteDocument_(dalFwQueueDocPath_(itemId), {
    projectId: projectId,
    domain: domain,
    sessionUid: sessionUid,
    deltaId: deltaId,
    itemId: itemId,
    path: path,
    status: 'pending',
    createdAt: nowIso,
    expireAt: expireAt,
    nextRetryAt: nextRetryAt,
    retryCount: 0
  });

  try {
    ensureDalFailedWritesRetryTrigger_();
  } catch (eTrig) { /* pocket still saved */ }

  return { path: path, deltaId: deltaId, domain: domain, itemId: itemId };
}

function dalCollectLogisticsManagerNames_() {
  var names = [];
  var seen = {};
  try {
    var sheets = verifyVaultSchema(true);
    var crewData = getSheetData(sheets.crew);
    var cMap = getHeaderMap(crewData);
    for (var i = 1; i < crewData.length; i++) {
      var name = cMap['Name'] !== undefined ? String(crewData[i][cMap['Name']] || '').trim() : '';
      if (!name || seen[name]) continue;
      try {
        if (effectiveBackendPermission(name, 'view_logistics') ||
            effectiveBackendPermission(name, 'event_assets_window')) {
          seen[name] = true;
          names.push(name);
        }
      } catch (ePerm) { /* skip row */ }
    }
  } catch (e) { /* vault unavailable */ }
  return names;
}

/** ROOT crew only — DAL commit push alerts (director lock 2026-07-21). */
function dalCollectRootNames_() {
  var names = [];
  var seen = {};
  try {
    var sheets = verifyVaultSchema(true);
    var crewData = getSheetData(sheets.crew);
    var cMap = getHeaderMap(crewData);
    for (var i = 1; i < crewData.length; i++) {
      var name = cMap['Name'] !== undefined ? String(crewData[i][cMap['Name']] || '').trim() : '';
      if (!name || seen[name]) continue;
      try {
        if (verifyBackendPrivilege(name, 'ROOT')) {
          seen[name] = true;
          names.push(name);
        }
      } catch (ePerm) { /* skip row */ }
    }
  } catch (e) { /* vault unavailable */ }
  return names;
}

/**
 * opts.push === false → audit only (no toast/inbox push).
 * Push recipients = ROOT only.
 * Always writes a durable in-app drawer row (linkType dal_commit_fail) when push is on,
 * so ROOT can copy-paste the full detail after the toast disappears.
 */
function dalAlertFailedWrite_(projectId, domain, actor, detail, opts) {
  opts = opts || {};
  var doPush = opts.push !== false;
  var domainLabel = dalReconcileDomainLabel_(domain);
  var title = opts.title || ('DAL commit failed — ' + domainLabel);
  var detailStr = String(detail || 'Sheets did not match Firebase fork after commit.');
  var body = 'Project ' + projectId + ': ' + detailStr;
  var drawerMsg =
    '[DAL_COMMIT_FAIL]\n' +
    'domain: ' + domainLabel + '\n' +
    'projectId: ' + String(projectId || '') + '\n' +
    'actor: ' + String(actor || 'System') + '\n' +
    'at: ' + new Date().toISOString() + '\n' +
    'detail: ' + detailStr + '\n' +
    '---\n' +
    'Copy this whole card for support / AI handoff.';

  try {
    writeToAuditLog(
      actor || 'System',
      doPush ? 'FAIL' : 'WARN',
      'DAL_RECONCILE',
      projectId,
      domainLabel,
      (doPush ? '' : '[no-push] ') + body
    );
  } catch (eAudit) { /* continue */ }

  if (!doPush) return;

  var recipients = [];
  try {
    recipients = dalCollectRootNames_() || [];
  } catch (eRoot) { recipients = []; }

  if (!recipients.length) {
    try {
      writeToAuditLog(actor || 'System', 'WARN', 'DAL_RECONCILE', projectId, 'PUSH',
        'No ROOT recipients for DAL alert — push/drawer skipped.');
    } catch (eNo) { /* ignore */ }
    return;
  }

  // Durable drawer row (Sheets Notifications) — toast alone vanishes.
  try {
    var sheets = verifyDatabaseSchema(true);
    if (sheets && sheets.notifs) {
      recipients.forEach(function (rootName) {
        try {
          appendInAppNotification_(sheets.notifs, rootName, drawerMsg, 'dal_commit_fail', String(projectId || ''));
        } catch (eRow) { /* next root */ }
      });
      try { flushCache(); } catch (eFlush) { /* ignore */ }
    }
  } catch (eDrawer) {
    try {
      writeToAuditLog(actor || 'System', 'WARN', 'DAL_RECONCILE', projectId, 'NOTIF',
        'Drawer append failed: ' + (eDrawer.message || eDrawer));
    } catch (e2) { /* ignore */ }
  }

  try {
    if (typeof dispatchPushToCrewNames === 'function') {
      dispatchPushToCrewNames(recipients, title, body, '', actor || 'System');
    }
  } catch (ePush) {
    try {
      writeToAuditLog(actor || 'System', 'FAIL', 'DAL_RECONCILE', projectId, 'PUSH',
        'Root push failed: ' + (ePush.message || ePush));
    } catch (e3) { /* ignore */ }
  }
}

function dalReconcilePaCommit_(projectId, sessionUid, intendedRowObjects, actor) {
  var expectedSig = dalPaPayloadSignature_(intendedRowObjects);
  var hdr = dalGetProjectAssetsHeaderAndMap_();
  var sheetRows = dalLoadPaProjectRowsFromSheet_(hdr.sheet, hdr.map, projectId);
  var actualObjects = (sheetRows || []).map(function (r) {
    return dalPaSheetRowToObject_(r.data, hdr.map);
  });
  var actualSig = dalPaPayloadSignature_(actualObjects);

  if (expectedSig === actualSig) {
    writeToAuditLog(actor || 'System', 'CLOSE', 'DAL_RECONCILE', projectId, sessionUid || projectId,
      'Prep commit reconciled OK (' + actualObjects.length + ' rows).');
    return { ok: true };
  }

  var note = 'PA signature mismatch — expected ' + (intendedRowObjects || []).length +
    ' rows, Sheets has ' + actualObjects.length + ' rows.';
  var pocket = dalPocketFailedWrite_({
    projectId: projectId,
    domain: 'assets',
    sessionUid: sessionUid,
    actor: actor,
    expectedSig: expectedSig,
    actualSig: actualSig,
    mismatchNote: note,
    payload: { rows: intendedRowObjects || [] }
  });
  dalAlertFailedWrite_(projectId, 'assets', actor, note + ' Pocket: ' + pocket.path);
  return { ok: false, pocket: pocket };
}

function dalReconcileTimelineCommit_(projectId, sessionUid, intendedSnap, actor) {
  intendedSnap = intendedSnap || {};
  var mode = intendedSnap.mode || 'main';
  var expectedSig = dalTimelinePayloadSignature_(
    intendedSnap.shifts, intendedSnap.phases, intendedSnap.overrides
  );
  var sheetState = getTimelineDataSheets_(projectId, mode);
  var actualSig = dalTimelinePayloadSignature_(
    sheetState.shifts, sheetState.phases, sheetState.overrides
  );

  if (expectedSig === actualSig) {
    writeToAuditLog(actor || 'System', 'CLOSE', 'DAL_RECONCILE', projectId, sessionUid || projectId,
      'Timeline commit reconciled OK (mode=' + mode + ').');
    return { ok: true };
  }

  var note = 'Timeline signature mismatch after commit (mode=' + mode + ').';
  var pocket = dalPocketFailedWrite_({
    projectId: projectId,
    domain: 'timeline',
    sessionUid: sessionUid,
    actor: actor,
    expectedSig: expectedSig,
    actualSig: actualSig,
    mismatchNote: note,
    payload: {
      mode: mode,
      shifts: intendedSnap.shifts || [],
      phases: intendedSnap.phases || [],
      overrides: intendedSnap.overrides || {}
    }
  });
  dalAlertFailedWrite_(projectId, 'timeline', actor, note + ' Pocket: ' + pocket.path);
  return { ok: false, pocket: pocket };
}

// ——— Phase 5B: retry / purge ———

function ensureDalFailedWritesRetryTrigger_() {
  var triggers = ScriptApp.getProjectTriggers();
  var i;
  for (i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === DAL_FW_RETRY_HANDLER_) return { ok: true, existed: true };
  }
  ScriptApp.newTrigger(DAL_FW_RETRY_HANDLER_)
    .timeBased()
    .everyMinutes(5)
    .create();
  return { ok: true, existed: false };
}

/** One-shot installer for directors / post-deploy (idempotent). */
function setupDalFailedWritesRetryTrigger() {
  return ensureDalFailedWritesRetryTrigger_();
}

function dalFwDeletePocketAndQueue_(projectId, domain, sessionUid, deltaId, itemId) {
  var path = dalFailedWritesDocPath_(projectId, domain, sessionUid, deltaId);
  try { firestoreDeleteDocument_(path); } catch (e1) { /* ignore */ }
  try { firestoreDeleteDocument_(dalFwQueueDocPath_(itemId || dalFwItemId_(domain, sessionUid, deltaId))); } catch (e2) { /* ignore */ }
}

function dalFwDomainSessionIsOpen_(domain, projectId) {
  try {
    if (domain === 'assets') {
      return resolveDalSessionStatus_(projectId, DAL_DOMAIN.PROJECT_ASSETS) === DAL_SESSION.SESSION_OPEN;
    }
    if (domain === 'timeline') {
      return resolveDalSessionStatus_(projectId, DAL_DOMAIN.TIMELINE) === DAL_SESSION.SESSION_OPEN;
    }
  } catch (e) { /* treat as closed */ }
  return false;
}

/**
 * Process one queue item. Returns { action: 'ok'|'deferred'|'purged'|'failed'|'skipped' }.
 */
function dalFwProcessQueueItem_(queueDoc) {
  if (!queueDoc) return { action: 'skipped' };
  var projectId = String(queueDoc.projectId || '');
  var domain = dalReconcileDomainLabel_(queueDoc.domain);
  var sessionUid = String(queueDoc.sessionUid || '');
  var deltaId = String(queueDoc.deltaId || '');
  var itemId = String(queueDoc.itemId || dalFwItemId_(domain, sessionUid, deltaId));
  var path = String(queueDoc.path || dalFailedWritesDocPath_(projectId, domain, sessionUid, deltaId));
  var actor = 'System';

  if (!projectId || !deltaId) {
    try { firestoreDeleteDocument_(dalFwQueueDocPath_(itemId)); } catch (eBad) { /* ignore */ }
    return { action: 'skipped' };
  }

  var expireMs = queueDoc.expireAt ? new Date(queueDoc.expireAt).getTime() : 0;
  if (expireMs && !isNaN(expireMs) && Date.now() > expireMs) {
    dalFwDeletePocketAndQueue_(projectId, domain, sessionUid, deltaId, itemId);
    try {
      writeToAuditLog('System', 'DELETE', 'DAL_RECONCILE', projectId, domain,
        'Purged failed_write after 7 days: ' + itemId);
    } catch (ePurge) { /* ignore */ }
    return { action: 'purged' };
  }

  var nextMs = queueDoc.nextRetryAt ? new Date(queueDoc.nextRetryAt).getTime() : 0;
  if (nextMs && !isNaN(nextMs) && Date.now() < nextMs) {
    return { action: 'deferred' };
  }

  if (dalFwDomainSessionIsOpen_(domain, projectId)) {
    var deferIso = dalFwNextRetryAtIso_(0);
    firestoreWriteDocument_(dalFwQueueDocPath_(itemId), Object.assign({}, queueDoc, {
      nextRetryAt: deferIso,
      lastError: 'Domain session open — deferred'
    }));
    return { action: 'deferred' };
  }

  var pocketResp = firestoreFetch_('get', path);
  if (!pocketResp || !pocketResp.fields) {
    try { firestoreDeleteDocument_(dalFwQueueDocPath_(itemId)); } catch (eMiss) { /* ignore */ }
    return { action: 'skipped' };
  }
  var pocket = firestoreDecodeFields_(pocketResp.fields);
  actor = pocket.actor || 'System';
  var retryCount = parseInt(pocket.retryCount, 10) || 0;
  var payload = {};
  try {
    payload = JSON.parse(pocket.payloadJson || '{}');
  } catch (eParse) {
    payload = {};
  }
  if (payload.truncated) {
    dalAlertFailedWrite_(projectId, domain, actor,
      'Retry skipped — pocket payload truncated. Manual repair required. ' + itemId,
      { push: false });
    firestoreWriteDocument_(path, Object.assign({}, pocket, {
      status: 'truncated',
      retryCount: retryCount + 1,
      nextRetryAt: dalFwNextRetryAtIso_(retryCount + 1),
      lastError: 'truncated_payload'
    }));
    firestoreWriteDocument_(dalFwQueueDocPath_(itemId), Object.assign({}, queueDoc, {
      status: 'truncated',
      retryCount: retryCount + 1,
      nextRetryAt: dalFwNextRetryAtIso_(retryCount + 1)
    }));
    return { action: 'failed' };
  }

  var result;
  try {
    if (domain === 'assets') {
      // Re-apply without re-pocketing on success path: apply then signature-check only.
      result = dalFwRetryPaOnly_(projectId, payload, actor);
    } else if (domain === 'timeline') {
      result = dalFwRetryTimelineOnly_(projectId, payload, actor);
    } else if (domain === 'ledger') {
      result = dalFwRetryLedgerOnly_(projectId, payload, actor);
    } else {
      throw new Error('Unknown domain: ' + domain);
    }
  } catch (eApply) {
    result = { ok: false, error: eApply.message || String(eApply) };
  }

  if (result && result.ok) {
    dalFwDeletePocketAndQueue_(projectId, domain, sessionUid, deltaId, itemId);
    try {
      writeToAuditLog(actor, 'UPDATE', 'DAL_RECONCILE', projectId, domain,
        'Failed-write retry succeeded: ' + itemId);
    } catch (eOk) { /* ignore */ }
    return { action: 'ok' };
  }

  var newCount = retryCount + 1;
  var nextRetry = dalFwNextRetryAtIso_(newCount);
  var errNote = (result && result.error) ? result.error : 'signature still mismatched after retry';
  firestoreWriteDocument_(path, Object.assign({}, pocket, {
    status: 'pending',
    retryCount: newCount,
    nextRetryAt: nextRetry,
    lastError: errNote,
    lastRetryAt: new Date().toISOString()
  }));
  firestoreWriteDocument_(dalFwQueueDocPath_(itemId), Object.assign({}, queueDoc, {
    status: 'pending',
    retryCount: newCount,
    nextRetryAt: nextRetry,
    lastError: errNote
  }));

  if (newCount >= 3) {
    // Do not re-toast — first failure already notified ROOT once. Audit only.
    try {
      writeToAuditLog(actor, 'WARN', 'DAL_RECONCILE', projectId, domain,
        'Retry #' + newCount + ' still failing for ' + itemId + ' (no repeat push): ' + errNote);
    } catch (eAud) { /* ignore */ }
  } else {
    try {
      writeToAuditLog(actor, 'WARN', 'DAL_RECONCILE', projectId, domain,
        'Retry #' + newCount + ' failed: ' + errNote);
    } catch (eLog) { /* ignore */ }
  }
  return { action: 'failed' };
}

/** Apply PA rows + verify signature WITHOUT creating a new pocket on mismatch. */
function dalFwRetryPaOnly_(projectId, payload, actor) {
  var rows = (payload && payload.rows) || [];
  if (!rows.length) return { ok: false, error: 'empty_pa_payload' };
  var hdr = dalGetProjectAssetsHeaderAndMap_();
  var sheetRows = rows.map(function (obj) {
    return dalPaRowObjectToSheetArray_(obj, hdr.header, hdr.map);
  });
  executeWithRetry(function () {
    dalDeleteRowsByColumn_(hdr.sheet, 'project_uid', projectId);
    dalAppendRows_(hdr.sheet, sheetRows);
    flushCache();
  });
  var expectedSig = dalPaPayloadSignature_(rows);
  var after = dalLoadPaProjectRowsFromSheet_(hdr.sheet, hdr.map, projectId).map(function (r) {
    return dalPaSheetRowToObject_(r.data, hdr.map);
  });
  var actualSig = dalPaPayloadSignature_(after);
  if (expectedSig === actualSig) {
    writeToAuditLog(actor || 'System', 'UPDATE', 'DAL_RECONCILE', projectId, projectId,
      'PA retry reconciled OK (' + after.length + ' rows).');
    return { ok: true };
  }
  return { ok: false, error: 'pa_signature_mismatch' };
}

function dalFwRetryTimelineOnly_(projectId, payload, actor) {
  payload = payload || {};
  var mode = payload.mode || 'main';
  saveTimelineDataSheets_(
    projectId,
    mode,
    payload.shifts || [],
    null,
    payload.phases || [],
    payload.overrides || {},
    null,
    actor || 'System UI',
    null
  );
  try { flushCache(); } catch (eFlush) { /* continue */ }
  var expectedSig = dalTimelinePayloadSignature_(payload.shifts, payload.phases, payload.overrides);
  var sheetState = getTimelineDataSheets_(projectId, mode);
  var actualSig = dalTimelinePayloadSignature_(sheetState.shifts, sheetState.phases, sheetState.overrides);
  if (expectedSig === actualSig) {
    writeToAuditLog(actor || 'System', 'UPDATE', 'DAL_RECONCILE', projectId, projectId,
      'Timeline retry reconciled OK.');
    return { ok: true };
  }
  return { ok: false, error: 'timeline_signature_mismatch' };
}

/**
 * Time-driven sweep — process due failed_writes (backoff + 7-day purge).
 * google.script.run safe for manual kick.
 */
function runDalFailedWritesRetrySweep() {
  if (!dalFirestoreIsConfigured_()) {
    return { ok: false, reason: 'firestore_not_configured' };
  }
  ensureDalFailedWritesRetryTrigger_();

  var queueDocs = [];
  try {
    queueDocs = firestoreListCollection_('dal_fw_queue') || [];
  } catch (eList) {
    return { ok: false, reason: eList.message || String(eList) };
  }

  var summary = { ok: true, scanned: queueDocs.length, okCount: 0, failed: 0, purged: 0, deferred: 0, skipped: 0 };
  var processed = 0;
  var i;
  for (i = 0; i < queueDocs.length; i++) {
    if (processed >= DAL_FW_MAX_PER_SWEEP_) break;
    var q = queueDocs[i];
    // Skip docs that are not due yet without counting against max (cheap).
    var nextMs = q.nextRetryAt ? new Date(q.nextRetryAt).getTime() : 0;
    var expireMs = q.expireAt ? new Date(q.expireAt).getTime() : 0;
    var due = !nextMs || isNaN(nextMs) || Date.now() >= nextMs;
    var expired = expireMs && !isNaN(expireMs) && Date.now() > expireMs;
    if (!due && !expired) {
      summary.deferred++;
      continue;
    }
    var r = dalFwProcessQueueItem_(q);
    processed++;
    if (r.action === 'ok') summary.okCount++;
    else if (r.action === 'failed') summary.failed++;
    else if (r.action === 'purged') summary.purged++;
    else if (r.action === 'deferred') summary.deferred++;
    else summary.skipped++;
  }
  return summary;
}
