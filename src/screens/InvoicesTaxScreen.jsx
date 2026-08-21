import React, { useState } from 'react';
import {
  Receipt,
  FileSpreadsheet,
  Printer,
  Calendar,
  Search,
  Eye,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  ShieldCheck,
  Building,
  CheckCircle2,
  FileCheck,
  TrendingUp,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const InvoicesTaxScreen = () => {
  const { orders, purchases, setActiveInvoice, taxSettings } = useStore();
  const [subTab, setSubTab] = useState('invoices'); // 'invoices' | 'tax'
  const [search, setSearch] = useState('');

  const formatVND = (val) =>
    new Intl.NumberFormat('vi-VN').format(Math.round(val || 0)) + ' đ';

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return `${d.toLocaleTimeString('vi-VN')} - ${d.toLocaleDateString('vi-VN')}`;
  };

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    return (
      !search ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      (o.customerPhone && o.customerPhone.includes(search))
    );
  });

  // Calculate Tax Metrics
  // Output VAT (Thuế đầu ra từ bán hàng)
  const totalSalesRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalNetSales = orders.reduce((sum, o) => sum + (o.netTotal || 0), 0);
  const totalOutputVat8 = orders.reduce((sum, o) => sum + (o.vat8Amount || 0), 0);
  const totalOutputVat10 = orders.reduce((sum, o) => sum + (o.vat10Amount || 0), 0);
  const totalOutputVat = orders.reduce((sum, o) => sum + (o.totalVat || 0), 0);

  // Input VAT (Thuế đầu vào từ phiếu nhập hàng)
  const totalImportCost = purchases.reduce((sum, p) => sum + (p.totalCost || 0), 0);
  const totalInputVat = purchases.reduce((sum, p) => sum + (p.inputVat || 0), 0);

  // Payable Tax (Thuế GTGT phải nộp = Đầu ra - Đầu vào)
  const payableTax = Math.max(0, totalOutputVat - totalInputVat);
  const deductibleRemaining = Math.max(0, totalInputVat - totalOutputVat);

  return (
    <div>
      {/* Top Header */}
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
            <Receipt size={28} color="var(--primary)" />
            <span>Quản Lý Hóa Đơn & Kê Khai Thuế GTGT</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '2px' }}>
            Theo dõi hóa đơn bán lẻ, tính thuế VAT đầu ra/đầu vào và khấu trừ thuế theo quy định
          </p>
        </div>

        {/* Sub-tabs switch */}
        <div className="nav-tabs" style={{ background: 'var(--bg-card)' }}>
          <button
            className={`nav-tab-btn ${subTab === 'invoices' ? 'active' : ''}`}
            onClick={() => setSubTab('invoices')}
          >
            <Receipt size={16} />
            <span>Danh Sách Hóa Đơn ({orders.length})</span>
          </button>

          <button
            className={`nav-tab-btn ${subTab === 'tax' ? 'active' : ''}`}
            onClick={() => setSubTab('tax')}
          >
            <FileSpreadsheet size={16} />
            <span>Báo Cáo Kê Khai Thuế VAT</span>
          </button>
        </div>
      </div>

      {subTab === 'invoices' ? (
        /* TAB 1: SALES INVOICES LIST */
        <div>
          {/* Search bar */}
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
                placeholder="Tìm hóa đơn theo Số HĐ, tên khách, số điện thoại..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span style={{ fontWeight: 700 }}>Hóa đơn bán hàng</span>
              <span className="badge badge-primary">{filteredOrders.length} hóa đơn</span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr
                    style={{
                      background: 'var(--bg-secondary)',
                      borderBottom: '1px solid var(--border-color)',
                      textAlign: 'left',
                    }}
                  >
                    <th style={{ padding: '0.75rem 1rem' }}>Mã Hóa Đơn</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Thời Gian</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Khách Hàng</th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Tiền Net</th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Thuế VAT</th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Tổng Tiền</th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>Thanh Toán</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((ord) => (
                    <tr
                      key={ord.id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                      }}
                    >
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                          {ord.id}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {ord.items.length} mặt hàng
                        </div>
                      </td>

                      <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>
                        {formatDate(ord.createdAt)}
                      </td>

                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <div style={{ fontWeight: 600 }}>{ord.customerName}</div>
                        {ord.customerPhone && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {ord.customerPhone}
                          </div>
                        )}
                        {ord.customerTaxId && (
                          <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>
                            MST: {ord.customerTaxId}
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                        {formatVND(ord.netTotal)}
                      </td>

                      <td
                        style={{
                          padding: '0.75rem 0.5rem',
                          textAlign: 'right',
                          fontWeight: 600,
                          color: 'var(--info)',
                        }}
                      >
                        {formatVND(ord.totalVat)}
                      </td>

                      <td
                        style={{
                          padding: '0.75rem 0.5rem',
                          textAlign: 'right',
                          fontWeight: 800,
                          color: 'var(--primary)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {formatVND(ord.total)}
                      </td>

                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                        <span
                          className={`badge ${
                            ord.paymentMethod === 'vietqr'
                              ? 'badge-primary'
                              : ord.paymentMethod === 'card'
                              ? 'badge-info'
                              : 'badge-success'
                          }`}
                        >
                          {ord.paymentMethod === 'vietqr'
                            ? 'VietQR'
                            : ord.paymentMethod === 'card'
                            ? 'Thẻ'
                            : 'Tiền Mặt'}
                        </span>
                      </td>

                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setActiveInvoice(ord)}
                          title="Xem chi tiết & In lại hóa đơn"
                        >
                          <Eye size={14} />
                          <span>Xem / In</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* TAB 2: VAT & TAX DECLARATION REPORT */
        <div>
          {/* Tax Cards Summary */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1rem',
              marginBottom: '1.25rem',
            }}
          >
            {/* Card 1: Output VAT */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Thuế GTGT Đầu Ra (Bán hàng)
                </span>
                <ArrowUpRight size={20} color="var(--primary)" />
              </div>
              <div
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: 'var(--primary)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {formatVND(totalOutputVat)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                VAT 8%: {formatVND(totalOutputVat8)} | VAT 10%: {formatVND(totalOutputVat10)}
              </div>
            </div>

            {/* Card 2: Input VAT */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Thuế GTGT Đầu Vào (Nhập hàng)
                </span>
                <ArrowDownLeft size={20} color="var(--info)" />
              </div>
              <div
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: 'var(--info)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {formatVND(totalInputVat)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Từ {purchases.length} phiếu nhập kho đã có hóa đơn
              </div>
            </div>

            {/* Card 3: Payable Tax */}
            <div
              className="card"
              style={{
                padding: '1.25rem',
                borderLeft: `4px solid ${payableTax > 0 ? 'var(--warning)' : 'var(--success)'}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Thuế GTGT Phải Nộp Kế Tiếp
                </span>
                <ShieldCheck size={20} color={payableTax > 0 ? 'var(--warning)' : 'var(--success)'} />
              </div>
              <div
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: payableTax > 0 ? 'var(--warning)' : 'var(--success)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {formatVND(payableTax)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {payableTax > 0
                  ? 'Số thuế phải nộp vào ngân sách sau khấu trừ'
                  : `Được chuyển kỳ sau khấu trừ: ${formatVND(deductibleRemaining)}`}
              </div>
            </div>
          </div>

          {/* Tax Breakdown Table & Store Information */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
            <div className="card">
              <div className="card-header">
                <span style={{ fontWeight: 700 }}>
                  Bảng Phân Bổ Doanh Thu Theo Từng Mức Thuế Suất VAT
                </span>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => window.print()}
                >
                  <Printer size={14} />
                  <span>In Bảng Kê Thuế</span>
                </button>
              </div>

              <div className="card-body" style={{ padding: 0 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Mức Thuế Suất</th>
                      <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Doanh Thu Chưa Thuế</th>
                      <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Tiền Thuế GTGT</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Tổng Doanh Thu</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
                        <span className="badge badge-info">VAT 8%</span> Hàng tiêu dùng phổ thông
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                        {formatVND(totalOutputVat8 / 0.08)}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>
                        {formatVND(totalOutputVat8)}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700 }}>
                        {formatVND(totalOutputVat8 / 0.08 + totalOutputVat8)}
                      </td>
                    </tr>

                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
                        <span className="badge badge-primary">VAT 10%</span> Hàng điện tử & dịch vụ
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                        {formatVND(totalOutputVat10 / 0.1)}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>
                        {formatVND(totalOutputVat10)}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700 }}>
                        {formatVND(totalOutputVat10 / 0.1 + totalOutputVat10)}
                      </td>
                    </tr>

                    <tr style={{ background: 'var(--bg-secondary)', fontWeight: 800 }}>
                      <td style={{ padding: '0.75rem 1rem' }}>TỔNG CỘNG ĐẦU RA</td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                        {formatVND(totalNetSales)}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--primary)' }}>
                        {formatVND(totalOutputVat)}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: 'var(--primary)' }}>
                        {formatVND(totalSalesRevenue)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tax Filing Information */}
            <div className="card">
              <div className="card-header">
                <span style={{ fontWeight: 700 }}>Thông Tin Khai Thuế Cửa Hàng</span>
              </div>

              <div className="card-body" style={{ fontSize: '0.85rem' }}>
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Tên đơn vị:</div>
                  <div style={{ fontWeight: 700 }}>{taxSettings.storeName}</div>
                </div>

                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Mã số thuế (MST):</div>
                  <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>
                    {taxSettings.storeTaxId}
                  </div>
                </div>

                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Địa chỉ đăng ký:</div>
                  <div>{taxSettings.storeAddress}</div>
                </div>

                <div
                  style={{
                    background: 'var(--bg-secondary)',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    marginTop: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: 'var(--success)' }}>
                    <CheckCircle2 size={16} />
                    <span>Hóa đơn hợp lệ theo NĐ 123/2020</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Tự động tách thuế suất chính xác và hỗ trợ xuất bảng kê hóa đơn cho kế toán.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
