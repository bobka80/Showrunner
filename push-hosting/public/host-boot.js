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

  const SW_BUILD = '297';
  let firebaseConfig = null;
  let fcmToken = null;
  let messaging = null;
  let pushStarted = false;
  let pendingBridge = null;
  let pendingFcmAuth = null;
  let regKeySaveInFlight = false;
  let registrationLoopTimer = null;
  let serverSaveConfirmed = false;
  let regKeyFailCount = 0;
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

  function logPush(msg) {
    try { console.log('[Showrunner push]', msg); } catch (e) { /* ignore */ }
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
        setDockMessage('Registration failed. Tap retry (Android: allow Chrome autostart).');
        if (enableBtn) enableBtn.textContent = 'Retry alerts setup';
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
    document.body.classList.remove('push-dock-open');
    if (bannerEl) bannerEl.classList.add('hidden');
    notifyIframePushState(false, '');
    syncDockLayout();
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

  function requestFcmAuthFromIframe() {
    if (!frame || !frame.contentWindow) return;
    try {
      frame.contentWindow.postMessage({ type: 'SHOWRUNNER_REQUEST_FCM_AUTH' }, '*');
    } catch (e) { /* ignore */ }
  }

  function stopRegistrationLoop() {
    if (registrationLoopTimer) {
      clearInterval(registrationLoopTimer);
      registrationLoopTimer = null;
    }
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
        setDockStatus(['Step 1: token OK', 'Step 2: waiting for account link…']);
        requestFcmAuthFromIframe();
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
        setDockStatus(['Step 3: SAVED', (res.deviceCount || 1) + ' device(s)', res.labels || '']);
        hidePushPrompt();
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
      + '&callback=' + encodeURIComponent(cb);

    window[cb] = function(res) {
      delete window[cb];
      regKeySaveInFlight = false;
      if (res && res.success) {
        regKeyFailCount = 0;
        logPush('server accepted token');
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
      + '&callback=' + encodeURIComponent(cb);
    window[cb] = function(res) {
      delete window[cb];
      if (res && res.success) {
        serverSaveConfirmed = true;
        stopRegistrationLoop();
        hidePushPrompt();
        notifyIframeRegistered(true, 'Alerts linked.');
      } else {
        notifyIframeRegistered(false, (res && res.message) ? res.message : 'Save rejected');
      }
    };
    const script = document.createElement('script');
    script.src = url;
    script.onerror = function() { delete window[cb]; };
    document.head.appendChild(script);
  }

  function onAccountLink(auth) {
    pendingFcmAuth = auth;
    if (!fcmToken) return;
    setDockStatus(['Step 1: token OK', 'Step 2: linking account…']);
    trySaveTokenViaRegKey();
    startRegistrationLoop();
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
    if (ev.data.type === 'SHOWRUNNER_APP_READY' && ev.data.regKey) {
      onAccountLink({ regKey: ev.data.regKey, crewName: ev.data.crewName || '' });
    }
    if (ev.data.type === 'SHOWRUNNER_FCM_AUTH') {
      onAccountLink(ev.data);
      if (isMobileDevice() && Notification.permission !== 'granted') {
        showPushPrompt('allow');
      }
    }
    if (ev.data.type === 'SHOWRUNNER_FCM_SAVE_ACK') {
      serverSaveConfirmed = true;
      stopRegistrationLoop();
      hidePushPrompt();
    }
    if (ev.data.type === 'SHOWRUNNER_REQUEST_PUSH_PERMISSION') {
      pushStarted = false;
      showPushPrompt(Notification.permission === 'denied' ? 'denied' : 'allow');
    }
    if (ev.data.type === 'SHOWRUNNER_FCM_BRIDGE') {
      pendingBridge = ev.data;
      if (fcmToken && regKeyFailCount >= 3) registerTokenViaBridgeJsonp(ev.data);
    }
  });

  if (frame) {
    frame.addEventListener('load', function() {
      requestFcmAuthFromIframe();
      if (fcmToken) trySaveTokenViaRegKey();
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
      showInstallPanel();
      return false;
    }
    hideInstallPanel();
    setDockStatus(['Step 1: getting alert token…']);

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
          if (i < attempts - 1) await new Promise(function(r) { setTimeout(r, 1500); });
        }
      }
      if (!fcmToken && lastErr) throw lastErr;
    } catch (err) {
      if (!isRetry && /push service error/i.test(String(err && err.message))) {
        setDockStatus(['Step 1: push error — resetting', 'Allow Chrome autostart on Xiaomi']);
        await resetPushRegistration();
        return obtainFcmToken(true);
      }
      throw err;
    }

    if (!fcmToken) {
      setDockStatus(['Step 1: NO TOKEN', 'Check notification permission']);
      showPushPrompt('retry');
      return false;
    }

    logPush('token ready — auto-linking');
    setDockMessage('Linking alerts to your account…');
    setDockStatus(['Step 1: token OK', 'Step 2: linking account…']);
    notifyIframePushState(true, 'Setting up alerts — allow notifications above if prompted.');
    requestFcmAuthFromIframe();
    trySaveTokenViaRegKey();
    startRegistrationLoop();

    messaging.onMessage(function(payload) {
      var title = (payload.notification && payload.notification.title) || 'Showrunner';
      var body = (payload.notification && payload.notification.body) || '';
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
      if (!fcmToken) pushStarted = false;
    } catch (err) {
      pushStarted = false;
      console.error(err);
      setDockStatus(['Step 1: FAILED', (err && err.message) ? err.message : String(err)]);
      if (isIosInBrowserTab()) showInstallPanel();
      else showPushPrompt('retry');
    }
  }

  async function initShell() {
    try {
      firebaseConfig = await loadConfigJsonp();
      if (!firebaseConfig.apiKey || !firebaseConfig.vapidKey || firebaseConfig.vapidKeyValid === false) {
        logPush('config incomplete');
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
      if (!('Notification' in window)) return;

      if (Notification.permission === 'granted') {
        pushStarted = true;
        if (isIosInBrowserTab()) {
          showInstallPanel();
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
      startShellOnce();
    });
  }

  if (shouldShowInstallPanel()) showInstallPanel();
  else startShellOnce();
})();
