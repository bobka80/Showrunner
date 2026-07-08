using System.Management;
using System.Text.RegularExpressions;

namespace Showrunner.Station.Desktop;

/// <summary>
/// Finds the TSL 1128's outgoing Bluetooth COM port by its USB/BT product id (PID_1128),
/// so the shell auto-connects like the ASCII Protocol Explorer — no manual COM config.
/// </summary>
public static class GunPortDetector
{
    // TSL readers advertise PID 1128 (1128 handheld) over the SPP DeviceID.
    private static readonly Regex ComInName = new(@"\((COM\d+)\)", RegexOptions.Compiled);
    private static readonly string[] TslPidMarkers = { "PID&1128", "PID_1128", "&1128" };

    public sealed record GunPort(string ComPort, string FriendlyName, string DeviceId);

    /// <summary>Returns detected TSL gun ports, best (SPP link) first. Empty if none paired/awake.</summary>
    public static IReadOnlyList<GunPort> Detect()
    {
        var found = new List<GunPort>();
        try
        {
            using var searcher = new ManagementObjectSearcher(
                "SELECT Name, DeviceID FROM Win32_PnPEntity WHERE Name LIKE '%(COM%'");
            foreach (var obj in searcher.Get())
            {
                var name = (obj["Name"] as string) ?? "";
                var deviceId = (obj["DeviceID"] as string) ?? "";
                if (!LooksLikeTsl(deviceId)) continue;

                var m = ComInName.Match(name);
                if (!m.Success) continue;
                found.Add(new GunPort(m.Groups[1].Value, name, deviceId));
            }
        }
        catch
        {
            // WMI unavailable — caller falls back to manual/guess.
        }

        // Prefer the "Standard Serial over Bluetooth link" SPP port for outgoing traffic.
        return found
            .OrderByDescending(p => p.FriendlyName.Contains("Bluetooth", StringComparison.OrdinalIgnoreCase))
            .ThenBy(p => p.ComPort, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    public static string? DetectPort() => Detect().FirstOrDefault()?.ComPort;

    private static bool LooksLikeTsl(string deviceId)
    {
        if (string.IsNullOrEmpty(deviceId)) return false;
        foreach (var marker in TslPidMarkers)
            if (deviceId.Contains(marker, StringComparison.OrdinalIgnoreCase))
                return true;
        return false;
    }
}
