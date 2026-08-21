import React, { useState } from 'react';
import {
  Settings,
  Store,
  CreditCard,
  Building2,
  FileSpreadsheet,
  Download,
  Upload,
  RotateCcw,
  Smartphone,
  CheckCircle,
  Save,
  Plus,
  Users,
  ExternalLink,
  Code2,
  Clock,
  ShieldCheck,
  History,
  Trash2,
  Database,
  QrCode,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { exportStoreToExcel } from '../utils/excelExporter';

export const SettingsScreen = () => {
  const {
    taxSettings,
    setTaxSettings,
    suppliers,
    addSupplier,
    updateSupplier,
    resetToSampleData,
    products,
    orders,
    purchases,
    debts,
    backupSnapshots,
    autoBackupIntervalHours,
    setAutoBackupIntervalHours,
    createBackupSnapshot,
    restoreBackupSnapshot,
    deleteBackupSnapshot,
    downloadSnapshotFile,
    lastBackupTime,
    shiftsHistory,
    setMobileConnectOpen,
    showToast,
  } = useStore();

  const [form, setForm] = useState({ ...taxSettings });
  const [supplierModal, setSupplierModal] = useState(false);
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    taxId: '',
    debt: 0,
  });

  const handleSaveStoreSettings = (e) => {
    e.preventDefault();
    setTaxSettings(form);
    showToast('Đã lưu cấu hình tiệm tạp hóa thành công!', 'success');
  };

  const handleManualBackupNow = () => {
    const snap = createBackupSnapshot('Sao lưu thủ công tại quầy');
    if (snap) {
      showToast('Đã tạo bản sao lưu Snapshot mới nhất thành công!', 'success');
    }
  };

  const handleRestore = (snap) => {
    if (
      window.confirm(
        `Bạn có chắc chắn muốn khôi phục dữ liệu về thời điểm "${new Date(
          snap.timestamp
        ).toLocaleString('vi-VN')}" không? Dữ liệu hiện tại sẽ được thay thế bằng bản sao lưu này.`
      )
    ) {
      restoreBackupSnapshot(snap.id);
    }
  };

  // Export all data to multi-sheet real Excel (.XLSX)
  const handleExportExcel = () => {
    try {
      const filename = exportStoreToExcel({
        products,
        orders,
        debts,
        purchases,
        shifts: shiftsHistory,
        taxSettings,
      });
      showToast(`Đã xuất thành công tệp Excel: ${filename}`, 'success');
    } catch (err) {
      console.error('Export Excel Error:', err);
      showToast('Lỗi khi tạo file Excel!', 'danger');
    }
  };

  // Export all data as JSON
  const handleExportData = () => {
    const fullData = {
      version: '3.0',
      exportDate: new Date().toISOString(),
      products,
      orders,
      purchases,
      suppliers,
      taxSettings,
      debts,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `TapHoa_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast('Đã xuất file sao lưu dữ liệu JSON thành công!', 'success');
  };

  const handleSaveSupplier = (e) => {
    e.preventDefault();
    if (!supplierForm.name) {
      showToast('Vui lòng nhập tên nhà cung cấp!', 'warning');
      return;
    }
    addSupplier(supplierForm);
    setSupplierModal(false);
    setSupplierForm({ name: '', phone: '', email: '', address: '', taxId: '', debt: 0 });
  };

  const VIETQR_BANKS = [
    { id: 'MB', name: 'MBBank (Ngân Hàng Quân Đội)' },
    { id: 'VCB', name: 'Vietcombank (Ngoại Thương)' },
    { id: 'TCB', name: 'Techcombank (Kỹ Thương)' },
    { id: 'BIDV', name: 'BIDV (Đầu Tư & Phát Triển)' },
    { id: 'CTG', name: 'VietinBank (Công Thương)' },
    { id: 'ACB', name: 'ACB (Á Châu)' },
    { id: 'VPB', name: 'VPBank (Việt Nam Thịnh Vượng)' },
    { id: 'TPB', name: 'TPBank (Tiên Phong)' },
    { id: 'STB', name: 'Sacombank (Sài Gòn Thương Tín)' },
    { id: 'VIB', name: 'VIB (Quốc Tế)' },
  ];

  return (
    <div>
      {/* Top Title */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Settings size={28} color="var(--primary)" />
            <span>Cài Đặt Cửa Hàng, Tự Động Sao Lưu & Mobile</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '2px' }}>
            Cấu hình thông tin tiệm tạp hóa, thanh toán VietQR, tự động sao lưu dữ liệu theo giờ và kết nối điện thoại
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.25rem' }}>
        {/* LEFT COLUMN: Store Info, Tax & Auto-Backup */}
        <div>
          {/* HOURLY AUTO-BACKUP SYSTEM (Tự động sao lưu theo giờ) */}
          <div
            className="card"
            style={{
              marginBottom: '1.25rem',
              border: '2px solid var(--primary-border)',
              background: 'linear-gradient(180deg, var(--bg-card) 0%, var(--bg-secondary) 100%)',
            }}
          >
            <div className="card-header">
              <span style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                <Clock size={20} />
                <span>Hệ Thống Tự Động Sao Lưu Theo Giờ (Auto-Backup)</span>
              </span>

              <button
                className="btn btn-primary btn-sm"
                onClick={handleManualBackupNow}
              >
                <Database size={14} />
                <span>Sao Lưu Ngay</span>
              </button>
            </div>

            <div className="card-body">
              {/* Interval selection */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--bg-card)',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  marginBottom: '1rem',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                    Tần suất tự động sao lưu:
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Lần sao lưu gần nhất: {new Date(lastBackupTime).toLocaleString('vi-VN')}
                  </div>
                </div>

                <select
                  className="form-control"
                  style={{ width: 'auto', minWidth: '160px', fontWeight: 600 }}
                  value={autoBackupIntervalHours}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setAutoBackupIntervalHours(val);
                    showToast(`Đã đổi tần suất sao lưu thành: Mỗi ${val} giờ!`, 'success');
                  }}
                >
                  <option value="1">Mỗi 1 giờ (Khuyên dùng)</option>
                  <option value="2">Mỗi 2 giờ</option>
                  <option value="4">Mỗi 4 giờ</option>
                  <option value="6">Mỗi 6 giờ</option>
                  <option value="12">Mỗi 12 giờ</option>
                  <option value="24">Mỗi ngày (24 giờ)</option>
                </select>
              </div>

              {/* Snapshots Table */}
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <History size={16} color="var(--primary)" />
                  <span>Lịch sử các bản sao lưu Snapshot ({backupSnapshots.length}):</span>
                </div>

                {backupSnapshots.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Chưa có bản sao lưu tự động nào. Bấm "Sao Lưu Ngay" ở trên để tạo bản đầu tiên!
                  </div>
                ) : (
                  <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                          <th style={{ padding: '0.5rem 0.75rem' }}>Thời Gian</th>
                          <th style={{ padding: '0.5rem 0.5rem' }}>Nội Dung</th>
                          <th style={{ padding: '0.5rem 0.5rem' }}>Dung Lượng</th>
                          <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Khôi Phục / Tải</th>
                        </tr>
                      </thead>
                      <tbody>
                        {backupSnapshots.map((snap) => (
                          <tr key={snap.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '0.5rem 0.75rem' }}>
                              <div style={{ fontWeight: 700 }}>
                                {new Date(snap.timestamp).toLocaleTimeString('vi-VN')}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                {new Date(snap.timestamp).toLocaleDateString('vi-VN')}
                              </div>
                            </td>

                            <td style={{ padding: '0.5rem 0.5rem', color: 'var(--text-secondary)' }}>
                              {snap.productsCount} mặt hàng • {snap.ordersCount} HĐ • {snap.debtsCount || 0} nợ
                            </td>

                            <td style={{ padding: '0.5rem 0.5rem', fontFamily: 'var(--font-mono)' }}>
                              {snap.sizeKb} KB
                            </td>

                            <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                                <button
                                  className="btn btn-success btn-sm"
                                  title="Khôi phục lại dữ liệu bản này"
                                  onClick={() => handleRestore(snap)}
                                >
                                  <RotateCcw size={12} />
                                  <span>Phục hồi</span>
                                </button>
                                <button
                                  className="btn btn-secondary btn-sm"
                                  title="Tải về file JSON"
                                  onClick={() => downloadSnapshotFile(snap.id)}
                                >
                                  <Download size={12} />
                                </button>
                                <button
                                  className="btn btn-danger btn-sm"
                                  title="Xóa bản sao lưu này"
                                  onClick={() => deleteBackupSnapshot(snap.id)}
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Excel & JSON Backup Action Buttons */}
              <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-success"
                  style={{ flex: 1, fontWeight: 800, padding: '0.6rem 1rem' }}
                  onClick={handleExportExcel}
                >
                  <FileSpreadsheet size={18} />
                  <span>Xuất Toàn Bộ Sổ Sách Ra File Excel (.xlsx)</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleExportData}
                  title="Xuất file JSON dữ liệu thô"
                >
                  <Download size={15} />
                  <span>JSON</span>
                </button>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveStoreSettings}>
            {/* Store & Tax Identity */}
            <div className="card" style={{ marginBottom: '1.25rem' }}>
              <div className="card-header">
                <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Store size={18} color="var(--primary)" />
                  <span>Thông Tin Tiệm Tạp Hóa & Mã Số Thuế</span>
                </span>
              </div>

              <div className="card-body">
                <div className="form-group">
                  <label className="form-label">Tên tiệm tạp hóa *:</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={form.storeName}
                    onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Khẩu hiệu / Giới thiệu:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.storeSlogan}
                    onChange={(e) => setForm({ ...form, storeSlogan: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Mã số thuế (nếu có):</label>
                    <input
                      type="text"
                      className="form-control"
                      style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                      value={form.storeTaxId}
                      onChange={(e) => setForm({ ...form, storeTaxId: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Hotline / Số điện thoại *:</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      value={form.storePhone}
                      onChange={(e) => setForm({ ...form, storePhone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Địa chỉ tiệm tạp hóa:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.storeAddress}
                    onChange={(e) => setForm({ ...form, storeAddress: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Lời cảm ơn chân hóa đơn:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.invoiceFooterNote}
                    onChange={(e) => setForm({ ...form, invoiceFooterNote: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* VietQR Bank Account Settings */}
            <div className="card" style={{ marginBottom: '1.25rem' }}>
              <div className="card-header">
                <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CreditCard size={18} color="var(--primary)" />
                  <span>Tài Khoản Nhận Tiền VietQR</span>
                </span>
              </div>

              <div className="card-body">
                <div className="form-group">
                  <label className="form-label">Ngân hàng:</label>
                  <select
                    className="form-control"
                    value={form.bankId}
                    onChange={(e) => {
                      const selected = VIETQR_BANKS.find((b) => b.id === e.target.value);
                      setForm({
                        ...form,
                        bankId: e.target.value,
                        bankName: selected ? selected.name : form.bankName,
                      });
                    }}
                  >
                    {VIETQR_BANKS.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Số tài khoản ngân hàng *:</label>
                    <input
                      type="text"
                      className="form-control"
                      style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                      required
                      value={form.accountNo}
                      onChange={(e) => setForm({ ...form, accountNo: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tên chủ tài khoản (In hoa không dấu) *:</label>
                    <input
                      type="text"
                      className="form-control"
                      style={{ textTransform: 'uppercase', fontWeight: 700 }}
                      required
                      value={form.accountName}
                      onChange={(e) =>
                        setForm({ ...form, accountName: e.target.value.toUpperCase() })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary btn-lg">
                  <Save size={18} />
                  <span>Lưu Cài Đặt Cửa Hàng</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: Mobile Connect & Suppliers */}
        <div>
          {/* MOBILE SCANNER CONNECTION (Biến điện thoại thành máy quét) */}
          <div
            className="card"
            style={{
              marginBottom: '1.25rem',
              border: '2px solid var(--primary-border)',
              background: 'linear-gradient(180deg, var(--bg-card) 0%, var(--bg-secondary) 100%)',
            }}
          >
            <div className="card-header">
              <span style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                <Smartphone size={20} />
                <span>Nhập Hàng & Quét Mã Bằng Điện Thoại</span>
              </span>
            </div>

            <div className="card-body" style={{ fontSize: '0.85rem' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Bạn có thể mở giao diện quét mã trên điện thoại để đi quanh kho quét mã vạch nhập hàng hoặc kiểm kê:
              </p>

              <button
                className="btn btn-primary btn-lg"
                style={{ width: '100%', marginBottom: '0.75rem' }}
                onClick={() => setMobileConnectOpen(true)}
              >
                <QrCode size={18} />
                <span>Hiện Mã QR Kết Nối Điện Thoại</span>
              </button>

              <div
                style={{
                  background: 'var(--bg-card)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.8rem',
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--success)' }}>
                  ✓ Quét liên tục không giới hạn
                </div>
                <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
                  Camera điện thoại tự động quét và lưu trực tiếp vào hệ thống.
                </div>
              </div>
            </div>
          </div>

          {/* Suppliers Management */}
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <div className="card-header">
              <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={18} color="var(--primary)" />
                <span>Nhà Phân Phối Tạp Hóa ({suppliers.length})</span>
              </span>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setSupplierModal(true)}
              >
                <Plus size={14} />
                <span>Thêm</span>
              </button>
            </div>

            <div className="card-body" style={{ maxHeight: '240px', overflowY: 'auto' }}>
              {suppliers.map((sup) => (
                <div
                  key={sup.id}
                  style={{
                    padding: '0.6rem 0',
                    borderBottom: '1px solid var(--border-color)',
                    fontSize: '0.8rem',
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{sup.name}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                    SĐT: {sup.phone} • {sup.address}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Backup & Sample Data Controls */}
          <div className="card">
            <div className="card-header">
              <span style={{ fontWeight: 700 }}>Sao Lưu Dữ Liệu Ra File Ngoài</span>
            </div>

            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <button
                  className="btn btn-secondary"
                  style={{ justifyContent: 'flex-start' }}
                  onClick={handleExportData}
                >
                  <Download size={18} color="var(--primary)" />
                  <span>Tải Toàn Bộ Dữ Liệu (.JSON)</span>
                </button>

                <button
                  className="btn btn-secondary"
                  style={{ justifyContent: 'flex-start' }}
                  onClick={() => {
                    if (window.confirm('Bạn có chắc muốn đặt lại toàn bộ dữ liệu tạp hóa mẫu?')) {
                      resetToSampleData();
                    }
                  }}
                >
                  <RotateCcw size={18} color="var(--warning)" />
                  <span>Khôi Phục Dữ Liệu Mẫu Ban Đầu</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ADD SUPPLIER MODAL */}
      {supplierModal && (
        <div className="modal-overlay" onClick={() => setSupplierModal(false)}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '480px' }}
          >
            <div className="modal-header">
              <div className="modal-title">
                <Users size={20} color="var(--primary)" />
                <span>Thêm Nhà Phân Phối Tạp Hóa Mới</span>
              </div>
            </div>

            <form onSubmit={handleSaveSupplier}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Tên nhà cung cấp / Đại lý *:</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="VD: NPP Nước ngọt Tân Hiệp Phát..."
                    value={supplierForm.name}
                    onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Số điện thoại:</label>
                    <input
                      type="text"
                      className="form-control"
                      value={supplierForm.phone}
                      onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Mã số thuế:</label>
                    <input
                      type="text"
                      className="form-control"
                      value={supplierForm.taxId}
                      onChange={(e) => setSupplierForm({ ...supplierForm, taxId: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Địa chỉ kho hàng:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={supplierForm.address}
                    onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSupplierModal(false)}
                >
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  Thêm Đại Lý
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
