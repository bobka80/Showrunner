/**
 * SM Showrunner — DAL Logistics Hub atomic path (design lock §2)
 * Dal_Ledger.js — begin → Sheets apply → verify (no session fork)
 *
 * Durable store remains Sheets. Firebase holds a short-lived op journal for
 * begin/commit audit + Phase 5C reconcile / failed_writes when verify fails.
 */

// @INDEX: DAL -> Ledger atomic ops (Hub)

function dalLedgerOpsCollection_(projectId) {
  return 'projects/' + String(projectId || '') + '/ledgerOps';
}

function dalLedgerOpDocPath_(projectId, opId) {
  return dalLedgerOpsCollection_(projectId) + '/' + String(opId || '');
}

function dalLedgerScannedMapSignature_(scannedMap, scannedCount) {
  var map = scannedMap || {};
  var keys = Object.keys(map).sort();
  var parts = [];
  var i;
  for (i = 0; i < keys.length; i++) {
    parts.push(keys[i] + ':' + map[keys[i]]);
  }
  return String(scannedCount || 0) + '|' + parts.join(',');
}

function dalLedgerPeekActiveSession_(projectId) {
  var out = { operationType: '', sessionUid: '' };
  try {
    var sheets = verifyDatabaseSchema(true);
    // Live read for hub verify — bypass getSheetData cache after writes
    var indexData = sheets.index.getDataRange().getValues();
    var iMap = getHeaderMap(indexData);
    var i;
    for (i = 1; i < indexData.length; i++) {
      if (String(indexData[i][iMap['uid']]) === String(projectId)) {
        out.operationType = iMap['Active_Operation'] !== undefined
          ? String(indexData[i][iMap['Active_Operation']] || '')
          : '';
        out.sessionUid = iMap['Active_Session_UID'] !== undefined
          ? String(indexData[i][iMap['Active_Session_UID']] || '')
          : '';
        break;
      }
    }
  } catch (e) { /* ignore */ }
  return out;
}

function dalReadLedgerSessionScanState_(sessionUid) {
  var scannedMap = {};
  var total = 0;
  if (!sessionUid) {
    return { scannedCount: 0, scannedMap: scannedMap, signature: dalLedgerScannedMapSignature_({}, 0) };
  }
  try {
    var sheets = verifyDatabaseSchema(true);
    // Live read for Phase 5C verify — do not use warm getSheetData
    var ledgerData = sheets.opsLedger.getDataRange().getValues();
    var lMap = getHeaderMap(ledgerData);
    var i;
    for (i = 1; i < ledgerData.length; i++) {
      if (String(ledgerData[i][lMap['session_uid']]) === String(sessionUid)) {
        var aId = String(ledgerData[i][lMap['asset_uid']] || '');
        scannedMap[aId] = (scannedMap[aId] || 0) + 1;
        total++;
      }
    }
  } catch (e2) { /* ignore */ }
  return {
    scannedCount: total,
    scannedMap: scannedMap,
    signature: dalLedgerScannedMapSignature_(scannedMap, total)
  };
}

/** Selective invalidation after hub ops — never a global wipe. */
function dalLedgerInvalidateAfterOp_(projectId) {
  try {
    dalInvalidateCacheTags_([
      dalCacheTagPa_(projectId),
      'tracker',
      'calendar'
    ]);
  } catch (e) {
    try { flushCache(); } catch (e2) { /* ignore */ }
  }
}

function dalLedgerJournalBegin_(projectId, opId, kind, meta) {
  if (!dalFirestoreIsConfigured_()) return false;
  try {
    var doc = {
      opId: String(opId),
      projectId: String(projectId),
      kind: String(kind || 'batch'),
      status: 'begun',
      begunAt: new Date().toISOString(),
      actor: String((meta && meta.actor) || 'System UI'),
      sessionUid: String((meta && meta.sessionUid) || ''),
      operationType: String((meta && meta.operationType) || ''),
      batchJson: String((meta && meta.batchJson) || ''),
      note: String((meta && meta.note) || '')
    };
    firestoreWriteDocument_(dalLedgerOpDocPath_(projectId, opId), doc);
    return true;
  } catch (e) {
    return false;
  }
}

function dalLedgerJournalFinish_(projectId, opId, status, extra) {
  if (!dalFirestoreIsConfigured_() || !opId) return;
  try {
    var patch = Object.assign({
      status: String(status || 'committed'),
      finishedAt: new Date().toISOString()
    }, extra || {});
    // Re-write full doc fields we care about (Firestore REST set merges via write helper)
    var path = dalLedgerOpDocPath_(projectId, opId);
    var existing = {};
    try {
      var resp = firestoreFetch_('get', path);
      if (resp && resp.fields) existing = firestoreDecodeFields_(resp.fields);
    } catch (eGet) { /* new */ }
    firestoreWriteDocument_(path, Object.assign({}, existing, patch));
  } catch (e) { /* ignore */ }
}

