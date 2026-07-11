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
        Closed += (_, _) =>
        {
            if (_diagWindow != null)
            {
                _diagWindow.Detach();
                _diagWindow = null;
            }
            _rfid.Dispose();
        };
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

    private void OnWebMessageReceived(object? sender, CoreWebView2WebMessageReceivedEventArgs args)
    {
        try
        {
            if (!TryParseGunWebMessage(args, out var method)) return;
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
            }
        }
        catch
        {
            // ignore malformed messages
        }
    }

    private static bool TryParseGunWebMessage(CoreWebView2WebMessageReceivedEventArgs args, out string? method)
    {
        method = null;
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
        return !string.IsNullOrWhiteSpace(method);
    }

    private void ScheduleRelayGunConfig()
    {
        RelayGunConfigToPage();
        Task.Delay(1200).ContinueWith(_ => Dispatcher.Invoke(RelayGunConfigToPage));
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
                low.Contains("connect fail") || low.StartsWith("rfid connect"))
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
        ScanDiagnostics.Log("WEB", "DeliverScanToPage EPC=" + epc);
        DeliverScanToPageCore(epc, tid, "immediate");
        ScheduleScanDeliveryRetries(epc, tid);
    }

    private void ScheduleScanDeliveryRetries(string epc, string tid)
    {
        foreach (var delayMs in new[] { 400, 1200, 2500 })
        {
            var capturedDelay = delayMs;
            Task.Delay(capturedDelay).ContinueWith(_ =>
                Dispatcher.BeginInvoke(() => DeliverScanToPageCore(epc, tid, "retry@" + capturedDelay + "ms")));
        }
    }

    private void DeliverScanToPageCore(string epc, string tid, string pass)
    {
        if (WebView.CoreWebView2 == null) return;
        var tagJs = JsonSerializer.Serialize(epc);
        var tidJs = JsonSerializer.Serialize(tid);
        var msgJs = JsonSerializer.Serialize(new { type = "SHOWRUNNER_RFID_SCAN", tag = epc, tid });
        var topJs =
            $"(function(){{try{{var e={tagJs},t={tidJs};" +
            "if(window.showrunnerStationDeliverScan)window.showrunnerStationDeliverScan(e,t);" +
            "}catch(x){{}}}})();";
        var childJs =
            $"(function(){{try{{var m={msgJs};" +
            "if(typeof window.onStationRfidScan==='function')window.onStationRfidScan(m.tag,m.tid||'');" +
            "}catch(x){{}}}})();";
        try
        {
            _ = WebView.CoreWebView2.ExecuteScriptAsync(topJs);
            _ = WebView.CoreWebView2.ExecuteScriptAsync(
                $"(function(m){{try{{var f=document.getElementById('app-frame');" +
                "if(f&&f.contentWindow)f.contentWindow.postMessage(m,'*');}}catch(e){{}}}})({msgJs});");
            ScanDiagnostics.Log("WEB", pass + ": top relay + postMessage sent");
        }
        catch (Exception ex)
        {
            ScanDiagnostics.Log("WEB", pass + ": top relay failed — " + ex.Message);
        }

        CoreWebView2Frame[] frames;
        lock (_frameLock) frames = _childFrames.ToArray();
        ScanDiagnostics.Log("WEB", pass + ": child frames=" + frames.Length);
        var injected = 0;
        foreach (var frame in frames)
        {
            try
            {
                _ = frame.ExecuteScriptAsync(childJs);
                injected++;
            }
            catch (Exception ex)
            {
                ScanDiagnostics.Log("WEB", pass + ": frame script failed — " + ex.Message);
            }
        }
        if (injected > 0)
            ScanDiagnostics.Log("WEB", pass + ": onStationRfidScan injected into " + injected + " frame(s)");
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
              appFrame: !!(document.getElementById && document.getElementById('app-frame'))
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

    private void Window_OnKeyDown(object sender, KeyEventArgs e)
    {
        if (e.Key == Key.F12 || (e.Key == Key.D && Keyboard.Modifiers == (ModifierKeys.Control | ModifierKeys.Shift)))
        {
            ToggleDiagnosticWindow();
            e.Handled = true;
            return;
        }
        // F11 toggles borderless fullscreen; Escape exits app (kiosk ops).
        if (e.Key == Key.F11)
        {
            WindowStyle = WindowStyle == WindowStyle.None ? WindowStyle.SingleBorderWindow : WindowStyle.None;
            WindowState = WindowState.Maximized;
        }
        else if (e.Key == Key.Escape)
        {
            Close();
        }
    }

    // Resolve the host object lazily on every call: FrameCreated may add it AFTER this shim runs,
    // so capturing it once at document-created can miss it. window.AndroidStation must LOOK present
    // (getConfig + setScanMode) for the shell's stationNativeBridge_() to accept it and start polling.
    private const string BridgeShimScript = """
        (function() {
          if (window.__srDesktopBridge) return;
          function host() {
            try { return chrome.webview.hostObjects.sync.androidStation; } catch (e) { return null; }
          }
          function gunCmd(method) {
            var h = host();
            if (h && typeof h[method] === 'function') {
              try { h[method](); return; } catch (e) {}
            }
            try {
              chrome.webview.postMessage({ type: 'SR_STATION_GUN', method: method });
            } catch (e2) {}
          }
          window.__srDesktopBridge = true;
          window.AndroidStation = {
            getConfig: function() { var h = host(); return h ? h.getConfig() : '{}'; },
            setPower: function(p) { var h = host(); if (h) h.setPower(p); },
            setScanMode: function(m) { var h = host(); if (h) h.setScanMode(m); },
            setBeep: function(b) { var h = host(); if (h) h.setBeep(b); },
            setPollMs: function(ms) { var h = host(); if (h) h.setPollMs(ms); },
            pollScans: function() { var h = host(); return h ? h.pollScans() : '[]'; },
            reconnectGun: function() { gunCmd('reconnectGun'); },
            sleepGun: function() { gunCmd('sleepGun'); },
            shellReady: function() { var h = host(); if (h) h.shellReady(); },
            loginNeeded: function() { var h = host(); if (h) h.loginNeeded(); },
            saveSession: function(t, e) { var h = host(); if (h) h.saveSession(t, e); },
            getSavedSession: function() { var h = host(); return h ? h.getSavedSession() : ''; }
          };
        })();
        """;
}
