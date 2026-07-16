# Phase 4 Slice D — Dual-domain sessions (prep + timeline concurrent)

**Campaign:** [data-access-layer.md](data-access-layer.md) · **Design lock:** [dal-firebase-design-lock-2026-07-13.md](dal-firebase-design-lock-2026-07-13.md) · **Platform:** [../topics/session-fork-platform.md](../topics/session-fork-platform.md) · **Safety:** [dal-phase-safety-playbook.md](dal-phase-safety-playbook.md)

**Status:** **Shipped** (2026-07-16, GAS v603). Prep + timeline concurrent on one project. **Hotfix v604:** dual-domain UI must read `timelineStatus` / `prepStatus` (not legacy flat `sessionType`) — flat fields preferred prep and cleared the collab banner when both were open.

---

## Locked product rule

On one project, **prep** (`assets`) and **timelineCollab** (`timeline`) **must be allowed to be open at the same time**.

- Closing prep must **not** clear or commit the timeline fork.
- Closing timeline must **not** clear or commit the prep fork.
- Router resolves each domain independently (`resolveDalSessionStatus_(projectId, domain)`).
- Logistics Hub / ledger stays **out of scope** for this slice (atomic / Sheets per design lock §2 — not a second fork domain here).

**Today (pre–Slice D):** one `Dal_Session_Type` / `Dal_Session_Status` / UID set → opening timeline while prep is open fails with *Preparation is still active…* Floor workaround: END PREP, then START COLLAB.

---

## Why Slice D sits here (not earlier / not later)

| Placement | Verdict |
|-----------|---------|
| **Phase 3** (delta-only) | **Do not reopen.** Already shipped. Dual-session is registry/lifecycle, not write-shape. Must not regress scoped PA/timeline/ledger writes. |
| **Phase 4 Slice D** (this) | **Canonical home.** Owns session registry, open/close, router status, UI banners. Firestore paths already separate (`…/assets/` vs `…/timeline/`). |
| **Before Phase 5** | **Required.** Reconciliation / `failed_writes` / retries must key by **project + domain + sessionUid**. A singleton close must never “reconcile” or wipe the other domain. |
| **Before Phase 6** | **Required.** Cache tags must be domain-scoped (`project:{id}:pa` vs `project:{id}:timeline`). Closing one domain must not flush the other. |
| **After Phase 5/6** | **Harmful.** Would force retrofit of reconciliation keys and cache tags; higher risk of cross-domain wipe/commit bugs in production. |

**Prerequisite before coding Slice D:** Phase 4 prep + timeline Phase A open/close smoke are good enough that we are not mid-hotfix on START/END paths.

---

## Harm analysis (prior / next phases)

### Already shipped (must not break)

| Phase | Risk if Slice D done wrong | Guardrail |
|-------|----------------------------|-----------|
| **Phase 3** delta writes | Accidental return to full-tab rewrite during commit | Commit still uses scoped helpers only; dual session does not change sheet write shape |
| **Phase 4 Slice B** prep | Timeline open → PA routes to Sheets while prep believed open; END PREP clears timeline | Independent prep record; close(prep) touches only prep columns + `…/assets/` |
| **Phase 4 Slice C** timeline | Prep open blocks collab (today); END COLLAB kills prep banner/listener | Independent timeline record; close(timeline) touches only timeline columns + `…/timeline/` |
| Presence / door | Unrelated; already removed single-editor timeline lock | Do not reintroduce mutual exclusion via presence |

### Later phases (must plan for now)

| Phase | Requirement Slice D / follow-ons must satisfy |
|-------|-----------------------------------------------|
| **Phase 5** reconciliation | Every commit, failed-write doc, retry, and manager alert carries `projectId` + **`domain`** + `sessionUid`. Reconcile/clear **only** the closing domain. Never a project-global “session cleared.” |
| **Phase 5** failed_writes path | Prefer `failed_writes/{projectId}/{domain}/{timestamp}/{deltaId}` (or equivalent fields) — not project-only. |
| **Phase 6** cache | Separate tags; selective flush on domain close only. No `flushCache()` that nukes both live forks. |
| **Logistics Hub** (later) | Remains **no fork** (design lock). Do not fold hub into the dual registry as a third “session type” in this slice. |

### Known adjacent debt (do not ignore in Slice D smoke)

- Timeline collab still writes some **sub-events** to Sheets during Firebase session (`saveTimelineDataFirestore_` path) — conflicts with “Sheets untouched while session active.” Track under timeline Phase B / Slice D postflight; do not expand that leak when dual-session ships.
- Prep topic historically mentioned ledger on the prep fork; **design lock wins**: ledger/hub = atomic, not forked via this registry.

