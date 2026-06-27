# Production Milestones (Apps Script versions)

Created only on **Milestone** / **OK ship** / **Milestone now** — not on every "This works".

| # | Date | GAS version | Deployment | Note |
|---|------|-------------|------------|------|
| 1 | 2026-06-27 | 318 | `AKfycbxy…` | Push admin device list — larger type, column layout |
| 2 | 2026-06-27 | 317 | `AKfycbxy…` | Hotfix blank screen after login — boot errors, hosting iframe always loads |
| 3 | 2026-06-27 | 316 | `AKfycbxy…` | Fix duplicate push notifications and re-register prompt on app resume |
| 4 | 2026-06-27 | 315 | `AKfycbxy…` | Project editor location toolbar — region label, distance by pin, short geocode names |
| 5 | 2026-06-27 | 314 | `AKfycbxy…` | Mobile crew field UX — Crew Hub, phase rail, compact assets, timeline zoom, tasks |
| 6 | 2026-06-27 | 313 | `AKfycbxy…` | Mobile crew field UX — phase rail, briefing hub, zoom timeline, compact assets, tasks |
| 7 | 2026-06-27 | 312 | `AKfycbxy…` | Fleet device list — color-coded Mobile/Desktop and browsers |
| 8 | 2026-06-27 | 311 | `AKfycbxy…` | Fleet device registry — all crew in DATABASE push panel |
| 9 | 2026-06-27 | 310 | `AKfycbxy…` | 30-day stay signed in + skip push re-register on open |
| 10 | 2026-06-27 | 309 | `AKfycbxy…` | Push device list UI + crew/platform/browser metadata |
| 11 | 2026-06-27 | 308 | `AKfycbxy…` | Fix push display — foreground handler + FCM web payload |
| 12 | 2026-06-27 | 307 | `AKfycbxy…` | ROOT in push pool — self-test on own devices |
| 13 | 2026-06-27 | 306 | `AKfycbxy…` | Push admin UI — device list, token modal, notification icons |
| 14 | 2026-06-27 | 305 | `AKfycbxy…` | DATABASE Step 2-3 — sub-tabs Backup/Archive vs Ops/Notifications |
| 15 | 2026-06-27 | 304 | `AKfycbxy…` | DATABASE tab Step 1 — 200px after CLIENTS, orange style |
| 16 | 2026-06-27 | 303 | `AKfycbxy…` | Working notifications on Android |
| 17 | 2026-06-27 | 302 | `AKfycbxy…` | Push v305 — dedupe devices, prune dead tokens, compact saved bar |
| 18 | 2026-06-27 | 301 | `AKfycbxy…` | Push v304 — iframe direct save via saveMyFcmDeviceToken |
| 19 | 2026-06-27 | 300 | `AKfycbxy…` | Push v303 — early session ping + link error surfacing |
| 20 | 2026-06-27 | 299 | `AKfycbxy…` | Push v302 — session heartbeat fixes false log-in prompt |
| 21 | 2026-06-27 | 298 | `AKfycbxy…` | Push v301 — account link via meta postMessage + fcmrefreshkey |
| 22 | 2026-06-26 | 297 | `AKfycbxy…` | Push v300 — account link bridge fallback |
| 23 | 2026-06-26 | 296 | `AKfycbxy…` | Phase 2+3 — host-only push save, slim iframe bridge |
| 24 | 2026-06-26 | 295 | `AKfycbxy…` | Phase 1 PWA — Stage Masters A icon, install panel, standalone |
| 25 | 2026-06-26 | 294 | `AKfycbxy…` | Pre Phase 1 PWA — snapshot before home screen icon + standalone install |
| 26 | 2026-06-26 | 293 | `AKfycbxy…` | Push v295 — parent-side save on Save tap |
| 27 | 2026-06-26 | 292 | `AKfycbxy…` | Push v294 — dock layout fix + in-app Save button |
| 28 | 2026-06-26 | 291 | `AKfycbxy…` | Push link fix — reg key on APP_READY + Link button |
| 29 | 2026-06-26 | 290 | `AKfycbxy…` | Fix push save when already logged in — request FCM auth loop |
| 30 | 2026-06-26 | 289 | `AKfycbxy…` | Mobile push diagnostics — step status + boot reg key |
| 31 | 2026-06-26 | 288 | `AKfycbxy…` | Mobile push dock UI + in-app notification hint |
| 32 | 2026-06-26 | 287 | `AKfycbxy…` | Android push retries — fresh reg key every 12s |
| 33 | 2026-06-26 | 286 | `AKfycbxy…` | Android push — parent JSONP save via login key |
| 34 | 2026-06-26 | 285 | `AKfycbxy…` | Fix phone push — per-device registration check (not fooled by desktop) |
| 35 | 2026-06-26 | 284 | `AKfycbxy…` | Multi-device FCM tokens — push to phone and desktop |
| 36 | 2026-06-26 | 283 | `AKfycbxy…` | Silent push registration — remove copy/paste UI (hosting v285) |
| 37 | 2026-06-26 | 281 | `AKfycbxy…` | Add UrlFetchApp oauth scope for FCM push |
| 38 | 2026-06-26 | 280 | `AKfycbxy…` | Fix push button pointer-events |
| 39 | 2026-06-26 | 279 | `AKfycbxy…` | GET TOKEN FROM HOSTING button in DATABASE |
| 40 | 2026-06-26 | 278 | `AKfycbxy…` | Manual device token save + registration poll |
| 41 | 2026-06-26 | 277 | `AKfycbxy…` | Fix FCM token save JSONP bridge wait |
| 42 | 2026-06-26 | 276 | `AKfycbxy…` | FCM save via iframe google.script.run bridge |
| 43 | 2026-06-26 | 275 | `AKfycbxy…` | FCM token bridge — Hosting saves token to server |
| 44 | 2026-06-26 | 274 | `AKfycbxy…` | VAPID key validation and ROOT save UI |
| 45 | 2026-06-26 | 273 | `AKfycbxy…` | Push registration diagnostics and wrong-URL detection |
| 46 | 2026-06-26 | 272 | `AKfycbxy…` | Fix push token registration in Hosting iframe |
| 47 | 2026-06-26 | 271 | `AKfycbxy…` | FCM web app IDs fallback for push config |
| 48 | 2026-06-26 | 270 | `AKfycbxy…` | Fix fcfg endpoint — Firebase Hosting deploy |
| 49 | 2026-06-26 | 269 | `AKfycbxy…` | Push notifications Phase 1 — FCM plumbing + Firebase Hosting shell |
| 50 | 2026-06-26 | 268 | `AKfycbxy…` | Outdoor weather widget — compact chip, hover day strip, UI doctrine |

---

**Rollback production:** Tell the AI *"Rollback production to last milestone"*.
