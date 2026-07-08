# Project roadmap — index only

**Entry:** [AI_DOCTRINE.md](../../AI_DOCTRINE.md) · **Topic drawers:** [topics/](topics/) · **Active campaigns:** [active/](active/)

Read **one topic file** for the area you are working on — not this whole page.

---

## URGENT (blocks current campaign)

*Nothing urgent.*

When production is blocked, add a row here or create `active/URGENT-<name>.md`.

---

## Next up (director, 2026-07-05)

1. **Phone app** — finish in-flight mobile work (director priority; not blocked on DAL).
2. **Data access layer (DAL)** — Phase 0 discovery sweep → design lock → incremental router/repos **before** Firebase prep ledger or timeline fork. Campaign: [active/data-access-layer.md](active/data-access-layer.md). Say **OK go** to start Phase 0.
3. **After DAL Phase 3A+:** warehouse prep session (Firebase PA + ledger), expanded ledger, timeline collab — all via repos ([warehouse-prep-session.md](topics/warehouse-prep-session.md), [timeline-collab-session.md](topics/timeline-collab-session.md)).
4. **Parallel when ready:** Google Chat update → [topics/workspace-migration.md](topics/workspace-migration.md).

---

## Active campaigns

| Campaign | Status | File |
|----------|--------|------|
| **RFID scanning & station profiles** | Active — **BLE reconnect UI-restart SOLVED** (APK 0.1.36: HID-keyboard configChanges fix); next: kiosk auto-start → optimistic badge login | [active/rfid-station-profiles.md](active/rfid-station-profiles.md) |
| **Data access layer (DAL + router)** | **Planned — not executing**; phone app first; blocks Firebase prep/timeline fork until Phase 3 | [active/data-access-layer.md](active/data-access-layer.md) |

---

## Topic backlogs

| Topic | Status | File |
|-------|--------|------|
| Notifications | Catalog + infra @ v359; see catalog for test matrix | [topics/notifications-catalog.md](topics/notifications-catalog.md) · [notifications.md](topics/notifications.md) |
| Global tasks | Visibility rules + `task_view_all` IAM v345 | [topics/tasks.md](topics/tasks.md) |
| Mobile crew UX | Shipped v314+; **phone QR scan shipped v474** (see topic) | [topics/mobile-crew.md](topics/mobile-crew.md) |
| Database operations | Partial — backup/restore + push admin | [topics/database-ops.md](topics/database-ops.md) |
| Financials & quoting | Partial — offer tab + print studio | [topics/financials.md](topics/financials.md) |
| Logistics & warehouse RFID | Active campaign — station BLE reconnect UI-restart solved (APK 0.1.36); phone QR shipped → mobile-crew | [topics/logistics-warehouse.md](topics/logistics-warehouse.md) |
| Project Assets concurrency | Backlog — normal-day Sheets; floor fork → prep session | [topics/project-assets-concurrency.md](topics/project-assets-concurrency.md) |
| Compliance & H&S | Backlog | [topics/compliance.md](topics/compliance.md) |
| Availability & fleet tracker | Partial — equipment tracker matrix | [topics/availability-fleet.md](topics/availability-fleet.md) |
| UX & platform | Partial — desktop lock @ v388 (polish → v409); Personal Hub profile TBD | [topics/ux-platform.md](topics/ux-platform.md) |
| Beta prep (payroll, transport, audit) | Partial — RBAC 1–5, fin globals | [topics/beta-prep.md](topics/beta-prep.md) |
| Training manuals | Backlog | [topics/training-manuals.md](topics/training-manuals.md) |
| Google Workspace migration | Done — in-place host upgrade verified | [topics/workspace-migration.md](topics/workspace-migration.md) |
| Drive → NAS year archive | Backlog — Workspace host ready | [topics/drive-nas-year-archive.md](topics/drive-nas-year-archive.md) |
| Session fork platform | Backlog — Firebase buffer + router | [topics/session-fork-platform.md](topics/session-fork-platform.md) |
| Unified data cache engine **+ data access layer (backend abstraction)** | **Active campaign (planned)** — DAL/router first; cache Phase D after repos — [active/data-access-layer.md](active/data-access-layer.md) · target arch [topics/data-cache-engine.md](topics/data-cache-engine.md) | [topics/data-cache-engine.md](topics/data-cache-engine.md) |
| Warehouse prep session | **Blocked on DAL** — PA + ledger on Firebase fork via repos | [topics/warehouse-prep-session.md](topics/warehouse-prep-session.md) |
| Timeline collab session | **Blocked on DAL** — timeline room on Firebase fork via repos | [topics/timeline-collab-session.md](topics/timeline-collab-session.md) |
| Timeline shift confirm & field actuals | Backlog — crew ack + on-site substitutions/hours | [topics/timeline-shift-field-crew.md](topics/timeline-shift-field-crew.md) |

**Build order (infrastructure → platform → sessions):** ~~Workspace~~ ✓ → **phone app (in flight)** → **DAL campaign** ([active/data-access-layer.md](active/data-access-layer.md): Phase 0 sweep → Sheets repos → session router → Firebase adapters) → **warehouse prep** → **timeline collab** → **cache coordinator (Phase D)** → NAS year archive. **Shift confirm** can start early; **field actuals** after confirm. Do **not** start Firebase prep/timeline fork before DAL Phase 3 shell.

---

## Archive (reference only)

| Plan | File |
|------|------|
| Post-v330 recovery (closed) | [archive/recovery-after-v330.md](archive/recovery-after-v330.md) |
| RBAC & event access (Phases 1–5 done) | [archive/rbac-event-access-plan.md](archive/rbac-event-access-plan.md) |

---

## Hygiene (AI-maintained)

**Between sweeps:** when completing work, update the **topic** or **active** file, then adjust this index row (status one-liner).

**Full sweep:** director says **"hygiene sweep"** (alias **"doc hygiene"**) → see [AI_DOCTRINE.md](../../AI_DOCTRINE.md) Rule **4c**: one report (proposed fixes, contradictions, TODO gaps) → **no doc edits until OK go** → then apply approved fixes only. If two docs contradict, the sweep report must **ask the director** which wins before any merge.
