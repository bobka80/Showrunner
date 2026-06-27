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

function isTruckShiftUid_(uid) {
  return uid && String(uid).toLowerCase().indexOf('truck') !== -1;
}

function uniqueNonEmpty_(list) {
  const out = [];
  const seen = {};
  (list || []).forEach(function(v) {
    const s = v ? String(v).trim() : '';
    if (!s || seen[s]) return;
    seen[s] = true;
    out.push(s);
  });
  return out;
}

function resolveNotificationRecipientUid_(identifier) {
  const uid = resolveVaultUidForPush_(identifier);
  if (uid) return uid;
  return identifier ? String(identifier).trim() : '';
}

function excludeActorFromNotifRecipients_(identifiers, actor) {
  const actorProfile = actor ? getUserSecurityProfile(actor) : null;
  if (actorProfile && actorProfile.sysAccess === 'ROOT') return identifiers;
  const actorUid = actorProfile && actorProfile.uid ? String(actorProfile.uid).trim() : '';
  const actorEmail = actorProfile && actorProfile.email ? String(actorProfile.email).trim().toLowerCase() : '';
  const actorName = actor ? String(actor).trim().toLowerCase() : '';
  if (!actorUid && !actorEmail && !actorName) return identifiers;
  return (identifiers || []).filter(function(id) {
    const val = String(id || '').trim();
    const valLower = val.toLowerCase();
    if (actorUid && val === actorUid) return false;
    if (actorEmail && valLower === actorEmail) return false;
    if (actorName && valLower === actorName) return false;
    return true;
  });
}

function appendInAppNotifications_(identifiers, message, sheets, actor) {
  let ids = uniqueNonEmpty_(identifiers).map(function(id) {
    return resolveNotificationRecipientUid_(id);
  }).filter(function(id) { return id; });
  ids = excludeActorFromNotifRecipients_(ids, actor);
  if (!ids.length || !sheets || !sheets.notifs) return;
  const nowIso = new Date().toISOString();
  ids.forEach(function(id) {
    const r = new Array(5).fill('');
    r[0] = Utilities.getUuid();
    r[1] = id;
    r[2] = message;
    r[3] = false;
    r[4] = nowIso;
    sheets.notifs.appendRow(r);
  });
}

function analyzeTimelineShiftChanges_(deletedRows, newShifts, sMap) {
  const result = {
    newlyAddedUids: [],
    removedUids: [],
    modifiedUids: [],
    truckTimelineChanged: false
  };
  const oldUids = [];
  const newUids = [];
  const oldByUid = {};
  const newByUid = {};
  const oldTruckSigs = [];
  const newTruckSigs = [];

  function sig(start, dur, role) {
    return Number(start) + '|' + Number(dur) + '|' + String(role || '');
  }

  (deletedRows || []).forEach(function(r) {
    const uid = r[sMap['user_uid']];
    if (!uid) return;
    if (isTruckShiftUid_(uid)) {
      oldTruckSigs.push(sig(r[sMap['Start']], r[sMap['Duration']], r[sMap['Role']]));
      return;
    }
    if (oldUids.indexOf(uid) === -1) oldUids.push(uid);
    if (!oldByUid[uid]) oldByUid[uid] = [];
    oldByUid[uid].push(sig(r[sMap['Start']], r[sMap['Duration']], r[sMap['Role']]));
  });

  (newShifts || []).forEach(function(s) {
    const uid = s.user_uid || s.email;
    if (!uid) return;
    if (isTruckShiftUid_(uid)) {
      newTruckSigs.push(sig(s.start, s.duration, s.role));
      return;
    }
    if (newUids.indexOf(uid) === -1) newUids.push(uid);
    if (!newByUid[uid]) newByUid[uid] = [];
    newByUid[uid].push(sig(s.start, s.duration, s.role));
  });

  result.newlyAddedUids = newUids.filter(function(uid) { return oldUids.indexOf(uid) === -1; });
  result.removedUids = oldUids.filter(function(uid) { return newUids.indexOf(uid) === -1; });

  newUids.forEach(function(uid) {
    if (oldUids.indexOf(uid) === -1) return;
    const oldSigs = (oldByUid[uid] || []).slice().sort().join(';');
    const newSigs = (newByUid[uid] || []).slice().sort().join(';');
    if (oldSigs !== newSigs) result.modifiedUids.push(uid);
  });

  oldTruckSigs.sort();
  newTruckSigs.sort();
  if (oldTruckSigs.join(';') !== newTruckSigs.join(';')) {
    result.truckTimelineChanged = true;
  }

  return result;
}

