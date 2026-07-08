# Showrunner Station Desktop (thin shell)

Windows gate PC / TV shell for the **TSL 1128-EU** RFID gun. Same Showrunner station web UI as the Android tablet, with a native bridge for gun I/O.

## What it is

- **WebView2** fullscreen → `https://sm-showrunner-97405.web.app`
- **TSL ASCII protocol** over Bluetooth virtual **COM** (outgoing port)
- **`window.AndroidStation`** bridge (same API as the Chainway APK) so `11_Station_Shell.html` needs no fork

Reference SDK/docs only: `station-desctop/` (typo folder — do not ship). App code: `station-desktop/`.

## Requirements

- Windows 10/11 x64
- [.NET 8 Desktop Runtime](https://dotnet.microsoft.com/download/dotnet/8.0) (unless you use a `--self-contained` build)
- [WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2/) (usually preinstalled on Win11)
- TSL 1128 paired in **Windows Bluetooth**

## Build

```bash
node build-station-desktop.js "First gate shell build"
```

Optional larger zip with bundled .NET:

```bash
node build-station-desktop.js "Standalone build" --self-contained
```

Or manually:

```bash
cd station-desktop/ShowrunnerStationDesktop
dotnet build -c Release
```

Output: `bin/Release/net8.0-windows/ShowrunnerStationDesktop.exe`

## Field setup (TSL 1128)

1. **Pair** the gun in Windows Settings → Bluetooth (one-time).
2. Run **ShowrunnerStationDesktop.exe**.
3. In Showrunner admin, assign station profile **`tsl_dock_desktop`** to this device account.

That's it — **no COM port to configure.** The shell auto-detects the TSL gun by its
`PID_1128` Bluetooth signature and grabs the port the moment the reader is awake, exactly
like the ASCII Protocol Explorer. A background watchdog re-acquires the link after the gun
sleeps or drops, so pressing the trigger "wakes it up" and reconnects on its own.

### Optional overrides

`%LocalAppData%\ShowrunnerStation\desktop-prefs.json` (created on first run):

```json
{
  "ComPort": "",
  "PowerDbm": 30,
  "Beep": true,
  "ScanMode": "single",
  "PollMs": 500
}
```

- Leave `ComPort` **blank** for auto-detect (recommended).
- Set it (e.g. `"COM3"`) only to force a specific port if you have multiple TSL readers.

## Using the station

- **Trigger** on the gun → single inventory read (EPC + TID when available).
- Status line at bottom shows connect/read errors briefly.
- **F11** — toggle window chrome (debug).
- **Escape** — quit (kiosk ops).

Session token is saved in `desktop-prefs.json` like the Android prefs.

## Troubleshooting

| Symptom | Check |
|--------|--------|
| “Waiting for TSL gun…” | Gun not paired, off, or another app (Explorer) holds the port — close it |
| Connects to wrong reader | Multiple TSL guns paired — set `ComPort` override in prefs |
| Web blank | WebView2 runtime; network to web.app |
| Scans not in UI | Gun connected? Status shows “Gun connected”? Profile is a station layout? |

TSL Reader Configuration (Windows) can confirm COM mapping if Device Manager is unclear.

## Version

Shipped in exe User-Agent: `ShowrunnerStationDesktop/<Version>` (see `.csproj` `<Version>`).
