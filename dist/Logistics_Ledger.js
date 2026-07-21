/**
 * SM Showrunner — Logistics_Ledger helpers (M1 dual-write window)
 * Movement SoT tab; PA truck columns still written until M4.
 * Schema lock: docs/ai/topics/logistics-ledger-schema-2026-07-20.md
 */
// @INDEX: LEDGER_ENGINE -> Logistics_Ledger dual-write + M2 backfill

var LOGISTICS_LEDGER_HEADERS_ = [
  'uid', 'project_uid', 'parent_uid', 'asset_uid', 'quantity', 'truck_uid',
  'from_location', 'to_location', 'load_time', 'unload_time', 'leg_id',
  'phase_ref', 'x', 'y', 'z', 'rotated', 'staged', 'creator'
];

/** M0 inventory — count PA rows that still carry truck/staging columns. */
function inventoryPaTruckFieldsAPI() {
  return executeWithRetry(function () {
    var sheets = verifyDatabaseSchema(true);
    if (!sheets || !sheets.projectAssets) {
      return { totalPaRows: 0, withAnyTruckField: 0, byProject: {}, note: 'no Project_Assets' };
    }
    var data = sheets.projectAssets.getDataRange().getValues();
    if (!data.length) return { totalPaRows: 0, withAnyTruckField: 0, byProject: {} };
    var map = {};
    data[0].forEach(function (h, i) { map[String(h).trim()] = i; });
    var truckCols = [
      'outbound_truck_uid', 'outbound_x', 'outbound_y', 'outbound_z', 'outbound_rotated', 'outbound_staged',
      'inbound_truck_uid', 'inbound_x', 'inbound_y', 'inbound_z', 'inbound_rotated', 'inbound_staged'
    ].filter(function (c) { return map[c] !== undefined; });

    var withAny = 0;
    var byProject = {};
    for (var i = 1; i < data.length; i++) {
      var pid = map['project_uid'] !== undefined ? String(data[i][map['project_uid']] || '') : '';
      var hit = false;
      for (var c = 0; c < truckCols.length; c++) {
        var v = data[i][map[truckCols[c]]];
        if (v === true || v === false) { if (v === true) { hit = true; break; } continue; }
        if (v !== '' && v !== null && v !== undefined) { hit = true; break; }
      }
      if (hit) {
        withAny++;
        if (pid) byProject[pid] = (byProject[pid] || 0) + 1;
      }
    }
    return {
      totalPaRows: data.length - 1,
      withAnyTruckField: withAny,
      projectsWithArrangement: Object.keys(byProject).length,
      byProject: byProject,
      truckColumnsPresent: truckCols.length,
      logisticsLedgerPresent: !!(sheets.logisticsLedger)
    };
  });
}

/**
 * Replace top-level ledger legs for a project for the given leg_ids from current PA rows.
 * Dual-write only — does not remove PA columns.
 * @param {Object} sheets verifyDatabaseSchema() result
 * @param {string} projectId
 * @param {Array} paRows array of PA row arrays (no header)
 * @param {Object} paMap header map
 * @param {string[]} legIds e.g. ['outbound'] or ['outbound','inbound']
 * @param {string} actor
 */
