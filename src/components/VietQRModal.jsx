import React, { useState } from 'react';
import {
  QrCode,
  X,
  Copy,
  Check,
  CheckCircle2,
  Building2,
  User,
  CreditCard,
  Download,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const VietQRModal = () => {
  const {
    vietQrData,
    setVietQrData,
    taxSettings,
    showToast,
    checkoutOrder,
    setActiveInvoice,
  } = useStore();

  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);

  if (!vietQrData) return null;

  const { orderDraft, amount, orderId } = vietQrData;

  // Format currency
  const formatVND = (val) => new Intl.NumberFormat('vi-VN').format(val) + ' đ';

  // Generate VietQR Quick Link URL
  // Format: https://img.vietqr.io/image/<BANK_ID>-<ACCOUNT_NO>-compact2.png?amount=<AMOUNT>&addInfo=<DESCRIPTION>&accountName=<ACCOUNT_NAME>
  const description = `THANH TOAN ${orderId}`;
  const qrUrl = `https://img.vietqr.io/image/${taxSettings.bankId}-${taxSettings.accountNo}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(
    description
  )}&accountName=${encodeURIComponent(taxSettings.accountName)}`;

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'account') {
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
      showToast('Đã sao chép số tài khoản!', 'success');
    } else {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
      showToast('Đã sao chép số tiền!', 'success');
    }
  };

  const handleConfirmPayment = () => {
    // Finalize order checkout as VietQR
    const completedOrder = checkoutOrder({
      paymentMethod: 'vietqr',
      receivedAmount: amount,
    });
    setVietQrData(null);
    if (completedOrder) {
      setActiveInvoice(completedOrder);
    }
  };

  return (
    <div
      className="modal-overlay no-print"
      onClick={() => setVietQrData(null)}
    >
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '460px' }}
      >
        <div className="modal-header">
          <div className="modal-title">
            <QrCode size={22} color="var(--primary)" />
            <span>Thanh Toán Chuyển Khoản VietQR</span>
          </div>
          <button
            className="btn btn-secondary btn-icon"
            onClick={() => setVietQrData(null)}
            style={{ borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ textAlign: 'center', padding: '1.25rem' }}>
          {/* VietQR Dynamic Code Display */}
          <div
            style={{
              background: '#FFFFFF',
              padding: '1rem',
              borderRadius: 'var(--radius-lg)',
              border: '2px dashed var(--primary-border)',
              display: 'inline-block',
              boxShadow: 'var(--shadow-md)',
              marginBottom: '1rem',
            }}
          >
            <img
              src={qrUrl}
              alt="Mã VietQR thanh toán"
              style={{
                width: '280px',
                height: 'auto',
                display: 'block',
                borderRadius: '8px',
              }}
              onError={(e) => {
                // Fallback if network issue
                e.target.style.display = 'none';
              }}
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <span
              style={{
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                fontWeight: 600,
              }}
            >
              Số tiền cần thanh toán:
            </span>
            <div
              style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                color: 'var(--primary)',
                fontFamily: 'var(--font-mono)',
                marginTop: '0.25rem',
              }}
            >
              {formatVND(amount)}
            </div>
          </div>

          {/* Account Details Box */}
          <div
            style={{
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1rem',
              textAlign: 'left',
              fontSize: '0.85rem',
              border: '1px solid var(--border-color)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.5rem',
              }}
            >
              <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Building2 size={14} /> Ngân hàng:
              </span>
              <span style={{ fontWeight: 700 }}>{taxSettings.bankName}</span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5rem',
              }}
            >
              <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <CreditCard size={14} /> Số tài khoản:
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    color: 'var(--primary)',
                  }}
                >
                  {taxSettings.accountNo}
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '2px 6px' }}
                  onClick={() => copyToClipboard(taxSettings.accountNo, 'account')}
                >
                  {copiedAccount ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                </button>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.5rem',
              }}
            >
              <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <User size={14} /> Chủ tài khoản:
              </span>
              <span style={{ fontWeight: 700, textTransform: 'uppercase' }}>
                {taxSettings.accountName}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>Nội dung CK:</span>
              <span
                style={{
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-primary)',
                }}
              >
                {description}
              </span>
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setVietQrData(null)}
          >
            Hủy bỏ
          </button>
          <button
            className="btn btn-success btn-lg"
            style={{ flex: 1, marginLeft: '0.75rem' }}
            onClick={handleConfirmPayment}
          >
            <CheckCircle2 size={18} />
            <span>Xác Nhận Đã Nhận Tiền</span>
          </button>
        </div>
      </div>
    </div>
  );
};
