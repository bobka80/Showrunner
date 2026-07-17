# AI Knowledge Base & Doctrine

Welcome to the ShowRider / SM Showrunner AI Knowledge Base. Before performing any code adjustments or bug hunting, **read this file**, then open the **drawer** for your task (see [docs/ai/README.md](docs/ai/README.md)).

This doctrine applies to **any AI agent** in this repository (Cursor, Claude, etc.). Start at root **[AGENTS.md](AGENTS.md)** if your tool loads that automatically — it summarizes ship, **pre-ship**, and the **Bugbot gate**; full rules are **Rule 8** below and [PRE_SHIP_PIPELINE.md](docs/ai/PRE_SHIP_PIPELINE.md).

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
| DAL, Firebase session fork, data router | [active/dal-firebase-design-lock-2026-07-13.md](docs/ai/active/dal-firebase-design-lock-2026-07-13.md) → [active/data-access-layer.md](docs/ai/active/data-access-layer.md) → [active/dal-pre-ship-gates.md](docs/ai/active/dal-pre-ship-gates.md) · **session banners / dual-domain UI:** [FRAGILE_ZONES.md](docs/ai/FRAGILE_ZONES.md) § DAL prep/timeline session UI |
| Deploy, mobile black screen, session | [FRAGILE_ZONES.md](docs/ai/FRAGILE_ZONES.md) (boot) → [DEPLOY_AND_ROLLBACK.md](docs/ai/DEPLOY_AND_ROLLBACK.md) → [PRE_SHIP_PIPELINE.md](docs/ai/PRE_SHIP_PIPELINE.md) |
| Phone QR scan panel, shell camera, `host-boot.js` mobile paths | [FRAGILE_ZONES.md](docs/ai/FRAGILE_ZONES.md) § Two-layer shell bridge + § Mobile QR handoff |
| Station gun scans, `RfidManager`, `showrunnerStationDeliverScan` | [FRAGILE_ZONES.md](docs/ai/FRAGILE_ZONES.md) § Two-layer shell bridge + § Station RFID delivery |
| Cursor IDE session, rules, review gates | [CURSOR_WORKFLOW.md](docs/ai/CURSOR_WORKFLOW.md) |
| Warehouse gate, guns, station profile, PA concurrency | [topics/logistics-warehouse.md](docs/ai/topics/logistics-warehouse.md) + [EQUIPMENT_MODEL.md](docs/ai/EQUIPMENT_MODEL.md) |
| Pre-beta / full-app debug sweeps (before real users) | [topics/pre-beta-hardening.md](docs/ai/topics/pre-beta-hardening.md) — **runs last**; Freeze → **Intent survey** → purity → registry → S0/S1 RCs |

The director may dictate by voice — match **terminology lock** in [EQUIPMENT_MODEL.md](docs/ai/EQUIPMENT_MODEL.md) when searching code. See **Rule 12 (dictation mode)** — speech-to-text errors are common; confirm ambiguous terms before acting.

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

4c. **Hygiene sweep (docs report-first):** When the director says **"hygiene sweep"** (alias: **"doc hygiene"**), audit the documentation corpus for consistency and stale TODOs — **report only until approved**. **Do not** edit application code, run `milestone.js`, or change any markdown until the director approves the sweep report (**OK go**, **go**, etc.). **Scope:** everything under `docs/ai/` (active, topics, archive index rows, hub links), plus root `AI_DOCTRINE.md`, `AGENTS.md`, and cross-checks against `RELEASES.md` / `WORKS_LOG.md` headers. **How to run (one coherent pass — do not split into parallel sub-agents per folder; contradictions span drawers):**
   1. **Mechanical scan** (grep or a single focused sub-agent is OK): hunt objective mismatches — GAS version / `Production:` / `Last swept:` headers vs `RELEASES.md`; shipped work still `[ ]`; finished campaigns still in `active/`; stale URGENT rows; duplicate status one-liners; same fact stated two ways.
   2. **Read flagged files** and build **one sweep report** with these sections: **(a) Proposed doc fixes** (unambiguous stale items — list file + change, do not apply yet); **(b) Contradictions** (two docs disagree — state both sides, recommend which wins, **require director pick**); **(c) TODO / index gaps** (index rows out of sync with topic/active files); **(d) Already OK** (optional brief note). End with: *"Say OK go to apply proposed doc fixes (and any contradiction resolutions you confirmed)."*
   3. **After OK go only:** apply the approved doc edits; re-run a quick sanity check; give a one-line "sweep applied" summary. Still **no feature code** unless the director starts a separate build request.

