# Deferred — return when operational

**Entry:** [AI_DOCTRINE.md](../../../AI_DOCTRINE.md) · **Index:** [Project_TODO.md](../Project_TODO.md)

**Status:** Backlog only — **do not start** until the director confirms core warehouse/station flows are operational on the floor. These items are documented so we can return without re-litigating decisions.

**Last captured:** 2026-07-11 (director session — gate checkout model, Chainway gun sleep, RFID allocation, **desktop gate PC power schedule**).

---

## How to use this drawer

| Rule | Meaning |
|------|---------|
| **Not urgent** | Nothing here blocks shipping the next milestone unless the director explicitly promotes an item |
| **Decisions preserved** | Agreed *approaches* and rejected *approaches* are both recorded |
| **Return trigger** | Director says operational + names an item (or section) → move checklist back to [active/rfid-station-profiles.md](../active/rfid-station-profiles.md) or [topics/logistics-warehouse.md](logistics-warehouse.md) |

---

## A. Chainway gun — sleep, disconnect, reconnect (field-unproven)

**Problem:** SDK `disconnect()` drops the **app driver** but phone **Bluetooth (HID) often stays up** — gun LED on, firmware may not sleep, trigger path unreliable when screen is off. Partial disconnect = “dead zone.”

| Item | Notes |
|------|--------|
| [ ] **No-host auto park policy** | Re-enabled build 53 / GAS v505: grace → `sleepGun()` → disconnect beep → SDK drop. **Needs field proof** on real tablets (1+1+1 min test math). |
| [ ] **Disconnect beep vs reconnect beep** | Short beep before SDK drop (`triggerBeep`); reconnect may beep again — operator training / docs. |
| [ ] **HID wake + reconnect when screen off** | Trigger → wake UI → reconnect ladder; **not reliable** in prior field tests — root cause may be partial BT state. |
| [ ] **Stay-connected vs park tradeoff** | v504 stayed connected (no dead zone, battery drain). v505 parks again — pick stable policy after field data. |
| [ ] **Firmware await-sleep after disconnect** | `setReaderAwaitSleepTime(1)` only applies **after** link drops; while connected gun stays awake. |
| [ ] **Manual park only?** | Alternative: no auto park; explicit “Park gun” + power off for battery. |
| [ ] **BLE reconnect ladder + foreground service** | Health check, zombie link, nuclear reset — partial in APK; Reconnect button + Doze still open. |
| [ ] **Gun connect/disconnect UI flash** | HID keyboard events can reload shell — see [FRAGILE_ZONES.md](../FRAGILE_ZONES.md) § PWA session bridge. |
| [ ] **Dial in hardware** | Power dBm, beep persist across reconnect, gun Bluetooth name from field. |

**Canonical active checklist when resumed:** [active/rfid-station-profiles.md](../active/rfid-station-profiles.md) § Field / polish, § Bulletproof BLE reconnect.

---

## B. Gate & checkout — agreed model, not built

**Agreed doctrine (2026-07-10):**

- **Soft allocation** in planning (qty / model, not which serial in which case).
- **Hard allocation at the door:** each **case RFID** and each **fixture RFID** that reads = that exact vault unit **left the warehouse** on this project/session.
- **Do not require** case ↔ fixture pairing — pre-packed warehouse; crew moves **stacks** of cases, not app “packing mode.”
- **Broken / Damaged:** must surface when a **unit tag** is read (vault `status` + `status_note`); we do **not** need to know which case holds it.

**Rejected (do not rebuild without director):**

- Stack entity + “probable location” on all cases in a pass (too complex).
- Inferring which two fixtures live in which case from simultaneous gate reads alone (underdetermined).
- Mandatory hard-bind of fixtures to cases in **project** packing UI.

| Item | Notes |
|------|--------|
| [ ] **Gate layout + driver** | `gate` profile in `11a_Station_Gun_Drivers.html` — planned PC+TV; continuous read; not started. |
| [ ] **Gate pass processor** | One pass event: collect EPC set → dedupe → checkout cases + units → single ledger commit. |
| [ ] **Hierarchy collapse** | Case tag + inner unit tags in same pass → checkout case once, absorb children (no double-count). |
| [ ] **Broken/Damaged on checkout path** | Station toasts today; **ops ledger** does not store `asset_status` / note on rows — add for gate/PDF. |
| [ ] **`finalizeEventOperation` completion** | TODOs: vault location updates, PDF protocol, `scan_status` — [project-assets-concurrency.md](project-assets-concurrency.md). |
| [ ] **Soft → hard write-back** | Ledger records scans; permanent bind of specific unit IDs into project/vault custody not finished. |
| [ ] **Gate vs gun roles** | Gate = bulk pass at door; gun = exception re-scan, locate marked fixture on truck. |
| [ ] **Inner tags through metal cases** | RF may read case only — policy: case checkout + optional unit count sanity check. |

