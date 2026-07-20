# DAL pre-ship gates — agent handbook

**Canonical home** for DAL-specific mechanical gates. General pre-ship (layers, Bugbot): [PRE_SHIP_PIPELINE.md](../PRE_SHIP_PIPELINE.md).

**Campaign:** [data-access-layer.md](data-access-layer.md) · **Phase safety:** [dal-phase-safety-playbook.md](dal-phase-safety-playbook.md) · **Server discovery:** [dal-phase0-discovery-2026-07-13.md](dal-phase0-discovery-2026-07-13.md)

**Opened:** 2026-07-15 · **Status:** **ARCHIVED** with DAL campaign — gates still run in pre-ship; this file is the handbook. Inventory: [../dal-client-inventory.md](../dal-client-inventory.md).

---

## Why this exists (fresh-chat context)

Before DAL Phase 1 code, Showrunner had four **pre-ship vs DAL** gaps:

| Gap | Status | Mechanism |
|-----|--------|-----------|
| Incomplete Phase 0 **client** inventory | **Closed** | `scripts/dal-client-inventory.js` → [dal-client-inventory.md](dal-client-inventory.md) |
| **Concurrency tests** manual only | **Gated** | `scripts/dal-phase3-gate.js` + `PRE_SHIP_DAL_CONCURRENCY_OK=1` on deploy when delta-only ships |
| **Reconciliation / failed-writes** | **Deferred** | DAL **Phase 5** product work — not automatable in pre-ship |
| DAL-specific **persistence lint** | **Closed** | `scripts/dal-persistence-lint.js` |

**Do not** re-implement these checks ad hoc in chat — use the scripts wired into `pre-ship/layers.js`.

---

## When gates run

DAL gates are **scoped** — they run inside the **gas** pre-ship layer only when the change set touches a **DAL hot path**.

**Detection code:** `pre-ship/dal.js` → `dalTouched(changedFiles)`

**Hot-path patterns** (file path or basename match):

| Pattern | Examples |
|---------|----------|
| `Logistics_*.js` | `Logistics_Assets.js`, `Logistics_Timeline.js` |
| `Operations.js` | Ledger / checkout batch path |
| `Resources_Core.js` | Shared sheet gateway (when touched) |
| `02*_Project*` | PA modal, project editor, operations UI |
| `02e*_Logic*` | PA sync, state, save callers |
| `02c_Project_Operations` | Checkout / `batchProcessOperations` client |
| `03a_Timeline*` | Timeline boot + save callers |
| `docs/ai/archive/dal-*` · `docs/ai/dal-client-inventory.md` | Campaign docs + generated inventory |

**Skipped when:** diff is docs-only outside `dal-*`, cosmetic UI with no hot paths, station-only work, etc.

**Preview:**

```bash
node pre-ship.js --list          # see layers + changed files
node pre-ship.js --dry-run       # see if DAL gates would run
```

**Force full DAL gate chain (debug):**

```bash
node -e "require('./pre-ship/dal').runDalGates({ forDeploy: false })"
```

---

## Gate chain (order)

Wired from `pre-ship/layers.js` → `runDalGates()`:

```text
1. scripts/dal-persistence-lint.js
2. scripts/dal-client-inventory.js --check
3. scripts/dal-phase3-gate.js [--deploy]
4. scripts/dal-pa-live-sync-test.js          # Cases A–V (scope + mode seam + H2/H3/H4)
5. scripts/dal-mutation-inventory-check.js     # PA touch/delete notes
6. scripts/dal-tl-mutation-inventory-check.js  # timeline dalTlNote* (H5 twin)
7. scripts/dal-sync-mode-lint.js               # Gap 1 Firestore vs GAS (#10/#11)
```

---

## Script reference

### `scripts/dal-persistence-lint.js`

**Enforces:**

- **Client HTML** (root `*.html`): **no** `SpreadsheetApp`, **no** `.clearContents(`.
- **Server JS** (root `*.js`): `.clearContents(` only in **allowlist** inside `dal-persistence-lint.js`.

**Phase 3 targets** (reported, not failed): `Logistics_Assets.js`, `Logistics_Timeline.js`, `Operations.js` — still use full-tab rewrite until Phase 3 ships.

