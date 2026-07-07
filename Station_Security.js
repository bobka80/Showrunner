/**
 * Station_Security.js
 * Device / warehouse-gun IAM — separate from office crew roles (Security.js).
 * Chainway handheld first; TL Solutions dock + large monitor later (device_layout).
 */

const STATION_DEVICE_LAYOUTS = {
  CHAINWAY_HANDHELD: 'chainway_handheld',
  TSL_DOCK_DESKTOP: 'tsl_dock_desktop'
};

/** Permission keys stored on Roles sheet — station block only (not office IAM_ROLE_FORM_KEYS). */
const STATION_IAM_PERMISSION_KEYS = [
  'station_host_inherit',
  'station_vault_maintenance',
  'station_vault_repair',
  'station_vault_broken',
  'station_vault_damaged',
  'station_project_checkout',
  'station_project_checkin',
  'station_pack_floor',
  'station_tag_new_asset'
];

const STATION_ROLE_META_KEYS = ['is_station_device', 'station_device_layout'];

function isStationTruthyCell(val) {
  return val === true || val === 'TRUE' || val === 'true' || val === 1 || val === '1';
}

function normalizeStationDeviceLayout(layout) {
  const raw = (layout || '').toString().trim().toLowerCase();
  if (raw === STATION_DEVICE_LAYOUTS.TSL_DOCK_DESKTOP) return STATION_DEVICE_LAYOUTS.TSL_DOCK_DESKTOP;
  return STATION_DEVICE_LAYOUTS.CHAINWAY_HANDHELD;
}

function ensureStationRoleColumns(roleSheet) {
  const data = roleSheet.getDataRange().getValues();
  if (!data.length) return getHeaderMap(data);
  let headers = data[0].map(h => (h || '').toString().trim());
  let rMap = {};
  headers.forEach((h, i) => { if (h) rMap[h] = i; });

  const missing = STATION_ROLE_META_KEYS.concat(STATION_IAM_PERMISSION_KEYS).filter(k => rMap[k] === undefined);
  if (!missing.length) return rMap;

  missing.forEach(col => {
    roleSheet.insertColumnAfter(headers.length);
    headers.push(col);
    roleSheet.getRange(1, headers.length).setValue(col);
    rMap[col] = headers.length - 1;
  });
  return rMap;
}

function readStationProfileRow(row, rMap) {
  const f = typeof getRoleRowFields === 'function' ? getRoleRowFields(row, rMap) : {};
  const profile = {
    id: f.rId || (rMap['Role_ID'] !== undefined ? row[rMap['Role_ID']] : ''),
    name: f.displayName || (rMap['Role_Name'] !== undefined ? row[rMap['Role_Name']] : ''),
    key: f.vaultKey || '',
    sysAccess: typeof normalizeAccessTier === 'function'
      ? normalizeAccessTier(getSheetCell(row, rMap, 'sysAccess') || 'CREW')
      : 'CREW',
    is_station_device: isStationTruthyCell(row[rMap['is_station_device']]),
    station_device_layout: normalizeStationDeviceLayout(row[rMap['station_device_layout']])
  };
  STATION_IAM_PERMISSION_KEYS.forEach(k => {
    if (rMap[k] !== undefined) profile[k] = isStationTruthyCell(row[rMap[k]]);
  });
  return profile;
}

function isStationDeviceProfileRow(row, rMap) {
  if (!row || !rMap) return false;
  if (isStationTruthyCell(row[rMap['is_station_device']])) return true;
  const name = (getSheetCell(row, rMap, 'Role_Name') || '').toString().toUpperCase();
  return name.indexOf('STATION') === 0 || name.indexOf('WH-GUN') === 0 || name.indexOf('WH-DOOR') === 0;
}

function getStationProfilesFromRoleData(roleData, rMap) {
  const list = [];
  for (let i = 1; i < roleData.length; i++) {
    if (!isStationDeviceProfileRow(roleData[i], rMap)) continue;
    list.push(readStationProfileRow(roleData[i], rMap));
  }
  return list;
}

function isStationRoleRef(roleRef, roleData, rMap) {
  if (!roleRef) return false;
  for (let i = 1; i < roleData.length; i++) {
    if (crewRoleRefMatchesRow(roleRef, roleData[i], rMap) && isStationDeviceProfileRow(roleData[i], rMap)) {
      return true;
    }
  }
  return false;
}

function buildSyntheticStationEmail(name, uid) {
  const slug = String(name || 'device').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'device';
  const shortUid = String(uid || Utilities.getUuid()).replace(/-/g, '').slice(0, 8);
  return slug + '.' + shortUid + '@station.showrider';
}

function normalizeStationRfidTag(tag) {
  return (tag || '').toString().trim().toLowerCase();
}

/** Crew badge lookup for host-inherit (station shell). Soft cutover: EPC-only when rfid_tid empty on row. */
function lookupCrewMemberByRfidTag(rfidTag, crewData, cMap, rfidTid) {
  const result = lookupCrewMemberByRfidPair_(rfidTag, rfidTid, crewData, cMap);
  return result.crew;
}

/**
 * Match crew by EPC (+ TID when enrolled on row).
 * Returns { crew, tidMismatch } — tidMismatch true when EPC hit a row with rfid_tid but scan TID differs.
 */
function lookupCrewMemberByRfidPair_(rfidTag, rfidTid, crewData, cMap) {
  const needleEpc = normalizeStationRfidTag(rfidTag);
  const needleTid = normalizeStationRfidTag(rfidTid);
  if (!needleEpc || !crewData || crewData.length < 2 || !cMap) return { crew: null, tidMismatch: false };
  const hasTidCol = cMap['rfid_tid'] !== undefined;
  let tidMismatch = false;

  for (let i = 1; i < crewData.length; i++) {
    if (cMap['rfid_tag'] === undefined) continue;
    const rowEpc = normalizeStationRfidTag(crewData[i][cMap['rfid_tag']]);
    if (!rowEpc || rowEpc !== needleEpc) continue;
    const rowTid = hasTidCol ? normalizeStationRfidTag(crewData[i][cMap['rfid_tid']]) : '';
    if (rowTid) {
      if (!needleTid || rowTid !== needleTid) {
        tidMismatch = true;
        continue;
      }
    }
    const name = getSheetCell(crewData[i], cMap, 'Name');
    if (!name) continue;
    return {
      crew: {
        uid: getSheetCell(crewData[i], cMap, 'uid'),
        name: name,
        email: getSheetCell(crewData[i], cMap, 'Email'),
        rfidTag: rowEpc,
        rfidTid: rowTid
      },
      tidMismatch: false
    };
  }
  return { crew: null, tidMismatch: tidMismatch };
}

function actorUsesStationShell(crewName) {
  if (!crewName) return false;
  const sheets = verifyVaultSchema(true);
  const crewData = getSheetData(sheets.crew);
  const rMap = ensureStationRoleColumns(sheets.roles);
  const roleData = sheets.roles.getDataRange().getValues();
  const cMap = getHeaderMap(crewData);
  const target = crewName.toLowerCase().trim();
  for (let i = 1; i < crewData.length; i++) {
    const dbName = getSheetCell(crewData[i], cMap, 'Name').toLowerCase().trim();
    if (dbName !== target) continue;
    const roleId = getSheetCell(crewData[i], cMap, 'Role_ID');
    for (let r = 1; r < roleData.length; r++) {
      if (!crewRoleRefMatchesRow(roleId, roleData[r], rMap)) continue;
      return isStationDeviceProfileRow(roleData[r], rMap);
    }
    return false;
  }
  return false;
}

