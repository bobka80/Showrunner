/**
 * SM Showrunner - Security.gs (Decoupled RBAC)
 */

// Helper to dynamically map column headers to array indices (resilient to spaces and casing)
function getHeaderMap(dataMatrix) {
  let map = {};
  if (dataMatrix && dataMatrix.length > 0) {
    dataMatrix[0].forEach((header, index) => {
        let raw = header.toString().trim();
        map[raw] = index; // Keep original
        map[raw.toLowerCase()] = index; // Lowercase
        map[raw.toLowerCase().replace(/[\s_]+/g, '')] = index; // Normalized (no spaces/underscores)
    });
    
    // Add explicitly normalized fallbacks for system properties
    map['Role_ID'] = map['roleid'] !== undefined ? map['roleid'] : map['Role_ID'];
    map['Role_Name'] = map['rolename'] !== undefined ? map['rolename'] : map['Role_Name'];
    map['sysAccess'] = map['sysaccess'] !== undefined ? map['sysaccess']
      : (map['System_Access'] !== undefined ? map['System_Access'] : map['sysAccess']);
    map['System_Access'] = map['sysaccess'] !== undefined ? map['sysaccess']
      : (map['System_Access'] !== undefined ? map['System_Access'] : map['sysAccess']);
    map['Name'] = map['name'] !== undefined ? map['name'] : map['crewname'] !== undefined ? map['crewname'] : map['Name'];
    map['Passcode'] = map['passcode'] !== undefined ? map['passcode'] : map['password'] !== undefined ? map['password'] : map['Passcode'];
    map['uid'] = map['uid'] !== undefined ? map['uid'] : (map['UID'] !== undefined ? map['UID'] : map['Uid']);
  }
  return map;
}

function getSheetCell(row, colMap, key) {
  if (colMap[key] === undefined || row[colMap[key]] == null) return "";
  return row[colMap[key]].toString().trim();
}

const IAM_PERMISSION_KEYS = [
  'Is_Tunneling', 'db_view_assets', 'db_edit_assets', 'db_delete_assets',
  'db_view_vehicles', 'db_view_warehouses', 'db_view_clients',
  'event_create_standard', 'event_create_crossrent', 'event_edit_timeline', 'event_assets_window',
  'event_view_pricing', 'view_month_roster', 'view_logistics', 'task_manage_global', 'task_manage_personal', 'task_view_all',
  'hr_view_rates', 'fin_view_roi', 'fin_view_internal'
];

function isTruthyCell(val) {
  return val === true || val === 'TRUE' || val === 'true' || val === 1 || val === '1';
}

const ACCESS_TIER_ORDER = ['CREW', 'EDITOR', 'MANAGER', 'ADMIN', 'ROOT'];

function normalizeAccessTier(tier) {
  if (tier == null || tier === '') return 'CREW';
  const raw = tier.toString().trim();
  const upper = raw.toUpperCase();
  if (ACCESS_TIER_ORDER.indexOf(upper) !== -1) return upper;
  const titled = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  const titleMap = { Crew: 'CREW', Editor: 'EDITOR', Manager: 'MANAGER', Admin: 'ADMIN', Root: 'ROOT' };
  if (titleMap[titled]) return titleMap[titled];
  return 'CREW';
}

function accessTierRank(tier) {
  const idx = ACCESS_TIER_ORDER.indexOf(normalizeAccessTier(tier));
  return idx === -1 ? 1 : idx + 1;
}

function accessTierAtLeastValue(tier, minTier) {
  return accessTierRank(tier) >= accessTierRank(minTier);
}

function resolveCrewSysAccess(crewName, crewData, roleData, cMap, rMap) {
  if (!crewName) return null;
  const target = crewName.toLowerCase().trim();
  for (let i = 0; i < crewData.length; i++) {
    let mappedName = cMap['Name'] !== undefined ? crewData[i][cMap['Name']] : undefined;
    let hardName = crewData[i][2];
    let dbNameRaw = mappedName || hardName;
    let dbName = dbNameRaw ? dbNameRaw.toString().toLowerCase().trim() : "";
    if (dbName !== target) continue;

    let sysAccess = crewData[i][cMap['System_Access']] ? crewData[i][cMap['System_Access']].toString().trim() : "";
    let roleId = crewData[i][cMap['Role_ID']] ? crewData[i][cMap['Role_ID']].toString().trim() : "";
    if (roleId !== "") {
      for (let r = 1; r < roleData.length; r++) {
        if (crewRoleRefMatchesRow(roleId, roleData[r], rMap)) {
          const roleSys = getSheetCell(roleData[r], rMap, 'sysAccess');
          if (roleSys) sysAccess = roleSys;
          break;
        }
      }
    }
    return normalizeAccessTier(sysAccess);
  }
  return null;
}

function resolveCrewPermissionBundle(crewName, crewData, roleData, cMap, rMap) {
  if (!crewName) return {};
  const target = crewName.toLowerCase().trim();
  for (let i = 0; i < crewData.length; i++) {
    let mappedName = cMap['Name'] !== undefined ? crewData[i][cMap['Name']] : undefined;
    let hardName = crewData[i][2];
    let dbNameRaw = mappedName || hardName;
    let dbName = dbNameRaw ? dbNameRaw.toString().toLowerCase().trim() : "";
    if (dbName !== target) continue;

    let bundle = {};
    let roleId = crewData[i][cMap['Role_ID']] ? crewData[i][cMap['Role_ID']].toString().trim() : "";
    if (roleId !== "") {
      for (let r = 1; r < roleData.length; r++) {
        if (crewRoleRefMatchesRow(roleId, roleData[r], rMap)) {
          bundle = loadRolePermissionsBundle(roleData[r], rMap);
          break;
        }
      }
    }
    if (dbName === 'bogdan') {
      bundle.db_view_assets = true;
      bundle.db_view_vehicles = true;
      bundle.db_view_warehouses = true;
      bundle.db_view_clients = true;
      bundle.db_edit_assets = true;
      bundle.db_delete_assets = true;
    }
    return bundle;
  }
  return {};
}

function loadRolePermissionsBundle(roleRow, rMap) {
  let bundle = {};
  IAM_PERMISSION_KEYS.forEach(k => {
    if (k === 'Is_Tunneling') return;
    if (rMap[k] !== undefined) bundle[k] = isTruthyCell(roleRow[rMap[k]]);
  });
  // View Assets: allow manage actions unless "Manage Assets" is explicitly turned off
  if (bundle.db_view_assets) {
    const editCol = rMap['db_edit_assets'];
    const editVal = editCol !== undefined ? roleRow[editCol] : null;
    const manageExplicitlyOff = editVal === false || editVal === 'FALSE' || editVal === 'false' || editVal === 0 || editVal === '0';
    if (!manageExplicitlyOff) {
      bundle.db_edit_assets = true;
      bundle.db_delete_assets = true;
    }
  }
  if (bundle.db_edit_assets) bundle.db_delete_assets = true;
  return bundle;
}

