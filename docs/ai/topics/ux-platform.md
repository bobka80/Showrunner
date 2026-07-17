# UX, platform & crew tools

**Entry:** [AI_DOCTRINE.md](../../../AI_DOCTRINE.md) · **Index:** [Project_TODO.md](../Project_TODO.md)

**Last swept:** 2026-07-17 · **Production:** GAS **v625** · **Status:** Partial — Personal Hub + **desktop lock shipped** (lock preserves working screen @ v625)

## Backlog

- [ ] **Personal user hub:** Extended profile modal (contact, dietary) — partial; theme/logout/PIN shipped
- [ ] **Freelancer shift placeholders & bidding:** TBD shifts, broadcast pool, accept/bid, rating-based selection
- [ ] Personal Hub on mobile (theme-only polish)
- [ ] Manager agenda reminders → [notifications-catalog.md](notifications-catalog.md)

---

## Desktop lock screen (shipped @ v377–v388)

**Not** `Login.html` (pre-app gate). Lock runs **after** sign-in — session stays valid; UI covered until PIN re-entry.

### Code map

| Piece | Location |
|-------|----------|
| Overlay + unlock | `01i_Desktop_Lock.html` (included from `Index.html`) |
| Styles | `Styles.html` — `.desktop-lock-*` |
| Server | `Security.js` — `verifyDesktopLockUnlock`, `getDesktopLockPrefix` |
| API | `lockDesktopScreen()` / `lockDesktop()` / `unlockDesktop(pin)` |
| Triggers | Left nav **padlock** (desktop ≥769px); idle timeout in **Personal Hub** (per crew, `localStorage`) |

### Shipped behavior

- [x] Full-screen overlay `z-index 10050`; dashboard blur; **0.5s fade** in/out
- [x] Stage Masters **bus lanes** — ~45% randomly blurred with **sandy/grainy edges** (SVG turbulence `#desktop-lock-sandy` + grain overlay; per-bus `--bus-blur` / `--bus-sand`); hero **A** pulse (polish through v409)
- [x] **Bahnschrift bold** clock; per-glyph **soft edges** (blur + layered glow); **second hour digit** muted brand red `#c25860`; digit **crossfade** on change; **perimeter dim** (50px plateau + 50px outward fade, radius ≈ height÷3)
- [x] **Quick unlock** — 2-char prefix, **local** (prefix cached at login / prefetch); full PIN on failure
- [x] Idle **5–30 min** (5-min steps) or **Disabled** (manual padlock only), per crew device in Personal Hub
- [x] **Desktop auto-login opt-out** — Personal Hub **DISABLE AUTO-LOGIN**; mobile always stay signed in; re-enable via checkbox on login screen
- [x] **Mobile** — out of scope (no lock)
- [x] **Preserve working screen** — lock must **not** call `closeModals()` (that closed project/timeline and jumped to calendar). Overlay only; unlock returns to the same view (**v625**)

### Never do

- Call `closeModals()` from `lockDesktopScreen` — tears down project editor / timeline / hubs and forces calendar.

### Recovery campaign

Closed @ v376; polish continued through v388. See [archive/recovery-after-v330.md](../archive/recovery-after-v330.md).
