/**
 * SM Showrunner (smuruner) - Clean 8 Architecture
 * Logistics_Assets.js - Project Equipment Operations
 */

// ==========================================
// --- PROJECT ASSETS (MATRYOSHKA PROTOCOL) ---
// ==========================================
// @INDEX: PA_ENGINE -> Project Assets Logistics

function saveProjectAssetsDelta(projectId, deltas, actor = "System UI") {
    return getProjectAssetsRepo().saveDelta(projectId, deltas, actor);
}

function saveProjectAssetsDeltaSheets_(projectId, deltas, actor = "System UI") {
    return executeWithRetry(() => {
        assertActorCanEditProjectAssets(actor);
        const sheets = verifyDatabaseSchema();
        let data = sheets.projectAssets.getDataRange().getValues();
        let map = {}; if(data.length > 0) data[0].forEach((h,i)=>map[h.toString().trim()]=i);
        
        let keptRows = [data[0]];
        let projectRows = [];
        for(let i=1; i<data.length; i++) { 
            if(String(data[i][map['project_uid']]) !== String(projectId)) {
                keptRows.push(data[i]); 
            } else {
                projectRows.push({ data: data[i] });
            }
        }
        
        deltas.forEach(d => {
            if (d.isBulk) {
                let match = projectRows.find(r => 
                    String(r.data[map['asset_uid']]) === String(d.assetId) &&
                    String(r.data[map['location']] || "General") === String(d.location || "General") &&
                    String(r.data[map['formula']] || "Manual") === String(d.rawFormula || "Manual") &&
                    String(r.data[map['container_uid']] || "") === String(d.containerUid || "")
                );
                
                if (match) {
                    let currentQty = parseInt(match.data[map['assigned_quantity']], 10) || 0;
                    match.data[map['assigned_quantity']] = currentQty + d.deltaQty;
                } else if (d.deltaQty > 0) {
                    let r = new Array(data[0].length).fill("");
                    if(map['uid'] !== undefined) r[map['uid']] = Utilities.getUuid();
                    if(map['project_uid'] !== undefined) r[map['project_uid']] = String(projectId);
                    if(map['asset_uid'] !== undefined) r[map['asset_uid']] = String(d.assetId);
                    if(map['assigned_quantity'] !== undefined) r[map['assigned_quantity']] = d.deltaQty;
                    if(map['location'] !== undefined) r[map['location']] = d.location || "General";
                    if(map['formula'] !== undefined) r[map['formula']] = d.rawFormula || "Manual";
                    if(map['creator'] !== undefined) r[map['creator']] = d.creator || "System";
                    if(map['container_uid'] !== undefined) r[map['container_uid']] = d.containerUid || "";
                    if(map['scan_status'] !== undefined) r[map['scan_status']] = "Assigned";
                    projectRows.push({ data: r });
                }
            } else {
                if (d.deltaQty > 0) {
                    for (let k = 0; k < d.deltaQty; k++) {
                        let r = new Array(data[0].length).fill("");
                        if(map['uid'] !== undefined) r[map['uid']] = Utilities.getUuid();
                        if(map['project_uid'] !== undefined) r[map['project_uid']] = String(projectId);
                        if(map['asset_uid'] !== undefined) r[map['asset_uid']] = String(d.assetId);
                        if(map['assigned_quantity'] !== undefined) r[map['assigned_quantity']] = 1;
                        if(map['location'] !== undefined) r[map['location']] = d.location || "General";
                        if(map['formula'] !== undefined) r[map['formula']] = d.rawFormula || "Manual";
                        if(map['creator'] !== undefined) r[map['creator']] = d.creator || "System";
                        if(map['container_uid'] !== undefined) r[map['container_uid']] = d.containerUid || "";
                        if(map['scan_status'] !== undefined) r[map['scan_status']] = "Assigned";
                        projectRows.push({ data: r });
                    }
                } else if (d.deltaQty < 0) {
                    let removeCount = Math.abs(d.deltaQty);
                    for (let i = projectRows.length - 1; i >= 0 && removeCount > 0; i--) {
                        let r = projectRows[i];
                        if (String(r.data[map['asset_uid']]) === String(d.assetId) &&
                            String(r.data[map['location']] || "General") === String(d.location || "General") &&
                            String(r.data[map['formula']] || "Manual") === String(d.rawFormula || "Manual") &&
                            String(r.data[map['container_uid']] || "") === String(d.containerUid || "")) 
                        {
                            r.data[map['assigned_quantity']] = 0;
                            removeCount--;
                        }
                    }
                }
            }
        });
        
        projectRows = projectRows.filter(r => (parseInt(r.data[map['assigned_quantity']], 10) || 0) > 0);
        projectRows.forEach(r => keptRows.push(r.data));
        
        sheets.projectAssets.clearContents();
        if(keptRows.length > 0) sheets.projectAssets.getRange(1, 1, keptRows.length, keptRows[0].length).setValues(keptRows);
        
        flushCache();
        writeToAuditLog(actor, "UPDATE", "PROJECT_ASSETS", projectId, projectId, `Applied ${deltas.length} delta change(s) to event assets.`);
        return "Saved Delta";
    });
}

function getProjectAssets(projectId, startDateStr, endDateStr) {
    return getProjectAssetsRepo().getForProject(projectId, startDateStr, endDateStr);
}

