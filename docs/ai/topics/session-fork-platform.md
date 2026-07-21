# Session fork platform (Firebase buffer)

**Entry:** [AI_DOCTRINE.md](../../../AI_DOCTRINE.md) · **Index:** [Project_TODO.md](../Project_TODO.md)

**Status:** Shared architecture for branched session types — dual-domain live @ v603+. Design lock: [../archive/dal-firebase-design-lock-2026-07-13.md](../archive/dal-firebase-design-lock-2026-07-13.md).

> **CURRENT PRODUCTION (2026-07-21):** Live forks (prep **and** timeline) are **PAUSED** — Sheets-only. Canonical ops note: **[dal-live-forks-pause.md](dal-live-forks-pause.md)**. Do not open START PREP / START COLLAB until that note says restored.

**Design lock (2026-07-13):** [../archive/dal-firebase-design-lock-2026-07-13.md](../archive/dal-firebase-design-lock-2026-07-13.md) — reconciliation engine, failed-writes pocket, Logistics Hub atomic ops (no fork), PA/Timeline fork lifecycle.

**Prerequisite campaign (archived):** [../archive/data-access-layer.md](../archive/data-access-layer.md)

**Branches:**

| Session | File |
|---------|------|
| Warehouse preparation (PA, ledger, trucks, logistics hub) | [warehouse-prep-session.md](warehouse-prep-session.md) |
| Timeline collaboration room | [timeline-collab-session.md](timeline-collab-session.md) |
| **Live forks pause / restore (ops)** | [dal-live-forks-pause.md](dal-live-forks-pause.md) |

**Last swept:** 2026-07-21

**Firestore paths (canonical):** `projects/{projectId}/assets/` and `projects/{projectId}/timeline/` per [design lock](../archive/dal-firebase-design-lock-2026-07-13.md). The older `sessions/{projectId}/{sessionType}/` sketch is historical only.

**Future architecture decision (not active):** [project-campaign-firebase-hybrid-decision-2026-07-21.md](project-campaign-firebase-hybrid-decision-2026-07-21.md) — 48h Project Campaign Room + periodic Sheets publish; depends on [logistics-ledger-schema-2026-07-20.md](logistics-ledger-schema-2026-07-20.md). **Sequenced pack:** [architecture-multi-campaign-pack-2026-07-21.md](architecture-multi-campaign-pack-2026-07-21.md). **Ledger active:** [../active/logistics-ledger-2026-07-21.md](../active/logistics-ledger-2026-07-21.md).

**Dual-domain (Phase 4 Slice D):** prep + timeline may both be open **concurrent** on one project — [../archive/dal-phase4-slice-d-dual-domain-sessions.md](../archive/dal-phase4-slice-d-dual-domain-sessions.md) (shipped @ v603). **Auto-fork Part B:** [../archive/multi-user-fork-industrial-and-auto.md](../archive/multi-user-fork-industrial-and-auto.md) (closed 2026-07-21).

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

**Pause switch:** when `DAL_LIVE_FORKS_PAUSED` is true, production stays on the **NORMAL** row for both domains — see [dal-live-forks-pause.md](dal-live-forks-pause.md).

---

## Shared implementation checklist

### Router & session record

- [x] `projectDataRouter` / per-slice routers (PA, timeline) — `normal` vs `session` backend (Phase 4)
- [x] Session metadata: `projectId`, `sessionType`, `openedAt`, `openedBy`, `status` (open | committing | closed) — **singleton row today**
- [x] Store session flag on `Projects_Index` (authoritative for “is fork active?”) + Firebase `_meta` for live UI
- [x] Hard block: while session open, **no direct** PA / timeline Sheets path for that domain (from adapter asserts)
- [x] **Slice D:** independent prep + timeline lifecycle on `Projects_Index` — concurrent open — [../archive/dal-phase4-slice-d-dual-domain-sessions.md](../archive/dal-phase4-slice-d-dual-domain-sessions.md) (v603)
- [ ] Hard block remains **per domain** after Slice D (prep open must not block timeline Sheets when timeline is normal, and vice versa)

### Firebase (Firestore)

