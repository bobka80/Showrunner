# Master File Map & Component Registry

This file serves as the definitive index of all 40+ components and their routing engines within the architecture. It **replaces the deprecated `Project_Index.md`** (never created / removed).

> Entry point for AI agents: [AI_DOCTRINE.md](../../AI_DOCTRINE.md)

---

## Wiring Status (`Index.html` includes)

Only modules listed in root **`Index.html`** via `<?!= include('...'); ?>` are compiled by `build.js` and deployed. Files on disk without an include are **orphans** (invisible to the live app).

| Status | Modules |
|--------|---------|
| **Wired (production)** | All entries in sections 1–10 below |
| **Re-wired 2026-06-24** | `02g_Project_Reports` (Print Studio), `06f_Admin_Audit` (Audit Studio) |
| **Dev / not in Index** | `temp_script_0.js`, `test.js`, `test_db.js`, `run_test.js`, `watch.js`, `Logistics_Debug.js` |

When adding a new `.html` module: update this file **and** add the include to `Index.html` before `node build.js`.

---

## 1. System Core & Globals
- **`Index.html`**: The main application shell and entry point. Injects all other HTML templates. Contains the mobile dashboard and global left navigation.
- **`Main.js`**: GAS backend entry point. Handles HTTP GET/POST routing and the high-speed boot payload.
- **`build.js`**: The local Node.js compiler. Packages HTML/JS into `dist/` to bypass Google Apps Script size limits. Copies backend `.js` + `Login.html` to `dist/`; excludes Node tooling via **`gas-node-only.js`**.
- **`gas-node-only.js`**: Canonical list of root `.js` files that must **never** ship to Apps Script (PC-only / `require`). Shared by `build.js` and `check-google-account.js`.
- **`milestone.js`**: GAS deploy + appends row to root `RELEASES.md` + starts curated **split** `claude-pack/repomix-output.*.md` refresh **in the background** (`--no-repomix` to skip).
- **`create-repomix.js`**: PC-only. Packs repo via Repomix (`npx repomix`) into `claude-pack/repomix-output.*.md` (~2 MiB parts by default) for Claude / quote.ai project knowledge. `npm run create-repomix`. See [CLAUDE_PACK.md](CLAUDE_PACK.md).
- **`check-google-account.js`**: Node-only (not deployed to GAS). Three checks: (1) clasp login, (2) email matches `google-account.json` + project reachable, (3) **no PC-only scripts on live GAS** (white-screen guard). Run: `node check-google-account.js` or `npm run check-google`.
- **`pre-ship.js`** + **`pre-ship/`**: Scoped pre-ship pipeline — auto-detects layers from git diff; hooked into `milestone.js`, `deploy-hosting.js`, `build-station-desktop.js`, `build-station-apk.js`. **Bugbot gate:** `pre-ship/bugbot-policy.js`. **DAL gates:** `pre-ship/dal.js` when hot paths change. Docs: [PRE_SHIP_PIPELINE.md](docs/ai/PRE_SHIP_PIPELINE.md) · [dal-pre-ship-gates.md](docs/ai/archive/dal-pre-ship-gates.md). Run: `node pre-ship.js` or `npm run pre-ship`.
- **`scripts/dal-client-inventory.js`**: Node-only. Scans root `*.html` for `google.script.run` + `localStorage`; writes [dal-client-inventory.md](docs/ai/dal-client-inventory.md). `--check` on pre-ship when DAL hot paths change.
- **`scripts/dal-persistence-lint.js`**: Node-only. Bans `SpreadsheetApp` / `clearContents` in client HTML; server `clearContents` allowlist.
- **`scripts/dal-phase3-gate.js`**: Node-only. Blocks deploy when delta-only saves ship without `PRE_SHIP_DAL_CONCURRENCY_OK=1`. `--deploy` flag from pre-ship.
- **`scripts/dal-pa-live-sync-test.js`** + **`scripts/lib/dal-*-core.js`**: Node-only PA/timeline live-sync sims (Cases A–V). Includes `dal-remote-apply-diff-core.js` (H2 targeted redraw gate).
- **`gas-push-sync.js`**: Node-only. Replaces all Apps Script project files from `dist/` via API (deletes orphans). Used by `milestone.js` and `dev-push.js` instead of bare `clasp push`.
- **`Security.js`**: Manages user authentication and extracts security profiles.
- **`Styles.html`**: Global structural CSS. **Authority:** [UI_DOCTRINE.md](UI_DOCTRINE.md). Module density/colors → Visual Settings (`06c_Admin_Visuals.html`), not here.
- **`Styles_Mobile.html`**: Mobile-only CSS (`≤768px`) + crew hub / phase rail / timeline zoom / compact PA. Included after `Styles.html`.
- **`07_Core_Globals.html`**: Centralized utility functions, live tag parsers, and the CSS theme engine initialization.
- **`07b_Grid_Engine.html`**: The interactive Drag & Drop data grid core.
- **`07c_Generalization_Engine.html`**: The Blueprint template engine.
- **`08_Conflict_Manager.html`**: Renders the active triage drawer for resolving timeline and equipment conflicts.
- **`Conflicts.js`**: Backend resolver for conflicts identified in the frontend.

