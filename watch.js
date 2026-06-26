/**
 * Dev watch — rebuild on source save + clasp push --watch on dist/
 *
 * Usage: npm run watch   (or: node watch.js)
 */
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const build = require('./build');

const NODE_ONLY = new Set([
  'build.js', 'watch.js', 'dev-push.js',
  'works-save.js', 'milestone.js', 'rollback-works.js', 'rollback-milestone.js',
  'test.js', 'test_db.js', 'run_test.js'
]);

function shouldIgnore(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  if (normalized.startsWith('dist/')) return true;
  if (normalized.startsWith('node_modules/')) return true;
  if (normalized.startsWith('.git/')) return true;
  if (normalized.startsWith('.VSCodeCounter/')) return true;
  if (normalized.startsWith('.cursor/')) return true;
  if (!/\.(html|js|json)$/i.test(normalized)) return true;
  if (NODE_ONLY.has(path.basename(normalized))) return true;
  return false;
}

console.log('=== Dev watch: build + clasp push --watch ===\n');
build();

const clasp = spawn('clasp', ['push', '--watch'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

let debounce;
fs.watch(__dirname, { recursive: true }, (_eventType, filename) => {
  if (!filename || shouldIgnore(filename)) return;

  clearTimeout(debounce);
  debounce = setTimeout(() => {
    console.log(`\n[watch] Changed: ${filename.replace(/\\/g, '/')} — rebuilding...`);
    try {
      build();
      console.log('[watch] Build done. clasp will push dist/ automatically.\n');
    } catch (err) {
      console.error('[watch] Build failed:', err.message || err);
    }
  }, 400);
});

clasp.on('exit', (code) => process.exit(code || 0));

process.on('SIGINT', () => {
  clasp.kill();
  process.exit(0);
});

console.log('Watching source files. Edit & save → auto build → auto clasp push.');
console.log('Press Ctrl+C to stop.\n');
