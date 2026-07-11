using System.Management;
using System.Text.RegularExpressions;

namespace Showrunner.Station.Desktop;

/// <summary>
/// Lists COM port candidates for the TSL 1128. Windows creates paired incoming + outgoing
/// Bluetooth SPP ports; the actual TSL reader is confirmed later via a version probe in
/// <see cref="TslRfidManager"/> — not by opening the first matching name.
/// </summary>
public static class GunPortDetector
{
    private static readonly Regex ComInName = new(@"\((COM\d+)\)", RegexOptions.Compiled);
    private static readonly Regex BtRemoteAddress = new(
        @"&([0-9A-F]{12})_",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static readonly string[] TslPidMarkers = { "PID&1128", "PID_1128" };
    private const string BtSppService = "00001101-0000-1000-8000-00805F9B34FB";

    public sealed record GunPort(string ComPort, string FriendlyName, string DeviceId)
    {
        public string RemoteAddress => ParseRemoteAddress(DeviceId);
        public bool IsTslPid => GunPortDetector.LooksLikeTsl(DeviceId);
        public bool IsBluetooth => DeviceId.Contains("BTHENUM", StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>Probe-order list: last-known device, TSL PID, then other outgoing BT SPP / USB TSL.</summary>
    public static IReadOnlyList<GunPort> Detect(string? preferDeviceId = null)
    {
        var all = ScanComPorts();
        var candidates = all.Where(IsConnectCandidate).ToList();
        return OrderCandidates(candidates, preferDeviceId);
    }

    public static string? DetectPort(string? preferDeviceId = null) =>
        Detect(preferDeviceId).FirstOrDefault()?.ComPort;

    internal static string ParseRemoteAddress(string deviceId)
    {
        if (string.IsNullOrEmpty(deviceId)) return "";
        var matches = BtRemoteAddress.Matches(deviceId);
        return matches.Count == 0 ? "" : matches[^1].Groups[1].Value.ToUpperInvariant();
    }

    private static List<GunPort> ScanComPorts()
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
                var m = ComInName.Match(name);
                if (!m.Success) continue;
                found.Add(new GunPort(m.Groups[1].Value, name, deviceId));
            }
        }
        catch
        {
            // WMI unavailable — manual ComPort override in prefs still works.
        }
        return found;
    }

    private static bool IsConnectCandidate(GunPort port)
    {
        if (LooksLikeTsl(port.DeviceId) && !port.IsBluetooth)
            return true;
        if (!IsBluetoothSerialPort(port.FriendlyName, port.DeviceId))
            return false;
        return IsOutgoingBluetoothPort(port.DeviceId);
    }

    private static IReadOnlyList<GunPort> OrderCandidates(List<GunPort> ports, string? preferDeviceId)
    {
        var prefer = (preferDeviceId ?? "").Trim();
        return ports
            .OrderByDescending(p => !string.IsNullOrEmpty(prefer) &&
                                    p.DeviceId.Equals(prefer, StringComparison.OrdinalIgnoreCase))
            .ThenByDescending(p => p.IsTslPid)
            .ThenByDescending(p => p.FriendlyName.Contains("Standard Serial over Bluetooth", StringComparison.OrdinalIgnoreCase))
            .ThenByDescending(p => ComNumber(p.ComPort))
            .ThenBy(p => p.ComPort, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static int ComNumber(string comPort)
    {
        if (comPort.Length > 3 && int.TryParse(comPort[3..], out var n))
            return n;
        return 0;
    }

    internal static bool LooksLikeTsl(string deviceId)
    {
        if (string.IsNullOrEmpty(deviceId)) return false;
        foreach (var marker in TslPidMarkers)
            if (deviceId.Contains(marker, StringComparison.OrdinalIgnoreCase))
                return true;
        return false;
    }

    private static bool IsBluetoothSerialPort(string friendlyName, string deviceId)
    {
        if (deviceId.Contains("BTHENUM", StringComparison.OrdinalIgnoreCase))
        {
            if (deviceId.Contains(BtSppService, StringComparison.OrdinalIgnoreCase))
                return true;
            return friendlyName.Contains("Bluetooth", StringComparison.OrdinalIgnoreCase);
        }
        return friendlyName.Contains("Standard Serial over Bluetooth", StringComparison.OrdinalIgnoreCase);
    }

    internal static bool IsOutgoingBluetoothPort(string deviceId)
    {
        if (string.IsNullOrEmpty(deviceId)) return true;
        if (!deviceId.Contains("BTHENUM", StringComparison.OrdinalIgnoreCase))
            return true;

        var remote = ParseRemoteAddress(deviceId);
        if (string.IsNullOrEmpty(remote)) return true;
        return !remote.Equals("000000000000", StringComparison.OrdinalIgnoreCase);
    }
}
