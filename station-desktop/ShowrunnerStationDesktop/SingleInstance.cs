using System.Diagnostics;
using System.Windows;

namespace Showrunner.Station.Desktop;

/// <summary>Only one station shell — a second launch steals COM3 and freezes both copies.</summary>
internal static class SingleInstance
{
    private const string MutexName = "ShowrunnerStationDesktop.SingleInstance";
    private static Mutex? _mutex;

    public static bool TryAcquire()
    {
        try
        {
            _mutex = new Mutex(true, MutexName, out var created);
            if (created)
                return true;

            // Mutex held — another copy running, or stale after taskkill / crash.
            var self = Process.GetCurrentProcess();
            var others = Process.GetProcessesByName(self.ProcessName)
                .Where(p => p.Id != self.Id)
                .ToArray();
            foreach (var p in others)
                p.Dispose();

            if (others.Length == 0)
            {
                try
                {
                    _mutex.WaitOne(0);
                    return true;
                }
                catch (AbandonedMutexException)
                {
                    return true;
                }
            }

            MessageBox.Show(
                "Showrunner Station is already running.\n\n" +
                "Close the other window first (Task Manager → ShowrunnerStationDesktop.exe). " +
                "Two copies fight for the same COM port and the app will freeze.",
                "Showrunner Station",
                MessageBoxButton.OK,
                MessageBoxImage.Warning);
            return false;
        }
        catch
        {
            return true;
        }
    }
}
