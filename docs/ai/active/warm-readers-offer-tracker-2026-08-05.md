# Active — Warm readers + Offer pulls + Checkpoint smoke

**Entry:** [AI_DOCTRINE.md](../../../AI_DOCTRINE.md) · **Map:** [../README.md](../README.md)  
**Predecessor:** [../archive/project-campaign-room-2026-07-24.md](../archive/project-campaign-room-2026-07-24.md) (R0–R5 core @ **GAS v767** — room warm/cold + 30m checkpoint + 48h idle; **COMPLETE**)  
**Offer topic (existing locks):** [../topics/offer-invoice-crew-availability-2026-07-20.md](../topics/offer-invoice-crew-availability-2026-07-20.md)  
**Room decision / locks:** [../topics/project-campaign-firebase-hybrid-decision-2026-07-21.md](../topics/project-campaign-firebase-hybrid-decision-2026-07-21.md) · [../topics/architecture-campaign-director-locks-2026-07-21.md](../topics/architecture-campaign-director-locks-2026-07-21.md)  
**Fragile:** [../FRAGILE_ZONES.md](../FRAGILE_ZONES.md) § Campaign Room · Tracker/Conflicts · Offer surfaces

**Opened:** 2026-08-05 · **Status:** **ACTIVE** — **W1** checkpoint smoke (director).  
**Production tip:** see RELEASES.md. Campaign Room core live @ **GAS v767** (archived). Prep rollback pin still **v654**.

**Director briefing (2026-08-05):** Three workstreams after Campaign Room core:

1. **Offer** — manual one-shot pulls (not live link), with undo  
2. **Tracker / Conflicts** — warm → one-shot Firebase; cold → Sheets (no badge, no listeners)  
3. **30m checkpoint** — already shipped (R4 @ v764); this campaign **smokes + polishes** consumer awareness

---

## Fresh-agent start

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
- No long-lived Tracker listeners  
- Cap warm overlays per open  

**Truth reminder:** Warm Firebase = now. Cold Sheets = last published Firebase. Do not expect a kept Firebase archive after End/idle.

### C — 30m checkpoint smoke + polish

**Already shipped:** R4 @ GAS v764 — `runDalCampaignCheckpoint`, dirty gate, five-slice keep-live publish, editor cue `{time} publish` (one-click force @ v770).

**This campaign still does:**

- Director smoke: edit → wait/force checkpoint → Sheets match; peers stay live; cue updates  
- Fix any checkpoint bugs found in smoke  
- Light polish only if smoke shows cue/copy gaps  
- Document for Tracker/Offer authors: Sheets may lag ≤ checkpoint while warm  

**Do not:** change interval, freeze users on checkpoint, or dual-write Sheets on every edit.

---

## Build slices (propose)

### W0 — Docs + inventory (this file)

- [x] File campaign brief + locks  
- [x] Point Campaign Room leftovers here  
- [x] Update [Project_TODO.md](../Project_TODO.md)  
- [x] Director **OK go for W1** (2026-08-10)

### W1 — Checkpoint smoke (fast)

- [x] Smoke R4 on web.app (force dbl-click) — **fail found** (room wiped + collision)  
- [x] File/fix: Index row blank-fill wiped `Dal_Campaign_*`; refresh editor version after publish — **GAS v768**  
- [ ] Director re-smoke force checkpoint → room stays warm; Save & Sync OK  
- [ ] Tick W1 complete when re-smoke green

### W2 — Tracker / Conflicts hybrid

- [ ] Inventory current Tracker + Conflicts read entry points  
- [ ] Warm detect via Index / `getDalSessionInfo` campaign fields  
- [ ] One-shot Firebase overlay helpers (ledger / timeline / PA as needed)  
- [ ] Cap + fail-open to Sheets  
- [ ] Ship + smoke: warm project shows fresher than Sheets; cold unchanged

### W3 — Offer pull PA

- [ ] Button + one-shot pull from warm Firebase or Sheets  
- [ ] Pre-pull snapshot + Undo  
- [ ] Ship + smoke

### W4 — Offer pull Timeline + logistics

- [ ] Button + pull shifts + truck/logistics facts (km, idle/stay, courses…)  
- [ ] Pre-pull snapshot + Undo (same undo model as W3)  
- [ ] Ship + smoke

### W5 — Exit polish

- [ ] FRAGILE + offer topic notes for this campaign Exit  
- [ ] Archive this campaign when director agrees Exit complete  
- [x] Predecessor Campaign Room archived 2026-08-05

---

## What NOT to do

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

---

## Handoff cheat sheet

| Slice | Done when |
|-------|-----------|
| W1 | Checkpoint smoke green (or tiny polish shipped) |
| W2 | Tracker/Conflicts hybrid live |
| W3 | Offer PA pull + undo live |
| W4 | Offer timeline/logistics pull + undo live |
| W5 | Docs archived; predecessor Room archive asked |
