# RBAC & Event Access — Master Plan (Archive)

> **Status:** Phases 1–5 implemented — **OK go Phase 6** when ready.  
> **Last updated:** 2026-06-25  
> **Drawer:** `docs/ai/archive/` — RBAC regressions or Phase 6 only.  
> **Entry:** [AI_DOCTRINE.md](../../../AI_DOCTRINE.md)

---

## 1. Design principles

1. **Three layers** (every permission must hit all three eventually):
   - **Nav** — sidebar / buttons visible or hidden
   - **Screen mode** — read-only vs editable UI (not just “can’t save”)
   - **Backend** — same rules on create/save APIs

2. **Show work, hide company/money**
   - **Work:** location, weather, distance, phases, timeline (view), assets (view/edit per role), status label
   - **Hidden/commercial:** client, difficulty multiplier, logistics hub, email crew, pricing/ROI (existing fin_* keys)

3. **Assignment gate**
   - Person with a **shift on the project** gets event-editor briefing access (same as tunneling / freelancer filter logic)
   - **Source of truth:** `Shifts` sheet — `user_uid` rows for `project_uid` (`Logistics_Timeline.js` `getTimelineData`)

**Decided (2026-06-25):** Assignment = **has shift on project**. No separate “assigned without shift” store.

---

## 2. Crew & freelancers (this update series)

### Main calendar

| Role | Sees on main calendar |
|------|------------------------|
| **Crew** | **All company events** (full workload picture) |
| **Freelancer** | **Only events they have a shift on** |
| **Manager+** | Per permissions (unchanged unless restricted) |

### Project editor — briefing mode (read-only)

**Who:** Crew/freelancers with a **shift** on that project (and anyone without manager-level edit rights on that surface).

**Can SEE (display only — nothing editable on screen):**

| Element | Rule |
|---------|------|
| Location text | Visible |
| Weather widget | Visible |
| OUTDOOR / IN SOFIA checkboxes | Visible, **cannot toggle** |
| Distance (km) | Visible |
| Mini calendar | Visible, **view-only** (no painting) |
| Event status (Draft, Approved, …) | Visible, **not clickable** |
| OPEN TIMELINE | Visible → opens **read-only** timeline |
| PROJECT ASSETS | Visible → opens **read-only** assets (no “finished” dept checkboxes) |
| CANCEL | Closes / exits editor |

**Hidden:**

| Element | Rule |
|---------|------|
| Client | Hidden |
| Difficulty multiplier | Hidden |
| Map pin (📍) | Hidden |
| LOGISTICS HUB | Hidden |
| Event type control | Hidden |
| SAVE & SYNC CALENDAR | Hidden |
| EMAIL CREW | Hidden |
| PDF | Hidden for now (may return later) |
| FOLDER | Unchanged this series (defer) |

**Explicitly NOT in this series:**

- Crew editing project asset lists (future; maybe time-window or CHECK-OUT operation mode)
- Any editable fields for crew/freelancer

**Mini calendar view-only:** Everyone **below Manager** tier on mini calendar (crew, freelancers, restricted managers).

**Minor TBD:** TRASH / history / project title in editor — hide or read-only? (Not decided.)

---

## 3. IAM checkbox → behavior matrix

Keys live in `00c_UI_Forms.html` (Role Editor), saved via `06a_Admin_IAM.html` → Vault `Role_Permissions`.  
Today only **some** keys gate UI (`req-*` in `Styles.html`); **most event/logistics keys are labels only** — wiring is core of this project.

### Events & calendar

| Permission key | When OFF | When ON |
|----------------|----------|---------|
| `event_create_standard` | Cannot use main-calendar empty click for standard production events | Can create events; **all three types** available in editor: **Event, Cross Rent, Meeting** |
| `event_create_crossrent` | No cross-rent creation path | Cross-rent workflow only (see §4) |

**Calendar empty-click rule:**

- Events are created **only** by clicking **empty space on the main calendar** (no other create entry point).
- If **both** `event_create_standard` and `event_create_crossrent` are **OFF** → **cannot** click empty calendar space.
- If **only** `event_create_crossrent` ON → see §4.
- If `event_create_standard` ON → full type menu (all three types).

