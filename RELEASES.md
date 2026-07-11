# Production Milestones (Apps Script versions)

Created only on **Milestone** / **OK ship** / **Milestone now** — not on every "This works".

| # | Date | GAS version | Deployment | Note |
|---|------|-------------|------------|------|
| 1 | 2026-07-11 | 533 | `AKfycbxy…` | Station shell split Phase A (behavior-neutral, parse-checked) |
| 2 | 2026-07-11 | 530 | `AKfycbxy…` | REWIND POINT (major): Chainway sled + TSL desktop RFID baseline before 11-series UI split — see docs/ai/active/REWIND-pre-station-ui-split.md |
| 3 | 2026-07-11 | 529 | `AKfycbxy…` | TSL desktop: never restore crew host on cold start (v0.1.44, host-boot 499) |
| 4 | 2026-07-11 | 528 | `AKfycbxy…` | Desktop v0.1.43: fix disconnect/reconnect gun relay on nested iframe |
| 5 | 2026-07-11 | 527 | `AKfycbxy…` | Desktop v0.1.42: fix settings relay to native gun; quiet gun-config log spam |
| 6 | 2026-07-11 | 526 | `AKfycbxy…` | Desktop v0.1.41: fix TSL settings bridge from nested iframe; host-boot SR_STATION_GUN relay |
| 7 | 2026-07-11 | 525 | `AKfycbxy…` | Desktop v0.1.38: nested GAS iframe scan forward + session to top |
| 8 | 2026-07-11 | 524 | `AKfycbxy…` | Desktop v0.1.35: fix false shellReady, iframe session sync, float feed ID collision |
| 9 | 2026-07-11 | 523 | `AKfycbxy…` | Station desktop: exempt kiosk from auto-login-off session block |
| 10 | 2026-07-11 | 522 | `AKfycbxy…` | Fix scan feed wipe: stationRecentScans + full message listener |
| 11 | 2026-07-11 | 521 | `AKfycbxy…` | Station shell: hide float feed when real scan panel active |
| 12 | 2026-07-11 | 520 | `AKfycbxy…` | Desktop v0.1.29: station shim early boot + live feed before LogicPayload |
| 13 | 2026-07-11 | 519 | `AKfycbxy…` | Desktop scan: inject __srScanQueue + frame diagnostics; desktop queue poll |
| 14 | 2026-07-11 | 518 | `AKfycbxy…` | Fix station early-boot postMessage listener; desktop ExecuteScript scan feed fallback |
| 15 | 2026-07-11 | 517 | `AKfycbxy…` | Desktop scan relay: ExecuteScript into GAS iframe; early feed stub |
| 16 | 2026-07-11 | 516 | `AKfycbxy…` | Station desktop v0.1.24: live RFID feed relay via frame PostWebMessage; scan feed before dedup |
| 17 | 2026-07-11 | 515 | `AKfycbxy…` | TSL desktop: single scan mode, settings wired, early RFID scan queue for live strip |
| 18 | 2026-07-11 | 514 | `AKfycbxy…` | TSL desktop v0.1.12: scan busy timeout, single trigger read |
| 19 | 2026-07-11 | 513 | `AKfycbxy…` | TSL desktop v0.1.11: scan feed + host path fixes, crew roster in scan panel |
| 20 | 2026-07-11 | 512 | `AKfycbxy…` | TSL desktop v0.1.10: host badge status + TID read path |
| 21 | 2026-07-11 | 511 | `AKfycbxy…` | TSL desktop v0.1.6: gun sleep postMessage fix, scan relay to iframe, host badge feedback |
| 22 | 2026-07-11 | 510 | `AKfycbxy…` | TSL desktop v0.1.5: fix gun connect regression (threading + watchdog boot order) |
| 23 | 2026-07-11 | 509 | `AKfycbxy…` | TSL desktop v0.1.4: reconnect and sleep gun via WebView2 + SDK SleepCommand |
| 24 | 2026-07-11 | 508 | `AKfycbxy…` | TSL desktop scan delivery: WebView2 iframe bridge + direct onStationRfidScan |
| 25 | 2026-07-11 | 507 | `AKfycbxy…` | TSL desktop v0.1.2: trigger inventory like Explorer, fix 10-29 dBm power, skip push banner on desktop |
| 26 | 2026-07-11 | 506 | `AKfycbxy…` | TSL desktop: iframe gun relay (reconnect/sleep/poll) + inventory read fix |
| 27 | 2026-07-10 | 505 | `AKfycbxy…` | Chainway disconnect beep + no-host auto park (autoSdkPark); APK build 53 |
| 28 | 2026-07-10 | 504 | `AKfycbxy…` | Chainway: disable auto SDK park — partial disconnect leaves BT up and breaks HID wake |
| 29 | 2026-07-10 | 503 | `AKfycbxy…` | Park timing hints + clarify grace vs firmware sleep; APK build 51 HID dispatchKeyEvent fix |
| 30 | 2026-07-10 | 502 | `AKfycbxy…` | Chainway no-host park timers + HID/SDK 3-state trigger reconnect (APK build 50) |
| 31 | 2026-07-10 | 501 | `AKfycbxy…` | Station: reject host badge scans while someone is signed in — must LOG OUT HOST first |
| 32 | 2026-07-10 | 500 | `AKfycbxy…` | Chainway stay-connected: appSleep false, native sleepGun no-op, BLE held open (build 49) |
| 33 | 2026-07-08 | 499 | `AKfycbxy…` | Fix station UI: early boot on ShowrunnerStation UA + meta before async LogicPayload |
| 34 | 2026-07-08 | 498 | `AKfycbxy…` | Fix Chainway gun sleep: idle timer was resetting on every config refresh — arm only on boot/save/first-connect. sleepGun disconnects BLE immediately, firmware awaitSleep pinned to SDK min (1min). No free() so watchdog cannot race reconnect. |
| 35 | 2026-07-08 | 497 | `AKfycbxy…` | Chainway gun sleep: native trigger-idle timer (setGunIdleSleepMinutes) powers down after no trigger pull — not scan-based JS disconnect. Driver cap nativeIdleSleep for chainway_handheld. |
| 36 | 2026-07-08 | 496 | `AKfycbxy…` | Station settings: per-station namespaced storage (profileName-scoped, migrates legacy global keys) so each station keeps its own power/scan-mode/poll/beep/eject/gun-sleep. Enable idle gun-sleep timer for BOTH guns via each driver's own SDK (Chainway appSleep:true -> resumable RfidManager.sleepGun; TSL .sl) - shared settings view, separate driver pools. Starting point for Chainway stays-on debugging. |
| 37 | 2026-07-08 | 495 | `AKfycbxy…` | Fork station gun drivers per layout (11a_Station_Gun_Drivers): Chainway/TSL/gate isolated by caps. Revert Chainway regression — appSleep only for TSL, trigger-wake restored. Docs updated. |
| 38 | 2026-07-08 | 494 | `AKfycbxy…` | Gun auto-sleep timer dropdown (Session settings) for both guns: JS idle timer calls native sleepGun after chosen minutes; Chainway RfidManager.sleepGun resumable + LINK_ASLEEP |
| 39 | 2026-07-08 | 493 | `AKfycbxy…` | Fix: exclude build-station-desktop.js from GAS (require is not defined white screen); re-ship clean shell |
| 40 | 2026-07-08 | 492 | `AKfycbxy…` | Station TSL desktop: gun settings cogwheel + Disconnect+Sleep button (.sl power-down) scoped to tsl_dock_desktop |
| 41 | 2026-07-08 | 491 | `AKfycbxy…` | Calendar QoL: change new-project day press cue from amber to white glowing frame on mini-calendar. |
| 42 | 2026-07-08 | 490 | `AKfycbxy…` | Calendar QoL: add a transient press cue. When a new project is started by clicking a day in the main calendar, the editor mini-calendar now frames that exact day with a glowing amber outline that fades in, holds, then fades out over ~3s (then auto-removes) so you instantly see where you pressed. Scoped to #mini-project-calendar, pointer-events off, only fires on a new-project day-click. |
| 43 | 2026-07-08 | 489 | `AKfycbxy…` | Calendar QoL: Project Editor mini-calendar now opens focused on the pressed date instead of the 1st of the month. Switched from dayGridMonth to a rolling 6-week dayGrid anchored one week before the target date, so the pressed day's week is the SECOND row (one week of context above, the rest of the month-scope below) - no more scrolling to reach late-month dates. |
| 44 | 2026-07-08 | 488 | `AKfycbxy…` | Fix eject-vs-server race: optimistic badge-in calls processStationRfidScan (~1s); if the operator logged the host out during that window, the slow success handler re-wrote the host and signed the ejected person back in. Added a stationHostLoginSeq guard bumped on every login AND every eject/idle-expire, so a stale confirmation callback whose captured seq no longer matches does nothing. Also release stationScanBusy on eject. |
| 45 | 2026-07-08 | 487 | `AKfycbxy…` | Hotfix: exclude rollback.js from GAS push. The node-only rollback.js was being copied into dist/ and pushed to Apps Script, where its top-level require() threw 'require is not defined' on every server call and broke the app. Added rollback.js to gas-node-only.js and .claspignore. |
| 46 | 2026-07-08 | 486 | `AKfycbxy…` | Fix eject auto-relogin: a single trigger pull emits a burst of reads for one badge, and a tail-end read arriving after the 1.5s scan-dedup was instantly re-hosting the person the operator just logged out. Add a 3s post-eject cooldown that ignores re-reads of the just-ejected badge (a different badge, or the same badge after the window, still hosts normally). |
| 47 | 2026-07-08 | 485 | `AKfycbxy…` | BLE reconnect hosting-only: flap guard, block iframe nav, host persist parent |
| 48 | 2026-07-08 | 484 | `AKfycbxy…` | Revert v483 direct-GAS BLE fix; restore v482 hosting shell behavior |
| 49 | 2026-07-08 | 483 | `AKfycbxy…` | BLE reconnect fix: native GAS direct load, host session persist, flap guard |
| 50 | 2026-07-07 | 482 | `AKfycbxy…` | Wall-clock host eject deadline survives screen sleep; gun-active keep screen on APK |

---

**Rollback production:** Tell the AI *"Rollback production to last milestone"*.
