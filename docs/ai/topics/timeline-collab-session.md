# Timeline collaboration session

**Entry:** [AI_DOCTRINE.md](../../../AI_DOCTRINE.md) · **Index:** [Project_TODO.md](../Project_TODO.md)

**Platform:** [session-fork-platform.md](session-fork-platform.md) — fork router, Firebase buffer, commit pattern.

**Replaces/enhances:** current timeline **single-editor** presence lock (`reportProjectPresence`, `🔒 NAME EDITING` in `02_Project_Editor_Core.html`, `03a_Timeline_Boot.html`).

**Status:** Phase A + **true live edit sync** with **direct client → Firestore** writes while fork open (GAS fallback if client auth fails). Drag-end / PA mutate flush without SAVE. **Hotfix:** collab writes full mode state (checkbox is view-only) so clients stop thrashing positions. Optional auto-room / idle commit still post-campaign. See [../active/data-access-layer.md](../active/data-access-layer.md).

**Known gap:** ~~saves during collab still require SAVE SHIFTS~~ **Fixed** — collab flushes on drag-end; prefers direct Firebase. ~~shift positions thrash in co-op~~ **Fixed** — full-state fork writes + apply guards.

**Post-campaign optional (do not build during DAL campaign):** [§ Optional update — auto room + idle commit](#optional-update--auto-room--idle-commit) — after whole DAL/fork campaign finishes; milestone first; try on floor; revert if disliked.

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

## Optional update — auto room + idle commit

**When:** **After** the current DAL / fork campaign is complete (Phases through reconciliation/cache as director closes them). **Not** in-flight campaign work.

**Why document now:** Reconstruct this UX later without re-brainstorming. Locked product shape from director (2026-07-16).

**Ship protocol (mandatory for this optional slice):**

1. Finish campaign first.
2. **`node milestone.js`** with a clear note — that version is the **try/revert baseline**.
3. Implement this optional update and ship a **new** milestone.
4. Floor smoke — if liked, keep; if not, **rollback production to the baseline milestone**.

### Product shape

| Rule | Intent |
|------|--------|
| **First user into timeline opens co-op** | Fork starts with person 1 — room is hot **before** person 2 arrives. No separate START COLLAB ritual. |
| **Second user joins live** | Opens timeline → joins existing Firebase fork → sees live grid immediately. |
| **Seamless warm-up** | User may edit while snapshot/fork is still opening; when Firebase is ready, **cross-check** local pending work vs snapshot and **delta** immediately so entry feels continuous. |
| **Always fork while in timeline** | Timeline open = working on the fork (not Sheets mid-session). |
| **Idle timeout → Sheets + clear room** | After inactivity (no meaningful edits + dead presence heartbeats — e.g. hibernated laptop), **commit fork → Sheets** and **push everyone out** of timeline room mode. Mediates ghost sessions. |

### Idle timeout details (locked intent)

- **Happy path:** last person leaves timeline → commit (unchanged).
- **Safety net:** room abandoned (all heartbeats dead / no room-level activity for N minutes) → same commit path → clear room.
- **Room-level activity:** one idle ghost must not close the room while another user is still editing.
- **Grace:** short “Stay in room” warning before kick; one action resets the timer.
- **On timeout:** **commit**, never silent discard.
- **Re-entry:** opening timeline again re-opens the room (first-user-opens model).
- **Timing (starting point, not code yet):** heartbeat ~30–60s; idle threshold ~15–30 min — tune after try.

### Explicitly out of this optional update

- Prep session UX (START/END PREP stays manager-driven unless a separate topic says otherwise).
- Logistics Hub atomic ops.
- Changing Sheets as official record between sessions.

### Checklist (when building — leave unchecked until then)

- [ ] Auto-open `timelineCollab` on timeline enter (saved project only)
- [ ] Join existing open fork for second+ users (no re-snapshot if live)
- [ ] Local pending buffer + merge/delta when fork becomes `open`
- [ ] Remove primary START COLLAB ceremony (manager force-close may remain)
- [ ] Last leave + idle timeout both commit → Sheets and clear room UI
- [ ] Presence heartbeat + room-level idle detection
- [ ] Pre-build: dedicated baseline milestone; post-try: keep or rollback

---

## Mode & UX

- [ ] Open timeline → **join timeline room** (if project saved — keep existing `NEW` project guard)
- [x] Button: `👥 N IN TIMELINE` instead of `🔒 NAME EDITING` when room active (door lock removed — open always allowed)
- [ ] Roster panel: names in room
- [ ] Activity: “Bobby moved shift X”, “Maria added phase Y”
- [x] Write timeline changes on **drag end** only — not per mousemove (flush to Firebase while collab open)
- [x] Multi-user shift drag with drag-end writes (no SAVE button required during collab; SAVE still optional)
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
- [x] Enter/leave timeline room APIs (`openDalSession` / `closeDalSession` type `timelineCollab`)
- [x] Snapshot timeline → Firebase on START COLLAB
- [x] Hotfix: open/close must not hold ScriptLock across Firestore (starved presence → stuck 🔒 + START COLLAB timeout)
- [x] Button: `👥 N IN TIMELINE` instead of door lock (single-editor presence lock removed)
- [x] **Live sync** — session open/close + **edit flush** to Firebase on drag-end / discrete edits; remotes apply via listener (SAVE optional during collab)
- [x] **Depends on DAL Slice D** — timeline collab while prep is open (dual-domain registry)
- [x] Multi-user shift drag with drag-end writes (no SAVE button required)
- [x] Manual END COLLAB commit (last-leave auto-commit later)

### Phase B — Phases + sub-events on fork
- [ ] Extend buffer to phase row + sub-event data

### Phase C — Polish
- [ ] Grace period, force-close, session history export to `SM_Showrunner_LOGS` optional

### After campaign — optional UX (see section above)
- [ ] Auto room on enter + join live + warm-up delta + idle commit/kick — **post-campaign only**; milestone-before-try / revert-if-disliked

---

## Comparison to prep session

| | Prep session | Timeline session |
|--|--------------|------------------|
| **Ends when** | Manager **End preparation** | **Last person leaves** timeline (optional later: idle timeout = synthetic last leave) |
| **Who** | Whole floor on project | Whoever opened timeline |
| **Data** | PA + ledger + trucks | Shifts / phases |

Both use [session-fork-platform.md](session-fork-platform.md).

**Crew confirm & field actuals** (separate from collab edit room): [timeline-shift-field-crew.md](timeline-shift-field-crew.md).
