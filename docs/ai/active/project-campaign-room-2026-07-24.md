# Active — Project Campaign Room (Firebase hybrid)

**Entry:** [AI_DOCTRINE.md](../../../AI_DOCTRINE.md) · **Map:** [../README.md](../README.md)  
**Decision brief:** [../topics/project-campaign-firebase-hybrid-decision-2026-07-21.md](../topics/project-campaign-firebase-hybrid-decision-2026-07-21.md)  
**Architecture pack §4:** [../topics/architecture-multi-campaign-pack-2026-07-21.md](../topics/architecture-multi-campaign-pack-2026-07-21.md)  
**Director locks:** [../topics/architecture-campaign-director-locks-2026-07-21.md](../topics/architecture-campaign-director-locks-2026-07-21.md)  
**Design lock to revise:** [../archive/dal-firebase-design-lock-2026-07-13.md](../archive/dal-firebase-design-lock-2026-07-13.md) rules 1–2  
**Predecessor:** [../archive/logistics-ledger-2026-07-21.md](../archive/logistics-ledger-2026-07-21.md) (M0–M5 + Exit **COMPLETE**)  
**Live forks today:** [../topics/dal-live-forks-pause.md](../topics/dal-live-forks-pause.md) — **LIVE** (`DAL_LIVE_FORKS_PAUSED = false`)  
**Fragile:** [../FRAGILE_ZONES.md](../FRAGILE_ZONES.md) § DAL prep/timeline session UI · prep PA fork live sync · timeline fork live sync

**Opened:** 2026-07-24 · **Status:** **ACTIVE** — **R2 shipping**. Smoke then **OK go for R3** (ledger slice).  
**Production tip:** see RELEASES.md. Prep live rollback pin still **v654**.

---

## Fresh-agent start

1. Read [AI_DOCTRINE.md](../../../AI_DOCTRINE.md) → [GLOSSARY.md](../GLOSSARY.md) § sub-events vs phases → **this file** → locks → pack §4 → decision brief.  
2. Obey director locks — do **not** reopen settled IDs (`idle_touch`, `checkpoint_*`, `room_registry`, etc.).  
3. Ledger prerequisite is **done** (PA truck cols gone; ledger SoT). Build room on **meta + PA + timeline + ledger** — not truck-on-PA.  
4. **Index columns confirmed R1:** `Dal_Campaign_Room_UID` / `_Status` / `_Opened_At` / `_Opened_By` / `_Last_Activity_At` / `_Last_Published_At`. Status vocab mirrors forks: `opening` \| `open` \| `committing` (empty = closed). `open` = warm.  
5. RFID `Operations_Ledger` stays **outside the room forever**.  
6. After any implementation: `node milestone.js "…"`; update this checklist same session.

---

## Goal (plain language)

One warm Firebase **Project Campaign Room** per project for show week:

- People reopen the same project without a full commit/reopen every short visit  
- Sheets stay durable via **~30 minute** publish checkpoints (only when dirty)  
- Room auto-closes after **48 hours of silence** (writes or station dock — **not** mere presence)  
- Explicit **End / Publish now** still works  
- One `campaignRoomUid` covers **meta → PA → timeline → ledger**

---

## Director locks (do not reopen)

| Lock | Value |
|------|--------|
| Idle | **48h silence**; reset on room-slice **WRITE** (meta / PA / ledger / timeline) **or** station docked |
| Presence | Roster UX only — does **not** reset idle; not a commit trigger |
| Explicit End | Keep End / Publish now |
| Checkpoint | Fixed **~30m**; always **meta → PA → timeline → ledger**; room **stays live** (no routine freeze) |
| Registry | One `campaignRoomUid` for all four slices |
| Warm read | Tracker/Conflicts: Sheets publish default + optional Live preview (ledger **and** timeline) |
| Offer pull | One-shot from live Firebase, then freeze in the offer |
| Ops ledger | Forever outside the room |
| Short idle / last-leave | **Do not** keep 45m/75m / last-leave as primary commit once Room ships |

**Idle model:** not a hard 48h lease. Room stays open while activity continues; closes after 48 continuous hours with no qualifying activity.

---

## Four slices

