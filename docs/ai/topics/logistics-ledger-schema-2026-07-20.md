# Logistics Ledger — Equipment Movement & Conflict Detection

**Status:** Future campaign — design locked at brainstorm level (2026-07-20). **Schema homework complete in this file.** **Promoted to active 2026-07-21** — build checklist: [../active/logistics-ledger-2026-07-21.md](../active/logistics-ledger-2026-07-21.md). **Architecture pack:** [architecture-multi-campaign-pack-2026-07-21.md](architecture-multi-campaign-pack-2026-07-21.md).  
**Sequencing:** After Part B (**archived 2026-07-21**). Offer **off** critical path (director locks). Do **not** begin schema/migration code until director says **OK go** on the active brief.

Director: this is **not a small thing** — a **structural ENGINE refactor**, not a quick patch.

**Entry:** [AI_DOCTRINE.md](../../../AI_DOCTRINE.md) · **Index:** [Project_TODO.md](../Project_TODO.md)  
**Companion use-case:** [offer-invoice-crew-availability-2026-07-20.md](offer-invoice-crew-availability-2026-07-20.md) §3 (soft/hard definitions, day-view, false-badge bug)  
**Related:** [availability-fleet.md](availability-fleet.md) · [warehouse-prep-session.md](warehouse-prep-session.md) · [ENGINEERING_RULES.md](../ENGINEERING_RULES.md) §6–7 · [SCHEMA.md](../SCHEMA.md) · [architecture-campaign-director-locks-2026-07-21.md](architecture-campaign-director-locks-2026-07-21.md)

**Industry reference (director):** Flex Rental Solutions / LendControl-style platforms track movement as discrete auditable manifest events — a **ledger**, not a fixed two-leg property on the asset list.

---

## Hard rules for any future implementer

| Rule | Why |
|------|-----|
| **Do not invent schema mid-build** | Director: schema must be fully specified first (this file). No “Cursor figures out the structure.” |
| **Do not reuse `Operations_Ledger`** | That tab is the **RFID checkout/check-in** scan log. Different domain. New tab = `Logistics_Ledger`. |
| **Do not derive conflicts by walking timeline truck shifts** | Superseded approach. Conflict math reads ledger rows (+ phase refs). |
| **Treat PA column removal as a migration** | Live production data + Firebase fork docs carry the 12 truck/staging fields today. |
| **Detection ≠ resolution** | This campaign = schema + detection. Auto-resolve / crew notify / tasks = downstream, separate design. |
| **Update doctrine in the same session as code** | `Logistics_Schema.js`, [SCHEMA.md](../SCHEMA.md), [ENGINEERING_RULES.md](../ENGINEERING_RULES.md) §6 (ENGINE table list), [FILE_MAP.md](../FILE_MAP.md), Dal mappers — when building, not before. |

---

## 1. Problem statement

Today, planned equipment movement is modeled as **fixed columns on `Project_Assets`**: one outbound leg + one inbound leg (truck UID + XYZ + rotated + staged each). Load/unload *times* are not on those columns — Logistics Hub creates timeline truck shifts (`AUTO-OUTBOUND` / `AUTO-INBOUND` notes). Availability conflict math in `Conflicts.js` does **not** read the truck columns at all; it uses coarse **project timeline phase envelopes**.

### Structural limits

1. **One outbound + one inbound only.** Real ops need multi-leg routes, on-site continuity across back-to-back projects, partial swaps, and warehouse-bypass reroutes (Event A breakdown → Event B build).
2. **Indirect / fragile coupling.** Inferring transit from timeline truck shifts makes conflict windows a moving target when shifts are edited, and couples unrelated systems.
3. **Trust risk.** If the product cannot represent a real logistics scenario, operators leave the system for paper/spreadsheets — worse than a richer schema.

### Goal

Add Engine tab **`Logistics_Ledger`**: append-friendly, relational movement log = **single source of truth** for equipment movement, truck routing, staging-per-leg, and (with `phase_ref`) soft/hard conflict windows. Strip movement/staging columns off `Project_Assets` so PA answers only “what equipment, how much, on which project.”

---

## 2. Current software condition (research, 2026-07-20)

Homework against live source (not `dist/` / packs). Implementers must re-verify before coding — this is the baseline for the campaign brief.

### 2.1 `Project_Assets` columns today

Canonical headers in `Logistics_Schema.js` (`projectAssetsHeaders`):

