# Equipment model — Bulk, Matryoshka, and the two packing engines

**Entry:** [AI_DOCTRINE.md](../../AI_DOCTRINE.md) · **Fragile checklist:** [FRAGILE_ZONES.md](FRAGILE_ZONES.md) · **Deep traps:** [ARCHITECTURE.md](ARCHITECTURE.md)

**Last swept:** 2026-06-28

**Read this first** when the task touches Project Assets, packing, checkout, vault nesting, cables, containers, or RFID/QR scans.

The director may dictate by voice — use the **terminology lock** below when searching code or writing docs. Do not guess alternate spellings.

---

## Terminology lock

| Term | Meaning |
|------|---------|
| **Auto-Packing** | Bulk cable/trunk engine only — `autoProvisionCableCases()` in `02e4_Logic_Containers.html` |
| **Auto-Containerization** | Fluid kit engine for physical fixtures — `recalcAutoContainers()` in `02e5_Logic_Sync.html` |
| **Bulk** | Vault `type: "Bulk"` — one row, quantity is a **count**, not unique units |
| **Physical (unique)** | Default `nestingLevel` 6 — exploded to `qty: 1` per assignment on save |
| **Container (case)** | `nestingLevel` 3 (or 4/5) — cases/trunks; each unit can have `rfidTag` + QR |
| **`isAuto`** | Phantom auto-container row from Auto-Containerization |
| **`isGenericAuto`** | Phantom cable trunk row from Auto-Packing |
| **`containerUid`** | Bottom-up link: child assignment → parent case (string; may be `assetId` or `assetId|||formula`) |
| **`[BULK] …` formula** | Cable trunk label, e.g. `[BULK] XLR CASE - AUDIO` |

**Never merge Auto-Packing with Auto-Containerization.** They are separate engines with separate flags and files.

---

## Three kinds of thing on a project

### 1. Bulk (cables, tape, consumable counts)

- **One vault entity** with `totalQuantity` / counts on the project (`qty` on `ProjectAsset`).
- **Not unique** — cannot have per-piece RFID tags.
- Must be **married to something with identity** (a level-3 case) to check out at the door.
- Grouped for cable auto-pack by **second tag under CBL** in the vault tag tree (e.g. XLR vs Socopex) plus department.

### 2. Physical unique (level 6 default)

- Each unit is its own vault row (or exploded to `qty: 1` on the project).
- Can have **RFID** and QR (primary key = vault `id`).
- Packs into cases via `containerType` on the vault asset → Auto-Containerization links `containerUid` bottom-up.

### 3. Container / case (level 3)

- Cases, trunks, cable cases — `nestingLevel` 3 (kits with components are also level 3 with components).
- **Each physical unit** is a vault asset with its own **`id`** (primary key), **`rfidTag`**, and QR sticker (QR encodes the same primary key).
- Level-6 gear **lives inside** level-3 containers in the data model (Matryoshka), not as arrays stored on the parent row.

---

## Matryoshka protocol (one rule)

- **Database links bottom-up:** children point to parent via `containerUid` on project assignments.
- **UI may pack top-down** (pick case → pack items in), but do not store “children arrays” on container rows in the DB.
- **Soft allocation in planning:** phantom `isAuto` / `isGenericAuto` cases are generic until checkout; physical case UIDs matter for RFID at the door.
- **Checkout:** `Operations.js` expands a case scan to rows whose `container_uid` matches that case identity.

Full trap detail: [ARCHITECTURE.md](ARCHITECTURE.md) §4 (Matryoshka).

---

## Engine A — Auto-Containerization (NOT cables)

| | |
|--|--|
| **Function** | `recalcAutoContainers()` — canonical in `02e5_Logic_Sync.html` |
| **Also invoked from** | `02e2_Logic_CRUD.html`, `02e4_Logic_Containers.html` |
| **Applies to** | Physical items with vault `containerType` pointing at a case model |
| **Creates** | `isAuto: true` phantom case rows per capacity |
| **Links** | Sets `containerUid` on fixtures to `parentId` or `parentId|||formula` |

