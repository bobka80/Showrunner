# Project roadmap — index only

**Entry:** [AI_DOCTRINE.md](../../AI_DOCTRINE.md) · **Topic drawers:** [topics/](topics/) · **Active campaigns:** [active/](active/)

Read **one topic file** for the area you are working on — not this whole page.

---

## URGENT (blocks current campaign)

*Nothing urgent.*

When production is blocked, add a row here or create `active/URGENT-<name>.md`.

---

## Active campaigns

| Campaign | Status | File |
|----------|--------|------|
| **RFID scanning & station device profiles** | Active — shell/profiles/idle-eject/gun app/APK shipped; hardware verification + gate next | [active/rfid-station-profiles.md](active/rfid-station-profiles.md) |
| *(closed)* | Post-v330 recovery closed @ v376 | [archive/recovery-after-v330.md](archive/recovery-after-v330.md) |

---

## Topic backlogs

| Topic | Status | File |
|-------|--------|------|
| Notifications | Catalog + infra @ v359; see catalog for test matrix | [topics/notifications-catalog.md](topics/notifications-catalog.md) · [notifications.md](topics/notifications.md) |
| Global tasks | Visibility rules + `task_view_all` IAM v345 | [topics/tasks.md](topics/tasks.md) |
| Mobile crew UX | Shipped v314; mobile PA auto-save shipped v368 | [topics/mobile-crew.md](topics/mobile-crew.md) |
| Database operations | Partial — backup/restore + push admin | [topics/database-ops.md](topics/database-ops.md) |
| Financials & quoting | Partial — offer tab + print studio | [topics/financials.md](topics/financials.md) |
| Logistics & warehouse RFID | Partial — checkout bar; station shell + host idle eject + native gun app + APK install page (v411); gate planned | [topics/logistics-warehouse.md](topics/logistics-warehouse.md) |
| Project Assets concurrency | Backlog — normal-day Sheets; floor fork → prep session | [topics/project-assets-concurrency.md](topics/project-assets-concurrency.md) |
| Compliance & H&S | Backlog | [topics/compliance.md](topics/compliance.md) |
| Availability & fleet tracker | Partial — equipment tracker matrix | [topics/availability-fleet.md](topics/availability-fleet.md) |
| UX & platform | Partial — desktop lock @ v388 (polish → v409); Personal Hub profile TBD | [topics/ux-platform.md](topics/ux-platform.md) |
| Beta prep (payroll, transport, audit) | Partial — RBAC 1–5, fin globals | [topics/beta-prep.md](topics/beta-prep.md) |
| Training manuals | Backlog | [topics/training-manuals.md](topics/training-manuals.md) |
| Google Workspace migration | Done — in-place host upgrade verified | [topics/workspace-migration.md](topics/workspace-migration.md) |
| Drive → NAS year archive | Backlog — Workspace host ready | [topics/drive-nas-year-archive.md](topics/drive-nas-year-archive.md) |
| Session fork platform | Backlog — Firebase buffer + router | [topics/session-fork-platform.md](topics/session-fork-platform.md) |
| Unified data cache engine | Backlog — one API, per-screen policies | [topics/data-cache-engine.md](topics/data-cache-engine.md) |
| Warehouse prep session | Backlog — PA + ledger on fork | [topics/warehouse-prep-session.md](topics/warehouse-prep-session.md) |
| Timeline collab session | Backlog — multi-user timeline room | [topics/timeline-collab-session.md](topics/timeline-collab-session.md) |
| Timeline shift confirm & field actuals | Backlog — crew ack + on-site substitutions/hours | [topics/timeline-shift-field-crew.md](topics/timeline-shift-field-crew.md) |

**Build order (infrastructure → platform → sessions):** ~~Workspace~~ ✓ → **NAS year archive** → **data cache engine (Phase A)** + **session fork platform** (parallel) → warehouse prep → timeline collab. **Shift confirm** can start early; **field actuals** after confirm.

---

## Archive (reference only)

| Plan | File |
|------|------|
| Post-v330 recovery (closed) | [archive/recovery-after-v330.md](archive/recovery-after-v330.md) |
| RBAC & event access (Phases 1–5 done) | [archive/rbac-event-access-plan.md](archive/rbac-event-access-plan.md) |

---

## Hygiene (AI-maintained)

When completing work: update the **topic** or **active** file, then adjust this index row (status one-liner). On **"doc hygiene"**: sync all rows, move finished campaigns to `archive/`, remove resolved URGENT items. If two docs contradict, **ask the director** before merging.
