# Active — RFID scanning & station device profiles

**Entry:** [AI_DOCTRINE.md](../../../AI_DOCTRINE.md) · **Canonical topic (vision + full backlog):** [../topics/logistics-warehouse.md](../topics/logistics-warehouse.md) · **Files:** [../FILE_MAP.md](../FILE_MAP.md) §8/§11

**Opened:** 2026-07-02 · **Production:** GAS **v413**

This is the work **in flight right now**: RFID gun scanning end-to-end and the fixed warehouse tablet/gun **device profiles** (station RBAC). This file tracks only the live campaign — the durable model, state machine, and long backlog live in the canonical topic above (do not duplicate here).

---

## Goal

A warehouse tablet/phone **married to a Chainway UHF gun** boots the station shell, a crew **badge scan** hosts a session, and equipment scans run check-in/out — no personal login, no plug/unplug.

## Shipped (this campaign)

- [x] **Station profile editor** — `06h_Admin_Station_Profiles.html` + `Station_Security.js` (separate from office Role Editor `06a`)
- [x] **Station shell** — `11_Station_Shell.html`; host-empty state machine, `window.onStationRfidScan` hook
- [x] **Host-empty scan API** — `processStationRfidScan` (crew badge → host session)
- [x] **Host idle auto-eject** — 10 min, `STATION_HOST_IDLE_MS`; resets on touch/scan; ejects host only, device stays logged in (v411)
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
- [ ] **Verify the full loop on real hardware** — gun trigger → EPC → shell scan → ledger, on an actual station tablet
- [ ] **Remove the DEV bypass** `stationDevHostAsBogdan` (+ its button) once badge host is verified on hardware
- [ ] **Crew `rfid_tag` admin UI** (deferred — sheet paste until station SDK host flow is proven)
- [ ] **Tag-map / new-equipment RFID provisioning UX** on the station
- [ ] **Gate-at-door** bulk read + exception re-scan path (hardware TBD)

## When this closes

Move this file to [../archive/](../archive/) and update the **Active campaigns** row in [../Project_TODO.md](../Project_TODO.md). Remaining long-horizon items (gate, fleet payload, pull sheets) stay in [../topics/logistics-warehouse.md](../topics/logistics-warehouse.md).
