# Hướng dẫn TapHoaLAN — Tải, chạy thử, cập nhật, chọn theme và sao lưu

Phần mềm bán hàng tạp hóa chạy trên mạng LAN nội bộ. Máy tính làm máy chủ,
điện thoại và máy tính khác trong cùng Wi-Fi mở trình duyệt là bán được.
Chỉ dùng trên Wi-Fi tin cậy, tách mạng khách, không mở port ra Internet.

> Lưu ý an toàn: hướng dẫn này không ghi mã PIN, tài khoản ngân hàng,
> số điện thoại hay mã token nào. Mã PIN gốc của nhà sản xuất chỉ dùng
> lần đầu và phải đổi ngay (xem bước 5).

## 1. Tải từ GitHub

Cách A — tải file zip (không cần biết Git):

1. Mở https://github.com/truongxoan/TapHoaLAN
2. Bấm nút xanh `Code` rồi chọn `Download ZIP`.
3. Giải nén ra một thư mục riêng, ví dụ `E:\TapHoaLAN`.

Cách B — clone bằng Git (máy đã cài Git):

```cmd
git clone https://github.com/truongxoan/TapHoaLAN.git
cd TapHoaLAN
```

## 2. Chạy thử bằng CMD (máy Windows)

Mở CMD trong thư mục vừa giải nén hoặc clone, dán từng lệnh, chờ mỗi
lệnh chạy xong mới dán lệnh tiếp:

```cmd
node -v
npm install
npm run build
npm start
```

Giải thích: kiểm tra Node đã cài chưa, cài thư viện, biên dịch giao
diện, rồi chạy máy chủ. Cửa sổ CMD phải để mở suốt lúc bán thử, tắt
CMD là máy chủ tắt theo. Sau khi thấy dòng máy chủ đang hoạt động, mở
trình duyệt vào:

```
http://localhost:5000
```

Nếu máy báo chưa có Node, cài Node LTS ở https://nodejs.org rồi chạy
lại từ lệnh `npm install`. Nếu port 5000 bị chiếm, dừng lại và chạy
thay cho lệnh cuối:

```cmd
set PORT=5001 && npm start
```

rồi mở `http://localhost:5001`.

Điện thoại cùng Wi-Fi: trên máy tính chạy `ipconfig`, tìm dòng IPv4,
ví dụ máy tính là `192.168.1.20` thì điện thoại mở
`http://192.168.1.20:5000`. Nếu điện thoại không vào được, kiểm tra xem
điện thoại có cùng Wi-Fi với máy tính không và Windows có hiện bảng hỏi
cho phép qua firewall không, bấm cho phép mạng riêng.

## 3. Chạy nhanh từ xa bằng CHAY_TU_XA.bat (không cần tải tay cả dự án)

Chỉ cần file `CHAY_TU_XA.bat` (đã có trên GitHub). Trên máy muốn chạy,
mở CMD và dán lần lượt:

```cmd
rmdir /S /Q "%TEMP%\TapHoaLAN-chay-nhanh"
powershell -Command "Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/truongxoan/TapHoaLAN/main/CHAY_TU_XA.bat' -OutFile '%TEMP%\CHAY_TU_XA.bat'"
"%TEMP%\CHAY_TU_XA.bat"
```

File này tự lấy code mới nhất từ GitHub về thư mục tạm, chỉ lấy các
file chạy phần mềm (bỏ qua thư mục Android), rồi chạy `npm install`,
`npm run build` và khởi động tại `http://localhost:5000`.

**Giới hạn phải biết, đừng sửa file này để lách:** bản chạy nhanh lưu
dữ liệu trong thư mục tạm, KHÔNG phải dữ liệu tiệm thật của bạn. Nó
chỉ để chạy thử nhanh trên máy mới. Muốn dùng dữ liệu tiệm thật, dùng
file cập nhật ở bước 4, không dùng file chạy nhanh này.

## 4. Cập nhật bằng CAP_NHAT_TU_GITHUB.bat (máy tiệm)

Trong thư mục phần mềm của tiệm, tắt cửa sổ máy chủ cũ trước, rồi
nhấp đúp `CAP_NHAT_TU_GITHUB.bat`. File này làm lần lượt:

