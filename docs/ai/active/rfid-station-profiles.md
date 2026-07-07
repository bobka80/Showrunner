# Active — RFID scanning & station device profiles

**Entry:** [AI_DOCTRINE.md](../../../AI_DOCTRINE.md) · **Canonical topic (vision + full backlog):** [../topics/logistics-warehouse.md](../topics/logistics-warehouse.md) · **Files:** [../FILE_MAP.md](../FILE_MAP.md) §8/§11 · **Fragile bridge rules:** [../FRAGILE_ZONES.md](../FRAGILE_ZONES.md) § Two-layer shell bridge

**Opened:** 2026-07-02 · **Production:** GAS **v472** · APK **v0.1.16 (build 18)** · **Last swept:** 2026-07-07

**Phone QR scan** — **closed** (colleague verified 2026-07-07). Shipped reference → [../topics/mobile-crew.md](../topics/mobile-crew.md) § Phone QR scan.

This campaign is **RFID gun + station device profiles** only: warehouse tablet/phone married to Chainway UHF gun, host badge sessions, vault/project on station.

> **`host-boot.js` is shared** between station RFID relay and phone QR shell camera. Before editing either path, read [FRAGILE_ZONES.md](../FRAGILE_ZONES.md) § Two-layer shell bridge — do not “fix” one bridge by breaking the other.

---

## Goal (station RFID)

A warehouse tablet/phone **married to a Chainway UHF gun** boots the station shell, a crew **badge scan** hosts a session, and equipment scans run check-in/out — no personal login, no plug/unplug.

## Shipped (this campaign)

- [x] **Station profile editor** — `06h_Admin_Station_Profiles.html` + `Station_Security.js` (separate from office Role Editor `06a`)
- [x] **Station shell** — `11_Station_Shell.html`; host-empty state machine, `window.onStationRfidScan` hook
- [x] **Host-empty scan API** — `processStationRfidScan` (crew badge → host session)
- [x] **Host idle auto-eject** — resets on touch/scan; ejects host only, device stays logged in (v411). Timeout is now **device-configurable** (1–120 min) in the setup view; default 10 min (`stationEjectMinutes_`, localStorage `sm_station_eject_min`).
- [x] **Crew `rfid_tag`** on `Crew_Roster` (sheet-paste from Chainway scan; no interim admin UI)
- [x] **Live scan strip** — station shell shows every incoming EPC at the top in any state (`stationPushScanFeed_`, keeps last `STATION_SCAN_FEED_MAX`=8)
- [x] **Vault → Crew tab (v425)** — ROOT-only crew badge provisioning via **Vault → Equipment | Crew**; supersedes interim self-serve "Link my RFID badge" (removed v425).
- [x] **Native gun app** — `station-android/` (Chainway BLE `RfidManager.kt` + WebView `StationWebActivity.kt`, EU 865–868 MHz)
- [x] **APK distribution via web app** — login link → `/station-app` install page; build `node build-station-apk.js` → `node deploy-hosting.js`; served as `.bin` (Spark blocks `.apk`)
- [x] **App launcher icon** — vector adaptive icon: Stage Masters red "A" + RFID broadcast waves on dark gradient (`station-android/app/src/main/res/…/ic_launcher*`)
- [x] **App versioning + changelog** — `build-station-apk.js` auto-bumps `versionCode`/`versionName`, requires release notes, records build timestamp + history; `/station-app` page shows version, upload time, "What's fixed", and previous builds. Doctrine Rule 6 + [station-android README](../../../station-android/README.md).

