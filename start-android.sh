#!/data/data/com.termux/files/usr/bin/bash

echo "================================================================"
echo "  🛡️  ĐANG KHỞI ĐỘNG SERVER TẠP HÓA TRÊN ĐIỆN THOẠI ANDROID"
echo "================================================================"
echo ""

# Prevent Android from killing background process
termux-wake-lock 2>/dev/null

# Get IP Address on Android
IP=$(ip route get 1.1.1.1 2>/dev/null | awk '{print $7}')
if [ -z "$IP" ]; then
  IP="localhost"
fi

echo "📱 Mở trên trình duyệt điện thoại này: http://localhost:5000"
echo "🌐 Các điện thoại khác trong nhà mở:   http://$IP:5000"
echo "🔒 Dữ liệu được lưu an toàn 100% trong bộ nhớ máy."
echo ""
echo "================================================================"

node server.js