**Reference:** [ENGINEERING_RULES.md](../ENGINEERING_RULES.md) §14 · [EQUIPMENT_MODEL.md](../EQUIPMENT_MODEL.md) · [topics/logistics-warehouse.md](logistics-warehouse.md) § Gate.

---

## C. Equipment & vault (optional later)

| Item | Notes |
|------|--------|
| [ ] **Physical cable case bind** | Auto-Pack knows cable groups; not **which** empty case RFID — scan in packing ([EQUIPMENT_MODEL.md](../EQUIPMENT_MODEL.md)). |
| [ ] **Vault `current_case_uid` (warehouse custody)** | Optional: bind “where unit lives” at put-away, not per show — helps find marked fixture without gate pairing. |
| [ ] **Locate mode on gun** | Sweep cases at truck to find serial X when custody unknown. |

---

## D. Crew RFID & station polish (when floor stable)

| Item | Notes |
|------|--------|
| [ ] **EPC + TID** | `rfid_tid` on `Crew_Roster`; enroll + login pair match; ROOT lock. |
| [ ] **Optimistic host login** | Local cache → instant host; server confirm parallel. |
| [ ] **Offline host recognition** | Cache badge; writes still need server. |
| [ ] **Kiosk auto-start** | Default launcher + `BOOT_COMPLETED`; battery optimization whitelist. |
| [ ] **Tag-map / new-equipment provisioning UX** on station. |
| [ ] **QR at gate** | Same primary key as RFID; deferred with gate hardware. |

---

## E. Multi-user & prep (platform — separate track)

Blocked on DAL / operational priority — listed here so RFID work does not absorb them:

- [ ] Warehouse prep session — [warehouse-prep-session.md](warehouse-prep-session.md)
- [ ] Project Assets concurrency + digests — [project-assets-concurrency.md](project-assets-concurrency.md)
- [ ] Handover protocols, pull sheets — [logistics-warehouse.md](logistics-warehouse.md)

---

## F. Desktop gate PC — power schedule (not built)

**Director spec (2026-07-11).** Native work in `station-desktop/` + one-time Windows image setup per gate PC. **Do not start** until promoted after station UI rework is stable.

**Open question:** Weekdays **10:00–18:00** — if nobody touches the PC all day, stay on (**A**, implied) vs hibernate after 2 h idle (**B**)? Director to confirm before build.

### Policy

| When | Behavior |
|------|----------|
| **Mon–Fri 09:50** | Auto **wake** (10 minutes before work start) + launch station app |
| **Mon–Fri 10:00–18:00** | **Work hours** — PC available for station use |
| **Mon–Fri after 18:00** | **Hibernate** after **2 hours** of keyboard/mouse/scan inactivity (not at 18:00 sharp) |
| **Sat–Sun (all day)** | No scheduled wake; **hibernate** after **2 hours** inactivity |
| **Any time** | **Keyboard/mouse wake** — BIOS + Windows “allow wake timers” / USB keyboard wake (PC setup, not app-only) |

Use **hibernate** (S4), not shutdown (S5). Local PC clock / timezone. Sleep TSL gun cleanly before hibernate (`SleepAndDisconnect`).

### Implementation checklist (when resumed)

| Item | Notes |
|------|--------|
| [ ] **Idle tracker** | `GetLastInputInfo` + reset on RFID/trigger activity |
| [ ] **Schedule engine** | Weekday vs weekend; after-18:00 gate on weekdays; 2 h idle threshold |
| [ ] **Hibernate action** | `SetSuspendState(hibernate: true)` or equivalent from WPF shell |
| [ ] **Weekday wake task** | Task Scheduler: Mon–Fri **09:50**, “Wake the computer to run this task”, start `ShowrunnerStationDesktop.exe` |
| [ ] **Re-arm wake** | Before each hibernate (Thu/Fri/Sun night), ensure next weekday 09:50 task exists |
| [ ] **Gate PC image checklist** | `powercfg /waketimers`, `wake_armed`, BIOS RTC wake, keyboard wake enabled |
| [ ] **Settings UI (optional)** | Show next wake / idle countdown in desktop station settings — later polish |
| [ ] **Holidays / overrides** | Not specified — manual keyboard wake only unless calendar added later |

**Related:** [GLOSSARY.md](../GLOSSARY.md) § Desktop station · [active/tsl-desktop-handoff.md](../active/tsl-desktop-handoff.md)

---

## Promotion checklist (director → AI)

When an item moves from deferred back to active:

1. Director names item + **OK go**.
2. Move bullets to the right **active** or **topic** file; trim duplicate here.
3. Update [Project_TODO.md](../Project_TODO.md) row status.
4. Implement on a feature branch; milestone when shipped.
