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
| **Station RFID / native gun bridge** | `host-boot.js`, `11_Station_Shell.html`, `station-android/RfidManager.kt` | Rely on **`postMessage` or `evaluateJavascript` alone** for scan delivery; remove `pollScans()` pull path; share BLE read/config workers | **Primary = iframe `AndroidStation.pollScans()`** (~300 ms); relay + `showrunnerStationDeliverScan` = fallback; direct `AndroidStation` for settings; see § Two-layer shell bridge + § Station RFID delivery |
| **App boot pipeline (black screen)** | `build.js`, `Index.html` includes, `LogicPayload_*`, `dist/Index.html` | Append bootloader after `</body>`; edit `dist/` manually; ship milestone without login smoke test | Bootloader **before** `</body>`; edit sources → `node build.js` → test login on **web.app + desktop** every milestone |
| **Warehouse ledger** | `Operations.js` | Mutate assignments directly during RFID chaos | Append to `Operations_Ledger` |

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
| Gun EPC → station strip | Iframe `AndroidStation.pollScans()` every ~300 ms | `evaluateJavascript('onStationRfidScan')` into iframe; lossy `postMessage` relay |

**Shared AI rules (both bridges):**

1. **Top frame owns hardware** — camera permission and BLE SDK calls run in the shell or native app, not inside the GAS document.
2. **Iframe owns business UI** — equipment name, status buttons, vault, checkout.
3. **`postMessage` is best-effort only** — never the sole delivery path for scan results.
4. **Dedupe is mandatory** — QR: 20 s (`hostMobileScanLastDeliveredTag_` / `MOBILE_SCAN_DELIVERED_KEY`); RFID: ~1.5 s (`stationLastScanTag`).
5. **One primary path** — do not stack relay burst + pending retry loop + burst pull + reload; that caused the v466 QR infinite re-read loop.
6. **`host-boot.js?v=` bump** — bump `push-hosting/public/index.html` cache-buster on every hosting change (v415 lesson: stale shell = “fix shipped but field unchanged”).
7. **Deploy pairing** — `host-boot.js` changes need `node deploy-hosting.js` **and** GAS milestone when `01j` / `Main.js` / `Station_Security.js` also change.
8. **`host-boot.js` is shared** — mobile QR camera paths and station RFID relay live in the same file; read both sections below before editing either.

**Active campaign (in flight):** phone QR polish — [active/rfid-station-profiles.md](active/rfid-station-profiles.md) § Phone QR scan panel.

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

**Goal:** Chainway gun on warehouse tablet — EPC reaches station live strip and host/vault flows.

### End-to-end flow (working path)

```
1. RfidManager.kt reads tag on BLE trigger
2. Native queues EPC in pendingScans
3. Station shell (11_Station_Shell.html) polls AndroidStation.pollScans() ~every 300 ms
4. onStationRfidScan(epc) → strip / host login / vault record / checkout
```

**Fallback (keep, do not rely on):**

- Top frame `showrunnerStationDeliverScan(tag)` → `postMessage SHOWRUNNER_RFID_SCAN` into iframe (`host-boot.js`).
- Direct `evaluateJavascript('onStationRfidScan…')` — only hits top frame, not station listeners.

**Gun settings:** prefer **direct** `window.AndroidStation.setPower/setScanMode/setBeep/setPollMs` when `native=true`; `SHOWRUNNER_STATION_CONFIG_GET/SET` via `host-boot.js` relay only when interface absent.

### Never do

- Remove **`pollScans()` pull** while “fixing” the relay — relay alone was the v414 “gun beeps, nothing in app” bug.
- Share BLE **read worker** with config/device-info SDK calls — hung trigger reads (v412).
- Ship `host-boot.js` RFID handlers without `?v=` bump.
- Assume `postMessage` from shell always reaches `11_Station_Shell.html` listeners.

### Dedupe

`stationLastScanTag` + ~1.5 s window — one physical pull must not enqueue duplicate strip rows (poll + relay both active).

**Full field chronology:** [active/rfid-station-profiles.md](active/rfid-station-profiles.md) · [topics/logistics-warehouse.md](topics/logistics-warehouse.md).

---

## Node-only files must never ship to GAS (white screen)

**Plain language:** Showrunner is built on your PC, then uploaded to Google. Some files are **only for your PC** (they use Node’s `require`). If one of those lands on Google by mistake, the live app **crashes on load** — white screen, error like `ReferenceError: require is not defined`. This is **not** task notes, RELEASES notes, or in-app data.

**How it happens:**
1. `build.js` copies root `.js` files into `dist/` for upload — anything not on the block list can leak.
2. Plain **`clasp push` does not delete** files already on Google’s server. Removing a file locally leaves an **orphan** online until `gas-push-sync` runs (milestone does this).

**Canonical block list:** root **`gas-node-only.js`** (used by `build.js` and `check-google-account.js`).

**Known leaks (fixed):** `check-google-account.js` @ v363–364; `git-push-backup.js` @ v377–378.

**AI rules:**
1. New root `.js` tooling → add to **`gas-node-only.js`** immediately (and `.claspignore` if clasp might see it).
2. Never end a milestone with bare `clasp push` — use **`gas-push-sync`** via `milestone.js` / `dev-push.js`.
3. After deploy issues, run **`node check-google-account.js`** — **check 3** lists any PC-only scripts still on the live project.
4. **Smoke test** web.app login after every milestone (see boot pipeline above).

**Director symptom:** White screen right after an update → tell the AI the **file name in the error** (e.g. `git-push-backup`).

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
