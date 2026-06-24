/**
 * Rollback production to a previous Apps Script milestone.
 *
 * Usage:
 *   node rollback-milestone.js      → previous milestone (entry #2 in RELEASES.md)
 *   node rollback-milestone.js 1    → milestone #1 (latest)
 *   node rollback-milestone.js 2    → milestone #2
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const LOG_PATH = path.join(__dirname, 'RELEASES.md');
const CONFIG_PATH = path.join(__dirname, 'deploy-config.json');
const arg = process.argv[2] || '2';

function runInherit(cmd) {
  execSync(cmd, { cwd: __dirname, stdio: 'inherit' });
}

function loadDeploymentId() {
  const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  return cfg.productionDeploymentId;
}

function parseReleases() {
  const content = fs.readFileSync(LOG_PATH, 'utf8');
  const rows = [];
  for (const line of content.split('\n')) {
    if (!line.startsWith('|') || line.includes('---') || line.includes('| # |')) continue;
    const cols = line.split('|').map((c) => c.trim()).filter(Boolean);
    if (cols.length >= 5 && /^\d+$/.test(cols[0])) {
      rows.push({ num: parseInt(cols[0], 10), version: cols[2], note: cols.slice(4).join(' | ') });
    }
  }
  return rows;
}

if (!fs.existsSync(CONFIG_PATH)) {
  console.error('Missing deploy-config.json');
  process.exit(1);
}

const rows = parseReleases();
if (rows.length < 1) {
  console.error('No milestones in RELEASES.md');
  process.exit(1);
}

const n = parseInt(arg, 10);
const target = rows.find((r) => r.num === n);
if (!target) {
  console.error(`Milestone #${n} not found. Available:`, rows.map((r) => r.num).join(', '));
  process.exit(1);
}

const deploymentId = loadDeploymentId();

console.log(`=== Rollback PRODUCTION to milestone #${target.num} (GAS v${target.version}) ===`);
console.log('Note:', target.note, '\n');

runInherit(`clasp deploy -i ${deploymentId} -V ${target.version} -d "Rollback to milestone #${target.num}"`);

console.log('\nProduction redeployed. Hard-refresh the web app and test.');
console.log('Google Sheet data was NOT rolled back.');
