import React, { useState, useEffect } from 'react';
import {
  PackagePlus,
  ScanBarcode,
  Plus,
  Trash2,
  Building2,
  Calendar,
  FileText,
  CheckCircle,
  History,
  Boxes,
  ArrowRight,
  Package,
  Sparkles,
  Calculator,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const ImportStockScreen = () => {
  const {
    products,
    suppliers,
    purchases,
    importStock,
    lookupProductByBarcode,
    managerAuthHeaders,
    openScanner,
    showToast,
    categories,
  } = useStore();

  const [selectedSupplier, setSelectedSupplier] = useState(
    suppliers[0] ? suppliers[0].id : 'SUP-001'
  );
  const [importItems, setImportItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [quickBarcode, setQuickBarcode] = useState('');
  const [scanBanner, setScanBanner] = useState(null); // {barcode, product} | {barcode, notFound:true}
  const [quickCreate, setQuickCreate] = useState(null); // {barcode, name, unit, costPrice, price, stock}
  const [prefillChecked, setPrefillChecked] = useState(false);

  const formatVND = (val) =>
    new Intl.NumberFormat('vi-VN').format(Math.round(val || 0)) + ' đ';

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return `${d.toLocaleTimeString('vi-VN')} - ${d.toLocaleDateString('vi-VN')}`;
  };

  // If POS scanned an unknown barcode, prefill Import with it on first render.
  useEffect(() => {
    if (prefillChecked) return;
    setPrefillChecked(true);
    try {
      const pre = sessionStorage.getItem('smartpos_import_prefill_barcode');
      if (pre) {
        sessionStorage.removeItem('smartpos_import_prefill_barcode');
        handleScanForImport(pre);
      }
    } catch { /* ignore */ }
  }, [prefillChecked]);

  // Add product to import list
  const handleAddProductToImport = (prod) => {
    const existing = importItems.find((item) => item.productId === prod.id);
    if (existing) {
      setImportItems((prev) =>
        prev.map((item) =>
          item.productId === prod.id
            ? { ...item, importQty: item.importQty + 1, totalQty: (item.importQty + 1) * (item.isBox ? item.boxConversion : 1) }
            : item
        )
      );
      showToast(`Tăng số lượng nhập: ${prod.name}`, 'info');
    } else {
      const hasBox = prod.hasBoxUnit && prod.boxConversion > 1;
      const conv = prod.boxConversion || 24;
      const boxCost = prod.boxCostPrice || (prod.costPrice * conv);

      setImportItems((prev) => [
        ...prev,
        {
          productId: prod.id,
          barcode: prod.barcode,
          name: prod.name,
          unit: prod.unit || 'Gói',
          hasBoxUnit: hasBox,
          boxUnitName: prod.boxUnitName || 'Thùng',
          boxConversion: conv,
          isBox: hasBox, // default import as box if supported
          importQty: hasBox ? 5 : 20, // default 5 boxes or 20 units
          boxCostPrice: boxCost,
          costPrice: prod.costPrice || 0,
          retailPrice: prod.price || 0,
          boxPrice: prod.boxPrice || (prod.price * conv),
          vatRate: prod.vatRate || 8,
        },
      ]);
      showToast(`Đã thêm vào phiếu nhập: ${prod.name}`, 'success');
    }
  };

  // Handle scanned barcode: server lookup first, then local products.
  const handleScanForImport = async (barcode) => {
    const code = String(barcode || '').trim();
    if (!code) return;
    let found = null;
    if (lookupProductByBarcode) {
      const res = await lookupProductByBarcode(code);
      if (res.found) found = res.product;
    } else {
      found = products.find((p) => p.barcode === code);
    }
    if (found) {
      handleAddProductToImport(found);
      setScanBanner({ barcode: code, product: found });
      setQuickCreate(null);
    } else {
      // NEW: inline quick-create instead of sending the user to Inventory.
      setScanBanner({ barcode: code, notFound: true });
      setQuickCreate({ barcode: code, name: '', unit: 'Gói', costPrice: '', price: '', stock: '' });
      showToast(`Mã mới ${code} chưa có trong kho — tạo nhanh ngay tại đây.`, 'info');
    }
  };

  const handleSaveQuickCreate = async (e) => {
    e.preventDefault();
    if (!quickCreate || !quickCreate.name.trim()) {
      showToast('Vui lòng nhập tên sản phẩm!', 'warning');
      return;
    }
    if (quickCreate.price === '' || Number(quickCreate.price) < 0) {
      showToast('Vui lòng nhập giá bán hợp lệ!', 'warning');
      return;
    }
    const payload = {
      barcode: quickCreate.barcode,
      name: quickCreate.name.trim(),
      unit: quickCreate.unit || 'Gói',
      costPrice: Number(quickCreate.costPrice) || 0,
      price: Number(quickCreate.price),
      stock: Number(quickCreate.stock) || 0,
    };
    // Wait for the server product (with its real SP-xxxx id) before adding
    // to the import list, so the import row always references a real product
    // and the stock update on save can find it.
    const wsHost = window.location.hostname || 'localhost';
    let saved = null;
    try {
      const res = await fetch(`http://${wsHost}:5000/api/products/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...managerAuthHeaders() },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        if (res.status === 401) showToast('Cần mở khóa quyền chủ tiệm để tạo sản phẩm có giá.', 'danger');
        else showToast(data.error || 'Không lưu được sản phẩm.', 'danger');
        return;
      }
      saved = data.product;
    } catch {
      showToast('Không kết nối được server để tạo sản phẩm.', 'danger');
      return;
    }
    // Keep the local product list in sync (addProduct is idempotent here:
    // the server product already exists, so this only refreshes local state).
    setImportItems((prev) => {
      if (prev.some((it) => it.productId === saved.id || it.barcode === saved.barcode)) return prev;
      return [
        ...prev,
        {
          productId: saved.id,
          barcode: saved.barcode,
          name: saved.name,
          unit: saved.unit || 'Gói',
          hasBoxUnit: false,
          boxUnitName: 'Thùng',
          boxConversion: 1,
          isBox: false,
          importQty: 20,
          boxCostPrice: saved.costPrice || 0,
          costPrice: saved.costPrice || 0,
          retailPrice: saved.price || 0,
          boxPrice: saved.price || 0,
          vatRate: 8,
        },
      ];
    });
    setScanBanner({ barcode: saved.barcode, product: saved });
    setQuickCreate(null);
    showToast(`Đã tạo nhanh: ${saved.name} — giá bán ${new Intl.NumberFormat('vi-VN').format(saved.price)} đ`, 'success');
  };

  // Update item field
  const updateImportItem = (productId, field, value) => {
    setImportItems((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const updated = { ...item, [field]: value };

          // Recalculate if unit or price changed
          if (field === 'isBox') {
            if (value === true) {
              updated.costPrice = Math.round((Number(updated.boxCostPrice) || 0) / (updated.boxConversion || 1));
            }
          } else if (field === 'boxCostPrice') {
            updated.costPrice = Math.round((Number(value) || 0) / (updated.boxConversion || 1));
          } else if (field === 'costPrice') {
            updated.boxCostPrice = Math.round((Number(value) || 0) * (updated.boxConversion || 1));
          }

          return updated;
        }
        return item;
      })
    );
  };

  const removeImportItem = (productId) => {
    setImportItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  // Calculation for total bill
  const totalImportCost = importItems.reduce((sum, item) => {
    const qty = Number(item.importQty) || 0;
    const pricePerImportUnit = item.isBox ? (Number(item.boxCostPrice) || 0) : (Number(item.costPrice) || 0);
    return sum + qty * pricePerImportUnit;
  }, 0);

  const totalInputVat = importItems.reduce((sum, item) => {
    const qty = Number(item.importQty) || 0;
    const pricePerImportUnit = item.isBox ? (Number(item.boxCostPrice) || 0) : (Number(item.costPrice) || 0);
    const itemTotal = qty * pricePerImportUnit;
    return sum + (itemTotal * (Number(item.vatRate) || 0)) / 100;
  }, 0);

  const grandTotalImport = Math.round(totalImportCost + totalInputVat);

  // Submit Import Stock
  const handleSaveImportStock = (e) => {
    e.preventDefault();
    if (importItems.length === 0) {
      showToast('Vui lòng thêm sản phẩm vào phiếu nhập!', 'warning');
      return;
    }

    // Prepare processed payload with base units calculation
    const processedItems = importItems.map((item) => {
      const isBox = item.isBox && item.boxConversion > 1;
      const conv = isBox ? item.boxConversion : 1;
      const baseUnitsToAdd = (Number(item.importQty) || 0) * conv;
      const unitCost = isBox
        ? Math.round((Number(item.boxCostPrice) || 0) / conv)
        : Number(item.costPrice) || 0;

      return {
        productId: item.productId,
        barcode: item.barcode,
        name: item.name,
        unit: item.unit,
        importUnit: isBox ? item.boxUnitName : item.unit,
        boxQty: isBox ? Number(item.importQty) : 0,
        qty: baseUnitsToAdd,
        costPrice: unitCost,
        boxCostPrice: Number(item.boxCostPrice) || (unitCost * conv),
        retailPrice: Number(item.retailPrice) || 0,
        boxPrice: Number(item.boxPrice) || 0,
        vatRate: Number(item.vatRate) || 8,
      };
    });

    const purchase = importStock({
      supplierId: selectedSupplier,
      items: processedItems,
      notes,
    });

    if (purchase) {
      setImportItems([]);
      setNotes('');
    }
  };

  return (
    <div>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '0.6rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PackagePlus size={26} color="var(--primary)" />
            <span>Nhập Hàng Vào Kho & Quy Đổi Thùng Sang Lẻ</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', marginTop: '2px' }}>
            Hỗ trợ nhập theo Thùng/Lốc, tự động quy đổi số lượng lẻ trong kho và tính giá vốn bình quân gia quyền
          </p>
        </div>

        <button
          className="btn btn-primary btn-lg"
          onClick={() => openScanner('import', (code) => handleScanForImport(code))}
        >
          <ScanBarcode size={18} />
          <span>Quét Mã Nhập Hàng</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1rem' }}>
        {/* LEFT COLUMN: Import Items Table */}
        <div>
          {/* Quick Barcode & Search Input */}
          <div
            className="card"
            style={{
              padding: '0.75rem',
              marginBottom: '1rem',
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center',
            }}
          >
            <div className="input-icon-wrapper" style={{ flex: 1 }}>
              <ScanBarcode size={16} className="input-icon" />
              <input
                type="text"
                className="form-control"
                style={{ fontSize: '0.85rem' }}
                placeholder="Gõ mã vạch hoặc tên hàng tạp hóa có sẵn..."
                value={quickBarcode}
                onChange={(e) => setQuickBarcode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && quickBarcode) {
                    const match = products.find(
                      (p) =>
                        p.barcode === quickBarcode.trim() ||
                        p.name.toLowerCase().includes(quickBarcode.toLowerCase())
                    );
                    if (match) {
                      handleAddProductToImport(match);
                      setQuickBarcode('');
                    } else {
                      handleScanForImport(quickBarcode.trim());
                      setQuickBarcode('');
                    }
                  }
                }}
              />
            </div>

            {/* Quick Add dropdown */}
            <select
              className="form-control"
              style={{ width: 'auto', minWidth: '180px', fontSize: '0.85rem' }}
              onChange={(e) => {
                const prod = products.find((p) => p.id === e.target.value);
                if (prod) handleAddProductToImport(prod);
                e.target.value = '';
              }}
            >
              <option value="">+ Chọn món từ kho...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Scan result banner: always shows the current selling price */}
          {scanBanner && (
            <div className="card" style={{ padding: '0.75rem 1rem', marginBottom: '1rem', borderLeft: '4px solid var(--primary)' }}>
              {scanBanner.product ? (
                <div>
                  <div style={{ fontWeight: 800 }}>✅ Đã tìm thấy: {scanBanner.product.name}</div>
                  <div style={{ fontSize: '0.85rem' }}>
                    Mã vạch: <span style={{ fontFamily: 'var(--font-mono)' }}>{scanBanner.barcode}</span>
                    {' '}•{' '}
                    <strong>Giá bán hiện tại: {formatVND(scanBanner.product.price || scanBanner.product.retailPrice || 0)}</strong>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontWeight: 800 }}>🆕 Mã mới chưa có trong kho: {scanBanner.barcode}</div>
                  <div style={{ fontSize: '0.85rem' }}>Điền form tạo nhanh bên dưới, sản phẩm sẽ vào phiếu nhập ngay sau khi lưu.</div>
                </div>
              )}
            </div>
          )}

          {/* Quick-create form for unknown barcodes */}
          {quickCreate && (
            <form onSubmit={handleSaveQuickCreate} className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
              <div style={{ fontWeight: 800, marginBottom: '0.5rem' }}>Tạo nhanh sản phẩm mới</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <label className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <span className="form-label">Mã vạch</span>
                  <input className="form-control" value={quickCreate.barcode} readOnly />
                </label>
                <label className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <span className="form-label">Tên sản phẩm *</span>
                  <input className="form-control" value={quickCreate.name} onChange={(e) => setQuickCreate({ ...quickCreate, name: e.target.value })} placeholder="VD: Mì Hảo Hảo tôm chua cay" autoFocus />
                </label>
                <label className="form-group">
                  <span className="form-label">Đơn vị</span>
                  <input className="form-control" value={quickCreate.unit} onChange={(e) => setQuickCreate({ ...quickCreate, unit: e.target.value })} />
                </label>
                <label className="form-group">
                  <span className="form-label">Tồn đầu</span>
                  <input type="number" min="0" className="form-control" value={quickCreate.stock} onChange={(e) => setQuickCreate({ ...quickCreate, stock: e.target.value })} />
                </label>
                <label className="form-group">
                  <span className="form-label">Giá vốn (đ)</span>
                  <input type="number" min="0" className="form-control" value={quickCreate.costPrice} onChange={(e) => setQuickCreate({ ...quickCreate, costPrice: e.target.value })} />
                </label>
                <label className="form-group">
                  <span className="form-label">Giá bán * (đ)</span>
                  <input type="number" min="0" className="form-control" value={quickCreate.price} onChange={(e) => setQuickCreate({ ...quickCreate, price: e.target.value })} />
                </label>
              </div>
              <div style={{ marginTop: '0.5rem', fontWeight: 800, color: 'var(--primary)' }}>
                Giá bán: {quickCreate.price === '' ? '—' : formatVND(Number(quickCreate.price) || 0)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Mã hàng tự động: do server cấp khi lưu (dạng SP-xxxx), không cần nhập.
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button type="submit" className="btn btn-success">Lưu &amp; Thêm Vào Phiếu Nhập</button>
                <button type="button" className="btn btn-secondary" onClick={() => { setQuickCreate(null); setScanBanner(null); }}>Hủy</button>
              </div>
            </form>
          )}

          {/* Import Items Table */}
          <div className="card">
            <div className="card-header" style={{ padding: '0.65rem 1rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                Danh Sách Mặt Hàng Nhập ({importItems.length} món)
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Tự động nhân số lượng lẻ khi chọn "Nhập Thùng"
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Mặt Hàng</th>
                    <th style={{ padding: '0.6rem 0.5rem' }}>Đơn Vị Nhập</th>
                    <th style={{ padding: '0.6rem 0.5rem', width: '100px' }}>Số Lượng</th>
                    <th style={{ padding: '0.6rem 0.5rem', textAlign: 'right' }}>Giá Vốn Nhập (đ)</th>
                    <th style={{ padding: '0.6rem 0.5rem', textAlign: 'right' }}>Giá Bán Hiện Tại</th>
                    <th style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>Vào Kho Lẻ</th>
                    <th style={{ padding: '0.6rem 0.5rem', textAlign: 'right' }}>Thành Tiền</th>
                    <th style={{ padding: '0.6rem 0.5rem', width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {importItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                        <Package size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
                        <div>Chưa có mặt hàng nào trong phiếu nhập.</div>
                        <div style={{ fontSize: '0.75rem' }}>Quét mã vạch hoặc chọn từ danh sách ở trên</div>
                      </td>
                    </tr>
                  ) : (
                    importItems.map((item) => {
                      const isBox = item.isBox && item.hasBoxUnit;
                      const conv = isBox ? item.boxConversion : 1;
                      const baseQty = (Number(item.importQty) || 0) * conv;
                      const pricePerUnit = isBox ? (Number(item.boxCostPrice) || 0) : (Number(item.costPrice) || 0);
                      const itemTotal = (Number(item.importQty) || 0) * pricePerUnit;

                      return (
                        <tr key={item.productId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          {/* Product Info */}
                          <td style={{ padding: '0.55rem 0.75rem' }}>
                            <div style={{ fontWeight: 700 }}>{item.name}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                              {item.barcode}
                            </div>
                          </td>

                          {/* Unit Selector: Thùng vs Lẻ */}
                          <td style={{ padding: '0.55rem 0.5rem' }}>
                            {item.hasBoxUnit ? (
                              <select
                                className="form-control"
                                style={{ padding: '2px 4px', fontSize: '0.75rem', fontWeight: 700, width: 'auto' }}
                                value={item.isBox ? 'box' : 'unit'}
                                onChange={(e) => updateImportItem(item.productId, 'isBox', e.target.value === 'box')}
                              >
                                <option value="box">📦 {item.boxUnitName || 'Thùng'} ({item.boxConversion} {item.unit})</option>
                                <option value="unit">Lẻ ({item.unit})</option>
                              </select>
                            ) : (
                              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Lẻ ({item.unit})</span>
                            )}
                          </td>

                          {/* Import Qty */}
                          <td style={{ padding: '0.55rem 0.5rem' }}>
                            <input
                              type="number"
                              className="form-control"
                              style={{ width: '80px', padding: '2px 4px', fontSize: '0.85rem', fontWeight: 700, textAlign: 'center' }}
                              value={item.importQty}
                              onChange={(e) => updateImportItem(item.productId, 'importQty', e.target.value)}
                              min="1"
                            />
                          </td>

                          {/* Cost Price */}
                          <td style={{ padding: '0.55rem 0.5rem', textAlign: 'right' }}>
                            {isBox ? (
                              <div>
                                <input
                                  type="number"
                                  className="form-control"
                                  style={{ width: '100px', padding: '2px 4px', fontSize: '0.8rem', textAlign: 'right', display: 'inline-block' }}
                                  value={item.boxCostPrice}
                                  onChange={(e) => updateImportItem(item.productId, 'boxCostPrice', e.target.value)}
                                />
                                <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                  ~{formatVND(item.costPrice)}/{item.unit}
                                </div>
                              </div>
                            ) : (
                              <input
                                type="number"
                                className="form-control"
                                style={{ width: '90px', padding: '2px 4px', fontSize: '0.8rem', textAlign: 'right', display: 'inline-block' }}
                                value={item.costPrice}
                                onChange={(e) => updateImportItem(item.productId, 'costPrice', e.target.value)}
                              />
                            )}
                          </td>

                          <td style={{ padding: '0.55rem 0.5rem', textAlign: 'right', fontWeight: 800, color: 'var(--primary)' }}>
                            {formatVND(item.retailPrice || 0)}
                          </td>

                          {/* Base units added to warehouse */}
                          <td style={{ padding: '0.55rem 0.5rem', textAlign: 'center' }}>
                            <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                              +{baseQty} {item.unit}
                            </span>
                          </td>

                          {/* Total Line */}
                          <td style={{ padding: '0.55rem 0.5rem', textAlign: 'right', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                            {formatVND(itemTotal)}
                          </td>

                          {/* Delete */}
                          <td style={{ padding: '0.55rem 0.5rem', textAlign: 'center' }}>
                            <button
                              onClick={() => removeImportItem(item.productId)}
                              style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Supplier Info & Finalize Import */}
        <div>
          <div className="card" style={{ position: 'sticky', top: '4.5rem' }}>
            <div className="card-header" style={{ padding: '0.65rem 1rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>Thông Tin Phiếu Nhập</span>
            </div>

            <form onSubmit={handleSaveImportStock}>
              <div className="card-body" style={{ padding: '0.85rem' }}>
                <div className="form-group">
                  <label className="form-label">Nhà Phân Phối / Đại Lý *:</label>
                  <select
                    className="form-control"
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Ghi chú phiếu nhập:</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="VD: Đợt nhập bia + mì tôm cuối tuần..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                {/* Calculation Summary */}
                <div
                  style={{
                    background: 'var(--bg-secondary)',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.8rem',
                    marginBottom: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Tiền hàng (chưa thuế):</span>
                    <span style={{ fontWeight: 600 }}>{formatVND(totalImportCost)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Thuế VAT đầu vào:</span>
                    <span style={{ fontWeight: 600 }}>{formatVND(totalInputVat)}</span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderTop: '1px solid var(--border-color)',
                      paddingTop: '0.5rem',
                      marginTop: '0.5rem',
                    }}
                  >
                    <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>TỔNG TIỀN PHIẾU:</span>
                    <span style={{ fontWeight: 900, fontSize: '1.25rem', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                      {formatVND(grandTotalImport)}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-success btn-xl"
                  style={{ width: '100%' }}
                  disabled={importItems.length === 0}
                >
                  <CheckCircle size={20} />
                  <span>Xác Nhận Nhập Kho</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
