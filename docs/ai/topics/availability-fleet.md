# Global availability & fleet tracker

**Entry:** [AI_DOCTRINE.md](../../../AI_DOCTRINE.md) · **Index:** [Project_TODO.md](../Project_TODO.md)

**Last swept:** 2026-06-28 · **Status:** Partial — equipment tracker matrix shipped; truck envelopes + TRANSFER UI pending

---

## Shipped

- [x] **Equipment availability tracker** — full modal (`availability-modal-overlay`, `04b_Equipment_Tracker.html`): date range, watchlist, Gantt-style event strips, playhead, conflict-style grid rendering
- [x] **`Vehicle_Tier` column** in fleet schema + roster reads tier (`Resources_Core.js`, `Logistics_Roster.js`)
- [x] **`[TRANSFER_FROM]` conflict bypass** in availability engine (`Conflicts.js`) — backend only

## Remaining

- [ ] **SVG histogram “waterline” view** — original spec (owned vs draft/maintenance/subrent/shortage bars with drill-down) — tracker today is matrix/Gantt, not that histogram UI
- [ ] **Fleet status truck envelopes** — nested under event strips on **transit dates only**
- [ ] **`[TRANSFER_FROM]` operator UI** — direct venue-to-venue / vendor-to-site tagging in project editor

**Glossary:** `[TRANSFER_FROM]` — [GLOSSARY.md](../GLOSSARY.md).
