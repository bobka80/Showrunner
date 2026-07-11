using System.Collections.Concurrent;
using System.IO.Ports;
using System.Text;
using System.Text.Json;
using System.Threading;
using TechnologySolutions.Rfid.AsciiProtocol;
using TechnologySolutions.Rfid.AsciiProtocol.Commands;
using TechnologySolutions.Rfid.AsciiProtocol.Extensions;

namespace Showrunner.Station.Desktop;

/// <summary>
/// TSL 1128 over Bluetooth virtual COM — serialized command queue, app-owned trigger reads.
/// </summary>
public sealed class TslRfidManager : IDisposable
{
    public const string ScanModeSingle = "single";
    public const string ScanModeMulti = "multi";
    public const string ScanModeContinuous = "continuous";

    private const int PowerMin = 10;
    private const int PowerMax = 29;
    private const int PollMin = 100;
    private const int PollMax = 2000;
    private const int WatchdogMs = 2500;
    private const int TriggerDebounceMs = 2200;
    private const int ScanDedupeMs = 1500;
    private const int MultiBurstMs = 700;
    private const int MultiBurstMaxReads = 20;
    private const int MultiReadGapMs = 40;
    private const int ConnectPortTimeoutMs = 3500;
    public const int ShutdownTimeoutMs = 3000;

    private readonly BlockingCollection<Action> _gunQueue = new();
    private Thread? _gunThread;
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
    private volatile int _readGate;
    private volatile bool _commanderLive;

    public event Action<string>? StatusChanged;
    public event Action<string, string>? ScanReceived;

    public TslRfidManager()
    {
        _switchResponder.SwitchStateChanged += OnSwitchStateChanged;
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
        _userSleep = false;
        var prefs = DesktopPrefs.Load();
        _manualPort = (prefs.ComPort ?? "").Trim();
        _lastGunDeviceId = (prefs.LastGunDeviceId ?? "").Trim();
        _portName = _manualPort;
        _powerDbm = prefs.PowerDbm is >= PowerMin and <= PowerMax ? prefs.PowerDbm : 29;
        _beepEnabled = prefs.Beep;
        _scanMode = NormalizeScanMode(prefs.ScanMode);
        _pollMs = prefs.PollMs is >= PollMin and <= PollMax ? prefs.PollMs : 500;

        PostStatus(string.IsNullOrWhiteSpace(_manualPort)
            ? "Looking for TSL gun…"
            : $"Looking for TSL gun on {_manualPort}…");

        StartGunWorker();
        _watchdog = new System.Threading.Timer(_ => WatchdogTick(), null, 0, WatchdogMs);
        ConnectLockLog.Record("start", _portName, null, _readGate, "scanMode=" + _scanMode);
    }

    private void StartGunWorker()
    {
        _gunThread = new Thread(GunWorkerMain)
        {
            IsBackground = true,
            Name = "TslGunWorker",
        };
        _gunThread.Start();
    }

    private void RunGun(Action work)
    {
        if (_disposed) return;
        try { _gunQueue.Add(work); }
        catch (InvalidOperationException) { /* queue completed on dispose */ }
    }

    private void GunWorkerMain()
    {
        try
        {
            foreach (var work in _gunQueue.GetConsumingEnumerable())
            {
                if (_disposed) break;
                try { work(); }
                catch (Exception ex)
                {
                    ConnectLockLog.Record("gun-worker-error", _portName, false, _readGate, ex.Message);
                }
            }
        }
        catch (Exception ex)
        {
            ConnectLockLog.Record("gun-worker-fatal", _portName, false, _readGate, ex.Message);
        }
    }

    private void WatchdogTick()
    {
        if (_disposed || _userSleep) return;

        if (_commanderLive)
        {
            _connected = true;
            if (_linkState != "live")
            {
                _linkState = "live";
                ConnectLockLog.Record("watchdog-live", _portName, true, _readGate, "link restored");
            }
            return;
        }

        _connected = false;
        if (!_connecting)
        {
            _connecting = true;
            new Thread(ConnectWatchdogWorker)
            {
                IsBackground = true,
                Name = "TslConnectWatchdog",
            }.Start();
        }
    }

    /// <summary>Connect runs off the gun worker so a sleeping gun cannot freeze reads/shutdown.</summary>
    private void ConnectWatchdogWorker()
    {
        Exception? error = null;
        var worker = new Thread(() =>
        {
            try { TryConnectFromWatchdog(); }
            catch (Exception ex) { error = ex; }
        })
        {
            IsBackground = true,
            Name = "TslConnectWatchdog",
        };
        worker.Start();
        var sweepMs = Math.Max(ConnectPortTimeoutMs * 2, 7000);
        if (!worker.Join(sweepMs))
            ConnectLockLog.Record("connect-sweep-timeout", _portName, false, _readGate, ">" + sweepMs + "ms");
        else if (error != null)
            ConnectLockLog.Record("connect-error", _portName, false, _readGate, error.Message);
        _connecting = false;
    }

