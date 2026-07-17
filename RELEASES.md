# Production Milestones (Apps Script versions)

Created only on **Milestone** / **OK ship** / **Milestone now** — not on every "This works".

| # | Date | GAS version | Deployment | Note |
|---|------|-------------|------------|------|
| 1 | 2026-07-17 | 637 | `AKfycbxy…` | Remote END PREP: block Sheets poll re-latch after meta close (banner stutter / stuck prep) |
| 2 | 2026-07-17 | 636 | `AKfycbxy…` | PA open with fork already live: hydrate empty UI from getProjectAssets + seed assets/state |
| 3 | 2026-07-17 | 635 | `AKfycbxy…` | PA live: transactional assets/state patch (timeline parity — fixes equal-seq LWW race) |
| 4 | 2026-07-17 | 634 | `AKfycbxy…` | PA live sync: block GAS get apply during firestore; ignore unstamped seq; no GAS flush fallback; touch generic ± |
| 5 | 2026-07-17 | 633 | `AKfycbxy…` | Prep PA timeline-parity: explicit touch maps + writeSeq/clientId host stamp; regression test proves 5-4-5-4 war vs settle-at-4 |
| 6 | 2026-07-17 | 632 | `AKfycbxy…` | Prep PA root-cause fix: fixtures-only live patch (no auto UID storms), flush-guard vs stale snaps, gate render flush, block late getProjectAssets yank |
| 7 | 2026-07-17 | 631 | `AKfycbxy…` | Prep PA: break snap-render-flush loop — coalesce apply, ignore pendingWrites, skip apply while held, no flush-from-apply, remote autos |
| 8 | 2026-07-17 | 630 | `AKfycbxy…` | Prep PA: stop minus thrash — do not resurrect deleted UIDs from lagging/fromCache snaps; hold+recentlyDeleted before flush |
| 9 | 2026-07-17 | 629 | `AKfycbxy…` | Prep PA live sync: patch-only Firestore writes + per-UID merge + entity hold (same class as timeline LWW fix) |
| 10 | 2026-07-17 | 628 | `AKfycbxy…` | Fix prep PA host batch write (LISTEN worked but writes had no client.db); merge remote-only rows; quiet banner |
| 11 | 2026-07-17 | 627 | `AKfycbxy…` | Prep PA live sync via host collection listen (LISTEN_COL) + host _meta; 4s stale-host fallback to GAS poll |
| 12 | 2026-07-17 | 626 | `AKfycbxy…` | UX — calendar refresh quiet when already painted (no opacity sing on return from project/timeline) |
| 13 | 2026-07-17 | 625 | `AKfycbxy…` | Fix — desktop lock preserves working screen (do not closeModals / kick to calendar) |
| 14 | 2026-07-17 | 624 | `AKfycbxy…` | Hotfix — timeline stutter v2: entity hold + writeSeq; stop stale snap yank; fragile-zone DAL fork docs |
| 15 | 2026-07-17 | 623 | `AKfycbxy…` | Hotfix — stop timeline collab A/B stutter loop (no flush-on-remote; touch-only writes; dedupe snaps) |
| 16 | 2026-07-17 | 622 | `AKfycbxy…` | Hotfix — guard PA meta watcher when host-only Firestore client (no in-iframe db) |
| 17 | 2026-07-17 | 621 | `AKfycbxy…` | Hotfix — DAL FS deep frames walk so host Auth replies reach nested Index; banner shows fail reason |
| 18 | 2026-07-17 | 620 | `AKfycbxy…` | Hotfix — DAL FS host replies via ev.source (Auth result reaches nested Index; stop server-patch timeout) |
| 19 | 2026-07-16 | 619 | `AKfycbxy…` | Hotfix — DAL live sync bridge: post to window.top + nest relay so host Auth replies reach GAS iframe (stop falling to server patch) |
| 20 | 2026-07-16 | 618 | `AKfycbxy…` | Hotfix — timeline live sync via host shell Firebase (patch on web.app, not server patch); Auth/listen/write bridged from host-boot |
| 21 | 2026-07-16 | 617 | `AKfycbxy…` | Hotfix — timeline collab patch merge: only touched shifts overwrite remote (fixes stale crew wipe); faster flush; light redraw; server upsert on GAS fork save |
| 22 | 2026-07-16 | 616 | `AKfycbxy…` | Hotfix — timeline collab bulletproof: 3-way merge + Firestore transactions so concurrent edits cannot wipe each other; unique shift ids; merge-on-apply while dirty |
| 23 | 2026-07-16 | 615 | `AKfycbxy…` | Hotfix — timeline collab thrash: full-state fork writes (not checkbox-filtered), skip/stash apply during drag, stronger echo/LWW |
| 24 | 2026-07-16 | 614 | `AKfycbxy…` | Direct client Firestore writes for live PA/timeline forks — skip GAS per-edit; rules allow showrunner token writes |
| 25 | 2026-07-16 | 613 | `AKfycbxy…` | Hotfix PA live collab — flush Firebase from renderProjectAssetsUI so add/remove sync without SAVE |
| 26 | 2026-07-16 | 612 | `AKfycbxy…` | True live collab — PA flush-on-edit during prep + timeline drag-end flush to Firebase; remotes apply via listeners |
| 27 | 2026-07-16 | 611 | `AKfycbxy…` | Logistics Hub atomic path + Phase 5C — ledger journal to Sheets verify (checkout start/batch/finalize); selective cache invalidate; ledger failed_writes retry |
| 28 | 2026-07-16 | 610 | `AKfycbxy…` | Phase 6B — CacheCoordinator migrate calendar/vault/tracker/fleet/clients/warehouse; re-enable getSheetData + tag-aware CacheService purge; fix getCacheVersion V2 |
| 29 | 2026-07-16 | 609 | `AKfycbxy…` | Phase 6A: CacheCoordinator + domain-scoped PA/timeline cache invalidation |
| 30 | 2026-07-16 | 608 | `AKfycbxy…` | Phase 5B: failed_writes retry sweep with backoff, 7-day purge, manager alert on retry fail |
| 31 | 2026-07-16 | 607 | `AKfycbxy…` | Phase 5A: post-commit reconcile + failed_writes pocket (prep and timeline) with manager alert |
| 32 | 2026-07-16 | 606 | `AKfycbxy…` | Prep sync: poll for remote START and END; grace so Sheets lag cannot wipe a fresh open |
| 33 | 2026-07-16 | 605 | `AKfycbxy…` | Prep close sync: poll Sheets so END PREP clears remote latch when Firestore meta misses |
| 34 | 2026-07-16 | 604 | `AKfycbxy…` | Slice D hotfix: dual-domain session UI reads timelineStatus/prepStatus when both forks open |
| 35 | 2026-07-16 | 603 | `AKfycbxy…` | Phase 4 Slice D: dual-domain sessions — prep and timeline collab concurrent |
| 36 | 2026-07-16 | 602 | `AKfycbxy…` | Pre-ship pipeline: hard-fail on scratch/_tmp debug scripts; shared gas-ship-exclude rules |
| 37 | 2026-07-16 | 601 | `AKfycbxy…` | Build pipeline fix: exclude _tmp debug scripts and purge stale temp files from dist / Apps Script |
| 38 | 2026-07-16 | 600 | `AKfycbxy…` | Timeline collab live sync (confirm payload) — session/state sync + SAVE stays in room |
| 39 | 2026-07-16 | 599 | `AKfycbxy…` | Timeline collab live sync — session + state for both users in timeline; SAVE stays in room during collab |
| 40 | 2026-07-15 | 598 | `AKfycbxy…` | Clearer error when prep blocks timeline collab; do not retry session-already-open as Lockout |
| 41 | 2026-07-15 | 597 | `AKfycbxy…` | HOTFIX: show END COLLAB while timeline session is stuck opening (abort path) |
| 42 | 2026-07-15 | 596 | `AKfycbxy…` | HOTFIX: timeline collab open reliability — begin/finish split, join if open, reclaim stale opening, faster Firestore upsert |
| 43 | 2026-07-15 | 595 | `AKfycbxy…` | Remove timeline single-editor door lock — both users can enter; button shows who is inside |
| 44 | 2026-07-15 | 594 | `AKfycbxy…` | HOTFIX: timeline START COLLAB — release ScriptLock during Firestore so presence door unlocks; cancel leave + timeout re-check |
| 45 | 2026-07-15 | 593 | `AKfycbxy…` | DAL Phase 4 Slice C: Timeline collab session Phase A (Firestore fork + START/END COLLAB) |
| 46 | 2026-07-15 | 592 | `AKfycbxy…` | Hotfix: prep latch + GAS poll live sync for Apps Script iframe |
| 47 | 2026-07-15 | 591 | `AKfycbxy…` | Hotfix: Firebase custom-token claims nesting so client Firestore listeners can auth |
| 48 | 2026-07-15 | 590 | `AKfycbxy…` | Hotfix: stop prep banner toggle race; meta owns live sync |
| 49 | 2026-07-15 | 589 | `AKfycbxy…` | DAL: prep session meta watcher + live PA sync fixes |
| 50 | 2026-07-15 | 588 | `AKfycbxy…` | DAL Phase 4 Slice C: client Firestore PA listeners during prep |

---

**Rollback production:** Tell the AI *"Rollback production to last milestone"*.
