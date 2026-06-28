# Database operations (Root settings)

**Entry:** [AI_DOCTRINE.md](../../AI_DOCTRINE.md) · **Index:** [Project_TODO.md](../Project_TODO.md)

**Last swept:** 2026-06-28 · **Status:** Partial — backup/restore + push admin shipped; archive column placeholder

---

## Shipped

- [x] Root-only **DATABASE** tab in Master Settings
- [x] Sub-tabs **BACKUP & ARCHIVE** | **OPS & NOTIFICATIONS** (GAS v305)
- [x] Separate Engine / Vault backup + explorer dropdowns
- [x] Live status panel + Open in Drive
- [x] Dynamic DB registry (Script Properties)
- [x] Restore — move live to Replaced folder, promote backup
- [x] Multi-step revert via `DB_Operations_Log`
- [x] **Push admin panel** in Ops tab (`renderPushAdminPanel` — see [notifications.md](notifications.md))
- [x] BOTH backup with countdown + UI lock

## Remaining

- [ ] **Archive column tools** — UI placeholder only (“Log archiver, engine cold-archive…” in `06g_Admin_Database.html`)
- [ ] **Software Log Hub** — placeholder in Ops tab
- [ ] **Test drill** on HEAD — director sign-off

**UI:** `06g_Admin_Database.html`, shell in `00b_UI_Hubs.html`.
