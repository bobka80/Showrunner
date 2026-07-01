package com.showrider.station

import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.content.Intent
import android.os.Bundle
import android.view.KeyEvent
import android.view.WindowManager
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.isVisible

class StationWebActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var statusBar: TextView
    private lateinit var rfid: RfidManager

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_station_web)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        webView = findViewById(R.id.station_webview)
        statusBar = findViewById(R.id.station_status)

        rfid = RfidManager(
            context = this,
            onTagScanned = { epc -> deliverEpcToShowrunner(epc) },
            onStatus = { msg ->
                statusBar.text = msg
                statusBar.isVisible = msg.isNotBlank()
            },
        )

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            userAgentString = userAgentString + " ShowrunnerStation/0.1"
        }

        webView.webChromeClient = WebChromeClient()
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean = false
        }

        webView.loadUrl(SHOWRUNNER_URL)
        ensureBleReady()
    }

    private fun ensureBleReady() {
        if (!BlePermissions.hasAll(this)) {
            BlePermissions.request(this, REQ_BLE_PERMISSIONS)
            return
        }
        val adapter = BluetoothAdapter.getDefaultAdapter()
        if (adapter == null) {
            statusBar.text = "Bluetooth not available on this device"
            statusBar.isVisible = true
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
                statusBar.text = "Bluetooth permissions required for the RFID gun"
                statusBar.isVisible = true
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

    private fun deliverEpcToShowrunner(epc: String) {
        val safe = epc.replace("\\", "\\\\").replace("'", "\\'")
        val js = "if (typeof window.onStationRfidScan === 'function') { window.onStationRfidScan('$safe'); }"
        runOnUiThread { webView.evaluateJavascript(js, null) }
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        // Fallback if SDK key events do not fire (dev keyboard / some devices).
        if (keyCode == KeyEvent.KEYCODE_F1 || keyCode == KeyEvent.KEYCODE_BUTTON_L1) {
            rfid.performSingleRead()
            return true
        }
        return super.onKeyDown(keyCode, event)
    }

    override fun onPause() {
        rfid.stopInventory()
        super.onPause()
    }

    override fun onDestroy() {
        rfid.disconnect()
        webView.destroy()
        super.onDestroy()
    }

    companion object {
        private const val SHOWRUNNER_URL = "https://sm-showrunner-97405.web.app"
        private const val REQ_BLE_PERMISSIONS = 1001
        private const val REQ_ENABLE_BT = 1002
    }
}
