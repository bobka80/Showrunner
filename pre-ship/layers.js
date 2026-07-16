/**
 * Layer runners — each returns { ok, steps }.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { findTempDebugJsInDir, findForbiddenGasDistJs } = require('../gas-ship-exclude');
const { dalTouched, runDalGates } = require('./dal');

const ROOT = path.join(__dirname, '..');

function runNode(script, label) {
  const rel = script.replace(/\\/g, '/');
  console.log(`  → ${label || rel}`);
  execSync(`node "${path.join(ROOT, script)}"`, { cwd: ROOT, stdio: 'inherit' });
}

function fail(msg) {
  const err = new Error(msg);
  err.preShip = true;
  throw err;
}

function scanGasShipSafety({ afterBuild }) {
  const dist = path.join(ROOT, 'dist');

  const rootScratch = findTempDebugJsInDir(ROOT);
  if (rootScratch.length) {
    fail(
      `Repo root has debug/scratch .js files — delete before ship: ${rootScratch.join(', ')}`
    );
  }

  if (!afterBuild) return;

  if (!fs.existsSync(dist)) fail('dist/ missing — build did not produce output');
  const leaked = findForbiddenGasDistJs(dist);
  if (leaked.length) {
    fail(
      `dist/ contains files that must not ship to Apps Script: ${leaked.join(', ')} ` +
        '(require is not defined on GAS). Run node build.js and remove the source file.'
    );
  }
}

function readHostBootCacheVersion(indexHtml) {
  const m = String(indexHtml || '').match(/host-boot\.js\?v=(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

function runGasLayer({ forDeploy, changedFiles, stationTouched }) {
  console.log('\n── GAS layer (Apps Script / PWA iframe payload) ──');
  const steps = [];

  steps.push('gas-ship-safety-root');
  scanGasShipSafety({ afterBuild: false });
  console.log('  → root scratch/debug scan OK');

  steps.push('build');
  require(path.join(ROOT, 'build.js'));

  steps.push('parse-payload');
  runNode('scripts/parse-check-payload.js', 'parse compiled LogicPayload chunks');

  if (stationTouched) {
    steps.push('verify-station-split');
    runNode('scripts/verify-station-split.js', 'station module split gates');
  } else {
    console.log('  → skip verify-station-split (no station files in this change set)');
  }

  if (dalTouched(changedFiles)) {
    const dal = runDalGates({ forDeploy });
    steps.push(...dal.steps);
  } else {
    console.log('  → skip DAL gates (no DAL hot-path files in this change set)');
  }

  steps.push('gas-ship-safety-dist');
  scanGasShipSafety({ afterBuild: true });
  console.log('  → dist/ GAS ship safety scan OK');

  if (forDeploy) {
    steps.push('check-google-account');
    runNode('check-google-account.js', 'clasp account + remote orphan guard');
  }

  return { ok: true, steps };
}

function runHostingLayer({ changedFiles }) {
  console.log('\n── Hosting layer (Firebase PWA shell / web.app) ──');
  const steps = [];
  const hostBoot = path.join(ROOT, 'push-hosting', 'public', 'host-boot.js');
  const indexHtml = path.join(ROOT, 'push-hosting', 'public', 'index.html');

  if (!fs.existsSync(hostBoot)) fail('Missing push-hosting/public/host-boot.js');
  if (!fs.existsSync(indexHtml)) fail('Missing push-hosting/public/index.html');

  steps.push('parse-host-boot');
  try {
    const code = fs.readFileSync(hostBoot, 'utf8');
    new vm.Script(code, { filename: 'host-boot.js' });
  } catch (e) {
    fail(`host-boot.js parse error: ${e.message}`);
  }
  console.log('  → host-boot.js parse OK');

  const hostBootChanged = (changedFiles || []).some((f) =>
    String(f).replace(/\\/g, '/').includes('push-hosting/public/host-boot.js')
  );

  if (hostBootChanged) {
    steps.push('cache-bust');
    const current = fs.readFileSync(indexHtml, 'utf8');
    const workingV = readHostBootCacheVersion(current);
    let committedV = null;
    try {
      const committed = execSync('git show HEAD:push-hosting/public/index.html', {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      committedV = readHostBootCacheVersion(committed);
    } catch (e) {
      /* first commit or file new */
    }
    if (workingV == null) {
      fail('index.html has no host-boot.js?v= — bump cache version before hosting deploy');
    }
    if (committedV != null && workingV <= committedV) {
      fail(
        `host-boot.js changed but index.html cache is still ?v=${workingV}. ` +
          `Bump push-hosting/public/index.html host-boot.js?v= (was ${committedV} on HEAD).`
      );
    }
    console.log(`  → cache-bust OK (host-boot.js?v=${workingV})`);
  } else {
    console.log('  → skip cache-bust check (host-boot.js not in change set)');
  }

  return { ok: true, steps };
}

function runDesktopLayer() {
  console.log('\n── Desktop layer (ShowrunnerStationDesktop EXE) ──');
  const steps = [];
  const ico = path.join(ROOT, 'station-desktop', 'ShowrunnerStationDesktop', 'app.ico');
  const csproj = path.join(ROOT, 'station-desktop', 'ShowrunnerStationDesktop', 'ShowrunnerStationDesktop.csproj');

  steps.push('app.ico');
  if (!fs.existsSync(ico) || fs.statSync(ico).size < 1024) {
    fail('app.ico missing or too small — run station-desktop/scripts/generate-app-icon.ps1');
  }
  console.log('  → app.ico present');

  steps.push('dotnet-build');
  console.log('  → dotnet build Release');
  execSync(`dotnet build "${csproj}" -c Release -v minimal -nologo`, {
    cwd: ROOT,
    stdio: 'inherit',
  });

  return { ok: true, steps };
}

function runApkLayer() {
  console.log('\n── APK layer (station-android) ──');
  const gradle = path.join(ROOT, 'station-android', 'app', 'build.gradle.kts');
  if (!fs.existsSync(gradle)) fail('station-android app module not found');
  console.log('  → APK layer: structure OK (full build via node build-station-apk.js)');
  return { ok: true, steps: ['apk-structure'] };
}

function runLayer(layer, ctx) {
  switch (layer) {
    case 'gas':
      return runGasLayer(ctx);
    case 'hosting':
      return runHostingLayer(ctx);
    case 'desktop':
      return runDesktopLayer();
    case 'apk':
      return runApkLayer();
    default:
      fail(`Unknown layer: ${layer}`);
  }
}

module.exports = { runLayer, runGasLayer, runHostingLayer, runDesktopLayer, runApkLayer };
