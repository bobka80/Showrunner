#!/usr/bin/env node
/**
 * DAL prep PA live-sync — timeline-parity regression test.
 *
 * H0 rule: every Case states scenario + Does NOT cover (ban "green means done").
 *
 * Run: node scripts/dal-pa-live-sync-test.js
 */
'use strict';

var core = require('./lib/dal-pa-live-sync-core.js');

function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL:', msg);
    process.exitCode = 1;
    return false;
  }
  console.log('OK:', msg);
  return true;
}

console.log('=== DAL PA live sync (timeline comparison) ===\n');

// Case A: Full-collection rewrite LWW — two browsers rewrite every UID each flush.
// Does NOT cover: transactional state-doc races (Case C/D); delete maps; mode seam (Case H).
console.log('--- Case A: buggy full-rewrite (expected FAIL mode) ---');
var buggy = core.simulateTwoClients({ mode: 'buggy', steps: 10 });
console.log('  historyA', buggy.historyA.join('→'));
assert(!buggy.ok, 'buggy full-rewrite must NOT pass settle criteria');

// Case B: Touch-only per-doc flush settles qty — incomplete vs production equal-seq race.
// Does NOT cover: concurrent equal-seq non-txn race (Case C proved B was insufficient alone).
console.log('\n--- Case B: touch-only per-doc (partial) ---');
var good = core.simulateTwoClients({ mode: 'touch', steps: 10 });
console.log('  historyA', good.historyA.join('→'));
assert(good.ok, 'touch-only settle at 4');

// Case C: Non-transactional concurrent equal-seq LWW — the real v634 production thrash.
// Does NOT cover: host runTransaction merge (Case D); session banner lifecycle.
console.log('\n--- Case C: non-txn concurrent equal-seq race (THE real bug) ---');
var race = core.simulateConcurrentWriteRace({ mode: 'nontxn', steps: 10 });
console.log('  historyA', race.historyA.join('→'));
console.log('  oscA=%s store=%s', race.oscillatedA, race.storeQty);
assert(race.oscillatedA || race.storeQty === 5, 'nontxn race must oscillate or land on stale winner');

// Case D: Transactional state-doc patch-merge settles at 4 (timeline twin).
// Does NOT cover: silent delete without note (Case E); seed-from-local stomp (Case G); Auth fail mid-edit.
console.log('\n--- Case D: transactional state patch (THE real fix) ---');
var txn = core.simulateConcurrentWriteRace({ mode: 'txn', steps: 10 });
console.log('  historyA', txn.historyA.join('→'));
console.log('  historyB', txn.historyB.join('→'));
console.log('  store=%s', txn.storeQty);
assert(txn.ok, 'txn state patch: both clients + store at 4, no oscillation');

// Case E: Silent local delete (no delete map) leaves UID in state → resurrects on A.
// Does NOT cover: UI path inventory (mutation gate); noted delete success (Case F).
console.log('\n--- Case E: silent delete resurrects (bug mode) ---');
var silent = core.simulateDeleteResurrect({ mode: 'silent' });
console.log('  storeHasU1=%s aHasU1=%s bHasU1=%s', silent.storeHasU1, silent.aHasU1, silent.bHasU1);
assert(silent.ok, 'silent delete must leave u1 in store and resurrect on A');

// Case F: Noted delete + peer unrelated edit — UID stays gone.
// Does NOT cover: 3-client (Case I); formula-group silent paths; banner false-END.
console.log('\n--- Case F: noted delete stays gone after peer edit ---');
var noted = core.simulateDeleteResurrect({ mode: 'noted' });
console.log('  storeHasU1=%s aHasU1=%s bHasU1=%s', noted.storeHasU1, noted.aHasU1, noted.bHasU1);
assert(noted.ok, 'noted delete: u1 gone from store + both clients after B edits u2');

