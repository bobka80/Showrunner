# Offer / Invoice · Crew Timeline Swap · Availability Conflicts

**Status:** Future campaign — **locked brainstorm** filed 2026-07-20. **Not active.** Do **not** implement until the director confirms sequencing has reached this campaign.  
**Sequencing:** Queued **behind** Multi-user fork **Part A** (done) and **Part B** (auto fork) — [../active/multi-user-fork-industrial-and-auto.md](../active/multi-user-fork-industrial-and-auto.md). Soft/hard **detection implementation** further depends on the Logistics Ledger campaign (queued **after** this offer work).  
**Entry:** [AI_DOCTRINE.md](../../../AI_DOCTRINE.md) · **Index:** [Project_TODO.md](../Project_TODO.md)  
**Related area topics:** [financials.md](financials.md) · [availability-fleet.md](availability-fleet.md) · [timeline-shift-field-crew.md](timeline-shift-field-crew.md)

**Companion (movement SoT / conflict schema):** [logistics-ledger-schema-2026-07-20.md](logistics-ledger-schema-2026-07-20.md) — schema homework locked; ledger is the source of truth for conflict detection (**supersedes** timeline-walking in §3.4 below). Do not implement soft/hard against PA truck columns or timeline-walk.

---

## Why this exists

Director brainstorm (2026-07-20) locked product decisions across three related surfaces:

1. Offer / invoice design (crew pull, conversion, transport, naming, company block, labor, handover print)
2. Timeline crew member swappability (person substitution only)
3. Availability tracker conflict model (hard vs soft) + day-view intent + known false-badge bug

This file is the **canonical backlog campaign** for that work. Area topics keep short shipped/remaining lists and **link here** for locked design.

---

## Gate before code

| Rule | Meaning |
|------|---------|
| **Not NEXT** | Multi-user Part B remains primary until director promotes this campaign |
| **No code until OK go** | Brainstorm locked; planning/implementation only after director confirms sequencing |
| **Invoice fields not final** | §1.2 web research is a **prerequisite** before locking invoice field requirements |
| **Conflicts need ledger** | Build soft/hard detection against Logistics_Ledger companion — **not** Project_Assets load/unload derivation / timeline walk |

---

## 1. Offer / Invoice Design — locked decisions

### 1.1 Crew snapshot into offer

- At offer creation, manager pulls crew counts from the timeline via **one button**.
- **Convenience pull, not live sync.** After pull, the offer is independent of the timeline.
- Manager adjusts counts/rates in the offer, then freezes it.
- Timeline is **not** the source of truth for a finalized offer.
- If the timeline changes after the pull, the offer stays locked unless the manager **manually re-pulls**.
- Same action may be repeated later (e.g. six months later) to regenerate an estimate from current timeline state.
- **Design:** pull must be **idempotent** and clearly labeled (e.g. **Refresh from Timeline**).

### 1.2 Offer → invoice conversion

- Invoice reuses the same document format, line items, and totals as the offer.
- Header text: **Quote** → **Invoice**.
- Invoice adds fields not on the offer:
  - Separate invoice number
  - Due date
  - Payment received status
  - Reference to originating quote number
- Offer has a **validity date** (14 days); invoice has a **due date** instead — primary structural difference.
- Trigger: **Create Invoice from this Offer**.

**Open prerequisite (not done):** Web research — real-world offer + invoice from the **same company**, showing legal/formatting differences. Required before finalizing invoice field requirements.

### 1.3 Transport line in offer

- **Default:** single **Transport** line item; no client-facing breakdown.
- **Print Studio** checkbox: expands into full breakdown (truck tier, km rate, wait fees).
- Manager chooses per-offer: simple vs breakdown.

### 1.4 Quote naming convention

- Format: `SBPROD-2026-07-001`
- Structure: company abbreviation + year + month + sequential counter.
- Counter **resets monthly**.
- Auto-generated at offer creation (not manual entry).

### 1.5 Company details block

- Required: registered name, tax ID, full address, phone, email.
- **Gap today:** free-text in localStorage. Must become a **structured settings entity** (not per-offer free text) so offers/invoices populate consistently.

### 1.6 Labor section

- Client-facing: three flat tiers per department — **Engineer / Technician / Stage Hand**, each with a daily rate.
- Internal timeline reality (individuals, real rates, margin) stays internal — **not** exposed.
- Rough counts from timeline via the same convenience-pull as §1.1; manager adjusts before freeze.

### 1.7 Handover print

- Signature blocks: **Handed Over By** and **Received By** — each with name / date / signature lines.
- Scope **now:** handover only.
- **Deferred:** condition tracking (itemized damage/wear) — later redesign (roadmap item below).

