/**
 * Visual Host — local theme playground + bake into Styles / theme engine.
 *
 * Usage:
 *   node visual-host.js
 *   → http://127.0.0.1:4177
 *
 * Bake writes:
 *   theme-registry.json
 *   Styles.html          (:root / :root.theme-light / custom theme var blocks)
 *   07_Core_Globals.html (SM_THEME_REGISTRY + applyTheme)
 *   00b_UI_Hubs.html     (desktop theme <select> options)
 *   Index.html           (mobile theme <select> options)
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const ROOT = __dirname;
const PORT = Number(process.env.VISUAL_HOST_PORT || 4177);
const HOST = process.env.VISUAL_HOST_BIND || '127.0.0.1';

const REGISTRY_PATH = path.join(ROOT, 'theme-registry.json');
const STYLES_PATH = path.join(ROOT, 'Styles.html');
const GLOBALS_PATH = path.join(ROOT, '07_Core_Globals.html');
const HUBS_PATH = path.join(ROOT, '00b_UI_Hubs.html');
const INDEX_PATH = path.join(ROOT, 'Index.html');
const VH_DIR = path.join(ROOT, 'visual-host');

const MARK = {
  darkStart: '/* @THEME_VARS:dark start */',
  darkEnd: '/* @THEME_VARS:dark end */',
  lightStart: '/* @THEME_VARS:light start */',
  lightEnd: '/* @THEME_VARS:light end */',
  customStart: '/* @THEME_CUSTOM start */',
  customEnd: '/* @THEME_CUSTOM end */',
  registryStart: '// @THEME_REGISTRY start',
  registryEnd: '// @THEME_REGISTRY end'
};

