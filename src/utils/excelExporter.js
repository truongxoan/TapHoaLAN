import * as XLSX from 'xlsx';

export const exportStoreToExcel = ({
  products = [],
  orders = [],
  debts = [],
  purchases = [],
  shifts = [],
  taxSettings = {},
}) => {
  const wb = XLSX.utils.book_new();
  const dateStr = new Date().toISOString().slice(0, 10);

  // 1. SHEET: KHO HÀNG & BẢNG GIÁ
  const productsData = products.map((p, idx) => ({
    'STT': idx + 1,
    'Mã Vạch': p.barcode || '',
    'Tên Sản Phẩm': p.name || '',
    'Danh Mục': p.category || '',
    'Đơn Vị Lẻ': p.unit || '',
    'Giá Vốn Lẻ (đ)': p.costPrice || 0,
    'Giá Bán Lẻ (đ)': p.price || 0,
    'Quy Cách Đóng Gói': p.hasBoxUnit ? `1 ${p.boxUnitName || 'Thùng'} = ${p.boxConversion || 24} ${p.unit}` : 'Bán lẻ',
    'Giá Vốn 1 Thùng (đ)': p.boxCostPrice || (p.costPrice * (p.boxConversion || 1)),
    'Giá Bán 1 Thùng (đ)': p.boxPrice || (p.price * (p.boxConversion || 1)),
    'Tồn Kho Lẻ': p.stock || 0,
    'Quy Đổi Thùng': p.hasBoxUnit && p.boxConversion ? `~${Math.floor(p.stock / p.boxConversion)} Thùng` : '—',
    'Thuế VAT (%)': p.vatRate || 8,
  }));
  const wsProducts = XLSX.utils.json_to_sheet(productsData);
  XLSX.utils.book_append_sheet(wb, wsProducts, '1. Kho Hàng & Giá');

  // 2. SHEET: HÓA ĐƠN BÁN HÀNG
  const ordersData = orders.map((o, idx) => ({
    'STT': idx + 1,
    'Mã Hóa Đơn': o.id,
    'Thời Gian': new Date(o.createdAt).toLocaleString('vi-VN'),
    'Khách Hàng': o.customerName || 'Khách lẻ',
    'SĐT Khách': o.customerPhone || '',
    'Số Món': o.items ? o.items.length : 0,
    'Tổng Tiền Hàng (đ)': o.subtotal || 0,
    'Giảm Giá (đ)': o.discount || 0,
    'Thuế VAT (đ)': o.totalVat || 0,
    'Khách Phải Trả (đ)': o.total || 0,
    'Tiền Lời Gộp (đ)': o.profit || 0,
    'Phương Thức': o.paymentMethod === 'vietqr' ? 'VietQR' : o.paymentMethod === 'debt' ? 'Ghi Nợ' : 'Tiền Mặt',
    'Trạng Thái': o.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán',
  }));
  const wsOrders = XLSX.utils.json_to_sheet(ordersData);
  XLSX.utils.book_append_sheet(wb, wsOrders, '2. Hóa Đơn Bán Hàng');

  // 3. SHEET: SỔ GHI NỢ KHÁCH QUEN
  const debtsData = debts.map((d, idx) => ({
    'STT': idx + 1,
    'Mã Sổ Nợ': d.id,
    'Tên Khách Quen': d.customerName,
    'Số Điện Thoại': d.phone || '',
    'Tổng Tiền Mua Nợ (đ)': d.totalDebt || 0,
    'Đã Trả Bớt (đ)': (d.totalDebt || 0) - (d.remainingDebt || 0),
    'CÒN NỢ LẠI (đ)': d.remainingDebt || 0,
    'Ngày Mở Sổ': new Date(d.createdAt).toLocaleDateString('vi-VN'),
    'Trạng Thái': d.remainingDebt === 0 ? 'ĐÃ HẾT NỢ' : 'ĐANG NỢ',
  }));
  const wsDebts = XLSX.utils.json_to_sheet(debtsData);
  XLSX.utils.book_append_sheet(wb, wsDebts, '3. Sổ Ghi Nợ');

  // 4. SHEET: LỊCH SỬ NHẬP KHO
  const purchasesData = purchases.map((p, idx) => ({
    'STT': idx + 1,
    'Mã Phiếu Nhập': p.id,
    'Thời Gian': new Date(p.createdAt).toLocaleString('vi-VN'),
    'Nhà Phân Phối': p.supplierName || '',
    'Số Mặt Hàng': p.items ? p.items.length : 0,
    'Tiền Hàng (đ)': p.totalCost || 0,
    'Thuế VAT Đầu Vào (đ)': p.inputVat || 0,
    'Tổng Tiền Phiếu (đ)': p.grandTotal || 0,
    'Ghi Chú': p.notes || '',
  }));
  const wsPurchases = XLSX.utils.json_to_sheet(purchasesData);
  XLSX.utils.book_append_sheet(wb, wsPurchases, '4. Nhập Kho');

  // 5. SHEET: LỊCH SỬ CHỐT CA
  const shiftsData = shifts.map((s, idx) => ({
    'STT': idx + 1,
    'Mã Ca': s.id || '',
    'Ngày Chốt Ca': s.shiftDate || '',
    'Khung Giờ': s.shiftTimeRange || '04:00 - 22:00',
    'Người Chốt': s.cashier || '',
    'Số Đơn Bán': s.ordersCount || 0,
    'Tổng Doanh Thu (đ)': s.totalRevenue || 0,
    'Tiền Mặt Sổ Sách (đ)': s.totalCash || 0,
    'Chuyển Khoản VietQR (đ)': s.totalVietQr || 0,
    'Bán Nợ (đ)': s.totalDebt || 0,
    'Tiền Mặt Đếm Thực Tế (đ)': s.actualCashCounted || 0,
    'Lệch Tiền Mặt (đ)': s.cashDifference || 0,
    'Đánh Giá': s.cashDifference === 0 ? 'Khớp tiền 100%' : s.cashDifference > 0 ? 'Dư tiền' : 'Thiếu tiền',
  }));
  const wsShifts = XLSX.utils.json_to_sheet(shiftsData);
  XLSX.utils.book_append_sheet(wb, wsShifts, '5. Lịch Sử Chốt Ca');

  // Generate and Trigger Download
  const filename = `SaoLuu_TapHoa_${taxSettings.storeName ? taxSettings.storeName.slice(0, 15).replace(/\s+/g, '_') : 'SmartPOS'}_${dateStr}.xlsx`;
  XLSX.writeFile(wb, filename);

  return filename;
};
