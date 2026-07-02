# Mobile crew field UX

**Entry:** [AI_DOCTRINE.md](../../../AI_DOCTRINE.md) · **Shipped:** GAS v314 · **Last swept:** 2026-07-02

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

## Warehouse floor

- [x] **Mobile PA auto-save** (shipped v368) — all equipment changes on `mobile-pa-compact` save automatically (debounced; `isMobilePaExplicitSaveMode()` = false); see [project-assets-concurrency.md](project-assets-concurrency.md)
