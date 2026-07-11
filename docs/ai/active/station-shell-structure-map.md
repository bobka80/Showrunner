# Station shell structure map — monolith @ GAS v530

**Source:** `11_Station_Shell.html` (4031 lines) · **Split script:** `scripts/split-station-shell-once.js` · **Handoff:** [station-ui-handoff.md](station-ui-handoff.md)

Mechanical line-range map for Phase A. **Zero logic edits** — cuts only.

---

## Markup + CSS (lines 1–1137)

| Module | Lines | Content |
|--------|-------|---------|
| `11b_Station_Styles.html` | 1–875 | `<style>` — station-device-root, shell, scan panel, vault, settings CSS |
| `11j_Station_Phone_UI.html` | 877–925 | `#station-shell` phone sled markup (header, scan panel, footer) |
| `11i_Station_Settings.html` | 927–1069 | `#station-settings` overlay markup |
| `11h_Station_Project.html` | 1071–1080 | `#station-project-picker` markup |
| `11f_Station_Vault.html` | 1082–1137 | `#station-vault` markup (equip + crew panes, record bar, sheet) |

**Phase B scaffolds (not in monolith):** `11k_Station_Dock_UI.html`, `11l_Station_Dock_Scale.html` — empty dock shell + CSS scale vars; no phone UI change until Phase B.

---

## Script block (lines 1139–4031)

Single `<script>` in monolith; split into seven logic modules. **Include order in `Index.html` matters** (see handoff).

### `11c_Station_Core.html` — host session, RBAC, bootstrap, init

| Slice | Lines | Anchors |
|-------|-------|---------|
| 1 | 1140–1315 | File header, globals, RBAC override, constants, `stationRfidTidEquivalent_` … `stationLookupCrewHostLocal_` |
| 2 | **1441–1915** | **Per-station settings** comment + `stationSettingsNs_` … `stationFormatTime24_`, `var stationToastTimer_` |
| 3 | 1916–2038 | `stationToast_`, gun reconnect/sleep, `stationInvokeGunNative_`, `stationSyncGunSleepButton_` |
| 4 | 2113–2200 | `stationRenderShellState_`, `stationApplyBootstrap_` |
| 5 | 3490–3518 | `stationDeviceSignOut` (device profile sign-out) |
| 6 | 3898–4030 | `stationAnnounceReady_`, `stationBindMessageListener_`, **`initStationShell_`**, DOMContentLoaded |

**Critical fix vs v531:** slice 2 starts at **1441** (comment open), not 1447 (orphan `*/`). Slice 1 ends at 1315; RFID helpers live in 11d.

### `11d_Station_Rfid.html` — equip map, scan feed push, host login, poll

| Slice | Lines | Anchors |
|-------|-------|---------|
| 1 | 1316–**1440** | `stationNormalizeEpc_` … `stationRefreshEquipMap_` (ends before Per-station settings block) |
| 2 | 2040–2111 | `stationSetLastScan_`, `stationRenderScanFeed_`, `stationPushScanFeed_` |
| 3 | 2202–2456 | `stationHandleRfidScan_`, `stationBeginHostLogin_`, `onStationRfidScan`, `stationStartScanPoll_`, `stationLogoutHost` |

**Critical fix vs v532:** slice 1 ends at **1440**, not 1446 — avoids duplicating lines 1441–1446 into both 11c and 11d.

### `11e_Station_ScanPanel.html` — 2557–2906

Scan panel open/close, presets, last-scan actions, `stationPanelCommitStatus_`.

### `11g_Station_Vault.html` — 2470–2555, 2908–3244

Vault open/load/render, record RFID, action sheet, status many.

### `11g_Station_Vault_Crew.html` — 3245–3349

ROOT crew badge enroll tab.

### `11h_Station_Project_Logic.html` — 2458–2466, 3351–3488

Project picker + PA compact handoff (`stationPickProject_`, `stationWatchPaExit_`).

### `11i_Station_Settings_Logic.html` — 3520–3896

Gun bridge, settings panel, config sync, eject/gun-sleep saves.

---

## v531 failure post-mortem (parse)

| Bug | Lines | Fix |
|-----|-------|-----|
| Orphan `*/` in 11c | 11c slice 2 started at 1447; comment opened at 1441 in 11d | 11c slice 2 = 1441–1915 |
| Missing `stationFormatTime24_`, `stationToastTimer_` | 11c slice 2 ended at 1905 | Extend to 1915 |
| Duplicate block 1441–1446 | v532 left 11d at 1446 while 11c started 1441 | 11d ends 1440 |

---

## After split

- `11_Station_Shell.html` → stub comment only
- Run parse check (handoff command) before `node build.js` / `node milestone.js`
- Update [FILE_MAP.md](../FILE_MAP.md) §11
