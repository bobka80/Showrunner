/**
 * SM Showrunner (smuruner) - Clean 8 Architecture
 * Resources_Core.js - System Core & Schema Engine
 * Sync: 2026-06-25 — getVaultSheetId / getEngineSheetId registry getters
 */

const VAULT_SHEET_ID = '1EzqvZQM5VanEB1_XxZT7lRd8YfXSTMcBVRVx3mGElz8';
const ENGINE_SHEET_ID = '1AIa5GuEq4J4mDUqfI2Sp5RkAt6RW-aUd3VG0anB-PFk';
const AUDIT_LOG_SHEET_ID = '1gR70dun6Xc4Q_njxd2PXrT9rty_1X_4qiZby8V4RyOA';
const AUDIT_DB_SHEET_ID = '1UdEONWScrTQSoa_spIEjfN3lJdMcxu9zLCXVZZcJbG8';

const SYSTEM_ROOT_ID = '1yVRU7ZsYwrazsIkSlt0-afYFLWtScMre';
const DB_BACKUP_FOLDER_NAME = '05_DATABASE_BACKUPS';
const LIVE_DATABASE_FOLDER_ID = '1EAgUzjbwq5CootjKmZhQP3Mfm2VYsZox';
const LIVE_ENGINE_FILE_NAME = 'ENGINE';
const LIVE_VAULT_FILE_NAME = 'VAULT';
const REPLACED_DB_FOLDER_ID = '1aZSru-d8OryHpNCooPm78oWdFjSauTPN';

function getLiveDatabaseFolder() {
  return DriveApp.getFolderById(LIVE_DATABASE_FOLDER_ID);
}

function getActiveSheetId(propKey, fallbackId) {
  try {
    const v = PropertiesService.getScriptProperties().getProperty(propKey);
    if (v && String(v).length > 10) return v;
  } catch (e) { /* ignore */ }
  return fallbackId;
}

function setActiveSheetId(propKey, id) {
  PropertiesService.getScriptProperties().setProperty(propKey, String(id));
}

function getEngineSheetId() { return getActiveSheetId('ACTIVE_ENGINE_SHEET_ID', ENGINE_SHEET_ID); }
function getVaultSheetId() { return getActiveSheetId('ACTIVE_VAULT_SHEET_ID', VAULT_SHEET_ID); }
function getAuditLogSheetId() { return getActiveSheetId('ACTIVE_AUDIT_LOG_SHEET_ID', AUDIT_LOG_SHEET_ID); }
function getAuditDbSheetId() { return getActiveSheetId('ACTIVE_AUDIT_DB_SHEET_ID', AUDIT_DB_SHEET_ID); }

let cachedEngineSheets = null;
let cachedVaultSheets = null;
let vaultAssetCache = null;
let sheetDataCache = {};

