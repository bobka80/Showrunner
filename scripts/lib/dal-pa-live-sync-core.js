/**
 * Pure PA live-sync core — timeline-parity discipline.
 *
 * Gold standard (what timeline actually does):
 *   - ONE state doc
 *   - transactional read → patch-merge touched only → writeSeq++
 *   - apply ignores stale doc writeSeq / own clientId echo
 *
 * Old PA bug: per-doc blind set (non-transactional) → concurrent equal-seq LWW war.
 */
'use strict';

function isAutoRow(pa) {
  if (!pa) return false;
  if (pa.isAuto || pa.isGenericAuto) return true;
  var f = String(pa.formula || '');
  return f === 'Auto-Container' || f === 'Gen-Auto-Container' ||
    f.indexOf('[AUTO] ') === 0 || f.indexOf('[GEN_AUTO] ') === 0;
}

function fixturesOnly(list) {
  return (list || []).filter(function (pa) { return !isAutoRow(pa); });
}

function mapByUid(list) {
  var map = {};
  (list || []).forEach(function (pa) {
    if (pa && pa.uid) map[String(pa.uid)] = pa;
  });
  return map;
}

function fixtureSig(list) {
  return fixturesOnly(list).map(function (a) {
    return [a.uid || '', a.qty || 0, a.location || '', a.formula || '', a.assetId || ''].join(':');
  }).sort().join('|');
}

/** Timeline-style patch merge onto remote fixture list (touched/deleted only). */
function patchMergeFixtures(remoteFixtures, localFixtures, touched, deleted) {
  var remoteMap = mapByUid(remoteFixtures);
  var localMap = mapByUid(localFixtures);
  var out = {};
  Object.keys(remoteMap).forEach(function (uid) { out[uid] = remoteMap[uid]; });
  Object.keys(deleted || {}).forEach(function (uid) { delete out[uid]; });
  Object.keys(touched || {}).forEach(function (uid) {
    if (localMap[uid]) out[uid] = Object.assign({}, localMap[uid]);
    else delete out[uid];
  });
  return Object.keys(out).map(function (k) { return out[k]; });
}

function applyRemoteFixtures(remoteFixtures, localFixtures, opts) {
  opts = opts || {};
  var now = opts.now != null ? opts.now : Date.now();
  var holdUntil = opts.holdUntil || {};
  var lastAppliedSeq = opts.lastAppliedSeq || {};
  var touched = opts.touched || {};
  var deleted = opts.deleted || {};
  var clientId = opts.clientId || '';

  var localBy = mapByUid(localFixtures);
  var out = [];
  var used = {};
  var appliedMeta = {};

  (remoteFixtures || []).forEach(function (remotePa) {
    if (!remotePa || !remotePa.uid) return;
    var uid = String(remotePa.uid);
    var seq = Number(remotePa.writeSeq || 0) || 0;
    var remoteClient = String(remotePa.clientId || '');

    if (clientId && remoteClient === clientId) {
      if (seq > (lastAppliedSeq[uid] || 0)) appliedMeta[uid] = seq;
      if (localBy[uid]) {
        out.push(localBy[uid]);
        used[uid] = true;
      }
      return;
    }

    var lastSeq = Number(lastAppliedSeq[uid] || 0) || 0;
    if (lastSeq > 0 && (!seq || seq < lastSeq)) {
      if (localBy[uid]) {
        out.push(localBy[uid]);
        used[uid] = true;
      }
      return;
    }

    if ((holdUntil[uid] || 0) > now || deleted[uid]) {
      if (localBy[uid]) {
        out.push(localBy[uid]);
        used[uid] = true;
      }
      return;
    }
    if (touched[uid] && localBy[uid]) {
      out.push(localBy[uid]);
      used[uid] = true;
      return;
    }

    out.push(remotePa);
    used[uid] = true;
    if (seq) appliedMeta[uid] = seq;
  });

  Object.keys(localBy).forEach(function (uid) {
    if (used[uid]) return;
    if (touched[uid] || (holdUntil[uid] || 0) > now) {
      out.push(localBy[uid]);
    }
  });

  return { fixtures: out, appliedSeq: appliedMeta };
}

