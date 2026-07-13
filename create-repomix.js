/**
 * Pack the Showrunner repo for Claude project knowledge (Repomix).
 *
 * Curated pack (~1M tokens): source, docs/ai, deploy/APK/hosting tooling.
 * Excludes vendor Javadoc, clasp pull scratch, build bin/obj, binaries.
 *
 * Usage:
 *   node create-repomix.js
 *   node create-repomix.js --full          # include vendor reference trees (much larger)
 *   node create-repomix.js --split 2mb     # split into numbered parts for upload limits
 *   node create-repomix.js --stdout        # print summary paths only after pack
 *
 * Output: claude-pack/repomix-output.md (or repomix-output_001.md, … when split)
 * Upload the file(s) to your Claude project knowledge tab.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUT_DIR = path.join(ROOT, 'claude-pack');
const INSTRUCTIONS_PATH = path.join(OUT_DIR, 'instructions.md');
const OUTPUT_FILE = path.join(OUT_DIR, 'repomix-output.md');

function parseArgs(argv) {
  const opts = { full: false, split: null, stdout: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--full') opts.full = true;
    else if (a === '--stdout') opts.stdout = true;
    else if (a === '--split') {
      opts.split = argv[i + 1] || '2mb';
      i++;
    }
  }
  return opts;
}

function readSnippet(filePath, maxLines) {
  if (!fs.existsSync(filePath)) return '*File not found.*';
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  return lines.slice(0, maxLines).join('\n');
}

function latestReleaseLine() {
  const raw = readSnippet(path.join(ROOT, 'RELEASES.md'), 25);
  const row = raw.split('\n').find((l) => /^\|\s*\d{4}/.test(l) || /^\|\s*20\d{2}/.test(l));
  return row ? row.trim() : '*See RELEASES.md in pack.*';
}

function buildInstructions() {
  const todoExcerpt = readSnippet(path.join(ROOT, 'docs', 'ai', 'Project_TODO.md'), 45);
  return `# Showrunner — Claude project instructions

Upload this pack to a **Claude project knowledge** tab (persistent context). Use for brainstorming, architecture review, and tracing code paths. **Implementation ships from Cursor** after the director says **OK go**.

## How to navigate

| Start here | Purpose |
|------------|---------|
| \`AI_DOCTRINE.md\` | Mandatory rules, drawers, ship protocol |
| \`docs/ai/README.md\` | Drawer map — where every doc lives |
| \`docs/ai/FILE_MAP.md\` | Module index → which file implements what |
| \`docs/ai/FRAGILE_ZONES.md\` | Dangerous areas — read before suggesting edits |
| \`docs/ai/ARCHITECTURE.md\` | Build pipeline, traps, RBAC boot |
| \`docs/ai/DEPLOY_AND_ROLLBACK.md\` | milestone, rollback, two-layer versioning |

## Operational pipelines (search these paths)

| Topic | Key files |
|-------|-----------|
| **GAS 1MB / ~500K HTML chunks** | \`build.js\` (splits inline JS into \`LogicPayload_*.js\`), \`Index.html\`, \`dist/LogicPayload_*\` |
| **Deploy Apps Script → web.app** | \`milestone.js\`, \`gas-push-sync.js\`, \`gas-node-only.js\`, \`check-google-account.js\` |
| **Firebase hosting (PWA shell)** | \`deploy-hosting.js\`, \`push-hosting/prepare-hosting.js\`, \`push-hosting/public/host-boot.js\`, \`push-hosting/public/index.html\` (\`host-boot.js?v=\` cache bust) |
| **Station APK for warehouse guns** | \`build-station-apk.js\`, \`station-android/\`, \`push-hosting/public/station-manifest.json\`, \`push-hosting/public/downloads/showrunner-station.bin\`, \`/station-app\` page |
| **Station desktop (TSL / WebView2)** | \`build-station-desktop.js\`, \`station-desktop/\` |
| **Mobile QR / session bridge** | \`push-hosting/public/host-boot.js\`, \`01j_Mobile_Scan.html\`, \`Main.js\` sessionboot |
| **RFID station shell** | \`11_Station_Shell.html\` (+ splits), \`Station_Security.js\`, \`station-android/RfidManager.kt\` |

## Director workflow

- **Brainstorm here** — tradeoffs, weaknesses, plans; cite file paths from this pack.
- **Do not** assume you can edit or deploy; Cursor agents run \`node milestone.js\` after **OK go**.
- Plain-language answers; the director does not read code.

## Latest production (from RELEASES.md at pack time)

${latestReleaseLine()}

## Current priorities (excerpt from Project_TODO.md)

\`\`\`markdown
${todoExcerpt}
\`\`\`

*Regenerate this pack after major releases: \`node create-repomix.js\`*
`;
}

function writeRepomixConfig(opts) {
  const configPath = path.join(ROOT, 'repomix.config.json');
  const base = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  base.output.instructionFilePath = 'claude-pack/instructions.md';
  if (opts.split) {
    base.output.splitOutput = opts.split;
  } else {
    delete base.output.splitOutput;
  }
  if (opts.full) {
    base.ignore.customPatterns = base.ignore.customPatterns.filter(
      (p) => p !== 'station-android/CW referense/**' && p !== 'stage-desktop-info/**'
    );
  }
  const runConfigPath = path.join(ROOT, 'repomix.config.run.json');
  fs.writeFileSync(runConfigPath, JSON.stringify(base, null, 2), 'utf8');
  return runConfigPath;
}

function runRepomix(opts) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(INSTRUCTIONS_PATH, buildInstructions(), 'utf8');

  const runConfigPath = writeRepomixConfig(opts);
  const cmd = `npx --yes repomix@latest --config "${runConfigPath}"`;
  console.log('Running Repomix (curated Showrunner pack)…\n');
  execSync(cmd, { cwd: ROOT, stdio: 'inherit', shell: true });
  try {
    fs.unlinkSync(runConfigPath);
  } catch (_) {
    /* optional cleanup */
  }
}

function listOutputs() {
  if (!fs.existsSync(OUT_DIR)) return [];
  return fs
    .readdirSync(OUT_DIR)
    .filter((f) => f.startsWith('repomix-output') && (f.endsWith('.md') || f.endsWith('.xml')))
    .map((f) => path.join(OUT_DIR, f))
    .sort();
}

function printSummary(files) {
  console.log('\n=== DRAG & DROP → Claude / quote.ai project knowledge ===\n');
  for (const f of files) {
    const stat = fs.statSync(f);
    const mb = (stat.size / (1024 * 1024)).toFixed(2);
    console.log(`  PRIMARY: ${f}`);
    console.log(`           (${mb} MB)\n`);
  }
  console.log(`  OPTIONAL: ${INSTRUCTIONS_PATH}`);
  console.log('           (navigation + current priorities)\n');
  console.log('Folder: ' + OUT_DIR);
  console.log('\nSay "create repo mix" in Cursor anytime to regenerate.\n');
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.full) {
    console.log('Note: --full includes vendor reference trees (~10M+ tokens). Prefer curated for Claude.\n');
  }
  runRepomix(opts);
  const outputs = listOutputs();
  if (!outputs.length) {
    console.error('Repomix finished but no output files found in claude-pack/.');
    process.exit(1);
  }
  if (!opts.stdout) printSummary(outputs);
}

main();
