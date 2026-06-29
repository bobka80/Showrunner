/**
 * Dev push — build + clasp push only. No Git save, no Apps Script version.
 * Use after "OK go" when the director will test in developer mode.
 */
const { execSync } = require('child_process');
const build = require('./build');
const gasPushSync = require('./gas-push-sync');

console.log('=== Dev push (HEAD only — not a milestone) ===\n');
build();
gasPushSync().then(() => {
  console.log('\nDone. Test in developer mode. Say "This works" to create a Git save.');
}).catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
