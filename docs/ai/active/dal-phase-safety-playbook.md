# DAL campaign — Phase Safety Playbook (read before Phase 1+)

**Campaign:** [data-access-layer.md](data-access-layer.md) · **Design lock:** [dal-firebase-design-lock-2026-07-13.md](dal-firebase-design-lock-2026-07-13.md) · **Phase 0 report:** [dal-phase0-discovery-2026-07-13.md](dal-phase0-discovery-2026-07-13.md) · **Pre-ship gates:** [dal-pre-ship-gates.md](dal-pre-ship-gates.md)

This document is written so a **fresh chat** (no context from prior sessions) can safely execute DAL phases without breaking fragile systems.

---

## Core principle

DAL work must be done as **narrow slices** with **hard preflight + postflight sweeps**. Each phase has:

1. **Scope lock** (what files/functions are allowed to change)
2. **Preflight sweep** (docs + fragile zones + code touchpoints)
3. **Implementation** (smallest behavior-preserving change)
4. **Postflight sweep + test plan** (prove nothing broke)
5. **Ship discipline** (milestone + director smoke tests) only when code ships

---

## Hard “do not break” list (DAL context)

From `FRAGILE_ZONES.md` and DAL design lock:

- **Project Assets engine**: do not reimplement `processFormulas()` logic or the “qty=1 burst for physical” rule; DAL wraps persistence boundaries.
- **Auto-Packing vs Auto-Containerization**: DAL must not merge these engines or move logic across files.
- **UID rules / optimistic healing**: no changes that introduce duplicate `uid`s or change clone behavior.
- **Boot / build pipeline**: do not introduce Node-only scripts into GAS; keep `gas-node-only.js` correct.
- **Session bridge** (hosting shell ↔ GAS iframe): DAL changes must not touch session token handoff unless explicitly in scope.

---

## Security measures (phase-by-phase)

These are not “security theater” — they are the minimum guardrails for a large refactor.

### Mandatory before any Phase 1+ code

- **No new write paths**: If a phase introduces a second way to write the same data (old path + new path), stop. Route through one boundary only.
- **No secrets in repo**: Do not add Firebase private keys / service account JSON / `.env` secrets to source control. Public config only.
- **Review gates**:
  - If touching auth/session/permissions or hosting shell: run a **security-focused review** before ship.
  - If touching 5+ files or fragile zones: run a **diff review** (Bugbot-style) before ship.

### After each phase

- Re-run a quick scan for **new `SpreadsheetApp` calls** in feature code (they should move toward repo boundaries, not spread).
- Confirm no new `clearContents()` / whole-tab rewrites were added outside the known boundaries.
- **Pre-ship (automated):** when DAL hot paths change — see **[dal-pre-ship-gates.md](dal-pre-ship-gates.md)** (canonical handbook; do not duplicate gate details here).

---

## Pre-ship vs DAL safety (summary)

Gaps closed 2026-07-15 — full detail in [dal-pre-ship-gates.md](dal-pre-ship-gates.md):

- Client inventory + persistence lint + Phase 3 deploy gate → **automated**
- Reconciliation / failed-writes → **Phase 5** (deferred)

---

## Phase execution protocol (fresh chat checklist)

### Step 0 — Read (always)

Read, in order:

1. `docs/ai/active/data-access-layer.md`
2. `docs/ai/active/dal-firebase-design-lock-2026-07-13.md`
3. `docs/ai/active/dal-phase0-discovery-2026-07-13.md`
4. `docs/ai/active/dal-pre-ship-gates.md` (if touching hot paths or shipping DAL work)
5. `docs/ai/FRAGILE_ZONES.md` (relevant zones)
6. `docs/ai/ARCHITECTURE.md` (deploy pipeline + optimistic healing)
7. `docs/ai/FILE_MAP.md` (where functions live)

Then write a **scope lock** for the phase (files + functions).

### Step 1 — Preflight sweep (per phase)

For the files in scope:

