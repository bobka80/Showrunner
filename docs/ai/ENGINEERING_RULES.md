# Engineering Rules — System Prompt & Directives

Full engineering mandates for AI agents. Entry point and workflow: [AI_DOCTRINE.md](../../AI_DOCTRINE.md).  
Fragile areas checklist: [FRAGILE_ZONES.md](FRAGILE_ZONES.md).  
File routing index: [FILE_MAP.md](FILE_MAP.md) (replaces deprecated `Project_Index.md`).

---

## 0. THE PRIME DIRECTIVE: STRICT CONTEXT AWARENESS (NO GUESSING)

CRITICAL RULE: Before generating any code updates, you MUST read the specific files you need from the repository. If you cannot access a required file, STOP. DO NOT GUESS OR HALLUCINATE FILE CONTENTS. Ask the director to confirm the file exists or grant access.

In Cursor Agent mode, use read/search tools proactively rather than assuming contents from memory.

---

## 1. SURGICAL EXECUTION & ZERO OVERWORK

- **Do not overwork.**
- **Do not suggest "cool" features unless strictly requested.**
- **Provide surgical fixes ONLY.**
- **Do NOT modify surrounding code if it is not necessary.**
- Keep diffs as small and focused as possible.

---

## 2. THE PRIMARY KEY MANDATE

- Every table/sheet MUST have a Primary Key column labeled `uid`.
- Never reference an entity by name or row index alone.
- Entities requiring UIDs: Users, Assets, Bundles, Cases, Presets, Areas, Sub-Warehouses, Warehouses, Vehicles, Events, Maintenance Logs, Tasks, Ledger Entries.

---

## 3. RELATIONAL LINKING & MATRYOSHKA PROTOCOL

- Containerization is dynamic. In frontend JS use `containerUid` on ProjectAsset objects; in Sheets use `container_uid` — same concept.
- The `Assets` table uses `nesting_level` (0–6) and `container_type`.

---

## 4. ENTITY VS. JSON SEPARATION

- **Entity Storage:** Anything counted, moved, searched, or scheduled MUST be a relational entity with `uid` and foreign keys.
- **JSON Storage:** ONLY user settings, UI preferences, and `System_Config` may live as single-cell JSON. Never store entity lists in JSON blobs.

---

## 5. AUTONOMOUS EXPANSION

- New features → new tables with PK/FK, `timestamp` or `last_updated`.
- Naming: `lowercase_with_underscores` or `Pascal_Snake_Case` for sheet columns.

---

## 6. THE 30-TABLE ARCHITECTURE (VAULT VS. ENGINE)

**THE VAULT (Master Data — 15 Tables)** — backend: `Resources_*.js`  
`Crew_Roster`, `Role_Permissions`, `System_Config`, `System_Departments`, `Asset_Tags`, `Clients`, `Vehicles`, `Vendors`, `Warehouses`, `Subzones`, `Storage_Areas`, `Assets`, plus target **`Cases`**, **`Kits`**, **`Presets`** (latter three **planned** — kit logic today lives in `Assets` + `generateBlueprint`)

**THE ENGINE (Transactional — 15 Tables)** — backend: `Logistics_*.js`  
`Projects_Index`, `Project_Timelines`, `Shift_Assignments`, `Phase_Blocks`, `Dept_Overrides`, `Leave_Tracker`, `Global_Tasks`, `Task_Assignees`, `Task_Todos`, `Task_Assets`, `Project_Checklists`, `Notifications`, `Project_Assets`, `Conflict_Overrides`, `Operations_Ledger`

See also [SCHEMA.md](SCHEMA.md) for core JSON object shapes.

---

## 7. WAREHOUSE OPERATIONS (APPEND-ONLY LEDGER)

- Check-In/Check-Out must NEVER directly mutate assignment quantities during warehouse sessions.
- Append rows to `Operations_Ledger` with `session_uid`, `project_uid`, `asset_uid`.

---

## 8. TRIANGLE OF TRUTH (BIDIRECTIONAL FORMULAS)

The formula system has three corners — see [FRAGILE_ZONES.md](FRAGILE_ZONES.md) and [ARCHITECTURE.md](ARCHITECTURE.md):

1. **Human Written Formula** — slash-based CLI input
2. **Beautiful Formula** — visual representation for reviewers
3. **The List** — actual equipment rows