/** Apply from ONE state doc (timeline parity) — doc-level writeSeq. */
function applyRemotePaState(remoteState, localFixtures, opts) {
  opts = opts || {};
  var now = opts.now != null ? opts.now : Date.now();
  var holdUntil = opts.holdUntil || {};
  var touched = opts.touched || {};
  var deleted = opts.deleted || {};
  var clientId = opts.clientId || '';
  var lastDocSeq = Number(opts.lastDocWriteSeq || 0) || 0;

  var writeSeq = Number((remoteState && remoteState.writeSeq) || 0) || 0;
  var remoteClient = String((remoteState && remoteState.clientId) || '');
  var remoteFixtures = fixturesOnly((remoteState && remoteState.fixtures) || []);

  if (writeSeq && lastDocSeq && writeSeq < lastDocSeq) {
    return { fixtures: fixturesOnly(localFixtures), docWriteSeq: lastDocSeq, skipped: 'stale' };
  }
  if (clientId && remoteClient === clientId) {
    return {
      fixtures: fixturesOnly(localFixtures),
      docWriteSeq: Math.max(lastDocSeq, writeSeq),
      skipped: 'echo'
    };
  }

  var localBy = mapByUid(localFixtures);
  var out = [];
  var used = {};
  remoteFixtures.forEach(function (remotePa) {
    if (!remotePa || !remotePa.uid) return;
    var uid = String(remotePa.uid);
    if ((holdUntil[uid] || 0) > now || deleted[uid]) {
      if (localBy[uid]) {
        out.push(localBy[uid]);
        used[uid] = true;
      }
      return;
    }
    if (touched[uid] && localBy[uid]) {
      out.push(localBy[uid]);
      used[uid] = true;
      return;
    }
    out.push(remotePa);
    used[uid] = true;
  });
  Object.keys(localBy).forEach(function (uid) {
    if (used[uid]) return;
    if (touched[uid] || (holdUntil[uid] || 0) > now) out.push(localBy[uid]);
  });
  return { fixtures: out, docWriteSeq: writeSeq || lastDocSeq, skipped: '' };
}

function computeTouchPatch(localFixtures, touched, deleted) {
  var localBy = mapByUid(localFixtures);
  var sets = [];
  var dels = [];
  Object.keys(touched || {}).forEach(function (uid) {
    if (localBy[uid]) sets.push({ uid: uid, doc: localBy[uid] });
  });
  Object.keys(deleted || {}).forEach(function (uid) {
    if (uid && uid !== '_meta' && uid !== 'state') dels.push(uid);
  });
  return { sets: sets, deletes: dels };
}

function buggyNonTxnWrite(storeDocs, uid, qty, clientId) {
  var prev = storeDocs[uid] || { writeSeq: 0 };
  var prevSeq = Number(prev.writeSeq || 0) || 0;
  storeDocs[uid] = {
    uid: uid,
    qty: qty,
    writeSeq: prevSeq + 1,
    clientId: clientId
  };
  return storeDocs[uid];
}

function txnStatePatch(state, localFixtures, touched, deleted, clientId) {
  var remote = (state && state.fixtures) || [];
  var merged = patchMergeFixtures(remote, localFixtures, touched, deleted);
  var prevSeq = Number((state && state.writeSeq) || 0) || 0;
  return {
    fixtures: merged,
    writeSeq: prevSeq + 1,
    clientId: clientId
  };
}

function oscillated(history) {
  var sawUp = false;
  var sawDown = false;
  for (var i = 1; i < history.length; i++) {
    if (history[i] > history[i - 1]) sawUp = true;
    if (history[i] < history[i - 1]) sawDown = true;
  }
  return sawUp && sawDown;
}

/**
 * Concurrent race that matches production after v634:
 * non-txn equal-seq LWW oscillates; txn state patch settles at 4.
 */
