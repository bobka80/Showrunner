using System.IO;
using System.Text;

namespace Showrunner.Station.Desktop;

/// <summary>
/// Persistent connect/read-gate audit — survives app restarts. Use when diagnosing
/// "gun won't connect" vs "connected then dropped".
/// </summary>
public static class ConnectLockLog
{
    private static readonly object FileLock = new();
    private static readonly string LogPath = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "ShowrunnerStation",
        "connect-lock.log");

    public static string LogFilePath => LogPath;

    public static void Record(string phase, string port, bool? ok, int readGate, string detail)
    {
        var line = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff")
                   + " | " + phase
                   + " | port=" + (string.IsNullOrWhiteSpace(port) ? "-" : port)
                   + " | ok=" + (ok.HasValue ? (ok.Value ? "YES" : "NO") : "-")
                   + " | readGate=" + readGate
                   + " | " + detail;

        ScanDiagnostics.Log("CONN", detail.Length > 120 ? detail[..120] : detail);

        _ = Task.Run(() =>
        {
            try
            {
                var dir = Path.GetDirectoryName(LogPath);
                if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir))
                    Directory.CreateDirectory(dir);
                lock (FileLock)
                    File.AppendAllText(LogPath, line + Environment.NewLine, Encoding.UTF8);
            }
            catch
            {
                // ignore
            }
        });
    }
}
