/**
 * Notifications_Push.js — FCM HTTP v1 send (service account in Script Properties).
 */

// @INDEX: NOTIFICATIONS -> FCM Push Send

function getFirebaseServiceAccount_() {
  const props = PropertiesService.getScriptProperties();
  const jsonRaw = props.getProperty('FIREBASE_SERVICE_ACCOUNT_JSON');
  if (jsonRaw) {
    const sa = JSON.parse(jsonRaw);
    if (sa.private_key) sa.private_key = String(sa.private_key).replace(/\\n/g, '\n');
    return sa;
  }
  const privateKey = props.getProperty('FIREBASE_PRIVATE_KEY');
  return {
    project_id: props.getProperty('FIREBASE_PROJECT_ID'),
    client_email: props.getProperty('FIREBASE_CLIENT_EMAIL'),
    private_key: privateKey ? String(privateKey).replace(/\\n/g, '\n') : ''
  };
}

function getFirebaseAccessToken_() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get('fcm_oauth_token');
  if (cached) return cached;

  const sa = getFirebaseServiceAccount_();
  if (!sa.client_email || !sa.private_key) {
    throw new Error('Firebase service account missing in Script Properties.');
  }

  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };
  const header = { alg: 'RS256', typ: 'JWT' };
  const enc = function(obj) {
    return Utilities.base64EncodeWebSafe(JSON.stringify(obj)).replace(/=+$/, '');
  };
  const toSign = enc(header) + '.' + enc(claim);
  const signature = Utilities.base64EncodeWebSafe(
    Utilities.computeRsaSha256Signature(toSign, sa.private_key)
  ).replace(/=+$/, '');
  const jwt = toSign + '.' + signature;

  const resp = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {
    method: 'post',
    contentType: 'application/x-www-form-urlencoded',
    payload: {
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    },
    muteHttpExceptions: true
  });
  const data = JSON.parse(resp.getContentText());
  if (!data.access_token) {
    throw new Error('FCM OAuth failed: ' + resp.getContentText());
  }
  const ttl = Math.max(300, Math.min(3300, (data.expires_in || 3600) - 120));
  cache.put('fcm_oauth_token', data.access_token, ttl);
  return data.access_token;
}

function isFcmTokenDeadError_(errText) {
  const t = String(errText || '').toUpperCase();
  return t.indexOf('UNREGISTERED') !== -1 ||
    t.indexOf('NOT_FOUND') !== -1 ||
    t.indexOf('NOT_REGISTERED') !== -1 ||
    t.indexOf('INVALID_ARGUMENT') !== -1 ||
    t.indexOf('REQUESTED ENTITY WAS NOT FOUND') !== -1;
}

function summarizeFcmError_(errText) {
  try {
    const j = JSON.parse(errText);
    const st = (j.error && j.error.status) ? String(j.error.status) : '';
    const msg = (j.error && j.error.message) ? String(j.error.message) : String(errText);
    return st ? (st + ': ' + msg) : msg.slice(0, 180);
  } catch (e) {
    return String(errText || 'unknown error').slice(0, 180);
  }
}

function getShowrunnerPushIconUrl_() {
  const hosting = PropertiesService.getScriptProperties().getProperty('FIREBASE_HOSTING_URL')
    || 'https://sm-showrunner-97405.web.app';
  return String(hosting).replace(/\/$/, '') + '/icon-192.png';
}

function sendFcmToTokens_(tokens, title, body, linkUrl, options) {
  const opts = options || {};
  const list = (tokens || []).filter(function(t) { return t && String(t).length > 20; });
  if (!list.length) return { sent: 0, errors: ['No FCM tokens registered.'], deadTokens: [] };

  const sa = getFirebaseServiceAccount_();
  const projectId = sa.project_id || PropertiesService.getScriptProperties().getProperty('FIREBASE_PROJECT_ID');
  if (!projectId) throw new Error('FIREBASE_PROJECT_ID missing.');

  const accessToken = getFirebaseAccessToken_();
  const url = 'https://fcm.googleapis.com/v1/projects/' + projectId + '/messages:send';
  const hosting = PropertiesService.getScriptProperties().getProperty('FIREBASE_HOSTING_URL')
    || ('https://' + projectId + '.web.app');
  const clickLink = linkUrl || hosting;
  const iconUrl = opts.iconUrl || getShowrunnerPushIconUrl_();

  let sent = 0;
  const errors = [];
  const deadTokens = [];
  list.forEach(function(token) {
    const safeTitle = String(title || 'Showrunner');
    const safeBody = String(body || '');
    // Data-only web push — avoids browser auto-display + SW/handler double notification.
    const payload = {
      message: {
        token: token,
        data: {
          title: safeTitle,
          body: safeBody,
          link: String(clickLink || '')
        },
        webpush: {
          headers: {
            Urgency: 'high',
            TTL: '86400'
          },
          fcmOptions: { link: clickLink }
        }
      }
    };
    const resp = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + accessToken },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    if (resp.getResponseCode() >= 200 && resp.getResponseCode() < 300) {
      sent++;
    } else {
      const errText = resp.getContentText();
      errors.push(summarizeFcmError_(errText));
      if (opts.pruneInvalid !== false && isFcmTokenDeadError_(errText)) {
        deadTokens.push(token);
      }
    }
  });
  return { sent: sent, errors: errors, deadTokens: deadTokens };
}

