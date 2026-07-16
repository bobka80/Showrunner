/**
 * SM Showrunner (smuruner) - Clean 8 Architecture
 * Dal_Router.js - DAL router (Phase 4 Slice A)
 *
 * Selects storage adapter per domain + session status. Session-open routes PA/timeline
 * to FirebaseAdapter (Slice A still delegates to Sheets until Firestore wiring ships).
 * Ledger: durable Sheets via atomic hub path in LedgerRepo (design lock §2 —
 * journal → Sheets → verify; no session fork). Router still returns SheetsAdapter
 * if anything calls dalAdapterFor_(…, LEDGER) directly.
 */

// @INDEX: DAL -> Router (Phase 2)

var DAL_DOMAIN = {
  PROJECT_ASSETS: 'projectAssets',
  TIMELINE: 'timeline',
  LEDGER: 'ledger'
};

var DAL_SESSION = {
  NORMAL: 'normal',
  SESSION_OPEN: 'session-open',
  COMMITTING: 'committing',
  CLOSED: 'closed'
};

/**
 * Central routing switch — canonical entry for adapter selection.
 * @param {string} domain - DAL_DOMAIN value
 * @param {string} sessionStatus - DAL_SESSION value
 * @returns {object} Active adapter (SheetsAdapter or FirebaseAdapter)
 */
function projectDataRouter(domain, sessionStatus) {
  var status = sessionStatus || DAL_SESSION.NORMAL;
  if (status !== DAL_SESSION.NORMAL &&
      status !== DAL_SESSION.SESSION_OPEN &&
      status !== DAL_SESSION.COMMITTING &&
      status !== DAL_SESSION.CLOSED) {
    status = DAL_SESSION.NORMAL;
  }

  // Ledger: Sheets durable store (atomic journal lives in Dal_Ledger.js / LedgerRepo).
  if (domain === DAL_DOMAIN.LEDGER) {
    return getSheetsAdapter();
  }

  // Phase 4: session-open or committing → Firebase for PA + timeline only.
  if (status === DAL_SESSION.SESSION_OPEN || status === DAL_SESSION.COMMITTING) {
    if (domain === DAL_DOMAIN.PROJECT_ASSETS || domain === DAL_DOMAIN.TIMELINE) {
      return getFirebaseAdapter();
    }
  }

  return getSheetsAdapter();
}
