/**
 * Regenerate station logic modules from v530 monolith (757bf35) in monolith eval order.
 * Splitting by feature reordered top-level assignments vs the single script — this restores
 * byte-identical concatenation when Index includes follow SEGMENTS below.
 *
 * Run: node scripts/regen-station-split-order.js
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const monoLines = execSync('git show 757bf35:11_Station_Shell.html', { encoding: 'utf8', cwd: root })
  .split(/\r?\n/);

function slice(a, b) {
  return monoLines.slice(a - 1, b).join('\n') + '\n';
}

function writeScript(name, body, head, foot) {
  const out = (head || '') + body + (foot || '');
  fs.writeFileSync(path.join(root, name), out, 'utf8');
  console.log('wrote ' + name + ' (' + out.split(/\r?\n/).length + ' lines)');
}

/** Monolith-order segments (1140–4030 inclusive, gaps attached to following chunk). */
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

SEGMENTS.forEach(function(seg) {
  writeScript(seg.file, slice(seg.a, seg.b), seg.head, seg.foot);
});

// Verify concatenated script body matches monolith 1140–4030
let rebuilt = '';
SEGMENTS.forEach(function(seg) {
  rebuilt += slice(seg.a, seg.b);
});
const orig = monoLines.slice(1139, 4030).join('\n') + '\n';
if (orig !== rebuilt) {
  console.error('VERIFY FAILED: regen does not match monolith script body');
  process.exit(1);
}
console.log('VERIFY OK: regen matches monolith script lines 1140–4030 exactly');
