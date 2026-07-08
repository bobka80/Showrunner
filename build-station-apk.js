/**
 * Build Showrunner Station APK and copy to Firebase Hosting downloads/.
 * Requires: Android SDK + JDK 17 (Android Studio is the easiest install).
 *
 * Usage: node build-station-apk.js "What changed" "Another fix"
 *   - Release notes are REQUIRED (each arg = one bullet; a single arg may use
 *     ';' or newlines to separate bullets). They appear on the /station-app
 *     download page so the field knows what shipped without asking.
 *   - versionCode auto-increments every build; versionName drops the -dev
 *     suffix then bumps patch (0.1.0-dev -> 0.1.0 -> 0.1.1 -> 0.1.2 ...).
 */
const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const os = require('os');

const root = __dirname;
const androidDir = path.join(root, 'station-android');
const outDir = path.join(root, 'push-hosting', 'public', 'downloads');
const apkDest = path.join(outDir, 'showrunner-station.bin');
const manifestPath = path.join(outDir, 'station-manifest.json');

function log(msg) {
  console.log(msg);
}

function fail(msg) {
  console.error('\nERROR: ' + msg + '\n');
  process.exit(1);
}

const gradlePath = path.join(androidDir, 'app', 'build.gradle.kts');

function readVersionFromGradle() {
  const gradle = fs.readFileSync(gradlePath, 'utf8');
  const name = gradle.match(/versionName\s*=\s*"([^"]+)"/);
  const code = gradle.match(/versionCode\s*=\s*(\d+)/);
  return {
    versionName: name ? name[1] : '0.0.0',
    versionCode: code ? parseInt(code[1], 10) : 1,
  };
}

// Beta convention: drop any -dev/suffix; bump patch only when there was no
// suffix (so the first clean build is 0.1.0, then 0.1.1, 0.1.2 ...).
function nextVersionName(current) {
  const hadSuffix = current.includes('-');
  const base = current.split('-')[0];
  const parts = base.split('.').map((n) => parseInt(n, 10) || 0);
  while (parts.length < 3) parts.push(0);
  if (!hadSuffix) parts[2] += 1;
  return parts.join('.');
}

function writeVersionToGradle(newName, newCode) {
  let gradle = fs.readFileSync(gradlePath, 'utf8');
  gradle = gradle.replace(/versionCode\s*=\s*\d+/, 'versionCode = ' + newCode);
  gradle = gradle.replace(/versionName\s*=\s*"[^"]+"/, 'versionName = "' + newName + '"');
  fs.writeFileSync(gradlePath, gradle);
}

