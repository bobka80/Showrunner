/**
 * SM Showrunner (smuruner) - Clean 8 Architecture
 * Logistics_Timeline.js - Shifts, Phases & Calendar Data
 */

// ==========================================
// --- TIMELINE SHIFT ENGINE (RELATIONAL DB) ---
// ==========================================
// @INDEX: CRUD_ENGINE -> Project Timeline Data

function getTimelineData(folderId, mode) {
  return getTimelineRepo().getForProject(folderId, mode);
}

function dalAssertSheetsTimelineNotForked_(folderId) {
  if (resolveDalSessionStatus_(folderId, DAL_DOMAIN.TIMELINE) === DAL_SESSION.SESSION_OPEN) {
    throw new Error('TIMELINE_SESSION_ACTIVE: Timeline is on the Firebase fork — direct Sheets access blocked.');
  }
}

/** When true, timeline Sheets helpers skip nested executeWithRetry (DAL open/close already holds the lock). */
var __dalTimelineSheetsDirect_ = false;

function getTimelineDataSheets_(folderId, mode) {
  var run = function () {
    if (!__dalTimelineSheetsDirect_) dalAssertSheetsTimelineNotForked_(folderId);
    let roster = getCrewSettings(); // Pulls from VAULT
    

    const sheets = verifyDatabaseSchema(true);
    let state = { roster: roster, assigned: [], shifts: [], phases: [], overrides: {} };

    // 1. Fetch Shifts
    let shiftData = getSheetData(sheets.shifts);
    let sMap = shiftData.hMap;
    for (let i = 1; i < shiftData.length; i++) {
      if (shiftData[i][sMap['project_uid']] === folderId) {
        let uVal = shiftData[i][sMap['user_uid']];
        state.shifts.push({ id: shiftData[i][sMap['uid']], user_uid: uVal, email: uVal, role: shiftData[i][sMap['Role']], start: Number(shiftData[i][sMap['Start']]), duration: Number(shiftData[i][sMap['Duration']]), hasArrow: shiftData[i][sMap['Has_Arrow']], note: shiftData[i][sMap['Note']] || "", payment_status: shiftData[i][sMap['payment_status']] || 'Pending', paid_amount: shiftData[i][sMap['paid_amount']] || '' });
        if (!state.assigned.includes(uVal)) state.assigned.push(uVal);
      }
    }

    // 2. Fetch Phase Blocks
    let blockData = getSheetData(sheets.blocks);
    let bMap = blockData.hMap;
    for (let i = 1; i < blockData.length; i++) {
      if (blockData[i][bMap['project_uid']] === folderId) {
        state.phases.push({ id: blockData[i][bMap['uid']], type: blockData[i][bMap['Phase_Name']], start: Number(blockData[i][bMap['Start']]), duration: Number(blockData[i][bMap['Duration']]), note: blockData[i][bMap['Note']] || "" });
      }
    }

    // 3. Fetch Dept Overrides
    let overrideData = getSheetData(sheets.overrides);
    let oMap = overrideData.hMap;
    for (let i = 1; i < overrideData.length; i++) {
      if (overrideData[i][oMap['project_uid']] === folderId) {
        state.overrides[overrideData[i][oMap['user_uid']]] = overrideData[i][oMap['Dept_Name']];
      }
    }
    
    return state;
  };
  if (__dalTimelineSheetsDirect_) return run();
  return executeWithRetry(run);
}

function saveTimelineData(folderId, mode, shifts, crewUids, phases, overrides, clientTimestamp, actor = "System UI", subEvents = null) {
  return getTimelineRepo().save(folderId, mode, shifts, crewUids, phases, overrides, clientTimestamp, actor, subEvents);
}

