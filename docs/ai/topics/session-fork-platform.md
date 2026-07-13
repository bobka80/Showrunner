# Session fork platform (Firebase buffer)

**Entry:** [AI_DOCTRINE.md](../../../AI_DOCTRINE.md) · **Index:** [Project_TODO.md](../Project_TODO.md)

**Status:** Backlog — shared architecture for branched session types below. **Do not implement fork until [active/data-access-layer.md](../active/data-access-layer.md) Phase 4** (router + **Phase 3 delta saves** complete).

**Design lock (2026-07-13):** [../active/dal-firebase-design-lock-2026-07-13.md](../active/dal-firebase-design-lock-2026-07-13.md) — reconciliation engine, failed-writes pocket, Logistics Hub atomic ops (no fork), PA/Timeline fork lifecycle.

**Prerequisite campaign:** [../active/data-access-layer.md](../active/data-access-layer.md)

**Branches:**

| Session | File |
|---------|------|
| Warehouse preparation (PA, ledger, trucks, logistics hub) | [warehouse-prep-session.md](warehouse-prep-session.md) |
| Timeline collaboration room | [timeline-collab-session.md](timeline-collab-session.md) |

**Last swept:** 2026-07-13

---

## Core model (one pattern)

```text
NORMAL (every day)
  App ──► GAS ──► Google Sheets

SESSION OPEN (fork right — no direct Sheets for that slice)
  App ◄──► Firebase buffer ◄──► live sync for everyone in the room
  GAS only: snapshot IN at open, commit OUT at close

SESSION CLOSED (fork left)
  App ──► GAS ──► Sheets (official version)
```

**Rule:** At coding level, **one router** per data slice — no scattered `if (prep)` that still calls Sheets APIs. Cache policies ride the same router — see [data-cache-engine.md](data-cache-engine.md).

---

## Shared implementation checklist

### Router & session record

- [ ] `projectDataRouter` / per-slice routers (PA, timeline) — `normal` vs `session` backend
- [ ] Session metadata: `projectId`, `sessionType`, `openedAt`, `openedBy`, `status` (open | committing | closed)
- [ ] Store session flag on `Projects_Index` (authoritative for “is fork active?”) + Firebase mirror for live UI
- [ ] Hard block: while session open, **no direct** `saveProjectAssetsDelta` / `saveTimelineData` to Sheets from client

### Firebase (Firestore)

- [ ] Project-scoped paths — **reconcile** `sessions/{projectId}/{sessionType}/` (this doc) vs `projects/{projectId}/assets|timeline/` ([design lock](../active/dal-firebase-design-lock-2026-07-13.md)) in DAL Phase 2
- [ ] **Lean read model** — avoid “subscribe to 500 rows” per client (session summary doc + targeted subcollections)
- [ ] Write on **meaning** only (scan, drag end, add row) — debounce pack/qty 300–500 ms
- [ ] Unsubscribe listeners when user leaves room / closes modal

### Lifecycle

- [ ] **Open:** GAS validates → snapshot Sheets → bulk write Firebase → set session flag → FCM “session opened”
- [ ] **During:** clients read/write Firebase only for session slice
- [ ] **Close:** GAS validates buffer → bulk commit Sheets → **reconciliation engine** (cell-by-cell) → clear session → delete or archive Firebase session → FCM “session closed”
- [ ] **Failed commit:** queue in `failed_writes/{projectId}/{timestamp}/{deltaId}` — retry backoff, manager alert — see [design lock §2](../active/dal-firebase-design-lock-2026-07-13.md#2-session-lifecycle-by-domain)

### Logistics Hub (not a fork)

- [ ] **Atomic per-operation** path — no session fork, immediate Sheets verify after each op — [design lock §2](../active/dal-firebase-design-lock-2026-07-13.md#2-session-lifecycle-by-domain)

### Presence & activity

- [ ] Roster: who is in the room (`module`: prep | timeline)
- [ ] Activity log: who did what (append-only events in session)

### Firebase free tier

- [ ] Target: typical day &lt; 50k reads, &lt; 20k writes (one company)
- [ ] Monitor Firebase console after first real prep day
- [ ] Blaze pay-as-you-go + **spending cap** as safety net if quotas exceeded
- [ ] See budget notes in branched docs

### Notifications

- [ ] Reuse FCM data messages: `session_opened`, `session_closing`, `session_committed`
- [ ] Users must use web.app PWA — [notifications.md](notifications.md)

---

## Fragile zones

- [FRAGILE_ZONES.md](../FRAGILE_ZONES.md) — boot, session token
- [EQUIPMENT_MODEL.md](../EQUIPMENT_MODEL.md) — auto-pack vs auto-containerization (prep session must not merge)

---

## Stable reference (when built)

Add `docs/ai/SESSION_FORK.md` (stable “how it works”) — **not** until first session type ships.
