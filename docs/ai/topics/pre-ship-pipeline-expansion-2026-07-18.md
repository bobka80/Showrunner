# Pre-Ship Gate Pipeline — Expansion to Other Domains

**Status:** Backlog design brief (moved out of active 2026-07-20) — hold until director says **OK go** on a named domain.  
**Written:** 2026-07-18 (Claude) · **Injected:** 2026-07-19  
**Source pattern:** `pre-ship/dal.js`, `scripts/dal-persistence-lint.js`, `scripts/dal-phase3-gate.js` — the only domain currently covered by automated pre-ship gates  
**DAL handbook (archived):** [../archive/dal-pre-ship-gates.md](../archive/dal-pre-ship-gates.md) · General pipeline: [../PRE_SHIP_PIPELINE.md](../PRE_SHIP_PIPELINE.md)

**Do not start any domain below without an explicit director OK go on that domain.**

**Not this file:** DAL live-sync Gap 1 (Firestore/GAS mode lint) — that stays under [../archive/dal-pre-ship-gates.md](../archive/dal-pre-ship-gates.md) and the multi-user fork hub. This brief is **other domains only**.

---

## Why this exists

Right now, exactly one domain (DAL) has automated pre-ship gates: scoped detection of changed files, structural lint rules enforcing architecture boundaries, and a director-ack gate for anything requiring a manual concurrency smoke test. Every other domain — RBAC, truck arrangement, notifications, financials/payroll, station/RFID — ships on code review + Bugbot + the director's own read. That's a real gap for anything S0/S1 (high blast radius).

This file generalizes the DAL pattern into a template, then applies it to the four highest-value domains. The goal isn't full test coverage — it's the same thing DAL gates do: **catch violations of known invariants before they ship**, not prove general correctness.

---

## The pattern, generalized

Every DAL gate answers one of two questions:

1. **Structural:** "Does this diff touch a forbidden pattern?" — pure lint, runs when hot-path files are touched.
2. **Behavioral:** "Does this diff require a human/hardware smoke test before shipping?" — gate blocks deploy until a director ack env var is set, with a printed checklist.

New domain gates should follow the same two-tier shape:

```
pre-ship/<domain>.js
  ├─ <domain>Touched(changedFiles)   — hot-path file detection (regex list)
  ├─ run<Domain>Gates({ forDeploy }) — orchestrates lint + smoke-ack checks
  └─ exports wired into pre-ship/layers.js, same as dal.js
```

Each gate should be **cheap to write** — encoding one or two already-known failure modes as a permanent check.

---

## Domain 1 — RBAC / Session (highest priority — S0)

**Why first:** Highest blast radius. A missing role check silently exposes payroll, deletes, or admin functions to unauthorized crew.

**Proposed structural check (`scripts/rbac-guard-lint.js`):**
- Any new/modified backend function in `Security.js`, `Station_Security.js`, or any function called via `google.script.run` from a manager-only UI surface, must contain a call to `verifyBackendPrivilege(` or `verifyBackendPermission(` (or an explicit `// RBAC: intentionally unguarded — <reason>` comment, allowlisted).
- Flag any diff that **removes** an existing `verifyBackendPrivilege`/`verifyBackendPermission` call without an equivalent replacement.

**Proposed behavioral check:** none automatable yet — role/permission correctness for a *new* function still needs director read.

**Detection scope (hot-path patterns):**
```
Security.js
Station_Security.js
any file matching /verifyBackendPrivilege|verifyBackendPermission/ in diff
```

---

## Domain 2 — Truck Arrangement Engine

**Why:** Physical safety property (rule 2: heaviest cases at bottom is absolute) — a code change that lets bin-packing override the hard rules could produce genuinely unsafe truck loads.

**Proposed structural check (`scripts/truck-rule-order-lint.js`):**
- Static check that the rule-priority order in the truck arrangement source (rule 1: fill width → rule 2: heaviest bottom → rule 3: longest-side alignment → rule 4: priority-near-cabin → rule 5: bin packing) is preserved.
- Exact implementation depends on how the engine is structured — **discovery step first** (call order vs weighted scoring).

**Proposed behavioral check:** Formalize existing warehouse smoke as a printed checklist gate when truck engine files are touched.

---

## Domain 3 — Notifications (FCM)

**Why:** Synchronous FCM inside a save path can block or slow the save.

**Proposed structural check (`scripts/notification-sync-lint.js`):**
- Flag any diff where a notification/FCM send call appears inside the same function body as a Sheets/Firestore save call, unless wrapped in async/fire-and-forget (confirm pattern against current notification code first).

**Proposed behavioral check:** none needed if structural check is precise enough.

---

## Domain 4 — Financials / Payroll

**Why:** Highest cost-of-error domain (S0).

**Proposed structural check:** Lower confidence — prefer a **discovery pass first** (inventory payroll calculation functions) before proposing a gate shape.

**Proposed behavioral check:** Director ack + documented before/after sample calculation against known-good payroll numbers — likely more valuable than structural lint.

---

## Suggested order

1. **RBAC** — highest blast radius, cheapest structural check  
2. **Notifications** — narrow, well-understood failure mode  
3. **Truck engine** — discovery step first  
4. **Financials** — discovery first; likely behavioral-ack gate  

---

## Cursor-ready prompt (for whichever domain the director picks)

```
Context: pre-ship/dal.js, scripts/dal-persistence-lint.js, and
scripts/dal-phase3-gate.js are the reference pattern for this work —
read all three before starting. docs/ai/archive/dal-pre-ship-gates.md
documents how DAL gates are wired into pre-ship/layers.js and when
they run.

Task: Build the equivalent pre-ship gate for [DOMAIN — RBAC /
notifications / truck engine / financials], following the shape
described in pre-ship-pipeline-expansion-2026-07-18.md § Domain
[N].

Rules:
- No code until director says OK go on this specific domain.
- If a "discovery step" is called out for this domain in the brief,
  do that first and report findings before proposing gate logic —
  do not guess at implementation details.
- Structural gates: lint only, no runtime behavior change, wired
  into pre-ship/layers.js the same way dal.js is.
- Behavioral gates: director-ack env var pattern, same shape as
  dal-phase3-gate.js's PRE_SHIP_DAL_CONCURRENCY_OK — printed
  checklist, no auto-approval.
- New gate must be scoped (only runs when its domain's hot-path
  files are touched) — never a blanket check on every diff.
- Document the new gate in docs/ai/archive/dal-pre-ship-gates.md
  or a sibling handbook so it isn't DAL-specific in name only.
```

---

## Not in scope for this file

- Vector-mapped root-cause audit pipeline (separate larger campaign)  
- Station/RFID gates — `verify-station-split.js` already exists  
- DAL fork live-sync Gap 1 / H0–H5 — [multi-user-fork-industrial-and-auto.md](multi-user-fork-industrial-and-auto.md) · [bulletproof-multiuser-live-editors-2026-07-18.md](bulletproof-multiuser-live-editors-2026-07-18.md)