function getRoleRowFields(row, rMap) {
  const rId = getSheetCell(row, rMap, 'Role_ID');
  const rName = getSheetCell(row, rMap, 'Role_Name');
  const legacyUid = getSheetCell(row, rMap, 'uid');
  const displayName = rName || rId;
  const vaultKey = rId || legacyUid;
  return { rId, rName, displayName, vaultKey, legacyUid };
}

function crewRoleRefMatchesRow(crewRoleRef, row, rMap) {
  if (!crewRoleRef) return false;
  const f = getRoleRowFields(row, rMap);
  const key = crewRoleRef.toString().trim().toLowerCase();
  return (f.rId && f.rId.toLowerCase() === key)
    || (f.rName && f.rName.toLowerCase() === key)
    || (f.legacyUid && f.legacyUid.toLowerCase() === key);
}

function normalizeCrewRoleId(roleRef, roleData, rMap) {
  if (!roleRef) return "";
  const incoming = roleRef.toString().trim();
  for (let i = 1; i < roleData.length; i++) {
    if (crewRoleRefMatchesRow(incoming, roleData[i], rMap)) {
      return getRoleRowFields(roleData[i], rMap).vaultKey;
    }
  }
  return incoming;
}

// Resolves a crew Role_ID reference (uuid or logic key) to the human-readable role name.
function resolveRoleDisplayName(roleRef, roleData, rMap) {
  if (!roleRef) return "";
  for (let i = 1; i < roleData.length; i++) {
    if (crewRoleRefMatchesRow(roleRef, roleData[i], rMap)) {
      return getRoleRowFields(roleData[i], rMap).displayName;
    }
  }
  return roleRef.toString().trim();
}

function buildRoleDirectory(roleData, rMap) {
  let rolesList = [];
  let roleMap = {};
  for (let i = 1; i < roleData.length; i++) {
    const f = getRoleRowFields(roleData[i], rMap);
    if (!f.rId && !f.rName) continue;
    if (f.rId) roleMap[f.rId.toLowerCase()] = f.displayName;
    if (f.rName) roleMap[f.rName.toLowerCase()] = f.displayName;
    if (f.legacyUid) roleMap[f.legacyUid.toLowerCase()] = f.displayName;
    let entry = {
      id: f.rId,
      key: f.vaultKey,
      name: f.displayName,
      sysAccess: normalizeAccessTier(getSheetCell(roleData[i], rMap, 'sysAccess'))
    };
    IAM_PERMISSION_KEYS.forEach(k => {
      if (rMap[k] !== undefined) entry[k] = isTruthyCell(roleData[i][rMap[k]]);
    });
    if (rMap['is_station_device'] !== undefined) {
      entry.is_station_device = isTruthyCell(roleData[i][rMap['is_station_device']]);
    }
    if (rMap['station_device_layout'] !== undefined) {
      entry.station_device_layout = roleData[i][rMap['station_device_layout']] || '';
    }
    rolesList.push(entry);
  }
  return { rolesList, roleMap };
}

// ==========================================
// --- DYNAMIC TIER 1 & TIER 2 SECURITY PROXY ---
// ==========================================
// @INDEX: SECURITY -> User Authentication

function authenticateUser(crewName, passcode) {
  return executeWithRetry(() => {
    const sheets = verifyVaultSchema(true); 
    const crewData = getSheetData(sheets.crew);
    const roleData = getSheetData(sheets.roles);
    const cMap = getHeaderMap(crewData);
    const rMap = getHeaderMap(roleData);
    
    let debugLog = [];
    
    // Start at i=0 in case they don't have headers at all
    for (let i = 0; i < crewData.length; i++) {
      let mappedName = cMap['Name'] !== undefined ? crewData[i][cMap['Name']] : undefined;
      let mappedPass = cMap['Passcode'] !== undefined ? crewData[i][cMap['Passcode']] : undefined;
      
      // The user explicitly stated: Name is col 3 (index 2), Passcode is col 8 (index 7)
      let hardName = crewData[i][2];
      let hardPass = crewData[i][7];
      
      let dbNameRaw = mappedName || hardName;
      let dbPassRaw = mappedPass || hardPass;
      
      // If mappedPass is empty but hardPass has data, prioritize hardPass
      if ((!mappedPass || mappedPass.toString().trim() === "") && hardPass && hardPass.toString().trim() !== "") {
          dbPassRaw = hardPass;
      }
      if ((!mappedName || mappedName.toString().trim() === "") && hardName && hardName.toString().trim() !== "") {
          dbNameRaw = hardName;
      }
      
      let dbName = dbNameRaw ? dbNameRaw.toString().toLowerCase().trim() : "";
      let sysAccess = crewData[i][cMap['System_Access']] ? crewData[i][cMap['System_Access']].toString().toUpperCase().trim() : "";
      let roleId = crewData[i][cMap['Role_ID']] ? crewData[i][cMap['Role_ID']].toString().trim() : "";
      let dbPass = dbPassRaw ? dbPassRaw.toString().trim() : "";
      
      if (i === 1 || i === 0) {
          debugLog.push(`Row ${i} Name: '${dbName}', Pass: '${dbPass}'`);
      }
      
      if (dbName === crewName.toLowerCase().trim() && dbPass === passcode.trim()) {
        return buildAuthBundleFromCrewRow_(crewData, i, cMap, roleData, rMap);
      }
    }
    
    let headerKeys = Object.keys(cMap).filter(k => k.length > 0 && !k.includes(' ')).join(', ');
    return { success: false, error: `Login Failed. Checked ${crewData.length - 1} rows. Input: '${crewName}'/'${passcode}'. Headers: [${headerKeys}]. ` + debugLog.join(' | ') };
  });
}

/** Desktop lock: verify 2-char prefix or full 6-char PIN (session stays on success). */
function verifyDesktopLockUnlock(crewName, code, mode) {
  return executeWithRetry(() => {
    const trimmedName = String(crewName || '').toLowerCase().trim();
    const sheets = verifyVaultSchema(true);
    const crewData = getSheetData(sheets.crew);
    const cMap = getHeaderMap(crewData);

    for (let i = 0; i < crewData.length; i++) {
      let mappedName = cMap['Name'] !== undefined ? crewData[i][cMap['Name']] : undefined;
      let mappedPass = cMap['Passcode'] !== undefined ? crewData[i][cMap['Passcode']] : undefined;
      let hardName = crewData[i][2];
      let hardPass = crewData[i][7];
      let dbNameRaw = mappedName || hardName;
      let dbPassRaw = mappedPass || hardPass;
      if ((!mappedPass || mappedPass.toString().trim() === '') && hardPass && hardPass.toString().trim() !== '') {
        dbPassRaw = hardPass;
      }
      if ((!mappedName || mappedName.toString().trim() === '') && hardName && hardName.toString().trim() !== '') {
        dbNameRaw = hardName;
      }
      let dbName = dbNameRaw ? dbNameRaw.toString().toLowerCase().trim() : '';
      let dbPass = dbPassRaw ? dbPassRaw.toString().trim() : '';
      if (dbName !== trimmedName || !dbPass) continue;

      if (mode === 'prefix') {
        const prefix = String(code || '').substring(0, 2);
        if (prefix.length < 2) return { success: false };
        return { success: dbPass.substring(0, 2) === prefix };
      }
      return { success: dbPass === String(code || '').trim() };
    }
    return { success: false };
  });
}

