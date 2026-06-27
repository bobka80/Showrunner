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
  const installBtn = document.getElementById('install-pwa-btn-install');
  const installDoneBtn = document.getElementById('install-pwa-btn-done');
  const installSkipBtn = document.getElementById('install-pwa-btn-skip');

  const SW_BUILD = '317';
  let firebaseConfig = null;
  let fcmToken = null;
  let messaging = null;
  let pushStarted = false;
  let foregroundHandlerRegistered = false;
  let pushLinkInFlight = false;
  let lastAccountLinkAt = 0;
  const PUSH_OK_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

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
      showLocalPushNotification(payload);
    });
    foregroundHandlerRegistered = true;
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

  function isStandalonePwa() {
    return window.matchMedia('(display-mode: standalone)').matches ||
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

  function startShellOnce() {
    if (shellInitStarted) return;
    shellInitStarted = true;
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
    if (isMobileDevice() && !serverSaveConfirmed && fcmToken && pendingFcmAuth) return;
    document.body.classList.remove('push-dock-open', 'push-dock-saved');
    if (bannerEl) bannerEl.classList.add('hidden');
    notifyIframePushState(false, '');
    syncDockLayout();
  }

  function showPushSavedCompact() {
    serverSaveConfirmed = true;
    stopRegistrationLoop();
    stopTokenBroadcast();
    document.body.classList.add('push-dock-open', 'push-dock-saved');
    if (bannerEl) bannerEl.classList.add('hidden');
    hideInstallPanel();
    setDockMessage('');
    setDockStatus(['✓ Shift alerts active on this device']);
    if (enableBtn) {
      enableBtn.textContent = 'Re-register alerts';
      enableBtn.style.display = 'inline-block';
    }
    notifyIframePushState(false, '');
    syncDockLayout();
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
    serverSaveConfirmed = true;
    showPushSavedCompact();
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
        serverSaveConfirmed = true;
        stopRegistrationLoop();
        stopTokenBroadcast();
        showPushSavedCompact();
        return true;
      }
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

  function handleIframeSession(data) {
    if (!data || !data.crewName) return;
    lastSessionPing = Date.now();
    iframeLoggedIn = true;
    lastCrewName = data.crewName;
    onAccountLink({ regKey: data.regKey || '', crewName: data.crewName });
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
    if (ev.data.type === 'SHOWRUNNER_LOGIN_STATE' && ev.data.loggedIn === false) {
      lastLoginScreenAt = Date.now();
      iframeLoggedIn = false;
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
      if (!fcmToken && Notification.permission !== 'granted') {
        showPushPrompt('allow');
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
      if (ok) {
        serverSaveConfirmed = true;
        showPushSavedCompact();
      }
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

  async function initShell() {
    if (frame) frame.src = PROD_GAS_EXEC;
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
      if (!('Notification' in window)) return;

      if (Notification.permission === 'granted') {
        if (isIosInBrowserTab()) {
          showInstallPanel();
          return;
        }
        pushStarted = false;
        obtainFcmToken(false).catch(function(err) {
          logPush('silent token restore failed: ' + formatPushError(err));
        });
        return;
      }
      if (Notification.permission === 'denied') {
        showPushPrompt('denied');
        return;
      }
      showPushPrompt('allow');
    } catch (err) {
      console.error(err);
      if (!isIosInBrowserTab()) showPushPrompt('allow');
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
