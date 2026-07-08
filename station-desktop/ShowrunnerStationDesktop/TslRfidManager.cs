using System.Collections.Concurrent;
using System.IO.Ports;
using System.Text;
using System.Text.Json;
using TechnologySolutions.Rfid.AsciiProtocol;
using TechnologySolutions.Rfid.AsciiProtocol.Commands;
using TechnologySolutions.Rfid.AsciiProtocol.Extensions;

namespace Showrunner.Station.Desktop;

/// <summary>
/// TSL 1128 over Bluetooth virtual COM — connect, trigger-driven single inventory, scan queue for the web bridge.
/// </summary>
public sealed class TslRfidManager : IDisposable
{
    public const string ScanModeSingle = "single";
    public const string ScanModeContinuous = "continuous";

    private const int PowerMin = 5;
    private const int PowerMax = 30;
    private const int PollMin = 100;
    private const int PollMax = 2000;

    private readonly AsciiCommander _commander = new();
    private readonly SwitchAsynchronousResponder _switchResponder = new();
    private readonly InventoryCommand _inventory = new();
    private readonly ConcurrentQueue<PendingScan> _pendingScans = new();
    private readonly object _commandLock = new();

    private string _portName = "";
    private string _linkState = "disconnected";
    private bool _connected;
    private int _powerDbm = 30;
    private string _scanMode = ScanModeSingle;
    private int _pollMs = 500;
    private bool _beepEnabled = true;
    private string _firmware = "";
    private bool _continuousRunning;
    private CancellationTokenSource? _continuousCts;

    private string _manualPort = "";
    private System.Threading.Timer? _watchdog;
    private volatile bool _connecting;
    private volatile bool _userSleep;
    private bool _disposed;
    private string _lastDetectLog = "";

    private const int WatchdogMs = 2500;

    public event Action<string>? StatusChanged;

    public TslRfidManager()
    {
        _commander.AddResponder(_switchResponder);
        _switchResponder.SwitchStateChanged += OnSwitchStateChanged;
        _inventory.TransponderReceived += OnInventoryTransponder;
        _inventory.FastIdentifier = TriState.Yes;
        _inventory.TagFocus = TriState.Yes;
    }

    public string PortName
    {
        get => _portName;
        set => _portName = value?.Trim() ?? "";
    }

    public void Start()
    {
        var prefs = DesktopPrefs.Load();
        // A COM port in prefs is an OVERRIDE only; blank means auto-detect the TSL gun.
        _manualPort = (prefs.ComPort ?? "").Trim();
        _portName = _manualPort;
        _powerDbm = prefs.PowerDbm is >= PowerMin and <= PowerMax ? prefs.PowerDbm : 30;
        _beepEnabled = prefs.Beep;
        _scanMode = prefs.ScanMode == ScanModeContinuous ? ScanModeContinuous : ScanModeSingle;
        _pollMs = prefs.PollMs is >= PollMin and <= PollMax ? prefs.PollMs : 500;

        PostStatus(string.IsNullOrWhiteSpace(_manualPort)
            ? "Looking for TSL gun…"
            : $"Looking for TSL gun on {_manualPort}…");

        // Watchdog owns connecting: it auto-detects the gun and reconnects when it wakes.
        _watchdog = new System.Threading.Timer(_ => WatchdogTick(), null, 0, WatchdogMs);
    }

    /// <summary>
    /// Runs on the watchdog thread. Keeps the link alive: detect the TSL port, connect when the
    /// gun is present/awake, and re-acquire it after sleep/BT drop — mirrors the Explorer grabbing
    /// the port the moment the reader comes up.
    /// </summary>
    private void WatchdogTick()
    {
        if (_disposed || _connecting) return;
        // User put the gun to sleep on purpose — don't re-open the port and wake it back up.
        if (_userSleep) return;

        bool linkAlive;
        lock (_commandLock)
            linkAlive = _commander.IsConnected;

        if (linkAlive)
        {
            _connected = true;
            return;
        }

        // Link down — find the gun's port (manual override wins) and try to grab it.
        var target = !string.IsNullOrWhiteSpace(_manualPort) ? _manualPort : ResolveGunPort();
        if (string.IsNullOrWhiteSpace(target))
        {
            if (_linkState != "waiting")
            {
                _linkState = "waiting";
                PostStatus("Waiting for TSL gun — pair it and press the trigger to wake it");
            }
            return;
        }

        _portName = target;
        TryConnectFromWatchdog();
    }

    private void TryConnectFromWatchdog()
    {
        _connecting = true;
        try
        {
            Connect();
        }
        finally
        {
            _connecting = false;
        }
    }

    /// <summary>Detect the TSL 1128 COM port by its PID_1128 signature; logs the port once.</summary>
    private string? ResolveGunPort()
    {
        var port = GunPortDetector.DetectPort();
        if (!string.IsNullOrWhiteSpace(port) && port != _lastDetectLog)
        {
            _lastDetectLog = port!;
            PostStatus($"Found TSL gun on {port}");
        }
        return port;
    }

