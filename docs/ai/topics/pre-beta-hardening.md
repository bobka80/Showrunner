# Pre-beta hardening — multi-sweep debug campaign

**Entry:** [AI_DOCTRINE.md](../../../AI_DOCTRINE.md) · **Index:** [Project_TODO.md](../Project_TODO.md)  
**Related:** [beta-prep.md](beta-prep.md) (product beta features) · [FRAGILE_ZONES.md](../FRAGILE_ZONES.md) · [PRE_SHIP_PIPELINE.md](../PRE_SHIP_PIPELINE.md) · [DEPLOY_AND_ROLLBACK.md](../DEPLOY_AND_ROLLBACK.md)

**Last swept:** 2026-07-17 · **Status:** Backlog — **runs last**, after product TODO / active campaigns are done enough for users · **Not started**

---

## Purpose

Full-software debug **before real user/beta testing** — not mid-feature, not “after DAL only.”

**Prime directive:** Fixing one bug must never create another. Discovery and patching stay in separate modes. Multiple sweeps, phase → milestone → re-evaluate.

**Honest success bar:**
- Near-**100%** of **mechanical impurities** (duplicates, orphans, drifted copies, Node-only-on-GAS, split-file integrity) — machine-checkable.
- High confidence on **known S0/S1** failure patterns (session, RBAC, boot, DAL, PA/timeline saves, formula triangle, station bridge).
- **Not** a claim of zero bugs. User beta still finds real issues; those feed a new registry cycle.

**Do not start** while feature/TODO work is still landing. Do not run in parallel with an open active campaign that changes the same hot paths.

---

## Trigger

1. Product backlog the director considers **done for beta** is shipped (see [Project_TODO.md](../Project_TODO.md) topic table + active campaigns closed or explicitly deferred).
2. Director says this campaign is next (promote from backlog → optionally `active/` when in flight).
3. **Gate 0 — Freeze** completed.
4. **Gate 0.5 — Intent survey** completed (director labels gaps) — **before** Sweep 1.

**Locked order:** Freeze → Intent survey → Sweep 1 purity → Sweep 2 map/registry → S0/S1 RCs → selective S2 → beta readiness.

---

## Gate 0 — Freeze (before any audit work)

- [ ] Major production pin: note **GAS version**, hosting deploy if relevant, desktop/APK versions if shipped
- [ ] REWIND / rollback pin documented (same spirit as station REWIND pins)
- [ ] Campaign opened — **discovery / survey only** until Gate 0.5 done and Sweep 1 approved
- [ ] No new feature work until each phase’s OK go

---

## Gate 0.5 — Intent survey (before Sweep 1)

**Why:** Agents will otherwise “fix” deliberate quirks (e.g. formula copies pending consolidate, cache disabled on purpose, merge-favors-local). Director intent must sit **next to** symptoms before purity or RC work.

**Mode:** Research + survey only — **no behavior patches**, no purity sweeps yet.

### What the agent builds (gap catalog)

Pull **what the software does** and **how docs say it should work**, then list **ambiguities** — not every function in the repo:

| Source | Use for |
|--------|---------|
| [FILE_MAP.md](../FILE_MAP.md), topics, [Project_TODO.md](../Project_TODO.md) | Domains + intended behavior |
| [FRAGILE_ZONES.md](../FRAGILE_ZONES.md) | “Looks wrong but may be intentional” |
| [active/dal-client-inventory.md](../active/dal-client-inventory.md), phase-0 / DAL discovery | Write paths + call graph |
| Known topic gaps (e.g. [project-assets-concurrency.md](project-assets-concurrency.md)) | Already-named patterns |

Cap to **S0/S1 first**, then FRAGILE / write paths / public APIs. Batch by domain so the survey is finishable.

### Survey for the director (you fill)

Each gap row gets **one** label:

| Label | Meaning |
|-------|---------|
| **Bug** | Wrong — eligible for registry / fix later |
| **Intentional** | Correct as designed — **do not “clean”** without a new product decision |
| **Spec** | Should work *this* way (director writes the rule) — becomes canonical intent |
| **Defer** | Needs users / later / out of beta scope |

Optional note field for each row (one sentence).

**Deliverable:** `audit/intent-survey.md` (human) + preferably structured `audit/intent-survey.json` (or YAML) as source of truth — same pattern as inventory → markdown.

### Rules

- Agent **must not invent** Intentional vs Bug — unanswered rows stay `UNANSWERED` until you label them.
- Sweep 1 **must not** change anything tagged **Intentional** or **Defer**.
- Sweep 2+ registry rows **link** to survey IDs so intent travels with the “problem.”
- Survey too large → stop and cut scope (S0/S1 only); never block the campaign on a 500-row quiz.

### Retrieval / vectors (optional Phase B — after catalog exists)

- **MVP:** structured survey + registry is enough.
- **Later:** embed survey answers + RC descriptions (intent next to symptoms) for retrieval — **not** raw code dumps, **not** before Gate 0.5 is filled.
- Vectors are a lookup aid; they do **not** replace reading the matched survey/RC row.

- [ ] Gap catalog drafted (S0/S1 + FRAGILE first)
- [ ] Director survey completed (or remaining rows explicitly `Defer` / `UNANSWERED` with director OK to proceed)
- [ ] Intent artifacts saved under `audit/` (when campaign opens)

---

## Sweep order (locked)