// Case G: Seed-from-local gated after writeSeq — cannot stomp peer deletes.
// Does NOT cover: first-join empty state seed (allowed when writeSeq=0); collection mirror.
console.log('\n--- Case G: seed gate blocks stomp after writeSeq ---');
var seedGate = core.shouldSeedFromLocal({ lastDocWriteSeq: 3, localCount: 2, stateSeeded: false, remoteWriteSeq: 0 });
assert(!seedGate, 'shouldSeedFromLocal false when lastDocWriteSeq > 0');
var seedOk = core.simulateSeedStomp({ allowSeed: true });
console.log('  canSeed=%s storeHasU1=%s', seedOk.canSeed, seedOk.storeHasU1);
assert(seedOk.ok, 'gated seed does not resurrect u1');
var seedBad = core.simulateSeedStomp({ allowSeed: false });
assert(seedBad.storeHasU1, 'ungated full-local seed WOULD resurrect u1 (bug proof)');

// Case H: Mode seam — while liveSyncMode=firestore, reject GAS list apply (unstamped).
// Does NOT cover: runtime Auth mid-edit fail (H1 product); host-boot message routing.
console.log('\n--- Case H: mode seam rejects GAS apply in firestore mode ---');
assert(!core.shouldApplyGasPaList({ liveSyncMode: 'firestore' }), 'firestore mode rejects GAS list');
assert(core.shouldApplyGasPaList({ liveSyncMode: 'gas' }), 'gas mode allows GAS list');
assert(core.shouldApplyGasPaList({ liveSyncMode: '' }), 'empty mode allows (pre-live)');

// Case I: Three clients — noted delete + peer qty edit; idle third stays clean.
// Does NOT cover: N>3; network partition; session UI endedSessionUid (Case J).
console.log('\n--- Case I: three-client noted delete ---');
var three = core.simulateThreeClientDelete();
console.log('  storeHasU1=%s a/b/c=%s/%s/%s', three.storeHasU1, three.aHasU1, three.bHasU1, three.cHasU1);
assert(three.ok, 'three clients: u1 gone everywhere after noted delete + B edit');

// Case J: After END, same sessionUid must not reopen (sticky ended uid).
// Does NOT cover: Firestore fromCache delivery; Sheets poll timing.
console.log('\n--- Case J: ended sessionUid blocks reopen ---');
assert(!core.shouldAllowRemotePrepOpen({
  endedSessionUid: 'sess-1',
  sessionUid: 'sess-1',
  sheetsOpenBlocked: true
}), 'same ended uid blocked');
assert(core.shouldAllowRemotePrepOpen({
  endedSessionUid: 'sess-1',
  sessionUid: 'sess-2',
  sheetsOpenBlocked: true
}), 'new session uid allowed');
assert(!core.shouldAllowRemotePrepOpen({
  endedSessionUid: 'sess-1',
  sessionUid: '',
  sheetsOpenBlocked: true
}), 'empty uid blocked while sheetsOpenBlocked');

// Case K: Auth fails mid-edit — further flush must not patch store (H1 fail closed).
// Does NOT cover: UI toast copy; retry timer; timeline twin (mirrors same gate).
console.log('\n--- Case K: auth fail mid-edit blocks writes ---');
assert(core.shouldAllowLivePaWrite({ prepUiOpen: true, liveSyncMode: 'firestore' }), 'firestore allows writes');
assert(!core.shouldAllowLivePaWrite({ prepUiOpen: true, liveSyncMode: 'blocked' }), 'blocked denies writes');
assert(!core.shouldAllowLivePaWrite({ prepUiOpen: true, liveSyncMode: 'gas' }), 'legacy gas denies writes');
assert(!core.shouldAllowLivePaWrite({ prepUiOpen: true, liveSyncMode: 'connecting' }), 'connecting denies writes');
assert(core.shouldAllowLivePaWrite({ prepUiOpen: false, liveSyncMode: '' }), 'outside prep allows (normal save)');
var mid = core.simulateAuthFailMidEdit();
console.log('  mode=%s store %s→%s local=%s', mid.mode, mid.storeBefore, mid.storeAfter, mid.localQty);
assert(mid.ok, 'mid-edit auth fail: store stays at 5, local may be 9, flush denied');

