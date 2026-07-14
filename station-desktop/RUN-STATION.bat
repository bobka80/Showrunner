@echo off
setlocal EnableExtensions
REM Showrunner Station Desktop — director launch path.
REM   RUN-STATION.bat         fast launch (uses last published exe)
REM   RUN-STATION.bat build   rebuild then launch

pushd "%~dp0"

set "CSPROJ=%~dp0ShowrunnerStationDesktop\ShowrunnerStationDesktop.csproj"
set "PUBLISH=%~dp0ShowrunnerStationDesktop\bin\publish\win-x64"
set "EXE=%PUBLISH%\ShowrunnerStationDesktop.exe"
set "DO_BUILD=0"
if /I "%~1"=="build" set "DO_BUILD=1"
if /I "%~1"=="--build" set "DO_BUILD=1"

echo.
echo [Showrunner Station] Closing stale copies...
taskkill /F /IM ShowrunnerStationDesktop.exe >nul 2>&1
ping 127.0.0.1 -n 3 >nul

if "%DO_BUILD%"=="1" (
  where dotnet >nul 2>&1
  if errorlevel 1 (
    echo.
    echo ERROR: dotnet not on PATH — cannot build.
    echo Install .NET 8 SDK, or run without "build" to use the last published exe.
    goto :fail
  )
  echo [Showrunner Station] Building latest desktop shell...
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\generate-app-icon.ps1"
  if errorlevel 1 (
    echo.
    echo ERROR: Could not generate app.ico — desktop shortcut icon will be blank.
    goto :fail
  )
  dotnet publish "%CSPROJ%" -c Release -r win-x64 --self-contained false -p:PublishSingleFile=false -o "%PUBLISH%" -nologo -v minimal
  if errorlevel 1 (
    echo.
    echo ERROR: Build failed. If Google Drive is syncing this folder, pause sync and retry.
    goto :fail
  )
) else (
  echo [Showrunner Station] Fast launch — add "build" to rebuild first.
)

if not exist "%EXE%" (
  echo.
  echo ERROR: ShowrunnerStationDesktop.exe not found:
  echo   %EXE%
  echo.
  echo Run: RUN-STATION.bat build
  goto :fail
)

echo [Showrunner Station] Starting...
echo   %EXE%
start "Showrunner Station" /D "%PUBLISH%" "%EXE%"

set "FOUND=0"
for /L %%i in (1,1,8) do (
  ping 127.0.0.1 -n 2 >nul
  tasklist /FI "IMAGENAME eq ShowrunnerStationDesktop.exe" 2>nul | find /I "ShowrunnerStation" >nul
  if not errorlevel 1 set "FOUND=1"
)

if "%FOUND%"=="0" (
  echo.
  echo ERROR: Station did not stay running.
  echo Log: %LOCALAPPDATA%\ShowrunnerStation\scan-diag.log
  goto :fail
)

echo [Showrunner Station] Running — check taskbar if the window is behind other apps.
popd
exit /b 0

:fail
popd
pause
exit /b 1
