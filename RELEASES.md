# Production Milestones (Apps Script versions)

Created only on **Milestone** / **OK ship** / **Milestone now** — not on every "This works".

| # | Date | GAS version | Deployment | Note |
|---|------|-------------|------------|------|
| 1 | 2026-06-28 | 337 | `AKfycbxy…` | Personal Hub UX — compact panel, nav order, PIN modal, mobile ACCOUNT row, manager tools parked |
| 2 | 2026-06-28 | 336 | `AKfycbxy…` | Personal Hub for all users — theme, logout, change PIN; manager tools gated inside same panel |
| 3 | 2026-06-27 | 335 | `AKfycbxy…` | Step A — break editor recursion (region label / distance visibility) |
| 4 | 2026-06-27 | 334 | `AKfycbxy…` | Rollback to v329 — before editor/notification regressions (v330–333) |
| 5 | 2026-06-27 | 329 | `AKfycbxy…` | Mobile home — brand header, sidebar nav icons; remove timeline shift popup |
| 6 | 2026-06-27 | 328 | `AKfycbxy…` | Harden PWA session — sessioncheck before boot, multi-device tokens |
| 7 | 2026-06-27 | 327 | `AKfycbxy…` | Fix mobile weather badges — use readinessState.isOutdoor |
| 8 | 2026-06-27 | 326 | `AKfycbxy…` | Mobile crew hub — sub-event strips, weather badge, read-only timeline footer strip |
| 9 | 2026-06-27 | 325 | `AKfycbxy…` | Fix mobile shift card CSS |
| 10 | 2026-06-27 | 324 | `AKfycbxy…` | Mobile timeline — MY SHIFTS strips + pinch-zoom full crew grid |
| 11 | 2026-06-27 | 323 | `AKfycbxy…` | PWA session on parent + hide push dock when registered |
| 12 | 2026-06-27 | 322 | `AKfycbxy…` | Device list — compact token hint, hover peek with copy |
| 13 | 2026-06-27 | 321 | `AKfycbxy…` | Fix database panel load — push styles out of innerHTML, safe device fetch |
| 14 | 2026-06-27 | 320 | `AKfycbxy…` | Push device list — Chrome/Safari colors, full white token |
| 15 | 2026-06-27 | 319 | `AKfycbxy…` | Push device list — tighter columns, OS/browser color coding |
| 16 | 2026-06-27 | 318 | `AKfycbxy…` | Push admin device list — larger type, column layout |
| 17 | 2026-06-27 | 317 | `AKfycbxy…` | Hotfix blank screen after login — boot errors, hosting iframe always loads |
| 18 | 2026-06-27 | 316 | `AKfycbxy…` | Fix duplicate push notifications and re-register prompt on app resume |
| 19 | 2026-06-27 | 315 | `AKfycbxy…` | Project editor location toolbar — region label, distance by pin, short geocode names |
| 20 | 2026-06-27 | 314 | `AKfycbxy…` | Mobile crew field UX — Crew Hub, phase rail, compact assets, timeline zoom, tasks |
| 21 | 2026-06-27 | 313 | `AKfycbxy…` | Mobile crew field UX — phase rail, briefing hub, zoom timeline, compact assets, tasks |
| 22 | 2026-06-27 | 312 | `AKfycbxy…` | Fleet device list — color-coded Mobile/Desktop and browsers |
| 23 | 2026-06-27 | 311 | `AKfycbxy…` | Fleet device registry — all crew in DATABASE push panel |
| 24 | 2026-06-27 | 310 | `AKfycbxy…` | 30-day stay signed in + skip push re-register on open |
| 25 | 2026-06-27 | 309 | `AKfycbxy…` | Push device list UI + crew/platform/browser metadata |
| 26 | 2026-06-27 | 308 | `AKfycbxy…` | Fix push display — foreground handler + FCM web payload |
| 27 | 2026-06-27 | 307 | `AKfycbxy…` | ROOT in push pool — self-test on own devices |
| 28 | 2026-06-27 | 306 | `AKfycbxy…` | Push admin UI — device list, token modal, notification icons |
| 29 | 2026-06-27 | 305 | `AKfycbxy…` | DATABASE Step 2-3 — sub-tabs Backup/Archive vs Ops/Notifications |
| 30 | 2026-06-27 | 304 | `AKfycbxy…` | DATABASE tab Step 1 — 200px after CLIENTS, orange style |
| 31 | 2026-06-27 | 303 | `AKfycbxy…` | Working notifications on Android |
| 32 | 2026-06-27 | 302 | `AKfycbxy…` | Push v305 — dedupe devices, prune dead tokens, compact saved bar |
| 33 | 2026-06-27 | 301 | `AKfycbxy…` | Push v304 — iframe direct save via saveMyFcmDeviceToken |
| 34 | 2026-06-27 | 300 | `AKfycbxy…` | Push v303 — early session ping + link error surfacing |
| 35 | 2026-06-27 | 299 | `AKfycbxy…` | Push v302 — session heartbeat fixes false log-in prompt |
| 36 | 2026-06-27 | 298 | `AKfycbxy…` | Push v301 — account link via meta postMessage + fcmrefreshkey |
| 37 | 2026-06-26 | 297 | `AKfycbxy…` | Push v300 — account link bridge fallback |
| 38 | 2026-06-26 | 296 | `AKfycbxy…` | Phase 2+3 — host-only push save, slim iframe bridge |
| 39 | 2026-06-26 | 295 | `AKfycbxy…` | Phase 1 PWA — Stage Masters A icon, install panel, standalone |
| 40 | 2026-06-26 | 294 | `AKfycbxy…` | Pre Phase 1 PWA — snapshot before home screen icon + standalone install |
| 41 | 2026-06-26 | 293 | `AKfycbxy…` | Push v295 — parent-side save on Save tap |
| 42 | 2026-06-26 | 292 | `AKfycbxy…` | Push v294 — dock layout fix + in-app Save button |
| 43 | 2026-06-26 | 291 | `AKfycbxy…` | Push link fix — reg key on APP_READY + Link button |
| 44 | 2026-06-26 | 290 | `AKfycbxy…` | Fix push save when already logged in — request FCM auth loop |
| 45 | 2026-06-26 | 289 | `AKfycbxy…` | Mobile push diagnostics — step status + boot reg key |
| 46 | 2026-06-26 | 288 | `AKfycbxy…` | Mobile push dock UI + in-app notification hint |
| 47 | 2026-06-26 | 287 | `AKfycbxy…` | Android push retries — fresh reg key every 12s |
| 48 | 2026-06-26 | 286 | `AKfycbxy…` | Android push — parent JSONP save via login key |
| 49 | 2026-06-26 | 285 | `AKfycbxy…` | Fix phone push — per-device registration check (not fooled by desktop) |
| 50 | 2026-06-26 | 284 | `AKfycbxy…` | Multi-device FCM tokens — push to phone and desktop |

---

**Rollback production:** Tell the AI *"Rollback production to last milestone"*.
