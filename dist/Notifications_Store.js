/**
 * Notifications_Store.js — FCM device token storage (Script Properties, Phase 1).
 */

// @INDEX: NOTIFICATIONS -> FCM Token Store

function getFirebasePublicConfig() {
  const p = PropertiesService.getScriptProperties();
  const projectId = p.getProperty('FIREBASE_PROJECT_ID') || 'sm-showrunner-97405';
  const gasUrl = ScriptApp.getService().getUrl();
  let webCfg = {};
  const webCfgRaw = p.getProperty('FIREBASE_WEB_CONFIG');
  if (webCfgRaw) {
    try { webCfg = JSON.parse(webCfgRaw); } catch (e) { /* ignore */ }
  }
  return {
    apiKey: p.getProperty('FIREBASE_WEB_API_KEY') || p.getProperty('FIREBASE_API_KEY') || webCfg.apiKey || '',
    authDomain: p.getProperty('FIREBASE_AUTH_DOMAIN') || webCfg.authDomain || (projectId + '.firebaseapp.com'),
    projectId: projectId,
    storageBucket: p.getProperty('FIREBASE_STORAGE_BUCKET') || webCfg.storageBucket || (projectId + '.firebasestorage.app'),
    messagingSenderId: p.getProperty('FIREBASE_MESSAGING_SENDER_ID') || webCfg.messagingSenderId || '',
    appId: p.getProperty('FIREBASE_APP_ID') || webCfg.appId || '',
    vapidKey: p.getProperty('FIREBASE_VAPID_KEY') || webCfg.vapidKey || '',
    gasExecUrl: gasUrl,
    hostingUrl: p.getProperty('FIREBASE_HOSTING_URL') || ('https://' + projectId + '.web.app')
  };
}

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
