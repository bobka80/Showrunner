# Architecture pack — Logistics Ledger → Campaign Room → Packet sync

**Status:** Design packed & filed 2026-07-21. **Part B archived.** **Logistics Ledger = NEXT** (active). Campaign Room / packet sync not OK go for code.  
**Entry:** [AI_DOCTRINE.md](../../../AI_DOCTRINE.md) · **Index:** [Project_TODO.md](../Project_TODO.md)  
**Locks (law):** [architecture-campaign-director-locks-2026-07-21.md](architecture-campaign-director-locks-2026-07-21.md)  
**Active build:** [../active/logistics-ledger-2026-07-21.md](../active/logistics-ledger-2026-07-21.md)  
**Companions:** [logistics-ledger-schema-2026-07-20.md](logistics-ledger-schema-2026-07-20.md) · [project-campaign-firebase-hybrid-decision-2026-07-21.md](project-campaign-firebase-hybrid-decision-2026-07-21.md) · [session-fork-platform.md](session-fork-platform.md)

**Source:** Fresh design-agent codebase sweep 2026-07-21 (live root, not dist/). Director OK go to file + B7 closed + `phase_ref` UID pick = **preserve**.

---

## 1. Plain-language summary

Today, truck placement lives as **12 columns on every equipment-list row**, while load/unload clocks live as **AUTO truck shifts on the timeline**, and conflict math uses **coarse sub-event envelopes** (`Project_Timelines`). That is three half-stories.

**Logistics Ledger** makes movement its own Engine logbook (`Logistics_Ledger`), slims PA to “what gear is on the project,” keeps AUTO shifts as the clock surface, and ties availability to **sub-event end** via `phase_ref` (legacy column name → **sub-event** FK).

> **Terminology:** [GLOSSARY.md](../GLOSSARY.md) — **Sub-events** = `Project_Timelines`. **Phases** = `Phase_Blocks` (timeline header). Never call sub-events “phases.”

**Project Campaign Room** (after Ledger) keeps one warm Firebase workspace for show week: meta + PA + timeline + ledger under one `campaignRoomUid`, publishes to Sheets every ~30 minutes, and auto-closes after **48 hours of silence** (writes or station dock — not mere presence). Explicit End stays.

**Packet sync** stays later — not redesigned here.

Building the room **before** Ledger would embed truck fields in Firebase twice. Sequence is locked: **B7 → Ledger → Room → sync**.

---

## 2. Final campaign sequence + gates

| Gate | Campaign | Exit criteria |
|------|----------|----------------|
| **0** | Multi-user Part B | **DONE 2026-07-21** — [../archive/multi-user-fork-industrial-and-auto.md](../archive/multi-user-fork-industrial-and-auto.md) |
| **1** | Logistics Ledger M0–M5 | PA truck cols gone; ledger SoT; Conflicts on ledger + **sub-event**; dual-write retired |
| **2** | Project Campaign Room | 48h idle timer; ~30m publish meta→PA→timeline→ledger; one room uid; design-lock rules 1–2 revised |
| **3** | Hierarchical delta / packet sync | Separate later |
| — | Offer / Availability | **Off critical path** (parallel or later) |
| — | RFID `Operations_Ledger` | **Forever outside** the live room |

**Do not start Gate 2 until Gate 1 M4+ (PA truck strip + Firebase mapper strip) is proven.**  
**Do not start Gate 3 inside Room build.**

---

## 3. Campaign 1 — Logistics Ledger

### Goal
Engine tab **`Logistics_Ledger`** = single source of truth for movement / staging / load windows; PA answers only assignment; Conflicts move toward product soft/hard via ledger + `phase_ref` (**sub-event** FK).

### In scope
- Schema + M0–M5 migration
- Dual-write M1–M3 (locked)
- Writers/readers of the 12 PA truck fields
- Keep AUTO-OUTBOUND / AUTO-INBOUND **and link** to ledger legs
- **Preserve `Project_Timelines.uid`** on rewrite + expose on fragments (M0/M1 prerequisite for `phase_ref`)
- Detection only (no auto-resolve / FCM wizard)

### Out of scope
- Offer UX campaign
- Campaign Room lifecycle
- Packet sync
- Merging with RFID `Operations_Ledger`
- Deep routing trees beyond leg + stops

### Phases M0–M5 (live blast radius)

**M0 — Freeze & inventory**
- Snapshot Engine workbook.
- Count PA rows with any non-empty `outbound_*` / `inbound_*`.
- List projects with arrangement; note bulk-split UIDs from `saveTruckArrangementAPI`.
- Inventory END PREP clobber path (`dalPaFixtureToCommitObj_` omits all 12).
- **UID preserve plan:** stop regenerating `Project_Timelines.uid` on every save; keep client/sheet ids; expose `uid` on fragments.

