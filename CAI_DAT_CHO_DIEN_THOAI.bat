@echo off
chcp 65001 >nul
title CAI DAT TU DONG VAO DIEN THOAI ANDROID
color 0B

echo ================================================================
echo   📱  TỰ ĐỘNG CÀI ĐẶT SMARTPOS VÀO ĐIỆN THOẠI ANDROID
echo ================================================================
echo.

echo [1/3] Kiem tra ket noi dien thoai qua cong USB...
adb devices

echo.
echo ================================================================
echo ⚠️  LUU Y QUAN TRONG TREN DIEN THOAI:
echo 1. Hay mo Dien thoai -> Vao Cai dat -> Tuy chon nha phat trien (Developer options)
echo    -> Bat "Go loi USB" (USB Debugging).
echo 2. Neu man hinh dien thoai hien thong bao:
echo    "Cho phep go loi USB tu may tinh nay?" -> Tich "Luon cho phep" -> Bam OK.
echo ================================================================
echo.

pause

echo [2/3] Dang cai dat Termux va Termux Widget vao dien thoai...
if exist "android_apps\Termux.apk" (
    adb install -r "android_apps\Termux.apk"
)
if exist "android_apps\Termux_Widget.apk" (
    adb install -r "android_apps\Termux_Widget.apk"
)

echo.
echo [3/3] Dang thiet lap du an TapHoaLAN...
adb shell "mkdir -p /sdcard/Download/TapHoaLAN"

echo.
echo ================================================================
echo   ✅ HOÀN TẤT CÀI ĐẶT LÊN ĐIỆN THOẠI!
echo ================================================================
echo.
pause
