/**
 * SM Showrunner (smuruner) - Clean 8 Architecture
 * Logistics_Roster.js - Month Matrix & Availability Utilities
 */

// ==========================================
// --- GLOBAL MONTH ROSTER MATRIX ---
// ==========================================
// @INDEX: DATA_ENGINE -> Global Month Matrix

function getGlobalMonthData(prefetchedProjects) {
  return executeWithRetry(() => {
    const roster = getCrewSettings();          // Pulls from VAULT
    
    const allProjects = prefetchedProjects || getExistingProjects(); // Pulls from ENGINE
    const leaves = getLeavesFromEngine();      // 🚀 NOW PULLS FROM ENGINE

    const sheets = verifyDatabaseSchema(true);
    const shiftData = getSheetData(sheets.shifts);
    let sMap = shiftData.hMap;

    let masterShifts = [];
    
    for (let i = 1; i < shiftData.length; i++) {
      let sId = shiftData[i][sMap['uid']];
      let pId = shiftData[i][sMap['project_uid']];
      let mode = shiftData[i][sMap['Phase_Mode']];
      let user_uid = shiftData[i][sMap['user_uid']];
      let role = shiftData[i][sMap['Role']];
      let start = Number(shiftData[i][sMap['Start']]);
      let dur = Number(shiftData[i][sMap['Duration']]);
      let hasArrow = shiftData[i][sMap['Has_Arrow']];

      let p = allProjects.find(proj => proj.id === pId);
      
      if (p) {
         let baseDate = null;
         let pName = p.title;
         let isWh = (mode === 'wh');

         let phaseFrags = [...(p.fragments || [])];
         if (phaseFrags.length > 0) {
            phaseFrags.sort((a,b) => String(a.date || '').localeCompare(String(b.date || '')));
            baseDate = phaseFrags[0].date;
         }

         let whFrags = (p.fragments || []).filter(f => f.type === 'WAREHOUSE').sort((a,b) => String(a.date || '').localeCompare(String(b.date || '')));
         let recoveryFrags = (p.fragments || []).filter(f => f.type === 'RECOVERY').sort((a,b) => String(a.date || '').localeCompare(String(b.date || '')));
         let transitFrags = (p.fragments || []).filter(f => f.type === 'TRANSIT').sort((a,b) => String(a.date || '').localeCompare(String(b.date || '')));
         let pWhDate = whFrags.length > 0 ? whFrags[0].date : null;
         let pRecoveryDate = recoveryFrags.length > 0 ? recoveryFrags[0].date : null;
         let pTransitDate = transitFrags.length > 0 ? transitFrags[0].date : null;

         if (baseDate) {
            masterShifts.push({
               id: sId, projectId: pId, projectName: pName, isWh: isWh, shiftMode: mode,
               user_uid: user_uid, email: user_uid, role: role, start: start, duration: dur, hasArrow: hasArrow,
                         baseDate: baseDate, pStartDate: p.start, pEndDate: p.end, pWhDate: pWhDate, pRecoveryDate: pRecoveryDate, pTransitDate: pTransitDate,
               status: p.status
            });
         }
      }
    }
    return { roster: roster, shifts: masterShifts, leaves: leaves, projects: allProjects };
  });
}

// ==========================================
// --- TIME UTILITY FORMATTERS ---
// ==========================================

