# Logistics, warehouse & operations

**Entry:** [AI_DOCTRINE.md](../../AI_DOCTRINE.md) · **Index:** [Project_TODO.md](../Project_TODO.md)

**Last swept:** 2026-06-28 · **Status:** Partial — RFID checkout bar + backend ops shipped; gate + station profile + PA concurrency backlog planned

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

## Warehouse RFID & scan operations (vision)

**Hardware decision:** TSL + Chainway UHF guns, each **married to a dedicated tablet/phone** (fixed station — not personal BYOD plug/unplug).

**Crew RFID:** Same UHF tag family as equipment. Store tag on **crew record** (`rfid_tag` or equivalent field — schema TBD). Gun reads tag → lookup crew first → login/host. No separate HF/NFC badge requirement unless hardware forces it later.

**Gate (warehouse door):** The gate is the **building exit**, not a truck portal. Crew push cases through the door; ramp/truck loading is **outside**. Gate validates what left the warehouse. Misses are fixed with a **handheld re-scan** at the door (simple exception path).

**Handheld gun roles (not only checkout):**
- Exception re-scan at door when gate count mismatches
- Find unique assets inside containers
- Packing floor operations
- Tag new purchases (create/record RFID in vault)
- Check-in / check-out operations
- Empty cases for cable packing
- Maintenance, repair, mark broken / prophylaxis

Portable guns on personal phones are **not** the primary model.

### Device profile: warehouse gun tablet (example name: `TL Solutions warehouse gun`)

A **device RBAC profile** for tablets locked to RFID guns — **not** a crew “freelancer” type.

**Capabilities (when hosted):** RFID operations only — check-in/out, pack, tag new gear, empty cable cases, maintenance/broken/repair flows. **No** full project design or office tooling.

**Host nesting (state machine):**

| State | Accepts | Rejects |
|-------|---------|---------|
| **Empty (no host)** | Scans that match a **legitimate crew** RFID (host login) | All equipment/operation scans |
| **Hosted (host locked)** | Equipment and operation scans | Further host scans until logout |

This removes “scan hygiene” (accidental badge wave during checkout): empty station ignores gear; hosted station ignores host tags.

**Session UX:**
- Host idle timeout ~5 minutes after last action (TBD)
- Large **Log out** control at bottom of station screen
- Ledger actor = hosted user; device identity = station profile

### Software — not yet built

- [ ] Dedicated scan home / kiosk shell (today: project asset bar only)
- [ ] Crew `rfid_tag` field + admin record path
- [ ] Device profile `TL Solutions warehouse gun` in RBAC
- [ ] Host-empty / host-locked scan router (crew lookup before vault lookup)
- [ ] Gate integration (bulk door read — hardware TBD)
- [ ] Tag-map / new-equipment RFID provisioning UX on station

### Phase order (remaining)

- [ ] **A:** Gun output standard + station scan shell + host state machine
- [ ] **B:** Warehouse gun device profile + crew RFID field
- [ ] **C:** Gate-at-door workflow + exception gun path
- [ ] **D:** Project Assets concurrency + digests — [project-assets-concurrency.md](project-assets-concurrency.md)
- [ ] **E:** Tablet pull sheets + truck payload from scanner

## Multi-user Project Assets

Concurrent packing, checkout, and office adds: [project-assets-concurrency.md](project-assets-concurrency.md).

**Preparation session (fork):** Manager **Start preparation** routes PA, expanded ledger, trucks, and logistics hub to Firebase — no direct Sheets for those slices until **End preparation**. See [warehouse-prep-session.md](warehouse-prep-session.md) · platform [session-fork-platform.md](session-fork-platform.md).

**Bulk cables & physical case bind:** Auto-Pack groups cables by CBL tag; only gap is packing-mode scan of **which** level-3 cable case holds the trunk — [EQUIPMENT_MODEL.md](../EQUIPMENT_MODEL.md).

## Fleet & load planning

- [ ] **Fleet payload assignment** — sealed cases → truck timeline payloads from scanner
- [ ] **Truck arrangement brain** — load planner algorithm

## Alerts

Missing transit legs and other logistics alerts: [notifications-catalog.md](notifications-catalog.md) → **Managers → Logistics / warehouse**.
