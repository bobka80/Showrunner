# Active — Data access layer (DAL) + router

**Entry:** [AI_DOCTRINE.md](../../../AI_DOCTRINE.md) · **Canonical topic (target architecture):** [../topics/data-cache-engine.md](../topics/data-cache-engine.md) · **Session fork:** [../topics/session-fork-platform.md](../topics/session-fork-platform.md) · **Files:** [../FILE_MAP.md](../FILE_MAP.md)

**Opened:** 2026-07-05 · **Status:** Live PA/timeline forks; prep PA live = transactional `assets/state` (timeline twin) — [dal-pa-live-sync-thrash.md](dal-pa-live-sync-thrash.md). **Production:** GAS **v635** + hosting (`host-boot.js?v=635`). **Rollback baseline:** GAS **v576**.

**Major rollback point (2026-07-15):** Before any DAL code landed on production, milestone **v576** — *"MAJOR ROLLBACK POINT — pre-DAL Phase 1 (Sheets-only baseline; no repo layer)"*. If DAL work breaks saves, checkout, or timeline: tell the AI **"Rollback production to v576"**. **v577 regression (2026-07-15):** `Dal_Repos.js` block comment contained the sequence `*/` (in `persist*/fetch*`), which terminated the comment early and caused a **GAS syntax error** — broke the whole script project including PA save; rolled back to v576; fixed in v578+ (comment + adapter rename).

**Design lock (canonical spec):** [dal-firebase-design-lock-2026-07-13.md](dal-firebase-design-lock-2026-07-13.md) — architecture, session lifecycles, reconciliation, cache API, execution order, Phase 0 checklist.

**Phase 0 discovery (2026-07-13):** [dal-phase0-discovery-2026-07-13.md](dal-phase0-discovery-2026-07-13.md) — **complete** (read-only). Confirms full-sheet rewrite on PA, timeline, and ledger.

**Pre-ship gates (2026-07-15):** [dal-pre-ship-gates.md](dal-pre-ship-gates.md) — client inventory, persistence lint, Phase 3 concurrency deploy ack. **Canonical agent handbook** for DAL mechanical gates.

**Phase safety playbook (for fresh chats):** [dal-phase-safety-playbook.md](dal-phase-safety-playbook.md) — phase-by-phase preflight/postflight sweeps + security guardrails.

**Slice D (dual-domain sessions):** [dal-phase4-slice-d-dual-domain-sessions.md](dal-phase4-slice-d-dual-domain-sessions.md) — prep + timeline concurrent; **gate before Phase 5**.

This is the **live campaign file** for the single database layer.

---

## Goal

Before warehouse prep Firebase, expanded ledger, or timeline collab fork:

1. **One honest map** of how Showrunner reads/writes data today (GAS + client caches).
2. **One router + repository design** so Sheets stays the long-term official DB while Firebase acts as a **session buffer** (prep + timeline).
3. **Incremental execution** — design the full layer up front; migrate domain by domain; **no big-bang rewrite**.

**Director intent (locked 2026-07-05):**

- Google Sheets = official record for most domains, for a long time.
- Firebase = live “clipboard” for **warehouse prep** (PA + operations ledger) and **timeline collab** — commit back to Sheets on session close via GAS only.
- DAL first = experiment with routing (Sheets vs Firebase vs future SQL) from **one place**; expand what goes on Firebase without rewriting every screen.
- All **future features** route through repositories — no new direct `SpreadsheetApp` / raw sheet calls in feature code.
- If GAS timeouts or scale pain appear, move **one slice** at a time off Sheets by swapping adapters — not by emergency forks in UI code.

---

## Prerequisite for (do not start until DAL campaign reaches Phase 4)

| Blocked until DAL router + **delta-only saves** (Phase 3) exist | Topic file |
|---------------------------------|------------|
| Warehouse prep session (Firebase PA + ledger) | [warehouse-prep-session.md](../topics/warehouse-prep-session.md) |
| Timeline collab session | [timeline-collab-session.md](../topics/timeline-collab-session.md) |
| “Ledgers work” as Firebase fork (not Sheets-only fixes) | [warehouse-prep-session.md](../topics/warehouse-prep-session.md) · `Operations.js` |

**Allowed in parallel:** phone/mobile app work, station RFID campaign polish, normal-day Sheets improvements that do **not** introduce a second write path to forked slices.

---

## Stable references (read before any DAL code)

| Doc | Use for |
|-----|---------|
| [FRAGILE_ZONES.md](../FRAGILE_ZONES.md) | Triangle of Truth, `processFormulas`, packing vs containerization, ledger append-only |
| [ARCHITECTURE.md](../ARCHITECTURE.md) | Optimistic healing, build pipeline, RBAC boot |
| [EQUIPMENT_MODEL.md](../EQUIPMENT_MODEL.md) | Bulk vs unique, two packing engines — DAL wraps **save boundaries**, not formula UI |
| [SCHEMA.md](../SCHEMA.md) | Sheet columns vs domain objects |
| [session-fork-platform.md](../topics/session-fork-platform.md) | Normal → Firebase session → GAS commit lifecycle |
| [data-cache-engine.md](../topics/data-cache-engine.md) | Cache coordinator sits **on top of** repos — **Phase 6** per [design lock](dal-firebase-design-lock-2026-07-13.md) |
| [dal-firebase-design-lock-2026-07-13.md](dal-firebase-design-lock-2026-07-13.md) | **Canonical design lock** — execution order, reconciliation, Logistics Hub atomic ops |

