const fs = require('fs');
const { spawn } = require('child_process');
const build = require('./build');

console.log('Starting watch mode...');

let timeout;
fs.watch(__dirname, { recursive: true }, (eventType, filename) => {
  if (filename && (filename.endsWith('.html') || filename.endsWith('.js'))) {
    // Ignore changes inside dist/ or to build scripts
    if (filename.startsWith('dist') || filename === 'build.js' || filename === 'watch.js') return;

    clearTimeout(timeout);
    timeout = setTimeout(() => {
      console.log(`\nDetected change in ${filename}, rebuilding...`);
      try {
        build();
      } catch (err) {
        console.error("Build failed:", err);
      }
    }, 200);
  }
});

console.log('Watching for changes... (You should also run `clasp push --watch` in another terminal to upload the bundled files to Google)');
