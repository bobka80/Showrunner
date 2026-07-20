# DAL Phase 0 — Codebase discovery report

**Date:** 2026-07-13  
**Campaign:** [data-access-layer.md](data-access-layer.md) · **Design lock:** [dal-firebase-design-lock-2026-07-13.md](dal-firebase-design-lock-2026-07-13.md)  
**Mode:** Read-only sweep — **no code changes** · **Status:** **ARCHIVED** (Phase 0 complete)

---

## Executive summary

| Finding | Severity |
|---------|----------|
| `saveProjectAssetsDelta` rewrites the **entire** `Project_Assets` ENGINE sheet on every save | **Critical** — design lock §9 confirmed |
| `saveTimelineData` rewrites **entire** `Shifts`, `Blocks`, `Overrides` (+ optional `Timelines`) sheets per save | **Critical** |
| `batchProcessOperations` rewrites the **entire** `Operations_Ledger` sheet on every scan batch | **High** — not append-only at sheet level |
| Timeline / project index saves have a **2-second `Last_Updated` collision check** only — not row-level | **Partial mitigation** — still lose concurrent edits outside window |
| No repository layer today — all paths call GAS functions → `verifyDatabaseSchema()` → sheet ranges | Expected — DAL Phase 1 target |

**Recommendation:** Proceed with design lock order. **Phase 3 (delta-only / scoped writes) is mandatory before Firebase.** Highest repo boundaries: `ProjectAssetsRepo`, `TimelineRepo`, `LedgerRepo`.

---

## 1. `clearContents()` + full-rewrite inventory (ENGINE)

*Source files at repo root (not `dist/`). Pattern: read whole sheet → filter in memory → `clearContents()` → `setValues()` entire sheet.*

| Function | File | Sheet(s) | Scope | Pattern |
|----------|------|----------|-------|---------|
| `saveProjectAssetsDelta` | `Logistics_Assets.js` | `projectAssets` | **All projects** — keeps other projects' rows, rewrites full tab | Full-rewrite |
| `saveTruckArrangementAPI` | `Logistics_Assets.js` | `projectAssets` | All projects | Full-rewrite |
| `saveProjectAssetsAPI` | `Logistics_Assets.js` | `projectAssets` | All projects | Full-rewrite |
| `generateLogisticsPayloadAPI` | `Logistics_Assets.js` | `projectAssets`, `shifts` | All projects on PA; shifts for one project | Full-rewrite |
| `saveTimelineData` | `Logistics_Timeline.js` | `shifts`, `blocks`, `overrides`, `timelines` | Per-project strip + rewrite **whole sheet** each | Full-rewrite |
| `saveProjectData` | `Logistics_Projects.js` | `timelines` | Per-project strip + rewrite whole `Project_Timelines` tab | Full-rewrite |
| `restoreProjectWithConflictCheck` | `Logistics_Projects.js` | `shifts` (+ others in delete path) | Project restore | Full-rewrite |
| `deleteProjectFull` | `Logistics_Projects.js` | multiple ENGINE tabs | Project delete | Full-rewrite per touched tab |
| `batchProcessOperations` | `Operations.js` | `opsLedger` | **All sessions** — rebuild ledger from kept + session rows | Full-rewrite |
| Task/notification saves | `Logistics_Tasks.js` | `taskTodos`, `taskAssignees`, `taskAssets`, `notifs` | Various | Full-rewrite (admin-scale, lower concurrency risk) |
| Vault / warehouse / security | `Resources_Vault.js`, `Resources_Warehouse.js`, `Security.js`, etc. | VAULT tabs | Admin CRUD | Full-rewrite (out of DAL Phase 3 hot path) |

---

## 2. `saveProjectAssetsDelta` — end-to-end trace

### Client

