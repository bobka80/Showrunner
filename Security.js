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
  'event_view_pricing', 'view_month_roster', 'view_logistics', 'task_manage_global', 'task_manage_personal',
  'hr_view_rates', 'fin_view_roi', 'fin_view_internal'
];

function isTruthyCell(val) {
  return val === true || val === 'TRUE' || val === 'true' || val === 1 || val === '1';
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
      sysAccess: getSheetCell(roleData[i], rMap, 'sysAccess')
    };
    IAM_PERMISSION_KEYS.forEach(k => {
      if (rMap[k] !== undefined) entry[k] = isTruthyCell(roleData[i][rMap[k]]);
    });
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
        
        let bundle = {};
        let isTunneling = false;

        // DYNAMIC MATRIX LOOKUP (Reads straight from the Sheet)
        if (roleId !== "") {
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

        // PERMANENT SUPERADMIN OVERRIDE: Prevent the system owner from ever getting locked out.
        if (dbName === 'bogdan') {
            sysAccess = 'ROOT';
            bundle.db_view_assets = true;
            bundle.db_view_vehicles = true;
            bundle.db_view_warehouses = true;
            bundle.db_view_clients = true;
            bundle.db_edit_assets = true;
            bundle.db_delete_assets = true;
        }

        return { success: true, name: crewData[i][cMap['Name']] || hardName, access: sysAccess, permissions: bundle, tunnelingActive: isTunneling }; 
      }
    }
    
    let headerKeys = Object.keys(cMap).filter(k => k.length > 0 && !k.includes(' ')).join(', ');
    return { success: false, error: `Login Failed. Checked ${crewData.length - 1} rows. Input: '${crewName}'/'${passcode}'. Headers: [${headerKeys}]. ` + debugLog.join(' | ') };
  });
}

// ==========================================
// --- BACKEND RBAC GATEWAY VERIFIER ---
// ==========================================
function verifyBackendPrivilege(crewName, requiredTier) {
    if (!crewName) return false;
    if (crewName.toLowerCase().trim() === 'bogdan') return true; // Bogdan exclusive ROOT bypass
    
    const sheets = verifyVaultSchema(true);
    const crewData = getSheetData(sheets.crew);
    const roleData = getSheetData(sheets.roles);
    const cMap = getHeaderMap(crewData);
    const rMap = getHeaderMap(roleData);
    
    for (let i = 0; i < crewData.length; i++) {
        let mappedName = cMap['Name'] !== undefined ? crewData[i][cMap['Name']] : undefined;
        let hardName = crewData[i][2];
        let dbNameRaw = mappedName || hardName;
        let dbName = dbNameRaw ? dbNameRaw.toString().toLowerCase().trim() : "";
        
        if (dbName === crewName.toLowerCase().trim()) {
            let sysAccess = crewData[i][cMap['System_Access']] ? crewData[i][cMap['System_Access']].toString().toUpperCase().trim() : "";
            
            let roleId = crewData[i][cMap['Role_ID']] ? crewData[i][cMap['Role_ID']].toString().trim() : "";
            if (roleId !== "") {
                for (let r = 1; r < roleData.length; r++) {
                    if (crewRoleRefMatchesRow(roleId, roleData[r], rMap)) {
                        const roleSys = getSheetCell(roleData[r], rMap, 'sysAccess');
                        if (roleSys) sysAccess = roleSys.toUpperCase();
                        if (sysAccess === 'ROOT') return true;
                        return isTruthyCell(roleData[r][rMap[requiredTier]]);
                    }
                }
            }
            if (sysAccess === 'ROOT') return true;
            return false;
        }
    }
    return false;
}

// ==========================================
// --- USER SECURITY PROFILE EXTRACTOR ---
// ==========================================
// @INDEX: SECURITY -> User Security Profile Extractor
function getUserSecurityProfile(crewName) {
  if (!crewName) return { email: null, uid: null, tunneling: false };
  if (crewName.toLowerCase().trim() === 'bogdan') return { email: 'bobby@showrider.com', uid: 'UID_BOGDAN', tunneling: false };

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
      let isTunneling = false;
      for (let r = 1; r < roleData.length; r++) {
        if (crewRoleRefMatchesRow(roleId, roleData[r], rMap)) {
            isTunneling = isTruthyCell(roleData[r][rMap['Is_Tunneling']]);
            break;
        }
      }
      return { email: email, uid: uid, tunneling: isTunneling };
    }
  }
  return { email: null, uid: null, tunneling: false };
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
    updates.forEach(update => {
      const normalizedRoleId = normalizeCrewRoleId(update.roleId, roleData, rMap);
      for(let i = 1; i < data.length; i++) {
         if (data[i][cMap['uid']] && data[i][cMap['uid']].toString().trim() === update.uid.trim()) {
            if(cMap['Job_Title'] !== undefined) data[i][cMap['Job_Title']] = update.jobTitle;  
            if(cMap['Department'] !== undefined) data[i][cMap['Department']] = update.dept;      
            if(cMap['Meal'] !== undefined) data[i][cMap['Meal']] = update.meal;      
            if(cMap['Role_ID'] !== undefined) data[i][cMap['Role_ID']] = normalizedRoleId;    
            if(cMap['Passcode'] !== undefined) data[i][cMap['Passcode']] = update.passcode; 
            if(cMap['Payroll_Multiplier'] !== undefined) data[i][cMap['Payroll_Multiplier']] = update.payrollMultiplier; 
            if(cMap['uid'] !== undefined) updatedUids.push(data[i][cMap['uid']]);
            hasChanges = true;
            break;
         }
      }
    });
    if (hasChanges) {
        crewSheet.getRange(1, 1, data.length, data[0].length).setValues(data);
        if (typeof flushCache !== 'undefined') flushCache();
        writeToAuditLog(adminName, "UPDATE", "IAM", "GLOBAL", updatedUids.length > 0 ? updatedUids.join(', ') : "Directory Sync", `Updated ${updates.length} user profile(s).`);
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
    if (rMap['sysAccess'] !== undefined) newRow[rMap['sysAccess']] = roleData.sysAccess;
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