**Agent fixes:**

| Failure | Action |
|---------|--------|
| Client HTML has `SpreadsheetApp` | Move logic to GAS; client calls `google.script.run` only |
| Client HTML has `clearContents` | Same — server adapter only |
| New server file uses `clearContents` | Either refactor to delta (Phase 3) or add to allowlist **only** if director approves a legitimate new boundary |

**Run standalone:** `node scripts/dal-persistence-lint.js`

---

### `scripts/dal-client-inventory.js`

**Purpose:** Phase 0/1 **client call inventory** — every `google.script.run` server function and `localStorage` key across root HTML modules.

**Output:** [dal-client-inventory.md](dal-client-inventory.md) (generated — **do not hand-edit**).

**Parser:** walks `google.script.run` chains, skips `withSuccessHandler` / `withFailureHandler` / `withUserObject`, extracts the terminal server function.

| Command | When |
|---------|------|
| `node scripts/dal-client-inventory.js` | After adding/changing client `google.script.run` or `localStorage` keys |
| `node scripts/dal-client-inventory.js --check` | Pre-ship — fails if generated file is stale (SHA mismatch) |

**Agent workflow when pre-ship fails on inventory:**

1. Run `node scripts/dal-client-inventory.js`
2. Commit `docs/ai/dal-client-inventory.md` with the code change (if director asked for commit)
3. Re-run ship / pre-ship

**Use inventory for:** Phase 1 touchpoint tables, finding all callers of `saveProjectAssetsDelta`, `batchProcessOperations`, `saveTimelineData`, cache key migration (Phase 6).

---

### `scripts/dal-phase3-gate.js`

**Purpose:** Block production deploy when **delta-only** saves ship without director concurrency smoke.

**Inspects** function bodies for:

| File | Function |
|------|----------|
| `Logistics_Assets.js` | `saveProjectAssetsDelta` |
| `Logistics_Timeline.js` | `saveTimelineData` |
| `Operations.js` | `batchProcessOperations` |

| Status in body | Gate behavior |
|----------------|---------------|
| Still has `.clearContents(` inside function | **full-rewrite** — gate passes (expected today) |
| No `clearContents` in function body | **delta-only** — on `--deploy`, requires `PRE_SHIP_DAL_CONCURRENCY_OK=1` |

**Director concurrency smoke** (when delta-only lands):

1. Two managers, same project PA — different lines — save → no silent overwrite
2. Two users, timeline, ~2s apart → conflict visible (not silent)
3. Two checkout sessions, different projects → ledger rows intact

**Deploy ack:**

```powershell
$env:PRE_SHIP_DAL_CONCURRENCY_OK=1; node milestone.js "Phase 3 delta-only: …"
```

**Run standalone:** `node scripts/dal-phase3-gate.js` or `node scripts/dal-phase3-gate.js --deploy`

---

## Environment variables

| Variable | Set when | Meaning |
|----------|----------|---------|
| `PRE_SHIP_BUGBOT_OK=1` | Bugbot required and passed | Clears Bugbot gate (all ships) — see [PRE_SHIP_PIPELINE.md](../PRE_SHIP_PIPELINE.md) |
| `PRE_SHIP_DAL_CONCURRENCY_OK=1` | Phase 3 delta-only deploy | Director completed concurrency smoke |

Also documented in [GLOSSARY.md](../GLOSSARY.md) § Pre-ship gates.

---

## Bugbot integration

When Logistics / Operations hot paths change, `pre-ship/bugbot-policy.js` adds a **Custom Instructions** hint:

> DAL hot path: verify save boundaries, no new clearContents in client HTML, Phase 3 concurrency if delta-only.

**Fragile patterns** already include: `Logistics_Assets.js`, `Logistics_Timeline.js`, `Operations.js`, `02e5_Logic_Sync.html`.

---

## Agent checklist — touching DAL hot paths

