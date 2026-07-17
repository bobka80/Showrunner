# Fragile Zones — Pre-Flight Checklist

**Entry:** [AI_DOCTRINE.md](../../AI_DOCTRINE.md) · **Map:** [README.md](README.md)

**Read this before editing** any code in the zones below. For full technical detail, see [ARCHITECTURE.md](ARCHITECTURE.md).

When the director reports a bug in these areas, state the risk in plain language before changing code (see [DIRECTOR_WORKFLOW.md](DIRECTOR_WORKFLOW.md)).

---

## Quick Reference

| Zone | Primary Files | Never Do | Safe Changes |
|------|---------------|----------|--------------|
| **Triangle of Truth** | `02b_Project_Syntax.html`, `02d_Equipment_Render.html` | Break bidirectional sync between human formula ↔ beautiful formula ↔ equipment list; rewrite slash parser casually | UI labels, non-parser display tweaks with testing |
| **Formula explosion** | `02e5_Logic_Sync.html` (canonical); **duplicates** in `02a_Project_Equipment.html`, `02_Project_Editor_Logistics.html` | Sum physical item qty on backend; edit one copy without checking others; disable `processFormulas()` without understanding | Bug fixes that preserve qty=1 burst rule for Physical types — sync all copies or consolidate |
| **Equipment model (Bulk / Matryoshka / two engines)** | [EQUIPMENT_MODEL.md](EQUIPMENT_MODEL.md) — **read before PA/warehouse answers** | Conflate Auto-Packing with Auto-Containerization; assume cables use `recalcAutoContainers`; assume bulk items can have RFID | Link to canonical model; code only in the correct engine |
| **Auto-Containerization** | `02e5_Logic_Sync.html` (`recalcAutoContainers`); called from `02e2`, `02e4`, `02e5` | Mix with bulk Auto-Packing; lock physical Case UIDs in planning UI | Fixes inside fluid kit logic only |
| **Auto-Packing (Bulk)** | `02e4_Logic_Containers.html` (`autoProvisionCableCases`); **called from** `02_Project_Editor_Logistics.html` | Touch predefined kits/fixtures; confuse with Auto-Containerization; re-run after physical cable-case bind without preserving bindings | Bulk cable/trunk logic in `02e4` only |
| **Unpack vs auto-pack rerun** | `02e4_Logic_Containers.html` (`unpackItem`, `autoProvisionCableCases`) | Casual unpack during active cable packing; re-run Auto-Pack without understanding `isGenericAuto` wipe | Planned: hold-to-unpack ~1.5s; preserve physical case binds when re-running |
| **Matryoshka / nesting** | `02e4_Logic_Containers.html`, `Operations.js` | Store "children arrays" on containers in DB; hard-allocate unit IDs during planning | Respect bottom-up `containerUid` linking |
| **UID / optimistic healing** | `02e5_Logic_Sync.html`, backend save paths | Leave duplicate `uid`s on burst clones | Delete `uid` on clones when splitting items |
| **CLI regex** | `02b_Project_Syntax.html` | "Clean up" the unified regex | Leave parser alone unless fixing a documented bug |
| **processFormulas duplicates** | `02e5` (canonical), `02a`, `02_Project_Editor_Logistics` | Edit one copy only | Sync all copies or consolidate to single source |
| **Generalization / Blueprint** | `07c_Generalization_Engine.html` | Force `assetId` matching on blueprint `{ name, qty }` rows | Accept intentional ID stripping |
| **Index.html wiring** | `Index.html` | Add HTML module without `<?!= include ?>` | Every production module must be included before build |
| **Build pipeline** | `build.js`, `gas-node-only.js`, root `.html`, `dist/` | Edit `dist/` manually; copy Node-only `.js` to `dist/`; deploy with bare `clasp push` (orphans linger); add root `.js` without `gas-node-only.js` entry | Edit source HTML → `node build.js` → `gas-push-sync` via milestone; run `node check-google-account.js` |
| **Node-only files on GAS (white screen)** | `gas-node-only.js`, `build.js`, `gas-push-sync.js`, `check-google-account.js` | Ship `milestone.js`, `check-google-account.js`, `git-push-backup.js`, etc. to Apps Script; rely on clasp push alone to remove them | Keep PC-only list in `gas-node-only.js`; milestone uses `gas-push-sync`; check #3 in `check-google-account.js` |
| **RBAC boot payload** | `Main.js`, `Index.html`, `Security.js` | Inject raw JSON permissions into HTML without Base64 | Keep `userPermissionsB64` + `atob()` pattern |
| **PWA session + login boot** | `push-hosting/public/host-boot.js`, `Login.html`, `Index.html` (session `postMessage`), `Main.js` (`sessionboot`, `sessioncheck`), `Security.js` | Change iframe load order; skip `sessioncheck` before `sessionboot`; clear parent session on every login screen paint; single-token login that kicks other devices without director approval | Token sync only via `SHOWRUNNER_SESSION_TOKEN`; validate server-side before `sessionboot`; multi-device sessions in `Security.js` |
| **Mobile QR camera (PWA)** | `push-hosting/public/host-boot.js`, `01j_Mobile_Scan.html`, `Main.js` (`sessionboot`/`mobscanstage`), `Station_Security.js`, `Index.html` | `getUserMedia` in GAS iframe; **`postMessage` as sole handoff**; parallel retry loops (relay + pending flush + burst pull + reload); forget `host-boot.js?v=` bump | Camera on **shell** (`#sr-mobile-shell-cam`); **primary handoff = iframe reload** `sessionboot&srScan=`; 20s dedupe; see § Two-layer shell bridge + § Mobile QR handoff |
| **Station RFID / native gun bridge** | `host-boot.js`, `11_Station_Shell.html`, `station-android/RfidManager.kt`, `station-desktop/MainWindow.xaml.cs`, `TslRfidManager.cs` | Rely on **`postMessage` or `ExecuteScript` on outer GAS frame only**; remove Chainway `pollScans()` pull; share BLE read/config workers; **TSL:** double inventory, inventory on connect; **Desktop:** grey `#sr-desktop-scan-feed` as “success”; `DiagnosticWindow.Owner = MainWindow`; session save on every Index ping — see § Desktop WebView2 + § TSL 1128 | **Chainway:** iframe `pollScans()` (~300 ms) primary; relay fallback. **Desktop TSL:** top `showrunnerStationDeliverScan` + nested iframe forward + all-frame invoke; inner `#station-shell` owns UI. **TSL gun:** SinglePressAction=Off + one gated read; see § Two-layer bridge + § Station RFID + § Desktop WebView2 + § TSL desktop |
| **Station native app lifecycle (APK)** | `station-android/AndroidManifest.xml`, `StationWebActivity.kt`, `RfidManager.kt` | Remove `keyboard`/`navigation` from `android:configChanges` (gun is an HID keyboard → connect/disconnect recreates the Activity → full WebView reboot); chase gun-flap resets in JS/session before ruling out Activity recreation | Keep the full `configChanges` list; absorb gun flap in `onConfigurationChanged`; see § Station native app — Android Activity lifecycle |
| **Station APK + hosting deploy** | `build-station-apk.js`, `deploy-hosting.js`, `push-hosting/prepare-hosting.js`, `station-manifest.json` | Add stdin prompts without `isTTY` guard (wedges shell); leave HTTP fetches undrained (hangs deploy); ship a lower `versionCode`; trust "deploy ran" without live verify | `--non-interactive` firebase + heartbeat/timeout; drain redirects + `process.exit(0)`; downgrade guard; post-deploy live-manifest verify; see § Station APK + Firebase hosting deploy pipeline |
| **App boot pipeline (black screen)** | `build.js`, `Index.html` includes, `LogicPayload_*`, `dist/Index.html` | Append bootloader after `</body>`; edit `dist/` manually; ship milestone without login smoke test | Bootloader **before** `</body>`; edit sources → `node build.js` → test login on **web.app + desktop** every milestone |
| **Warehouse ledger** | `Operations.js` | Mutate assignments directly during RFID chaos | Append to `Operations_Ledger` |
| **DAL prep / timeline session UI (dual-domain)** | `Dal_Sessions.js`, `02e6_Dal_Session.html`, `02e7_Dal_Firestore_Client.html`, `03a1_Timeline_Dal_Session.html`, `03a2_Timeline_Dal_Live.html` | Trust legacy flat `sessionType` when both domains open; clear prep latch on first “closed” poll; poll only for END not START; put `*/` inside `Dal_Sessions.js` block comments | Read `prepStatus` / `timelineStatus`; poll both START+END with grace; see § DAL prep/timeline session UI |
| **DAL timeline / prep fork live sync** | `03a2_Timeline_Dal_Live.html`, `02e7_Dal_Firestore_Client.html`, `host-boot.js` (`SHOWRUNNER_DAL_FS_*`), `Dal_Firebase.js`, `push-hosting/firestore.rules` | Full-doc / **full-collection** LWW overwrite; flush-on-every-remote; empty-touch “diff all locals”; Auth inside GAS iframe only; host reply only into `#app-frame`; skip Firebase Authentication enable; **PA host Auth without `LISTEN_COL` / `PA_BATCH_WRITE`**; prep PA **rewrite every asset doc on each flush** | Touch/patch merge + entity hold (+ timeline `writeSeq`); Auth/listen/write on **web.app host**; deep `frames` walk + `ev.source`; prep PA **patch-only** sets/deletes + per-UID merge; see § DAL timeline fork live sync **and** § DAL prep PA fork live sync |