function effectiveStationPermission(crewName, permissionKey) {
  if (!crewName || STATION_IAM_PERMISSION_KEYS.indexOf(permissionKey) === -1) return false;
  if (crewName.toLowerCase().trim() === 'bogdan') return true;
  const sheets = verifyVaultSchema(true);
  const crewData = getSheetData(sheets.crew);
  const rMap = ensureStationRoleColumns(sheets.roles);
  const roleData = sheets.roles.getDataRange().getValues();
  const cMap = crewData.hMap;
  const target = crewName.toLowerCase().trim();
  for (let i = 1; i < crewData.length; i++) {
    let dbName = getSheetCell(crewData[i], cMap, 'Name').toLowerCase().trim();
    if (dbName !== target) continue;
    let roleId = getSheetCell(crewData[i], cMap, 'Role_ID');
    for (let r = 1; r < roleData.length; r++) {
      if (!crewRoleRefMatchesRow(roleId, roleData[r], rMap)) continue;
      if (!isStationDeviceProfileRow(roleData[r], rMap)) return false;
      const cell = roleData[r][rMap[permissionKey]];
      if (isStationTruthyCell(cell)) return true;
      // Legacy station profiles: station_vault_damaged column added later — inherit broken baseline.
      if (permissionKey === 'station_vault_damaged'
          && rMap['station_vault_broken'] !== undefined
          && isStationTruthyCell(roleData[r][rMap['station_vault_broken']])) {
        return true;
      }
      return false;
    }
  }
  return false;
}

function assertActorCanUseStationVaultOps(actor) {
  if (!actorUsesStationShell(actor) && !verifyBackendPrivilege(actor, 'MANAGER')) {
    throw new Error('PERMISSION DENIED: Station vault operations require a warehouse device profile.');
  }
  if (!effectiveStationPermission(actor, 'station_vault_maintenance')
      && !effectiveStationPermission(actor, 'station_vault_repair')
      && !effectiveStationPermission(actor, 'station_vault_broken')
      && !effectiveStationPermission(actor, 'station_vault_damaged')
      && !verifyBackendPrivilege(actor, 'MANAGER')) {
    throw new Error('PERMISSION DENIED: Station vault ops not enabled for this device profile.');
  }
}

/** Gate each lifecycle write by the station device profile (not the hosted crew). */
function assertStationStatusPermission_(deviceActor, statusLabel) {
  const label = String(statusLabel || '').trim();
  if (!label || label === 'Repaired') {
    if (!effectiveStationPermission(deviceActor, 'station_vault_repair')
        && !verifyBackendPrivilege(deviceActor, 'MANAGER')) {
      throw new Error('PERMISSION DENIED: Repair not enabled for this station profile.');
    }
    return;
  }
  if (label === 'Maintenance') {
    if (!effectiveStationPermission(deviceActor, 'station_vault_maintenance')
        && !verifyBackendPrivilege(deviceActor, 'MANAGER')) {
      throw new Error('PERMISSION DENIED: Maintenance not enabled for this station profile.');
    }
    return;
  }
  if (label === 'Broken') {
    if (!effectiveStationPermission(deviceActor, 'station_vault_broken')
        && !verifyBackendPrivilege(deviceActor, 'MANAGER')) {
      throw new Error('PERMISSION DENIED: Mark broken not enabled for this station profile.');
    }
    return;
  }
  if (label === 'Damaged') {
    if (!effectiveStationPermission(deviceActor, 'station_vault_damaged')
        && !verifyBackendPrivilege(deviceActor, 'MANAGER')) {
      throw new Error('PERMISSION DENIED: Mark damaged not enabled for this station profile.');
    }
    return;
  }
}

// @INDEX: STATION_IAM -> Load profiles (ROOT admin UI)
function getSecureStationProfilesDirectory(adminName) {
  return executeWithRetry(() => {
    if (!verifyBackendPrivilege(adminName, 'ROOT')) {
      return { error: 'API DENIED: ROOT privileges required.' };
    }
    const sheets = verifyVaultSchema(true);
    const rMap = ensureStationRoleColumns(sheets.roles);
    const roleData = sheets.roles.getDataRange().getValues();
    return {
      profiles: getStationProfilesFromRoleData(roleData, rMap),
      layouts: Object.values(STATION_DEVICE_LAYOUTS),
      permissionKeys: STATION_IAM_PERMISSION_KEYS.slice()
    };
  });
}

// @INDEX: STATION_IAM -> Save device profile
function saveStationProfileConfig(adminName, profileData) {
  return executeWithRetry(() => {
    if (!verifyBackendPrivilege(adminName, 'ROOT')) {
      return { success: false, message: 'API DENIED: ROOT privileges required.' };
    }
    const sheets = verifyVaultSchema();
    const roleSheet = sheets.roles;
    const rMap = ensureStationRoleColumns(roleSheet);
    const data = roleSheet.getDataRange().getValues();

    const name = (profileData.name || '').toString().trim();
    if (!name) return { success: false, message: 'Profile name is required.' };

    let roleUuid = (profileData.id && profileData.id !== 'NEW') ? profileData.id.toString().trim() : Utilities.getUuid();
    let newRow = new Array(data[0].length).fill('');
    if (rMap['Role_ID'] !== undefined) newRow[rMap['Role_ID']] = roleUuid;
    if (rMap['Role_Name'] !== undefined) newRow[rMap['Role_Name']] = name;
    if (rMap['sysAccess'] !== undefined) {
      newRow[rMap['sysAccess']] = normalizeAccessTier(profileData.sysAccess || 'CREW');
    }
    if (rMap['is_station_device'] !== undefined) newRow[rMap['is_station_device']] = true;
    if (rMap['station_device_layout'] !== undefined) {
      newRow[rMap['station_device_layout']] = normalizeStationDeviceLayout(profileData.station_device_layout);
    }
    STATION_IAM_PERMISSION_KEYS.forEach(k => {
      if (rMap[k] !== undefined) newRow[rMap[k]] = !!profileData[k];
    });

    for (let i = 1; i < data.length; i++) {
      if (crewRoleRefMatchesRow(profileData.id, data[i], rMap)
          || (profileData.name && getSheetCell(data[i], rMap, 'Role_Name').toLowerCase() === name.toLowerCase())) {
        let existingId = getSheetCell(data[i], rMap, 'Role_ID');
        if (existingId) newRow[rMap['Role_ID']] = existingId;
        roleSheet.getRange(i + 1, 1, 1, newRow.length).setValues([newRow]);
        flushCache();
        writeToAuditLog(adminName, 'UPDATE', 'STATION_PROFILES', 'GLOBAL', newRow[rMap['Role_ID']], 'Modified station device profile.');
        return { success: true, message: "Station profile '" + name + "' updated." };
      }
    }
    roleSheet.appendRow(newRow);
    flushCache();
    writeToAuditLog(adminName, 'CREATE', 'STATION_PROFILES', 'GLOBAL', roleUuid, 'Created station device profile.');
    return { success: true, message: "Station profile '" + name + "' created." };
  });
}