// Case L: FlushGuard must not drop peer snaps (missed update class).
// Does NOT cover: host bridge delivery; fromCache; hold re-queue timing.
console.log('\n--- Case L: FlushGuard must not drop peer update ---');
assert(!core.shouldApplyDuringFlushGuard({
  mode: 'buggy',
  guardActive: true,
  fixtureSig: 'peer-changed',
  expectedSig: 'my-flush',
  remoteSeq: 6,
  lastSeq: 6
}), 'buggy: sig mismatch drops peer (bug proof)');
assert(core.shouldApplyDuringFlushGuard({
  mode: 'fixed',
  guardActive: true,
  fixtureSig: 'peer-changed',
  expectedSig: 'my-flush',
  remoteSeq: 6,
  lastSeq: 6
}), 'fixed: equal/newer seq applies peer');
assert(!core.shouldApplyDuringFlushGuard({
  mode: 'fixed',
  guardActive: true,
  fixtureSig: 'stale',
  expectedSig: 'my-flush',
  remoteSeq: 4,
  lastSeq: 6
}), 'fixed: older seq still dropped');

// Case M: held merge must not ack remote sig (forgotten-until-refresh class).
// Does NOT cover: UI render skip; host delivery.
console.log('\n--- Case M: do not ack remote sig when merge kept local ---');
assert(!core.shouldAckRemoteSigAfterMerge({
  remoteSig: 'peer-u1=5',
  localSig: 'local-u1=1',
  mergedSig: 'local-u1=1'
}), 'held peer edit: do not ack');
assert(core.shouldAckRemoteSigAfterMerge({
  remoteSig: 'same',
  localSig: 'same',
  mergedSig: 'same'
}), 'identical: ack ok');
assert(core.shouldAckRemoteSigAfterMerge({
  remoteSig: 'peer',
  localSig: 'old',
  mergedSig: 'peer'
}), 'merged applied peer: ack ok');

// Case N: concurrent flush — writer must apply txn-merged peer rows (not leave UI stale).
// Does NOT cover: host postMessage delivery; render overlay hidden.
console.log('\n--- Case N: concurrent flush absorbs peer into writer UI ---');
var abs = core.simulateConcurrentFlushAbsorb();
console.log('  store u1=%s u2=%s buggyUi.u1=%s fixedUi.u1=%s', abs.storeU1, abs.storeU2, abs.buggyU1, abs.fixedU1);
assert(abs.ok, 'store has A+B edits; buggy UI forgets u1; fixed applies merged u1=5');

// Case O: three +1 on same row with qty deltas → combined truth (5+3=8), not LWW 6.
// Does NOT cover: type-in absolute qty intent; heal ticker timing.
console.log('\n--- Case O: three-client qty deltas combine ---');
var comb = core.simulateThreeClientQtyCombine();
console.log('  storeQty=%s (LWW would be %s)', comb.storeQty, comb.lwwWouldBe);
assert(comb.ok, 'three +1 from 5 → store 8');

// Case P: batch absolute upsert + always-drop older seq + mid-flush touch retain.
// Covers flash-then-revert class missed by Case O.
console.log('\n--- Case P: batch upsert + stale reject + mid-flush retain ---');
var batchP = core.simulateBatchUpsertAndStaleReject();
console.log('  batchOk=%s rejectOlder=%s midRetain=%s', batchP.batchOk, batchP.rejectOlder, batchP.midFlushRetain);
assert(batchP.ok, 'batch upsert sticks; older seq dropped; mid-flush touches kept');

console.log('\n--- Unit: patchMergeFixtures only applies touches ---');
var merged = core.patchMergeFixtures(
  [{ uid: 'u1', qty: 5 }, { uid: 'u2', qty: 1 }],
  [{ uid: 'u1', qty: 4 }, { uid: 'u2', qty: 99 }],
  { u1: 1 },
  {}
);
var m1 = merged.find(function (x) { return x.uid === 'u1'; });
var m2 = merged.find(function (x) { return x.uid === 'u2'; });
assert(m1 && Number(m1.qty) === 4, 'touched u1 becomes 4');
assert(m2 && Number(m2.qty) === 1, 'untouched u2 keeps remote 1 (not local 99)');

var mergedDelta = core.patchMergeFixtures(
  [{ uid: 'u1', qty: 5 }],
  [{ uid: 'u1', qty: 6 }],
  { u1: 1 },
  {},
  { u1: 1 }
);
var md = mergedDelta.find(function (x) { return x.uid === 'u1'; });
assert(md && Number(md.qty) === 6, 'delta +1 on remote 5 → 6');

