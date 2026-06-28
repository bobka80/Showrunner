# Production Milestones (Apps Script versions)

Created only on **Milestone** / **OK ship** / **Milestone now** — not on every "This works".

| # | Date | GAS version | Deployment | Note |
|---|------|-------------|------------|------|
| 1 | 2026-06-28 | 355 | `AKfycbxy…` | Fix live DB folder ID — backups inside database folder |
| 2 | 2026-06-28 | 354 | `AKfycbxy…` | Canonical live DB folder 01_DATABASE — ENGINE/VAULT layout repair + restore/revert fix |
| 3 | 2026-06-28 | 353 | `AKfycbxy…` | Fix Drive folder date range from painted phases; rename/move folders on every save |
| 4 | 2026-06-28 | 352 | `AKfycbxy…` | Fix project save — timelines on anti-dup, project_uid column, save error UX |
| 5 | 2026-06-28 | 351 | `AKfycbxy…` | Step 3 — rule types basic/automated, agenda reminder fields, manual checklist save |
| 6 | 2026-06-28 | 350 | `AKfycbxy…` | Step 2 — Manager Hub 3-column layout, rename under drive, asset reminder list |
| 7 | 2026-06-28 | 349 | `AKfycbxy…` | Step 1 — per-manager config: rules, rename, sync, asset checklist templates in user vault |
| 8 | 2026-06-28 | 348 | `AKfycbxy…` | Task crew names, instant task cache, fix missed tasks filter |
| 9 | 2026-06-28 | 347 | `AKfycbxy…` | Notification click-to-event, bigger dismiss, remove snooze |
| 10 | 2026-06-28 | 346 | `AKfycbxy…` | Fast tasks/notifs refresh + fix clear notifications |
| 11 | 2026-06-28 | 345 | `AKfycbxy…` | Foreground host toast + task_view_all manager task list |
| 12 | 2026-06-28 | 344 | `AKfycbxy…` | Step D — foreground push toast + live notif/task refresh; fix bell render |
| 13 | 2026-06-28 | 343 | `AKfycbxy…` | Fix task/notif list — cross-match uid email name for crew |
| 14 | 2026-06-28 | 342 | `AKfycbxy…` | Step C — crew notifications: UID normalize, removed from schedule, task delete + weather FCM |
| 15 | 2026-06-28 | 341 | `AKfycbxy…` | Logout confirm modal + reliable login gate redirect on web.app |
| 16 | 2026-06-28 | 340 | `AKfycbxy…` | Mobile Personal Hub — name/logout, PIN, then theme order |
| 17 | 2026-06-28 | 339 | `AKfycbxy…` | Personal Hub layout polish — desktop bar, manager columns, mobile header icon, summarize doctrine |
| 18 | 2026-06-28 | 338 | `AKfycbxy…` | Personal Hub full desktop view + mobile ACCOUNT view; manager tools restored |
| 19 | 2026-06-28 | 337 | `AKfycbxy…` | Personal Hub UX — compact panel, nav order, PIN modal, mobile ACCOUNT row, manager tools parked |
| 20 | 2026-06-28 | 336 | `AKfycbxy…` | Personal Hub for all users — theme, logout, change PIN; manager tools gated inside same panel |
| 21 | 2026-06-27 | 335 | `AKfycbxy…` | Step A — break editor recursion (region label / distance visibility) |
| 22 | 2026-06-27 | 334 | `AKfycbxy…` | Rollback to v329 — before editor/notification regressions (v330–333) |
| 23 | 2026-06-27 | 329 | `AKfycbxy…` | Mobile home — brand header, sidebar nav icons; remove timeline shift popup |
| 24 | 2026-06-27 | 328 | `AKfycbxy…` | Harden PWA session — sessioncheck before boot, multi-device tokens |
| 25 | 2026-06-27 | 327 | `AKfycbxy…` | Fix mobile weather badges — use readinessState.isOutdoor |
| 26 | 2026-06-27 | 326 | `AKfycbxy…` | Mobile crew hub — sub-event strips, weather badge, read-only timeline footer strip |
| 27 | 2026-06-27 | 325 | `AKfycbxy…` | Fix mobile shift card CSS |
| 28 | 2026-06-27 | 324 | `AKfycbxy…` | Mobile timeline — MY SHIFTS strips + pinch-zoom full crew grid |
| 29 | 2026-06-27 | 323 | `AKfycbxy…` | PWA session on parent + hide push dock when registered |
| 30 | 2026-06-27 | 322 | `AKfycbxy…` | Device list — compact token hint, hover peek with copy |
| 31 | 2026-06-27 | 321 | `AKfycbxy…` | Fix database panel load — push styles out of innerHTML, safe device fetch |
| 32 | 2026-06-27 | 320 | `AKfycbxy…` | Push device list — Chrome/Safari colors, full white token |
| 33 | 2026-06-27 | 319 | `AKfycbxy…` | Push device list — tighter columns, OS/browser color coding |
| 34 | 2026-06-27 | 318 | `AKfycbxy…` | Push admin device list — larger type, column layout |
| 35 | 2026-06-27 | 317 | `AKfycbxy…` | Hotfix blank screen after login — boot errors, hosting iframe always loads |
| 36 | 2026-06-27 | 316 | `AKfycbxy…` | Fix duplicate push notifications and re-register prompt on app resume |
| 37 | 2026-06-27 | 315 | `AKfycbxy…` | Project editor location toolbar — region label, distance by pin, short geocode names |
| 38 | 2026-06-27 | 314 | `AKfycbxy…` | Mobile crew field UX — Crew Hub, phase rail, compact assets, timeline zoom, tasks |
| 39 | 2026-06-27 | 313 | `AKfycbxy…` | Mobile crew field UX — phase rail, briefing hub, zoom timeline, compact assets, tasks |
| 40 | 2026-06-27 | 312 | `AKfycbxy…` | Fleet device list — color-coded Mobile/Desktop and browsers |
| 41 | 2026-06-27 | 311 | `AKfycbxy…` | Fleet device registry — all crew in DATABASE push panel |
| 42 | 2026-06-27 | 310 | `AKfycbxy…` | 30-day stay signed in + skip push re-register on open |
| 43 | 2026-06-27 | 309 | `AKfycbxy…` | Push device list UI + crew/platform/browser metadata |
| 44 | 2026-06-27 | 308 | `AKfycbxy…` | Fix push display — foreground handler + FCM web payload |
| 45 | 2026-06-27 | 307 | `AKfycbxy…` | ROOT in push pool — self-test on own devices |
| 46 | 2026-06-27 | 306 | `AKfycbxy…` | Push admin UI — device list, token modal, notification icons |
| 47 | 2026-06-27 | 305 | `AKfycbxy…` | DATABASE Step 2-3 — sub-tabs Backup/Archive vs Ops/Notifications |
| 48 | 2026-06-27 | 304 | `AKfycbxy…` | DATABASE tab Step 1 — 200px after CLIENTS, orange style |
| 49 | 2026-06-27 | 303 | `AKfycbxy…` | Working notifications on Android |
| 50 | 2026-06-27 | 302 | `AKfycbxy…` | Push v305 — dedupe devices, prune dead tokens, compact saved bar |

---

**Rollback production:** Tell the AI *"Rollback production to last milestone"*.
