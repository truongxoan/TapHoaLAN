import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'node:crypto';
import { fileURLToPath } from 'url';
import {
  hashPin,
  verifyPin,
  isValidPinFormat,
  RateLimiter,
  ensureCounters,
  nextOrderCode,
  nextProductCode,
  validateProductInput,
  validateShiftInput,
  validateLoyaltyInput,
  recalculateOrder,
  sanitizeDb,
  ensureDevices,
  ensureDailyNotes,
  recordDeviceOrder,
  computeDailySummary,
  maskOrderForHistory,
  isValidDailyDate,
  orderDateString,
  sanitizeBackupFilename,
  detectImageType,
  isNonEmptyString,
} from './server-lib.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Env overrides: PORT, LAN_IP, and data/backup/upload dirs (used by smoke
// tests to run against a copy of the DB instead of the repo data file).
const PORT = Number(process.env.PORT) || 5000;
const LAN_IP_OVERRIDE = process.env.LAN_IP || '';
const DATA_DIR = process.env.TAPHOALAN_DATA_DIR || path.join(__dirname, 'data');
const DB_FILE = process.env.TAPHOALAN_DB_FILE || path.join(DATA_DIR, 'store_database.json');
const BACKUPS_DIR = process.env.TAPHOALAN_BACKUPS_DIR || path.join(__dirname, 'backups');
const UPLOADS_DIR = process.env.TAPHOALAN_UPLOADS_DIR || path.join(__dirname, 'uploads');
const LAST_GOOD_FILE = path.join(DATA_DIR, 'store_database.last-good.json');

[DATA_DIR, BACKUPS_DIR, UPLOADS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Factory PIN: only used to seed a brand-new database. It is hashed
// immediately (scrypt) and never returned by any API. Change it on first
// run via Cài đặt > Đổi PIN (requires the old PIN + manager token).
// The value is intentionally not documented in README or logs.
const FACTORY_PIN = '1233';

// --- LAN IP selection: prefer Wi-Fi / non-virtual interfaces ---
function getLocalIpAddress() {
  if (LAN_IP_OVERRIDE) return LAN_IP_OVERRIDE;
  const interfaces = os.networkInterfaces();
  const candidates = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        const lower = name.toLowerCase();
        const isVirtual = /virtual|veth|docker|br-|vmnet|hamachi|tailscale|tun|tap|wsl/.test(lower);
        candidates.push({ name, address: iface.address, score: isVirtual ? 1 : 0 });
      }
    }
  }
  candidates.sort((a, b) => a.score - b.score);
  return candidates.length ? candidates[0].address : 'localhost';
}

// --- Default DB (sample shop info is intentionally blank placeholders) ---
const DEFAULT_DATABASE = {
  taxSettings: {
    storeName: 'CHƯA CÀI ĐẶT',
    storeSlogan: '',
    storeAddress: '',
    storePhone: '',
    storeTaxId: '',
    defaultVatRate: 8,
    priceIncludesTax: true,
    bankName: '',
    bankId: '',
    accountNo: '',
    accountName: '',
    invoiceFooterNote: '',
  },
  printerSettings: { autoPrintOnCheckout: false, paperSize: 'k80', printFooter: true },
  products: [],
  orders: [],
  purchases: [],
  suppliers: [],
  debts: [],
  shifts: [],
  loyaltyCustomers: [],
  devices: [],
  dailyNotes: {},
  counters: { orderSeqByDate: {}, productSeq: 0 },
};

// --- Atomic storage + corrupt quarantine ---
let dbCorruptError = null;

function atomicWrite(file, content) {
  const tmp = `${file}.tmp-${process.pid}-${crypto.randomBytes(6).toString('hex')}`;
  const fd = fs.openSync(tmp, 'w');
  try {
    fs.writeFileSync(fd, content, 'utf-8');
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
  fs.renameSync(tmp, file);
}

function readDatabase() {
  if (!fs.existsSync(DB_FILE)) return null;
  let raw;
  try {
    raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_DATABASE,
      ...parsed,
      taxSettings: { ...DEFAULT_DATABASE.taxSettings, ...(parsed.taxSettings || {}) },
      counters: parsed.counters || { orderSeqByDate: {}, productSeq: 0 },
      // Backwards compatible: old DB files predate the device registry
      // and the daily ledger, so they migrate to empty collections.
      devices: Array.isArray(parsed.devices) ? parsed.devices : [],
      dailyNotes: parsed.dailyNotes && typeof parsed.dailyNotes === 'object' && !Array.isArray(parsed.dailyNotes) ? parsed.dailyNotes : {},
    };
  } catch (err) {
    // Quarantine the corrupt file, never overwrite it with defaults.
    try {
      const stamp = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
      const dest = path.join(DATA_DIR, `store_database.corrupt-${stamp}.json`);
      fs.renameSync(DB_FILE, dest);
      dbCorruptError = `File dữ liệu bị hỏng và đã được giữ lại tại ${path.basename(dest)}. Hãy khôi phục từ bản sao lưu gần nhất, đừng ghi đè lên file hỏng.`;
      console.error('[DB] ' + dbCorruptError);
    } catch (e) {
      dbCorruptError = `File dữ liệu bị hỏng: ${err.message}`;
      console.error('[DB]', e);
    }
    throw new Error(dbCorruptError);
  }
}

