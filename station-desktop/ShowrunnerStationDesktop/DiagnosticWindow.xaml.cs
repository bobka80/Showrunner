using System.ComponentModel;
using System.Windows;

namespace Showrunner.Station.Desktop;

public partial class DiagnosticWindow : Window
{
    private readonly Func<Task> _probeWeb;
    private readonly Action<string, string> _injectTestScan;
    private readonly Func<string> _gunSummary;

    public DiagnosticWindow(Func<Task> probeWeb, Action<string, string> injectTestScan, Func<string> gunSummary)
    {
        InitializeComponent();
        _probeWeb = probeWeb;
        _injectTestScan = injectTestScan;
        _gunSummary = gunSummary;

        var ver = typeof(DiagnosticWindow).Assembly.GetName().Version?.ToString(3) ?? "?";
        FooterText.Text = "Desktop v" + ver + " · F12 to hide · Scan: " + ScanDiagnostics.LogFilePath
            + " · Connect: " + ConnectLockLog.LogFilePath;

        foreach (var line in ScanDiagnostics.Snapshot())
            AppendLine(line);

        ScanDiagnostics.LineAdded += OnLineAdded;

        Left = SystemParameters.WorkArea.Right - Width - 12;
        Top = SystemParameters.WorkArea.Top + 12;
    }

    public void Detach()
    {
        ScanDiagnostics.LineAdded -= OnLineAdded;
    }

    protected override void OnClosing(CancelEventArgs e)
    {
        // X / Alt+F4 hides the panel — avoids destroy/recreate loops and stray BeginInvoke updates.
        e.Cancel = true;
        Hide();
    }

    private void OnLineAdded(string line)
    {
        if (!IsLoaded || !IsVisible) return;
        try
        {
            Dispatcher.BeginInvoke(() =>
            {
                if (IsLoaded && IsVisible)
                    AppendLine(line);
            });
        }
        catch
        {
            // window going away
        }
    }

    private void AppendLine(string line)
    {
        LogBox.AppendText(line + Environment.NewLine);
        if (AutoScrollBox.IsChecked == true)
            LogBox.ScrollToEnd();
    }

    private async void ProbeBtn_OnClick(object sender, RoutedEventArgs e)
    {
        ProbeBtn.IsEnabled = false;
        ScanDiagnostics.Log("DIAG", "Gun: " + _gunSummary());
        try
        {
            await _probeWeb();
        }
        catch (Exception ex)
        {
            ScanDiagnostics.Log("WEB", "Probe failed: " + ex.Message);
        }
        finally
        {
            ProbeBtn.IsEnabled = true;
        }
    }

    private void TestScanBtn_OnClick(object sender, RoutedEventArgs e)
    {
        var epc = "DIAG" + DateTime.Now.ToString("HHmmss");
        ScanDiagnostics.Log("TEST", "Injecting test EPC " + epc);
        _injectTestScan(epc, "DIAGTID001");
    }

    private void ClearBtn_OnClick(object sender, RoutedEventArgs e)
    {
        LogBox.Clear();
        ScanDiagnostics.Clear();
    }

    private void CopyBtn_OnClick(object sender, RoutedEventArgs e)
    {
        try
        {
            Clipboard.SetText(LogBox.Text);
            ScanDiagnostics.Log("DIAG", "Copied log to clipboard");
        }
        catch (Exception ex)
        {
            ScanDiagnostics.Log("DIAG", "Copy failed: " + ex.Message);
        }
    }
}