| Slice | Firebase path | Sheets |
|-------|---------------|--------|
| **meta** | `projects/{id}/meta/` (propose) | Projects_Index campaign columns |
| **PA** | `projects/{id}/assets/` *(exists)* | `Project_Assets` (no truck cols) |
| **timeline** | `projects/{id}/timeline/` *(exists)* | shifts / `Phase_Blocks` / `Project_Timelines` |
| **ledger** | `projects/{id}/logistics/` *(new)* | `Logistics_Ledger` |

**Size caps (per state doc):** WARN 512 KiB / 1500; MAX 900 KiB / 4000.

---

## Lifecycle: keep vs replace

**KEEP:** `Dal_Router` / repos / adapters; reconcile; fail-safe backup/retry; host Auth/listen; calendar chrome reading room flags.

**REPLACE / retarget:** dual-domain close triggers; last-leave / short idle as commit; orphan/refresh toward room; committing freeze for **End / idle-close only** — **not** routine 30m checkpoint.

**Do not scrap the fork** — extend it into one warm room.

---

## Doctrine revisions (R0 filed)

Canonical text: [../archive/dal-firebase-design-lock-2026-07-13.md](../archive/dal-firebase-design-lock-2026-07-13.md) § Campaign Room revision.

| Design lock (2026-07-13) | New meaning at Room time |
|--------------------------|---------------------------|
| Rule 1 — Sheets between sessions | While room warm: Firebase = active workspace; Sheets = latest **published** durable record (may lag ≤ checkpoint). Between rooms / after End: Sheets restore point. |
| Rule 2 — no periodic sync | Periodic **publish checkpoints** allowed during active Campaign Room. Final publish on End / idle close. RFID ops remain per-op atomic. |

Pointers: [../topics/session-fork-platform.md](../topics/session-fork-platform.md) § Future · [../FRAGILE_ZONES.md](../FRAGILE_ZONES.md) idle note.

**Until R1+ ships:** production still runs short-session rules 1–2.

---

## R0 inventory — dual-domain today (production)

### Projects_Index session columns

Source: `Dal_Sessions.js` → `DAL_SESSION_INDEX_COLS` (lazy-added via `dalEnsureSessionIndexColumns_`).

**Legacy (pre dual-domain):**

- `Dal_Session_Type`
- `Dal_Session_Status`
- `Dal_Session_UID`
- `Dal_Session_Opened_At`
- `Dal_Session_Opened_By`

**Prep domain:**

- `Dal_Prep_Session_Status`
- `Dal_Prep_Session_UID`
- `Dal_Prep_Session_Opened_At`
- `Dal_Prep_Session_Opened_By`

**Timeline domain:**

- `Dal_Timeline_Session_Status`
- `Dal_Timeline_Session_UID`
- `Dal_Timeline_Session_Opened_At`
- `Dal_Timeline_Session_Opened_By`

Family helpers: `dalSessionFamilyPrefix_` / `dalDomainSessionCols_` (`prep` → `Dal_Prep_Session_*`, `timeline_collab` → `Dal_Timeline_Session_*`).

### Idle timers (client)

| Domain | Constant | Value | File |
|--------|----------|-------|------|
| Timeline | `DAL_IDLE_TL_MS_` | **45m** | `07_Core_Globals.html` |
| Prep | `DAL_IDLE_PREP_MS_` | **75m** | `07_Core_Globals.html` |

Touch / arm / keep-open: `dalTouchRoomIdle_` / `dalArmRoomIdle_` / `dalKeepOpenRoomIdle_` / `dalClearRoomIdle_`.  
T−5 SYNC: “Session closing — tap to keep open”.  
Idle eject → same commit path as End (`closeDalSession`).

**Station today (prep only):** `dalPrepIdleBlockedByStation_` **blocks** idle eject when:

- local `IS_STATION_DEVICE` and (`stationHostActive_()` or `dalPrepUiOpen`), **or**
- any prep occupant `mode` matches `/station/i`

It does **not** reset a shared 48h room timer (that timer does not exist yet). Presence ping alone does not count as write activity.

### Close / commit triggers (call sites)

All roads → `closeDalSession(projectId, actor, sessionType)` in `Dal_Sessions.js` (and Firebase commit path in `Dal_Firebase.js`).

