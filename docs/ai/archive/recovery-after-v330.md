# Recovery — after rollback to v329 (archived)

**Entry:** [AI_DOCTRINE.md](../../AI_DOCTRINE.md) · **Archived:** 2026-06-28 · **Closed at GAS v376**

**Status:** **Complete** — director confirmed web.app (desktop lock + recovery items shipped).

**Rollback baseline:** GAS **v329**  
**Final production:** GAS **v376** (desktop lock polish, PA checkout fixes, notifications Steps C–D, Personal Hub, etc.)

---

## Outcome summary

| Step | Result |
|------|--------|
| A — Editor stability | Shipped v335 — recursion fix, weather, mini calendar |
| B — Checklist status bar | Shipped (director sign-off) |
| C — Notifications backend | Shipped v342+ — FCM + in-app dispatch |
| D — Foreground UX | Shipped v344+ — hosting bridge, bell fix |
| E — Personal Hub + desktop lock | Shipped v336+ / v371–376 — hub, padlock, screensaver |

---

## Why we rolled back (historical)

After **v330**, the director reported shift notifications missing, mini calendar black box, checklist bar issues, weather missing, and `Maximum call stack size exceeded` recursion. Rollback to v329; re-shipped one milestone at a time.

See git history and **`RELEASES.md`** for version notes.

---

## Safe recursion pattern (keep in code)

1. `applyProjectDistanceFieldVisibility()` — distance field only  
2. `updateLocationRegionLabel` — label + zone, then visibility helper once  
3. `toggleDistanceInput` — visibility helper only; never calls `updateLocationRegionLabel`

---

## Reference files (still relevant)

| Area | Files |
|------|--------|
| Recursion / weather / region | `02_Project_Editor_Map.html`, `02_Project_Editor_Core.html` |
| Mini calendar | `01c_Calendar_Mini.html`, `Styles.html` |
| Notifications | `Notifications_*.js`, `10a_Notifications_Boot.html`, `push-hosting/` |
| Desktop lock | `01i_Desktop_Lock.html`, `Security.js` (`verifyDesktopLockUnlock`) |

**Fragile zones:** [FRAGILE_ZONES.md](../FRAGILE_ZONES.md)
