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

    public MainWindow()
    {
        InitializeComponent();
        _rfid.StatusChanged += OnGunStatus;
        Loaded += async (_, _) => await InitWebViewAsync();
        Closed += (_, _) => _rfid.Dispose();
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

            // Top frame (web.app shell).
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
                    try
                    {
                        await child.ExecuteScriptAsync(BridgeShimScript);
                    }
                    catch
                    {
                        // ignore
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
        Dispatcher.Invoke(() =>
        {
            var low = msg.ToLowerInvariant();
            if (low.Contains("fail") || low.Contains("error") || low.Contains("connect") ||
                low.Contains("read:") || low.Contains("scanning"))
                ShowStatus(msg, persistent: false);

            // Also push scans to the page when they arrive (belt-and-suspenders with pollScans).
            if (low.StartsWith("read:"))
            {
                var parts = msg.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                if (parts.Length >= 2)
                {
                    var epc = parts[1];
                    var tid = "";
                    var tidIdx = msg.IndexOf("tid:", StringComparison.OrdinalIgnoreCase);
                    if (tidIdx >= 0)
                        tid = msg[(tidIdx + 4)..].Trim();
                    DeliverScanToPage(epc, tid);
                }
            }
            else if (low.Contains("gun connected") || low.Contains("gun asleep") || low.StartsWith("reconnecting"))
            {
                RelayGunConfigToPage();
            }
        });
    }

    private void DeliverScanToPage(string epc, string tid)
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
        }
        catch
        {
            // ignore
        }

        CoreWebView2Frame[] frames;
        lock (_frameLock) frames = _childFrames.ToArray();
        foreach (var frame in frames)
        {
            try
            {
                _ = frame.ExecuteScriptAsync(childJs);
            }
            catch
            {
                // ignore
            }
        }
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