console.log('\n--- Unit: state apply ignores own echo ---');
var echo = core.applyRemotePaState(
  { fixtures: [{ uid: 'u1', qty: 4 }], writeSeq: 3, clientId: 'me' },
  [{ uid: 'u1', qty: 4 }],
  { clientId: 'me', lastDocWriteSeq: 2 }
);
assert(echo.skipped === 'echo' && echo.docWriteSeq === 3, 'own echo acks seq without yank');

var delMerge = core.patchMergeFixtures(
  [{ uid: 'u1', qty: 1 }, { uid: 'u2', qty: 1 }],
  [{ uid: 'u2', qty: 1 }],
  {},
  { u1: 1 }
);
assert(!delMerge.find(function (x) { return x.uid === 'u1'; }), 'delete map removes u1 from merge');

console.log('\n--- Case Q: shortage flag changes fixtureSig (peer must apply) ---');
var sigPlain = core.fixtureSig([{ uid: 'u1', qty: 1, location: 'A', formula: 'Standalone', assetId: 'x' }]);
var sigShort = core.fixtureSig([{ uid: 'u1', qty: 1, location: 'A', formula: 'Standalone', assetId: 'x', isShortage: true }]);
assert(sigPlain !== sigShort, 'shortage toggle must change fixtureSig');
var shortMerge = core.patchMergeFixtures(
  [{ uid: 'u1', qty: 1, location: 'A', formula: 'Standalone', assetId: 'x', isShortage: false }],
  [{ uid: 'u1', qty: 1, location: 'A', formula: 'Standalone', assetId: 'x', isShortage: true }],
  { u1: 1 },
  {}
);
var sm = shortMerge.find(function (x) { return x.uid === 'u1'; });
assert(sm && sm.isShortage === true, 'touched shortage upsert lands in store');

console.log('\n--- Case R: overrideDept changes fixtureSig (peer must apply) ---');
var sigNoDept = core.fixtureSig([{ uid: 'u1', qty: 1, location: 'A', formula: 'Standalone', assetId: 'x' }]);
var sigDept = core.fixtureSig([{ uid: 'u1', qty: 1, location: 'A', formula: 'Standalone', assetId: 'x', overrideDept: 'dept_sound' }]);
assert(sigNoDept !== sigDept, 'overrideDept must change fixtureSig');
var deptMerge = core.patchMergeFixtures(
  [{ uid: 'u1', qty: 1, location: 'A', formula: 'Standalone', assetId: 'x', overrideDept: '' }],
  [{ uid: 'u1', qty: 1, location: 'A', formula: 'Standalone', assetId: 'x', overrideDept: 'dept_sound' }],
  { u1: 1 },
  {}
);
var dm = deptMerge.find(function (x) { return x.uid === 'u1'; });
assert(dm && dm.overrideDept === 'dept_sound', 'touched overrideDept upsert lands in store');

console.log('\n--- Case S: H4 state size + END mirror ---');
var sizeCore = require('./lib/dal-state-size-mirror-core.js');
var small = sizeCore.stateSizeReport({ payload: [{ uid: 'a' }], count: 1 });
assert(small.ok && !small.overWarn && !small.overMax, 'tiny state is ok');
var warnCount = sizeCore.stateSizeReport({ payload: [], count: sizeCore.WARN_COUNT });
assert(warnCount.overWarn && !warnCount.overMax, 'WARN_COUNT triggers overWarn');
var maxCount = sizeCore.stateSizeReport({ payload: [], count: sizeCore.MAX_COUNT });
assert(maxCount.overMax && !maxCount.ok, 'MAX_COUNT refuses');
var bigJson = sizeCore.stateSizeReport({ json: new Array(sizeCore.MAX_BYTES + 2).join('x') });
assert(bigJson.overMax, 'MAX_BYTES refuses');
var mirrorOk = sizeCore.mirrorCompare(
  [{ uid: 'u1', assetId: 'a', qty: 2, location: 'G', formula: 'Standalone' }],
  [{ uid: 'u1', assetId: 'a', qty: 2, location: 'G', formula: 'Standalone' }]
);
assert(mirrorOk.ok, 'identical state/collection mirror ok');
var mirrorDrift = sizeCore.mirrorCompare(
  [{ uid: 'u1', assetId: 'a', qty: 2, location: 'G', formula: 'Standalone' }],
  [{ uid: 'u1', assetId: 'a', qty: 9, location: 'G', formula: 'Standalone' }]
);
assert(!mirrorDrift.ok && mirrorDrift.fieldMismatches.indexOf('u1') >= 0, 'qty drift detected');
var mirrorAutoIgnored = sizeCore.mirrorCompare(
  [{ uid: 'u1', assetId: 'a', qty: 1, location: 'G', formula: 'Standalone' }],
  [
    { uid: 'u1', assetId: 'a', qty: 1, location: 'G', formula: 'Standalone' },
    { uid: 'auto1', assetId: 'c', qty: 1, formula: 'Auto-Container', isAuto: true }
  ]
);
assert(mirrorAutoIgnored.ok, 'auto rows excluded from mirror');
var tlSize = sizeCore.timelineStateSizeReport([{ id: 1 }], [], {});
assert(tlSize.ok, 'small timeline state ok');

