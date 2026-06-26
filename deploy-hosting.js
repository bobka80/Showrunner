/**
 * Prepare Hosting SW config + deploy to Firebase.
 * Usage: node deploy-hosting.js
 */
const { execSync } = require('child_process');
const path = require('path');

const root = path.join(__dirname);
const hostingDir = path.join(root, 'push-hosting');

console.log('\n=== Firebase Hosting deploy ===\n');
execSync('node generate-icons.js', { cwd: hostingDir, stdio: 'inherit' });
execSync('node push-hosting/prepare-hosting.js', { cwd: root, stdio: 'inherit' });
execSync('firebase deploy --only hosting', { cwd: hostingDir, stdio: 'inherit' });
console.log('\nHosting deploy complete.\n');
