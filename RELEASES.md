# Production Milestones (Apps Script versions)

Created only on **Milestone** / **OK ship** / **Milestone now** — not on every "This works".

| # | Date | GAS version | Deployment | Note |
|---|------|-------------|------------|------|
| 1 | 2026-08-13 | 792 | `AKfycbxy…` | Hub open: show modal immediately; hydrate PA in background (no GAS wait) |
| 2 | 2026-08-13 | 791 | `AKfycbxy…` | Hub open: stop waiting on ensure/reload when PA already in memory (~10s fix) |
| 3 | 2026-08-13 | 790 | `AKfycbxy…` | Warm Live L4: Hub open from live memory; fixture flush live; GENERATE one accepted warm server op |
| 4 | 2026-08-13 | 789 | `AKfycbxy…` | Fix warm identity false COLLISION: sync meta stamp on room join + one stamp-adopt retry |
| 5 | 2026-08-12 | 788 | `AKfycbxy…` | Warm Live L3: hide Start Prep/Collab while warm; auto-attach on PA/Timeline enter |
| 6 | 2026-08-12 | 787 | `AKfycbxy…` | Warm Live L2: identity autosave browser↔Firebase meta/state while warm |
| 7 | 2026-08-12 | 786 | `AKfycbxy…` | QoL: calendar multi-row event strips share hover transparency |
| 8 | 2026-08-11 | 785 | `AKfycbxy…` | Warm Live L0: fix false PA commit-fail reconcile (qty/scan/location normalize + SHORT AUTO); archive warm-readers W6 |
| 9 | 2026-08-11 | 784 | `AKfycbxy…` | Identity autosave: patch calendar cache so reopen shows Saved edits |
| 10 | 2026-08-11 | 783 | `AKfycbxy…` | Identity autosave: restore cue, unstick drag flag, gather/quiet hygiene |
| 11 | 2026-08-11 | 782 | `AKfycbxy…` | Quiet nav flush for PA/Timeline/Logistics; readiness no longer poisons identity stamp |
| 12 | 2026-08-11 | 781 | `AKfycbxy…` | Cancel leave-save: queue behind in-flight, quiet collision (no refresh alert) |
| 13 | 2026-08-11 | 780 | `AKfycbxy…` | Fix: Cancel after mini-cal edit — no false unsaved warn; identity autosave for all saved projects |
| 14 | 2026-08-11 | 779 | `AKfycbxy…` | Save chrome: show Save only for NEW; hide autosave cue; gate deeper entry until first Save |
| 15 | 2026-08-11 | 778 | `AKfycbxy…` | W5 Warm editor autosave: identity + mini-cal + Offer/readiness; Save only for NEW/cold |
| 16 | 2026-08-11 | 777 | `AKfycbxy…` | Currency: display prices as EUR (€) not USD ($) — Offer + asset columns |
| 17 | 2026-08-11 | 776 | `AKfycbxy…` | W4 Offer: Pull Timeline + logistics + Undo (labor + transport snapshot) |
| 18 | 2026-08-11 | 775 | `AKfycbxy…` | W3 Offer: Pull Project Assets + Undo (warm Firebase / cold Sheets snapshot) |
| 19 | 2026-08-11 | 774 | `AKfycbxy…` | Fix: PA live edits survive refresh (urgent unload flush + state hydrate) |
| 20 | 2026-08-11 | 773 | `AKfycbxy…` | W2 fix: Tracker warm PA from assets/state + paginated Firestore list |
| 21 | 2026-08-10 | 772 | `AKfycbxy…` | W2 Tracker/Conflicts warm one-shot Firebase overlay (cap 25, fail-open) |
| 22 | 2026-08-10 | 771 | `AKfycbxy…` | Fix: checkpoint cue shows publishing… and keeps new time after publish |
| 23 | 2026-08-10 | 770 | `AKfycbxy…` | QoL: checkpoint cue one-click; label is time + publish |
| 24 | 2026-08-10 | 769 | `AKfycbxy…` | QoL: Last published cue as larger outlined clickable rectangle |
| 25 | 2026-08-10 | 768 | `AKfycbxy…` | Fix: checkpoint/Save must preserve Index Campaign Room columns (no wipe); refresh editor version after publish |
| 26 | 2026-08-05 | 767 | `AKfycbxy…` | R5: 48h campaign idle close (DAL_CAMPAIGN_IDLE_MS_); activity touch on writes/dock; hourly sweep; station warm-on-entry |
| 27 | 2026-08-04 | 766 | `AKfycbxy…` | Fix sticky PA Saving/Opening freeze when switching warm projects (clear on leave + soft-leave before detach) |
| 28 | 2026-08-04 | 765 | `AKfycbxy…` | R4b: detach PA/TL Firebase listeners on leave-project; room may stay warm with zero listeners |
| 29 | 2026-08-04 | 764 | `AKfycbxy…` | R4 keep-live 30m campaign checkpoint (meta→PA→timeline→ledger→ops); dirty gate + Last published cue |
| 30 | 2026-08-04 | 763 | `AKfycbxy…` | R3d: warm RFID ops slice on Firebase; END ROOM / finalize publish to Sheets |
| 31 | 2026-08-04 | 762 | `AKfycbxy…` | PA enter: refuse thin assets/state wipe flash over full list |
| 32 | 2026-08-04 | 761 | `AKfycbxy…` | R3c: elevate project identity + sub-events to Firebase meta; warm Save & Sync; END ROOM publish |
| 33 | 2026-08-04 | 760 | `AKfycbxy…` | Timeline: preserve Hub AUTO on reopen; warm-seed before load; skip truck rest false positives |
| 34 | 2026-08-04 | 759 | `AKfycbxy…` | Hub GENERATE: faster warm path; install load/unload shifts not roster-only |
| 35 | 2026-08-04 | 758 | `AKfycbxy…` | Hotfix PA wipe: heal thin assets/state from collection; refuse thin gas mirrors |
| 36 | 2026-08-04 | 757 | `AKfycbxy…` | Hub smoke: Auto Arrange includes autos; warm Timeline join; GENERATE returns timeline |
| 37 | 2026-08-04 | 756 | `AKfycbxy…` | R3e Hub batch: warm PA delta flush without per-row GET; GENERATE/pack share path |
| 38 | 2026-08-04 | 755 | `AKfycbxy…` | R3e Arrange batch: logistics-first placement save + skip hydrate when spatial present |
| 39 | 2026-08-03 | 754 | `AKfycbxy…` | R3b.5 Arrange: ledger legs for unmatched auto paUids + upsert auto PA; merge autos on save |
| 40 | 2026-08-03 | 753 | `AKfycbxy…` | Hotfix Arrange: recognize isAuto cases like packing; do not wipe local cases on empty hydrate |
| 41 | 2026-08-03 | 752 | `AKfycbxy…` | Hotfix arrange reopen: packing explode stripped paUids; collapse+replace hydrate; save returns current |
| 42 | 2026-08-03 | 751 | `AKfycbxy…` | Hotfix warm arrange: stamp truck fields onto live PA fixtures so reopen does not dump staging |
| 43 | 2026-07-31 | 750 | `AKfycbxy…` | Arrangement integrity: ledger pa_uid overlay key, warm empty Sheets fallback, truck open skip forceSync |
| 44 | 2026-07-31 | 749 | `AKfycbxy…` | Hotfix R3b Hub — finish/takeOver stuck prep opening; surface Hub arrange save errors |
| 45 | 2026-07-31 | 748 | `AKfycbxy…` | Themes — recessed/weekend/dept surface tokens (tracker Sat/Sun, roster strips, timeline grid, CREW FINISHED, mini-cal) |
| 46 | 2026-07-31 | 747 | `AKfycbxy…` | QoL: calendar strips — room green only, drop PA/timeline dots + glow |
| 47 | 2026-07-31 | 746 | `AKfycbxy…` | Theme tokens for buttons/titles + Visual Host click-to-edit button groups |
| 48 | 2026-07-25 | 745 | `AKfycbxy…` | Campaign Room R3b — warm Logistics Hub (pack/arrange/generate → Firebase under room; cold fallback) |
| 49 | 2026-07-24 | 744 | `AKfycbxy…` | Campaign Room R3: logistics/state warm arrange; End Room commits ledger; Sheets lag until publish |
| 50 | 2026-07-24 | 743 | `AKfycbxy…` | QoL: END ROOM on project editor; hide module End while campaign room warm |

---

**Rollback production:** Tell the AI *"Rollback production to last milestone"*.
