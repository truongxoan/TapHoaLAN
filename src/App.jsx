import React from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Navbar } from './components/Navbar';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { MobileConnectModal } from './components/MobileConnectModal';
import { MobileAddProductModal } from './components/MobileAddProductModal';
import { ManagerPinModal } from './components/ManagerPinModal';
import { ShiftReportModal } from './components/ShiftReportModal';
import { LoyaltyModal } from './components/LoyaltyModal';
import { ConnectedDevicesModal } from './components/ConnectedDevicesModal';
import { ManagementMenuModal } from './components/ManagementMenuModal';
import { VietQRModal } from './components/VietQRModal';
import { PrintInvoiceModal } from './components/PrintInvoiceModal';
import { ToastContainer } from './components/ToastContainer';
import { POSScreen } from './screens/POSScreen';
import { ElderPOSScreen } from './screens/ElderPOSScreen';
import { MobilePOSScreen } from './screens/MobilePOSScreen';
import { ImportStockScreen } from './screens/ImportStockScreen';
import { InventoryScreen } from './screens/InventoryScreen';
import { DebtScreen } from './screens/DebtScreen';
import { InvoicesTaxScreen } from './screens/InvoicesTaxScreen';
import { ReportsScreen } from './screens/ReportsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { DeviceHistoryScreen } from './screens/DeviceHistoryScreen';

const MainApp = () => {
  const { activeTab, appMode, paymentSuccessOrder } = useStore();

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'pos':
        // Elder mode replaces only the selling screen; every other tab
        // keeps the existing screen (scaled up by the elder CSS).
        return appMode === 'elder' ? <ElderPOSScreen /> : <POSScreen />;
      case 'mobile_pos':
        return <MobilePOSScreen />;
      case 'import':
        return <ImportStockScreen />;
      case 'inventory':
        return <InventoryScreen />;
      case 'debts':
        return <DebtScreen />;
      case 'invoices':
        return <InvoicesTaxScreen />;
      case 'reports':
        return <ReportsScreen />;
      case 'settings':
        return <SettingsScreen />;
      case 'devices':
        // Deliberately NOT a direct tab in elder mode: the navbar only
        // offers it in admin mode, and the screen itself still gates on
        // the manager PIN, so a non-admin session only ever sees the lock.
        return <DeviceHistoryScreen />;
      default:
        return <POSScreen />;
    }
  };

  return (
    <div className="app-container">
      {/* Global Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="main-content">
        {renderActiveScreen()}
      </main>

      {/* Payment success pop: only after the server confirms the order */}
      {paymentSuccessOrder && (
        <div className="payment-success-pop no-print" role="status" aria-live="polite">
          <div className="payment-success-check">✓</div>
          <div>
            <div style={{ fontWeight: 900, fontSize: '1.1rem' }}>Thanh toán xong!</div>
            <div style={{ color: 'var(--text-muted)' }}>
              Đơn {paymentSuccessOrder.code} · {new Intl.NumberFormat('vi-VN').format(paymentSuccessOrder.total)} đ · đã lưu về hệ thống chính
            </div>
          </div>
        </div>
      )}

      {/* Global Modals & Overlays */}
      <BarcodeScannerModal />
      <MobileConnectModal />
      <MobileAddProductModal />
      <ManagerPinModal />
      <ShiftReportModal />
      <LoyaltyModal />
      <ConnectedDevicesModal />
      <ManagementMenuModal />
      <VietQRModal />
      <PrintInvoiceModal />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <MainApp />
    </StoreProvider>
  );
}
