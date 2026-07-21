# Active — Logistics Ledger (movement SoT + PA slim)

**Entry:** [AI_DOCTRINE.md](../../../AI_DOCTRINE.md) · **Map:** [../README.md](../README.md)  
**Design lock (schema):** [../topics/logistics-ledger-schema-2026-07-20.md](../topics/logistics-ledger-schema-2026-07-20.md)  
**Architecture pack:** [../topics/architecture-multi-campaign-pack-2026-07-21.md](../topics/architecture-multi-campaign-pack-2026-07-21.md)  
**Director locks:** [../topics/architecture-campaign-director-locks-2026-07-21.md](../topics/architecture-campaign-director-locks-2026-07-21.md)  
**Predecessor:** [../archive/multi-user-fork-industrial-and-auto.md](../archive/multi-user-fork-industrial-and-auto.md) (Part B closed 2026-07-21)  
**Next after this campaign:** Project Campaign Room — [../topics/project-campaign-firebase-hybrid-decision-2026-07-21.md](../topics/project-campaign-firebase-hybrid-decision-2026-07-21.md)

**Opened:** 2026-07-21 · **Status:** **M0+M1 shipped** — dual-write live; readers still on PA truck columns until M3.  
**Production tip at open:** GAS **v725**. Prep live rollback pin still **v654**.

---

## Fresh-agent start

1. Read [AI_DOCTRINE.md](../../../AI_DOCTRINE.md) → **this file** → schema topic → architecture pack §3 → locks.  
2. Do **not** invent columns beyond the schema topic.  
3. Do **not** start Campaign Room or Offer in this campaign.  
4. **Next build:** M2 backfill (existing PA truck → ledger) after director OK go.  
5. After any implementation: `node milestone.js "…"`; update this checklist same session.

---

## Director locks (do not reopen)

| Lock | Value |
|------|--------|
| Sequencing | After Part B; before Campaign Room; Offer **off** path |
| `phase_ref` | → `Project_Timelines.uid` |
| UID churn fix | **Preserve UIDs** on rewrite + expose on fragments (2026-07-21) |
| Soft free-at | Phase **end** |
| Load clocks | Timeline AUTO truck shifts + link to ledger legs |
| Empty `truck_uid` | Allowed |
| Dual-write | Mandatory **M1–M3** |
| M4 | Strip PA truck cols **and** Firebase mappers **and** `dalPaContentSig_` / `dalPaRowSignature_` together |
| Ops ledger | Never merge with RFID `Operations_Ledger` |

---

## Live blast-radius notes (sweep 2026-07-21)

- Only intentional Sheets writer of the 12 truck fields: `Logistics_Assets.js` · `saveTruckArrangementAPI` (+ dual-write to ledger)
- **END PREP clobber mitigation (M1):** commit overlays truck fields from Firestore collection docs onto fixture commit objects
- Tracker AUTO clocks: `04b` · `getTruckSchedule`; roster often drops `Note` — backfill from sheet
- Conflicts today ignore truck cols; use phase envelopes — product math = M5
- `saveTruckArrangementAPI` is **not** DAL/Firebase-routed today

---

## Checklist

### Gates

- [x] Part B B7 closed / archived
- [x] Architecture pack filed
- [x] `phase_ref` UID pick = preserve
- [x] Active brief created (this file)
- [x] Director **OK go** for M0/M1 **code** (schema + dual-write)

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
- [ ] `node milestone.js` after first ship

### M2 — Backfill

- [ ] PA outbound/inbound → ledger legs
- [ ] Best-effort clocks from AUTO shifts (sheet); `phase_ref` when resolvable
- [ ] Manager review list for blank times / missing phase_ref

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
- [ ] Archive this file; set Campaign Room as NEXT in Project_TODO

---

## Status log

| Date | Note |
|------|------|
| 2026-07-21 | Promoted to active after Part B archive + design pack OK go. UID preserve locked. Waiting **OK go** for M0/M1 code. |
| 2026-07-21 | **M0+M1 code:** `Logistics_Ledger` tab; dual-write; UID preserve; END PREP truck overlay; AUTO clock stamp. Next: M2 backfill. |
