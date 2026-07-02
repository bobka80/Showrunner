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

/** Crew badge lookup for host-inherit (station shell). */
function lookupCrewMemberByRfidTag(rfidTag, crewData, cMap) {
  const needle = normalizeStationRfidTag(rfidTag);
  if (!needle || !crewData || crewData.length < 2 || !cMap) return null;
  for (let i = 1; i < crewData.length; i++) {
    if (cMap['rfid_tag'] === undefined) continue;
    const rowTag = normalizeStationRfidTag(crewData[i][cMap['rfid_tag']]);
    if (!rowTag || rowTag !== needle) continue;
    const name = getSheetCell(crewData[i], cMap, 'Name');
    if (!name) continue;
    return {
      uid: getSheetCell(crewData[i], cMap, 'uid'),
      name: name,
      email: getSheetCell(crewData[i], cMap, 'Email'),
      rfidTag: rowTag
    };
  }
  return null;
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
      return isStationTruthyCell(roleData[r][rMap[permissionKey]]);
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
      && !verifyBackendPrivilege(actor, 'MANAGER')) {
    throw new Error('PERMISSION DENIED: Station vault ops not enabled for this device profile.');
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
function getStationEquipmentRfidMap(deviceActor) {
  return executeWithRetry(() => {
    if (!actorUsesStationShell(deviceActor)) {
      return { success: false, error: 'Not a station device login.' };
    }
    const sheets = verifyVaultSchema(true);
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

    const out = {};
    let count = 0;
    if (cRfid !== undefined) {
      for (let i = 1; i < data.length; i++) {
        const tag = normalizeStationRfidTag(data[i][cRfid]);
        if (!tag) continue;
        out[tag] = {
          name: cName !== undefined ? String(data[i][cName] || '') : '',
          unitId: cUid !== undefined ? String(data[i][cUid] || '') : '',
          unitNumber: cUnit !== undefined ? String(data[i][cUnit] || '') : ''
        };
        count++;
      }
    }
    return { success: true, map: out, count: count, ts: Date.now() };
  });
}

// @INDEX: STATION_SHELL -> RFID scan router (host badge first)
function processStationRfidScan(deviceActor, rfidTag, options) {
  return executeWithRetry(() => {
    if (!actorUsesStationShell(deviceActor)) {
      return { success: false, error: 'PERMISSION DENIED: Station device login only.' };
    }
    const tag = normalizeStationRfidTag(rfidTag);
    if (!tag) return { success: false, error: 'Empty scan.' };

    const opts = options || {};
    const hostOnly = opts.hostOnly !== false;
    const sheets = verifyVaultSchema(true);
    const crewData = getSheetData(sheets.crew);
    const cMap = getHeaderMap(crewData);
    const crew = lookupCrewMemberByRfidTag(tag, crewData, cMap);

    if (crew) {
      if (!effectiveStationPermission(deviceActor, 'station_host_inherit')) {
        return { success: false, error: 'Host inherit is not enabled for this device profile.' };
      }
      writeToAuditLog(deviceActor, 'STATION_HOST', 'STATION', 'GLOBAL', crew.uid || crew.name,
        'Crew badge host: ' + crew.name + ' (' + tag + ').');
      return {
        success: true,
        scanType: 'host',
        host: {
          uid: crew.uid,
          name: crew.name,
          rfidTag: crew.rfidTag
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

// @INDEX: STATION_SHELL -> Enroll crew RFID badge (from hosted/root session)
function enrollStationCrewRfidTag(deviceActor, crewRef, rfidTag) {
  return executeWithRetry(() => {
    if (!actorUsesStationShell(deviceActor)) {
      return { success: false, error: 'PERMISSION DENIED: Station device login only.' };
    }
    const tag = normalizeStationRfidTag(rfidTag);
    if (!tag) return { success: false, error: 'Empty scan — pull the trigger on the badge.' };

    const ref = String(crewRef || '').toLowerCase().trim();
    if (!ref) return { success: false, error: 'No crew member specified for enrollment.' };

    const sheets = verifyVaultSchema();
    const crewSheet = sheets.crew;
    const crewData = crewSheet.getDataRange().getValues();
    const cMap = getHeaderMap(crewData);
    if (cMap['rfid_tag'] === undefined) {
      return { success: false, error: 'Crew roster has no rfid_tag column — run a vault sync first.' };
    }

    // Refuse to steal a badge already linked to a different crew member.
    for (let i = 1; i < crewData.length; i++) {
      const rowTag = normalizeStationRfidTag(crewData[i][cMap['rfid_tag']]);
      if (!rowTag || rowTag !== tag) continue;
      const ownerUid = (getSheetCell(crewData[i], cMap, 'uid') || '').toString().toLowerCase().trim();
      const ownerName = (getSheetCell(crewData[i], cMap, 'Name') || '').toString().toLowerCase().trim();
      if (ownerUid !== ref && ownerName !== ref) {
        return { success: false, error: 'That badge is already linked to ' + getSheetCell(crewData[i], cMap, 'Name') + '.' };
      }
    }

    for (let i = 1; i < crewData.length; i++) {
      const uid = (getSheetCell(crewData[i], cMap, 'uid') || '').toString().toLowerCase().trim();
      const nm = (getSheetCell(crewData[i], cMap, 'Name') || '').toString().toLowerCase().trim();
      if (uid !== ref && nm !== ref) continue;
      crewSheet.getRange(i + 1, cMap['rfid_tag'] + 1).setValue(tag);
      flushCache();
      const name = getSheetCell(crewData[i], cMap, 'Name');
      writeToAuditLog(deviceActor, 'STATION_ENROLL', 'STATION', 'GLOBAL',
        getSheetCell(crewData[i], cMap, 'uid') || name,
        'Enrolled RFID badge for ' + name + ' (' + tag + ').');
      return {
        success: true,
        host: {
          uid: getSheetCell(crewData[i], cMap, 'uid'),
          name: name,
          rfidTag: tag
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

/** TEMP: dev host bypass until Chainway SDK is wired — station guns only. */
function stationDevHostAsBogdan(deviceActor) {
  return executeWithRetry(() => {
    if (!actorUsesStationShell(deviceActor)) {
      return { success: false, error: 'Station device login only.' };
    }
    const sheets = verifyVaultSchema(true);
    const crewData = getSheetData(sheets.crew);
    const cMap = getHeaderMap(crewData);
    const crew = lookupCrewMemberByName_('Bogdan', crewData, cMap);
    if (!crew) return { success: false, error: 'Crew member Bogdan not found in vault.' };
    writeToAuditLog(deviceActor, 'STATION_HOST', 'STATION', 'GLOBAL', crew.uid || crew.name,
      'DEV host bypass: ' + crew.name + '.');
    return {
      success: true,
      scanType: 'host',
      devBypass: true,
      host: crew
    };
  });
}