| Permission key | When OFF | When ON |
|----------------|----------|---------|
| `event_edit_timeline` | **No drawing** on mini calendar; **no drawing/editing** in full timeline (view-only) | Can paint mini calendar (subject to cross-rent restrictions §4) and edit timeline |

### Assets

| Permission key | When OFF | When ON |
|----------------|----------|---------|
| `event_assets_window` | Like crew: assets window **view-only** (no edits, no “finished” ticks) | Can **edit** project asset list freely (including outside timeline context) |

### Sidebar / nav

| Permission key | Effect |
|----------------|--------|
| `view_month_roster` | Month roster matrix button/nav **visible** |
| `view_logistics` | Live logistics phase tracking on sidebar **visible** |

### Tasks

| Permission key | Effect |
|----------------|--------|
| `task_manage_global` | Can add crew to tasks, manage global workbox tasks |
| `task_manage_personal` | Mark self-assigned tasks done — **default ON for all crew** (implement as crew always gets this; don’t require per-role tick) |

### Already partially wired (keep extending)

| Keys | Today |
|------|--------|
| `db_view_*`, `db_edit_*` | Some `req-*` CSS + Settings tabs |
| `fin_view_roi`, `fin_view_internal`, `hr_view_rates` | Financials nav + columns |
| `Is_Tunneling` | Freelancer node-lock (existing) |

---

## 4. Cross-rent–only creator (e.g. warehouse manager)

**Profile example:** Cross-rent YES, standard events NO, assets window YES, timeline edit NO.

| Area | Behavior |
|------|----------|
| Main calendar | **Can** click empty space (because `event_create_crossrent` ON) |
| Event type | **Cross Rent only** — single option, **locked**, cannot switch to Event/Meeting |
| Mini calendar | Paint phases for scheduling warehouse work — **preferred:** only **WAREHOUSE** + **RECOVERY** chips (not Main / Show / Transit) |
| Mini calendar **fallback** | If WH+RECOVERY-only is awkward in calendar engine: allow **any** phase strips/lengths on mini calendar; still locked Cross Rent; still no timeline |
| Full timeline | **No drawing** (no shifts) — view-only |
| Project assets | **Editable** if `event_assets_window` ON (checkout/in gear) |
| Standard production | Cannot create real events or assign crew via standard flow |

**Difficulty (for implementer):**

| Piece | Effort |
|-------|--------|
| Lock type to Cross Rent | Easy |
| Timeline read-only | Easy |
| Mini calendar WH + RECOVERY only | Medium |
| Strip length limits | Hard — skip |

---

## 5. Standard event creator

`event_create_standard` ON:

- Empty calendar click → editor
- Event type: **Event, Cross Rent, Meeting** (all three)
- Mini calendar + timeline per `event_edit_timeline` and manager tier

---

## 6. Role templates (target presets)

| Template | standard | crossrent | edit_timeline | assets_window | Notes |
|----------|----------|-----------|---------------|---------------|-------|
| **Crew** | OFF | OFF | OFF | OFF | Briefing editor; full company calendar |
| **Freelancer** | OFF | OFF | OFF | OFF | Briefing editor; **filtered** calendar |
| **Warehouse manager** | OFF | ON | OFF | ON | Cross-rent + assets; WH/RECOVERY mini cal |
| **Production manager** | ON | ON | ON | ON | Full create + schedule |

---

## 7. Implementation phases (approve before code)

### Phase 1 — Permission plumbing ✅ (2026-06-25)
- Map every `IAM_PERMISSION_KEYS` entry → `userHasPerm()` + CSS `req-*` classes
- Helpers: `canCreateOnCalendar()`, `canCreateStandard()`, `canCreateCrossRent()`, `canDrawPhases()`, `canEditAssets()`, `isBriefingMode()`, `isAssignedToProject()` (shift on project)
- Backend mirrors on save/create (not UI-only)
- **Done:** `Security.js` assert* + `effectiveBackendPermission`; `07_Core_Globals.html` frontend helpers; `Styles.html` req-* for all IAM keys; gates on `saveEventFromUI`, `saveTimelineData`, asset APIs, `saveTaskData`; calendar `dateClick` + logistics/roster guards; `syncEffectivePermClasses()` for Manager-tier implicit perms + CSS

