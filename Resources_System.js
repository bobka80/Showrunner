/**
 * SM Showrunner (smuruner) - Clean 8 Architecture
 * Resources_System.js - Config Engine
 */

// ==========================================
// --- VAULT: SYSTEM ASSETS & CONFIGS ---
// ==========================================
// @INDEX: SYSTEM_CONFIG -> Global Settings & Tags

function getVaultAsset(assetKey, fallbackValue) {
  if (!vaultAssetCache) {
    vaultAssetCache = {};
    const sheets = verifyVaultSchema(true);
    const data = getSheetData(sheets.config);
    
    let keyIdx = data[0].indexOf("Asset_Key") > -1 ? data[0].indexOf("Asset_Key") : 1;
    let valIdx = data[0].indexOf("Asset_Payload") > -1 ? data[0].indexOf("Asset_Payload") : 2;
    
    for (let i = 1; i < data.length; i++) {
      try {
        if (data[i][keyIdx]) vaultAssetCache[data[i][keyIdx]] = JSON.parse(data[i][valIdx]);
      } catch (e) {
      }
    }
  }
  return vaultAssetCache.hasOwnProperty(assetKey) ? vaultAssetCache[assetKey] : fallbackValue;
}

function saveVaultAsset(assetKey, payloadObj) {
  return executeWithRetry(() => {
    const sheets = verifyVaultSchema();
    const data = sheets.config.getDataRange().getValues();
    let payloadStr = JSON.stringify(payloadObj);
    
    let keyIdx = data[0].indexOf("Asset_Key") > -1 ? data[0].indexOf("Asset_Key") : 1;
    let valIdx = data[0].indexOf("Asset_Payload") > -1 ? data[0].indexOf("Asset_Payload") : 2;
    
    if (!vaultAssetCache) vaultAssetCache = {};
    vaultAssetCache[assetKey] = payloadObj;

    let isUpdated = false;
    for (let i = 1; i < data.length; i++) {
      if (data[i][keyIdx] === assetKey) {
        sheets.config.getRange(i + 1, valIdx + 1).setValue(payloadStr);
        isUpdated = true;
        break;
      }
    }
    
    if (!isUpdated) {
        let newRow = new Array(data[0].length).fill("");
        newRow[0] = Utilities.getUuid(); // uid
        newRow[keyIdx] = assetKey;
        newRow[valIdx] = payloadStr;
        sheets.config.appendRow(newRow);
    }
    
    SpreadsheetApp.flush(); // FORCE PHYSICAL DISK WRITE BEFORE EXITING
    flushCache();
    return "Saved";
  });
}