// @INDEX: SCHEMA_VAULT -> Relational Schema Engine
function verifyVaultSchema(readOnly = false) {
  if (cachedVaultSheets && readOnly) return cachedVaultSheets;
  const ss = SpreadsheetApp.openById(getVaultSheetId());
  
  const sheetsArr = ss.getSheets();
  const sm = {};
  for (let i = 0; i < sheetsArr.length; i++) sm[sheetsArr[i].getName()] = sheetsArr[i];

  // TABLE 0: SYSTEM DEPARTMENTS (Relational Matrix)
  let deptSheet = sm["System_Departments"];
  if (!deptSheet) {
      deptSheet = ss.insertSheet("System_Departments");
      deptSheet.appendRow(["uid", "name", "color"]);
      deptSheet.getRange(1, 1, 1, 3).setFontWeight("bold").setBackground("#6b7280").setFontColor("#ffffff");
      deptSheet.setFrozenRows(1);
      deptSheet.appendRow(["dept_lighting", "Lighting", "#f59e0b"]);
      deptSheet.appendRow(["dept_audio", "Audio", "#3b82f6"]);
      deptSheet.appendRow(["dept_video", "Video", "#10b981"]);
      deptSheet.appendRow(["dept_rigging", "Rigging", "#ef4444"]);
      deptSheet.appendRow(["dept_trucks", "Trucks", "#6b7280"]);
  }

  // TABLE 0.5: ASSET TAGS DICTIONARY (Relational Hierarchy)
  let tagSheet = sm["Asset_Tags"];
  const tagHeaders = ["uid", "parent_uid", "name", "color", "shortcut", "in_formula", "order_index"];
  if (!tagSheet) {
      tagSheet = ss.insertSheet("Asset_Tags");
      tagSheet.appendRow(tagHeaders);
      tagSheet.getRange(1, 1, 1, tagHeaders.length).setFontWeight("bold").setBackground("#a855f7").setFontColor("#ffffff");
      tagSheet.setFrozenRows(1);
  } else {
      if (tagSheet.getMaxColumns() < tagHeaders.length) tagSheet.insertColumnsAfter(tagSheet.getMaxColumns(), tagHeaders.length - tagSheet.getMaxColumns());
      tagSheet.getRange(1, 1, 1, tagHeaders.length).setFontWeight("bold").setBackground("#a855f7").setFontColor("#ffffff");
  }

  // Intelligent Sheet Name Resiliency
  let resolveSheet = (possibleNames) => {
      for (let n of possibleNames) { if (sm[n]) return sm[n]; }
      // Fallback: search by partial match
      for (let n in sm) {
          let clean = n.toLowerCase().replace(/[\s_]+/g, '');
          for (let p of possibleNames) {
              if (clean.includes(p.toLowerCase().replace(/[\s_]+/g, ''))) return sm[n];
          }
      }
      return undefined;
  };
  
  let roleSheetObj = resolveSheet(["IAM Roles", "Roles", "IAM"]);

  cachedVaultSheets = { tags: tagSheet, departments: deptSheet, crew: sm["Crew_Roster"], roles: roleSheetObj, config: sm["System_Config"], clients: sm["Clients"], vehicles: sm["Vehicles"], warehouses: sm["Warehouses"], subzones: sm["Subzones"], areas: sm["Storage_Areas"], assets: sm["Assets"], vendors: sm["Vendors"] };
  if (readOnly) return cachedVaultSheets;

  // TABLE 1: CREW ROSTER
  let crewSheet = sm["Crew_Roster"];
  const crewHeaders = ["uid", "Email", "Name", "Job_Title", "Department", "Meal", "IsManager", "IsFreelancer", "System_Access", "Role_ID", "Passcode", "OrderIndex", "Payroll_Multiplier"];
  if (!crewSheet) { 
    crewSheet = ss.insertSheet("Crew_Roster"); 
    crewSheet.appendRow(crewHeaders); 
    crewSheet.getRange(1, 1, 1, crewHeaders.length).setFontWeight("bold").setBackground("#064e3b").setFontColor("#ffffff"); 
    crewSheet.setFrozenRows(1); 
  } else {
    if (crewSheet.getMaxColumns() < crewHeaders.length) crewSheet.insertColumnsAfter(crewSheet.getMaxColumns(), crewHeaders.length - crewSheet.getMaxColumns());
    crewSheet.getRange(1, 1, 1, crewHeaders.length).setFontWeight("bold").setBackground("#064e3b").setFontColor("#ffffff");
  }

  // TABLE 2: IAM ROLES (current credential matrix — legacy Role_Permissions is ignored)
  let roleSheet = resolveSheet(["IAM Roles", "Roles", "IAM"]);
  const iamRoleHeaders = [
    "Role_ID", "Role_Name", "sysAccess", "Is_Tunneling",
    "db_view_assets", "db_edit_assets", "db_delete_assets",
    "db_view_vehicles", "db_view_warehouses", "db_view_clients",
    "event_create_standard", "event_create_crossrent", "event_edit_timeline",
    "event_assets_window", "event_view_pricing", "view_month_roster", "view_logistics",
    "task_manage_global", "task_manage_personal",
    "hr_view_rates", "fin_view_roi", "fin_view_internal"
  ];
  if (!roleSheet) {
    roleSheet = ss.insertSheet("IAM Roles");
    roleSheet.appendRow(iamRoleHeaders);
    roleSheet.getRange(1, 1, 1, iamRoleHeaders.length).setFontWeight("bold").setBackground("#b91c1c").setFontColor("#ffffff");
    roleSheet.setFrozenRows(1);
    let getU = Utilities.getUuid;
    roleSheet.appendRow([getU(), "Admin", "ROOT", false, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true]);
    let checkboxRule = SpreadsheetApp.newDataValidation().requireCheckbox().build();
    roleSheet.getRange(2, 4, 50, iamRoleHeaders.length - 3).setDataValidation(checkboxRule);
  } else {
    let headers = roleSheet.getRange(1, 1, 1, Math.max(1, roleSheet.getLastColumn())).getValues()[0]
      .map(h => String(h || "").trim());
    iamRoleHeaders.forEach(h => {
      let norm = h.toLowerCase().replace(/[\s_]+/g, "");
      let found = headers.some(x => x.toLowerCase().replace(/[\s_]+/g, "") === norm);
      if (!found) {
        roleSheet.insertColumnAfter(roleSheet.getLastColumn());
        roleSheet.getRange(1, roleSheet.getLastColumn()).setValue(h);
        headers.push(h);
      }
    });
    roleSheet.getRange(1, 1, 1, roleSheet.getLastColumn()).setFontWeight("bold").setBackground("#b91c1c").setFontColor("#ffffff");
    roleSheet.setFrozenRows(1);
  }

  let configSheet = sm["System_Config"];
  const configHeaders = ["uid", "Asset_Key", "Asset_Payload"];
  if (!configSheet) { 
    configSheet = ss.insertSheet("System_Config"); 
    configSheet.appendRow(configHeaders); 
    configSheet.getRange(1, 1, 1, configHeaders.length).setFontWeight("bold").setBackground("#3b82f6").setFontColor("#ffffff"); 
    configSheet.setFrozenRows(1); 
  } else {
    if (configSheet.getMaxColumns() < configHeaders.length) configSheet.insertColumnsAfter(configSheet.getMaxColumns(), configHeaders.length - configSheet.getMaxColumns());
    configSheet.getRange(1, 1, 1, configHeaders.length).setFontWeight("bold").setBackground("#3b82f6").setFontColor("#ffffff");
  }
  
  let clientSheet = sm["Clients"];
  const clientHeaders = ["uid", "name", "contact_email", "phone", "notes"];
  if (!clientSheet) {
      clientSheet = ss.insertSheet("Clients");
      clientSheet.appendRow(clientHeaders);
      clientSheet.getRange(1, 1, 1, clientHeaders.length).setFontWeight("bold").setBackground("#2563eb").setFontColor("#ffffff"); clientSheet.setFrozenRows(1);
  } else {
      if (clientSheet.getMaxColumns() < clientHeaders.length) clientSheet.insertColumnsAfter(clientSheet.getMaxColumns(), clientHeaders.length - clientSheet.getMaxColumns());
      clientSheet.getRange(1, 1, 1, clientHeaders.length).setFontWeight("bold").setBackground("#2563eb").setFontColor("#ffffff");
  }

  let vehicleSheet = sm["Vehicles"];
  const vehicleHeaders = ["uid", "name", "is_generic", "license_plate", "make_model", "vendor", "length_m", "width_m", "height_m", "max_weight_kg", "max_volume_m3", "tail_lift_kg", "Vehicle_Tier"];
  if (!vehicleSheet) {
      vehicleSheet = ss.insertSheet("Vehicles");
      vehicleSheet.appendRow(vehicleHeaders);
      vehicleSheet.getRange(1, 1, 1, vehicleHeaders.length).setFontWeight("bold").setBackground("#4b5563").setFontColor("#ffffff"); vehicleSheet.setFrozenRows(1);
      
      // Auto-seed generic fleet if the database is brand new
      let getU = Utilities.getUuid;
      vehicleSheet.appendRow([getU(), "Generic Cargo Van (Tier 1)", true, "", "", "", 3.3, 1.7, 1.9, 1000, 10.6, 0, "Tier 1"]);
      vehicleSheet.appendRow([getU(), "Generic Box Van (Tier 2)", true, "", "", "", 4.2, 2.1, 2.2, 2500, 19.4, 500, "Tier 2"]);
      vehicleSheet.appendRow([getU(), "Generic Rigid Truck (Tier 3)", true, "", "", "", 7.5, 2.4, 2.5, 12000, 45.0, 1000, "Tier 3"]);
      vehicleSheet.appendRow([getU(), "Generic Artic Trailer (Tier 4)", true, "", "", "", 13.6, 2.4, 2.6, 24000, 84.8, 0, "Tier 4"]);
  } else {
      if (vehicleSheet.getMaxColumns() < vehicleHeaders.length) vehicleSheet.insertColumnsAfter(vehicleSheet.getMaxColumns(), vehicleHeaders.length - vehicleSheet.getMaxColumns());
      vehicleSheet.getRange(1, 1, 1, vehicleHeaders.length).setFontWeight("bold").setBackground("#4b5563").setFontColor("#ffffff");
      
      // Fallback: If sheet exists but is empty, seed it
      if (vehicleSheet.getLastRow() <= 1) {
          let getU = Utilities.getUuid;
          vehicleSheet.appendRow([getU(), "Generic Cargo Van (Tier 1)", true, "", "", "", 3.3, 1.7, 1.9, 1000, 10.6, 0, "Tier 1"]);
          vehicleSheet.appendRow([getU(), "Generic Box Van (Tier 2)", true, "", "", "", 4.2, 2.1, 2.2, 2500, 19.4, 500, "Tier 2"]);
          vehicleSheet.appendRow([getU(), "Generic Rigid Truck (Tier 3)", true, "", "", "", 7.5, 2.4, 2.5, 12000, 45.0, 1000, "Tier 3"]);
          vehicleSheet.appendRow([getU(), "Generic Artic Trailer (Tier 4)", true, "", "", "", 13.6, 2.4, 2.6, 24000, 84.8, 0, "Tier 4"]);
      }
  }

  let warehouseSheet = sm["Warehouses"];
  if (!warehouseSheet) {
      warehouseSheet = ss.insertSheet("Warehouses");
      warehouseSheet.appendRow(["uid", "name", "address", "map_url", "type", "anchor_x", "anchor_y"]);
      warehouseSheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#d97706").setFontColor("#ffffff"); warehouseSheet.setFrozenRows(1);
  } else {
      if (warehouseSheet.getMaxColumns() < 7) warehouseSheet.insertColumnsAfter(warehouseSheet.getMaxColumns(), 7 - warehouseSheet.getMaxColumns());
      warehouseSheet.getRange(1, 1, 1, 7).setValues([["uid", "name", "address", "map_url", "type", "anchor_x", "anchor_y"]]).setFontWeight("bold").setBackground("#d97706").setFontColor("#ffffff");
  }

  let subzoneSheet = sm["Subzones"];
  if (!subzoneSheet) {
      subzoneSheet = ss.insertSheet("Subzones");
      subzoneSheet.appendRow(["uid", "warehouse_uid", "name", "floor", "room", "x", "y", "w", "h", "notes", "points", "elevation"]);
      subzoneSheet.getRange(1, 1, 1, 12).setFontWeight("bold").setBackground("#d97706").setFontColor("#ffffff"); subzoneSheet.setFrozenRows(1);
  } else {
      if (subzoneSheet.getMaxColumns() < 12) subzoneSheet.insertColumnsAfter(subzoneSheet.getMaxColumns(), 12 - subzoneSheet.getMaxColumns());
      subzoneSheet.getRange(1, 1, 1, 12).setValues([["uid", "warehouse_uid", "name", "floor", "room", "x", "y", "w", "h", "notes", "points", "elevation"]]).setFontWeight("bold").setBackground("#d97706").setFontColor("#ffffff");
  }

  let areaSheet = sm["Storage_Areas"];
  if (!areaSheet) {
      areaSheet = ss.insertSheet("Storage_Areas");
      areaSheet.appendRow(["uid", "subzone_uid", "name", "width_cm", "height_cm", "x_pos", "y_pos", "department", "points"]);
      areaSheet.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#d97706").setFontColor("#ffffff"); areaSheet.setFrozenRows(1);
  } else {
      if (areaSheet.getMaxColumns() < 9) areaSheet.insertColumnsAfter(areaSheet.getMaxColumns(), 9 - areaSheet.getMaxColumns());
      areaSheet.getRange(1, 1, 1, 9).setValues([["uid", "subzone_uid", "name", "width_cm", "height_cm", "x_pos", "y_pos", "department", "points"]]).setFontWeight("bold").setBackground("#d97706").setFontColor("#ffffff");
  }

  let vendorSheet = sm["Vendors"];
  const vendorHeaders = ["uid", "name", "contact_email", "phone", "notes", "vendor_type"];
  if (!vendorSheet) {
      vendorSheet = ss.insertSheet("Vendors");
      vendorSheet.appendRow(vendorHeaders);
      vendorSheet.getRange(1, 1, 1, vendorHeaders.length).setFontWeight("bold").setBackground("#8b5cf6").setFontColor("#ffffff"); vendorSheet.setFrozenRows(1);
  } else {
      if (vendorSheet.getMaxColumns() < vendorHeaders.length) vendorSheet.insertColumnsAfter(vendorSheet.getMaxColumns(), vendorHeaders.length - vendorSheet.getMaxColumns());
      vendorSheet.getRange(1, 1, 1, vendorHeaders.length).setFontWeight("bold").setBackground("#8b5cf6").setFontColor("#ffffff");
  }

  let assetSheet = sm["Assets"];
  const assetHeaders = ["uid", "kit_uid", "case_uid", "area_uid", "name", "manufacturer", "type", "weight_kg", "power_w", "rfid_tag", "status", "container_type", "nesting_level", "department", "wh_uid", "zone_uid", "dims", "price", "rental", "date_bought", "last_service", "service_interval", "tags", "unit_number", "total_quantity", "length_m", "capacity", "Serial_Number", "vendor_uid", "components"];
  if (!assetSheet) {
      assetSheet = ss.insertSheet("Assets");
      assetSheet.appendRow(assetHeaders);
      assetSheet.getRange(1, 1, 1, assetHeaders.length).setFontWeight("bold").setBackground("#10b981").setFontColor("#ffffff"); assetSheet.setFrozenRows(1);
  } else {
      if (assetSheet.getMaxColumns() < assetHeaders.length) assetSheet.insertColumnsAfter(assetSheet.getMaxColumns(), assetHeaders.length - assetSheet.getMaxColumns());
      assetSheet.getRange(1, 1, 1, assetHeaders.length).setFontWeight("bold").setBackground("#10b981").setFontColor("#ffffff");
  }
  
  cachedVaultSheets = { tags: tagSheet, departments: deptSheet, crew: crewSheet, roles: roleSheet, config: configSheet, clients: clientSheet, vehicles: vehicleSheet, warehouses: warehouseSheet, subzones: subzoneSheet, areas: areaSheet, assets: assetSheet, vendors: vendorSheet };
  return cachedVaultSheets;
}

