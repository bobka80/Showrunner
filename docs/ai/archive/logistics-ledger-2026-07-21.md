# Archived — Logistics Ledger (movement SoT + PA slim)

**Entry:** [AI_DOCTRINE.md](../../../AI_DOCTRINE.md) · **Map:** [../README.md](../README.md)  
**Design lock (schema):** [../topics/logistics-ledger-schema-2026-07-20.md](../topics/logistics-ledger-schema-2026-07-20.md)  
**Architecture pack:** [../topics/architecture-multi-campaign-pack-2026-07-21.md](../topics/architecture-multi-campaign-pack-2026-07-21.md)  
**Director locks:** [../topics/architecture-campaign-director-locks-2026-07-21.md](../topics/architecture-campaign-director-locks-2026-07-21.md)  
**Predecessor:** [multi-user-fork-industrial-and-auto.md](multi-user-fork-industrial-and-auto.md) (Part B closed 2026-07-21)  
**Next after this campaign:** Project Campaign Room — [../topics/project-campaign-firebase-hybrid-decision-2026-07-21.md](../topics/project-campaign-firebase-hybrid-decision-2026-07-21.md)

**Opened:** 2026-07-21 · **Closed:** 2026-07-24 · **Status:** **COMPLETE** — M0–M5 + Exit (live forks re-enabled). **Archived** here.  
**Production tip:** see RELEASES.md. Prep live rollback pin still **v654**. Live forks: [../topics/dal-live-forks-pause.md](../topics/dal-live-forks-pause.md).

---

## Fresh-agent start

1. Read [AI_DOCTRINE.md](../../../AI_DOCTRINE.md) → [GLOSSARY.md](../GLOSSARY.md) § sub-events vs phases → **this archive** → schema topic → architecture pack §3 → locks.  
2. Do **not** invent columns beyond the schema topic.  
3. Campaign complete — next structural work is Campaign Room (await director OK go).  
4. **Live forks:** **LIVE** again — [../topics/dal-live-forks-pause.md](../topics/dal-live-forks-pause.md). Flags: `DAL_LIVE_FORKS_PAUSED = false` in `Dal_Sessions.js` + `window.DAL_LIVE_FORKS_PAUSED = false` in `07_Core_Globals.html`.  
5. After any implementation: `node milestone.js "…"`; update the owning topic same session.

---

## Director locks (do not reopen)

| Lock | Value |
|------|--------|
| Sequencing | After Part B; before Campaign Room; Offer **off** path |
| `phase_ref` | → `Project_Timelines.uid` (**sub-event**; legacy column name — not `Phase_Blocks`) |
| UID churn fix | **Preserve sub-event UIDs** on rewrite + expose on fragments (2026-07-21) |
| Soft free-at | **Sub-event end** |
| Load clocks | Timeline AUTO truck shifts + link to ledger legs |
| Empty `truck_uid` | Allowed |
| Dual-write | Mandatory **M1–M3** |
| M4 | Strip PA truck cols **and** Firebase mappers **and** `dalPaContentSig_` / `dalPaRowSignature_` together |
| Ops ledger | Never merge with RFID `Operations_Ledger` |
| Live forks | **Live** again (Exit 2026-07-24) — [dal-live-forks-pause.md](../topics/dal-live-forks-pause.md) |

---

## Live blast-radius notes (sweep 2026-07-21)

- **Forks paused:** no START PREP / START COLLAB / auto-start; router treats PA+timeline as Sheets; Index flags abandoned via `abandonAllOpenDalLiveForksAPI` (no Firebase→Sheets commit)
- Truck writers: Sheets path + ledger dual-write while paused (Firebase truck path idle)
- Live flush / host mirror / state fixtures still carry truck fields for when forks return
- Tracker AUTO clocks: `04b` · `getTruckSchedule`; roster often drops `Note` — backfill from sheet
- Conflicts today ignore truck cols; use **sub-event** envelopes — product math = M5
- **Terminology:** [GLOSSARY.md](../GLOSSARY.md) — sub-events ≠ phases

---

## Checklist

### Gates

- [x] Part B B7 closed / archived
- [x] Architecture pack filed
- [x] `phase_ref` UID pick = preserve
- [x] Active brief created (this file)
- [x] Director **OK go** for M0/M1 **code** (schema + dual-write)
- [x] Director **OK go** for prep-open truck → Firebase + ledger (M1.1)
- [x] Director **OK go** — pause PA + timeline live forks (Sheets-only for ledger campaign)

### M0 — Freeze & inventory

- [x] Engine snapshot / PA truck-field row counts — API `inventoryPaTruckFieldsAPI()` (run after ship; Drive version history = snapshot)
- [x] Document END PREP fixture gap in ship notes — mitigated via collection overlay on commit
- [x] Plan UID preserve for `Project_Timelines` (`Logistics_Projects.js`, `Logistics_Timeline.js`, fragment readers)

### M1 — Additive ledger + dual-write + UID preserve