/** Desktop lock: first 2 PIN chars for local quick-unlock (logged-in screensaver only). */
function getDesktopLockPrefix(crewName) {
  return executeWithRetry(() => {
    const trimmedName = String(crewName || '').toLowerCase().trim();
    const sheets = verifyVaultSchema(true);
    const crewData = getSheetData(sheets.crew);
    const cMap = getHeaderMap(crewData);

    for (let i = 0; i < crewData.length; i++) {
      let mappedName = cMap['Name'] !== undefined ? crewData[i][cMap['Name']] : undefined;
      let mappedPass = cMap['Passcode'] !== undefined ? crewData[i][cMap['Passcode']] : undefined;
      let hardName = crewData[i][2];
      let hardPass = crewData[i][7];
      let dbNameRaw = mappedName || hardName;
      let dbPassRaw = mappedPass || hardPass;
      if ((!mappedPass || mappedPass.toString().trim() === '') && hardPass && hardPass.toString().trim() !== '') {
        dbPassRaw = hardPass;
      }
      if ((!mappedName || mappedName.toString().trim() === '') && hardName && hardName.toString().trim() !== '') {
        dbNameRaw = hardName;
      }
      let dbName = dbNameRaw ? dbNameRaw.toString().toLowerCase().trim() : '';
      let dbPass = dbPassRaw ? dbPassRaw.toString().trim() : '';
      if (dbName !== trimmedName || !dbPass || dbPass.length < 2) continue;
      return { prefix: dbPass.substring(0, 2) };
    }
    return { prefix: '' };
  });
}

// ==========================================
// --- 30-DAY DEVICE SESSION (Script Properties) ---
// ==========================================

const SHOWRUNNER_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const SHOWRUNNER_SESSION_PROP_PREFIX = 'SR_SESS_';
const SHOWRUNNER_SESSION_USER_PREFIX = 'SR_SESS_USER_';
const SHOWRUNNER_MAX_SESSIONS_PER_USER = 8;

function sessionUserIndexKey_(crewName) {
  return SHOWRUNNER_SESSION_USER_PREFIX + String(crewName || '').toLowerCase().trim().replace(/\s+/g, '_');
}

/** @returns {string[]} Legacy single-token values are supported. */
function parseUserSessionTokenList_(raw) {
  if (!raw) return [];
  const s = String(raw).trim();
  if (!s) return [];
  if (s.charAt(0) === '[') {
    try {
      const arr = JSON.parse(s);
      if (Array.isArray(arr)) {
        return arr.map(function(t) { return String(t || '').trim(); }).filter(function(t) { return t.length >= 20; });
      }
    } catch (e) { return []; }
  }
  if (s.length >= 20) return [s];
  return [];
}

function writeUserSessionTokenList_(props, userKey, tokens) {
  const clean = (tokens || []).filter(function(t) { return t && String(t).length >= 20; });
  if (!clean.length) props.deleteProperty(userKey);
  else props.setProperty(userKey, JSON.stringify(clean));
}

function removeTokenFromUserIndex_(props, crewName, token) {
  const userKey = sessionUserIndexKey_(crewName);
  const tokens = parseUserSessionTokenList_(props.getProperty(userKey));
  writeUserSessionTokenList_(props, userKey, tokens.filter(function(t) { return t !== token; }));
}

function addTokenToUserIndex_(props, crewName, token) {
  const userKey = sessionUserIndexKey_(crewName);
  let tokens = parseUserSessionTokenList_(props.getProperty(userKey));
  tokens = tokens.filter(function(t) { return t !== token; });
  tokens.push(token);
  while (tokens.length > SHOWRUNNER_MAX_SESSIONS_PER_USER) {
    const drop = tokens.shift();
    props.deleteProperty(SHOWRUNNER_SESSION_PROP_PREFIX + drop);
  }
  writeUserSessionTokenList_(props, userKey, tokens);
}

function buildAuthBundleFromCrewRow_(crewData, i, cMap, roleData, rMap) {
  let hardName = crewData[i][2];
  let dbNameRaw = (cMap['Name'] !== undefined ? crewData[i][cMap['Name']] : undefined) || hardName;
  let sysAccess = crewData[i][cMap['System_Access']] ? crewData[i][cMap['System_Access']].toString().toUpperCase().trim() : '';
  let roleId = crewData[i][cMap['Role_ID']] ? crewData[i][cMap['Role_ID']].toString().trim() : '';
  let bundle = {};
  let isTunneling = false;

  if (roleId !== '') {
    for (let r = 1; r < roleData.length; r++) {
      if (crewRoleRefMatchesRow(roleId, roleData[r], rMap)) {
        const roleSys = getSheetCell(roleData[r], rMap, 'sysAccess');
        if (roleSys) sysAccess = roleSys.toUpperCase();
        isTunneling = isTruthyCell(roleData[r][rMap['Is_Tunneling']]);
        bundle = loadRolePermissionsBundle(roleData[r], rMap);
        break;
      }
    }
  }

  const dbName = dbNameRaw ? dbNameRaw.toString().toLowerCase().trim() : '';
  if (dbName === 'bogdan') {
    sysAccess = 'ROOT';
    bundle.db_view_assets = true;
    bundle.db_view_vehicles = true;
    bundle.db_view_warehouses = true;
    bundle.db_view_clients = true;
    bundle.db_edit_assets = true;
    bundle.db_delete_assets = true;
  }
  bundle.task_manage_personal = true;

  let isManager = false;
  if (cMap['IsManager'] !== undefined) {
    isManager = isTruthyCell(crewData[i][cMap['IsManager']]);
  }
  bundle.task_view_all = accessTierAtLeastValue(normalizeAccessTier(sysAccess), 'MANAGER') || isManager;

  const uid = crewData[i][cMap['uid']] ? crewData[i][cMap['uid']].toString().trim() : '';
  return {
    success: true,
    name: crewData[i][cMap['Name']] || hardName,
    access: normalizeAccessTier(sysAccess),
    permissions: bundle,
    tunnelingActive: isTunneling,
    uid: uid,
    email: crewData[i][cMap['Email']] ? crewData[i][cMap['Email']].toString().trim() : ''
  };
}

