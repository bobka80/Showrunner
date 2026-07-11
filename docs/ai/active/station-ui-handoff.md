# Station UI rework — handoff protocol (new chat entry)

**Read this file first** when continuing station shell split or dock/tablet UI work.

**Director:** Copy the prompt at the bottom into a new Cursor chat.

**Last updated:** 2026-07-11 · **Production:** GAS **530** (REWIND) · **Source:** monolith `11_Station_Shell.html` on branch `docs/deferred-when-operational`

---

## 1. What works right now (do not break)

| Surface | Status | Pin |
|---------|--------|-----|
| **Chainway phone in R6 sled** | Badge host, PROJECT/VAULT/Scan/Settings, equipment → name+unit | APK **build 53**, GAS **530** |
| **TSL gate PC** | Login/logout, RFID in real station UI, settings, cold start = no host restore | Desktop **0.1.44**, host-boot **?v=499**, GAS **530** |
| **Station logic** | Monolith `11_Station_Shell.html` + `11a_Station_Gun_Drivers.html` | All in one GAS deploy |

**Test URL:** `https://sm-showrunner-97405.web.app`

---

## 2. REWIND — what it is and why it exists

**File:** [REWIND-pre-station-ui-split.md](REWIND-pre-station-ui-split.md)

A **major milestone pin** before restructuring ~4,000 lines of station shell and building dock/tablet UI. If rework breaks the floor, rollback production to this version.

| Action | Command |
|--------|---------|
| Rollback production GAS | `node rollback-milestone.js 3` (or row tagged REWIND in `RELEASES.md`) |
| Restore source monolith | `git log --grep="REWIND POINT"` → checkout that tree for `11_Station_Shell.html` + `Index.html` |
| Rollback failed split | Commit `974cfc6` — “Revert to GAS v530 REWIND baseline” |

**Four independent deploy tracks** (numbers intentionally differ):

| Track | Pin @ REWIND | Deploy |
|-------|--------------|--------|
| GAS (backend + web app) | **530** | `node milestone.js` |
| Hosting shell | host-boot **499** | `node deploy-hosting.js` |
| Desktop EXE | **0.1.44** | `station-desktop/RUN-STATION.bat` |
| Chainway APK | **0.1.51 (build 53)** | `node build-station-apk.js` → `node deploy-hosting.js` |

GAS rollback does **not** change APK or desktop EXE on disk.

---

## 3. What we tried and reverted (2026-07-11)

| GAS | What happened |
|-----|----------------|
| **531** | Mechanical split `11_Station_Shell.html` → modules `11b`–`11l`. **Chainway regression:** shell showed, gun beeped, but badge login + all buttons dead. |
| **532** | Attempted fix (`11c` parse error: commented globals + orphan `*/`). Still broken in field. |
| **530** | **Production restored** via `rollback-milestone.js`. Source reverted to monolith; split files deleted. |

**Root cause:** `11c_Station_Core.html` had a JavaScript **parse error** (orphan `*/`), so the entire core script block failed — no `initStationShell_()`, no onclick handlers, no RFID→host flow. Markup and native gun still worked.

**Lesson:** After any split, **parse-check every station `<script>` block** and run Chainway smoke test before milestone.

Full post-mortem: [STATION_UI.md](../STATION_UI.md) § Split failure lessons.

---

## 4. Approved product direction (not built yet)

**Spec:** [STATION_UI.md](../STATION_UI.md)

| Skin | Devices | UI |
|------|---------|-----|
| **`phone_sled`** | Chainway phone in sled | **Keep** current fullscreen kiosk |
| **`dock_panel`** | TSL gate PC, large tablets, future gate TV | **New:** right scan rail, bottom eject bar, sidebar integration, UI scale; screensaver later |

**Order of work:** Phase A mechanical split (behavior-neutral) → Phase B dock panel UI → Phase C screensaver/bulletin.

**Do not code Phase B until Phase A passes Chainway + TSL regression.**

---

## 5. File split protocol (Phase A redo)

### Prerequisites

1. Read [FRAGILE_ZONES.md](../FRAGILE_ZONES.md) § Station RFID · § Desktop WebView2 · § TSL 1128.
2. Read [tsl-desktop-handoff.md](tsl-desktop-handoff.md) if touching desktop paths.
3. Baseline = monolith at GAS **530** (`11_Station_Shell.html` ~4030 lines).

### Mechanical split rules

- **Zero logic changes** in Phase A — line-range cut only, then wire includes.
- Each module **≤ ~1000 lines** (doctrine / File Splitting Guide).
- One `<script>` block per logic file; **close header comments before any executable code**.
- `Index.html` include **order matters** (markup before logic; core before RFID; settings logic last):

