/**
 * Regenerate station shell modules from the live monolith in monolith document order.
 * Logic segments preserve eval order (Core/RFID interleaved; Init last).
 *
 * Run: node scripts/regen-station-split-order.js
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const monoPath = path.join(root, '11_Station_Shell.html');
const monoLines = fs.readFileSync(monoPath, 'utf8').split(/\r?\n/);

function slice(a, b) {
  return monoLines.slice(a - 1, b).join('\n') + '\n';
}

function writeFile(name, content) {
  fs.writeFileSync(path.join(root, name), content, 'utf8');
  console.log('wrote ' + name + ' (' + content.split(/\r?\n/).length + ' lines)');
}

/** Markup + CSS — same order as monolith lines 1–1137. */
const MARKUP = [
  { file: '11b_Station_Styles.html', a: 1, b: 876, head: '', foot: '' },
  { file: '11j_Station_Phone_UI.html', a: 877, b: 926, head: '<!-- @INDEX: STATION -> Phone sled shell markup -->\n', foot: '' },
  { file: '11i_Station_Settings.html', a: 927, b: 1070, head: '<!-- @INDEX: STATION -> Settings overlay markup -->\n', foot: '' },
  { file: '11h_Station_Project.html', a: 1071, b: 1081, head: '<!-- @INDEX: STATION -> Project picker markup -->\n', foot: '' },
  { file: '11f_Station_Vault.html', a: 1082, b: 1137, head: '<!-- @INDEX: STATION -> Vault overlay markup -->\n', foot: '' },
];

/** Logic — monolith script lines 1140–4030 in eval order. */
const SEGMENTS = [
  { file: '11c_Station_Core.html', a: 1140, b: 1315, head: '<!-- @INDEX: STATION -> Core host session, RBAC (1/5) -->\n<script>\n', foot: '</script>\n' },
  { file: '11d_Station_Rfid.html', a: 1316, b: 1440, head: '<!-- @INDEX: STATION -> RFID helpers (1/3) -->\n<script>\n', foot: '</script>\n' },
  { file: '11c_Station_Core_2.html', a: 1441, b: 2038, head: '<!-- @INDEX: STATION -> Per-station settings keys + shell helpers (2/5) -->\n<script>\n', foot: '</script>\n' },
  { file: '11d_Station_Rfid_2.html', a: 2039, b: 2111, head: '<!-- @INDEX: STATION -> Live scan feed (2/3) -->\n<script>\n', foot: '</script>\n' },
  { file: '11c_Station_Core_3.html', a: 2112, b: 2200, head: '<!-- @INDEX: STATION -> Shell state renderer (3/5) -->\n<script>\n', foot: '</script>\n' },
  { file: '11d_Station_Rfid_3.html', a: 2201, b: 2456, head: '<!-- @INDEX: STATION -> RFID scan routing + host login (3/3) -->\n<script>\n', foot: '</script>\n' },
  { file: '11h_Station_Project_Logic.html', a: 2457, b: 2466, head: '<!-- @INDEX: STATION -> Project picker logic (1/2) -->\n<script>\n', foot: '</script>\n' },
  { file: '11g_Station_Vault.html', a: 2467, b: 2555, head: '<!-- @INDEX: STATION -> Vault equipment rollup (1/2) -->\n<script>\n', foot: '</script>\n' },
  { file: '11e_Station_ScanPanel.html', a: 2556, b: 2906, head: '<!-- @INDEX: STATION -> Scan panel UI + status actions -->\n<script>\n', foot: '</script>\n' },
  { file: '11g_Station_Vault_2.html', a: 2907, b: 3244, head: '<!-- @INDEX: STATION -> Vault record RFID (2/2) -->\n<script>\n', foot: '</script>\n' },
  { file: '11g_Station_Vault_Crew.html', a: 3245, b: 3349, head: '<!-- @INDEX: STATION -> Vault crew tab ROOT badge enroll -->\n<script>\n', foot: '</script>\n' },
  { file: '11h_Station_Project_Logic_2.html', a: 3350, b: 3488, head: '<!-- @INDEX: STATION -> Project picker logic (2/2) -->\n<script>\n', foot: '</script>\n' },
  { file: '11c_Station_Core_4.html', a: 3489, b: 3518, head: '<!-- @INDEX: STATION -> Eject grace UI (4/5) -->\n<script>\n', foot: '</script>\n' },
  { file: '11i_Station_Settings_Logic.html', a: 3519, b: 3896, head: '<!-- @INDEX: STATION -> Settings + gun config sync -->\n<script>\n', foot: '</script>\n' },
  { file: '11c_Station_Init.html', a: 3897, b: 4030, head: '<!-- @INDEX: STATION -> Bootstrap init (5/5) — must stay last in logic chain -->\n<script>\n', foot: '</script>\n' },
];

/** Index include order for Phase A (no 11k/11l — Phase B only). */
const INDEX_INCLUDES = [
  '11b_Station_Styles',
  '11j_Station_Phone_UI',
  '11i_Station_Settings',
  '11h_Station_Project',
  '11f_Station_Vault',
].concat(SEGMENTS.map(function(s) { return s.file.replace('.html', ''); }));

MARKUP.forEach(function(seg) {
  writeFile(seg.file, seg.head + slice(seg.a, seg.b) + seg.foot);
});

SEGMENTS.forEach(function(seg) {
  writeFile(seg.file, seg.head + slice(seg.a, seg.b) + seg.foot);
});

let rebuiltMarkup = '';
MARKUP.forEach(function(seg) { rebuiltMarkup += slice(seg.a, seg.b); });
const origMarkup = monoLines.slice(0, 1137).join('\n') + '\n';
if (origMarkup !== rebuiltMarkup) {
  console.error('VERIFY FAILED: markup regen does not match monolith lines 1–1137');
  process.exit(1);
}

let rebuiltLogic = '';
SEGMENTS.forEach(function(seg) { rebuiltLogic += slice(seg.a, seg.b); });
const origLogic = monoLines.slice(1139, 4030).join('\n') + '\n';
if (origLogic !== rebuiltLogic) {
  console.error('VERIFY FAILED: logic regen does not match monolith script lines 1140–4030');
  process.exit(1);
}

console.log('VERIFY OK: markup lines 1–1137 match monolith');
console.log('VERIFY OK: logic lines 1140–4030 match monolith');
console.log('Index include order (' + INDEX_INCLUDES.length + ' modules):');
INDEX_INCLUDES.forEach(function(name) { console.log('  ' + name); });