1. Sao lưu dữ liệu bán hàng và ảnh hàng vào thư mục
   `cap-nhat-backup` kèm ngày giờ.
2. Tải bản mới nhất từ GitHub về máy.
3. Kiểm tra trước: nếu bản tải về thiếu màn Lịch sử thiết bị hoặc màn
   Người lớn tuổi, tức là GitHub chưa có bản mới, file sẽ dừng lại và
   KHÔNG chép đè gì cả, dữ liệu của bạn vẫn nguyên.
4. Chỉ chép đè code mới, giữ nguyên dữ liệu, backup và ảnh hàng.
5. Chạy `npm install`, `npm run build`, rồi khởi động lại máy chủ.

## 5. Đổi mã PIN lần đầu (bắt buộc)

1. Mở app, vào Menu Quản Lý.
2. Đăng nhập bằng mã PIN gốc của nhà sản xuất.
3. Đổi sang mã PIN mới của bạn ngay, rồi khóa lại khi rời quầy.
4. Đừng để mã PIN gốc chạy trên Wi-Fi tiệm. Đóng trình duyệt hoặc bấm
   khóa là phiên chủ tiệm hết hiệu lực, lần sau phải nhập PIN lại.

## 6. Chọn giao diện (theme)

Theme chỉ đổi trên trình duyệt đang dùng, không đồng bộ sang máy khác
trong mạng LAN, và không làm thay đổi chế độ, mã PIN hay dữ liệu.

Cách chọn đầy đủ: vào Cài đặt, thẻ “Giao Diện (Theme)”, bấm một theme,
xem trước thẻ hàng mẫu, nút và tổng tiền ngay bên dưới rồi mới chốt.
Cách chọn nhanh: bấm nút tên theme trên thanh trên cùng, mỗi lần bấm
đổi sang theme tiếp theo trong danh sách.

| Theme | Hợp với |
| --- | --- |
| Tối | Bán buổi tối, dịu mắt, dùng nhiều nhất ở quầy |
| Sáng | Ban ngày, rõ ràng, hợp in ấn |
| Xanh lá Tiệm | Tiệm rau quả, tươi mát, nhẹ mắt cả ngày |
| Xanh dương | Chuyên nghiệp, bình tĩnh, dễ đọc giá và tổng tiền |
| Tím Hồng | Tiệm trẻ, tiệm quà, mềm mại và nổi bật |
| Tương phản cao | Người mắt kém và chế độ người lớn tuổi: chữ đen trên nền trắng, viền đậm |

Theme Tương phản cao không làm nhỏ nút của chế độ người lớn tuổi:
nút vẫn tối thiểu 60px, ô nhập vẫn tối thiểu 56px.

## 7. Chọn chế độ: người lớn tuổi / người trẻ / Admin

- **Người lớn tuổi:** chữ to, nút to, chỉ bán hàng đơn giản: tìm hàng,
  thêm vào giỏ, thu Tiền mặt / VietQR / Ghi nợ. Không hiện giá vốn,
  VAT, tích điểm hay báo cáo. Thanh trên cùng chỉ còn Bán Hàng, Nhập
  Hàng, Chốt Ca.
- **Người trẻ (mặc định):** giao diện bán hàng tiêu chuẩn đầy đủ, thêm
  dải “Tiện ích nhanh”: đơn và doanh thu hôm nay, món sắp hết hàng,
  hàng yêu thích ghim nhanh.
- **Admin (Chủ tiệm):** tất cả chức năng, tab trực tiếp không giấu sau
  menu. Cần nhập PIN chủ tiệm nếu chưa mở khóa; tắt trình duyệt hoặc
  khóa PIN là thoát Admin, không lưu trạng thái mở khóa.

Đổi chế độ trong Cài đặt, thẻ “Chế Độ Giao Diện”, hoặc bằng 3 nút trên
thanh trên cùng.

## 8. Cài đặt sao lưu và dự phòng

Có 2 loại sao lưu, đừng nhầm lẫn:

- **Sao lưu máy chủ (chính):** file trong thư mục `backups` của máy
  chủ, do máy chủ tự tạo theo chu kỳ, tải về và khôi phục được trong
  Cài đặt, thẻ “Sao Lưu & Dự Phòng (Máy Chủ)”. Chỉ chủ tiệm mở khóa
  PIN mới đổi được cấu hình này.
