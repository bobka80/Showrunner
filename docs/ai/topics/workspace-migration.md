# Google Workspace migration (host account)

**Entry:** [AI_DOCTRINE.md](../../../AI_DOCTRINE.md) · **Index:** [Project_TODO.md](../Project_TODO.md)

**Status:** **Host in-place upgrade verified** (2026) — same Google account, no Drive/script migration required. NAS + Chat backlog still apply.

**Blocks:** [drive-nas-year-archive.md](drive-nas-year-archive.md) (NAS sync should use Workspace host, not personal Gmail).

**Last swept:** 2026-06-30

---

## Path A — In-place upgrade (what we did)

Same host Google account upgraded to Workspace (billing + admin). **No file move**, folder IDs unchanged, Apps Script same project.

- [x] Workspace active on host account (2 TB, admin console)
- [x] `STAGE_MASTERS_SYSTEM_ROOT` + `05_DATABASE` in place — [DRIVE_LAYOUT.md](../DRIVE_LAYOUT.md)
- [x] Production smoke test: backup, modals, notifications @ web.app
- [x] Optional: `node milestone.js "Workspace in-place upgrade verified"` for RELEASES note (director smoke test passed; not required for ops)
- [ ] NAS year archive — [drive-nas-year-archive.md](drive-nas-year-archive.md)

**No company domain** — intentional; add later without re-migrating Showrunner if same host user.

---

## Path B — New Workspace user (not used)

Full account swap + Drive transfer + script ownership — only if host identity changes. See checklist below if ever needed.

---

## Before you start (Path B only)

- [ ] Inventory what runs on the **host Google account** today:
  - Apps Script project (Showrunner) + `clasp login`
  - Drive root **`STAGE_MASTERS_SYSTEM_ROOT`** — [DRIVE_LAYOUT.md](../DRIVE_LAYOUT.md)
  - Firebase Hosting / FCM (project `sm-showrunner-97405` — note which Google account owns Firebase console)
  - Production web app deployment (`deploy-config.json`, clasp deployments)
  - Script Properties, triggers, any service accounts
  - Who has shared access to `05_DATABASE`, `01_WORKSPACE`, manager Sync folders
- [ ] Choose **Workspace edition** (Business Starter minimum for business Drive; confirm storage for **two live years** of event trees)
- [ ] Decide host identity: migrate same person to Workspace vs new `@yourcompany.com` user

---

## Create Google Workspace

- [ ] Sign up / upgrade at [workspace.google.com](https://workspace.google.com)
- [ ] Verify domain (preferred) or document temporary `*.workspace.google.com` limitation
- [ ] Create **host admin** user — future owner of clasp + Drive root
- [ ] Enable Google Drive for the organization
- [ ] Decide: keep **My Drive host model** (current) vs migrate event trees to **Shared drive** later (separate decision — not required for v1 migration)

---

## Move Apps Script (Showrunner)

- [ ] On dev PC: `clasp logout` then `clasp login` as **Workspace host**
- [ ] Transfer existing Apps Script project to Workspace account **or** new project + `clasp clone` + update `.clasp.json` script ID
- [ ] `node build.js` + `node milestone.js "Workspace migration smoke test"`
- [ ] Confirm production URL `https://sm-showrunner-97405.web.app` still works (Firebase Hosting is separate from Google account — document if Firebase console login changes)
- [ ] Re-verify Script Properties, time-driven triggers, `authorizeShowrunnerExternalRequests`, FCM service account paths
- [ ] Update `RELEASES.md` note: host on Workspace as of [date]

---

## Move Drive (`STAGE_MASTERS_SYSTEM_ROOT`)

- [ ] Pick migration path:
  - [ ] **Option A (preferred):** Transfer ownership of root folder + children to Workspace host (Google account upgrade / transfer where supported)
  - [ ] **Option B:** Workspace **Drive data migration** / admin transfer tools
  - [ ] **Option C:** Takeout + re-upload — **last resort** (downtime)
- [ ] After move: walk folder tree; **re-record folder IDs** in [DRIVE_LAYOUT.md](../DRIVE_LAYOUT.md) if any IDs changed
- [ ] Re-point code constants in `Resources_Core.js` / `Integrations.js` if IDs changed
- [ ] Re-run **Showrunner Sync** / shortcut regeneration for managers (`Integrations.js`)
- [ ] Managers: Google Drive Desktop — sign out personal Gmail, sign in Workspace, re-sync selective folders

---

## Crew and access

- [ ] Create Workspace users for managers (or document policy: crew stay external + sharing)
- [ ] Re-share vault / database access per RBAC — only roles that need write
- [ ] Update crew **email** fields in vault if addresses change to `@company.com`
- [ ] Document who may still use personal Gmail for Showrunner login vs Workspace-only managers

---

## Verify Showrunner on web.app

- [ ] Login (PIN), open project editor, timeline, Project Assets, checkout bar
- [ ] Notifications bell + test push from web.app
- [ ] Master Settings → Database tab — backup paths still resolve
- [ ] Director sign-off on production web.app

---

## Explicitly not in this migration

| Topic | File |
|-------|------|
| Synology NAS year archive | [drive-nas-year-archive.md](drive-nas-year-archive.md) |
| Firebase prep / timeline sessions | [session-fork-platform.md](session-fork-platform.md) |

---

## Rollback note

Keep personal host account read-only access until Workspace smoke test passes for **one full week** of normal office use. Do not delete old account until folder IDs and clasp are verified.
