/**
 * Production milestone — Apps Script version + deploy + RELEASES.md + Git commit.
 *
 * Usage: node milestone.js "Major: Print Studio wired"
 *
 * Requires deploy-config.json with productionDeploymentId (see deploy-config.example.json).
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const build = require('./build');

const MAX_MILESTONE_LOG = 50;
const LOG_PATH = path.join(__dirname, 'RELEASES.md');
const CONFIG_PATH = path.join(__dirname, 'deploy-config.json');
const note = process.argv.slice(2).join(' ').trim() || 'Milestone';

function run(cmd) {
  return execSync(cmd, { cwd: __dirname, encoding: 'utf8', stdio: ['pipe', 'pipe', 'inherit'] }).trim();
}

function runInherit(cmd) {
  execSync(cmd, { cwd: __dirname, stdio: 'inherit' });
}

function loadDeploymentId() {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error('\nMissing deploy-config.json');
    console.error('Copy deploy-config.example.json → deploy-config.json');
    console.error('Run: clasp list-deployments');
    console.error('Paste your Production Web App deployment ID.\n');
    process.exit(1);
  }
  const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  const id = cfg.productionDeploymentId;
  if (!id || id.includes('PASTE')) {
    console.error('\nSet productionDeploymentId in deploy-config.json\n');
    process.exit(1);
  }
  return id;
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
    'Created only on **Milestone** / **OK ship** / major feature or major fix — not on every "This works".',
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

const deploymentId = loadDeploymentId();

build();
runInherit('clasp push');

console.log('\nCreating Apps Script version...');
const versionOut = run(`clasp version "${note.replace(/"/g, "'")}"`);
let gasVersion = null;
const m = versionOut.match(/(\d+)\s*$/m) || versionOut.match(/version\s+(\d+)/i);
if (m) gasVersion = m[1];
if (!gasVersion) {
  const list = run('clasp list-versions');
  const nums = list.match(/\d+/g);
  if (nums && nums.length) gasVersion = nums[nums.length - 1];
}
if (!gasVersion) {
  console.error('Could not determine new version number. Check clasp list-versions.');
  process.exit(1);
}

console.log(`Deploying version ${gasVersion} to production (${deploymentId})...`);
runInherit(`clasp deploy -i ${deploymentId} -V ${gasVersion} -d "${note.replace(/"/g, "'")}"`);

updateReleasesLog(gasVersion, deploymentId, note);

const safeMsg = `Milestone v${gasVersion}: ${note.replace(/"/g, "'")}`;
run('git add -A');
try {
  run(`git commit -m "${safeMsg}"`);
} catch (e) {
  console.log('(Git: nothing new to commit after RELEASES.md update, or commit skipped)');
}

console.log(`\nMilestone complete — Apps Script version ${gasVersion}`);
console.log('Updated RELEASES.md');
console.log('Production web app now uses this version.');
