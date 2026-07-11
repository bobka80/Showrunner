# Station UI — two skins (phone sled vs dock panel)

**Entry:** [AI_DOCTRINE.md](../../AI_DOCTRINE.md) · **Campaign:** [active/rfid-station-profiles.md](active/rfid-station-profiles.md) · **Handoff:** [active/station-ui-handoff.md](active/station-ui-handoff.md) · **REWIND baseline:** [active/REWIND-pre-station-ui-split.md](active/REWIND-pre-station-ui-split.md)

**Status:** **Phase A shipped (GAS v533).** Field regression pending. Dock panel UI is Phase B only.

---

## Decision (director 2026-07-11)

One shared station **logic** core; **two UI families** keyed off station layout / skin selector:

| UI skin | Layout ids | Devices | Screen context |
|---------|------------|---------|----------------|
| **`phone_sled`** | `chainway_handheld` | Chainway **phone** in R6 sled | Small phone at arm’s length — **keep today’s kiosk** |
| **`dock_panel`** | `tsl_dock_desktop`, future large-tablet profiles, future `gate` TV | TSL gate PC, **large tablets in sled**, fixed gate + TV | High-res panel in front of operator — **new layout** |

**Rule:** Large tablets in a sled join **dock panel**, not phone sled. Phone sled is only for phone-sized Chainway hardware.

**Selector hook (planned):** `stationActiveUiSkin_()` in `11a_Station_Gun_Drivers.html` — returns `phone_sled` or `dock_panel` from active layout (already stubbed before revert; re-add on split).

---

## Phone sled — keep as-is (do not break)

**Reference:** current `#station-shell` in `11_Station_Shell.html` @ GAS **530**.

| Zone | Behavior |
|------|----------|
| **Header** | Device profile name; host name inline (green) when hosted |
| **Top-right** | **Scan** (dropdown panel) + **Settings** (gear) |
| **Scan panel** | Live RFID feed, sensitivity bar, Low/Mid/High presets, status actions on last equipment scan |
| **Main** | “Waiting for host” / “Scan your crew badge” prompt |
| **Footer** | **PROJECT** · **VAULT** · **LOG OUT HOST** (when hosted) |
| **Overlays** | Settings, Project picker, Vault (Equipment \| Crew) — same as today |

**Regression test (Chainway APK build 53):** badge host login · Scan/Settings/PROJECT/VAULT buttons · equipment scan → name + unit in feed · vault status · project PA opens.

---

## Dock panel — target layout (TSL gate PC + large tablets)

**Not shipped.** Replace phone kiosk chrome with panel layout; **reuse all logic** (host session, RFID handlers, vault, project, settings model).

### Layout zones

```
┌──────────────────────────────────────────────────────────┬─────────────┐
│  Main workspace (existing app chrome / PA / vault)       │  Scan rail  │
│  — integrates with desktop sidebar when on office PC     │  (fixed    │
│  — host + profile in header or sidebar context           │   right)    │
│                                                          │  live feed  │
│                                                          │  last scan  │
│                                                          │  status act │
├──────────────────────────────────────────────────────────┴─────────────┤
│  Bottom bar: EJECT HOST · PROJECT · VAULT · settings entry             │
└────────────────────────────────────────────────────────────────────────┘
```

| Zone | Intent |
|------|--------|
| **Right scan rail** | Always-visible live RFID list + last scan detail + quick status actions (same data as phone Scan panel, different placement) |
| **Bottom eject bar** | Prominent **Eject host** — gate PC starts fresh each cold boot (see `stationIsDesktopKiosk_`) |
| **Sidebar integration** | On desktop WebView, station sits inside normal Showrunner shell — nav via existing sidebar, not phone footer tiles |
| **UI scale** | CSS `--station-ui-scale` + presets 100 / 125 / 150 / 175 % — one knob, not per-button font hacks |
| **Screensaver / bulletin** | **Phase C (later)** — idle overlay on dock panel only; do not block Phase A/B |

### Desktop-specific rules (already shipped in logic)

- **Cold start:** gate PC never restores previous crew host — badge in fresh (`stationIsDesktopKiosk_`, host-boot v499, desktop 0.1.44).
- **Scan delivery:** four WebView layers — scans must reach **inner** `#station-shell`. Grey `#sr-desktop-scan-feed` is emergency only. See [active/tsl-desktop-handoff.md](active/tsl-desktop-handoff.md).

---

## Implementation phases (checklist)