function logisticsLedgerDualWriteFromPaRows_(sheets, projectId, paRows, paMap, legIds, actor) {
  if (!sheets || !sheets.logisticsLedger) return { wrote: 0, skipped: true };
  var legs = (legIds || []).filter(function (l) { return l === 'outbound' || l === 'inbound'; });
  if (!legs.length) return { wrote: 0, skipped: true };

  var llData = sheets.logisticsLedger.getDataRange().getValues();
  if (!llData.length) {
    sheets.logisticsLedger.appendRow(LOGISTICS_LEDGER_HEADERS_);
    llData = [LOGISTICS_LEDGER_HEADERS_];
  }
  var llMap = {};
  llData[0].forEach(function (h, i) { llMap[String(h).trim()] = i; });
  var cols = llData[0].length;

  var kept = [llData[0]];
  for (var i = 1; i < llData.length; i++) {
    var row = llData[i];
    var rowPid = llMap['project_uid'] !== undefined ? String(row[llMap['project_uid']] || '') : '';
    var parent = llMap['parent_uid'] !== undefined ? String(row[llMap['parent_uid']] || '') : '';
    var legId = llMap['leg_id'] !== undefined ? String(row[llMap['leg_id']] || '') : '';
    var isTopLeg = !parent;
    var isOurRewrite = rowPid === String(projectId) && isTopLeg && legs.indexOf(legId) !== -1;
    if (!isOurRewrite) kept.push(row);
  }

  var newRows = [];
  (paRows || []).forEach(function (pa) {
    if (!pa || !pa.length) return;
    var assetUid = paMap['asset_uid'] !== undefined ? String(pa[paMap['asset_uid']] || '') : '';
    if (!assetUid) return;
    var qty = paMap['assigned_quantity'] !== undefined ? (pa[paMap['assigned_quantity']] || 1) : 1;
    var creator = paMap['creator'] !== undefined ? (pa[paMap['creator']] || actor || 'System') : (actor || 'System');

    legs.forEach(function (leg) {
      var truckKey = leg + '_truck_uid';
      var xKey = leg + '_x';
      var yKey = leg + '_y';
      var zKey = leg + '_z';
      var rotKey = leg + '_rotated';
      var stKey = leg + '_staged';
      var truck = paMap[truckKey] !== undefined ? (pa[paMap[truckKey]] || '') : '';
      var x = paMap[xKey] !== undefined ? pa[paMap[xKey]] : '';
      var y = paMap[yKey] !== undefined ? pa[paMap[yKey]] : '';
      var z = paMap[zKey] !== undefined ? pa[paMap[zKey]] : '';
      var rotated = paMap[rotKey] !== undefined ? (pa[paMap[rotKey]] === true || pa[paMap[rotKey]] === 'true') : false;
      var staged = paMap[stKey] !== undefined ? (pa[paMap[stKey]] === true || pa[paMap[stKey]] === 'true') : false;

      // Skip empty legs (no truck and no spatial coords) — stay/empty truck allowed only when staged or coords set
      var hasSpatial = x !== '' && x !== null && x !== undefined;
      if (!truck && !hasSpatial && !staged && !rotated) return;

      var r = new Array(cols).fill('');
      if (llMap['uid'] !== undefined) r[llMap['uid']] = Utilities.getUuid();
      if (llMap['project_uid'] !== undefined) r[llMap['project_uid']] = String(projectId);
      if (llMap['parent_uid'] !== undefined) r[llMap['parent_uid']] = '';
      if (llMap['asset_uid'] !== undefined) r[llMap['asset_uid']] = assetUid;
      if (llMap['quantity'] !== undefined) r[llMap['quantity']] = qty;
      if (llMap['truck_uid'] !== undefined) r[llMap['truck_uid']] = truck; // may be empty (continuity)
      if (llMap['from_location'] !== undefined) r[llMap['from_location']] = '';
      if (llMap['to_location'] !== undefined) r[llMap['to_location']] = '';
      if (llMap['load_time'] !== undefined) r[llMap['load_time']] = '';
      if (llMap['unload_time'] !== undefined) r[llMap['unload_time']] = '';
      if (llMap['leg_id'] !== undefined) r[llMap['leg_id']] = leg; // links to AUTO-OUTBOUND / AUTO-INBOUND notes
      if (llMap['phase_ref'] !== undefined) r[llMap['phase_ref']] = '';
      if (llMap['x'] !== undefined) r[llMap['x']] = x !== null && x !== undefined ? x : '';
      if (llMap['y'] !== undefined) r[llMap['y']] = y !== null && y !== undefined ? y : '';
      if (llMap['z'] !== undefined) r[llMap['z']] = z !== null && z !== undefined ? z : '';
      if (llMap['rotated'] !== undefined) r[llMap['rotated']] = rotated;
      if (llMap['staged'] !== undefined) r[llMap['staged']] = staged;
      if (llMap['creator'] !== undefined) r[llMap['creator']] = creator;
      newRows.push(r);
    });
  });

  var out = kept.concat(newRows);
  var backup = llData.map(function (row) { return row.slice(); });
  try {
    sheets.logisticsLedger.clearContents();
    if (out.length > 0) {
      sheets.logisticsLedger.getRange(1, 1, out.length, out[0].length).setValues(out);
    }
  } catch (eWrite) {
    try {
      sheets.logisticsLedger.clearContents();
      if (backup.length > 0) {
        sheets.logisticsLedger.getRange(1, 1, backup.length, backup[0].length).setValues(backup);
      }
    } catch (eRestore) { /* best-effort restore */ }
    throw eWrite;
  }
  return { wrote: newRows.length, skipped: false };
}

