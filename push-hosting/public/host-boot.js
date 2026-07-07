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

  function hostMobileScanEmergencyReset_() {
    try {
      hostMobileScanCloseShellCam_();
      hostMobileScanCloseCameraPage_();
      hostMobileScanHideTapGate_();
      document.body.classList.remove('sr-shell-cam-active');
      hostMobileScanRestoreAppFrame_();
      if (hostMobileQrPendingRetryTimer) {
        clearInterval(hostMobileQrPendingRetryTimer);
        hostMobileQrPendingRetryTimer = null;
      }
    } catch (e) { /* ignore */ }
  }
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
  // Camera runs on web.app aligned to the iframe scan-panel square; panel UI stays in iframe.
  var hostMobileQrEngine = null;
  var hostMobileQrStarting = false;
  var hostMobileQrOverlay = null;
  var hostMobileQrTapGate = null;
  var hostMobileQrTapBtn = null;
  var hostMobileQrPermBtn = null;
  var hostMobileQrInlineStart = null;
  var hostMobileQrOpen = false;
  var hostMobileQrCameraRect = null;
  var hostMobileQrStartTimer = null;
  var hostMobileQrEmbedFrame = null;
  var hostMobileQrLastOpenData = null;
  var HOST_CAM_EMBED_PATH = '/camera-embed.html?v=4';
  var HOST_SCAN_PAGE_PATH = '/mobile-scan.html';
  var hostMobileScanStageOpen = false;
  var hostMobileScanDocked = false;
  var hostMobileScanPageOpen = false;

  function hostMobileScanGetPageOverlay_() {
    return document.getElementById('sr-mobile-scan-page');
  }

  function hostMobileScanGetPageFrame_() {
    return document.getElementById('sr-mobile-scan-page-frame');
  }

  function hostMobileScanOpenCameraPage_() {
    var overlay = hostMobileScanGetPageOverlay_();
    var camFrame = hostMobileScanGetPageFrame_();
    if (!overlay || !camFrame) {
      window.location.href = HOST_SCAN_PAGE_PATH + '?scan=1';
      return;
    }
    hostMobileScanHideAppFrame_();
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    hostMobileScanPageOpen = true;
    camFrame.src = HOST_SCAN_PAGE_PATH + '?embed=1&scan=1&v=' + Date.now();
  }

  function hostMobileScanCloseCameraPage_() {
    var overlay = hostMobileScanGetPageOverlay_();
    var camFrame = hostMobileScanGetPageFrame_();
    hostMobileScanPageOpen = false;
    if (overlay) {
      overlay.classList.remove('is-open');
      overlay.setAttribute('aria-hidden', 'true');
    }
    if (camFrame) {
      try { camFrame.src = 'about:blank'; } catch (e) { /* ignore */ }
    }
    hostMobileScanRestoreAppFrame_();
  }

  function hostMobileScanIsScanPageMsg_(ev) {
    if (!ev || !ev.data || !ev.data.type) return false;
    var t = ev.data.type;
    if (t !== 'SHOWRUNNER_SCAN_PAGE_QR' && t !== 'SHOWRUNNER_SCAN_PAGE_CANCEL') return false;
    if (!ev.origin) return false;
    return ev.origin.indexOf('sm-showrunner-97405.web.app') !== -1 || ev.origin.indexOf('web.app') !== -1;
  }

  function hostMobileScanStageOnServer_(tag, onDone) {
    var raw = String(tag == null ? '' : tag).trim();
    if (!raw) {
      if (typeof onDone === 'function') onDone({ success: false });
      return;
    }
    var tok = hostMobileScanGetSessionToken_();
    if (!tok) {
      if (typeof onDone === 'function') onDone({ success: false });
      return;
    }
    var url = PROD_GAS_EXEC + '?action=mobscanstage&token=' + encodeURIComponent(tok) +
      '&tag=' + encodeURIComponent(raw);
    try {
      if (typeof fetch === 'function') {
        fetch(url, { mode: 'no-cors', credentials: 'omit' }).catch(function() { /* ignore */ });
      }
    } catch (e) { /* ignore */ }
    var cb = 'srMobScanStage_' + Date.now();
    window[cb] = function(res) {
      try { delete window[cb]; } catch (e) { /* ignore */ }
      if (typeof onDone === 'function') onDone(res || { success: false });
    };
    try {
      var s = document.createElement('script');
      s.src = url + '&callback=' + encodeURIComponent(cb);
      s.onerror = function() {
        try { delete window[cb]; } catch (e) { /* ignore */ }
        if (typeof onDone === 'function') onDone({ success: false });
      };
      document.head.appendChild(s);
      setTimeout(function() { try { s.remove(); } catch (e) { /* ignore */ } }, 8000);
    } catch (e) {
      if (typeof onDone === 'function') onDone({ success: false });
    }
  }

  function hostMobileScanRelayBurst_(payload) {
    hostMobileScanRelay_(payload);
    [150, 400, 900, 1800, 3200].forEach(function(ms) {
      setTimeout(function() { hostMobileScanRelay_(payload); }, ms);
    });
  }

  var hostMobileScanReloadIssued_ = false;

  function hostMobileScanNavigateIframeWithScan_(raw) {
    if (!frame || hostMobileScanReloadIssued_) return;
    var tag = String(raw == null ? '' : raw).trim();
    if (!tag) return;
    var sess = readParentSession();
    if (!sess || !sess.token) return;
    hostMobileScanReloadIssued_ = true;
    sessionCheckJsonp(sess.token).then(function(check) {
      if (!check || !check.valid) {
        hostMobileScanReloadIssued_ = false;
        return;
      }
      var base = PROD_GAS_EXEC || (firebaseConfig && firebaseConfig.gasExecUrl) || '';
      if (!base) {
        hostMobileScanReloadIssued_ = false;
        return;
      }
      try {
        sessionStorage.setItem('sm_mobile_scan_reopen_panel', '1');
        localStorage.setItem('sm_mobile_scan_reopen_panel', '1');
      } catch (e) { /* ignore */ }
      var url = base + '?action=sessionboot&token=' + encodeURIComponent(sess.token) +
        '&srScan=' + encodeURIComponent(tag);
      frame.src = url;
      setTimeout(function() { hostMobileScanReloadIssued_ = false; }, 12000);
    }).catch(function() {
      hostMobileScanReloadIssued_ = false;
    });
  }

  function hostMobileScanDeliverScan_(text, reopen) {
    var raw = String(text == null ? '' : text).trim();
    if (!raw) return;
    hostMobileScanStageOnServer_(raw);
    try {
      sessionStorage.setItem('sm_mobile_qr_pending', raw);
      localStorage.setItem('sm_mobile_qr_pending', raw);
      if (reopen !== false) {
        sessionStorage.setItem('sm_mobile_scan_reopen_panel', '1');
        localStorage.setItem('sm_mobile_scan_reopen_panel', '1');
      }
    } catch (e) { /* ignore */ }
    var payload = {
      type: 'SHOWRUNNER_MOBILE_QR_SCAN',
      text: raw,
      reopenPanel: reopen !== false
    };
    hostMobileScanRelayBurst_(payload);
    hostMobileScanRelayBurst_({
      type: 'SHOWRUNNER_MOBILE_SCAN_WAKE',
      text: raw,
      reopenPanel: reopen !== false
    });
    if (reopen !== false) {
      hostMobileScanRelayBurst_({ type: 'SHOWRUNNER_MOBILE_SCAN_REOPEN' });
    }
    hostMobileScanNavigateIframeWithScan_(raw);
    hostMobileScanSchedulePendingRetry_();
  }

  var hostMobileShellCamOpen = false;
  var hostMobileShellCamEngine = null;
  var hostMobileShellCamStarting = false;
  var hostMobileShellCamLastDecode = '';
  var hostMobileShellCamLastDecodeTs = 0;
  var hostMobileScanSessionToken_ = '';

  function hostMobileScanGetSessionToken_() {
    if (hostMobileScanSessionToken_) return hostMobileScanSessionToken_;
    var sess = readParentSession();
    return (sess && sess.token) ? sess.token : '';
  }

  function hostMobileScanGetShellCam_() {
    return document.getElementById('sr-mobile-shell-cam');
  }

  function hostMobileScanWireShellCam_() {
    var cancel = document.getElementById('sr-shell-cam-cancel');
    var start = document.getElementById('sr-shell-cam-start');
    if (cancel && cancel.dataset.bound !== '1') {
      cancel.dataset.bound = '1';
      function onCancel(ev) {
        if (ev) { ev.preventDefault(); ev.stopPropagation(); }
        hostMobileScanCloseShellCam_();
      }
      cancel.addEventListener('click', onCancel);
      cancel.addEventListener('touchend', onCancel, { passive: false });
    }
    if (start && start.dataset.bound !== '1') {
      start.dataset.bound = '1';
      function onStart(ev) {
        if (ev) { ev.preventDefault(); ev.stopPropagation(); }
        start.style.display = 'none';
        var st = document.getElementById('sr-shell-cam-status');
        if (st) st.textContent = 'Starting camera…';
        hostMobileScanStartShellCamEngine_();
      }
      start.addEventListener('click', onStart);
      start.addEventListener('touchend', onStart, { passive: false });
    }
  }

  function hostMobileScanOpenShellCam_() {
    hostMobileScanWireShellCam_();
    hostMobileScanCloseCameraPage_();
    var el = hostMobileScanGetShellCam_();
    if (!el) {
      hostMobileScanOpenCameraPage_();
      return;
    }
    try {
      sessionStorage.setItem('sm_mobile_scan_reopen_panel', '1');
      localStorage.setItem('sm_mobile_scan_reopen_panel', '1');
    } catch (e) { /* ignore */ }
    hostMobileScanHideAppFrame_();
    hostMobileShellCamOpen = true;
    el.classList.add('is-open');
    el.setAttribute('aria-hidden', 'false');
    var startBtn = document.getElementById('sr-shell-cam-start');
    var status = document.getElementById('sr-shell-cam-status');
    var reader = document.getElementById('sr-shell-cam-reader');
    if (startBtn) startBtn.style.display = 'block';
    if (status) status.textContent = 'Tap below, then point at an asset QR label.';
    if (reader) reader.innerHTML = '';
    document.body.classList.add('sr-shell-cam-active');
  }

  function hostMobileScanStopShellCamEngine_() {
    hostMobileShellCamStarting = false;
    if (!hostMobileShellCamEngine) return;
    var eng = hostMobileShellCamEngine;
    hostMobileShellCamEngine = null;
    eng.stop().then(function() {
      try { eng.clear(); } catch (e) { /* ignore */ }
    }).catch(function() {
      try { eng.clear(); } catch (e2) { /* ignore */ }
    });
  }

  function hostMobileScanCloseShellCam_() {
    hostMobileScanStopShellCamEngine_();
    hostMobileShellCamOpen = false;
    var el = hostMobileScanGetShellCam_();
    if (el) {
      el.classList.remove('is-open');
      el.setAttribute('aria-hidden', 'true');
    }
    var reader = document.getElementById('sr-shell-cam-reader');
    if (reader) reader.innerHTML = '';
    document.body.classList.remove('sr-shell-cam-active');
    hostMobileScanRestoreAppFrame_();
    hostMobileScanFlushPending_();
  }

  function hostMobileScanStartShellCamEngine_() {
    if (hostMobileShellCamEngine || hostMobileShellCamStarting) return;
    if (typeof Html5Qrcode === 'undefined') {
      var st0 = document.getElementById('sr-shell-cam-status');
      if (st0) st0.textContent = 'Scanner failed to load.';
      var sb0 = document.getElementById('sr-shell-cam-start');
      if (sb0) sb0.style.display = 'block';
      return;
    }
    hostMobileShellCamStarting = true;

    function onFail(err) {
      hostMobileShellCamStarting = false;
      var st = document.getElementById('sr-shell-cam-status');
      if (st) st.textContent = String(err && err.message ? err.message : err);
      var startBtn = document.getElementById('sr-shell-cam-start');
      if (startBtn) startBtn.style.display = 'block';
    }

    function onDecode(decoded) {
      var raw = String(decoded == null ? '' : decoded);
      if (!raw) return;
      var now = Date.now();
      if (raw === hostMobileShellCamLastDecode && (now - hostMobileShellCamLastDecodeTs) < 2000) return;
      hostMobileShellCamLastDecode = raw;
      hostMobileShellCamLastDecodeTs = now;
      hostMobileScanStopShellCamEngine_();
      hostMobileScanCloseShellCam_();
      hostMobileScanDeliverScan_(raw, true);
    }

    function startCfg(cfg) {
      hostMobileShellCamEngine = new Html5Qrcode('sr-shell-cam-reader');
      return hostMobileShellCamEngine.start(
        cfg,
        {
          fps: 10,
          qrbox: function(w, h) {
            var edge = Math.floor(Math.min(w, h) * 0.72);
            return { width: Math.max(edge, 160), height: Math.max(edge, 160) };
          }
        },
        onDecode,
        function() { /* frame miss */ }
      );
    }

    startCfg({ facingMode: 'environment' }).then(function() {
      hostMobileShellCamStarting = false;
      var st = document.getElementById('sr-shell-cam-status');
      if (st) st.textContent = 'Camera active — point at QR';
    }).catch(function() {
      if (typeof Html5Qrcode.getCameras !== 'function') {
        onFail(new Error('Camera not available'));
        return;
      }
      Html5Qrcode.getCameras().then(function(cams) {
        if (!cams || !cams.length) return startCfg({ facingMode: 'environment' });
        var back = null;
        for (var i = 0; i < cams.length; i++) {
          var lab = String(cams[i].label || '').toLowerCase();
          if (lab.indexOf('back') !== -1 || lab.indexOf('rear') !== -1 || lab.indexOf('environment') !== -1) {
            back = cams[i];
            break;
          }
        }
        return startCfg((back || cams[cams.length - 1]).id);
      }).then(function() {
        hostMobileShellCamStarting = false;
        var st = document.getElementById('sr-shell-cam-status');
        if (st) st.textContent = 'Camera active — point at QR';
      }).catch(onFail);
    });
  }

  function hostMobileScanHideAppFrame_() {
    if (!frame) return;
    frame.dataset.srPrevDisplay = frame.style.display || '';
    frame.style.display = 'none';
  }

  function hostMobileScanRestoreAppFrame_() {
    if (!frame) return;
    frame.style.display = frame.dataset.srPrevDisplay || 'block';
  }

  function hostMobileScanGetStage_() {
    return document.getElementById('sr-mobile-scan-stage');
  }

  function hostMobileScanGetStageCam_() {
    return document.getElementById('sr-mobile-scan-stage-cam');
  }

  function hostMobileScanWireStage_() {
    var cancel = document.getElementById('sr-mobile-scan-stage-cancel');
    if (!cancel || cancel.dataset.bound === '1') return;
    cancel.dataset.bound = '1';
    function onCancel(ev) {
      if (ev) { ev.preventDefault(); ev.stopPropagation(); }
      hostMobileScanStop();
    }
    cancel.addEventListener('click', onCancel);
    cancel.addEventListener('touchend', onCancel, { passive: false });
  }

  function hostMobileScanLaunchStage_() {
    hostMobileScanWireStage_();
    hostMobileScanResetStage_();
    hostMobileScanHideAppFrame_();
    hostMobileScanHideEmbedFrame_();
    if (hostMobileQrOverlay) hostMobileQrOverlay.style.display = 'none';
    hostMobileScanHideTapGate_();
    var stage = hostMobileScanGetStage_();
    if (stage) {
      stage.classList.add('is-open');
      stage.setAttribute('aria-hidden', 'false');
    }
    hostMobileScanStageOpen = true;
    hostMobileScanDocked = false;
    document.body.classList.add('sr-mobile-scan-stage-open');
    var stageCam = hostMobileScanGetStageCam_();
    if (stageCam && !stageCam.src) stageCam.src = HOST_CAM_EMBED_PATH;
  }

  /** Camera granted — restore app iframe; shrink stage iframe over panel camera square. */
  function hostMobileScanDockStage_() {
    hostMobileScanStageOpen = false;
    hostMobileScanDocked = true;
    document.body.classList.remove('sr-mobile-scan-stage-open');
    hostMobileScanRestoreAppFrame_();
    var stage = hostMobileScanGetStage_();
    if (!stage) return;
    stage.classList.remove('is-open');
    stage.classList.add('is-docked');
    stage.setAttribute('aria-hidden', 'false');
    hostMobileScanPositionStageCam_();
  }

  function hostMobileScanPositionStageCam_() {
    if (!hostMobileScanDocked || !hostMobileQrLastOpenData) return;
    var payload = hostMobileScanParsePayload_(hostMobileQrLastOpenData);
    hostMobileQrCameraRect = hostMobileScanGlobalRect_(payload.rect);
    var g = hostMobileQrCameraRect;
    var stage = hostMobileScanGetStage_();
    if (stage) {
      stage.style.top = Math.round(g.top) + 'px';
      stage.style.left = Math.round(g.left) + 'px';
      stage.style.width = Math.round(g.width) + 'px';
      stage.style.height = Math.round(g.height) + 'px';
    }
    hostMobileScanPositionPermBtn_(payload.permRect);
  }

  function hostMobileScanResetStage_() {
    var stage = hostMobileScanGetStage_();
    if (stage) {
      stage.classList.remove('is-open', 'is-docked');
      stage.setAttribute('aria-hidden', 'true');
      stage.style.top = '';
      stage.style.left = '';
      stage.style.width = '';
      stage.style.height = '';
    }
    document.body.classList.remove('sr-mobile-scan-stage-open');
  }

  function hostMobileScanIsEmbedMsg_(ev) {
    if (!ev || !ev.data) return false;
    var t = ev.data.type;
    if (t !== 'SHOWRUNNER_EMBED_QR_SCAN' && t !== 'SHOWRUNNER_EMBED_CAM_ACTIVE' &&
        t !== 'SHOWRUNNER_EMBED_CAM_ERROR' && t !== 'SHOWRUNNER_EMBED_CAM_READY') return false;
    var stageCam = hostMobileScanGetStageCam_();
    if (stageCam && stageCam.contentWindow && ev.source === stageCam.contentWindow) return true;
    if (hostMobileQrEmbedFrame && hostMobileQrEmbedFrame.contentWindow && ev.source === hostMobileQrEmbedFrame.contentWindow) return true;
    try {
      var o = String(ev.origin || '');
      return o.indexOf('sm-showrunner-97405.web.app') !== -1 || o.indexOf('web.app') !== -1;
    } catch (e) { return false; }
  }

  function hostMobileScanEnsureEmbedFrame_() {
    if (hostMobileQrEmbedFrame) return hostMobileQrEmbedFrame;
    var el = document.createElement('iframe');
    el.id = 'sr-mobile-cam-embed';
    el.title = 'QR camera';
    el.setAttribute('allow', 'camera; microphone');
    el.src = HOST_CAM_EMBED_PATH;
    el.setAttribute('style', [
      'position:fixed', 'display:none', 'border:none', 'box-sizing:border-box',
      'z-index:2147483647', 'background:#000',
      'border:1px solid #f97316', 'border-radius:8px', 'overflow:hidden',
      'pointer-events:auto', 'touch-action:manipulation',
      'transform:translateZ(1px)', '-webkit-transform:translateZ(1px)'
    ].join(';'));
    document.body.appendChild(el);
    hostMobileQrEmbedFrame = el;
    return el;
  }

  function hostMobileScanPositionEmbedFrame_(data) {
    var payload = hostMobileScanParsePayload_(data);
    hostMobileQrCameraRect = hostMobileScanGlobalRect_(payload.rect);
    var g = hostMobileQrCameraRect;
    var el = hostMobileScanEnsureEmbedFrame_();
    el.style.top = Math.round(g.top) + 'px';
    el.style.left = Math.round(g.left) + 'px';
    el.style.width = Math.round(g.width) + 'px';
    el.style.height = Math.round(g.height) + 'px';
    hostMobileScanPositionPermBtn_(payload.permRect);
  }

  function hostMobileScanShowEmbedFrame_(show) {
    var el = hostMobileScanEnsureEmbedFrame_();
    if (show) {
      document.body.classList.add('sr-mobile-scan-cam-open');
      el.style.display = 'block';
    } else {
      document.body.classList.remove('sr-mobile-scan-cam-open');
      el.style.display = 'none';
    }
  }

  function hostMobileScanPostToEmbed_(msg) {
    if (!hostMobileQrEmbedFrame || !hostMobileQrEmbedFrame.contentWindow) return;
    try { hostMobileQrEmbedFrame.contentWindow.postMessage(msg, '*'); } catch (e) { /* ignore */ }
  }

  function hostMobileScanClearStartTimer_() {
    if (hostMobileQrStartTimer) {
      clearTimeout(hostMobileQrStartTimer);
      hostMobileQrStartTimer = null;
    }
  }

  function hostMobileScanUnlockStarting_() {
    hostMobileQrStarting = false;
    hostMobileScanClearStartTimer_();
  }

  function hostMobileScanRelay_(payload) {
    if (!frame || !frame.contentWindow) return;
    try { frame.contentWindow.postMessage(payload, '*'); } catch (e) { /* ignore */ }
  }

  function hostMobileScanFrameRect_() {
    if (!frame) return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
    var r = frame.getBoundingClientRect();
    return { top: r.top, left: r.left, width: r.width, height: r.height };
  }

  function hostMobileScanGlobalRect_(rect) {
    var fr = hostMobileScanFrameRect_();
    if (!rect || !rect.width) {
      return { top: fr.top, left: fr.left, width: fr.width, height: Math.max(200, Math.round(window.innerHeight * 0.32)) };
    }
    var h = Math.max(rect.height, 160);
    var w = Math.max(rect.width, 120);
    return {
      top: fr.top + rect.top,
      left: fr.left + rect.left,
      width: w,
      height: h
    };
  }

  function hostMobileScanEnsureOverlay() {
    if (hostMobileQrOverlay) return hostMobileQrOverlay;
    var el = document.createElement('div');
    el.id = 'sr-mobile-qr-overlay';
    el.setAttribute('style', [
      'position:fixed', 'display:none', 'box-sizing:border-box',
      'z-index:2147483640', 'background:#000',
      'border:1px solid #f97316', 'overflow:hidden',
      'pointer-events:auto', 'touch-action:manipulation'
    ].join(';'));

    var reader = document.createElement('div');
    reader.id = 'sr-host-qr-reader';
    reader.setAttribute('style', 'position:absolute;inset:0;width:100%;height:100%;');

    var inlineStart = document.createElement('button');
    inlineStart.id = 'sr-host-qr-inline-start';
    inlineStart.type = 'button';
    inlineStart.textContent = 'TAP TO START CAMERA';

    el.appendChild(reader);
    el.appendChild(inlineStart);
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
    hostMobileQrInlineStart = inlineStart;
    return el;
  }

  function hostMobileScanWireInlineStart_() {
    if (!hostMobileQrInlineStart) hostMobileQrInlineStart = document.getElementById('sr-host-qr-inline-start');
    if (!hostMobileQrInlineStart || hostMobileQrInlineStart.dataset.bound === '1') return;
    hostMobileQrInlineStart.dataset.bound = '1';
    function onTap(ev) {
      if (ev) { ev.preventDefault(); ev.stopPropagation(); }
      hostMobileScanShowInlineStart_(false);
      hostMobileScanStartEngine_();
    }
    hostMobileQrInlineStart.addEventListener('click', onTap);
    hostMobileQrInlineStart.addEventListener('touchend', onTap, { passive: false });
  }

  function hostMobileScanShowInlineStart_(show) {
    hostMobileScanWireInlineStart_();
    if (!hostMobileQrInlineStart) return;
    if (show) {
      hostMobileQrInlineStart.classList.add('is-visible');
      hostMobileQrInlineStart.style.display = 'flex';
    } else {
      hostMobileQrInlineStart.classList.remove('is-visible');
      hostMobileQrInlineStart.style.display = 'none';
    }
  }

  function hostMobileScanParsePayload_(data) {
    if (!data) return { rect: null, permRect: null };
    if (data.rect) return { rect: data.rect, permRect: data.permRect || null };
    return { rect: data, permRect: null };
  }

  function hostMobileScanPositionOverlay_(data) {
    var payload = hostMobileScanParsePayload_(data);
    hostMobileQrCameraRect = hostMobileScanGlobalRect_(payload.rect);
    var g = hostMobileQrCameraRect;
    var overlay = hostMobileScanEnsureOverlay();
    overlay.style.top = Math.round(g.top) + 'px';
    overlay.style.left = Math.round(g.left) + 'px';
    overlay.style.width = Math.round(g.width) + 'px';
    overlay.style.height = Math.round(g.height) + 'px';
    hostMobileScanPositionPermBtn_(payload.permRect);
  }

  function hostMobileScanPositionPermBtn_(permRect) {
    if (!hostMobileQrPermBtn) hostMobileQrPermBtn = document.getElementById('sr-mobile-qr-perm-btn');
    if (!hostMobileQrPermBtn) return;
    var fr = hostMobileScanFrameRect_();
    var top;
    var left;
    var w = 36;
    var h = 36;
    if (permRect && permRect.width) {
      top = fr.top + permRect.top;
      left = fr.left + permRect.left;
      w = Math.max(permRect.width, 32);
      h = Math.max(permRect.height, 32);
    } else if (hostMobileQrCameraRect) {
      top = hostMobileQrCameraRect.top + 8;
      left = hostMobileQrCameraRect.left + 8;
    } else {
      return;
    }
    hostMobileQrPermBtn.style.top = Math.round(top) + 'px';
    hostMobileQrPermBtn.style.left = Math.round(left) + 'px';
    hostMobileQrPermBtn.style.width = Math.round(w) + 'px';
    hostMobileQrPermBtn.style.height = Math.round(h) + 'px';
    hostMobileQrPermBtn.style.display = 'flex';
    hostMobileQrPermBtn.setAttribute('aria-hidden', 'false');
  }

  function hostMobileScanHidePermBtn_() {
    if (!hostMobileQrPermBtn) hostMobileQrPermBtn = document.getElementById('sr-mobile-qr-perm-btn');
    if (!hostMobileQrPermBtn) return;
    hostMobileQrPermBtn.style.display = 'none';
    hostMobileQrPermBtn.classList.remove('is-pulse');
    hostMobileQrPermBtn.setAttribute('aria-hidden', 'true');
  }

  function hostMobileScanPulsePermBtn_() {
    if (!hostMobileQrPermBtn) hostMobileQrPermBtn = document.getElementById('sr-mobile-qr-perm-btn');
    if (hostMobileQrPermBtn) hostMobileQrPermBtn.classList.add('is-pulse');
  }

  function hostMobileScanStopEngine_() {
    hostMobileScanUnlockStarting_();
    if (!hostMobileQrEngine) return;
    var eng = hostMobileQrEngine;
    hostMobileQrEngine = null;
    eng.stop().then(function() {
      try { eng.clear(); } catch (e) { /* ignore */ }
    }).catch(function() {
      try { eng.clear(); } catch (e2) { /* ignore */ }
    });
  }

  function hostMobileScanHideOverlay_() {
    hostMobileScanShowInlineStart_(false);
    if (hostMobileQrOverlay) hostMobileQrOverlay.style.display = 'none';
    hostMobileScanHidePermBtn_();
  }

  function hostMobileScanHideEmbedFrame_() {
    hostMobileScanShowEmbedFrame_(false);
  }

  function hostMobileScanRepositionOpen_() {
    if (hostMobileQrOpen && hostMobileQrLastOpenData) {
      if (hostMobileScanDocked) {
        hostMobileScanPositionStageCam_();
      }
      if (hostMobileQrEngine && hostMobileQrOverlay) {
        hostMobileScanPositionOverlay_(hostMobileQrLastOpenData);
      }
    }
  }

  function hostMobileScanScheduleReposition_() {
    [0, 100, 250, 500, 1000].forEach(function(ms) {
      setTimeout(hostMobileScanRepositionOpen_, ms);
    });
  }

  function hostMobileScanPermRetry_() {
    hostMobileScanUnlockStarting_();
    hostMobileScanStopEngine_();
    if (hostMobileQrOverlay) hostMobileQrOverlay.style.display = 'none';
    hostMobileScanHideEmbedFrame_();
    hostMobileScanDocked = false;
    hostMobileScanLaunchStage_();
    hostMobileScanPostToStageCam_({ type: 'SHOWRUNNER_EMBED_CAM_PERM_RETRY' });
    hostMobileScanPulsePermBtn_();
    hostMobileScanRelay_({ type: 'SHOWRUNNER_MOBILE_SCAN_READY' });
  }

  function hostMobileScanPostToStageCam_(msg) {
    var stageCam = hostMobileScanGetStageCam_();
    if (!stageCam || !stageCam.contentWindow) return;
    try { stageCam.contentWindow.postMessage(msg, '*'); } catch (e) { /* ignore */ }
  }

  function hostMobileScanOpen_(data) {
    hostMobileQrLastOpenData = data;
    hostMobileQrOpen = true;
    hostMobileScanUnlockStarting_();
    hostMobileScanStopEngine_();
    if (hostMobileQrOverlay) hostMobileQrOverlay.style.display = 'none';
    hostMobileScanShowInlineStart_(false);
    hostMobileScanRelay_({ type: 'SHOWRUNNER_MOBILE_SCAN_GATE_ACK' });
    hostMobileScanRelay_({ type: 'SHOWRUNNER_MOBILE_SCAN_READY' });
    hostMobileScanScheduleReposition_();
  }

  function hostMobileScanWirePermBtn_() {
    if (!hostMobileQrPermBtn) hostMobileQrPermBtn = document.getElementById('sr-mobile-qr-perm-btn');
    if (!hostMobileQrPermBtn || hostMobileQrPermBtn.dataset.bound === '1') return;
    hostMobileQrPermBtn.dataset.bound = '1';
    function onPerm(ev) {
      if (ev) { ev.preventDefault(); ev.stopPropagation(); }
      hostMobileScanUnlockStarting_();
      hostMobileScanStopEngine_();
      hostMobileScanShowInlineStart_(false);
      if (hostMobileScanStageOpen) {
        hostMobileScanPostToStageCam_({ type: 'SHOWRUNNER_EMBED_CAM_START' });
      } else if (hostMobileQrOpen) {
        hostMobileScanLaunchStage_();
      } else {
        hostMobileScanPostToEmbed_({ type: 'SHOWRUNNER_EMBED_CAM_START' });
      }
    }
    hostMobileQrPermBtn.addEventListener('click', onPerm);
    hostMobileQrPermBtn.addEventListener('touchend', function(ev) {
      ev.preventDefault();
      onPerm(ev);
    }, { passive: false });
  }

  function hostMobileScanStartEngine_() {
    if (typeof Html5Qrcode === 'undefined') {
      hostMobileScanShowInlineStart_(true);
      hostMobileScanRelay_({ type: 'SHOWRUNNER_MOBILE_QR_SCAN_ERROR', message: 'Camera scanner failed to load.' });
      return;
    }
    if (hostMobileQrEngine || hostMobileQrStarting) return;
    hostMobileQrStarting = true;
    hostMobileScanClearStartTimer_();
    hostMobileQrStartTimer = setTimeout(function() {
      if (!hostMobileQrStarting) return;
      hostMobileScanUnlockStarting_();
      hostMobileScanShowTapGateBand_();
      hostMobileScanPulsePermBtn_();
      hostMobileScanRelay_({ type: 'SHOWRUNNER_MOBILE_QR_SCAN_ERROR', message: 'Camera timed out — tap TAP TO START CAMERA or the camera icon.' });
    }, 8000);

    function onFail(err) {
      hostMobileScanUnlockStarting_();
      hostMobileScanStopEngine_();
      if (hostMobileQrOverlay) hostMobileQrOverlay.style.display = 'none';
      if (hostMobileQrTapBtn) {
        hostMobileQrTapBtn.disabled = false;
        hostMobileQrTapBtn.textContent = 'TAP TO START CAMERA';
      }
      hostMobileScanShowTapGateBand_();
      hostMobileScanPulsePermBtn_();
      var msg = String(err && err.message ? err.message : err);
      hostMobileScanRelay_({ type: 'SHOWRUNNER_MOBILE_QR_SCAN_ERROR', message: msg });
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
      hostMobileScanUnlockStarting_();
      hostMobileScanHideTapGate_();
      hostMobileScanShowInlineStart_(false);
      if (hostMobileQrOverlay) hostMobileQrOverlay.style.display = 'block';
      if (hostMobileQrPermBtn) hostMobileQrPermBtn.classList.remove('is-pulse');
      hostMobileScanRelay_({ type: 'SHOWRUNNER_MOBILE_QR_CAMERA_ACTIVE' });
    }

    // User gesture path: skip getCameras (can hang on Android) and open rear camera directly.
    startWithConfig({ facingMode: 'environment' }).then(afterOk).catch(function() {
      if (typeof Html5Qrcode.getCameras !== 'function') {
        onFail(new Error('Camera not available'));
        return;
      }
      Html5Qrcode.getCameras().then(function(cams) {
        if (!cams || !cams.length) return startWithConfig({ facingMode: 'environment' });
        var back = null;
        for (var i = 0; i < cams.length; i++) {
          var lab = String(cams[i].label || '').toLowerCase();
          if (lab.indexOf('back') !== -1 || lab.indexOf('rear') !== -1 || lab.indexOf('environment') !== -1) {
            back = cams[i];
            break;
          }
        }
        return startWithConfig((back || cams[cams.length - 1]).id);
      }).then(afterOk).catch(onFail);
    });
  }

  function hostMobileScanStop() {
    hostMobileQrOpen = false;
    hostMobileQrLastOpenData = null;
    hostMobileQrCameraRect = null;
    hostMobileScanStageOpen = false;
    hostMobileScanDocked = false;
    hostMobileScanCloseShellCam_();
    hostMobileScanHideOverlay_();
    hostMobileScanStopEngine_();
    hostMobileScanPostToEmbed_({ type: 'SHOWRUNNER_EMBED_CAM_STOP' });
    hostMobileScanPostToStageCam_({ type: 'SHOWRUNNER_EMBED_CAM_STOP' });
    hostMobileScanHideEmbedFrame_();
    hostMobileScanResetStage_();
    hostMobileScanRestoreAppFrame_();
    hostMobileScanHideTapGate_();
  }

  function hostMobileScanEnsureTapGate() {
    if (!hostMobileQrTapGate) hostMobileQrTapGate = document.getElementById('sr-mobile-qr-tap-gate');
    if (!hostMobileQrTapBtn) hostMobileQrTapBtn = document.getElementById('sr-host-qr-tap-gate-btn');
    return hostMobileQrTapGate;
  }

  function hostMobileScanWireTapGate_() {
    hostMobileScanEnsureTapGate();
    if (!hostMobileQrTapBtn || hostMobileQrTapBtn.dataset.bound === '1') return;
    hostMobileQrTapBtn.dataset.bound = '1';
    function onTap(ev) {
      if (ev) { ev.preventDefault(); ev.stopPropagation(); }
      if (hostMobileQrTapBtn) {
        hostMobileQrTapBtn.disabled = true;
        hostMobileQrTapBtn.textContent = 'STARTING…';
      }
      var overlay = hostMobileScanEnsureOverlay();
      overlay.style.display = 'block';
      hostMobileScanStartEngine_();
    }
    hostMobileQrTapBtn.addEventListener('click', onTap);
    hostMobileQrTapBtn.addEventListener('touchend', onTap, { passive: false });
  }

  function hostMobileScanShowTapGate_() {
    hostMobileScanEnsureTapGate();
    if (frame) {
      frame.dataset.srPrevDisplay = frame.style.display || '';
      frame.style.display = 'none';
    }
    if (hostMobileQrTapGate) {
      hostMobileQrTapGate.classList.add('is-open');
      hostMobileQrTapGate.setAttribute('aria-hidden', 'false');
    }
    document.body.classList.add('sr-mobile-scan-gate-open');
  }

  function hostMobileScanRestoreFrame_() {
    if (frame) frame.style.display = frame.dataset.srPrevDisplay || 'block';
  }

  function hostMobileScanShowTapGateBand_() {
    hostMobileScanEnsureTapGate();
    if (!hostMobileQrTapGate || !hostMobileQrCameraRect) return;
    var g = hostMobileQrCameraRect;
    hostMobileQrTapGate.classList.add('is-open', 'is-band');
    hostMobileQrTapGate.setAttribute('aria-hidden', 'false');
    hostMobileQrTapGate.style.top = Math.round(g.top) + 'px';
    hostMobileQrTapGate.style.left = Math.round(g.left) + 'px';
    hostMobileQrTapGate.style.width = Math.round(g.width) + 'px';
    hostMobileQrTapGate.style.height = Math.round(g.height) + 'px';
  }

  function hostMobileScanHideTapGate_() {
    if (hostMobileQrTapGate) {
      hostMobileQrTapGate.classList.remove('is-open', 'is-band');
      hostMobileQrTapGate.setAttribute('aria-hidden', 'true');
      hostMobileQrTapGate.style.top = '';
      hostMobileQrTapGate.style.left = '';
      hostMobileQrTapGate.style.width = '';
      hostMobileQrTapGate.style.height = '';
    }
    document.body.classList.remove('sr-mobile-scan-gate-open');
    hostMobileScanRestoreFrame_();
  }

  var hostMobileQrPendingRetryTimer = null;

  function hostMobileScanRelayReady_() {
    return !!(frame && frame.contentWindow);
  }

  function hostMobileScanReadPending_() {
    try {
      return sessionStorage.getItem('sm_mobile_qr_pending') || localStorage.getItem('sm_mobile_qr_pending') || '';
    } catch (e) { return ''; }
  }

  function hostMobileScanClearPending_() {
    hostMobileScanReloadIssued_ = false;
    try {
      sessionStorage.removeItem('sm_mobile_qr_pending');
      localStorage.removeItem('sm_mobile_qr_pending');
    } catch (e) { /* ignore */ }
  }

  function hostMobileScanSchedulePendingRetry_() {
    if (hostMobileQrPendingRetryTimer) return;
    var attempts = 0;
    hostMobileQrPendingRetryTimer = setInterval(function() {
      attempts += 1;
      hostMobileScanFlushPending_();
      if (attempts >= 48 || !hostMobileScanReadPending_()) {
        clearInterval(hostMobileQrPendingRetryTimer);
        hostMobileQrPendingRetryTimer = null;
      }
    }, 500);
  }

  function hostMobileScanClearReopen_() {
    try {
      sessionStorage.removeItem('sm_mobile_scan_reopen_panel');
      localStorage.removeItem('sm_mobile_scan_reopen_panel');
    } catch (e) { /* ignore */ }
  }

  function hostMobileScanShouldReopen_() {
    try {
      return sessionStorage.getItem('sm_mobile_scan_reopen_panel') === '1' ||
        localStorage.getItem('sm_mobile_scan_reopen_panel') === '1';
    } catch (e) { return false; }
  }

  function hostMobileScanFlushPending_() {
    try {
      var raw = hostMobileScanReadPending_();
      var reopen = hostMobileScanShouldReopen_();
      if (!raw && reopen) {
        if (!hostMobileScanRelayReady_()) {
          hostMobileScanSchedulePendingRetry_();
          return;
        }
        try {
          frame.contentWindow.postMessage({ type: 'SHOWRUNNER_MOBILE_SCAN_REOPEN' }, '*');
        } catch (e) {
          hostMobileScanSchedulePendingRetry_();
        }
        return;
      }
      if (!raw) return;
      if (!hostMobileScanRelayReady_()) {
        hostMobileScanSchedulePendingRetry_();
        return;
      }
      try {
        hostMobileScanStageOnServer_(raw);
        frame.contentWindow.postMessage({
          type: 'SHOWRUNNER_MOBILE_QR_SCAN',
          text: raw,
          reopenPanel: reopen
        }, '*');
      } catch (e) {
        hostMobileScanSchedulePendingRetry_();
      }
    } catch (e) { /* ignore */ }
  }

  function hostMobileScanIngestUrlScan_() {
    try {
      var p = new URLSearchParams(window.location.search);
      var raw = p.get('srScan');
      if (!raw) return;
      sessionStorage.setItem('sm_mobile_qr_pending', raw);
      localStorage.setItem('sm_mobile_qr_pending', raw);
      sessionStorage.setItem('sm_mobile_scan_reopen_panel', '1');
      localStorage.setItem('sm_mobile_scan_reopen_panel', '1');
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname + (window.location.hash || ''));
      }
    } catch (e) { /* ignore */ }
  }
  hostMobileScanIngestUrlScan_();
  if (hostMobileScanReadPending_()) hostMobileScanSchedulePendingRetry_();

  hostMobileScanWireTapGate_();
  hostMobileScanWirePermBtn_();
  hostMobileScanWireInlineStart_();
  hostMobileScanWireStage_();
  window.addEventListener('pageshow', function() {
    hostMobileScanEmergencyReset_();
    if (hostMobileScanReadPending_() || hostMobileScanShouldReopen_()) {
      hostMobileScanSchedulePendingRetry_();
    }
    hostMobileScanFlushPending_();
  });
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState !== 'visible') return;
    hostMobileScanEmergencyReset_();
    hostMobileScanFlushPending_();
  });
  window.addEventListener('resize', hostMobileScanRepositionOpen_, { passive: true });
  window.addEventListener('scroll', hostMobileScanRepositionOpen_, { passive: true });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', hostMobileScanRepositionOpen_);
    window.visualViewport.addEventListener('scroll', hostMobileScanRepositionOpen_);
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
    hostMobileScanFlushPending_();
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
      hostMobileScanFlushPending_();
    }
    if (ev.data.type === 'SHOWRUNNER_MOBILE_QR_SCAN_ACK') {
      hostMobileScanClearPending_();
      hostMobileScanClearReopen_();
      if (hostMobileQrPendingRetryTimer) {
        clearInterval(hostMobileQrPendingRetryTimer);
        hostMobileQrPendingRetryTimer = null;
      }
      return;
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
    if (hostMobileScanIsScanPageMsg_(ev)) {
      if (ev.data.type === 'SHOWRUNNER_SCAN_PAGE_QR') {
        hostMobileScanCloseCameraPage_();
        hostMobileScanDeliverScan_(ev.data.text, true);
      } else if (ev.data.type === 'SHOWRUNNER_SCAN_PAGE_CANCEL') {
        hostMobileScanCloseCameraPage_();
      }
      return;
    }
    if (ev.data.type === 'SHOWRUNNER_MOBILE_SCAN_OPEN_CAMERA') {
      if (ev.data.sessionToken) hostMobileScanSessionToken_ = String(ev.data.sessionToken).trim();
      hostMobileScanOpenShellCam_();
      return;
    }
    if (hostMobileScanIsEmbedMsg_(ev)) {
      if (ev.data.type === 'SHOWRUNNER_EMBED_QR_SCAN') {
        hostMobileScanRelay_({ type: 'SHOWRUNNER_MOBILE_QR_SCAN', text: ev.data.text });
      } else if (ev.data.type === 'SHOWRUNNER_EMBED_CAM_ACTIVE') {
        if (hostMobileScanStageOpen) hostMobileScanDockStage_();
        hostMobileScanRelay_({ type: 'SHOWRUNNER_MOBILE_QR_CAMERA_ACTIVE' });
      } else if (ev.data.type === 'SHOWRUNNER_EMBED_CAM_ERROR') {
        hostMobileScanRelay_({ type: 'SHOWRUNNER_MOBILE_QR_SCAN_ERROR', message: ev.data.message });
      }
      return;
    }
    if (ev.data.type === 'SHOWRUNNER_MOBILE_SCAN_LAUNCH') {
      if (!hostMobileQrOpen) hostMobileScanOpen_(ev.data);
      else {
        hostMobileQrLastOpenData = ev.data;
        hostMobileScanLaunchStage_();
      }
      return;
    }
    if (ev.data.type === 'SHOWRUNNER_MOBILE_SCAN_USER_TAP') {
      if (!hostMobileQrOpen) hostMobileScanOpen_(ev.data);
      else {
        hostMobileQrLastOpenData = ev.data;
        hostMobileScanPositionEmbedFrame_(ev.data);
        hostMobileScanShowEmbedFrame_(true);
      }
      return;
    }
    if (ev.data.type === 'SHOWRUNNER_MOBILE_SCAN_OPEN') {
      hostMobileScanOpen_(ev.data);
      return;
    }
    if (ev.data.type === 'SHOWRUNNER_MOBILE_SCAN_REPOSITION') {
      if (hostMobileQrOpen) {
        hostMobileQrLastOpenData = ev.data;
        if (hostMobileScanDocked) hostMobileScanPositionStageCam_();
      }
      return;
    }
    if (ev.data.type === 'SHOWRUNNER_MOBILE_SCAN_STOP') {
      hostMobileScanStop();
      return;
    }
    if (ev.data.type === 'SHOWRUNNER_MOBILE_SCAN_PERM_RETRY') {
      if (!hostMobileQrOpen) {
        hostMobileScanOpen_(ev.data);
      } else {
        hostMobileQrLastOpenData = ev.data;
        hostMobileScanPositionOverlay_(ev.data);
        hostMobileScanPermRetry_();
      }
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
      hostMobileScanFlushPending_();
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
