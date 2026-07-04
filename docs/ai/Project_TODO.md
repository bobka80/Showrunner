# Project roadmap — index only

**Entry:** [AI_DOCTRINE.md](../../AI_DOCTRINE.md) · **Topic drawers:** [topics/](topics/) · **Active campaigns:** [active/](active/)

Read **one topic file** for the area you are working on — not this whole page.

---

## URGENT (blocks current campaign)

*Nothing urgent.*

When production is blocked, add a row here or create `active/URGENT-<name>.md`.

---

## Next up (director, 2026-07-04)

After the RFID station campaign pauses: **ledgers** work + **Google Chat update**. Ledgers → [topics/financials.md](topics/financials.md), [topics/warehouse-prep-session.md](topics/warehouse-prep-session.md), `Operations.js`. Google Chat → [topics/workspace-migration.md](topics/workspace-migration.md) (Chat backlog). Create an active campaign file when work starts.

---

## Active campaigns

| Campaign | Status | File |
|----------|--------|------|
| **RFID scanning & station device profiles** | Active — GAS **v429**, APK **0.1.10**; host-inherit + Vault shipped; open: checkout cache speed, QR gate, field verify | [active/rfid-station-profiles.md](active/rfid-station-profiles.md) |

---

## Topic backlogs

| Topic | Status | File |
|-------|--------|------|
| Notifications | Catalog + infra @ v359; see catalog for test matrix | [topics/notifications-catalog.md](topics/notifications-catalog.md) · [notifications.md](topics/notifications.md) |
| Global tasks | Visibility rules + `task_view_all` IAM v345 | [topics/tasks.md](topics/tasks.md) |
| Mobile crew UX | Shipped v314; mobile PA auto-save shipped v368 | [topics/mobile-crew.md](topics/mobile-crew.md) |
| Database operations | Partial — backup/restore + push admin | [topics/database-ops.md](topics/database-ops.md) |
| Financials & quoting | Partial — offer tab + print studio | [topics/financials.md](topics/financials.md) |
| Logistics & warehouse RFID | Partial — station through **v429** + APK **0.1.10**; checkout cache speed + QR gate open | [topics/logistics-warehouse.md](topics/logistics-warehouse.md) |
| Project Assets concurrency | Backlog — normal-day Sheets; floor fork → prep session | [topics/project-assets-concurrency.md](topics/project-assets-concurrency.md) |
| Compliance & H&S | Backlog | [topics/compliance.md](topics/compliance.md) |
| Availability & fleet tracker | Partial — equipment tracker matrix | [topics/availability-fleet.md](topics/availability-fleet.md) |
| UX & platform | Partial — desktop lock @ v388 (polish → v409); Personal Hub profile TBD | [topics/ux-platform.md](topics/ux-platform.md) |
| Beta prep (payroll, transport, audit) | Partial — RBAC 1–5, fin globals | [topics/beta-prep.md](topics/beta-prep.md) |
| Training manuals | Backlog | [topics/training-manuals.md](topics/training-manuals.md) |
| Google Workspace migration | Done — in-place host upgrade verified | [topics/workspace-migration.md](topics/workspace-migration.md) |
| Drive → NAS year archive | Backlog — Workspace host ready | [topics/drive-nas-year-archive.md](topics/drive-nas-year-archive.md) |
| Session fork platform | Backlog — Firebase buffer + router | [topics/session-fork-platform.md](topics/session-fork-platform.md) |
| Unified data cache engine **+ data access layer (backend abstraction)** | Backlog — one cache API w/ per-view policies & surgical (never flush-all) invalidation; **one DAL/repository seam to reroute to SQL/Postgres/paid Firebase from a single place** | [topics/data-cache-engine.md](topics/data-cache-engine.md) |
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

**Between sweeps:** when completing work, update the **topic** or **active** file, then adjust this index row (status one-liner).

**Full sweep:** director says **"hygiene sweep"** (alias **"doc hygiene"**) → see [AI_DOCTRINE.md](../../AI_DOCTRINE.md) Rule **4c**: one report (proposed fixes, contradictions, TODO gaps) → **no doc edits until OK go** → then apply approved fixes only. If two docs contradict, the sweep report must **ask the director** which wins before any merge.
