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
if %errorlevel% neq 0 (
  echo [LOI] May tinh chua cai Node.js! Cai Node.js LTS tai https://nodejs.org roi chay lai file nay.
  pause
  exit /b 1
)

set "WORKDIR=%TEMP%\TapHoaLAN-chay-nhanh"
echo Thu muc chay: %WORKDIR%
echo.

where git >nul 2>&1
if %errorlevel% equ 0 (
  echo [1/4] Dang lay code bang Git (chi lay file chay, khong lay Android)...
  if exist "%WORKDIR%\.git" (
    cd /d "%WORKDIR%"
    git pull --ff-only origin main
    if %errorlevel% neq 0 (
      echo [CANH BAO] Khong pull duoc, se xoa thu muc tam va tai lai tu dau.
      cd /d "%TEMP%"
      rmdir /S /Q "%WORKDIR%"
      goto GITCLONE
    )
  ) else (
    goto GITCLONE
  )
  goto BUILD
) else (
  echo [CANH BAO] May chua cai Git, se dung cach tai file zip thay the.
  goto ZIPBALL
)

:GITCLONE
git clone --depth 1 --filter=blob:none --sparse https://github.com/truongxoan/TapHoaLAN.git "%WORKDIR%"
if %errorlevel% neq 0 (
  echo [LOI] Khong clone duoc tu GitHub. Kiem tra mang roi chay lai.
  pause
  exit /b 1
)
cd /d "%WORKDIR%"
git sparse-checkout set server.js server-lib.js package.json package-lock.json src index.html vite.config.js public
if %errorlevel% neq 0 (
  echo [LOI] Khong chon duoc file chay. Kiem tra lai Git roi chay lai.
  pause
  exit /b 1
)
goto BUILD

:ZIPBALL
set "TMPZIP=%TEMP%\TapHoaLAN-chay-nhanh.zip"
set "TMPDIR=%TEMP%\TapHoaLAN-chay-nhanh-tam"
powershell -Command "Invoke-WebRequest -Uri 'https://github.com/truongxoan/TapHoaLAN/archive/refs/heads/main.zip' -OutFile '%TMPZIP%'"
if not exist "%TMPZIP%" (
  echo [LOI] Khong tai duoc tu GitHub. Kiem tra mang roi chay lai.
  pause
  exit /b 1
)
rmdir /S /Q "%TMPDIR%" >nul 2>&1
powershell -Command "Expand-Archive -Path '%TMPZIP%' -DestinationPath '%TMPDIR%' -Force"
if not exist "%TMPDIR%\TapHoaLAN-main\server.js" (
  echo [LOI] File tai ve thieu server.js. Hay chay lai file nay.
  pause
  exit /b 1
)
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
echo.
echo [2/4] Dang cai thu vien...
call npm install
if %errorlevel% neq 0 (
  echo [LOI] npm install that bai. Kiem tra mang roi chay lai file nay.
  pause
  exit /b 1
)
echo [3/4] Dang bien dich giao dien...
call npm run build
if %errorlevel% neq 0 (
  echo [LOI] npm run build that bai. Gui toan bo chu trong cua so nay de duoc ho tro.
  pause
  exit /b 1
)
echo [4/4] Dang khoi dong server...
echo Mo trinh duyet tai: http://localhost:5000
echo De dung server, bam Ctrl+C trong cua so nay.
start "" "http://localhost:5000"
node server.js
pause
