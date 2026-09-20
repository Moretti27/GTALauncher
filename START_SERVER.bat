@echo off
chcp 65001 >nul
title ICQ Reborn Server v0.26
cd /d "%~dp0server"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js not found.
  echo Use the automatic PC Host package or install Node.js 20+.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installing server dependencies...
  call npm install
  if errorlevel 1 pause & exit /b 1
)

set PORT=22005

echo.
echo ================================
echo   ICQ Reborn Server v0.26
echo ================================
echo Port: 22005
echo Local: http://localhost:22005
echo Data:  server\data
echo.
echo The server secret is stored automatically in:
echo server\data\server_secret.txt
echo Do not delete it if you want existing sessions to remain valid.
echo.

call npm start
pause
