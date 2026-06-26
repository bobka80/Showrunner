/**
 * Rasterize icon.svg → PNGs for PWA + iOS (run before hosting deploy).
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const svgPath = path.join(publicDir, 'icon.svg');

if (!fs.existsSync(svgPath)) {
  console.error('Missing public/icon.svg');
  process.exit(1);
}

try {
  require.resolve('sharp');
} catch (e) {
  console.log('Installing sharp (one-time)…');
  execSync('npm install sharp --no-save', { cwd: __dirname, stdio: 'inherit' });
}

const sharp = require('sharp');
const svg = fs.readFileSync(svgPath);

async function main() {
  const sizes = [
    { name: 'icon-192.png', size: 192 },
    { name: 'icon-512.png', size: 512 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'favicon-32.png', size: 32 }
  ];
  for (const { name, size } of sizes) {
    const out = path.join(publicDir, name);
    await sharp(svg).resize(size, size).png().toFile(out);
    console.log('Wrote', name);
  }
}

main().catch(function(err) {
  console.error(err);
  process.exit(1);
});
