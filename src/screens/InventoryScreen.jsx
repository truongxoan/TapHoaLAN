import React, { useState, useRef, useEffect } from 'react';
import JsBarcode from 'jsbarcode';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Barcode,
  Printer,
  AlertTriangle,
  Download,
  Upload,
  CheckCircle,
  X,
  ScanBarcode,
  DollarSign,
  Package,
  Layers,
  Save,
  Check,
  Tag,
  Sparkles,
  FileSpreadsheet,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { exportStoreToExcel } from '../utils/excelExporter';

export const InventoryScreen = () => {
  const {
    products,
    categories,
    orders,
    debts,
    purchases,
    shiftsHistory,
    taxSettings,
    isPinUnlocked,
    requireManagerPin,
    lockManagerPin,
    setPinModalOpen,
    addProduct,
    updateProduct,
    deleteProduct,
    openScanner,
    showToast,
  } = useStore();

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
      showToast(`Đã xuất danh mục kho ra Excel: ${filename}`, 'success');
    } catch (e) {
      showToast('Lỗi khi xuất file Excel!', 'danger');
    }
  };

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [quickPriceModal, setQuickPriceModal] = useState(false);
  const [quickPriceTarget, setQuickPriceTarget] = useState(null);
  const [labelModalOpen, setLabelModalOpen] = useState(false);
  const [selectedLabelProduct, setSelectedLabelProduct] = useState(null);
  const [labelQty, setLabelQty] = useState(6);

  // Inline edit state
  const [inlineEditingId, setInlineEditingId] = useState(null);
  const [inlinePriceData, setInlinePriceData] = useState({});

  const barcodePreviewCanvasRef = useRef(null);
  const labelPrintCanvasRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    category: 'instant_food',
    unit: 'Gói',
    costPrice: '',
    price: '',
    hasBoxUnit: true,
    boxUnitName: 'Thùng',
    boxConversion: '30',
    boxCostPrice: '',
    boxPrice: '',
    stock: '',
    minStock: '10',
    vatRate: '8',
    image: '',
  });

  const formatVND = (val) =>
    new Intl.NumberFormat('vi-VN').format(Math.round(val || 0)) + ' đ';

  // Live Barcode Canvas Preview
  useEffect(() => {
    if (modalOpen && barcodePreviewCanvasRef.current && formData.barcode) {
      try {
        JsBarcode(barcodePreviewCanvasRef.current, formData.barcode, {
          format: 'CODE128',
          lineColor: '#000000',
          width: 1.5,
          height: 35,
          displayValue: true,
          fontSize: 11,
        });
      } catch (err) {}
    }
  }, [modalOpen, formData.barcode]);

  // Label Print Canvas
  useEffect(() => {
    if (labelModalOpen && labelPrintCanvasRef.current && selectedLabelProduct) {
      try {
        JsBarcode(labelPrintCanvasRef.current, selectedLabelProduct.barcode, {
          format: 'CODE128',
          lineColor: '#000000',
          width: 1.5,
          height: 35,
          displayValue: true,
          fontSize: 11,
          margin: 0,
        });
      } catch (err) {}
    }
  }, [labelModalOpen, selectedLabelProduct]);

  // Filtering
  const filteredProducts = products.filter((prod) => {
    const matchCat = selectedCategory === 'all' || prod.category === selectedCategory;
    const matchSearch =
      !search ||
      prod.name.toLowerCase().includes(search.toLowerCase()) ||
      prod.barcode.includes(search);

    let matchStock = true;
    if (stockFilter === 'low') {
      matchStock = prod.stock > 0 && prod.stock <= prod.minStock;
    } else if (stockFilter === 'out') {
      matchStock = prod.stock <= 0;
    }

    return matchCat && matchSearch && matchStock;
  });

  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= p.minStock).length;
  const outOfStockCount = products.filter((p) => p.stock <= 0).length;

  const handleOpenAddModal = () => {
    requireManagerPin(() => {
      setEditingProduct(null);
      setFormData({
        name: '',
        barcode: '', // Mã vạch do người dùng nhập hoặc quét; không tự sinh mã giả
        category: 'instant_food',
        unit: 'Gói',
        costPrice: '',
        price: '',
        hasBoxUnit: false,
        boxUnitName: 'Thùng',
        boxConversion: '30',
        boxCostPrice: '',
        boxPrice: '',
        stock: '50',
        minStock: '10',
        vatRate: '8',
        image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=300&auto=format&fit=crop&q=80',
      });
      setModalOpen(true);
    });
  };

  const handleOpenEditModal = (prod) => {
    requireManagerPin(() => {
      setEditingProduct(prod);
      setFormData({
        name: prod.name,
        barcode: prod.barcode,
        category: prod.category,
        unit: prod.unit,
        costPrice: prod.costPrice.toString(),
        price: prod.price.toString(),
        hasBoxUnit: prod.hasBoxUnit || false,
        boxUnitName: prod.boxUnitName || 'Thùng',
        boxConversion: (prod.boxConversion || 24).toString(),
        boxCostPrice: (prod.boxCostPrice || '').toString(),
        boxPrice: (prod.boxPrice || '').toString(),
        stock: prod.stock.toString(),
        minStock: prod.minStock.toString(),
        vatRate: (prod.vatRate || 8).toString(),
        image: prod.image || '',
      });
      setModalOpen(true);
    });
  };

  // Quick Price Scan Trigger
  const handleScanToUpdatePrice = () => {
    requireManagerPin(() => {
      openScanner('inventory', (barcode) => {
        const found = products.find((p) => p.barcode === barcode);
        if (found) {
          setQuickPriceTarget(found);
          setInlinePriceData({
            costPrice: found.costPrice,
            price: found.price,
            boxPrice: found.boxPrice || (found.price * (found.boxConversion || 24)),
            boxCostPrice: found.boxCostPrice || (found.costPrice * (found.boxConversion || 24)),
          });
          setQuickPriceModal(true);
        } else {
          showToast(`Không tìm thấy sản phẩm có mã vạch: ${barcode}`, 'warning');
        }
      });
    });
  };

  const handleSaveQuickPrice = (e) => {
    e.preventDefault();
    if (!quickPriceTarget) return;
    updateProduct(quickPriceTarget.id, {
      costPrice: Number(inlinePriceData.costPrice) || 0,
      price: Number(inlinePriceData.price) || 0,
      boxPrice: Number(inlinePriceData.boxPrice) || 0,
      boxCostPrice: Number(inlinePriceData.boxCostPrice) || 0,
      priceUpdatedAt: new Date().toISOString(),
    });
    setQuickPriceModal(false);
    showToast(`Đã cập nhật giá mới cho: ${quickPriceTarget.name}`, 'success');
  };

  const handleSaveProduct = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      showToast('Vui lòng nhập tên và giá bán!', 'warning');
      return;
    }

    const payload = {
      ...formData,
      costPrice: Number(formData.costPrice) || 0,
      price: Number(formData.price) || 0,
      hasBoxUnit: formData.hasBoxUnit,
      boxUnitName: formData.boxUnitName,
      boxConversion: Number(formData.boxConversion) || 1,
      boxCostPrice: Number(formData.boxCostPrice) || (Number(formData.costPrice) * Number(formData.boxConversion)),
      boxPrice: Number(formData.boxPrice) || (Number(formData.price) * Number(formData.boxConversion)),
      stock: Number(formData.stock) || 0,
      minStock: Number(formData.minStock) || 5,
      vatRate: Number(formData.vatRate) || 8,
      priceUpdatedAt: new Date().toISOString(),
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, payload);
    } else {
      addProduct(payload);
    }
    setModalOpen(false);
  };

  // Inline Quick Edit handler
  const handleStartInlineEdit = (prod) => {
    requireManagerPin(() => {
      setInlineEditingId(prod.id);
      setInlinePriceData({
        costPrice: prod.costPrice,
        price: prod.price,
        boxPrice: prod.boxPrice || (prod.price * (prod.boxConversion || 24)),
        boxCostPrice: prod.boxCostPrice || (prod.costPrice * (prod.boxConversion || 24)),
      });
    });
  };

  const handleSaveInlineEdit = (prodId) => {
    updateProduct(prodId, {
      costPrice: Number(inlinePriceData.costPrice) || 0,
      price: Number(inlinePriceData.price) || 0,
      boxPrice: Number(inlinePriceData.boxPrice) || 0,
      boxCostPrice: Number(inlinePriceData.boxCostPrice) || 0,
      priceUpdatedAt: new Date().toISOString(),
    });
    setInlineEditingId(null);
    showToast('Đã cập nhật giá mới thành công!', 'success');
  };

  const handleDelete = (prod) => {
    requireManagerPin(() => {
      if (window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${prod.name}"?`)) {
        deleteProduct(prod.id);
      }
    });
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
            <Boxes size={26} color="var(--primary)" />
            <span>Kho Hàng, Cài Đặt Thùng & Sửa Giá Hàng Ngày</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', marginTop: '2px' }}>
            Cài đặt quy cách đóng thùng (mỗi thùng bao nhiêu cái), giá sỉ/lẻ và cập nhật giá nhanh theo ngày
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <button className="btn btn-success btn-lg" onClick={handleExportExcel} style={{ fontWeight: 800 }}>
            <FileSpreadsheet size={18} />
            <span>Xuất Excel (.xlsx)</span>
          </button>

          <button className="btn btn-secondary btn-lg" onClick={handleScanToUpdatePrice}>
            <ScanBarcode size={18} color="var(--primary)" />
            <span>Quét Đổi Giá</span>
          </button>

          <button className="btn btn-primary btn-lg" onClick={handleOpenAddModal}>
            <Plus size={18} />
            <span>Thêm Mặt Hàng</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          padding: '0.75rem',
          marginBottom: '1rem',
          display: 'flex',
          gap: '0.6rem',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div className="input-icon-wrapper" style={{ flex: 1, minWidth: '220px' }}>
          <Search size={16} className="input-icon" />
          <input
            type="text"
            className="form-control"
            style={{ fontSize: '0.85rem', padding: '0.45rem 0.75rem 0.45rem 2.2rem' }}
            placeholder="Tìm theo tên hàng, mã vạch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-control"
          style={{ width: 'auto', minWidth: '160px', fontSize: '0.85rem' }}
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          className="form-control"
          style={{ width: 'auto', minWidth: '140px', fontSize: '0.85rem' }}
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="low">Sắp hết hàng ({lowStockCount})</option>
          <option value="out">Đã hết hàng ({outOfStockCount})</option>
        </select>
      </div>

      {/* Products Table with Inline Price Editing & Box Conversion Display */}
      <div className="card">
        <div className="card-header" style={{ padding: '0.65rem 1rem' }}>
          <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>
            Bảng giá & Quy cách hàng hóa ({filteredProducts.length} mặt hàng)
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            💡 Nhấn nút "Sửa giá" để gõ thay đổi giá vốn/giá bán trực tiếp ngay trên bảng
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr
                style={{
                  background: 'var(--bg-secondary)',
                  borderBottom: '1px solid var(--border-color)',
                  textAlign: 'left',
                }}
              >
                <th style={{ padding: '0.6rem 0.75rem' }}>Mặt Hàng & Mã Vạch</th>
                <th style={{ padding: '0.6rem 0.5rem' }}>Quy Cách Thùng</th>
                <th style={{ padding: '0.6rem 0.5rem', textAlign: 'right' }}>Giá Vốn Lẻ (đ)</th>
                <th style={{ padding: '0.6rem 0.5rem', textAlign: 'right' }}>Giá Bán Lẻ (đ)</th>
                <th style={{ padding: '0.6rem 0.5rem', textAlign: 'right' }}>Giá Bán Thùng (đ)</th>
                <th style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>Tồn Kho</th>
                <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((prod) => {
                const isEditingThis = inlineEditingId === prod.id;
                const isOutOfStock = prod.stock <= 0;
                const isLowStock = prod.stock > 0 && prod.stock <= prod.minStock;

                // Box equivalent calculations
                const boxCount = prod.hasBoxUnit && prod.boxConversion
                  ? Math.floor(prod.stock / prod.boxConversion)
                  : null;
                const remainderUnits = prod.hasBoxUnit && prod.boxConversion
                  ? prod.stock % prod.boxConversion
                  : null;

                return (
                  <tr
                    key={prod.id}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      background: isEditingThis ? 'var(--primary-light)' : 'transparent',
                    }}
                  >
                    {/* Product Name & Barcode */}
                    <td style={{ padding: '0.55rem 0.75rem' }}>
                      <div style={{ fontWeight: 700 }}>{prod.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {prod.barcode} • {categories.find((c) => c.id === prod.category)?.name}
                      </div>
                    </td>

                    {/* Box Conversion Specification */}
                    <td style={{ padding: '0.55rem 0.5rem' }}>
                      {prod.hasBoxUnit ? (
                        <div>
                          <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                            <Package size={11} /> 1 {prod.boxUnitName || 'Thùng'} = {prod.boxConversion} {prod.unit}
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Bán lẻ ({prod.unit})</span>
                      )}
                    </td>

                    {/* Cost Price (Giá vốn lẻ) */}
                    <td style={{ padding: '0.55rem 0.5rem', textAlign: 'right' }}>
                      {isPinUnlocked ? (
                        isEditingThis ? (
                          <input
                            type="number"
                            className="form-control"
                            style={{ width: '90px', padding: '2px 4px', fontSize: '0.8rem', textAlign: 'right', display: 'inline-block' }}
                            value={inlinePriceData.costPrice}
                            onChange={(e) => setInlinePriceData({ ...inlinePriceData, costPrice: e.target.value })}
                          />
                        ) : (
                          formatVND(prod.costPrice)
                        )
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }} title="Mở khóa chủ tiệm để xem giá vốn">
                          ••••••
                        </span>
                      )}
                    </td>

                    {/* Retail Price (Giá bán lẻ) */}
                    <td style={{ padding: '0.55rem 0.5rem', textAlign: 'right', fontWeight: 800, color: 'var(--primary)' }}>
                      {isEditingThis ? (
                        <input
                          type="number"
                          className="form-control"
                          style={{ width: '90px', padding: '2px 4px', fontSize: '0.8rem', textAlign: 'right', fontWeight: 800, display: 'inline-block' }}
                          value={inlinePriceData.price}
                          onChange={(e) => setInlinePriceData({ ...inlinePriceData, price: e.target.value })}
                        />
                      ) : (
                        <span>{formatVND(prod.price)}/{prod.unit}</span>
                      )}
                    </td>

                    {/* Box Price (Giá bán sỉ nguyên thùng) */}
                    <td style={{ padding: '0.55rem 0.5rem', textAlign: 'right', fontWeight: 700, color: 'var(--success)' }}>
                      {prod.hasBoxUnit ? (
                        isEditingThis ? (
                          <input
                            type="number"
                            className="form-control"
                            style={{ width: '100px', padding: '2px 4px', fontSize: '0.8rem', textAlign: 'right', fontWeight: 800, display: 'inline-block' }}
                            value={inlinePriceData.boxPrice}
                            onChange={(e) => setInlinePriceData({ ...inlinePriceData, boxPrice: e.target.value })}
                          />
                        ) : (
                          <span>{formatVND(prod.boxPrice)}</span>
                        )
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>

                    {/* Stock Display (Lẻ + Thùng) */}
                    <td style={{ padding: '0.55rem 0.5rem', textAlign: 'center' }}>
                      <div style={{ fontWeight: 800 }}>
                        {isOutOfStock ? (
                          <span className="badge badge-danger">Hết hàng</span>
                        ) : isLowStock ? (
                          <span className="badge badge-warning">{prod.stock} {prod.unit}</span>
                        ) : (
                          <span className="badge badge-success">{prod.stock} {prod.unit}</span>
                        )}
                      </div>
                      {prod.hasBoxUnit && boxCount !== null && (
                        <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          (~{boxCount} thùng {remainderUnits > 0 ? `+ ${remainderUnits} lẻ` : ''})
                        </div>
                      )}
                    </td>

                    {/* Action Buttons */}
                    <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.25rem' }}>
                        {isEditingThis ? (
                          <button
                            className="btn btn-success btn-sm"
                            style={{ padding: '2px 8px' }}
                            onClick={() => handleSaveInlineEdit(prod.id)}
                            title="Lưu giá mới"
                          >
                            <Check size={14} />
                            <span>Lưu</span>
                          </button>
                        ) : (
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '2px 6px', fontSize: '0.75rem' }}
                            onClick={() => handleStartInlineEdit(prod)}
                            title="Chỉnh sửa nhanh giá"
                          >
                            <DollarSign size={13} color="var(--primary)" />
                            <span>Sửa giá</span>
                          </button>
                        )}

                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '2px 6px' }}
                          title="Sửa toàn bộ thông tin"
                          onClick={() => handleOpenEditModal(prod)}
                        >
                          <Edit2 size={13} />
                        </button>

                        <button
                          className="btn btn-danger btn-sm"
                          style={{ padding: '2px 6px' }}
                          title="Xóa sản phẩm"
                          onClick={() => handleDelete(prod)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* QUICK PRICE UPDATE MODAL (Quét mã đổi giá trong 2 giây) */}
      {quickPriceModal && quickPriceTarget && (
        <div className="modal-overlay" onClick={() => setQuickPriceModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <div className="modal-title">
                <DollarSign size={20} color="var(--primary)" />
                <span>Cập Nhật Giá Nhanh: {quickPriceTarget.name}</span>
              </div>
              <button className="btn btn-secondary btn-icon" onClick={() => setQuickPriceModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '8px', marginBottom: '0.85rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{quickPriceTarget.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mã: {quickPriceTarget.barcode} • ĐVT: {quickPriceTarget.unit}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                <div className="form-group">
                  <label className="form-label">Giá vốn lẻ mới (VNĐ):</label>
                  <input
                    type="number"
                    className="form-control"
                    defaultValue={quickPriceTarget.costPrice}
                    id="modal-quick-cost"
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Giá bán lẻ mới (VNĐ):</label>
                  <input
                    type="number"
                    className="form-control"
                    style={{ fontWeight: 800, color: 'var(--primary)' }}
                    defaultValue={quickPriceTarget.price}
                    id="modal-quick-price"
                  />
                </div>
              </div>

              {quickPriceTarget.hasBoxUnit && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginTop: '0.4rem' }}>
                  <div className="form-group">
                    <label className="form-label">Giá vốn 1 thùng (VNĐ):</label>
                    <input
                      type="number"
                      className="form-control"
                      defaultValue={quickPriceTarget.boxCostPrice}
                      id="modal-quick-box-cost"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Giá bán 1 thùng (VNĐ):</label>
                    <input
                      type="number"
                      className="form-control"
                      style={{ fontWeight: 800, color: 'var(--success)' }}
                      defaultValue={quickPriceTarget.boxPrice}
                      id="modal-quick-box-price"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setQuickPriceModal(false)}>Hủy</button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  const newCost = Number(document.getElementById('modal-quick-cost')?.value) || quickPriceTarget.costPrice;
                  const newPrice = Number(document.getElementById('modal-quick-price')?.value) || quickPriceTarget.price;
                  const newBoxCost = Number(document.getElementById('modal-quick-box-cost')?.value) || quickPriceTarget.boxCostPrice;
                  const newBoxPrice = Number(document.getElementById('modal-quick-box-price')?.value) || quickPriceTarget.boxPrice;

                  updateProduct(quickPriceTarget.id, {
                    costPrice: newCost,
                    price: newPrice,
                    boxCostPrice: newBoxCost,
                    boxPrice: newBoxPrice,
                    priceUpdatedAt: new Date().toISOString(),
                  });
                  setQuickPriceModal(false);
                  showToast(`Đã đổi giá ${quickPriceTarget.name} thành công!`, 'success');
                }}
              >
                Lưu Giá Mới
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL ADD / EDIT PRODUCT MODAL (Cài đặt quy cách thùng chi tiết) */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-dialog modal-dialog-lg" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <div className="modal-title">
                <Boxes size={20} color="var(--primary)" />
                <span>{editingProduct ? 'Chỉnh Sửa Sản Phẩm & Quy Cách Thùng' : 'Thêm Sản Phẩm Mới'}</span>
              </div>
              <button className="btn btn-secondary btn-icon" onClick={() => setModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Tên sản phẩm *:</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="VD: Mì Tôm Chua Cay Hảo Hảo..."
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  <div className="form-group">
                    <label className="form-label">Mã vạch (Barcode):</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Danh mục:</label>
                    <select
                      className="form-control"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      {categories.filter((c) => c.id !== 'all').map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* ĐƠN VỊ LẺ & GIÁ LẺ */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem' }}>
                  <div className="form-group">
                    <label className="form-label">Đơn vị lẻ cơ sở *:</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Gói, Lon, Chai, Cái..."
                      required
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Giá vốn 1 lẻ (VNĐ):</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="3800"
                      value={formData.costPrice}
                      onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Giá bán 1 lẻ (VNĐ) *:</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="5000"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                  </div>
                </div>

                {/* CÀI ĐẶT QUY CÁCH THÙNG / LỐC */}
                <div
                  style={{
                    background: 'var(--bg-secondary)',
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    marginTop: '0.5rem',
                    marginBottom: '0.85rem',
                  }}
                >
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, cursor: 'pointer', marginBottom: '0.6rem' }}>
                    <input
                      type="checkbox"
                      checked={formData.hasBoxUnit}
                      onChange={(e) => setFormData({ ...formData, hasBoxUnit: e.target.checked })}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                    />
                    <Package size={16} color="var(--primary)" />
                    <span>Hàng này có nhập / bán theo Thùng (Lốc / Két / Bao)</span>
                  </label>

                  {formData.hasBoxUnit && (
                    <div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '0.6rem' }}>
                        <div>
                          <label className="form-label">Tên đơn vị đóng thùng:</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Thùng, Lốc, Két..."
                            value={formData.boxUnitName}
                            onChange={(e) => setFormData({ ...formData, boxUnitName: e.target.value })}
                          />
                        </div>

                        <div>
                          <label className="form-label">Số lượng lẻ trong 1 thùng *:</label>
                          <input
                            type="number"
                            className="form-control"
                            placeholder="30"
                            value={formData.boxConversion}
                            onChange={(e) => {
                              const conv = Number(e.target.value) || 1;
                              setFormData({
                                ...formData,
                                boxConversion: e.target.value,
                                boxCostPrice: formData.costPrice ? (Number(formData.costPrice) * conv).toString() : formData.boxCostPrice,
                                boxPrice: formData.price ? (Number(formData.price) * conv * 0.95).toFixed(0) : formData.boxPrice,
                              });
                            }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                        <div>
                          <label className="form-label">Giá vốn 1 thùng (VNĐ):</label>
                          <input
                            type="number"
                            className="form-control"
                            placeholder="114000"
                            value={formData.boxCostPrice}
                            onChange={(e) => setFormData({ ...formData, boxCostPrice: e.target.value })}
                          />
                        </div>

                        <div>
                          <label className="form-label">Giá bán sỉ nguyên thùng (VNĐ):</label>
                          <input
                            type="number"
                            className="form-control"
                            style={{ fontWeight: 800, color: 'var(--success)' }}
                            placeholder="135000"
                            value={formData.boxPrice}
                            onChange={(e) => setFormData({ ...formData, boxPrice: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem' }}>
                  <div className="form-group">
                    <label className="form-label">Tồn kho hiện tại ({formData.unit}):</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tồn tối thiểu báo động:</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.minStock}
                      onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Thuế suất VAT:</label>
                    <select
                      className="form-control"
                      value={formData.vatRate}
                      onChange={(e) => setFormData({ ...formData, vatRate: e.target.value })}
                    >
                      <option value="8">8% (Phổ thông)</option>
                      <option value="10">10% (Bia/Thuốc lá)</option>
                      <option value="0">0%</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Lưu Thay Đổi' : 'Tạo Mặt Hàng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