// Update the native getters to use the Vault Assets
function getSystemSettings() {
  let depts = [];
  try {
      const deptData = getSheetData(verifyVaultSchema(true).departments);
      if (deptData && deptData.length > 1) {
          let map = deptData.hMap;
          for (let i = 1; i < deptData.length; i++) {
              if (deptData[i][map['uid']]) {
                  depts.push({ uid: deptData[i][map['uid']], name: deptData[i][map['name']], color: deptData[i][map['color']] });
              }
          }
      }
  } catch(e) {}
  
  if (depts.length === 0) {
      depts = [{uid:"dept_lighting",name:"Lighting",color:"#f59e0b"},{uid:"dept_audio",name:"Audio",color:"#3b82f6"},{uid:"dept_video",name:"Video",color:"#10b981"},{uid:"dept_rigging",name:"Rigging",color:"#ef4444"},{uid:"dept_trucks",name:"Trucks",color:"#6b7280"}];
  }

  let defaultMeals = ["None", "Vegan", "Vegetarian", "Gluten-Free", "Low Carb", "Not Junk"];
  let meals = getVaultAsset('meals', defaultMeals);
  
  // Reconstruct the Tag Tree from the Relational Flat Table
  let tags = [];
  try {
      const tagData = getSheetData(verifyVaultSchema(true).tags);
      if (tagData && tagData.length > 1) {
          let map = tagData.hMap;
          let flatTags = [];
          for (let i = 1; i < tagData.length; i++) {
              if (tagData[i][map['uid']]) {
                  flatTags.push({
                      id: tagData[i][map['uid']],
                      parent_uid: tagData[i][map['parent_uid']],
                      name: tagData[i][map['name']],
                      color: tagData[i][map['color']],
                      shortcut: tagData[i][map['shortcut']],
                      inFormula: tagData[i][map['in_formula']] === true || tagData[i][map['in_formula']] === 'true' || tagData[i][map['in_formula']] === 1,
                      order: Number(tagData[i][map['order_index']]) || i
                  });
              }
          }
          flatTags.sort((a, b) => a.order - b.order);
          let idToNode = {};
          flatTags.forEach(t => {
              idToNode[t.id] = { id: t.id, name: t.name, color: t.color, shortcut: t.shortcut, inFormula: t.inFormula, children: [], expanded: true };
          });
          flatTags.forEach(t => {
              if (t.parent_uid && idToNode[t.parent_uid]) {
                  idToNode[t.parent_uid].children.push(idToNode[t.id]);
              } else {
                  tags.push(idToNode[t.id]);
              }
          });
      }
  } catch(e) {}
  
  // Fallback to JSON if migration hasn't been run yet
  if (tags.length === 0) tags = getVaultAsset('asset_tags_dictionary', []);
  
  let aliases = getVaultAsset('syntax_aliases', { 's':'SOCA', 'd':'DISTRO', 'e':'EXTENDER', 'b':'BREAKOUT', 'c':'CABLE', '3x':'3XLR', '5x':'5XLR', 'x3':'3XLR', 'x5':'5XLR' });
  
  let payrollDefaults = getVaultAsset('payroll_defaults', {
      prep_rate: 80, prep_hours: 8, prep_mult: 1.0,
      build_rate: 100, build_hours: 6, build_mult: 1.0,
      duty_rate: 120, duty_hours: 8, duty_mult: 1.0,
      break_rate: 80, break_hours: 4, break_mult: 1.0,
      default_shift_period: 12,
      overtime_multiplier: 1.5,
      followspot_bonus: 50,
      console_bonus: 50,
      truck_t1_in: 50, truck_t1_out: 1.2, truck_t1_stay: 30,
      truck_t2_in: 80, truck_t2_out: 1.5, truck_t2_stay: 50,
      truck_t3_in: 120, truck_t3_out: 2.0, truck_t3_stay: 80,
      truck_t4_in: 200, truck_t4_out: 2.5, truck_t4_stay: 120
  });
  
  return { departments: depts, meals: meals, tags: tags, aliases: aliases, payroll: payrollDefaults };
}

function saveFinancialSettings(payloadObj) {
    return executeWithRetry(() => {
        saveVaultAsset('fin_roles', payloadObj.roles || {});
        saveVaultAsset('fin_overheads', payloadObj.overheads || []);
        saveVaultAsset('fin_consumables', payloadObj.consumables || []);
        saveVaultAsset('fin_trucks', payloadObj.trucks || {});
        saveVaultAsset('fin_globals', payloadObj.globals || {});
        return "Financial Settings Saved";
    });
}

function savePayrollSettings(settingsObj) {
    return saveVaultAsset('payroll_defaults', settingsObj);
}

