# DAL + Firebase Architecture — design lock (2026-07-13)

**Campaign:** [data-access-layer.md](data-access-layer.md) · **Index:** [Project_TODO.md](../Project_TODO.md)

**Status:** **Design locked** — Phase 0–4 (through Slice C) executed in campaign; **Slice D** (dual-domain sessions) documented next — [dal-phase4-slice-d-dual-domain-sessions.md](dal-phase4-slice-d-dual-domain-sessions.md). Track live checklists in [data-access-layer.md](data-access-layer.md).

**Scope:** Replace current full-sheet-rewrite pattern with Firebase-first session forks, per-view caching, and reconciliation.

> **Firestore paths (canonical):** `/projects/{projectId}/assets/` and `/projects/{projectId}/timeline/`. Older `sessions/{projectId}/{sessionType}/` sketch in [session-fork-platform.md](../topics/session-fork-platform.md) is historical only.

---

## 1. Architecture Overview

UI Layer (Project Assets, Timelines, Logistics Hub)
    ↓
Cache Coordinator (hot/cold per-view policies, tag-based selective flush)
    ↓
Repositories (domain-only methods — no SpreadsheetApp/Firebase calls directly)
    - ProjectAssetsRepo
    - TimelineRepo
    - LedgerRepo (Logistics Hub)
    - CrewRepo
    - ...others
    ↓
DAL Router (decides backend per project per domain)
    session-closed → SheetsAdapter
    session-open   → FirebaseAdapter
    ↓
Adapters
    - SheetsAdapter   (Level 0 — source of truth, durable)
    - FirebaseAdapter (Level 1 — live working layer, autosave)
    ↓
Storage
    - Level 0: Google Sheets (official record between sessions)
    - Level 1: Firebase (session buffer, real-time collab)
    - Level 2: Firebase failed-writes pocket (7-day retry window)

---

## 2. Session Lifecycle by Domain

### Project Assets & Project Timelines (human collaborative editing)
- **Fork open:** first person to open the view triggers snapshot Sheets → Firebase (per project, per domain — `/projects/{projectId}/assets/`, `/projects/{projectId}/timeline/`)
- **During session:** all reads/writes route to Firebase. Autosave on every user action (no save buttons). Writes are **delta-only**, never full-sheet rewrites. Real-time listeners show live changes to everyone in the fork (visibility eliminates "I didn't know someone else changed this").
- **No periodic sync to Sheets during the day** — Sheets is not touched at all while session is active, so other Sheets work isn't disturbed.
- **Fork close:** last person leaves → one final bulk delta commit, Firebase → Sheets.
  - Success → **reconciliation engine** compares Firebase snapshot vs actual Sheets content, cell by cell. Match → mark complete, clear pocket, notify managers ("Project X saved at 6:47 PM").
  - Failure → delta queued in **failed-writes pocket** (`failed_writes/{projectId}/{timestamp}/{deltaId}`), retried with backoff (30s, 60s, 5m, 30m…), **high-priority alert sent to all managers immediately** (not silent). Kept up to 7 days, then auto-purged with a log entry.