**Stay on PA (assignment / list):**  
`uid`, `project_uid`, `asset_uid`, `assigned_quantity`, `location`, `formula`, `creator`, `override_dept`, `container_uid`, `scan_status`

**Migrate off PA → ledger (12 columns):**  
`outbound_truck_uid`, `outbound_x`, `outbound_y`, `outbound_z`, `outbound_rotated`, `outbound_staged`,  
`inbound_truck_uid`, `inbound_x`, `inbound_y`, `inbound_z`, `inbound_rotated`, `inbound_staged`

> Note: brainstorm text omitted `override_dept` — it **remains** on PA (dept bucket / prep paste). Do not migrate it.

### 2.2 Who writes / reads the 12 truck fields

| Role | File · function | Notes |
|------|-----------------|-------|
| **Primary writer** | `Logistics_Assets.js` · `saveTruckArrangementAPI` | `leg` = `outbound` \| `inbound` \| `both`. Full-tab clear + rewrite. Can split bulk qty into qty=1 rows (new PA UIDs). |
| UI save | `05a_Truck_Arrangement.html` · `saveTruckArrangement` | Payload → API |
| Auto-arrange / clear | `02_Project_Editor_Logistics.html` | Local PA fields then same API |
| PA load map | `Logistics_Assets.js` · `getProjectAssetsSheets_` | Sheet → camelCase |
| Tracker | `Logistics_Assets.js` · `getUnifiedTrackerData` | Truck UIDs; Matryoshka children inherit container truck if empty |
| Tracker UI | `04b_Equipment_Tracker.html` | Day/conflict views use truck UIDs + shift notes |
| Mobile | `01h_Mobile_Assets.html` | “Arranged” heuristic (outbound truck + X) |
| Firebase map | `Dal_Firebase.js` · `dalFirestoreAssetFromRow_` | Sheet/FS → client |
| Firebase map | `02e7_Dal_Firestore_Client.html` · `dalFsDocToPaAsset_` / `dalPaAssetToFsDoc_` | Fork docs embed truck fields |
| Content sig | `02e7` · `dalPaContentSig_` | Includes all 12 spatial fields |
| Reconcile sig | `Dal_Reconcile.js` · `dalPaRowSignature_` | Truck UIDs only (not XYZ) |

**Fragile today:** `saveProjectAssetsAPI` / `dalApplyPaDeltas_` **omit** truck fields on write — a full PA replace after arrange can leave spatial data inconsistent. Ledger migration must not make this worse.

**Also fragile (sweep 2026-07-21):** END PREP via `dalPaFixtureToCommitObj_` + `dalCommitPaFromFirestore_` commits **assignment-only** fixtures and **clears all 12 truck fields** on Sheets rewrite. Collection snapshot docs may still carry truck fields; `state.fixturesJson` does not. Dual-write must not rely on fixtures for movement.

**DAL gap:** `saveTruckArrangementAPI` is still **Sheets full rewrite**, not routed through `getProjectAssetsRepo()` / Firebase adapter. Prep topic lists truck arrangement as **Firebase (phased)** — unfinished. This campaign and prep-fork truck work must be planned together when promoted (see §8).

### 2.3 What `Conflicts.js` actually does today

`getActiveConflicts()` asset section:

- **Does not read** `outbound_*` / `inbound_*` or truck shifts.
- Builds windows from **`Project_Timelines`** rows (`Sub_Event_Type`, date, start/end):
  - `equipStart` / `equipEnd` = min/max of **all** phases
  - `coreStart` / `coreEnd` = min/max of `MAIN_EVENT` / `SHOW_DAY` (else fall back to equip)
- Sweep: `out` at equipStart, `in` at equipEnd; shortage vs vault pool capacity.
- **Hard** (`HARD_SHORTAGE`): core windows overlap (or single-project over-ask).
- **Soft** (`SOFT_TURNAROUND`): equip envelopes overlap but cores do not.
- Bypasses: `[SHORT]`, `[SUBRENT]`, `[TRANSFER_FROM` in formula.
- **Known product bug surface:** `activeArr.length === 1` flags “double-booked **inside the same project**” for unique units — aligns with the false single-event conflict badge investigation in the companion offer campaign §3.1.

### 2.4 Product soft/hard vs code soft/hard (must reconcile at build)