function getAuthBundleForCrewName_(crewName) {
  return executeWithRetry(() => {
    const target = String(crewName || '').toLowerCase().trim();
    if (!target) return { success: false, error: 'Missing crew name.' };
    const sheets = verifyVaultSchema(true);
    const crewData = getSheetData(sheets.crew);
    const roleData = getSheetData(sheets.roles);
    const cMap = getHeaderMap(crewData);
    const rMap = getHeaderMap(roleData);

    for (let i = 0; i < crewData.length; i++) {
      let mappedName = cMap['Name'] !== undefined ? crewData[i][cMap['Name']] : undefined;
      let hardName = crewData[i][2];
      let dbNameRaw = mappedName || hardName;
      let dbName = dbNameRaw ? dbNameRaw.toString().toLowerCase().trim() : '';
      if (dbName === target) {
        return buildAuthBundleFromCrewRow_(crewData, i, cMap, roleData, rMap);
      }
    }
    if (target === 'bogdan') {
      return {
        success: true,
        name: 'Bogdan',
        access: 'ROOT',
        permissions: {
          db_view_assets: true,
          db_view_vehicles: true,
          db_view_warehouses: true,
          db_view_clients: true,
          db_edit_assets: true,
          db_delete_assets: true,
          task_manage_personal: true
        },
        tunnelingActive: false,
        uid: 'UID_BOGDAN',
        email: 'bobby@showrider.com'
      };
    }
    return { success: false, error: 'User not found.' };
  });
}

function createUserSession_(crewName) {
  const name = String(crewName || '').trim();
  if (!name) return '';
  const props = PropertiesService.getScriptProperties();
  const token = Utilities.getUuid().replace(/-/g, '');
  const expiresAt = new Date(Date.now() + SHOWRUNNER_SESSION_TTL_MS).toISOString();
  props.setProperty(SHOWRUNNER_SESSION_PROP_PREFIX + token, JSON.stringify({
    crewName: name,
    expiresAt: expiresAt
  }));
  addTokenToUserIndex_(props, name, token);
  return token;
}

function validateUserSession_(token) {
  const clean = String(token || '').trim();
  if (!clean || clean.length < 20) return null;
  const props = PropertiesService.getScriptProperties();
  const key = SHOWRUNNER_SESSION_PROP_PREFIX + clean;
  const raw = props.getProperty(key);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    if (!data || !data.crewName) {
      props.deleteProperty(key);
      return null;
    }
    if (new Date(data.expiresAt).getTime() < Date.now()) {
      props.deleteProperty(key);
      removeTokenFromUserIndex_(props, data.crewName, clean);
      return null;
    }
    data.expiresAt = new Date(Date.now() + SHOWRUNNER_SESSION_TTL_MS).toISOString();
    props.setProperty(key, JSON.stringify(data));
    return String(data.crewName).trim();
  } catch (e) {
    props.deleteProperty(key);
    return null;
  }
}

function revokeUserSession_(token) {
  const clean = String(token || '').trim();
  if (!clean) return;
  const props = PropertiesService.getScriptProperties();
  const key = SHOWRUNNER_SESSION_PROP_PREFIX + clean;
  const raw = props.getProperty(key);
  props.deleteProperty(key);
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    if (data && data.crewName) {
      removeTokenFromUserIndex_(props, data.crewName, clean);
    }
  } catch (e) { /* cleared */ }
}

function checkUserSessionStatus_(token) {
  const clean = String(token || '').trim();
  const crewName = validateUserSession_(clean);
  if (!crewName) return { valid: false, message: 'Session expired or invalid.' };
  let expiresAt = Date.now() + SHOWRUNNER_SESSION_TTL_MS;
  try {
    const raw = PropertiesService.getScriptProperties().getProperty(SHOWRUNNER_SESSION_PROP_PREFIX + clean);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && data.expiresAt) expiresAt = new Date(data.expiresAt).getTime();
    }
  } catch (e) { /* ignore */ }
  return { valid: true, crewName: crewName, expiresAt: expiresAt };
}

function assertSessionMatchesCrew_(crewName, sessionToken) {
  const cleanName = String(crewName || '').toLowerCase().trim();
  const cleanToken = String(sessionToken || '').trim();
  if (!cleanName || cleanToken.length < 20) {
    return { ok: false, message: 'Session expired. Please log in again.' };
  }
  const validated = validateUserSession_(cleanToken);
  if (!validated || validated.toLowerCase().trim() !== cleanName) {
    return { ok: false, message: 'Session expired. Please log in again.' };
  }
  return { ok: true, token: cleanToken, crewName: validated };
}

function apiLogoutSession(crewName, sessionToken) {
  const gate = assertSessionMatchesCrew_(crewName, sessionToken);
  if (!gate.ok) return { success: false, message: gate.message };
  revokeUserSession_(gate.token);
  return { success: true, message: 'Logged out.' };
}

function changeMyPasscode(crewName, sessionToken, currentPasscode, newPasscode) {
  const gate = assertSessionMatchesCrew_(crewName, sessionToken);
  if (!gate.ok) return { success: false, message: gate.message };

  const current = String(currentPasscode || '').trim();
  const next = String(newPasscode || '').trim();
  if (!/^[a-zA-Z0-9]{6}$/.test(current)) {
    return { success: false, message: 'Current PIN must be exactly 6 letters or numbers.' };
  }
  if (!/^[a-zA-Z0-9]{6}$/.test(next)) {
    return { success: false, message: 'New PIN must be exactly 6 letters or numbers.' };
  }
  if (current === next) {
    return { success: false, message: 'New PIN must be different from your current PIN.' };
  }

  const auth = authenticateUser(gate.crewName, current);
  if (!auth || !auth.success) {
    return { success: false, message: 'Current PIN is incorrect.' };
  }

  return executeWithRetry(() => {
    const sheets = verifyVaultSchema();
    const crewSheet = sheets.crew;
    const data = crewSheet.getDataRange().getValues();
    const cMap = getHeaderMap(data);
    const targetName = gate.crewName.toLowerCase().trim();
    let updated = false;

    for (let i = 1; i < data.length; i++) {
      const rowName = data[i][cMap['Name']] ? data[i][cMap['Name']].toString().toLowerCase().trim() : '';
      const hardName = data[i][2] ? data[i][2].toString().toLowerCase().trim() : '';
      if (rowName === targetName || hardName === targetName) {
        if (cMap['Passcode'] !== undefined) data[i][cMap['Passcode']] = next;
        updated = true;
        break;
      }
    }

    if (!updated) return { success: false, message: 'Account not found.' };

    crewSheet.getRange(1, 1, data.length, data[0].length).setValues(data);
    if (typeof flushCache !== 'undefined') flushCache();
    writeToAuditLog(gate.crewName, 'UPDATE', 'IAM', 'SELF', gate.crewName, 'Self-service passcode change.');
    return { success: true, message: 'PIN updated successfully.' };
  });
}

// ==========================================
// --- BACKEND RBAC GATEWAY VERIFIER ---
// ==========================================
// requiredTier = minimum sysAccess level: CREW | EDITOR | MANAGER | ADMIN | ROOT
function verifyBackendPrivilege(crewName, requiredTier) {
    if (!crewName || !requiredTier) return false;
    if (crewName.toLowerCase().trim() === 'bogdan') return true;

    const sheets = verifyVaultSchema(true);
    const crewData = getSheetData(sheets.crew);
    const roleData = getSheetData(sheets.roles);
    const cMap = getHeaderMap(crewData);
    const rMap = getHeaderMap(roleData);

    const actual = resolveCrewSysAccess(crewName, crewData, roleData, cMap, rMap);
    if (!actual) return false;
    return accessTierAtLeastValue(actual, requiredTier);
}

