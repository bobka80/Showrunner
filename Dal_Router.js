/**
 * SM Showrunner (smuruner) - Clean 8 Architecture
 * Dal_Router.js - DAL router (Phase 2 — Sheets only)
 *
 * Selects storage adapter per domain + session status. Phase 4 adds FirebaseAdapter
 * for session-open on projectAssets / timeline; Phase 2 always returns SheetsAdapter.
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
 * @returns {object} Active adapter (SheetsAdapter through Phase 3)
 */
function projectDataRouter(domain, sessionStatus) {
  var status = sessionStatus || DAL_SESSION.NORMAL;
  if (status !== DAL_SESSION.NORMAL &&
      status !== DAL_SESSION.SESSION_OPEN &&
      status !== DAL_SESSION.COMMITTING &&
      status !== DAL_SESSION.CLOSED) {
    status = DAL_SESSION.NORMAL;
  }

  // Phase 2–3: all states → Sheets (zero behavior change).
  // Phase 4: session-open + projectAssets|timeline → FirebaseAdapter.
  // Ledger stays Sheets (atomic per-op — design lock §2).
  return getSheetsAdapter();
}

/**
 * Resolve session status for a project/domain. Phase 4 reads session registry.
 * @param {string} projectId
 * @param {string} domain
 * @returns {string} DAL_SESSION value
 */
function resolveDalSessionStatus_(projectId, domain) {
  return DAL_SESSION.NORMAL;
}
