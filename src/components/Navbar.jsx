import React from 'react';
import {
  Store,
  ShoppingCart,
  Boxes,
  PackagePlus,
  Receipt,
  BarChart3,
  Settings,
  ScanBarcode,
  Sun,
  Moon,
  Smartphone,
  BookOpen,
  Lock,
  Unlock,
  Clock,
  Gift,
  ShieldCheck,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const Navbar = () => {
  const {
    theme,
    toggleTheme,
    activeTab,
    setActiveTab,
    cart,
    openScanner,
    products,
    debts,
    isPinUnlocked,
    requireManagerPin,
    lockManagerPin,
    setPinModalOpen,
    setShiftModalOpen,
    setLoyaltyModalOpen,
    setMobileConnectOpen,
    connectedDevicesList,
    setDevicesModalOpen,
    setManagementMenuOpen,
  } = useStore();

  const cartTotalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;
  const activeDebtsCount = debts.filter((d) => d.remainingDebt > 0).length;

  // Primary visible tabs (Bán hàng POS & Bán hàng Điện thoại)
  const primaryTabs = [
    { id: 'pos', label: 'Bán Hàng (POS)', icon: ShoppingCart, badge: cartTotalItems },
    { id: 'mobile_pos', label: '📱 Bán Điện Thoại', icon: Smartphone },
  ];

  // Screen labels mapping for active management screens
  const screenTitles = {
    inventory: '📦 Kho Hàng & Sửa Giá',
    import: '📥 Nhập Hàng',
    debts: `📖 Sổ Nợ (${activeDebtsCount})`,
    invoices: '🧾 Hóa Đơn & Thuế',
    reports: '📊 Báo Cáo Lời Lỗ',
    settings: '⚙️ Cài Đặt Hệ Thống',
  };

  const isManagementScreen = activeTab !== 'pos' && activeTab !== 'mobile_pos';

  return (
    <header className="header-nav no-print">
      <div className="header-inner">
        {/* Brand Logo */}
        <div className="brand-logo" onClick={() => setActiveTab('pos')}>
          <div className="brand-icon-box">
            <Store size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span className="brand-title">Tạp Hóa SmartPOS</span>
              <span className="brand-badge">PRO v3.2</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Bán hàng & Mạng LAN Cục Bộ
            </div>
          </div>
        </div>

        {/* Primary Navigation Tabs */}
        <nav className="nav-tabs">
          {primaryTabs.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`nav-tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon size={16} />
                <span>{item.label}</span>
                {item.badge > 0 && (
                  <span
                    style={{
                      background: 'var(--primary)',
                      color: '#fff',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: '9999px',
                      marginLeft: '2px',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Active Management Screen Pill */}
          {isManagementScreen && (
            <button
              type="button"
              className="nav-tab-btn active"
              style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 800, borderColor: 'var(--primary-border)' }}
              onClick={() => setManagementMenuOpen(true)}
              title="Nhấn để đổi phân hệ quản lý"
            >
              <span>{screenTitles[activeTab] || 'Phân Hệ Quản Lý'}</span>
              <span style={{ fontSize: '0.75rem', opacity: 0.7, marginLeft: '4px' }}>▼</span>
            </button>
          )}
        </nav>

        {/* Header Right Actions */}
        <div className="header-actions">
          {/* Central Management Menu Gear Button (Nút Bánh Răng Quản Lý) */}
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setManagementMenuOpen(true)}
            title="Mở toàn bộ menu quản lý (Kho hàng, Nhập hàng, Sổ nợ, Báo cáo, Cài đặt)"
            style={{ fontWeight: 800 }}
          >
            <Settings size={15} />
            <span>Quản Lý</span>
            {(activeDebtsCount > 0 || lowStockCount > 0) && (
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: '#F59E0B',
                  boxShadow: '0 0 6px #F59E0B',
                  display: 'inline-block',
                }}
              />
            )}
          </button>
          {/* Shift Closing Button (Chốt ca 4h-22h) */}
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShiftModalOpen(true)}
            title="Chốt ca & Kiểm kê tiền mặt két (04:00 - 22:00)"
            style={{ fontWeight: 700, color: 'var(--primary)' }}
          >
            <Clock size={15} />
            <span>Chốt Ca</span>
          </button>

          {/* Loyalty Points Button (Tích điểm) */}
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setLoyaltyModalOpen(true)}
            title="Tích điểm đổi quà khách quen (Tên + 4 số đuôi SĐT)"
            style={{ fontWeight: 700, color: 'var(--warning)' }}
          >
            <Gift size={15} />
            <span>Tích Điểm</span>
          </button>

          {/* Manager PIN Lock / Unlock Toggle */}
          {isPinUnlocked ? (
            <button
              className="btn btn-secondary btn-sm"
              style={{ color: 'var(--success)', borderColor: 'var(--success-border)', fontWeight: 700 }}
              onClick={lockManagerPin}
              title="Quyền chủ tiệm đang mở. Nhấn để khóa lại ngay."
            >
              <Unlock size={14} />
              <span>Chủ Tiệm (Đã Mở)</span>
            </button>
          ) : (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setPinModalOpen(true)}
              title="Nhập mã PIN bảo mật để mở quyền chủ tiệm"
            >
              <Lock size={14} />
              <span>Khóa Chủ Tiệm</span>
            </button>
          )}

          {/* Live Connected Devices Monitor Button */}
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setDevicesModalOpen(true)}
            style={{ fontWeight: 700, borderColor: 'var(--success-border)', background: 'var(--success-light)', color: 'var(--success)' }}
            title="Xem danh sách điện thoại & máy tính đang kết nối vào Server LAN"
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#10B981',
                boxShadow: '0 0 6px #10B981',
                display: 'inline-block',
              }}
            />
            <Smartphone size={14} />
            <span>{connectedDevicesList.length > 0 ? `${connectedDevicesList.length} Máy` : 'LAN'}</span>
          </button>

          {/* Connect Mobile Scanner */}
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setMobileConnectOpen(true)}
            title="Biến điện thoại thành máy quét mã vạch"
          >
            <Smartphone size={15} color="var(--primary)" />
            <span>Quét ĐT</span>
          </button>

          {/* Theme Switcher */}
          <button
            className="btn btn-secondary btn-icon"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Chuyển sang Chế độ Sáng' : 'Chuyển sang Chế độ Tối'}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={16} color="#FBBF24" /> : <Moon size={16} color="#4F46E5" />}
          </button>
        </div>
      </div>
    </header>
  );
};
