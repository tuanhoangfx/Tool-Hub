@echo off
cd /d "%~dp0"

echo Khoi dong launcher (5190)...
start "GTM Launcher" /MIN cmd /c "cd /d %~dp0 && node scripts\local-tool-launcher.cjs"
timeout /t 2 /nobreak >nul

echo Khoi dong GTM dev (5176)...
start "" "http://127.0.0.1:5176"
corepack pnpm dev
