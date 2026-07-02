# Showrunner Station — Chainway R6 (Android)

Warehouse gun app: **Chainway SDK (BLE)** + **WebView** → Showrunner station shell.

Production web URL (station shell + `onStationRfidScan`):

`https://sm-showrunner-97405.web.app`

---

## What you downloaded (correct)

From [Chainway R6 support](https://www.chainway.net/Support/Info/19):

| File | What it is |
|------|------------|
| **API_Ver20251103.rar** | Driver library (**`.aar`**) + **doc** archive — what you have |
| **UHF_BLE for Android Studio** | **Full sample app** — download this too (shows how to call the AAR) |

The old **demo APK** (`demo-uhf-bt`) is only for testing hardware. It is **not** the SDK for building Showrunner.

---

## Step 1 — Vendor files (already in this repo layout)

| Path | Contents |
|------|----------|
| `app/libs/DeviceAPI_ver20251103_release.aar` | Chainway driver (gitignored — copy locally if missing) |
| `CW referense/doc/` | HTML API reference (`RFIDWithUHFBLE`, connect, inventory) |
| `CW referense/uhf-ble-demo/` | Official UHF_BLE sample app |

If `app/libs/*.aar` is missing on a new machine, unpack `API_Ver20251103.rar` and copy the `.aar` into `app/libs/`.

---

## Step 2 — Also download **UHF_BLE for Android Studio**

Same R6 page → **SDK** section → **UHF_BLE for Android Studio**.

Unpack it somewhere (e.g. `Downloads/UHF_BLE_demo/`). Use it as the **reference** for:

- Bluetooth scan / connect (`Nordic_UART_CW`)
- EU frequency (865–868 MHz)
- Start/stop inventory
- Tag callback → EPC string

We wire that same callback into Showrunner (see `RfidManager.kt`).

---

## Step 3 — Open this project in Android Studio

1. Install **Android Studio** (latest stable).
2. **File → Open** → select folder `station-android`.
3. Let Gradle sync finish.
4. Confirm `app/libs/*.aar` is present (after you copied it).
5. Connect the gun phone (USB debugging on).
6. **Run** the `app` configuration.

First run opens Showrunner in a WebView. After you implement BLE connect in `RfidManager.kt`, trigger reads will call:

```javascript
window.onStationRfidScan('epc-hex-here')
```

---

## Step 4 — RFID (implemented)

**`RfidManager.kt`** uses Chainway `RFIDWithUHFBLE`:

- Connect order: **cached MAC** → **device already paired in Android Bluetooth settings** (`findBondedGunMac()`) → **BLE advertisement scan** (fallback). Name match is broadened (`Nordic` / `UART` / `Nordic_UART_CW`) and no longer skips scan hits with a null advertised name.
- EU band **`0x04`** (865–868 MHz) after connect
- Gun trigger → single tag read; forwards EPC to the WebView:


```kotlin
webView.evaluateJavascript("window.onStationRfidScan('${epc}')", null)
```

Pairing the R6 in **Android Bluetooth settings is enough** — the app now connects to the bonded gun by MAC (a BLE scan alone often reports a null name and misses it).

### Troubleshooting

- **"Gun not found" but it's paired in Android:** fixed — the app now reads bonded devices first. Rebuild + reinstall the APK.
- **WebView stuck on "add Showrunner to your home screen":** the hosting shell used to show the PWA install nag to the WebView. The app sends UA `ShowrunnerStation/<ver>` and `host-boot.js` now treats that as installed (`isNativeStationApp()`), skipping the nag. Requires a **hosting redeploy** (`node deploy-hosting.js`).
- **Gradle `AccessDeniedException` on Google Drive:** `app/build.gradle.kts` redirects compile output to `%LOCALAPPDATA%/ShowrunnerStationBuild/app` so Drive sync does not lock build files.

---

## Step 5 — Test host login

1. Phone runs this app (not Chrome).
2. Log in as **WH-GUN-01** in the WebView.
3. Station screen → scan crew badge (or **DEV: HOST AS BOGDAN** until RFID works).
4. **LOG OUT HOST** clears host only.

---

## Install on gun phones (no USB)

On the Showrunner **login screen**, tap **Warehouse gun — install station app**.

That opens `https://sm-showrunner-97405.web.app/station-app?install=1`, downloads the APK, then follow on-screen install steps.

**Ops — publish a new APK (release notes REQUIRED):**

```bash
node build-station-apk.js "Fixed gun pairing" "Fixed install screen"
node deploy-hosting.js
```

First build needs Android Studio (or Android SDK + JDK 17) on a PC once.

### Versioning & changelog (mandatory process)

Every published station APK must be traceable from the download page alone — no need to open a chat or the repo to know what shipped.

- **`versionCode` auto-increments** every build (written back to `app/build.gradle.kts`). **`versionName`** drops the `-dev` suffix, then bumps patch: `0.1.0-dev → 0.1.0 → 0.1.1 → 0.1.2 …`.
- **Release notes are required** — each CLI arg is one bullet (or separate bullets in one arg with `;`). `build-station-apk.js` **fails** if none are given. Write plain, field-readable notes (what a warehouse user would understand).
- The build writes `versionName`, `versionCode`, **`updatedAt`** (build timestamp), `notes`, and a rolling **`history`** (last 20 builds) into `push-hosting/public/downloads/station-manifest.json`.
- The install page (`/station-app`) shows the **version + build number**, the **upload timestamp**, a **"What's fixed in this build"** list, and a **"Show previous builds"** history — all straight from the manifest.

So: **never build the station APK without notes**, and the download page is the single source of truth for "where is the app right now."

---

## App icon

Adaptive launcher icon (vector, no PNGs — `minSdk 26`): the **Stage Masters stylized "A"** (brand red `#EB1C24`, same path as the desktop lock hero) on a dark brand gradient, with three white **RFID broadcast waves** rising from the apex.

- `res/drawable/ic_launcher_background.xml` — dark diagonal gradient
- `res/drawable/ic_launcher_foreground.xml` — red "A" + broadcast waves
- `res/drawable/ic_launcher_monochrome.xml` — single-colour silhouette (Android 13+ themed icons)
- `res/mipmap-anydpi-v26/ic_launcher.xml` + `ic_launcher_round.xml` — adaptive icon
- Referenced from `AndroidManifest.xml` (`android:icon` / `android:roundIcon`)

---

## Permissions

`AndroidManifest.xml` already requests Bluetooth (Android 12+: `BLUETOOTH_SCAN`, `BLUETOOTH_CONNECT`) and Internet.

---

## Do not commit the AAR

The Chainway `.aar` is vendor IP — keep it local under `app/libs/` (gitignored). Each developer copies it from Chainway’s site.