function sendTestPushNotification(crewName) {
  if (!verifyBackendPrivilege(crewName, 'ROOT')) {
    return { success: false, message: 'ROOT privileges required.' };
  }
  const fleet = collectFleetFcmTokens_();
  const tokens = fleet.tokens || [];
  if (!tokens.length) {
    return { success: false, message: 'No FCM devices in fleet. Crew must open ' + (getFirebasePublicConfig().hostingUrl || 'web.app') + ' and allow notifications.' };
  }
  const result = sendFcmToTokens_(
    tokens,
    '📣 Showrunner test',
    'Push notifications are working on this device.',
    getFirebasePublicConfig().hostingUrl
  );
  let pruned = 0;
  if (result.deadTokens && result.deadTokens.length) {
    const byUid = {};
    result.deadTokens.forEach(function(t) {
      const uid = fleet.tokenToUid[t];
      if (!uid) return;
      if (!byUid[uid]) byUid[uid] = [];
      byUid[uid].push(t);
    });
    Object.keys(byUid).forEach(function(uid) {
      pruned += removeFcmTokensForUid_(uid, byUid[uid]);
    });
  }
  if (result.sent > 0) {
    writeToAuditLog(crewName, 'UPDATE', 'NOTIFICATIONS', 'FLEET', 'Test Push',
      'Sent test FCM to ' + result.sent + '/' + tokens.length + ' fleet device(s). Pruned=' + pruned);
    var msg = 'FCM accepted on ' + result.sent + ' fleet device(s).';
    msg += ' If nothing appears: put web.app in background or lock the phone, then retry.';
    if (pruned > 0) msg += ' Removed ' + pruned + ' dead token(s).';
    if (result.sent < tokens.length && result.errors.length) {
      msg += ' Some devices failed: ' + result.errors[0];
    }
    return {
      success: true,
      partial: result.sent < tokens.length,
      message: msg,
      sent: result.sent,
      pruned: pruned
    };
  }
  var failMsg = 'Send failed — no fleet device accepted the push.';
  if (result.errors.length) failMsg += ' ' + result.errors[0];
  if (pruned > 0) failMsg += ' Removed ' + pruned + ' dead token(s).';
  return { success: false, message: failMsg, pruned: pruned };
}

function sendTestPushToDevice(actorCrewName, tokenKey, deviceOwnerCrewName) {
  if (!verifyBackendPrivilege(actorCrewName, 'ROOT')) {
    return { success: false, message: 'ROOT privileges required.' };
  }
  const owner = String(deviceOwnerCrewName || actorCrewName).trim();
  const profile = getUserSecurityProfile(owner);
  if (!profile || !profile.uid) return { success: false, message: 'Unknown user profile.' };
  const token = findFcmTokenByKey_(profile.uid, tokenKey);
  if (!token) return { success: false, message: 'Device not found — refresh the list.' };

  const result = sendFcmToTokens_(
    [token],
    '📣 Showrunner test',
    'Test push to this device only.',
    getFirebasePublicConfig().hostingUrl
  );
  let pruned = 0;
  if (result.deadTokens && result.deadTokens.length) {
    pruned = removeFcmTokensForUid_(profile.uid, result.deadTokens);
  }
  if (result.sent > 0) {
    try {
      writeToAuditLog(actorCrewName, 'UPDATE', 'NOTIFICATIONS', owner, 'Test Push Device',
        'Sent test FCM to ' + owner + ' device key ' + tokenKey);
    } catch (e) { /* optional */ }
    return { success: true, message: 'FCM accepted for ' + owner + '. If nothing appears, switch web.app to background and retry.' };
  }
  var failMsg = 'Send failed for this device.';
  if (result.errors.length) failMsg += ' ' + result.errors[0];
  if (pruned > 0) failMsg += ' Dead token removed — re-register from web.app.';
  return { success: false, message: failMsg, pruned: pruned };
}

/** Run once from Apps Script editor after deploy to grant UrlFetchApp (FCM) permission. */
function authorizeShowrunnerExternalRequests() {
  const resp = UrlFetchApp.fetch('https://www.google.com/generate_204', { muteHttpExceptions: true });
  return 'External request authorized (HTTP ' + resp.getResponseCode() + '). Push send should work now.';
}