console.log('\n--- Case T: H3 non-combining LWW loss visibility ---');
var lww = require('./lib/dal-lww-conflict-core.js');
var sigA = lww.paNonCombiningSig({ location: 'A', formula: 'Standalone', qty: 1 });
var sigB = lww.paNonCombiningSig({ location: 'B', formula: 'Standalone', qty: 99 });
assert(sigA !== sigB, 'location change alters non-combining sig');
assert(
  lww.paNonCombiningSig({ location: 'A', formula: 'Standalone', qty: 1 }) ===
    lww.paNonCombiningSig({ location: 'A', formula: 'Standalone', qty: 50 }),
  'qty-only change must NOT alter non-combining sig'
);
var watch = {
  u1: { sig: lww.paNonCombiningSig({ location: 'Mine', formula: 'Standalone' }), until: Date.now() + 10000 }
};
var remoteBy = {
  u1: { uid: 'u1', location: 'Peer', formula: 'Standalone', qty: 1 }
};
var lost = lww.detectWatchedLwwLosses(watch, remoteBy, Date.now(), {});
assert(lost.indexOf('u1') >= 0, 'peer location overwrite detected');
var lostProtected = lww.detectWatchedLwwLosses(watch, remoteBy, Date.now(), { u1: 1 });
assert(lostProtected.length === 0, 'held/touched uid not reported as loss');
var lostQtyOnly = lww.detectWatchedLwwLosses(
  { u1: { sig: lww.paNonCombiningSig({ location: 'A', formula: 'Standalone', qty: 1 }), until: Date.now() + 9999 } },
  { u1: { uid: 'u1', location: 'A', formula: 'Standalone', qty: 9 } },
  Date.now(),
  {}
);
assert(lostQtyOnly.length === 0, 'qty-only remote change is not an H3 conflict');
var shiftLost = lww.detectWatchedLwwLosses(
  { s1: { sig: lww.shiftNonCombiningSig({ role: 'FOH', start: 1 }), until: Date.now() + 9999 } },
  { s1: { id: 's1', role: 'MON', start: 1 } },
  Date.now(),
  {},
  lww.shiftNonCombiningSig
);
assert(shiftLost.indexOf('s1') >= 0, 'timeline shift role overwrite detected');
var peerDel = lww.detectWatchedPeerDeletes(
  { u1: { sig: lww.paNonCombiningSig({ location: 'A' }), until: Date.now() + 9999 } },
  {},
  Date.now(),
  {}
);
assert(peerDel.indexOf('u1') >= 0, 'peer delete of watched uid detected');
var peerDelProtected = lww.detectWatchedPeerDeletes(
  { u1: { sig: lww.paNonCombiningSig({ location: 'A' }), until: Date.now() + 9999 } },
  {},
  Date.now(),
  { u1: 1 }
);
assert(peerDelProtected.length === 0, 'own pending delete not reported as peer delete');
var peerDelShift = lww.detectWatchedPeerDeletes(
  { s1: { sig: lww.shiftNonCombiningSig({ role: 'FOH' }), until: Date.now() + 9999 } },
  {},
  Date.now(),
  {}
);
assert(peerDelShift.indexOf('s1') >= 0, 'timeline peer strip delete detected');

if (process.exitCode) {
  console.error('\nDAL PA live-sync TEST FAILED');
  process.exit(1);
}
console.log('\nDAL PA live-sync TEST PASSED (Cases A–T + units)');
process.exit(0);
