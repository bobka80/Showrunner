const fs = require('fs');
const path = require('path');

function build() {
  const DIST_DIR = path.join(__dirname, 'dist');
  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR);
  }

  console.log('Building project...');

  // 1. Combine all HTML templates
  let htmlContent = fs.readFileSync('Index.html', 'utf8');
  const includeRegex = /<\?\!\=\s+include\(['"](.*?)['"]\)[^>]*\?>/g;
  
  let match;
  while ((match = includeRegex.exec(htmlContent)) !== null) {
    let fileName = match[1];
    try {
      let fileContent = fs.readFileSync(fileName + '.html', 'utf8');
      htmlContent = htmlContent.split(match[0]).join(fileContent);
      includeRegex.lastIndex = 0;
    } catch (e) {
      console.log("WARNING: Missing included file: " + fileName + ".html");
      htmlContent = htmlContent.split(match[0]).join("<!-- Missing: " + fileName + " -->");
      includeRegex.lastIndex = 0;
    }
  }

  // 2. Extract all inline <script> tags to avoid Google Apps Script Caja parsing bugs & 1MB limit
  let extractedJs = '';
  // This regex matches <script> tags that do NOT have a 'src' attribute
  const scriptRegex = /<script\b(?![^>]*\bsrc\b)[^>]*>([\s\S]*?)<\/script>/gi;
  
  htmlContent = htmlContent.replace(scriptRegex, (fullMatch, scriptCode) => {
    // Append the code to our giant JS payload
    extractedJs += scriptCode + '\n\n';
    // Remove the script tag from the HTML
    return '';
  });

  // 3. Inject Bootloader script to asynchronously fetch and execute the payload
  // This bypasses Google Apps Script's strict HtmlOutput size limits which cause 
  // silent string truncation and 'Uncaught SyntaxError: Invalid or unexpected token' on the frontend
  const bootloader = `
<script>
  console.log('Booting UI... Fetching App Logic...');

  // Station gun: hide mobile shell immediately — do not wait for async LogicPayload.
  // Meta flag (IAM station login) OR ShowrunnerStation WebView UA (Chainway APK).
  (function stationEarlyBoot_() {
    try {
      var meta = document.querySelector('meta[name="station-device"]');
      var fromMeta = meta && String(meta.content).trim() === '1';
      var fromUa = /ShowrunnerStation/i.test(navigator.userAgent || '');
      if (!window.IS_STATION_DEVICE && (fromMeta || fromUa)) {
        window.IS_STATION_DEVICE = true;
        document.documentElement.classList.add('station-device-root');
        var shell = document.getElementById('station-shell');
        if (shell) shell.style.display = 'flex';
      }
      if (!window.IS_STATION_DEVICE) return;
      // Minimal live strip before async LogicPayload (desktop inject may arrive later).
      window.__srPendingRfidScans = window.__srPendingRfidScans || [];
      function __srBootFeed(tag, tid) {
        var t = String(tag || ''), i = String(tid || '');
        window.stationRecentScans = window.stationRecentScans || [];
        window.stationRecentScans.unshift({ tag: t, norm: t.toUpperCase().replace(/[^A-F0-9]/g, ''), tid: i, ts: Date.now() });
        while (window.stationRecentScans.length > 24) window.stationRecentScans.pop();
        if (typeof window.stationRenderScanFeed_ === 'function') {
          try { window.stationRenderScanFeed_(); return; } catch (e) {}
        }
        var list = document.getElementById('station-scan-feed-list');
        if (!list) return;
        var esc = function(v) { return String(v == null ? '' : v).replace(/[<&>]/g, function(c) { return c === '<' ? '&lt;' : (c === '>' ? '&gt;' : '&amp;'); }); };
        var empty = list.querySelector('.station-scan-feed__empty');
        if (empty) empty.remove();
        var row = document.createElement('div');
        row.className = 'station-scan-feed__row is-unknown';
        row.innerHTML = '<span class="name">' + esc(tag) + '</span><span class="time">now</span>';
        list.insertBefore(row, list.firstChild);
        while (list.children.length > 24) list.removeChild(list.lastChild);
      }
      if (typeof window.stationPushScanFeed_ !== 'function') {
        window.stationPushScanFeed_ = function(tag, tid) { __srBootFeed(tag, tid); };
        window.stationPushScanFeed_.__srShim = true;
      }
      if (!window.onStationRfidScan) {
        window.onStationRfidScan = function(tag, tid) {
          var t = String(tag || ''), i = String(tid || '');
          __srBootFeed(t, i);
          window.__srPendingRfidScans.push({ tag: t, tid: i, ts: Date.now() });
        };
        window.onStationRfidScan.__srEarlyBoot = true;
      }
      if (!window.__srEarlyBootMsgBound) {
        window.__srEarlyBootMsgBound = true;
        window.addEventListener('message', function(ev) {
          var d = ev && ev.data;
          if (d && d.type === 'SHOWRUNNER_RFID_SCAN' && typeof window.onStationRfidScan === 'function') {
            window.onStationRfidScan(d.tag, d.tid || '');
          }
        });
      }
      // Do not post SHOWRUNNER_STATION_READY here — only initStationShell_ / stationAnnounceReady_ may signal native splash.
    } catch (e) { /* ignore */ }
  })();

  function showBootFailure(msg) {
    console.error('[Showrunner boot]', msg);
    var el = document.getElementById('sr-boot-failure');
    if (!el) {
      el = document.createElement('div');
      el.id = 'sr-boot-failure';
      el.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#0a0a0c;color:#f4f4f5;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;font-family:Inter,system-ui,sans-serif;';
      el.innerHTML = '<div style="max-width:420px;text-align:center;"><div style="font-size:40px;margin-bottom:12px;">⚠️</div><h2 style="margin:0 0 10px;font-size:18px;color:#ef4444;">Showrunner failed to start</h2><p id="sr-boot-failure-msg" style="margin:0 0 16px;color:#a1a1aa;font-size:13px;line-height:1.5;"></p><button type="button" onclick="location.reload()" style="background:#10b981;border:none;color:#fff;font-weight:800;padding:12px 18px;border-radius:6px;cursor:pointer;">Reload</button></div>';
      document.body.appendChild(el);
    }
    var m = document.getElementById('sr-boot-failure-msg');
    if (m) m.textContent = msg || 'Unknown boot error';
    el.style.display = 'flex';
  }

  // Polyfill for DOMContentLoaded because the JS is injected asynchronously AFTER the DOM is already ready!
  const originalAddEventListener = document.addEventListener;
  document.addEventListener = function(type, listener, options) {
    if (type === 'DOMContentLoaded') {
      setTimeout(listener, 1);
    } else {
      originalAddEventListener.call(document, type, listener, options);
    }
  };

  if (typeof google === 'undefined' || !google.script || !google.script.run) {
    showBootFailure('Google Apps Script bridge missing. Open the Showrunner URL from script.google.com or web.app, not a saved offline copy.');
  } else {
    google.script.run
      .withFailureHandler(function(err) {
        showBootFailure('Could not load app logic: ' + ((err && err.message) ? err.message : String(err)));
      })
      .withSuccessHandler(function(count) {
        if (!count || count < 1) {
          showBootFailure('App logic unavailable (empty payload). Try again in a minute or contact support.');
          return;
        }
        var chunks = [];
        var fetched = 0;
        var failed = false;
        for (var i = 0; i < count; i++) {
          (function(index) {
            google.script.run
              .withFailureHandler(function(err) {
                if (failed) return;
                failed = true;
                showBootFailure('Chunk ' + index + ' failed: ' + ((err && err.message) ? err.message : String(err)));
              })
              .withSuccessHandler(function(chunkStr) {
                if (failed) return;
                chunks[index] = chunkStr || '';
                fetched++;
                if (fetched === count) {
                  try {
                    console.log('App Logic received! Executing...');
                    var jsCode = chunks.join('');
                    var s = document.createElement('script');
                    s.text = jsCode;
                    document.body.appendChild(s);
                    var failEl = document.getElementById('sr-boot-failure');
                    if (failEl) failEl.style.display = 'none';
                  } catch (execErr) {
                    showBootFailure('App logic error: ' + ((execErr && execErr.message) ? execErr.message : String(execErr)));
                  }
                }
              })
              .getFrontendLogicChunk(index);
          })(i);
        }
      })
      .getFrontendLogicChunkCount();
  }
</script>
`;

  htmlContent = htmlContent.replace('</body>', bootloader + '\n</body>');

  // 4. Write the clean HTML shell (which is now just a tiny bootloader)
  fs.writeFileSync(path.join(DIST_DIR, 'Index.html'), htmlContent);
  console.log(`Compiled Index.html (${(htmlContent.length / 1024).toFixed(2)} KB)`);

  // 5. Wrap the extracted Javascript into multiple backend Google Apps Script files
  // This bypasses the Google Apps Script 1MB file size limit which silently truncates large .js files
  if (fs.existsSync(path.join(DIST_DIR, 'LogicPayload.js'))) {
      fs.unlinkSync(path.join(DIST_DIR, 'LogicPayload.js'));
  }
  
  const CHUNK_SIZE = 500000;
  let chunkArray = [];
  for (let i = 0; i < extractedJs.length; i += CHUNK_SIZE) {
      chunkArray.push(extractedJs.substring(i, i + CHUNK_SIZE));
  }

  let masterLogic = `
// @INDEX: PAYLOAD -> Dynamic Frontend Logic Injection
function getFrontendLogicChunkCount() { return ${chunkArray.length}; }
function getFrontendLogicChunk(index) {
`;

  chunkArray.forEach((chunk, index) => {
      const chunkFile = path.join(DIST_DIR, `LogicPayload_${index}.js`);
      const chunkContent = `const FRONTEND_CHUNK_${index} = ${JSON.stringify(chunk)};\n`;
      fs.writeFileSync(chunkFile, chunkContent);
      console.log(`Compiled LogicPayload_${index}.js (${(chunkContent.length / 1024).toFixed(2)} KB)`);
      
      masterLogic += `  if (index === ${index}) return FRONTEND_CHUNK_${index};\n`;
  });

  masterLogic += `  return "";\n}\n`;
  
  fs.writeFileSync(path.join(DIST_DIR, 'LogicPayload_Master.js'), masterLogic);
  console.log(`Compiled LogicPayload_Master.js`);

  // 6. Copy backend .js files, appsscript.json, and Login.html (never Node tooling)
  const NODE_ONLY = require('./gas-node-only');
  const files = fs.readdirSync(__dirname);
  let filesCopied = 0;
  files.forEach(file => {
    if (NODE_ONLY.has(file) || file.startsWith('scratch_') || file.startsWith('temp_')) return;
    if (fs.statSync(path.join(__dirname, file)).isDirectory()) return;

    if (file.endsWith('.js') || file === 'appsscript.json' || file === 'Login.html') {
      fs.copyFileSync(path.join(__dirname, file), path.join(DIST_DIR, file));
      filesCopied++;
    }
  });
  // Remove Node tooling left over from older builds
  NODE_ONLY.forEach(file => {
    const stale = path.join(DIST_DIR, file);
    if (fs.existsSync(stale)) fs.unlinkSync(stale);
  });

  console.log(`Copied ${filesCopied} backend script files to dist/`);
  console.log('Build complete!\n');
}

build();
module.exports = build;