/**
 * Stamp load/unload from Shift_Assignments AUTO truck pairs (sheet SoT).
 * Per truck + note: load = min(Start), unload = max(Start) among the pair.
 * Link: outbound ↔ ⚠️ AUTO-OUTBOUND; inbound ↔ ⚠️ AUTO-INBOUND; same truck_uid.
 */
function logisticsLedgerStampClocksFromShiftSheet_(sheets, projectId) {
  if (!sheets || !sheets.logisticsLedger || !sheets.shifts) return { updated: 0 };
  var shiftData = sheets.shifts.getDataRange().getValues();
  if (shiftData.length < 2) return { updated: 0 };
  var sMap = {};
  shiftData[0].forEach(function (h, i) { sMap[String(h).trim()] = i; });
  if (sMap['Note'] === undefined || sMap['Start'] === undefined || sMap['user_uid'] === undefined) {
    return { updated: 0, skipped: true };
  }

  // truckUid -> { outbound: {load, unload}, inbound: {...} }
  var byTruck = {};
  for (var i = 1; i < shiftData.length; i++) {
    var row = shiftData[i];
    if (sMap['project_uid'] !== undefined && String(row[sMap['project_uid']] || '') !== String(projectId)) continue;
    var note = String(row[sMap['Note']] || '');
    var legId = '';
    if (note.indexOf('AUTO-OUTBOUND') !== -1) legId = 'outbound';
    else if (note.indexOf('AUTO-INBOUND') !== -1) legId = 'inbound';
    else continue;
    var truckUid = String(row[sMap['user_uid']] || '');
    if (!truckUid) continue;
    var start = Number(row[sMap['Start']]);
    if (isNaN(start)) continue;
    if (!byTruck[truckUid]) byTruck[truckUid] = {};
    if (!byTruck[truckUid][legId]) byTruck[truckUid][legId] = { load: start, unload: start };
    else {
      if (start < byTruck[truckUid][legId].load) byTruck[truckUid][legId].load = start;
      if (start > byTruck[truckUid][legId].unload) byTruck[truckUid][legId].unload = start;
    }
  }

  var logData = { generateTimes: true, outTrucks: [], inTrucks: [], outStartHr: 0, outDur: 0, inStartHr: 0, inDur: 0 };
  // Stamp one truck at a time via existing matcher (hours differ per truck)
  var updated = 0;
  Object.keys(byTruck).forEach(function (tUid) {
    var legs = byTruck[tUid];
    if (legs.outbound) {
      var o = legs.outbound;
      updated += logisticsLedgerStampClocksFromHub_(sheets, projectId, {
        generateTimes: true,
        outTrucks: [tUid],
        inTrucks: [],
        outStartHr: o.load,
        outDur: (o.unload - o.load),
        inStartHr: 0,
        inDur: 0
      }).updated || 0;
    }
    if (legs.inbound) {
      var inn = legs.inbound;
      updated += logisticsLedgerStampClocksFromHub_(sheets, projectId, {
        generateTimes: true,
        outTrucks: [],
        inTrucks: [tUid],
        outStartHr: 0,
        outDur: 0,
        inStartHr: inn.load,
        inDur: (inn.unload - inn.load)
      }).updated || 0;
    }
  });
  return { updated: updated };
}

