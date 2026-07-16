/**
 * Root .js files that run only on the developer PC (Node).
 * Must never appear in dist/ or on the live Apps Script project.
 * Shared by build.js and check-google-account.js.
 */
module.exports = new Set([
  'build.js',
  'watch.js',
  'dev-push.js',
  'works-save.js',
  'milestone.js',
  'rollback.js',
  'rollback-works.js',
  'rollback-milestone.js',
  'deploy-hosting.js',
  'build-station-apk.js',
  'build-station-desktop.js',
  'check-google-account.js',
  'gas-push-sync.js',
  'gas-node-only.js',
  'git-push-backup.js',
  'test.js',
  'test_db.js',
  'run_test.js',
  'create-repomix.js',
  'pre-ship.js',
  'gas-ship-exclude.js',
]);