function getCacheVersion() {
  try {
    let cache = CacheService.getScriptCache();
    let v = cache.get('DB_CACHE_VERSION');
    if (!v) { 
      let props = PropertiesService.getScriptProperties();
      v = props.getProperty('DB_CACHE_VERSION_V2');
      if (!v) { v = Date.now().toString(); props.setProperty('DB_CACHE_VERSION_V2', v); }
      cache.put('DB_CACHE_VERSION_V2', v, 21600);
    }
    return v;
  } catch(e) { return "1"; }
}

function flushCache() {
  sheetDataCache = {};
  vaultAssetCache = null;
  try { 
    let cache = CacheService.getScriptCache();
    let props = PropertiesService.getScriptProperties();
    let oldV = cache.get('DB_CACHE_VERSION_V2') || props.getProperty('DB_CACHE_VERSION_V2');
    if (oldV) cache.remove('DB_' + oldV + '_System_Config'); // Aggressive purge of the config cache
    
    let newV = Date.now().toString();
    cache.put('DB_CACHE_VERSION_V2', newV, 21600);
    props.setProperty('DB_CACHE_VERSION_V2', newV); 
  } catch(e) {}
}

// @INDEX: CACHE -> Sheet Data Caching
function getSheetData(sheet) {
  if (!sheet) { let empty = []; empty.hMap = {}; return empty; }
  
  // 🔥 CACHE TEMPORARILY DISABLED FOR DEBUGGING
  // Always fetch live data directly from the spreadsheet
  let dataMatrix = sheet.getDataRange().getValues();
  dataMatrix.hMap = getHeaderMap(dataMatrix);
  return dataMatrix;
  
  // -- CACHE LOGIC BYPASSED BELOW --
  
  let cache = CacheService.getScriptCache();
  let cacheKey = 'DB_' + version + '_' + name;
  
  let cachedStr = cache.get(cacheKey);
  
  if (!cachedStr) {
      let chunks = parseInt(cache.get(cacheKey + '_chunks') || '0', 10);
      if (chunks > 0) {
          let assembled = '';
          let valid = true;
          for (let i = 0; i < chunks; i++) {
              let chunk = cache.get(cacheKey + '_' + i);
              if (!chunk) { valid = false; break; } // FIX: Prevent silent chunk corruption
              assembled += chunk;
          }
          if (valid && assembled.length > 0) cachedStr = assembled;
      }
  }
  
  let data = null;

  if (cachedStr) {
     try { data = JSON.parse(cachedStr); } catch(e) {}
  }

  if (!data) {
      data = sheet.getDataRange().getValues();
      
      // SURGICAL FIX: Prevent Google Sheets Date objects from shifting -1 day during JSON.stringify
      // by flattening them into exact local-time strings before caching.
      for (let r = 0; r < data.length; r++) {
          for (let c = 0; c < data[r].length; c++) {
              if (data[r][c] instanceof Date) {
                  let d = data[r][c];
                  let y = d.getFullYear();
                  let m = String(d.getMonth() + 1).padStart(2, '0');
                  let day = String(d.getDate()).padStart(2, '0');
                  let h = String(d.getHours()).padStart(2, '0');
                  let min = String(d.getMinutes()).padStart(2, '0');
                  let s = String(d.getSeconds()).padStart(2, '0');
                  data[r][c] = `${y}-${m}-${day}T${h}:${min}:${s}`;
              }
          }
      }

      try {
         let str = JSON.stringify(data);
         if (str.length < 90000) {
             cache.put(cacheKey, str, 21600); // 6 Hours
             cache.remove(cacheKey + '_chunks');
         } else {
             // CHUNKING: Bypass Google's 100KB CacheService Limit
             let chunkSize = 90000;
             let chunks = Math.ceil(str.length / chunkSize);
             let cacheObj = {};
             cacheObj[cacheKey + '_chunks'] = chunks.toString();
             for (let i = 0; i < chunks; i++) {
                 cacheObj[cacheKey + '_' + i] = str.substring(i * chunkSize, (i + 1) * chunkSize);
             }
             cache.putAll(cacheObj, 21600);
             cache.remove(cacheKey);
         }
      } catch(e) {}
  }

  // PHASE 1: Build Map dynamically and augment the array so backward compatibility is 100% safe
  let map = {};
  if (data.length > 0) {
      data[0].forEach((header, index) => {
          if (header !== undefined && header !== null) {
              let hStr = header.toString().trim();
              map[hStr] = index;
          }
      });
  }
  data.hMap = map;
  
  sheetDataCache[name] = { version: version, data: data };
  return sheetDataCache[name].data;
}