- [x] **SECURITY — login error leaked passcodes (v429):** `authenticateUser` had a leftover debug diagnostic that echoed the input, the crew headers, and stored **names + passcodes** (e.g. `bogdan / 66ab26`) into the failed-login error shown on the lock screen. Removed the `debugLog` capture entirely; failed logins now return only `"Incorrect crew name or passcode."` — no roster, headers, input, or passcodes ever go to the client. **Rotate any passcode that was visible on-screen.**
- [x] **Duplicate-tag guard with overwrite/cancel (v428)** — recording an equipment tag (`recordStationAssetRfid`) or crew badge (`enrollStationCrewRfidTag`) now checks the scanned tag against the **whole database** — every asset **and** every crew badge — via `findStationRfidOwner_`. If the tag already belongs to a different record, the backend returns `{ duplicate:{ kind, id, name } }` instead of writing; the station record bar shows **"Tag already on X — Overwrite / Cancel"**. Overwrite re-issues the write with `force=true`, which blanks the previous owner's tag (`clearStationRfidOwner_`) before assigning — so a tag is only ever on one thing. Audit log records the steal.
- [x] **Screen sleep + wake-on-trigger (APK v0.1.10, build 12):** tablet **may sleep** (screen off) on normal system timeout — app + BLE gun stay alive in background. **Gun trigger wakes** via SDK `KeyEventCallback` only (no keyboard/power button): **first pull wakes** ("Screen on — pull again to scan"), **next pull scans**. `WAKE_LOCK` + `turnScreenOn`/`setShowWhenLocked` in `StationWebActivity`; removed `FLAG_KEEP_SCREEN_ON`. **Caveat:** on battery + long idle, Android Doze may delay the BLE callback — reliable on charger; foreground-service upgrade remains an option if flaky in the field.
- [x] **Host-inherit RBAC + Vault Crew tab + eject reset (v425–427)** — host session carries real tier + IAM; `assetOpsActor()` sends host to backend ops (v426); checkout/design/packing follow **host credentials** (not any-host); ROOT Crew tab; pristine reset on eject; boot hardening (v427). See **Agreed spec** below.

## Shipped (field-fix chronology)

- [x] **Field bug — WebView stuck on PWA "add to home screen":** hosting shell now treats the native app (UA `ShowrunnerStation`) as standalone and skips the install nag (`host-boot.js` `isNativeStationApp()`). Needs `node deploy-hosting.js`.
- [x] **Field bug — "Gun not found" though paired in Android:** `RfidManager` now connects to the bonded gun by MAC first and no longer drops scan hits with a null name. Needs APK rebuild.
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
- [x] **Build-10 breadcrumbs read on hardware (the breakthrough).** Field result: **`station=true native=true`** (shell mounts, direct iframe→gun bridge works — confirms settings are reliable) but **scans still never reached the top strip**, and **`Trigger UP` never fired**. Two conclusions:
- [x] **Scans reach the strip via direct poll, not the relay (v419/build 11).** Root cause isolated: native `evaluateJavascript` can only execute in the **top frame**, so scans depended on the host-boot→iframe `postMessage` relay — the one hop that stayed lossy. Since the iframe can call native directly (`native=true`), we flipped it: `RfidManager` queues EPCs (`pendingScans`), exposes `drainPendingScans()` via `AndroidStation.pollScans()`, and the shell **pulls** every 300 ms (`stationStartScanPoll_`) → `onStationRfidScan`. The old relay stays as a fallback; a 1.5 s client dedup (`stationLastScanTag`) stops one physical scan being processed twice.
- [x] **Hold mode removed (v419).** The R6 fires **no key-up** on trigger release (`Trigger UP` never logged), so hold-to-scan can't stop on release — it degrades to a toggle. Dropped from the setup dropdown (Single / Continuous only); stored `hold` migrates to `single` on boot; speed slider is Continuous-only again. Native `SCAN_MODE_HOLD` left inert.
- [x] **Full loop confirmed on hardware (v419/build 11).** Field-verified: scans now land on the **top strip**, **Vault → Crew tab** badge enrollment wrote to the roster, and **badge login** hosted the crew member on a second scan. End-to-end gun→EPC→strip→host/enroll proven. (Debug overlay + `Gun set:`/`Trigger` echoes can now be retired in a cleanup build.)
- [x] **Station main-screen redesign + Project reuse (Pass A, director spec 2026-07-02).** Reworked `11_Station_Shell.html`:
  - **Header cleaned** — dropped the static "Warehouse station" title and the device-account name; header now shows the **device profile** (e.g. "CW1 Chainway") **—** host name in **green** (`#station-shell-host-inline`, set in `stationRenderShellState_`).
  - **Live scan strip shows equipment, not raw EPC** — each scanned tag resolves to **equipment name + unit** via a preloaded map; unknown tags show the raw EPC + "Unknown tag". A single multi-tag pull lists **every** tag (each EPC from `pollScans` becomes a row).
  - **Equipment RFID map (preload, Pass A of the parked "preload" idea, but for equipment).** New backend reader `getStationEquipmentRfidMap(deviceActor)` (`Station_Security.js`) → `{ epc → {name, unitId, unitNumber} }` for every asset with `rfid_tag` (same `normalizeStationRfidTag` contract). Shell caches it in `localStorage` (`sm_station_equip_map_v1`), shows the cache instantly, refreshes on boot + every 5 min (`stationRefreshEquipMap_`/`stationResolveEpc_`). No auth-secret concern — names/IDs only.
  - **Sensitivity bar on the main screen** — the read-power slider now also lives above the live scans (`#station-main-power`), two-way synced with the Settings copy (`stationSyncPowerControls_`).
  - **PROJECT / VAULT long buttons** replace the inert middle lane tiles; they sit above the logout/sign-out buttons and are gated on an active host.
  - **PROJECT reuses the phone view** — opens a project picker (fetched via `getRefreshPayload`, cached to `sm_phantom_payload` so `resolveMobileProject` resolves), then calls `window.openMobileProjectAssets(pId)` — the same compact PA phones use. The station shell hides itself while PA is open and restores on any close (`stationWatchPaExit_` watches `body.mobile-pa-compact`).
  - **VAULT is a stub** ("coming in the next update") — the real compact vault is **Pass B** below.
