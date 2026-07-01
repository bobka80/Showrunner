/**
 * SM Showrunner (smuruner) - Clean 8 Architecture
 * Main.gs - Routing, Global Includes, and Software Summary
 */

// @INDEX: ROUTING -> Firebase public config (fcfg endpoint)
function sanitizeFirebaseVapidKey_(raw) {
  if (!raw) return '';
  return String(raw).trim().replace(/^["']|["']$/g, '').replace(/\s+/g, '');
}

function isValidFirebaseVapidKey_(key) {
  if (!key) return false;
  if (key.indexOf('AIza') === 0) return false;
  if (key.length < 80 || key.length > 200) return false;
  return /^[A-Za-z0-9_-]+$/.test(key);
}

function getStationAppUrl_() {
  const hosting = getFirebasePublicConfig().hostingUrl || 'https://sm-showrunner-97405.web.app';
  return String(hosting).replace(/\/$/, '') + '/station-app?install=1';
}

function applyLoginTemplateDefaults_(loginTemplate) {
  loginTemplate.scriptUrl = ScriptApp.getService().getUrl();
  loginTemplate.stationAppUrl = getStationAppUrl_();
}

function getFirebasePublicConfig() {
  const p = PropertiesService.getScriptProperties();
  const projectId = p.getProperty('FIREBASE_PROJECT_ID') || 'sm-showrunner-97405';
  const gasUrl = ScriptApp.getService().getUrl();
  let webCfg = {};
  const webCfgRaw = p.getProperty('FIREBASE_WEB_CONFIG');
  if (webCfgRaw) {
    try { webCfg = JSON.parse(webCfgRaw); } catch (e) { /* ignore */ }
  }
  const defaults = (projectId === 'sm-showrunner-97405')
    ? { messagingSenderId: '729666442966', appId: '1:729666442966:web:3481078f7d39b4e6701b77' }
    : {};
  const vapidKey = sanitizeFirebaseVapidKey_(
    p.getProperty('FIREBASE_VAPID_KEY') || webCfg.vapidKey || ''
  );
  return {
    apiKey: p.getProperty('FIREBASE_WEB_API_KEY') || p.getProperty('FIREBASE_API_KEY') || webCfg.apiKey || '',
    authDomain: p.getProperty('FIREBASE_AUTH_DOMAIN') || webCfg.authDomain || (projectId + '.firebaseapp.com'),
    projectId: projectId,
    storageBucket: p.getProperty('FIREBASE_STORAGE_BUCKET') || webCfg.storageBucket || (projectId + '.firebasestorage.app'),
    messagingSenderId: p.getProperty('FIREBASE_MESSAGING_SENDER_ID') || webCfg.messagingSenderId || defaults.messagingSenderId || '',
    appId: p.getProperty('FIREBASE_APP_ID') || webCfg.appId || defaults.appId || '',
    vapidKey: vapidKey,
    vapidKeyValid: isValidFirebaseVapidKey_(vapidKey),
    gasExecUrl: gasUrl,
    hostingUrl: p.getProperty('FIREBASE_HOSTING_URL') || ('https://' + projectId + '.web.app')
  };
}

// @INDEX: ROUTING -> Web App Get/Post
function doGet(e) {
  e = e || {};
  const action = (e.parameter && e.parameter.action) ? String(e.parameter.action) : '';
  if (action === 'fcfg') {
    try {
      const cfg = getFirebasePublicConfig();
      const json = JSON.stringify(cfg);
      const callback = e.parameter.callback;
      if (callback) {
        return ContentService.createTextOutput(String(callback) + '(' + json + ');')
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      }
      return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      const payload = JSON.stringify({ error: (err && err.message) ? err.message : String(err) });
      const callback = e.parameter.callback;
      if (callback) {
        return ContentService.createTextOutput(String(callback) + '(' + payload + ');')
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      }
      return ContentService.createTextOutput(payload).setMimeType(ContentService.MimeType.JSON);
    }
  }

  if (action === 'fcmreg') {
    const nonce = e.parameter.nonce || '';
    const token = e.parameter.token || '';
    const label = e.parameter.label || 'web-hosting';
    const result = completeFcmRegistrationViaBridge_(nonce, token, label, e.parameter.meta || '');
    const json = JSON.stringify(result);
    const callback = e.parameter.callback;
    if (callback) {
      return ContentService.createTextOutput(String(callback) + '(' + json + ');')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'fcmregkey') {
    const result = completeFcmRegistrationViaKey_(
      e.parameter.key || '',
      e.parameter.token || '',
      e.parameter.label || 'web-hosting',
      e.parameter.meta || ''
    );
    const json = JSON.stringify(result);
    const callback = e.parameter.callback;
    if (callback) {
      return ContentService.createTextOutput(String(callback) + '(' + json + ');')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'fcmcheck') {
    const result = verifyFcmTokenSavedForKey_(e.parameter.key || '', e.parameter.tp || '');
    const json = JSON.stringify(result);
    const callback = e.parameter.callback;
    if (callback) {
      return ContentService.createTextOutput(String(callback) + '(' + json + ');')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'fcmrefreshkey') {
    const result = refreshFcmRegistrationKeyFromOld_(e.parameter.oldkey || '');
    const json = JSON.stringify(result);
    const callback = e.parameter.callback;
    if (callback) {
      return ContentService.createTextOutput(String(callback) + '(' + json + ');')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'sessioncheck') {
    const result = checkUserSessionStatus_(e.parameter.token || '');
    const json = JSON.stringify(result);
    const callback = e.parameter.callback;
    if (callback) {
      return ContentService.createTextOutput(String(callback) + '(' + json + ');')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'fcmping') {
    const result = pingFcmDeviceForCrew_(e.parameter.crew || '', e.parameter.tp || '');
    const json = JSON.stringify(result);
    const callback = e.parameter.callback;
    if (callback) {
      return ContentService.createTextOutput(String(callback) + '(' + json + ');')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'sessionboot') {
    const sessionToken = e.parameter.token || '';
    const crewName = validateUserSession_(sessionToken);
    if (!crewName) {
      let loginTemplate = HtmlService.createTemplateFromFile('Login');
      applyLoginTemplateDefaults_(loginTemplate);
      loginTemplate.errorMsg = 'Session expired — please log in again.';
      loginTemplate.clearSession = true;
      return loginTemplate.evaluate()
        .setTitle('System Login')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }
    const authResult = getAuthBundleForCrewName_(crewName);
    if (!authResult.success) {
      revokeUserSession_(sessionToken);
      let loginTemplate = HtmlService.createTemplateFromFile('Login');
      applyLoginTemplateDefaults_(loginTemplate);
      loginTemplate.errorMsg = authResult.error || 'Account not found.';
      loginTemplate.clearSession = true;
      return loginTemplate.evaluate()
        .setTitle('System Login')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }
    return renderIndexForAuth_(authResult, sessionToken);
  }

  let loginTemplate = HtmlService.createTemplateFromFile('Login');
  applyLoginTemplateDefaults_(loginTemplate);
  loginTemplate.errorMsg = "none";
  loginTemplate.clearSession = false;
  return loginTemplate.evaluate().setTitle('System Login').addMetaTag('viewport', 'width=device-width, initial-scale=1').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  e = e || {};
  const action = (e.parameter && e.parameter.action) ? String(e.parameter.action) : '';
  if (action === 'fcmreg') {
    const result = completeFcmRegistrationViaBridge_(
      e.parameter.nonce || '',
      e.parameter.token || '',
      e.parameter.label || 'web-hosting',
      e.parameter.meta || ''
    );
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }
  if (action === 'fcmregkey') {
    const result = completeFcmRegistrationViaKey_(
      e.parameter.key || '',
      e.parameter.token || '',
      e.parameter.label || 'web-hosting',
      e.parameter.meta || ''
    );
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }

  let crewName = e.parameter.name || "";
  let passcode = e.parameter.passcode || "";
  
  let authResult = authenticateUser(crewName, passcode); // Routed to Security.gs
  
  if (authResult.success) {
    const sessionToken = createUserSession_(authResult.name);
    return renderIndexForAuth_(authResult, sessionToken);
  }
  
  // INCORRECT CREDENTIALS ROUTE
  let loginTemplate = HtmlService.createTemplateFromFile('Login');
  applyLoginTemplateDefaults_(loginTemplate);
  loginTemplate.errorMsg = authResult.error;
  loginTemplate.clearSession = true;
  
  return loginTemplate.evaluate()
    .setTitle('System Login')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function renderIndexForAuth_(authResult, sessionToken) {
  let template = HtmlService.createTemplateFromFile('Index');
  template.userName = authResult.name;
  template.userAccess = normalizeAccessTier(authResult.access);
  template.userUid = authResult.uid || '';
  template.userEmail = authResult.email || '';
  template.showSettingsNav = accessTierAtLeastValue(template.userAccess, 'MANAGER');
  template.userPermissionsB64 = Utilities.base64Encode(JSON.stringify(authResult.permissions || {}));
  template.fcmRegKey = createFcmRegistrationKey_(authResult.name);
  template.sessionToken = sessionToken || '';
  template.isStationDevice = authResult.isStationDevice ? '1' : '0';
  template.stationDeviceLayout = authResult.stationDeviceLayout || '';
  return template.evaluate()
    .setTitle('SM Showrunner Command Center')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ==========================================
// --- HIGH SPEED PAYLOAD ENGINES ---
// ==========================================
// @INDEX: PAYLOAD -> High Speed Boot Payload
function getBootPayload(crewName) {
  IS_READ_ONLY_EXECUTION = true;
  const profile = getUserSecurityProfile(crewName);
  let projects = getExistingProjects();
  let monthData = getGlobalMonthData(projects);
  
  let conflicts = getActiveConflicts();

  const filtered = applyShiftCalendarFilter(profile, projects, monthData, conflicts);
  projects = filtered.projects;
  monthData = filtered.monthData;
  conflicts = filtered.conflicts;
  let extras = getTasksAndNotifs(crewName);

  return {
    directory: getSystemDirectory(),
    settings: getSystemSettings(),
    visuals: {
      timeline: getModuleVisualSettings('timeline', 'current'),
      cal: getModuleVisualSettings('cal', 'current'),
      mini: getModuleVisualSettings('mini', 'current'),
      mr: getModuleVisualSettings('mr', 'current'),
      asset: getModuleVisualSettings('asset', 'current'),
      projectAsset: getModuleVisualSettings('projectAsset', 'current'),
      legacy: getVaultAsset('visual_settings_1', getVaultAsset('visual_settings', null))
    },
    managerConfig: getManagerConfig(crewName),
    projects: projects,
    monthData: monthData,
    tasks: extras.tasks,
    notifs: extras.notifs,
    conflicts: conflicts,
    fcmRegKey: createFcmRegistrationKey_(crewName)
  };
}

function getRefreshPayload(crewName) {
  IS_READ_ONLY_EXECUTION = true;
  const profile = getUserSecurityProfile(crewName);
  let projects = getExistingProjects();
  let monthData = getGlobalMonthData(projects);
  
  let conflicts = getActiveConflicts();

  const filtered = applyShiftCalendarFilter(profile, projects, monthData, conflicts);
  projects = filtered.projects;
  monthData = filtered.monthData;
  conflicts = filtered.conflicts;
  let extras = getTasksAndNotifs(crewName);

  return { projects: projects, monthData: monthData, managerConfig: getManagerConfig(crewName), tasks: extras.tasks, notifs: extras.notifs, conflicts: conflicts };
}

/** Fast path for task drawer + notification list only (avoids full calendar payload). */
function getTasksNotifsPayload(crewName) {
  IS_READ_ONLY_EXECUTION = true;
  return getTasksAndNotifs(crewName);
}