/**
 * Push current branch to GitHub (origin) after local commits.
 * Used by works-save.js and milestone.js — see DEPLOY_AND_ROLLBACK.md.
 */
const { execSync } = require('child_process');

function run(cmd) {
  return execSync(cmd, { cwd: __dirname, encoding: 'utf8' }).trim();
}

function pushToGitHub() {
  let remotes = '';
  try {
    remotes = run('git remote');
  } catch (e) {
    console.warn('GitHub push skipped: not a git repository.');
    return { ok: false, reason: 'not-a-repo' };
  }

  if (!remotes.split(/\s+/).filter(Boolean).includes('origin')) {
    console.warn('GitHub push skipped: no `origin` remote. See docs/ai/DEPLOY_AND_ROLLBACK.md § GitHub backup.');
    return { ok: false, reason: 'no-origin' };
  }

  let branch = 'master';
  try {
    branch = run('git rev-parse --abbrev-ref HEAD');
  } catch (e) { /* keep default */ }

  try {
    run(`git push -u origin ${branch}`);
    console.log(`GitHub backup: pushed ${branch} to origin.`);
    return { ok: true, branch };
  } catch (e) {
    const msg = (e.stderr || e.stdout || e.message || '').toString().trim();
    console.warn('GitHub push failed:', msg || e.message);
    return { ok: false, reason: 'push-failed', detail: msg };
  }
}

module.exports = { pushToGitHub };

if (require.main === module) {
  const r = pushToGitHub();
  process.exit(r.ok ? 0 : 1);
}
