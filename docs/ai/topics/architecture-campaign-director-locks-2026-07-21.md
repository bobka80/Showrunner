# Director locks — Architecture campaigns (2026-07-21)

**Status:** Director locks + design pack filed. Part B **archived**. Logistics Ledger **COMPLETE**. Project Campaign Room **COMPLETE** — [../archive/project-campaign-room-2026-07-24.md](../archive/project-campaign-room-2026-07-24.md). **Active build:** [../active/warm-readers-offer-tracker-2026-08-05.md](../active/warm-readers-offer-tracker-2026-08-05.md).  
**Source:** Canvas `architecture-campaign-locks` (`answers_v2`) + design sweep OK go 2026-07-21.  
**Entry:** [AI_DOCTRINE.md](../../../AI_DOCTRINE.md) · **Index:** [Project_TODO.md](../Project_TODO.md)  
**Terminology (law):** [GLOSSARY.md](../GLOSSARY.md) § Timeline: **sub-events** vs **phases**.

**Companions:**

- [architecture-multi-campaign-pack-2026-07-21.md](architecture-multi-campaign-pack-2026-07-21.md) — **canonical sequenced pack**
- [../archive/logistics-ledger-2026-07-21.md](../archive/logistics-ledger-2026-07-21.md) — Ledger complete
- [../archive/project-campaign-room-2026-07-24.md](../archive/project-campaign-room-2026-07-24.md) — Room complete (R0–R5 @ v767)
- [../active/warm-readers-offer-tracker-2026-08-05.md](../active/warm-readers-offer-tracker-2026-08-05.md) — **active build** (Offer pulls + Tracker hybrid + checkpoint smoke)
- [project-campaign-firebase-hybrid-decision-2026-07-21.md](project-campaign-firebase-hybrid-decision-2026-07-21.md) — options A–D (lease framing **superseded** by idle timer below)
- [logistics-ledger-schema-2026-07-20.md](logistics-ledger-schema-2026-07-20.md) — full ledger schema
- [session-fork-platform.md](session-fork-platform.md) — current fork lifecycle
- [../archive/multi-user-fork-industrial-and-auto.md](../archive/multi-user-fork-industrial-and-auto.md) — Part B closed

**Hard dependency (director):** `Logistics_Ledger` depends on the **timeline** for truck load/unload clocks and soft-conflict availability (`phase_ref` = **sub-event** FK). Timeline + ledger are one story in the warm room.

---

## Locked sequencing

| Order | Campaign | Notes |
|-------|----------|--------|
| 0 | Multi-user Part B — B7 → archive | **DONE 2026-07-21** |
| 1 | Logistics Ledger (M0–M5) | **DONE** — archived |
| 2 | Project Campaign Room | **DONE** — archived 2026-08-05; five slices; N-day idle (48h default); warm Firebase; Sheets publish |
| 2b | Warm readers + Offer pulls + Checkpoint smoke | **ACTIVE** — [../active/warm-readers-offer-tracker-2026-08-05.md](../active/warm-readers-offer-tracker-2026-08-05.md) |
| 3 | Hierarchical delta / packet sync | Separate, later |
| — | Offer invoice / crew swap / soft-hard conflicts | Rest of offer topic still backlog (pulls are in 2b) |

RFID `Operations_Ledger` is the **fifth warm slice** (`ops_ledger` = `warm_fifth_slice`, reopened 2026-07-31). Still **outside** the room: vault, tracker conflicts, crew roster, financials, offers.

---

## Campaign Room locks

| ID | Pick | Meaning |
|----|------|---------|
| `idle_touch` | `write_or_station` | Timer resets on any room-slice write (meta / PA / ledger / timeline / **ops**) **or** station docked on that project. Presence alone does **not** reset. |
| `explicit_end` | `yes_end` | Keep Explicit End / Publish now beside idle close. |
| `conflict_warm_read` | `oneshot_hybrid` | **Superseded 2026-08-05** (was `hybrid_badge`). Tracker/Conflicts: warm → one-shot Firebase; cold → Sheets; fail open to Sheets. **No** Live badge. **No** Tracker listeners. See warm-readers campaign. |
| `offer_pull_warm` | `manual_dual_undo` | **Superseded 2026-08-05** (was `firebase_oneshot`). Offer stays snapshot: **Pull Project Assets** + **Pull Timeline + logistics**; warm→Firebase / cold→Sheets; **Undo** after pull. See warm-readers campaign. |
| `checkpoint_scope` | `all_five_ops_last` | Always publish **meta → PA → timeline → ledger → ops** (timeline before ledger for `phase_ref` / load windows; ops last). |
| `checkpoint_interval` | `fixed_30` | Fixed ~30 minutes. |
| `room_registry` | `one_uid` | One `campaignRoomUid` covers meta, PA, timeline, ledger, **ops** together. |
| `ops_ledger` | `warm_fifth_slice` | **Reopened 2026-07-31** (was `forever_out`). RFID ops journal is a warm room slice; Firebase live while warm; Sheets via checkpoint/End; fail-safe ≥ PA B/C; no silent scan loss. |
| `listener_scope` | `active_user` | Listeners follow the active user across projects; do not linger on warm-but-empty rooms. |
| `idle_ms_constant` | `single_knob` | One named constant (default 48h); 168h / 240h is config, not rearchitecture. |