function loadOrInitDatabase() {
  if (!fs.existsSync(DB_FILE)) {
    const fresh = { ...DEFAULT_DATABASE, managerPinHash: hashPin(FACTORY_PIN) };
    atomicWrite(DB_FILE, JSON.stringify(fresh, null, 2));
    atomicWrite(LAST_GOOD_FILE, JSON.stringify(fresh, null, 2));
    return fresh;
  }
  const db = readDatabase();
  // Migrate legacy plaintext PIN -> scrypt hash, then drop the plaintext field.
  if (db.managerPin || !db.managerPinHash) {
    const pinToHash = db.managerPin || FACTORY_PIN;
    db.managerPinHash = hashPin(pinToHash);
    delete db.managerPin;
    const toWrite = { ...db };
    atomicWrite(DB_FILE, JSON.stringify(toWrite, null, 2));
    atomicWrite(LAST_GOOD_FILE, JSON.stringify(toWrite, null, 2));
  }
  return db;
}

function writeDatabase(data) {
  // data is the full DB object to persist (already merged by caller).
  const clean = { ...data };
  delete clean.managerPin;
  atomicWrite(DB_FILE, JSON.stringify(clean, null, 2));
  atomicWrite(LAST_GOOD_FILE, JSON.stringify(clean, null, 2));
  return true;
}

// Serialize all DB writes through one promise queue (mutex).
let writeQueue = Promise.resolve();
function runExclusive(fn) {
  const run = writeQueue.then(fn, fn);
  writeQueue = run.catch(() => {});
  return run;
}

try {
  loadOrInitDatabase();
} catch (e) {
  console.error('[DB] Không khởi tạo được database:', e.message);
}

// --- Manager auth (in-memory tokens, 8h) + rate limiting ---
const managerTokens = new Map(); // token -> expiresAt
const pinLimiter = new RateLimiter(5, 5 * 60 * 1000, 5 * 60 * 1000);

function issueManagerToken() {
  const token = crypto.randomBytes(32).toString('hex');
  managerTokens.set(token, Date.now() + 8 * 60 * 60 * 1000);
  return token;
}
function isManagerToken(token) {
  if (!token) return false;
  const exp = managerTokens.get(token);
  if (!exp) return false;
  if (Date.now() > exp) { managerTokens.delete(token); return false; }
  return true;
}
function requireManager(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!isManagerToken(token)) return res.status(401).json({ error: 'Cần quyền chủ tiệm (mã PIN đã hết hạn hoặc chưa đăng nhập)' });
  req.managerToken = token;
  return next();
}
function clientIp(req) {
  return (req.socket.remoteAddress || 'unknown').replace('::ffff:', '');
}

// --- Body parsing: 2MB default, upload route gets its own 5MB parser ---
app.use((req, res, next) => {
  if (req.path === '/api/upload-photo') return next();
  return express.json({ limit: '2mb' })(req, res, next);
});
app.use((req, res, next) => {
  if (req.path === '/api/upload-photo') return next();
  return express.urlencoded({ extended: true, limit: '2mb' })(req, res, next);
});
app.use('/uploads', express.static(UPLOADS_DIR));

// --- Backups ---
const MAX_BACKUPS = 24;
function rotateBackups() {
  try {
    const files = fs.readdirSync(BACKUPS_DIR).filter((f) => f.endsWith('.json'))
      .map((f) => ({ f, mtime: fs.statSync(path.join(BACKUPS_DIR, f)).mtimeMs }))
      .sort((a, b) => a.mtime - b.mtime);
    while (files.length > MAX_BACKUPS) {
      const old = files.shift();
      fs.unlinkSync(path.join(BACKUPS_DIR, old.f));
    }
  } catch { /* best effort */ }
}
function createDiskBackup(data, label = 'Tự động sao lưu định kỳ') {
  const now = new Date();
  const stamp = `${now.toISOString().replace(/[:T]/g, '_').slice(0, 19)}_${now.getMilliseconds()}_${crypto.randomBytes(3).toString('hex')}`;
  const filename = `backup_${stamp}.json`;
  const payload = { label, createdAt: now.toISOString(), sizeBytes: JSON.stringify(data).length, data: sanitizeDb(data) };
  atomicWrite(path.join(BACKUPS_DIR, filename), JSON.stringify(payload, null, 2));
  rotateBackups();
  console.log(`[AUTO-BACKUP] Đã tạo bản sao lưu: ${filename}`);
  return filename;
}
setInterval(() => {
  try {
    const db = readDatabase();
    if (db) createDiskBackup(db, 'Tự động sao lưu theo giờ');
  } catch (e) { console.error('[AUTO-BACKUP]', e.message); }
}, 3600000);

