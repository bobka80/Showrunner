# Logistics, warehouse & operations

**Entry:** [AI_DOCTRINE.md](../../AI_DOCTRINE.md) · **Index:** [Project_TODO.md](../Project_TODO.md)

**Last swept:** 2026-06-28 · **Status:** Partial — RFID checkout bar + backend ops shipped; kiosk/handover/truck brain pending

---

## Shipped (foundation)

- [x] **`rfidTag` on Vault assets** — admin form, tracker column, save path (`Resources_Vault.js`, `06b_*`)
- [x] **Backend ops** — `startEventOperation`, `processRfidScan`, ledger (`Operations.js`)
- [x] **Project checkout/check-in bar** — scan input, resume session, `scannedQty` on assets (`02c_Project_Operations.html`)
- [x] **Manual scan fallback** — match by RFID, unit #, name before server lookup
- [x] **Auto-Packing (bulk cables)** — `autoProvisionCableCases` in `02e4` (separate from RFID checkout)
- [x] **Distance from warehouse** — OSRM km in project editor map (`calculateDistanceAndZone`) — not full transport quoting engine

## Handover & warehouse sheets

- [ ] **Handover protocols** — delivery lists with signature lines; subrent vendor isolation
- [ ] **Warehouse pull sheets** — tablet-optimized cases/barcodes/weights views

## Warehouse RFID & scan operations (full vision)

**Decision:** TSL + Chainway UHF guns, shared devices, personal staff badges.

### Hardware (process / docs)
- [ ] Standardize both gun brands (plain EPC + Enter)
- [ ] Document pairing per device type
- [ ] Staff badges: HF/NFC separate from case UHF tags

### Software — not yet the full scan home
- [ ] Dedicated scan home modes (Check Out / Check In / Tag-Map landing)
- [ ] Full-screen invisible capture shell (today: project asset bar only)
- [ ] Unknown-tag vs job-list validation UX polish
- [ ] Kiosk shell + badge operator session (`currentOperator`)
- [ ] Badge-out / timeout / switch operator

### Phase order (remaining)
- [ ] **A:** Gun output standard + dedicated scan shell
- [ ] **B:** Checkout wired tightly to output list UX
- [ ] **C:** Kiosk + staff badge session
- [ ] **D:** Tablet pull sheets + truck payload from scanner

## Fleet & load planning

- [ ] **Fleet payload assignment** — sealed cases → truck timeline payloads from scanner
- [ ] **Truck arrangement brain** — load planner algorithm

## Alerts

- [ ] **Missing transit legs alert** — on save + FCM when live ([notifications.md](notifications.md))
