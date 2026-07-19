# Active — In-app error reports + daily journal triage

**Entry:** [AI_DOCTRINE.md](../../../AI_DOCTRINE.md) · **Map:** [../README.md](../README.md)  
**Related:** Multi-user fork Part B testing will **use** this as the main floor debug channel — [multi-user-fork-industrial-and-auto.md](multi-user-fork-industrial-and-auto.md). Capture can ship after Part A exit (or earlier if director pulls it forward).  
**Storage:** Google Sheet workbook `SM_Showrunner_LOGS` (existing audit file) — **new tabs**, not Firebase-as-store.  
**UI home:** ROOT **Database Operations** → third sub-tab **ERROR LOGS** (`00b_UI_Hubs.html` / `06g_Admin_Database.html`).

**Opened:** 2026-07-19 · **Status:** **Campaign opened** — docs first; **no code** until director **OK go** on a named phase.  
**Point new agents here:** `docs/ai/active/user-error-reporting-journal-2026-07-19.md`

---

## Director intent (plain language)

1. Anyone who sees something wrong presses **Report** → system freezes a diagnostic snapshot **at that moment** → they type what happened → one **error log** is stored.  
2. You (ROOT) open **Database Operations → ERROR LOGS**, gather a **bunch for the day** (or any range), **copy one pack**.  
3. You hand that pack to Cursor. An **orchestrator agent** + **sub-agents** (+ Bugbot when shipping fixes) work the pack the best way possible: sort problems, spot multi-user / race patterns by **time + view**, write homework, propose fixes.  
4. Everything lasting goes into a **journal** — what was reported, what we decided, what we fixed, what came back.  
5. **Every later pass** agents read **logs → journal** so they do not re-solve the same thing blind, and they notice when an old problem returns.

**Not the product goal:** fancy hash jargon or auto-deploying fixes without you.  
**The product goal:** hand logs → best treatment → journal stays honest → problems get resolved.

---

## How it works (loop)

```
Floor: Report button → Error_Reports (Sheet)     ← events / raw logs
                │
ROOT: ERROR LOGS tab → select day → Copy pack
                │
Cursor: Orchestrator
          ├─ Sort / group similar day problems (plain language)
          ├─ Multi-user / race lane (same time window + same view / fork)
          ├─ Per-problem homework (files, hypothesis, sim if live-sync)
          ├─ Bugbot when a fix is ready to ship
          └─ Update JOURNAL (open / fixed / came back / notes)
                │
You: OK go on which fixes to build → milestone → journal marked fixed
                │
Next day: new pack + journal history → treat again
```

---

## Two stores (schema — Phase 0/1)

Workbook: **`SM_Showrunner_LOGS`** (same as audit). Tab **`Audit_Logs`** untouched.

### Tab `Error_Reports` — raw logs (one press = one row)

| Column | Purpose |
|--------|---------|
| `Report_ID` | UUID |
| `Timestamp` | **Button press** time (not submit) |
| `User_ID` / `User_Name` | Who reported |
| `Role_Dept` | Role context |
| `View` | Screen/module (**view stamp**) |
| `Project_ID` | If known |
| `Fork_ID` | If inside prep/timeline fork |
| `Main_Session_ID` | App session |
| `Sync_Mode` | firestore / gas / none |
| `Surface` | web / mobile / station / desktop |
| `App_Version` | GAS / host / APK |
| `Status` | New / In_pack / … (row-level, optional) |
| `Description` | User text |
| `Diag_JSON` | Frozen snapshot (or slim) |
| `Diag_Ref` | Drive link if blob too big for a cell |

### Tab `Error_Journal` — lasting record (agents update this)

| Column | Purpose |
|--------|---------|
| `Journal_ID` | UUID for this journal entry / problem thread |
| `Title` | Short human title |
| `Kind` | `single` (one root cause class) or `race` (multi-user / time-aligned) |
| `State` | `Open` / `Fixed` / `Came_back` / `Ignored` |
| `First_Seen` / `Last_Seen` | From member reports |
| `Member_Report_IDs` | List of `Report_ID`s in this thread |
| `View_Hints` | Views involved |
| `Notes` | What agents/director concluded |
| `Fixed_In_GAS` | Version when marked fixed (if any) |
| `Last_Triage_At` | When agents last processed this thread |
| `Came_Back_Note` | Why reopened |

**Docs:** add both to [../SCHEMA.md](../SCHEMA.md) + [../DRIVE_LAYOUT.md](../DRIVE_LAYOUT.md).  
**Code:** `verifyErrorReportsSchema` / `verifyErrorJournalSchema` + writers in `Resources_Audit.js` (Phase 1).

