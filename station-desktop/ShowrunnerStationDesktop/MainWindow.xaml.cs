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
    private CoreWebView2Frame? _gasFrame;
    private readonly object _frameLock = new();
    private StationBridge? _bridge;
    private bool _splashHidden;
    private bool _shellReady;
    private DiagnosticWindow? _diagWindow;
    private System.Threading.Timer? _gunPushTimer;
    private string _lastWebDeliverNorm = "";
    private long _lastWebDeliverMs;
    private const int WebDeliverDedupeMs = 1500;

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
                _rfid.ClearPendingScans();
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

    private static string BuildSessionSeedScript()
    {
        var prefs = DesktopPrefs.Load();
        var token = (prefs.SessionToken ?? "").Trim();
        if (token.Length < 20 || prefs.SessionExpires <= DateTimeOffset.UtcNow.ToUnixTimeMilliseconds())
            return "(function(){})();";
        var tokenJson = JsonSerializer.Serialize(token);
        var exp = prefs.SessionExpires;
        return "(function(){try{var t=" + tokenJson + ",exp=" + exp + ";" +
               "if(!t||exp<=Date.now())return;" +
               "if(!localStorage.getItem('sm_session_token')){" +
               "localStorage.setItem('sm_session_token',t);" +
               "localStorage.setItem('sm_session_expires',String(exp));}" +
               "}catch(e){}})();";
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
                    lock (_frameLock)
                    {
                        _childFrames.Remove(child);
                        if (_gasFrame == child) _gasFrame = null;
                    }
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
                    try
                    {
                        var hrefRaw = await child.ExecuteScriptAsync("JSON.stringify(String(location.href||''))");
                        var href = UnwrapScriptResult(hrefRaw) ?? "";
                        if (href.Contains("script.google.com", StringComparison.OrdinalIgnoreCase))
                        {
                            lock (_frameLock) _gasFrame = child;
                            ScanDiagnostics.Log("WEB", "GAS frame tracked " + Trunc(href, 96));
                            _ = SyncIframeSessionToParentAsync(child);
                        }
                    }
                    catch
                    {
                        // ignore href probe failures
                    }
                };
            };

            await WebView.CoreWebView2.AddScriptToExecuteOnDocumentCreatedAsync(BuildSessionSeedScript());
            await WebView.CoreWebView2.AddScriptToExecuteOnDocumentCreatedAsync(BridgeShimScript);

            WebView.CoreWebView2.NavigationCompleted += async (_, e) =>
            {
                if (!e.IsSuccess) return;
                await InjectDeliverScanHelperAsync();
                ScheduleDesktopSessionBootChecks();
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
            }
            catch
            {
                // ignore
            }
        });
    }

    private static string BuildFrameScanProbeJs() =>
        "(function(){try{" +
        "var info={href:String(location.href||'').substring(0,72),isStation:!!window.IS_STATION_DEVICE," +
        "hasOnScan:typeof window.onStationRfidScan,hasFeed:typeof window.stationPushScanFeed_,bridge:!!window.__srDesktopBridge," +
        "shellReady:!!(window.onStationRfidScan&&window.onStationRfidScan.__srDesktopShim!==true&&window.onStationRfidScan.__srEarlyBoot!==true)};" +
        "info.recent=(window.stationRecentScans||[]).length;info.q=(window.__srScanQueue||[]).length;" +
        "info.feedRows=(function(){var s=document.getElementById('station-shell');var l=s?s.querySelector('#station-scan-feed-list'):document.getElementById('station-scan-feed-list');return l&&l.children?l.children.length:0;})();" +
        "info.hasFeedList=!!(function(){var s=document.getElementById('station-shell');return s?s.querySelector('#station-scan-feed-list'):document.getElementById('station-scan-feed-list');})();info.onLogin=!!document.getElementById('login-form');" +
        "info.hasStationShell=!!document.getElementById('station-shell');" +
        "return JSON.stringify(info);}catch(e){return JSON.stringify({err:String(e.message||e)});}})()";

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
                    HideSplash();
                    _ = ConfirmShellReadyAsync();
                    break;
                case "loginNeeded":
                    _shellReady = false;
                    HideSplash();
                    break;
                case "saveSession":
                    if (payload.ValueKind == JsonValueKind.Array && payload.GetArrayLength() >= 2)
                    {
                        var token = payload[0].GetString();
                        var exp = payload[1].TryGetInt64(out var e) ? e : 0L;
                        _bridge?.saveSession(token, exp);
                        ScanDiagnostics.Log("WEB", "Session saved to desktop prefs (expires " + exp + ")");
                        ScheduleDesktopSessionBootChecks();
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
        if (!_shellReady)
        {
            Task.Delay(800).ContinueWith(_ =>
                Dispatcher.BeginInvoke(() => _ = DeliverScanToPageCoreAsync(epc, tid, "retry@800ms")));
        }
    }

    private bool ShouldDeliverScanToWeb(string epc, string tid, string pass)
    {
        var norm = epc.Trim().ToUpperInvariant();
        var now = Environment.TickCount64;
        if (norm.Length > 0 && norm == _lastWebDeliverNorm && now - _lastWebDeliverMs < WebDeliverDedupeMs)
        {
            ScanDiagnostics.Log("WEB", pass + ": deduped EPC=" + norm);
            return false;
        }
        _lastWebDeliverNorm = norm;
        _lastWebDeliverMs = now;
        return true;
    }

    private void ScheduleDesktopSessionBootChecks()
    {
        foreach (var delayMs in new[] { 600, 2000, 5000 })
        {
            Task.Delay(delayMs).ContinueWith(_ =>
                Dispatcher.BeginInvoke(() => _ = EnsureDesktopSessionBootAsync()));
        }
    }

    private async Task EnsureDesktopSessionBootAsync()
    {
        if (WebView.CoreWebView2 == null) return;
        CoreWebView2Frame? gasFrame;
        lock (_frameLock)
            gasFrame = _gasFrame ?? (_childFrames.Count > 0 ? _childFrames[^1] : null);
        if (gasFrame != null)
            await SyncIframeSessionToParentAsync(gasFrame);
        await SeedParentSessionFromDesktopPrefsAsync();

        const string js = """
            (function(){try{
              var f=document.getElementById('app-frame');
              if(!f)return JSON.stringify({skip:'no-frame'});
              var src=String(f.src||'');
              if(src.indexOf('sessionboot')>=0)return JSON.stringify({skip:'sessionboot'});
              var token=localStorage.getItem('sm_session_token')||'';
              var exp=parseInt(localStorage.getItem('sm_session_expires')||'0',10);
              if(!token||token.length<20||!exp||exp<=Date.now())return JSON.stringify({skip:'no-session'});
              var m=src.match(/script\.google\.com\/macros\/s\/[^/]+\/exec/);
              var base=m?('https://'+m[0]):'';
              if(!base)return JSON.stringify({skip:'no-base'});
              f.src=base+'?action=sessionboot&token='+encodeURIComponent(token);
              return JSON.stringify({boot:true});
            }catch(e){return JSON.stringify({err:String(e.message||e)});}})()
            """;
        try
        {
            var raw = await WebView.CoreWebView2.ExecuteScriptAsync(js);
            var result = Trunc(UnwrapScriptResult(raw), 120);
            ScanDiagnostics.Log("WEB", "sessionboot check: " + result);
            if (result.Contains("\"skip\":\"no-session\""))
                ShowStatus("Station login required — enter gate PC name + passcode on screen", persistent: true);
        }
        catch
        {
            // ignore
        }
    }

    private static string BuildInvokeScanJs(string epc, string tid) =>
        "(function(){try{var t=" + JsonSerializer.Serialize(epc) + ",i=" + JsonSerializer.Serialize(tid ?? "") + ";" +
        "if(typeof window.onStationRfidScan==='function'){window.onStationRfidScan(t,i);}" +
        "var p=document.getElementById('station-scan-panel');" +
        "if(p&&!p.classList.contains('is-open')&&typeof stationToggleScanPanel==='function'){try{stationToggleScanPanel();}catch(x){}}" +
        "return typeof window.onStationRfidScan==='function'?'ok':'no-handler';" +
        "}catch(e){return 'err:'+String(e.message||e);}})()";

    private async Task ConfirmShellReadyAsync()
    {
        await Task.Delay(250);
        if (await ProbeGasFrameShellReadyAsync())
        {
            _shellReady = true;
            await DrainPendingScansOnGasFrameAsync();
        }
    }

    private async Task<bool> ProbeGasFrameShellReadyAsync()
    {
        CoreWebView2Frame? frame;
        lock (_frameLock)
            frame = _gasFrame ?? (_childFrames.Count > 0 ? _childFrames[^1] : null);
        if (frame == null) return false;
        try
        {
            var raw = await frame.ExecuteScriptAsync(BuildFrameScanProbeJs());
            var probe = UnwrapScriptResult(raw) ?? "";
            return probe.Contains("\"shellReady\":true", StringComparison.Ordinal);
        }
        catch
        {
            return false;
        }
    }

    private async Task SyncIframeSessionToParentAsync(CoreWebView2Frame frame)
    {
        const string js = """
            (function(){try{
              var t=localStorage.getItem('sm_session_token')||'';
              var exp=parseInt(localStorage.getItem('sm_session_expires')||'0',10);
              if(!t||t.length<20||!exp||exp<=Date.now())return JSON.stringify({skip:'no-iframe-session'});
              var crew=localStorage.getItem('sm_crew_name')||'';
              var meta=document.querySelector('meta[name="user-name"]');
              if(meta&&meta.content)crew=String(meta.content).trim()||crew;
              if(window.AndroidStation&&typeof AndroidStation.saveSession==='function')
                AndroidStation.saveSession(t,exp);
              if(window.parent&&window.parent!==window)
                window.parent.postMessage({type:'SHOWRUNNER_SESSION_TOKEN',token:t,crewName:crew,expiresAt:exp},'*');
              return JSON.stringify({sync:true,crew:String(crew||'').substring(0,24)});
            }catch(e){return JSON.stringify({err:String(e.message||e)});}})()
            """;
        try
        {
            var raw = await frame.ExecuteScriptAsync(js);
            var result = Trunc(UnwrapScriptResult(raw), 80);
            if (result.Contains("\"sync\":true"))
                ScanDiagnostics.Log("WEB", "iframe session sync: " + result);
        }
        catch
        {
            // ignore
        }
    }

    private async Task SeedParentSessionFromDesktopPrefsAsync()
    {
        if (WebView.CoreWebView2 == null) return;
        var prefs = DesktopPrefs.Load();
        var token = (prefs.SessionToken ?? "").Trim();
        if (token.Length < 20 || prefs.SessionExpires <= DateTimeOffset.UtcNow.ToUnixTimeMilliseconds())
            return;
        var tokenJson = JsonSerializer.Serialize(token);
        var exp = prefs.SessionExpires;
        var js = "(function(){try{var t=" + tokenJson + ",exp=" + exp + ";" +
                 "if(!t||exp<=Date.now())return;" +
                 "localStorage.setItem('sm_session_token',t);" +
                 "localStorage.setItem('sm_session_expires',String(exp));" +
                 "}catch(e){}})();";
        try
        {
            await WebView.CoreWebView2.ExecuteScriptAsync(js);
        }
        catch
        {
            // ignore
        }
    }

    private async Task DeliverScanToPageCoreAsync(string epc, string tid, string pass)
    {
        if (WebView.CoreWebView2 == null) return;
        if (!ShouldDeliverScanToWeb(epc, tid, pass)) return;

        var invoke = await InvokeScanOnGasFrameAsync(epc, tid);
        ScanDiagnostics.Log("WEB", pass + ": GAS invoke=" + (invoke ?? "no-frame"));
        if (invoke != "ok")
            RelayScanToTopHosting(epc, tid);

        if (pass == "immediate")
            await ProbeGasFrameAsync(pass);
    }

    private async Task<string?> InvokeScanOnGasFrameAsync(string epc, string tid)
    {
        CoreWebView2Frame? frame;
        lock (_frameLock)
            frame = _gasFrame ?? (_childFrames.Count > 0 ? _childFrames[^1] : null);
        if (frame == null) return null;
        try
        {
            var raw = await frame.ExecuteScriptAsync(BuildInvokeScanJs(epc, tid));
            return UnwrapScriptResult(raw);
        }
        catch (Exception ex)
        {
            return "err:" + ex.Message;
        }
    }

    private async Task DrainPendingScansOnGasFrameAsync()
    {
        CoreWebView2Frame? frame;
        lock (_frameLock)
            frame = _gasFrame ?? (_childFrames.Count > 0 ? _childFrames[^1] : null);
        if (frame == null) return;
        const string js =
            "(function(){try{if(typeof stationDrainPendingRfidScans_==='function'){stationDrainPendingRfidScans_();return 'drained';}return 'no-drain';}catch(e){return 'err';}})()";
        try
        {
            var raw = await frame.ExecuteScriptAsync(js);
            ScanDiagnostics.Log("WEB", "Pending scan drain: " + Trunc(UnwrapScriptResult(raw), 40));
        }
        catch
        {
            // ignore
        }
    }

    private async Task ProbeGasFrameAsync(string pass)
    {
        var js = BuildFrameScanProbeJs();
        CoreWebView2Frame? frame;
        lock (_frameLock)
            frame = _gasFrame ?? (_childFrames.Count > 0 ? _childFrames[^1] : null);
        if (frame == null)
        {
            ScanDiagnostics.Log("WEB", pass + ": no GAS frame for probe");
            return;
        }
        try
        {
            var raw = await frame.ExecuteScriptAsync(js);
            var probe = Trunc(UnwrapScriptResult(raw), 240);
            ScanDiagnostics.Log("WEB", pass + ": GAS " + probe);
            if (probe.Contains("\"onLogin\":true"))
                ShowStatus("Station device login required — enter gate PC name + passcode on screen", persistent: true);
            else if (probe.Contains("\"shellReady\":false") && probe.Contains("\"hasStationShell\":true"))
                ShowStatus("Station loading… wait for profile, then scan crew badge", persistent: false);
        }
        catch (Exception ex)
        {
            ScanDiagnostics.Log("WEB", pass + ": GAS probe ERR " + ex.Message);
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
          window.__srScanQueue = window.__srScanQueue || [];
          window.__srGunConfigJson = window.__srGunConfigJson || '{"connected":false,"linkState":"disconnected"}';
          window.__srPendingRfidScans = window.__srPendingRfidScans || [];

          function __srShimEsc(v) {
            return String(v == null ? '' : v).replace(/[<&>]/g, function(c) {
              return c === '<' ? '&lt;' : (c === '>' ? '&gt;' : '&amp;');
            });
          }
          function __srNormEpc_(tag) {
            return String(tag || '').toUpperCase().replace(/[^A-F0-9]/g, '');
          }
          function __srDedupeScan_(tag, tid) {
            var norm = __srNormEpc_(tag);
            if (!norm) return true;
            var now = Date.now();
            var priorTid = String(window.__srLastInjectTid || '').trim();
            if (norm === window.__srLastInjectNorm && (now - (window.__srLastInjectAt || 0)) < 1500) {
              if (priorTid || !tid) return true;
            }
            window.__srLastInjectNorm = norm;
            window.__srLastInjectAt = now;
            if (tid) window.__srLastInjectTid = String(tid);
            return false;
          }
          function __srHideFloatFeed_() {
            var f = document.getElementById('sr-desktop-scan-feed');
            if (f) f.style.display = 'none';
          }
          function __srEnsureFeedList_() {
            var shell = document.getElementById('station-shell');
            var list = shell ? shell.querySelector('#station-scan-feed-list') : document.getElementById('station-scan-feed-list');
            if (list) {
              __srHideFloatFeed_();
              return list;
            }
            if (!/ShowrunnerStation/i.test(navigator.userAgent || '')) return null;
            var host = document.getElementById('station-scan-feed');
            if (host) {
              list = document.createElement('div');
              list.id = 'station-scan-feed-list';
              list.className = 'station-scan-feed__list';
              host.appendChild(list);
              __srHideFloatFeed_();
              return list;
            }
            if (document.getElementById('station-shell')) return null;
            var panel = document.getElementById('sr-desktop-scan-feed');
            if (!panel) {
              panel = document.createElement('div');
              panel.id = 'sr-desktop-scan-feed';
              panel.setAttribute('aria-label', 'Live RFID scans');
              panel.style.cssText = 'position:fixed;bottom:12px;left:12px;right:12px;max-height:140px;overflow:auto;z-index:2147483646;background:#18181b;border:1px solid #3f3f46;border-radius:8px;padding:8px;font:12px Inter,system-ui,sans-serif;color:#f4f4f5;';
              panel.innerHTML = '<div style="font-weight:800;margin-bottom:6px;color:#10b981;">Live RFID scans (login to use station UI)</div><div id="sr-desktop-scan-feed-list" class="station-scan-feed__list"></div>';
              (document.body || document.documentElement).appendChild(panel);
            }
            return document.getElementById('sr-desktop-scan-feed-list');
          }
          function __srShimPushFeed(tag, tid) {
            if (typeof window.stationPushScanFeed_ === 'function' && window.stationPushScanFeed_.__srShim !== true) {
              __srHideFloatFeed_();
              window.stationPushScanFeed_(tag, tid);
              return;
            }
            if (__srDedupeScan_(tag, tid)) return;
            var t = String(tag || ''), i = String(tid || '');
            window.stationRecentScans = window.stationRecentScans || [];
            window.stationRecentScans.unshift({ tag: t, norm: __srNormEpc_(t), tid: i, ts: Date.now() });
            while (window.stationRecentScans.length > 24) window.stationRecentScans.pop();
            if (typeof window.stationRenderScanFeed_ === 'function') {
              try { window.stationRenderScanFeed_(); __srHideFloatFeed_(); return; } catch (e) {}
            }
            var list = shell ? shell.querySelector('#station-scan-feed-list') : document.getElementById('station-scan-feed-list');
            if (list && document.getElementById('station-shell')) {
              __srHideFloatFeed_();
              var rows = window.stationRecentScans.map(function(s) {
                return '<div class="station-scan-feed__row is-unknown" title="' + __srShimEsc(s.tag) + '">'
                  + '<span class="name">' + __srShimEsc(s.tag) + '</span><span class="time">now</span></div>';
              });
              list.innerHTML = rows.join('');
              return;
            }
            list = __srEnsureFeedList_();
            if (!list) return;
            var empty = list.querySelector('.station-scan-feed__empty');
            if (empty) empty.remove();
            var row = document.createElement('div');
            row.className = 'station-scan-feed__row is-unknown';
            row.title = String(tag || '');
            row.innerHTML = '<span class="name">' + __srShimEsc(tag) + '</span><span class="time">now</span>';
            list.insertBefore(row, list.firstChild);
            while (list.children.length > 24) list.removeChild(list.lastChild);
          }
          if (typeof window.stationPushScanFeed_ !== 'function' || window.stationPushScanFeed_.__srShim === true) {
            window.stationPushScanFeed_ = function(tag, tid) { __srShimPushFeed(tag, tid); };
            window.stationPushScanFeed_.__srShim = true;
          }
          if (/ShowrunnerStation/i.test(navigator.userAgent || '')) {
            window.IS_STATION_DEVICE = true;
            try { document.documentElement.classList.add('station-device-root'); } catch (e) {}
            var shell = document.getElementById('station-shell');
            if (shell) shell.style.display = 'flex';
          }
          if (typeof window.onStationRfidScan !== 'function' || window.onStationRfidScan.__srDesktopShim === true ||
              window.onStationRfidScan.__srEarlyBoot === true) {
            window.onStationRfidScan = function(tag, tid) {
              var t = String(tag || ''), i = String(tid || '');
              __srShimPushFeed(t, i);
              window.__srPendingRfidScans.push({ tag: t, tid: i, ts: Date.now() });
            };
            window.onStationRfidScan.__srDesktopShim = true;
          }
          if (!window.__srShimMessageBound) {
            window.__srShimMessageBound = true;
            window.__srShimMessageHandler = function(ev) {
              var d = ev && ev.data;
              if (d && d.type === 'SHOWRUNNER_RFID_SCAN' && typeof window.onStationRfidScan === 'function') {
                window.onStationRfidScan(d.tag, d.tid || '');
              }
            };
            window.addEventListener('message', window.__srShimMessageHandler);
          }
          window.__srInjectScan = function(tag, tid) {
            var t = String(tag || ''), i = String(tid || '');
            if (!t || __srDedupeScan_(t, i)) return;
            window.__srScanQueue.push({ epc: t, tag: t, tid: i });
            while (window.__srScanQueue.length > 32) window.__srScanQueue.shift();
            if (typeof window.onStationRfidScan === 'function') window.onStationRfidScan(t, i);
            else __srShimPushFeed(t, i);
          };
          if (!window.__srScanDrainTimer) {
            window.__srScanDrainTimer = setInterval(function() {
              var p = window.__srPendingRfidScans;
              if (p && p.length && typeof window.onStationRfidScan === 'function' &&
                  typeof window.stationPushScanFeed_ === 'function' &&
                  window.stationPushScanFeed_.__srShim !== true &&
                  window.onStationRfidScan.__srDesktopShim !== true) {
                var batch = p.splice(0, p.length);
                for (var pi = 0; pi < batch.length; pi++) {
                  window.onStationRfidScan(batch[pi].tag, batch[pi].tid || '');
                }
              }
            }, 300);
          }
          if (!window.__srWebViewBridgeBound) {
            window.__srWebViewBridgeBound = true;
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
                    if (epc) window.__srInjectScan(epc, tid);
                  }
                  if (d.type === 'SR_GUN_SCANS' && d.scansRaw) {
                    var batch = JSON.parse(d.scansRaw);
                    if (batch && batch.length) {
                      for (var si = 0; si < batch.length; si++) {
                        var it = batch[si];
                        var se = (it && (it.epc || it.tag)) || '';
                        var st = (it && it.tid) || '';
                        if (se) window.__srInjectScan(se, st);
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
          }
          window.__srDesktopBridge = true;
        })();
        """;
}
