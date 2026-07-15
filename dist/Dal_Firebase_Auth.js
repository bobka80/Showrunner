/**
 * Dal_Firebase_Auth.js — Firebase Auth custom tokens for client Firestore SDK (Phase 4 Slice C)
 *
 * Mint short-lived custom tokens via service account (same credential as FCM / Firestore REST).
 * Client signs in before Firestore listeners; writes still go through GAS in Slice C.
 */

// @INDEX: DAL -> Firebase client auth

function dalMintFirebaseCustomToken_(firebaseUid, extraClaims) {
  var sa = getFirebaseServiceAccount_();
  if (!sa.client_email || !sa.private_key) {
    throw new Error('Firebase service account missing — set FIREBASE_SERVICE_ACCOUNT_JSON in Script Properties.');
  }
  var now = Math.floor(Date.now() / 1000);
  // Custom claims MUST be nested under "claims" — top-level keys are ignored by Firebase Auth
  // and then request.auth.token.showrunner fails Firestore security rules.
  var claim = {
    iss: sa.client_email,
    sub: sa.client_email,
    aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
    iat: now,
    exp: now + 3600,
    uid: String(firebaseUid || 'showrunner_anon')
  };
  if (extraClaims && typeof extraClaims === 'object') {
    claim.claims = extraClaims;
  }
  var header = { alg: 'RS256', typ: 'JWT' };
  var enc = function (obj) {
    return Utilities.base64EncodeWebSafe(JSON.stringify(obj)).replace(/=+$/, '');
  };
  var toSign = enc(header) + '.' + enc(claim);
  var signature = Utilities.base64EncodeWebSafe(
    Utilities.computeRsaSha256Signature(toSign, sa.private_key)
  ).replace(/=+$/, '');
  return toSign + '.' + signature;
}

function dalResolveFirebaseUidForActor_(actor) {
  var name = String(actor || '').trim();
  if (!name) throw new Error('Actor required for Firebase auth.');
  try {
    var profile = getUserSecurityProfile(name);
    if (profile && profile.uid) return String(profile.uid);
  } catch (e) { /* fall through */ }
  return Utilities.base64EncodeWebSafe(name).replace(/=+$/, '').slice(0, 120);
}

/**
 * Public — client Firestore SDK bootstrap (google.script.run).
 * Returns public web config + custom auth token. Read-only; no sheet writes.
 */
function getDalFirebaseClientAuth(actor) {
  return executeWithRetry(function () {
    var name = String(actor || '').trim();
    if (!name) throw new Error('Not authenticated.');
    try {
      var profile = getUserSecurityProfile(name);
      if (!profile) throw new Error('Unknown crew member.');
    } catch (e) {
      if (String(e.message || e).indexOf('Unknown') !== -1) throw e;
    }
    if (!dalFirestoreIsConfigured_()) {
      throw new Error('Firebase service account not configured.');
    }
    var cfg = getFirebasePublicConfig();
    if (!cfg.apiKey) {
      throw new Error('FIREBASE_WEB_API_KEY missing in Script Properties — required for client Firestore.');
    }
    var fbUid = dalResolveFirebaseUidForActor_(name);
    var token = dalMintFirebaseCustomToken_(fbUid, { showrunner: true, crew: name });
    return {
      config: cfg,
      customToken: token,
      firebaseUid: fbUid
    };
  }, 3, true);
}