| Trigger | Entry points |
|---------|----------------|
| Explicit End | `closeDalPrepSession` / END PREP (`02a_Project_Equipment.html`, `02e6_Dal_Session.html`); END COLLAB (timeline) |
| Last-leave prep | `dalMaybeLastLeaveClosePrep_` — `07_Core_Globals.html`; callers: PA close (`02a`), mobile assets (`01h`), station undock (`11m_Station_Dock_Logic.html`), unload |
| Last-leave timeline | `dalMaybeLastLeaveCloseTimeline_` — `07_Core_Globals.html`; callers: timeline boot (`03a_Timeline_Boot.html`), unload |
| Browser unload | `dalOnBrowserLeaveLiveRooms_` (`pagehide` / `beforeunload`) → localStorage unload flag + last-leave best-effort |
| Idle auto-close | `dalArmRoomIdle_` eject path (prep/timeline timers above) |
| Orphan enter-gate | `dalGatePrepEnterForOrphan_` — before soft-join / auto-prep (`02a` paint-first @ v740; `02e6`) |
| Empty-room reclaim | `dalMaybeReclaimEmptyLiveForks_` — calendar/editor others poll (`02_Project_Editor_Core.html`); backup to enter-gate |

**Room retarget (R2+):** one End / 48h idle / orphan-on-room — **not** dual last-leave + 45m/75m as primary.

---

## R0 proposals — director confirm before Engine write (R1)

### A. Projects_Index campaign columns

Add (lazy-ensure, same pattern as session cols):

| Column | Role |
|--------|------|
| `Dal_Campaign_Room_UID` | One warm-room id (`campaignRoomUid`) |
| `Dal_Campaign_Room_Status` | `normal` / `opening` / `live` / `committing` / `closed` (mirror session vocabulary) |
| `Dal_Campaign_Opened_At` | Room open stamp |
| `Dal_Campaign_Opened_By` | Actor who opened |
| `Dal_Campaign_Last_Activity_At` | Idle clock — bumped on qualifying write **or** station dock |
| `Dal_Campaign_Last_Published_At` | Last successful ordered publish checkpoint / final publish |

**Transition:** keep dual `Dal_Prep_*` / `Dal_Timeline_*` columns through R1–R2; stop treating them as primary close drivers once room is live. Do **not** delete legacy `Dal_Session_*` in R1.

**Firebase meta mirror (R1):** `projects/{id}/meta/` should carry the same stamps (`roomUid`, `status`, `openedAt`, `openedBy`, `lastActivityAt`, `lastPublishedAt`) so host can read warmth without Sheets lag.

### B. Station-docked idle-reset (server-visible)

Lock `idle_touch` = `write_or_station`. Proposed rule for R5 (design now; code later):

1. **Write reset:** any successful room-slice write (meta / PA / timeline / logistics) bumps `lastActivityAt` (Firebase meta + Index column on next durable touch / checkpoint — exact write cadence in R1/R5).  
2. **Station dock reset:** when a station is **docked to this project** (host reports docked + `projectId` match), bump `lastActivityAt`. Prefer a dedicated dock heartbeat (or reuse station presence with `mode` containing `station` **and** docked-project equality) that is **server-visible** — not a client-only idle block.  
3. **Not resets:** roster presence ping alone; peer soft-join; opening PA without a write; undock without write.  
4. **Vs today:** replace “block prep idle eject while station present” with “station dock **resets** the shared 48h silence clock.” Blocking short idle becomes moot once 45m/75m are retired.

**Confirm asked:** column names in §A and station rule in §B — say OK with R1 go, or edit names first.

---

## Still open (not R0 blockers)

- Checkpoint-fail escalation (lag > N hours) — R4  
- Soft free-at later retarget to `Phase_Blocks` — out of scope unless director asks  
- Exact Index / meta field names if director wants different labels than §A  

---

## Checklist

### Gates

- [x] Logistics Ledger M0–M5 + Exit complete (forks live)
- [x] Architecture pack + director locks filed
- [x] Active brief created (this file)
- [x] Director **OK go** to open this campaign (2026-07-24)
- [x] Director **OK go** for **R0** (doctrine revision + inventory — docs only) — done this session
- [x] Director **OK go** for **R1** code (room registry + meta slice) — 2026-07-24
- [x] Director **OK go** for **R2** (unify PA + timeline under room uid) — 2026-07-24
- [ ] Director **OK go** for **R3** (ledger slice in room)

