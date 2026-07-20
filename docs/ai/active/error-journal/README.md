# Error journal — lasting bug memory (markdown only)

**Campaign:** [../user-error-reporting-journal-2026-07-19.md](../user-error-reporting-journal-2026-07-19.md)  
**Entry:** [AI_DOCTRINE.md](../../../AI_DOCTRINE.md)

**Sheet vs markdown:** `SM_Showrunner_LOGS` → `Error_Reports` is the **inbox** (raw Report presses). This folder is the **filing cabinet**. There is no `Error_Journal` Sheet tab.

Day work orders live beside this folder as `docs/ai/active/error-day-YYYY-MM-DD.md` (created when a pack is handed over).

---

## Thread index

| Thread file | Kind | State | Summary |
|-------------|------|-------|---------|
| [ERR-2026-07-20-pipeline-smoke.md](ERR-2026-07-20-pipeline-smoke.md) | single | Open | ROOT “test log” — first pack / pipeline smoke (day [../error-day-2026-07-20.md](../error-day-2026-07-20.md)) |

**States:** `Open` · `Fixed` · `Came_back`

**Kind:** `single` (same failure class) · `race` (close timestamps + same View / fork)

---

## Thread file pattern

One file per lasting problem, e.g. `ERR-2026-07-20-timeline-thrash.md`:

- Title, kind, state  
- Member `Report_ID`s, views, notes  
- `Fixed_In_GAS`, links to day campaign(s), came-back history  
- Test suggestions that stayed true after the fix  

---

## History

| Date | Note |
|------|------|
| 2026-07-20 | Folder stub (Phase 0). |
| 2026-07-20 | First pack: pipeline smoke thread opened; day campaign [../error-day-2026-07-20.md](../error-day-2026-07-20.md). |
