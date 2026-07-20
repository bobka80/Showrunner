# Claude project pack (Repomix)

**Entry:** [AI_DOCTRINE.md](../../AI_DOCTRINE.md) · **Cursor:** [CURSOR_WORKFLOW.md](CURSOR_WORKFLOW.md)

Pack the repo for **Claude project knowledge** (brainstorm on the go with full code + doctrine context).

`Last swept:` 2026-07-20

---

## Command

```bash
node create-repomix.js
```

| Flag | Effect |
|------|--------|
| *(default)* | Curated pack ~**1M tokens** / ~4 MB — source, `docs/ai/`, hosting, APK scripts |
| `--split 2mb` | Numbered parts for Claude upload limits (manual / size-limit only) |
| `--full` | Includes `station-android/CW referense/` vendor docs (~**11M tokens** — avoid) |

**Output:** one fresh file — `claude-pack/repomix-output.md` (+ `instructions.md` with navigation and live `Project_TODO` excerpt). Default mode deletes leftover split parts so the folder stays a single mix.

**Not deployed to GAS** — PC-only (`gas-node-only.js`).

---

## Automatic refresh on GAS ship

Every successful **`node milestone.js "…"`** kicks off the curated single-file pack **in the background** after deploy + `RELEASES.md` — the ship exits as soon as GAS is done; you do not wait for the mix.

| Flag on milestone | Effect |
|-------------------|--------|
| *(default)* | Start background refresh of `claude-pack/repomix-output.md` (log: `claude-pack/repomix-last-run.log`; pack errors do not undo the GAS ship) |
| `--no-repomix` | Skip pack refresh |

Upload to Claude / quote.ai project knowledge remains **manual** (drag the file) — Anthropic has no official project-knowledge API/MCP upload.

---

## What is included (curated)

- All production `.html` modules, backend `.js`, `dist/` build output
- `docs/ai/**`, `AI_DOCTRINE.md`, `AGENTS.md`, `RELEASES.md`
- `push-hosting/`, `station-android/` (source, not vendor Javadoc)
- `station-desktop/` source (not `bin/` / `obj/`)
- Deploy tooling: `build.js`, `milestone.js`, `deploy-hosting.js`, `build-station-apk.js`, etc.

## Excluded

- `node_modules/`, secrets, APK/AAR binaries, `_clasp_pull_check/`, Chainway reference HTML

---

## Upload workflow

1. Pack is refreshed automatically after each GAS milestone (or run `node create-repomix.js` / say **create repo mix**).
2. Upload **`claude-pack/repomix-output.md`** to Claude **project knowledge** (replace the previous file).
3. Brainstorm there; bring **OK go** tasks back to Cursor for implementation.

---

## Token estimates (measured on this repo)

| Profile | Tokens | Use |
|---------|--------|-----|
| Curated | ~1.0M | **Recommended** for Claude project |
| Full (naive) | ~11.3M | Too large — mostly vendor Javadoc |

Packing burns **zero** Claude API tokens (local Repomix via `npx`).