function getProjectMeta_(projectId, sheets) {
  const indexData = sheets.index.getDataRange().getValues();
  const iMap = {};
  if (indexData.length > 0) indexData[0].forEach(function(h, i) { iMap[h.toString().trim()] = i; });
  for (let i = 1; i < indexData.length; i++) {
    if (indexData[i][iMap['uid']] === projectId) {
      return {
        name: indexData[i][iMap['Project_Name']] || 'an event',
        type: indexData[i][iMap['Project_Type']] || 'Event',
        status: indexData[i][iMap['Status']] || 'Draft'
      };
    }
  }
  return { name: 'an event', type: 'Event', status: 'Draft' };
}

function getProjectCrewIdentifiers_(projectId, sheets) {
  const shiftData = sheets.shifts.getDataRange().getValues();
  if (shiftData.length < 2) return [];
  const sMap = {};
  shiftData[0].forEach(function(h, i) { sMap[h.toString().trim()] = i; });
  const out = [];
  const seen = {};
  for (let i = 1; i < shiftData.length; i++) {
    if (shiftData[i][sMap['project_uid']] !== projectId) continue;
    const uid = shiftData[i][sMap['user_uid']];
    if (!uid || isTruckShiftUid_(uid)) continue;
    const key = String(uid).trim();
    if (!key || seen[key]) continue;
    seen[key] = true;
    out.push(resolveNotificationRecipientUid_(key) || key);
  }
  return out;
}

function getManagerIdentifiers_() {
  const roster = getCrewSettings();
  const out = [];
  const seen = {};
  roster.forEach(function(c) {
    if (!c || !c.name) return;
    try {
      if (!verifyBackendPrivilege(c.name, 'MANAGER')) return;
    } catch (e) { return; }
    const id = c.uid || c.email || c.name;
    if (!id || seen[id]) return;
    seen[id] = true;
    out.push(id);
  });
  return out;
}

function dispatchInAppAndPush_(identifiers, inAppMessage, pushTitle, pushBody, actor, sheets) {
  const ids = uniqueNonEmpty_(identifiers);
  if (!ids.length) return;
  appendInAppNotifications_(ids, inAppMessage, sheets, actor);
  try {
    dispatchPushToIdentifiers(ids, pushTitle || 'Showrunner', pushBody || inAppMessage, getShowrunnerHostingLink_(), actor);
  } catch (e) { /* in-app rows saved */ }
}

function notifyProjectCrew_(projectId, inAppMessage, pushTitle, pushBody, actor, sheets) {
  const crew = getProjectCrewIdentifiers_(projectId, sheets);
  dispatchInAppAndPush_(crew, inAppMessage, pushTitle, pushBody, actor, sheets);
}

function notifyManagers_(inAppMessage, pushTitle, pushBody, actor, sheets) {
  dispatchInAppAndPush_(getManagerIdentifiers_(), inAppMessage, pushTitle, pushBody, actor, sheets);
}

function notifyNewEventCreated_(projectId, projectName, projectType, actor, sheets) {
  const label = projectName || 'New event';
  const typeLabel = projectType || 'Event';
  const msg = '🆕 New ' + typeLabel + ': ' + label;
  notifyManagers_(msg, 'New event', typeLabel + ': ' + label, actor, sheets);
}

function notifyEventCancelled_(projectId, projectName, actor, sheets) {
  const label = projectName || 'an event';
  const crewMsg = '🚫 Event canceled: ' + label;
  const mgrMsg = '🚫 Event canceled: ' + label;
  notifyProjectCrew_(projectId, crewMsg, 'Event canceled', label, actor, sheets);
  notifyManagers_(mgrMsg, 'Event canceled', label, actor, sheets);
}