**Idle model (supersedes earlier “48h lease / hard expiry”):** room stays open while activity continues; auto-closes after **N continuous hours with no qualifying activity** (default **48h**). Config number, not architecture.

**Presence:** keep for roster UX; do **not** use last-leave / short idle as commit triggers once Campaign Room ships. Listeners ≠ idle clock.

---

## Ledger ↔ Timeline locks

| ID | Pick | Meaning |
|----|------|---------|
| `load_time_source` | `timeline_shifts_plus_phase` | Timeline truck shifts supply clock times; `phase_ref` supplies availability end. *(poll id historical — “phase” here means the legacy column, which is a **sub-event**)* |
| `soft_conflict_clock` | `phase_end` | Gear free for next move when linked **sub-event ends** — not truck load alone. *(poll id historical; product word = **sub-event end**, not timeline-header phase)* |
| `phase_ref` | `project_timelines` | FK → `Project_Timelines.uid` = **sub-event** uid. Column name `phase_ref` is legacy — **not** `Phase_Blocks`. |
| `phase_uid_preserve` | `preserve_on_rewrite` | **Locked 2026-07-21:** do not regenerate `Project_Timelines.uid` on every save; keep/reuse ids; expose `uid` on fragments so `phase_ref` stays valid. |
| `auto_shifts` | `keep_shifts_linked` | Keep AUTO-OUTBOUND / AUTO-INBOUND shifts **and** link them to ledger legs (two surfaces, one story). |

**Terminology reminder:** **Sub-events** = `Project_Timelines`. **Phases** = `Phase_Blocks` (timeline header). See [GLOSSARY.md](../GLOSSARY.md).

---

## Logistics Ledger locks

| ID | Pick | Meaning |
|----|------|---------|
| `empty_truck` | `yes_empty` | Allow empty `truck_uid` for on-site continuity / stay legs. |
| `dual_write` | `m1_m3` | Mandatory dual-write through M1–M3 before PA column removal. |

**M4 reminder:** strip Firebase PA truck mappers **and** `dalPaContentSig_` / `dalPaRowSignature_` in the same migration stage.

---

## Sequencing locks

| ID | Pick | Meaning |
|----|------|---------|
| `offer_path` | `off_path` | Full Offer campaign not between Part B and Ledger. |
| `ops_ledger` | `warm_fifth_slice` | **Reopened 2026-07-31** — see Campaign Room locks (was `forever_out`). |

---

## Still open after Room archive (not Ledger blockers)

- Checkpoint-fail escalation (lag > N hours) — shipped in R4; smoke in warm-readers **W1**  
- Meta identity elevation + ops fifth slice — **R3c / R3d shipped** — [../archive/project-campaign-room-2026-07-24.md](../archive/project-campaign-room-2026-07-24.md)  
- Tracker hybrid + Offer dual pulls + undo — **ACTIVE** [../active/warm-readers-offer-tracker-2026-08-05.md](../active/warm-readers-offer-tracker-2026-08-05.md)  
- Whether soft free-at should later retarget from **sub-event** to a real **phase** (`Phase_Blocks`) — director discussion pending  
- Whether to rename column `phase_ref` → a sub-event-clear name — deferred  

**Filed in R0 (2026-07-24):** design-lock rules 1–2 revision — [../archive/dal-firebase-design-lock-2026-07-13.md](../archive/dal-firebase-design-lock-2026-07-13.md) § Campaign Room revision.  

**Filed 2026-07-31:** five-slice architecture; `ops_ledger` → `warm_fifth_slice`; meta identity gap; listener-follows-user.

**Filed 2026-08-05:** `conflict_warm_read` → `oneshot_hybrid`; `offer_pull_warm` → `manual_dual_undo` (warm-readers campaign).

**Filed:** Sheets ↔ Firebase room-slice parity checklist lives in [architecture-multi-campaign-pack-2026-07-21.md](architecture-multi-campaign-pack-2026-07-21.md) §6.

---

## Fresh-agent one-liner

Obey this file + the [architecture pack](architecture-multi-campaign-pack-2026-07-21.md) + [GLOSSARY](../GLOSSARY.md) sub-event/phase lock. Room is archived — build next from [../active/warm-readers-offer-tracker-2026-08-05.md](../active/warm-readers-offer-tracker-2026-08-05.md). Do not reopen settled Room IDs (`idle_touch`, `checkpoint_interval`, `room_registry`, …) unless live code forces a director question.
