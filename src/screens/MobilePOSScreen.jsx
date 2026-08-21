import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  ScanBarcode,
  Camera,
  Plus,
  Minus,
  Trash2,
  Banknote,
  QrCode,
  BookOpen,
  Wifi,
  Store,
  CheckCircle2,
  RefreshCw,
  X,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Gift,
  Clock,
  Lock,
  Unlock,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const MobilePOSScreen = () => {
  const {
    products,
    cart,
    addToCart,
    updateCartQty,
    removeFromCart,
    clearCart,
    cartGrandTotal,
    checkoutOrder,
    setActiveInvoice,
    setVietQrData,
    isLanConnected,
    isPinUnlocked,
    requireManagerPin,
    lockManagerPin,
    setPinModalOpen,
    setMobileAddProductOpen,
    setLoyaltyModalOpen,
    setShiftModalOpen,
    playBeep,
    showToast,
  } = useStore();

  const [isCameraActive, setIsCameraActive] = useState(true);
  const [facingMode, setFacingMode] = useState('environment');
  const [cashModalOpen, setCashModalOpen] = useState(false);
  const [cashReceived, setCashReceived] = useState('');
  const [debtModalOpen, setDebtModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [cashierName, setCashierName] = useState(() => localStorage.getItem('smartpos_cashier_name') || 'Điện Thoại 1');
  const [cameraCollapsed, setCameraCollapsed] = useState(false);

  const html5QrCodeRef = useRef(null);

  const formatVND = (val) =>
    new Intl.NumberFormat('vi-VN').format(Math.round(val || 0)) + ' đ';

  useEffect(() => {
    let isMounted = true;

    const startCamera = async () => {
      try {
        if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }

        const qrCode = new Html5Qrcode('mobile-camera-viewport');
        html5QrCodeRef.current = qrCode;

        const config = {
          fps: 15,
          qrbox: { width: 220, height: 140 },
          aspectRatio: 1.5,
        };

        await qrCode.start(
          { facingMode: facingMode },
          config,
          (decodedText) => {
            if (isMounted) {
              playBeep();
              const found = products.find((p) => p.barcode === decodedText);
              if (found) {
                addToCart(found, 1);
                showToast(`+1 ${found.name}`, 'success');
              } else {
                showToast(`Mã mới: ${decodedText}`, 'info');
              }
            }
          },
          () => {}
        );

        if (isMounted) setIsCameraActive(true);
      } catch (err) {
        console.warn('Mobile camera start error:', err);
        if (isMounted) setIsCameraActive(false);
      }
    };

    if (!cameraCollapsed) {
      const timer = setTimeout(() => {
        startCamera();
      }, 300);
      return () => {
        isMounted = false;
        clearTimeout(timer);
        if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
          html5QrCodeRef.current.stop().catch(() => {});
        }
      };
    } else {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    }
  }, [facingMode, cameraCollapsed, products]);

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleCashierChange = (name) => {
    setCashierName(name);
    localStorage.setItem('smartpos_cashier_name', name);
  };

  const handleConfirmCash = () => {
    const receivedNum = Number(cashReceived) || cartGrandTotal;
    const completed = checkoutOrder({
      paymentMethod: 'cash',
      receivedAmount: receivedNum,
    });
    setCashModalOpen(false);
    if (completed) setActiveInvoice(completed);
  };

  const handleConfirmDebt = () => {
    if (!customerName.trim()) {
      showToast('Vui lòng nhập tên khách ghi nợ!', 'warning');
      return;
    }
    const completed = checkoutOrder({
      paymentMethod: 'debt',
      customerName,
    });
    setDebtModalOpen(false);
    setCustomerName('');
    if (completed) setActiveInvoice(completed);
  };

  const cashChange = Math.max(0, (Number(cashReceived) || 0) - cartGrandTotal);

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '5rem' }}>
      {/* Top Mobile Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-card)',
          padding: '0.6rem 0.85rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '0.75rem',
          border: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Smartphone size={18} color="var(--primary)" />
          <select
            className="form-control"
            style={{ padding: '2px 6px', fontSize: '0.8rem', fontWeight: 700, width: 'auto' }}
            value={cashierName}
            onChange={(e) => handleCashierChange(e.target.value)}
          >
            <option value="Quầy 1 - ĐT">Quầy 1 (ĐT)</option>
            <option value="Quầy 2 - ĐT Vợ">Quầy 2 (ĐT Vợ)</option>
            <option value="Quầy 3 - ĐT Chồng">Quầy 3 (ĐT Chồng)</option>
            <option value="Kho Bán Hàng">Quầy Kho</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          {isPinUnlocked ? (
            <>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setMobileAddProductOpen(true)}
                style={{ padding: '3px 7px', fontSize: '0.725rem', fontWeight: 700 }}
                title="Quét mã và chụp ảnh sản phẩm mới"
              >
                <Camera size={13} />
                <span>+ Hàng Mới</span>
              </button>

              <button
                className="btn btn-secondary btn-sm"
                onClick={lockManagerPin}
                style={{ padding: '3px 6px', fontSize: '0.725rem', color: 'var(--success)', fontWeight: 700 }}
                title="Khóa lại chế độ chỉ bán hàng"
              >
                <Unlock size={12} />
                <span>Khóa</span>
              </button>
            </>
          ) : (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setPinModalOpen(true)}
              style={{ padding: '3px 7px', fontSize: '0.725rem', fontWeight: 700 }}
              title="Nhập mã PIN để mở quyền chủ tiệm"
            >
              <Lock size={12} color="var(--warning)" />
              <span>Chủ Tiệm</span>
            </button>
          )}

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setCameraCollapsed(!cameraCollapsed)}
            style={{ padding: '3px 6px', fontSize: '0.725rem' }}
          >
            {cameraCollapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
            <span>{cameraCollapsed ? 'Camera' : 'Thu'}</span>
          </button>
        </div>
      </div>

      {/* MOBILE LIVE CAMERA VIEWPORT */}
      {!cameraCollapsed && (
        <div
          style={{
            position: 'relative',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            background: '#0B0F19',
            minHeight: '180px',
            maxHeight: '220px',
            marginBottom: '0.75rem',
            border: '2px solid var(--primary-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div id="mobile-camera-viewport" style={{ width: '100%', height: '100%' }} />

          <button
            onClick={toggleFacingMode}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'rgba(0,0,0,0.6)',
              color: '#fff',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10,
            }}
          >
            <RefreshCw size={16} />
          </button>

          <div
            style={{
              position: 'absolute',
              bottom: '6px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.7)',
              color: '#34D399',
              padding: '2px 8px',
              borderRadius: '9999px',
              fontSize: '0.7rem',
              fontWeight: 700,
              pointerEvents: 'none',
            }}
          >
            Hướng camera vào mã vạch trên bao bì
          </div>
        </div>
      )}

      {/* CURRENT CART ITEMS ON MOBILE */}
      <div className="card" style={{ marginBottom: '0.75rem' }}>
        <div className="card-header" style={{ padding: '0.5rem 0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>
              Đơn Hàng ({cart.length} món)
            </span>
            <button
              className="btn btn-secondary btn-sm"
              style={{ padding: '2px 6px', fontSize: '0.7rem', color: 'var(--warning)', fontWeight: 700 }}
              onClick={() => setLoyaltyModalOpen(true)}
              title="Tích điểm khách quen"
            >
              <Gift size={12} />
              <span>Điểm</span>
            </button>
          </div>

          {cart.length > 0 && (
            <button
              className="btn btn-secondary btn-sm"
              style={{ padding: '2px 6px', fontSize: '0.7rem' }}
              onClick={clearCart}
            >
              <RotateCcw size={12} />
              <span>Xóa</span>
            </button>
          )}
        </div>

        <div className="card-body" style={{ padding: '0.5rem', maxHeight: '240px', overflowY: 'auto' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Chưa có món nào. Đưa camera vào mã vạch để quét!
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.productId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.4rem 0.2rem',
                  borderBottom: '1px solid var(--border-color)',
                  gap: '0.4rem',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600 }}>
                    {formatVND(item.price)}/{item.unit}
                  </div>
                </div>

                {/* Qty Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: 'var(--bg-secondary)', padding: '1px', borderRadius: '4px' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ width: '22px', height: '22px', padding: 0 }}
                    onClick={() => updateCartQty(item.productId, item.qty - 1)}
                  >
                    <Minus size={10} />
                  </button>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, minWidth: '18px', textAlign: 'center' }}>
                    {item.qty}
                  </span>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ width: '22px', height: '22px', padding: 0 }}
                    onClick={() => updateCartQty(item.productId, item.qty + 1)}
                  >
                    <Plus size={10} />
                  </button>
                </div>

                <div style={{ fontWeight: 800, fontSize: '0.85rem', minWidth: '65px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                  {formatVND(item.price * item.qty)}
                </div>

                <button
                  onClick={() => removeFromCart(item.productId)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '2px' }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* BIG BOTTOM STICKY CHECKOUT DISPLAY (Thanh toán to rõ ràng trên điện thoại) */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'var(--bg-glass-strong)',
          backdropFilter: 'blur(16px)',
          borderTop: '2px solid var(--border-color)',
          padding: '0.75rem 1rem',
          zIndex: 40,
          boxShadow: '0 -4px 16px rgba(0,0,0,0.15)',
        }}
      >
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              TỔNG TIỀN ({cart.length} món):
            </span>
            <span
              style={{
                fontSize: '1.65rem',
                fontWeight: 900,
                color: 'var(--success)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {formatVND(cartGrandTotal)}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.4rem' }}>
            <button
              className="btn btn-success btn-lg"
              style={{ fontSize: '1rem', padding: '0.65rem' }}
              disabled={cart.length === 0}
              onClick={() => {
                setCashReceived(cartGrandTotal.toString());
                setCashModalOpen(true);
              }}
            >
              <Banknote size={20} />
              <span>Tiền Mặt</span>
            </button>

            <button
              className="btn btn-primary"
              disabled={cart.length === 0}
              onClick={() => {
                const orderId = `HD-${Date.now().toString().slice(-6)}`;
                setVietQrData({ amount: cartGrandTotal, orderId });
              }}
            >
              <QrCode size={16} />
              <span>VietQR</span>
            </button>

            <button
              className="btn btn-secondary"
              style={{ color: 'var(--warning)', borderColor: 'var(--warning-border)', fontWeight: 700 }}
              disabled={cart.length === 0}
              onClick={() => setDebtModalOpen(true)}
            >
              <BookOpen size={16} />
              <span>Ghi Nợ</span>
            </button>
          </div>
        </div>
      </div>

      {/* CASH PAYMENT MODAL */}
      {cashModalOpen && (
        <div className="modal-overlay" onClick={() => setCashModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '380px' }}>
            <div className="modal-header">
              <div className="modal-title">
                <Banknote size={20} color="var(--success)" />
                <span>Tiền Mặt & Tiền Thừa</span>
              </div>
            </div>

            <div className="modal-body">
              <div style={{ background: '#1E1B4B', color: '#34D399', padding: '0.85rem', borderRadius: '8px', textAlign: 'center', marginBottom: '0.85rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#fff', opacity: 0.8 }}>Khách Phải Trả:</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>
                  {formatVND(cartGrandTotal)}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Tiền khách đưa (VNĐ):</label>
                <input
                  type="number"
                  className="form-control"
                  style={{ fontSize: '1.35rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginBottom: '0.85rem' }}>
                {[cartGrandTotal, 50000, 100000, 200000, 500000].map((val, idx) => (
                  <button key={idx} className="btn btn-secondary btn-sm" onClick={() => setCashReceived(val.toString())}>
                    {formatVND(val)}
                  </button>
                ))}
              </div>

              <div style={{ padding: '0.75rem 1rem', background: cashChange >= 0 ? 'var(--success-light)' : 'var(--danger-light)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700 }}>Tiền thối lại:</span>
                <span style={{ fontSize: '1.4rem', fontWeight: 900, color: cashChange >= 0 ? 'var(--success)' : 'var(--danger)', fontFamily: 'var(--font-mono)' }}>
                  {formatVND(cashChange)}
                </span>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setCashModalOpen(false)}>Hủy</button>
              <button className="btn btn-success btn-lg" style={{ flex: 1 }} onClick={handleConfirmCash}>
                Lưu Đơn Hàng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEBT MODAL */}
      {debtModalOpen && (
        <div className="modal-overlay" onClick={() => setDebtModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '380px' }}>
            <div className="modal-header">
              <div className="modal-title">
                <BookOpen size={20} color="var(--warning)" />
                <span>Ghi Nợ Khách Quen</span>
              </div>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Tên khách quen *:</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="VD: Chị Lan bán cơm..."
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  autoFocus
                />
              </div>

              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--danger)', textAlign: 'center', marginTop: '0.5rem' }}>
                Ghi nợ: {formatVND(cartGrandTotal)}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDebtModalOpen(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleConfirmDebt}>Xác Nhận</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
