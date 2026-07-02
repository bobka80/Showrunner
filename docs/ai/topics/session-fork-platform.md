# Session fork platform (Firebase buffer)

**Entry:** [AI_DOCTRINE.md](../../../AI_DOCTRINE.md) · **Index:** [Project_TODO.md](../Project_TODO.md)

**Status:** Backlog — shared architecture for branched session types below.

**Related:** [session-fork-platform.md](session-fork-platform.md) · [data-cache-engine.md](data-cache-engine.md)

**Branches:**

| Session | File |
|---------|------|
| Warehouse preparation (PA, ledger, trucks, logistics hub) | [warehouse-prep-session.md](warehouse-prep-session.md) |
| Timeline collaboration room | [timeline-collab-session.md](timeline-collab-session.md) |

**Last swept:** 2026-06-30

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

- [ ] Project-scoped session path e.g. `sessions/{projectId}/{sessionType}/`
- [ ] **Lean read model** — avoid “subscribe to 500 rows” per client (session summary doc + targeted subcollections)
- [ ] Write on **meaning** only (scan, drag end, add row) — debounce pack/qty 300–500 ms
- [ ] Unsubscribe listeners when user leaves room / closes modal

### Lifecycle

- [ ] **Open:** GAS validates → snapshot Sheets → bulk write Firebase → set session flag → FCM “session opened”
- [ ] **During:** clients read/write Firebase only for session slice
- [ ] **Close:** GAS validates buffer → bulk commit Sheets → clear session → delete or archive Firebase session → FCM “session closed”

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
