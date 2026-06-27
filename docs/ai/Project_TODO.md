# SM Showrunner - Master Feature Roadmap

## Mobile Crew Field UX (v314 — 2026-06-26) ✅

- [x] `Styles_Mobile.html` — extracted `@media 768px` rules from `Styles.html`
- [x] Crew Hub (`01e`) — phase rail, weather, my shift, timeline/assets/cancel
- [x] Phase Rail (`01f`) — deconstructed mini calendar from `fragments`
- [x] Mobile Tasks (`01g`) — MY TASKS in Command Center
- [x] Compact Project Assets (`01h`) — assigned-only + detail sheet
- [x] Timeline zoom (`03f`) — overview slider + MY ROW
- [x] Docs: [MOBILE_CREW_UX.md](MOBILE_CREW_UX.md)

**Next after mobile sign-off:** real push notification delivery polish (see NOTIFICATIONS section below).

---

## Phase 1: Financials Engine & Quoting (Offer Window)
- [ ] **Equipment Price Editing:** Render assigned assets (hiding zero-price and consumable items) with editable line-item rental prices in the `[OFFER]` tab.
- [ ] **Labor & Fleet Integration:** Wire the newly added `Day_Rate` and `Hourly_Rate` columns from the Timeline database directly into the financial quote.
- [ ] **The Multipliers:** Add inputs for "Days Charged", "Global Discount %", and regional "Tax/VAT" rates.
- [ ] **Live Math & ROI Dashboard:** Build reactive math for subtotals, tracking internal costs (subrents/freelancers) vs client-facing revenue.
- [ ] **Document Generation:** Add buttons to directly generate and print **Offer/Quote PDFs** and **Invoice PDFs**.
- [ ] **Price Immutability Lock:** Ensure that when asset rental prices are updated globally in the Vault, older historical invoices retain their locked snapshot prices.

## Phase 2: Logistics, Operations & Protocols

- [ ] **Handover Protocols:** Generate clean delivery lists with signature lines. Include options to isolate and print specific lists for Subrent Vendors (Cross-Hires).
- [ ] **Warehouse Pull Sheets:** Generate logistics-heavy views (cases, barcodes, weights) optimized for tablets.

### Warehouse RFID & Scan Operations (confirmed workflow)

**Decision:** TSL + Chainway UHF guns, shared devices, personal staff badges. Guns speak to Showrunner via keyboard wedge; software hides input fields and owns scan capture. This is how warehouse check-in/out and packing will work.

**Hardware**
- [ ] **Standardize both gun brands** (TSL + Chainway): UHF EPC output, plain text + Enter, no prefix junk — same string format for all asset tags
- [ ] **Document pairing** per device type (Chainway Android handheld, phone + TSL sled, tablet, desktop USB wedge)
- [ ] **Asset tags:** UHF EPC Gen2 on equipment → stored in vault `rfidTag`
- [ ] **Staff badges:** separate HF/NFC (or barcode) personal tags — not the same as case UHF tags

**Software — scan experience (no finger on fields)**
- [ ] **Scan home / modes:** dedicated entry — Check Out, Check In, Tag/Map, (later: Status)
- [ ] **Full-screen scan mode:** invisible always-focused capture; gun trigger = instant action; beep/vibrate + green/red feedback
- [ ] **Checkout vs output list:** scan only marks lines on the active job list; unknown / not-on-job tags flagged clearly
- [ ] **Resume sessions:** continue active checkout/check-in (`startEventOperation` / ledger) without losing counts
- [ ] **Wire to existing ops backend:** `processRfidScan`, `batchProcessOperations`, project `scannedQty` UI

**Software — shared device + personal badge login (supermarket / kiosk model)**
- [ ] **Kiosk / shell session** on shared phone, tablet, or scan station (one device, many operators)
- [ ] **Badge scan = log in as operator:** scan personal RFID/NFC badge → set `currentOperator` for session
- [ ] **All check-in, check-out, packing** recorded with that crew member as `actor` until badge-out, another badge, or timeout
- [ ] **Badge-out / timeout / switch operator** flows on shared hardware
- [ ] **Optional later:** badge + short PIN for sensitive actions

**Phase order (when building)**
- [ ] **A:** Gun output standard + scan capture shell (wedge, no tap-to-focus)
- [ ] **B:** Checkout mode wired to project output list
- [ ] **C:** Kiosk device + staff badge operator session
- [ ] **D:** Tablet-optimized pull sheets + truck payload assignment from scanner

- [ ] **Fleet Payload Assignment:** Link the Check-Out scanner so that sealed flight cases (and their nested contents) can be directly assigned as payloads to specific Truck timelines.
- [ ] **The "Truck Arrangement Brain" (Algorithmic Load Planner):** Isolate truck packing logic into a dedicated rules engine. This "Brain" will blend basic Tetris logic with weighted human heuristics (e.g., LED walls stack 3-high at the front, Line arrays follow). It will autonomously score and prioritize conflicting constraints like weight distribution (center of gravity), stackability limits, and operational presets to emulate human decision-making.