function getProjectAssetsSheets_(projectId, startDateStr, endDateStr) {
    return executeWithRetry(() => {
        const sheets = verifyDatabaseSchema(true);
        const data = getSheetData(sheets.projectAssets);
        const map = data.hMap;
        let assets = [];
        let otherAssets = [];
        
        for(let i=1; i<data.length; i++) {
            let pid = String(data[i][map['project_uid']]);
            let isShortage = (data[i][map['formula']] || "").startsWith("[SHORT]");
            
            if(pid === String(projectId)) {
                assets.push({ 
                    uid: data[i][map['uid']], 
                    assetId: String(data[i][map['asset_uid']]), 
                    qty: data[i][map['assigned_quantity']] || 1,
                    location: data[i][map['location']] || "",
                    formula: data[i][map['formula']] || "",
                    creator: data[i][map['creator']] || "System",
                    containerUid: data[i][map['container_uid']] || "",
                    scanStatus: data[i][map['scan_status']] || "Assigned",
                    outboundTruckUid: map['outbound_truck_uid'] !== undefined ? (data[i][map['outbound_truck_uid']] || "") : "",
                    outboundX: map['outbound_x'] !== undefined && data[i][map['outbound_x']] !== "" ? Number(data[i][map['outbound_x']]) : null,
                    outboundY: map['outbound_y'] !== undefined && data[i][map['outbound_y']] !== "" ? Number(data[i][map['outbound_y']]) : null,
                    outboundZ: map['outbound_z'] !== undefined && data[i][map['outbound_z']] !== "" ? Number(data[i][map['outbound_z']]) : null,
                    outboundRotated: map['outbound_rotated'] !== undefined && (data[i][map['outbound_rotated']] === true || data[i][map['outbound_rotated']] === 'true'),
                    outboundStaged: map['outbound_staged'] !== undefined && (data[i][map['outbound_staged']] === true || data[i][map['outbound_staged']] === 'true'),
                    inboundTruckUid: map['inbound_truck_uid'] !== undefined ? (data[i][map['inbound_truck_uid']] || "") : "",
                    inboundX: map['inbound_x'] !== undefined && data[i][map['inbound_x']] !== "" ? Number(data[i][map['inbound_x']]) : null,
                    inboundY: map['inbound_y'] !== undefined && data[i][map['inbound_y']] !== "" ? Number(data[i][map['inbound_y']]) : null,
                    inboundZ: map['inbound_z'] !== undefined && data[i][map['inbound_z']] !== "" ? Number(data[i][map['inbound_z']]) : null,
                    inboundRotated: map['inbound_rotated'] !== undefined && (data[i][map['inbound_rotated']] === true || data[i][map['inbound_rotated']] === 'true'),
                    inboundStaged: map['inbound_staged'] !== undefined && (data[i][map['inbound_staged']] === true || data[i][map['inbound_staged']] === 'true')
                });
            } else if (!isShortage) {
                otherAssets.push({
                    pid: pid,
                    aId: String(data[i][map['asset_uid']]),
                    qty: parseInt(data[i][map['assigned_quantity']], 10) || 0
                });
            }
        }
        
        let overlappingMap = {};
        if (startDateStr && endDateStr) {
            const indexData = getSheetData(sheets.index);
            const iMap = indexData.hMap;
            const timelineData = getSheetData(sheets.timelines);
            const tMap = timelineData.hMap;
            
            let projectDates = {};
            for (let i=1; i<timelineData.length; i++) {
                let pid = timelineData[i][tMap['project_uid']];
                let dStr = timelineData[i][tMap['Event_Date']];
                let eDateStr = "";
                if (dStr instanceof Date) eDateStr = `${dStr.getFullYear()}-${String(dStr.getMonth() + 1).padStart(2, '0')}-${String(dStr.getDate()).padStart(2, '0')}`;
                else if (dStr) { let match = String(dStr).match(/^(\d{4})-(\d{2})-(\d{2})/); if (match) eDateStr = match[0]; }
                
                if (eDateStr) {
                    if (!projectDates[pid]) projectDates[pid] = { start: eDateStr, end: eDateStr };
                    else {
                        if (eDateStr < projectDates[pid].start) projectDates[pid].start = eDateStr;
                        if (eDateStr > projectDates[pid].end) projectDates[pid].end = eDateStr;
                    }
                }
            }
            
            let overlappingPids = new Set();
            for (let i=1; i<indexData.length; i++) {
                let pid = String(indexData[i][iMap['uid']]);
                if (pid === String(projectId)) continue;
                let status = String(indexData[i][iMap['Status']] || 'Draft').toUpperCase();
                if (status === 'CANCELLED' || status === 'TRASHED') continue;
                
                let pDates = projectDates[pid];
                if (pDates && pDates.start <= endDateStr && pDates.end >= startDateStr) {
                    overlappingPids.add(pid);
                }
            }
            
            otherAssets.forEach(pa => {
                if (overlappingPids.has(pa.pid)) {
                    overlappingMap[pa.aId] = (overlappingMap[pa.aId] || 0) + pa.qty;
                }
            });
        }
        
        return { current: assets, overlapping: overlappingMap };
    });
}

