# Drive → Synology NAS (year archive policy)

**Entry:** [AI_DOCTRINE.md](../../AI_DOCTRINE.md) · **Index:** [Project_TODO.md](../Project_TODO.md)

**Depends on:** [workspace-migration.md](workspace-migration.md) — NAS sync must use **Workspace host** Google account.

**Canonical Drive tree:** [DRIVE_LAYOUT.md](../DRIVE_LAYOUT.md)

**Status:** Backlog

**Last swept:** 2026-06-30

---

## Policy (director intent)

| Location | Years kept |
|----------|------------|
| **Google Drive (live)** | **Current year** + **previous year** |
| **Synology NAS (archive)** | **Year ≤ current − 2** and older |

Google does **not** enforce this automatically — NAS + a scheduled rule implements it.

---

## NAS setup

- [ ] Install **Synology Cloud Sync** on NAS (or plan **rclone** on NAS / always-on PC)
- [ ] Create archive root e.g. `/StageMasters/Archive/`
- [ ] Connect **Workspace host** Google account (OAuth)
- [ ] Configure **one-way sync: Google Drive → NAS** (never two-way for archive trees)
- [ ] Test manual sync of one small year folder before automation

---

## What to archive (scope)

- [ ] `01_WORKSPACE/[YYYY]/` — real ops event folders for archived years
- [ ] `02_FINANCE/[YYYY]/` — finance mirrors for archived years
- [ ] **Exclude** live `05_DATABASE` spreadsheets (`SM_Showrunner_ENGINE`, `VAULT`, etc.) — use existing [database-ops.md](database-ops.md) BACKUPS/ARCHIVES
- [ ] **Exclude** `Showrunner Syncs/` shortcut-only trees — archive **source** event folders, not per-user shortcut mirrors
- [ ] **Exclude** `04_SYSTEM_ASSETS` templates (stay in Google)

---

## Automation rule

- [ ] Define schedule: e.g. **1 January** annually + optional monthly verification job
- [ ] `archiveYear = currentCalendarYear - 2`
- [ ] Start or extend Cloud Sync / rclone job for:
  - `01_WORKSPACE/{archiveYear}/`
  - `02_FINANCE/{archiveYear}/`
- [ ] Verification: file count spot-check, total size compare, open 2–3 random project folders on NAS
- [ ] **Only after verify:** optional remove year from Google Drive **or** move to Drive `COLD_ARCHIVE` folder (director decision — default: keep on NAS only, remove from Google to save cloud storage)
- [ ] Log each archive run (date, year, NAS path, verified by)

---

## Ongoing operations

- [ ] Annual **restore drill** — recover one event folder from NAS to a test path
- [ ] Monitor NAS disk capacity; expand volume or purge oldest NAS copies per retention policy
- [ ] Document who has NAS admin access (office / IT only)

---

## Free vs Workspace

| Account | NAS archive |
|---------|-------------|
| **Google Workspace (host)** | **Correct** — business Drive, Cloud Sync supported |
| **Free personal Gmail** | Not suitable for company archive host |

---

## Related

- Live DB backup UI: [database-ops.md](database-ops.md)
- Showrunner does **not** implement NAS sync in GAS v1 — infrastructure task on Synology
