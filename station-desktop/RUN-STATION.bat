@echo off
setlocal EnableExtensions
REM Showrunner Station Desktop — director launch path (desktop shortcut → this file).
REM 1) Kill stale copies (COM3 fight)  2) Build latest into win-x64  3) Start one exe.

cd /d "%~dp0"

set "CSPROJ=%~dp0ShowrunnerStationDesktop\ShowrunnerStationDesktop.csproj"
set "PUBLISH=%~dp0ShowrunnerStationDesktop\bin\publish\win-x64"
set "EXE=%PUBLISH%\ShowrunnerStationDesktop.exe"

echo.
echo [Showrunner Station] Closing stale copies...
taskkill /F /IM ShowrunnerStationDesktop.exe >nul 2>&1
REM Let Windows release the Bluetooth virtual COM port.
ping 127.0.0.1 -n 3 >nul

where dotnet >nul 2>&1
if errorlevel 1 (
  echo [Showrunner Station] dotnet not on PATH — skipping build, using published exe.
  goto :launch
)

echo [Showrunner Station] Building latest desktop shell...
dotnet publish "%CSPROJ%" -c Release -r win-x64 --self-contained false -p:PublishSingleFile=false -o "%PUBLISH%" -nologo -v minimal
if errorlevel 1 (
  echo [Showrunner Station] Build failed — trying last published copy.
)

:launch
if not exist "%EXE%" (
  echo.
  echo ERROR: ShowrunnerStationDesktop.exe not found:
  echo   %EXE%
  echo.
  echo Install .NET 8 SDK and run this bat again, or run:
  echo   node build-station-desktop.js "field build"
  echo.
  pause
  exit /b 1
)

echo [Showrunner Station] Starting...
start "" "%EXE%"
endlocal
