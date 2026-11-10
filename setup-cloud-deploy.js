/**
 * Prepare this machine for Showrunner deploys without committing secrets.
 *
 * Phone / cloud agents (cursor.com/agents) have no browser, so clasp and
 * Firebase cannot log in here. A desktop that is already logged in exports
 * the login files into Cursor environment secrets. This script copies those
 * secrets into the home directory (never the repo) and writes the gitignored
 * deploy-config.json when SHOWRUNNER_DEPLOYMENT_ID is set.
 *
 * Usage:
 *   node setup-cloud-deploy.js           # write local files from secrets
 *   node setup-cloud-deploy.js --check   # report only, write nothing
 *
 * Does not log in to Google and does not deploy.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = __dirname;
const DEPLOY_CONFIG = path.join(ROOT, 'deploy-config.json');
const CLASP_RC = path.join(os.homedir(), '.clasprc.json');
const FIREBASE_RC = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');

function redactId(id) {
  const s = String(id || '');
  if (s.length <= 8) return '…';
  return s.slice(0, 8) + '…';
}

function isInsideRepo(filePath) {
  const rel = path.relative(ROOT, path.resolve(filePath));
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

function isGitignored(relName) {
  try {
    execSync(`git check-ignore -q -- ${relName}`, { cwd: ROOT, stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

function validDeploymentId(id) {
  const s = String(id || '').trim();
  if (!s || /paste/i.test(s) || s.length < 20) return null;
  if (!/^AKfycb[A-Za-z0-9_-]+$/.test(s)) return null;
  return s;
}

function parseJsonEnv(name) {
  const raw = process.env[name];
  if (!raw || !String(raw).trim()) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new Error(name + ' is not valid JSON.');
  }
}

function claspCreds(rc) {
  if (!rc || typeof rc !== 'object') return null;
  return (rc.tokens && rc.tokens.default) || rc.token || null;
}

function writePrivate(filePath, text) {
  if (isInsideRepo(filePath)) {
    throw new Error('Refusing to write credentials inside the repo (' + path.basename(filePath) + ').');
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const body = text.endsWith('\n') ? text : text + '\n';
  fs.writeFileSync(filePath, body, { mode: 0o600 });
  try { fs.chmodSync(filePath, 0o600); } catch (e) { /* ignore */ }
}

function prependLocalBin() {
  const bin = path.join(ROOT, 'node_modules', '.bin');
  if (!fs.existsSync(bin)) return false;
  const parts = String(process.env.PATH || '').split(path.delimiter).filter(Boolean);
  if (parts[0] !== bin) process.env.PATH = [bin].concat(parts).join(path.delimiter);
  return true;
}

function loadDeploymentId() {
  const fromEnv = validDeploymentId(process.env.SHOWRUNNER_DEPLOYMENT_ID);
  if (fromEnv) return fromEnv;
  if (!fs.existsSync(DEPLOY_CONFIG)) return null;
  try {
    const cfg = JSON.parse(fs.readFileSync(DEPLOY_CONFIG, 'utf8'));
    return validDeploymentId(cfg.productionDeploymentId);
  } catch (e) {
    return null;
  }
}

function manualSteps(state) {
  const lines = [
    'Cloud / phone deploys need three secrets on the Showrunner Cursor environment.',
    'Set them once on a desktop that is already logged in. Do not commit them and do not paste them into the repo.',
    '',
  ];
  if (!state.claspRc) {
    lines.push('1. CLASPRC_JSON — entire contents of the home-folder file .clasprc.json (created by clasp login).');
    lines.push('   clasp login opens a browser. This machine cannot do that. Copy the file; do not run login here.');
  }
  if (!state.deploymentId) {
    lines.push('2. SHOWRUNNER_DEPLOYMENT_ID — the live web app id from `clasp list-deployments` (starts with AKfycb).');
    lines.push('   milestone.js reads this env var. It also writes gitignored deploy-config.json when the var is set.');
  }
  if (!state.firebase) {
    lines.push('3. FIREBASE_TOOLS_JSON — only for hosting /station-app deploys. Contents of ~/.config/configstore/firebase-tools.json after firebase login.');
  }
  lines.push('');
  lines.push('Then start an agent from cursor.com/agents and say Milestone now, This works, or the job name.');
  lines.push('APK builds still need an Android SDK on the machine. Desktop EXE builds still need the .NET SDK.');
  lines.push('watch.js is a desktop watcher that never exits — do not start it from the phone.');
  lines.push('rollback.js has no keyboard on an agent. Re-run it with --yes (or --dry-run).');
  return lines.join('\n');
}