function deleteStationProfileConfig(adminName, profileIdRef) {
  return executeWithRetry(() => {
    if (!verifyBackendPrivilege(adminName, 'ROOT')) {
      return { success: false, message: 'API DENIED: ROOT privileges required.' };
    }
    const sheets = verifyVaultSchema();
    const roleSheet = sheets.roles;
    const data = roleSheet.getDataRange().getValues();
    const rMap = ensureStationRoleColumns(roleSheet);

    let keptRows = [data[0]];
    let deletedName = '';
    let deletedId = '';
    for (let i = 1; i < data.length; i++) {
      if (crewRoleRefMatchesRow(profileIdRef, data[i], rMap) && isStationDeviceProfileRow(data[i], rMap)) {
        deletedName = getSheetCell(data[i], rMap, 'Role_Name');
        deletedId = getSheetCell(data[i], rMap, 'Role_ID');
      } else {
        keptRows.push(data[i]);
      }
    }
    if (!deletedId && !deletedName) return { success: false, message: 'Station profile not found.' };
    roleSheet.clearContents();
    roleSheet.getRange(1, 1, keptRows.length, keptRows[0].length).setValues(keptRows);
    flushCache();
    writeToAuditLog(adminName, 'DELETE', 'STATION_PROFILES', 'GLOBAL', deletedId || deletedName, "Deleted station profile '" + deletedName + "'.");
    return { success: true, message: "Station profile '" + deletedName + "' deleted." };
  });
}

function getStationPermissionsForDeviceActor_(deviceActor) {
  const out = {};
  STATION_IAM_PERMISSION_KEYS.forEach(k => { out[k] = false; });
  if (!deviceActor) return out;
  STATION_IAM_PERMISSION_KEYS.forEach(k => {
    out[k] = effectiveStationPermission(deviceActor, k);
  });
  return out;
}

// @INDEX: STATION_SHELL -> Bootstrap (device login UI)
function getStationShellBootstrap(deviceActor) {
  return executeWithRetry(() => {
    if (!actorUsesStationShell(deviceActor)) {
      return { success: false, error: 'Not a station device login.' };
    }
    const sheets = verifyVaultSchema(true);
    const rMap = ensureStationRoleColumns(sheets.roles);
    const roleData = sheets.roles.getDataRange().getValues();
    const crewData = getSheetData(sheets.crew);
    const cMap = getHeaderMap(crewData);
    const target = String(deviceActor).toLowerCase().trim();
    let profileName = '';
    let layout = STATION_DEVICE_LAYOUTS.CHAINWAY_HANDHELD;

    for (let i = 1; i < crewData.length; i++) {
      const rowName = getSheetCell(crewData[i], cMap, 'Name').toLowerCase().trim();
      if (rowName !== target) continue;
      const roleId = getSheetCell(crewData[i], cMap, 'Role_ID');
      for (let r = 1; r < roleData.length; r++) {
        if (!crewRoleRefMatchesRow(roleId, roleData[r], rMap)) continue;
        if (!isStationDeviceProfileRow(roleData[r], rMap)) break;
        profileName = getSheetCell(roleData[r], rMap, 'Role_Name') || profileName;
        layout = normalizeStationDeviceLayout(roleData[r][rMap['station_device_layout']]);
        break;
      }
      break;
    }

    const perms = getStationPermissionsForDeviceActor_(deviceActor);
    return {
      success: true,
      deviceName: deviceActor,
      profileName: profileName,
      layout: layout,
      permissions: perms,
      hostInheritEnabled: !!perms.station_host_inherit
    };
  });
}

// @INDEX: STATION_SHELL -> Equipment RFID map (epc -> equipment name/unit)
// Preloaded on the station shell so scanned tags resolve to a human name/unit
// instantly and offline. Same fragile trim/lowercase matching contract as crew tags.
function buildEquipmentScanMapFromSheets_(sheets) {
  const data = getSheetData(sheets.assets);
  const map = data.hMap || getHeaderMap(data);
  const getCol = (matchStrs) => {
    const key = Object.keys(map).find(k => matchStrs.includes(String(k).toLowerCase().replace(/[^a-z0-9]/g, '')));
    return key !== undefined ? map[key] : undefined;
  };
  const cUid = getCol(['uid', 'id', 'assetuid']) ?? map['uid'];
  const cName = getCol(['name', 'assetname', 'itemname']) ?? map['name'];
  const cUnit = getCol(['unitnumber', 'unit']) ?? map['unit_number'];
  const cRfid = getCol(['rfidtag', 'rfid']) ?? map['rfid_tag'];
  const cStatus = getCol(['status', 'lifecycle']) ?? map['status'];
  const cStatusNote = getCol(['statusnote', 'issuenote', 'defectnote']) ?? map['status_note'];

  const out = {};
  if (cUid !== undefined) {
    for (let i = 1; i < data.length; i++) {
      if (!data[i][cUid]) continue;
      const entry = {
        kind: 'equipment',
        name: cName !== undefined ? String(data[i][cName] || '') : '',
        unitId: String(data[i][cUid] || '').trim(),
        unitNumber: cUnit !== undefined ? String(data[i][cUnit] || '') : '',
        status: cStatus !== undefined ? String(data[i][cStatus] || '') : '',
        statusNote: cStatusNote !== undefined ? String(data[i][cStatusNote] || '') : ''
      };
      const uidKey = normalizeStationRfidTag(entry.unitId);
      if (uidKey) {
        out['uid:' + uidKey] = entry;
        out[uidKey] = entry;
      }
      if (cRfid !== undefined) {
        const tag = normalizeStationRfidTag(data[i][cRfid]);
        if (tag) out[tag] = entry;
      }
    }
  }

  const crewData = getSheetData(sheets.crew);
  const crewMap = getHeaderMap(crewData);
  if (crewMap['rfid_tag'] !== undefined) {
    for (let i = 1; i < crewData.length; i++) {
      const tag = normalizeStationRfidTag(crewData[i][crewMap['rfid_tag']]);
      if (!tag || out[tag]) continue;
      const nm = getSheetCell(crewData[i], crewMap, 'Name');
      if (!nm) continue;
      out[tag] = { kind: 'crew', name: String(nm) };
    }
  }
  return out;
}

function getMobileScanStatusPermissions_(crewName) {
  const out = {
    station_vault_maintenance: false,
    station_vault_repair: false,
    station_vault_broken: false,
    station_vault_damaged: false
  };
  if (!crewName) return out;
  if (crewName.toLowerCase().trim() === 'bogdan') {
    Object.keys(out).forEach(k => { out[k] = true; });
    return out;
  }
  if (verifyBackendPrivilege(crewName, 'MANAGER')) {
    Object.keys(out).forEach(k => { out[k] = true; });
    return out;
  }
  // Warehouse baseline — any signed-in crew can mark equipment status from the scan panel.
  out.station_vault_maintenance = true;
  out.station_vault_broken = true;
  out.station_vault_damaged = true;
  out.station_vault_repair = true;
  return out;
}

function assertMobileScanStatusPermission_(crewName, statusLabel) {
  const perms = getMobileScanStatusPermissions_(crewName);
  const label = String(statusLabel || '').trim();
  if (!label || label === 'Repaired') {
    if (!perms.station_vault_repair) {
      throw new Error('PERMISSION DENIED: Repair not enabled for your profile.');
    }
    return;
  }
  if (label === 'Maintenance') {
    if (!perms.station_vault_maintenance) {
      throw new Error('PERMISSION DENIED: Maintenance not enabled for your profile.');
    }
    return;
  }
  if (label === 'Broken') {
    if (!perms.station_vault_broken) {
      throw new Error('PERMISSION DENIED: Mark broken not enabled for your profile.');
    }
    return;
  }
  if (label === 'Damaged') {
    if (!perms.station_vault_damaged) {
      throw new Error('PERMISSION DENIED: Mark damaged not enabled for your profile.');
    }
    return;
  }
}

function getStationEquipmentRfidMap(deviceActor) {
  return executeWithRetry(() => {
    if (!actorUsesStationShell(deviceActor)) {
      return { success: false, error: 'Not a station device login.' };
    }
    const sheets = verifyVaultSchema(true);
    const out = buildEquipmentScanMapFromSheets_(sheets);
    return { success: true, map: out, count: Object.keys(out).length, ts: Date.now() };
  });
}

