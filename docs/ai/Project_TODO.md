# SM Showrunner - Master Feature Roadmap

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

- [ ] **Fleet Payload Assignment:** Link the Check-Out scanner so that sealed flight cases (and their nested contents) can be directly assigned as payloads to specific Truck timelines.
- [ ] **The "Truck Arrangement Brain" (Algorithmic Load Planner):** Isolate truck packing logic into a dedicated rules engine. This "Brain" will blend basic Tetris logic with weighted human heuristics (e.g., LED walls stack 3-high at the front, Line arrays follow). It will autonomously score and prioritize conflicting constraints like weight distribution (center of gravity), stackability limits, and operational presets to emulate human decision-making.

- [ ] **Missing Logistics Notifications:** Bind an alert badge/notification to the Project Editor when an event is saved without defined transit legs, prompting the manager to define the logistics.

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
- [ ] **Automated Task Notifications:** Tie the Notification Engine to the Checklist/Task progression (e.g., "Lighting Prep is 100% Complete" automatically pushes an alert to the PM).
- [ ] **Freelancer Shift Placeholders & Bidding:** Allow creation of "TBD" shift placeholders (e.g., "Need 4 more riggers"). Build a future engine to broadcast these open shifts to a pool of freelancers, allowing them to accept/bid, and automatically choosing the best candidate based on internal ratings.

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
- [ ] **Firebase Push Notification Engine:** Deploy Service Worker + FCM for real-time mobile lock-screen alerts.
- [ ] **Security & RBAC Beta Audit:** Final lockdown of Role-Permissions matrix and data tunneling before beta deployment.