function prepareCloudRuntime(opts) {
  const write = !opts || opts.write !== false;
  const lines = [];
  prependLocalBin();

  const envIdRaw = process.env.SHOWRUNNER_DEPLOYMENT_ID;
  if (envIdRaw && String(envIdRaw).trim() && !validDeploymentId(envIdRaw)) {
    throw new Error('SHOWRUNNER_DEPLOYMENT_ID is set but is not a clasp deployment id (AKfycb…). Refusing to create a new web app deployment.');
  }

  if (write && process.env.CLASPRC_JSON) {
    const rc = parseJsonEnv('CLASPRC_JSON');
    const creds = claspCreds(rc);
    if (!creds || !creds.refresh_token) {
      throw new Error('CLASPRC_JSON has no refresh_token (expected tokens.default or token).');
    }
    writePrivate(CLASP_RC, JSON.stringify(rc, null, 2));
    lines.push('Clasp login stored in the home directory (not in git).');
  }

  const depId = validDeploymentId(envIdRaw);
  if (write && depId) {
    if (!isGitignored('deploy-config.json')) {
      throw new Error('deploy-config.json is not gitignored — refusing to write it.');
    }
    const body = {
      productionDeploymentId: depId,
      notes: 'Written by setup-cloud-deploy.js from SHOWRUNNER_DEPLOYMENT_ID. Do not commit.',
    };
    fs.writeFileSync(DEPLOY_CONFIG, JSON.stringify(body, null, 2) + '\n', { mode: 0o600 });
    lines.push('Wrote gitignored deploy-config.json (' + redactId(depId) + ').');
  }

  if (write && process.env.FIREBASE_TOOLS_JSON) {
    const fb = parseJsonEnv('FIREBASE_TOOLS_JSON');
    if (!fb || typeof fb !== 'object') throw new Error('FIREBASE_TOOLS_JSON must be a JSON object.');
    writePrivate(FIREBASE_RC, JSON.stringify(fb, null, 2));
    lines.push('Firebase CLI login stored in the home config directory (not in git).');
  }

  const state = {
    lines: lines,
    deploymentId: loadDeploymentId(),
    claspRc: fs.existsSync(CLASP_RC),
    firebase: fs.existsSync(FIREBASE_RC),
    localClasp: fs.existsSync(path.join(ROOT, 'node_modules', '.bin', 'clasp')),
    localFirebase: fs.existsSync(path.join(ROOT, 'node_modules', '.bin', 'firebase')),
  };
  state.readyForMilestone = state.claspRc && !!state.deploymentId;
  state.manualSteps = manualSteps(state);
  return state;
}

function main() {
  const checkOnly = process.argv.indexOf('--check') !== -1;
  const state = prepareCloudRuntime({ write: !checkOnly });
  console.log('=== Cloud deploy setup' + (checkOnly ? ' (check only)' : '') + ' ===\n');
  state.lines.forEach((line) => console.log(line));
  console.log('clasp login file: ' + (state.claspRc ? 'present' : 'missing'));
  console.log('deployment id: ' + (state.deploymentId ? redactId(state.deploymentId) : 'missing'));
  console.log('firebase login file: ' + (state.firebase ? 'present' : 'missing'));
  console.log('local clasp CLI: ' + (state.localClasp ? 'yes' : 'no (run npm install)'));
  console.log('local firebase CLI: ' + (state.localFirebase ? 'yes' : 'no (run npm install)'));
  if (!state.readyForMilestone || !state.firebase) {
    console.log('\n' + state.manualSteps);
  } else {
    console.log('\nReady for milestone and hosting deploys from cursor.com/agents.');
  }
  process.exit(state.readyForMilestone ? 0 : 2);
}

module.exports = {
  prepareCloudRuntime,
  loadDeploymentId,
  prependLocalBin,
  validDeploymentId,
  manualSteps,
};

if (require.main === module) main();
