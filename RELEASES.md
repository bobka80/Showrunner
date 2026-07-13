# Production Milestones (Apps Script versions)

Created only on **Milestone** / **OK ship** / **Milestone now** — not on every "This works".

| # | Date | GAS version | Deployment | Note |
|---|------|-------------|------------|------|
| 1 | 2026-07-13 | 569 | `AKfycbxy…` | Station dock: confine Project Assets to left pane; show Back nav; robust dock skin detection for Escape |
| 2 | 2026-07-13 | 568 | `AKfycbxy…` | Station dock: confirm before back/Escape from Project Assets; clamp PA overlay overflow |
| 3 | 2026-07-13 | 567 | `AKfycbxy…` | Station desktop: project picker keyboard nav (arrows/enter) + fix PA open when syncProjectEditorHiddenFields missing |
| 4 | 2026-07-13 | 566 | `AKfycbxy…` | Claude Repomix pack — create-repomix.js, repomix.config.json, docs/ai/CLAUDE_PACK.md |
| 5 | 2026-07-13 | 565 | `AKfycbxy…` | Dock PA in left pane (mobile compact); Escape guard; EXE v0.1.50 |
| 6 | 2026-07-13 | 564 | `AKfycbxy…` | Dock: tangent bulb arc + tip padding; weather in right rail; v563 cursor rollback saved |
| 7 | 2026-07-12 | 563 | `AKfycbxy…` | Dock cursor tip tangents; project weather hover scroll |
| 8 | 2026-07-12 | 562 | `AKfycbxy…` | Dock cursor: both exterior arcs in SVG space, darker red, gray outline |
| 9 | 2026-07-12 | 561 | `AKfycbxy…` | Dock cursor: fix tip arc, dark red fill, thicker white outline |
| 10 | 2026-07-12 | 560 | `AKfycbxy…` | Dock: convex teardrop cursor, weather scroll from top, projects boot without host prompt |
| 11 | 2026-07-12 | 559 | `AKfycbxy…` | Warehouse projects on boot; exterior pointer arcs; bulletin boot fix |
| 12 | 2026-07-12 | 558 | `AKfycbxy…` | Geometric pointer; Sofia-only weather; ticket layout; 24h clock; fade fix |
| 13 | 2026-07-12 | 557 | `AKfycbxy…` | Fix dock pointer: exact DXF tangent contour arcs |
| 14 | 2026-07-11 | 556 | `AKfycbxy…` | DXF pointer contour; opaque screensaver; bigger weather; 15s fades; custom cursor on buttons |
| 15 | 2026-07-11 | 555 | `AKfycbxy…` | Geometric webOS cursor; screensaver true L/R split with soft weather dim |
| 16 | 2026-07-11 | 554 | `AKfycbxy…` | LG webOS teardrop pointer cursor for desktop dock station |
| 17 | 2026-07-11 | 553 | `AKfycbxy…` | Dock screensaver: true L/R panes, Sofia+event 10s rotation, webOS cursor |
| 18 | 2026-07-11 | 552 | `AKfycbxy…` | Dock bulletin screensaver + Stagebusters A EXE icon prep |
| 19 | 2026-07-11 | 551 | `AKfycbxy…` | Fix dock project list showing only one event: stop full-payload overwrite, always refresh |
| 20 | 2026-07-11 | 550 | `AKfycbxy…` | Station scan feed click-to-select; outdoor weather on phone + dock project lists |
| 21 | 2026-07-11 | 549 | `AKfycbxy…` | Dock header nav, scan rail actions, exit app, scan row grid |
| 22 | 2026-07-11 | 548 | `AKfycbxy…` | Dock: PA z-index fix, fast project list, scan row layout, header font |
| 23 | 2026-07-11 | 547 | `AKfycbxy…` | Dock: header display settings, aligned divider, working zoom, faster project load |
| 24 | 2026-07-11 | 546 | `AKfycbxy…` | Idle gun sleep only when connected; desktop hot-plug reconnect in EXE 0.1.46 |
| 25 | 2026-07-11 | 545 | `AKfycbxy…` | Dock UI polish: unified header, dual-pane zoom, scan feed name+unit grouping |
| 26 | 2026-07-11 | 544 | `AKfycbxy…` | Desktop dock UI Phase B v1: 2/3 project list + 1/3 scan rail, no sidebar |
| 27 | 2026-07-11 | 543 | `AKfycbxy…` | Fix station boot: restore DOMContentLoaded initStationShell_ after Phase A split (profile name + optimistic login) |
| 28 | 2026-07-11 | 542 | `AKfycbxy…` | Chainway cold boot: clear persisted host on device reboot; keep host on warm WebView reload |
| 29 | 2026-07-11 | 541 | `AKfycbxy…` | Chainway scan delivery: disable top-frame poll race, 350ms delivery dedup, retire early-boot double listener; fix split module parse boundaries |
| 30 | 2026-07-11 | 540 | `AKfycbxy…` | Phase A station shell split: 20 modules, monolith-order regen, verify gates passed (golden 225d323f33f679d2) |
| 31 | 2026-07-11 | 539 | `AKfycbxy…` | REWIND station: restore v530 monolith shell, revert split + scan experiments |
| 32 | 2026-07-11 | 538 | `AKfycbxy…` | Scan dedup: fix double postMessage + 350ms delivery-only dedup (not 1500ms rescan block) |
| 33 | 2026-07-11 | 537 | `AKfycbxy…` | Chainway scan delivery: early iframe ready, host scan buffer, gate poll until listener wired |
| 34 | 2026-07-11 | 536 | `AKfycbxy…` | Station split: restore monolith eval order (v530 scan path), revert post-split scan patches |
| 35 | 2026-07-11 | 535 | `AKfycbxy…` | Chainway: single scan delivery path, fix scanBusy blocking equipment reads |
| 36 | 2026-07-11 | 534 | `AKfycbxy…` | Chainway: fix first-boot scan race + hold scan mode UI; multi beep (web) |
| 37 | 2026-07-11 | 533 | `AKfycbxy…` | Station shell split Phase A (behavior-neutral, parse-checked) |
| 38 | 2026-07-11 | 530 | `AKfycbxy…` | REWIND POINT (major): Chainway sled + TSL desktop RFID baseline before 11-series UI split — see docs/ai/active/REWIND-pre-station-ui-split.md |
| 39 | 2026-07-11 | 529 | `AKfycbxy…` | TSL desktop: never restore crew host on cold start (v0.1.44, host-boot 499) |
| 40 | 2026-07-11 | 528 | `AKfycbxy…` | Desktop v0.1.43: fix disconnect/reconnect gun relay on nested iframe |
| 41 | 2026-07-11 | 527 | `AKfycbxy…` | Desktop v0.1.42: fix settings relay to native gun; quiet gun-config log spam |
| 42 | 2026-07-11 | 526 | `AKfycbxy…` | Desktop v0.1.41: fix TSL settings bridge from nested iframe; host-boot SR_STATION_GUN relay |
| 43 | 2026-07-11 | 525 | `AKfycbxy…` | Desktop v0.1.38: nested GAS iframe scan forward + session to top |
| 44 | 2026-07-11 | 524 | `AKfycbxy…` | Desktop v0.1.35: fix false shellReady, iframe session sync, float feed ID collision |
| 45 | 2026-07-11 | 523 | `AKfycbxy…` | Station desktop: exempt kiosk from auto-login-off session block |
| 46 | 2026-07-11 | 522 | `AKfycbxy…` | Fix scan feed wipe: stationRecentScans + full message listener |
| 47 | 2026-07-11 | 521 | `AKfycbxy…` | Station shell: hide float feed when real scan panel active |
| 48 | 2026-07-11 | 520 | `AKfycbxy…` | Desktop v0.1.29: station shim early boot + live feed before LogicPayload |
| 49 | 2026-07-11 | 519 | `AKfycbxy…` | Desktop scan: inject __srScanQueue + frame diagnostics; desktop queue poll |
| 50 | 2026-07-11 | 518 | `AKfycbxy…` | Fix station early-boot postMessage listener; desktop ExecuteScript scan feed fallback |

---

**Rollback production:** Tell the AI *"Rollback production to last milestone"*.
