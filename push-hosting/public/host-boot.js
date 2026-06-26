/**
 * Firebase Hosting shell — loads Showrunner in iframe + registers FCM silently.
 */
(function() {
  const PROD_GAS_EXEC = 'https://script.google.com/macros/s/AKfycbxynTt5JaKQiv1Iu_ahSQBcrBDKpuhz98lac4G-bJO5PMtmvgJr_uKZ1Y58lxOOupSwlw/exec';
  const bannerEl = document.getElementById('push-enable-banner');
  const enableBtn = document.getElementById('push-enable-btn');
  const enableBtnDesk = document.getElementById('push-enable-btn-desk');
  const linkBtn = document.getElementById('push-link-btn');
  const dockMsgEl = document.getElementById('push-dock-msg');
  const dockStatusEl = document.getElementById('push-dock-status');
  const frame = document.getElementById('app-frame');
  let firebaseConfig = null;
  let fcmToken = null;
  let messaging = null;
  let pushStarted = false;
  let pendingBridge = null;
  let pendingFcmAuth = null;
  let regKeySaveInFlight = false;
  let regKeyRetryTimer = null;
  let fcmAuthRequestTimer = null;
  const SW_BUILD = '296';
  let serverSaveConfirmed = false;
  let tokenBroadcastTimer = null;
  const installPanel = document.getElementById('install-pwa-panel');
  const installBtn = document.getElementById('install-pwa-btn-install');
  const installDoneBtn = document.getElementById('install-pwa-btn-done');
  const installSkipBtn = document.getElementById('install-pwa-btn-skip');
  let deferredInstallPrompt = null;
  let shellInitStarted = false;

  function isMobileDevice() {
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  function deviceLabel() {
    if (isStandalonePwa() && isMobileDevice()) return 'pwa-mobile';
    return isMobileDevice() ? 'web-mobile' : 'web-desktop';
  }

  function logPush(msg) {
    try { console.log('[Showrunner push]', msg); } catch (e) { /* ignore */ }
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
    hideInstallPanel();
    initShell();
  }

  function showIosInstallBanner() {
    showInstallPanel();
    document.body.classList.remove('push-dock-open');
    if (bannerEl) bannerEl.classList.add('hidden');
  }

  function hideIosInstallBanner() {
    hideInstallPanel();
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
        var h = Math.max(dock.offsetHeight, dock.scrollHeight, 160);
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
      hideIosInstallBanner();
      if (m === 'denied') {
        setDockMessage('Chrome blocked this site. Fix in Chrome before retrying.');
        setDockStatus(['Step 1: BLOCKED', 'Chrome ⋮ → Settings → Site settings → Notifications → Allow web.app']);
        if (enableBtn) enableBtn.textContent = 'I fixed it — retry';
      } else if (m === 'retry') {
        setDockMessage('Permission OK but phone registration failed. Tap retry (HyperOS: also allow Chrome autostart).');
        if (enableBtn) enableBtn.textContent = 'Retry push setup';
      } else {
        setDockMessage('Tap below — Chrome must show Allow. Required for phone alerts.');
        if (enableBtn) enableBtn.textContent = 'Allow notifications';
      }
      notifyIframePushState(true, 'Tap Save push to my account inside the app.');
      syncDockLayout();
      return;
    }
    if (bannerEl) bannerEl.classList.remove('hidden');
    notifyIframePushState(true, '');
    syncDockLayout();
  }

  function hidePushPrompt() {
    if (isMobileDevice() && !serverSaveConfirmed && fcmToken && pendingFcmAuth) return;
    document.body.classList.remove('push-dock-open');
    if (bannerEl) bannerEl.classList.add('hidden');
    hideIosInstallBanner();
    notifyIframePushState(false, '');
    syncDockLayout();
  }

  function showBanner() {
    if (Notification.permission === 'denied') {
      showPushPrompt('denied');
    } else if (Notification.permission === 'granted' && !fcmToken) {
      showPushPrompt('retry');
    } else {
      showPushPrompt('allow');
    }
  }

  function hideBanner() {
    if (isMobileDevice() && !fcmToken) return;
    hidePushPrompt();
  }

  function getRegisterBaseUrl() {
    return PROD_GAS_EXEC || (firebaseConfig && firebaseConfig.gasExecUrl) || '';
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

  function stopTokenBroadcast() {
    if (tokenBroadcastTimer) {
      clearInterval(tokenBroadcastTimer);
      tokenBroadcastTimer = null;
    }
  }

  function startTokenBroadcast() {
    stopTokenBroadcast();
    if (!fcmToken) return;
    postTokenToApp();
    var elapsed = 0;
    tokenBroadcastTimer = setInterval(function() {
      if (!fcmToken) {
        stopTokenBroadcast();
        return;
      }
      postTokenToApp();
      elapsed += 3000;
      if (elapsed >= 300000) stopTokenBroadcast();
    }, 3000);
  }

  function notifyIframeTokenReady() {
    if (!frame || !frame.contentWindow) return;
    try {
      frame.contentWindow.postMessage({ type: 'SHOWRUNNER_PARENT_TOKEN_READY' }, '*');
    } catch (e) { /* ignore */ }
  }

  function postTokenToTarget(target) {
    if (!fcmToken || !target || !target.postMessage) return;
    try {
      target.postMessage({
        type: 'SHOWRUNNER_FCM_TOKEN',
        token: fcmToken,
        label: deviceLabel()
      }, '*');
    } catch (e) { /* ignore */ }
  }

  function burstTokenToTarget(target) {
    if (!target) return;
    postTokenToTarget(target);
    setTimeout(function() { postTokenToTarget(target); }, 120);
    setTimeout(function() { postTokenToTarget(target); }, 500);
    setTimeout(function() { postTokenToTarget(target); }, 1500);
  }

  function postTokenToApp() {
    if (!fcmToken || !frame || !frame.contentWindow) return;
    postTokenToTarget(frame.contentWindow);
  }

  async function ensureFcmTokenForSave() {
    if (fcmToken) return true;
    if (Notification.permission !== 'granted') return false;
    try {
      return await obtainFcmToken(false);
    } catch (e) {
      logPush('ensure token failed: ' + ((e && e.message) || e));
      return false;
    }
  }

  async function handleSaveRequestFromApp(source) {
    requestFcmAuthFromIframe();
    if (!fcmToken) {
      setDockStatus(['Save requested…', 'getting phone token…']);
      var got = await ensureFcmTokenForSave();
      if (!got) {
        pushStarted = false;
        if (Notification.permission === 'default' || Notification.permission === 'denied') {
          showPushPrompt(Notification.permission === 'denied' ? 'denied' : 'allow');
        } else {
          showPushPrompt('retry');
        }
        if (source) {
          try {
            source.postMessage({
              type: 'SHOWRUNNER_FCM_TOKEN_STATUS',
              hasToken: false,
              permission: Notification.permission,
              message: 'Allow notifications in the green bar above.'
            }, '*');
          } catch (e) { /* ignore */ }
        }
        return;
      }
    }
    burstTokenToTarget(source || (frame && frame.contentWindow));
    trySaveTokenViaRegKey();
    startRegKeyRetryLoop();
    startFcmAuthRequestLoop();
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
        setDockStatus(['Step 3: SAVED', (res.deviceCount || 1) + ' device(s)', res.labels || '']);
        hidePushPrompt();
        notifyIframeRegistered(true);
      } else {
        setDockStatus(['Step 3: NOT SAVED', (res && res.message) ? res.message : 'Retrying…']);
      }
    };
    const script = document.createElement('script');
    script.src = url;
    script.onerror = function() { delete window[cb]; };
    document.head.appendChild(script);
  }

  function requestFcmAuthFromIframe() {
    if (!frame || !frame.contentWindow) return;
    try {
      frame.contentWindow.postMessage({ type: 'SHOWRUNNER_REQUEST_FCM_AUTH' }, '*');
    } catch (e) { /* ignore */ }
  }

  function startFcmAuthRequestLoop() {
    if (fcmAuthRequestTimer) return;
    var elapsed = 0;
    fcmAuthRequestTimer = setInterval(function() {
      if (serverSaveConfirmed || !fcmToken) {
        clearInterval(fcmAuthRequestTimer);
        fcmAuthRequestTimer = null;
        return;
      }
      if (!pendingFcmAuth) {
        requestFcmAuthFromIframe();
        setDockStatus(['Step 1: token OK', 'tap Save push in app below']);
      } else {
        trySaveTokenViaRegKey();
      }
      elapsed += 3000;
      if (elapsed >= 180000) {
        clearInterval(fcmAuthRequestTimer);
        fcmAuthRequestTimer = null;
      }
    }, 3000);
  }

  function registerTokenViaRegKeyJsonp(regKey) {
    const baseUrl = getRegisterBaseUrl();
    if (!regKey || !baseUrl || !fcmToken || regKeySaveInFlight) return;
    regKeySaveInFlight = true;
    setDockStatus(['Step 2: saving to server…']);
    logPush('saving token via login key');

    const cb = '__srFcmKey_' + Date.now();
    const url = baseUrl
      + '?action=fcmregkey'
      + '&key=' + encodeURIComponent(regKey)
      + '&token=' + encodeURIComponent(fcmToken)
      + '&label=' + encodeURIComponent(deviceLabel())
      + '&callback=' + encodeURIComponent(cb);

    window[cb] = function(res) {
      delete window[cb];
      regKeySaveInFlight = false;
      if (res && res.success) {
        logPush('token saved via login key');
        setDockStatus(['Step 2: server accepted', 'Checking…']);
        notifyIframeRegistered(true, 'Saved on server.');
        verifySaveOnServer(regKey);
      } else {
        var err = (res && res.message) ? res.message : 'rejected';
        logPush('login key save failed: ' + err);
        setDockStatus(['Step 2: SAVE FAILED', err]);
        notifyIframeRegistered(false, err);
      }
    };

    const script = document.createElement('script');
    script.src = url;
    script.onerror = function() {
      delete window[cb];
      regKeySaveInFlight = false;
      logPush('login key save failed — network');
      setDockStatus(['Step 2: NETWORK ERROR', 'Could not reach server']);
    };
    document.head.appendChild(script);
  }

  function trySaveTokenViaRegKey() {
    if (!pendingFcmAuth || !pendingFcmAuth.regKey || !fcmToken) return;
    registerTokenViaRegKeyJsonp(pendingFcmAuth.regKey);
  }

  function startRegKeyRetryLoop() {
    if (regKeyRetryTimer) return;
    var elapsed = 0;
    regKeyRetryTimer = setInterval(function() {
      if (!pendingFcmAuth) return;
      if (!fcmToken && isMobileDevice() && Notification.permission !== 'granted') {
        showBanner();
      }
      trySaveTokenViaRegKey();
      elapsed += 4000;
      if (elapsed >= 300000) {
        clearInterval(regKeyRetryTimer);
        regKeyRetryTimer = null;
      }
    }, 4000);
  }

  function registerTokenViaBridgeJsonp(data) {
    const baseUrl = getRegisterBaseUrl();
    if (!data || !data.nonce || !baseUrl) return;
    if (!fcmToken) {
      pendingBridge = data;
      logPush('token pending — waiting for login');
      if (Notification.permission === 'granted') {
        ensureFcmTokenForSave().then(function(got) {
          if (got && pendingBridge) registerTokenViaBridgeJsonp(pendingBridge);
        });
      }
      return;
    }
    pendingBridge = null;
    logPush('saving token via bridge');

    const cb = '__srFcmReg_' + Date.now();
    const url = baseUrl
      + '?action=fcmreg'
      + '&nonce=' + encodeURIComponent(data.nonce)
      + '&token=' + encodeURIComponent(fcmToken)
      + '&label=' + encodeURIComponent(data.label || deviceLabel())
      + '&callback=' + encodeURIComponent(cb);

    window[cb] = function(res) {
      delete window[cb];
      if (res && res.success) {
        logPush('token saved');
        hidePushPrompt();
        hideIosInstallBanner();
        notifyIframeRegistered(true);
      } else {
        logPush('save failed: ' + ((res && res.message) || 'rejected'));
        notifyIframeRegistered(false, (res && res.message) ? res.message : 'Save rejected');
      }
    };

    const script = document.createElement('script');
    script.src = url;
    script.onerror = function() {
      delete window[cb];
      logPush('save failed — network');
      notifyIframeRegistered(false, 'Could not reach server to save token.');
    };
    document.head.appendChild(script);
  }

  function flushPendingBridge() {
    if (pendingBridge && fcmToken) {
      registerTokenViaBridgeJsonp(pendingBridge);
    }
    postTokenToApp();
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
    if (ev.data.type === 'SHOWRUNNER_APP_READY' || ev.data.type === 'SHOWRUNNER_REQUEST_FCM_TOKEN') {
      if (fcmToken) {
        burstTokenToTarget(ev.source || (frame && frame.contentWindow));
      } else if (ev.data.type === 'SHOWRUNNER_REQUEST_FCM_TOKEN') {
        handleSaveRequestFromApp(ev.source);
      }
      if (ev.data.type === 'SHOWRUNNER_APP_READY' && ev.data.regKey) {
        pendingFcmAuth = {
          regKey: ev.data.regKey,
          crewName: ev.data.crewName || ''
        };
        setDockStatus(['Step 1: token OK', 'account found', 'saving…']);
        trySaveTokenViaRegKey();
        startRegKeyRetryLoop();
      }
    }
    if (ev.data.type === 'SHOWRUNNER_REQUEST_FCM_SAVE') {
      handleSaveRequestFromApp(ev.source);
    }
    if (ev.data.type === 'SHOWRUNNER_FCM_SAVE_ACK') {
      stopTokenBroadcast();
      serverSaveConfirmed = true;
      hidePushPrompt();
      logPush('registration confirmed by app');
    }
    if (ev.data.type === 'SHOWRUNNER_REQUEST_PUSH_PERMISSION') {
      pushStarted = false;
      showPushPrompt(Notification.permission === 'denied' ? 'denied' : 'allow');
    }
    if (ev.data.type === 'SHOWRUNNER_FCM_BRIDGE') {
      if (!fcmToken && Notification.permission === 'granted') {
        ensureFcmTokenForSave().then(function() {
          registerTokenViaBridgeJsonp(ev.data);
        });
      } else {
        registerTokenViaBridgeJsonp(ev.data);
      }
    }
    if (ev.data.type === 'SHOWRUNNER_FCM_AUTH') {
      pendingFcmAuth = ev.data;
      setDockStatus(['Step 1: token OK', 'Step 2: saving to server…']);
      if (isMobileDevice() && Notification.permission !== 'granted') {
        showBanner();
      }
      trySaveTokenViaRegKey();
      startRegKeyRetryLoop();
    }
  });

  if (frame) {
    frame.addEventListener('load', function() {
      flushPendingBridge();
    });
  }

  async function resetPushRegistration() {
    if (messaging) {
      try { await messaging.deleteToken(); } catch (e) { /* ignore */ }
    }
    fcmToken = null;
    try {
      var regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(function(r) { return r.unregister(); }));
    } catch (e) { /* ignore */ }
  }

  async function obtainFcmToken(isRetry) {
    if (isIosInBrowserTab()) {
      showIosInstallBanner();
      return false;
    }
    hideIosInstallBanner();
    setDockStatus(['Step 1: getting push token…', 'permission=' + Notification.permission]);

    try {
      var swUrl = '/firebase-messaging-sw.js?build=' + SW_BUILD;
      var reg = await navigator.serviceWorker.register(swUrl);
      if (reg && reg.update) await reg.update();
      await navigator.serviceWorker.ready;
      if (!messaging) messaging = firebase.messaging();

      var attempts = isRetry ? 1 : 3;
      var lastErr = null;
      for (var i = 0; i < attempts; i++) {
        try {
          fcmToken = await messaging.getToken({
            vapidKey: firebaseConfig.vapidKey,
            serviceWorkerRegistration: reg
          });
          if (fcmToken) break;
        } catch (innerErr) {
          lastErr = innerErr;
          if (i < attempts - 1) {
            await new Promise(function(r) { setTimeout(r, 1500); });
          }
        }
      }
      if (!fcmToken && lastErr) throw lastErr;
    } catch (err) {
      if (!isRetry && /push service error/i.test(String(err && err.message))) {
        setDockStatus(['Step 1: push error — resetting', 'HyperOS: allow Chrome autostart']);
        logPush('push service error — retrying after reset');
        await resetPushRegistration();
        return obtainFcmToken(true);
      }
      throw err;
    }

    if (!fcmToken) {
      logPush('no token — check VAPID');
      setDockStatus(['Step 1: NO TOKEN', 'Check Chrome notification permission']);
      showPushPrompt('retry');
      return false;
    }

    logPush('token ready');
    setDockMessage('Token OK — tap Save push inside the app (scroll to top if needed).');
    setDockStatus(['Step 1: token OK', 'tap Save push in app below']);
    notifyIframePushState(true, 'Tap the green Save push to my account button at the top of this app.');
    flushPendingBridge();
    trySaveTokenViaRegKey();
    requestFcmAuthFromIframe();
    startFcmAuthRequestLoop();
    startTokenBroadcast();
    notifyIframeTokenReady();

    messaging.onMessage(function(payload) {
      const title = (payload.notification && payload.notification.title) || 'Showrunner';
      const body = (payload.notification && payload.notification.body) || '';
      if (Notification.permission === 'granted') {
        new Notification(title, { body: body });
      }
    });
    return true;
  }

  async function requestNotificationsAndRegister() {
    if (pushStarted) return;
    pushStarted = true;

    try {
      if (!('Notification' in window)) {
        logPush('not supported in this browser');
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

      await obtainFcmToken(false);
      if (!fcmToken) {
        pushStarted = false;
        showPushPrompt('retry');
      }
    } catch (err) {
      pushStarted = false;
      console.error(err);
      var errMsg = formatTokenError(err);
      logPush(errMsg);
      setDockStatus(['Step 1: FAILED', errMsg]);
      if (isIosInBrowserTab()) {
        showIosInstallBanner();
      } else {
        showPushPrompt('retry');
      }
    }
  }

  function formatTokenError(err) {
    var msg = (err && err.message) ? err.message : String(err || 'init failed');
    if (/push service error/i.test(msg) && isIosInBrowserTab()) {
      return 'iPhone: Add to Home Screen first';
    }
    return msg;
  }

  async function initShell() {
    try {
      logPush('loading config');
      firebaseConfig = await loadConfigJsonp();
      if (!firebaseConfig.apiKey || !firebaseConfig.messagingSenderId || !firebaseConfig.appId) {
        logPush('config incomplete');
        return;
      }
      if (!firebaseConfig.vapidKey || firebaseConfig.vapidKeyValid === false) {
        logPush('VAPID key missing or invalid');
        return;
      }

      if (frame) frame.src = PROD_GAS_EXEC;

      firebase.initializeApp({
        apiKey: firebaseConfig.apiKey,
        authDomain: firebaseConfig.authDomain,
        projectId: firebaseConfig.projectId,
        storageBucket: firebaseConfig.storageBucket,
        messagingSenderId: firebaseConfig.messagingSenderId,
        appId: firebaseConfig.appId
      });

      if (!('Notification' in window)) {
        logPush('not supported');
        return;
      }

      if (Notification.permission === 'granted') {
        pushStarted = true;
        if (isIosInBrowserTab()) {
          showIosInstallBanner();
          return;
        }
        var gotToken = await obtainFcmToken(false);
        if (!gotToken && isMobileDevice()) {
          pushStarted = false;
          showPushPrompt('retry');
        }
        return;
      }

      if (Notification.permission === 'denied') {
        showPushPrompt('denied');
        return;
      }

      showPushPrompt('allow');
      if (isMobileDevice()) {
        setTimeout(function() {
          if (!fcmToken && Notification.permission === 'default') {
            notifyIframePushState(true, 'Tap Allow notifications in the green bar above.');
          }
        }, 2000);
      }
    } catch (err) {
      console.error(err);
      logPush(formatTokenError(err));
      if (!isIosInBrowserTab()) showBanner();
    }
  }

  function bindPushButton(btn) {
    if (!btn) return;
    function onTap(e) {
      if (e) e.preventDefault();
      pushStarted = false;
      if (Notification.permission === 'granted' && !fcmToken) {
        resetPushRegistration().then(function() {
          requestNotificationsAndRegister();
        });
        return;
      }
      requestNotificationsAndRegister();
    }
    btn.addEventListener('click', onTap);
    btn.addEventListener('touchend', onTap, { passive: false });
  }

  bindPushButton(enableBtn);
  bindPushButton(enableBtnDesk);
  if (linkBtn) {
    function onLinkTap(e) {
      if (e) e.preventDefault();
      linkBtn.style.opacity = '0.7';
      setTimeout(function() { linkBtn.style.opacity = '1'; }, 150);
      setDockStatus(['Tapped — linking…']);
      requestFcmAuthFromIframe();
      trySaveTokenViaRegKey();
      startFcmAuthRequestLoop();
    }
    linkBtn.addEventListener('click', onLinkTap);
    linkBtn.addEventListener('touchend', onLinkTap, { passive: false });
  }

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
        installBtn.style.display = 'none';
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
        sub.textContent = 'Close this browser tab, then open Showrunner from your home screen icon. Alerts and full-screen mode work from the icon only.';
      }
      try { localStorage.removeItem('sr_pwa_install_skip'); } catch (err) { /* ignore */ }
    });
  }

  if (installSkipBtn) {
    installSkipBtn.addEventListener('click', function() {
      try { localStorage.setItem('sr_pwa_install_skip', '1'); } catch (err) { /* ignore */ }
      startShellOnce();
    });
  }

  if (shouldShowInstallPanel()) {
    showInstallPanel();
  } else {
    startShellOnce();
  }
})();