function simulateConcurrentWriteRace(opts) {
  opts = opts || {};
  var mode = opts.mode || 'txn';
  var steps = opts.steps || 8;
  var uid = 'fix-1';

  var A = { id: 'clientA', qty: 5, hist: [], lastDocSeq: 0, fixtures: [{ uid: uid, qty: 5 }] };
  var B = { id: 'clientB', qty: 5, hist: [], lastDocSeq: 0, fixtures: [{ uid: uid, qty: 5 }] };

  if (mode === 'nontxn') {
    var docs = {};
    docs[uid] = { uid: uid, qty: 5, writeSeq: 1, clientId: 'seed' };
    A.qty = 4;
    var seqARead = Number(docs[uid].writeSeq);
    var seqBRead = Number(docs[uid].writeSeq);
    docs[uid] = { uid: uid, qty: 4, writeSeq: seqARead + 1, clientId: 'clientA' };
    docs[uid] = { uid: uid, qty: 5, writeSeq: seqBRead + 1, clientId: 'clientB' };

    for (var i = 0; i < steps; i++) {
      if (i % 2 === 0) buggyNonTxnWrite(docs, uid, 4, 'clientA');
      else buggyNonTxnWrite(docs, uid, 5, 'clientB');
      A.qty = Number(docs[uid].qty);
      B.qty = Number(docs[uid].qty);
      A.hist.push(A.qty);
      B.hist.push(B.qty);
    }
    return {
      mode: mode,
      finalA: A.qty,
      finalB: B.qty,
      storeQty: Number(docs[uid].qty),
      historyA: A.hist,
      historyB: B.hist,
      oscillatedA: oscillated(A.hist),
      oscillatedB: oscillated(B.hist),
      ok: false
    };
  }

  var state = {
    fixtures: [{ uid: uid, qty: 5, assetId: 'A1' }],
    writeSeq: 1,
    clientId: 'seed'
  };
  A.fixtures = [{ uid: uid, qty: 4, assetId: 'A1' }];
  var touchedA = {};
  touchedA[uid] = 1;
  state = txnStatePatch(state, A.fixtures, touchedA, {}, 'clientA');

  for (var j = 0; j < steps; j++) {
    if (j === 3) {
      // Idle B "flush" with empty touches — must not change qty
      state = txnStatePatch(state, B.fixtures, {}, {}, 'clientB');
    }
    var pullA = applyRemotePaState(state, A.fixtures, {
      clientId: 'clientA',
      lastDocWriteSeq: A.lastDocSeq,
      holdUntil: {},
      touched: {},
      deleted: {}
    });
    A.fixtures = pullA.fixtures;
    A.lastDocSeq = pullA.docWriteSeq;
    A.qty = Number((mapByUid(A.fixtures)[uid] || {}).qty || 0);
    A.hist.push(A.qty);

    var pullB = applyRemotePaState(state, B.fixtures, {
      clientId: 'clientB',
      lastDocWriteSeq: B.lastDocSeq,
      holdUntil: {},
      touched: {},
      deleted: {}
    });
    B.fixtures = pullB.fixtures;
    B.lastDocSeq = pullB.docWriteSeq;
    B.qty = Number((mapByUid(B.fixtures)[uid] || {}).qty || 0);
    B.hist.push(B.qty);
  }

  var storeQty = Number((mapByUid(state.fixtures)[uid] || {}).qty || 0);
  return {
    mode: mode,
    finalA: A.qty,
    finalB: B.qty,
    storeQty: storeQty,
    historyA: A.hist,
    historyB: B.hist,
    oscillatedA: oscillated(A.hist),
    oscillatedB: oscillated(B.hist),
    ok: storeQty === 4 && A.qty === 4 && B.qty === 4 && !oscillated(A.hist) && !oscillated(B.hist)
  };
}

