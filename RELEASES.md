# Production Milestones (Apps Script versions)

Created only on **Milestone** / **OK ship** / **Milestone now** — not on every "This works".

| # | Date | GAS version | Deployment | Note |
|---|------|-------------|------------|------|
| 1 | 2026-07-20 | 680 | `AKfycbxy…` | Auto-refresh curated claude-pack/repomix-output.md after every GAS milestone |
| 2 | 2026-07-19 | 679 | `AKfycbxy…` | Part A industrial harden complete — try baseline for auto fork |
| 3 | 2026-07-19 | 678 | `AKfycbxy…` | Conflict UX: sync hover ops only; working dept white frame + dept-colored select |
| 4 | 2026-07-19 | 677 | `AKfycbxy…` | H2 fix: patch qty on +/- control too (peer one-step-behind) |
| 5 | 2026-07-19 | 676 | `AKfycbxy…` | A6/H2 cheaper remote apply: PA qty patch + timeline shift patch; Case V |
| 6 | 2026-07-19 | 675 | `AKfycbxy…` | Conflict toast: center mid-screen + item names on toast and roster note |
| 7 | 2026-07-19 | 674 | `AKfycbxy…` | Conflict UX: toast +2s; roster note same row as name |
| 8 | 2026-07-19 | 673 | `AKfycbxy…` | Conflict UX: one toast + sticky note on peer line in live-sync roster |
| 9 | 2026-07-19 | 672 | `AKfycbxy…` | Conflict toast: in-modal banner + host toast; any known peer delete |
| 10 | 2026-07-19 | 671 | `AKfycbxy…` | Twin General DEL: dept-scoped formula group delete; cut-to-dept unique loc |
| 11 | 2026-07-19 | 670 | `AKfycbxy…` | H3 toast visible: peer-delete after dept move (push toast + SYNC strip) |
| 12 | 2026-07-19 | 669 | `AKfycbxy…` | H3 toast: peer delete after dept-set move (ignore hold; 45s recent-edit) |
| 13 | 2026-07-19 | 668 | `AKfycbxy…` | Peer delete wins over concurrent dept-move hold/flush (Case U) |
| 14 | 2026-07-19 | 667 | `AKfycbxy…` | H3 follow-up: toast when peer deletes watched PA/timeline rows |
| 15 | 2026-07-19 | 666 | `AKfycbxy…` | H3 A5: same-row conflict toast PA+timeline (non-qty LWW loss; Case T) |
| 16 | 2026-07-19 | 665 | `AKfycbxy…` | H4 A4: state size WARN/MAX + END PREP mirror check (state SSOT) |
| 17 | 2026-07-19 | 664 | `AKfycbxy…` | Gap 1 A3: Firestore/GAS sync-mode lint in pre-ship (FRAGILE #10/#11) |
| 18 | 2026-07-19 | 663 | `AKfycbxy…` | Fix overrideDept refresh: prefer live fixtures over stale PA cache; normalize dept; schema mid-column insert |
| 19 | 2026-07-19 | 662 | `AKfycbxy…` | Fix PA render: restore missing toggleBtn in executeTogglePaMode |
| 20 | 2026-07-19 | 661 | `AKfycbxy…` | SYNC mini-headers: PA vault + timeline crew column; collapse/expand; black body |
| 21 | 2026-07-19 | 660 | `AKfycbxy…` | PA: hide empty depts; prep status → vault orange bottom panel with presence modes |
| 22 | 2026-07-19 | 659 | `AKfycbxy…` | Fix PA cut/copy item vs sublist scope, header-only select, paste dest, column sort |
| 23 | 2026-07-19 | 658 | `AKfycbxy…` | PA working dept + green paste target; override_dept Sheets/FS live sync |
| 24 | 2026-07-19 | 657 | `AKfycbxy…` | Fix PA Loading Assigned Gear freeze on live reopen; SUBRENT untick [SHORT]/isShortage normalize |
| 25 | 2026-07-19 | 656 | `AKfycbxy…` | Fix shortage peer apply (fixturesSig) + preserve hasArrow open/? three-state; host-boot v655 |
| 26 | 2026-07-19 | 655 | `AKfycbxy…` | H5 mutation inventory: PA notes + timeline twin gate; crew modal DONE/CANCEL flush; ALLOWLIST overrideDept |
| 27 | 2026-07-19 | 654 | `AKfycbxy…` | PA sync rework: batch absolute upsert SSOT; drop stale seq; mid-flight touch retain; originals from merged; noteTouch pack/CLI/bulk; Case P; host-boot v653 |
| 28 | 2026-07-19 | 653 | `AKfycbxy…` | PA qty deltas combine multi-window +/-; heal ticker; fix double-count baseline; host-boot v652 |
| 29 | 2026-07-19 | 652 | `AKfycbxy…` | Fix incomplete PA sync: apply txn-merged fixtures after own write; echo/FlushGuard no longer leave peer rows forgotten |
| 30 | 2026-07-19 | 651 | `AKfycbxy…` | Fix forgotten peer PA updates: never false-ack lastRemoteSig when hold keeps local; stamp fixture writeSeq; host-boot v649 |
| 31 | 2026-07-19 | 650 | `AKfycbxy…` | Pre-ship: include 02e*_Dal / 03a*_Timeline_Dal in DAL hot paths so live-sync gates always run |
| 32 | 2026-07-19 | 649 | `AKfycbxy…` | Fix missed peer PA updates: FlushGuard no longer drops peer snaps; requeue in-flight applies |
| 33 | 2026-07-19 | 648 | `AKfycbxy…` | H1 fail-closed weak sync: blocked mode + Case K mid-edit; timeline twin; no silent GAS multi-edit |
| 34 | 2026-07-19 | 647 | `AKfycbxy…` | H0 testing pipeline: PA Cases A-J + mutation inventory gate + incident attempts field |
| 35 | 2026-07-18 | 646 | `AKfycbxy…` | STABLE BASELINE v645 docs: prep multi-user live + session banner locked in FRAGILE (director-confirmed) |
| 36 | 2026-07-18 | 645 | `AKfycbxy…` | Prep banner: after END refuse same sessionUid reopen (stops ~1min on/off loop) |
| 37 | 2026-07-18 | 644 | `AKfycbxy…` | Prep false-END: require meta+Sheets agree before killing banner/live sync (stops mid-prep desync) |
| 38 | 2026-07-18 | 643 | `AKfycbxy…` | Prep banner oscillation: after END block Sheets-only reopen until new _meta (fromMeta) or local START |
| 39 | 2026-07-18 | 642 | `AKfycbxy…` | Prep START stay open: close _meta only after confirmed server open (not optimistic local START) |
| 40 | 2026-07-18 | 641 | `AKfycbxy…` | Prep END flicker: ignore _meta fromCache; block reopen during IgnoreOpenUntil (except local START) |
| 41 | 2026-07-18 | 640 | `AKfycbxy…` | Prep remote END: one _meta-missing snap closes peer; committing while latched allows poll close; 8s open grace |
| 42 | 2026-07-18 | 639 | `AKfycbxy…` | Prep PA live: note deletes on remove paths + seed-once after writeSeq; Cases E-G delete/resurrect regression |
| 43 | 2026-07-18 | 638 | `AKfycbxy…` | START PREP banner flip: ignore idle empty _meta; grace + dual-snap before meta-close |
| 44 | 2026-07-17 | 637 | `AKfycbxy…` | Remote END PREP: block Sheets poll re-latch after meta close (banner stutter / stuck prep) |
| 45 | 2026-07-17 | 636 | `AKfycbxy…` | PA open with fork already live: hydrate empty UI from getProjectAssets + seed assets/state |
| 46 | 2026-07-17 | 635 | `AKfycbxy…` | PA live: transactional assets/state patch (timeline parity — fixes equal-seq LWW race) |
| 47 | 2026-07-17 | 634 | `AKfycbxy…` | PA live sync: block GAS get apply during firestore; ignore unstamped seq; no GAS flush fallback; touch generic ± |
| 48 | 2026-07-17 | 633 | `AKfycbxy…` | Prep PA timeline-parity: explicit touch maps + writeSeq/clientId host stamp; regression test proves 5-4-5-4 war vs settle-at-4 |
| 49 | 2026-07-17 | 632 | `AKfycbxy…` | Prep PA root-cause fix: fixtures-only live patch (no auto UID storms), flush-guard vs stale snaps, gate render flush, block late getProjectAssets yank |
| 50 | 2026-07-17 | 631 | `AKfycbxy…` | Prep PA: break snap-render-flush loop — coalesce apply, ignore pendingWrites, skip apply while held, no flush-from-apply, remote autos |

---

**Rollback production:** Tell the AI *"Rollback production to last milestone"*.
