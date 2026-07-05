# Active — Data access layer (DAL) + router

**Entry:** [AI_DOCTRINE.md](../../../AI_DOCTRINE.md) · **Canonical topic (target architecture):** [../topics/data-cache-engine.md](../topics/data-cache-engine.md) · **Session fork:** [../topics/session-fork-platform.md](../topics/session-fork-platform.md) · **Files:** [../FILE_MAP.md](../FILE_MAP.md)

**Opened:** 2026-07-05 · **Status:** **Planned — not executing yet** (director finishing phone app work first)

This is the **live campaign file** for the single database layer. It does **not** duplicate [FRAGILE_ZONES.md](../FRAGILE_ZONES.md), [ARCHITECTURE.md](../ARCHITECTURE.md), or [EQUIPMENT_MODEL.md](../EQUIPMENT_MODEL.md) — it **links** to them and adds inventory + migration steps.

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

## Prerequisite for (do not start until DAL campaign reaches Phase 3)

| Blocked until DAL router exists | Topic file |
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
| [data-cache-engine.md](../topics/data-cache-engine.md) | Cache coordinator sits **on top of** repos (Phase after router works) |

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

**Purpose:** Single truth of how the system communicates with storage today. Output feeds Phase 1 inventory tables in this file.

- [ ] **GAS inventory** — catalog every function in `Resources_*.js`, `Logistics_*.js`, `Operations.js`, `Station_Security.js`, `Security.js`, `Integrations.js`, `Conflicts.js` that calls `getSheetData`, `SpreadsheetApp`, `verifyVaultSchema`, `verifyDatabaseSchema`, `flushCache`
- [ ] **Client inventory** — catalog every `google.script.run.*` that hits those backends; group by domain (Vault, PA, Ledger, Timeline, Station, Calendar, Admin)
- [ ] **Client cache inventory** — `localStorage` / in-memory keys (`sm_phantom_payload`, `sm_pa_cache_*`, `sm_tracker_cache`, `sm_station_equip_map_v*`, session/theme keys)
- [ ] **PA save pipeline map** — client delta → `saveProjectAssetsDelta` / related → sheets touched → order of merge, `processFormulas()`, optimistic healing — **do not reimplement inside DAL**
- [ ] **Ledger pipeline map** — scan → optimistic UI → `opsQueue` → `batchProcessOperations` → `Operations_Ledger` + `Projects_Index` session fields
- [ ] **Schema cross-check** — code headers vs [SCHEMA.md](../SCHEMA.md) vs `verifyVaultSchema` / `verifyDatabaseSchema`
- [ ] **Doc/code inconsistency report** — prioritized list (doc says X, code does Y); fixes tracked separately from DAL code
- [ ] **Fragile boundary list** — which functions are **mandatory write boundaries** for repos first (Ledger, ProjectAssets, Timeline saves)

*Sweep may use parallel subagents; merge into this file’s appendices.*

---

## Phase 1 — Canonical inventory doc (this file + appendices)

- [ ] **Touchpoint table** — domain → primary GAS files → primary sheets → client callers → fragile zone link
- [ ] **Write boundary diagram** — what repos wrap first vs migrate later
- [ ] **“Not on fork” list** — vault master, crew roster, financials, config (Sheets-only until explicitly moved)
- [ ] **Router state machine** — `normal` | `session-open` | `committing` | `closed`
- [ ] **Inconsistency backlog** — doc fixes scheduled (no silent scope creep)

---

## Phase 2 — Design lock (director approval before Phase 3 code)

- [ ] **Repo interface drafts** — method lists (domain-shaped, not row/column shaped):
  - [ ] `LedgerRepo` — append event, session open/close, commit, counts (covers today checkout + future prep-expanded ledger)
  - [ ] `ProjectAssetsRepo` — get/save deltas, revision checks
  - [ ] `TimelineRepo` — get/save shifts/phases (collab fork)
  - [ ] Later: `AssetsRepo`, `CrewRepo`, `DirectoryRepo`, `ConfigRepo`
