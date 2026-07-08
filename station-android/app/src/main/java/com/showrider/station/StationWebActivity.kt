package com.showrider.station

import android.annotation.SuppressLint
import android.app.KeyguardManager
import android.bluetooth.BluetoothAdapter
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import android.provider.Settings
import android.view.KeyEvent
import android.view.View
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.RenderProcessGoneDetail
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.isVisible
import org.json.JSONObject

class StationWebActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var statusBar: TextView
    private lateinit var splash: View
    private lateinit var rfid: RfidManager
    private val splashHandler = Handler(Looper.getMainLooper())
    private val gunScreenHandler = Handler(Looper.getMainLooper())
    private var releaseGunScreenRunnable: Runnable? = null
    private var splashHidden = false
    private var webViewRestored = false
    private var lastWakeAt = 0L
    @Volatile private var isInForeground = false
    private var overlayPrompted = false
    private var screenOnReceiver: BroadcastReceiver? = null
    private var lastGunStatusMsg = ""
    private var lastGunStatusAt = 0L
    private var lastRendererReloadAt = 0L
    private val stationPrefs by lazy {
        getSharedPreferences(RfidManager.PREFS_NAME, MODE_PRIVATE)
    }

    @SuppressLint("SetJavaScriptEnabled", "UnspecifiedRegisterReceiverFlag")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_station_web)
        // The tablet is ALLOWED to sleep (screen off) to save power/screen wear — the BLE gun stays
        // connected and the app stays alive in the background. A gun-trigger pull wakes it back up
        // (see maybeWakeForTrigger). So we set the "turn screen on / show over lock" flags here and
        // deliberately do NOT force FLAG_KEEP_SCREEN_ON.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                    WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
            )
        }

        webView = findViewById(R.id.station_webview)
        statusBar = findViewById(R.id.station_status)
        statusBar.isVisible = false
        splash = findViewById(R.id.station_splash)
        // Show the rotating-circle kiosk splash on EVERY cold start, so the operator sees the
        // Showrunner Station loading screen instead of a black screen followed by a flash of the
        // personal web UI while the WebView + hosting shell + GAS iframe boot. The splash is NOT
        // persisted-dismissed: a config-change recreation restores the hidden state via
        // savedInstanceState (below), and a genuine process restart correctly re-shows it. It hides
        // only when the station shell reports ready (shellReady), login is needed, or the timeout.
        // Safety net: never let the splash trap the operator if the shell never reports in.
        splashHandler.postDelayed({ hideSplash() }, SPLASH_TIMEOUT_MS)

        rfid = RfidManager(
            context = this,
            onTagScanned = { epc, tid -> deliverScanToShowrunner(epc, tid) },
            onStatus = { msg -> postGunStatus(msg) },
            onTriggerWake = { maybeWakeForTrigger() },
            onLinkBusy = { busy -> setWebBleReconnecting(busy) },
            onGunActivity = { onGunActivity() },
        )
        rfid.startWatchdog()
        registerScreenOnReceiver()

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            userAgentString = userAgentString + " ShowrunnerStation/0.1"
        }

        // Root cause of the "UI reset + mobile→station flash" on gun disconnect/reconnect: Android
        // kills the WebView renderer process when the WebView is not visible / under memory
        // pressure (gun toggle often dips the screen or backgrounds the app briefly). That fires
        // onRenderProcessGone → full page reload → the GAS iframe cold-boots. Keeping the renderer
        // at IMPORTANT priority and NOT waiving it when off-screen stops the kill, so no reload.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                webView.setRendererPriorityPolicy(
                    WebView.RENDERER_PRIORITY_IMPORTANT,
                    /* waivedWhenNotVisible = */ false,
                )
            } catch (_: Exception) { /* best-effort */ }
        }

        // Web setup view -> native gun controls (injected into the hosting shell frame).
        webView.addJavascriptInterface(StationBridge(), "AndroidStation")

        webView.webChromeClient = WebChromeClient()
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean = false

            override fun onPageFinished(view: WebView?, url: String?) {
                injectPersistedWebSession()
                injectBleFlapGuardFromPrefs()
                injectRendererBreadcrumb()
            }

            override fun onRenderProcessGone(
                view: WebView?,
                detail: RenderProcessGoneDetail?,
            ): Boolean {
                // Breadcrumb: record WHY the last full reload happened so we can confirm on-device
                // whether renderer death was truly the cause of the UI reset. Read it in the station
                // debug line (window.__srLastReload) or via getSavedSession-style inspection.
                val crashed = detail?.didCrash() == true
                recordRendererGone(crashed)
                val now = System.currentTimeMillis()
                if (now - lastRendererReloadAt < RENDERER_RELOAD_DEBOUNCE_MS) return true
                lastRendererReloadAt = now
                armBleFlapGuard(45_000L)
                runOnUiThread {
                    if (!::webView.isInitialized) return@runOnUiThread
                    val current = webView.url
                    if (!current.isNullOrBlank() && current != "about:blank") {
                        webView.reload()
                    } else {
                        webView.loadUrl(SHOWRUNNER_URL)
                    }
                }
                return true
            }
        }

        if (savedInstanceState != null) {
            splashHidden = savedInstanceState.getBoolean("splash_hidden", false)
            webViewRestored = webView.restoreState(savedInstanceState) != null
            if (splashHidden) hideSplash()
        }
        if (!webViewRestored) {
            webView.loadUrl(SHOWRUNNER_URL)
        }
        ensureBleReady()
    }

    override fun onSaveInstanceState(outState: Bundle) {
        if (::webView.isInitialized) {
            webView.saveState(outState)
        }
        outState.putBoolean("splash_hidden", splashHidden)
        super.onSaveInstanceState(outState)
    }

    /**
     * ROOT CAUSE of the "UI reboots on gun connect/disconnect": the RFID gun is a Bluetooth HID
     * keyboard, so pairing/dropping it changes the device keyboard/navigation configuration. Those
     * flags are now declared in the manifest's android:configChanges, so Android delivers the change
     * HERE instead of destroying + recreating the Activity (which rebuilt the WebView and rebooted
     * the UI). We do nothing but keep running — the WebView stays intact. Breadcrumb it so we can
     * prove on-device that gun flap now lands here and no longer recreates the Activity.
     */
    override fun onConfigurationChanged(newConfig: android.content.res.Configuration) {
        super.onConfigurationChanged(newConfig)
        val count = stationPrefs.getInt(PREF_CONFIG_CHANGE_COUNT, 0) + 1
        stationPrefs.edit()
            .putInt(PREF_CONFIG_CHANGE_COUNT, count)
            .putLong(PREF_CONFIG_CHANGE_AT, System.currentTimeMillis())
            .apply()
        evalJs(
            "try{window.__srGunConfigChanges=$count;" +
                "if(typeof window.stationOnGunConfigChange_==='function')" +
                "window.stationOnGunConfigChange_($count);}catch(e){}",
        )
    }

    private fun registerScreenOnReceiver() {
        if (screenOnReceiver != null) return
        screenOnReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                if (intent?.action == Intent.ACTION_SCREEN_ON) {
                    notifyWebHostEjectCheck()
                    if (::rfid.isInitialized) rfid.onAppWake()
                }
            }
        }
        val filter = IntentFilter(Intent.ACTION_SCREEN_ON)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(screenOnReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            @Suppress("DEPRECATION")
            registerReceiver(screenOnReceiver, filter)
        }
    }

    private fun unregisterScreenOnReceiver() {
        screenOnReceiver?.let {
            try { unregisterReceiver(it) } catch (_: Exception) { /* ignore */ }
        }
        screenOnReceiver = null
    }

    private fun startBleKeepAlive() {
        try {
            BleKeepAliveService.start(this)
        } catch (e: Exception) {
            postGunStatus("Background link service unavailable")
        }
    }

    private fun ensureBleReady() {
        if (!BlePermissions.hasAll(this)) {
            BlePermissions.request(this, REQ_BLE_PERMISSIONS)
            return
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            !BlePermissions.hasNotifications(this)
        ) {
            BlePermissions.requestNotifications(this, REQ_POST_NOTIFICATIONS)
            return
        }
        val adapter = BluetoothAdapter.getDefaultAdapter()
        if (adapter == null) {
            postGunStatus("Bluetooth not available on this device")
            return
        }
        if (!adapter.isEnabled) {
            @Suppress("DEPRECATION")
            startActivityForResult(Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE), REQ_ENABLE_BT)
            return
        }
        startBleKeepAlive()
        rfid.connect()
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray,
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == REQ_BLE_PERMISSIONS) {
            if (BlePermissions.hasAll(this)) {
                ensureBleReady()
            } else {
                postGunStatus("Bluetooth permissions required for the RFID gun")
            }
        }
        if (requestCode == REQ_POST_NOTIFICATIONS) {
            ensureBleReady()
        }
    }

    @Deprecated("Deprecated in Java")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        @Suppress("DEPRECATION")
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == REQ_ENABLE_BT) {
            ensureBleReady()
        }
    }

    /**
     * Called from the gun-trigger handler (SDK key event) while the gun is connected. Brings the
     * station up so the operator can scan: wakes the screen if it is asleep AND/OR pulls the app to
     * the foreground if something else is showing (home screen, another app). Returns true when this
     * pull was consumed to bring the app up (so the trigger handler skips the read — the operator's
     * next pull scans, matching the long-standing wake behavior). Returns false only when the app is
     * already visible and interactive, in which case the pull scans normally.
     * Safe to call from the SDK/binder thread: the checks are thread-safe and UI work is posted.
     */
    private fun maybeWakeForTrigger(): Boolean {
        val pm = getSystemService(PowerManager::class.java)
        val needWake = pm != null && !pm.isInteractive
        val needFront = !isInForeground
        if (!needWake && !needFront) return false
        // Debounce: BLE can deliver a couple of key events back-to-back; only one should wake.
        val now = System.currentTimeMillis()
        if (now - lastWakeAt < WAKE_DEBOUNCE_MS) return true
        lastWakeAt = now
        runOnUiThread {
            if (needFront) bringStationToFront()
            if (pm != null) wakeScreen(pm)
            onGunActivity()
        }
        return true
    }

    /**
     * Reorder the (singleTask) station activity to the front from the background. Android blocks
     * background Activity starts on API 29+ unless the app can draw overlays, which is why setup
     * grants "Display over other apps" (ensureOverlayPermission). singleTask means this reorders the
     * existing instance and delivers onNewIntent — no cold reboot / WebView rebuild.
     */
    private fun bringStationToFront() {
        try {
            val intent = Intent(this, StationWebActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
            }
            startActivity(intent)
        } catch (_: Exception) {
            // Best-effort: if the launch is blocked, the operator can still open the app manually.
        }
    }

    /**
     * One-time kiosk setup: the trigger-brings-app-to-front feature needs background Activity-launch,
     * which Android only allows with the "Display over other apps" (SYSTEM_ALERT_WINDOW) permission.
     * Prompt for it once if it is not already granted.
     */
    private fun ensureOverlayPermission() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return
        if (Settings.canDrawOverlays(this) || overlayPrompted) return
        overlayPrompted = true
        try {
            startActivity(
                Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:$packageName"),
                ),
            )
        } catch (_: Exception) {
            // Some ROMs lack the settings screen; skip silently.
        }
    }

    /** Keep the panel on while the gun is in use; release after idle so normal sleep applies. */
    private fun onGunActivity() {
        runOnUiThread {
            window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            releaseGunScreenRunnable?.let { gunScreenHandler.removeCallbacks(it) }
            val release = Runnable {
                window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            }
            releaseGunScreenRunnable = release
            gunScreenHandler.postDelayed(release, GUN_SCREEN_IDLE_MS)
        }
    }

    private fun releaseGunScreenKeepOn() {
        releaseGunScreenRunnable?.let { gunScreenHandler.removeCallbacks(it) }
        releaseGunScreenRunnable = null
        window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    }

    private fun notifyWebHostEjectCheck() {
        evalJs(
            "try{if(typeof window.stationCheckHostEjectDeadline_==='function')" +
                "window.stationCheckHostEjectDeadline_();}catch(e){}",
        )
    }

    @Suppress("DEPRECATION")
    private fun wakeScreen(pm: PowerManager) {
        try {
            // Show over the lock screen and turn the display on for this activity.
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
                setShowWhenLocked(true)
                setTurnScreenOn(true)
                getSystemService(KeyguardManager::class.java)?.requestDismissKeyguard(this, null)
            } else {
                window.addFlags(
                    WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                        WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
                        WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
                )
            }
            // A brief ACQUIRE_CAUSES_WAKEUP lock actually powers the panel back on; it auto-releases.
            val wl = pm.newWakeLock(
                PowerManager.FULL_WAKE_LOCK or
                    PowerManager.ACQUIRE_CAUSES_WAKEUP or
                    PowerManager.ON_AFTER_RELEASE,
                "showrunner:trigger-wake",
            )
            wl.acquire(WAKE_HOLD_MS)
        } catch (_: Exception) {
            // Best-effort: if wake fails, the operator can still tap the screen.
        }
    }

    private fun hideSplash() {
        if (splashHidden) return
        splashHidden = true
        splashHandler.removeCallbacksAndMessages(null)
        runOnUiThread {
            splash.animate().alpha(0f).setDuration(300).withEndAction {
                splash.visibility = View.GONE
            }.start()
        }
    }

    private fun evalJs(js: String) {
        if (!::webView.isInitialized) return
        runOnUiThread {
            try {
                webView.evaluateJavascript(js, null)
            } catch (_: Exception) { /* ignore */ }
        }
    }

    private fun setWebBleReconnecting(active: Boolean) {
        if (active) {
            armBleFlapGuard(30_000L)
            evalJs("try{window.__srBleReconnecting=true;}catch(e){}")
        } else {
            armBleFlapGuard(20_000L)
            evalJs("try{window.__srBleReconnecting=false;}catch(e){}")
        }
    }

    private fun armBleFlapGuard(durationMs: Long) {
        val until = System.currentTimeMillis() + durationMs
        stationPrefs.edit().putLong(PREF_BLE_FLAP_UNTIL, until).apply()
        evalJs(
            "try{window.__srBleFlapUntil=$until;window.__srBleReconnecting=true;}catch(e){}",
        )
    }

    private fun injectBleFlapGuardFromPrefs() {
        val until = stationPrefs.getLong(PREF_BLE_FLAP_UNTIL, 0L)
        if (until <= System.currentTimeMillis()) return
        evalJs(
            "try{window.__srBleFlapUntil=$until;window.__srBleReconnecting=true;}catch(e){}",
        )
    }

    /**
     * Diagnostic breadcrumb: the WebView renderer being killed (onRenderProcessGone) is the
     * suspected cause of the UI reset on gun toggle. Count it + timestamp it in prefs so we can
     * prove whether the renderer-priority fix eliminated it. Reset the counter to zero here so the
     * meaning is "reloads since this build was installed".
     */
    private fun recordRendererGone(crashed: Boolean) {
        val count = stationPrefs.getInt(PREF_RENDERER_GONE_COUNT, 0) + 1
        stationPrefs.edit()
            .putInt(PREF_RENDERER_GONE_COUNT, count)
            .putLong(PREF_RENDERER_GONE_AT, System.currentTimeMillis())
            .putBoolean(PREF_RENDERER_GONE_CRASHED, crashed)
            .apply()
    }

    /** Publish the renderer-death breadcrumb into the page so the station debug line can show it. */
    private fun injectRendererBreadcrumb() {
        val count = stationPrefs.getInt(PREF_RENDERER_GONE_COUNT, 0)
        val at = stationPrefs.getLong(PREF_RENDERER_GONE_AT, 0L)
        val crashed = stationPrefs.getBoolean(PREF_RENDERER_GONE_CRASHED, false)
        evalJs(
            "try{window.__srRendererGone={count:$count,at:$at,crashed:$crashed};" +
                "if($count>0&&typeof window.stationOnRendererBreadcrumb_==='function')" +
                "window.stationOnRendererBreadcrumb_(window.__srRendererGone);}catch(e){}",
        )
    }

    private fun injectPersistedWebSession() {
        val token = stationPrefs.getString(PREF_WEB_SESSION_TOKEN, null)?.trim().orEmpty()
        val exp = stationPrefs.getLong(PREF_WEB_SESSION_EXPIRES, 0L)
        if (token.length < 20 || exp <= System.currentTimeMillis()) return
        val quotedToken = JSONObject.quote(token)
        evalJs(
            "try{" +
                "if(!localStorage.getItem('sm_session_token')){" +
                "localStorage.setItem('sm_session_token',$quotedToken);" +
                "localStorage.setItem('sm_session_expires'," + JSONObject.quote(exp.toString()) + ");" +
                "}" +
                "}catch(e){}",
        )
    }

    private fun deliverScanToShowrunner(epc: String, tid: String) {
        val epcQ = JSONObject.quote(epc)
        val tidQ = JSONObject.quote(tid)
        val js = "(function(e,t){try{" +
            "if(typeof window.showrunnerStationDeliverScan==='function'){window.showrunnerStationDeliverScan(e,t);}" +
            "else if(typeof window.onStationRfidScan==='function'){window.onStationRfidScan(e);}" +
            "}catch(err){}})($epcQ,$tidQ);"
        evalJs(js)
    }

    private fun postGunStatus(msg: String) {
        if (msg.isBlank()) return
        val now = System.currentTimeMillis()
        if (msg == lastGunStatusMsg && now - lastGunStatusAt < GUN_STATUS_DEBOUNCE_MS) return
        lastGunStatusMsg = msg
        lastGunStatusAt = now
        runOnUiThread {
            val low = msg.lowercase()
            if (low.contains("fail") || low.contains("error") || low.contains("connected") ||
                low.contains("disconnect") || low.contains("reconnect") || low.contains("reset")
            ) {
                Toast.makeText(this, msg, Toast.LENGTH_SHORT).show()
            }
            val payload = JSONObject()
                .put("type", "SHOWRUNNER_STATION_GUN_STATUS")
                .put("message", msg)
                .toString()
            evalJs(
                "(function(d){try{var f=document.getElementById('app-frame');" +
                    "if(f&&f.contentWindow){f.contentWindow.postMessage(d,'*');}" +
                    "}catch(e){}})($payload);",
            )
        }
    }

    /** Exposed to JS as `AndroidStation` (hosting-shell frame). Runs on a binder thread. */
    inner class StationBridge {
        @JavascriptInterface
        fun getConfig(): String = rfid.currentConfigJson()

        @JavascriptInterface
        fun setPower(power: Int) { rfid.setPowerLevel(power) }

        @JavascriptInterface
        fun setScanMode(mode: String?) { rfid.setScanMode(mode ?: RfidManager.SCAN_MODE_SINGLE) }

        @JavascriptInterface
        fun setBeep(enabled: Boolean) { rfid.setBeepEnabled(enabled) }

        @JavascriptInterface
        fun setPollMs(ms: Int) { rfid.setPollMs(ms) }

        /** Iframe pulls queued scans directly (bypasses the top-frame relay). */
        @JavascriptInterface
        fun pollScans(): String = rfid.drainPendingScans()

        /** Force disconnect + reconnect (Settings → Reconnect gun). */
        @JavascriptInterface
        fun reconnectGun() {
            rfid.forceReconnect()
        }

        /** Sleep the gun to save battery (Settings → auto-sleep timer or Disconnect + sleep). */
        @JavascriptInterface
        fun sleepGun() {
            rfid.sleepGun()
        }

        /** Chainway: minutes with no trigger pull before the gun powers down (0 = never). */
        @JavascriptInterface
        fun setGunIdleSleepMinutes(minutes: Int) {
            rfid.setGunIdleSleepMinutes(minutes)
        }

        /** Station shell mounted inside the WebView — drop the kiosk splash. */
        @JavascriptInterface
        fun shellReady() { hideSplash() }

        /** A login screen needs the operator — reveal the WebView so they can act. */
        @JavascriptInterface
        fun loginNeeded() { hideSplash() }

        /** Parent shell stores device session — survive WebView reload / renderer restart. */
        @JavascriptInterface
        fun saveSession(token: String?, expiresAt: Long) {
            val t = token?.trim().orEmpty()
            if (t.length < 20) {
                stationPrefs.edit()
                    .remove(PREF_WEB_SESSION_TOKEN)
                    .remove(PREF_WEB_SESSION_EXPIRES)
                    .apply()
                return
            }
            stationPrefs.edit()
                .putString(PREF_WEB_SESSION_TOKEN, t)
                .putLong(PREF_WEB_SESSION_EXPIRES, expiresAt)
                .apply()
        }

        @JavascriptInterface
        fun getSavedSession(): String {
            val token = stationPrefs.getString(PREF_WEB_SESSION_TOKEN, null)?.trim().orEmpty()
            val exp = stationPrefs.getLong(PREF_WEB_SESSION_EXPIRES, 0L)
            if (token.length < 20 || exp <= System.currentTimeMillis()) return ""
            return JSONObject()
                .put("token", token)
                .put("expiresAt", exp)
                .toString()
        }
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        // Fallback if SDK key events do not fire (dev keyboard / some devices).
        if (keyCode == KeyEvent.KEYCODE_F1 || keyCode == KeyEvent.KEYCODE_BUTTON_L1) {
            rfid.performSingleRead()
            return true
        }
        return super.onKeyDown(keyCode, event)
    }

    override fun onResume() {
        super.onResume()
        isInForeground = true
        ensureOverlayPermission()
        notifyWebHostEjectCheck()
        if (::rfid.isInitialized && BlePermissions.hasAll(this)) {
            rfid.onAppWake()
        }
    }

    override fun onPause() {
        isInForeground = false
        rfid.stopInventory()
        super.onPause()
    }

    override fun onDestroy() {
        splashHandler.removeCallbacksAndMessages(null)
        gunScreenHandler.removeCallbacksAndMessages(null)
        releaseGunScreenKeepOn()
        unregisterScreenOnReceiver()
        BleKeepAliveService.stop(this)
        rfid.disconnect()
        webView.destroy()
        super.onDestroy()
    }

    companion object {
        private const val SHOWRUNNER_URL = "https://sm-showrunner-97405.web.app"
        private const val REQ_BLE_PERMISSIONS = 1001
        private const val REQ_ENABLE_BT = 1002
        private const val REQ_POST_NOTIFICATIONS = 1003
        private const val PREF_WEB_SESSION_TOKEN = "web_session_token"
        private const val PREF_WEB_SESSION_EXPIRES = "web_session_expires"
        private const val PREF_BLE_FLAP_UNTIL = "ble_flap_until"
        private const val PREF_RENDERER_GONE_COUNT = "renderer_gone_count"
        private const val PREF_RENDERER_GONE_AT = "renderer_gone_at"
        private const val PREF_RENDERER_GONE_CRASHED = "renderer_gone_crashed"
        private const val PREF_CONFIG_CHANGE_COUNT = "config_change_count"
        private const val PREF_CONFIG_CHANGE_AT = "config_change_at"
        private const val GUN_STATUS_DEBOUNCE_MS = 1800L
        private const val SPLASH_TIMEOUT_MS = 30000L
        private const val WAKE_HOLD_MS = 4000L
        private const val WAKE_DEBOUNCE_MS = 1500L
        /** Screen stays on while gun is active; release after this idle gap. */
        private const val GUN_SCREEN_IDLE_MS = 90_000L
        private const val RENDERER_RELOAD_DEBOUNCE_MS = 10000L
    }
}
