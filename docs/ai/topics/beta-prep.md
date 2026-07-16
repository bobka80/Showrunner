# Beta prep — payroll, transport, security audit

**Entry:** [AI_DOCTRINE.md](../../../AI_DOCTRINE.md) · **Index:** [Project_TODO.md](../Project_TODO.md)

**Last swept:** 2026-07-16 · **Status:** Partial — RBAC 1–5 + fin globals shipped; full beta payroll/transport pending

**Before inviting users:** run [pre-beta-hardening.md](pre-beta-hardening.md) (multi-sweep debug — **last** on the roadmap). This file = product beta features; that file = whole-app purity + root-cause sweeps.

---

## Shipped (partial)

- [x] **RBAC Phases 1–5** — briefing mode, calendar filters, timeline/assets gates ([archive/rbac-event-access-plan.md](../archive/rbac-event-access-plan.md))
- [x] **Project difficulty multiplier** — editor field saved to project (`edit-proj-multiplier`)
- [x] **Financials hub fin_globals** — phase rates, overtime multiplier, role rate matrix UI (`09_Financials_Hub.html`, `Logistics_Roster.js`)
- [x] **Vehicle tier schema** — `Vehicle_Tier` on fleet records (Tier 1–4 data model ready)
- [x] **Warehouse distance (km)** — OSRM from warehouse in map editor — not full transport quote engine

## Remaining

- [ ] **Dual payroll multiplier matrix** — personal multiplier on crew profile × project multiplier × shift phasing (Build/Duty/Breakdown) wired end-to-end
- [ ] **Crew payroll adjustment module** — overtime/long-duty submissions for manager approval (see [timeline-shift-field-crew.md](timeline-shift-field-crew.md) field actuals)
- [ ] **Automated transport quoting** — local flat / per-km + tolls + border + stay fees as priced lines
- [ ] **Generic fleet tier presets** — Sprinter → Artic dimensions driving truck planner
- [ ] **RBAC Phase 6 QA** — role templates + director test checklist before beta

Push notification scenarios: [notifications-catalog.md](notifications-catalog.md).

Pre-beta whole-app debug (comes after product work): [pre-beta-hardening.md](pre-beta-hardening.md).