/**
 * Best-effort phase_ref = Project_Timelines.uid for exactly one RECOVERY sub-event.
 * Multiple / zero → leave blank (manager review). Does not invent outbound/inbound mapping.
 */
function logisticsLedgerStampPhaseRefBestEffort_(sheets, projectId) {
  if (!sheets || !sheets.logisticsLedger || !sheets.timelines) return { updated: 0, phaseRef: '' };
  var tData = sheets.timelines.getDataRange().getValues();
  if (tData.length < 2) return { updated: 0, phaseRef: '' };
  var tMap = {};
  tData[0].forEach(function (h, i) { tMap[String(h).trim()] = i; });
  if (tMap['uid'] === undefined || tMap['Sub_Event_Type'] === undefined) {
    return { updated: 0, phaseRef: '', skipped: true };
  }

  var recoveries = [];
  for (var i = 1; i < tData.length; i++) {
    var row = tData[i];
    if (tMap['project_uid'] !== undefined && String(row[tMap['project_uid']] || '') !== String(projectId)) continue;
    var typ = String(row[tMap['Sub_Event_Type']] || '').toUpperCase().replace(/\s+/g, '_');
    if (typ === 'RECOVERY') {
      recoveries.push({
        uid: String(row[tMap['uid']] || ''),
        date: tMap['Event_Date'] !== undefined ? row[tMap['Event_Date']] : ''
      });
    }
  }
  if (recoveries.length !== 1 || !recoveries[0].uid) {
    return { updated: 0, phaseRef: '', recoveryCount: recoveries.length };
  }
  var phaseRef = recoveries[0].uid;

  var llData = sheets.logisticsLedger.getDataRange().getValues();
  if (llData.length < 2) return { updated: 0, phaseRef: phaseRef };
  var llMap = {};
  llData[0].forEach(function (h, i) { llMap[String(h).trim()] = i; });
  if (llMap['phase_ref'] === undefined) return { updated: 0, phaseRef: phaseRef, skipped: true };

  var updated = 0;
  for (var r = 1; r < llData.length; r++) {
    var llRow = llData[r];
    if (String(llRow[llMap['project_uid']] || '') !== String(projectId)) continue;
    if (String(llRow[llMap['parent_uid']] || '')) continue;
    var leg = String(llRow[llMap['leg_id']] || '');
    if (leg !== 'outbound' && leg !== 'inbound') continue;
    var cur = String(llRow[llMap['phase_ref']] || '');
    if (cur) continue;
    llRow[llMap['phase_ref']] = phaseRef;
    updated++;
  }
  if (updated > 0) {
    sheets.logisticsLedger.getRange(1, 1, llData.length, llData[0].length).setValues(llData);
  }
  return { updated: updated, phaseRef: phaseRef, recoveryCount: 1 };
}

