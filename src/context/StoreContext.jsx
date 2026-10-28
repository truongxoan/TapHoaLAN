import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  INITIAL_CATEGORIES,
  INITIAL_SUPPLIERS,
  INITIAL_PRODUCTS,
  INITIAL_ORDERS,
  INITIAL_PURCHASES,
  INITIAL_TAX_SETTINGS,
} from '../data/mockData';

const StoreContext = createContext();

export const useStore = () => useContext(StoreContext);

const INITIAL_DEBTS = [
  {
    id: 'NO-001',
    customerName: 'Chị Lan (Bán cơm kế bên)',
    phone: '', // DEMO: số điện thoại mẫu đã được gỡ
    totalDebt: 155000,
    remainingDebt: 155000,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    history: [
      {
        id: 'DH-1',
        date: new Date(Date.now() - 86400000 * 2).toISOString(),
        type: 'borrow',
        amount: 155000,
        note: 'Mua 1 thùng mì Hảo Hảo + 2 chai dầu ăn',
      },
    ],
  },
  {
    id: 'NO-002',
    customerName: 'Anh Hùng (Tổ trưởng)',
    phone: '', // DEMO: số điện thoại mẫu đã được gỡ
    totalDebt: 370000,
    remainingDebt: 170000,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    history: [
      {
        id: 'DH-2',
        date: new Date(Date.now() - 86400000 * 5).toISOString(),
        type: 'borrow',
        amount: 370000,
        note: 'Mua 1 thùng bia Tiger + 10 bao thuốc lá',
      },
      {
        id: 'DH-3',
        date: new Date(Date.now() - 86400000 * 1).toISOString(),
        type: 'repay',
        amount: 200000,
        note: 'Trả bớt 200.000đ',
      },
    ],
  },
];

const INITIAL_LOYALTY = [
  {
    id: 'LOYALTY-001',
    name: 'Chị Lan',
    phoneLast4: '8899',
    fullPhone: '', // DEMO: chỉ giữ last4
    points: 125,
    totalSpent: 1250000,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'LOYALTY-002',
    name: 'Anh Hùng',
    phoneLast4: '3344',
    fullPhone: '', // DEMO: chỉ giữ last4
    points: 210,
    totalSpent: 2100000,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'LOYALTY-003',
    name: 'Cô Mai',
    phoneLast4: '5566',
    fullPhone: '', // DEMO: chỉ giữ last4
    points: 80,
    totalSpent: 800000,
    createdAt: new Date().toISOString(),
  },
];

