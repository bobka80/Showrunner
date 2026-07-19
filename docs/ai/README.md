# AI knowledge base — drawer map

**Single door:** [AI_DOCTRINE.md](../../AI_DOCTRINE.md) — read first, always.

This file is the **map of drawers**. Do not duplicate doctrine rules here.

---

## Drawers (where to look)

| Drawer | Path | Use when |
|--------|------|----------|
| **Active** | [active/](active/) | Current campaigns, URGENT fixes, recovery steps |
| **Topics** | [topics/](topics/) | Feature backlog — one file per area |
| **Archive** | [archive/](archive/) | Finished plans — reference only |
| **Index** | [Project_TODO.md](Project_TODO.md) | Topic + campaign status table only |

---

## Stable reference (architecture & code trace)

| Document | Purpose |
|----------|---------|
| [DIRECTOR_WORKFLOW.md](DIRECTOR_WORKFLOW.md) | Brainstorm vs build; how the director works with AI |
| [CURSOR_WORKFLOW.md](CURSOR_WORKFLOW.md) | Cursor rules, subagents, Bugbot/security gates, session routine |
| [CLAUDE_PACK.md](CLAUDE_PACK.md) | Repomix pack for Claude project knowledge (`node create-repomix.js`) |
| [FRAGILE_ZONES.md](FRAGILE_ZONES.md) | Pre-flight checklist before dangerous edits |
| [EQUIPMENT_MODEL.md](EQUIPMENT_MODEL.md) | Bulk vs unique, Matryoshka, Auto-Packing vs Auto-Containerization — **read before PA/warehouse** |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Deep traps, build pipeline, RBAC boot |
| [SCHEMA.md](SCHEMA.md) | JSON shapes |
| [GLOSSARY.md](GLOSSARY.md) | Magic strings |
| [FILE_MAP.md](FILE_MAP.md) | All modules, `@INDEX:` markers, wiring status |
| [MOBILE_CREW_UX.md](MOBILE_CREW_UX.md) | Mobile crew UI reference (shipped) |
| [ENGINEERING_RULES.md](ENGINEERING_RULES.md) | 30-table model, audit, financials prep |
| [UI_DOCTRINE.md](UI_DOCTRINE.md) | Structural UI rules |
| [File_Splitting_Guide.md](File_Splitting_Guide.md) | Safe file splits |
| [DEPLOY_AND_ROLLBACK.md](DEPLOY_AND_ROLLBACK.md) | This works / milestone / rollback |
| [DRIVE_LAYOUT.md](DRIVE_LAYOUT.md) | Google Drive — `STAGE_MASTERS_SYSTEM_ROOT`, `05_DATABASE`, Showrunner Sync |
| [active/dal-firebase-design-lock-2026-07-13.md](active/dal-firebase-design-lock-2026-07-13.md) | DAL + Firebase design lock (2026-07-13) |
| [active/dal-phase4-slice-d-dual-domain-sessions.md](active/dal-phase4-slice-d-dual-domain-sessions.md) | Phase 4 Slice D — prep∥timeline concurrent sessions (before Phase 5) |
| [active/dal-pre-ship-gates.md](active/dal-pre-ship-gates.md) | DAL mechanical gates (inventory, persistence lint, Phase 3 deploy ack) — **read before DAL hot-path ships** |
| [active/multi-user-fork-industrial-and-auto.md](active/multi-user-fork-industrial-and-auto.md) | **NEXT** — H0 testing → bulletproof multi-user → auto fork |
| [active/bulletproof-multiuser-live-editors-2026-07-18.md](active/bulletproof-multiuser-live-editors-2026-07-18.md) | Process depth for live-sync harden (testing + fix approach) |
| [active/pre-ship-pipeline-expansion-2026-07-18.md](active/pre-ship-pipeline-expansion-2026-07-18.md) | Future pre-ship gates: RBAC / FCM / truck / financials |
| [PRE_SHIP_PIPELINE.md](PRE_SHIP_PIPELINE.md) | Scoped pre-ship + Bugbot gate (all layers) |
| [MILESTONE_NOW.md](MILESTONE_NOW.md) | Milestone-now **full protocol** (the root `../../MILESTONE_NOW.md` is the director's quick card that points here) |

**Intentional pairs (same truth, different job):** `FRAGILE_ZONES` = checklist; `ARCHITECTURE` = explanation; `EQUIPMENT_MODEL` = how gear works on projects. Link, do not copy.

---

## Where to put new documentation

**AI rule:** Every new or moved doc goes in **one** drawer. Link from elsewhere; do not copy checklists or long explanations.

| If the content is… | Put it in… | Examples |
|--------------------|------------|----------|
| **Urgent / in-flight campaign** | [active/](active/) | Recovery, production blockers |
| **Backlog, shipped checklist, feature plan** | [topics/](topics/) + one row in [Project_TODO.md](Project_TODO.md) | logistics-warehouse, notifications, [pre-beta-hardening.md](topics/pre-beta-hardening.md) (final debug sweeps) |
| **Finished campaign or obsolete plan** | [archive/](archive/) + stub at old path if moved | rbac-event-access-plan |
| **“Don’t break this” pre-flight** | [FRAGILE_ZONES.md](FRAGILE_ZONES.md) quick table + link to detail | Triangle, boot pipeline |
| **How a domain works (canonical model)** | New or existing **stable** file in `docs/ai/` + row in stable table above | `EQUIPMENT_MODEL.md` |
| **Deep trap / build / pipeline explanation** | [ARCHITECTURE.md](ARCHITECTURE.md) | LogicPayload, Matryoshka traps |
| **Magic strings, flags** | [GLOSSARY.md](GLOSSARY.md) — stub only, link to model doc | `[BULK]`, formula flags |
| **JSON / sheet shapes** | [SCHEMA.md](SCHEMA.md) | ProjectAsset fields |
| **UI structure rules** | [UI_DOCTRINE.md](UI_DOCTRINE.md) | Buttons, modals |
| **Deploy / rollback** | [DEPLOY_AND_ROLLBACK.md](DEPLOY_AND_ROLLBACK.md) · [PRE_SHIP_PIPELINE.md](PRE_SHIP_PIPELINE.md) | milestone.js · pre-ship.js |
| **Incident learned the hard way** | [FRAGILE_ZONES.md](FRAGILE_ZONES.md) incident log — **director approval only** | Black screen postmortem |

**When expanding the system:** add stable reference docs to the table in this README and one task-routing line in [AI_DOCTRINE.md](../../AI_DOCTRINE.md). Add topic backlogs under `topics/` only for **work remaining**.

**Never:** duplicate a full checklist in `Project_TODO.md`; create a second canonical home for the same fact; add equipment-only signposts in `topics/README` (point to this section instead).

---

## Operational logs (repo root — not doctrine)

| File | Purpose |
|------|---------|
| `RELEASES.md` | GAS production milestones (auto-updated) |
| `WORKS_LOG.md` | Git "this works" saves (auto-updated) |
| `MILESTONE_NOW.md` (repo root) | Director **quick card** → links to the full protocol at [docs/ai/MILESTONE_NOW.md](MILESTONE_NOW.md) |

---

## Fail-safes (summary)

- **One canonical home** per fact — other files link only.
- **Duplicate, same meaning:** merge silently; stub old path.
- **Contradiction:** ask director before changing either source.
- **Hygiene:** update active/topic/index when completing work; **"hygiene sweep"** (alias **"doc hygiene"**) = full doc pass — **report first, OK go to apply** ([AI_DOCTRINE.md](../../AI_DOCTRINE.md) Rule 4c).
