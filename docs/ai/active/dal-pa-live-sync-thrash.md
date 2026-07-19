# Prep PA live sync thrash — investigation log (2026-07-17)

**Status:** **Closed into FRAGILE** — structural qty thrash fix = txn state doc. **Current prep live rollback:** GAS **v654** + `host-boot.js?v=653`. Historical smoke: v645. Delete/resurrect + banner: [dal-pa-delete-resurrect.md](dal-pa-delete-resurrect.md) · [FRAGILE § session UI](../FRAGILE_ZONES.md). Floor scope: [multi-user-fork-industrial-and-auto.md](multi-user-fork-industrial-and-auto.md).  
**Test:** `node scripts/dal-pa-live-sync-test.js` (Cases A–G)

## Root cause (why v628–v634 failed)

Timeline works because live collab is **one doc + `runTransaction` + patch-merge touched only**.

Prep PA was still **many docs + non-transactional set**. Two browsers can read the same `writeSeq`, both write `N+1` with different qty → equal-seq LWW → **both UIs flip 4↔5 forever**.

Client guards (hold, ignore unstamped GAS, touch-only flush) cannot beat that race. The node test for touch-only passed while production still thrashed because the test never simulated concurrent equal-seq writes.

## Proof

| Case | Result |
|------|--------|
| A full-rewrite LWW | oscillates `5→4→5→4…` |
| B touch-only per-doc | settles (incomplete vs real race) |
| C **non-txn concurrent equal-seq** | oscillates (production bug) |
| D **txn state patch** | settles at `4` |

## Fix

- Live listen/write: `projects/{id}/assets/state` (`fixturesJson` + doc `writeSeq` + `clientId`)
- Host `SHOWRUNNER_DAL_FS_PA_PATCH_WRITE` = timeline-style transaction
- Mirrors touched/deleted UIDs onto collection docs for END PREP commit
- START PREP snapshot seeds `state`
- Banner: **live sync (patch)**

## Compare to timeline

Same architecture. Collection remains the durable fork rows for commit; **live** is the state doc.
