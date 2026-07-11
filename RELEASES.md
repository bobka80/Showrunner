# Production Milestones (Apps Script versions)

Created only on **Milestone** / **OK ship** / **Milestone now** — not on every "This works".

| # | Date | GAS version | Deployment | Note |
|---|------|-------------|------------|------|
| 1 | 2026-07-11 | 546 | `AKfycbxy…` | Idle gun sleep only when connected; desktop hot-plug reconnect in EXE 0.1.46 |
| 2 | 2026-07-11 | 545 | `AKfycbxy…` | Dock UI polish: unified header, dual-pane zoom, scan feed name+unit grouping |
| 3 | 2026-07-11 | 544 | `AKfycbxy…` | Desktop dock UI Phase B v1: 2/3 project list + 1/3 scan rail, no sidebar |
| 4 | 2026-07-11 | 543 | `AKfycbxy…` | Fix station boot: restore DOMContentLoaded initStationShell_ after Phase A split (profile name + optimistic login) |
| 5 | 2026-07-11 | 542 | `AKfycbxy…` | Chainway cold boot: clear persisted host on device reboot; keep host on warm WebView reload |
| 6 | 2026-07-11 | 541 | `AKfycbxy…` | Chainway scan delivery: disable top-frame poll race, 350ms delivery dedup, retire early-boot double listener; fix split module parse boundaries |
| 7 | 2026-07-11 | 540 | `AKfycbxy…` | Phase A station shell split: 20 modules, monolith-order regen, verify gates passed (golden 225d323f33f679d2) |
| 8 | 2026-07-11 | 539 | `AKfycbxy…` | REWIND station: restore v530 monolith shell, revert split + scan experiments |
| 9 | 2026-07-11 | 538 | `AKfycbxy…` | Scan dedup: fix double postMessage + 350ms delivery-only dedup (not 1500ms rescan block) |
| 10 | 2026-07-11 | 537 | `AKfycbxy…` | Chainway scan delivery: early iframe ready, host scan buffer, gate poll until listener wired |
| 11 | 2026-07-11 | 536 | `AKfycbxy…` | Station split: restore monolith eval order (v530 scan path), revert post-split scan patches |
| 12 | 2026-07-11 | 535 | `AKfycbxy…` | Chainway: single scan delivery path, fix scanBusy blocking equipment reads |
| 13 | 2026-07-11 | 534 | `AKfycbxy…` | Chainway: fix first-boot scan race + hold scan mode UI; multi beep (web) |
| 14 | 2026-07-11 | 533 | `AKfycbxy…` | Station shell split Phase A (behavior-neutral, parse-checked) |
| 15 | 2026-07-11 | 530 | `AKfycbxy…` | REWIND POINT (major): Chainway sled + TSL desktop RFID baseline before 11-series UI split — see docs/ai/active/REWIND-pre-station-ui-split.md |
| 16 | 2026-07-11 | 529 | `AKfycbxy…` | TSL desktop: never restore crew host on cold start (v0.1.44, host-boot 499) |
| 17 | 2026-07-11 | 528 | `AKfycbxy…` | Desktop v0.1.43: fix disconnect/reconnect gun relay on nested iframe |
| 18 | 2026-07-11 | 527 | `AKfycbxy…` | Desktop v0.1.42: fix settings relay to native gun; quiet gun-config log spam |
| 19 | 2026-07-11 | 526 | `AKfycbxy…` | Desktop v0.1.41: fix TSL settings bridge from nested iframe; host-boot SR_STATION_GUN relay |
| 20 | 2026-07-11 | 525 | `AKfycbxy…` | Desktop v0.1.38: nested GAS iframe scan forward + session to top |
| 21 | 2026-07-11 | 524 | `AKfycbxy…` | Desktop v0.1.35: fix false shellReady, iframe session sync, float feed ID collision |
| 22 | 2026-07-11 | 523 | `AKfycbxy…` | Station desktop: exempt kiosk from auto-login-off session block |
| 23 | 2026-07-11 | 522 | `AKfycbxy…` | Fix scan feed wipe: stationRecentScans + full message listener |
| 24 | 2026-07-11 | 521 | `AKfycbxy…` | Station shell: hide float feed when real scan panel active |
| 25 | 2026-07-11 | 520 | `AKfycbxy…` | Desktop v0.1.29: station shim early boot + live feed before LogicPayload |
| 26 | 2026-07-11 | 519 | `AKfycbxy…` | Desktop scan: inject __srScanQueue + frame diagnostics; desktop queue poll |
| 27 | 2026-07-11 | 518 | `AKfycbxy…` | Fix station early-boot postMessage listener; desktop ExecuteScript scan feed fallback |
| 28 | 2026-07-11 | 517 | `AKfycbxy…` | Desktop scan relay: ExecuteScript into GAS iframe; early feed stub |
| 29 | 2026-07-11 | 516 | `AKfycbxy…` | Station desktop v0.1.24: live RFID feed relay via frame PostWebMessage; scan feed before dedup |
| 30 | 2026-07-11 | 515 | `AKfycbxy…` | TSL desktop: single scan mode, settings wired, early RFID scan queue for live strip |
| 31 | 2026-07-11 | 514 | `AKfycbxy…` | TSL desktop v0.1.12: scan busy timeout, single trigger read |
| 32 | 2026-07-11 | 513 | `AKfycbxy…` | TSL desktop v0.1.11: scan feed + host path fixes, crew roster in scan panel |
| 33 | 2026-07-11 | 512 | `AKfycbxy…` | TSL desktop v0.1.10: host badge status + TID read path |
| 34 | 2026-07-11 | 511 | `AKfycbxy…` | TSL desktop v0.1.6: gun sleep postMessage fix, scan relay to iframe, host badge feedback |
| 35 | 2026-07-11 | 510 | `AKfycbxy…` | TSL desktop v0.1.5: fix gun connect regression (threading + watchdog boot order) |
| 36 | 2026-07-11 | 509 | `AKfycbxy…` | TSL desktop v0.1.4: reconnect and sleep gun via WebView2 + SDK SleepCommand |
| 37 | 2026-07-11 | 508 | `AKfycbxy…` | TSL desktop scan delivery: WebView2 iframe bridge + direct onStationRfidScan |
| 38 | 2026-07-11 | 507 | `AKfycbxy…` | TSL desktop v0.1.2: trigger inventory like Explorer, fix 10-29 dBm power, skip push banner on desktop |
| 39 | 2026-07-11 | 506 | `AKfycbxy…` | TSL desktop: iframe gun relay (reconnect/sleep/poll) + inventory read fix |
| 40 | 2026-07-10 | 505 | `AKfycbxy…` | Chainway disconnect beep + no-host auto park (autoSdkPark); APK build 53 |
| 41 | 2026-07-10 | 504 | `AKfycbxy…` | Chainway: disable auto SDK park — partial disconnect leaves BT up and breaks HID wake |
| 42 | 2026-07-10 | 503 | `AKfycbxy…` | Park timing hints + clarify grace vs firmware sleep; APK build 51 HID dispatchKeyEvent fix |
| 43 | 2026-07-10 | 502 | `AKfycbxy…` | Chainway no-host park timers + HID/SDK 3-state trigger reconnect (APK build 50) |
| 44 | 2026-07-10 | 501 | `AKfycbxy…` | Station: reject host badge scans while someone is signed in — must LOG OUT HOST first |
| 45 | 2026-07-10 | 500 | `AKfycbxy…` | Chainway stay-connected: appSleep false, native sleepGun no-op, BLE held open (build 49) |
| 46 | 2026-07-08 | 499 | `AKfycbxy…` | Fix station UI: early boot on ShowrunnerStation UA + meta before async LogicPayload |
| 47 | 2026-07-08 | 498 | `AKfycbxy…` | Fix Chainway gun sleep: idle timer was resetting on every config refresh — arm only on boot/save/first-connect. sleepGun disconnects BLE immediately, firmware awaitSleep pinned to SDK min (1min). No free() so watchdog cannot race reconnect. |
| 48 | 2026-07-08 | 497 | `AKfycbxy…` | Chainway gun sleep: native trigger-idle timer (setGunIdleSleepMinutes) powers down after no trigger pull — not scan-based JS disconnect. Driver cap nativeIdleSleep for chainway_handheld. |
| 49 | 2026-07-08 | 496 | `AKfycbxy…` | Station settings: per-station namespaced storage (profileName-scoped, migrates legacy global keys) so each station keeps its own power/scan-mode/poll/beep/eject/gun-sleep. Enable idle gun-sleep timer for BOTH guns via each driver's own SDK (Chainway appSleep:true -> resumable RfidManager.sleepGun; TSL .sl) - shared settings view, separate driver pools. Starting point for Chainway stays-on debugging. |
| 50 | 2026-07-08 | 495 | `AKfycbxy…` | Fork station gun drivers per layout (11a_Station_Gun_Drivers): Chainway/TSL/gate isolated by caps. Revert Chainway regression — appSleep only for TSL, trigger-wake restored. Docs updated. |

---

**Rollback production:** Tell the AI *"Rollback production to last milestone"*.
