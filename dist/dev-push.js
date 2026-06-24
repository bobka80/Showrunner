/**
 * Dev push — build + clasp push only. No Git save, no Apps Script version.
 * Use after "OK go" when the director will test in developer mode.
 */
const { execSync } = require('child_process');
const build = require('./build');

console.log('=== Dev push (HEAD only — not a milestone) ===\n');
build();
execSync('clasp push', { stdio: 'inherit', cwd: __dirname });
console.log('\nDone. Test in developer mode. Say "This works" to create a Git save.');