function verifyBackendPermission(crewName, permissionKey) {
    if (!crewName || !permissionKey) return false;
    if (crewName.toLowerCase().trim() === 'bogdan') return true;
    if (IAM_PERMISSION_KEYS.indexOf(permissionKey) === -1) return false;

    const sheets = verifyVaultSchema(true);
    const crewData = getSheetData(sheets.crew);
    const roleData = getSheetData(sheets.roles);
    const cMap = getHeaderMap(crewData);
    const rMap = getHeaderMap(roleData);
    const bundle = resolveCrewPermissionBundle(crewName, crewData, roleData, cMap, rMap);
    return bundle[permissionKey] === true;
}

const IMPLICIT_MANAGER_IAM_KEYS = [
  'event_create_standard', 'event_create_crossrent', 'event_edit_timeline', 'event_assets_window',
  'event_view_pricing', 'task_manage_global', 'task_manage_personal'
];

function effectiveBackendPermission(crewName, permissionKey) {
  if (!crewName || !permissionKey) return false;
  if (crewName.toLowerCase().trim() === 'bogdan') return true;
  if (permissionKey === 'task_manage_personal') return true;
  if (verifyBackendPrivilege(crewName, 'ROOT')) return true;
  if (verifyBackendPermission(crewName, permissionKey)) return true;
  if (IMPLICIT_MANAGER_IAM_KEYS.indexOf(permissionKey) !== -1 && verifyBackendPrivilege(crewName, 'MANAGER')) {
    return true;
  }
  return false;
}

/** Managers see every global task; crew see only assigned tasks. IAM: task_view_all (future editor split). */
function canViewAllGlobalTasks_(crewName) {
  if (!crewName) return false;
  if (crewName.toLowerCase().trim() === 'bogdan') return true;
  if (effectiveBackendPermission(crewName, 'task_manage_global')) return true;
  if (verifyBackendPrivilege(crewName, 'MANAGER')) return true;
  const profile = getUserSecurityProfile(crewName);
  return !!(profile && profile.isManager);
}

function crewHasShiftOnProject(crewName, projectId) {
  if (!crewName || !projectId) return false;
  const profile = getUserSecurityProfile(crewName);
  const uid = profile.uid;
  if (!uid) return false;
  const sheets = verifyDatabaseSchema(true);
  const shiftData = getSheetData(sheets.shifts);
  const sMap = shiftData.hMap || {};
  for (let i = 1; i < shiftData.length; i++) {
    if (String(shiftData[i][sMap['project_uid']]) !== String(projectId)) continue;
    const u = shiftData[i][sMap['user_uid']];
    if (String(u) === String(uid)) return true;
  }
  return false;
}

function assertActorCanCreateProject(actor, projectData) {
  const pType = String(projectData.type || projectData.Project_Type || projectData.Type || 'Event').toLowerCase();
  const isCrossRent = pType.indexOf('cross') !== -1;
  if (actorIsCrossRentOnlyCreator(actor)) {
    if (!isCrossRent) {
      throw new Error('🛑 PERMISSION DENIED: Cross-rent only role cannot create standard events.');
    }
    return;
  }
  if (isCrossRent) {
    if (!effectiveBackendPermission(actor, 'event_create_crossrent') && !effectiveBackendPermission(actor, 'event_create_standard')) {
      throw new Error('🛑 PERMISSION DENIED: Cannot create cross-rent events.');
    }
    return;
  }
  if (!effectiveBackendPermission(actor, 'event_create_standard')) {
    throw new Error('🛑 PERMISSION DENIED: Cannot create standard events.');
  }
}

function assertActorCanSaveProject(actor, projectData) {
  const isNew = !projectData.Project_ID;
  if (isNew) {
    assertActorCanCreateProject(actor, projectData);
    return;
  }
  if (effectiveBackendPermission(actor, 'event_create_standard') || effectiveBackendPermission(actor, 'event_create_crossrent')) return;
  if (verifyBackendPrivilege(actor, 'MANAGER')) return;
  throw new Error('🛑 PERMISSION DENIED: Cannot save project changes.');
}

function assertActorCanEditTimeline(actor) {
  if (!effectiveBackendPermission(actor, 'event_edit_timeline')) {
    throw new Error('🛑 PERMISSION DENIED: Cannot edit event timeline or phases.');
  }
}

function assertActorCanEditProjectAssets(actor) {
  if (!effectiveBackendPermission(actor, 'event_assets_window')) {
    throw new Error('🛑 PERMISSION DENIED: Cannot edit project assets.');
  }
}

function assertActorCanPerformAssetOperations(actor) {
  assertActorCanEditProjectAssets(actor);
}

function assertActorCanManageGlobalTasks(actor) {
  if (!effectiveBackendPermission(actor, 'task_manage_global')) {
    throw new Error('🛑 PERMISSION DENIED: Cannot manage global tasks.');
  }
}

function assertActorCanViewLogistics(actor) {
  if (!effectiveBackendPermission(actor, 'view_logistics')) {
    throw new Error('🛑 PERMISSION DENIED: Equipment tracker / logistics view is not enabled for your role.');
  }
}

function assertActorCanManageProject(actor) {
  if (!verifyBackendPrivilege(actor, 'MANAGER')) {
    throw new Error('🛑 PERMISSION DENIED: Manager access required for project lifecycle changes.');
  }
}

function actorIsCrossRentOnlyCreator(actor) {
  if (!actor) return false;
  return verifyBackendPermission(actor, 'event_create_crossrent')
    && !verifyBackendPermission(actor, 'event_create_standard');
}

function shouldFilterCalendarToAssignedShifts(profile) {
  if (!profile || !profile.uid) return false;
  if (profile.tunneling) return true;
  if (profile.isFreelancer) return true;
  return false;
}

function applyShiftCalendarFilter(profile, projects, monthData, conflicts) {
  if (!shouldFilterCalendarToAssignedShifts(profile) || !profile.uid) {
    return { projects: projects, monthData: monthData, conflicts: conflicts };
  }
  const uid = profile.uid;
  const filteredShifts = (monthData.shifts || []).filter(function(s) {
    return String(s.user_uid || s.email) === String(uid);
  });
  const assignedProjectIds = new Set(filteredShifts.map(function(s) { return s.projectId; }));
  const filteredProjects = (projects || []).filter(function(p) {
    return assignedProjectIds.has(p.id);
  });
  const filteredMonthData = Object.assign({}, monthData, { shifts: filteredShifts });
  let filteredConflicts = conflicts;
  if (Array.isArray(conflicts)) {
    filteredConflicts = conflicts.filter(function(c) {
      return !c.projectId || assignedProjectIds.has(c.projectId);
    });
  }
  return { projects: filteredProjects, monthData: filteredMonthData, conflicts: filteredConflicts };
}

function enforceCrossRentOnlyProjectFields_(actor, projectData) {
  if (!actorIsCrossRentOnlyCreator(actor) || !projectData) return projectData;
  projectData.Type = 'Cross Rent';
  return projectData;
}

