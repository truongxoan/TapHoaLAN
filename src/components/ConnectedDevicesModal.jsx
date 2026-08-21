import React from 'react';
import {
  Smartphone,
  Monitor,
  Wifi,
  X,
  CheckCircle2,
  Clock,
  Radio,
  RefreshCw,
  QrCode,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const ConnectedDevicesModal = () => {
  const {
    devicesModalOpen,
    setDevicesModalOpen,
    connectedDevicesList,
    lanIp,
    setMobileConnectOpen,
  } = useStore();

  if (!devicesModalOpen) return null;

  return (
    <div className="modal-overlay" onClick={() => setDevicesModalOpen(false)}>
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px' }}
      >
        <div className="modal-header">
          <div className="modal-title" style={{ color: 'var(--primary)' }}>
            <Radio size={20} className="pulse-icon" />
            <span>Thiết Bị & Điện Thoại Đang Vào Server ({connectedDevicesList.length})</span>
          </div>
          <button
            className="btn btn-secondary btn-icon"
            onClick={() => setDevicesModalOpen(false)}
          >
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '1.25rem' }}>
          {/* Server status alert */}
          <div
            style={{
              background: 'var(--success-light)',
              border: '1px solid var(--success-border)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontWeight: 800, color: 'var(--success)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={16} />
                <span>Máy Chủ Mạng LAN Đang Hoạt Động (Cục Bộ 100%)</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Địa chỉ máy chủ: <strong>http://{lanIp}:5000</strong>
              </div>
            </div>

            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setDevicesModalOpen(false);
                setMobileConnectOpen(true);
              }}
            >
              <QrCode size={13} />
              <span>Mã QR Kết Nối</span>
            </button>
          </div>

          {/* Connected Devices List */}
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            DANH SÁCH ĐIỆN THOẠI & MÁY TÍNH ĐANG TRUY CẬP:
          </div>

          {connectedDevicesList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Đang dò tìm thiết bị trong mạng LAN...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {connectedDevicesList.map((dev, idx) => {
                const isPhone = dev.deviceType === 'phone' || (dev.name && dev.name.toLowerCase().includes('đt'));
                return (
                  <div
                    key={dev.id || idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.75rem 1rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '8px',
                          background: isPhone ? 'var(--primary-light)' : 'var(--info-light)',
                          color: isPhone ? 'var(--primary)' : 'var(--info)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {isPhone ? <Smartphone size={20} /> : <Monitor size={20} />}
                      </div>

                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{dev.name}</span>
                          <span
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: '#10B981',
                              boxShadow: '0 0 6px #10B981',
                              display: 'inline-block',
                            }}
                            title="Đang Online"
                          />
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          IP: {dev.ip}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                        <Wifi size={10} /> Realtime Sync
                      </span>
                      {dev.connectedAt && (
                        <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Vào lúc: {new Date(dev.connectedAt).toLocaleTimeString('vi-VN')}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setDevicesModalOpen(false)}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
