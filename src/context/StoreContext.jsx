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
    phone: '0903 111 222',
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
    phone: '0912 333 444',
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
];

export const StoreProvider = ({ children }) => {
  // Theme & Navigation
  const [theme, setTheme] = useState(() => localStorage.getItem('smartpos_theme') || 'dark');
  const [activeTab, setActiveTab] = useState('pos');
  const [categories] = useState(INITIAL_CATEGORIES);

  // LAN Real-time Sync State & Connected Devices
  const [isLanConnected, setIsLanConnected] = useState(false);
  const [lanIp, setLanIp] = useState(window.location.hostname || 'localhost');
  const [connectedDevicesList, setConnectedDevicesList] = useState([]);
  const [devicesModalOpen, setDevicesModalOpen] = useState(false);
  const wsRef = useRef(null);

  // MANAGER PIN STATE (Mã PIN bảo mật chủ tiệm: Mặc định 1233)
  const [managerPin, setManagerPin] = useState(() => localStorage.getItem('smartpos_manager_pin') || '1233');
  const [isPinUnlocked, setIsPinUnlocked] = useState(false);
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

  // Cart State (for POS Screen)
  const [cart, setCart] = useState([]);
  const [cartDiscount, setCartDiscount] = useState({ type: 'amount', value: 0 });
  const [customer, setCustomer] = useState({ name: 'Khách lẻ', phone: '', taxId: '' });

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
    localStorage.setItem('smartpos_manager_pin', managerPin);
  }, [managerPin]);

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
      wsRef.current.send(JSON.stringify({ type: 'DATA_UPDATE', payload: fullPayload }));
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

  const unlockManagerPin = (enteredPin) => {
    if (enteredPin === managerPin) {
      setIsPinUnlocked(true);
      return true;
    }
    return false;
  };

  const lockManagerPin = () => {
    setIsPinUnlocked(false);
    showToast('Đã khóa quyền chủ tiệm!', 'info');
  };

  const updateManagerPin = (newPin) => {
    setManagerPin(newPin);
    localStorage.setItem('smartpos_manager_pin', newPin);

    const wsHost = window.location.hostname || 'localhost';
    fetch(`http://${wsHost}:5000/api/pin/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: newPin }),
    }).catch(() => {});

    showToast(`Đã đổi mã PIN bảo mật thành: ${newPin}`, 'success');
  };

  // Save Shift Closing Report
  const saveShiftReport = (report) => {
    const wsHost = window.location.hostname || 'localhost';
    fetch(`http://${wsHost}:5000/api/shifts/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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

        // Auto register this device
        const savedName = localStorage.getItem('smartpos_cashier_name') || 'Máy Tính Thu Ngân';
        const isMobile = /mobile|iphone|android|ipad/i.test(navigator.userAgent);
        socket.send(
          JSON.stringify({
            type: 'REGISTER_DEVICE',
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
            if (p.managerPin) setManagerPin(p.managerPin);
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
          if (d.managerPin) {
            setManagerPin(d.managerPin);
            localStorage.setItem('smartpos_manager_pin', d.managerPin);
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      }).catch(() => {});

      return newSnapshot;
    },
    [products, orders, purchases, suppliers, taxSettings, debts, shiftsHistory, loyaltyCustomers]
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
        showToast(`Mã vạch mới: ${barcode}`, 'info');
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

  // Checkout and Create Sales Invoice (with Loyalty Points Earned)
  const checkoutOrder = ({ paymentMethod, receivedAmount = 0, debtNote = '', customerName = '' }) => {
    if (cart.length === 0) {
      showToast('Giỏ hàng đang trống!', 'warning');
      return null;
    }

    const orderId = `HD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(
      orders.length + 1
    ).padStart(3, '0')}`;

    const buyerName = customerName || customer.name || (paymentMethod === 'debt' ? 'Khách nợ' : 'Khách lẻ');

    const newOrder = {
      id: orderId,
      createdAt: new Date().toISOString(),
      customerName: buyerName,
      customerPhone: customer.phone || '',
      customerTaxId: customer.taxId || '',
      items: cart.map((item) => ({
        ...item,
        total: item.price * item.qty,
      })),
      subtotal: cartSubtotal,
      discount: discountAmount,
      vat8Amount: Math.round(vat8Amount),
      vat10Amount: Math.round(vat10Amount),
      totalVat,
      netTotal,
      total: cartGrandTotal,
      totalCost,
      profit: Math.round(cartGrandTotal - totalCost),
      paymentMethod,
      paymentStatus: paymentMethod === 'debt' ? 'debt' : 'paid',
      receivedAmount: paymentMethod === 'debt' ? 0 : Number(receivedAmount) || cartGrandTotal,
      changeAmount: paymentMethod === 'debt' ? 0 : Math.max(0, (Number(receivedAmount) || cartGrandTotal) - cartGrandTotal),
    };

    // Automatically add loyalty points: 10,000đ = 1 Point
    if (buyerName && buyerName !== 'Khách lẻ') {
      const earnedPoints = Math.floor(cartGrandTotal / 10000);
      if (earnedPoints > 0) {
        saveLoyaltyCustomer({
          customer: { name: buyerName, phoneLast4: customer.phone ? customer.phone.slice(-4) : '' },
          pointsChange: earnedPoints,
          spentAmount: cartGrandTotal,
        });
      }
    }

    const wsHost = window.location.hostname || 'localhost';
    const cashierDevice = localStorage.getItem('smartpos_cashier_name') || 'Thiết bị POS';

    fetch(`http://${wsHost}:5000/api/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: newOrder, deviceName: cashierDevice }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data) {
          if (res.data.products) setProducts(res.data.products);
          if (res.data.orders) setOrders(res.data.orders);
          if (res.data.debts) setDebts(res.data.debts);
        }
      })
      .catch(() => {
        const updatedProducts = products.map((prod) => {
          const cartItem = cart.find((item) => item.productId === prod.id);
          if (cartItem) {
            const qtyToDeduct = cartItem.qty * (cartItem.unitMultiplier || 1);
            return { ...prod, stock: Math.max(0, prod.stock - qtyToDeduct) };
          }
          return prod;
        });
        setProducts(updatedProducts);
        setOrders([newOrder, ...orders]);
      });

    clearCart();

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    showToast(`Đã lưu đơn hàng ${orderId} (${new Intl.NumberFormat('vi-VN').format(cartGrandTotal)} đ)`, 'success');
    return newOrder;
  };

  // Product CRUD
  const addProduct = (prodData) => {
    const newProduct = {
      ...prodData,
      id: `PRD-${Date.now()}`,
      barcode: prodData.barcode || `${Math.floor(1000000000000 + Math.random() * 9000000000000)}`,
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProduct),
    }).catch(() => {});

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
      headers: { 'Content-Type': 'application/json' },
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
        isLanConnected,
        lanIp,
        connectedDevicesList,
        devicesModalOpen,
        setDevicesModalOpen,
        managerPin,
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
