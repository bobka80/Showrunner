/**
 * Mechanical split of 11_Station_Shell.html — zero logic changes.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const lines = fs.readFileSync(path.join(root, '11_Station_Shell.html'), 'utf8').split(/\r?\n/);

function parts(ranges) {
  return ranges.map(function(r) { return lines.slice(r[0] - 1, r[1]).join('\n'); }).join('\n') + '\n';
}

function w(name, body, head, foot) {
  const out = (head || '') + body + (foot || '');
  fs.writeFileSync(path.join(root, name), out, 'utf8');
  console.log(name + ': ' + out.split(/\r?\n/).length + ' lines');
}

w('11b_Station_Styles.html', parts([[1, 875]]));

w('11j_Station_Phone_UI.html', parts([[877, 925]]),
  '<!-- @INDEX: STATION -> Phone sled shell markup -->\n');

w('11i_Station_Settings.html', parts([[927, 1069]]),
  '<!-- @INDEX: STATION -> Settings overlay markup -->\n');

w('11h_Station_Project.html', parts([[1071, 1080]]),
  '<!-- @INDEX: STATION -> Project picker markup -->\n');

w('11f_Station_Vault.html', parts([[1082, 1137]]),
  '<!-- @INDEX: STATION -> Vault overlay markup -->\n');

w('11c_Station_Core.html', parts([[1139, 1315], [1441, 1915], [1916, 2038], [2113, 2200], [3490, 3518], [3898, 4030]]),
  '<!-- @INDEX: STATION -> Core host session, RBAC, bootstrap init -->\n<script>\n',
  '</script>\n');

w('11d_Station_Rfid.html', parts([[1316, 1446], [2040, 2111], [2202, 2456]]),
  '<!-- @INDEX: STATION -> RFID scan routing, equip map, host login -->\n<script>\n',
  '</script>\n');

w('11h_Station_Project_Logic.html', parts([[2458, 2466], [3351, 3488]]),
  '<!-- @INDEX: STATION -> Project picker logic -->\n<script>\n',
  '</script>\n');

w('11g_Station_Vault.html', parts([[2470, 2555], [2908, 3244]]),
  '<!-- @INDEX: STATION -> Vault equipment rollup, status, record RFID -->\n<script>\n',
  '</script>\n');

w('11e_Station_ScanPanel.html', parts([[2557, 2906]]),
  '<!-- @INDEX: STATION -> Scan panel UI + status actions -->\n<script>\n',
  '</script>\n');

w('11g_Station_Vault_Crew.html', parts([[3245, 3349]]),
  '<!-- @INDEX: STATION -> Vault crew tab ROOT badge enroll -->\n<script>\n',
  '</script>\n');

w('11i_Station_Settings_Logic.html', parts([[3520, 3896]]),
  '<!-- @INDEX: STATION -> Settings + gun config sync -->\n<script>\n',
  '</script>\n');

console.log('Split complete.');
