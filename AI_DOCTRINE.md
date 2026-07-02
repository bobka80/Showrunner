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

## Task routing (read before you code or advise)

| If the task touches… | Read first (in order) |
|----------------------|------------------------|
| Project Assets, packing, checkout, cables, containers, RFID/QR | [EQUIPMENT_MODEL.md](docs/ai/EQUIPMENT_MODEL.md) → [FRAGILE_ZONES.md](docs/ai/FRAGILE_ZONES.md) |
| Formula / CLI / equipment list sync | [FRAGILE_ZONES.md](docs/ai/FRAGILE_ZONES.md) (Triangle of Truth) |
| Deploy, mobile black screen, session | [FRAGILE_ZONES.md](docs/ai/FRAGILE_ZONES.md) (boot) → [DEPLOY_AND_ROLLBACK.md](docs/ai/DEPLOY_AND_ROLLBACK.md) |
| Warehouse gate, guns, station profile, PA concurrency | [topics/logistics-warehouse.md](docs/ai/topics/logistics-warehouse.md) + [EQUIPMENT_MODEL.md](docs/ai/EQUIPMENT_MODEL.md) |

The director may dictate by voice — match **terminology lock** in [EQUIPMENT_MODEL.md](docs/ai/EQUIPMENT_MODEL.md) when searching code.

---

## The AI Doctrine (Mandatory Execution Rules)

1. **Autonomously Maintain the Knowledge Base:** If you change JSON shape, architecture, magic strings, or **Drive folder IDs / live file names**, update the matching file in `docs/ai/` (`SCHEMA.md`, `ARCHITECTURE.md`, `GLOSSARY.md`, `FRAGILE_ZONES.md`, **`DRIVE_LAYOUT.md`**) in the same session. **This also fires when:**
   - **New file / module** (any `.html`, `.js`, folder, or hosting asset) → add a row to **`FILE_MAP.md`** (and wire `Index.html` if it is a compiled module).
   - **New build / deploy / distribution tooling or workflow** (e.g. a new `node *.js` script, an APK/hosting pipeline, a new `?action=` endpoint, an install page, a Spark/plan workaround) → document it in **`FILE_MAP.md`** + the relevant **topic** file, including the exact command(s) to run.
   - **Config constant that changes behavior** (timeouts, idle limits, feature flags) → record its name, file, and current value in the owning topic file.
   - **Not sure it "counts"?** Default to documenting. It is never wrong to add a `FILE_MAP.md` row or a topic line for something you just built.

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
   - **Every build session:** update relevant active/topic file + index row when you finish work. **When you edit any doc that carries a `Last swept:` / `Production:` header, bump that header** to today's date and the current `RELEASES.md` GAS version — do not leave a stale header above content you just changed.
   - **Status table is singular:** `Project_TODO.md` is the **only** status table. `topics/README.md` is a link directory — never re-add a status column there.
   - **Trigger "doc hygiene":** full pass on `active/`, `topics/`, `Project_TODO.md` index, and hub links; move finished campaigns to `archive/`; align all GAS version + sweep-date mentions with `RELEASES.md`.
   - **Close campaign:** when director confirms done, move `active/*.md` → `archive/` and update index.

10. **Drawer placement (mandatory):** When creating or moving documentation, follow [Where to put new documentation](docs/ai/README.md#where-to-put-new-documentation). One canonical home per fact; topics = backlog only; stable reference = how things work. Update `AI_DOCTRINE.md` task routing when adding a new stable domain doc.

11. **Active Campaign Lifecycle (autonomous, mandatory):** Every campaign in `docs/ai/active/` has a checklist. You **own** driving it to completion:
    - **Tick as you ship:** the moment a piece of work lands, flip its box `[ ]` → `[x]` in the active file (and the matching topic file) in the **same session** — do not let the checklist lag behind the code.
    - **Announce completion + ask what's next:** when **every** box in an active campaign is checked, **stop and tell the director** the campaign is complete, and **ask what to do next** — proposing 2–3 concrete candidate next steps drawn from that campaign's remaining backlog and the [Project_TODO.md](docs/ai/Project_TODO.md) topics (e.g. the next phase, or a related topic). Do not silently start new work.
    - **Archive on the director's go:** once the director confirms the campaign is done, move its `active/*.md` file → `docs/ai/archive/`, update the **Active campaigns** row in `Project_TODO.md` (mark closed), and carry any still-open items back to the owning topic file so nothing is lost.
    - **Keep the drawer honest:** the files present in `active/` must always reflect what is genuinely in flight — no completed campaigns lingering, no in-flight work missing a file.

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
| [EQUIPMENT_MODEL.md](docs/ai/EQUIPMENT_MODEL.md) | Bulk vs unique, Matryoshka, two packing engines — **before PA/warehouse work** |
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
   - **After every completed implementation** (any build session after **"OK go"** / fix / feature): AI runs **`node build.js`** (if needed) then **`node milestone.js "<note>"`** — **automatically**. Do **not** tell the director to deploy. Production **GAS version** (e.g. v411) is required for **web.app** and mobile field testing.
   - **Always pass a descriptive `<note>`** to `milestone.js` (what shipped, not the word "Milestone") so `RELEASES.md` stays a usable changelog.
   - **"This works"** → `works-save.js` (extra Git checkpoint during long dev — optional, does not replace milestone)
   - **"Milestone" / "OK ship" / "Milestone now"** → `milestone.js` (same script; director may say these explicitly before or instead of other work)
   - **Brainstorming / docs-only** → no milestone unless code shipped

6. **Station APK releases (native gun app):** The Android app (`station-android/`) is versioned and shipped **separately** from GAS — `node milestone.js` does **not** touch it. When you build/publish it:
   - **Always** run `node build-station-apk.js "<what changed>" …` **with release notes** (the script fails without them), then `node deploy-hosting.js`.
   - `versionCode` auto-increments and `versionName` bumps each build; the notes + build timestamp + rolling history land in `station-manifest.json` and render on the `/station-app` download page. The director reads app state **there**, not from chat — so notes must be plain and field-readable. Canonical process: [station-android/README.md](station-android/README.md) → *Versioning & changelog*.

---

*Maintained via AI Collaboration — June 2026*
