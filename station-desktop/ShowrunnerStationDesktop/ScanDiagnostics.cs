using System.Collections.Concurrent;
using System.IO;
using System.Text;

namespace Showrunner.Station.Desktop;

/// <summary>Ring-buffer log for RFID scan delivery debugging — also appends to a local file.</summary>
public static class ScanDiagnostics
{
    private const int MaxLines = 400;
    private static readonly ConcurrentQueue<string> _lines = new();
    private static readonly object _fileLock = new();
    private static readonly string LogPath = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "ShowrunnerStation",
        "scan-diag.log");

    public static event Action<string>? LineAdded;

    public static void Log(string category, string message)
    {
        var line = DateTime.Now.ToString("HH:mm:ss.fff") + " [" + category + "] " + message;
        _lines.Enqueue(line);
        while (_lines.Count > MaxLines && _lines.TryDequeue(out _)) { }

        _ = Task.Run(() =>
        {
            try
            {
                var dir = Path.GetDirectoryName(LogPath);
                if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir))
                    Directory.CreateDirectory(dir);
                lock (_fileLock)
                    File.AppendAllText(LogPath, line + Environment.NewLine, Encoding.UTF8);
            }
            catch
            {
                // ignore file errors
            }
        });

        try
        {
            LineAdded?.Invoke(line);
        }
        catch
        {
            // ignore broken UI handlers
        }
    }

    public static string[] Snapshot() => _lines.ToArray();

    public static string LogFilePath => LogPath;

    public static void Clear()
    {
        while (_lines.TryDequeue(out _)) { }
        Log("DIAG", "Log cleared");
    }
}
