/**
 * H2 — cheaper remote apply: classify PA / timeline diffs for targeted redraw.
 * Pass condition (campaign A6): qty-only / small entity diffs must not force full list rebuild.
 */
'use strict';

function paStructuralKey(pa) {
  pa = pa || {};
  var short = (pa.isShortage === true || pa.isShortage === 'true' ||
    String(pa.formula || '').indexOf('[SHORT] ') === 0) ? '1' : '0';
  return [
    String(pa.assetId || ''),
    String(pa.location || 'General'),
    String(pa.formula || 'Standalone').replace(/^\[SHORT\]\s*/, ''),
    short,
    String(pa.overrideDept || pa.override_dept || ''),
    String(pa.containerUid || pa.container_uid || '')
  ].join('\t');
}

function isFormulaGrouped(pa) {
  var f = String((pa && pa.formula) || 'Standalone');
  return f !== 'Standalone' && f.indexOf('[SHORT] Standalone') !== 0;
}

/**
 * Diff two fixture lists (by uid). Autos should be filtered by caller.
 * @returns {{
 *   added: string[], deleted: string[], changed: string[],
 *   qtyOnlyChanged: string[], structural: boolean,
 *   hasFormulaGroupMembers: boolean, totalTouched: number,
 *   canPatchQty: boolean, patchThreshold: number
 * }}
 */
function diffPaFixtures(before, after, opts) {
  opts = opts || {};
  var beforeBy = {};
  var afterBy = {};
  (before || []).forEach(function (pa) {
    if (pa && pa.uid) beforeBy[String(pa.uid)] = pa;
  });
  (after || []).forEach(function (pa) {
    if (pa && pa.uid) afterBy[String(pa.uid)] = pa;
  });

  var added = [];
  var deleted = [];
  var changed = [];
  var qtyOnlyChanged = [];
  var structural = false;
  var hasFormulaGroupMembers = false;

  Object.keys(afterBy).forEach(function (uid) {
    if (!beforeBy[uid]) {
      added.push(uid);
      structural = true;
      if (isFormulaGrouped(afterBy[uid])) hasFormulaGroupMembers = true;
    }
  });
  Object.keys(beforeBy).forEach(function (uid) {
    if (!afterBy[uid]) {
      deleted.push(uid);
      structural = true;
      if (isFormulaGrouped(beforeBy[uid])) hasFormulaGroupMembers = true;
    }
  });
  Object.keys(beforeBy).forEach(function (uid) {
    var a = afterBy[uid];
    if (!a) return;
    var b = beforeBy[uid];
    if (paStructuralKey(b) !== paStructuralKey(a)) {
      changed.push(uid);
      structural = true;
      if (isFormulaGrouped(b) || isFormulaGrouped(a)) hasFormulaGroupMembers = true;
      return;
    }
    var bQty = Number(b.qty != null ? b.qty : 1);
    var aQty = Number(a.qty != null ? a.qty : 1);
    var bScan = Number(b.scannedQty || 0) || 0;
    var aScan = Number(a.scannedQty || 0) || 0;
    if (bQty !== aQty || bScan !== aScan) {
      changed.push(uid);
      qtyOnlyChanged.push(uid);
      if (isFormulaGrouped(b) || isFormulaGrouped(a)) hasFormulaGroupMembers = true;
    }
  });

  var totalTouched = added.length + deleted.length + changed.length;
  var n = Math.max(Object.keys(beforeBy).length, 1);
  var patchThreshold = Math.max(3, Math.ceil(n * 0.05));
  if (opts.patchThreshold != null) patchThreshold = Number(opts.patchThreshold) || patchThreshold;

  var canPatchQty = !structural &&
    qtyOnlyChanged.length > 0 &&
    qtyOnlyChanged.length === changed.length &&
    !hasFormulaGroupMembers &&
    totalTouched <= patchThreshold;

  return {
    added: added,
    deleted: deleted,
    changed: changed,
    qtyOnlyChanged: qtyOnlyChanged,
    structural: structural,
    hasFormulaGroupMembers: hasFormulaGroupMembers,
    totalTouched: totalTouched,
    canPatchQty: canPatchQty,
    patchThreshold: patchThreshold,
    renderMode: canPatchQty ? 'patchQty' : 'full'
  };
}

