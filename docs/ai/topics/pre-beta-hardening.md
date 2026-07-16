# Pre-beta hardening — multi-sweep debug campaign

**Entry:** [AI_DOCTRINE.md](../../../AI_DOCTRINE.md) · **Index:** [Project_TODO.md](../Project_TODO.md)  
**Related:** [beta-prep.md](beta-prep.md) (product beta features) · [FRAGILE_ZONES.md](../FRAGILE_ZONES.md) · [PRE_SHIP_PIPELINE.md](../PRE_SHIP_PIPELINE.md) · [DEPLOY_AND_ROLLBACK.md](../DEPLOY_AND_ROLLBACK.md)

**Last swept:** 2026-07-16 · **Status:** Backlog — **runs last**, after product TODO / active campaigns are done enough for users · **Not started**

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
3. **Gate 0 — Freeze** completed (below).

---

## Gate 0 — Freeze (before any audit work)

- [ ] Major production pin: note **GAS version**, hosting deploy if relevant, desktop/APK versions if shipped
- [ ] REWIND / rollback pin documented (same spirit as station REWIND pins)
- [ ] Campaign opened — **discovery only** until Sweep 1+ approved
- [ ] No new feature work until each phase’s OK go

---

## Sweep order (locked)

| Sweep | Mode | Goal | Ship |
|-------|------|------|------|
| **1 — Mechanical purity** | Fix allowed only if **no behavior change** | Duplicates, orphans, drifted `processFormulas`-style copies, Index wiring, Node-only-on-GAS, station split / generalize cheap verify scripts | Milestone e.g. `Pre-beta Sweep 1 — mechanical purity` + smoke |
| **2 — Map & registry** | **Docs / research only** (no big behavior patches) | Coarse domain map; Root Cause Registry from known patterns + discoveries; defer list for S2/S3 / “needs users” | Doc milestone or docs-only commit |
| **3 — S0/S1 root causes** | One **RC cluster** per milestone | Shared-origin fixes (pattern tags), not symptom whack-a-mole | `RC-00x` in milestone note + ripple regression |
| **4 — Selective S2** | Only registry items needed for beta | Operational/UX gaps that block users | Same cadence as Sweep 3 |
| **5 — Beta readiness** | Field scripts | Chainway + TSL + phone + desktop lock + claimed concurrency paths | Then invite users |

After **every** phase: re-evaluate registry, ripple list, and whether the freeze pin needs a new pin.

**Seed Sweep 2 from existing drawers** — do not cold-start from repomix alone: [FILE_MAP.md](../FILE_MAP.md), topics, [FRAGILE_ZONES.md](../FRAGILE_ZONES.md), [active/dal-client-inventory.md](../active/dal-client-inventory.md), [active/dal-phase0-discovery-2026-07-13.md](../active/dal-phase0-discovery-2026-07-13.md).

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
| Source of truth | Prefer **structured** registry (JSON/YAML) later; markdown human view generated from it (same idea as `dal-client-inventory.js` → `.md`) |
| Until then | `audit/root-causes.md` (create when Sweep 2 starts) is fine as v1 |
| Overlap | If two RCs touch the same unit, **serialize** — never parallelize overlapping clusters |
| Fragile | Anything in [FRAGILE_ZONES.md](../FRAGILE_ZONES.md) auto-escalates to director on ripple review |

**Vector embeddings / multi-agent swarm:** optional later (Phase B). MVP = pattern tags + call inventory + dependency/ripple lists. Retrieval aids do not replace reading matched rows.

---

## Fix lifecycle (per root cause — Sweep 3+)

1. Coordinator (director + one agent session) pulls next RC — highest blast radius first  
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
3. Is the freeze backup still valid, or do we need a **new pin**?  

If the agent cannot answer these, do not start the next phase.

---

## Deliverables (when campaign opens)

- [ ] Freeze pin recorded (Gate 0)  
- [ ] Sweep 1 purity gates run + milestone  
- [ ] `audit/coarse-map.md` (or equivalent under `docs/ai/active/` when in flight)  
- [ ] Root Cause Registry v1  
- [ ] S0/S1 RCs closed with evidence (checklist grows during campaign)  
- [ ] Sweep 5 field evidence before inviting users  

Promote to `docs/ai/active/` only when the director opens the campaign. Keep this topic as the **canonical backlog procedure**.

---

## Explicitly out of scope until later

- Running this mid-TODO / mid-active-feature campaign  
- Claiming “100% of all bugs”  
- Building vector DB / bot swarm before Sweep 1–3 have closed real RCs  
- Full census of every function in every domain before beta  
