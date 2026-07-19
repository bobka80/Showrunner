#!/usr/bin/env node
/**
 * H0 / H5 gate: every function that mutates `currentProjectAssets` must call
 * dalPaNoteTouch_ / dalPaNoteDelete_ (or an allowlisted helper that does),
 * unless explicitly allowlisted with a reason (debt tracked for hub A2 / H5).
 *
 * Run: node scripts/dal-mutation-inventory-check.js
 * Exit 1 on unknown mutators or required paths missing notes.
 */
'use strict';

var fs = require('fs');
var path = require('path');

var ROOT = path.join(__dirname, '..');
var PA_FILE = path.join(ROOT, '02e2_Logic_CRUD.html');

/**
 * Live-prep fixture mutators that MUST note touch/delete (or call insertIntoProjectAssets).
 * Adding a new name here without notes in the body fails the gate.
 */
var MUST_NOTE = [
  'insertIntoProjectAssets',
  'deleteSelectedPa',
  'modifyPaIndices',
  'removePaIndices',
  'updateAssignedQty',
  'removeFormulaGroup',
  'updateConsumableUsage',
  'updatePaQtyGeneric',
  'removePaGeneric',
  'removePaGroup',
  'removePa',
  'addPa',
  'addPaGroup',
  'addSelectedVaultPa',
  'updateLocationName',
  'toggleGroupShortage',
  'updateFormulaInline',
  'cancelFormulaEdit'
];

/**
 * Mutators that change the array but are not live fixture paths (or local shells).
 * Keep this list small — each entry needs a product reason.
 */
var ALLOWLIST = {
  createNewSublistPa: 'local DUMMY empty-group shell — no uid until real fixtures added',
  updateFormulaDept: 'overrideDept not in live FS fixture schema/sigs yet — Sheets-only until field added'
};

var MUTATE_RE = /currentProjectAssets\s*=|currentProjectAssets\.(push|splice|unshift|pop|shift)\s*\(|currentProjectAssets\.forEach\s*\(/;
/** Direct notes, insert helper (notes), or wrappers that only call addPa (which inserts). */
var NOTE_RE = /dalPaNote(Touch|Delete)_|insertIntoProjectAssets\s*\(|\baddPa\s*\(/;

function extractTopLevelFunctions(src) {
  var out = [];
  var re = /(?:window\.(\w+)\s*=\s*function|function\s+(\w+))\s*\(/g;
  var m;
  var matches = [];
  while ((m = re.exec(src))) {
    matches.push({ name: m[1] || m[2], index: m.index });
  }
  for (var i = 0; i < matches.length; i++) {
    var start = matches[i].index;
    var end = i + 1 < matches.length ? matches[i + 1].index : src.length;
    var body = src.slice(start, end);
    out.push({ name: matches[i].name, body: body });
  }
  return out;
}

function main() {
  if (!fs.existsSync(PA_FILE)) {
    console.error('FAIL: missing', PA_FILE);
    process.exit(1);
  }
  var src = fs.readFileSync(PA_FILE, 'utf8');
  var fns = extractTopLevelFunctions(src);
  var byName = {};
  fns.forEach(function (f) { byName[f.name] = f; });

  var errors = [];
  var reported = {};

  MUST_NOTE.forEach(function (name) {
    var f = byName[name];
    if (!f) {
      errors.push('MUST_NOTE missing function: ' + name);
      return;
    }
    var mutatesOrChains = MUTATE_RE.test(f.body) || /insertIntoProjectAssets\s*\(|\baddPa\s*\(/.test(f.body);
    if (!mutatesOrChains) {
      errors.push(name + ': listed MUST_NOTE but no currentProjectAssets mutate / forEach / insert / addPa call found');
    }
    if (!NOTE_RE.test(f.body)) {
      errors.push(name + ': mutates fixtures but no dalPaNoteTouch_/dalPaNoteDelete_/insertIntoProjectAssets/addPa');
    }
    reported[name] = true;
  });

  fns.forEach(function (f) {
    if (reported[f.name]) return;
    if (!MUTATE_RE.test(f.body)) return;
    if (ALLOWLIST[f.name]) {
      console.log('ALLOW:', f.name, '—', ALLOWLIST[f.name]);
      return;
    }
    if (NOTE_RE.test(f.body)) {
      console.log('OK (noted, not in MUST_NOTE list):', f.name);
      return;
    }
    errors.push(
      'Unknown mutator without notes: ' + f.name +
      ' — add dalPaNote* calls, or ALLOWLIST with reason (H5 debt)'
    );
  });

  Object.keys(ALLOWLIST).forEach(function (name) {
    if (!byName[name]) {
      errors.push('ALLOWLIST stale — function not found: ' + name);
    }
  });

  console.log('\n=== DAL PA mutation inventory ===');
  console.log('Scanned:', path.relative(ROOT, PA_FILE));
  console.log('MUST_NOTE:', MUST_NOTE.length, '| ALLOWLIST:', Object.keys(ALLOWLIST).length);

  if (errors.length) {
    errors.forEach(function (e) { console.error('FAIL:', e); });
    console.error('\nMutation inventory FAILED');
    process.exit(1);
  }
  console.log('Mutation inventory OK (PA)');
  process.exit(0);
}

main();