---

## 2. Timeline — crew member swappability (LOCKED)

In the timeline, crew member names are **clickable**. Click opens a picker scoped to the **same department** as the current assignment. Selecting a replacement **swaps the person** while preserving:

- Shift slot
- Hours
- Role
- Rate

**Person-substitution only** — no other shift attributes change. Implementation: replace the crew member reference on the **existing** shift row; do **not** create/delete shift rows.

---

## 3. Availability tracker — conflict system

### 3.1 Current bug (unresolved — needs code investigation)

Tracker sidebar shows conflict badges for conflicts **within a single event**. That is logically impossible (double-booking needs two events). Root cause **not traced**. Investigate in code when this campaign (or a director-approved early slice) is picked — not resolved in the brainstorm.

### 3.2 Day-view design intent

Clicking a day on the tracker calendar header should show:

1. Equipment booked that day
2. An event header divider
3. Under each event: truck headers with load/unload times and direction
4. Truck header renders the full journey, e.g.  
   `Warehouse → [load 08:00] → TRANSIT → [unload 14:00] → On-Site`
5. If transit spans multiple days, day-view shows only what is relevant to the viewed day

Partial structure exists in `04b_Equipment_Tracker.html`. Truck-header journey visualization may be incomplete — **verify in code**; do not assume complete.

### 3.3 Soft vs hard conflict — locked definitions

| Type | Meaning | Resolution |
|------|---------|------------|
| **Hard** | Equipment physically required in two places at the same time | Cross-rent from another rental company |
| **Soft** | Booked for Event B but still in transit/recovery from Event A | Change truck routing (e.g. Event A breakdown → Event B city without warehouse return) |

### 3.4 Schema note (superseded)

Earlier finding: Project_Assets lacked dedicated load/unload timestamp fields; load/unload existed as truck shift events; transit could be derived by walking timeline truck shifts between events.

**Superseded.** Soft/hard conflict detection must use the **Logistics_Ledger** design in the companion doc — not the timeline-walking approach.

---

## 4. Cross-reference

| Doc | Role |
|-----|------|
| This file | Locked product decisions + campaign checklist |
| [logistics-ledger-schema-2026-07-20.md](logistics-ledger-schema-2026-07-20.md) | Full campaign: Logistics_Ledger fields, PA migration, Conflicts cutover |
| [financials.md](financials.md) | Existing offer/print shipped surface |
| [availability-fleet.md](availability-fleet.md) | Existing tracker matrix surface |

---

## 5. Campaign checklist (when promoted)

### Prerequisites

- [ ] Director confirms sequencing has reached this campaign (after Part B / as directed)
- [ ] **Web research:** same-company offer vs invoice example — legal/formatting differences (§1.2) — before final invoice field lock
- [ ] Logistics Ledger campaign sequenced (schema locked in companion; implement **after** this offer campaign unless director reorders)

### Investigations (may run as early slices if director OK go)

- [ ] Trace false **single-event** conflict badge in tracker sidebar (§3.1)
- [ ] Verify truck-header journey visualization completeness in `04b_Equipment_Tracker.html` (§3.2)

### Build slices (order TBD at planning)

- [ ] Structured **company details** settings entity (§1.5) — replace localStorage free text
- [ ] Quote auto-numbering `SBPROD-YYYY-MM-###` with monthly reset (§1.4)
- [ ] Idempotent **Refresh from Timeline** crew/labor pull (§1.1, §1.6)
- [ ] Labor client view: Engineer / Technician / Stage Hand tiers (§1.6)
- [ ] Transport line + Print Studio breakdown checkbox (§1.3)
- [ ] Offer freeze / independence from timeline after pull (§1.1)
- [ ] **Create Invoice from this Offer** + invoice-only fields (§1.2) — after research
- [ ] Handover print signature blocks (§1.7)
- [ ] Timeline crew name click → same-department swap, preserve slot/hours/role/rate (§2)
- [ ] Soft vs hard conflict detection against **Logistics_Ledger** (§3.3) — **blocked on** [logistics-ledger-schema-2026-07-20.md](logistics-ledger-schema-2026-07-20.md) campaign
- [ ] Day-view equipment / event / truck journey UI per §3.2

### Explicitly deferred

- [ ] Condition tracking on handover (itemized damage/wear) — later redesign

---

## Promote to active

When the director picks this work: move or copy the checklist into `docs/ai/active/`, set **NEXT** (or parallel) in [Project_TODO.md](../Project_TODO.md), and keep this topics file as the lasting design lock (or archive the active copy when done).
