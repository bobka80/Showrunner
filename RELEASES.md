# Production Milestones (Apps Script versions)

Created only on **Milestone** / **OK ship** / **Milestone now** — not on every "This works".

| # | Date | GAS version | Deployment | Note |
|---|------|-------------|------------|------|
| 1 | 2026-07-15 | 582 | `AKfycbxy…` | DAL Phase 4 Slice A: session registry + FirebaseAdapter skeleton (Sheets-only, zero behavior change) |
| 2 | 2026-07-15 | 581 | `AKfycbxy…` | DAL Phase 3: delta-only saves on PA, timeline, ledger (scoped row writes; PA concurrency verified) |
| 3 | 2026-07-15 | 580 | `AKfycbxy…` | DAL Phase 2: projectDataRouter + inventory tables (Sheets-only, zero behavior change) |
| 4 | 2026-07-15 | 579 | `AKfycbxy…` | DAL Phase 1 Slice B: public GAS APIs delegate through repos (zero behavior change) |
| 5 | 2026-07-15 | 578 | `AKfycbxy…` | Hotfix: Dal_Repos.js syntax error (block comment) broke GAS project + PA save |
| 6 | 2026-07-15 | 577 | `AKfycbxy…` | DAL Phase 1 Slice A: Dal_Repos.js + SheetsAdapter skeleton (zero behavior change) |
| 7 | 2026-07-15 | 576 | `AKfycbxy…` | MAJOR ROLLBACK POINT — pre-DAL Phase 1 (Sheets-only baseline; no repo layer) |
| 8 | 2026-07-15 | 575 | `AKfycbxy…` | PA header: design reverted; packing/op simplified title+checkout |
| 9 | 2026-07-15 | 574 | `AKfycbxy…` | PA header: event name only; design mode hides logistics/offer, checkout beside title |
| 10 | 2026-07-15 | 573 | `AKfycbxy…` | Desktop sidebar: Personal Hub + Visual + System as one block above lock |
| 11 | 2026-07-14 | 572 | `AKfycbxy…` | Dock: unified settings cog, project click fix, Back (Esc) button |
| 12 | 2026-07-13 | 571 | `AKfycbxy…` | Fix dock PA: station-dock-pa-open class on html not body — enables left-pane layout, Back, Escape |
| 13 | 2026-07-13 | 570 | `AKfycbxy…` | Station PA: fix horizontal overflow from dock zoom; add Back button + Escape close with unsaved guard |
| 14 | 2026-07-13 | 569 | `AKfycbxy…` | Station dock: confine Project Assets to left pane; show Back nav; robust dock skin detection for Escape |
| 15 | 2026-07-13 | 568 | `AKfycbxy…` | Station dock: confirm before back/Escape from Project Assets; clamp PA overlay overflow |
| 16 | 2026-07-13 | 567 | `AKfycbxy…` | Station desktop: project picker keyboard nav (arrows/enter) + fix PA open when syncProjectEditorHiddenFields missing |
| 17 | 2026-07-13 | 566 | `AKfycbxy…` | Claude Repomix pack — create-repomix.js, repomix.config.json, docs/ai/CLAUDE_PACK.md |
| 18 | 2026-07-13 | 565 | `AKfycbxy…` | Dock PA in left pane (mobile compact); Escape guard; EXE v0.1.50 |
| 19 | 2026-07-13 | 564 | `AKfycbxy…` | Dock: tangent bulb arc + tip padding; weather in right rail; v563 cursor rollback saved |
| 20 | 2026-07-12 | 563 | `AKfycbxy…` | Dock cursor tip tangents; project weather hover scroll |
| 21 | 2026-07-12 | 562 | `AKfycbxy…` | Dock cursor: both exterior arcs in SVG space, darker red, gray outline |
| 22 | 2026-07-12 | 561 | `AKfycbxy…` | Dock cursor: fix tip arc, dark red fill, thicker white outline |
| 23 | 2026-07-12 | 560 | `AKfycbxy…` | Dock: convex teardrop cursor, weather scroll from top, projects boot without host prompt |
| 24 | 2026-07-12 | 559 | `AKfycbxy…` | Warehouse projects on boot; exterior pointer arcs; bulletin boot fix |
| 25 | 2026-07-12 | 558 | `AKfycbxy…` | Geometric pointer; Sofia-only weather; ticket layout; 24h clock; fade fix |
| 26 | 2026-07-12 | 557 | `AKfycbxy…` | Fix dock pointer: exact DXF tangent contour arcs |
| 27 | 2026-07-11 | 556 | `AKfycbxy…` | DXF pointer contour; opaque screensaver; bigger weather; 15s fades; custom cursor on buttons |
| 28 | 2026-07-11 | 555 | `AKfycbxy…` | Geometric webOS cursor; screensaver true L/R split with soft weather dim |
| 29 | 2026-07-11 | 554 | `AKfycbxy…` | LG webOS teardrop pointer cursor for desktop dock station |
| 30 | 2026-07-11 | 553 | `AKfycbxy…` | Dock screensaver: true L/R panes, Sofia+event 10s rotation, webOS cursor |
| 31 | 2026-07-11 | 552 | `AKfycbxy…` | Dock bulletin screensaver + Stagebusters A EXE icon prep |
| 32 | 2026-07-11 | 551 | `AKfycbxy…` | Fix dock project list showing only one event: stop full-payload overwrite, always refresh |
| 33 | 2026-07-11 | 550 | `AKfycbxy…` | Station scan feed click-to-select; outdoor weather on phone + dock project lists |
| 34 | 2026-07-11 | 549 | `AKfycbxy…` | Dock header nav, scan rail actions, exit app, scan row grid |
| 35 | 2026-07-11 | 548 | `AKfycbxy…` | Dock: PA z-index fix, fast project list, scan row layout, header font |
| 36 | 2026-07-11 | 547 | `AKfycbxy…` | Dock: header display settings, aligned divider, working zoom, faster project load |
| 37 | 2026-07-11 | 546 | `AKfycbxy…` | Idle gun sleep only when connected; desktop hot-plug reconnect in EXE 0.1.46 |
| 38 | 2026-07-11 | 545 | `AKfycbxy…` | Dock UI polish: unified header, dual-pane zoom, scan feed name+unit grouping |
| 39 | 2026-07-11 | 544 | `AKfycbxy…` | Desktop dock UI Phase B v1: 2/3 project list + 1/3 scan rail, no sidebar |
| 40 | 2026-07-11 | 543 | `AKfycbxy…` | Fix station boot: restore DOMContentLoaded initStationShell_ after Phase A split (profile name + optimistic login) |
| 41 | 2026-07-11 | 542 | `AKfycbxy…` | Chainway cold boot: clear persisted host on device reboot; keep host on warm WebView reload |
| 42 | 2026-07-11 | 541 | `AKfycbxy…` | Chainway scan delivery: disable top-frame poll race, 350ms delivery dedup, retire early-boot double listener; fix split module parse boundaries |
| 43 | 2026-07-11 | 540 | `AKfycbxy…` | Phase A station shell split: 20 modules, monolith-order regen, verify gates passed (golden 225d323f33f679d2) |
| 44 | 2026-07-11 | 539 | `AKfycbxy…` | REWIND station: restore v530 monolith shell, revert split + scan experiments |
| 45 | 2026-07-11 | 538 | `AKfycbxy…` | Scan dedup: fix double postMessage + 350ms delivery-only dedup (not 1500ms rescan block) |
| 46 | 2026-07-11 | 537 | `AKfycbxy…` | Chainway scan delivery: early iframe ready, host scan buffer, gate poll until listener wired |
| 47 | 2026-07-11 | 536 | `AKfycbxy…` | Station split: restore monolith eval order (v530 scan path), revert post-split scan patches |
| 48 | 2026-07-11 | 535 | `AKfycbxy…` | Chainway: single scan delivery path, fix scanBusy blocking equipment reads |
| 49 | 2026-07-11 | 534 | `AKfycbxy…` | Chainway: fix first-boot scan race + hold scan mode UI; multi beep (web) |
| 50 | 2026-07-11 | 533 | `AKfycbxy…` | Station shell split Phase A (behavior-neutral, parse-checked) |

---

**Rollback production:** Tell the AI *"Rollback production to last milestone"*.
