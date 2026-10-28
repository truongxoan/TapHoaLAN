@echo off
chcp 65001 >nul
title CAI DAT SMARTPOS TAP HOA LAN
color 0B

echo ================================================================
echo   📦  BƯỚC 1: CÀI ĐẶT DỮ LIỆU VÀ GIAO DIỆN SMARTPOS (WINDOWS)
echo ================================================================
echo.

echo [1/3] Kiem tra Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [LOI] May tinh chua cai Node.js! Vui long cai Node.js tai https://nodejs.org
    pause
    exit /b
)
echo [OK] Node.js da san sang.
echo.

echo [2/3] Dang cai dat cac thu vien (npm install)...
call npm install

echo.
echo [3/3] Dang bien dich giao dien (npm run build)...
call npm run build

echo.
echo ================================================================
echo   ✅ CÀI ĐẶT HOÀN TẤT TRÊN MÁY TÍNH!
echo ================================================================
echo.
echo 👉 Bây giờ bạn chỉ cần nhấp đúp vào file "CHAY_PHAN_MEM_TAP_HOA.bat"
echo    để bắt đầu bán hàng!
echo.
pause
