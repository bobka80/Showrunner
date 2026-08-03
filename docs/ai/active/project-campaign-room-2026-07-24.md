# Active — Project Campaign Room (Firebase hybrid)

**Entry:** [AI_DOCTRINE.md](../../../AI_DOCTRINE.md) · **Map:** [../README.md](../README.md)  
**Decision brief:** [../topics/project-campaign-firebase-hybrid-decision-2026-07-21.md](../topics/project-campaign-firebase-hybrid-decision-2026-07-21.md)  
**Architecture pack §4:** [../topics/architecture-multi-campaign-pack-2026-07-21.md](../topics/architecture-multi-campaign-pack-2026-07-21.md)  
**Director locks:** [../topics/architecture-campaign-director-locks-2026-07-21.md](../topics/architecture-campaign-director-locks-2026-07-21.md)  
**Design lock:** [../archive/dal-firebase-design-lock-2026-07-13.md](../archive/dal-firebase-design-lock-2026-07-13.md) § Campaign Room revision  
**Predecessor:** [../archive/logistics-ledger-2026-07-21.md](../archive/logistics-ledger-2026-07-21.md) (M0–M5 + Exit **COMPLETE**)  
**Live forks today:** [../topics/dal-live-forks-pause.md](../topics/dal-live-forks-pause.md) — **LIVE** (`DAL_LIVE_FORKS_PAUSED = false`)  
**Fragile:** [../FRAGILE_ZONES.md](../FRAGILE_ZONES.md) § DAL prep/timeline session UI · prep PA fork live sync · timeline fork live sync

**Opened:** 2026-07-24 · **Status:** **ACTIVE** — **Five-slice architecture filed 2026-07-31**. Arrangement integrity Phase A @ **GAS v750**. Next preferred after smoke: **Hub checklist UX (Phase B)** or **OK go for R3c**.  
**Production tip:** see RELEASES.md. Latest room ships: R3b Hub @ **GAS v745**; arrangement integrity @ **GAS v750**. Prep live rollback pin still **v654**.

**Director briefing (final):** Five-Slice Warm Architecture — 2026-07-31. Supersedes prior four-slice model and the “ops forever outside” lock.

---

## Fresh-agent start

1. Read [AI_DOCTRINE.md](../../../AI_DOCTRINE.md) → [GLOSSARY.md](../GLOSSARY.md) § sub-events vs phases → **this file** → locks → pack §4 → decision brief.  
2. Obey director locks — do **not** reopen settled IDs (`idle_touch`, `checkpoint_interval`, `room_registry`, etc.) without director. **`ops_ledger` was reopened 2026-07-31** → now `warm_fifth_slice`.  
3. Ledger prerequisite is **done** (PA truck cols gone; logistics ledger SoT for movement). Build room on **five slices** — not truck-on-PA.  
4. **Index columns confirmed R1:** `Dal_Campaign_Room_UID` / `_Status` / `_Opened_At` / `_Opened_By` / `_Last_Activity_At` / `_Last_Published_At`. Status vocab: `opening` \| `open` \| `committing` (empty = closed). `open` = warm.  
5. **Ops is inside the room** (fifth slice). Still **outside** by design: vault/master catalog, Equipment Tracker conflicts, crew roster, financials, offers.  
6. After any implementation: `node milestone.js "…"`; update this checklist same session.

---

## Goal (plain language)

One warm Firebase **Project Campaign Room** per project:

- Open project **anywhere** (desktop editor, mobile, station) → warm the **same** shared room (`campaignRoomUid`)  
- Warm = “we still care about this project.” Cold after **N-day silence** (single config constant; today **48h**). Rewarm on return may cost ~10–20s once  
- Firebase = live short-term SoT while warm; Sheets = durable long-term SoT via ~30m checkpoints + End / idle close  
- One `campaignRoomUid` covers **all five slices**  
- Explicit **END ROOM** still final-publishes + closes  

**One-line doctrine:** Open project anywhere → warm shared room → stay warm while interest continues → cold after N-day silence → rewarm on return; N is adjustable.

---

## Director locks (do not reopen casually)

