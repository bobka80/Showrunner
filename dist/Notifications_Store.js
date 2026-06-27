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

function saveFcmDeviceToken(crewName, tokenRaw) {
  if (!verifyBackendPrivilege(crewName, 'ROOT')) {
    return { success: false, message: 'ROOT privileges required.' };
  }
  const token = String(tokenRaw || '').trim();
  if (token.length < 20) {
    return { success: false, message: 'Paste the full device token (long string from Copy push token).' };
  }
  return registerFcmToken(crewName, token, 'web-manual', crewName);
}

/** Logged-in user saves their own device token (iframe → google.script.run, no JSONP nonce). */
function saveMyFcmDeviceToken(crewName, tokenRaw, deviceLabel) {
  if (!crewName) return { success: false, message: 'Not logged in.' };
  const token = String(tokenRaw || '').trim();
  if (token.length < 20) return { success: false, message: 'Invalid FCM token.' };
  return registerFcmToken(crewName, token, deviceLabel || 'web-hosting', crewName);
}

function isFcmTokenRegistered(crewName, tokenRaw) {
  const token = String(tokenRaw || '').trim();
  if (!crewName || token.length < 20) {
    return { registered: false, message: 'No token to check.' };
  }
  const profile = getUserSecurityProfile(crewName);
  if (!profile || !profile.uid) {
    return { registered: false, message: 'Unknown user profile.' };
  }
  const devices = getFcmDevicesForUid_(profile.uid);
  const found = devices.some(function(d) { return d && d.token === token; });
  return {
    registered: found,
    deviceCount: devices.length,
    message: found ? 'This device is registered.' : 'This device is not registered yet.'
  };
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
    vapidKeyPrefix: (cfg.vapidKey || '').slice(0, 4),
    vapidLooksLikeApiKey: (cfg.vapidKey || '').indexOf('AIza') === 0,
    deviceRegistered: !!(reg && reg.registered),
    hostingUrl: cfg.hostingUrl
  };
}
function issueFcmRegistrationKey(crewName) {
  if (!crewName) return { success: false, message: 'Not logged in.' };
  return { success: true, regKey: createFcmRegistrationKey_(crewName) };
}

function refreshFcmRegistrationKeyFromOld_(oldKey) {
  const cleanOld = String(oldKey || '').trim();
  if (!cleanOld) return { success: false, message: 'Missing key.' };
  const cache = CacheService.getScriptCache();
  const crewName = cache.get('fcm_regkey_' + cleanOld);
  if (!crewName) return { success: false, message: 'Key expired — log in again.' };
  return { success: true, regKey: createFcmRegistrationKey_(crewName), crewName: crewName };
}

function createFcmRegistrationKey_(crewName) {
  const cleanName = String(crewName || '').trim();
  if (!cleanName) return '';
  const key = Utilities.getUuid().replace(/-/g, '');
  CacheService.getScriptCache().put('fcm_regkey_' + key, cleanName, 3600);
  return key;
}

function completeFcmRegistrationViaKey_(regKey, token, label) {
  const cleanKey = String(regKey || '').trim();
  if (!cleanKey) return { success: false, message: 'Missing registration key.' };
  const cache = CacheService.getScriptCache();
  const cacheKey = 'fcm_regkey_' + cleanKey;
  const crewName = cache.get(cacheKey);
  if (!crewName) return { success: false, message: 'Registration key expired — log in again.' };
  const result = registerFcmToken(crewName, token, label || 'web-hosting', crewName);
  try {
    writeToAuditLog(crewName, 'UPDATE', 'NOTIFICATIONS', 'FCM_MOBILE', label || 'web',
      (result && result.success)
        ? ('Saved token (' + (label || 'web') + ') devices=' + (result.deviceCount || 1))
        : ('Save failed: ' + ((result && result.message) || 'unknown')));
  } catch (e) { /* optional */ }
  if (result && result.success) {
    cache.put(cacheKey, crewName, 120);
  }
  return result;
}

function verifyFcmTokenSavedForKey_(regKey, tokenPrefix) {
  const cleanKey = String(regKey || '').trim();
  const prefix = String(tokenPrefix || '').trim();
  if (!cleanKey || prefix.length < 8) {
    return { saved: false, message: 'Missing check data.' };
  }
  const cache = CacheService.getScriptCache();
  const crewName = cache.get('fcm_regkey_' + cleanKey);
  if (!crewName) {
    return { saved: false, message: 'Key expired — stay logged in and retry.' };
  }
  const profile = getUserSecurityProfile(crewName);
  if (!profile || !profile.uid) return { saved: false, message: 'Unknown user.' };
  const devices = getFcmDevicesForUid_(profile.uid);
  const found = devices.some(function(d) {
    return d && d.token && String(d.token).indexOf(prefix) === 0;
  });
  return {
    saved: found,
    deviceCount: devices.length,
    labels: devices.map(function(d) { return d.label || 'web'; }).join(', '),
    message: found ? 'Phone registered on server.' : 'Token not on server yet.'
  };
}

function prepareFcmRegistrationBridge(crewName) {
  if (!crewName) return { success: false, message: 'Not logged in.' };
  const profile = getUserSecurityProfile(crewName);
  if (!profile || !profile.uid) return { success: false, message: 'Unknown user (no uid for ' + crewName + ').' };
  const nonce = Utilities.getUuid().replace(/-/g, '');
  CacheService.getScriptCache().put('fcm_bridge_' + nonce, String(crewName).trim(), 600);
  return {
    success: true,
    nonce: nonce,
    registerUrl: ScriptApp.getService().getUrl(),
    crewName: String(crewName).trim()
  };
}

