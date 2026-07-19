# Prep PA live sync — industry standards + how we work (locked)

**Campaign:** [data-access-layer.md](data-access-layer.md)  
**Never-dos (code):** [FRAGILE_ZONES.md](../FRAGILE_ZONES.md) §§ timeline + prep PA + session UI  
**Incident science:** [dal-pa-live-sync-thrash.md](dal-pa-live-sync-thrash.md) · [dal-pa-delete-resurrect.md](dal-pa-delete-resurrect.md)  
**Sim:** `node scripts/dal-pa-live-sync-test.js` · core `scripts/lib/dal-pa-live-sync-core.js`

**Purpose:** Durable campaign doctrine for **warehouse prep multi-user live sync**. Not an incident log. Fresh agents read this **before** another prep live sync code change.

**Locked:** 2026-07-18 (industry harden + process) · **Stable baseline (director-confirmed):** GAS **v645** — session banner + fixture live sync held in multi-user smoke. Hosting `host-boot.js?v=635`.

**Canonical “how it works” (session + fixtures):** [FRAGILE_ZONES.md](../FRAGILE_ZONES.md) § DAL prep / timeline session UI · § DAL prep PA fork live sync.

---

## 1. Industry model we chose (and what we will not do)

Prep equipment list collab is **structured multiplayer editing** of a known entity set (fixture rows by UID) — same class as Figma/Linear/Notion block sync, **not** Google Docs character OT and **not** a blank-canvas CRDT.

| Approach | Who uses it | Fit for prep PA? |
|----------|-------------|------------------|
| **Server-ordered entity patch + LWW per entity** | Figma (partial), Linear, many product UIs | **Yes — our gold path.** One authoritative state, transactional merge of touch/delete maps, `writeSeq` total order. |
| **OT / CRDT (Yjs, Automerge)** | Google Docs, Figma text, collaborative freeform | **No for prep list.** Overkill; wrong conflict unit; huge rewrite; Sheets commit still needs a single snapshot. |
| **Full-document / full-collection last-write-wins** | Naive Firebase tutorials | **Never.** Equal-seq races → qty 4↔5 thrash (proved Cases A–C). |
| **Client-only “guards” without server order** | Ad-hoc holds/ignores | **Not sufficient alone.** Holds buy time; they do not create a total order. |

**Showrunner lock (matches timeline):**

1. Live authority = one doc `projects/{id}/assets/state` (`fixturesJson` + `writeSeq` + `clientId`).
2. Writes = host `runTransaction` patch: apply **only** touched UIDs + deleted UIDs.
3. Listen = that state doc (banner **`live sync (patch)`**). Collection docs are the END PREP commit mirror, not the live merge surface.
4. Own `clientId` echo skipped; stale `writeSeq` ignored; entity hold / recently-deleted block lagging resurrection.
5. Autos = local `recalcAutoContainers` only — never live-written.
6. Sheets = durable DB; Firebase = session buffer; GAS commits on END PREP.

If a future proposal conflicts with this table, **stop and ask the director** — do not silently reinvent the sync model.

---

## 2. Industry-aligned hardening backlog (definitions)

**What each H means** lives here. **Build order + checkboxes** live only on [multi-user-fork-industrial-and-auto.md](multi-user-fork-industrial-and-auto.md) Part A (locked 2026-07-19: **H0 testing → H1/H5 → Gap 1 → H4 → H3 → H2 → Part B**). **Process depth:** [bulletproof-multiuser-live-editors-2026-07-18.md](bulletproof-multiuser-live-editors-2026-07-18.md).

| ID | Standard | Why | Done when |
|----|----------|-----|-----------|
| **H0** | **Testing pipeline** | Green sims without documented scope caused false confidence (v628–v638). | Scope comments on every Case; mutation gate script; mode-seam sims; incident “attempts” field — see bulletproof Phase H0 |
| **H1** | **Fail closed on weak sync** | Multi-user prep must not silently run on GAS `live sync (server)` poll (2.5s lag + no txn). Banner must be **`patch`**, or show a hard warning / block edits. | **Done (v648):** `blocked` mode + Case K; timeline twin |
| **H2** | **Cheaper remote apply** | Full PA rebuild every snap causes stutter (same class as timeline strip thrash). Diff/merge then targeted redraw. | Remote qty/delete updates without full-list flash storms + measurable pass condition |
| **H3** | **Same-row conflict visibility** | Industry LWW still loses one edit; product should toast “overwritten by peer” on same UID race. | User sees when their row lost — **both** PA and timeline (no hedge) |
| **H4** | **State size + END PREP mirror check** | Large `fixturesJson` + collection drift = silent commit wrongness. Cap/warn; verify mirror before Sheets write. | END PREP refuses or alerts on mirror mismatch |
| **H5** | **Mutation-path inventory gate** | Every UI path that mutates `currentProjectAssets` during prep must note touch/delete. Silent splice = peer never sees change + resurrection later. | Mechanical gate in pre-ship (not only a manual table) |
| **H6** | **N-client + twin sims** | One browser + hope is not a proof. | **Absorbed into H0** on the hub — do not open a rival forever-checklist |

**Gap 1 (Firestore/GAS mode lint):** hub A3 + [dal-pre-ship-gates.md](dal-pre-ship-gates.md) — after H0 mode-seam sims.

**Explicit non-goals:** Yjs/Automerge rewrite; per-doc live LWW; inventing full-list diffs from local vs remote compare.

---

## 3. Why ~10 ships still broke (what we were missing)

The architecture landed (v635 state doc), but **process** stayed “symptom → guard → ship → next symptom.” That misses:

