/**
 * SM Showrunner (smuruner) - Clean 8 Architecture
 * Dal_Firestore.js - Firestore REST (GAS service account — Phase 4 Slice B)
 *
 * Reuses getFirebaseServiceAccount_() from Notifications_Push.js.
 * Paths: projects/{projectId}/assets/rows/{rowUid} per design lock.
 */

// @INDEX: DAL -> Firestore REST

function dalFirestoreIsConfigured_() {
  try {
    var sa = getFirebaseServiceAccount_();
    return !!(sa && sa.client_email && sa.private_key && (sa.project_id || PropertiesService.getScriptProperties().getProperty('FIREBASE_PROJECT_ID')));
  } catch (e) {
    return false;
  }
}

function getFirestoreProjectId_() {
  var sa = getFirebaseServiceAccount_();
  return sa.project_id || PropertiesService.getScriptProperties().getProperty('FIREBASE_PROJECT_ID') || '';
}

function getFirestoreAccessToken_() {
  var cache = CacheService.getScriptCache();
  var cached = cache.get('firestore_oauth_token');
  if (cached) return cached;

  var sa = getFirebaseServiceAccount_();
  if (!sa.client_email || !sa.private_key) {
    throw new Error('Firebase service account missing — set FIREBASE_SERVICE_ACCOUNT_JSON in Script Properties.');
  }

  var now = Math.floor(Date.now() / 1000);
  var claim = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };
  var header = { alg: 'RS256', typ: 'JWT' };
  var enc = function (obj) {
    return Utilities.base64EncodeWebSafe(JSON.stringify(obj)).replace(/=+$/, '');
  };
  var toSign = enc(header) + '.' + enc(claim);
  var signature = Utilities.base64EncodeWebSafe(
    Utilities.computeRsaSha256Signature(toSign, sa.private_key)
  ).replace(/=+$/, '');
  var jwt = toSign + '.' + signature;

  var resp = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {
    method: 'post',
    contentType: 'application/x-www-form-urlencoded',
    payload: {
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    },
    muteHttpExceptions: true
  });
  var data = JSON.parse(resp.getContentText());
  if (!data.access_token) {
    throw new Error('Firestore OAuth failed: ' + resp.getContentText());
  }
  var ttl = Math.max(300, Math.min(3300, (data.expires_in || 3600) - 120));
  cache.put('firestore_oauth_token', data.access_token, ttl);
  return data.access_token;
}

function firestoreApiRoot_() {
  return 'https://firestore.googleapis.com/v1/projects/' + getFirestoreProjectId_() + '/databases/(default)/documents';
}

function firestoreFetch_(method, urlPath, body) {
  var token = getFirestoreAccessToken_();
  var opts = {
    method: method,
    headers: { Authorization: 'Bearer ' + token },
    muteHttpExceptions: true
  };
  if (body) {
    opts.contentType = 'application/json';
    opts.payload = JSON.stringify(body);
  }
  var resp = UrlFetchApp.fetch(firestoreApiRoot_() + '/' + urlPath, opts);
  var code = resp.getResponseCode();
  var text = resp.getContentText();
  if (code >= 200 && code < 300) {
    return text ? JSON.parse(text) : {};
  }
  if (code === 404) return null;
  throw new Error('Firestore ' + method + ' failed (' + code + '): ' + text.slice(0, 300));
}

function firestoreEncodeValue_(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') {
    if (Number.isInteger(v)) return { integerValue: String(v) };
    return { doubleValue: v };
  }
  var s = String(v);
  if (s === '') return null;
  return { stringValue: s };
}

function firestoreDecodeValue_(field) {
  if (!field) return '';
  if (field.stringValue !== undefined) return field.stringValue;
  if (field.integerValue !== undefined) return parseInt(field.integerValue, 10);
  if (field.doubleValue !== undefined) return field.doubleValue;
  if (field.booleanValue !== undefined) return field.booleanValue;
  return '';
}

function firestoreDecodeFields_(fields) {
  var out = {};
  if (!fields) return out;
  Object.keys(fields).forEach(function (k) {
    out[k] = firestoreDecodeValue_(fields[k]);
  });
  return out;
}

function firestoreEncodeFields_(obj) {
  var fields = {};
  Object.keys(obj || {}).forEach(function (k) {
    var enc = firestoreEncodeValue_(obj[k]);
    if (enc) fields[k] = enc;
  });
  return fields;
}

function firestoreDocIdFromName_(name) {
  if (!name) return '';
  var parts = String(name).split('/');
  return parts[parts.length - 1];
}

function firestoreListCollection_(collectionPath) {
  var result = firestoreFetch_('get', collectionPath);
  if (!result || !result.documents) return [];
  return result.documents.map(function (doc) {
    var plain = firestoreDecodeFields_(doc.fields);
    plain._docId = firestoreDocIdFromName_(doc.name);
    return plain;
  });
}

function firestoreWriteDocument_(docPath, obj) {
  var parts = docPath.split('/');
  var docId = parts.pop();
  var parentPath = parts.join('/');
  var got = firestoreFetch_('get', docPath);
  var fields = firestoreEncodeFields_(obj);
  if (got && got.fields) {
    firestoreFetch_('patch', docPath, { fields: fields });
  } else {
    firestoreFetch_('post', parentPath + '?documentId=' + encodeURIComponent(docId), { fields: fields });
  }
}

function firestoreDeleteDocument_(docPath) {
  try {
    firestoreFetch_('delete', docPath);
  } catch (e) {
    if (String(e.message).indexOf('404') === -1) throw e;
  }
}

function firestoreDeleteCollection_(collectionPath) {
  var docs = firestoreListCollection_(collectionPath);
  docs.forEach(function (doc) {
    firestoreDeleteDocument_(collectionPath + '/' + doc._docId);
  });
}

function firestoreSetSessionMeta_(projectId, meta) {
  firestoreWriteDocument_('projects/' + projectId + '/assets/_meta', meta);
}

function firestoreGetSessionMeta_(projectId) {
  var doc = firestoreFetch_('get', 'projects/' + projectId + '/assets/_meta');
  if (!doc || !doc.fields) return null;
  return firestoreDecodeFields_(doc.fields);
}
