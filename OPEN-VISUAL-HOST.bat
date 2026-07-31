@echo off
REM Double-click to start Visual Host and open it in your browser.
REM No need to type "node visual-host.js" after a reboot.
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0OPEN-VISUAL-HOST.ps1"
if errorlevel 1 pause