**Bidirectional:**
- **Formula → List:** First write parses left-to-right and draws equipment.
- **List ↔ Formula:** The list also represents the formula; all three must stay synchronized.

The DB `formula` field is a **sublist name/identifier**, not the source of truth for which items exist. The **items dictate the formula**, not the reverse. NEVER string-replace the DB `formula` column to infer project contents.

---

## 9. FINANCIALS ENGINE PRE-REQUISITES

- `Projects_Index`: `rental_days`, `global_discount` (**planned Phase 1** — not in `Logistics_Schema.js` yet)
- `Project_Assets`: `overridePrice` in frontend JS (camelCase; historical price snapshot — see [SCHEMA.md](SCHEMA.md))
- **Currency:** Euros (€) only — never dollars ($)

---

## 10. ENTERPRISE AUDIT LOGGING MANDATE

- Every backend CREATE/UPDATE/DELETE/RESTORE → `writeToAuditLog` after `flushCache()`
- `targetName` = entity `uid`
- `actor` = `ACTIVE_USER_NAME` from frontend

---

## 11. STRICT SCHEMA DOMAIN ISOLATION

- `verifyVaultSchema()` → `Resources_*.js` (Master Data) only
- `verifyDatabaseSchema()` → `Logistics_*.js` (Transactional) only
- NEVER place schema builders in `Security.js`, `Main.js`, or frontend files

---

## 12. FILE ROUTING INDEX

For component breakdown and `@INDEX:` markers → [FILE_MAP.md](FILE_MAP.md)

---

## 13. EXTERNAL AUDIT ENGINE (ISOLATED DB)

- Temporary audit data → external sheet (`AUDIT_DB_SHEET_ID`)
- NEVER store massive iteration/review state in `System_Config` JSON

---

## 14. MATRYOSHKA PROTOCOL & SOFT ALLOCATION

- **UI:** Top-down (case contains items). **DB:** Bottom-up (child holds parent link).
- **Soft allocation (planning):** Quantities without exact unit IDs.
- **Hard allocation (operations):** Unit IDs bound at RFID checkout only.

---

## 15. AUTO-CONTAINERIZATION VS. AUTO-PACKING

NEVER mix these engines. See [FRAGILE_ZONES.md](FRAGILE_ZONES.md).

- **Fluid Kits:** `recalcAutoContainers()` in **`02e5_Logic_Sync.html`**
- **Loose Bulk:** `autoProvisionCableCases()` in **`02e4_Logic_Containers.html`**
- **Fixed Racks:** Hard-allocated kit subtype — bypasses soft allocation

**`processFormulas()` duplication trap:** Canonical logic in `02e5_Logic_Sync.html`; duplicate copies in `02a_Project_Equipment.html` and `02_Project_Editor_Logistics.html`. Edit all copies or consolidate — see [FRAGILE_ZONES.md](FRAGILE_ZONES.md).

---

## 16. REGIONAL LOCALIZATION (BULGARIA)

- **Display:** `DD.MM.YYYY`
- **Data/API:** ISO `YYYY-MM-DD` only

---

## 17. DOCUMENTATION AND COMMENTS MANDATE

- Descriptive comments on non-obvious changes
- Update [FILE_MAP.md](FILE_MAP.md) and [ARCHITECTURE.md](ARCHITECTURE.md) on architectural changes
- Log production incidents in [FRAGILE_ZONES.md](FRAGILE_ZONES.md) Incident Log (director approval required)
- New `.html` modules: add to [FILE_MAP.md](FILE_MAP.md) **and** `Index.html` includes
- New structural UI (buttons, modals, hubs): follow [UI_DOCTRINE.md](UI_DOCTRINE.md); do not conflate with Module Visual Settings

---

## 18. STRUCTURAL UI (NOT VISUAL SETTINGS)

- **Structural:** `Styles.html` classes — buttons, modals, hub chrome, form labels → [UI_DOCTRINE.md](UI_DOCTRINE.md)
- **User-tunable density:** calendar event height, timeline rows, grid columns, phase colors → `06c_Admin_Visuals.html` / `GridEngine` — never “normalize” these in structural CSS passes

---

*Agent-neutral engineering rules — June 2026*
