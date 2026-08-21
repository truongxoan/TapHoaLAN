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
import { MobilePOSScreen } from './screens/MobilePOSScreen';
import { ImportStockScreen } from './screens/ImportStockScreen';
import { InventoryScreen } from './screens/InventoryScreen';
import { DebtScreen } from './screens/DebtScreen';
import { InvoicesTaxScreen } from './screens/InvoicesTaxScreen';
import { ReportsScreen } from './screens/ReportsScreen';
import { SettingsScreen } from './screens/SettingsScreen';

const MainApp = () => {
  const { activeTab } = useStore();

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'pos':
        return <POSScreen />;
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
