# Error journal — lasting bug memory (operational log)

**Not a campaign.** Standing log of what floor Report → Hand over packs found, across the whole product — same family as root `RELEASES.md` (what we shipped) and `WORKS_LOG.md` (local checkpoints).

**Build history (archived):** [../archive/user-error-reporting-journal-2026-07-19.md](../archive/user-error-reporting-journal-2026-07-19.md)  
**Entry:** [AI_DOCTRINE.md](../../../AI_DOCTRINE.md) · **Map:** [../README.md](../README.md)

**Sheet vs markdown:** `SM_Showrunner_LOGS` → `Error_Reports` is the **inbox** (raw Report presses). This folder is the **filing cabinet**. There is no `Error_Journal` Sheet tab.

**Day work orders** (when a pack is handed over): `docs/ai/error-journal/days/error-day-YYYY-MM-DD.md`  
Smoke day archived: [../archive/error-day-2026-07-20.md](../archive/error-day-2026-07-20.md).

---

## Thread index

| Thread file | Kind | State | Summary |
|-------------|------|-------|---------|
| [ERR-2026-07-20-pipeline-smoke.md](ERR-2026-07-20-pipeline-smoke.md) | single | Fixed | ROOT test presses (4 Report_IDs) — pipeline smoke closed; day [../archive/error-day-2026-07-20.md](../archive/error-day-2026-07-20.md) |
| [ERR-2026-07-20-cal-hover-strips.md](ERR-2026-07-20-cal-hover-strips.md) | single | Fixed | Main calendar hover phase strips after prep/timeline; Fixed_In_GAS **716**; day [days/error-day-2026-07-20.md](days/error-day-2026-07-20.md) |

---

## How to use (agents)

1. ROOT hands over a pack (clipboard) → paste into chat.  
2. Cross-read this index + recent day files under `days/`.  
3. Categorize (single vs race by time + view).  
4. Open/update thread files here; write/update `days/error-day-YYYY-MM-DD.md` if needed.  
5. **No code until director OK go** on a named item.  
6. When a fix ships, note `Fixed_In_GAS` from root `RELEASES.md`.

---

## Changelog

| Date | Note |
|------|------|
| 2026-07-20 | Pack 1: pipeline smoke thread opened; day campaign archived later. |
| 2026-07-20 | Build campaign archived; journal left in `active/` temporarily. |
| 2026-07-20 | **Moved to `docs/ai/error-journal/`** — operational log, not a campaign. |
| 2026-07-20 | Pack: calendar hover strips regression → [ERR-2026-07-20-cal-hover-strips.md](ERR-2026-07-20-cal-hover-strips.md); day [days/error-day-2026-07-20.md](days/error-day-2026-07-20.md). |
| 2026-07-20 | **E2026-07-20-B shipped GAS v716** — re-paint phase bars after fork-dot `setExtendedProp` rebuild. |
