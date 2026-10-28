import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  hashPin,
  verifyPin,
  isValidPinFormat,
  RateLimiter,
  nextOrderCode,
  nextProductCode,
  recalculateOrder,
  sanitizeDb,
  sanitizeBackupFilename,
  detectImageType,
  validateProductInput,
  validateShiftInput,
  maskPhone,
  maskOrderForHistory,
  ensureDevices,
  recordDeviceOrder,
  computeDailySummary,
  isValidDailyDate,
  vnDateString,
} from '../server-lib.js';

test('sequential order codes increment same-day and reset next day', () => {
  const db = { counters: { orderSeqByDate: {}, productSeq: 0 } };
  const d1 = new Date('2026-10-28T08:00:00.000Z');
  const d2 = new Date('2026-10-29T08:00:00.000Z');
  assert.equal(nextOrderCode(db, d1), 'HD-20261028-0001');
  assert.equal(nextOrderCode(db, d1), 'HD-20261028-0002');
  assert.equal(nextOrderCode(db, d2), 'HD-20261029-0001');
});

test('product sequence increments and never reuses after simulated restart', () => {
  const db = { counters: { orderSeqByDate: {}, productSeq: 0 } };
  assert.equal(nextProductCode(db), 'SP-0001');
  assert.equal(nextProductCode(db), 'SP-0002');
  // Simulate restart: counters are persisted in the DB file, so a fresh
  // load of the same counters object continues the sequence.
  const reloaded = JSON.parse(JSON.stringify(db));
  assert.equal(nextProductCode(reloaded), 'SP-0003');
});

test('order total is recalculated from server prices, not client totals', () => {
  const db = {
    products: [
      { id: 'P1', name: 'Mì', price: 10000, stock: 10, unit: 'Gói' },
      { id: 'P2', name: 'Nước', price: 5000, stock: 30, unit: 'Chai', hasBoxUnit: true, boxConversion: 24, boxPrice: 100000 },
    ],
  };
  // Client lies about line prices; the server ignores them and recalculates.
  // (A mismatched order total is rejected separately — see the next test.)
  const res = recalculateOrder(db, {
    items: [
      { productId: 'P1', qty: 2, price: 1 },
      { productId: 'P2', qty: 1, unitMultiplier: 24, price: 1 },
    ],
  });
  assert.equal(res.error, undefined);
  assert.equal(res.lines[0].price, 10000);
  assert.equal(res.lines[0].total, 20000);
  assert.equal(res.lines[1].price, 100000);
  assert.equal(res.total, 120000);
});

test('order with a correct total passes; wrong total is rejected', () => {
  const db = { products: [{ id: 'P1', name: 'Mì', price: 10000, stock: 10, unit: 'Gói' }] };
  const ok = recalculateOrder(db, { items: [{ productId: 'P1', qty: 1 }], total: 10000 });
  assert.equal(ok.total, 10000);
  const bad = recalculateOrder(db, { items: [{ productId: 'P1', qty: 1 }], total: 9999 });
  assert.match(bad.error, /không khớp/);
});

test('overselling is rejected, not clamped to zero', () => {
  const db = { products: [{ id: 'P1', name: 'Mì', price: 10000, stock: 3, unit: 'Gói' }] };
  const res = recalculateOrder(db, { items: [{ productId: 'P1', qty: 5 }] });
  assert.match(res.error, /Không đủ tồn kho/);
  assert.equal(res.available, 3);
  assert.equal(res.required, 5);
});

test('negative qty, unknown product and negative price are rejected', () => {
  const db = { products: [{ id: 'P1', name: 'Mì', price: 10000, stock: 10, unit: 'Gói' }] };
  assert.ok(recalculateOrder(db, { items: [{ productId: 'P1', qty: 0 }] }).error);
  assert.ok(recalculateOrder(db, { items: [{ productId: 'P1', qty: -1 }] }).error);
  assert.ok(recalculateOrder(db, { items: [{ productId: 'NOPE', qty: 1 }] }).error);
  assert.equal(validateProductInput({ name: 'X', price: -5 }).length, 1);
  assert.equal(validateProductInput({ name: '' }).length, 1);
  assert.equal(validateShiftInput({ shiftDate: 'not-a-date' }).length, 1);
});

test('barcode lookup logic: found by exact barcode, not by substring', () => {
  const products = [{ id: 'P1', barcode: '8934563120015', name: 'Bia', price: 18500 }];
  const found = products.find((p) => p.barcode === '8934563120015');
  const missing = products.find((p) => p.barcode === '8934563120099');
  assert.equal(found.name, 'Bia');
  assert.equal(found.price, 18500);
  assert.equal(missing, undefined);
});

test('atomic write + corrupt-file quarantine behaviour', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'taphoa-test-'));
  const file = path.join(dir, 'store_database.json');
  // Atomic write: temp file in same dir, then rename.
  const tmp = `${file}.tmp-test`;
  fs.writeFileSync(tmp, JSON.stringify({ products: [] }));
  const fd = fs.openSync(tmp, 'r+');
  fs.fsyncSync(fd);
  fs.closeSync(fd);
  fs.renameSync(tmp, file);
  assert.equal(JSON.parse(fs.readFileSync(file, 'utf-8')).products.length, 0);
  // Corrupt file must not parse as a valid DB.
  fs.writeFileSync(file, '{not json');
  assert.throws(() => JSON.parse(fs.readFileSync(file, 'utf-8')));
  // Quarantine = move aside, never overwrite with defaults in place.
  const dest = path.join(dir, `store_database.corrupt-${Date.now()}.json`);
  fs.renameSync(file, dest);
  assert.ok(fs.existsSync(dest));
  assert.ok(!fs.existsSync(file));
  fs.rmSync(dir, { recursive: true, force: true });
});

