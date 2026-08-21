import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 5000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'store_database.json');
const BACKUPS_DIR = path.join(__dirname, 'backups');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Ensure all persistent local directories exist
[DATA_DIR, BACKUPS_DIR, UPLOADS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));

// Helper: Get Local LAN IPv4 Address
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Initial Default Database Schema
const DEFAULT_DATABASE = {
  managerPin: '1233',
  taxSettings: {
    storeName: 'TẠP HÓA THỊNH PHÁT - BÁCH HÓA GIA ĐÌNH',
    storeSlogan: 'Hàng Tiêu Dùng - Nước Giải Khát - Mì Gia Vị Giá Sỉ & Lẻ',
    storeAddress: 'Số 128 Đường Lê Lợi, Phường 4, Quận Gò Vấp, TP. Hồ Chí Minh',
    storePhone: '0908 123 456 - 028 3899 9999',
    storeTaxId: '0318998822-001',
    defaultVatRate: 8,
    priceIncludesTax: true,
    bankName: 'MBBank (Ngân Hàng Quân Đội)',
    bankId: 'MB',
    accountNo: '0908123456',
    accountName: 'NGUYEN THI KIM HOA',
    invoiceFooterNote: 'Cảm ơn quý khách đã mua sắm tại Tạp Hóa Thịnh Phát!',
  },
  printerSettings: {
    autoPrintOnCheckout: false,
    paperSize: 'k80',
    printFooter: true,
  },
  products: [],
  orders: [],
  purchases: [],
  suppliers: [],
  debts: [],
  shifts: [],
  loyaltyCustomers: [
    {
      id: 'LOYALTY-001',
      name: 'Chị Lan',
      phoneLast4: '8899',
      fullPhone: '0903 888 899',
      points: 125,
      totalSpent: 1250000,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'LOYALTY-002',
      name: 'Anh Hùng',
      phoneLast4: '3344',
      fullPhone: '0912 333 344',
      points: 210,
      totalSpent: 2100000,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'LOYALTY-003',
      name: 'Cô Mai',
      phoneLast4: '5566',
      fullPhone: '0988 555 566',
      points: 80,
      totalSpent: 800000,
      createdAt: new Date().toISOString(),
    },
  ],
};

// Read / Write Local Database
function readDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_DATABASE,
        ...parsed,
        taxSettings: { ...DEFAULT_DATABASE.taxSettings, ...(parsed.taxSettings || {}) },
      };
    }
  } catch (err) {
    console.error('Lỗi khi đọc file database:', err);
  }
  return DEFAULT_DATABASE;
}

