@echo off
title AquaSource Web Server
cd /d "%~dp0"

echo ======================================================
echo Launching AquaSource Web Server...
echo ======================================================

where node >nul 2>nul
if %errorlevel% equ 0 (
    node server.js
) else (
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"
)

pause