**Does not apply to** `type: "Bulk"` cable rows.

---

## Engine B — Auto-Packing (bulk cables ONLY)

| | |
|--|--|
| **Function** | `autoProvisionCableCases()` — `02e4_Logic_Containers.html` |
| **Triggered from** | `02_Project_Editor_Logistics.html` (logistics / auto-pack actions) |
| **Applies to** | Loose `type: "Bulk"` on the project, not already in a container |
| **Groups by** | CBL child tag name (e.g. XLR, Socopex) + department |
| **Creates** | `isGenericAuto: true` trunk rows; formula `[BULK] {TAG} CASE - {DEPT}` |
| **Links cables** | `containerUid = caseModelId + "|||" + trunkForm` |

**Does not apply to** predefined kits, fixed racks, or level-6 fixtures — use Engine A or manual pack.

### What already works (shipped)

1. Project lists bulk cables by type (tag under CBL).
2. Auto-Pack groups same-tag cables and assigns them to a **logical** trunk (`[BULK] …`).
3. Phantom trunk rows (`isGenericAuto`) represent “a cable case of this type” for the list and truck logic.
4. Checkout can expand a **scanned case** to children **when** `containerUid` points at the scanned case’s identity.

### Known gap (only missing piece)

**Physical cable case binding in packing mode:**  
Auto-Pack knows *what cables belong together* but not *which empty level-3 case (this RFID / this QR / this vault `id`) is that trunk*.

**Required workflow (planned):**

1. In **packing mode**, scan QR or RFID on an **empty cable case** (dual label = same primary key).
2. System resolves vault `id` → sets active pack target / binds that physical unit to the correct `[BULK] …` trunk.
3. Bulk cables keep `containerUid` pointing at **that physical case id** (not only the generic model + formula).
4. Checkout scans the case RFID → system knows Socopex vs XLR via the marriage above.

**QR and gun are the same step:** both deliver the primary key string → same lookup as `globalAssets` / `rfidTag` matchers.

---

## Manual packing mode (shared)

- `window.activeContainerTarget` — which case receives PACK actions (`02e4_Logic_Containers.html`, `02d_Equipment_Render.html`).
- `packItem` / `unpackItem` — mutate `containerUid` on assignments; call `recalcAutoContainers()` where appropriate.
- `setVaultContainerTarget(assetId)` — add physical case to project and select it.

---

## Fragile interactions

### Re-running Auto-Packing

`autoProvisionCableCases()` **removes all `isGenericAuto` rows** and rebuilds logical trunks. Unpacking or re-running without physical bindings can disrupt floor state.

**Planned mitigation:** unpack requires **hold ~1.5 seconds** (confirm intent) so accidental unpack does not fight auto-pack during busy packing.

### processFormulas explosion

Physical (non-Bulk) items with `qty > 1` burst to `qty: 1` on sync — Bulk intentionally does not. See [FRAGILE_ZONES.md](FRAGILE_ZONES.md) (Formula explosion).

---

## Related docs (do not duplicate here)

| Topic | File |
|-------|------|
| Triangle of Truth (formula ↔ list) | [FRAGILE_ZONES.md](FRAGILE_ZONES.md) |
| Multi-user PA, digests, mobile auto-save | [topics/project-assets-concurrency.md](topics/project-assets-concurrency.md) |
| Gate, guns, station profile | [topics/logistics-warehouse.md](topics/logistics-warehouse.md) |
| QR print studio (primary key on labels) | `06b4_Admin_Assets_QR.html` |
| Build / LogicPayload / no `dist/` edits | [FRAGILE_ZONES.md](FRAGILE_ZONES.md), [ARCHITECTURE.md](ARCHITECTURE.md) §8 |

---

## AI rule

Before answering or coding on Project Assets / warehouse packing:

1. Read this file.
2. Skim [FRAGILE_ZONES.md](FRAGILE_ZONES.md) quick reference for the zone you will touch.
3. Open the **one** topic file if the task is backlog (gate, concurrency, mobile).

Do **not** describe cable packing using Auto-Containerization logic, or vice versa.