function saveTimelineDataSheets_(folderId, mode, shifts, crewUids, phases, overrides, clientTimestamp, actor = "System UI", subEvents = null) {
  var run = function () {
    assertActorCanEditTimeline(actor);
    if (!__dalTimelineSheetsDirect_) dalAssertSheetsTimelineNotForked_(folderId);
    const sheets = verifyDatabaseSchema();

    let newTimestamp = new Date().toISOString();

    // Concurrency Check for Timeline
    if (clientTimestamp) {
        let indexData = sheets.index.getDataRange().getValues();
        let iMap = {};
        if(indexData.length > 0) indexData[0].forEach((h,i)=>iMap[h.toString().trim()]=i);
        for (let i = 1; i < indexData.length; i++) {
            if (indexData[i][iMap['uid']] === folderId) {
                let dbTimestamp = indexData[i][iMap['Last_Updated']];
                if (dbTimestamp && clientTimestamp) {
                    let t1 = new Date(dbTimestamp).getTime();
                    let t2 = new Date(clientTimestamp).getTime();
                    if (Math.abs(t1 - t2) > 2000) {
                        throw new Error("COLLISION_DETECTED: This timeline was modified by another user. Please refresh and try again.");
                    }
                }
                sheets.index.getRange(i + 1, iMap['Last_Updated'] + 1).setValue(newTimestamp);
                break;
            }
        }
    }

    // 1. Remove old state for this project only (scoped rows — no clearContents)
    let sInfo = dalDeleteRowsByColumn_(sheets.shifts, 'project_uid', folderId);
    let bInfo = dalDeleteRowsByColumn_(sheets.blocks, 'project_uid', folderId);
    let oInfo = dalDeleteRowsByColumn_(sheets.overrides, 'project_uid', folderId);
    let sMap = sInfo.map; let bMap = bInfo.map; let oMap = oInfo.map;

    // 2. Inject New Shifts
    if (shifts && shifts.length > 0) {
      let shiftRows = shifts.map(s => {
        let r = new Array(sInfo.cols).fill("");
        if(sMap['uid'] !== undefined) r[sMap['uid']] = s.id || Utilities.getUuid();
        if(sMap['project_uid'] !== undefined) r[sMap['project_uid']] = folderId;
        if(sMap['Phase_Mode'] !== undefined) r[sMap['Phase_Mode']] = mode;
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
      dalAppendRows_(sheets.shifts, shiftRows);
    }

    // 3. Inject New Phases
    if (phases && phases.length > 0) {
      let phaseRows = phases.map(p => {
        let r = new Array(bInfo.cols).fill("");
        if(bMap['uid'] !== undefined) r[bMap['uid']] = p.id || Utilities.getUuid();
        if(bMap['project_uid'] !== undefined) r[bMap['project_uid']] = folderId;
        if(bMap['Phase_Mode'] !== undefined) r[bMap['Phase_Mode']] = mode;
        if(bMap['Phase_Name'] !== undefined) r[bMap['Phase_Name']] = p.type;
        if(bMap['Start'] !== undefined) r[bMap['Start']] = p.start;
        if(bMap['Duration'] !== undefined) r[bMap['Duration']] = p.duration;
        if(bMap['Note'] !== undefined) r[bMap['Note']] = p.note || "";
        return r;
      });
      dalAppendRows_(sheets.blocks, phaseRows);
    }

    // 4. Inject New Overrides
    if (overrides && Object.keys(overrides).length > 0) {
      let overrideRows = Object.keys(overrides).map(email => {
        let r = new Array(oInfo.cols).fill("");
        if(oMap['project_uid'] !== undefined) r[oMap['project_uid']] = folderId;
        if(oMap['Phase_Mode'] !== undefined) r[oMap['Phase_Mode']] = mode;
        if(oMap['user_uid'] !== undefined) r[oMap['user_uid']] = email;
        if(oMap['Dept_Name'] !== undefined) r[oMap['Dept_Name']] = overrides[email];
        return r;
      });
      dalAppendRows_(sheets.overrides, overrideRows);
    }
    
    // 5. Inject New Sub-Events if provided
    if (subEvents !== null) {
      let tInfo = dalDeleteRowsByColumn_(sheets.timelines, 'project_uid', folderId);
      let tMap = tInfo.map;
      if (subEvents.length > 0) {
        let tlRows = subEvents.map(t => {
          let r = new Array(tInfo.cols).fill("");
          if(tMap['uid'] !== undefined) r[tMap['uid']] = t.uid || t.id || Utilities.getUuid();
          if(tMap['project_uid'] !== undefined) r[tMap['project_uid']] = folderId;
          if(tMap['Sub_Event_Type'] !== undefined) r[tMap['Sub_Event_Type']] = t.Sub_Event_Type || "MAIN";
          if(tMap['Event_Date'] !== undefined) r[tMap['Event_Date']] = t.Event_Date || "";
          if(tMap['Start_Time'] !== undefined) r[tMap['Start_Time']] = t.Start_Time ? `'${t.Start_Time}` : "";
          if(tMap['End_Time'] !== undefined) r[tMap['End_Time']] = t.End_Time ? `'${t.End_Time}` : "";
          if(tMap['Note'] !== undefined) r[tMap['Note']] = t.Note || "";
          return r;
        });
        dalAppendRows_(sheets.timelines, tlRows);
      }
    }

    // Generate Delta Payload message
    let oldShiftIds = sInfo.deletedRows.map(r => r[sMap['uid']]);
    let newShiftIds = shifts ? shifts.map(s => s.id) : [];
    let addedShifts = newShiftIds.filter(id => !oldShiftIds.includes(id)).length;
    let deletedShifts = oldShiftIds.filter(id => !newShiftIds.includes(id)).length;
    let keptShifts = newShiftIds.filter(id => oldShiftIds.includes(id)).length;
    
    let oldPhaseIds = bInfo.deletedRows.map(r => r[bMap['uid']]);
    let newPhaseIds = phases ? phases.map(p => p.id) : [];
    let addedPhases = newPhaseIds.filter(id => !oldPhaseIds.includes(id)).length;
    let deletedPhases = oldPhaseIds.filter(id => !newPhaseIds.includes(id)).length;
    
    let changeMsgs = [];
    if (addedShifts > 0) changeMsgs.push(`Added ${addedShifts} shift(s)`);
    if (deletedShifts > 0) changeMsgs.push(`Deleted ${deletedShifts} shift(s)`);
    if (keptShifts > 0) changeMsgs.push(`Updated ${keptShifts} shift(s)`);
    if (addedPhases > 0) changeMsgs.push(`Added ${addedPhases} phase(s)`);
    if (deletedPhases > 0) changeMsgs.push(`Deleted ${deletedPhases} phase(s)`);
    
    let deltaPayload = changeMsgs.join(' | ');
    if (deltaPayload === "") deltaPayload = "Saved timeline with no modifications.";

    // Generate UI Notifications for NEWLY ASSIGNED CREW and SHIFT CHANGES
    let oldUids = [];
    let oldShiftsMap = {};
    if (sInfo.deletedRows.length > 0) {
        oldUids = [...new Set(sInfo.deletedRows.map(r => r[sMap['user_uid']]))];
        sInfo.deletedRows.forEach(r => {
            oldShiftsMap[r[sMap['uid']]] = {
                start: Number(r[sMap['Start']]),
                duration: Number(r[sMap['Duration']]),
                payment_status: r[sMap['payment_status']] || 'Pending',
                paid_amount: r[sMap['paid_amount']] || ''
            };
        });
    }
    let newUids = shifts ? [...new Set(shifts.map(s => s.user_uid || s.email))] : [];
    let newlyAddedUids = newUids.filter(e => !oldUids.includes(e) && e && !isTruckShiftIdentifier_(e));
    let removedUids = oldUids.filter(e => e && !isTruckShiftIdentifier_(e) && !newUids.includes(e));

    let modifiedUids = new Set();
    if (shifts) {
        shifts.forEach(s => {
            let uid = s.user_uid || s.email;
            if (uid && !isTruckShiftIdentifier_(uid) && oldShiftsMap[s.id]) {
                let oldS = oldShiftsMap[s.id];
                if (oldS.start !== Number(s.start) || oldS.duration !== Number(s.duration)) {
                    modifiedUids.add(uid);
                }
                    s.payment_status = oldS.payment_status;
                    s.paid_amount = oldS.paid_amount;
            }
        });
    }

    if (newlyAddedUids.length > 0 || modifiedUids.size > 0 || removedUids.length > 0) {
        let pName = "an event";
        let indexData = sheets.index.getDataRange().getValues();
        let iMap = {}; if(indexData.length > 0) indexData[0].forEach((h,i)=>iMap[h.toString().trim()]=i);
        for(let i=1; i<indexData.length; i++) { if(indexData[i][iMap['uid']] === folderId) { pName = indexData[i][iMap['Project_Name']]; break; } }

        newlyAddedUids.forEach(function(uid) {
            appendInAppNotification_(sheets.notifs, uid, '📅 You were added to the schedule for: ' + pName, 'project', folderId);
        });

        modifiedUids.forEach(function(uid) {
            appendInAppNotification_(sheets.notifs, uid, '⏰ Your shift time was changed for: ' + pName, 'project', folderId);
        });

        removedUids.forEach(function(uid) {
            appendInAppNotification_(sheets.notifs, uid, '📅 You were removed from the schedule for: ' + pName, 'project', folderId);
        });

        try {
            if (newlyAddedUids.length > 0) {
                dispatchPushToIdentifiers(
                    newlyAddedUids,
                    'Schedule update',
                    'You were added to: ' + pName,
                    getShowrunnerHostingLink_(),
                    actor
                );
            }
            if (modifiedUids.size > 0) {
                dispatchPushToIdentifiers(
                    Array.from(modifiedUids),
                    'Shift time changed',
                    'Your shift was updated for: ' + pName,
                    getShowrunnerHostingLink_(),
                    actor
                );
            }
            if (removedUids.length > 0) {
                dispatchPushToIdentifiers(
                    removedUids,
                    'Schedule update',
                    'You were removed from: ' + pName,
                    getShowrunnerHostingLink_(),
                    actor
                );
            }
        } catch (pushErr) { /* in-app notifs saved */ }
    }

    if (typeof flushCache !== 'undefined') flushCache();
    SpreadsheetApp.flush();
    writeToAuditLog(actor, "UPDATE", "TIMELINE", folderId, folderId, deltaPayload);
    return JSON.stringify({ status: "Saved", timestamp: newTimestamp });
  };
  if (__dalTimelineSheetsDirect_) return run();
  return executeWithRetry(run);
}

function loadCalendar() {
  return executeWithRetry(() => {
    const sheets = verifyDatabaseSchema(true);
    const indexData = getSheetData(sheets.index);
    const timelineData = getSheetData(sheets.timelines);
    let iMap = indexData.hMap;
    let tMap = timelineData.hMap;
    
    // Map Parents for fast O(1) Joining
    let projectMap = {};
    for (let i = 1; i < indexData.length; i++) {
      projectMap[indexData[i][iMap['uid']]] = {
        Project_Name: indexData[i][iMap['Project_Name']],
        Client: indexData[i][iMap['Client']],
        Status: indexData[i][iMap['Status']],
        Folder_ID: indexData[i][iMap['Folder_ID']],
        Manager_Email: indexData[i][iMap['Manager_Email']]
      };
    }
    
    let joinedCalendar = [];
    for (let i = 1; i < timelineData.length; i++) {
      let tRow = timelineData[i];
      let parent = projectMap[tRow[tMap['project_uid']]];
      
      if (parent) {
        let rawDate = tRow[tMap['Event_Date']];
        let eDate = "";
        if (rawDate) {
            // Normalize date to YYYY-MM-DD format safely handling both strings and native Date objects
            if (rawDate instanceof Date) {
                let y = rawDate.getFullYear();
                let m = String(rawDate.getMonth() + 1).padStart(2, '0');
                let d = String(rawDate.getDate()).padStart(2, '0');
                eDate = `${y}-${m}-${d}`;
            } else {
                let dateStr = String(rawDate).split('T')[0];
                let isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
                if (isoMatch) eDate = isoMatch[0];
                else eDate = dateStr; // Fallback
            }
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
        
        joinedCalendar.push({
          Timeline_ID: tRow[tMap['uid']],
          Project_ID: tRow[tMap['project_uid']],
          Project_Name: parent.Project_Name,
          Client: parent.Client,
          Status: parent.Status,
          Folder_ID: parent.Folder_ID,
          Sub_Event_Type: tRow[tMap['Sub_Event_Type']],
          Event_Date: eDate,
          Start_Time: extractTime(tRow[tMap['Start_Time']]),
          End_Time: extractTime(tRow[tMap['End_Time']]),
          Note: tRow[tMap['Note']]
        });
      }
    }
    return joinedCalendar;
  });
}