---

## ROOT UI — ERROR LOGS (third Database Operations sub-tab)

Today: **BACKUP & ARCHIVE** | **OPS & NOTIFICATIONS**.  
Add: **ERROR LOGS**.

### Layout
- **Filters:** day / range, view, user, project, journal state  
- **Left:** checklist of raw reports (time, user, view, short text)  
- **Right:** detail (description + diag)  
- **Journal panel:** open / fixed / came_back threads for the period  
- **Primary action:** **Copy pack for Cursor** — one paste block:
  - Day header + counts  
  - Selected raw logs (columns + JSON)  
  - Current journal slice (so agents see history)  
  - Fixed footer prompt: “Run this campaign’s triage loop”

No need for a separate “clustering engine” in the app for v1 — **agents** do the day’s sorting; the **journal** remembers.

---

## Cursor agent cluster (campaign playbook)

**Orchestrator:** Error-log triage (this campaign).  
**Every run must:** read the pack **and** the journal section in the pack (or fetch journal rows).

| Sub-agent | Job |
|-----------|-----|
| **Day sorter** | Read all logs; propose problem threads in plain language; attach report IDs |
| **Race / multi-user** | Same **timestamp window** + same **view** (and fork/`writeSeq` if present) → race threads |
| **Homework writer** | Per open thread: what broke, where in code, how to prove, suggested milestone note |
| **Journal updater** | Draft Sheet/journal updates: new threads, still open, mark fixed, mark came_back |
| **Bugbot** | Only when director OK go’d a fix and a ship is preparing — existing Bugbot gate |

**Director:** paste pack → get summary → pick what to fix → **OK go** → ship → journal **Fixed** (+ GAS version).  
Next pack: if same class returns → journal **Came_back**, do not pretend it is brand new.

---

## Phases (build order)

### Phase 0 — Campaign docs + schema on paper
- [x] This campaign file  
- [ ] [SCHEMA.md](../SCHEMA.md) — `Error_Reports` + `Error_Journal`  
- [ ] [DRIVE_LAYOUT.md](../DRIVE_LAYOUT.md) — second/third tabs on LOGS  
- [ ] Project_TODO / AGENTS pointers  

### Phase 1 — Sheet schema + writers (no floor button yet)
- [ ] `verifyErrorReportsSchema` / `verifyErrorJournalSchema`  
- [ ] `submitErrorReport` / `upsertErrorJournalEntry` (ROOT-safe)  
- [ ] Cell-size fallback → `Diag_Ref`  
- [ ] Prove: test row; **Audit_Logs** untouched  

### Phase 2 — Capture (floor)
- [ ] Ring buffer + freeze on Report press  
- [ ] Drawer “What happened?” → submit  
- [ ] Works web.app; station/mobile as follow-ups if needed  

### Phase 3 — ERROR LOGS tab
- [ ] Third sub-tab in Database Operations  
- [ ] List / detail / select / **Copy pack** (logs + journal slice)  

### Phase 4 — Agent playbook in Cursor
- [ ] Skill or sticky prompt under this campaign (orchestrator + sub-agents)  
- [ ] First real day pack dry-run with director  

### Phase 5 — Use hard during Part B
- [ ] Daily (or per session) pack → triage → journal → fixes  
- [ ] Tune what the pack includes if races are missing time/view/fork  

**Out of scope for this campaign:** Slack/email alerts, screenshots, fully automatic ship without OK go, replacing audit log.

---

## Sequencing vs multi-user fork

| When | What |
|------|------|
| During Part A | Optional: Phase 0–1 docs/schema only |
| After Part A exit (recommended) | Phase 2–3 capture + ERROR LOGS UI |
| Part B testing | Phase 4–5 — primary debugging channel |

Do **not** block Part A H2 on this campaign unless director says so.

---

## Open questions (answer at Phase 0/1 OK go)

1. Oversized diag → Drive file + `Diag_Ref` (recommended default)?  
2. Freelancers see Report button? (recommended: yes)  
3. Journal edits only via agents + ROOT UI, or Sheet direct OK too? (recommended: both; UI/agents preferred)

---

## Status log

| Date | Note |
|------|------|
| 2026-07-19 | Campaign opened from director intent: daily log packs → agent cluster → lasting journal → resolve with OK go. No “fingerprint” product language. UI = ROOT Database Ops third tab ERROR LOGS. |

---

## When this campaign closes

1. Capture + ERROR LOGS + journal + one proven Cursor triage loop on a real day pack.  
2. Archive this file; leave SCHEMA + short topic pointer if useful.  
3. Update Project_TODO.