    public void Connect()
    {
        if (string.IsNullOrWhiteSpace(_portName))
        {
            PostStatus("No COM port configured");
            return;
        }

        try
        {
            lock (_commandLock)
            {
                if (_commander.IsConnected)
                    _commander.Disconnect();

                _linkState = "connecting";
                PostStatus($"Connecting {_portName}…");
                var serial = new SerialPortWrapper(_portName);
                _commander.Connect(serial);
                _connected = _commander.IsConnected;
                if (!_connected)
                {
                    _linkState = "disconnected";
                    PostStatus("RFID connect failed");
                    return;
                }

                SetupResponders();
                ReadFirmware();
                EnableSwitchReporting();
                _linkState = "live";
                PostStatus("Gun connected");
                DesktopPrefs.Save(new DesktopPrefsData
                {
                    ComPort = _portName,
                    PowerDbm = _powerDbm,
                    Beep = _beepEnabled,
                    ScanMode = _scanMode,
                    PollMs = _pollMs,
                });
            }
        }
        catch (Exception ex)
        {
            _connected = false;
            _linkState = "disconnected";
            PostStatus("Connect error: " + ex.Message);
        }
    }

    public void ForceReconnect()
    {
        // A manual reconnect clears a user-requested sleep so the watchdog can grab the gun again.
        _userSleep = false;
        lock (_commandLock)
        {
            try
            {
                StopContinuous();
                if (_commander.IsConnected)
                    _commander.Disconnect();
            }
            catch
            {
                // ignore
            }
            _connected = false;
            _linkState = "disconnected";
        }
        // Let the watchdog re-detect and re-acquire (handles a changed COM port after re-pair).
        _lastDetectLog = "";
        WatchdogTick();
    }

    /// <summary>
    /// Sends the gun to sleep (ASCII .sl) then drops the link — like a power button. The watchdog
    /// stays suppressed so we don't immediately wake it; ForceReconnect() (or an app restart) resumes.
    /// </summary>
    public void SleepAndDisconnect()
    {
        _userSleep = true;
        lock (_commandLock)
        {
            try
            {
                StopContinuous();
                if (_commander.IsConnected)
                {
                    // .sl tells the reader to sleep after it acknowledges, then it disconnects itself.
                    var sleep = new SleepCommand { AutoReconnect = TriState.No };
                    _commander.ExecuteCommand(sleep, sleep.Responder);
                }
            }
            catch
            {
                // best effort — still drop our side below
            }

            try
            {
                if (_commander.IsConnected)
                    _commander.Disconnect();
            }
            catch
            {
                // ignore
            }
            _connected = false;
            _linkState = "asleep";
        }
        PostStatus("Gun asleep — pull the trigger to wake it, then tap Reconnect");
    }

    public string DrainPendingScans()
    {
        if (_pendingScans.IsEmpty)
            return "[]";
        var list = new List<object>();
        while (_pendingScans.TryDequeue(out var scan))
            list.Add(new { epc = scan.Epc, tid = scan.Tid });
        return JsonSerializer.Serialize(list);
    }

    public string CurrentConfigJson()
    {
        var live = _connected && _linkState == "live";
        var fw = _firmware.Replace("\\", "").Replace("\"", "");
        return JsonSerializer.Serialize(new
        {
            connected = live,
            linkState = _linkState,
            power = _powerDbm,
            powerMin = PowerMin,
            powerMax = PowerMax,
            scanMode = _scanMode,
            pollMs = _pollMs,
            pollMin = PollMin,
            pollMax = PollMax,
            beep = _beepEnabled,
            battery = -1,
            firmware = fw,
            comPort = _portName,
        });
    }

    public void SetPowerLevel(int power)
    {
        _powerDbm = Math.Clamp(power, PowerMin, PowerMax);
        DesktopPrefs.SavePartial(p => p.PowerDbm = _powerDbm);
    }

    public void SetScanMode(string? mode)
    {
        _scanMode = ScanModeContinuous.Equals(mode, StringComparison.OrdinalIgnoreCase)
            ? ScanModeContinuous
            : ScanModeSingle;
        DesktopPrefs.SavePartial(p => p.ScanMode = _scanMode);
        if (_scanMode == ScanModeSingle)
            StopContinuous();
    }

    public void SetBeepEnabled(bool enabled)
    {
        _beepEnabled = enabled;
        DesktopPrefs.SavePartial(p => p.Beep = _beepEnabled);
        ApplyBeep();
    }

    public void SetPollMs(int ms)
    {
        _pollMs = Math.Clamp(ms, PollMin, PollMax);
        DesktopPrefs.SavePartial(p => p.PollMs = _pollMs);
    }

    public void Dispose()
    {
        _disposed = true;
        _watchdog?.Dispose();
        _watchdog = null;
        StopContinuous();
        _switchResponder.SwitchStateChanged -= OnSwitchStateChanged;
        _inventory.TransponderReceived -= OnInventoryTransponder;
        try
        {
            if (_commander.IsConnected)
                _commander.Disconnect();
        }
        catch
        {
            // ignore
        }
        _commander.Dispose();
    }

