/**
 * Phase 3 gate — when delta-only saves ship, require director concurrency smoke ack.
 * Run: node scripts/dal-phase3-gate.js [--deploy]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const HOT_FUNCTIONS = [
  { file: 'Logistics_Assets.js', fn: 'saveProjectAssetsDelta', impl: 'saveProjectAssetsDeltaSheets_' },
  { file: 'Logistics_Timeline.js', fn: 'saveTimelineData', impl: 'saveTimelineDataSheets_' },
  { file: 'Operations.js', fn: 'batchProcessOperations', impl: 'batchProcessOperationsSheets_' },
];

function extractFunctionBlock(src, fnName) {
  const re = new RegExp('function\\s+' + fnName + '\\s*\\([^)]*\\)\\s*\\{');
  const m = re.exec(src);
  if (!m) return null;
  let i = m.index + m[0].length;
  let depth = 1;
  while (i < src.length && depth > 0) {
    const ch = src[i];
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    i++;
  }
  return src.slice(m.index, i);
}

function deltaOnlyStatus() {
  const out = [];
  HOT_FUNCTIONS.forEach(({ file, fn, impl }) => {
    const fp = path.join(ROOT, file);
    if (!fs.existsSync(fp)) return;
    const src = fs.readFileSync(fp, 'utf8');
    let block = extractFunctionBlock(src, fn);
    if (!block) {
      out.push({ file, fn, status: 'missing' });
      return;
    }
    if (!/\.clearContents\s*\(/.test(block) && impl) {
      const implBlock = extractFunctionBlock(src, impl);
      if (implBlock) block = implBlock;
    }
    const hasClear = /\.clearContents\s*\(/.test(block);
    out.push({ file, fn, status: hasClear ? 'full-rewrite' : 'delta-only' });
  });
  return out;
}

function printConcurrencyChecklist() {
  console.log(`
=== DAL Phase 3 — mandatory concurrency smoke (director) ===

1. Two managers open the SAME project → Equipment (PA) → edit different lines → save
   → neither edit silently disappears (no last-write-wins overwrite).

2. Two users edit timeline on same project within 2s window
   → conflict is visible (toast/notification), not silent.

3. Two checkout sessions on different projects
   → Operations_Ledger rows for both sessions remain intact.

When all pass, re-ship with:
  $env:PRE_SHIP_DAL_CONCURRENCY_OK=1; node milestone.js "…"
`);
}

function main() {
  const forDeploy = process.argv.includes('--deploy');
  const status = deltaOnlyStatus();
  const deltaOnly = status.filter((s) => s.status === 'delta-only');

  if (!deltaOnly.length) {
    console.log('  → Phase 3 gate: full-rewrite still present (expected until delta-only ships)');
    status.forEach((s) => console.log('    ·', s.file + '::' + s.fn, '→', s.status));
    return;
  }

  console.log('  → Phase 3 gate: delta-only detected in:');
  deltaOnly.forEach((s) => console.log('    ·', s.file + '::' + s.fn));

  if (!forDeploy) {
    console.log('  → deploy not requested — concurrency ack not required yet');
    return;
  }

  if (process.env.PRE_SHIP_DAL_CONCURRENCY_OK === '1') {
    console.log('  → PRE_SHIP_DAL_CONCURRENCY_OK=1 — concurrency smoke acknowledged');
    return;
  }

  printConcurrencyChecklist();
  console.error('\nDAL Phase 3 gate BLOCKED: run concurrency smoke tests, then PRE_SHIP_DAL_CONCURRENCY_OK=1\n');
  process.exit(1);
}

main();