// --- WebSocket ---
const activeClientsMap = new Map();
// The public device list must never leak order totals, customer phones,
// IPs or user agents — only the identity a shopkeeper needs to see.
function publicDevices() {
  return Array.from(activeClientsMap.values()).map((d) => ({
    id: d.id, name: d.name, deviceType: d.deviceType, connectedAt: d.connectedAt, lastActive: d.lastActive || null,
  }));
}
function broadcast(msgObject, senderWs = null) {
  const msgString = JSON.stringify(msgObject);
  wss.clients.forEach((client) => {
    if (client !== senderWs && client.readyState === WebSocket.OPEN) client.send(msgString);
  });
}
function broadcastConnectedDevices() {
  const payload = JSON.stringify({ type: 'DEVICES_LIST', devices: Array.from(activeClientsMap.values()) });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) client.send(payload);
  });
}
function broadcastPublicDb(senderWs = null) {
  try {
    const db = readDatabase();
    broadcast({ type: 'DATA_UPDATED', payload: sanitizeDb(db) }, senderWs);
  } catch { /* DB corrupt: do not broadcast */ }
}

wss.on('connection', (ws, req) => {
  const cleanIp = (req.socket.remoteAddress || '127.0.0.1').replace('::ffff:', '');
  const userAgent = req.headers['user-agent'] || '';
  const isMobile = /mobile|iphone|android|ipad/i.test(userAgent);
  const deviceId = `DEV-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
  const deviceInfo = {
    id: deviceId,
    name: isMobile ? 'Điện thoại (Đang nhận)' : 'Máy Tính Thu Ngân',
    ip: cleanIp,
    deviceType: isMobile ? 'phone' : 'computer',
    userAgent: userAgent.slice(0, 40),
    connectedAt: new Date().toISOString(),
  };
  activeClientsMap.set(ws, deviceInfo);
  ws.isManager = false;
  try {
    const currentData = readDatabase();
    ws.send(JSON.stringify({ type: 'DATA_UPDATED', payload: sanitizeDb(currentData) }));
  } catch (e) {
    ws.send(JSON.stringify({ type: 'DB_ERROR', error: String(e.message) }));
  }
  broadcastConnectedDevices();

  ws.on('message', (message) => {
    try {
      const parsed = JSON.parse(message.toString());
      if (parsed.type === 'AUTH_MANAGER') {
        ws.isManager = isManagerToken(parsed.token);
        ws.send(JSON.stringify({ type: 'AUTH_RESULT', isManager: ws.isManager }));
        return;
      }
      if (parsed.type === 'REGISTER_DEVICE') {
        const current = activeClientsMap.get(ws) || deviceInfo;
        activeClientsMap.set(ws, { ...current, id: parsed.deviceId || current.id, name: parsed.deviceName || current.name, deviceType: parsed.deviceType || current.deviceType, lastActive: new Date().toISOString() });
        broadcastConnectedDevices();
      } else if (parsed.type === 'DATA_UPDATE' || parsed.type === 'SETTINGS_UPDATE') {
        if (!ws.isManager) {
          ws.send(JSON.stringify({ type: 'AUTH_REQUIRED', error: 'Cần quyền chủ tiệm để đồng bộ dữ liệu' }));
          return;
        }
        runExclusive(async () => {
          const db = readDatabase();
          if (parsed.type === 'DATA_UPDATE') {
            const payload = { ...parsed.payload };
            delete payload.managerPin; delete payload.managerPinHash;
            const merged = { ...db, ...payload, taxSettings: { ...db.taxSettings, ...(payload.taxSettings || {}) } };
            writeDatabase(merged);
            broadcast({ type: 'DATA_UPDATED', payload: sanitizeDb(merged) }, ws);
          } else {
            db.taxSettings = { ...db.taxSettings, ...parsed.payload };
            writeDatabase(db);
            broadcast({ type: 'DATA_UPDATED', payload: sanitizeDb(db) });
          }
        }).catch((e) => ws.send(JSON.stringify({ type: 'DB_ERROR', error: String(e.message) })));
      } else if (parsed.type === 'REMOTE_SCAN') {
        broadcast({ type: 'REMOTE_SCAN_EVENT', barcode: parsed.barcode });
      }
    } catch (e) { console.error('WebSocket parse error:', e); }
  });
  ws.on('close', () => { activeClientsMap.delete(ws); broadcastConnectedDevices(); });
});

// --- REST API ---
app.get('/api/info', (req, res) => {
  const lanIp = getLocalIpAddress();
  res.json({ status: 'online', serverType: 'SmartPOS Local LAN Server', lanIp, port: PORT, fullUrl: `http://${lanIp}:${PORT}`, connectedDevices: activeClientsMap.size, devices: publicDevices() });
});
app.get('/api/devices', (req, res) => res.json({ success: true, count: activeClientsMap.size, devices: publicDevices() }));