---

## Triangle of Truth (Critical — Bidirectional)

The formula system has **three corners** that must stay in harmony:

1. **Human Written Formula** — Fast slash-based input (e.g. location segments separated by `/`). The operator types this in the CLI/search bar.
2. **Beautiful Formula** — Visual, human-readable representation of the same logic — for people who did not create the list or are reviewing it long after the fact.
3. **The List** — The actual equipment rows drawn from the Vault and assigned to the project.

**Bidirectional — not one-way:**

- **Formula → List:** When the human writes the slash formula the **first time**, the engine parses left-to-right and **draws equipment**, creating the list.
- **List → Formula:** The equipment list **also represents** the formula. Changes to the list must keep the beautiful formula and human formula consistent with what is actually assigned.

**Why "Triangle":** All three corners must agree. Breaking the parser, render loop, or list mutations severs the link — users can no longer trust what they typed, what they see, or what is in the database.

**AI rule:** Do not describe this as "the list reflects the formula" only. It is **mutual**. Never modify parser, renderer, or CRUD in one corner without verifying the other two still sync.

---

## PWA session bridge + login boot (Critical)

Showrunner on crew phones is **two layers**:

1. **Firebase hosting shell** (`web.app`) — `host-boot.js`, push dock, parent `localStorage` (`sm_session_token`, `sm_session_expires`)
2. **GAS iframe** — `Login.html` / `Index.html`, same `localStorage` keys, `postMessage` to parent

**Boot path after “stay signed in” (v310+):**

- Parent may open: `GAS/exec?action=sessionboot&token=…`
- Server validates token in `Security.js` → serves `Index.html` without passcode
- Iframe must `postMessage` `SHOWRUNNER_SESSION_TOKEN` so parent stores the **same** token

**Black screen ≠ always “session”.** Two failure modes:

| Symptom | Likely layer | Check |
|--------|----------------|-------|
| “Session expired” loop | Session bridge | Stale parent token; server rejected `sessionboot`; `clearSession` wiped parent |
| Black screen after auth | App boot | `LogicPayload_*` chunk load/eval failed; bootloader order wrong; JS syntax error in **any** included module |
| White screen + `require is not defined` | Node-only on GAS | A PC-only script (`check-google-account`, `git-push-backup`, `milestone`, …) was pushed to Apps Script — GAS runs every `.js` at startup |

**AI rules:**

1. **`sessioncheck` before `sessionboot`** — Parent (`host-boot.js`) and `Login.html` must confirm the token with `?action=sessioncheck` before redirecting. Never load `sessionboot` with a token the server will reject.
2. **Do not clear parent session casually** — Only `clearParentSession()` when `SHOWRUNNER_LOGIN_STATE` has `clearSession === true` (server-invalid), or after failed `sessioncheck`.
3. **Multi-device sessions** — `createUserSession_` adds a token; it must **not** revoke other devices’ tokens (cap: 8 per user). Logging in on phone must not kill desktop mid-shift.
4. **Iframe loads first** — `initShell()` sets `frame.src` **before** awaiting Firebase/FCM. Push setup must never block the iframe (v317 lesson).
5. **Every milestone smoke test** — After `node milestone.js`, director or AI verifies: open `web.app` (PWA path) **and** GAS URL on desktop → login or auto-boot → calendar/mobile home visible. Mobile-only notes still redeploy **the entire** `Index.html` payload.

**Deploy pairing:** Session logic spans GAS **and** hosting. If you change `host-boot.js`, run `node deploy-hosting.js` as well as `milestone.js`. GAS-only mobile UI changes do not require hosting — unless you also touched `push-hosting/`.

---

## Two-layer shell bridge (shared — PWA + station)

Showrunner on phones and warehouse guns uses the **same architecture**:

| Layer | Where | Owns |
|-------|--------|------|
| **Hosting shell** | `https://sm-showrunner-97405.web.app` — `push-hosting/public/host-boot.js` | Parent `localStorage`, push dock, **hardware** (camera, native BLE gun SDK), `#app-frame` iframe |
| **GAS app** | `script.google.com/.../exec` inside `#app-frame` | Login, calendar, mobile scan panel, station shell, vault, project assets |

```
web.app (host-boot.js)                 GAS iframe (Index / station shell)
        │                                       │
        │  postMessage often LOST ─────────────►│  (GAS sandbox nesting)
        │                                       │
        ├─ Camera: MUST run here                ├─ Scan panel UI + status actions
        ├─ Native gun → top frame only          ├─ pollScans() pull (RFID, primary)
        └─ Reliable handoff ≠ postMessage only  └─ boot meta / server cache (QR, primary)
```

**Proven on hardware (2026-07):**

| Capability | Works on | Fails on |
|------------|----------|----------|
| Phone QR camera | Top-level `web.app` shell (`#sr-mobile-shell-cam`) | `getUserMedia` inside GAS iframe; nested `web.app` iframe inside GAS |
| Scan result → app UI | Iframe reload with `srScan` (QR); server cache pull (backup) | Shell `postMessage` alone into `#app-frame` |
| Gun EPC → station strip (Chainway APK) | Iframe `AndroidStation.pollScans()` every ~300 ms | `evaluateJavascript('onStationRfidScan')` into iframe; lossy `postMessage` relay alone |
| Gun EPC → station strip (TSL desktop) | Top `showrunnerStationDeliverScan` → nested iframe → `onStationRfidScan` in **inner** GAS frame | `ExecuteScript` on **wrapper** `script.google.com` only → grey `#sr-desktop-scan-feed` shim; session in wrapper only → `no-session` |
| **DAL live Firestore (prep/timeline fork)** | Host shell Auth + listen/write (`SHOWRUNNER_DAL_FS_*`); reply via **`ev.source` + deep `window.frames` walk** into GAS nest; client posts up parent chain to `window.top` | Firebase Auth inside GAS iframe alone; host reply only into `#app-frame` / `querySelectorAll('iframe')` on host DOM (never reaches nested Index) → Auth timeout → `server patch` |

**Shared AI rules (both bridges):**

1. **Top frame owns hardware** — camera permission and BLE SDK calls run in the shell or native app, not inside the GAS document.
2. **Iframe owns business UI** — equipment name, status buttons, vault, checkout.
3. **`postMessage` is best-effort only** — never the sole delivery path for scan results.
4. **Dedupe is mandatory** — QR: 20 s (`hostMobileScanLastDeliveredTag_` / `MOBILE_SCAN_DELIVERED_KEY`); RFID: ~1.5 s (`stationLastScanTag`).
5. **One primary path** — do not stack relay burst + pending retry loop + burst pull + reload; that caused the v466 QR infinite re-read loop.
6. **`host-boot.js?v=` bump** — bump `push-hosting/public/index.html` cache-buster on every hosting change (v415 lesson: stale shell = “fix shipped but field unchanged”).
7. **Deploy pairing** — `host-boot.js` changes need `node deploy-hosting.js` **and** GAS milestone when `01j` / `Main.js` / `Station_Security.js` also change.
8. **`host-boot.js` is shared** — mobile QR camera paths and station RFID relay live in the same file; read both sections below before editing either.

**Active campaign (in flight):** RFID station + TSL desktop gate PC — [active/rfid-station-profiles.md](active/rfid-station-profiles.md) · **Desktop architecture:** [active/tsl-desktop-handoff.md](active/tsl-desktop-handoff.md). Phone QR polish closed — see [topics/mobile-crew.md](topics/mobile-crew.md).

---

## Mobile QR scan handoff (shipped v466–467)

