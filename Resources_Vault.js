/**
 * SM Showrunner (smuruner) - Clean 8 Architecture
 * Resources_Vault.js - Master Data & Entity Provisioning
 */

// ==========================================
// --- VAULT CRUD: ASSETS, CLIENTS, VEHICLES ---
// ==========================================
// @INDEX: VAULT_CRUD -> Provision Assets & Entities

// @INDEX: IAM -> Provision New Asset
function provisionNewAsset(adminName, payload, existingId = null, quantity = 1) {
  return executeWithRetry(() => {
    if (typeof verifyBackendPrivilege === 'function' && !verifyBackendPrivilege(adminName, "EDITOR")) {
       return { success: false, error: "🛑 PERMISSION DENIED: You lack EDITOR privileges to provision new assets." };
    }
    
    const sheets = verifyVaultSchema();
    const assetSheet = sheets.assets;
    const data = assetSheet.getDataRange().getValues();
    
    let map = {};
    if(data.length > 0) data[0].forEach((h,i)=>map[h.toString().trim()]=i);
    
    // 🔥 HYPER-ROBUST COLUMN RESOLVER
    const getCol = (matchStrs) => {
        let key = Object.keys(map).find(k => {
            let clean = String(k).toLowerCase().replace(/[^a-z0-9]/g, '');
            return matchStrs.includes(clean);
        });
        return key !== undefined ? map[key] : undefined;
    };
    let cNameIdx = getCol(['name', 'assetname', 'itemname']) ?? 4;
    let cCompsIdx = getCol(['components', 'kitcontents', 'contents']) ?? 29;
    let cTypeIdx = getCol(['type', 'itemtype']) ?? 6;
    let cQtyIdx = getCol(['qty', 'quantity', 'totalquantity', 'total_quantity']) ?? 27;
    let cContainer = getCol(['containertype', 'container']) ?? 11;
    let cNesting = getCol(['nestinglevel', 'level', 'nesting']) ?? 12;
    let cIsFixed = getCol(['isfixedrack', 'isfixed', 'fixedrack']) ?? 30; // Ensuring DB expansion
    let cIsConsumable = getCol(['isconsumable', 'consumable']) ?? 31;
    let cUid = getCol(['uid', 'id', 'assetuid']) ?? 0;

    let filteredComponentsStr = "";
    if (payload.hasOwnProperty('components')) {
        let requestedComps = payload.components ? payload.components.split(',').map(c => {
            let match = c.trim().match(/^(\d+)x\s+(.*)$/i);
            if (match) return { qty: parseInt(match[1], 10), name: match[2].trim(), raw: c.trim() };
            return { qty: 1, name: c.trim(), raw: c.trim() };
        }).filter(c => c.name) : [];
        
        let allTrackedNames = new Set();
        for (let r = 1; r < data.length; r++) {
             if (data[r][cNameIdx]) allTrackedNames.add(String(data[r][cNameIdx]).toLowerCase().trim());
        }
        
        let untrackedRaw = [];
        requestedComps.forEach(comp => {
             if (!allTrackedNames.has(comp.name.toLowerCase())) untrackedRaw.push(comp.raw);
        });
        filteredComponentsStr = untrackedRaw.join(', ');
    }

    let idsToUpdate = Array.isArray(existingId) ? existingId : (existingId ? [existingId] : []);
    let updatedCount = 0;
    
    if (idsToUpdate.length > 0) {
        for (let i = 1; i < data.length; i++) {
            if (idsToUpdate.includes(data[i][map['uid']])) {
                let row = data[i];
                if(map['name'] !== undefined && payload.hasOwnProperty('name')) row[map['name']] = payload.name;
                
                if(idsToUpdate.length === 1) {
                    if(map['unit_number'] !== undefined && payload.hasOwnProperty('unitNumber')) row[map['unit_number']] = payload.unitNumber;
                    if(map['rfid_tag'] !== undefined && payload.hasOwnProperty('rfidTag')) row[map['rfid_tag']] = payload.rfidTag;
                }
                
                if(map['manufacturer'] !== undefined && payload.hasOwnProperty('manufacturer')) row[map['manufacturer']] = payload.manufacturer;
                if(map['nesting_level'] !== undefined && payload.hasOwnProperty('nestingLevel')) row[map['nesting_level']] = payload.nestingLevel;
                if(map['type'] !== undefined && payload.hasOwnProperty('type')) row[map['type']] = payload.type;
                if(map['department'] !== undefined && payload.hasOwnProperty('department')) row[map['department']] = payload.department;
                if(map['wh_uid'] !== undefined && payload.hasOwnProperty('whId')) row[map['wh_uid']] = payload.whId;
                if(map['zone_uid'] !== undefined && payload.hasOwnProperty('zoneId')) row[map['zone_uid']] = payload.zoneId;
                if(map['area_uid'] !== undefined && payload.hasOwnProperty('areaId')) row[map['area_uid']] = payload.areaId;
                if(map['weight_kg'] !== undefined && payload.hasOwnProperty('weight')) row[map['weight_kg']] = payload.weight;
                if(map['dims'] !== undefined && payload.hasOwnProperty('dims')) row[map['dims']] = payload.dims;
                if(map['length_m'] !== undefined && payload.hasOwnProperty('length')) row[map['length_m']] = payload.length;
                if(map['power_w'] !== undefined && payload.hasOwnProperty('power')) row[map['power_w']] = payload.power;
                if(map['price'] !== undefined && payload.hasOwnProperty('price')) row[map['price']] = payload.price;
                if(map['rental'] !== undefined && payload.hasOwnProperty('rental')) row[map['rental']] = payload.rental;
                if(map['date_bought'] !== undefined && payload.hasOwnProperty('dateBought')) row[map['date_bought']] = payload.dateBought;
                if(map['status'] !== undefined && payload.hasOwnProperty('lifecycle')) row[map['status']] = payload.lifecycle;
                if(map['status_note'] !== undefined && payload.hasOwnProperty('statusNote')) row[map['status_note']] = payload.statusNote;
                if(map['status_note'] !== undefined && payload.hasOwnProperty('lifecycle')) {
                  const life = String(payload.lifecycle || '').trim();
                  if (life === 'Active' || life === 'Repaired') row[map['status_note']] = '';
                  else if (life === 'Damaged' && payload.hasOwnProperty('statusNote')) row[map['status_note']] = payload.statusNote;
                }
                if(map['last_service'] !== undefined && payload.hasOwnProperty('lastService')) row[map['last_service']] = payload.lastService;
                if(map['service_interval'] !== undefined && payload.hasOwnProperty('serviceInterval')) row[map['service_interval']] = payload.serviceInterval;
                if(map['tags'] !== undefined && payload.hasOwnProperty('tags')) row[map['tags']] = payload.tags;
                if(map['total_quantity'] !== undefined && payload.hasOwnProperty('type') && payload.type === 'Bulk') row[map['total_quantity']] = quantity;
                if(cIsFixed !== undefined && payload.hasOwnProperty('isFixedRack')) row[cIsFixed] = payload.isFixedRack;
                if(cIsConsumable !== undefined && payload.hasOwnProperty('isConsumable')) row[cIsConsumable] = payload.isConsumable;
                if(map['capacity'] !== undefined && payload.hasOwnProperty('capacity')) row[map['capacity']] = payload.capacity;
                if(map['Serial_Number'] !== undefined && payload.hasOwnProperty('serialNumber')) row[map['Serial_Number']] = payload.serialNumber;
                if(map['vendor_uid'] !== undefined && payload.hasOwnProperty('vendorUid')) row[map['vendor_uid']] = payload.vendorUid;
                
                // 🔥 CRITICAL FIX: Ensure the JSON string is wiped even if the header is capitalized
                if(cCompsIdx !== undefined && payload.hasOwnProperty('components')) row[cCompsIdx] = filteredComponentsStr;
                
                assetSheet.getRange(i + 1, 1, 1, row.length).setValues([row]);
                updatedCount++;
            }
        }
    }

    let itemsToCreate = 0;
    if (idsToUpdate.length === 0) {
        itemsToCreate = payload.type === 'Bulk' ? 1 : quantity;
    } else if (payload.type !== 'Bulk' && quantity > idsToUpdate.length) {
        itemsToCreate = quantity - idsToUpdate.length;
    }

    let createdUids = [];
    if (itemsToCreate > 0) {
        let newRows = [];
        let startUnitNum = payload.unitNumber ? parseInt(payload.unitNumber, 10) : null;
        let unitPadding = payload.unitNumber ? payload.unitNumber.length : 2;
        let existingUnits = [];
        
        // --- ANTI-DUPLICATION ENGINE ---
        // Double-check the Vault inside this locked transaction. If a delayed network 
        // request submitted the exact same starting unit number, we must recalculate it.
        if (payload.type !== 'Bulk' && startUnitNum !== null && !isNaN(startUnitNum)) {
            for (let r = 1; r < data.length; r++) {
                if (data[r][map['name']] === payload.name && data[r][map['manufacturer']] === payload.manufacturer) {
                    let uVal = data[r][map['unit_number']];
                    if (uVal) {
                        let n = parseInt(uVal, 10);
                        if (!isNaN(n)) existingUnits.push(n);
                    }
                }
            }
            
            if (idsToUpdate.length === 1 && !existingUnits.includes(startUnitNum)) {
                existingUnits.push(startUnitNum);
            }
            existingUnits.sort((a, b) => a - b);
        }
        // -------------------------------

        let nextU = startUnitNum;
        for (let q = 0; q < itemsToCreate; q++) {
            let nRow = new Array(data[0].length).fill("");
            let newUid = Utilities.getUuid();
            createdUids.push(newUid);
            
            if(map['uid'] !== undefined) nRow[map['uid']] = newUid;
            if(map['name'] !== undefined) nRow[map['name']] = payload.name;
            
            if(map['unit_number'] !== undefined) {
                if (payload.type !== 'Bulk' && startUnitNum !== null && !isNaN(startUnitNum)) {
                    while (existingUnits.includes(nextU)) nextU++;
                    nRow[map['unit_number']] = String(nextU).padStart(unitPadding, '0');
                    existingUnits.push(nextU);
                } else {
                    nRow[map['unit_number']] = payload.unitNumber || "";
                }
            }
            
            if(map['rfid_tag'] !== undefined) nRow[map['rfid_tag']] = (idsToUpdate.length === 0 && q === 0) ? payload.rfidTag : "";
            if(map['manufacturer'] !== undefined) nRow[map['manufacturer']] = payload.manufacturer;
            if(map['nesting_level'] !== undefined) nRow[map['nesting_level']] = payload.nestingLevel;
            if(map['type'] !== undefined) nRow[map['type']] = payload.type;
            if(map['department'] !== undefined) nRow[map['department']] = payload.department;
            if(map['wh_uid'] !== undefined) nRow[map['wh_uid']] = payload.whId;
            if(map['zone_uid'] !== undefined) nRow[map['zone_uid']] = payload.zoneId;
            if(map['area_uid'] !== undefined) nRow[map['area_uid']] = payload.areaId;
            if(map['weight_kg'] !== undefined) nRow[map['weight_kg']] = payload.weight;
            if(map['dims'] !== undefined) nRow[map['dims']] = payload.dims;
            if(map['length_m'] !== undefined) nRow[map['length_m']] = payload.length;
            if(map['power_w'] !== undefined) nRow[map['power_w']] = payload.power;
            if(map['price'] !== undefined) nRow[map['price']] = payload.price;
            if(map['rental'] !== undefined) nRow[map['rental']] = payload.rental;
            if(map['date_bought'] !== undefined) nRow[map['date_bought']] = payload.dateBought;
            if(map['status'] !== undefined) nRow[map['status']] = payload.lifecycle;
            if(map['status_note'] !== undefined && payload.hasOwnProperty('statusNote')) nRow[map['status_note']] = payload.statusNote;
            if(map['last_service'] !== undefined) nRow[map['last_service']] = payload.lastService;
            if(map['service_interval'] !== undefined) nRow[map['service_interval']] = payload.serviceInterval;
            if(map['tags'] !== undefined) nRow[map['tags']] = payload.tags;
            if(map['total_quantity'] !== undefined) nRow[map['total_quantity']] = (payload.type === 'Bulk') ? itemsToCreate : 1;
            if(cIsFixed !== undefined) nRow[cIsFixed] = payload.isFixedRack || false;
            if(cIsConsumable !== undefined) nRow[cIsConsumable] = payload.isConsumable || false;
            if(map['capacity'] !== undefined) nRow[map['capacity']] = payload.capacity;
            if(map['Serial_Number'] !== undefined) nRow[map['Serial_Number']] = payload.serialNumber || "";
            if(map['vendor_uid'] !== undefined) nRow[map['vendor_uid']] = payload.vendorUid || "";
            if(cCompsIdx !== undefined) nRow[cCompsIdx] = payload.hasOwnProperty('components') ? filteredComponentsStr : "";
            
            newRows.push(nRow);
        }
        if (newRows.length > 0) {
            assetSheet.getRange(assetSheet.getLastRow() + 1, 1, newRows.length, data[0].length).setValues(newRows);
            data.push(...newRows); // Ensure the Bottom-Up sync below can see newly created rows
        }
    }

    // ==========================================
    // 🏗️ ARCHITECTURAL WARNING: MATRYOSHKA PROTOCOL (TRUE SYNC)
    // ==========================================
    // In the UI, users build cases "Top-Down". In this Relational DB, it MUST be "Bottom-Up".
    // When a Case is saved, we parse its `components`, reach down to find the physical children, 
    // and write the Case's UID into their `container_type` column.
    //
    // FLUID KITS VS FIXED RACKS:
    // - FLUID KIT: Mathematically distributes available loose matching items into the case.
    // - FIXED RACK: Bypasses math entirely and fuses the exact specified UIDs to the case permanently.
    let activeCaseUids = [...idsToUpdate, ...createdUids];

    let isContainer = false;
    if (payload.nestingLevel == 3 || payload.nestingLevel == 4 || payload.nestingLevel == 5 || payload.type === 'Container') isContainer = true;
    if (!isContainer && idsToUpdate.length > 0) {
        for (let r = 1; r < data.length; r++) {
            if (idsToUpdate.includes(data[r][cUid])) {
                let dbNesting = parseInt(data[r][cNesting], 10);
                let dbType = String(data[r][cTypeIdx]).trim();
                if (dbNesting == 3 || dbNesting == 4 || dbNesting == 5 || dbType === 'Container') isContainer = true;
                break;
            }
        }
    }
    
    let syncLog = { linked: 0, unlinked: 0, shortages: [] };
    let trueSyncChanged = false;

    if (isContainer && activeCaseUids.length > 0 && payload.components !== undefined) {
        
        // STEP 1: EJECT ALL CURRENT CONTENTS OF THE ACTIVE CASES ("START ANEW")
        for (let r = 1; r < data.length; r++) {
            let parentId = String(data[r][cContainer]).trim();
            if (parentId && activeCaseUids.includes(parentId)) {
                data[r][cContainer] = "";
                syncLog.unlinked++;
                trueSyncChanged = true;
            }
        }
        
        if (payload.kitMode === 'fixed' && payload.fixedChildren) {
            // 🔒 FIXED RACK MODE: Hard-Link exact UIDs
            let targetCaseUid = activeCaseUids[0]; // Fixed Racks are edited 1:1
            for (let r = 1; r < data.length; r++) {
                let childUid = String(data[r][cUid]).trim();
                if (payload.fixedChildren.includes(childUid)) {
                    data[r][cContainer] = targetCaseUid;
                    syncLog.linked++;
                    trueSyncChanged = true;
                }
            }
        } else {
            // 🌊 FLUID KIT MODE (True Sync): Mathematically distribute generic available loose items.

        let requestedComps = [];
        if (String(payload.components).trim() !== "") {
            requestedComps = payload.components.split(',').map(c => {
                let match = c.trim().match(/^(\d+)x\s+(.*)$/i);
                if (match) return { qty: parseInt(match[1], 10), name: match[2].trim().toLowerCase() };
                return { qty: 1, name: c.trim().toLowerCase() };
            }).filter(c => c.name);
            
            // TRUE SYNC FILTER: Ignore untracked/text-only items so we don't trigger false shortages
            let trackedAssetNames = new Set();
            for (let r = 1; r < data.length; r++) {
                if (data[r][cNameIdx]) trackedAssetNames.add(String(data[r][cNameIdx]).toLowerCase().trim());
            }
            requestedComps = requestedComps.filter(c => trackedAssetNames.has(c.name));
        }
        
        let allValidCaseUids = new Set();
        for (let r = 1; r < data.length; r++) {
            let nl = parseInt(data[r][cNesting], 10);
            let t = String(data[r][cTypeIdx]).trim();
            if (nl == 3 || nl == 4 || nl == 5 || t === 'Container') {
                allValidCaseUids.add(String(data[r][cUid]).trim());
            }
        }
        activeCaseUids.forEach(uid => allValidCaseUids.add(String(uid).trim()));
        
        // STEP 2: RE-PACK EACH COMPONENT EVENLY ACROSS ALL ACTIVE CASES
        requestedComps.forEach(comp => {
            let availableItems = [];
            for (let r = 1; r < data.length; r++) {
                if (String(data[r][cNameIdx] || "").toLowerCase().trim() === comp.name) {
                    let parentId = String(data[r][cContainer] || "").trim();
                    let isFree = false;
                    
                    if (!parentId) {
                        isFree = true;
                    } else if (!allValidCaseUids.has(parentId)) {
                        isFree = true; // Container was deleted
                    } else {
                        let pManifest = containerManifests[parentId] || "";
                        if (!pManifest.includes(comp.name)) isFree = true; // Ghost relation
                    }
                    
                    if (isFree) {
                        let iType = String(data[r][cTypeIdx] || "").toLowerCase().trim();
                        let iQty = iType === 'bulk' ? (parseInt(data[r][cQtyIdx], 10) || 1) : 1;
                        availableItems.push({ rowIdx: r, qty: iQty, type: iType });
                    }
                }
            }

            let shortageCount = 0;
            activeCaseUids.forEach(caseUid => {
                let targetCaseStr = String(caseUid).trim();
                let needed = comp.qty;
                
                for (let i = 0; i < availableItems.length && needed > 0; i++) {
                    let av = availableItems[i];
                    if (av.qty === 0) continue; // Already used up
                    if (av.type === 'bulk' && av.qty > needed) continue; // Skip oversized bulk
                    
                    data[av.rowIdx][cContainer] = targetCaseStr;
                    needed -= av.qty;
                    av.qty = 0; // Mark as consumed
                    syncLog.linked++;
                    trueSyncChanged = true;
                }
                
                if (needed > 0) {
                    shortageCount += needed;
                }
            });
            
            if (shortageCount > 0) {
                syncLog.shortages.push(`${shortageCount}x ${comp.name}`);
            }
        });
        } // End Fluid Mode Check
        
        if (trueSyncChanged) {
            assetSheet.getRange(1, 1, data.length, data[0].length).setValues(data);
        }
    }

    if (typeof flushCache !== 'undefined') flushCache();
    
    let msg = [];
    if (updatedCount > 0) msg.push(`Updated ${updatedCount}`);
    if (itemsToCreate > 0) msg.push(`Created ${itemsToCreate}`);
    
    let msgStr = msg.join(' and ') + ` asset(s).`;
    let warningStr = null;
    if (isContainer) {
        msgStr += ` [TrueSync: Linked ${syncLog.linked}, Unlinked ${syncLog.unlinked}]`;
        if (syncLog.shortages.length > 0) warningStr = `The database ran out of physical items while packing these cases.\n\nThe following items could not be linked because they don't exist or are already inside another case:\n- ` + syncLog.shortages.join('\n- ');
    }
    writeToAuditLog(adminName, (updatedCount > 0 && itemsToCreate === 0 ? "UPDATE" : "CREATE"), "ASSETS", "GLOBAL", [...idsToUpdate, ...createdUids].join(', '), msgStr);
    
    return { success: true, message: `Successfully ${msg.join(' and ')} asset(s).`, isExpansion: (itemsToCreate > 0), warning: warningStr };
  });
}