| Lock | Value |
|------|--------|
| Idle | **N-day silence** via one named constant (today **48h**); reset on room-slice **WRITE** (all five) **or** station docked; presence alone does **not** |
| Presence / listeners | Roster UX only for idle; **listeners follow active users** — unsubscribe when leaving a project; warm-but-empty rooms may have zero listeners |
| Explicit End | Keep End / Publish now |
| Checkpoint | Fixed **~30m**; always **meta → PA → timeline → ledger → ops**; room **stays live** (no routine freeze) |
| Registry | One `campaignRoomUid` for all **five** slices |
| Warm read | Tracker/Conflicts: Sheets publish default + optional Live preview (ledger **and** timeline) |
| Offer pull | One-shot from live Firebase, then freeze in the offer |
| Ops ledger | **`warm_fifth_slice`** (reopened 2026-07-31) — Firebase live while warm; same checkpoint/End; fail-safe ≥ PA B/C; no silent scan loss |
| Short idle / last-leave | **Do not** keep 45m/75m / last-leave as primary commit once Room ships |

**Idle model:** not a hard lease. Room stays open while activity continues; closes after N continuous hours with no qualifying activity. Changing 48h → 168h / 240h is a **config-line** change, not a rearchitecture — watch listener cost (§ listeners) and checkpoint-fail escalation.

---

## Five slices (+ Hub surface)

| Slice | Firebase path | Sheets |
|-------|---------------|--------|
| **meta** | `projects/{id}/meta/` | Projects_Index (+ sub-events on `Project_Timelines`) |
| **PA** | `projects/{id}/assets/` | `Project_Assets` (no truck cols) |
| **timeline** | `projects/{id}/timeline/` | shifts / `Phase_Blocks` |
| **ledger** | `projects/{id}/logistics/` | `Logistics_Ledger` |
| **ops** | `projects/{id}/ops/` *(propose — R3d)* | `Operations_Ledger` |

**Meta scope (director 2026-07-31):** project identity + shape, not only room stamps:

- Name, client, location, inside/outside  
- Sub-events (calendar blocks on `Project_Timelines` — not the shift timeline itself)  
- Room registry: `campaignRoomUid`, status, openedAt, openedBy, lastActivityAt, lastPublishedAt  

**Gap today (R1):** only lifecycle stamps are elevated to Firebase meta. Identity fields still Sheets-only → **R3c**.

**Logistics Hub** is **not** a sixth collection — manager pack/fuse/arrange surface over warm PA + ledger (+ timeline AUTO). **R3b shipped @ GAS v745** via `dalEnsureWarmHubWorkspace_` / `generateLogisticsPayloadFirestore_`. Proof-of-pattern for ops.

**Size caps (per state doc):** WARN 512 KiB / 1500; MAX 900 KiB / 4000. Ops bar is **stricter** (no silent scan loss).

**Room open (R1 shipped; universal entry still open):** Desktop editor `startPresencePing` → `openOrJoinDalCampaignRoom`. **Queued:** mobile project open + station project select must call the same open/join (see R1.5 / R5-prep). PA/timeline/ops forks still start when those modules need them (Hub seeds prep under room).

---

## Lifecycle: keep vs replace

**KEEP:** `Dal_Router` / repos / adapters; reconcile; fail-safe backup/retry (`dal_commit_backups` / `dal_commit_retry`); host Auth; calendar chrome reading room flags.

**REPLACE / retarget:** dual-domain close triggers; last-leave / short idle as commit; orphan/refresh toward room; committing freeze for **End / idle-close only** — **not** routine 30m checkpoint; Hub cold grind → warm (**done R3b**); ops cold Sheets grind → warm fifth slice (**R3d**); meta lifecycle-only → full identity (**R3c**).

**Do not scrap the fork** — extend it into one warm room.

---

## Doctrine revisions

Canonical text: [../archive/dal-firebase-design-lock-2026-07-13.md](../archive/dal-firebase-design-lock-2026-07-13.md) § Campaign Room revision (updated 2026-07-31).

| Design lock | Room meaning |
|-------------|--------------|
| Rule 1 — Sheets between sessions | While warm: Firebase = active workspace; Sheets = latest **published** durable record (may lag ≤ checkpoint). After End / idle / between rooms: Sheets restore point. |
| Rule 2 — no periodic sync | Periodic **publish checkpoints** allowed while room warm. Final publish on End / idle close. |
| Hub “forever Sheets atomic” | **Superseded 2026-07-25** — warm Hub (R3b). |
| Ops “forever outside” | **Superseded 2026-07-31** — ops is fifth warm slice; journal remains separate from logistics movement; fail-safe ≥ B/C. |