### Phase 2 — Project editor modes ✅ (2026-06-25)
- **Briefing mode** (§2): lock inputs; hide commercial controls
- **Manager-only:** title edit, trash/history, status lifecycle (UI + backend `assertActorCanManageProject`)
- Non-managers: title/status preserved on save even if API tampered
- Mini calendar: view-only in briefing / without `event_edit_timeline`

### Phase 3 — Main calendar ✅ (2026-06-25)
- **Freelancer filter:** `IsFreelancer` on crew row OR role `Is_Tunneling` → boot/refresh payload filtered to shift-assigned projects only; crew (no flag) sees full calendar
- **Conflicts** filtered with same project set
- **Empty-click create** gated by `canCreateOnCalendar()` (standard and/or crossrent)
- **Cross-rent-only creator:** type locked to Cross Rent; mini-cal paint WH+RECOVERY only; backend `enforceCrossRentOnlyProjectFields_`

### Phase 4 — Timeline & assets ✅ (2026-06-25)
- `isTimelineReadOnly()` + existing `currentIsReadOnly` guards on draw/save
- Assets view-only: hides save, edit, clipboard, finished dept ticks (`eq-dept-finished-cb`)
- CHECK-OUT/IN: `canUseAssetCheckout()` + backend `assertActorCanPerformAssetOperations` on all ops APIs
- `updateProjectReadiness` gated server-side

### Phase 5 — Sidebar & tasks ✅ (2026-06-25)
- Month roster nav: `view_month_roster` reveals crew-conflict/roster sidebar (not manager-only)
- Logistics C/E/T badges on calendar gated by `view_logistics`
- Global tasks: `task_manage_global` for create/edit/delete; crew sees assigned tasks only
- Personal tasks: `savePersonalTaskData` — assignees can update status + todos only
- `task_manage_personal` always on at login; task drawer uses `req-task_manage_personal`

### Phase 6 — QA
- Role templates in IAM
- Director test checklist per template

**Suggested order:** 1 → 2 → 3 → 4 → 5 → 6

---

## 8. Related work (already done — separate from this plan)

- DATABASE tab: backup/restore, BOTH countdown, ENGINE/VAULT quick backup
- Nightly trigger fix: `getVaultSheetId` in `Resources_Core.js`
- Backup health scan from Drive files

---

## 9. Open decisions (resolve before or during Phase 3)

1. **WH + RECOVERY only** on mini calendar vs **fallback any strips** for cross-rent role
2. ~~**TRASH / history / project title** for briefing mode~~ **Resolved:** trash/history manager-only; title read-only below Manager; status changes manager-only (backend enforced)
3. ~~**Assigned** detection~~ **Resolved:** shift on project (`Shifts.user_uid` + `project_uid`)
4. **Editors** tier: same as crew on calendar or between crew and manager?

---

## 10. Director workflow

1. Read this doc in new chat
2. State last pre-execution task (if any)
3. Say **OK go Phase N** to implement one phase at a time
4. **This works** → git save; **Milestone now** → production lock

---

## 11. Credential system — code audit (2026-06-25)

> Remarks for implementers: what exists today, what is wired, and what can break the plan.

### 11.1 What we have (architecture)

