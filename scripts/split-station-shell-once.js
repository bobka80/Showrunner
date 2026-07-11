/**
 * Mechanical split of 11_Station_Shell.html — zero logic changes.
 * Structure map: docs/ai/active/station-shell-structure-map.md
 *
 * Run once from repo root: node scripts/split-station-shell-once.js
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

// 11c: slice 2 = 1441–1915 (not 1447–1905) — full Per-station settings block + time/toast helpers
w('11c_Station_Core.html', parts([[1140, 1315], [1441, 1915], [1916, 2038], [2113, 2200], [3490, 3518], [3898, 4030]]),
  '<!-- @INDEX: STATION -> Core host session, RBAC, bootstrap init -->\n<script>\n',
  '</script>\n');

// 11d: ends 1440 (not 1446) — no overlap with 11c Per-station settings comment
w('11d_Station_Rfid.html', parts([[1316, 1440], [2040, 2111], [2202, 2456]]),
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

// Phase B scaffolds — behavior-neutral (no-op until stationActiveUiSkin_ ships in Phase B)
w('11k_Station_Dock_UI.html', `<!-- @INDEX: STATION -> Dock panel shell (gate PC, high-res tablet) — scaffold for UI rework -->
<style>
#station-dock-shell {
  display: none;
  position: fixed;
  inset: 0;
  z-index: 49999;
  pointer-events: none;
}
html.station-dock-root #station-dock-shell {
  display: block;
}
html.station-dock-root #station-shell {
  /* Phone sled chrome hidden when dock skin active — Phase B will refine layout. */
}
#station-dock-scan-rail {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: calc(280px * var(--station-ui-scale, 1));
  pointer-events: auto;
  display: none;
}
#station-dock-eject-host {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: none;
  pointer-events: auto;
}
</style>
<div id="station-dock-shell" aria-hidden="true">
  <aside id="station-dock-scan-rail" aria-label="Live scans"></aside>
  <div id="station-dock-eject-host"></div>
</div>
<script>
(function stationDockUiBootstrap_() {
  if (!window.IS_STATION_DEVICE) return;
  function applyDockRoot_() {
    if (typeof window.stationActiveUiSkin_ !== 'function') return;
    if (window.stationActiveUiSkin_() !== 'dock_panel') return;
    document.documentElement.classList.add('station-dock-root');
  }
  document.addEventListener('DOMContentLoaded', applyDockRoot_);
  window.stationRefreshDockUiSkin_ = applyDockRoot_;
})();
</script>
`);

w('11l_Station_Dock_Scale.html', `<!-- @INDEX: STATION -> Dock panel UI scale (magnification presets) -->
<style>
html.station-dock-root {
  --station-ui-scale: 1;
}
html.station-dock-root[data-ui-scale="125"] { --station-ui-scale: 1.25; }
html.station-dock-root[data-ui-scale="150"] { --station-ui-scale: 1.5; }
html.station-dock-root[data-ui-scale="175"] { --station-ui-scale: 1.75; }
</style>
<script>
(function stationDockScaleInit_() {
  var KEY = 'sm_station_ui_scale';
  var PRESETS = { '100': 1, '125': 1.25, '150': 1.5, '175': 1.75 };

  window.stationUiScalePreset_ = function() {
    try {
      var v = localStorage.getItem(KEY);
      return (v && PRESETS[v]) ? v : '100';
    } catch (e) { return '100'; }
  };

  window.stationApplyUiScale_ = function(preset) {
    var p = String(preset || '100');
    if (!PRESETS[p]) p = '100';
    try { localStorage.setItem(KEY, p); } catch (e) { /* ignore */ }
    if (typeof window.stationActiveUiSkin_ === 'function' &&
        window.stationActiveUiSkin_() === 'dock_panel') {
      document.documentElement.setAttribute('data-ui-scale', p);
    }
  };

  if (window.IS_STATION_DEVICE) {
    document.addEventListener('DOMContentLoaded', function() {
      window.stationApplyUiScale_(window.stationUiScalePreset_());
    });
  }
})();
</script>
`);

fs.writeFileSync(path.join(root, '11_Station_Shell.html'),
`<!--
  Station shell — split into 11b–11l modules (Phase A, behavior-neutral).
  Wired from Index.html. Do not add logic here.
  See docs/ai/active/station-shell-structure-map.md and docs/ai/FILE_MAP.md §11
-->
`, 'utf8');
console.log('11_Station_Shell.html: stub');

console.log('Split complete.');
