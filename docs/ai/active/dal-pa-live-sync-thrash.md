# Prep PA live sync thrash — investigation log (2026-07-17)

**Status:** Root cause #2 fixed (GAS unstamped snaps). **Test:** `node scripts/dal-pa-live-sync-test.js`  
**Compare:** [FRAGILE_ZONES.md](../FRAGILE_ZONES.md) § DAL timeline fork live sync **vs** § DAL prep PA fork live sync

## Symptom

Pressing **−** on a fixture during START PREP: qty flips up/down on **both** browsers; tab stutters. Persisted through v628–v633.

## Same class as timeline stutter

Timeline failed when both browsers **full-doc LWW**’d the collab state. Fix was touch maps + host patch + **`writeSeq`** + **`clientId`** + entity hold.

Prep PA is a **collection of docs**, not one state doc, but the failure mode is identical.

## What v628–v632 missed

| Attempt | Gap |
|---------|-----|
| Host LISTEN_COL / PA_BATCH_WRITE | Listen worked; writes were blind sets |
| “Patch” via original↔current contentSig | Invented sibling diffs; still flushed autos |
| Entity hold / no resurrect | Incomplete without writeSeq + touch maps |
| Coalesce apply / no flush-from-apply | Helped stutter; didn’t stop LWW rewrite war |

## What v633 missed (why thrash continued)

Touch + host `writeSeq` was correct — but **two side doors** still yanked qty:

1. **Late / overlapping `getProjectAssets` (GAS)** still called `dalApplyRemotePaAssets_`. GAS maps sheet-shaped rows and **strips `writeSeq`/`clientId`**. Apply treated `seq=0` as “not stale” → old qty overwrote the stamped listener state → **listener↔GAS oscillation** (`4↔5`) on both browsers.
2. **Live flush fallback to `saveProjectAssets`** → `firestoreWriteDocument_` full PATCH replace **wiped** host `writeSeq` on the fork → same war.
3. Summed-mode **`updatePaQtyGeneric`** (−/+) did not call `dalPaNoteTouch_` / delete notes.

## Proof test

`scripts/lib/dal-pa-live-sync-core.js` + `scripts/dal-pa-live-sync-test.js`:

- **Buggy full-rewrite:** qty history `5→4→5→4…` (oscillates)  
- **Touch + hold + writeSeq:** settles at `4`  
- **Unstamped GAS snap after stamped write:** must keep `4` (Case C)

## Locked direction

| Rule | Detail |
|------|--------|
| Live flush | Only `dalPaNoteTouch_` / `dalPaNoteDelete_` fixture UIDs + host/client **`writeSeq`/`clientId`** |
| GAS get during firestore live | **Overlap map only** — never apply fixture list |
| Stale guard | `lastAppliedSeq > 0` ⇒ ignore `seq=0` or `seq < lastApplied` |
| Flush failure | Retry client write — **no** GAS save fallback in firestore mode |
| Autos | Rebuild locally; full fork sync on **END PREP** only |
