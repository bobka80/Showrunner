/**
 * Notifications_Dispatch.js — Event-driven push + in-app notification rows.
 */

// @INDEX: NOTIFICATIONS -> Push Dispatch

function resolveVaultUidForPush_(identifier) {
  if (!identifier) return null;
  const id = String(identifier).trim();
  if (!id) return null;
  if (id.indexOf('UID_') === 0) return id;

  try {
    const sheets = verifyVaultSchema(true);
    const crewData = getSheetData(sheets.crew);
    const cMap = getHeaderMap(crewData);
    for (let i = 1; i < crewData.length; i++) {
      const rowUid = cMap['uid'] !== undefined ? String(crewData[i][cMap['uid']] || '').trim() : '';
      const rowEmail = cMap['Email'] !== undefined ? String(crewData[i][cMap['Email']] || '').trim().toLowerCase() : '';
      const rowName = cMap['Name'] !== undefined ? String(crewData[i][cMap['Name']] || '').trim().toLowerCase() : '';
      if (rowUid && rowUid === id) return rowUid;
      if (rowEmail && rowEmail === id.toLowerCase()) return rowUid || null;
      if (rowName && rowName === id.toLowerCase()) return rowUid || null;
    }
  } catch (e) { /* skip */ }

  // Bootstrap / ROOT accounts may not appear in Vault crew sheet — still eligible for push.
  try {
    const byName = getUserSecurityProfile(id);
    if (byName && byName.uid) return byName.uid;
    const idLower = id.toLowerCase();
    if (idLower.indexOf('@') > 0) {
      const bogdan = getUserSecurityProfile('bogdan');
      if (bogdan && bogdan.email && bogdan.email.toLowerCase() === idLower && bogdan.uid) {
        return bogdan.uid;
      }
    }
  } catch (e2) { /* skip */ }
  return null;
}

function resolveVaultUidsForPush_(identifiers) {
  const out = [];
  const seen = {};
  (identifiers || []).forEach(function(id) {
    const uid = resolveVaultUidForPush_(id);
    if (uid && !seen[uid]) {
      seen[uid] = true;
      out.push(uid);
    }
  });
  return out;
}

function excludeActorUid_(uids, actor) {
  const actorProfile = actor ? getUserSecurityProfile(actor) : null;
  const actorUid = actorProfile && actorProfile.uid ? String(actorProfile.uid).trim() : '';
  if (!actorUid) return uids;
  // ROOT stays in the push pool so the admin can self-test on registered devices.
  if (actorProfile.sysAccess === 'ROOT') return uids;
  return (uids || []).filter(function(uid) { return uid !== actorUid; });
}

function dispatchPushToUsers(userUids, title, body, linkUrl, actor) {
  const uids = excludeActorUid_((userUids || []).filter(function(u) { return u && String(u).trim(); }), actor);
  if (!uids.length) return { sent: 0, skipped: true };

  const tokens = getFcmTokensForUids(uids);
  const pushResult = sendFcmToTokens_(tokens, title, body, linkUrl);

  try {
    writeToAuditLog(
      actor || 'System',
      'UPDATE',
      'NOTIFICATIONS',
      'PUSH',
      title || 'Push',
      'FCM sent=' + pushResult.sent + ' tokens=' + tokens.length + ' users=' + uids.length
    );
  } catch (e) { /* push attempted */ }
  return pushResult;
}

function dispatchPushToIdentifiers(identifiers, title, body, linkUrl, actor) {
  const uids = resolveVaultUidsForPush_(identifiers);
  return dispatchPushToUsers(uids, title, body, linkUrl, actor);
}

function dispatchPushToCrewNames(crewNames, title, body, linkUrl, actor) {
  const uids = [];
  (crewNames || []).forEach(function(name) {
    if (!name) return;
    const profile = getUserSecurityProfile(name);
    if (profile && profile.uid) uids.push(profile.uid);
  });
  return dispatchPushToUsers(uids, title, body, linkUrl, actor);
}

function getShowrunnerHostingLink_() {
  try {
    return getFirebasePublicConfig().hostingUrl || 'https://sm-showrunner-97405.web.app';
  } catch (e) {
    return 'https://sm-showrunner-97405.web.app';
  }
}

/** Canonical vault UID for Notifications sheet rows (falls back to trimmed identifier). */
function resolveNotifUserUid_(identifier) {
  const uid = resolveVaultUidForPush_(identifier);
  if (uid) return uid;
  return String(identifier || '').trim();
}

function appendInAppNotification_(notifsSheet, recipientId, message) {
  if (!notifsSheet || !recipientId || !message) return;
  const userUid = resolveNotifUserUid_(recipientId);
  if (!userUid) return;
  const data = notifsSheet.getDataRange().getValues();
  const nMap = {};
  if (data.length > 0) data[0].forEach(function(h, i) { nMap[h.toString().trim()] = i; });
  const colCount = data.length > 0 ? data[0].length : 5;
  const r = new Array(colCount).fill('');
  const nowIso = new Date().toISOString();
  if (nMap['uid'] !== undefined) r[nMap['uid']] = Utilities.getUuid();
  if (nMap['user_uid'] !== undefined) r[nMap['user_uid']] = userUid;
  if (nMap['Message'] !== undefined) r[nMap['Message']] = message;
  if (nMap['Is_Read'] !== undefined) r[nMap['Is_Read']] = false;
  if (nMap['Timestamp'] !== undefined) r[nMap['Timestamp']] = nowIso;
  else if (colCount >= 5) {
    r[0] = Utilities.getUuid();
    r[1] = userUid;
    r[2] = message;
    r[3] = false;
    r[4] = nowIso;
  }
  notifsSheet.appendRow(r);
}

function isTruckShiftIdentifier_(id) {
  return id && String(id).toLowerCase().indexOf('truck') >= 0;
}

/** True when a stored identifier (uid, email, or crew name) belongs to this user. */
function identifierMatchesProfile_(identifier, profile, crewName) {
  const id = String(identifier || '').trim();
  if (!id) return false;
  const idLower = id.toLowerCase();
  const profUid = profile && profile.uid ? String(profile.uid).trim() : '';
  const profEmail = profile && profile.email ? String(profile.email).toLowerCase().trim() : '';
  const profName = crewName ? String(crewName).toLowerCase().trim() : '';

  if (profUid && id === profUid) return true;
  if (profEmail && idLower === profEmail) return true;
  if (profName && idLower === profName) return true;

  const resolvedId = resolveVaultUidForPush_(id);
  if (resolvedId && profUid && resolvedId === profUid) return true;

  if (profEmail) {
    const uidFromEmail = resolveVaultUidForPush_(profEmail);
    if (uidFromEmail && id === uidFromEmail) return true;
  }
  if (profName) {
    const uidFromName = resolveVaultUidForPush_(profName);
    if (uidFromName && id === uidFromName) return true;
  }

  return false;
}

function notifBelongsToProfile_(notifUserUid, profile, crewName) {
  return identifierMatchesProfile_(notifUserUid, profile, crewName);
}

function normalizeTaskAssigneeId_(identifier) {
  return resolveNotifUserUid_(identifier);
}

function isSheetTruthy_(val) {
  return val === true || String(val || '').toUpperCase() === 'TRUE';
}
