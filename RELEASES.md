# Production Milestones (Apps Script versions)

Created only on **Milestone** / **OK ship** / **Milestone now** — not on every "This works".

| # | Date | GAS version | Deployment | Note |
|---|------|-------------|------------|------|
| 1 | 2026-07-20 | 705 | `AKfycbxy…` | B4 fix — last-leave on mobile/station leave (not only desktop CANCEL) |
| 2 | 2026-07-20 | 704 | `AKfycbxy…` | QoL fix: calendar fork dots — clear on close + real 15s poll repaint (no stale rawDbData fallback) |
| 3 | 2026-07-20 | 703 | `AKfycbxy…` | Part B4 close/idle eject — 45m TL / 75m prep idle + T-5 keep-open + last-leave commit + 45s presence |
| 4 | 2026-07-20 | 702 | `AKfycbxy…` | QoL fix: timeline selected strip light-gray frame wins over border !important (glow was only cue) |
| 5 | 2026-07-20 | 701 | `AKfycbxy…` | QoL: timeline selected strips — light gray frame instead of white glow |
| 6 | 2026-07-20 | 700 | `AKfycbxy…` | Part B5 cue redesign — Normal/Opening/Live/Closing SYNC phases + frozen/joining; idle stub for B4 |
| 7 | 2026-07-20 | 699 | `AKfycbxy…` | QoL: phone/station bottom SYNC bar — orange PA / blue timeline when Firebase fork live |
| 8 | 2026-07-20 | 698 | `AKfycbxy…` | QoL: main calendar stacked fork dots — orange PA / blue timeline after event name |
| 9 | 2026-07-20 | 697 | `AKfycbxy…` | Part B3 live pull-in — soft-switch joining cue + phone auto-join; no calendar yank |
| 10 | 2026-07-20 | 696 | `AKfycbxy…` | QoL: project editor Assets/Timeline chrome — gray idle; orange/blue when Firebase fork; timeline always clickable |
| 11 | 2026-07-20 | 695 | `AKfycbxy…` | Part B2 Opening warm-up — starter-only + peer freeze + hang Retry/Cancel/take-over + entry delta |
| 12 | 2026-07-20 | 694 | `AKfycbxy…` | Part B1 who-may-start — surface auto-start matrix + freelancer live-fork exclude (station host flags) |
| 13 | 2026-07-20 | 693 | `AKfycbxy…` | AUTO-FORK TRY BASELINE — revert here if floor dislikes |
| 14 | 2026-07-20 | 692 | `AKfycbxy…` | ERROR LOGS ticket list: thin person/view/platform rows, scrollable inbox, Explorer multi-select + SELECT ALL |
| 15 | 2026-07-20 | 691 | `AKfycbxy…` | Phase 3 error reports — ERROR LOGS tab + Hand over to Cursor (copy pack then delete inbox) |
| 16 | 2026-07-20 | 690 | `AKfycbxy…` | Error-report drawer — text-box frame/color, top-anchored, stable hover hit area |
| 17 | 2026-07-20 | 689 | `AKfycbxy…` | Error-report drawer — single clipped silhouette, no overlapping lip figure |
| 18 | 2026-07-20 | 688 | `AKfycbxy…` | Error-report lip — half peek, mild filleted trapezoid with frame |
| 19 | 2026-07-20 | 687 | `AKfycbxy…` | Error-report trapezoid pull-tab — muted peek 2/3 height, unified drawer shape |
| 20 | 2026-07-20 | 686 | `AKfycbxy…` | Repo mix default: auto-split ~2MiB parts for project knowledge upload |
| 21 | 2026-07-20 | 685 | `AKfycbxy…` | Error-report drawer polish — lower short lip under bookmarks, slide-down open |
| 22 | 2026-07-20 | 684 | `AKfycbxy…` | Phase 2 error-report lip restore — ensure 00f + Escape on GAS after Drive sync wipe |
| 23 | 2026-07-20 | 683 | `AKfycbxy…` | Repo mix refresh runs in background after GAS ship (no wait) |
| 24 | 2026-07-20 | 682 | `AKfycbxy…` | Phase 2 error reports — top lip drawer (hover/tap) + freeze diag + submitErrorReport everywhere |
| 25 | 2026-07-20 | 681 | `AKfycbxy…` | Phase 1 error reports — Error_Reports tab + submitErrorReport writer (Audit_Logs untouched) |
| 26 | 2026-07-20 | 680 | `AKfycbxy…` | Auto-refresh curated claude-pack/repomix-output.md after every GAS milestone |
| 27 | 2026-07-19 | 679 | `AKfycbxy…` | Part A industrial harden complete — try baseline for auto fork |
| 28 | 2026-07-19 | 678 | `AKfycbxy…` | Conflict UX: sync hover ops only; working dept white frame + dept-colored select |
| 29 | 2026-07-19 | 677 | `AKfycbxy…` | H2 fix: patch qty on +/- control too (peer one-step-behind) |
| 30 | 2026-07-19 | 676 | `AKfycbxy…` | A6/H2 cheaper remote apply: PA qty patch + timeline shift patch; Case V |
| 31 | 2026-07-19 | 675 | `AKfycbxy…` | Conflict toast: center mid-screen + item names on toast and roster note |
| 32 | 2026-07-19 | 674 | `AKfycbxy…` | Conflict UX: toast +2s; roster note same row as name |
| 33 | 2026-07-19 | 673 | `AKfycbxy…` | Conflict UX: one toast + sticky note on peer line in live-sync roster |
| 34 | 2026-07-19 | 672 | `AKfycbxy…` | Conflict toast: in-modal banner + host toast; any known peer delete |
| 35 | 2026-07-19 | 671 | `AKfycbxy…` | Twin General DEL: dept-scoped formula group delete; cut-to-dept unique loc |
| 36 | 2026-07-19 | 670 | `AKfycbxy…` | H3 toast visible: peer-delete after dept move (push toast + SYNC strip) |
| 37 | 2026-07-19 | 669 | `AKfycbxy…` | H3 toast: peer delete after dept-set move (ignore hold; 45s recent-edit) |
| 38 | 2026-07-19 | 668 | `AKfycbxy…` | Peer delete wins over concurrent dept-move hold/flush (Case U) |
| 39 | 2026-07-19 | 667 | `AKfycbxy…` | H3 follow-up: toast when peer deletes watched PA/timeline rows |
| 40 | 2026-07-19 | 666 | `AKfycbxy…` | H3 A5: same-row conflict toast PA+timeline (non-qty LWW loss; Case T) |
| 41 | 2026-07-19 | 665 | `AKfycbxy…` | H4 A4: state size WARN/MAX + END PREP mirror check (state SSOT) |
| 42 | 2026-07-19 | 664 | `AKfycbxy…` | Gap 1 A3: Firestore/GAS sync-mode lint in pre-ship (FRAGILE #10/#11) |
| 43 | 2026-07-19 | 663 | `AKfycbxy…` | Fix overrideDept refresh: prefer live fixtures over stale PA cache; normalize dept; schema mid-column insert |
| 44 | 2026-07-19 | 662 | `AKfycbxy…` | Fix PA render: restore missing toggleBtn in executeTogglePaMode |
| 45 | 2026-07-19 | 661 | `AKfycbxy…` | SYNC mini-headers: PA vault + timeline crew column; collapse/expand; black body |
| 46 | 2026-07-19 | 660 | `AKfycbxy…` | PA: hide empty depts; prep status → vault orange bottom panel with presence modes |
| 47 | 2026-07-19 | 659 | `AKfycbxy…` | Fix PA cut/copy item vs sublist scope, header-only select, paste dest, column sort |
| 48 | 2026-07-19 | 658 | `AKfycbxy…` | PA working dept + green paste target; override_dept Sheets/FS live sync |
| 49 | 2026-07-19 | 657 | `AKfycbxy…` | Fix PA Loading Assigned Gear freeze on live reopen; SUBRENT untick [SHORT]/isShortage normalize |
| 50 | 2026-07-19 | 656 | `AKfycbxy…` | Fix shortage peer apply (fixturesSig) + preserve hasArrow open/? three-state; host-boot v655 |

---

**Rollback production:** Tell the AI *"Rollback production to last milestone"*.
