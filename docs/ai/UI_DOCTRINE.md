# UI Doctrine — Structural Design System

**Authority:** All new structural UI in Showrunner MUST follow this document.  
**Entry point:** [AI_DOCTRINE.md](../../AI_DOCTRINE.md)  
**Implementation:** `Styles.html` (compiled into `Index.html` via `build.js`)

---

## 1. Two layers (do not confuse them)

| Layer | What it controls | Where it lives | Agent rule |
|-------|------------------|----------------|------------|
| **Structural UI** | Buttons, modals, hub chrome, form labels, tabs, login | `Styles.html` + HTML class names | **Follow this doctrine** |
| **Module Visual Settings** | Grid row height, font size, column widths, calendar event height, phase colors, timeline shift geometry | `06c_Admin_Visuals.html`, `getModuleVisualSettings` / `saveModuleVisualSettings`, `GridEngine` | **Do not hardcode or “normalize away”** — users tune per module |

**Modules with visual settings (hands off):** `timeline`, `cal`, `mini`, `mr`, `asset`, `projectAsset`, `tracker`  
**Also hands off:** mobile touch scale (`01d_Calendar_Mobile.html`), matrix micro-type inside data grids (10–11px in cells).

---

## 2. Design DNA

- **Dark operations console** — zinc backgrounds, uppercase action labels, heavy weights (800–900 on actions)
- **Font:** `Inter` only (loaded in `Index.html` / `Login.html`)
- **Semantic color language** (do not flatten):
  - Green `#10b981` — save / confirm (`.btn-main`)
  - Red `#ef4444` — cancel / delete (`.btn-close`, `.btn-delete`)
  - Purple `#a855f7` — timeline / settings accent (outline, not solid fill for primary nav actions)
  - Orange `#f97316` — warehouse / project assets accent (outline)
  - Blue `#3b82f6` — crew / info actions (`.btn-blue`)
  - Teal `#698b99` — brand accent (`--accent`), nav hover, legacy `.btn-new`

---

## 3. CSS variables (`:root` in `Styles.html`)

| Token | Value | Use |
|-------|-------|-----|
| `--bg-dark` | `#0a0a0c` | Page canvas |
| `--bg-sidebar` | `#111114` | Shell / hub headers |
| `--bg-cell` | `#1a1a1e` | Cards, panels |
| `--bg-header` | `#27272f` | Table/calendar headers |
| `--bg-event` | `#222228` | Event chips |
| `--accent` | `#698b99` | Brand |
| `--text-main` | `#f4f4f5` | Body |
| `--text-muted` | `#71717a` | Muted labels |
| `--radius-cell` | `10px` | Calendar cells |
| `--radius-event` | `6px` | Event chips |

**Theme:** `changeUserTheme()` / `.theme-light` in `07_Core_Globals.html` — light mode overrides exist; new structural classes need light-theme rules in `Styles.html` when added.

---

## 4. Typography ladder (structural only)

| Level | Size | Weight | Class / use |
|-------|------|--------|-------------|
| View title | 16px | 900 | `.view-header-title` |
| Modal / panel title | 16px | 800 | `.modal-title` |
| Section title (in-panel) | 14px | 800 | `.section-title` |
| Field label | 11px | 700 uppercase | `.input-label` |
| Default button text | 12px | 800 uppercase | `.btn-*` |
| Body copy | 13px | 400–700 | Lists, descriptions |
| **Floor** | **10px** | — | Do not go below 10px for readable structural labels |

---

## 5. Control scales

| Scale | Height | Class | Use |
|-------|--------|-------|-----|
| **Default** | ~40px (12px pad) | global `input, select` | Modals, IAM forms, standard footers |
| **Compact** | 32px | `.input-compact` | Hub header toolbars only (search, date filters) |
| **Toolbar** | 42px | inline in project editor | `02_Project_Editor_Core.html` top row only — do not spread elsewhere |
| **Small button** | ~28–32px | `.btn-sm` | Dense header actions (Prev/Next, RE-SCAN) |
| **Micro** | 24–28px | — | Inside grids / kit inspectors only (visual-settings territory) |
| **Touch** | 44px+ | `.btn-mobile-nav` | Mobile only — do not shrink |

**Input defaults (modals):** `padding: 14px`, `background: #27272a`, `border: 1px solid #333`, `border-radius: 6px`, `width: 100%`.

---

## 6. Button taxonomy

All buttons use the unified base in `Styles.html` (12px, 800, uppercase, 6px radius) unless `.btn-sm` or exempt.

