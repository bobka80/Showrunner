/**
 * Notifications_Dispatch.js — Event-driven push + in-app notification rows.
 */

// @INDEX: NOTIFICATIONS -> Push Dispatch

function dispatchPushToUsers(userUids, title, body, linkUrl, actor) {
  const uids = (userUids || []).filter(function(u) { return u && String(u).trim(); });
  if (!uids.length) return { sent: 0, skipped: true };

  const tokens = getFcmTokensForUids(uids);
  const pushResult = sendFcmToTokens_(tokens, title, body, linkUrl);

  writeToAuditLog(
    actor || 'System',
    'UPDATE',
    'NOTIFICATIONS',
    'PUSH',
    title || 'Push',
    'FCM sent=' + pushResult.sent + ' tokens=' + tokens.length + ' users=' + uids.length
  );
  return pushResult;
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