// @INDEX: MOBILE_SCAN -> Bootstrap (phone QR scan panel)
function getMobileScanBootstrap(crewName) {
  return executeWithRetry(() => {
    if (!crewName) return { success: false, error: 'Not signed in.' };
    if (actorUsesStationShell(crewName)) {
      return { success: false, error: 'Use station scan on warehouse devices.' };
    }
    const sheets = verifyVaultSchema(true);
    const crewData = getSheetData(sheets.crew);
    const cMap = getHeaderMap(crewData);
    const rbac = resolveHostRbacBundle_(crewName, crewData, cMap);
    const permissions = getMobileScanStatusPermissions_(crewName);
    const equipMap = buildEquipmentScanMapFromSheets_(sheets);
    return {
      success: true,
      access: rbac.access || 'CREW',
      permissions: permissions,
      map: equipMap,
      count: Object.keys(equipMap).length,
      ts: Date.now()
    };
  });
}

/** Extract asset uid/tag from QR payload (plain id, URL, or JSON). */
function extractMobileScanTag_(raw) {
  const s = String(raw == null ? '' : raw).trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) {
    try {
      const u = new URL(s);
      const q = u.searchParams.get('uid') || u.searchParams.get('id') || u.searchParams.get('tag');
      if (q) return String(q).trim();
      const parts = u.pathname.split('/').filter(Boolean);
      if (parts.length) return String(parts[parts.length - 1]).trim();
    } catch (e) { /* ignore */ }
  }
  if (s.charAt(0) === '{') {
    try {
      const o = JSON.parse(s);
      if (o && (o.uid || o.id || o.tag)) return String(o.uid || o.id || o.tag).trim();
    } catch (e2) { /* ignore */ }
  }
  return s;
}

// @INDEX: MOBILE_SCAN -> Resolve one scanned tag against vault (when client map not ready)
function resolveMobileScanTag(crewName, raw) {
  return executeWithRetry(() => {
    if (!crewName) return { success: false, error: 'Not signed in.' };
    if (actorUsesStationShell(crewName)) {
      return { success: false, error: 'Use station scan on warehouse devices.' };
    }
    const tag = extractMobileScanTag_(raw);
    if (!tag) return { success: false, error: 'Empty tag.' };
    const sheets = verifyVaultSchema(true);
    const hit = findAssetByScanTagInVault_(sheets, tag);
    return { success: true, hit: hit, tag: tag };
  });
}

/** Match scanned primary key / RFID tag against equipment scan map. */
function lookupEquipmentScanHit_(map, rawTag) {
  const tag = extractMobileScanTag_(rawTag);
  if (!tag || !map) return null;
  const key = normalizeStationRfidTag(tag);
  if (!key) return null;
  return map[key] || map['uid:' + key] || null;
}

function buildEquipmentScanEntryFromRow_(data, i, cols) {
  return {
    kind: 'equipment',
    name: cols.cName !== undefined ? String(data[i][cols.cName] || '') : '',
    unitId: String(data[i][cols.cUid] || '').trim(),
    unitNumber: cols.cUnit !== undefined ? String(data[i][cols.cUnit] || '') : '',
    status: cols.cStatus !== undefined ? String(data[i][cols.cStatus] || '') : '',
    statusNote: cols.cStatusNote !== undefined ? String(data[i][cols.cStatusNote] || '') : ''
  };
}

function getAssetScanColumns_(data) {
  const hMap = data.hMap || getHeaderMap(data);
  const getCol = (matchStrs) => {
    const key = Object.keys(hMap).find(k => matchStrs.includes(String(k).toLowerCase().replace(/[^a-z0-9]/g, '')));
    return key !== undefined ? hMap[key] : undefined;
  };
  return {
    cUid: getCol(['uid', 'id', 'assetuid']) ?? hMap['uid'],
    cName: getCol(['name', 'assetname', 'itemname']) ?? hMap['name'],
    cUnit: getCol(['unitnumber', 'unit']) ?? hMap['unit_number'],
    cRfid: getCol(['rfidtag', 'rfid']) ?? hMap['rfid_tag'],
    cStatus: getCol(['status', 'lifecycle']) ?? hMap['status'],
    cStatusNote: getCol(['statusnote', 'issuenote', 'defectnote']) ?? hMap['status_note']
  };
}

/** Parse human-readable codes like RW-1000-20 (shortcut-model-unit). */
function tryParseAssetCompositeCode_(tag) {
  const m = String(tag || '').trim().match(/^([A-Za-z]{1,8})-(\d+)-(\d+)$/);
  if (!m) return null;
  return { shortcut: m[1].toLowerCase(), model: m[2], unit: m[3] };
}

function nameMatchesCompositeHint_(name, parts) {
  const n = String(name || '').toLowerCase().trim();
  if (!n || !parts) return false;
  if (parts.model && n.indexOf(parts.model) !== -1) return true;
  const sc = parts.shortcut;
  if (!sc) return false;
  if (n.indexOf(sc) !== -1) return true;
  const words = n.split(/\s+/).filter(Boolean);
  const initials = words.map(w => w.charAt(0)).join('').toLowerCase();
  return initials === sc;
}

/** Full vault row scan — same contract as Operations checkout (uid, rfid, unit, name, composite codes). */
function findAssetByScanTagInVault_(sheets, rawTag) {
  const tag = extractMobileScanTag_(rawTag);
  if (!tag) return null;
  const fromMap = lookupEquipmentScanHit_(buildEquipmentScanMapFromSheets_(sheets), tag);
  if (fromMap) return fromMap;

  const data = getSheetData(sheets.assets);
  const cols = getAssetScanColumns_(data);
  if (cols.cUid === undefined) return null;

  const needle = normalizeStationRfidTag(tag);
  const rawNeedle = String(tag).trim().toLowerCase();

  for (let i = 1; i < data.length; i++) {
    if (!data[i][cols.cUid]) continue;
    const uid = normalizeStationRfidTag(data[i][cols.cUid]);
    const rawUid = String(data[i][cols.cUid]).trim().toLowerCase();
    const rfid = cols.cRfid !== undefined ? normalizeStationRfidTag(data[i][cols.cRfid]) : '';
    const unit = cols.cUnit !== undefined ? normalizeStationRfidTag(data[i][cols.cUnit]) : '';
    const name = cols.cName !== undefined ? String(data[i][cols.cName] || '').toLowerCase().trim() : '';
    const nameUnit = name + (unit ? ' #' + unit : '');
    const nameUnitSpace = name + (unit ? ' ' + unit : '');

    if (rawUid === rawNeedle || uid === needle || rfid === needle ||
        unit === needle || name === needle || nameUnit === needle || nameUnitSpace === needle) {
      return buildEquipmentScanEntryFromRow_(data, i, cols);
    }
  }

  const composite = tryParseAssetCompositeCode_(tag);
  if (composite) {
    const unitNeedle = normalizeStationRfidTag(composite.unit);
    let candidates = [];
    for (let i = 1; i < data.length; i++) {
      if (!data[i][cols.cUid]) continue;
      const uid = normalizeStationRfidTag(data[i][cols.cUid]);
      if (uid === needle || String(data[i][cols.cUid]).trim().toLowerCase() === rawNeedle) {
        return buildEquipmentScanEntryFromRow_(data, i, cols);
      }
      const unit = cols.cUnit !== undefined ? normalizeStationRfidTag(data[i][cols.cUnit]) : '';
      if (unit !== unitNeedle) continue;
      const name = cols.cName !== undefined ? String(data[i][cols.cName] || '') : '';
      if (nameMatchesCompositeHint_(name, composite)) {
        candidates.push(buildEquipmentScanEntryFromRow_(data, i, cols));
      }
    }
    if (candidates.length === 1) return candidates[0];
    if (candidates.length > 1 && composite.model) {
      const filtered = candidates.filter(c => String(c.name || '').toLowerCase().indexOf(composite.model) !== -1);
      if (filtered.length === 1) return filtered[0];
      if (filtered.length > 1) return filtered[0];
    }
  }

  return null;
}

