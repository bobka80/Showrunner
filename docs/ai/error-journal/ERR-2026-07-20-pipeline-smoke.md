# ERR-2026-07-20 — Pipeline smoke (test presses)

**Kind:** `single`  
**State:** `Fixed` (docs close — no product code)  
**Day campaign:** [../archive/error-day-2026-07-20.md](../archive/error-day-2026-07-20.md) · item `E2026-07-20-A`

---

## Plain language

ROOT (Bogdan) pressed Report with intentional test descriptions to prove: Report → Sheet → Hand over → Cursor → markdown day campaign + journal. Not a product defect.

Pack 2 also confirmed freeze includes project / fork / Firestore / prep-open when filing from PA design.

---

## Member reports

| Report_ID | Timestamp (UTC) | User | View | Description |
|-----------|-----------------|------|------|-------------|
| `9a95a28e-a582-4d69-bb2d-e84c2c121240` | 2026-07-20T13:44:42.031Z | Bogdan | `main\|mobile:HOME\|nav-btn-dashboard` | test log |
| `3e9b6f2f-2aa2-4023-9820-dae524286b28` | 2026-07-20T14:04:06.557Z | Bogdan | `main\|mobile:HOME\|nav-btn-dashboard` | test only |
| `0b565856-4968-4853-8b48-e2c371f9b695` | 2026-07-20T14:04:19.753Z | Bogdan | `main\|mobile:HOME\|nav-btn-dashboard` | test 2 |
| `be761838-a20f-41b2-b69f-d00ec19da573` | 2026-07-20T14:04:33.181Z | Bogdan | `assets\|pa:design\|mobile:HOME\|nav-btn-dashboard` | test 3 |

**Project_ID:** empty on first of pack 2; then `2e57389b-9d04-4c70-b599-001797bcd76a`  
**Fork_ID:** empty until Report 3 → `ba4244b8-709a-4260-a018-81ddf5be0b7b`  
**Sync_Mode:** none → firestore (Report 3) · **Surface:** web  
**App_Version (pack):** `err-ui:2;surface:web`

---

## Notes

- Two handoffs today (pack 1 @ ~13:46Z, pack 2 @ ~14:06Z).  
- No race signals (intentional sequential tests; views/context differ on #3).  
- Report 3 freeze: `presencePaMode: design`, `dalPaLiveSyncMode: firestore`, `dalPrepUiOpen: true`.  
- **Closed 2026-07-20:** director **OK go E2026-07-20-A** — pipeline validated; no ship.

---

## Fix / ship

| Field | Value |
|-------|--------|
| Fixed_In_GAS | n/a (docs-only close) |
| Came_back | — |

---

## Test suggestions (keep after close)

1. ERROR LOGS inbox empty of handed Report_IDs.  
2. Day campaign + this thread match pack fields.  
3. Next pack with a real symptom (not “test …”) opens a product thread.
