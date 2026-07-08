/**
 * Prepare Hosting SW config + deploy to Firebase, then VERIFY the live site
 * actually serves the build we just published.
 * Usage: node deploy-hosting.js
 *
 * Hardened against the "stuck after 'Config project …'" hang: the Firebase CLI
 * is run with --non-interactive (+ CI env) so it can NEVER block on a hidden
 * prompt (auth refresh / analytics consent / update notice). A heartbeat prints
 * progress during the long silent upload, and a hard timeout aborts a true hang
 * instead of freezing the terminal forever.
 */
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

const root = path.join(__dirname);
const hostingDir = path.join(root, 'push-hosting');
const manifestPath = path.join(hostingDir, 'public', 'downloads', 'station-manifest.json');
const DEPLOY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes: generous, but never infinite.

function readLocalManifest() {
  try {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (e) {
    return null;
  }
}

function readHostingUrl() {
  if (process.env.SHOWRUNNER_HOSTING_URL) return process.env.SHOWRUNNER_HOSTING_URL.replace(/\/$/, '');
  try {
    const rc = JSON.parse(fs.readFileSync(path.join(hostingDir, '.firebaserc'), 'utf8'));
    const proj = rc.projects && rc.projects.default;
    if (proj) return `https://${proj}.web.app`;
  } catch (e) { /* fall through */ }
  return 'https://sm-showrunner-97405.web.app';
}

function fetchJson(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, json: JSON.parse(data) }); }
        catch (e) { resolve({ status: res.statusCode, json: null }); }
      });
    }).on('error', () => resolve({ status: 0, json: null }));
  });
}

// Run `firebase deploy` so it can never hang on a prompt, with a live heartbeat
// and a hard timeout. Resolves on success, rejects on failure/timeout.
function firebaseDeploy() {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    console.log('\n[deploy] Launching Firebase (non-interactive)…');
    // --non-interactive: fail fast instead of blocking on any prompt (auth refresh,
    // usage-consent). NO_UPDATE_NOTIFIER: kill the update-check that can also stall.
    // We deliberately do NOT set CI=1 — it can change how cached login is resolved
    // and break auth that currently works via `firebase login`.
    const child = spawn(
      'firebase',
      ['deploy', '--only', 'hosting', '--non-interactive'],
      {
        cwd: hostingDir,
        stdio: 'inherit',
        shell: true, // needed so Windows resolves firebase.cmd
        env: { ...process.env, NO_UPDATE_NOTIFIER: '1' },
      }
    );

    const heartbeat = setInterval(() => {
      const s = Math.round((Date.now() - started) / 1000);
      process.stdout.write(`[deploy] …still uploading (${s}s) — Firebase is silent during upload, this is normal.\n`);
    }, 20000);

    const timer = setTimeout(() => {
      clearInterval(heartbeat);
      try { child.kill('SIGKILL'); } catch (e) { /* ignore */ }
      reject(new Error(
        'firebase deploy exceeded 10 minutes and was aborted.\n' +
        '  Almost always an auth problem. In this terminal run:\n' +
        '    firebase login:list      (confirm you are logged in)\n' +
        '    firebase login --reauth  (if not, or if it looks stale)\n' +
        '  then re-run: node deploy-hosting.js'
      ));
    }, DEPLOY_TIMEOUT_MS);

    child.on('error', (e) => {
      clearInterval(heartbeat);
      clearTimeout(timer);
      reject(new Error('Could not start firebase CLI: ' + e.message +
        '\n  Install it with: npm i -g firebase-tools'));
    });
    child.on('exit', (code) => {
      clearInterval(heartbeat);
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(
        'firebase deploy exited with code ' + code + '.\n' +
        '  If this mentions authentication, run: firebase login --reauth'
      ));
    });
  });
}

async function verifyLive() {
  const local = readLocalManifest();
  if (!local) {
    console.warn('\n[verify] No local station-manifest.json — skipping live check.');
    return;
  }
  const base = readHostingUrl();
  const url = `${base}/downloads/station-manifest.json?t=${Date.now()}`;
  console.log(`\n[verify] Checking live manifest: ${url}`);
  for (let attempt = 1; attempt <= 5; attempt++) {
    const { status, json } = await fetchJson(url);
    if (json && String(json.versionCode) === String(local.versionCode)) {
      console.log(`[verify] OK — live site serves v${json.versionName} (build ${json.versionCode}).`);
      return;
    }
    const got = json ? `v${json.versionName} (build ${json.versionCode})` : `HTTP ${status}`;
    if (attempt < 5) {
      console.log(`[verify] attempt ${attempt}: live still shows ${got}, expected build ${local.versionCode} — retrying…`);
      await new Promise((r) => setTimeout(r, 3000));
    } else {
      console.warn(
        `\n[verify] WARNING: after deploy the live site still shows ${got}, ` +
        `but you just published build ${local.versionCode}.\n` +
        `  This is the exact "download page still shows the old version" failure.\n` +
        `  Re-run: node deploy-hosting.js  (and confirm firebase is logged in: firebase login:list)`
      );
      process.exitCode = 2;
    }
  }
}

async function main() {
  console.log('\n=== Firebase Hosting deploy ===\n');
  execSync('node generate-icons.js', { cwd: hostingDir, stdio: 'inherit' });
  execSync('node push-hosting/prepare-hosting.js', { cwd: root, stdio: 'inherit' });
  await firebaseDeploy();
  console.log('\nHosting deploy complete.');
  await verifyLive();
  console.log('');
}

main().catch((err) => {
  console.error('\n' + (err.message || err));
  process.exit(1);
});
