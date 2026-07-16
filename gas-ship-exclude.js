/**
 * Root/dist .js files that must never ship to Apps Script.
 * Shared by build.js, pre-ship, and check-google-account.js.
 */
const NODE_ONLY = require('./gas-node-only');

const TEMP_DEBUG_PREFIXES = ['scratch_', 'temp_', '_tmp'];

function isTempOrDebugJsBasename(basename) {
  if (!basename || !/\.js$/i.test(basename)) return false;
  return TEMP_DEBUG_PREFIXES.some((prefix) => basename.startsWith(prefix));
}

/** True for PC-only Node tooling and local debug/scratch scripts. */
function isExcludedFromGasCopy(basename) {
  return NODE_ONLY.has(basename) || isTempOrDebugJsBasename(basename);
}

function listJsFilesInDir(dir) {
  const fs = require('fs');
  const path = require('path');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((name) => {
    const full = path.join(dir, name);
    return fs.statSync(full).isFile() && /\.js$/i.test(name);
  });
}

function findTempDebugJsInDir(dir) {
  return listJsFilesInDir(dir).filter(isTempOrDebugJsBasename);
}

/** PC-only + temp/debug files that must not exist in dist/ before deploy. */
function findForbiddenGasDistJs(dir) {
  return listJsFilesInDir(dir).filter(isExcludedFromGasCopy);
}

/** Remote Apps Script SERVER_JS name (no .js extension) must not be on production. */
function isForbiddenRemoteGasName(gasBasename) {
  const base = String(gasBasename || '');
  if (NODE_ONLY.has(base + '.js') || NODE_ONLY.has(base)) return true;
  return isTempOrDebugJsBasename(base.endsWith('.js') ? base : base + '.js');
}

module.exports = {
  TEMP_DEBUG_PREFIXES,
  isTempOrDebugJsBasename,
  isExcludedFromGasCopy,
  findTempDebugJsInDir,
  findForbiddenGasDistJs,
  isForbiddenRemoteGasName,
};
