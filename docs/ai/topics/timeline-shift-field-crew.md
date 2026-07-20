# Timeline shifts — crew confirm & field actuals

**Entry:** [AI_DOCTRINE.md](../../../AI_DOCTRINE.md) · **Index:** [Project_TODO.md](../Project_TODO.md)

**Related:** [notifications-catalog.md](notifications-catalog.md) · [mobile-crew.md](mobile-crew.md) · [timeline-collab-session.md](timeline-collab-session.md) · [beta-prep.md](beta-prep.md) · [offer-invoice-crew-availability-2026-07-20.md](offer-invoice-crew-availability-2026-07-20.md) (§2 manager-side person swap on timeline — future campaign)

**Status:** Backlog — planned roster vs what happened on site

**Last swept:** 2026-06-30

**Note:** Manager **timeline name-click swap** (same department, preserve slot/hours/role/rate) is locked under the future offer/availability campaign §2 — distinct from field actuals substitutions below.
---

## Director intent

Two layers on top of the **timeline plan** (who is scheduled where):

1. **Confirm** — when crew are **added to a timeline**, they must acknowledge: *I am available for this shift and I know about it.*
2. **Field actuals** — on site, reality may differ from the plan: **substitutions** (someone else stays on duty; listed person goes home), **hour adjustments** (+2 h / −2 h), etc. Crew (or lead) must **report what actually happened** in the software.

**Plan stays authoritative for scheduling;** field actuals are a **separate truth** for ops, payroll, and audit — not silent overwrites of the timeline without record.

---

## Shipped today (foundation)

- [x] **Added to schedule** notification on timeline save (`Logistics_Timeline.js`)
- [x] **Shift modified / removed** notifications
- [x] Mobile **MY SHIFTS** / timeline views (`01e`, `03f`)
- [ ] No crew **confirm** flow
- [ ] No **field substitution** or **hours variance** reporting

---

## Phase A — Shift confirmation (ack + availability)

### UX (crew)

- [ ] When assigned to a new or changed shift → notification + in-app row **Needs your confirm**
- [ ] Crew Hub / MY SHIFTS: per shift actions — **Confirm** | **Decline / not available** (with optional short note)
- [ ] Confirm means: *available during this window* + *I have seen the details* (times, role, location)
- [ ] Status visible to managers on timeline or roster: `pending` | `confirmed` | `declined`
- [ ] Reminder nudge if unconfirmed within TBD (e.g. 24 h before shift start)

### UX (manager)

- [ ] Dashboard or project view: who confirmed / who pending / who declined
- [ ] FCM + in-app when crew confirms or declines
- [ ] Re-assign flow when declined (manual today — link to timeline edit)

### Data (planned)

- [ ] Per shift assignment row (or side table): `confirm_status`, `confirmed_at`, `confirmed_by`, `decline_note`
- [ ] Tie to `Shift_Assignments` / crew uid on timeline payload — schema TBD
- [ ] Audit log entry on confirm/decline

### Notifications

- [ ] Extend [notifications-catalog.md](notifications-catalog.md): **Confirm your shift** (crew), **Crew declined shift** (manager)
- [ ] Debounce with existing timeline save digest where possible

### Code touchpoints (planned)

- [ ] `Logistics_Timeline.js` — emit confirm-required on new assignments
- [ ] `01e_Mobile_Crew_Hub.html`, `03f_Timeline_Mobile.html` — confirm UI
- [ ] `Notifications_Dispatch.js` — new types
- [ ] GAS: `confirmShiftAssignment` / `declineShiftAssignment`

---

## Phase B — Field actuals (substitution & hours)

### Director rules

- Timeline **plan** may still show the originally listed person.
- On the field, **another crew member may cover** the duty (listed person left early / went home).
- Someone must **record the actual** in Showrunner — not only verbal handover.

### UX (field / mobile-first)

- [ ] On **MY SHIFTS** or active duty: **Report change** for a shift block
- [ ] **Substitution:** “I covered for [name]” or “[name] covered for me” — pick crew from roster; optional note
- [ ] **Hours variance:** actual end (or delta): e.g. **+2 h** / **−2 h** vs planned strip — with reason preset (extended show, sent home early, etc.)
- [ ] **Who submits:** assigned crew, substitute, or manager on their behalf (RBAC TBD)
- [ ] Manager **approve** or **ack** field reports (ties to [beta-prep.md](beta-prep.md) payroll adjustments)

### Data (planned)

- [ ] `Shift_Field_Actuals` or append-only log: `project_id`, `shift_id`, `planned_crew_uid`, `actual_crew_uid`, `planned_start/end`, `actual_start/end`, `hours_delta`, `reported_by`, `reported_at`, `status` (pending | approved)
- [ ] Do **not** silently rewrite timeline strips without manager action — field report is overlay until merged (policy TBD)

### Downstream

- [ ] Payroll / overtime module consumes approved actuals ([beta-prep.md](beta-prep.md) — crew payroll adjustment)
- [ ] Manager digest: “3 field changes pending approval”

### Code touchpoints (planned)

- [ ] New sheet or ENGINE tab — schema in stable doc when built
- [ ] Mobile report form + manager approval in project editor or Personal Hub (managers)
- [ ] Optional: link to checkout / presence if on-site duty detection exists later

---

## Phase order

1. **Shift confirmation** (Phase A) — before or parallel with timeline collab; uses existing notifications
2. **Field actuals** (Phase B) — after confirm flow stable; feeds payroll beta

**Independent of** [timeline-collab-session.md](timeline-collab-session.md) (multi-user edit room) — but collab session should not bypass confirm/actuals rules.

---

## Open decisions (TBD before build)

- [ ] Decline → auto-remove from shift vs manager-only fix
- [ ] Can one shift have multiple actuals (split duty) or single substitute only
- [ ] Whether field actual **merges** into timeline strip on approve or stays parallel forever
- [ ] Crew freelancers: confirm required for all roles or only certain tiers