**Still out of room:** vault, tracker conflicts, crew roster, financials, offers.

Pointers: [../topics/session-fork-platform.md](../topics/session-fork-platform.md) · [../FRAGILE_ZONES.md](../FRAGILE_ZONES.md) · [../topics/warehouse-prep-session.md](../topics/warehouse-prep-session.md) Phase D.

**Production today:** R1–R3b live; ops still cold Sheets until R3d; meta identity still Sheets-only until R3c; checkpoint / 48h idle not live (R4 / R5).

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
| Campaign Room (R5) | **propose** `DAL_CAMPAIGN_IDLE_MS_` | **48h** (single knob → 168h / 240h later) | TBD |

Touch / arm / keep-open: `dalTouchRoomIdle_` / `dalArmRoomIdle_` / `dalKeepOpenRoomIdle_` / `dalClearRoomIdle_`.  
T−5 SYNC: “Session closing — tap to keep open”.  
Idle eject → same commit path as End (`closeDalSession`).

**Station today (prep only):** `dalPrepIdleBlockedByStation_` **blocks** idle eject when:

- local `IS_STATION_DEVICE` and (`stationHostActive_()` or `dalPrepUiOpen`), **or**
- any prep occupant `mode` matches `/station/i`

It does **not** yet reset a shared room timer (R5). Presence ping alone does not count as write activity.

### Close / commit triggers (call sites)

All roads → `closeDalSession(projectId, actor, sessionType)` in `Dal_Sessions.js` (and Firebase commit path in `Dal_Firebase.js`). Room End → `closeDalCampaignRoom`.

| Trigger | Entry points |
|---------|----------------|
| Explicit End | `closeDalPrepSession` / END PREP; END COLLAB; **END ROOM** (`closeDalCampaignRoom`) |
| Last-leave prep | `dalMaybeLastLeaveClosePrep_` — soft while room warm (R2) |
| Last-leave timeline | `dalMaybeLastLeaveCloseTimeline_` — soft while room warm (R2) |
| Browser unload | `dalOnBrowserLeaveLiveRooms_` |
| Idle auto-close | short timers today; **48h room idle = R5** |
| Orphan enter-gate | `dalGatePrepEnterForOrphan_` |
| Empty-room reclaim | `dalMaybeReclaimEmptyLiveForks_` |

**Room retarget (R2+):** one End / N-day idle / orphan-on-room — **not** dual last-leave + 45m/75m as primary.

---

## R0 proposals — director confirm before Engine write (R1)

### A. Projects_Index campaign columns

| Column | Role |
|--------|------|
| `Dal_Campaign_Room_UID` | One warm-room id (`campaignRoomUid`) |
| `Dal_Campaign_Room_Status` | `opening` \| `open` \| `committing` (empty = closed) |
| `Dal_Campaign_Opened_At` | Room open stamp |
| `Dal_Campaign_Opened_By` | Actor who opened |
| `Dal_Campaign_Last_Activity_At` | Idle clock — bumped on qualifying write **or** station dock |
| `Dal_Campaign_Last_Published_At` | Last successful ordered publish |

**Confirmed with R1 go.** Shipped.

### B. Station-docked idle-reset (server-visible)

Lock `idle_touch` = `write_or_station`. Code in **R5**.

---

## Still open (not R0 blockers)

- Checkpoint-fail escalation (lag > N hours) — R4 (must scale with longer idle windows)  
- Soft free-at later retarget to `Phase_Blocks` — out of scope unless director asks  
- Exact Firebase ops collection shape — propose in R3d  

---

## Checklist

### Gates

- [x] Logistics Ledger M0–M5 + Exit complete (forks live)
- [x] Architecture pack + director locks filed
- [x] Active brief created (this file)
- [x] Director **OK go** to open this campaign (2026-07-24)
- [x] Director **OK go** for **R0** (doctrine revision + inventory — docs only)
- [x] Director **OK go** for **R1** code (room registry + meta lifecycle) — 2026-07-24
- [x] Director **OK go** for **R2** (unify PA + timeline under room uid) — 2026-07-24
- [x] Director **OK go** for **R3** (ledger slice in room) — 2026-07-24
- [x] Director **OK go** for **R3b** (warm Logistics Hub) — 2026-07-25
- [x] Director **OK go** for **five-slice doctrine reframe** (docs) — 2026-07-31
- [ ] Director **OK go** for **R3c** (expand meta identity)
- [ ] Director **OK go** for **R3d** (ops fifth slice)
- [ ] Director **OK go** for **R4** (30m publish checkpoint, five-slice order)
- [ ] Director **OK go** for **R4b** (listener-follows-user) — may ship with R5
- [ ] Director **OK go** for **R5** (idle close + Exit polish)

