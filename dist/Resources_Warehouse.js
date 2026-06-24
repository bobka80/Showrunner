/**
 * SM Showrunner (smuruner) - Clean 8 Architecture
 * Resources_Warehouse.js - Spatial DB & CAD Engine
 */

// ==========================================
// --- WAREHOUSE: SPATIAL STORAGE CRUD ---
// ==========================================
// @INDEX: WAREHOUSE_DB -> Spatial Storage CRUD

function getWarehouseData() {
   return executeWithRetry(() => {
      const sheets = verifyVaultSchema(true);
      let wData = getSheetData(sheets.warehouses);
      let zData = getSheetData(sheets.subzones);
      let aData = getSheetData(sheets.areas);
      
      let roots = []; let zones = []; let areas = [];
      for(let i=1; i<wData.length; i++) {
         if(wData[i][wData.hMap['uid']]) roots.push({ id: wData[i][wData.hMap['uid']], name: wData[i][wData.hMap['name']], address: wData[i][wData.hMap['address']], mapUrl: wData[i][wData.hMap['map_url']], type: wData[i][wData.hMap['type']], anchorX: wData[i][wData.hMap['anchor_x']] || 0, anchorY: wData[i][wData.hMap['anchor_y']] || 0 });
      }
      for(let i=1; i<zData.length; i++) {
         if(zData[i][zData.hMap['uid']]) zones.push({ id: zData[i][zData.hMap['uid']], parentId: zData[i][zData.hMap['warehouse_uid']], name: zData[i][zData.hMap['name']], floor: zData[i][zData.hMap['floor']], room: zData[i][zData.hMap['room']], x: zData[i][zData.hMap['x']], y: zData[i][zData.hMap['y']], w: zData[i][zData.hMap['w']], h: zData[i][zData.hMap['h']], notes: zData[i][zData.hMap['notes']], points: (zData[i][zData.hMap['points']] ? JSON.parse(zData[i][zData.hMap['points']]) : []), elevation: zData[i][zData.hMap['elevation']] || "" });
      }
      for(let i=1; i<aData.length; i++) {
         if(aData[i][aData.hMap['uid']]) areas.push({ id: aData[i][aData.hMap['uid']], zoneId: aData[i][aData.hMap['subzone_uid']], name: aData[i][aData.hMap['name']], w: aData[i][aData.hMap['width_cm']], h: aData[i][aData.hMap['height_cm']], x: aData[i][aData.hMap['x_pos']], y: aData[i][aData.hMap['y_pos']], department: aData[i][aData.hMap['department']], points: (aData[i][aData.hMap['points']] ? JSON.parse(aData[i][aData.hMap['points']]) : []) });
      }
      return { roots: roots, zones: zones, areas: areas };
   });
}

function saveWarehouseRoot(rootObj, actor = "System UI") {
  return executeWithRetry(() => {
    const sheets = verifyVaultSchema();
    if (sheets.warehouses.getMaxColumns() < 7) sheets.warehouses.insertColumnsAfter(sheets.warehouses.getMaxColumns(), 7 - sheets.warehouses.getMaxColumns());
    let data = sheets.warehouses.getDataRange().getValues();
    let rowIndex = -1;
    for(let i=1; i<data.length; i++) { if(data[i][0] === rootObj.id) { rowIndex = i + 1; break; } }
    
    let row = [rootObj.id, rootObj.name, rootObj.address, rootObj.mapUrl, rootObj.type, rootObj.anchorX || 0, rootObj.anchorY || 0];
    if(rowIndex > -1) sheets.warehouses.getRange(rowIndex, 1, 1, 7).setValues([row]);
    else sheets.warehouses.appendRow(row);
    flushCache();
    writeToAuditLog(actor, "UPDATE", "WAREHOUSE", "GLOBAL", rootObj.id, "Saved Warehouse Root: " + rootObj.name);
    return "Saved Root";
  });
}

