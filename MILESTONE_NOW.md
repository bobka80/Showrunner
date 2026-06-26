# Milestone Now (quick reference)

Tell the AI: **"Milestone now"** when you want a **production snapshot before new work**.

The AI will:

1. Run **`node milestone.js`** (Apps Script version + production deploy + `RELEASES.md`)
2. **Then** continue with anything else in your message (e.g. *"Milestone now — start the Database tab"*)

Full rules: **[docs/ai/MILESTONE_NOW.md](docs/ai/MILESTONE_NOW.md)**

Milestone reads the **latest Apps Script version**, creates the **next** one with your note as the name, then deploys. `deploy-config.json` is optional (auto-created on first milestone if needed).
