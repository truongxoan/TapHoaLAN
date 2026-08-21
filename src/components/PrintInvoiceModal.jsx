import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import {
  Printer,
  X,
  FileCheck,
  CheckCircle,
  Receipt,
  Download,
  Settings,
  ToggleLeft,
  ToggleRight,
  Gift,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const PrintInvoiceModal = () => {
  const {
    activeInvoice,
    setActiveInvoice,
    taxSettings,
    printerSettings,
    setPrinterSettings,
    loyaltyCustomers,
    showToast,
  } = useStore();

  const barcodeCanvasRef = useRef(null);

  useEffect(() => {
    if (activeInvoice && barcodeCanvasRef.current) {
      try {
        JsBarcode(barcodeCanvasRef.current, activeInvoice.id, {
          format: 'CODE128',
          lineColor: '#000000',
          width: 1.5,
          height: 35,
          displayValue: true,
          fontSize: 11,
          margin: 0,
        });
      } catch (err) {
        console.log('JsBarcode error', err);
      }

      // Auto print if enabled
      if (printerSettings?.autoPrintOnCheckout) {
        setTimeout(() => {
          window.print();
        }, 400);
      }
    }
  }, [activeInvoice, printerSettings]);

  if (!activeInvoice) return null;

  const formatVND = (val) =>
    new Intl.NumberFormat('vi-VN').format(Math.round(val || 0)) + ' đ';

  const formatDate = (isoString) => {
    const d = new Date(isoString || Date.now());
    return `${d.toLocaleTimeString('vi-VN')} - ${d.toLocaleDateString('vi-VN')}`;
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleAutoPrint = () => {
    const next = !printerSettings.autoPrintOnCheckout;
    setPrinterSettings({ ...printerSettings, autoPrintOnCheckout: next });
    localStorage.setItem('smartpos_printer_settings', JSON.stringify({ ...printerSettings, autoPrintOnCheckout: next }));
    showToast(next ? 'Đã BẬT tự động in hóa đơn sau khi thanh toán' : 'Đã TẮT tự động in (Chỉ in khi bấm nút In)', 'info');
  };

  // Find customer loyalty points
  const matchedLoyalty = loyaltyCustomers.find(
    (c) => c.name.toLowerCase() === (activeInvoice.customerName || '').toLowerCase()
  );

  return (
    <div
      className="modal-overlay"
      onClick={() => setActiveInvoice(null)}
      style={{ overflowY: 'auto', padding: '1rem 0' }}
    >
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '440px' }}
      >
        {/* Modal Top Actions */}
        <div className="modal-header no-print">
          <div className="modal-title">
            <Receipt size={20} color="var(--primary)" />
            <span>Chi Tiết Hóa Đơn (Lưu Đối Soát)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={toggleAutoPrint}
              style={{ fontSize: '0.75rem', padding: '3px 8px' }}
              title="Cài đặt tự động in"
            >
              {printerSettings.autoPrintOnCheckout ? (
                <span style={{ color: 'var(--success)', fontWeight: 700 }}>✓ Tự động in: BẬT</span>
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>Tự động in: TẮT</span>
              )}
            </button>

            <button
              className="btn btn-secondary btn-icon"
              onClick={() => setActiveInvoice(null)}
              style={{ borderRadius: '50%' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* PRINTABLE RECEIPT CONTAINER (K80 / Thermal Invoice Standard) */}
        <div
          className="modal-body printable-invoice"
          style={{
            background: '#FFFFFF',
            color: '#111827',
            padding: '1.25rem',
            fontFamily: "'Inter', sans-serif",
            fontSize: '12px',
            lineHeight: 1.4,
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', borderBottom: '1px dashed #CBD5E1', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '15px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {taxSettings.storeName}
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
              {taxSettings.storeSlogan}
            </div>
            <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>
              Đ/c: {taxSettings.storeAddress}
            </div>
            <div style={{ fontSize: '11px', color: '#475569' }}>
              Hotline: <strong>{taxSettings.storePhone}</strong>
            </div>
            {taxSettings.storeTaxId && (
              <div style={{ fontSize: '11px', color: '#475569' }}>
                MST: <strong>{taxSettings.storeTaxId}</strong>
              </div>
            )}
          </div>

          {/* Invoice Title & Meta */}
          <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '14px', fontWeight: 900, textTransform: 'uppercase' }}>
              HÓA ĐƠN BÁN LẺ
            </div>
            <div style={{ fontSize: '11px', color: '#64748B' }}>
              Số: <strong>{activeInvoice.id}</strong>
            </div>
            <div style={{ fontSize: '11px', color: '#64748B' }}>
              Thời gian: {formatDate(activeInvoice.createdAt)}
            </div>
            <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
              Khách hàng: <strong>{activeInvoice.customerName || 'Khách lẻ'}</strong>
              {activeInvoice.customerPhone && ` • ${activeInvoice.customerPhone}`}
            </div>
            {matchedLoyalty && (
              <div style={{ fontSize: '11px', color: '#059669', fontWeight: 700 }}>
                ⭐ Điểm tích lũy hiện có: {matchedLoyalty.points || 0} điểm
              </div>
            )}
          </div>

          {/* Table Items */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '0.75rem', fontSize: '11.5px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #000', borderTop: '1px solid #000', textAlign: 'left' }}>
                <th style={{ padding: '4px 0' }}>Tên Mặt Hàng</th>
                <th style={{ padding: '4px 0', textAlign: 'center', width: '40px' }}>SL</th>
                <th style={{ padding: '4px 0', textAlign: 'right', width: '65px' }}>Đơn Giá</th>
                <th style={{ padding: '4px 0', textAlign: 'right', width: '70px' }}>T.Tiền</th>
              </tr>
            </thead>
            <tbody>
              {activeInvoice.items.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px dashed #E2E8F0' }}>
                  <td style={{ padding: '4px 0' }}>
                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                    <div style={{ fontSize: '10px', color: '#64748B' }}>{item.unit}</div>
                  </td>
                  <td style={{ padding: '4px 0', textAlign: 'center', fontWeight: 700 }}>
                    {item.qty}
                  </td>
                  <td style={{ padding: '4px 0', textAlign: 'right' }}>
                    {formatVND(item.price)}
                  </td>
                  <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 700 }}>
                    {formatVND(item.price * item.qty)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ borderTop: '1px solid #000', paddingTop: '0.5rem', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span>Tổng tiền hàng:</span>
              <span>{formatVND(activeInvoice.subtotal)}</span>
            </div>

            {activeInvoice.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', color: '#DC2626' }}>
                <span>Chiết khấu / Đổi điểm:</span>
                <span>-{formatVND(activeInvoice.discount)}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', color: '#64748B', fontSize: '11px' }}>
              <span>Thuế VAT (8% - 10%):</span>
              <span>{formatVND(activeInvoice.totalVat || 0)}</span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '15px',
                fontWeight: 900,
                borderTop: '1px dashed #000',
                paddingTop: '4px',
                marginTop: '4px',
                marginBottom: '6px',
              }}
            >
              <span>TỔNG THANH TOÁN:</span>
              <span>{formatVND(activeInvoice.total)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span>Phương thức:</span>
              <strong style={{ textTransform: 'uppercase' }}>
                {activeInvoice.paymentMethod === 'vietqr'
                  ? 'Chuyển Khoản VietQR'
                  : activeInvoice.paymentMethod === 'debt'
                  ? 'Ghi Nợ Khách Quen'
                  : 'Tiền Mặt'}
              </strong>
            </div>

            {activeInvoice.paymentMethod === 'cash' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span>Khách đưa:</span>
                  <span>{formatVND(activeInvoice.receivedAmount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                  <span>Tiền thừa trả khách:</span>
                  <span style={{ color: '#059669' }}>{formatVND(activeInvoice.changeAmount)}</span>
                </div>
              </>
            )}
          </div>

          {/* Barcode Footer */}
          <div style={{ textAlign: 'center', marginTop: '0.75rem', borderTop: '1px dashed #CBD5E1', paddingTop: '0.75rem' }}>
            <canvas ref={barcodeCanvasRef} style={{ maxWidth: '100%' }} />
            <div style={{ fontSize: '10px', color: '#64748B', marginTop: '4px', fontStyle: 'italic' }}>
              {taxSettings.invoiceFooterNote}
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="modal-footer no-print" style={{ justifyContent: 'space-between' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setActiveInvoice(null)}
          >
            Đóng
          </button>
          <button
            className="btn btn-primary btn-lg"
            style={{ flex: 1, marginLeft: '0.75rem' }}
            onClick={handlePrint}
          >
            <Printer size={18} />
            <span>In Hóa Đơn (Print)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
