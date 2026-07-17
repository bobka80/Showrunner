# Unified data cache engine (one API, many policies)

**Entry:** [AI_DOCTRINE.md](../../../AI_DOCTRINE.md) · **Index:** [Project_TODO.md](../Project_TODO.md)

**Related:** [session-fork-platform.md](session-fork-platform.md) · [project-assets-concurrency.md](project-assets-concurrency.md) · [ARCHITECTURE.md](../ARCHITECTURE.md)

**Status:** **Phase 6B live** — client CacheCoordinator covers PA + calendar/vault/tracker/fleet/clients/warehouse; GAS `getSheetData` cache re-enabled with tag-aware purge. See [active/data-access-layer.md](../active/data-access-layer.md).

**Last swept:** 2026-07-17

**Design lock — Cache Coordinator public API:** [../active/dal-firebase-design-lock-2026-07-13.md §4](../active/dal-firebase-design-lock-2026-07-13.md#4-caching-strategy-cache-coordinator) — `check`, `set`, `invalidate`, `registerPolicy`; UI → coordinator → repos (never UI → repos directly).

**Active campaign:** [../active/data-access-layer.md](../active/data-access-layer.md) · **Design locked 2026-07-13**

### Calendar refresh (contour)

- `refreshData()` in `01a_Calendar_Core.html` — when the calendar **already has events**, refresh is **quiet** (no opacity 0.4 “sing”); stale-while-revalidate. Use `{ forceDim: true }` only for a hard blocking reload.
- Phantom payload (`calendar:phantom` / `dalCacheSetPhantom_`) still updated on success.
---

## Director intent

**One cache coordinator** for the whole app — not one undifferentiated blob. Every module registers a **policy** (freshness, strategy, invalidation, backend). Tuning how a screen feels = change policy, not hunt ad hoc `localStorage` keys across HTML files.

Cache sits **inside the data router** (same layer as session fork): normal mode → GAS/Sheets; session mode → Firebase; cache rules follow the active backend.

### Director restate — 2026-07-03

Two linked pillars, reaffirmed:

1. **One smart cache engine, many per-view policies.** It must **never nuke everything** on a change — invalidation is **surgical/tag-scoped** (`project:123`, `vault`, one row), not a global flush. It must stay **fast but never mask new information**: the pattern is **stale-while-revalidate** — show cached instantly, refresh in the background, swap in fresh data + a subtle "syncing…" cue. (Already modelled below via the policy schema + invalidation tags — this restate just pins it as a hard requirement.)

2. **One backend-abstraction layer (the "single layer that speaks to the whole database").** See new section [Data access layer](#data-access-layer-backend-abstraction) — the goal is to reroute to a paid DB (SQL / Postgres / higher-tier Firebase) from **one place**, without touching feature code.

The cache engine sits **on top of** the data access layer: the DAL says *where the data lives and how to read/write it*; the cache says *how fresh each view needs it to feel*. Build the DAL seam first (or alongside) so the cache has one clean thing to wrap.

---

## What exists today (fragmented)

| Layer | Today | Gap |
|-------|-------|-----|
| **GAS** | `flushCache()`, `getCacheVersion()`, `vaultAssetCache`, `cachedVaultSheets`, `dalInvalidateCacheTags_` | `getSheetData()` **re-enabled** (CacheService + in-memory); bypass via `DAL_SHEET_CACHE_DISABLED=1` |
| **Client** | `CacheCoordinator` + legacy `sm_*` bridges | Tag invalidation; new code should use `dalCache*` helpers |

**Goal:** replace sprawl with `get` / `set` / `invalidate(tags)` + registered policies.

---

## Architecture (target)

```text
UI modules
    ↓
Data router (normal | session backend)
    ↓
Cache coordinator (one API)
    ├─ policy: vault-cold
    ├─ policy: calendar-warm
    ├─ policy: pa-floor-hot
    └─ policy: timeline-session-live
    ↓
Stores (layered — not one bucket)
    ├─ memory (request / tab hot)
    ├─ IndexedDB or localStorage (boot / offline warm)
    ├─ GAS CacheService (server read-through)
    └─ Firebase (live buffer during session fork)
```

**Not:** one global TTL, one store, cache-through to Sheets during active fork.

---

## Data access layer (backend abstraction)

**What it's called:** a **Data Access Layer (DAL)** — implemented with the **Repository pattern** (a.k.a. **DAO**, Data Access Object) — where each concrete backend is a swappable **adapter/driver**. Collectively: a **persistence / database-abstraction layer**. Being able to re-point to another database "from one place" is exactly the payoff of a **backend-agnostic repository with pluggable adapters**.

**Intent (director, 2026-07-03):** every feature talks to **domain repositories** (`AssetsRepo.getForProject(id)`, `CrewRepo.setRfid(...)`, `LedgerRepo.append(...)`), never directly to `SpreadsheetApp` / raw sheets / Firebase. Behind the repository interface sits one active **adapter**: `SheetsAdapter` today; tomorrow `PostgresAdapter`, `SqlAdapter`, or `FirebasePaidAdapter`. Swap the adapter in **one registration point** → the whole app reroutes.

**Campaign close bar (2026-07-16):** the live DAL campaign does **not** migrate every domain before close. Inventory of what stays outside repos until as-needed: [active/data-access-layer.md § Out of this campaign](../active/data-access-layer.md#out-of-this-campaign--not-routed-through-dal).

```text
Feature code (GAS + client)
    ↓  (domain methods only)
Repositories  (AssetsRepo, CrewRepo, ProjectRepo, LedgerRepo, DirectoryRepo …)
    ↓
Backend adapter (ONE active)
    ├─ SheetsAdapter      ← today
    ├─ PostgresAdapter    ← future paid DB
    ├─ SqlAdapter         ← future
    └─ FirebaseAdapter    ← session fork / paid tier
```

**Design rules so the port isn't leaky:**
- Repository methods are **domain operations**, not raw rows (return typed records, take deltas) — Sheets' whole-sheet reads / row indexes must not leak into the interface, or a SQL port stays painful.
- **Writes go through the repo** (so Optimistic-Healing merge, audit, and cache invalidation all hook in one place).
- Cache invalidation **tags are emitted by the repo**, not by feature code.
- Keep the interface small and stable; adapters absorb backend quirks (GAS runtime limits, Sheets quotas, SQL transactions).

**Reality check (see answers in chat):** *possible* — yes; *smart* — yes, it's the standard way to stay portable and testable; *hard* — **moderate**, and the cost is mostly **untangling the many direct sheet calls** scattered across GAS files into the gateway, plus designing domain-shaped methods that fit both Sheets and SQL. Do it **incrementally**, one domain (repo) at a time, starting with the noisiest (Assets / Vault).

**Checklist:**
- [ ] Define repository interfaces per domain (Assets, Crew, Project, Directory, Ledger, Config)
- [ ] Extract current `SpreadsheetApp` / `getSheetData` / `verifyVaultSchema` calls behind `SheetsAdapter`
- [ ] One **adapter registry** / factory — the single reroute point
- [ ] Route the cache coordinator through repos (repos emit invalidation tags)
- [ ] Migrate one domain end-to-end as the proof (recommend **Assets/Vault**), then the rest
- [ ] Only then consider a real second adapter (Postgres) — interface must be proven first

---

## Policy schema (per domain / screen)

Each policy defines:

| Knob | Examples |
|------|----------|
| **Namespace** | `vault:assets`, `project:{id}:pa`, `calendar:phantom` |
| **Freshness** | Vault minutes OK · PA on floor seconds · notifications push-invalidated |
| **Strategy** | `cache-first` · `stale-while-revalidate` · `network-only` · `session-live` |
| **Backend** | `sheets` · `gas-cache` · `firebase` (when session open) |
| **Invalidation tags** | `project:123`, `vault`, `directory` — granular, not flush-all |
| **UI contract** | Show cached instantly · block spinner · show cache + subtle “syncing…” |
| **Revision** | Optional `paRev` / `timelineRev` for cheap stale checks |

**Presets (examples):** `office-cold`, `calendar-warm`, `floor-hot`, `session-live`.

---

## Implementation checklist

### Phase A — Shell + cold reads (no session fork required)

- [x] Client `CacheCoordinator` module — `check`/`set`/`invalidate`/`registerPolicy` (`07d_Cache_Coordinator.html`)
- [x] Key namespace registry — logical keys + legacy bridges; prefer `dalCache*` helpers in new code
- [x] Migrate existing keys behind coordinator:
  - [x] `sm_phantom_payload` → `calendar:phantom`
  - [x] `sm_pa_cache_{projectId}` → `pa:{id}` / tag `project:{id}:pa`
  - [x] `sm_tracker_cache` → `tracker` (range stored inside payload)
  - [x] `sm_vault_cache` / `sm_wh_cache` / `sm_fleet_cache` / `sm_clients_cache`
- [x] **Re-enable** GAS `getSheetData()` cache for cold reads — fixed V2 version key; bypass `DAL_SHEET_CACHE_DISABLED=1`
- [x] Wire selective `dalInvalidateCacheTags_` → CacheService key purge by sheet map (`vault`, `directory`, PA/timeline)
- [x] Stale-while-revalidate on calendar boot (phantom policy `calendar-warm`)

### Phase B — Hot paths + revisions

- [ ] Per-project revision counter from GAS (`paRev`, `timelineRev`, `projectRev`)
- [ ] PA / checkout: invalidate on revision bump + digest (see [project-assets-concurrency.md](project-assets-concurrency.md))
- [ ] Collision-aware cache: do not merge stale PA over fresh server row
- [ ] Policy presets table in code or Master Settings (director-tunable later)

### Phase C — Session fork integration

- [ ] Router flips policy backend: `sheets` → `firebase` when prep/timeline session open
- [ ] During session: **no** Sheets read-through cache for forked slices
- [ ] On session commit: `invalidate('project:{id}:*')` + clear Firebase listener mirrors
- [ ] Shared with [session-fork-platform.md](session-fork-platform.md) — build router shell together

### Phase D — Scale (only if needed)

- [ ] IndexedDB for large PA payloads (localStorage ~5MB limit)
- [ ] FCM / notification hooks → `invalidate` tags (tasks, project list)
- [ ] Optional service-worker cache for static shell (Firebase Hosting) — separate from data cache

---

## Code touchpoints (planned)

- [ ] New client module e.g. `09_Data_Cache.html` or `07*` globals extension
- [ ] `Resources_Core.js` — restore + harden `getSheetData` cache; tag-aware `flushCache`
- [ ] `01a_Calendar_Core.html`, `02a_Project_Equipment.html`, `01h_Mobile_Assets.html`, `04b_Equipment_Tracker.html` — migrate to coordinator
- [ ] Session fork routers — policy backend switch

---

## Fragile zones

- [FRAGILE_ZONES.md](../FRAGILE_ZONES.md) — boot, phantom payload, session token
- Optimistic Healing merge ([ARCHITECTURE.md](../ARCHITECTURE.md)) — cache must not bypass merge rules on PA save

---

## Stable reference (when built)

Add `docs/ai/DATA_CACHE.md` (policies, namespaces, invalidation map) — **not** until Phase A ships.

---

## Build order note

**Phase A** can start before Firebase sessions. **Phase C** requires [session-fork-platform.md](session-fork-platform.md) router shell. Build in parallel with session fork where possible.
