@echo off
chcp 65001 >nul
title ICQ Reborn Server v0.28
cd /d "%~dp0server"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js not found.
  echo Install Node.js 20+ and run this file again.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installing server dependencies...
  call npm install
  if errorlevel 1 pause & exit /b 1
)

set PORT=22005

echo Checking Windows Firewall rule...
netsh advfirewall firewall show rule name="ICQ Reborn Server 22005" >nul 2>nul
if errorlevel 1 (
  net session >nul 2>&1
  if not errorlevel 1 (
    netsh advfirewall firewall add rule name="ICQ Reborn Server 22005" dir=in action=allow protocol=TCP localport=22005 >nul
    echo Firewall rule added for TCP 22005.
  ) else (
    echo Firewall rule not found.
    echo Run SETUP_NETWORK.bat as Administrator once to add it.
  )
)

for /f "tokens=2 delims=:" %%A in ('ipconfig ^| findstr /C:"IPv4"') do (
  set "LANIP=%%A"
  goto :gotip
)
:gotip
if defined LANIP set "LANIP=%LANIP: =%"

echo.
echo ==========================================
echo   ICQ Reborn Server v0.28
echo ==========================================
echo Port:       22005
echo Local:      http://localhost:22005
if defined LANIP echo LAN:        http://%LANIP%:22005
echo Public:     http://31.135.108.120:22005
echo Health:     http://31.135.108.120:22005/health
echo Data:       server\data
echo.
echo Router port forwarding must remain:
echo TCP 22005 -^> this PC:22005
echo.
echo Keep server\data when updating the host.
echo.

call npm start
pause