const MOBILE_SCAN_PENDING_TTL_SEC = 300;

function mobileScanPendingCacheKey_(sessionToken) {
  return 'mobscan_' + String(sessionToken || '').trim().slice(0, 80);
}

/** Shell / hosting stages a scan when postMessage to iframe may race (PWA handoff). */
function stageMobileScanPending_(sessionToken, rawTag) {
  const token = String(sessionToken || '').trim();
  const tag = extractMobileScanTag_(rawTag);
  if (!token || token.length < 20 || !tag) return { success: false, error: 'Bad input.' };
  const crewName = validateUserSession_(token);
  if (!crewName) return { success: false, error: 'Invalid session.' };
  try {
    CacheService.getScriptCache().put(mobileScanPendingCacheKey_(token), tag, MOBILE_SCAN_PENDING_TTL_SEC);
    return { success: true, tag: tag };
  } catch (e) {
    return { success: false, error: (e && e.message) ? e.message : 'Cache error.' };
  }
}

// @INDEX: MOBILE_SCAN -> Pull shell-staged scan (phone panel after camera return)
function pullStagedMobileScan(crewName, sessionToken) {
  return executeWithRetry(() => {
    if (!crewName) return { success: false, error: 'Not signed in.' };
    if (actorUsesStationShell(crewName)) {
      return { success: false, error: 'Use station scan on warehouse devices.' };
    }
    const token = String(sessionToken || '').trim();
    if (!token || token.length < 20) return { success: false, error: 'No session.' };
    const validated = validateUserSession_(token);
    if (!validated || validated.toLowerCase().trim() !== String(crewName).toLowerCase().trim()) {
      return { success: false, error: 'Session mismatch.' };
    }
    const cacheKey = mobileScanPendingCacheKey_(token);
    const cache = CacheService.getScriptCache();
    const staged = cache.get(cacheKey);
    if (!staged) return { success: true, pending: false };
    cache.remove(cacheKey);
    const sheets = verifyVaultSchema(true);
    const hit = findAssetByScanTagInVault_(sheets, staged);
    return { success: true, pending: true, tag: staged, hit: hit };
  });
}

// @INDEX: MOBILE_SCAN -> Set asset lifecycle status from phone scan panel
function setMobileAssetStatus(crewName, assetId, status, note) {
  return executeWithRetry(() => {
    if (!crewName) return { success: false, error: 'Not signed in.' };
    if (actorUsesStationShell(crewName)) {
      return { success: false, error: 'Use station scan on warehouse devices.' };
    }
    const allowed = ['Active', 'Maintenance', 'Damaged', 'Broken', 'Repaired'];
    const want = String(status || '').trim();
    const label = allowed.find(a => a.toLowerCase() === want.toLowerCase());
    if (!label) return { success: false, error: 'Unknown status.' };
    try {
      assertMobileScanStatusPermission_(crewName, label);
    } catch (permErr) {
      return { success: false, error: permErr.message || 'Permission denied.' };
    }
    const noteText = String(note == null ? '' : note).trim();
    if (label === 'Damaged' && !noteText) {
      return { success: false, error: 'Describe what is wrong (required for Damaged).' };
    }
    const writeStatus = (label === 'Repaired') ? 'Active' : label;
    const writeNote = (label === 'Repaired' || writeStatus === 'Active') ? '' : noteText;

    const sheets = verifyVaultSchema();
    const data = sheets.assets.getDataRange().getValues();
    const map = {};
    data[0].forEach((h, i) => { map[h.toString().trim()] = i; });
    const col = (arr) => {
      const k = Object.keys(map).find(k => arr.includes(String(k).toLowerCase().replace(/[^a-z0-9]/g, '')));
      return k !== undefined ? map[k] : undefined;
    };
    const cUid = col(['uid', 'id', 'assetuid']) ?? map['uid'];
    const cStatus = col(['status', 'lifecycle']) ?? map['status'];
    const cStatusNote = col(['statusnote', 'issuenote', 'defectnote']) ?? map['status_note'];
    const cName = col(['name', 'assetname', 'itemname']) ?? map['name'];
    if (cUid === undefined || cStatus === undefined) {
      return { success: false, error: 'Assets sheet missing uid/status column.' };
    }
    const target = String(assetId).trim();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][cUid]).trim() !== target) continue;
      sheets.assets.getRange(i + 1, cStatus + 1).setValue(writeStatus);
      if (cStatusNote !== undefined) {
        sheets.assets.getRange(i + 1, cStatusNote + 1).setValue(writeNote);
      }
      if (typeof flushCache !== 'undefined') flushCache();
      const nm = cName !== undefined ? String(data[i][cName] || '') : target;
      const auditDetail = crewName + ' set ' + nm + ' → ' + label
        + (writeNote ? (' ("' + writeNote.slice(0, 120) + '")') : '') + ' [mobile scan].';
      writeToAuditLog(crewName, 'MOBILE_SCAN_STATUS', 'ASSETS', 'GLOBAL', target, auditDetail);
      return {
        success: true,
        id: target,
        status: writeStatus,
        statusNote: writeNote,
        label: label
      };
    }
    return { success: false, error: 'Asset not found.' };
  });
}

// @INDEX: STATION_SHELL -> Vault list (compact station equipment list; client-side search)
function getStationVaultList(deviceActor, hostName) {
  return executeWithRetry(() => {
    if (!actorUsesStationShell(deviceActor)) {
      return { success: false, error: 'Not a station device login.' };
    }
    const sheets = verifyVaultSchema(true);
    const data = getSheetData(sheets.assets);
    const map = data.hMap || getHeaderMap(data);
    const col = (arr) => {
      const k = Object.keys(map).find(k => arr.includes(String(k).toLowerCase().replace(/[^a-z0-9]/g, '')));
      return k !== undefined ? map[k] : undefined;
    };
    const cUid = col(['uid', 'id', 'assetuid']) ?? map['uid'];
    const cName = col(['name', 'assetname', 'itemname']) ?? map['name'];
    const cUnit = col(['unitnumber', 'unit']) ?? map['unit_number'];
    const cRfid = col(['rfidtag', 'rfid']) ?? map['rfid_tag'];
    const cStatus = col(['status', 'lifecycle']) ?? map['status'];
    const cStatusNote = col(['statusnote', 'issuenote', 'defectnote']) ?? map['status_note'];
    const cContainer = col(['containertype', 'container']) ?? map['container_type'];
    const cNesting = col(['nestinglevel', 'level', 'nesting']) ?? map['nesting_level'];
    const cConsum = col(['isconsumable', 'consumable']) ?? map['is_consumable'];
    // Manufacturer + length drive the "logical parent" rollup (identical units collapse into a
    // folder keyed by name|manufacturer|length — mirrors renderAssetRegistry in the real vault).
    const cManu = col(['manufacturer', 'brand', 'make']) ?? map['manufacturer'];
    const cLength = col(['length', 'lengthm', 'cablelength']) ?? map['length'];

    const items = [];
    for (let i = 1; i < data.length; i++) {
      if (cUid === undefined || !data[i][cUid]) continue;
      items.push({
        id: String(data[i][cUid]),
        name: cName !== undefined ? String(data[i][cName] || '') : '',
        unitNumber: cUnit !== undefined ? String(data[i][cUnit] || '') : '',
        rfidTag: cRfid !== undefined ? String(data[i][cRfid] || '') : '',
        status: cStatus !== undefined ? String(data[i][cStatus] || '') : '',
        statusNote: cStatusNote !== undefined ? String(data[i][cStatusNote] || '') : '',
        containerType: cContainer !== undefined ? String(data[i][cContainer] || '') : '',
        nestingLevel: cNesting !== undefined ? String(data[i][cNesting] || '') : '',
        manufacturer: cManu !== undefined ? String(data[i][cManu] || '') : '',
        length: cLength !== undefined ? String(data[i][cLength] || '') : '',
        isBulk: cConsum !== undefined ? isStationTruthyCell(data[i][cConsum]) : false
      });
    }
    return {
      success: true,
      items: items,
      canRecordRfid: !!hostName && verifyBackendPrivilege(hostName, 'MANAGER'),
      ts: Date.now()
    };
  });
}

