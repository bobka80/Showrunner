# Project roadmap — index only

**Entry:** [AI_DOCTRINE.md](../../AI_DOCTRINE.md) · **Topic drawers:** [topics/](topics/) · **Active campaigns:** [active/](active/) · **Bug journal:** [error-journal/](error-journal/)

Read **one topic file** for the area you are working on — not this whole page.

---

## URGENT (blocks current campaign)

*Nothing urgent.*

When production is blocked, add a row here or create `active/URGENT-<name>.md`.

---

## Next up (director, 2026-07-21)

**Primary campaign (NEXT):** **Logistics Ledger** — **M2 backfill** shipped; forks still paused; next **M3 readers**. — [active/logistics-ledger-2026-07-21.md](active/logistics-ledger-2026-07-21.md) · [dal-live-forks-pause.md](topics/dal-live-forks-pause.md).

**Operational logs:** Bug journal [error-journal/](error-journal/) · root `RELEASES.md` / `WORKS_LOG.md`.

Also on the board (do not mix without director pick):

| Item | Status | File |
|------|--------|------|
| **Logistics Ledger** | **M2 done** — forks paused; next M3 | [active/logistics-ledger-2026-07-21.md](active/logistics-ledger-2026-07-21.md) |
| **Project Campaign Room** | After Ledger M4+ | [topics/project-campaign-firebase-hybrid-decision-2026-07-21.md](topics/project-campaign-firebase-hybrid-decision-2026-07-21.md) · [locks](topics/architecture-campaign-director-locks-2026-07-21.md) |
| **Pre-ship expansion** (RBAC → FCM → truck → financials) | Backlog brief — OK go per domain | [topics/pre-ship-pipeline-expansion-2026-07-18.md](topics/pre-ship-pipeline-expansion-2026-07-18.md) |
| **Station UI rework** | After **OK go** — Phase A shell split | [STATION_UI.md](STATION_UI.md) · [active/station-ui-handoff.md](active/station-ui-handoff.md) |
| **Phone app** | In-flight mobile (parallel) | [topics/mobile-crew.md](topics/mobile-crew.md) |

---

## Active campaigns

| Campaign | Status | File |
|----------|--------|------|
| **Logistics Ledger** (movement SoT + PA slim) | **M2 backfill** — forks paused; next M3 | [active/logistics-ledger-2026-07-21.md](active/logistics-ledger-2026-07-21.md) · [pack](topics/architecture-multi-campaign-pack-2026-07-21.md) · [schema](topics/logistics-ledger-schema-2026-07-20.md) |
| **RFID scanning & station profiles** | **REWIND pinned @ GAS 530** — floor working. Phase A shell split when picked | [active/rfid-station-profiles.md](active/rfid-station-profiles.md) |

**Closed this session:** Multi-user fork Part B → [archive/multi-user-fork-industrial-and-auto.md](archive/multi-user-fork-industrial-and-auto.md) · process [archive/bulletproof-multiuser-live-editors-2026-07-18.md](archive/bulletproof-multiuser-live-editors-2026-07-18.md).

**Operational log (not a campaign):** [error-journal/](error-journal/) — lasting bug memory from Report → Hand over packs. Day files: [error-journal/days/](error-journal/days/).

---

## Topic backlogs

