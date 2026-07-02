# Active — RFID scanning & station device profiles

**Entry:** [AI_DOCTRINE.md](../../../AI_DOCTRINE.md) · **Canonical topic (vision + full backlog):** [../topics/logistics-warehouse.md](../topics/logistics-warehouse.md) · **Files:** [../FILE_MAP.md](../FILE_MAP.md) §8/§11

**Opened:** 2026-07-02 · **Production:** GAS **v414**

This is the work **in flight right now**: RFID gun scanning end-to-end and the fixed warehouse tablet/gun **device profiles** (station RBAC). This file tracks only the live campaign — the durable model, state machine, and long backlog live in the canonical topic above (do not duplicate here).

---

## Goal

A warehouse tablet/phone **married to a Chainway UHF gun** boots the station shell, a crew **badge scan** hosts a session, and equipment scans run check-in/out — no personal login, no plug/unplug.

## Shipped (this campaign)

- [x] **Station profile editor** — `06h_Admin_Station_Profiles.html` + `Station_Security.js` (separate from office Role Editor `06a`)
- [x] **Station shell** — `11_Station_Shell.html`; host-empty state machine, `window.onStationRfidScan` hook
- [x] **Host-empty scan API** — `processStationRfidScan` (crew badge → host session)
- [x] **Host idle auto-eject** — resets on touch/scan; ejects host only, device stays logged in (v411). Timeout is now **device-configurable** (1–120 min) in the setup view; default 10 min (`stationEjectMinutes_`, localStorage `sm_station_eject_min`).
- [x] **Crew `rfid_tag`** on `Crew_Roster` (sheet-paste from Chainway scan; no interim admin UI)
- [x] **Live scan strip** — station shell shows every incoming EPC at the top in any state (`stationPushScanFeed_`, keeps last `STATION_SCAN_FEED_MAX`=8)
- [x] **Self-serve badge enrollment** — while hosted (root/DEV login), "Link my RFID badge" captures the next scan → `enrollStationCrewRfidTag` writes it to the host's `Crew_Roster.rfid_tag` (collision-guarded); scanning it afterwards hosts via `processStationRfidScan`
- [x] **Native gun app** — `station-android/` (Chainway BLE `RfidManager.kt` + WebView `StationWebActivity.kt`, EU 865–868 MHz)
- [x] **APK distribution via web app** — login link → `/station-app` install page; build `node build-station-apk.js` → `node deploy-hosting.js`; served as `.bin` (Spark blocks `.apk`)
- [x] **App launcher icon** — vector adaptive icon: Stage Masters red "A" + RFID broadcast waves on dark gradient (`station-android/app/src/main/res/…/ic_launcher*`)
- [x] **App versioning + changelog** — `build-station-apk.js` auto-bumps `versionCode`/`versionName`, requires release notes, records build timestamp + history; `/station-app` page shows version, upload time, "What's fixed", and previous builds. Doctrine Rule 6 + [station-android README](../../../station-android/README.md).

## In progress / next

- [x] **Field bug — WebView stuck on PWA "add to home screen":** hosting shell now treats the native app (UA `ShowrunnerStation`) as standalone and skips the install nag (`host-boot.js` `isNativeStationApp()`). Needs `node deploy-hosting.js`.
- [x] **Field bug — "Gun not found" though paired in Android:** `RfidManager` now connects to the bonded gun by MAC first and no longer drops scan hits with a null name. Needs APK rebuild.
- [ ] **Gun name still unrecognised (build 3):** first fix guessed the BT name `Nordic_UART_CW`; broadened hints (Nordic/UART/Chainway/R6/RFID/UHF/CW) + single-paired-device fallback + on-screen paired-device names for diagnosis (v0.1.1 build 3). **Waiting on the gun's real Bluetooth name from the field** to lock the match.
- [x] **Login crash — `debugLog is not defined`** in `authenticateUser` (surfaced as "Database Read Timeout after 5 attempts"): declared `debugLog` (GAS v412).
- [x] **Trigger = single read** (station mode): one pull = one tag, no continuous "machine-gun" inventory. `performSingleRead()`; scan mode is now user-selectable (see below). Native status bar echoes `Read: <EPC>`.
- [x] **Scan-bridge fix (root cause of "reads don't reach the software")** — Showrunner runs inside an **iframe** on the hosting shell, so `evaluateJavascript("onStationRfidScan…")` was hitting the wrong frame. Native now calls `showrunnerStationDeliverScan` (host-boot.js), which `postMessage`s `SHOWRUNNER_RFID_SCAN` into the iframe; the station shell listens and dispatches. Falls back to a direct call when pointed straight at GAS.
- [x] **Station setup view** — the header "CHAINWAY HANDHELD" pill is now a **⚙ setup button** opening a device-local settings screen (anyone at the device can change): **read power/sensitivity** (`setPower`, 5–30 dBm — shrinks the read radius), **scan mode** (single/continuous), **gun beeper on/off** (`setBeep`), **configurable host-eject timer** (1–120 min, replaces the fixed 10 min), plus read-only battery/firmware.
- [x] **Web→native settings bridge** — `AndroidStation` `@JavascriptInterface` (`getConfig`/`setPower`/`setScanMode`/`setBeep`); web posts `SHOWRUNNER_STATION_CONFIG_GET/SET`, host-boot relays to the gun and echoes `SHOWRUNNER_STATION_CONFIG` back. Settings persist in Android prefs and reapply on reconnect.
- [ ] **Dial in the real values on hardware** — confirm a power dBm that reads a badge at the gun but not shelf tags; confirm `setBeep`/`setPower` persist across reconnect on the actual R6.
- [ ] **Verify the full loop on real hardware** — gun trigger → EPC → top strip → host/enroll → ledger, on an actual station tablet
- [ ] **Remove the DEV bypass** `stationDevHostAsBogdan` (+ its button) once badge host is verified on hardware
- [ ] **Crew `rfid_tag` admin UI** (deferred — sheet paste until station SDK host flow is proven)
- [ ] **Tag-map / new-equipment RFID provisioning UX** on the station
- [ ] **Gate-at-door** bulk read + exception re-scan path (hardware TBD)

## When this closes

Move this file to [../archive/](../archive/) and update the **Active campaigns** row in [../Project_TODO.md](../Project_TODO.md). Remaining long-horizon items (gate, fleet payload, pull sheets) stay in [../topics/logistics-warehouse.md](../topics/logistics-warehouse.md).
