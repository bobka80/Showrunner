# TSL 1128 desktop — vendor reference (not Showrunner software)

**Do not build, run, or ship anything from this folder.**

This is **reference material** from Technology Solutions (TSL) for the **1128-EU** handheld RFID reader — kept in-repo so we can read protocol docs and sample code while working on the real gate app.

| Path | What it is |
|------|------------|
| **`stage-desktop-info/`** (this folder) | TSL SDK samples, PDFs, Explorer installer — **reference only** |
| **`station-desktop/`** | **Showrunner Station Desktop app** — the only folder to build and run |

Historic note: this tree was originally checked in under a typo name (`station-desctop`). It was renamed **`stage-desktop-info`** so it cannot be confused with the app folder `station-desktop/`.

## Contents

| Subfolder | Purpose |
|-----------|---------|
| **`Doc/`** | TSL PDFs — ASCII protocol spec, 1128 user guide, sample-app notes |
| **`Samples/`** | Vendor .NET sample projects (Inventory, Switch, Commands, Read/Write, Licence Key) — patterns for connect, inventory, switch events |
| **`TSL Reference/`** | **ASCII Protocol Explorer** Windows installer (`setup.exe` / `.msi`) — field tool to confirm COM port and gun behaviour |

## When to use this folder

- **Debugging connect/read behaviour** — compare our `station-desktop/ShowrunnerStationDesktop/TslRfidManager.cs` with the Switch / Inventory samples
- **Protocol questions** — read `Doc/TSL ASCII Protocol 2.5 Rev A.pdf`
- **Field COM check** — run Explorer from `TSL Reference/` (not the Showrunner exe)

## When not to use this folder

- **Do not** deploy sample exes to gate PCs
- **Do not** copy sample code into GAS or hosting
- **Do not** treat this as a second app — all Showrunner desktop shipping goes through `node build-station-desktop.js` → `station-desktop/ShowrunnerStationDesktop/bin/publish/win-x64/`

## Build the real app

```bash
node build-station-desktop.js "release notes"
```

See [station-desktop/README.md](../station-desktop/README.md) and [docs/ai/active/rfid-station-profiles.md](../docs/ai/active/rfid-station-profiles.md) § Desktop TSL station.