/** Build manager review rows for top-level legs missing clocks or phase_ref. */
function logisticsLedgerBuildReviewList_(sheets, projectIdFilter) {
  var review = [];
  if (!sheets || !sheets.logisticsLedger) return review;
  var llData = sheets.logisticsLedger.getDataRange().getValues();
  if (llData.length < 2) return review;
  var llMap = {};
  llData[0].forEach(function (h, i) { llMap[String(h).trim()] = i; });
  for (var i = 1; i < llData.length; i++) {
    var row = llData[i];
    var pid = llMap['project_uid'] !== undefined ? String(row[llMap['project_uid']] || '') : '';
    if (projectIdFilter && pid !== String(projectIdFilter)) continue;
    if (llMap['parent_uid'] !== undefined && String(row[llMap['parent_uid']] || '')) continue;
    var leg = llMap['leg_id'] !== undefined ? String(row[llMap['leg_id']] || '') : '';
    if (leg !== 'outbound' && leg !== 'inbound') continue;
    var load = llMap['load_time'] !== undefined ? row[llMap['load_time']] : '';
    var unload = llMap['unload_time'] !== undefined ? row[llMap['unload_time']] : '';
    var phase = llMap['phase_ref'] !== undefined ? String(row[llMap['phase_ref']] || '') : '';
    var missingLoad = load === '' || load === null || load === undefined;
    var missingUnload = unload === '' || unload === null || unload === undefined;
    var missingPhaseRef = !phase;
    if (!missingLoad && !missingUnload && !missingPhaseRef) continue;
    review.push({
      project_uid: pid,
      ledger_uid: llMap['uid'] !== undefined ? String(row[llMap['uid']] || '') : '',
      asset_uid: llMap['asset_uid'] !== undefined ? String(row[llMap['asset_uid']] || '') : '',
      leg_id: leg,
      truck_uid: llMap['truck_uid'] !== undefined ? String(row[llMap['truck_uid']] || '') : '',
      missingLoad: missingLoad,
      missingUnload: missingUnload,
      missingPhaseRef: missingPhaseRef
    });
  }
  return review;
}

/**
 * M2 — Backfill Logistics_Ledger from existing PA truck columns.
 * @param {string|null} projectIdOrNull — one project, or null/'' for all projects that have PA truck fields
 * @param {string} actor
 */
function backfillLogisticsLedgerFromPaAPI(projectIdOrNull, actor) {
  actor = actor || 'System UI';
  return executeWithRetry(function () {
    assertActorCanEditProjectAssets(actor);
    var sheets = verifyDatabaseSchema();
    if (!sheets.projectAssets || !sheets.logisticsLedger) {
      return { success: false, error: 'Missing Project_Assets or Logistics_Ledger' };
    }

    var paData = sheets.projectAssets.getDataRange().getValues();
    if (paData.length < 2) {
      return { success: true, projectsProcessed: 0, legsWrote: 0, clocksStamped: 0, phaseRefsStamped: 0, review: [] };
    }
    var paMap = {};
    paData[0].forEach(function (h, i) { paMap[String(h).trim()] = i; });

    var targetIds = {};
    if (projectIdOrNull) {
      targetIds[String(projectIdOrNull)] = true;
    } else {
      var truckCols = [
        'outbound_truck_uid', 'outbound_x', 'outbound_y', 'outbound_z', 'outbound_rotated', 'outbound_staged',
        'inbound_truck_uid', 'inbound_x', 'inbound_y', 'inbound_z', 'inbound_rotated', 'inbound_staged'
      ].filter(function (c) { return paMap[c] !== undefined; });
      for (var pi = 1; pi < paData.length; pi++) {
        var pidScan = paMap['project_uid'] !== undefined ? String(paData[pi][paMap['project_uid']] || '') : '';
        if (!pidScan || targetIds[pidScan]) continue;
        var hit = false;
        for (var c = 0; c < truckCols.length; c++) {
          var v = paData[pi][paMap[truckCols[c]]];
          if (v === true) { hit = true; break; }
          if (v === false) continue;
          if (v !== '' && v !== null && v !== undefined) { hit = true; break; }
        }
        if (hit) targetIds[pidScan] = true;
      }
    }

    var projectsProcessed = 0;
    var legsWrote = 0;
    var clocksStamped = 0;
    var phaseRefsStamped = 0;
    var perProject = [];

    Object.keys(targetIds).forEach(function (pid) {
      var paRows = [];
      for (var i = 1; i < paData.length; i++) {
        if (String(paData[i][paMap['project_uid']] || '') === String(pid)) {
          paRows.push(paData[i]);
        }
      }
      var dw = logisticsLedgerDualWriteFromPaRows_(sheets, pid, paRows, paMap, ['outbound', 'inbound'], actor);
      var clocks = { updated: 0 };
      var phases = { updated: 0, phaseRef: '', recoveryCount: 0 };
      try { clocks = logisticsLedgerStampClocksFromShiftSheet_(sheets, pid); } catch (eC) { clocks = { updated: 0, error: String(eC) }; }
      try { phases = logisticsLedgerStampPhaseRefBestEffort_(sheets, pid); } catch (eP) { phases = { updated: 0, error: String(eP) }; }

      projectsProcessed++;
      legsWrote += dw.wrote || 0;
      clocksStamped += clocks.updated || 0;
      phaseRefsStamped += phases.updated || 0;
      perProject.push({
        projectId: pid,
        legsWrote: dw.wrote || 0,
        clocksStamped: clocks.updated || 0,
        phaseRefsStamped: phases.updated || 0,
        phaseRef: phases.phaseRef || '',
        recoveryCount: phases.recoveryCount
      });
    });

    var review = logisticsLedgerBuildReviewList_(sheets, projectIdOrNull || null);
    writeToAuditLog(actor, 'UPDATE', 'LOGISTICS_LEDGER', projectIdOrNull || '', projectIdOrNull || '',
      'M2 backfill: projects=' + projectsProcessed + ' legs=' + legsWrote +
      ' clocks=' + clocksStamped + ' phaseRefs=' + phaseRefsStamped +
      ' reviewGaps=' + review.length);
    flushCache();
    return {
      success: true,
      projectsProcessed: projectsProcessed,
      legsWrote: legsWrote,
      clocksStamped: clocksStamped,
      phaseRefsStamped: phaseRefsStamped,
      perProject: perProject,
      review: review,
      reviewCount: review.length
    };
  });
}

