import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  ScanBarcode,
  Plus,
  Minus,
  Trash2,
  QrCode,
  Banknote,
  BookOpen,
  User,
  RotateCcw,
  Smartphone,
  CheckCircle2,
  LayoutGrid,
  List,
  Store,
  Wifi,
  Sparkles,
  Gift,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const POSScreen = () => {
  const {
    products,
    categories,
    orders,
    appMode,
    cart,
    addToCart,
    updateCartQty,
    removeFromCart,
    clearCart,
    cartDiscount,
    setCartDiscount,
    customer,
    setCustomer,
    setLoyaltyModalOpen,
    loyaltyCustomers,
    cartSubtotal,
    discountAmount,
    vat8Amount,
    vat10Amount,
    totalVat,
    netTotal,
    cartGrandTotal,
    checkoutOrder,
    checkoutProcessing,
    openScanner,
    setActiveInvoice,
    setVietQrData,
    setMobileConnectOpen,
    isLanConnected,
    showToast,
  } = useStore();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // Young-mode quick utilities: favourite products (pinned by the star
  // on each product card), persisted in localStorage. The strip itself
  // renders only when appMode === 'young'.
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('smartpos_favorite_products') || '[]');
    } catch {
      return [];
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem('smartpos_favorite_products', JSON.stringify(favorites));
    } catch {}
  }, [favorites]);
  const toggleFavorite = (productId) => {
    setFavorites((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };
  const isToday = (value) => {
    if (!value) return false;
    const d = new Date(value);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  };
  const todayOrders = (orders || []).filter((o) => isToday(o.createdAt || o.date));
  const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;
  const favoriteProducts = products.filter((p) => favorites.includes(p.id));
  const [cashierName, setCashierName] = useState(() => localStorage.getItem('smartpos_cashier_name') || 'Quầy 1');

  // Modals
  const [cashModalOpen, setCashModalOpen] = useState(false);
  const [cashReceived, setCashReceived] = useState('');
  const [debtModalOpen, setDebtModalOpen] = useState(false);
  const [debtNote, setDebtNote] = useState('');

  const formatVND = (val) =>
    new Intl.NumberFormat('vi-VN').format(Math.round(val || 0)) + ' đ';

  const handleCashierNameChange = (name) => {
    setCashierName(name);
    localStorage.setItem('smartpos_cashier_name', name);
  };

  // Filter products
  const filteredProducts = products.filter((prod) => {
    const matchCat = selectedCategory === 'all' || prod.category === selectedCategory;
    const matchSearch =
      !search ||
      prod.name.toLowerCase().includes(search.toLowerCase()) ||
      prod.barcode.includes(search);
    return matchCat && matchSearch;
  });

  // Handle Quick Cash Payment
  const handleOpenCashModal = () => {
    if (cart.length === 0) {
      showToast('Chưa có hàng trong đơn!', 'warning');
      return;
    }
    setCashReceived(cartGrandTotal.toString());
    setCashModalOpen(true);
  };

  const handleConfirmCashCheckout = async () => {
    const receivedNum = Number(cashReceived) || cartGrandTotal;
    if (receivedNum < cartGrandTotal) {
      showToast('Số tiền khách đưa chưa đủ!', 'warning');
      return;
    }
    const completedOrder = await checkoutOrder({
      paymentMethod: 'cash',
      receivedAmount: receivedNum,
    });
    setCashModalOpen(false);
    if (completedOrder) {
      setActiveInvoice(completedOrder);
    }
  };

  // Handle VietQR Payment: create the pending order FIRST so the QR
  // content uses the real server order code.
  const handleVietQrCheckout = async () => {
    if (cart.length === 0) {
      showToast('Chưa có hàng trong đơn!', 'warning');
      return;
    }
    const pendingOrder = await checkoutOrder({ paymentMethod: 'vietqr', receivedAmount: cartGrandTotal });
    if (pendingOrder) {
      setVietQrData({ amount: pendingOrder.total, orderId: pendingOrder.code, orderDbId: pendingOrder.id });
    }
  };

  // Handle Debt Checkout (Ghi nợ)
  const handleOpenDebtModal = () => {
    if (cart.length === 0) {
      showToast('Chưa có hàng trong đơn!', 'warning');
      return;
    }
    setDebtModalOpen(true);
  };

  const handleConfirmDebtCheckout = async (e) => {
    e.preventDefault();
    if (!customer.name || customer.name === 'Khách lẻ') {
      showToast('Vui lòng nhập tên khách quen để ghi sổ nợ!', 'warning');
      return;
    }

    const completedOrder = await checkoutOrder({
      paymentMethod: 'debt',
      debtNote,
    });

    setDebtModalOpen(false);
    setDebtNote('');
    if (completedOrder) {
      setActiveInvoice(completedOrder);
    }
  };

  const cashChange = Math.max(0, (Number(cashReceived) || 0) - cartGrandTotal);

  // Resizable Splitter Width State (Co kéo độ rộng 2 cột tùy ý)
  const [checkoutWidth, setCheckoutWidth] = useState(() => {
    const saved = localStorage.getItem('smartpos_checkout_panel_width');
    return saved ? Number(saved) : 380;
  });
  const isDraggingRef = useRef(false);

  const startResizeDrag = (clientX) => {
    isDraggingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMove = (moveEvent) => {
      if (!isDraggingRef.current) return;
      const currentX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const windowWidth = window.innerWidth;
      const newWidth = Math.max(260, Math.min(windowWidth * 0.65, windowWidth - currentX));
      setCheckoutWidth(Math.round(newWidth));
    };

    const onEnd = () => {
      isDraggingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      localStorage.setItem('smartpos_checkout_panel_width', checkoutWidth.toString());
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onEnd);
  };

  return (
    <div
      className="pos-viewport-layout"
      style={{
        gridTemplateColumns: window.innerWidth > 768 ? `1fr 10px ${checkoutWidth}px` : undefined,
      }}
    >
      {/* LEFT COLUMN: COMPACT PRODUCTS CATALOG */}
      <div className="pos-catalog-column">
        {/* Search, Scanner & View Switcher Bar */}
        <div className="pos-catalog-top">
          <div
            style={{
              display: 'flex',
              gap: '0.4rem',
              marginBottom: '0.4rem',
              alignItems: 'center',
            }}
          >
            <div className="input-icon-wrapper" style={{ flex: 1 }}>
              <Search size={16} className="input-icon" />
              <input
                type="text"
                className="form-control"
                style={{ fontSize: '0.825rem', padding: '0.4rem 0.65rem 0.4rem 2rem' }}
                placeholder="Gõ tên hàng hoặc quét mã..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Quick Scanner Button */}
            <button
              className="btn btn-primary"
              style={{ fontWeight: 700, padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
              onClick={() => openScanner('pos')}
              title="Mở Camera quét mã"
            >
              <ScanBarcode size={15} />
              <span>Quét Mã</span>
            </button>

            {/* Grid / List Toggle */}
            <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '2px', borderRadius: 'var(--radius-sm)' }}>
              <button
                className={`btn btn-sm ${viewMode === 'grid' ? 'btn-secondary' : ''}`}
                style={{ padding: '3px 5px', border: 'none' }}
                onClick={() => setViewMode('grid')}
                title="Dạng thẻ nhỏ"
              >
                <LayoutGrid size={13} />
              </button>
              <button
                className={`btn btn-sm ${viewMode === 'list' ? 'btn-secondary' : ''}`}
                style={{ padding: '3px 5px', border: 'none' }}
                onClick={() => setViewMode('list')}
                title="Dạng danh sách"
              >
                <List size={13} />
              </button>
            </div>
          </div>

          {/* Young-mode quick utilities strip (hidden in elder/admin) */}
          {appMode === 'young' && (
            <div
              className="card"
              style={{ padding: '0.6rem 0.75rem', marginBottom: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}
            >
              <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>⚡ Tiện ích nhanh hôm nay:</span>
              <span style={{ fontSize: '0.8rem' }}>🧾 {todayOrders.length} đơn</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--success)' }}>
                💰 {formatVND(todayRevenue)}
              </span>
              <span style={{ fontSize: '0.8rem', color: lowStockCount > 0 ? 'var(--warning)' : 'var(--text-secondary)' }}>
                ⚠️ Sắp hết hàng: {lowStockCount} món
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                ⭐ Bấm ngôi sao trên thẻ hàng để ghim vào mục yêu thích bên dưới.
              </span>
              {favoriteProducts.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center', width: '100%' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Yêu thích:</span>
                  {favoriteProducts.map((prod) => (
                    <button
                      key={prod.id}
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontWeight: 700 }}
                      disabled={prod.stock <= 0}
                      onClick={() => addToCart(prod, 1)}
                      title={`Thêm nhanh ${prod.name} — ${formatVND(prod.price)}`}
                    >
                      ⭐ {prod.name} — {formatVND(prod.price)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Categories Chips */}
          <div
            style={{
              display: 'flex',
              gap: '0.3rem',
              overflowX: 'auto',
              paddingBottom: '0.35rem',
              marginBottom: '0.4rem',
            }}
          >
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`btn btn-sm ${
                  selectedCategory === cat.id ? 'btn-primary' : 'btn-secondary'
                }`}
                style={{
                  borderRadius: 'var(--radius-full)',
                  whiteSpace: 'nowrap',
                  padding: '0.25rem 0.55rem',
                  fontSize: '0.725rem',
                }}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* COMPACT PRODUCTS DISPLAY (SCROLLABLE SUB-CONTAINER) */}
        <div className="pos-catalog-scrollable">
          {viewMode === 'grid' ? (
            /* COMPACT GRID VIEW */
            <div className="grid-products-fluid">
            {filteredProducts.map((prod) => {
              const isOutOfStock = prod.stock <= 0;
              const isLowStock = prod.stock > 0 && prod.stock <= prod.minStock;

              return (
                <div
                  key={prod.id}
                  className={`product-item-compact ${isOutOfStock ? 'out-of-stock' : ''}`}
                  onClick={() => !isOutOfStock && addToCart(prod, 1)}
                >
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <img
                      src={prod.image}
                      alt={prod.name}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '6px',
                        objectFit: 'cover',
                        background: 'var(--bg-secondary)',
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '0.775rem',
                          fontWeight: 700,
                          lineHeight: 1.25,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {prod.name}
                      </div>
                      <div
                        style={{
                          fontSize: '0.65rem',
                          color: 'var(--text-muted)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {prod.barcode.slice(-6)}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: '1px solid var(--border-color)',
                      paddingTop: '0.35rem',
                      marginTop: 'auto',
                      gap: '4px',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: 800,
                          color: 'var(--primary)',
                          fontSize: '0.875rem',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {formatVND(prod.price)}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: isOutOfStock ? 'var(--danger)' : isLowStock ? 'var(--warning)' : 'var(--success)' }}>
                        {isOutOfStock ? 'Hết hàng' : `Kho: ${prod.stock} ${prod.unit}`}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '3px' }}>
                      {/* Favourite pin (young mode only; the strip above shows the pinned chips) */}
                      {appMode === 'young' && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '2px 5px', fontSize: '0.7rem', borderRadius: '4px', color: favorites.includes(prod.id) ? 'var(--warning)' : 'var(--text-muted)' }}
                          title={favorites.includes(prod.id) ? 'Bỏ ghim khỏi yêu thích' : 'Ghim vào yêu thích'}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(prod.id);
                          }}
                        >
                          {favorites.includes(prod.id) ? '★' : '☆'}
                        </button>
                      )}
                      {/* Add Single Unit */}
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ padding: '2px 5px', fontSize: '0.7rem', borderRadius: '4px' }}
                        disabled={isOutOfStock}
                        title={`Bán 1 ${prod.unit}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(prod, 1);
                        }}
                      >
                        +{prod.unit}
                      </button>

                      {/* Add Box Unit (if available) */}
                      {prod.hasBoxUnit && prod.stock >= prod.boxConversion && (
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '2px 5px', fontSize: '0.675rem', borderRadius: '4px', color: 'var(--success)', borderColor: 'var(--success-border)', fontWeight: 700 }}
                          title={`Bán 1 ${prod.boxUnitName || 'Thùng'} (${prod.boxConversion} ${prod.unit}) - ${formatVND(prod.boxPrice)}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(prod, 1, prod.boxConversion, prod.boxUnitName || 'Thùng', prod.boxPrice);
                          }}
                        >
                          +Thùng
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* COMPACT LIST VIEW */
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <tbody>
                {filteredProducts.map((prod) => (
                  <tr
                    key={prod.id}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      opacity: prod.stock <= 0 ? 0.5 : 1,
                    }}
                  >
                    <td style={{ padding: '0.4rem 0.6rem', fontWeight: 700 }}>
                      {prod.name}
                    </td>
                    <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
                      {prod.barcode}
                    </td>
                    <td style={{ padding: '0.4rem 0.5rem', fontWeight: 800, color: 'var(--primary)', textAlign: 'right' }}>
                      {formatVND(prod.price)}/{prod.unit}
                      {prod.hasBoxUnit && (
                        <div style={{ fontSize: '0.675rem', color: 'var(--success)', fontWeight: 600 }}>
                          Thùng: {formatVND(prod.boxPrice)}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '0.4rem 0.5rem', textAlign: 'center', fontSize: '0.75rem' }}>
                      Kho: {prod.stock} {prod.unit}
                    </td>
                    <td style={{ padding: '0.4rem 0.6rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '3px' }}>
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                          disabled={prod.stock <= 0}
                          onClick={() => addToCart(prod, 1)}
                        >
                          +1 {prod.unit}
                        </button>
                        {prod.hasBoxUnit && prod.stock >= prod.boxConversion && (
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '2px 6px', fontSize: '0.7rem', color: 'var(--success)', fontWeight: 700 }}
                            onClick={() => addToCart(prod, 1, prod.boxConversion, prod.boxUnitName || 'Thùng', prod.boxPrice)}
                          >
                            +Thùng
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </div>
      </div>

      {/* DRAGGABLE RESIZE DIVIDER (THANH CO KÉO DÃN NỞ) */}
      <div
        className="pos-resize-divider"
        onMouseDown={(e) => startResizeDrag(e.clientX)}
        onTouchStart={(e) => startResizeDrag(e.touches[0].clientX)}
        title="Bấm giữ và kéo sang trái/phải để thay đổi độ rộng Bảng Tính Tiền & Hàng Hóa"
      >
        <div className="pos-resize-handle" />
      </div>

      {/* RIGHT COLUMN: HIGH-CONTRAST AUTO-FIT CHECKOUT PANEL (BẢNG TÍNH TIỀN KHÔNG CUỘN TRANG) */}
      <div className="pos-checkout-column">
        <div className="checkout-panel-auto-fit">
          {/* Header with Cashier & Reset */}
          <div className="checkout-panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Store size={16} color="var(--primary)" />
              {/* Cashier Selector */}
              <select
                className="form-control"
                style={{ padding: '2px 6px', fontSize: '0.75rem', fontWeight: 700, width: 'auto' }}
                value={cashierName}
                onChange={(e) => handleCashierNameChange(e.target.value)}
              >
                <option value="Quầy 1 - Máy tính">Quầy 1 (Thu Ngân)</option>
                <option value="Quầy 2 - ĐT Vợ">Quầy 2 (ĐT Vợ)</option>
                <option value="Quầy 3 - ĐT Chồng">Quầy 3 (ĐT Chồng)</option>
                <option value="Kho Bán Hàng">Quầy Kho</option>
              </select>

              {isLanConnected && (
                <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                  <Wifi size={10} /> Online
                </span>
              )}
            </div>

            {cart.length > 0 && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={clearCart}
                style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                title="Xóa giỏ làm lại"
              >
                <RotateCcw size={12} />
                <span>Xóa</span>
              </button>
            )}
          </div>

          <div className="checkout-panel-body">
            {/* BIG BOLD TOTAL DISPLAY */}
            <div className="checkout-total-card">
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.9 }}>
                TỔNG TIỀN THANH TOÁN
              </div>
              <div className="checkout-total-number">
                {formatVND(cartGrandTotal)}
              </div>
              <div style={{ fontSize: '0.7rem', opacity: 0.85, marginTop: '2px' }}>
                {cart.length} món • VAT: {formatVND(totalVat)}
              </div>
            </div>

            {/* Customer Quick Input & Loyalty Points */}
            <div style={{ marginBottom: '0.4rem', display: 'flex', gap: '3px', flexShrink: 0 }}>
              <input
                type="text"
                className="form-control"
                style={{ padding: '0.3rem 0.5rem', fontSize: '0.775rem', flex: 1 }}
                placeholder="Tên khách hoặc 4 số đuôi SĐT..."
                value={customer.name}
                onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
              />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setLoyaltyModalOpen(true)}
                style={{ padding: '2px 6px', fontSize: '0.725rem', fontWeight: 700, color: 'var(--warning)' }}
                title="Chọn khách tích điểm hoặc đổi quà trừ tiền"
              >
                <Gift size={12} />
                <span>Điểm</span>
              </button>
            </div>

            {/* Cart Items List (Scrollable Sub-area) */}
            <div className="checkout-cart-scrollable">
              {cart.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.775rem' }}>
                  <ScanBarcode size={20} style={{ margin: '0 auto 0.2rem', opacity: 0.4 }} />
                  <div>Đơn hàng chưa có món nào</div>
                  <div style={{ fontSize: '0.675rem' }}>Chọn món bên trái hoặc quét mã</div>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.productId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.3rem 0.2rem',
                      borderBottom: '1px solid var(--border-color)',
                      fontSize: '0.775rem',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0, paddingRight: '4px' }}>
                      <div style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>
                        {item.unit} • {formatVND(item.price)}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: 'var(--bg-card)', borderRadius: '4px', padding: '1px 3px' }}>
                      <button
                        onClick={() => updateCartQty(item.productId, item.qty - 1)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '1px 3px' }}
                      >
                        <Minus size={10} />
                      </button>
                      <span style={{ fontWeight: 800, minWidth: '16px', textAlign: 'center' }}>
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateCartQty(item.productId, item.qty + 1)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '1px 3px' }}
                      >
                        <Plus size={10} />
                      </button>
                    </div>

                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        minWidth: '55px',
                        textAlign: 'right',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {formatVND(item.price * item.qty)}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Discount & Net Summary */}
            {cart.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.725rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '0.4rem',
                  padding: '0.2rem 0.35rem',
                  background: 'var(--bg-secondary)',
                  borderRadius: '4px',
                  flexShrink: 0,
                }}
              >
                <span>Tiền hàng: {formatVND(cartSubtotal)}</span>
                {discountAmount > 0 && <span style={{ color: 'var(--danger)' }}>Giảm: -{formatVND(discountAmount)}</span>}
                <span>Net: {formatVND(netTotal)}</span>
              </div>
            )}

            {/* BIG ACTION BUTTONS FOR CASHIER */}
            <div className="checkout-panel-actions">
              {/* Cash button: Biggest & Most Prominent */}
              <button
                className="btn btn-success btn-lg"
                style={{ gridColumn: 'span 2', fontSize: '1.05rem', padding: '0.65rem' }}
                disabled={cart.length === 0}
                onClick={handleOpenCashModal}
              >
                <Banknote size={20} />
                <span>TIỀN MẶT (F1)</span>
              </button>

              {/* VietQR button */}
              <button
                className={`btn btn-primary btn-md ${checkoutProcessing ? 'is-processing' : ''}`}
                style={{ padding: '0.5rem' }}
                disabled={cart.length === 0 || checkoutProcessing}
                onClick={handleVietQrCheckout}
              >
                <QrCode size={16} />
                <span>{checkoutProcessing ? 'Đang lưu…' : 'VietQR'}</span>
              </button>

              {/* Debt button */}
              <button
                className="btn btn-secondary btn-md"
                style={{ color: 'var(--warning)', borderColor: 'var(--warning-border)', fontWeight: 700, padding: '0.5rem' }}
                disabled={cart.length === 0}
                onClick={handleOpenDebtModal}
              >
                <BookOpen size={16} />
                <span>Ghi Nợ</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CASH PAYMENT QUICK MODAL */}
      {cashModalOpen && (
        <div className="modal-overlay" onClick={() => setCashModalOpen(false)}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '420px' }}
          >
            <div className="modal-header">
              <div className="modal-title">
                <Banknote size={22} color="var(--success)" />
                <span>Tính Tiền Mặt & Tiền Thừa</span>
              </div>
              <button
                className="btn btn-secondary btn-icon"
                onClick={() => setCashModalOpen(false)}
              >
                <RotateCcw size={16} />
              </button>
            </div>

            <div className="modal-body">
              <div
                style={{
                  background: '#1E1B4B',
                  color: '#FFFFFF',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1rem',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '0.8rem', opacity: 0.8, textTransform: 'uppercase' }}>
                  Khách Cần Thanh Toán:
                </div>
                <div
                  style={{
                    fontSize: '2rem',
                    fontWeight: 900,
                    color: '#34D399',
                    fontFamily: 'var(--font-mono)',
                    marginTop: '0.25rem',
                  }}
                >
                  {formatVND(cartGrandTotal)}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                  Tiền khách đưa (VNĐ):
                </label>
                <input
                  type="number"
                  className="form-control"
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--primary)',
                  }}
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Quick Cash Buttons */}
              <div
                style={{
                  display: 'flex',
                  gap: '0.35rem',
                  flexWrap: 'wrap',
                  marginBottom: '1rem',
                }}
              >
                {[
                  cartGrandTotal,
                  50000,
                  100000,
                  200000,
                  500000,
                ].map((val, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontWeight: 700 }}
                    onClick={() => setCashReceived(val.toString())}
                  >
                    {formatVND(val)}
                  </button>
                ))}
              </div>

              {/* Big Change Display (Tiền Thối Lại Siêu Rõ) */}
              <div
                style={{
                  padding: '0.85rem 1.15rem',
                  borderRadius: 'var(--radius-md)',
                  background: cashChange >= 0 ? 'var(--success-light)' : 'var(--danger-light)',
                  border: `2px solid ${
                    cashChange >= 0 ? 'var(--success-border)' : 'var(--danger-border)'
                  }`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontWeight: 800, fontSize: '1rem' }}>Tiền thối lại khách:</span>
                <span
                  style={{
                    fontSize: '1.65rem',
                    fontWeight: 900,
                    fontFamily: 'var(--font-mono)',
                    color: cashChange >= 0 ? 'var(--success)' : 'var(--danger)',
                  }}
                >
                  {formatVND(cashChange)}
                </span>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setCashModalOpen(false)}
              >
                Hủy
              </button>
              <button
                className={`btn btn-success btn-xl ${checkoutProcessing ? 'is-processing' : ''}`}
                style={{ flex: 1 }}
                disabled={checkoutProcessing}
                onClick={handleConfirmCashCheckout}
              >
                {checkoutProcessing ? 'Đang lưu đơn…' : 'Hoàn Tất & Lưu Đơn'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEBT MODAL (Ghi nợ đơn hàng) */}
      {debtModalOpen && (
        <div className="modal-overlay" onClick={() => setDebtModalOpen(false)}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '440px' }}
          >
            <div className="modal-header">
              <div className="modal-title">
                <BookOpen size={22} color="var(--warning)" />
                <span>Ghi Nợ Khách Quen (Mua Thiếu)</span>
              </div>
            </div>

            <form onSubmit={handleConfirmDebtCheckout}>
              <div className="modal-body">
                <div
                  style={{
                    background: 'var(--bg-secondary)',
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '1rem',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Số tiền ghi vào sổ nợ:
                  </div>
                  <div
                    style={{
                      fontSize: '1.75rem',
                      fontWeight: 800,
                      color: 'var(--danger)',
                      fontFamily: 'var(--font-mono)',
                      marginTop: '0.25rem',
                    }}
                  >
                    {formatVND(cartGrandTotal)}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Tên khách quen ghi nợ *:</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="VD: Chị Lan (Bán cơm kế bên)..."
                    required
                    value={customer.name}
                    onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Số điện thoại:</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="0903..."
                    value={customer.phone}
                    onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Ghi chú:</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Hẹn cuối tuần trả..."
                    value={debtNote}
                    onChange={(e) => setDebtNote(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setDebtModalOpen(false)}
                >
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary btn-lg">
                  Xác Nhận Ghi Vào Sổ Nợ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
