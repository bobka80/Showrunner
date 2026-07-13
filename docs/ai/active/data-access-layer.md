# Active — Data access layer (DAL) + router

**Entry:** [AI_DOCTRINE.md](../../../AI_DOCTRINE.md) · **Canonical topic (target architecture):** [../topics/data-cache-engine.md](../topics/data-cache-engine.md) · **Session fork:** [../topics/session-fork-platform.md](../topics/session-fork-platform.md) · **Files:** [../FILE_MAP.md](../FILE_MAP.md)

**Opened:** 2026-07-05 · **Status:** **Design locked 2026-07-13** — not executing code yet (phone app first). **Next:** Phase 0 discovery sweep on **OK go**.

**Design lock (canonical spec):** [dal-firebase-design-lock-2026-07-13.md](dal-firebase-design-lock-2026-07-13.md) — architecture, session lifecycles, reconciliation, cache API, execution order, Phase 0 checklist.

**Phase 0 discovery (2026-07-13):** [dal-phase0-discovery-2026-07-13.md](dal-phase0-discovery-2026-07-13.md) — **complete** (read-only). Confirms full-sheet rewrite on PA, timeline, and ledger. **Next:** Phase 1 repos on **OK go**.

**Phase safety playbook (for fresh chats):** [dal-phase-safety-playbook.md](dal-phase-safety-playbook.md) — phase-by-phase preflight/postflight sweeps + security guardrails.

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
- [ ] **Client inventory** — catalog every `google.script.run.*` that hits those backends; group by domain (Vault, PA, Ledger, Timeline, Station, Calendar, Admin)
- [ ] **Client cache inventory** — `localStorage` / in-memory keys (`sm_phantom_payload`, `sm_pa_cache_*`, `sm_tracker_cache`, `sm_station_equip_map_v*`, session/theme keys)
- [ ] **PA save pipeline map** — client delta → `saveProjectAssetsDelta` / related → sheets touched → order of merge, `processFormulas()`, optimistic healing — **do not reimplement inside DAL**
- [ ] **Ledger pipeline map** — scan → optimistic UI → `opsQueue` → `batchProcessOperations` → `Operations_Ledger` + `Projects_Index` session fields
- [ ] **Schema cross-check** — code headers vs [SCHEMA.md](../SCHEMA.md) vs `verifyVaultSchema` / `verifyDatabaseSchema`
- [ ] **Doc/code inconsistency report** — prioritized list (doc says X, code does Y); fixes tracked separately from DAL code
- [ ] **Fragile boundary list** — which functions are **mandatory write boundaries** for repos first (Ledger, ProjectAssets, Timeline saves) — see [dal-phase0-discovery-2026-07-13.md](dal-phase0-discovery-2026-07-13.md) §6

*Phase 0 core sweep complete 2026-07-13 → [dal-phase0-discovery-2026-07-13.md](dal-phase0-discovery-2026-07-13.md). Remaining bullets = Phase 1 inventory.*

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

- [ ] New GAS module(s) for repos + `SheetsAdapter` (exact filename TBD)
- [ ] `SheetsAdapter` delegates to current `Operations.js` / save paths — **zero user-visible change**
- [ ] `LedgerRepo` wraps checkout append path; old public functions delegate to repo
- [ ] `ProjectAssetsRepo` wraps `saveProjectAssetsDelta` boundary
- [ ] `TimelineRepo` wraps `saveTimelineData` boundary
- [ ] Ban **new** direct sheet access in touched files (comment + lint note in campaign)

### Phase 2 — Router + inventory tables

- [ ] **Touchpoint table** — domain → primary GAS files → primary sheets → client callers → fragile zone link
- [ ] **Write boundary diagram** — what repos wrap first vs migrate later
- [ ] **“Not on fork” list** — vault master, crew roster, financials, config (Sheets-only until explicitly moved)
- [ ] **Router state machine** — `normal` | `session-open` | `committing` | `closed`
- [ ] Centralized `projectDataRouter(domain, sessionStatus)` — **Sheets only** for now
- [ ] **Firebase path layout** — reconcile `projects/{id}/…` vs `sessions/{id}/{type}/` (design lock vs [session-fork-platform.md](../topics/session-fork-platform.md))
- [ ] **Test matrix** — manual checks after each migration slice
- [x] **Design lock** — [dal-firebase-design-lock-2026-07-13.md](dal-firebase-design-lock-2026-07-13.md) (2026-07-13)