function simulateTwoClients(opts) {
  opts = opts || {};
  var mode = opts.mode || 'touch';
  var steps = opts.steps || 8;
  var targetUid = opts.targetUid || 'fix-1';
  var store = {};
  store[targetUid] = { uid: targetUid, assetId: 'A1', qty: 5, location: 'General', formula: 'Standalone', writeSeq: 1, clientId: 'seed' };
  store['fix-2'] = { uid: 'fix-2', assetId: 'A2', qty: 1, location: 'General', formula: 'Standalone', writeSeq: 1, clientId: 'seed' };

  function makeClient(id) {
    return {
      id: id,
      fixtures: JSON.parse(JSON.stringify(Object.keys(store).map(function (k) { return store[k]; }))),
      touched: {},
      deleted: {},
      holdUntil: {},
      lastAppliedSeq: {},
      qtyHistory: []
    };
  }
  var A = makeClient('clientA');
  var B = makeClient('clientB');

  function qtyOf(client) {
    var row = mapByUid(client.fixtures)[targetUid];
    return row ? Number(row.qty) || 0 : 0;
  }

  function pull(client) {
    var remote = fixturesOnly(Object.keys(store).map(function (k) { return store[k]; }));
    var result = applyRemoteFixtures(remote, fixturesOnly(client.fixtures), {
      holdUntil: client.holdUntil,
      lastAppliedSeq: client.lastAppliedSeq,
      touched: client.touched,
      deleted: client.deleted,
      clientId: client.id,
      now: Date.now()
    });
    client.fixtures = result.fixtures;
    Object.keys(result.appliedSeq).forEach(function (u) {
      client.lastAppliedSeq[u] = result.appliedSeq[u];
    });
    client.qtyHistory.push(qtyOf(client));
  }

  function flush(client) {
    if (mode === 'buggy') {
      Object.keys(store).forEach(function (u) {
        if (!isAutoRow(store[u])) delete store[u];
      });
      fixturesOnly(client.fixtures).forEach(function (pa) {
        var prev = store[pa.uid];
        var prevSeq = prev ? Number(prev.writeSeq || 0) || 0 : 0;
        store[pa.uid] = Object.assign({}, pa, { writeSeq: prevSeq + 1, clientId: client.id });
      });
    } else {
      Object.keys(client.deleted).forEach(function (u) { delete store[u]; });
      Object.keys(client.touched).forEach(function (u) {
        var pa = mapByUid(client.fixtures)[u];
        if (!pa) return;
        var prev = store[u];
        var prevSeq = prev ? Number(prev.writeSeq || 0) || 0 : 0;
        store[u] = Object.assign({}, pa, { writeSeq: prevSeq + 1, clientId: client.id });
      });
    }
    Object.keys(client.touched).forEach(function (u) {
      client.holdUntil[u] = Date.now() + 2000;
    });
    Object.keys(client.deleted).forEach(function (u) {
      client.holdUntil[u] = Date.now() + 2000;
    });
    client.touched = {};
    client.deleted = {};
    if (store[targetUid]) client.lastAppliedSeq[targetUid] = Number(store[targetUid].writeSeq || 0) || 0;
  }

  var aRow = mapByUid(A.fixtures)[targetUid];
  aRow.qty = 4;
  A.touched[targetUid] = 1;
  A.holdUntil[targetUid] = Date.now() + 2000;
  flush(A);

  for (var i = 0; i < steps; i++) {
    if (mode === 'buggy') {
      A.holdUntil = {};
      B.holdUntil = {};
      if (i % 2 === 0) {
        var bRow = mapByUid(B.fixtures)[targetUid];
        if (bRow) bRow.qty = 5;
        flush(B);
      } else {
        var aRow2 = mapByUid(A.fixtures)[targetUid];
        if (aRow2) aRow2.qty = 4;
        flush(A);
      }
    }
    pull(B);
    pull(A);
  }

  return {
    mode: mode,
    finalA: qtyOf(A),
    finalB: qtyOf(B),
    storeQty: store[targetUid] ? Number(store[targetUid].qty) : 0,
    historyA: A.qtyHistory,
    historyB: B.qtyHistory,
    oscillatedA: oscillated(A.qtyHistory),
    oscillatedB: oscillated(B.qtyHistory),
    ok: qtyOf(A) === 4 && qtyOf(B) === 4 && store[targetUid] && Number(store[targetUid].qty) === 4 &&
      !oscillated(A.qtyHistory) && !oscillated(B.qtyHistory)
  };
}

module.exports = {
  isAutoRow: isAutoRow,
  fixturesOnly: fixturesOnly,
  fixtureSig: fixtureSig,
  patchMergeFixtures: patchMergeFixtures,
  applyRemoteFixtures: applyRemoteFixtures,
  applyRemotePaState: applyRemotePaState,
  computeTouchPatch: computeTouchPatch,
  txnStatePatch: txnStatePatch,
  simulateTwoClients: simulateTwoClients,
  simulateConcurrentWriteRace: simulateConcurrentWriteRace
};
