/**
 * Check Node/clasp Google account — login state, expected email, GAS project access,
 * and that no PC-only Node scripts leaked to the live Apps Script project.
 *
 * Usage: node check-google-account.js
 *
 * Reads google-account.json (copy from google-account.example.json).
 * Uses clasp show-authorized-user --json and a lightweight clasp list-versions call.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const NODE_ONLY = require('./gas-node-only');
const { getRemoteGasFileNames } = require('./gas-push-sync');

const ROOT = __dirname;
const ACCOUNT_PATH = path.join(ROOT, 'google-account.json');
const ACCOUNT_EXAMPLE_PATH = path.join(ROOT, 'google-account.example.json');
const CLASP_PATH = path.join(ROOT, '.clasp.json');

const NODE_ONLY_BASENAMES = new Set(
  [...NODE_ONLY].map((file) => file.replace(/\.js$/i, ''))
);

function run(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}

function runAllowFail(cmd) {
  try {
    return { ok: true, out: run(cmd) };
  } catch (err) {
    const stderr = err.stderr ? String(err.stderr).trim() : '';
    const stdout = err.stdout ? String(err.stdout).trim() : '';
    return { ok: false, out: stdout || stderr || err.message };
  }
}

function loadExpectedEmail() {
  if (!fs.existsSync(ACCOUNT_PATH)) {
    return {
      error: `Missing ${path.basename(ACCOUNT_PATH)}. Copy ${path.basename(ACCOUNT_EXAMPLE_PATH)} and set expectedEmail.`,
    };
  }
  try {
    const cfg = JSON.parse(fs.readFileSync(ACCOUNT_PATH, 'utf8'));
    const email = String(cfg.expectedEmail || '').trim().toLowerCase();
    if (!email || email.includes('example.com')) {
      return { error: `Set a real expectedEmail in ${path.basename(ACCOUNT_PATH)}.` };
    }
    return { email };
  } catch (e) {
    return { error: `Invalid JSON in ${path.basename(ACCOUNT_PATH)}: ${e.message}` };
  }
}

function loadScriptId() {
  if (!fs.existsSync(CLASP_PATH)) {
    return { error: 'Missing .clasp.json in project root.' };
  }
  try {
    const cfg = JSON.parse(fs.readFileSync(CLASP_PATH, 'utf8'));
    const scriptId = String(cfg.scriptId || '').trim();
    if (!scriptId) return { error: '.clasp.json has no scriptId.' };
    return { scriptId };
  } catch (e) {
    return { error: `Invalid .clasp.json: ${e.message}` };
  }
}

function getClaspAuth() {
  const result = runAllowFail('clasp show-authorized-user --json');
  if (!result.ok) {
    return { loggedIn: false, error: result.out };
  }
  try {
    return JSON.parse(result.out);
  } catch (e) {
    return { loggedIn: false, error: 'Could not parse clasp show-authorized-user output.' };
  }
}

function parseLatestVersion(output) {
  let latest = null;
  for (const line of output.split('\n')) {
    const m = line.match(/^\s*(\d+)\s*-\s*(.*)$/);
    if (!m) continue;
    const num = parseInt(m[1], 10);
    if (!latest || num > latest.num) latest = { num, desc: m[2].trim() };
  }
  return latest;
}

function nodeOnlyLeakedOnGas(remoteFiles) {
  return remoteFiles.filter(
    (f) => f.type === 'SERVER_JS' && NODE_ONLY_BASENAMES.has(f.name)
  );
}

async function main() {
  const lines = [];
  const issues = [];
  let ok = true;

  lines.push('=== Google account check (Node / clasp) ===\n');

  const expected = loadExpectedEmail();
  if (expected.error) {
    console.error(expected.error);
    process.exit(1);
  }

  const claspCfg = loadScriptId();
  if (claspCfg.error) {
    console.error(claspCfg.error);
    process.exit(1);
  }

  const auth = getClaspAuth();
  const actualEmail = auth.email ? String(auth.email).trim().toLowerCase() : null;

  lines.push(`Expected account:  ${expected.email}`);
  lines.push(`Apps Script ID:    ${claspCfg.scriptId}`);

  if (!auth.loggedIn) {
    ok = false;
    issues.push('clasp is not logged in.');
    if (auth.error) issues.push(auth.error);
    lines.push('Logged in:         NO');
    lines.push('Active account:    (none)');
  } else {
    lines.push('Logged in:         YES');
    lines.push(`Active account:    ${actualEmail || '(unknown — token may be expired)'}`);

    if (!actualEmail) {
      ok = false;
      issues.push('Logged in but clasp could not read your Google email (re-run clasp login).');
    } else if (actualEmail !== expected.email) {
      ok = false;
      issues.push(`Wrong account: clasp is ${actualEmail}, expected ${expected.email}.`);
    }
  }

  let latestVersion = null;
  if (auth.loggedIn) {
    const versions = runAllowFail('clasp list-versions');
    if (!versions.ok) {
      ok = false;
      issues.push('Cannot reach the bound Apps Script project (clasp list-versions failed).');
      lines.push('Project access:    FAILED');
      lines.push(`  ${versions.out.split('\n')[0]}`);
    } else {
      latestVersion = parseLatestVersion(versions.out);
      lines.push('Project access:    OK');
      if (latestVersion) {
        lines.push(`Latest GAS version: v${latestVersion.num} — ${latestVersion.desc}`);
      }
    }

    lines.push('');
    lines.push('Check 3 — PC-only scripts must not be on Apps Script:');
    try {
      const remoteFiles = await getRemoteGasFileNames();
      const leaked = nodeOnlyLeakedOnGas(remoteFiles);
      if (leaked.length) {
        ok = false;
        const names = leaked.map((f) => `${f.name}.js`).join(', ');
        issues.push(`PC-only Node file(s) on live Apps Script: ${names} — causes white screen (require is not defined).`);
        lines.push(`  NOT OK — found: ${names}`);
        lines.push('  Fix: node build.js && node milestone.js "Remove Node-only orphans from GAS"');
      } else {
        lines.push('  OK — no PC-only Node scripts on the remote project');
      }
    } catch (e) {
      ok = false;
      issues.push(`Could not list remote Apps Script files: ${e.message}`);
      lines.push(`  FAILED — ${e.message}`);
    }
  } else {
    lines.push('Project access:    skipped (not logged in)');
    lines.push('Check 3:           skipped (not logged in)');
  }

  lines.push('');
  if (ok) {
    lines.push('RESULT: OK — Node is connected to the expected Google account and can reach Showrunner.');
  } else {
    lines.push('RESULT: NOT OK');
    for (const issue of issues) lines.push(`  - ${issue}`);
    lines.push('');
    lines.push('Fix: clasp login   (then re-run: node check-google-account.js)');
  }

  console.log(lines.join('\n'));
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