| Layer | File(s) | Behavior today |
|-------|---------|----------------|
| **Login** | `Login.html` → `Main.js` `doPost` → `Security.js` `authenticateUser` | Name + 6-char passcode vs Vault `Crew` sheet. On success, renders `Index` with meta tags. |
| **Session identity** | `Index.html` meta: `user-name`, `user-access`, `user-permissions` (base64 JSON) | `ACTIVE_USER_NAME`, `USER_ACCESS` (tier string), `USER_PERMISSIONS` object. **Frozen at login** — role checkbox changes in IAM do not apply until re-login. |
| **Tier (`sysAccess`)** | Vault `Role_Permissions.sysAccess`; crew `System_Access` is fallback | Values: `CREW`, `EDITOR`, `MANAGER`, `ADMIN`, `ROOT`. Role row **overrides** crew row on login. |
| **Granular keys** | `Security.js` `IAM_PERMISSION_KEYS` (19 keys) | Loaded from `Role_Permissions` columns via `loadRolePermissionsBundle`. Saved from Role Editor (`00c_UI_Forms.html` / `06a_Admin_IAM.html`). |
| **Frontend helper** | `Index.html` `userHasPerm(key)` | Checks `USER_PERMISSIONS[key]`. Also adds `body.perm-{key}` classes for CSS gating. |
| **CSS hide** | `Styles.html` `req-*` rules | Only **7 keys** wired: `root`, `db_view/edit/delete_assets`, `hr_view_rates`, `fin_view_roi`, `fin_view_internal`. **Zero** `event_*`, `view_*`, `task_*` CSS rules. |
| **Nav reveal** | `Index.html` boot block | Tier-based: Manager+ conflicts/manager hub; Financials = Manager+ AND fin checkbox; Master Settings = Admin OR any `db_view_*`. Not checkbox-driven for events/logistics. |
| **Backend gate** | `Security.js` `verifyBackendPrivilege(crewName, requiredTier)` | Used by IAM admin APIs, `Resources_Database.js`, `Resources_Vault.js`. **Does not check IAM checkbox keys.** |
| **Save APIs** | `Logistics_Projects.js` `saveProjectData` / `saveEventFromUI`; `Logistics_Timeline.js` `saveTimelineData` | **No permission checks.** `actor` is a client-supplied string (`ACTIVE_USER_NAME`). Anyone who can call `google.script.run` can write if they know the function name. |
| **Freelancer filter (partial)** | `Main.js` `getBootPayload` / `getRefreshPayload` + `Is_Tunneling` | When role has tunneling ON, filters `projects` and `shifts` to user’s uid. **Shift-based**, not “assigned to project without shift.” |

**Special hardcodes (do not break accidentally):**

- `bogdan` → forced `ROOT` + full db bundle on login; `verifyBackendPrivilege` always true.
- `loadRolePermissionsBundle`: `db_view_assets` auto-grants `db_edit_assets` + `db_delete_assets` unless manage column explicitly `false`/`0`.
- `db_delete_assets` is **not** a Role Editor checkbox; derived on save (`submitRole` in `06a_Admin_IAM.html`).
- `event_view_pricing` is in `IAM_PERMISSION_KEYS` but **not** in the Role Editor form — orphaned key.

### 11.2 `verifyBackendPrivilege` — fixed (2026-06-25)

**Was misleading:** second argument was treated as a **Role_Permissions column name**, not minimum `sysAccess` tier.

**Now:** `Security.js` uses `normalizeAccessTier`, `accessTierRank`, `accessTierAtLeastValue`, and `resolveCrewSysAccess`.  
`verifyBackendPrivilege(name, 'EDITOR')` means **tier ≥ EDITOR** (so MANAGER / ADMIN / ROOT also pass).

Added `verifyBackendPermission(crewName, iamKey)` for future IAM checkbox gates.

### 11.3 Assignment — shift-based (decided)

| Location | What “assigned” means |
|----------|----------------------|
| `Logistics_Timeline.js` `getTimelineData` | `assigned[]` = unique `user_uid` from **shift rows** |
| `Main.js` tunneling / freelancer filter | Project visible if user has a **shift** on that project |
| Briefing editor access (plan) | User has a **shift** on that project |

`crewUids` in `saveTimelineData` is still unused — assignment is implied by shift rows only.

### 11.4 Tier strings — fixed (2026-06-25)

**Canonical form:** ALL-CAPS `CREW` | `EDITOR` | `MANAGER` | `ADMIN` | `ROOT`.

| Layer | Fix |
|-------|-----|
| Login | `authenticateUser` returns `normalizeAccessTier(access)` |
| `Main.js` | Template gets normalized `userAccess` + `showSettingsNav` flag |
| `Index.html` boot | `USER_ACCESS` normalized; `window.accessTierAtLeast(minTier)` |
| Fragments | `01d_Calendar_Mobile`, `06a_Admin_IAM`, `06e_Admin_Automation`, `07_Core_Globals` use `accessTierAtLeast` |

Legacy sheet values (`Admin`, `Manager`, etc.) are accepted and mapped to ALL-CAPS.

### 11.5 UI surfaces with no permission gates today

