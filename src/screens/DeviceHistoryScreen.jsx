import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useStore } from '../context/StoreContext';

// Admin-only screen (manager-token protected on the server). Data comes
// from the CENTRAL server DB, never from this browser's localStorage, so
// admin sees bills from every device on the LAN.
export const DeviceHistoryScreen = () => {
  const { isPinUnlocked, setPinModalOpen, setActiveTab, showToast } = useStore();
  const [tab, setTab] = useState('history');
  const [devices, setDevices] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deviceFilter, setDeviceFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const [dailyDate, setDailyDate] = useState(() => {
    const d = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
    return d.toISOString().slice(0, 10);
  });
  const [summary, setSummary] = useState(null);
  const [dailyNote, setDailyNote] = useState('');
  const [noteUpdatedAt, setNoteUpdatedAt] = useState(null);
  const [savingNote, setSavingNote] = useState(false);

  const wsHost = typeof window !== 'undefined' ? (window.location.hostname || 'localhost') : 'localhost';
  const managerHeaders = useCallback(() => {
    const token = sessionStorage.getItem('smartpos_manager_token') || '';
    return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  }, []);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (deviceFilter) params.set('device', deviceFilter);
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);
      if (search.trim()) params.set('q', search.trim());
      const res = await fetch(`http://${wsHost}:5000/api/devices/history?${params.toString()}`, { headers: managerHeaders() });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        showToast(data.error || 'Không tải được lịch sử thiết bị (cần quyền chủ tiệm).', 'danger');
        return;
      }
      setDevices(data.devices || []);
      setOrders(data.orders || []);
    } catch {
      showToast('Không kết nối được server.', 'danger');
    } finally {
      setLoading(false);
    }
  }, [deviceFilter, fromDate, toDate, search, wsHost, managerHeaders, showToast]);

  const loadDaily = useCallback(async () => {
    try {
      const [sumRes, noteRes] = await Promise.all([
        fetch(`http://${wsHost}:5000/api/daily-summary?date=${dailyDate}`, { headers: managerHeaders() }),
        fetch(`http://${wsHost}:5000/api/daily-notes?date=${dailyDate}`, { headers: managerHeaders() }),
      ]);
      const sumData = await sumRes.json().catch(() => ({}));
      const noteData = await noteRes.json().catch(() => ({}));
      if (sumRes.ok && sumData.success) setSummary(sumData.summary);
      if (noteRes.ok && noteData.success) {
        setDailyNote(noteData.note || '');
        setNoteUpdatedAt(noteData.updatedAt || null);
      }
    } catch {
      showToast('Không tải được sổ ngày.', 'danger');
    }
  }, [dailyDate, wsHost, managerHeaders, showToast]);

  useEffect(() => { if (isPinUnlocked) loadHistory(); }, [isPinUnlocked, loadHistory]);
  useEffect(() => { if (isPinUnlocked && tab === 'daily') loadDaily(); }, [isPinUnlocked, tab, loadDaily]);

  const saveDailyNote = async () => {
    setSavingNote(true);
    try {
      const res = await fetch(`http://${wsHost}:5000/api/daily-notes`, {
        method: 'POST', headers: managerHeaders(), body: JSON.stringify({ date: dailyDate, note: dailyNote }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) { showToast(data.error || 'Không lưu được ghi chú ngày.', 'danger'); return; }
      setNoteUpdatedAt(data.updatedAt);
      showToast(`Đã lưu ghi chú ngày ${dailyDate}.`, 'success');
    } catch {
      showToast('Không kết nối được server.', 'danger');
    } finally {
      setSavingNote(false);
    }
  };

  const fmt = (n) => new Intl.NumberFormat('vi-VN').format(Number(n) || 0);
  const fmtTime = (ts) => {
    if (!ts) return '—';
    try { return new Date(ts).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }); } catch { return String(ts); }
  };
  const methodLabel = (m) => (m === 'cash' ? 'Tiền mặt' : m === 'vietqr' ? 'VietQR' : m === 'debt' ? 'Ghi nợ' : m);
  const statusLabel = (s) => (s === 'paid' ? 'Đã thanh toán' : s === 'pending_vietqr' ? 'Chờ xác nhận VietQR' : s === 'debt' ? 'Ghi nợ' : s);

  const totals = useMemo(() => ({
    orders: orders.length,
    value: orders.reduce((s, o) => s + (Number(o.total) || 0), 0),
  }), [orders]);

  if (!isPinUnlocked) {
    return (
      <div className="card" style={{ maxWidth: '640px', margin: '2rem auto', padding: '1.5rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(1.25rem, 4vw, 1.6rem)' }}>🔒 Lịch sử thiết bị &amp; Sổ ngày</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Chỉ chủ tiệm mới xem được lịch sử bill của tất cả các thiết bị. Nhấn nút dưới để nhập mã PIN chủ tiệm.
        </p>
        <button type="button" className="btn btn-primary" onClick={() => setPinModalOpen(true)}>Nhập PIN chủ tiệm</button>
        <button type="button" className="btn btn-secondary" style={{ marginLeft: '0.5rem' }} onClick={() => setActiveTab('pos')}>Về Bán hàng</button>
      </div>
    );
  }

  return (
    <div className="device-history-screen">
      <h2 style={{ fontSize: 'clamp(1.25rem, 4vw, 1.8rem)', marginBottom: '0.25rem' }}>📱 Lịch sử thiết bị &amp; Sổ ngày</h2>
      <p style={{ color: 'var(--text-muted)', marginTop: 0 }}>
        Bill từ mọi máy trong tiệm, lấy từ máy chủ chính — không phải chỉ từ trình duyệt này.
      </p>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <button type="button" className={`btn ${tab === 'history' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('history')}>Lịch sử theo thiết bị</button>
        <button type="button" className={`btn ${tab === 'daily' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('daily')}>Sổ ngày</button>
        <button type="button" className="btn btn-secondary" onClick={() => { if (tab === 'history') loadHistory(); else loadDaily(); }} disabled={loading}>↻ Tải lại</button>
      </div>

      {tab === 'history' && (
        <>
          <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <select className="form-control" style={{ minWidth: '180px', flex: '1 1 180px' }} value={deviceFilter} onChange={(e) => setDeviceFilter(e.target.value)}>
                <option value="">Tất cả thiết bị</option>
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} — {d.orderCount} đơn, {fmt(d.totalRevenue)} đ</option>
                ))}
              </select>
              <input type="date" className="form-control" style={{ flex: '1 1 140px' }} value={fromDate} onChange={(e) => setFromDate(e.target.value)} aria-label="Từ ngày" />
              <input type="date" className="form-control" style={{ flex: '1 1 140px' }} value={toDate} onChange={(e) => setToDate(e.target.value)} aria-label="Đến ngày" />
              <input className="form-control" style={{ flex: '2 1 180px' }} placeholder="Tìm mã đơn, ví dụ HD-20261028-0001" value={search} onChange={(e) => setSearch(e.target.value)} />
              <button type="button" className="btn btn-primary" onClick={loadHistory} disabled={loading}>{loading ? 'Đang tải…' : 'Lọc'}</button>
            </div>
            <p style={{ margin: '0.75rem 0 0', color: 'var(--text-muted)' }}>
              {totals.orders} đơn trong danh sách · Tổng giá trị {fmt(totals.value)} đ · Số điện thoại khách chỉ hiện dạng đã che.
            </p>
          </div>

          <div className="table-scroll">
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Mã đơn</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Thời gian</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Thiết bị</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Khách</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Thanh toán</th>
                  <th style={{ textAlign: 'right', padding: '0.5rem' }}>Tổng tiền</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }} />
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>Chưa có đơn nào khớp bộ lọc.</td></tr>
                )}
                {orders.map((o) => (
                  <React.Fragment key={o.id || o.code}>
                    <tr>
                      <td style={{ padding: '0.5rem', fontWeight: 700 }}>{o.code || o.id}</td>
                      <td style={{ padding: '0.5rem' }}>{fmtTime(o.syncedAt || o.createdAt)}</td>
                      <td style={{ padding: '0.5rem' }}>{o.deviceName || o.deviceId || '—'}</td>
                      <td style={{ padding: '0.5rem' }}>{o.customerName || 'Khách lẻ'}{o.customerPhone ? ` (${o.customerPhone})` : ''}</td>
                      <td style={{ padding: '0.5rem' }}>{methodLabel(o.paymentMethod)} · {statusLabel(o.paymentStatus)}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 700 }}>{fmt(o.total)} đ</td>
                      <td style={{ padding: '0.5rem' }}>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setExpandedId(expandedId === (o.id || o.code) ? null : (o.id || o.code))}>
                          {expandedId === (o.id || o.code) ? 'Thu gọn' : 'Chi tiết'}
                        </button>
                      </td>
                    </tr>
                    {expandedId === (o.id || o.code) && (
                      <tr>
                        <td colSpan={7} style={{ padding: '0.75rem', background: 'var(--bg-secondary)' }}>
                          {(o.items || []).map((it, i) => (
                            <div key={i}>• {it.name || it.productId} — {it.qty} {it.unit || ''} × {fmt(it.price)} đ = {fmt(it.total ?? (Number(it.qty) || 0) * (Number(it.price) || 0))} đ</div>
                          ))}
                          {o.debtNote ? <div>Ghi chú nợ: {o.debtNote}</div> : null}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          <h3 style={{ marginTop: '1.5rem' }}>Tổng hợp theo thiết bị</h3>
          <div className="table-scroll">
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Thiết bị</th>
                  <th style={{ textAlign: 'right', padding: '0.5rem' }}>Số đơn</th>
                  <th style={{ textAlign: 'right', padding: '0.5rem' }}>Tổng giá trị</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Đơn gần nhất / Lần thấy cuối</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((d) => (
                  <tr key={d.id}>
                    <td style={{ padding: '0.5rem' }}>{d.name}<div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{d.id}</div></td>
                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>{d.orderCount}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 700 }}>{fmt(d.totalRevenue)} đ</td>
                    <td style={{ padding: '0.5rem' }}>{d.lastOrderCode || '—'} · {fmtTime(d.lastSeen)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'daily' && (
        <>
          <div className="card" style={{ padding: '1rem', marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <label htmlFor="daily-date">Chọn ngày:</label>
            <input id="daily-date" type="date" className="form-control" style={{ maxWidth: '200px' }} value={dailyDate} onChange={(e) => setDailyDate(e.target.value)} />
            <button type="button" className="btn btn-primary" onClick={loadDaily}>Xem ngày này</button>
          </div>

          {summary && (
            <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
              <h3 style={{ marginTop: 0 }}>Tổng kết ngày {summary.date} (tính tự động từ bill, không sửa tay được)</h3>
              <p>{summary.totalOrders} đơn · Tổng giá trị đơn {fmt(summary.totalOrderValue)} đ · Đã thu (đơn đã thanh toán) {fmt(summary.totalRevenue)} đ</p>
              <p><strong>Theo hình thức:</strong> {Object.entries(summary.byPaymentMethod).map(([m, v]) => `${methodLabel(m)}: ${v.orders} đơn, ${fmt(v.value)} đ`).join(' · ') || '—'}</p>
              <p><strong>Theo trạng thái:</strong> {Object.entries(summary.byPaymentStatus).map(([s, v]) => `${statusLabel(s)}: ${v.orders} đơn, ${fmt(v.value)} đ`).join(' · ') || '—'}</p>
              <p><strong>Theo thiết bị:</strong> {summary.byDevice.map((d) => `${d.deviceName}: ${d.orders} đơn, ${fmt(d.value)} đ`).join(' · ') || '—'}</p>
              <p style={{ color: 'var(--text-muted)' }}>Mã đơn trong ngày: {summary.orderCodes.join(', ') || '—'}</p>
            </div>
          )}

          <div className="card" style={{ padding: '1rem' }}>
            <h3 style={{ marginTop: 0 }}>✍️ Ghi chú ngày {dailyDate}</h3>
            <p style={{ color: 'var(--text-muted)' }}>Ví dụ: hôm nay thiếu hàng gì, khách nào nợ, việc cần làm ngày mai. Ghi chú lưu trên máy chủ chính, mở lại ngày này là vẫn thấy.</p>
            <textarea
              className="form-control"
              rows={4}
              style={{ width: '100%', resize: 'vertical' }}
              placeholder="Ví dụ: Hôm nay thiếu mì tôm, khách chị Lan nợ 120.000đ, mai nhớ nhập thêm nước ngọt."
              value={dailyNote}
              onChange={(e) => setDailyNote(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem', alignItems: 'center' }}>
              <button type="button" className="btn btn-primary" onClick={saveDailyNote} disabled={savingNote}>{savingNote ? 'Đang lưu…' : '💾 Lưu ghi chú ngày'}</button>
              {noteUpdatedAt && <span style={{ color: 'var(--text-muted)' }}>Đã lưu lúc {fmtTime(noteUpdatedAt)}</span>}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
