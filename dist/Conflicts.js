/**
 * SM Showrunner (smuruner) - Clean 8 Architecture
 * Conflicts.js - Centralized Conflict & Recovery Resolution Engine
 */

// @INDEX: CONFLICTS -> Active Conflict Resolver
function getActiveConflicts() {
  return executeWithRetry(() => {
    let conflicts = [];
    
    const eSheets = verifyDatabaseSchema(true);
    const vSheets = verifyVaultSchema(true);
    
    const shiftData = getSheetData(eSheets.shifts);
    const overrideData = getSheetData(eSheets.conflictOverrides);
    const indexData = getSheetData(eSheets.index);
    const timelineData = getSheetData(eSheets.timelines);
    const projectAssets = getSheetData(eSheets.projectAssets);
    const vaultAssets = getSheetData(vSheets.assets);
    const vaultVehicles = getSheetData(vSheets.vehicles);
    
    let sMap = shiftData.hMap;
    let oMap = overrideData.hMap;
    let iMap = indexData.hMap;
    let tMap = timelineData.hMap;
    let paMap = projectAssets.hMap;
    let vMap = vaultAssets.hMap;
    let vecMap = vaultVehicles.hMap;

    let vecUidCol = vecMap['uid'] !== undefined ? vecMap['uid'] : vecMap['id'];
    let vehicleUids = new Set();
    if (vecUidCol !== undefined) {
        for (let i = 1; i < vaultVehicles.length; i++) {
            if (vaultVehicles[i][vecUidCol]) vehicleUids.add(vaultVehicles[i][vecUidCol]);
        }
    }

    // 1. Gather Active Projects & Timelines
    let projects = {};
    for (let i = 1; i < indexData.length; i++) {
        let status = String(indexData[i][iMap['Status']] || '').toUpperCase();
        if (status && status !== 'CANCELLED' && status !== 'TRASHED') {
            projects[indexData[i][iMap['uid']]] = {
                id: indexData[i][iMap['uid']],
                name: indexData[i][iMap['Project_Name']],
                phases: []
            };
        }
    }

    // 2. Resolve Exact Epoch Timeframes per Project
    for (let i = 1; i < timelineData.length; i++) {
        let pId = timelineData[i][tMap['project_uid']];
        if (projects[pId]) {
            let dateStr = timelineData[i][tMap['Event_Date']];
            if (dateStr instanceof Date) {
                let y = dateStr.getFullYear();
                let m = String(dateStr.getMonth() + 1).padStart(2, '0');
                let d = String(dateStr.getDate()).padStart(2, '0');
                dateStr = `${y}-${m}-${d}`;
            } else {
                let isoMatch = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
                if (isoMatch) dateStr = isoMatch[0];
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
                let m = s.match(/(\d{1,2}):(\d{2})/);
                if (m) return ("0" + m[1]).slice(-2) + ":" + m[2];
                return s;
            };

            let sTime = extractTime(timelineData[i][tMap['Start_Time']]) || "00:00";
            let eTime = extractTime(timelineData[i][tMap['End_Time']]) || "23:59";
            
            let sEpoch = new Date(`${dateStr}T${sTime}:00Z`).getTime();
            let eEpoch = new Date(`${dateStr}T${eTime}:00Z`).getTime();
            
            if (eEpoch <= sEpoch) eEpoch += 86400000; // Corrects shifts crossing midnight
            
            if (!isNaN(sEpoch) && !isNaN(eEpoch)) {
                projects[pId].phases.push({
                    type: timelineData[i][tMap['Sub_Event_Type']],
                    start: sEpoch,
                    end: eEpoch
                });
            }
        }
    }

    // 3. Evaluate Crew Rest Conflicts (Soft)
    let userShifts = {};
    for (let i = 1; i < shiftData.length; i++) {
        let pId = shiftData[i][sMap['project_uid']];
        if (!projects[pId]) continue; 
        
        let uid = shiftData[i][sMap['user_uid']];
        if (!uid || uid.includes('truck') || vehicleUids.has(uid)) continue;
        if (!userShifts[uid]) userShifts[uid] = [];
        
        let pPhases = projects[pId].phases.sort((a,b) => a.start - b.start);
        if (pPhases.length > 0) {
            let baseStart = pPhases[0].start;
            let startRaw = Number(shiftData[i][sMap['Start']]);
            let durRaw = Number(shiftData[i][sMap['Duration']]);
            let shiftEpoch = baseStart + (startRaw * 3600000);
            
            userShifts[uid].push({
                shiftId: shiftData[i][sMap['uid']],
                projectId: pId,
                projectName: projects[pId].name,
                startEpoch: shiftEpoch,
                endEpoch: shiftEpoch + (durRaw * 3600000)
            });
        }
    }
    
    for (let uid in userShifts) {
        let shifts = userShifts[uid].sort((a,b) => a.startEpoch - b.startEpoch);
        
        // 1. Check Hard Overlaps
        for (let i = 1; i < shifts.length; i++) {
            let gapHours = (shifts[i].startEpoch - shifts[i-1].endEpoch) / 3600000;
            if (gapHours < -0.08) { // Allow up to ~5 minutes tolerance for UI grid snapping on touching shifts
                let pairNames = [shifts[i-1].projectName, shifts[i].projectName].sort().join(' & ');
                let groupKey = `CREW_${shifts[i].projectId}_${pairNames.replace(/[^a-zA-Z0-9]/g, '')}`;
                conflicts.push({ id: `conf_${shifts[i].shiftId}_hard`, type: 'HARD_OVERLAP', level: 'red', entityId: uid, title: 'Shift Overlap', desc: `Overlap between ${shifts[i-1].projectName} and ${shifts[i].projectName}.`, projectId: shifts[i].projectId, conflictEpoch: shifts[i].startEpoch, pairNames: pairNames, groupKey: groupKey, isAsset: false });
            }
        }

        // 2. Build Work Blocks & Evaluate Rest
        let blocks = [];
        for (let i = 0; i < shifts.length; i++) {
            let s = shifts[i];
            if (blocks.length === 0) {
                blocks.push({ startEpoch: s.startEpoch, endEpoch: s.endEpoch, projectName: s.projectName, shiftId: s.shiftId, projectId: s.projectId });
            } else {
                let lastBlock = blocks[blocks.length - 1];
                let gapHours = (s.startEpoch - lastBlock.endEpoch) / 3600000;
                
                // Group touching shifts (<= 5 mins gap) into a single working block
                if (gapHours <= 0.08) {
                    lastBlock.endEpoch = Math.max(lastBlock.endEpoch, s.endEpoch);
                    if (!lastBlock.projectName.includes(s.projectName)) lastBlock.projectName = lastBlock.projectName + " & " + s.projectName;
                } else {
                    if (gapHours < 9) {
                        let pairNames = [lastBlock.projectName, s.projectName].sort().join(' | ');
                        let groupKey = `CREW_${s.projectId}_${pairNames.replace(/[^a-zA-Z0-9]/g, '')}`;
                        if (gapHours < 7) conflicts.push({ id: `conf_${s.shiftId}_severe`, type: 'SOFT_REST_SEVERE', level: 'orange', entityId: uid, title: 'Severe Rest Violation', desc: `Only ${gapHours.toFixed(1)}h rest between ${lastBlock.projectName} and ${s.projectName}.`, projectId: s.projectId, conflictEpoch: s.startEpoch, pairNames: pairNames, groupKey: groupKey, isAsset: false });
                        else conflicts.push({ id: `conf_${s.shiftId}_warn`, type: 'SOFT_REST_WARNING', level: 'yellow', entityId: uid, title: 'Rest Warning', desc: `${gapHours.toFixed(1)}h rest between ${lastBlock.projectName} and ${s.projectName}.`, projectId: s.projectId, conflictEpoch: s.startEpoch, pairNames: pairNames, groupKey: groupKey, isAsset: false });
                    }
                    blocks.push({ startEpoch: s.startEpoch, endEpoch: s.endEpoch, projectName: s.projectName, shiftId: s.shiftId, projectId: s.projectId });
                }
            }
        }
    }

    // 4. Asset Evaluation (Hard Shortages)
    let vaultDb = {};
    let vUidCol = vMap['uid'] !== undefined ? vMap['uid'] : 0;
    let vNameCol = vMap['name'] !== undefined ? vMap['name'] : (vMap['Name'] !== undefined ? vMap['Name'] : 4);
    let vTypeCol = vMap['type'] !== undefined ? vMap['type'] : (vMap['Type'] !== undefined ? vMap['Type'] : 6);
    let vQtyCol = vMap['total_quantity'] !== undefined ? vMap['total_quantity'] : (vMap['totalQuantity'] !== undefined ? vMap['totalQuantity'] : 24);
    let vMfgCol = vMap['manufacturer'] !== undefined ? vMap['manufacturer'] : 5;

    let poolCapacities = {};
    let poolRepIds = {};

    for (let i = 1; i < vaultAssets.length; i++) {
        let id = vaultAssets[i][vUidCol];
        if (!id) continue;
        let type = vaultAssets[i][vTypeCol] || 'Physical';
        let name = vaultAssets[i][vNameCol] || 'Unknown';
        let mfg = vaultAssets[i][vMfgCol] || '';
        
        let poolKey = type === 'Bulk' ? id : (name + "|||" + mfg).toLowerCase();
        let qty = type === 'Bulk' ? (parseInt(vaultAssets[i][vQtyCol], 10) || 1) : 1;
        
        vaultDb[id] = { poolKey: poolKey, name: name, type: type };
        poolCapacities[poolKey] = (poolCapacities[poolKey] || 0) + qty;
        if (!poolRepIds[poolKey]) poolRepIds[poolKey] = id;
    }

    let paProjCol = paMap['project_uid'] !== undefined ? paMap['project_uid'] : 1;
    let paAssetCol = paMap['asset_uid'] !== undefined ? paMap['asset_uid'] : 2;
    let paQtyCol = paMap['assigned_quantity'] !== undefined ? paMap['assigned_quantity'] : (paMap['qty'] !== undefined ? paMap['qty'] : 3);
    let paFormCol = paMap['formula'] !== undefined ? paMap['formula'] : 5;
    let paLocCol = paMap['location'] !== undefined ? paMap['location'] : 4;

    // Calculate Equipment Windows (From first WH phase to last Recovery phase)
    for (let pId in projects) {
        if (projects[pId].phases.length > 0) {
            projects[pId].equipStart = Math.min(...projects[pId].phases.map(p => p.start));
            projects[pId].equipEnd = Math.max(...projects[pId].phases.map(p => p.end));
            
            let corePhases = projects[pId].phases.filter(p => p.type === 'MAIN_EVENT' || p.type === 'SHOW_DAY');
            if (corePhases.length > 0) {
                projects[pId].coreStart = Math.min(...corePhases.map(p => p.start));
                projects[pId].coreEnd = Math.max(...corePhases.map(p => p.end));
            } else {
                projects[pId].coreStart = projects[pId].equipStart;
                projects[pId].coreEnd = projects[pId].equipEnd;
            }
        }
    }

    let assetUsage = {};
    for (let i = 1; i < projectAssets.length; i++) {
        let pId = projectAssets[i][paProjCol];
        let aId = projectAssets[i][paAssetCol];
        let qty = parseInt(projectAssets[i][paQtyCol], 10) || 1;
        let formula = String(projectAssets[i][paFormCol] || '');
        let location = String(projectAssets[i][paLocCol] || '');

        if (!pId || !aId) continue;
        if (formula.includes('[SHORT]') || location.toUpperCase().includes('[SUBRENT]')) continue;
        if (formula.includes('[TRANSFER_FROM')) continue; // Cross-dock bypass
        if (!projects[pId] || !projects[pId].equipStart) continue; // Skip unscheduled events

        if (!vaultDb[aId]) continue;
        let poolKey = vaultDb[aId].poolKey;
        
        if (!assetUsage[poolKey]) assetUsage[poolKey] = {};
        if (!assetUsage[poolKey][pId]) assetUsage[poolKey][pId] = 0;
        assetUsage[poolKey][pId] += qty;
    }

    let flaggedShortages = new Set();

    for (let poolKey in assetUsage) {
        let maxCapacity = poolCapacities[poolKey];
        let repId = poolRepIds[poolKey];
        if (!vaultDb[repId]) continue;
        let assetName = vaultDb[repId].name;
        let isBulk = vaultDb[repId].type === 'Bulk';

        let events = [];
        for (let pId in assetUsage[poolKey]) {
            let qty = assetUsage[poolKey][pId];
            events.push({ time: projects[pId].equipStart, type: 'out', qty: qty, pId: pId });
            events.push({ time: projects[pId].equipEnd, type: 'in', qty: qty, pId: pId });
        }

        // Sort: Chronological. If simultaneous, process 'in' (returns) before 'out' (deployments)
        events.sort((a, b) => { if (a.time === b.time) return a.type === 'in' ? -1 : 1; return a.time - b.time; });

        let currentLoad = 0;
        let activeProjects = new Set();
        
        for (let i = 0; i < events.length; i++) {
            let ev = events[i];
            if (ev.type === 'out') { currentLoad += ev.qty; activeProjects.add(ev.pId); } 
            else { currentLoad -= ev.qty; activeProjects.delete(ev.pId); }

            if (currentLoad > maxCapacity) {
                let shortage = currentLoad - maxCapacity;
                let triggerId = ev.pId;
                let pList = Array.from(activeProjects).map(id => projects[id] ? projects[id].name : 'Unknown');
                let pairNames = pList.sort().join(' & ');
                let groupKey = `ASSET_${triggerId}_${pairNames.replace(/[^a-zA-Z0-9]/g, '')}_${poolKey}`;
                let key = `${poolKey}_${triggerId}`;
                
                // Evaluate if the CORE SHOW DAYS actually overlap, or if it's just a prep/recovery turnaround
                let activeArr = Array.from(activeProjects);
                let coreOverlap = false;
                
                if (activeArr.length === 1) {
                    coreOverlap = true; // The project ITSELF requested more than the warehouse owns! Hard shortage.
                } else {
                    for (let j = 0; j < activeArr.length; j++) {
                        for (let k = j + 1; k < activeArr.length; k++) {
                            let pA = projects[activeArr[j]];
                            let pB = projects[activeArr[k]];
                            if (pA && pB && pA.coreStart && pB.coreStart) {
                                if (Math.max(pA.coreStart, pB.coreStart) < Math.min(pA.coreEnd, pB.coreEnd)) {
                                    coreOverlap = true; break;
                                }
                            }
                        }
                        if (coreOverlap) break;
                    }
                }
                
                if (!flaggedShortages.has(key)) {
                    flaggedShortages.add(key);
                    
                    let cLevel = coreOverlap ? 'red' : 'yellow';
                    let cType = coreOverlap ? 'HARD_SHORTAGE' : 'SOFT_TURNAROUND';
                    let cTitle = isBulk ? (coreOverlap ? 'Asset Shortage' : 'Tight Turnaround') : (coreOverlap ? 'Double Booking' : 'Tight Turnaround');
                    
                    let cDesc = "";
                    if (activeArr.length === 1) {
                        cDesc = isBulk ? `${shortage}x ${assetName} short. Project exceeds total warehouse stock.` : `Unique Unit [${assetName}] is double-booked inside the same project.`;
                    } else {
                        cDesc = isBulk ? `${shortage}x ${assetName} short. ${coreOverlap ? 'Demand' : 'Turnaround overlap'} between: ${pairNames}.` : `Unique Unit [${assetName}] is ${coreOverlap ? 'double-booked' : 'in a tight turnaround'} between: ${pairNames}.`;
                    }

                    conflicts.push({
                        id: `conf_${repId}_${triggerId}_short`,
                        type: cType,
                        level: cLevel,
                        entityId: repId,
                        entityName: assetName,
                        title: cTitle,
                        desc: cDesc,
                        projectId: triggerId,
                        conflictEpoch: ev.time,
                        pairNames: pairNames,
                        groupKey: groupKey,
                        isAsset: true
                    });
                }
            }
        }
    }

    // 5. Evaluate Acknowledged Overrides
    let acknowledged = new Set();
    for (let i = 1; i < overrideData.length; i++) {
        acknowledged.add(overrideData[i][oMap['conflict_type']] + "_" + overrideData[i][oMap['project_uid']]);
    }

    conflicts.forEach(c => {
        let key = c.type + "_" + c.projectId;
        if (acknowledged.has(key)) {
            c.level = 'grey';
            c.acknowledged = true;
        } else {
            c.acknowledged = false;
        }
    });
    
    return conflicts;
  });
}

function acknowledgeConflict(projectId, conflictType, actor = "System UI") {
    return executeWithRetry(() => {
        const sheets = verifyDatabaseSchema();
        let newRow = new Array(5).fill("");
        newRow[0] = Utilities.getUuid();
        newRow[1] = projectId;
        newRow[2] = conflictType;
        newRow[3] = actor;
        newRow[4] = new Date().toISOString();
        
        sheets.conflictOverrides.appendRow(newRow);
        if (typeof flushCache !== 'undefined') flushCache();
        writeToAuditLog(actor, "UPDATE", "CONFLICT_ENGINE", projectId, "Conflict Override", `Acknowledged conflict type: ${conflictType}`);
        return "Conflict Acknowledged.";
    });
}