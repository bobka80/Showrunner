# Decision brief — Project Campaign Room (Firebase hybrid)

**Status:** Brainstorm / architecture decision — **not active, not OK go for code.**  
**Filed:** 2026-07-21 (director brainstorm with Cursor agent).  
**Purpose:** External AI review pack — pros/cons, sequencing, and dependency on Logistics Ledger.  
**Entry:** [AI_DOCTRINE.md](../../../AI_DOCTRINE.md) · **Index:** [Project_TODO.md](../Project_TODO.md)

**Companion topics (read together):**

- [session-fork-platform.md](session-fork-platform.md) — current fork lifecycle (short sessions, dual-domain)
- [logistics-ledger-schema-2026-07-20.md](logistics-ledger-schema-2026-07-20.md) — structural PA refactor + movement SoT (prerequisite for sane “whole project” room)

**Current production context (2026-07-21):** Multi-user fork **Part B archived** after B7 (@ GAS **v725** tip). Prep live rollback pin **v654**. Design lock still says: Sheets = truth **between** sessions; Firebase = buffer during live fork; **no periodic Sheets sync** during active session ([dal-firebase-design-lock-2026-07-13.md](../archive/dal-firebase-design-lock-2026-07-13.md) rules 1–2) — **revise at Campaign Room time** (see pack §4).

**Director locks (poll v2, 2026-07-21):** [architecture-campaign-director-locks-2026-07-21.md](architecture-campaign-director-locks-2026-07-21.md) — **48h idle timer** (not lease); publish **meta → PA → timeline → ledger**; ledger load clocks from timeline shifts + `phase_ref`. Option C “hard expiry / lease” language below is **superseded** by those locks.

**Sequenced pack (canonical):** [architecture-multi-campaign-pack-2026-07-21.md](architecture-multi-campaign-pack-2026-07-21.md). **Ledger active:** [../active/logistics-ledger-2026-07-21.md](../active/logistics-ledger-2026-07-21.md).

---

## 1. Problem statement (why this came up)

Near show date and on large events, crews **revisit the same project repeatedly** — prep list, truck arrangement, timeline — often with several people in and out across hours or days.

The **current session model** treats each live fork as a **short-lived room**:

- open → live → **End / last-leave / idle eject** → commit to Sheets → room closed
- prep and timeline are **separate domains** (may both be open, but separate lifecycles)
- recent pain: refresh/orphan handling, committing freeze, PA open delay from orphan gates, dual-user asymmetry after commit

For crunch-week workflow, the **commit/reopen cycle** feels like friction, not safety. Director asked whether Firebase can stay live longer (e.g. **48 hours**) with **periodic checkpoints to Sheets** (e.g. every **30 minutes**), and whether a **whole-project Firebase workspace** with listeners would let people move fluidly without stepping on each other.

**This is not a small patch.** It is a **product lifecycle change** that conflicts with the 2026-07-13 DAL design lock unless that lock is explicitly revised.

---

## 2. Options considered

### Option A — Status quo (short sessions)

Keep today’s model: per-domain forks (prep `assets`, timeline `timeline`), close on End ∪ last-leave ∪ idle (prep **75m**, timeline **45m**), **one final commit** at close, no mid-session Sheets sync.

### Option B — Long-lived Firebase campaign (days/weeks), archive only at end

Firebase authoritative for the whole active period; Sheets updated only on explicit archive. Maximum fluidity; maximum drift risk and recovery risk.

### Option C — **Project Campaign Room** (recommended direction)

Hybrid:

- One **project workspace** in Firebase for up to **48 hours** (lease)
- **Publish checkpoints** to Sheets every **~30 minutes** (only if changed since last checkpoint)
- Room **stays live** during checkpoint (no full user freeze)
- Hard expiry at 48h: final publish → rotate room → next entry opens from latest Sheets
- Explicit End still allowed anytime

### Option D — Whole-project monolithic snapshot

Single giant Firebase document for “everything in the project.” **Not recommended** — Firestore ~1 MiB doc limit; PA already warns at 512 KiB / caps at 900 KiB. Prefer **multi-slice room** (assets + ledger + timeline paths), not one blob.

---

## 3. What “whole project behind the project editor” should mean

**After Logistics Ledger** (not before), the editable project workspace is naturally **three slices**:

| Slice | Firebase path (conceptual) | Sheets target | What it holds |
|-------|---------------------------|---------------|---------------|
| **Project Assets** | `projects/{id}/assets/` | `Project_Assets` | List design: qty, formula, container, dept, scan — **no truck columns** |
| **Logistics Ledger** | `projects/{id}/logistics/` (TBD at build) | `Logistics_Ledger` | Movement legs/stops: truck, from/to, load/unload, staging XYZ, `phase_ref` |
| **Timeline** | `projects/{id}/timeline/` | Shifts, phases, sub-events | Collab timeline state |