| Class | Meaning |
|-------|---------|
| `.btn-main` | Save, confirm, calculate, authenticate |
| `.btn-outline` | Secondary navigation, open, filter |
| `.btn-outline-purple` | Timeline-related actions (gray fill + purple border) |
| `.btn-outline-orange` | Project assets / warehouse actions (gray fill + orange border) |
| `.btn-close` | Cancel (red tint) |
| `.btn-delete` | Destructive (stronger red) |
| `.btn-add` | Additive secondary (gray) |
| `.btn-blue` | Crew / info domain |
| `.btn-orange` / `.btn-purple` | **Solid** domain fills — avoid for primary editor footer; prefer outline variants above |
| `.btn-settings` | Visual settings entry (purple outline) |
| `.btn-tab` + `.btn-tab.active` | Hub top tabs and segmented toggles |
| `.btn-ghost` | Text-only actions (CLEAR, dismiss ✖) |
| `.btn-sm` | Compact padding for toolbars |

**Tab switching (JS):** use `classList.add/remove('active')` on `.btn-tab` elements — never inline `cssText` for tab states.

---

## 7. Layout patterns

### Full-screen view header (70px)

```html
<div class="view-header">
  <h2 class="view-header-title">TITLE</h2>
  <!-- optional modifiers: view-header-title--green, --amber -->
  <button class="btn-tab active">TAB</button>
  <div style="flex:1;"></div>
  <div class="view-header-actions">…compact controls…</div>
</div>
```

Used by: Master Settings, Financials Hub, Audit Studio, Equipment Tracker, Month Roster.

### Modal shell

```html
<div class="modal-overlay">
  <div class="modal">
    <h3 class="modal-title">Title</h3>
    <!-- body -->
    <div style="display:flex; gap:12px; justify-content:flex-end;">
      <button class="btn-close">CANCEL</button>
      <button class="btn-main">SAVE</button>
    </div>
  </div>
</div>
```

Default modal: `max-width: 450px`, `padding: 30px`, `border-radius: 12px`. Wider variants use inline `max-width` on `.modal` only when content requires it.

**Visual settings HUD:** transparent overlay + floating `.modal` — intentional exception; do not add dark blur overlay.

### Segmented tab bar

```html
<div class="tab-bar tab-bar--segmented">
  <button class="btn-tab active">A</button>
  <button class="btn-tab">B</button>
</div>
```

### Checkboxes (forms)

Use `.crew-cb` for IAM and structural forms. Timeline grid uses `.crew-cb.small-cb` — do not change those sizes.

---

## 8. Project editor footer (canonical actions)

| Button | Class |
|--------|-------|
| OPEN TIMELINE | `btn-outline btn-outline-purple` |
| PROJECT ASSETS | `btn-outline btn-outline-orange` |
| SAVE & SYNC | `btn-main` |
| CANCEL | `btn-close` |

When timeline is locked by another user: `btn-outline` with red border (presence ping in `02_Project_Editor_Core.html`).

---

## 9. Adding new UI — checklist

1. Read this file and `Styles.html` — reuse classes before inventing inline styles.
2. **Modals / forms / hubs** → structural layer only.
3. **Data grids / calendars / timelines** → if density is user-tunable, wire through Visual Settings + `GridEngine`; do not fix row heights in `Styles.html`.
4. New hub? Use `.view-header` + `.btn-tab` for top navigation.
5. New modal? Use `.modal-title` + standard footer button row.
6. New accent action? Prefer `.btn-outline-{color}` over solid `.btn-{color}` for navigation-style buttons.
7. After HTML changes: `node build.js` then `node dev-push.js` (or milestone when directed).
8. If you add a new structural class to `Styles.html`, add matching `.theme-light` rules when applicable.

---

## 10. Anti-patterns (do not reintroduce)

- Inline tab `style.cssText` switching
- Solid `.btn-purple` for OPEN TIMELINE
- Native `scale(1.3)` IAM checkboxes (use `.crew-cb`)
- 9px form labels (minimum `.input-label` at 11px)
- Mixing 60px and 70px hub headers (standard is **70px** via `.view-header`)
- Forcing 14px padding inputs into tracker grid cells
- Editing `dist/` directly

---

## 11. File map (structural UI)

| File | Role |
|------|------|
| `Styles.html` | All structural CSS — **source of truth** |
| `Index.html` | Includes `Styles.html` + module fragments |
| `00a_UI_Layers.html` | Full-screen layers (tracker, roster, timeline shell) |
| `00b_UI_Hubs.html` | Master Settings overlay |
| `00c_UI_Forms.html` | IAM / asset / client modals |
| `00d_UI_Visuals.html` | Visual settings drawer markup (HUD) |
| `00e_UI_Modals.html` | Task, logistics, sync modals |
| `02_Project_Editor_Core.html` | Project editor chrome + footer buttons |
| `09_Financials_Hub.html` | Financials hub |
| `06f_Admin_Audit.html` | Audit studio |
| `Login.html` | Login (uses same `.btn-main` green semantics) |
| `06c_Admin_Visuals.html` | Visual settings **logic** (not structural doctrine) |

---

*Established June 2026 — structural UI pass after RBAC sidebar milestone v267.*