/** M2 — Manager review list only (no rewrite). */
function reviewLogisticsLedgerGapsAPI(projectIdOrNull) {
  return executeWithRetry(function () {
    var sheets = verifyDatabaseSchema(true);
    var review = logisticsLedgerBuildReviewList_(sheets, projectIdOrNull || null);
    return { success: true, review: review, reviewCount: review.length };
  }, 3, true);
}

/**
 * Stamp load/unload hour offsets onto existing top-level ledger legs for matching truck + leg_id.
 * Link rule: leg_id outbound ↔ AUTO-OUTBOUND; inbound ↔ AUTO-INBOUND; same truck_uid.
 */
function logisticsLedgerStampClocksFromHub_(sheets, projectId, logData) {
  if (!sheets || !sheets.logisticsLedger || !logData || !logData.generateTimes) return { updated: 0 };
  var llData = sheets.logisticsLedger.getDataRange().getValues();
  if (llData.length < 2) return { updated: 0 };
  var llMap = {};
  llData[0].forEach(function (h, i) { llMap[String(h).trim()] = i; });
  var updated = 0;

  function stampLeg(legId, truckUid, loadHr, unloadHr) {
    for (var i = 1; i < llData.length; i++) {
      var row = llData[i];
      if (String(row[llMap['project_uid']] || '') !== String(projectId)) continue;
      if (String(row[llMap['parent_uid']] || '')) continue;
      if (String(row[llMap['leg_id']] || '') !== legId) continue;
      if (String(row[llMap['truck_uid']] || '') !== String(truckUid || '')) continue;
      if (llMap['load_time'] !== undefined) row[llMap['load_time']] = loadHr != null ? String(loadHr) : '';
      if (llMap['unload_time'] !== undefined) row[llMap['unload_time']] = unloadHr != null ? String(unloadHr) : '';
      updated++;
    }
  }

  (logData.outTrucks || []).forEach(function (tUid) {
    stampLeg('outbound', tUid, logData.outStartHr, (Number(logData.outStartHr) || 0) + (Number(logData.outDur) || 0));
  });
  (logData.inTrucks || []).forEach(function (tUid) {
    stampLeg('inbound', tUid, logData.inStartHr, (Number(logData.inStartHr) || 0) + (Number(logData.inDur) || 0));
  });

  if (updated > 0) {
    sheets.logisticsLedger.getRange(1, 1, llData.length, llData[0].length).setValues(llData);
  }
  return { updated: updated };
}
