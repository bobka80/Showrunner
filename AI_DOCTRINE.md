# AI Knowledge Base & Doctrine

Welcome to the ShowRider / SM Showrunner AI Knowledge Base. Before performing any code adjustments or bug hunting, **you must read the documents linked below** to understand the system architecture, state management, and terminology.

This doctrine applies to **any AI agent** working in this repository (Cursor, Claude, Gemini, etc.).

---

## The AI Doctrine (Mandatory Execution Rules)

1. **Autonomously Maintain the Knowledge Base:** If you change the structure of a JSON object, alter an architectural pipeline, or introduce a new magic string/system flag, you MUST proactively update the corresponding file in `docs/ai/` (e.g., `SCHEMA.md`, `ARCHITECTURE.md`, `GLOSSARY.md`, `FRAGILE_ZONES.md`) during that same session. Do not wait for the user to ask.

2. **Autonomously Maintain the To-Do List:** When you complete a task listed in `docs/ai/Project_TODO.md`, you MUST remove or check off that task in the same session.

3. **Document Brainstorming:** If you agree on a new feature or architectural direction during a brainstorming session, you MUST add it as an action item in `docs/ai/Project_TODO.md` before the session ends.

4. **The Brainstorming Phase Lockout:** If the user mentions **"brainstorm"**, **"brainstorming"**, **"planning mode"**, **"we're planning"**, **"don't code"**, or similar phrasing, you enter a strict **No-Code Lockout**. You must stop writing and editing code entirely. You are restricted to chatting and planning ONLY. You cannot write or edit code until the user explicitly commands **"OK go"**, **"OK do it"**, or **"OK do the code"**. If you believe a code edit is necessary during this phase, you MUST ask for explicit approval first. During brainstorm, do NOT treat casual ideas as implementation requests.

5. **Plain-Language Handoff After Fixes:** After any bug fix or feature change, you MUST tell the director (in plain language, no jargon required):
   - What was wrong
   - What you changed (conceptually, not file-by-file unless helpful)
   - **How to test it** — numbered steps they can follow in the UI
   - What to report back if it still fails
   - **Ask to document:** *"Do you want me to add this to the Incident Log in FRAGILE_ZONES.md so we don't hit the same break again?"* — write only if they say yes

6. **Fragile-Zone Disclosure Before Edits:** Before editing any area listed in `docs/ai/FRAGILE_ZONES.md`, you MUST state in plain language which zone you are touching and what could break if the change goes wrong. Wait for approval if the user is in a cautious or brainstorm-adjacent mode.

Failure to read the documents below or adhere to this Doctrine will result in broken logic. This application uses an advanced distributed state machine, optimistic healing engines, and a specific compiler strategy for Google Apps Script.

---

## Director Context (Read First for Workflow)

The project owner is a **Software Director**, not a developer. They do not write or surgically edit code. They provide observations, console errors, and product direction. **You** own diagnosis, implementation, and documentation.

Full workflow: **[Director Workflow](docs/ai/DIRECTOR_WORKFLOW.md)**

Pre-change checklist for dangerous areas: **[Fragile Zones](docs/ai/FRAGILE_ZONES.md)**

Deep engineering rules (30-table model, audit, financials prep): **[Engineering Rules](docs/ai/ENGINEERING_RULES.md)**

---

## Required Reading

| Document | Purpose |
|----------|---------|
| [SCHEMA.md](docs/ai/SCHEMA.md) | JSON shapes: Vault Assets, Project Assets, Readiness State, roles |
| [GLOSSARY.md](docs/ai/GLOSSARY.md) | Magic strings (`Standalone`, `[SHORT]`, `Auto-Container`, CLI patterns) |
| [ARCHITECTURE.md](docs/ai/ARCHITECTURE.md) | Optimistic healing, formula engine, build pipeline, Drive sync, RBAC |
| [FILE_MAP.md](docs/ai/FILE_MAP.md) | Index of all `0X_...html` components and `@INDEX:` markers |
| [File_Splitting_Guide.md](docs/ai/File_Splitting_Guide.md) | Protocol for chopping large UI files safely |
| [Project_TODO.md](docs/ai/Project_TODO.md) | Master feature roadmap — maintain per Doctrine rules 2 and 3 |
| [DEPLOY_AND_ROLLBACK.md](docs/ai/DEPLOY_AND_ROLLBACK.md) | Two-layer saves: Git "This works" vs Apps Script milestones |
| [MILESTONE_NOW.md](docs/ai/MILESTONE_NOW.md) | **Milestone now** — production snapshot before new work |

---

## Key System Rules

1. **The 1MB HTML Workaround:** All frontend JavaScript must live inside inline `<script>` tags within root `.html` files. The `build.js` compiler extracts them into `dist/` to bypass Google Apps Script's 1MB limit. **Do not create separate frontend `.js` files.**

2. **State Mutability:** The global `currentProjectAssets` array is the ultimate source of truth for project equipment. UI state is driven by this array.

3. **No UID Duplication:** If an asset is logically exploded (burst into multiple units), the `uid` MUST be deleted on clones so the sync engine does not squash them back together.

4. **Deploy Pipeline:** After editing root `.html` files, run `node build.js`, then deploy with `clasp push` (see ARCHITECTURE.md §11). Never edit `dist/` source of truth manually except via the build.

5. **Two-Layer Versioning:** See **[DEPLOY_AND_ROLLBACK.md](docs/ai/DEPLOY_AND_ROLLBACK.md)** and root **`WORKS_LOG.md`** / **`RELEASES.md`**.
   - **"This works"** → `node works-save.js` (Git save, last 50 — **not** production).
   - **"Milestone" / "OK ship"** → `node milestone.js` (Apps Script version + production).
   - **"Milestone now"** → **`milestone.js` FIRST**, then continue with any other instructions in the same message. See **[MILESTONE_NOW.md](docs/ai/MILESTONE_NOW.md)**.
   - **"OK go"** only → `node dev-push.js` (dev test, no save).

---

*Maintained via AI Collaboration — June 2026*
