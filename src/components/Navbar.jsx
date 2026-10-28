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
    THEMES,
    cycleTheme,
    activeTab,
    setActiveTab,
    appMode,
    requestAppMode,
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
    devices: '📱 Lịch Sử Thiết Bị & Sổ Ngày',
  };

  const isManagementScreen = activeTab !== 'pos' && activeTab !== 'mobile_pos';

  // Direct tabs for admin mode: nothing hidden behind menus.
  const adminTabs = [
    { id: 'pos', label: 'Bán Hàng (POS)', icon: ShoppingCart },
    { id: 'mobile_pos', label: '📱 Bán Điện Thoại', icon: Smartphone },
    { id: 'import', label: '📥 Nhập Hàng', icon: PackagePlus },
    { id: 'inventory', label: '📦 Kho Hàng', icon: Boxes },
    { id: 'debts', label: `📖 Sổ Nợ (${activeDebtsCount})`, icon: BookOpen },
    { id: 'invoices', label: '🧾 Hóa Đơn & Thuế', icon: Receipt },
    { id: 'reports', label: '📊 Báo Cáo', icon: BarChart3 },
    { id: 'devices', label: '📱 Lịch Sử & Sổ Ngày', icon: Smartphone },
    { id: 'settings', label: '⚙️ Cài Đặt', icon: Settings },
  ];

  const modeButtons = [
    { id: 'elder', label: '👴 Lớn tuổi' },
    { id: 'young', label: '⚡ Người trẻ' },
    { id: 'admin', label: '👑 Admin' },
  ];

  // Elder mode: the navbar shows ONLY Bán hàng, Nhập hàng, Chốt ca and
  // a large "Đổi chế độ" exit button. Everything else is hidden.
  if (appMode === 'elder') {
    return (
      <header className="header-nav no-print">
        <div className="header-inner">
          <div className="brand-logo" onClick={() => setActiveTab('pos')}>
            <div className="brand-icon-box">
              <Store size={28} />
            </div>
            <div>
              <span className="brand-title">Tạp Hóa SmartPOS</span>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Chế độ người lớn tuổi — chữ to, dễ bấm
              </div>
            </div>
          </div>
          <nav className="nav-tabs">
            <button
              type="button"
              className={`nav-tab-btn elder-nav-btn ${activeTab === 'pos' ? 'active' : ''}`}
              onClick={() => setActiveTab('pos')}
            >
              <ShoppingCart size={22} />
              <span>Bán Hàng</span>
            </button>
            <button
              type="button"
              className={`nav-tab-btn elder-nav-btn ${activeTab === 'import' ? 'active' : ''}`}
              onClick={() => setActiveTab('import')}
            >
              <PackagePlus size={22} />
              <span>Nhập Hàng</span>
            </button>
          </nav>
          <div className="header-actions">
            <button
              type="button"
              className="btn btn-secondary elder-nav-btn"
              onClick={() => setShiftModalOpen(true)}
              title="Chốt ca & Kiểm kê tiền mặt két (04:00 - 22:00)"
            >
              <Clock size={22} />
              <span>Chốt Ca</span>
            </button>
            <button
              type="button"
              className="btn btn-primary elder-nav-btn"
              onClick={() => requestAppMode('young')}
              title="Quay về giao diện tiêu chuẩn (Người trẻ). Muốn vào Admin thì chọn 👑 Admin ở đó và nhập PIN chủ tiệm."
            >
              <span>🔄 Đổi Chế Độ</span>
            </button>
          </div>
        </div>
      </header>
    );
  }

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
              {appMode === 'admin' && (
                <span className="brand-badge" style={{ background: 'var(--danger)', marginLeft: '6px' }}>
                  ADMIN
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Bán hàng & Mạng LAN Cục Bộ
            </div>
          </div>
        </div>

        {/* Primary Navigation Tabs */}
        <nav className="nav-tabs">
          {(appMode === 'admin' ? adminTabs : primaryTabs).map((item) => {
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

          {/* Active Management Screen Pill (not needed in admin: tabs are direct) */}
          {isManagementScreen && appMode !== 'admin' && (
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
          {/* Mode switcher: Admin goes through the PIN gate in requestAppMode */}
          <div className="mode-switcher" role="group" aria-label="Chế độ giao diện">
            {modeButtons.map((mode) => (
              <button
                key={mode.id}
                type="button"
                className={`mode-switcher-btn ${appMode === mode.id ? 'active' : ''}`}
                onClick={() => requestAppMode(mode.id)}
                title={
                  mode.id === 'admin'
                    ? 'Chế độ Admin: cần nhập PIN chủ tiệm nếu chưa mở khóa'
                    : mode.id === 'elder'
                      ? 'Chế độ người lớn tuổi: chữ to, bán hàng đơn giản'
                      : 'Chế độ người trẻ: đầy đủ công cụ bán hàng tiêu chuẩn'
                }
              >
                {mode.label}
              </button>
            ))}
          </div>
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

          {/* Quick theme switcher: cycles through all themes. Full picker
              with live preview is in Settings. Theme never touches appMode,
              PIN state, or data. */}
          <button
            className="btn btn-secondary btn-sm"
            onClick={cycleTheme}
            title={`Đang dùng theme: ${(THEMES || []).find((t) => t.id === theme)?.name || theme}. Bấm để đổi theme tiếp theo. Chọn đầy đủ trong Cài đặt.`}
            aria-label="Đổi giao diện"
          >
            {theme === 'dark' ? <Sun size={16} color="#FBBF24" /> : <Moon size={16} color="var(--primary)" />}
            <span>{(THEMES || []).find((t) => t.id === theme)?.name || 'Theme'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
