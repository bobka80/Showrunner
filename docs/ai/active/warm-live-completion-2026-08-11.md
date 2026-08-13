# Active — Warm Live Completion

**Entry:** [AI_DOCTRINE.md](../../../AI_DOCTRINE.md) · **Map:** [../README.md](../README.md)  
**Predecessor (COMPLETE):** [../archive/warm-readers-offer-tracker-2026-08-05.md](../archive/warm-readers-offer-tracker-2026-08-05.md) — Offer pulls + Tracker hybrid + W5 autosave; archived 2026-08-11.  
**Room core (archived):** [../archive/project-campaign-room-2026-07-24.md](../archive/project-campaign-room-2026-07-24.md)  
**Design companion:** [../topics/warm-live-firebase-completion-2026-08-11.md](../topics/warm-live-firebase-completion-2026-08-11.md)  
**Fragile:** [../FRAGILE_ZONES.md](../FRAGILE_ZONES.md) § Campaign Room · § DAL prep/timeline live sync · Triangle of Truth  
**Live forks pause:** [../topics/dal-live-forks-pause.md](../topics/dal-live-forks-pause.md) — check before L2/L3

**Opened:** 2026-08-11 · **Status:** **ACTIVE** — **L4** shipped @ **GAS v790**; awaiting smoke.  
**Production tip:** see RELEASES.md (**GAS v790**). Prep rollback pin still **v654**.

---

## One-line doctrine (director-approved 2026-08-11)

While the project room is **warm**, every normal edit inside that project is **browser ↔ Firebase** (immediate, automatic). **Sheets is publish-only** (checkpoint / End Room). People do **not** use Start Prep / Start Collab / Save as everyday workflow.

---

## Why this campaign exists

Warm-readers made Offer/Tracker honest and added identity autosave — but that autosave still goes **browser → Apps Script → Firebase**, so it feels slow and “Saved” can lie vs reopen. PA/Timeline are already true live **after** Start buttons. This campaign **finishes the migration**: warm = true live wire everywhere that matters, without inventing a third system.

**Industry fit:** Live DB for daily work + Sheets as publish/archive is normal. Half-migrated dual wires is the pain — finish migration, do not go back to Sheets-as-live.

---

## Sequencing (code-wise)

1. ~~Finish warm-readers W6~~ ✓ archived 2026-08-11.  
2. This campaign **L0 → L5** (one OK go per slice after L0).  
3. Director pulled **L0** forward with W6 close (“close warm readers and then continue with fixing”).

```text
warm-readers W6 Exit → archive  ✓
        ↓
L0 PA failed-commit fix  ✓ @ v785
        ↓
L1 design lock (this file + topic)  ✓ with W6
        ↓
L2 identity true live Firebase  ✓ @ v787
        ↓
L3 auto-attach PA + Timeline with room  ✓ @ v788 (+ collision @ v789)
        ↓
L4 Hub honesty  ✓ @ v790
        ↓
L5 exit + archive  ← next
```

---

## Director locks

| Lock | Value |
|------|--------|
| Truth while warm | Firebase |
| Truth when cold / after publish | Sheets |
| Wire while warm | Browser ↔ Firebase (not Apps Script per edit) |
| Ceremony | Open project warms room and attaches live PA + Timeline automatically; hide Start Prep / Start Collab from normal work; **End Room** stays explicit |
| Offer | Stays **frozen** Pull + Undo (from warm-readers) — not live multiplayer in this campaign |
| Hub GENERATE | **Accepted one-server-op** (L4) — warm path still `generateLogisticsPayloadAPI` → Firebase; fixtures flushed live first when prep open |
| Hub pack / arrange structural | Autos + truck placement still GAS→FS batch (live PA flush is fixtures-only); fixture-only Hub saves use live flush |
| Checkpoint / idle | Do **not** change `DAL_CAMPAIGN_CHECKPOINT_MS_` / 48h idle without separate OK |
| Tracker/Conflicts | Stay readers (warm-readers hybrid) — not live editors |

---

## Slices

### L0 — Fix PA failed commit

**Problem:** Toast that DAL failed to commit Project Assets (failed commit path).

**Root cause (2026-08-11):** False reconcile after successful Sheets write — `dalPaRowSignature_` under-normalized qty / blank `scan_status` vs commit default `Assigned` / blank location vs `General`. Sibling: `dalPaFormulaIsAuto_` missed `[SHORT] [AUTO]…` so shortage autos could be dropped.

- [x] Root-cause (reconcile signature + SHORT auto detect)  
- [x] Smallest safe ship (normalize commit + signature; strip `[SHORT] ` before auto check; reconcile alert once)  
- [x] Director continue → L2 (smoke folded forward 2026-08-12)  

