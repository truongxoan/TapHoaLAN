import React, { useState, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Camera,
  ScanBarcode,
  Upload,
  X,
  Plus,
  Check,
  Package,
  Sparkles,
  Save,
  RotateCcw,
  RefreshCw,
  Layers,
  Image as ImageIcon,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const MobileAddProductModal = () => {
  const {
    mobileAddProductOpen,
    setMobileAddProductOpen,
    categories,
    addProduct,
    uploadProductPhoto,
    playBeep,
    showToast,
  } = useStore();

  const [scanStep, setScanStep] = useState('barcode'); // 'barcode' | 'photo' | 'form'
  const [barcode, setBarcode] = useState(() => localStorage.getItem('smartpos_draft_barcode') || '');
  const [name, setName] = useState(() => localStorage.getItem('smartpos_draft_name') || '');
  const [category, setCategory] = useState(() => localStorage.getItem('smartpos_draft_category') || 'instant_food');
  const [unit, setUnit] = useState(() => localStorage.getItem('smartpos_draft_unit') || 'Gói');
  const [costPrice, setCostPrice] = useState(() => localStorage.getItem('smartpos_draft_costPrice') || '');
  const [price, setPrice] = useState(() => localStorage.getItem('smartpos_draft_price') || '');
  const [stock, setStock] = useState(() => localStorage.getItem('smartpos_draft_stock') || '50');
  const [hasBoxUnit, setHasBoxUnit] = useState(() => localStorage.getItem('smartpos_draft_hasBoxUnit') === 'true');
  const [boxUnitName, setBoxUnitName] = useState(() => localStorage.getItem('smartpos_draft_boxUnitName') || 'Thùng');
  const [boxConversion, setBoxConversion] = useState(() => localStorage.getItem('smartpos_draft_boxConversion') || '30');
  const [boxPrice, setBoxPrice] = useState(() => localStorage.getItem('smartpos_draft_boxPrice') || '');
  const [boxCostPrice, setBoxCostPrice] = useState(() => localStorage.getItem('smartpos_draft_boxCostPrice') || '');
  const [photoPreview, setPhotoPreview] = useState(() => localStorage.getItem('smartpos_draft_photoPreview') || '');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Auto save draft to localStorage so nothing is lost if browser pauses or switches apps
  useEffect(() => {
    localStorage.setItem('smartpos_draft_barcode', barcode);
    localStorage.setItem('smartpos_draft_name', name);
    localStorage.setItem('smartpos_draft_category', category);
    localStorage.setItem('smartpos_draft_unit', unit);
    localStorage.setItem('smartpos_draft_costPrice', costPrice);
    localStorage.setItem('smartpos_draft_price', price);
    localStorage.setItem('smartpos_draft_stock', stock);
    localStorage.setItem('smartpos_draft_hasBoxUnit', hasBoxUnit.toString());
    localStorage.setItem('smartpos_draft_boxUnitName', boxUnitName);
    localStorage.setItem('smartpos_draft_boxConversion', boxConversion);
    localStorage.setItem('smartpos_draft_boxPrice', boxPrice);
    localStorage.setItem('smartpos_draft_boxCostPrice', boxCostPrice);
    localStorage.setItem('smartpos_draft_photoPreview', photoPreview);
  }, [barcode, name, category, unit, costPrice, price, stock, hasBoxUnit, boxUnitName, boxConversion, boxPrice, boxCostPrice, photoPreview]);

  const clearDraft = () => {
    setBarcode('');
    setName('');
    setCostPrice('');
    setPrice('');
    setStock('50');
    setHasBoxUnit(false);
    setBoxPrice('');
    setBoxCostPrice('');
    setPhotoPreview('');
    [
      'smartpos_draft_barcode',
      'smartpos_draft_name',
      'smartpos_draft_category',
      'smartpos_draft_unit',
      'smartpos_draft_costPrice',
      'smartpos_draft_price',
      'smartpos_draft_stock',
      'smartpos_draft_hasBoxUnit',
      'smartpos_draft_boxUnitName',
      'smartpos_draft_boxConversion',
      'smartpos_draft_boxPrice',
      'smartpos_draft_boxCostPrice',
      'smartpos_draft_photoPreview',
    ].forEach((k) => localStorage.removeItem(k));
  };

  const fileInputRef = useRef(null);
  const qrCodeScannerRef = useRef(null);

  // Barcode Camera Scanner inside Modal
  useEffect(() => {
    let isMounted = true;

    if (mobileAddProductOpen && scanStep === 'barcode') {
      const timer = setTimeout(async () => {
        try {
          if (qrCodeScannerRef.current && qrCodeScannerRef.current.isScanning) {
            await qrCodeScannerRef.current.stop();
          }

          const qr = new Html5Qrcode('mobile-add-barcode-viewport');
          qrCodeScannerRef.current = qr;

          await qr.start(
            { facingMode: 'environment' },
            { fps: 15, qrbox: { width: 220, height: 120 } },
            (decoded) => {
              if (isMounted) {
                playBeep();
                setBarcode(decoded);
                setScanStep('form');
                showToast(`Đã nhận mã vạch: ${decoded}`, 'success');
              }
            },
            () => {}
          );
        } catch (err) {
          console.warn('Barcode camera error:', err);
        }
      }, 350);

      return () => {
        isMounted = false;
        clearTimeout(timer);
        if (qrCodeScannerRef.current && qrCodeScannerRef.current.isScanning) {
          qrCodeScannerRef.current.stop().catch(() => {});
        }
      };
    }
  }, [mobileAddProductOpen, scanStep, playBeep, showToast]);

  if (!mobileAddProductOpen) return null;

  // Handle Photo Capture from Phone Camera or File Input
  const handlePhotoSelected = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Compress image to small canvas
        const canvas = document.createElement('canvas');
        const maxDim = 400;
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
        setPhotoPreview(compressedBase64);
        showToast('Đã chụp ảnh sản phẩm thành công!', 'success');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProductToServer = async (e) => {
    e.preventDefault();
    if (!name || !price) {
      showToast('Vui lòng nhập tên và giá bán sản phẩm!', 'warning');
      return;
    }

    setIsUploadingPhoto(true);

    let finalImageUrl = photoPreview;
    if (photoPreview && photoPreview.startsWith('data:image')) {
      finalImageUrl = await uploadProductPhoto(photoPreview);
    }

    const payload = {
      name,
      barcode: barcode || `${Math.floor(1000000000000 + Math.random() * 9000000000000)}`,
      category,
      unit,
      costPrice: Number(costPrice) || 0,
      price: Number(price) || 0,
      hasBoxUnit,
      boxUnitName,
      boxConversion: Number(boxConversion) || 1,
      boxCostPrice: Number(boxCostPrice) || (Number(costPrice) * Number(boxConversion)),
      boxPrice: Number(boxPrice) || (Number(price) * Number(boxConversion)),
      stock: Number(stock) || 0,
      minStock: 10,
      vatRate: 8,
      image: finalImageUrl || 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=300&auto=format&fit=crop&q=80',
    };

    addProduct(payload);
    setIsUploadingPhoto(false);
    setMobileAddProductOpen(false);
    clearDraft();
    setScanStep('barcode');
  };

  return (
    <div className="modal-overlay" onClick={() => setMobileAddProductOpen(false)}>
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '500px', maxHeight: '92vh', overflowY: 'auto' }}
      >
        <div className="modal-header">
          <div className="modal-title">
            <Camera size={20} color="var(--primary)" />
            <span>Quét Mã & Chụp Ảnh Thêm Hàng (Đồng Bộ Server)</span>
          </div>
          <button
            className="btn btn-secondary btn-icon"
            onClick={() => setMobileAddProductOpen(false)}
          >
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '1rem' }}>
          {/* STEP 1: SCAN BARCODE VIEWPORT */}
          {scanStep === 'barcode' ? (
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  position: 'relative',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  background: '#0B0F19',
                  minHeight: '180px',
                  maxHeight: '220px',
                  marginBottom: '1rem',
                  border: '2px solid var(--primary-border)',
                }}
              >
                <div id="mobile-add-barcode-viewport" style={{ width: '100%', height: '100%' }} />
                <div
                  style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(0,0,0,0.7)',
                    color: '#34D399',
                    padding: '2px 10px',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                >
                  Đưa camera vào mã vạch bao bì
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => {
                    setBarcode(`${Math.floor(1000000000000 + Math.random() * 9000000000000)}`);
                    setScanStep('form');
                  }}
                >
                  Tự Tạo Mã Vạch
                </button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  onClick={() => setScanStep('form')}
                >
                  Nhập Bằng Tay & Bỏ Qua
                </button>
              </div>
            </div>
          ) : (
            /* STEP 2: FILL DETAILS & CAPTURE PHOTO */
            <form onSubmit={handleSaveProductToServer}>
              {/* Photo Capture Preview Card */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  background: 'var(--bg-secondary)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1rem',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div
                  style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: '8px',
                    background: 'var(--bg-card)',
                    border: '2px dashed var(--primary-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Ảnh chụp"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <ImageIcon size={28} color="var(--text-muted)" />
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handlePhotoSelected}
                  />

                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    style={{ width: '100%', marginBottom: '4px' }}
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  >
                    <Camera size={14} />
                    <span>{photoPreview ? 'Chụp Lại Ảnh' : 'Chụp Ảnh Sản Phẩm'}</span>
                  </button>

                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Ảnh chụp trực tiếp từ camera điện thoại sẽ được lưu vào Server.
                  </div>
                </div>
              </div>

              {/* Barcode & Category */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div>
                  <label className="form-label">Mã vạch (Barcode):</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input
                      type="text"
                      className="form-control"
                      style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setScanStep('barcode')}
                      title="Quét lại mã"
                    >
                      <ScanBarcode size={14} />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="form-label">Danh mục:</label>
                  <select
                    className="form-control"
                    style={{ fontSize: '0.85rem' }}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {categories.filter((c) => c.id !== 'all').map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Name */}
              <div className="form-group">
                <label className="form-label">Tên sản phẩm *:</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="VD: Mì Hảo Hảo Chua Cay, Nước Ngọt..."
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* Prices & Unit */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div>
                  <label className="form-label">Đơn vị lẻ *:</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Gói, Lon..."
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label">Giá vốn lẻ:</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="3800"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label">Giá bán lẻ *:</label>
                  <input
                    type="number"
                    className="form-control"
                    style={{ fontWeight: 800, color: 'var(--primary)' }}
                    placeholder="5000"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
              </div>

              {/* Box Pack Settings */}
              <div
                style={{
                  background: 'var(--bg-secondary)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1rem',
                  border: '1px solid var(--border-color)',
                }}
              >
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={hasBoxUnit}
                    onChange={(e) => setHasBoxUnit(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                  />
                  <Package size={16} color="var(--primary)" />
                  <span>Có nhập / bán theo Thùng (Lốc / Két)</span>
                </label>

                {hasBoxUnit && (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <div>
                        <label className="form-label">Tên thùng/lốc:</label>
                        <input
                          type="text"
                          className="form-control"
                          value={boxUnitName}
                          onChange={(e) => setBoxUnitName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="form-label">Số lượng lẻ trong 1 thùng:</label>
                        <input
                          type="number"
                          className="form-control"
                          value={boxConversion}
                          onChange={(e) => setBoxConversion(e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div>
                        <label className="form-label">Giá vốn 1 thùng:</label>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="114000"
                          value={boxCostPrice}
                          onChange={(e) => setBoxCostPrice(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="form-label">Giá bán 1 thùng:</label>
                        <input
                          type="number"
                          className="form-control"
                          style={{ fontWeight: 800, color: 'var(--success)' }}
                          placeholder="135000"
                          value={boxPrice}
                          onChange={(e) => setBoxPrice(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Initial Stock */}
              <div className="form-group">
                <label className="form-label">Số lượng tồn kho ban đầu ({unit}):</label>
                <input
                  type="number"
                  className="form-control"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                />
              </div>

              <div className="modal-footer" style={{ padding: '0.75rem 0 0', background: 'transparent' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setMobileAddProductOpen(false)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-success btn-lg"
                  style={{ flex: 1 }}
                  disabled={isUploadingPhoto}
                >
                  <Save size={18} />
                  <span>{isUploadingPhoto ? 'Đang Tải Ảnh...' : 'Lưu & Bắn Lên Server Máy Tính'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