### R0 — Doctrine + inventory (no lifecycle code)

- [x] File explicit design-lock rule 1–2 revision text (archive note + FRAGILE / session-fork pointers)
- [x] Inventory current dual-domain session columns + close triggers + idle / last-leave call sites
- [x] Propose Projects_Index campaign columns (`campaignRoomUid`, idle / publish stamps) — **confirmed with R1 go**
- [x] Propose station-docked idle-reset rule (server-visible signal) — **confirmed with R1 go** (code in R5)
- [x] Docs-only session — **no** `node milestone.js` (no inventory API shipped)

### R1 — Room registry + meta slice

- [x] One `campaignRoomUid` on Index; open/join room from project editor entry
- [x] `projects/{id}/meta/` warm doc (`meta/state`: roomUid, status, openedAt, openedBy, lastActivityAt, lastPublishedAt)
- [x] Calendar / editor chrome can read “room warm” (green calendar dot + green inset on module buttons)
- [x] Ship + smoke: open project → room warm flag visible; no checkpoint yet — **shipped GAS v741**; director smoke next

### R2 — Unify PA + timeline under room uid

- [x] Prep + timeline live paths share `campaignRoomUid` (keep slice listen paths; `_meta.roomUid` stamp)
- [x] Retarget orphan / refresh reclaim to room (soft-rejoin when warm — no domain commit)
- [x] Stop using last-leave / 45m·75m as primary commit once room is open
- [x] Explicit End still final-publishes + closes room (`closeDalCampaignRoom`; END ROOM label when warm)
- [ ] Ship + smoke: PA + timeline both live in one room; End closes both cleanly

### R3 — Ledger slice in room

- [ ] `projects/{id}/logistics/` live path + host/GAS listen/flush parity with Sheets `Logistics_Ledger`
- [ ] Arrange / ledger writers honor warm room (Firebase) vs published (Sheets)
- [ ] Size WARN/MAX for logistics state
- [ ] Ship + smoke: truck arrange in warm room; Sheets unchanged until publish

### R4 — 30m publish checkpoint

- [ ] Dirty-since-last-publish gate
- [ ] Ordered publish **meta → PA → timeline → ledger**; room stays live (no routine freeze)
- [ ] `lastPublishedAt` + per-slice content signatures
- [ ] Fail → room stays live; manager retry (reuse fail-safe B/C patterns)
- [ ] Subtle “Last published…” UI (alarm only on fail)
- [ ] Ship + smoke: edit → wait/force checkpoint → Sheets match; peers stay live

### R5 — 48h idle close + Exit polish

- [ ] Idle timer: reset on slice WRITE or station dock; presence alone does not
- [ ] Auto-close: final publish → close room → next entry from Sheets
- [ ] Warm-read hybrid badge for Tracker/Conflicts (optional Live preview)
- [ ] Offer one-shot pull from warm Firebase (if Offer surface touches room)
- [ ] Update session-fork-platform + FRAGILE “how it works now”
- [ ] Archive this campaign when director agrees Exit complete

---

## What NOT to do

- Do not build on PA truck columns (already stripped)  
- Do not merge movement into RFID `Operations_Ledger`  
- Do not scrap DAL router/repos — change lifecycle triggers only  
- Do not use presence / last-leave / short idle as Room commit primary  
- Do not freeze all users every 30m for a routine checkpoint  
- Do not invent packet-sync (Campaign 3) inside this build  

---

## Session log

| Date | Note |
|------|------|
| 2026-07-24 | Active brief opened (director OK go). Next: OK go for **R0**. |
| 2026-07-24 | **R0 complete** (docs): design-lock § Campaign Room revision; dual-domain inventory; Index + station proposals. Next: **OK go for R1**. |
| 2026-07-24 | **R1 shipped @ GAS v741** — Index `Dal_Campaign_*`, `openOrJoinDalCampaignRoom`, Firebase `meta/state`, calendar green room dot + editor chrome. Firestore rules deployed. Next: director smoke → **OK go for R2**. |
| 2026-07-24 | **R2 implemented** — `_meta.roomUid`, soft leave/idle/orphan when warm, `closeDalCampaignRoom` + END ROOM. Ship pending. |)
