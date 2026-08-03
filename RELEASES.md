# Production Milestones (Apps Script versions)

Created only on **Milestone** / **OK ship** / **Milestone now** — not on every "This works".

| # | Date | GAS version | Deployment | Note |
|---|------|-------------|------------|------|
| 1 | 2026-08-03 | 752 | `AKfycbxy…` | Hotfix arrange reopen: packing explode stripped paUids; collapse+replace hydrate; save returns current |
| 2 | 2026-08-03 | 751 | `AKfycbxy…` | Hotfix warm arrange: stamp truck fields onto live PA fixtures so reopen does not dump staging |
| 3 | 2026-07-31 | 750 | `AKfycbxy…` | Arrangement integrity: ledger pa_uid overlay key, warm empty Sheets fallback, truck open skip forceSync |
| 4 | 2026-07-31 | 749 | `AKfycbxy…` | Hotfix R3b Hub — finish/takeOver stuck prep opening; surface Hub arrange save errors |
| 5 | 2026-07-31 | 748 | `AKfycbxy…` | Themes — recessed/weekend/dept surface tokens (tracker Sat/Sun, roster strips, timeline grid, CREW FINISHED, mini-cal) |
| 6 | 2026-07-31 | 747 | `AKfycbxy…` | QoL: calendar strips — room green only, drop PA/timeline dots + glow |
| 7 | 2026-07-31 | 746 | `AKfycbxy…` | Theme tokens for buttons/titles + Visual Host click-to-edit button groups |
| 8 | 2026-07-25 | 745 | `AKfycbxy…` | Campaign Room R3b — warm Logistics Hub (pack/arrange/generate → Firebase under room; cold fallback) |
| 9 | 2026-07-24 | 744 | `AKfycbxy…` | Campaign Room R3: logistics/state warm arrange; End Room commits ledger; Sheets lag until publish |
| 10 | 2026-07-24 | 743 | `AKfycbxy…` | QoL: END ROOM on project editor; hide module End while campaign room warm |
| 11 | 2026-07-24 | 742 | `AKfycbxy…` | Campaign Room R2: share roomUid on slice meta; soft-leave idle/orphan when warm; closeDalCampaignRoom End closes both domains |
| 12 | 2026-07-24 | 741 | `AKfycbxy…` | Campaign Room R1: Index Dal_Campaign_* registry, openOrJoinDalCampaignRoom from project editor, Firebase meta/state, calendar green room dot + editor chrome |
| 13 | 2026-07-24 | 740 | `AKfycbxy…` | QoL: Project Assets opens immediately — orphan gate after paint, soft-join still gated |
| 14 | 2026-07-24 | 739 | `AKfycbxy…` | Exit Logistics Ledger: re-enable live forks (PA prep + timeline collab) |
| 15 | 2026-07-24 | 738 | `AKfycbxy…` | Visual Host theme playground — edit/bake dark, light, custom themes |
| 16 | 2026-07-24 | 737 | `AKfycbxy…` | M5: asset conflicts via ledger phase_ref free-at + fix unique single-project false badge |
| 17 | 2026-07-23 | 736 | `AKfycbxy…` | QoL: sidebar setup↔lock gap match tasks↔calendar (25px) |
| 18 | 2026-07-23 | 735 | `AKfycbxy…` | M4: ledger-only truck writers + strip 12 PA truck cols (Firebase/host sigs too) |
| 19 | 2026-07-23 | 734 | `AKfycbxy…` | M3: ledger-prefer truck readers (PA fallback; empty ledger truck does not wipe PA) |
| 20 | 2026-07-23 | 733 | `AKfycbxy…` | M3: ledger-prefer readers (Bugbot High fixed — empty ledger truck does not wipe PA) |
| 21 | 2026-07-23 | 732 | `AKfycbxy…` | QoL: sidebar setup icons 50px up (lock spacer 14→64) |
| 22 | 2026-07-22 | 731 | `AKfycbxy…` | Admin one-click M2 ledger backfill (RUN LEDGER BACKFILL in Database OPS) |
| 23 | 2026-07-21 | 730 | `AKfycbxy…` | M2: backfill Logistics_Ledger from PA truck cols; sheet AUTO clocks; RECOVERY phase_ref; review gaps API |
| 24 | 2026-07-21 | 729 | `AKfycbxy…` | Fork pause: one-shot abandon leftover Index prep/timeline flags on first Sheets route |
| 25 | 2026-07-21 | 728 | `AKfycbxy…` | Pause live forks (PA prep + timeline collab): Sheets-only until Logistics Ledger campaign done |
| 26 | 2026-07-21 | 727 | `AKfycbxy…` | M1.1: prep-open truck arrange → Firebase PA + ledger dual-write; truck fields on state fixtures/host flush; End Prep overlay collection-first |
| 27 | 2026-07-21 | 726 | `AKfycbxy…` | Logistics Ledger M0+M1: Logistics_Ledger tab, dual-write truck arrange, Project_Timelines uid preserve, END PREP truck overlay (Bugbot Highs fixed) |
| 28 | 2026-07-21 | 725 | `AKfycbxy…` | Refresh rejoin fix: localStorage unload flag + orphan gate before PA enter (do not soft-join abandoned Live) |
| 29 | 2026-07-21 | 724 | `AKfycbxy…` | Refresh/orphan: unload leave presence + last-leave; reclaim empty live module when fork still open |
| 30 | 2026-07-21 | 723 | `AKfycbxy…` | Peer Opening→Live unfreeze after post-commit; sticky leave block yields to new sessionUid; keep freeze until Opening (no edit gap) |
| 31 | 2026-07-21 | 722 | `AKfycbxy…` | Stay-in-view commit: hard-freeze during End/committing (PA+TL); stop live sync must not unlock; after Sheets clears auto-start new Firebase room |
| 32 | 2026-07-21 | 721 | `AKfycbxy…` | Committing hard-freeze: lock edits/START while Sheets committing (incl re-entry); SYNC Saving to Sheets copy; after clear auto-open new room + Live again toast (PA+timeline) |
| 33 | 2026-07-21 | 720 | `AKfycbxy…` | DAL commit fail drawer (copy) + calendar fork dots: amber committing, faster poll, no premature clear |
| 34 | 2026-07-21 | 719 | `AKfycbxy…` | DAL commit alerts — ROOT only, no repeat sweep toasts, suppress cleanup/mirror false pushes |
| 35 | 2026-07-20 | 718 | `AKfycbxy…` | Commit fail-safe C — server retry pointer + red-dot Retry UI (no false-alarm retries) |
| 36 | 2026-07-20 | 717 | `AKfycbxy…` | Fix false auto-close alerts — wait on committing, re-probe, station leave dedupe |
| 37 | 2026-07-20 | 716 | `AKfycbxy…` | Fix calendar hover phase strips after fork-dot rebuild (E2026-07-20-B) |
| 38 | 2026-07-20 | 715 | `AKfycbxy…` | Fix auto-close already-closed — no lockout spam, probe before Firebase write |
| 39 | 2026-07-20 | 714 | `AKfycbxy…` | QoL: silent timeline START/JOIN COLLAB (remove success alert) |
| 40 | 2026-07-20 | 713 | `AKfycbxy…` | Fix auto-close no_project — resolve prep projectId after station leave |
| 41 | 2026-07-20 | 712 | `AKfycbxy…` | Commit fail-safe B follow-up — timeline restore/flush + no mid-flight commit retry |
| 42 | 2026-07-20 | 711 | `AKfycbxy…` | Commit fail-safe B — backup before Sheets wipe, refuse empty, restore on fail |
| 43 | 2026-07-20 | 710 | `AKfycbxy…` | B4 last-leave — fresh presence before commit (stale roster left forks open) |
| 44 | 2026-07-20 | 709 | `AKfycbxy…` | QoL fix: PA WORKING select white frame with !important (beats theme-light select rules) |
| 45 | 2026-07-20 | 708 | `AKfycbxy…` | B2 UX — no immediate take-over on healthy Opening race (hang only) |
| 46 | 2026-07-20 | 707 | `AKfycbxy…` | QoL: PA WORKING dept dropdown frame back to white (not dept color) |
| 47 | 2026-07-20 | 706 | `AKfycbxy…` | QoL: remove committed-to-Sheets success alerts on END PREP / END COLLAB |
| 48 | 2026-07-20 | 705 | `AKfycbxy…` | B4 fix — last-leave on mobile/station leave (not only desktop CANCEL) |
| 49 | 2026-07-20 | 704 | `AKfycbxy…` | QoL fix: calendar fork dots — clear on close + real 15s poll repaint (no stale rawDbData fallback) |
| 50 | 2026-07-20 | 703 | `AKfycbxy…` | Part B4 close/idle eject — 45m TL / 75m prep idle + T-5 keep-open + last-leave commit + 45s presence |

---

**Rollback production:** Tell the AI *"Rollback production to last milestone"*.