// ==========================================
// --- TRUCK ARRANGEMENT SPATIAL SAVING ---
// ==========================================
function saveTruckArrangementAPI(projectId, layoutData, leg = 'outbound', actor = "System UI") {
    return executeWithRetry(() => {
        assertActorCanEditProjectAssets(actor);
        const sheets = verifyDatabaseSchema();
        let data = sheets.projectAssets.getDataRange().getValues();
        let map = {}; if(data.length > 0) data[0].forEach((h,i)=>map[h.toString().trim()]=i);

        let keptRows = [data[0]];
        let projectRowsMap = {}; 
        
        for (let i = 1; i < data.length; i++) {
            if (String(data[i][map['project_uid']]) === String(projectId)) {
                projectRowsMap[data[i][map['uid']]] = data[i];
            } else {
                keptRows.push(data[i]);
            }
        }

        let paUpdates = {};
        layoutData.forEach(item => {
            if (!paUpdates[item.paUid]) paUpdates[item.paUid] = [];
            paUpdates[item.paUid].push(item);
        });

        let tUid = leg + '_truck_uid';
        let tX = leg + '_x';
        let tY = leg + '_y';
        let tZ = leg + '_z';
        let tRot = leg + '_rotated';
        let tStaged = leg + '_staged';

        Object.values(projectRowsMap).forEach(origRow => {
            let uid = origRow[map['uid']];
            if (paUpdates[uid]) {
                if (paUpdates[uid].length === 1 && parseInt(origRow[map['assigned_quantity']], 10) === 1) {
                    // PRESERVE UID: Do not generate a new UID if it's already an Individual Virtual ID!
                    let box = paUpdates[uid][0];
                    let newRow = [...origRow];
                    if (leg === 'both') {
                        if (box.outbound) {
                            if (map['outbound_truck_uid'] !== undefined) newRow[map['outbound_truck_uid']] = box.outbound.truckUid || "";
                            if (map['outbound_x'] !== undefined) newRow[map['outbound_x']] = box.outbound.truckX !== null ? box.outbound.truckX : "";
                            if (map['outbound_y'] !== undefined) newRow[map['outbound_y']] = box.outbound.truckY !== null ? box.outbound.truckY : "";
                            if (map['outbound_z'] !== undefined) newRow[map['outbound_z']] = box.outbound.truckZ !== null ? box.outbound.truckZ : "";
                            if (map['outbound_rotated'] !== undefined) newRow[map['outbound_rotated']] = box.outbound.isRotated || false;
                            if (map['outbound_staged'] !== undefined) newRow[map['outbound_staged']] = box.outbound.isStaged || false;
                        }
                        if (box.inbound) {
                            if (map['inbound_truck_uid'] !== undefined) newRow[map['inbound_truck_uid']] = box.inbound.truckUid || "";
                            if (map['inbound_x'] !== undefined) newRow[map['inbound_x']] = box.inbound.truckX !== null ? box.inbound.truckX : "";
                            if (map['inbound_y'] !== undefined) newRow[map['inbound_y']] = box.inbound.truckY !== null ? box.inbound.truckY : "";
                            if (map['inbound_z'] !== undefined) newRow[map['inbound_z']] = box.inbound.truckZ !== null ? box.inbound.truckZ : "";
                            if (map['inbound_rotated'] !== undefined) newRow[map['inbound_rotated']] = box.inbound.isRotated || false;
                            if (map['inbound_staged'] !== undefined) newRow[map['inbound_staged']] = box.inbound.isStaged || false;
                        }
                    } else {
                        if (map[tUid] !== undefined) newRow[map[tUid]] = box.truckUid || "";
                        if (map[tX] !== undefined) newRow[map[tX]] = box.truckX !== null ? box.truckX : "";
                        if (map[tY] !== undefined) newRow[map[tY]] = box.truckY !== null ? box.truckY : "";
                        if (map[tZ] !== undefined) newRow[map[tZ]] = box.truckZ !== null ? box.truckZ : "";
                        if (map[tRot] !== undefined) newRow[map[tRot]] = box.isRotated || false;
                        if (map[tStaged] !== undefined) newRow[map[tStaged]] = box.isStaged || false;
                    }
                    keptRows.push(newRow);
                } else {
                    // Legacy fallback for splitting grouped Bulk items on the truck
                    paUpdates[uid].forEach(box => {
                        let newRow = [...origRow];
                        newRow[map['uid']] = Utilities.getUuid(); 
                        newRow[map['assigned_quantity']] = 1; 
                        if (leg === 'both') {
                            if (box.outbound) {
                                if (map['outbound_truck_uid'] !== undefined) newRow[map['outbound_truck_uid']] = box.outbound.truckUid || "";
                                if (map['outbound_x'] !== undefined) newRow[map['outbound_x']] = box.outbound.truckX !== null ? box.outbound.truckX : "";
                                if (map['outbound_y'] !== undefined) newRow[map['outbound_y']] = box.outbound.truckY !== null ? box.outbound.truckY : "";
                                if (map['outbound_z'] !== undefined) newRow[map['outbound_z']] = box.outbound.truckZ !== null ? box.outbound.truckZ : "";
                                if (map['outbound_rotated'] !== undefined) newRow[map['outbound_rotated']] = box.outbound.isRotated || false;
                                if (map['outbound_staged'] !== undefined) newRow[map['outbound_staged']] = box.outbound.isStaged || false;
                            }
                            if (box.inbound) {
                                if (map['inbound_truck_uid'] !== undefined) newRow[map['inbound_truck_uid']] = box.inbound.truckUid || "";
                                if (map['inbound_x'] !== undefined) newRow[map['inbound_x']] = box.inbound.truckX !== null ? box.inbound.truckX : "";
                                if (map['inbound_y'] !== undefined) newRow[map['inbound_y']] = box.inbound.truckY !== null ? box.inbound.truckY : "";
                                if (map['inbound_z'] !== undefined) newRow[map['inbound_z']] = box.inbound.truckZ !== null ? box.inbound.truckZ : "";
                                if (map['inbound_rotated'] !== undefined) newRow[map['inbound_rotated']] = box.inbound.isRotated || false;
                                if (map['inbound_staged'] !== undefined) newRow[map['inbound_staged']] = box.inbound.isStaged || false;
                            }
                        } else {
                            if (map[tUid] !== undefined) newRow[map[tUid]] = box.truckUid || "";
                            if (map[tX] !== undefined) newRow[map[tX]] = box.truckX !== null ? box.truckX : "";
                            if (map[tY] !== undefined) newRow[map[tY]] = box.truckY !== null ? box.truckY : "";
                            if (map[tZ] !== undefined) newRow[map[tZ]] = box.truckZ !== null ? box.truckZ : "";
                            if (map[tRot] !== undefined) newRow[map[tRot]] = box.isRotated || false;
                            if (map[tStaged] !== undefined) newRow[map[tStaged]] = box.isStaged || false;
                        }
                        keptRows.push(newRow);
                    });
                }
            } else {
                keptRows.push(origRow);
            }
        });

        sheets.projectAssets.clearContents();
        if(keptRows.length > 0) sheets.projectAssets.getRange(1, 1, keptRows.length, keptRows[0].length).setValues(keptRows);

        flushCache();
        writeToAuditLog(actor, "UPDATE", "TRUCK_ARRANGEMENT", projectId, projectId, `Saved spatial arrangement for ${layoutData.length} cases.`);
        return "Saved Truck Layout";
    });
}

