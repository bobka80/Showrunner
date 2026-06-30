# UX, platform & crew tools

**Entry:** [AI_DOCTRINE.md](../../AI_DOCTRINE.md) · **Index:** [Project_TODO.md](../Project_TODO.md)

**Last swept:** 2026-06-28 · **Status:** Partial — Personal Hub + desktop lock shipped (v376)

- [ ] **Personal user hub:** Extended profile modal (contact, dietary) — partial; theme/logout/PIN shipped
- [ ] **Freelancer shift placeholders & bidding:** TBD shifts, broadcast pool, accept/bid, rating-based selection
- [ ] Personal Hub on mobile (theme-only polish)
- [ ] Manager agenda reminders → [notifications-catalog.md](notifications-catalog.md)

---

## Desktop lock screen (spec)

**Not** the same as `Login.html`. Login is **before** the app loads. Lock is **after** you are signed in — session stays valid; UI is covered until PIN re-entry.

### Where it lives (code)

| Piece | Location |
|-------|----------|
| Overlay + unlock UI | New module e.g. `01i_Desktop_Lock.html`, included from `Index.html` |
| Styles | `Styles.html` (structural; follow [UI_DOCTRINE.md](../UI_DOCTRINE.md)) |
| Idle timer + lock API | `01i_Desktop_Lock.html` — `window.lockDesktopScreen()` / `window.lockDesktop()` / `window.unlockDesktop(pin)` |
| User trigger | Left nav **padlock** (desktop only, all users); idle timeout in **Personal Hub** (per crew, device-local) |

Full-screen `#desktop-lock-overlay`, z-index `10050` above the app, below critical emergency banners.

### How it should look

- **Full viewport** dark overlay with `backdrop-filter: blur(5px)` on the app underneath
- **Background:** multiple `STAGE_MASTERS` logo “buses” in lanes (L/R, varied size/speed/opacity)
- **Center:** red stylized **A** mark (`mobile-header-logo` path) — slow zoom pulse
- **Clock + crew name** below the mark
- **Unlock:** no visible field initially — hidden capture of first **2** PIN characters; on wrong attempt, full **6-character** PIN form appears

### Behavior

- **Idle lock** — default **5 minutes**; Personal Hub dropdown **5 / 10 / 15 / 20 / 25 / 30** min (per person, `localStorage` on device)
- **Manual lock** — padlock at bottom of left sidebar (desktop only, all users)
- **Quick unlock** — first 2 chars of command passcode (server verify via `verifyDesktopLockUnlock`)
- **Full unlock** — after one wrong quick attempt, require full 6-char PIN (session stays; no logout)
- **Mobile** — out of scope for v1

### Recovery archive gate

Desktop lock shipped and director confirmed on web.app → campaign closed. See [archive/recovery-after-v330.md](../archive/recovery-after-v330.md).
