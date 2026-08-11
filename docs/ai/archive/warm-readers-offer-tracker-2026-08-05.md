# Archive — Warm readers + Offer pulls + Checkpoint smoke

**Entry:** [AI_DOCTRINE.md](../../../AI_DOCTRINE.md) · **Map:** [../README.md](../README.md)  
**Predecessor:** [project-campaign-room-2026-07-24.md](project-campaign-room-2026-07-24.md) (R0–R5 core @ **GAS v767** — room warm/cold + 30m checkpoint + 48h idle; **COMPLETE**)  
**Offer topic (existing locks):** [../topics/offer-invoice-crew-availability-2026-07-20.md](../topics/offer-invoice-crew-availability-2026-07-20.md)  
**Room decision / locks:** [../topics/project-campaign-firebase-hybrid-decision-2026-07-21.md](../topics/project-campaign-firebase-hybrid-decision-2026-07-21.md) · [../topics/architecture-campaign-director-locks-2026-07-21.md](../topics/architecture-campaign-director-locks-2026-07-21.md)  
**Fragile:** [../FRAGILE_ZONES.md](../FRAGILE_ZONES.md) § Campaign Room · Tracker/Conflicts · Offer surfaces

**Opened:** 2026-08-05 · **Archived:** 2026-08-11 · **Status:** **COMPLETE** — W1–W5 shipped (tip **GAS v784**); **W6 Exit** closed.  
**Production tip at archive:** see RELEASES.md (**GAS v784**). Campaign Room core live @ **GAS v767**. Prep rollback pin still **v654**.  
**Successor (ACTIVE):** [../active/warm-live-completion-2026-08-11.md](../active/warm-live-completion-2026-08-11.md) — true live Firebase wire; first code slice **L0** PA failed-commit.

**Director briefing (2026-08-05):** Three workstreams after Campaign Room core:

1. **Offer** — manual one-shot pulls (not live link), with undo  
2. **Tracker / Conflicts** — warm → one-shot Firebase; cold → Sheets (no badge, no listeners)  
3. **30m checkpoint** — already shipped (R4 @ v764); this campaign **smoked + polished** consumer awareness

---

## Fresh-agent start (historical)

1. Read [AI_DOCTRINE.md](../../../AI_DOCTRINE.md) → **this file** → predecessor Campaign Room brief § five slices + checkpoint + idle.  
2. Do **not** reopen Campaign Room lifecycle locks (`idle_touch`, `checkpoint_interval`, `room_registry`) without director.  
3. Tracker/Conflicts stay **outside** the room as readers — never become live editors of the warm fork.  
4. Offer stays **outside** the room as a snapshot document — pulls are explicit buttons.  
5. After any implementation: `node milestone.js "…"`; tick this checklist same session.

---

## Goal (plain language)

Make **downstream readers** honest about warm vs published truth, and give **Offer** safe manual refresh from the project without silent drift.

**One-line doctrine:** Warm Firebase = current workspace; Sheets = last publish; Offer = frozen doc until the manager presses Pull (and can Undo).

---

## Director locks (this campaign)

| Lock | Value |
|------|--------|
| Tracker read | **Automatic hybrid:** warm room → **one-shot** Firebase; cold → Sheets; fail open to Sheets. **No** Published/Live badge. **No** Tracker `onSnapshot` listeners |
| Tracker refresh | Re-run the same hybrid on open / explicit Refresh |
| Warm overlay cap | Cap concurrent warm Firebase overlays per Tracker open (propose **25**, same family as meta overlay) |
| Offer sync | **Not** live. Manual pull buttons only |
| Offer pulls | **(A)** Pull Project Assets · **(B)** Pull Timeline + truck logistics (shifts; km / idle·stay / courses from distance when out of Sofia; related logistics facts) |
| Offer undo | After a pull, **one-step Undo** restores the previous offer snapshot for that pull (at least) |
| Checkpoint | Interval stays **~30m** (`DAL_CAMPAIGN_CHECKPOINT_MS_`). This campaign does not change the interval — smoke + cue polish only |
| Truth chain | Room-slice Sheets writes on normal path come **from** Firebase publish (checkpoint / End / idle). Cold Firebase forks are cleared — Sheets **is** the last publish |

---

## Three workstreams

### A — Offer manual pulls (+ undo)

**Problem:** Offer must represent a chosen moment, but managers need to refresh kit or timeline/logistics without re-typing — and recover from an accidental pull.

**Shape:**

