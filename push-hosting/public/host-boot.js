/**
 * Firebase Hosting shell — loads Showrunner in iframe + registers FCM.
 */
(function() {
  const PROD_GAS_EXEC = 'https://script.google.com/macros/s/AKfycbxynTt5JaKQiv1Iu_ahSQBcrBDKpuhz98lac4G-bJO5PMtmvgJr_uKZ1Y58lxOOupSwlw/exec';
  const statusEl = document.getElementById('push-status-text');
  const copyBtn = document.getElementById('push-copy-btn');
  const bannerEl = document.getElementById('push-enable-banner');
  const enableBtn = document.getElementById('push-enable-btn');
  const frame = document.getElementById('app-frame');
  let firebaseConfig = null;
  let fcmToken = null;
  let messaging = null;
  let pushStarted = false;
  let pendingBridge = null;

  function showCopyButton(enabled) {
    if (!copyBtn) return;
    copyBtn.disabled = !enabled;
    copyBtn.textContent = enabled ? 'Copy push token' : 'Copy push token (wait for token ready)';
  }

  function setStatus(msg, clickable) {
    if (!statusEl) return;
    statusEl.textContent = 'Push: ' + msg;
    const wrap = document.getElementById('push-status');
    if (wrap) {
      wrap.style.pointerEvents = 'auto';
      statusEl.style.cursor = clickable ? 'pointer' : 'default';
    }
    showCopyButton(!!fcmToken);
  }

  showCopyButton(false);

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

  function postTokenToApp() {
    if (!fcmToken || !frame || !frame.contentWindow) return;
    try {
      frame.contentWindow.postMessage({
        type: 'SHOWRUNNER_FCM_TOKEN',
        token: fcmToken,
        label: 'web-hosting'
      }, '*');
    } catch (e) { /* ignore */ }
  }

  function registerTokenViaBridgeJsonp(data) {
    const baseUrl = getRegisterBaseUrl();
    if (!data || !data.nonce || !baseUrl) return;
    if (!fcmToken) {
      pendingBridge = data;
      setStatus('token ready — log in to save…', false);
      return;
    }
    pendingBridge = null;
    setStatus('saving token…', false);

    const cb = '__srFcmReg_' + Date.now();
    const url = baseUrl
      + '?action=fcmreg'
      + '&nonce=' + encodeURIComponent(data.nonce)
      + '&token=' + encodeURIComponent(fcmToken)
      + '&label=' + encodeURIComponent(data.label || 'web-hosting')
      + '&callback=' + encodeURIComponent(cb);

    window[cb] = function(res) {
      delete window[cb];
      if (res && res.success) {
        setStatus('token saved');
        notifyIframeRegistered(true);
      } else {
        const msg = (res && res.message) ? res.message : 'Save rejected by server';
        setStatus('save failed', true);
        notifyIframeRegistered(false, msg);
      }
    };

    const script = document.createElement('script');
    script.src = url;
    script.onerror = function() {
      delete window[cb];
      setStatus('save failed — network', true);
      notifyIframeRegistered(false, 'Could not reach Apps Script to save token.');
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
      script.onerror = function() { reject(new Error('Failed to load Firebase config from Apps Script.')); };
      document.head.appendChild(script);
    });
  }

  window.addEventListener('message', function(ev) {
    if (!ev.data) return;
    if (ev.data.type === 'SHOWRUNNER_APP_READY' || ev.data.type === 'SHOWRUNNER_REQUEST_FCM_TOKEN') {
      postTokenToApp();
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

  async function obtainFcmToken() {
    const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    if (!messaging) messaging = firebase.messaging();
    fcmToken = await messaging.getToken({
      vapidKey: firebaseConfig.vapidKey,
      serviceWorkerRegistration: reg
    });
    if (!fcmToken) {
      setStatus('no token — check VAPID key', true);
      return false;
    }
    setStatus('token ready');
    flushPendingBridge();

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
        setStatus('not supported in this browser', false);
        return;
      }

      var permission = Notification.permission;
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }

      if (permission !== 'granted') {
        pushStarted = false;
        setStatus('blocked — allow in site settings (lock icon)', true);
        showBanner();
        if (enableBtn) enableBtn.textContent = 'Try again';
        return;
      }

      await obtainFcmToken();
    } catch (err) {
      pushStarted = false;
      console.error(err);
      var msg = (err && err.message) ? err.message : 'init failed';
      if (/applicationServerKey|vapid|push manager/i.test(msg)) {
        msg = 'VAPID key wrong — paste Web Push public key in DATABASE tab';
      }
      setStatus(msg, true);
      showBanner();
    }
  }

  async function initShell() {
    try {
      setStatus('loading config…', false);
      firebaseConfig = await loadConfigJsonp();
      if (!firebaseConfig.apiKey || !firebaseConfig.messagingSenderId || !firebaseConfig.appId) {
        setStatus('config incomplete', false);
        return;
      }
      if (!firebaseConfig.vapidKey) {
        setStatus('missing VAPID key — save in DATABASE tab', true);
        return;
      }
      if (firebaseConfig.vapidKeyValid === false) {
        var bad = (firebaseConfig.vapidKey.indexOf('AIza') === 0)
          ? 'VAPID looks like API key — use Web Push key from Firebase'
          : 'VAPID key invalid — save correct key in DATABASE tab';
        setStatus(bad, true);
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
        setStatus('not supported in this browser', false);
        return;
      }

      if (Notification.permission === 'granted') {
        pushStarted = true;
        hideBanner();
        setStatus('permission OK — registering…', false);
        await obtainFcmToken();
        return;
      }

      if (Notification.permission === 'denied') {
        setStatus('blocked — reset in site settings (lock icon)', true);
        showBanner();
        if (enableBtn) enableBtn.textContent = 'Try again';
        return;
      }

      setStatus('click “Allow notifications” above', false);
      showBanner();
    } catch (err) {
      console.error(err);
      setStatus((err && err.message) ? err.message : 'init failed', true);
    }
  }

  if (enableBtn) {
    enableBtn.addEventListener('click', function() {
      pushStarted = false;
      requestNotificationsAndRegister();
    });
  }
  if (copyBtn) {
    copyBtn.addEventListener('click', function(ev) {
      ev.stopPropagation();
      if (!fcmToken) return;
      navigator.clipboard.writeText(fcmToken).then(function() {
        setStatus('token copied — paste in DATABASE', false);
      }).catch(function() {
        window.prompt('Copy this device token:', fcmToken);
      });
    });
  }
  const statusWrap = document.getElementById('push-status');
  if (statusWrap) {
    statusWrap.addEventListener('click', function() {
      if (Notification.permission !== 'granted') {
        pushStarted = false;
        showBanner();
        requestNotificationsAndRegister();
      }
    });
  }

  initShell();
})();
