# Live Apps Script pull (GitHub backup)

**Purpose:** Snapshot of the **live** Google Apps Script project, committed to GitHub so production code is not only on Google.

| Field | Value |
|-------|--------|
| **Pulled** | 2026-11-10 |
| **GAS version** | **792** — Hub open: show modal immediately; hydrate PA in background (no GAS wait) |
| **Production deploy** | `AKfycbxynTt5JaKQiv1Iu_ahSQBcrBDKpuhz98lac4G-bJO5PMtmvgJr_uKZ1Y58lxOOupSwlw` **@792** |
| **Files** | 41 project files (+ `.clasp.json` for local re-pull into this folder) |

## Rules

- This folder is the raw clasp pull (built Apps Script shape).
- Git is also synced: root backends + `Login.html`, `frontend-lock/`, and `dist/` match this pull (**v792**). `build.js` uses `frontend-lock/` so a rebuild does not revert to older HTML modules.
- HTML modules (`0*.html` / root `Index.html` includes) may still lag; do not delete `frontend-lock/` until those modules can reproduce production.
- Re-pull (read-only): from this folder, with clasp logged in, `clasp pull --force`.

See [DEPLOY_AND_ROLLBACK.md](../docs/ai/DEPLOY_AND_ROLLBACK.md).