function saveSystemTags(tagsTree) {
    return executeWithRetry(() => {
        const sheets = verifyVaultSchema();
        let flatTags = [];
        let orderIndex = 0;

        const flatten = (nodes, parentId) => {
            nodes.forEach(n => {
                flatTags.push({ uid: n.id || Utilities.getUuid(), parent_uid: parentId || "", name: n.name || "", color: n.color || "#a855f7", shortcut: n.shortcut || "", in_formula: n.inFormula || false, order_index: orderIndex++ });
                if (n.children && n.children.length > 0) flatten(n.children, n.id);
            });
        };

        if (tagsTree && tagsTree.length > 0) flatten(tagsTree, "");

        let tagSheet = sheets.tags;
        let data = tagSheet.getDataRange().getValues();
        let map = {}; if(data.length > 0) data[0].forEach((h,i)=>map[h.toString().trim()]=i);
        
        let keptRows = [data[0]];
        flatTags.forEach(t => {
            let row = new Array(data[0].length).fill("");
            if(map['uid'] !== undefined) row[map['uid']] = t.uid; if(map['parent_uid'] !== undefined) row[map['parent_uid']] = t.parent_uid; if(map['name'] !== undefined) row[map['name']] = t.name; if(map['color'] !== undefined) row[map['color']] = t.color; if(map['shortcut'] !== undefined) row[map['shortcut']] = t.shortcut; if(map['in_formula'] !== undefined) row[map['in_formula']] = t.in_formula; if(map['order_index'] !== undefined) row[map['order_index']] = t.order_index;
            keptRows.push(row);
        });

        tagSheet.clearContents();
        if (keptRows.length > 0) tagSheet.getRange(1, 1, keptRows.length, keptRows[0].length).setValues(keptRows);
        flushCache();
        return "Tags Saved";
    });
}

function saveSystemSettings(boss1, boss2, depts, meals) {
  return executeWithRetry(() => {
      const sheets = verifyVaultSchema();
      
      let deptData = sheets.departments.getDataRange().getValues();
      let map = {}; if(deptData.length > 0) deptData[0].forEach((h,i)=>map[h.toString().trim()]=i);
      
      let keptRows = [deptData[0]];
      depts.forEach(d => {
          let row = new Array(3).fill("");
          if(map['uid'] !== undefined) row[map['uid']] = d.uid || Utilities.getUuid();
          if(map['name'] !== undefined) row[map['name']] = d.name;
          if(map['color'] !== undefined) row[map['color']] = d.color;
          keptRows.push(row);
      });
      
      sheets.departments.clearContents();
      if (keptRows.length > 0) {
          sheets.departments.getRange(1, 1, keptRows.length, keptRows[0].length).setValues(keptRows);
      }
      
      try {
          let configCache = CacheService.getScriptCache();
          let props = PropertiesService.getScriptProperties();
          let v = configCache.get('DB_CACHE_VERSION') || props.getProperty('DB_CACHE_VERSION');
          if (v) configCache.remove('DB_' + v + '_System_Departments');
      } catch(e) {}

      saveVaultAsset('meals', meals);
      saveVaultAsset('bossEmails', { boss1: boss1, boss2: boss2 });
      return "Success";
  });
}

function getModuleVisualSettings(module, presetNum = 'current') {
  return getVaultAsset(module + '_visual_settings_' + presetNum, getVaultAsset(module + '_visual_settings_current', null));
}

function saveModuleVisualSettings(module, settingsData, presetNum = 'current') {
  return saveVaultAsset(module + '_visual_settings_' + presetNum, settingsData);
}

function managerConfigUserKey_(crewName) {
  return 'manager_config_' + (crewName || '').replace(/\s+/g, '_').toLowerCase();
}

function defaultUserManagerPayload_() {
  return {
    syncSelection: [],
    rules: [],
    renameRules: [],
    assetChecklistItems: [],
    lastUpdated: 0,
    migratedFromGlobal: false
  };
}

function readUserManagerVault_(crewName) {
  let userKey = managerConfigUserKey_(crewName);
  let raw = getVaultAsset(userKey, null);
  if (!raw || typeof raw !== 'object') return defaultUserManagerPayload_();
  return {
    syncSelection: Array.isArray(raw.syncSelection) ? raw.syncSelection : [],
    rules: Array.isArray(raw.rules) ? raw.rules : [],
    renameRules: Array.isArray(raw.renameRules) ? raw.renameRules : [],
    assetChecklistItems: Array.isArray(raw.assetChecklistItems) ? raw.assetChecklistItems : [],
    lastUpdated: raw.lastUpdated || 0,
    migratedFromGlobal: raw.migratedFromGlobal === true
  };
}

