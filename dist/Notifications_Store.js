/**
 * Notifications_Store.js — FCM device token storage (Script Properties, Phase 1).
 */

// @INDEX: NOTIFICATIONS -> FCM Token Store
// getFirebasePublicConfig() lives in Main.js (fcfg endpoint).

function saveFirebaseVapidKey(crewName, vapidKeyRaw) {
  if (!verifyBackendPrivilege(crewName, 'ROOT')) {
    return { success: false, message: 'ROOT privileges required.' };
  }
  const vapidKey = sanitizeFirebaseVapidKey_(vapidKeyRaw);
  if (!isValidFirebaseVapidKey_(vapidKey)) {
    return {
      success: false,
      message: 'Invalid VAPID key. Use the Web Push public key from Firebase Console → Project settings → Cloud Messaging → Web Push certificates (starts with B, ~88 chars). Not the API key (AIza…).'
    };
  }
  PropertiesService.getScriptProperties().setProperty('FIREBASE_VAPID_KEY', vapidKey);
  try {
    writeToAuditLog(crewName, 'UPDATE', 'NOTIFICATIONS', 'VAPID', 'Firebase VAPID', 'Updated FIREBASE_VAPID_KEY.');
  } catch (e) { /* saved */ }
  return { success: true, message: 'VAPID key saved. Hard-refresh the Hosting URL and click Allow notifications again.' };
}

function getFirebasePushSetupStatus(crewName) {
  if (!verifyBackendPrivilege(crewName, 'ROOT')) {
    return { success: false, message: 'ROOT privileges required.' };
  }
  const cfg = getFirebasePublicConfig();
  const reg = getFcmRegistrationStatus(crewName);
  return {
    success: true,
    vapidKeyValid: cfg.vapidKeyValid,
    vapidKeyLength: (cfg.vapidKey || '').length,
    vapidLooksLikeApiKey: (cfg.vapidKey || '').indexOf('AIza') === 0,
    deviceRegistered: !!(reg && reg.registered),
    hostingUrl: cfg.hostingUrl
  };
}
function registerFcmToken(crewName, token, deviceLabel, actor) {
  try {
    if (!crewName || !token) return { success: false, message: 'Missing crew name or FCM token.' };
    const profile = getUserSecurityProfile(crewName);
    if (!profile || !profile.uid) return { success: false, message: 'Unknown user (no uid for ' + crewName + ').' };
    const uid = String(profile.uid).trim();
    const cleanToken = String(token).trim();
    if (cleanToken.length < 20) return { success: false, message: 'Invalid FCM token length.' };

    const props = PropertiesService.getScriptProperties();
    const key = 'FCM_TOKEN_' + uid;
    const payload = {
      token: cleanToken,
      email: profile.email || '',
      label: deviceLabel || 'web',
      updatedAt: new Date().toISOString()
    };
    props.setProperty(key, JSON.stringify(payload));
    try {
      writeToAuditLog(actor || crewName, 'UPDATE', 'NOTIFICATIONS', uid, 'FCM Token', 'Registered push token (' + payload.label + ').');
    } catch (auditErr) { /* token saved — audit optional */ }
    return { success: true, uid: uid };
  } catch (err) {
    return { success: false, message: (err && err.message) ? err.message : String(err) };
  }
}

function getFcmRegistrationStatus(crewName) {
  const profile = getUserSecurityProfile(crewName);
  if (!profile || !profile.uid) return { registered: false, message: 'Unknown user profile.' };
  const raw = PropertiesService.getScriptProperties().getProperty('FCM_TOKEN_' + String(profile.uid).trim());
  if (!raw) return { registered: false, message: 'No token saved yet.' };
  try {
    const parsed = JSON.parse(raw);
    return {
      registered: !!(parsed && parsed.token),
      label: parsed.label || '',
      updatedAt: parsed.updatedAt || '',
      message: parsed.token ? 'Device registered for push.' : 'No token saved yet.'
    };
  } catch (e) {
    return { registered: false, message: 'Token record unreadable.' };
  }
}

function getFcmTokenForUser(crewName) {
  const profile = getUserSecurityProfile(crewName);
  if (!profile || !profile.uid) return null;
  const raw = PropertiesService.getScriptProperties().getProperty('FCM_TOKEN_' + String(profile.uid).trim());
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && parsed.token ? String(parsed.token) : null;
  } catch (e) {
    return null;
  }
}

function getFcmTokensForUids(uidList) {
  const props = PropertiesService.getScriptProperties();
  const tokens = [];
  (uidList || []).forEach(function(uid) {
    if (!uid) return;
    const raw = props.getProperty('FCM_TOKEN_' + String(uid).trim());
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.token) tokens.push(String(parsed.token));
    } catch (e) { /* skip */ }
  });
  return tokens;
}