- Offer remains a **snapshot** (no continuous Firebase listen)  
- Button **Pull Project Assets** → copy current PA into the offer (warm Firebase if room warm, else Sheets)  
- Button **Pull Timeline + logistics** → copy shifts + truck/logistics facts (km, idle/stay, out-of-Sofia distance courses, etc.)  
- Each successful pull stores a **pre-pull snapshot** so **Undo** can revert that pull  
- Aligns with existing offer topic §1.1 (convenience pull, not live sync) — expands to two pull surfaces + undo

**Out of scope here unless director expands:** invoice conversion, company block settings, full financials redesign.

### B — Tracker / Conflicts hybrid read

**Problem:** Sheets can lag ≤ ~30m while a room is warm; Tracker/Conflicts that only read Sheets can miss current trucks / PA / timeline. Continuous Live listeners are too expensive and fight listeners-follow-user.

**Shape (simplest code):**

- On Tracker / Conflicts load (or Refresh), per project:  
  - if Campaign Room **warm** → one-shot read needed slices from Firebase  
  - if **cold** → existing Sheets path  
  - if live read fails → Sheets  
- No badge UI  
- Cap concurrent warm overlays (~25)

### C — Checkpoint smoke / polish

R4 checkpoint already ships. This campaign smokes force publish + cue polish only — does not change interval.

---

## Slices (all closed)

### W1 — Checkpoint smoke + cue polish

- [x] Force checkpoint smoke + Index identity preserve @ **v768**+  
- [x] Cue chrome polish (`{time} publish`)  
- [x] Closed for sequencing 2026-08-10

### W2 — Tracker / Conflicts warm hybrid

- [x] `dalWarmReaderOneShotOverlay_` (cap 25, fail-open)  
- [x] Ship **GAS v772** + director smoke green 2026-08-11

### W3 — Offer pull Project Assets

- [x] Button + Pull PA + Undo  
- [x] Ship **GAS v775** — director smoke green 2026-08-11

### W4 — Offer pull Timeline + logistics

- [x] Button + pull shifts + truck/logistics facts  
- [x] Pre-pull snapshot + Undo  
- [x] Ship **GAS v776** — director: working fine 2026-08-11; Undo **stays**

### W5 — Warm project editor autosave (filed 2026-08-10)

**Shape:** NEW project → one explicit Save & Sync (create). After save → debounced auto-save of identity + mini-cal + readiness/Offer (warm → Firebase meta via GAS; cold → Sheets). Cue Saving…/Saved. Do not autosave mid mini-cal drag.

**Director lock (2026-08-11):** Offer Undo stays. Offer persistence in this slice.

**Follow-on:** true browser↔Firebase identity wire = successor **Warm Live Completion L2**.

- [x] Debounced auto-save on identity + mini-cal + Offer/readiness  
- [x] Save & Sync only for NEW; cue restored @ v783; reopen cache patch @ v784  
- [x] Collision / Cancel / nested-view quiet flush fixes v780–v782  
- [x] Remaining feel-issues fold into successor L2 (director closed W6 2026-08-11)

### W6 — Exit polish

- [x] FRAGILE + offer topic notes for this campaign Exit  
- [x] Archive this campaign (director: close warm readers → continue fixing) — 2026-08-11  
- [x] Predecessor Campaign Room archived 2026-08-05  
- [x] Successor ACTIVE: [../active/warm-live-completion-2026-08-11.md](../active/warm-live-completion-2026-08-11.md)

**After W6 archive:** primary active = Warm Live Completion; first code slice **L0** = PA failed-commit toast.

---

## What NOT to do (still true)

- Do not put Tracker/Conflicts/Offer **inside** the Campaign Room as live slices  
- Do not add Tracker `onSnapshot` / permanent multi-room listeners  
- Do not make Offer auto-update when the room changes  
- Do not change `DAL_CAMPAIGN_CHECKPOINT_MS_` without director  
- Do not freeze all users on routine checkpoint  
- Do not invent a third SoT beyond Firebase (warm) / Sheets (published)

---

## Session log

