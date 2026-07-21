# Director locks — Architecture campaigns (2026-07-21)

**Status:** Director locks + design pack filed. Part B **archived**. Logistics Ledger **active** (awaiting OK go for M0/M1 code).  
**Source:** Canvas `architecture-campaign-locks` (`answers_v2`) + design sweep OK go 2026-07-21.  
**Entry:** [AI_DOCTRINE.md](../../../AI_DOCTRINE.md) · **Index:** [Project_TODO.md](../Project_TODO.md)

**Companions:**

- [architecture-multi-campaign-pack-2026-07-21.md](architecture-multi-campaign-pack-2026-07-21.md) — **canonical sequenced pack**
- [../active/logistics-ledger-2026-07-21.md](../active/logistics-ledger-2026-07-21.md) — **NEXT build**
- [project-campaign-firebase-hybrid-decision-2026-07-21.md](project-campaign-firebase-hybrid-decision-2026-07-21.md) — options A–D (lease framing **superseded** by idle timer below)
- [logistics-ledger-schema-2026-07-20.md](logistics-ledger-schema-2026-07-20.md) — full ledger schema
- [session-fork-platform.md](session-fork-platform.md) — current fork lifecycle
- [../archive/multi-user-fork-industrial-and-auto.md](../archive/multi-user-fork-industrial-and-auto.md) — Part B closed

**Hard dependency (director):** `Logistics_Ledger` depends on the **timeline** for truck load/unload clocks and soft-conflict availability (`phase_ref`). Timeline + ledger are one story in the warm room.

---

## Locked sequencing

| Order | Campaign | Notes |
|-------|----------|--------|
| 0 | Multi-user Part B — B7 → archive | **DONE 2026-07-21** |
| 1 | Logistics Ledger (M0–M5) | **ACTIVE** — shape + migration first |
| 2 | Project Campaign Room | 48h **idle** timer; warm Firebase; Sheets publish |
| 3 | Hierarchical delta / packet sync | Separate, later |
| — | Offer / Availability | **Off critical path** (parallel or later) |

RFID `Operations_Ledger` stays **atomic / outside the room permanently**.

---

## Campaign Room locks

| ID | Pick | Meaning |
|----|------|---------|
| `idle_touch` | `write_or_station` | Timer resets on any room-slice write (meta / PA / ledger / **timeline**) **or** station docked on that project. Presence alone does **not** reset. |
| `explicit_end` | `yes_end` | Keep Explicit End / Publish now beside idle close. |
| `conflict_warm_read` | `hybrid_badge` | Tracker/Conflicts: Sheets publish by default + optional Live preview; ledger **and** timeline together. |
| `offer_pull_warm` | `firebase_oneshot` | Offer pull = one-shot from live Firebase (incl. timeline), then freeze in the offer. |
| `checkpoint_scope` | `all_four_tl_before_ledger` | Always publish **meta → PA → timeline → ledger** (timeline before ledger for `phase_ref` / load windows). |
| `checkpoint_interval` | `fixed_30` | Fixed ~30 minutes. |
| `room_registry` | `one_uid` | One `campaignRoomUid` covers meta, PA, ledger, timeline together. |

**Idle model (supersedes earlier “48h lease / hard expiry”):** room stays open while activity continues; auto-closes after **48 continuous hours with no qualifying activity**. Config number, not architecture.

**Presence:** keep for roster UX; do **not** use last-leave / short idle as commit triggers once Campaign Room ships.

---

## Ledger ↔ Timeline locks

| ID | Pick | Meaning |
|----|------|---------|
| `load_time_source` | `timeline_shifts_plus_phase` | Timeline truck shifts supply clock times; `phase_ref` supplies availability end. |
| `soft_conflict_clock` | `phase_end` | Gear free for next move when linked **timeline phase ends** — not truck load alone. |
| `phase_ref` | `project_timelines` | FK → `Project_Timelines.uid`. |
| `phase_uid_preserve` | `preserve_on_rewrite` | **Locked 2026-07-21:** do not regenerate `Project_Timelines.uid` on every save; keep/reuse ids; expose `uid` on fragments so `phase_ref` stays valid. |
| `auto_shifts` | `keep_shifts_linked` | Keep AUTO-OUTBOUND / AUTO-INBOUND shifts **and** link them to ledger legs (two surfaces, one story). |

---

## Logistics Ledger locks

| ID | Pick | Meaning |
|----|------|---------|
| `empty_truck` | `yes_empty` | Allow empty `truck_uid` for on-site continuity / stay legs. |
| `dual_write` | `m1_m3` | Mandatory dual-write through M1–M3 before PA column removal. |

**M4 reminder:** strip Firebase PA truck mappers **and** `dalPaContentSig_` / `dalPaRowSignature_` in the same phase.

---

## Sequencing locks

| ID | Pick | Meaning |
|----|------|---------|
| `offer_path` | `off_path` | Full Offer campaign not between Part B and Ledger. |
| `ops_ledger` | `forever_out` | RFID ops ledger never enters the live room. |

---

## Still open at Room promote (not Ledger blockers)

- Checkpoint-fail escalation (lag > N hours)  
- Exact station-docked activity rule on server  
- Explicit revision text for 2026-07-13 design lock rules 1–2 at Campaign Room time  

**Filed:** Sheets ↔ Firebase room-slice parity checklist lives in [architecture-multi-campaign-pack-2026-07-21.md](architecture-multi-campaign-pack-2026-07-21.md) §6.

---

## Fresh-agent one-liner

Obey this file + the [architecture pack](architecture-multi-campaign-pack-2026-07-21.md). Build Ledger from [../active/logistics-ledger-2026-07-21.md](../active/logistics-ledger-2026-07-21.md). Do not reopen settled IDs unless live code forces a director question.
