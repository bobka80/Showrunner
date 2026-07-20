# Project roadmap — index only

**Entry:** [AI_DOCTRINE.md](../../AI_DOCTRINE.md) · **Topic drawers:** [topics/](topics/) · **Active campaigns:** [active/](active/)

Read **one topic file** for the area you are working on — not this whole page.

---

## URGENT (blocks current campaign)

*Nothing urgent.*

When production is blocked, add a row here or create `active/URGENT-<name>.md`.

---

## Next up (director, 2026-07-20)

**Primary campaign (NEXT):** Error reports + daily journal triage — [active/user-error-reporting-journal-2026-07-19.md](active/user-error-reporting-journal-2026-07-19.md). **Phase 0 done** → next **Phase 1** (Sheet `Error_Reports` + writer). Phase 2 Report UI: **ask director how**.

**Paused / after this middle campaign:** Multi-user fork **Part B** (auto fork) — Part A complete @ v678. Prep live rollback **v654** + `host-boot.js?v=653`. — [active/multi-user-fork-industrial-and-auto.md](active/multi-user-fork-industrial-and-auto.md).

| Stage | What | Gate |
|-------|------|------|
| **0** | Docs + SCHEMA + DRIVE_LAYOUT + journal stub | **Done** (2026-07-20) |
| **1** | Sheet `Error_Reports` + writer | Test row; Audit untouched |
| **2** | Report button + freeze + submit | **Ask director UI**; then web.app smoke |
| **3** | ERROR LOGS tab + Hand over | ROOT exports pack |
| **4** | Cursor playbook + first real pack | Director likes day-campaign shape |
| **5** | Live use (esp. before Part B) | Packs → day campaigns → journal |

Also on the board (do not mix without director pick):

| Item | Status | File |
|------|--------|------|
| **Multi-user fork Part B** | Waiting — after error-reporting middle campaign | [active/multi-user-fork-industrial-and-auto.md](active/multi-user-fork-industrial-and-auto.md) |
| **Pre-ship expansion** (RBAC → FCM → truck → financials) | Backlog — OK go per domain | [active/pre-ship-pipeline-expansion-2026-07-18.md](active/pre-ship-pipeline-expansion-2026-07-18.md) |
| **Station UI rework** | After **OK go** — Phase A shell split | [STATION_UI.md](STATION_UI.md) · [active/station-ui-handoff.md](active/station-ui-handoff.md) |
| **Phone app** | In-flight mobile (parallel) | [topics/mobile-crew.md](topics/mobile-crew.md) |
| **DAL campaign close** | Near-complete — archive paperwork when ready | [active/data-access-layer.md](active/data-access-layer.md) |

---

## Active campaigns

| Campaign | Status | File |
|----------|--------|------|
| **Error reports + daily journal triage** | **NEXT** — Phase 0 done; next Phase 1 Sheet + writer | [active/user-error-reporting-journal-2026-07-19.md](active/user-error-reporting-journal-2026-07-19.md) · [error-journal/](active/error-journal/) |
| **Multi-user fork: test pipeline → bulletproof → auto fork** | **Part A complete** — middle = error-reporting → then Part B | [active/multi-user-fork-industrial-and-auto.md](active/multi-user-fork-industrial-and-auto.md) · [bulletproof](active/bulletproof-multiuser-live-editors-2026-07-18.md) |
| **RFID scanning & station profiles** | **REWIND pinned @ GAS 530** — floor working. Phase A shell split when picked | [active/rfid-station-profiles.md](active/rfid-station-profiles.md) |
| **Data access layer (DAL + router)** | Near-complete — prep live rollback **v654** · DAL-era **v576** | [active/data-access-layer.md](active/data-access-layer.md) · [prep live standards](active/dal-prep-live-sync-standards.md) · [floor scope](active/multi-user-fork-industrial-and-auto.md) |

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
| UX & platform | Partial — desktop lock preserves working screen @ **v625**; Personal Hub profile TBD | [topics/ux-platform.md](topics/ux-platform.md) |
| Beta prep (payroll, transport, audit) | Partial — RBAC 1–5, fin globals | [topics/beta-prep.md](topics/beta-prep.md) |
| **Pre-beta hardening (full debug sweeps)** | Backlog — **runs last** (see Final section below) | [topics/pre-beta-hardening.md](topics/pre-beta-hardening.md) |
| Training manuals | Backlog | [topics/training-manuals.md](topics/training-manuals.md) |
| Google Workspace migration | Done — in-place host upgrade verified | [topics/workspace-migration.md](topics/workspace-migration.md) |
| Drive → NAS year archive | Backlog — Workspace host ready | [topics/drive-nas-year-archive.md](topics/drive-nas-year-archive.md) |
| Session fork platform | Backlog — Firebase buffer + router | [topics/session-fork-platform.md](topics/session-fork-platform.md) |
| Unified data cache engine **+ data access layer (backend abstraction)** | **Phase 6B + Hub atomic live** — [active/data-access-layer.md](active/data-access-layer.md) | [topics/data-cache-engine.md](topics/data-cache-engine.md) |
| Warehouse prep session | Partial — PA fork live rollback **v654**; auto-fork = campaign **Part B** (after Part A) | [topics/warehouse-prep-session.md](topics/warehouse-prep-session.md) · [active/multi-user-fork-industrial-and-auto.md](active/multi-user-fork-industrial-and-auto.md) |
| Timeline collab session | Live sync stable; **auto fork** = campaign **Part B** | [topics/timeline-collab-session.md](topics/timeline-collab-session.md) · [active/multi-user-fork-industrial-and-auto.md](active/multi-user-fork-industrial-and-auto.md) |
| Timeline shift confirm & field actuals | Backlog — crew ack + on-site substitutions/hours | [topics/timeline-shift-field-crew.md](topics/timeline-shift-field-crew.md) |

**Build order (infrastructure → platform → sessions):** ~~Workspace~~ ✓ → **phone app (in flight)** → **DAL campaign** (Phase 0 sweep → repos/router → **Phase 3 delta-only gate** → Firebase → reconciliation → cache) — [active/dal-firebase-design-lock-2026-07-13.md](active/dal-firebase-design-lock-2026-07-13.md) → **warehouse prep** → **timeline collab** → NAS year archive. **Shift confirm** can start early; **field actuals** after confirm. Do **not** start Firebase prep/timeline fork before DAL Phase 3 (delta saves) + Phase 4 shell. **Last before inviting users:** [topics/pre-beta-hardening.md](topics/pre-beta-hardening.md).

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
| Post-v330 recovery (closed) | [archive/recovery-after-v330.md](archive/recovery-after-v330.md) |
| RBAC & event access (Phases 1–5 done) | [archive/rbac-event-access-plan.md](archive/rbac-event-access-plan.md) |

---

## Hygiene (AI-maintained)

**Between sweeps:** when completing work, update the **topic** or **active** file, then adjust this index row (status one-liner).

**Full sweep:** director says **"hygiene sweep"** (alias **"doc hygiene"**) → see [AI_DOCTRINE.md](../../AI_DOCTRINE.md) Rule **4c**: one report (proposed fixes, contradictions, TODO gaps) → **no doc edits until OK go** → then apply approved fixes only. If two docs contradict, the sweep report must **ask the director** which wins before any merge.
