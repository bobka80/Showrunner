# Production Milestones (Apps Script versions)

Created only on **Milestone** / **OK ship** / **Milestone now** — not on every "This works".

| # | Date | GAS version | Deployment | Note |
|---|------|-------------|------------|------|
| 1 | 2026-07-17 | 627 | `AKfycbxy…` | Prep PA live sync via host collection listen (LISTEN_COL) + host _meta; 4s stale-host fallback to GAS poll |
| 2 | 2026-07-17 | 626 | `AKfycbxy…` | UX — calendar refresh quiet when already painted (no opacity sing on return from project/timeline) |
| 3 | 2026-07-17 | 625 | `AKfycbxy…` | Fix — desktop lock preserves working screen (do not closeModals / kick to calendar) |
| 4 | 2026-07-17 | 624 | `AKfycbxy…` | Hotfix — timeline stutter v2: entity hold + writeSeq; stop stale snap yank; fragile-zone DAL fork docs |
| 5 | 2026-07-17 | 623 | `AKfycbxy…` | Hotfix — stop timeline collab A/B stutter loop (no flush-on-remote; touch-only writes; dedupe snaps) |
| 6 | 2026-07-17 | 622 | `AKfycbxy…` | Hotfix — guard PA meta watcher when host-only Firestore client (no in-iframe db) |
| 7 | 2026-07-17 | 621 | `AKfycbxy…` | Hotfix — DAL FS deep frames walk so host Auth replies reach nested Index; banner shows fail reason |
| 8 | 2026-07-17 | 620 | `AKfycbxy…` | Hotfix — DAL FS host replies via ev.source (Auth result reaches nested Index; stop server-patch timeout) |
| 9 | 2026-07-16 | 619 | `AKfycbxy…` | Hotfix — DAL live sync bridge: post to window.top + nest relay so host Auth replies reach GAS iframe (stop falling to server patch) |
| 10 | 2026-07-16 | 618 | `AKfycbxy…` | Hotfix — timeline live sync via host shell Firebase (patch on web.app, not server patch); Auth/listen/write bridged from host-boot |
| 11 | 2026-07-16 | 617 | `AKfycbxy…` | Hotfix — timeline collab patch merge: only touched shifts overwrite remote (fixes stale crew wipe); faster flush; light redraw; server upsert on GAS fork save |
| 12 | 2026-07-16 | 616 | `AKfycbxy…` | Hotfix — timeline collab bulletproof: 3-way merge + Firestore transactions so concurrent edits cannot wipe each other; unique shift ids; merge-on-apply while dirty |
| 13 | 2026-07-16 | 615 | `AKfycbxy…` | Hotfix — timeline collab thrash: full-state fork writes (not checkbox-filtered), skip/stash apply during drag, stronger echo/LWW |
| 14 | 2026-07-16 | 614 | `AKfycbxy…` | Direct client Firestore writes for live PA/timeline forks — skip GAS per-edit; rules allow showrunner token writes |
| 15 | 2026-07-16 | 613 | `AKfycbxy…` | Hotfix PA live collab — flush Firebase from renderProjectAssetsUI so add/remove sync without SAVE |
| 16 | 2026-07-16 | 612 | `AKfycbxy…` | True live collab — PA flush-on-edit during prep + timeline drag-end flush to Firebase; remotes apply via listeners |
| 17 | 2026-07-16 | 611 | `AKfycbxy…` | Logistics Hub atomic path + Phase 5C — ledger journal to Sheets verify (checkout start/batch/finalize); selective cache invalidate; ledger failed_writes retry |
| 18 | 2026-07-16 | 610 | `AKfycbxy…` | Phase 6B — CacheCoordinator migrate calendar/vault/tracker/fleet/clients/warehouse; re-enable getSheetData + tag-aware CacheService purge; fix getCacheVersion V2 |
| 19 | 2026-07-16 | 609 | `AKfycbxy…` | Phase 6A: CacheCoordinator + domain-scoped PA/timeline cache invalidation |
| 20 | 2026-07-16 | 608 | `AKfycbxy…` | Phase 5B: failed_writes retry sweep with backoff, 7-day purge, manager alert on retry fail |
| 21 | 2026-07-16 | 607 | `AKfycbxy…` | Phase 5A: post-commit reconcile + failed_writes pocket (prep and timeline) with manager alert |
| 22 | 2026-07-16 | 606 | `AKfycbxy…` | Prep sync: poll for remote START and END; grace so Sheets lag cannot wipe a fresh open |
| 23 | 2026-07-16 | 605 | `AKfycbxy…` | Prep close sync: poll Sheets so END PREP clears remote latch when Firestore meta misses |
| 24 | 2026-07-16 | 604 | `AKfycbxy…` | Slice D hotfix: dual-domain session UI reads timelineStatus/prepStatus when both forks open |
| 25 | 2026-07-16 | 603 | `AKfycbxy…` | Phase 4 Slice D: dual-domain sessions — prep and timeline collab concurrent |
| 26 | 2026-07-16 | 602 | `AKfycbxy…` | Pre-ship pipeline: hard-fail on scratch/_tmp debug scripts; shared gas-ship-exclude rules |
| 27 | 2026-07-16 | 601 | `AKfycbxy…` | Build pipeline fix: exclude _tmp debug scripts and purge stale temp files from dist / Apps Script |
| 28 | 2026-07-16 | 600 | `AKfycbxy…` | Timeline collab live sync (confirm payload) — session/state sync + SAVE stays in room |
| 29 | 2026-07-16 | 599 | `AKfycbxy…` | Timeline collab live sync — session + state for both users in timeline; SAVE stays in room during collab |
| 30 | 2026-07-15 | 598 | `AKfycbxy…` | Clearer error when prep blocks timeline collab; do not retry session-already-open as Lockout |
| 31 | 2026-07-15 | 597 | `AKfycbxy…` | HOTFIX: show END COLLAB while timeline session is stuck opening (abort path) |
| 32 | 2026-07-15 | 596 | `AKfycbxy…` | HOTFIX: timeline collab open reliability — begin/finish split, join if open, reclaim stale opening, faster Firestore upsert |
| 33 | 2026-07-15 | 595 | `AKfycbxy…` | Remove timeline single-editor door lock — both users can enter; button shows who is inside |
| 34 | 2026-07-15 | 594 | `AKfycbxy…` | HOTFIX: timeline START COLLAB — release ScriptLock during Firestore so presence door unlocks; cancel leave + timeout re-check |
| 35 | 2026-07-15 | 593 | `AKfycbxy…` | DAL Phase 4 Slice C: Timeline collab session Phase A (Firestore fork + START/END COLLAB) |
| 36 | 2026-07-15 | 592 | `AKfycbxy…` | Hotfix: prep latch + GAS poll live sync for Apps Script iframe |
| 37 | 2026-07-15 | 591 | `AKfycbxy…` | Hotfix: Firebase custom-token claims nesting so client Firestore listeners can auth |
| 38 | 2026-07-15 | 590 | `AKfycbxy…` | Hotfix: stop prep banner toggle race; meta owns live sync |
| 39 | 2026-07-15 | 589 | `AKfycbxy…` | DAL: prep session meta watcher + live PA sync fixes |
| 40 | 2026-07-15 | 588 | `AKfycbxy…` | DAL Phase 4 Slice C: client Firestore PA listeners during prep |
| 41 | 2026-07-15 | 587 | `AKfycbxy…` | Hotfix: Firestore collection path trailing slash for START PREP |
| 42 | 2026-07-15 | 586 | `AKfycbxy…` | Hotfix: fail-fast Firestore config errors, clearer START PREP alert |
| 43 | 2026-07-15 | 585 | `AKfycbxy…` | PA: START PREP in equipment modal, L.O. access, title is project name only |
| 44 | 2026-07-15 | 584 | `AKfycbxy…` | Hotfix: show START PREP button for managers on saved projects |
| 45 | 2026-07-15 | 583 | `AKfycbxy…` | DAL Phase 4 Slice B: prep session open/close + PA Firestore fork (GAS REST) |
| 46 | 2026-07-15 | 582 | `AKfycbxy…` | DAL Phase 4 Slice A: session registry + FirebaseAdapter skeleton (Sheets-only, zero behavior change) |
| 47 | 2026-07-15 | 581 | `AKfycbxy…` | DAL Phase 3: delta-only saves on PA, timeline, ledger (scoped row writes; PA concurrency verified) |
| 48 | 2026-07-15 | 580 | `AKfycbxy…` | DAL Phase 2: projectDataRouter + inventory tables (Sheets-only, zero behavior change) |
| 49 | 2026-07-15 | 579 | `AKfycbxy…` | DAL Phase 1 Slice B: public GAS APIs delegate through repos (zero behavior change) |
| 50 | 2026-07-15 | 578 | `AKfycbxy…` | Hotfix: Dal_Repos.js syntax error (block comment) broke GAS project + PA save |

---

**Rollback production:** Tell the AI *"Rollback production to last milestone"*.
