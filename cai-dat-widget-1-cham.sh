#!/data/data/com.termux/files/usr/bin/bash

echo "================================================================"
echo "  🚀 CÀI ĐẶT NÚT BẤM 1 CHẠM TRÊN MÀN HÌNH CHÍNH ANDROID"
echo "================================================================"
echo ""

# Tạo thư mục shortcuts cho Termux Widget
mkdir -p ~/.shortcuts
mkdir -p ~/.shortcuts/tasks

# Tạo tệp chạy nhanh
cat << 'EOF' > ~/.shortcuts/SmartPOS.sh
#!/data/data/com.termux/files/usr/bin/bash
termux-wake-lock 2>/dev/null
cd ~/TapHoaLAN 2>/dev/null || cd /data/data/com.termux/files/home/TapHoaLAN
termux-open-url http://localhost:5000 2>/dev/null &
node server.js
EOF

chmod +x ~/.shortcuts/SmartPOS.sh

echo "[OK] Đã tạo tệp khởi động nhanh: ~/.shortcuts/SmartPOS.sh"
echo ""
echo "================================================================"
echo "👉 BƯỚC TIẾP THEO TRÊN ĐIỆN THOẠI:"
echo "1. Cài ứng dụng Termux:Widget (miễn phí từ F-Droid)."
echo "2. Ra Màn hình chính điện thoại -> Đè tay chọn Widget -> Chọn Termux:Widget -> Đặt icon 'SmartPOS' ra màn hình chính."
echo "3. Từ nay chỉ cần BẤM 1 CHẠM vào biểu tượng SmartPOS là tự chạy server và mở web bán hàng!"
echo "================================================================"
