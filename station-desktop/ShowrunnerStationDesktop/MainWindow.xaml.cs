using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Windows;
using System.Windows.Input;
using Microsoft.Web.WebView2.Core;

namespace Showrunner.Station.Desktop;

public partial class MainWindow : Window
{
    private const string ShowrunnerUrl = "https://sm-showrunner-97405.web.app";

    private static readonly string UserAgentSuffix =
        " ShowrunnerStationDesktop/" + (typeof(MainWindow).Assembly.GetName().Version?.ToString(3) ?? "0.1.0");

    private readonly TslRfidManager _rfid = new();
    private readonly List<CoreWebView2Frame> _childFrames = new();
    private readonly object _frameLock = new();
    private StationBridge? _bridge;
    private bool _splashHidden;
    private DiagnosticWindow? _diagWindow;
    private System.Threading.Timer? _gunPushTimer;

    public MainWindow()
    {
        InitializeComponent();
        ScanDiagnostics.Log("APP", "Starting v" + (typeof(MainWindow).Assembly.GetName().Version?.ToString(3) ?? "?"));
        _rfid.StatusChanged += OnGunStatus;
        _rfid.ScanReceived += (epc, tid) =>
            Dispatcher.BeginInvoke(() =>
            {
                ScanDiagnostics.Log("NATIVE", "ScanReceived event EPC=" + epc);
                DeliverScanToPage(epc, tid ?? "");
            });
        Loaded += async (_, _) => await InitWebViewAsync();
        Closed += (_, _) => ShutdownRfid();
    }

    private bool _rfidShutdown;

    internal void ShutdownRfid()
    {
        if (_rfidShutdown) return;
        _rfidShutdown = true;
        _gunPushTimer?.Dispose();
        _gunPushTimer = null;
        if (_diagWindow != null)
        {
            _diagWindow.Detach();
            _diagWindow = null;
        }
        _rfid.ShutdownGracefully(TslRfidManager.ShutdownTimeoutMs);
    }

