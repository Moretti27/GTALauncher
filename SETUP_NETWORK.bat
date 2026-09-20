@echo off
chcp 65001 >nul
title ICQ Reborn - Network Setup

net session >nul 2>&1
if errorlevel 1 (
  echo Run this file as Administrator.
  pause
  exit /b 1
)

echo Adding Windows Firewall rule for TCP 22005...
netsh advfirewall firewall delete rule name="ICQ Reborn Server 22005" >nul 2>nul
netsh advfirewall firewall add rule name="ICQ Reborn Server 22005" dir=in action=allow protocol=TCP localport=22005

echo.
echo Done.
echo.
echo Router configuration required:
echo   Protocol: TCP
echo   External port: 22005
echo   Internal port: 22005
echo   Internal IP: this PC's LAN IPv4 address
echo.
echo Current IPv4 addresses:
ipconfig | findstr /C:"IPv4"
echo.
echo Public ICQ Reborn endpoint:
echo   http://31.135.108.120:22005
echo.
pause
