# Push Notifications — Project Status

**Last updated:** 2026-06-26  
**Purpose:** Handoff doc for a fresh Cursor session. No secrets here — credentials live only in **Apps Script → Project Settings → Script Properties** and **Firebase Console**.

---

## Architecture (chosen approach)

**Option 1:** Firebase Hosting (`web.app`) + FCM + Apps Script backend. No native app store app.

```
Firebase Hosting (parent page)
  ├─ Service worker + FCM token registration
  └─ iframe → GAS web app (login + Showrunner UI)

GAS backend
  ├─ Stores one FCM device token per user (Script Properties)
  └─ Sends push via FCM HTTP v1 (service account)
```

**Users must open:** https://sm-showrunner-97405.web.app  
Push does **not** work from a raw `script.google.com` bookmark.

---

## What we completed (Phase 0 + Phase 1)

### Infrastructure
- [x] Firebase project: `sm-showrunner-97405`
- [x] Firebase Hosting URL: https://sm-showrunner-97405.web.app
- [x] Firebase CLI installed; `push-hosting/` folder with `host-boot.js`, `firebase-messaging-sw.js`, `manifest.json`
- [x] `node deploy-hosting.js` / `prepare-hosting.js` — syncs SW config from live GAS `?action=fcfg`

### Apps Script (production milestones v269 → v282)
- [x] `Notifications_Store.js` — token storage, VAPID save, bridge registration, manual token save
- [x] `Notifications_Push.js` — FCM HTTP v1 send, `sendTestPushNotification()`, `authorizeShowrunnerExternalRequests()`
- [x] `Notifications_Dispatch.js` — event-driven push dispatch (timeline + tasks)
- [x] `Main.js` — `fcfg`, `fcmreg` JSONP endpoints; Firebase public config
- [x] `10a_Notifications_Boot.html` — iframe ↔ hosting bridge
- [x] `10c_Notifications_Admin.html` — ROOT DATABASE panel (VAPID, device token, test push)
- [x] `Login.html` / `Index.html` — iframe-safe `<base target="_self">`
- [x] `appsscript.json` — explicit `oauthScopes` including `script.external_request` (UrlFetchApp for FCM)
- [x] One-time UrlFetchApp authorization via `authorizeShowrunnerExternalRequests` in script editor

### Script Properties (configured in GAS — names only)
| Property | Purpose |
|----------|---------|
| `FIREBASE_PROJECT_ID` | `sm-showrunner-97405` |
| `FIREBASE_WEB_API_KEY` / `FIREBASE_API_KEY` | Web app API key |
| `FIREBASE_VAPID_KEY` | Web Push **public** key (~88 chars, starts with `B`) |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Full JSON for FCM HTTP v1 OAuth |
| `FIREBASE_HOSTING_URL` | Optional; defaults to `https://sm-showrunner-97405.web.app` |
| `FCM_TOKEN_{uid}` | One device token per crew UID (auto-created on save) |

### Verified working (desktop)
- [x] **SEND TEST PUSH TO ME** from DATABASE tab (ROOT)
- [x] Push arrives on registered desktop browser when using **web.app** URL
- [x] VAPID validation + save UI in DATABASE
- [x] Copy push token button on hosting page (pointer-events fix v280+)

---

## Where we are now

| Layer | Version / state |
|-------|-----------------|
| **GAS production** | v282 (`AKfycbxynTt5…` deployment) — **pending milestone** for v284 changes |
| **Firebase Hosting** | **v284** — token rebroadcast + save ACK (deploy after milestone) |
| **Phase** | **Phase 1.5** implemented — direct `saveMyFcmDeviceToken` + parent rebroadcast |
| **Phase 2** | **Started** — timeline crew add/shift change + new task assignee push |

---

## Session changes (2026-06-26)

### Phase 1.5 — reliable auto-save
- `saveMyFcmDeviceToken()` — iframe saves token via `google.script.run` (no nonce required)
- `10a_Notifications_Boot.html` — listens for `SHOWRUNNER_FCM_TOKEN`, polls parent 90s, server status poll
- `host-boot.js` v284 — rebroadcasts token every 3s until iframe ACK; status shows “token saved”
- Bridge nonce only removed after successful save; TTL extended to 600s

