# Production Milestones (Apps Script versions)

Created only on **Milestone** / **OK ship** / **Milestone now** — not on every "This works".

| # | Date | GAS version | Deployment | Note |
|---|------|-------------|------------|------|
| 1 | 2026-06-26 | 296 | `AKfycbxy…` | Phase 2+3 — host-only push save, slim iframe bridge |
| 2 | 2026-06-26 | 295 | `AKfycbxy…` | Phase 1 PWA — Stage Masters A icon, install panel, standalone |
| 3 | 2026-06-26 | 294 | `AKfycbxy…` | Pre Phase 1 PWA — snapshot before home screen icon + standalone install |
| 4 | 2026-06-26 | 293 | `AKfycbxy…` | Push v295 — parent-side save on Save tap |
| 5 | 2026-06-26 | 292 | `AKfycbxy…` | Push v294 — dock layout fix + in-app Save button |
| 6 | 2026-06-26 | 291 | `AKfycbxy…` | Push link fix — reg key on APP_READY + Link button |
| 7 | 2026-06-26 | 290 | `AKfycbxy…` | Fix push save when already logged in — request FCM auth loop |
| 8 | 2026-06-26 | 289 | `AKfycbxy…` | Mobile push diagnostics — step status + boot reg key |
| 9 | 2026-06-26 | 288 | `AKfycbxy…` | Mobile push dock UI + in-app notification hint |
| 10 | 2026-06-26 | 287 | `AKfycbxy…` | Android push retries — fresh reg key every 12s |
| 11 | 2026-06-26 | 286 | `AKfycbxy…` | Android push — parent JSONP save via login key |
| 12 | 2026-06-26 | 285 | `AKfycbxy…` | Fix phone push — per-device registration check (not fooled by desktop) |
| 13 | 2026-06-26 | 284 | `AKfycbxy…` | Multi-device FCM tokens — push to phone and desktop |
| 14 | 2026-06-26 | 283 | `AKfycbxy…` | Silent push registration — remove copy/paste UI (hosting v285) |
| 15 | 2026-06-26 | 281 | `AKfycbxy…` | Add UrlFetchApp oauth scope for FCM push |
| 16 | 2026-06-26 | 280 | `AKfycbxy…` | Fix push button pointer-events |
| 17 | 2026-06-26 | 279 | `AKfycbxy…` | GET TOKEN FROM HOSTING button in DATABASE |
| 18 | 2026-06-26 | 278 | `AKfycbxy…` | Manual device token save + registration poll |
| 19 | 2026-06-26 | 277 | `AKfycbxy…` | Fix FCM token save JSONP bridge wait |
| 20 | 2026-06-26 | 276 | `AKfycbxy…` | FCM save via iframe google.script.run bridge |
| 21 | 2026-06-26 | 275 | `AKfycbxy…` | FCM token bridge — Hosting saves token to server |
| 22 | 2026-06-26 | 274 | `AKfycbxy…` | VAPID key validation and ROOT save UI |
| 23 | 2026-06-26 | 273 | `AKfycbxy…` | Push registration diagnostics and wrong-URL detection |
| 24 | 2026-06-26 | 272 | `AKfycbxy…` | Fix push token registration in Hosting iframe |
| 25 | 2026-06-26 | 271 | `AKfycbxy…` | FCM web app IDs fallback for push config |
| 26 | 2026-06-26 | 270 | `AKfycbxy…` | Fix fcfg endpoint — Firebase Hosting deploy |
| 27 | 2026-06-26 | 269 | `AKfycbxy…` | Push notifications Phase 1 — FCM plumbing + Firebase Hosting shell |
| 28 | 2026-06-26 | 268 | `AKfycbxy…` | Outdoor weather widget — compact chip, hover day strip, UI doctrine |
| 29 | 2026-06-26 | 267 | `AKfycbxy…` | RBAC sidebar permissions — view_logistics tracker gate, view_month_roster explicit grants |
| 30 | 2026-06-26 | 266 | `AKfycbx…` | Pre database operations panel — IAM and manager settings baseline |

---

**Rollback production:** Tell the AI *"Rollback production to last milestone"*.
