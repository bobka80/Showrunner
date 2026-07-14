/**
 * Scoped pre-ship pipeline — run only the layers that match changed files (or forced layers).
 *
 * Usage:
 *   node pre-ship.js                    auto-detect from git diff
 *   node pre-ship.js --layers gas       force GAS checks
 *   node pre-ship.js --layers gas,hosting
 *   node pre-ship.js --dry-run          show plan only
 *   node pre-ship.js --list             detect + list, no run
 *
 * Ship hooks (automatic):
 *   milestone.js              → gas (+ clasp deploy checks)
 *   deploy-hosting.js         → hosting (+ gas if GAS files also changed)
 *   build-station-desktop.js  → desktop
 *   build-station-apk.js      → apk (+ hosting if manifest/hosting touched — optional)
 */
const { execSync } = require('child_process');
const fs = require('fs');
const { LAYERS, detectLayers, stationTouched } = require('./detect');
const { runLayer } = require('./layers');
const { evaluateBugbotPolicy } = require('./bugbot-policy');
const { writeReport, printBugbotGate, assertBugbotCleared } = require('./report');

const ROOT = require('path').join(__dirname, '..');

function getChangedFiles() {
  const files = new Set();
  const add = (out) => {
    String(out || '')
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((f) => files.add(f));
  };
  try {
    add(execSync('git diff --name-only HEAD', { cwd: ROOT, encoding: 'utf8' }));
  } catch (e) { /* ignore */ }
  try {
    add(execSync('git diff --cached --name-only', { cwd: ROOT, encoding: 'utf8' }));
  } catch (e) { /* ignore */ }
  return [...files];
}

function parseArgs(argv) {
  const opts = {
    layers: 'auto',
    dryRun: false,
    list: false,
    forDeploy: false,
    label: 'manual',
    changedFiles: null,
  };
  const args = argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--dry-run') opts.dryRun = true;
    else if (a === '--list') opts.list = true;
    else if (a === '--deploy') opts.forDeploy = true;
    else if (a === '--label' && args[i + 1]) opts.label = args[++i];
    else if (a === '--layers' && args[i + 1]) opts.layers = args[++i];
    else if (a === '--bugbot-policy') opts.bugbotPolicyOnly = true;
    else if (a === '--help' || a === '-h') opts.help = true;
  }
  return opts;
}

function normalizeLayers(layers) {
  if (layers === 'auto') return null;
  const raw = Array.isArray(layers) ? layers : String(layers).split(/[,\s]+/);
  const out = [];
  raw.forEach((l) => {
    const k = String(l).trim().toLowerCase();
    if (k && LAYERS.includes(k) && !out.includes(k)) out.push(k);
  });
  return out;
}

function resolveLayers(opts) {
  const changed = opts.changedFiles || getChangedFiles();
  const forced = normalizeLayers(opts.layers);
  if (forced && forced.length) {
    return { layers: forced, changedFiles: changed, mode: 'forced' };
  }
  const detected = detectLayers(changed);
  return { layers: detected, changedFiles: changed, mode: 'auto' };
}

function printHelp() {
  console.log(`
Pre-ship pipeline — scoped integrity checks before Showrunner ships.

  node pre-ship.js                     Auto-detect layers from git diff
  node pre-ship.js --layers gas        Force GAS pipeline only
  node pre-ship.js --layers gas,hosting
  node pre-ship.js --dry-run           Plan only
  node pre-ship.js --list              Show detected layers + changed files
  node pre-ship.js --deploy            Include clasp / deploy gates (GAS)
  node pre-ship.js --bugbot-policy     Print Bugbot gate decision (JSON)

Layers: gas | hosting | desktop | apk

Docs: docs/ai/PRE_SHIP_PIPELINE.md
`);
}

function finalizeReport({ layers, changedFiles, mode, opts, results, mechanicalOk }) {
  const bugbot = evaluateBugbotPolicy({
    changedFiles,
    layers,
    forDeploy: !!opts.forDeploy,
    label: opts.label,
  });
  const report = {
    ok: mechanicalOk && (bugbot.action !== 'require' || process.env.PRE_SHIP_BUGBOT_OK === '1'),
    label: opts.label || 'manual',
    mode,
    layers,
    changedFiles,
    mechanicalOk,
    bugbot,
    results: results || [],
  };
  writeReport(report);
  printBugbotGate(bugbot, opts.label);
  if (mechanicalOk && bugbot.action === 'require') {
    assertBugbotCleared(bugbot, opts.label);
  }
  return report;
}

