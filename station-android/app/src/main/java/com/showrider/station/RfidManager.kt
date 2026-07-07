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
import com.rscja.deviceapi.entity.UHFTAGInfo
import com.rscja.deviceapi.interfaces.ConnectionStatus
import com.rscja.deviceapi.interfaces.ConnectionStatusCallback
import com.rscja.deviceapi.interfaces.KeyEventCallback
import com.rscja.deviceapi.interfaces.ScanBTCallback
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicInteger

/**
 * Chainway R6 BLE RFID bridge (SDK: RFIDWithUHFBLE).
 * Auto-connects to bonded/known gun, health-checks the link, and recovers from sleep/zombie BLE.
 */
class RfidManager(
    private val context: Context,
    private val onTagScanned: (String) -> Unit,
    private val onStatus: (String) -> Unit,
    private val onTriggerWake: () -> Boolean = { false },
) {
    private val uhf = RFIDWithUHFBLE.getInstance()
    private val mainHandler = Handler(Looper.getMainLooper())
    private val readWorker: ExecutorService = Executors.newSingleThreadExecutor()
    private val reconnectExecutor: ExecutorService = Executors.newSingleThreadExecutor()
    private val configWorker: ExecutorService = Executors.newSingleThreadExecutor()
    private val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    @Volatile private var connected = false
    @Volatile private var linkState = LINK_DISCONNECTED
    private var inventoryRunning = false
    private var activeDisconnect = false
    private var lastEpc = ""
    private var lastEpcAt = 0L
    private var lastBondedNames = ""
    private val initialized = AtomicBoolean(false)
    private val readCancelled = AtomicBoolean(false)
    private val reconnectGeneration = AtomicInteger(0)
    private var healthFailStreak = 0
    private var macConnectFails = 0
    private var ladderStep = 0

    @Volatile private var powerDbm = prefs.getInt(PREF_POWER, DEFAULT_POWER)
    @Volatile private var scanMode = prefs.getString(PREF_SCAN_MODE, SCAN_MODE_SINGLE) ?: SCAN_MODE_SINGLE
    @Volatile private var beepEnabled = prefs.getBoolean(PREF_BEEP, true)
    @Volatile private var pollMs = prefs.getInt(PREF_POLL_MS, DEFAULT_POLL_MS)
    @Volatile private var battery = -1
    @Volatile private var firmware = ""

    private val pendingScans = java.util.concurrent.ConcurrentLinkedQueue<String>()

    private val connectionCallback = ConnectionStatusCallback<Any> { status, device ->
        mainHandler.post { handleConnectionStatus(status, device as? BluetoothDevice) }
    }

    private fun scheduleReconnect(delayMs: Long = RECONNECT_MS) {
        if (activeDisconnect) return
        mainHandler.postDelayed({
            if (!connected && !activeDisconnect) connectIfNeeded()
        }, delayMs)
    }

    private fun beginReconnectLadder(reason: String, fromStep: Int = 0) {
        if (activeDisconnect) return
        val gen = reconnectGeneration.incrementAndGet()
        readCancelled.set(true)
        stopInventory()
        reconnectExecutor.execute {
            if (gen != reconnectGeneration.get()) return@execute
            runReconnectLadder(gen, fromStep, reason)
        }
    }

    private fun runReconnectLadder(gen: Int, fromStep: Int, reason: String) {
        try {
            ladderStep = fromStep.coerceIn(0, 2)
            setLinkState(LINK_RECONNECTING)
            postStatus(
                when (ladderStep) {
                    0 -> "Reconnecting gun…"
                    1 -> "Waiting for gun to wake…"
                    else -> "Resetting gun driver…"
                },
            )
            softDisconnect()
            val waitMs = when (ladderStep) {
                0 -> RECONNECT_WAIT_SOFT_MS
                1 -> RECONNECT_WAIT_MEDIUM_MS
                else -> RECONNECT_WAIT_NUCLEAR_MS
            }
            Thread.sleep(waitMs)
            if (gen != reconnectGeneration.get() || activeDisconnect) return

            if (ladderStep >= 2) {
                nuclearReset()
            }

            val connectedNow = connectBlocking(gen, ladderStep)
            if (!connectedNow && gen == reconnectGeneration.get() && !activeDisconnect) {
                if (ladderStep < 2) {
                    runReconnectLadder(gen, ladderStep + 1, reason)
                } else {
                    macConnectFails = 0
                    prefs.edit().remove(PREF_BT_MAC).apply()
                    scanAndConnectBlocking(gen)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "reconnect ladder failed ($reason)", e)
            postStatus("RFID reconnect failed")
            scheduleReconnect(RECONNECT_MS * 2)
        }
    }

    private fun softDisconnect() {
        connected = false
        inventoryRunning = false
        try {
            mainHandler.post {
                uhf.setKeyEventCallback(null)
                uhf.setInventoryCallback(null)
            }
            if (uhf.connectStatus != ConnectionStatus.DISCONNECTED) {
                uhf.disconnect()
            }
        } catch (e: Exception) {
            Log.w(TAG, "softDisconnect", e)
        }
    }

    private fun nuclearReset() {
        try {
            softDisconnect()
            Thread.sleep(400)
            uhf.free()
            initialized.set(false)
            Thread.sleep(350)
        } catch (e: Exception) {
            Log.w(TAG, "nuclearReset", e)
        }
    }

    fun forceReconnect() {
        activeDisconnect = false
        macConnectFails = 0
        healthFailStreak = 0
        beginReconnectLadder("manual", 0)
    }

    private var watchdogStarted = false
    private val watchdogRunnable = Runnable {
        if (!activeDisconnect) {
            reconnectExecutor.execute {
                if (activeDisconnect) return@execute
                val sdk = sdkStatus()
                when {
                    sdk == ConnectionStatus.CONNECTED && connected && linkState == LINK_LIVE -> Unit
                    sdk == ConnectionStatus.CONNECTED && (!connected || linkState == LINK_ZOMBIE) -> {
                        connected = true
                        setLinkState(LINK_LIVE)
                        mainHandler.post {
                            installGunTriggerHandler()
                            applyConfigToGun()
                        }
                        postStatus("RFID link restored")
                    }
                    sdk != ConnectionStatus.CONNECTED && (connected || linkState != LINK_DISCONNECTED) -> {
                        markDisconnected("watchdog")
                        beginReconnectLadder("watchdog", 0)
                    }
                    sdk != ConnectionStatus.CONNECTED -> connectIfNeeded()
                }
            }
        }
        scheduleWatchdog()
    }

    private fun scheduleWatchdog() {
        mainHandler.removeCallbacks(watchdogRunnable)
        mainHandler.postDelayed(watchdogRunnable, WATCHDOG_MS)
    }

    fun startWatchdog() {
        if (watchdogStarted) return
        watchdogStarted = true
        scheduleWatchdog()
        scheduleHealthCheck()
    }

    private fun scheduleHealthCheck() {
        mainHandler.removeCallbacks(healthRunnable)
        mainHandler.postDelayed(healthRunnable, HEALTH_CHECK_MS)
    }

    private val healthRunnable = Runnable {
        if (!activeDisconnect) {
            configWorker.execute { runHealthCheck() }
        }
        scheduleHealthCheck()
    }

    private fun runHealthCheck() {
        if (activeDisconnect) return
        val sdk = sdkStatus()
        if (sdk != ConnectionStatus.CONNECTED) {
            if (connected || linkState == LINK_LIVE || linkState == LINK_ZOMBIE) {
                markDisconnected("health: sdk down")
                beginReconnectLadder("health", 0)
            }
            return
        }
        if (!connected) return
        try {
            val bat = uhf.getBattery()
            if (bat < 0) throw IllegalStateException("battery ping failed")
            healthFailStreak = 0
            if (linkState == LINK_ZOMBIE) {
                setLinkState(LINK_LIVE)
                postStatus("RFID link OK")
            }
            battery = bat
        } catch (e: Exception) {
            healthFailStreak++
            Log.w(TAG, "health check fail #$healthFailStreak", e)
            if (healthFailStreak >= 2) {
                setLinkState(LINK_ZOMBIE)
                postStatus("RFID link stale — reconnecting…")
                beginReconnectLadder("zombie", 1)
            }
        }
    }

    fun onAppWake() {
        healthFailStreak = 0
        connectIfNeeded()
        configWorker.execute { runHealthCheck() }
    }

    fun connectIfNeeded() {
        if (activeDisconnect) return
        reconnectExecutor.execute {
            if (activeDisconnect) return@execute
            val sdk = sdkStatus()
            if (sdk == ConnectionStatus.CONNECTED && connected && linkState == LINK_LIVE) return@execute
            if (sdk == ConnectionStatus.CONNECTED && !connected) {
                connected = true
                setLinkState(LINK_LIVE)
                mainHandler.post {
                    installGunTriggerHandler()
                    applyConfigToGun()
                }
                return@execute
            }
            if (sdk != ConnectionStatus.CONNECTED) {
                connected = false
                connectBlocking(reconnectGeneration.get(), 0)
            }
        }
    }

    fun connect() {
        reconnectExecutor.execute { connectBlocking(reconnectGeneration.get(), 0) }
    }

    private fun connectBlocking(gen: Int, step: Int): Boolean {
        try {
            if (!initialized.getAndSet(true)) {
                if (!uhf.init(context.applicationContext)) {
                    postStatus("RFID init failed")
                    initialized.set(false)
                    return false
                }
            }
            if (gen != reconnectGeneration.get() || activeDisconnect) return false

            setLinkState(LINK_CONNECTING)
            val savedMac = prefs.getString(PREF_BT_MAC, null)?.trim().orEmpty()
            if (savedMac.isNotEmpty()) {
                postStatus("Connecting to gun…")
                connectOnMainThread(savedMac)
                SystemClock.sleep(CONNECT_WAIT_MS)
                if (sdkStatus() == ConnectionStatus.CONNECTED) {
                    macConnectFails = 0
                    return true
                }
                macConnectFails++
                if (macConnectFails >= MAX_MAC_RETRIES && step >= 1) {
                    prefs.edit().remove(PREF_BT_MAC).apply()
                }
            }

            val bondedMac = findBondedGunMac()
            if (!bondedMac.isNullOrBlank()) {
                postStatus("Connecting to paired gun…")
                connectOnMainThread(bondedMac)
                SystemClock.sleep(CONNECT_WAIT_MS)
                if (sdkStatus() == ConnectionStatus.CONNECTED) return true
            }

            scanAndConnectBlocking(gen)
            return sdkStatus() == ConnectionStatus.CONNECTED
        } catch (e: Exception) {
            Log.e(TAG, "connectBlocking failed", e)
            postStatus("RFID error: ${e.message ?: "unknown"}")
            return false
        }
    }

    private fun connectOnMainThread(mac: String) {
        val latch = java.util.concurrent.CountDownLatch(1)
        mainHandler.post {
            try {
                uhf.connect(mac, connectionCallback)
            } catch (e: Exception) {
                Log.e(TAG, "connect($mac)", e)
            } finally {
                latch.countDown()
            }
        }
        latch.await(CONNECT_WAIT_MS + 500, java.util.concurrent.TimeUnit.MILLISECONDS)
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
        val named = bonded.firstOrNull { isGunName(it.name) }
        if (named != null) return named.address
        if (bonded.size == 1) return bonded.first().address
        lastBondedNames = bonded.joinToString(", ") { (it.name ?: "?") + " (" + it.address + ")" }
        return null
    }

    private fun isGunName(name: String?): Boolean {
        if (name.isNullOrBlank()) return false
        return GUN_NAME_HINTS.any { name.contains(it, ignoreCase = true) }
    }

    @SuppressLint("MissingPermission")
    private fun scanAndConnectBlocking(gen: Int) {
        postStatus("Scanning for gun…")
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
        if (gen != reconnectGeneration.get()) return
        val mac = bestMac
        if (mac.isNullOrBlank()) {
            if (lastBondedNames.isNotBlank()) {
                postStatus("Gun not found. Paired: $lastBondedNames")
            } else {
                postStatus("Gun not found — power on R6 and pair in Bluetooth settings")
            }
            scheduleReconnect()
            return
        }
        postStatus("Connecting to gun…")
        connectOnMainThread(mac)
    }

    @SuppressLint("MissingPermission")
    private fun handleConnectionStatus(status: ConnectionStatus, device: BluetoothDevice?) {
        when (status) {
            ConnectionStatus.CONNECTED -> {
                connected = true
                activeDisconnect = false
                readCancelled.set(false)
                healthFailStreak = 0
                macConnectFails = 0
                ladderStep = 0
                setLinkState(LINK_LIVE)
                val name = device?.name ?: TARGET_BT_NAME
                val mac = device?.address
                if (!mac.isNullOrBlank()) {
                    prefs.edit().putString(PREF_BT_MAC, mac).apply()
                }
                if (uhf.setFrequencyMode(FREQUENCY_EUROPE)) {
                    postStatus("RFID connected ($name)")
                } else {
                    postStatus("RFID connected ($name) — check EU band if reads fail")
                }
                installGunTriggerHandler()
                applyConfigToGun()
            }

            ConnectionStatus.DISCONNECTED -> {
                markDisconnected("callback")
                uhf.setKeyEventCallback(null)
                uhf.setInventoryCallback(null)
                if (!activeDisconnect) {
                    postStatus("RFID disconnected — reconnecting…")
                    scheduleReconnect()
                } else {
                    postStatus("RFID disconnected")
                }
            }

            ConnectionStatus.CONNECTING -> {
                setLinkState(LINK_CONNECTING)
                postStatus("Connecting to gun…")
            }

            else -> Unit
        }
    }

    private fun markDisconnected(reason: String) {
        Log.d(TAG, "markDisconnected: $reason")
        connected = false
        inventoryRunning = false
        setLinkState(LINK_DISCONNECTED)
    }

    private fun setLinkState(state: String) {
        linkState = state
    }

    private fun sdkStatus(): ConnectionStatus = try {
        uhf.connectStatus
    } catch (_: Exception) {
        ConnectionStatus.DISCONNECTED
    }

    private fun installGunTriggerHandler() {
        uhf.setKeyEventCallback(object : KeyEventCallback {
            override fun onKeyDown(keycode: Int) {
                if (!connected || sdkStatus() != ConnectionStatus.CONNECTED) return
                if (onTriggerWake()) {
                    postStatus("Screen on — pull again to scan")
                    return
                }
                when (scanMode) {
                    SCAN_MODE_CONTINUOUS ->
                        if (inventoryRunning) stopInventory() else startInventory()
                    SCAN_MODE_HOLD -> startInventory()
                    SCAN_MODE_MULTI -> {
                        if (inventoryRunning) stopInventory()
                        performMultiReadBurst()
                    }
                    else -> {
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

    fun startInventory() {
        if (!connected || sdkStatus() != ConnectionStatus.CONNECTED) {
            postStatus("RFID not connected")
            connectIfNeeded()
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
        if (!connected || readCancelled.get() || sdkStatus() != ConnectionStatus.CONNECTED) {
            if (connected && sdkStatus() != ConnectionStatus.CONNECTED) {
                beginReconnectLadder("read-blocked", 0)
            }
            return
        }
        readWorker.execute {
            if (readCancelled.get()) return@execute
            try {
                val info = uhf.inventorySingleTag()
                if (info != null) deliverTag(info)
            } catch (e: Exception) {
                Log.e(TAG, "single read failed", e)
                healthFailStreak++
                if (healthFailStreak >= 2) {
                    beginReconnectLadder("read-fail", 1)
                }
            }
        }
    }

    private fun performMultiReadBurst() {
        if (!connected || readCancelled.get() || sdkStatus() != ConnectionStatus.CONNECTED) return
        readWorker.execute {
            val deadline = SystemClock.elapsedRealtime() + MULTI_BURST_MS
            var attempts = 0
            while (
                SystemClock.elapsedRealtime() < deadline &&
                attempts < MULTI_BURST_MAX_READS &&
                !readCancelled.get()
            ) {
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
        while (pendingScans.size > 32) pendingScans.poll()
        mainHandler.post { onTagScanned(upper) }
    }

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
        reconnectGeneration.incrementAndGet()
        readCancelled.set(true)
        stopInventory()
        reconnectExecutor.execute {
            try {
                softDisconnect()
                uhf.free()
            } catch (e: Exception) {
                Log.e(TAG, "disconnect failed", e)
            }
            initialized.set(false)
            connected = false
            setLinkState(LINK_DISCONNECTED)
        }
        readWorker.shutdown()
        reconnectExecutor.shutdown()
        configWorker.shutdown()
    }

    private fun applyConfigToGun() {
        configWorker.execute {
            try {
                if (sdkStatus() != ConnectionStatus.CONNECTED) return@execute
                uhf.setPower(powerDbm.coerceIn(POWER_MIN, POWER_MAX))
                uhf.setBeep(beepEnabled)
            } catch (e: Exception) {
                Log.e(TAG, "applyConfigToGun failed", e)
            }
        }
        refreshDeviceInfo()
    }

    private fun refreshDeviceInfo() {
        configWorker.execute {
            try {
                if (sdkStatus() != ConnectionStatus.CONNECTED) return@execute
                battery = try { uhf.getBattery() } catch (e: Exception) { -1 }
                firmware = try { uhf.getSTM32Version() ?: "" } catch (e: Exception) { "" }
            } catch (e: Exception) {
                Log.e(TAG, "refreshDeviceInfo failed", e)
            }
        }
    }

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

    fun currentConfigJson(): String {
        val fw = firmware.replace("\"", "").replace("\\", "")
        val live = linkState == LINK_LIVE && connected
        return "{" +
            "\"connected\":$live," +
            "\"linkState\":\"$linkState\"," +
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
        const val LINK_DISCONNECTED = "disconnected"
        const val LINK_CONNECTING = "connecting"
        const val LINK_LIVE = "live"
        const val LINK_ZOMBIE = "zombie"
        const val LINK_RECONNECTING = "reconnecting"
        private const val MULTI_BURST_MS = 700L
        private const val MULTI_BURST_MAX_READS = 20
        private const val MULTI_READ_GAP_MS = 40L
        private const val POWER_MIN = 5
        private const val POWER_MAX = 30
        private const val DEFAULT_POWER = 30
        private const val TARGET_BT_NAME = "Nordic_UART_CW"
        private val GUN_NAME_HINTS = listOf(
            "Nordic_UART_CW", "Nordic", "UART", "Chainway", "R6", "RFID", "UHF", "CW",
        )
        private const val FREQUENCY_EUROPE = 0x04
        private const val SCAN_MS = 5000L
        private const val RECONNECT_MS = 3000L
        private const val WATCHDOG_MS = 15000L
        private const val HEALTH_CHECK_MS = 12000L
        private const val RECONNECT_WAIT_SOFT_MS = 350L
        private const val RECONNECT_WAIT_MEDIUM_MS = 2000L
        private const val RECONNECT_WAIT_NUCLEAR_MS = 800L
        private const val CONNECT_WAIT_MS = 4500L
        private const val MAX_MAC_RETRIES = 2
        private const val DEBOUNCE_MS = 2000L
        private const val DEFAULT_POLL_MS = 500
        private const val POLL_MIN = 100
        private const val POLL_MAX = 2000
    }
}
