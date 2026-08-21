import React from 'react';
import {
  Egg,
  Flame,
  ShoppingBag,
  Sparkles,
  Coffee,
  Plus,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

const DEFAULT_QUICK_ITEMS = [
  { id: 'Q-01', name: 'Trứng Gà Tươi', price: 3000, costPrice: 2200, unit: 'Quả', emoji: '🥚' },
  { id: 'Q-02', name: 'Túi Đá Lạnh (Bi)', price: 5000, costPrice: 2000, unit: 'Túi', emoji: '🧊' },
  { id: 'Q-03', name: 'Bánh Mì Ổ Nóng', price: 5000, costPrice: 3500, unit: 'Ổ', emoji: '🥖' },
  { id: 'Q-04', name: 'Thuốc Lá Lẻ (Điếu)', price: 2000, costPrice: 1200, unit: 'Điếu', emoji: '🚬' },
  { id: 'Q-05', name: 'Bật Lửa Ga', price: 5000, costPrice: 3000, unit: 'Cái', emoji: '🔥' },
  { id: 'Q-06', name: 'Kẹo Cao Su / Kẹo Lẻ', price: 1000, costPrice: 500, unit: 'Cái', emoji: '🍬' },
  { id: 'Q-07', name: 'Bao Xốp / Túi Nilon', price: 2000, costPrice: 1000, unit: 'Bao', emoji: '🛍️' },
];

export const QuickNoBarcodeBar = () => {
  const { addToCart, showToast } = useStore();

  const formatVND = (val) =>
    new Intl.NumberFormat('vi-VN').format(Math.round(val || 0)) + ' đ';

  const handleAddQuickItem = (item) => {
    const virtualProduct = {
      id: `QUICK-${item.id}`,
      barcode: `NO_BARCODE_${item.id}`,
      name: item.name,
      unit: item.unit,
      price: item.price,
      costPrice: item.costPrice,
      stock: 9999, // Fast non-barcode items always available
      minStock: 10,
      vatRate: 8,
      image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=150',
    };

    addToCart(virtualProduct, 1);
    showToast(`+1 ${item.name}`, 'info');
  };

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '0.45rem 0.65rem',
        marginBottom: '0.75rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        overflowX: 'auto',
      }}
    >
      <div
        style={{
          fontSize: '0.75rem',
          fontWeight: 800,
          color: 'var(--primary)',
          whiteSpace: 'nowrap',
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
          paddingRight: '4px',
          borderRight: '1px solid var(--border-color)',
        }}
      >
        <Sparkles size={13} />
        <span>Hàng Không Mã:</span>
      </div>

      <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto' }}>
        {DEFAULT_QUICK_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className="btn btn-secondary btn-sm"
            style={{
              padding: '2px 7px',
              fontSize: '0.75rem',
              borderRadius: 'var(--radius-full)',
              whiteSpace: 'nowrap',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
            }}
            onClick={() => handleAddQuickItem(item)}
            title={`Bán nhanh 1 ${item.unit} ${item.name} (${formatVND(item.price)})`}
          >
            <span>{item.emoji}</span>
            <span>{item.name}</span>
            <span style={{ fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
              {formatVND(item.price)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
