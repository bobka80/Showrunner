# Production Milestones (Apps Script versions)

Created only on **Milestone** / **OK ship** / **Milestone now** — not on every "This works".

| # | Date | GAS version | Deployment | Note |
|---|------|-------------|------------|------|
| 1 | 2026-06-26 | 290 | `AKfycbxy…` | Fix push save when already logged in — request FCM auth loop |
| 2 | 2026-06-26 | 289 | `AKfycbxy…` | Mobile push diagnostics — step status + boot reg key |
| 3 | 2026-06-26 | 288 | `AKfycbxy…` | Mobile push dock UI + in-app notification hint |
| 4 | 2026-06-26 | 287 | `AKfycbxy…` | Android push retries — fresh reg key every 12s |
| 5 | 2026-06-26 | 286 | `AKfycbxy…` | Android push — parent JSONP save via login key |
| 6 | 2026-06-26 | 285 | `AKfycbxy…` | Fix phone push — per-device registration check (not fooled by desktop) |
| 7 | 2026-06-26 | 284 | `AKfycbxy…` | Multi-device FCM tokens — push to phone and desktop |
| 8 | 2026-06-26 | 283 | `AKfycbxy…` | Silent push registration — remove copy/paste UI (hosting v285) |
| 9 | 2026-06-26 | 281 | `AKfycbxy…` | Add UrlFetchApp oauth scope for FCM push |
| 10 | 2026-06-26 | 280 | `AKfycbxy…` | Fix push button pointer-events |
| 11 | 2026-06-26 | 279 | `AKfycbxy…` | GET TOKEN FROM HOSTING button in DATABASE |
| 12 | 2026-06-26 | 278 | `AKfycbxy…` | Manual device token save + registration poll |
| 13 | 2026-06-26 | 277 | `AKfycbxy…` | Fix FCM token save JSONP bridge wait |
| 14 | 2026-06-26 | 276 | `AKfycbxy…` | FCM save via iframe google.script.run bridge |
| 15 | 2026-06-26 | 275 | `AKfycbxy…` | FCM token bridge — Hosting saves token to server |
| 16 | 2026-06-26 | 274 | `AKfycbxy…` | VAPID key validation and ROOT save UI |
| 17 | 2026-06-26 | 273 | `AKfycbxy…` | Push registration diagnostics and wrong-URL detection |
| 18 | 2026-06-26 | 272 | `AKfycbxy…` | Fix push token registration in Hosting iframe |
| 19 | 2026-06-26 | 271 | `AKfycbxy…` | FCM web app IDs fallback for push config |
| 20 | 2026-06-26 | 270 | `AKfycbxy…` | Fix fcfg endpoint — Firebase Hosting deploy |
| 21 | 2026-06-26 | 269 | `AKfycbxy…` | Push notifications Phase 1 — FCM plumbing + Firebase Hosting shell |
| 22 | 2026-06-26 | 268 | `AKfycbxy…` | Outdoor weather widget — compact chip, hover day strip, UI doctrine |
| 23 | 2026-06-26 | 267 | `AKfycbxy…` | RBAC sidebar permissions — view_logistics tracker gate, view_month_roster explicit grants |
| 24 | 2026-06-26 | 266 | `AKfycbx…` | Pre database operations panel — IAM and manager settings baseline |

---

**Rollback production:** Tell the AI *"Rollback production to last milestone"*.