**Explicitly outside the live room:**

| Data | Why stay out |
|------|----------------|
| **Vault / master equipment** | Global reference, not per-project working copy |
| **`Operations_Ledger`** (RFID scans) | Design lock: atomic per-op Sheets path, not session fork |
| **Offers / invoices / financials** | Snapshot after pull; not live-synced with timeline |
| **Equipment Tracker / Conflicts** | Cross-project **read/compute** surfaces; consume **published** ledger + PA, not the live room itself |
| **Crew roster / vault / global tasks** | Not project-editor working set |

Director intent (“everything behind the project editor”) maps to **PA + Logistics_Ledger + Timeline** in one **campaign room**, not “literally every tab in the Engine workbook.”

---

## 4. How Logistics Ledger changes this decision

**Today (pre-ledger):**

- 12 truck/staging columns live **on each `Project_Assets` row**
- Firebase PA fork docs **embed** those fields (`dalFsDocToPaAsset_`, `dalPaContentSig_`, etc.)
- `saveTruckArrangementAPI` writes Sheets **full rewrite**, largely **outside** DAL/Firebase fork routing
- Known fragility: PA delta saves can **omit truck fields** → spatial data inconsistency

**After ledger campaign:**

- PA **shrinks** — assignment list only
- Movement moves to append-friendly **`Logistics_Ledger`** (legs + stops, `phase_ref` to timeline)
- Truck arrange must target **ledger**, not PA fork docs ([logistics-ledger §8](logistics-ledger-schema-2026-07-20.md))
- Conflicts read **ledger + phase_ref**, not coarse timeline envelopes

**Implication for Firebase hybrid:** Building a unified 48h room **on today’s PA shape** would **cement the wrong model** (truck fields inside every asset doc) and require **a second refactor** when ledger ships. **Sequence ledger first** (or at minimum lock schema + strip truck fields from PA/Firebase mappers), **then** build Project Campaign Room.

---

## 5. Pros and cons

### Option A — Short sessions (status quo)

**Pros**

- Matches current design lock and shipped code
- Sheets always current **between** sessions; simple mental model
- Smaller Firebase exposure window; less long-lived orphan/presence complexity
- Part B auto-fork / idle / last-leave already built

**Cons**

- Poor fit for show-week “same room all week” behavior
- Frequent commit/reopen causes UX pain (committing freeze, refresh orphans, calendar dot churn)
- Prep and timeline **separate lifecycles** → extra coordination when both are active
- Truck arrangement still awkwardly coupled to PA until ledger lands

### Option B — Long Firebase only, rare archive

**Pros**

- Maximum live fluidity; listeners always on one workspace
- Fewest “session ended” interruptions

**Cons**

- Sheets stale for long periods — breaks “SSOT” language unless redefined
- Large blast-radius commit at archive
- Firebase loss before archive = big data loss (Sheets far behind)
- Orphan/refresh/presence problems **worse** over days
- Conflicts with design lock rule 2 (no periodic sync)

### Option C — 48h Project Campaign Room + 30m publish checkpoints (recommended)

**Pros**

- Matches show-week revisit pattern without weeks of drift
- Regular durable checkpoints (30m) limit worst-case loss
- Re-enter same room without full commit/reopen cycle
- **Post-ledger:** three slices reduce “stepping on toes” (list vs movement vs timeline)
- Listeners per slice give near-real-time awareness without one giant doc
- Sheets remain **latest published durable state** (honest SSOT wording)

**Cons**

- **Violates current design lock** — requires explicit doctrine revision (periodic publish allowed)
- New lifecycle: lease, checkpoint, rollover, failure retry — more server state than today
- Sheets may be **up to ~30 minutes behind** live Firebase between checkpoints — downstream readers must know
- Checkpoint implementation must avoid freezing users every 30m
- Failed checkpoint while room live → need manager-visible retry (like commit fail-safe C)
- Firebase read/write budget on Spark — more listeners + longer room lifetime
- Must not build on pre-ledger PA truck embedding

### Option D — Monolithic project snapshot

**Pros**

- Simplest mental model for “one listener updates everything”

**Cons**

- Firestore document size limits (PA alone can approach 900 KiB cap)
- Hotspot writes; full redraw storms
- **Rejected** as implementation shape — use multi-slice room instead

---

## 6. Listeners and “not stepping on toes”

Listeners **help visibility**; they do **not** remove merge logic.

| Domain | Conflict reality |
|--------|------------------|
| PA | Batch absolute upserts primary; pack/container concurrent; floor +/- secondary combine |
| Ledger | Append legs/stops; less row contention than 12 fields on every PA row |
| Timeline | LWW on non-combining fields; shift drag-end writes |

