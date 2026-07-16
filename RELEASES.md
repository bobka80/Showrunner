# Production Milestones (Apps Script versions)

Created only on **Milestone** / **OK ship** / **Milestone now** — not on every "This works".

| # | Date | GAS version | Deployment | Note |
|---|------|-------------|------------|------|
| 1 | 2026-07-16 | 613 | `AKfycbxy…` | Hotfix PA live collab — flush Firebase from renderProjectAssetsUI so add/remove sync without SAVE |
| 2 | 2026-07-16 | 612 | `AKfycbxy…` | True live collab — PA flush-on-edit during prep + timeline drag-end flush to Firebase; remotes apply via listeners |
| 3 | 2026-07-16 | 611 | `AKfycbxy…` | Logistics Hub atomic path + Phase 5C — ledger journal to Sheets verify (checkout start/batch/finalize); selective cache invalidate; ledger failed_writes retry |
| 4 | 2026-07-16 | 610 | `AKfycbxy…` | Phase 6B — CacheCoordinator migrate calendar/vault/tracker/fleet/clients/warehouse; re-enable getSheetData + tag-aware CacheService purge; fix getCacheVersion V2 |
| 5 | 2026-07-16 | 609 | `AKfycbxy…` | Phase 6A: CacheCoordinator + domain-scoped PA/timeline cache invalidation |
| 6 | 2026-07-16 | 608 | `AKfycbxy…` | Phase 5B: failed_writes retry sweep with backoff, 7-day purge, manager alert on retry fail |
| 7 | 2026-07-16 | 607 | `AKfycbxy…` | Phase 5A: post-commit reconcile + failed_writes pocket (prep and timeline) with manager alert |
| 8 | 2026-07-16 | 606 | `AKfycbxy…` | Prep sync: poll for remote START and END; grace so Sheets lag cannot wipe a fresh open |
| 9 | 2026-07-16 | 605 | `AKfycbxy…` | Prep close sync: poll Sheets so END PREP clears remote latch when Firestore meta misses |
| 10 | 2026-07-16 | 604 | `AKfycbxy…` | Slice D hotfix: dual-domain session UI reads timelineStatus/prepStatus when both forks open |
| 11 | 2026-07-16 | 603 | `AKfycbxy…` | Phase 4 Slice D: dual-domain sessions — prep and timeline collab concurrent |
| 12 | 2026-07-16 | 602 | `AKfycbxy…` | Pre-ship pipeline: hard-fail on scratch/_tmp debug scripts; shared gas-ship-exclude rules |
| 13 | 2026-07-16 | 601 | `AKfycbxy…` | Build pipeline fix: exclude _tmp debug scripts and purge stale temp files from dist / Apps Script |
| 14 | 2026-07-16 | 600 | `AKfycbxy…` | Timeline collab live sync (confirm payload) — session/state sync + SAVE stays in room |
| 15 | 2026-07-16 | 599 | `AKfycbxy…` | Timeline collab live sync — session + state for both users in timeline; SAVE stays in room during collab |
| 16 | 2026-07-15 | 598 | `AKfycbxy…` | Clearer error when prep blocks timeline collab; do not retry session-already-open as Lockout |
| 17 | 2026-07-15 | 597 | `AKfycbxy…` | HOTFIX: show END COLLAB while timeline session is stuck opening (abort path) |
| 18 | 2026-07-15 | 596 | `AKfycbxy…` | HOTFIX: timeline collab open reliability — begin/finish split, join if open, reclaim stale opening, faster Firestore upsert |
| 19 | 2026-07-15 | 595 | `AKfycbxy…` | Remove timeline single-editor door lock — both users can enter; button shows who is inside |
| 20 | 2026-07-15 | 594 | `AKfycbxy…` | HOTFIX: timeline START COLLAB — release ScriptLock during Firestore so presence door unlocks; cancel leave + timeout re-check |
| 21 | 2026-07-15 | 593 | `AKfycbxy…` | DAL Phase 4 Slice C: Timeline collab session Phase A (Firestore fork + START/END COLLAB) |
| 22 | 2026-07-15 | 592 | `AKfycbxy…` | Hotfix: prep latch + GAS poll live sync for Apps Script iframe |
| 23 | 2026-07-15 | 591 | `AKfycbxy…` | Hotfix: Firebase custom-token claims nesting so client Firestore listeners can auth |
| 24 | 2026-07-15 | 590 | `AKfycbxy…` | Hotfix: stop prep banner toggle race; meta owns live sync |
| 25 | 2026-07-15 | 589 | `AKfycbxy…` | DAL: prep session meta watcher + live PA sync fixes |
| 26 | 2026-07-15 | 588 | `AKfycbxy…` | DAL Phase 4 Slice C: client Firestore PA listeners during prep |
| 27 | 2026-07-15 | 587 | `AKfycbxy…` | Hotfix: Firestore collection path trailing slash for START PREP |
| 28 | 2026-07-15 | 586 | `AKfycbxy…` | Hotfix: fail-fast Firestore config errors, clearer START PREP alert |
| 29 | 2026-07-15 | 585 | `AKfycbxy…` | PA: START PREP in equipment modal, L.O. access, title is project name only |
| 30 | 2026-07-15 | 584 | `AKfycbxy…` | Hotfix: show START PREP button for managers on saved projects |
| 31 | 2026-07-15 | 583 | `AKfycbxy…` | DAL Phase 4 Slice B: prep session open/close + PA Firestore fork (GAS REST) |
| 32 | 2026-07-15 | 582 | `AKfycbxy…` | DAL Phase 4 Slice A: session registry + FirebaseAdapter skeleton (Sheets-only, zero behavior change) |
| 33 | 2026-07-15 | 581 | `AKfycbxy…` | DAL Phase 3: delta-only saves on PA, timeline, ledger (scoped row writes; PA concurrency verified) |
| 34 | 2026-07-15 | 580 | `AKfycbxy…` | DAL Phase 2: projectDataRouter + inventory tables (Sheets-only, zero behavior change) |
| 35 | 2026-07-15 | 579 | `AKfycbxy…` | DAL Phase 1 Slice B: public GAS APIs delegate through repos (zero behavior change) |
| 36 | 2026-07-15 | 578 | `AKfycbxy…` | Hotfix: Dal_Repos.js syntax error (block comment) broke GAS project + PA save |
| 37 | 2026-07-15 | 577 | `AKfycbxy…` | DAL Phase 1 Slice A: Dal_Repos.js + SheetsAdapter skeleton (zero behavior change) |
| 38 | 2026-07-15 | 576 | `AKfycbxy…` | MAJOR ROLLBACK POINT — pre-DAL Phase 1 (Sheets-only baseline; no repo layer) |
| 39 | 2026-07-15 | 575 | `AKfycbxy…` | PA header: design reverted; packing/op simplified title+checkout |
| 40 | 2026-07-15 | 574 | `AKfycbxy…` | PA header: event name only; design mode hides logistics/offer, checkout beside title |
| 41 | 2026-07-15 | 573 | `AKfycbxy…` | Desktop sidebar: Personal Hub + Visual + System as one block above lock |
| 42 | 2026-07-14 | 572 | `AKfycbxy…` | Dock: unified settings cog, project click fix, Back (Esc) button |
| 43 | 2026-07-13 | 571 | `AKfycbxy…` | Fix dock PA: station-dock-pa-open class on html not body — enables left-pane layout, Back, Escape |
| 44 | 2026-07-13 | 570 | `AKfycbxy…` | Station PA: fix horizontal overflow from dock zoom; add Back button + Escape close with unsaved guard |
| 45 | 2026-07-13 | 569 | `AKfycbxy…` | Station dock: confine Project Assets to left pane; show Back nav; robust dock skin detection for Escape |
| 46 | 2026-07-13 | 568 | `AKfycbxy…` | Station dock: confirm before back/Escape from Project Assets; clamp PA overlay overflow |
| 47 | 2026-07-13 | 567 | `AKfycbxy…` | Station desktop: project picker keyboard nav (arrows/enter) + fix PA open when syncProjectEditorHiddenFields missing |
| 48 | 2026-07-13 | 566 | `AKfycbxy…` | Claude Repomix pack — create-repomix.js, repomix.config.json, docs/ai/CLAUDE_PACK.md |
| 49 | 2026-07-13 | 565 | `AKfycbxy…` | Dock PA in left pane (mobile compact); Escape guard; EXE v0.1.50 |
| 50 | 2026-07-13 | 564 | `AKfycbxy…` | Dock: tangent bulb arc + tip padding; weather in right rail; v563 cursor rollback saved |

---

**Rollback production:** Tell the AI *"Rollback production to last milestone"*.
