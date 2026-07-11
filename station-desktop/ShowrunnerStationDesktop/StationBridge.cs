using System.Runtime.InteropServices;
using System.Text.Json;

namespace Showrunner.Station.Desktop;

/// <summary>
/// WebView2 host object — same surface as Android <c>AndroidStation</c> so the station shell needs no fork.
/// </summary>
[ComVisible(true)]
[ClassInterface(ClassInterfaceType.AutoDual)]
public sealed class StationBridge
{
    private readonly TslRfidManager _rfid;
    private readonly Action _onShellReady;

    public StationBridge(TslRfidManager rfid, Action onShellReady)
    {
        _rfid = rfid;
        _onShellReady = onShellReady;
    }

    public string getConfig() => _rfid.CurrentConfigJson();

    public void setPower(int power)
    {
        ScanDiagnostics.Log("BRIDGE", "setPower(" + power + ")");
        _rfid.SetPowerLevel(power);
    }

    public void setScanMode(string mode)
    {
        ScanDiagnostics.Log("BRIDGE", "setScanMode(" + mode + ")");
        _rfid.SetScanMode(mode);
    }

    public void setBeep(bool enabled)
    {
        ScanDiagnostics.Log("BRIDGE", "setBeep(" + enabled + ")");
        _rfid.SetBeepEnabled(enabled);
    }

    public void setPollMs(int ms)
    {
        ScanDiagnostics.Log("BRIDGE", "setPollMs(" + ms + ")");
        _rfid.SetPollMs(ms);
    }

    public string pollScans()
    {
        var raw = _rfid.DrainPendingScans();
        if (!string.IsNullOrWhiteSpace(raw) && raw != "[]")
            ScanDiagnostics.Log("POLL", "iframe pollScans drained: " + raw);
        return raw;
    }

    public void reconnectGun() => _rfid.ForceReconnect();

    public void sleepGun() => _rfid.SleepAndDisconnect();

    public void shellReady() => _onShellReady();

    public void loginNeeded() => _onShellReady();

    public void saveSession(string? token, long expiresAt)
    {
        var t = (token ?? "").Trim();
        if (t.Length < 20)
        {
            DesktopPrefs.SavePartial(p =>
            {
                p.SessionToken = null;
                p.SessionExpires = 0;
            });
            return;
        }
        DesktopPrefs.SavePartial(p =>
        {
            p.SessionToken = t;
            p.SessionExpires = expiresAt;
        });
    }

    public string getSavedSession()
    {
        var prefs = DesktopPrefs.Load();
        var token = (prefs.SessionToken ?? "").Trim();
        if (token.Length < 20 || prefs.SessionExpires <= DateTimeOffset.UtcNow.ToUnixTimeMilliseconds())
            return "";
        return JsonSerializer.Serialize(new { token, expiresAt = prefs.SessionExpires });
    }

    public void exitApp()
    {
        System.Windows.Application.Current?.Dispatcher.Invoke(() =>
        {
            System.Windows.Application.Current.Shutdown(0);
        });
    }
}
