# 🏪 TapHoaLAN - Hệ Thống Bán Hàng Tạp Hóa Mạng LAN

Hệ thống quản lý bán hàng, quét mã vạch, phân quyền bảo mật chủ tiệm & nhân viên, đồng bộ thời gian thực qua mạng WiFi nội bộ.

> ⚠️ Chạy trên HTTP trong mạng LAN nội bộ, không có HTTPS và chưa có đối soát ngân hàng tự động. Chỉ dùng trong Wi-Fi tin cậy của tiệm, tách riêng mạng khách, đặt mật khẩu Wi-Fi mạnh (WPA2/WPA3).

## 🌟 Các Tính Năng Nổi Bật

- **📱 Đồng Bộ Đa Thiết Bị Qua WiFi LAN**: Máy tính thu ngân, điện thoại, iPad/máy tính bảng kết nối bán hàng cùng lúc.
- **📷 Quét Mã Vạch Bằng Camera Điện Thoại**: Biến bất kỳ điện thoại nào thành máy quét mã vạch không dây.
- **🔐 Phân Quyền Bảo Mật 2 Tầng**:
  - *Nhân Viên*: Chỉ quét mã, chọn món và tính tiền (ẩn giá vốn, khóa sửa giá).
  - *Chủ Tiệm (Mở khóa PIN)*: Toàn quyền sửa giá, thêm hàng mới, xem báo cáo lời lỗ, sổ nợ, nhập kho.
- **↔️ Giao Diện Co Kéo Tự Dãn Nở (Auto-Fit No-Scroll)**: Thanh phân cách kéo dãn độ rộng tùy ý giữa Bảng Tính Tiền & Kho Hàng.
- **📊 Xuất Sổ Sách Ra File Excel (.xlsx)**: 5 Sheet chuyên biệt (Kho & Giá, Hóa Đơn, Sổ Nợ, Nhập Hàng, Lịch Sử Chốt Ca).
- **⏱️ Chốt Ca & Kiểm Kê Tiền Mặt**: Tự động thông báo chốt ca 22:00, đếm tiền mặt theo từng mệnh giá VND.
- **💳 Thanh Toán Linh Hoạt**: Tiền mặt tính tiền thừa, VietQR (xác minh thủ công, xem bên dưới), Sổ ghi nợ khách quen.
- **🎁 Tích Điểm Khách Quen**: Tích điểm & đổi quà theo Tên + 4 số cuối điện thoại.
- **🔢 Mã Đơn & Mã Hàng Tuần Tự**: Đơn hàng do server cấp theo ngày, dạng `HD-YYYYMMDD-0001` (mỗi ngày đếm lại từ 0001, không dùng lại mã đã cấp). Sản phẩm mới do server cấp dạng `SP-0001`, `SP-0002`, … Mã đơn và mã hàng được lưu bền trong file dữ liệu nên không bị trùng sau khi khởi động lại. Đơn cũ không có mã vẫn giữ nguyên mã cũ để tương thích.
- **📦 Quét Mã Để Nhập Hàng (Scan-to-Import)**: Quét hoặc gõ mã vạch ở màn hình Nhập Hàng — nếu có trong kho, sản phẩm vào phiếu nhập và hiển thị rõ **Giá bán hiện tại**; nếu chưa có, form tạo nhanh mở ngay trên cùng màn hình (điền tên, giá vốn, giá bán — giá bán hiển thị trực tiếp khi gõ, mã hàng `SP-xxxx` do server cấp khi lưu), lưu xong sản phẩm vào phiếu nhập ngay. Quét mã lạ ở màn hình bán hàng sẽ không tự tạo sản phẩm mà chỉ nhắc mở mục Nhập Hàng để tạo nhanh.

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
*(Hoặc nhấp đúp chuột vào file `CHAY_PHAN_MEM_TAP_HOA.bat` trên Windows — đây là script chạy chuẩn duy nhất; file trùng lặp cũ đã được gỡ.)*

