@echo off
chcp 65001 >nul
title ICQ Reborn - Public Access Setup

net session >nul 2>&1
if errorlevel 1 (
  echo.
  echo This setup must be started as Administrator.
  echo Right-click SETUP_PUBLIC_ACCESS.bat and choose "Run as administrator".
  echo.
  pause
  exit /b 1
)

set "CFDIR=%ProgramFiles%\Cloudflared"
set "CFEXE=%CFDIR%\cloudflared.exe"

if not exist "%CFDIR%" mkdir "%CFDIR%"

if not exist "%CFEXE%" (
  echo Downloading Cloudflare Tunnel...
  powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "Invoke-WebRequest -UseBasicParsing -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile '%CFEXE%'"
  if errorlevel 1 (
    echo Failed to download cloudflared.
    pause
    exit /b 1
  )
)

echo.
echo ============================================================
echo   ICQ Reborn public Internet access
echo ============================================================
echo.
echo 1. In Cloudflare Dashboard create a remotely-managed Tunnel.
echo 2. Configure its Public Hostname to point to:
echo       http://localhost:22005
echo 3. Copy the Tunnel token and paste it below.
echo.
set /p "TUNNEL_TOKEN=Tunnel token: "
if "%TUNNEL_TOKEN%"=="" (
  echo Token is required.
  pause
  exit /b 1
)

echo.
echo Installing Cloudflare Tunnel as a Windows service...
"%CFEXE%" service uninstall >nul 2>nul
"%CFEXE%" service install "%TUNNEL_TOKEN%"
set "TUNNEL_TOKEN="

if errorlevel 1 (
  echo.
  echo Service installation failed.
  pause
  exit /b 1
)

echo.
echo Cloudflare Tunnel service installed.
echo The tunnel will reconnect automatically after reboot or network changes.
echo.
echo IMPORTANT:
echo Put the public HTTPS hostname into server-config.json in the ICQ-REBORN GitHub repository:
echo   "publicBaseUrl": "https://YOUR-HOSTNAME"
echo.
echo Example:
echo   https://api.example.com
echo.
echo After server-config.json is updated, installed Android clients will discover it automatically.
echo.
pause
