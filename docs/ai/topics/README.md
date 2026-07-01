# Topic backlogs

One file per feature area. **Read only the topic you need.**

**Index:** [Project_TODO.md](../Project_TODO.md) · **Entry:** [AI_DOCTRINE.md](../../AI_DOCTRINE.md)

**Stable reference (how the system works — not backlog):** see the parent [README.md](../README.md). Topics here are **what to build**; stable docs are **how things work** and **what not to break**.

**Last index sweep:** 2026-06-30 (production @ GAS **v388**)

| Topic | Status | File |
|-------|--------|------|
| Notifications | Catalog @ v359 — crew/manager checklist | [notifications-catalog.md](notifications-catalog.md) · [notifications.md](notifications.md) |
| Global tasks | Manager vs crew visibility + `task_view_all` v345 | [tasks.md](tasks.md) |
| Mobile crew UX | Shipped v314; PA auto-save + shift confirm planned | [mobile-crew.md](mobile-crew.md) |
| Database operations | Partial — backup/restore + push admin | [database-ops.md](database-ops.md) |
| Financials & quoting | Partial — offer tab + print studio | [financials.md](financials.md) |
| Logistics & warehouse RFID | Partial — checkout bar; gate + station profile planned | [logistics-warehouse.md](logistics-warehouse.md) |
| Project Assets concurrency | Backlog — normal-day Sheets; floor fork → prep session | [project-assets-concurrency.md](project-assets-concurrency.md) |
| Compliance & H&S | Backlog (nothing shipped) | [compliance.md](compliance.md) |
| Availability & fleet tracker | Partial — equipment tracker matrix | [availability-fleet.md](availability-fleet.md) |
| UX & platform | Partial — desktop lock @ v388; Personal Hub profile TBD | [ux-platform.md](ux-platform.md) |
| Beta prep | Partial — RBAC 1–5, fin globals | [beta-prep.md](beta-prep.md) |
| Training manuals | Backlog (product exists; manual pack not started) | [training-manuals.md](training-manuals.md) |
| Google Workspace migration | Done — in-place host upgrade verified | [workspace-migration.md](workspace-migration.md) |
| Drive → NAS year archive | Backlog — Workspace host ready | [drive-nas-year-archive.md](drive-nas-year-archive.md) |
| Session fork platform | Backlog — shared Firebase buffer + router | [session-fork-platform.md](session-fork-platform.md) |
| Unified data cache engine | Backlog — one API, per-screen policies | [data-cache-engine.md](data-cache-engine.md) |
| Warehouse prep session | Backlog — PA + ledger + trucks on fork | [warehouse-prep-session.md](warehouse-prep-session.md) |
| Timeline collab session | Backlog — multi-user timeline room | [timeline-collab-session.md](timeline-collab-session.md) |
| Timeline shift confirm & field actuals | Backlog — crew ack + on-site substitutions/hours | [timeline-shift-field-crew.md](timeline-shift-field-crew.md) |

**Build order:** ~~[workspace-migration.md](workspace-migration.md)~~ ✓ → [drive-nas-year-archive.md](drive-nas-year-archive.md) → [data-cache-engine.md](data-cache-engine.md) (Phase A) + [session-fork-platform.md](session-fork-platform.md) → [warehouse-prep-session.md](warehouse-prep-session.md) → [timeline-collab-session.md](timeline-collab-session.md). **Shift confirm** may start early; **field actuals** after confirm.

When adding a new area: create a topic file here, add one line to `Project_TODO.md` index. **Do not** put canonical “how it works” docs in this folder — use [drawer placement rules](../README.md#where-to-put-new-documentation) in the parent README.
