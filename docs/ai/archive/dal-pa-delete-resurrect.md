# Prep PA live sync — delete / resurrect failure (2026-07-18)

**Status:** **ARCHIVED** — closed into FRAGILE. Delete notes + seed-once + Cases E–G. **Current prep live rollback:** GAS **v654**. Canonical: [FRAGILE_ZONES.md](../FRAGILE_ZONES.md) § session UI + § prep PA. Floor scope: [../active/multi-user-fork-industrial-and-auto.md](../active/multi-user-fork-industrial-and-auto.md).  
**Campaign:** [../active/multi-user-fork-industrial-and-auto.md](../active/multi-user-fork-industrial-and-auto.md) · [data-access-layer.md](data-access-layer.md)  
**Prior science:** [dal-pa-live-sync-thrash.md](dal-pa-live-sync-thrash.md) · [FRAGILE_ZONES.md](../FRAGILE_ZONES.md) §§ timeline / prep PA / session UI  
**Industry + process (canonical):** [dal-prep-live-sync-standards.md](dal-prep-live-sync-standards.md)

**Historical production at report:** GAS **v638** + hosting `host-boot.js?v=635` · DAL-era rollback **v576**

---

## 1. What the director saw (plain language)

1. User A removes an item during START PREP → User B **does not** see the remove.  
2. Later User B removes something else → on User A, the **first** removed item **comes back**.  
3. Feels like the system is **one step behind**, undoing the previous action.

This is the same *family* as qty 4↔5 thrash (wrong authority / wrong write shape), but the symptom is **delete not propagating + resurrection**, not rapid flip.

---

## 2. How live prep is *supposed* to work (current design)

```
START PREP
  → Sheets session open
  → Snapshot fixtures → Firestore collection + assets/state (fixturesJson, writeSeq)
  → Both browsers listen to assets/state (banner: live sync (patch))

Local edit (qty / delete)
  → dalPaNoteTouch_(uid) or dalPaNoteDelete_(uid)
  → render → dalFlushPaIfPrepOpen_
  → Host PA_PATCH_WRITE: runTransaction
        read remote fixturesJson
        apply ONLY touched + deleted maps
        writeSeq++
        mirror touched/deleted onto collection docs

Remote browser
  → onSnapshot(state)
  → if not own clientId echo / not stale writeSeq
  → merge remote fixtures with local holds/touches
  → missing remote UID (and not held) → row stays gone
```

**Gold rules (already locked in FRAGILE):**

| Rule | Meaning |
|------|---------|
| Touch/delete maps only | Never invent full-list diffs |
| One state doc + transaction | Total order; kills equal-seq LWW |
| Own `clientId` echo | Don’t re-install UI from your own write |
| Entity hold / recently-deleted | Don’t resurrect from lagging snaps |
| Never flush-from-apply | No snap→render→flush war |
| Autos local-only | Don’t live-write auto-container UID churn |

Industry alignment: same as structured collab (entity patch + server order) — **not** Google Docs OT / Yjs.

---

## 3. How a delete is supposed to travel (call chain)

| Step | File | Function |
|------|------|----------|
| UI DEL / minus-to-zero | `02e2_Logic_CRUD.html` | `modifyPaIndices`, `removePaIndices`, `updatePaQtyGeneric`, … |
| Note delete | `02e7_Dal_Firestore_Client.html` | `dalPaNoteDelete_(uid)` → `dalPaDeletedUids_` + hold |
| Flush | same | `dalFlushPaIfPrepOpen_` → `dalWritePaForkToFirestore_` |
| Host txn | `host-boot.js` | `dalFsHandlePaPatchWrite_` → `dalFsPatchPaFixtures_` deletes UIDs from `fixturesJson` |
| Peer apply | `02e7` | `dalApplyRemotePaStateDoc_` → `dalApplyRemotePaAssetsNow_` → merge without that UID |

If **any** step skips the delete note, or a later write **re-seeds full local** onto state, the peer never loses the row — or the row comes back.

---

## 4. Ranked root-cause hypotheses (evidence in code)

### H1 — `removePa(idx)` never notes delete (high)