- [ ] **Missing Logistics Notifications:** Bind an alert badge/notification to the Project Editor when an event is saved without defined transit legs — **also wire to Push Notifications (Option 1)** when FCM is live.

## Phase 3: Compliance, Health & Safety 
- [ ] **Regulatory Health Checks:** Build a documentation engine for legal health checks, storage method compliance, and rigging safety validations.
- [ ] **Yearly Inspections & Forms Hub (Bulgaria Compliance):** Create a dedicated new tab/view for periodic mandatory inspections. Support generating, filling, and logging yearly regulatory forms.
- [ ] **Legal Document Linking & Storage:** Build a system to link legal documents (fireproof certificates, motor inspection forms, etc.) to assets. Store these in a dedicated subfolder on the host Google Drive with upload/download capabilities directly from the UI.
- [ ] **Compliance RBAC Expansion:** Expand the `Role_Permissions` matrix to include specific rights for "Health & Safety Officers", restricting who can sign off on regulatory documents.

## Phase 4: Global Availability & Fleet Tracker
- [ ] **Availability Dashboard (SVG Histogram):** Build out the `availability-modal-overlay` with a fast, native SVG Time-Series Heatmap. It must show the "Waterline" (owned stock) against stacked bars representing Confirmed, Draft, Maintenance, Subrented, and Shortage quantities. Include drill-down clicks to see overlapping events.
- [ ] **Fleet Status (Moving Warehouses) & Nested Envelopes:** In the Equipment Tracker, render specific "Truck Envelopes" nested underneath the main Event strip. These envelopes must *only* appear on the specific dates containing a "Transit" phase. 
- [ ] **Triangulation & Direct-to-Site:** Implement the UI for the `[TRANSFER_FROM]` tag. Allow gear to bypass the warehouse entirely, either jumping directly between venues, or arriving direct-to-site from an external vendor without triggering warehouse shortage conflicts.

## Phase 5: UX, External APIs & Operations
- [ ] **Personal User Hub:** Build a restricted "My Profile" modal (accessible via the left nav bar) for standard crew members to update contact info, dietary preferences, and passwords.
- [ ] **Freelancer Shift Placeholders & Bidding:** Allow creation of "TBD" shift placeholders (e.g., "Need 4 more riggers"). Build a future engine to broadcast these open shifts to a pool of freelancers, allowing them to accept/bid, and automatically choosing the best candidate based on internal ratings.

---

## Push Notifications — Option 1 (Chosen): Firebase Hosting + FCM + Event-Driven GAS

**Decision:** Browser-only push — no native App Store app. Crew use Chrome/Safari; on iPhone they **Add to Home Screen** from our Firebase Hosting URL (e.g. `showrunner.web.app`). True lock-screen push is **not** possible on the raw `script.google.com` Apps Script URL alone (no service worker). Firebase **FCM + Hosting** on the free Spark plan ($0).

### Architecture (how it works)
- **Firebase Hosting** — front door URL users bookmark/install; registers service worker + FCM.
- **Apps Script (GAS)** — stays the backend (sheets, saves, crons). On each meaningful save, GAS calls FCM API via `UrlFetchApp`.
- **Notifications sheet + bell UI** — kept as audit trail and in-app fallback (already built).
- **Event-driven only** — when something saves → notify affected users. **Never** poll/scan the whole system on a timer for changes.
- **One system action per event** — e.g. one truck shift save → collect 20 crew → **one batch FCM send** (20 phones buzz, but **one** backend job, not ×20 quota burn).

### Notification scenarios (v1 scope)
**Crew & managers on a project** (when they are assigned / on that show):
- [ ] Assigned to a project
- [ ] Master timeline changed (phases, show days)
- [ ] Truck / logistics timeline changed
- [ ] Another crew member flags a shift conflict (“I can’t work this day”)
- [ ] Checklist / task milestone (e.g. “Lighting prep 100%”) → notify PM

**Managers** (role-based, even if also on crew):
- [ ] Overdue internal jobs: offer not created, invoice not created, asset list not built, crew not fully staffed
- [ ] Weather alert for outdoor projects (wire existing `dispatchWeatherAlerts` to FCM, not sheet-only)

**Rules:**
- [ ] One push per **logical save** — debounce rapid edits (don’t spam on every drag pixel)
- [ ] Per-user preferences: which alert types they want; store FCM token + chat opt-in in crew profile
- [ ] Email optional digest only — do **not** rely on `MailApp` for high-volume alerts (100/day limit on free Gmail)
- [ ] No aggressive client polling — push delivers; bell refreshes on app open + light refresh while open

### Implementation phases
- [ ] **P1 — Infrastructure:** Firebase project, Hosting URL, service worker, FCM subscribe flow in UI, store device tokens in crew/system config
- [ ] **P2 — Dispatch core:** `dispatchPushNotification(userUids[], message, deepLink)` from GAS; batch FCM HTTP v1; log to Notifications sheet
- [ ] **P3 — Wire saves:** Project assign, timeline save, truck save, show-day save, crew conflict report
- [ ] **P4 — Manager overdue cron:** Once-daily check for late offers/invoices/assets/crew (not per-minute scanning)
- [ ] **P5 — Weather:** Connect existing weather engine to FCM batch send
- [ ] **P6 — Admin UI:** Notification preferences per user; test push button for ROOT