    private void SetupResponders()
    {
        _commander.ClearResponders();
        _commander.AddResponder(_switchResponder);
        _commander.AddResponder(_inventory.Responder);
        _commander.AddSynchronousResponder();
    }

    private void ReadFirmware()
    {
        try
        {
            var version = new VersionInformationCommand();
            _commander.ExecuteCommand(version, version.Responder);
            if (!string.IsNullOrWhiteSpace(version.FirmwareVersion))
                _firmware = version.FirmwareVersion;
            else if (!string.IsNullOrWhiteSpace(version.SerialNumber))
                _firmware = version.SerialNumber;
        }
        catch
        {
            _firmware = "";
        }
    }

    private void EnableSwitchReporting()
    {
        try
        {
            var sw = new SwitchActionCommand
            {
                AsynchronousReportingEnabled = TriState.Yes,
                SinglePressAction = SwitchAction.Off,
                DoublePressAction = SwitchAction.Off,
            };
            _commander.ExecuteCommand(sw, sw.Responder);
            ApplyBeep();
        }
        catch (Exception ex)
        {
            PostStatus("Switch setup: " + ex.Message);
        }
    }

    private void ApplyBeep()
    {
        try
        {
            var alert = new AlertCommand { BuzzerEnabled = _beepEnabled ? TriState.Yes : TriState.No };
            _commander.ExecuteCommand(alert, alert.Responder);
        }
        catch
        {
            // optional on some firmware
        }
    }

    private void OnSwitchStateChanged(object? sender, SwitchStateEventArgs e)
    {
        if (!_connected) return;
        if (e.State == SwitchState.Single)
            OnTriggerPressed();
        else if (e.State is SwitchState.Off)
            StopContinuous();
    }

    private void OnTriggerPressed()
    {
        if (_scanMode == ScanModeContinuous)
        {
            if (_continuousRunning)
                StopContinuous();
            else
                StartContinuous();
            return;
        }
        PerformSingleRead();
    }

    private void PerformSingleRead()
    {
        if (!_connected) return;
        Task.Run(() =>
        {
            lock (_commandLock)
            {
                try
                {
                    _inventory.OutputPower = _powerDbm;
                    _inventory.QuerySession = QuerySession.S0;
                    _inventory.QueryTarget = QueryTarget.TargetA;
                    _inventory.TakeNoAction = false;
                    _commander.ExecuteCommand(_inventory, _inventory.Responder);
                }
                catch (Exception ex)
                {
                    PostStatus("Read failed: " + ex.Message);
                }
            }
        });
    }

    private void OnInventoryTransponder(object? sender, TransponderDataEventArgs e)
    {
        var epc = NormalizeHex(e.Transponder.Epc);
        if (string.IsNullOrEmpty(epc)) return;
        var tid = NormalizeHex(e.Transponder.TransponderIdentifier);
        EnqueueScan(epc, tid);
        PostStatus("Read: " + epc + (string.IsNullOrEmpty(tid) ? "" : " tid:" + tid));
    }

    private void EnqueueScan(string epc, string tid)
    {
        _pendingScans.Enqueue(new PendingScan(epc, tid));
        while (_pendingScans.Count > 32)
            _pendingScans.TryDequeue(out _);
    }

    private void StartContinuous()
    {
        StopContinuous();
        _continuousRunning = true;
        _continuousCts = new CancellationTokenSource();
        var token = _continuousCts.Token;
        Task.Run(async () =>
        {
            PostStatus("Scanning tags…");
            while (!token.IsCancellationRequested && _continuousRunning)
            {
                PerformSingleRead();
                try
                {
                    await Task.Delay(_pollMs, token);
                }
                catch (TaskCanceledException)
                {
                    break;
                }
            }
        }, token);
    }

    private void StopContinuous()
    {
        _continuousRunning = false;
        _continuousCts?.Cancel();
        _continuousCts = null;
        try
        {
            lock (_commandLock)
            {
                _commander.ExecuteCommand(new AbortCommand(), null);
            }
        }
        catch
        {
            // ignore
        }
    }

    private static string NormalizeHex(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return "";
        var sb = new StringBuilder();
        foreach (var c in raw.Trim())
        {
            if (Uri.IsHexDigit(c))
                sb.Append(char.ToUpperInvariant(c));
        }
        return sb.ToString();
    }

    private string _lastStatus = "";

    private void PostStatus(string msg)
    {
        if (string.IsNullOrWhiteSpace(msg)) return;
        // Watchdog retries every few seconds — don't spam identical lines (except live reads).
        if (msg == _lastStatus && !msg.StartsWith("Read:", StringComparison.Ordinal)) return;
        _lastStatus = msg;
        StatusChanged?.Invoke(msg);
    }

    private sealed record PendingScan(string Epc, string Tid);
}