function writeDatabase(data) {
  try {
    const current = readDatabase();
    const merged = { ...current, ...data };
    fs.writeFileSync(DB_FILE, JSON.stringify(merged, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Lỗi khi ghi database:', err);
    return false;
  }
}

// Initialize database file on startup if not present
if (!fs.existsSync(DB_FILE)) {
  writeDatabase(DEFAULT_DATABASE);
}

// Auto Backup to Disk
function createDiskBackup(data, label = 'Tự động sao lưu định kỳ') {
  try {
    const now = new Date();
    const timestampStr = now.toISOString().replace(/[:T]/g, '_').slice(0, 19);
    const filename = `backup_${timestampStr}.json`;
    const filePath = path.join(BACKUPS_DIR, filename);

    const backupPayload = {
      label,
      createdAt: now.toISOString(),
      sizeBytes: JSON.stringify(data).length,
      data,
    };

    fs.writeFileSync(filePath, JSON.stringify(backupPayload, null, 2), 'utf-8');
    console.log(`[AUTO-BACKUP] Đã tạo bản sao lưu an toàn: ${filename}`);
  } catch (err) {
    console.error('Lỗi sao lưu:', err);
  }
}

// Scheduled auto-backup every 1 hour
setInterval(() => {
  const currentDb = readDatabase();
  if (currentDb) {
    createDiskBackup(currentDb, 'Tự động sao lưu theo giờ');
  }
}, 3600000);

// Broadcast update to all connected WebSocket clients (Phones, PCs)
function broadcast(msgObject, senderWs = null) {
  const msgString = JSON.stringify(msgObject);
  wss.clients.forEach((client) => {
    if (client !== senderWs && client.readyState === WebSocket.OPEN) {
      client.send(msgString);
    }
  });
}

// Active Connected Devices Registry
const activeClientsMap = new Map();

function broadcastConnectedDevices() {
  const devicesList = Array.from(activeClientsMap.values());
  const payload = JSON.stringify({ type: 'DEVICES_LIST', devices: devicesList });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

// WebSocket Connection Handler
wss.on('connection', (ws, req) => {
  let rawIp = req.socket.remoteAddress || '127.0.0.1';
  // Clean IPv6 prefix
  const cleanIp = rawIp.replace('::ffff:', '');
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
  console.log(`[LAN SYNC] Thiết bị mới kết nối: ${cleanIp} (${deviceInfo.name}) - Tổng: ${activeClientsMap.size}`);

  // Send current store settings and data immediately on connect
  const currentData = readDatabase();
  ws.send(JSON.stringify({ type: 'DATA_UPDATED', payload: currentData }));

  // Broadcast updated devices list to everyone
  broadcastConnectedDevices();

  ws.on('message', (message) => {
    try {
      const parsed = JSON.parse(message.toString());
      if (parsed.type === 'REGISTER_DEVICE') {
        const current = activeClientsMap.get(ws) || deviceInfo;
        const updated = {
          ...current,
          name: parsed.deviceName || current.name,
          deviceType: parsed.deviceType || current.deviceType,
          lastActive: new Date().toISOString(),
        };
        activeClientsMap.set(ws, updated);
        broadcastConnectedDevices();
        console.log(`[LAN DEVICE] Cập nhật tên thiết bị: ${updated.name} (${cleanIp})`);
      } else if (parsed.type === 'DATA_UPDATE') {
        writeDatabase(parsed.payload);
        broadcast({ type: 'DATA_UPDATED', payload: parsed.payload }, ws);
      } else if (parsed.type === 'SETTINGS_UPDATE') {
        let db = readDatabase();
        db.taxSettings = { ...db.taxSettings, ...parsed.payload };
        writeDatabase(db);
        broadcast({ type: 'DATA_UPDATED', payload: db });
      } else if (parsed.type === 'REMOTE_SCAN') {
        broadcast({ type: 'REMOTE_SCAN_EVENT', barcode: parsed.barcode });
      }
    } catch (e) {
      console.error('WebSocket parse error:', e);
    }
  });

  ws.on('close', () => {
    activeClientsMap.delete(ws);
    broadcastConnectedDevices();
    console.log(`[LAN SYNC] Thiết bị ngắt kết nối. Còn lại: ${activeClientsMap.size}`);
  });
});

// REST API Endpoints

// 1. Get LAN Info & IP
app.get('/api/info', (req, res) => {
  const lanIp = getLocalIpAddress();
  res.json({
    status: 'online',
    serverType: 'SmartPOS Local LAN Server (100% Offline & Private)',
    lanIp: lanIp,
    port: PORT,
    fullUrl: `http://${lanIp}:${PORT}`,
    connectedDevices: activeClientsMap.size,
    devices: Array.from(activeClientsMap.values()),
  });
});

// 1b. Get Active Connected Devices List
app.get('/api/devices', (req, res) => {
  res.json({
    success: true,
    count: activeClientsMap.size,
    devices: Array.from(activeClientsMap.values()),
  });
});

// 2. Get All Store Data (Settings, Products, Debts, etc.)
app.get('/api/data', (req, res) => {
  const dbData = readDatabase();
  res.json({
    success: true,
    data: dbData,
  });
});

// 3. Save Store Settings (Bank Account, Store Info) - Permanent on Server
app.post('/api/settings', (req, res) => {
  const newSettings = req.body;
  if (!newSettings) {
    return res.status(400).json({ error: 'Missing settings payload' });
  }

  let db = readDatabase();
  db.taxSettings = { ...db.taxSettings, ...newSettings };
  writeDatabase(db);

  broadcast({ type: 'DATA_UPDATED', payload: db });
  console.log('[LAN SETTINGS] Đã lưu vĩnh viễn cấu hình cửa hàng/số tài khoản vào Server!');
  res.json({ success: true, settings: db.taxSettings });
});

// 3b. Update Manager PIN
app.post('/api/pin/update', (req, res) => {
  const { pin } = req.body;
  if (!pin) return res.status(400).json({ error: 'Missing PIN' });

  let db = readDatabase();
  db.managerPin = pin;
  writeDatabase(db);
  broadcast({ type: 'DATA_UPDATED', payload: db });
  console.log(`[LAN PIN] Đã đổi mã PIN chủ tiệm: ${pin}`);
  res.json({ success: true, pin });
});

// 3c. Save Daily Shift Closing Report (Chốt ca kiểm tiền)
app.post('/api/shifts/save', (req, res) => {
  const shiftReport = req.body;
  if (!shiftReport) return res.status(400).json({ error: 'Missing shift report' });

  let db = readDatabase();
  let shifts = db.shifts || [];
  shifts.unshift({
    ...shiftReport,
    id: `CA-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-4)}`,
    savedAt: new Date().toISOString(),
  });
  db.shifts = shifts;
  writeDatabase(db);
  broadcast({ type: 'DATA_UPDATED', payload: db });
  console.log(`[LAN SHIFT] Đã lưu báo cáo chốt ca ngày: ${shiftReport.shiftDate || new Date().toLocaleDateString('vi-VN')}`);
  res.json({ success: true, shift: shifts[0], shifts });
});

// 3d. Save / Redeem Loyalty Points (Tích điểm khách quen)
app.post('/api/loyalty/save', (req, res) => {
  const { customer, pointsChange, spentAmount } = req.body;
  if (!customer || !customer.name) return res.status(400).json({ error: 'Missing customer info' });

  let db = readDatabase();
  let loyalty = db.loyaltyCustomers || [];

  const existingIdx = loyalty.findIndex(
    (c) =>
      c.id === customer.id ||
      (c.phoneLast4 && customer.phoneLast4 && c.phoneLast4 === customer.phoneLast4 && c.name.toLowerCase() === customer.name.toLowerCase())
  );

  let updatedCustomer;
  if (existingIdx >= 0) {
    const current = loyalty[existingIdx];
    updatedCustomer = {
      ...current,
      name: customer.name || current.name,
      phoneLast4: customer.phoneLast4 || current.phoneLast4,
      fullPhone: customer.fullPhone || current.fullPhone || '',
      points: Math.max(0, (current.points || 0) + Number(pointsChange || 0)),
      totalSpent: (current.totalSpent || 0) + Number(spentAmount || 0),
      lastVisit: new Date().toISOString(),
    };
    loyalty[existingIdx] = updatedCustomer;
  } else {
    updatedCustomer = {
      id: `LOYALTY-${Date.now()}`,
      name: customer.name,
      phoneLast4: customer.phoneLast4 || '',
      fullPhone: customer.fullPhone || '',
      points: Math.max(0, Number(pointsChange || 0)),
      totalSpent: Number(spentAmount || 0),
      createdAt: new Date().toISOString(),
      lastVisit: new Date().toISOString(),
    };
    loyalty.unshift(updatedCustomer);
  }

  db.loyaltyCustomers = loyalty;
  writeDatabase(db);
  broadcast({ type: 'DATA_UPDATED', payload: db });
  res.json({ success: true, customer: updatedCustomer, loyaltyCustomers: loyalty });
});

// 4. Save & Sync Full Store Data
app.post('/api/sync', (req, res) => {
  const newData = req.body;
  if (!newData) {
    return res.status(400).json({ error: 'Missing data payload' });
  }

  const success = writeDatabase(newData);
  if (success) {
    broadcast({ type: 'DATA_UPDATED', payload: readDatabase() });
    res.json({ success: true, message: 'Dữ liệu đã được đồng bộ an toàn trong mạng LAN!' });
  } else {
    res.status(500).json({ error: 'Failed to write to local storage' });
  }
});

// 5. Upload Product Photo from Phone Camera
app.post('/api/upload-photo', (req, res) => {
  const { imageBase64, filename } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: 'Missing image data' });
  }

  try {
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const safeFilename = `prod_${Date.now()}_${Math.floor(Math.random() * 1000)}.jpg`;
    const targetPath = path.join(UPLOADS_DIR, safeFilename);

    fs.writeFileSync(targetPath, buffer);

    const lanIp = getLocalIpAddress();
    const photoUrl = `http://${lanIp}:${PORT}/uploads/${safeFilename}`;

    console.log(`[PHOTO UPLOAD] Đã nhận ảnh sản phẩm từ điện thoại: ${safeFilename}`);
    res.json({ success: true, photoUrl });
  } catch (err) {
    console.error('Photo upload error:', err);
    res.status(500).json({ error: 'Failed to save product photo' });
  }
});

