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
) {
    private val uhf = RFIDWithUHFBLE.getInstance()
    private val mainHandler = Handler(Looper.getMainLooper())
    private val worker: ExecutorService = Executors.newSingleThreadExecutor()
    private val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    @Volatile
    private var connected = false
    private var inventoryRunning = false
    private var activeDisconnect = false
    private var lastEpc = ""
    private var lastEpcAt = 0L
    private var lastBondedNames = ""
    private val initialized = AtomicBoolean(false)

    private val connectionCallback = ConnectionStatusCallback<Any> { status, device ->
        mainHandler.post { handleConnectionStatus(status, device as? BluetoothDevice) }
    }

    fun connect() {
        worker.execute {
            try {
                if (!initialized.getAndSet(true)) {
                    if (!uhf.init(context.applicationContext)) {
                        postStatus("RFID init failed")
                        initialized.set(false)
                        return@execute
                    }
                }

                val savedMac = prefs.getString(PREF_BT_MAC, null)?.trim().orEmpty()
                if (savedMac.isNotEmpty()) {
                    postStatus("Connecting to gun…")
                    mainHandler.post { uhf.connect(savedMac, connectionCallback) }
                    return@execute
                }

                // Prefer a gun already paired in Android Bluetooth settings — a BLE
                // advertisement scan often reports a null name and misses bonded devices.
                val bondedMac = findBondedGunMac()
                if (bondedMac != null) {
                    postStatus("Connecting to paired gun…")
                    mainHandler.post { uhf.connect(bondedMac, connectionCallback) }
                    return@execute
                }

                scanAndConnect()
            } catch (e: Exception) {
                Log.e(TAG, "connect failed", e)
                postStatus("RFID error: ${e.message ?: "unknown"}")
            }
        }
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
                when (keycode) {
                    1 -> if (inventoryRunning) stopInventory() else startInventory()
                    2, 3 -> performSingleRead()
                }
            }

            override fun onKeyUp(keycode: Int) {
                if (keycode == 4 && inventoryRunning) stopInventory()
            }
        })
    }

    fun startInventory() {
        if (!connected || uhf.connectStatus != ConnectionStatus.CONNECTED) {
            postStatus("RFID not connected")
            return
        }
        if (inventoryRunning) return

        uhf.setInventoryCallback(IUHFInventoryCallback { info -> deliverTag(info) })
        val parameter = InventoryParameter()
        if (uhf.startInventoryTag(parameter)) {
            inventoryRunning = true
            postStatus("Scanning tags…")
        } else {
            postStatus("Could not start inventory")
        }
    }

    fun stopInventory() {
        if (!inventoryRunning) return
        uhf.stopInventory()
        uhf.setInventoryCallback(null)
        inventoryRunning = false
        if (connected) postStatus("RFID ready")
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

    private fun deliverTag(info: UHFTAGInfo?) {
        val epc = info?.epc?.trim().orEmpty()
        if (epc.isEmpty()) return

        val now = System.currentTimeMillis()
        if (epc.equals(lastEpc, ignoreCase = true) && now - lastEpcAt < DEBOUNCE_MS) return
        lastEpc = epc
        lastEpcAt = now

        mainHandler.post { onTagScanned(epc.uppercase()) }
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
    }

    private fun scheduleReconnect() {
        if (activeDisconnect) return
        mainHandler.postDelayed({
            if (!connected && !activeDisconnect) connect()
        }, RECONNECT_MS)
    }

    private fun postStatus(msg: String) {
        mainHandler.post { onStatus(msg) }
    }

    companion object {
        private const val TAG = "ShowrunnerRfid"
        private const val PREFS_NAME = "showrunner_station"
        private const val PREF_BT_MAC = "bt_mac"
        private const val TARGET_BT_NAME = "Nordic_UART_CW"
        // Chainway UHF guns pair under varied names — match any of these tokens.
        private val GUN_NAME_HINTS = listOf(
            "Nordic_UART_CW", "Nordic", "UART", "Chainway", "R6", "RFID", "UHF", "CW",
        )
        private const val FREQUENCY_EUROPE = 0x04
        private const val SCAN_MS = 4000L
        private const val RECONNECT_MS = 5000L
        private const val DEBOUNCE_MS = 2000L
    }
}
