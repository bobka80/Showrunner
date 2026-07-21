# Project Assets — multi-user warehouse concurrency

**Entry:** [AI_DOCTRINE.md](../../../AI_DOCTRINE.md) · **Index:** [Project_TODO.md](../Project_TODO.md)  
**Related:** [logistics-warehouse.md](logistics-warehouse.md) · [warehouse-prep-session.md](warehouse-prep-session.md) · [MOBILE_CREW_UX.md](../MOBILE_CREW_UX.md) · [EQUIPMENT_MODEL.md](../EQUIPMENT_MODEL.md)

**Last swept:** 2026-07-19 · **Status:** Split — **prep multi-user live** is canonical on the fork campaign; this file = **normal-day Sheets** + checkout digest backlog

---

## Where multi-user truth lives (locked 2026-07-19)

| Mode | Canonical doc |
|------|----------------|
| **START PREP open** (Firebase PA fork, live patch, search/formula batch adds, pack, floor +/-) | [../archive/multi-user-fork-industrial-and-auto.md § Warehouse prep — real multi-user scope](../archive/multi-user-fork-industrial-and-auto.md) · [../archive/dal-prep-live-sync-standards.md](../archive/dal-prep-live-sync-standards.md) · FRAGILE prep PA |
| **Normal day** (no prep session — Sheets `saveProjectAssetsDelta`, mobile auto-save, collision gaps) | **This file** (below) |
| **Forks paused (2026-07-21)** — Sheets-only PA + timeline | [dal-live-forks-pause.md](dal-live-forks-pause.md) |

Do **not** treat the backlog below as the prep-floor sync model. Prep live rollback: GAS **v654** + `host-boot.js?v=653`. While [dal-live-forks-pause.md](dal-live-forks-pause.md) says paused, use **this file’s Sheets path** only.

---

## Director intent

Project Assets is the **hot zone** during load-out and recovery: many people on the **same project** at once — office adding gear, departments packing, others checking out. The list must stay trustworthy without constant full reloads (GAS round-trips are slow).

**Pause (checkout)** is **personal**, not global: it stops one operator from drifting out of checkout and leaving scans only on their screen. Leaving checkout (pause or exit) must **flush queued scans to the shared ledger**.

---

## Shipped today (foundation)

- [x] Per-row assignment `uid` + delta saves (`saveProjectAssetsDelta`, `calculatePaDeltas`)
- [x] Optimistic Healing merge after save (`02e5_Logic_Sync.html`) — documented in [ARCHITECTURE.md](../ARCHITECTURE.md) §1
- [x] Shared checkout session per project (`Operations.js` — `Active_Operation`, `Active_Session_UID`, ops ledger)
- [x] Multi-scanner checkout batch queue (~1.5s) + resume from ledger
- [x] Department **view** filters in packing (`packingDeptFilters`) — UI only, not server isolation
- [x] Mobile compact PA (`01h_Mobile_Assets.html`) — limited surface; **debounced auto-save** (explicit-save mode off since v368)
- [x] **Prep multi-user live** (START PREP) — Firebase `assets/state` + patch sync — see campaign (not this backlog)

## Known gaps — normal-day Sheets only (honest assessment)

These apply when prep is **not** open (or to checkout UI / digests). Prep live list sync is **not** “single-editor.”

- [ ] **No collision/version check** on `saveProjectAssetsDelta` (unlike `saveProjectData` `COLLISION_DETECTED`)
- [ ] **Sparse auto-save** on desktop outside prep — pack/unpack/add often local until SAVE
- [ ] **Merge favors local** on Sheets save for matching `uid` rows
- [ ] **Checkout UI not live across clients** — ledger is shared; per-screen `scannedQty` can drift until resume/reload
- [ ] **Presence not wired to PA** — `reportProjectPresence` used for Timeline lock only
- [ ] **Finalize checkout** does not yet write `scan_status` / vault location (TODOs in `Operations.js`)

---

## Mobile auto-save (shipped @ v368)

**Behavior:** On `body.mobile-pa-compact`, **all** equipment mutations auto-save (debounced) — no manual SAVE for floor crew. `isMobilePaExplicitSaveMode()` returns `false`.

- [x] Debounced `autoSaveAndExecute` on mobile PA mutations (v368)
- [x] Explicit SAVE hidden on mobile (explicit-save mode off)
- [ ] Collision handling on failed save (toast + refresh offer) — ties to the no-collision-check gap above

See [mobile-crew.md](mobile-crew.md) and [MOBILE_CREW_UX.md](../MOBILE_CREW_UX.md).

---

## Planned — activity digests (not live full refresh)

**Decision:** Do **not** poll full project assets on a short interval. Use **light summaries** + **batched notifications** (count threshold and/or timer — e.g. 5 items or 45–60s, whichever comes first).

**Audience:** Users in **packing** or **checkout** on that project only (not company-wide).

**Privacy:** Show **count of people active on project** (e.g. “4 working on this project”), not names on a shared banner.

**Examples:**
- “5 items added — Audio”
- “10 items checked out”
- “3 cases packed” (batch or case label TBD)

**Delivery:** In-app notification + optional short sound on mobile/station (user/platform may require first tap for audio).

- [ ] Backend: project activity revision counter + delta summary endpoint (not full list)
- [ ] Client: digest aggregator (timer + count rules) while PA open in pack/checkout
- [ ] Wire to `Notifications_Dispatch.js` / in-app rows for eligible users
- [ ] Checkout progress digest from ops ledger (cheap poll)

---

## Planned — concurrency hardening (desktop + mobile, normal-day)

**Phase 1 — stop silent data loss**
- [ ] `Last_Updated` or revision check on `saveProjectAssetsDelta`
- [ ] Debounced auto-save on pack/unpack/add/remove (mobile first; desktop TBD)
- [ ] Smarter merge: server wins on fields the client did not touch

**Phase 2 — awareness**
- [ ] PA presence: anonymous active count via `reportProjectPresence` + `activePresenceModule === 'assets'`
- [x] Sub-mode in presence (prep): design / packing / checkout|check-in — vault orange panel roster (names + mode)

**Phase 3 — checkout ↔ list**
- [ ] Poll or digest ledger counts across checkout screens
- [ ] Finalize → update assignment `scan_status` / readiness

---

## Phase order (recommended)

1. Mobile auto-save + collision reject  
2. Activity digest + light revision poll  
3. PA presence count  
4. Desktop auto-save + merge improvements  
5. Checkout/list status closure  

**Floor / prep mode:** Live multi-user list = [../archive/multi-user-fork-industrial-and-auto.md](../archive/multi-user-fork-industrial-and-auto.md) (archived). Prep session UX shell: [warehouse-prep-session.md](warehouse-prep-session.md). **NEXT structural:** [../active/logistics-ledger-2026-07-21.md](../active/logistics-ledger-2026-07-21.md).

---

## Related

- Equipment model / two packing engines: [EQUIPMENT_MODEL.md](../EQUIPMENT_MODEL.md)
- Warehouse RFID / gate: [logistics-warehouse.md](logistics-warehouse.md)
