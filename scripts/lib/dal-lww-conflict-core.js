/**
 * H3 — detect LWW loss on non-combining fields (PA + timeline).
 * Qty floor +/- combines (Case O) — never treat qty-only drift as a conflict toast.
 */
'use strict';

function paNonCombiningSig(pa) {
  pa = pa || {};
  var short = (pa.isShortage === true || pa.isShortage === 'true' ||
    String(pa.formula || '').indexOf('[SHORT] ') === 0) ? '1' : '0';
  return [
    String(pa.assetId || pa.asset_uid || ''),
    String(pa.location || 'General'),
    String(pa.formula || 'Standalone').replace(/^\[SHORT\]\s*/, ''),
    short,
    String(pa.overrideDept || pa.override_dept || ''),
    String(pa.containerUid || pa.container_uid || '')
  ].join('\t');
}

function shiftNonCombiningSig(s) {
  s = s || {};
  return [
    String(s.user_uid || s.userUid || ''),
    String(s.role || ''),
    String(s.Start != null ? s.Start : (s.start != null ? s.start : '')),
    String(s.Duration != null ? s.Duration : (s.duration != null ? s.duration : '')),
    String(s.Note != null ? s.Note : (s.note || '')),
    s.Has_Arrow || s.hasArrow ? '1' : '0'
  ].join('\t');
}

function phaseNonCombiningSig(p) {
  p = p || {};
  return [
    String(p.Phase_Name || p.name || ''),
    String(p.Start != null ? p.Start : (p.start != null ? p.start : '')),
    String(p.Duration != null ? p.Duration : (p.duration != null ? p.duration : '')),
    String(p.Note != null ? p.Note : (p.note || ''))
  ].join('\t');
}

/**
 * @param {object} watchMap uid → { sig, until }
 * @param {object} remoteByUid
 * @param {number} now
 * @param {object} [stillProtected] uid → truthy if hold/touch keeps local
 * @returns {string[]} uids that lost non-combining fields to remote
 */
function detectWatchedLwwLosses(watchMap, remoteByUid, now, stillProtected, sigFn) {
  sigFn = sigFn || paNonCombiningSig;
  stillProtected = stillProtected || {};
  remoteByUid = remoteByUid || {};
  watchMap = watchMap || {};
  now = now != null ? now : Date.now();
  var lost = [];
  Object.keys(watchMap).forEach(function (uid) {
    var w = watchMap[uid];
    if (!w || !w.sig) return;
    if (w.until && now > w.until) return;
    if (stillProtected[uid]) return;
    var remote = remoteByUid[uid];
    if (!remote) return; // delete is a different cue; H3 is field LWW
    if (sigFn(remote) !== w.sig) lost.push(uid);
  });
  return lost;
}

function mapByUid(list) {
  var m = {};
  (list || []).forEach(function (pa) {
    if (pa && pa.uid) m[String(pa.uid)] = pa;
  });
  return m;
}

function mapById(list) {
  var m = {};
  (list || []).forEach(function (e) {
    if (e && e.id) m[String(e.id)] = e;
  });
  return m;
}

module.exports = {
  paNonCombiningSig: paNonCombiningSig,
  shiftNonCombiningSig: shiftNonCombiningSig,
  phaseNonCombiningSig: phaseNonCombiningSig,
  detectWatchedLwwLosses: detectWatchedLwwLosses,
  mapByUid: mapByUid,
  mapById: mapById
};