Biến môi trường tùy chọn: `PORT` (mặc định 5000), `LAN_IP` (ép IP LAN hiển thị), `TAPHOALAN_DATA_DIR`, `TAPHOALAN_BACKUPS_DIR`, `TAPHOALAN_UPLOADS_DIR` (dùng khi chạy thử với bản sao dữ liệu).

### 4. Đổi mã PIN chủ tiệm ngay trong lần chạy đầu tiên (bắt buộc)
1. Mở app, bấm **Menu Quản Lý > Mở Khóa**, nhập mã PIN chủ tiệm hiện tại để mở khóa.
2. Trong cùng menu, điền **PIN cũ, PIN mới, nhập lại PIN mới** rồi bấm **Đổi PIN**.
3. Đổi PIN xong, bấm **Khóa Lại** khi rời quầy.

Lưu ý về PIN và phiên đăng nhập:
- PIN được băm bằng scrypt ở server, không bao giờ lưu dạng text thường, không lưu trong localStorage và không trả về qua API.
- Sau khi nhập PIN đúng, server cấp một token chủ tiệm lưu trong sessionStorage, hiệu lực 8 giờ. Khởi động lại trình duyệt hoặc server là phải nhập PIN lại.
- Nhập sai PIN quá 5 lần từ một IP trong 5 phút sẽ bị khóa tạm 5 phút.
- Các thao tác chủ tiệm (đổi cài đặt, đổi PIN, đổi giá/giá vốn, đồng bộ toàn bộ, chốt ca, tạo/tải/khôi phục sao lưu, xác nhận VietQR, đồng bộ WebSocket) đều yêu cầu token này; không có token sẽ trả về 401.

## 🌐 Truy Cập

- **Trên máy tính**: `http://localhost:5000`
- **Trên điện thoại / iPad**: `http://[IP_MÁY_TÍNH]:5000` (Quét mã QR từ nút "Quét ĐT" trên thanh menu).

## 💾 Sao Lưu & Khôi Phục

- Server tự sao lưu mỗi giờ vào thư mục `backups/`, giữ tối đa 24 file mới nhất (file cũ hơn tự xóa).
- Tải sao lưu: `GET /api/backups/:filename/download` (cần quyền chủ tiệm).
- Khôi phục: `POST /api/backups/restore` với `{ "filename": "backup_....json" }` (cần quyền chủ tiệm). Trước khi khôi phục, server tự sao lưu dữ liệu hiện tại, kiểm tra file sao lưu có đúng định dạng (có `products` và `orders`) rồi mới thay thế. PIN chủ tiệm hiện tại được giữ nguyên khi khôi phục (không bị quay về PIN cũ trong bản sao lưu).
- Ghi dữ liệu dùng ghi file nguyên tử (ghi file tạm, fsync, rồi đổi tên). Nếu file dữ liệu bị hỏng, server **không** tự thay bằng dữ liệu mặc định: file hỏng được chuyển thành `store_database.corrupt-<timestamp>.json` và API trả lỗi 500 rõ ràng; hãy khôi phục từ bản sao lưu gần nhất hoặc từ `store_database.last-good.json`.
- Dữ liệu thật (`data/`, `backups/`, `uploads/`, `.env`) đã được đưa vào `.gitignore` — đừng commit chúng lên kho public.

## 💳 VietQR — Xác Minh Thủ Công (Quan Trọng)

