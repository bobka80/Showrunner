# Project Assets — multi-user warehouse concurrency

**Entry:** [AI_DOCTRINE.md](../../AI_DOCTRINE.md) · **Index:** [Project_TODO.md](../Project_TODO.md)  
**Related:** [logistics-warehouse.md](logistics-warehouse.md) · [warehouse-prep-session.md](warehouse-prep-session.md) · [MOBILE_CREW_UX.md](../MOBILE_CREW_UX.md) · [EQUIPMENT_MODEL.md](../EQUIPMENT_MODEL.md)

**Last swept:** 2026-06-28 · **Status:** Backlog — checkout ledger shared; list editing still single-editor semantics

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
- [x] Mobile compact PA (`01h_Mobile_Assets.html`) — limited surface; explicit SAVE today

## Known gaps (honest assessment)

- [ ] **No collision/version check** on `saveProjectAssetsDelta` (unlike `saveProjectData` `COLLISION_DETECTED`)
- [ ] **Sparse auto-save** on desktop — pack/unpack/add often local until SAVE or design→packing switch
- [ ] **Merge favors local** for matching `uid` rows — risky when two editors touch the same row
- [ ] **Checkout UI not live across clients** — ledger is shared; per-screen `scannedQty` can drift until resume/reload
- [ ] **Presence not wired to PA** — `reportProjectPresence` used for Timeline lock only
- [ ] **No pull while PA modal open** — list stale until save/reopen/sync
- [ ] **Finalize checkout** does not yet write `scan_status` / vault location (TODOs in `Operations.js`)

---

## Planned — mobile auto-save

**Decision:** On `body.mobile-pa-compact` only, **all** equipment mutations auto-save (debounced). Remove reliance on manual SAVE for floor crew.

- [ ] Re-enable / implement debounced `autoSaveAndExecute` on mobile PA mutations
- [ ] Collision handling on failed save (toast + refresh offer)
- [ ] Keep explicit SAVE optional or hidden on mobile after auto-save ships

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

## Planned — concurrency hardening (desktop + mobile)

**Phase 1 — stop silent data loss**
- [ ] `Last_Updated` or revision check on `saveProjectAssetsDelta`
- [ ] Debounced auto-save on pack/unpack/add/remove (mobile first; desktop TBD)
- [ ] Smarter merge: server wins on fields the client did not touch

**Phase 2 — awareness**
- [ ] PA presence: anonymous active count via `reportProjectPresence` + `activePresenceModule === 'assets'`
- [ ] Sub-mode in presence optional: design / packing / checkout (no names in UI)

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

**Floor / prep mode (multi-user at scale):** When **Start preparation** ships, PA + expanded ledger move to the Firebase fork — see [warehouse-prep-session.md](warehouse-prep-session.md). **Cache policies** flip to `session-live` backend — [data-cache-engine.md](data-cache-engine.md). This doc stays authoritative for **normal-day** Sheets concurrency until then.

---

## Alerts

Warehouse logistics alerts (transit, etc.): [notifications-catalog.md](notifications-catalog.md).
