import React, { useState } from 'react';
import { Search, ScanBarcode, Plus, Minus, Trash2, Banknote, QrCode, BookOpen } from 'lucide-react';
import { useStore } from '../context/StoreContext';

// Simplified selling screen for elderly users: large text, large buttons,
// name + selling price only. It deliberately never shows cost price,
// VAT/discount breakdowns, loyalty or management menus. Checkout reuses
// the exact same checkoutOrder / VietQR flow as the standard POS screen,
// so the server still assigns the order code and recalculates totals.
export const ElderPOSScreen = () => {
  const {
    products,
    categories,
    cart,
    addToCart,
    updateCartQty,
    removeFromCart,
    clearCart,
    cartGrandTotal,
    checkoutOrder,
    checkoutProcessing,
    setActiveInvoice,
    setVietQrData,
    openScanner,
    customer,
    setCustomer,
    showToast,
  } = useStore();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cashModalOpen, setCashModalOpen] = useState(false);
  const [cashReceived, setCashReceived] = useState('');
  const [debtModalOpen, setDebtModalOpen] = useState(false);
  const [debtCustomer, setDebtCustomer] = useState('');

  const formatVND = (val) =>
    new Intl.NumberFormat('vi-VN').format(Math.round(val || 0)) + ' đ';

  const filteredProducts = products.filter((prod) => {
    const matchCat = selectedCategory === 'all' || prod.category === selectedCategory;
    const matchSearch =
      !search ||
      prod.name.toLowerCase().includes(search.toLowerCase()) ||
      prod.barcode.includes(search);
    return matchCat && matchSearch;
  });

  const handleCashCheckout = async () => {
    const receivedNum = Number(cashReceived) || cartGrandTotal;
    if (receivedNum < cartGrandTotal) {
      showToast('Số tiền khách đưa chưa đủ!', 'warning');
      return;
    }
    const completedOrder = await checkoutOrder({ paymentMethod: 'cash', receivedAmount: receivedNum });
    setCashModalOpen(false);
    if (completedOrder) setActiveInvoice(completedOrder);
  };

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

  const handleDebtCheckout = async (e) => {
    e.preventDefault();
    const name = (debtCustomer || customer.name || '').trim();
    if (!name || name === 'Khách lẻ') {
      showToast('Vui lòng nhập tên khách quen để ghi sổ nợ!', 'warning');
      return;
    }
    setCustomer({ ...customer, name });
    const completedOrder = await checkoutOrder({ paymentMethod: 'debt', customerName: name });
    setDebtModalOpen(false);
    setDebtCustomer('');
    if (completedOrder) setActiveInvoice(completedOrder);
  };

  const openCashModal = () => {
    if (cart.length === 0) {
      showToast('Chưa có hàng trong đơn!', 'warning');
      return;
    }
    setCashReceived(cartGrandTotal.toString());
    setCashModalOpen(true);
  };

  const cashChange = Math.max(0, (Number(cashReceived) || 0) - cartGrandTotal);

  return (
    <div className="elder-pos">
      <div className="elder-header">
        <h2>🛒 Bán Hàng Đơn Giản</h2>
        <p>Chọn món, bấm Thêm, rồi bấm 1 trong 3 nút thanh toán.</p>
      </div>

      {/* Very large search */}
      <div className="elder-search-row">
        <div className="input-icon-wrapper elder-search-input">
          <Search size={26} className="input-icon" />
          <input
            type="text"
            className="form-control"
            placeholder="Gõ tên hàng hoặc mã vạch…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Tìm hàng theo tên hoặc mã vạch"
          />
        </div>
        <button type="button" className="btn btn-primary elder-big-btn" onClick={() => openScanner('pos')}>
          <ScanBarcode size={26} />
          <span>Quét Mã</span>
        </button>
      </div>

      {/* Large category chips */}
      <div className="elder-categories">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`btn ${selectedCategory === cat.id ? 'btn-primary' : 'btn-secondary'} elder-chip`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="elder-layout">
        {/* Large product grid: name + selling price + Add only */}
        <div className="elder-products">
          {filteredProducts.length === 0 && (
            <div className="elder-empty">Không tìm thấy mặt hàng nào. Thử gõ tên khác hoặc quét mã vạch.</div>
          )}
          {filteredProducts.map((prod) => {
            const outOfStock = prod.stock <= 0;
            return (
              <div key={prod.id} className={`elder-product-card ${outOfStock ? 'out-of-stock' : ''}`}>
                <div className="elder-product-name">{prod.name}</div>
                <div className="elder-product-price">{formatVND(prod.price)}</div>
                <div className="elder-product-stock">
                  {outOfStock ? 'Hết hàng' : `Còn ${prod.stock} ${prod.unit}`}
                </div>
                <button
                  type="button"
                  className="btn btn-primary elder-add-btn"
                  disabled={outOfStock}
                  onClick={() => addToCart(prod, 1)}
                >
                  <Plus size={24} /> Thêm
                </button>
              </div>
            );
          })}
        </div>

        {/* Large cart */}
        <div className="elder-cart card">
          <h3>🧾 Giỏ Hàng ({cart.length} món)</h3>
          {cart.length === 0 ? (
            <div className="elder-empty">Chưa có món nào. Bấm “Thêm” ở món hàng bên trái.</div>
          ) : (
            <div className="elder-cart-list">
              {cart.map((item) => (
                <div key={item.productId} className="elder-cart-item">
                  <div className="elder-cart-info">
                    <div className="elder-cart-name">{item.name}</div>
                    <div className="elder-cart-price">
                      {formatVND(item.price)} × {item.qty} = {formatVND(item.price * item.qty)}
                    </div>
                  </div>
                  <div className="elder-qty-controls">
                    <button
                      type="button"
                      className="btn btn-secondary elder-qty-btn"
                      aria-label="Giảm số lượng"
                      onClick={() => updateCartQty(item.productId, item.qty - 1)}
                    >
                      <Minus size={26} />
                    </button>
                    <span className="elder-qty-value">{item.qty}</span>
                    <button
                      type="button"
                      className="btn btn-secondary elder-qty-btn"
                      aria-label="Tăng số lượng"
                      onClick={() => updateCartQty(item.productId, item.qty + 1)}
                    >
                      <Plus size={26} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary elder-qty-btn elder-remove-btn"
                      aria-label="Xóa món này"
                      onClick={() => removeFromCart(item.productId)}
                    >
                      <Trash2 size={22} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="elder-total">
            <div>TỔNG TIỀN</div>
            <div className="elder-total-number">{formatVND(cartGrandTotal)}</div>
          </div>

          <div className="elder-payments">
            <button type="button" className="btn btn-success elder-pay-btn" onClick={openCashModal}>
              <Banknote size={30} /> Tiền mặt
            </button>
            <button type="button" className={`btn btn-primary elder-pay-btn ${checkoutProcessing ? 'is-processing' : ''}`} disabled={checkoutProcessing} onClick={handleVietQrCheckout}>
              <QrCode size={30} /> {checkoutProcessing ? 'Đang lưu…' : 'VietQR'}
            </button>
            <button
              type="button"
              className="btn btn-secondary elder-pay-btn"
              onClick={() => {
                if (cart.length === 0) {
                  showToast('Chưa có hàng trong đơn!', 'warning');
                  return;
                }
                setDebtCustomer(customer.name && customer.name !== 'Khách lẻ' ? customer.name : '');
                setDebtModalOpen(true);
              }}
            >
              <BookOpen size={30} /> Ghi nợ
            </button>
            <button
              type="button"
              className="btn btn-danger elder-pay-btn"
              onClick={() => {
                if (window.confirm('Xóa hết giỏ hàng?')) clearCart();
              }}
            >
              <Trash2 size={30} /> Xóa giỏ
            </button>
          </div>
        </div>
      </div>

      {/* Cash modal: big input + change shown in large text */}
      {cashModalOpen && (
        <div className="modal-overlay" onClick={() => setCashModalOpen(false)}>
          <div className="modal-dialog elder-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">💵 Thu Tiền Mặt</div>
            </div>
            <div className="modal-body">
              <div className="elder-modal-total">Cần thu: {formatVND(cartGrandTotal)}</div>
              <label className="elder-label" htmlFor="elder-cash-received">Khách đưa bao nhiêu?</label>
              <input
                id="elder-cash-received"
                type="number"
                className="form-control elder-modal-input"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                autoFocus
              />
              <div className="elder-modal-change">Tiền thừa trả lại: {formatVND(cashChange)}</div>
              <div className="elder-modal-actions">
                <button type="button" className={`btn btn-success elder-big-btn ${checkoutProcessing ? 'is-processing' : ''}`} disabled={checkoutProcessing} onClick={handleCashCheckout}>
                  {checkoutProcessing ? 'Đang lưu…' : 'Xong — Thu Tiền'}
                </button>
                <button type="button" className="btn btn-secondary elder-big-btn" onClick={() => setCashModalOpen(false)}>
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debt modal: only a customer name is needed */}
      {debtModalOpen && (
        <div className="modal-overlay" onClick={() => setDebtModalOpen(false)}>
          <div className="modal-dialog elder-modal" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleDebtCheckout}>
              <div className="modal-header">
                <div className="modal-title">📖 Ghi Nợ Cho Ai?</div>
              </div>
              <div className="modal-body">
                <label className="elder-label" htmlFor="elder-debt-name">Tên khách quen</label>
                <input
                  id="elder-debt-name"
                  type="text"
                  className="form-control elder-modal-input"
                  placeholder="Ví dụ: Cô Mai"
                  value={debtCustomer}
                  onChange={(e) => setDebtCustomer(e.target.value)}
                  autoFocus
                />
                <div className="elder-modal-actions">
                  <button type="submit" className={`btn btn-primary elder-big-btn ${checkoutProcessing ? 'is-processing' : ''}`} disabled={checkoutProcessing}>
                    {checkoutProcessing ? 'Đang lưu…' : `Ghi Nợ ${formatVND(cartGrandTotal)}`}
                  </button>
                  <button type="button" className="btn btn-secondary elder-big-btn" onClick={() => setDebtModalOpen(false)}>
                    Hủy
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