/**
 * Phase 5C — compare Sheets read-back to result signature; pocket on mismatch.
 * @returns {{ ok: boolean, expectedSig?: string, actualSig?: string }}
 */
function dalReconcileLedgerBatch_(projectId, sessionUid, result, actor, opId, batch) {
  result = result || {};
  var expectedSig = dalLedgerScannedMapSignature_(result.scannedMap, result.scannedCount);
  var actual = dalReadLedgerSessionScanState_(sessionUid);
  if (expectedSig === actual.signature) {
    try {
      writeToAuditLog(actor || 'System', 'UPDATE', 'DAL_RECONCILE', projectId, 'ledger',
        'Ledger batch reconciled OK (count=' + actual.scannedCount + ').');
    } catch (eOk) { /* ignore */ }
    return { ok: true, expectedSig: expectedSig, actualSig: actual.signature };
  }

  try {
    dalPocketFailedWrite_({
      projectId: projectId,
      domain: 'ledger',
      sessionUid: sessionUid || opId,
      deltaId: opId,
      expectedSig: expectedSig,
      actualSig: actual.signature,
      mismatchNote: 'Ledger batch Sheets read-back mismatch',
      actor: actor || 'System UI',
      payload: {
        kind: 'batch',
        batch: batch || [],
        sessionUid: sessionUid,
        expectedScannedMap: result.scannedMap || {},
        expectedScannedCount: result.scannedCount || 0
      }
    });
    dalAlertFailedWrite_(projectId, 'ledger', actor,
      'Checkout/ledger batch reconcile failed after Sheets write. Op ' + opId);
  } catch (ePocket) {
    try {
      writeToAuditLog(actor || 'System', 'FAIL', 'DAL_RECONCILE', projectId, 'ledger',
        'Pocket failed: ' + (ePocket.message || ePocket));
    } catch (e2) { /* ignore */ }
  }
  return { ok: false, expectedSig: expectedSig, actualSig: actual.signature };
}

/**
 * Atomic hub path for scan/undo batches (design lock §2).
 */
function batchProcessOperationsAtomic_(projectId, batch, actor) {
  actor = actor || 'System UI';
  var opId = Utilities.getUuid();
  var peek = dalLedgerPeekActiveSession_(projectId);
  var journaled = dalLedgerJournalBegin_(projectId, opId, 'batch', {
    actor: actor,
    sessionUid: peek.sessionUid,
    operationType: peek.operationType,
    batchJson: JSON.stringify(batch || []).slice(0, 200000)
  });

  var result;
  try {
    result = batchProcessOperationsSheets_(projectId, batch, actor);
  } catch (eApply) {
    if (journaled) {
      dalLedgerJournalFinish_(projectId, opId, 'failed', {
        error: eApply.message || String(eApply)
      });
    }
    throw eApply;
  }

  var sessionUid = peek.sessionUid || dalLedgerPeekActiveSession_(projectId).sessionUid;
  if (journaled && result && result.success) {
    var rec = dalReconcileLedgerBatch_(projectId, sessionUid, result, actor, opId, batch);
    dalLedgerJournalFinish_(projectId, opId, rec.ok ? 'committed' : 'reconcile_failed', {
      expectedSig: rec.expectedSig || '',
      actualSig: rec.actualSig || '',
      scannedCount: result.scannedCount || 0
    });
  } else if (journaled) {
    dalLedgerJournalFinish_(projectId, opId, 'committed', { note: 'sheets_result_no_success_flag' });
  }

  return result;
}

