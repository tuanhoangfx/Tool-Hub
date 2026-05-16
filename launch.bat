@echo off
cd /d "%~dp0"
start "GTM Launcher" cmd /k "node scripts\local-tool-launcher.cjs"
echo Launcher started on http://127.0.0.1:5190
pause