// 6. Add / Update Product with Photo from Phone
app.post('/api/products/save', (req, res) => {
  const productData = req.body;
  if (!productData || !productData.name) {
    return res.status(400).json({ error: 'Invalid product data' });
  }

  let db = readDatabase();
  let products = db.products || [];

  const existingIdx = products.findIndex(
    (p) => p.id === productData.id || (productData.barcode && p.barcode === productData.barcode)
  );

  let savedProduct;
  if (existingIdx >= 0) {
    savedProduct = { ...products[existingIdx], ...productData, updatedAt: new Date().toISOString() };
    products[existingIdx] = savedProduct;
  } else {
    savedProduct = {
      ...productData,
      id: productData.id || `PRD-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    products.unshift(savedProduct);
  }

  db.products = products;
  writeDatabase(db);

  // Broadcast to all computers and phones
  broadcast({ type: 'DATA_UPDATED', payload: db });
  broadcast({ type: 'PRODUCT_SAVED_ALERT', product: savedProduct });

  console.log(`[LAN PRODUCT] Đã lưu sản phẩm "${savedProduct.name}" (${savedProduct.price} đ) vào Server!`);
  res.json({ success: true, product: savedProduct, data: db });
});

// 7. Create Order with Atomic Stock Deduction (Multi-Device Safe)
app.post('/api/order', (req, res) => {
  const { order, deviceName } = req.body;
  if (!order || !order.items || order.items.length === 0) {
    return res.status(400).json({ error: 'Invalid order payload' });
  }

  let db = readDatabase();
  let products = db.products || [];
  let orders = db.orders || [];
  let debts = db.debts || [];

  // Deduct stock safely
  products = products.map((prod) => {
    const item = order.items.find((i) => i.productId === prod.id);
    if (item) {
      const qty = item.qty * (item.unitMultiplier || 1);
      return {
        ...prod,
        stock: Math.max(0, prod.stock - qty),
      };
    }
    return prod;
  });

  const processedOrder = {
    ...order,
    deviceName: deviceName || 'Quầy thu ngân',
    syncedAt: new Date().toISOString(),
  };

  orders.unshift(processedOrder);

  // If debt order, add to debts
  if (order.paymentMethod === 'debt') {
    const custName = order.customerName || 'Khách nợ';
    const existing = debts.find((d) => d.customerName.toLowerCase() === custName.toLowerCase());
    const now = new Date().toISOString();

    if (existing) {
      debts = debts.map((d) =>
        d.id === existing.id
          ? {
              ...d,
              phone: order.customerPhone || d.phone,
              totalDebt: d.totalDebt + Number(order.total),
              remainingDebt: d.remainingDebt + Number(order.total),
              history: [
                ...d.history,
                {
                  id: `DH-${Date.now()}`,
                  date: now,
                  type: 'borrow',
                  amount: Number(order.total),
                  note: `Đơn ${order.id} từ ${deviceName || 'Điện thoại'}`,
                },
              ],
            }
          : d
      );
    } else {
      debts.unshift({
        id: `NO-${String(debts.length + 1).padStart(3, '0')}`,
        customerName: custName,
        phone: order.customerPhone || '',
        totalDebt: Number(order.total),
        remainingDebt: Number(order.total),
        createdAt: now,
        history: [
          {
            id: `DH-${Date.now()}`,
            date: now,
            type: 'borrow',
            amount: Number(order.total),
            note: `Đơn ${order.id} từ ${deviceName || 'Điện thoại'}`,
          },
        ],
      });
    }
  }

  db.products = products;
  db.orders = orders;
  db.debts = debts;

  writeDatabase(db);
  broadcast({ type: 'DATA_UPDATED', payload: db });
  broadcast({ type: 'NEW_ORDER_ALERT', order: processedOrder });

  console.log(`[LAN POS] Đã lưu đơn hàng ${order.id} (${order.total.toLocaleString()} đ) từ ${deviceName || 'Thiết bị LAN'}`);
  res.json({ success: true, order: processedOrder, data: db });
});

// 8. Remote Barcode Scan Event (From phone to PC)
app.post('/api/scan', (req, res) => {
  const { barcode, deviceName } = req.body;
  if (barcode) {
    broadcast({ type: 'REMOTE_SCAN_EVENT', barcode, deviceName });
    res.json({ success: true, barcode });
  } else {
    res.status(400).json({ error: 'Missing barcode' });
  }
});

// 9. Disk Backups List & Manual Backup
app.get('/api/backups', (req, res) => {
  try {
    const files = fs.readdirSync(BACKUPS_DIR).filter((f) => f.endsWith('.json'));
    const backups = files.map((filename) => {
      const stats = fs.statSync(path.join(BACKUPS_DIR, filename));
      return {
        filename,
        createdAt: stats.mtime.toISOString(),
        sizeKb: Math.round(stats.size / 1024),
      };
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, backups });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list backups' });
  }
});

app.post('/api/backups/create', (req, res) => {
  const currentDb = readDatabase();
  if (currentDb) {
    createDiskBackup(currentDb, req.body.label || 'Sao lưu thủ công tại quầy');
    res.json({ success: true, message: 'Đã tạo bản sao lưu trên ổ cứng!' });
  } else {
    res.status(400).json({ error: 'No database found to backup' });
  }
});

// Serve frontend static build if exists
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Start Local LAN Server
server.listen(PORT, '0.0.0.0', () => {
  const lanIp = getLocalIpAddress();
  console.log('================================================================');
  console.log('🛡️  SMARTPOS LOCAL LAN SERVER ĐANG HOẠT ĐỘNG (100% CỤC BỘ & BẢO MẬT)');
  console.log('================================================================');
  console.log(`💻 Máy tính cục bộ:   http://localhost:${PORT}`);
  console.log(`📱 Điện thoại qua WiFi LAN: http://${lanIp}:${PORT}`);
  console.log(`⚡ WebSocket Realtime Sync: ws://${lanIp}:${PORT}`);
  console.log('🔒 Dữ liệu và cài đặt tài khoản được lưu vĩnh viễn trên ổ cứng.');
  console.log('================================================================');
});