- Cache Coordinator does a **selective flush** on close (only that project/domain's tags), not a global wipe.

### Logistics Hub (button-press, non-human-editing operations)
- **No fork, no autosave.** Each action (pack, load truck, checkout) is one atomic transaction in Firebase: begin → do work → commit.
- Immediately after commit, reconciliation engine verifies Sheets received it. Failure → alert immediately, don't chain to next operation.
- Why different: these are system-triggered discrete operations, not sustained human editing — nothing to "lose" mid-session.

---

## 3. Conflict Resolution

- **Strategy:** last-write-wins + visible notification, not silent overwrite or hard locking.
  - Example: Manager A sets qty to 10, saves. Manager B sets same field to 15, saves after. Manager A sees: "John Smith changed this to 15 after your edit. Your value (10) was overwritten."
- Physical constraints (RFID/QR scans) already prevent true double-booking of physical items — data-layer conflicts are metadata only (e.g. manager adding items while gate is finalizing a checkout count), and are rare enough that last-write-wins + notification is sufficient. No need for field locking or CRDT-level merge.

---

## 4. Caching Strategy (Cache Coordinator)

Sits **between UI and repos** — never inside adapters, never inside Firebase/Sheets code.

| View | Policy | Staleness tolerance | Invalidation |
|---|---|---|---|
| Project Assets (active fork) | Hot | seconds | real-time on write |
| Timeline (active fork) | Hot | seconds | real-time on write |
| Vault / reference views | Cold | tens of minutes | tag-based |
| Calendar | Warm | minutes | tag-based |
| Logistics Hub | Cold / network-only | none | invalidate after each op |

**Isolation requirements (important — this module gets modified often):**
- `CacheCoordinator.check(key, policy)`, `.set(key, data, policy)`, `.invalidate(tag)`, `.registerPolicy(name, rules)` — this is the entire public surface.
- Repos **emit** invalidation tags on write (e.g. `project:123:pa`) — they never contain cache logic themselves.
- UI always calls the cache coordinator first, never repos directly, so caching changes never require touching UI or repo code.
- Invalidation is **tag-based and selective** — never a global flush.

---

## 5. Cross-Project Isolation

- Every project's fork is fully independent: `/projects/{projectId}/...` in Firestore. Fork A (Project A assets) and Fork B (Project B timeline) never share state.
- Every delta is tagged with `project_uid`. Failed-writes pocket entries retain project context so retries route back to the correct Sheets tabs.
- Reconciliation runs **per project**, never globally, even with 10+ forks open simultaneously across different projects.

---

## 6. Critical Design Rules (do not violate)

1. Sheets is always the source of truth **between** sessions. Firebase is never authoritative long-term — if Firebase data is ever lost before sync, Sheets is the restore point.
2. No periodic/interval sync to Sheets during an active session — only one final commit at fork close (Assets/Timeline). Logistics syncs immediately per-operation instead.
3. Failed syncs are never silently dropped — queued, retried, and surfaced via high-priority manager alert.
4. Conflict resolution must stay visible to users (notification), never a silent destructive overwrite.
5. Cache Coordinator must remain an isolated module — safe to heavily modify later without breaking DAL/repos/adapters.
6. Every fork is scoped to one project + one domain. No cross-project data ever shares a fork.
7. **Concurrent domains on one project are allowed and required** — prep (`assets`) and timeline (`timeline`) may both be open at once. Session registry, close, reconciliation, and cache flush are **per domain**. A singleton “one session per project” slot is a Phase 4 Slice A–C shortcut and is **not** the locked end state — see [dal-phase4-slice-d-dual-domain-sessions.md](dal-phase4-slice-d-dual-domain-sessions.md) (**Phase 4 Slice D**, before Phase 5).

---

## 7. Phase 0 — Codebase Discovery Sweep (instructions for Cursor)

Before writing any DAL code, answer these by reading the actual GAS source (not assuming from docs):

1. **Find every `clearContents()` / `setValues()` call** across all ENGINE-related `.js`/`.gs` files (not just Project Assets and Timeline) — build a table of: function name → file → sheet(s) touched → full-rewrite or partial.
2. **Trace `saveProjectAssetsDelta`** end to end: client delta calc → server function → exact sheet(s)/ranges written. Confirm whether it's full-rewrite today (initial audit found `clearContents()` + `setValues()` — verify still true).
3. **Trace `saveTimelineData`** end to end the same way (Shifts/Phases/Overrides sheets).
4. **Trace `Operations.js` ledger append path** — is it already delta/append-only, or does any part of it also do a full rewrite? Does it touch Sheets directly or through some existing abstraction?
5. **Catalog every direct `SpreadsheetApp` call** in `Logistics_*.js`, `Operations.js`, `Resources_*.js` (and any other engine files) — mark which are read boundaries vs write boundaries.
6. Report findings as a table before any refactor begins.

## 8. Execution Order (do not reorder)

- **Phase 0:** Discovery sweep above — confirm actual write surface area, don't assume.
- **Phase 1:** Extract repo interfaces only (`ProjectAssetsRepo`, `TimelineRepo`, `LedgerRepo`) + a `SheetsAdapter` that wraps *existing* save/read code with zero behavior change.
- **Phase 2:** Centralized router (`projectDataRouter(domain, sessionStatus)`), hard-wired to Sheets only for now. Replace scattered direct `SpreadsheetApp` calls in features with repo calls.
- **Phase 3:** Fix full-rewrite → delta-only writes in `saveProjectAssetsDelta` / `saveTimelineData` (this is the single highest-priority blocker — with 10-12 concurrent users, full rewrites silently overwrite each other today).
- **Phase 4:** FirebaseAdapter + session open/close lifecycle (snapshot on open, commit on close) — only once router + repos exist.
  - **Phase 4 Slice D (required before Phase 5):** dual-domain session registry so prep + timeline can be open concurrently — [dal-phase4-slice-d-dual-domain-sessions.md](dal-phase4-slice-d-dual-domain-sessions.md).
- **Phase 5:** Reconciliation engine (Firebase vs Sheets comparison post-sync) + failed-writes pocket — keys include **domain + sessionUid**.
- **Phase 6:** Cache Coordinator with per-view policies and **domain-scoped** tag-based invalidation.

---

## 9. Known Blocker (highest priority)

`saveProjectAssetsDelta` and `saveTimelineData` currently do `clearContents()` + `setValues()` — a full rewrite of the entire sheet on every save. With multiple concurrent users, the second person to save silently overwrites the first person's changes. **This must become delta-only before any Firebase work begins**, since Firebase forking doesn't help if the underlying write pattern is still destructive.
