/**
 * "This works" save — Git commit + WORKS_LOG.md (rolling last 50).
 * Does NOT create an Apps Script version.
 *
 * Usage: node works-save.js "PRINT button opens modal"
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const build = require('./build');
const { pushToGitHub } = require('./git-push-backup');

const MAX_ENTRIES = 50;
const LOG_PATH = path.join(__dirname, 'WORKS_LOG.md');
const note = process.argv.slice(2).join(' ').trim() || 'This works';

function run(cmd) {
  return execSync(cmd, { cwd: __dirname, encoding: 'utf8' }).trim();
}

function updateWorksLog(hash, text) {
  const date = new Date().toISOString().slice(0, 10);
  const entries = [];

  if (fs.existsSync(LOG_PATH)) {
    for (const line of fs.readFileSync(LOG_PATH, 'utf8').split('\n')) {
      if (!line.startsWith('|') || line.includes('---') || line.includes('| # |') || line.includes('*(none')) continue;
      const cols = line.split('|').map((c) => c.trim()).filter(Boolean);
      if (cols.length >= 4 && /^\d+$/.test(cols[0])) {
        entries.push({
          date: cols[1],
          hash: cols[2].replace(/`/g, ''),
          text: cols.slice(3).join(' | '),
        });
      }
    }
  }

  entries.unshift({ date, hash, text });
  const trimmed = entries.slice(0, MAX_ENTRIES);

  const body = [
    '# "This Works" Save Log (Git — last 50 entries)',
    '',
    'Local rollback checkpoints. Created when the director says **"This works"**.',
    'Does **not** change the live production web app — only saves code on disk.',
    '',
    '| # | Date | Git commit | Note |',
    '|---|------|------------|------|',
    ...trimmed.map((e, i) => `| ${i + 1} | ${e.date} | \`${e.hash}\` | ${e.text.replace(/\|/g, '\\|')} |`),
    '',
    '---',
    '',
    '**Rollback:** Tell the AI *"Rollback to last this works"* or *"Rollback to works #3"*.',
    '',
  ].join('\n');

  fs.writeFileSync(LOG_PATH, body);
}

console.log('=== "This works" save (Git layer) ===\n');
console.log('Note:', note, '\n');

build();

try {
  run('git add -A');
  const status = run('git status --porcelain');
  if (!status) {
    console.log('No file changes to commit — updating log only if needed.');
  } else {
    const safeMsg = note.replace(/"/g, "'");
    run(`git commit -m "This works: ${safeMsg}"`);
  }
} catch (e) {
  console.error('Git commit failed:', e.message);
  process.exit(1);
}

let hash;
try {
  hash = run('git rev-parse --short HEAD');
} catch (e) {
  console.error('Could not read Git commit hash.');
  process.exit(1);
}

const date = new Date().toISOString().slice(0, 10);
updateWorksLog(hash, note);

console.log(`\nSaved Git checkpoint ${hash}`);
console.log('Updated WORKS_LOG.md (max', MAX_ENTRIES, 'entries).');

const pushResult = pushToGitHub();
if (!pushResult.ok) {
  console.log('GitHub: not pushed — local checkpoint only. Fix origin/credentials then re-run: node git-push-backup.js');
} else {
  console.log('GitHub: WORKS_LOG checkpoint backed up on origin.');
}

console.log('Production unchanged. Say "Milestone" or "OK ship" when ready for Apps Script deploy.');
