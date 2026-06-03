@echo off
title GTM Local Tool Launcher
cd /d "%~dp0"

echo.
echo  GTM Local Tool Launcher
echo  http://127.0.0.1:5190
echo.
echo  Giu cua so nay mo khi dung "Chay tool" tu infi.io.vn hoac GTM Admin.
echo.

node scripts\local-tool-launcher.cjs