function completeFcmRegistrationViaBridge_(nonce, token, label) {
  const cleanNonce = String(nonce || '').trim();
  if (!cleanNonce) return { success: false, message: 'Missing registration nonce.' };
  const cache = CacheService.getScriptCache();
  const cacheKey = 'fcm_bridge_' + cleanNonce;
  const crewName = cache.get(cacheKey);
  if (!crewName) return { success: false, message: 'Registration link expired — click RETRY DEVICE REGISTER.' };
  const result = registerFcmToken(crewName, token, label || 'web-hosting', crewName);
  if (result && result.success) cache.remove(cacheKey);
  return result;
}

function registerFcmTokenWithBridge(crewName, token, nonce, label) {
  const cleanNonce = String(nonce || '').trim();
  const cleanName = String(crewName || '').trim();
  if (!cleanNonce || !cleanName) return { success: false, message: 'Missing bridge data.' };
  const cache = CacheService.getScriptCache();
  const cacheKey = 'fcm_bridge_' + cleanNonce;
  const cachedName = cache.get(cacheKey);
  if (!cachedName || cachedName.toLowerCase() !== cleanName.toLowerCase()) {
    return { success: false, message: 'Registration link expired — click RETRY DEVICE REGISTER.' };
  }
  const result = registerFcmToken(cleanName, token, label || 'web-hosting', cleanName);
  if (result && result.success) cache.remove(cacheKey);
  return result;
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
    const record = parseFcmTokenRecord_(props.getProperty(key));
    const devices = record.devices || [];
    const now = new Date().toISOString();
    const label = deviceLabel || 'web';
    let found = false;
    for (let i = 0; i < devices.length; i++) {
      if (devices[i].token === cleanToken) {
        devices[i].label = label;
        devices[i].updatedAt = now;
        found = true;
        break;
      }
    }
    if (!found) {
      devices.push({ token: cleanToken, label: label, updatedAt: now });
    }
    const maxDevices = 5;
    while (devices.length > maxDevices) {
      devices.sort(function(a, b) { return String(a.updatedAt).localeCompare(String(b.updatedAt)); });
      devices.shift();
    }
    props.setProperty(key, JSON.stringify({
      email: profile.email || record.email || '',
      devices: devices
    }));
    try {
      writeToAuditLog(actor || crewName, 'UPDATE', 'NOTIFICATIONS', uid, 'FCM Token',
        'Registered push token (' + label + '). Devices=' + devices.length);
    } catch (auditErr) { /* token saved */ }
    return { success: true, uid: uid, deviceCount: devices.length };
  } catch (err) {
    return { success: false, message: (err && err.message) ? err.message : String(err) };
  }
}

function parseFcmTokenRecord_(raw) {
  if (!raw) return { devices: [] };
  try {
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.devices)) {
      return { email: parsed.email || '', devices: parsed.devices };
    }
    if (parsed && parsed.token) {
      return {
        email: parsed.email || '',
        devices: [{
          token: String(parsed.token),
          label: parsed.label || 'web',
          updatedAt: parsed.updatedAt || ''
        }]
      };
    }
  } catch (e) { /* unreadable */ }
  return { devices: [] };
}

function getFcmDevicesForUid_(uid) {
  if (!uid) return [];
  const raw = PropertiesService.getScriptProperties().getProperty('FCM_TOKEN_' + String(uid).trim());
  return parseFcmTokenRecord_(raw).devices || [];
}

function getFcmRegistrationStatus(crewName) {
  const profile = getUserSecurityProfile(crewName);
  if (!profile || !profile.uid) return { registered: false, message: 'Unknown user profile.' };
  const devices = getFcmDevicesForUid_(profile.uid);
  if (!devices.length) return { registered: false, message: 'No token saved yet.' };
  const labels = devices.map(function(d) { return d.label || 'web'; });
  const latest = devices.reduce(function(best, d) {
    return (!best || String(d.updatedAt) > String(best.updatedAt)) ? d : best;
  }, null);
  return {
    registered: true,
    deviceCount: devices.length,
    devices: devices.map(function(d) {
      return { label: d.label || 'web', updatedAt: d.updatedAt || '' };
    }),
    labels: labels.join(', '),
    label: labels[labels.length - 1] || '',
    updatedAt: latest ? latest.updatedAt : '',
    message: devices.length === 1
      ? '1 device registered for push.'
      : (devices.length + ' devices registered for push.')
  };
}

function getFcmTokensForUser(crewName) {
  const profile = getUserSecurityProfile(crewName);
  if (!profile || !profile.uid) return [];
  return getFcmDevicesForUid_(profile.uid)
    .map(function(d) { return d && d.token ? String(d.token) : ''; })
    .filter(function(t) { return t.length > 20; });
}

/** @deprecated use getFcmTokensForUser — returns first token only */
function getFcmTokenForUser(crewName) {
  const tokens = getFcmTokensForUser(crewName);
  return tokens.length ? tokens[0] : null;
}

function getFcmTokensForUids(uidList) {
  const tokens = [];
  const seen = {};
  (uidList || []).forEach(function(uid) {
    if (!uid) return;
    getFcmDevicesForUid_(uid).forEach(function(d) {
      const t = d && d.token ? String(d.token) : '';
      if (t.length > 20 && !seen[t]) {
        seen[t] = true;
        tokens.push(t);
      }
    });
  });
  return tokens;
}
