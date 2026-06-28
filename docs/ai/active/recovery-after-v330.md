# Recovery — after rollback to v329

**Entry:** [AI_DOCTRINE.md](../../AI_DOCTRINE.md) · **Drawer:** `docs/ai/active/`

**Status:** Step D **shipped** (GAS **v344** + hosting). Next: Step B (checklist bar), then Personal Hub polish.  
**Rollback baseline:** GAS **v329** — *Mobile home — brand header, sidebar nav icons; remove timeline shift popup*  
**Rolled back from:** v330–v333 (notifications phase 1–2, checklist status bar, mini-calendar CSS/boot changes, bad recursion “hotfix”)

**Test surface:** Production web app only (`https://sm-showrunner-97405.web.app`) — not developer mode.

---

## Why we rolled back

After **v330**, the director reported:

1. **No shift-change notifications** (foreground or background)
2. **Mini calendar** in desktop project editor → empty black rectangle
3. **Project checklist % bar** missing or inconsistent
4. **Weather widget** missing on desktop when opening a project
5. Console: **`Maximum call stack size exceeded`** — mutual recursion between `updateLocationRegionLabel` and `toggleDistanceInput`

**v331–v332** attempted fixes. **v333** tried to break the recursion loop; director reported **worse** than v332.

---

## Parked work (re-ship one milestone at a time)

| Item | Introduced in | Notes |
|------|---------------|--------|
| Event-driven push (assign/remove/shift/truck/cancel) | v330 backend | Test with **another crew member’s** shift; see [topics/notifications.md](../topics/notifications.md) |
| Foreground toast + drawer sync | v330 hosting / `01b` | Requires hosting deploy if shell changes |
| Project checklist % bar | v330 UI | Depends on `globalManagerConfig.rules` refresh on `refreshData()` |
| Mini-calendar layout / boot rewrite | v330–v332 | Likely conflict: `pe-checklist-status-bar`, `pe-mini-cal-wrap`, modal `overflow`, FC `height: 100%` |
| Recursion fix | v333 (bad) | **Fixed correctly in v335** via `applyProjectDistanceFieldVisibility()` |

---

## Safe recursion pattern (reference — implemented v335)

1. `applyProjectDistanceFieldVisibility()` — distance field visibility only.
2. `updateLocationRegionLabel` — label + zone + checkbox, then calls visibility helper once.
3. `toggleDistanceInput` — visibility helper only; never calls `updateLocationRegionLabel`.

**Verify:** Open project on web.app → console clean → weather loads → `bootMiniCalendar` renders phases.

---

## Re-ship order

### Step A — Editor stability ✅ (GAS v335)

- [x] Break recursion — `02_Project_Editor_Map.html`, `02_Project_Editor_Core.html`
- [ ] Director confirms on web.app: weather, mini calendar, region label, distance field
- [x] Milestone shipped

### Step B — Checklist status bar only

- [ ] Re-add `pe-checklist-status-bar` + `updateProjectChecklistBar` refresh fix
- [ ] Confirm mini calendar still has measurable height (explicit px or `ResizeObserver` — do **not** rely on `height: 100%` alone in flex modal)
- [ ] Repair any broken CSS selectors (e.g. `fc-event-resizer` block from v330)
- [ ] Milestone + verify

### Step C — Notifications backend ✅ (GAS v342)

- [x] UID normalization on notif writes + widened read filter
- [x] Removed-from-schedule in-app + FCM
- [x] Task deleted FCM; weather FCM + shift `user_uid` fix
- [ ] Director test matrix on web.app

### Step D — Foreground UX ✅ (GAS v344 + hosting)

- [x] `SHOWRUNNER_FOREGROUND_PUSH` bridge (host → iframe)
- [x] In-app toast + `refreshData()` for notification list + tasks
- [x] Fix client `isNotifRead` (bell was broken by server-only helper)
- [ ] Director test: push while app open → toast + badge update without long wait

### Step E — Deferred (partial)

- [x] Personal Hub — unified panel for all users (theme, logout, change PIN); manager tools inside same hub (GAS **v336**)
- [ ] Personal Hub on mobile (theme only)
- [ ] Desktop lock screen
- [ ] Manager agenda reminders

---

## Files to touch when resuming

| Area | Files |
|------|--------|
| Recursion / weather / region | `02_Project_Editor_Map.html`, `02_Project_Editor_Core.html` |
| Event open flow | `01a_Calendar_Core.html` |
| Mini calendar | `01c_Calendar_Mini.html`, `Styles.html`, `02_Project_Editor_Core.html` |
| Checklist bar | `02_Project_Editor_Core.html`, `07_Core_Globals.html`, `01e_Mobile_Crew_Hub.html` |
| Notifications | `Notifications_Dispatch.js`, `Logistics_Timeline.js`, `Logistics_Tasks.js`, `01b_Calendar_Tasks.html`, `10a_Notifications_Boot.html`, `push-hosting/public/host-boot.js` |

See also: [FRAGILE_ZONES.md](../FRAGILE_ZONES.md).

---

## Approval gate

**Do not start Step B until the director confirms Step A on web.app** (mini cal + weather + clean console).

When Step B–E complete, move this file to **`docs/ai/archive/`**.