**Goal:** Crew phone PWA — header **Scan** → integrated panel → **OPEN CAMERA** → read asset QR → show equipment + status actions **without** navigating away to a separate scan page.

**QR format:** Labels encode vault identity (e.g. **Robin WashBeam 1000 #20** → `RW-1000-20`). Lookup: `resolveMobileScanTag` / `findAssetByScanTagInVault_` in `Station_Security.js`.

### End-to-end flow (working path)

```
1. User opens scan panel (01j_Mobile_Scan.html in GAS iframe)
2. OPEN CAMERA → postMessage SHOWRUNNER_MOBILE_SCAN_OPEN_CAMERA { sessionToken }
3. Shell opens #sr-mobile-shell-cam on web.app (user tap → getUserMedia)
4. On decode → hostMobileScanDeliverScan_(tag):
     a. Stage once: GET ?action=mobscanstage&token=&tag=  (CacheService, 5 min TTL)
     b. PRIMARY: reload iframe → sessionboot&token=…&srScan=TAG
     c. Clear parent pending storage immediately (no retry loop)
5. Iframe boots → meta pending-mobile-scan-b64 → mobileScanConsumeBootPending_()
6. mobileScanHandleDecode_ → server/map lookup → panel shows equipment
7. mobileScanAckParent_ → SHOWRUNNER_MOBILE_QR_SCAN_ACK (parent stops any stale state)
```

**Backup only (do not make primary):** `pullStagedMobileScan` via `google.script.run` + short campoll after OPEN CAMERA; `mobile-scan.html` full-page fallback if shell camera unavailable.

### File map

| File | Role |
|------|------|
| `push-hosting/public/host-boot.js` | Shell camera, `hostMobileScanDeliverScan_`, `hostMobileScanNavigateIframeWithScan_`, dedupe, `showrunnerStationDeliverScan` (RFID — separate section) |
| `push-hosting/public/index.html` | `#sr-mobile-shell-cam`, `#app-frame`, `host-boot.js?v=` cache-buster |
| `01j_Mobile_Scan.html` | Panel UI, decode, vault resolve, `mobileScanConsumeBootPending_`, campoll, dedupe |
| `Index.html` | `hostingMobileScanRelay_` forwarder (best-effort); scan panel DOM |
| `Main.js` | `sessionboot` passes `srScan` → `pendingMobileScanB64`; `mobscanstage` JSONP |
| `Station_Security.js` | `stageMobileScanPending_`, `pullStagedMobileScan`, `resolveMobileScanTag` |
| `push-hosting/public/mobile-scan.html` | Fallback top-level camera page (director dislikes as primary UX) |

### Never do

- Call `getUserMedia` inside the GAS iframe or embed a `web.app` camera iframe inside GAS.
- Use **`postMessage` relay burst** as the only handoff after camera decode (proven lost on HyperOS / iPhone PWA).
- Keep `sm_mobile_qr_pending` in parent storage **and** run a 24 s flush/retry loop **after** reload delivery — re-stages and re-injects the same tag (v466 loop bug).
- Run **relay + flush + burst pull + reload** simultaneously — pick **reload as primary**, others backup or remove.
- Remove **20 s dedupe** on shell and iframe (`hostMobileScanShouldIgnoreDeliver_`, `mobileScanShouldIgnoreDelivered_`).
- Ship `host-boot.js` without bumping `?v=` in `push-hosting/public/index.html`.
- “Simplify” by navigating parent to `/?srScan=` — caused re-auth loop (v458).

### Safe changes

- Panel copy, status line, simulate button, vault lookup rules (server-side).
- Shell camera UI (`#sr-mobile-shell-cam` styles, tap gate copy).
- Post-scan status actions (`setMobileAssetStatus`) — not the handoff layer.

### Test checklist (after any touch)

1. Force-refresh PWA (new `host-boot.js?v=`).
2. **Simulate RW-1000-20** — resolves without camera (proves lookup path).
3. **Real camera** — one scan → one result → **no loop**; second different QR updates selection.
4. Desktop `web.app` login still works (unrelated but mandatory on milestone).

---

## Station RFID scan delivery (shipped v419+)

**Goal:** Gun EPC reaches station live strip and host/vault flows — **Chainway APK** and **TSL desktop** use different native delivery but the **same inner station shell** (`11_Station_Shell.html`).

### Chainway APK — end-to-end (working path)

```
1. RfidManager.kt reads tag on BLE trigger
2. Native queues EPC in pendingScans
3. Station shell (11_Station_Shell.html) polls AndroidStation.pollScans() ~every 300 ms
4. onStationRfidScan(epc) → strip / host login / vault record / checkout
```

**Fallback (keep, do not rely on for Chainway):**

- Top frame `showrunnerStationDeliverScan(tag)` → `postMessage SHOWRUNNER_RFID_SCAN` into iframe (`host-boot.js`).
- Direct `evaluateJavascript('onStationRfidScan…')` — only hits top frame, not station listeners.

### TSL desktop — end-to-end (working path, v0.1.40+)

```
1. TslRfidManager.cs trigger read → DeliverScanToPage
2. RelayScanToTopHosting → web.app showrunnerStationDeliverScan (relay=top)
3. host-boot.js postMessage SHOWRUNNER_RFID_SCAN → #app-frame
4. GAS wrapper forwards to nested iframe(s) (__srForwardScanToNested_)
5. Inner Index / station-shell: onStationRfidScan → stationHandleRfidScan_ → equipment name in Scan panel
6. Backup: ExecuteScript on all live WebView2 frames (prefer ok/forwarded, not shim)
```

**Desktop session (required for host login + resolved names):** inner login → `window.top.postMessage(SHOWRUNNER_SESSION_TOKEN)` + `AndroidStation.saveSession` → `desktop-prefs.json` → parent `sessionboot`. See § Desktop WebView2 station.

**Gun settings (both):** prefer **direct** `window.AndroidStation.setPower/setScanMode/setBeep/setPollMs` when `native=true`; `SHOWRUNNER_STATION_CONFIG_GET/SET` via `host-boot.js` relay only when interface absent.

### Never do

- Remove **Chainway `pollScans()` pull** while “fixing” the relay — relay alone was the v414 “gun beeps, nothing in app” bug.
- **Desktop:** deliver scans only to the **outer** `script.google.com` frame — hits BridgeShim grey box, not `#station-scan-panel`.
- **Desktop:** treat grey `#sr-desktop-scan-feed` as the product UI when profile name is visible (means wrong layer).
- Share BLE **read worker** with config/device-info SDK calls — hung trigger reads (v412).
- Ship `host-boot.js` RFID handlers without `?v=` bump.
- Assume `postMessage` from shell always reaches `11_Station_Shell.html` listeners without **nested forward** (desktop GAS nesting).

### Dedupe

`stationLastScanTag` + ~1.5 s window — one physical pull must not enqueue duplicate strip rows (poll + relay both active on Chainway; native + web dedupe on desktop).

**Full field chronology:** [active/rfid-station-profiles.md](active/rfid-station-profiles.md) · [active/tsl-desktop-handoff.md](active/tsl-desktop-handoff.md) · [topics/logistics-warehouse.md](topics/logistics-warehouse.md).

---

## TSL 1128 desktop gun driver (Critical)

**Files:** `station-desktop/ShowrunnerStationDesktop/TslRfidManager.cs`, `GunPortDetector.cs`, `MainWindow.xaml.cs` (WebView scan relay).

**Profile:** `tsl_dock_desktop` · **Not** Chainway — different SDK (TSL ASCII over virtual COM), same web bridge surface.

### Connect path (must never share the read gate)

```
Watchdog (2.5s) → GunPortDetector → ConnectToPort → serial open → .vr version probe → switch/beep setup → live
```

| Rule | Why |
|------|-----|
| **Connect uses `_commandLock` only** | v0.1.17 put connect behind the same gate as trigger reads → watchdog logged `Connect skipped — command in progress` forever while continuous/trigger held the gate |
| **Read gate (`_readGate`) is trigger-only** | Serializes inventory reads; connect/config/sleep bypass it |
| **Watchdog fires immediately** (`dueTime=0`) | Delayed first tick added 2.5s dead time on cold boot |
| **Before each connect sweep:** `StopContinuous()` + `ResetReadGate()` | Stale read loop must not block reconnect |
| **Outgoing BT COM only** | Incoming `000000000000` ports never connect — see `GunPortDetector` |

**Audit log (persists across restarts):** `%LOCALAPPDATA%\ShowrunnerStation\connect-lock.log`  
Each line: timestamp · phase · port · ok · readGate · detail. Phases: `connect-try`, `connect-ok`, `connect-fail`, `connect-error`, `no-ports`, `read-gate-reset`, `watchdog-tick`.  
Mirror in F12 diagnostics under `[CONN]`.

### Stable trigger model (v0.1.17+)

```
Trigger pull → Switch Single event (debounced) → ONE serialized inventory command → DeliverScan → web
```

| Rule | Why |
|------|-----|
| **`SinglePressAction = Off` always** | Gun firmware must **not** inventory on its own — app owns the only inventory per trigger |
| **One read gate** (`_readGate`) | TSL SDK sample uses *connected and idle* — overlapping trigger reads cause multi-beep; **not** for connect |
| **No full inventory on connect/reconnect** | `SeedInventoryParameters` + watchdog reconnect = **unprompted beeps** — use `TakeNoAction=true` param push only |
| **Do not `Abort` on every Switch Off** | Only abort when **continuous** mode is running — abort in single mode disrupts in-flight reads |
| **Scan modes:** `single` \| `multi` \| `continuous` | Must match web settings (`11_Station_Shell.html`) — `multi` is **not** the same as `continuous` |

### Never do (regression magnets)

- Set **`SinglePressAction = Inventory`** while **also** calling app `PerformSingleRead` on trigger → **double inventory** (4 beeps, erratic counts).
- Run **`ExecuteCommand(_inventory)`** on connect, power change, or watchdog retry → **RF without trigger**.
- Put **connect / sleep / ForceReconnect** behind the **read gate** — connect silently fails until app restart (v0.1.17 regression).
- Fire **`Task.Run(PerformSingleRead)`** without a read gate → overlapping reads when switch bounces.
- Call **`StopContinuous()` / `AbortCommand`** on every `SwitchState.Off` in single mode.
- Remove **`pollScans()`** pull or top-frame queue steal fixes while “fixing” live strip — see § Station RFID scan delivery above.
- Pick **incoming** BT COM port (`000000000000`) — use `GunPortDetector` outgoing filter only.

### Settings path (web → gun)

`stationSyncSettingsToGun_()` → `AndroidStation.setPower/setScanMode/setBeep/setPollMs` (iframe or host-boot relay) → `TslRfidManager`. Power updates `_inventory.OutputPower` only — **no inventory command**.

### Test checklist (after any TSL desktop touch)

0. Cold start — within a few seconds status shows **Connecting** then **Gun connected** (check `connect-lock.log` for `connect-ok`).
1. Connect — **no beep** until trigger pulled.
2. **Single** mode — one pull → **one beep** → one `Read:` line → live strip row (or diagnostic `DeliverScan`).
3. Change sensitivity in Settings → status shows `Sensitivity N dBm` — **no extra beep**.
4. **Multi** mode — one pull → short burst, not endless.
5. No beeps when gun sits idle for 30 s.

**Chronology:** [active/rfid-station-profiles.md](active/rfid-station-profiles.md) § Desktop TSL station · [active/tsl-desktop-handoff.md](active/tsl-desktop-handoff.md).

---

## Desktop WebView2 station delivery (Critical)

**Files:** `station-desktop/ShowrunnerStationDesktop/MainWindow.xaml.cs`, `StationBridge.cs`, `DesktopPrefs.cs`, `ScanDiagnostics.cs`, `push-hosting/public/host-boot.js`, `Index.html`, `Login.html`, `build.js`, `11_Station_Shell.html`.

**Profile:** `tsl_dock_desktop` · **Field status (2026-07-11):** login, logout, RFID → **equipment name + unit** in real station UI (Desktop **0.1.40**, GAS **525**).

**Full architecture:** [active/tsl-desktop-handoff.md](active/tsl-desktop-handoff.md) — four WebView layers, session path, scan path, diagnostics.

### Layer model (do not collapse to “two layers”)

| Layer | URL / host | Owns |
|-------|------------|------|
| 1 Native | WPF WebView2 host | COM gun, `DeliverScanToPage`, prefs file, F12 diag |
| 2 Hosting | `sm-showrunner-97405.web.app` | Parent `localStorage`, `showrunnerStationDeliverScan`, `#app-frame` |
| 3 GAS wrapper | `script.google.com/.../exec` | Nested iframe shell; BridgeShim **emergency only** |
| 4 GAS inner | `googleusercontent` / Index | `#station-shell`, LogicPayload, `onStationRfidScan`, host login |

### Session fragile points

| Rule | Why |
|------|-----|
| **`postSessionToParent` → `window.top`** (not parent only) | Wrapper is layer 3; web.app parent is layer 2 — token never reached `sessionboot` otherwise |
| **`AndroidStation.saveSession` + `desktop-prefs.json`** | Desktop native boot reads prefs before iframe has token |
| **Dedupe `TryPersistSession`** | Index `pingHostingParent` every ~1.5 s — undeduped saves caused boot reschedule loop + log spam |
| **`SHOWRUNNER_STATION_READY` only when `full: true`** | Early boot in `build.js` must not notify native — false `shellReady` |
| **Do not clear parent session on desktop kiosk** | `ShowrunnerStation` UA + auto pin — clearing parent breaks sessionboot |

### Scan fragile points

| Rule | Why |
|------|-----|
| **Top relay first** (`relay=top`) | Matches Android; hits `host-boot.js` before frame guessing |
| **Nested iframe forward** in wrapper shim | Layer 2 postMessage stops at layer 3 without forward |
| **All live frames invoke** | Backup when postMessage lost; pick inner frame with `hasStationShell:true` |
| **Never treat `GAS invoke=shim` as success** when profile UI visible | Shim = `#sr-desktop-scan-feed` grey box, not Scan panel |
| **Do not re-enable top `pollScans()` on WebView2** | Steals queue from iframe path; desktop uses direct invoke + relay |
| **Serialize WebView scripts** (`_webScriptLock`) | Concurrent ExecuteScript caused races and empty probes |

### Diagnostics fragile points

| Rule | Why |
|------|-----|
| **Never `DiagnosticWindow.Owner = MainWindow`** | Disables main window → WebView2 crash on F12 (v0.1.39 fix) |
| **Always log to `scan-diag.log`** | `%LOCALAPPDATA%\ShowrunnerStation\scan-diag.log` — survives UI crash |
| **Launch via `RUN-STATION.bat` only** | Stale exe holds COM3; old publish folders mislead field tests |

### Never do (regression magnets)

- Probe or invoke **only** the first `script.google.com` frame — that is the wrapper, not `#station-shell`.
- Remove nested forward or top `showrunnerStationDeliverScan` while “simplifying” desktop delivery.
- Re-add sync `hostObjects.sync.androidStation` calls from iframe on the UI thread.
- Post `SHOWRUNNER_STATION_READY` from `build.js` early boot block.
- Save session on every bridge ping without token/expiry dedupe.
- Change `host-boot.js` mobile QR paths without reading § Mobile QR handoff (shared file).

### Test checklist (after any desktop WebView / session / scan touch)

1. `RUN-STATION.bat` — one process, COM connects after trigger wake if needed.
2. Login or auto pin — **one** “Session saved to desktop prefs” per login (not scrolling loop).
3. `sessionboot check: {"boot":true}` in log when appropriate.
4. Scan asset tag — **equipment name + unit** in Scan panel; **no** grey bottom bar.
5. Scan crew badge — host badge appears; equipment scan respects host.
6. Logout — clean host-empty state; can log in again.
7. F12 diagnostics — opens without crash; Escape hides; “Open log file” works.
8. Phone PWA / Chainway APK smoke if `host-boot.js` or `Index.html` session posts changed.

---

## Station native app — Android Activity lifecycle (APK) (Critical)

**Files:** `station-android/app/src/main/AndroidManifest.xml`, `StationWebActivity.kt`, `RfidManager.kt`.

**The gun is a Bluetooth HID keyboard.** The Chainway trigger arrives as a `KeyEvent` (`onKeyDown`) — to Android the paired gun is a **hardware keyboard / navigation device**. This has one dangerous consequence:

> **Connecting or disconnecting the gun changes the device `keyboard`/`navigation` configuration.** If `StationWebActivity` does not declare those in `android:configChanges`, **Android destroys and recreates the Activity** on every gun flap — the WebView is rebuilt from scratch (station cold boot, SYSTEM SECURE, host badge lost, ~20s). This was the chronic "app restarts on gun disconnect/reconnect" bug, misdiagnosed for many versions as a session/renderer problem.

**Manifest requirement (never remove):**

```
android:configChanges="keyboard|keyboardHidden|navigation|orientation|screenSize|uiMode|screenLayout|smallestScreenSize|density|fontScale|locale"
```

`keyboard` **and** `navigation` are the load-bearing flags for gun flap. `keyboardHidden` alone is **not** enough (it only covers soft-keyboard visibility, not the keyboard *device* changing). With these declared, the change is delivered to `onConfigurationChanged` and the WebView survives untouched.

**Never do:**
- Remove `keyboard` or `navigation` from `configChanges` "to clean it up" — the reboot returns instantly.
- Assume a WebView reload on gun flap is a JS/session bug — check for Activity recreation **first** (breadcrumb below).
- Chase BLE-reconnect UI resets in `host-boot.js` / `Login.html` / session logic before ruling out native Activity recreation.

**Breadcrumb:** `onConfigurationChanged` bumps a SharedPreferences counter and calls `window.stationOnGunConfigChange_(count)` → quiet "Gun link changed (N) — session kept" toast. If the toast shows and the UI stays put, the flap is absorbed correctly. `onRenderProcessGone` writes a separate `window.__srRendererGone` breadcrumb (renderer death is a *different*, rarer cause).

**Related renderer hardening (APK 0.1.35):** `setRendererPriorityPolicy(RENDERER_PRIORITY_IMPORTANT, waivedWhenNotVisible=false)` keeps the renderer alive off-screen. Kept as defense-in-depth; it did **not** fix the gun-flap reboot (that was Activity recreation, not renderer death).

---

## Station APK + Firebase hosting deploy pipeline (Critical)

**Files:** `build-station-apk.js`, `deploy-hosting.js`, `push-hosting/prepare-hosting.js`, `push-hosting/public/station-app.html`, `push-hosting/public/downloads/station-manifest.json`. **Canonical workflow:** [DEPLOY_AND_ROLLBACK.md](DEPLOY_AND_ROLLBACK.md) § Station APK + hosting pipeline.

The station APK ships **separately** from GAS: `node build-station-apk.js "<notes>"` → `node deploy-hosting.js`. The `/station-app` page reads the **live** `station-manifest.json`; that is what the director sees as "Build N". Hard-won pitfalls, all now guarded:

| Pitfall | Symptom | Guard (do not remove) |
|---------|---------|-----------------------|
| **`prepare-hosting.js` never exits** | Deploy **hangs forever right after `Config project: … appId: set`**; never reaches Firebase | It fetches config from Apps Script, which **302-redirects**; the redirect response must be **drained** (`res.resume()`) and `main()` ends with **`process.exit(0)`**, else a lingering keep-alive socket holds the event loop open and stalls `deploy-hosting.js` |
| **Firebase CLI blocks on a hidden prompt** | Deploy stuck with no output (auth refresh / usage-consent / update notice) | `firebase deploy --only hosting` runs **`--non-interactive`** (+ `NO_UPDATE_NOTIFIER`, `shell:true`) so it **fails fast** instead of hanging; a **20s heartbeat** + **10-min hard timeout** make a true hang visible and self-aborting |
| **versionCode downgrade** | "App not installed" on the tablet (Android blocks lower `versionCode`) | `build-station-apk.js` reads the highest published `versionCode` (manifest + history) and **refuses to build a lower one** |
| **Stale download page** | Site still serves the old build after a half-run / dead shell | `deploy-hosting.js` **fetches the live manifest after deploy** and confirms the served `versionCode` matches; warns + exits non-zero on mismatch |

**Never do:**
- Add a `readline`/stdin prompt to any pipeline script without an `!process.stdin.isTTY` guard — an AI agent / CI shell has no keyboard and will **hang forever, wedging the whole terminal session** (this is exactly what `rollback.js` did — see Incident Log 2026-07-08).
- Leave an HTTP fetch in a deploy script without draining the response and forcing exit.
- Assume "deploy ran" without the `[verify] OK — live site serves build N` line.

---

## Node-only files must never ship to GAS (white screen)

**Plain language:** Showrunner is built on your PC, then uploaded to Google. Some files are **only for your PC** (they use Node’s `require`). If one of those lands on Google by mistake, the live app **crashes on load** — white screen, error like `ReferenceError: require is not defined`. This is **not** task notes, RELEASES notes, or in-app data.

**How it happens:**
1. `build.js` copies root `.js` files into `dist/` for upload — anything not on the block list can leak.
2. Plain **`clasp push` does not delete** files already on Google’s server. Removing a file locally leaves an **orphan** online until `gas-push-sync` runs (milestone does this).

**Canonical block list:** root **`gas-node-only.js`** (used by `build.js` and `check-google-account.js`).

**Known leaks (fixed):** `check-google-account.js` @ v363–364; `git-push-backup.js` @ v377–378; **`rollback.js` @ v486** — top-level `require()` threw `ReferenceError: require is not defined (line 24, file "rollback")` on **every** server call, white-screening the live app; fixed v487 (added to `gas-node-only.js` + `.claspignore`, orphan removed by `gas-push-sync`).

**AI rules:**
1. New root `.js` tooling → add to **`gas-node-only.js`** immediately (and `.claspignore` if clasp might see it).
2. Never end a milestone with bare `clasp push` — use **`gas-push-sync`** via `milestone.js` / `dev-push.js`.
3. After deploy issues, run **`node check-google-account.js`** — **check 3** lists any PC-only scripts still on the live project.
4. **Smoke test** web.app login after every milestone (see boot pipeline above).

**Director symptom:** White screen right after an update → tell the AI the **file name in the error** (e.g. `git-push-backup`).

---

## DAL prep / timeline session UI (dual-domain) (Critical)

**Campaign:** [active/data-access-layer.md](active/data-access-layer.md) · **Slice D:** [active/dal-phase4-slice-d-dual-domain-sessions.md](active/dal-phase4-slice-d-dual-domain-sessions.md) · **Design lock:** [active/dal-firebase-design-lock-2026-07-13.md](active/dal-firebase-design-lock-2026-07-13.md)

**Plain language:** Prep and timeline collab can both be open on one project (independent forks). The **banners and START/END buttons** are UI state synced across browsers. Getting that sync wrong looks like “collab died” or “prep never started on the other PC” even when the server fork is fine.

**Primary files:**

| File | Role |
|------|------|
| `Dal_Sessions.js` | Dual-domain registry on `Projects_Index`; `getDalSessionInfo`; begin/finish/close |
| `02e6_Dal_Session.html` | Prep START/END UI, latch, Sheets poll |
| `02e7_Dal_Firestore_Client.html` | Prep Firestore `_meta` + live PA sync |
| `03a1_Timeline_Dal_Session.html` / `03a2_Timeline_Dal_Live.html` | Timeline collab START/END + session watcher |

### Never do

1. **Trust legacy flat `sessionType` / `status` when both domains may be open.** Those fields preferred prep and made timeline collab look closed (banner gone, START COLLAB stuck) while the timeline fork was still live (**v604**). Always read **`prepStatus` / `timelineStatus`** (or nested `prep` / `timeline`). When both domains are active, flat legacy fields are intentionally empty.
2. **Clear the prep latch on the first “closed” Sheets poll.** Prep UI latches open (`dalPrepLatched`) so flaky reads cannot flicker. Remote END PREP must use `allowClose: true` (Firestore `_meta` gone **or** confirmed Sheets poll). A close-only poll with no grace **wiped remote START PREP** when Sheets lagged Firebase (**v605 → v606**).
3. **Poll only for END, not START.** While Project Assets is open, the prep poll must detect **remote START and remote END**. Stopping the poll when not latched breaks “other PC started prep.”
4. **Put `*/` inside a `Dal_Sessions.js` block comment** (e.g. `prep*/timeline*`). It terminates the comment early → GAS syntax error → white screen / failed push (same class as **v577** `persist*/fetch*` in `Dal_Repos.js`).
5. **Hold ScriptLock across Firestore UrlFetch** on open/close — starves presence and times out START COLLAB (fixed earlier in Phase 4 hotfixes).

### Safe rules (locked)

| Concern | Rule |
|---------|------|
| Dual-domain reads | Client: `prepStatus` / `timelineStatus`. Server close: always pass `'prep'` or `'timelineCollab'`. |
| Prep remote sync | Fast path: Firestore `projects/{id}/assets/_meta`. Safety: Sheets poll while PA open — **both** open and close. After a fresh open: **~8s grace** + **two consecutive closed polls** before `allowClose`. |
| Timeline remote sync | Session watcher polls `getDalSessionInfo` → `dalTimelineInfoFromSession_` (domain fields only). |
| Sheet vs UI | Banner sync is **not** Sheet truth. Fork may be correct while UI is wrong — fix clients, do not “re-open” blindly. |

### Smoke (after any session-UI / `Dal_Sessions` change)

Hard-refresh **two browsers**:

1. Timeline collab both sides → START COLLAB → banners stick.  
2. Leave timeline on A (no END COLLAB) → START PREP on A → B’s **collab banner must stay**.  
3. Both in Project Assets → START PREP on A → B shows prep within a few seconds.  
4. END PREP on A → B clears within a few seconds.  
5. Optional: both domains open → END COLLAB / END PREP independently — other domain stays live.

**AI rule:** Before editing these files, state the dual-domain + latch risk in plain language. Prefer small ships with the smoke above over “one more poll tweak” without both START and END covered.

---

## DAL timeline fork live sync (collab strips)

**Campaign:** [active/data-access-layer.md](active/data-access-layer.md) · Design lock: Sheets = long-term DB; Firebase = **session buffer** while collab/prep is open.

**Plain language:** While START COLLAB is open, everyone edits one Firestore doc (`projects/{id}/timeline/state`). If two browsers rewrite the whole grid from stale local copies, strips **stutter left↔right**. Live sync must be **touch/patch** (only what you moved), with ordering guards — not last-full-document-wins.

**Primary files:**

| File | Role |
|------|------|
| `03a2_Timeline_Dal_Live.html` | Touch maps, patch merge, flush, apply, `writeSeq`, entity hold, banner `patch` vs `server patch` |
| `02e7_Dal_Firestore_Client.html` | Host bridge client (`SHOWRUNNER_DAL_FS_*`) + iframe Auth fallback; prep PA **collection** listen + `_meta` doc listen |
| `push-hosting/public/host-boot.js` | Host Auth / doc listen / **collection listen** / patch-write; deep `window.frames` reply walk |
| `Dal_Firebase.js` / `Dal_Firebase_Auth.js` | Fork snapshot/commit; custom token mint |
| `push-hosting/firestore.rules` | Client read/write while `request.auth.token.showrunner` |

### Never do

1. **Full-document LWW from either browser.** Untouched strips must keep the remote version. Empty-touch “upsert every local diff” recreated A↔B write wars.
2. **Flush Firebase on every remote snapshot while dirty.** That turns every peer edit into a counter-write → stutter loop. Keep touches; let the pending/in-flight flush publish.
3. **Re-install the grid from your own write result** when the UI already shows the drag — causes flicker even when data is correct.
4. **Run Firebase Auth / Firestore only inside the GAS iframe** on web.app. Auth domains + nesting fail → `server patch`. Auth + listen + write belong on the **host shell**; reply via **`ev.source` + deep `frames` walk** (not only `#app-frame`). Prep PA must use host **`LISTEN_COL`** — Auth-only without collection listen silently falls back to slow GAS poll.
5. **Ship host bridge without Firebase Console → Authentication → Get Started.** Custom tokens alone yield `auth/configuration-not-found`.
6. **Apply stale `fromCache` snaps** after a live server version — yank strips back to old positions.
7. **Hold ScriptLock across Firestore UrlFetch** on session open/close (starves presence / START COLLAB timeout).

### Safe rules (locked)

| Concern | Rule |
|---------|------|
| Merge | Start from **remote**; apply only `touched*` / `deleted*` maps. |
| Ordering | Monotonic **`writeSeq`** on the state doc; ignore snaps with `writeSeq < lastApplied`. |
| Local yank guard | After touch/write, **entity hold ~2s** — remote cannot move that id until hold expires. |
| Echo | Own `clientId` acks without re-install; ignore duplicate applied sig. |
| Banner | `live sync (patch)` = host/direct Firestore. `server patch` = GAS poll fallback (slow). Prep PA: `live sync (direct)` = Firestore listen (host or iframe); `live sync (server)` = GAS poll. |
| Scale | One doc per project timeline — fine for a small crew; same-strip edits are last-write-wins on that entity. |
| Prep vs timeline | Independent forks (Slice D). Closing one must not commit/delete the other. Prep live feel: host collection listen + `_meta` doc listen. Prep **row** sync: § DAL prep PA fork live sync (patch-only + entity hold). |

### Smoke (after any live-sync / host-bridge change)

Hard-refresh **two browsers** on web.app (banner must say **patch**, not server patch):

1. A moves crew1, B moves crew2 (overlapping in time) — both stick; no left↔right loop.  
2. A drags one strip back and forth quickly while B idles — A’s strip stays put; no oscillation.  
3. Optional third browser — edit a third crew; no thrash.

**AI rule:** Before editing live-sync or host DAL FS bridge, state stutter/Auth/nest risk in plain language. Ship GAS **and** `node deploy-hosting.js` (bump `host-boot.js?v=`) when host-boot changes.

---

## DAL prep PA fork live sync (equipment list)

**Campaign:** [active/data-access-layer.md](active/data-access-layer.md) · Same Firebase session-buffer rule as timeline; different shape (**many docs** under `projects/{id}/assets/*`, not one state doc).

### Timeline vs prep PA (same bug class)

| | **Timeline (fixed)** | **Prep PA (must match)** |
|--|----------------------|---------------------------|
| Identity of edit | Explicit **touch/delete maps** (`dalTlNoteShiftTouch_`) | Explicit **`dalPaNoteTouch_` / `dalPaNoteDelete_`** — never invent diffs from full-list compare |
| Write | Host **transaction** patches only touched entities onto remote | Host batch **only touched fixture UIDs**; stamp **`writeSeq` + `clientId`** per doc |
| Ordering | Monotonic **`writeSeq`** on state doc | Monotonic **`writeSeq`** per asset doc; ignore `seq < lastApplied` |
| Echo | Own **`clientId`** ack without re-install | Own **`clientId`** keep local row |
| Yank guard | Entity hold ~2s | Entity hold ~3s + recently-deleted |
| Autos / extras | N/A | **Never live-write auto-containers** (UID churn = snap storms) |
| Failure mode | Strips stutter left↔right | Fixture qty flips up↓down + browser stutter |

**Research / test (2026-07-17):** `node scripts/dal-pa-live-sync-test.js` — buggy full-rewrite produces `5→4→5→4…`; touch+hold+writeSeq settles at `4`. Core: `scripts/lib/dal-pa-live-sync-core.js`.

**Plain language:** While START PREP is open, both browsers listen to the PA fork collection and flush local edits to Firestore. If either browser **rewrites every asset document** from its full local list (or invents “diffs” from `recalcAutoContainers` sibling `containerUid` changes), fixtures **flip back and forth** — same class as timeline strip stutter. Live sync must be **touch/patch** with **writeSeq**, not last-full-collection-wins.

**Research note (2026-07-17):** Confirmed in code before the patch fix: `dalWritePaForkToFirestore_` built a `set` for **every** current UID (full inventory rewrite) and `dalApplyRemotePaAssets_` did a **full list replace** when clean. That matches “changes reverse on both sides” and the timeline LWW failure mode.

**Primary files:**

| File | Role |
|------|------|
| `02e7_Dal_Firestore_Client.html` | Patch compute, host/iframe batch write, collection listen apply, entity hold, banner |
| `02d_Equipment_Render.html` | Calls `dalFlushPaIfPrepOpen_` after PA UI refresh |
| `push-hosting/public/host-boot.js` | `LISTEN_COL` + `PA_BATCH_WRITE` on web.app host |
| `Dal_Firebase.js` | GAS fork save/commit (SAVE / END PREP path) |

### Never do

1. **Full-collection LWW on flush.** Writing every local PA doc on each edit lets a stale browser stomp peers’ untouched rows → A↔B fixture thrash.
2. **Full list replace on every snapshot while the other side is editing.** Apply must **merge by UID**: take remote for clean rows; keep locally dirty / held UIDs.
3. **Resurrect a UID after minus/delete from a lagging snap.** Pending-delete / held-absent / recently-deleted UIDs must stay absent — otherwise qty flips up/down rapidly on both browsers (confirmed 2026-07-17).
4. **Apply stale `fromCache` / `hasPendingWrites` collection snaps** after a live server snap — same resurrection / yank class as timeline; also causes snap→full PA re-render storms (browser stutter).
5. **Flush Firebase from remote apply** (`hasDirty → dalFlushPaIfPrepOpen_`). That is a closed loop: snap → render → flush → snap.
6. **Live-write auto-container rows after every minus.** `recalcAutoContainers` mints/churns UIDs → collection snap storms + browser stutter. Live patch is **fixtures only**; each browser rebuilds autos locally after fixture apply.
7. **Run `dalProcessPaFormulas_` explode on remote apply.** Exploding unique qty>1 strips UIDs and mints new rows → endless write wars. Remote docs are authoritative; only normalize formula flags (`skipExplode`).
8. **Host Auth/listen without host PA batch write.** `viaHost` has no `client.db` — listen-only left flushes failing or on GAS while the other browser heard “direct.”
9. **Flush Firebase from `renderProjectAssetsUI` without `dalPaApplyingRemote` guard** (and without patch-only writes) — remote apply re-render becomes a counter-write.
10. **Apply GAS `getProjectAssets` fixtures while `dalPaLiveSyncMode === 'firestore'`.** GAS strips `writeSeq`/`clientId` → listener↔GAS qty oscillation (confirmed still broken after v633).
11. **Fall back live flush to `saveProjectAssets` in firestore mode.** GAS full-document PATCH wiped host `writeSeq` stamps.

### Safe rules (locked)

| Concern | Rule |
|---------|------|
| Write | **Touch-only fixtures** — `dalPaNoteTouch_` / `dalPaNoteDelete_` then flush those UIDs only. Stamp `writeSeq`+`clientId` on host. Never live-write autos. |
| Apply | Coalesce ~300ms; re-queue if hold active. Timeline-parity: own clientId echo, stale seq ignore, hold/touch keep local, never resurrect deletes. Local `recalcAutoContainers` after fixture merge (not written live). |
| Loop break | Never flush from apply. Render-end flush only when touches pending. |
| Load race | During prep+firestore mode, late `getProjectAssets` must **not apply fixtures at all** (overlap map only). GAS responses strip `writeSeq`/`clientId` — applying them reopens qty LWW thrash against the listener. |
| Unstamped seq | After any stamped write (`lastAppliedSeq[uid] > 0`), ignore remote docs with `writeSeq` missing/0 or `seq < lastApplied`. |
| GAS save | Never fall back to `saveProjectAssets` on live flush failure while `dalPaLiveSyncMode === 'firestore'` (GAS PATCH replace wiped host `writeSeq`). Manual SAVE via GAS must re-stamp `writeSeq`. |
| Test | `node scripts/dal-pa-live-sync-test.js` must PASS before claiming PA live sync fixed (includes unstamped-GAS case). |
| Formula | Remote apply: `dalProcessPaFormulas_(…, { skipExplode: true })`. |
| Banner | `live sync (direct)` = Firestore listen; `live sync (server)` = GAS poll. Do not thrash banner text on unchanged state. |
| Host bridge | `SHOWRUNNER_DAL_FS_LISTEN_COL` + `SHOWRUNNER_DAL_FS_PA_BATCH_WRITE`; Index relays both. |
| vs timeline | Same *discipline* (patch + hold); timeline also has doc-level `writeSeq` / touch maps. PA is per-document UID in a collection. |

### Smoke (prep PA live)

Hard-refresh **two browsers** on web.app (banner **live sync (direct)**):

1. A changes one fixture location/qty; B idle — B updates once; **no** flip-back on A or B.  
2. A and B change **different** fixtures near-simultaneously — both stick.  
3. A changes the same fixture twice quickly — settles on A’s last value; no oscillation.

**AI rule:** Before editing prep live flush/apply, re-read this section and § DAL timeline fork live sync. Ship GAS; also `deploy-hosting.js` if host-boot message types change.

---

## Auto-Containerization vs Auto-Packing

Two **completely separate** engines. Never merge their logic. **Full model:** [EQUIPMENT_MODEL.md](EQUIPMENT_MODEL.md).

| Engine | File / Function | Applies To |
|--------|-----------------|------------|
| **Auto-Containerization** | `02e5_Logic_Sync.html` / `recalcAutoContainers()` | Physical fixtures in predefined cases (fluid kits) |
| **Auto-Packing** | `02e4_Logic_Containers.html` / `autoProvisionCableCases()` (triggered from logistics wizard) | `type: "Bulk"` loose gear (cables, tape) into trunks |

**Bulk vs unique:** Bulk = one vault row, counts only, **no RFID**. Physical level-6 = unique units. Level-3 cases = identity (RFID + QR = vault `id`). Cables must marry to a case to checkout.

**Cable auto-pack (shipped):** Groups by CBL child tag → `[BULK] …` trunks (`isGenericAuto`). **Only gap:** packing-mode bind of **which physical cable case** holds that trunk (scan QR/RFID). Do not rebuild this with Auto-Containerization.

**Unpack / rerun risk:** `autoProvisionCableCases()` deletes all `isGenericAuto` rows. Planned: hold-to-unpack ~1.5s. See [EQUIPMENT_MODEL.md](EQUIPMENT_MODEL.md).

---

## Incident Log ("Break Locks")

When a bug is fixed, the director is unhappy, or a fragile rule is learned the hard way, capture it here so future AI sessions do not repeat it.

### How entries get added

1. Director reports bug / displeasure / suggestion (see [DIRECTOR_WORKFLOW.md](DIRECTOR_WORKFLOW.md))
2. AI fixes or discusses the issue
3. AI **asks:** *"Do you want me to add this to the Incident Log in FRAGILE_ZONES.md?"*
4. **Only if the director says yes** → AI appends one entry below

Never auto-write to this log without director approval.

### Template

```
DATE:
SYMPTOM (what the director saw):
CAUSE (what change broke it):
FRAGILE ZONE (if any):
FILES TOUCHED:
LESSON (never do X again):
```

### Entries

#### 2026-07-16 — Dual-domain session UI + prep latch sync (fixed v604–v606)

```
DATE: 2026-07-16
SYMPTOM: (1) Prep open on A cleared timeline collab banner on B; START COLLAB popup then snapped back to START. (2) END PREP on A left prep banner on B. (3) Fix for (2) then blocked remote START PREP on B.
CAUSE: (1) Legacy flat sessionType preferred prep when both domains open. (2) Prep latch only cleared via Firestore _meta — poll missing. (3) Close-only poll + no grace wiped a fresh open when Sheets lagged Firebase.
FRAGILE ZONE: DAL prep / timeline session UI (dual-domain)
FILES TOUCHED: Dal_Sessions.js, 02e6_Dal_Session.html, 02e7_Dal_Firestore_Client.html, 03a1_Timeline_Dal_Session.html, 03a2_Timeline_Dal_Live.html, FRAGILE_ZONES.md
LESSON: Always read prepStatus/timelineStatus. Prep poll must cover START and END; grace + two closed polls before allowClose. Never put */ inside Dal_Sessions block comments.
```

#### 2026-06-27 — Session expired loop + black screen after mobile milestones (fixed v328)

```
DATE: 2026-06-27
SYMPTOM: After mobile UI milestones, login sometimes showed black screen (phone + desktop) and "Session expired" every open; felt like stay-signed-in broke again.
CAUSE: (1) Parent shell opened sessionboot with stale localStorage token → server returned Login with clearSession → parent wiped good state. (2) createUserSession_ revoked previous device token on each login — phone/desktop kicked each other. (3) Any milestone rebuilds full LogicPayload — unrelated mobile JS can break boot for everyone. Correlation with mobile work was deploy pipeline, not weather/hub CSS.
FRAGILE ZONE: PWA session + login boot; App boot pipeline
FILES TOUCHED: Security.js (multi-device sessions), host-boot.js (sessioncheck before sessionboot), Login.html (sessioncheck), FRAGILE_ZONES.md
LESSON: Never ship milestone without login smoke test on web.app + desktop. Always sessioncheck before sessionboot. Document in FRAGILE_ZONES before editing session or build.js.
```

#### 2026-06-27 — Blank screen after login v317 (fixed)

```
DATE: 2026-06-27 (GAS v317)
SYMPTOM: Blank black screen after login on desktop and mobile app.
CAUSE: (1) Hosting shell blocked iframe until Firebase config finished. (2) Bootloader appended after </body> in some builds — chunk loader failed silently.
FRAGILE ZONE: App boot pipeline; PWA session + login boot
FILES TOUCHED: build.js (bootloader before </body>, showBootFailure), host-boot.js (iframe loads immediately)
LESSON: Iframe first, FCM second. Bootloader must inject before </body>. showBootFailure must remain for chunk errors.
```

#### 2026-06-29 — White screen: PC-only Node scripts on Apps Script (fixed v363–364, v378)

```
DATE: 2026-06-29
SYMPTOM: After milestones, web.app white screen; console ReferenceError: require is not defined (file check-google-account or git-push-backup).
CAUSE: Node-only helper scripts (clasp account check, GitHub push) were copied to dist/ and/or left as orphans on GAS. Apps Script runs every .js at startup; require() does not exist in GAS.
FRAGILE ZONE: Build pipeline; Node-only files on GAS
FILES TOUCHED: gas-node-only.js, build.js, gas-push-sync.js, check-google-account.js (check 3), .claspignore
LESSON: Never add root Node tooling without gas-node-only.js. Never deploy with bare clasp push. check-google-account.js check 3 must pass before assuming deploy is clean.
```

#### 2026-06-24 — Print Studio unwired (fixed)

```
DATE: 2026-06-24
SYMPTOM: PRINT button on Project Assets did nothing / console error openPrintModal is not defined
CAUSE: 02g_Project_Reports.html existed but was not included in Index.html build chain
FRAGILE ZONE: Build pipeline / Index.html wiring
FILES TOUCHED: Index.html (added include for 02g)
LESSON: Never document a module as live without verifying <?!= include(...) ?> in Index.html. After adding HTML modules, run node build.js and test PRINT.
```

#### 2026-07-07 — Mobile QR camera: many versions, postMessage dead, reload + dedupe (fixed v466–467)

```
DATE: 2026-07-07
SYMPTOM: Integrated phone scan panel — Simulate RW-1000-20 worked (equipment resolved) but real camera closed with no result; after reload fix (v466) camera worked but same tag re-fired in an infinite loop without rescanning.
CAUSE: (1) Hard constraint: getUserMedia works on top-level web.app only — fails inside GAS iframe (proven on director HyperOS device). (2) Shell → iframe handoff via postMessage never reliably reached 01j listeners (GAS sandbox nesting) — camera decoded fine, app never got the tag. (3) v437–465 stacked mitigations that all fired at once: relay burst, parent sm_mobile_qr_pending + 24s flush loop re-staging mobscanstage, burst pull, visibility handlers, iframe forwarder in Index.html — simulate bypassed this (same-document JS). (4) v464 fixed vault lookup (composite RW-1000-20) — proved backend path OK. (5) v466 primary fix: hostMobileScanNavigateIframeWithScan_ reloads GAS iframe with sessionboot&srScan=TAG; server embeds pending-mobile-scan-b64 meta; boot consumes on load. (6) v466 loop: deliver still left pending in parent storage AND kept retry/relay/burst paths alive — each flush re-staged the same tag; campoll pulled it again; user saw endless re-reads. (7) v467: single primary path (reload only), clear pending on deliver, 20s dedupe both sides, stop campoll/burst after apply, ACK on boot consume, skip APP_READY flush while reload in flight. Side quests: v460 diagnostics froze app; v461 orphaned return killed entire scan script; v458 parent ?srScan= caused re-auth.
FRAGILE ZONE: Two-layer shell bridge; Mobile QR camera (PWA); host-boot.js (shared with station RFID)
FILES TOUCHED: host-boot.js, 01j_Mobile_Scan.html, Index.html, Main.js (sessionboot srScan, mobscanstage), Station_Security.js (stage/pull/resolve), push-hosting/public/index.html (?v=), FRAGILE_ZONES.md
LESSON: For shell↔iframe scan delivery, never use postMessage as sole path — use iframe reload with server-embedded tag (QR) or native poll pull (RFID). Never run parallel handoff mechanisms without dedupe. Simulate working + camera not = lookup bug — split “decode/handoff” from “vault resolve”. Always bump host-boot.js?v= on hosting deploy. Read FRAGILE_ZONES § Two-layer bridge before touching host-boot.js.
VERSION TRAIL (GAS unless noted): v437–455 panel + shell bridges; v457 embed-origin; v458 srScan nav reverted; v459 shell fullscreen cam; v460 diagnostics removed v461; v463 server stage + simulate; v464 vault lookup; v465 relay burst + forwarder; v466 reload handoff (hosting v466–467); v467 loop fix (hosting v468).
```

#### 2026-07-08 — Gun disconnect/reconnect reboots the whole station UI (fixed APK 0.1.36 build 38)

```
DATE: 2026-07-08
SYMPTOM: From the very first builds, every time the RFID gun slept/disconnected and reconnected, the app "restarted" — mobile→station flash, back to SYSTEM SECURE / station cold boot, host badge and project state lost, ~20s before you could badge in again. Persisted through ~10 versions of fixes.
CAUSE: The Chainway gun is a Bluetooth HID keyboard (trigger = KeyEvent). Connecting/disconnecting an HID keyboard changes Android's `keyboard`/`navigation` device configuration. AndroidManifest declared `keyboardHidden` but NOT `keyboard`/`navigation`, so each gun flap was an UNHANDLED config change → Android destroyed + recreated StationWebActivity → WebView rebuilt from zero. It was never a session-bridge or renderer problem; every v476–485 mitigation (flap guards, session guards, host persistence, renderer priority) fought the wrong layer and failed in the field.
FRAGILE ZONE: Station native app lifecycle (APK); Station RFID / native gun bridge
FILES TOUCHED: station-android/app/src/main/AndroidManifest.xml (added keyboard|navigation|density|fontScale|locale to configChanges), StationWebActivity.kt (onConfigurationChanged breadcrumb + renderer priority), 11_Station_Shell.html (stationOnGunConfigChange_ toast), FRAGILE_ZONES.md, active/rfid-station-profiles.md
LESSON: When a native Android WebView app "reboots" on a hardware event (BT device connect/disconnect, rotation, keyboard), suspect Activity recreation from an unhandled config change BEFORE blaming web/session logic. HID input devices (scanners, guns) flip `keyboard`/`navigation` — they MUST be in configChanges. A one-line manifest fix beat weeks of JS mitigations. Add a config-change breadcrumb so the layer is provable on-device.
```

#### 2026-07-08 — Firebase hosting deploy hangs forever after "Config project…" (fixed)

```
DATE: 2026-07-08
SYMPTOM: `node deploy-hosting.js` printed up to "Config project: sm-showrunner-97405 | sender: … | appId: set" and then froze indefinitely — the terminal never returned, the new APK build never reached the /station-app download page (kept showing the old build).
CAUSE: `prepare-hosting.js` fetches Firebase config from Apps Script, which responds with a 302 redirect. The redirect response body was never drained, so a keep-alive socket kept Node's event loop alive — the process finished its work, printed its last line ("Config project…"), but never EXITED. `deploy-hosting.js` ran it via execSync and blocked forever waiting for that child to end, never reaching `firebase deploy`. Intermittent (sometimes the socket timed out and it escaped). Compounded by no visibility (silent) and no timeout.
FRAGILE ZONE: Station APK + hosting deploy pipeline
FILES TOUCHED: push-hosting/prepare-hosting.js (res.resume() on redirect + process.exit(0) after work), deploy-hosting.js (firebase --non-interactive + NO_UPDATE_NOTIFIER + 20s heartbeat + 10-min timeout + post-deploy live-manifest verify), build-station-apk.js (versionCode downgrade guard)
LESSON: A deploy script that spawns Node children must guarantee those children EXIT — drain every HTTP response (especially redirects) and force process.exit after synchronous work. Long silent steps need a heartbeat + hard timeout so a hang is visible and self-aborting, never an infinite freeze. Always verify the LIVE artifact after deploy (fetch the served manifest) — never trust "the command ran".
```

#### 2026-07-08 — `rollback.js` prompt wedged the entire agent shell (fixed)

```
DATE: 2026-07-08
SYMPTOM: After creating rollback.js, EVERY subsequent terminal command in the AI agent's shell returned "no exit status" — nothing ran for the rest of the session; even `echo` hung. Survived Cursor window reloads.
CAUSE: rollback.js used readline to ask "Proceed with rollback? [y/N]". Run in a non-interactive shell (AI agent / CI — no keyboard/stdin), readline blocked forever waiting for a keypress. Because the agent shell is a single stateful session, that hung `node` process sat in the foreground and every later command queued behind it indefinitely. On Windows the orphaned node even survived app restarts (needed `taskkill /F /IM node.exe`).
FRAGILE ZONE: Station APK + hosting deploy pipeline (tooling scripts)
FILES TOUCHED: rollback.js (guard: if !process.stdin.isTTY, print instructions and exit(1) instead of prompting; require --yes)
LESSON: NEVER put an interactive stdin prompt in a script that an AI agent or CI might run without guarding on `process.stdin.isTTY`. Without a TTY, refuse and require an explicit flag (--yes) instead of blocking. A single hung foreground process wedges the whole stateful agent shell; recovery needs killing the orphaned process, not just reloading the IDE.
```
