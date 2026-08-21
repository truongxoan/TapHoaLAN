import React, { useState } from 'react';
import {
  Smartphone,
  X,
  QrCode,
  Wifi,
  ScanBarcode,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Lock,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const MobileConnectModal = () => {
  const { mobileConnectOpen, setMobileConnectOpen, lanIp, isLanConnected, showToast } = useStore();
  const [copied, setCopied] = useState(false);

  if (!mobileConnectOpen) return null;

  // LAN Port 5000 or Current port
  const lanPort = window.location.port === '5173' ? '5173' : '5000';
  const targetIp = lanIp && lanIp !== 'localhost' ? lanIp : window.location.hostname;
  const fullLanUrl = `http://${targetIp}:${lanPort}`;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
    fullLanUrl
  )}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullLanUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('Đã sao chép link mạng LAN!', 'success');
  };

  return (
    <div
      className="modal-overlay no-print"
      onClick={() => setMobileConnectOpen(false)}
    >
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '500px' }}
      >
        <div className="modal-header">
          <div className="modal-title">
            <Smartphone size={22} color="var(--primary)" />
            <span>Kết Nối Điện Thoại Mạng Nội Bộ (LAN)</span>
          </div>
          <button
            className="btn btn-secondary btn-icon"
            onClick={() => setMobileConnectOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ textAlign: 'center', padding: '1.5rem' }}>
          {/* LAN Connection Status Badge */}
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
            <span
              className={`badge ${isLanConnected ? 'badge-success' : 'badge-primary'}`}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
            >
              <Lock size={13} />
              <span>{isLanConnected ? 'Mạng LAN Bảo Mật 100% Nội Bộ' : 'Đồng Bộ Mạng WiFi Gia Đình'}</span>
            </span>
          </div>

          {/* QR Code */}
          <div
            style={{
              background: '#FFFFFF',
              padding: '1rem',
              borderRadius: 'var(--radius-lg)',
              display: 'inline-block',
              border: '2px dashed var(--primary-border)',
              boxShadow: 'var(--shadow-md)',
              marginBottom: '1rem',
            }}
          >
            <img
              src={qrUrl}
              alt="Mã QR kết nối điện thoại"
              style={{ width: '220px', height: '220px', display: 'block' }}
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <h4 style={{ fontWeight: 800, fontSize: '1.1rem' }}>
              Quét mã QR bằng Camera điện thoại
            </h4>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Điện thoại và máy tính chỉ cần cùng kết nối vào <strong>chung 1 mạng WiFi gia đình</strong>.
            </p>
          </div>

          {/* Direct URL Box */}
          <div
            style={{
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
              border: '1px solid var(--border-color)',
            }}
          >
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Hoặc gõ địa chỉ này trên Chrome điện thoại:
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  color: 'var(--primary)',
                  fontSize: '0.95rem',
                }}
              >
                {fullLanUrl}
              </div>
            </div>

            <button className="btn btn-secondary btn-sm" onClick={handleCopy}>
              {copied ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
              <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
            </button>
          </div>

          {/* Security & Features */}
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1rem',
              textAlign: 'left',
              fontSize: '0.825rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              border: '1px solid var(--border-color)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={16} color="var(--success)" />
              <span><strong>Bảo mật tuyệt đối 100%:</strong> Dữ liệu chỉ truyền nội bộ trong nhà, không gửi lên internet.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={16} color="var(--primary)" />
              <span><strong>Đồng bộ hai chiều tức thì:</strong> Điện thoại quét mã, máy tính cập nhật giỏ hàng ngay lập tức.</span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={() => setMobileConnectOpen(false)}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