/**
 * Diff timeline entities between prev/next merged states.
 * @returns {{
 *   changedShiftIds: string[], deletedShiftIds: string[], addedShiftIds: string[],
 *   changedPhaseIds: string[], deletedPhaseIds: string[], addedPhaseIds: string[],
 *   overridesChanged: boolean, totalTouched: number, canPatchEntities: boolean,
 *   patchThreshold: number, renderMode: string
 * }}
 */
function diffTimelineStates(prev, next, opts) {
  opts = opts || {};
  prev = prev || {};
  next = next || {};
  var patchThreshold = opts.patchThreshold != null ? Number(opts.patchThreshold) : 5;

  function mapById(list) {
    var m = {};
    (list || []).forEach(function (e) {
      if (e && e.id != null) m[String(e.id)] = e;
    });
    return m;
  }
  function entitySig(e, kind) {
    e = e || {};
    if (kind === 'phase') {
      return [
        String(e.Phase_Name || e.name || ''),
        String(e.Start != null ? e.Start : (e.start != null ? e.start : '')),
        String(e.Duration != null ? e.Duration : (e.duration != null ? e.duration : '')),
        String(e.Note != null ? e.Note : (e.note || ''))
      ].join('\t');
    }
    return [
      String(e.user_uid || e.userUid || e.email || ''),
      String(e.role || ''),
      String(e.Start != null ? e.Start : (e.start != null ? e.start : '')),
      String(e.Duration != null ? e.Duration : (e.duration != null ? e.duration : '')),
      String(e.Note != null ? e.Note : (e.note || '')),
      e.Has_Arrow || e.hasArrow ? String(e.Has_Arrow || e.hasArrow) : '0',
      String(e.color || '')
    ].join('\t');
  }

  var prevS = mapById(prev.shifts);
  var nextS = mapById(next.shifts);
  var prevP = mapById(prev.phases);
  var nextP = mapById(next.phases);

  var addedShiftIds = [];
  var deletedShiftIds = [];
  var changedShiftIds = [];
  Object.keys(nextS).forEach(function (id) {
    if (!prevS[id]) addedShiftIds.push(id);
  });
  Object.keys(prevS).forEach(function (id) {
    if (!nextS[id]) deletedShiftIds.push(id);
    else if (entitySig(prevS[id], 'shift') !== entitySig(nextS[id], 'shift')) changedShiftIds.push(id);
  });

  var addedPhaseIds = [];
  var deletedPhaseIds = [];
  var changedPhaseIds = [];
  Object.keys(nextP).forEach(function (id) {
    if (!prevP[id]) addedPhaseIds.push(id);
  });
  Object.keys(prevP).forEach(function (id) {
    if (!nextP[id]) deletedPhaseIds.push(id);
    else if (entitySig(prevP[id], 'phase') !== entitySig(nextP[id], 'phase')) changedPhaseIds.push(id);
  });

  var prevOv = JSON.stringify(prev.overrides || {});
  var nextOv = JSON.stringify(next.overrides || {});
  var overridesChanged = prevOv !== nextOv;

  var totalTouched = addedShiftIds.length + deletedShiftIds.length + changedShiftIds.length +
    addedPhaseIds.length + deletedPhaseIds.length + changedPhaseIds.length +
    (overridesChanged ? 1 : 0);

  // Adds need createElement + transit recompute — fall back to layer redraw.
  // Phase changes move guide lines without data-phase-id → layer redraw (renderPhases).
  var canPatchEntities = !overridesChanged &&
    addedShiftIds.length === 0 &&
    addedPhaseIds.length === 0 &&
    changedPhaseIds.length === 0 &&
    deletedPhaseIds.length === 0 &&
    totalTouched > 0 &&
    totalTouched <= patchThreshold;

  return {
    changedShiftIds: changedShiftIds,
    deletedShiftIds: deletedShiftIds,
    addedShiftIds: addedShiftIds,
    changedPhaseIds: changedPhaseIds,
    deletedPhaseIds: deletedPhaseIds,
    addedPhaseIds: addedPhaseIds,
    overridesChanged: overridesChanged,
    totalTouched: totalTouched,
    canPatchEntities: canPatchEntities,
    patchThreshold: patchThreshold,
    renderMode: canPatchEntities ? 'patchEntities' : (totalTouched === 0 ? 'none' : 'layer')
  };
}

module.exports = {
  paStructuralKey: paStructuralKey,
  isFormulaGrouped: isFormulaGrouped,
  diffPaFixtures: diffPaFixtures,
  diffTimelineStates: diffTimelineStates
};