```
11a_Station_Gun_Drivers
11b_Station_Styles
11j_Station_Phone_UI          ← phone markup
11i_Station_Settings          ← settings markup
11h_Station_Project           ← project markup
11f_Station_Vault             ← vault markup
11k_Station_Dock_UI           ← dock scaffold (Phase B markup)
11l_Station_Dock_Scale        ← scale scaffold
11c_Station_Core
11d_Station_Rfid
11e_Station_ScanPanel
11g_Station_Vault
11g_Station_Vault_Crew
11h_Station_Project_Logic
11i_Station_Settings_Logic
```

- `11_Station_Shell.html` becomes a **stub** (comment only) after split.
- Recreate `scripts/split-station-shell-once.js` from monolith; **fix chunk boundaries:**
  - 11c second slice: lines **1441–1915** (not 1447–1905) — includes Per-station settings comment + `stationFormatTime24_` + `stationToastTimer_`.
- Run parse check:

```bash
node -e "
const fs=require('fs');const vm=require('vm');
['11c_Station_Core.html','11d_Station_Rfid.html','11e_Station_ScanPanel.html',
 '11g_Station_Vault.html','11g_Station_Vault_Crew.html',
 '11h_Station_Project_Logic.html','11i_Station_Settings_Logic.html'].forEach(f=>{
  const sm=fs.readFileSync(f,'utf8').match(/<script>([\\s\\S]*)<\\/script>/)[1];
  new vm.Script(sm,{filename:f}); console.log(f+': OK');
});
"
```

### Ship Phase A

1. `node build.js`
2. `node milestone.js "Station shell split Phase A (behavior-neutral, parse-checked)"`
3. Report GAS version.
4. Director tests Chainway + TSL desktop per [STATION_UI.md](../STATION_UI.md) regression lists.

### If split breaks production

1. `node rollback-milestone.js` → REWIND row (530)
2. `git checkout` monolith from REWIND commit
3. Do not attempt “fix forward” on floor without director **OK go**

---

## 6. Read order for a new agent

| # | File | Why |
|---|------|-----|
| 1 | **This file** | Context, rewind, split protocol |
| 2 | [STATION_UI.md](../STATION_UI.md) | UI skins + phase checklist |
| 3 | [REWIND-pre-station-ui-split.md](REWIND-pre-station-ui-split.md) | Version pins |
| 4 | [rfid-station-profiles.md](rfid-station-profiles.md) | Guns, layouts, campaign backlog |
| 5 | [tsl-desktop-handoff.md](tsl-desktop-handoff.md) | Desktop only |
| 6 | [FRAGILE_ZONES.md](../FRAGILE_ZONES.md) | Do-not-break |
| 7 | [FILE_MAP.md](../FILE_MAP.md) §11 | File index (update after split) |

**Code entry points:** `11_Station_Shell.html` (monolith today), `11a_Station_Gun_Drivers.html`, `Index.html` includes, `Station_Security.js`.

---

## 7. Director triggers

| Phrase | Meaning |
|--------|---------|
| **summarize** | Restate plan — no code |
| **hygiene sweep** / **doc hygiene** | Doc consistency report — no edits until **OK go** |
| **OK go** | Implement approved plan |
| **Milestone now** | Pin production before starting risky work |
| **This works** | Git checkpoint only (`works-save.js`) — not production |

**Ship rule:** Completed implementation → `node milestone.js` + report GAS version.

---

## 8. Copy-paste prompt for new chat

```
Station UI rework — read handoff first.

1. Read docs/ai/active/station-ui-handoff.md (this protocol).
2. Read docs/ai/STATION_UI.md (phone sled vs dock panel spec + phase checklist).
3. Read docs/ai/active/REWIND-pre-station-ui-split.md (GAS v530 baseline).

Context:
- Production is GAS v530 (monolithic 11_Station_Shell.html). Chainway sled + TSL gate PC RFID work at this pin.
- We attempted a mechanical shell split (GAS 531–532); it broke the Chainway app (11c JS parse error). Production was rolled back to 530; source reverted to monolith.
- Next approved work: Phase A = redo mechanical split with parse-check + Chainway regression BEFORE Phase B dock panel UI.
- Do NOT change phone sled UI in Phase A. Dock panel (right scan rail, bottom eject, UI scale) is Phase B only.

Before any code: summarize which phase the director wants and wait for OK go.
Fragile: docs/ai/FRAGILE_ZONES.md + docs/ai/active/tsl-desktop-handoff.md for desktop.

Director priority today: [FILL IN — e.g. "Phase A split only" or "docs only" or "Phase B dock UI after split"]
```

Replace the last line with the director’s actual priority.