| | **Product lock** (offer campaign §3.3) | **Code today** (`Conflicts.js`) |
|--|----------------------------------------|----------------------------------|
| **Hard** | Physically required in two places at once → cross-rent | Core show windows overlap (or single-project over-capacity) |
| **Soft** | Booked for B but still in transit/recovery from A → reroute trucks | Prep/recovery **envelopes** overlap while cores do not (`SOFT_TURNAROUND`) |

Ledger + `phase_ref` exists to implement the **product** definitions with precise timestamps. Build must **replace** coarse envelope soft math, not layer a second inconsistent system. Keep `Conflict_Overrides` acknowledge path unless director says otherwise.

### 2.5 Three ledgers — do not conflate

| Tab | Exists? | Domain |
|-----|---------|--------|
| `Operations_Ledger` | **Live** | RFID / warehouse session scans (`uid`, `session_uid`, `operation_type`, `rfid_tag`, …) |
| `Financial_Ledger` | Live | Money |
| **`Logistics_Ledger`** | **This campaign** | Planned/actual **movement** legs & stops (truck, from/to, load/unload, staging, phase_ref) |

Prior prep-topic idea (“truck placement events on `Operations_Ledger`”) is **superseded** for *planned routing/staging*: those belong on `Logistics_Ledger`. Ops ledger stays scan/custody events.

### 2.6 Timeline structures for `phase_ref`

| Sheet | Role today |
|-------|------------|
| `Project_Timelines` | Calendar phases Conflicts already uses (`WAREHOUSE`, `MAIN_EVENT`, `SHOW_DAY`, `RECOVERY`, `TRANSIT`) |
| `Phase_Blocks` | Timeline UI blocks (`Phase_Mode`: `wh` / `main` / `show` / `recovery` / `transit`, duration) |
| `Shift_Assignments` | Crew/truck shifts; Auto outbound/inbound notes |

**Locked design intent:** soft availability = **phase end** (e.g. breakdown/recovery completion), not truck load clock alone.  
**`phase_ref` target:** **`Project_Timelines.uid`** (director lock).  
**UID preserve (director 2026-07-21):** live saves currently regenerate `Project_Timelines.uid` every rewrite — **must fix in M0/M1** (keep/reuse ids; expose `uid` on fragments) before trusting `phase_ref` FKs. Do **not** dual-ref `Phase_Blocks` without a new director rule.

---

## 3. Decision: `Logistics_Ledger` as movement SoT

### 3.1 Plain-language model

The ledger is a **logbook of physical movements**. Each row is one movement (or stop): what moved, how much, which truck, from where, to where, when loaded/unloaded, optional phase tie, optional XYZ/staging for that leg. The same `asset_uid` appears in many rows over time. No permanent “this asset’s only outbound truck” property on the equipment list.

### 3.2 Relationship to `Project_Assets`

| Concern | After migration |
|---------|-----------------|
| What / how much / which project / formula / container / scan / dept | **`Project_Assets`** |
| Truck, route, stops, load/unload, staging XYZ per leg | **`Logistics_Ledger`** |

PA becomes simpler. Movement is no longer a 2×6 column family bolted onto the list.

### 3.3 Locked field list (schema homework)

New Engine tab **`Logistics_Ledger`** (same Engine workbook — **new tab, not a new spreadsheet**).

| Field | Type / notes |
|-------|----------------|
| `uid` | Unique ledger row id |
| `project_uid` | Owning project for **top-level leg** rows; null/empty on child stops (inherit via parent) |
| `parent_uid` | Null = leg; set = stop under that leg’s `uid` |
| `asset_uid` | Vault/equipment identity that moved |
| `quantity` | Amount in this row |
| `truck_uid` | Vehicle that carried it (may be empty for on-site continuity / stay rows — director confirm at build) |
| `from_location` | Origin (warehouse, event site, roadside, …) |
| `to_location` | Destination |
| `load_time` | Left previous location |
| `unload_time` | Arrived next location |
| `leg_id` | Groups related movements (outbound 1, inbound 1, outbound 2, …) |
| `phase_ref` | FK to timeline phase that defines availability (see §4) — typically breakdown/recovery end |
| `x`, `y`, `z`, `rotated`, `staged` | Staging/placement **per ledger row** (migrated meaning of outbound_/inbound_ spatial fields) |
| `creator` | Who logged the row (same doctrine as PA) |