// ==========================================
// --- USER SECURITY PROFILE EXTRACTOR ---
// ==========================================
// @INDEX: SECURITY -> User Security Profile Extractor
function getUserSecurityProfile(crewName) {
  if (!crewName) return { email: null, uid: null, tunneling: false, isFreelancer: false, isManager: false, sysAccess: 'CREW' };
  if (crewName.toLowerCase().trim() === 'bogdan') {
    return { email: 'bobby@showrider.com', uid: 'UID_BOGDAN', tunneling: false, isFreelancer: false, isManager: true, sysAccess: 'ROOT' };
  }

  const sheets = verifyVaultSchema(true);
  const crewData = getSheetData(sheets.crew);
  const roleData = getSheetData(sheets.roles);
  const cMap = getHeaderMap(crewData);
  const rMap = getHeaderMap(roleData);
  
  for (let i = 1; i < crewData.length; i++) {
    if (crewData[i][cMap['Name']] && crewData[i][cMap['Name']].toString().toLowerCase().trim() === crewName.toLowerCase().trim()) {
      let email = crewData[i][cMap['Email']] ? crewData[i][cMap['Email']].toString().trim() : null;
      let uid = crewData[i][cMap['uid']] ? crewData[i][cMap['uid']].toString().trim() : null;
      let roleId = crewData[i][cMap['Role_ID']] ? crewData[i][cMap['Role_ID']].toString().trim() : "";
      let sysAccess = crewData[i][cMap['System_Access']] ? crewData[i][cMap['System_Access']].toString().trim() : 'CREW';
      let isFreelancer = false;
      if (cMap['IsFreelancer'] !== undefined) {
        isFreelancer = isTruthyCell(crewData[i][cMap['IsFreelancer']]);
      }
      let isManager = false;
      if (cMap['IsManager'] !== undefined) {
        isManager = isTruthyCell(crewData[i][cMap['IsManager']]);
      }
      let isTunneling = false;
      for (let r = 1; r < roleData.length; r++) {
        if (crewRoleRefMatchesRow(roleId, roleData[r], rMap)) {
            isTunneling = isTruthyCell(roleData[r][rMap['Is_Tunneling']]);
            if (rMap['sysAccess'] !== undefined && roleData[r][rMap['sysAccess']]) {
              sysAccess = roleData[r][rMap['sysAccess']].toString().trim();
            }
            break;
        }
      }
      return {
        email: email,
        uid: uid,
        tunneling: isTunneling,
        isFreelancer: isFreelancer,
        isManager: isManager,
        sysAccess: normalizeAccessTier(sysAccess)
      };
    }
  }
  return { email: null, uid: null, tunneling: false, isFreelancer: false, isManager: false, sysAccess: 'CREW' };
}

// ==========================================
// --- READ MASTER ROSTER (UPDATED FOR LOGISTICS) ---
// ==========================================
function getSystemDirectory() {
  return executeWithRetry(() => {
    const sheets = verifyVaultSchema(true);
    const crewData = getSheetData(sheets.crew);
    const roleData = getSheetData(sheets.roles);
    const cMap = getHeaderMap(crewData);
    const rMap = getHeaderMap(roleData);

    let crewList = [];
    for (let i = 1; i < crewData.length; i++) {
      let row = crewData[i];
      if (row[cMap['Email']]) { 
        crewList.push({
          uid: row[cMap['uid']] ? row[cMap['uid']].toString().trim() : "",
          email: row[cMap['Email']].toString().trim(),
          name: row[cMap['Name']] ? row[cMap['Name']].toString().trim() : "",
          jobTitle: row[cMap['Job_Title']] ? row[cMap['Job_Title']].toString().trim() : "",  
          dept: row[cMap['Department']] ? row[cMap['Department']].toString().trim() : "",      
          meal: row[cMap['Meal']] ? row[cMap['Meal']].toString().trim() : "",      
          sysAccess: row[cMap['System_Access']] ? row[cMap['System_Access']].toString().trim() : "", 
          roleId: row[cMap['Role_ID']] ? row[cMap['Role_ID']].toString().trim() : "",
          roleName: "",
          payrollMultiplier: row[cMap['Payroll_Multiplier']] ? parseFloat(row[cMap['Payroll_Multiplier']]) || 1.0 : 1.0,
          passcode: ""                                       
        });
      }
    }

    const { rolesList, roleMap } = buildRoleDirectory(roleData, rMap);

    crewList.forEach(crew => {
       crew.roleName = roleMap[crew.roleId.toLowerCase()]
         || resolveRoleDisplayName(crew.roleId, roleData, rMap)
         || crew.roleId;
    });

    return {
      roles: rolesList,
      crew: crewList
    };
  });
}

function getSecureIamDirectory(adminName) {
  return executeWithRetry(() => {
    let hasAccess = verifyBackendPrivilege(adminName, "ROOT");
    if (!hasAccess) {
        const sheets = verifyVaultSchema(true);
        const data = getSheetData(sheets.crew);
        const cMap = getHeaderMap(data);
        let debugAccess = "NOT_FOUND";
        for (let i = 1; i < data.length; i++) {
           if (data[i][cMap['Name']] && data[i][cMap['Name']].toString().toLowerCase().trim() === String(adminName).toLowerCase().trim()) {
               debugAccess = data[i][cMap['System_Access']] ? data[i][cMap['System_Access']].toString().trim() : "EMPTY";
           }
        }
        return { error: `🛑 API DENIED. Debug Info -> User passed: '${adminName}'. Access found in DB: '${debugAccess}'.` };
    }
    const sheets = verifyVaultSchema(true);
    const crewData = getSheetData(sheets.crew);
    let roleData = getSheetData(sheets.roles);
    const cMap = getHeaderMap(crewData);
    let rMap = getHeaderMap(roleData);
    if (typeof ensureStationRoleColumns === 'function') {
      rMap = ensureStationRoleColumns(sheets.roles);
      roleData = sheets.roles.getDataRange().getValues();
    }
    
    let crewList = [];
    for (let i = 1; i < crewData.length; i++) {
      let row = crewData[i];
      if (row[cMap['Email']]) {
        crewList.push({
          uid: row[cMap['uid']] ? row[cMap['uid']].toString().trim() : "",
          email: row[cMap['Email']].toString().trim(), 
          name: row[cMap['Name']] ? row[cMap['Name']].toString().trim() : "", 
          jobTitle: row[cMap['Job_Title']] ? row[cMap['Job_Title']].toString().trim() : "",
          dept: row[cMap['Department']] ? row[cMap['Department']].toString().trim() : "", 
          meal: row[cMap['Meal']] ? row[cMap['Meal']].toString().trim() : "",
          sysAccess: row[cMap['System_Access']] ? row[cMap['System_Access']].toString().trim() : "", 
          roleId: row[cMap['Role_ID']] ? row[cMap['Role_ID']].toString().trim() : "",
          roleName: "",
          payrollMultiplier: row[cMap['Payroll_Multiplier']] ? parseFloat(row[cMap['Payroll_Multiplier']]) || 1.0 : 1.0,
          passcode: row[cMap['Passcode']] ? row[cMap['Passcode']].toString().trim() : ""   
        });
      }
    }
    const { rolesList, roleMap } = buildRoleDirectory(roleData, rMap);

    crewList.forEach(crew => {
       crew.roleName = roleMap[crew.roleId.toLowerCase()]
         || resolveRoleDisplayName(crew.roleId, roleData, rMap)
         || crew.roleId;
    });

    return { roles: rolesList, crew: crewList };
  });
}