---

## Target architecture

```text
UI (PA, Vault, Station, Calendar, Timeline…)
    ↓  google.script.run → repo APIs only (target)
Repositories (domain methods)
    LedgerRepo · ProjectAssetsRepo · TimelineRepo · AssetsRepo · CrewRepo · …
    ↓
Router (one switch per slice)
    normal → SheetsAdapter
    session-open → FirebaseAdapter
    committing → GAS bulk commit only
    ↓
Adapters
    SheetsAdapter      ← today (official)
    FirebaseAdapter    ← prep + timeline session buffer
    (future) SqlAdapter / PostgresAdapter
    ↓
Storage
    Google Sheets (VAULT + ENGINE) · Firebase · (future paid DB)
```

**Session fork rule (unchanged):** While session open, forked slices **never** write Sheets from the client. **Only GAS** snapshots in at open and commits out at close.

**Cache (later):** Client `CacheCoordinator` + GAS read-through cache register policies; invalidation tags emitted by repos — see [data-cache-engine.md](../topics/data-cache-engine.md).

---

## Phase 0 — Discovery sweep (read-only, no behavior changes)

**Canonical checklist:** [dal-firebase-design-lock-2026-07-13.md §7](dal-firebase-design-lock-2026-07-13.md#7-phase-0--codebase-discovery-sweep-instructions-for-cursor)

**Purpose:** Single truth of how the system communicates with storage today. Output feeds Phase 1 inventory tables in this file.

- [x] **`clearContents()` / `setValues()` inventory** — [dal-phase0-discovery-2026-07-13.md §1](dal-phase0-discovery-2026-07-13.md#1-clearcontents--full-rewrite-inventory-engine)
- [x] **Trace `saveProjectAssetsDelta`** — [§2](dal-phase0-discovery-2026-07-13.md#2-saveprojectassetsdelta--end-to-end-trace) — **full tab rewrite confirmed**
- [x] **Trace `saveTimelineData`** — [§3](dal-phase0-discovery-2026-07-13.md#3-savetimelinedata--end-to-end-trace) — **full tab rewrite confirmed**
- [x] **Trace `Operations.js` ledger** — [§4](dal-phase0-discovery-2026-07-13.md#4-operationsjs-ledger-path) — full ledger tab rewrite per batch
- [x] **GAS spreadsheet gateways** — [§5](dal-phase0-discovery-2026-07-13.md#5-spreadsheet-access-model-no-dal-today) (`verifyDatabaseSchema`, `verifyVaultSchema`, `getSheetData`)
- [x] **Client inventory** — [dal-client-inventory.md](dal-client-inventory.md) (generated; `node scripts/dal-client-inventory.js`)
- [x] **Client cache inventory** — same file (`localStorage` keys section)
- [x] **PA save pipeline map** — § Phase 1 preflight below
- [x] **Ledger pipeline map** — § Phase 1 preflight below
- [x] **Schema cross-check** — § Phase 1 preflight below
- [x] **Doc/code inconsistency report** — § Phase 1 preflight below
- [x] **Fragile boundary list** — § Phase 1 preflight below (canonical detail: [dal-phase0-discovery-2026-07-13.md §6](dal-phase0-discovery-2026-07-13.md#6-mandatory-write-boundaries-repos-first))

*Phase 0 core sweep complete 2026-07-13 → [dal-phase0-discovery-2026-07-13.md](dal-phase0-discovery-2026-07-13.md). Client inventory + pre-ship gates complete 2026-07-15 → [dal-pre-ship-gates.md](dal-pre-ship-gates.md). Phase 1 preflight complete 2026-07-15 — Slice A awaits director **OK go**.*

---

## Phase 1 preflight — inventory (2026-07-15)

### PA save pipeline map

| Step | Location | What happens |
|------|----------|--------------|
| 1. Delta calc | `02e5_Logic_Sync.html` — `calculatePaDeltas()` | Diff `originalProjectAssets` vs `currentProjectAssets` by composite key (`assetId`, `location`, `formula`, `containerUid`) → `{ assetId, location, rawFormula, containerUid, deltaQty, isBulk, creator }` |
| 2. Auto-save | `autoSaveAndExecute()` | If deltas → `google.script.run.saveProjectAssetsDelta`; on success → `getProjectAssets` re-fetch |
| 3. Manual save | `saveProjectAssets()` | Same delta path |
| 4. Other callers | `02c_Project_Operations.html`, `02_Project_Editor_Logistics.html` | Ops/checkout + logistics wizard also call `saveProjectAssetsDelta` |
| 5. Server persist | `Logistics_Assets.js` — `saveProjectAssetsDelta` | `verifyDatabaseSchema()` → read full `Project_Assets` → apply deltas in memory → **`clearContents()` + `setValues()` whole tab** → `flushCache()` + audit |
| 6. Post-save client | `autoSaveAndExecute` success handler | **`processFormulas()`** (qty=1 burst for physical) on server + local arrays; **optimistic healing** injects server `uid`s without overwriting unsaved local edits; merge → `originalProjectAssets` snapshot |

**DAL rule:** Repos wrap step 5 only. Steps 1–4 and 6 stay in client engines — **do not move `processFormulas()` or healing into DAL.**

### Ledger pipeline map

| Step | Location | What happens |
|------|----------|--------------|
| 1. Start session | `02c_Project_Operations.html` — `startOperationUI` | `startEventOperation` → `Projects_Index.Active_Operation` + `Active_Session_UID` (partial cell writes) |
| 2. Scan / undo UI | `handleRfidScan`, manual scan, undo | Optimistic `scannedQty` on `currentProjectAssets`; push `{ action, assetId, scanQty/undoQty }` to **`opsQueue`** |
| 3. Debounced commit | `resetOpsTimer` → `commitOpsBatch` (1.5s) | Drain queue → `batchProcessOperations(projectId, batch, actor)` |
| 4. RFID direct | `Operations.js` — `processRfidScan` | Vault resolve → delegates to `batchProcessOperations` with single-item batch |
| 5. Server persist | `batchProcessOperations` | Read `Projects_Index` session fields → read full `Operations_Ledger` + `Project_Assets` + vault → mutate session rows in memory → **`opsLedger.clearContents()` + `setValues()` whole tab** |
| 6. Finalize | `stopOperationUI` | `finalizeEventOperation` → clears index operation fields |

**DAL rule:** `LedgerRepo` wraps steps 1, 4–6 server boundaries. Client `opsQueue` stays until a later slice.

### Schema cross-check

| Sheet (ENGINE) | `Logistics_Schema.js` headers | `SCHEMA.md` | Match |
|----------------|------------------------------|-------------|-------|
| `Project_Assets` | uid, project_uid, asset_uid, assigned_quantity, location, formula, creator, container_uid, scan_status, outbound_*, inbound_* | Listed in ENGINE set; column detail in code | **OK** — schema builder is source of truth for columns |
| `Operations_Ledger` | uid, session_uid, project_uid, operation_type, asset_uid, asset_code, asset_name, department, rfid_tag, timestamp, actor | Listed in ENGINE set | **OK** |
| `Shift_Assignments` | uid, project_uid, Phase_Mode, user_uid, Role, Start, Duration, … | Listed as `Shift_Assignments` | **OK** |
| `Phase_Blocks` | uid, project_uid, Phase_Mode, Phase_Name, Start, Duration, Note | Listed as `Phase_Blocks` | **OK** |
| `Dept_Overrides` | project_uid, Phase_Mode, user_uid, Dept_Name | Listed as `Dept_Overrides` | **OK** |

No column-name drift found between `verifyDatabaseSchema` bootstrap and live save/read code on hot paths.

### Doc/code inconsistency report (prioritized)

| Priority | Doc says | Code does | Action |
|----------|----------|-----------|--------|
| P1 | Design lock §9 / Phase 3 gate: PA + timeline full rewrite | **Confirmed** in `Logistics_Assets.js`, `Logistics_Timeline.js` | Phase 3 — not Slice A |
| P2 | `FRAGILE_ZONES` § Warehouse ledger: "Append to Operations_Ledger" | `batchProcessOperations` **rewrites entire tab** per batch | Update FRAGILE_ZONES when Phase 3 ledger work starts |
| P3 | Timeline collision = row-level safety | 2s `Last_Updated` on `Projects_Index` only | Phase 3 + visible conflict UX per design lock §3 |

### Fragile boundary list (repos first)

| Priority | Repo | Mandatory GAS write/read boundaries | Fragile zones |
|----------|------|-------------------------------------|---------------|
| P0 | `ProjectAssetsRepo` | `saveProjectAssetsDelta`, `getProjectAssets` (+ later: `saveProjectAssetsAPI`, `saveTruckArrangementAPI`) | Formula explosion, UID/healing, Auto-Containerization — **wrap persist only** |
| P0 | `TimelineRepo` | `saveTimelineData`, `getTimelineData` | Collision timestamp — wrap persist only |
| P0 | `LedgerRepo` | `batchProcessOperations`, `startEventOperation`, `finalizeEventOperation`, `processRfidScan` | Warehouse ledger — no assignment mutation outside ledger path |
| P1 | `ProjectRepo` | `saveProjectData`, project delete/restore | Defer to Phase 2+ |

---

## Pre-ship gates (automated — 2026-07-15)

Mechanical enforcement when DAL hot paths change. **Full agent handbook:** [dal-pre-ship-gates.md](dal-pre-ship-gates.md) (do not duplicate here).

- [x] **Client inventory script** — `scripts/dal-client-inventory.js` → [dal-client-inventory.md](dal-client-inventory.md)
- [x] **Persistence lint** — `scripts/dal-persistence-lint.js` (no client sheet access)
- [x] **Phase 3 deploy gate** — `scripts/dal-phase3-gate.js` + `PRE_SHIP_DAL_CONCURRENCY_OK=1`
- [x] **Pre-ship wiring** — `pre-ship/dal.js` in gas layer via `pre-ship/layers.js`
- [ ] **Reconciliation / failed-writes** — Phase 5 product work (not pre-ship)

---

## Execution order (canonical — do not reorder)

From [dal-firebase-design-lock-2026-07-13.md §8](dal-firebase-design-lock-2026-07-13.md#8-execution-order-do-not-reorder):

```text
Phase 0  Discovery sweep (read-only)
Phase 1  Repo interfaces + SheetsAdapter (zero behavior change)
Phase 2  Router (Sheets only) — replace scattered SpreadsheetApp in features
Phase 3  Delta-only saves (saveProjectAssetsDelta / saveTimelineData) — GATE before Firebase
Phase 4  FirebaseAdapter + session open/close lifecycle
Phase 5  Reconciliation engine + failed-writes pocket
Phase 6  Cache Coordinator (per-view policies, tag invalidation)
```

**Then:** warehouse prep, timeline collab, expanded ledger — all via repos.

**Known blocker:** full-sheet rewrite on PA/Timeline save — see design lock §9.

---

## Phase 1–2 — Repos + router (campaign checklist)

*Maps design-lock phases 1–2. **Design spec locked** 2026-07-13 — see [dal-firebase-design-lock-2026-07-13.md](dal-firebase-design-lock-2026-07-13.md).*

### Phase 1 — Repo interfaces + SheetsAdapter (zero behavior change)

- [x] New GAS module — `Dal_Repos.js` (Slice A, 2026-07-15)
- [x] `SheetsAdapter` delegates to current `Operations.js` / save paths — **zero user-visible change**
- [x] `LedgerRepo` skeleton wraps checkout path surface (adapter delegates; public GAS functions not rewired yet)
- [x] `ProjectAssetsRepo` skeleton wraps `saveProjectAssetsDelta` boundary
- [x] `TimelineRepo` skeleton wraps `saveTimelineData` boundary
- [x] Slice B — public GAS APIs delegate to repos; `*Sheets_*` impls called by adapter only (2026-07-15)
- [x] Persistence lint on pre-ship — `scripts/dal-persistence-lint.js` (ongoing; no new client sheet access)

### Phase 2 — Router + inventory tables

- [x] **`Dal_Router.js`** — `projectDataRouter(domain, sessionStatus)` + `DAL_DOMAIN` / `DAL_SESSION` (2026-07-15)
- [x] Repos resolve adapter via router on each call (Sheets-only — zero behavior change)
- [x] **Touchpoint table** — § Phase 2 inventory below
- [x] **Write boundary diagram** — § Phase 2 inventory below
- [x] **“Not on fork” list** — § Phase 2 inventory below
- [x] **Router state machine** — `normal` | `session-open` | `committing` | `closed` (Phase 2: all → Sheets)
- [x] **Firebase path layout** — canonical `/projects/{projectId}/assets|timeline/` (design lock); `sessions/…` legacy doc only — see § Firebase paths
- [x] **Test matrix** — § Phase 2 postflight below
- [x] **Design lock** — [dal-firebase-design-lock-2026-07-13.md](dal-firebase-design-lock-2026-07-13.md) (2026-07-13)

---

## Phase 2 — inventory (2026-07-15)

### Router state machine (Phase 2 behavior)

```text
normal         → SheetsAdapter  (all domains — today)
session-open   → SheetsAdapter  (Phase 4: Firebase for projectAssets + timeline only)
committing     → SheetsAdapter  (Phase 4–5: GAS bulk commit + reconciliation)
closed         → SheetsAdapter
ledger domain  → SheetsAdapter always (atomic per-op — design lock §2; no session fork)
```

Code: `Dal_Router.js` — `projectDataRouter()`, `resolveDalSessionStatus_()` (returns `normal` until Phase 4 session registry).

### Touchpoint table (P0 repos — wired)

| Domain | Repo | Public GAS API | Sheets | Primary client callers | Fragile zone |
|--------|------|----------------|--------|------------------------|--------------|
| Project Assets | `ProjectAssetsRepo` | `saveProjectAssetsDelta`, `getProjectAssets` | `Project_Assets` | `02e5_Logic_Sync.html`, `02c_Project_Operations.html`, `02_Project_Editor_Logistics.html`, `02a_Project_Equipment.html`, `01h_Mobile_Assets.html` | Formula explosion, UID/healing — [EQUIPMENT_MODEL.md](../EQUIPMENT_MODEL.md) |
| Timeline | `TimelineRepo` | `saveTimelineData`, `getTimelineData` | `Shift_Assignments`, `Phase_Blocks`, `Dept_Overrides`, `Project_Timelines` | `03a_Timeline_Boot.html`, `02_Project_Editor_Logistics.html` | Collision timestamp (2s index) |
| Ledger / checkout | `LedgerRepo` | `batchProcessOperations`, `startEventOperation`, `finalizeEventOperation`, `processRfidScan` | `Operations_Ledger`, `Projects_Index` (session fields) | `02c_Project_Operations.html` | Warehouse ledger — [FRAGILE_ZONES.md](../FRAGILE_ZONES.md) |

Full client inventory: [dal-client-inventory.md](dal-client-inventory.md).

### Write boundary diagram

```text
Client google.script.run
    → public GAS fn (saveProjectAssetsDelta, …)
        → get*Repo()
            → projectDataRouter(domain, sessionStatus)   [Dal_Router.js]
                → SheetsAdapter                          [Dal_Repos.js — Phase 2: always]
                    → *Sheets_* impl                     [Logistics_* / Operations.js]
                        → verifyDatabaseSchema + sheet I/O
```

**P1 (not repo-wired yet):** `saveProjectAssetsAPI`, `saveTruckArrangementAPI`, `generateLogisticsPayloadAPI`, `saveEventFromUI`, `deleteProjectFull`, vault/admin CRUD.

### “Not on fork” list (Sheets-only until explicit move)

| Domain | GAS / sheets | Notes |
|--------|--------------|-------|
| Vault master | `Resources_Vault.js`, VAULT tabs | Admin CRUD; station vault reads |
| Crew roster / IAM | `Resources_*`, VAULT directory | Not session-fork hot path |
| Financials | `Projects_Index` planned columns | [topics/financials.md](../topics/financials.md) |
| System config / visuals | `Resources_Core.js`, settings tabs | Stable reference |
| Calendar boot / refresh | `getBootPayload`, `getRefreshPayload` | Not behind repos yet |
| Logistics Hub atomic ops | `LedgerRepo` | Stays Sheets even after prep session (design lock §2) |

### Firebase paths (reconciled for Phase 4+)

**Canonical (implement in Phase 4):** [design lock §2](dal-firebase-design-lock-2026-07-13.md)

- `/projects/{projectId}/assets/`
- `/projects/{projectId}/timeline/`

**Legacy doc only:** [session-fork-platform.md](../topics/session-fork-platform.md) used `sessions/{projectId}/{sessionType}/` — do **not** implement both. Update session-fork doc stub when Phase 4 starts.

### Phase 2 postflight — test matrix (baseline)

Same as Phase 1 — no new UX. Hard refresh once after deploy.

1. Login — app loads.
2. PA — edit → **SAVE EQUIPMENT** → persists after reload.
3. Design → Packing with unsaved edits — saves then switches mode.
4. Check-out — start session, scan/queue, ledger commits (~1.5s).
5. Timeline — save shifts.

**Not in scope:** auto-save on every PA edit; delta-only server saves (Phase 3).

---

## Phase 3 — Delta-only saves (GATE — before Firebase)

**Design lock Phase 3.** No Firebase until this ships and is verified with concurrent-user smoke tests.

- [x] `saveProjectAssetsDeltaSheets_` — scoped row update/delete/append (no `clearContents`)
- [x] `saveTimelineDataSheets_` — scoped project-row delete + append per tab
- [x] `batchProcessOperationsSheets_` — session-scoped delete + append on `Operations_Ledger`
- [x] Shared helpers — `dalDeleteRowsByColumn_`, `dalAppendRows_`, `dalUpdateSheetRow_` in `Dal_Repos.js`
- [x] Director concurrency smoke — **PA verified** (2026-07-15); timeline deferred (editor lock); checkout deferred
- [x] **Shipped GAS v581**

**Preflight (2026-07-15):** Replaced full-tab `clearContents()` + `setValues()` on three hot paths with project/session-scoped row writes. Other PA save paths in `Logistics_Assets.js` still use full rewrite (out of Phase 3 scope).

### Phase 3 postflight — concurrency smoke (partial)

| Test | Result |
|------|--------|
| PA — two managers, same project | **Pass** |
| Timeline — two users within 2s | **Deferred** — timeline editor lock prevents dual edit |
| Checkout — two projects | **Deferred** — future |

---

## Phase 4–6 — Execute (incremental, milestone per slice)

**Rule:** Each slice ships with `node milestone.js` + director smoke test on web.app. Behavior unchanged until a slice explicitly switches routing.

### Phase 4 — Firebase adapters + session lifecycle

*Former campaign label 3B–3C.* **Slice A (2026-07-15):** plumbing only — zero behavior change until a session opens.

- [x] **Slice A** — `Dal_Sessions.js` registry on `Projects_Index` (`Dal_Session_*` columns)
- [x] **Slice A** — `Dal_Firebase.js` adapter + `getFirebasePublicConfig()` (Script Properties)
- [x] **Slice A** — Router selects FirebaseAdapter when session-open (adapter delegates to Sheets)
- [x] **Slice A** — `getDalSessionInfo(projectId)` read-only API
- [x] **Slice B** — `openDalSession` / `closeDalSession` (prep) + Firestore snapshot/commit for PA
- [x] **Slice B** — `FirebaseAdapter` live PA read/write via GAS Firestore REST during prep
- [x] **Slice B** — Hard block direct Sheet PA read/write while prep session open
- [x] **Slice B** — Manager UI: START PREP / END PREP + banner (`02e6_Dal_Session.html`)
- [x] **Slice C** — Client Firestore SDK listeners (real-time multi-user during prep; saves still via GAS)
- [x] **Slice C** — Timeline collab session Phase A (`timelineCollab` open/close + Firestore fork via GAS; START/END COLLAB UI)
- [x] **Timeline live sync** — while both users are in timeline: session open/close + fork state sync (`03a2_Timeline_Dal_Live.html`; Firestore listener with GAS poll fallback); SAVE stays in room during collab
- [x] **Hotfix** — timeline collab thrash: live writes use **full** mode state (not crew-checkbox filter); skip/stash apply during drag; stronger echo/LWW guards (`03a2` + collab path in `saveAndCloseShifts`)
- [x] **Hotfix** — timeline collab lost-updates: **3-way merge** (base/local/remote) + Firestore **transaction** on write; merge-on-apply while dirty; unique shift/phase ids; banner `live sync (merge)`
- [x] **Hotfix** — timeline collab stale overwrite + lag: **touch/patch merge** (only touched entities overwrite remote); 40ms flush; light redraw; server upsert on GAS fork save; banner `live sync (patch)`
- [x] **Hotfix** — force direct live sync on host: Firebase Auth/listen/write via **host-boot** (`SHOWRUNNER_DAL_FS_*`) so web.app users get `patch` not `server patch` after reload
- [x] **Hotfix** — host DAL FS replies via **`ev.source`** (not only `#app-frame`); client posts only to `window.top` (duplicate parent posts made host reply to the wrong nest frame → Auth timeout → `server patch`)
- [x] **Hotfix** — host DAL FS **deep `window.frames` walk** (cross-origin nest) so AUTH_RESULT/SNAP reach inner Index; banner shows server-patch fail reason
- [x] **Prerequisite** — Firebase Console → **Authentication → Get Started** (enable Auth / any sign-in method). Without this, `signInWithCustomToken` returns `auth/configuration-not-found` → server patch. Custom-token minting alone is not enough. (Director enabled 2026-07-17 — live sync `(patch)` confirmed)
- [x] **Hotfix** — timeline collab stutter loop: no flush-on-every-remote; dedupe applied remote sig; ignore stale `fromCache`; writes require explicit touches (no full-diff fallback)
- [x] **Hotfix** — timeline stutter v2: per-entity **local hold** (~2s after touch); monotonic **`writeSeq`** on fork doc; never re-install UI from own write result
- [x] **Hotfix** — `openDalSession` / `closeDalSession` release ScriptLock during Firestore UrlFetch (was starving presence → stuck 🔒 door + client timeout on START COLLAB)
- [x] **Hotfix** — timeline START COLLAB: `beginDalSession` + `finishDalSession` (join if open, reclaim stale opening ~90s, faster Firestore upsert)
- [x] **Slice D — Dual-domain sessions** — prep + timelineCollab **concurrent** on one project (design lock: per project + per domain). Spec: [dal-phase4-slice-d-dual-domain-sessions.md](dal-phase4-slice-d-dual-domain-sessions.md).
  - [x] Independent prep + timeline lifecycle columns on `Projects_Index` (migrate off singleton `Dal_Session_*`)
  - [x] Domain-specific begin/finish/close / stale reclaim / `getDalSessionInfo`
  - [x] Close prep must not touch timeline fork; close timeline must not touch prep fork
  - [x] Smoke: both open → each domain routes only its fork; end either → other stays live (director verified 2026-07-16)
- [x] **Phase 5A** — Post-commit reconcile + failed_writes pocket (prep + timeline); manager alert on mismatch — `Dal_Reconcile.js`
- [x] **Phase 5B** — Retry / purge sweep for failed_writes (`runDalFailedWritesRetrySweep`)
- [x] **Logistics Hub:** atomic per-op path (no fork) per [design lock §2](dal-firebase-design-lock-2026-07-13.md#2-session-lifecycle-by-domain) — `Dal_Ledger.js` journal → Sheets → verify (checkout start/batch/finalize)

**Known gap until Slice D:** ~~one `Dal_Session_*` slot~~ **Resolved v603** — prep and timeline use independent column families. Legacy singleton migrates on first read.

### Phase 5 — Reconciliation + failed-writes pocket

**Prerequisite:** Phase 4 **Slice D** (dual-domain registry) — otherwise close/reconcile keyed only by project can corrupt the other live fork.

- [x] **Phase 5A** — Post-commit signature compare (Firebase intended vs Sheets read-back) for **prep** and **timeline**
- [x] **Phase 5A** — `failed_writes/{projectId}/items/…` pocket + audit + FCM to logistics managers on mismatch
- [x] **Phase 5B** — Retry sweep `runDalFailedWritesRetrySweep` (backoff 30s→60s→5m→30m), 7-day purge, manager alert on retry ≥3; trigger every 5 min via `ensureDalFailedWritesRetryTrigger_`
- [x] Closing domain A never reconciles or deletes domain B’s fork (scoped by domain path + session columns)
- [x] Per-project isolation — never global reconciliation
- [x] **Phase 5C** — Logistics Hub atomic per-op reconcile (design lock §2) — ledger domain in failed_writes + retry sweep

### Phase 6 — Cache coordinator

*Aligns with [data-cache-engine.md](../topics/data-cache-engine.md) Phase A–C.*

**Prerequisite intent from Slice D:** domain-scoped tags so one session close cannot flush the other live fork.

- [x] **Phase 6A** — Client `CacheCoordinator` (`07d_Cache_Coordinator.html`) — `check`, `set`, `invalidate`, `registerPolicy`
- [x] **Phase 6A** — Migrate PA `sm_pa_cache_*` behind coordinator helpers (legacy bridge kept)
- [x] **Phase 6A** — Server `dalInvalidateCacheTags_` — close prep/timeline uses `project:{id}:pa` / `:timeline` (not global flush)
- [x] **Phase 6B** — Migrate calendar / vault / tracker / fleet / clients / warehouse keys behind policies (legacy `sm_*` bridge kept)
- [x] **Phase 6B** — Re-enable GAS `getSheetData` cache; fix `getCacheVersion` V2 key; tag-aware CacheService purge; debug bypass `DAL_SHEET_CACHE_DISABLED=1`

### Later — Migrate remaining domains (as needed)

**Not a close-out gate for this campaign.** Full inventory of what stays outside repo routing until a later pass: **[§ Out of this campaign — not routed through DAL](#out-of-this-campaign--not-routed-through-dal)**.

- [ ] Vault/Assets, Crew, Directory, Config — one repo at a time when touched or when timeouts force move
- [ ] Future SQL/Postgres adapter only after interface proven on Sheets + Firebase

---

## Notes

- **2026-07-05:** Campaign file created from director brainstorm. Execution **deferred** — finish phone app work first.
- **2026-07-15:** Pre-ship DAL gates shipped — [dal-pre-ship-gates.md](dal-pre-ship-gates.md). Phase 1 repos still await **OK go**.
- **2026-07-13:** Director design lock imported → [dal-firebase-design-lock-2026-07-13.md](dal-firebase-design-lock-2026-07-13.md). Phase 3 (delta-only) explicit gate before Firebase.
- **2026-07-15:** **Slice D documented** — dual-domain concurrent prep + timeline — [dal-phase4-slice-d-dual-domain-sessions.md](dal-phase4-slice-d-dual-domain-sessions.md). **Shipped v603.**
- **2026-07-16:** Post-campaign **optional** timeline UX (auto room on enter + idle commit) documented in [../topics/timeline-collab-session.md](../topics/timeline-collab-session.md#optional-update--auto-room--idle-commit) — do **not** build during this campaign; milestone-before-try / revert-if-disliked.
- **2026-07-16:** Director clarified close bar — **not** “absolutely every DB path through DAL.” Documented out-of-campaign inventory below.

## What DAL must NOT do

- Reimplement **Triangle of Truth**, slash parser, or formula rendering.
- Replace **Auto-Containerization** (`recalcAutoContainers`) or **Auto-Packing** (`autoProvisionCableCases`) — repos wrap **persistence after** those engines run.
- Bypass **optimistic healing** / uid rules on PA save.
- Allow **client → Sheets** writes during an open Firebase session for forked slices.

---

## Out of this campaign — not routed through DAL

**Locked intent (2026-07-16):** Closing this campaign does **not** require every Sheets/Firebase read/write to go through a repository. Long-term target remains “everything through the DAL”; the list below is explicitly **deferred / as-needed after campaign close**.

**In campaign (for contrast — already repo-routed or DAL infrastructure):**

| In scope | Path |
|----------|------|
| Project Assets | `ProjectAssetsRepo` ← `saveProjectAssetsDelta` / `getProjectAssets` |
| Timeline | `TimelineRepo` ← `saveTimelineData` / `getTimelineData` |
| Ledger / checkout / RFID ops | `LedgerRepo` ← start / batch / finalize / `processRfidScan` |
| Session registry + open/close/commit | `Dal_Sessions.js`, reconcile, failed-writes |
| Cache coordinator policies for migrated keys | Phase 6A/6B — sits **on** the data story; not a second write path |

**Nuance (still “DAL story,” not a free side door):** while prep/timeline fork is open, the **browser may write Firestore directly** on the fork paths; GAS still owns snapshot/commit. That is intentional live-collab design, not “skip the layer.”

### Domains / surfaces **not** intended to be repo-wired before campaign close

| Area | Typical GAS / modules | Examples (not exhaustive) | Why deferred |
|------|----------------------|---------------------------|--------------|
| **Projects index / event CRUD** | `Logistics_Projects.js` | `saveEventFromUI`, `saveProjectData`, `deleteProjectFull`, `setProjectStatus`, `updateProjectReadiness`, `setProjectDifficultyMultiplier`, `restoreProjectWithConflictCheck`, `generateProjectFolders` | P1 `ProjectRepo` — not fork hot path |
| **PA-adjacent helpers still outside repo** | `Logistics_Assets.js` / logistics APIs | `saveTruckArrangementAPI`, `generateLogisticsPayloadAPI`, legacy `saveProjectAssetsAPI` if still called | Wrap when next touched; core PA delta is already in |
| **Calendar boot / refresh** | boot/refresh payloads | `getBootPayload`, `getRefreshPayload`, `getGlobalMonthData` | Read aggregates; cache policies exist, repos do not |
| **Vault master (assets)** | `Resources_Vault.js` | `getAssetRegistry`, `getVaultAsset`, `saveVaultAsset`, `deleteVaultAsset`, `batchUpdateAssets`, `provisionNewAsset` | Admin + reference; post-campaign as-needed |
| **Clients / fleet vault** | `Resources_Vault.js` / admin | `getClientsVault`, `provisionNewClient`, `deleteClientVault`, `getVehiclesVault`, `saveVehicleVault`, `deleteVehicleVault` | Same |
| **Crew / IAM / directory** | `Resources_*`, `Security.js` | `getSecureIamDirectory`, `provisionNewUser`, `saveDirectoryUpdate`, `deleteUserFromVault`, `saveRoleConfig`, `deleteRoleConfig` | Not session-fork |
| **Warehouse map admin** | `Resources_Warehouse.js` | `getWarehouseData`, `saveWarehouseRoot/Zone/Area`, `saveWarehouseDraft`, `deleteWarehouseEntity` | Admin geometry |
| **Tasks & in-app notifications** | `Logistics_Tasks.js` | `getTasksAndNotifs` / `getTasksNotifsPayload`, `saveTaskData`, `deleteTaskData`, notification CRUD | Separate product surface |
| **Push / FCM registry** | `Notifications_*.js` | VAPID/FCM token save, device admin, test push | Infra + devices, not ENGINE fork data |
| **Financials** | financials hub APIs | `getFinancialsData`, `getFinancialSettings`, `saveFinancialSettings`, `approveShiftPayments` | [topics/financials.md](../topics/financials.md) |
| **Conflicts** | `Conflicts.js` | `getActiveConflicts`, `acknowledgeConflict` | Can route later if needed |
| **Month roster / leave** | roster APIs | `saveLeave`, `deleteLeave` | Crew calendar side |
| **Equipment tracker aggregates** | tracker APIs | `getUnifiedTrackerData` | Read/report path |
| **System config / visuals / tags** | `Resources_System.js` / admin visuals | `getModuleVisualSettings`, `saveModuleVisualSettings`, `saveSystemSettings`, `saveSystemTags`, `getManagerConfig`, `saveManagerConfig` | Stable reference |
| **Audit admin** | `Resources_Audit.js` | `getAuditFlags`, `saveAuditGroups`, `getReviewedAssets`, `setAssetReviewedStatus`, `getEntityAuditHistory` | Admin |
| **Database backup / restore / lock** | `Resources_Database.js` | backup/restore/repair, `beginDatabaseBackupLock`, nightly backup | Ops tooling — keep out of feature repos |
| **Schema bootstrap / migrations** | `Logistics_Schema.js`, `Resources_Migrations.js` | `verifyDatabaseSchema`, vault/engine migrate | **Adapter internals forever** — not UI repos |
| **Audit log writer** | `Resources_Audit.js` | `writeToAuditLog` | Called from many paths; infrastructure |
| **Station shell / gun / mobile scan** | `Station_Security.js`, station HTML | station bootstrap, vault list, RFID map, `processStationRfidScan`, `setStationAssetStatus`, mobile scan bootstrap/status | Station campaign surface; warehouse ledger checkout already uses `LedgerRepo` where wired |
| **Presence / desktop lock / session auth** | presence + login | `reportProjectPresence`, desktop lock verify, `apiLogoutSession`, passcode change | Not persistence domain repos |
| **Drive / integrations / archive jobs** | `Integrations.js`, automation admin | Drive directory, checklist actions, yearly/monthly archive, retro Drive sync | Side systems |
| **Print / email one-shots** | project editor | `printEquipmentList`, `triggerManualCrewEmail` | Output, not DAL storage routing |

### Cache note

Phase 6 migrated **some** client cache keys behind `CacheCoordinator`. That does **not** mean those domains’ **server** reads/writes are repo-routed. Calendar/vault/tracker/fleet/clients/warehouse may use coordinator policies while GAS still hits Sheets outside `get*Repo()`.

### Rule after campaign close

1. **Do not** open new direct `SpreadsheetApp` / raw sheet write paths in feature code — new work goes through a repo (create one if missing).
2. **Do** migrate a deferred row above when that domain is next edited for real, or when timeouts/scale force a move.
3. Optional later: expand this table into stable `docs/ai/DATA_ACCESS.md` when the campaign archives.

---

## When this campaign closes

Move this file to [../archive/](../archive/), update [Project_TODO.md](../Project_TODO.md) **Active campaigns** row, and leave long-term reference in [data-cache-engine.md](../topics/data-cache-engine.md) (+ optional stable `docs/ai/DATA_ACCESS.md` once Phase 1 ships). Carry the **[§ Out of this campaign](#out-of-this-campaign--not-routed-through-dal)** list into that stable doc so “what still bypasses repos” stays visible.
