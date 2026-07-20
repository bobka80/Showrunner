# Topic backlogs

One file per feature area. **Read only the topic you need.**

**Index:** [Project_TODO.md](../Project_TODO.md) · **Entry:** [AI_DOCTRINE.md](../../../AI_DOCTRINE.md)

**Stable reference (how the system works — not backlog):** see the parent [README.md](../README.md). Topics here are **what to build**; stable docs are **how things work** and **what not to break**.

**Last index sweep:** 2026-07-04 (production @ GAS **v429**)

> **Status lives in one place:** the single canonical status table is **[Project_TODO.md](../Project_TODO.md)**. This page is only a **directory of topic files** — do **not** re-add a status column here (it will drift out of sync).

## Topic files

- [notifications-catalog.md](notifications-catalog.md) · [notifications.md](notifications.md) — push checklist + architecture
- [tasks.md](tasks.md) — global tasks visibility + IAM
- [mobile-crew.md](mobile-crew.md) — mobile crew UX
- [database-ops.md](database-ops.md) — backup/restore + push admin
- [financials.md](financials.md) — financials & quoting
- [logistics-warehouse.md](logistics-warehouse.md) — warehouse RFID, station gun, gate
- [project-assets-concurrency.md](project-assets-concurrency.md) — multi-user Project Assets
- [compliance.md](compliance.md) — compliance & H&S
- [availability-fleet.md](availability-fleet.md) — availability & fleet tracker
- [ux-platform.md](ux-platform.md) — UX, Personal Hub, desktop lock
- [beta-prep.md](beta-prep.md) — beta prep (payroll, transport, audit)
- [pre-beta-hardening.md](pre-beta-hardening.md) — **final** multi-sweep debug before users (after product TODO)
- [training-manuals.md](training-manuals.md) — training manuals
- [workspace-migration.md](workspace-migration.md) — Google Workspace migration (done)
- [drive-nas-year-archive.md](drive-nas-year-archive.md) — Drive → NAS year archive
- [session-fork-platform.md](session-fork-platform.md) — session fork platform
- [data-cache-engine.md](data-cache-engine.md) — unified data cache engine
- [warehouse-prep-session.md](warehouse-prep-session.md) — warehouse prep session fork
- [timeline-collab-session.md](timeline-collab-session.md) — multi-user timeline room
- [timeline-shift-field-crew.md](timeline-shift-field-crew.md) — shift confirm & field actuals

**Build order:** ~~[workspace-migration.md](workspace-migration.md)~~ ✓ → ~~DAL campaign~~ ✓ ([../archive/data-access-layer.md](../archive/data-access-layer.md) through **Phase 4 Slice D** [../archive/dal-phase4-slice-d-dual-domain-sessions.md](../archive/dal-phase4-slice-d-dual-domain-sessions.md) + Phase 5–6) → fuller [warehouse-prep-session.md](warehouse-prep-session.md) / [timeline-collab-session.md](timeline-collab-session.md) UX (Part B). **Shift confirm** may start early; **field actuals** after confirm. **Last before users:** [pre-beta-hardening.md](pre-beta-hardening.md).

When adding a new area: create a topic file here, add one line to `Project_TODO.md` index (the only status table). **Do not** put canonical “how it works” docs in this folder — use [drawer placement rules](../README.md#where-to-put-new-documentation) in the parent README.
