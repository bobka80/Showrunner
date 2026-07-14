/**
 * Build Showrunner Station Desktop (TSL 1128 + WebView2 thin shell).
 * Requires: .NET 8 SDK on Windows.
 *
 * Usage: node build-station-desktop.js "What changed"
 *   - Copies a zip to station-desktop/dist/ for field handoff.
 *   - Optional: --self-contained (larger zip, no .NET runtime needed on gate PC)
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const projectDir = path.join(root, 'station-desktop', 'ShowrunnerStationDesktop');
const csproj = path.join(projectDir, 'ShowrunnerStationDesktop.csproj');
const distDir = path.join(root, 'station-desktop', 'dist');

function log(msg) {
  console.log(msg);
}

function fail(msg) {
  console.error('\nERROR: ' + msg + '\n');
  process.exit(1);
}

function readVersion() {
  const xml = fs.readFileSync(csproj, 'utf8');
  const m = xml.match(/<Version>([^<]+)<\/Version>/);
  return m ? m[1].trim() : '0.0.0';
}

function readReleaseNotes() {
  const args = process.argv.slice(2).filter((a) => a !== '--self-contained' && a !== '--no-bump');
  const bullets = [];
  args.forEach((a) => {
    String(a)
      .split(/[;\n]+/)
      .forEach((s) => {
        const t = s.trim();
        if (t) bullets.push(t);
      });
  });
  return bullets;
}

function main() {
  if (!fs.existsSync(csproj)) fail('Project not found: ' + csproj);

  const notes = readReleaseNotes();
  if (!notes.length) {
    fail(
      'Release notes are required.\n' +
        '  Example: node build-station-desktop.js "First TSL gate shell build"'
    );
  }

  const selfContained = process.argv.includes('--self-contained');
  const version = readVersion();
  const publishDir = path.join(projectDir, 'bin', 'publish', 'win-x64');
  const zipName = `ShowrunnerStationDesktop-${version}-win-x64${selfContained ? '-standalone' : ''}.zip`;
  const zipPath = path.join(distDir, zipName);

  if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

  log('\n=== Building Showrunner Station Desktop ===\n');
  log('Version: ' + version);
  log('Mode: ' + (selfContained ? 'self-contained' : 'framework-dependent (.NET 8 runtime required)'));
  log('Notes: ' + notes.join(' · '));

  const iconScript = path.join(root, 'station-desktop', 'scripts', 'generate-app-icon.ps1');
  if (process.platform === 'win32' && fs.existsSync(iconScript)) {
    log('\nGenerating app.ico from mobile apple-touch-icon.png…');
    try {
      execSync(
        `powershell -NoProfile -ExecutionPolicy Bypass -File "${iconScript}"`,
        { stdio: 'inherit' }
      );
    } catch (e) {
      fail('app.ico generation failed. Fix generate-app-icon.ps1 and retry.');
    }
  }

  const scFlag = selfContained ? 'true' : 'false';
  const cmd =
    `dotnet publish "${csproj}" -c Release -r win-x64 ` +
    `--self-contained ${scFlag} -p:PublishSingleFile=false -o "${publishDir}"`;

  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch (e) {
    fail('dotnet publish failed. Install .NET 8 SDK and retry.');
  }

  if (!fs.existsSync(path.join(publishDir, 'ShowrunnerStationDesktop.exe'))) {
    fail('Publish finished but exe not found in ' + publishDir);
  }

  const notesPath = path.join(publishDir, 'RELEASE-NOTES.txt');
  fs.writeFileSync(
    notesPath,
    ['Showrunner Station Desktop v' + version, '', ...notes.map((n) => '- ' + n), ''].join('\n'),
    'utf8'
  );

  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
  if (process.platform === 'win32') {
    execSync(
      `powershell -NoProfile -Command "Compress-Archive -Path '${publishDir}\\*' -DestinationPath '${zipPath}' -Force"`,
      { stdio: 'inherit' }
    );
  } else {
    fail('Zip step requires Windows (Compress-Archive). Publish folder is at: ' + publishDir);
  }

  log('\nDone.');
  log('  Folder: ' + publishDir);
  log('  Zip:    ' + zipPath);
  log('\nField test: pair TSL 1128 in Bluetooth, run bin/publish/win-x64/ShowrunnerStationDesktop.exe (only one copy).\n');
}

main();
