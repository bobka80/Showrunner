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

function sendFcmToTokens_(tokens, title, body, linkUrl) {
  const list = (tokens || []).filter(function(t) { return t && String(t).length > 20; });
  if (!list.length) return { sent: 0, errors: ['No FCM tokens registered.'] };

  const sa = getFirebaseServiceAccount_();
  const projectId = sa.project_id || PropertiesService.getScriptProperties().getProperty('FIREBASE_PROJECT_ID');
  if (!projectId) throw new Error('FIREBASE_PROJECT_ID missing.');

  const accessToken = getFirebaseAccessToken_();
  const url = 'https://fcm.googleapis.com/v1/projects/' + projectId + '/messages:send';
  const hosting = PropertiesService.getScriptProperties().getProperty('FIREBASE_HOSTING_URL')
    || ('https://' + projectId + '.web.app');
  const clickLink = linkUrl || hosting;

  let sent = 0;
  const errors = [];
  list.forEach(function(token) {
    const payload = {
      message: {
        token: token,
        notification: {
          title: title || 'Showrunner',
          body: body || ''
        },
        webpush: {
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
      errors.push(resp.getContentText());
    }
  });
  return { sent: sent, errors: errors };
}

function sendTestPushNotification(crewName) {
  if (!verifyBackendPrivilege(crewName, 'ROOT')) {
    return { success: false, message: 'ROOT privileges required.' };
  }
  const token = getFcmTokenForUser(crewName);
  if (!token) {
    return { success: false, message: 'No FCM token for this user. Open ' + (getFirebasePublicConfig().hostingUrl || 'the Hosting URL') + ', allow notifications, and log in.' };
  }
  const result = sendFcmToTokens_(
    [token],
    'Showrunner test',
    'Push notifications are working.',
    getFirebasePublicConfig().hostingUrl
  );
  if (result.sent > 0) {
    writeToAuditLog(crewName, 'UPDATE', 'NOTIFICATIONS', crewName, 'Test Push', 'Sent test FCM notification.');
    return { success: true, message: 'Test push sent to your registered device.' };
  }
  return { success: false, message: 'Send failed: ' + (result.errors[0] || 'unknown error') };
}

/** Run once from Apps Script editor after deploy to grant UrlFetchApp (FCM) permission. */
function authorizeShowrunnerExternalRequests() {
  const resp = UrlFetchApp.fetch('https://www.google.com/generate_204', { muteHttpExceptions: true });
  return 'External request authorized (HTTP ' + resp.getResponseCode() + '). Push send should work now.';
}
