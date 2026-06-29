/**
 * Full Apps Script content sync from dist/ — replaces remote files (removes orphans).
 * clasp push alone does NOT delete files removed from dist/; this fixes that.
 *
 * Used by milestone.js and dev-push.js instead of bare `clasp push`.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const CLASP_JSON = path.join(ROOT, '.clasp.json');
const CLASP_RC = path.join(os.homedir(), '.clasprc.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function httpsRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(data ? JSON.parse(data) : {}); } catch (e) { resolve(data); }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 500)}`));
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function postForm(url, form) {
  const body = new URLSearchParams(form).toString();
  const u = new URL(url);
  return httpsRequest({
    hostname: u.hostname,
    path: u.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(body),
    },
  }, body);
}

async function getAccessToken() {
  if (!fs.existsSync(CLASP_RC)) {
    throw new Error('Not logged in to clasp. Run: clasp login');
  }
  const rc = readJson(CLASP_RC);
  const creds = rc.tokens?.default || rc.token;
  if (!creds) throw new Error('No clasp default credentials in ~/.clasprc.json');

  if (creds.access_token && creds.expiry_date && Date.now() < creds.expiry_date - 60000) {
    return creds.access_token;
  }

  const refreshed = await postForm('https://oauth2.googleapis.com/token', {
    client_id: creds.client_id,
    client_secret: creds.client_secret,
    refresh_token: creds.refresh_token,
    grant_type: 'refresh_token',
  });

  creds.access_token = refreshed.access_token;
  creds.expiry_date = Date.now() + (refreshed.expires_in || 3600) * 1000;
  fs.writeFileSync(CLASP_RC, JSON.stringify(rc, null, 2));
  return creds.access_token;
}

function distToGasFiles() {
  if (!fs.existsSync(DIST)) throw new Error('dist/ missing — run node build.js first');

  const files = [];
  for (const name of fs.readdirSync(DIST)) {
    const full = path.join(DIST, name);
    if (!fs.statSync(full).isFile()) continue;
    const source = fs.readFileSync(full, 'utf8');

    if (name === 'appsscript.json') {
      files.push({ name: 'appsscript', type: 'JSON', source });
    } else if (name.endsWith('.html')) {
      files.push({ name: name.replace(/\.html$/i, ''), type: 'HTML', source });
    } else if (name.endsWith('.js')) {
      files.push({ name: name.replace(/\.js$/i, ''), type: 'SERVER_JS', source });
    }
  }

  if (!files.length) throw new Error('dist/ has no pushable files');
  return files;
}

async function gasApiRequest(token, scriptId, method, subPath, payload) {
  const opts = {
    hostname: 'script.googleapis.com',
    path: `/v1/projects/${scriptId}${subPath}`,
    method,
    headers: { Authorization: `Bearer ${token}` },
  };
  if (payload) {
    const body = JSON.stringify(payload);
    opts.headers['Content-Type'] = 'application/json';
    opts.headers['Content-Length'] = Buffer.byteLength(body);
    return httpsRequest(opts, body);
  }
  return httpsRequest(opts);
}

async function gasPushSync() {
  const clasp = readJson(CLASP_JSON);
  const scriptId = String(clasp.scriptId || '').trim();
  if (!scriptId) throw new Error('.clasp.json missing scriptId');

  const token = await getAccessToken();
  const files = distToGasFiles();

  const before = await gasApiRequest(token, scriptId, 'GET', '/content');

  const remoteNames = new Set((before.files || []).map((f) => f.name));
  const localNames = new Set(files.map((f) => f.name));
  const orphans = [...remoteNames].filter((n) => !localNames.has(n));

  await gasApiRequest(token, scriptId, 'PUT', '/content', { files });

  console.log(`GAS sync: ${files.length} file(s) pushed to script ${scriptId.slice(0, 8)}…`);
  if (orphans.length) {
    console.log(`Removed ${orphans.length} orphan(s) from Apps Script: ${orphans.join(', ')}`);
  }
}

if (require.main === module) {
  gasPushSync().catch((err) => {
    console.error('gas-push-sync failed:', err.message);
    process.exit(1);
  });
}

module.exports = gasPushSync;