function getAssetRegistry(adminName) {
  return executeWithRetry(() => {
    const sheets = verifyVaultSchema(true);
    const data = getSheetData(sheets.assets);
    const map = data.hMap;
    
    // 🔥 HYPER-ROBUST COLUMN RESOLVER
    const getCol = (matchStrs) => {
        let key = Object.keys(map).find(k => {
            let clean = String(k).toLowerCase().replace(/[^a-z0-9]/g, '');
            return matchStrs.includes(clean);
        });
        return key !== undefined ? map[key] : undefined;
    };
    
    let cUid = getCol(['uid', 'id', 'assetuid']) ?? map['uid'];
    let cName = getCol(['name', 'assetname', 'itemname']) ?? map['name'];
    let cUnit = getCol(['unitnumber', 'unit']) ?? map['unit_number'];
    let cRfid = getCol(['rfidtag', 'rfid']) ?? map['rfid_tag'];
    let cMfg = getCol(['manufacturer', 'brand']) ?? map['manufacturer'];
    let cContainer = getCol(['containertype', 'container']) ?? map['container_type'];
    let cType = getCol(['type', 'itemtype']) ?? map['type'];
    let cNesting = getCol(['nestinglevel', 'level', 'nesting']) ?? map['nesting_level'];
    let cDept = getCol(['department', 'dept']) ?? map['department'];
    let cWh = getCol(['whuid', 'whid']) ?? map['wh_uid'];
    let cZone = getCol(['zoneuid', 'zoneid']) ?? map['zone_uid'];
    let cArea = getCol(['areauid', 'areaid']) ?? map['area_uid'];
    let cWeight = getCol(['weightkg', 'weight']) ?? map['weight_kg'];
    let cDims = getCol(['dims', 'dimensions']) ?? map['dims'];
    let cLength = getCol(['lengthm', 'length']) ?? map['length_m'];
    let cPower = getCol(['powerw', 'power']) ?? map['power_w'];
    let cPrice = getCol(['price', 'purchaseprice']) ?? map['price'];
    let cRental = getCol(['rental', 'rentalprice']) ?? map['rental'];
    let cDateBought = getCol(['datebought']) ?? map['date_bought'];
    let cLastServ = getCol(['lastservice']) ?? map['last_service'];
    let cServInt = getCol(['serviceinterval']) ?? map['service_interval'];
    let cTags = getCol(['tags', 'tagids']) ?? map['tags'];
    let cStatus = getCol(['status', 'lifecycle']) ?? map['status'];
    let cStatusNote = getCol(['statusnote', 'issuenote', 'defectnote']) ?? map['status_note'];
    let cTotQty = getCol(['totalquantity', 'qty', 'quantity']) ?? map['total_quantity'];
    let cCap = getCol(['capacity']) ?? map['capacity'];
    let cIsFixed = getCol(['isfixedrack', 'isfixed', 'fixedrack']) ?? map['isFixedRack'] ?? 30;
    let cIsConsumable = getCol(['isconsumable', 'consumable']) ?? map['is_consumable'];
    let cSerial = getCol(['serialnumber', 'serial']) ?? map['Serial_Number'];
    let cVendor = getCol(['vendoruid', 'vendor']) ?? map['vendor_uid'];
    let cComps = getCol(['components', 'kitcontents', 'contents']) ?? map['components'];

    let assets = [];
    for (let i = 1; i < data.length; i++) {
        if (cUid !== undefined && data[i][cUid]) {
            let dBought = cDateBought !== undefined ? data[i][cDateBought] : "";
            if (dBought instanceof Date) dBought = dBought.toISOString().split('T')[0];
            let dServ = cLastServ !== undefined ? data[i][cLastServ] : "";
            if (dServ instanceof Date) dServ = dServ.toISOString().split('T')[0];
            
            assets.push({
                id: data[i][cUid],
                name: cName !== undefined ? data[i][cName] : "",
                unitNumber: cUnit !== undefined ? data[i][cUnit] : "",
                rfidTag: cRfid !== undefined ? data[i][cRfid] : "",
                manufacturer: cMfg !== undefined ? data[i][cMfg] : "",
                containerType: cContainer !== undefined ? data[i][cContainer] : "",
                type: cType !== undefined ? data[i][cType] : "",
                nestingLevel: cNesting !== undefined ? data[i][cNesting] : "",
                department: cDept !== undefined ? data[i][cDept] : "",
                whId: cWh !== undefined ? data[i][cWh] : "",
                zoneId: cZone !== undefined ? data[i][cZone] : "",
                areaId: cArea !== undefined ? data[i][cArea] : "",
                weight: cWeight !== undefined ? data[i][cWeight] : "",
                dims: cDims !== undefined ? data[i][cDims] : "",
                length: cLength !== undefined ? data[i][cLength] : "",
                power: cPower !== undefined ? data[i][cPower] : "",
                price: cPrice !== undefined ? data[i][cPrice] : "",
                rental: cRental !== undefined ? data[i][cRental] : "",
                dateBought: dBought || "",
                lastService: dServ || "",
                serviceInterval: cServInt !== undefined ? data[i][cServInt] : "",
                tags: cTags !== undefined ? data[i][cTags] : "",
                status: cStatus !== undefined ? data[i][cStatus] : "",
                statusNote: cStatusNote !== undefined ? String(data[i][cStatusNote] || '') : '',
                totalQuantity: cTotQty !== undefined ? (data[i][cTotQty] || 1) : 1,
                capacity: cCap !== undefined ? data[i][cCap] : "",
                isFixedRack: cIsFixed !== undefined ? (data[i][cIsFixed] === true || data[i][cIsFixed] === 'true' || data[i][cIsFixed] === 1) : false,
                isConsumable: cIsConsumable !== undefined ? (data[i][cIsConsumable] === true || data[i][cIsConsumable] === 'true' || data[i][cIsConsumable] === 1) : false,
                serialNumber: cSerial !== undefined ? data[i][cSerial] : "",
                vendorUid: cVendor !== undefined ? data[i][cVendor] : "",
                components: cComps !== undefined ? data[i][cComps] : ""
            });
        }
    }
    return assets;
  });
}

