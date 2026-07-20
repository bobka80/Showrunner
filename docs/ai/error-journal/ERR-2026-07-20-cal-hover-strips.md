# ERR-2026-07-20 — Calendar hover phase strips vanish after prep/timeline

**Kind:** `single`  
**State:** `Fixed`  
**Day:** [days/error-day-2026-07-20.md](days/error-day-2026-07-20.md) · item `E2026-07-20-B`

---

## Plain language

Main calendar event **hover snapshots** (colored phase strips inside the event bar) disappear after visiting prep and/or timeline and returning to Home. Regression noticed after recent calendar fork-dot updates.

---

## Member reports

| Report_ID | Timestamp (UTC) | User | View | Description |
|-----------|-----------------|------|------|-------------|
| `bfe57d37-748b-4794-a1cd-abcb94235eab` | 2026-07-20T20:38:21.308Z | Bogdan | `main\|mobile:HOME\|nav-btn-dashboard` | Hover strips gone after prep/timeline in/out |

**Project_ID:** `2e57389b-9d04-4c70-b599-001797bcd76a`  
**Fork_ID:** `2801bd1e-55ed-40de-9667-ccaeb8ec8b7a` (diag leftover; Sync_Mode none)  
**Surface:** web · **App_Version:** `err-ui:2;surface:web`

---

## Notes

- Not a multi-user race (single reporter, sync idle at freeze).  
- Root cause: `calRepaintForkDots_` → `setExtendedProp` rebuilds rollup `eventContent` with empty `.bars-wrapper`; `eventDidMount` does not re-fire. Triggered on END PREP / END COLLAB (including Firebase→GAS commit-fail close cleanup).  
- Fix @ **GAS v716:** shared `calPaintRollupPhaseBars_` + `calRepaintVisiblePhaseBars_` after fork-dot rebuild (`01a_Calendar_Core.html`).

---

## Fix / ship

| Field | Value |
|-------|--------|
| Fixed_In_GAS | **716** |
| Came_back | — |

---

## Test suggestions (keep after fix)

1. Hover multi-day rollup on month calendar → strips visible.  
2. Clean prep/timeline END → hover still works.  
3. Commit-fail on close (Firebase→GAS) → hover still works (regression gate).  
4. ~15s fork poll after close → hover still works.