**Done when:** commit no longer false-fails in director smoke.

### L1 — Design lock in place

- [x] Active campaign filed (this file) — 2026-08-11  
- [x] Topic companion filed  
- [x] Warm-readers **W6** complete + archived (predecessor closed) — 2026-08-11  
- [x] Project_TODO / active README point here as **ACTIVE** primary  

**Done when:** warm-readers archived and this file is the primary active campaign.

### L2 — Project editor identity = true live Firebase

- [x] Title, client, location, mini-cal/sub-events, readiness write Firebase meta from the browser  
- [x] No Apps Script round-trip for routine identity edits (GAS fallback if live wire fails)  
- [x] Reopen: calendar cache patch + warm meta overlay (getExistingProjects)  
- [x] Ship **GAS v787** + hosting (`host-boot.js?v=671`) + firestore rules  
- [x] Director smoke: edit → Cancel → reopen sticks; feels immediate (2026-08-12)  

**Done when:** identity no longer depends on GAS autosave for warm projects.

### L3 — Auto-attach PA + Timeline with room

- [x] Opening a warm project = live PA + live Timeline without Start buttons in normal work  
- [x] Soft leave safe; End Room remains rare explicit action  
- [x] Align with live-forks pause / FRAGILE session UI  
- [x] Ship **GAS v788**  
- [ ] Director smoke: gear + timeline edit with no prep/collab ceremony  

**Done when:** floor user does not think about Start Prep / Start Collab.

### L4 — Logistics Hub honesty

- [x] Hub open reuses warm live PA/TL memory (no forced GAS reload) when prep already live  
- [x] Fixture-only Hub saves / GENERATE prep flush → browser↔Firebase; structural pack/arrange stay GAS→FS  
- [x] GENERATE documented as accepted **one** server op (warm Firebase under the hood)  
- [x] Ship **GAS v790**  
- [ ] Director smoke: warm Hub opens snappy; GENERATE finishes; pack/arrange still work  

**Done when:** Hub is not a second slow product beside live PA/TL.

### L5 — Exit polish + archive

- [ ] FRAGILE / GLOSSARY / doctrine one-liners match this campaign  
- [ ] Archive this file; handoff next from Project_TODO  

---

## What NOT to do

- Do not go back to Sheets as the live workbench  
- Do not invent a third SoT  
- Do not make Offer live multiplayer in this campaign  
- Do not change checkpoint interval / 48h idle without director  
- Do not put Tracker/Conflicts inside the room as live editors  
- Do not start L2+ while L0 is still red if commit fail is blocking production  

---

## Session log

| Date | Note |
|------|------|
| 2026-08-11 | Director approved Warm Live Completion. Filed active + topic. Sequenced **after** warm-readers W6. Next: finish W6 → OK go **L0** (PA failed commit). |
| 2026-08-11 | Director: close warm-readers → continue fixing. W6 archived; this campaign **ACTIVE**; **L0** in flight. |
| 2026-08-11 | **L0 @ GAS v785** — PA commit reconcile: normalize qty/scan/location; `[SHORT] [AUTO]` treated as auto; single alert. Awaiting director smoke (End Prep / End Room without false DAL commit-fail toast). |
| 2026-08-12 | Director: continue → **L2**. Identity warm autosave → browser↔Firebase (`meta/state`); rules unlock update with locked room fields; host `META_IDENTITY_WRITE`. |
| 2026-08-12 | **L2 @ GAS v787** + hosting + firestore rules. Manager claim on token; seq+1 rule; collision no quiet overwrite. Smoke: hard-refresh web.app → warm edit → Saved feels fast → Cancel → reopen sticks. |
| 2026-08-12 | Director L2 smoke green → **L3**. |
| 2026-08-13 | Collision on sub-event edit: calendar Sheets stamp lagged Firebase meta. Fix: sync `identityUpdatedAt` on room join; one stamp-adopt retry on live/GAS collision. |
| 2026-08-13 | Director: end of L campaign = first warm feels fully live/snappy; do not reorder slices. |
| 2026-08-13 | **L4 @ GAS v790** — Hub open from live memory + background truck overlay; fixture flush live; GENERATE kept as one accepted warm server op (auto deltas only after flush). |
| 2026-08-13 | Hub open still ~10s: gate required prep live; cached-PA branch still waited on ensure+reload. Fix: open from any in-memory PA; ensure soft/background. |

---

## Handoff cheat sheet

| Slice | Done when |
|-------|-----------|
| L0 | PA commit toast fixed |
| L1 | Warm-readers archived; this campaign primary |
| L2 | Identity true live Firebase |
| L3 | Auto PA + Timeline with room |
| L4 | Hub warm honesty |
| L5 | Archived |
