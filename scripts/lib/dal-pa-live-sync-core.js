/**
 * Pure PA live-sync core (timeline-parity discipline).
 * Used by scripts/dal-pa-live-sync-test.js and mirrored in 02e7_Dal_Firestore_Client.html.
 *
 * Timeline gold standard:
 *   - explicit touch/delete maps (never invent diffs)
 *   - patch onto remote (untouched keep remote)
 *   - monotonic writeSeq per entity
 *   - entity hold after local write
 *   - ignore own clientId echo / stale seq
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

/**
 * Apply remote fixtures onto local with timeline-style guards.
 * @param {object[]} remoteFixtures
 * @param {object[]} localFixtures
 * @param {object} opts
 *   holdUntil: {uid: epochMs}
 *   lastAppliedSeq: {uid: number}
 *   touched: {uid:1}
 *   deleted: {uid:1}
 *   clientId: string
 *   now: number
 */
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

    // Own echo — ack seq, do not yank UI.
    if (clientId && remoteClient === clientId) {
      if (seq > (lastAppliedSeq[uid] || 0)) appliedMeta[uid] = seq;
      if (localBy[uid]) {
        out.push(localBy[uid]);
        used[uid] = true;
      }
      return;
    }

    // Stale / unstamped seq — never yank after a stamped write (GAS strips writeSeq).
    var lastSeq = Number(lastAppliedSeq[uid] || 0) || 0;
    if (lastSeq > 0 && (!seq || seq < lastSeq)) {
      if (localBy[uid]) {
        out.push(localBy[uid]);
        used[uid] = true;
      }
      return;
    }

    // Local hold / pending delete / pending touch — keep local absence or local row
    if ((holdUntil[uid] || 0) > now || deleted[uid]) {
      if (localBy[uid]) {
        out.push(localBy[uid]);
        used[uid] = true;
      }
      // else: intentional absence — do not resurrect
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

  // Keep local-only touched adds
  Object.keys(localBy).forEach(function (uid) {
    if (used[uid]) return;
    if (touched[uid] || (holdUntil[uid] || 0) > now) {
      out.push(localBy[uid]);
    }
  });

  return { fixtures: out, appliedSeq: appliedMeta };
}

/**
 * Build patch from explicit touches only (timeline discipline).
 * Never invents "local differs from original" for untouched rows.
 */
function computeTouchPatch(localFixtures, touched, deleted) {
  var localBy = mapByUid(localFixtures);
  var sets = [];
  var dels = [];
  Object.keys(touched || {}).forEach(function (uid) {
    if (localBy[uid]) sets.push({ uid: uid, doc: localBy[uid] });
  });
  Object.keys(deleted || {}).forEach(function (uid) {
    if (uid && uid !== '_meta') dels.push(uid);
  });
  return { sets: sets, deletes: dels };
}

/**
 * OLD buggy behavior: rewrite every local fixture to the store (full LWW).
 * Used in tests to prove thrash.
 */
function buggyFullRewrite(store, localFixtures, clientId) {
  var next = Object.assign({}, store);
  // Delete all fixtures not in local, set all local
  Object.keys(next).forEach(function (uid) {
    if (!isAutoRow(next[uid])) delete next[uid];
  });
  fixturesOnly(localFixtures).forEach(function (pa) {
    var uid = String(pa.uid);
    var prev = store[uid];
    var prevSeq = prev ? Number(prev.writeSeq || 0) || 0 : 0;
    next[uid] = Object.assign({}, pa, {
      writeSeq: prevSeq + 1,
      clientId: clientId
    });
  });
  return next;
}

/**
 * NEW: touch-only write into shared store with per-doc writeSeq.
 */
function touchWrite(store, localFixtures, touched, deleted, clientId) {
  var next = Object.assign({}, store);
  var localBy = mapByUid(localFixtures);
  Object.keys(deleted || {}).forEach(function (uid) {
    delete next[uid];
  });
  Object.keys(touched || {}).forEach(function (uid) {
    var pa = localBy[uid];
    if (!pa) return;
    var prev = store[uid];
    var prevSeq = prev ? Number(prev.writeSeq || 0) || 0 : 0;
    next[uid] = Object.assign({}, pa, {
      writeSeq: prevSeq + 1,
      clientId: clientId
    });
  });
  return next;
}

function storeToList(store) {
  return Object.keys(store).map(function (k) { return store[k]; });
}

/**
 * Simulate two browsers for N steps. Returns whether qty for targetUid oscillated.
 */
function simulateTwoClients(opts) {
  opts = opts || {};
  var mode = opts.mode || 'touch'; // 'touch' | 'buggy'
  var steps = opts.steps || 8;
  var targetUid = opts.targetUid || 'fix-1';
  var store = {};
  // seed
  store[targetUid] = { uid: targetUid, assetId: 'A1', qty: 5, location: 'General', formula: 'Standalone', writeSeq: 1, clientId: 'seed' };
  store['fix-2'] = { uid: 'fix-2', assetId: 'A2', qty: 1, location: 'General', formula: 'Standalone', writeSeq: 1, clientId: 'seed' };

  function makeClient(id) {
    return {
      id: id,
      fixtures: JSON.parse(JSON.stringify(storeToList(store))),
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
    var remote = fixturesOnly(storeToList(store));
    var result = applyRemoteFixtures(remote, fixturesOnly(client.fixtures), {
      holdUntil: client.holdUntil,
      lastAppliedSeq: client.lastAppliedSeq,
      touched: client.touched,
      deleted: client.deleted,
      clientId: client.id,
      now: Date.now()
    });
    client.fixtures = result.fixtures;
    Object.keys(result.appliedSeq).forEach(function (uid) {
      client.lastAppliedSeq[uid] = result.appliedSeq[uid];
    });
    client.qtyHistory.push(qtyOf(client));
  }

  function flush(client) {
    var patch = computeTouchPatch(client.fixtures, client.touched, client.deleted);
    if (mode === 'buggy') {
      store = buggyFullRewrite(store, client.fixtures, client.id);
    } else {
      store = touchWrite(store, client.fixtures, client.touched, client.deleted, client.id);
    }
    Object.keys(client.touched).forEach(function (uid) {
      client.holdUntil[uid] = Date.now() + 2000;
    });
    Object.keys(client.deleted).forEach(function (uid) {
      client.holdUntil[uid] = Date.now() + 2000;
    });
    client.touched = {};
    client.deleted = {};
    // Update lastApplied from store
    var row = store[targetUid];
    if (row) client.lastAppliedSeq[targetUid] = Number(row.writeSeq || 0) || 0;
  }

  // A presses minus once: qty 5 → 4
  var aRow = mapByUid(A.fixtures)[targetUid];
  aRow.qty = 4;
  A.touched[targetUid] = 1;
  A.holdUntil[targetUid] = Date.now() + 2000;
  flush(A);

  for (var i = 0; i < steps; i++) {
    if (mode === 'buggy') {
      // Classic LWW war: each browser full-rewrites its stale local copy.
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

  function oscillated(history) {
    var sawUp = false;
    var sawDown = false;
    for (var i = 1; i < history.length; i++) {
      if (history[i] > history[i - 1]) sawUp = true;
      if (history[i] < history[i - 1]) sawDown = true;
    }
    return sawUp && sawDown;
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
  applyRemoteFixtures: applyRemoteFixtures,
  computeTouchPatch: computeTouchPatch,
  buggyFullRewrite: buggyFullRewrite,
  touchWrite: touchWrite,
  simulateTwoClients: simulateTwoClients
};