function saveProjectAssetsAPI(projectId, assignedList, actor = "System UI") {
    return executeWithRetry(() => {
        assertActorCanEditProjectAssets(actor);
        const sheets = verifyDatabaseSchema();
        let data = sheets.projectAssets.getDataRange().getValues();
        let map = {};
        if(data.length > 0) data[0].forEach((h,i)=>map[h.toString().trim()]=i);
        
        let keptRows = [data[0]];
        for(let i=1; i<data.length; i++) { if(String(data[i][map['project_uid']]) !== String(projectId)) keptRows.push(data[i]); }
        sheets.projectAssets.clearContents();
        if(keptRows.length > 0) sheets.projectAssets.getRange(1, 1, keptRows.length, keptRows[0].length).setValues(keptRows);
        
        if(assignedList && assignedList.length > 0) {
            let newRows = assignedList.map(a => {
                let r = new Array(data[0].length).fill("");
                if(map['uid'] !== undefined) r[map['uid']] = Utilities.getUuid();
                if(map['project_uid'] !== undefined) r[map['project_uid']] = String(projectId);
                if(map['asset_uid'] !== undefined) r[map['asset_uid']] = String(a.assetId);
                if(map['assigned_quantity'] !== undefined) r[map['assigned_quantity']] = a.qty;
                if(map['location'] !== undefined) r[map['location']] = a.location || "";
                if(map['formula'] !== undefined) r[map['formula']] = a.formula || "";
                if(map['creator'] !== undefined) r[map['creator']] = a.creator || "System";
                if(map['container_uid'] !== undefined) r[map['container_uid']] = a.containerUid || "";
                if(map['scan_status'] !== undefined) r[map['scan_status']] = "Assigned";
                return r;
            });
            sheets.projectAssets.getRange(keptRows.length + 1, 1, newRows.length, data[0].length).setValues(newRows);
        }
        flushCache();
        let aCount = assignedList ? assignedList.length : 0;
        writeToAuditLog(actor, "UPDATE", "PROJECT_ASSETS", projectId, projectId, `Saved ${aCount} asset(s) to event.`);
        return "Saved";
    });
}