5. **Structural UI Compliance:** Follow **[UI_DOCTRINE.md](docs/ai/UI_DOCTRINE.md)**. Reuse `Styles.html` classes.

6. **Plain-Language Handoff After Fixes:** What was wrong, what changed, how to test, what to report if it fails. Ask before adding to FRAGILE_ZONES incident log.

7. **Fragile-Zone Disclosure:** Before editing [FRAGILE_ZONES.md](docs/ai/FRAGILE_ZONES.md) areas, state risk in plain language.

8. **Single Source of Truth & Fail-Safes:**
   - Each fact has **one canonical file**. Other docs **link**; they do not re-copy checklists or status.
   - **Same fact, two places, same meaning:** consolidate to canonical home; leave a one-line stub at the old path if needed.
   - **Contradiction** (opposite instructions, conflicting status): **stop and ask the director** which wins before editing or deleting.
   - **Unambiguous stale doc** (e.g. shipped step still unchecked): fix to match production/`RELEASES.md`.

9. **Doc Hygiene (autonomous between sweeps):**
   - **Every build session:** update relevant active/topic file + index row when you finish work. **When you edit any doc that carries a `Last swept:` / `Production:` header, bump that header** to today's date and the current `RELEASES.md` GAS version — do not leave a stale header above content you just changed.
   - **Status table is singular:** `Project_TODO.md` is the **only** status table. `topics/README.md` is a link directory — never re-add a status column there.
   - **Full corpus pass:** director trigger **"hygiene sweep"** — see **Rule 4c** (report-first; no doc edits until **OK go**). Alias **"doc hygiene"** means the same thing.
   - **Close campaign:** when director confirms done, move `active/*.md` → `archive/` and update index.