- [x] **Station Vault (Pass B, v421).** New `#station-vault` overlay in `11_Station_Shell.html` + backend in `Station_Security.js`:
  - **List + search** — `getStationVaultList(deviceActor, hostName)` returns a slim asset list (`id/name/unit/rfidTag/status/containerType/isBulk`) + `canRecordRfid` (host is MANAGER). Client-side search over name/unit/tag; capped at 200 rows.
  - **Status — anyone hosted** — Maintenance / Broken / Repaired via `setStationAssetStatus(deviceActor, hostName, id, status)` (gated: station device login + a host present). Vocabulary extended with **Broken**; **Repaired writes back `Active`** but logs "Repaired". Audited (`STATION_VAULT_STATUS`).
  - **Record RFID — managers only** — `recordStationAssetRfid(deviceActor, hostName, id, epc)` gated on `verifyBackendPrivilege(hostName,'MANAGER')`; collision-guarded (refuses a tag already on another asset); writes `Assets.rfid_tag`, `flushCache()`, audits (`STATION_VAULT_RFID`). After a save the shell calls `stationRefreshEquipMap_()` so the live strip resolves the new tag immediately.
  - **Cascade tagging** — see the **v423 correction** below for the real "logical parent" (identical-unit rollup) mechanic. The record banner advances one scan at a time (`stationVaultRecord.queue`, busy-guarded so rapid scans don't double-write).
  - Scans route to recording only while armed (`stationVaultConsumeScan_` intercepts in `onStationRfidScan`); host idle-timer now resets on activity anywhere (overlays included) and hosted-only overlays close on eject/logout.
- [x] **Screen cleanup (v421, director quirks).** Removed the big center host name (host shows top-left green), the bottom "Last scan" line, and the on-device `#station-debug` breadcrumb overlay. **Live strip now also resolves crew badges to the person's name** (`getStationEquipmentRfidMap` includes `Crew_Roster.rfid_tag` with `kind:'crew'`), so an unrecognised badge no longer shows as a raw "Unknown tag".
- [x] **Project open fix + Vault line restyle (v422, director quirks).**
  - **PROJECT wouldn't open on the station.** `openProjectAssetsModal` aborts on an empty `edit-folder-id`, and the station has no calendar for `resolveMobileProject` to fall back on. Fix: `stationPickProject_` now caches the picked project (`stationProjectsCache`), pre-seeds `window.mobileCrewHubProject` + `syncProjectEditorHiddenFields(proj, pId)` before `openMobileProjectAssets`, and surfaces any error instead of failing silently.
  - **Vault rows restyled to match the real vault.** Dropped the bespoke cards with clunky double-height buttons. Vault lines now mirror the real Equipment Vault row style (`06b1` `renderSingleAssetRow`): name white/bold, `#unit` muted, and a bordered **status pill** in the vault's colours (Active #10b981 / Maintenance #f59e0b / Broken #ef4444). **Tap a line → a bottom action sheet**. Lines stay clean.
- [x] **"Logical parent" corrected → identical-unit rollup + host-scoped projects (v423, director correction).**
  - **The mistake:** Pass B read "logical parent" as a **container/kit** (`containerType == parent.id`). Wrong. The real mechanic (see `06b1` `renderAssetRegistry`) is the **rollup of identical unique units**: units sharing **`name|manufacturer|length`** collapse under one **folder row with a ▶ triangle** (`toggleRollup`) that expands to the individual units. Bulk stays standalone (key gets `|id`; Bulk can't carry per-piece RFID — see [GLOSSARY](../GLOSSARY.md)).
  - **Station Vault now replicates it.** `stationVaultBuildGroups_` groups by the same key; multi-unit groups render a **▶ folder + count badge** (`stationVaultToggleGroup_` expands `#station-vault-grp-N`), singletons/Bulk render plain lines. Backend `getStationVaultList` now returns **`manufacturer` + `length`** for the key.
  - **Cascade = per unit inside the group.** Tap a folder → sheet offers **Record RFID** which queues the group's **still-untagged** units (one scan each), and **Maintenance/Broken/Repaired apply to all units in the group** (`stationVaultSetStatusMany_`). Expand + tap a single unit → that unit only. A single-unit line records/sets itself.
  - **PROJECT stopped hanging on "Loading projects…".** Root cause: the picker fetched `getRefreshPayload(<device account>)` (slow/empty on the station). Now it fetches for the **host** (`getRefreshPayload(host.name)` — the same list the person sees on their phone) and **preloads in the background on badge-in** (`stationPreloadProjects_`, warmed from `stationWriteHostSession_`), so pressing PROJECT is instant; failures surface an error instead of sticking.
- [x] **Scan panel + asset status (v430 / APK 0.1.12).** Fixed top-right **Scan** + **⚙** controls (work over project PA too). Large scan panel: live feed, sensitivity bar, **Low/Mid/High** presets (tap load, hold 1s save). Contextual **Maintenance / Damaged / Broken / Repaired** on last equipment scan. **Damaged** = usable defect, requires **`status_note`** text. **Broken** = unusable. **Repaired** → Active + clears note. Panel open **blocks checkout scans**. Schema: new **`Assets.status_note`** column (auto-added on vault sync).
- [x] **Scan panel UX polish (v431 / APK 0.1.13).** Panel drops as **tab under Scan button** (not bottom sheet). Settings **Done** reachable (controls hide while settings open). **Single / Multi** per-pull mode in panel + settings. Preset save **1s hold** + green flash feedback.
- [x] **Phase 5 polish (v432 / APK 0.1.14).** Gun scans **forward into project checkout** when PA operation mode is open (local equip-map resolve, fast `executeManualScanCall` path). Live strip shows **status + truncated note**. Removed **DEV: HOST AS BOGDAN** bypass. Retired native diagnostic status spam (`Trigger`/`Gun set`/`Read:` echoes) and web debug overlay hooks.
- [x] **BLE reconnect hardening (APK 0.1.12).** WebView state save/restore + `singleTask`; explicit BLE disconnect-before-reconnect; `connectIfNeeded` on resume — gun reconnect no longer reloads the whole app.
- [x] **Boot hardening (v427).** After v426 the station stopped loading its initial screen — a throw somewhere between showing the shell and sending the native `SHOWRUNNER_STATION_READY` left the kiosk splash stranded. `initStationShell_` now (1) shows `#station-shell` and posts `SHOWRUNNER_STATION_READY` **first**, then (2) wraps the rest of init **and** the bootstrap success callback in `try/catch`, surfacing any boot error in the status line + `stationDebug_` instead of blanking the screen. So no future boot-time error can strand the initial screen.
- [x] **PROJECT open hardening (v424).** After v423 the picker loaded but tapping a project could still show nothing. Fixes in `stationPickProject_`: (1) resolve the picked project from `stationProjectsCache` **or** the phantom payload, and if it's genuinely missing, say so + force a fresh fetch instead of silently bailing; (2) `openMobileProjectAssets` can **bail with only a toast** (no throw) when it can't resolve a project — the shell was hidden so the screen went blank — so we now **detect the still-hidden `#project-assets-modal-overlay` after ~250 ms, restore the shell, and report** "equipment list unavailable"; (3) **status breadcrumbs** ("Opening <project>…" → open / error) so any remaining failure is pinpointed; (4) **preload also runs on shell init** when a host session was restored from a reload (not just on `stationWriteHostSession_`).

## In progress / next (director priority 2026-07-07)

1. **[x] Bulletproof BLE gun reconnect (APK v0.1.16 build 18)** — health check, reconnect ladder, screen-on/resume, foreground service, `linkState` in settings. **Field verify** after gun sleep.
2. **[ ] Kiosk auto-start (APK)** — default launcher + `BOOT_COMPLETED` + battery optimization off.
3. **[ ] Optimistic host login + local roster cache** — instant badge host UI; server confirms in parallel (after EPC+TID schema).

### Field / polish (ongoing)

- [ ] **Gun name still unrecognised (build 3):** waiting on the gun's real Bluetooth name from the field.
- [ ] **Dial in the real values on hardware** — power dBm, beep/power persist across reconnect on R6.
- [ ] **Reminder:** whenever `host-boot.js` changes, bump the `?v=` in `push-hosting/public/index.html`.
- [ ] **Tag-map / new-equipment RFID provisioning UX** on the station
- [ ] **QR at gate / Gate-at-door** (future — separate gate device; TL SDK later)

### Approved backlog (not started)

- [ ] **Crew two-tag schema (EPC + TID)** — prerequisite for optimistic login
- [ ] **Offline host recognition (clone-safe)** — host-in from cache; writes still need server
- [ ] **Device hygiene** — one station profile per physical device (operational; no purchase blocker). Future: TL Solutions SDK driver, gate PC+TV when hardware bought.

## RFID badge lifecycle & fragile points (enrollment → DB → login)

The path the director just proved on hardware, and every place it can silently break. Backend: `Station_Security.js`. Client: `11_Station_Shell.html`.

**The flow (today vs target):**
1. **Enroll (v425 today → EPC+TID target)** — ROOT hosts open **Vault → Crew tab**, tap a crew member, then scan the badge → `enrollStationCrewRfidTag` writes EPC to `Crew_Roster.rfid_tag`. **Target (approved 2026-07-07):** also write TID to `rfid_tid`; one scan captures both; lock ROOT tags at provision.
2. **Login/host (today → optimistic local target)** — badge scan → `processStationRfidScan` (server round-trip). **Target:** local EPC+TID cache → instant host UI; server confirms in parallel; offline host recognition when DB errors on restart (checkout still needs server).

**Fragile points (all of these must hold or the badge silently won't work):**
- **Tag representation must be identical at enroll and login.** `normalizeStationRfidTag` = `trim().toLowerCase()` only — no hex/space/leading-zero cleanup. Native sends `epc.uppercase()`; server lowercases. If the gun ever returns a different EPC format (or a different memory bank / TID), the stored tag stops matching. **Enroll and login must read the same field the same way.**
- **`rfid_tag` column must exist** on `Crew_Roster` (via `verifyVaultSchema`). Missing → enrollment errors ("run a vault sync first"); **badge login just silently finds nothing.**
- **Cache**: enrollment calls `flushCache()` so the new badge matches immediately; `processStationRfidScan` reads cached `getSheetData`. Skip the flush and a fresh badge won't log in until cache TTL.
- **Actor gating**: both endpoints require `actorUsesStationShell(deviceActor)` (device account is a station-device profile) **and** hosting requires the `station_host_inherit` permission. Wrong profile / permission off → hard error.
- **Name vs uid**: enrollment `crewRef` and several lookups match on lowercased **Name** (uid also accepted). Duplicate names or a rename can mis-link or orphan a badge — prefer uid.
- **Collision guard**: enrollment refuses a badge already owned by a *different* crew member (by uid/name) — good, but relies on the same normalize; a formatting drift would defeat it.
- **What "RFID login" actually is**: `processStationRfidScan` returns `scanType:'host'` and the client creates a **station host-inherit session on that device** — *not* a full authenticated token session. Blast radius is limited to the station profile's permissions. Equipment scans still require an active host (`hostOnly`).
- **Read selectivity**: at high power the gun may read a nearby/shelf tag instead of the badge — you could enroll or host the **wrong** tag. Tune power so only a badge at the gun reads (see "dial in real values").

## Agreed spec — Station host permission model (director 2026-07-03)

**Status:** **Built v425–427** (see Implementation checklist below). Checkout/design/packing follow **host IAM**; equipment **status** (Maintenance/Broken/Repaired) is the any-host station baseline.

### Guiding principle

The station (gun **or** warehouse computer at the RFID gate) is a **surface**, not a separate permission universe. While a crew member is **hosted** (badge scan), what they can do follows their **own crew credentials** — the same rights they'd have on their phone or an office desktop. Rationale: warehouse computers will run station profiles; cross-rental and gate work must be doable **in the warehouse** without walking to the office or fumbling on a personal phone.

**No schema refactor required.** Crew tiers and IAM keys already live on `Crew_Roster` / roles; `verifyBackendPrivilege(hostName, tier)` already resolves a person by name. Implementation = **host session carries the host's tier + permission set** (fetched at badge-in) and client `effectiveHasPerm` / `canEditAssets` / `canUseAssetCheckout` **prefer the host while `IS_STATION_DEVICE && host active`**. Backend endpoints verify the **host**, not the device account, for writes. Optional future: a station-profile toggle for "view-only guns" — not required for v1.

### Permission matrix (while hosted)

| Action | Who |
|--------|-----|
| **Check-in / Check-out** (operation mode) | Host's real credentials — same `event_assets_window` / IAM as on phone or desktop (v426). Sub-credential hosts do **not** get checkout the device account didn't grant them. |
| **Mark Maintenance / Broken / Repaired** | **Any** hosted crew (station baseline) |
| **Add/remove project assets, Design, Packing** (full PA) | Host's real credentials — e.g. `event_assets_window` / manager tier. A manager doing cross-rental gets full PA; plain crew does not. |
| **Record / overwrite equipment RFID** | Host is **MANAGER+** (`recordStationAssetRfid` — already enforced server-side) |
| **Add / overwrite crew badge RFID** | Host is **ROOT only** — via **Vault → Crew tab** (see below); **not** self-serve |

**Station device profiles must never receive an RFID tag** — excluded from crew-RFID assignment UI and blocked server-side.

### Station baseline vs delicate writes

- **Baseline (any host):** equipment **status** in Vault (Maintenance/Broken/Repaired). Hosting at a warehouse device is the context — not because every crew member has those rights globally in the office app.
- **Check-in/out + full PA:** host's tier + IAM keys, evaluated as if they logged in personally (client + backend agree via `stationHostRbac` + `assetOpsActor()`).
- **Delicate RFID:** equipment = MANAGER+, crew = ROOT only (server-enforced on `hostName`).

### Check-in/out is input-agnostic

Checkout/checkin is **operation mode inside Project Assets** — not gun-only. Must work when:
- **Manual tap** on buttons (phone at gate, desktop hub, station computer — no gun, dead battery, no power).
- **RFID EPC** scan (gun).
- **QR scan** (future / maybe soon): QR encodes the asset **UID**; same confirm path as RFID.

Bulk cables checkout via **container case**: in design mode (manager credentials) add a cable case to the project, name it, assign case RFID/QR; bulk inside is married to that case (`containerUid`). At packing/checkout, scanning the **case** checks out the bulk inside — no per-cable RFID.

### Vault → Crew tab (ROOT only) — shipped v425

**Vault → Crew tab** inside the station **Vault** overlay (mirrors original desktop crew-RFID admin):
- Visible only when hosted host is **ROOT**.
- Crew list; root assigns/overwrites each person's `rfid_tag`.
- **Station device accounts filtered out** — never assignable.
- Backend: tighten `enrollStationCrewRfidTag` (or successor) to **ROOT** + reject station-profile rows.

### Host eject = pristine device

On host logout, idle eject, or sign-out: return to **"waiting for badge"** main view and **wipe session UI** so the next person sees an unused device:
- Clear live scan strip (`stationRecentScans` → "Waiting for scans…").
- Cancel Vault record queue; close Vault/Project overlays.
- Clear status line, cached project list for picker.
- *(Built v425 — `stationResetDeviceToPristine_` clears scan strip + Vault/Crew/project caches + records and closes overlays on both idle eject and manual logout.)*

### Implementation checklist (next build)

- [x] **Host-inherit RBAC (v425)** — `processStationRfidScan` (+ DEV bypass) now returns the host's real `access` tier + `permissions` bundle (`resolveHostRbacBundle_` → `resolveCrewSysAccess`/`resolveCrewPermissionBundle`, no nested `executeWithRetry`). Client `installStationRbacOverride_` in `11_Station_Shell.html` wraps `userHasPerm`/`accessTierAtLeast`/`effectiveHasPerm` so that **while `stationHostRbac` is set** the whole app evaluates as the host (their tier + IAM), not the low-tier device account. `canEditAssets()` (design/packing) therefore follows the host's real `event_assets_window`. Guarded by `IS_STATION_DEVICE` + host presence so office/non-hosted states are untouched. Reload restores the RBAC globals: `initStationShell_` now re-runs `stationWriteHostSession_(bootHost)` (not just render) so a page refresh keeps host-inherit alive.
- [x] **Backend actor = host, not device (v426 — critical follow-up).** The web app on a station runs as the **device Google session**, and the operation calls (`startEventOperation`, `processRfidScan`, `saveProjectAssetsDelta`, `batchProcessOperations`, `finalizeEventOperation` in `02c_Project_Operations.html`) were sending `ACTIVE_USER_NAME` = the device account → `assertActorCanPerformAssetOperations` denied ("🛑 Cannot edit project assets", surfaced as *timeout after 5 attempts* because `executeWithRetry` re-throws). Fix: new `window.assetOpsActor()` (07_Core_Globals) returns the **host name** while station-hosted, else `ACTIVE_USER_NAME`; all six 02c calls now use it. Same client-trust model as every other `actor` arg (residual: harden by binding the write to the badge that opened the host session).
- [x] **Checkout follows host credentials (v426 correction).** The earlier "any host can check out" client baseline was **removed** — the backend gates operations on the real `event_assets_window`, so forcing the button on for a sub-credential crew host just reproduced the button→deny trap. Now `canUseAssetCheckout()`/`canEditAssets()` follow the host's real credentials (client and backend agree). **The true any-host baseline is equipment status** (Maintenance/Broken/Repaired), handled in the Vault backend on host presence alone. *(A genuine any-host checkout baseline would need a dedicated station-context backend grant — deferred.)*
- [x] **Vault Crew tab (v425)** — Vault overlay now has **Equipment | Crew** tabs; the **Crew** tab is shown only when `stationHostRbac.access === 'ROOT'`. New backend `getStationCrewRfidList(deviceActor, hostName)` (ROOT-gated, excludes station device profiles). Tapping a crew row arms `stationCrewRecord`; the next scan is consumed by `stationCrewConsumeScan_` → `enrollStationCrewRfidTag`. Self-serve "Link my RFID badge" footer button removed.
- [x] **`enrollStationCrewRfidTag` → ROOT gate (v425)** — signature is now `(deviceActor, hostName, crewRef, rfidTag)`; requires `verifyBackendPrivilege(hostName, 'ROOT')` and **refuses to tag a station device profile** (`actorUsesStationShell(ref)`).
- [x] **Eject reset (v425)** — `stationWriteHostSession_(null)` (idle eject **and** logout) calls `stationResetDeviceToPristine_`: clears the live scan strip, cancels armed Vault/Crew records, drops cached vault/crew/project lists + expanded state, closes overlays, resets status/last-scan. Next person sees a pristine gun.

### Known fragilities (carry forward)

- Manager/ROOT checks trust client-passed `hostName` on some endpoints — **de-prioritized** (trusted crew); optional harden later by binding writes to the badge that established the host session.
- `saveProjectAssetsDelta` has no collision check — risk with multiple guns on one project.
- "Repaired" writes `Active` in the sheet; audit log distinguishes the action.
- **BLE zombie link** after gun sleep — SDK reports connected but reads fail; Reconnect button can block on worker thread. → **Agreed spec — Bulletproof BLE reconnect** above.

---

## Agreed spec — Security & crew badge model (director 2026-07-07)

**Status:** Approved — not built yet.

### Trust model

- Crew with RFID access are **trusted people** — not designing against malicious insiders scripting the WebView.
- **Primary security goal:** prevent **badge cloning**, especially **ROOT** badges. A cheap UHF copier can replay an **EPC**; it cannot copy another chip's factory **TID**.
- **De-prioritized for v1:** server-side “prove this badge scan opened the session” binding (`hostName` spoofing) — relevant only if someone games the software, not the director's scenario.

### Two-tag crew schema

| Field | Sheet column (proposed) | What it is |
|-------|----------------------|------------|
| **EPC** | `rfid_tag` (existing) | Main ID the gun reads — cloneable if not locked |
| **TID** | `rfid_tid` (new) | Factory-burned chip ID — anti-clone anchor |

- **One physical scan** per enroll/login: native SDK reads **both** memory banks on the same trigger pull (not two separate scans).
- **Enroll** (Vault → Crew): write EPC + TID; **lock tag memory** at provision for ROOT (and MANAGER if desired) when hardware allows.
- **Login:** match **EPC + TID pair** — EPC alone is not enough after cutover.
- **Normalize:** same `normalizeStationRfidTag` rules on both fields at enroll and login.
- **Migration:** re-enroll all existing crew badges once so every row has `rfid_tid`.
- **Equipment:** EPC-only (`Assets.rfid_tag`) is fine for now; same two-field pattern optional later.

### Optimistic host login (fast badge-in)

1. Gun reads EPC + TID.
2. Station looks up pair in **local cache** (crew slice of equip map) → **immediately** show host name + apply cached tier/permissions (“Maria — logging in…”).
3. **In parallel:** server `processStationRfidScan` confirms; on success, refresh RBAC snapshot; on failure → **clear host**, show error.
4. When server is down: local EPC+TID match can still host for **recognition**; show **offline / roster from &lt;time&gt;** banner. Checkout, vault writes, crew enroll **still require server**.

**What offline does / doesn't protect:**

| Threat | Local EPC+TID |
|--------|----------------|
| Cloned badge (wrong TID) | **Blocked** |
| Fired crew, demotion, removed badge | **Not blocked** until cache refresh — server is authority when online |

### Native changes for TID

- `RfidManager.kt` must read TID bank (Chainway SDK supports this; see demo `getEPCAndTIDUserMode` in SDK docs) and deliver `{ epc, tid }` to the web layer.
- Local cache stores **both** per crew member.

---

## Agreed spec — Device fleet hygiene (director 2026-07-07)

**Status:** Approved — operational rule + future gate/TL profiles.

| Physical device | Station rule |
|-----------------|--------------|
| Each Chainway gun + married phone | **Own** station device account + profile |
| Additional Chainway pairs | **New** device + profile each |
| Each TL Solution gun (future) | **Own** device + profile; SDK integration TBD |
| **Gate** | **Separate station** from warehouse guns — never shared login |
| Gate + TL setups (near term) | **PC + TV** — large UI; same station shell / host model, device-specific profile |

Checkout/check-in remains **input-agnostic** on every surface (tap, RFID, future QR) — see host permission model above.

---

## Agreed spec — Bulletproof BLE reconnect (director 2026-07-07)

**Status:** **In flight** — APK build 18+ (`RfidManager.kt`, `BleKeepAliveService.kt`).

**Problem:** After **gun sleep** or long idle, BLE drops but SDK may still report **CONNECTED** (“zombie link”); `connectIfNeeded()` then skips reconnect. **Reconnect gun** button can appear dead if `forceReconnect()` queues behind a **stuck read** on the single worker thread.

**Target behavior:**

1. **Health check** — while “connected”, periodic cheap SDK call (`getBattery` or test read); failure → force disconnect + reconnect even if status says connected.
2. **Hard reconnect ladder** — soft: disconnect → wait (extend to ~2s for waking R6) → connect saved MAC; medium: retry ×3; nuclear: `uhf.free()` → re-`init()` → connect; then BLE scan fallback if MAC connect fails twice.
3. **Wake hooks** — on `onResume` and **screen on**, run health check + reconnect (not only when already disconnected).
4. **Foreground service** — persistent notification; keeps process alive through Android Doze (especially on battery).
5. **Reconnect button** — cancel/stop in-flight reads first; run on dedicated path so it cannot block; surface status: Disconnecting → Waiting for gun → Connected / Failed.
6. **UI honesty** — settings show link state: live / zombie / disconnected (not only cached `connected: true`).

Chainway demo reference: `AUTO_RECONNECT` + disconnect-time handling in `uhf-ble-demo` — align with our ladder, don't rely on SDK alone.

---

## Agreed spec — Kiosk auto-start (director 2026-07-07)

**Status:** Approved — APK + device setup.

**Goal:** Dedicated warehouse phone always lands in Showrunner Station after power-on — **no Google account** on phone, **no lock PIN** (swipe-only lock screen is OK).

**Implementation stack (simple → strict):**

1. **Default launcher (HOME)** — Showrunner Station is the home app after swipe.
2. **`BOOT_COMPLETED` receiver** — launch `StationWebActivity` on reboot.
3. **Disable battery optimization** for the app (vendor-specific; required on Samsung/Xiaomi etc. or BLE/boot launch dies).
4. **Optional later:** Lock Task Mode or Device Owner for escape-proof kiosk.

Wi‑Fi must be configured on device; Showrunner **station-device** login is separate from any Google account.

---

## Parked / deferred (lower priority)

- **Server session binding** — tie delicate writes to the badge that opened host session (anti-spoofing; not director priority).
- **Local crew map hash-only storage** — optional extra if tablet theft becomes a concern; EPC+TID pair match is the main anti-clone lever.
- **View-only station profile toggle** — optional; not required for v1.
- **Any-host checkout baseline** — deferred; equipment **status** is the true any-host baseline today.

## When this closes

Move this file to [../archive/](../archive/) and update the **Active campaigns** row in [../Project_TODO.md](../Project_TODO.md). Remaining long-horizon items (gate, fleet payload, pull sheets) stay in [../topics/logistics-warehouse.md](../topics/logistics-warehouse.md).
