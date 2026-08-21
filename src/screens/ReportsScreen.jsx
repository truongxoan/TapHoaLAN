import React from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Receipt,
  PieChart,
  Award,
  Sparkles,
  ArrowUpRight,
  Boxes,
  FileSpreadsheet,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { exportStoreToExcel } from '../utils/excelExporter';

export const ReportsScreen = () => {
  const { orders, products, categories, debts, purchases, shiftsHistory, taxSettings, showToast } = useStore();

  const handleExportExcel = () => {
    try {
      const filename = exportStoreToExcel({
        products,
        orders,
        debts,
        purchases,
        shifts: shiftsHistory,
        taxSettings,
      });
      showToast(`Đã xuất báo cáo ra tệp Excel: ${filename}`, 'success');
    } catch (e) {
      showToast('Lỗi khi xuất file Excel!', 'danger');
    }
  };

  const formatVND = (val) =>
    new Intl.NumberFormat('vi-VN').format(Math.round(val || 0)) + ' đ';

  // Overall KPIs
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalProfit = orders.reduce((sum, o) => sum + (o.profit || 0), 0);
  const totalInvoices = orders.length;
  const avgOrderValue = totalInvoices > 0 ? Math.round(totalRevenue / totalInvoices) : 0;
  const totalVatCollected = orders.reduce((sum, o) => sum + (o.totalVat || 0), 0);
  const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0;

  // Best Selling Products Aggregation
  const productSalesMap = {};
  orders.forEach((ord) => {
    ord.items.forEach((item) => {
      if (!productSalesMap[item.productId]) {
        productSalesMap[item.productId] = {
          name: item.name,
          barcode: item.barcode,
          unit: item.unit,
          qtySold: 0,
          revenue: 0,
        };
      }
      productSalesMap[item.productId].qtySold += item.qty;
      productSalesMap[item.productId].revenue += item.total || item.price * item.qty;
    });
  });

  const bestSellers = Object.values(productSalesMap)
    .sort((a, b) => b.qtySold - a.qtySold)
    .slice(0, 5);

  // Category Revenue Breakdown
  const categoryRevenueMap = {};
  categories.forEach((c) => {
    categoryRevenueMap[c.id] = { name: c.name, revenue: 0 };
  });

  orders.forEach((ord) => {
    ord.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId);
      const catId = prod ? prod.category : 'daily';
      if (categoryRevenueMap[catId]) {
        categoryRevenueMap[catId].revenue += item.total || item.price * item.qty;
      }
    });
  });

  const categoryBreakdown = Object.values(categoryRevenueMap).filter(
    (c) => c.revenue > 0
  );

  return (
    <div>
      {/* Top Title */}
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
            <BarChart3 size={28} color="var(--primary)" />
            <span>Báo Cáo Hoạt Động & Doanh Thu</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '2px' }}>
            Tổng hợp doanh thu bán hàng, lợi nhuận gộp, thuế thu được và sản phẩm bán chạy
          </p>
        </div>

        <button
          className="btn btn-success"
          style={{ fontWeight: 800 }}
          onClick={handleExportExcel}
        >
          <FileSpreadsheet size={18} />
          <span>Xuất Báo Cáo Ra Excel (.xlsx)</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        {/* Total Revenue */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Tổng Doanh Thu
            </span>
            <DollarSign size={20} color="var(--primary)" />
          </div>
          <div
            style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              color: 'var(--primary)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {formatVND(totalRevenue)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Từ {totalInvoices} hóa đơn bán lẻ
          </div>
        </div>

        {/* Gross Profit */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Lợi Nhuận Gộp
            </span>
            <TrendingUp size={20} color="var(--success)" />
          </div>
          <div
            style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              color: 'var(--success)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {formatVND(totalProfit)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Tỷ suất lợi nhuận: <strong>{profitMargin}%</strong>
          </div>
        </div>

        {/* Total Invoices */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Số Đơn Bán Hàng
            </span>
            <Receipt size={20} color="var(--info)" />
          </div>
          <div
            style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
            }}
          >
            {totalInvoices}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            TB mỗi đơn: <strong>{formatVND(avgOrderValue)}</strong>
          </div>
        </div>

        {/* Total VAT Collected */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Thuế VAT Đã Thu
            </span>
            <Sparkles size={20} color="var(--warning)" />
          </div>
          <div
            style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              color: 'var(--warning)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {formatVND(totalVatCollected)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Đã tính theo thuế suất 8% & 10%
          </div>
        </div>
      </div>

      {/* Charts & Breakdown Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.25rem' }}>
        {/* Top Best Sellers */}
        <div className="card">
          <div className="card-header">
            <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Award size={18} color="var(--warning)" />
              <span>Top Sản Phẩm Bán Chạy Nhất</span>
            </span>
          </div>

          <div className="card-body">
            {bestSellers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                Chưa có dữ liệu bán hàng
              </div>
            ) : (
              bestSellers.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 0',
                    borderBottom: idx < bestSellers.length - 1 ? '1px solid var(--border-color)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background:
                          idx === 0
                            ? '#FEF3C7'
                            : idx === 1
                            ? '#E2E8F0'
                            : '#FEE2E2',
                        color:
                          idx === 0
                            ? '#D97706'
                            : idx === 1
                            ? '#475569'
                            : '#DC2626',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                      }}
                    >
                      #{idx + 1}
                    </div>

                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{item.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Mã vạch: {item.barcode}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                      {item.qtySold} {item.unit}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {formatVND(item.revenue)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Category Revenue Breakdown */}
        <div className="card">
          <div className="card-header">
            <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PieChart size={18} color="var(--primary)" />
              <span>Doanh Thu Theo Nhóm Hàng</span>
            </span>
          </div>

          <div className="card-body">
            {categoryBreakdown.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                Chưa có dữ liệu phân loại
              </div>
            ) : (
              categoryBreakdown.map((cat, idx) => {
                const percent = totalRevenue > 0 ? ((cat.revenue / totalRevenue) * 100).toFixed(1) : 0;

                return (
                  <div key={idx} style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 600 }}>{cat.name}</span>
                      <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                        {formatVND(cat.revenue)} ({percent}%)
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div
                      style={{
                        height: '8px',
                        background: 'var(--bg-secondary)',
                        borderRadius: '9999px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${percent}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, var(--primary), #8B5CF6)',
                          borderRadius: '9999px',
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
