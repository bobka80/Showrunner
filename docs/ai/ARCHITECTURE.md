# Architecture & Known Traps

**Entry:** [AI_DOCTRINE.md](../../AI_DOCTRINE.md) · **Map:** [README.md](README.md)

This document explains the advanced architectural concepts running in the ShowRider application and maps out the **Fragile Mechanics** that AIs and developers must preserve.

> **Pre-change checklist:** See [FRAGILE_ZONES.md](FRAGILE_ZONES.md) before editing dangerous areas.  
> **Director workflow:** See [DIRECTOR_WORKFLOW.md](DIRECTOR_WORKFLOW.md).

## 1. The Optimistic Healing Engine
When a user works with the project equipment, multiple users could theoretically be editing the same project. To manage this, the server utilizes **Unique IDs (`uid`)** for each ProjectAsset assignment.
- When changes are synced to the backend, the backend diffs the `uid`s against the database.
- **Rule**: If the backend sees multiple objects with the *exact same `uid`*, the Optimistic Healing Engine assumes it is a duplication glitch and squashes them into a single object.
- **Why this matters**: If you split one object into multiple pieces on the frontend, you MUST delete the `uid` from the clones so the backend assigns them fresh IDs.

**Multi-user warehouse (Project Assets):** Checkout uses a shared ops ledger; list editing uses deltas + Optimistic Healing but is **not** yet safe for many simultaneous editors without save discipline. Full backlog: [topics/project-assets-concurrency.md](topics/project-assets-concurrency.md). Station host/empty scan rules: [topics/logistics-warehouse.md](topics/logistics-warehouse.md).

---

## 🛑 KNOWN TRAPS & FRAGILE MECHANICS

### The "Triangle of Truth" (Formula Engine — Bidirectional)
- **Location:** Project Syntax & Rendering (`02b_Project_Syntax.html`, `02d_Equipment_Render.html`)
- **The Three Corners:** The formula mechanism relies on three fragile, interconnected states that must never be broken:
  1. **The Human Written Formula:** Fast slash-based input from the operator (segments separated by `/`). This is the quick way to work.
  2. **The Beautiful Formula:** A visual, human-readable representation of the same logic — for reviewers who did not create the list or are reading it long after the fact.
  3. **The List:** The actual equipment rows drawn from the Vault and assigned to the project.
- **Bidirectional — not one-way:**
  - **Formula → List:** When the human writes the slash formula the **first time**, the engine parses **left-to-right** and **draws equipment**, creating the list.
  - **List → Formula:** The equipment list **also represents** the formula. The three corners must stay in mutual agreement — not "list reflects formula" alone.
- **The Impact:** If an AI or script modifies the parser, renderer, or list CRUD in isolation, it risks severing the bidirectional link. Users lose the ability to trust what they typed, what they see on screen, and what is actually assigned. You must maintain perfect harmony across all three corners.
### 2. The Generalization Engine (The "Blindness" Quirk)
- **Location:** `07c_Generalization_Engine.html` (`generateBlueprint`)
- **The Trap:** When the software mathematically averages the contents of multiple parent cases to create a "Blueprint", it intentionally strips away all unique metadata (like `assetId`, `containerType`, `category`, and IDs) returning only a raw array of `{ name, qty }`.
- **The Impact:** Because it strips the IDs, the software becomes "blind" to the unique assets. Downstream UI logic in the Assets window will fail to group pictures or detect logical parents because the `assetId` links have been severed. AIs must *never* attempt to force ID matching on Blueprint components without accounting for this intentional stripping.

