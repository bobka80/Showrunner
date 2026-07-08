# Production Milestones (Apps Script versions)

Created only on **Milestone** / **OK ship** / **Milestone now** — not on every "This works".

| # | Date | GAS version | Deployment | Note |
|---|------|-------------|------------|------|
| 1 | 2026-07-08 | 497 | `AKfycbxy…` | Chainway gun sleep: native trigger-idle timer (setGunIdleSleepMinutes) powers down after no trigger pull — not scan-based JS disconnect. Driver cap nativeIdleSleep for chainway_handheld. |
| 2 | 2026-07-08 | 496 | `AKfycbxy…` | Station settings: per-station namespaced storage (profileName-scoped, migrates legacy global keys) so each station keeps its own power/scan-mode/poll/beep/eject/gun-sleep. Enable idle gun-sleep timer for BOTH guns via each driver's own SDK (Chainway appSleep:true -> resumable RfidManager.sleepGun; TSL .sl) - shared settings view, separate driver pools. Starting point for Chainway stays-on debugging. |
| 3 | 2026-07-08 | 495 | `AKfycbxy…` | Fork station gun drivers per layout (11a_Station_Gun_Drivers): Chainway/TSL/gate isolated by caps. Revert Chainway regression — appSleep only for TSL, trigger-wake restored. Docs updated. |
| 4 | 2026-07-08 | 494 | `AKfycbxy…` | Gun auto-sleep timer dropdown (Session settings) for both guns: JS idle timer calls native sleepGun after chosen minutes; Chainway RfidManager.sleepGun resumable + LINK_ASLEEP |
| 5 | 2026-07-08 | 493 | `AKfycbxy…` | Fix: exclude build-station-desktop.js from GAS (require is not defined white screen); re-ship clean shell |
| 6 | 2026-07-08 | 492 | `AKfycbxy…` | Station TSL desktop: gun settings cogwheel + Disconnect+Sleep button (.sl power-down) scoped to tsl_dock_desktop |
| 7 | 2026-07-08 | 491 | `AKfycbxy…` | Calendar QoL: change new-project day press cue from amber to white glowing frame on mini-calendar. |
| 8 | 2026-07-08 | 490 | `AKfycbxy…` | Calendar QoL: add a transient press cue. When a new project is started by clicking a day in the main calendar, the editor mini-calendar now frames that exact day with a glowing amber outline that fades in, holds, then fades out over ~3s (then auto-removes) so you instantly see where you pressed. Scoped to #mini-project-calendar, pointer-events off, only fires on a new-project day-click. |
| 9 | 2026-07-08 | 489 | `AKfycbxy…` | Calendar QoL: Project Editor mini-calendar now opens focused on the pressed date instead of the 1st of the month. Switched from dayGridMonth to a rolling 6-week dayGrid anchored one week before the target date, so the pressed day's week is the SECOND row (one week of context above, the rest of the month-scope below) - no more scrolling to reach late-month dates. |
| 10 | 2026-07-08 | 488 | `AKfycbxy…` | Fix eject-vs-server race: optimistic badge-in calls processStationRfidScan (~1s); if the operator logged the host out during that window, the slow success handler re-wrote the host and signed the ejected person back in. Added a stationHostLoginSeq guard bumped on every login AND every eject/idle-expire, so a stale confirmation callback whose captured seq no longer matches does nothing. Also release stationScanBusy on eject. |
| 11 | 2026-07-08 | 487 | `AKfycbxy…` | Hotfix: exclude rollback.js from GAS push. The node-only rollback.js was being copied into dist/ and pushed to Apps Script, where its top-level require() threw 'require is not defined' on every server call and broke the app. Added rollback.js to gas-node-only.js and .claspignore. |
| 12 | 2026-07-08 | 486 | `AKfycbxy…` | Fix eject auto-relogin: a single trigger pull emits a burst of reads for one badge, and a tail-end read arriving after the 1.5s scan-dedup was instantly re-hosting the person the operator just logged out. Add a 3s post-eject cooldown that ignores re-reads of the just-ejected badge (a different badge, or the same badge after the window, still hosts normally). |
| 13 | 2026-07-08 | 485 | `AKfycbxy…` | BLE reconnect hosting-only: flap guard, block iframe nav, host persist parent |
| 14 | 2026-07-08 | 484 | `AKfycbxy…` | Revert v483 direct-GAS BLE fix; restore v482 hosting shell behavior |
| 15 | 2026-07-08 | 483 | `AKfycbxy…` | BLE reconnect fix: native GAS direct load, host session persist, flap guard |
| 16 | 2026-07-07 | 482 | `AKfycbxy…` | Wall-clock host eject deadline survives screen sleep; gun-active keep screen on APK |
| 17 | 2026-07-07 | 481 | `AKfycbxy…` | Optimistic host login: local crew EPC+TID roster cache, instant badge-in then server confirm |
| 18 | 2026-07-07 | 480 | `AKfycbxy…` | Fix false clone alerts: missing TID is not clone; TID length tolerance |
| 19 | 2026-07-07 | 479 | `AKfycbxy…` | Explicit EPC/TID bank reads for factory UHF badges |
| 20 | 2026-07-07 | 478 | `AKfycbxy…` | Reject EPC-echo TID on enroll; fix Chainway readData EPC filter bit params |
| 21 | 2026-07-07 | 477 | `AKfycbxy…` | Fix Crew_Roster schema repair: rfid_tid column width mismatch on vault sync |
| 22 | 2026-07-07 | 476 | `AKfycbxy…` | Crew enroll requires TID; explicit error when gun omits chip ID |
| 23 | 2026-07-07 | 475 | `AKfycbxy…` | Crew badges: EPC+TID schema (rfid_tid), soft-cutover pair login, native setEPCAndTIDMode |
| 24 | 2026-07-07 | 474 | `AKfycbxy…` | Station session survives sleep — sessioncheck retry, login boot grace, WebView reload |
| 25 | 2026-07-07 | 473 | `AKfycbxy…` | Milestone |
| 26 | 2026-07-07 | 472 | `AKfycbxy…` | Milestone |
| 27 | 2026-07-07 | 471 | `AKfycbxy…` | Milestone |
| 28 | 2026-07-07 | 470 | `AKfycbxy…` | v470 mobile QR: errors-only toast, uniform scan feed rows |
| 29 | 2026-07-07 | 469 | `AKfycbxy…` | v469 mobile QR: feed select, bottom panel labels, iOS camera decode fix |
| 30 | 2026-07-07 | 468 | `AKfycbxy…` | v468 mobile QR panel UX: feed-first panel, anchored cam overlay, auto-start |
| 31 | 2026-07-07 | 467 | `AKfycbxy…` | v467 mobile QR scan: stop post-scan loop — dedupe delivery, clear pending on reload |
| 32 | 2026-07-07 | 466 | `AKfycbxy…` | v466 mobile QR camera: iframe reload handoff via sessionboot srScan + campoll pull |
| 33 | 2026-07-07 | 465 | `AKfycbxy…` | Mobile scan: fix camera handoff — session token staging, relay burst, GAS iframe forward |
| 34 | 2026-07-07 | 464 | `AKfycbxy…` | Mobile scan: Operations-style vault lookup for RW-1000-20 composite codes |
| 35 | 2026-07-07 | 463 | `AKfycbxy…` | Mobile scan: stage primary key on server, simulate RW-1000-20, status line |
| 36 | 2026-07-07 | 462 | `AKfycbxy…` | Fix mobile scan freeze: restore shell embed fn, remove diagnostics overlay |
| 37 | 2026-07-07 | 461 | `AKfycbxy…` | v461: fix frozen UI — emergency overlay reset, debug off by default |
| 38 | 2026-07-07 | 460 | `AKfycbxy…` | v460: mobile scan diagnostics + simulate scan |
| 39 | 2026-07-07 | 459 | `AKfycbxy…` | v459: shell-native fullscreen QR camera + direct relay to app |
| 40 | 2026-07-07 | 458 | `AKfycbxy…` | v459: shell overlay camera — scan relays without unloading GAS iframe |
| 41 | 2026-07-06 | 457 | `AKfycbxy…` | v457: fix shell postMessage scan delivery (embed origin swallow bug) |
| 42 | 2026-07-06 | 456 | `AKfycbxy…` | v456: fix mobile scan injection after camera return (ACK + poll, no premature clear) |
| 43 | 2026-07-06 | 455 | `AKfycbxy…` | Mobile scan: resolve equipment after camera return |
| 44 | 2026-07-06 | 454 | `AKfycbxy…` | Mobile scan: preserve QR result across camera return |
| 45 | 2026-07-06 | 453 | `AKfycbxy…` | Mobile scan: OPEN CAMERA navigates to camera page |
| 46 | 2026-07-06 | 452 | `AKfycbxy…` | Mobile scan: fullscreen shell camera stage (Android iframe fix) |
| 47 | 2026-07-06 | 451 | `AKfycbxy…` | Mobile scan: shell camera-embed overlay (fix freeze) |
| 48 | 2026-07-06 | 450 | `AKfycbxy…` | Mobile scan: visible TAP TO START camera band |
| 49 | 2026-07-06 | 449 | `AKfycbxy…` | Milestone |
| 50 | 2026-07-06 | 448 | `AKfycbxy…` | Milestone |

---

**Rollback production:** Tell the AI *"Rollback production to last milestone"*.
