/**
 * Firebase Hosting shell — Showrunner iframe + FCM (host-only token save).
 */
(function() {
  const PROD_GAS_EXEC = 'https://script.google.com/macros/s/AKfycbxynTt5JaKQiv1Iu_ahSQBcrBDKpuhz98lac4G-bJO5PMtmvgJr_uKZ1Y58lxOOupSwlw/exec';
  const bannerEl = document.getElementById('push-enable-banner');
  const enableBtn = document.getElementById('push-enable-btn');
  const enableBtnDesk = document.getElementById('push-enable-btn-desk');
  const dockMsgEl = document.getElementById('push-dock-msg');
  const dockStatusEl = document.getElementById('push-dock-status');
  const frame = document.getElementById('app-frame');
  const installPanel = document.getElementById('install-pwa-panel');

  // --- Native station bridge (RFID gun) --------------------------------------
  // The native app injects `AndroidStation` and calls `showrunnerStationDeliverScan`
  // in THIS (top) frame; Showrunner itself runs in the iframe, so we relay by postMessage.
  window.showrunnerStationDeliverScan = function(tag) {
    try {
      if (frame && frame.contentWindow) {
        frame.contentWindow.postMessage({ type: 'SHOWRUNNER_RFID_SCAN', tag: String(tag == null ? '' : tag) }, '*');
      }
    } catch (e) { /* ignore */ }
  };

  function relayStationConfigToIframe() {
    if (!frame || !frame.contentWindow) return;
    var cfg = null;
    try {
      if (window.AndroidStation && typeof AndroidStation.getConfig === 'function') {
        cfg = JSON.parse(AndroidStation.getConfig());
      }
    } catch (e) { cfg = null; }
    try { frame.contentWindow.postMessage({ type: 'SHOWRUNNER_STATION_CONFIG', config: cfg }, '*'); } catch (e) { /* ignore */ }
  }

  // --- Mobile QR camera (hosting shell / PWA) ---------------------------------
  // Camera must run on web.app (top window), not inside the GAS iframe — Android
  // PWAs never register camera permission for nested cross-origin frames.
  // User taps START on this overlay (valid gesture) → getUserMedia on shell origin.
  var hostMobileQrEngine = null;
  var hostMobileQrStarting = false;
  var hostMobileQrOverlay = null;
  var hostMobileQrOpen = false;

  function hostMobileScanRelay_(payload) {
    if (!frame || !frame.contentWindow) return;
    try { frame.contentWindow.postMessage(payload, '*'); } catch (e) { /* ignore */ }
  }

  function hostMobileScanEnsureOverlay() {
    if (hostMobileQrOverlay) return hostMobileQrOverlay;
    var el = document.createElement('div');
    el.id = 'sr-mobile-qr-overlay';
    el.setAttribute('style', [
      'position:fixed', 'display:none', 'box-sizing:border-box',
      'z-index:2147483640', 'background:#000',
      'border:1px solid #f97316', 'overflow:hidden'
    ].join(';'));

    var reader = document.createElement('div');
    reader.id = 'sr-host-qr-reader';
    reader.setAttribute('style', 'position:absolute;inset:0;width:100%;height:100%;');

    var tapBtn = document.createElement('button');
    tapBtn.id = 'sr-host-qr-tap';
    tapBtn.type = 'button';
    tapBtn.textContent = 'TAP TO START CAMERA';
    tapBtn.setAttribute('style', [
      'position:absolute', 'inset:0', 'width:100%', 'height:100%',
      'border:none', 'background:#18181b', 'color:#fb923c',
      'font-size:11px', 'font-weight:900', 'letter-spacing:0.08em',
      'cursor:pointer', 'z-index:3', 'touch-action:manipulation'
    ].join(';'));
    tapBtn.addEventListener('click', function(ev) {
      ev.preventDefault();
      ev.stopPropagation();
      hostMobileScanStartEngine_();
    });

    el.appendChild(reader);
    el.appendChild(tapBtn);
    document.body.appendChild(el);

    if (!document.getElementById('sr-host-qr-styles')) {
      var st = document.createElement('style');
      st.id = 'sr-host-qr-styles';
      st.textContent = [
        '#sr-host-qr-reader video { display:block !important; width:100% !important; height:100% !important; object-fit:cover !important; }',
        '#sr-host-qr-reader__dashboard_section_csr span, #sr-host-qr-reader__dashboard_section_swaplink { display:none !important; }'
      ].join('\n');
      document.head.appendChild(st);
    }

    hostMobileQrOverlay = el;
    return el;
  }

  function hostMobileScanPositionOverlay_(rect) {
    var overlay = hostMobileScanEnsureOverlay();
    if (!rect || !rect.width || !rect.height) {
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '42vh';
      return;
    }
    overlay.style.top = Math.max(0, Math.round(rect.top)) + 'px';
    overlay.style.left = Math.max(0, Math.round(rect.left)) + 'px';
    overlay.style.width = Math.round(rect.width) + 'px';
    overlay.style.height = Math.round(rect.height) + 'px';
  }

  function hostMobileScanStopEngine_() {
    hostMobileQrStarting = false;
    if (!hostMobileQrEngine) return;
    var eng = hostMobileQrEngine;
    hostMobileQrEngine = null;
    eng.stop().then(function() {
      try { eng.clear(); } catch (e) { /* ignore */ }
    }).catch(function() {
      try { eng.clear(); } catch (e2) { /* ignore */ }
    });
  }

  function hostMobileScanOpen_(rect) {
    hostMobileQrOpen = true;
    hostMobileScanStopEngine_();
    hostMobileScanPositionOverlay_(rect);
    var overlay = hostMobileScanEnsureOverlay();
    overlay.style.display = 'block';
    var tapBtn = document.getElementById('sr-host-qr-tap');
    if (tapBtn) tapBtn.style.display = 'block';
  }

  function hostMobileScanStartEngine_() {
    if (typeof Html5Qrcode === 'undefined') {
      hostMobileScanRelay_({ type: 'SHOWRUNNER_MOBILE_QR_SCAN_ERROR', message: 'Camera scanner failed to load.' });
      return;
    }
    if (hostMobileQrEngine || hostMobileQrStarting) return;
    hostMobileQrStarting = true;

    function onFail(err) {
      hostMobileQrStarting = false;
      hostMobileScanStopEngine_();
      var tapBtn = document.getElementById('sr-host-qr-tap');
      if (tapBtn) tapBtn.style.display = 'block';
      hostMobileScanRelay_({
        type: 'SHOWRUNNER_MOBILE_QR_SCAN_ERROR',
        message: String(err && err.message ? err.message : err)
      });
    }

    function startWithConfig(cameraCfg) {
      hostMobileQrEngine = new Html5Qrcode('sr-host-qr-reader');
      return hostMobileQrEngine.start(
        cameraCfg,
        {
          fps: 10,
          qrbox: function(w, h) {
            var edge = Math.floor(Math.min(w, h) * 0.72);
            return { width: Math.max(edge, 120), height: Math.max(edge, 120) };
          }
        },
        function(decoded) {
          hostMobileScanRelay_({ type: 'SHOWRUNNER_MOBILE_QR_SCAN', text: String(decoded == null ? '' : decoded) });
        },
        function() { /* frame miss */ }
      );
    }

    function afterOk() {
      hostMobileQrStarting = false;
      var tapBtn = document.getElementById('sr-host-qr-tap');
      if (tapBtn) tapBtn.style.display = 'none';
      hostMobileScanRelay_({ type: 'SHOWRUNNER_MOBILE_QR_CAMERA_ACTIVE' });
    }

    if (typeof Html5Qrcode.getCameras === 'function') {
      Html5Qrcode.getCameras().then(function(cams) {
        if (!cams || !cams.length) {
          return startWithConfig({ facingMode: 'environment' });
        }
        var back = null;
        for (var i = 0; i < cams.length; i++) {
          var lab = String(cams[i].label || '').toLowerCase();
          if (lab.indexOf('back') !== -1 || lab.indexOf('rear') !== -1 || lab.indexOf('environment') !== -1) {
            back = cams[i];
            break;
          }
        }
        var pick = back || cams[cams.length - 1];
        return startWithConfig(pick.id);
      }).then(afterOk).catch(function() {
        startWithConfig({ facingMode: 'environment' }).then(afterOk).catch(onFail);
      });
      return;
    }

    startWithConfig({ facingMode: 'environment' }).then(afterOk).catch(onFail);
  }

  function hostMobileScanStop() {
    hostMobileQrOpen = false;
    hostMobileScanStopEngine_();
    if (hostMobileQrOverlay) hostMobileQrOverlay.style.display = 'none';
    var tapBtn = document.getElementById('sr-host-qr-tap');
    if (tapBtn) tapBtn.style.display = 'block';
  }

  function applyStationConfig(key, value) {
    try {
      if (window.AndroidStation) {
        if (key === 'power' && typeof AndroidStation.setPower === 'function') AndroidStation.setPower(parseInt(value, 10));
        else if (key === 'scanMode' && typeof AndroidStation.setScanMode === 'function') AndroidStation.setScanMode(String(value));
        else if (key === 'beep' && typeof AndroidStation.setBeep === 'function') AndroidStation.setBeep(!!value);
        else if (key === 'pollMs' && typeof AndroidStation.setPollMs === 'function') AndroidStation.setPollMs(parseInt(value, 10));
      }
    } catch (e) { /* ignore */ }
    relayStationConfigToIframe();
  }

  // Native app cold-start: cover the "normal phone" hosting chrome with a
  // station splash until the Showrunner station shell mounts (or login is needed).
  var stationSplashTimer = null;
  function showStationSplash() {
    if (document.getElementById('sr-station-splash')) return;
    var el = document.createElement('div');
    el.id = 'sr-station-splash';
    el.setAttribute('style', [
      'position:fixed', 'inset:0', 'z-index:2147483000',
      'display:flex', 'flex-direction:column', 'align-items:center', 'justify-content:center', 'gap:18px',
      'background:#0d0f12', 'color:#e8eaed', 'font-family:Inter,system-ui,sans-serif',
      'letter-spacing:.14em', 'text-align:center'
    ].join(';'));
    el.innerHTML =
      '<div style="width:46px;height:46px;border-radius:50%;border:3px solid rgba(255,255,255,.15);border-top-color:#e11d48;animation:srspin 1s linear infinite"></div>' +
      '<div style="font-size:15px;font-weight:700">SHOWRUNNER<span style="color:#e11d48"> STATION</span></div>' +
      '<div style="font-size:11px;opacity:.55;letter-spacing:.2em">STARTING…</div>' +
      '<style>@keyframes srspin{to{transform:rotate(360deg)}}</style>';
    document.body.appendChild(el);
    // Safety: never let the splash block login/use if the shell never pings ready.
    stationSplashTimer = setTimeout(hideStationSplash, 12000);
  }
  function hideStationSplash() {
    if (stationSplashTimer) { clearTimeout(stationSplashTimer); stationSplashTimer = null; }
    var el = document.getElementById('sr-station-splash');
    if (!el) return;
    el.style.transition = 'opacity .35s ease';
    el.style.opacity = '0';
    setTimeout(function() { if (el && el.parentNode) el.parentNode.removeChild(el); }, 400);
  }
  if (isNativeStationApp()) showStationSplash();

  // Relay shell-ready / login-needed to the native kiosk splash (StationWebActivity).
  function notifyNativeSplash(method) {
    try {
      if (window.AndroidStation && typeof AndroidStation[method] === 'function') AndroidStation[method]();
    } catch (e) { /* ignore */ }
  }
  // ---------------------------------------------------------------------------
  const installBtn = document.getElementById('install-pwa-btn-install');
  const installDoneBtn = document.getElementById('install-pwa-btn-done');
  const installSkipBtn = document.getElementById('install-pwa-btn-skip');

  const SW_BUILD = '328';
  const SESSION_MS = 30 * 24 * 60 * 60 * 1000;
  let firebaseConfig = null;
  let fcmToken = null;
  let messaging = null;
  let pushStarted = false;
  let foregroundHandlerRegistered = false;
  let pushLinkInFlight = false;
  let lastAccountLinkAt = 0;
  const PUSH_OK_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

  function escapeHostHtml_(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function showHostPushToast(title, body) {
    var container = document.getElementById('host-push-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'host-push-toast-container';
      container.setAttribute('aria-live', 'polite');
      document.body.appendChild(container);
    }
    var toast = document.createElement('div');
    toast.className = 'host-push-toast';
    var safeTitle = escapeHostHtml_(title || 'Showrunner');
    var safeBody = escapeHostHtml_(body || '');
    toast.innerHTML = '<div class="host-push-toast-brand">SHOWRUNNER</div><div class="host-push-toast-title">' + safeTitle + '</div>' +
      (safeBody ? '<div class="host-push-toast-body">' + safeBody + '</div>' : '');
    container.appendChild(toast);
    setTimeout(function() {
      toast.classList.add('host-push-toast--out');
      setTimeout(function() {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 5000);
  }

  function handleForegroundPushPayload(payload) {
    var n = (payload && payload.notification) || {};
    var d = (payload && payload.data) || {};
    var title = (payload && payload.title) || n.title || d.title || 'Showrunner';
    var body = (payload && payload.body) || n.body || d.body || '';
    showHostPushToast(title, body);
    relayForegroundPushToIframe({ title: title, body: body });
  }

  function relayForegroundPushToIframe(payload) {
    if (!frame || !frame.contentWindow) return;
    var n = (payload && payload.notification) || {};
    var d = (payload && payload.data) || {};
    try {
      frame.contentWindow.postMessage({
        type: 'SHOWRUNNER_FOREGROUND_PUSH',
        title: n.title || d.title || 'Showrunner',
        body: n.body || d.body || ''
      }, '*');
    } catch (e) { /* ignore */ }
  }

  function showLocalPushNotification(payload) {
    if (document.hidden) return;
    var n = (payload && payload.notification) || {};
    var d = (payload && payload.data) || {};
    var title = n.title || d.title || 'Showrunner';
    var body = n.body || d.body || '';
    if (Notification.permission !== 'granted') return;
    try {
      new Notification(title, {
        body: body,
        icon: '/icon-192.png',
        tag: 'showrunner-push',
        renotify: true
      });
    } catch (e) {
      logPush('foreground notification failed: ' + ((e && e.message) || e));
    }
  }

  function registerForegroundPushHandler() {
    if (foregroundHandlerRegistered || !firebase.apps.length) return;
    if (!messaging) messaging = firebase.messaging();
    messaging.onMessage(function(payload) {
      logPush('foreground push received');
      handleForegroundPushPayload(payload);
    });
    foregroundHandlerRegistered = true;
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', function(ev) {
      if (ev.data && ev.data.type === 'SHOWRUNNER_FOREGROUND_PUSH') {
        handleForegroundPushPayload(ev.data);
      }
    });
  }
  let pendingBridge = null;
  let pendingFcmAuth = null;
  let regKeySaveInFlight = false;
  let registrationLoopTimer = null;
  let tokenBroadcastTimer = null;
  let serverSaveConfirmed = false;
  let regKeyFailCount = 0;
  let pushResetAttempts = 0;
  let lastPushError = '';
  let iframeLoggedIn = false;
  let lastSessionPing = 0;
  let lastLoginScreenAt = 0;
  let lastCrewName = '';
  let iframeLinkError = '';
  let deferredInstallPrompt = null;
  let shellInitStarted = false;

  function isMobileDevice() {
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  function isIosDevice() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  function isNativeStationApp() {
    // Native Chainway gun app sets " ShowrunnerStation/<ver>" on the WebView UA.
    return /ShowrunnerStation/i.test(navigator.userAgent || '');
  }

  function isStandalonePwa() {
    // The native station app is already "installed" — never nag it to add-to-home-screen.
    return isNativeStationApp() ||
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
  }

  function isIosInBrowserTab() {
    return isIosDevice() && !isStandalonePwa();
  }

  function deviceLabel() {
    if (isStandalonePwa() && isMobileDevice()) return 'pwa-mobile';
    return isMobileDevice() ? 'web-mobile' : 'web-desktop';
  }

  function detectBrowser() {
    var ua = navigator.userAgent || '';
    if (/SamsungBrowser/i.test(ua)) return 'Samsung Internet';
    if (/Edg\//i.test(ua)) return 'Edge';
    if (/OPR\//i.test(ua) || /Opera/i.test(ua)) return 'Opera';
    if (/Firefox\//i.test(ua)) return 'Firefox';
    if (/CriOS/i.test(ua)) return 'Chrome';
    if (/Chrome\//i.test(ua) && !/Edg/i.test(ua)) return 'Chrome';
    if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) return 'Safari';
    return 'Browser';
  }

  function detectPlatform() {
    var ua = navigator.userAgent || '';
    var plat = navigator.platform || '';
    if (/iPhone/i.test(ua)) return 'iPhone';
    if (/iPad/i.test(ua) || (plat === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'iPad';
    if (/Android/i.test(ua)) return 'Android';
    if (/Mac/i.test(plat) || /Macintosh/i.test(ua)) return 'macOS';
    if (/Win/i.test(plat)) return 'Windows';
    if (/CrOS/i.test(ua)) return 'Chrome OS';
    if (/Linux/i.test(plat)) return 'Linux';
    return plat || 'Unknown';
  }

  function getDeviceMeta(crewName) {
    var mobile = isMobileDevice();
    return {
      crewName: crewName || lastCrewName || '',
      formFactor: mobile ? 'mobile' : 'desktop',
      platform: detectPlatform(),
      browser: detectBrowser(),
      delivery: isStandalonePwa() ? 'PWA' : 'Browser'
    };
  }

  function deviceMetaQueryParam(crewName) {
    try {
      return encodeURIComponent(JSON.stringify(getDeviceMeta(crewName)));
    } catch (e) {
      return '';
    }
  }

  function logPush(msg) {
    try { console.log('[Showrunner push]', msg); } catch (e) { /* ignore */ }
  }

  function isPushServiceError(err) {
    return /push service error|registration failed/i.test(String((err && err.message) || err || ''));
  }

  function formatPushError(err) {
    var msg = (err && err.message) ? err.message : String(err || 'init failed');
    if (isPushServiceError(err)) {
      if (isIosInBrowserTab()) return 'iPhone: open from home screen icon first';
      return 'Push service error — tap Reset below (Xiaomi: enable Chrome autostart)';
    }
    return msg;
  }

  function showPushServiceHelp() {
    setDockMessage('Phone could not reach Google push service.');
    setDockStatus([
      'Step 1: PUSH ERROR',
      'Settings → Apps → Chrome → Autostart ON',
      'Then tap Reset & set up alerts'
    ]);
    if (enableBtn) enableBtn.textContent = 'Reset & set up alerts';
    notifyIframePushState(true, 'Tap Reset & set up alerts in the green bar above.');
  }

  function shouldShowInstallPanel() {
    if (!isMobileDevice()) return false;
    if (isStandalonePwa()) return false;
    try {
      if (localStorage.getItem('sr_pwa_install_skip') === '1') return false;
    } catch (e) { /* ignore */ }
    return true;
  }

  function showInstallPanel() {
    if (!installPanel) return false;
    if (!shouldShowInstallPanel() && !isIosInBrowserTab()) return false;
    installPanel.classList.add('visible');
    document.body.classList.add('install-panel-open');
    var iosSteps = document.getElementById('install-steps-ios');
    var androidSteps = document.getElementById('install-steps-android');
    if (iosSteps) iosSteps.style.display = isIosDevice() ? 'block' : 'none';
    if (androidSteps) androidSteps.style.display = isIosDevice() ? 'none' : 'block';
    if (installBtn) installBtn.style.display = deferredInstallPrompt ? 'block' : 'none';
    return true;
  }

  function hideInstallPanel() {
    if (!installPanel) return;
    installPanel.classList.remove('visible');
    document.body.classList.remove('install-panel-open');
  }

  function readParentSession() {
    try {
      if (isDesktopAutoLoginOff()) return null;
      var token = localStorage.getItem('sm_session_token');
      var exp = parseInt(localStorage.getItem('sm_session_expires') || '0', 10);
      var crewName = localStorage.getItem('sm_crew_name') || '';
      if (!token || token.length < 20 || !exp || exp <= Date.now()) return null;
      return { token: token, expiresAt: exp, crewName: crewName };
    } catch (e) {
      return null;
    }
  }

  function saveParentSession(token, crewName, expiresAt) {
    if (!token) return;
    if (isDesktopAutoLoginOff()) return;
    try {
      localStorage.setItem('sm_session_token', String(token).trim());
      localStorage.setItem('sm_session_expires', String(expiresAt || (Date.now() + SESSION_MS)));
      if (crewName) localStorage.setItem('sm_crew_name', String(crewName).trim());
    } catch (e) { /* ignore */ }
  }

  function clearParentSession() {
    try {
      localStorage.removeItem('sm_session_token');
      localStorage.removeItem('sm_session_expires');
    } catch (e) { /* ignore */ }
  }

  function isDesktopAutoLoginOff() {
    try {
      if (!window.matchMedia('(min-width: 769px)').matches) return false;
      var crew = localStorage.getItem('sm_crew_name') || '';
      var crewKey = String(crew).toLowerCase().trim().replace(/\s+/g, '_');
      if (!crewKey) return false;
      return localStorage.getItem('sm_auto_login_off_' + crewKey) === '1';
    } catch (e) {
      return false;
    }
  }

  function getGasBaseUrl() {
    return PROD_GAS_EXEC || (firebaseConfig && firebaseConfig.gasExecUrl) || '';
  }

  function navigateHostingToLoginGate() {
    clearParentSession();
    iframeLoggedIn = false;
    lastLoginScreenAt = Date.now();
    if (!frame) return;
    var base = getGasBaseUrl();
    if (!base) return;
    try {
      frame.src = base;
    } catch (e) { /* ignore */ }
  }

  function bootstrapCrewFromParentStorage() {
    var ps = readParentSession();
    if (ps && ps.crewName) lastCrewName = ps.crewName;
    if (!lastCrewName) {
      try { lastCrewName = localStorage.getItem('sr_parent_fcm_crew') || ''; } catch (e) { /* ignore */ }
    }
  }

  function buildAppFrameUrl() {
    var base = PROD_GAS_EXEC || (firebaseConfig && firebaseConfig.gasExecUrl) || '';
    var sess = readParentSession();
    if (sess && sess.token) {
      return base + '?action=sessionboot&token=' + encodeURIComponent(sess.token);
    }
    return base;
  }

  function sessionCheckJsonp(token) {
    return new Promise(function(resolve) {
      if (!token) return resolve({ valid: false });
      var cb = '__srSessChk_' + Date.now();
      window[cb] = function(res) {
        delete window[cb];
        resolve(res || { valid: false });
      };
      var base = PROD_GAS_EXEC || (firebaseConfig && firebaseConfig.gasExecUrl) || '';
      if (!base) return resolve({ valid: false });
      var script = document.createElement('script');
      script.src = base + '?action=sessioncheck&token=' + encodeURIComponent(token) + '&callback=' + encodeURIComponent(cb);
      script.onerror = function() {
        delete window[cb];
        resolve({ valid: false });
      };
      document.head.appendChild(script);
    });
  }

  async function resolveAppFrameUrl() {
    var base = PROD_GAS_EXEC || (firebaseConfig && firebaseConfig.gasExecUrl) || '';
    var sess = readParentSession();
    if (!sess || !sess.token) return base;
    var check = await sessionCheckJsonp(sess.token);
    if (check && check.valid) {
      saveParentSession(
        sess.token,
        check.crewName || sess.crewName,
        check.expiresAt || sess.expiresAt
      );
      return base + '?action=sessionboot&token=' + encodeURIComponent(sess.token);
    }
    clearParentSession();
    return base;
  }

  function startShellOnce() {
    if (shellInitStarted) return;
    shellInitStarted = true;
    bootstrapCrewFromParentStorage();
    initShell();
  }

  function notifyIframePushState(needsAttention, message) {
    if (!frame || !frame.contentWindow) return;
    try {
      frame.contentWindow.postMessage({
        type: 'SHOWRUNNER_PUSH_STATE',
        needsAttention: !!needsAttention,
        message: message || ''
      }, '*');
    } catch (e) { /* ignore */ }
  }

  function syncDockLayout() {
    var dock = document.getElementById('push-mobile-dock');
    if (!dock || !frame) return;
    function apply() {
      if (document.body.classList.contains('push-dock-open')) {
        var h = Math.max(dock.offsetHeight, dock.scrollHeight, 120);
        frame.style.top = h + 'px';
        frame.style.height = 'calc(100% - ' + h + 'px)';
      } else {
        frame.style.top = '0';
        frame.style.height = '100%';
      }
    }
    apply();
    requestAnimationFrame(function() {
      apply();
      requestAnimationFrame(apply);
    });
  }

  var dockEl = document.getElementById('push-mobile-dock');
  if (dockEl && typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(function() { syncDockLayout(); }).observe(dockEl);
  }
  window.addEventListener('resize', syncDockLayout);

  function setDockStatus(lines) {
    if (!dockStatusEl) return;
    var text = Array.isArray(lines) ? lines.join(' · ') : String(lines || '');
    dockStatusEl.textContent = text;
    logPush(text);
  }

  function setDockMessage(msg) {
    if (dockMsgEl) dockMsgEl.textContent = msg;
  }

  function showPushPrompt(mode) {
    var m = mode || 'allow';
    if (isIosInBrowserTab()) {
      showInstallPanel();
      notifyIframePushState(true, 'Add Showrunner to your home screen first (Share → Add to Home Screen).');
      return;
    }
    if (isMobileDevice()) {
      document.body.classList.add('push-dock-open');
      if (bannerEl) bannerEl.classList.add('hidden');
      hideInstallPanel();
      if (m === 'denied') {
        setDockMessage('Notifications blocked. Allow web.app in browser settings, then retry.');
        setDockStatus(['Step 1: BLOCKED', 'Site settings → Notifications → Allow']);
        if (enableBtn) enableBtn.textContent = 'I fixed it — retry';
      } else if (m === 'retry') {
        setDockMessage('Tap below to register this device for shift alerts.');
        if (enableBtn) {
          enableBtn.textContent = lastPushError && isPushServiceError({ message: lastPushError })
            ? 'Reset & set up alerts'
            : 'Set up shift alerts';
        }
      } else {
        setDockMessage('Allow notifications to get shift and task alerts on this device.');
        if (enableBtn) enableBtn.textContent = 'Allow notifications';
      }
      notifyIframePushState(true, 'Tap Allow notifications in the green bar above.');
      syncDockLayout();
      return;
    }
    if (bannerEl) bannerEl.classList.remove('hidden');
    notifyIframePushState(true, '');
    syncDockLayout();
  }

  function hidePushPrompt() {
    document.body.classList.remove('push-dock-open', 'push-dock-saved');
    if (bannerEl) bannerEl.classList.add('hidden');
    notifyIframePushState(false, '');
    syncDockLayout();
  }

  function showPushDockLinking() {
    if (!isMobileDevice() || serverSaveConfirmed) return;
    document.body.classList.add('push-dock-open');
    document.body.classList.remove('push-dock-saved');
    if (bannerEl) bannerEl.classList.add('hidden');
    syncDockLayout();
  }

  function hidePushDockFully() {
    serverSaveConfirmed = true;
    stopRegistrationLoop();
    stopTokenBroadcast();
    hidePushPrompt();
    hideInstallPanel();
    setDockMessage('');
    if (dockStatusEl) dockStatusEl.textContent = '';
    if (enableBtn) {
      enableBtn.textContent = 'Allow notifications';
      enableBtn.style.display = '';
    }
  }

  function showPushSavedCompact() {
    hidePushDockFully();
  }

  function getRegisterBaseUrl() {
    return PROD_GAS_EXEC || (firebaseConfig && firebaseConfig.gasExecUrl) || '';
  }

  function markPushOkLocal(crewName, token) {
    try {
      localStorage.setItem('sr_push_ok', JSON.stringify({
        crew: crewName,
        prefix: String(token || '').slice(0, 12),
        verifiedAt: Date.now()
      }));
    } catch (e) { /* ignore */ }
  }

  function readPushOkLocal(crewName, token) {
    try {
      var cached = JSON.parse(localStorage.getItem('sr_push_ok') || 'null');
      if (!cached || cached.crew !== crewName) return null;
      if (token && cached.prefix && cached.prefix !== String(token).slice(0, 12)) return null;
      if (!cached.verifiedAt || (Date.now() - cached.verifiedAt) > PUSH_OK_MAX_AGE_MS) return null;
      return cached;
    } catch (e) {
      return null;
    }
  }

  function restorePushStateFromLocal(crewName) {
    if (!crewName || !fcmToken) return false;
    var cached = readPushOkLocal(crewName, fcmToken);
    if (!cached) return false;
    hidePushDockFully();
    return true;
  }

  function checkPushRegisteredOnServer(crewName) {
    return new Promise(function(resolve) {
      if (!fcmToken || !crewName) return resolve(false);
      var prefix = fcmToken.slice(0, 12);
      var cached = readPushOkLocal(crewName, fcmToken);
      if (cached) return resolve(true);
      var cb = '__srFcmPing_' + Date.now();
      var url = getRegisterBaseUrl()
        + '?action=fcmping'
        + '&crew=' + encodeURIComponent(crewName)
        + '&tp=' + encodeURIComponent(prefix)
        + '&callback=' + encodeURIComponent(cb);
      var done = false;
      window[cb] = function(res) {
        if (done) return;
        done = true;
        delete window[cb];
        var ok = !!(res && res.registered);
        if (ok) markPushOkLocal(crewName, fcmToken);
        resolve(ok);
      };
      var script = document.createElement('script');
      script.src = url;
      script.onerror = function() {
        if (done) return;
        done = true;
        delete window[cb];
        resolve(!!readPushOkLocal(crewName, fcmToken));
      };
      document.head.appendChild(script);
      setTimeout(function() {
        if (done) return;
        done = true;
        delete window[cb];
        resolve(!!readPushOkLocal(crewName, fcmToken));
      }, 8000);
    });
  }

  async function linkPushToAccountOrSkip(crewName) {
    if (!fcmToken || !crewName) return false;
    if (serverSaveConfirmed) {
      showPushSavedCompact();
      return true;
    }
    if (restorePushStateFromLocal(crewName)) return true;
    if (pushLinkInFlight) return true;
    pushLinkInFlight = true;
    try {
      if (await checkPushRegisteredOnServer(crewName)) {
        logPush('push already registered — skip setup');
        hidePushDockFully();
        return true;
      }
      showPushDockLinking();
      logPush('token ready — auto-linking');
      setDockMessage('Saving alerts through Showrunner…');
      setDockStatus(['Step 1: token OK', 'Step 2: saving via app…']);
      notifyIframePushState(true, 'Setting up alerts — keep the calendar visible below.');
      broadcastTokenToIframe();
      startTokenBroadcastUntilAck();
      requestFcmAuthFromIframe();
      trySaveTokenViaRegKey();
      startRegistrationLoop();
      return true;
    } finally {
      pushLinkInFlight = false;
    }
  }

  function notifyIframeRegistered(success, message) {
    if (!frame || !frame.contentWindow) return;
    try {
      frame.contentWindow.postMessage({
        type: 'SHOWRUNNER_FCM_REGISTERED',
        success: !!success,
        message: message || ''
      }, '*');
    } catch (e) { /* ignore */ }
  }

  function storeParentAuth(auth) {
    if (!auth || !auth.regKey || !auth.crewName) return;
    try {
      localStorage.setItem('sr_parent_fcm_reg_key', auth.regKey);
      localStorage.setItem('sr_parent_fcm_crew', auth.crewName);
    } catch (e) { /* ignore */ }
  }

  function tryRefreshRegKeyFromParent() {
    var oldKey = '';
    try { oldKey = localStorage.getItem('sr_parent_fcm_reg_key') || ''; } catch (e) { /* ignore */ }
    if (!oldKey) return;
    const cb = '__srFcmRef_' + Date.now();
    const url = getRegisterBaseUrl()
      + '?action=fcmrefreshkey'
      + '&oldkey=' + encodeURIComponent(oldKey)
      + '&callback=' + encodeURIComponent(cb);
    window[cb] = function(res) {
      delete window[cb];
      if (res && res.success && res.regKey) {
        logPush('refreshed reg key from parent cache');
        onAccountLink({ regKey: res.regKey, crewName: res.crewName || '' });
      }
    };
    const script = document.createElement('script');
    script.src = url;
    script.onerror = function() { delete window[cb]; };
    document.head.appendChild(script);
  }

  function burstRequestAuthFromIframe() {
    [0, 300, 800, 1500, 3000, 5000, 8000].forEach(function(ms) {
      setTimeout(function() {
        requestFcmAuthFromIframe();
      }, ms);
    });
  }

  function maybePromptForPushIfNeeded(crewName) {
    if (!crewName || serverSaveConfirmed) return;
    if (Notification.permission === 'denied') {
      if (!readPushOkLocal(crewName, fcmToken)) showPushPrompt('denied');
      return;
    }
    if (fcmToken && readPushOkLocal(crewName, fcmToken)) {
      hidePushDockFully();
      return;
    }
    if (fcmToken) {
      checkPushRegisteredOnServer(crewName).then(function(ok) {
        if (ok) hidePushDockFully();
        else if (Notification.permission === 'default') showPushPrompt('allow');
        else linkPushToAccountOrSkip(crewName);
      });
      return;
    }
    if (Notification.permission === 'default' && !readPushOkLocal(crewName, null)) {
      showPushPrompt('allow');
    }
  }

  function handleIframeSession(data) {
    if (!data || !data.crewName) return;
    lastSessionPing = Date.now();
    iframeLoggedIn = true;
    lastCrewName = data.crewName;
    if (data.sessionToken) {
      saveParentSession(data.sessionToken, data.crewName, data.expiresAt);
    }
    onAccountLink({ regKey: data.regKey || '', crewName: data.crewName });
    maybePromptForPushIfNeeded(data.crewName);
  }

  function showStep2Status(elapsed) {
    var crew = (pendingFcmAuth && pendingFcmAuth.crewName) || lastCrewName;
    var recentSession = (Date.now() - lastSessionPing) < 15000;
    var onLoginScreen = (Date.now() - lastLoginScreenAt) < 6000 && !recentSession;
    if (iframeLinkError) {
      setDockMessage('App could not reach Showrunner server to link alerts.');
      setDockStatus(['Step 1: token OK', 'Step 2: server link failed', iframeLinkError]);
      return;
    }
    if (onLoginScreen) {
      setDockMessage('Log in to Showrunner below, then alerts link automatically.');
      setDockStatus(['Step 1: token OK', 'Step 2: log in below']);
    } else if (crew) {
      setDockMessage('Linking alerts to ' + crew + '…');
      if (pendingFcmAuth && pendingFcmAuth.regKey) {
        setDockStatus(['Step 1: token OK', 'Step 2: saving ' + crew + '…']);
      } else {
        setDockStatus(['Step 1: token OK', 'Step 2: linking ' + crew + '…']);
      }
    } else if (recentSession) {
      setDockStatus(['Step 1: token OK', 'Step 2: linking account…']);
    } else if (elapsed >= 8000) {
      setDockMessage('Saving alerts through the Showrunner app below…');
      setDockStatus(['Step 1: token OK', 'Step 2: saving via app…', 'keep calendar visible']);
    } else if (elapsed >= 3000) {
      setDockStatus(['Step 1: token OK', 'Step 2: saving via app…']);
    } else {
      setDockStatus(['Step 1: token OK', 'Step 2: linking account…']);
    }
  }

  function requestFcmAuthFromIframe() {
    if (!frame || !frame.contentWindow) return;
    try {
      frame.contentWindow.postMessage({ type: 'SHOWRUNNER_REQUEST_FCM_AUTH' }, '*');
    } catch (e) { /* ignore */ }
  }

  function requestFcmBridgeFromIframe() {
    if (!frame || !frame.contentWindow) return;
    try {
      frame.contentWindow.postMessage({ type: 'SHOWRUNNER_REQUEST_FCM_BRIDGE' }, '*');
    } catch (e) { /* ignore */ }
  }

  function stopRegistrationLoop() {
    if (registrationLoopTimer) {
      clearInterval(registrationLoopTimer);
      registrationLoopTimer = null;
    }
  }

  function stopTokenBroadcast() {
    if (tokenBroadcastTimer) {
      clearInterval(tokenBroadcastTimer);
      tokenBroadcastTimer = null;
    }
  }

  function broadcastTokenToIframe() {
    if (!fcmToken || !frame || !frame.contentWindow) return;
    try {
      frame.contentWindow.postMessage({
        type: 'SHOWRUNNER_FCM_TOKEN',
        token: fcmToken,
        label: deviceLabel(),
        meta: getDeviceMeta(lastCrewName)
      }, '*');
    } catch (e) { /* ignore */ }
  }

  function startTokenBroadcastUntilAck() {
    if (tokenBroadcastTimer || serverSaveConfirmed || !fcmToken) return;
    broadcastTokenToIframe();
    tokenBroadcastTimer = setInterval(function() {
      if (serverSaveConfirmed) {
        stopTokenBroadcast();
        return;
      }
      broadcastTokenToIframe();
    }, 5000);
    setTimeout(function() { stopTokenBroadcast(); }, 120000);
  }

  function startRegistrationLoop() {
    if (registrationLoopTimer || serverSaveConfirmed) return;
    var elapsed = 0;
    registrationLoopTimer = setInterval(function() {
      if (serverSaveConfirmed || !fcmToken) {
        stopRegistrationLoop();
        return;
      }
      if (!pendingFcmAuth || !pendingFcmAuth.regKey) {
        showStep2Status(elapsed);
        broadcastTokenToIframe();
        requestFcmAuthFromIframe();
        if (elapsed >= 8000) {
          tryRefreshRegKeyFromParent();
          requestFcmBridgeFromIframe();
        }
      } else if (!regKeySaveInFlight) {
        trySaveTokenViaRegKey();
      }
      elapsed += 4000;
      if (elapsed >= 300000) stopRegistrationLoop();
    }, 4000);
  }

  function verifySaveOnServer(regKey) {
    if (!regKey || !fcmToken) return;
    const cb = '__srFcmChk_' + Date.now();
    const tp = encodeURIComponent(fcmToken.slice(0, 12));
    const url = getRegisterBaseUrl()
      + '?action=fcmcheck'
      + '&key=' + encodeURIComponent(regKey)
      + '&tp=' + tp
      + '&callback=' + encodeURIComponent(cb);
    window[cb] = function(res) {
      delete window[cb];
      if (res && res.saved) {
        serverSaveConfirmed = true;
        regKeyFailCount = 0;
        stopRegistrationLoop();
        stopTokenBroadcast();
        markPushOkLocal(lastCrewName, fcmToken);
        setDockStatus(['Step 3: SAVED', (res.deviceCount || 1) + ' device(s)', res.labels || '']);
        showPushSavedCompact();
        notifyIframeRegistered(true, 'Alerts linked to your account.');
      } else if (!regKeySaveInFlight) {
        setDockStatus(['Step 3: checking…', (res && res.message) ? res.message : 'Retrying']);
      }
    };
    const script = document.createElement('script');
    script.src = url;
    script.onerror = function() { delete window[cb]; };
    document.head.appendChild(script);
  }

  function registerTokenViaRegKeyJsonp(regKey) {
    const baseUrl = getRegisterBaseUrl();
    if (!regKey || !baseUrl || !fcmToken || regKeySaveInFlight) return;
    regKeySaveInFlight = true;
    setDockStatus(['Step 2: saving to server…']);
    logPush('saving via login key');

    const cb = '__srFcmKey_' + Date.now();
    const url = baseUrl
      + '?action=fcmregkey'
      + '&key=' + encodeURIComponent(regKey)
      + '&token=' + encodeURIComponent(fcmToken)
      + '&label=' + encodeURIComponent(deviceLabel())
      + '&meta=' + deviceMetaQueryParam(lastCrewName)
      + '&callback=' + encodeURIComponent(cb);

    window[cb] = function(res) {
      delete window[cb];
      regKeySaveInFlight = false;
      if (res && res.success) {
        regKeyFailCount = 0;
        logPush('server accepted token');
        markPushOkLocal(lastCrewName, fcmToken);
        setDockStatus(['Step 2: server accepted', 'Step 3: verifying…']);
        verifySaveOnServer(regKey);
      } else {
        regKeyFailCount += 1;
        var err = (res && res.message) ? res.message : 'rejected';
        logPush('save failed: ' + err);
        setDockStatus(['Step 2: SAVE FAILED', err]);
        notifyIframeRegistered(false, err);
        if (/expired|log in/i.test(err) || regKeyFailCount >= 2) {
          pendingFcmAuth = null;
          requestFcmAuthFromIframe();
        }
        if (regKeyFailCount >= 3 && pendingBridge) {
          registerTokenViaBridgeJsonp(pendingBridge);
        }
      }
    };

    const script = document.createElement('script');
    script.src = url;
    script.onerror = function() {
      delete window[cb];
      regKeySaveInFlight = false;
      regKeyFailCount += 1;
      setDockStatus(['Step 2: NETWORK ERROR', 'Retrying…']);
    };
    document.head.appendChild(script);
  }

  function trySaveTokenViaRegKey() {
    if (!pendingFcmAuth || !pendingFcmAuth.regKey || !fcmToken) return;
    registerTokenViaRegKeyJsonp(pendingFcmAuth.regKey);
  }

  function registerTokenViaBridgeJsonp(data) {
    const baseUrl = getRegisterBaseUrl();
    if (!data || !data.nonce || !baseUrl || !fcmToken) {
      if (data) pendingBridge = data;
      return;
    }
    pendingBridge = null;
    logPush('fallback save via bridge');
    const cb = '__srFcmReg_' + Date.now();
    const url = baseUrl
      + '?action=fcmreg'
      + '&nonce=' + encodeURIComponent(data.nonce)
      + '&token=' + encodeURIComponent(fcmToken)
      + '&label=' + encodeURIComponent(data.label || deviceLabel())
      + '&meta=' + deviceMetaQueryParam(lastCrewName)
      + '&callback=' + encodeURIComponent(cb);
    window[cb] = function(res) {
      delete window[cb];
      if (res && res.success) {
        serverSaveConfirmed = true;
        regKeyFailCount = 0;
        stopRegistrationLoop();
        stopTokenBroadcast();
        markPushOkLocal(lastCrewName, fcmToken);
        logPush('token saved via bridge');
        setDockStatus(['Step 3: SAVED', 'alerts linked']);
        showPushSavedCompact();
        notifyIframeRegistered(true, 'Alerts linked to your account.');
      } else {
        logPush('bridge save failed: ' + ((res && res.message) || 'rejected'));
        notifyIframeRegistered(false, (res && res.message) ? res.message : 'Save rejected');
      }
    };
    const script = document.createElement('script');
    script.src = url;
    script.onerror = function() { delete window[cb]; };
    document.head.appendChild(script);
  }

  function onAccountLink(auth) {
    if (!auth || !auth.crewName) return;
    var now = Date.now();
    if (serverSaveConfirmed && auth.crewName === lastCrewName) return;
    if (now - lastAccountLinkAt < 2000 && auth.crewName === lastCrewName) return;
    lastAccountLinkAt = now;
    iframeLoggedIn = true;
    iframeLinkError = '';
    lastSessionPing = now;
    lastCrewName = auth.crewName;
    if (auth.regKey) {
      storeParentAuth(auth);
      pendingFcmAuth = { regKey: auth.regKey, crewName: auth.crewName };
    } else if (!pendingFcmAuth || !pendingFcmAuth.regKey) {
      tryRefreshRegKeyFromParent();
    }
    if (!fcmToken) {
      if (Notification.permission === 'granted') {
        pushStarted = false;
        obtainFcmToken(false);
      }
      return;
    }
    if (restorePushStateFromLocal(auth.crewName || lastCrewName)) return;
    linkPushToAccountOrSkip(auth.crewName || lastCrewName);
  }

  function loadConfigJsonp() {
    return new Promise(function(resolve, reject) {
      const cb = '__srFcfg_' + Date.now();
      window[cb] = function(cfg) {
        delete window[cb];
        resolve(cfg || {});
      };
      const script = document.createElement('script');
      script.src = PROD_GAS_EXEC + '?action=fcfg&callback=' + encodeURIComponent(cb);
      script.onerror = function() { reject(new Error('Failed to load Firebase config.')); };
      document.head.appendChild(script);
    });
  }

  window.addEventListener('message', function(ev) {
    if (!ev.data) return;
    if (ev.data.type === 'SHOWRUNNER_SESSION_TOKEN') {
      saveParentSession(ev.data.token, ev.data.crewName, ev.data.expiresAt);
      if (ev.data.crewName) lastCrewName = ev.data.crewName;
      return;
    }
    if (ev.data.type === 'SHOWRUNNER_NAVIGATE_LOGIN_GATE') {
      navigateHostingToLoginGate();
      return;
    }
    if (ev.data.type === 'SHOWRUNNER_SESSION_CLEAR') {
      navigateHostingToLoginGate();
      return;
    }
    if (ev.data.type === 'SHOWRUNNER_LOGIN_STATE' && ev.data.loggedIn === false) {
      lastLoginScreenAt = Date.now();
      iframeLoggedIn = false;
      hideStationSplash();
      notifyNativeSplash('loginNeeded');
      if (ev.data.clearSession === true) navigateHostingToLoginGate();
    }
    if (ev.data.type === 'SHOWRUNNER_STATION_READY') {
      hideStationSplash();
      notifyNativeSplash('shellReady');
      return;
    }
    if (ev.data.type === 'SHOWRUNNER_FCM_LINK_ERROR') {
      iframeLinkError = (ev.data.message || 'App server link failed').slice(0, 120);
      logPush('iframe link error: ' + iframeLinkError);
      if (fcmToken && !serverSaveConfirmed) showStep2Status(99999);
    }
    if (ev.data.type === 'SHOWRUNNER_SESSION') {
      handleIframeSession(ev.data);
    }
    if (ev.data.type === 'SHOWRUNNER_APP_READY') {
      handleIframeSession({ crewName: ev.data.crewName || '', regKey: ev.data.regKey || '' });
    }
    if (ev.data.type === 'SHOWRUNNER_FCM_AUTH') {
      handleIframeSession(ev.data);
      if (!serverSaveConfirmed && !fcmToken && Notification.permission !== 'granted') {
        maybePromptForPushIfNeeded(ev.data.crewName || lastCrewName);
      }
    }
    if (ev.data.type === 'SHOWRUNNER_FCM_SAVE_ACK') {
      if (lastCrewName && fcmToken) markPushOkLocal(lastCrewName, fcmToken);
      setDockStatus(['Step 3: SAVED', 'alerts linked to your account']);
      showPushSavedCompact();
    }
    if (ev.data.type === 'SHOWRUNNER_REQUEST_PUSH_PERMISSION') {
      pushStarted = false;
      showPushPrompt(Notification.permission === 'denied' ? 'denied' : 'allow');
    }
    if (ev.data.type === 'SHOWRUNNER_FCM_BRIDGE') {
      registerTokenViaBridgeJsonp(ev.data);
    }
    if (ev.data.type === 'SHOWRUNNER_STATION_CONFIG_GET') {
      relayStationConfigToIframe();
      return;
    }
    if (ev.data.type === 'SHOWRUNNER_STATION_CONFIG_SET') {
      applyStationConfig(ev.data.key, ev.data.value);
      return;
    }
    if (ev.data.type === 'SHOWRUNNER_MOBILE_SCAN_OPEN') {
      hostMobileScanOpen_(ev.data.rect || null);
      return;
    }
    if (ev.data.type === 'SHOWRUNNER_MOBILE_SCAN_REPOSITION') {
      if (hostMobileQrOpen) hostMobileScanPositionOverlay_(ev.data.rect || null);
      return;
    }
    if (ev.data.type === 'SHOWRUNNER_MOBILE_SCAN_STOP') {
      hostMobileScanStop();
      return;
    }
    if (ev.data.type === 'SHOWRUNNER_REQUEST_FCM_TOKEN' && fcmToken && ev.source) {
      try {
        ev.source.postMessage({
          type: 'SHOWRUNNER_FCM_TOKEN',
          token: fcmToken,
          label: deviceLabel(),
          meta: getDeviceMeta(lastCrewName)
        }, '*');
      } catch (e) { /* ignore */ }
      return;
    }
  });

  if (frame) {
    frame.addEventListener('load', function() {
      burstRequestAuthFromIframe();
      if (serverSaveConfirmed) return;
      if (fcmToken) {
        broadcastTokenToIframe();
        if (!readPushOkLocal(lastCrewName, fcmToken)) trySaveTokenViaRegKey();
      }
    });
  }

  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState !== 'visible') return;
    if (!fcmToken || !lastCrewName) return;
    if (serverSaveConfirmed || restorePushStateFromLocal(lastCrewName)) return;
    checkPushRegisteredOnServer(lastCrewName).then(function(ok) {
      if (ok) hidePushDockFully();
    });
  });

  async function deepResetPush() {
    if (messaging) {
      try { await messaging.deleteToken(); } catch (e) { /* ignore */ }
    }
    messaging = null;
    fcmToken = null;
    try {
      var regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(function(r) { return r.unregister(); }));
    } catch (e) { /* ignore */ }
    try {
      if (typeof caches !== 'undefined' && caches.keys) {
        var keys = await caches.keys();
        await Promise.all(keys.map(function(k) { return caches.delete(k); }));
      }
    } catch (e) { /* ignore */ }
    await new Promise(function(r) { setTimeout(r, 2500); });
  }

  async function resetPushRegistration() {
    pushResetAttempts = 0;
    await deepResetPush();
  }

  async function obtainFcmToken(fromUserTap) {
    if (isIosInBrowserTab()) {
      showInstallPanel();
      return false;
    }
    hideInstallPanel();
    setDockStatus(['Step 1: getting alert token…']);

    try {
      var swUrl = '/firebase-messaging-sw.js';
      var reg = await navigator.serviceWorker.register(swUrl);
      if (reg && reg.update) await reg.update();
      await navigator.serviceWorker.ready;
      await new Promise(function(r) { setTimeout(r, fromUserTap ? 400 : 800); });
      if (!messaging) messaging = firebase.messaging();
      registerForegroundPushHandler();

      var lastErr = null;
      for (var i = 0; i < 3; i++) {
        try {
          fcmToken = await messaging.getToken({
            vapidKey: firebaseConfig.vapidKey,
            serviceWorkerRegistration: reg
          });
          if (fcmToken) break;
        } catch (innerErr) {
          lastErr = innerErr;
          if (i < 2) await new Promise(function(r) { setTimeout(r, 2000); });
        }
      }
      if (!fcmToken && lastErr) throw lastErr;
    } catch (err) {
      lastPushError = (err && err.message) ? err.message : String(err);
      if (isPushServiceError(err) && pushResetAttempts < 3) {
        pushResetAttempts += 1;
        setDockStatus(['Step 1: resetting push…', 'try ' + pushResetAttempts + ' of 3']);
        logPush('push service error — deep reset ' + pushResetAttempts);
        await deepResetPush();
        return obtainFcmToken(true);
      }
      throw err;
    }

    pushResetAttempts = 0;
    lastPushError = '';

    if (!fcmToken) {
      setDockStatus(['Step 1: NO TOKEN', 'Check notification permission']);
      if (fromUserTap) showPushPrompt('retry');
      return false;
    }

    var crew = lastCrewName || (pendingFcmAuth && pendingFcmAuth.crewName) || '';
    if (crew) {
      return linkPushToAccountOrSkip(crew);
    }

    if (fromUserTap) {
      logPush('token ready — waiting for login');
      setDockStatus(['Step 1: token OK', 'Log in below to link alerts']);
      notifyIframePushState(true, 'Log in below — alerts link automatically.');
    } else {
      hidePushPrompt();
      logPush('token ready — silent until login');
    }
    return true;
  }

  async function requestNotificationsAndRegister() {
    if (pushStarted) return;
    pushStarted = true;
    try {
      if (!('Notification' in window)) {
        pushStarted = false;
        return;
      }
      var permission = Notification.permission;
      if (permission === 'denied') {
        pushStarted = false;
        showPushPrompt('denied');
        return;
      }
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }
      if (permission !== 'granted') {
        pushStarted = false;
        showPushPrompt(permission === 'denied' ? 'denied' : 'allow');
        return;
      }
      await obtainFcmToken(true);
      if (!fcmToken) pushStarted = false;
    } catch (err) {
      pushStarted = false;
      console.error(err);
      lastPushError = (err && err.message) ? err.message : String(err);
      if (isPushServiceError(err)) {
        showPushServiceHelp();
        showPushPrompt('retry');
      } else {
        setDockStatus(['Step 1: FAILED', formatPushError(err)]);
        if (isIosInBrowserTab()) showInstallPanel();
        else showPushPrompt('retry');
      }
    }
  }

  async function evaluatePushStateOnStartup() {
    if (!('Notification' in window)) return;
    if (isIosInBrowserTab()) {
      showInstallPanel();
      return;
    }

    bootstrapCrewFromParentStorage();
    var cachedCrew = lastCrewName;

    if (Notification.permission === 'denied') {
      if (!cachedCrew || !readPushOkLocal(cachedCrew, fcmToken)) showPushPrompt('denied');
      return;
    }

    if (Notification.permission === 'granted') {
      pushStarted = false;
      try {
        await obtainFcmToken(false);
      } catch (err) {
        logPush('silent token restore failed: ' + formatPushError(err));
        return;
      }
      if (fcmToken && cachedCrew) {
        if (restorePushStateFromLocal(cachedCrew)) return;
        var ok = await checkPushRegisteredOnServer(cachedCrew);
        if (ok) {
          hidePushDockFully();
          return;
        }
      }
      hidePushPrompt();
      return;
    }

    hidePushPrompt();
  }

  async function initShell() {
    if (frame) {
      try {
        frame.src = await resolveAppFrameUrl();
      } catch (e) {
        frame.src = buildAppFrameUrl();
      }
    }
    try {
      firebaseConfig = await loadConfigJsonp();
      if (!firebaseConfig.apiKey || !firebaseConfig.vapidKey || firebaseConfig.vapidKeyValid === false) {
        logPush('config incomplete — app loaded, push setup skipped');
        return;
      }
      firebase.initializeApp({
        apiKey: firebaseConfig.apiKey,
        authDomain: firebaseConfig.authDomain,
        projectId: firebaseConfig.projectId,
        storageBucket: firebaseConfig.storageBucket,
        messagingSenderId: firebaseConfig.messagingSenderId,
        appId: firebaseConfig.appId
      });
      registerForegroundPushHandler();
      await evaluatePushStateOnStartup();
    } catch (err) {
      console.error(err);
      if (!isIosInBrowserTab() && !serverSaveConfirmed) hidePushPrompt();
    }
  }

  function bindPushButton(btn) {
    if (!btn) return;
    function onTap(e) {
      if (e) e.preventDefault();
      pushStarted = false;
      var needsReset = !fcmToken && (lastPushError || Notification.permission === 'granted');
      if (needsReset && isMobileDevice()) {
        deepResetPush().then(function() {
          requestNotificationsAndRegister();
        });
        return;
      }
      if (Notification.permission === 'granted' && !fcmToken) {
        resetPushRegistration().then(requestNotificationsAndRegister);
        return;
      }
      requestNotificationsAndRegister();
    }
    btn.addEventListener('click', onTap);
    btn.addEventListener('touchend', onTap, { passive: false });
  }

  bindPushButton(enableBtn);
  bindPushButton(enableBtnDesk);

  window.addEventListener('beforeinstallprompt', function(e) {
    e.preventDefault();
    deferredInstallPrompt = e;
    if (installBtn) installBtn.style.display = 'block';
  });

  if (installBtn) {
    installBtn.addEventListener('click', function() {
      if (!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      deferredInstallPrompt.userChoice.then(function(choice) {
        deferredInstallPrompt = null;
        if (installBtn) installBtn.style.display = 'none';
        if (choice.outcome === 'accepted') {
          try { localStorage.removeItem('sr_pwa_install_skip'); } catch (err) { /* ignore */ }
        }
      });
    });
  }

  if (installDoneBtn) {
    installDoneBtn.addEventListener('click', function() {
      var sub = installPanel && installPanel.querySelector('.install-sub');
      if (sub) {
        sub.textContent = 'Close this tab and open Showrunner from your home screen icon.';
      }
      try { localStorage.removeItem('sr_pwa_install_skip'); } catch (err) { /* ignore */ }
    });
  }

  if (installSkipBtn) {
    installSkipBtn.addEventListener('click', function() {
      try { localStorage.setItem('sr_pwa_install_skip', '1'); } catch (err) { /* ignore */ }
      hideInstallPanel();
      startShellOnce();
    });
  }

  startShellOnce();
  if (shouldShowInstallPanel()) showInstallPanel();
})();
