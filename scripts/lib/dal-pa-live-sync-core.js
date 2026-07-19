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
    return [
      a.uid || '',
      a.qty || 0,
      a.location || '',
      a.formula || '',
      a.assetId || '',
      a.isShortage ? '1' : '0',
      a.overrideDept || ''
    ].join(':');
  }).sort().join('|');
}

/** Timeline-style patch merge onto remote fixture list (touched/deleted only). */
function patchMergeFixtures(remoteFixtures, localFixtures, touched, deleted, qtyDeltas) {
  var remoteMap = mapByUid(remoteFixtures);
  var localMap = mapByUid(localFixtures);
  var out = {};
  Object.keys(remoteMap).forEach(function (uid) { out[uid] = remoteMap[uid]; });
  Object.keys(deleted || {}).forEach(function (uid) { delete out[uid]; });
  Object.keys(touched || {}).forEach(function (uid) {
    if (!localMap[uid]) {
      delete out[uid];
      return;
    }
    var row = Object.assign({}, localMap[uid]);
    var dRaw = qtyDeltas && qtyDeltas[uid];
    if (dRaw != null && dRaw !== '' && !isNaN(Number(dRaw))) {
      var base = remoteMap[uid] ? Number(remoteMap[uid].qty != null ? remoteMap[uid].qty : 1) : 0;
      row.qty = base + Number(dRaw);
    }
    out[uid] = row;
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

function txnStatePatch(state, localFixtures, touched, deleted, clientId, qtyDeltas) {
  var remote = (state && state.fixtures) || [];
  var merged = patchMergeFixtures(remote, localFixtures, touched, deleted, qtyDeltas);
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

/** True only before remote writeSeq authority exists (production seed gate). */
function shouldSeedFromLocal(opts) {
  opts = opts || {};
  if (opts.stateSeeded) return false;
  if (Number(opts.lastDocWriteSeq || 0) > 0) return false;
  if (Number(opts.remoteWriteSeq || 0) > 0) return false;
  return !!(opts.localCount > 0);
}

/**
 * Case E/F: delete without note resurrects; delete with note + later peer edit stays gone.
 * mode: 'silent' | 'noted'
 */
function simulateDeleteResurrect(opts) {
  opts = opts || {};
  var mode = opts.mode || 'noted';
  var u1 = 'fix-1';
  var u2 = 'fix-2';
  var state = {
    fixtures: [
      { uid: u1, assetId: 'A1', qty: 1 },
      { uid: u2, assetId: 'A2', qty: 1 }
    ],
    writeSeq: 1,
    clientId: 'seed'
  };
  var A = {
    id: 'clientA',
    fixtures: JSON.parse(JSON.stringify(state.fixtures)),
    lastDocSeq: 1,
    holdUntil: {},
    touched: {},
    deleted: {}
  };
  var B = {
    id: 'clientB',
    fixtures: JSON.parse(JSON.stringify(state.fixtures)),
    lastDocSeq: 1,
    holdUntil: {},
    touched: {},
    deleted: {}
  };

  // A removes u1 locally
  A.fixtures = A.fixtures.filter(function (pa) { return pa.uid !== u1; });
  if (mode === 'noted') {
    A.deleted[u1] = 1;
    A.holdUntil[u1] = Date.now() + 3000;
    state = txnStatePatch(state, A.fixtures, A.touched, A.deleted, 'clientA');
    A.deleted = {};
    A.lastDocSeq = state.writeSeq;
  } else {
    // Silent splice — flush with empty maps (production removePa bug)
    state = txnStatePatch(state, A.fixtures, {}, {}, 'clientA');
    A.lastDocSeq = state.writeSeq;
  }

  // B pulls — should lose u1 only if noted
  var pullB = applyRemotePaState(state, B.fixtures, {
    clientId: 'clientB',
    lastDocWriteSeq: B.lastDocSeq,
    holdUntil: B.holdUntil,
    touched: B.touched,
    deleted: B.deleted
  });
  B.fixtures = pullB.fixtures;
  B.lastDocSeq = pullB.docWriteSeq;

  // B edits u2 (unrelated) — must not resurrect u1 when noted
  var bRow = mapByUid(B.fixtures)[u2];
  if (bRow) bRow.qty = 2;
  B.touched[u2] = 1;
  state = txnStatePatch(state, B.fixtures, B.touched, {}, 'clientB');
  B.touched = {};
  B.lastDocSeq = state.writeSeq;

  // A pulls after B's edit (hold expired for silent path)
  A.holdUntil = {};
  var pullA = applyRemotePaState(state, A.fixtures, {
    clientId: 'clientA',
    lastDocWriteSeq: A.lastDocSeq,
    holdUntil: A.holdUntil,
    touched: {},
    deleted: {}
  });
  A.fixtures = pullA.fixtures;
  A.lastDocSeq = pullA.docWriteSeq;

  var storeHasU1 = !!mapByUid(state.fixtures)[u1];
  var aHasU1 = !!mapByUid(A.fixtures)[u1];
  var bHasU1 = !!mapByUid(B.fixtures)[u1];

  if (mode === 'silent') {
    return {
      mode: mode,
      storeHasU1: storeHasU1,
      aHasU1: aHasU1,
      bHasU1: bHasU1,
      // Bug: store still has u1 → A resurrects after B's unrelated edit
      ok: storeHasU1 && aHasU1
    };
  }
  return {
    mode: mode,
    storeHasU1: storeHasU1,
    aHasU1: aHasU1,
    bHasU1: bHasU1,
    ok: !storeHasU1 && !aHasU1 && !bHasU1
  };
}

/**
 * Case G: full-local seed after remote writeSeq must not resurrect deleted UID.
 */
function simulateSeedStomp(opts) {
  opts = opts || {};
  var allowSeed = opts.allowSeed !== false;
  var u1 = 'fix-1';
  var u2 = 'fix-2';
  var state = {
    fixtures: [{ uid: u2, assetId: 'A2', qty: 1 }],
    writeSeq: 3,
    clientId: 'clientA'
  };
  // Stale browser still has deleted u1 locally
  var local = [
    { uid: u1, assetId: 'A1', qty: 1 },
    { uid: u2, assetId: 'A2', qty: 1 }
  ];
  var lastDoc = 3;
  var canSeed = shouldSeedFromLocal({
    stateSeeded: false,
    lastDocWriteSeq: lastDoc,
    remoteWriteSeq: 0,
    localCount: local.length
  });
  if (allowSeed && canSeed) {
    var touched = {};
    local.forEach(function (pa) { touched[pa.uid] = 1; });
    state = txnStatePatch(state, local, touched, {}, 'clientB');
  } else if (allowSeed && !canSeed) {
    // gated — no op
  } else if (!allowSeed) {
    // buggy path: ignore gate and seed anyway
    var touchedBad = {};
    local.forEach(function (pa) { touchedBad[pa.uid] = 1; });
    state = txnStatePatch(state, local, touchedBad, {}, 'clientB');
  }
  var storeHasU1 = !!mapByUid(state.fixtures)[u1];
  return {
    canSeed: canSeed,
    storeHasU1: storeHasU1,
    writeSeq: state.writeSeq,
    ok: !canSeed && !storeHasU1
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
  simulateConcurrentWriteRace: simulateConcurrentWriteRace,
  shouldSeedFromLocal: shouldSeedFromLocal,
  simulateDeleteResurrect: simulateDeleteResurrect,
  simulateSeedStomp: simulateSeedStomp,
  /** Reject GAS getProjectAssets apply while live mode is firestore (unstamped lists). */
  shouldApplyGasPaList: function(opts) {
    opts = opts || {};
    if (String(opts.liveSyncMode || '') === 'firestore') return false;
    return true;
  },
  /**
   * H1: live PA writes only in healthy firestore patch mode.
   * connecting / blocked / gas / empty-during-prep → no writes.
   */
  shouldAllowLivePaWrite: function(opts) {
    opts = opts || {};
    if (!opts.prepUiOpen) return true;
    return String(opts.liveSyncMode || '') === 'firestore';
  },
  /**
   * Case K: Auth/listen fails mid-edit — post-fail flush must not land in store via GAS LWW.
   * Simulates: A edits in firestore, then mode→blocked; further local qty must not txn-patch store.
   */
  simulateAuthFailMidEdit: function() {
    var u1 = 'fix-1';
    var state = {
      fixtures: [{ uid: u1, assetId: 'A1', qty: 2 }],
      writeSeq: 1,
      clientId: 'seed'
    };
    var mode = 'firestore';
    var A = {
      fixtures: JSON.parse(JSON.stringify(state.fixtures)),
      touched: {},
      lastDocSeq: 1
    };
    // Mid-edit local change while healthy
    var row = mapByUid(A.fixtures)[u1];
    row.qty = 5;
    A.touched[u1] = 1;
    state = txnStatePatch(state, A.fixtures, A.touched, {}, 'clientA');
    A.touched = {};
    A.lastDocSeq = state.writeSeq;

    // Auth fails mid-session
    mode = 'blocked';
    var allowAfter = module.exports.shouldAllowLivePaWrite({ prepUiOpen: true, liveSyncMode: mode });
    // User keeps clicking + — local only, flush refused
    row = mapByUid(A.fixtures)[u1];
    row.qty = 9;
    var storeBefore = Number(mapByUid(state.fixtures)[u1].qty);
    if (allowAfter) {
      var touchBad = {};
      touchBad[u1] = 1;
      state = txnStatePatch(state, A.fixtures, touchBad, {}, 'clientA');
    }
    var storeAfter = Number(mapByUid(state.fixtures)[u1].qty);
    return {
      mode: mode,
      allowAfter: allowAfter,
      storeBefore: storeBefore,
      storeAfter: storeAfter,
      localQty: Number(row.qty),
      ok: !allowAfter && storeBefore === 5 && storeAfter === 5 && Number(row.qty) === 9
    };
  },
  /**
   * Case L: after local flush, FlushGuard must not drop a peer's newer/equal-seq state
   * that differs from expected local sig (production miss).
   * mode 'buggy' = old sig-mismatch drop; 'fixed' = only drop remoteSeq < lastSeq.
   */
  shouldApplyDuringFlushGuard: function(opts) {
    opts = opts || {};
    var mode = opts.mode || 'fixed';
    var guardActive = !!opts.guardActive;
    var fixtureSig = String(opts.fixtureSig || '');
    var expectedSig = String(opts.expectedSig || '');
    var remoteSeq = Number(opts.remoteSeq || 0) || 0;
    var lastSeq = Number(opts.lastSeq || 0) || 0;
    if (!guardActive) return true;
    if (mode === 'buggy') {
      if (expectedSig && fixtureSig !== expectedSig) return false;
      return true;
    }
    // fixed: only strictly older docs
    if (remoteSeq && lastSeq && remoteSeq < lastSeq) return false;
    return true;
  },
  /**
   * Case M: peer snap while local hold keeps row — must NOT ack lastRemoteSig
   * (that permanently forgets the peer edit until refresh).
   */
  shouldAckRemoteSigAfterMerge: function(opts) {
    opts = opts || {};
    var remoteSig = String(opts.remoteSig || '');
    var localSig = String(opts.localSig || '');
    var mergedSig = String(opts.mergedSig || '');
    // merged equals local but remote differs → held peer edit; do not ack
    if (mergedSig === localSig && remoteSig !== localSig) return false;
    return true;
  },
  /**
   * Case N: concurrent flush race — B writes after A; B's txn merges A's qty into
   * result.merged; B must apply merged locally (own echo alone left UI stale).
   */
  simulateConcurrentFlushAbsorb: function() {
    var u1 = 'fix-1';
    var u2 = 'fix-2';
    var state = {
      fixtures: [
        { uid: u1, assetId: 'A1', qty: 1 },
        { uid: u2, assetId: 'A2', qty: 1 }
      ],
      writeSeq: 1,
      clientId: 'seed'
    };
    // A patches u1 → seq 2
    state = txnStatePatch(state, [
      { uid: u1, assetId: 'A1', qty: 5 },
      { uid: u2, assetId: 'A2', qty: 1 }
    ], { 'fix-1': 1 }, {}, 'clientA');

    // B still has stale u1=1 locally; flushes u2=9 — txn reads A's state and merges
    var bLocal = [
      { uid: u1, assetId: 'A1', qty: 1 },
      { uid: u2, assetId: 'A2', qty: 9 }
    ];
    state = txnStatePatch(state, bLocal, { 'fix-2': 1 }, {}, 'clientB');

    var store = mapByUid(state.fixtures);
    // buggy: B keeps local UI without applying merged → u1 stays 1
    var buggyUi = { u1: 1, u2: 9 };
    // fixed: apply result.merged (store) onto B for non-touched rows
    var fixedUi = {
      u1: Number(store[u1].qty),
      u2: Number(store[u2].qty)
    };
    return {
      storeU1: Number(store[u1].qty),
      storeU2: Number(store[u2].qty),
      buggyU1: buggyUi.u1,
      fixedU1: fixedUi.u1,
      ok: Number(store[u1].qty) === 5 && Number(store[u2].qty) === 9 &&
        buggyUi.u1 === 1 && fixedUi.u1 === 5
    };
  },
  /**
   * Case O: three clients each +1 on same uid — additive deltas → store qty = start+3.
   * Absolute LWW would end at start+1.
   */
  simulateThreeClientQtyCombine: function() {
    var u1 = 'fix-1';
    var state = {
      fixtures: [{ uid: u1, assetId: 'A1', qty: 5 }],
      writeSeq: 1,
      clientId: 'seed'
    };
    // Each client saw 5, clicked + once → local 6, delta +1
    state = txnStatePatch(state, [{ uid: u1, assetId: 'A1', qty: 6 }], { 'fix-1': 1 }, {}, 'A', { 'fix-1': 1 });
    state = txnStatePatch(state, [{ uid: u1, assetId: 'A1', qty: 6 }], { 'fix-1': 1 }, {}, 'B', { 'fix-1': 1 });
    state = txnStatePatch(state, [{ uid: u1, assetId: 'A1', qty: 6 }], { 'fix-1': 1 }, {}, 'C', { 'fix-1': 1 });
    var storeQty = Number(mapByUid(state.fixtures)[u1].qty);
    var lwwWouldBe = 6;
    return {
      storeQty: storeQty,
      lwwWouldBe: lwwWouldBe,
      ok: storeQty === 8
    };
  },
  /**
   * Case P: (1) batch absolute upsert of many new UIDs sticks on store;
   * (2) older requeued seq must always be dropped (no fall-through → flash-then-revert);
   * (3) mid-flush clear only removes flushed touch UIDs.
   */
  simulateBatchUpsertAndStaleReject: function() {
    var state = {
      fixtures: [{ uid: 'fx-seed', assetId: 'S', qty: 1 }],
      writeSeq: 1,
      clientId: 'seed'
    };
    var batch = [
      { uid: 'fx-seed', assetId: 'S', qty: 1 },
      { uid: 'fx-a', assetId: 'A', qty: 10 },
      { uid: 'fx-b', assetId: 'B', qty: 1000 },
      { uid: 'fx-c', assetId: 'C', qty: 3 }
    ];
    var touch = { 'fx-a': 1, 'fx-b': 1, 'fx-c': 1 };
    // New rows: orig missing → delta = absolute qty (base 0)
    var deltas = { 'fx-a': 10, 'fx-b': 1000, 'fx-c': 3 };
    state = txnStatePatch(state, batch, touch, {}, 'designer', deltas);
    var store = mapByUid(state.fixtures);
    var batchOk = !!store['fx-a'] && Number(store['fx-a'].qty) === 10 &&
      !!store['fx-b'] && Number(store['fx-b'].qty) === 1000 &&
      !!store['fx-c'] && Number(store['fx-c'].qty) === 3;

    // Older snap after newer lastSeq — must NOT apply (production fall-through was the revert bug)
    var applyOlder = this.shouldApplyDuringFlushGuard({
      mode: 'fixed',
      guardActive: true,
      remoteSeq: 4,
      lastSeq: 5,
      fixtureSig: 'stale-batch',
      expectedSig: 'fresh-batch'
    });
    var applyEqual = this.shouldApplyDuringFlushGuard({
      mode: 'fixed',
      guardActive: true,
      remoteSeq: 5,
      lastSeq: 5,
      fixtureSig: 'fresh',
      expectedSig: 'other'
    });

    var flushed = { 'fx-a': 1, 'fx-b': 1 };
    var currentTouches = { 'fx-a': 1, 'fx-b': 1, 'fx-mid': 1 };
    Object.keys(flushed).forEach(function(uid) { delete currentTouches[uid]; });
    var midOk = !currentTouches['fx-a'] && !currentTouches['fx-b'] && !!currentTouches['fx-mid'];

    return {
      batchOk: batchOk,
      rejectOlder: applyOlder === false,
      allowEqualOrNewer: applyEqual === true,
      midFlushRetain: midOk,
      ok: batchOk && applyOlder === false && applyEqual === true && midOk
    };
  },
  /** After END, refuse reopen for the same sessionUid. */
  shouldAllowRemotePrepOpen: function(opts) {
    opts = opts || {};
    var ended = String(opts.endedSessionUid || '');
    var sid = String(opts.sessionUid || '');
    if (!ended) return true;
    if (sid && sid === ended) return false;
    if (!sid && opts.sheetsOpenBlocked) return false;
    return true;
  },
  /**
   * Case I: three clients — A deletes u1 (noted), B touches u2, C idle.
   * All must end without u1; store without u1.
   */
  simulateThreeClientDelete: function() {
    var u1 = 'fix-1';
    var u2 = 'fix-2';
    var u3 = 'fix-3';
    var state = {
      fixtures: [
        { uid: u1, assetId: 'A1', qty: 1 },
        { uid: u2, assetId: 'A2', qty: 1 },
        { uid: u3, assetId: 'A3', qty: 1 }
      ],
      writeSeq: 1,
      clientId: 'seed'
    };
    function client(id) {
      return {
        id: id,
        fixtures: JSON.parse(JSON.stringify(state.fixtures)),
        lastDocSeq: 1
      };
    }
    var A = client('A');
    var B = client('B');
    var C = client('C');

    A.fixtures = A.fixtures.filter(function(pa) { return pa.uid !== u1; });
    var del = {};
    del[u1] = 1;
    state = txnStatePatch(state, A.fixtures, {}, del, 'A');
    A.lastDocSeq = state.writeSeq;

    function pull(cl) {
      var r = applyRemotePaState(state, cl.fixtures, {
        clientId: cl.id,
        lastDocWriteSeq: cl.lastDocSeq,
        holdUntil: {},
        touched: {},
        deleted: {}
      });
      cl.fixtures = r.fixtures;
      cl.lastDocSeq = r.docWriteSeq;
    }
    pull(B);
    pull(C);

    var bRow = mapByUid(B.fixtures)[u2];
    if (bRow) bRow.qty = 2;
    var touch = {};
    touch[u2] = 1;
    state = txnStatePatch(state, B.fixtures, touch, {}, 'B');
    B.lastDocSeq = state.writeSeq;

    pull(A);
    pull(C);

    var store = mapByUid(state.fixtures);
    return {
      storeHasU1: !!store[u1],
      aHasU1: !!mapByUid(A.fixtures)[u1],
      bHasU1: !!mapByUid(B.fixtures)[u1],
      cHasU1: !!mapByUid(C.fixtures)[u1],
      ok: !store[u1] && !mapByUid(A.fixtures)[u1] && !mapByUid(B.fixtures)[u1] && !mapByUid(C.fixtures)[u1]
    };
  }
};