// ==========================================
// --- UNIFIED EQUIPMENT TRACKER ENGINE ---
// ==========================================
// @INDEX: TRACKER_ENGINE -> Unified Equipment Matrix Data
function getUnifiedTrackerData(startStr, endStr, searchTerms, actor) {
    return executeWithRetry(() => {
        assertActorCanViewLogistics(actor || 'System');
        const vaultSheets = verifyVaultSchema(true);
        const dbSheets = verifyDatabaseSchema(true);
        
        // 1. Fetch Vehicles for Name Mapping
        const vehicleData = getSheetData(vaultSheets.vehicles);
        const vMap = vehicleData.hMap;
        let truckNames = {};
        let uidCol = vMap['uid'] !== undefined ? vMap['uid'] : vMap['id'];
        for(let i=1; i<vehicleData.length; i++) { 
            if (uidCol !== undefined) truckNames[vehicleData[i][uidCol]] = vehicleData[i][vMap['Name']]; 
        }
        
        // 2. Fetch Projects & Timeline Fragments
        const indexData = getSheetData(dbSheets.index);
        const iMap = indexData.hMap;
        const timelineData = getSheetData(dbSheets.timelines);
        const tMap = timelineData.hMap;
        
        let projects = {};
        for(let i=1; i<indexData.length; i++) {
            let status = String(indexData[i][iMap['Status']] || 'Draft').toUpperCase();
            if(status === 'CANCELLED' || status === 'TRASHED') continue;
            let pid = indexData[i][iMap['uid']] || indexData[i][iMap['Project_ID']];
            projects[pid] = {
                uid: pid,
                name: indexData[i][iMap['Project_Name']],
                type: indexData[i][iMap['Type']] || 'Event',
                status: status,
                dates: []
            };
        }
        
        const extractTime = (val) => {
            if (val === undefined || val === null || val === "") return "";
            if (val instanceof Date) return ("0" + val.getHours()).slice(-2) + ":" + ("0" + val.getMinutes()).slice(-2);
            if (typeof val === 'number') {
                let totalMinutes = Math.round(val * 24 * 60);
                let h = Math.floor(totalMinutes / 60);
                let m = totalMinutes % 60;
                return ("0" + h).slice(-2) + ":" + ("0" + m).slice(-2);
            }
            let s = String(val).trim();
            if (s.includes('T')) s = s.split('T')[1];
            let m = s.match(/(\d{1,2}):(\d{2})/);
            if (m) return ("0" + m[1]).slice(-2) + ":" + m[2];
            return s;
        };

        for(let i=1; i<timelineData.length; i++) {
            let pid = timelineData[i][tMap['project_uid']] || timelineData[i][tMap['Project_ID']];
            if(!projects[pid]) continue;
            let dStr = timelineData[i][tMap['Event_Date']];
            let subType = timelineData[i][tMap['Sub_Event_Type']] || 'MAIN_EVENT';
            let eDateStr = "";
            if(dStr instanceof Date) eDateStr = `${dStr.getFullYear()}-${String(dStr.getMonth() + 1).padStart(2, '0')}-${String(dStr.getDate()).padStart(2, '0')}`;
            else if(dStr) { let match = String(dStr).match(/^(\d{4})-(\d{2})-(\d{2})/); if(match) eDateStr = match[0]; }
            
            if(eDateStr) projects[pid].dates.push({ date: eDateStr, type: subType, startTime: extractTime(timelineData[i][tMap['Start_Time']]), endTime: extractTime(timelineData[i][tMap['End_Time']]) });
        }
        
        // Filter to overlapping projects only
        let activeProjects = {};
        for(let pid in projects) {
            let p = projects[pid];
            if(p.dates.length === 0) continue;
            let minDate = p.dates.reduce((min, p) => p.date < min ? p.date : min, p.dates[0].date);
            let maxDate = p.dates.reduce((max, p) => p.date > max ? p.date : max, p.dates[0].date);
            
            p.startStr = minDate;
            p.endStr = maxDate;
            p.fragments = p.dates;
            if (maxDate >= startStr && minDate <= endStr) {
                activeProjects[pid] = p;
            }
        }
        
        // 3. Fetch Assets (The Warehouse Waterline)
        const assetsData = getSheetData(vaultSheets.assets);
        const aMap = assetsData.hMap;
        let masterAssets = {};
        
        let terms = Array.isArray(searchTerms) ? searchTerms.map(t => String(t || '').toLowerCase().trim()).filter(t => t) : [];
        
        const getVal = (row, keys) => {
            for (let k of keys) {
                if (aMap[k] !== undefined) return row[aMap[k]];
            }
            return "";
        };
        
        // Pre-calculate Total Vault Quantities by Model (The Waterline)
        let modelTotals = {};
        for(let i=1; i<assetsData.length; i++) {
            let name = String(getVal(assetsData[i], ['name', 'Name', 'Item_Name', 'Asset_Name']) || "").trim();
            let mfg = String(getVal(assetsData[i], ['manufacturer', 'Manufacturer', 'Brand']) || "").trim();
            let type = String(getVal(assetsData[i], ['type', 'Type', 'Item_Type', 'item_type']) || "").trim();
            let length = String(getVal(assetsData[i], ['length', 'Length', 'length_m', 'Length_m', 'Length (m)']) || "").trim();
            let uid = getVal(assetsData[i], ['uid', 'id', 'Asset_ID', 'Asset_UID']);
            
            let qtyStr = getVal(assetsData[i], ['qty', 'Qty', 'Quantity', 'total_quantity', 'totalQuantity', 'Total_Quantity', 'Total Quantity']);
            let qty = parseInt(qtyStr, 10);
            if (isNaN(qty)) qty = 0;
            
            let modelKey = "";
            let isBulk = (type.toLowerCase() === 'bulk' || type.toLowerCase() === 'consumable' || qty > 1);
            if (isBulk) { modelKey = 'bulk_' + uid; if (!modelTotals[modelKey]) modelTotals[modelKey] = 0; modelTotals[modelKey] += qty; } 
            else { let lenStr = length ? "|||" + length : ""; modelKey = (name + "|||" + mfg + lenStr).toLowerCase(); if (!modelTotals[modelKey]) modelTotals[modelKey] = 0; modelTotals[modelKey] += 1; }
        }
        
        for(let i=1; i<assetsData.length; i++) {
            let name = String(getVal(assetsData[i], ['name', 'Name', 'Item_Name', 'Asset_Name']) || "").trim();
            let tag = String(getVal(assetsData[i], ['tags', 'Tags', 'Tag', 'Tag_IDs']));
            let mfg = String(getVal(assetsData[i], ['manufacturer', 'Manufacturer', 'Brand']) || "").trim();
            let type = String(getVal(assetsData[i], ['type', 'Type', 'Item_Type', 'item_type']) || "").trim();
            let length = String(getVal(assetsData[i], ['length', 'Length', 'length_m', 'Length_m', 'Length (m)']) || "").trim();
            let uid = getVal(assetsData[i], ['uid', 'id', 'Asset_ID', 'Asset_UID']);
            
            let qtyStr = getVal(assetsData[i], ['qty', 'Qty', 'Quantity', 'total_quantity', 'totalQuantity', 'Total_Quantity', 'Total Quantity']);
            let qty = parseInt(qtyStr, 10);
            if (isNaN(qty)) qty = 0;

            let modelKey = "";
            let isBulk = (type.toLowerCase() === 'bulk' || type.toLowerCase() === 'consumable' || qty > 1);
            if (isBulk) { modelKey = 'bulk_' + uid; } else { let lenStr = length ? "|||" + length : ""; modelKey = (name + "|||" + mfg + lenStr).toLowerCase(); }
            
            if(terms.length > 0) {
                let combined = `${name} ${tag}`.toLowerCase();
                if(!terms.some(term => combined.includes(term))) {
                    continue;
                }
            }
            masterAssets[uid] = {
                uid: uid,
                name: name,
                modelKey: modelKey,
                modelTotalQty: modelTotals[modelKey] || 0,
                unitNumber: String(getVal(assetsData[i], ['unitNumber', 'Unit_Number', 'Unit'])),
                rfidTag: String(getVal(assetsData[i], ['rfidTag', 'RFID_Tag', 'RFID'])),
                serialNumber: String(getVal(assetsData[i], ['serialNumber', 'Serial_Number', 'Serial'])),
                manufacturer: String(getVal(assetsData[i], ['manufacturer', 'Manufacturer', 'Brand'])),
                nestingLevel: getVal(assetsData[i], ['nestingLevel', 'Nesting_Level', 'Level']),
                type: type || 'Physical',
                department: String(getVal(assetsData[i], ['department', 'Department'])),
                weight: String(getVal(assetsData[i], ['weight', 'Weight'])),
                dims: String(getVal(assetsData[i], ['dims', 'Dimensions', 'Dims'])),
                capacity: getVal(assetsData[i], ['capacity', 'Capacity']),
                length: length,
                power: String(getVal(assetsData[i], ['power', 'Power_Draw', 'Power'])),
                price: String(getVal(assetsData[i], ['price', 'Purchase_Price', 'Price'])),
                rental: String(getVal(assetsData[i], ['rental', 'Rental_Price', 'Rental'])),
                dateBought: String(getVal(assetsData[i], ['dateBought', 'Date_Bought'])),
                lastService: String(getVal(assetsData[i], ['lastService', 'Last_Service'])),
                serviceInterval: String(getVal(assetsData[i], ['serviceInterval', 'Service_Interval'])),
                tags: tag,
                status: String(getVal(assetsData[i], ['status', 'Status', 'Lifecycle'])),
                vendorUid: String(getVal(assetsData[i], ['vendorUid', 'Vendor_UID', 'Vendor'])),
                isFixedRack: (getVal(assetsData[i], ['isFixedRack', 'isfixedrack', 'is_fixed_rack', 'fixedrack', 'isfixed']) === true || getVal(assetsData[i], ['isFixedRack', 'isfixedrack', 'is_fixed_rack', 'fixedrack', 'isfixed']) === 'true' || getVal(assetsData[i], ['isFixedRack', 'isfixedrack', 'is_fixed_rack', 'fixedrack', 'isfixed']) === 1),
                totalQty: qty,
                projects: []
            };
        }
        
        // 4. Fetch Assignments (Project Assets)
        const paData = getSheetData(dbSheets.projectAssets);
        const paMap = paData.hMap;
        
        // --- 🏗️ MATRYOSHKA INHERITANCE: Map Container Truck Assignments ---
        let containerTrucks = {};
        for(let i=1; i<paData.length; i++) {
            let pUid = paData[i][paMap['project_uid']] || paData[i][paMap['Project_ID']];
            let aUid = paData[i][paMap['asset_uid']] || paData[i][paMap['Asset_ID']];
            let form = paData[i][paMap['formula']] || 'Standalone';
            let outT = paMap['outbound_truck_uid'] !== undefined ? (paData[i][paMap['outbound_truck_uid']] || "") : "";
            let inT = paMap['inbound_truck_uid'] !== undefined ? (paData[i][paMap['inbound_truck_uid']] || "") : "";
            if (outT || inT) {
                let cid = form !== 'Standalone' ? (aUid + "|||" + form) : aUid;
                containerTrucks[pUid + "|||" + cid] = { out: outT, in: inT };
            }
        }

        for(let i=1; i<paData.length; i++) {
            let aUid = paData[i][paMap['asset_uid']] || paData[i][paMap['Asset_ID']];
            if(!masterAssets[aUid]) continue; 
            
            let pUid = paData[i][paMap['project_uid']] || paData[i][paMap['Project_ID']];
            if(!activeProjects[pUid]) continue;
            
            let isShortage = String(paData[i][paMap['formula']] || "").startsWith("[SHORT]");
            if(isShortage) continue;
            
            let qty = parseInt(paData[i][paMap['assigned_quantity']], 10) || 0;
            if(qty <= 0) continue;
            
            let outT = paMap['outbound_truck_uid'] !== undefined ? (paData[i][paMap['outbound_truck_uid']] || "") : "";
            let inT = paMap['inbound_truck_uid'] !== undefined ? (paData[i][paMap['inbound_truck_uid']] || "") : "";
            let cUid = paData[i][paMap['container_uid']];
            if (cUid) {
                let parentKey = pUid + "|||" + cUid;
                if (containerTrucks[parentKey]) {
                    if (!outT) outT = containerTrucks[parentKey].out;
                    if (!inT) inT = containerTrucks[parentKey].in;
                }
            }
            
            // Find or create the Project Envelope
            let projEnvelope = masterAssets[aUid].projects.find(p => p.projectUid === pUid);
            if (!projEnvelope) {
                projEnvelope = {
                    projectUid: pUid,
                    projectName: activeProjects[pUid].name || 'Unknown Project',
                    deployments: []
                };
                masterAssets[aUid].projects.push(projEnvelope);
            }

            let loc = paData[i][paMap['location']] || 'General';
            let form = paData[i][paMap['formula']] || 'Standalone';
            
            let dep = projEnvelope.deployments.find(d => d.location === loc && d.formula === form);
            if (dep) {
                dep.qty += qty;
            } else {
                projEnvelope.deployments.push({ 
                    location: loc, 
                    formula: form, 
                    qty: qty, 
                    startStr: activeProjects[pUid].startStr, 
                    endStr: activeProjects[pUid].endStr,
                    outboundTruckUid: outT,
                    inboundTruckUid: inT
                });
            }
        }
        
        // 5. Formatting Payload
        let finalAssets = [];
        for(let uid in masterAssets) {
            // Return if it explicitly matches the user's text search, OR if it's currently deployed in the window
            if(terms.length > 0 || masterAssets[uid].projects.length > 0) {
                finalAssets.push(masterAssets[uid]);
            } else {
                // If no search term, but asset has deployments, we still need it.
                if (masterAssets[uid].projects.some(p => p.deployments.length > 0)) finalAssets.push(masterAssets[uid]);
            }
        }
        
        // --- GLOBAL AVAILABILITY CALCULATION ---
        let globalUsageByModel = {};
        for (let i = 1; i < paData.length; i++) {
            let pUid = paData[i][paMap['project_uid']] || paData[i][paMap['Project_ID']];
            if (!activeProjects[pUid]) continue;
            
            let aUid = paData[i][paMap['asset_uid']] || paData[i][paMap['Asset_ID']];
            let assetInfo = masterAssets[aUid];
            if (!assetInfo) continue;

            let modelKey = assetInfo.modelKey;
            let qty = parseInt(paData[i][paMap['assigned_quantity']], 10) || 0;

            if (!globalUsageByModel[modelKey]) globalUsageByModel[modelKey] = {};
            let date = activeProjects[pUid].startStr;
            while (date <= activeProjects[pUid].endStr) {
                if (!globalUsageByModel[modelKey][date]) globalUsageByModel[modelKey][date] = 0;
                globalUsageByModel[modelKey][date] += qty;
                let d = new Date(date + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + 1); date = d.toISOString().split('T')[0];
            }
        }
        
        let strips = Object.values(activeProjects).map(p => ({ id: p.uid, name: p.name, startStr: p.startStr, endStr: p.endStr, status: p.status, type: p.type, fragments: p.fragments }));
        return { startStr: startStr, endStr: endStr, assets: finalAssets, strips: strips, globalUsage: globalUsageByModel };
    });
}

