/**
 * Build Showrunner Station APK and copy to Firebase Hosting downloads/.
 * Requires: Android SDK + JDK 17 (Android Studio is the easiest install).
 *
 * Usage: node build-station-apk.js
 */
const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const androidDir = path.join(root, 'station-android');
const outDir = path.join(root, 'push-hosting', 'public', 'downloads');
const apkDest = path.join(outDir, 'showrunner-station.apk');
const manifestPath = path.join(outDir, 'station-manifest.json');

function log(msg) {
  console.log(msg);
}

function fail(msg) {
  console.error('\nERROR: ' + msg + '\n');
  process.exit(1);
}

function readVersionFromGradle() {
  const gradle = fs.readFileSync(path.join(androidDir, 'app', 'build.gradle.kts'), 'utf8');
  const name = gradle.match(/versionName\s*=\s*"([^"]+)"/);
  const code = gradle.match(/versionCode\s*=\s*(\d+)/);
  return {
    versionName: name ? name[1] : '0.0.0',
    versionCode: code ? parseInt(code[1], 10) : 1,
  };
}

function findGradlew() {
  const win = path.join(androidDir, 'gradlew.bat');
  const unix = path.join(androidDir, 'gradlew');
  if (process.platform === 'win32' && fs.existsSync(win)) return win;
  if (fs.existsSync(unix)) return unix;
  return null;
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
  const result = spawnSync(gradlew, ['assembleDebug', '--no-daemon'], {
    cwd: androidDir,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    fail('Gradle build failed. Open station-android in Android Studio and fix build errors.');
  }

  const apkSrc = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
  if (!fs.existsSync(apkSrc)) {
    fail('Build finished but APK not found at: ' + apkSrc);
  }
  return apkSrc;
}

function main() {
  const aar = path.join(androidDir, 'app', 'libs', 'DeviceAPI_ver20251103_release.aar');
  if (!fs.existsSync(aar)) {
    fail('Chainway AAR missing. Copy DeviceAPI_ver20251103_release.aar into station-android/app/libs/');
  }

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  ensureGradleWrapper();
  const apkSrc = buildApk();
  const ver = readVersionFromGradle();

  fs.copyFileSync(apkSrc, apkDest);
  const stat = fs.statSync(apkDest);

  const manifest = {
    versionName: ver.versionName,
    versionCode: ver.versionCode,
    apkFile: 'showrunner-station.apk',
    published: true,
    updatedAt: new Date().toISOString(),
    sizeBytes: stat.size,
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

  log('\n=== Station APK ready ===');
  log('  ' + apkDest);
  log('  ' + (stat.size / 1024 / 1024).toFixed(2) + ' MB');
  log('\nNext: node deploy-hosting.js\n');
}

main();
