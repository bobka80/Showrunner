# Global tasks (workbox)

**Entry:** [AI_DOCTRINE.md](../../AI_DOCTRINE.md) · **Index:** [Project_TODO.md](../Project_TODO.md)

**Last swept:** 2026-06-28 (codebase @ GAS **v345**)

---

## Visibility rules (product)

| Role | Task list shows |
|------|-----------------|
| **Manager** (MANAGER+ tier, `IsManager`, or `task_view_all`) | **All** global tasks |
| **Crew** | Only tasks where they are an **assignee** |

| Action | Permission |
|--------|------------|
| Create / edit / delete global tasks | `task_manage_global` (managers implicit via tier) |
| Update own assigned task progress | `task_manage_personal` (everyone) |

---

## IAM keys (splittable in role editor later)

| Key | Purpose |
|-----|---------|
| `task_view_all` | See every task in workbox (auto: MANAGER+ or `IsManager`) |
| `task_manage_global` | Create, assign, delete global tasks |
| `task_manage_personal` | Mark assigned tasks done / edit own progress |

**Server:** `canViewAllGlobalTasks_(crewName)` in `Security.js`  
**Client:** `canViewAllGlobalTasks()` in `07_Core_Globals.html`  
**Payload filter:** `getTasksAndNotifs()` in `Logistics_Tasks.js`

`task_view_all` is set on login bundle from vault row (`buildAuthBundleFromCrewRow_`).

---

## Files

| File | Role |
|------|------|
| `Logistics_Tasks.js` | Save, list filter, notifs on assign |
| `01b_Calendar_Tasks.html` | Desktop workbox + notif drawer |
| `01g_Mobile_Tasks.html` | Mobile task list |
| `Security.js` | `canViewAllGlobalTasks_`, IAM |

---

## Open

- [x] Assignee pills show crew **names** (resolve uid/email via directory roster) v348
- [x] Tasks stale-while-revalidate cache (30 min) + server-trusted list filter v348
- [ ] Debounce task-assign push when bulk-editing assignees