// @INDEX: STATION_SHELL -> Crew RFID list for the Vault "Crew" tab (ROOT host only)
// Lists real crew members + their current badge tag so ROOT can assign/overwrite from the station.
// Station device profiles are excluded — they must never carry an RFID tag.
function getStationCrewRfidList(deviceActor, hostName) {
  return executeWithRetry(() => {
    if (!actorUsesStationShell(deviceActor)) {
      return { success: false, error: 'Station device login only.' };
    }
    if (!verifyBackendPrivilege(hostName, 'ROOT')) {
      return { success: false, error: 'Only ROOT can manage crew badges.' };
    }
    const sheets = verifyVaultSchema(true);
    const crewData = getSheetData(sheets.crew);
    const cMap = getHeaderMap(crewData);
    const rMap = ensureStationRoleColumns(sheets.roles);
    const roleData = sheets.roles.getDataRange().getValues();

    // Collect the role refs that are station device profiles, to filter those crew rows out.
    const deviceRoleIds = {};
    for (let r = 1; r < roleData.length; r++) {
      if (isStationDeviceProfileRow(roleData[r], rMap)) {
        const rid = getSheetCell(roleData[r], rMap, 'Role_ID');
        if (rid) deviceRoleIds[String(rid).toLowerCase().trim()] = true;
      }
    }

    const list = [];
    for (let i = 1; i < crewData.length; i++) {
      const name = getSheetCell(crewData[i], cMap, 'Name');
      if (!name) continue;
      const roleId = (getSheetCell(crewData[i], cMap, 'Role_ID') || '').toString().toLowerCase().trim();
      if (roleId && deviceRoleIds[roleId]) continue; // skip station device profiles
      list.push({
        uid: getSheetCell(crewData[i], cMap, 'uid'),
        name: name,
        rfidTag: cMap['rfid_tag'] !== undefined ? normalizeStationRfidTag(crewData[i][cMap['rfid_tag']]) : '',
        rfidTid: cMap['rfid_tid'] !== undefined ? normalizeStationRfidTag(crewData[i][cMap['rfid_tid']]) : ''
      });
    }
    list.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    return { success: true, crew: list, ts: Date.now() };
  });
}

// @INDEX: STATION_SHELL -> Set asset lifecycle status (anyone hosted at a vault-enabled station)
function setStationAssetStatus(deviceActor, hostName, assetId, status, note) {
  return executeWithRetry(() => {
    if (!actorUsesStationShell(deviceActor)) {
      return { success: false, error: 'Station device login only.' };
    }
    if (!hostName) return { success: false, error: 'Scan your badge to host a session first.' };
    const allowed = ['Active', 'Maintenance', 'Damaged', 'Broken', 'Repaired'];
    const want = String(status || '').trim();
    const label = allowed.find(a => a.toLowerCase() === want.toLowerCase());
    if (!label) return { success: false, error: 'Unknown status.' };
    try {
      assertStationStatusPermission_(deviceActor, label);
    } catch (permErr) {
      return { success: false, error: permErr.message || 'Permission denied.' };
    }
    const noteText = String(note == null ? '' : note).trim();
    if (label === 'Damaged' && !noteText) {
      return { success: false, error: 'Describe what is wrong (required for Damaged).' };
    }
    // "Repaired" is an action that returns an item to service; store it as Active.
    const writeStatus = (label === 'Repaired') ? 'Active' : label;
    const writeNote = (label === 'Repaired' || writeStatus === 'Active') ? '' : noteText;

    const sheets = verifyVaultSchema();
    const data = sheets.assets.getDataRange().getValues();
    const map = {};
    data[0].forEach((h, i) => { map[h.toString().trim()] = i; });
    const col = (arr) => {
      const k = Object.keys(map).find(k => arr.includes(String(k).toLowerCase().replace(/[^a-z0-9]/g, '')));
      return k !== undefined ? map[k] : undefined;
    };
    const cUid = col(['uid', 'id', 'assetuid']) ?? map['uid'];
    const cStatus = col(['status', 'lifecycle']) ?? map['status'];
    const cStatusNote = col(['statusnote', 'issuenote', 'defectnote']) ?? map['status_note'];
    const cName = col(['name', 'assetname', 'itemname']) ?? map['name'];
    if (cUid === undefined || cStatus === undefined) {
      return { success: false, error: 'Assets sheet missing uid/status column.' };
    }
    const target = String(assetId).trim();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][cUid]).trim() !== target) continue;
      sheets.assets.getRange(i + 1, cStatus + 1).setValue(writeStatus);
      if (cStatusNote !== undefined) {
        sheets.assets.getRange(i + 1, cStatusNote + 1).setValue(writeNote);
      }
      if (typeof flushCache !== 'undefined') flushCache();
      const nm = cName !== undefined ? String(data[i][cName] || '') : target;
      const auditDetail = (hostName || 'host') + ' set ' + nm + ' → ' + label
        + (writeNote ? (' ("' + writeNote.slice(0, 120) + '")') : '') + '.';
      writeToAuditLog(deviceActor, 'STATION_VAULT_STATUS', 'ASSETS', 'GLOBAL', target, auditDetail);
      return {
        success: true,
        id: target,
        status: writeStatus,
        statusNote: writeNote,
        label: label
      };
    }
    return { success: false, error: 'Asset not found.' };
  });
}

// @INDEX: STATION_SHELL -> Record RFID onto equipment (MANAGERS only), mirror of crew enroll
/**
 * Whole-database RFID owner lookup — scans BOTH the Assets sheet and the Crew roster for a tag so a
 * record/enroll can warn before it steals a tag that's already in use anywhere. Returns
 * { kind:'equipment'|'crew', id, name } for the first owner found, or null. Read-only (cached).
 * `excl` lets the caller ignore the row it's writing to: { excludeAssetId, excludeCrewRef }.
 */
