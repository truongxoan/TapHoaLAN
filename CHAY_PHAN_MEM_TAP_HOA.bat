@echo off
chcp 65001 >nul
title SMARTPOS TAP HOA GIA DINH - SERVER MANG LAN
color 0A

echo ================================================================
echo   🛡️  DANG KHOI CHAY SMARTPOS TAP HOA (MANG LAN CUC BO 100%%)
echo ================================================================
echo.
echo [1/2] Dang khoi dong may chu du lieu va dong bo dien thoai...
echo [2/2] Dang mo trinh duyet ban hang...
echo.

start "" "http://localhost:5000"
node server.js

pause
