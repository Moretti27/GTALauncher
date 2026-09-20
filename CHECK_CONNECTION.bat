@echo off
chcp 65001 >nul
title ICQ Reborn - Connection Check
echo.
echo Checking local server...
powershell -NoProfile -Command "try { $r=Invoke-RestMethod -TimeoutSec 5 http://127.0.0.1:22005/health; $r | ConvertTo-Json -Compress } catch { Write-Host 'LOCAL FAILED:' $_.Exception.Message }"
echo.
echo Checking public endpoint...
powershell -NoProfile -Command "try { $r=Invoke-RestMethod -TimeoutSec 8 http://31.135.108.120:22005/health; $r | ConvertTo-Json -Compress } catch { Write-Host 'PUBLIC FAILED:' $_.Exception.Message }"
echo.
echo Listening sockets:
netstat -ano | findstr :22005
echo.
pause