| Surface | File | Risk if only CSS added |
|---------|------|------------------------|
| Main calendar empty click → new event | `01a_Calendar_Core.html` `dateClick` | Always opens full editor; no `userHasPerm` |
| Mini calendar paint / delete | `01c_Calendar_Mini.html` click + keydown | Always mutates `currentEditingEvent` |
| Project save | `02c_Project_Operations.html` → `saveEventFromUI` | No client or server gate |
| Timeline save | `03a_Timeline_Boot.html` → `saveTimelineData` | `openShiftLayout(..., isReadOnly)` exists — **good hook** for view-only; save path still unguarded on server |
| Logistics hub / month roster nav | Sidebar HTML | No `view_logistics` / `view_month_roster` wiring |

**Risk:** Hiding buttons is not enough. Phase 1 backend mirrors are mandatory; otherwise devtools / crafted `google.script.run` bypasses UI.

### 11.6 `Is_Tunneling` vs planned freelancer behavior

- **Tunneling** (`Is_Tunneling` checkbox): narrows boot payload to user’s shifts — similar to planned “freelancer filtered calendar.”
- **Plan:** Crew sees **all** company events; freelancers see assigned only; assignment **without** shift.

**Risk:** Reusing tunneling for freelancers would hide company-wide calendar from crew. Need explicit role/template detection (`sysAccess` + role name/id), not tunneling alone. Tunneling may still apply to freelancers as an extra lock — define combination rules in Phase 3.

### 11.7 Fragile zones — do not break while implementing

| Zone | Why fragile |
|------|-------------|
| `loadRolePermissionsBundle` auto-edit promotion | Changing db_view logic breaks existing Manager asset workflows |
| `perm-root` CSS bypass | `body.perm-root` unhides **all** `req-*` elements — ROOT must stay exempt |
| `bogdan` override | Removing breaks owner lockout recovery |
| `authenticateUser` hard column fallbacks (name col 2, pass col 7) | Legacy sheet layouts; IAM changes must not assume header-only mapping |
| `saveProjectData` anti-duplication (60s same name) | Briefing users spam-saving could hit edge cases — unrelated but shared save path |
| `syncCalendarFromDatabase` after every `saveEventFromUI` | Blocking saves if calendar sync fails — permission errors should fail **before** sync |
| Build / `LogicPayload` chunks | `userHasPerm` and new helpers must live in early boot chunk (`Index.html` / `07_Core_Globals.html`), not only in admin fragments |
| `getBootPayload` project list | Freelancer filter at payload level affects calendar, conflicts, tasks, mobile — test all consumers |

### 11.8 Recommended Phase 1 prerequisites (before editor modes)

1. ~~**Fix or replace** `verifyBackendPrivilege`~~ **Done** — tier ladder + `verifyBackendPermission`.
2. **Add** server-side `verifyBackendPermission` calls on mutating event/timeline APIs (not done yet).
3. ~~**Decide assignment store**~~ **Done** — shifts only.
4. ~~**Normalize** `USER_ACCESS`~~ **Done** — `normalizeAccessTier` / `accessTierAtLeast`.
5. **Extend** `Styles.html` OR prefer JS `applyEditorMode()` over dozens of new CSS rules — event editor has many controls across `02_*` files; CSS-only may miss dynamically shown elements.
6. **Stale permissions:** document that IAM role edits require re-login; optional: `getBootPayload` could embed fresh permissions (larger change).

### 11.9 Keys in IAM vs wired status

| Key group | Saved to Vault | `userHasPerm` | CSS `req-*` | Backend API |
|-----------|--------------|---------------|-------------|-------------|
| `db_view_*`, `db_edit_*`, `db_delete_*` | Yes | Yes (classes) | Partial | Broken/inconsistent via `verifyBackendPrivilege` |
| `fin_*`, `hr_view_rates` | Yes | Yes | Partial | Mostly UI/tier |
| `event_create_*`, `event_edit_timeline`, `event_assets_window` | Yes | Classes only if true at login | **No** | **No** |
| `view_month_roster`, `view_logistics` | Yes | No | No | No |
| `task_manage_*` | Yes | No | No | No |
| `Is_Tunneling` | Yes | No | No | Boot payload filter only |
| `event_view_pricing` | Schema only | No | No | No |

### 11.10 Security note (out of scope but aware)

Passcodes live in Vault `Crew` sheet as plain text. RBAC plan does not change this; do not log passcodes during IAM work.
