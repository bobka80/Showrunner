# Logistics, warehouse & operations

**Entry:** [AI_DOCTRINE.md](../../../AI_DOCTRINE.md) · **Index:** [Project_TODO.md](../Project_TODO.md)

**Last swept:** 2026-07-07 · **Production:** GAS **v465** · **Status:** Partial — station shell through **v437+**; APK **v0.1.15**. Open: EPC+TID crew badges, optimistic host login, BLE reconnect hardening, kiosk auto-start, gate — see [active campaign](../active/rfid-station-profiles.md).

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

**Crew RFID:** Same UHF tag family as equipment. Store **EPC** on `Crew_Roster.rfid_tag` today; **approved:** add `rfid_tid` (factory TID) — enroll + login require **both** from one gun read for anti-clone (ROOT first). Gun reads tag → lookup crew → host session. Details → [active campaign](../active/rfid-station-profiles.md) § Agreed spec — Security.

**Gate (warehouse door):** The gate is the **building exit**, not a truck portal. Crew push cases through the door; ramp/truck loading is **outside**. Gate validates what left the warehouse. Misses are fixed with a **handheld re-scan** at the door (simple exception path). **Approved (2026-07-07):** gate = **its own station device** (separate from warehouse Chainway guns); near-term hardware = **PC + TV** with rich on-screen UI; strict **one station profile per physical device** fleet-wide.

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

**Capabilities (when hosted):** RFID operations — check-in/out, pack, tag gear (tier-gated), maintenance/broken/repair. **Full project asset editing** when the **host's crew credentials** allow it (same as phone/desktop) — station is a surface, not a stripped-down role. **Agreed model (2026-07-03, built v425–426):** checkout + design/packing follow **host IAM**; **any host** gets equipment **status** baseline in Vault; equipment RFID = MANAGER+; crew RFID = ROOT via Vault Crew tab. Details → [active campaign](../active/rfid-station-profiles.md).

**Host nesting (state machine):**

| State | Accepts | Rejects |
|-------|---------|---------|
| **Empty (no host)** | Scans that match a **legitimate crew** RFID (host login) | All equipment/operation scans |
| **Hosted (host locked)** | Equipment and operation scans | Further host scans until logout |

This removes “scan hygiene” (accidental badge wave during checkout): empty station ignores gear; hosted station ignores host tags.

**Session UX:**
- [x] **Host idle auto-eject** (shipped v411). Resets on touch/tap/key/RFID scan; ejects the **host only** (device stays logged in, no device passcode re-entry). **Timeout is a device-local dropdown — 1 / 3 / 5 / 10 min (default 10)** in the setup view — `stationEjectMinutes_()` / localStorage `sm_station_eject_min` in `11_Station_Shell.html`.
- [x] **Gun trigger = single read** by default; **scan mode selectable** — Single / Continuous — in the setup view; Continuous **repeat speed** is a slider (100–2000 ms). (Hold-to-scan dropped: the R6 sends no key-up on release.)
- [x] **Reliable scans via direct native poll (v419):** `evaluateJavascript` only reaches the top frame, so the iframe relay was lossy. Reads are queued natively (`pendingScans`) and pulled by the shell via `AndroidStation.pollScans()` every 300 ms; relay kept as deduped fallback. This is the real fix for "reads show in the native bar but never on the top strip."
- [x] **Scan-bridge fix (v414):** Showrunner runs in an **iframe** on the hosting shell — native scan delivery relays via `showrunnerStationDeliverScan` (host-boot.js) → `postMessage SHOWRUNNER_RFID_SCAN`. **Superseded as primary by v419 poll** — see [FRAGILE_ZONES.md](../FRAGILE_ZONES.md) § Station RFID delivery.
- [x] **Station setup view (⚙ on the "CHAINWAY HANDHELD" pill):** device-local, anyone can change — read **power/sensitivity** (`setPower` 5–30 dBm, shrinks radius), **scan mode**, **continuous/hold speed** (`setPollMs`), **beeper on/off** (`setBeep`), **eject timer**, + read-only battery/firmware. The **web setup is the source of truth** (localStorage `sm_station_*`) and pushes to the gun on every boot. Settings **apply live** on change via the **direct `AndroidStation` bridge** (Android injects the JS interface into the iframe; falls back to the `SHOWRUNNER_STATION_CONFIG_SET` relay if absent) — Done just closes the panel. Only the eject timer is pure-web; all gun/radio settings require this native layer. Diagnostic breadcrumb overlay + native `Gun set:`/`Trigger DOWN/UP` status echoes added (v418) to trace the pipeline on-device.
- [x] **No personal-phone flash on native cold start (v416/v417):** the native app shows a kiosk splash (`station_splash`) over the WebView until the station shell posts `SHOWRUNNER_STATION_READY` (relayed to `AndroidStation.shellReady()`); reveals early if a login screen is needed. The kiosk must be signed into its **station-device** account or it lands on the personal dashboard.
- Large **Log out** control at bottom of station screen
- Ledger actor = hosted user; device identity = station profile

### Software — station shell (mostly shipped; see active campaign for open items)

