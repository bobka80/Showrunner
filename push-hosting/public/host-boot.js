/**
 * Firebase Hosting shell — loads Showrunner in iframe + registers FCM.
 */
(function() {
  const PROD_GAS_EXEC = 'https://script.google.com/macros/s/AKfycbzilZyZ-qzQoUPBr0Y5r1G7nGVsPMq2XTwRRfNQZTm7/exec';
  const statusEl = document.getElementById('push-status');
  const frame = document.getElementById('app-frame');
  let firebaseConfig = null;
  let fcmToken = null;
  let appReady = false;

  function setStatus(msg) {
    if (statusEl) statusEl.textContent = 'Push: ' + msg;
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
    if (!fcmToken || !appReady || !frame || !frame.contentWindow) return;
    frame.contentWindow.postMessage({
      type: 'SHOWRUNNER_FCM_TOKEN',
      token: fcmToken,
      label: 'web-hosting'
    }, '*');
  }

  window.addEventListener('message', function(ev) {
    if (!ev.data) return;
    if (ev.data.type === 'SHOWRUNNER_APP_READY') {
      appReady = true;
      postTokenToApp();
    }
  });

  async function initPush() {
    try {
      setStatus('loading config…');
      firebaseConfig = await loadConfigJsonp();
      if (!firebaseConfig.apiKey || !firebaseConfig.messagingSenderId || !firebaseConfig.appId) {
        setStatus('config incomplete — add FIREBASE_MESSAGING_SENDER_ID + FIREBASE_APP_ID to Script Properties');
        return;
      }
      if (!firebaseConfig.vapidKey) {
        setStatus('missing VAPID key in Script Properties');
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
        setStatus('notifications not supported in this browser');
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setStatus('permission denied');
        return;
      }

      const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      const messaging = firebase.messaging();
      messaging.useServiceWorker(reg);
      fcmToken = await messaging.getToken({ vapidKey: firebaseConfig.vapidKey });
      if (!fcmToken) {
        setStatus('no token — check Hosting + VAPID');
        return;
      }
      setStatus('token ready');
      postTokenToApp();

      messaging.onMessage(function(payload) {
        const title = (payload.notification && payload.notification.title) || 'Showrunner';
        const body = (payload.notification && payload.notification.body) || '';
        if (Notification.permission === 'granted') {
          new Notification(title, { body: body });
        }
      });
    } catch (err) {
      console.error(err);
      setStatus((err && err.message) ? err.message : 'init failed');
    }
  }

  initPush();
})();
