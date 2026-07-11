using System.Windows;

namespace Showrunner.Station.Desktop;

public partial class App : Application
{
    protected override void OnStartup(StartupEventArgs e)
    {
        DispatcherUnhandledException += (_, args) =>
        {
            ScanDiagnostics.Log("APP", "Unhandled UI: " + args.Exception.Message);
            args.Handled = true;
        };
        AppDomain.CurrentDomain.UnhandledException += (_, args) =>
        {
            if (args.ExceptionObject is Exception ex)
                ScanDiagnostics.Log("APP", "Unhandled: " + ex.Message);
        };

        ProcessGuard.TerminateOtherInstances();
        if (!SingleInstance.TryAcquire())
        {
            Shutdown(0);
            return;
        }
        SessionEnding += (_, _) =>
        {
            if (Current.MainWindow is MainWindow mw)
                mw.ShutdownRfid();
        };
        base.OnStartup(e);
    }
}