Đơn VietQR được tạo với trạng thái **chờ xác nhận** (`pending_vietqr`), không phải đã thanh toán. Quy trình đúng:
1. Bán hàng chọn VietQR, đơn chờ được tạo trước để lấy mã đơn thật (dạng `HD-YYYYMMDD-0001`).
2. Mã QR hiển thị đúng số tiền và nội dung chuyển khoản là mã đơn đó.
3. Người bán mở **app ngân hàng**, kiểm tra tiền đã về, đúng số tiền và đúng nội dung mã đơn.
4. Chỉ sau khi kiểm tra xong, chủ tiệm mới bấm **“Đã Kiểm Tra App Ngân Hàng — Xác Nhận Đã Nhận Tiền”**. Server chỉ đổi trạng thái sang đã thanh toán khi nhận đúng mã đơn, đúng số tiền và kèm token chủ tiệm (`POST /api/orders/:id/confirm-vietqr`).
5. Chưa có đối soát ngân hàng tự động (webhook/API ngân hàng) — đừng bấm xác nhận trước khi tiền về.

## 🎛️ 3 Chế Độ Giao Diện

Chuyển chế độ bằng 3 nút trên thanh điều hướng (👴 Lớn tuổi / ⚡ Người trẻ / 👑 Admin)
hoặc trong Cài đặt → “Chế Độ Giao Diện”. Chế độ Người lớn tuổi và Người trẻ được lưu
vào `localStorage` (`smartpos_app_mode`) nên tải lại trang vẫn giữ nguyên.

| Chế độ | Dành cho | Được làm | Bị giấu / hạn chế |
|---|---|---|---|
| 👴 Người lớn tuổi | Người lớn tuổi | Chữ to (~20px), nút bấm tối thiểu 60px, màn Bán Hàng đơn giản: tìm hàng theo tên/mã vạch, chọn nhóm hàng, bấm “Thêm”, giỏ hàng nút +/− to, tổng tiền rất lớn, chỉ 3 nút thanh toán Tiền mặt / VietQR / Ghi nợ và Xóa giỏ; Nhập hàng và Chốt ca vẫn dùng được | Không hiện giá vốn, không hiện chi tiết VAT/giảm giá/tích điểm, không có báo cáo hay menu quản lý trên màn bán hàng |
| ⚡ Người trẻ | Người bán hàng thường xuyên | Toàn bộ màn bán hàng tiêu chuẩn như trước, cộng strip “Tiện ích nhanh” trên đầu màn POS: số đơn hôm nay, doanh thu hôm nay, số món sắp hết hàng, và hàng yêu thích (bấm ★ trên thẻ hàng để ghim, lưu vào `localStorage`, bấm chip là thêm nhanh vào giỏ) | Không có tab trực tiếp cho mọi phân hệ quản lý — các phân hệ vẫn nằm sau menu Quản Lý như trước |
| 👑 Admin | Chủ tiệm | Tất cả chức năng, thanh điều hướng hiện tab trực tiếp cho mọi màn: Bán hàng, Bán điện thoại, Nhập hàng, Kho hàng, Sổ nợ, Hóa đơn & Thuế, Báo cáo, Cài đặt, kèm nhãn ADMIN | **Bắt buộc nhập PIN chủ tiệm** nếu phiên chưa mở khóa: bấm 👑 Admin khi chưa mở khóa sẽ mở hộp thoại PIN và chỉ chuyển sang Admin sau khi nhập đúng. Trạng thái mở khóa chỉ sống trong `sessionStorage` — tải lại trang, đóng trình duyệt hoặc bấm Khóa là thoát Admin về Người trẻ, không bao giờ lưu trạng thái mở khóa vào `localStorage` |

Lưu ý: ở chế độ Người lớn tuổi, màn Nhập hàng vẫn là màn nhập hiện có nhưng được phóng
to bởi CSS chế độ người lớn tuổi, chưa phải một màn nhập đơn giản riêng. Nhập bằng giọng
nói chưa làm trong đợt này — đó là bước tiếp theo có thể làm sau (ví dụ: đọc tên hàng
để tìm và thêm vào giỏ).

## 📱 Giao Diện Mọi Thiết Bị, Hiệu Ứng & Lịch Sử Theo Thiết Bị