| Date | Note |
|------|------|
| 2026-08-05 | Campaign opened (director): Offer dual pulls + undo; Tracker warm one-shot / cold Sheets; checkpoint smoke. Predecessor Campaign Room archived. Next: **OK go for W1**. |
| 2026-08-05 | Hygiene sweep applied: Room archived; locks oneshot_hybrid / manual_dual_undo; pause banners + index gaps fixed. |
| 2026-08-10 | Director **OK go for W1**. Code review: R4 path + cue look sound @ v767. Awaiting director smoke (force dbl-click). |
| 2026-08-10 | **W1 smoke fail:** force checkpoint wiped Index `Dal_Campaign_*` via `saveProjectDataSheets_` blank row → room looked ended + Save & Sync collision. Fix shipping. |
| 2026-08-10 | **Fix @ GAS v768** — preserve existing Index row on identity save; checkpoint returns `indexLastUpdated` + refreshes `#edit-proj-version`. Re-smoke force publish. |
| 2026-08-10 | Cue chrome: larger outlined rectangle button for Last published / Not published (dbl-click unchanged). |
| 2026-08-10 | Cue: one-click; label `{time} publish` (drop “Last published”). @ GAS v770. |
| 2026-08-10 | Cue feedback: `publishing…` while busy; Index refresh must not clobber newer stamp. |
| 2026-08-10 | Filed **W5** warm editor autosave. W1 closed for sequencing. Next build: **W2** Tracker hybrid. |
| 2026-08-10 | **W2** implemented: `dalWarmReaderOneShotOverlay_` in Tracker + Conflicts (cap 25, fail-open). |
| 2026-08-10 | Shipped **GAS v772** — W2 Tracker/Conflicts warm hybrid. Next: director smoke, then **W3** Offer PA pull. |
| 2026-08-11 | Smoke miss: Tracker lagged warm PA. Fix: prefer `assets/state` + paginate collection list. |
| 2026-08-11 | Root cause: PA edits lost on refresh (pending flush died). Urgent unload PA_PATCH + state hydrate. |
| 2026-08-11 | Director smoke green: PA→Tracker + refresh durability. Next: **W3** Offer PA pull. |
| 2026-08-11 | **W3 @ GAS v775** — Offer Pull Project Assets + Undo (snapshot in readiness financials). |
| 2026-08-11 | Director W3 smoke green → **W4**. |
| 2026-08-11 | **W4 @ GAS v776** — Offer Pull Timeline + logistics + Undo (`getOfferTlPullSnapshot`; labor + transport snapshot; Print Studio lines). Awaiting director smoke → **W5**. |
| 2026-08-11 | Currency display: all remaining `$` price prefixes → `€` (Offer UI + asset/tracker/audit columns). Print/Financials Hub were already €. |
| 2026-08-11 | Director: W4 fine; **Undo stays**; Offer autosave belongs in **W5** (not a side fix). Continue → W5. |
| 2026-08-11 | **W5 @ GAS v778** — warm debounced autosave (identity + mini-cal + readiness/Offer); Save & Sync only NEW/cold; `updateProjectReadiness` warm → Firebase meta. |
| 2026-08-11 | Save chrome: button + autosave cue hidden except **NEW** (empty calendar create); deeper entry gated until first Save. |
| 2026-08-11 | Fix: Cancel on saved project no longer false-warns after mini-cal edit — flush autosave quietly; identity autosave for all non-NEW. |
| 2026-08-11 | Fix: Cancel after edit no longer shows COLLISION refresh alert — gather-before-clear, queue behind in-flight, quiet handlers + stamp handoff. **@ GAS v781**. |
| 2026-08-11 | Fix: nested editor views (Offer/PA/Timeline/Logistics) — readiness no longer poisons identity stamp; quiet nav flush on open/Cancel/GENERATE. **@ GAS v782**. |
| 2026-08-11 | Fix: identity autosave looked dead — restore Saving/Saved cue; unstick mini-cal drag flag; gather fallback from raw fragments; quiet-nav flag hygiene. **@ GAS v783**. |
| 2026-08-11 | Fix: Saved cue but reopen showed old values — patch FullCalendar rawDbData after identity autosave (reopen was reading stale cache). **@ GAS v784**. |
| 2026-08-11 | Director approved successor **Warm Live Completion** (true live Firebase wire). Finish **W6** → archive → L0 PA failed-commit. |
| 2026-08-11 | **W6 Exit COMPLETE** — archived; primary build = Warm Live Completion. |

---

## Handoff cheat sheet

| Slice | Done when |
|-------|-----------|
| W1 | Checkpoint smoke green (or tiny polish shipped) |
| W2 | Tracker/Conflicts hybrid live |
| W3 | Offer PA pull + undo live |
| W4 | Offer timeline/logistics pull + undo live |
| W5 | Warm editor autosave live (GAS path; true client wire → successor L2) |
| W6 | Docs archived → hand off Warm Live Completion |