- [x] Project-scoped paths — canonical `projects/{projectId}/assets|timeline/` ([design lock](../archive/dal-firebase-design-lock-2026-07-13.md))
- [ ] **Lean read model** — avoid “subscribe to 500 rows” per client (session summary doc + targeted subcollections)
- [ ] Write on **meaning** only (scan, drag end, add row) — debounce pack/qty 300–500 ms
- [ ] Unsubscribe listeners when user leaves room / closes modal

### Lifecycle

- [ ] **Open:** GAS validates → snapshot Sheets → bulk write Firebase → set session flag → FCM “session opened”
- [ ] **During:** clients read/write Firebase only for session slice
- [ ] **Close:** GAS validates buffer → bulk commit Sheets → **reconciliation engine** (cell-by-cell) → clear session → delete or archive Firebase session → FCM “session closed”
- [x] **Failed commit:** queue in `failed_writes/{projectId}/{timestamp}/{deltaId}` — retry backoff, manager alert — see [design lock §2](../archive/dal-firebase-design-lock-2026-07-13.md#2-session-lifecycle-by-domain)

### Logistics Hub (not a fork)

- [x] **Atomic per-operation** path — no session fork, immediate Sheets verify after each op — [design lock §2](../archive/dal-firebase-design-lock-2026-07-13.md#2-session-lifecycle-by-domain)

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

## Future — Project Campaign Room (director brainstorm 2026-07-21)

**Status:** Decision brief only — **not implemented.** Canonical write-up: [project-campaign-firebase-hybrid-decision-2026-07-21.md](project-campaign-firebase-hybrid-decision-2026-07-21.md).

### Problem

Current model = **short sessions** per domain (prep + timeline may both be open, but separate lifecycles). Close triggers: End ∪ last-leave ∪ idle → **one commit** → room closed. Near show date, crews **revisit the same project repeatedly**; commit/reopen churn causes UX pain (committing freeze, refresh orphans, calendar dots).

### Proposed direction (Option C — recommended in brief)

| Element | Proposal |
|---------|----------|
| **Room type** | **Project Campaign Room** — one leased workspace per project (not weeks; **48h max**) |
| **Slices** | After Logistics Ledger: **assets** + **logistics** + **timeline** (multi-path, not one Firestore doc) |
| **Sheets** | **Publish checkpoints** ~every 30m if dirty; room stays live |
| **Expiry** | 48h → final publish → rotate room |
| **Outside room** | Vault, RFID `Operations_Ledger`, financials, cross-project tracker |

### Pros (summary)

- Fits show-week revisit pattern; less commit/reopen friction
- Regular durable checkpoints limit worst-case data loss vs “Firebase-only for days”
- Post-ledger: list vs movement vs timeline **separate slices** → fewer edit collisions
- Listeners give live awareness without requiring constant session restart

### Cons (summary)

- **Conflicts with design lock** rule “no periodic Sheets sync during session” — requires doctrine revision
- Sheets may lag live Firebase by up to checkpoint interval
- More lifecycle complexity (lease, publish, rollover, failed publish retry)
- Must **not** build on pre-ledger PA truck-column embedding
- Firebase quota / listener cost over longer room lifetime

### Sequencing (planning lock — updated 2026-07-21)

1. ~~Multi-user Part B exit (B7 floor smoke)~~ ✓ archived  
2. ~~Offer / availability~~ — **off critical path** (locks)  
3. **Logistics Ledger** — [../active/logistics-ledger-2026-07-21.md](../active/logistics-ledger-2026-07-21.md)  
4. Project Campaign Room  

Interim: refresh/orphan/commit UX within short-session model was improved during Part B; Campaign Room replaces leave/idle-as-commit later.

---

## Fragile zones

- [FRAGILE_ZONES.md](../FRAGILE_ZONES.md) — boot, session token
- [EQUIPMENT_MODEL.md](../EQUIPMENT_MODEL.md) — auto-pack vs auto-containerization (prep session must not merge)

---

## Stable reference (when built)

Add `docs/ai/SESSION_FORK.md` (stable “how it works”) — **not** until first session type ships.
