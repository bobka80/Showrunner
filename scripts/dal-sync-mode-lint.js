#!/usr/bin/env node
/**
 * Gap 1 (A3) — Firestore / GAS sync-mode structural lint.
 *
 * Detection only (no runtime behavior). Guards FRAGILE never-dos #10/#11:
 *   #10 Apply GAS getProjectAssets fixtures while dalPaLiveSyncMode === 'firestore'
 *   #11 Fall back live flush to saveProjectAssets / saveTimelineData in firestore mode
 *
 * Run: node scripts/dal-sync-mode-lint.js
 * Wired: pre-ship/dal.js when DAL hot paths change.
 *
 * Allowlist a call site with a same-line or previous-line comment:
 *   // DAL-SYNC-MODE-ALLOW: <reason>
 */
'use strict';

var fs = require('fs');
var path = require('path');

var ROOT = path.join(__dirname, '..');

var LIVE_CLIENT_FILES = [
  '02e7_Dal_Firestore_Client.html',
  '03a2_Timeline_Dal_Live.html'
];

var APPLY_SCAN_FILES = [
  '02e7_Dal_Firestore_Client.html',
  '02e5_Logic_Sync.html',
  '02a_Project_Equipment.html',
  '03a2_Timeline_Dal_Live.html',
  '03a_Timeline_Boot.html'
];

var ALLOW_RE = /DAL-SYNC-MODE-ALLOW\s*:/;
var FIRESTORE_GUARD_RE = /dalPaLiveSyncMode\s*===\s*['"]firestore['"]\s*\)\s*return|dalTlLiveSyncMode\s*===\s*['"]firestore['"]\s*\)\s*return|shouldApplyGasPaList\s*\(/;
var WRITESEQ_META_RE = /docWriteSeq|\bwriteSeq\s*:/;

function read(rel) {
  var p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, 'utf8');
}

function linesOf(src) {
  return src.split(/\r?\n/);
}

function isCommentLine(line) {
  var t = line.replace(/^\s+/, '');
  return t.indexOf('//') === 0 || t.indexOf('*') === 0 || t.indexOf('<!--') === 0;
}

function hasAllowNear(lines, idx) {
  if (ALLOW_RE.test(lines[idx] || '')) return true;
  if (idx > 0 && ALLOW_RE.test(lines[idx - 1] || '')) return true;
  return false;
}

function windowLines(lines, idx, beforeCount) {
  var start = Math.max(0, idx - beforeCount);
  return lines.slice(start, idx + 1).join('\n');
}

function fail(msg) {
  console.error('FAIL:', msg);
  return 1;
}