**Doctrine fit:** every entity has `uid`; FKs not JSON blobs; `parent_uid` mirrors `container_uid` hierarchy pattern on PA.

**ENGINE count:** adding this tab makes transactional Engine **16** tables — update [ENGINEERING_RULES.md](../ENGINEERING_RULES.md) §6 / [SCHEMA.md](../SCHEMA.md) at implement time (today’s “15” list is historical).

### 3.4 Hierarchy: legs and stops

Two-level parent/child only (director: sufficient for now):

- **Leg (top):** `project_uid` set, `parent_uid` null.
- **Stop (child):** `parent_uid` = leg `uid`; `project_uid` typically empty (inherited).

Example: warehouse load → roadside pickup → event unload = one leg + three stop children (or equivalent modeling agreed at planning). Arbitrary multi-hop without further schema churn.

### 3.5 Cross-project continuity

Back-to-back festivals / same venue / partial swap: additional ledger row with same `asset_uid`, **new** `project_uid` for Weekend 2, `from_location` = Event A site, `to_location` = Event B site, **no warehouse trip**. Overlap during transition = same soft-conflict math (phase-tied availability vs next required load) — no extra tables.

---

## 4. Event-phase soft conflict detection

### 4.1 Locked rule

Equipment becomes available for its **next** movement when the relevant **event phase ends** (e.g. breakdown / recovery completion) — **not** merely when a truck’s scheduled load time says so.

Example: asset free at 18:00 when breakdown ends; Event B needs load by 17:30 → soft conflict, 30 minutes short. Resolution path (product): change routing — **not** auto-fix in this campaign.

### 4.2 Hard vs soft (product — target for ledger-era Conflicts)

| Type | Meaning | Typical resolution (downstream) |
|------|---------|----------------------------------|
| **Hard** | Required in two places at the same time | Cross-rent |
| **Soft** | Needed for B while still committed to A’s transit/recovery window | Reroute trucks (A breakdown → B city, skip warehouse) |

### 4.3 Scope boundary (director-confirmed)

**In scope:** schema + detection inputs (`phase_ref`, load/unload, locations).  
**Out of scope here:** auto-resolve, FCM, task assignment, operator “fix wizard.”

---

## 5. Explicitly deferred / out of scope this design pass

- Deeper-than-two-level routing trees
- Conflict **resolution** automation / crew notification
- Full migration **script** detail (needs its own planning pass when scheduled — outline in §7)
- Full UI rewrite of Logistics Hub / Truck Arrangement / Equipment Tracker (must happen for cutover, but UX redesign is a separate planning slice once schema + writers exist)
- Merging `Operations_Ledger` with this tab
- Changing financials / offer documents

---

## 6. Touch-surface inventory (cutover must hit all)

When promoted, treat as a **checklist of blast radius** — not optional polish:

### Schema / cache

- [x] `Logistics_Schema.js` — create `Logistics_Ledger` sheet + headers; wire `cachedEngineSheets` / sheet map (PA columns **not** shrunk yet — M4)
- [x] `Dal_Cache.js` (and any hot-sheet lists) — register new tab
- [ ] Live Engine workbook migration (production + any staging Engine copies) — auto-heals on `verifyDatabaseSchema()` after deploy

### Writers / readers of old PA truck columns

- [x] `saveTruckArrangementAPI` → dual-write ledger legs (still writes PA columns until M4)
- [ ] `05a_Truck_Arrangement.html`, `02_Project_Editor_Logistics.html` (UI unchanged in M1)
- [ ] `getProjectAssetsSheets_`, `getUnifiedTrackerData` (Matryoshka inherit rules → ledger) — M3
- [ ] `04b_Equipment_Tracker.html`, `01h_Mobile_Assets.html` — M3
- [x] `generateLogisticsPayloadAPI` — keep AUTO shifts; stamp clocks onto matching ledger legs

### Conflicts

- [ ] `Conflicts.js` — rewrite asset window math to ledger + `phase_ref` (product soft/hard)
- [ ] Preserve `Conflict_Overrides` unless redesign says otherwise
- [ ] Fix / re-evaluate single-project unique “double book” path (companion §3.1)

### DAL / Firebase