- [ ] **Adapter registry** — single factory / registration point (the reroute knob)
- [ ] **Firebase path layout** — session-scoped Firestore paths (align [session-fork-platform.md](../topics/session-fork-platform.md))
- [ ] **Test matrix** — manual checks after each migration slice (normal day unchanged; session open/close; no double-write)
- [ ] **Director OK go** recorded in [RELEASES.md](../../../RELEASES.md) or campaign note when approved

---

## Phase 3 — Execute (incremental, milestone per slice)

**Rule:** Each slice ships with `node milestone.js` + director smoke test on web.app. Behavior unchanged until a slice explicitly switches routing.

### 3A — Router shell + Sheets adapters (no Firebase yet)

- [ ] New GAS module(s) for repos + `SheetsAdapter` (exact filename TBD in Phase 2)
- [ ] `SheetsAdapter` delegates to current `Operations.js` / save paths — **zero user-visible change**
- [ ] `LedgerRepo` wraps checkout append path; old public functions delegate to repo
- [ ] `ProjectAssetsRepo` wraps `saveProjectAssetsDelta` boundary
- [ ] Ban **new** direct sheet access in touched files (comment + lint note in campaign)

### 3B — Session lifecycle (still Sheets official; Firebase stub optional)

- [ ] Session metadata on `Projects_Index` + mirror for UI (`sessionType`, `status`, `openedBy`)
- [ ] GAS-only open snapshot / commit-out APIs (design from session-fork-platform)
- [ ] Router reads session flag; defaults to Sheets

### 3C — Firebase adapters (prep + timeline)

- [ ] `FirebaseAdapter` for `LedgerRepo` + `ProjectAssetsRepo` when prep session open
- [ ] `FirebaseAdapter` for `TimelineRepo` when timeline collab session open
- [ ] Hard block direct Sheet writes for forked slices while session open
- [ ] End session → GAS commit → router back to Sheets

### 3D — Cache coordinator (after 3A–3C stable)

- [ ] Client `CacheCoordinator` per [data-cache-engine.md](../topics/data-cache-engine.md) Phase A
- [ ] Migrate existing `localStorage` keys behind policies
- [ ] Re-enable / harden GAS `getSheetData` cache for cold reads (tag-aware `flushCache`)

### 3E — Migrate remaining domains (as needed)

- [ ] Vault/Assets, Crew, Directory, Config — one repo at a time when touched or when timeouts force move
- [ ] Future SQL/Postgres adapter only after interface proven on Sheets + Firebase

---

## Execution order (summary)

```text
Phase 0  Discovery sweep (read-only)
Phase 1  Inventory tables in this file
Phase 2  Design lock + director OK go
Phase 3A SheetsAdapter + Ledger/PA repos
Phase 3B Session lifecycle shell
Phase 3C Firebase adapters (prep + timeline)
Phase 3D Cache coordinator
Phase 3E Other domains incrementally
```

**Then:** warehouse prep features, expanded ledger events, timeline collab room — all via repos, not ad hoc Firebase calls.

---

## What DAL must NOT do

- Reimplement **Triangle of Truth**, slash parser, or formula rendering.
- Replace **Auto-Containerization** (`recalcAutoContainers`) or **Auto-Packing** (`autoProvisionCableCases`) — repos wrap **persistence after** those engines run.
- Bypass **optimistic healing** / uid rules on PA save.
- Allow **client → Sheets** writes during an open Firebase session for forked slices.

---

## When this campaign closes

Move this file to [../archive/](../archive/), update [Project_TODO.md](../Project_TODO.md) **Active campaigns** row, and leave long-term reference in [data-cache-engine.md](../topics/data-cache-engine.md) (+ optional stable `docs/ai/DATA_ACCESS.md` once Phase 3A ships).

---

## Notes

- **2026-07-05:** Campaign file created from director brainstorm. Execution **deferred** — finish phone app work first; return with **OK go** to start Phase 0 sweep.