---

## Schema choice (locked for Slice D)

**Recommended:** second column family on `Projects_Index` (lazy-add like today’s `Dal_Session_*`).

Example shape (names may be adjusted in impl, intent fixed):

| Family | Purpose |
|--------|---------|
| `Dal_Prep_Session_Status` / `_UID` / `_Opened_At` / `_Opened_By` | Prep lifecycle |
| `Dal_Timeline_Session_Status` / `_UID` / `_Opened_At` / `_Opened_By` | Timeline collab lifecycle |

**Migrate:** when Slice D runs, copy singleton `Dal_Session_*` into the matching family by `Dal_Session_Type`, then stop writing the singleton (keep columns read-only for one milestone for rollback, then deprecate).

**Rejected for Slice D:**

- JSON blob in one cell — read-modify-write collisions between domains.
- Separate `DAL_Sessions` sheet — defer until session history / many domains need query; higher migration cost.

---

## Implementation checklist (code — do not start until OK go)

### Server

- [ ] Dual records on `Projects_Index`; `dalEnsureSessionIndexColumns_` extended
- [ ] `resolveDalSessionStatus_(projectId, domain)` reads the **domain** family only
- [ ] `beginDalSession` / `finishDalSession` / `closeDalSession` take or infer domain; **no cross-domain block**
- [ ] Stale reclaim (`opening` / `committing`) is per-domain
- [ ] `getDalSessionInfo` returns **both** domains (or `getDalSessionInfo(projectId, domain)` + compat wrapper)
- [ ] Close abort of stuck `opening` is per-domain and does not clear the other

### Client

- [ ] `02e6_Dal_Session.html` — prep UI reads prep record only
- [ ] `03a1_Timeline_Dal_Session.html` — timeline UI reads timeline record only; remove prep-blocking copy as hard failure
- [ ] `02e7_Dal_Firestore_Client.html` — prep watcher/listeners do not assume global singleton session

### Adapter / router

- [ ] `Dal_Router.js` / `Dal_Firebase.js` — confirm domain routing; close cleanup scoped to domain collection
- [ ] Smoke: both forks open → PA save → Firestore assets; timeline save → Firestore timeline; Sheets blocked only for that domain

### Docs after ship

- [ ] Tick boxes in [data-access-layer.md](data-access-layer.md) Slice D
- [ ] Update topic “known gap” notes below to **resolved**
- [ ] `FILE_MAP.md` if public APIs change

### Director smoke (minimum)

1. START PREP on project P; leave PA open.
2. Same project: START COLLAB in timeline (must succeed).
3. Save equipment (prep path) and save shifts (collab path) — both succeed to their forks.
4. END COLLAB — prep banner/session still open; PA still on Firebase.
5. END PREP — timeline remains normal (no collab) / or if collab still open, timeline unchanged.

---

## Phase 5 / 6 checklist hooks (copy lives in campaign file too)

**Phase 5 — must include before claiming reconciliation done:**

- [ ] Key reconciliation + `failed_writes` + retries + alerts by `projectId` + `domain` + `sessionUid`
- [ ] Closing domain A never reconciles or deletes domain B’s fork

**Phase 6 — must include before claiming cache done:**

- [ ] Tags `project:{id}:pa` and `project:{id}:timeline` (or equivalent)
- [ ] Domain close invalidates **only** that domain’s tags / listeners

---

## Doc map

| Doc | Role for Slice D |
|-----|------------------|
| This file | Spec, harm analysis, schema lock, smoke |
| [data-access-layer.md](data-access-layer.md) | Campaign checklist home |
| [dal-firebase-design-lock-2026-07-13.md](dal-firebase-design-lock-2026-07-13.md) | Canonical “per domain” rule + execution order note |
| [../topics/session-fork-platform.md](../topics/session-fork-platform.md) | Shared registry checklist |
| [../topics/warehouse-prep-session.md](../topics/warehouse-prep-session.md) · [../topics/timeline-collab-session.md](../topics/timeline-collab-session.md) | Topic pointers + known gap until Slice D ships |
| [dal-phase-safety-playbook.md](dal-phase-safety-playbook.md) | Phase 4 guardrails for dual-domain |

**Research note (2026-07-15):** Impact sweep vs design lock + `Dal_Sessions.js` / router / topics — see agent [dual-session impact research](806b15de-e99b-4afc-9840-b61e492cce73).