app.get('/api/data', (req, res) => {
  try { res.json({ success: true, data: sanitizeDb(readDatabase()) }); }
  catch (e) { res.status(500).json({ error: String(e.message) }); }
});

// Manager login
app.post('/api/auth/manager', (req, res) => {
  const ip = clientIp(req);
  if (pinLimiter.isLocked(ip)) return res.status(429).json({ error: 'Nhập sai PIN quá nhiều lần. Vui lòng thử lại sau 5 phút.' });
  const { pin } = req.body || {};
  if (!isValidPinFormat(pin)) { pinLimiter.recordFailure(ip); return res.status(401).json({ error: 'Mã PIN không đúng' }); }
  let db;
  try { db = readDatabase(); } catch (e) { return res.status(500).json({ error: String(e.message) }); }
  if (verifyPin(pin, db.managerPinHash)) {
    pinLimiter.recordSuccess(ip);
    const token = issueManagerToken();
    return res.json({ success: true, token, expiresInSeconds: 8 * 60 * 60 });
  }
  pinLimiter.recordFailure(ip);
  return res.status(401).json({ error: 'Mã PIN không đúng' });
});
app.post('/api/auth/logout', (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (token) managerTokens.delete(token);
  return res.json({ success: true });
});

app.post('/api/settings', requireManager, async (req, res) => {
  const newSettings = req.body;
  if (!newSettings || typeof newSettings !== 'object') return res.status(400).json({ error: 'Missing settings payload' });
  try {
    await runExclusive(async () => {
      const db = readDatabase();
      db.taxSettings = { ...db.taxSettings, ...newSettings };
      writeDatabase(db);
      broadcast({ type: 'DATA_UPDATED', payload: sanitizeDb(db) });
      res.json({ success: true, settings: db.taxSettings });
    });
  } catch (e) { res.status(500).json({ error: String(e.message) }); }
});

app.post('/api/pin/update', requireManager, async (req, res) => {
  const { oldPin, pin, newPin } = req.body || {};
  const nextPin = newPin || pin;
  if (!isValidPinFormat(oldPin) || !isValidPinFormat(nextPin)) return res.status(400).json({ error: 'Mã PIN cũ và mã PIN mới phải là 4-6 chữ số' });
  try {
    await runExclusive(async () => {
      const db = readDatabase();
      if (!verifyPin(oldPin, db.managerPinHash)) { res.status(401).json({ error: 'Mã PIN cũ không đúng' }); return; }
      db.managerPinHash = hashPin(nextPin);
      delete db.managerPin;
      writeDatabase(db);
      console.log('[LAN PIN] Đã đổi mã PIN chủ tiệm (giá trị không được ghi log)');
      res.json({ success: true });
    });
  } catch (e) { if (!res.headersSent) res.status(500).json({ error: String(e.message) }); }
});

app.post('/api/shifts/save', requireManager, async (req, res) => {
  const shiftReport = req.body;
  const errors = validateShiftInput(shiftReport);
  if (errors.length) return res.status(400).json({ error: errors.join('; ') });
  try {
    await runExclusive(async () => {
      const db = readDatabase();
      const shifts = db.shifts || [];
      const saved = { ...shiftReport, id: `CA-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-4)}`, savedAt: new Date().toISOString() };
      shifts.unshift(saved);
      db.shifts = shifts;
      writeDatabase(db);
      broadcast({ type: 'DATA_UPDATED', payload: sanitizeDb(db) });
      res.json({ success: true, shift: saved, shifts });
    });
  } catch (e) { if (!res.headersSent) res.status(500).json({ error: String(e.message) }); }
});