**M1 — Additive ledger + dual-write**
- Create `Logistics_Ledger` tab + headers (schema lock in logistics-ledger topic).
- Empty `truck_uid` allowed (continuity / stay legs).
- New saves write **PA columns AND ledger rows**.
- `generateLogisticsPayloadAPI` keeps creating AUTO shifts; record leg↔shift link (shared vehicle UID + `leg_id`).
- Register sheet in `Logistics_Schema.js` / cache maps; Engine table count → **16**.
- Ship UID preservation for `Project_Timelines` in this phase if not done in M0.

**M2 — Backfill**
- Each PA row with outbound and/or inbound → 1–2 top-level ledger legs.
- Clocks: best-effort from `Shift_Assignments` notes `⚠️ AUTO-OUTBOUND` / `⚠️ AUTO-INBOUND` (read **sheet**, not roster — roster often drops `Note`).
- `phase_ref`: only after UID stability; else blank + manager review flag.
- Do not invent silent wrong times.

**M3 — Reader cutover**
- Tracker, mobile “arranged,” logistics readiness, Conflicts prep path → **read ledger**.
- PA columns still dual-written.

**M4 — Writer cutover + PA column removal**
- `saveTruckArrangementAPI` (and successors) → ledger only.
- Drop 12 headers from `projectAssetsHeaders`; one-time Engine header rewrite.
- **Same phase, together:** strip Firebase PA truck mappers **and** `dalPaContentSig_` / `dalPaRowSignature_`.
- Fix fixture commit so END PREP never expected truck cols.
- Migrate/strip fork docs that still embed truck fields.

**M5 — Conflict engine**
- Replace coarse envelope soft math with ledger + `phase_ref` (free-at = **sub-event end**).
- Preserve `Conflict_Overrides`.
- Re-evaluate single-project unique false badge.
- Soft/hard product wording can stay thin if Offer is still later.

### Code surface (file → change)

**Schema / cache:** `Logistics_Schema.js`; `Dal_Cache.js`; `SCHEMA.md`; `ENGINEERING_RULES.md` §6 (15→16); `FILE_MAP.md`

**Primary movement writer:** `Logistics_Assets.js` · `saveTruckArrangementAPI`; `05a_Truck_Arrangement.html`; `02_Project_Editor_Logistics.html` (`headlessAutoArrangeAsync`, `revertAutoArrange`, `toggleAutoArrangeHub`, `executeLogisticsHub`)

**AUTO clocks (keep + link):** `generateLogisticsPayloadAPI`; `04b_Equipment_Tracker.html` · `getTruckSchedule` / `getLegTimeline`

**PA readers:** `getProjectAssetsSheets_`, `getUnifiedTrackerData`; `01h_Mobile_Assets.html` · `evaluateMobileLogisticsStatus`

**Clobber / omit:** `saveProjectAssetsAPI`; `dalApplyPaDeltas_`; `Dal_Firebase.js` · `dalPaFixtureToCommitObj_`, `dalCommitPaFromFirestore_`; `02e7` sparse `dalPaAssetToFsDoc_` / flush fixtures

**Firebase / reconcile (M4 strip together):** `dalFirestoreAssetFromRow_`; `dalFsDocToPaAsset_`; `dalPaAssetToFsDoc_`; `dalPaContentSig_`; `dalPaRowSignature_`

**Conflicts (M5):** `Conflicts.js` · `getActiveConflicts`

**Timeline UID plumbing:** `Logistics_Projects.js`; `Logistics_Timeline.js` · `saveTimelineDataSheets_`; fragment readers that drop `uid`

### Timeline dependency

| Concern | Live source | Ledger rule |
|---------|-------------|-------------|
| Load/unload clocks | AUTO truck shifts on `Shift_Assignments` (`Note`) | Keep shifts; link to legs |
| Soft free-at | **Sub-event** end | `phase_ref` → `Project_Timelines.uid` (**preserve UIDs**; legacy column name) |
| Timeline-header **phases** | `Phase_Blocks` | **Not** `phase_ref` target under current lock |
| PA truck cols | Spatial only | Migrate off; not clocks |

### Risks + rollback

| Risk | Mitigation |
|------|------------|
| END PREP wipes truck via fixtures | Dual-write ledger early; never put movement only in fixtures |
| Tracker misses AUTO notes via roster | Backfill reads `Shift_Assignments` sheet directly |
| `phase_ref` UID churn | Preserve UIDs (director pick 2026-07-21) |
| M4 premature strip | Keep dual-write until M3 green |

**Rollback M1–M3:** stop writing ledger; PA still authoritative.  
**Rollback M4:** restore PA headers from snapshot; re-enable dual-write readers.

---

## 4. Campaign 2 — Project Campaign Room

### Goal
One warm Firebase **Project Campaign Room** per project: less commit/reopen churn; Sheets durable via ~30m checkpoints; 48h **idle silence** auto-close. Explicit End stays.

### Idle / End / presence / checkpoint / warm-read (locks)