- **Snapshot trong trình duyệt (phụ):** bản sao lưu trong trình duyệt
  đang dùng, ở thẻ “Tự Động Sao Lưu Theo Giờ” trong Cài đặt. Nó chỉ là
  bản phụ, xóa dữ liệu trình duyệt là mất, không thay thế được bản
  máy chủ.

### Chọn chu kỳ sao lưu máy chủ

Trong Cài đặt, thẻ “Sao Lưu & Dự Phòng (Máy Chủ)”, chọn:

- **Tắt:** chỉ sao lưu tay khi bấm “Sao lưu ngay”.
- **15 phút, 30 phút:** tiệm đông, bán liên tục, mất 1 giờ dữ liệu
  cũng là thiệt hại lớn.
- **1 giờ:** mặc định, hợp hầu hết các tiệm.
- **3 giờ, 6 giờ, 12 giờ, 24 giờ:** tiệm vắng, ít đơn.

Khuyến nghị:

- **Tiệm đông:** 30–60 phút.
- **Tiệm bình thường:** 1–3 giờ.
- **Tiệm nhỏ, ít đơn:** 6–12 giờ.
- Ngoài chu kỳ tự động, luôn bấm “Sao lưu ngay” trước khi chốt ca,
  và mỗi ngày chép một bản ra khỏi máy chủ (USB hoặc ổ khác, xem
  mục dự phòng dưới đây).

Số bản giữ lại chọn 12, 24, 48 hoặc 96 bản. Bản cũ nhất sẽ tự xóa khi
vượt quá số này, nên đừng đặt quá ít nếu bạn muốn khôi phục về nhiều
ngày trước.

### Sao lưu dự phòng (thư mục mirror)

Trong cùng thẻ sao lưu, nhập đường dẫn tuyệt đối của một thư mục khác,
ví dụ ổ USB hoặc ổ khác trên cùng máy, ví dụ `D:\SaoLuuTapHoa`.
Mỗi bản sao lưu mới sẽ được chép thêm sang thư mục đó. Nếu thư mục
dự phòng bị rút USB, đầy ổ hoặc không ghi được, bản chính vẫn an
toàn, chỉ hiện cảnh báo trong thẻ sao lưu. Không được chọn thư mục
nằm trong thư mục sao lưu chính, và không được nhập đường dẫn tương
đối.

### Khôi phục

1. Vào Cài đặt, thẻ “Sao Lưu & Dự Phòng (Máy Chủ)”, cần mở khóa PIN.
2. Trong danh sách bản sao lưu máy chủ, bấm “Khôi phục” ở bản muốn
   về. Máy chủ sẽ tự sao lưu dữ liệu hiện tại trước rồi mới thay thế,
   và giữ nguyên mã PIN hiện tại (không hồi sinh mã PIN cũ).
3. Tải lại trang để thấy dữ liệu sau khôi phục. Nếu khôi phục nhầm,
   khôi phục lại từ bản “Sao lưu trước khi khôi phục” vừa tạo.

## 9. Xử lý 3 lỗi Windows hay gặp nhất

1. **Lỗi `Cannot find package 'express'` (hoặc tên thư viện khác):**
   Bạn chạy máy chủ khi chưa có thư mục `node_modules`. Vào thư mục
   phần mềm, chạy `npm install`, rồi `npm run build`, rồi `npm start`.
   Đừng nhấp đúp file chạy khi chưa có `node_modules`.

2. **Lỗi cổng đã bị chiếm (port 5000 đã dùng):** một cửa sổ máy chủ
   cũ vẫn đang chạy. Tắt cửa sổ cũ đi, hoặc chạy với cổng khác:
   `set PORT=5001 && npm start` rồi mở `http://localhost:5001`.

3. **Mở trình duyệt chỉ thấy trang JSON trắng, không thấy giao diện:**
   Bạn đã mở nhầm địa chỉ (ví dụ mở link tải file, hoặc mở địa chỉ
   API). Đóng tab đó, mở tab mới và gõ tay `http://localhost:5000`,
   rồi bấm Ctrl+F5. Địa chỉ giao diện luôn là `localhost` cộng cổng
   máy chủ, không phải link tải file.
