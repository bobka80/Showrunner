# AI agents — start here

**Single entry point:** [AI_DOCTRINE.md](AI_DOCTRINE.md)

Do not begin implementation until you have read the doctrine and opened the drawer relevant to the task:

| Drawer | Path | When |
|--------|------|------|
| **Active campaigns** | [docs/ai/active/](docs/ai/active/) | Work in flight now — **RFID station** ([rfid-station-profiles.md](docs/ai/active/rfid-station-profiles.md), **TSL desktop:** [tsl-desktop-handoff.md](docs/ai/active/tsl-desktop-handoff.md)); **DAL/router** — [data-access-layer.md](docs/ai/active/data-access-layer.md) · pre-ship gates: [dal-pre-ship-gates.md](docs/ai/active/dal-pre-ship-gates.md) · **Fragile:** [FRAGILE_ZONES.md](docs/ai/FRAGILE_ZONES.md) § Two-layer shell bridge · § Desktop WebView2 before `host-boot.js` / `station-desktop/` |
| **Topic backlogs** | [docs/ai/topics/](docs/ai/topics/) | Feature area checklists (read one topic, not the whole roadmap) |
| **Stable reference** | [docs/ai/README.md](docs/ai/README.md) | Architecture, schema, file map, deploy, **[Drive layout](docs/ai/DRIVE_LAYOUT.md)** |
| **Equipment / PA / warehouse** | [docs/ai/EQUIPMENT_MODEL.md](docs/ai/EQUIPMENT_MODEL.md) | Bulk vs unique, two packing engines — **before** packing/checkout/cable work |
| **Archive** | [docs/ai/archive/](docs/ai/archive/) | Finished plans — reference only |

Operational logs (not doctrine): root **`RELEASES.md`**, **`WORKS_LOG.md`**.

**Cursor IDE:** File-scoped rules in [`.cursor/rules/`](.cursor/rules/) · full routine in [docs/ai/CURSOR_WORKFLOW.md](docs/ai/CURSOR_WORKFLOW.md).

**Ship rule:** After every completed implementation, the AI runs **`node milestone.js`** with a descriptive note and reports the GAS version — the director does not deploy manually. **Pre-ship** (scoped build/parse/verify gates) and the **Bugbot gate** run inside ship scripts — see [PRE_SHIP_PIPELINE.md](docs/ai/PRE_SHIP_PIPELINE.md). Hosting-shell changes also need **`node deploy-hosting.js`**. Full deploy protocol: [DEPLOY_AND_ROLLBACK.md](docs/ai/DEPLOY_AND_ROLLBACK.md).

**Director triggers (no code until approved):** **summarize** = restate understanding; **hygiene sweep** (alias **doc hygiene**) = doc consistency report → **OK go** to apply doc fixes only; **create repo mix** = pack repo for quote.ai/Claude project knowledge → drag `claude-pack/repomix-output.md`. See [AI_DOCTRINE.md](AI_DOCTRINE.md) Rules 4b–4c · [CLAUDE_PACK.md](docs/ai/CLAUDE_PACK.md).

**Dictation:** The director often uses voice input — watch for mis-transcriptions (Rule 12 in [AI_DOCTRINE.md](AI_DOCTRINE.md)).
