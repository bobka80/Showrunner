# AI agents — start here

**Single entry point:** [AI_DOCTRINE.md](AI_DOCTRINE.md)

Do not begin implementation until you have read the doctrine and opened the drawer relevant to the task:

| Drawer | Path | When |
|--------|------|------|
| **Active campaigns** | [docs/ai/active/](docs/ai/active/) | Work in flight now — **RFID station**; **DAL/router (planned, not executing)** — see [data-access-layer.md](docs/ai/active/data-access-layer.md) |
| **Topic backlogs** | [docs/ai/topics/](docs/ai/topics/) | Feature area checklists (read one topic, not the whole roadmap) |
| **Stable reference** | [docs/ai/README.md](docs/ai/README.md) | Architecture, schema, file map, deploy, **[Drive layout](docs/ai/DRIVE_LAYOUT.md)** |
| **Equipment / PA / warehouse** | [docs/ai/EQUIPMENT_MODEL.md](docs/ai/EQUIPMENT_MODEL.md) | Bulk vs unique, two packing engines — **before** packing/checkout/cable work |
| **Archive** | [docs/ai/archive/](docs/ai/archive/) | Finished plans — reference only |

Operational logs (not doctrine): root **`RELEASES.md`**, **`WORKS_LOG.md`**.

**Ship rule:** After every completed implementation, the AI runs **`node milestone.js`** and reports the GAS version — the director does not deploy manually. See [DEPLOY_AND_ROLLBACK.md](docs/ai/DEPLOY_AND_ROLLBACK.md).

**Director triggers (no code until approved):** **summarize** = restate understanding; **hygiene sweep** (alias **doc hygiene**) = doc consistency report → **OK go** to apply doc fixes only. See [AI_DOCTRINE.md](AI_DOCTRINE.md) Rules 4b–4c.