function saveWarehouseZone(zoneObj, actor = "System UI") {
  return executeWithRetry(() => {
    const sheets = verifyVaultSchema();
    if (sheets.subzones.getMaxColumns() < 12) sheets.subzones.insertColumnsAfter(sheets.subzones.getMaxColumns(), 12 - sheets.subzones.getMaxColumns());
    let data = sheets.subzones.getDataRange().getValues();
    let rowIndex = -1;
    for(let i=1; i<data.length; i++) { if(data[i][0] === zoneObj.id) { rowIndex = i + 1; break; } }
    let row = [zoneObj.id, zoneObj.parentId, zoneObj.name, zoneObj.floor || "", zoneObj.room || "", zoneObj.x || 20, zoneObj.y || 20, zoneObj.w || 160, zoneObj.h || 100, zoneObj.notes || "", JSON.stringify(zoneObj.points || []), zoneObj.elevation || ""];
    if(rowIndex > -1) sheets.subzones.getRange(rowIndex, 1, 1, 12).setValues([row]);
    else sheets.subzones.appendRow(row);
    flushCache();
    writeToAuditLog(actor, "UPDATE", "WAREHOUSE", "GLOBAL", zoneObj.id, "Saved Warehouse Zone: " + zoneObj.name);
    return "Saved Zone";
  });
}

function saveWarehouseArea(areaObj, actor = "System UI") {
  return executeWithRetry(() => {
    const sheets = verifyVaultSchema();
    if (sheets.areas.getMaxColumns() < 9) sheets.areas.insertColumnsAfter(sheets.areas.getMaxColumns(), 9 - sheets.areas.getMaxColumns());
    let data = sheets.areas.getDataRange().getValues();
    let rowIndex = -1;
    for(let i=1; i<data.length; i++) { if(data[i][0] === areaObj.id) { rowIndex = i + 1; break; } }
    let row = [areaObj.id, areaObj.zoneId, areaObj.name, areaObj.w || 80, areaObj.h || 40, areaObj.x || 20, areaObj.y || 20, areaObj.department || "", JSON.stringify(areaObj.points || [])];
    if(rowIndex > -1) sheets.areas.getRange(rowIndex, 1, 1, 9).setValues([row]);
    else sheets.areas.appendRow(row);
    flushCache();
    writeToAuditLog(actor, "UPDATE", "WAREHOUSE", "GLOBAL", areaObj.id, "Saved Warehouse Area: " + areaObj.name);
    return "Saved Area";
  });
}

function deleteWarehouseEntity(type, id, actor = "System UI") {
  return executeWithRetry(() => {
    const sheets = verifyVaultSchema();
    let sheet = null;
    if(type === 'root') sheet = sheets.warehouses;
    else if(type === 'zone') sheet = sheets.subzones;
    else if(type === 'area') sheet = sheets.areas;
    if(!sheet) return "Unknown type";

    let data = sheet.getDataRange().getValues();
    let map = {};
    if(data.length > 0) data[0].forEach((h,i)=>map[h.toString().trim()]=i);
    let kept = [data[0]];
    for(let i=1; i<data.length; i++) { if(data[i][map['uid']] !== id) kept.push(data[i]); }
    sheet.clearContents();
    if(kept.length > 0) sheet.getRange(1, 1, kept.length, kept[0].length).setValues(kept);
    
    if(type === 'root') {
       let zData = sheets.subzones.getDataRange().getValues();
       let zMap = {};
       if(zData.length > 0) zData[0].forEach((h,i)=>zMap[h.toString().trim()]=i);
       let zKept = [zData[0]];
       let deletedZones = [];
       for(let i=1; i<zData.length; i++) { if(zData[i][zMap['warehouse_uid']] !== id) zKept.push(zData[i]); else deletedZones.push(zData[i][zMap['uid']]); }
       sheets.subzones.clearContents();
       if(zKept.length > 0) sheets.subzones.getRange(1, 1, zKept.length, zKept[0].length).setValues(zKept);
       if(deletedZones.length > 0) {
          let aData = sheets.areas.getDataRange().getValues();
          let aMap = {};
          if(aData.length > 0) aData[0].forEach((h,i)=>aMap[h.toString().trim()]=i);
          let aKept = [aData[0]];
          for(let i=1; i<aData.length; i++) { if(!deletedZones.includes(aData[i][aMap['subzone_uid']])) aKept.push(aData[i]); }
          sheets.areas.clearContents();
          if(aKept.length > 0) sheets.areas.getRange(1, 1, aKept.length, aKept[0].length).setValues(aKept);
       }
    }
    else if (type === 'zone') {
       let aData = sheets.areas.getDataRange().getValues();
       let aMap = {};
       if(aData.length > 0) aData[0].forEach((h,i)=>aMap[h.toString().trim()]=i);
       let aKept = [aData[0]];
       for(let i=1; i<aData.length; i++) { if(aData[i][aMap['subzone_uid']] !== id) aKept.push(aData[i]); }
       sheets.areas.clearContents();
       if(aKept.length > 0) sheets.areas.getRange(1, 1, aKept.length, aKept[0].length).setValues(aKept);
    }

    flushCache();
    writeToAuditLog(actor, "DELETE", "WAREHOUSE", "GLOBAL", id, `Deleted warehouse entity (${type})`);
    return "Deleted";
  });
}

