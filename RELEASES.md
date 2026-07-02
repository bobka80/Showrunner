# Production Milestones (Apps Script versions)

Created only on **Milestone** / **OK ship** / **Milestone now** — not on every "This works".

| # | Date | GAS version | Deployment | Note |
|---|------|-------------|------------|------|
| 1 | 2026-07-02 | 416 | `AKfycbxy…` | Milestone |
| 2 | 2026-07-02 | 415 | `AKfycbxy…` | Station setup: beeper checkbox defaults ON (reflects gun default). Paired with hosting cache-buster bump so the RFID scan + settings bridge (host-boot.js) actually refreshes on devices. |
| 3 | 2026-07-02 | 414 | `AKfycbxy…` | Station: fix RFID scan bridge (iframe postMessage relay so gun reads reach the app) + station setup view (configurable eject timer, gun power/sensitivity, scan mode, beeper) + configurable host-eject timeout |
| 4 | 2026-07-02 | 413 | `AKfycbxy…` | Station shell: always-on live RFID scan strip (top) + self-serve crew badge enrollment (Link my RFID badge -> enrollStationCrewRfidTag writes host rfid_tag) |
| 5 | 2026-07-02 | 412 | `AKfycbxy…` | Fix login crash: debugLog undefined in authenticateUser (Database Read Timeout) |
| 6 | 2026-07-02 | 411 | `AKfycbxy…` | Milestone |
| 7 | 2026-07-02 | 410 | `AKfycbxy…` | Milestone |
| 8 | 2026-07-02 | 409 | `AKfycbxy…` | Milestone |
| 9 | 2026-07-02 | 408 | `AKfycbxy…` | Milestone |
| 10 | 2026-07-01 | 407 | `AKfycbxy…` | Milestone |
| 11 | 2026-07-01 | 406 | `AKfycbxy…` | Milestone |
| 12 | 2026-07-01 | 405 | `AKfycbxy…` | Milestone |
| 13 | 2026-07-01 | 404 | `AKfycbxy…` | Milestone |
| 14 | 2026-07-01 | 403 | `AKfycbxy…` | Milestone |
| 15 | 2026-07-01 | 402 | `AKfycbxy…` | Milestone |
| 16 | 2026-07-01 | 401 | `AKfycbxy…` | Milestone |
| 17 | 2026-07-01 | 400 | `AKfycbxy…` | Milestone |
| 18 | 2026-07-01 | 399 | `AKfycbxy…` | Milestone |
| 19 | 2026-07-01 | 398 | `AKfycbxy…` | Milestone |
| 20 | 2026-07-01 | 397 | `AKfycbxy…` | Milestone |
| 21 | 2026-07-01 | 396 | `AKfycbxy…` | Milestone |
| 22 | 2026-07-01 | 395 | `AKfycbxy…` | Milestone |
| 23 | 2026-07-01 | 394 | `AKfycbxy…` | Milestone |
| 24 | 2026-07-01 | 393 | `AKfycbxy…` | Crew edit: allow name change by uid in Resources |
| 25 | 2026-07-01 | 392 | `AKfycbxy…` | Desktop auto-login opt-out; lock timer Disabled label; no emoji UI rule |
| 26 | 2026-07-01 | 391 | `AKfycbxy…` | Desktop lock: optional auto-lock Off in Personal Hub |
| 27 | 2026-07-01 | 390 | `AKfycbxy…` | Desktop lock digit fade-out 2x slower |
| 28 | 2026-07-01 | 389 | `AKfycbxy…` | Desktop lock dim: rounded blur fade, 50px tighter, vertical center |
| 29 | 2026-06-30 | 388 | `AKfycbxy…` | Desktop lock dim radius one-third height |
| 30 | 2026-06-30 | 387 | `AKfycbxy…` | Desktop lock dim rounded rectangle |
| 31 | 2026-06-30 | 386 | `AKfycbxy…` | Desktop lock dim outer fade 50px |
| 32 | 2026-06-30 | 385 | `AKfycbxy…` | Desktop lock dim resize sync |
| 33 | 2026-06-30 | 384 | `AKfycbxy…` | Desktop lock perimeter dim 50+100px + soft buses |
| 34 | 2026-06-30 | 383 | `AKfycbxy…` | Desktop lock clock crossfade + tighter glow |
| 35 | 2026-06-30 | 382 | `AKfycbxy…` | Desktop lock clock digit tick fade |
| 36 | 2026-06-30 | 381 | `AKfycbxy…` | Desktop lock clock soft glow no contour |
| 37 | 2026-06-30 | 380 | `AKfycbxy…` | Desktop lock clock gradient fade + bold Bahnschrift |
| 38 | 2026-06-30 | 379 | `AKfycbxy…` | Desktop lock clock panel + Bahnschrift |
| 39 | 2026-06-30 | 378 | `AKfycbxy…` | Exclude git-push-backup from GAS deploy |
| 40 | 2026-06-30 | 377 | `AKfycbxy…` | Desktop lock: fuzzy fade + instant prefix unlock + whiter clock |
| 41 | 2026-06-29 | 376 | `AKfycbxy…` | Milestone |
| 42 | 2026-06-29 | 375 | `AKfycbxy…` | Milestone |
| 43 | 2026-06-29 | 374 | `AKfycbxy…` | Milestone |
| 44 | 2026-06-29 | 373 | `AKfycbxy…` | Milestone |
| 45 | 2026-06-29 | 372 | `AKfycbxy…` | Milestone |
| 46 | 2026-06-29 | 371 | `AKfycbxy…` | Milestone |
| 47 | 2026-06-29 | 370 | `AKfycbxy…` | Milestone |
| 48 | 2026-06-29 | 369 | `AKfycbxy…` | Fix checkout mode switch bug, plain red frame, pack/unpack in packing mode |
| 49 | 2026-06-29 | 368 | `AKfycbxy…` | Mobile PA checkout red frame, per-item/container buttons, container cascade checkout, re-enable auto-save |
| 50 | 2026-06-29 | 367 | `AKfycbxy…` | Mobile PA check-in/out red UI + manual buttons |

---

**Rollback production:** Tell the AI *"Rollback production to last milestone"*.