    private async Task InitWebViewAsync()
    {
        try
        {
            // Start the COM watchdog before WebView boot so gun connect is not blocked by shell init.
            _rfid.Start();

            var env = await CoreWebView2Environment.CreateAsync(
                null,
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "ShowrunnerStation", "WebView2"));
            await WebView.EnsureCoreWebView2Async(env);

            WebView.CoreWebView2.PermissionRequested += (_, args) =>
            {
                // Station kiosk does not use web push; deny so the green banner cannot stick open.
                if (args.PermissionKind == CoreWebView2PermissionKind.Notifications)
                    args.State = CoreWebView2PermissionState.Deny;
            };

            var settings = WebView.CoreWebView2.Settings;
            settings.AreDefaultContextMenusEnabled = false;
            settings.AreDevToolsEnabled = true;
            settings.IsStatusBarEnabled = false;
            settings.IsZoomControlEnabled = false;
            settings.IsWebMessageEnabled = true;

            var defaultUa = WebView.CoreWebView2.Settings.UserAgent;
            if (!defaultUa.Contains("ShowrunnerStationDesktop", StringComparison.OrdinalIgnoreCase))
                WebView.CoreWebView2.Settings.UserAgent = defaultUa + UserAgentSuffix;

            _bridge = new StationBridge(_rfid, HideSplash);

            WebView.CoreWebView2.WebMessageReceived += OnWebMessageReceived;
            WebView.CoreWebView2.AddHostObjectToScript("androidStation", _bridge);

            // The Showrunner station UI runs inside a cross-origin GAS iframe, so the host object
            // must also be exposed to child frames — otherwise window.AndroidStation is undefined
            // there and the scan-poll loop never starts. Mirror Android's inject-into-every-frame.
            WebView.CoreWebView2.FrameCreated += (_, args) =>
            {
                var child = args.Frame;
                lock (_frameLock) _childFrames.Add(child);
                child.Destroyed += (_, _) =>
                {
                    lock (_frameLock) _childFrames.Remove(child);
                };
                try
                {
                    child.AddHostObjectToScript("androidStation", _bridge, new[] { "*" });
                }
                catch
                {
                    // older runtime without frame host objects — top-frame path still works
                }
                child.NavigationCompleted += async (_, nav) =>
                {
                    if (!nav.IsSuccess) return;
                    ScanDiagnostics.Log("WEB", "Child frame navigation completed");
                    try
                    {
                        await child.ExecuteScriptAsync(BridgeShimScript);
                        ScanDiagnostics.Log("WEB", "Bridge shim injected into child frame");
                    }
                    catch (Exception ex)
                    {
                        ScanDiagnostics.Log("WEB", "Child shim failed: " + ex.Message);
                    }
                };
            };

            await WebView.CoreWebView2.AddScriptToExecuteOnDocumentCreatedAsync(BridgeShimScript);

            WebView.CoreWebView2.NavigationCompleted += async (_, e) =>
            {
                if (!e.IsSuccess) return;
                await InjectDeliverScanHelperAsync();
            };

            WebView.Source = new Uri(ShowrunnerUrl);
            ScanDiagnostics.Log("WEB", "Navigating to " + ShowrunnerUrl);

            // Push config + scans into JS cache — iframe pollScans/getConfig must never block on sync COM.
            _gunPushTimer = new System.Threading.Timer(_ => PushGunStateToWeb(), null, 400, 300);
        }
        catch (Exception ex)
        {
            ShowStatus("Boot error: " + ex.Message, persistent: true);
            HideSplash();
        }
    }

    private async Task InjectDeliverScanHelperAsync()
    {
        const string js = """
            try {
              if (!window.showrunnerStationDeliverScan) {
                window.showrunnerStationDeliverScan = function(tag, tid) {
                  try {
                    var f = document.getElementById('app-frame');
                    if (f && f.contentWindow) {
                      f.contentWindow.postMessage({ type: 'SHOWRUNNER_RFID_SCAN', tag: tag, tid: tid || '' }, '*');
                    }
                    if (typeof window.onStationRfidScan === 'function') {
                      window.onStationRfidScan(tag, tid || '');
                    }
                  } catch (e) {}
                };
              }
            } catch (e) {}
            """;
        try
        {
            await WebView.CoreWebView2.ExecuteScriptAsync(js);
        }
        catch
        {
            // ignore
        }
    }

    private void PushGunStateToWeb()
    {
        var cfg = _rfid.CurrentConfigJson();
        var scans = _rfid.DrainPendingScans();
        Dispatcher.BeginInvoke(() =>
        {
            try
            {
                if (WebView.CoreWebView2 == null) return;
                var cfgMsg = JsonSerializer.Serialize(new { type = "SR_GUN_CONFIG", json = cfg });
                WebView.CoreWebView2.PostWebMessageAsJson(cfgMsg);
                if (!string.IsNullOrWhiteSpace(scans) && scans != "[]")
                {
                    var scansMsg = JsonSerializer.Serialize(new { type = "SR_GUN_SCANS", scansRaw = scans });
                    PostJsonToChildFrames(scansMsg, "push", "SR_GUN_SCANS");
                    RelayScanBatchToWeb(scans, "push");
                }
            }
            catch
            {
                // ignore
            }
        });
    }

    private static string BuildNativeScanMessageJson(string epc, string tid) =>
        JsonSerializer.Serialize(new { type = "SR_RFID_SCAN", tag = epc, tid = tid ?? "" });

    /// <summary>
    /// Post directly into GAS iframe(s) via chrome.webview message — reliable when cross-origin postMessage is lossy.
    /// </summary>
    private void PostScanToChildFrames(string epc, string tid, string pass)
    {
        var msg = BuildNativeScanMessageJson(epc, tid);
        CoreWebView2Frame[] frames;
        lock (_frameLock) frames = _childFrames.ToArray();
        var posted = 0;
        foreach (var frame in frames)
        {
            try
            {
                frame.PostWebMessageAsJson(msg);
                posted++;
            }
            catch (Exception ex)
            {
                ScanDiagnostics.Log("WEB", pass + ": frame PostWebMessage failed — " + ex.Message);
            }
        }
        if (posted > 0)
            ScanDiagnostics.Log("WEB", pass + ": SR_RFID_SCAN → " + posted + " frame(s)");
    }

    /// <summary>
    /// Push scan into each frame's JS queue and invoke handler — awaited on UI thread for diagnostics.
    /// </summary>
    private static string BuildFrameScanInjectJs(string epc, string tid) =>
        "(function(){try{var t=" + JsonSerializer.Serialize(epc) + ",i=" + JsonSerializer.Serialize(tid ?? "") + ";" +
        "window.__srScanQueue=window.__srScanQueue||[];" +
        "window.__srScanQueue.push({epc:t,tag:t,tid:i});" +
        "while(window.__srScanQueue.length>32)window.__srScanQueue.shift();" +
        "var info={href:String(location.href||'').substring(0,72),isStation:!!window.IS_STATION_DEVICE," +
        "hasOnScan:typeof window.onStationRfidScan,hasFeed:typeof window.stationPushScanFeed_,bridge:!!window.__srDesktopBridge};" +
        "if(typeof window.__srInjectScan==='function'){window.__srInjectScan(t,i);info.action='inject';}" +
        "else if(typeof window.onStationRfidScan==='function'){window.onStationRfidScan(t,i);info.action='scan';}" +
        "else if(typeof window.stationPushScanFeed_==='function'){window.stationPushScanFeed_(t,i);info.action='feed';}" +
        "else{window.__srPendingRfidScans=window.__srPendingRfidScans||[];" +
        "window.__srPendingRfidScans.push({tag:t,tid:i,ts:Date.now()});info.action='queued';}" +
        "info.recent=(window.stationRecentScans||[]).length;info.q=(window.__srScanQueue||[]).length;" +
        "return JSON.stringify(info);}catch(e){return JSON.stringify({err:String(e.message||e)});}})()";

    private async Task InjectScanIntoFramesAsync(string epc, string tid, string pass)
    {
        var js = BuildFrameScanInjectJs(epc, tid);
        CoreWebView2Frame[] frames;
        lock (_frameLock) frames = _childFrames.ToArray();
        if (frames.Length == 0)
            ScanDiagnostics.Log("WEB", pass + ": no child frames tracked");
        for (var i = 0; i < frames.Length; i++)
        {
            try
            {
                var raw = await frames[i].ExecuteScriptAsync(js);
                ScanDiagnostics.Log("WEB", pass + ": FRAME[" + i + "] " + Trunc(UnwrapScriptResult(raw), 160));
            }
            catch (Exception ex)
            {
                ScanDiagnostics.Log("WEB", pass + ": FRAME[" + i + "] ERR " + ex.Message);
            }
        }
    }

    private void PostJsonToChildFrames(string json, string pass, string label)
    {
        CoreWebView2Frame[] frames;
        lock (_frameLock) frames = _childFrames.ToArray();
        var posted = 0;
        foreach (var frame in frames)
        {
            try
            {
                frame.PostWebMessageAsJson(json);
                posted++;
            }
            catch
            {
                // ignore per-frame failures
            }
        }
        if (posted > 0)
            ScanDiagnostics.Log("WEB", pass + ": " + label + " → " + posted + " frame(s)");
    }

    private void RelayScanBatchToWeb(string scansRaw, string pass)
    {
        try
        {
            using var doc = JsonDocument.Parse(scansRaw);
            if (doc.RootElement.ValueKind != JsonValueKind.Array) return;
            foreach (var item in doc.RootElement.EnumerateArray())
            {
                var epc = item.TryGetProperty("epc", out var epcEl) ? epcEl.GetString() : null;
                if (string.IsNullOrWhiteSpace(epc) && item.TryGetProperty("tag", out var tagEl))
                    epc = tagEl.GetString();
                var tid = item.TryGetProperty("tid", out var tidEl) ? tidEl.GetString() : "";
                if (string.IsNullOrWhiteSpace(epc)) continue;
                _ = DeliverScanToPageCoreAsync(epc, tid ?? "", pass);
            }
        }
        catch (Exception ex)
        {
            ScanDiagnostics.Log("WEB", pass + ": batch relay failed — " + ex.Message);
        }
    }

    private void RelayScanToTopHosting(string epc, string tid)
    {
        if (WebView.CoreWebView2 == null) return;
        var tagJs = JsonSerializer.Serialize(epc);
        var tidJs = JsonSerializer.Serialize(tid);
        var topJs =
            $"(function(){{try{{var e={tagJs},t={tidJs};" +
            "if(window.showrunnerStationDeliverScan)window.showrunnerStationDeliverScan(e,t);" +
            "}catch(x){{}}}})();";
        _ = WebView.CoreWebView2.ExecuteScriptAsync(topJs);
    }

    private void OnWebMessageReceived(object? sender, CoreWebView2WebMessageReceivedEventArgs args)
    {
        try
        {
            if (!TryParseGunWebMessage(args, out var method, out var payload)) return;
            switch (method)
            {
                case "reconnectGun":
                    _rfid.ForceReconnect();
                    ScheduleRelayGunConfig();
                    break;
                case "sleepGun":
                    _rfid.SleepAndDisconnect();
                    ScheduleRelayGunConfig();
                    break;
                case "setPower":
                {
                    var power = 0;
                    if (payload.ValueKind == JsonValueKind.Array && payload.GetArrayLength() > 0)
                        payload[0].TryGetInt32(out power);
                    else
                        payload.TryGetInt32(out power);
                    if (power > 0)
                        _rfid.SetPowerLevel(power);
                    break;
                }
                case "setScanMode":
                {
                    var mode = payload.ValueKind == JsonValueKind.Array && payload.GetArrayLength() > 0
                        ? payload[0].GetString()
                        : payload.GetString();
                    _rfid.SetScanMode(mode);
                    break;
                }
                case "setBeep":
                {
                    var on = payload.ValueKind == JsonValueKind.Array && payload.GetArrayLength() > 0
                        ? payload[0].ValueKind == JsonValueKind.True
                        : payload.ValueKind == JsonValueKind.True;
                    _rfid.SetBeepEnabled(on);
                    break;
                }
                case "setPollMs":
                {
                    var ms = 0;
                    if (payload.ValueKind == JsonValueKind.Array && payload.GetArrayLength() > 0)
                        payload[0].TryGetInt32(out ms);
                    else
                        payload.TryGetInt32(out ms);
                    if (ms > 0)
                        _rfid.SetPollMs(ms);
                    break;
                }
                case "shellReady":
                case "loginNeeded":
                    HideSplash();
                    break;
                case "saveSession":
                    if (payload.ValueKind == JsonValueKind.Array && payload.GetArrayLength() >= 2)
                    {
                        var token = payload[0].GetString();
                        var exp = payload[1].TryGetInt64(out var e) ? e : 0L;
                        _bridge?.saveSession(token, exp);
                    }
                    break;
            }
        }
        catch
        {
            // ignore malformed messages
        }
    }

    private static bool TryParseGunWebMessage(
        CoreWebView2WebMessageReceivedEventArgs args,
        out string? method,
        out JsonElement payload)
    {
        method = null;
        payload = default;
        JsonElement root;
        try
        {
            root = JsonDocument.Parse(args.WebMessageAsJson).RootElement;
            if (root.ValueKind == JsonValueKind.String)
                root = JsonDocument.Parse(root.GetString() ?? "{}").RootElement;
        }
        catch
        {
            var raw = args.TryGetWebMessageAsString();
            if (string.IsNullOrWhiteSpace(raw)) return false;
            try
            {
                root = JsonDocument.Parse(raw).RootElement;
            }
            catch
            {
                return false;
            }
        }

        if (root.GetProperty("type").GetString() != "SR_STATION_GUN") return false;
        method = root.GetProperty("method").GetString();
        if (root.TryGetProperty("args", out var argsEl))
            payload = argsEl;
        else if (root.TryGetProperty("payload", out var payEl))
            payload = payEl;
        else
            payload = default;
        return !string.IsNullOrWhiteSpace(method);
    }

    private void ScheduleRelayGunConfig()
    {
        RelayGunConfigToPage();
        Task.Delay(1200).ContinueWith(_ => Dispatcher.BeginInvoke(RelayGunConfigToPage));
    }

    private void RelayGunConfigToPage()
    {
        if (WebView.CoreWebView2 == null) return;
        var cfgJson = _rfid.CurrentConfigJson();
        var js =
            "(function(c){try{var cfg=JSON.parse(c);" +
            "var f=document.getElementById('app-frame');" +
            "if(f&&f.contentWindow)f.contentWindow.postMessage({type:'SHOWRUNNER_STATION_CONFIG',config:cfg},'*');" +
            "}catch(e){}})(" + JsonSerializer.Serialize(cfgJson) + ");";
        try
        {
            _ = WebView.CoreWebView2.ExecuteScriptAsync(js);
        }
        catch
        {
            // ignore
        }
    }

    private void OnGunStatus(string msg)
    {
        // Never block the COM watchdog thread waiting on the UI dispatcher.
        Dispatcher.BeginInvoke(() =>
        {
            var low = msg.ToLowerInvariant();
            if (low.Contains("fail") || low.Contains("error") || low.Contains("connect") ||
                low.Contains("scanning") || low.Contains("waiting") ||
                low.Contains("found tsl") || low.Contains("port(s)") || low.Contains("no tsl") ||
                low.Contains("trigger") || low.StartsWith("read:") || low.Contains("no tag"))
                ShowStatus(msg, persistent: false);

            if (low.Contains("gun connected") || low.Contains("gun asleep") || low.StartsWith("reconnecting"))
                RelayGunConfigToPage();

            if (low.StartsWith("read:") || low.Contains("gun connected") ||
                low.Contains("connect fail") || low.StartsWith("rfid connect") ||
                low.Contains("connecting ") || low.Contains("looking for tsl") ||
                low.Contains("is not a tsl") || low.Contains("no serial link"))
                ScanDiagnostics.Log("GUN", msg);
        });
    }

    private void DeliverScanToPage(string epc, string tid)
    {
        if (WebView.CoreWebView2 == null)
        {
            ScanDiagnostics.Log("WEB", "DeliverScan skipped — WebView not ready");
            return;
        }
        ScanDiagnostics.Log("WEB", "DeliverScanToPage EPC=" + epc + " desktop="
            + (typeof(MainWindow).Assembly.GetName().Version?.ToString(3) ?? "?"));
        _ = DeliverScanToPageCoreAsync(epc, tid, "immediate");
        ScheduleScanDeliveryRetries(epc, tid);
    }

    private void ScheduleScanDeliveryRetries(string epc, string tid)
    {
        foreach (var delayMs in new[] { 400, 1200, 2500 })
        {
            var capturedDelay = delayMs;
            Task.Delay(capturedDelay).ContinueWith(_ =>
                Dispatcher.BeginInvoke(() => _ = DeliverScanToPageCoreAsync(epc, tid, "retry@" + capturedDelay + "ms")));
        }
    }

    private async Task DeliverScanToPageCoreAsync(string epc, string tid, string pass)
    {
        if (WebView.CoreWebView2 == null) return;
        var msgJs = JsonSerializer.Serialize(new { type = "SHOWRUNNER_RFID_SCAN", tag = epc, tid });
        try
        {
            RelayScanToTopHosting(epc, tid);
            _ = WebView.CoreWebView2.ExecuteScriptAsync(
                $"(function(m){{try{{var f=document.getElementById('app-frame');" +
                "if(f&&f.contentWindow)f.contentWindow.postMessage(m,'*');}}catch(e){{}}}})({msgJs});");
            ScanDiagnostics.Log("WEB", pass + ": top relay + postMessage sent");
        }
        catch (Exception ex)
        {
            ScanDiagnostics.Log("WEB", pass + ": top relay failed — " + ex.Message);
        }

        PostScanToChildFrames(epc, tid, pass);
        await InjectScanIntoFramesAsync(epc, tid, pass);
        try
        {
            var topMsg = BuildNativeScanMessageJson(epc, tid);
            WebView.CoreWebView2.PostWebMessageAsJson(topMsg);
        }
        catch (Exception ex)
        {
            ScanDiagnostics.Log("WEB", pass + ": top PostWebMessage failed — " + ex.Message);
        }

        try
        {
            var tagJson = JsonSerializer.Serialize(epc);
            var tidJson = JsonSerializer.Serialize(tid ?? "");
            var topDiag =
                "(function(){try{var t=" + tagJson + ",i=" + tidJson + ",m={type:'SHOWRUNNER_RFID_SCAN',tag:t,tid:i};" +
                "var r={iframes:0,posted:0,deliver:typeof window.showrunnerStationDeliverScan};" +
                "var fs=document.querySelectorAll('iframe');r.iframes=fs.length;" +
                "for(var n=0;n<fs.length;n++){try{if(fs[n].contentWindow){fs[n].contentWindow.postMessage(m,'*');r.posted++;}}catch(x){}}" +
                "if(window.showrunnerStationDeliverScan)window.showrunnerStationDeliverScan(t,i);" +
                "return JSON.stringify(r);}catch(e){return JSON.stringify({err:e.message});}})()";
            var raw = await WebView.CoreWebView2.ExecuteScriptAsync(topDiag);
            ScanDiagnostics.Log("WEB", pass + ": top diag " + Trunc(UnwrapScriptResult(raw), 100));
        }
        catch (Exception ex)
        {
            ScanDiagnostics.Log("WEB", pass + ": top diag ERR " + ex.Message);
        }
    }

    private void ShowDiagnosticWindow()
    {
        if (_diagWindow == null)
        {
            _diagWindow = new DiagnosticWindow(ProbeWebBridgeAsync, DeliverScanToPage, GunSummary)
            {
                Owner = this,
            };
        }

        if (_diagWindow.IsVisible)
        {
            _diagWindow.Activate();
            return;
        }

        _diagWindow.Show();
        _diagWindow.Activate();
        ScanDiagnostics.Log("DIAG", "Diagnostic window opened (F12 to hide)");
    }

    private void HideDiagnosticWindow()
    {
        if (_diagWindow == null || !_diagWindow.IsVisible) return;
        _diagWindow.Hide();
        ScanDiagnostics.Log("DIAG", "Diagnostic window hidden");
    }

    private void ToggleDiagnosticWindow()
    {
        if (_diagWindow is { IsVisible: true })
            HideDiagnosticWindow();
        else
            ShowDiagnosticWindow();
    }

    private string GunSummary()
    {
        try
        {
            var cfg = JsonDocument.Parse(_rfid.CurrentConfigJson()).RootElement;
            return "connected=" + cfg.GetProperty("connected") +
                   " port=" + cfg.GetProperty("comPort").GetString() +
                   " state=" + cfg.GetProperty("linkState").GetString();
        }
        catch
        {
            return _rfid.CurrentConfigJson();
        }
    }

    private const string WebProbeScript = """
        (function(){
          try {
            return JSON.stringify({
              role: window.top === window ? 'top' : 'child',
              href: String(location.href || '').substring(0, 120),
              isStation: !!window.IS_STATION_DEVICE,
              hasOnScan: typeof window.onStationRfidScan === 'function',
              pollActive: !!window.stationScanPollTimer,
              recentScans: (window.stationRecentScans || []).length,
              lastTag: String(window.stationLastScanTag || '').substring(0, 32),
              androidStation: !!(window.AndroidStation && typeof window.AndroidStation.getConfig === 'function'),
              chromeHost: !!(window.chrome && window.chrome.webview && window.chrome.webview.hostObjects && window.chrome.webview.hostObjects.sync && window.chrome.webview.hostObjects.sync.androidStation),
              deliverFn: typeof window.showrunnerStationDeliverScan === 'function',
              appFrame: !!(document.getElementById && document.getElementById('app-frame')),
              desktopBridge: !!window.__srDesktopBridge,
              pendingRfid: (window.__srPendingRfidScans || []).length
            });
          } catch (e) { return JSON.stringify({ error: String(e) }); }
        })()
        """;

    private async Task ProbeWebBridgeAsync()
    {
        if (WebView.CoreWebView2 == null)
        {
            ScanDiagnostics.Log("WEB", "Probe skipped — WebView not ready");
            return;
        }

        try
        {
            var topRaw = await WebView.CoreWebView2.ExecuteScriptAsync(WebProbeScript);
            ScanDiagnostics.Log("WEB", "TOP " + UnwrapScriptResult(topRaw));
        }
        catch (Exception ex)
        {
            ScanDiagnostics.Log("WEB", "TOP probe error: " + ex.Message);
        }

        try
        {
            var iframeMeta = await WebView.CoreWebView2.ExecuteScriptAsync(
                "(function(){try{var f=document.getElementById('app-frame');if(!f)return 'no app-frame';return 'app-frame src='+String(f.src||'').substring(0,100);}catch(e){return String(e);}})()");
            ScanDiagnostics.Log("WEB", UnwrapScriptResult(iframeMeta));
        }
        catch (Exception ex)
        {
            ScanDiagnostics.Log("WEB", "app-frame probe error: " + ex.Message);
        }

        CoreWebView2Frame[] frames;
        lock (_frameLock) frames = _childFrames.ToArray();
        ScanDiagnostics.Log("WEB", "Tracked child frames: " + frames.Length);
        for (var i = 0; i < frames.Length; i++)
        {
            try
            {
                var raw = await frames[i].ExecuteScriptAsync(WebProbeScript);
                ScanDiagnostics.Log("WEB", "FRAME[" + i + "] " + UnwrapScriptResult(raw));
            }
            catch (Exception ex)
            {
                ScanDiagnostics.Log("WEB", "FRAME[" + i + "] error: " + ex.Message);
            }
        }
    }

    private static string UnwrapScriptResult(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw) || raw == "null") return "(empty)";
        try
        {
            return JsonSerializer.Deserialize<string>(raw) ?? raw;
        }
        catch
        {
            return raw;
        }
    }

    private static string Trunc(string? s, int max)
    {
        if (string.IsNullOrEmpty(s)) return "";
        return s.Length <= max ? s : s[..max] + "…";
    }

    private void HideSplash()
    {
        if (_splashHidden) return;
        _splashHidden = true;
        Splash.Visibility = Visibility.Collapsed;
    }

    private void ShowStatus(string msg, bool persistent)
    {
        StatusBar.Text = msg;
        StatusBar.Visibility = Visibility.Visible;
        if (!persistent)
        {
            var timer = new System.Windows.Threading.DispatcherTimer
            {
                Interval = TimeSpan.FromSeconds(4),
            };
            timer.Tick += (_, _) =>
            {
                timer.Stop();
                StatusBar.Visibility = Visibility.Collapsed;
            };
            timer.Start();
        }
    }

    private void Window_OnPreviewKeyDown(object sender, KeyEventArgs e)
    {
        if (e.Key == Key.F12 || (e.Key == Key.D && Keyboard.Modifiers == (ModifierKeys.Control | ModifierKeys.Shift)))
        {
            ToggleDiagnosticWindow();
            e.Handled = true;
            return;
        }
        if (e.Key == Key.F11)
        {
            WindowStyle = WindowStyle == WindowStyle.None ? WindowStyle.SingleBorderWindow : WindowStyle.None;
            WindowState = WindowState.Maximized;
            e.Handled = true;
            return;
        }
        // PreviewKeyDown so WebView focus cannot swallow Escape when the UI thread is busy.
        if (e.Key == Key.Escape)
        {
            e.Handled = true;
            Application.Current.Shutdown(0);
        }
    }

    // Cache-only bridge: pollScans/getConfig read JS memory updated by native PostWebMessage.
    // Sync hostObjects blocked the UI thread (hourglass) when COM connect was in flight.
    private const string BridgeShimScript = """
        (function() {
          if (window.__srDesktopBridge) return;
          window.__srScanQueue = [];
          window.__srGunConfigJson = '{"connected":false,"linkState":"disconnected"}';
          try {
            chrome.webview.addEventListener('message', function(ev) {
              try {
                var d = ev.data;
                if (typeof d === 'string') d = JSON.parse(d);
                if (!d || !d.type) return;
                if (d.type === 'SR_GUN_CONFIG' && d.json) window.__srGunConfigJson = d.json;
                if (d.type === 'SR_RFID_SCAN') {
                  var epc = String(d.tag || d.epc || '').trim();
                  var tid = String(d.tid || '').trim();
                  if (epc && typeof window.onStationRfidScan === 'function') {
                    window.onStationRfidScan(epc, tid);
                  } else if (epc && typeof window.stationPushScanFeed_ === 'function') {
                    window.stationPushScanFeed_(epc, tid);
                  } else if (epc && window.showrunnerStationDeliverScan) {
                    window.showrunnerStationDeliverScan(epc, tid);
                  }
                }
                if (d.type === 'SR_GUN_SCANS' && d.scansRaw) {
                  var batch = JSON.parse(d.scansRaw);
                  if (batch && batch.length) {
                    window.__srScanQueue.push.apply(window.__srScanQueue, batch);
                    while (window.__srScanQueue.length > 32) window.__srScanQueue.shift();
                    for (var si = 0; si < batch.length; si++) {
                      var it = batch[si];
                      var se = (it && (it.epc || it.tag)) || '';
                      var st = (it && it.tid) || '';
                      if (!se) continue;
                      if (typeof window.onStationRfidScan === 'function') {
                        window.onStationRfidScan(se, st);
                      } else if (typeof window.stationPushScanFeed_ === 'function') {
                        window.stationPushScanFeed_(se, st);
                      } else if (window.showrunnerStationDeliverScan) {
                        window.showrunnerStationDeliverScan(se, st);
                      }
                    }
                  }
                }
              } catch (e) {}
            });
          } catch (e) {}
          function postGun(method, args) {
            try {
              chrome.webview.postMessage(JSON.stringify({ type: 'SR_STATION_GUN', method: method, args: args || [] }));
            } catch (e2) {}
          }
          window.__srDesktopBridge = true;
          window.__srInjectScan = function(tag, tid) {
            var t = String(tag || ''), i = String(tid || '');
            window.__srScanQueue = window.__srScanQueue || [];
            window.__srScanQueue.push({ epc: t, tag: t, tid: i });
            while (window.__srScanQueue.length > 32) window.__srScanQueue.shift();
            if (typeof window.onStationRfidScan === 'function') window.onStationRfidScan(t, i);
            else if (typeof window.stationPushScanFeed_ === 'function') window.stationPushScanFeed_(t, i);
          };
          window.AndroidStation = {
            getConfig: function() { return window.__srGunConfigJson || '{}'; },
            setPower: function(p) { postGun('setPower', [p]); },
            setScanMode: function(m) { postGun('setScanMode', [m]); },
            setBeep: function(b) { postGun('setBeep', [b]); },
            setPollMs: function(ms) { postGun('setPollMs', [ms]); },
            pollScans: function() {
              var q = window.__srScanQueue || [];
              window.__srScanQueue = [];
              return q.length ? JSON.stringify(q) : '[]';
            },
            reconnectGun: function() { postGun('reconnectGun'); },
            sleepGun: function() { postGun('sleepGun'); },
            shellReady: function() { postGun('shellReady'); },
            loginNeeded: function() { postGun('loginNeeded'); },
            saveSession: function(t, e) { postGun('saveSession', [t, e]); },
            getSavedSession: function() {
              try {
                var h = chrome.webview.hostObjects.sync.androidStation;
                return h ? h.getSavedSession() : '';
              } catch (e) { return ''; }
            }
          };
        })();
        """;
}
