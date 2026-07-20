# Active — Error reports, markdown journal & day bug-fix campaigns

**Entry:** [AI_DOCTRINE.md](../../../AI_DOCTRINE.md) · **Map:** [../README.md](../README.md)  
**Status:** **NEXT campaign** (middle before multi-user Part B). **Phase 2 complete** @ GAS **v682** — global lip drawer. **Next:** Phase 3 — ERROR LOGS tab + Hand over.  
**Point agents here:** `docs/ai/active/user-error-reporting-journal-2026-07-19.md`  
**Journal stub:** [error-journal/README.md](error-journal/README.md)

**Related:** Multi-user fork Part B floor debugging — [multi-user-fork-industrial-and-auto.md](multi-user-fork-industrial-and-auto.md).

**UI lock (Phase 2 shipped):** Top-center ~2mm lip; desktop hover opens; touch tap lip toggles; text + Send; freeze diag on open; everyone (web / mobile / station via Index).

---

## Director intent

1. Users press **Report** → snapshot freezes **at press** → they describe it → one **error log** is stored in the **Sheet** (raw capture only).  
2. ROOT opens **Database Operations → ERROR LOGS**, gathers a **day’s logs**, **hands the pack to Cursor**.  
   - **Handoff clears the Sheet:** once logs are copied out for agents, those rows are **deleted** from `Error_Reports` so the UI only shows logs **not yet handed over**.  
   - Memory of what was handed over lives in **markdown** (day campaign + journal), not in the database.  
3. Agents **cross-reference the markdown journal** (and past day campaigns), categorize problems (including multi-user / race by **time + view**), and write a **day bug-fixing campaign** in markdown — ordered work, **test suggestions**, wait for **OK go**.  
4. You stay **in the loop**. **Nothing ships automatically.**  
5. Long memory lives in the **markdown system** (journal + day campaigns), same family as other campaigns — not in the database.

---

## Two layers (do not mix)

| Layer | Where | What |
|-------|--------|------|
| **Error logs (events)** | Google Sheet `SM_Showrunner_LOGS` → tab **`Error_Reports`** | Raw presses: time, user, view, fork, diag JSON |
| **Journal + day campaigns** | **`docs/ai/` markdown only** | Lasting bug memory, categorization outcomes, fix/test campaigns |

**There is no `Error_Journal` Sheet tab.** Audit tab `Audit_Logs` stays untouched.

---

## How the loop works

```
Floor: Report → Error_Reports (Sheet only)
ROOT: ERROR LOGS tab → select → **Hand over to Cursor**
         ├─ Copy pack to clipboard (for paste into chat)
         └─ Delete those rows from Error_Reports (Sheet)
Cursor:
  - Read pack
  - Cross-read markdown journal + recent error-day campaigns
  - Categorize (single-class vs race by time + view)
  - Write/update day campaign markdown + journal entries
You: OK go per slice → milestone → Bugbot when required
Markdown journal: Open / Fixed / Came_back (+ GAS version, links to day campaign)
Next pack: remaining Sheet inbox + markdown memory → new day campaign
```

**UI rule:** One button **Hand over to Cursor** (copy + delete), not a silent delete on any copy — so nothing is wiped by accident. Confirm: “Remove N logs from database after copy?”

**Safety:** Deletion is only for rows you selected and handed over. New reports keep accumulating until the next handoff. **Sheet = inbox.** Markdown = filing cabinet.

---

## Sheet schema — `Error_Reports` only

Workbook: **`SM_Showrunner_LOGS`**.

| Column | Purpose |
|--------|---------|
| `Report_ID` | UUID |
| `Timestamp` | Button-press time |
| `User_ID` / `User_Name` | Who reported |
| `Role_Dept` | Context |
| `View` | Screen/module (view stamp) |
| `Project_ID` | If known |
| `Fork_ID` | If in prep/timeline fork |
| `Main_Session_ID` | App session |
| `Sync_Mode` | firestore / gas / none |
| `Surface` | web / mobile / station / desktop |
| `App_Version` | GAS / host / APK |
| `Description` | User text |
| `Diag_JSON` | Frozen snapshot (or slim) |
| `Diag_Ref` | Drive link if cell too big |

Register in [../SCHEMA.md](../SCHEMA.md) + [../DRIVE_LAYOUT.md](../DRIVE_LAYOUT.md).  
Code: `verifyErrorReportsSchema` + `submitErrorReport` in `Resources_Audit.js`.

---

## Markdown system — journal & day campaigns

### Journal (long memory)
Folder: `docs/ai/active/error-journal/` (stub shipped Phase 0)

- Index: [error-journal/README.md](error-journal/README.md) — table of open / fixed / came_back threads  
- One file per lasting problem thread, e.g. `ERR-2026-07-19-timeline-thrash.md`  
  - Title, kind (`single` | `race`), state, member `Report_ID`s, views, notes  
  - `Fixed_In_GAS`, links to day campaign(s), came-back history  
  - **Test suggestions** that stayed true after the fix  

### Day bug-fix campaign (day’s work order)
`docs/ai/active/error-day-YYYY-MM-DD.md`

Must include:
- Pack summary (counts, views)  
- Journal cross-check (already fixed / came back / new)  
- Categorized problem list (priority)  
- Per item: hypothesis, files, **how to test** (campaign-style smoke)  
- **No code until OK go on named item**  
- After ships: update thread files + day file status  

