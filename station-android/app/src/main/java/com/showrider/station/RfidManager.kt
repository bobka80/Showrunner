package com.showrider.station

import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.content.Context
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.util.Log
import com.rscja.deviceapi.RFIDWithUHFBLE
import com.rscja.deviceapi.entity.InventoryParameter
import com.rscja.deviceapi.entity.UHFTAGInfo
import com.rscja.deviceapi.interfaces.ConnectionStatus
import com.rscja.deviceapi.interfaces.ConnectionStatusCallback
import com.rscja.deviceapi.interfaces.IUHFInventoryCallback
import com.rscja.deviceapi.interfaces.KeyEventCallback
import com.rscja.deviceapi.interfaces.ScanBTCallback
import java.util.concurrent.ConcurrentLinkedQueue
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Chainway R6 BLE RFID bridge (SDK: RFIDWithUHFBLE).
 * Auto-connects to [TARGET_BT_NAME], EU band, forwards EPC reads to Showrunner.
 */
class RfidManager(
    private val context: Context,
    private val onTagScanned: (String) -> Unit,
    private val onStatus: (String) -> Unit,
    // Called on every trigger DOWN. Returns true if the tablet screen was asleep and this pull was
    // consumed to WAKE it (so we skip the read this once — the next pull scans). Returns false when
    // the screen is already awake, i.e. a normal scan should happen.
    private val onTriggerWake: () -> Boolean = { false },
) {
    private val uhf = RFIDWithUHFBLE.getInstance()
    private val mainHandler = Handler(Looper.getMainLooper())
    private val worker: ExecutorService = Executors.newSingleThreadExecutor()
    // Separate thread for config/device-info calls (setPower/setBeep/battery/firmware) so a slow
    // BLE round-trip can NEVER starve the tag-read worker above.
    private val configWorker: ExecutorService = Executors.newSingleThreadExecutor()
    private val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    @Volatile
    private var connected = false
    private var inventoryRunning = false
    private var activeDisconnect = false
    private var lastEpc = ""
    private var lastEpcAt = 0L
    private var lastBondedNames = ""
    private val initialized = AtomicBoolean(false)

    // Device-configurable gun settings (persisted in prefs, editable from the web setup view).
    @Volatile private var powerDbm = prefs.getInt(PREF_POWER, DEFAULT_POWER)
    @Volatile private var scanMode = prefs.getString(PREF_SCAN_MODE, SCAN_MODE_SINGLE) ?: SCAN_MODE_SINGLE
    @Volatile private var beepEnabled = prefs.getBoolean(PREF_BEEP, true)
    @Volatile private var pollMs = prefs.getInt(PREF_POLL_MS, DEFAULT_POLL_MS)
    @Volatile private var battery = -1
    @Volatile private var firmware = ""

    // Reliable scan delivery: native evaluateJavascript can only reach the TOP frame, so scans had
    // to be relayed into the Showrunner iframe (fragile). Instead we queue EPCs here and let the
    // iframe pull them directly via the injected AndroidStation bridge (proven working).
    private val pendingScans = ConcurrentLinkedQueue<String>()

    private val connectionCallback = ConnectionStatusCallback<Any> { status, device ->
        mainHandler.post { handleConnectionStatus(status, device as? BluetoothDevice) }
    }

    private fun scheduleReconnect() {
        if (activeDisconnect) return
        mainHandler.postDelayed({
            if (!connected && !activeDisconnect) reconnect()
        }, RECONNECT_MS)
    }

    /** Drop a stale BLE session before opening a new one (avoids SDK churn that felt like an app restart). */
    private fun reconnect() {
        worker.execute {
            try {
                if (activeDisconnect || connected) return@execute
                try {
                    if (uhf.connectStatus != ConnectionStatus.DISCONNECTED) {
                        uhf.disconnect()
                    }
                } catch (e: Exception) {
                    Log.w(TAG, "reconnect: pre-disconnect", e)
                }
                connectInternal()
            } catch (e: Exception) {
                Log.e(TAG, "reconnect failed", e)
                postStatus("RFID reconnect failed")
                scheduleReconnect()
            }
        }
    }

    /** Idempotent entry — safe from onCreate and onResume. */
    fun connectIfNeeded() {
        if (connected || activeDisconnect) return
        worker.execute {
            if (connected || activeDisconnect) return@execute
            connectInternal()
        }
    }

    private fun connectInternal() {
        try {
            if (!initialized.getAndSet(true)) {
                if (!uhf.init(context.applicationContext)) {
                    postStatus("RFID init failed")
                    initialized.set(false)
                    return
                }
            }

            val savedMac = prefs.getString(PREF_BT_MAC, null)?.trim().orEmpty()
            if (savedMac.isNotEmpty()) {
                postStatus("Connecting to gun…")
                mainHandler.post { uhf.connect(savedMac, connectionCallback) }
                return
            }

            val bondedMac = findBondedGunMac()
            if (bondedMac != null) {
                postStatus("Connecting to paired gun…")
                mainHandler.post { uhf.connect(bondedMac, connectionCallback) }
                return
            }

            scanAndConnect()
        } catch (e: Exception) {
            Log.e(TAG, "connect failed", e)
            postStatus("RFID error: ${e.message ?: "unknown"}")
        }
    }

    fun connect() {
        worker.execute { connectInternal() }
    }

    @SuppressLint("MissingPermission")
    private fun findBondedGunMac(): String? {
        val adapter = BluetoothAdapter.getDefaultAdapter() ?: return null
        val bonded = try {
            adapter.bondedDevices
        } catch (e: SecurityException) {
            null
        } ?: return null
        if (bonded.isEmpty()) {
            lastBondedNames = ""
            return null
        }

        // 1. A paired device whose name looks like the gun.
        val named = bonded.firstOrNull { isGunName(it.name) }
        if (named != null) return named.address

        // 2. Dedicated station phone: if exactly one device is paired, it's the gun.
        if (bonded.size == 1) return bonded.first().address

        // 3. Can't tell — remember the names so we can show them on screen.
        lastBondedNames = bonded.joinToString(", ") { (it.name ?: "?") + " (" + it.address + ")" }
        return null
    }

    private fun isGunName(name: String?): Boolean {
        if (name.isNullOrBlank()) return false
        return GUN_NAME_HINTS.any { name.contains(it, ignoreCase = true) }
    }

    @SuppressLint("MissingPermission")
    private fun scanAndConnect() {
        postStatus("Scanning for $TARGET_BT_NAME…")
        var bestMac: String? = null
        var bestRssi = Int.MIN_VALUE

        uhf.startScanBTDevices(ScanBTCallback { device, rssi, _ ->
            if (!isGunName(device.name)) return@ScanBTCallback
            if (rssi > bestRssi) {
                bestRssi = rssi
                bestMac = device.address
            }
        })
        SystemClock.sleep(SCAN_MS)
        uhf.stopScanBTDevices()

        val mac = bestMac
        if (mac.isNullOrBlank()) {
            if (lastBondedNames.isNotBlank()) {
                postStatus("Gun name not recognised. Paired: $lastBondedNames — tell setup which is the gun")
            } else {
                postStatus("Gun not found — power on the R6 and pair it in Android Bluetooth settings")
            }
            scheduleReconnect()
            return
        }

        postStatus("Connecting to $TARGET_BT_NAME…")
        mainHandler.post { uhf.connect(mac, connectionCallback) }
    }

    @SuppressLint("MissingPermission")
    private fun handleConnectionStatus(status: ConnectionStatus, device: BluetoothDevice?) {
        when (status) {
            ConnectionStatus.CONNECTED -> {
                connected = true
                activeDisconnect = false
                val name = device?.name ?: TARGET_BT_NAME
                val mac = device?.address
                if (!mac.isNullOrBlank()) {
                    prefs.edit().putString(PREF_BT_MAC, mac).apply()
                }
                if (uhf.setFrequencyMode(FREQUENCY_EUROPE)) {
                    postStatus("RFID connected ($name) · EU 865–868 MHz")
                } else {
                    postStatus("RFID connected ($name) — set EU band in gun settings if reads fail")
                }
                installGunTriggerHandler()
                applyConfigToGun()
            }

            ConnectionStatus.DISCONNECTED -> {
                connected = false
                inventoryRunning = false
                uhf.setKeyEventCallback(null)
                uhf.setInventoryCallback(null)
                if (!activeDisconnect) {
                    postStatus("RFID disconnected — reconnecting…")
                    scheduleReconnect()
                } else {
                    postStatus("RFID disconnected")
                }
            }

            ConnectionStatus.CONNECTING -> postStatus("Connecting to gun…")
            else -> Unit
        }
    }

    private fun installGunTriggerHandler() {
        uhf.setKeyEventCallback(object : KeyEventCallback {
            override fun onKeyDown(keycode: Int) {
                if (!connected || uhf.connectStatus != ConnectionStatus.CONNECTED) return
                // If the tablet was asleep, this pull only wakes the screen — don't also scan.
                if (onTriggerWake()) {
                    postStatus("Screen on — pull again to scan")
                    return
                }
                when (scanMode) {
                    SCAN_MODE_CONTINUOUS ->
                        // Continuous: one pull starts the repeat, next pull stops it.
                        if (inventoryRunning) stopInventory() else startInventory()
                    SCAN_MODE_HOLD ->
                        // Hold: read repeatedly while the trigger is held down.
                        startInventory()
                    SCAN_MODE_MULTI -> {
                        if (inventoryRunning) stopInventory()
                        performMultiReadBurst()
                    }
                    else -> {
                        // Single (default station mode): one pull = one tag.
                        if (inventoryRunning) stopInventory()
                        performSingleRead()
                    }
                }
            }

            override fun onKeyUp(keycode: Int) {
                if (scanMode == SCAN_MODE_HOLD) stopInventory()
            }
        })
    }

    private val continuousRunnable = object : Runnable {
        override fun run() {
            if (!inventoryRunning) return
            performSingleRead()
            mainHandler.postDelayed(this, pollMs.toLong())
        }
    }

    /**
     * "Continuous" scanning implemented as a fast repeat of the single-tag read. The SDK's
     * hardware inventory callback did not deliver tags on this R6, whereas single reads do — so
     * both modes share the one reliable primitive.
     */
    fun startInventory() {
        if (!connected || uhf.connectStatus != ConnectionStatus.CONNECTED) {
            postStatus("RFID not connected")
            return
        }
        if (inventoryRunning) return
        inventoryRunning = true
        mainHandler.post(continuousRunnable)
    }

    fun stopInventory() {
        if (!inventoryRunning) return
        inventoryRunning = false
        mainHandler.removeCallbacks(continuousRunnable)
    }

    fun performSingleRead() {
        if (!connected || uhf.connectStatus != ConnectionStatus.CONNECTED) return
        worker.execute {
            try {
                val info = uhf.inventorySingleTag()
                if (info != null) deliverTag(info)
            } catch (e: Exception) {
                Log.e(TAG, "single read failed", e)
            }
        }
    }

    /** One trigger pull: rapid single reads to collect every tag in range. */
    private fun performMultiReadBurst() {
        if (!connected || uhf.connectStatus != ConnectionStatus.CONNECTED) return
        worker.execute {
            val deadline = SystemClock.elapsedRealtime() + MULTI_BURST_MS
            var attempts = 0
            while (SystemClock.elapsedRealtime() < deadline && attempts < MULTI_BURST_MAX_READS) {
                try {
                    val info = uhf.inventorySingleTag()
                    if (info != null) deliverTag(info)
                } catch (e: Exception) {
                    Log.e(TAG, "multi read failed", e)
                }
                attempts++
                if (SystemClock.elapsedRealtime() < deadline) SystemClock.sleep(MULTI_READ_GAP_MS)
            }
        }
    }

    private fun deliverTag(info: UHFTAGInfo?) {
        val epc = info?.epc?.trim().orEmpty()
        if (epc.isEmpty()) return

        val now = System.currentTimeMillis()
        if (epc.equals(lastEpc, ignoreCase = true) && now - lastEpcAt < DEBOUNCE_MS) return
        lastEpc = epc
        lastEpcAt = now

        val upper = epc.uppercase()
        pendingScans.add(upper)
        if (pendingScans.size > 32) pendingScans.poll()
        mainHandler.post { onTagScanned(upper) }
    }

    /** Drain queued EPCs as a JSON array (called by the iframe poll). Clears as it reads. */
    fun drainPendingScans(): String {
        if (pendingScans.isEmpty()) return "[]"
        val sb = StringBuilder("[")
        var first = true
        while (true) {
            val e = pendingScans.poll() ?: break
            if (!first) sb.append(",")
            sb.append("\"").append(e.replace("\\", "\\\\").replace("\"", "\\\"")).append("\"")
            first = false
        }
        return sb.append("]").toString()
    }

    fun disconnect() {
        activeDisconnect = true
        stopInventory()
        worker.execute {
            try {
                uhf.disconnect()
                uhf.free()
            } catch (e: Exception) {
                Log.e(TAG, "disconnect failed", e)
            }
            initialized.set(false)
            connected = false
        }
        configWorker.shutdown()
    }

    /** Push the persisted settings to the connected gun (called after connect + after each change). */
    private fun applyConfigToGun() {
        configWorker.execute {
            try {
                if (uhf.connectStatus != ConnectionStatus.CONNECTED) return@execute
                uhf.setPower(powerDbm.coerceIn(POWER_MIN, POWER_MAX))
                uhf.setBeep(beepEnabled)
            } catch (e: Exception) {
                Log.e(TAG, "applyConfigToGun failed", e)
            }
        }
        // Device info (battery/firmware) is a separate, best-effort task — if the gun is slow to
        // answer it must not delay applying power/beep, and it runs off the read worker regardless.
        refreshDeviceInfo()
    }

    private fun refreshDeviceInfo() {
        configWorker.execute {
            try {
                if (uhf.connectStatus != ConnectionStatus.CONNECTED) return@execute
                battery = try { uhf.getBattery() } catch (e: Exception) { -1 }
                firmware = try { uhf.getSTM32Version() ?: "" } catch (e: Exception) { "" }
            } catch (e: Exception) {
                Log.e(TAG, "refreshDeviceInfo failed", e)
            }
        }
    }

    /** Reduce/raise read radius. Lower dBm = shorter range (badge-tap); higher = across the room. */
    fun setPowerLevel(power: Int) {
        powerDbm = power.coerceIn(POWER_MIN, POWER_MAX)
        prefs.edit().putInt(PREF_POWER, powerDbm).apply()
        configWorker.execute {
            try { if (connected) uhf.setPower(powerDbm) } catch (e: Exception) { Log.e(TAG, "setPower failed", e) }
        }
    }

    fun setScanMode(mode: String) {
        scanMode = when (mode) {
            SCAN_MODE_CONTINUOUS -> SCAN_MODE_CONTINUOUS
            SCAN_MODE_HOLD -> SCAN_MODE_HOLD
            SCAN_MODE_MULTI -> SCAN_MODE_MULTI
            else -> SCAN_MODE_SINGLE
        }
        prefs.edit().putString(PREF_SCAN_MODE, scanMode).apply()
        if ((scanMode == SCAN_MODE_SINGLE || scanMode == SCAN_MODE_MULTI) && inventoryRunning) stopInventory()
    }

    /** Continuous/hold repeat interval in ms. Lower = faster machine-gun repeat. */
    fun setPollMs(ms: Int) {
        pollMs = ms.coerceIn(POLL_MIN, POLL_MAX)
        prefs.edit().putInt(PREF_POLL_MS, pollMs).apply()
    }

    fun setBeepEnabled(enabled: Boolean) {
        beepEnabled = enabled
        prefs.edit().putBoolean(PREF_BEEP, enabled).apply()
        configWorker.execute {
            try { if (connected) uhf.setBeep(enabled) } catch (e: Exception) { Log.e(TAG, "setBeep failed", e) }
        }
    }

    /** Snapshot for the web setup view. Cached values only — safe to call synchronously. */
    fun currentConfigJson(): String {
        val fw = firmware.replace("\"", "").replace("\\", "")
        return "{" +
            "\"connected\":$connected," +
            "\"power\":$powerDbm," +
            "\"powerMin\":$POWER_MIN," +
            "\"powerMax\":$POWER_MAX," +
            "\"scanMode\":\"$scanMode\"," +
            "\"pollMs\":$pollMs," +
            "\"pollMin\":$POLL_MIN," +
            "\"pollMax\":$POLL_MAX," +
            "\"beep\":$beepEnabled," +
            "\"battery\":$battery," +
            "\"firmware\":\"$fw\"" +
            "}"
    }

    private fun postStatus(msg: String) {
        mainHandler.post { onStatus(msg) }
    }

    companion object {
        private const val TAG = "ShowrunnerRfid"
        private const val PREFS_NAME = "showrunner_station"
        private const val PREF_BT_MAC = "bt_mac"
        private const val PREF_POWER = "gun_power"
        private const val PREF_SCAN_MODE = "gun_scan_mode"
        private const val PREF_BEEP = "gun_beep"
        private const val PREF_POLL_MS = "gun_poll_ms"
        const val SCAN_MODE_SINGLE = "single"
        const val SCAN_MODE_MULTI = "multi"
        const val SCAN_MODE_CONTINUOUS = "continuous"
        const val SCAN_MODE_HOLD = "hold"
        private const val MULTI_BURST_MS = 700L
        private const val MULTI_BURST_MAX_READS = 20
        private const val MULTI_READ_GAP_MS = 40L
        private const val POWER_MIN = 5
        private const val POWER_MAX = 30
        // Default to full power so reads are guaranteed on first run; the operator dials the
        // range DOWN from the setup view. (Matches the known-working pre-settings behaviour.)
        private const val DEFAULT_POWER = 30
        private const val TARGET_BT_NAME = "Nordic_UART_CW"
        // Chainway UHF guns pair under varied names — match any of these tokens.
        private val GUN_NAME_HINTS = listOf(
            "Nordic_UART_CW", "Nordic", "UART", "Chainway", "R6", "RFID", "UHF", "CW",
        )
        private const val FREQUENCY_EUROPE = 0x04
        private const val SCAN_MS = 4000L
        private const val RECONNECT_MS = 5000L
        private const val DEBOUNCE_MS = 2000L
        private const val DEFAULT_POLL_MS = 500
        private const val POLL_MIN = 100
        private const val POLL_MAX = 2000
    }
}
