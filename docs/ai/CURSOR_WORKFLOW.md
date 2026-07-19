# Cursor workflow — Showrunner + IDE integration

**Entry:** [AI_DOCTRINE.md](../../AI_DOCTRINE.md) · **Director:** [DIRECTOR_WORKFLOW.md](DIRECTOR_WORKFLOW.md)

This doc maps **Cursor IDE features** (rules, skills, subagents, review agents) onto the doctrine you already use. It does not replace `AI_DOCTRINE.md` — it is the stable reference for *how to run sessions in Cursor*.

`Last swept:` 2026-07-19 · `Production:` see `RELEASES.md` tip (GAS **v654**)

---

## What lives where

| Layer | Location | Role |
|-------|----------|------|
| **Doctrine** | `AI_DOCTRINE.md`, `docs/ai/**` | Single source of truth — drawers, ship rules, fragile zones |
| **Cursor entry** | root `AGENTS.md` | Cursor loads this automatically |
| **Cursor rules** | `.cursor/rules/*.mdc` | Short, file-scoped hints — **link to doctrine**, do not duplicate it |
| **Terminal allowlist** | `.cursor/permissions.json` | Auto-approve `node milestone.js`, `build.js`, clasp, etc. |
| **User rules** | Cursor Settings → Rules | Commit policy, prose style (global to your account) |

---

## Project rules (`.cursor/rules/`)

| Rule file | When it applies |
|-----------|-----------------|
| `showrunner-core.mdc` | **Always** — doctrine entry, modes, ship |
| `director-chat-layout.mdc` | **Always** — stack reply sections vertically (narrow chat; no side-by-side) |
| `mobile-pwa-hosting.mdc` | `push-hosting/**`, `01j_Mobile_Scan.html`, mobile styles |
| `equipment-fragile.mdc` | Formula, PA, packing, `Operations.js` |
| `session-bridge.mdc` | `host-boot.js`, `Login.html`, `Security.js`, `Main.js` |

Rules are intentionally short. Full detail stays in `docs/ai/`.

---

## Session routine (director)

### 1. Pick a mode

| You say | Agent does | Agent does NOT (until OK go) |
|---------|------------|------------------------------|
| **brainstorm** / planning mode | Discuss tradeoffs | Code, deploy, doc edits |
| **summarize** | Restate understanding | Code, deploy, docs |
| **hygiene sweep** / **doc hygiene** | Audit docs, one report | Edit docs or code |
| **OK go** / **fix this** | Build per drawer + FRAGILE_ZONES | Scope creep |

### 2. Name the drawer

Examples: *"Active drawer: RFID station"* · *"Read mobile-crew topic"* · *"FRAGILE_ZONES first — this touches formulas"*

### 3. One task per OK go

One clear outcome per build session (e.g. scan panel camera, not camera + notifications + warehouse).

### 4. Ship

1. Mechanical **pre-ship** runs inside ship scripts (or preview: `node pre-ship.js --dry-run`).
2. If **Bugbot gate = REQUIRE** → run Bugbot **before** ship completes (see [PRE_SHIP_PIPELINE.md](PRE_SHIP_PIPELINE.md) § Bugbot gate).
3. `node milestone.js "<descriptive note>"` — after Bugbot cleared if required (`PRE_SHIP_BUGBOT_OK=1`).
4. `push-hosting/public/**` → bump `host-boot.js?v=` if needed → `node deploy-hosting.js`
5. Report **GAS version**, plain-language **test steps on web.app**, then **campaign next** (what’s left in this active campaign + recommended next slice) — [AI_DOCTRINE.md](../../AI_DOCTRINE.md) **Rule 6**

### 5. Bugbot + optional gates

| Pre-ship gate | AI must |
|---------------|---------|
| **require** | Launch Bugbot (`subagent_type: bugbot`, `Diff: branch changes`) — fix Critical/High — then `PRE_SHIP_BUGBOT_OK=1` + ship |
| **recommend** | Run Bugbot when diff is non-trivial; OK to skip on tiny fixes — say so in handoff |
| **skip** | No Bugbot — save tokens |

