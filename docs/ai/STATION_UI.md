# Station UI — phone sled vs dock panel

**Entry:** [AI_DOCTRINE.md](../../AI_DOCTRINE.md) · **Module map:** [FILE_MAP.md](FILE_MAP.md) §11 · **Split protocol:** [File_Splitting_Guide.md](File_Splitting_Guide.md)

**REWIND before this split:** [active/REWIND-pre-station-ui-split.md](active/REWIND-pre-station-ui-split.md) (GAS **530**, monolith `11_Station_Shell.html`).

---

## UI skins (two surfaces, one app)

| Skin | `stationActiveUiSkin_()` | Hardware | Markup / logic modules |
|------|---------------------------|----------|----------------------|
| **Phone sled** | `phone_sled` | Chainway **phone** in R6 sled | `11j_Station_Phone_UI.html` + shared core |
| **Dock panel** | `dock_panel` | TSL gate PC, **large tablet** in sled, future gate TV | `11k_Station_Dock_UI.html`, `11l_Station_Dock_Scale.html` (scaffold) |

Registry: `stationActiveUiSkin_()` in `11a_Station_Gun_Drivers.html`, keyed by station layout (`chainway_handheld` → phone sled; `tsl_dock_desktop` / `gate` → dock panel).

**Shared:** Host session, RFID routing, vault APIs, settings model — **not** duplicated per skin.

---

## Module include order (`Index.html`)

Markups first, then logic (see `Index.html` after the split):

1. `11a` gun drivers + UI skin registry  
2. `11b` styles  
3. `11j` phone shell markup  
4. `11i` settings markup · `11h` project markup · `11f` vault markup  
5. `11k` / `11l` dock scaffold (hidden until dock rework)  
6. `11c` core → `11d` RFID → `11e` scan panel → `11g` vault → `11g` crew → `11h` project logic → `11i` settings logic  

`11_Station_Shell.html` is a **stub** only — do not add logic there.

---

## Dock panel direction (Phase B — not shipped)

- Right vertical **live scan rail**
- Bottom **eject host** (no PROJECT/VAULT tiles — use desktop **left sidebar** for calendar, projects, vault)
- **`--station-ui-scale`** magnification (`11l_Station_Dock_Scale.html`)
- Bulletin **screensaver** (future module)

---

## Testing after changes

See handoff in [active/rfid-station-profiles.md](active/rfid-station-profiles.md) and [tsl-desktop-handoff.md](active/tsl-desktop-handoff.md). Chainway phone sled must behave identically to pre-split GAS **530** for host, scan, vault, project, settings.
