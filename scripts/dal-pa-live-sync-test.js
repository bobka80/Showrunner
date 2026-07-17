#!/usr/bin/env node
/**
 * DAL prep PA live-sync — timeline-parity regression test.
 *
 * Proves:
 *   A) Full-rewrite LWW oscillates
 *   B) Touch-only per-doc settles (partial fix)
 *   C) Non-transactional concurrent equal-seq race OSCILLATES (production bug after v634)
 *   D) Transactional state-doc patch SETTLES at 4 (real fix)
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

console.log('--- Case A: buggy full-rewrite (expected FAIL mode) ---');
var buggy = core.simulateTwoClients({ mode: 'buggy', steps: 10 });
console.log('  historyA', buggy.historyA.join('→'));
assert(!buggy.ok, 'buggy full-rewrite must NOT pass settle criteria');

console.log('\n--- Case B: touch-only per-doc (partial) ---');
var good = core.simulateTwoClients({ mode: 'touch', steps: 10 });
console.log('  historyA', good.historyA.join('→'));
assert(good.ok, 'touch-only settle at 4');

console.log('\n--- Case C: non-txn concurrent equal-seq race (THE real bug) ---');
var race = core.simulateConcurrentWriteRace({ mode: 'nontxn', steps: 10 });
console.log('  historyA', race.historyA.join('→'));
console.log('  oscA=%s store=%s', race.oscillatedA, race.storeQty);
assert(race.oscillatedA || race.storeQty === 5, 'nontxn race must oscillate or land on stale winner');

console.log('\n--- Case D: transactional state patch (THE real fix) ---');
var txn = core.simulateConcurrentWriteRace({ mode: 'txn', steps: 10 });
console.log('  historyA', txn.historyA.join('→'));
console.log('  historyB', txn.historyB.join('→'));
console.log('  store=%s', txn.storeQty);
assert(txn.ok, 'txn state patch: both clients + store at 4, no oscillation');

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

console.log('\n--- Unit: state apply ignores own echo ---');
var echo = core.applyRemotePaState(
  { fixtures: [{ uid: 'u1', qty: 4 }], writeSeq: 3, clientId: 'me' },
  [{ uid: 'u1', qty: 4 }],
  { clientId: 'me', lastDocWriteSeq: 2 }
);
assert(echo.skipped === 'echo' && echo.docWriteSeq === 3, 'own echo acks seq without yank');

if (process.exitCode) {
  console.error('\nDAL PA live-sync TEST FAILED');
  process.exit(1);
}
console.log('\nDAL PA live-sync TEST PASSED (txn state = timeline parity)');
process.exit(0);
