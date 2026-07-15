/**
 * DAL pre-ship gates — inventory, persistence lint, Phase 3 concurrency ack.
 */
const { execSync } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const DAL_HOT_PATTERNS = [
  /^Dal_[A-Za-z0-9_]+\.js$/i,
  /^Logistics_[A-Za-z0-9_]+\.js$/i,
  /^Operations\.js$/i,
  /^Resources_Core\.js$/i,
  /^02[a-z0-9_]*_Project/i,
  /^02e\d*_Logic/i,
  /^02c_Project_Operations/i,
  /^03a_Timeline/i,
  /^docs\/ai\/active\/dal-/i,
];

function norm(p) {
  return String(p || '').replace(/\\/g, '/');
}

function dalTouched(changedFiles) {
  return (changedFiles || []).some((f) => {
    const n = norm(f);
    const base = n.split('/').pop();
    return DAL_HOT_PATTERNS.some((re) => re.test(n) || re.test(base));
  });
}

function runNode(script, args, label) {
  const scriptPath = path.join(ROOT, script);
  const argStr = args && args.length ? ' ' + args.join(' ') : '';
  console.log(`  → ${label || script}`);
  execSync(`node "${scriptPath}"${argStr}`, { cwd: ROOT, stdio: 'inherit' });
}

function runDalGates({ forDeploy }) {
  console.log('\n── DAL gates (data-access layer) ──');
  runNode('scripts/dal-persistence-lint.js', [], 'persistence lint (no client sheet access)');
  runNode('scripts/dal-client-inventory.js', ['--check'], 'client inventory freshness');
  const phase3Args = forDeploy ? '--deploy' : '';
  execSync(`node "${path.join(ROOT, 'scripts/dal-phase3-gate.js')}" ${phase3Args}`, {
    cwd: ROOT,
    stdio: 'inherit',
  });
  console.log('  → DAL gates OK');
  return { ok: true, steps: ['dal-persistence-lint', 'dal-client-inventory', 'dal-phase3-gate'] };
}

module.exports = { dalTouched, runDalGates, DAL_HOT_PATTERNS };