### Quota note (30–50 people, many scenarios)
FCM + batch sends are **not** the bottleneck at this scale. Risks are **email limits**, **polling**, and **alert spam** — avoided by event-driven batch design above.

*(Consolidates earlier scattered notification bullets in Phases 2 and 5.)*

## Database Operations (Root Settings Tab)

- [x] **Root-only DATABASE tab** in Master Settings — backup, restore, ops log (archive placeholders)
- [x] **Separate Engine / Vault backup** + explorer dropdowns (newest modified first)
- [x] **Live status panel** — current Engine/Vault + Open in Drive
- [x] **Dynamic DB registry** (Script Properties) for active Engine/Vault IDs
- [x] **Restore** — move live to Replaced folder `1aZSru-d8OryHpNCooPm78oWdFjSauTPN`, promote backup
- [x] **Multi-step revert** via `DB_Operations_Log` on Audit Log file
- [ ] **Archive logs / engine** — enable buttons in DATABASE tab (moved from Manager Hub)
- [ ] **Test drill** on HEAD — director sign-off

---

## IMMEDIATE ACTION PLAN: Financials, Fleet Tiers & Beta Prep

- [ ] **Dynamic Payroll & Multiplier Engine:** Implement a dual-multiplier matrix.
    - *Personal Multiplier:* Added to Crew profiles (e.g., Supervisor, Tech, Trainee).
    - *Project Multiplier:* Global event modifier for difficulty/conditions.
    - *Shift Phasing & Tasks:* Split shifts into Build, Duty, Breakdown + task bonuses (e.g., Followspot).
- [ ] **Crew Payroll Adjustment Module:** UI for crew to submit shift adjustments (overtime, longer duty) for rapid Manager Approval.
- [ ] **Automated Transport Quoting:** Route calculation from the warehouse origin.
    - *Local:* Fixed flat rate.
    - *Long Distance:* Per-km rate + Tolls + Border fees.
    - *Stay Fees:* Calculated idle days between inbound and outbound transits.
- [ ] **Vehicle Tiers & Generic Fleet:** Introduce `Vehicle_Tier` to the Fleet database.
    - *Tier 1 (Cargo Van / Sprinter):* ~3.3m L x 1.7m W x 1.9m H (Nimble, local gigs)
    - *Tier 2 (Box Van w/ Tail Lift):* ~4.2m L x 2.1m W x 2.2m H (Standard AV cases)
    - *Tier 3 (Rigid Truck):* ~7.5m L x 2.4m W x 2.5m H (Medium/Large PA & Lighting)
    - *Tier 4 (Artic Lorry / Trailer):* ~13.6m L x 2.4m W x 2.6m H (Arena Tours)
- [ ] **Push Notifications (Option 1):** See dedicated section above — Firebase Hosting + FCM; do not duplicate here.
- [ ] **Security & RBAC Beta Audit:** Final lockdown of Role-Permissions matrix and data tunneling before beta deployment.

---

## Operation manuals & training assets (end of project — keep this section last)

> **Placement rule:** This block stays at the **bottom** of `Project_TODO.md`. Do not add new roadmap items below it — it is work for **after** core product milestones are stable.

**Goal:** Crew and managers can onboard **without your help** — install the PWA, log in, navigate, and use their role-appropriate features.

**Approach:** Build a **screenshot source pack** (real UI captures + short step captions), then feed it into **Google NotebookLM** to generate:
- Crew manual vs manager manual (split by role)
- PDFs, slide decks, FAQs, optional audio overview

**What to capture (when ready — after mobile + notifications sign-off):**
- [ ] **PWA install** — iPhone (Add to Home Screen), Android Chrome; open from icon (`web.app`, not `script.google.com`)
- [ ] **Login & stay signed in** — crew name, passcode, session on parent shell
- [ ] **Mobile Command Center** — Events, Tasks, Notifications
- [ ] **Crew Hub → Timeline** — MY SHIFTS list vs full TIMELINE (all crew); pinch zoom; shift detail sheet
- [ ] **Push alerts** — first-time setup, when the bar appears / disappears, blocked notifications
- [ ] **Manager-only flows** — project editor, save/sync, timeline editing, admin surfaces (as applicable)

**Deliverables (agent + director):**
- [ ] Numbered step folders or one master doc: **one screenshot per step**, caption = exact on-screen label
- [ ] Role tags `[CREW]` / `[MANAGER]` on sections for NotebookLM prompts
- [ ] Version stamp on the pack (e.g. manual source — GAS v325) when refreshed
- [ ] Redacted/demo data only in captures; no real passwords in repo
- [ ] Export to PDF or Google Doc for NotebookLM ingestion

**NotebookLM prompts (examples for later):** “Write a 2-page crew quick start”, “FAQ for iPhone install”, “Manager checklist before opening a project.”

**Not in scope for v0:** Marketing polish, legal copy — product screenshots + factual steps only.