| Step | Location | What happens |
|------|----------|--------------|
| Delta calc | `02e5_Logic_Sync.html` — `window.calculatePaDeltas()` | Diff `originalProjectAssets` vs `currentProjectAssets` by composite key (assetId, location, formula, containerUid) → `{ assetId, location, rawFormula, containerUid, deltaQty, isBulk, creator }` |
| Auto-save | `02e5_Logic_Sync.html` — `autoSaveAndExecute()` | If deltas.length > 0 → `google.script.run.saveProjectAssetsDelta(projectId, deltas, actor)` then re-fetch via `getProjectAssets` |
| Manual save | `02e5_Logic_Sync.html` — `saveProjectAssets()` | Same `calculatePaDeltas()` → `saveProjectAssetsDelta` |
| Ops / checkout | `02c_Project_Operations.html` | PA deltas after scan operations |
| Logistics wizard | `02_Project_Editor_Logistics.html` | `calculatePaDeltas()` before logistics steps |

### Server (`Logistics_Assets.js:11-94`)

1. `verifyDatabaseSchema()` → `sheets.projectAssets`
2. `getDataRange().getValues()` — **reads entire Project_Assets tab**
3. Splits rows: other projects → `keptRows`; target project → `projectRows`
4. Applies each delta in memory (bulk qty merge or physical row add/remove)
5. **`sheets.projectAssets.clearContents()`**
6. **`setValues(keptRows)`** — writes **entire sheet** (header + all projects)

### Verdict

**Design lock §9 CONFIRMED.** Client sends deltas; server **discards delta granularity** at persistence — whole-tab rewrite. Two editors on the same project (or overlapping auto-saves) → last write wins with no merge. Cross-project saves on the same tab also contend on one lock.

---

## 3. `saveTimelineData` — end-to-end trace

### Client

| Caller | File |
|--------|------|
| Timeline editor save | `03a_Timeline_Boot.html` |
| Logistics hub (project shifts) | `02_Project_Editor_Logistics.html` |

### Server (`Logistics_Timeline.js:52-278`)

1. Optional collision check: `Projects_Index.Last_Updated` within **±2000 ms** or throw `COLLISION_DETECTED`
2. Inner `processSheet(sheet)`: read all rows → keep non-project rows → **`clearContents()`** → `setValues(keptRows)`
3. Runs on: `shifts`, `blocks`, `overrides`; if `subEvents !== null`, also `timelines`
4. Appends new project rows at bottom of each sheet
5. `SpreadsheetApp.flush()`; audit log

### Verdict

**CONFIRMED full-rewrite** on four ENGINE tabs per timeline save. Collision guard is project-level timestamp only — does not protect shift-level concurrent edits within the 2s window.

---

## 4. `Operations.js` ledger path

| Function | Write pattern | Notes |
|----------|---------------|-------|
| `startEventOperation` | Single-cell updates on `Projects_Index` (`Active_Operation`, `Active_Session_UID`) | **Partial write** — OK |
| `processRfidScan` | Delegates to `batchProcessOperations` | — |
| `batchProcessOperations` | Read full ledger → split session vs other → mutate session rows in memory → **`opsLedger.clearContents()`** → `setValues(finalLedger)` | **Full tab rewrite** every batch |
| `finalizeEventOperation` | Clears index operation fields; status cell | Partial write |

### Client

- `02c_Project_Operations.html` — `processRfidScan`, `batchProcessOperations` (optimistic UI queue)

### Verdict

Ledger logic is **append-by-row in memory** but **not append-only on the sheet**. Under concurrent checkout sessions on different projects, both rewrite the entire `Operations_Ledger` tab. Design lock Logistics Hub path should replace this with true per-op atomic writes before Firebase.

---

## 5. Spreadsheet access model (no DAL today)

### Gateways (all GAS backend code uses these)

| Gateway | File | Opens |
|---------|------|-------|
| `verifyDatabaseSchema(readOnly?)` | `Logistics_Schema.js` | ENGINE spreadsheet via `SpreadsheetApp.openById(getEngineSheetId())` — returns sheet handles: `index`, `timelines`, `shifts`, `blocks`, `overrides`, `projectAssets`, `opsLedger`, `tasks`, `notifs`, … |
| `verifyVaultSchema(readOnly?)` | `Resources_Core.js` | VAULT spreadsheet |
| `getSheetData(sheet)` | `Resources_Core.js` | Read-through helper (cache disabled for live reads) |

Direct `SpreadsheetApp.*` in ENGINE logistics (beyond `flush()`):