function formatToDDMMYYYY(isoDate) {
  if (!isoDate) return '';
  let parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

function formatTimeOnly(rawHours) {
  let h = Math.floor(rawHours) % 24;
  let m = Math.round((rawHours % 1) * 60);
  return `${h}:${m.toString().padStart(2,'0')}`;
}

function formatShiftDateTimeRange(baseDateStr, startRaw, duration) {
  let startTime = formatTimeOnly(startRaw);
  let endTime = formatTimeOnly(startRaw + duration);
  if (!baseDateStr) return `${startTime} - ${endTime}`; 
  let pts = baseDateStr.split('-');
  let d = new Date(pts[0], parseInt(pts[1])-1, pts[2]);
  d.setDate(d.getDate() + Math.floor(startRaw / 24));
  let dateStr = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
  return `${dateStr} @ ${startTime} - ${endTime}`;
}

function formatShiftStartTime(baseDateStr, startRaw) {
  let startTime = formatTimeOnly(startRaw);
  if (!baseDateStr) return startTime; 
  let pts = baseDateStr.split('-');
  let d = new Date(pts[0], parseInt(pts[1])-1, pts[2]);
  d.setDate(d.getDate() + Math.floor(startRaw / 24));
  let dateStr = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
  return `${dateStr} @ ${startTime}`;
}

// ==========================================
// --- FINANCIALS PAYROLL SCANNER ---
// ==========================================
// @INDEX: FINANCIALS_ENGINE -> Payroll Data Scanner
function getFinancialsData(monthStr) {
  return executeWithRetry(() => {
      const db = verifyDatabaseSchema(true);
      const vt = verifyVaultSchema(true);
      
      let sys = getSystemSettings();
      let finRoles = getVaultAsset('fin_roles', {});
      let finOverheads = getVaultAsset('fin_overheads', []);
      let finConsumables = getVaultAsset('fin_consumables', []);
      let finTrucks = getVaultAsset('fin_trucks', { truck_t1_in: 50, truck_t1_out: 1.2, truck_t1_stay: 30, truck_t2_in: 80, truck_t2_out: 1.5, truck_t2_stay: 50, truck_t3_in: 120, truck_t3_out: 2.0, truck_t3_stay: 80, truck_t4_in: 200, truck_t4_out: 2.5, truck_t4_stay: 120 });
      let finGlobals = getVaultAsset('fin_globals', { prep_rate: 80, prep_hours: 8, prep_mult: 1.0, build_rate: 100, build_hours: 6, build_mult: 1.0, duty_rate: 120, duty_hours: 8, duty_mult: 1.0, break_rate: 80, break_hours: 4, break_mult: 1.0, default_shift_period: 12, overtime_multiplier: 1.5, followspot_bonus: 50, console_bonus: 50 });

      let crewData = getSheetData(vt.crew);
      let cMap = crewData.hMap;
      let crewList = [];
      for(let i=1; i<crewData.length; i++) {
          crewList.push({ uid: crewData[i][cMap['uid']], name: crewData[i][cMap['Name']], email: crewData[i][cMap['Email']], role: crewData[i][cMap['Job_Title']], mult: parseFloat(crewData[i][cMap['Payroll_Multiplier']]) || 1.0, department: crewData[i][cMap['Department']] || 'Unassigned' });
      }
      
      let indexData = getSheetData(db.index);
      let iMap = indexData.hMap;
      let projList = [];
      for(let i=1; i<indexData.length; i++) {
          let stat = String(indexData[i][iMap['Status']] || '').toUpperCase();
          if(stat === 'TRASHED' || stat === 'CANCELLED') continue;
          projList.push({ id: indexData[i][iMap['uid']], name: indexData[i][iMap['Project_Name']], diffMult: parseFloat(indexData[i][iMap['Difficulty_Multiplier']]) || 1.0, readinessState: indexData[i][iMap['Readiness_State']] || '{}' });
      }
      
      let vData = getSheetData(vt.vehicles);
      let vMap = vData.hMap;
      let fleetList = [];
      let vUidCol = vMap['uid'] !== undefined ? vMap['uid'] : vMap['id'];
      let vNameCol = vMap['name'] !== undefined ? vMap['name'] : vMap['Name'];
      for(let i=1; i<vData.length; i++) {
          if (vData[i][vUidCol]) {
              fleetList.push({ uid: vData[i][vUidCol], name: vData[i][vNameCol] || 'Vehicle', tier: vData[i][vMap['Vehicle_Tier']] || 'Tier 1' });
          }
      }

      let shiftData = getSheetData(db.shifts);
      let sMap = shiftData.hMap;
      let shiftList = [];
      for(let i=1; i<shiftData.length; i++) {
          shiftList.push({
              id: shiftData[i][sMap['uid']],
              projectId: shiftData[i][sMap['project_uid']],
              email: shiftData[i][sMap['user_uid']],
              role: shiftData[i][sMap['Role']],
              phase: shiftData[i][sMap['Phase_Mode']], // 'wh', 'main', 'show', 'recovery', 'transit'
              start: Number(shiftData[i][sMap['Start']]),
              duration: Number(shiftData[i][sMap['Duration']]),
              status: shiftData[i][sMap['payment_status']] || 'Pending',
              amount: shiftData[i][sMap['paid_amount']] || ''
          });
      }
      
      let blockData = getSheetData(db.blocks);
      let bMap = blockData.hMap;
      let blockList = [];
      for(let i=1; i<blockData.length; i++) {
          blockList.push({
              id: blockData[i][bMap['uid']],
              projectId: blockData[i][bMap['project_uid']],
              phaseName: blockData[i][bMap['Phase_Name']],
              start: Number(blockData[i][bMap['Start']]),
              duration: Number(blockData[i][bMap['Duration']])
          });
      }
      
      let timelines = loadCalendar() || [];
      
      return { crew: crewList, fleet: fleetList, projects: projList, shifts: shiftList, timelines: timelines, blocks: blockList, settings: { roles: finRoles, overheads: finOverheads, consumables: finConsumables, trucks: finTrucks, globals: finGlobals } };
  });
}

function getFinancialSettings() {
  return executeWithRetry(() => {
      let finRoles = getVaultAsset('fin_roles', {});
      let finOverheads = getVaultAsset('fin_overheads', []);
      let finConsumables = getVaultAsset('fin_consumables', []);
      let finTrucks = getVaultAsset('fin_trucks', { truck_t1_in: 50, truck_t1_out: 1.2, truck_t1_stay: 30, truck_t2_in: 80, truck_t2_out: 1.5, truck_t2_stay: 50, truck_t3_in: 120, truck_t3_out: 2.0, truck_t3_stay: 80, truck_t4_in: 200, truck_t4_out: 2.5, truck_t4_stay: 120 });
      let finGlobals = getVaultAsset('fin_globals', { prep_rate: 80, prep_hours: 8, prep_mult: 1.0, recovery_rate: 80, recovery_hours: 8, recovery_mult: 1.0, build_rate: 100, build_hours: 6, build_mult: 1.0, duty_rate: 120, duty_hours: 8, duty_mult: 1.0, break_rate: 80, break_hours: 4, break_mult: 1.0, default_shift_period: 12, overtime_multiplier: 1.5, followspot_bonus: 50, console_bonus: 50, extra_rate_standard: 15, extra_rate_prep: 15 });
      return { roles: finRoles, overheads: finOverheads, consumables: finConsumables, trucks: finTrucks, globals: finGlobals };
  });
}

function approveShiftPayments(payload, fallbackAmount, status) {
  return executeWithRetry(() => {
    const sheets = verifyDatabaseSchema();
    let data = sheets.shifts.getDataRange().getValues();
    let sMap = {};
    if(data.length > 0) data[0].forEach((h,i)=>sMap[h.toString().trim()]=i);
    
    let shiftMap = {};
    if (Array.isArray(payload)) {
       payload.forEach(item => {
           if (typeof item === 'string') shiftMap[item] = fallbackAmount;
           else if (item && item.id) shiftMap[item.id] = item.amount !== undefined ? item.amount : fallbackAmount;
       });
    }

    for (let i = 1; i < data.length; i++) {
      let sId = data[i][sMap['uid']];
      if (shiftMap.hasOwnProperty(sId)) {
        if (sMap['payment_status'] !== undefined) sheets.shifts.getRange(i+1, sMap['payment_status']+1).setValue(status);
        if (sMap['paid_amount'] !== undefined) sheets.shifts.getRange(i+1, sMap['paid_amount']+1).setValue(shiftMap[sId]);
      }
    }
    if (typeof flushCache !== 'undefined') flushCache();
    return "Success";
  });
}

function getLeavesFromEngine() {
  return executeWithRetry(() => {
    const sheets = verifyDatabaseSchema(true);
    const data = getSheetData(sheets.leaves);
    const lMap = data.hMap;
    let leaves = [];
    for (let i = 1; i < data.length; i++) {
      if (!data[i][lMap['uid']]) continue;
      leaves.push({
        id: data[i][lMap['uid']],
        user_uid: data[i][lMap['user_uid']],
        email: data[i][lMap['user_uid']],
        start: data[i][lMap['Start_Date']] instanceof Date ? `${data[i][lMap['Start_Date']].getFullYear()}-${String(data[i][lMap['Start_Date']].getMonth()+1).padStart(2,'0')}-${String(data[i][lMap['Start_Date']].getDate()).padStart(2,'0')}` : String(data[i][lMap['Start_Date']]).split('T')[0],
        end: data[i][lMap['End_Date']] instanceof Date ? `${data[i][lMap['End_Date']].getFullYear()}-${String(data[i][lMap['End_Date']].getMonth()+1).padStart(2,'0')}-${String(data[i][lMap['End_Date']].getDate()).padStart(2,'0')}` : String(data[i][lMap['End_Date']]).split('T')[0],
        reason: data[i][lMap['Reason']]
      });
    }
    return leaves;
  });
}

function saveLeave(leaveObj, actor = "System UI") {
  return executeWithRetry(() => {
    const sheets = verifyDatabaseSchema();
    const data = sheets.leaves.getDataRange().getValues();
    let map = {};
    if(data.length > 0) data[0].forEach((h,i)=>map[h.toString().trim()]=i);
    
    if (!leaveObj.id) leaveObj.id = Utilities.getUuid();
    
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][map['uid']] === leaveObj.id) { rowIndex = i + 1; break; }
    }
    
    let rowContent = new Array(Object.keys(map).length).fill("");
    if(map['uid'] !== undefined) rowContent[map['uid']] = leaveObj.id;
    if(map['user_uid'] !== undefined) rowContent[map['user_uid']] = leaveObj.user_uid || leaveObj.email;
    if(map['Start_Date'] !== undefined) rowContent[map['Start_Date']] = leaveObj.start;
    if(map['End_Date'] !== undefined) rowContent[map['End_Date']] = leaveObj.end;
    if(map['Reason'] !== undefined) rowContent[map['Reason']] = leaveObj.reason;

    if (rowIndex > -1) sheets.leaves.getRange(rowIndex, 1, 1, rowContent.length).setValues([rowContent]);
    else sheets.leaves.appendRow(rowContent);
    
    if (typeof flushCache !== 'undefined') flushCache();
    
    let targetUid = leaveObj.email;
    try {
        const vaultSheets = verifyVaultSchema(true);
        const crewData = getSheetData(vaultSheets.crew);
        let cMap = crewData.hMap;
        for (let i = 1; i < crewData.length; i++) {
            if (crewData[i][cMap['Email']] === leaveObj.email) {
                targetUid = crewData[i][cMap['uid']];
                break;
            }
        }
    } catch(e) {}

    writeToAuditLog(actor, rowIndex > -1 ? "UPDATE" : "CREATE", "ROSTER_LEAVE", "GLOBAL", targetUid, `Saved leave: ${leaveObj.start} to ${leaveObj.end}. Reason: ${leaveObj.reason}`);
    return "Success";
  });
}