- **Idle 48h:** resets on room-slice **WRITE** (meta / PA / ledger / timeline) **or** station docked. Presence alone does **not** reset.
- **Explicit End / Publish now** — keep.
- **Checkpoint:** fixed ~30m; always **meta → PA → timeline → ledger**; room stays live.
- **Warm read:** Sheets by default; optional Live preview = ledger **and** timeline together.
- **Offer pull while warm:** one-shot from Firebase, then freeze.
- **Registry:** one `campaignRoomUid` for all four slices.

### Four slices + Firebase paths

| Slice | Path | Sheets |
|-------|------|--------|
| **meta** | `projects/{id}/meta/` (propose) | Projects_Index campaign columns |
| **PA** | `projects/{id}/assets/` *(exists)* | `Project_Assets` (no truck cols post-M4) |
| **timeline** | `projects/{id}/timeline/` *(exists)* | shifts / blocks / timelines |
| **ledger** | `projects/{id}/logistics/` *(new)* | `Logistics_Ledger` |

**Outside forever:** RFID `Operations_Ledger` / `ledgerOps`, vault, financials.

**Size caps:** WARN 512 KiB / 1500; MAX 900 KiB / 4000 per state doc.

### Lifecycle: keep vs replace

**KEEP:** `Dal_Router` / repos / adapters; reconcile; fail-safe backup/retry; host Auth/listen; calendar chrome reading room flags.

**REPLACE:** dual-domain close triggers; last-leave / short idle as commit; orphan/refresh retargeted to room; committing freeze for End/idle-close only — **not** routine 30m checkpoint.

**Do not scrap the fork** — extend it.

### Doctrine revisions (at Room time)

**Design lock 2026-07-13 rule 1:** While room warm: Firebase = active workspace; Sheets = latest **published** durable record (may lag ≤ checkpoint). Between rooms / after End: Sheets restore point.

**Rule 2:** Periodic **publish checkpoints** allowed during active Campaign Room. Final publish on End / idle close. RFID ops remain per-op atomic.

### Risks + rollback
Sheets lag → default Sheets + Live preview opt-in. Checkpoint fail → room stays live; reuse fail-safe B/C. Hard gate: Room only after Ledger M4.

---

## 5. Campaign 3 — Packet sync (outline only)

Later, separate: hierarchical delta / packet protocol. Assumes post-ledger shapes and room paths. Do not expand into this build sequence.

---

## 6. Sheets ↔ Firebase room-slice parity rule

For **each** of meta / PA / timeline / ledger:

1. Same entity `uid` in both stores  
2. Same field set (no truck fields on PA after M4)  
3. Publish order always meta → PA → timeline → ledger  
4. Checkpoint records `lastPublishedAt` + per-slice content signature  
5. On mismatch after publish: reconcile + alert (never silent)  
6. Readers declare mode: **Published (Sheets)** vs **Live preview (Firebase)**  
7. RFID / ops ledger: **not** in this checklist  
8. Size: each slice respects WARN/MAX before End/publish  

---

## 7. Decisions (resolved + remaining)

### Resolved 2026-07-21

| Topic | Pick |
|-------|------|
| Part B B7 | **Closed / archived** |
| `phase_ref` UID churn | **Preserve UIDs** on `Project_Timelines` rewrite + expose on fragments (recommended option 1) |
| Sequencing / idle / publish / dual-write / empty truck / AUTO link | See [locks](architecture-campaign-director-locks-2026-07-21.md) |

### Still open (non-blocking for M0–M1)

- Empty times after backfill → leave blank + manager review list (default)  
- `[TRANSFER_FROM` → formula bypass for M5 unless later ledger edges  
- Exact station-docked server rule → Room promote  
- Checkpoint lag escalation (>N hours) → Room promote  

---

## 8. What NOT to do

- Do not put Offer between Part B and Ledger  
- Do not build Campaign Room on today’s 12 PA truck columns  
- Do not merge movement into RFID `Operations_Ledger`  
- Do not invent schema fields beyond [logistics-ledger-schema](logistics-ledger-schema-2026-07-20.md) without asking  
- Do not scrap DAL router/repos — only change lifecycle triggers at Room time  
- Do not use presence / last-leave / 45m·75m idle as Room commit primary  
- Do not treat “kill Sheets / Firebase for good” as the next step  
- Do not hold ScriptLock across Firestore UrlFetch  
- Do not put Auth/listen only inside the GAS iframe  

---

## 9. Recommended first build after this pack

**Logistics Ledger M0 → M1 only** — inventory + UID preserve + additive `Logistics_Ledger` tab + dual-write.  
Say **OK go** on the active Ledger campaign for schema/code.

---

## Doc ↔ code contradictions noted (filing pass)

- Older briefs listing Offer before Ledger — **locks win** (corrected in index)  
- Ledger §2.2 understated END PREP fixture clobber — called out in active brief  
- “48h lease” language — **superseded** by idle timer  
