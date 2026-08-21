#!/data/data/com.termux/files/usr/bin/bash

echo "================================================================"
echo "  🚀 CÀI ĐẶT SMARTPOS TẠP HÓA TRÊN ĐIỆN THOẠI ANDROID (TERMUX)"
echo "================================================================"
echo ""

# Update packages and install Node.js & Git
echo "[1/4] Đang cập nhật gói hệ thống và cài đặt Node.js..."
pkg update -y && pkg install -y nodejs git

# Install dependencies
echo "[2/4] Đang cài đặt thư viện phần mềm (npm install)..."
npm install

# Build frontend
echo "[3/4] Đang biên dịch giao diện ứng dụng (npm run build)..."
npm run build

echo ""
echo "================================================================"
echo "  ✅ CÀI ĐẶT THÀNH CÔNG TRÊN ĐIỆN THOẠI ANDROID!"
echo "================================================================"
echo "👉 Để khởi động Server, bạn gõ lệnh:  bash start-android.sh"
echo "================================================================"