- [ ] Strip truck fields from `dalFirestoreAssetFromRow_`, `dalFsDocToPaAsset_`, `dalPaAssetToFsDoc_`, `dalPaContentSig_`, `dalPaRowSignature_`
- [ ] New collection or sheet-backed repo for ledger rows; prep-fork: truck arrange must target ledger (align with [warehouse-prep-session.md](warehouse-prep-session.md) fork table)
- [ ] Migration of existing fork documents that embed outbound_/inbound_ fields

### Docs (same ship session)

- [ ] [SCHEMA.md](../SCHEMA.md), [ENGINEERING_RULES.md](../ENGINEERING_RULES.md) §6–7, [FILE_MAP.md](../FILE_MAP.md), [GLOSSARY.md](../GLOSSARY.md) if new magic strings, [FRAGILE_ZONES.md](../FRAGILE_ZONES.md) only with director approval for new incident/preflight rows
- [ ] Update [warehouse-prep-session.md](warehouse-prep-session.md) “truck placement on Operations_Ledger” → Logistics_Ledger
- [ ] Update companion offer campaign status when conflict detection ships

---

## 7. Migration plan outline (required before code)

This is a **destructive shape change** on a live transactional table. Do not ship “add ledger, leave PA columns forever” without an explicit dual-write window decision.

### Recommended phases (planning lock at promote time)

**Phase M0 — Freeze & inventory**

- Snapshot Engine workbook; count PA rows with any non-empty outbound_/inbound_ field.
- List projects with truck arrangement; note bulk-split UIDs created by `saveTruckArrangementAPI`.

**Phase M1 — Additive: create `Logistics_Ledger` tab**

- Headers only + empty sheet; no PA column removal yet.
- Dual-write option (safer): new saves write **both** PA columns and ledger rows until cutover verified.

**Phase M2 — Backfill**

- For each PA row with outbound and/or inbound data, emit **one or two top-level ledger legs** (outbound leg, inbound leg) with migrated `truck_uid`, `x/y/z/rotated/staged`, `quantity`, `asset_uid`, `project_uid`, `creator`.
- `load_time` / `unload_time` / `phase_ref`: best-effort from matching `Project_Timelines` / `AUTO-OUTBOUND`/`AUTO-INBOUND` shifts if resolvable; else leave blank and flag for manager review (do not invent silent wrong times).
- Child stops: not required for 1:1 backfill of today’s two-leg model.

**Phase M3 — Reader cutover**

- Tracker, Conflicts, mobile “arranged”, logistics readiness → read ledger.
- Keep PA columns writable only via dual-write until green.

**Phase M4 — Writer cutover + PA column removal**

- `saveTruckArrangementAPI` (and successors) write ledger only.
- Schema builder drops the 12 columns; one-time sheet header rewrite on Engine.
- Strip Firebase mappers; migrate/strip fork docs.
- Verify `saveProjectAssetsAPI` / deltas never expect truck columns.

**Phase M5 — Conflict engine**

- Implement product soft/hard against ledger + `phase_ref`.
- Regression: vault shortage, `[TRANSFER_FROM` bypass, acknowledge overrides.
- Address single-event badge false positive.

**Rollback:** keep M1–M2 dual-write until M4 is proven; rolling back M4 means restoring PA headers from snapshot and re-enabling dual-write readers — document exact rollback steps in the active brief when promoted.

---

## 8. Coordination with other campaigns

| Campaign | Interaction |
|----------|-------------|
| Multi-user Part B | **Must finish first** — do not refactor PA shape under live fork chaos |
| Offer / availability product | Soft/hard **definitions** + day-view UX live there; **this** file owns schema + detection SoT |
| Warehouse prep / truck Firebase | Prep topic still lists truck arrange as phased Firebase; cutover should land placement on **`Logistics_Ledger`**, not embed truck fields back into PA fork docs |
| Pre-ship expansion | Consider a future structural gate: forbid new `outbound_truck_uid` references after cutover |
| **Project Campaign Room (Firebase hybrid)** | **Must follow this campaign** — unified warm room + periodic Sheets publish; ledger + **timeline** are linked (load clocks / `phase_ref`). Director locks: [architecture-campaign-director-locks-2026-07-21.md](architecture-campaign-director-locks-2026-07-21.md). Decision brief: [project-campaign-firebase-hybrid-decision-2026-07-21.md](project-campaign-firebase-hybrid-decision-2026-07-21.md) |

---

## 8b. Decision brief — Firebase campaign room (director 2026-07-21)

