/**
 * Firebase Hosting shell — loads Showrunner in iframe + registers FCM silently.
 */
(function() {
  const PROD_GAS_EXEC = 'https://script.google.com/macros/s/AKfycbxynTt5JaKQiv1Iu_ahSQBcrBDKpuhz98lac4G-bJO5PMtmvgJr_uKZ1Y58lxOOupSwlw/exec';
  const bannerEl = document.getElementById('push-enable-banner');
  const enableBtn = document.getElementById('push-enable-btn');
  const frame = document.getElementById('app-frame');
  let firebaseConfig = null;
  let fcmToken = null;
  let messaging = null;
  let pushStarted = false;
  let pendingBridge = null;
  const SW_BUILD = '286';
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
    if (bannerEl) bannerEl.classList.add('hidden');
  }

  function hideIosInstallBanner() {
    var iosBanner = document.getElementById('push-ios-banner');
    if (iosBanner) iosBanner.classList.add('hidden');
  }

  function hideBanner() {
    if (bannerEl) bannerEl.classList.add('hidden');
  }

  function showBanner() {
    if (bannerEl) bannerEl.classList.remove('hidden');
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
        hideBanner();
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
    }
    if (ev.data.type === 'SHOWRUNNER_FCM_SAVE_ACK') {
      stopTokenBroadcast();
      hideBanner();
      hideIosInstallBanner();
      logPush('registration confirmed by app');
    }
    if (ev.data.type === 'SHOWRUNNER_FCM_BRIDGE') {
      registerTokenViaBridgeJsonp(ev.data);
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

    try {
      var swUrl = '/firebase-messaging-sw.js?build=' + SW_BUILD;
      var reg = await navigator.serviceWorker.register(swUrl);
      if (reg && reg.update) await reg.update();
      if (!messaging) messaging = firebase.messaging();
      fcmToken = await messaging.getToken({
        vapidKey: firebaseConfig.vapidKey,
        serviceWorkerRegistration: reg
      });
    } catch (err) {
      if (!isRetry && /push service error/i.test(String(err && err.message))) {
        logPush('push service error — retrying after reset');
        await resetPushRegistration();
        return obtainFcmToken(true);
      }
      throw err;
    }

    if (!fcmToken) {
      logPush('no token — check VAPID');
      showBanner();
      return false;
    }

    logPush('token ready');
    hideBanner();
    flushPendingBridge();
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
    hideBanner();

    try {
      if (!('Notification' in window)) {
        logPush('not supported in this browser');
        return;
      }

      var permission = Notification.permission;
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }

      if (permission !== 'granted') {
        pushStarted = false;
        showBanner();
        if (enableBtn) enableBtn.textContent = 'Try again';
        return;
      }

      await obtainFcmToken(false);
    } catch (err) {
      pushStarted = false;
      console.error(err);
      logPush(formatTokenError(err));
      if (isIosInBrowserTab()) {
        showIosInstallBanner();
      } else {
        showBanner();
        if (enableBtn) enableBtn.textContent = 'Try again';
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
        hideBanner();
        if (isIosInBrowserTab()) {
          showIosInstallBanner();
          return;
        }
        await obtainFcmToken(false);
        return;
      }

      if (Notification.permission === 'denied') {
        showBanner();
        if (enableBtn) enableBtn.textContent = 'Try again';
        return;
      }

      if (isIosInBrowserTab()) {
        showIosInstallBanner();
      } else {
        showBanner();
      }
    } catch (err) {
      console.error(err);
      logPush(formatTokenError(err));
      if (!isIosInBrowserTab()) showBanner();
    }
  }

  if (enableBtn) {
    enableBtn.addEventListener('click', function() {
      pushStarted = false;
      requestNotificationsAndRegister();
    });
  }

  initShell();
})();
