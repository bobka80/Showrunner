# Prep PA live sync — industry standards + how we work (locked)

**Campaign:** [data-access-layer.md](data-access-layer.md)  
**Never-dos (code):** [FRAGILE_ZONES.md](../FRAGILE_ZONES.md) §§ timeline + prep PA + session UI  
**Incident science:** [dal-pa-live-sync-thrash.md](dal-pa-live-sync-thrash.md) · [dal-pa-delete-resurrect.md](dal-pa-delete-resurrect.md)  
**Sim:** `node scripts/dal-pa-live-sync-test.js` · core `scripts/lib/dal-pa-live-sync-core.js`

**Purpose:** Durable campaign doctrine for **warehouse prep multi-user live sync**. Not an incident log. Fresh agents read this **before** another prep live sync code change.

**Locked:** 2026-07-18 (director: document industry harden + stop thrash-by-patch)

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

## 2. Industry-aligned hardening backlog (ordered)

Do these **after** the current delete/seed holes are closed. Placement: polish after Slice D / Phase 5–6 product work, not a rewrite.

| ID | Standard | Why | Done when |
|----|----------|-----|-----------|
| **H1** | **Fail closed on weak sync** | Multi-user prep must not silently run on GAS `live sync (server)` poll (2.5s lag + no txn). Banner must be **`patch`**, or show a hard warning / block edits. | Two browsers cannot edit live list while either is on `server` without an explicit banner |
| **H2** | **Cheaper remote apply** | Full PA rebuild every snap causes stutter (same class as timeline strip thrash). Diff/merge then targeted redraw. | Remote qty/delete updates without full-list flash storms |
| **H3** | **Same-row conflict visibility** | Industry LWW still loses one edit; product should toast “overwritten by peer” on same UID race. | User sees when their row lost |
| **H4** | **State size + END PREP mirror check** | Large `fixturesJson` + collection drift = silent commit wrongness. Cap/warn; verify mirror before Sheets write. | END PREP refuses or alerts on mirror mismatch |
| **H5** | **Mutation-path inventory gate** | Every UI path that mutates `currentProjectAssets` during prep must note touch/delete. Silent splice = peer never sees change + resurrection later. | Checklist + grep gate in pre-ship (see §3) |
| **H6** | **N-client + twin sims before “many users safe”** | One browser + hope is not a proof. Extend Cases A–D with delete/resurrect, seed-stomp, 3-client, and a timeline-twin check. | Sim green required before claiming live prep stable |

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

Use this for **any** future prep live sync bug. Do **not** ship another one-line guard without §4.2–4.4.

### 4.1 Stop rule

If the director reports multi-user prep thrash / resurrect / banner flip:

1. **Summarize** understanding → wait for **OK go**.
2. **No code** until a written hypothesis list + one chosen root cause + a **failing sim or path inventory** exists in an active incident file.
3. Prefer **one root-cause ship** over three layered guards.

### 4.2 Reproduce with evidence (not vibes)

| Check | Pass criteria |
|-------|----------------|
| Banner | Both browsers **`live sync (patch)`** — if either is `server`, that *is* the first bug |
| Action | Name the UI control (DEL / minus / START PREP / END PREP) |
| Path | Grep which function mutates assets (`removePa`, `modifyPaIndices`, …) |
| Note? | Did that function call `dalPaNoteTouch_` / `dalPaNoteDelete_`? |
| Host | Did `PA_PATCH_WRITE` run? Did `writeSeq` advance? |
| Peer | Did peer apply that seq and drop/update the UID? |

Director can help with: banner text + “I pressed DEL on a unique row” vs “grouped DEL”.

### 4.3 Prove before ship

1. Add or extend a **Case** in `dal-pa-live-sync-test.js` that **fails** on the bug (delete/resurrect, seed-stomp, equal-seq, …).
2. Fix the **single** missing discipline (note delete, ban re-seed, txn already present, …).
3. Sim must pass; then smoke on web.app (two browsers).
4. Update FRAGILE never-dos only for **durable** rules, not one-off symptoms.

### 4.4 Mutation inventory (H5) — run before claiming “deletes work”

Every prep-time mutator of `currentProjectAssets` must be listed and marked:

| Mutator | Notes delete/touch? | Live flush? |
|---------|---------------------|-------------|
| `removePa` | **must** | via render |
| `removePaIndices` / `removePaGeneric` / `removePaGroup` / `deleteSelectedPa` | audit | |
| `modifyPaIndices` / qty helpers | touch or delete at zero | |
| `dalPaSeedStateFromLocal_` | special — seed once only | |
| Any splice / filter / assign in PA load / formula explode | must not invent silent live writes | |

If a path mutates without note → **bug**, not “edge case.”

### 4.5 Ship shape

- One milestone theme: e.g. “prep delete notes + seed once” — not “misc live sync guards.”
- Hosting deploy only if `host-boot.js` message types change.
- Smoke script in the incident file; director confirms on web.app.
- If a new symptom appears, **new incident file** — do not pile anonymous guards onto the last fix.

---

## 5. Where knowledge lives (learn-from-mistakes loop)

| Layer | Doc | What belongs here |
|-------|-----|-------------------|
| **Never-dos (durable)** | [FRAGILE_ZONES.md](../FRAGILE_ZONES.md) §§ timeline + prep PA + session UI | Rules that must survive every future ship — silent remove, re-seed, full LWW, flush-from-apply |
| **Industry + process** | **This file** | Model lock (not CRDT), harden H1–H6, prove-with-sim before code |
| **Incident science** | [dal-pa-live-sync-thrash.md](dal-pa-live-sync-thrash.md), [dal-pa-delete-resurrect.md](dal-pa-delete-resurrect.md) | What broke this week, hypotheses, proposed fix — archive when stable |
| **Campaign hub** | [data-access-layer.md](data-access-layer.md) | Status line + link to doctrine/incident |
| **Phase gate** | [dal-phase-safety-playbook.md](dal-phase-safety-playbook.md) | Fresh-chat stop rule before touching prep live |
| **Production log** | root `RELEASES.md` | **Only when a milestone ships** — one plain note + GAS version (what fixed, smoke) |
| **“This works” log** | root `WORKS_LOG.md` | **Only when director says “This works”** — Git checkpoint, not a substitute for FRAGILE |

**Rule:** A lesson is not “learned” until it is in **FRAGILE** (or this standards file for process). Shipping without updating FRAGILE/RELEASES repeats the thrash. Do **not** dump process essays into `WORKS_LOG` / `RELEASES` — those stay short operational records that **point** at the docs above.

---

## 6. Current incident pointer

**Open incident (fix shipped — await director smoke):** [dal-pa-delete-resurrect.md](dal-pa-delete-resurrect.md) — note deletes + seed-once + Cases E–G. Next polish: H1/H5 from §2, not another architecture swing.
