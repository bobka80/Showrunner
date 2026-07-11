using System.IO;
using System.Text.Json;

namespace Showrunner.Station.Desktop;

public sealed class DesktopPrefsData
{
    public string ComPort { get; set; } = "";
    /// <summary>Win32 PnP DeviceID of the last COM port that answered a TSL version probe.</summary>
    public string LastGunDeviceId { get; set; } = "";
    public int PowerDbm { get; set; } = 29;
    public bool Beep { get; set; } = true;
    public string ScanMode { get; set; } = TslRfidManager.ScanModeSingle;
    public int PollMs { get; set; } = 500;
    public string? SessionToken { get; set; }
    public long SessionExpires { get; set; }
}

public static class DesktopPrefs
{
    private static readonly string Path = System.IO.Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "ShowrunnerStation",
        "desktop-prefs.json");

    public static DesktopPrefsData Load()
    {
        try
        {
            if (!File.Exists(Path)) return new DesktopPrefsData();
            var json = File.ReadAllText(Path);
            return JsonSerializer.Deserialize<DesktopPrefsData>(json) ?? new DesktopPrefsData();
        }
        catch
        {
            return new DesktopPrefsData();
        }
    }

    public static void Save(DesktopPrefsData data)
    {
        try
        {
            var dir = System.IO.Path.GetDirectoryName(Path);
            if (!string.IsNullOrEmpty(dir))
                Directory.CreateDirectory(dir);
            File.WriteAllText(Path, JsonSerializer.Serialize(data, new JsonSerializerOptions { WriteIndented = true }));
        }
        catch
        {
            // ignore
        }
    }

    public static void SavePartial(Action<DesktopPrefsData> mutate)
    {
        var data = Load();
        mutate(data);
        Save(data);
    }
}
