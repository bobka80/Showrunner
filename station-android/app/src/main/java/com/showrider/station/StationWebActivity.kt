package com.showrider.station

import android.annotation.SuppressLint
import android.app.KeyguardManager
import android.bluetooth.BluetoothAdapter
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import android.view.KeyEvent
import android.view.View
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.isVisible

class StationWebActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var statusBar: TextView
    private lateinit var splash: View
    private lateinit var rfid: RfidManager
    private val splashHandler = Handler(Looper.getMainLooper())
    private var splashHidden = false
    private var webViewRestored = false
    private var lastWakeAt = 0L

    @SuppressLint("SetJavaScriptEnabled")
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
        // Safety net: never let the splash trap the operator if the shell never reports in.
        splashHandler.postDelayed({ hideSplash() }, SPLASH_TIMEOUT_MS)

        rfid = RfidManager(
            context = this,
            onTagScanned = { epc -> deliverEpcToShowrunner(epc) },
            onStatus = { msg -> postGunStatus(msg) },
            onTriggerWake = { maybeWakeForTrigger() },
        )
        rfid.startWatchdog()

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            userAgentString = userAgentString + " ShowrunnerStation/0.1"
        }

        // Web setup view -> native gun controls (injected into the hosting shell frame).
        webView.addJavascriptInterface(StationBridge(), "AndroidStation")

        webView.webChromeClient = WebChromeClient()
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean = false
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

    private fun ensureBleReady() {
        if (!BlePermissions.hasAll(this)) {
            BlePermissions.request(this, REQ_BLE_PERMISSIONS)
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
     * Called from the gun-trigger handler (SDK key event). If the screen is asleep, wake it and
     * report that this pull was consumed as a wake (true) so the trigger handler skips the read —
     * the operator's next pull scans. If the screen is already on, return false = scan normally.
     * Safe to call from the SDK/binder thread: the interactive check is thread-safe and the actual
     * wake is posted to the UI thread.
     */
    private fun maybeWakeForTrigger(): Boolean {
        val pm = getSystemService(PowerManager::class.java) ?: return false
        if (pm.isInteractive) return false
        // Debounce: BLE can deliver a couple of key events back-to-back; only one should wake.
        val now = System.currentTimeMillis()
        if (now - lastWakeAt < WAKE_DEBOUNCE_MS) return true
        lastWakeAt = now
        runOnUiThread { wakeScreen(pm) }
        return true
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

    private fun deliverEpcToShowrunner(epc: String) {
        val safe = epc.replace("\\", "\\\\").replace("'", "\\'")
        // Showrunner runs inside an iframe on the hosting shell, so onStationRfidScan lives in the
        // child frame. Prefer the shell relay (posts into the iframe); fall back to a direct call
        // when the app is pointed straight at the GAS URL.
        val js = "(function(t){try{" +
            "if(typeof window.showrunnerStationDeliverScan==='function'){window.showrunnerStationDeliverScan(t);}" +
            "else if(typeof window.onStationRfidScan==='function'){window.onStationRfidScan(t);}" +
            "}catch(e){}})('$safe');"
        runOnUiThread { webView.evaluateJavascript(js, null) }
    }

    private fun postGunStatus(msg: String) {
        if (msg.isBlank()) return
        runOnUiThread {
            Toast.makeText(this, msg, Toast.LENGTH_SHORT).show()
            val safe = msg.replace("\\", "\\\\").replace("'", "\\'")
            webView.evaluateJavascript(
                "try{if(typeof window.stationOnGunStatus_==='function')window.stationOnGunStatus_('$safe');}catch(e){}",
                null,
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

        /** Station shell mounted inside the WebView — drop the kiosk splash. */
        @JavascriptInterface
        fun shellReady() { hideSplash() }

        /** A login screen needs the operator — reveal the WebView so they can act. */
        @JavascriptInterface
        fun loginNeeded() { hideSplash() }
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
        // Reconnect the gun after background without reloading the WebView.
        if (::rfid.isInitialized && BlePermissions.hasAll(this)) {
            rfid.connectIfNeeded()
        }
    }

    override fun onPause() {
        rfid.stopInventory()
        super.onPause()
    }

    override fun onDestroy() {
        splashHandler.removeCallbacksAndMessages(null)
        rfid.disconnect()
        webView.destroy()
        super.onDestroy()
    }

    companion object {
        private const val SHOWRUNNER_URL = "https://sm-showrunner-97405.web.app"
        private const val REQ_BLE_PERMISSIONS = 1001
        private const val REQ_ENABLE_BT = 1002
        private const val SPLASH_TIMEOUT_MS = 30000L
        private const val WAKE_HOLD_MS = 4000L
        private const val WAKE_DEBOUNCE_MS = 1500L
    }
}