### R0 — Doctrine + inventory (no lifecycle code)

- [x] File explicit design-lock rule 1–2 revision text
- [x] Inventory dual-domain session columns + close triggers + idle / last-leave call sites
- [x] Propose Projects_Index campaign columns — **confirmed with R1 go**
- [x] Propose station-docked idle-reset rule — **confirmed with R1 go** (code in R5)
- [x] Docs-only session — **no** `node milestone.js`

### R1 — Room registry + meta slice (lifecycle)

- [x] One `campaignRoomUid` on Index; open/join room from project editor entry
- [x] `projects/{id}/meta/` warm doc (lifecycle stamps)
- [x] Calendar / editor chrome can read “room warm”
- [x] Ship + smoke — **shipped GAS v741**

### R1.5 — Universal warm-on-entry (queued)

- [ ] Desktop editor open/join — **done R1**
- [ ] Mobile project open → `openOrJoinDalCampaignRoom` (same room uid)
- [ ] Station project select → PA → same open/join
- [ ] Smoke: cold project → open from each surface → warm once; later activity no re-warm cost

### R2 — Unify PA + timeline under room uid

- [x] Prep + timeline share `campaignRoomUid` (`_meta.roomUid`)
- [x] Soft leave / idle / orphan while warm
- [x] Explicit End final-publishes + closes room
- [x] Ship — **GAS v742** (+ END ROOM on editor @ v743)

### R3 — Ledger slice in room

- [x] `projects/{id}/logistics/` live path + snapshot/write/commit
- [x] Arrange writers honor warm room
- [x] Size WARN/MAX for logistics state
- [x] Ship — **GAS v744**

### R3b — Warm Logistics Hub (pack / fuse trucks)

- [x] Director **OK go** — 2026-07-25
- [x] Hub pack / fuse / generate → warm PA + `logistics/state` (+ timeline AUTO)
- [x] No cold Sheets grind while room warm; durable via END ROOM / later checkpoint
- [x] Button-press semantics; `dalEnsureWarmHubWorkspace_`
- [x] Ship — **GAS v745**; director smoke still welcome

### R3c — Expand meta (project identity)

**Why here:** Timeline/sub-events and peers need live identity without Sheets round-trip; checkpoint should publish a complete meta slice.

- [ ] Director **OK go** for **R3c**
- [ ] Elevate name, client, location, inside/outside into Firebase `meta` on warm
- [ ] Elevate sub-events (`Project_Timelines` calendar blocks) into meta (or agreed meta sub-doc) while warm
- [ ] Writers: project editor Save & Sync / identity edits → warm meta when room open
- [ ] Readers: warm peers / timeline context read Firebase meta, not Sheets lag
- [ ] END ROOM / checkpoint publish identity back to Index + `Project_Timelines` as needed
- [ ] Ship + smoke: edit name/client/sub-event mid-warm → peer sees live; Sheets lag until publish

### R3d — Ops fifth slice (RFID Operations_Ledger)

**Why here:** Avoid two-database sync while PA/ledger warm; snappy per-op Firebase docs; same checkpoint family; fail-safe ≥ B/C.

- [ ] Director **OK go** for **R3d**
- [ ] File Firebase shape: per-op keyed docs under `projects/{id}/ops/` (+ `_meta` / session as needed)
- [ ] Warm path: checkout / check-in / scan batch write Firebase ops (not full Sheets rewrite)
- [ ] Snapshot ops from Sheets on room/prep seed when needed; overlay reads while warm
- [ ] Checkpoint + END ROOM / idle close commit ops → Sheets `Operations_Ledger`
- [ ] Fail-safe: `dal_commit_backups` + `dal_commit_retry` + ROOT alert; **no fake success** if scans only in dying room
- [ ] Cold / no-room fallback: existing Sheets atomic path until warm seed succeeds
- [ ] Ship + smoke: warm room → scan wave live for peers → Sheets lag until checkpoint/End; kill network mid-commit → retry cue, no silent loss