/** Lazy one-time copy of legacy global rules into a manager's personal config on first hub load. */
function ensureUserManagerConfig_(crewName, globalConfig) {
  let userConfig = readUserManagerVault_(crewName);
  let globalRules = (globalConfig && Array.isArray(globalConfig.rules)) ? globalConfig.rules : [];
  let globalRename = (globalConfig && Array.isArray(globalConfig.renameRules)) ? globalConfig.renameRules : [];
  let shouldMigrate = !userConfig.migratedFromGlobal
      && userConfig.rules.length === 0
      && userConfig.renameRules.length === 0
      && (globalRules.length > 0 || globalRename.length > 0);

  if (shouldMigrate) {
    userConfig.rules = JSON.parse(JSON.stringify(globalRules));
    userConfig.renameRules = JSON.parse(JSON.stringify(globalRename));
    userConfig.migratedFromGlobal = true;
    userConfig.lastUpdated = (globalConfig && globalConfig.lastUpdated) ? globalConfig.lastUpdated : new Date().getTime();
    saveVaultAsset(managerConfigUserKey_(crewName), userConfig);
  }
  return userConfig;
}

function getManagerConfig(crewName) {
  return executeWithRetry(() => {
    let globalConfig = getVaultAsset('manager_config_global', { templateFolder: '', lastUpdated: 0 });
    let userConfig = ensureUserManagerConfig_(crewName, globalConfig);

    let config = {
      templateFolder: globalConfig.templateFolder || '',
      lastUpdated: userConfig.lastUpdated || 0,
      syncSelection: userConfig.syncSelection || [],
      rules: userConfig.rules || [],
      renameRules: userConfig.renameRules || [],
      assetChecklistItems: userConfig.assetChecklistItems || []
    };

    try {
      if (config.templateFolder) config.templateName = DriveApp.getFolderById(config.templateFolder).getName();
    } catch (e) {
      config.templateName = "Access Restricted / Unknown";
    }
    return config;
  });
}

function saveManagerConfig(crewName, payload) {
  return executeWithRetry(() => {
      let userKey = managerConfigUserKey_(crewName);
      let existingUser = ensureUserManagerConfig_(crewName, getVaultAsset('manager_config_global', {}));

      const sheets = verifyVaultSchema();
      const data = sheets.config.getDataRange().getValues();
      let keyIdx = data[0].indexOf("Asset_Key") > -1 ? data[0].indexOf("Asset_Key") : 1;
      let valIdx = data[0].indexOf("Asset_Payload") > -1 ? data[0].indexOf("Asset_Payload") : 2;

      let existingUserPayload = null;
      for (let i = 1; i < data.length; i++) {
          if (data[i][keyIdx] === userKey) {
              try { existingUserPayload = JSON.parse(data[i][valIdx]); } catch (e) {}
              break;
          }
      }

      if (existingUserPayload && existingUserPayload.lastUpdated && payload.lastUpdated
          && existingUserPayload.lastUpdated.toString() !== payload.lastUpdated.toString()) {
          throw new Error("COLLISION_DETECTED: Your manager settings were modified elsewhere. Please refresh the page before saving.");
      }

      let userPayload = {
          syncSelection: payload.syncSelection !== undefined ? (payload.syncSelection || []) : existingUser.syncSelection,
          rules: payload.rules !== undefined ? (payload.rules || []) : existingUser.rules,
          renameRules: payload.renameRules !== undefined ? (payload.renameRules || []) : existingUser.renameRules,
          assetChecklistItems: payload.assetChecklistItems !== undefined
              ? (payload.assetChecklistItems || [])
              : (existingUser.assetChecklistItems || []),
          lastUpdated: new Date().getTime(),
          migratedFromGlobal: true
      };
      saveVaultAsset(userKey, userPayload);

      if (payload.templateFolder !== undefined && payload.templateFolder !== null && payload.templateFolder !== '') {
          saveVaultAsset('manager_config_global', {
              templateFolder: payload.templateFolder,
              lastUpdated: new Date().getTime()
          });
      }

      writeToAuditLog(crewName, "UPDATE", "SYSTEM_CONFIG", userKey, "Manager Config", "Updated per-manager automation settings.");
      return "Configuration saved successfully.";
  });
}