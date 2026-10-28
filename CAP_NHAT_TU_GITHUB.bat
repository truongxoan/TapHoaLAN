@echo off
chcp 65001 >nul
title CAP NHAT TAP HOA TU GITHUB
setlocal EnableDelayedExpansion
cd /d "%~dp0"

echo ================================================================
echo   CAP NHAT PHAN MEM TAP HOA TU GITHUB - GIU NGUYEN DU LIEU
echo ================================================================
echo.
echo LUU Y: hay tat cua so server cu truoc khi chay file nay,
echo vi cong 5000 dang chay se bi bao la da bi chiem.
echo.
echo File nay se:
echo   1. Sao luu du lieu ban hang hien tai
echo   2. Tai ban moi nhat tu GitHub
echo   3. Chi chep de code moi, KHONG xoa du lieu, backup, anh hang
echo   4. Cai lai thu vien va bien dich giao dien
echo   5. Khoi dong lai server
echo.
pause

where node >nul 2>&1
if %errorlevel% neq 0 (
  echo [LOI] May tinh chua cai Node.js! Cai Node.js LTS tai https://nodejs.org roi chay lai file nay.
  pause
  exit /b 1
)

echo [1/5] Dang sao luu du lieu...
set "STAMP=%DATE:~-4%%DATE:~7,2%%DATE:~4,2%_%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%"
set "STAMP=%STAMP: =0%"
if not exist "cap-nhat-backup\%STAMP%" mkdir "cap-nhat-backup\%STAMP%"
if exist "data" xcopy /E /I /Y "data" "cap-nhat-backup\%STAMP%\data" >nul
if exist "uploads" xcopy /E /I /Y "uploads" "cap-nhat-backup\%STAMP%\uploads" >nul
echo [OK] Da sao luu vao cap-nhat-backup\%STAMP%
echo.

echo [2/5] Dang tai ban moi tu GitHub...
set "TMPDIR=%TEMP%\TapHoaLAN-cap-nhat"
rmdir /S /Q "%TMPDIR%" >nul 2>&1
mkdir "%TMPDIR%"
powershell -Command "Invoke-WebRequest -Uri 'https://github.com/truongxoan/TapHoaLAN/archive/refs/heads/main.zip' -OutFile '%TMPDIR%\main.zip'"
if not exist "%TMPDIR%\main.zip" (
  echo [LOI] Khong tai duoc tu GitHub. Kiem tra mang roi chay lai.
  pause
  exit /b 1
)
powershell -Command "Expand-Archive -Path '%TMPDIR%\main.zip' -DestinationPath '%TMPDIR%' -Force"
if not exist "%TMPDIR%\TapHoaLAN-main\src\screens\DeviceHistoryScreen.jsx" (
  echo [CANH BAO] GitHub chua co ban moi nhat.
  echo File nay KHONG chep de gi ca, du lieu cua ban van nguyen.
  echo Hay doi ban moi duoc day len GitHub roi chay lai file nay.
  pause
  exit /b 1
)
if not exist "%TMPDIR%\TapHoaLAN-main\src\screens\ElderPOSScreen.jsx" (
  echo [CANH BAO] GitHub chua co ban moi nhat. Khong chep de.
  pause
  exit /b 1
)
echo [OK] Da tai duoc ban moi.
echo.

echo [3/5] Dang chep code moi, giu nguyen du lieu...
echo \data\> "%TMPDIR%\exclude.txt"
echo \backups\>> "%TMPDIR%\exclude.txt"
echo \uploads\>> "%TMPDIR%\exclude.txt"
echo \cap-nhat-backup\>> "%TMPDIR%\exclude.txt"
echo \.git\>> "%TMPDIR%\exclude.txt"
echo \node_modules\>> "%TMPDIR%\exclude.txt"
xcopy /E /Y "%TMPDIR%\TapHoaLAN-main\*" ".\" /EXCLUDE:"%TMPDIR%\exclude.txt" >nul
if %errorlevel% neq 0 (
  echo [LOI] Chep code that bai. Du lieu da sao luu o cap-nhat-backup\%STAMP%
  pause
  exit /b 1
)
echo [OK] Da chep code moi.
echo.

echo [4/5] Dang cai thu vien va bien dich giao dien...
call npm install
if %errorlevel% neq 0 (
  echo [LOI] npm install that bai. Kiem tra mang roi chay lai file nay.
  pause
  exit /b 1
)
call npm run build
if %errorlevel% neq 0 (
  echo [LOI] npm run build that bai. Gui toan bo chu trong cua so nay de duoc ho tro.
  pause
  exit /b 1
)
echo [OK] Cai dat va bien dich xong.
echo.

echo [5/5] Dang khoi dong server...
start "" "http://localhost:5000"
node server.js
pause
