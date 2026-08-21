import React, { useState, useEffect } from 'react';
import {
  Clock,
  Banknote,
  QrCode,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Calculator,
  Save,
  X,
  Calendar,
  Layers,
  History,
  ShieldCheck,
  Printer,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const ShiftReportModal = () => {
  const {
    shiftModalOpen,
    setShiftModalOpen,
    orders,
    debts,
    saveShiftReport,
    shiftsHistory,
    showToast,
  } = useStore();

  const [shiftTab, setShiftTab] = useState('current'); // 'current' | 'history'
  const [cashierName, setCashierName] = useState(() => localStorage.getItem('smartpos_cashier_name') || 'Chủ Tiệm (Toàn Ca)');
  const [notes, setNotes] = useState('');

  // Cash denomination counter
  const [denominations, setDenominations] = useState({
    500000: 0,
    200000: 0,
    100000: 0,
    50000: 0,
    20000: 0,
    10000: 0,
    5000: 0,
    2000: 0,
    1000: 0,
  });

  const [directCashCount, setDirectCashCount] = useState('');
  const [useDenominations, setUseDenominations] = useState(false);

  if (!shiftModalOpen) return null;

  const formatVND = (val) =>
    new Intl.NumberFormat('vi-VN').format(Math.round(val || 0)) + ' đ';

  // Calculate Shift Orders (From 04:00 AM today to now)
  const now = new Date();
  const shiftStart = new Date();
  shiftStart.setHours(4, 0, 0, 0); // 4h00 AM today

  const todayOrders = orders.filter((o) => {
    const orderDate = new Date(o.createdAt);
    return orderDate >= shiftStart;
  });

  // Shift Totals
  const totalRevenue = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalCash = todayOrders
    .filter((o) => o.paymentMethod === 'cash')
    .reduce((sum, o) => sum + (o.total || 0), 0);
  const totalVietQr = todayOrders
    .filter((o) => o.paymentMethod === 'vietqr')
    .reduce((sum, o) => sum + (o.total || 0), 0);
  const totalDebt = todayOrders
    .filter((o) => o.paymentMethod === 'debt')
    .reduce((sum, o) => sum + (o.total || 0), 0);
  const totalProfit = todayOrders.reduce((sum, o) => sum + (o.profit || 0), 0);

  // Total Counted Cash
  const denomTotal = Object.entries(denominations).reduce(
    (sum, [denom, count]) => sum + Number(denom) * (Number(count) || 0),
    0
  );

  const actualCashCounted = useDenominations
    ? denomTotal
    : directCashCount !== ''
    ? Number(directCashCount)
    : totalCash;

  const cashDifference = actualCashCounted - totalCash;

  const handleSaveShift = () => {
    const shiftPayload = {
      shiftDate: now.toLocaleDateString('vi-VN'),
      shiftTimeRange: '04:00 - 22:00',
      closedAt: now.toISOString(),
      cashier: cashierName,
      ordersCount: todayOrders.length,
      totalRevenue,
      totalCash,
      totalVietQr,
      totalDebt,
      totalProfit,
      actualCashCounted,
      cashDifference,
      status: cashDifference === 0 ? 'balanced' : cashDifference > 0 ? 'surplus' : 'deficit',
      notes,
    };

    saveShiftReport(shiftPayload);
    setShiftModalOpen(false);
    showToast('Đã lưu báo cáo chốt ca thành công lên Server!', 'success');
  };

  return (
    <div className="modal-overlay no-print" onClick={() => setShiftModalOpen(false)}>
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '620px', maxHeight: '92vh', overflowY: 'auto' }}
      >
        <div className="modal-header">
          <div className="modal-title">
            <Clock size={22} color="var(--primary)" />
            <span>Chốt Ca & Kiểm Kê Tiền Mặt (04:00 - 22:00)</span>
          </div>
          <button
            className="btn btn-secondary btn-icon"
            onClick={() => setShiftModalOpen(false)}
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab switch: Current Shift vs History */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
          <button
            className={`btn ${shiftTab === 'current' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, borderRadius: 0, border: 'none', padding: '0.6rem' }}
            onClick={() => setShiftTab('current')}
          >
            <Calculator size={14} />
            <span>Chốt Ca Hôm Nay</span>
          </button>
          <button
            className={`btn ${shiftTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, borderRadius: 0, border: 'none', padding: '0.6rem' }}
            onClick={() => setShiftTab('history')}
          >
            <History size={14} />
            <span>Lịch Sử Chốt Ca ({shiftsHistory.length})</span>
          </button>
        </div>

        {shiftTab === 'current' ? (
          <div className="modal-body" style={{ padding: '1.25rem' }}>
            {/* Shift Summary Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.5rem',
                marginBottom: '1rem',
              }}
            >
              <div style={{ background: 'var(--bg-secondary)', padding: '0.6rem', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Tổng Doanh Thu</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                  {formatVND(totalRevenue)}
                </div>
              </div>

              <div style={{ background: 'var(--success-light)', padding: '0.6rem', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--success-border)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 700 }}>Tiền Mặt (Sổ Sách)</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--success)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                  {formatVND(totalCash)}
                </div>
              </div>

              <div style={{ background: 'var(--bg-secondary)', padding: '0.6rem', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Chuyển Khoản</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--info)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                  {formatVND(totalVietQr)}
                </div>
              </div>

              <div style={{ background: 'var(--warning-light)', padding: '0.6rem', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--warning-border)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--warning)', fontWeight: 700 }}>Bán Nợ</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--warning)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                  {formatVND(totalDebt)}
                </div>
              </div>
            </div>

            {/* Cash Verification Panel */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '2px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '1rem',
                marginBottom: '1rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Banknote size={18} color="var(--success)" />
                  <span>Kiểm Đếm Tiền Mặt Thực Tế Trong Két:</span>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setUseDenominations(!useDenominations)}
                  style={{ fontSize: '0.75rem' }}
                >
                  {useDenominations ? 'Gõ Tổng Tiền' : 'Đếm Theo Mệnh Giá'}
                </button>
              </div>

              {useDenominations ? (
                /* Denomination Counter Grid */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', marginBottom: '0.75rem' }}>
                  {[500000, 200000, 100000, 50000, 20000, 10000, 5000, 2000, 1000].map((d) => (
                    <div key={d} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-secondary)', padding: '3px 6px', borderRadius: '4px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, minWidth: '45px' }}>{d >= 1000 ? `${d / 1000}k` : d}:</span>
                      <input
                        type="number"
                        placeholder="0"
                        className="form-control"
                        style={{ padding: '2px 4px', fontSize: '0.75rem', textAlign: 'center', width: '50px' }}
                        value={denominations[d] || ''}
                        onChange={(e) => setDenominations({ ...denominations, [d]: e.target.value })}
                      />
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>tờ</span>
                    </div>
                  ))}
                </div>
              ) : (
                /* Direct Cash Input */
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <input
                    type="number"
                    className="form-control"
                    style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--primary)', textAlign: 'center' }}
                    placeholder="Nhập số tiền mặt đếm được trong két..."
                    value={directCashCount !== '' ? directCashCount : totalCash.toString()}
                    onChange={(e) => setDirectCashCount(e.target.value)}
                  />
                </div>
              )}

              {/* Cash Match / Mismatch Result Badge */}
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: cashDifference === 0 ? 'var(--success-light)' : cashDifference > 0 ? 'var(--info-light)' : 'var(--danger-light)',
                  border: `2px solid ${
                    cashDifference === 0 ? 'var(--success-border)' : cashDifference > 0 ? 'rgba(59, 130, 246, 0.4)' : 'var(--danger-border)'
                  }`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>
                    {cashDifference === 0 ? '✓ Tiền mặt chuẩn khớp 100%' : cashDifference > 0 ? '⚡ Dư tiền mặt:' : '⚠️ Thiếu tiền mặt:'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    (Đếm thực tế: {formatVND(actualCashCounted)} vs Sổ sách: {formatVND(totalCash)})
                  </div>
                </div>

                <div
                  style={{
                    fontSize: '1.35rem',
                    fontWeight: 900,
                    fontFamily: 'var(--font-mono)',
                    color: cashDifference === 0 ? 'var(--success)' : cashDifference > 0 ? 'var(--info)' : 'var(--danger)',
                  }}
                >
                  {cashDifference === 0 ? '0 đ' : formatVND(cashDifference)}
                </div>
              </div>
            </div>

            {/* Cashier & Notes */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <div>
                <label className="form-label">Người chốt ca:</label>
                <input
                  type="text"
                  className="form-control"
                  value={cashierName}
                  onChange={(e) => setCashierName(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label">Ghi chú chốt ca:</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="VD: Ca sáng bán đông..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </div>
        ) : (
          /* SHIFT HISTORY TABLE */
          <div className="modal-body" style={{ padding: '1rem', maxHeight: '400px', overflowY: 'auto' }}>
            {shiftsHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                Chưa có lịch sử chốt ca nào được lưu.
              </div>
            ) : (
              shiftsHistory.map((s, idx) => (
                <div
                  key={s.id || idx}
                  style={{
                    background: 'var(--bg-secondary)',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    marginBottom: '0.5rem',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.8rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, marginBottom: '4px' }}>
                    <span>Ngày: {s.shiftDate} ({s.shiftTimeRange})</span>
                    <span style={{ color: s.cashDifference === 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {s.cashDifference === 0 ? 'Khớp tiền' : `Lệch: ${formatVND(s.cashDifference)}`}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span>Doanh thu: <strong>{formatVND(s.totalRevenue)}</strong></span>
                    <span>Tiền mặt: <strong>{formatVND(s.totalCash)}</strong></span>
                    <span>VietQR: <strong>{formatVND(s.totalVietQr)}</strong></span>
                    <span>Đơn: <strong>{s.ordersCount}</strong></span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setShiftModalOpen(false)}>
            Đóng
          </button>
          {shiftTab === 'current' && (
            <button className="btn btn-success btn-lg" onClick={handleSaveShift}>
              <Save size={18} />
              <span>Lưu Báo Cáo Chốt Ca Vào Server</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
