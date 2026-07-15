/**
 * Decide when Bugbot should run before ship (AI-controlled gate).
 * Bugbot itself is a Cursor subagent — this module only evaluates policy.
 */
const { norm, detectLayers, stationTouched, isStationFile } = require('./detect');

/** Paths/prefixes that always warrant Bugbot on production ship. */
const FRAGILE_PATTERNS = [
  /^push-hosting\/public\/host-boot\.js$/i,
  /^push-hosting\/public\/index\.html$/i,
  /^Login\.html$/i,
  /^Index\.html$/i,
  /^Main\.js$/i,
  /^Security\.js$/i,
  /^build\.js$/i,
  /^gas-push-sync\.js$/i,
  /^01h_Mobile_Assets\.html$/i,
  /^01j_Mobile_Scan\.html$/i,
  /^02b_Project_Syntax\.html$/i,
  /^02e5_Logic_Sync\.html$/i,
  /^Logistics_Assets\.js$/i,
  /^Logistics_Timeline\.js$/i,
  /^Operations\.js$/i,
  /^11m_Station_Dock_Logic\.html$/i,
  /^11c_Station_Init\.html$/i,
  /station-desktop\/ShowrunnerStationDesktop\/MainWindow\.xaml\.cs$/i,
  /station-desktop\/ShowrunnerStationDesktop\/StationBridge\.cs$/i,
  /station-android\/.*\/RfidManager\.kt$/i,
  /station-android\/.*\/StationWebActivity\.kt$/i,
];

/** Desktop-only changes that are cosmetic — skip Bugbot. */
const DESKTOP_COSMETIC_ONLY = [
  /^station-desktop\/ShowrunnerStationDesktop\/app\.ico$/i,
  /^station-desktop\/scripts\/generate-app-icon\.ps1$/i,
  /^station-desktop\/ShowrunnerStationDesktop\/MainWindow\.xaml$/i,
  /^station-desktop\/ShowrunnerStationDesktop\/ShowrunnerStationDesktop\.csproj$/i,
  /^station-desktop\/RUN-STATION\.bat$/i,
  /^build-station-desktop\.js$/i,
];

function isDocsOrToolingOnly(changedFiles) {
  if (!changedFiles.length) return true;
  return changedFiles.every((f) => {
    const n = norm(f);
    return (
      n.startsWith('docs/') ||
      n.startsWith('.cursor/') ||
      n.startsWith('pre-ship/') ||
      n === 'pre-ship.js' ||
      n.startsWith('claude-pack/') ||
      n === 'RELEASES.md' ||
      n === 'WORKS_LOG.md' ||
      n === 'package.json' ||
      n === 'gas-node-only.js'
    );
  });
}

function matchesAny(file, patterns) {
  const n = norm(file);
  return patterns.some((re) => re.test(n));
}

function countAppSourceFiles(changedFiles) {
  return changedFiles.filter((f) => {
    const n = norm(f);
    if (n.startsWith('docs/') || n.startsWith('.cursor/') || n.startsWith('pre-ship')) return false;
    if (n.includes('/bin/') || n.includes('/obj/')) return false;
    if (n.startsWith('dist/')) return false;
    return /\.(html|js|cs|kt|xaml)$/i.test(n) || n.endsWith('.csproj');
  }).length;
}

function buildCustomInstructions(layers, changedFiles) {
  const hints = [
    'Showrunner pre-ship Bugbot gate — focus regression risk and missing paired changes.',
    'Layers in this ship: ' + (layers.length ? layers.join(', ') : 'none'),
  ];
  if (layers.includes('hosting')) {
    hints.push('If host-boot.js changed, verify index.html host-boot.js?v= was bumped.');
  }
  if (stationTouched(changedFiles)) {
    hints.push('Station dock: check html vs body CSS class pairing, IS_STATION_DEVICE, dock_panel skin.');
  }
  if (layers.includes('gas') && layers.includes('hosting')) {
    hints.push('Two-layer PWA shell + GAS iframe — check session bridge and postMessage paths.');
  }
  if (changedFiles.some((f) => norm(f).includes('01h_Mobile_Assets'))) {
    hints.push('Project Assets: left-pane containment, Back button, Escape confirm on desktop dock.');
  }
  if (changedFiles.some((f) => /^Logistics_|^Operations\.js$/i.test(norm(f).split('/').pop()))) {
    hints.push('DAL hot path: verify save boundaries, no new clearContents in client HTML, Phase 3 concurrency if delta-only.');
  }
  hints.push('Read docs/ai/FRAGILE_ZONES.md zones touched by this diff.');
  return hints.join(' ');
}

/**
 * @returns {{ action: 'skip'|'recommend'|'require', reasons: string[], customInstructions: string }}
 */
function evaluateBugbotPolicy({ changedFiles, layers, forDeploy, label }) {
  const files = changedFiles || [];
  const reasons = [];

  if (process.env.PRE_SHIP_BUGBOT_OK === '1') {
    return {
      action: 'skip',
      reasons: ['PRE_SHIP_BUGBOT_OK=1 — Bugbot already passed this change set'],
      customInstructions: '',
      alreadyCleared: true,
    };
  }

  if (isDocsOrToolingOnly(files)) {
    return { action: 'skip', reasons: ['Docs/tooling/pre-ship only — no app behavior change'], customInstructions: '' };
  }

  const cosmeticDesktop =
    layers.length === 1 &&
    layers[0] === 'desktop' &&
    files.length > 0 &&
    files.every((f) => {
      const n = norm(f);
      return (
        matchesAny(f, DESKTOP_COSMETIC_ONLY) ||
        n.includes('/bin/') ||
        n.includes('/obj/') ||
        n.endsWith('RELEASE-NOTES.txt')
      );
    });
  if (cosmeticDesktop) {
    return { action: 'skip', reasons: ['Desktop cosmetic/build artifacts only (icon, version, publish)'], customInstructions: '' };
  }

  const fragileHits = files.filter((f) => matchesAny(f, FRAGILE_PATTERNS));
  if (fragileHits.length) {
    reasons.push('Fragile-zone files: ' + fragileHits.slice(0, 6).join(', ') + (fragileHits.length > 6 ? '…' : ''));
  }

  if (stationTouched(files) && forDeploy) {
    reasons.push('Station shell modules changed on production ship');
  }

  if (layers.includes('gas') && layers.includes('hosting')) {
    reasons.push('Combined GAS + hosting ship (full PWA stack)');
  }

  if (files.some((f) => /^push-hosting\/public\/host-boot\.js$/i.test(norm(f)))) {
    reasons.push('host-boot.js changed');
  }

  const appFiles = countAppSourceFiles(files);
  if (forDeploy && appFiles >= 5) {
    reasons.push(`Large change set (${appFiles} app source files)`);
  }

  const customInstructions = buildCustomInstructions(layers, files);

  if (fragileHits.length || (stationTouched(files) && forDeploy) || (layers.includes('gas') && layers.includes('hosting'))) {
    return { action: 'require', reasons, customInstructions };
  }

  if (forDeploy && (appFiles >= 3 || layers.includes('hosting') || layers.includes('desktop'))) {
    return { action: 'recommend', reasons: reasons.length ? reasons : ['Production deploy with moderate app diff'], customInstructions };
  }

  if (reasons.length) {
    return { action: 'recommend', reasons, customInstructions };
  }

  return { action: 'skip', reasons: ['Small or isolated change — mechanical pre-ship sufficient'], customInstructions: '' };
}

module.exports = { evaluateBugbotPolicy, FRAGILE_PATTERNS, buildCustomInstructions };
