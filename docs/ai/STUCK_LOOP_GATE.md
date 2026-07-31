# Stuck Loop Gate & Summary/Survey Sync Loop

**Entry:** [AI_DOCTRINE.md](../../AI_DOCTRINE.md) **Rule 13** · **Map:** [README.md](README.md)  
**Related:** Gate 0.5 Intent Survey in [topics/pre-beta-hardening.md](topics/pre-beta-hardening.md) · log home [error-journal/](error-journal/) · modes [DIRECTOR_WORKFLOW.md](DIRECTOR_WORKFLOW.md)

**Standing rule** — applies to **every** build/patch session (active campaigns, one-off fixes, pre-beta sweeps). Not a campaign. Not scoped to one feature.

`Last swept:` 2026-07-31

---

## Why this exists

Two failure modes share one root cause — **repeated fix attempts past the point where the concept (not the code) was the problem**, with no pause to check:

1. **Scope drop across briefings** — A required piece (e.g. Logistics Ledger during a fork) was never named in successive session briefings, so it fell out of the plan without an explicit cut. Fast early work hid the gap (“shopping cart buffer”); it only surfaced later.
2. **Debugging an unlocked concept** — Hard errors looked like code bugs, but the underlying idea had not solidified before incremental milestones began. Patching a moving target wastes sessions. The same discipline as Gate 0.5 (lock intent before sweeping) belongs on ordinary feature campaigns too — as a **live** gate, not only a pre-sweep survey.

---

## Relationship to Gate 0.5

| | **Gate 0.5 — Intent survey** | **Stuck Loop Gate (this doc)** |
|--|------------------------------|--------------------------------|
| When | Once, before pre-beta Sweep 1 | Any time during any build/patch session |
| Shape | Structured gap catalog + director labels | Short summary + 2–3 plain questions |
| Goal | Label Bug / Intentional / Spec / Defer | Stop thrashing; reconcile agent understanding ↔ written briefing ↔ director |

They do **not** replace each other. During pre-beta patch work, both can apply.

---

## Trigger — Stuck Loop Gate

Track a **repeat-failure counter** per **error signature** during the session.

- **Error signature** = same symptom recurring against the same file / function / feature area, even if each attempted fix differs.
- **Threshold:** **Must stop at 3** consecutive failed fix attempts on that signature. **May stop at 2** if the concept looks unlocked (goal still fuzzy, briefing and ask diverge, or “fix” keeps changing the underlying mechanic).
- On trip: **stop patching that signature immediately**. Do not try a 4th fix. Do not silently keep iterating.

This gate is **agent-enforced**. The director does not have to say “stuck loop” — the agent stops and runs the sync loop below.

---

## Response — Summary & Survey Sync Loop

### Step 1 — Agent Summary (short)

Plain language:

1. What the agent currently understands the **goal / mechanic** to be (one short paragraph).
2. What has been **tried** so far, and how each attempt **failed**.
3. Which **written briefing / doctrine doc** this work is supposed to be implementing (name the file and section).

### Step 2 — Agent Survey (2–3 questions max)

Same spirit as Gate 0.5 — plain language, not technical:

1. What result are you expecting right now, in your own words?
2. Does that match what’s written in **[named briefing doc / section]**?
3. Has anything about the goal changed since that doc was written?

This is a forced clarity moment for the **director** as much as the agent — the director may have drifted from written scope.

### Step 3 — Compare and reconcile

- **Match** (director answers align with the written briefing) → concept confirmed; failures are genuine code bugs. Resume debugging normally. **Log** the loop event (see below).
- **Mismatch** → surface the gap plainly: *“The doc says X; you’re describing Y — which is current?”*  
  - Do **not** guess which side is right.  
  - Do **not** resume patching until the director resolves it — either by **updating the written briefing** or by **confirming the doc is still correct** and restating the ask more precisely.

---

## Rules for the agent (same discipline as Gate 0.5)

1. **Do not invent** which side is correct when doc and director disagree — that decision belongs to the director.
2. **Do not** treat “the director sounded confident” as resolution — the **written doc is source of truth** until explicitly changed.
3. If survey answers cannot be reconciled with the doc in one pass, **stop and ask directly** — do not silently re-loop the survey.
4. **Log every triggered loop** (signature, summary, survey answers, resolution) in [error-journal/](error-journal/) — searchable history for “did we hit this before?”

---

## Logging (error journal)

**Where:** [error-journal/](error-journal/) — same operational log as Report → Hand over threads; **not** a campaign.

**File name:** `STUCK-YYYY-MM-DD-<short-slug>.md`  
**Index:** add a row to [error-journal/README.md](error-journal/README.md) (Kind: `stuck_loop`).

**Minimum fields:**

| Field | Content |
|-------|---------|
| Signature | Symptom + area (file/function/feature) |
| Attempts | Count + one line each |
| Briefing cited | Path + section |
| Summary given | Paste or paraphrase Step 1 |
| Survey answers | Director replies |
| Resolution | `match` → resumed code debug · `mismatch` → doc updated / ask restated · `open` if waiting |
| Date / session | When the gate tripped |

---

## What this is not

- Not a substitute for **summarize** before a new OK go (Rule 4b).
- Not permission to skip **FRAGILE_ZONES** disclosure.
- Not a reason to open a new campaign — stay on the current drawer unless the director redirects.