function startEventOperationAtomic_(projectId, operationType, actor) {
  actor = actor || 'System UI';
  var opId = Utilities.getUuid();
  var journaled = dalLedgerJournalBegin_(projectId, opId, 'start', {
    actor: actor,
    operationType: operationType,
    note: 'startEventOperation'
  });

  var result;
  try {
    result = startEventOperationSheets_(projectId, operationType, actor);
  } catch (eStart) {
    if (journaled) {
      dalLedgerJournalFinish_(projectId, opId, 'failed', { error: eStart.message || String(eStart) });
    }
    throw eStart;
  }

  if (journaled && result && result.success) {
    var peek = dalLedgerPeekActiveSession_(projectId);
    var ok = String(peek.operationType) === String(operationType) && !!peek.sessionUid;
    if (!ok && result.resumed) ok = true;
    if (!ok) {
      try {
        dalPocketFailedWrite_({
          projectId: projectId,
          domain: 'ledger',
          sessionUid: peek.sessionUid || opId,
          deltaId: opId,
          expectedSig: 'op:' + operationType,
          actualSig: 'op:' + peek.operationType + '|uid:' + peek.sessionUid,
          mismatchNote: 'Start operation Sheets verify failed',
          actor: actor,
          payload: { kind: 'start', operationType: operationType }
        });
        dalAlertFailedWrite_(projectId, 'ledger', actor, 'Start ' + operationType + ' verify failed.');
      } catch (eP) { /* ignore */ }
      dalLedgerJournalFinish_(projectId, opId, 'reconcile_failed', {
        sessionUid: peek.sessionUid,
        operationType: peek.operationType
      });
    } else {
      dalLedgerJournalFinish_(projectId, opId, 'committed', {
        sessionUid: peek.sessionUid,
        operationType: peek.operationType
      });
    }
  }
  return result;
}

function finalizeEventOperationAtomic_(projectId, actor) {
  actor = actor || 'System UI';
  var opId = Utilities.getUuid();
  var before = dalLedgerPeekActiveSession_(projectId);
  var journaled = dalLedgerJournalBegin_(projectId, opId, 'finalize', {
    actor: actor,
    sessionUid: before.sessionUid,
    operationType: before.operationType,
    note: 'finalizeEventOperation'
  });

  var result;
  try {
    result = finalizeEventOperationSheets_(projectId, actor);
  } catch (eFin) {
    if (journaled) {
      dalLedgerJournalFinish_(projectId, opId, 'failed', { error: eFin.message || String(eFin) });
    }
    throw eFin;
  }

  if (journaled && result && result.success) {
    var after = dalLedgerPeekActiveSession_(projectId);
    var ok = !after.operationType && !after.sessionUid;
    if (!ok) {
      try {
        dalPocketFailedWrite_({
          projectId: projectId,
          domain: 'ledger',
          sessionUid: before.sessionUid || opId,
          deltaId: opId,
          expectedSig: 'cleared',
          actualSig: 'op:' + after.operationType + '|uid:' + after.sessionUid,
          mismatchNote: 'Finalize left Active_Operation set',
          actor: actor,
          payload: { kind: 'finalize', sessionUid: before.sessionUid, operationType: before.operationType }
        });
        dalAlertFailedWrite_(projectId, 'ledger', actor, 'Finalize operation verify failed.');
      } catch (eP2) { /* ignore */ }
      dalLedgerJournalFinish_(projectId, opId, 'reconcile_failed', {});
    } else {
      dalLedgerJournalFinish_(projectId, opId, 'committed', {
        previousSessionUid: before.sessionUid,
        previousOperationType: before.operationType
      });
    }
  }
  return result;
}

/** Retry pocket for ledger batch (re-apply Sheets batch + signature check). */
function dalFwRetryLedgerOnly_(projectId, payload, actor) {
  payload = payload || {};
  if (payload.kind === 'batch' && payload.batch) {
    var res = batchProcessOperationsSheets_(projectId, payload.batch, actor || 'System UI');
    var sessionUid = payload.sessionUid || dalLedgerPeekActiveSession_(projectId).sessionUid;
    var expectedSig = dalLedgerScannedMapSignature_(
      payload.expectedScannedMap || (res && res.scannedMap) || {},
      payload.expectedScannedCount != null ? payload.expectedScannedCount : (res && res.scannedCount)
    );
    var actual = dalReadLedgerSessionScanState_(sessionUid);
    if (expectedSig === actual.signature) {
      writeToAuditLog(actor || 'System', 'UPDATE', 'DAL_RECONCILE', projectId, 'ledger',
        'Ledger retry reconciled OK.');
      return { ok: true };
    }
    return { ok: false, error: 'ledger_signature_mismatch' };
  }
  if (payload.kind === 'start' && payload.operationType) {
    startEventOperationSheets_(projectId, payload.operationType, actor || 'System UI');
    var peek = dalLedgerPeekActiveSession_(projectId);
    if (String(peek.operationType) === String(payload.operationType) && peek.sessionUid) {
      return { ok: true };
    }
    return { ok: false, error: 'ledger_start_verify_failed' };
  }
  if (payload.kind === 'finalize') {
    finalizeEventOperationSheets_(projectId, actor || 'System UI');
    var after = dalLedgerPeekActiveSession_(projectId);
    if (!after.operationType && !after.sessionUid) return { ok: true };
    return { ok: false, error: 'ledger_finalize_verify_failed' };
  }
  return { ok: false, error: 'ledger_unknown_payload_kind' };
}