### Phase 2 — event-driven push (initial)
- `dispatchPushToIdentifiers()` — resolves email/name → vault UID → FCM token
- `saveTimelineData` — push on crew added to schedule or shift time changed
- `saveTaskData` — push on new task assignees
- Actor excluded from receiving their own push

---

## Open problems

### 1. Phone registration — **push service error**
- **Symptom:** On phone, FCM `getToken()` fails with *Registration failed — push service error* or DATABASE shows yellow (token not saved).
- **iPhone:** Must use **Safari → Add to Home Screen → open home screen icon**. Chrome on iPhone does not support web push. Safari tab alone often fails.
- **Android:** Use Chrome; enable notifications at OS level; try **Reset push** on hosting page; clear site data if corrupted GCM registration.
- **Hosting v284** adds token rebroadcast until server save ACK — hard-refresh web.app after deploy.

### 2. Token auto-save to server is unreliable
- **Mitigation in v284:** Direct server save from iframe + parent rebroadcast. Manual paste still available as fallback.
- **Verify:** DATABASE should turn green without paste; bottom-right chip should say “token saved”.

### 3. One device per user (Phase 1 limitation)
- Last registered device **replaces** previous token (`FCM_TOKEN_{uid}` in Script Properties).
- Registering phone stops desktop pushes until PC re-registers.

### 4. clasp push sometimes skips
- `clasp push` can report **Skipping push** even when manifest changed; use `clasp push --force` if oauthScopes or backend files didn’t land before versioning.

### 5. PWA polish incomplete
- `manifest.json` icons now reference `/icon.svg` but file may not be deployed — add icon to `push-hosting/public/` before next hosting deploy.

### 6. Phase 2 partial
- [x] Timeline crew add / shift change
- [x] New task assignees
- [ ] Project save / weather / other events (see `docs/ai/Project_TODO.md`)
- [ ] Per-user notification preferences (Phase 3)

---

## Key files (for next session)

| File | Role |
|------|------|
| `push-hosting/public/host-boot.js` | Hosting shell: FCM init, token, copy/reset buttons |
| `push-hosting/public/firebase-messaging-sw.js` | Background notifications (regenerated by `prepare-hosting.js`) |
| `push-hosting/prepare-hosting.js` | Pulls `fcfg` from GAS before hosting deploy |
| `Notifications_Store.js` | Token + VAPID storage, bridge |
| `Notifications_Push.js` | FCM send + auth probe function |
| `Notifications_Dispatch.js` | Event-driven push dispatch |
| `10a_Notifications_Boot.html` | Iframe registration bridge |
| `10c_Notifications_Admin.html` | ROOT DATABASE UI |
| `Main.js` | `fcfg`, `fcmreg` routing |
| `RELEASES.md` | GAS milestone log (v269–282 push work) |

---

## Deploy commands (director reference)

```powershell
# Apps Script production milestone (required for GAS changes)
node milestone.js "your note"

# Firebase Hosting only (after GAS milestone if fcfg changed)
node deploy-hosting.js

# After adding oauthScopes — if clasp skips:
clasp push --force
```

---

## Next steps (recommended order)

1. **Milestone** GAS changes: `node milestone.js "Phase 1.5 auto-save + Phase 2 timeline/task push"`
2. **Deploy hosting:** `node deploy-hosting.js`
3. **Phone:** Hard-refresh web.app; iPhone via home screen icon; confirm DATABASE green + test push
4. **Phase 2 continue:** project save, weather alerts, roster leave
5. **Phase 3:** Per-user notification preferences; multi-device tokens (optional)

---

## Credentials hygiene

- **Never commit:** `deploy-config.json`, `push-hosting/firebase-public-config.json`, `push-hosting/.env.local`, service account JSON, VAPID private key.
- All listed in `.gitignore`.
- Public Firebase web keys in `firebase-messaging-sw.js` are normal (client-side); rotate in Firebase if leaked.
- Secrets belong only in **Apps Script Script Properties** and **Firebase Console**.