## 2. Shared UI Components
- **`00a_UI_Layers.html`**: Z-index layer stack and overlay foundations for modals/drawers.
- **`00b_UI_Hubs.html`**: Hub shells and navigation containers for major UI regions. Includes ROOT **DATABASE OPERATIONS** tab shell (`tab-content-database`, sub-tab panes for `06g_Admin_Database.html`: BACKUP & ARCHIVE | OPS & NOTIFICATIONS | **ERROR LOGS**).
- **`00c_UI_Forms.html`**: Universal form renderers (Provisioning, Warehouse Roots, Clients, Vehicles).
- **`00d_UI_Visuals.html`**: Settings drawers and data manager modals (Colors, Depts, Meals, Tags).
- **`00e_UI_Modals.html`**: Universal popups (Global Tasks, Pickers, Checklists, Backup).
- **`00f_Error_Report.html`**: Global top-center **error-report lip** (~2mm) + drawer — hover open (desktop), tap lip (touch/mobile/station); `submitErrorReport`. Build: [archive/user-error-reporting-journal-2026-07-19.md](archive/user-error-reporting-journal-2026-07-19.md). Styles: `Styles.html` `#sr-error-report-*`.

## 3. Operations & Integrations
- **`Operations.js`**: Core backend execution (RFID processing, ledger commits, starting sessions).
- **`Integrations.js`**: External APIs. Google Drive project folders, template clone, **Showrunner Sync** shortcuts, archivers. **Drive folder IDs & layout:** [DRIVE_LAYOUT.md](DRIVE_LAYOUT.md).

## 4. The 01 Series: Calendar & Dashboard
- **`01a_Calendar_Core.html`**: Main dashboard boot sequence and FullCalendar configurations.
- **`01b_Calendar_Tasks.html`**: Task rendering and notification engines.
- **`01c_Calendar_Mini.html`**: The scoped Mini Calendar editor boot sequence.
- **`01d_Calendar_Mobile.html`**: Mobile Command Center (home, events, RFID, notifs).
- **`01e_Mobile_Crew_Hub.html`**: Crew briefing screen on phone — replaces opening full project editor from events.
- **`01f_Mobile_Phase_Rail.html`**: Deconstructed mini calendar (**sub-event** segments from `fragments`; “Phase” in filename is legacy).
- **`01g_Mobile_Tasks.html`**: MY TASKS view in Mobile Command Center.
- **`01h_Mobile_Assets.html`**: Compact Project Assets on phone (`mobile-pa-compact`).
- **`01j_Mobile_Scan.html`**: Phone QR scan panel — header Scan dropdown, shell camera via `SHOWRUNNER_MOBILE_SCAN_OPEN_CAMERA`, boot consume `pending-mobile-scan-b64`, vault resolve (`resolveMobileScanTag`, `pullStagedMobileScan`), status actions (`setMobileAssetStatus` in `Station_Security.js`). **Handoff:** see [FRAGILE_ZONES.md](FRAGILE_ZONES.md) § Mobile QR. Styles: `Styles_Mobile.html`.
- **`01i_Desktop_Lock.html`**: **Desktop lock screen / screensaver** — post-login overlay (session stays valid), Stage Masters bus lanes + hero A, Bahnschrift clock, quick-unlock prefix + full PIN. Server: `Security.js` (`verifyDesktopLockUnlock`, `getDesktopLockPrefix`). Styles: `Styles.html` `.desktop-lock-*`. Full behavior → [topics/ux-platform.md](topics/ux-platform.md).

**Mobile handoff doc:** [MOBILE_CREW_UX.md](MOBILE_CREW_UX.md)