| Topic | Status | File |
|-------|--------|------|
| Notifications | Catalog + infra @ v359; see catalog for test matrix | [topics/notifications-catalog.md](topics/notifications-catalog.md) · [notifications.md](topics/notifications.md) |
| Global tasks | Visibility rules + `task_view_all` IAM v345 | [topics/tasks.md](topics/tasks.md) |
| Mobile crew UX | Shipped v314+; **phone QR scan shipped v474** (see topic) | [topics/mobile-crew.md](topics/mobile-crew.md) |
| Database operations | Partial — backup/restore + push admin | [topics/database-ops.md](topics/database-ops.md) |
| Financials & quoting | Partial — offer tab + print studio | [topics/financials.md](topics/financials.md) |
| **Offer / invoice · crew swap · availability conflicts** | Future — **off critical path** (parallel or later); soft/hard defs still useful for Ledger M5 | [topics/offer-invoice-crew-availability-2026-07-20.md](topics/offer-invoice-crew-availability-2026-07-20.md) |
| **Logistics Ledger** (movement SoT + conflict detection) | **ACTIVE — M0+M1 shipped** — dual-write; next M2 backfill | [active/logistics-ledger-2026-07-21.md](active/logistics-ledger-2026-07-21.md) · [schema](topics/logistics-ledger-schema-2026-07-20.md) |
| **Project Campaign Room (Firebase hybrid)** | After Logistics Ledger M4+; locks + pack filed 2026-07-21 — not active | [topics/project-campaign-firebase-hybrid-decision-2026-07-21.md](topics/project-campaign-firebase-hybrid-decision-2026-07-21.md) · [locks](topics/architecture-campaign-director-locks-2026-07-21.md) · [pack](topics/architecture-multi-campaign-pack-2026-07-21.md) |
| Logistics & warehouse RFID | Active campaign — station BLE reconnect UI-restart solved (APK 0.1.36); phone QR shipped → mobile-crew | [topics/logistics-warehouse.md](topics/logistics-warehouse.md) |
| Project Assets concurrency | Backlog — normal-day Sheets; floor fork → prep session | [topics/project-assets-concurrency.md](topics/project-assets-concurrency.md) |
| Compliance & H&S | Backlog | [topics/compliance.md](topics/compliance.md) |
| Availability & fleet tracker | Partial — equipment tracker matrix | [topics/availability-fleet.md](topics/availability-fleet.md) |
| UX & platform | Partial — desktop lock preserves working screen @ **v625**; Personal Hub profile TBD | [topics/ux-platform.md](topics/ux-platform.md) |
| Beta prep (payroll, transport, audit) | Partial — RBAC 1–5, fin globals | [topics/beta-prep.md](topics/beta-prep.md) |
| **Pre-beta hardening (full debug sweeps)** | Backlog — **runs last** (see Final section below) | [topics/pre-beta-hardening.md](topics/pre-beta-hardening.md) |
| Training manuals | Backlog | [topics/training-manuals.md](topics/training-manuals.md) |
| Google Workspace migration | **Done** — in-place host upgrade verified (NAS backlog separate) | [topics/workspace-migration.md](topics/workspace-migration.md) |
| Drive → NAS year archive | Backlog — Workspace host ready | [topics/drive-nas-year-archive.md](topics/drive-nas-year-archive.md) |
| Session fork platform | Live — dual-domain shipped; see topic | [topics/session-fork-platform.md](topics/session-fork-platform.md) |
| Unified data cache engine **+ DAL** | **Campaign archived** — Phase 6B live; lasting ref in topic | [topics/data-cache-engine.md](topics/data-cache-engine.md) · [archive/data-access-layer.md](archive/data-access-layer.md) |
| Warehouse prep session | Partial — PA fork live rollback **v654**; auto-fork **shipped** (Part B archived) | [topics/warehouse-prep-session.md](topics/warehouse-prep-session.md) · [archive/multi-user-fork-industrial-and-auto.md](archive/multi-user-fork-industrial-and-auto.md) |
| Timeline collab session | Live sync stable; auto-fork **shipped** (Part B archived) | [topics/timeline-collab-session.md](topics/timeline-collab-session.md) · [archive/multi-user-fork-industrial-and-auto.md](archive/multi-user-fork-industrial-and-auto.md) |
| Timeline shift confirm & field actuals | Backlog — crew ack + on-site substitutions/hours | [topics/timeline-shift-field-crew.md](topics/timeline-shift-field-crew.md) |
| Pre-ship expansion (other domains) | Backlog brief | [topics/pre-ship-pipeline-expansion-2026-07-18.md](topics/pre-ship-pipeline-expansion-2026-07-18.md) |

**Build order (infrastructure → platform → sessions):** ~~Workspace~~ ✓ → **phone app (in flight)** → ~~DAL campaign~~ ✓ → ~~warehouse prep / timeline collab Part B~~ ✓ → **Logistics Ledger** → Project Campaign Room → NAS year archive. **Shift confirm** can start early; **field actuals** after confirm. **Last before inviting users:** [topics/pre-beta-hardening.md](topics/pre-beta-hardening.md).