- [x] Create `Logistics_Ledger` tab + headers; wire schema/cache
- [x] Dual-write from `saveTruckArrangementAPI` (PA + ledger)
- [x] Keep AUTO-OUTBOUND / AUTO-INBOUND; start leg↔shift link (`leg_id` + truck_uid; clock stamp from hub)
- [x] Ship `Project_Timelines.uid` preservation + expose `uid` on fragments (+ UI round-trip)
- [x] Doctrine: SCHEMA / ENGINEERING_RULES §6 (15→16) / FILE_MAP same session
- [x] `node milestone.js` after first ship — **GAS v726**
- [x] **M1.1** Prep-open: Firebase PA collection + state (truck in fixtures) + ledger dual-write; End Prep overlay collection-first; host-boot truck mirror
- [x] **Fork pause:** `DAL_LIVE_FORKS_PAUSED` + abandon open Index flags (Sheets SoT)

### M2 — Backfill

- [x] PA outbound/inbound → ledger legs — `backfillLogisticsLedgerFromPaAPI(projectIdOrNull, actor)`
- [x] Best-effort clocks from AUTO shifts (sheet); `phase_ref` when exactly one RECOVERY sub-event
- [x] Manager review list — return `review[]` from backfill + `reviewLogisticsLedgerGapsAPI`

### M3 — Reader cutover

- [x] Tracker / mobile arranged / logistics readiness read ledger — `getProjectAssetsSheets_` + `getProjectAssetsFirestore_` overlay; `getUnifiedTrackerData` resolves truck via ledger (PA fallback). Empty ledger `truck_uid` does not wipe PA unless staged/spatial.
- [x] Keep dual-write until green

### M4 — Writer cutover + PA strip

- [x] Ledger-only writers — `logisticsLedgerWriteFromLayoutItems_` from arrange layout; PA may still split qty=1
- [x] Drop 12 PA columns from headers + Engine rewrite (`stripPaTruckColumnsM4_` in `Logistics_Schema.js`)
- [x] Strip Firebase mappers + content/row sigs **together** (`Dal_Firebase`, `02e7`, `Dal_Reconcile`, host-boot)
- [x] Strip/migrate fork docs; verify END PREP / deltas — no truck on commit fixtures; copy-truck no-op

### M5 — Conflicts

- [x] Product soft/hard via ledger + `phase_ref` — free-at = sub-event end; soft suppressed if unresolved; hard = core overlap / bulk over-ask
- [x] Keep `Conflict_Overrides`
- [x] Single-project false badge re-eval — unique single-project “double-book” no longer emitted

### Exit

- [x] All M0–M5 checked
- [x] Re-enable live forks (`DAL_LIVE_FORKS_PAUSED = false`) + smoke START/END PREP + collab (director smoke after ship)
- [x] Archive this file; set Campaign Room as NEXT in Project_TODO

---

## Status log

| Date | Note |
|------|------|
| 2026-07-21 | Promoted to active after Part B archive + design pack OK go. UID preserve locked. Waiting **OK go** for M0/M1 code. |
| 2026-07-21 | **M0+M1 code @ GAS v726:** `Logistics_Ledger` tab; dual-write; UID preserve; END PREP truck overlay (Sheets-first); AUTO clock stamp; Bugbot Highs fixed. Next: M2 backfill. |
| 2026-07-21 | **Doc hygiene:** director terminology lock — **sub-events** (`Project_Timelines`) vs **phases** (`Phase_Blocks`); GLOSSARY + ledger/architecture/locks cleaned. Schema rename of `phase_ref` deferred. |
| 2026-07-21 | **M1.1 @ GAS v727** (+ hosting host-boot **v668**): Prep-open truck → Firebase PA + state (truck fixtures) + ledger dual-write; flush/host mirror carry truck; End Prep overlay collection-first. |
| 2026-07-21 | **Live forks PAUSED @ GAS v728–v729** (PA + timeline): Sheets-only until ledger work done. Flag `DAL_LIVE_FORKS_PAUSED`; one-shot abandon Index flags (no Firebase commit). |
| 2026-07-21 | **Docs:** canonical agent note [dal-live-forks-pause.md](../topics/dal-live-forks-pause.md); wired from doctrine, AGENTS, session-fork-platform, prep/timeline topics, FRAGILE, GLOSSARY. |
| 2026-07-21 | **M2 @ GAS v730:** `backfillLogisticsLedgerFromPaAPI` + sheet AUTO clocks + RECOVERY `phase_ref` (exact-one) + `reviewLogisticsLedgerGapsAPI`. Arrange save also stamps when resolvable. Next: run backfill once, then M3. |
| 2026-07-23 | **M2 confirmed** (director: ledger rows present) + Admin **RUN LEDGER BACKFILL** button. |
| 2026-07-23 | **M3 readers @ GAS v734:** ledger prefer / PA fallback in assets + tracker + Firestore PA load. Bugbot High: blank ledger truck does not wipe PA. Next: director smoke, then M4. |
| 2026-07-23 | **M4 @ GAS v735** (+ hosting host-boot **v669**): ledger-only arrange writers; strip 12 PA truck cols + Firebase/host mappers + content/row sigs; partial-save preserves other assets' legs; ledger write failure fails the save. Next: smoke, then M5. |
| 2026-07-24 | **M5 conflicts @ GAS v737:** free-at from ledger `phase_ref` → sub-event end (RECOVERY fallback); soft suppressed if unresolved; unique single-project false badge removed; overrides kept. Next: smoke, then Exit (re-enable forks). |
| 2026-07-24 | **Exit:** `DAL_LIVE_FORKS_PAUSED = false` (server + client); abandon latch cleared on live path; campaign archived; Campaign Room = NEXT. |
