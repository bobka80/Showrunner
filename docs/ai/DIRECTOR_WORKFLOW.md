# Director Workflow — How the Project Owner Works With AI

**Entry:** [AI_DOCTRINE.md](../../AI_DOCTRINE.md) · **Map:** [README.md](README.md)

This document describes how the **Software Director** (project owner) collaborates with AI agents. The director is **not a developer**. They do not read code, open files, or apply surgical fixes. AI agents own implementation, diagnosis, and documentation updates.

---

## Roles

| Role | Responsibility |
|------|----------------|
| **Director** | Product vision, testing in the UI, reporting what broke, approving plans, saying when to build |
| **AI Agent** | Read docs, find bugs, write code, update `docs/ai/`, explain fixes in plain language |

---

## Two Modes

### Mode 1: Brainstorm

**Triggers:** "brainstorm", "planning mode", "we're planning", "don't code", or similar.

**AI behavior:**
- Discuss ideas, tradeoffs, and questions only
- Do NOT edit code or documentation (except capturing agreed TODO items at end of session)
- Do NOT treat "what if we changed X" as permission to change X
- End with a short bullet plan and: *"Say OK go when you want me to implement."*

**Cost note:** Brainstorm sessions are cheap (mostly conversation). They save money by preventing bad implementation attempts.

### Mode 1b: Summarize

**Trigger:** Director says **"summarize"** (or asks you to summarize your understanding and wait).

**AI behavior:**
- Restate requirements in plain language (bullets or short sections).
- **Do not** edit code, run milestones, or change documentation.
- End with an explicit wait: director must approve before work starts (**OK go**, **yes**, **go**, etc.).

### Mode 1c: Hygiene sweep

**Trigger:** Director says **"hygiene sweep"** (alias: **"doc hygiene"**).

**AI behavior:**
- Audit `docs/ai/` (+ root doctrine cross-checks vs `RELEASES.md`) for consistency, stale TODOs, and contradictions.
- **Do not** edit code, run milestones, or change any markdown during the sweep.
- Run one coherent pass (mechanical grep/scan OK; **do not** split into parallel sub-agents per folder — cross-drawer contradictions are the point).
- Deliver a **sweep report** with: **(a) proposed doc fixes**, **(b) contradictions needing director pick**, **(c) TODO/index gaps**, **(d) optional all-clear notes**.
- End with: *"Say OK go to apply proposed doc fixes (and any contradiction resolutions you confirmed)."*
- **After OK go only:** apply approved doc edits; still no feature code unless the director starts a separate build request.

| Mode | Trigger | Agent does | Agent does NOT (until OK go) |
|------|---------|------------|------------------------------|
| **Summarize** | "summarize" | Restate upcoming work | Code, docs, deploy |
| **Hygiene sweep** | "hygiene sweep" / "doc hygiene" | Sweep + report | Code, deploy, doc edits |
| **Create repo mix** | "create repo mix" / "create repomix" | Run pack → give drag-drop paths | App code edits (unless you also say OK go) |

---

### Create repo mix (Claude / quote.ai project pack)

**Triggers:** **"create repo mix"**, **"create repomix"**, **"repo mix"** (dictation may hear "repo mix" / "repomix" / "repo mix").

**AI behavior:**
1. Run **`node create-repomix.js`** immediately (no **OK go** required — this is tooling, not app code).
2. Reply with the **full Windows paths** to drag into your **quote.ai / Claude project knowledge** tab:
   - **Primary:** `claude-pack/repomix-output.md` (~1M tokens)
   - **Optional:** `claude-pack/instructions.md`
3. If upload fails on size, re-run with **`node create-repomix.js --split 2mb`** and list all part files.
4. Plain-language: what the file contains, that packing is free (local), and that **every GAS milestone** also refreshes this file automatically (see [CLAUDE_PACK.md](CLAUDE_PACK.md)).

**Director:** Open File Explorer → `claude-pack` folder in the repo → drag `repomix-output.md` into the project tab. You do not run terminal commands.

See [CLAUDE_PACK.md](CLAUDE_PACK.md).

---

### Mode 2: Build

**Triggers:** "OK go", "OK do it", "OK do the code", "fix this now", or a clear bug report expecting a fix.

**AI behavior:**
1. Read `AI_DOCTRINE.md`, then the relevant **drawer** (`docs/ai/active/` or `docs/ai/topics/<name>.md`), and `FRAGILE_ZONES.md` if the task touches equipment, formulas, sync, containers, or build pipeline
2. State which fragile zones apply (plain language)
3. Make the smallest correct change
4. Update docs if behavior or schema changed
5. **`node build.js`** then **`node milestone.js "<note>"`** — ship to production automatically (see [DEPLOY_AND_ROLLBACK.md](DEPLOY_AND_ROLLBACK.md)). Report the new **GAS version** (e.g. v411). Do **not** ask the director to deploy.
6. Give the director a **test checklist** on **web.app** (below)

---

## Bug Report Template (Director → AI)

Copy and fill in when something breaks:

```
WHAT I WAS TRYING TO DO:


WHAT I EXPECTED:


WHAT HAPPENED INSTEAD:


CONSOLE ERRORS (F12 → Console, paste red text — or write "don't know how"):


WHEN IT STARTED (always broken / started yesterday / after we changed something):


MY GUESS (optional):

```

