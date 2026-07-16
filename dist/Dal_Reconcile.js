/**
 * SM Showrunner — DAL Phase 5A
 * Dal_Reconcile.js — post-commit reconcile + failed_writes pocket (per project + domain + sessionUid)
 *
 * After Firebase → Sheets commit, compare intended payload vs Sheets read-back.
 * Mismatch → pocket under failed_writes/{projectId}/{domain}/{sessionUid}/{deltaId} + manager alert.
 * Does not touch the other domain's fork.
 */

// @INDEX: DAL -> Reconciliation (Phase 5)

var DAL_FAILED_WRITES_RETENTION_MS_ = 7 * 24 * 60 * 60 * 1000;

function dalReconcileDomainLabel_(domain) {
  if (domain === 'assets' || domain === DAL_SESSION_TYPE.PREP) return 'assets';
  if (domain === 'timeline' || domain === DAL_SESSION_TYPE.TIMELINE_COLLAB) return 'timeline';
  return String(domain || 'unknown');
}

function dalPaRowSignature_(obj) {
  if (!obj) return '';
  // Keys match Project_Assets sheet headers (via dalPaSheetRowToObject_).
  return [
    String(obj.uid || ''),
    String(obj.asset_uid || ''),
    String(obj.assigned_quantity != null ? obj.assigned_quantity : ''),
    String(obj.location || ''),
    String(obj.formula || ''),
    String(obj.container_uid || ''),
    String(obj.scan_status || ''),
    String(obj.outbound_truck_uid || ''),
    String(obj.inbound_truck_uid || '')
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

function dalFailedWritesDocPath_(projectId, domain, sessionUid, deltaId) {
  return 'failed_writes/' + projectId + '/' + dalReconcileDomainLabel_(domain) + '/' +
    String(sessionUid || 'nosession') + '/' + String(deltaId || Utilities.getUuid());
}

/**
 * Queue a failed commit for retry (7-day retention metadata).
 * Never deletes or writes the other domain.
 */
function dalPocketFailedWrite_(opts) {
  opts = opts || {};
  var projectId = String(opts.projectId || '');
  var domain = dalReconcileDomainLabel_(opts.domain);
  var sessionUid = String(opts.sessionUid || '');
  var deltaId = String(opts.deltaId || Utilities.getUuid());
  if (!projectId) throw new Error('dalPocketFailedWrite_: missing projectId');

  var path = dalFailedWritesDocPath_(projectId, domain, sessionUid, deltaId);
  var payloadJson = '';
  try {
    payloadJson = JSON.stringify(opts.payload || {});
  } catch (e1) {
    payloadJson = '{"error":"payload_stringify_failed"}';
  }
  // Firestore doc soft limit — keep pocket usable; full payload may be truncated.
  if (payloadJson.length > 900000) {
    payloadJson = JSON.stringify({
      truncated: true,
      originalLength: payloadJson.length,
      expectedSig: opts.expectedSig || '',
      note: 'Payload too large for single pocket doc — inspect audit log + Sheets manually.'
    });
  }

  var doc = {
    projectId: projectId,
    domain: domain,
    sessionUid: sessionUid,
    deltaId: deltaId,
    status: 'pending',
    createdAt: new Date().toISOString(),
    expireAt: new Date(Date.now() + DAL_FAILED_WRITES_RETENTION_MS_).toISOString(),
    expectedSig: String(opts.expectedSig || ''),
    actualSig: String(opts.actualSig || ''),
    mismatchNote: String(opts.mismatchNote || ''),
    retryCount: 0,
    actor: String(opts.actor || 'System'),
    payloadJson: payloadJson
  };

  firestoreWriteDocument_(path, doc);
  return { path: path, deltaId: deltaId, domain: domain };
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

/**
 * Loud manager alert — audit always; FCM best-effort to logistics managers.
 */
function dalAlertFailedWrite_(projectId, domain, actor, detail) {
  var title = 'DAL commit failed — ' + dalReconcileDomainLabel_(domain);
  var body = 'Project ' + projectId + ': ' + String(detail || 'Sheets did not match Firebase fork after commit.');
  try {
    writeToAuditLog(
      actor || 'System',
      'FAIL',
      'DAL_RECONCILE',
      projectId,
      dalReconcileDomainLabel_(domain),
      body
    );
  } catch (eAudit) { /* continue */ }

  try {
    var recipients = dalCollectLogisticsManagerNames_();
    if (actor && recipients.indexOf(actor) === -1) recipients.push(actor);
    if (typeof dispatchPushToCrewNames === 'function' && recipients.length) {
      dispatchPushToCrewNames(recipients, title, body, '', actor || 'System');
    }
  } catch (ePush) {
    try {
      writeToAuditLog(actor || 'System', 'FAIL', 'DAL_RECONCILE', projectId, 'PUSH',
        'Manager push failed: ' + (ePush.message || ePush));
    } catch (e2) { /* ignore */ }
  }
}

/**
 * Reconcile Project Assets after Sheets write. Call BEFORE deleting the Firestore fork collection
 * so a mismatch can still pocket the intended rows.
 *
 * @returns {{ ok: boolean, pocket?: object }}
 */
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

/**
 * Reconcile timeline after Sheets write.
 */
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