### Phase 0 — Docs + REWIND (done)

- [x] REWIND milestone GAS **530** pinned — [REWIND-pre-station-ui-split.md](active/REWIND-pre-station-ui-split.md)
- [x] This file + [station-ui-handoff.md](active/station-ui-handoff.md)
- [x] Production rolled back to **530** after failed split (531–532)

### Phase A — Mechanical split (redo carefully)

**Goal:** Split `11_Station_Shell.html` (~4k lines) into doctrine-sized modules (~≤1000 lines each). **Zero logic changes.** Phone sled must pass regression on Chainway before Phase B.

- [x] Re-create `scripts/split-station-shell-once.js` from handoff § Split module map (fix chunk boundaries — see § Split failure lessons)
- [x] Wire modules in `Index.html` (order matters — see handoff)
- [x] Update [FILE_MAP.md](FILE_MAP.md) §11 Station with module index
- [x] **Parse-check every `<script>` block** (`node` vm.Script) before milestone
- [ ] Field test Chainway: badge, buttons, scan feed
- [ ] Field test TSL desktop: login, scan → name+unit (unchanged behavior)
- [x] Milestone with note: “Station shell split Phase A (behavior-neutral)”

**Planned modules:**

| File | Role |
|------|------|
| `11b_Station_Styles.html` | CSS only |
| `11j_Station_Phone_UI.html` | Phone sled markup (`#station-shell`) |
| `11i_Station_Settings.html` | Settings overlay markup |
| `11h_Station_Project.html` | Project picker markup |
| `11f_Station_Vault.html` | Vault overlay markup |
| `11c_Station_Core.html` | Bootstrap, host session, RBAC, init |
| `11d_Station_Rfid.html` | `onStationRfidScan`, equip map, host login |
| `11e_Station_ScanPanel.html` | Scan panel UI + status actions |
| `11g_Station_Vault.html` + `11g_Station_Vault_Crew.html` | Vault logic |
| `11h_Station_Project_Logic.html` | Project picker logic |
| `11i_Station_Settings_Logic.html` | Settings + gun config sync |
| `11k_Station_Dock_UI.html` | Dock panel markup scaffold |
| `11l_Station_Dock_Scale.html` | UI scale presets scaffold |
| `11_Station_Shell.html` | Stub pointer only after split |

### Phase B — Dock panel UI

- [ ] `stationActiveUiSkin_()` — layout → `phone_sled` | `dock_panel`
- [ ] Dock markup in `11k` — right rail, bottom bar, hide phone chrome when `dock_panel`
- [ ] Move scan feed + last-scan actions into rail (share logic with `11e`, don’t duplicate handlers)
- [ ] Sidebar-aware layout on desktop WebView
- [ ] UI scale control in settings (`11l` + settings panel)
- [ ] TSL gate PC field test
- [ ] Large-tablet profile (when hardware exists) uses same skin

### Phase C — Deferred

- [ ] Bulletin / screensaver on idle (dock panel only)
- [ ] Gate layout `gate` UI (separate reader SDK — see rfid-station-profiles § Future gate)

---

## Split failure lessons (2026-07-11)

Attempted split shipped as GAS **531**; broke Chainway (shell visible, buttons dead, no badge login). GAS **532** fix attempt failed in field; **production rolled back to 530**.

| Bug | Cause |
|-----|--------|
| Entire core script dead | `11c_Station_Core.html`: header `/**` swallowed globals; orphan `*/` → **JS parse error** — nothing in 11c ran |
| Missing helpers | Chunk gap dropped `stationFormatTime24_`, `stationToastTimer_` init |
| Wrong chunk start | Second 11c slice started at line 1447 (` */`) instead of 1441 (Per-station settings comment) |

**Mandatory before any split milestone:** run parse check on all station script modules; smoke-test Chainway badge + all four nav buttons.

---

## Related docs

| Doc | Use when |
|-----|----------|
| [station-ui-handoff.md](active/station-ui-handoff.md) | **Start here** in a new chat |
| [REWIND-pre-station-ui-split.md](active/REWIND-pre-station-ui-split.md) | Rollback pins, four deploy tracks |
| [tsl-desktop-handoff.md](active/tsl-desktop-handoff.md) | Desktop WebView / scan / session |
| [FRAGILE_ZONES.md](FRAGILE_ZONES.md) | Do-not-break rules |
| [rfid-station-profiles.md](active/rfid-station-profiles.md) | Guns, layouts, RFID campaign backlog |
