import React, { useState } from 'react';
import {
  Gift,
  Award,
  Search,
  User,
  Phone,
  Plus,
  Check,
  X,
  Sparkles,
  Heart,
  ArrowRight,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const LoyaltyModal = () => {
  const {
    loyaltyModalOpen,
    setLoyaltyModalOpen,
    loyaltyCustomers,
    customer,
    setCustomer,
    cartDiscount,
    setCartDiscount,
    cartGrandTotal,
    saveLoyaltyCustomer,
    showToast,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [newName, setNewName] = useState('');
  const [newPhoneLast4, setNewPhoneLast4] = useState('');
  const [selectedLoyalty, setSelectedLoyalty] = useState(null);

  if (!loyaltyModalOpen) return null;

  const formatVND = (val) =>
    new Intl.NumberFormat('vi-VN').format(Math.round(val || 0)) + ' đ';

  // Filter loyalty customers
  const filteredCustomers = loyaltyCustomers.filter((c) => {
    const matchName = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchPhone = (c.phoneLast4 && c.phoneLast4.includes(searchQuery)) || (c.fullPhone && c.fullPhone.includes(searchQuery));
    return matchName || matchPhone;
  });

  // Select customer
  const handleSelectCustomer = (cust) => {
    setSelectedLoyalty(cust);
    setCustomer({
      ...customer,
      name: cust.name,
      phone: cust.fullPhone || `...${cust.phoneLast4}`,
    });
    showToast(`Đã chọn khách quen: ${cust.name} (Có ${cust.points || 0} điểm)`, 'info');
  };

  // Redeem Points (Đổi điểm trừ tiền)
  const handleRedeemPoints = (pointsToRedeem, discountVnd) => {
    if (!selectedLoyalty || (selectedLoyalty.points || 0) < pointsToRedeem) {
      showToast('Khách không đủ điểm để đổi quà này!', 'warning');
      return;
    }

    // Apply discount
    setCartDiscount({ type: 'amount', value: discountVnd });

    // Update customer points
    saveLoyaltyCustomer({
      customer: selectedLoyalty,
      pointsChange: -pointsToRedeem,
      spentAmount: 0,
    });

    setLoyaltyModalOpen(false);
    showToast(`Đã đổi ${pointsToRedeem} điểm -> Giảm ${formatVND(discountVnd)} cho khách!`, 'success');
  };

  // Add new loyalty customer
  const handleAddNewCustomer = (e) => {
    e.preventDefault();
    if (!newName.trim() || !newPhoneLast4.trim()) {
      showToast('Vui lòng nhập tên và 4 số đuôi điện thoại!', 'warning');
      return;
    }

    const newCust = {
      name: newName.trim(),
      phoneLast4: newPhoneLast4.trim().slice(-4),
      fullPhone: newPhoneLast4.trim().length > 4 ? newPhoneLast4.trim() : '',
    };

    saveLoyaltyCustomer({
      customer: newCust,
      pointsChange: 10, // bonus 10 points on welcome
      spentAmount: 0,
    });

    setCustomer({ ...customer, name: newCust.name, phone: newCust.fullPhone || `...${newCust.phoneLast4}` });
    setNewName('');
    setNewPhoneLast4('');
    showToast(`Đã đăng ký tích điểm cho "${newCust.name}" (Tặng 10 điểm chào mừng)!`, 'success');
  };

  return (
    <div className="modal-overlay" onClick={() => setLoyaltyModalOpen(false)}>
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div className="modal-header">
          <div className="modal-title">
            <Gift size={22} color="var(--primary)" />
            <span>Tích Điểm & Đổi Quà Khách Quen Trong Xóm</span>
          </div>
          <button
            className="btn btn-secondary btn-icon"
            onClick={() => setLoyaltyModalOpen(false)}
          >
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '1rem' }}>
          {/* Search box */}
          <div className="input-icon-wrapper" style={{ marginBottom: '0.85rem' }}>
            <Search size={16} className="input-icon" />
            <input
              type="text"
              className="form-control"
              placeholder="Tìm theo tên hoặc 4 số đuôi SĐT (VD: Lan, 8899)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>

          {/* Loyalty List */}
          <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
            {filteredCustomers.map((cust) => {
              const isSelected = selectedLoyalty && selectedLoyalty.id === cust.id;
              return (
                <div
                  key={cust.id}
                  onClick={() => handleSelectCustomer(cust)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.6rem 0.85rem',
                    borderBottom: '1px solid var(--border-color)',
                    background: isSelected ? 'var(--primary-light)' : 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.875rem' }}>
                      {cust.name} {cust.phoneLast4 ? `(Đuôi ${cust.phoneLast4})` : ''}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Tổng mua: {formatVND(cust.totalSpent || 0)}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span className="badge badge-success" style={{ fontSize: '0.8rem', fontWeight: 800 }}>
                      ⭐ {cust.points || 0} Điểm
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Points Redemption Options for Selected Customer */}
          {selectedLoyalty && (
            <div
              style={{
                background: 'var(--bg-secondary)',
                padding: '0.85rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1rem',
                border: '2px solid var(--primary-border)',
              }}
            >
              <div style={{ fontWeight: 800, fontSize: '0.85rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Award size={16} color="var(--primary)" />
                <span>Đổi Điểm Trừ Tiền Cho: <strong>{selectedLoyalty.name}</strong> ({selectedLoyalty.points || 0} điểm)</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '0.4rem 0.2rem', fontSize: '0.75rem', fontWeight: 700 }}
                  disabled={(selectedLoyalty.points || 0) < 50}
                  onClick={() => handleRedeemPoints(50, 5000)}
                >
                  <div>50 Điểm</div>
                  <div style={{ color: 'var(--success)' }}>-5.000 đ</div>
                </button>

                <button
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '0.4rem 0.2rem', fontSize: '0.75rem', fontWeight: 700 }}
                  disabled={(selectedLoyalty.points || 0) < 100}
                  onClick={() => handleRedeemPoints(100, 10000)}
                >
                  <div>100 Điểm</div>
                  <div style={{ color: 'var(--success)' }}>-10.000 đ</div>
                </button>

                <button
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '0.4rem 0.2rem', fontSize: '0.75rem', fontWeight: 700 }}
                  disabled={(selectedLoyalty.points || 0) < 200}
                  onClick={() => handleRedeemPoints(200, 20000)}
                >
                  <div>200 Điểm</div>
                  <div style={{ color: 'var(--success)' }}>-20.000 đ</div>
                </button>
              </div>
            </div>
          )}

          {/* Quick Register New Loyalty Customer */}
          <form onSubmit={handleAddNewCustomer} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
              + Thêm Khách Quen Tích Điểm Mới:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr auto', gap: '0.4rem' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Tên khách (VD: Chú Bảy)..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <input
                type="text"
                className="form-control"
                placeholder="4 số đuôi SĐT (VD: 5566)..."
                value={newPhoneLast4}
                onChange={(e) => setNewPhoneLast4(e.target.value)}
              />
              <button type="submit" className="btn btn-primary btn-sm">
                <Plus size={14} />
                <span>Thêm</span>
              </button>
            </div>
          </form>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setLoyaltyModalOpen(false)}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
