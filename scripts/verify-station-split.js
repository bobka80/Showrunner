/**
 * Phase A gates: parse every station module, byte-compare concat vs monolith.
 * Run after regen and before milestone: node scripts/verify-station-split.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const root = path.join(__dirname, '..');

const MARKUP_FILES = [
  '11b_Station_Styles.html',
  '11j_Station_Phone_UI.html',
  '11i_Station_Settings.html',
  '11h_Station_Project.html',
  '11f_Station_Vault.html',
];

const LOGIC_FILES = [
  '11c_Station_Core.html',
  '11d_Station_Rfid.html',
  '11c_Station_Core_2.html',
  '11d_Station_Rfid_2.html',
  '11c_Station_Core_3.html',
  '11d_Station_Rfid_3.html',
  '11h_Station_Project_Logic.html',
  '11g_Station_Vault.html',
  '11e_Station_ScanPanel.html',
  '11g_Station_Vault_2.html',
  '11g_Station_Vault_Crew.html',
  '11h_Station_Project_Logic_2.html',
  '11c_Station_Core_4.html',
  '11i_Station_Settings_Logic.html',
  '11c_Station_Init.html',
];

const ALL_FILES = MARKUP_FILES.concat(LOGIC_FILES);

function read(p) {
  return fs.readFileSync(path.join(root, p), 'utf8');
}

function extractScriptBodies(content, filename) {
  const bodies = [];
  const re = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(content)) !== null) {
    bodies.push(m[1].replace(/^\n/, ''));
  }
  if (filename.endsWith('_Logic.html') || filename.match(/^11[cdeg]_Station/) || filename === '11e_Station_ScanPanel.html') {
    if (bodies.length !== 1) {
      throw new Error(filename + ': expected exactly 1 <script> block, got ' + bodies.length);
    }
  }
  return bodies;
}

function stripIndexComments(content) {
  return content.replace(/^<!-- @INDEX:[\s\S]*?-->\n?/gm, '');
}

function fail(msg) {
  console.error('\nVERIFY FAILED: ' + msg + '\n');
  process.exit(1);
}

const monoPath = path.join(root, '11_Station_Shell.html');
if (!fs.existsSync(monoPath)) fail('Missing 11_Station_Shell.html monolith reference');

const mono = read('11_Station_Shell.html');
const monoLines = mono.split(/\r?\n/);

if (monoLines.length < 4036) {
  fail('Monolith shorter than expected (' + monoLines.length + ' lines)');
}

console.log('=== Station split verification ===\n');

// Gate 1: parse every logic script block
LOGIC_FILES.forEach(function(f) {
  const raw = read(f);
  const bodies = extractScriptBodies(raw, f);
  bodies.forEach(function(body, i) {
    try {
      new vm.Script(body, { filename: f + '#script' + i });
    } catch (e) {
      fail(f + ' parse error: ' + e.message);
    }
  });
  console.log('parse OK: ' + f);
});

// Gate 2: no orphan block comments that swallow code
LOGIC_FILES.forEach(function(f) {
  const body = extractScriptBodies(read(f), f)[0];
  if (/\/\*[\s\S]*?\*\//.test(body) && body.indexOf('*/') < body.indexOf('window.') && body.trim().startsWith('/**')) {
    // allow normal JSDoc before code — only fail if executable after /** is inside comment
  }
  const lines = body.split('\n');
  let inBlock = false;
  lines.forEach(function(line, idx) {
    if (line.indexOf('/*') >= 0 && line.indexOf('*/') < 0) inBlock = true;
    if (inBlock && /^\s*(window\.|var |let |const |function )/.test(line)) {
      fail(f + ' line ' + (idx + 1) + ': executable code may be inside block comment');
    }
    if (line.indexOf('*/') >= 0) inBlock = false;
  });
});

// Gate 3: rebuild monolith body from modules (strip INDEX comments only)
let rebuiltMarkup = '';
MARKUP_FILES.forEach(function(f) {
  rebuiltMarkup += stripIndexComments(read(f));
});

let rebuiltLogic = '';
LOGIC_FILES.forEach(function(f) {
  rebuiltLogic += extractScriptBodies(read(f), f)[0];
});

const origMarkup = monoLines.slice(0, 1137).join('\n') + '\n';
const origLogic = monoLines.slice(1139, 4036).join('\n') + '\n';

if (origMarkup !== rebuiltMarkup) {
  fail('Markup concat !== monolith lines 1–1137');
}
console.log('concat OK: markup === monolith 1–1137');

if (origLogic !== rebuiltLogic) {
  fail('Logic concat !== monolith script 1140–4036');
}
console.log('concat OK: logic === monolith 1140–4036');

const hash = crypto.createHash('sha256').update(origMarkup + origLogic).digest('hex').slice(0, 16);
console.log('\nGolden hash (markup+logic): ' + hash);
console.log('\nALL GATES PASSED — safe to wire Index and run build.js\n');
