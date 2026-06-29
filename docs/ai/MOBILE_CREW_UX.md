# Mobile Crew Field UX

**Status:** Implemented v314 (2026-06-26)  
**Entry:** [AI_DOCTRINE.md](../../AI_DOCTRINE.md) · [FILE_MAP.md](FILE_MAP.md)  
**Breakpoint:** `768px` — same single app, same `build.js` → `clasp push` pipeline. No separate mobile binary.

---

## Purpose

Crew on phones use the **Mobile Command Center** (unchanged shell) and open projects into a **Crew Hub** — not the full desktop project editor. Managers can still open **MANAGER: FULL EDITOR** from the hub.

**Non-goals on phone:** Creating/editing event phases via FullCalendar mini calendar (desktop only).

---

## Architecture (one app, layered modules)

| File | Role |
|------|------|
| `Styles_Mobile.html` | All `@media (max-width:768px)` rules + crew hub, phase rail, timeline zoom, compact PA CSS. Included after `Styles.html`. |
| `01d_Calendar_Mobile.html` | Command Center logic (home, events, RFID, notifs). Events → `openMobileCrewHub()`. |
| `01f_Mobile_Phase_Rail.html` | `buildPhaseSegmentsFromFragments()` + `renderMobilePhaseRail()` — deconstructed mini calendar from `project.fragments`. |
| `01e_Mobile_Crew_Hub.html` | Full-screen crew briefing: title, type, status, location, phase rail, weather, my shift, actions. |
| `01g_Mobile_Tasks.html` | MY TASKS view in Command Center. |
| `01h_Mobile_Assets.html` | `body.mobile-pa-compact` — assigned equipment only; tap group for formula detail sheet. |
| `03f_Timeline_Mobile.html` | Zoom slider, OVERVIEW / MY ROW on timeline when ≤768px. |

**Unchanged:** `02a`–`02e` pack/checkout logic, `Operations.js`, `Logistics_Timeline.js`, PWA `push-hosting/`.

---

## User flows

### Open project (phone)
1. Command Center → **EVENTS DIRECTORY**
2. Tap project card → **Crew Hub** (`#mobile-crew-hub-overlay`)
3. `applyProjectEditorMode()` runs via `syncProjectEditorHiddenFields()` (briefing/RBAC)

### Crew Hub actions
| Button | Behavior |
|--------|----------|
| **OPEN TIMELINE** | Hides hub → `launchMasterTimeline()` → zoom bar at ~38% (labels hidden until zoom in) |
| **PROJECT ASSETS** | `openMobileProjectAssets()` — vault pane hidden, pack/checkout buttons kept |
| **CANCEL** | Back to events list |
| **MANAGER: FULL EDITOR** | Only if `canFullEditProject()` — opens legacy `#edit-modal-overlay` + mini calendar |

### Timeline zoom (mobile)
- Bar injected at top of `#shift-layer`
- Slider 25%–100%; **OVERVIEW** = 38%
- **MY ROW** zooms to ~90% and scrolls to crew name match
- **CANCEL** on timeline returns to Crew Hub if opened from mobile

### Project Assets (mobile compact)
- Class `mobile-pa-compact` on `body` (Crew Hub → PROJECT ASSETS)
- **Logistics only** — no Offer tab; **PRINT** for paper checklists
- **SEARCH** → bottom sheet: vault search, **+ ADD** goes to **General** list only
- **SAVE** (compact) — persists qty/add changes via normal equipment save
- **Design mode** default (full tree, collapse triangles, sublist names, qty +/−)
- **Packing mode** toggle kept — for packing into cases (cables, etc.)
- **Check-out / check-in** + scanner bar when operation active
- Hides: vault split pane, CLI syntax bar, clipboard, new sublist, office tools (truck/load-in/auto-pack in PA header)
- Tap group header → bottom sheet with full formula (list shows sublist name only)
- Cancel → returns to Crew Hub

### Tasks
- Command Center → **MY TASKS** — reuses `globalTasks` + `openTaskModal()`

---

## Phase rail data

Same source as `01c_Calendar_Mini.html` fragment unpacker:

```javascript
buildPhaseSegmentsFromFragments(project.fragments)
// → [{ type: 'wh'|'main'|..., startStr, endStr, note, ... }]
```

Colors use existing `--color-paint-*` CSS variables.

---

## Weather (crew hub)

- Shown only when project is **outdoor** (`p.outdoor` or `readinessState.outdoor`)
- Geocodes `locationUrl` via Nominatim if no lat/lng
- Open-Meteo daily forecast for project start–end range
- Horizontal scroll strip per day

---

## Testing checklist (phone / narrow window ≤768px)

1. Command Center still loads; Events, Tasks, RFID, Notifications work.
2. Tap event → Crew Hub (not full editor toolbar).
3. Phase rail shows WH / MAIN / etc. with dates (if fragments exist).
4. Outdoor project → weather strip appears.
5. OPEN TIMELINE → zoom bar; overview hides shift labels; slider shows detail.
6. PROJECT ASSETS → assigned list; PRINT + SEARCH + SAVE; Design/Packing toggle; PACK / CHECK-OUT when permitted.
7. SEARCH → add item to General; SAVE after qty changes.
8. Tap formula group → detail sheet (full formula).
9. Manager account → MANAGER: FULL EDITOR visible.
10. Desktop width >768px → unchanged dashboard; no crew hub takeover.

---

## Next work (after mobile sign-off)

- Mobile project editor: **Truck arrangement** + **venue unload** buttons (deferred)
- Real push notification scenarios: [topics/notifications-catalog.md](topics/notifications-catalog.md) (deploy: [notifications.md](topics/notifications.md))
- Optional: `saveAndCloseShifts()` return path to Crew Hub
- Optional: share `buildPhaseSegmentsFromFragments` with `01c` to dedupe

---

## Deploy

Same as always:

```bash
node build.js
node milestone.js "description"
# hosting only if push-hosting changed:
node deploy-hosting.js
```
