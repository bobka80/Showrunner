/**
 * DAL persistence lint — ban client sheet access; track hot-path clearContents.
 * Run: node scripts/dal-persistence-lint.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

/** Server files allowed to use clearContents until Phase 3 delta-only ships. */
const CLEARCONTENTS_ALLOWLIST = new Set([
  'Integrations.js',
  'Logistics_Assets.js',
  'Logistics_Ledger.js',
  'Logistics_Projects.js',
  'Logistics_Roster.js',
  'Logistics_Schema.js',
  'Logistics_Tasks.js',
  'Logistics_Timeline.js',
  'Operations.js',
  'Resources_Audit.js',
  'Resources_Migrations.js',
  'Resources_System.js',
  'Resources_Vault.js',
  'Resources_Warehouse.js',
  'Security.js',
  'Station_Security.js',
]);

/** Client HTML must never touch SpreadsheetApp or clearContents. */
const CLIENT_HTML = fs.readdirSync(ROOT)
  .filter((f) => /\.html$/i.test(f))
  .map((f) => path.join(ROOT, f));

function fail(msg) {
  console.error('\nDAL persistence lint FAILED:', msg, '\n');
  process.exit(1);
}

function lintClientHtml() {
  CLIENT_HTML.forEach((fp) => {
    const rel = path.basename(fp);
    const text = fs.readFileSync(fp, 'utf8');
    if (/\bSpreadsheetApp\b/.test(text)) {
      fail(rel + ' contains SpreadsheetApp — client must use google.script.run → repos only');
    }
    if (/\.clearContents\s*\(/.test(text)) {
      fail(rel + ' contains clearContents() — sheet writes belong on server adapters only');
    }
  });
}

function lintServerClearContents() {
  const candidates = fs.readdirSync(ROOT).filter((f) => /\.js$/i.test(f));
  const offenders = [];
  const hotPath = [];

  candidates.forEach((name) => {
    const fp = path.join(ROOT, name);
    const text = fs.readFileSync(fp, 'utf8');
    if (!/\.clearContents\s*\(/.test(text)) return;
    if (CLEARCONTENTS_ALLOWLIST.has(name)) {
      if (['Logistics_Assets.js', 'Logistics_Timeline.js', 'Operations.js'].includes(name)) {
        hotPath.push(name);
      }
      return;
    }
    offenders.push(name);
  });

  if (offenders.length) {
    fail('clearContents() in non-allowlisted server files: ' + offenders.join(', '));
  }

  console.log('  → hot-path clearContents (Phase 3 targets):', hotPath.length ? hotPath.join(', ') : 'none');
  console.log('  → client HTML: no SpreadsheetApp / clearContents');
}

function main() {
  console.log('DAL persistence lint…');
  lintClientHtml();
  lintServerClearContents();
  console.log('DAL persistence lint OK\n');
}

main();
