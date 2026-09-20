@echo off
title ICQ Reborn Server
cd /d "%~dp0server"
if not exist node_modules (
  echo Installing server dependencies...
  call npm install
  if errorlevel 1 pause & exit /b 1
)
set PORT=8080
if "%JWT_SECRET%"=="" set JWT_SECRET=ICQ_REBORN_CHANGE_THIS_SECRET_2026
echo.
echo Starting ICQ Reborn Server...
echo Local address: http://localhost:8080
echo.
call npm start
pause
