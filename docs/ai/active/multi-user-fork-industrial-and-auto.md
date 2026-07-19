# Active — Multi-user fork: industrial harden → auto fork (timeline + PA)

**Entry:** [AI_DOCTRINE.md](../../../AI_DOCTRINE.md) · **Map:** [../README.md](../README.md)  
**Predecessor:** [data-access-layer.md](data-access-layer.md) — prep/timeline forks. **Prep live rollback (director 2026-07-19):** GAS **v654** + hosting `host-boot.js?v=653`. DAL-era catastrophic rollback: **v576**.  
**Fragile:** [../FRAGILE_ZONES.md](../FRAGILE_ZONES.md) §§ DAL prep / timeline session UI · prep PA fork live sync · timeline fork live sync  
**How live works today:** [dal-prep-live-sync-standards.md](dal-prep-live-sync-standards.md) · FRAGILE “How prep session UI works now”  
**Process + harden depth:** [bulletproof-multiuser-live-editors-2026-07-18.md](bulletproof-multiuser-live-editors-2026-07-18.md)  
**Auto-fork product spec (canonical UX):** [../topics/timeline-collab-session.md § Optional update](../topics/timeline-collab-session.md#optional-update--auto-fork-live-pull-in--idle-eject) (applies to **timeline and PA**)

**Opened:** 2026-07-18 · **Status:** **Part A complete** @ GAS **v678** (exit wrap). **Next:** middle campaign (director names) → then Part B auto fork. Rollback pin still **v654** / `host-boot.js?v=653`.  
**Production / prep live rollback:** GAS **v656** · hosting `host-boot.js?v=655` · sync baseline **v654** · Prep banner **`live sync (patch)`**  
**Latest:** One toast + sticky peer note in live-sync roster **v673**.  
  
**Floor workflow lock (director 2026-07-19):** § **Warehouse prep — real multi-user scope** below. **Do not** redesign live sync as “increment counters.” Primary ops = search/formula **batch absolute upserts** + pack/delete; +/- is secondary. Tech merge notes: [dal-prep-live-sync-standards.md](dal-prep-live-sync-standards.md).

---

## Fresh-agent start (other computer)

1. Read [AI_DOCTRINE.md](../../../AI_DOCTRINE.md) → **this file** (especially § **Warehouse prep — real multi-user scope**) → [bulletproof](bulletproof-multiuser-live-editors-2026-07-18.md) → FRAGILE §§ above.  
2. **Build order (locked 2026-07-19):** **(1) testing pipeline H0** → **(2) bulletproof multi-user H1–H5 + Gap 1** → **(3) Part B auto fork**.  
3. **Do not** start Part B until Part A exit is director-confirmed.  
4. **No code** until director says **OK go** (or names a Part A slice).  
5. After any implementation: `node milestone.js "…"`; hosting only if `host-boot.js` changes.

**Point the new agent here:**  
`docs/ai/active/multi-user-fork-industrial-and-auto.md`

---

## Warehouse prep — real multi-user scope (locked 2026-07-19)

**Director lock.** Explained in session; agents must not divert back to an “increments are the product” mental model. Equipment model: [../EQUIPMENT_MODEL.md](../EQUIPMENT_MODEL.md). Prep session: [../topics/warehouse-prep-session.md](../topics/warehouse-prep-session.md). **Prep multi-user list = this campaign (floor scope).** Normal-day Sheets backlog only: [../topics/project-assets-concurrency.md](../topics/project-assets-concurrency.md).

### What prep actually is

While **START PREP** is open, Project Assets is a **shared warehouse prep room** on one project — several departments, several roles, one equipment list. People are not only tapping +/-. They are **designing** the show’s gear, **packing** it into cases/trunks, and **checking it out** of the building, often at the same time. Headcount is not capped at “4–6”; sync must stay correct as more people join.

### How gear gets onto the list (primary path)

The search bar (`#pa-search-cli`) is an **add engine**, not only search (left vault/search → right list).

- Type / pick → Enter adds into the **active sublist** (`activePaTarget` = location + formula).
- Quantities are often **absolute and large** (`10x …`, `*`, formula lines, kit explosions) — not +1 taps.
- One Enter can create **many rows** (bulk absolute qty, physical explode to qty 1, fixed rack + children, fluid kit blueprint).
- Formulas use the **Triangle of Truth** (human slash formula ↔ beautiful formula ↔ list). Sublist identity = `(location, formula)`.
- Kits/cases can expand into many children in one action; auto-fill can round to full cases.

**Concurrent picture:** Person A dumps a big Audio formula sublist; Person B dumps another department’s lines; neither is “incrementing.”

### How the list is adjusted (secondary / also concurrent)

- Floor **+/-** or typed qty on existing rows — real, but **not** the design center of sync.
- **Remove / DEL** on rows/groups today.
- **Red X = remove a whole set of items** — **future** product control (not shipped yet); when built, it must live-sync like any other delete batch.
- Autos (`isAuto` / `isGenericAuto`) rebuild **locally** — never the live peer write surface.

### Packing (same list, different job)

Two engines — **never merge** ([EQUIPMENT_MODEL.md](../EQUIPMENT_MODEL.md)):

1. **Auto-Containerization** — physical fixtures → phantom/physical cases (`recalcAutoContainers`).
2. **Auto-Packing** — **bulk cables only** → `[BULK] …` trunk sublists (`autoProvisionCableCases`).

Manual pack/unpack sets `containerUid`. Cable trunks are sublists of bulk counts married to case identity for door checkout. Department packing filters are **UI view only**, not separate databases.

**Concurrent picture:** someone still adds lines in design while others pack Audio cases and fill cable trunks.

### RFID / gate / checkout (parallel subsystem)

Checkout uses the **shared ops ledger / session** (guns, stations, gate). Design lock today: ledger is **atomic Sheets ops**, not the PA Firebase fork — but the **floor story** is simultaneous: scanners check out packed gear while the list is still being built/packed. Case scan expands packed children. Gate = building exit. Live PA truth and checkout must not silently fight even across subsystems.

### What “single source of truth” must survive

At once, on one project:

1. Designers adding **big batches** via search/formula into different department sublists  
2. Others **removing or tweaking** qty on existing lines  
3. Packers moving items into containers / cable bulk trunks  
4. RFID operators **checking out** at stations/gate  
5. Later: bulk remove-by-set (red X)

Live sync’s job is **not** “combine +1 forever.” It is: every real list mutation (**batch insert**, **absolute qty**, pack link, delete) becomes shared server truth **without flash-then-revert**, for as many people as the floor needs.

### Sync design implications (do not forget)

| Priority | Operation class | Intent |
|----------|-----------------|--------|
| **1 — primary** | Search / formula / kit add → many new or bumped UIDs with **absolute** fields | Peer lists must show the full batch; no yank back to pre-batch |
| **2 — concurrent** | Pack / unpack (`containerUid`), deletes, DEL / future red-X set-delete | Same SSOT; every path must note touch/delete (H5) |
| **3 — secondary** | Floor +/- on an existing UID | May use delta-combine so concurrent taps don’t erase each other; **byproduct**, not the product model |
| **Never** | Treat prep as a CRDT text editor or as “increment API only” | Wrong workflow |

Technical merge rules and never-dos stay in [dal-prep-live-sync-standards.md](dal-prep-live-sync-standards.md) + [FRAGILE_ZONES.md](../FRAGILE_ZONES.md). If a proposal conflicts with **this section**, **stop and ask the director**.

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

Director-confirmed **manual** multi-user prep (and timeline twin) — **rollback = GAS v654** + `host-boot.js?v=653`:

- Live list = `projects/{id}/assets/state` (or `timeline/state`) + transactional touch/delete patch  
- Banner **`live sync (patch)`** while open; banner off = live sync off  
- END: `_meta` + Sheets agree (or meta-end timeout); after END block **same `sessionUid`** reopen  
- Deletes note `dalPaNoteDelete_`; seed-from-local only before remote `writeSeq`  
- **Floor scope:** § **Warehouse prep — real multi-user scope** — search/formula **batch absolute upserts** are primary; packing + delete concurrent; floor +/- secondary  
- **Prep qty (secondary path):** same-row multi-window +/- may **combine** via deltas (Case O) — must not redefine the product as increments  
- Apply `result.merged` / heal so UI cannot stick behind server or **flash then revert** after peer/batch applies  
- Sim: `node scripts/dal-pa-live-sync-test.js` (Cases **A–P**) must stay green  
- Doctrine: this file § floor scope + [dal-prep-live-sync-standards.md](dal-prep-live-sync-standards.md)  
- Gate: `node scripts/dal-mutation-inventory-check.js` (wired in `pre-ship/dal.js`)  

Rollback if Part A/B wrecks floor: tell AI **"Rollback production to v654"** (prep live known-good). DAL-era Sheets-only catastrophic rollback remains **v576**.

---

## Part A — Testing pipeline → industrial harden (first)

**H definitions:** [dal-prep-live-sync-standards.md](dal-prep-live-sync-standards.md) §2.  
**Process depth:** [bulletproof](bulletproof-multiuser-live-editors-2026-07-18.md).  
**This section = only checkbox list + locked order.** Do not invent a rival order in other files.

### A0 — Testing pipeline (H0) — **complete** ✅ 2026-07-19

- [x] Re-read FRAGILE session UI + prep PA + timeline live sections  
- [x] Confirm production banner **`live sync (patch)`** on web.app (two browsers) — **director smoke done**  
- [x] Note GAS + hosting versions — **v654** / `host-boot.js?v=653` (prep live rollback)  
- [x] Scope/non-coverage comments on every sim Case (A–J; later K–P added)  
- [x] `scripts/dal-mutation-inventory-check.js` + `dal-tl-mutation-inventory-check.js` wired into `pre-ship/dal.js`  
- [x] Mode-switch-seam sim cases (Case H — stale GAS while Firestore mode → reject)  
- [x] Incident template: “How many prior attempts before this held?” (`ATTEMPTS BEFORE THIS HELD` in FRAGILE)  
- [x] Former **H6** stronger sims absorbed: Case I (3-client delete), Case J (sticky ended sessionUid)  
- [x] First product H-item shipped (**H1**); **H5** mutation inventory shipped (PA + timeline twin)  

### A1 — H1 Fail closed on weak sync ✅ 2026-07-19

- [x] If Auth/listen fails → do **not** silently multi-edit on GAS `live sync (server)` poll  
- [x] Hard banner warning and/or block fixture/timeline edits until `patch` restored  
- [x] Adversarial sim: Auth fails *mid-edit*, not only at start (Case K)  
- [x] Smoke: force server mode → user cannot thrash peer without knowing (blocked mode + Case K) 

### A2 — H5 Mutation-path inventory gate

- [x] Every prep mutator of `currentProjectAssets` notes touch/delete (and timeline twin)  
- [x] Gate scripts enforced in [dal-pre-ship-gates.md](dal-pre-ship-gates.md): `dal-mutation-inventory-check.js` (PA) + `dal-tl-mutation-inventory-check.js` (timeline)  
- [x] Shipped after H1 (same theme: don’t silently corrupt on hot path)  
- [x] PA ALLOWLIST shrunk to DUMMY shell only; timeline mid-drag / sub-event ALLOWLIST documented in gate script  


### A3 — Gap 1 Firestore / GAS mode structural lint ✅

- [x] After A0 mode-seam sims exist: add `scripts/dal-sync-mode-lint.js` (wired in `pre-ship/dal.js`)  
- [x] Fail diffs that call `saveProjectAssets` / `saveTimelineData` from live client modules without allowlist  
- [x] Fail applying GAS responses into live apply without firestore-mode guard or `writeSeq` presence  
- [x] Document in [dal-pre-ship-gates.md](dal-pre-ship-gates.md)  
- [x] Detection only — no runtime behavior change required for the gate itself  

Forbidden patterns #10/#11: [dal-prep-live-sync-standards.md](dal-prep-live-sync-standards.md) / FRAGILE — mechanical guard replaces “don’t” alone.

### A4 — H4 State size + END mirror check ✅

- [x] Warn/cap huge `fixturesJson` / timeline state — **WARN 512 KiB / 1,500 rows; MAX 900 KiB / 4,000** (Firestore ~1 MiB doc limit)  
- [x] END PREP: mirror state vs collection fixtures; alert/pocket on mismatch; commit **state SSOT + collection autos**  
- [x] END COLLAB: refuse oversized timeline state  
- [x] Case S in `dal-pa-live-sync-test.js`; client toast + host write refuse at MAX  

### A5 — H3 Same-row conflict visibility

- [x] Toast or clear cue when same UID loses to peer **LWW on non-combining fields** (location/notes/flags; timeline strips). **Not** for floor qty +/- — those **combine** (v653 Case O).  
- [x] **Both** prep fixtures **and** timeline entities in the **same** milestone — no “as practical” hedge; if timeline slips, open an explicit follow-up checkbox here  

### A6 — H2 Cheaper remote apply

- [x] Reduce full PA / timeline redraw storms on remote snap (targeted merge → redraw)  
- [x] Define measurable pass condition before coding (e.g. no full DOM re-render for diffs touching <5% of rows, or a frame-time budget)  
- [x] Smoke: remote qty/delete without browser stutter  
- **Pass condition (locked):** PA qty-only on ≤ `max(3, 5% of fixture rows)` → DOM qty patch (`data-pa-uid`), zero `renderProjectAssetsUI`. Timeline ≤5 shift-only changes (no adds/phases/overrides) → in-place block patch, zero `drawShifts`/`rebuildTimelineGrid`. Else full/layer fallback. Case V.  

### A7 — Part A exit

- [x] Director smoke (two browsers, prep **and** timeline) + ≥1 adversarial step — **director wrap 2026-07-19** (“looks good” / “it’s a wrap”)  
- [x] Mutation-inventory gate green; sim cases all have scope comments (Cases A–V in pre-ship)  
- [x] Update FRAGILE + this file status: **Part A complete** — middle campaign before Part B  
- [x] Milestone note names which **rules** closed: `Part A industrial harden complete — try baseline for auto fork`

**Part A ship rule:** Prefer **one H-item per milestone** (or tightly paired H1+H5). Gap 1 is a **lint** and may ship in its own milestone after A0. No “misc live sync guards” ships.

**Part A closed rules (H0–H5 + Gap 1):** fail-closed weak sync; mutation inventory; Firestore/GAS mode lint; state size + END mirror; conflict visibility (roster/hover, no toast spam); cheaper remote apply (qty/shift patch).

---

## Part B — Auto fork, live pull-in & idle eject (third)

**Do not start until Part A exit is checked and director says OK go for Part B.**

**Floor debugging channel (recommended before/during Part B smoke):** [user-error-reporting-journal-2026-07-19.md](user-error-reporting-journal-2026-07-19.md) — daily error-log packs → agent triage → journal.

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
| 2026-07-19 | **A1 / H1 shipped:** Auth/listen/write fail → blocked mode (hard banner + edits locked); no silent GAS multi-edit; Case K mid-edit sim; timeline twin. |
| 2026-07-19 | **A2 / H5 shipped @ v655:** PA notes on location/shortage/formula rewrite/cancel; timeline notes on note/arrow/crew override; timeline inventory gate; crew DONE/CANCEL single flush; ALLOWLIST overrideDept (not in FS schema). |
| 2026-07-19 | **Campaign paused** for side feature: PA **working dept** (new-add stamp) + **green selected dept** (paste target) + `override_dept` Sheets/FS live sync. Resume → **Gap 1 (A3)**. |
| 2026-07-19 | **A3 / Gap 1 shipped:** `scripts/dal-sync-mode-lint.js` in pre-ship; FRAGILE #10/#11 mechanical; post-END timeline hydrate allowlisted. **Next: A4 / H4** (state size + END mirror). |
| 2026-07-19 | **A4 / H4 shipped:** state size WARN/MAX; END PREP mirror alert + state SSOT commit; Case S; hosting host-boot size refuse. **Next: A5 / H3**. |
| 2026-07-19 | **A5 / H3 shipped:** PA + timeline toast on non-combining LWW loss; qty-only ignored; Case T; `scripts/lib/dal-lww-conflict-core.js`. **Next: A6 / H2**. |
| 2026-07-19 | **H3 follow-up:** peer **delete** of watched rows also toasts (PA + timeline); Case T peer-delete asserts. |
| 2026-07-19 | **Peer delete vs dept move:** pierce hold/touch on apply; flush must not resurrect known UIDs (Case U); host-boot `?v=665`. |
| 2026-07-19 | **H3 toast harden:** peer-delete toast ignores hold/touch; 45s recent-edit window; check on requeue path (formula dept set moves). |
| 2026-07-19 | **H3 toast visible:** local-vs-remote peer-delete detect; `showPushToast` + prep SYNC strip; formula dept arms 60s watch. |
| 2026-07-19 | **Twin General DEL:** dept-scoped `removeFormulaGroup` / `updateFormulaDept`; cut→green-dept unique loc (like copy). Normal unique lists unchanged. |
| 2026-07-19 | **Conflict toast visible:** in-PA-modal banner + `SHOWRUNNER_HOST_TOAST`; peer-delete toasts any known remote remove (not only recent-edit). |
| 2026-07-19 | **Conflict toast UX:** centered mid-screen toast (not host-only); toast + roster note both name what was removed/overwritten. |
| 2026-07-19 | **A6 / H2 shipped:** PA qty-only patch + timeline shift-only DOM patch; Case V; pass bar max(3,5%) / ≤5 entities. **Next: A7 Part A exit.** |
| 2026-07-19 | **H2 follow-up:** qty patch also updates +/- control span (`data-pa-qty`); fixes peer “one step behind” on multi-qty bumps. |
| 2026-07-19 | **Conflict UX:** no toast / no auto-expand; compact SYNC roster + hover peer → ops popover. Working dept: white label/frame, select border = dept color, white rails +1px. |
| 2026-07-19 | **A7 / Part A exit:** director wrap — Part A industrial harden complete. Next = middle campaign (not Part B yet). |

---

## When this campaign closes

1. Part A + Part B exits checked (or Part B explicitly deferred by director with note).  
2. Move this file to [../archive/](../archive/).  
3. Update [Project_TODO.md](../Project_TODO.md) Active campaigns.  
4. Leave long-term UX in [timeline-collab-session.md](../topics/timeline-collab-session.md) + FRAGILE updates.
