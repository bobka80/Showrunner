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
  const SW_BUILD = '292';
  let serverSaveConfirmed = false;
  let tokenBroadcastTimer = null;

  function isMobileDevice() {
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  function deviceLabel() {
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

  function showIosInstallBanner() {
    var iosBanner = document.getElementById('push-ios-banner');
    if (iosBanner) iosBanner.classList.remove('hidden');
    document.body.classList.remove('push-dock-open');
    if (bannerEl) bannerEl.classList.add('hidden');
  }

  function hideIosInstallBanner() {
    var iosBanner = document.getElementById('push-ios-banner');
    if (iosBanner) iosBanner.classList.add('hidden');
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
      showIosInstallBanner();
      notifyIframePushState(true, 'Add Showrunner to Home Screen for iPhone alerts.');
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
      notifyIframePushState(true, 'Tap the green Allow button in the bar above.');
      return;
    }
    if (bannerEl) bannerEl.classList.remove('hidden');
    notifyIframePushState(true, '');
  }

  function hidePushPrompt() {
    if (isMobileDevice() && !serverSaveConfirmed && fcmToken && pendingFcmAuth) return;
    document.body.classList.remove('push-dock-open');
    if (bannerEl) bannerEl.classList.add('hidden');
    hideIosInstallBanner();
    notifyIframePushState(false, '');
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

  function postTokenToApp() {
    if (!fcmToken || !frame || !frame.contentWindow) return;
    try {
      frame.contentWindow.postMessage({
        type: 'SHOWRUNNER_FCM_TOKEN',
        token: fcmToken,
        label: deviceLabel()
      }, '*');
    } catch (e) { /* ignore */ }
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
        setDockStatus(['Step 1: token OK', 'linking to your account…']);
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
        verifySaveOnServer(regKey);
      } else {
        var err = (res && res.message) ? res.message : 'rejected';
        logPush('login key save failed: ' + err);
        setDockStatus(['Step 2: SAVE FAILED', err]);
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
      postTokenToApp();
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
      registerTokenViaBridgeJsonp(ev.data);
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
    setDockStatus(['Step 1: token OK', 'linking to your account…']);
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
    linkBtn.addEventListener('click', function(e) {
      if (e) e.preventDefault();
      requestFcmAuthFromIframe();
      trySaveTokenViaRegKey();
      setDockStatus(['Step 1: token OK', 'linking to your account…']);
    });
    linkBtn.addEventListener('touchend', function(e) {
      e.preventDefault();
      requestFcmAuthFromIframe();
      trySaveTokenViaRegKey();
    }, { passive: false });
  }

  initShell();
})();
