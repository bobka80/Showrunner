/**
 * Production milestone — Apps Script version + deploy + RELEASES.md + Git commit
 * + refresh `claude-pack/repomix-output.md` (curated single file; soft-fail).
 *
 * Director logic:
 *   1. Read latest GAS version (e.g. 265)
 *   2. Push current code → create NEXT version with a proper name (e.g. 266)
 *   3. Deploy that new version to the web app
 *   4. Regenerate Claude / quote.ai repo mix (unless --no-repomix)
 *
 * Usage: node milestone.js "Pre database operations panel — IAM baseline"
 *        node milestone.js "note" --no-repomix   # skip pack refresh (faster ship)
 *
 * deploy-config.json is optional:
 *   - If productionDeploymentId is set → update that same production URL
 *   - If missing → clasp creates a new deployment; ID is saved to deploy-config.json
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const build = require('./build');
const { pushToGitHub } = require('./git-push-backup');
const gasPushSync = require('./gas-push-sync');

const MAX_MILESTONE_LOG = 50;
const LOG_PATH = path.join(__dirname, 'RELEASES.md');
const CONFIG_PATH = path.join(__dirname, 'deploy-config.json');
const EXAMPLE_CONFIG_PATH = path.join(__dirname, 'deploy-config.example.json');

function parseMilestoneArgs(argv) {
  let skipRepomix = false;
  const noteParts = [];
  for (const a of argv) {
    if (a === '--no-repomix') skipRepomix = true;
    else noteParts.push(a);
  }
  return {
    skipRepomix,
    note: noteParts.join(' ').trim() || 'Milestone',
  };
}

const { skipRepomix, note } = parseMilestoneArgs(process.argv.slice(2));

function refreshRepoMixSoft() {
  console.log('\n=== Refreshing Claude / quote.ai repo mix (curated, single file) ===\n');
  try {
    execSync('node create-repomix.js', {
      cwd: __dirname,
      stdio: 'inherit',
      shell: true,
    });
  } catch (e) {
    console.warn('\nWARNING: Repo mix refresh failed — GAS milestone still succeeded.');
    console.warn('Regenerate later with: node create-repomix.js');
    console.warn('(or say "create repo mix" in Cursor)\n');
    if (e && e.message) console.warn(e.message);
  }
}

function run(cmd) {
  return execSync(cmd, { cwd: __dirname, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}

function runInherit(cmd) {
  execSync(cmd, { cwd: __dirname, stdio: 'inherit' });
}

function parseClaspVersions(output) {
  const versions = [];
  for (const line of output.split('\n')) {
    const m = line.match(/^\s*(\d+)\s*-\s*(.*)$/);
    if (m) versions.push({ num: parseInt(m[1], 10), desc: m[2].trim() });
  }
  return versions;
}

function getLatestGasVersion() {
  const list = run('clasp list-versions');
  const versions = parseClaspVersions(list);
  if (!versions.length) return null;
  return versions.reduce((max, v) => (v.num > max.num ? v : max), versions[0]);
}

function parseDeploymentId(output) {
  const m = output.match(/Deployed\s+(AKfycb\S+)\s*@/i)
    || output.match(/-\s*(AKfycb\S+)\s*@/);
  return m ? m[1] : null;
}

function loadOptionalDeploymentId() {
  if (!fs.existsSync(CONFIG_PATH)) return null;
  try {
    const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    const id = cfg.productionDeploymentId;
    if (id && !String(id).includes('PASTE')) return id;
  } catch (e) { /* ignore */ }
  return null;
}

function saveDeploymentId(deploymentId) {
  let cfg = {};
  if (fs.existsSync(CONFIG_PATH)) {
    try { cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')); } catch (e) { /* ignore */ }
  } else if (fs.existsSync(EXAMPLE_CONFIG_PATH)) {
    try { cfg = JSON.parse(fs.readFileSync(EXAMPLE_CONFIG_PATH, 'utf8')); } catch (e) { /* ignore */ }
  }
  cfg.productionDeploymentId = deploymentId;
  cfg.notes = 'Auto-saved by milestone.js — production web app deployment ID';
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2) + '\n');
}

