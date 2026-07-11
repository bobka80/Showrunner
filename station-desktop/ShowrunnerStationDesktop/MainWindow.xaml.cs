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

            var defaultUa = WebView.CoreWebView2.Settings.UserAgent;
            if (!defaultUa.Contains("ShowrunnerStationDesktop", StringComparison.OrdinalIgnoreCase))
                WebView.CoreWebView2.Settings.UserAgent = defaultUa + UserAgentSuffix;

            _bridge = new StationBridge(_rfid, HideSplash);

            // Top frame (web.app shell).
            WebView.CoreWebView2.AddHostObjectToScript("androidStation", _bridge);

            // The Showrunner station UI runs inside a cross-origin GAS iframe, so the host object
            // must also be exposed to child frames — otherwise window.AndroidStation is undefined
            // there and the scan-poll loop never starts. Mirror Android's inject-into-every-frame.
            WebView.CoreWebView2.FrameCreated += (_, args) =>
            {
                try
                {
                    args.Frame.AddHostObjectToScript("androidStation", _bridge, new[] { "*" });
                }
                catch
                {
                    // older runtime without frame host objects — top-frame path still works
                }
            };

            await WebView.CoreWebView2.AddScriptToExecuteOnDocumentCreatedAsync(BridgeShimScript);

            WebView.CoreWebView2.NavigationCompleted += async (_, e) =>
            {
                if (!e.IsSuccess) return;
                await InjectDeliverScanHelperAsync();
            };

            WebView.Source = new Uri(ShowrunnerUrl);
            _rfid.Start();
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
        });
    }

    private void DeliverScanToPage(string epc, string tid)
    {
        if (WebView.CoreWebView2 == null) return;
        var payload = JsonSerializer.Serialize(new { tag = epc, tid });
        var js = $"(function(){{try{{var d={payload};" +
                 "if(window.showrunnerStationDeliverScan)window.showrunnerStationDeliverScan(d.tag,d.tid);" +
                 "}catch(e){{}}}})();";
        try
        {
            _ = WebView.CoreWebView2.ExecuteScriptAsync(js);
        }
        catch
        {
            // ignore
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
          window.__srDesktopBridge = true;
          window.AndroidStation = {
            getConfig: function() { var h = host(); return h ? h.getConfig() : '{}'; },
            setPower: function(p) { var h = host(); if (h) h.setPower(p); },
            setScanMode: function(m) { var h = host(); if (h) h.setScanMode(m); },
            setBeep: function(b) { var h = host(); if (h) h.setBeep(b); },
            setPollMs: function(ms) { var h = host(); if (h) h.setPollMs(ms); },
            pollScans: function() { var h = host(); return h ? h.pollScans() : '[]'; },
            reconnectGun: function() { var h = host(); if (h) h.reconnectGun(); },
            sleepGun: function() { var h = host(); if (h) h.sleepGun(); },
            shellReady: function() { var h = host(); if (h) h.shellReady(); },
            loginNeeded: function() { var h = host(); if (h) h.loginNeeded(); },
            saveSession: function(t, e) { var h = host(); if (h) h.saveSession(t, e); },
            getSavedSession: function() { var h = host(); return h ? h.getSavedSession() : ''; }
          };
        })();
        """;
}