// ==========================================
// --- ROBUST RETRY WRAPPER (ENTERPRISE GRADE) ---
// ==========================================
var IS_READ_ONLY_EXECUTION = false;

function executeWithRetry(operation, maxRetries = 5) {
  let attempt = 0;
  
  // Auto-detect read operations to bypass the strict ScriptLock turnstile
  let opStr = operation.toString();
  let isExplicitRead = opStr.includes('verifyDatabaseSchema(true)') || opStr.includes('verifyVaultSchema(true)') || opStr.includes('getSheetData');
  let isWrite = opStr.includes('appendRow') || opStr.includes('setValue') || opStr.includes('clearContents') || opStr.includes('delete') || opStr.includes('writeToAuditLog') || opStr.includes('makeCopy');
  let isBackupOp = opStr.includes('backupDatabase') || opStr.includes('runVerifiedNightlyBackup') || opStr.includes('beginDatabaseBackupLock') || opStr.includes('endDatabaseBackupLock') || opStr.includes('pruneOldBackupsSafely_');
  let bypassLock = (typeof IS_READ_ONLY_EXECUTION !== 'undefined' && IS_READ_ONLY_EXECUTION) || (isExplicitRead && !isWrite);

  while (attempt < maxRetries) {
    let lock = bypassLock ? null : LockService.getScriptLock();
    try {
      if (isWrite && !isBackupOp && typeof isBackupInProgress_ === 'function' && isBackupInProgress_()) {
        throw new Error('Database backup in progress. Please wait and try again.');
      }
      // Try to acquire an execution lock for up to 15 seconds to prevent collision
      if (lock && !lock.tryLock(15000)) {
        throw new Error("Server is currently busy processing another user's request.");
      }
      let result = operation();
      return result;
    } catch (e) {
          if (e.message && e.message.includes("COLLISION_DETECTED")) throw e; // Instantly abort on collision
      attempt++;
      if (attempt >= maxRetries) {
          let errType = bypassLock ? "Read Timeout" : "Lockout";
          throw new Error("Database " + errType + " after " + maxRetries + " attempts: " + e.message);
      }
      Utilities.sleep(Math.pow(2, attempt) * 500 + Math.round(Math.random() * 500)); // Strict exponential backoff
    } finally {
      if (lock && lock.hasLock()) lock.releaseLock();
    }
  }
}