Same discipline as multi-user fork / DAL campaigns — director-driven.

---

## ROOT UI — ERROR LOGS (third Database Operations sub-tab)

Existing: **BACKUP & ARCHIVE** | **OPS & NOTIFICATIONS** → add **ERROR LOGS**.

- Filters + selectable Sheet reports + detail  
- **Hand over to Cursor:** copy pack → **then delete** those `Report_ID`s from `Error_Reports`  
- Optional: links reminding where markdown journal / day campaigns live  

**Sheet = inbox.** After handoff, inbox is empty of those items. **Markdown = filing cabinet.**

---

## Cursor agent cluster (human in the loop)

| Role | Job |
|------|-----|
| Orchestrator | Pack + journal-first; produce/update day campaign markdown |
| Day sorter | Categorize into threads; attach Report_IDs |
| Race / multi-user | Time window + view (+ fork/writeSeq if present) |
| Homework writer | RCA sketch, files, **test suggestions** |
| Journal writer | Update **markdown** thread files + index (not Sheet) |
| Bugbot | Only when director OK go’d a fix for ship |

---

## Phases

| Phase | What | Gate |
|-------|------|------|
| **0** | This campaign + SCHEMA (reports only) + DRIVE_LAYOUT + error-journal folder stub + TODO as Next | **Done** 2026-07-20 |
| **1** | Sheet `Error_Reports` + writer (`verifyErrorReportsSchema` / `submitErrorReport` / `TEST_ErrorReport`) | **Done** @ v681 |
| **2** | Report lip drawer + freeze + submit (web / mobile / station) | **Done** @ v682 |
| **3** | ERROR LOGS tab + **Hand over** (copy + delete from Sheet) | ROOT exports pack; handed rows gone from UI |
| **4** | Cursor playbook; first real pack → day campaign + journal md | Director likes the day-campaign shape |
| **5** | Live use (esp. Part B) | Packs → day campaigns → OK go → journal updated |

**Out of scope:** auto-ship, Sheet-based journal, Slack/email, screenshots.

---

## Defaults

- Oversized diag → Drive + `Diag_Ref`  
- Freelancers can Report  
- You always approve before code  

---

## Orchestrator starter prompt (paste with each error pack)

Director pastes this **first**, then the pack from **Hand over to Cursor**.

```
You are the Error Report Orchestrator for Showrunner.

Campaign (read first):
docs/ai/active/user-error-reporting-journal-2026-07-19.md
Also read: AI_DOCTRINE.md, then docs/ai/active/error-journal/README.md if it exists,
and any recent docs/ai/active/error-day-*.md files.

I am handing you an error-log PACK from Database Operations → ERROR LOGS.
Those rows were deleted from the Sheet inbox after handoff. Memory is markdown only.

YOUR JOB (this turn):
1. Cross-reference this pack with the markdown journal and recent day campaigns
   (already Fixed / Came_back / still Open).
2. Categorize problems:
   - Single-class issues (same kind of failure across reports)
   - Multi-user / race candidates (close timestamps + same View, and Fork_ID /
     writeSeq when present)
3. Use sub-agents as needed (sorter, race analyst, homework writer, journal writer).
   You own the final day campaign — do not leave me with only raw sub-agent chatter.
4. Write or update:
   - docs/ai/active/error-day-YYYY-MM-DD.md (today’s bug-fix campaign)
   - docs/ai/active/error-journal/ threads + README index
5. For each prioritized item include: plain-language problem, likely files,
   hypothesis, and concrete TEST SUGGESTIONS (smoke steps like our other campaigns).

HARD RULES:
- I stay in the loop. NO application code, NO milestone.js, NO deploy until I say
  OK go on a named item from the day campaign.
- Do not invent a Sheet journal. Do not put lasting memory only in chat.
- Prefer one clear day-campaign summary I can approve item-by-item.
- If the pack is empty or incomplete, say what’s missing and stop.

After the day campaign is written: stop and wait. List the items needing my OK go.

PACK FOLLOWS BELOW:
```

---

## Status log

| Date | Note |
|------|------|
| 2026-07-19 | Campaign drafted. Journal + day campaigns = **markdown only**; Sheet = raw `Error_Reports` only. |
| 2026-07-19 | **Handoff clears inbox:** Hand over to Cursor = copy pack + **delete** those rows from Sheet so already-handed logs do not stay visible. |
| 2026-07-20 | Director: this is the **middle / NEXT** campaign. **Phase 0 shipped** (SCHEMA + DRIVE_LAYOUT + journal stub + TODO). Phase 2 UI: ask director. **Next slice: Phase 1.** |
| 2026-07-20 | **Phase 1 shipped @ GAS v681:** `verifyErrorReportsSchema` + `submitErrorReport` + `TEST_ErrorReport` in `Resources_Audit.js`. Tab `Error_Reports` on `SM_Showrunner_LOGS`; `Audit_Logs` untouched. Oversized diag → Drive + `Diag_Ref`. |
| 2026-07-20 | **Phase 2 shipped @ GAS v682:** `00f_Error_Report.html` — top-center 2mm lip; hover (fine pointer) / tap lip (touch); freeze snapshot on open; `submitErrorReport`. Wired in `Index.html` (web + mobile + station). Escape stops at drawer (Bugbot). Styles `#sr-error-report-*`. |
