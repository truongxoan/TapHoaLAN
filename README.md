# 🏪 TapHoaLAN - Hệ Thống Bán Hàng Tạp Hóa Mạng LAN Thông Minh & Bảo Mật

Hệ thống quản lý bán hàng, quét mã vạch, phân quyền bảo mật chủ tiệm & nhân viên, đồng bộ thời gian thực qua mạng WiFi nội bộ (100% Offline & Private LAN).

---

## 🌟 Các Tính Năng Nổi Bật

- **📱 Đồng Bộ Đa Thiết Bị Qua WiFi LAN**: Máy tính thu ngân, điện thoại, iPad/máy tính bảng kết nối bán hàng cùng lúc.
- **📷 Quét Mã Vạch Bằng Camera Điện Thoại**: Biến bất kỳ điện thoại nào thành máy quét mã vạch không dây siêu nhạy.
- **🔐 Phân Quyền Bảo Mật 2 Tầng**:
  - *Nhân Viên*: Chỉ quét mã, chọn món và tính tiền (ẩn giá vốn, khóa sửa giá).
  - *Chủ Tiệm (Mở khóa PIN)*: Toàn quyền sửa giá, thêm hàng mới, xem báo cáo lời lỗ, sổ nợ, nhập kho.
- **↔️ Giao Diện Co Kéo Tự Dãn Nở (Auto-Fit No-Scroll)**: Thanh phân cách kéo dãn độ rộng tùy ý giữa Bảng Tính Tiền & Kho Hàng.
- **📊 Xuất Sổ Sách Ra File Excel (.xlsx)**: 5 Sheet chuyên biệt (Kho & Giá, Hóa Đơn, Sổ Nợ, Nhập Hàng, Lịch Sử Chốt Ca).
- **⏱️ Chốt Ca & Kiểm Kê Tiền Mặt**: Tự động thông báo chốt ca 22:00, đếm tiền mặt theo từng mệnh giá VND.
- **💳 Thanh Toán Linh Hoạt**: Tiền mặt tính tiền thừa, VietQR động (chuyển khoản đúng số tiền), Sổ ghi nợ khách quen.
- **🎁 Tích Điểm Khách Quen**: Tích điểm & đổi quà theo Tên + 4 số cuối điện thoại.

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy

### 1. Cài đặt thư viện:
```bash
npm install
```

### 2. Build giao diện:
```bash
npm run build
```

### 3. Khởi chạy Server Mạng LAN:
```bash
npm start
```
*(Hoặc nhấp đúp chuột vào file `CHAY_PHAN_MEM_TAP_HOA.bat` trên Windows)*

---

## 🌐 Truy Cập

- **Trên máy tính**: `http://localhost:5000`
- **Trên điện thoại / iPad**: `http://[IP_MÁY_TÍNH]:5000` (Quét mã QR từ nút "Quét ĐT" trên thanh menu).
