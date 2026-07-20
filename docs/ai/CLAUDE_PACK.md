# Claude project pack (Repomix)

**Entry:** [AI_DOCTRINE.md](../../AI_DOCTRINE.md) · **Cursor:** [CURSOR_WORKFLOW.md](CURSOR_WORKFLOW.md)

Pack the repo for **Claude / quote.ai project knowledge** (brainstorm on the go with full code + doctrine context).

`Last swept:` 2026-07-20

---

## Command

```bash
node create-repomix.js
```

| Flag | Effect |
|------|--------|
| *(default)* | Curated pack, **split into ~2 MiB parts** — fits project-knowledge upload limits |
| `--split 1mb` | Custom part size |
| `--no-split` | Single monolith (~5 MB) — often too large for project UIs |
| `--full` | Includes `station-android/CW referense/` vendor docs (~**11M tokens** — avoid) |

**Output:** `claude-pack/repomix-output.1.md`, `.2.md`, … (+ `instructions.md` with navigation and live `Project_TODO` excerpt). Each run clears previous pack files so stale parts do not linger.

**Not deployed to GAS** — PC-only (`gas-node-only.js`).

---

## Automatic refresh on GAS ship

Every successful **`node milestone.js "…"`** kicks off this curated **split** pack **in the background** after deploy + `RELEASES.md` — the ship exits as soon as GAS is done; you do not wait for the mix.

| Flag on milestone | Effect |
|-------------------|--------|
| *(default)* | Start background refresh → `claude-pack/repomix-output.*.md` parts (log: `claude-pack/repomix-last-run.log`) |
| `--no-repomix` | Skip pack refresh |

Upload to Claude / quote.ai project knowledge remains **manual** — drag **all** parts (+ optional `instructions.md`). Anthropic has no official project-knowledge API/MCP upload.

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

1. Pack refreshes automatically after each GAS milestone (or run `node create-repomix.js` / say **create repo mix**).
2. In File Explorer open `claude-pack/` → upload **every** `repomix-output.*.md` part into project knowledge (replace old parts). Optionally add `instructions.md`.
3. Brainstorm there; bring **OK go** tasks back to Cursor for implementation.

---

## Token estimates (measured on this repo)

| Profile | Tokens | Use |
|---------|--------|-----|
| Curated (split) | ~1.0M total across parts | **Recommended** for project knowledge |
| Full (naive) | ~11.3M | Too large — mostly vendor Javadoc |

Packing burns **zero** Claude API tokens (local Repomix via `npx`).
