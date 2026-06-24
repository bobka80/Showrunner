/**
 * Rollback to a "This works" Git save.
 *
 * Usage:
 *   node rollback-works.js           → previous save (works #2 after rollback to #1's parent — uses last entry in log)
 *   node rollback-works.js 3         → works #3 from WORKS_LOG.md
 *   node rollback-works.js last        → most recent save (no-op checkout)
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const build = require('./build');

const LOG_PATH = path.join(__dirname, 'WORKS_LOG.md');
const arg = (process.argv[2] || '1').toLowerCase();

function run(cmd) {
  execSync(cmd, { cwd: __dirname, stdio: 'inherit' });
}

function runOut(cmd) {
  return execSync(cmd, { cwd: __dirname, encoding: 'utf8' }).trim();
}

function parseLog() {
  const content = fs.readFileSync(LOG_PATH, 'utf8');
  const rows = [];
  for (const line of content.split('\n')) {
    if (!line.startsWith('|') || line.includes('---') || line.includes('| # |')) continue;
    const cols = line.split('|').map((c) => c.trim()).filter(Boolean);
    if (cols.length >= 4 && /^\d+$/.test(cols[0])) {
      const hash = cols[2].replace(/`/g, '');
      rows.push({ num: parseInt(cols[0], 10), hash, note: cols.slice(3).join(' | ') });
    }
  }
  return rows;
}

const rows = parseLog();
if (!rows.length) {
  console.error('No entries in WORKS_LOG.md. Say "This works" first.');
  process.exit(1);
}

let target;
if (arg === 'last') {
  target = rows[0];
} else {
  const n = parseInt(arg, 10);
  target = rows.find((r) => r.num === n);
  if (!target) {
    console.error(`Works #${n} not found. Available:`, rows.map((r) => r.num).join(', '));
    process.exit(1);
  }
}

console.log(`=== Rollback to works #${target.num} (${target.hash}) ===`);
console.log('Note:', target.note, '\n');

run(`git checkout ${target.hash} -- .`);
run('git add -A');
try {
  runOut(`git commit -m "Rollback to works #${target.num}: ${target.hash}"`);
} catch (e) {
  /* may already match */
}

build();
run('clasp push');

console.log('\nRolled back locally and pushed to HEAD. Retest in developer mode.');
console.log('Production milestone unchanged unless you also rollback production.');
