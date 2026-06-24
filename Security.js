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
    map['System_Access'] = map['systemaccess'] !== undefined ? map['systemaccess'] : map['sysaccess'] !== undefined ? map['sysaccess'] : map['System_Access'];
    map['sysAccess'] = map['System_Access'];
    map['Name'] = map['name'] !== undefined ? map['name'] : map['crewname'] !== undefined ? map['crewname'] : map['Name'];
    map['Passcode'] = map['passcode'] !== undefined ? map['passcode'] : map['password'] !== undefined ? map['password'] : map['Passcode'];
  }
  return map;
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
            if (roleData[r][rMap['Role_ID']] && roleData[r][rMap['Role_ID']].toString().trim() === roleId) {
              sysAccess                  = roleData[r][rMap['System_Access']] ? roleData[r][rMap['System_Access']].toString().toUpperCase().trim() : sysAccess;
              isTunneling                = (roleData[r][rMap['Is_Tunneling']] === true);
              bundle.sys_manage_users    = (roleData[r][rMap['sys_manage_users']] === true);
              bundle.sys_audit_logs      = (roleData[r][rMap['sys_audit_logs']] === true);
              bundle.log_edit_master     = (roleData[r][rMap['log_edit_master']] === true);
              bundle.log_edit_phase      = (roleData[r][rMap['log_edit_phase']] === true);
              bundle.log_view_unassigned = (roleData[r][rMap['log_view_unassigned']] === true);
              bundle.wh_edit_registry    = (roleData[r][rMap['wh_edit_registry']] === true);
              bundle.wh_edit_kits        = (roleData[r][rMap['wh_edit_kits']] === true);
              bundle.wh_prophylactic     = (roleData[r][rMap['wh_prophylactic']] === true);
              bundle.task_manage_all     = (roleData[r][rMap['task_manage_all']] === true);
              bundle.task_edit_self      = (roleData[r][rMap['task_edit_self']] === true);
              bundle.hr_view_rates       = (roleData[r][rMap['hr_view_rates']] === true);
              bundle.fin_view_roi        = (roleData[r][rMap['fin_view_roi']] === true);
              bundle.fin_view_internal   = (roleData[r][rMap['fin_view_internal']] === true);
              break; 
            }
          }
        }

        // PERMANENT SUPERADMIN OVERRIDE: Prevent the system owner from ever getting locked out.
        if (dbName === 'bogdan') {
            sysAccess = 'ROOT';
            bundle.sys_manage_users = true;
            bundle.sys_manage_roles = true;
            bundle.sys_audit_logs = true;
            bundle.db_view_assets = true;
            bundle.db_view_vehicles = true;
            bundle.db_view_warehouses = true;
            bundle.db_view_clients = true;
            bundle.log_edit_master = true;
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
                    if (roleData[r][rMap['Role_ID']] && roleData[r][rMap['Role_ID']].toString().trim() === roleId) {
                        sysAccess = roleData[r][rMap['System_Access']] ? roleData[r][rMap['System_Access']].toString().toUpperCase().trim() : sysAccess;
                        if (sysAccess === 'ROOT') return true;
                        return (roleData[r][rMap[requiredTier]] === true);
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
        if (roleData[r][rMap['Role_ID']] && roleData[r][rMap['Role_ID']].toString().trim() === roleId) { 
            isTunneling = (roleData[r][rMap['Is_Tunneling']] === true); 
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

    let rolesList = [];
    let roleMap = {};
    for (let i = 1; i < roleData.length; i++) {
      let rUid = roleData[i][rMap['uid']] ? roleData[i][rMap['uid']].toString().trim() : "";
      let rId = roleData[i][rMap['Role_ID']] ? roleData[i][rMap['Role_ID']].toString().trim() : "";
      let rName = roleData[i][rMap['Role_Name']] ? roleData[i][rMap['Role_Name']].toString().trim() : "";
      let displayName = rName || rId || "Unknown Role";
      if (rUid) roleMap[rUid.toLowerCase()] = displayName;
      if (rId) roleMap[rId.toLowerCase()] = displayName;
      if (rName) roleMap[rName.toLowerCase()] = displayName;

      if (rId || rUid) {
         rolesList.push({ id: rUid || rId, name: displayName });
      }
    }

    // Now securely inject the role name into the crew list
    crewList.forEach(crew => {
       crew.roleName = roleMap[crew.roleId.toLowerCase()] || crew.roleId;
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
    let rolesList = [];
    let roleMap = {};
    for (let i = 1; i < roleData.length; i++) {
      let rUid = roleData[i][rMap['uid']] ? roleData[i][rMap['uid']].toString().trim() : "";
      let rId = roleData[i][rMap['Role_ID']] ? roleData[i][rMap['Role_ID']].toString().trim() : "";
      let rName = roleData[i][rMap['Role_Name']] ? roleData[i][rMap['Role_Name']].toString().trim() : "";
      let displayName = rName || rId || "Unknown Role";
      if (rUid) roleMap[rUid.toLowerCase()] = displayName;
      if (rId) roleMap[rId.toLowerCase()] = displayName;
      if (rName) roleMap[rName.toLowerCase()] = displayName;

      if (rId || rUid) {
         rolesList.push({ id: rUid || rId, name: displayName });
      }
    }

    // Now securely inject the role name into the crew list
    crewList.forEach(crew => {
       crew.roleName = roleMap[crew.roleId.toLowerCase()] || crew.roleId;
    });

    return { roles: rolesList, crew: crewList };
  });
}

function saveDirectoryUpdate(adminName, updates) {
  return executeWithRetry(() => {
    if (!verifyBackendPrivilege(adminName, "ROOT")) return { success: false, message: "🛑 API DENIED: ROOT privileges required." };
    const sheets = verifyVaultSchema();
    const crewSheet = sheets.crew;
    const data = crewSheet.getDataRange().getValues();
    const cMap = getHeaderMap(data);
    
    let hasChanges = false;
    let updatedUids = [];
    updates.forEach(update => {
      for(let i = 1; i < data.length; i++) {
         if (data[i][cMap['uid']] && data[i][cMap['uid']].toString().trim() === update.uid.trim()) {
            if(cMap['Job_Title'] !== undefined) data[i][cMap['Job_Title']] = update.jobTitle;  
            if(cMap['Department'] !== undefined) data[i][cMap['Department']] = update.dept;      
            if(cMap['Meal'] !== undefined) data[i][cMap['Meal']] = update.meal;      
            if(cMap['Role_ID'] !== undefined) data[i][cMap['Role_ID']] = update.roleId;    
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

    // Build array dynamically based on headers
    let generatedUid = Utilities.getUuid();
    let newRow = new Array(data[0].length).fill("");
    if(rMap['uid'] !== undefined) newRow[rMap['uid']] = generatedUid;
    if(rMap['Role_ID'] !== undefined) newRow[rMap['Role_ID']] = roleData.name;
    if(rMap['System_Access'] !== undefined) newRow[rMap['System_Access']] = roleData.sysAccess;
    if(rMap['Is_Tunneling'] !== undefined) newRow[rMap['Is_Tunneling']] = roleData.Is_Tunneling;
    if(rMap['sys_manage_users'] !== undefined) newRow[rMap['sys_manage_users']] = roleData.sys_manage_users;
    if(rMap['sys_audit_logs'] !== undefined) newRow[rMap['sys_audit_logs']] = roleData.sys_audit_logs;
    if(rMap['log_edit_master'] !== undefined) newRow[rMap['log_edit_master']] = roleData.log_edit_master;
    if(rMap['log_edit_phase'] !== undefined) newRow[rMap['log_edit_phase']] = roleData.log_edit_phase;
    if(rMap['log_view_unassigned'] !== undefined) newRow[rMap['log_view_unassigned']] = roleData.log_view_unassigned;
    if(rMap['wh_edit_registry'] !== undefined) newRow[rMap['wh_edit_registry']] = roleData.wh_edit_registry;
    if(rMap['wh_edit_kits'] !== undefined) newRow[rMap['wh_edit_kits']] = roleData.wh_edit_kits;
    if(rMap['wh_prophylactic'] !== undefined) newRow[rMap['wh_prophylactic']] = roleData.wh_prophylactic;
    if(rMap['task_manage_all'] !== undefined) newRow[rMap['task_manage_all']] = roleData.task_manage_all;
    if(rMap['task_edit_self'] !== undefined) newRow[rMap['task_edit_self']] = roleData.task_edit_self;
    if(rMap['hr_view_rates'] !== undefined) newRow[rMap['hr_view_rates']] = roleData.hr_view_rates;
    if(rMap['fin_view_roi'] !== undefined) newRow[rMap['fin_view_roi']] = roleData.fin_view_roi;
    if(rMap['fin_view_internal'] !== undefined) newRow[rMap['fin_view_internal']] = roleData.fin_view_internal;

    // Update if exists
    for (let i = 1; i < data.length; i++) {
      if (data[i][rMap['Role_ID']] && data[i][rMap['Role_ID']].toString().toLowerCase() === roleData.name.toLowerCase()) {
        let targetUid = generatedUid;
        if(rMap['uid'] !== undefined && data[i][rMap['uid']]) {
            newRow[rMap['uid']] = data[i][rMap['uid']]; // Preserve UID
            targetUid = data[i][rMap['uid']];
        }
        roleSheet.getRange(i + 1, 1, 1, newRow.length).setValues([newRow]);
        if (typeof flushCache !== 'undefined') flushCache();
        writeToAuditLog(adminName, "UPDATE", "IAM_ROLES", "GLOBAL", targetUid, "Modified role permissions.");
        return { success: true, message: `Role '${roleData.name}' updated successfully.` };
      }
    }
    roleSheet.appendRow(newRow);
    if (typeof flushCache !== 'undefined') flushCache();
    writeToAuditLog(adminName, "CREATE", "IAM_ROLES", "GLOBAL", generatedUid, "Created new role.");
    return { success: true, message: `New Role '${roleData.name}' created successfully.` };
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
    if(cMap['Role_ID'] !== undefined) newRow[cMap['Role_ID']] = payload.roleId;
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