app.post('/api/loyalty/save', async (req, res) => {
  const { customer, pointsChange, spentAmount } = req.body || {};
  if (!customer || !customer.name) return res.status(400).json({ error: 'Missing customer info' });
  const errors = validateLoyaltyInput({ pointsChange, spentAmount });
  if (errors.length) return res.status(400).json({ error: errors.join('; ') });
  try {
    await runExclusive(async () => {
      const db = readDatabase();
      const loyalty = db.loyaltyCustomers || [];
      const existingIdx = loyalty.findIndex((c) => c.id === customer.id || (c.phoneLast4 && customer.phoneLast4 && c.phoneLast4 === customer.phoneLast4 && c.name.toLowerCase() === customer.name.toLowerCase()));
      let updatedCustomer;
      if (existingIdx >= 0) {
        const current = loyalty[existingIdx];
        updatedCustomer = { ...current, name: customer.name || current.name, phoneLast4: customer.phoneLast4 || current.phoneLast4, fullPhone: customer.fullPhone || current.fullPhone || '', points: Math.max(0, (current.points || 0) + Number(pointsChange || 0)), totalSpent: (current.totalSpent || 0) + Number(spentAmount || 0), lastVisit: new Date().toISOString() };
        loyalty[existingIdx] = updatedCustomer;
      } else {
        updatedCustomer = { id: `LOYALTY-${Date.now()}`, name: customer.name, phoneLast4: customer.phoneLast4 || '', fullPhone: customer.fullPhone || '', points: Math.max(0, Number(pointsChange || 0)), totalSpent: Number(spentAmount || 0), createdAt: new Date().toISOString(), lastVisit: new Date().toISOString() };
        loyalty.unshift(updatedCustomer);
      }
      db.loyaltyCustomers = loyalty;
      writeDatabase(db);
      broadcast({ type: 'DATA_UPDATED', payload: sanitizeDb(db) });
      res.json({ success: true, customer: updatedCustomer, loyaltyCustomers: loyalty });
    });
  } catch (e) { if (!res.headersSent) res.status(500).json({ error: String(e.message) }); }
});

app.post('/api/sync', requireManager, async (req, res) => {
  const newData = req.body;
  if (!newData || typeof newData !== 'object') return res.status(400).json({ error: 'Missing data payload' });
  try {
    await runExclusive(async () => {
      const db = readDatabase();
      const payload = { ...newData };
      delete payload.managerPin; delete payload.managerPinHash;
      const merged = { ...db, ...payload, taxSettings: { ...db.taxSettings, ...(payload.taxSettings || {}) } };
      writeDatabase(merged);
      broadcast({ type: 'DATA_UPDATED', payload: sanitizeDb(merged) });
      res.json({ success: true, message: 'Dữ liệu đã được đồng bộ trong mạng LAN!' });
    });
  } catch (e) { if (!res.headersSent) res.status(500).json({ error: String(e.message) }); }
});

// Upload photo: staff-allowed, but strictly validated (single file, 5MB, magic bytes)
app.post('/api/upload-photo', express.json({ limit: '5mb' }), (req, res) => {
  const { imageBase64 } = req.body || {};
  if (!imageBase64 || typeof imageBase64 !== 'string') return res.status(400).json({ error: 'Missing image data' });
  try {
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    if (buffer.length > 5 * 1024 * 1024) return res.status(400).json({ error: 'Ảnh vượt quá 5MB' });
    const type = detectImageType(buffer);
    if (!type) return res.status(400).json({ error: 'Định dạng ảnh không hợp lệ (chỉ JPG/PNG/WebP)' });
    const safeFilename = `prod_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${type}`;
    fs.writeFileSync(path.join(UPLOADS_DIR, safeFilename), buffer);
    const lanIp = getLocalIpAddress();
    res.json({ success: true, photoUrl: `http://${lanIp}:${PORT}/uploads/${safeFilename}` });
  } catch (err) { res.status(500).json({ error: 'Failed to save product photo' }); }
});

app.get('/api/products/by-barcode/:barcode', (req, res) => {
  try {
    const db = readDatabase();
    const barcode = decodeURIComponent(req.params.barcode);
    const product = (db.products || []).find((p) => p.barcode === barcode);
    if (!product) return res.json({ success: true, found: false, barcode });
    return res.json({ success: true, found: true, product });
  } catch (e) { res.status(500).json({ error: String(e.message) }); }
});