function saveDirectoryUpdate(adminName, updates) {
  return executeWithRetry(() => {
    if (!verifyBackendPrivilege(adminName, "ROOT")) return { success: false, message: "🛑 API DENIED: ROOT privileges required." };
    const sheets = verifyVaultSchema();
    const crewSheet = sheets.crew;
    const roleSheet = sheets.roles;
    const roleData = roleSheet.getDataRange().getValues();
    const rMap = getHeaderMap(roleData);
    const data = crewSheet.getDataRange().getValues();
    const cMap = getHeaderMap(data);
    
    let hasChanges = false;
    let updatedUids = [];
    let auditNotes = [];

    for (let u = 0; u < updates.length; u++) {
      const update = updates[u];
      const normalizedRoleId = normalizeCrewRoleId(update.roleId, roleData, rMap);
      const newName = update.name !== undefined ? String(update.name || '').trim() : null;
      if (newName !== null && !newName) {
        return { success: false, message: "Name cannot be empty." };
      }

      let rowIndex = -1;
      for (let i = 1; i < data.length; i++) {
        if (data[i][cMap['uid']] && data[i][cMap['uid']].toString().trim() === String(update.uid || '').trim()) {
          rowIndex = i;
          break;
        }
      }
      if (rowIndex < 0) continue;

      if (newName !== null && cMap['Name'] !== undefined) {
        const targetName = newName.toLowerCase();
        for (let j = 1; j < data.length; j++) {
          if (j === rowIndex) continue;
          const otherName = data[j][cMap['Name']] ? data[j][cMap['Name']].toString().trim().toLowerCase() : '';
          if (otherName && otherName === targetName) {
            return { success: false, message: 'Another crew member already uses the name "' + newName + '".' };
          }
        }
        const oldName = data[rowIndex][cMap['Name']] ? data[rowIndex][cMap['Name']].toString().trim() : '';
        if (oldName !== newName) {
          data[rowIndex][cMap['Name']] = newName;
          auditNotes.push(oldName + ' -> ' + newName);
        }
      }

      if (cMap['Job_Title'] !== undefined) data[rowIndex][cMap['Job_Title']] = update.jobTitle;
      if (cMap['Department'] !== undefined) data[rowIndex][cMap['Department']] = update.dept;
      if (cMap['Meal'] !== undefined) data[rowIndex][cMap['Meal']] = update.meal;
      if (cMap['Role_ID'] !== undefined) data[rowIndex][cMap['Role_ID']] = normalizedRoleId;
      if (cMap['Passcode'] !== undefined) data[rowIndex][cMap['Passcode']] = update.passcode;
      if (cMap['Payroll_Multiplier'] !== undefined) data[rowIndex][cMap['Payroll_Multiplier']] = update.payrollMultiplier;
      if (cMap['uid'] !== undefined) updatedUids.push(data[rowIndex][cMap['uid']]);
      hasChanges = true;
    }

    if (hasChanges) {
        crewSheet.getRange(1, 1, data.length, data[0].length).setValues(data);
        if (typeof flushCache !== 'undefined') flushCache();
        const detail = auditNotes.length
          ? `Updated ${updates.length} user profile(s). Renamed: ${auditNotes.join('; ')}.`
          : `Updated ${updates.length} user profile(s).`;
        writeToAuditLog(adminName, "UPDATE", "IAM", "GLOBAL", updatedUids.length > 0 ? updatedUids.join(', ') : "Directory Sync", detail);
        return { success: true, message: "Vault updated successfully." };
    }
    return { success: false, message: "No matching user found to update. Please refresh and try again." };
  });
}

function saveRoleConfig(adminName, roleData) {
  return executeWithRetry(() => {
    if (!verifyBackendPrivilege(adminName, "ROOT")) return { success: false, message: "🛑 API DENIED: ROOT privileges required." };
    const sheets = verifyVaultSchema();
    const roleSheet = sheets.roles;
    const data = roleSheet.getDataRange().getValues();
    const rMap = getHeaderMap(data);

    let roleUuid = (roleData.id && roleData.id !== 'NEW') ? roleData.id.toString().trim() : Utilities.getUuid();
    let newRow = new Array(data[0].length).fill("");
    if (rMap['Role_ID'] !== undefined) newRow[rMap['Role_ID']] = roleUuid;
    if (rMap['Role_Name'] !== undefined) newRow[rMap['Role_Name']] = roleData.name;
    if (rMap['sysAccess'] !== undefined) newRow[rMap['sysAccess']] = normalizeAccessTier(roleData.sysAccess || 'CREW');
    IAM_PERMISSION_KEYS.forEach(k => {
      if (rMap[k] !== undefined) newRow[rMap[k]] = !!roleData[k];
    });
    if (rMap['db_delete_assets'] !== undefined && roleData.db_delete_assets === undefined && roleData.db_edit_assets !== undefined) {
      newRow[rMap['db_delete_assets']] = !!roleData.db_edit_assets;
    }

    for (let i = 1; i < data.length; i++) {
      if (crewRoleRefMatchesRow(roleData.id, data[i], rMap)
          || (roleData.name && getSheetCell(data[i], rMap, 'Role_Name').toLowerCase() === roleData.name.toLowerCase())) {
        let existingId = getSheetCell(data[i], rMap, 'Role_ID');
        if (existingId) newRow[rMap['Role_ID']] = existingId;
        roleSheet.getRange(i + 1, 1, 1, newRow.length).setValues([newRow]);
        if (typeof flushCache !== 'undefined') flushCache();
        writeToAuditLog(adminName, "UPDATE", "IAM_ROLES", "GLOBAL", newRow[rMap['Role_ID']], "Modified role permissions.");
        return { success: true, message: `Role '${roleData.name}' updated successfully.` };
      }
    }
    roleSheet.appendRow(newRow);
    if (typeof flushCache !== 'undefined') flushCache();
    writeToAuditLog(adminName, "CREATE", "IAM_ROLES", "GLOBAL", roleUuid, "Created new role.");
    return { success: true, message: `New Role '${roleData.name}' created successfully.` };
  });
}

