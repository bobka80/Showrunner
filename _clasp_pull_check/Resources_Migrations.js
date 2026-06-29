/**
 * SM Showrunner (smuruner) - Clean 8 Architecture
 * Resources_Migrations.js - Schema Upgrades & Migrations
 */

// ==========================================
// --- MIGRATION SCRIPTS ---
// ==========================================
// @INDEX: MIGRATIONS -> Schema Upgrades

function runDatabaseUserUidMigration() {
  const vaultSs = SpreadsheetApp.openById(getVaultSheetId());
  const engineSs = SpreadsheetApp.openById(getEngineSheetId());
  
  // 1. Build Email -> UID map from Crew Roster
  const crewSheet = vaultSs.getSheetByName("Crew_Roster");
  const crewData = crewSheet.getDataRange().getValues();
  let cMap = {};
  crewData[0].forEach((h, i) => cMap[h.toString().trim()] = i);
  
  let emailToUid = { 'truck@wh.local': 'truck1_uid', 'truck2@wh.local': 'truck2_uid', 'truck3@wh.local': 'truck3_uid' };
  for (let i = 1; i < crewData.length; i++) {
    let email = crewData[i][cMap['Email']];
    let uid = crewData[i][cMap['uid']];
    if (email && uid) emailToUid[email.toString().trim().toLowerCase()] = uid.toString().trim();
  }
  
  // Helper to migrate a specific sheet column
  const migrateSheetCol = (sheetName, colName) => {
    let sheet = engineSs.getSheetByName(sheetName);
    if (!sheet) return;
    let data = sheet.getDataRange().getValues();
    if (data.length <= 1) return;
    let map = {};
    data[0].forEach((h, i) => map[h.toString().trim()] = i);
    let targetCol = map[colName];
    if (targetCol === undefined) return;
    
    let hasChanges = false;
    for (let i = 1; i < data.length; i++) {
      let val = data[i][targetCol];
      if (val && val.toString().includes('@')) { // It's an email
         let lowered = val.toString().toLowerCase().trim();
         if (emailToUid[lowered]) { data[i][targetCol] = emailToUid[lowered]; hasChanges = true; }
      }
    }
    if (hasChanges) sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
  };
  
  migrateSheetCol("Shift_Assignments", "user_uid");
  migrateSheetCol("Dept_Overrides", "user_uid");
  migrateSheetCol("Leave_Tracker", "user_uid");
  migrateSheetCol("Notifications", "user_uid");
  migrateSheetCol("Task_Assignees", "user_uid");
  
  flushCache();
  return "Database successfully migrated to strictly use UIDs!";
}

function runDepartmentRelationalMigration() {
    const vaultSs = SpreadsheetApp.openById(getVaultSheetId());
    const engineSs = SpreadsheetApp.openById(getEngineSheetId());
    const sheets = verifyVaultSchema();
    
    let deptData = sheets.departments.getDataRange().getValues();
    let dMap = {}; deptData[0].forEach((h,i)=>dMap[h.toString().trim()]=i);
    let nameToUid = {};
    for(let i=1; i<deptData.length; i++) {
        if (deptData[i][dMap['name']] && deptData[i][dMap['uid']]) {
            nameToUid[deptData[i][dMap['name']].toString().toLowerCase().trim()] = deptData[i][dMap['uid']];
        }
    }
    
    const migrateCol = (ss, sheetName, colName) => {
        let sheet = ss.getSheetByName(sheetName);
        if (!sheet) return;
        let data = sheet.getDataRange().getValues();
        if (data.length <= 1) return;
        let map = {}; data[0].forEach((h,i)=>map[h.toString().trim()]=i);
        let cIdx = map[colName];
        if (cIdx === undefined) return;
        
        let changed = false;
        for(let i=1; i<data.length; i++) {
            let val = data[i][cIdx];
            if (val && !val.toString().startsWith('dept_') && !val.toString().includes('-')) {
                let key = val.toString().toLowerCase().trim();
                if (nameToUid[key]) {
                    data[i][cIdx] = nameToUid[key];
                    changed = true;
                }
            }
        }
        if (changed) sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
    };
    
    migrateCol(vaultSs, "Crew_Roster", "Department");
    migrateCol(vaultSs, "Storage_Areas", "department");
    migrateCol(vaultSs, "Assets", "department");
    migrateCol(engineSs, "Dept_Overrides", "Dept_Name");
    migrateCol(engineSs, "Operations_Ledger", "department");
    
    flushCache();
    return "Departments successfully migrated to Relational UIDs!";
}