- **Responsive:** bố cục dùng `clamp()` cho tiêu đề/tổng tiền, lưới hàng `repeat(auto-fill, minmax(...))`,
  navbar và nút bấm tự xuống dòng/cuộn ngang trên màn nhỏ. Các mốc: ≤480px điện thoại,
  481–768px điện thoại lớn/máy tính bảng nhỏ, 769–1024px máy tính bảng, 1025–1440px laptop,
  >1440px màn rộng. Bảng cuộn ngang trong khung riêng, không làm vỡ trang; modal vừa chiều cao
  màn hình và cuộn bên trong. Nút bấm tối thiểu 44px (chế độ người lớn tuổi giữ 60px, không bị thu nhỏ).
- **Hiệu ứng (nhẹ, không âm thanh tự động, không nhấp nháy):** nút bấm thu nhỏ khi nhấn, thẻ nâng nhẹ
  khi rê chuột, modal mờ dần + trượt lên, toast trượt vào, tổng tiền nhấp nhẹ khi thêm hàng, nút
  thanh toán hiện trạng thái “Đang lưu…” và bị khóa trong lúc lưu, và sau khi server xác nhận đơn
  sẽ hiện bảng “Thanh toán xong!” kèm dấu ✓. Tắt hết hiệu ứng khi hệ thống bật
  `prefers-reduced-motion: reduce`.
- **Định danh thiết bị:** mỗi trình duyệt tự tạo một mã ổn định lưu ở `localStorage`
  (`smartpos_device_id`), kèm tên thiết bị chỉnh được trong Cài đặt → “Tên thiết bị này”
  (mặc định theo dạng Máy tính/Điện thoại — trình duyệt, ví dụ đổi thành “Quầy 1”). Mã và tên này
  được gửi kèm mỗi đơn hàng và khi đăng ký WebSocket, nên bill nào cũng biết từ máy nào — kể cả
  máy từng mất mạng rồi đồng bộ lại. **Xóa dữ liệu trình duyệt sẽ tạo mã thiết bị mới**, đó là
  giới hạn cố hữu khi không có tài khoản đăng nhập trên POS LAN.
- **Lịch sử & Sổ ngày (chỉ chủ tiệm):** vào bằng Admin → tab “📱 Lịch Sử & Sổ Ngày”, hoặc
  menu Quản Lý, hoặc Cài đặt → “Xem Lịch sử thiết bị & Sổ ngày”. Dữ liệu lấy từ máy chủ chính
  (endpoint `GET /api/devices/history`, cần token chủ tiệm), lọc theo thiết bị, khoảng ngày và mã
  đơn; bấm “Chi tiết” xem từng mặt hàng, số lượng, giá, tổng tiền, hình thức và trạng thái thanh
  toán. Số điện thoại khách chỉ hiện dạng đã che (chỉ còn 2 số cuối). Tab “Sổ ngày” cho chọn ngày,
  xem tổng kết tự động tính từ bill (số đơn, tổng giá trị, đã thu, theo hình thức/trạng thái/thiết
  bị, danh sách mã đơn) và lưu ghi chú ngày (`POST /api/daily-notes`, lưu trên server, mở lại ngày
  đó vẫn thấy). Ngày tính theo lịch Việt Nam (Asia/Ho_Chi_Minh).
- **Luồng thanh toán:** đơn chỉ được coi là xong sau khi server trả về thành công
  (`POST /api/order`); nếu lưu thất bại, giỏ hàng giữ nguyên và không hiện “Thanh toán xong”.
  Đơn VietQR vẫn ở trạng thái chờ cho tới khi chủ tiệm xác nhận thủ công như mục VietQR ở trên.

## 🧪 Kiểm Thử

```bash
npm run lint
npm test
```

Test dùng `node:test` (không thêm framework), kiểm tra: mã đơn/mã hàng tuần tự và không dùng lại sau khởi động lại, server tính lại tổng tiền và từ chối bán vượt tồn, tra mã vạch, ghi file nguyên tử + cách ly file hỏng, băm PIN + giới hạn sai PIN, tên file sao lưu chống path traversal, nhận diện ảnh JPG/PNG/WebP theo magic byte.