app.post('/api/products/save', async (req, res) => {
  const productData = req.body;
  const errors = validateProductInput(productData);
  if (errors.length) return res.status(400).json({ error: errors.join('; ') });
  // Price/cost changes require a manager token.
  const changesPriceOrCost = ['price', 'costPrice', 'boxPrice', 'boxCostPrice'].some((f) => productData[f] !== undefined);
  if (changesPriceOrCost) {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!isManagerToken(token)) return res.status(401).json({ error: 'Đổi giá/giá vốn cần quyền chủ tiệm' });
  }
  try {
    await runExclusive(async () => {
      const db = readDatabase();
      ensureCounters(db);
      const products = db.products || [];
      const existingIdx = products.findIndex((p) => p.id === productData.id || (productData.barcode && p.barcode === productData.barcode));
      let savedProduct;
      if (existingIdx >= 0) {
        savedProduct = { ...products[existingIdx], ...productData, updatedAt: new Date().toISOString() };
        if (!savedProduct.code) savedProduct.code = savedProduct.id;
        products[existingIdx] = savedProduct;
      } else {
        const code = nextProductCode(db);
        savedProduct = { ...productData, id: productData.id || code, code: productData.id || code, createdAt: new Date().toISOString() };
        // Never invent a random barcode as a product id.
        if (!savedProduct.barcode) savedProduct.barcode = '';
        products.unshift(savedProduct);
      }
      db.products = products;
      writeDatabase(db);
      broadcast({ type: 'DATA_UPDATED', payload: sanitizeDb(db) });
      broadcast({ type: 'PRODUCT_SAVED_ALERT', product: savedProduct });
      res.json({ success: true, product: savedProduct, data: sanitizeDb(db) });
    });
  } catch (e) { if (!res.headersSent) res.status(500).json({ error: String(e.message) }); }
});

app.post('/api/order', async (req, res) => {
  const { order, deviceName, deviceId } = req.body || {};
  if (!order || !Array.isArray(order.items) || order.items.length === 0) return res.status(400).json({ error: 'Invalid order payload' });
  try {
    await runExclusive(async () => {
      const db = readDatabase();
      ensureCounters(db);
      // Duplicate order id (client-sent) rejection. The server code is the
      // stored id, so also remember the client-sent id for idempotency.
      if (order.id && (db.orders || []).some((o) => o.id === order.id || o.clientOrderId === order.id)) {
        res.status(409).json({ error: 'Đơn hàng đã tồn tại (trùng mã)' });
        return;
      }
      const calc = recalculateOrder(db, order);
      if (calc.error) { res.status(400).json({ error: calc.error }); return; }
      const products = db.products || [];
      // Deduct stock from server prices (quick items have no stock).
      for (const line of calc.lines) {
        if (line._isQuick) continue;
        const prod = products.find((p) => p.id === line.productId);
        if (prod) prod.stock = (Number(prod.stock) || 0) - line._requiredBaseUnits;
      }
      const code = nextOrderCode(db);
      const paymentMethod = order.paymentMethod || 'cash';
      const paymentStatus = paymentMethod === 'vietqr' ? 'pending_vietqr'
        : paymentMethod === 'debt' ? 'debt' : 'paid';
      const nowIso = new Date().toISOString();
      const processedOrder = {
        ...order,
        clientOrderId: order.id || null,
        items: calc.lines.map(({ _requiredBaseUnits, _isQuick, ...rest }) => rest),
        subtotal: calc.subtotal,
        discount: calc.discount,
        total: calc.total,
        id: code,
        code,
        paymentMethod,
        paymentStatus,
        deviceId: deviceId || order.deviceId || 'unknown',
        deviceName: deviceName || order.deviceName || 'Quầy thu ngân',
        createdAt: order.createdAt || nowIso,
        syncedAt: nowIso,
      };
      // Per-device history: the registry lives in the same atomic DB write
      // as the order itself, so a bill and its device attribution can
      // never be saved separately.
      ensureDevices(db);
      recordDeviceOrder(db, processedOrder);
      // Keep invoice/debt notes simple: code == id for new orders.
      const orders = db.orders || [];
      orders.unshift(processedOrder);
      let debts = db.debts || [];
      if (paymentMethod === 'debt') {
        const custName = order.customerName || 'Khách nợ';
        const existing = debts.find((d) => d.customerName.toLowerCase() === custName.toLowerCase());
        const now = new Date().toISOString();
        if (existing) {
          debts = debts.map((d) => d.id === existing.id ? { ...d, phone: order.customerPhone || d.phone, totalDebt: d.totalDebt + calc.total, remainingDebt: d.remainingDebt + calc.total, history: [...(d.history || []), { id: `DH-${Date.now()}`, date: now, type: 'borrow', amount: calc.total, note: `Đơn ${code} từ ${deviceName || 'Điện thoại'}` }] } : d);
        } else {
          debts.unshift({ id: `NO-${String(debts.length + 1).padStart(3, '0')}`, customerName: custName, phone: order.customerPhone || '', totalDebt: calc.total, remainingDebt: calc.total, createdAt: now, history: [{ id: `DH-${Date.now()}`, date: now, type: 'borrow', amount: calc.total, note: `Đơn ${code} từ ${deviceName || 'Điện thoại'}` }] });
        }
      }
      db.products = products;
      db.orders = orders;
      db.debts = debts;
      writeDatabase(db);
      broadcast({ type: 'DATA_UPDATED', payload: sanitizeDb(db) });
      broadcast({ type: 'NEW_ORDER_ALERT', order: processedOrder });
      res.json({ success: true, order: processedOrder, data: sanitizeDb(db) });
    });
  } catch (e) { if (!res.headersSent) res.status(500).json({ error: String(e.message) }); }
});