## 5. The 02 Series: Project Editor & Logistics Hub
- **`02_Project_Editor_Core.html`**: The presence engine heartbeat and core project schedule sync operations.
- **`02_Project_Editor_Logistics.html`**: **The Logistics Wizard.** Houses the autonomous engine and the *Auto-Packing* system. *Quirk: Operates on Bulk items independently from the explosion engine.*
- **`02_Project_Editor_Map.html`**: Leaflet geocoding map engine and weather display.
- **`02a_Project_Equipment.html`**: The main Project Assets (PA) modal wrapper.
- **`02b_Project_Syntax.html`**: The Text CLI parser. *Quirk: Parses commands like '12x Fixtures' and handles mathematical rounding.*
- **`02c_Project_Operations.html`**: RFID scanners and manual ledger queues within a project context.
- **`02d_Equipment_Render.html`**: The main rendering loop for equipment rows.
- **`02e1_Logic_State.html`**: Logic toggles for UI view state and group targeting.
- **`02e2_Logic_CRUD.html`**: Core mutations for adding/editing project assets.
- **`02e3_Logic_Clipboard.html`**: The cut/copy/paste equipment engine.
- **`02e4_Logic_Containers.html`**: Autonomous packing detection. *Quirk: This is the fluid 'Auto-Containerization' engine, distinct from bulk Auto-Packing.*
- **`02e5_Logic_Sync.html`**: Optimistic syncing and delta calculations. *Quirk: Houses 'processFormulas()'.*
- **`02g_Project_Reports.html`**: The Print Studio modal and logistics tree filtering. **Wired** in `Index.html` (required for `openPrintModal()` from Project Assets PRINT button).
- **`Logistics_Assets.js`**: The master logistics aggregator for project assets on the backend.
- **`Logistics_Ledger.js`**: Movement ledger helpers — `Logistics_Ledger` dual-write (M1), PA truck inventory API, AUTO clock stamp onto legs.
- **`Logistics_Projects.js`**: CRUD operations for project lifecycles.
- **`Logistics_Roster.js`**: Month Matrix and un-paid scanner data operations.
- **`Logistics_Schema.js`**: Relational engine schemas (incl. `Logistics_Ledger` tab bootstrap).
- **`Logistics_Tasks.js`**: Task routing logic.
- **`Logistics_Timeline.js`**: Project timeline backend CRUD.
- **`Dal_Repos.js`**: DAL Phase 1–3 — `SheetsAdapter` + domain repos + scoped row write helpers.
- **`Dal_Router.js`**: DAL Phase 4 — `projectDataRouter(domain, sessionStatus)`; Firebase when session-open.
- **`Dal_Sessions.js`**: DAL Phase 4 — dual-domain session registry (`Dal_Prep_Session_*` / `Dal_Timeline_Session_*`); `getDalSessionInfo` returns `prepStatus` / `timelineStatus`; `getOpenDalForkMap` for calendar fork-dot chrome.
- **`Dal_Firestore.js`**: DAL Phase 4 — Firestore REST (GAS service account) for prep + timeline forks.
- **`Dal_Firebase.js`**: DAL Phase 4 — FirebaseAdapter; snapshot/commit; wires Phase 5A reconcile after commit.
- **`Dal_Cache.js`**: DAL Phase 6A — `dalInvalidateCacheTags_(tags)`; domain tags `project:{id}:pa` / `project:{id}:timeline` (selective, not global `flushCache`).
- **`Dal_Ledger.js`**: DAL Logistics Hub atomic path (design lock §2) — Firebase op journal → Sheets apply → live read-back verify; Phase 5C ledger pocket/retry. No session fork.
- **`07d_Cache_Coordinator.html`**: DAL Phase 6A — client `CacheCoordinator` (`check` / `set` / `invalidate` / `registerPolicy`); PA helpers `dalCacheGetPa_` / `dalCacheSetPa_` / `dalCacheInvalidatePa_`.

## 6. The 03 & 04 Series: Timelines & Crew
- **`03a_Timeline_Boot.html`** to **`03e_Timeline_UX.html`**: The shift and phase drag-and-drop timeline builder.
- **`03f_Timeline_Mobile.html`**: Mobile timeline zoom bar (overview / my row).
- **`04_Month_Roster.html`**: The Master Month Roster matrix render loop.
- **`04b_Equipment_Tracker.html`**: Global equipment timeline tracking and state fetching.

## 7. The 05 Series: Warehouse & Trucks
- **`05_Warehouse_Engine.html`**: 2D CAD spatial renderer and polygon dragging for warehouse management.
- **`05a_Truck_Arrangement.html`**: Predictive 2D truck packing CAD UI.
- **`05b_Loadin_Plan.html`**: Specialized load-in timing plans.

