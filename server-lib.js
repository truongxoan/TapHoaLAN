// Pure helpers for TapHoaLAN server. No Express, no filesystem here so that
// node:test can exercise the same logic the live server uses.
// NOTE: this file must not contain any real shop secret, PIN, bank account,
// phone number or tax ID. The factory PIN lives only as a hashed value
// created at first run (see server.js); tests use their own test PINs.
import crypto from 'node:crypto';

export const QUICK_ITEMS = [
  { id: 'QUICK-Q-01', name: 'Trứng Gà Tươi', price: 3000, unit: 'Quả' },
  { id: 'QUICK-Q-02', name: 'Túi Đá Lạnh (Bi)', price: 5000, unit: 'Túi' },
  { id: 'QUICK-Q-03', name: 'Bánh Mì Ổ Nóng', price: 5000, unit: 'Ổ' },
  { id: 'QUICK-Q-04', name: 'Thuốc Lá Lẻ (Điếu)', price: 2000, unit: 'Điếu' },
  { id: 'QUICK-Q-05', name: 'Bật Lửa Ga', price: 5000, unit: 'Cái' },
  { id: 'QUICK-Q-06', name: 'Kẹo Cao Su / Kẹo Lẻ', price: 1000, unit: 'Cái' },
  { id: 'QUICK-Q-07', name: 'Bao Xốp / Túi Nilon', price: 2000, unit: 'Bao' },
];

