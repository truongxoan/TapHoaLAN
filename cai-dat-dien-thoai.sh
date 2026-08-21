#!/data/data/com.termux/files/usr/bin/bash

echo "================================================================"
echo "  📦 BƯỚC 1: CÀI ĐẶT SMARTPOS TẠP HÓA TRÊN ĐIỆN THOẠI ANDROID"
echo "================================================================"
echo ""

echo "[1/3] Đang cập nhật gói Termux và cài đặt Node.js, Git..."
pkg update -y && pkg install -y nodejs git

echo ""
echo "[2/3] Đang tải thư viện phần mềm (npm install)..."
npm install

echo ""
echo "[3/3] Đang biên dịch giao diện (npm run build)..."
npm run build

echo ""
echo "================================================================"
echo "  ✅ CÀI ĐẶT HOÀN TẤT TRÊN ĐIỆN THOẠI ANDROID!"
echo "================================================================"
echo "👉 Để khởi động Server bán hàng, bạn gõ:  bash chay-dien-thoai.sh"
echo "================================================================"