function deleteVaultAsset(adminName, idParam) {
  return executeWithRetry(() => {
    if (typeof verifyBackendPrivilege === 'function' && !verifyBackendPrivilege(adminName, "EDITOR")) throw new Error("Permission Denied.");
    const sheets = verifyVaultSchema();
    const data = sheets.assets.getDataRange().getValues();
    let map = {};
    if(data.length > 0) data[0].forEach((h,i)=>map[h.toString().trim()]=i);
    
    let idsToDelete = Array.isArray(idParam) ? idParam : [idParam];
    let idsToDeleteStr = idsToDelete.map(id => String(id).trim());
    
    // 🔥 HYPER-ROBUST COLUMN RESOLVER
    const getCol = (matchStr) => {
        let key = Object.keys(map).find(k => String(k).toLowerCase().replace(/[^a-z0-9]/g, '') === matchStr);
        return key !== undefined ? map[key] : undefined;
    };
    let cContainer = getCol('containertype') ?? getCol('containeruid') ?? getCol('container') ?? getCol('parentid') ?? 11;

    let keptRows = [data[0]];
    let unlinkedCount = 0;

    for(let i=1; i<data.length; i++) {
        if (!idsToDelete.includes(data[i][map['uid']])) {
            let parentId = String(data[i][cContainer] || "").trim();
            if (parentId && idsToDeleteStr.includes(parentId)) {
                data[i][cContainer] = "";
                unlinkedCount++;
            }
            keptRows.push(data[i]);
        }
    }
    sheets.assets.clearContents();
    if (keptRows.length > 0) sheets.assets.getRange(1, 1, keptRows.length, keptRows[0].length).setValues(keptRows);
    if (typeof flushCache !== 'undefined') flushCache();

    let auditMsg = `Deleted asset IDs: ${idsToDelete.join(', ')}`;
    if (unlinkedCount > 0) auditMsg += ` [TrueSync: Unlinked ${unlinkedCount} orphaned children]`;

    writeToAuditLog(adminName, "DELETE", "ASSETS", "GLOBAL", idsToDelete.join(', '), auditMsg);
    return "Deleted";
  });
}