function saveWarehouseDraft(zoneObj, areasArray, deletedAreaIds, actor = "System UI") {
  return executeWithRetry(() => {
    const sheets = verifyVaultSchema();
    
    // 1. Process the Zone Parent
    if (zoneObj) {
        if (sheets.subzones.getMaxColumns() < 12) sheets.subzones.insertColumnsAfter(sheets.subzones.getMaxColumns(), 12 - sheets.subzones.getMaxColumns());
        let zData = sheets.subzones.getDataRange().getValues();
        let zRowIndex = -1;
        for(let i=1; i<zData.length; i++) { if(zData[i][0] === zoneObj.id) { zRowIndex = i + 1; break; } }
        let zRow = [zoneObj.id, zoneObj.parentId, zoneObj.name, zoneObj.floor || "", zoneObj.room || "", zoneObj.x || 20, zoneObj.y || 20, zoneObj.w || 160, zoneObj.h || 100, zoneObj.notes || "", JSON.stringify(zoneObj.points || []), zoneObj.elevation || ""];
        if(zRowIndex > -1) sheets.subzones.getRange(zRowIndex, 1, 1, 12).setValues([zRow]);
        else sheets.subzones.appendRow(zRow);
    }
    
    // 2. Bulk Process All Areas (Updates, Appends, Deletions)
    if ((areasArray && areasArray.length > 0) || (deletedAreaIds && deletedAreaIds.length > 0)) {
        if (sheets.areas.getMaxColumns() < 9) sheets.areas.insertColumnsAfter(sheets.areas.getMaxColumns(), 9 - sheets.areas.getMaxColumns());
        let aData = sheets.areas.getDataRange().getValues();
        
        let keptRows = [aData[0]]; 
        let safeDeletedIds = deletedAreaIds || [];
        
        for (let i = 1; i < aData.length; i++) {
            let existingId = aData[i][0];
            if (safeDeletedIds.includes(existingId)) continue; // Drop deleted
            
            let updateMatch = null;
            if (areasArray) updateMatch = areasArray.find(a => a.id === existingId);
            
            if (updateMatch) {
                keptRows.push([updateMatch.id, updateMatch.zoneId, updateMatch.name, updateMatch.w || 80, updateMatch.h || 40, updateMatch.x || 20, updateMatch.y || 20, updateMatch.department || "", JSON.stringify(updateMatch.points || [])]);
            } else {
                keptRows.push(aData[i]);
            }
        }
        
        let newRows = [];
        if (areasArray) {
            areasArray.forEach(a => {
                let existsInSheet = false;
                for (let r = 1; r < aData.length; r++) { if (aData[r][0] === a.id) { existsInSheet = true; break; } }
                if (!existsInSheet && !safeDeletedIds.includes(a.id)) {
                    newRows.push([a.id, a.zoneId, a.name, a.w || 80, a.h || 40, a.x || 20, a.y || 20, a.department || "", JSON.stringify(a.points || [])]);
                }
            });
        }
        
        sheets.areas.clearContents();
        if (keptRows.length > 0) sheets.areas.getRange(1, 1, keptRows.length, keptRows[0].length).setValues(keptRows);
        if (newRows.length > 0) sheets.areas.getRange(keptRows.length + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
    }
    
    flushCache();
    writeToAuditLog(actor, "UPDATE", "WAREHOUSE", "GLOBAL", zoneObj ? zoneObj.id : "Bulk", "Saved Warehouse Draft (Spatial map)");
    return "Saved Draft";
  });
}