function updateReleasesLog(gasVersion, deployId, text) {
  const entries = [];
  if (fs.existsSync(LOG_PATH)) {
    for (const line of fs.readFileSync(LOG_PATH, 'utf8').split('\n')) {
      if (!line.startsWith('|') || line.includes('---') || line.includes('| # |') || line.includes('*(none')) continue;
      const cols = line.split('|').map((c) => c.trim()).filter(Boolean);
      if (cols.length >= 5 && /^\d+$/.test(cols[0])) {
        entries.push({
          date: cols[1],
          version: cols[2],
          deploy: cols[3],
          text: cols.slice(4).join(' | '),
        });
      }
    }
  }

  const date = new Date().toISOString().slice(0, 10);
  const deployShort = deployId.length > 12 ? `${deployId.slice(0, 8)}…` : deployId;
  entries.unshift({ date, version: gasVersion, deploy: `\`${deployShort}\``, text });

  const trimmed = entries.slice(0, MAX_MILESTONE_LOG);
  const body = [
    '# Production Milestones (Apps Script versions)',
    '',
    'Created only on **Milestone** / **OK ship** / **Milestone now** — not on every "This works".',
    '',
    '| # | Date | GAS version | Deployment | Note |',
    '|---|------|-------------|------------|------|',
    ...trimmed.map((e, i) => `| ${i + 1} | ${e.date} | ${e.version} | ${e.deploy} | ${e.text.replace(/\|/g, '\\|')} |`),
    '',
    '---',
    '',
    '**Rollback production:** Tell the AI *"Rollback production to last milestone"*.',
    '',
  ].join('\n');

  fs.writeFileSync(LOG_PATH, body);
}

console.log('=== Production milestone (Apps Script layer) ===\n');
console.log('Note:', note, '\n');

const { runPreShip } = require('./pre-ship/index.js');

try {
  runPreShip({ layers: ['gas'], forDeploy: true, label: 'milestone.js' });
} catch (e) {
  console.error(e.message || e);
  process.exit(1);
}

const before = getLatestGasVersion();
if (before) {
  console.log(`Latest Apps Script version now: ${before.num} — "${before.desc}"`);
  console.log(`Next version will be: ${before.num + 1}\n`);
} else {
  console.log('Could not read existing versions; clasp will assign the next number.\n');
}

// build() already ran inside pre-ship GAS layer above.
(async () => {
  try {
    await gasPushSync();
  } catch (e) {
    console.error(e.message || e);
    process.exit(1);
  }

  console.log('\nCreating Apps Script version...');
  const safeNote = note.replace(/"/g, "'");
  let versionOut = '';
  try {
    versionOut = run(`clasp version "${safeNote}"`);
    if (versionOut) console.log(versionOut);
  } catch (e) {
    const err = (e.stdout || e.stderr || e.message || '').toString();
    if (err) console.error(err);
    process.exit(1);
  }

  let gasVersion = null;
  const m = versionOut.match(/(\d+)\s*$/m) || versionOut.match(/version\s+(\d+)/i);
  if (m) gasVersion = m[1];
  if (!gasVersion) {
    const after = getLatestGasVersion();
    if (after) gasVersion = String(after.num);
  }
  if (!gasVersion) {
    console.error('Could not determine new version number. Check clasp list-versions.');
    process.exit(1);
  }

  const existingDeployId = loadOptionalDeploymentId();
  let deploymentId = existingDeployId;
  let deployOut = '';

  console.log(`\nDeploying version ${gasVersion}...`);
  const deployDesc = safeNote.replace(/"/g, "'");
  try {
    if (existingDeployId) {
      console.log(`Updating production deployment ${existingDeployId.slice(0, 12)}…`);
      deployOut = run(`clasp deploy -i ${existingDeployId} -V ${gasVersion} -d "${deployDesc}"`);
    } else {
      console.log('No production deployment ID saved yet — creating a new web app deployment.');
      deployOut = run(`clasp deploy -V ${gasVersion} -d "${deployDesc}"`);
      const newId = parseDeploymentId(deployOut);
      if (newId) {
        deploymentId = newId;
        saveDeploymentId(newId);
        console.log(`Saved production deployment ID to deploy-config.json`);
      }
    }
    if (deployOut) console.log(deployOut);
  } catch (e) {
    const err = (e.stdout || e.stderr || e.message || '').toString();
    if (err) console.error(err);
    process.exit(1);
  }

  if (!deploymentId) {
    deploymentId = parseDeploymentId(deployOut) || 'unknown';
  }

  updateReleasesLog(gasVersion, deploymentId, note);

  const safeMsg = `Milestone v${gasVersion}: ${safeNote}`;
  run('git add -A');
  try {
    run(`git commit -m "${safeMsg}"`);
  } catch (e) {
    console.log('(Git: nothing new to commit after RELEASES.md update, or commit skipped)');
  }

  const pushResult = pushToGitHub();
  if (!pushResult.ok) {
    console.log('GitHub: milestone commit not pushed — see DEPLOY_AND_ROLLBACK.md § GitHub backup.');
  }

  console.log(`\nMilestone complete — Apps Script version ${gasVersion}`);
  console.log('Updated RELEASES.md');
  if (existingDeployId) {
    console.log('Production web app URL updated to this version.');
  } else {
    console.log('New deployment created. Bookmark the web app URL from Apps Script → Deploy → Manage deployments.');
  }

  // Fresh single-file pack for Claude / quote.ai (does not fail the ship).
  if (skipRepomix) {
    console.log('\nSkipped repo mix refresh (--no-repomix).');
  } else {
    refreshRepoMixSoft();
  }
})();