function deleteLeave(id, actor = "System UI") {
  return executeWithRetry(() => {
    const sheets = verifyDatabaseSchema();
    const data = sheets.leaves.getDataRange().getValues();
    let map = {};
    if (data.length > 0) data[0].forEach((h,i)=>map[h.toString().trim()]=i);
    let keptRows = [data[0]];
                let targetEmail = "Unknown";
    for(let i = 1; i < data.length; i++) {
                   if (data[i][map['uid']] !== id) {
                       keptRows.push(data[i]);
                   } else {
                       targetEmail = data[i][map['user_uid']];
                   }
    }
    sheets.leaves.clearContents();
    if (keptRows.length > 0) sheets.leaves.getRange(1, 1, keptRows.length, keptRows[0].length).setValues(keptRows);
    if (typeof flushCache !== 'undefined') flushCache();
                
                // Fetch UID/Name for logging
                let targetName = id;
                try {
                    const vaultSheets = verifyVaultSchema(true);
                    const crewData = getSheetData(vaultSheets.crew);
                    let cMap = crewData.hMap;
                    for (let i = 1; i < crewData.length; i++) {
                        if (crewData[i][cMap['Email']] === targetEmail) {
                            targetName = crewData[i][cMap['uid']];
                            break;
                        }
                    }
                } catch(e) {}

                writeToAuditLog(actor, "DELETE", "ROSTER_LEAVE", "GLOBAL", targetName, `Deleted leave record.`);
    return "Success";
  });
}