- List the **write boundaries** you are changing (e.g. `saveProjectAssetsDelta`, `saveTimelineData`, `batchProcessOperations`).
- Identify which fragile zones apply (copy the zone names, not the whole doc).
- Run targeted searches:
  - `clearContents(`, `setValues(`, `appendRow(`, `getDataRange().getValues()`
  - `SpreadsheetApp.` (direct calls)
  - client `google.script.run.*` callers for the touched server functions
- Record findings in a short “preflight note” inside the phase section below.

### Step 2 — Implement (smallest correct change)

- Phase 1–2 are allowed to be **pure refactor** (wrap existing behavior), but must not change outputs.
- Phase 3 is allowed to change persistence behavior — but must be proven with concurrency smoke tests.

### Step 3 — Postflight sweep (per phase)

- Confirm the touched functions still exist and are called from the same client entry points.
- Confirm **no new** full-tab rewrites were introduced outside the known boundaries.
- Update docs:
  - `docs/ai/active/data-access-layer.md` checklist
  - relevant topic stubs (session fork / cache) if the interface moved
  - `FILE_MAP.md` only if a new module/file is created

### Step 4 — Test plan and ship rule

- If code shipped: run `node milestone.js "<descriptive note>"` and report GAS version.
- Always give the director a **UI smoke checklist** (web.app).

---

## Phase-by-phase guardrails

### Phase 1 — Repo interfaces + SheetsAdapter (zero behavior change)

**Goal:** Introduce repo seams without changing save semantics (full-tab rewrites remain inside adapter for now).

**Allowed to change:**
- Add new repo modules/files
- Add adapter wrapper code that delegates to existing functions
- Update call sites to use repo methods (no behavioral change)

**Not allowed:**
- Changing write semantics
- Changing sheet schemas
- Introducing Firebase code

**Preflight note (2026-07-15, Slice A):** Phase 1 inventory complete in [data-access-layer.md § Phase 1 preflight](data-access-layer.md#phase-1-preflight--inventory-2026-07-15). Hot-path searches: `clearContents(` in `Logistics_Assets.js:88`, `Logistics_Timeline.js:67`, `Operations.js:210`; client callers unchanged in Slice A. No `SpreadsheetApp` in feature HTML. Slice A adds `Dal_Repos.js` only — existing public GAS functions remain entry points.

**Postflight test plan (Slice A):** `node build.js` succeeds; login smoke on web.app unchanged; no client `google.script.run` renames; pre-ship DAL gates run on new `Dal_Repos.js` only (no hot-path persistence change). **Shipped:** GAS v577+ after Slice A milestone.

---

### Phase 2 — Router + inventory tables (Sheets only)

**Goal:** Centralize routing decisions (still Sheets only) so later Firebase becomes a single switch.

**Hard requirement:** reconcile Firestore path conventions in docs (do not implement both).

---

### Phase 3 — Delta-only saves (gate before Firebase)

**Goal:** Remove whole-tab rewrites for the hot paths:
- `saveProjectAssetsDelta`
- `saveTimelineData`
- `batchProcessOperations` (or replace ledger write strategy)

**Mandatory tests (minimum):**
- Two managers editing the same project assets simultaneously → no silent overwrite
- Timeline save while another user changes timeline → deterministic conflict behavior (visible)
- Two separate checkout sessions running → ledger integrity preserved

---

### Phase 4 — FirebaseAdapter + session open/close lifecycle

**Goal:** Introduce Firebase only after Phase 3 is proven.

**Security note:** This is the phase where secrets and permissions mistakes can happen. Keep Firebase config public-only and document paths + rules.

---

### Phase 5 — Reconciliation + failed-writes pocket

**Goal:** Make commit-out trustworthy and loud on failure (manager alert).

---

### Phase 6 — CacheCoordinator

**Goal:** One isolated public API (`check`, `set`, `invalidate`, `registerPolicy`) and tag-based invalidation. Cache rides the router backend.

---

## When to run a “full sweep”

After each shipped phase, run a doc/code sweep limited to DAL touchpoints:

- `docs/ai/active/*dal*`
- `docs/ai/FRAGILE_ZONES.md` (zones touched)
- `docs/ai/ARCHITECTURE.md` (if pipeline changed)
- `docs/ai/FILE_MAP.md` (if new files added)

Do **not** trigger a global “hygiene sweep” unless the director asked.

