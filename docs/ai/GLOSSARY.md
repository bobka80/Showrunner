# Magic Strings & Glossary

The ShowRider Logistics system uses several string flags and constants to drive routing and logic. This glossary maps out what they mean.

## Vault types & nesting (see [EQUIPMENT_MODEL.md](EQUIPMENT_MODEL.md))

- **`type: "Bulk"`** — One vault row; quantity is a **count**. Not unique; **cannot** have per-piece RFID. Married to a level-3 case via `containerUid` for checkout.
- **`nestingLevel` 3** — Cases/containers; each unit has vault `id`, `rfidTag`, QR (primary key). Cable cases live here.
- **`nestingLevel` 6** (default physical) — Unique units; exploded to `qty: 1` on project save (non-Bulk).
- **`isGenericAuto`** — Phantom **cable trunk** from **Auto-Packing** (`autoProvisionCableCases`). Formula often `[BULK] XLR CASE - AUDIO`.
- **`isAuto`** — Phantom **kit case** from **Auto-Containerization** (`recalcAutoContainers`). Not the same as `isGenericAuto`.

## `ProjectAsset.formula` Flags
- `"Standalone"`: The default state. This asset is not part of any syntax grouping or shortage.
- `"Manual"`: A legacy term for "Standalone". It is actively converted to "Standalone" during syncs.
- `"[SHORT] {string}"`: Indicates this asset exceeds Vault availability. The `{string}` is the original formula it belonged to (or "Standalone").
- `"Auto-Container"`: This was auto-generated to box up other assets. Converted to `isAuto: true` and `formula: "Standalone"` during processing.
- `"Gen-Auto-Container"`: A generic box. Converted to `isAuto: true`, `isGenericAuto: true`.
- `"[AUTO] {string}"`: Similar auto-conversion flags.
- `"[BULK] {TAG} CASE - {DEPT}"`: Cable trunk label from **Auto-Packing** (not Auto-Containerization). See [EQUIPMENT_MODEL.md](EQUIPMENT_MODEL.md).

## `ProjectAsset.location` Flags
- `"General"`: The default location. If an asset has no specific stage or zone assigned, it defaults to this.

## Text CLI Syntax Patterns
When a user types into the `pa-search-cli` bar, it processes patterns:
- `12x Fixture`: Parses out `{ qty: 12, mod: "Fixture" }`. It automatically looks up the container capacity and mathematically rounds `12` to the nearest full case boundary if the "Auto-Fill Cases" toggle is active.
- `Location = 12x Fixture`: Assigns `location: "Location"` and parses the items.

## Global Arrays
- `globalAssets`: The frontend cache of the entire Vault database.
- `currentProjectAssets`: The active working memory of what is assigned to the event.
- `window.originalProjectAssets`: A pristine clone of `currentProjectAssets` used to diff changes or reset.
- `window.overlappingAllocations`: A map of asset quantities currently assigned to *other* concurrent events, used to calculate true availability.

## The "Triangle of Truth"
This concept refers to the core formula mechanism — **three corners that must stay in mutual agreement**:

1. **Human Written Formula:** Fast slash-based input in the CLI (segments separated by `/`). The operator's quick way to work.
2. **Beautiful Formula:** Visual, human-readable representation — for people who did not create the list or are reviewing it later.
3. **The List:** The actual equipment rows assigned to the project, drawn from the Vault.

**Bidirectional (not one-way):**
- **First write (Formula → List):** Parsing the human slash formula left-to-right **draws equipment** and creates the list.
- **Ongoing (List ↔ Formula):** The list **also represents** the formula; all three corners must stay synchronized.

See [FRAGILE_ZONES.md](FRAGILE_ZONES.md) and [ARCHITECTURE.md](ARCHITECTURE.md) before modifying parser or render logic.

## Drive zones (Stagemaster System Root)

Numbered host folders (`01_WORKSPACE` … `05_DATABASE`), live spreadsheets, backups/replaced/archives, Showrunner Sync shortcuts — see **[DRIVE_LAYOUT.md](DRIVE_LAYOUT.md)**.

## Transfer Tags (Planned)
- `[TRANSFER_FROM]`: Tag for gear that bypasses the warehouse (direct venue-to-venue or vendor-to-site). See [topics/availability-fleet.md](topics/availability-fleet.md).

## Station UI families (director terms)

Director vocabulary for **which station UI** we mean — not the native app binary, not tablet (for now):

| Term | Meaning | Native shell | UI skin (code) |
|------|---------|--------------|----------------|
| **Mobile station** | Phone-sized station UI | Android APK (`station-android/`) | `phone_sled` — layout `chainway_handheld` |
| **Desktop station** | Desktop / gate-PC station UI | Windows EXE (`station-desktop/`) | `dock_panel` — layout `tsl_dock_desktop`, future `gate` |

**Rules:**
- **Mobile station** = Android phone in the Chainway sled only.
- **Desktop station** = gate PC (TSL dock today); **does not** include large tablets — those stay on the dock-panel skin when added, but director says **desktop station** for the PC UI only until tablet scope is explicit.
- Shared station **logic** (host session, RFID, vault, project) is one codebase; the terms above refer to **UI layout / chrome**, not separate products.

See [STATION_UI.md](STATION_UI.md) · [active/rfid-station-profiles.md](active/rfid-station-profiles.md).