// @INDEX: FINANCIALS -> Global Unpaid Scanner
function getGlobalUnpaidShiftsForPerson(uid) {
  return executeWithRetry(() => {
    const db = verifyDatabaseSchema(true);
    const indexData = getSheetData(db.index);
    let iMap = indexData.hMap;
    let projMap = {};
    for(let i=1; i<indexData.length; i++) {
      let stat = String(indexData[i][iMap['Status']] || '').toUpperCase();
      if(stat === 'TRASHED' || stat === 'CANCELLED') continue;
      projMap[indexData[i][iMap['uid']]] = indexData[i][iMap['Project_Name']];
    }
    
    const shiftData = getSheetData(db.shifts);
    let sMap = shiftData.hMap;
    let unpaidShifts = [];
    for(let i=1; i<shiftData.length; i++) {
      if(shiftData[i][sMap['user_uid']] !== uid) continue;
      let status = shiftData[i][sMap['payment_status']] || 'Pending';
      if(status === 'Paid') continue;
      
      let pId = shiftData[i][sMap['project_uid']];
      let pName = projMap[pId];
      if(!pName) continue; // skip deleted projects
      
      let sStart = Number(shiftData[i][sMap['Start']]);
      let dur = Number(shiftData[i][sMap['Duration']]);
      
      unpaidShifts.push({
        id: shiftData[i][sMap['uid']],
        projectId: pId,
        projectName: pName,
        role: shiftData[i][sMap['Role']],
        start: sStart,
        duration: dur,
        status: status,
        exactDateStr: 'Unknown' // we will populate this below
      });
    }
    
    // Populate dates using timelines
    let timelines = loadCalendar() || [];
    let projBaseDates = {};
    timelines.forEach(t => {
        if (!projBaseDates[t.Project_ID] || t.Event_Date < projBaseDates[t.Project_ID]) {
            projBaseDates[t.Project_ID] = t.Event_Date;
        }
    });
    
    unpaidShifts.forEach(s => {
      let pDateStr = projBaseDates[s.projectId];
      if(pDateStr) {
        let pDate = new Date(pDateStr + "T00:00:00Z");
        let dayOffset = Math.floor(s.start / 24);
        let shiftDate = new Date(pDate.getTime() + (dayOffset * 86400000));
        s.exactDateStr = `${shiftDate.getUTCFullYear()}-${String(shiftDate.getUTCMonth()+1).padStart(2,'0')}-${String(shiftDate.getUTCDate()).padStart(2,'0')}`;
      }
    });
    
    return unpaidShifts;
  });
}