#!/data/data/com.termux/files/usr/bin/bash

echo "================================================================"
echo "  🛡️  ĐANG KHỞI ĐỘNG SERVER TẠP HÓA TRÊN ĐIỆN THOẠI ANDROID"
echo "================================================================"
echo ""

# Giữ server không bị Android ngắt khi tắt màn hình
termux-wake-lock 2>/dev/null

# Lấy địa chỉ IP nội bộ của điện thoại
IP=$(ip route get 1.1.1.1 2>/dev/null | awk '{print $7}')
if [ -z "$IP" ]; then
  IP="localhost"
fi

echo "📱 Trên điện thoại này mở:          http://localhost:5000"
echo "🌐 Các điện thoại/máy tính khác mở: http://$IP:5000"
echo "🔒 Dữ liệu được lưu trữ an toàn trong máy."
echo ""
echo "================================================================"

node server.js
