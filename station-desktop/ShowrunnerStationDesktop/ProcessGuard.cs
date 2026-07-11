using System.Diagnostics;

namespace Showrunner.Station.Desktop;

/// <summary>Kiosk shell: only one process may hold the TSL COM port.</summary>
internal static class ProcessGuard
{
    public static void TerminateOtherInstances()
    {
        var self = Process.GetCurrentProcess();
        foreach (var proc in Process.GetProcessesByName(self.ProcessName))
        {
            if (proc.Id == self.Id) continue;
            try
            {
                ScanDiagnostics.Log("APP", "Closing other instance pid=" + proc.Id);
                proc.Kill(true);
                proc.WaitForExit(4000);
            }
            catch (Exception ex)
            {
                ScanDiagnostics.Log("APP", "Could not close pid=" + proc.Id + ": " + ex.Message);
            }
            finally
            {
                proc.Dispose();
            }
        }
    }
}