1. Read [dal-phase-safety-playbook.md](dal-phase-safety-playbook.md) Step 0 (design lock + discovery + FRAGILE_ZONES).
2. Implement smallest behavior-preserving slice (Phase 1 = wrap only).
3. If client calls changed → `node scripts/dal-client-inventory.js`.
4. `node pre-ship.js --dry-run` — confirm DAL gates in plan.
5. If Bugbot **require** → run Bugbot before ship.
6. Ship via `node milestone.js` (gates run automatically).
7. Update [data-access-layer.md](data-access-layer.md) checklist + [Project_TODO.md](../Project_TODO.md) index row.

**Phase 1 code** still requires director **OK go** — gates do not replace that approval.

---

## Files map

| Path | Role |
|------|------|
| `pre-ship/dal.js` | `dalTouched()`, `runDalGates()`, `DAL_HOT_PATTERNS` |
| `pre-ship/layers.js` | Calls DAL gates inside `runGasLayer()` |
| `pre-ship/detect.js` | Re-exports `dalTouched` |
| `pre-ship/bugbot-policy.js` | DAL hints + fragile patterns |
| `scripts/dal-client-inventory.js` | Generate / check client inventory |
| `scripts/dal-persistence-lint.js` | Client/server persistence lint |
| `scripts/dal-phase3-gate.js` | Delta-only deploy gate |
| `scripts/dal-pa-live-sync-test.js` | PA live-sync Cases A–V (pure sim; H2 Case V) |
| `scripts/dal-mutation-inventory-check.js` | PA mutators must note touch/delete |
| `scripts/dal-tl-mutation-inventory-check.js` | Timeline mutators must note dalTlNote* |
| `scripts/dal-sync-mode-lint.js` | Gap 1 — Firestore vs GAS mode structural lint |
| `docs/ai/dal-client-inventory.md` | Generated inventory artifact |

All scripts are **Node-only** (`gas-node-only.js`) — never deployed to GAS.

---

## Gap 1: Firestore / GAS sync-mode lint ✅

**Status:** Shipped — hub [multi-user-fork A3](multi-user-fork-industrial-and-auto.md).  
**H0 prerequisite:** Case H in `scripts/dal-pa-live-sync-test.js` (`shouldApplyGasPaList`).

**Risk:** Firestore live path and GAS poll/full-save path must never cross-write. Documented “don’t” (#10/#11 in live-sync standards / FRAGILE) is not enough — a future edit can reintroduce LWW thrash or wipe `writeSeq` stamps.

**Script:** `scripts/dal-sync-mode-lint.js` — wired in `pre-ship/dal.js` (detection only):

- Ban `saveProjectAssets(` / `saveTimelineData(` call sites in live client modules (`02e7`, `03a2`) unless `// DAL-SYNC-MODE-ALLOW: reason`
- Ban live-flush bodies from Sheets-save fallback
- Flag GAS `res.current` / `data.shifts` fed into live apply helpers without firestore-mode early return or `writeSeq`/`docWriteSeq`
- Assert `shouldApplyGasPaList` still rejects `firestore` mode

**Also shipped (hub A0 + A2/H5):** `scripts/dal-mutation-inventory-check.js` (PA) + `scripts/dal-tl-mutation-inventory-check.js` (timeline twin).

**Other domains (RBAC, FCM, truck, financials):** [pre-ship-pipeline-expansion-2026-07-18.md](pre-ship-pipeline-expansion-2026-07-18.md) — parallel board, not this Gap 1.

---

## What gates do *not* cover

- **Phase 5 reconciliation** / `failed_writes` pocket — product code, not lint
- **Firebase session fork** — blocked until Phase 4 after Phase 3 gate passes
- **Runtime sheet data shape** — manual smoke on web.app
- **Replacing full-tab rewrite** — Phase 3 implementation work, not pre-ship alone

---

## Related docs (read order for DAL work)

1. [dal-firebase-design-lock-2026-07-13.md](dal-firebase-design-lock-2026-07-13.md)
2. [data-access-layer.md](data-access-layer.md)
3. [../archive/dal-phase0-discovery-2026-07-13.md](../archive/dal-phase0-discovery-2026-07-13.md)
4. **This file** — pre-ship mechanics
5. [dal-phase-safety-playbook.md](dal-phase-safety-playbook.md) — phase preflight/postflight
6. [PRE_SHIP_PIPELINE.md](../PRE_SHIP_PIPELINE.md) — full ship pipeline + Bugbot
