# Live forks — architecture & pause switch

**Entry:** [AI_DOCTRINE.md](../../../AI_DOCTRINE.md) · **Platform home:** [session-fork-platform.md](session-fork-platform.md)  
**Pause was held by:** [../archive/logistics-ledger-2026-07-21.md](../archive/logistics-ledger-2026-07-21.md) (complete 2026-07-24)

**Last updated:** 2026-07-24 · **Production:** live forks **ON** (`DAL_LIVE_FORKS_PAUSED = false`).

---

## What agents must know first

Showrunner has **two live Firebase forks** (independent on one project):

| Fork | Session type | Domain | Opens when |
|------|--------------|--------|------------|
| **Prep** | `prep` | Project Assets | START PREP / auto-start on PA |
| **Timeline collab** | `timelineCollab` | Timeline | START COLLAB / auto-start on timeline |

**Between sessions (NORMAL):** app → GAS → **Google Sheets** (official SoT).  
**While a fork is open:** that domain’s live edits go to **Firebase**; Sheets for that domain are blocked until End Prep / End Collab commits Firebase → Sheets.

**RFID `Operations_Ledger` and Logistics Hub atomic ops never fork** — always Sheets ([design lock](../archive/dal-firebase-design-lock-2026-07-13.md) §2).

```text
NORMAL (every day / forks paused)
  App ──► GAS ──► Google Sheets

SESSION OPEN (fork right)
  App ◄──► Firebase buffer (live peers)
  GAS: snapshot IN at open · commit OUT at close

SESSION CLOSED
  App ──► GAS ──► Sheets again
```

---

## CURRENT PRODUCTION MODE (2026-07-24) — forks LIVE

Prep and timeline live forks are **on** again after Logistics Ledger Exit.

| Flag | Where | Value while live |
|------|--------|------------------|
| `DAL_LIVE_FORKS_PAUSED` | `Dal_Sessions.js` | `false` |
| `window.DAL_LIVE_FORKS_PAUSED` | `07_Core_Globals.html` | `false` — **keep in sync with server** |
| Script Property `DAL_LIVE_FORKS_ABANDONED_V1` | Apps Script props | cleared when pause is false (so a future pause can abandon again) |

### Behavior while live

1. START PREP / START COLLAB and auto-start work again.
2. Open sessions route that domain to Firebase; closed = Sheets.
3. Truck arrange with prep open → Firebase PA path + ledger on Sheets; closed → Sheets PA + ledger.

### How to pause again (temporary Sheets-only)

1. Set **`DAL_LIVE_FORKS_PAUSED = true`** in `Dal_Sessions.js`.  
2. Set **`window.DAL_LIVE_FORKS_PAUSED = true`** in `07_Core_Globals.html`.  
3. `node milestone.js "Pause live forks (Sheets-only)"`.  
4. One-shot Index abandon runs via `dalEnsurePausedForksAbandoned_` (no Firebase→Sheets commit).

---

## Code map (do not scatter new `if (prep)` )

| Concern | File / symbol |
|---------|----------------|
| Pause constant + abandon | `Dal_Sessions.js` · `DAL_LIVE_FORKS_PAUSED`, `abandonAllOpenDalLiveForksAPI`, `dalEnsurePausedForksAbandoned_` |
| Session status / info | `resolveDalSessionStatus_`, `getDalSessionInfo`, `getOpenDalForkMap` |
| Open gate | `dalAssertCanOpenSessionType_`, `beginDalSession` / `finishDalSession` |
| Router | `Dal_Router.js` · `projectDataRouter` |
| Adapter | `Dal_Firebase.js` · `createFirebaseAdapter_` (only when status open) |
| Client start / auto | `07_Core_Globals.html` · `dalMayManualStartFork_`, `dalMayAutoStartFork_`, `maybeAutoOpenDalPrep_` / `maybeAutoOpenDalTimeline_` |
| Prep UI | `02e6_Dal_Session.html` · `openDalPrepSession` |
| Timeline UI | `03a1_Timeline_Dal_Session.html` · `openDalTimelineCollabSession` |

---

## Related docs

| Doc | Role |
|-----|------|
| [session-fork-platform.md](session-fork-platform.md) | Shared fork pattern + checklist |
| [warehouse-prep-session.md](warehouse-prep-session.md) | Prep product intent |
| [timeline-collab-session.md](timeline-collab-session.md) | Timeline room intent |
| [project-assets-concurrency.md](project-assets-concurrency.md) | Normal-day Sheets PA concurrency |
| [../FRAGILE_ZONES.md](../FRAGILE_ZONES.md) | Prep session UI + live sync traps |
| [../archive/dal-firebase-design-lock-2026-07-13.md](../archive/dal-firebase-design-lock-2026-07-13.md) | Design lock (Sheets between sessions) |
| [../archive/multi-user-fork-industrial-and-auto.md](../archive/multi-user-fork-industrial-and-auto.md) | Part B auto-fork (archived) |
| [../archive/logistics-ledger-2026-07-21.md](../archive/logistics-ledger-2026-07-21.md) | Ledger campaign that held the pause |
