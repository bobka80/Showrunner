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
    private readonly Action<Action> _runOnUi;

    public StationBridge(TslRfidManager rfid, Action onShellReady, Action<Action> runOnUi)
    {
        _rfid = rfid;
        _onShellReady = onShellReady;
        _runOnUi = runOnUi;
    }

    private void Ui(Action action)
    {
        try { _runOnUi(action); }
        catch { action(); }
    }

    public string getConfig() => _rfid.CurrentConfigJson();

    public void setPower(int power) => Ui(() => _rfid.SetPowerLevel(power));

    public void setScanMode(string mode) => Ui(() => _rfid.SetScanMode(mode));

    public void setBeep(bool enabled) => Ui(() => _rfid.SetBeepEnabled(enabled));

    public void setPollMs(int ms) => Ui(() => _rfid.SetPollMs(ms));

    public string pollScans() => _rfid.DrainPendingScans();

    public void reconnectGun() => Ui(() => _rfid.ForceReconnect());

    public void sleepGun() => Ui(() => _rfid.SleepAndDisconnect());

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
}
