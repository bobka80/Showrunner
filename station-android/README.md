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

- Auto-scan / connect to BLE name **`Nordic_UART_CW`** (MAC cached in app prefs)
- EU band **`0x04`** (865–868 MHz) after connect
- Gun trigger → single tag read; forwards EPC to the WebView:


```kotlin
webView.evaluateJavascript("window.onStationRfidScan('${epc}')", null)
```

Pair R6 in the app (BLE), not only in Android Settings — follow the demo pattern.

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

**Ops — publish a new APK:**

```bash
node build-station-apk.js
node deploy-hosting.js
```

First build needs Android Studio (or Android SDK + JDK 17) on a PC once.

---

## Permissions

`AndroidManifest.xml` already requests Bluetooth (Android 12+: `BLUETOOTH_SCAN`, `BLUETOOTH_CONNECT`) and Internet.

---

## Do not commit the AAR

The Chainway `.aar` is vendor IP — keep it local under `app/libs/` (gitignored). Each developer copies it from Chainway’s site.