**DAL gates** (when Logistics / PA / timeline hot paths change): persistence lint, client inventory freshness, Phase 3 concurrency ack on delta-only deploy. **Handbook:** [active/dal-pre-ship-gates.md](active/dal-pre-ship-gates.md). Planned: Gap 1 sync-mode lint + mutation inventory (hub A0/A3). **Other domains (not built):** [active/pre-ship-pipeline-expansion-2026-07-18.md](active/pre-ship-pipeline-expansion-2026-07-18.md). After client `google.script.run` changes: `node scripts/dal-client-inventory.js`. Phase 3 deploy: `PRE_SHIP_DAL_CONCURRENCY_OK=1`.

| Also (manual director phrase) | When |
|------|----------------|
| Auth, session, FCM, station bridge (extra) | **"Security review before ship"** |
| Stuck after two fix attempts | **"Use heavier reasoning"** |
| PWA UI verification | **"Verify on web.app with the browser tool"** |

Policy: `pre-ship/bugbot-policy.js` · report: `pre-ship/last-report.json`

### 6. Periodic hygiene

Every few weeks or when closing a campaign: **hygiene sweep** → review report → **OK go** to apply doc fixes only.

---

## Cursor features (plain language)

| Feature | What it is | Showrunner use |
|---------|------------|----------------|
| **Rules** | Context injected into chat | `.cursor/rules/*.mdc` — already wired |
| **Skills** | Reusable agent playbooks | Global skills (create-rule, Bugbot, security review) — agent picks when relevant |
| **Subagents** | Background specialists | **explore** for broad codebase search; **shell** for git/deploy; avoid for one-file fixes |
| **Bugbot** | Automated diff review | Before merge / after large mobile or equipment changes |
| **Security review** | Auth/session-focused review | Before `host-boot.js`, `Security.js`, login changes |
| **MCP browser** | Agent can open web.app | Mobile/PWA test steps without you being the only tester |
| **Plugins** | Cursor extensions | Optional; doctrine + rules are the main guardrails |

---

## Cost-conscious defaults

From [DIRECTOR_WORKFLOW.md](DIRECTOR_WORKFLOW.md):

1. **Brainstorm** new features before **OK go**
2. **Default model** for routine UI fixes; escalate for fragile zones
3. **One OK go** per session
4. Monthly spend cap in Cursor billing (director setting)

---

## What not to do

- Duplicate full checklists from `docs/ai/` into Cursor rules
- Run multiple review agents on every typo fix
- Skip **summarize** on ambiguous multi-screen UX (e.g. integrated scan panel vs full-page camera)
- Edit `dist/` manually or deploy with bare `clasp push` (see [DEPLOY_AND_ROLLBACK.md](DEPLOY_AND_ROLLBACK.md))

---

## Claude project pack (brainstorm on the go)

Full reference: **[CLAUDE_PACK.md](CLAUDE_PACK.md)**.

**Director says:** **create repo mix** (aliases: create repomix, repo mix)

**Agent runs:** `node create-repomix.js` → reply with full paths:

- `…/claude-pack/repomix-output.md` — **drag this** into quote.ai / Claude project knowledge
- `…/claude-pack/instructions.md` — optional

```bash
node create-repomix.js              # curated ~1M tokens
node create-repomix.js --split 2mb  # if upload size limit
```

Regenerate after major pipeline or doc changes. Packing is local (no API cost).

---

## Related

- [DIRECTOR_WORKFLOW.md](DIRECTOR_WORKFLOW.md) — brainstorm, bug template, handoff
- [FRAGILE_ZONES.md](FRAGILE_ZONES.md) — pre-flight before dangerous edits
- [FILE_MAP.md](FILE_MAP.md) — module index including hosting and mobile scan
- [CLAUDE_PACK.md](CLAUDE_PACK.md) — Repomix pack for Claude project tab
