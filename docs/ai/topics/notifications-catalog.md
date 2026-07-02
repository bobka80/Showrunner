# Notification catalog — have / need

**Entry:** [AI_DOCTRINE.md](../../../AI_DOCTRINE.md) · **Index:** [Project_TODO.md](../Project_TODO.md)

**Canonical checklist** of notification **scenarios** only (what exists vs what to build).

Architecture, deploy, key files: **[notifications.md](notifications.md)** · Production log: root **`RELEASES.md`**

**Users must open:** https://sm-showrunner-97405.web.app (not raw `script.google.com`) for reliable mobile push.

**Legend:** `[x]` shipped in code · `[ ]` not built · `[?]` needs director test on web.app

**Last swept:** 2026-06-28 · **Code baseline:** GAS **v359**

---

## Delivery channels (reference)

Each scenario below should eventually specify which channels apply. Today most crew alerts use:

- **In-app** — `Notifications` sheet + bell / mobile notif list
- **FCM push** — phone alert (background + foreground toast when app open)
- **PWA** — crew should launch from home screen icon for best iPhone push behavior

---

## 1. Non-managers (crew)

### Events / timeline

- [x] **Added to schedule** (`Logistics_Timeline.js` — timeline save)
  - Recipient: newly assigned crew (not truck pseudo-shifts)
  - In-app: yes · FCM: yes · Link: project
- [x] **Shift time changed**
  - Recipient: crew on modified shift rows
  - In-app: yes · FCM: yes · Link: project
- [x] **Removed from schedule**
  - Recipient: crew dropped from timeline
  - In-app: yes · FCM: yes · Link: project
- [ ] **Shift conflict reported** — crew flags overlap / availability clash → manager
- [ ] **Event cancelled** — explicit cancel copy (today may only surface via remove-from-schedule)
- [ ] **Debounce** — many rapid timeline edits → single coalesced message per crew member
- [ ] **Confirm your shift** — crew must ack availability (see [timeline-shift-field-crew.md](timeline-shift-field-crew.md))
- [ ] **Crew declined shift** — manager alert

### Tasks

- [x] **New task assigned** (`Logistics_Tasks.js` — create task with assignees)
  - Recipient: new assignees
  - In-app: yes · FCM: yes · Link: task
- [x] **Task deleted**
  - Recipient: former assignees
  - In-app: yes · FCM: yes
- [ ] **Task reassigned** — assignee removed or swapped (distinct from delete + new)
- [ ] **Task due / overdue** — reminder before deadline
- [ ] **Todo item completed** — notify task owner or manager (optional)

### Weather

- [x] **Outdoor weather alert** (`dispatchWeatherAlerts` in `Logistics_Tasks.js`)
  - Recipient: crew assigned to project shifts
  - In-app: yes · FCM: yes · Same-day dedupe per message text
  - Trigger: weather engine warnings for outdoor project

### App experience (how crew receive alerts)

- [x] Notification bell + dropdown / mobile notif entry
- [x] Mark read / clear all (`markNotificationsRead`, `clearAllNotifications`)
- [x] Click notification → open linked **project** or **task** (v347)
- [x] Foreground **SHOWRUNNER** toast + refresh bell/tasks when push arrives with app open (Step D — hosting bridge)
- [x] Fast tasks/notifs refresh without full calendar reload (v346)
- [?] **End-to-end push on beta devices** — Android + iPhone PWA; director test matrix open
- [ ] **iPhone Safari / PWA registration** — reliable token save from home screen icon
- [ ] **Push service error** edge cases (e.g. Xiaomi Chrome autostart — see DATABASE yellow state)

---

## 2. Managers

### Events / timeline

- [ ] **New project / event created** — notify assigned PM or manager roster
- [ ] **Event cancelled** — notify PM + affected crew
- [ ] **Crew added/removed by another manager** — optional PM awareness (crew already notified)
- [ ] **Bulk timeline save** — debounced digest instead of one push per micro-edit
- [ ] **Shift conflict report** — crew report → PM / logistics manager

### Events / production line

Project editor readiness, status, and production workflow — mostly **not wired** to notifications today.

- [ ] **Readiness milestone** — crew / equipment / truck badges reach “finished” → PM
- [ ] **Equipment shortage** — global availability conflict affects project
- [ ] **Project status change** — e.g. Approved → On tour → Returned (manager audience TBD)
- [ ] **Offer / quote milestone** — financials tab events (see [financials.md](financials.md))
- [ ] **Checklist automation task completed** — manager rule fired → PM (distinct from crew task assign)
- [ ] **Manager overdue jobs** — cron: staffing gaps, invoice follow-up, offer stale (product TBD)

### Weather

- [ ] **Manager weather summary** — rollup for outdoor events (crew get per-person alerts today)
- [ ] **Severe weather → cancel/hold recommendation** — manager-only decision prompt (future)

### Logistics / warehouse

- [ ] **Truck arrangement saved** — notify logistics / PM ([logistics-warehouse.md](logistics-warehouse.md))
- [ ] **Missing transit legs** — on save + in-app + FCM when transport quoting is live
- [ ] **Checkout / check-in session anomaly** — RFID ops (when kiosk brain ships)
- [ ] **Fleet payload / load plan change** — when truck brain ships

### Tasks

- [ ] **Debounce task-assign push** when manager bulk-edits many assignees at once ([tasks.md](tasks.md))
- [ ] **All-tasks view alerts** — manager sees org-wide tasks; no extra push types yet beyond assign/delete

### Personal Hub / automation

- [ ] **Agenda reminders** — per-manager rules evaluated across **all projects** ([ux-platform.md](ux-platform.md), recovery Step E)
- [ ] **Drive / automation rule failure** — template sync or task rule error → manager

### Product (manager preferences)

- [ ] **Per-user notification toggles** — opt out by type (shift, task, weather, etc.)
- [ ] **Quiet hours** — suppress non-urgent push overnight (future)

---

## Cross-cutting (both audiences)

- [x] ROOT **test push** + per-device test (`10c`, `Notifications_Push.js`)
- [x] Multi-device FCM tokens per user (`Notifications_Store.js`)
- [x] UID normalization on notification rows + widened read filter (Step C)
- [ ] **Director test matrix** — assign, remove, shift (other user), task, weather, foreground toast, cancel event (recovery Step C/D sign-off)

---

## Hygiene

When a scenario ships: mark `[x]` here, one line in root **`RELEASES.md`** (via milestone), and adjust the index row in **`Project_TODO.md`**. Do **not** duplicate this checklist in other topic files — link here instead.
