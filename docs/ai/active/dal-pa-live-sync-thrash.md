# Prep PA live sync thrash — investigation log (2026-07-17)

**Status:** Fix in flight (timeline-parity). **Test:** `node scripts/dal-pa-live-sync-test.js`  
**Compare:** [FRAGILE_ZONES.md](../FRAGILE_ZONES.md) § DAL timeline fork live sync **vs** § DAL prep PA fork live sync

## Symptom

Pressing **−** on a fixture during START PREP: qty flips up/down on **both** browsers; tab stutters. Persisted through v628–v632 incremental patches.

## Same class as timeline stutter

Timeline failed when both browsers **full-doc LWW**’d the collab state. Fix was:

1. Explicit **touch maps** (only what you moved)  
2. Host **patch merge** onto remote  
3. Monotonic **`writeSeq`**  
4. **`clientId`** echo ack  
5. **Entity hold**  

Prep PA is a **collection of docs**, not one state doc, but the failure mode is identical: rewriting more than you touched (or inventing diffs from `recalcAutoContainers` UID/`containerUid` churn) → A writes → B overwrites → snap storm → full PA re-render.

## What earlier patches missed

| Attempt | Gap |
|---------|-----|
| Host LISTEN_COL / PA_BATCH_WRITE | Listen worked; writes were blind sets |
| “Patch” via original↔current contentSig | Invented sibling diffs (containerUid); still flushed autos |
| Entity hold / no resurrect | Incomplete without writeSeq + touch maps |
| Coalesce apply / no flush-from-apply | Helped stutter; didn’t stop LWW rewrite war |

## Proof test

`scripts/lib/dal-pa-live-sync-core.js` + `scripts/dal-pa-live-sync-test.js`:

- **Buggy full-rewrite:** qty history `5→4→5→4…` (oscillates)  
- **Touch + hold + writeSeq:** settles at `4` on both clients  

## Locked direction

PA live flush = **only `dalPaNoteTouch_` / `dalPaNoteDelete_` fixture UIDs**, with host-stamped **`writeSeq`/`clientId`**. Autos rebuild locally; full fork sync (incl. autos) only on **END PREP**.