function readReleaseNotes() {
  const args = process.argv.slice(2).filter((a) => a !== '--no-bump');
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

function readExistingHistory() {
  try {
    const prev = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    return Array.isArray(prev.history) ? prev.history : [];
  } catch (e) {
    return [];
  }
}

// The highest versionCode we've ever published (current manifest + its history).
// Android REFUSES to install an APK whose versionCode is lower than the one already
// on the device, silently causing "App not installed". Guard against ever shipping
// a downgrade so the field never gets a build it cannot install over the current one.
function readPublishedMaxVersionCode() {
  try {
    const prev = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    let max = parseInt(prev.versionCode, 10) || 0;
    (Array.isArray(prev.history) ? prev.history : []).forEach((h) => {
      const c = parseInt(h.versionCode, 10) || 0;
      if (c > max) max = c;
    });
    return max;
  } catch (e) {
    return 0;
  }
}

function findGradlew() {
  const win = path.join(androidDir, 'gradlew.bat');
  const unix = path.join(androidDir, 'gradlew');
  if (process.platform === 'win32' && fs.existsSync(win)) return win;
  if (fs.existsSync(unix)) return unix;
  return null;
}

function buildEnv() {
  const env = { ...process.env };
  if (process.platform === 'win32') {
    const jbr = 'C:\\Program Files\\Android\\Android Studio\\jbr';
    if (fs.existsSync(jbr)) env.JAVA_HOME = jbr;
    const sdk = path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk');
    if (fs.existsSync(sdk)) {
      env.ANDROID_HOME = sdk;
      env.ANDROID_SDK_ROOT = sdk;
    }
  }
  return env;
}

function ensureGradleWrapper() {
  if (findGradlew()) return;
  log('Gradle wrapper missing — generating via system gradle…');
  try {
    execSync('gradle wrapper --gradle-version 8.11.1', { cwd: androidDir, stdio: 'inherit' });
  } catch (e) {
    fail(
      'Could not build APK. Install Android Studio, open station-android once (Gradle sync), ' +
      'or install Gradle and run: cd station-android && gradle wrapper'
    );
  }
}

function buildApk() {
  const gradlew = findGradlew();
  if (!gradlew) fail('gradlew not found after wrapper generation.');

  log('\n=== Building Showrunner Station (debug APK) ===\n');
  const args = ['assembleDebug', '--no-daemon'];
  const env = buildEnv();
  const result = process.platform === 'win32'
    ? (() => {
        try {
          execSync(`"${gradlew}" ${args.join(' ')}`, { cwd: androidDir, stdio: 'inherit', env });
          return { status: 0 };
        } catch (e) {
          return { status: e.status || 1 };
        }
      })()
    : spawnSync(gradlew, args, { cwd: androidDir, stdio: 'inherit', env });
  if (result.status !== 0) {
    fail('Gradle build failed. Open station-android in Android Studio and fix build errors.');
  }

  const apkSrcDefault = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
  const localAppData = process.env.LOCALAPPDATA || os.tmpdir();
  const apkSrcLocal = path.join(localAppData, 'ShowrunnerStationBuild', 'app', 'outputs', 'apk', 'debug', 'app-debug.apk');
  const apkSrc = fs.existsSync(apkSrcLocal) ? apkSrcLocal : apkSrcDefault;
  if (!fs.existsSync(apkSrc)) {
    fail('Build finished but APK not found at: ' + apkSrcLocal + ' or ' + apkSrcDefault);
  }
  return apkSrc;
}

function main() {
  const aar = path.join(androidDir, 'app', 'libs', 'DeviceAPI_ver20251103_release.aar');
  if (!fs.existsSync(aar)) {
    fail('Chainway AAR missing. Copy DeviceAPI_ver20251103_release.aar into station-android/app/libs/');
  }

  const noBump = process.argv.includes('--no-bump');

  const notes = readReleaseNotes();
  if (!notes.length) {
    fail(
      'Release notes are required so the download page shows what shipped.\n' +
      '  Example: node build-station-apk.js "Fixed gun pairing" "Fixed install screen"\n' +
      '  (one arg per bullet, or separate bullets with ; )'
    );
  }

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // Bump version BEFORE building so the APK embeds the new version.
  const current = readVersionFromGradle();
  let newName = current.versionName;
  let newCode = current.versionCode;
  if (!noBump) {
    newName = nextVersionName(current.versionName);
    newCode = current.versionCode + 1;
    writeVersionToGradle(newName, newCode);
    log(`Version: ${current.versionName} (build ${current.versionCode}) -> ${newName} (build ${newCode})`);
  } else {
    log(`Version: ${newName} (build ${newCode}) — no bump (--no-bump)`);
  }

  // Downgrade guard: a versionCode <= the last published build cannot install over the
  // app already on the tablet (Android blocks it). Fail loudly instead of shipping a dud.
  const publishedMax = readPublishedMaxVersionCode();
  if (newCode < publishedMax) {
    fail(
      `versionCode ${newCode} is LOWER than the already-published build ${publishedMax}.\n` +
      `  Android will reject it with "App not installed" on any device running ${publishedMax}.\n` +
      `  Bump versionCode above ${publishedMax} in station-android/app/build.gradle.kts, or drop --no-bump.`
    );
  }
  if (newCode === publishedMax) {
    log(`  Note: rebuilding the SAME build number (${newCode}) — installs only over build ${newCode}, not a new update.`);
  }

  ensureGradleWrapper();
  const apkSrc = buildApk();

  fs.copyFileSync(apkSrc, apkDest);
  const stat = fs.statSync(apkDest);
  const builtAt = new Date().toISOString();

  const entry = {
    versionName: newName,
    versionCode: newCode,
    date: builtAt,
    notes: notes,
  };
  const history = [entry].concat(readExistingHistory()).slice(0, 20);

  const manifest = {
    versionName: newName,
    versionCode: newCode,
    apkFile: 'showrunner-station.bin',
    published: true,
    updatedAt: builtAt,
    sizeBytes: stat.size,
    notes: notes,
    history: history,
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

  log('\n=== Station APK ready ===');
  log('  ' + apkDest);
  log('  ' + (stat.size / 1024 / 1024).toFixed(2) + ' MB');
  log('  v' + newName + ' (build ' + newCode + ') — ' + notes.length + ' note(s)');
  log('\nNext: node deploy-hosting.js\n');
}

main();