// --- Per-device bill history + daily admin ledger (manager only) ---
// The history is read from the CENTRAL server DB, not from any single
// browser's localStorage, so admin sees bills from every device.
app.get('/api/devices/history', requireManager, (req, res) => {
  try {
    const db = readDatabase();
    ensureDevices(db);
    const { device, from, to, q } = req.query || {};
    let orders = (db.orders || []).slice();
    if (device) orders = orders.filter((o) => (o.deviceId || 'unknown') === device);
    if (from && isValidDailyDate(from)) orders = orders.filter((o) => orderDateString(o) >= from);
    if (to && isValidDailyDate(to)) orders = orders.filter((o) => orderDateString(o) <= to);
    if (q) {
      const needle = String(q).toLowerCase();
      orders = orders.filter((o) => String(o.code || o.id || '').toLowerCase().includes(needle));
    }
    orders.sort((a, b) => new Date(b.syncedAt || b.createdAt || 0) - new Date(a.syncedAt || a.createdAt || 0));
    res.json({ success: true, devices: db.devices, total: orders.length, orders: orders.map(maskOrderForHistory) });
  } catch (e) { res.status(500).json({ error: String(e.message) }); }
});

app.get('/api/daily-notes', requireManager, (req, res) => {
  try {
    const db = readDatabase();
    const notes = ensureDailyNotes(db);
    const date = req.query?.date;
    if (!isValidDailyDate(date)) return res.status(400).json({ error: 'Ngày phải có dạng YYYY-MM-DD' });
    res.json({ success: true, date, note: notes[date]?.note || '', updatedAt: notes[date]?.updatedAt || null });
  } catch (e) { res.status(500).json({ error: String(e.message) }); }
});

app.post('/api/daily-notes', requireManager, async (req, res) => {
  const { date, note } = req.body || {};
  if (!isValidDailyDate(date)) return res.status(400).json({ error: 'Ngày phải có dạng YYYY-MM-DD' });
  if (typeof note !== 'string' || note.length > 2000) return res.status(400).json({ error: 'Ghi chú phải là chuỗi, tối đa 2000 ký tự' });
  try {
    await runExclusive(async () => {
      const db = readDatabase();
      const notes = ensureDailyNotes(db);
      notes[date] = { note, updatedAt: new Date().toISOString(), updatedBy: 'manager' };
      writeDatabase(db);
      res.json({ success: true, date, note, updatedAt: notes[date].updatedAt });
    });
  } catch (e) { if (!res.headersSent) res.status(500).json({ error: String(e.message) }); }
});

app.get('/api/daily-summary', requireManager, (req, res) => {
  try {
    const db = readDatabase();
    const date = req.query?.date;
    if (!isValidDailyDate(date)) return res.status(400).json({ error: 'Ngày phải có dạng YYYY-MM-DD' });
    res.json({ success: true, summary: computeDailySummary(db.orders || [], date) });
  } catch (e) { res.status(500).json({ error: String(e.message) }); }
});

// VietQR manual confirmation (manager only, no automatic bank check)
app.post('/api/orders/:id/confirm-vietqr', requireManager, async (req, res) => {
  const orderId = decodeURIComponent(req.params.id);
  const { amount, code } = req.body || {};
  try {
    await runExclusive(async () => {
      const db = readDatabase();
      const order = (db.orders || []).find((o) => o.id === orderId || o.code === orderId);
      if (!order) { res.status(404).json({ error: 'Không tìm thấy đơn hàng' }); return; }
      if (order.paymentMethod !== 'vietqr') { res.status(400).json({ error: 'Đơn này không phải thanh toán VietQR' }); return; }
      if (order.paymentStatus === 'paid') { res.status(400).json({ error: 'Đơn đã được xác nhận thanh toán trước đó' }); return; }
      if (amount !== undefined && Number(amount) !== Number(order.total)) { res.status(400).json({ error: `Số tiền xác nhận (${amount}) không khớp tổng đơn (${order.total})` }); return; }
      if (code !== undefined && code !== '' && code !== order.code && code !== order.id) { res.status(400).json({ error: 'Mã đơn xác nhận không khớp' }); return; }
      order.paymentStatus = 'paid';
      order.confirmedAt = new Date().toISOString();
      order.confirmedBy = 'manager';
      writeDatabase(db);
      broadcast({ type: 'DATA_UPDATED', payload: sanitizeDb(db) });
      res.json({ success: true, order });
    });
  } catch (e) { if (!res.headersSent) res.status(500).json({ error: String(e.message) }); }
});