// ==========================================
// --- REAL-TIME PRESENCE ENGINE (CACHE) ---
// ==========================================
function reportProjectPresence(projectId, userName, action, activeModule) {
  try {
    let cache = CacheService.getScriptCache();
    let key = 'PRESENCE_' + projectId;
    let lock = LockService.getScriptLock();
    
    // Try to lock RAM for 2 seconds to prevent read/write overlap
    if (lock.tryLock(2000)) {
        try {
            let activeStr = cache.get(key);
            let activeUsers = activeStr ? JSON.parse(activeStr) : {};
            let now = Date.now();
            
            if (action === 'join' || action === 'ping') activeUsers[userName] = { time: now, module: activeModule || 'main' };
            else if (action === 'leave') delete activeUsers[userName];
            
            // Cleanup disconnected users (no ping in last 90 seconds)
            let activeList = {};
            for (let user in activeUsers) {
                if (now - activeUsers[user].time > 90000) delete activeUsers[user];
                else if (user !== userName) activeList[user] = activeUsers[user]; // Keep track of OTHERS and their modules
            }
            
            // Save back to RAM, auto-expires entirely after 5 mins of zero activity
            cache.put(key, JSON.stringify(activeUsers), 300); 
            return activeList; 
        } finally {
            lock.releaseLock();
        }
    }
    return {};
  } catch (e) {
    return {};
  }
}

// RUN THIS FUNCTION FROM THE EDITOR TO FIX YOUR SHIFTED DATA
function UTILITY_FORCE_CACHE_FLUSH() {
  flushCache();
}
