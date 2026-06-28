# Push notifications

**Entry:** [AI_DOCTRINE.md](../../AI_DOCTRINE.md) · **Index:** [Project_TODO.md](../Project_TODO.md)

**Last swept:** 2026-06-28 (codebase @ GAS **v345**)

**Canonical topic file** for all notification work. Recovery re-ship: [active/recovery-after-v330.md](../active/recovery-after-v330.md) Steps C–D.

**Users must open:** https://sm-showrunner-97405.web.app

---

## Architecture (Option 1 — chosen)

Firebase Hosting + FCM + Apps Script backend. Event-driven batch sends. No secrets in this doc.

---

## Shipped (verified in codebase)

### Infrastructure & admin
- [x] Firebase Hosting shell, service worker, `push-hosting/`
- [x] `Notifications_Store.js`, `Notifications_Push.js`, `Notifications_Dispatch.js`
- [x] `Main.js` — `fcfg`, `fcmreg`; `10a` iframe bridge; `10c` ROOT DATABASE panel
- [x] `saveMyFcmDeviceToken` + parent token rebroadcast (`host-boot.js`)
- [x] **Multi-device tokens** per user (`getFcmDevicesForUid_` / device list in DATABASE)
- [x] ROOT **test push** + per-device test (`sendTestPushNotification`, `sendTestPushToDevice`)
- [x] PWA session hardening (v328+) — see `RELEASES.md`
- [x] Foreground: host toast over iframe + SW → client bridge + iframe `refreshData()` (v344–v345)
- [x] FCM **data-only** payload (avoids double system notification in background)

### Dispatch core
- [x] `dispatchPushToUsers` / `dispatchPushToIdentifiers` — batch FCM + audit log entry
- [x] UID resolution for push targets (`resolveVaultUidForPush_`)

### Event hooks (live today)
- [x] **Timeline:** crew added to schedule → in-app notif + FCM push
- [x] **Timeline:** shift time changed → in-app notif + FCM push
- [x] **Tasks:** new task assignees → in-app notif + FCM push
- [x] **Weather:** in-app Notifications sheet rows with **same-day dedupe** (`dispatchWeatherAlerts`) — **not FCM yet**

---

## Open / not shipped

### Registration & reliability
- [ ] Reliable **iPhone** registration (Add to Home Screen path; Safari quirks)
- [ ] Phone **push service error** edge cases (see DATABASE yellow state)

### Scenarios not wired to FCM
- [ ] Project assign / remove (beyond timeline shift rows)
- [ ] Truck / logistics timeline save
- [ ] Show-day / master timeline bulk changes (debounced)
- [ ] Crew shift conflict report
- [ ] Checklist milestone → PM
- [ ] Manager overdue jobs cron (offer, invoice, staffing)
- [ ] **Weather → FCM** (sheet-only today)

### Product rules
- [ ] Per-user notification preferences (type toggles)
- [ ] Explicit **debounce/coalesce** for rapid timeline edits
- [ ] In-app **drawer/toast sync** polish — verify shift-assign path on web.app (Step D follow-up)

### Recovery Step C (re-merge after rollback)
- [ ] Re-verify expanded v330 dispatch hooks if re-applied
- [ ] UID normalization for in-app notification rows
- [ ] Full test matrix: assign, remove, shift (other user), truck, cancel, new event → managers

---

## Key files

| File | Role |
|------|------|
| `push-hosting/public/host-boot.js` | FCM, session, iframe, foreground handler |
| `Notifications_Store.js` | Multi-device token storage |
| `Notifications_Push.js` | FCM HTTP v1 send |
| `Notifications_Dispatch.js` | Push dispatch helpers |
| `Logistics_Timeline.js` | Timeline save → push |
| `Logistics_Tasks.js` | Task assign → push; weather sheet alerts |
| `10a_Notifications_Boot.html`, `10c_Notifications_Admin.html` | UI |

---

## Deploy

```powershell
node milestone.js "note"     # GAS
node deploy-hosting.js       # Firebase Hosting
```

**Production log:** root `RELEASES.md`
