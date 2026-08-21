import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  UserCheck,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Phone,
  Clock,
  History,
  Trash2,
  X,
  CreditCard,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const DebtScreen = () => {
  const { debts, addCustomerDebt, repayCustomerDebt, showToast } = useStore();
  const [search, setSearch] = useState('');
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [addDebtModal, setAddDebtModal] = useState(false);
  const [repayModal, setRepayModal] = useState(false);

  const [addForm, setAddForm] = useState({
    customerName: '',
    phone: '',
    amount: '',
    note: '',
  });

  const [repayForm, setRepayForm] = useState({
    amount: '',
    note: '',
  });

  const formatVND = (val) =>
    new Intl.NumberFormat('vi-VN').format(Math.round(val || 0)) + ' đ';

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return `${d.toLocaleTimeString('vi-VN')} - ${d.toLocaleDateString('vi-VN')}`;
  };

  const filteredDebts = debts.filter(
    (d) =>
      !search ||
      d.customerName.toLowerCase().includes(search.toLowerCase()) ||
      (d.phone && d.phone.includes(search))
  );

  const totalOutstandingDebt = debts.reduce((sum, d) => sum + (d.remainingDebt || 0), 0);
  const totalDebtorsCount = debts.filter((d) => d.remainingDebt > 0).length;

  const handleOpenRepayModal = (debt) => {
    setSelectedDebt(debt);
    setRepayForm({
      amount: debt.remainingDebt.toString(),
      note: 'Khách thanh toán nợ',
    });
    setRepayModal(true);
  };

  const handleConfirmRepay = (e) => {
    e.preventDefault();
    if (!repayForm.amount || Number(repayForm.amount) <= 0) {
      showToast('Vui lòng nhập số tiền hợp lệ!', 'warning');
      return;
    }
    repayCustomerDebt(selectedDebt.id, Number(repayForm.amount), repayForm.note);
    setRepayModal(false);
  };

  const handleSaveNewDebt = (e) => {
    e.preventDefault();
    if (!addForm.customerName || !addForm.amount) {
      showToast('Vui lòng nhập tên khách và số tiền nợ!', 'warning');
      return;
    }

    addCustomerDebt({
      customerName: addForm.customerName,
      phone: addForm.phone,
      amount: Number(addForm.amount),
      note: addForm.note,
    });

    setAddDebtModal(false);
    setAddForm({ customerName: '', phone: '', amount: '', note: '' });
  };

  return (
    <div>
      {/* Header */}
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
            <BookOpen size={28} color="var(--primary)" />
            <span>Sổ Ghi Nợ Khách Quen (Mua Chịu)</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '2px' }}>
            Quản lý danh sách khách quen mua thiếu, theo dõi lịch sử trả nợ và nhắc nợ nhẹ nhàng
          </p>
        </div>

        <button
          className="btn btn-primary btn-lg"
          onClick={() => setAddDebtModal(true)}
        >
          <Plus size={20} />
          <span>Ghi Nợ Khách Mới</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
          marginBottom: '1.25rem',
        }}
      >
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Tổng Tiền Khách Đang Nợ
            </span>
            <DollarSign size={20} color="var(--danger)" />
          </div>
          <div
            style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              color: 'var(--danger)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {formatVND(totalOutstandingDebt)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Vốn đang đọng tại khách hàng
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Số Khách Đang Nợ
            </span>
            <UserCheck size={20} color="var(--primary)" />
          </div>
          <div
            style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
            }}
          >
            {totalDebtorsCount} người
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Trên tổng số {debts.length} khách trong sổ
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div
        className="card"
        style={{
          padding: '0.85rem 1rem',
          marginBottom: '1.25rem',
          display: 'flex',
          gap: '0.75rem',
        }}
      >
        <div className="input-icon-wrapper" style={{ flex: 1 }}>
          <Search size={18} className="input-icon" />
          <input
            type="text"
            className="form-control"
            placeholder="Tìm theo tên khách quen hoặc số điện thoại..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Debts Table & History Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.25rem' }}>
        {/* LEFT: Debtors List */}
        <div className="card">
          <div className="card-header">
            <span style={{ fontWeight: 700 }}>Danh sách khách ghi sổ</span>
            <span className="badge badge-primary">{filteredDebts.length} khách</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Khách hàng</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Còn nợ</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>Trạng thái</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredDebts.map((d) => {
                  const isCleared = d.remainingDebt === 0;

                  return (
                    <tr
                      key={d.id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        background: selectedDebt?.id === d.id ? 'var(--bg-secondary)' : 'transparent',
                      }}
                      onClick={() => setSelectedDebt(d)}
                    >
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 700 }}>{d.customerName}</div>
                        {d.phone && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Phone size={12} /> {d.phone}
                          </div>
                        )}
                      </td>

                      <td
                        style={{
                          padding: '0.75rem 0.5rem',
                          textAlign: 'right',
                          fontWeight: 800,
                          fontSize: '0.95rem',
                          color: isCleared ? 'var(--success)' : 'var(--danger)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {formatVND(d.remainingDebt)}
                      </td>

                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                        {isCleared ? (
                          <span className="badge badge-success">Đã trả hết</span>
                        ) : (
                          <span className="badge badge-danger">Đang nợ</span>
                        )}
                      </td>

                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                        {!isCleared && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenRepayModal(d);
                            }}
                          >
                            <CheckCircle2 size={14} />
                            <span>Thu Nợ</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT: Debt History Detail for Selected Customer */}
        <div>
          <div className="card" style={{ position: 'sticky', top: '5.5rem' }}>
            <div className="card-header">
              <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <History size={16} />
                <span>Lịch Sử Vay & Trả Chi Tiết</span>
              </span>
            </div>

            <div className="card-body">
              {selectedDebt ? (
                <div>
                  <div
                    style={{
                      background: 'var(--bg-secondary)',
                      padding: '0.85rem',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: '1rem',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: '1rem' }}>
                      {selectedDebt.customerName}
                    </div>
                    {selectedDebt.phone && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        SĐT: {selectedDebt.phone}
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Số nợ hiện tại:</span>
                      <span style={{ fontWeight: 800, color: selectedDebt.remainingDebt > 0 ? 'var(--danger)' : 'var(--success)', fontFamily: 'var(--font-mono)' }}>
                        {formatVND(selectedDebt.remainingDebt)}
                      </span>
                    </div>
                  </div>

                  {/* History Timeline */}
                  <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                    {selectedDebt.history.map((h, i) => (
                      <div
                        key={i}
                        style={{
                          padding: '0.6rem 0',
                          borderBottom: '1px solid var(--border-color)',
                          fontSize: '0.8rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                          <span style={{ color: h.type === 'borrow' ? 'var(--danger)' : 'var(--success)' }}>
                            {h.type === 'borrow' ? 'MUA NỢ (-)' : 'TRẢ NỢ (+)'}
                          </span>
                          <span style={{ fontFamily: 'var(--font-mono)' }}>
                            {formatVND(h.amount)}
                          </span>
                        </div>
                        <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {h.note}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '2px' }}>
                          {formatDate(h.date)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedDebt.remainingDebt > 0 && (
                    <button
                      className="btn btn-success btn-lg"
                      style={{ width: '100%', marginTop: '1rem' }}
                      onClick={() => handleOpenRepayModal(selectedDebt)}
                    >
                      <CreditCard size={18} />
                      <span>Thu Tiền Nợ Từ Khách</span>
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                  <BookOpen size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                  <p style={{ fontSize: '0.85rem' }}>Chọn một khách hàng bên trái để xem lịch sử nợ</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ADD NEW DEBT MODAL */}
      {addDebtModal && (
        <div className="modal-overlay" onClick={() => setAddDebtModal(false)}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '440px' }}
          >
            <div className="modal-header">
              <div className="modal-title">
                <Plus size={20} color="var(--primary)" />
                <span>Ghi Nợ Khách Hàng Mới</span>
              </div>
            </div>

            <form onSubmit={handleSaveNewDebt}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Tên khách quen *:</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="VD: Chị Mai (Nhà đầu hẻm)..."
                    required
                    value={addForm.customerName}
                    onChange={(e) => setAddForm({ ...addForm, customerName: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Số điện thoại (nếu có):</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="0901..."
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Số tiền ghi nợ (VNĐ) *:</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="50000"
                    required
                    value={addForm.amount}
                    onChange={(e) => setAddForm({ ...addForm, amount: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nội dung mua nợ:</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    placeholder="VD: Mua 10 gói mì Hảo Hảo + 1 chai mắm Nam Ngư..."
                    value={addForm.note}
                    onChange={(e) => setAddForm({ ...addForm, note: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setAddDebtModal(false)}
                >
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  Ghi Vào Sổ Nợ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REPAY DEBT MODAL */}
      {repayModal && selectedDebt && (
        <div className="modal-overlay" onClick={() => setRepayModal(false)}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '420px' }}
          >
            <div className="modal-header">
              <div className="modal-title">
                <CheckCircle2 size={20} color="var(--success)" />
                <span>Thu Nợ Từ Khách</span>
              </div>
            </div>

            <form onSubmit={handleConfirmRepay}>
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
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Khách: <strong>{selectedDebt.customerName}</strong>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--danger)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                    Còn nợ: {formatVND(selectedDebt.remainingDebt)}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Số tiền khách trả (VNĐ) *:</label>
                  <input
                    type="number"
                    className="form-control"
                    style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}
                    required
                    value={repayForm.amount}
                    onChange={(e) => setRepayForm({ ...repayForm, amount: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Ghi chú:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={repayForm.note}
                    onChange={(e) => setRepayForm({ ...repayForm, note: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setRepayModal(false)}
                >
                  Hủy
                </button>
                <button type="submit" className="btn btn-success">
                  Xác Nhận Đã Thu Tiền
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
