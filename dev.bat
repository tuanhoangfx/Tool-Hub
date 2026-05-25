@echo off
title Tool Hub Dev (Launcher + UI)
cd /d "%~dp0"

echo.
echo  Tool Hub - dev.bat
echo  - Launcher : http://127.0.0.1:5190
echo  - Tool Hub : http://127.0.0.1:5176
echo  - Browser mo sau khi Vite san sang (khong mo som nua)
echo.

corepack pnpm dev
