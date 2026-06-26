/**
 * Notifications_Store.js — FCM device token storage (Script Properties, Phase 1).
 */

// @INDEX: NOTIFICATIONS -> FCM Token Store
// getFirebasePublicConfig() lives in Main.js (fcfg endpoint).
function registerFcmToken(crewName, token, deviceLabel, actor) {
  if (!crewName || !token) throw new Error('Missing crew name or FCM token.');
  const profile = getUserSecurityProfile(crewName);
  if (!profile || !profile.uid) throw new Error('Unknown user.');
  const uid = String(profile.uid).trim();
  const cleanToken = String(token).trim();
  if (cleanToken.length < 20) throw new Error('Invalid FCM token.');

  const props = PropertiesService.getScriptProperties();
  const key = 'FCM_TOKEN_' + uid;
  const payload = {
    token: cleanToken,
    email: profile.email || '',
    label: deviceLabel || 'web',
    updatedAt: new Date().toISOString()
  };
  props.setProperty(key, JSON.stringify(payload));
  writeToAuditLog(actor || crewName, 'UPDATE', 'NOTIFICATIONS', uid, 'FCM Token', 'Registered push token (' + payload.label + ').');
  return { success: true, uid: uid };
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
