# Production Milestones (Apps Script versions)

Created only on **Milestone** / **OK ship** / **Milestone now** — not on every "This works".

| # | Date | GAS version | Deployment | Note |
|---|------|-------------|------------|------|
| 1 | 2026-07-08 | 484 | `AKfycbxy…` | Revert v483 direct-GAS BLE fix; restore v482 hosting shell behavior |
| 2 | 2026-07-08 | 483 | `AKfycbxy…` | BLE reconnect fix: native GAS direct load, host session persist, flap guard |
| 3 | 2026-07-07 | 482 | `AKfycbxy…` | Wall-clock host eject deadline survives screen sleep; gun-active keep screen on APK |
| 4 | 2026-07-07 | 481 | `AKfycbxy…` | Optimistic host login: local crew EPC+TID roster cache, instant badge-in then server confirm |
| 5 | 2026-07-07 | 480 | `AKfycbxy…` | Fix false clone alerts: missing TID is not clone; TID length tolerance |
| 6 | 2026-07-07 | 479 | `AKfycbxy…` | Explicit EPC/TID bank reads for factory UHF badges |
| 7 | 2026-07-07 | 478 | `AKfycbxy…` | Reject EPC-echo TID on enroll; fix Chainway readData EPC filter bit params |
| 8 | 2026-07-07 | 477 | `AKfycbxy…` | Fix Crew_Roster schema repair: rfid_tid column width mismatch on vault sync |
| 9 | 2026-07-07 | 476 | `AKfycbxy…` | Crew enroll requires TID; explicit error when gun omits chip ID |
| 10 | 2026-07-07 | 475 | `AKfycbxy…` | Crew badges: EPC+TID schema (rfid_tid), soft-cutover pair login, native setEPCAndTIDMode |
| 11 | 2026-07-07 | 474 | `AKfycbxy…` | Station session survives sleep — sessioncheck retry, login boot grace, WebView reload |
| 12 | 2026-07-07 | 473 | `AKfycbxy…` | Milestone |
| 13 | 2026-07-07 | 472 | `AKfycbxy…` | Milestone |
| 14 | 2026-07-07 | 471 | `AKfycbxy…` | Milestone |
| 15 | 2026-07-07 | 470 | `AKfycbxy…` | v470 mobile QR: errors-only toast, uniform scan feed rows |
| 16 | 2026-07-07 | 469 | `AKfycbxy…` | v469 mobile QR: feed select, bottom panel labels, iOS camera decode fix |
| 17 | 2026-07-07 | 468 | `AKfycbxy…` | v468 mobile QR panel UX: feed-first panel, anchored cam overlay, auto-start |
| 18 | 2026-07-07 | 467 | `AKfycbxy…` | v467 mobile QR scan: stop post-scan loop — dedupe delivery, clear pending on reload |
| 19 | 2026-07-07 | 466 | `AKfycbxy…` | v466 mobile QR camera: iframe reload handoff via sessionboot srScan + campoll pull |
| 20 | 2026-07-07 | 465 | `AKfycbxy…` | Mobile scan: fix camera handoff — session token staging, relay burst, GAS iframe forward |
| 21 | 2026-07-07 | 464 | `AKfycbxy…` | Mobile scan: Operations-style vault lookup for RW-1000-20 composite codes |
| 22 | 2026-07-07 | 463 | `AKfycbxy…` | Mobile scan: stage primary key on server, simulate RW-1000-20, status line |
| 23 | 2026-07-07 | 462 | `AKfycbxy…` | Fix mobile scan freeze: restore shell embed fn, remove diagnostics overlay |
| 24 | 2026-07-07 | 461 | `AKfycbxy…` | v461: fix frozen UI — emergency overlay reset, debug off by default |
| 25 | 2026-07-07 | 460 | `AKfycbxy…` | v460: mobile scan diagnostics + simulate scan |
| 26 | 2026-07-07 | 459 | `AKfycbxy…` | v459: shell-native fullscreen QR camera + direct relay to app |
| 27 | 2026-07-07 | 458 | `AKfycbxy…` | v459: shell overlay camera — scan relays without unloading GAS iframe |
| 28 | 2026-07-06 | 457 | `AKfycbxy…` | v457: fix shell postMessage scan delivery (embed origin swallow bug) |
| 29 | 2026-07-06 | 456 | `AKfycbxy…` | v456: fix mobile scan injection after camera return (ACK + poll, no premature clear) |
| 30 | 2026-07-06 | 455 | `AKfycbxy…` | Mobile scan: resolve equipment after camera return |
| 31 | 2026-07-06 | 454 | `AKfycbxy…` | Mobile scan: preserve QR result across camera return |
| 32 | 2026-07-06 | 453 | `AKfycbxy…` | Mobile scan: OPEN CAMERA navigates to camera page |
| 33 | 2026-07-06 | 452 | `AKfycbxy…` | Mobile scan: fullscreen shell camera stage (Android iframe fix) |
| 34 | 2026-07-06 | 451 | `AKfycbxy…` | Mobile scan: shell camera-embed overlay (fix freeze) |
| 35 | 2026-07-06 | 450 | `AKfycbxy…` | Mobile scan: visible TAP TO START camera band |
| 36 | 2026-07-06 | 449 | `AKfycbxy…` | Milestone |
| 37 | 2026-07-06 | 448 | `AKfycbxy…` | Milestone |
| 38 | 2026-07-06 | 447 | `AKfycbxy…` | Milestone |
| 39 | 2026-07-06 | 446 | `AKfycbxy…` | Milestone |
| 40 | 2026-07-06 | 445 | `AKfycbxy…` | Milestone |
| 41 | 2026-07-06 | 444 | `AKfycbxy…` | Milestone |
| 42 | 2026-07-06 | 443 | `AKfycbxy…` | Milestone |
| 43 | 2026-07-06 | 442 | `AKfycbxy…` | Milestone |
| 44 | 2026-07-06 | 441 | `AKfycbxy…` | Milestone |
| 45 | 2026-07-06 | 440 | `AKfycbxy…` | Milestone |
| 46 | 2026-07-06 | 439 | `AKfycbxy…` | Milestone |
| 47 | 2026-07-06 | 438 | `AKfycbxy…` | Milestone |
| 48 | 2026-07-05 | 437 | `AKfycbxy…` | Milestone |
| 49 | 2026-07-05 | 436 | `AKfycbxy…` | Station: thinner header, full-height scan panel, sign out in settings |
| 50 | 2026-07-05 | 435 | `AKfycbxy…` | Station scan feed 24h, toasts, compact header; vault NEEDS CARE; BLE reconnect |

---

**Rollback production:** Tell the AI *"Rollback production to last milestone"*.