1. **Incomplete mutation coverage** — e.g. DEL → `removePa` never called `dalPaNoteDelete_` while other paths did. Architecture correct; **one UI path** still local-only.
2. **Heal paths that rewrite authority** — `dalPaSeedStateFromLocal_` touches *all* locals; empty/lagging snaps re-seed and **undo peer deletes**.
3. **Guards stacked without a failing test** — holds, ignore windows, banner latches fix one race and hide the next until director finds it in two browsers.
4. **No “all write paths” inventory** before each ship — only the path we were staring at got patched.
5. **Production proof ≠ unit Case B** — early sims passed while production still used non-txn equal-seq writes (Case C). Sim must model the **real** host write shape.

**Bottom line:** Fragility is not “Firebase is impossible.” It is **partial discipline** on a correct model, shipped as many thin repairs.

---

## 4. Better way to investigate and resolve (mandatory process)

**Full process (testing rules, adversarial sims, escalate on 3rd incident, rule-named milestones):**  
→ [bulletproof-multiuser-live-editors-2026-07-18.md](bulletproof-multiuser-live-editors-2026-07-18.md) Parts 1–2.

**Do not** ship another one-line guard without a failing sim (or path inventory) and a named root-cause rule. Short checklist below stays for floor debugging; do not re-expand this section into a second essay.

### 4.1 Stop rule (short)

1. **Summarize** → wait for **OK go**.  
2. **No code** until hypothesis list + one root cause + **failing sim or path inventory** in an incident file.  
3. Prefer **one root-cause ship** over layered guards.  
4. Third incident in the same zone → scoped hot-path sweep (see bulletproof §2.3).

### 4.2 Reproduce with evidence (short)

Banner both **`live sync (patch)`**? Name the UI control → mutator → `dalPaNoteTouch_` / `dalPaNoteDelete_`? → `PA_PATCH_WRITE` / `writeSeq`? → peer apply?

### 4.3 Prove before ship (short)

Failing Case → fix one rule → sim green (Case states scope + non-coverage) → two-browser smoke → FRAGILE only for durable rules.

### 4.4 Mutation inventory table (H5 data)

Every prep-time mutator of `currentProjectAssets` must be listed and marked. Mechanical gate: `scripts/dal-mutation-inventory-check.js` (wired in `pre-ship/dal.js`; timeline twin = hub A2 / H5).

| Mutator | Notes delete/touch? | Live flush? |
|---------|---------------------|-------------|
| `removePa` | **must** | via render |
| `removePaIndices` / `removePaGeneric` / `removePaGroup` / `deleteSelectedPa` | audit | |
| `modifyPaIndices` / qty helpers | touch or delete at zero | |
| `dalPaSeedStateFromLocal_` | special — seed once only | |
| Any splice / filter / assign in PA load / formula explode | must not invent silent live writes | |

If a path mutates without note → **bug**, not “edge case.”

### 4.5 Ship shape (short)

- Milestone names the **rule** fixed, not only the symptom.  
- Hosting deploy only if `host-boot.js` message types change.  
- New symptom → **new incident file** + “attempts before held” field.

---

## 5. Where knowledge lives (learn-from-mistakes loop)

| Layer | Doc | What belongs here |
|-------|-----|-------------------|
| **Never-dos (durable)** | [FRAGILE_ZONES.md](../FRAGILE_ZONES.md) §§ timeline + prep PA + session UI | Rules that must survive every future ship — silent remove, re-seed, full LWW, flush-from-apply |
| **Industry model + H definitions** | **This file** | Model lock (not CRDT), H0–H5 meanings |
| **Process depth** | [bulletproof-multiuser-live-editors-2026-07-18.md](bulletproof-multiuser-live-editors-2026-07-18.md) | Testing pipeline, fix approach, harden phases |
| **Campaign checklist** | [multi-user-fork-industrial-and-auto.md](multi-user-fork-industrial-and-auto.md) | Part A/B checkboxes + locked build order |
| **Incident science** | [dal-pa-live-sync-thrash.md](dal-pa-live-sync-thrash.md), [dal-pa-delete-resurrect.md](dal-pa-delete-resurrect.md) | What broke this week, hypotheses, proposed fix — archive when stable |
| **Campaign hub (DAL era)** | [data-access-layer.md](data-access-layer.md) | Status line + link to doctrine/incident |
| **Phase gate** | [dal-phase-safety-playbook.md](dal-phase-safety-playbook.md) | Fresh-chat stop rule before touching prep live |
| **Production log** | root `RELEASES.md` | **Only when a milestone ships** — one plain note + GAS version (what fixed, smoke) |
| **“This works” log** | root `WORKS_LOG.md` | **Only when director says “This works”** — Git checkpoint, not a substitute for FRAGILE |

**Rule:** A lesson is not “learned” until it is in **FRAGILE** (or this standards file for process). Shipping without updating FRAGILE/RELEASES repeats the thrash. Do **not** dump process essays into `WORKS_LOG` / `RELEASES` — those stay short operational records that **point** at the docs above.

---

## 6. Stable baseline (director-confirmed)

**GAS v645** (2026-07-18) — prep session banner + fixture live sync stable in director multi-user smoke.

Incidents closed into FRAGILE definition: [dal-pa-live-sync-thrash.md](dal-pa-live-sync-thrash.md), [dal-pa-delete-resurrect.md](dal-pa-delete-resurrect.md).  

**Next campaign:** [multi-user-fork-industrial-and-auto.md](multi-user-fork-industrial-and-auto.md) — **H0 testing → bulletproof H1–H5 + Gap 1 → Part B auto fork**. Process: [bulletproof-multiuser-live-editors-2026-07-18.md](bulletproof-multiuser-live-editors-2026-07-18.md).
