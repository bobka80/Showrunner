# Prep PA live sync — industry standards + how we work (locked)

**Campaign hub (checkboxes + floor scope):** [../active/multi-user-fork-industrial-and-auto.md](../active/multi-user-fork-industrial-and-auto.md)  
**DAL era hub (archived):** [data-access-layer.md](data-access-layer.md)  
**Never-dos (code):** [FRAGILE_ZONES.md](../FRAGILE_ZONES.md) §§ timeline + prep PA + session UI  
**Incident science:** [dal-pa-live-sync-thrash.md](dal-pa-live-sync-thrash.md) · [dal-pa-delete-resurrect.md](dal-pa-delete-resurrect.md)  
**Sim:** `node scripts/dal-pa-live-sync-test.js` · core `scripts/lib/dal-pa-live-sync-core.js`

**Purpose:** Durable doctrine for **warehouse prep multi-user live sync** (archived with DAL; floor work continues on multi-user hub). Not an incident log. Fresh agents read this **before** another prep live sync code change.

**Locked:** 2026-07-18 (industry harden + process) · **Prep live rollback / production (director 2026-07-19):** GAS **v654** + hosting `host-boot.js?v=653`. **Floor workflow:** [../active/multi-user-fork-industrial-and-auto.md § Warehouse prep — real multi-user scope](../active/multi-user-fork-industrial-and-auto.md) — search/formula batch absolute upserts **primary**; floor +/- combine **secondary**.

**Canonical “how it works” (session + fixtures):** [FRAGILE_ZONES.md](../FRAGILE_ZONES.md) § DAL prep / timeline session UI · § DAL prep PA fork live sync.

---

## 1. Industry model we chose (and what we will not do)

Prep equipment list collab is **structured multiplayer editing** of a known entity set (fixture rows by UID) — same class as Figma/Linear/Notion block sync, **not** Google Docs character OT and **not** a blank-canvas CRDT.

**Product scope first:** agents must internalize the campaign § **Warehouse prep — real multi-user scope** before any qty-merge tweak. The search bar is an **add engine**; one Enter can create a large sublist with absolute qtys while peers pack, delete, and check out.

| Approach | Who uses it | Fit for prep PA? |
|----------|-------------|------------------|
| **Server-ordered entity patch + field-aware merge** | Figma (partial), Linear, inventory UIs | **Yes — our gold path.** One authoritative state, transactional touch/delete maps, `writeSeq` total order. **Primary:** absolute upsert of touched UIDs (batch add / formula / pack fields). **Secondary:** same-UID floor +/- may use commutative deltas. Other fields **LWW per UID**. |
| **“Increments are the sync model”** | Counter APIs only | **No — wrong product.** +/- is a byproduct of list truth. Designing only for +1/+10 fails search/formula batch adds. |
| **Absolute qty LWW on every touch** | Naive “patch the whole row” | **Bad for concurrent same-row floor +/-** (v653). **Required** for intentional batch/search absolute creates and many typed sets — publish the entity state the user meant. |
| **OT / CRDT (Yjs, Automerge)** | Google Docs, Figma text, collaborative freeform | **No for prep list.** Overkill; wrong conflict unit; huge rewrite; Sheets commit still needs a single snapshot. |
| **Full-document / full-collection last-write-wins** | Naive Firebase tutorials | **Never.** Equal-seq races → qty 4↔5 thrash (proved Cases A–C). |
| **Client-only “guards” without server order** | Ad-hoc holds/ignores | **Not sufficient alone.** Holds buy time; they do not create a total order. Flash-then-revert = client reconciliation lying about server truth. |

### Sync context notes (v653 and after) — secondary to floor scope

| Concern | Rule |
|---------|------|
| **Primary live ops** | Touch/delete maps carry **new and changed fixtures** (absolute fields as written by search/formula/CRUD/pack). Peers must apply full batches; UI must not revert to pre-batch. |
| **Same-row floor +/-** | May send **qty deltas** vs last-acked originals; host `remote.qty + delta` so concurrent taps combine (Case O). Do **not** treat this as the standard operation. |
| **Other fields** | LWW per UID under `writeSeq`. |
| **UI vs server** | Apply `result.merged` after PA_PATCH OK; never let stale requeue/hold/heal yank below newer `writeSeq`. |
| **Autos** | Local `recalcAutoContainers` / cable auto-pack phantoms only — never live-written. |

**Showrunner lock (prep PA):**

1. Live authority = one doc `projects/{id}/assets/state` (`fixturesJson` + `writeSeq` + `clientId`).
2. Writes = host `runTransaction` patch: apply **only** touched UIDs + deleted UIDs (absolute row payload for upserts; optional `qtyDeltas` for concurrent +/-).
3. Listen = that state doc (banner **`live sync (patch)`**). Collection docs are the END PREP commit mirror, not the live merge surface.
4. Own `clientId` echo: ack seq, then ensure UI matches **txn-merged** fixtures (not local-only echo). Stale `writeSeq` ignored; entity hold / recently-deleted block lagging resurrection.
5. Autos = local only — never live-written.
6. Sheets = durable DB; Firebase = session buffer; GAS commits on END PREP.

**Timeline twin note:** Timeline strips remain **entity LWW**. Do not blindly copy prep qty-delta rules onto timeline.

If a future proposal conflicts with the campaign **floor scope** section or this table, **stop and ask the director** — do not silently reinvent the sync model.

---

## 2. Industry-aligned hardening backlog (definitions)

