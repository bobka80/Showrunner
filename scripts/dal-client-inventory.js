/**
 * DAL Phase 0/1 — client call + cache inventory (read-only scan).
 * Run: node scripts/dal-client-inventory.js
 * Check (pre-ship): node scripts/dal-client-inventory.js --check
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'docs/ai/dal-client-inventory.md');

const HTML_GLOB_SKIP = new Set(['dist', 'node_modules', '_clasp_pull_check', 'claude-pack', 'cursor-project-template']);

function listRootHtml() {
  return fs.readdirSync(ROOT)
    .filter((f) => /\.html$/i.test(f) && fs.statSync(path.join(ROOT, f)).isFile())
    .map((f) => path.join(ROOT, f));
}

const CHAIN_HELPERS = new Set(['withSuccessHandler', 'withFailureHandler', 'withUserObject']);

function skipParenGroup(text, openIdx) {
  let depth = 0;
  let inStr = null;
  let esc = false;
  for (let i = openIdx; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      inStr = ch;
      continue;
    }
    if (ch === '(') depth++;
    else if (ch === ')') {
      depth--;
      if (depth === 0) return i + 1;
    }
  }
  return text.length;
}

function extractServerCalls(text) {
  const runs = new Set();
  const reStart = /google\.script\.run/g;
  let start;
  while ((start = reStart.exec(text)) !== null) {
    let i = start.index + start[0].length;
    let serverFn = null;
    while (i < text.length) {
      const rest = text.slice(i);
      const m = rest.match(/^\s*\.\s*(\w+)\s*\(/);
      if (!m) break;
      const name = m[1];
      const openIdx = i + m.index + m[0].length - 1;
      const after = skipParenGroup(text, openIdx);
      if (CHAIN_HELPERS.has(name) || /^with/i.test(name)) {
        i = after;
        continue;
      }
      serverFn = name;
      i = after;
      break;
    }
    if (serverFn) runs.add(serverFn);
  }
  return [...runs].sort();
}

function scanFile(filePath) {
  const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
  const text = fs.readFileSync(filePath, 'utf8');
  const runs = extractServerCalls(text);

  const lsKeys = new Set();
  let m;
  const reLs = /localStorage\.(?:get|set)Item\s*\(\s*['"]([^'"]+)['"]/g;
  while ((m = reLs.exec(text)) !== null) lsKeys.add(m[1]);
  const reLsTpl = /localStorage\.(?:get|set)Item\s*\(\s*`([^`$]+)/g;
  while ((m = reLsTpl.exec(text)) !== null) lsKeys.add(m[1]);

  return { rel, runs, lsKeys: [...lsKeys].sort() };
}

function buildInventory() {
  const files = listRootHtml();
  const byRun = {};
  const byLs = {};
  const perFile = [];

  files.forEach((fp) => {
    const row = scanFile(fp);
    perFile.push(row);
    row.runs.forEach((fn) => {
      if (!byRun[fn]) byRun[fn] = [];
      if (!byRun[fn].includes(row.rel)) byRun[fn].push(row.rel);
    });
    row.lsKeys.forEach((key) => {
      if (!byLs[key]) byLs[key] = [];
      if (!byLs[key].includes(row.rel)) byLs[key].push(row.rel);
    });
  });

  perFile.sort((a, b) => a.rel.localeCompare(b.rel));
  Object.keys(byRun).sort().forEach((k) => byRun[k].sort());
  Object.keys(byLs).sort().forEach((k) => byLs[k].sort());

  return { perFile, byRun, byLs, fileCount: files.length };
}

function renderMarkdown(inv) {
  const date = new Date().toISOString().slice(0, 10);
  const lines = [
    '# DAL client inventory (generated)',
    '',
    '**Regenerate:** `node scripts/dal-client-inventory.js` · **Pre-ship:** `--check` must match this file when DAL hot paths change · **Handbook:** [archive/dal-pre-ship-gates.md](archive/dal-pre-ship-gates.md)',
    '',
    `**Generated:** ${date} · **Root HTML modules scanned:** ${inv.fileCount}`,
    '',
    '**Campaign:** [data-access-layer.md](data-access-layer.md) · **Server discovery:** [dal-phase0-discovery-2026-07-13.md](dal-phase0-discovery-2026-07-13.md)',
    '',
    '---',
    '',
    '## `google.script.run` by server function',
    '',
    '| Server function | Client files |',
    '|-----------------|--------------|',
  ];

  Object.keys(inv.byRun).forEach((fn) => {
    lines.push(`| \`${fn}\` | ${inv.byRun[fn].map((f) => `\`${f}\``).join(', ')} |`);
  });

  lines.push('', '## `localStorage` keys', '', '| Key | Client files |', '|-----------------|--------------|');
  Object.keys(inv.byLs).forEach((key) => {
    lines.push(`| \`${key}\` | ${inv.byLs[key].map((f) => `\`${f}\``).join(', ')} |`);
  });

  lines.push('', '## Per-file summary', '', '| File | `google.script.run` calls | `localStorage` keys |', '|---------------------|---------------------------|---------------------|');
  inv.perFile.forEach((row) => {
    lines.push(`| ${row.rel} | ${row.runs.length} | ${row.lsKeys.length} |`);
  });

  lines.push('', '---', '', '*Do not hand-edit — regenerate with `node scripts/dal-client-inventory.js`.*', '');
  return lines.join('\n');
}

function hash(content) {
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
}

function main() {
  const check = process.argv.includes('--check');
  const inv = buildInventory();
  const md = renderMarkdown(inv);
  const mdHash = hash(md);

  if (check) {
    if (!fs.existsSync(OUT)) {
      console.error('\nDAL inventory MISSING:', path.relative(ROOT, OUT));
      console.error('Run: node scripts/dal-client-inventory.js\n');
      process.exit(1);
    }
    const onDisk = fs.readFileSync(OUT, 'utf8');
    if (hash(onDisk) !== mdHash) {
      console.error('\nDAL client inventory STALE — codebase changed since last generate.');
      console.error('Run: node scripts/dal-client-inventory.js');
      console.error('Then commit:', path.relative(ROOT, OUT), '\n');
      process.exit(1);
    }
    console.log('DAL client inventory OK (hash ' + mdHash + ')');
    process.exit(0);
  }

  fs.writeFileSync(OUT, md, 'utf8');
  console.log('Wrote', path.relative(ROOT, OUT), '—', inv.fileCount, 'HTML modules,',
    Object.keys(inv.byRun).length, 'server functions,', Object.keys(inv.byLs).length, 'cache keys');
}

main();
