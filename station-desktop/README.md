# Showrunner Station Desktop (thin shell)

Windows gate PC / TV shell for the **TSL 1128-EU** RFID gun.

**Field status (2026-07-11):** Login, logout, auto pin, and RFID scans work — the station UI shows **equipment names with unit numbers**, not raw EPC hex. Desktop **v0.1.40**, GAS **525**.

**AI / architecture docs:** [docs/ai/active/tsl-desktop-handoff.md](../docs/ai/active/tsl-desktop-handoff.md) (full four-layer model, session + scan paths, fragile points) · [docs/ai/FRAGILE_ZONES.md](../docs/ai/FRAGILE_ZONES.md) § Desktop WebView2 station.

## Which folder is which?

| Path | What it is |
|------|------------|
| **`station-desktop/`** | **The app — build and run this** |
| **`stage-desktop-info/`** | TSL vendor SDK, PDFs, Explorer installer — **reference only**. See [stage-desktop-info/README.md](../stage-desktop-info/README.md). |

There is only one Showrunner desktop app. `stage-desktop-info/` is manufacturer reference material (renamed from the old typo folder `station-desctop`).

## What it is

- **WebView2** fullscreen → `https://sm-showrunner-97405.web.app` (hosting shell + GAS iframe)
- **TSL ASCII protocol** over Bluetooth virtual **COM** (outgoing port)
- **`window.AndroidStation`** bridge (same API as the Chainway APK) so `11_Station_Shell.html` needs no fork

### Four WebView layers (important)

The app is not “one web page.” Under the hood:

| Layer | What |
|-------|------|
| 1 **Native** | This exe — COM gun, scan relay, session file |
| 2 **web.app** | `host-boot.js` — parent session, `showrunnerStationDeliverScan` |
| 3 **GAS wrapper** | Outer `script.google.com` — nested iframe; **grey “Live RFID scans” bar = wrong layer** |
| 4 **GAS inner** | Real `#station-shell` — Scan panel, host badge, equipment name resolution |

Success = scans and session reach **layer 4**. See handoff doc for diagrams.

Vendor reference (protocol PDFs, SDK samples, Explorer installer): [`stage-desktop-info/`](../stage-desktop-info/) — not shipped.

## Requirements

- Windows 10/11 x64
- [.NET 8 Desktop Runtime](https://dotnet.microsoft.com/download/dotnet/8.0) (unless you use a `--self-contained` build)
- [WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2/) (usually preinstalled on Win11)
- TSL 1128 paired in **Windows Bluetooth**

## Build

```bash
node build-station-desktop.js "First gate shell build"
```

**Field launch:** always use **[`RUN-STATION.bat`](RUN-STATION.bat)** (desktop shortcut or double-click). The bat:

1. Kills any stale `ShowrunnerStationDesktop.exe` (COM port release)
2. Waits ~2 s for Bluetooth COM to free
3. **Auto-builds** the latest code into `bin/publish/win-x64/` (requires .NET 8 **SDK** on the gate PC)
4. Starts that single exe

You never need to open subfolders or run `dotnet publish` by hand for daily use. For release zips / version notes, still use `node build-station-desktop.js "…"`.

Optional larger zip with bundled .NET:

```bash
node build-station-desktop.js "Standalone build" --self-contained
```

Output: `station-desktop/ShowrunnerStationDesktop/bin/publish/win-x64/ShowrunnerStationDesktop.exe`

**Run only that exe.** Do not use old copies in `win-x64-v019`, `win-x64-v020`, etc.

## Field setup (TSL 1128)

1. **Pair** the gun in Windows Settings → Bluetooth (one-time).
2. Run **`RUN-STATION.bat`** (or the published exe after a bat build).
3. In Showrunner admin, assign station profile layout **`tsl_dock_desktop`** to this device account.

**No COM port to configure** — auto-detect by `PID_1128` + watchdog reconnect. Pull trigger to wake the gun if it was asleep.

### Prefs and logs

| File | Purpose |
|------|---------|
| `%LocalAppData%\ShowrunnerStation\desktop-prefs.json` | Session token, optional `ComPort`, gun settings |
| `%LocalAppData%\ShowrunnerStation\scan-diag.log` | **Always-on** scan/session diagnostic log (use when debugging) |
| `%LocalAppData%\ShowrunnerStation\connect-lock.log` | Gun connect watchdog audit |

Example `desktop-prefs.json`:

```json
{
  "ComPort": "",
  "PowerDbm": 30,
  "Beep": true,
  "ScanMode": "single",
  "PollMs": 500,
  "SessionToken": "...",
  "SessionExpires": "..."
}
```

- Leave `ComPort` **blank** for auto-detect (recommended).
- Set it (e.g. `"COM3"`) only to force a specific port if you have multiple TSL readers.

## Using the station

- **Trigger** on the gun → single inventory read (EPC + TID when available).
- Status line at bottom shows connect/read errors briefly.
- **Login / auto pin** → station profile; scan crew badge to host.
- **Equipment scan** → Scan panel shows **resolved equipment name + unit** (vault map), not raw tag hex.
- **F12** — diagnostics panel (toggle); **Open log file** opens `scan-diag.log`.
- **Escape** — quit when main window focused (kiosk ops).
- **F11** — toggle window chrome (debug).

Session token is saved in `desktop-prefs.json` and synced to the web.app parent for `sessionboot`.

## Success checklist (field)

1. Station profile name visible top-left (layer 4 loaded).
2. Scan asset tag → name + unit in **Scan** panel — **no** grey bottom “Live RFID scans” shim.
3. Scan crew badge → host badge; logout clears host.
4. `scan-diag.log` shows `relay=top` and `GAS invoke=ok` or `forwarded` (not endless `Session saved` loop).

## Troubleshooting

| Symptom | Check |
|--------|--------|
| “Waiting for TSL gun…” | Gun not paired, off, or asleep — pull trigger to wake |
| Connect tries multiple COM ports | App skips incoming BT ports; set `ComPort` in prefs if needed |
| Web blank | WebView2 runtime; network to web.app |
| **Scans only in grey bar at bottom** | Wrong WebView layer — read [tsl-desktop-handoff.md](../docs/ai/active/tsl-desktop-handoff.md); do not treat grey shim as success |
| Profile visible but no host / `no-session` in log | Session not reaching web.app parent — GAS + desktop versions; see handoff § Session path |
| F12 crashes app | Fixed v0.1.39+ (diagnostic window must not own main window) — rebuild via `RUN-STATION.bat` |
| Old behaviour after code change | Stale exe or second process on COM3 — use `RUN-STATION.bat` only |

TSL Reader Configuration (Windows) can confirm COM mapping if Device Manager is unclear.

## Version

Shipped in exe User-Agent: `ShowrunnerStationDesktop/<Version>` (see `.csproj` `<Version>`). **Current field baseline: 0.1.40.**
