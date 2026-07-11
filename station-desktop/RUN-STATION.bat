@echo off
REM Showrunner Station Desktop — always run ONE copy (kills stale instances first).
taskkill /F /IM ShowrunnerStationDesktop.exe >nul 2>&1
ping 127.0.0.1 -n 3 >nul
start "" "%~dp0ShowrunnerStationDesktop\bin\publish\win-x64-launch\ShowrunnerStationDesktop.exe"