function readUtf8(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function writeUtf8(filePath, text) {
  fs.writeFileSync(filePath, text, 'utf8');
}

function loadRegistry() {
  return JSON.parse(readUtf8(REGISTRY_PATH));
}

function validateRegistry(reg) {
  if (!reg || !Array.isArray(reg.themes) || !reg.themes.length) {
    throw new Error('Registry must include themes[]');
  }
  const ids = new Set();
  for (const t of reg.themes) {
    if (!t.id || !/^[a-z][a-z0-9-]{0,31}$/.test(t.id)) {
      throw new Error('Invalid theme id: ' + (t && t.id));
    }
    if (ids.has(t.id)) throw new Error('Duplicate theme id: ' + t.id);
    ids.add(t.id);
    if (!t.tokens || typeof t.tokens !== 'object') {
      throw new Error('Theme missing tokens: ' + t.id);
    }
    if (t.base !== 'dark' && t.base !== 'light') {
      throw new Error('Theme base must be dark|light: ' + t.id);
    }
  }
  if (!ids.has('dark') || !ids.has('light')) {
    throw new Error('Builtin dark and light themes are required');
  }
  return reg;
}

function formatTokenBlock(selector, tokens) {
  const keys = Object.keys(tokens);
  const lines = keys.map((k) => `      ${k}: ${tokens[k]};`);
  return `    ${selector} {\n${lines.join('\n')}\n    }`;
}

function upsertMarkedBlock(source, startMark, endMark, innerCss) {
  const block = `${startMark}\n${innerCss}\n    ${endMark}`;
  const start = source.indexOf(startMark);
  const end = source.indexOf(endMark);
  if (start >= 0 && end > start) {
    return source.slice(0, start) + block + source.slice(end + endMark.length);
  }
  return null;
}

function ensureStylesMarkers(styles) {
  let out = styles;

  if (!out.includes(MARK.darkStart)) {
    const rootRe = /\/\* @INDEX: STYLES -> Core Theme Variables \*\/\s*\/\* --- 1\. CORE THEME & CALENDAR --- \*\/\s*:root \{[\s\S]*?\n    \}/;
    if (!rootRe.test(out)) {
      throw new Error('Could not find :root core theme block in Styles.html');
    }
    out = out.replace(rootRe, (match) => {
      const body = match.replace(/^[\s\S]*?:root \{/, '').replace(/\n    \}$/, '');
      return (
        `/* @INDEX: STYLES -> Core Theme Variables */\n` +
        `    /* --- 1. CORE THEME & CALENDAR --- */\n` +
        `    ${MARK.darkStart}\n` +
        `    :root {${body}\n    }\n` +
        `    ${MARK.darkEnd}`
      );
    });
  }

  if (!out.includes(MARK.lightStart)) {
    const lightRe = /:root\.theme-light \{[\s\S]*?\n    \}/;
    if (!lightRe.test(out)) {
      throw new Error('Could not find :root.theme-light block in Styles.html');
    }
    out = out.replace(lightRe, (match) => {
      return `${MARK.lightStart}\n    ${match}\n    ${MARK.lightEnd}`;
    });
  }

  if (!out.includes(MARK.customStart)) {
    const lightEndIdx = out.indexOf(MARK.lightEnd);
    if (lightEndIdx < 0) throw new Error('Missing light theme end marker');
    const insertAt = lightEndIdx + MARK.lightEnd.length;
    const customBlock =
      `\n\n    ${MARK.customStart}\n` +
      `    /* Custom themes baked by Visual Host (node visual-host.js) */\n` +
      `    ${MARK.customEnd}`;
    out = out.slice(0, insertAt) + customBlock + out.slice(insertAt);
  }

  return out;
}

function bakeStyles(registry) {
  let styles = ensureStylesMarkers(readUtf8(STYLES_PATH));
  const dark = registry.themes.find((t) => t.id === 'dark');
  const light = registry.themes.find((t) => t.id === 'light');

  const darkBlock = formatTokenBlock(':root', dark.tokens);
  const lightBlock = formatTokenBlock(':root.theme-light', light.tokens);

  let next = upsertMarkedBlock(styles, MARK.darkStart, MARK.darkEnd, darkBlock);
  if (!next) throw new Error('Failed to write dark theme vars');
  styles = next;

  next = upsertMarkedBlock(styles, MARK.lightStart, MARK.lightEnd, lightBlock);
  if (!next) throw new Error('Failed to write light theme vars');
  styles = next;

  const customs = registry.themes.filter((t) => t.id !== 'dark' && t.id !== 'light');
  const customInner = customs.length
    ? customs
        .map((t) => formatTokenBlock(`:root.theme-${t.id}`, t.tokens))
        .join('\n\n')
    : '    /* (no custom themes) */';

  next = upsertMarkedBlock(styles, MARK.customStart, MARK.customEnd, customInner);
  if (!next) throw new Error('Failed to write custom theme vars');
  styles = next;

  writeUtf8(STYLES_PATH, styles);
}

function runtimeRegistry(registry) {
  return registry.themes.map((t) => ({
    id: t.id,
    label: t.label,
    base: t.base,
    builtin: !!t.builtin
  }));
}

function bakeGlobals(registry) {
  let src = readUtf8(GLOBALS_PATH);
  const json = JSON.stringify(runtimeRegistry(registry), null, 2)
    .split('\n')
    .map((line, i) => (i === 0 ? line : '  ' + line))
    .join('\n');

  const engine = `${MARK.registryStart}
var SM_THEME_REGISTRY = ${json};
function getThemeRegistryEntry(themeId) {
  var list = typeof SM_THEME_REGISTRY !== 'undefined' ? SM_THEME_REGISTRY : [];
  for (var i = 0; i < list.length; i++) {
    if (list[i].id === themeId) return list[i];
  }
  return null;
}
function populateThemeSelects() {
  var list = typeof SM_THEME_REGISTRY !== 'undefined' ? SM_THEME_REGISTRY : [];
  ['user-theme-select', 'mobile-user-theme-select'].forEach(function(id) {
    var select = document.getElementById(id);
    if (!select) return;
    var current = select.value;
    select.innerHTML = '';
    list.forEach(function(t) {
      var opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = t.label;
      select.appendChild(opt);
    });
    if (current) select.value = current;
  });
}
function changeUserTheme(theme) {
    localStorage.setItem('sm_user_theme', theme);
    applyTheme(theme);
}
function applyTheme(theme) {
    var entry = getThemeRegistryEntry(theme);
    if (!entry) {
        theme = 'dark';
        entry = getThemeRegistryEntry('dark') || { id: 'dark', base: 'dark' };
        try { localStorage.setItem('sm_user_theme', 'dark'); } catch (e) { /* ignore */ }
    }
    var root = document.documentElement;
    var body = document.body;
    Array.prototype.slice.call(root.classList).forEach(function(c) {
      if (c.indexOf('theme-') === 0) root.classList.remove(c);
    });
    Array.prototype.slice.call(body.classList).forEach(function(c) {
      if (c.indexOf('theme-') === 0) body.classList.remove(c);
    });
    if (entry.id === 'light' || entry.base === 'light') {
        root.classList.add('theme-light');
        body.classList.add('theme-light');
    }
    if (entry.id !== 'dark' && entry.id !== 'light') {
        root.classList.add('theme-' + entry.id);
        body.classList.add('theme-' + entry.id);
    }
    ['user-theme-select', 'mobile-user-theme-select'].forEach(function(id) {
        var select = document.getElementById(id);
        if (select) select.value = entry.id;
    });
}
${MARK.registryEnd}`;

  if (src.includes(MARK.registryStart) && src.includes(MARK.registryEnd)) {
    const start = src.indexOf(MARK.registryStart);
    const end = src.indexOf(MARK.registryEnd) + MARK.registryEnd.length;
    src = src.slice(0, start) + engine + src.slice(end);
  } else {
    const oldBlockRe =
      /\/\/ ==========================================\s*\n\/\/ --- THEME ENGINE \(LOCAL PREFERENCES\) ---\s*\n\/\/ ==========================================\s*\n\/\/ @INDEX: GLOBALS -> CSS Theme Engine\s*\nfunction changeUserTheme\(theme\) \{[\s\S]*?\n\}\s*\n\s*\nfunction applyTheme\(theme\) \{[\s\S]*?\n\}/;
    if (!oldBlockRe.test(src)) {
      throw new Error('Could not find theme engine block in 07_Core_Globals.html');
    }
    src = src.replace(
      oldBlockRe,
      `// ==========================================\n` +
        `// --- THEME ENGINE (LOCAL PREFERENCES) ---\n` +
        `// ==========================================\n` +
        `// @INDEX: GLOBALS -> CSS Theme Engine\n` +
        engine
    );
  }

  // Ensure selects are populated on boot near existing theme restore
  src = src.replace(
    /try \{ savedTheme = localStorage\.getItem\('sm_user_theme'\) \|\| 'dark'; \} catch \(e\) \{ \/\* ignore \*\/ \}\s*\n(\s*)applyTheme\(savedTheme\);/g,
    `try { savedTheme = localStorage.getItem('sm_user_theme') || 'dark'; } catch (e) { /* ignore */ }\n` +
      `$1if (typeof populateThemeSelects === 'function') populateThemeSelects();\n` +
      `$1applyTheme(savedTheme);`
  );
  src = src.replace(
    /(let savedTheme = localStorage\.getItem\('sm_user_theme'\) \|\| 'dark';)\s*\n(\s*)applyTheme\(savedTheme\);/g,
    `$1\n$2if (typeof populateThemeSelects === 'function') populateThemeSelects();\n$2applyTheme(savedTheme);`
  );

  writeUtf8(GLOBALS_PATH, src);
}

function buildSelectHtml(registry, indent) {
  const pad = indent || '        ';
  return registry.themes
    .map((t) => `${pad}<option value="${t.id}">${t.label}</option>`)
    .join('\n');
}

function replaceSelectOptions(html, selectId, optionsHtml) {
  const re = new RegExp(
    `(<select[^>]*\\bid="${selectId}"[^>]*>)([\\s\\S]*?)(<\\/select>)`,
    'i'
  );
  if (!re.test(html)) {
    throw new Error('Could not find select#' + selectId);
  }
  return html.replace(re, `$1\n${optionsHtml}\n      $3`);
}

function bakeSelects(registry) {
  let hubs = readUtf8(HUBS_PATH);
  hubs = replaceSelectOptions(hubs, 'user-theme-select', buildSelectHtml(registry, '        '));
  writeUtf8(HUBS_PATH, hubs);

  let index = readUtf8(INDEX_PATH);
  index = replaceSelectOptions(index, 'mobile-user-theme-select', buildSelectHtml(registry, '             '));
  writeUtf8(INDEX_PATH, index);
}

function bakeAll(registryInput) {
  const registry = validateRegistry(registryInput);
  writeUtf8(REGISTRY_PATH, JSON.stringify(registry, null, 2) + '\n');
  bakeStyles(registry);
  bakeGlobals(registry);
  bakeSelects(registry);
  return {
    ok: true,
    registry,
    files: [
      'theme-registry.json',
      'Styles.html',
      '07_Core_Globals.html',
      '00b_UI_Hubs.html',
      'Index.html'
    ]
  };
}

function stylesAsCss() {
  const raw = readUtf8(STYLES_PATH);
  return raw.replace(/^\s*<style>\s*/i, '').replace(/\s*<\/style>\s*$/i, '');
}

function contentType(filePath) {
  if (filePath.endsWith('.html')) return 'text/html; charset=utf-8';
  if (filePath.endsWith('.css')) return 'text/css; charset=utf-8';
  if (filePath.endsWith('.js')) return 'application/javascript; charset=utf-8';
  if (filePath.endsWith('.json')) return 'application/json; charset=utf-8';
  return 'application/octet-stream';
}

function send(res, status, body, type) {
  const buf = Buffer.from(body == null ? '' : String(body), 'utf8');
  res.writeHead(status, {
    'Content-Type': type || 'text/plain; charset=utf-8',
    'Content-Length': buf.length,
    'Cache-Control': 'no-store'
  });
  res.end(buf);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function handleApi(req, res, url) {
  if (url.pathname === '/api/registry' && req.method === 'GET') {
    return send(res, 200, JSON.stringify(loadRegistry()), 'application/json; charset=utf-8');
  }
  if (url.pathname === '/api/styles.css' && req.method === 'GET') {
    return send(res, 200, stylesAsCss(), 'text/css; charset=utf-8');
  }
  if (url.pathname === '/api/bake' && req.method === 'POST') {
    try {
      const raw = await readBody(req);
      const payload = JSON.parse(raw || '{}');
      const result = bakeAll(payload.registry);
      return send(res, 200, JSON.stringify(result), 'application/json; charset=utf-8');
    } catch (err) {
      return send(
        res,
        400,
        JSON.stringify({ ok: false, error: err.message || String(err) }),
        'application/json; charset=utf-8'
      );
    }
  }
  return send(res, 404, JSON.stringify({ error: 'Not found' }), 'application/json; charset=utf-8');
}

function serveStatic(res, filePath) {
  if (!filePath.startsWith(VH_DIR)) {
    return send(res, 403, 'Forbidden');
  }
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    return send(res, 404, 'Not found');
  }
  return send(res, 200, readUtf8(filePath), contentType(filePath));
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${HOST}:${PORT}`);
    if (url.pathname.startsWith('/api/')) {
      return await handleApi(req, res, url);
    }
    let rel = url.pathname === '/' ? '/index.html' : url.pathname;
    rel = path.normalize(rel).replace(/^(\.\.[/\\])+/, '');
    return serveStatic(res, path.join(VH_DIR, rel));
  } catch (err) {
    return send(res, 500, String(err.message || err));
  }
});

if (require.main === module) {
  server.listen(PORT, HOST, () => {
    console.log(`Visual Host theme playground → http://${HOST}:${PORT}`);
    console.log('Edit themes in the browser, then Save theme & bake.');
    console.log('After bake, ship with: node milestone.js "Themes — Visual Host bake"');
  });
}

module.exports = { bakeAll, loadRegistry, validateRegistry };
