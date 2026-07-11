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
    public const string ScanModeMulti = "multi";
    public const string ScanModeContinuous = "continuous";

    // TSL SDK: AntennaParameters.OutputPower valid range is 10–29 dBm.
    private const int PowerMin = 10;
    private const int PowerMax = 29;
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
    private int _powerDbm = 29;
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
    private string _lastGunDeviceId = "";
    private string _lastDetectLog = "";
    private long _lastTriggerMs;
    private string _lastDeliverNorm = "";
    private long _lastDeliverMs;
    private volatile bool _suppressTransponderDelivery;
    private volatile bool _appDrivenRead;

    private const int WatchdogMs = 2500;
    private const int TriggerDebounceMs = 1200;
    private const int ScanDedupeMs = 1200;
    private const int MultiBurstMs = 700;
    private const int MultiBurstMaxReads = 20;
    private const int MultiReadGapMs = 40;

    public event Action<string>? StatusChanged;
    public event Action<string, string>? ScanReceived;

    public TslRfidManager()
    {
        _switchResponder.SwitchStateChanged += OnSwitchStateChanged;
        _inventory.FastIdentifier = TriState.Yes;
        _inventory.TagFocus = TriState.Yes;
        _inventory.TransponderReceived += OnInventoryTransponder;
    }

    public string PortName
    {
        get => _portName;
        set => _portName = value?.Trim() ?? "";
    }

    public void Start()
    {
        _userSleep = false;
        var prefs = DesktopPrefs.Load();
        // A COM port in prefs is an OVERRIDE only; blank means auto-detect the TSL gun.
        _manualPort = (prefs.ComPort ?? "").Trim();
        _lastGunDeviceId = (prefs.LastGunDeviceId ?? "").Trim();
        _portName = _manualPort;
        _powerDbm = prefs.PowerDbm is >= PowerMin and <= PowerMax ? prefs.PowerDbm : 29;
        _beepEnabled = prefs.Beep;
        _scanMode = prefs.ScanMode switch
        {
            ScanModeContinuous => ScanModeContinuous,
            ScanModeMulti => ScanModeMulti,
            _ => ScanModeSingle,
        };
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

        // Link down — manual override wins; else try every outgoing BT COM candidate.
        TryConnectFromWatchdog();
    }

    private void TryConnectFromWatchdog()
    {
        if (_disposed || _userSleep) return;
        _connecting = true;
        try
        {
            if (!string.IsNullOrWhiteSpace(_manualPort))
            {
                _portName = _manualPort;
                ConnectToPort(new GunPortDetector.GunPort(_manualPort, "manual override", ""));
                return;
            }

            var candidates = GunPortDetector.Detect(_lastGunDeviceId);
            if (candidates.Count == 0)
            {
                if (_linkState != "waiting")
                {
                    _linkState = "waiting";
                    PostStatus("Waiting for TSL gun — pair it and press the trigger to wake it");
                }
                return;
            }

            var summary = string.Join(", ", candidates.Select(c => c.ComPort));
            if (summary != _lastDetectLog)
            {
                _lastDetectLog = summary;
                PostStatus("Found TSL port(s): " + summary);
            }

            foreach (var candidate in candidates)
            {
                if (ConnectToPort(candidate))
                    return;
                SafeDisconnect();
            }

            _linkState = "disconnected";
            PostStatus("RFID connect failed on " + candidates.Count + " port(s) — pull trigger to wake gun");
        }
        finally
        {
            _connecting = false;
        }
    }

    public void Connect()
    {
        if (string.IsNullOrWhiteSpace(_portName))
        {
            PostStatus("No COM port configured");
            return;
        }
        ConnectToPort(new GunPortDetector.GunPort(_portName, "", ""));
    }

    /// <summary>Try one COM port; must answer a TSL version probe before we accept it.</summary>
    private bool ConnectToPort(GunPortDetector.GunPort candidate)
    {
        var port = candidate.ComPort;
        if (string.IsNullOrWhiteSpace(port)) return false;

        try
        {
            lock (_commandLock)
            {
                SetupResponders();

                if (_commander.IsConnected)
                    _commander.Disconnect();

                _linkState = "connecting";
                var label = string.IsNullOrWhiteSpace(candidate.FriendlyName)
                    ? port
                    : port + " — " + candidate.FriendlyName;
                PostStatus("Connecting " + label + "…");

                var serial = new SerialPortWrapper(port);
                _commander.Connect(serial);
                _connected = _commander.IsConnected;
                if (!_connected)
                {
                    _linkState = "disconnected";
                    PostStatus("No serial link on " + port);
                    return false;
                }

                ReadFirmware();
                if (string.IsNullOrWhiteSpace(_firmware))
                {
                    _linkState = "disconnected";
                    PostStatus(port + " is not a TSL reader — trying next port…");
                    try { _commander.Disconnect(); } catch { /* ignore */ }
                    _connected = false;
                    return false;
                }

                ConfigureChainInventory();
                SeedInventoryParameters();
                EnableSwitchReporting();
                _linkState = "live";
                _portName = port;
                PostStatus("Gun connected on " + port + " (" + _firmware + ")");
                DesktopPrefs.SavePartial(p =>
                {
                    p.ComPort = _manualPort;
                    if (!string.IsNullOrWhiteSpace(candidate.DeviceId))
                        p.LastGunDeviceId = candidate.DeviceId;
                    p.PowerDbm = _powerDbm;
                    p.Beep = _beepEnabled;
                    p.ScanMode = _scanMode;
                    p.PollMs = _pollMs;
                });
                if (!string.IsNullOrWhiteSpace(candidate.DeviceId))
                    _lastGunDeviceId = candidate.DeviceId;
                return true;
            }
        }
        catch (Exception ex)
        {
            _connected = false;
            _linkState = "disconnected";
            PostStatus("Connect error on " + port + ": " + ex.Message);
            SafeDisconnect();
            return false;
        }
    }

    private void SafeDisconnect()
    {
        try
        {
            lock (_commandLock)
            {
                if (_commander.IsConnected)
                    _commander.Disconnect();
            }
        }
        catch
        {
            // ignore
        }
    }

    public void ForceReconnect()
    {
        _userSleep = false;
        lock (_commandLock)
        {
            try
            {
                StopContinuous();
                AbortIfConnected();
                if (_commander.IsConnected)
                    _commander.Disconnect();
            }
            catch
            {
                // ignore
            }
            _connected = false;
            _linkState = "connecting";
        }
        _lastDetectLog = "";
        PostStatus("Reconnecting…");
        // Run outside any in-flight watchdog connect (_connecting) — do not call WatchdogTick inline.
        Task.Run(async () =>
        {
            await Task.Delay(300);
            if (_disposed) return;
            TryConnectFromWatchdog();
        });
    }

    /// <summary>
    /// SDK SleepCommand (.sl): reader sleeps once it responds, then disconnects from the terminal.
    /// Watchdog stays suppressed until ForceReconnect() so we do not immediately wake the gun.
    /// </summary>
    public void SleepAndDisconnect()
    {
        _userSleep = true;
        lock (_commandLock)
        {
            try
            {
                StopContinuous();
                AbortIfConnected();
                if (_commander.IsConnected)
                {
                    var sleep = new SleepCommand();
                    _commander.ExecuteCommand(sleep, sleep.Responder);
                }
            }
            catch (Exception ex)
            {
                PostStatus("Sleep failed: " + ex.Message);
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

    private void AbortIfConnected()
    {
        if (!_commander.IsConnected) return;
        try
        {
            _commander.ExecuteCommand(new AbortCommand(), null);
        }
        catch
        {
            // ignore
        }
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
        lock (_commandLock)
        {
            if (!_commander.IsConnected) return;
            ConfigureChainInventory();
        }
        ScanDiagnostics.Log("GUN", "Power → " + _powerDbm + " dBm");
        PostStatus("Sensitivity " + _powerDbm + " dBm");
    }

    public void SetScanMode(string? mode)
    {
        var next = NormalizeScanMode(mode);
        if (next == _scanMode) return;
        _scanMode = next;
        DesktopPrefs.SavePartial(p => p.ScanMode = _scanMode);
        if (_scanMode != ScanModeContinuous)
            StopContinuous();
        lock (_commandLock)
        {
            if (_commander.IsConnected)
                EnableSwitchReporting();
        }
        ScanDiagnostics.Log("GUN", "Scan mode → " + _scanMode);
        PostStatus("Scan mode: " + _scanMode);
    }

    private static string NormalizeScanMode(string? mode)
    {
        if (ScanModeContinuous.Equals(mode, StringComparison.OrdinalIgnoreCase))
            return ScanModeContinuous;
        if (ScanModeMulti.Equals(mode, StringComparison.OrdinalIgnoreCase))
            return ScanModeMulti;
        return ScanModeSingle;
    }

    public void SetBeepEnabled(bool enabled)
    {
        _beepEnabled = enabled;
        DesktopPrefs.SavePartial(p => p.Beep = _beepEnabled);
        lock (_commandLock)
            ApplyBeep();
        ScanDiagnostics.Log("GUN", "Beep → " + (_beepEnabled ? "on" : "off"));
    }

    public void SetPollMs(int ms)
    {
        _pollMs = Math.Clamp(ms, PollMin, PollMax);
        DesktopPrefs.SavePartial(p => p.PollMs = _pollMs);
        ScanDiagnostics.Log("GUN", "Poll interval → " + _pollMs + " ms");
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
        // Match TSL sample order: switch → synchronous slot → inventory async responder.
        _commander.ClearResponders();
        _commander.AddResponder(_switchResponder);
        _commander.AddSynchronousResponder();
        _commander.AddResponder(_inventory.Responder);
        _inventory.IsIndexedCommand = false;
        _inventory.IsLibraryCommand = false;
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

    private void ConfigureChainInventory()
    {
        _inventory.OutputPower = _powerDbm;
        _inventory.QuerySession = QuerySession.S0;
        _inventory.QueryTarget = QueryTarget.TargetA;
        _inventory.TakeNoAction = false;
        _inventory.IsIndexedCommand = false;
        _inventory.IsLibraryCommand = false;
        _inventory.FastIdentifier = TriState.Yes;
        _inventory.TagFocus = TriState.Yes;
    }

    /// <summary>
    /// SwitchAction.Inventory uses the gun's last inventory parameters — seed them on connect
    /// (matches TSL ASCII Protocol Explorer / Switch sample behaviour).
    /// </summary>
    private void SeedInventoryParameters()
    {
        try
        {
            _suppressTransponderDelivery = true;
            ConfigureChainInventory();
            _commander.ExecuteCommand(_inventory, _inventory.Responder);
        }
        catch (Exception ex)
        {
            // Non-fatal — switch-trigger inventory may still work with partial params.
            PostStatus("Inventory seed: " + ex.Message);
        }
        finally
        {
            _suppressTransponderDelivery = false;
        }
    }

    private void EnableSwitchReporting()
    {
        try
        {
            var sw = new SwitchActionCommand
            {
                AsynchronousReportingEnabled = TriState.Yes,
                // App owns every inventory — gun only reports the trigger (one read per press in single).
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
        lock (_commandLock)
        {
            if (!_commander.IsConnected) return;
        }
        if (e.State == SwitchState.Single)
        {
            var now = Environment.TickCount64;
            if (now - _lastTriggerMs < TriggerDebounceMs)
            {
                ScanDiagnostics.Log("GUN", "Trigger debounced");
                return;
            }
            _lastTriggerMs = now;
            ScanDiagnostics.Log("GUN", "Trigger → mode=" + _scanMode);
            switch (_scanMode)
            {
                case ScanModeContinuous:
                    PostStatus("Trigger");
                    OnTriggerPressed();
                    break;
                case ScanModeMulti:
                    Task.Run(PerformMultiReadBurst);
                    break;
                default:
                    Task.Run(PerformSingleRead);
                    break;
            }
        }
        else if (e.State is SwitchState.Off)
            StopContinuous();
    }

    private void OnTriggerPressed()
    {
        if (_continuousRunning)
            StopContinuous();
        else
            StartContinuous();
    }

    /// <summary>Inventory responder hook — delivery is via PerformSingleRead / multi burst only.</summary>
    private void OnInventoryTransponder(object? sender, TransponderDataEventArgs ev)
    {
        // Gun switch uses SinglePressAction=Off; ignore async inventory noise here.
    }

    private void PerformMultiReadBurst()
    {
        var deadline = Environment.TickCount64 + MultiBurstMs;
        var attempts = 0;
        while (Environment.TickCount64 < deadline && attempts < MultiBurstMaxReads && !_disposed)
        {
            PerformSingleRead(deliverAllTags: true);
            attempts++;
            if (Environment.TickCount64 < deadline)
                Thread.Sleep(MultiReadGapMs);
        }
    }

    private static string ExtractEpc(TransponderDataEventArgs ev)
    {
        var tag = NormalizeHex(ev.Transponder.Epc);
        if (string.IsNullOrEmpty(tag))
            tag = NormalizeHex(ev.Transponder.ReadData);
        return tag;
    }

    private static string ExtractTid(TransponderDataEventArgs ev, string epc)
    {
        var chip = NormalizeHex(ev.Transponder.TransponderIdentifier);
        if (!string.IsNullOrEmpty(chip) && chip == epc)
            chip = "";
        if (string.IsNullOrEmpty(chip))
            chip = NormalizeHex(ev.Transponder.ReadData);
        if (!string.IsNullOrEmpty(chip) && chip == epc)
            chip = "";
        return chip;
    }

    private void PerformSingleRead(bool deliverAllTags = false)
    {
        lock (_commandLock)
        {
            if (!_commander.IsConnected) return;
            _appDrivenRead = true;
            try
            {
                ConfigureChainInventory();
                var tags = new List<(string Epc, string Tid)>();
                void OnTag(object? s, TransponderDataEventArgs ev)
                {
                    var tag = ExtractEpc(ev);
                    if (string.IsNullOrEmpty(tag)) return;
                    if (!deliverAllTags && tags.Count > 0) return;
                    tags.Add((tag, ExtractTid(ev, tag)));
                }

                _inventory.TransponderReceived += OnTag;
                try
                {
                    _commander.ExecuteCommand(_inventory, _inventory.Responder);
                }
                finally
                {
                    _inventory.TransponderReceived -= OnTag;
                }

                if (tags.Count == 0)
                {
                    PostStatus("No tag in range");
                    return;
                }

                foreach (var (epc, tidHint) in tags)
                {
                    var tid = tidHint;
                    if (string.IsNullOrEmpty(tid))
                        tid = TryReadTidForEpc(epc);
                    DeliverScan(epc, tid ?? "");
                }
            }
            catch (Exception ex)
            {
                PostStatus("Read failed: " + ex.Message);
            }
            finally
            {
                _appDrivenRead = false;
            }
        }
    }

    private void DeliverScan(string epc, string tid)
    {
        var norm = epc.Trim().ToUpperInvariant();
        var now = Environment.TickCount64;
        if (norm == _lastDeliverNorm && now - _lastDeliverMs < ScanDedupeMs && string.IsNullOrEmpty(tid))
        {
            ScanDiagnostics.Log("NATIVE", "Deduped duplicate EPC " + norm);
            return;
        }
        _lastDeliverNorm = norm;
        _lastDeliverMs = now;

        EnqueueScan(epc, tid);
        ScanDiagnostics.Log("NATIVE", "DeliverScan queue+event EPC=" + epc + " TID=" + (tid ?? ""));
        ScanReceived?.Invoke(epc, tid ?? "");
        PostStatus("Read: " + epc + (string.IsNullOrEmpty(tid) ? " (no TID — hold badge still)" : " tid:" + tid));
    }

    /// <summary>Explicit TID bank read filtered by EPC — mirrors Android readTidBank().</summary>
    private string TryReadTidForEpc(string epcHex)
    {
        foreach (var words in new[] { 6, 4 })
        {
            var tid = ReadTidForEpcWords(epcHex, words);
            if (!string.IsNullOrEmpty(tid) && !tid.Equals(epcHex, StringComparison.OrdinalIgnoreCase))
                return tid;
        }
        return "";
    }

    private string ReadTidForEpcWords(string epcHex, int lengthWords)
    {
        lock (_commandLock)
        {
            if (!_commander.IsConnected) return "";
            try
            {
                var epcBlock = new DataBlock(epcHex);
                var read = new ReadTransponderCommand
                {
                    Bank = Databank.TransponderIdentifier,
                    Length = lengthWords,
                    Offset = 0,
                    InventoryOnly = TriState.No,
                    SelectBank = Databank.ElectronicProductCode,
                    SelectData = epcBlock.Base16,
                    SelectLength = epcBlock.LengthBits,
                    SelectOffset = 32,
                    OutputPower = _powerDbm,
                    QuerySession = QuerySession.S0,
                    QueryTarget = QueryTarget.TargetA,
                };

                string? captured = null;
                void OnRead(object? s, TransponderDataEventArgs args)
                {
                    var t = NormalizeHex(args.Transponder.TransponderIdentifier);
                    if (string.IsNullOrEmpty(t))
                        t = NormalizeHex(args.Transponder.ReadData);
                    if (!string.IsNullOrEmpty(t))
                        captured = t;
                }

                read.TransponderReceived += OnRead;
                try
                {
                    _commander.ExecuteCommand(read, read.Responder);
                }
                finally
                {
                    read.TransponderReceived -= OnRead;
                }
                return NormalizeHex(captured);
            }
            catch
            {
                return "";
            }
        }
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
