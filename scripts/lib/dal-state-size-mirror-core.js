/**
 * H4 — PA/timeline state size + END PREP mirror compare (pure, Node-testable).
 *
 * Thresholds (Firestore doc hard limit ≈ 1 MiB):
 *   WARN: 512 KiB JSON  OR  1,500 fixtures / timeline entities
 *   MAX:  900 KiB JSON  OR  4,000 fixtures / timeline entities
 *
 * Mirror: state fixtures vs collection fixture docs (autos excluded — collection-only).
 */
'use strict';

var WARN_BYTES = 512 * 1024;
var MAX_BYTES = 900 * 1024;
var WARN_COUNT = 1500;
var MAX_COUNT = 4000;

function byteLenJson_(obj) {
  try {
    return JSON.stringify(obj == null ? null : obj).length;
  } catch (e) {
    return 0;
  }
}

function isAutoLike_(pa) {
  if (!pa) return false;
  if (pa.isAuto || pa.isGenericAuto) return true;
  var f = String(pa.formula || '');
  return f === 'Auto-Container' || f === 'Gen-Auto-Container' ||
    f.indexOf('[AUTO] ') === 0 || f.indexOf('[GEN_AUTO] ') === 0;
}

function fixturesOnly_(list) {
  return (list || []).filter(function (pa) { return pa && pa.uid && !isAutoLike_(pa); });
}

/**
 * @param {object} opts
 * @param {string} [opts.json] prebuilt JSON string
 * @param {*} [opts.payload] object/array to stringify
 * @param {number} [opts.count] entity count (fixtures or timeline entities)
 */
function stateSizeReport(opts) {
  opts = opts || {};
  var bytes = 0;
  if (opts.json != null) bytes = String(opts.json).length;
  else if (opts.payload !== undefined) bytes = byteLenJson_(opts.payload);
  var count = Number(opts.count || 0) || 0;
  var overMax = bytes >= MAX_BYTES || count >= MAX_COUNT;
  var overWarn = !overMax && (bytes >= WARN_BYTES || count >= WARN_COUNT);
  return {
    bytes: bytes,
    count: count,
    warnBytes: WARN_BYTES,
    maxBytes: MAX_BYTES,
    warnCount: WARN_COUNT,
    maxCount: MAX_COUNT,
    overWarn: overWarn,
    overMax: overMax,
    ok: !overMax
  };
}

function fixtureSigRow_(pa) {
  pa = pa || {};
  return [
    String(pa.uid || ''),
    String(pa.assetId || pa.asset_uid || ''),
    String(pa.qty != null ? pa.qty : (pa.assigned_quantity != null ? pa.assigned_quantity : 1)),
    String(pa.location || 'General'),
    String(pa.formula || 'Standalone'),
    pa.isShortage ? '1' : '0',
    String(pa.overrideDept || pa.override_dept || ''),
    String(pa.containerUid || pa.container_uid || '')
  ].join('\t');
}

/**
 * Compare state fixtures (SSOT) to collection fixture docs.
 * @returns {{ ok, missingInCollection, missingInState, fieldMismatches, summary }}
 */
function mirrorCompare(stateFixtures, collectionFixtures) {
  var state = fixturesOnly_(stateFixtures);
  var col = fixturesOnly_(collectionFixtures);
  var stateBy = {};
  var colBy = {};
  state.forEach(function (pa) { stateBy[String(pa.uid)] = pa; });
  col.forEach(function (pa) { colBy[String(pa.uid)] = pa; });

  var missingInCollection = [];
  var missingInState = [];
  var fieldMismatches = [];

  Object.keys(stateBy).forEach(function (uid) {
    if (!colBy[uid]) missingInCollection.push(uid);
    else if (fixtureSigRow_(stateBy[uid]) !== fixtureSigRow_(colBy[uid])) {
      fieldMismatches.push(uid);
    }
  });
  Object.keys(colBy).forEach(function (uid) {
    if (!stateBy[uid]) missingInState.push(uid);
  });

  var ok = missingInCollection.length === 0 &&
    missingInState.length === 0 &&
    fieldMismatches.length === 0;

  var parts = [];
  if (missingInCollection.length) parts.push('state-only:' + missingInCollection.length);
  if (missingInState.length) parts.push('collection-only:' + missingInState.length);
  if (fieldMismatches.length) parts.push('field-diff:' + fieldMismatches.length);

  return {
    ok: ok,
    missingInCollection: missingInCollection,
    missingInState: missingInState,
    fieldMismatches: fieldMismatches,
    summary: ok ? 'ok' : parts.join(' ')
  };
}

function timelineEntityCount(shifts, phases, overrides) {
  var n = (shifts || []).length + (phases || []).length;
  if (overrides && typeof overrides === 'object') n += Object.keys(overrides).length;
  return n;
}

function timelineStateSizeReport(shifts, phases, overrides) {
  var payload = {
    shifts: shifts || [],
    phases: phases || [],
    overrides: overrides || {}
  };
  return stateSizeReport({
    payload: payload,
    count: timelineEntityCount(shifts, phases, overrides)
  });
}

module.exports = {
  WARN_BYTES: WARN_BYTES,
  MAX_BYTES: MAX_BYTES,
  WARN_COUNT: WARN_COUNT,
  MAX_COUNT: MAX_COUNT,
  stateSizeReport: stateSizeReport,
  mirrorCompare: mirrorCompare,
  fixturesOnly: fixturesOnly_,
  isAutoLike: isAutoLike_,
  fixtureSigRow: fixtureSigRow_,
  timelineEntityCount: timelineEntityCount,
  timelineStateSizeReport: timelineStateSizeReport
};