The director does not need to name files, functions, or technical causes. Observations are enough.

---

## What AI Must Return After a Fix

Every build-mode fix should end with:

1. **What was wrong** — one or two sentences, no jargon
2. **What we changed** — conceptually ("fixed how equipment saves when…")
3. **How to test** — numbered steps in the UI, e.g.:
   - Open a project
   - Add one fixture via the search bar
   - Click Save
   - You should see X; if you still see Y, tell me
4. **What to watch for** — optional one-line warning if a fragile zone was involved
5. **Documentation offer (mandatory):** The AI MUST ask:

   > *"Do you want me to add this to the Incident Log in `FRAGILE_ZONES.md` so we don't hit the same break again?"*

   Only write to `FRAGILE_ZONES.md` if the director says **yes**. Never auto-append without approval.

---

## Bug Reports, Displeasure & Suggestions → Incident Log

When the director reports a bug, expresses displeasure ("this keeps breaking"), or suggests a guard ("never let AI touch X again"), that is a **candidate for the Incident Log** in [FRAGILE_ZONES.md](FRAGILE_ZONES.md).

| Director says | AI should |
|---------------|-----------|
| Bug report (before or after fix) | Note which fragile zone applies; after fix, **ask** to log it |
| Displeasure / "this broke again" | Treat as high priority; after resolution, **ask** to log lesson |
| Suggestion ("document that formulas are bidirectional") | If agreed in brainstorm or build, **ask** whether to add to FRAGILE_ZONES or ARCHITECTURE |

The Incident Log is not a diary — each entry is one **lesson** so future AI sessions avoid repeating the mistake.

**Director does not write the log.** AI drafts the entry; director approves with yes/no.

---

## What the Director Never Needs to Do

- Open or edit source files
- Run terminal commands (unless they choose to — AI can run build/deploy when asked)
- Understand UIDs, containerization, or the Triangle of Truth
- Decide which file contains a bug
- Manually delete monolith files after a file split — AI proposes; director tests; AI cleans up after confirmation

---

## Cost-Conscious Workflow (Hobby Budget)

1. **Brainstorm first** for new features — agree scope before coding
2. **One clear task per "OK go"** — not "fix calendar and rebuild financials" in one session
3. **Default to Auto model in Cursor** for routine fixes; escalate to Sonnet only for fragile zones (see `FRAGILE_ZONES.md`)
4. **Avoid Opus** unless stuck after Sonnet
5. Set a **monthly spend cap** in Cursor billing to prevent surprise overages

---

## Cursor IDE (rules, agents, review gates)

Full reference: **[CURSOR_WORKFLOW.md](CURSOR_WORKFLOW.md)**.

| Piece | Location |
|-------|----------|
| Always-on rule | `.cursor/rules/showrunner-core.mdc` |
| File-scoped rules | `mobile-pwa-hosting`, `equipment-fragile`, `session-bridge` in `.cursor/rules/` |
| Terminal auto-approve | `.cursor/permissions.json` (milestone, build, clasp) |

**Optional gates** (not every session):

| When | Director says |
|------|----------------|
| Large or risky diff before merge | **"Bugbot review on uncommitted changes"** |
| Auth / session / `host-boot.js` | **"Security review before ship"** |
| PWA UI check | **"Verify on web.app with the browser tool"** |

Session routine is unchanged: **brainstorm → summarize → OK go** · one task per OK go · name the drawer.

---

## Escalation Guide (For the Director)

You do not pick models — but you can say:

| Situation | Tell the AI |
|-----------|-------------|
| Simple UI / "button doesn't work" | "Fix this" (Auto is fine) |
| Equipment, formulas, save/sync, containers | "This might be fragile — read FRAGILE_ZONES first" |
| Same bug after two fix attempts | "We're stuck — use heavier reasoning" |

---

## Brainstorm → Build Handoff

At the end of a good brainstorm, the AI should leave:

- A short **agreed plan** (bullets)
- Any new items → add to the relevant **topic file** under `docs/ai/topics/` and one index row in `Project_TODO.md`
- Explicit wait: **"Say OK go to start implementation."**

The director approves by saying **OK go**. Only then does coding begin.

---

## Milestone before new work

When starting a **new major update** on top of tested production, the director can say **"Milestone now"** (optionally with follow-up instructions in the same message).

**AI behavior:**

1. Run **`node milestone.js`** first — production Apps Script snapshot (see [MILESTONE_NOW.md](MILESTONE_NOW.md)).
2. **Only after** milestone succeeds, proceed with build/fix work from the rest of the message.
3. If milestone fails (e.g. missing `deploy-config.json`), stop and explain the blocker — do not start the new feature until fixed or the director explicitly says to skip.

**Examples**

| Director says | AI does |
|---------------|---------|
| *Milestone now* | Milestone only |
| *Milestone now — then build the Database tab* | Milestone → then implement Database tab |
| *Milestone* / *OK ship* | Milestone only (same as before) |
| *OK go* / *OK do it* | AI implements, then **auto-runs `node milestone.js`** on completion (production snapshot → web.app test). Not "dev-only". |

Quick reference for the director: root **[MILESTONE_NOW.md](../../MILESTONE_NOW.md)**.