export const StoreProvider = ({ children }) => {
  // Theme & Navigation
  const [theme, setTheme] = useState(() => localStorage.getItem('smartpos_theme') || 'dark');
  const [activeTab, setActiveTab] = useState('pos');

  // Interface mode: 'elder' (large text, simplified) | 'young' (full
  // standard tools) | 'admin' (all screens, PIN-gated). Admin is NEVER
  // restored from storage: on reload without a session token it falls
  // back to 'young' (see the mode effect below).
  const [appMode, setAppModeState] = useState(() => {
    const saved = localStorage.getItem('smartpos_app_mode');
    if (saved === 'elder' || saved === 'young') return saved;
    return 'young';
  });
  const isElderMode = appMode === 'elder';
  const isAdminMode = appMode === 'admin';
  const setAppMode = useCallback((mode) => {
    if (mode === 'elder' || mode === 'young' || mode === 'admin') setAppModeState(mode);
  }, []);
  const [categories] = useState(INITIAL_CATEGORIES);

  // Stable device identity: one id per browser, created once. Clearing
  // browser storage creates a NEW identity — that is intentional, because
  // there is no account on a LAN POS to tie a wiped browser back to.
  const [deviceId] = useState(() => {
    try {
      let id = localStorage.getItem('smartpos_device_id');
      if (!id) {
        id = (typeof crypto !== 'undefined' && crypto.randomUUID)
          ? crypto.randomUUID()
          : `dev-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
        localStorage.setItem('smartpos_device_id', id);
      }
      return id;
    } catch {
      return `dev-${Date.now()}`;
    }
  });
  const defaultDeviceName = () => {
    try {
      const ua = navigator.userAgent || '';
      const isMobile = /mobile|iphone|android|ipad/i.test(ua);
      const browser = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Trình duyệt';
      return `${isMobile ? 'Điện thoại' : 'Máy tính'} — ${browser}`;
    } catch {
      return 'Máy tính — Trình duyệt';
    }
  };
  const [deviceName, setDeviceNameState] = useState(() => {
    try { return localStorage.getItem('smartpos_device_name') || defaultDeviceName(); } catch { return 'Máy tính — Trình duyệt'; }
  });
  const setDeviceName = useCallback((name) => {
    const clean = String(name || '').trim().slice(0, 60);
    if (!clean) return;
    setDeviceNameState(clean);
    try {
      localStorage.setItem('smartpos_device_name', clean);
      // Keep the legacy cashier-name key in sync: older code reads it.
      localStorage.setItem('smartpos_cashier_name', clean);
    } catch { /* storage unavailable */ }
  }, []);
  // Checkout processing flag: screens disable their pay buttons while a
  // payment is being saved, and show a loading state instead of letting
  // a second tap create a duplicate order.
  const [checkoutProcessing, setCheckoutProcessing] = useState(false);
  // Brief success pop after a payment is saved on the server (rendered by
  // App.jsx). It is set ONLY after the server confirms the order.
  const [paymentSuccessOrder, setPaymentSuccessOrder] = useState(null);

  // LAN Real-time Sync State & Connected Devices
  const [isLanConnected, setIsLanConnected] = useState(false);
  const [lanIp, setLanIp] = useState(window.location.hostname || 'localhost');
  const [connectedDevicesList, setConnectedDevicesList] = useState([]);
  const [devicesModalOpen, setDevicesModalOpen] = useState(false);
  const [managementMenuOpen, setManagementMenuOpen] = useState(false);
  const wsRef = useRef(null);

  // MANAGER AUTH: only a short-lived token lives in sessionStorage.
  // The PIN itself is never stored in localStorage or in client state.
  const [managerToken, setManagerToken] = useState(() => sessionStorage.getItem('smartpos_manager_token') || '');
  const [isPinUnlocked, setIsPinUnlocked] = useState(() => !!sessionStorage.getItem('smartpos_manager_token'));
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinTargetAction, setPinTargetAction] = useState(null);

  // PRINTER SETTINGS
  const [printerSettings, setPrinterSettings] = useState(() => {
    const saved = localStorage.getItem('smartpos_printer_settings');
    return saved ? JSON.parse(saved) : { autoPrintOnCheckout: false, paperSize: 'k80', printFooter: true };
  });

  // DAILY SHIFT & CASH AUDIT STATE (04:00 - 22:00)
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [shiftsHistory, setShiftsHistory] = useState(() => {
    const saved = localStorage.getItem('smartpos_shifts_history');
    return saved ? JSON.parse(saved) : [];
  });

  // CUSTOMER LOYALTY (Tích điểm khách quen theo tên + 4 số đuôi SĐT)
  const [loyaltyModalOpen, setLoyaltyModalOpen] = useState(false);
  const [loyaltyCustomers, setLoyaltyCustomers] = useState(() => {
    const saved = localStorage.getItem('smartpos_loyalty_customers');
    return saved ? JSON.parse(saved) : INITIAL_LOYALTY;
  });

  // Core Data
  const [suppliers, setSuppliers] = useState(() => {
    const saved = localStorage.getItem('smartpos_taphoa_suppliers');
    return saved ? JSON.parse(saved) : INITIAL_SUPPLIERS;
  });

  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('smartpos_taphoa_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('smartpos_taphoa_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [purchases, setPurchases] = useState(() => {
    const saved = localStorage.getItem('smartpos_taphoa_purchases');
    return saved ? JSON.parse(saved) : INITIAL_PURCHASES;
  });

  const [taxSettings, setTaxSettings] = useState(() => {
    const saved = localStorage.getItem('smartpos_taphoa_tax_settings');
    return saved ? JSON.parse(saved) : INITIAL_TAX_SETTINGS;
  });

  const [debts, setDebts] = useState(() => {
    const saved = localStorage.getItem('smartpos_taphoa_debts');
    return saved ? JSON.parse(saved) : INITIAL_DEBTS;
  });

  // Hourly Auto-Backup Snapshots
  const [backupSnapshots, setBackupSnapshots] = useState(() => {
    const saved = localStorage.getItem('smartpos_backup_snapshots');
    return saved ? JSON.parse(saved) : [];
  });

  const [autoBackupIntervalHours, setAutoBackupIntervalHours] = useState(() => {
    return Number(localStorage.getItem('smartpos_backup_interval')) || 1;
  });

  const [lastBackupTime, setLastBackupTime] = useState(() => {
    return localStorage.getItem('smartpos_last_backup_time') || new Date().toISOString();
  });

  // Cart State (for POS Screen & Mobile - Auto persisted to prevent data loss on camera reload)
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('smartpos_active_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('smartpos_active_cart', JSON.stringify(cart));
    } catch (e) {}
  }, [cart]);

  const [cartDiscount, setCartDiscount] = useState({ type: 'amount', value: 0 });
  const [customer, setCustomer] = useState(() => {
    try {
      const saved = localStorage.getItem('smartpos_active_customer');
      return saved ? JSON.parse(saved) : { name: 'Khách lẻ', phone: '', taxId: '' };
    } catch (e) {
      return { name: 'Khách lẻ', phone: '', taxId: '' };
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('smartpos_active_customer', JSON.stringify(customer));
    } catch (e) {}
  }, [customer]);

  // Scanner modal state
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerTarget, setScannerTarget] = useState('pos');
  const [continuousScan, setContinuousScan] = useState(true);
  const [onScanCallback, setOnScanCallback] = useState(null);
  const [mobileConnectOpen, setMobileConnectOpen] = useState(false);
  const [mobileAddProductOpen, setMobileAddProductOpen] = useState(false);

  // Active modals
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [vietQrData, setVietQrData] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Toast Notification System
  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync to LocalStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('smartpos_theme', theme);
  }, [theme]);

  // Apply the mode class (same pattern as the theme above) and persist
  // elder/young only. Admin is session-only: it is never written to
  // localStorage, so a reload without a manager token always lands back
  // on 'young' via the state initializer above.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('mode-elder', 'mode-young', 'mode-admin');
    root.classList.add(`mode-${appMode}`);
    if (appMode === 'elder' || appMode === 'young') {
      localStorage.setItem('smartpos_app_mode', appMode);
    }
  }, [appMode]);

  useEffect(() => {
    localStorage.setItem('smartpos_taphoa_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('smartpos_taphoa_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('smartpos_taphoa_purchases', JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem('smartpos_taphoa_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem('smartpos_taphoa_tax_settings', JSON.stringify(taxSettings));
  }, [taxSettings]);

  useEffect(() => {
    localStorage.setItem('smartpos_taphoa_debts', JSON.stringify(debts));
  }, [debts]);

  useEffect(() => {
    localStorage.setItem('smartpos_shifts_history', JSON.stringify(shiftsHistory));
  }, [shiftsHistory]);

  useEffect(() => {
    localStorage.setItem('smartpos_loyalty_customers', JSON.stringify(loyaltyCustomers));
  }, [loyaltyCustomers]);

  useEffect(() => {
    localStorage.setItem('smartpos_printer_settings', JSON.stringify(printerSettings));
  }, [printerSettings]);

  useEffect(() => {
    localStorage.setItem('smartpos_backup_snapshots', JSON.stringify(backupSnapshots));
  }, [backupSnapshots]);

  useEffect(() => {
    localStorage.setItem('smartpos_backup_interval', autoBackupIntervalHours.toString());
  }, [autoBackupIntervalHours]);

  // Audio Beep generator
  const playBeep = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1800, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      }
    } catch (e) {
      console.log('Audio beep fallback', e);
    }
  }, []);

  // Broadcast data changes to LAN Server
  const broadcastLanUpdate = useCallback((fullPayload) => {
    if (wsRef.current && wsRef.current.readyState === 1) {
      const token = sessionStorage.getItem('smartpos_manager_token');
      wsRef.current.send(JSON.stringify({ type: 'DATA_UPDATE', payload: fullPayload, token: token || undefined }));
    }
  }, []);

  // Require PIN Guard Function
  const requireManagerPin = useCallback(
    (actionCallback) => {
      if (isPinUnlocked) {
        actionCallback();
      } else {
        setPinTargetAction(() => actionCallback);
        setPinModalOpen(true);
      }
    },
    [isPinUnlocked]
  );

  // Mode switch with the admin PIN gate: switching to admin while the
  // manager session is locked opens the PIN modal and only switches
  // after a successful unlock (ManagerPinModal runs pinTargetAction).
  // Leaving admin or switching between elder/young needs no PIN.
  const requestAppMode = useCallback(
    (mode) => {
      if (mode === 'admin' && !isPinUnlocked) {
        requireManagerPin(() => setAppModeState('admin'));
        return;
      }
      // Elder mode only offers Bán hàng + Nhập hàng, so never strand the
      // user on a screen its navbar cannot reach (e.g. Reports).
      if (mode === 'elder') {
        setActiveTab((prev) => (prev === 'pos' || prev === 'import' ? prev : 'pos'));
      }
      setAppMode(mode);
    },
    [isPinUnlocked, requireManagerPin, setAppMode]
  );

  const getManagerToken = useCallback(() => sessionStorage.getItem('smartpos_manager_token') || '', []);
  const managerAuthHeaders = useCallback(() => {
    const token = sessionStorage.getItem('smartpos_manager_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const unlockManagerPin = async (enteredPin) => {
    const wsHost = window.location.hostname || 'localhost';
    try {
      const res = await fetch(`http://${wsHost}:5000/api/auth/manager`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: enteredPin }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && data.token) {
        sessionStorage.setItem('smartpos_manager_token', data.token);
        setManagerToken(data.token);
        setIsPinUnlocked(true);
        return true;
      }
      if (res.status === 429) showToast('Nhập sai PIN quá nhiều lần, thử lại sau 5 phút.', 'danger');
      return false;
    } catch {
      return false;
    }
  };

  const lockManagerPin = () => {
    const token = sessionStorage.getItem('smartpos_manager_token');
    sessionStorage.removeItem('smartpos_manager_token');
    setManagerToken('');
    setIsPinUnlocked(false);
    // Locking the manager session also leaves admin mode immediately.
    setAppModeState('young');
    if (token) {
      const wsHost = window.location.hostname || 'localhost';
      fetch(`http://${wsHost}:5000/api/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    showToast('Đã khóa quyền chủ tiệm!', 'info');
  };

  // updateManagerPin(oldPin, newPin) — also accepts a single newPin when
  // the manager is already unlocked (token auth still applies server-side).
  const updateManagerPin = async (oldPin, newPin) => {
    const nextPin = newPin || oldPin;
    const prevPin = newPin ? oldPin : '';
    const wsHost = window.location.hostname || 'localhost';
    try {
      const res = await fetch(`http://${wsHost}:5000/api/pin/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...managerAuthHeaders() },
        body: JSON.stringify({ oldPin: prevPin, newPin: nextPin }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        showToast('Đã đổi mã PIN chủ tiệm thành công!', 'success');
        return true;
      }
      showToast(data.error || 'Đổi PIN thất bại. Kiểm tra mã PIN cũ và quyền chủ tiệm.', 'danger');
      return false;
    } catch {
      showToast('Không kết nối được server để đổi PIN.', 'danger');
      return false;
    }
  };

  // Save Shift Closing Report
  const saveShiftReport = (report) => {
    const wsHost = window.location.hostname || 'localhost';
    fetch(`http://${wsHost}:5000/api/shifts/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...managerAuthHeaders() },
      body: JSON.stringify(report),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.shifts) {
          setShiftsHistory(data.shifts);
        }
      })
      .catch(() => {
        setShiftsHistory((prev) => [report, ...prev]);
      });
  };

  // Save Loyalty Customer & Points
  const saveLoyaltyCustomer = ({ customer, pointsChange, spentAmount }) => {
    const wsHost = window.location.hostname || 'localhost';
    fetch(`http://${wsHost}:5000/api/loyalty/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer, pointsChange, spentAmount }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.loyaltyCustomers) {
          setLoyaltyCustomers(data.loyaltyCustomers);
        }
      })
      .catch(() => {
        setLoyaltyCustomers((prev) => {
          const idx = prev.findIndex((c) => c.name.toLowerCase() === customer.name.toLowerCase());
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = {
              ...updated[idx],
              points: Math.max(0, (updated[idx].points || 0) + Number(pointsChange || 0)),
              totalSpent: (updated[idx].totalSpent || 0) + Number(spentAmount || 0),
            };
            return updated;
          } else {
            return [
              {
                id: `LOYALTY-${Date.now()}`,
                name: customer.name,
                phoneLast4: customer.phoneLast4 || '',
                fullPhone: customer.fullPhone || '',
                points: Math.max(0, Number(pointsChange || 0)),
                totalSpent: Number(spentAmount || 0),
                createdAt: new Date().toISOString(),
              },
              ...prev,
            ];
          }
        });
      });
  };

  // Check 22h00 Shift End notification
  useEffect(() => {
    const shiftInterval = setInterval(() => {
      const d = new Date();
      if (d.getHours() === 22 && d.getMinutes() === 0) {
        showToast('Đã đến 22h00 (10h tối)! Hãy mở bảng Chốt Ca để kiểm kê tiền mặt két.', 'warning');
      }
    }, 60000);
    return () => clearInterval(shiftInterval);
  }, [showToast]);

  // Save Store Settings Permanently to Server
  const updateTaxSettings = useCallback(
    (newSettings) => {
      setTaxSettings(newSettings);
      localStorage.setItem('smartpos_taphoa_tax_settings', JSON.stringify(newSettings));

      const wsHost = window.location.hostname || 'localhost';
      fetch(`http://${wsHost}:5000/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...managerAuthHeaders() },
        body: JSON.stringify(newSettings),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            showToast('Đã lưu vĩnh viễn cài đặt tài khoản vào Server!', 'success');
          }
        })
        .catch(() => {});
    },
    [showToast]
  );

  // Upload Product Photo to Server
  const uploadProductPhoto = async (base64Image) => {
    const wsHost = window.location.hostname || 'localhost';
    try {
      const res = await fetch(`http://${wsHost}:5000/api/upload-photo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Image }),
      });
      const data = await res.json();
      if (data.success && data.photoUrl) {
        return data.photoUrl;
      }
    } catch (err) {
      console.error('Photo upload error:', err);
    }
    return base64Image;
  };

  // Connect to Local LAN WebSocket Server (Port 5000) & Hydrate Full State
  useEffect(() => {
    const wsHost = window.location.hostname || 'localhost';
    const wsPort = 5000;
    const wsUrl = `ws://${wsHost}:${wsPort}`;

    let socket;
    try {
      socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        setIsLanConnected(true);
        console.log('[LAN SYNC] Kết nối thành công mạng nội bộ:', wsUrl);

        // Authenticate this WS connection for manager-only messages
        const mgrToken = sessionStorage.getItem('smartpos_manager_token');
        if (mgrToken) {
          socket.send(JSON.stringify({ type: 'AUTH_MANAGER', token: mgrToken }));
        }
        // Auto register this device (stable id + editable name, so bills
        // stay attributable even if the device syncs later).
        const savedName = localStorage.getItem('smartpos_device_name') || localStorage.getItem('smartpos_cashier_name') || 'Máy Tính Thu Ngân';
        const savedId = localStorage.getItem('smartpos_device_id') || '';
        const isMobile = /mobile|iphone|android|ipad/i.test(navigator.userAgent);
        socket.send(
          JSON.stringify({
            type: 'REGISTER_DEVICE',
            deviceId: savedId,
            deviceName: savedName,
            deviceType: isMobile ? 'phone' : 'computer',
          })
        );
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'DEVICES_LIST' && msg.devices) {
            setConnectedDevicesList(msg.devices);
          } else if (msg.type === 'DATA_UPDATED' && msg.payload) {
            const p = msg.payload;
            if (p.products && p.products.length > 0) setProducts(p.products);
            if (p.orders) setOrders(p.orders);
            if (p.purchases) setPurchases(p.purchases);
            if (p.suppliers && p.suppliers.length > 0) setSuppliers(p.suppliers);
            if (p.debts) setDebts(p.debts);
            if (p.taxSettings) setTaxSettings(p.taxSettings);
            if (p.shifts) setShiftsHistory(p.shifts);
            if (p.loyaltyCustomers) setLoyaltyCustomers(p.loyaltyCustomers);
          } else if (msg.type === 'PRODUCT_SAVED_ALERT' && msg.product) {
            playBeep();
            showToast(`Mặt hàng mới: ${msg.product.name} (${msg.product.price.toLocaleString()}đ)`, 'success');
          } else if (msg.type === 'REMOTE_SCAN_EVENT' && msg.barcode) {
            playBeep();
            const found = products.find((p) => p.barcode === msg.barcode);
            if (found) {
              addToCart(found, 1);
              showToast(`Đã nhận mã quét từ điện thoại: ${found.name}`, 'success');
            } else {
              showToast(`Nhận mã mới từ điện thoại: ${msg.barcode}`, 'info');
            }
          }
        } catch (err) {
          console.error('Error parsing WS message:', err);
        }
      };

      socket.onclose = () => {
        setIsLanConnected(false);
      };
    } catch (e) {
      console.log('LAN WebSocket not running, using offline storage.');
    }

    // Hydrate Initial Server Data
    fetch(`http://${wsHost}:${wsPort}/api/info`)
      .then((res) => res.json())
      .then((data) => {
        if (data.lanIp) setLanIp(data.lanIp);
      })
      .catch(() => {});

    fetch(`http://${wsHost}:${wsPort}/api/data`)
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data) {
          const d = res.data;
          if (d.taxSettings) {
            setTaxSettings(d.taxSettings);
            localStorage.setItem('smartpos_taphoa_tax_settings', JSON.stringify(d.taxSettings));
          }
          if (d.products && d.products.length > 0) {
            setProducts(d.products);
            localStorage.setItem('smartpos_taphoa_products', JSON.stringify(d.products));
          }
          if (d.debts) {
            setDebts(d.debts);
            localStorage.setItem('smartpos_taphoa_debts', JSON.stringify(d.debts));
          }
          if (d.suppliers && d.suppliers.length > 0) {
            setSuppliers(d.suppliers);
            localStorage.setItem('smartpos_taphoa_suppliers', JSON.stringify(d.suppliers));
          }
          if (d.shifts) {
            setShiftsHistory(d.shifts);
            localStorage.setItem('smartpos_shifts_history', JSON.stringify(d.shifts));
          }
          if (d.loyaltyCustomers) {
            setLoyaltyCustomers(d.loyaltyCustomers);
            localStorage.setItem('smartpos_loyalty_customers', JSON.stringify(d.loyaltyCustomers));
          }
        }
      })
      .catch(() => {});

    return () => {
      if (socket) socket.close();
    };
  }, [playBeep, showToast]);

  // AUTO-BACKUP ENGINE (Hourly Snapshot Creation)
  const createBackupSnapshot = useCallback(
    (label = 'Tự động sao lưu định kỳ') => {
      const timestamp = new Date().toISOString();
      const snapshotData = {
        products,
        orders,
        purchases,
        suppliers,
        taxSettings,
        debts,
        shifts: shiftsHistory,
        loyaltyCustomers,
      };

      const newSnapshot = {
        id: `SNAPSHOT-${Date.now()}`,
        timestamp,
        label,
        productsCount: products.length,
        ordersCount: orders.length,
        purchasesCount: purchases.length,
        debtsCount: debts.length,
        sizeKb: Math.round(JSON.stringify(snapshotData).length / 1024),
        data: snapshotData,
      };

      setBackupSnapshots((prev) => [newSnapshot, ...prev.slice(0, 29)]);
      setLastBackupTime(timestamp);
      localStorage.setItem('smartpos_last_backup_time', timestamp);

      const wsHost = window.location.hostname || 'localhost';
      fetch(`http://${wsHost}:5000/api/backups/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...managerAuthHeaders() },
        body: JSON.stringify({ label }),
      }).catch(() => {});

      return newSnapshot;
    },
    [products, orders, purchases, suppliers, taxSettings, debts, shiftsHistory, loyaltyCustomers, managerAuthHeaders]
  );

  // Check every 60s for auto-backup interval
  useEffect(() => {
    const intervalMs = autoBackupIntervalHours * 3600 * 1000;
    const timer = setInterval(() => {
      const last = new Date(lastBackupTime).getTime();
      const now = Date.now();
      if (now - last >= intervalMs) {
        createBackupSnapshot(`Tự động sao lưu mỗi ${autoBackupIntervalHours} giờ`);
        showToast(`Đã tự động sao lưu dữ liệu (${new Date().toLocaleTimeString('vi-VN')})`, 'info');
      }
    }, 60000);

    return () => clearInterval(timer);
  }, [autoBackupIntervalHours, lastBackupTime, createBackupSnapshot, showToast]);

  // Server backup download / restore (manager token required server-side).
  const downloadServerBackup = async (filename) => {
    const wsHost = window.location.hostname || 'localhost';
    const res = await fetch(`http://${wsHost}:5000/api/backups/${encodeURIComponent(filename)}/download`, { headers: { ...managerAuthHeaders() } });
    if (!res.ok) { showToast('Không tải được bản sao lưu (cần quyền chủ tiệm).', 'danger'); return false; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    return true;
  };
  const restoreServerBackup = async (filename) => {
    const wsHost = window.location.hostname || 'localhost';
    const res = await fetch(`http://${wsHost}:5000/api/backups/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...managerAuthHeaders() },
      body: JSON.stringify({ filename }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) { showToast(data.error || 'Khôi phục thất bại.', 'danger'); return false; }
    showToast('Đã khôi phục từ bản sao lưu trên server!', 'success');
    return true;
  };

  // Restore snapshot
  const restoreBackupSnapshot = (snapshotId) => {
    const snapshot = backupSnapshots.find((s) => s.id === snapshotId);
    if (!snapshot || !snapshot.data) {
      showToast('Không tìm thấy dữ liệu bản sao lưu này!', 'danger');
      return;
    }

    if (snapshot.data.products) setProducts(snapshot.data.products);
    if (snapshot.data.orders) setOrders(snapshot.data.orders);
    if (snapshot.data.purchases) setPurchases(snapshot.data.purchases);
    if (snapshot.data.suppliers) setSuppliers(snapshot.data.suppliers);
    if (snapshot.data.taxSettings) setTaxSettings(snapshot.data.taxSettings);
    if (snapshot.data.debts) setDebts(snapshot.data.debts);
    if (snapshot.data.shifts) setShiftsHistory(snapshot.data.shifts);
    if (snapshot.data.loyaltyCustomers) setLoyaltyCustomers(snapshot.data.loyaltyCustomers);

    broadcastLanUpdate(snapshot.data);
    showToast(`Đã khôi phục dữ liệu từ bản ${new Date(snapshot.timestamp).toLocaleString('vi-VN')}!`, 'success');
  };

  const deleteBackupSnapshot = (snapshotId) => {
    setBackupSnapshots((prev) => prev.filter((s) => s.id !== snapshotId));
    showToast('Đã xóa bản sao lưu!', 'info');
  };

  const downloadSnapshotFile = (snapshotId) => {
    const snapshot = backupSnapshots.find((s) => s.id === snapshotId);
    if (!snapshot) return;

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(snapshot.data, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `SmartPOS_Snapshot_${snapshot.timestamp.slice(0, 19).replace(/[:T]/g, '_')}.json`);
    document.body.appendChild(dl);
    dl.click();
    dl.remove();
    showToast('Đã tải xuống tệp sao lưu JSON!', 'success');
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Lookup a product by barcode: server first, then local products.
  const lookupProductByBarcode = useCallback(async (barcode) => {
    const code = String(barcode || '').trim();
    if (!code) return { found: false, barcode: code };
    const wsHost = window.location.hostname || 'localhost';
    try {
      const res = await fetch(`http://${wsHost}:5000/api/products/by-barcode/${encodeURIComponent(code)}`);
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.found && data.product) return { found: true, product: data.product };
    } catch { /* fall through to local lookup */ }
    const local = products.find((p) => p.barcode === code);
    return local ? { found: true, product: local } : { found: false, barcode: code };
  }, [products]);

  // Trigger Scanner Modal
  const openScanner = (target = 'pos', callback = null) => {
    setScannerTarget(target);
    setOnScanCallback(() => callback);
    setScannerOpen(true);
  };

  const closeScanner = () => {
    setScannerOpen(false);
    setOnScanCallback(null);
  };

  // Handle scanned barcode
  const handleBarcodeScanned = (barcode) => {
    playBeep();

    if (wsRef.current && wsRef.current.readyState === 1) {
      wsRef.current.send(JSON.stringify({ type: 'REMOTE_SCAN', barcode }));
    }

    if (onScanCallback) {
      onScanCallback(barcode);
      if (!continuousScan) closeScanner();
      return;
    }

    if (scannerTarget === 'pos') {
      const foundProduct = products.find((p) => p.barcode === barcode);
      if (foundProduct) {
        addToCart(foundProduct, 1);
        showToast(`Đã thêm: ${foundProduct.name} (+1)`, 'success');
      } else {
        // Never silently create a product from POS. Point the user to Import.
        sessionStorage.setItem('smartpos_import_prefill_barcode', barcode);
        showToast(`Mã mới ${barcode} chưa có trong kho — mở mục Nhập Hàng để tạo nhanh sản phẩm này.`, 'warning');
      }
    }

    if (!continuousScan) {
      closeScanner();
    }
  };

  // Cart Management
  const addToCart = (product, qty = 1, unitMultiplier = 1, unitName = null, customPrice = null) => {
    const requiredStock = qty * unitMultiplier;
    if (product.stock < requiredStock) {
      showToast(`Không đủ tồn kho! Chỉ còn ${product.stock} ${product.unit}`, 'warning');
      return;
    }

    const finalUnit = unitName || product.unit;
    const finalPrice = customPrice !== null && customPrice !== undefined ? Number(customPrice) : Number(product.price);
    const finalCost = unitMultiplier > 1 && product.boxCostPrice
      ? Number(product.boxCostPrice)
      : (Number(product.costPrice) || 0) * unitMultiplier;

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.productId === product.id && item.unitName === finalUnit);
      if (existing) {
        const newQty = existing.qty + qty;
        return prevCart.map((item) =>
          item.productId === product.id && item.unitName === finalUnit
            ? { ...item, qty: newQty }
            : item
        );
      } else {
        return [
          ...prevCart,
          {
            productId: product.id,
            barcode: product.barcode,
            name: product.name,
            unit: finalUnit,
            unitName: finalUnit,
            unitMultiplier: unitMultiplier,
            price: finalPrice,
            costPrice: finalCost,
            vatRate: product.vatRate || 8,
            qty: qty,
            image: product.image,
          },
        ];
      }
    });
  };

  const updateCartQty = (productId, qty) => {
    const product = products.find((p) => p.id === productId);
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    if (product && qty > product.stock) {
      showToast(`Tối đa ${product.stock} ${product.unit} trong kho!`, 'warning');
      qty = product.stock;
    }
    setCart((prev) =>
      prev.map((item) => (item.productId === productId ? { ...item, qty } : item))
    );
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCartDiscount({ type: 'amount', value: 0 });
    setCustomer({ name: 'Khách lẻ', phone: '', taxId: '' });
  };

  // Cart Calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const discountAmount =
    cartDiscount.type === 'percent'
      ? Math.round((cartSubtotal * Number(cartDiscount.value || 0)) / 100)
      : Math.min(Number(cartDiscount.value || 0), cartSubtotal);

  const discountedSubtotal = Math.max(0, cartSubtotal - discountAmount);

  let vat8Amount = 0;
  let vat10Amount = 0;
  let totalCost = 0;

  cart.forEach((item) => {
    const itemTotal = item.price * item.qty;
    const itemRatio = cartSubtotal > 0 ? itemTotal / cartSubtotal : 0;
    const itemDiscountedTotal = itemTotal - discountAmount * itemRatio;

    totalCost += (item.costPrice || 0) * item.qty;

    if (item.vatRate === 8) {
      const net = itemDiscountedTotal / 1.08;
      vat8Amount += itemDiscountedTotal - net;
    } else if (item.vatRate === 10) {
      const net = itemDiscountedTotal / 1.10;
      vat10Amount += itemDiscountedTotal - net;
    }
  });

  const totalVat = Math.round(vat8Amount + vat10Amount);
  const netTotal = Math.round(discountedSubtotal - totalVat);
  const cartGrandTotal = discountedSubtotal;

  // Checkout: the server assigns the order code and recalculates totals.
  // This function is async and returns the SERVER order (or null on failure).
  // The cart is only cleared after the server confirms the order.
  const checkoutOrder = async ({ paymentMethod, receivedAmount = 0, debtNote = '', customerName = '' }) => {
    if (cart.length === 0) {
      showToast('Giỏ hàng đang trống!', 'warning');
      return null;
    }
    if (checkoutProcessing) return null;
    setCheckoutProcessing(true);
    try {
      return await checkoutOrderInner({ paymentMethod, receivedAmount, debtNote, customerName });
    } finally {
      setCheckoutProcessing(false);
    }
  };

  const checkoutOrderInner = async ({ paymentMethod, receivedAmount = 0, debtNote = '', customerName = '' }) => {
    const buyerName = customerName || customer.name || (paymentMethod === 'debt' ? 'Khách nợ' : 'Khách lẻ');
    const wsHost = window.location.hostname || 'localhost';
    const cashierDevice = localStorage.getItem('smartpos_device_name') || localStorage.getItem('smartpos_cashier_name') || 'Thiết bị POS';
    const cashierDeviceId = localStorage.getItem('smartpos_device_id') || '';
    const payload = {
      order: {
        customerName: buyerName,
        customerPhone: customer.phone || '',
        customerTaxId: customer.taxId || '',
        items: cart.map((item) => ({
          productId: item.productId,
          barcode: item.barcode,
          name: item.name,
          unit: item.unit,
          unitName: item.unitName,
          unitMultiplier: item.unitMultiplier || 1,
          qty: item.qty,
          vatRate: item.vatRate || 8,
          costPrice: item.costPrice || 0,
        })),
        discount: discountAmount,
        paymentMethod,
        receivedAmount: paymentMethod === 'debt' ? 0 : Number(receivedAmount) || cartGrandTotal,
        debtNote,
      },
      deviceName: cashierDevice,
      deviceId: cashierDeviceId,
    };
    let serverOrder = null;
    try {
      const res = await fetch(`http://${wsHost}:5000/api/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        showToast(data.error || 'Không lưu được đơn hàng. Giỏ hàng vẫn giữ nguyên.', 'danger');
        return null;
      }
      serverOrder = data.order;
      if (data.data) {
        if (data.data.products) setProducts(data.data.products);
        if (data.data.orders) setOrders(data.data.orders);
        if (data.data.debts) setDebts(data.data.debts);
      }
    } catch {
      showToast('Không kết nối được server. Giỏ hàng vẫn giữ nguyên, thử lại sau.', 'danger');
      return null;
    }
    // Loyalty points are awarded only after the server confirms the order.
    if (buyerName && buyerName !== 'Khách lẻ') {
      const earnedPoints = Math.floor(serverOrder.total / 10000);
      if (earnedPoints > 0) {
        saveLoyaltyCustomer({
          customer: { name: buyerName, phoneLast4: customer.phone ? customer.phone.slice(-4) : '' },
          pointsChange: earnedPoints,
          spentAmount: serverOrder.total,
        });
      }
    }
    clearCart();
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    const statusNote = serverOrder.paymentStatus === 'pending_vietqr' ? ' (chờ xác nhận VietQR)' : '';
    showToast(`Đã lưu đơn hàng ${serverOrder.code} (${new Intl.NumberFormat('vi-VN').format(serverOrder.total)} đ)${statusNote}`, 'success');
    setPaymentSuccessOrder(serverOrder);
    setTimeout(() => setPaymentSuccessOrder(null), 2600);
    return serverOrder;
  };

  // Product CRUD
  const addProduct = (prodData) => {
    const newProduct = {
      ...prodData,
      // No invented id/barcode here: the server assigns SP-xxxx on save.
      // The optimistic local copy keeps a temporary id until the server
      // response arrives; its barcode stays exactly what the user typed.
      id: prodData.id || `TMP-${Date.now()}`,
      barcode: prodData.barcode || '',
      costPrice: Number(prodData.costPrice) || 0,
      price: Number(prodData.price) || 0,
      stock: Number(prodData.stock) || 0,
      minStock: Number(prodData.minStock) || 5,
      vatRate: Number(prodData.vatRate) || 8,
      expiryDate: prodData.expiryDate || '',
    };

    const wsHost = window.location.hostname || 'localhost';
    fetch(`http://${wsHost}:5000/api/products/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...managerAuthHeaders() },
      body: JSON.stringify(newProduct),
    })
      .then((res) => res.json().catch(() => ({})))
      .then((data) => {
        if (data.product) {
          setProducts((prev) => prev.map((p) => (p.id === newProduct.id ? data.product : p)));
        }
      })
      .catch(() => {});

    const updated = [newProduct, ...products];
    setProducts(updated);
    broadcastLanUpdate({ products: updated, orders, purchases, suppliers, taxSettings, debts });
    showToast(`Đã thêm sản phẩm: ${newProduct.name}`, 'success');
  };

  const updateProduct = (id, prodData) => {
    const found = products.find((p) => p.id === id);
    const merged = { ...found, ...prodData, id };

    const wsHost = window.location.hostname || 'localhost';
    fetch(`http://${wsHost}:5000/api/products/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...managerAuthHeaders() },
      body: JSON.stringify(merged),
    }).catch(() => {});

    const updated = products.map((p) => (p.id === id ? merged : p));
    setProducts(updated);
    broadcastLanUpdate({ products: updated, orders, purchases, suppliers, taxSettings, debts });
    showToast('Cập nhật sản phẩm thành công!', 'success');
  };

  const deleteProduct = (id) => {
    const updated = products.filter((p) => p.id !== id);
    setProducts(updated);
    broadcastLanUpdate({ products: updated, orders, purchases, suppliers, taxSettings, debts });
    showToast('Đã xóa sản phẩm khỏi kho!', 'info');
  };

  // Import stock: adds base-unit quantities to products and records a purchase.
  // (Previously referenced by ImportStockScreen but never implemented.)
  const importStock = ({ supplierId, items, notes }) => {
    if (!items || items.length === 0) return null;
    const purchase = {
      id: `PN-${Date.now()}`,
      supplierId,
      items,
      notes: notes || '',
      createdAt: new Date().toISOString(),
      total: items.reduce((sum, it) => sum + (Number(it.qty) || 0) * (Number(it.costPrice) || 0), 0),
    };
    const updatedProducts = products.map((prod) => {
      const item = items.find((it) => it.productId === prod.id);
      if (!item) return prod;
      return { ...prod, stock: (Number(prod.stock) || 0) + (Number(item.qty) || 0) };
    });
    setProducts(updatedProducts);
    setPurchases((prev) => [purchase, ...prev]);
    broadcastLanUpdate({ products: updatedProducts, purchases: [purchase, ...purchases], orders, suppliers, taxSettings, debts });
    showToast('Đã nhập hàng vào kho!', 'success');
    return purchase;
  };

  // Supplier CRUD
  const addSupplier = (supData) => {
    const newSup = {
      ...supData,
      id: `SUP-${String(suppliers.length + 1).padStart(3, '0')}`,
      debt: Number(supData.debt) || 0,
    };
    const updated = [...suppliers, newSup];
    setSuppliers(updated);
    broadcastLanUpdate({ products, orders, purchases, suppliers: updated, taxSettings, debts });
    showToast(`Đã thêm nhà cung cấp: ${newSup.name}`, 'success');
  };

  const updateSupplier = (id, supData) => {
    const updated = suppliers.map((s) => (s.id === id ? { ...s, ...supData } : s));
    setSuppliers(updated);
    broadcastLanUpdate({ products, orders, purchases, suppliers: updated, taxSettings, debts });
    showToast('Cập nhật nhà cung cấp thành công!', 'success');
  };

  // Reset to sample data
  const resetToSampleData = () => {
    setProducts(INITIAL_PRODUCTS);
    setOrders(INITIAL_ORDERS);
    setPurchases(INITIAL_PURCHASES);
    setSuppliers(INITIAL_SUPPLIERS);
    setTaxSettings(INITIAL_TAX_SETTINGS);
    setDebts(INITIAL_DEBTS);
    setShiftsHistory([]);
    setLoyaltyCustomers(INITIAL_LOYALTY);
    setCart([]);
    broadcastLanUpdate({
      products: INITIAL_PRODUCTS,
      orders: INITIAL_ORDERS,
      purchases: INITIAL_PURCHASES,
      suppliers: INITIAL_SUPPLIERS,
      taxSettings: INITIAL_TAX_SETTINGS,
      debts: INITIAL_DEBTS,
    });
    showToast('Đã khôi phục dữ liệu mẫu tạp hóa thành công!', 'success');
  };

  return (
    <StoreContext.Provider
      value={{
        theme,
        toggleTheme,
        activeTab,
        setActiveTab,
        appMode,
        setAppMode,
        requestAppMode,
        isElderMode,
        isAdminMode,
        isLanConnected,
        lanIp,
        connectedDevicesList,
        devicesModalOpen,
        setDevicesModalOpen,
        managementMenuOpen,
        setManagementMenuOpen,
        managerToken,
        getManagerToken,
        managerAuthHeaders,
        isPinUnlocked,
        requireManagerPin,
        unlockManagerPin,
        lockManagerPin,
        updateManagerPin,
        pinModalOpen,
        setPinModalOpen,
        pinTargetAction,
        printerSettings,
        setPrinterSettings,
        shiftModalOpen,
        setShiftModalOpen,
        shiftsHistory,
        saveShiftReport,
        loyaltyModalOpen,
        setLoyaltyModalOpen,
        loyaltyCustomers,
        saveLoyaltyCustomer,
        categories,
        suppliers,
        addSupplier,
        updateSupplier,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        orders,
        purchases,
        debts,
        backupSnapshots,
        autoBackupIntervalHours,
        setAutoBackupIntervalHours,
        createBackupSnapshot,
        restoreBackupSnapshot,
        deleteBackupSnapshot,
        downloadSnapshotFile,
        lastBackupTime,
        taxSettings,
        setTaxSettings: updateTaxSettings,
        uploadProductPhoto,
        cart,
        addToCart,
        updateCartQty,
        removeFromCart,
        clearCart,
        cartDiscount,
        setCartDiscount,
        customer,
        setCustomer,
        cartSubtotal,
        discountAmount,
        vat8Amount,
        vat10Amount,
        totalVat,
        netTotal,
        cartGrandTotal,
        checkoutOrder,
        checkoutProcessing,
        paymentSuccessOrder,
        deviceId,
        deviceName,
        setDeviceName,
        lookupProductByBarcode,
        importStock,
        downloadServerBackup,
        restoreServerBackup,
        resetToSampleData,
        scannerOpen,
        scannerTarget,
        continuousScan,
        setContinuousScan,
        openScanner,
        closeScanner,
        mobileConnectOpen,
        setMobileConnectOpen,
        mobileAddProductOpen,
        setMobileAddProductOpen,
        handleBarcodeScanned,
        playBeep,
        activeInvoice,
        setActiveInvoice,
        vietQrData,
        setVietQrData,
        toasts,
        showToast,
        removeToast,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};
