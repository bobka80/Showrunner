# Production Milestones (Apps Script versions)

Created only on **Milestone** / **OK ship** / **Milestone now** — not on every "This works".

| # | Date | GAS version | Deployment | Note |
|---|------|-------------|------------|------|
| 1 | 2026-08-11 | 783 | `AKfycbxy…` | Identity autosave: restore cue, unstick drag flag, gather/quiet hygiene |
| 2 | 2026-08-11 | 782 | `AKfycbxy…` | Quiet nav flush for PA/Timeline/Logistics; readiness no longer poisons identity stamp |
| 3 | 2026-08-11 | 781 | `AKfycbxy…` | Cancel leave-save: queue behind in-flight, quiet collision (no refresh alert) |
| 4 | 2026-08-11 | 780 | `AKfycbxy…` | Fix: Cancel after mini-cal edit — no false unsaved warn; identity autosave for all saved projects |
| 5 | 2026-08-11 | 779 | `AKfycbxy…` | Save chrome: show Save only for NEW; hide autosave cue; gate deeper entry until first Save |
| 6 | 2026-08-11 | 778 | `AKfycbxy…` | W5 Warm editor autosave: identity + mini-cal + Offer/readiness; Save only for NEW/cold |
| 7 | 2026-08-11 | 777 | `AKfycbxy…` | Currency: display prices as EUR (€) not USD ($) — Offer + asset columns |
| 8 | 2026-08-11 | 776 | `AKfycbxy…` | W4 Offer: Pull Timeline + logistics + Undo (labor + transport snapshot) |
| 9 | 2026-08-11 | 775 | `AKfycbxy…` | W3 Offer: Pull Project Assets + Undo (warm Firebase / cold Sheets snapshot) |
| 10 | 2026-08-11 | 774 | `AKfycbxy…` | Fix: PA live edits survive refresh (urgent unload flush + state hydrate) |
| 11 | 2026-08-11 | 773 | `AKfycbxy…` | W2 fix: Tracker warm PA from assets/state + paginated Firestore list |
| 12 | 2026-08-10 | 772 | `AKfycbxy…` | W2 Tracker/Conflicts warm one-shot Firebase overlay (cap 25, fail-open) |
| 13 | 2026-08-10 | 771 | `AKfycbxy…` | Fix: checkpoint cue shows publishing… and keeps new time after publish |
| 14 | 2026-08-10 | 770 | `AKfycbxy…` | QoL: checkpoint cue one-click; label is time + publish |
| 15 | 2026-08-10 | 769 | `AKfycbxy…` | QoL: Last published cue as larger outlined clickable rectangle |
| 16 | 2026-08-10 | 768 | `AKfycbxy…` | Fix: checkpoint/Save must preserve Index Campaign Room columns (no wipe); refresh editor version after publish |
| 17 | 2026-08-05 | 767 | `AKfycbxy…` | R5: 48h campaign idle close (DAL_CAMPAIGN_IDLE_MS_); activity touch on writes/dock; hourly sweep; station warm-on-entry |
| 18 | 2026-08-04 | 766 | `AKfycbxy…` | Fix sticky PA Saving/Opening freeze when switching warm projects (clear on leave + soft-leave before detach) |
| 19 | 2026-08-04 | 765 | `AKfycbxy…` | R4b: detach PA/TL Firebase listeners on leave-project; room may stay warm with zero listeners |
| 20 | 2026-08-04 | 764 | `AKfycbxy…` | R4 keep-live 30m campaign checkpoint (meta→PA→timeline→ledger→ops); dirty gate + Last published cue |
| 21 | 2026-08-04 | 763 | `AKfycbxy…` | R3d: warm RFID ops slice on Firebase; END ROOM / finalize publish to Sheets |
| 22 | 2026-08-04 | 762 | `AKfycbxy…` | PA enter: refuse thin assets/state wipe flash over full list |
| 23 | 2026-08-04 | 761 | `AKfycbxy…` | R3c: elevate project identity + sub-events to Firebase meta; warm Save & Sync; END ROOM publish |
| 24 | 2026-08-04 | 760 | `AKfycbxy…` | Timeline: preserve Hub AUTO on reopen; warm-seed before load; skip truck rest false positives |
| 25 | 2026-08-04 | 759 | `AKfycbxy…` | Hub GENERATE: faster warm path; install load/unload shifts not roster-only |
| 26 | 2026-08-04 | 758 | `AKfycbxy…` | Hotfix PA wipe: heal thin assets/state from collection; refuse thin gas mirrors |
| 27 | 2026-08-04 | 757 | `AKfycbxy…` | Hub smoke: Auto Arrange includes autos; warm Timeline join; GENERATE returns timeline |
| 28 | 2026-08-04 | 756 | `AKfycbxy…` | R3e Hub batch: warm PA delta flush without per-row GET; GENERATE/pack share path |
| 29 | 2026-08-04 | 755 | `AKfycbxy…` | R3e Arrange batch: logistics-first placement save + skip hydrate when spatial present |
| 30 | 2026-08-03 | 754 | `AKfycbxy…` | R3b.5 Arrange: ledger legs for unmatched auto paUids + upsert auto PA; merge autos on save |
| 31 | 2026-08-03 | 753 | `AKfycbxy…` | Hotfix Arrange: recognize isAuto cases like packing; do not wipe local cases on empty hydrate |
| 32 | 2026-08-03 | 752 | `AKfycbxy…` | Hotfix arrange reopen: packing explode stripped paUids; collapse+replace hydrate; save returns current |
| 33 | 2026-08-03 | 751 | `AKfycbxy…` | Hotfix warm arrange: stamp truck fields onto live PA fixtures so reopen does not dump staging |
| 34 | 2026-07-31 | 750 | `AKfycbxy…` | Arrangement integrity: ledger pa_uid overlay key, warm empty Sheets fallback, truck open skip forceSync |
| 35 | 2026-07-31 | 749 | `AKfycbxy…` | Hotfix R3b Hub — finish/takeOver stuck prep opening; surface Hub arrange save errors |
| 36 | 2026-07-31 | 748 | `AKfycbxy…` | Themes — recessed/weekend/dept surface tokens (tracker Sat/Sun, roster strips, timeline grid, CREW FINISHED, mini-cal) |
| 37 | 2026-07-31 | 747 | `AKfycbxy…` | QoL: calendar strips — room green only, drop PA/timeline dots + glow |
| 38 | 2026-07-31 | 746 | `AKfycbxy…` | Theme tokens for buttons/titles + Visual Host click-to-edit button groups |
| 39 | 2026-07-25 | 745 | `AKfycbxy…` | Campaign Room R3b — warm Logistics Hub (pack/arrange/generate → Firebase under room; cold fallback) |
| 40 | 2026-07-24 | 744 | `AKfycbxy…` | Campaign Room R3: logistics/state warm arrange; End Room commits ledger; Sheets lag until publish |
| 41 | 2026-07-24 | 743 | `AKfycbxy…` | QoL: END ROOM on project editor; hide module End while campaign room warm |
| 42 | 2026-07-24 | 742 | `AKfycbxy…` | Campaign Room R2: share roomUid on slice meta; soft-leave idle/orphan when warm; closeDalCampaignRoom End closes both domains |
| 43 | 2026-07-24 | 741 | `AKfycbxy…` | Campaign Room R1: Index Dal_Campaign_* registry, openOrJoinDalCampaignRoom from project editor, Firebase meta/state, calendar green room dot + editor chrome |
| 44 | 2026-07-24 | 740 | `AKfycbxy…` | QoL: Project Assets opens immediately — orphan gate after paint, soft-join still gated |
| 45 | 2026-07-24 | 739 | `AKfycbxy…` | Exit Logistics Ledger: re-enable live forks (PA prep + timeline collab) |
| 46 | 2026-07-24 | 738 | `AKfycbxy…` | Visual Host theme playground — edit/bake dark, light, custom themes |
| 47 | 2026-07-24 | 737 | `AKfycbxy…` | M5: asset conflicts via ledger phase_ref free-at + fix unique single-project false badge |
| 48 | 2026-07-23 | 736 | `AKfycbxy…` | QoL: sidebar setup↔lock gap match tasks↔calendar (25px) |
| 49 | 2026-07-23 | 735 | `AKfycbxy…` | M4: ledger-only truck writers + strip 12 PA truck cols (Firebase/host sigs too) |
| 50 | 2026-07-23 | 734 | `AKfycbxy…` | M3: ledger-prefer truck readers (PA fallback; empty ledger truck does not wipe PA) |

---

**Rollback production:** Tell the AI *"Rollback production to last milestone"*.
