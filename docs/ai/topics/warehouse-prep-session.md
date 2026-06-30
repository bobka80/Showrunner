# Warehouse preparation session

**Entry:** [AI_DOCTRINE.md](../../AI_DOCTRINE.md) · **Index:** [Project_TODO.md](../Project_TODO.md)

**Platform:** [session-fork-platform.md](session-fork-platform.md) — fork router, Firebase buffer, commit pattern.

**Related:** [project-assets-concurrency.md](project-assets-concurrency.md) · [logistics-warehouse.md](logistics-warehouse.md) · [EQUIPMENT_MODEL.md](../EQUIPMENT_MODEL.md)

**Status:** Backlog

**Last swept:** 2026-06-30

---

## Director intent

- **“Start preparation”** ≠ start packing only — includes **design mode** (add departments / lines).
- While prep is active: **project-wide mode** — everyone sees **IN PREPARATION**; rules differ (like timeline lock, but **shared** busy mode, not one editor).
- **No casual exit** — crew cannot turn off prep; only manager **End preparation** after checkout/check-in commit.
- **Fork right:** Project Assets, expanded ledger, trucks, logistics hub actions route to **Firebase** — **no direct Sheets** for those slices until session closes.

---

## Expanded ledger (during prep)

Today `Operations_Ledger` is mostly checkout/check-in scans. During prep the ledger also records:

- [ ] Add asset to project list
- [ ] Pack / unpack / qty changes
- [ ] Checkout scans
- [ ] Truck placement (which truck, XYZ slot) — phased
- [ ] Check-in / recovery (symmetric session type later)

---

## Mode & UX

- [ ] Manager: **Start preparation** / **End preparation** (permission: manager+ TBD)
- [ ] Banner + lock styling on project editor, PA, logistics — `🔒 PREPARATION` / `IN PREPARATION`
- [ ] Opening project while prep active → auto-enter prep rules (no bypass to slow Sheets path)
- [ ] Roster: who is in prep room
- [ ] Activity feed: visible actions (who scanned, added, packed)
- [ ] FCM: prep started / ending / committed

---

## Fork coverage (coding level)

| Slice | During prep | Commit target |
|-------|-------------|---------------|
| Project Assets rows | Firebase | `Project_Assets` sheet |
| Operations ledger events | Firebase | `Operations_Ledger` |
| Checkout session state | Firebase | `Projects_Index` + ledger |
| Truck arrangement | Firebase (phased) | truck/load tables + PA refs |
| Logistics hub (auto-pack / arrange) | Firebase-backed UI (phased) | PA + containers per EQUIPMENT_MODEL |

**Not on fork:** timeline, global tasks, crew roster, vault master data, financials.

---

## Code touchpoints (planned)

- [ ] PA router — new module or `02e*` integration; mobile `01h` follows same router when prep active
- [ ] `02c_Project_Operations.html` — checkout during prep
- [ ] `05a_Truck_Arrangement.html` — truck placement on fork
- [ ] Logistics hub / auto-pack UI — **do not** merge `02e4` auto-pack with `02e5` auto-containerization
- [ ] `Operations.js` — session open snapshot, commit, finalize
- [ ] `Security.js` — who may start/end prep

---

## Phased delivery

### Phase A — Session shell + PA + ledger on fork
- [ ] Start/end prep API
- [ ] Snapshot PA + ledger → Firebase
- [ ] Design add, pack, checkout on fork
- [ ] Commit on **End preparation** (after checkout complete — director rule)

### Phase B — Check-in / recovery symmetry
- [ ] Session type `recovery` / check-in direction
- [ ] Same fork, reverse ledger semantics

### Phase C — Truck placement
- [ ] Manual XYZ / which-truck on fork
- [ ] Live sync for loaders + gate

### Phase D — Logistics hub fast path
- [ ] Replace slow project-editor logistics hub during prep
- [ ] Auto-arrange: batch on fork or GAS job writing results to Firebase (compute strategy TBD — Firebase does not speed GAS CPU)

---

## Supersedes (partial)

Floor-mode multi-user items in [project-assets-concurrency.md](project-assets-concurrency.md) move here when prep session ships. Keep concurrency doc for **normal-day** Sheets improvements (collision, mobile auto-save) until prep covers floor.

---

## Firebase read budget (prep-heavy day)

Assume 5–8 people, 150 PA rows, 500 scans — **stay lean** per [session-fork-platform.md](session-fork-platform.md). Heavy naive listeners can exceed Spark 50k reads/day.