function deleteRoleConfig(adminName, roleIdRef) {
  return executeWithRetry(() => {
    if (!verifyBackendPrivilege(adminName, "ROOT")) return { success: false, message: "🛑 API DENIED: ROOT privileges required." };
    const sheets = verifyVaultSchema();
    const roleSheet = sheets.roles;
    const data = roleSheet.getDataRange().getValues();
    const rMap = getHeaderMap(data);

    let keptRows = [data[0]];
    let deletedName = "";
    let deletedId = "";
    for (let i = 1; i < data.length; i++) {
      if (crewRoleRefMatchesRow(roleIdRef, data[i], rMap)) {
        deletedName = getSheetCell(data[i], rMap, 'Role_Name') || getSheetCell(data[i], rMap, 'Role_ID');
        deletedId = getSheetCell(data[i], rMap, 'Role_ID');
      } else {
        keptRows.push(data[i]);
      }
    }
    if (!deletedId && !deletedName) {
      return { success: false, message: "Role not found." };
    }
    roleSheet.clearContents();
    roleSheet.getRange(1, 1, keptRows.length, keptRows[0].length).setValues(keptRows);
    if (typeof flushCache !== 'undefined') flushCache();
    writeToAuditLog(adminName, "DELETE", "IAM_ROLES", "GLOBAL", deletedId || deletedName, `Deleted role '${deletedName}'.`);
    return { success: true, message: `Role '${deletedName}' deleted.` };
  });
}

function deleteUserFromVault(adminName, targetUid) {
  return executeWithRetry(() => {
    if (!verifyBackendPrivilege(adminName, "ROOT")) return { success: false, error: "🛑 API DENIED: ROOT privileges required." };
    const sheets = verifyVaultSchema();
    const crewSheet = sheets.crew;
    const data = crewSheet.getDataRange().getValues();
    const cMap = getHeaderMap(data);

    let keptRows = [data[0]];
    let found = false;
    for(let i=1; i<data.length; i++) {
       if(data[i][cMap['uid']] && data[i][cMap['uid']].toString() !== targetUid) {
           keptRows.push(data[i]);
       } else if (data[i][cMap['uid']] && data[i][cMap['uid']].toString() === targetUid) {
           found = true;
       }
    }
    if (found) {
       crewSheet.clearContents();
       crewSheet.getRange(1, 1, keptRows.length, keptRows[0].length).setValues(keptRows);
       if (typeof flushCache !== 'undefined') flushCache();
       writeToAuditLog(adminName, "DELETE", "IAM", "GLOBAL", targetUid, "Removed user from Vault.");
       return { success: true, message: "User deleted." };
    }
    return { success: false, error: "User not found in Vault." };
  });
}

function provisionNewUser(adminName, payload) {
  return executeWithRetry(() => {
    if (!verifyBackendPrivilege(adminName, "ROOT")) return { success: false, message: "🛑 API DENIED: ROOT privileges required." };
    const sheets = verifyVaultSchema();
    const crewSheet = sheets.crew;
    const roleSheet = sheets.roles;
    const roleData = roleSheet.getDataRange().getValues();
    const rMap = getHeaderMap(roleData);
    const data = crewSheet.getDataRange().getValues();
    const cMap = getHeaderMap(data);
    
    // --- ANTI-DUPLICATION ENGINE ---
    let targetEmail = payload.email.trim().toLowerCase();
    for (let i = 1; i < data.length; i++) {
        if (data[i][cMap['Email']] && data[i][cMap['Email']].toString().trim().toLowerCase() === targetEmail) {
            return { success: false, error: "A user with this email address already exists in the Vault." };
        }
    }
    // -------------------------------
    
    let newUid = Utilities.getUuid();
    let newRow = new Array(data[0].length).fill("");
    if(cMap['uid'] !== undefined) newRow[cMap['uid']] = newUid;
    if(cMap['Email'] !== undefined) newRow[cMap['Email']] = payload.email.trim();
    if(cMap['Name'] !== undefined) newRow[cMap['Name']] = payload.name.trim();
    if(cMap['Job_Title'] !== undefined) newRow[cMap['Job_Title']] = payload.jobTitle || "";
    if(cMap['Department'] !== undefined) newRow[cMap['Department']] = payload.department || "";
    if(cMap['Meal'] !== undefined) newRow[cMap['Meal']] = payload.meal || "";
    if(cMap['IsManager'] !== undefined) newRow[cMap['IsManager']] = false;
    if(cMap['IsFreelancer'] !== undefined) newRow[cMap['IsFreelancer']] = (payload.systemAccess === "VIEWER");
    if(cMap['Role_ID'] !== undefined) newRow[cMap['Role_ID']] = normalizeCrewRoleId(payload.roleId, roleData, rMap);
    if(cMap['Passcode'] !== undefined) newRow[cMap['Passcode']] = payload.passcode.trim();
    if(cMap['Payroll_Multiplier'] !== undefined) newRow[cMap['Payroll_Multiplier']] = payload.payrollMultiplier;
    if(cMap['OrderIndex'] !== undefined) newRow[cMap['OrderIndex']] = "";
    
    crewSheet.appendRow(newRow);
    if (typeof flushCache !== 'undefined') flushCache();
    writeToAuditLog(adminName, "CREATE", "IAM", "GLOBAL", newUid, `Provisioned new user as ${payload.roleId}.`);
    return { success: true, message: "User securely added to the Vault." };
  });
}

function getCrewSettings() {
  return executeWithRetry(() => {
    const sheets = verifyVaultSchema(true);
    const data = getSheetData(sheets.crew);
    const cMap = getHeaderMap(data);
    let roster = [];
    
    for (let i = 1; i < data.length; i++) {
      if (!data[i][cMap['Email']]) continue; 
      roster.push({
        uid: data[i][cMap['uid']] ? data[i][cMap['uid']].toString().trim() : "",
        email: data[i][cMap['Email']].toString().trim(),
        name: data[i][cMap['Name']] ? data[i][cMap['Name']].toString().trim() : "",
        defaultRole: data[i][cMap['Job_Title']] ? data[i][cMap['Job_Title']].toString().trim() : "",
        department: data[i][cMap['Department']] ? data[i][cMap['Department']].toString().trim() : "",
        meal: data[i][cMap['Meal']] ? data[i][cMap['Meal']].toString().trim() : "",
        isManager: data[i][cMap['IsManager']] === true || data[i][cMap['IsManager']] === "TRUE",
        isFreelancer: data[i][cMap['IsFreelancer']] === true || data[i][cMap['IsFreelancer']] === "TRUE",
        systemAccess: data[i][cMap['System_Access']] ? data[i][cMap['System_Access']].toString().trim() : "None", 
        mult: data[i][cMap['Payroll_Multiplier']] ? parseFloat(data[i][cMap['Payroll_Multiplier']]) || 1.0 : 1.0,
        orderIndex: Number(data[i][cMap['OrderIndex']]) || i
      });
    }
    
    roster.sort((a, b) => a.orderIndex - b.orderIndex);
    return roster;
  });
}

// ==========================================
// --- SYSTEM ADMIN: MANUAL DATABASE SYNC ---
// ==========================================

function triggerDatabaseSync(crewName) {
  return executeWithRetry(() => {
    // 1. Hard Security Check mapped directly to backend IAM engine
    if (!verifyBackendPrivilege(crewName, "ROOT")) {
      return { success: false, error: "🛑 PERMISSION DENIED: Only ROOT Admins can sync database schemas." };
    }

    // 2. Execute the Sync
    verifyDatabaseSchema(); // Builds any missing ENGINE tables
    verifyVaultSchema();    // Builds any missing VAULT tables
    if (typeof flushCache !== 'undefined') flushCache();
    
    return { success: true, message: "System matrices synchronized flawlessly." };
  });
}
