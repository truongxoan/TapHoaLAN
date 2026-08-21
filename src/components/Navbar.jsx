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
  } = useStore();

  const cartTotalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;
  const activeDebtsCount = debts.filter((d) => d.remainingDebt > 0).length;

  const handleTabClick = (tabId) => {
    if (tabId !== 'pos' && tabId !== 'mobile_pos') {
      requireManagerPin(() => setActiveTab(tabId));
    } else {
      setActiveTab(tabId);
    }
  };

  // When locked: Only allow POS selling tabs
  const allNavItems = [
    { id: 'pos', label: 'Bán Hàng (POS)', icon: ShoppingCart, badge: cartTotalItems },
    { id: 'mobile_pos', label: '📱 Bán Điện Thoại', icon: Smartphone },
    { id: 'import', label: 'Nhập Hàng', icon: PackagePlus, requiresOwner: true },
    { id: 'inventory', label: 'Kho & Sửa Giá', icon: Boxes, alert: lowStockCount, requiresOwner: true },
    { id: 'debts', label: 'Sổ Nợ Khách', icon: BookOpen, debtBadge: activeDebtsCount, requiresOwner: true },
    { id: 'invoices', label: 'Hóa Đơn & Thuế', icon: Receipt, requiresOwner: true },
    { id: 'reports', label: 'Báo Cáo Lời Lỗ', icon: BarChart3, requiresOwner: true },
    { id: 'settings', label: 'Cài Đặt & Server', icon: Settings, requiresOwner: true },
  ];

  const visibleNavItems = isPinUnlocked
    ? allNavItems
    : allNavItems.filter((item) => !item.requiresOwner);

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
              Bán hàng & Tự động Backup
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="nav-tabs">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`nav-tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => handleTabClick(item.id)}
              >
                <Icon size={16} />
                <span>{item.label}</span>
                {item.requiresPin && !isPinUnlocked && (
                  <Lock size={11} color="var(--warning)" style={{ marginLeft: '1px' }} />
                )}
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
                {item.alert > 0 && (
                  <span
                    style={{
                      background: 'var(--danger)',
                      color: '#fff',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: '9999px',
                      marginLeft: '2px',
                    }}
                    title={`${item.alert} sản phẩm sắp hết hàng`}
                  >
                    {item.alert}
                  </span>
                )}
                {item.debtBadge > 0 && (
                  <span
                    style={{
                      background: 'var(--warning)',
                      color: '#000',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      padding: '1px 5px',
                      borderRadius: '9999px',
                      marginLeft: '2px',
                    }}
                    title={`${item.debtBadge} khách đang nợ`}
                  >
                    {item.debtBadge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Header Right Actions */}
        <div className="header-actions">
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