---

## Deferred — return when operational

**Not blocking current milestones.** Known gaps, field-unproven fixes, and agreed-but-unbuilt warehouse/gate work. Resume only when the director confirms floor flows are operational and promotes an item.

| Area | Status | File |
|------|--------|------|
| **Chainway gun sleep / reconnect / dead zone** | Field-unproven (build 53 disconnect beep + auto park) | [topics/deferred-when-operational.md](topics/deferred-when-operational.md) § A |
| **Gate checkout model** | Agreed 2026-07-10 — cases + units hard-allocate; no case↔fixture pairing; not built | same § B |
| **Equipment custody / cable case bind** | Optional later | same § C |
| **Crew EPC+TID, kiosk, gate hardware** | When floor stable | same § D |
| **Prep session, PA concurrency, pull sheets** | Platform track — do not absorb into RFID fixes | same § E |
| **Desktop gate PC power schedule** | Spec captured 2026-07-11 — hibernate + weekday 09:50 wake; not built | [topics/deferred-when-operational.md](topics/deferred-when-operational.md) § F |

**Full checklist + rejected approaches:** [topics/deferred-when-operational.md](topics/deferred-when-operational.md)

---

## Final (pre-beta) — runs last

**After** product TODO / active campaigns are done enough for real users — **not** mid-feature, **not** “after DAL only.” Major freeze backup first; **intent survey** (director labels Bug vs Intentional vs Spec); then multi-sweep hardening (purity → map/registry → S0/S1 root causes → selective S2 → beta readiness). Re-evaluate after every phase.

| Item | Status | File |
|------|--------|------|
| **Pre-beta hardening (multi-sweep debug)** | Backlog — **last** before inviting users | [topics/pre-beta-hardening.md](topics/pre-beta-hardening.md) |

Product beta features (payroll, transport, RBAC QA) stay in [topics/beta-prep.md](topics/beta-prep.md) — that is **what to ship for beta**; pre-beta hardening is **how to debug the whole app before users**.

---

## Archive (reference only)

| Plan | File |
|------|------|
| Post-v330 recovery (closed) | [archive/recovery-after-v330.md](archive/recovery-after-v330.md) · stub [RECOVERY_AFTER_v330.md](RECOVERY_AFTER_v330.md) |
| RBAC & event access (Phases 1–5 done) | [archive/rbac-event-access-plan.md](archive/rbac-event-access-plan.md) · stub [RBAC_EVENT_ACCESS_PLAN.md](RBAC_EVENT_ACCESS_PLAN.md) |
| Error reports + journal **build** (Phases 0–4) | [archive/user-error-reporting-journal-2026-07-19.md](archive/user-error-reporting-journal-2026-07-19.md) · smoke day [archive/error-day-2026-07-20.md](archive/error-day-2026-07-20.md) |
| Prep PA thrash / delete-resurrect incidents | [archive/dal-pa-live-sync-thrash.md](archive/dal-pa-live-sync-thrash.md) · [archive/dal-pa-delete-resurrect.md](archive/dal-pa-delete-resurrect.md) |
| DAL Phase 0 + Slice D | [archive/dal-phase0-discovery-2026-07-13.md](archive/dal-phase0-discovery-2026-07-13.md) · [archive/dal-phase4-slice-d-dual-domain-sessions.md](archive/dal-phase4-slice-d-dual-domain-sessions.md) |
| **Data access layer (full campaign)** | [archive/data-access-layer.md](archive/data-access-layer.md) · design lock · safety · gates · prep-live standards |

---

## Hygiene (AI-maintained)

**Between sweeps:** when completing work, update the **topic** or **active** file, then adjust this index row (status one-liner).

**Full sweep:** director says **"hygiene sweep"** (alias **"doc hygiene"**) → see [AI_DOCTRINE.md](../../AI_DOCTRINE.md) Rule **4c**: one report (proposed fixes, contradictions, TODO gaps) → **no doc edits until OK go** → then apply approved fixes only. If two docs contradict, the sweep report must **ask the director** which wins before any merge.