### 3. The `processFormulas()` Explosion Engine
- **Location:** Canonical implementation in `02e5_Logic_Sync.html`. **Duplicate copies** also exist in `02a_Project_Equipment.html` and `02_Project_Editor_Logistics.html` — editing one without the others is a common break.
- **The Trap:** During synchronization (`autoSaveAndExecute`), the `processFormulas()` interceptor scans the payload. If it detects any physical asset (i.e., NOT `type: "Bulk"` and NOT a Consumable) with a `qty > 1` (and it isn't an Auto-Container), it forcefully "explodes" that item into multiple individual array elements where `qty = 1`. 
- **The Impact:** Attempting to group physical items on the backend by summing their quantities is futile—`processFormulas()` will rip them apart immediately upon saving. Bulk items intentionally bypass this so they can be grouped.

### 4. Top-Down vs. Bottom-Up Packing (Matryoshka Protocol)

> **Canonical equipment model (Bulk vs unique, two packing engines, cable-case bind gap):** [EQUIPMENT_MODEL.md](EQUIPMENT_MODEL.md)

- **Location:** `02e4_Logic_Containers.html`
- **The Trap:** The UI allows users to pack "Phantom" or generic cases (e.g., "Auto-Container") using a "Top-Down" approach. However, the Relational Database ALWAYS links "Bottom-Up" (Physical items point to their parent UID).
- **The Impact:** AIs must not attempt to lock physical Case UIDs in the frontend packing UI. UIDs are only locked at checkout (via RFID or ledger commits in `Operations.js`).

### 5. Auto-Containerization vs. Auto-Packing
There are two completely distinct automated protocols handling container logic:
- **Auto-Containerization (The Fluid Kit Engine)** — `recalcAutoContainers()` in **`02e5_Logic_Sync.html`** (invoked from `02e2`, `02e4`, `02e5`): Applies to physical items nesting in standard cases. Dynamically creates and destroys generic container rows.
- **Auto-Packing (The Bulk Cable Engine)** — `autoProvisionCableCases()` in **`02e4_Logic_Containers.html`** (triggered from `02_Project_Editor_Logistics.html` before manifest): Applies to loose `type: "Bulk"` items (like cables). Rigid protocol forcing unboxed bulk cables into trunks for Truck Arrangement CAD.

### 6. The Unified CLI Regex (Case Rounding)
- **Location:** `02b_Project_Syntax.html`
- **The Trap:** The syntax engine dynamically parses inputs like `12x Fixtures` or mathematical formula strings using a highly specific Regex (`/^\s*(\d+)(?:\s*(?:x|\*)\s*|\s+)(.*)$/i`).
- **The Impact:** Modifying this regex to "clean it up" breaks the fuzzy matcher's ability to seamlessly transition between manual search queries and math execution. Leave the parser logic alone.

### 7. The Ghost Link Purge
- **Location:** `02e4_Logic_Containers.html` (`autoProvisionCableCases`)
- **The Trap:** Before auto-packing bulk cables, the engine runs a silent purge that destroys broken container links (`containerUid`) to prevent database orphans. 

---

## 8. The 1MB Workaround Build Process (Async Chunk Fetching)
Google Apps Script (GAS) has a hard file size limit of ~1MB for HTML templates, and `HtmlOutput` will silently truncate large string injections via `<?!= ... ?>`, causing catastrophic `Uncaught SyntaxError: Invalid or unexpected token` errors in Chrome because the script tag is left open/incomplete. To support complex logic, we utilize an extraction build step and an ASYNC frontend chunk loader.
- `build.js` scans `Index.html` and extracts any `<script>` tag that does not have a `src`.
- It deletes those scripts from the `.html` file, slices the combined logic into chunks, and writes one file per chunk — `dist/LogicPayload_${index}.js` (each defines `FRONTEND_CHUNK_${index}`) plus a `dist/LogicPayload_Master.js` dispatcher. Any stale `dist/LogicPayload.js` is removed.
- It dynamically injects an `async fetcher` (polyfill) into `dist/Index.html` that uses `google.script.run.getFrontendLogicChunk(index)` to piece the massive script back together on the client side, completely bypassing the `HtmlTemplate` string injection limit.
- **Warning**: Do not manually edit `dist/Index.html`! Any changes will be instantly overwritten the next time `node build.js` runs. Only edit the source `.html` files in the root directory.
- **Critical AI Instruction**: NEVER revert the loader to use inline evaluation (e.g., `<?!= getFrontendLogic() ?>`). It might seem faster, but it guarantees UI failure and broken calendars.

---

## 9. Google Drive Synchronization System

> **Full host folder map** (`STAGE_MASTERS_SYSTEM_ROOT`, `05_DATABASE`, backups/replaced/archives, Showrunner Sync): [DRIVE_LAYOUT.md](DRIVE_LAYOUT.md). Do not duplicate that tree here.

The backend (primarily within `Integrations.js`) drives an intelligent, customized Google Drive sharing and syncing system, comprising the following mechanics:
- **Dynamic Hierarchy & Template Cloning**: Creates a structured `Year -> Month -> Event Name` folder hierarchy. It clones master template folders separately for Operations and Financials.
- **Smart Renaming Rules**: Evaluates `config.renameRules` when generating new folders to seamlessly append or prepend the project's name to the cloned template files.
- **Mirrored Sync Trees (The Shortcut Engine)**: To avoid flooding users with massive master folders, the system generates "Personalized Sync Hubs" (`Showrunner Syncs/[User Name]`). Based on vault configs, it deploys Drive *Shortcuts* of the exact files/folders each specific manager requires directly into their personal hierarchy.
- **Retroactive Sync**: A failsafe engine (`runRetroactiveDriveSync`) that scans existing projects and safely injects any newly requested shortcuts into a user's personal hub without breaking existing files.
- **Task-Driven Document Generation**: The `processChecklistAction` function watches UI checklists. When a checklist task is completed, it can autonomously duplicate a template file in Drive, add a suffix, and route it to a target destination folder.

---

## 10. Role-Based Access Control (RBAC) & The Security Engine
ShowRider utilizes a decoupled, Granular Role Matrix for security, primarily driven by `Security.js`.
- **Roles Define Access, Not Users:** The `System_Access` tier (`CREW`, `EDITOR`, `MANAGER`, `ADMIN`, `ROOT`) is an attribute of the *Role* definition, not the *User*. When a user logs in, the engine looks up their assigned `Role_ID` and pulls the corresponding `System_Access` tier and granular checkbox permissions (e.g., `fin_view_roi`, `db_view_assets`) directly from the Role Matrix. Standard Crew members are locked out of writes by default unless specifically allowed by isolated endpoint overrides.
- **The Base64 JSON Transfer Payload:** To prevent the Google Apps Script template engine from corrupting nested JSON permission objects (via automatic HTML entity escaping, which crashes the frontend), the backend encodes the `userPermissions` bundle into a safe Base64 string in `Main.js`. The frontend (`Index.html`) then decodes this string via `atob()` during the boot sequence. Future AI agents must **never** attempt to inject raw JSON objects directly into the `<meta>` tags or `<script>` tags without Base64 encoding.
- **The Bogdan Failsafe:** The system owner is permanently protected from database-schema corruption lockouts. If the login name evaluates to `bogdan`, the backend completely bypasses all database-assigned roles, forcefully sets `sysAccess = 'ROOT'`, and forcefully grants all granular permissions. This ensures the Master Settings UI is always accessible to the owner to fix database issues.

---

## 11. Deploy Pipeline (Source → Build → Google Apps Script)

When an AI agent changes frontend code, the live web app will **not** update until this pipeline runs:

1. **Edit source only** — Root `.html` files and backend `.js` files. Never hand-edit compiled output in `dist/` except to verify build output.
2. **Run the compiler** — From the project root: `node build.js`  
   This extracts inline scripts, generates chunked payloads, and refreshes `dist/`. Root Node tooling is excluded via **`gas-node-only.js`**.
3. **Deploy to GAS** — `gas-push-sync` (via `milestone.js` or `dev-push.js`). **Not** bare `clasp push` — orphans on Google’s server cause white-screen boot failures if they are PC-only scripts (`require is not defined`). See [FRAGILE_ZONES.md](FRAGILE_ZONES.md) § Node-only files.
4. **Verify** — `node check-google-account.js` (check **3** = no Node-only files on remote GAS). Hard refresh web.app; confirm login boots.

**Index.html wiring rule:** Every production `.html` module must appear as `<?!= include('ModuleName'); ?>` in root `Index.html` or it will **not** ship in the build. Orphan files on disk are invisible to the live app.

**Naming note:** In frontend JavaScript objects, nesting uses `containerUid` (camelCase). In Google Sheets / relational columns, the equivalent may appear as `container_uid` (snake_case). Do not treat these as different concepts.
