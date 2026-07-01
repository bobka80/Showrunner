# UX, platform & crew tools

**Entry:** [AI_DOCTRINE.md](../../AI_DOCTRINE.md) · **Index:** [Project_TODO.md](../Project_TODO.md)

**Last swept:** 2026-06-30 · **Production:** GAS **v388** · **Status:** Partial — Personal Hub + **desktop lock shipped**

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
- [x] Stage Masters **bus lanes** (some lanes soft-edge); hero **A** pulse
- [x] **Bahnschrift bold** clock; digit **crossfade** on change; **perimeter dim** (50px plateau + 50px outward fade, radius ≈ height÷3)
- [x] **Quick unlock** — 2-char prefix, **local** (prefix cached at login / prefetch); full PIN on failure
- [x] Idle **5–30 min** (5-min steps) or **Disabled** (manual padlock only), per crew device in Personal Hub
- [x] **Desktop auto-login opt-out** — Personal Hub **DISABLE AUTO-LOGIN**; mobile always stay signed in; re-enable via checkbox on login screen
- [x] **Mobile** — out of scope (no lock)

### Recovery campaign

Closed @ v376; polish continued through v388. See [archive/recovery-after-v330.md](../archive/recovery-after-v330.md).
