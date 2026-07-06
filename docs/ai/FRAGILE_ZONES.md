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
| **Mobile QR camera (PWA)** | `push-hosting/public/host-boot.js`, `01j_Mobile_Scan.html`, `camera-embed.html`, `mobile-scan.html` | `getUserMedia` inside GAS iframe or nested `web.app` iframe in GAS; auto-start camera without user tap; forget `host-boot.js?v=` bump | Camera on **shell document** (top-level `web.app`); user tap → permission; panel UI stays in GAS iframe; see [CURSOR_WORKFLOW.md](CURSOR_WORKFLOW.md) + `mobile-pwa-hosting` rule |
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
