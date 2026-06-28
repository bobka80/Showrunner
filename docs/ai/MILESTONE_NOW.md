# Milestone Now — AI Protocol

**Entry:** [AI_DOCTRINE.md](../../AI_DOCTRINE.md) · **Map:** [README.md](README.md)

When the director says **"Milestone now"** (with or without extra instructions in the same message), the AI **must run a production milestone first**, then continue with anything else they asked for.

---

## Trigger phrases

| Phrase | Meaning |
|--------|---------|
| **Milestone now** | Run production milestone **first**, then do other work in the same message |
| **Milestone now: …** | Same — text after the colon is the milestone note **and** context for what comes next |
| **Milestone** / **OK ship** | Milestone only (no implied follow-up build) |

**Examples**

- *"Milestone now — then start the Database tab"* → `milestone.js` → implement Database tab  
- *"Milestone now: Pre database recovery panel"* → milestone with that note → wait for next instruction unless more text follows  
- *"OK ship"* → milestone only  

---

## AI execution order (mandatory)

1. **Do not** edit application code or start the new feature until the milestone step completes (or fails with a clear blocker) — when director said **Milestone now** before new work.
2. Run:  
   `node milestone.js "<note>"`  
   Use a short note (this becomes the **Apps Script version name**), e.g. `Personal Hub — theme, logout, PIN`.
3. On **success**: report the **new GAS version number** (e.g. “was 335 → now 336”) and deployment result; then proceed with remaining instructions or hand off to director for web.app testing.
4. On **failure**: report the error; **do not** start risky work until milestone is unblocked or the director explicitly says to skip (rare).

**Also mandatory:** At the end of **every completed implementation** (after **OK go**), run the same `milestone.js` step even if the director did not say “milestone”. Never tell the director to deploy manually.

**`deploy-config.json` is optional.** If `productionDeploymentId` is set, the same production URL is updated. If not, milestone creates a new deployment and saves the ID automatically.

---

## What a milestone does (reminder)

1. Reads **latest Apps Script version** (e.g. 265)  
2. `node build.js` + `clasp push` (upload current code)  
3. `clasp version "<your note>"` → creates **next** numbered version (e.g. 266) with that name  
4. `clasp deploy` that new version to the web app  
5. Git commit + row in root **`RELEASES.md`**

This is **not** the same as **"This works"** (`works-save.js`), which only saves Git locally.

---

## When to use "Milestone now"

Use before **starting a new major update** when the current production state is tested and you want a rollback point on Google:

- New Root-only panels (e.g. Database Operations tab)  
- IAM / security changes already live  
- Backup / restore infrastructure  
- Anything you would regret losing if the next session goes wrong  

**Do not** use on every small fix — use **"This works"** for frequent Git checkpoints during dev.

---

## Director cheat sheet

```
This works     →  Optional Git checkpoint during long dev (not a production ship)
Milestone now  →  Production snapshot FIRST, then AI continues your other ask
Milestone      →  Production snapshot only
OK go          →  AI implements, then milestones automatically (web.app test)
```

**Default after any build:** AI runs `milestone.js` and tells you the version (e.g. **v336**). You test on web.app — you do not run clasp or deploy yourself.

**Rollback production:** *"Rollback production to last milestone"*  
**Rollback dev:** *"Rollback to last this works"*

---

## Related

- [DEPLOY_AND_ROLLBACK.md](DEPLOY_AND_ROLLBACK.md) — full two-layer versioning  
- [DIRECTOR_WORKFLOW.md](DIRECTOR_WORKFLOW.md) — brainstorm vs build  
- [Project_TODO.md](Project_TODO.md) — roadmap index  
- Root **`RELEASES.md`** — milestone history  
- Root **`deploy-config.json`** — production deployment ID (local, not in Git)
