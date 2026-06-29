# Push notifications — architecture & deploy

**Entry:** [AI_DOCTRINE.md](../../AI_DOCTRINE.md) · **Index:** [Project_TODO.md](../Project_TODO.md)

**Scenario checklist (have / need):** **[notifications-catalog.md](notifications-catalog.md)** — canonical inventory; do not duplicate checklists here.

**Recovery context:** [active/recovery-after-v330.md](../active/recovery-after-v330.md) Steps C–D.

**Users must open:** https://sm-showrunner-97405.web.app

**Last swept:** 2026-06-28 · **Code baseline:** GAS **v359**

---

## Architecture (Option 1 — chosen)

Firebase Hosting + FCM + Apps Script backend. Event-driven batch sends. No secrets in this doc.

| Layer | Role |
|-------|------|
| `push-hosting/` | PWA shell, service worker, FCM registration, foreground push bridge |
| `Notifications_Store.js` | Multi-device token storage |
| `Notifications_Push.js` | FCM HTTP v1 send (data-only payloads) |
| `Notifications_Dispatch.js` | `dispatchPushToUsers` / `dispatchPushToIdentifiers` |
| `Logistics_Timeline.js` | Timeline save → crew schedule notifications |
| `Logistics_Tasks.js` | Task assign/delete + weather alerts |
| `10a_Notifications_Boot.html` | Iframe ↔ hosting bridge |
| `10c_Notifications_Admin.html` | ROOT push admin panel |
| `01b_Calendar_Tasks.html` | Bell drawer, notif list UI |

---

## Deploy

```powershell
node milestone.js "note"     # GAS (Apps Script)
node deploy-hosting.js       # Firebase Hosting (when push-hosting/ changes)
```

**Production log:** root **`RELEASES.md`**

---

## Related topics

| Doc | Role |
|-----|------|
| [notifications-catalog.md](notifications-catalog.md) | **What we notify for** — crew vs manager checklist |
| [FILE_MAP.md](../FILE_MAP.md) | Module index, push file map |
| [FRAGILE_ZONES.md](../FRAGILE_ZONES.md) | PWA session + iframe-before-FCM rules |
| [training-manuals.md](training-manuals.md) | Crew install / onboarding manuals (separate from this checklist) |