**What each H means** lives here. **Build order + checkboxes** live only on [multi-user-fork-industrial-and-auto.md](multi-user-fork-industrial-and-auto.md) Part A (locked 2026-07-19: **H0 testing → H1/H5 → Gap 1 → H4 → H3 → H2 → Part B**). **Process depth:** [bulletproof-multiuser-live-editors-2026-07-18.md](bulletproof-multiuser-live-editors-2026-07-18.md).

| ID | Standard | Why | Done when |
|----|----------|-----|-----------|
| **H0** | **Testing pipeline** | Green sims without documented scope caused false confidence (v628–v638). | Scope comments on every Case; mutation gate script; mode-seam sims; incident “attempts” field — see bulletproof Phase H0 |
| **H1** | **Fail closed on weak sync** | Multi-user prep must not silently run on GAS `live sync (server)` poll (2.5s lag + no txn). Banner must be **`patch`**, or show a hard warning / block edits. | **Done (v648):** `blocked` mode + Case K; timeline twin |
| **H2** | **Cheaper remote apply** | Full PA rebuild every snap causes stutter (same class as timeline strip thrash). Diff/merge then targeted redraw. | **Done:** qty-only ≤ max(3,5%) → DOM patch; timeline ≤5 shift-only → in-place; Case V (`dal-remote-apply-diff-core.js`) |
| **H3** | **Same-row conflict visibility** | Non-qty fields (and timeline strips) are still LWW — one edit can lose. Qty floor +/- **combines** (v653); toast is for **lost non-qty / strip** races, not for combined qty. | **Done** — PA + timeline watch/toast (overwrite + peer delete of watched); Case T; qty-only ignored |
| **H4** | **State size + END PREP mirror check** | Large `fixturesJson` + collection drift = silent commit wrongness. Cap/warn; verify mirror before Sheets write. | **Done:** WARN 512KiB/1500 · MAX 900KiB/4000; END PREP mirror alert + state SSOT; Case S |
| **H5** | **Mutation-path inventory gate** | Every UI path that mutates `currentProjectAssets` during prep must note touch/delete. Silent splice = peer never sees change + resurrection later. | Mechanical gate in pre-ship (not only a manual table) |
| **H6** | **N-client + twin sims** | One browser + hope is not a proof. | **Absorbed into H0** on the hub — do not open a rival forever-checklist |

**Gap 1 (Firestore/GAS mode lint):** hub A3 + [dal-pre-ship-gates.md](dal-pre-ship-gates.md) — after H0 mode-seam sims.

**Explicit non-goals:** Yjs/Automerge rewrite; per-doc live LWW; inventing full-list diffs from local vs remote compare; redesigning prep sync as an increment-only API; ignoring campaign **floor scope** (search/formula batch adds).

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
| **Industry model + H definitions** | **This file** | Model lock (not CRDT); points at campaign **floor scope**; H0–H5 meanings |
| **Floor workflow (product)** | [multi-user-fork-industrial-and-auto.md](multi-user-fork-industrial-and-auto.md) § Warehouse prep — real multi-user scope | Search/formula batch adds, pack, RFID, delete — do not divert |
| **Process depth** | [bulletproof-multiuser-live-editors-2026-07-18.md](bulletproof-multiuser-live-editors-2026-07-18.md) | Testing pipeline, fix approach, harden phases |
| **Campaign checklist** | [multi-user-fork-industrial-and-auto.md](multi-user-fork-industrial-and-auto.md) | Part A/B checkboxes + locked build order |
| **Incident science** | [../archive/dal-pa-live-sync-thrash.md](../archive/dal-pa-live-sync-thrash.md), [../archive/dal-pa-delete-resurrect.md](../archive/dal-pa-delete-resurrect.md) | What broke this week, hypotheses, proposed fix — archive when stable |
| **Campaign hub (DAL era)** | [data-access-layer.md](data-access-layer.md) | Status line + link to doctrine/incident |
| **Phase gate** | [dal-phase-safety-playbook.md](dal-phase-safety-playbook.md) | Fresh-chat stop rule before touching prep live |
| **Production log** | root `RELEASES.md` | **Only when a milestone ships** — one plain note + GAS version (what fixed, smoke) |
| **“This works” log** | root `WORKS_LOG.md` | **Only when director says “This works”** — Git checkpoint, not a substitute for FRAGILE |

**Rule:** A lesson is not “learned” until it is in **FRAGILE** (or this standards file for process). Shipping without updating FRAGILE/RELEASES repeats the thrash. Do **not** dump process essays into `WORKS_LOG` / `RELEASES` — those stay short operational records that **point** at the docs above.

---

## 6. Stable baseline (director-confirmed)

**GAS v654** (2026-07-19) + hosting **`host-boot.js?v=653`** — **prep live rollback**. Floor scope + batch absolute upsert SSOT + no flash-then-revert (Case P) + noteTouch pack/CLI paths. Director: this is the known-good to restore if later ships break prep multi-user.

**History (do not use as rollback unless director says so):**
- **v645** — session banner + early fixture live smoke  
- **v653** — heal + same-row +/- deltas (Case O)  

Incidents closed into FRAGILE: [../archive/dal-pa-live-sync-thrash.md](../archive/dal-pa-live-sync-thrash.md), [../archive/dal-pa-delete-resurrect.md](../archive/dal-pa-delete-resurrect.md).  

**Campaign:** [multi-user-fork-industrial-and-auto.md](multi-user-fork-industrial-and-auto.md) — **Part A complete** (H0–H5 + Gap 1 + A7) → **middle campaign** → Part B. Process: [bulletproof-multiuser-live-editors-2026-07-18.md](bulletproof-multiuser-live-editors-2026-07-18.md).