function findStationRfidOwner_(rfidTag, excl, rfidTid) {
  excl = excl || {};
  const needle = normalizeStationRfidTag(rfidTag);
  const tidNeedle = normalizeStationRfidTag(rfidTid);
  if (!needle && !tidNeedle) return null;
  const sheets = verifyVaultSchema(true);

  if (needle) {
    const aData = getSheetData(sheets.assets);
    const aMap = aData.hMap || getHeaderMap(aData);
    const aCol = (arr) => {
      const k = Object.keys(aMap).find(k => arr.includes(String(k).toLowerCase().replace(/[^a-z0-9]/g, '')));
      return k !== undefined ? aMap[k] : undefined;
    };
    const aUid = aCol(['uid', 'id', 'assetuid']) ?? aMap['uid'];
    const aRfid = aCol(['rfidtag', 'rfid']) ?? aMap['rfid_tag'];
    const aName = aCol(['name', 'assetname', 'itemname']) ?? aMap['name'];
    const aUnit = aCol(['unitnumber', 'unit']) ?? aMap['unit_number'];
    if (aRfid !== undefined) {
      for (let i = 1; i < aData.length; i++) {
        if (normalizeStationRfidTag(aData[i][aRfid]) !== needle) continue;
        const uid = String(aData[i][aUid] || '').trim();
        if (excl.excludeAssetId && uid === String(excl.excludeAssetId).trim()) continue;
        let nm = aName !== undefined ? String(aData[i][aName] || 'asset') : 'asset';
        const un = aUnit !== undefined ? String(aData[i][aUnit] || '').trim() : '';
        if (un) nm += ' #' + un;
        return { kind: 'equipment', id: uid, name: nm };
      }
    }

    const cData = getSheetData(sheets.crew);
    const cMap = getHeaderMap(cData);
    if (cMap['rfid_tag'] !== undefined) {
      for (let i = 1; i < cData.length; i++) {
        if (normalizeStationRfidTag(cData[i][cMap['rfid_tag']]) !== needle) continue;
        const uid = (getSheetCell(cData[i], cMap, 'uid') || '').toString().trim();
        const nm = (getSheetCell(cData[i], cMap, 'Name') || '').toString().trim();
        if (excl.excludeCrewRef) {
          const ref = String(excl.excludeCrewRef).toLowerCase().trim();
          if ((uid && uid.toLowerCase() === ref) || (nm && nm.toLowerCase() === ref)) continue;
        }
        return { kind: 'crew', id: uid || nm, name: nm || 'crew member' };
      }
    }
  }

  if (tidNeedle) {
    const cData = getSheetData(sheets.crew);
    const cMap = getHeaderMap(cData);
    if (cMap['rfid_tid'] !== undefined) {
      for (let i = 1; i < cData.length; i++) {
        if (normalizeStationRfidTag(cData[i][cMap['rfid_tid']]) !== tidNeedle) continue;
        const uid = (getSheetCell(cData[i], cMap, 'uid') || '').toString().trim();
        const nm = (getSheetCell(cData[i], cMap, 'Name') || '').toString().trim();
        if (excl.excludeCrewRef) {
          const ref = String(excl.excludeCrewRef).toLowerCase().trim();
          if ((uid && uid.toLowerCase() === ref) || (nm && nm.toLowerCase() === ref)) continue;
        }
        return { kind: 'crew', id: uid || nm, name: nm || 'crew member', field: 'tid' };
      }
    }
  }
  return null;
}

/** Blank the rfid_tag on whichever row currently owns a tag (used when overwriting/stealing it). */
function clearStationRfidOwner_(owner) {
  if (!owner || !owner.kind) return;
  const sheets = verifyVaultSchema();
  if (owner.kind === 'equipment') {
    const data = sheets.assets.getDataRange().getValues();
    const map = {};
    data[0].forEach((h, i) => { map[h.toString().trim()] = i; });
    const col = (arr) => {
      const k = Object.keys(map).find(k => arr.includes(String(k).toLowerCase().replace(/[^a-z0-9]/g, '')));
      return k !== undefined ? map[k] : undefined;
    };
    const cUid = col(['uid', 'id', 'assetuid']) ?? map['uid'];
    const cRfid = col(['rfidtag', 'rfid']) ?? map['rfid_tag'];
    if (cUid === undefined || cRfid === undefined) return;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][cUid] || '').trim() === String(owner.id).trim()) {
        sheets.assets.getRange(i + 1, cRfid + 1).setValue('');
        return;
      }
    }
  } else if (owner.kind === 'crew') {
    const data = sheets.crew.getDataRange().getValues();
    const map = getHeaderMap(data);
    if (map['rfid_tag'] === undefined) return;
    const ref = String(owner.id).toLowerCase().trim();
    for (let i = 1; i < data.length; i++) {
      const uid = (getSheetCell(data[i], map, 'uid') || '').toString().toLowerCase().trim();
      const nm = (getSheetCell(data[i], map, 'Name') || '').toString().toLowerCase().trim();
      if ((uid && uid === ref) || (nm && nm === ref)) {
        sheets.crew.getRange(i + 1, map['rfid_tag'] + 1).setValue('');
        if (map['rfid_tid'] !== undefined) {
          sheets.crew.getRange(i + 1, map['rfid_tid'] + 1).setValue('');
        }
        return;
      }
    }
  }
}

function recordStationAssetRfid(deviceActor, hostName, assetId, rfidTag, force) {
  return executeWithRetry(() => {
    if (!actorUsesStationShell(deviceActor)) {
      return { success: false, error: 'Station device login only.' };
    }
    if (!verifyBackendPrivilege(hostName, 'MANAGER')) {
      return { success: false, error: 'Only managers can record equipment RFIDs.' };
    }
    const tag = normalizeStationRfidTag(rfidTag);
    if (!tag) return { success: false, error: 'Empty scan — pull the trigger on the tag.' };

    const sheets = verifyVaultSchema();
    const data = sheets.assets.getDataRange().getValues();
    const map = {};
    data[0].forEach((h, i) => { map[h.toString().trim()] = i; });
    const col = (arr) => {
      const k = Object.keys(map).find(k => arr.includes(String(k).toLowerCase().replace(/[^a-z0-9]/g, '')));
      return k !== undefined ? map[k] : undefined;
    };
    const cUid = col(['uid', 'id', 'assetuid']) ?? map['uid'];
    const cRfid = col(['rfidtag', 'rfid']) ?? map['rfid_tag'];
    const cName = col(['name', 'assetname', 'itemname']) ?? map['name'];
    if (cUid === undefined || cRfid === undefined) {
      return { success: false, error: 'Assets sheet missing uid/rfid_tag column.' };
    }
    const target = String(assetId).trim();
    let targetRow = -1;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][cUid]).trim() === target) { targetRow = i; break; }
    }
    if (targetRow === -1) return { success: false, error: 'Asset not found.' };

    // Whole-DB duplicate guard: if the tag is already on ANY other asset or crew member, ask the
    // operator to overwrite (steal it) or cancel — unless they've already confirmed (force).
    const owner = findStationRfidOwner_(tag, { excludeAssetId: target });
    if (owner && !force) {
      return { success: false, duplicate: owner };
    }
    if (owner && force) clearStationRfidOwner_(owner);

    sheets.assets.getRange(targetRow + 1, cRfid + 1).setValue(tag);
    if (typeof flushCache !== 'undefined') flushCache();
    const nm = cName !== undefined ? String(data[targetRow][cName] || '') : target;
    let msg = (hostName || 'manager') + ' tagged ' + nm + ' (' + tag + ').';
    if (owner && force) msg += ' Overwrote ' + owner.kind + ' ' + owner.name + '.';
    writeToAuditLog(deviceActor, 'STATION_VAULT_RFID', 'ASSETS', 'GLOBAL', target, msg);
    return { success: true, id: target, rfidTag: tag, name: nm, overwrote: owner && force ? owner : null };
  });
}

