/**
 * One-command "step back" — re-ship a previous milestone's code as a NEW milestone.
 *
 * Why not a plain git reset? Because we ship to three layers that each need version
 * numbers to move FORWARD, never backward:
 *   - Apps Script: a new version number is created (old code, new version).
 *   - Firebase Hosting: a new release (old host-boot.js / index.html).
 *   - Android APK: versionCode auto-bumps (old native code, higher build number so it installs).
 *
 * So rollback = restore the SHIPPABLE source trees from a chosen milestone commit,
 * keep tooling + version counters as they are, then run the normal pipeline
 * (build-station-apk.js -> milestone.js -> deploy-hosting.js).
 *
 * Usage:
 *   node rollback.js                 Step back to the PREVIOUS milestone (with confirm)
 *   node rollback.js --list          Show recent milestones, do nothing
 *   node rollback.js --to 482        Roll back to milestone v482 (by GAS version)
 *   node rollback.js --to be6188f    Roll back to a specific commit hash
 *   node rollback.js --dry-run       Show exactly what would change, deploy nothing
 *   node rollback.js --yes           Skip the confirmation prompt
 *
 * Flags combine, e.g.  node rollback.js --to 482 --dry-run
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const root = __dirname;

// Files/trees that must NOT be rolled back — tooling, generated artifacts, version
// counters, deploy metadata, docs (our written history). Everything else is shippable.
const DENY_EXACT = new Set([
  'RELEASES.md',
  'WORKS_LOG.md',
  'deploy-config.json',
  'rollback.js',
  'milestone.js',
  'deploy-hosting.js',
  'build.js',
  'build-station-apk.js',
  'git-push-backup.js',
  'gas-push-sync.js',
  'generate-icons.js',
  'works-save.js',
  'station-android/app/build.gradle.kts', // keep versionCode moving forward
  'push-hosting/public/downloads/station-manifest.json',
  'push-hosting/public/downloads/showrunner-station.bin',
]);
const DENY_PREFIX = [
  'dist/',
  'docs/',
  'push-hosting/.firebase/',
  'push-hosting/prepare-hosting.js',
  'station-android/.gradle/',
  'station-android/build/',
  '_clasp_pull_check/',
  '.cursor/',
];

// Which restored paths mean we must rebuild the APK / redeploy hosting.
const NATIVE_PREFIX = 'station-android/';
const HOSTING_PREFIX = 'push-hosting/public/';

function run(cmd) {
  return execSync(cmd, { cwd: root, encoding: 'utf8' }).trim();
}
function runInherit(cmd) {
  execSync(cmd, { cwd: root, stdio: 'inherit' });
}
function tryRun(cmd) {
  try { return run(cmd); } catch (e) { return null; }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { list: false, dryRun: false, yes: false, to: null };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--list') out.list = true;
    else if (a === '--dry-run') out.dryRun = true;
    else if (a === '--yes' || a === '-y') out.yes = true;
    else if (a === '--to') out.to = args[++i];
    else if (a.startsWith('--to=')) out.to = a.slice(5);
  }
  return out;
}

function getMilestones() {
  // Newest first: hash \t subject, only "Milestone vNNN: ..." commits.
  const log = run('git log --pretty=format:%H%x09%s -200');
  const list = [];
  for (const line of log.split('\n')) {
    const tab = line.indexOf('\t');
    if (tab < 0) continue;
    const hash = line.slice(0, tab);
    const subject = line.slice(tab + 1);
    const m = subject.match(/^Milestone v(\d+):\s*(.*)$/);
    if (m) list.push({ hash, version: parseInt(m[1], 10), note: m[2], subject });
  }
  return list;
}

function resolveTarget(milestones, to) {
  if (!to) {
    // Default: previous milestone = second entry (index 0 is current HEAD milestone).
    if (milestones.length < 2) return null;
    return milestones[1];
  }
  // By GAS version number?
  if (/^\d+$/.test(to)) {
    const byVer = milestones.find((m) => m.version === parseInt(to, 10));
    if (byVer) return byVer;
  }
  // By commit hash (prefix match against milestone list, else resolve via git).
  const byHash = milestones.find((m) => m.hash.startsWith(to));
  if (byHash) return byHash;
  const full = tryRun(`git rev-parse --verify --quiet ${to}^{commit}`);
  if (full) {
    const subj = tryRun(`git show -s --format=%s ${full}`) || '';
    const m = subj.match(/^Milestone v(\d+):\s*(.*)$/);
    return { hash: full, version: m ? parseInt(m[1], 10) : null, note: m ? m[2] : subj, subject: subj };
  }
  return null;
}

function isDenied(file) {
  if (DENY_EXACT.has(file)) return true;
  return DENY_PREFIX.some((p) => file.startsWith(p));
}

function execIsClean(cmd) {
  try { execSync(cmd, { cwd: root, stdio: 'ignore' }); return true; } catch (e) { return false; }
}

function computePlan(target) {
  // Files that differ between the target milestone and HEAD.
  const changed = run(`git diff --name-only ${target.hash} HEAD`)
    .split('\n').map((s) => s.trim()).filter(Boolean);
  const restore = []; // exists at target -> checkout target's version
  const remove = [];  // added after target -> delete to match target
  for (const file of changed) {
    if (isDenied(file)) continue;
    if (execIsClean(`git cat-file -e ${target.hash}:"${file}"`)) restore.push(file);
    else remove.push(file);
  }
  const touched = restore.concat(remove);
  const nativeChanged = touched.some((f) => f.startsWith(NATIVE_PREFIX));
  const hostingChanged = touched.some((f) => f.startsWith(HOSTING_PREFIX));
  return { restore, remove, nativeChanged, hostingChanged, skippedDenied: changed.filter(isDenied) };
}

function ask(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (ans) => { rl.close(); resolve(String(ans || '').trim().toLowerCase()); });
  });
}

async function main() {
  const opts = parseArgs();

  let milestones;
  try {
    milestones = getMilestones();
  } catch (e) {
    console.error('Not a git repo or git unavailable:', e.message);
    process.exit(1);
  }
  if (!milestones.length) {
    console.error('No "Milestone vNNN" commits found in history.');
    process.exit(1);
  }

  if (opts.list) {
    console.log('\nRecent milestones (newest first):\n');
    milestones.slice(0, 15).forEach((m, i) => {
      const tag = i === 0 ? '  (current)' : (i === 1 ? '  (step-back target)' : '');
      console.log(`  v${m.version}  ${m.hash.slice(0, 8)}  ${m.note}${tag}`);
    });
    console.log('\nRoll back:  node rollback.js            (to the step-back target)');
    console.log('            node rollback.js --to 482   (to a specific version)\n');
    return;
  }

  const current = milestones[0];
  const target = resolveTarget(milestones, opts.to);
  if (!target) {
    console.error(opts.to
      ? `Could not resolve milestone/commit "${opts.to}". Try: node rollback.js --list`
      : 'No previous milestone to step back to.');
    process.exit(1);
  }
  if (target.hash === current.hash) {
    console.error('Target is the current milestone — nothing to roll back.');
    process.exit(1);
  }

  const plan = computePlan(target);
  if (!plan.restore.length && !plan.remove.length) {
    console.log('No shippable source differences between current and target — nothing to roll back.');
    return;
  }

  console.log('\n=== Rollback plan ===\n');
  console.log(`  From (current): v${current.version}  ${current.note}`);
  console.log(`  To   (target):  v${target.version != null ? target.version : '?'}  ${target.note}`);
  console.log(`  Target commit:  ${target.hash.slice(0, 8)}\n`);
  console.log(`  Files to restore: ${plan.restore.length}`);
  plan.restore.forEach((f) => console.log(`    ~ ${f}`));
  if (plan.remove.length) {
    console.log(`  Files to remove (added after target): ${plan.remove.length}`);
    plan.remove.forEach((f) => console.log(`    - ${f}`));
  }
  if (plan.skippedDenied.length) {
    console.log(`  Kept current (tooling/metadata/docs): ${plan.skippedDenied.length}`);
  }
  console.log(`\n  APK rebuild needed:   ${plan.nativeChanged ? 'YES' : 'no'}`);
  console.log(`  Hosting redeploy:     ${plan.hostingChanged || plan.nativeChanged ? 'YES' : 'no'}`);
  console.log('  GAS milestone:        YES (new version, old code)\n');

  if (opts.dryRun) {
    console.log('Dry run — nothing changed. Re-run without --dry-run to apply.\n');
    return;
  }

  if (!opts.yes) {
    // Guard: never block on stdin in a non-interactive shell (e.g. an AI agent
    // terminal, CI, or a piped run). Without a TTY, readline would hang forever
    // waiting for a keypress and wedge the whole shell session. Require --yes instead.
    if (!process.stdin.isTTY) {
      console.error(
        '\nNon-interactive shell detected — refusing to prompt (would hang).\n' +
        'Re-run with --yes to confirm, or --dry-run to preview:\n' +
        '  node rollback.js --to <ver> --yes\n'
      );
      process.exit(1);
    }
    const ans = await ask('Proceed with rollback and re-deploy? [y/N] ');
    if (ans !== 'y' && ans !== 'yes') {
      console.log('Aborted. No changes made.');
      return;
    }
  }

  // 1) Restore shippable source to the target milestone.
  console.log('\nRestoring source files…');
  for (const f of plan.restore) run(`git checkout ${target.hash} -- "${f}"`);
  for (const f of plan.remove) tryRun(`git rm -f -- "${f}"`);

  const verLabel = target.version != null ? `v${target.version}` : target.hash.slice(0, 8);
  const note = `Rollback to milestone ${verLabel}: ${target.note}`;

  // 2) APK (only if native changed) — build-station-apk.js auto-bumps versionCode forward.
  if (plan.nativeChanged) {
    console.log('\nBuilding APK (old native code, next build number)…');
    runInherit(`node build-station-apk.js "${note.replace(/"/g, "'")}"`);
  }

  // 3) GAS milestone (new version, old code) — also commits + pushes to GitHub.
  console.log('\nCreating GAS milestone…');
  runInherit(`node milestone.js "${note.replace(/"/g, "'")}"`);

  // 4) Hosting (if hosting or APK changed).
  if (plan.hostingChanged || plan.nativeChanged) {
    console.log('\nDeploying hosting…');
    runInherit('node deploy-hosting.js');
  }

  console.log(`\nRollback complete — re-shipped ${verLabel} as a new milestone.`);
  if (plan.nativeChanged) {
    console.log('APK was rebuilt with a higher build number — install it from the station app page.');
  }
}

main().catch((e) => {
  console.error('\nRollback failed:', e && e.message ? e.message : e);
  console.error('Working tree may be partially restored — check `git status` before retrying.');
  process.exit(1);
});
