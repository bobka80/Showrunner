# Live forks — architecture & pause switch

**Entry:** [AI_DOCTRINE.md](../../../AI_DOCTRINE.md) · **Platform home:** [session-fork-platform.md](session-fork-platform.md)  
**Active campaign holding the pause:** [../active/logistics-ledger-2026-07-21.md](../active/logistics-ledger-2026-07-21.md)

**Last updated:** 2026-07-21 · **Production tip:** GAS **v729+** while pause is on.

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

## CURRENT PRODUCTION MODE (2026-07-21) — forks PAUSED

**Both** prep and timeline live forks are **temporarily off** so Logistics Ledger work can stay on a single SoT (Sheets) without Sheets↔Firebase thrash.

| Flag | Where | Value while paused |
|------|--------|--------------------|
| `DAL_LIVE_FORKS_PAUSED` | `Dal_Sessions.js` | `true` |
| `window.DAL_LIVE_FORKS_PAUSED` | `07_Core_Globals.html` | `true` — **keep in sync with server** |
| Script Property `DAL_LIVE_FORKS_ABANDONED_V1` | Apps Script props | `'1'` after one-shot Index cleanup |

### Behavior while paused

1. **No new opens** — `dalAssertCanOpenSessionType_` throws; START PREP / START COLLAB blocked; auto-start off.
2. **Router = Sheets** — `resolveDalSessionStatus_` always returns `NORMAL` for PA + timeline.
3. **Clients do not soft-join** — `getDalSessionInfo` / `getOpenDalForkMap` report closed; `dalMayJoinLiveFork_` false.
4. **Leftover Index flags** — cleared once by `abandonAllOpenDalLiveForksAPI` / `dalEnsurePausedForksAbandoned_` (**no** Firebase→Sheets commit; Sheets stay SoT).
5. **Truck arrange + ledger dual-write** use the **Sheets** path (`saveTruckArrangementAPI`).

### What is not paused

- Normal PA / timeline / truck edits on Sheets  
- Logistics Ledger dual-write from truck arrange  
- RFID / Operations_Ledger  
- Hosting shell / station (except they also cannot open prep)

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

## How to restore forks (after ledger campaign)

1. Set **`DAL_LIVE_FORKS_PAUSED = false`** in `Dal_Sessions.js`.  
2. Set **`window.DAL_LIVE_FORKS_PAUSED = false`** in `07_Core_Globals.html`.  
3. Delete Script Property **`DAL_LIVE_FORKS_ABANDONED_V1`** (so a future pause can abandon again).  
4. `node milestone.js "Re-enable live forks (PA prep + timeline collab)"`.  
5. Smoke: START/END PREP (two browsers) · START/END COLLAB · truck arrange with prep open (Firebase path) and closed (Sheets path).  
6. Update [active/logistics-ledger-2026-07-21.md](../active/logistics-ledger-2026-07-21.md) Exit checklist + this file’s “CURRENT PRODUCTION MODE” section.

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