export function isFiniteNumber(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

export function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

// --- PIN hashing (scrypt, no native deps) ---
export function hashPin(pin) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(pin), salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

export function verifyPin(pin, stored) {
  if (!stored || typeof stored !== 'string') return false;
  const parts = stored.split(':');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const [, salt, expected] = parts;
  try {
    const actual = crypto.scryptSync(String(pin), salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}

export function isValidPinFormat(pin) {
  return typeof pin === 'string' && /^[0-9]{4,6}$/.test(pin);
}

// --- Rate limiter: max `maxAttempts` failures per key in `windowMs`, then lock ---
export class RateLimiter {
  constructor(maxAttempts = 5, windowMs = 5 * 60 * 1000, lockMs = 5 * 60 * 1000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
    this.lockMs = lockMs;
    this.map = new Map(); // key -> { failures: [ts], lockedUntil: ts|null }
  }
  isLocked(key, now = Date.now()) {
    const rec = this.map.get(key);
    return !!rec && !!rec.lockedUntil && now < rec.lockedUntil;
  }
  recordFailure(key, now = Date.now()) {
    let rec = this.map.get(key);
    if (!rec) { rec = { failures: [], lockedUntil: null }; this.map.set(key, rec); }
    rec.failures = rec.failures.filter((t) => now - t < this.windowMs);
    rec.failures.push(now);
    if (rec.failures.length >= this.maxAttempts) rec.lockedUntil = now + this.lockMs;
    return rec;
  }
  recordSuccess(key) { this.map.delete(key); }
}

// --- Sequential codes, persisted in counters inside the DB file ---
export function ensureCounters(db) {
  if (!db.counters || typeof db.counters !== 'object') db.counters = {};
  if (!db.counters.orderSeqByDate || typeof db.counters.orderSeqByDate !== 'object') db.counters.orderSeqByDate = {};
  if (!Number.isInteger(db.counters.productSeq)) db.counters.productSeq = 0;
  return db.counters;
}

export function dateKey(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

export function nextOrderCode(db, date = new Date()) {
  const counters = ensureCounters(db);
  const key = dateKey(date);
  const next = (counters.orderSeqByDate[key] || 0) + 1;
  counters.orderSeqByDate[key] = next;
  return `HD-${key}-${String(next).padStart(4, '0')}`;
}

export function nextProductCode(db) {
  const counters = ensureCounters(db);
  counters.productSeq += 1;
  return `SP-${String(counters.productSeq).padStart(4, '0')}`;
}

// --- Validation ---
export function validateProductInput(p) {
  const errors = [];
  if (!p || !isNonEmptyString(p.name)) errors.push('Tên sản phẩm là bắt buộc');
  if (p.price !== undefined && (!isFiniteNumber(Number(p.price)) || Number(p.price) < 0)) errors.push('Giá bán phải >= 0');
  if (p.costPrice !== undefined && (!isFiniteNumber(Number(p.costPrice)) || Number(p.costPrice) < 0)) errors.push('Giá vốn phải >= 0');
  if (p.stock !== undefined && (!isFiniteNumber(Number(p.stock)) || Number(p.stock) < 0)) errors.push('Tồn kho phải >= 0');
  if (p.barcode !== undefined && p.barcode !== null && p.barcode !== '' && typeof p.barcode !== 'string') errors.push('Mã vạch phải là chuỗi');
  if (typeof p.barcode === 'string' && p.barcode.length > 64) errors.push('Mã vạch quá dài');
  return errors;
}

export function validateShiftInput(s) {
  const errors = [];
  if (!s || typeof s !== 'object') return ['Thiếu báo cáo chốt ca'];
  for (const f of ['totalCash', 'totalCard', 'totalDebt', 'expectedCash', 'actualCash', 'difference']) {
    if (s[f] !== undefined && s[f] !== null && s[f] !== '' && !isFiniteNumber(Number(s[f]))) errors.push(`${f} phải là số`);
  }
  if (s.shiftDate !== undefined && s.shiftDate !== null && s.shiftDate !== '' && Number.isNaN(Date.parse(s.shiftDate))) errors.push('Ngày chốt ca không hợp lệ');
  return errors;
}

export function validateLoyaltyInput({ pointsChange, spentAmount }) {
  const errors = [];
  if (pointsChange !== undefined && pointsChange !== null) {
    const v = Number(pointsChange);
    if (!Number.isFinite(v) || Math.abs(v) > 100000) errors.push('Điểm tích lũy thay đổi không hợp lệ');
  }
  if (spentAmount !== undefined && spentAmount !== null) {
    const v = Number(spentAmount);
    if (!Number.isFinite(v) || v < 0 || v > 1e12) errors.push('Số tiền chi tiêu không hợp lệ');
  }
  return errors;
}

// Server-side order recalculation. Returns {order} or {error}.
// products: DB products. quickItems: allowlist above.
// discount: client discount amount, accepted only if 0 <= discount <= subtotal.
export function recalculateOrder(db, orderInput) {
  if (!orderInput || !Array.isArray(orderInput.items) || orderInput.items.length === 0) {
    return { error: 'Đơn hàng trống hoặc không có mặt hàng' };
  }
  const products = db.products || [];
  const lines = [];
  let subtotal = 0;
  for (const item of orderInput.items) {
    if (!item || !isNonEmptyString(item.productId)) return { error: 'Mặt hàng thiếu mã sản phẩm' };
    const qty = Number(item.qty);
    if (!Number.isFinite(qty) || qty <= 0 || !Number.isInteger(qty)) {
      return { error: `Số lượng không hợp lệ cho mặt hàng ${item.name || item.productId}` };
    }
    const mult = item.unitMultiplier === undefined || item.unitMultiplier === null ? 1 : Number(item.unitMultiplier);
    if (!Number.isFinite(mult) || mult <= 0) return { error: `Hệ số đơn vị không hợp lệ cho ${item.name || item.productId}` };
    const required = qty * mult;
    let unitPrice;
    let stock = null;
    const quick = QUICK_ITEMS.find((q) => q.id === item.productId);
    if (quick) {
      unitPrice = quick.price;
    } else {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod) return { error: `Không tìm thấy sản phẩm: ${item.name || item.productId}` };
      unitPrice = mult > 1 && prod.boxPrice !== undefined && prod.boxPrice !== null && prod.boxPrice !== ''
        ? Number(prod.boxPrice)
        : Number(prod.price);
      if (!Number.isFinite(unitPrice) || unitPrice < 0) return { error: `Giá sản phẩm không hợp lệ: ${prod.name}` };
      stock = Number(prod.stock) || 0;
      if (stock < required) {
        return { error: `Không đủ tồn kho: ${prod.name} — còn ${stock} ${prod.unit || ''}, cần ${required}`, productName: prod.name, available: stock, required };
      }
    }
    const lineTotal = unitPrice * qty;
    subtotal += lineTotal;
    lines.push({ ...item, price: unitPrice, total: lineTotal, _requiredBaseUnits: required, _isQuick: !!quick });
  }
  const discountRaw = orderInput.discount === undefined || orderInput.discount === null ? 0 : Number(orderInput.discount);
  if (!Number.isFinite(discountRaw) || discountRaw < 0 || discountRaw > subtotal) {
    return { error: 'Chiết khấu không hợp lệ' };
  }
  const total = subtotal - discountRaw;
  // If the client sent a total, it must match the server total exactly.
  if (orderInput.total !== undefined && orderInput.total !== null && orderInput.total !== '') {
    if (Number(orderInput.total) !== total) {
      return { error: `Tổng tiền không khớp: máy chủ tính ${total} đ, đơn gửi lên ${Number(orderInput.total)} đ` };
    }
  }
  return { lines, subtotal, discount: discountRaw, total };
}

// --- Per-device history + daily ledger (pure, testable) ---
// Dates are Vietnam calendar dates (Asia/Ho_Chi_Minh) so a bill paid at
// 23:30 local time still belongs to the same local day, not the UTC day.
export function vnDateString(ts) {
  const d = ts instanceof Date ? ts : new Date(ts || Date.now());
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

export function orderDateString(order) {
  return vnDateString(order?.syncedAt || order?.createdAt || order?.date || Date.now());
}

// Mask a customer phone for admin lists: only the last 2 digits survive.
export function maskPhone(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length <= 2) return '****';
  return `***${digits.slice(-2)}`;
}

export function maskOrderForHistory(order) {
  if (!order || typeof order !== 'object') return order;
  return { ...order, customerPhone: order.customerPhone ? maskPhone(order.customerPhone) : order.customerPhone };
}

export function ensureDevices(db) {
  if (!Array.isArray(db.devices)) db.devices = [];
  return db.devices;
}

export function ensureDailyNotes(db) {
  if (!db.dailyNotes || typeof db.dailyNotes !== 'object' || Array.isArray(db.dailyNotes)) db.dailyNotes = {};
  return db.dailyNotes;
}

// Update the persistent device registry from one saved order. Never
// changes prices/totals — it only aggregates what the order already has.
export function recordDeviceOrder(db, order) {
  const devices = ensureDevices(db);
  const id = order?.deviceId || 'unknown';
  const name = order?.deviceName || 'Thiết bị không rõ tên';
  const now = order?.syncedAt || new Date().toISOString();
  let dev = devices.find((d) => d.id === id);
  if (!dev) {
    dev = { id, name, lastSeen: now, orderCount: 0, totalRevenue: 0, lastOrderCode: '' };
    devices.push(dev);
  }
  if (name && name !== 'Thiết bị không rõ tên') dev.name = name;
  dev.lastSeen = now;
  dev.orderCount += 1;
  dev.totalRevenue += Number(order?.total) || 0;
  dev.lastOrderCode = order?.code || order?.id || dev.lastOrderCode;
  return dev;
}

export function isValidDailyDate(date) {
  return typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date));
}

// Computed from persisted orders only — never hand-edited, so the summary
// cannot drift from the bills. totalRevenue counts paid orders only;
// totalOrderValue counts every order (including pending VietQR / debt).
export function computeDailySummary(orders, date) {
  const dayOrders = (orders || []).filter((o) => orderDateString(o) === date);
  const byPaymentMethod = {};
  const byPaymentStatus = {};
  const byDeviceMap = new Map();
  let totalRevenue = 0;
  let totalOrderValue = 0;
  for (const o of dayOrders) {
    const total = Number(o.total) || 0;
    totalOrderValue += total;
    const paid = o.paymentStatus === 'paid';
    if (paid) totalRevenue += total;
    const m = o.paymentMethod || 'cash';
    byPaymentMethod[m] = byPaymentMethod[m] || { orders: 0, value: 0, paidValue: 0 };
    byPaymentMethod[m].orders += 1;
    byPaymentMethod[m].value += total;
    if (paid) byPaymentMethod[m].paidValue += total;
    const s = o.paymentStatus || 'unknown';
    byPaymentStatus[s] = byPaymentStatus[s] || { orders: 0, value: 0 };
    byPaymentStatus[s].orders += 1;
    byPaymentStatus[s].value += total;
    const did = o.deviceId || 'unknown';
    const d = byDeviceMap.get(did) || { deviceId: did, deviceName: o.deviceName || 'Thiết bị không rõ tên', orders: 0, value: 0 };
    d.orders += 1;
    d.value += total;
    byDeviceMap.set(did, d);
  }
  return {
    date,
    totalOrders: dayOrders.length,
    totalRevenue,
    totalOrderValue,
    byPaymentMethod,
    byPaymentStatus,
    byDevice: Array.from(byDeviceMap.values()).sort((a, b) => b.value - a.value),
    orderCodes: dayOrders.map((o) => o.code || o.id).filter(Boolean),
  };
}

export const BACKUP_INTERVAL_MINUTES_OPTIONS = [0, 15, 30, 60, 180, 360, 720, 1440];
export const BACKUP_MAX_BACKUPS_OPTIONS = [12, 24, 48, 96];
export const DEFAULT_BACKUP_SETTINGS = { enabled: true, intervalMinutes: 60, maxBackups: 24, mirrorDir: '' };

export function isAbsolutePath(p) {
  if (typeof p !== 'string') return false;
  if (p.startsWith('/')) return true;
  if (/^[A-Za-z]:[\\/]/.test(p)) return true;
  if (p.startsWith('\\\\')) return true;
  return false;
}

// Mirror must not live inside the main backups folder, or every mirror
// copy would be seen as a new backup and could loop.
export function isMirrorDirSafe(mirrorDir, backupsDir) {
  if (!mirrorDir) return true;
  if (!isAbsolutePath(mirrorDir)) return false;
  if (!backupsDir) return true;
  const norm = (s) => s.replace(/\\/g, '/').replace(/\/+$/, '');
  const m = norm(mirrorDir);
  const b = norm(backupsDir);
  if (m === b) return false;
  if (m.startsWith(b + '/')) return false;
  return true;
}

export function ensureBackupSettings(db) {
  const raw = db && typeof db === 'object' && db.backupSettings && typeof db.backupSettings === 'object' && !Array.isArray(db.backupSettings)
    ? db.backupSettings : {};
  const settings = {
    enabled: raw.enabled !== undefined ? Boolean(raw.enabled) : DEFAULT_BACKUP_SETTINGS.enabled,
    intervalMinutes: BACKUP_INTERVAL_MINUTES_OPTIONS.includes(Number(raw.intervalMinutes))
      ? Number(raw.intervalMinutes) : DEFAULT_BACKUP_SETTINGS.intervalMinutes,
    maxBackups: BACKUP_MAX_BACKUPS_OPTIONS.includes(Number(raw.maxBackups))
      ? Number(raw.maxBackups) : DEFAULT_BACKUP_SETTINGS.maxBackups,
    mirrorDir: typeof raw.mirrorDir === 'string' ? raw.mirrorDir.trim() : '',
  };
  if (db && typeof db === 'object') db.backupSettings = settings;
  return settings;
}

// Validate a client-supplied backup settings object. Returns
// { settings, errors }; settings is null when validation fails.
export function validateBackupSettings(input, backupsDir) {
  const errors = [];
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { settings: null, errors: ['Cấu hình sao lưu không hợp lệ'] };
  }
  const enabled = input.enabled !== undefined ? Boolean(input.enabled) : true;
  const intervalMinutes = Number(input.intervalMinutes);
  if (!BACKUP_INTERVAL_MINUTES_OPTIONS.includes(intervalMinutes)) {
    errors.push('Chu kỳ sao lưu không hợp lệ (chọn 0 để tắt, hoặc 15/30/60/180/360/720/1440 phút)');
  }
  const maxBackups = Number(input.maxBackups);
  if (!BACKUP_MAX_BACKUPS_OPTIONS.includes(maxBackups)) {
    errors.push('Số bản sao lưu giữ lại không hợp lệ (chọn 12/24/48/96)');
  }
  const mirrorDir = typeof input.mirrorDir === 'string' ? input.mirrorDir.trim() : '';
  if (mirrorDir) {
    if (!isAbsolutePath(mirrorDir)) errors.push('Thư mục dự phòng phải là đường dẫn tuyệt đối (ví dụ D:\\SaoLuu hoặc /mnt/usb/saoluu)');
    else if (!isMirrorDirSafe(mirrorDir, backupsDir)) errors.push('Thư mục dự phòng không được nằm trong thư mục sao lưu chính');
  }
  if (errors.length) return { settings: null, errors };
  return { settings: { enabled, intervalMinutes, maxBackups, mirrorDir }, errors: [] };
}

export function sanitizeDb(db) {
  if (!db || typeof db !== 'object') return db;
  const { managerPin, managerPinHash, ...rest } = db;
  return rest;
}

export function sanitizeBackupFilename(filename) {
  if (!isNonEmptyString(filename)) return null;
  const base = filename.split('/').pop().split('\\').pop();
  if (!/^backup_[A-Za-z0-9_.-]+\.json$/.test(base)) return null;
  if (base.includes('..')) return null;
  return base;
}

export function detectImageType(buffer) {
  if (!buffer || buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg';
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return 'png';
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  return null;
}
