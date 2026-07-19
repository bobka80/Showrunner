# Active — Multi-user fork: industrial harden → auto fork (timeline + PA)

**Entry:** [AI_DOCTRINE.md](../../../AI_DOCTRINE.md) · **Map:** [../README.md](../README.md)  
**Predecessor:** [data-access-layer.md](data-access-layer.md) — prep/timeline forks **stable** at GAS **v645** (docs **v646**). Rollback DAL era: **v576**.  
**Fragile:** [../FRAGILE_ZONES.md](../FRAGILE_ZONES.md) §§ DAL prep / timeline session UI · prep PA fork live sync · timeline fork live sync  
**How live works today:** [dal-prep-live-sync-standards.md](dal-prep-live-sync-standards.md) · FRAGILE “How prep session UI works now”  
**Process + harden depth:** [bulletproof-multiuser-live-editors-2026-07-18.md](bulletproof-multiuser-live-editors-2026-07-18.md)  
**Auto-fork product spec (canonical UX):** [../topics/timeline-collab-session.md § Optional update](../topics/timeline-collab-session.md#optional-update--auto-fork-live-pull-in--idle-eject) (applies to **timeline and PA**)

**Opened:** 2026-07-18 · **Status:** **A0 testing pipeline shipped** — next: Part A product H-items (recommend **H1** then **H5**). Fresh agents: read this file first for multi-user fork work.  
**Production at open:** GAS **v646** · hosting `host-boot.js?v=635` · Prep banner must say **`live sync (patch)`** · H0 harness: Cases A–J + `dal-mutation-inventory-check.js`

---

## Fresh-agent start (other computer)

1. Read [AI_DOCTRINE.md](../../../AI_DOCTRINE.md) → **this file** → [bulletproof](bulletproof-multiuser-live-editors-2026-07-18.md) → FRAGILE §§ above.  
2. **Build order (locked 2026-07-19):** **(1) testing pipeline H0** → **(2) bulletproof multi-user H1–H5 + Gap 1** → **(3) Part B auto fork**.  
3. **Do not** start Part B until Part A exit is director-confirmed.  
4. **No code** until director says **OK go** (or names a Part A slice).  
5. After any implementation: `node milestone.js "…"`; hosting only if `host-boot.js` changes.

**Point the new agent here:**  
`docs/ai/active/multi-user-fork-industrial-and-auto.md`

---

## Goal (one campaign, three stages — order locked)

| Stage | Name | Outcome | Detail |
|-------|------|---------|--------|
| **A0** | **Testing pipeline** | Sims state scope; mutation gate; mode-seam cases; incident “attempts” field | [bulletproof](bulletproof-multiuser-live-editors-2026-07-18.md) Phase H0 |
| **A1** | **Bulletproof multi-user** | Fail closed, mutation discipline, Gap 1 lint, mirror/conflict/redraw harden | H1→H5 + Gap 1 below |
| **B** | **Auto fork + live pull-in + idle eject** | Surfaces open/join/pull-in per locked UX; freelancers excluded; idle eject commits | Part B + timeline § Optional |

**Why this order:** Auto-start / pull-in / idle eject **amplifies** any remaining live-sync fragility. Trust the harness first; harden the patch+session model; then automate lifecycle.

**Not in this campaign:** Station UI rework, phone-app backlog, vault/crew repo migration, CRDT rewrite, Logistics Hub atomic path changes, [pre-ship expansion to other domains](pre-ship-pipeline-expansion-2026-07-18.md) (parallel board).

---

## Baseline (do not regress)

Director-confirmed **manual** multi-user prep (and timeline twin):

- Live list = `projects/{id}/assets/state` (or `timeline/state`) + transactional touch/delete patch  
- Banner **`live sync (patch)`** while open; banner off = live sync off  
- END: `_meta` + Sheets agree (or meta-end timeout); after END block **same `sessionUid`** reopen  
- Deletes note `dalPaNoteDelete_`; seed-from-local only before remote `writeSeq`  
- Sim: `node scripts/dal-pa-live-sync-test.js` (Cases A–J) must stay green for PA work  
- Gate: `node scripts/dal-mutation-inventory-check.js` (wired in `pre-ship/dal.js`)  

Rollback if Part A/B wrecks floor: tell AI **"Rollback production to v645"** (last known good behavior) or the **Part B try-baseline** milestone named when Part B starts.

---

## Part A — Testing pipeline → industrial harden (first)

**H definitions:** [dal-prep-live-sync-standards.md](dal-prep-live-sync-standards.md) §2.  
**Process depth:** [bulletproof](bulletproof-multiuser-live-editors-2026-07-18.md).  
**This section = only checkbox list + locked order.** Do not invent a rival order in other files.

### A0 — Testing pipeline (H0) — **first** ✅ harness done 2026-07-19

- [x] Re-read FRAGILE session UI + prep PA + timeline live sections  
- [ ] Confirm production banner **`live sync (patch)`** on web.app (two browsers) — **director smoke**  
- [ ] Note GAS + hosting versions after next product ship (still v646 / host-boot?v=635 at A0)  
- [x] Scope/non-coverage comments on every sim Case (A–J)  
- [x] `scripts/dal-mutation-inventory-check.js` + wired into `pre-ship/dal.js` (PA; timeline twin = hub A2)  
- [x] Mode-switch-seam sim cases (Case H — stale GAS while Firestore mode → reject)  
- [x] Incident template: “How many prior attempts before this held?” (`ATTEMPTS BEFORE THIS HELD` in FRAGILE)  
- [x] Former **H6** stronger sims absorbed: Case I (3-client delete), Case J (sticky ended sessionUid)  
- [ ] Summarize → wait for **OK go** on first product H-item (recommend **H1** then **H5**)

### A1 — H1 Fail closed on weak sync

- [ ] If Auth/listen fails → do **not** silently multi-edit on GAS `live sync (server)` poll  
- [ ] Hard banner warning and/or block fixture/timeline edits until `patch` restored  
- [ ] Adversarial sim: Auth fails *mid-edit*, not only at start  
- [ ] Smoke: force server mode → user cannot thrash peer without knowing  

### A2 — H5 Mutation-path inventory gate

- [ ] Every prep mutator of `currentProjectAssets` notes touch/delete (and timeline twin)  
- [ ] Gate script from A0 enforced in [dal-pre-ship-gates.md](dal-pre-ship-gates.md)  
- [ ] Prefer ship **paired with H1** (one theme: don’t silently corrupt on hot path)  

### A3 — Gap 1 Firestore / GAS mode structural lint

**New (was only in a draft gap brief — folded here; no parallel gap-closure file).**

- [ ] After A0 mode-seam sims exist: add `pre-ship/dal-sync-mode-lint.js` (or extend `pre-ship/dal.js`)  
- [ ] Fail diffs that call `saveProjectAssets` / `saveTimelineData` from Firestore-mode paths without allowlist  
- [ ] Fail applying GAS responses into live apply without `writeSeq` presence check  
- [ ] Document in [dal-pre-ship-gates.md](dal-pre-ship-gates.md)  
- [ ] Detection only — no runtime behavior change required for the gate itself  

Forbidden patterns #10/#11: [dal-prep-live-sync-standards.md](dal-prep-live-sync-standards.md) / FRAGILE — mechanical guard replaces “don’t” alone.

### A4 — H4 State size + END mirror check

- [ ] Warn/cap huge `fixturesJson` / timeline state — **concrete threshold** before claim done  
- [ ] END PREP / END COLLAB: verify collection (or commit payload) mirrors state before Sheets write; alert on mismatch  

### A5 — H3 Same-row conflict visibility

- [ ] Toast or clear cue when same UID loses to peer LWW  
- [ ] **Both** prep fixtures **and** timeline entities in the **same** milestone — no “as practical” hedge; if timeline slips, open an explicit follow-up checkbox here  

### A6 — H2 Cheaper remote apply

- [ ] Reduce full PA / timeline redraw storms on remote snap (targeted merge → redraw)  
- [ ] Define measurable pass condition before coding (e.g. no full DOM re-render for diffs touching <5% of rows, or a frame-time budget)  
- [ ] Smoke: remote qty/delete without browser stutter  

### A7 — Part A exit

- [ ] Director smoke (two browsers, prep **and** timeline) + ≥1 adversarial step  
- [ ] Mutation-inventory gate green; sim cases all have scope comments  
- [ ] Update FRAGILE + this file status: **Part A complete — OK for Part B**  
- [ ] Milestone note names which **rules** closed: `Part A industrial harden complete — try baseline for auto fork`

**Part A ship rule:** Prefer **one H-item per milestone** (or tightly paired H1+H5). Gap 1 is a **lint** and may ship in its own milestone after A0. No “misc live sync guards” ships.

---

## Part B — Auto fork, live pull-in & idle eject (third)

**Do not start until Part A exit is checked and director says OK go for Part B.**

**Canonical UX (do not reinvent):** [timeline-collab-session.md § Optional update](../topics/timeline-collab-session.md#optional-update--auto-fork-live-pull-in--idle-eject)  
Prep cross-link: [warehouse-prep-session.md](../topics/warehouse-prep-session.md)

### B0 — Try / revert baseline (mandatory)

- [ ] `node milestone.js "AUTO-FORK TRY BASELINE — revert here if floor dislikes"`  
- [ ] Record GAS version here: **v____** ← fill at B0  
- [ ] Implement behavior **and** redesigned visual cues in **same** later milestone(s)  
- [ ] Floor dislike → **"Rollback production to v____"** (B0 version)

### B1 — Who may start (surface × domain)

| Domain | Desktop | Phone / tablet | Station |
|--------|---------|----------------|---------|
| Timeline | Auto-start if **timeline edit** creds | Join only | Never starts timeline |
| PA / prep | Auto-start if **PA/prep** creds | **Button only** (never auto) | **Always** start or join |

- [ ] Freelancers: **never** start, join, pull-in, or see live fork UI  
- [ ] Join if already open = no second snapshot  

### B2 — Opening warm-up

- [ ] Starter-only edits; entry delta = starter’s pending local  
- [ ] Others: freeze + “Starting live session…”  
- [ ] Hang ~45–60s → Retry / Cancel; credentialed desktop may take over  

### B3 — Live pull-in

- [ ] Early watcher on **same** view soft-switches at Live (no yank from calendar)  
- [ ] Phone PA: no auto-start, **does** auto-join when others opened prep  

### B4 — Close / idle eject

- [ ] Close + **always commit**: End ∪ last leave ∪ idle  
- [ ] Idle: timeline **45m** / prep **75m**; T−5 keep-open; station heartbeat blocks prep idle close  
- [ ] Presence heartbeat ~30–60s  

### B5 — Cue redesign (same ship as behavior)

- [ ] Clear Normal / Opening / Live / Closing  
- [ ] Frozen vs editable; idle warning; “joining…” pull-in  

### B6 — Part B checklist (from topic — leave until built)

- [ ] Timeline: desktop+edit auto-start; others join-only; station never starts timeline  
- [ ] PA: desktop auto-start; phone button-only; station always start/join  
- [ ] Opening / pull-in / freelancer exclusion / idle / cues  
- [ ] Baseline → try → keep or rollback  

### B7 — Part B exit

- [ ] Director floor smoke both domains  
- [ ] Update topic checklists; FRAGILE if lifecycle rules changed  
- [ ] Campaign status → complete → archive when director agrees  

---

## Primary code touchpoints (expect)

| Area | Files |
|------|--------|
| Prep session UI | `02e6_Dal_Session.html`, `02e7_Dal_Firestore_Client.html` |
| Prep mutations | `02e2_Logic_CRUD.html`, render flush |
| Timeline live | `03a1_Timeline_Dal_Session.html`, `03a2_Timeline_Dal_Live.html` |
| Host bridge | `push-hosting/public/host-boot.js` (`SHOWRUNNER_DAL_FS_*`) |
| Sessions / commit | `Dal_Sessions.js`, `Dal_Firebase.js` |
| Sims / gates | `scripts/dal-pa-live-sync-*.js` (Cases A–J), `scripts/dal-mutation-inventory-check.js` (in `pre-ship/dal.js`), [dal-pre-ship-gates.md](dal-pre-ship-gates.md) |

---

## Relationship to other campaigns

| Campaign | Relationship |
|----------|----------------|
| [data-access-layer.md](data-access-layer.md) | Predecessor — near-complete; archive separately when director closes DAL paperwork |
| [bulletproof-multiuser-live-editors-2026-07-18.md](bulletproof-multiuser-live-editors-2026-07-18.md) | Process + Phase H0–H3 depth; hub owns checkboxes |
| [pre-ship-pipeline-expansion-2026-07-18.md](pre-ship-pipeline-expansion-2026-07-18.md) | Parallel board — RBAC/FCM/truck/fin gates; not Part A |
| Station UI / RFID | Parallel — do not mix into this campaign |
| Phone app | Parallel — Part B phone button for PA start may touch mobile; keep scope tight |

---

## Status log

| Date | Note |
|------|------|
| 2026-07-18 | Campaign opened. Next work = Part A harden. Auto fork locked in timeline topic. |
| 2026-07-19 | **Order locked:** H0 testing → bulletproof H1–H5 + Gap 1 → Part B. Process → bulletproof brief. Gap 1 folded into hub (no parallel gap-closure novel). Pre-ship expansion brief filed separately. |
| 2026-07-19 | **A0 / H0 shipped:** Cases A–J + scope comments; mutation inventory gate; FRAGILE `ATTEMPTS BEFORE THIS HELD`; ready for director OK on **H1**. |

---

## When this campaign closes

1. Part A + Part B exits checked (or Part B explicitly deferred by director with note).  
2. Move this file to [../archive/](../archive/).  
3. Update [Project_TODO.md](../Project_TODO.md) Active campaigns.  
4. Leave long-term UX in [timeline-collab-session.md](../topics/timeline-collab-session.md) + FRAGILE updates.
