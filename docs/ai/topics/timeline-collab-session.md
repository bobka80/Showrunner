# Timeline collaboration session

**Entry:** [AI_DOCTRINE.md](../../../AI_DOCTRINE.md) · **Index:** [Project_TODO.md](../Project_TODO.md)

**Platform:** [session-fork-platform.md](session-fork-platform.md) — fork router, Firebase buffer, commit pattern.

**Replaces/enhances:** current timeline **single-editor** presence lock (`reportProjectPresence`, `🔒 NAME EDITING` in `02_Project_Editor_Core.html`, `03a_Timeline_Boot.html`).

**Status:** Phase A + live edit sync. On **web.app host**, Firestore Auth/listen/write run in the **shell** (not the GAS iframe) so collab shows `live sync (patch)` after reload while the room stays open. See [../active/data-access-layer.md](../active/data-access-layer.md).

**Known gap:** ~~saves during collab still require SAVE SHIFTS~~ **Fixed** — collab flushes on drag-end; prefers direct Firebase. ~~shift positions thrash in co-op~~ **Fixed**. ~~forgotten / disappearing concurrent edits~~ **Fixed** — touch/patch merge (editing crew B cannot rewrite crew A’s untouched strip).

**Post-campaign optional → now owned by next campaign:** auto fork / pull-in / idle eject (timeline **and** PA). **Build order:** **(1) testing pipeline H0 → (2) bulletproof multi-user → (3) auto UX** — [../active/multi-user-fork-industrial-and-auto.md](../active/multi-user-fork-industrial-and-auto.md) · process [../active/bulletproof-multiuser-live-editors-2026-07-18.md](../active/bulletproof-multiuser-live-editors-2026-07-18.md). Spec text remains in § Optional update below (canonical UX).

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

## Optional update — auto fork, live pull-in & idle eject

**When:** **Part B** of [multi-user-fork-industrial-and-auto.md](../active/multi-user-fork-industrial-and-auto.md) — **after** Part A (industrial harden) is director-confirmed. Not during DAL close paperwork alone.

**Why document:** Reconstruct this UX without re-brainstorming. Locked **2026-07-18** (director survey: all recommended picks + freelancer exclusion). Supersedes the 2026-07-16 “auto room + idle commit” sketch.

**Applies to:** `timelineCollab` **and** Project Assets / prep (`prep` session). Same lifecycle; different **who may start**. Canonical home for both; prep topic links here.

**Ship protocol (mandatory for this optional slice):**

1. Finish Part A of the multi-user fork campaign first.
2. **`node milestone.js`** with a clear note — that version is the **try/revert baseline** (campaign Part B0).
3. Implement this optional update and ship a **new** milestone (behavior **and** redesigned visual cues in the **same** milestone).
4. Floor smoke — if liked, keep; if not, **rollback production to the baseline milestone**.

### 1. Goal

People should not babysit START/END COLLAB or START/END PREP for normal work. Allowed surfaces **open** the Firebase fork when work is intended; everyone else who may see live **joins**; people already on the screen **get pulled in** when a fork opens; abandoned rooms **idle-eject** with commit to Sheets. **Freelancers never see the live fork.**

### 2. Who may **start** a fork (open when closed)

| Domain | Desktop (non-mobile shell) | Phone / mobile web | Station (RFID / dock host) |
|--------|----------------------------|--------------------|----------------------------|
| **Timeline** | Auto-start **only if** user has **timeline edit** credentials | Does **not** start — join only if already open | Does **not** start timeline forks |
| **Project Assets** | Auto-start if user has **PA / prep** credentials | **Never** auto-start — explicit **button** (“I’m working” / Start prep) | **Always** start (or join if open) — check-in/out intent |

**Desktop means:** desktop shell / non-mobile UA — not “phone browser zoomed wide.” Tablets follow **phone** rules (button for PA start).

**Join if already open:** any allowed non-freelancer on any surface joins the existing fork (no second snapshot).

### 3. Lifecycle phases

**A — Normal (no fork)**  
Slice reads/writes Sheets (or current non-session path). No live Firebase room.

**B — Opening (warm-up)**  
Starter has triggered open. Server snapshots → Firebase; **starter’s local pending edits** flush as the **entry delta**.

- **Only the starter** may change data.
- Everyone else on that view: **UI frozen** + clear sign (“Starting live session…” / equivalent).
- If Opening hangs **~45–60s**: starter gets Retry / Cancel; another **credentialed desktop** may **Take over / restart**.

**C — Live**  
Fork `open`. Multi-user edits on Firebase per credentials. Soft switch for early watchers completes here.

**D — Closing**  
Commit fork → Sheets, clear room, kick UIs out of live mode. Triggers: see §6.

