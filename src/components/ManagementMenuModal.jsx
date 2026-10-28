import React, { useState } from 'react';
import {
  Boxes,
  PackagePlus,
  BookOpen,
  Receipt,
  BarChart3,
  Smartphone,
  Settings,
  Clock,
  Gift,
  FileSpreadsheet,
  X,
  Lock,
  Unlock,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { exportStoreToExcel } from '../utils/excelExporter';

export const ManagementMenuModal = () => {
  const {
    managementMenuOpen,
    setManagementMenuOpen,
    setActiveTab,
    isPinUnlocked,
    requireManagerPin,
    lockManagerPin,
    setPinModalOpen,
    updateManagerPin,
    setShiftModalOpen,
    setLoyaltyModalOpen,
    products,
    orders,
    debts,
    purchases,
    shiftsHistory,
    taxSettings,
    showToast,
  } = useStore();

  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newPin2, setNewPin2] = useState('');
  if (!managementMenuOpen) return null;

  const handleSelectScreen = (screenId) => {
    setManagementMenuOpen(false);
    requireManagerPin(() => {
      setActiveTab(screenId);
    });
  };

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
      showToast(`Đã xuất toàn bộ sổ sách ra Excel: ${filename}`, 'success');
    } catch (e) {
      showToast('Lỗi khi xuất file Excel!', 'danger');
    }
  };

  const menuItems = [
    {
      id: 'inventory',
      title: 'Kho Hàng, Cài Đặt Thùng & Sửa Giá',
      desc: 'Cài đặt quy cách thùng, giá sỉ/lẻ, cập nhật giá hàng ngày',
      icon: Boxes,
      color: '#3B82F6',
      bg: 'rgba(59, 130, 246, 0.12)',
    },
    {
      id: 'import',
      title: 'Nhập Hàng Vào Kho',
      desc: 'Tạo phiếu nhập từ nhà phân phối, tính giá vốn và VAT',
      icon: PackagePlus,
      color: '#10B981',
      bg: 'rgba(16, 185, 129, 0.12)',
    },
    {
      id: 'debts',
      title: 'Sổ Ghi Nợ Khách Quen',
      desc: 'Theo dõi tiền nợ, lịch sử mua thiếu và trả nợ từng lần',
      icon: BookOpen,
      color: '#F59E0B',
      bg: 'rgba(245, 158, 11, 0.12)',
      badge: debts.filter((d) => d.remainingDebt > 0).length,
    },
    {
      id: 'invoices',
      title: 'Lịch Sử Hóa Đơn & Thuế',
      desc: 'Xem lại hóa đơn, in lại bill, xuất hóa đơn thuế',
      icon: Receipt,
      color: '#8B5CF6',
      bg: 'rgba(139, 92, 246, 0.12)',
    },
    {
      id: 'reports',
      title: 'Báo Cáo Doanh Thu & Lời Lỗ',
      desc: 'Thống kê tiền lời gộp, sản phẩm bán chạy theo ngày/tháng',
      icon: BarChart3,
      color: '#EC4899',
      bg: 'rgba(236, 72, 153, 0.12)',
    },
    {
      id: 'devices',
      title: 'Lịch Sử Thiết Bị & Sổ Ngày',
      desc: 'Bill của từng máy trong tiệm, tổng kết ngày tự động và ghi chú ngày của chủ tiệm (cần PIN)',
      icon: Smartphone,
      color: '#0EA5E9',
      bg: 'rgba(14, 165, 233, 0.12)',
    },
    {
      id: 'settings',
      title: 'Cài Đặt Cửa Hàng & Server LAN',
      desc: 'Số tài khoản VietQR, máy in nhiệt, mã PIN, sao lưu tự động',
      icon: Settings,
      color: '#6366F1',
      bg: 'rgba(99, 102, 241, 0.12)',
    },
  ];

  return (
    <div className="modal-overlay" onClick={() => setManagementMenuOpen(false)}>
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '580px', maxHeight: '92vh', overflowY: 'auto' }}
      >
        <div className="modal-header">
          <div className="modal-title" style={{ color: 'var(--primary)' }}>
            <Settings size={20} />
            <span>Menu Quản Lý & Chức Năng Cửa Hàng</span>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-icon"
            onClick={() => setManagementMenuOpen(false)}
          >
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '1rem' }}>
          {/* Owner status bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: isPinUnlocked ? 'var(--success-light)' : 'var(--bg-secondary)',
              border: `1px solid ${isPinUnlocked ? 'var(--success-border)' : 'var(--border-color)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '0.65rem 1rem',
              marginBottom: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {isPinUnlocked ? (
                <ShieldCheck size={20} color="var(--success)" />
              ) : (
                <Lock size={18} color="var(--warning)" />
              )}
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>
                  {isPinUnlocked ? 'Quyền Chủ Tiệm (Đang Mở Khóa)' : 'Chế Độ Nhân Viên (Bảo Mật)'}
                </div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                  {isPinUnlocked
                    ? 'Bạn có thể chỉnh sửa giá và truy cập toàn bộ chức năng'
                    : 'Nhập mã PIN để mở khóa chỉnh sửa và xem báo cáo'}
                </div>
              </div>
            </div>

            {isPinUnlocked ? (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={lockManagerPin}
                style={{ fontWeight: 700, color: 'var(--danger)' }}
              >
                <Lock size={12} />
                <span>Khóa Lại</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setManagementMenuOpen(false);
                  setPinModalOpen(true);
                }}
              >
                <Unlock size={12} />
                <span>Mở Khóa</span>
              </button>
            )}
          </div>

          {isPinUnlocked && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (newPin !== newPin2) { showToast('Mã PIN mới nhập lại không khớp!', 'danger'); return; }
                const ok = await updateManagerPin(oldPin, newPin);
                if (ok) { setOldPin(''); setNewPin(''); setNewPin2(''); }
              }}
              style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', marginBottom: '1rem' }}
            >
              <div style={{ fontWeight: 800, fontSize: '0.85rem', marginBottom: '0.5rem' }}>Đổi mã PIN chủ tiệm</div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <input type="password" inputMode="numeric" maxLength={6} className="form-control" style={{ width: '110px' }} placeholder="PIN cũ" value={oldPin} onChange={(e) => setOldPin(e.target.value)} />
                <input type="password" inputMode="numeric" maxLength={6} className="form-control" style={{ width: '110px' }} placeholder="PIN mới" value={newPin} onChange={(e) => setNewPin(e.target.value)} />
                <input type="password" inputMode="numeric" maxLength={6} className="form-control" style={{ width: '110px' }} placeholder="Nhập lại PIN mới" value={newPin2} onChange={(e) => setNewPin2(e.target.value)} />
                <button type="submit" className="btn btn-primary btn-sm">Đổi PIN</button>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>PIN là 4–6 chữ số. Đổi ngay trong lần chạy đầu tiên; mã PIN không bao giờ hiển thị trong nhật ký.</div>
            </form>
          )}

          {/* Quick Actions Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.5rem',
              marginBottom: '1rem',
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setManagementMenuOpen(false);
                setShiftModalOpen(true);
              }}
              style={{
                flexDirection: 'column',
                padding: '0.75rem 0.5rem',
                gap: '0.35rem',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              <Clock size={20} color="var(--primary)" />
              <span>Chốt Ca 22h</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setManagementMenuOpen(false);
                setLoyaltyModalOpen(true);
              }}
              style={{
                flexDirection: 'column',
                padding: '0.75rem 0.5rem',
                gap: '0.35rem',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              <Gift size={20} color="var(--warning)" />
              <span>Tích Điểm</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleExportExcel}
              style={{
                flexDirection: 'column',
                padding: '0.75rem 0.5rem',
                gap: '0.35rem',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              <FileSpreadsheet size={20} color="var(--success)" />
              <span>Xuất Excel</span>
            </button>
          </div>

          {/* Management Menu Items List */}
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            CÁC PHÂN HỆ QUẢN LÝ:
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectScreen(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 0.9rem',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '8px',
                        background: item.bg,
                        color: item.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={20} />
                    </div>

                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{item.title}</span>
                        {item.badge > 0 && (
                          <span
                            style={{
                              background: 'var(--warning)',
                              color: '#000',
                              fontSize: '0.65rem',
                              fontWeight: 800,
                              padding: '1px 5px',
                              borderRadius: '9999px',
                            }}
                          >
                            {item.badge} nợ
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {item.desc}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
                    {!isPinUnlocked && <Lock size={14} color="var(--warning)" />}
                    <ChevronRight size={16} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={() => setManagementMenuOpen(false)}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
