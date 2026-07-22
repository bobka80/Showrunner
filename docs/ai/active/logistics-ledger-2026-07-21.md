# Active — Logistics Ledger (movement SoT + PA slim)

**Entry:** [AI_DOCTRINE.md](../../../AI_DOCTRINE.md) · **Map:** [../README.md](../README.md)  
**Design lock (schema):** [../topics/logistics-ledger-schema-2026-07-20.md](../topics/logistics-ledger-schema-2026-07-20.md)  
**Architecture pack:** [../topics/architecture-multi-campaign-pack-2026-07-21.md](../topics/architecture-multi-campaign-pack-2026-07-21.md)  
**Director locks:** [../topics/architecture-campaign-director-locks-2026-07-21.md](../topics/architecture-campaign-director-locks-2026-07-21.md)  
**Predecessor:** [../archive/multi-user-fork-industrial-and-auto.md](../archive/multi-user-fork-industrial-and-auto.md) (Part B closed 2026-07-21)  
**Next after this campaign:** Project Campaign Room — [../topics/project-campaign-firebase-hybrid-decision-2026-07-21.md](../topics/project-campaign-firebase-hybrid-decision-2026-07-21.md)

**Opened:** 2026-07-21 · **Status:** **M2 backfill shipped** — live forks still PAUSED (Sheets-only). Next: M3 readers.  
**Production tip:** see status log. Prep live rollback pin still **v654**.

---

## Fresh-agent start

1. Read [AI_DOCTRINE.md](../../../AI_DOCTRINE.md) → [GLOSSARY.md](../GLOSSARY.md) § sub-events vs phases → **this file** → schema topic → architecture pack §3 → locks.  
2. Do **not** invent columns beyond the schema topic.  
3. Do **not** start Campaign Room or Offer in this campaign.  
4. **Live forks:** **PAUSED** — read [../topics/dal-live-forks-pause.md](../topics/dal-live-forks-pause.md) before any prep/collab/Firebase PA work. Flags: `DAL_LIVE_FORKS_PAUSED` in `Dal_Sessions.js` + `window.DAL_LIVE_FORKS_PAUSED` in `07_Core_Globals.html`.  
5. **Next build:** M3 reader cutover after M2 verified.  
6. After any implementation: `node milestone.js "…"`; update this checklist same session.

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
| Live forks | **Paused** — Sheets-only · [dal-live-forks-pause.md](../topics/dal-live-forks-pause.md) |

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

- [ ] Tracker / mobile arranged / logistics readiness read ledger
- [ ] Keep dual-write until green

### M4 — Writer cutover + PA strip

- [ ] Ledger-only writers
- [ ] Drop 12 PA columns from headers + Engine rewrite
- [ ] Strip Firebase mappers + content/row sigs **together**
- [ ] Strip/migrate fork docs; verify END PREP / deltas

### M5 — Conflicts

- [ ] Product soft/hard via ledger + `phase_ref`
- [ ] Keep `Conflict_Overrides`
- [ ] Single-project false badge re-eval

### Exit

- [ ] All M0–M5 checked
- [ ] Re-enable live forks (`DAL_LIVE_FORKS_PAUSED = false`) + smoke START/END PREP + collab
- [ ] Archive this file; set Campaign Room as NEXT in Project_TODO

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
