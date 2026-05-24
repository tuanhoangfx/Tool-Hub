@echo off
title Tool Hub Dev (Launcher + UI)
cd /d "%~dp0"

echo.
echo  Tool Hub - dev.bat
echo  - Launcher : http://127.0.0.1:5190
echo  - Tool Hub : http://127.0.0.1:5176
echo.

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5190 ^| findstr LISTENING') do (
  echo Dang dong launcher cu tren port 5190...
  taskkill /PID %%a /F >nul 2>&1
)

echo Khoi dong launcher...
start "Tool Hub Launcher" cmd /k "cd /d %~dp0 && node scripts\local-tool-launcher.cjs"

echo Cho launcher khoi dong...
timeout /t 2 /nobreak >nul

start "" "http://127.0.0.1:5190/"
timeout /t 1 /nobreak >nul
start "" "http://127.0.0.1:5176/?screen=system&stab=template&dtpl=hub-shell&hsdesign=V1"

echo.
echo  Giu cua so "Tool Hub Launcher" mo. Ctrl+C de dung Vite.
echo.

corepack pnpm dev
