# Active — RFID scanning & station device profiles

**Entry:** [AI_DOCTRINE.md](../../../AI_DOCTRINE.md) · **Canonical topic (vision + full backlog):** [../topics/logistics-warehouse.md](../topics/logistics-warehouse.md) · **Files:** [../FILE_MAP.md](../FILE_MAP.md) §8/§11

**Opened:** 2026-07-02 · **Production:** GAS **v418**

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
- [x] **Regression fix (build 6): trigger stopped reading after build 5.** Device-info reads (`getBattery`/`getSTM32Version`) shared the single read worker and hung it, starving every trigger read. Moved all config/device-info SDK calls to a dedicated `configWorker`; default power set to max (30 dBm).
- [x] **Continuous mode delivered no tags (build 7).** Diagnosed from the field: trigger showed "Scanning tags…" (= continuous branch) but no EPC — the SDK's hardware inventory callback (`startInventoryTag`/`IUHFInventoryCallback`) does **not** deliver on this R6, while single-tag reads do. Reimplemented continuous as a fast repeat of `performSingleRead()` (`continuousRunnable`, `CONTINUOUS_POLL_MS`=500ms) so **both** scan modes use the one reliable primitive. This also un-sticks a device left in continuous mode.
- [x] **Bridge/settings not taking effect → stale cached shell (v415).** The device ran an old cached `host-boot.js` because its cache-buster (`index.html` `?v=`) was never bumped when the relay + config handlers were added — so scans never reached the top strip and settings changes (scan mode) did nothing. Bumped `?v=323`→`?v=415`; hosting-only (no reinstall — reopen the app). Beeper checkbox now defaults ON.
- [x] **Boots in "machine-gun" though setup says Single → screen/gun desync (v416).** The gun's mode was remembered natively while the web setup showed its own default. Made the **web setup the source of truth** (device localStorage: `sm_station_scan_mode` / `sm_station_poll_ms` / `sm_station_power` / `sm_station_beep`); `stationSyncSettingsToGun_()` pushes stored settings to the gun on every shell boot, and `stationApplyGunConfig_` seeds localStorage from the gun only when unset. Remembers the last chosen mode with screen and gun in agreement.
- [x] **Continuous speed setting (v416).** Continuous ("machine-gun") repeat interval is now a slider (`station-set-speed`, 100–2000 ms) shown only in continuous mode; native `RfidManager.setPollMs` drives `continuousRunnable` (`pollMs`, was fixed 500 ms). Faster = shorter interval.
- [x] **Eject timer is now a dropdown (v416)** — 1 / 3 / 5 / 10 minutes (`STATION_EJECT_CHOICES`) instead of a free number field.
- [x] **No "normal phone" flash on cold start (v416).** The native app (UA `ShowrunnerStation`) now shows a station splash from first paint (`host-boot.js` `showStationSplash`), cleared when the station shell posts `SHOWRUNNER_STATION_READY` or a login screen appears (12 s safety timeout so it can never block login).
- [x] **Hold-to-scan trigger mode (v417/build 9).** Third scan mode `hold`: squeeze = read repeatedly while held, release = stop (`RfidManager` `onKeyDown` starts `startInventory`, `onKeyUp` stops it). Uses the same repeat-speed slider as continuous. Modes are now Single / Hold / Continuous.
- [x] **In-app dashboard flash → native kiosk splash gate (v417/build 9).** Root cause: on cold start the WebView briefly renders a **non-station (personal) view** before the station shell mounts/reloads, and the top-frame web splash was dropped by the transient login screen. Added a **native splash overlay** (`activity_station_web.xml` `station_splash`) that covers the WebView until the station shell truly mounts — `host-boot.js` relays `SHOWRUNNER_STATION_READY`→`AndroidStation.shellReady()` and login-needed→`loginNeeded()`; 30 s safety timeout. Note: if the device is signed into a **personal** account it still lands on the dashboard — the kiosk must be signed in as its **station-device** account for the station screen (meta `station-device=1`).
- [~] **Hold acts like toggle + settings only apply after reopen → web↔native bridge instrumentation (v418/build 10).** Deduction: if Hold were live the trigger would read *while held* and never stop on a second pull; seeing toggle behaviour means the **mode change never reached the gun** — same broken direction as scans not reaching the top strip. Confirmed with the director it is **not** a personal-account issue, so the shell/listener do mount. Changes this build:
  - **Direct native bridge (removes the flaky relay hop for settings).** Android injects `@JavascriptInterface` objects into every frame, so the station shell now calls `window.AndroidStation.setX()/getConfig()` **directly** when present (`stationNativeBridge_`/`stationApplyGunSetting_`), falling back to the `postMessage`→host-boot relay only if absent. This makes settings **apply live** on each change (Done is close-only, as it already was).
  - **On-screen breadcrumb overlay** (`#station-debug`, `stationDebug_`) logs every hop on the device: `shell init`, `station=<bool> native=<bool>` badge, `set <key> →native/→relay`, `scan IN`, `relay scan`. Tap to hide.
  - **Native confirmations**: `RfidManager` setters `postStatus("Gun set: …")` so the status bar proves a web→gun call reached the SDK; **trigger breadcrumbs** `Trigger DOWN/UP [mode]` — if `onKeyUp` never fires on the R6, that's why Hold can't stop on release (the decisive datum still pending from the field).
  - **Note (SDK question answered):** gun radio settings (power/mode/speed/beeper) are impossible to change from the web without the native SDK layer; only the **eject timer** is pure web. So "changed in menu" ≠ "changed on gun" unless the bridge is live.
- [ ] **Read the build-10 breadcrumbs on hardware** — confirm `native=true` (direct bridge works), whether `Trigger UP` fires (hold feasibility), and where a scan trail stops if the strip stays empty.
- [ ] **Dial in the real values on hardware** — confirm a power dBm that reads a badge at the gun but not shelf tags; confirm `setBeep`/`setPower` persist across reconnect on the actual R6.
- [ ] **Reminder:** whenever `host-boot.js` changes, bump the `?v=` in `push-hosting/public/index.html` (WebViews hard-cache it).
- [ ] **Verify the full loop on real hardware** — gun trigger → EPC → top strip → host/enroll → ledger, on an actual station tablet
- [ ] **Remove the DEV bypass** `stationDevHostAsBogdan` (+ its button) once badge host is verified on hardware
- [ ] **Crew `rfid_tag` admin UI** (deferred — sheet paste until station SDK host flow is proven)
- [ ] **Tag-map / new-equipment RFID provisioning UX** on the station
- [ ] **Gate-at-door** bulk read + exception re-scan path (hardware TBD)

## When this closes

Move this file to [../archive/](../archive/) and update the **Active campaigns** row in [../Project_TODO.md](../Project_TODO.md). Remaining long-horizon items (gate, fleet payload, pull sheets) stay in [../topics/logistics-warehouse.md](../topics/logistics-warehouse.md).
