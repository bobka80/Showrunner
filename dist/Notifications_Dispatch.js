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
