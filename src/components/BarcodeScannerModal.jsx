import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  X,
  Camera,
  ScanBarcode,
  Keyboard,
  Sparkles,
  AlertCircle,
  Volume2,
  Smartphone,
  Repeat,
  RefreshCw,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const BarcodeScannerModal = () => {
  const {
    scannerOpen,
    scannerTarget,
    closeScanner,
    handleBarcodeScanned,
    continuousScan,
    setContinuousScan,
    setMobileConnectOpen,
  } = useStore();

  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    if (!scannerOpen) {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current
          .stop()
          .catch((err) => console.log('Stop scanner error', err));
      }
      setIsCameraActive(false);
      setCameraError(null);
      return;
    }

    let isMounted = true;

    const startCamera = async () => {
      try {
        if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }

        const qrCode = new Html5Qrcode('barcode-reader-viewport');
        html5QrCodeRef.current = qrCode;

        const config = {
          fps: 15,
          qrbox: { width: 260, height: 180 },
          aspectRatio: 1.333334,
        };

        await qrCode.start(
          { facingMode: facingMode },
          config,
          (decodedText) => {
            if (isMounted) {
              handleBarcodeScanned(decodedText);
            }
          },
          () => {
            // scan failure callback
          }
        );

        if (isMounted) {
          setIsCameraActive(true);
          setCameraError(null);
        }
      } catch (err) {
        console.warn('Camera start error:', err);
        if (isMounted) {
          setCameraError(
            'Không thể truy cập Camera. Bạn có thể mở trên điện thoại (quét QR kết nối) hoặc gõ mã bằng tay!'
          );
          setIsCameraActive(false);
        }
      }
    };

    const timer = setTimeout(() => {
      startCamera();
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current
          .stop()
          .catch((err) => console.log('Cleanup scanner error', err));
      }
    };
  }, [scannerOpen, facingMode]);

  if (!scannerOpen) return null;

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleBarcodeScanned(manualCode.trim());
      setManualCode('');
    }
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const sampleBarcodes = [
    { code: '8934563120015', name: 'Bia Tiger Lon 330ml' },
    { code: '8934563120060', name: 'Mì Tôm Hảo Hảo Gói' },
    { code: '8934563120077', name: 'Thùng Mì Hảo Hảo (30 gói)' },
    { code: '8934563120022', name: 'Coca Cola Chai 390ml' },
    { code: '8934563120145', name: 'Sữa Vinamilk Lốc 4' },
    { code: '8934563120169', name: 'Nước Rửa Chén Sunlight' },
  ];

  return (
    <div className="modal-overlay no-print" onClick={closeScanner}>
      <div
        className="modal-dialog modal-dialog-lg"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px' }}
      >
        <div className="modal-header">
          <div className="modal-title">
            <ScanBarcode size={22} color="var(--primary)" />
            <span>
              {scannerTarget === 'import'
                ? 'Quét Mã Vạch Nhập Hàng Vào Kho'
                : 'Quét Mã Vạch Bán Hàng (POS)'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              className="btn btn-secondary btn-sm"
              title="Chuyển Camera Trước/Sau"
              onClick={toggleFacingMode}
            >
              <RefreshCw size={14} />
              <span>Đổi Camera</span>
            </button>

            <button
              className="btn btn-secondary btn-icon"
              onClick={closeScanner}
              style={{ borderRadius: '50%' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="modal-body" style={{ padding: '1.25rem' }}>
          {/* Controls Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.75rem',
              fontSize: '0.8rem',
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              <input
                type="checkbox"
                checked={continuousScan}
                onChange={(e) => setContinuousScan(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
              />
              <Repeat size={14} color="var(--primary)" />
              <span>Chế độ quét liên tục (Không đóng sau mỗi món)</span>
            </label>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ padding: '2px 8px', fontSize: '0.75rem' }}
              onClick={() => {
                closeScanner();
                setMobileConnectOpen(true);
              }}
            >
              <Smartphone size={14} color="var(--primary)" />
              <span>Quét Bằng Điện Thoại</span>
            </button>
          </div>

          {/* Camera Scanner Viewport */}
          <div
            style={{
              position: 'relative',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              background: '#0B0F19',
              minHeight: '260px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--border-color)',
            }}
          >
            <div
              id="barcode-reader-viewport"
              style={{ width: '100%', height: '100%' }}
            />

            {/* Laser and Corner Overlay */}
            {isCameraActive && (
              <>
                <div className="scanner-laser" />
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '240px',
                    height: '160px',
                    pointerEvents: 'none',
                  }}
                >
                  <div className="scanner-corner tl" />
                  <div className="scanner-corner tr" />
                  <div className="scanner-corner bl" />
                  <div className="scanner-corner br" />
                </div>
              </>
            )}

            {cameraError && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  background: 'rgba(15, 23, 42, 0.9)',
                  color: '#F8FAFC',
                }}
              >
                <Camera size={36} color="var(--warning)" style={{ marginBottom: '0.75rem' }} />
                <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  {cameraError}
                </p>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    closeScanner();
                    setMobileConnectOpen(true);
                  }}
                >
                  <Smartphone size={14} />
                  <span>Mở Quét Bằng Điện Thoại</span>
                </button>
              </div>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '0.75rem',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
            }}
          >
            <Volume2 size={14} color="var(--success)" />
            <span>Âm thanh tít tự động phát khi nhận diện thành công mã vạch.</span>
          </div>

          {/* Manual Input Form */}
          <form
            onSubmit={handleManualSubmit}
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div className="input-icon-wrapper" style={{ flex: 1 }}>
                <Keyboard size={16} className="input-icon" />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Gõ mã hoặc bấm quét từ máy đọc USB..."
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  autoFocus
                />
              </div>
              <button type="submit" className="btn btn-primary">
                Xác Nhận
              </button>
            </div>
          </form>

          {/* Quick Simulation Clickers */}
          <div style={{ marginTop: '1rem' }}>
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <Sparkles size={14} color="var(--warning)" />
              <span>Bấm nhanh mã vạch hàng tạp hóa mẫu:</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {sampleBarcodes.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                  onClick={() => handleBarcodeScanned(item.code)}
                >
                  <ScanBarcode size={12} color="var(--primary)" />
                  <span style={{ fontWeight: 600 }}>{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={closeScanner}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
