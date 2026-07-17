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

console.log('\n--- Unit: ignore unstamped GAS snap after stamped write (v633 miss) ---');
var unstamped = core.applyRemoteFixtures(
  [{ uid: 'u1', qty: 5, writeSeq: 0, clientId: '' }],
  [{ uid: 'u1', qty: 4, writeSeq: 3 }],
  { lastAppliedSeq: { u1: 3 }, clientId: 'me', now: Date.now() }
);
assert(unstamped.fixtures.length === 1 && Number(unstamped.fixtures[0].qty) === 4,
  'GAS-stripped writeSeq (seq=0) must not yank qty 4→5');

console.log('\n--- Case C: stamped write then unstamped GAS snaps must not oscillate ---');
(function() {
  var store = {
    'fix-1': { uid: 'fix-1', assetId: 'A1', qty: 4, writeSeq: 3, clientId: 'clientA' }
  };
  var client = {
    fixtures: [{ uid: 'fix-1', assetId: 'A1', qty: 4, writeSeq: 3 }],
    lastAppliedSeq: { 'fix-1': 3 },
    touched: {},
    deleted: {},
    holdUntil: {},
    qtyHistory: []
  };
  for (var i = 0; i < 6; i++) {
    // Alternate: good listener snap vs GAS get without writeSeq (stale qty 5)
    var remote = (i % 2 === 0)
      ? [{ uid: 'fix-1', assetId: 'A1', qty: 4, writeSeq: 3, clientId: 'clientA' }]
      : [{ uid: 'fix-1', assetId: 'A1', qty: 5, writeSeq: 0, clientId: '' }];
    var result = core.applyRemoteFixtures(remote, client.fixtures, {
      lastAppliedSeq: client.lastAppliedSeq,
      touched: client.touched,
      deleted: client.deleted,
      holdUntil: client.holdUntil,
      clientId: 'clientA',
      now: Date.now()
    });
    client.fixtures = result.fixtures.length ? result.fixtures : client.fixtures;
    Object.keys(result.appliedSeq || {}).forEach(function(uid) {
      client.lastAppliedSeq[uid] = result.appliedSeq[uid];
    });
    var row = client.fixtures[0];
    client.qtyHistory.push(row ? Number(row.qty) : 0);
  }
  console.log('  history', client.qtyHistory.join('→'));
  var osc = false;
  for (var j = 1; j < client.qtyHistory.length; j++) {
    if (client.qtyHistory[j] !== client.qtyHistory[0]) osc = true;
  }
  assert(!osc && client.qtyHistory[0] === 4, 'GAS/listener alternation must stay at 4');
})();

if (process.exitCode) {
  console.error('\nDAL PA live-sync TEST FAILED');
  process.exit(1);
}
console.log('\nDAL PA live-sync TEST PASSED (timeline-parity discipline)');
process.exit(0);