| Phase | Mode | Goal | Ship |
|-------|------|------|------|
| **Gate 0 — Freeze** | Pin only | Rollback safety | Pin note in campaign / REWIND |
| **Gate 0.5 — Intent survey** | Research + director labels | Bug vs intentional vs spec | `audit/intent-survey.*` |
| **1 — Mechanical purity** | Fix only if **no behavior change** and not Intentional/Defer | Duplicates, orphans, drifted copies, Index wiring, Node-only-on-GAS, station split / cheap verify scripts | Milestone e.g. `Pre-beta Sweep 1 — mechanical purity` + smoke |
| **2 — Map & registry** | Docs / research only | Coarse map; Root Cause Registry (respect survey labels); defer list | Doc milestone or docs-only commit |
| **3 — S0/S1 root causes** | One **RC cluster** per milestone | Shared-origin fixes (pattern tags) | `RC-00x` + ripple regression |
| **4 — Selective S2** | Registry items needed for beta | Operational/UX blockers | Same cadence as Sweep 3 |
| **5 — Beta readiness** | Field scripts | Chainway + TSL + phone + desktop lock + claimed concurrency | Then invite users |

After **every** phase: re-evaluate registry, ripple list, intent survey (any new gaps?), and whether the freeze pin needs a new pin.

**Seed maps from existing drawers** — do not cold-start from repomix alone: [FILE_MAP.md](../FILE_MAP.md), topics, [FRAGILE_ZONES.md](../FRAGILE_ZONES.md), [active/dal-client-inventory.md](../active/dal-client-inventory.md), [active/dal-phase0-discovery-2026-07-13.md](../active/dal-phase0-discovery-2026-07-13.md).

---

## Blast radius (domains)

Tag domains before deep dissection:

| Tag | Meaning | Examples |
|-----|---------|----------|
| **S0 — Structural** | App unusable if broken | Session, RBAC, boot payload, DAL router |
| **S1 — Data integrity** | Silent loss/corruption possible | PA delta save, timeline save, reconciliation, formula triangle |
| **S2 — Operational** | Feature degraded | Notifications, truck engine, financials |
| **S3 — Cosmetic** | UI-only | Labels, polish |

Dissect and fix **S0/S1 first**. Cap fine-grain units to: public/write paths, FRAGILE paths, inventory endpoints — **not** every function in the repo.

**Domain gaps to include** beyond a thin PA/DAL list: formula triangle / Auto-Pack vs Auto-Container, presence/editor lock, PWA shell / host-boot / mobile QR, Drive/Integrations, vault + station IAM, desktop lock, tasks.

---

## Root Cause Registry (Sweep 2+)

Group units by **pattern tags** (e.g. `no-collision-check`, `full-rewrite-not-delta`, `cache-disabled`). Shared tags → one RC, one fix, multi-site regression.

| Rule | Detail |
|------|--------|
| Source of truth | Prefer **structured** registry (JSON/YAML); markdown generated for reading |
| Until then | `audit/root-causes.md` (create when Sweep 2 starts) is fine as v1 |
| Intent link | Every RC cites Gate 0.5 survey ID(s); skip or re-ask if label is Intentional |
| Overlap | If two RCs touch the same unit, **serialize** — never parallelize overlapping clusters |
| Fragile | Anything in [FRAGILE_ZONES.md](../FRAGILE_ZONES.md) auto-escalates to director on ripple review |

**Vector embeddings / multi-agent swarm:** optional Phase B after Gate 0.5 + Registry v1 exist. MVP = survey labels + pattern tags + call inventory + ripple lists.

---

## Fix lifecycle (per root cause — Sweep 3+)

1. Coordinator (director + one agent session) pulls next RC — highest blast radius first; **skip Intentional** unless product decision changed  
2. Fix-Proposal drafts fix + claimed units  
3. Ripple-Check lists ≤2 hops (deps + inventory) not already claimed  
4. **Director OK go** on claimed + ripple  
5. Ship via existing discipline: [PRE_SHIP_PIPELINE.md](../PRE_SHIP_PIPELINE.md) → Bugbot when required → `node milestone.js "… RC-00x …"`  
6. Registry: `RESOLVED` + commit/version + regression evidence  
7. Re-evaluate before next RC  

**Cursor practice:** one in-flight RC cluster per session; roles (Dissect / Correlate / Propose / Ripple) are sequential passes, not parallel bots on the same files.

---

## Re-evaluate checklist (after every phase)

Answer in plain language before the next phase:

1. What did we **claim** to fix? (impurity class or RC IDs)  
2. What did we **touch** that we didn’t claim? (ripple — honest)  
3. Did we almost “fix” something tagged **Intentional**? (if yes — stop and correct)  
4. Is the freeze backup still valid, or do we need a **new pin**?  

If the agent cannot answer these, do not start the next phase.

---

## Deliverables (when campaign opens)

- [ ] Freeze pin recorded (Gate 0)  
- [ ] Intent survey completed / accepted (Gate 0.5) — `audit/intent-survey.*`  
- [ ] Sweep 1 purity gates run + milestone (respect Intentional/Defer)  
- [ ] `audit/coarse-map.md` (or equivalent under `docs/ai/active/` when in flight)  
- [ ] Root Cause Registry v1 (linked to survey IDs)  
- [ ] S0/S1 RCs closed with evidence (checklist grows during campaign)  
- [ ] Sweep 5 field evidence before inviting users  

Promote to `docs/ai/active/` only when the director opens the campaign. Keep this topic as the **canonical backlog procedure**.

---

## Explicitly out of scope until later

- Running this mid-TODO / mid-active-feature campaign  
- Claiming “100% of all bugs”  
- Building vector DB / bot swarm **before** Gate 0.5 answers exist (and before Sweep 1–3 have closed real RCs)  
- Full census of every function in every domain before beta  
- Treating “looks messy” as a Bug without a director survey label  