## 8. The 06 Series: System Admin & Data
- **`06_System_Admin.html`**: Core admin resource hub router.
- **`06a_Admin_IAM.html`**: User access and role configuration (office crew roles).
- **`06h_Admin_Station_Profiles.html`**: **Warehouse device IAM** — gun/tablet station profiles (Chainway handheld, TSL dock desktop, planned gate). One profile per physical device; profile carries the **layout** that selects the gun driver. Separate from office Role Editor. Backend: **`Station_Security.js`**.
- **`11a_Station_Gun_Drivers.html`**: **Station gun driver registry** — `window.StationGunDrivers` keyed by station layout (`chainway_handheld`, `tsl_dock_desktop`, planned `gate`) + `stationActiveGunDriver_()` / `stationGunCap_(name)`. Per-gun `caps` flags decide which shell controls apply (hidden now, auto-gray-out next). Isolates each gun so one gun's behaviour (e.g. TSL app-sleep) can't affect another (Chainway trigger-wake). Included before station shell modules. See [active/rfid-station-profiles.md](active/rfid-station-profiles.md) § Gun driver fork.
- **`11_Station_Shell.html`**: **Stub pointer** — logic split into `11b`–`11l` (Phase A, GAS v530+). Structure map: [active/station-shell-structure-map.md](active/station-shell-structure-map.md). UI spec: [STATION_UI.md](STATION_UI.md).
- **`11b_Station_Styles.html`**: Station CSS (phone sled + shared overlays).
- **`11j_Station_Phone_UI.html`**: Phone sled markup (`#station-shell`).
- **`11i_Station_Settings.html`**: Settings overlay markup.
- **`11h_Station_Project.html`**: Project picker markup.
- **`11f_Station_Vault.html`**: Vault overlay markup.
- **`11k_Station_Dock_UI.html`**: Dock panel scaffold (Phase B — no-op until `stationActiveUiSkin_`).
- **`11l_Station_Dock_Scale.html`**: UI scale CSS vars scaffold (Phase B).
- **`11c_Station_Core.html`**: Host session, RBAC override, bootstrap, `initStationShell_`.
- **`11d_Station_Rfid.html`**: `onStationRfidScan`, equip map, host login, scan poll.
- **`11e_Station_ScanPanel.html`**: Scan panel UI + status actions.
- **`11g_Station_Vault.html`**: Vault equipment logic (rollup, record RFID, status).
- **`11g_Station_Vault_Crew.html`**: Vault crew tab (ROOT badge enroll).
- **`11h_Station_Project_Logic.html`**: Project picker + PA handoff.
- **`11i_Station_Settings_Logic.html`**: Settings + gun config sync.
- **`station-android/`**: **Native gun app** (WebView + Chainway `API_Ver20251103` AAR — `RfidManager.kt`, `StationWebActivity.kt`). Exposes `AndroidStation` `@JavascriptInterface` (`getConfig`/`setPower`/`setScanMode`/`setBeep`) for the web setup view; delivers scans via `showrunnerStationDeliverScan` (iframe relay). Gun settings (power/mode/beep) persist in Android prefs. See `station-android/README.md`. Drives the `chainway_handheld` layout — see [active/rfid-station-profiles.md](active/rfid-station-profiles.md) § Gun driver fork.
- **`station-desktop/`**: **Native desktop/TV station shell** for the **TSL 1128-EU** gun (Windows WPF + **WebView2**, .NET 8). `ShowrunnerStationDesktop/`: `MainWindow.xaml.cs` (four-layer WebView scan relay + session sync), `TslRfidManager.cs`, `GunPortDetector.cs`, `StationBridge.cs` (`window.AndroidStation`), `DesktopPrefs.cs`, `ScanDiagnostics.cs`. Drives `tsl_dock_desktop`. **Architecture + fragile rules:** [active/tsl-desktop-handoff.md](active/tsl-desktop-handoff.md) · [FRAGILE_ZONES.md](FRAGILE_ZONES.md) § Desktop WebView2. Field readme: `station-desktop/README.md`.
- **`stage-desktop-info/`**: **TSL vendor reference only** (not Showrunner software). `Doc/` (ASCII protocol + 1128 user guide PDFs), `Samples/` (vendor .NET SDK sample apps), `TSL Reference/` (ASCII Protocol Explorer installer). Renamed from historic typo `station-desctop`. **Do not ship.** See [stage-desktop-info/README.md](../../stage-desktop-info/README.md).
- **`build-station-desktop.js`** (repo root, Node-only via `gas-node-only.js` + `.claspignore`): Builds/zips the desktop station EXE (`dotnet publish` of `station-desktop/ShowrunnerStationDesktop`). Usage `node build-station-desktop.js "<notes>"` (add `--self-contained` to bundle .NET). **Separate from GAS `milestone.js` and the APK `build-station-apk.js`.** Must stay excluded from GAS (a leak into `dist/` caused a `require is not defined` white screen, fixed v493).
- **`build-station-apk.js`** (repo root, Node-only via `gas-node-only.js`): Builds the station APK (`station-android` Gradle `assembleDebug`) and copies it to `push-hosting/public/downloads/showrunner-station.bin` + writes `station-manifest.json`. **Release notes are required args** (`node build-station-apk.js "fix a" "fix b"`) — it fails without them. **Auto-bumps** `versionCode` (+1) and `versionName` (`-dev` dropped → patch bump) back into `app/build.gradle.kts`, and records `updatedAt` (build time), `notes`, and a rolling `history` (last 20) in the manifest. Then `node deploy-hosting.js`. Needs Android Studio SDK + JBR on the PC.
- **Station app install page** — login screen link **"Warehouse gun — install station app"** → `getStationAppUrl_()` in `Main.js` → `/station-app?install=1` on Firebase Hosting (`push-hosting/public/station-app.html`). Shows **version + build number, upload timestamp, "What's fixed" notes, and previous-build history** (from `station-manifest.json`) so field staff see app state without asking. APK is served as **`.bin`** because Firebase Spark blocks `.apk` uploads; hosting header re-labels it `application/vnd.android.package-archive`.
- **`06b1_Admin_Assets_Core.html`** to **`06b4_Admin_Assets_QR.html`**: The Equipment Vault. Covers bulk review, asset provisioning, smart merges, and the QR print generator.
- **`06c_Admin_Visuals.html`**: Real-time theme application engine.
- **`06d_Admin_Fleet.html`**: Vehicle database CRUD.
- **`06e_Admin_Automation.html`**: Database archivers and manager rules.
- **`06f_Admin_Audit.html`**: Database Audit Studio (duplicate merge + item-by-item review). **Wired** in `Index.html`. Entry: `openAuditStudio()` when linked from admin UI.
- **`06g_Admin_Database.html`**: ROOT-only **Database Operations** — sub-tabs **BACKUP & ARCHIVE** | **OPS & NOTIFICATIONS** | **ERROR LOGS**. Shell markup in `00b_UI_Hubs.html` (`tab-content-database`). Entry: Admin hub → DATABASE tab → `loadDatabaseOpsPanel()` / `loadErrorLogsPanel()`. Backup pane: live file tickets, quick backup/restore, ops log. Ops pane: placeholder Software Log Hub (left) + **Push Notifications** (right) via `renderPushAdminPanel('push-admin-panel')`. Error Logs: list/filter Sheet inbox + **Hand over to Cursor** (`listErrorReports` / `handoverErrorReports` in `Resources_Audit.js` — copy pack then delete rows). *Quirk: push list styles inject into `document.head` (`ensurePushDeviceListStyles` in `10c`); device fetch is deferred inside try/catch.*
- **`Resources_Core.js`**, **`Resources_Database.js`**, **`Resources_Audit.js`**, **`Resources_Migrations.js`**, **`Resources_System.js`**, **`Resources_Vault.js`**, **`Resources_Warehouse.js`**: Backend CRUD and schema engines. **Live DB registry & folder IDs:** [DRIVE_LAYOUT.md](DRIVE_LAYOUT.md) + `Resources_Core.js` constants.

