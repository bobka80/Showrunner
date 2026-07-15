/**
 * Map changed repo paths → ship layers (gas | hosting | desktop | apk).
 */
const path = require('path');
const NODE_ONLY = require('../gas-node-only');

const LAYERS = ['gas', 'hosting', 'desktop', 'apk'];

const STATION_PREFIXES = ['11_', '11a_', '11b_', '11c_', '11d_', '11e_', '11f_', '11g_', '11h_', '11i_', '11j_', '11k_', '11m_'];

function norm(p) {
  return String(p || '').replace(/\\/g, '/');
}

function basename(file) {
  return path.basename(norm(file));
}

function isStationFile(file) {
  const base = basename(file);
  return STATION_PREFIXES.some((p) => base.startsWith(p)) || base === '11_Station_Shell.html';
}

function isRootGasHtml(file) {
  const n = norm(file);
  if (n.includes('/')) return false;
  return /\.html$/i.test(n);
}

function isRootGasJs(file) {
  const n = norm(file);
  if (n.includes('/')) return false;
  if (!/\.js$/i.test(n)) return false;
  return !NODE_ONLY.has(basename(n));
}

function classifyFile(file) {
  const n = norm(file);
  if (!n || n.startsWith('docs/') || n.startsWith('.cursor/') || n.startsWith('claude-pack/')) return [];
  if (n.startsWith('cursor-project-template/')) return [];
  if (n.startsWith('stage-desktop-info/')) return [];

  const layers = [];

  if (n.startsWith('push-hosting/')) layers.push('hosting');
  if (n.startsWith('station-desktop/')) layers.push('desktop');
  if (n.startsWith('station-android/')) layers.push('apk');

  if (
    n.startsWith('dist/') ||
    n === 'Index.html' ||
    n === 'appsscript.json' ||
    isRootGasHtml(n) ||
    isRootGasJs(n)
  ) {
    layers.push('gas');
  }

  return layers;
}

function detectLayers(changedFiles) {
  const set = new Set();
  (changedFiles || []).forEach((f) => {
    classifyFile(f).forEach((layer) => set.add(layer));
  });
  return LAYERS.filter((l) => set.has(l));
}

function stationTouched(changedFiles) {
  return (changedFiles || []).some(isStationFile);
}

module.exports = {
  LAYERS,
  norm,
  classifyFile,
  detectLayers,
  stationTouched,
  isStationFile,
  dalTouched: require('./dal').dalTouched,
};
