# Production Milestones (Apps Script versions)

Created only on **Milestone** / **OK ship** / **Milestone now** — not on every "This works".

| # | Date | GAS version | Deployment | Note |
|---|------|-------------|------------|------|
| 1 | 2026-07-19 | 661 | `AKfycbxy…` | SYNC mini-headers: PA vault + timeline crew column; collapse/expand; black body |
| 2 | 2026-07-19 | 660 | `AKfycbxy…` | PA: hide empty depts; prep status → vault orange bottom panel with presence modes |
| 3 | 2026-07-19 | 659 | `AKfycbxy…` | Fix PA cut/copy item vs sublist scope, header-only select, paste dest, column sort |
| 4 | 2026-07-19 | 658 | `AKfycbxy…` | PA working dept + green paste target; override_dept Sheets/FS live sync |
| 5 | 2026-07-19 | 657 | `AKfycbxy…` | Fix PA Loading Assigned Gear freeze on live reopen; SUBRENT untick [SHORT]/isShortage normalize |
| 6 | 2026-07-19 | 656 | `AKfycbxy…` | Fix shortage peer apply (fixturesSig) + preserve hasArrow open/? three-state; host-boot v655 |
| 7 | 2026-07-19 | 655 | `AKfycbxy…` | H5 mutation inventory: PA notes + timeline twin gate; crew modal DONE/CANCEL flush; ALLOWLIST overrideDept |
| 8 | 2026-07-19 | 654 | `AKfycbxy…` | PA sync rework: batch absolute upsert SSOT; drop stale seq; mid-flight touch retain; originals from merged; noteTouch pack/CLI/bulk; Case P; host-boot v653 |
| 9 | 2026-07-19 | 653 | `AKfycbxy…` | PA qty deltas combine multi-window +/-; heal ticker; fix double-count baseline; host-boot v652 |
| 10 | 2026-07-19 | 652 | `AKfycbxy…` | Fix incomplete PA sync: apply txn-merged fixtures after own write; echo/FlushGuard no longer leave peer rows forgotten |
| 11 | 2026-07-19 | 651 | `AKfycbxy…` | Fix forgotten peer PA updates: never false-ack lastRemoteSig when hold keeps local; stamp fixture writeSeq; host-boot v649 |
| 12 | 2026-07-19 | 650 | `AKfycbxy…` | Pre-ship: include 02e*_Dal / 03a*_Timeline_Dal in DAL hot paths so live-sync gates always run |
| 13 | 2026-07-19 | 649 | `AKfycbxy…` | Fix missed peer PA updates: FlushGuard no longer drops peer snaps; requeue in-flight applies |
| 14 | 2026-07-19 | 648 | `AKfycbxy…` | H1 fail-closed weak sync: blocked mode + Case K mid-edit; timeline twin; no silent GAS multi-edit |
| 15 | 2026-07-19 | 647 | `AKfycbxy…` | H0 testing pipeline: PA Cases A-J + mutation inventory gate + incident attempts field |
| 16 | 2026-07-18 | 646 | `AKfycbxy…` | STABLE BASELINE v645 docs: prep multi-user live + session banner locked in FRAGILE (director-confirmed) |
| 17 | 2026-07-18 | 645 | `AKfycbxy…` | Prep banner: after END refuse same sessionUid reopen (stops ~1min on/off loop) |
| 18 | 2026-07-18 | 644 | `AKfycbxy…` | Prep false-END: require meta+Sheets agree before killing banner/live sync (stops mid-prep desync) |
| 19 | 2026-07-18 | 643 | `AKfycbxy…` | Prep banner oscillation: after END block Sheets-only reopen until new _meta (fromMeta) or local START |
| 20 | 2026-07-18 | 642 | `AKfycbxy…` | Prep START stay open: close _meta only after confirmed server open (not optimistic local START) |
| 21 | 2026-07-18 | 641 | `AKfycbxy…` | Prep END flicker: ignore _meta fromCache; block reopen during IgnoreOpenUntil (except local START) |
| 22 | 2026-07-18 | 640 | `AKfycbxy…` | Prep remote END: one _meta-missing snap closes peer; committing while latched allows poll close; 8s open grace |
| 23 | 2026-07-18 | 639 | `AKfycbxy…` | Prep PA live: note deletes on remove paths + seed-once after writeSeq; Cases E-G delete/resurrect regression |
| 24 | 2026-07-18 | 638 | `AKfycbxy…` | START PREP banner flip: ignore idle empty _meta; grace + dual-snap before meta-close |
| 25 | 2026-07-17 | 637 | `AKfycbxy…` | Remote END PREP: block Sheets poll re-latch after meta close (banner stutter / stuck prep) |
| 26 | 2026-07-17 | 636 | `AKfycbxy…` | PA open with fork already live: hydrate empty UI from getProjectAssets + seed assets/state |
| 27 | 2026-07-17 | 635 | `AKfycbxy…` | PA live: transactional assets/state patch (timeline parity — fixes equal-seq LWW race) |
| 28 | 2026-07-17 | 634 | `AKfycbxy…` | PA live sync: block GAS get apply during firestore; ignore unstamped seq; no GAS flush fallback; touch generic ± |
| 29 | 2026-07-17 | 633 | `AKfycbxy…` | Prep PA timeline-parity: explicit touch maps + writeSeq/clientId host stamp; regression test proves 5-4-5-4 war vs settle-at-4 |
| 30 | 2026-07-17 | 632 | `AKfycbxy…` | Prep PA root-cause fix: fixtures-only live patch (no auto UID storms), flush-guard vs stale snaps, gate render flush, block late getProjectAssets yank |
| 31 | 2026-07-17 | 631 | `AKfycbxy…` | Prep PA: break snap-render-flush loop — coalesce apply, ignore pendingWrites, skip apply while held, no flush-from-apply, remote autos |
| 32 | 2026-07-17 | 630 | `AKfycbxy…` | Prep PA: stop minus thrash — do not resurrect deleted UIDs from lagging/fromCache snaps; hold+recentlyDeleted before flush |
| 33 | 2026-07-17 | 629 | `AKfycbxy…` | Prep PA live sync: patch-only Firestore writes + per-UID merge + entity hold (same class as timeline LWW fix) |
| 34 | 2026-07-17 | 628 | `AKfycbxy…` | Fix prep PA host batch write (LISTEN worked but writes had no client.db); merge remote-only rows; quiet banner |
| 35 | 2026-07-17 | 627 | `AKfycbxy…` | Prep PA live sync via host collection listen (LISTEN_COL) + host _meta; 4s stale-host fallback to GAS poll |
| 36 | 2026-07-17 | 626 | `AKfycbxy…` | UX — calendar refresh quiet when already painted (no opacity sing on return from project/timeline) |
| 37 | 2026-07-17 | 625 | `AKfycbxy…` | Fix — desktop lock preserves working screen (do not closeModals / kick to calendar) |
| 38 | 2026-07-17 | 624 | `AKfycbxy…` | Hotfix — timeline stutter v2: entity hold + writeSeq; stop stale snap yank; fragile-zone DAL fork docs |
| 39 | 2026-07-17 | 623 | `AKfycbxy…` | Hotfix — stop timeline collab A/B stutter loop (no flush-on-remote; touch-only writes; dedupe snaps) |
| 40 | 2026-07-17 | 622 | `AKfycbxy…` | Hotfix — guard PA meta watcher when host-only Firestore client (no in-iframe db) |
| 41 | 2026-07-17 | 621 | `AKfycbxy…` | Hotfix — DAL FS deep frames walk so host Auth replies reach nested Index; banner shows fail reason |
| 42 | 2026-07-17 | 620 | `AKfycbxy…` | Hotfix — DAL FS host replies via ev.source (Auth result reaches nested Index; stop server-patch timeout) |
| 43 | 2026-07-16 | 619 | `AKfycbxy…` | Hotfix — DAL live sync bridge: post to window.top + nest relay so host Auth replies reach GAS iframe (stop falling to server patch) |
| 44 | 2026-07-16 | 618 | `AKfycbxy…` | Hotfix — timeline live sync via host shell Firebase (patch on web.app, not server patch); Auth/listen/write bridged from host-boot |
| 45 | 2026-07-16 | 617 | `AKfycbxy…` | Hotfix — timeline collab patch merge: only touched shifts overwrite remote (fixes stale crew wipe); faster flush; light redraw; server upsert on GAS fork save |
| 46 | 2026-07-16 | 616 | `AKfycbxy…` | Hotfix — timeline collab bulletproof: 3-way merge + Firestore transactions so concurrent edits cannot wipe each other; unique shift ids; merge-on-apply while dirty |
| 47 | 2026-07-16 | 615 | `AKfycbxy…` | Hotfix — timeline collab thrash: full-state fork writes (not checkbox-filtered), skip/stash apply during drag, stronger echo/LWW |
| 48 | 2026-07-16 | 614 | `AKfycbxy…` | Direct client Firestore writes for live PA/timeline forks — skip GAS per-edit; rules allow showrunner token writes |
| 49 | 2026-07-16 | 613 | `AKfycbxy…` | Hotfix PA live collab — flush Firebase from renderProjectAssetsUI so add/remove sync without SAVE |
| 50 | 2026-07-16 | 612 | `AKfycbxy…` | True live collab — PA flush-on-edit during prep + timeline drag-end flush to Firebase; remotes apply via listeners |

---

**Rollback production:** Tell the AI *"Rollback production to last milestone"*.