## 9. The 09 Series: Financials
- **`09_Financials_Hub.html`**: The main hub for payroll, labor costs, and interactive ledgers.

## 10. Notifications & Push (10 Series + backend)

**Push notifications:** [topics/notifications-catalog.md](topics/notifications-catalog.md) (checklist) · [topics/notifications.md](topics/notifications.md) (architecture) · **Production log:** root `RELEASES.md` (updated by `milestone.js` on each GAS deploy).

Users must open **Firebase Hosting** (`https://sm-showrunner-97405.web.app`) for FCM registration; raw `script.google.com` bookmarks do not receive push.

### GAS frontend (wired in `Index.html`)
- **`10a_Notifications_Boot.html`**: Iframe ↔ hosting `postMessage` bridge. Reads `meta[name="fcm-reg-key"]` / `localStorage`; sends `SHOWRUNNER_FCM_AUTH`, `SHOWRUNNER_SESSION`, token ACK to parent. Calls `saveMyFcmDeviceToken` when hosting delivers `SHOWRUNNER_FCM_TOKEN`. Re-registers on visibility resume.
- **`10c_Notifications_Admin.html`**: ROOT **push console** — VAPID save, fleet device grid, manual token modal, test/revoke/cleanup. Key UI: `renderPushAdminPanel`, `renderPushDeviceList`, `openPushTokenPeek` (hover popover + copy). Device row colors: Mobile=blue, Desktop=purple; Apple OS=orange; Android/Windows/Chrome=green; Safari=orange; PWA=blue, Browser=purple. Compact token hints (`abc…xyz`); full token in `window.__srPushTokenPeek`.

### GAS backend (copied to `dist/` by `build.js`)
- **`Notifications_Store.js`**: FCM device token storage (Script Properties `FCM_TOKEN_{uid}` JSON arrays). VAPID save, bridge/`fcmreg` registration, `saveMyFcmDeviceToken`, fleet admin `getFcmDevicesFleetAdminDetail` (cap 40 devices), revoke/cleanup, device metadata (platform, browser, delivery).
- **`Notifications_Push.js`**: FCM HTTP v1 send via service account OAuth. **Data-only** payloads (no top-level `notification` — avoids duplicate alerts with foreground handler). `sendTestPushNotification`, `sendTestPushToDevice`, `authorizeShowrunnerExternalRequests`.
- **`Notifications_Dispatch.js`**: Event-driven push — `dispatchPushToUsers` / `dispatchPushToCrewNames` (timeline crew changes, task assignees, etc.).

### `Main.js` JSONP / config endpoints
| Action | Purpose |
|--------|---------|
| `fcfg` | Firebase public web config + VAPID + hosting URL |
| `sessioncheck` | JSONP — validate `sm_session_token` before `sessionboot` (parent + Login) |
| `sessionboot` | Serve `Index.html` for valid session token; optional `srScan` → `pending-mobile-scan-b64` meta (phone QR handoff) |
| `mobscanstage` | JSONP — shell stages decoded QR tag in CacheService before iframe reload (`stageMobileScanPending_`) |
| `fcmreg` / `fcmregkey` | Token registration via reg key (hosting shell) |
| `fcmcheck` / `fcmping` | Token prefix verify + last-seen touch |
| `fcmrefreshkey` | Rotate registration key |

Boot payload also embeds `fcmRegKey` for logged-in users.

## 11. Push Hosting (Firebase — not GAS-compiled)

Deployed separately: `node deploy-hosting.js` (runs `push-hosting/prepare-hosting.js` to sync SW config from live `?action=fcfg`).