---

## Phase 3 — Delta-only saves (GATE — before Firebase)

**Design lock Phase 3.** No Firebase until this ships and is verified with concurrent-user smoke tests.

- [ ] `saveProjectAssetsDelta` — replace `clearContents()` + `setValues()` with true delta/range writes
- [ ] `saveTimelineData` — same for Shifts/Phases/Overrides
- [ ] Director smoke test: two managers editing same project PA — no silent overwrite
- [ ] `node milestone.js` + note in RELEASES.md

---

## Phase 4–6 — Execute (incremental, milestone per slice)

**Rule:** Each slice ships with `node milestone.js` + director smoke test on web.app. Behavior unchanged until a slice explicitly switches routing.

### Phase 4 — Firebase adapters + session lifecycle

*Former campaign label 3B–3C.*

- [ ] `FirebaseAdapter` for `LedgerRepo` + `ProjectAssetsRepo` when prep session open
- [ ] `FirebaseAdapter` for `TimelineRepo` when timeline collab session open
- [ ] Hard block direct Sheet writes for forked slices while session open
- [ ] End session → GAS commit → router back to Sheets
- [ ] **Logistics Hub:** atomic per-op path (no fork) per [design lock §2](dal-firebase-design-lock-2026-07-13.md#2-session-lifecycle-by-domain)

### Phase 5 — Reconciliation + failed-writes pocket

- [ ] Post-commit cell-by-cell reconciliation (Firebase vs Sheets)
- [ ] `failed_writes/{projectId}/{timestamp}/{deltaId}` — retry backoff, 7-day retention, manager alert on failure
- [ ] Per-project isolation — never global reconciliation

### Phase 6 — Cache coordinator

*Aligns with [data-cache-engine.md](../topics/data-cache-engine.md) Phase A–C.*

- [ ] Client `CacheCoordinator` per [design lock §4](dal-firebase-design-lock-2026-07-13.md#4-caching-strategy-cache-coordinator) — public API: `check`, `set`, `invalidate`, `registerPolicy`
- [ ] Migrate existing `localStorage` keys behind policies
- [ ] Re-enable / harden GAS `getSheetData` cache for cold reads (tag-aware `flushCache`)

### Later — Migrate remaining domains (as needed)

- [ ] Vault/Assets, Crew, Directory, Config — one repo at a time when touched or when timeouts force move
- [ ] Future SQL/Postgres adapter only after interface proven on Sheets + Firebase

---

## Notes

- **2026-07-05:** Campaign file created from director brainstorm. Execution **deferred** — finish phone app work first.
- **2026-07-13:** Director design lock imported → [dal-firebase-design-lock-2026-07-13.md](dal-firebase-design-lock-2026-07-13.md). Phase 3 (delta-only) explicit gate before Firebase. Say **OK go** to start Phase 0 sweep.

## What DAL must NOT do

- Reimplement **Triangle of Truth**, slash parser, or formula rendering.
- Replace **Auto-Containerization** (`recalcAutoContainers`) or **Auto-Packing** (`autoProvisionCableCases`) — repos wrap **persistence after** those engines run.
- Bypass **optimistic healing** / uid rules on PA save.
- Allow **client → Sheets** writes during an open Firebase session for forked slices.

---

## When this campaign closes

Move this file to [../archive/](../archive/), update [Project_TODO.md](../Project_TODO.md) **Active campaigns** row, and leave long-term reference in [data-cache-engine.md](../topics/data-cache-engine.md) (+ optional stable `docs/ai/DATA_ACCESS.md` once Phase 1 ships).
