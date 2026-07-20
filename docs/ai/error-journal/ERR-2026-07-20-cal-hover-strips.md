# ERR-2026-07-20 — Calendar hover phase strips vanish after prep/timeline

**Kind:** `single`  
**State:** `Open`  
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
- Strong link to `calRepaintForkDots_` / fork clear+poll after END PREP / END COLLAB (v698–v704 era).  
- Strips painted in `eventDidMount` only; `eventContent` ships empty `.bars-wrapper`.  
- **Director 2026-07-20:** Likely when **Firebase fails to commit to Google Apps Script** on fork close (not necessarily every leave). Tie to commit fail-safe B (v711–v712) close/restore path + calendar refresh.

---

## Fix / ship

| Field | Value |
|-------|--------|
| Fixed_In_GAS | — |
| Came_back | — |

---

## Test suggestions (keep after fix)

1. Hover multi-day rollup on month calendar → strips visible.  
2. Clean prep/timeline END → hover still works.  
3. Commit-fail on close (Firebase→GAS) → hover still works (regression gate).  
4. ~15s fork poll after close → hover still works.