| Path | Role |
|------|------|
| `push-hosting/public/index.html` | Hosting shell page (iframe + push dock) |
| `push-hosting/public/host-boot.js` | Parent: **`sessioncheck` then `sessionboot`**; load GAS iframe **before** FCM; `SHOWRUNNER_SESSION_TOKEN` sync; foreground push handler; PWA install; `SW_BUILD` cache-bust. **Native station app** (UA contains `ShowrunnerStation`) is treated as standalone → **PWA install nag suppressed** (`isNativeStationApp()`). **Station RFID:** `showrunnerStationDeliverScan` → `postMessage SHOWRUNNER_RFID_SCAN` (fallback); station shell **primary** = `AndroidStation.pollScans()`. **Mobile QR:** shell camera `#sr-mobile-shell-cam`; **primary handoff** = iframe reload `sessionboot&srScan=` + `mobscanstage` backup; 20s dedupe — see [FRAGILE_ZONES.md](FRAGILE_ZONES.md) § Two-layer shell bridge. **Bump `index.html` `host-boot.js?v=` on every hosting change.** |
| `push-hosting/public/camera-embed.html` | Legacy same-origin camera embed (inside GAS iframe) — **not reliable** on phones; shell camera replaced it. |
| `push-hosting/public/mobile-scan.html` | Top-level PWA camera fallback (`mobile-scan.html?scan=1`). Camera works here but director wants integrated panel as primary UX. |
| `push-hosting/public/firebase-messaging-sw.js` | Service worker — background data messages |
| `push-hosting/public/manifest.json` | PWA manifest |
| `push-hosting/public/station-app.html` | **Station gun APK install page** (`/station-app` rewrite); reads `station-manifest.json`, downloads `showrunner-station.bin` as `.apk` |
| `push-hosting/public/downloads/station-manifest.json` | Published APK version/size/flag (written by `build-station-apk.js`) |
| `push-hosting/public/downloads/*.bin` | Built APK (gitignored; `.bin` because Spark forbids `.apk`) |
| `deploy-hosting.js` | Firebase deploy wrapper (repo root) |

**Firebase plan note:** Spark (free) **blocks `.apk` on Hosting** — the station APK ships as `showrunner-station.bin` with a `Content-Type: application/vnd.android.package-archive` + `Content-Disposition` header (see `push-hosting/firebase.json`) so Android still installs it.

---

## Global Command Index (@INDEX)

Below is the definitive list of all `@INDEX:` markers mapped inside the codebase files to segment large engines. You can use these markers to quickly jump to specific code logic blocks using search tools.

