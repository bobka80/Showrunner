# Live Apps Script pull (GitHub backup)

**Purpose:** Snapshot of the **live** Google Apps Script project, committed to GitHub so production code is not only on Google.

| Field | Value |
|-------|--------|
| **Pulled** | 2026-11-10 |
| **GAS version** | **792** — Hub open: show modal immediately; hydrate PA in background (no GAS wait) |
| **Production deploy** | `AKfycbxynTt5JaKQiv1Iu_ahSQBcrBDKpuhz98lac4G-bJO5PMtmvgJr_uKZ1Y58lxOOupSwlw` **@792** |
| **Files** | 41 project files (+ `.clasp.json` for local re-pull into this folder) |

## Rules

- **Backup only** — this folder is not the editable source tree (`*.html` modules). It is the built Apps Script shape (`dist/`-like).
- **Do not** run `milestone.js`, `dev-push.js`, or `gas-push-sync` from the older root source while intending to “restore” this snapshot — that rebuilds from root HTML/JS and can **roll production back**.
- **Do not** raise `RELEASES.md` table max to 792 until the real source tree matches live; the milestone guard uses that table to refuse outdated deploys.
- Re-pull (read-only): from this folder, with clasp logged in, `clasp pull --force`.

See [DEPLOY_AND_ROLLBACK.md](../docs/ai/DEPLOY_AND_ROLLBACK.md).
