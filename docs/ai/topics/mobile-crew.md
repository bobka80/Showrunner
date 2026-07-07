# Mobile crew field UX

**Entry:** [AI_DOCTRINE.md](../../../AI_DOCTRINE.md) · **Shipped:** GAS v471+ · **Last swept:** 2026-07-07

**Reference doc (UI detail):** [MOBILE_CREW_UX.md](../MOBILE_CREW_UX.md)

## Shipped checklist

- [x] `Styles_Mobile.html` extracted from `Styles.html`
- [x] Crew Hub (`01e`) — phase rail, weather, my shift, timeline/assets/cancel
- [ ] Shift **confirm/decline** + **field actuals** (substitution, hours ±) — [timeline-shift-field-crew.md](timeline-shift-field-crew.md)
- [x] Phase Rail (`01f`)
- [x] Mobile Tasks (`01g`)
- [x] Compact Project Assets (`01h`)
- [x] Timeline zoom (`03f`)

**Follow-up:** [notifications-catalog.md](notifications-catalog.md) for push scenario checklist; [notifications.md](notifications.md) for deploy.

## Phone QR scan (shipped 2026-07-07 — GAS v467+, hosting v474)

**Fragile reference:** [FRAGILE_ZONES.md](../FRAGILE_ZONES.md) § Mobile QR scan handoff.

Crew phone PWA — header **Scan** → panel → camera → asset QR → equipment + status actions.

| Shipped | Notes |
|---------|--------|
| Integrated scan panel | `01j_Mobile_Scan.html`, mobile header Scan |
| Shell camera on `web.app` | Camera cannot run in GAS iframe |
| Reliable handoff | iframe reload `sessionboot&srScan=` + boot consume; 20s dedupe |
| Vault lookup | Composite codes `RW-1000-20` |
| Status actions | Maintenance / Damaged / Broken / Repaired |
| **iPhone decode** | Full-screen `mobile-scan.html` + native `BarcodeDetector` (hosting v472/v474) |
| **iOS safe-area header** | SHOWRUNNER row below status bar (GAS v471) |

**Deferred:** PA checkout forward from scan panel (scan → project checkout in one flow).

**Not primary UX:** full-page `mobile-scan.html` navigation — panel + shell camera only.

## Warehouse floor

- [x] **Mobile PA auto-save** (shipped v368) — all equipment changes on `mobile-pa-compact` save automatically (debounced; `isMobilePaExplicitSaveMode()` = false); see [project-assets-concurrency.md](project-assets-concurrency.md)