Director brainstorm: near show date, crews revisit the same project often; short **commit/reopen** session cycles feel wrong. Proposed future model = **48h leased Firebase workspace** + **~30m publish checkpoints** to Sheets, with listeners so people move fluidly.

**Why this ledger campaign matters for that decision:**

- Today truck/staging lives on **PA rows** and in **Firebase asset docs** — a bad foundation for a “whole project room.”
- After cutover, movement is **`Logistics_Ledger`**; PA is list-only → campaign room = **assets + logistics + timeline** (three slices), not one monolithic snapshot.
- Building the hybrid room **before** ledger ships would embed truck fields in Firebase twice (build now, strip later).

**Planning lock:** Logistics Ledger **before** Project Campaign Room implementation unless director explicitly reorders.

Full pros/cons, options A–D, sequencing, open questions: **[project-campaign-firebase-hybrid-decision-2026-07-21.md](project-campaign-firebase-hybrid-decision-2026-07-21.md)**.

---

## 9. Director decisions still open (resolve at planning, before OK go on code)

**Partially locked 2026-07-21** — see [architecture-campaign-director-locks-2026-07-21.md](architecture-campaign-director-locks-2026-07-21.md):

| # | Topic | Lock |
|---|--------|------|
| 1 | `phase_ref` target | **`Project_Timelines.uid`** |
| 2 | Empty `truck_uid` for continuity | **Allowed** |
| 3 | Dual-write duration | **Mandatory M1–M3** |
| 4 | AUTO-OUTBOUND / AUTO-INBOUND shifts | **Keep and link to ledger legs** |
| — | Load/unload clocks | **Timeline truck shifts** + phase_ref for availability |
| — | Soft conflict free-at | **Phase end** (not truck load alone) |
| — | Offer before Ledger? | **No** — Offer off critical path |
| — | `Project_Timelines.uid` for `phase_ref` | **Preserve on rewrite** + expose on fragments (2026-07-21) |

Remaining at promote time (if any): empty times after backfill review UI; `[TRANSFER_FROM` as ledger edges vs formula bypass only.

---

## 9b. Was open (historical — do not re-litigate without director)

1. ~~**`phase_ref` target:**~~ locked → `Project_Timelines.uid`
2. ~~**Stay / on-site rows:**~~ locked → empty `truck_uid` allowed
3. ~~**Dual-write duration:**~~ locked → M1–M3
4. ~~**Timeline auto truck shifts:**~~ locked → keep + link to ledger
5. **`[TRANSFER_FROM`:** remain formula bypass only, or also express as ledger edges?
6. **Empty times after backfill:** manager review UI vs leave blank until next arrange save?

---

## 10. Campaign checklist (when promoted to active)

### Gates

- [x] Director confirms sequencing (Part B archived; Offer off path)
- [x] Director resolves phase UID preserve + §9 product locks
- [x] Active brief created under `docs/ai/active/` — [../active/logistics-ledger-2026-07-21.md](../active/logistics-ledger-2026-07-21.md)
- [ ] Explicit **OK go** before any schema or migration code (M0/M1)

### Design lock (this file) — done at brainstorm

- [x] Problem / trust rationale
- [x] Field list + leg/stop hierarchy
- [x] PA columns to remove vs keep
- [x] Soft conflict from phase end, not truck load alone
- [x] Detection-only scope
- [x] Name separation from `Operations_Ledger`
- [x] Current-code research baseline + migration outline

### Build (not started)

- [ ] M0–M5 migration (§7)
- [ ] All touch surfaces (§6)
- [ ] Doctrine updates in same session as ship
- [ ] Pre-ship + Bugbot + `node milestone.js` per doctrine
- [ ] Handoff: how to verify tracker conflicts + truck arrange on web.app

---

## 11. Summary for planning

This campaign **removes** twelve live columns from `Project_Assets` and introduces Engine tab **`Logistics_Ledger`** as the relational SoT for movement, staging-per-leg, and precise soft/hard conflict inputs via `phase_ref`. It is intentionally queued behind multi-user and offer work. Current conflict code already ignores PA truck columns and uses coarse timeline envelopes — so the ledger is both a **logistics fidelity** upgrade and the path to the **product** soft/hard model. Treat cutover as a phased migration with dual-write; never let implementation invent columns or merge this with the RFID `Operations_Ledger`.

**Promote:** director picks this work → move checklist to `docs/ai/active/`, set index status, resolve §9, then OK go.