- [x] Dedicated scan home / kiosk shell (`11_Station_Shell.html` — host badge first)
- [x] Crew `rfid_tag` on `Crew_Roster` (sheet column; paste from Chainway scan — no interim UI)
- [x] **Live RFID scan strip** — station shell shows every incoming EPC at the top in any state (debug/visibility; `STATION_SCAN_FEED_MAX`=8). **v420+: resolves each tag to equipment name + unit** (not the raw EPC; raw + "Unknown tag" fallback), multi-tag per pull, via a preloaded map (`getStationEquipmentRfidMap` → localStorage `sm_station_equip_map_v1`, refreshed every 5 min).
- [x] **Station main-screen redesign (Pass A, v420):** header = **device profile — host (green)** ("Warehouse station" removed); **read-power/sensitivity slider on the main screen** (synced with setup); **PROJECT / VAULT long buttons** replace the middle lane tiles. **PROJECT reuses the phone's compact PA** (project picker via `getRefreshPayload` → `openMobileProjectAssets`; shell hides while PA is open, restores on close).
- [x] **Station Vault (Pass B, v421):** `#station-vault` overlay — search + slim list (`getStationVaultList`), **status Maintenance/Broken/Repaired for anyone hosted** (`setStationAssetStatus`; Broken added, Repaired→Active-but-logged), **manager-gated RFID recording** (`recordStationAssetRfid`, collision-guarded, audited) with **cascade tagging** (logical parent → its unique children, one scan each). Live strip refreshes after a tag write. **Fragility:** the manager check trusts the client-passed host name (lightweight inherit session, not a token) — harden later.
- [x] **Screen cleanup + crew names on strip (v421):** removed the big center host name, bottom "Last scan" line, and the `#station-debug` overlay; the **live strip resolves crew badges to the person's name** (`getStationEquipmentRfidMap` now includes `Crew_Roster.rfid_tag`, `kind:'crew'`).
- [x] **Project open fix + Vault line restyle (v422):** fixed PROJECT not opening on the station (pre-seed the picked project + hidden fields before `openMobileProjectAssets`). **Vault lines now match the real Equipment Vault row style** (name/unit/status pill, `06b1` look) instead of bespoke cards; **tap a line → action sheet** (status for anyone hosted; manager Record-RFID with cascade).
- [x] **"Logical parent" rollup + host-scoped projects (v423):** station Vault now **collapses identical unique units** (`name|manufacturer|length`, Bulk standalone) under a **▶ folder that expands to the units** — the real vault's rollup mechanic (`06b1` `renderAssetRegistry`), not `container_type`. Folder → Record cascades through the group's **untagged** units; folder status applies to all units. **PROJECT** now fetches `getRefreshPayload(host.name)` (host-scoped, not the device account) and **preloads on badge-in**, so it opens instantly instead of hanging on "Loading projects…".
- [x] **Vault → Crew tab (v425)** — supersedes interim self-serve "Link my RFID badge" enrollment (removed).
- [x] **Host-inherit RBAC (v425–427)** — PA/checkout/design/packing follow **host** credentials + `assetOpsActor()` (v426); Vault Crew tab; eject resets scan strip; boot hardening. Agreed 2026-07-03 — [rfid-station-profiles.md](../active/rfid-station-profiles.md).
- [ ] Crew `rfid_tag` in office admin UI — superseded on station by Vault Crew tab; office path TBD
- [x] **Station profile editor** — `06h_Admin_Station_Profiles.html` + `Station_Security.js` (separate from office `06a` / `Security.js`)
- [x] Host-empty scan API (`processStationRfidScan` — crew badge → host session)
- [x] **Host idle auto-eject** (dropdown 1/3/5/10 min, default 10 — v411, timer configurable v414, dropdown v416)
- [x] **Native gun app** (`station-android/` — Chainway BLE `RfidManager.kt` + WebView `StationWebActivity.kt`)
- [x] **APK distribution via web app** — login link "Warehouse gun — install station app" → `/station-app` install page. Build: `node build-station-apk.js` → `node deploy-hosting.js`. APK served as `.bin` (Spark blocks `.apk`). Details → [FILE_MAP.md](../FILE_MAP.md) §8 / §11.
- [ ] Gate integration (bulk door read — hardware TBD) — **separate station profile**; PC+TV surface
- [ ] Tag-map / new-equipment RFID provisioning UX on station
- [x] Remove `stationDevHostAsBogdan` DEV bypass + button (v432 — badge host verified on hardware)

### Approved backlog (director 2026-07-07) — canonical checklist in [active campaign](../active/rfid-station-profiles.md)

- [ ] **Crew EPC + TID** — `rfid_tid` column; enroll/login pair match; re-enroll existing badges; ROOT tag lock
- [ ] **Optimistic host login** — local cache → instant host; server confirm in parallel; offline banner when DB down
- [ ] **Bulletproof BLE reconnect (APK)** — health check, hard reconnect ladder, foreground service, fix Reconnect button
- [ ] **Kiosk auto-start (APK)** — default launcher + boot receiver; no Google account required on phone
- [ ] **Device hygiene** — one station profile per gun/phone/gate/TL device; TL SDK when hardware arrives

**IAM split:** Office crew permissions → **ROLE EDITOR** (`06a`). Fixed gun/tablet logins → **STATION PROFILES** (`06h`). Tamper each independently.

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