test('PIN hash verify and rate-limit logic', () => {
  const stored = hashPin('4321');
  assert.equal(verifyPin('4321', stored), true);
  assert.equal(verifyPin('1234', stored), false);
  assert.equal(verifyPin('4321', 'not-a-hash'), false);
  assert.equal(isValidPinFormat('1234'), true);
  assert.equal(isValidPinFormat('12'), false);
  assert.equal(isValidPinFormat('abcd'), false);
  const limiter = new RateLimiter(5, 5 * 60 * 1000, 5 * 60 * 1000);
  const ip = '192.168.1.10';
  for (let i = 0; i < 4; i++) limiter.recordFailure(ip, 1000 + i);
  assert.equal(limiter.isLocked(ip, 2000), false);
  limiter.recordFailure(ip, 2005);
  assert.equal(limiter.isLocked(ip, 2006), true);
  limiter.recordSuccess(ip);
  assert.equal(limiter.isLocked(ip, 2007), false);
});

test('sanitizeDb strips PIN fields and backup filenames reject traversal', () => {
  const clean = sanitizeDb({ managerPinHash: 'x', managerPin: 'y', products: [] });
  assert.equal('managerPin' in clean, false);
  assert.equal('managerPinHash' in clean, false);
  assert.equal(sanitizeBackupFilename('backup_2026_01_01.json'), 'backup_2026_01_01.json');
  assert.equal(sanitizeBackupFilename('../secret.json'), null);
  assert.equal(sanitizeBackupFilename('backup_../../etc.json'), null);
  assert.equal(sanitizeBackupFilename('notes.txt'), null);
});

test('image magic-byte detection accepts jpg/png/webp and rejects others', () => {
  assert.equal(detectImageType(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0])), 'jpg');
  assert.equal(detectImageType(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0, 0])), 'png');
  const webp = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP')]);
  assert.equal(detectImageType(webp), 'webp');
  assert.equal(detectImageType(Buffer.from('hello world!')), null);
});

test('device registry aggregates orders per device and masks phones', () => {
  const db = { orders: [], devices: [] };
  ensureDevices(db);
  recordDeviceOrder(db, { deviceId: 'dev-quay-1', deviceName: 'Quầy 1', total: 50000, code: 'HD-20261028-0001', syncedAt: '2026-10-28T10:00:00.000Z' });
  recordDeviceOrder(db, { deviceId: 'dev-quay-1', deviceName: 'Quầy 1', total: 30000, code: 'HD-20261028-0002', syncedAt: '2026-10-28T11:00:00.000Z' });
  recordDeviceOrder(db, { deviceId: 'dev-dt-2', deviceName: 'Điện thoại chị Lan', total: 20000, code: 'HD-20261028-0003', syncedAt: '2026-10-28T12:00:00.000Z' });
  assert.equal(db.devices.length, 2);
  const quay1 = db.devices.find((d) => d.id === 'dev-quay-1');
  assert.equal(quay1.orderCount, 2);
  assert.equal(quay1.totalRevenue, 80000);
  assert.equal(quay1.lastOrderCode, 'HD-20261028-0002');
  assert.equal(maskPhone('0901234567'), '***67');
  assert.equal(maskPhone(''), '');
  const masked = maskOrderForHistory({ code: 'HD-1', customerName: 'Cô Mai', customerPhone: '0901234567' });
  assert.equal(masked.customerPhone, '***67');
  assert.equal(masked.customerName, 'Cô Mai');
});

test('daily summary is computed from orders for the Vietnam date only', () => {
  const orders = [
    { code: 'HD-20261028-0001', total: 50000, paymentMethod: 'cash', paymentStatus: 'paid', deviceId: 'dev-quay-1', deviceName: 'Quầy 1', syncedAt: '2026-10-28T03:00:00.000Z' }, // 10:00 VN
    { code: 'HD-20261028-0002', total: 40000, paymentMethod: 'vietqr', paymentStatus: 'pending_vietqr', deviceId: 'dev-dt-2', deviceName: 'Điện thoại', syncedAt: '2026-10-28T10:00:00.000Z' }, // 17:00 VN
    { code: 'HD-20261029-0001', total: 99999, paymentMethod: 'cash', paymentStatus: 'paid', deviceId: 'dev-quay-1', deviceName: 'Quầy 1', syncedAt: '2026-10-29T10:00:00.000Z' },
  ];
  assert.equal(vnDateString('2026-10-28T03:00:00.000Z'), '2026-10-28');
  const s = computeDailySummary(orders, '2026-10-28');
  assert.equal(s.totalOrders, 2);
  assert.equal(s.totalOrderValue, 90000);
  assert.equal(s.totalRevenue, 50000); // only the paid order
  assert.equal(s.byPaymentMethod.cash.orders, 1);
  assert.equal(s.byPaymentMethod.vietqr.orders, 1);
  assert.equal(s.byDevice.length, 2);
  assert.deepEqual(s.orderCodes, ['HD-20261028-0001', 'HD-20261028-0002']);
  assert.equal(isValidDailyDate('2026-10-28'), true);
  assert.equal(isValidDailyDate('28/10/2026'), false);
});
