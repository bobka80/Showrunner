# Production Milestones (Apps Script versions)

Created only on **Milestone** / **OK ship** / **Milestone now** — not on every "This works".

| # | Date | GAS version | Deployment | Note |
|---|------|-------------|------------|------|
| 1 | 2026-07-15 | 597 | `AKfycbxy…` | HOTFIX: show END COLLAB while timeline session is stuck opening (abort path) |
| 2 | 2026-07-15 | 596 | `AKfycbxy…` | HOTFIX: timeline collab open reliability — begin/finish split, join if open, reclaim stale opening, faster Firestore upsert |
| 3 | 2026-07-15 | 595 | `AKfycbxy…` | Remove timeline single-editor door lock — both users can enter; button shows who is inside |
| 4 | 2026-07-15 | 594 | `AKfycbxy…` | HOTFIX: timeline START COLLAB — release ScriptLock during Firestore so presence door unlocks; cancel leave + timeout re-check |
| 5 | 2026-07-15 | 593 | `AKfycbxy…` | DAL Phase 4 Slice C: Timeline collab session Phase A (Firestore fork + START/END COLLAB) |
| 6 | 2026-07-15 | 592 | `AKfycbxy…` | Hotfix: prep latch + GAS poll live sync for Apps Script iframe |
| 7 | 2026-07-15 | 591 | `AKfycbxy…` | Hotfix: Firebase custom-token claims nesting so client Firestore listeners can auth |
| 8 | 2026-07-15 | 590 | `AKfycbxy…` | Hotfix: stop prep banner toggle race; meta owns live sync |
| 9 | 2026-07-15 | 589 | `AKfycbxy…` | DAL: prep session meta watcher + live PA sync fixes |
| 10 | 2026-07-15 | 588 | `AKfycbxy…` | DAL Phase 4 Slice C: client Firestore PA listeners during prep |
| 11 | 2026-07-15 | 587 | `AKfycbxy…` | Hotfix: Firestore collection path trailing slash for START PREP |
| 12 | 2026-07-15 | 586 | `AKfycbxy…` | Hotfix: fail-fast Firestore config errors, clearer START PREP alert |
| 13 | 2026-07-15 | 585 | `AKfycbxy…` | PA: START PREP in equipment modal, L.O. access, title is project name only |
| 14 | 2026-07-15 | 584 | `AKfycbxy…` | Hotfix: show START PREP button for managers on saved projects |
| 15 | 2026-07-15 | 583 | `AKfycbxy…` | DAL Phase 4 Slice B: prep session open/close + PA Firestore fork (GAS REST) |
| 16 | 2026-07-15 | 582 | `AKfycbxy…` | DAL Phase 4 Slice A: session registry + FirebaseAdapter skeleton (Sheets-only, zero behavior change) |
| 17 | 2026-07-15 | 581 | `AKfycbxy…` | DAL Phase 3: delta-only saves on PA, timeline, ledger (scoped row writes; PA concurrency verified) |
| 18 | 2026-07-15 | 580 | `AKfycbxy…` | DAL Phase 2: projectDataRouter + inventory tables (Sheets-only, zero behavior change) |
| 19 | 2026-07-15 | 579 | `AKfycbxy…` | DAL Phase 1 Slice B: public GAS APIs delegate through repos (zero behavior change) |
| 20 | 2026-07-15 | 578 | `AKfycbxy…` | Hotfix: Dal_Repos.js syntax error (block comment) broke GAS project + PA save |
| 21 | 2026-07-15 | 577 | `AKfycbxy…` | DAL Phase 1 Slice A: Dal_Repos.js + SheetsAdapter skeleton (zero behavior change) |
| 22 | 2026-07-15 | 576 | `AKfycbxy…` | MAJOR ROLLBACK POINT — pre-DAL Phase 1 (Sheets-only baseline; no repo layer) |
| 23 | 2026-07-15 | 575 | `AKfycbxy…` | PA header: design reverted; packing/op simplified title+checkout |
| 24 | 2026-07-15 | 574 | `AKfycbxy…` | PA header: event name only; design mode hides logistics/offer, checkout beside title |
| 25 | 2026-07-15 | 573 | `AKfycbxy…` | Desktop sidebar: Personal Hub + Visual + System as one block above lock |
| 26 | 2026-07-14 | 572 | `AKfycbxy…` | Dock: unified settings cog, project click fix, Back (Esc) button |
| 27 | 2026-07-13 | 571 | `AKfycbxy…` | Fix dock PA: station-dock-pa-open class on html not body — enables left-pane layout, Back, Escape |
| 28 | 2026-07-13 | 570 | `AKfycbxy…` | Station PA: fix horizontal overflow from dock zoom; add Back button + Escape close with unsaved guard |
| 29 | 2026-07-13 | 569 | `AKfycbxy…` | Station dock: confine Project Assets to left pane; show Back nav; robust dock skin detection for Escape |
| 30 | 2026-07-13 | 568 | `AKfycbxy…` | Station dock: confirm before back/Escape from Project Assets; clamp PA overlay overflow |
| 31 | 2026-07-13 | 567 | `AKfycbxy…` | Station desktop: project picker keyboard nav (arrows/enter) + fix PA open when syncProjectEditorHiddenFields missing |
| 32 | 2026-07-13 | 566 | `AKfycbxy…` | Claude Repomix pack — create-repomix.js, repomix.config.json, docs/ai/CLAUDE_PACK.md |
| 33 | 2026-07-13 | 565 | `AKfycbxy…` | Dock PA in left pane (mobile compact); Escape guard; EXE v0.1.50 |
| 34 | 2026-07-13 | 564 | `AKfycbxy…` | Dock: tangent bulb arc + tip padding; weather in right rail; v563 cursor rollback saved |
| 35 | 2026-07-12 | 563 | `AKfycbxy…` | Dock cursor tip tangents; project weather hover scroll |
| 36 | 2026-07-12 | 562 | `AKfycbxy…` | Dock cursor: both exterior arcs in SVG space, darker red, gray outline |
| 37 | 2026-07-12 | 561 | `AKfycbxy…` | Dock cursor: fix tip arc, dark red fill, thicker white outline |
| 38 | 2026-07-12 | 560 | `AKfycbxy…` | Dock: convex teardrop cursor, weather scroll from top, projects boot without host prompt |
| 39 | 2026-07-12 | 559 | `AKfycbxy…` | Warehouse projects on boot; exterior pointer arcs; bulletin boot fix |
| 40 | 2026-07-12 | 558 | `AKfycbxy…` | Geometric pointer; Sofia-only weather; ticket layout; 24h clock; fade fix |
| 41 | 2026-07-12 | 557 | `AKfycbxy…` | Fix dock pointer: exact DXF tangent contour arcs |
| 42 | 2026-07-11 | 556 | `AKfycbxy…` | DXF pointer contour; opaque screensaver; bigger weather; 15s fades; custom cursor on buttons |
| 43 | 2026-07-11 | 555 | `AKfycbxy…` | Geometric webOS cursor; screensaver true L/R split with soft weather dim |
| 44 | 2026-07-11 | 554 | `AKfycbxy…` | LG webOS teardrop pointer cursor for desktop dock station |
| 45 | 2026-07-11 | 553 | `AKfycbxy…` | Dock screensaver: true L/R panes, Sofia+event 10s rotation, webOS cursor |
| 46 | 2026-07-11 | 552 | `AKfycbxy…` | Dock bulletin screensaver + Stagebusters A EXE icon prep |
| 47 | 2026-07-11 | 551 | `AKfycbxy…` | Fix dock project list showing only one event: stop full-payload overwrite, always refresh |
| 48 | 2026-07-11 | 550 | `AKfycbxy…` | Station scan feed click-to-select; outdoor weather on phone + dock project lists |
| 49 | 2026-07-11 | 549 | `AKfycbxy…` | Dock header nav, scan rail actions, exit app, scan row grid |
| 50 | 2026-07-11 | 548 | `AKfycbxy…` | Dock: PA z-index fix, fast project list, scan row layout, header font |

---

**Rollback production:** Tell the AI *"Rollback production to last milestone"*.
