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
| [FRAGILE_ZONES.md](FRAGILE_ZONES.md) | Pre-flight checklist before dangerous edits |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Deep traps, build pipeline, RBAC boot |
| [SCHEMA.md](SCHEMA.md) | JSON shapes |
| [GLOSSARY.md](GLOSSARY.md) | Magic strings |
| [FILE_MAP.md](FILE_MAP.md) | All modules, `@INDEX:` markers, wiring status |
| [MOBILE_CREW_UX.md](MOBILE_CREW_UX.md) | Mobile crew UI reference (shipped) |
| [ENGINEERING_RULES.md](ENGINEERING_RULES.md) | 30-table model, audit, financials prep |
| [UI_DOCTRINE.md](UI_DOCTRINE.md) | Structural UI rules |
| [File_Splitting_Guide.md](File_Splitting_Guide.md) | Safe file splits |
| [DEPLOY_AND_ROLLBACK.md](DEPLOY_AND_ROLLBACK.md) | This works / milestone / rollback |
| [MILESTONE_NOW.md](MILESTONE_NOW.md) | Milestone-now protocol |

**Intentional pairs (same truth, different job):** `FRAGILE_ZONES` = checklist; `ARCHITECTURE` = explanation. Link, do not copy.

---

## Operational logs (repo root — not doctrine)

| File | Purpose |
|------|---------|
| `RELEASES.md` | GAS production milestones (auto-updated) |
| `WORKS_LOG.md` | Git "this works" saves (auto-updated) |
| `MILESTONE_NOW.md` | Director quick card → full protocol in `MILESTONE_NOW.md` here |

---

## Fail-safes (summary)

- **One canonical home** per fact — other files link only.
- **Duplicate, same meaning:** merge silently; stub old path.
- **Contradiction:** ask director before changing either source.
- **Hygiene:** update active/topic/index when completing work; `"doc hygiene"` = full pass.
