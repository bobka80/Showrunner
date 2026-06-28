# Financials engine & quoting

**Entry:** [AI_DOCTRINE.md](../../AI_DOCTRINE.md) · **Index:** [Project_TODO.md](../Project_TODO.md)

**Last swept:** 2026-06-28 · **Status:** Partial — offer tab + print studio shipped; labor/fleet/ROI pending

---

## Shipped

- [x] **OFFER tab** — priced equipment lines, hide consumables/zero-price (`renderOfferUI` in `02d_Equipment_Render.html`)
- [x] **Editable unit prices** — per-line `overridePrice` on project assets
- [x] **Multipliers** — days charged, global discount %, tax/VAT with live grand total
- [x] **Legal note blocks** — selectable terms on offer (BG/EN)
- [x] **Print Studio offer quote** — live preview + **Generate PDF** via browser print (`02g_Project_Reports.html`)
- [x] **Logistics list print mode** in Print Studio (separate from offer)

## Remaining

- [ ] **Labor & fleet integration** — OFFER tab shows placeholders; wire Timeline `Day_Rate` / `Hourly_Rate` + assigned vehicles
- [ ] **Live ROI dashboard** — Financials hub still shows “ROI calculation engine pending…” (`09_Financials_Hub.html`)
- [ ] **Invoice PDF** — distinct from offer quote workflow
- [ ] **Price immutability lock** — historical invoices must not rewrite when Vault rental prices change

**Schema note:** `Projects_Index.rental_days`, `Projects_Index.global_discount` not in schema builder yet — see [SCHEMA.md](../SCHEMA.md).
