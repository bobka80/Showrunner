# AI Knowledge Base & Doctrine

Welcome to the ShowRider / SM Showrunner AI Knowledge Base. Before performing any code adjustments or bug hunting, **read this file**, then open the **drawer** for your task (see [docs/ai/README.md](docs/ai/README.md)).

This doctrine applies to **any AI agent** in this repository (Cursor, Claude, etc.). Start at root **[AGENTS.md](AGENTS.md)** if your tool loads that automatically.

---

## One door, many drawers

| Drawer | Path | Director says |
|--------|------|---------------|
| **Map** | [docs/ai/README.md](docs/ai/README.md) | "Where is X?" |
| **Active work** | [docs/ai/active/](docs/ai/active/) | "Active drawer" / current recovery |
| **Topic backlog** | [docs/ai/topics/](docs/ai/topics/) | "Notifications topic" — read **one** file |
| **Roadmap index** | [docs/ai/Project_TODO.md](docs/ai/Project_TODO.md) | Status table only — not full checklists |
| **Archive** | [docs/ai/archive/](docs/ai/archive/) | Historical plans |
| **Stable reference** | See [docs/ai/README.md](docs/ai/README.md) | Architecture, schema, file map |

**Operational logs (machine-written):** root **`RELEASES.md`**, **`WORKS_LOG.md`**.

---

## The AI Doctrine (Mandatory Execution Rules)

1. **Autonomously Maintain the Knowledge Base:** If you change JSON shape, architecture, magic strings, or **Drive folder IDs / live file names**, update the matching file in `docs/ai/` (`SCHEMA.md`, `ARCHITECTURE.md`, `GLOSSARY.md`, `FRAGILE_ZONES.md`, **`DRIVE_LAYOUT.md`**) in the same session.

2. **Autonomously Maintain Work Drawers:** When you complete a task, update the **topic** or **active** file and the one-line status in [Project_TODO.md](docs/ai/Project_TODO.md). Do not duplicate checklists in the index.

3. **Document Brainstorming:** New features → add a topic file (or section) + one index row in `Project_TODO.md` before the session ends.

4. **Brainstorming Phase Lockout:** Triggers: "brainstorm", "planning mode", "don't code", etc. No code until **"OK go"**, **"OK do it"**, or **"OK do the code"**.

4b. **Summarize (understanding only):** When the director says **"summarize"**, restate what you understood in plain language and **wait for explicit approval** before editing code or docs. Do **not** implement, deploy, or update doctrine unless the director approves (e.g. **OK go**, **yes to everything**, **go**). If the director also asks to record a workflow rule, update doctrine **after** that approval.

5. **Structural UI Compliance:** Follow **[UI_DOCTRINE.md](docs/ai/UI_DOCTRINE.md)**. Reuse `Styles.html` classes.

6. **Plain-Language Handoff After Fixes:** What was wrong, what changed, how to test, what to report if it fails. Ask before adding to FRAGILE_ZONES incident log.

7. **Fragile-Zone Disclosure:** Before editing [FRAGILE_ZONES.md](docs/ai/FRAGILE_ZONES.md) areas, state risk in plain language.

8. **Single Source of Truth & Fail-Safes:**
   - Each fact has **one canonical file**. Other docs **link**; they do not re-copy checklists or status.
   - **Same fact, two places, same meaning:** consolidate to canonical home; leave a one-line stub at the old path if needed.
   - **Contradiction** (opposite instructions, conflicting status): **stop and ask the director** which wins before editing or deleting.
   - **Unambiguous stale doc** (e.g. shipped step still unchecked): fix to match production/`RELEASES.md`.

9. **Doc Hygiene (autonomous):**
   - **Every build session:** update relevant active/topic file + index row when you finish work.
   - **Trigger "doc hygiene":** full pass on `active/`, `topics/`, `Project_TODO.md` index, and hub links; move finished campaigns to `archive/`.
   - **Close campaign:** when director confirms done, move `active/*.md` → `archive/` and update index.

---

## Director Context

The project owner is a **Software Director**, not a developer. **You** own diagnosis, implementation, and documentation.

| Doc | Purpose |
|-----|---------|
| [Director Workflow](docs/ai/DIRECTOR_WORKFLOW.md) | Brainstorm vs build |
| [Fragile Zones](docs/ai/FRAGILE_ZONES.md) | Pre-change checklist |
| [Engineering Rules](docs/ai/ENGINEERING_RULES.md) | Deep mandates |
| [UI Doctrine](docs/ai/UI_DOCTRINE.md) | Structural UI |

---

## Required Reading (stable reference)

| Document | Purpose |
|----------|---------|
| [SCHEMA.md](docs/ai/SCHEMA.md) | JSON shapes |
| [GLOSSARY.md](docs/ai/GLOSSARY.md) | Magic strings |
| [ARCHITECTURE.md](docs/ai/ARCHITECTURE.md) | Traps, build pipeline, RBAC |
| [FILE_MAP.md](docs/ai/FILE_MAP.md) | Module index, `@INDEX:` |
| [MOBILE_CREW_UX.md](docs/ai/MOBILE_CREW_UX.md) | Mobile crew reference |
| [File_Splitting_Guide.md](docs/ai/File_Splitting_Guide.md) | Safe file splits |
| [ENGINEERING_RULES.md](docs/ai/ENGINEERING_RULES.md) | 30-table model, audit |
| [UI_DOCTRINE.md](docs/ai/UI_DOCTRINE.md) | Buttons, modals, hubs |
| [DEPLOY_AND_ROLLBACK.md](docs/ai/DEPLOY_AND_ROLLBACK.md) | Two-layer versioning |
| [MILESTONE_NOW.md](docs/ai/MILESTONE_NOW.md) | Milestone-now protocol |
| [FRAGILE_ZONES.md](docs/ai/FRAGILE_ZONES.md) | Dangerous areas |
| [DRIVE_LAYOUT.md](docs/ai/DRIVE_LAYOUT.md) | `STAGE_MASTERS_SYSTEM_ROOT` — folder IDs, live DB names, sync vs backup |
| [DIRECTOR_WORKFLOW.md](docs/ai/DIRECTOR_WORKFLOW.md) | How to work with the director |

**Situational:** read [docs/ai/active/](docs/ai/active/) and the relevant [docs/ai/topics/](docs/ai/topics/) file — not the whole TODO.

---

## Key System Rules

1. **1MB HTML workaround:** Frontend JS in inline `<script>` in root `.html` → `node build.js` → `dist/`. No separate frontend `.js` files.

2. **State:** `currentProjectAssets` is equipment source of truth.

3. **No UID duplication** on burst clones.

4. **Deploy:** Edit source → `node build.js` → deploy. Never hand-edit `dist/` as source of truth.

5. **Two-layer versioning:** [DEPLOY_AND_ROLLBACK.md](docs/ai/DEPLOY_AND_ROLLBACK.md), **`RELEASES.md`**, **`WORKS_LOG.md`**.
   - **After every completed implementation** (any build session after **"OK go"** / fix / feature): AI runs **`node build.js`** (if needed) then **`node milestone.js "<note>"`** — **automatically**. Do **not** tell the director to deploy. Production **GAS version** (e.g. v336) is required for **web.app** and mobile field testing.
   - **"This works"** → `works-save.js` (extra Git checkpoint during long dev — optional, does not replace milestone)
   - **"Milestone" / "OK ship" / "Milestone now"** → `milestone.js` (same script; director may say these explicitly before or instead of other work)
   - **Brainstorming / docs-only** → no milestone unless code shipped

---

*Maintained via AI Collaboration — June 2026*
