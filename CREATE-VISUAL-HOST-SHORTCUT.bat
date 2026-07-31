@echo off
REM Creates a Desktop shortcut: "Showrunner Visual Host"
REM Run once, then double-click the Desktop icon after reboots.
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$desk = [Environment]::GetFolderPath('Desktop');" ^
  "$bat = Join-Path '%~dp0' 'OPEN-VISUAL-HOST.bat';" ^
  "$lnkPath = Join-Path $desk 'Showrunner Visual Host.lnk';" ^
  "$w = New-Object -ComObject WScript.Shell;" ^
  "$s = $w.CreateShortcut($lnkPath);" ^
  "$s.TargetPath = $bat;" ^
  "$s.WorkingDirectory = '%~dp0';" ^
  "$s.WindowStyle = 7;" ^
  "$s.Description = 'Start Visual Host theme playground and open localhost';" ^
  "$s.Save();" ^
  "Write-Host ('Shortcut created: ' + $lnkPath)"
echo.
echo Desktop shortcut created: Showrunner Visual Host
pause