    private void TryConnectFromWatchdog()
    {
        if (_disposed || _userSleep) return;
        StopContinuous();
        ResetReadGate();
        ConnectLockLog.Record("watchdog-tick", _portName, null, _readGate, "begin connect sweep");
        try
        {
            if (!string.IsNullOrWhiteSpace(_manualPort))
            {
                _portName = _manualPort;
                if (ConnectToPort(new GunPortDetector.GunPort(_manualPort, "manual override", "")))
                    return;
                SafeDisconnect();
                ConnectLockLog.Record("manual-fail", _manualPort, false, _readGate, "manual COM failed — trying auto-detect");
            }

            var candidates = GunPortDetector.Detect(_lastGunDeviceId);
            if (candidates.Count == 0)
            {
                if (_linkState != "waiting")
                {
                    _linkState = "waiting";
                    PostStatus("Waiting for TSL gun — pair it and press the trigger to wake it");
                    ConnectLockLog.Record("no-ports", "", false, _readGate, "no COM candidates");
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
        catch (Exception ex)
        {
            ConnectLockLog.Record("connect-error", _portName, false, _readGate, ex.Message);
        }
    }

    public void Connect()
    {
        if (string.IsNullOrWhiteSpace(_portName))
        {
            PostStatus("No COM port configured");
            return;
        }
        RunGun(() => ConnectToPort(new GunPortDetector.GunPort(_portName, "", "")));
    }

    private bool ConnectToPort(GunPortDetector.GunPort candidate)
    {
        var port = candidate.ComPort;
        if (string.IsNullOrWhiteSpace(port)) return false;

        ConnectLockLog.Record("connect-try", port, null, _readGate, candidate.FriendlyName);

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
                _commanderLive = _connected;
                if (!_connected)
                {
                    _linkState = "disconnected";
                    PostStatus("No serial link on " + port);
                    ConnectLockLog.Record("connect-fail", port, false, _readGate, "no serial link");
                    return false;
                }

                ReadFirmware();
                if (string.IsNullOrWhiteSpace(_firmware))
                {
                    _linkState = "disconnected";
                    PostStatus("Gun asleep on " + port + " — pull trigger to wake it");
                    ConnectLockLog.Record("connect-fail", port, false, _readGate, "version probe failed/asleep");
                    try { _commander.Disconnect(); } catch { /* ignore */ }
                    _connected = false;
                    _commanderLive = false;
                    return false;
                }

                ConfigureChainInventory();
                PushInventoryDefaultsSilent();
                EnableSwitchReporting();
                ApplyBeep();
                _linkState = "live";
                _commanderLive = true;
                _portName = port;
                PostStatus("Gun connected on " + port + " (" + _firmware + ") mode=" + _scanMode);
                ConnectLockLog.Record("connect-ok", port, true, _readGate, "fw=" + _firmware);
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
            _commanderLive = false;
            _linkState = "disconnected";
            var hint = ex.Message.Contains("denied", StringComparison.OrdinalIgnoreCase)
                ? "COM port in use — close other Showrunner Station or ASCII Explorer, then retry"
                : ex.Message;
            PostStatus("Connect error on " + port + ": " + hint);
            ConnectLockLog.Record("connect-error", port, false, _readGate, ex.Message);
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
            _commanderLive = false;
        }
        catch
        {
            // ignore
        }
    }

    public void ForceReconnect()
    {
        _userSleep = false;
        StopContinuous();
        ResetReadGate();
        ConnectLockLog.Record("force-reconnect", _portName, null, _readGate, "user requested");
        PostStatus("Reconnecting…");
        _lastDetectLog = "";
        RunGun(ForceReconnectCore);
    }

    private void ForceReconnectCore()
    {
        lock (_commandLock)
        {
            try
            {
                AbortIfConnected();
                if (_commander.IsConnected)
                    _commander.Disconnect();
            }
            catch
            {
                // ignore
            }
            _connected = false;
            _commanderLive = false;
            _linkState = "connecting";
        }
        Thread.Sleep(300);
        if (!_disposed)
        {
            _connecting = true;
            new Thread(ConnectWatchdogWorker) { IsBackground = true, Name = "TslConnectWatchdog" }.Start();
        }
    }

    public void SleepAndDisconnect()
    {
        _userSleep = true;
        StopContinuous();
        ResetReadGate();
        ConnectLockLog.Record("sleep", _portName, null, _readGate, "user sleep");
        RunGun(SleepAndDisconnectCore);
    }

    private void SleepAndDisconnectCore()
    {
        try
        {
            lock (_commandLock)
            {
                try
                {
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
                _commanderLive = false;
                _linkState = "asleep";
            }
            PostStatus("Gun asleep — pull the trigger to wake it, then tap Reconnect");
        }
        catch (Exception ex)
        {
            ConnectLockLog.Record("sleep-error", _portName, false, _readGate, ex.Message);
        }
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

    public void ClearPendingScans()
    {
        while (_pendingScans.TryDequeue(out _)) { }
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
        ConfigureChainInventory();
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
        if (_commander.IsConnected)
            RunConfigAction(EnableSwitchReporting);
        ScanDiagnostics.Log("GUN", "Scan mode → " + _scanMode);
        PostStatus("Scan mode: " + _scanMode);
    }

    public void SetBeepEnabled(bool enabled)
    {
        _beepEnabled = enabled;
        DesktopPrefs.SavePartial(p => p.Beep = _beepEnabled);
        if (_commander.IsConnected)
            RunConfigAction(ApplyBeep);
        ScanDiagnostics.Log("GUN", "Beep → " + (_beepEnabled ? "on" : "off"));
    }

    public void SetPollMs(int ms)
    {
        _pollMs = Math.Clamp(ms, PollMin, PollMax);
        DesktopPrefs.SavePartial(p => p.PollMs = _pollMs);
        ScanDiagnostics.Log("GUN", "Poll interval → " + _pollMs + " ms");
    }

    /// <summary>Sleep gun, release COM, then tear down — bounded wait for app exit.</summary>
    public void ShutdownGracefully(int timeoutMs = ShutdownTimeoutMs)
    {
        if (_disposed) return;

        ConnectLockLog.RecordSync("dispose-start", _portName, null, _readGate, "timeout=" + timeoutMs + "ms");

        _userSleep = true;
        StopContinuous();
        ResetReadGate();
        _watchdog?.Dispose();
        _watchdog = null;

        WaitForConnectingIdle(Math.Min(800, timeoutMs / 3));

        var sleepBudget = Math.Max(600, timeoutMs - 400);
        var slept = RunWithTimeout(SleepAndDisconnectCore, sleepBudget);
        if (!slept)
            ConnectLockLog.RecordSync("dispose-timeout", _portName, false, _readGate, "sleep/disconnect");

        DisposeCore();

        ConnectLockLog.RecordSync("dispose-done", _portName, slept, _readGate, slept ? "sleep+disconnect" : "partial");
    }

    public void Dispose() => ShutdownGracefully(ShutdownTimeoutMs);

    private void WaitForConnectingIdle(int waitMs)
    {
        if (waitMs <= 0) return;
        var deadline = Environment.TickCount64 + waitMs;
        while (_connecting && Environment.TickCount64 < deadline)
            Thread.Sleep(40);
    }

    private static bool RunWithTimeout(Action work, int timeoutMs)
    {
        Exception? error = null;
        var thread = new Thread(() =>
        {
            try { work(); }
            catch (Exception ex) { error = ex; }
        })
        {
            IsBackground = true,
            Name = "TslShutdown",
        };
        thread.Start();
        if (!thread.Join(timeoutMs))
            return false;
        if (error != null)
            ConnectLockLog.RecordSync("dispose-error", "-", false, 0, error.Message);
        return error == null;
    }

    private void DisposeCore()
    {
        if (_disposed) return;
        _disposed = true;
        _switchResponder.SwitchStateChanged -= OnSwitchStateChanged;
        try { _gunQueue.CompleteAdding(); } catch { /* ignore */ }
        try { _gunThread?.Join(1500); } catch { /* ignore */ }
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
        _commanderLive = false;
        _commander.Dispose();
    }

    private void SetupResponders()
    {
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

    /// <summary>Push default inventory params to gun firmware without an RF read (TakeNoAction).</summary>
    private void PushInventoryDefaultsSilent()
    {
        try
        {
            ConfigureChainInventory();
            _inventory.TakeNoAction = true;
            _commander.ExecuteCommand(_inventory, _inventory.Responder);
        }
        catch (Exception ex)
        {
            ScanDiagnostics.Log("GUN", "Silent param push: " + ex.Message);
        }
        finally
        {
            _inventory.TakeNoAction = false;
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
        if (!_commanderLive) return;

        RunGun(() => HandleSwitchState(e));
    }

    private void HandleSwitchState(SwitchStateEventArgs e)
    {
        if (!_commander.IsConnected) return;

        if (e.State == SwitchState.Single)
        {
            var now = Environment.TickCount64;
            if (now - _lastTriggerMs < TriggerDebounceMs)
            {
                ScanDiagnostics.Log("GUN", "Trigger debounced");
                return;
            }
            if (_readGate != 0)
            {
                ScanDiagnostics.Log("GUN", "Trigger ignored — read in flight");
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
                    RunTriggerRead(PerformMultiReadBurst);
                    break;
                default:
                    RunTriggerRead(() => PerformSingleRead());
                    break;
            }
        }
        else if (e.State is SwitchState.Off && _continuousRunning)
        {
            StopContinuous();
        }
    }

    private void OnTriggerPressed()
    {
        if (_continuousRunning)
            StopContinuous();
        else
            StartContinuous();
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

    private void PerformSingleRead(bool deliverAllTags = false)
    {
        lock (_commandLock)
        {
            if (!_commander.IsConnected) return;
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
                        tid = ReadTidForEpcUnlocked(epc);
                    DeliverScan(epc, tid ?? "");
                }
            }
            catch (Exception ex)
            {
                PostStatus("Read failed: " + ex.Message);
            }
        }
    }

    private string ReadTidForEpcUnlocked(string epcHex)
    {
        foreach (var words in new[] { 6, 4 })
        {
            var tid = ReadTidForEpcWordsUnlocked(epcHex, words);
            if (!string.IsNullOrEmpty(tid) && !tid.Equals(epcHex, StringComparison.OrdinalIgnoreCase))
                return tid;
        }
        return "";
    }

    private string ReadTidForEpcWordsUnlocked(string epcHex, int lengthWords)
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
        ScanDiagnostics.Log("NATIVE", "DeliverScan EPC=" + epc + " TID=" + (tid ?? ""));
        ScanReceived?.Invoke(epc, tid ?? "");
        PostStatus("Read: " + epc + (string.IsNullOrEmpty(tid) ? " (no TID — hold badge still)" : " tid:" + tid));
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
                if (!TryEnterRead())
                {
                    try { await Task.Delay(50, token); } catch (TaskCanceledException) { break; }
                    continue;
                }
                try
                {
                    lock (_commandLock)
                        PerformSingleRead();
                }
                finally
                {
                    ExitRead();
                }
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
        if (!_continuousRunning && _continuousCts == null) return;
        _continuousRunning = false;
        _continuousCts?.Cancel();
        _continuousCts = null;
        ResetReadGate();
        try
        {
            lock (_commandLock)
            {
                if (_commander.IsConnected)
                    AbortIfConnected();
            }
        }
        catch
        {
            // ignore
        }
    }

    private bool TryEnterRead() => Interlocked.CompareExchange(ref _readGate, 1, 0) == 0;

    private void ExitRead() => Interlocked.Exchange(ref _readGate, 0);

    private void ResetReadGate()
    {
        var was = Interlocked.Exchange(ref _readGate, 0);
        if (was != 0)
            ConnectLockLog.Record("read-gate-reset", _portName, null, 0, "was locked");
    }

    /// <summary>Trigger reads only — never used for connect/disconnect/config.</summary>
    private void RunTriggerRead(Action work)
    {
        if (!TryEnterRead())
        {
            ScanDiagnostics.Log("GUN", "Read skipped — previous read still running");
            ConnectLockLog.Record("read-skipped", _portName, false, _readGate, "read gate busy");
            return;
        }
        RunGun(() =>
        {
            try { work(); }
            finally { ExitRead(); }
        });
    }

    /// <summary>Live config (power already in memory) — uses command lock, not read gate.</summary>
    private void RunConfigAction(Action work)
    {
        RunGun(() =>
        {
            if (!_commander.IsConnected) return;
            try { work(); }
            catch (Exception ex) { ScanDiagnostics.Log("GUN", "Config failed: " + ex.Message); }
        });
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

    private static string NormalizeScanMode(string? mode)
    {
        if (ScanModeContinuous.Equals(mode, StringComparison.OrdinalIgnoreCase))
            return ScanModeContinuous;
        if (ScanModeMulti.Equals(mode, StringComparison.OrdinalIgnoreCase))
            return ScanModeMulti;
        return ScanModeSingle;
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
        if (msg == _lastStatus && !msg.StartsWith("Read:", StringComparison.Ordinal)) return;
        _lastStatus = msg;
        StatusChanged?.Invoke(msg);
    }

    private sealed record PendingScan(string Epc, string Tid);
}
