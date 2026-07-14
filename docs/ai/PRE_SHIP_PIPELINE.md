# Pre-ship pipeline — scoped integrity gates before every ship

**Entry:** [AI_DOCTRINE.md](../../AI_DOCTRINE.md) · **Deploy:** [DEPLOY_AND_ROLLBACK.md](DEPLOY_AND_ROLLBACK.md)

**Production:** GAS per `RELEASES.md` · **Last swept:** 2026-07-14

Showrunner ships through a **PWA wrapper** (Firebase `web.app` → `host-boot.js` → GAS iframe). Pre-ship runs **only the layers that match your changes** — not a full audit every time.

---

## One command

```bash
node pre-ship.js
```

Auto-detects layers from `git diff` (staged + unstaged vs `HEAD`).

| Flag | Purpose |
|------|---------|
| `--layers gas` | Force GAS pipeline only |
| `--layers gas,hosting` | Force combined pipeline |
| `--dry-run` | Show plan + Bugbot gate (do not run checks) |
| `--list` | List detected layers + files |
| `--deploy` | Include clasp / remote GAS checks (used by `milestone.js`) |
| `--bugbot-policy` | JSON only — Bugbot gate decision |

---

## Layers (scoped)

| Layer | When it runs | What it checks |
|-------|----------------|----------------|
| **gas** | Root `*.html` / `*.js` (except Node-only), `dist/`, `Index.html`, `appsscript.json` | `build.js`, payload parse, station split verify (if `11_*` touched), `dist/` orphan scan; with `--deploy`: `check-google-account.js` |
| **hosting** | `push-hosting/**` | `host-boot.js` parse; if `host-boot.js` changed → `index.html` `host-boot.js?v=` must be **bumped** |
| **desktop** | `station-desktop/**` | `app.ico` present; `dotnet build` Release |
| **apk** | `station-android/**` | APK tree present (full build still via `build-station-apk.js`) |

**Docs-only / tooling-only changes** → no layers → **GREEN** (nothing to verify).

---

## Bugbot gate (AI-controlled)

Bugbot is a **Cursor subagent** — it does not run inside Node. Pre-ship **decides** when Bugbot is needed; the **AI runs** Bugbot before ship when required.

| Action | Meaning | AI behavior |
|--------|---------|-------------|
| **skip** | Docs-only, cosmetic desktop icon, tiny isolated change | Do **not** run Bugbot |
| **recommend** | Moderate production diff | Run Bugbot if worthwhile; may ship on mechanical GREEN for tiny fixes |
| **require** | Fragile files, station + deploy, GAS+hosting together, `host-boot.js` | **Must** run Bugbot before ship completes |

**Policy code:** `pre-ship/bugbot-policy.js`  
**Last report:** `pre-ship/last-report.json` (gitignored)

### When Bugbot is REQUIRED (examples)

- `host-boot.js`, `Login.html`, `Security.js`, `Main.js`, `Index.html`
- Station shell (`11_*`) on production milestone
- GAS **and** hosting in the same ship
- `01h_Mobile_Assets`, dock logic, session bridge files

### AI workflow (mandatory)

1. Finish code changes.
2. `node pre-ship.js --dry-run` (or let ship script run mechanical pre-ship).
3. If gate says **REQUIRE** → launch **Bugbot** on `branch changes` with `Custom Instructions` from the report.
4. Fix **Critical/High** findings (or director explicitly overrides).
5. Re-run ship with Bugbot cleared:

```powershell
$env:PRE_SHIP_BUGBOT_OK=1; node milestone.js "note"
```

6. Post-ship smoke card (manual).

### Bugbot prompt shape (AI)

```text
Full Repository Path: S:\Gdrive\3Showrider\Code Env
Diff: branch changes
Custom Instructions: <from pre-ship/last-report.json bugbot.customInstructions>
```

See [CURSOR_WORKFLOW.md](CURSOR_WORKFLOW.md) · skill `review-bugbot`.

---

## Automatic hooks (mechanical + Bugbot gate)

| Ship script | Pre-ship behavior |
|-------------|-------------------|
| `node milestone.js` | Always **gas** + deploy checks + Bugbot gate |
| `node deploy-hosting.js` | Always **hosting**; adds **gas** if GAS files also changed |
| `node build-station-desktop.js` | **desktop** (after icon generation) |
| `node build-station-apk.js` | **apk** |

If mechanical pre-ship is **RED**, ship stops.  
If Bugbot gate is **REQUIRE** and `PRE_SHIP_BUGBOT_OK` is not set, ship stops after mechanical GREEN.

---

## Decision guide (director)

| You changed… | Pipeline |
|--------------|----------|
| Only GAS / UI modules | **gas** (via `milestone.js`) |
| Only Firebase shell | **hosting** (via `deploy-hosting.js`) |
| GAS + `host-boot.js` | **gas** then **hosting** + Bugbot **require** |
| Desktop EXE only (icon/version) | **desktop** · Bugbot **skip** |
| Chainway APK only | **apk** |

---

## Post-ship smoke card (manual — same every milestone)

After **GREEN** pre-ship, Bugbot (if required), and successful ship:

1. Login / session boot works (web.app or desktop shortcut)
2. **The thing you changed** works
3. **One regression** — e.g. project list still loads, PA still opens

---

## What pre-ship does *not* do

- WebView2 cache / stale iframe (close app, restart)
- RFID hardware timing
- Google Sheet data shape

---

## Files

| Path | Role |
|------|------|
| `pre-ship.js` | CLI entry |
| `pre-ship/index.js` | Orchestrator |
| `pre-ship/detect.js` | Change → layer mapping |
| `pre-ship/layers.js` | Per-layer runners |
| `pre-ship/bugbot-policy.js` | When Bugbot is skip / recommend / require |
| `pre-ship/report.js` | `last-report.json` writer |
| `pre-ship/last-report.json` | Latest gate (gitignored) |

**Node-only** — listed in `gas-node-only.js`; never deployed to GAS.