function batchUpdateAssets(adminName, updates) {
    return executeWithRetry(() => {
        if (typeof verifyBackendPrivilege === 'function' && !verifyBackendPrivilege(adminName, "EDITOR")) {
           throw new Error("🛑 PERMISSION DENIED: You lack EDITOR privileges.");
        }
        
        const sheets = verifyVaultSchema();
        const assetSheet = sheets.assets;
        const data = assetSheet.getDataRange().getValues();
        let map = {}; if(data.length > 0) data[0].forEach((h,i)=>map[h.toString().trim()]=i);
        
        let updatedCount = 0;
        let updateMap = {};
        updates.forEach(u => { updateMap[u.id] = u; });
        
        for (let i = 1; i < data.length; i++) {
            let id = data[i][map['uid']];
            if (updateMap[id]) {
                let u = updateMap[id];
                if (u.name !== undefined) data[i][map['name']] = u.name;
                if (u.length_m !== undefined) data[i][map['length_m']] = u.length_m;
                if (u.weight_kg !== undefined) data[i][map['weight_kg']] = u.weight_kg;
                if (u.dims !== undefined) data[i][map['dims']] = u.dims;
                updatedCount++;
            }
        }
        
        if (updatedCount > 0) {
            assetSheet.getRange(1, 1, data.length, data[0].length).setValues(data);
            if (typeof flushCache !== 'undefined') flushCache();
            writeToAuditLog(adminName, "UPDATE", "ASSETS", "GLOBAL", "Batch Extract", `Automatically extracted data and cleaned names for ${updatedCount} asset(s).`);
            return { success: true, message: `Successfully extracted data and cleaned names for ${updatedCount} asset(s).` };
        }
        return { success: true, message: "No assets needed updating." };
    });
}

