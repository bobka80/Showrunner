#!/usr/bin/env node
/**
 * DAL prep PA live-sync — timeline-parity regression test (no browser).
 *
 * Proves:
 *   1) Full-rewrite LWW (old PA bug / same class as timeline stutter) OSCILLATES
 *   2) Touch-only + hold + writeSeq apply (timeline discipline) SETTLES at qty 4
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

console.log('--- Case A: buggy full-rewrite (expected FAIL / oscillate or wrong) ---');
var buggy = core.simulateTwoClients({ mode: 'buggy', steps: 10 });
console.log('  store=%s A=%s B=%s oscA=%s oscB=%s', buggy.storeQty, buggy.finalA, buggy.finalB, buggy.oscillatedA, buggy.oscillatedB);
console.log('  historyA', buggy.historyA.join('→'));
console.log('  historyB', buggy.historyB.join('→'));
assert(!buggy.ok, 'buggy full-rewrite must NOT pass the settle criteria (documents the failure mode)');

console.log('\n--- Case B: touch-only + hold + writeSeq (expected PASS) ---');
var good = core.simulateTwoClients({ mode: 'touch', steps: 10 });
console.log('  store=%s A=%s B=%s oscA=%s oscB=%s', good.storeQty, good.finalA, good.finalB, good.oscillatedA, good.oscillatedB);
console.log('  historyA', good.historyA.join('→'));
console.log('  historyB', good.historyB.join('→'));
assert(good.ok, 'touch-only settle: both clients and store at qty 4, no oscillation');
assert(good.finalA === 4 && good.finalB === 4, 'both clients show 4');
assert(!good.oscillatedA && !good.oscillatedB, 'neither client qty history oscillates');

console.log('\n--- Unit: computeTouchPatch ignores untouched ---');
var patch = core.computeTouchPatch(
  [
    { uid: 'u1', qty: 4, assetId: 'A' },
    { uid: 'u2', qty: 9, assetId: 'B' }
  ],
  { u1: 1 },
  {}
);
assert(patch.sets.length === 1 && patch.sets[0].uid === 'u1', 'patch only touched u1');
assert(patch.deletes.length === 0, 'no deletes');

console.log('\n--- Unit: apply must not resurrect held delete ---');
var applied = core.applyRemoteFixtures(
  [{ uid: 'gone', qty: 1, writeSeq: 5, clientId: 'other' }],
  [],
  { deleted: { gone: 1 }, holdUntil: { gone: Date.now() + 5000 }, clientId: 'me', now: Date.now() }
);
assert(applied.fixtures.length === 0, 'held delete does not resurrect');

console.log('\n--- Unit: ignore stale writeSeq ---');
var stale = core.applyRemoteFixtures(
  [{ uid: 'u1', qty: 99, writeSeq: 2, clientId: 'other' }],
  [{ uid: 'u1', qty: 4, writeSeq: 5 }],
  { lastAppliedSeq: { u1: 5 }, clientId: 'me', now: Date.now() }
);
assert(stale.fixtures.length === 0 || Number(stale.fixtures[0].qty) !== 99, 'stale seq cannot yank qty to 99');

if (process.exitCode) {
  console.error('\nDAL PA live-sync TEST FAILED');
  process.exit(1);
}
console.log('\nDAL PA live-sync TEST PASSED (timeline-parity discipline)');
process.exit(0);
