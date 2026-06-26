/**
 * Firebase Hosting shell — loads Showrunner in iframe + registers FCM.
 */
(function() {
  const PROD_GAS_EXEC = 'https://script.google.com/macros/s/AKfycbxynTt5JaKQiv1Iu_ahSQBcrBDKpuhz98lac4G-bJO5PMtmvgJr_uKZ1Y58lxOOupSwlw/exec';
  const statusEl = document.getElementById('push-status');
  const bannerEl = document.getElementById('push-enable-banner');
  const enableBtn = document.getElementById('push-enable-btn');
  const frame = document.getElementById('app-frame');
  let firebaseConfig = null;
  let fcmToken = null;
  let appReady = false;
  let messaging = null;
  let pushStarted = false;

  function setStatus(msg, clickable) {
    if (!statusEl) return;
    statusEl.textContent = 'Push: ' + msg;
    statusEl.style.pointerEvents = clickable ? 'auto' : 'none';
    statusEl.style.cursor = clickable ? 'pointer' : 'default';
  }

  function hideBanner() {
    if (bannerEl) bannerEl.classList.add('hidden');
  }

  function showBanner() {
    if (bannerEl) bannerEl.classList.remove('hidden');
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

  function postTokenToApp() {
    if (!fcmToken) return;
    const msg = {
      type: 'SHOWRUNNER_FCM_TOKEN',
      token: fcmToken,
      label: 'web-hosting'
    };
    if (appReady && frame && frame.contentWindow) {
      try { frame.contentWindow.postMessage(msg, '*'); } catch (e) { /* ignore */ }
    }
  }

  window.addEventListener('message', function(ev) {
    if (!ev.data) return;
    if (ev.data.type === 'SHOWRUNNER_APP_READY' || ev.data.type === 'SHOWRUNNER_REQUEST_FCM_TOKEN') {
      appReady = true;
      postTokenToApp();
    }
  });

  if (frame) {
    frame.addEventListener('load', function() {
      appReady = true;
      postTokenToApp();
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
    postTokenToApp();
    var postAttempts = 0;
    var postRetry = setInterval(function() {
      postTokenToApp();
      if (++postAttempts >= 40) clearInterval(postRetry);
    }, 3000);

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
        setStatus('blocked — click lock icon in address bar → Notifications → Allow', true);
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

      if (frame) frame.src = firebaseConfig.gasExecUrl || PROD_GAS_EXEC;

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
  if (statusEl) {
    statusEl.addEventListener('click', function() {
      if (Notification.permission !== 'granted') {
        pushStarted = false;
        showBanner();
        requestNotificationsAndRegister();
      }
    });
  }

  initShell();
})();
