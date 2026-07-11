# REWIND POINT — pre station UI split (major milestone)

**Status:** **ACTIVE REWIND** — restore here before the **11-series shell split** and **dock panel UI** rework.  
**Pinned:** 2026-07-11 · **GAS v530** · **Hosting host-boot v499** · **Desktop 0.1.44** · **APK build 53** · **Last updated:** 2026-07-11

**Next work after this point:** [rfid-station-profiles.md](rfid-station-profiles.md) — mechanical split of `11_Station_Shell.html`, then **phone sled** vs **dock panel** UI. See session plan in chat / `STATION_UI.md` (when added).

---

## Why this is a major milestone

Field-proven baseline **before** restructuring ~4,000 lines of station shell and building a new desktop/tablet UI:

| Surface | What works at this rewind |
|---------|---------------------------|
| **Chainway phone in R6 sled** | Station login, crew badge host, equipment scans → **name + unit** in scan panel; vault, project picker, settings cog; BLE reconnect (HID `configChanges` fix); no-host park + disconnect beep (APK build **53**) |
| **TSL gate PC (`tsl_dock_desktop`)** | Four-layer WebView path; login/logout/auto pin; RFID → real station UI; gun settings + disconnect/reconnect; **cold start never restores previous host** (badge in fresh) |
| **Shared web station core** | Host-inherit RBAC, `processStationRfidScan`, equip map, scan panel — all in monolithic `11_Station_Shell.html` (last state before chop) |

**Not guaranteed at this rewind (known backlog):** dock-specific layout (right scan rail, sidebar-only nav), UI scale system, bulletin screensaver, gate reader layout `gate`, offline host cache.

---

## Version pins at this rewind (four independent tracks)

These numbers **do not match each other** — that is normal. Each track is deployed by a different script.

| Track | What it is | Pin at this rewind | Deploy command | Rollback |
|-------|------------|-------------------|----------------|----------|
| **1. GAS** | Apps Script — backend + compiled web app (`Index.html`, all `11_*.html`, LogicPayload) | **530** (`RELEASES.md` #1) | `node milestone.js "<note>"` | `node rollback-milestone.js` or redeploy prior GAS version |
| **2. Hosting** | Firebase shell at `sm-showrunner-97405.web.app` — `host-boot.js`, session bridge, scan relay, PWA | **`host-boot.js?v=`** in `push-hosting/public/index.html` (e.g. **499**) | `node deploy-hosting.js` | Redeploy prior hosting from Git; bump `?v=` |
| **3. Desktop EXE** | Windows `ShowrunnerStationDesktop` — COM gun, WebView2, `AndroidStation` bridge | **0.1.44** (`ShowrunnerStationDesktop.csproj`) | `station-desktop/RUN-STATION.bat` or `node build-station-desktop.js` | Rebuild/checkout prior tag; no cloud auto-deploy |
| **4. Station APK** | Android Chainway app — BLE gun native driver | **0.1.51 (versionCode 53)** — `push-hosting/public/downloads/station-manifest.json` | `node build-station-apk.js "notes"` → `node deploy-hosting.js` | Re-ship older APK only forward (downgrade guard); manifest history |

**Director test URL:** `https://sm-showrunner-97405.web.app` — always loads **latest GAS deployment** inside **latest hosting** shell.

Full layering explanation: [DEPLOY_AND_ROLLBACK.md](../DEPLOY_AND_ROLLBACK.md) § Four deployment surfaces.

---

## How to rewind

### Production web (crew + station WebView)

1. Find the REWIND row in root **`RELEASES.md`** (GAS version number).
2. Tell the AI: *"Rollback production to GAS version &lt;N&gt;"* or *"Rollback production to last milestone before station UI split"*.

### Hosting shell only

If only `host-boot.js` regressed after rework: checkout hosting files from the Git commit tagged in `RELEASES.md` REWIND row → `node deploy-hosting.js`.

### Chainway sled (phone)

Install APK from `/station-app` — must show **build 53** (or the versionCode listed in this file’s pin table). APK is **not** rolled back by `milestone.js`.

### TSL desktop (gate PC)

Run `station-desktop/RUN-STATION.bat` on a commit that has **`Version` 0.1.44** in the csproj. Desktop is **not** rolled back by GAS milestone.

### Git (full source tree)

```
git log --grep="REWIND POINT"
```

Checkout that commit → rebuild as needed.

---

## Files that must stay stable across rewind

- `11_Station_Shell.html` — monolith (pre-split)
- `11a_Station_Gun_Drivers.html`
- `push-hosting/public/host-boot.js`
- `station-desktop/ShowrunnerStationDesktop/` (TSL driver + MainWindow scan relay)
- `station-android/` (Chainway `RfidManager.kt`)

---

## After rework starts

When `11b`–`11l` modules land and dock UI ships, **close** this rewind (move file → `docs/ai/archive/` and add a new REWIND row for the next baseline).