### R4 — 30m publish checkpoint

- [ ] Dirty-since-last-publish gate
- [ ] Ordered publish **meta → PA → timeline → ledger → ops**; room stays live
- [ ] `lastPublishedAt` + per-slice content signatures
- [ ] Fail → room stays live; manager retry (B/C patterns); escalation if lag > N hours (scale with idle window)
- [ ] Subtle “Last published…” UI (alarm only on fail)
- [ ] Ship + smoke: edit → wait/force checkpoint → Sheets match; peers stay live

### R4b — Listener follows active user

- [ ] On enter project / warm join: subscribe to that room’s needed slices
- [ ] On leave project: unsubscribe (do not linger on warm-but-empty rooms)
- [ ] Room may stay warm with zero listeners
- [ ] Ship + smoke: switch projects → old listeners gone; Firebase read cost tracks presence, not idle length

### R5 — Idle close + Exit polish

- [ ] Single constant `DAL_CAMPAIGN_IDLE_MS_` (default 48h); document how to set 168h / 240h
- [ ] Idle timer: reset on any of five slice WRITEs or station dock; presence alone does not
- [ ] Auto-close: final publish (five slices) → close room → next entry from Sheets (rewarm cost OK)
- [ ] Universal warm-on-entry complete if not done in R1.5
- [ ] Warm-read hybrid badge for Tracker/Conflicts (optional Live preview)
- [ ] Offer one-shot pull from warm Firebase (if Offer surface touches room)
- [ ] Update session-fork-platform + FRAGILE “how it works now”
- [ ] Archive this campaign when director agrees Exit complete

---

## What NOT to do

- Do not build on PA truck columns (already stripped)  
- Do not **merge** logistics movement into RFID `Operations_Ledger` — they remain **separate slices** (ledger vs ops)  
- Do not scrap DAL router/repos — change lifecycle + slice coverage  
- Do not use presence / last-leave / short idle as Room commit primary  
- Do not freeze all users every 30m for a routine checkpoint  
- Do not invent packet-sync (Campaign 3) inside this build  
- Do not put vault / tracker / roster / financials / offers in the room  

---

## Session log

| Date | Note |
|------|------|
| 2026-07-24 | Active brief opened (director OK go). Next: OK go for **R0**. |
| 2026-07-24 | **R0 complete** (docs): design-lock § Campaign Room revision; dual-domain inventory; Index + station proposals. Next: **OK go for R1**. |
| 2026-07-24 | **R1 shipped @ GAS v741** — Index `Dal_Campaign_*`, `openOrJoinDalCampaignRoom`, Firebase `meta/state`, calendar green room dot + editor chrome. Firestore rules deployed. Next: director smoke → **OK go for R2**. |
| 2026-07-24 | **R2 shipped @ GAS v742** — `_meta.roomUid`, soft leave/idle/orphan when warm, `closeDalCampaignRoom` + END ROOM. Next: smoke → **OK go for R3**. |
| 2026-07-24 | END ROOM moved to project editor (@ v743). |
| 2026-07-24 | **R3 shipped @ GAS v744** — `logistics/state` warm arrange; END ROOM commits ledger; Bugbot Highs fixed. |
| 2026-07-25 | Director: Logistics Hub must be in warm room. Filed **R3b**. |
| 2026-07-25 | **R3b shipped @ GAS v745** — warm Hub; Bugbot Highs fixed. |
| 2026-07-31 | **Five-slice architecture** (director briefing): ops moves into room; meta expands to identity; listeners follow users; idle = single constant. Docs reframe — next **OK go for R3c**. |
| 2026-07-31 | Director: arrangement integrity **before** Hub checklist UX. Phase A: ledger `pa_uid` overlay key + warm empty Sheets fallback + truck open skip forceSync. |
| 2026-07-31 | **Arrangement integrity Phase A @ GAS v750** — multi-case truck overlay by PA row uid; warm empty no longer blanks Sheets trucks; truck modal skips forceSync when no PA deltas. Smoke → then Hub checklist or R3c. |
| 2026-07-31 | Smoke fail: save Arrange → reopen → all staging. Cause: live PA fixtures blanked trucks after warm save. Hotfix: stamp legs onto fixtures + local mirror + hydrate-on-open. |
