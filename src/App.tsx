import React, { useState, useEffect } from 'react';
import { StorageService } from './services/storage';
import { GoogleSheetsService } from './services/googleSheets';
import { Role, SyncStatus, User } from './types';
import { Header } from './components/Header';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { CwmGuideModal } from './components/CwmGuideModal';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import { HouseholdManagement } from './pages/HouseholdManagement';
import { AccountManagement } from './pages/AccountManagement';
import { ModuleBC01 } from './pages/ModuleBC01';
import { ModuleBC02 } from './pages/ModuleBC02';
import { ModuleBC03 } from './pages/ModuleBC03';
import { ModuleBC04 } from './pages/ModuleBC04';
import { ModuleBC05 } from './pages/ModuleBC05';
import { ModuleBC06 } from './pages/ModuleBC06';
import { ModuleBC07 } from './pages/ModuleBC07';
import { ModuleBC08 } from './pages/ModuleBC08';
import { AnalysisPage } from './pages/AnalysisPage';
import { ExportPage } from './pages/ExportPage';
import { GoogleSheetsSync } from './pages/GoogleSheetsSync';
import { AuditLogPage } from './pages/AuditLogPage';
import { SettingsPage } from './pages/SettingsPage';
import { HouseholdPortal } from './pages/HouseholdPortal';
import { Menu } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('DASHBOARD');
  const [isCwmGuideOpen, setIsCwmGuideOpen] = useState(false);
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(StorageService.getSyncStatus());
  const [refreshKey, setRefreshKey] = useState(0);

  // Khởi tạo cơ sở dữ liệu nếu trống
  useEffect(() => {
    StorageService.initializeDatabaseIfEmpty().then(() => {
      const user = StorageService.getCurrentUser();
      if (user) {
        setCurrentUser(user);
      }
    });

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRefreshData = () => {
    setRefreshKey((prev) => prev + 1);
    setSyncStatus(StorageService.getSyncStatus());
  };

  const handleLogout = () => {
    StorageService.setCurrentUser(null);
    setCurrentUser(null);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'HOUSEHOLD') {
      setActiveTab('BC06');
    } else {
      setActiveTab('DASHBOARD');
    }
  };

  const handleSyncSheets = async () => {
    setSyncStatus('SYNCING');
    const result = await GoogleSheetsService.syncToGoogleSheets();
    setSyncStatus(StorageService.getSyncStatus());
    alert(result.message);
    handleRefreshData();
  };

  // Nút chuyển đổi nhanh tài khoản demo cho ban giám khảo
  const handleSwitchUser = (role: Role, householdId?: string) => {
    const users = StorageService.getUsers();
    let target: User | undefined;
    if (role === 'ADMIN') {
      target = users.find((u) => u.role === 'ADMIN');
    } else if (role === 'RESEARCHER') {
      target = users.find((u) => u.role === 'RESEARCHER');
    } else if (role === 'HOUSEHOLD') {
      target = users.find((u) => u.householdId === (householdId || 'H01'));
    }

    if (target) {
      StorageService.setCurrentUser(target);
      setCurrentUser(target);
      if (target.role === 'HOUSEHOLD') {
        setActiveTab('BC06');
      }
      handleRefreshData();
    }
  };

  // 1. Chưa đăng nhập -> Hiện trang Đăng nhập
  if (!currentUser) {
    return (
      <>
        <Login
          onLoginSuccess={handleLoginSuccess}
          onOpenCwmGuide={() => setIsCwmGuideOpen(true)}
        />
        <CwmGuideModal
          isOpen={isCwmGuideOpen}
          onClose={() => setIsCwmGuideOpen(false)}
        />
      </>
    );
  }

  // 2. Nếu là Hộ chăn nuôi -> Giao diện Mobile-First chuyên biệt
  if (currentUser.role === 'HOUSEHOLD') {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
        <Header
          currentUser={currentUser}
          syncStatus={syncStatus}
          isOnline={isOnline}
          onLogout={handleLogout}
          onOpenCwmGuide={() => setIsCwmGuideOpen(true)}
          onSyncSheets={handleSyncSheets}
          onSwitchUser={handleSwitchUser}
        />

        <main className="flex-1">
          <HouseholdPortal
            key={refreshKey}
            user={currentUser}
            onRefreshData={handleRefreshData}
          />
        </main>

        <CwmGuideModal
          isOpen={isCwmGuideOpen}
          onClose={() => setIsCwmGuideOpen(false)}
        />
      </div>
    );
  }

  // 3. Nếu là Admin hoặc Nghiên cứu viên -> Giao diện Quản lý & Dashboard
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <Header
        currentUser={currentUser}
        syncStatus={syncStatus}
        isOnline={isOnline}
        onLogout={handleLogout}
        onOpenCwmGuide={() => setIsCwmGuideOpen(true)}
        onSyncSheets={handleSyncSheets}
        onSwitchUser={handleSwitchUser}
      />

      {/* Mobile Menu Bar trigger */}
      <div className="md:hidden bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between border-t border-slate-800">
        <button
          onClick={() => setIsSidebarMobileOpen(true)}
          className="flex items-center space-x-2 text-xs font-bold text-emerald-400 bg-slate-800 px-3 py-1.5 rounded-lg"
        >
          <Menu className="w-4 h-4" />
          <span>DANH MỤC MENU ({activeTab})</span>
        </button>
        <span className="text-[11px] text-slate-400">
          {currentUser.role === 'ADMIN' ? 'Quản trị viên' : 'Nghiên cứu viên'}
        </span>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          role={currentUser.role}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isOpenMobile={isSidebarMobileOpen}
          onCloseMobile={() => setIsSidebarMobileOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === 'DASHBOARD' && <AdminDashboard key={refreshKey} />}
          {activeTab === 'HOUSEHOLDS' && (
            <HouseholdManagement
              key={refreshKey}
              currentUser={currentUser}
              onRefreshData={handleRefreshData}
            />
          )}
          {activeTab === 'ACCOUNTS' && (
            <AccountManagement
              key={refreshKey}
              currentUser={currentUser}
              onRefreshData={handleRefreshData}
            />
          )}
          {activeTab === 'BC01' && (
            <ModuleBC01
              key={refreshKey}
              currentUser={currentUser}
              onRefreshData={handleRefreshData}
            />
          )}
          {activeTab === 'BC02' && (
            <ModuleBC02
              key={refreshKey}
              currentUser={currentUser}
              onRefreshData={handleRefreshData}
            />
          )}
          {activeTab === 'BC03' && (
            <ModuleBC03
              key={refreshKey}
              currentUser={currentUser}
              onRefreshData={handleRefreshData}
            />
          )}
          {activeTab === 'BC04' && (
            <ModuleBC04
              key={refreshKey}
              currentUser={currentUser}
              onOpenCwmGuide={() => setIsCwmGuideOpen(true)}
              onRefreshData={handleRefreshData}
            />
          )}
          {activeTab === 'BC05' && (
            <ModuleBC05
              key={refreshKey}
              currentUser={currentUser}
              onRefreshData={handleRefreshData}
            />
          )}
          {activeTab === 'BC06' && (
            <ModuleBC06
              key={refreshKey}
              currentUser={currentUser}
              onRefreshData={handleRefreshData}
            />
          )}
          {activeTab === 'BC07' && (
            <ModuleBC07
              key={refreshKey}
              currentUser={currentUser}
              onRefreshData={handleRefreshData}
            />
          )}
          {activeTab === 'BC08' && <ModuleBC08 key={refreshKey} />}
          {activeTab === 'ANALYSIS' && <AnalysisPage key={refreshKey} />}
          {activeTab === 'EXPORT' && <ExportPage key={refreshKey} />}
          {activeTab === 'GOOGLE_SHEETS' && (
            <GoogleSheetsSync
              key={refreshKey}
              currentUser={currentUser}
              onRefreshData={handleRefreshData}
            />
          )}
          {activeTab === 'AUDIT_LOG' && <AuditLogPage key={refreshKey} />}
          {activeTab === 'SETTINGS' && (
            <SettingsPage
              key={refreshKey}
              currentUser={currentUser}
              onRefreshData={handleRefreshData}
            />
          )}
        </main>
      </div>

      <CwmGuideModal
        isOpen={isCwmGuideOpen}
        onClose={() => setIsCwmGuideOpen(false)}
      />
    </div>
  );
}