function getClientsVault() {
  return executeWithRetry(() => {
    const sheets = verifyVaultSchema(true);
    const data = getSheetData(sheets.clients);
    const map = data.hMap;
    let clients = [];
    for (let i = 1; i < data.length; i++) {
        if (data[i][map['uid']]) {
            clients.push({
                id: data[i][map['uid']],
                name: data[i][map['name']],
                email: data[i][map['contact_email']],
                phone: data[i][map['phone']],
                notes: data[i][map['notes']]
            });
        }
    }
    return clients;
  });
}

function provisionNewClient(adminName, payload) {
  return executeWithRetry(() => {
    const sheets = verifyVaultSchema();
    const clientSheet = sheets.clients;
    const data = clientSheet.getDataRange().getValues();
    let map = {};
    if(data.length > 0) data[0].forEach((h,i)=>map[h.toString().trim()]=i);
    
    let newUid = Utilities.getUuid();
    let newRow = new Array(data[0].length).fill("");
    if(map['uid'] !== undefined) newRow[map['uid']] = newUid;
    if(map['name'] !== undefined) newRow[map['name']] = payload.name;
    if(map['contact_email'] !== undefined) newRow[map['contact_email']] = payload.email;
    if(map['phone'] !== undefined) newRow[map['phone']] = payload.phone;
    if(map['notes'] !== undefined) newRow[map['notes']] = payload.notes;

    clientSheet.appendRow(newRow);
    if (typeof flushCache !== 'undefined') flushCache();
    writeToAuditLog(adminName, "CREATE", "CLIENTS", "GLOBAL", newUid, `Added new client. Email: ${payload.email}`);
    return { success: true, message: "Client added successfully.", client: payload };
  });
}

