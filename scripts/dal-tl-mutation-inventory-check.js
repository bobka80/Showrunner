#!/usr/bin/env node
/**
 * H5 timeline twin: every function that mutates live fork entities
 * (shifts / activePhases / localDeptOverrides) must call dalTlNote* helpers,
 * unless explicitly allowlisted.
 *
 * Run: node scripts/dal-tl-mutation-inventory-check.js
 */
'use strict';

var fs = require('fs');
var path = require('path');

var ROOT = path.join(__dirname, '..');
var TL_FILES = [
  '03b_Timeline_Shifts.html',
  '03c_Timeline_Phases.html',
  '03d_Timeline_Crew.html',
  '03e_Timeline_UX.html'
];

var MUST_NOTE = [
  'addShift',
  'removeShift',
  'endDrag',
  'setRole',
  'addPhaseFromClick',
  'endPhaseDrag',
  'setPhaseType',
  'applyDeptOverride',
  'openNoteModal',
  'toggleIndicatorState',
  'changeCrewModalDept',
  'cancelCrewManager'
];

/**
 * Mutates geometry during drag / entities outside fork capture — notes commit elsewhere.
 */
var ALLOWLIST = {
  onDrag: 'live drag preview — notes on endDrag',
  onPhaseDrag: 'live drag preview — notes on endPhaseDrag',
  onSubEventDrag: 'activeSubEvents not in timeline fork capture'
};

/** Structural array/map writes, or live fork field assignments on entities. */
var MUTATE_RE =
  /\bshifts\s*=(?!=)|\bshifts\.(push|splice|unshift|pop|shift)\s*\(|\bactivePhases\s*=(?!=)|\bactivePhases\.(push|splice|unshift|pop|shift)\s*\(|\blocalDeptOverrides\s*=(?!=)|\blocalDeptOverrides\s*\[[^\]]+\]\s*=(?!=)|\.(note|hasArrow|role|start|duration|type)\s*=(?!=)/;

var NOTE_RE =
  /dalTlNote(ShiftTouch_|ShiftDelete_|PhaseTouch_|PhaseDelete_|OverrideTouch_)/;

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
    out.push({ name: matches[i].name, body: src.slice(start, end) });
  }
  return out;
}

function main() {
  var errors = [];
  var reported = {};
  var byName = {};
  var totalFns = 0;

  TL_FILES.forEach(function (rel) {
    var file = path.join(ROOT, rel);
    if (!fs.existsSync(file)) {
      errors.push('missing timeline file: ' + rel);
      return;
    }
    var src = fs.readFileSync(file, 'utf8');
    // Anonymous Delete/Backspace handler must still note deletes.
    if (rel === '03e_Timeline_UX.html') {
      if (!/Delete|Backspace/.test(src) || !/dalTlNoteShiftDelete_/.test(src) || !/dalTlNotePhaseDelete_/.test(src)) {
        errors.push('03e keydown Delete/Backspace path missing dalTlNoteShiftDelete_/dalTlNotePhaseDelete_');
      }
    }
    extractTopLevelFunctions(src).forEach(function (f) {
      totalFns++;
      if (!byName[f.name]) byName[f.name] = { name: f.name, body: f.body, file: rel };
      else byName[f.name].body += '\n' + f.body;
    });
  });

  MUST_NOTE.forEach(function (name) {
    var f = byName[name];
    if (!f) {
      errors.push('MUST_NOTE missing function: ' + name);
      return;
    }
    if (!MUTATE_RE.test(f.body) && name !== 'openNoteModal') {
      // openNoteModal mutates via nested commitNote — still require notes in body
      if (!NOTE_RE.test(f.body)) {
        errors.push(name + ': MUST_NOTE but no fork mutate pattern and no dalTlNote*');
      }
    } else if (!NOTE_RE.test(f.body)) {
      errors.push(name + ': mutates fork entities but no dalTlNote*');
    }
    reported[name] = true;
  });

  Object.keys(byName).forEach(function (name) {
    if (reported[name]) return;
    var f = byName[name];
    if (!MUTATE_RE.test(f.body)) return;
    if (ALLOWLIST[name]) {
      console.log('ALLOW:', name, '—', ALLOWLIST[name]);
      return;
    }
    if (NOTE_RE.test(f.body)) {
      console.log('OK (noted, not in MUST_NOTE list):', name, '(' + f.file + ')');
      return;
    }
    errors.push(
      'Unknown timeline mutator without notes: ' + name +
      ' (' + f.file + ') — add dalTlNote* or ALLOWLIST with reason'
    );
  });

  Object.keys(ALLOWLIST).forEach(function (name) {
    if (!byName[name]) {
      errors.push('ALLOWLIST stale — function not found: ' + name);
    }
  });

  console.log('\n=== DAL timeline mutation inventory ===');
  console.log('Scanned:', TL_FILES.join(', '));
  console.log('Functions:', totalFns, '| MUST_NOTE:', MUST_NOTE.length, '| ALLOWLIST:', Object.keys(ALLOWLIST).length);

  if (errors.length) {
    errors.forEach(function (e) { console.error('FAIL:', e); });
    console.error('\nTimeline mutation inventory FAILED');
    process.exit(1);
  }
  console.log('Mutation inventory OK (timeline)');
  process.exit(0);
}

main();