```941:950:02e2_Logic_CRUD.html
function removePa(idx) { 
    ...
    currentProjectAssets.splice(idx, 1); 
    ...
    renderProjectAssetsUI(); 
}
```

No `dalPaNoteDelete_`. Local UI loses the row; **Firestore state keeps it**. Peer never updates. Later any authoritative snap (or peer seed) **puts the row back** on the deleter → “undo / one step behind.”

Grouped DEL / minus-to-zero paths *do* note delete; single-row `removePa` does not.

### H2 — `dalPaSeedStateFromLocal_` rewrites state from one browser’s full list (high)

```852:863:02e7_Dal_Firestore_Client.html
window.dalPaSeedStateFromLocal_ = function() {
  ...
  localSeed.forEach(function(pa) {
    window.dalPaTouchedUids_[String(pa.uid)] = 1;
  });
  dalFlushPaIfPrepOpen_();
};
```

Triggered when state looks empty / missing, or empty snap vs non-empty local (`dalApplyRemotePaStateDoc_`). That flush marks **every** local fixture touched → patch merge can **re-insert rows the peer already deleted** if this browser never applied that delete.

Matches: A deletes (maybe never reaches B) → B still has item → B seeds or empty-snap seeds → item returns on A.

### H3 — Own-echo skip at **state-doc** level is fine; peer never applies (medium)

If B is on `live sync (server)` (GAS poll) or Auth/listen failed, B may not see `assets/state` patches. A’s delete lives only on Firestore state; B’s next write (seed / touch) can fight it.

### H4 — Hold/recently-deleted expires, then lagging/wrong snap resurrects (medium)

Guards help only if `writeSeq` advanced and delete was actually committed. Failed flush + expired hold + remote still has UID → resurrection.

### H5 — Session-UI latch fights (side track)

v637–v638 fixed START/END banner flip. Unrelated to row delete, but same campaign fragility: many guards layered on a hot path.

---

## 5. Why prior “fixes” still feel fragile

| Era | What we fixed | What we left loose |
|-----|---------------|--------------------|
| v628–v632 | Listen / coalesce / partial hold | Still full-collection LWW |
| v633–v634 | Touch maps + writeSeq ideas | Non-txn per-doc race |
| v635 | State doc + txn patch | Seed-from-local + incomplete delete notes |
| v636–v638 | Hydrate empty UI; banner latch | Did not close H1/H2 delete holes |

Architecture direction is correct (industry agrees). **Operational holes** (delete note coverage, seed = full rewrite) make it fail in the director’s hands.

---

## 6. Trace map (for future agents)

| Concern | Canonical doc / code |
|---------|----------------------|
| Design lock (Sheets vs Firebase fork) | `docs/ai/archive/dal-firebase-design-lock-2026-07-13.md` |
| Never-do live sync | `docs/ai/FRAGILE_ZONES.md` §§ timeline + prep PA |
| Qty thrash Cases A–D | `docs/ai/archive/dal-pa-live-sync-thrash.md` + `scripts/dal-pa-live-sync-test.js` |
| **This delete/resurrect incident** | **This file** |
| Hardening backlog (H1–H6) + process | [dal-prep-live-sync-standards.md](dal-prep-live-sync-standards.md) |
| Live write | `02e7_Dal_Firestore_Client.html`, `host-boot.js` `PA_PATCH_WRITE` |
| Mutations | `02e2_Logic_CRUD.html` |

---

## 7. Fix pack (shipped)

1. **`removePa` + silent splices** note `dalPaNoteDelete_` / touch (`updateAssignedQty` minus, formula group DEL, consumable qty→0).  
2. **Seed-once** — `dalPaSeedStateFromLocal_` refuses when `dalPaLastDocWriteSeq_ > 0`; empty snaps no longer re-seed after authority.  
3. **Cases E–G** in `scripts/dal-pa-live-sync-test.js`.  
4. **Smoke (director):** two browsers, banner **live sync (patch)**; DEL on A → gone on B; B edits elsewhere → A’s delete stays gone.

## 8. Director smoke

Hard-refresh both on web.app. Banner must say **live sync (patch)**. Say OK if deletes stay synced.
