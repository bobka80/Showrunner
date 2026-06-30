# Unified data cache engine (one API, many policies)

**Entry:** [AI_DOCTRINE.md](../../AI_DOCTRINE.md) · **Index:** [Project_TODO.md](../Project_TODO.md)

**Related:** [session-fork-platform.md](session-fork-platform.md) · [project-assets-concurrency.md](project-assets-concurrency.md) · [ARCHITECTURE.md](../ARCHITECTURE.md)

**Status:** Backlog — consolidate fragmented caches; tune per-screen UX without rewriting modules.

**Last swept:** 2026-06-30

---

## Director intent

**One cache coordinator** for the whole app — not one undifferentiated blob. Every module registers a **policy** (freshness, strategy, invalidation, backend). Tuning how a screen feels = change policy, not hunt ad hoc `localStorage` keys across HTML files.

Cache sits **inside the data router** (same layer as session fork): normal mode → GAS/Sheets; session mode → Firebase; cache rules follow the active backend.

---

## What exists today (fragmented)

| Layer | Today | Gap |
|-------|-------|-----|
| **GAS** | `flushCache()`, `getCacheVersion()`, `vaultAssetCache`, `cachedVaultSheets` | `getSheetData()` sheet cache **disabled** (live-only reads) |
| **Client** | `sm_phantom_payload`, `sm_pa_cache_*`, `sm_tracker_cache`, session/theme keys | No shared invalidation; each module owns keys |

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

- [ ] Client `CacheCoordinator` module — `get(key, policy)`, `set`, `invalidate(tags)`, `subscribe` optional
- [ ] Key namespace registry — document allowed prefixes; ban raw `localStorage` in new code
- [ ] Migrate existing keys behind coordinator:
  - [ ] `sm_phantom_payload` → `calendar:phantom`
  - [ ] `sm_pa_cache_{projectId}` → `project:{id}:pa`
  - [ ] `sm_tracker_cache` → `tracker:{range}`
- [ ] **Re-enable** GAS `getSheetData()` cache for cold vault/directory/config reads — fix why it was disabled; keep bypass flag for debug
- [ ] Wire `flushCache()` → coordinator invalidation tags on server (`vault`, `directory`, `config`)
- [ ] Stale-while-revalidate on calendar boot (already partial via phantom — formalize policy)

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
