# Timeline collaboration session

**Entry:** [AI_DOCTRINE.md](../../AI_DOCTRINE.md) · **Index:** [Project_TODO.md](../Project_TODO.md)

**Platform:** [session-fork-platform.md](session-fork-platform.md) — fork router, Firebase buffer, commit pattern.

**Replaces/enhances:** current timeline **single-editor** presence lock (`reportProjectPresence`, `🔒 NAME EDITING` in `02_Project_Editor_Core.html`, `03a_Timeline_Boot.html`).

**Status:** Backlog

**Last swept:** 2026-06-30

---

## Director intent

- **Multiple people** in timeline at once — coordinate on phone while **moving shift strips**.
- Moves **reflect live** for everyone in the timeline room.
- **Listed participants** + **visible actions** (audit during session).
- Work on **Firebase fork** — no direct Sheets timeline reads/writes while inside.
- **Last person leaves** timeline → **close door** → full timeline version committed to Sheets → fork routes left.

Not: one editor + others read-only (today).  
Is: **collaborative room** with shared live state.

---

## Mode & UX

- [ ] Open timeline → **join timeline room** (if project saved — keep existing `NEW` project guard)
- [ ] Button: `👥 N IN TIMELINE` instead of `🔒 NAME EDITING` when room active
- [ ] Roster panel: names in room
- [ ] Activity: “Bobby moved shift X”, “Maria added phase Y”
- [ ] Write timeline changes on **drag end** only — not per mousemove
- [ ] **Last leave** triggers commit (with optional **60s grace** if someone disconnects briefly — TBD)
- [ ] Optional: manager **Force close session** if grace fails
- [ ] FCM: “timeline session active on Project X”

---

## Fork coverage

| Data | During session | Commit |
|------|----------------|--------|
| Shifts | Firebase | `Shift_Assignments` |
| Phases | Firebase | `Phase_Blocks` |
| Sub-events | Firebase | timeline payload |
| Crew rows / dept overrides | Firebase or read-only from Sheets snapshot | per save contract |

**Not on fork:** Project Assets, operations ledger, vault.

---

## Conflict rules (TBD — decide before build)

- [ ] Same strip dragged by two users — last write wins vs lock-while-dragging
- [ ] Delete shift while another user edits — server reject + toast

---

## Code touchpoints (planned)

- [ ] Timeline router wrapping `getTimelineData` / `saveTimelineData`
- [ ] `03a`–`03e` — live listeners during session; `currentIsReadOnly` replaced by **room mode** not **excluded editor**
- [ ] `reportProjectPresence` — evolve or replace with Firebase roster (GAS cache insufficient for rich action log)
- [ ] Bulk `saveTimelineData` on session close only (not per drag)

---

## Phased delivery

### Phase A — Room + live shifts on fork
- [ ] Enter/leave timeline room APIs
- [ ] Snapshot timeline → Firebase on first enter (or on first edit)
- [ ] Multi-user shift drag with drag-end writes
- [ ] Commit when last participant leaves

### Phase B — Phases + sub-events on fork
- [ ] Extend buffer to phase row + sub-event data

### Phase C — Polish
- [ ] Grace period, force-close, session history export to `SM_Showrunner_LOGS` optional

---

## Comparison to prep session

| | Prep session | Timeline session |
|--|--------------|------------------|
| **Ends when** | Manager **End preparation** | **Last person leaves** timeline |
| **Who** | Whole floor on project | Whoever opened timeline |
| **Data** | PA + ledger + trucks | Shifts / phases |

Both use [session-fork-platform.md](session-fork-platform.md).

**Crew confirm & field actuals** (separate from collab edit room): [timeline-shift-field-crew.md](timeline-shift-field-crew.md).