app.post('/api/scan', (req, res) => {
  const { barcode, deviceName } = req.body || {};
  if (barcode) { broadcast({ type: 'REMOTE_SCAN_EVENT', barcode, deviceName }); res.json({ success: true, barcode }); }
  else res.status(400).json({ error: 'Missing barcode' });
});

app.get('/api/backups', requireManager, (req, res) => {
  try {
    const files = fs.readdirSync(BACKUPS_DIR).filter((f) => f.endsWith('.json'));
    const backups = files.map((filename) => { const stats = fs.statSync(path.join(BACKUPS_DIR, filename)); return { filename, createdAt: stats.mtime.toISOString(), sizeKb: Math.round(stats.size / 1024) }; }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, backups });
  } catch { res.status(500).json({ error: 'Failed to list backups' }); }
});
app.post('/api/backups/create', requireManager, (req, res) => {
  try {
    const db = readDatabase();
    createDiskBackup(db, req.body?.label || 'Sao lưu thủ công tại quầy');
    res.json({ success: true, message: 'Đã tạo bản sao lưu trên ổ cứng!' });
  } catch (e) { res.status(500).json({ error: String(e.message) }); }
});
app.get('/api/backups/:filename/download', requireManager, (req, res) => {
  const safe = sanitizeBackupFilename(req.params.filename);
  if (!safe) return res.status(400).json({ error: 'Tên file sao lưu không hợp lệ' });
  const filePath = path.join(BACKUPS_DIR, safe);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Không tìm thấy bản sao lưu' });
  return res.download(filePath, safe);
});
app.post('/api/backups/restore', requireManager, async (req, res) => {
  const safe = sanitizeBackupFilename(req.body?.filename);
  if (!safe) return res.status(400).json({ error: 'Tên file sao lưu không hợp lệ' });
  const filePath = path.join(BACKUPS_DIR, safe);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Không tìm thấy bản sao lưu' });
  try {
    await runExclusive(async () => {
      const current = readDatabase();
      // Back up current DB before restoring.
      createDiskBackup(current, 'Sao lưu trước khi khôi phục');
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      const payload = parsed.data || parsed;
      if (!payload || typeof payload !== 'object' || !Array.isArray(payload.products) || !Array.isArray(payload.orders)) {
        res.status(400).json({ error: 'File sao lưu không đúng định dạng (cần products và orders)' });
        return;
      }
      delete payload.managerPin; delete payload.managerPinHash;
      // Preserve the current PIN hash (restore must not resurrect an old PIN).
      const restored = { ...current, ...payload, managerPinHash: current.managerPinHash, taxSettings: { ...current.taxSettings, ...(payload.taxSettings || {}) } };
      writeDatabase(restored);
      broadcast({ type: 'DATA_UPDATED', payload: sanitizeDb(restored) });
      res.json({ success: true, message: 'Đã khôi phục dữ liệu từ bản sao lưu' });
    });
  } catch (e) { if (!res.headersSent) res.status(500).json({ error: String(e.message) }); }
});

// Serve frontend static build if exists
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res) => { res.sendFile(path.join(distPath, 'index.html')); });
}

server.listen(PORT, '0.0.0.0', () => {
  const lanIp = getLocalIpAddress();
  console.log('================================================================');
  console.log('SMARTPOS LOCAL LAN SERVER ĐANG HOẠT ĐỘNG');
  console.log('================================================================');
  console.log(`Máy tính cục bộ:   http://localhost:${PORT}`);
  console.log(`Điện thoại qua WiFi LAN: http://${lanIp}:${PORT}`);
  console.log('Lưu ý: server chạy HTTP trên LAN nội bộ — chỉ dùng trong Wi-Fi tin cậy, tách mạng khách.');
  console.log('================================================================');
});
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Cổng ${PORT} đã bị chiếm bởi chương trình khác. Hãy tắt chương trình đó hoặc chạy lại với PORT khác, ví dụ: PORT=5001 npm start`);
    process.exit(1);
  }
  console.error('Lỗi server:', err);
  process.exit(1);
});