### 00c_UI_Forms.html
- `FORMS -> Crew & IAM Provisioning`
- `FORMS -> Asset Provisioning & QR`
- `FORMS -> Warehouse Roots`
- `FORMS -> Clients`
- `FORMS -> Vehicles`
### 00d_UI_Visuals.html
- `VISUALS -> Visual Settings (Timeline)`
- `VISUALS -> Visual Settings (Phase Manager)`
- `VISUALS -> Visual Settings (Strip Editor)`
- `VISUALS -> Visual Settings (Calendar)`
- `VISUALS -> Visual Settings (Mini Calendar)`
- `VISUALS -> Visual Settings (Month Roster)`
- `VISUALS -> Visual Settings (Project Assets)`
- `VISUALS -> Visual Settings (Asset Registry)`
- `VISUALS -> Data Managers (Assignments)`
- `VISUALS -> Data Managers (Colors)`
- `VISUALS -> Data Managers (Departments)`
- `VISUALS -> Data Managers (Meals)`
- `VISUALS -> Data Managers (Tags)`
### 00e_UI_Modals.html
- `MODALS -> Global Tasks`
- `MODALS -> Pickers & Context Menus`
- `MODALS -> Project Checklists`
- `MODALS -> Crew Leave / Managers`
- `MODALS -> Logistics Hub Engine`
- `MODALS -> Database Backup`
### 00f_Error_Report.html
- `ERROR_REPORT -> Top lip drawer (global bug report)`
### 01a_Calendar_Core.html
- `BOOT -> System Boot Sequence`
- `CALENDAR -> Main Dashboard Calendar Config`
- `DATA -> Contour Engine Interceptor`
### 01b_Calendar_Tasks.html
- `TASKS -> Render & Notifs`
### 01c_Calendar_Mini.html
- `MINI_CALENDAR -> Mini Calendar Editor Boot`
### 01d_Calendar_Mobile.html
- `MOBILE -> Dashboard & Views`
### 02a_Project_Equipment.html
- `PA_MODAL -> Project Assets Modal Management`
### 02b_Project_Syntax.html
- `SYNTAX_CLI -> Syntax Help Modal`
- `SYNTAX_CLI -> Unified Search Input Handler`
- `SYNTAX_CLI -> Live Syntax Execution`
- `SYNTAX_CLI -> Syntax Parser Engine`
- `SYNTAX_CLI -> Fuzzy Matching Engine`
### 02c_Project_Operations.html
- `OPERATIONS -> Start Operation UI`
- `OPERATIONS -> RFID Scan Handler`
- `OPERATIONS -> Trigger Manual Scan`
- `OPERATIONS -> Batch Ops Ledger Queue`
### 02d_Equipment_Render.html
- `PA_RENDER -> Main Equipment Rendering Loop`
### 02e1_Logic_State.html
- `PA_LOGIC -> Mode & View Toggles`
- `PA_LOGIC -> Group Targeting & UI Selection`
### 02e2_Logic_CRUD.html
- `PA_LOGIC -> Asset Provisioning & Mutations`
### 02e3_Logic_Clipboard.html
- `PA_LOGIC -> Cut/Copy/Paste Engine`
### 02e4_Logic_Containers.html
- `PA_LOGIC -> Item Packing & Unpacking`
- `PA_LOGIC -> Autonomous Packing Detection Engine`
### 02e5_Logic_Sync.html
- `PA_LOGIC -> Shortage Queue Processing`
- `PA_DELTA -> Calculate Equipment Deltas`
### 02g_Project_Reports.html
- `PRINT_STUDIO -> Modal UI & Mode Switching`
- `PRINT_STUDIO -> Filter Engine (Logistics Tree)`
- `PRINT_STUDIO -> Live Document Rendering & Output`
### 02_Project_Editor_Core.html
- `PRESENCE -> Presence Engine & Heartbeat`
- `PROJECT_CRUD -> Schedule Save & Sync`
### 02_Project_Editor_Logistics.html
- `LOGISTICS_WIZARD -> Logistics Hub & Autonomous Engine`
### 02_Project_Editor_Map.html
- `MAP_ENGINE -> Leaflet Geocoding & Weather`
### 04b_Equipment_Tracker.html
- `TRACKER -> State & Globals`
- `TRACKER -> Network & Fetching`
- `TRACKER -> Render Top Timeline & Playhead`
- `TRACKER -> Render Dynamic Grid List (Bottom Half)`
### 04_Month_Roster.html
- `ROSTER -> Open Month Roster UI`
- `ROSTER -> Render Matrix Grid`
- `ROSTER -> Leave Drag Engine`
### 05a_Truck_Arrangement.html
- `TRUCK_CAD -> Predictive Truck Packing`
### 05_Warehouse_Engine.html
- `WAREHOUSE -> Level 0 Root Drawer`
- `WAREHOUSE -> 2D CAD Render Engine`
- `WAREHOUSE -> Vector Polygon Drag`
### 06a_Admin_IAM.html
- `IAM -> Save Role Configuration`
- `IAM -> Render Directory`
### 06b1_Admin_Assets_Core.html
- `AUDIT_REGISTRY -> Bulk Review Toggles`
- `ASSET_REGISTRY -> Render Equipment Vault`
### 06b2_Admin_Assets_Form.html
- `ASSET_PROVISIONING -> Logic & Save`
- `KIT_BUILDER -> Logic & Render`
- `TAG_PICKER -> Asset Modal`
### 06b3_Admin_Assets_Audit.html
- `AUDIT_ENGINE -> Inline Audit & Data Extraction`
- `SMART_MERGE -> Smart Merge Modal`
### 06b4_Admin_Assets_QR.html
- `QR_STUDIO -> QR Print Generator`
- `QR_STUDIO -> Live Preview Engine`
- `QR_STUDIO -> Smart Document Title Generator`
### 06c_Admin_Visuals.html
- `VISUALS -> Apply Real-Time Theme`
### 06d_Admin_Fleet.html
- `FLEET -> Render Vehicle Database`
### 06e_Admin_Automation.html
- `AUTOMATION -> Save Manager Rules`
- `AUTOMATION -> Database Archivers`
### 06g_Admin_Database.html
- `DATABASE_OPS -> Sub-tab Router (backup | ops)`
- `DATABASE_OPS -> Live Status Load`
- `DATABASE_OPS -> Backup & Archive Pane`
- `DATABASE_OPS -> Ops & Notifications Pane (push admin host)`
### 06_System_Admin.html
- `ADMIN -> Resource Hub Tab Router`
### 07b_Grid_Engine.html
- `GRID_ENGINE -> Dynamic Styles`
- `GRID_ENGINE -> State & Globals`
- `GRID_ENGINE -> Render Core`
- `GRID_ENGINE -> Dynamic Settings Modal`
- `GRID_ENGINE -> Drag & Drop`
- `GRID_ENGINE -> Drag & Drop Settings List`
- `GRID_ENGINE -> Column Resizing`
### 07c_Generalization_Engine.html
- `GENERALIZATION -> Blueprint Engine`
### 07_Core_Globals.html
- `GLOBALS -> CSS Theme Engine`
- `GLOBALS -> Asset Utilities`
- `GLOBALS -> Live Tag Lexicon Parser`
- `GLOBALS -> Database Backup Engine`
### 08_Conflict_Manager.html
- `CONFLICTS -> Render Triage Drawer`
### 09_Financials_Hub.html
- `FINANCIALS -> Hub Boot & View Router`
- `FINANCIALS -> Payroll & Labor Engine`
- `FINANCIALS -> Interactive Ledger & Payments`
- `FINANCIALS -> Global Unpaid Viewer`
- `FINANCIALS -> Settings & Overheads`
### 10a_Notifications_Boot.html
- `PUSH_BOOT -> Hosting postMessage Bridge`
- `PUSH_BOOT -> saveMyFcmDeviceToken from Parent Token`
- `PUSH_BOOT -> Reg Key & Session Sync`
### 10c_Notifications_Admin.html
- `PUSH_ADMIN -> VAPID & Fleet Device Grid`
- `PUSH_ADMIN -> Device List Render & Color Tags`
- `PUSH_ADMIN -> Token Peek Popover`
- `PUSH_ADMIN -> Test / Revoke / Cleanup Actions`
### Notifications_Dispatch.js
- `NOTIFICATIONS -> Push Dispatch`
### Notifications_Push.js
- `NOTIFICATIONS -> FCM Push Send`
### Notifications_Store.js
- `NOTIFICATIONS -> FCM Token Store`
### build.js
- `PAYLOAD -> Dynamic Frontend Logic Injection`
### Conflicts.js
- `CONFLICTS -> Active Conflict Resolver`
### Index.html
- `SHELL -> Mobile Dashboard`
- `SHELL -> Global Left Nav`
### Integrations.js
- `DRIVE_API -> Dumb Vault Deployment`
- `DRIVE_API -> Generate Project Folders`
- `DRIVE_API -> Retroactive Drive Sync`
- `SYSTEM_CRON -> Weather Automations`
- `SYSTEM_CRON -> Setup Weather Trigger`
### Login.html
- `LOGIN -> Authenticate Form Submit`
### Logistics_Assets.js
- `PA_ENGINE -> Project Assets Logistics`
- `TRACKER_ENGINE -> Unified Equipment Matrix Data`
- `PA_ENGINE -> Master Logistics Aggregator`
### Logistics_Ledger.js
- `LEDGER_ENGINE -> Logistics_Ledger dual-write + inventory`
### Logistics_Projects.js
- `CRUD_PROJECTS -> Project & Checklists Save`
- `CRUD_PROJECTS -> Status & Lifecycle`
### Logistics_Roster.js
- `DATA_ENGINE -> Global Month Matrix`
- `FINANCIALS_ENGINE -> Payroll Data Scanner`
- `FINANCIALS -> Global Unpaid Scanner`
### Logistics_Schema.js
- `SCHEMA_ENGINE -> Relational Engine Schema`
### Logistics_Tasks.js
- `TASKS_ENGINE -> Tasks & Notifications`
### Logistics_Timeline.js
- `CRUD_ENGINE -> Project Timeline Data`
### Main.js
- `ROUTING -> Web App Get/Post`
- `ROUTING -> Firebase public config (fcfg endpoint)`
- `PAYLOAD -> High Speed Boot Payload`
### Operations.js
- `OPS_BACKEND -> Start Session`
- `OPS_BACKEND -> RFID Processor`
- `OPS_BACKEND -> Ledger Committer`
### Resources_Audit.js
- `AUDIT_LOG -> Enterprise Audit Logger`
- `ERROR_REPORTS -> User error report inbox (Error_Reports tab)`
- `AUDIT_DB -> External Audit & Merge Engine`
- `AUDIT_REVIEW -> Bulk Review Status Engine`
### Resources_Core.js
- `SCHEMA_VAULT -> Relational Schema Engine`
- `CACHE -> Sheet Data Caching`
### Resources_Migrations.js
- `MIGRATIONS -> Schema Upgrades`
### Resources_System.js
- `SYSTEM_CONFIG -> Global Settings & Tags`
### Resources_Vault.js
- `VAULT_CRUD -> Provision Assets & Entities`
- `IAM -> Provision New Asset`
### Resources_Warehouse.js
- `WAREHOUSE_DB -> Spatial Storage CRUD`
### Security.js
- `SECURITY -> User Authentication`
- `SECURITY -> User Security Profile Extractor`
### Styles.html
- `STYLES -> Core Theme Variables`
- `STYLES -> CSS Color Engine`

---

## Cursor IDE & agent entry

| Path | Purpose |
|------|---------|
| **`AGENTS.md`** (repo root) | Cursor auto-entry — points to doctrine |
| **`.cursor/rules/*.mdc`** | Short rules: `showrunner-core` (always), `mobile-pwa-hosting`, `equipment-fragile`, `session-bridge` (file-scoped) |
| **`.cursor/permissions.json`** | Terminal allowlist: `milestone.js`, `build.js`, clasp, etc. |
| **`docs/ai/CURSOR_WORKFLOW.md`** | Session routine, Bugbot/security gates, subagent usage |

---

## CSS / Structural UI

**Full specification:** [UI_DOCTRINE.md](UI_DOCTRINE.md) — mandatory for new buttons, modals, hubs, and tabs.

Quick reference: `btn-main`, `btn-outline`, `btn-outline-purple`, `btn-outline-orange`, `btn-tab`, `view-header`, `modal-title`, `input-label`, `crew-cb`, `btn-sm`. Do not use inline `padding: … !important` on buttons.