// ==========================================
// --- MASTER LOGISTICS AGGREGATOR ---
// ==========================================
// @INDEX: PA_ENGINE -> Master Logistics Aggregator
function generateLogisticsPayloadAPI(projectId, deltas, logData, actor = "System UI") {
    return executeWithRetry(() => {
        const sheets = verifyDatabaseSchema();
        
        let newTimestamp = new Date().toISOString();
        
        // --- 0. CONCURRENCY CHECK & READINESS STATE ---
        let indexData = sheets.index.getDataRange().getValues();
        let iMap = {}; if(indexData.length > 0) indexData[0].forEach((h,i)=>iMap[h.toString().trim()]=i);
        let projRowIndex = -1;
        
        for (let i = 1; i < indexData.length; i++) {
            if (indexData[i][iMap['uid']] === projectId) {
                projRowIndex = i + 1;
                let dbTimestamp = indexData[i][iMap['Last_Updated']];
                let clientTimestamp = logData.clientTimestamp;
                if (dbTimestamp && clientTimestamp) {
                    let t1 = new Date(dbTimestamp).getTime();
                    let t2 = new Date(clientTimestamp).getTime();
                    if (Math.abs(t1 - t2) > 2000) {
                        throw new Error("COLLISION_DETECTED: This project was modified by another user. Please refresh and try again.");
                    }
                }
                sheets.index.getRange(projRowIndex, iMap['Last_Updated'] + 1).setValue(newTimestamp);
                if (logData.readinessStateStr && iMap['Readiness_State'] !== undefined) {
                    sheets.index.getRange(projRowIndex, iMap['Readiness_State'] + 1).setValue(logData.readinessStateStr);
                }
                break;
            }
        }
        
        if (projRowIndex === -1) throw new Error("Project not found.");

        // --- 1. SAVE PROJECT ASSETS DELTA ---
        if (deltas && deltas.length > 0) {
            let paData = sheets.projectAssets.getDataRange().getValues();
            let pMap = {}; if(paData.length > 0) paData[0].forEach((h,i)=>pMap[h.toString().trim()]=i);
            
            let keptPaRows = [paData[0]];
            let projectPaRows = [];
            for(let i=1; i<paData.length; i++) { 
                if(String(paData[i][pMap['project_uid']]) !== String(projectId)) {
                    keptPaRows.push(paData[i]); 
                } else {
                    projectPaRows.push({ data: paData[i] });
                }
            }
            
            deltas.forEach(d => {
                if (d.isBulk) {
                    let match = projectPaRows.find(r => 
                        String(r.data[pMap['asset_uid']]) === String(d.assetId) &&
                        String(r.data[pMap['location']] || "General") === String(d.location || "General") &&
                        String(r.data[pMap['formula']] || "Manual") === String(d.rawFormula || "Manual") &&
                        String(r.data[pMap['container_uid']] || "") === String(d.containerUid || "")
                    );
                    if (match) {
                        let currentQty = parseInt(match.data[pMap['assigned_quantity']], 10) || 0;
                        match.data[pMap['assigned_quantity']] = currentQty + d.deltaQty;
                    } else if (d.deltaQty > 0) {
                        let r = new Array(paData[0].length).fill("");
                        if(pMap['uid'] !== undefined) r[pMap['uid']] = Utilities.getUuid();
                        if(pMap['project_uid'] !== undefined) r[pMap['project_uid']] = String(projectId);
                        if(pMap['asset_uid'] !== undefined) r[pMap['asset_uid']] = String(d.assetId);
                        if(pMap['assigned_quantity'] !== undefined) r[pMap['assigned_quantity']] = d.deltaQty;
                        if(pMap['location'] !== undefined) r[pMap['location']] = d.location || "General";
                        if(pMap['formula'] !== undefined) r[pMap['formula']] = d.rawFormula || "Manual";
                        if(pMap['creator'] !== undefined) r[pMap['creator']] = d.creator || "System";
                        if(pMap['container_uid'] !== undefined) r[pMap['container_uid']] = d.containerUid || "";
                        if(pMap['scan_status'] !== undefined) r[pMap['scan_status']] = "Assigned";
                        projectPaRows.push({ data: r });
                    }
                } else {
                    if (d.deltaQty > 0) {
                        for (let k = 0; k < d.deltaQty; k++) {
                            let r = new Array(paData[0].length).fill("");
                            if(pMap['uid'] !== undefined) r[pMap['uid']] = Utilities.getUuid();
                            if(pMap['project_uid'] !== undefined) r[pMap['project_uid']] = String(projectId);
                            if(pMap['asset_uid'] !== undefined) r[pMap['asset_uid']] = String(d.assetId);
                            if(pMap['assigned_quantity'] !== undefined) r[pMap['assigned_quantity']] = 1;
                            if(pMap['location'] !== undefined) r[pMap['location']] = d.location || "General";
                            if(pMap['formula'] !== undefined) r[pMap['formula']] = d.rawFormula || "Manual";
                            if(pMap['creator'] !== undefined) r[pMap['creator']] = d.creator || "System";
                            if(pMap['container_uid'] !== undefined) r[pMap['container_uid']] = d.containerUid || "";
                            if(pMap['scan_status'] !== undefined) r[pMap['scan_status']] = "Assigned";
                            projectPaRows.push({ data: r });
                        }
                    } else if (d.deltaQty < 0) {
                        let removeCount = Math.abs(d.deltaQty);
                        for (let i = projectPaRows.length - 1; i >= 0 && removeCount > 0; i--) {
                            let r = projectPaRows[i];
                            if (String(r.data[pMap['asset_uid']]) === String(d.assetId) &&
                                String(r.data[pMap['location']] || "General") === String(d.location || "General") &&
                                String(r.data[pMap['formula']] || "Manual") === String(d.rawFormula || "Manual") &&
                                String(r.data[pMap['container_uid']] || "") === String(d.containerUid || "")) 
                            {
                                r.data[pMap['assigned_quantity']] = 0;
                                removeCount--;
                            }
                        }
                    }
                }
            });
            
            projectPaRows = projectPaRows.filter(r => (parseInt(r.data[pMap['assigned_quantity']], 10) || 0) > 0);
            projectPaRows.forEach(r => keptPaRows.push(r.data));
            
            sheets.projectAssets.clearContents();
            if(keptPaRows.length > 0) sheets.projectAssets.getRange(1, 1, keptPaRows.length, keptPaRows[0].length).setValues(keptPaRows);
        }

        // --- 2. TIMELINE DATA LOGIC (READ) ---
        let shiftData = sheets.shifts.getDataRange().getValues();
        let sMap = {}; if(shiftData.length > 0) shiftData[0].forEach((h,i)=>sMap[h.toString().trim()]=i);
        let tShifts = [];
        let tAssigned = [];
        let keptShiftRows = [shiftData[0]];
        let deletedShiftRows = [];
        
        for (let i = 1; i < shiftData.length; i++) {
            if (shiftData[i][sMap['project_uid']] === projectId) {
                let uVal = shiftData[i][sMap['user_uid']];
                tShifts.push({
                    id: shiftData[i][sMap['uid']], user_uid: uVal, email: uVal, role: shiftData[i][sMap['Role']],
                    start: Number(shiftData[i][sMap['Start']]), duration: Number(shiftData[i][sMap['Duration']]),
                    hasArrow: shiftData[i][sMap['Has_Arrow']], note: shiftData[i][sMap['Note']] || "",
                    payment_status: shiftData[i][sMap['payment_status']] || 'Pending', paid_amount: shiftData[i][sMap['paid_amount']] || ''
                });
                if (!tAssigned.includes(uVal)) tAssigned.push(uVal);
                deletedShiftRows.push(shiftData[i]);
            } else {
                keptShiftRows.push(shiftData[i]);
            }
        }
        
        // Remove old AUTO shifts
        tShifts = tShifts.filter(s => s.note !== "⚠️ AUTO-OUTBOUND" && s.note !== "⚠️ AUTO-INBOUND");

        // --- 3. GENERATE TRUCK SHIFTS ---
        if (logData.generateTimes) {
            logData.outTrucks.forEach((tUid, idx) => {
                if (!tAssigned.includes(tUid)) tAssigned.push(tUid);
                
                let loadTime = logData.outStartHr;
                let unloadTime = logData.outStartHr + logData.outDur;
                
                // LOAD SHIFT (2 Hours)
                tShifts.push({ id: 's_' + Date.now() + '_L' + idx + Math.random().toString(36).substr(2,5), user_uid: tUid, email: tUid, start: loadTime, duration: 2, role: logData.truckNames[tUid] || 'TRUCK', color: '#e5e7eb', textCol: '#18181b', hasArrow: false, note: "⚠️ AUTO-OUTBOUND" });
                tShifts.push({ id: 's_' + Date.now() + '_U' + idx + Math.random().toString(36).substr(2,5), user_uid: tUid, email: tUid, start: unloadTime, duration: 2, role: logData.truckNames[tUid] || 'TRUCK', color: '#e5e7eb', textCol: '#18181b', hasArrow: false, note: "⚠️ AUTO-OUTBOUND" });
            });
            logData.inTrucks.forEach((tUid, idx) => {
                if (!tAssigned.includes(tUid)) tAssigned.push(tUid);
                let loadTime = logData.inStartHr;
                let unloadTime = logData.inStartHr + logData.inDur;
                tShifts.push({ id: 's_' + Date.now() + '_IL' + idx + Math.random().toString(36).substr(2,5), user_uid: tUid, email: tUid, start: loadTime, duration: 2, role: logData.truckNames[tUid] || 'TRUCK', color: '#e5e7eb', textCol: '#18181b', hasArrow: false, note: "⚠️ AUTO-INBOUND" });
                tShifts.push({ id: 's_' + Date.now() + '_IU' + idx + Math.random().toString(36).substr(2,5), user_uid: tUid, email: tUid, start: unloadTime, duration: 2, role: logData.truckNames[tUid] || 'TRUCK', color: '#e5e7eb', textCol: '#18181b', hasArrow: false, note: "⚠️ AUTO-INBOUND" });
            });
        }

        // --- 4. TIMELINE DATA LOGIC (WRITE) ---
        if (tShifts.length > 0) {
            let shiftRows = tShifts.map(s => {
                let r = new Array(shiftData[0].length).fill("");
                if(sMap['uid'] !== undefined) r[sMap['uid']] = s.id || Utilities.getUuid();
                if(sMap['project_uid'] !== undefined) r[sMap['project_uid']] = projectId;
                if(sMap['Phase_Mode'] !== undefined) r[sMap['Phase_Mode']] = 'main'; // default to main
                if(sMap['user_uid'] !== undefined) r[sMap['user_uid']] = s.user_uid || s.email;
                if(sMap['Role'] !== undefined) r[sMap['Role']] = s.role;
                if(sMap['Start'] !== undefined) r[sMap['Start']] = s.start;
                if(sMap['Duration'] !== undefined) r[sMap['Duration']] = s.duration;
                if(sMap['Has_Arrow'] !== undefined) r[sMap['Has_Arrow']] = s.hasArrow || false;
                if(sMap['Note'] !== undefined) r[sMap['Note']] = s.note || "";
                if(sMap['payment_status'] !== undefined) r[sMap['payment_status']] = s.payment_status || 'Pending';
                if(sMap['paid_amount'] !== undefined) r[sMap['paid_amount']] = s.paid_amount || '';
                return r;
            });
            keptShiftRows.push(...shiftRows);
        }
        sheets.shifts.clearContents();
        if (keptShiftRows.length > 0) sheets.shifts.getRange(1, 1, keptShiftRows.length, keptShiftRows[0].length).setValues(keptShiftRows);

        // Notify changes
        let oldShiftIds = deletedShiftRows.map(r => r[sMap['uid']]);
        let newShiftIds = tShifts.map(s => s.id);
        let addedShifts = newShiftIds.filter(id => !oldShiftIds.includes(id)).length;
        let deletedShifts = oldShiftIds.filter(id => !newShiftIds.includes(id)).length;
        let keptShifts = newShiftIds.filter(id => oldShiftIds.includes(id)).length;
        let changeMsgs = [];
        if (addedShifts > 0) changeMsgs.push(`Added ${addedShifts} shift(s)`);
        if (deletedShifts > 0) changeMsgs.push(`Deleted ${deletedShifts} shift(s)`);
        if (keptShifts > 0) changeMsgs.push(`Updated ${keptShifts} shift(s)`);
        let deltaPayload = changeMsgs.join(' | ') || "Saved timeline with no modifications.";

        flushCache();
        SpreadsheetApp.flush();
        writeToAuditLog(actor, "UPDATE", "LOGISTICS_HUB", projectId, projectId, `Logistics Generated. ${deltas?deltas.length:0} Asset Deltas. ` + deltaPayload);

        // --- 5. RETURN FRESH DATA ---
        let finalAssets = getProjectAssets(projectId, logData.sDateStr, logData.eDateStr);
        
        return { success: true, assets: finalAssets, timestamp: newTimestamp };
    });
}