10. **Drawer placement (mandatory):** When creating or moving documentation, follow [Where to put new documentation](docs/ai/README.md#where-to-put-new-documentation). One canonical home per fact; topics = backlog only; stable reference = how things work. Update `AI_DOCTRINE.md` task routing when adding a new stable domain doc.

11. **Active Campaign Lifecycle (autonomous, mandatory):** Every campaign in `docs/ai/active/` has a checklist. You **own** driving it to completion:
    - **Tick as you ship:** the moment a piece of work lands, flip its box `[ ]` → `[x]` in the active file (and the matching topic file) in the **same session** — do not let the checklist lag behind the code.
    - **Announce completion + ask what's next:** when **every** box in an active campaign is checked, **stop and tell the director** the campaign is complete, and **ask what to do next** — proposing 2–3 concrete candidate next steps drawn from that campaign's remaining backlog and the [Project_TODO.md](docs/ai/Project_TODO.md) topics (e.g. the next phase, or a related topic). Do not silently start new work.
    - **Archive on the director's go:** once the director confirms the campaign is done, move its `active/*.md` file → `docs/ai/archive/`, update the **Active campaigns** row in `Project_TODO.md` (mark closed), and carry any still-open items back to the owning topic file so nothing is lost.
    - **Keep the drawer honest:** the files present in `active/` must always reflect what is genuinely in flight — no completed campaigns lingering, no in-flight work missing a file.

12. **Director dictation mode (speech-to-text):** The director often uses **voice dictation** (not typed input). Transcription **frequently mishears** words — homophones, product names, acronyms, and near-miss spellings are common (e.g. **LFID → RFID**, **TLS → TSL**, **Android/desktop** swapped, file names garbled).

    **AI must:**
    - Treat odd spellings, surprise terminology, or ambiguous requests as **possible dictation errors** before searching code or changing docs.
    - **Infer from context** when the intent is clear (warehouse RFID gate vs a typo; TSL gun vs TLS certificate).
    - **Ask briefly** when the wrong interpretation would waste a long debug loop or touch fragile code — one clarifying question beats a wrong assumption.
    - When the director confirms a correction, use the **correct term** in docs and commits; do not preserve the mis-transcription as canonical naming.

    This applies in **every mode** (brainstorm, summarize, build) — not only when the director mentions dictation.

---

## Director Context

The project owner is a **Software Director**, not a developer. **You** own diagnosis, implementation, and documentation.

| Doc | Purpose |
|-----|---------|
| [Director Workflow](docs/ai/DIRECTOR_WORKFLOW.md) | Brainstorm · summarize · hygiene sweep vs build |
| [Cursor Workflow](docs/ai/CURSOR_WORKFLOW.md) | Cursor rules, review gates, session routine |
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
| [PRE_SHIP_PIPELINE.md](docs/ai/PRE_SHIP_PIPELINE.md) | Scoped pre-ship gates before every ship |
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
   - **After every completed implementation** (any build session after **"OK go"** / fix / feature): AI runs **`node milestone.js "<note>"`** — **automatically** (pre-ship GAS gates run inside). Do **not** tell the director to deploy. Production **GAS version** (e.g. v411) is required for **web.app** and mobile field testing.
   - **Always pass a descriptive `<note>`** to `milestone.js` (what shipped, not the word "Milestone") so `RELEASES.md` stays a usable changelog.
   - **"This works"** → `works-save.js` (extra Git checkpoint during long dev — optional, does not replace milestone)
   - **"Milestone" / "OK ship" / "Milestone now"** → `milestone.js` (same script; director may say these explicitly before or instead of other work)
   - **Brainstorming / docs-only** → no milestone unless code shipped

6. **Station APK releases (native gun app):** The Android app (`station-android/`) is versioned and shipped **separately** from GAS — `node milestone.js` does **not** touch it. When you build/publish it:
   - **Always** run `node build-station-apk.js "<what changed>" …` **with release notes** (the script fails without them), then `node deploy-hosting.js`.
   - `versionCode` auto-increments and `versionName` bumps each build; the notes + build timestamp + rolling history land in `station-manifest.json` and render on the `/station-app` download page. The director reads app state **there**, not from chat — so notes must be plain and field-readable. Canonical process: [station-android/README.md](station-android/README.md) → *Versioning & changelog*.

7. **Hosting-shell cache-buster:** WebViews (and browsers) hard-cache `push-hosting/public/host-boot.js`. **Any** edit to `host-boot.js` **must** bump the `?v=` query on its `<script>` tag in `push-hosting/public/index.html` in the same change, then `node deploy-hosting.js` — otherwise devices keep running the old shell (this caused scans/settings to silently no-op). Keep the `?v=` aligned to the shipped GAS version for traceability.

8. **Pre-ship + Bugbot gate (mandatory for AI ships):** [PRE_SHIP_PIPELINE.md](docs/ai/PRE_SHIP_PIPELINE.md)
   - **Mechanical pre-ship** runs inside every ship script (`milestone.js`, `deploy-hosting.js`, `build-station-desktop.js`, `build-station-apk.js`).
   - **Bugbot** is a **Cursor subagent** — not Node. Policy in `pre-ship/bugbot-policy.js` decides `skip` | `recommend` | `require`.
   - **When `require`:** AI **must** launch Bugbot (`subagent_type: bugbot`, `Diff: branch changes`) **before** the ship script completes. Use `Custom Instructions` from `pre-ship/last-report.json` → `bugbot.customInstructions`. Fix **Critical/High** findings or get director override; then re-run ship with `PRE_SHIP_BUGBOT_OK=1`.
   - **When `recommend`:** AI runs Bugbot if the diff is non-trivial; may ship without if mechanical GREEN and change is tiny — note in handoff.
   - **When `skip`:** Do not spend tokens on Bugbot (docs-only, cosmetic desktop icon, etc.).
   - **DAL hot paths** (Logistics, PA save, timeline, Operations): mechanical **DAL gates** also run inside gas pre-ship — see [dal-pre-ship-gates.md](docs/ai/active/dal-pre-ship-gates.md). Regenerate client inventory after `google.script.run` changes; Phase 3 delta-only deploy needs `PRE_SHIP_DAL_CONCURRENCY_OK=1`.
   - **AI checks policy early:** `node pre-ship.js --dry-run` or `--bugbot-policy` before coding the ship command.
   - **Never** bypass `BUGBOT REQUIRED` on fragile/multi-layer ships without director saying so explicitly.

---

*Maintained via AI Collaboration — June 2026*
