# Milestone Now (quick reference)

**Default:** After every **OK go** implementation, the AI runs **`node milestone.js`** automatically and reports the GAS version (e.g. **v411**). You test on web.app — you do not deploy yourself.

Tell the AI: **"Milestone now"** when you want a **production snapshot before new work** (same script, explicit trigger).

The AI will:

1. Run **`node milestone.js`** (Apps Script version + production deploy + `RELEASES.md`)
2. **Then** continue with anything else in your message (if any)

**Full protocol:** [docs/ai/MILESTONE_NOW.md](docs/ai/MILESTONE_NOW.md)  
**Entry point for AI:** [AI_DOCTRINE.md](AI_DOCTRINE.md) · **Drawer map:** [docs/ai/README.md](docs/ai/README.md)
