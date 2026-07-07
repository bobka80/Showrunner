# Production Milestones (Apps Script versions)

Created only on **Milestone** / **OK ship** / **Milestone now** — not on every "This works".

| # | Date | GAS version | Deployment | Note |
|---|------|-------------|------------|------|
| 1 | 2026-07-07 | 460 | `AKfycbxy…` | v460: mobile scan diagnostics + simulate scan |
| 2 | 2026-07-07 | 459 | `AKfycbxy…` | v459: shell-native fullscreen QR camera + direct relay to app |
| 3 | 2026-07-07 | 458 | `AKfycbxy…` | v459: shell overlay camera — scan relays without unloading GAS iframe |
| 4 | 2026-07-06 | 457 | `AKfycbxy…` | v457: fix shell postMessage scan delivery (embed origin swallow bug) |
| 5 | 2026-07-06 | 456 | `AKfycbxy…` | v456: fix mobile scan injection after camera return (ACK + poll, no premature clear) |
| 6 | 2026-07-06 | 455 | `AKfycbxy…` | Mobile scan: resolve equipment after camera return |
| 7 | 2026-07-06 | 454 | `AKfycbxy…` | Mobile scan: preserve QR result across camera return |
| 8 | 2026-07-06 | 453 | `AKfycbxy…` | Mobile scan: OPEN CAMERA navigates to camera page |
| 9 | 2026-07-06 | 452 | `AKfycbxy…` | Mobile scan: fullscreen shell camera stage (Android iframe fix) |
| 10 | 2026-07-06 | 451 | `AKfycbxy…` | Mobile scan: shell camera-embed overlay (fix freeze) |
| 11 | 2026-07-06 | 450 | `AKfycbxy…` | Mobile scan: visible TAP TO START camera band |
| 12 | 2026-07-06 | 449 | `AKfycbxy…` | Milestone |
| 13 | 2026-07-06 | 448 | `AKfycbxy…` | Milestone |
| 14 | 2026-07-06 | 447 | `AKfycbxy…` | Milestone |
| 15 | 2026-07-06 | 446 | `AKfycbxy…` | Milestone |
| 16 | 2026-07-06 | 445 | `AKfycbxy…` | Milestone |
| 17 | 2026-07-06 | 444 | `AKfycbxy…` | Milestone |
| 18 | 2026-07-06 | 443 | `AKfycbxy…` | Milestone |
| 19 | 2026-07-06 | 442 | `AKfycbxy…` | Milestone |
| 20 | 2026-07-06 | 441 | `AKfycbxy…` | Milestone |
| 21 | 2026-07-06 | 440 | `AKfycbxy…` | Milestone |
| 22 | 2026-07-06 | 439 | `AKfycbxy…` | Milestone |
| 23 | 2026-07-06 | 438 | `AKfycbxy…` | Milestone |
| 24 | 2026-07-05 | 437 | `AKfycbxy…` | Milestone |
| 25 | 2026-07-05 | 436 | `AKfycbxy…` | Station: thinner header, full-height scan panel, sign out in settings |
| 26 | 2026-07-05 | 435 | `AKfycbxy…` | Station scan feed 24h, toasts, compact header; vault NEEDS CARE; BLE reconnect |
| 27 | 2026-07-05 | 434 | `AKfycbxy…` | Fix saveAsset isBulk regression after status_note field |
| 28 | 2026-07-05 | 433 | `AKfycbxy…` | Station: scan panel layout, CW1 header, dedup scans, Damaged+problem note |
| 29 | 2026-07-04 | 432 | `AKfycbxy…` | Station checkout gun bridge, live strip status, cleanup build |
| 30 | 2026-07-04 | 431 | `AKfycbxy…` | Station scan panel tab dropdown, multi-scan mode, settings Done fix |
| 31 | 2026-07-04 | 430 | `AKfycbxy…` | v430 — Station scan panel (sensitivity presets, Damaged/Broken/Repaired + status_note schema); BLE reconnect WebView hardening in APK 0.1.12 |
| 32 | 2026-07-03 | 429 | `AKfycbxy…` | v429 — SECURITY: removed login debug diagnostic that leaked crew passcodes to the lock screen; failed logins now return only "Incorrect crew name or passcode." |
| 33 | 2026-07-03 | 428 | `AKfycbxy…` | v428 — Duplicate RFID guard: whole-DB check before record/enroll; Overwrite/Cancel prompt; force steal with audit |
| 34 | 2026-07-03 | 427 | `AKfycbxy…` | v427 — Station boot hardening: show shell + send native SHOWRUNNER_STATION_READY FIRST, then wrap the rest of init + bootstrap callback in try/catch so a boot-time throw can no longer strand the initial screen (surfaces the error on-screen instead). Fixes station not loading initial screen. |
| 35 | 2026-07-03 | 426 | `AKfycbxy…` | v426 — Station checkout fix: asset-operation backend calls now send the HOST as actor (assetOpsActor), not the low-tier device account, so hosted managers/root can Design/Pack/Checkout (was 'permission denied: cannot edit project assets'). Restore host-inherit RBAC globals on reload. Checkout now follows host credentials (removed misleading any-host button); status stays the any-host baseline. |
| 36 | 2026-07-03 | 425 | `AKfycbxy…` | v425 — Station host-inherit RBAC: hosted user's real tier/permissions drive Project Assets (Design/Packing/Checkout); any-host checkout baseline (operate-only); ROOT-only Vault Crew tab for badge provisioning; enrollStationCrewRfidTag ROOT-gated + blocks device profiles; pristine device reset on eject/logout |
| 37 | 2026-07-03 | 424 | `AKfycbxy…` | v424 Station PROJECT open: preload on init/badge, phantom fallback for picked project, detect+recover the silent 'equipment list unavailable' bail, status breadcrumbs |
| 38 | 2026-07-03 | 423 | `AKfycbxy…` | v423 Station Vault logical-parent rollup (identical units collapse under ▶ folder, cascade tags untagged units) + PROJECT picker fetches host-scoped projects and preloads on badge-in |
| 39 | 2026-07-03 | 422 | `AKfycbxy…` | Milestone |
| 40 | 2026-07-02 | 421 | `AKfycbxy…` | Milestone |
| 41 | 2026-07-02 | 420 | `AKfycbxy…` | Milestone |
| 42 | 2026-07-02 | 419 | `AKfycbxy…` | Milestone |
| 43 | 2026-07-02 | 418 | `AKfycbxy…` | Milestone |
| 44 | 2026-07-02 | 417 | `AKfycbxy…` | Milestone |
| 45 | 2026-07-02 | 416 | `AKfycbxy…` | Milestone |
| 46 | 2026-07-02 | 415 | `AKfycbxy…` | Station setup: beeper checkbox defaults ON (reflects gun default). Paired with hosting cache-buster bump so the RFID scan + settings bridge (host-boot.js) actually refreshes on devices. |
| 47 | 2026-07-02 | 414 | `AKfycbxy…` | Station: fix RFID scan bridge (iframe postMessage relay so gun reads reach the app) + station setup view (configurable eject timer, gun power/sensitivity, scan mode, beeper) + configurable host-eject timeout |
| 48 | 2026-07-02 | 413 | `AKfycbxy…` | Station shell: always-on live RFID scan strip (top) + self-serve crew badge enrollment (Link my RFID badge -> enrollStationCrewRfidTag writes host rfid_tag) |
| 49 | 2026-07-02 | 412 | `AKfycbxy…` | Fix login crash: debugLog undefined in authenticateUser (Database Read Timeout) |
| 50 | 2026-07-02 | 411 | `AKfycbxy…` | Milestone |

---

**Rollback production:** Tell the AI *"Rollback production to last milestone"*.