/**
 * @param {object} opts
 * @param {'auto'|string|string[]} [opts.layers]
 * @param {boolean} [opts.dryRun]
 * @param {boolean} [opts.forDeploy] — clasp + remote orphan check on GAS
 * @param {string} [opts.label]
 * @param {string[]} [opts.changedFiles]
 */
function runPreShip(opts = {}) {
  if (opts.help) {
    printHelp();
    return { ok: true, layers: [], skipped: true };
  }

  const { layers, changedFiles, mode } = resolveLayers(opts);

  console.log('\n=== Pre-ship pipeline ===');
  console.log(`Context: ${opts.label || 'manual'} · mode: ${mode}`);
  if (changedFiles.length) {
    console.log(`Changed files (${changedFiles.length}):`);
    changedFiles.slice(0, 24).forEach((f) => console.log(`  · ${f}`));
    if (changedFiles.length > 24) console.log(`  … +${changedFiles.length - 24} more`);
  } else {
    console.log('Changed files: (none vs HEAD — clean working tree)');
  }

  if (!layers.length) {
    console.log('\nPre-ship: no layers apply to this change set — OK (nothing to verify).\n');
    const report = finalizeReport({
      layers: [],
      changedFiles,
      mode,
      opts,
      results: [],
      mechanicalOk: true,
    });
    return { ok: report.ok, layers: [], skipped: true, bugbot: report.bugbot };
  }

  console.log(`\nLayers to run: ${layers.join(' → ')}`);

  if (opts.bugbotPolicyOnly) {
    const bugbot = evaluateBugbotPolicy({
      changedFiles,
      layers,
      forDeploy: !!opts.forDeploy,
      label: opts.label,
    });
    console.log(JSON.stringify({ layers, changedFiles, bugbot }, null, 2));
    return { ok: true, layers, bugbotPolicyOnly: true, bugbot };
  }

  if (opts.dryRun || opts.list) {
    const bugbot = evaluateBugbotPolicy({
      changedFiles,
      layers,
      forDeploy: !!opts.forDeploy,
      label: opts.label,
    });
    printBugbotGate(bugbot, opts.label);
    console.log(opts.dryRun ? '\n(dry-run — not executing)\n' : '\n(list only)\n');
    return { ok: true, layers, dryRun: true, changedFiles, bugbot };
  }

  const ctx = {
    forDeploy: !!opts.forDeploy,
    changedFiles,
    stationTouched: stationTouched(changedFiles),
  };

  const results = [];
  for (const layer of layers) {
    results.push({ layer, ...runLayer(layer, ctx) });
  }

  const report = finalizeReport({
    layers,
    changedFiles,
    mode,
    opts,
    results,
    mechanicalOk: true,
  });

  console.log('\n=== Pre-ship GREEN ===');
  console.log(`Passed: ${layers.join(', ')}`);
  console.log('See docs/ai/PRE_SHIP_PIPELINE.md § Post-ship smoke card.\n');
  return {
    ok: report.ok,
    layers,
    results,
    changedFiles,
    bugbot: report.bugbot,
    reportPath: require('./report').REPORT_PATH,
  };
}

function main() {
  const opts = parseArgs(process.argv);
  if (opts.help) {
    printHelp();
    process.exit(0);
  }
  try {
    const res = runPreShip({
      layers: opts.layers,
      dryRun: opts.dryRun,
      list: opts.list,
      forDeploy: opts.forDeploy,
      label: opts.label,
      changedFiles: opts.changedFiles,
    });
    process.exit(res.ok ? 0 : 1);
  } catch (e) {
    console.error('\n=== Pre-ship RED ===');
    console.error(e.message || e);
    if (e.code === 'BUGBOT_REQUIRED') {
      console.error('\nRun Bugbot review, then re-ship with PRE_SHIP_BUGBOT_OK=1\n');
    } else {
      console.error('\nFix the issue above, then re-run: node pre-ship.js\n');
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { runPreShip, getChangedFiles, resolveLayers, normalizeLayers, LAYERS, main };
module.exports.evaluateBugbotPolicy = require('./bugbot-policy').evaluateBugbotPolicy;
module.exports.readReport = require('./report').readReport;