function runAssetTagsRelationalMigration() {
    const vaultSs = SpreadsheetApp.openById(getVaultSheetId());
    const sheets = verifyVaultSchema();
    
    let configData = sheets.config.getDataRange().getValues();
    let cMap = {}; configData[0].forEach((h,i)=>cMap[h.toString().trim()]=i);
    let tagsRowIdx = -1;
    let tagsTree = [];
    for(let i=1; i<configData.length; i++){
        if(configData[i][cMap['Asset_Key']] === 'asset_tags_dictionary') {
            tagsRowIdx = i + 1;
            try { tagsTree = JSON.parse(configData[i][cMap['Asset_Payload']]); } catch(e){}
            break;
        }
    }
    
    let nameToId = {};
    const ensureIds = (nodes) => {
        nodes.forEach(n => {
            if (!n.id) n.id = 'tag_' + Date.now() + Math.random().toString(36).substr(2, 5);
            nameToId[n.name.toLowerCase().trim()] = n.id;
            if (n.children) ensureIds(n.children);
        });
    };
    ensureIds(tagsTree);
    
    // FLATTEN AND MIGRATE TO NEW RELATIONAL TABLE
    let flatTags = [];
    let orderIndex = 0;
    const flatten = (nodes, parentId) => {
        nodes.forEach(n => {
            flatTags.push({ uid: n.id, parent_uid: parentId || "", name: n.name || "", color: n.color || "#a855f7", shortcut: n.shortcut || "", in_formula: n.inFormula || false, order_index: orderIndex++ });
            if (n.children) flatten(n.children, n.id);
        });
    };
    flatten(tagsTree, "");
    
    let tagSheet = sheets.tags;
    let tData = tagSheet.getDataRange().getValues();
    let tMap = {}; if(tData.length > 0) tData[0].forEach((h,i)=>tMap[h.toString().trim()]=i);
    let keptRows = [tData[0]];
    flatTags.forEach(t => {
        let row = new Array(tData[0].length).fill("");
        if(tMap['uid'] !== undefined) row[tMap['uid']] = t.uid; if(tMap['parent_uid'] !== undefined) row[tMap['parent_uid']] = t.parent_uid; if(tMap['name'] !== undefined) row[tMap['name']] = t.name; if(tMap['color'] !== undefined) row[tMap['color']] = t.color; if(tMap['shortcut'] !== undefined) row[tMap['shortcut']] = t.shortcut; if(tMap['in_formula'] !== undefined) row[tMap['in_formula']] = t.in_formula; if(tMap['order_index'] !== undefined) row[tMap['order_index']] = t.order_index;
        keptRows.push(row);
    });
    tagSheet.clearContents();
    if (keptRows.length > 0) tagSheet.getRange(1, 1, keptRows.length, keptRows[0].length).setValues(keptRows);
    // ------------------------------------------
    
    if (tagsRowIdx > -1) {
        sheets.config.getRange(tagsRowIdx, cMap['Asset_Payload'] + 1).setValue(JSON.stringify(tagsTree));
    }
    
    let assetData = sheets.assets.getDataRange().getValues();
    let aMap = {}; assetData[0].forEach((h,i)=>aMap[h.toString().trim()]=i);
    let tagsCol = aMap['tags'];
    
    let hasChanges = false;
    for(let i=1; i<assetData.length; i++) {
        let rawTags = assetData[i][tagsCol];
        if (rawTags) {
            try {
                let parsed = JSON.parse(rawTags);
                let newTags = [];
                parsed.forEach(t => {
                    if (typeof t === 'object' && t.name) {
                        let tid = nameToId[t.name.toLowerCase().trim()];
                        if (tid) newTags.push(tid);
                    } else if (typeof t === 'string' && t.startsWith('tag_')) {
                        newTags.push(t);
                    }
                });
                assetData[i][tagsCol] = JSON.stringify(newTags);
                hasChanges = true;
            } catch(e) {}
        }
    }
    
    if (hasChanges) sheets.assets.getRange(1, 1, assetData.length, assetData[0].length).setValues(assetData);
    
    flushCache();
    return "Asset Tags successfully migrated to Relational UIDs!";
}