/**
 * SM Showrunner — Logistics_Ledger helpers (M1 dual-write window)
 * Movement SoT tab; PA truck columns still written until M4.
 * Schema lock: docs/ai/topics/logistics-ledger-schema-2026-07-20.md
 */
// @INDEX: LEDGER_ENGINE -> Logistics_Ledger dual-write + inventory

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