| File | Direct calls |
|------|----------------|
| `Logistics_Schema.js` | `openById` (schema bootstrap) |
| `Logistics_Timeline.js` | `flush()` after save |
| `Logistics_Projects.js` | `flush()` after save |
| `Logistics_Tasks.js` | `flush()` after task/notif writes |
| `Logistics_Assets.js` | `flush()` in `generateLogisticsPayloadAPI` |
| `Operations.js` | *(none — uses schema sheet handles only)* |

**Resources_*.js:** `Resources_Core.js` / `Resources_Migrations.js` / `Resources_Audit.js` / `Resources_Database.js` use `SpreadsheetApp` for VAULT, admin, backup registry — **stable reference / admin**, not session-fork hot path.

### Implication for DAL

Repos should wrap **`verifyDatabaseSchema` / `verifyVaultSchema` + range operations**, not raw `SpreadsheetApp` in feature code. `Logistics_Schema.js` + `Resources_Core.js` become adapter internals.

---

## 6. Mandatory write boundaries (repos first)

| Priority | Repo | Wrap these functions first |
|----------|------|----------------------------|
| P0 | `ProjectAssetsRepo` | `saveProjectAssetsDelta`, `saveProjectAssetsAPI`, `saveTruckArrangementAPI`, `generateLogisticsPayloadAPI`, `getProjectAssets` |
| P0 | `TimelineRepo` | `saveTimelineData`, `getTimelineData` |
| P0 | `LedgerRepo` | `batchProcessOperations`, `startEventOperation`, `finalizeEventOperation`, `processRfidScan` |
| P1 | `ProjectRepo` | `saveProjectData`, `saveEventFromUI`, `deleteProjectFull` |
| P2 | `VaultRepo` / admin | `Resources_Vault.js` saves — defer until session fork |

---

## 7. Client `google.script.run` — hot paths (sample)

| Domain | Server functions | Client files |
|--------|------------------|--------------|
| Project Assets | `saveProjectAssetsDelta`, `getProjectAssets`, `saveTruckArrangementAPI` | `02e5_Logic_Sync.html`, `02c_Project_Operations.html`, `02_Project_Editor_Logistics.html`, `05a_Truck_Arrangement.html` |
| Timeline | `saveTimelineData`, `getTimelineData` | `03a_Timeline_Boot.html`, `02_Project_Editor_Logistics.html` |
| Ledger / ops | `batchProcessOperations`, `processRfidScan`, `startEventOperation`, `finalizeEventOperation` | `02c_Project_Operations.html` |
| Projects | `saveProjectData`, `getExistingProjects`, … | Calendar / project editor modules |

*Full client inventory (2026-07-15):* [../dal-client-inventory.md](../dal-client-inventory.md) — regenerate with `node scripts/dal-client-inventory.js`. Pre-ship: [dal-pre-ship-gates.md](dal-pre-ship-gates.md).

---

## 8. Doc vs code

| Doc said | Code does | Action |
|----------|-----------|--------|
| Design lock §9: full rewrite on PA save | **Confirmed** | Phase 3 gate stands |
| `FRAGILE_ZONES` / doctrine: ledger append-only | `batchProcessOperations` rewrites whole ledger tab | Update FRAGILE_ZONES when Phase 3 starts — ledger is not append-only today |
| Timeline collision handling | 2s `Last_Updated` on index only | Design lock last-write-wins + notification still applies for in-window races |

---

## 9. Phase 0 checklist status

- [x] `clearContents()` / `setValues()` inventory (ENGINE hot path)
- [x] `saveProjectAssetsDelta` trace
- [x] `saveTimelineData` trace
- [x] `Operations.js` ledger trace
- [x] Spreadsheet access gateways catalogued
- [x] Full client `google.script.run` inventory — [dal-client-inventory.md](dal-client-inventory.md) (2026-07-15)
- [x] Full client `localStorage` key inventory — same file
- [ ] Schema cross-check vs `SCHEMA.md` (Phase 1)

---

## 10. Recommended next step

Director **OK go** on **DAL Phase 1** — repo interface drafts + `SheetsAdapter` wrapping existing functions with **zero behavior change** (still full-rewrite underneath until Phase 3).

Do **not** start Firebase (Phase 4) until Phase 3 delta-only saves are shipped and smoke-tested with two concurrent editors.
