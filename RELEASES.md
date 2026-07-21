# Production Milestones (Apps Script versions)

Created only on **Milestone** / **OK ship** / **Milestone now** — not on every "This works".

| # | Date | GAS version | Deployment | Note |
|---|------|-------------|------------|------|
| 1 | 2026-07-21 | 729 | `AKfycbxy…` | Fork pause: one-shot abandon leftover Index prep/timeline flags on first Sheets route |
| 2 | 2026-07-21 | 728 | `AKfycbxy…` | Pause live forks (PA prep + timeline collab): Sheets-only until Logistics Ledger campaign done |
| 3 | 2026-07-21 | 727 | `AKfycbxy…` | M1.1: prep-open truck arrange → Firebase PA + ledger dual-write; truck fields on state fixtures/host flush; End Prep overlay collection-first |
| 4 | 2026-07-21 | 726 | `AKfycbxy…` | Logistics Ledger M0+M1: Logistics_Ledger tab, dual-write truck arrange, Project_Timelines uid preserve, END PREP truck overlay (Bugbot Highs fixed) |
| 5 | 2026-07-21 | 725 | `AKfycbxy…` | Refresh rejoin fix: localStorage unload flag + orphan gate before PA enter (do not soft-join abandoned Live) |
| 6 | 2026-07-21 | 724 | `AKfycbxy…` | Refresh/orphan: unload leave presence + last-leave; reclaim empty live module when fork still open |
| 7 | 2026-07-21 | 723 | `AKfycbxy…` | Peer Opening→Live unfreeze after post-commit; sticky leave block yields to new sessionUid; keep freeze until Opening (no edit gap) |
| 8 | 2026-07-21 | 722 | `AKfycbxy…` | Stay-in-view commit: hard-freeze during End/committing (PA+TL); stop live sync must not unlock; after Sheets clears auto-start new Firebase room |
| 9 | 2026-07-21 | 721 | `AKfycbxy…` | Committing hard-freeze: lock edits/START while Sheets committing (incl re-entry); SYNC Saving to Sheets copy; after clear auto-open new room + Live again toast (PA+timeline) |
| 10 | 2026-07-21 | 720 | `AKfycbxy…` | DAL commit fail drawer (copy) + calendar fork dots: amber committing, faster poll, no premature clear |
| 11 | 2026-07-21 | 719 | `AKfycbxy…` | DAL commit alerts — ROOT only, no repeat sweep toasts, suppress cleanup/mirror false pushes |
| 12 | 2026-07-20 | 718 | `AKfycbxy…` | Commit fail-safe C — server retry pointer + red-dot Retry UI (no false-alarm retries) |
| 13 | 2026-07-20 | 717 | `AKfycbxy…` | Fix false auto-close alerts — wait on committing, re-probe, station leave dedupe |
| 14 | 2026-07-20 | 716 | `AKfycbxy…` | Fix calendar hover phase strips after fork-dot rebuild (E2026-07-20-B) |
| 15 | 2026-07-20 | 715 | `AKfycbxy…` | Fix auto-close already-closed — no lockout spam, probe before Firebase write |
| 16 | 2026-07-20 | 714 | `AKfycbxy…` | QoL: silent timeline START/JOIN COLLAB (remove success alert) |
| 17 | 2026-07-20 | 713 | `AKfycbxy…` | Fix auto-close no_project — resolve prep projectId after station leave |
| 18 | 2026-07-20 | 712 | `AKfycbxy…` | Commit fail-safe B follow-up — timeline restore/flush + no mid-flight commit retry |
| 19 | 2026-07-20 | 711 | `AKfycbxy…` | Commit fail-safe B — backup before Sheets wipe, refuse empty, restore on fail |
| 20 | 2026-07-20 | 710 | `AKfycbxy…` | B4 last-leave — fresh presence before commit (stale roster left forks open) |
| 21 | 2026-07-20 | 709 | `AKfycbxy…` | QoL fix: PA WORKING select white frame with !important (beats theme-light select rules) |
| 22 | 2026-07-20 | 708 | `AKfycbxy…` | B2 UX — no immediate take-over on healthy Opening race (hang only) |
| 23 | 2026-07-20 | 707 | `AKfycbxy…` | QoL: PA WORKING dept dropdown frame back to white (not dept color) |
| 24 | 2026-07-20 | 706 | `AKfycbxy…` | QoL: remove committed-to-Sheets success alerts on END PREP / END COLLAB |
| 25 | 2026-07-20 | 705 | `AKfycbxy…` | B4 fix — last-leave on mobile/station leave (not only desktop CANCEL) |
| 26 | 2026-07-20 | 704 | `AKfycbxy…` | QoL fix: calendar fork dots — clear on close + real 15s poll repaint (no stale rawDbData fallback) |
| 27 | 2026-07-20 | 703 | `AKfycbxy…` | Part B4 close/idle eject — 45m TL / 75m prep idle + T-5 keep-open + last-leave commit + 45s presence |
| 28 | 2026-07-20 | 702 | `AKfycbxy…` | QoL fix: timeline selected strip light-gray frame wins over border !important (glow was only cue) |
| 29 | 2026-07-20 | 701 | `AKfycbxy…` | QoL: timeline selected strips — light gray frame instead of white glow |
| 30 | 2026-07-20 | 700 | `AKfycbxy…` | Part B5 cue redesign — Normal/Opening/Live/Closing SYNC phases + frozen/joining; idle stub for B4 |
| 31 | 2026-07-20 | 699 | `AKfycbxy…` | QoL: phone/station bottom SYNC bar — orange PA / blue timeline when Firebase fork live |
| 32 | 2026-07-20 | 698 | `AKfycbxy…` | QoL: main calendar stacked fork dots — orange PA / blue timeline after event name |
| 33 | 2026-07-20 | 697 | `AKfycbxy…` | Part B3 live pull-in — soft-switch joining cue + phone auto-join; no calendar yank |
| 34 | 2026-07-20 | 696 | `AKfycbxy…` | QoL: project editor Assets/Timeline chrome — gray idle; orange/blue when Firebase fork; timeline always clickable |
| 35 | 2026-07-20 | 695 | `AKfycbxy…` | Part B2 Opening warm-up — starter-only + peer freeze + hang Retry/Cancel/take-over + entry delta |
| 36 | 2026-07-20 | 694 | `AKfycbxy…` | Part B1 who-may-start — surface auto-start matrix + freelancer live-fork exclude (station host flags) |
| 37 | 2026-07-20 | 693 | `AKfycbxy…` | AUTO-FORK TRY BASELINE — revert here if floor dislikes |
| 38 | 2026-07-20 | 692 | `AKfycbxy…` | ERROR LOGS ticket list: thin person/view/platform rows, scrollable inbox, Explorer multi-select + SELECT ALL |
| 39 | 2026-07-20 | 691 | `AKfycbxy…` | Phase 3 error reports — ERROR LOGS tab + Hand over to Cursor (copy pack then delete inbox) |
| 40 | 2026-07-20 | 690 | `AKfycbxy…` | Error-report drawer — text-box frame/color, top-anchored, stable hover hit area |
| 41 | 2026-07-20 | 689 | `AKfycbxy…` | Error-report drawer — single clipped silhouette, no overlapping lip figure |
| 42 | 2026-07-20 | 688 | `AKfycbxy…` | Error-report lip — half peek, mild filleted trapezoid with frame |
| 43 | 2026-07-20 | 687 | `AKfycbxy…` | Error-report trapezoid pull-tab — muted peek 2/3 height, unified drawer shape |
| 44 | 2026-07-20 | 686 | `AKfycbxy…` | Repo mix default: auto-split ~2MiB parts for project knowledge upload |
| 45 | 2026-07-20 | 685 | `AKfycbxy…` | Error-report drawer polish — lower short lip under bookmarks, slide-down open |
| 46 | 2026-07-20 | 684 | `AKfycbxy…` | Phase 2 error-report lip restore — ensure 00f + Escape on GAS after Drive sync wipe |
| 47 | 2026-07-20 | 683 | `AKfycbxy…` | Repo mix refresh runs in background after GAS ship (no wait) |
| 48 | 2026-07-20 | 682 | `AKfycbxy…` | Phase 2 error reports — top lip drawer (hover/tap) + freeze diag + submitErrorReport everywhere |
| 49 | 2026-07-20 | 681 | `AKfycbxy…` | Phase 1 error reports — Error_Reports tab + submitErrorReport writer (Audit_Logs untouched) |
| 50 | 2026-07-20 | 680 | `AKfycbxy…` | Auto-refresh curated claude-pack/repomix-output.md after every GAS milestone |

---

**Rollback production:** Tell the AI *"Rollback production to last milestone"*.
