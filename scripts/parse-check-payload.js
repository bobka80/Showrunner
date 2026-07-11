const fs = require('fs');
const path = require('path');
const dist = path.join(__dirname, '..', 'dist');
let js = '';
let chunks = 0;
for (let i = 0; i < 99; i++) {
  const f = path.join(dist, 'LogicPayload_' + i + '.js');
  if (!fs.existsSync(f)) break;
  chunks++;
  const code = fs.readFileSync(f, 'utf8');
  const val = eval(code.replace(/^const FRONTEND_CHUNK_\d+ = /, '').replace(/;\s*$/, ''));
  js += val;
}
try {
  new Function(js);
  console.log('parse OK (' + js.length + ' chars, ' + chunks + ' chunks)');
} catch (e) {
  console.error('parse FAIL:', e.message);
  process.exit(1);
}