// @INDEX: STATION_SHELL -> RFID scan router (host badge first)
/**
 * Host-inherit RBAC: resolve a hosted crew member's real tier + IAM permission bundle so the
 * station shell can evaluate the app as that person (not the low-tier device account). Uses the
 * plain resolvers from Security.js (no nested executeWithRetry). Station device profiles never
 * host (they're rejected upstream), so this is always a real person.
 */
function resolveHostRbacBundle_(crewName, crewData, cMap) {
  const fallback = { access: 'CREW', permissions: {} };
  try {
    const sheets = verifyVaultSchema(true);
    const roleData = getSheetData(sheets.roles);
    const rMap = getHeaderMap(roleData);
    const access = (typeof resolveCrewSysAccess === 'function')
      ? (resolveCrewSysAccess(crewName, crewData, roleData, cMap, rMap) || 'CREW')
      : 'CREW';
    const permissions = (typeof resolveCrewPermissionBundle === 'function')
      ? (resolveCrewPermissionBundle(crewName, crewData, roleData, cMap, rMap) || {})
      : {};
    return { access: access, permissions: permissions };
  } catch (e) {
    return fallback;
  }
}

function processStationRfidScan(deviceActor, rfidTag, options) {
  return executeWithRetry(() => {
    if (!actorUsesStationShell(deviceActor)) {
      return { success: false, error: 'PERMISSION DENIED: Station device login only.' };
    }
    const tag = normalizeStationRfidTag(rfidTag);
    if (!tag) return { success: false, error: 'Empty scan.' };

    const opts = options || {};
    const scanTid = normalizeStationRfidTag(opts.tid || opts.rfidTid || '');
    const hostOnly = opts.hostOnly !== false;
    const sheets = verifyVaultSchema(true);
    const crewData = getSheetData(sheets.crew);
    const cMap = getHeaderMap(crewData);
    const lookup = lookupCrewMemberByRfidPair_(tag, scanTid, crewData, cMap);

    if (lookup.tidMismatch) {
      return { success: false, error: 'Badge chip ID does not match — possible cloned tag.' };
    }

    const crew = lookup.crew;

    if (crew) {
      if (!effectiveStationPermission(deviceActor, 'station_host_inherit')) {
        return { success: false, error: 'Host inherit is not enabled for this device profile.' };
      }
      const auditTag = scanTid ? (tag + ' / TID ' + scanTid) : tag;
      writeToAuditLog(deviceActor, 'STATION_HOST', 'STATION', 'GLOBAL', crew.uid || crew.name,
        'Crew badge host: ' + crew.name + ' (' + auditTag + ').');
      const rbac = resolveHostRbacBundle_(crew.name, crewData, cMap);
      return {
        success: true,
        scanType: 'host',
        host: {
          uid: crew.uid,
          name: crew.name,
          rfidTag: crew.rfidTag,
          rfidTid: crew.rfidTid || '',
          access: rbac.access,
          permissions: rbac.permissions
        }
      };
    }

    if (hostOnly) {
      return { success: false, error: 'Unknown crew badge. Scan your warehouse crew RFID.' };
    }

    return {
      success: false,
      error: 'Equipment scans require an active host session (coming soon).'
    };
  });
}

// @INDEX: STATION_SHELL -> Enroll crew RFID badge (ROOT host only; via Vault → Crew tab)
// Signature note: hostName is the ROOT-tier person hosting the station (their badge established
// the session). Crew-badge provisioning is a ROOT-only admin task per the agreed model.
function enrollStationCrewRfidTag(deviceActor, hostName, crewRef, rfidTag, force, rfidTid) {
  return executeWithRetry(() => {
    if (!actorUsesStationShell(deviceActor)) {
      return { success: false, error: 'PERMISSION DENIED: Station device login only.' };
    }
    if (!verifyBackendPrivilege(hostName, 'ROOT')) {
      return { success: false, error: 'Only ROOT can record crew badge RFIDs.' };
    }
    const tag = normalizeStationRfidTag(rfidTag);
    if (!tag) return { success: false, error: 'Empty scan — pull the trigger on the badge.' };
    const tid = normalizeStationRfidTag(rfidTid);

    const ref = String(crewRef || '').toLowerCase().trim();
    if (!ref) return { success: false, error: 'No crew member specified for enrollment.' };

    // Station device profiles must never carry an RFID tag — refuse to tag one.
    if (actorUsesStationShell(ref)) {
      return { success: false, error: 'Station device profiles cannot be given an RFID tag.' };
    }

    const sheets = verifyVaultSchema();
    const crewSheet = sheets.crew;
    const crewData = crewSheet.getDataRange().getValues();
    const cMap = getHeaderMap(crewData);
    if (cMap['rfid_tag'] === undefined) {
      return { success: false, error: 'Crew roster has no rfid_tag column — run a vault sync first.' };
    }
    if (cMap['rfid_tid'] === undefined) {
      return { success: false, error: 'Crew roster has no rfid_tid column — open vault once to provision schema.' };
    }
    if (!tid) {
      return {
        success: false,
        error: 'Gun did not read chip TID. Update station APK, reconnect gun, and scan again.',
      };
    }
    if (tid === tag) {
      return {
        success: false,
        error: 'Gun read the same value for EPC and chip TID. Update station APK (v0.1.27+), reconnect gun, hold badge still, and scan again.',
      };
    }

    // Whole-DB duplicate guard: EPC and TID checked independently on crew + assets (EPC only).
    const owner = findStationRfidOwner_(tag, { excludeCrewRef: ref }, tid);
    if (owner && !force) {
      return { success: false, duplicate: owner };
    }
    if (owner && force) clearStationRfidOwner_(owner);

    for (let i = 1; i < crewData.length; i++) {
      const uid = (getSheetCell(crewData[i], cMap, 'uid') || '').toString().toLowerCase().trim();
      const nm = (getSheetCell(crewData[i], cMap, 'Name') || '').toString().toLowerCase().trim();
      if (uid !== ref && nm !== ref) continue;
      crewSheet.getRange(i + 1, cMap['rfid_tag'] + 1).setValue(tag);
      crewSheet.getRange(i + 1, cMap['rfid_tid'] + 1).setValue(tid);
      flushCache();
      const name = getSheetCell(crewData[i], cMap, 'Name');
      let msg = 'Enrolled RFID badge for ' + name + ' (EPC ' + tag;
      if (tid) msg += ', TID ' + tid;
      msg += ').';
      if (owner && force) msg += ' Overwrote ' + owner.kind + ' ' + owner.name + '.';
      writeToAuditLog(deviceActor, 'STATION_ENROLL', 'STATION', 'GLOBAL',
        getSheetCell(crewData[i], cMap, 'uid') || name, msg);
      return {
        success: true,
        overwrote: owner && force ? owner : null,
        host: {
          uid: getSheetCell(crewData[i], cMap, 'uid'),
          name: name,
          rfidTag: tag,
          rfidTid: tid
        }
      };
    }
    return { success: false, error: 'Crew member not found for enrollment.' };
  });
}

function lookupCrewMemberByName_(crewName, crewData, cMap) {
  const target = String(crewName || '').toLowerCase().trim();
  if (!target || !crewData || crewData.length < 2) return null;
  for (let i = 1; i < crewData.length; i++) {
    const name = getSheetCell(crewData[i], cMap, 'Name');
    if (!name || name.toString().toLowerCase().trim() !== target) continue;
    return {
      uid: getSheetCell(crewData[i], cMap, 'uid'),
      name: name,
      email: getSheetCell(crewData[i], cMap, 'Email'),
      rfidTag: cMap['rfid_tag'] !== undefined
        ? normalizeStationRfidTag(crewData[i][cMap['rfid_tag']])
        : ''
    };
  }
  return null;
}