// ==========================================
// --- VEHICLE FLEET API ---
// ==========================================

function getVehiclesVault() {
    return executeWithRetry(() => {
        let sheet = verifyVaultSchema(true).vehicles;
        let data = sheet.getDataRange().getValues();
        let map = {}; if(data.length > 0) data[0].forEach((h,i)=>map[h.toString().trim()]=i);
        
        let vehicles = [];
        for (let i = 1; i < data.length; i++) {
            if (data[i][map['uid']]) {
                vehicles.push({
                    id: data[i][map['uid']], name: data[i][map['name']], isGeneric: data[i][map['is_generic']],
                    plate: data[i][map['license_plate']], model: data[i][map['make_model']], vendor: data[i][map['vendor']],
                    l: data[i][map['length_m']], w: data[i][map['width_m']], h: data[i][map['height_m']],
                    kg: data[i][map['max_weight_kg']], vol: data[i][map['max_volume_m3']], lift: data[i][map['tail_lift_kg']]
                });
            }
        }
        return vehicles;
    });
}

function saveVehicleVault(payload, actor = "System UI") {
    return executeWithRetry(() => {
        let sheet = verifyVaultSchema().vehicles;
        let data = sheet.getDataRange().getValues();
        let map = {}; if(data.length > 0) data[0].forEach((h,i)=>map[h.toString().trim()]=i);
        
        if (!payload.id) payload.id = Utilities.getUuid();
        
        let rowIndex = -1;
        for(let i=1; i<data.length; i++) { if(data[i][map['uid']] === payload.id) { rowIndex = i + 1; break; } }
        
        let row = new Array(Object.keys(map).length).fill("");
        if(map['uid'] !== undefined) row[map['uid']] = payload.id; if(map['name'] !== undefined) row[map['name']] = payload.name;
        if(map['is_generic'] !== undefined) row[map['is_generic']] = payload.isGeneric; if(map['license_plate'] !== undefined) row[map['license_plate']] = payload.plate;
        if(map['make_model'] !== undefined) row[map['make_model']] = payload.model; if(map['vendor'] !== undefined) row[map['vendor']] = payload.vendor;
        if(map['length_m'] !== undefined) row[map['length_m']] = payload.l; if(map['width_m'] !== undefined) row[map['width_m']] = payload.w;
        if(map['height_m'] !== undefined) row[map['height_m']] = payload.h; if(map['max_weight_kg'] !== undefined) row[map['max_weight_kg']] = payload.kg;
        if(map['max_volume_m3'] !== undefined) row[map['max_volume_m3']] = payload.vol; if(map['tail_lift_kg'] !== undefined) row[map['tail_lift_kg']] = payload.lift;
        
        if(rowIndex > -1) sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
        else sheet.appendRow(row);
        
        writeToAuditLog(actor, "UPDATE", "VEHICLES", "GLOBAL", payload.id, "Saved Vehicle: " + payload.name);
        return "Saved";
    });
}

function deleteVehicleVault(id, actor = "System UI") {
    return executeWithRetry(() => {
        let sheet = verifyVaultSchema().vehicles;
        let data = sheet.getDataRange().getValues();
        let map = {}; if(data.length > 0) data[0].forEach((h,i)=>map[h.toString().trim()]=i);
        
        let kept = [data[0]];
        for(let i=1; i<data.length; i++) { if(data[i][map['uid']] !== id) kept.push(data[i]); }
        
        sheet.clearContents();
        if(kept.length > 0) sheet.getRange(1, 1, kept.length, kept[0].length).setValues(kept);
        
        writeToAuditLog(actor, "DELETE", "VEHICLES", "GLOBAL", id, "Deleted vehicle.");
        return "Deleted";
    });
}