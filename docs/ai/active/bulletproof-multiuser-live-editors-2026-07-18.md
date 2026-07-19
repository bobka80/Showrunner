# Bulletproof Multi-User Live Editors — Testing, Fix Approach & Hardening Plan

**Status:** Design brief — **process + order authority** for Part A of [multi-user-fork-industrial-and-auto.md](multi-user-fork-industrial-and-auto.md). Hold code until director says **OK go** on a named phase/item.  
**Written:** 2026-07-18 (Claude) · **Injected:** 2026-07-19  
**Scope:** Timeline collab + Project Assets (prep) live sync — the two structured-entity-patch editors  
**Trigger:** Incident history (`dal-pa-live-sync-thrash.md`, `dal-pa-delete-resurrect.md`) — four fix rounds (v628→v638) each closed one bug while leaving a sibling open; one regression passed green while production still failed (test did not model the real race).

**Campaign build order (director lock 2026-07-19):**

1. **Phase H0 — Testing pipeline** (this file Part 1 + H0 checklist)  
2. **Phase H1–H3 — Bulletproof multi-user** (harden H-items; this file Parts 2–3)  
3. **Part B — Auto fork** — [multi-user-fork](multi-user-fork-industrial-and-auto.md) Part B · UX: [timeline-collab-session.md § Optional update](../topics/timeline-collab-session.md#optional-update--auto-fork-live-pull-in--idle-eject)

**Hub checklist (single checkbox list):** [multi-user-fork-industrial-and-auto.md](multi-user-fork-industrial-and-auto.md) — do not maintain a second Part A order elsewhere.  
**H definitions (what each H means):** [dal-prep-live-sync-standards.md](dal-prep-live-sync-standards.md) §2.  
**Gap 1 (Firestore/GAS mode lint):** tracked on hub + [dal-pre-ship-gates.md](dal-pre-ship-gates.md) — **not** a separate gap-closure novel; ships after H0 mode-seam sims exist.

**Do not start any item below without an explicit director OK go on that item.**

---

## Part 1 — Fix the testing itself

The current sim (`dal-pa-live-sync-test.js` / `dal-pa-live-sync-core.js`) is good and should stay — Cases A–G are real, hard-won regression coverage. The problem isn't the test's existence, it's what it's allowed to prove.

### 1.1 Ban "green means done" as a claim

**The specific failure:** touch-only sim passed while production still thrashed, because the test never modeled concurrent equal-seq writes. A green test was treated as proof of correctness for a scenario it didn't cover.

**Fix:** Every sim case must state, in a comment, **exactly which real-world scenario it reproduces** and — just as important — **which scenarios it does NOT cover**. A test with an undocumented blind spot is how the equal-seq race slipped through.

```javascript
// Case X: [scenario in plain language]
// Does NOT cover: [explicitly list adjacent scenarios not modeled here]
```

### 1.2 Adversarial case-writing, not confirmatory

**The pattern to break:** a fix is written, then a test is written to confirm the fix works. This only tests the scenario the fixer already had in mind.

**Fix:** Before writing the fix, write the failing case first (already partially true per `dal-phase-safety-playbook.md`'s "prove with sim" rule — make it universal, not just for prep PA). Then, **before shipping**, spend one deliberate pass trying to break the fix with a *different* timing/ordering than the one that motivated it — same bug class, adjacent scenario.

### 1.3 Add a mutation-completeness gate, not just a checklist

**The gap:** H5's mutation inventory (`dal-prep-live-sync-standards.md` §4.4 / mutation table) is currently a manual table a human fills in.

**Fix:** Build `scripts/dal-mutation-inventory-check.js` — statically scan `02e2_Logic_CRUD.html` (and the timeline equivalent) for every function that mutates `currentProjectAssets` / timeline state, and assert each one calls `dalPaNoteTouch_` / `dalPaNoteDelete_` (or the timeline equivalent) somewhere in its body or call chain. Fail the pre-ship gate if a new mutator is added without the note call.

### 1.4 Test the fallback boundary, not just each mode alone

**The gap:** Firestore mode and GAS-poll mode are each tested in isolation; the dangerous behavior is at the **seam**.

**Fix:** Add sim cases that simulate mode-switch mid-session: client is in `firestore` mode, a stale `gas`-mode response arrives late — assert it's rejected. Backs **Gap 1** (sync-mode lint) on the hub.

### 1.5 Track "time-to-real-fix" as a signal, not just pass/fail

Add one line to the incident-log template: **"How many prior attempts before this held?"** If a fix is attempt #3+ on the same symptom family, stop and do a scoped audit of the whole hot path rather than attempt #4.

---

## Part 2 — The approach to fixing bugs in this hot path

Process between "director reports a bug" and "milestone ships." **Canonical depth lives here;** [dal-prep-live-sync-standards.md](dal-prep-live-sync-standards.md) §4 points here.

### 2.1 Root-cause-cluster-first, not symptom-first

Before fixing, ask: *what is the general rule this specific bug violates, and what else could violate the same rule?* Every fix pass should end by asking "is this the only place this rule can be broken?"

### 2.2 One root cause per milestone, explicitly named

Milestone commit message names the **rule fixed**, not just the symptom:

- Bad: `"fixed delete sync bug"`
- Good: `"prep delete notes + seed-once — closes 'every mutator must note touch/delete' rule for removePa family"`

### 2.3 Escalate on repeat offenses

**If the same fragile zone gets a third incident file within one campaign, stop shipping incremental guards and run a scoped fine-grain sweep of that one hot path** (not the whole codebase).

### 2.4 Never let a fix ship on an untested blind spot

Enforced by 1.1 — sim case must state scope; make "sim case states scope" part of the pre-ship gate for this hot path.

### 2.5 Keep the human smoke test, but make it adversarial too

Two-browser director smoke stays. Extend with one deliberately adversarial step per smoke (e.g. close lid mid-edit, offline 10s then reconnect).

---

## Part 3 — Hardening plan toward "bulletproof" (timeline + PA)

Sequences Parts 1–2 with hub H-items. **Checkbox progress lives only on the hub.**

### Phase H0 — Testing infrastructure upgrade (**do this first**) ✅ 2026-07-19

- [x] Add scope/non-coverage comments to every existing sim case (1.1) — Cases A–J
- [x] Build `dal-mutation-inventory-check.js` as a permanent gate (1.3) — PA + timeline twin in `pre-ship/dal.js` (hub A2/H5)
- [x] Add mode-switch-seam sim cases (1.4) — Case H backs Gap 1
- [x] Add "attempts before fix held" field to incident log template (1.5)
- [x] Absorb former **H6** intent — Case I (3-client), Case J (sticky ended sessionUid)

**Why first:** every H-item below is safer once the harness is trustworthy.

### Phase H1 — Close known harden items (hub order)

1. **H1** — Fail closed on weak sync + adversarial sim (Auth fails *mid-edit*).  
2. **H5** — Mutation-path inventory — convert to gate per 1.3 (pair with H1).  
3. **Gap 1** — `pre-ship/dal-sync-mode-lint.js` (after H0 seam sims exist). See [dal-pre-ship-gates.md](dal-pre-ship-gates.md).  
4. **H4** — State size cap + END mirror check (concrete threshold).  
5. **H3** — Same-row conflict visibility — **both** timeline and PA same milestone (no “as practical” hedge); if timeline slips, explicit tracked follow-up.  
6. **H2** — Cheaper remote apply — measurable pass condition before start.

### Phase H2 — Part A exit, hardened

- [ ] Director two-browser smoke + ≥1 adversarial step (2.5)
- [ ] Mutation-inventory gate green for PA and timeline
- [ ] Every sim case has scope comments
- [ ] Update FRAGILE + standards status; hub **Part A complete — OK for Part B**
- [ ] Milestone names which **rules** closed

### Phase H3 — Only then, Part B (auto fork / pull-in / idle eject)

Unchanged product UX — hub Part B + timeline topic. **Do not start** until Phase H2 exit is director-confirmed.

---

## What "bulletproof" means here (checkable)

1. No known rule (touch/delete-note, single-writer-per-seq, mode-isolation) can be silently violated by a future diff — mechanical gate, not only a “don't.”  
2. No sim case can pass green while a documented real-world scenario is uncovered — scope is explicit.  
3. A third incident in the same zone triggers a scoped sweep automatically.  
4. Every conflict is visible to the user, in both domains, with no hedged exceptions.

---

## Cursor-ready prompt (Phase H0 — recommended start)

```
Context: docs/ai/active/dal-pa-live-sync-thrash.md and
docs/ai/active/dal-pa-delete-resurrect.md document the incident history
of this hot path. scripts/dal-pa-live-sync-test.js and
scripts/lib/dal-pa-live-sync-core.js are the existing sim. Read all
four before starting. Hub: multi-user-fork-industrial-and-auto.md Part A0.

Task: Phase H0 from bulletproof-multiuser-live-editors-2026-07-18.md —
testing infrastructure upgrade. Specifically:

1. Add a scope comment to every existing Case in
   dal-pa-live-sync-test.js stating exactly which real-world scenario
   it reproduces and which adjacent scenarios it does NOT cover.
2. Build scripts/dal-mutation-inventory-check.js: statically scan
   02e2_Logic_CRUD.html for every function mutating
   currentProjectAssets, assert each calls dalPaNoteTouch_ or
   dalPaNoteDelete_ somewhere in its body or call chain. Do the same
   for the timeline equivalent file. Fail with a clear message listing
   the unguarded mutator if one is found.
3. Add new sim cases modeling a mode-switch seam: client in firestore
   mode receives a stale gas-mode response after a simulated network
   delay — assert it's rejected, not applied.
4. Do not touch H1–H5 product behavior yet — this phase is testing
   infrastructure only.

Rules:
- No code until director says OK go.
- Sim must stay pure (no Firebase credentials needed), matching the
  existing test's design.
- After implementation: node milestone.js "<description>" naming the
  testing capability added, not a symptom fixed.
```

---

## Not in scope for this file

- Part B implementation details — hub Part B + timeline § Optional update  
- Full vector-mapped root-cause audit pipeline — separate larger campaign  
- RBAC/truck/notifications/financials pre-ship gates — [pre-ship-pipeline-expansion-2026-07-18.md](pre-ship-pipeline-expansion-2026-07-18.md)  
- Restating H2–H4 as a separate “gap closure” novel — hub IDs only; Gap 1 on [dal-pre-ship-gates.md](dal-pre-ship-gates.md)
