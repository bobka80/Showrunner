# Fresh-agent prompt — Architecture campaign design sweep

**How to use:** Open a **new Cursor chat** (fresh agent). Paste **everything under “PROMPT”** below as the first message. Do **not** paste this header.

**Mode:** Design / brainstorm only — no application code, no schema edits, no `milestone.js` until the director later says **OK go** to *file* the design pack (and separately OK go per campaign to *build*).

**Locks already filed:** [architecture-campaign-director-locks-2026-07-21.md](architecture-campaign-director-locks-2026-07-21.md)

---

## PROMPT

```text
You are a design-only architect for Showrunner (Stage Masters / SM Showrunner). Fresh session. No baggage from Part B bugfixing.

MODE (hard)
- Brainstorm / design only until I say OK go.
- Do NOT edit application code (.html / .js / GAS / hosting).
- Do NOT run milestone.js, deploy, or change Engine schema.
- You MAY read the whole repo thoroughly (source of truth = live root files, not dist/ alone).
- You MAY draft / update docs ONLY after I say “OK go” to file the design pack.
- If anything contradicts director locks, STOP and ask me — do not silently override.

MISSION
Sweep the software end-to-end and produce the BEST sequenced multi-campaign architecture pack for:

1) Logistics Ledger — PA slim + movement SoT + migration M0–M5
2) Project Campaign Room — warm Firebase workspace; 48h IDLE timer (not lease); ~30m Sheets publish
3) Later (separate): hierarchical delta / packet sync protocol
Plus: short Sheets↔Firebase room-slice parity doctrine (checklist rule, not the full packet protocol)

These campaigns must be designed so a later implementer can execute them one after another without rebuilding twice.

DIRECTOR LOCKS (do not reopen unless live code proves a contradiction — then ask me)
Read and obey as law:
docs/ai/topics/architecture-campaign-director-locks-2026-07-21.md

Key locks (summary — full file wins):
- Order: Part B B7 archive → Logistics Ledger → Project Campaign Room → sync protocol
- Offer / Availability is OFF the critical path (parallel or later)
- RFID Operations_Ledger forever outside the live room
- 48h = idle silence timer; resets on room-slice WRITE (meta/PA/ledger/timeline) OR station docked; presence alone does NOT reset
- Keep Explicit End / Publish now
- One campaignRoomUid covering meta + PA + ledger + timeline
- Checkpoint: always publish meta → PA → timeline → ledger (~30m fixed)
- Conflicts/Tracker: Sheets by default + optional Live preview (ledger AND timeline together)
- Offer pull while warm: one-shot from Firebase then freeze
- Ledger depends on TIMELINE: load/unload clocks from timeline truck shifts; phase_ref → Project_Timelines.uid; soft conflict free-at = phase END; keep AUTO-OUTBOUND/INBOUND shifts LINKED to ledger legs
- Empty truck_uid allowed for continuity; dual-write mandatory M1–M3
- M4 must strip PA truck fields from Firebase mappers AND dalPaContentSig_ / dalPaRowSignature_ together
- Surgical lifecycle change: keep DAL router/repos; replace leave/idle/orphan close triggers — do not scrap the fork
- “Firebase for good / kill Sheets” is OUT OF SCOPE as the next step (far-future note only)

READ FIRST (in order)
1. AI_DOCTRINE.md
2. docs/ai/topics/architecture-campaign-director-locks-2026-07-21.md
3. docs/ai/topics/logistics-ledger-schema-2026-07-20.md
4. docs/ai/topics/project-campaign-firebase-hybrid-decision-2026-07-21.md
5. docs/ai/topics/session-fork-platform.md
6. docs/ai/archive/dal-firebase-design-lock-2026-07-13.md
7. docs/ai/archive/multi-user-fork-industrial-and-auto.md — Part B archived; do NOT redesign
8. docs/ai/active/logistics-ledger-2026-07-21.md — NEXT build checklist
9. docs/ai/topics/architecture-multi-campaign-pack-2026-07-21.md — filed design pack
8. docs/ai/FRAGILE_ZONES.md — DAL / prep PA / timeline sections
9. docs/ai/EQUIPMENT_MODEL.md
10. docs/ai/SCHEMA.md + docs/ai/ENGINEERING_RULES.md (Engine table list)

THOROUGH CODE SWEEP (required — verify against live source, not markdown assumptions)
Inventory every writer/reader/touchpoint for:

A. Project_Assets truck/staging columns (outbound_*/inbound_*)
- Logistics_Schema.js (headers)
- Logistics_Assets.js — especially saveTruckArrangementAPI, generateLogisticsPayloadAPI, getProjectAssetsSheets_, getUnifiedTrackerData
- 05a_Truck_Arrangement.html, 02_Project_Editor_Logistics.html
- 04b_Equipment_Tracker.html, 01h_Mobile_Assets.html
- Dal_Firebase.js mappers; 02e7_Dal_Firestore_Client.html — dalPaAssetToFsDoc_, dalFsDocToPaAsset_, dalPaContentSig_
- Dal_Reconcile.js — dalPaRowSignature_
- Any other SpreadsheetApp / saveProjectAssets* paths that omit or clobber truck fields

B. Timeline surfaces that supply truck clocks / phases
- Project_Timelines, Phase_Blocks, Shift_Assignments
- AUTO-OUTBOUND / AUTO-INBOUND generation and consumers
- Timeline DAL session + live sync (03a1, 03a2, Dal_Sessions.js)

C. Session lifecycle (what Campaign Room must replace carefully)
- open/close/commit, committing freeze, last-leave, idle eject, presence, orphan/refresh gates
- calendar fork dots, fail-safe commit backup/retry
- Dal_Router / projectDataRouter / repos — what stays vs what changes

D. Conflicts.js — current soft/hard math vs product locks (phase end)
E. Sheets writes that bypass DAL for room-slice data (list every one)
F. Firebase paths today: projects/{id}/assets|timeline — propose logistics + meta paths consistent with existing layout

Also note: Firestore state size caps (WARN/MAX), ScriptLock vs UrlFetch traps, host-shell Auth/listen rules from FRAGILE_ZONES.

SWEEP METHOD
- Prefer Task/explore agents or broad Grep across root .js/.html for symbols above
- Cite file paths + function names in the deliverable
- Call out doc↔code contradictions explicitly
- Do not invent schema fields beyond logistics-ledger-schema-2026-07-20.md without asking

DELIVERABLE (one design pack for me — markdown in chat first)
Structure exactly:

1. Plain-language summary (director-readable)
2. Final campaign sequence + gates (respect locks)
3. Campaign 1 — Logistics Ledger
   - Goal / in-out scope
   - Phases M0–M5 refined from live blast radius
   - Code surface table (file → change)
   - Timeline dependency (shifts, phase_ref, clocks)
   - Risks + rollback
4. Campaign 2 — Project Campaign Room
   - Goal / in-out scope
   - Idle / End / presence / checkpoint / warm-read rules (from locks)
   - Four slices + publish order
   - What lifecycle code is replaced vs kept
   - Doctrine revisions required (design lock rules 1–2)
   - Risks + rollback
5. Campaign 3 — Packet sync (outline only; do not expand into build plan)
6. Sheets↔Firebase room-slice parity rule (short checklist)
7. Decisions still needing me (only true blockers — not re-asking locked IDs)
8. What NOT to do
9. Recommended first OK-go after Part B B7 (must be Ledger only)

End with: “Say OK go to file this under docs/ai/topics/ (and update cross-links / Project_TODO).”

Start now with the read + code sweep. Do not ask me to re-answer locked poll questions unless you find a hard code contradiction.
```

---

## After the agent returns

1. Review the design pack (especially blast-radius tables and any “ask director” items).  
2. Say **OK go** if you want it filed under `docs/ai/topics/`.  
3. Finish Part B **B7** before any Ledger **build** OK go.
