# Deploy & Rollback — Two-Layer Versioning

**Entry:** [AI_DOCTRINE.md](../../AI_DOCTRINE.md) · **Map:** [README.md](README.md)

ShowRider uses **two separate buffers**. The director does not run Git or clasp manually — the AI runs scripts when trigger phrases are used.

---

## Layer 1 — "This works" (Git / local — frequent)

**Trigger:** Director says **"This works"** after testing in **developer mode**.

**What happens (automatic via `node works-save.js "note"`):**
1. `node build.js`
2. `git add` + `git commit` (snapshot of project files on disk)
3. New row in root **`WORKS_LOG.md`** (rolling **last 50** entries)

**Does NOT:** Create an Apps Script version or change production URL.

**Rollback:** *"Rollback to last this works"* or *"Rollback to works #5"*  
→ AI checks out that Git commit → `node build.js` → `gas-push-sync` (or `node dev-push.js`) → director retests in dev.

---

## Layer 2 — Milestone (Apps Script / production — rare)

**Trigger:** Director says **"Milestone"**, **"OK ship"**, **"Milestone now"**, or confirms a **major feature / major fix** is ready for production.

**"Milestone now" (before new work):** AI runs **`milestone.js` first**, then continues with any other instructions in the same message (e.g. start a new feature). Full protocol: **[MILESTONE_NOW.md](MILESTONE_NOW.md)**.

**What happens (automatic via `node milestone.js "note"`):**
1. Reads latest GAS version (e.g. 265) — next will be 266
2. `node build.js` + **`gas-push-sync.js`** (full replace of GAS files from `dist/` — removes orphans; plain `clasp push` does not delete removed files)
3. `clasp version "<note>"` — frozen snapshot with your name on Google
4. `clasp deploy` that new version (updates saved production URL if `deploy-config.json` exists; otherwise creates a new deployment and saves the ID)
5. Git commit + row in root **`RELEASES.md`**

**Does NOT:** Run on **"This works"** alone.

**Rollback:** *"Rollback production to last milestone"*  
→ AI redeploys previous GAS version from `RELEASES.md` (code only — **not** Google Sheet data).

---

## Layer 0 — Dev iteration (build sessions)

**Trigger:** **"OK go"** (fix/build session) or any completed implementation the director approved.

**What happens (automatic — AI runs this; director does not):**
1. AI edits source code
2. `node build.js`
3. **`node milestone.js "<note>"`** — production Apps Script version + deploy to web.app
4. AI reports the new **GAS version number** (e.g. **v336**) in the handoff

**Director tests on:** `https://sm-showrunner-97405.web.app` (production), not developer mode, unless the task explicitly says otherwise.

**Do NOT** end a build session with *"you should push the milestone"* — **you** push it.

**Optional mid-session checkpoint:** **"This works"** → `works-save.js` (Git only, no new GAS version). Does not replace the milestone at end of implementation.

---

## Automatic milestone (mandatory)

| When | AI must |
|------|---------|
| Completed implementation (code shipped) | `node build.js` → `node milestone.js "<note>"` |
| Director says **Milestone** / **OK ship** / **Milestone now** | `milestone.js` (now may be first step if starting new work on tested prod) |
| Brainstorming / docs-only | No milestone |
| Milestone command fails | Stop; report blocker — do not pretend work is live |

**Why:** The mobile PWA and field crew test against **production** web.app. Each ship needs a **point GAS version** in `RELEASES.md` for rollback and director communication ("test v336").

## Trigger phrase summary

| Phrase | Layer | Script |
|--------|-------|--------|
| **OK go** (completed implementation) | Production milestone | `build.js` → `milestone.js` (automatic) |
| **Summarize** | Understanding only — no code until approved | Wait for **OK go** / **go** |
| **This works** | Git save only (optional mid-session) | `works-save.js` |
| **Milestone** / **OK ship** | Apps Script production | `milestone.js` |
| **Milestone now** (+ optional follow-up) | Apps Script production **first**, then dev/build | `milestone.js` → then other work |
| **Rollback to last this works** | Git | `rollback-works.js` |
| **Rollback production** | Apps Script | `rollback-milestone.js` |

---

## One-time setup (director or AI once)

1. **Git identity (required once on your PC):** In a terminal, run (use your name/email):
   ```
   git config user.email "you@showrider.com"
   git config user.name "Bogdan"
   ```
   *(Only for this project folder — no --global needed unless you want it everywhere.)*
2. Install [clasp](https://github.com/google/clasp) and log in: `clasp login`
3. *(Optional)* Copy `deploy-config.example.json` → `deploy-config.json` and paste a **Production Web App** deployment ID if you already have a fixed crew URL. Otherwise the first **Milestone** saves one automatically.
4. First **"This works"** creates the first Git save (`node works-save.js "note"`)

---

## Google Drive note

The project folder may sync via Google Drive. Use **one main PC** for Git commits to avoid sync conflicts.

---

## Two accounts (developer vs company host) — normal setup

Many directors use **two different accounts**. That is expected and supported.

| Account | Used for | Where it lives |
|---------|----------|----------------|
| **Your Cursor / developer identity** | AI subscription, `git config user.name` / `user.email`, optional **personal GitHub** | Your PC; not tied to company Google |
| **Company Google (clasp login)** | Apps Script project, **`gas-push-sync`** / deploy, **GAS versions**, production web app URL | Host / company Google account |

**Git (“This works” saves)** does **not** use your Cursor login or your company Google login. It only uses:
- Files on your computer (or Google Drive folder)
- The name/email you set once with `git config` (**use your developer / personal email**)

**Apps Script milestones** always live on the **company script project** (whichever Google account `clasp login` used). That is correct — the live app must stay on the host account.

**Cursor subscription** is only for the AI editor. It does not store code versions and does not replace Git.

### Optional: personal GitHub backup

To keep Git history on **your** account in the cloud (not only on disk):

1. Create a **private** repo on your personal GitHub.
2. `git remote add origin https://github.com/YOU/showrunner.git`
3. After each **“This works”**, AI or you can `git push` (only if you want cloud backup).

Company Google never needs access to that GitHub repo.

### clasp stays on company account

Do **not** re-login clasp to your personal Google unless you intend to move the whole script project. Keep clasp on the **host** account; keep Git identity on **you**.

---

## Related

- [DIRECTOR_WORKFLOW.md](DIRECTOR_WORKFLOW.md)
- [FRAGILE_ZONES.md](FRAGILE_ZONES.md) — Incident Log after bad deploys
- [ARCHITECTURE.md](ARCHITECTURE.md) §11 — Build pipeline