**Ledger split reduces** a major conflict class: truck/staging edits no longer fight PA list edits on the **same row**.

---

## 7. Recommended sequencing (locked — updated 2026-07-21)

| Order | Work | Rationale |
|-------|------|-----------|
| **1** | ~~Finish Multi-user Part B~~ | **DONE** — archived |
| **2** | ~~Offer / availability~~ | **Off critical path** (director locks) |
| **3** | **Logistics Ledger** (M0–M5) | **ACTIVE** — PA slimming; movement SoT; strip truck fields from Firebase mappers |
| **4** | **Project Campaign Room** (this brief) | 48h idle + 30m publish on **meta + assets + logistics + timeline** |

**Do not OK go** Project Campaign Room until Ledger **M4+** proven.

---

## 8. Proposed rules (if Option C is adopted)

### Room lease

- Max **48 hours** per campaign room per project
- Auto-rollover: final publish → close → new room from Sheets on next entry
- Optional: manager “Extend 24h” (cap TBD)

### Publish checkpoint (~30 minutes)

- Run only if **dirty** since `lastPublishedAt`
- Publish all three slices in one logical batch (order TBD: ledger after PA refs?)
- Room **stays live** — no committing freeze for all users unless technically required
- UI: subtle “Last published to Sheets: 12m ago” (not alarming amber unless failed)

### Close triggers (still commit/publish)

- Explicit **End campaign**
- 48h expiry
- Optional: empty room for N hours (longer than today’s 45m/75m idle — TBD)

### Failure

- Checkpoint fail → room **stays live**; manager alert + retry pointer (reuse patterns from commit fail-safe B/C)
- Never silent discard

### Doctrine revision required

- Design lock rule 2: allow **periodic publish checkpoints** during active campaign room
- Redefine SSOT language:
  - **Firebase** = active workspace while room leased
  - **Sheets** = latest **published** durable record (may lag up to checkpoint interval)

---

## 9. Open director decisions (before OK go)

1. **Checkpoint interval:** 30m fixed vs adaptive (e.g. 15m during show week)?
2. **Checkpoint scope:** all three slices always vs dirty-slice only?
3. **Sheets lag tolerance:** OK for tracker/conflicts to read last publish, or force read Firebase for “live” conflict preview?
4. **RFID `Operations_Ledger`:** remain atomic outside room (recommended: **yes**)?
5. **Dual-domain legacy:** merge prep + timeline session registries into one `campaignRoomUid`?
6. **Idle vs lease:** does 45m/75m idle eject still apply inside 48h room, or only empty-room-for-hours?
7. **Promote order:** ledger before campaign room (recommended) vs parallel?

---

## 10. Summary recommendation

| Question | Recommendation |
|----------|----------------|
| Is prolonged Firebase wrong? | **No** — wrong only if Sheets lags days with no checkpoints |
| Is 48h + 30m checkpoint hybrid sensible? | **Yes** — best balance for show-week revisit pattern |
| Whole project in one Firebase blob? | **No** — use **multi-slice campaign room** (PA + Logistics_Ledger + Timeline) |
| Build now? | **No** — finish Part B; ship **Logistics Ledger**; then campaign room |
| Fix current session pain now? | **Yes** — orphan/refresh/commit UX within today’s model as interim |

**One-line:** Treat show-week work as a **leased Project Campaign Room** on Firebase with **periodic publish to Sheets**, but **wait for Logistics Ledger** so the room is built on PA + movement ledger + timeline — not on today’s truck-columns-on-PA coupling.

---

## 11. Files to read for external AI review

| File | Why |
|------|-----|
| This file | Decision pros/cons and sequencing |
| [logistics-ledger-schema-2026-07-20.md](logistics-ledger-schema-2026-07-20.md) | PA refactor, ledger schema, migration blast radius |
| [session-fork-platform.md](session-fork-platform.md) | Current fork pattern + link to this decision |
| [dal-firebase-design-lock-2026-07-13.md](../archive/dal-firebase-design-lock-2026-07-13.md) | Rules that Option C must revise |
| [archive/multi-user-fork-industrial-and-auto.md](../archive/multi-user-fork-industrial-and-auto.md) | Part B lifecycle (archived); v725 tip |
| [warehouse-prep-session.md](warehouse-prep-session.md) | Floor prep scope |
| [timeline-collab-session.md](timeline-collab-session.md) | Timeline collab lifecycle |
| [EQUIPMENT_MODEL.md](../EQUIPMENT_MODEL.md) | PA vs packing vs checkout boundaries |

**Repomix:** `node create-repomix.js` → `claude-pack/repomix-output.*.md` for full repo context.
