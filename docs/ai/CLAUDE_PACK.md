# Claude project pack (Repomix)

**Entry:** [AI_DOCTRINE.md](../../AI_DOCTRINE.md) · **Cursor:** [CURSOR_WORKFLOW.md](CURSOR_WORKFLOW.md)

Pack the repo for **Claude project knowledge** (brainstorm on the go with full code + doctrine context).

`Last swept:` 2026-07-13

---

## Command

```bash
node create-repomix.js
```

| Flag | Effect |
|------|--------|
| *(default)* | Curated pack ~**1M tokens** / ~4 MB — source, `docs/ai/`, hosting, APK scripts |
| `--split 2mb` | Numbered parts for Claude upload limits |
| `--full` | Includes `station-android/CW referense/` vendor docs (~**11M tokens** — avoid) |

**Output:** `claude-pack/repomix-output.md` (+ `instructions.md` with navigation and live `Project_TODO` excerpt).

**Not deployed to GAS** — PC-only (`gas-node-only.js`).

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

1. Run `node create-repomix.js` after meaningful doc or pipeline changes.
2. Upload output file(s) to Claude **project knowledge**.
3. Brainstorm there; bring **OK go** tasks back to Cursor for implementation.

---

## Token estimates (measured on this repo)

| Profile | Tokens | Use |
|---------|--------|-----|
| Curated | ~1.0M | **Recommended** for Claude project |
| Full (naive) | ~11.3M | Too large — mostly vendor Javadoc |

Packing burns **zero** Claude API tokens (local Repomix via `npx`).