## ⚠️ Những Gì Chưa Được Sửa (Cố Tình Giữ Nguyên Phạm Vi)

- **Không có HTTPS trên LAN**: server vẫn chạy HTTP nội bộ. Bù lại bằng Wi-Fi tin cậy, tách mạng khách và tường lửa chỉ cho thiết bị quầy truy cập cổng 5000.
- **Không có đối soát ngân hàng tự động**: VietQR vẫn xác minh thủ công như trên.
- **Chưa chuyển sang SQLite**: dữ liệu vẫn là file JSON duy nhất (đã có ghi nguyên tử, hàng đợi ghi và sao lưu xoay vòng). Khi số đơn/sản phẩm tăng mạnh, nên chuyển sang SQLite để có transaction thật.
- **Chưa có tài khoản nhân viên riêng**: vẫn là mô hình 1 token chủ tiệm + nhân viên không đăng nhập. Nhật ký thao tác chi tiết theo từng nhân viên chưa có.

## Cập nhật từ GitHub bằng 1 file (máy tiệm)

Nhấp đúp `CAP_NHAT_TU_GITHUB.bat` trong thư mục phần mềm (tắt cửa sổ server cũ trước).
File này sẽ: sao lưu `data/` và `uploads/` vào `cap-nhat-backup/<ngày_giờ>/`,
tải bản mới nhất từ GitHub, chỉ chép đè code mới (không xóa dữ liệu, backup, ảnh hàng),
chạy `npm install` + `npm run build` rồi khởi động lại server.
An toàn: nếu GitHub chưa có bản mới (thiếu màn Lịch sử thiết bị / màn Người lớn tuổi),
file sẽ dừng lại và KHÔNG chép đè gì cả.

## Chạy nhanh từ GitHub, không cần tải tay cả dự án

Nhấp đúp `CHAY_TU_XA.bat` (sau khi file này đã có trên GitHub).
File này tự lấy code mới nhất từ GitHub về thư mục tạm `%TEMP%\TapHoaLAN-chay-nhanh`,
chỉ lấy các file chạy phần mềm (bỏ qua thư mục Android), rồi chạy `npm install`,
`npm run build` và khởi động server tại `http://localhost:5000`.
Lưu ý: đây là bản chạy thử nhanh, dữ liệu lưu trong thư mục tạm, không phải
dữ liệu tiệm thật. Muốn dùng dữ liệu tiệm thật, dùng `CAP_NHAT_TU_GITHUB.bat`.

## Hướng dẫn đầy đủ + Theme + Sao lưu

Xem [HUONG_DAN.md](HUONG_DAN.md) để tải, chạy thử bằng CMD, chạy nhanh
từ xa, cập nhật từ GitHub, đổi PIN lần đầu, chọn theme và cài đặt sao lưu.

**Theme (chọn trong Cài đặt, hoặc bấm nút theme trên thanh trên cùng):**
Tối, Sáng, Xanh lá Tiệm, Xanh dương, Tím Hồng, Tương phản cao.
Theme chỉ đổi trên trình duyệt đang dùng, không đồng bộ qua mạng LAN.

**Sao lưu máy chủ (Cài đặt > Sao Lưu & Dự Phòng, cần PIN chủ tiệm):**
chu kỳ 15 phút / 30 phút / 1 giờ / 3 giờ / 6 giờ / 12 giờ / 24 giờ
hoặc tắt; giữ lại 12 / 24 / 48 / 96 bản; thư mục dự phòng (mirror)
tùy chọn để chép thêm mỗi bản sao lưu sang ổ khác hoặc USB.
Khuyến nghị: tiệm đông 30–60 phút, tiệm bình thường 1–3 giờ,
tiệm nhỏ 6–12 giờ, luôn sao lưu ngay trước khi chốt ca và chép một
bản ra khỏi máy mỗi ngày.
