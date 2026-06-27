# Recovery plan — after rollback to v329

**Status:** Awaiting director approval before re-shipping any of this work.  
**Rollback target:** GAS **v329** — *Mobile home — brand header, sidebar nav icons; remove timeline shift popup*  
**Rolled back from:** v330–v333 (notifications phase 1–2, checklist status bar, mini-calendar CSS/boot changes, recursion “hotfix”)

**Test surface:** Production web app only (`https://sm-showrunner-97405.web.app`) — not developer mode.

---

## Why we rolled back

After **v330**, the director reported:

1. **No shift-change notifications** (foreground or background)
2. **Mini calendar** in desktop project editor → empty black rectangle
3. **Project checklist % bar** missing or inconsistent
4. **Weather widget** missing on desktop when opening a project
5. Console: **`Maximum call stack size exceeded`** — mutual recursion between `updateLocationRegionLabel` (`02_Project_Editor_Map.html`) and `toggleDistanceInput` (`02_Project_Editor_Core.html`)

**v331–v332** attempted fixes (notifications + mini-cal layout). **v333** tried to break the recursion loop; director reported **worse** than v332.

**v329** is the last known-good milestone **before** that batch of changes.

---

## What v329 does *not* include (parked work)

Re-introduce these **one at a time**, each with a milestone + web.app verification:

| Item | Introduced in | Notes |
|------|---------------|--------|
| Event-driven push (assign/remove/shift/truck/cancel) | v330 backend | Test with **another crew member’s** shift; self-edits often excluded for non-ROOT |
| Foreground toast + drawer sync | v330 hosting / `01b` | Requires hosting deploy if shell changes |
| Project checklist % bar | v330 UI | Depends on `globalManagerConfig.rules` refresh on `refreshData()` |
| Mini-calendar layout / boot rewrite | v330–v332 | Likely conflict: `pe-checklist-status-bar`, `pe-mini-cal-wrap`, modal `overflow`, FC `height: 100%` |
| Recursion fix (`applyProjectDistanceFieldVisibility`) | v333 | **Do not** ship alone — verify weather + mini-cal + region label together |

---

## Required fix before re-adding v330 UI (root cause)

### Infinite loop (fragile zone)

```
updateLocationRegionLabel()  →  toggleDistanceInput()
toggleDistanceInput()        →  updateLocationRegionLabel()
```

**Safe pattern (when we resume):**

1. Extract **distance field visibility only** into `applyProjectDistanceFieldVisibility()` (no label logic).
2. `updateLocationRegionLabel` — updates label, zone hidden, in-Sofia checkbox, then calls visibility helper **once**.
3. `toggleDistanceInput` — **only** visibility helper; **never** calls `updateLocationRegionLabel`.
4. Call sites that need both (e.g. `01a_Calendar_Core.html` on event open) call **both functions explicitly** in order — already partially done.

**Verify after fix:** Open project on web.app → console clean → weather loads → `bootMiniCalendar` renders phases.

---

## Suggested re-ship order (small milestones)

### Step A — Editor stability (no new features)

- [ ] Break recursion (pattern above) — **minimal diff**, 2 files
- [ ] Confirm desktop: weather, mini calendar, location region label, distance field
- [ ] Milestone + director hard-refresh on web.app

### Step B — Checklist status bar only

- [ ] Re-add `pe-checklist-status-bar` + `updateProjectChecklistBar` refresh fix
- [ ] Confirm mini calendar still has measurable height (explicit px or `ResizeObserver` — do **not** rely on `height: 100%` alone in flex modal)
- [ ] Repair any broken CSS selectors (e.g. `fc-event-resizer` block from v330)
- [ ] Milestone + verify

### Step C — Notifications backend (already in v330–333 code — re-merge carefully)

- [ ] Re-apply `Notifications_Dispatch.js` hooks only if not already in rolled-back tree
- [ ] UID normalization for in-app notification rows
- [ ] Test matrix: assign, remove, shift change (other user), truck, cancel, new event → managers

### Step D — Foreground UX

- [ ] `host-boot.js` `SHOWRUNNER_FOREGROUND_PUSH` bridge
- [ ] Toast + drawer in `01b_Calendar_Tasks.html`
- [ ] Hosting deploy if shell changes

### Step E — Deferred (not part of this recovery)

- Personal Hub on mobile (theme only)
- PIN change, desktop lock screen
- Manager agenda reminders

---

## Files to touch when resuming (reference)

| Area | Files |
|------|--------|
| Recursion / weather / region | `02_Project_Editor_Map.html`, `02_Project_Editor_Core.html` |
| Event open flow | `01a_Calendar_Core.html` |
| Mini calendar | `01c_Calendar_Mini.html`, `Styles.html`, `02_Project_Editor_Core.html` |
| Checklist bar | `02_Project_Editor_Core.html`, `07_Core_Globals.html`, `01e_Mobile_Crew_Hub.html` |
| Notifications | `Notifications_Dispatch.js`, `Logistics_Timeline.js`, `Logistics_Tasks.js`, `01b_Calendar_Tasks.html`, `10a_Notifications_Boot.html`, `push-hosting/public/host-boot.js` |

See also: [FRAGILE_ZONES.md](FRAGILE_ZONES.md), [NOTIFICATIONS_PROJECT_STATUS.md](NOTIFICATIONS_PROJECT_STATUS.md).

---

## Approval gate

**Do not proceed past Step A until the director confirms:**

1. v329 is live on web.app and desktop editor works (mini cal + weather).
2. Step order above is acceptable, or director reprioritizes (e.g. notifications before checklist bar).