### 4. Early watchers → auto pull-in (both domains)

If user A is already on timeline or PA in **Normal**, and user B (allowed starter) opens the fork:

1. A (if still on **that** view, and not freelancer) gets the fork-open signal.
2. During **Opening**: freeze + sign (same as other non-starters).
3. At **Live**: **soft switch** onto Firebase (no full reload preferred) + short banner (“Live session started — joining…”).
4. Visual **flag / cue system redesigned** in this same milestone — not only today’s banners.

**Scope:** only if still on that timeline/PA view — do **not** yank from calendar/home.  
**Phone PA:** may not *start*, but **does** auto-join when someone else already opened prep (watch + edit per creds).

### 5. Freelancers (hard rule)

Freelancers **must not** see the live fork at all:

- No auto-join, no pull-in, no live roster/patch UI for that slice.
- No “live session open” treatment that exposes Firebase room state.
- They stay on the **normal** path for that slice even while a fork is open for staff.

Exact role detection = existing freelancer / tunneling identity — confirm at build against RBAC.

### 6. Who closes / idle eject

**Close + commit** when any of these happens first:

- Explicit **End** (manager / allowed closer), or
- **Last person leaves** the live view (eligible participants), or
- **Room idle eject** (below).

Always **commit** on close — never silent discard.

**Room idle** (not “one person AFK while others still present”):

- No meaningful fork **writes** and no live **presence** in the room for N minutes.
- **Timeline:** **45 minutes**.
- **Project Assets / prep:** **75 minutes**.
- **T−5 minutes:** banner “Session closing — tap to keep open” (resets timer).
- **Station:** do **not** idle-close while **any station heartbeat** for that prep room is alive.
- On eject: commit → Sheets, clear room, push everyone out of live mode with a clear message.

Presence heartbeat cadence: ~30–60s (implementation detail; tune on floor).

### 7. Credentials vs surfaces (summary)

- **Start** = surface rules (§2) ∩ credentials ∩ not freelancer.
- **Join / pull-in** = fork open ∩ allowed to see that slice ∩ not freelancer.
- **Edit in Live** = join ∩ domain edit permission.
- **Watch-only in Live** = join without edit (e.g. timeline on phone without edit creds) — still on Firebase read path, not Sheets ghost.
- **Freelancer** = excluded from all live paths (§5).

### 8. Flag / cue redesign (same milestone)

Replace today’s ad-hoc live/collab cues with a clear system that shows at least:

- Normal vs Opening vs Live vs Closing
- Frozen warm-up vs editable
- Idle warning
- “Live session started — joining…” for pull-in

Exact art/copy TBD at build; behavior above is locked.

### 9. Explicitly out of this optional update

- Building during the DAL campaign.
- Logistics Hub atomic ops (not a session fork).
- Changing Sheets as official record **between** sessions.
- Auto-starting timeline from station.
- Phone auto-starting PA without the button.

### 10. Checklist (when building — leave unchecked until then)

- [ ] Timeline: desktop+edit auto-start; others join-only; station never starts timeline
- [ ] PA: desktop auto-start; phone button-only start; station always start/join
- [ ] Opening: starter-only + entry delta; freeze+sign for others; timeout + take over
- [ ] Live pull-in for early watchers on same view (soft switch + banner)
- [ ] Freelancers excluded from all live fork visibility/join
- [ ] Close: last leave ∪ End ∪ idle; always commit
- [ ] Idle: 45m timeline / 75m prep; T−5 keep-open; station heartbeat blocks idle close
- [ ] Redesigned visual cues same milestone
- [ ] Baseline milestone → try → keep or rollback

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

### After campaign — optional UX → **active campaign Part B**
- [ ] Auto fork + live pull-in + Opening warm-up + idle eject (timeline **and** PA) — see [multi-user-fork-industrial-and-auto.md](../active/multi-user-fork-industrial-and-auto.md) Part B; milestone-before-try / revert-if-disliked; freelancers excluded from live

---

## Comparison to prep session

| | Prep session | Timeline session |
|--|--------------|------------------|
| **Ends when** | Last leave ∪ End ∪ idle eject (optional post-campaign — see § above); today still manager **End preparation** | Last leave ∪ End ∪ idle eject (optional post-campaign) |
| **Who starts (optional post-campaign)** | Desktop+creds / station always / phone button only | Desktop + timeline **edit** creds only |
| **Data** | PA + ledger + trucks | Shifts / phases |

Both use [session-fork-platform.md](session-fork-platform.md).

**Crew confirm & field actuals** (separate from collab edit room): [timeline-shift-field-crew.md](timeline-shift-field-crew.md).