function lintLiveClientNoSheetsSave() {
  var failures = 0;
  LIVE_CLIENT_FILES.forEach(function (rel) {
    var src = read(rel);
    if (!src) {
      failures += fail('missing ' + rel);
      return;
    }
    var lines = linesOf(src);
    lines.forEach(function (line, i) {
      if (isCommentLine(line)) return;
      if (!/\b(saveProjectAssets|saveTimelineData)\s*\(/.test(line)) return;
      if (hasAllowNear(lines, i)) return;
      var which = /saveProjectAssets/.test(line) ? 'saveProjectAssets' : 'saveTimelineData';
      failures += fail(
        rel + ':' + (i + 1) +
        ' — ' + which + '() in live client module (FRAGILE #11). ' +
        'Use Firestore patch flush, or mark // DAL-SYNC-MODE-ALLOW: reason'
      );
    });
  });
  return failures;
}

function lintGasApplyGuarded() {
  var failures = 0;
  APPLY_SCAN_FILES.forEach(function (rel) {
    var src = read(rel);
    if (!src) return;
    var lines = linesOf(src);
    lines.forEach(function (line, i) {
      if (isCommentLine(line)) return;
      var isPaGas =
        /dalApplyRemotePaAssets(?:Now)?_\s*\(/.test(line) &&
        /res(?:2)?\.current/.test(line);
      var isTlGas =
        /dalApplyRemoteTimelineState_\s*\(/.test(line) &&
        /\bdata\.(shifts|phases)/.test(line);
      if (!isPaGas && !isTlGas) return;
      if (hasAllowNear(lines, i)) return;
      var before = windowLines(lines, i, 40);
      var after = lines.slice(i, Math.min(lines.length, i + 8)).join('\n');
      if (FIRESTORE_GUARD_RE.test(before)) return;
      if (WRITESEQ_META_RE.test(after) || WRITESEQ_META_RE.test(before)) return;
      var kind = isPaGas ? 'PA GAS list → dalApplyRemotePa*' : 'Timeline GAS → dalApplyRemoteTimelineState_';
      failures += fail(
        rel + ':' + (i + 1) +
        ' — ' + kind + ' without firestore-mode early return or writeSeq/docWriteSeq ' +
        '(FRAGILE #10). Add mode guard or // DAL-SYNC-MODE-ALLOW: reason'
      );
    });
  });
  return failures;
}

function lintCoreSeamHelper() {
  var failures = 0;
  var corePath = path.join(ROOT, 'scripts/lib/dal-pa-live-sync-core.js');
  if (!fs.existsSync(corePath)) {
    return fail('missing scripts/lib/dal-pa-live-sync-core.js');
  }
  var core;
  try {
    core = require(corePath);
  } catch (e) {
    return fail('cannot load dal-pa-live-sync-core.js: ' + (e && e.message));
  }
  if (typeof core.shouldApplyGasPaList !== 'function') {
    failures += fail('core.shouldApplyGasPaList missing (Case H / Gap 1 prerequisite)');
  } else {
    if (core.shouldApplyGasPaList({ liveSyncMode: 'firestore' }) !== false) {
      failures += fail('shouldApplyGasPaList must reject liveSyncMode=firestore');
    }
    if (core.shouldApplyGasPaList({ liveSyncMode: '' }) !== true) {
      failures += fail('shouldApplyGasPaList must allow empty mode (pre-live)');
    }
  }
  return failures;
}

function lintFlushNoGasFallback() {
  var failures = 0;
  var specs = [
    { file: '02e7_Dal_Firestore_Client.html', markers: ['dalFlushPaIfPrepOpen_'], ban: /\bsaveProjectAssets\s*\(/ },
    { file: '03a2_Timeline_Dal_Live.html', markers: ['dalFlushTimeline', 'dalWriteTimeline'], ban: /\bsaveTimelineData\s*\(/ }
  ];
  specs.forEach(function (spec) {
    var src = read(spec.file);
    if (!src) return;
    var lines = linesOf(src);
    var inFn = false;
    var depthHint = 0;
    lines.forEach(function (line, i) {
      for (var m = 0; m < spec.markers.length; m++) {
        if (line.indexOf(spec.markers[m]) >= 0 && /function\s*\(|=\s*function/.test(line)) {
          inFn = true;
          depthHint = 0;
        }
      }
      if (!inFn) return;
      if (line.indexOf('{') >= 0) depthHint++;
      if (line.indexOf('}') >= 0) depthHint--;
      if (isCommentLine(line)) {
        if (depthHint <= 0 && i > 0) inFn = false;
        return;
      }
      if (spec.ban.test(line) && !hasAllowNear(lines, i)) {
        failures += fail(
          spec.file + ':' + (i + 1) +
          ' — live flush path must not call Sheets save (FRAGILE #11)'
        );
      }
      // End function when we hit a new top-level window. assignment after braces settle
      if (depthHint <= 0 && /^\s*window\.\w+\s*=/.test(line) && line.indexOf(spec.markers[0]) < 0) {
        inFn = false;
      }
    });
  });
  return failures;
}

function main() {
  console.log('=== DAL sync-mode lint (Gap 1 / A3) ===\n');
  var failures = 0;
  failures += lintCoreSeamHelper();
  failures += lintLiveClientNoSheetsSave();
  failures += lintFlushNoGasFallback();
  failures += lintGasApplyGuarded();

  if (failures) {
    console.error('\nSync-mode lint FAILED (' + failures + ' finding(s)).');
    console.error('See docs/ai/active/dal-pre-ship-gates.md § Gap 1 · FRAGILE #10/#11.');
    process.exit(1);
  }
  console.log('OK: live clients ban Sheets save; GAS→apply paths guarded; Case H helper intact.');
  process.exit(0);
}

main();
