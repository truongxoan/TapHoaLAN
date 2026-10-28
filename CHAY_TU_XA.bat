@echo off
chcp 65001 >nul
title CHAY NHANH TAP HOA TU GITHUB - KHONG CAN TAI TAY CA DU AN
setlocal
cd /d "%TEMP%"

echo ================================================================
echo   CHAY NHANH TAP HOA TU GITHUB
echo   Ban chi can file nay, khong can tai tay ca du an ve truoc.
echo   File nay se tu lay code moi nhat tu GitHub ve thu muc tam,
echo   chi lay cac file chay phan mem, bo qua thu muc Android
echo   va cac file khong can thiet, roi cai dat va khoi dong.
echo ================================================================
echo.
echo LUU Y QUAN TRONG:
echo   - Day la ban chay thu nhanh tren may moi.
echo   - Du lieu se luu trong thu muc tam, KHONG phai du lieu
echo     cua tiem neu tiem cua ban dang o thu muc khac.
echo   - Muon dung du lieu tiem that, hay dung file
echo     CAP_NHAT_TU_GITHUB.bat trong thu muc phan mem cua tiem.
echo   - Can mang Internet de lay code tu GitHub lan dau.
echo.
pause

where node >nul 2>&1
if errorlevel 1 goto NO_NODE

set "WORKDIR=%TEMP%\TapHoaLAN-chay-nhanh"
echo Thu muc chay: %WORKDIR%
echo.

where git >nul 2>&1
if errorlevel 1 goto ZIPBALL
if exist "%WORKDIR%\.git" goto PULL
goto GITCLONE

:PULL
echo [1/4] Dang cap nhat code bang Git...
cd /d "%WORKDIR%"
git pull --ff-only origin main
if errorlevel 1 goto GITCLONE_FRESH
git sparse-checkout set --no-cone server.js server-lib.js package.json package-lock.json src index.html vite.config.js public
if errorlevel 1 goto GITCLONE_FRESH
goto BUILD

:GITCLONE_FRESH
echo [CANH BAO] Khong cap nhat duoc, se xoa thu muc tam va tai lai tu dau.
cd /d "%TEMP%"
rmdir /S /Q "%WORKDIR%"
goto GITCLONE

:GITCLONE
echo [1/4] Dang lay code bang Git (chi lay file chay, khong lay Android)...
git clone --depth 1 --filter=blob:none --sparse https://github.com/truongxoan/TapHoaLAN.git "%WORKDIR%"
if errorlevel 1 goto FAIL_CLONE
cd /d "%WORKDIR%"
git sparse-checkout set --no-cone server.js server-lib.js package.json package-lock.json src index.html vite.config.js public
if errorlevel 1 goto FAIL_SPARSE
goto BUILD

:ZIPBALL
echo [CANH BAO] May chua cai Git, se dung cach tai file zip thay the.
set "TMPZIP=%TEMP%\TapHoaLAN-chay-nhanh.zip"
set "TMPDIR=%TEMP%\TapHoaLAN-chay-nhanh-tam"
powershell -Command "Invoke-WebRequest -Uri 'https://github.com/truongxoan/TapHoaLAN/archive/refs/heads/main.zip' -OutFile '%TMPZIP%'"
if not exist "%TMPZIP%" goto FAIL_DOWNLOAD
rmdir /S /Q "%TMPDIR%" >nul 2>&1
powershell -Command "Expand-Archive -Path '%TMPZIP%' -DestinationPath '%TMPDIR%' -Force"
if not exist "%TMPDIR%\TapHoaLAN-main\server.js" goto FAIL_ZIP
if not exist "%WORKDIR%" mkdir "%WORKDIR%"
xcopy /E /Y "%TMPDIR%\TapHoaLAN-main\server.js" "%WORKDIR%\" >nul
xcopy /E /Y "%TMPDIR%\TapHoaLAN-main\server-lib.js" "%WORKDIR%\" >nul
xcopy /E /Y "%TMPDIR%\TapHoaLAN-main\package.json" "%WORKDIR%\" >nul
xcopy /E /Y "%TMPDIR%\TapHoaLAN-main\package-lock.json" "%WORKDIR%\" >nul
xcopy /E /Y "%TMPDIR%\TapHoaLAN-main\index.html" "%WORKDIR%\" >nul
xcopy /E /Y "%TMPDIR%\TapHoaLAN-main\vite.config.js" "%WORKDIR%\" >nul
xcopy /E /I /Y "%TMPDIR%\TapHoaLAN-main\src" "%WORKDIR%\src" >nul
xcopy /E /I /Y "%TMPDIR%\TapHoaLAN-main\public" "%WORKDIR%\public" >nul
cd /d "%WORKDIR%"
goto BUILD

:BUILD
if not exist "src\main.jsx" goto FAIL_SRC
echo.
echo [2/4] Dang cai thu vien...
call npm install
if errorlevel 1 goto FAIL_INSTALL
echo [3/4] Dang bien dich giao dien...
call npm run build
if errorlevel 1 goto FAIL_BUILD
echo [4/4] Dang khoi dong server...
echo Mo trinh duyet tai: http://localhost:5000
echo De dung server, bam Ctrl+C trong cua so nay.
start "" "http://localhost:5000"
node server.js
echo.
echo Server da dung. Bam phim bat ky de dong cua so.
pause
exit /b 0

:NO_NODE
echo [LOI] May tinh chua cai Node.js! Cai Node.js LTS tai https://nodejs.org roi chay lai file nay.
pause
exit /b 1

:FAIL_CLONE
echo [LOI] Khong clone duoc tu GitHub. Kiem tra mang roi chay lai.
pause
exit /b 1

:FAIL_SPARSE
echo [LOI] Khong chon duoc file chay. Kiem tra lai Git roi chay lai.
pause
exit /b 1

:FAIL_DOWNLOAD
echo [LOI] Khong tai duoc tu GitHub. Kiem tra mang roi chay lai.
pause
exit /b 1

:FAIL_ZIP
echo [LOI] File tai ve thieu server.js. Hay chay lai file nay.
pause
exit /b 1

:FAIL_SRC
echo [LOI] Thieu thu muc src, code tai ve chua du.
echo Hay xoa thu muc tam roi chay lai file nay:
echo rmdir /S /Q "%TEMP%\TapHoaLAN-chay-nhanh"
pause
exit /b 1

:FAIL_INSTALL
echo [LOI] npm install that bai. Kiem tra mang roi chay lai file nay.
pause
exit /b 1

:FAIL_BUILD
echo [LOI] npm run build that bai. Gui toan bo chu trong cua so nay de duoc ho tro.
pause
exit /b 1
