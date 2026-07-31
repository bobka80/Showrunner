# Production Milestones (Apps Script versions)

Created only on **Milestone** / **OK ship** / **Milestone now** — not on every "This works".

| # | Date | GAS version | Deployment | Note |
|---|------|-------------|------------|------|
| 1 | 2026-07-31 | 747 | `AKfycbxy…` | QoL: calendar strips — room green only, drop PA/timeline dots + glow |
| 2 | 2026-07-31 | 746 | `AKfycbxy…` | Theme tokens for buttons/titles + Visual Host click-to-edit button groups |
| 3 | 2026-07-25 | 745 | `AKfycbxy…` | Campaign Room R3b — warm Logistics Hub (pack/arrange/generate → Firebase under room; cold fallback) |
| 4 | 2026-07-24 | 744 | `AKfycbxy…` | Campaign Room R3: logistics/state warm arrange; End Room commits ledger; Sheets lag until publish |
| 5 | 2026-07-24 | 743 | `AKfycbxy…` | QoL: END ROOM on project editor; hide module End while campaign room warm |
| 6 | 2026-07-24 | 742 | `AKfycbxy…` | Campaign Room R2: share roomUid on slice meta; soft-leave idle/orphan when warm; closeDalCampaignRoom End closes both domains |
| 7 | 2026-07-24 | 741 | `AKfycbxy…` | Campaign Room R1: Index Dal_Campaign_* registry, openOrJoinDalCampaignRoom from project editor, Firebase meta/state, calendar green room dot + editor chrome |
| 8 | 2026-07-24 | 740 | `AKfycbxy…` | QoL: Project Assets opens immediately — orphan gate after paint, soft-join still gated |
| 9 | 2026-07-24 | 739 | `AKfycbxy…` | Exit Logistics Ledger: re-enable live forks (PA prep + timeline collab) |
| 10 | 2026-07-24 | 738 | `AKfycbxy…` | Visual Host theme playground — edit/bake dark, light, custom themes |
| 11 | 2026-07-24 | 737 | `AKfycbxy…` | M5: asset conflicts via ledger phase_ref free-at + fix unique single-project false badge |
| 12 | 2026-07-23 | 736 | `AKfycbxy…` | QoL: sidebar setup↔lock gap match tasks↔calendar (25px) |
| 13 | 2026-07-23 | 735 | `AKfycbxy…` | M4: ledger-only truck writers + strip 12 PA truck cols (Firebase/host sigs too) |
| 14 | 2026-07-23 | 734 | `AKfycbxy…` | M3: ledger-prefer truck readers (PA fallback; empty ledger truck does not wipe PA) |
| 15 | 2026-07-23 | 733 | `AKfycbxy…` | M3: ledger-prefer readers (Bugbot High fixed — empty ledger truck does not wipe PA) |
| 16 | 2026-07-23 | 732 | `AKfycbxy…` | QoL: sidebar setup icons 50px up (lock spacer 14→64) |
| 17 | 2026-07-22 | 731 | `AKfycbxy…` | Admin one-click M2 ledger backfill (RUN LEDGER BACKFILL in Database OPS) |
| 18 | 2026-07-21 | 730 | `AKfycbxy…` | M2: backfill Logistics_Ledger from PA truck cols; sheet AUTO clocks; RECOVERY phase_ref; review gaps API |
| 19 | 2026-07-21 | 729 | `AKfycbxy…` | Fork pause: one-shot abandon leftover Index prep/timeline flags on first Sheets route |
| 20 | 2026-07-21 | 728 | `AKfycbxy…` | Pause live forks (PA prep + timeline collab): Sheets-only until Logistics Ledger campaign done |
| 21 | 2026-07-21 | 727 | `AKfycbxy…` | M1.1: prep-open truck arrange → Firebase PA + ledger dual-write; truck fields on state fixtures/host flush; End Prep overlay collection-first |
| 22 | 2026-07-21 | 726 | `AKfycbxy…` | Logistics Ledger M0+M1: Logistics_Ledger tab, dual-write truck arrange, Project_Timelines uid preserve, END PREP truck overlay (Bugbot Highs fixed) |
| 23 | 2026-07-21 | 725 | `AKfycbxy…` | Refresh rejoin fix: localStorage unload flag + orphan gate before PA enter (do not soft-join abandoned Live) |
| 24 | 2026-07-21 | 724 | `AKfycbxy…` | Refresh/orphan: unload leave presence + last-leave; reclaim empty live module when fork still open |
| 25 | 2026-07-21 | 723 | `AKfycbxy…` | Peer Opening→Live unfreeze after post-commit; sticky leave block yields to new sessionUid; keep freeze until Opening (no edit gap) |
| 26 | 2026-07-21 | 722 | `AKfycbxy…` | Stay-in-view commit: hard-freeze during End/committing (PA+TL); stop live sync must not unlock; after Sheets clears auto-start new Firebase room |
| 27 | 2026-07-21 | 721 | `AKfycbxy…` | Committing hard-freeze: lock edits/START while Sheets committing (incl re-entry); SYNC Saving to Sheets copy; after clear auto-open new room + Live again toast (PA+timeline) |
| 28 | 2026-07-21 | 720 | `AKfycbxy…` | DAL commit fail drawer (copy) + calendar fork dots: amber committing, faster poll, no premature clear |
| 29 | 2026-07-21 | 719 | `AKfycbxy…` | DAL commit alerts — ROOT only, no repeat sweep toasts, suppress cleanup/mirror false pushes |
| 30 | 2026-07-20 | 718 | `AKfycbxy…` | Commit fail-safe C — server retry pointer + red-dot Retry UI (no false-alarm retries) |
| 31 | 2026-07-20 | 717 | `AKfycbxy…` | Fix false auto-close alerts — wait on committing, re-probe, station leave dedupe |
| 32 | 2026-07-20 | 716 | `AKfycbxy…` | Fix calendar hover phase strips after fork-dot rebuild (E2026-07-20-B) |
| 33 | 2026-07-20 | 715 | `AKfycbxy…` | Fix auto-close already-closed — no lockout spam, probe before Firebase write |
| 34 | 2026-07-20 | 714 | `AKfycbxy…` | QoL: silent timeline START/JOIN COLLAB (remove success alert) |
| 35 | 2026-07-20 | 713 | `AKfycbxy…` | Fix auto-close no_project — resolve prep projectId after station leave |
| 36 | 2026-07-20 | 712 | `AKfycbxy…` | Commit fail-safe B follow-up — timeline restore/flush + no mid-flight commit retry |
| 37 | 2026-07-20 | 711 | `AKfycbxy…` | Commit fail-safe B — backup before Sheets wipe, refuse empty, restore on fail |
| 38 | 2026-07-20 | 710 | `AKfycbxy…` | B4 last-leave — fresh presence before commit (stale roster left forks open) |
| 39 | 2026-07-20 | 709 | `AKfycbxy…` | QoL fix: PA WORKING select white frame with !important (beats theme-light select rules) |
| 40 | 2026-07-20 | 708 | `AKfycbxy…` | B2 UX — no immediate take-over on healthy Opening race (hang only) |
| 41 | 2026-07-20 | 707 | `AKfycbxy…` | QoL: PA WORKING dept dropdown frame back to white (not dept color) |
| 42 | 2026-07-20 | 706 | `AKfycbxy…` | QoL: remove committed-to-Sheets success alerts on END PREP / END COLLAB |
| 43 | 2026-07-20 | 705 | `AKfycbxy…` | B4 fix — last-leave on mobile/station leave (not only desktop CANCEL) |
| 44 | 2026-07-20 | 704 | `AKfycbxy…` | QoL fix: calendar fork dots — clear on close + real 15s poll repaint (no stale rawDbData fallback) |
| 45 | 2026-07-20 | 703 | `AKfycbxy…` | Part B4 close/idle eject — 45m TL / 75m prep idle + T-5 keep-open + last-leave commit + 45s presence |
| 46 | 2026-07-20 | 702 | `AKfycbxy…` | QoL fix: timeline selected strip light-gray frame wins over border !important (glow was only cue) |
| 47 | 2026-07-20 | 701 | `AKfycbxy…` | QoL: timeline selected strips — light gray frame instead of white glow |
| 48 | 2026-07-20 | 700 | `AKfycbxy…` | Part B5 cue redesign — Normal/Opening/Live/Closing SYNC phases + frozen/joining; idle stub for B4 |
| 49 | 2026-07-20 | 699 | `AKfycbxy…` | QoL: phone/station bottom SYNC bar — orange PA / blue timeline when Firebase fork live |
| 50 | 2026-07-20 | 698 | `AKfycbxy…` | QoL: main calendar stacked fork dots — orange PA / blue timeline after event name |

---

**Rollback production:** Tell the AI *"Rollback production to last milestone"*.
