# File Splitting & Modularization Guide ("Chopping")

As the ERP system grows, massive UI files (over 1,000+ lines) must be "chopped" into smaller, domain-specific modules. This ensures the codebase remains maintainable, fast, and easy for AI to surgically edit without losing context.

Here is the strict protocol for splitting a massive file (like we did with the `06b_Admin_Assets` file).

## 1. Domain Identification (The "Chop" Strategy)
Before moving any code, identify the isolated domains within the file. Typically, a massive file breaks down into:
* **Core / Engine:** State variables, bootloaders, and the main visual rendering loops (e.g., `06b1_Admin_Assets_Core.html`).
* **Forms / CRUD:** The Add/Edit modals, autosuggest logic, and backend save payloads (e.g., `06b2_Admin_Assets_Form.html`).
* **Auxiliary / Modals:** Specialized tools, audits, or isolated sub-menus (e.g., `06b3_Admin_Assets_Audit.html`).

## 2. Naming Conventions
Keep the original master prefix so the files group alphabetically in the IDE, but add numerical sub-steps and clear domain names:
* *Original:* `02e_Project_Logic.html`
* *Chopped:* `02e1_Logic_State.html`, `02e2_Logic_CRUD.html`, `02e3_Logic_Clipboard.html`

## 3. The Execution Steps
**CRITICAL RULE: ZERO CODE ALTERATION.** When splitting a file, you must *never* change the underlying code, logic, or context. The code must simply be physically separated into chunks exactly as it is.

**CRITICAL RULE: KEEP THE MONOLITH INTACT FOR SAFETY.** Do NOT remove or cut code from the original monolith file during the splitting process. The monolith must remain completely untouched as a backup until the final rewire and test.

**The AI / Director Workflow:**
1. **Propose Strategy:** The AI must first suggest the logical breakdown of the file and wait for the director's green light ("OK go").
2. **Iterative Delivery:** The AI provides the exact code for the new files *one by one*.
3. **Copy (Don't Cut) the Code:** The AI will provide the new file by copying the specific domain logic. The original monolith file is NOT modified. (If it's a frontend file, inject the required `<script>` tags). 
4. **Rewire & Test:** Once all chopped files are generated, the AI will rewire `Index.html` (or backend includes) to include the new files and comment out/exclude the monolith. The **director tests in the UI** and reports pass/fail.
5. **Cleanup:** Only after the director confirms everything works, the AI (or director on instruction) deletes the original monolith file.

The director does not execute file splits manually. The AI owns the technical steps; the director owns approval and UI verification.

## 6. Versioning (see DEPLOY_AND_ROLLBACK.md)
- **"This works"** → Git save via `works-save.js` (not Apps Script).
- **Milestone** → Apps Script version via `milestone.js`.

## 4. AI Context Anchors (`docs/ai/FILE_MAP.md`)
Whenever you chop a file, you must update the master Component Registry (`docs/ai/FILE_MAP.md`):
1. Add the new filenames to the appropriate domain section.
2. Ensure you briefly describe the exact responsibility of each new file (e.g., State, CRUD, Renderer).
3. If new global state variables are introduced, or new logic pipelines are created, you MUST autonomously update `docs/ai/ARCHITECTURE.md` according to the AI Doctrine in [AI_DOCTRINE.md](../../AI_DOCTRINE.md).

## 5. Dangerous Traps & Troubleshooting
* **The `let` / `const` Trap:** If a variable is declared as `let myVar = [];` in the Core file, the Form file can read and modify it perfectly. However, if the Form file accidentally redeclares `let myVar = [];`, the system will crash with a "has already been declared" syntax error.
* **Global Function Scope:** Standard `function doSomething() { ... }` declarations are naturally hoisted to the global scope. If you have trouble getting a chopped file to recognize a function, explicitly bind it to the window: `window.doSomething = function() { ... };`
* **Event Listeners:** If you have document-level event listeners (like `document.addEventListener('click', ...)`), try to keep them in the file that actually handles the resulting logic to prevent memory leaks or dual-firing.