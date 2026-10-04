import React from 'react';
import {
  Leaf,
  Wifi,
  WifiOff,
  Cloud,
  CloudUpload,
  BookOpen,
  LogOut,
  User as UserIcon,
  Shield,
  Layers,
  Home
} from 'lucide-react';
import { Role, SyncStatus, User } from '../types';

interface HeaderProps {
  currentUser: User | null;
  syncStatus: SyncStatus;
  isOnline: boolean;
  onLogout: () => void;
  onOpenCwmGuide: () => void;
  onSyncSheets: () => void;
  onOpenUserGuide?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  syncStatus,
  isOnline,
  onLogout,
  onOpenCwmGuide,
  onSyncSheets,
  onOpenUserGuide,
}) => {
  return (
    <header className="bg-emerald-900 text-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shadow-inner">
              <Leaf className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold tracking-wider text-base sm:text-lg text-emerald-100">
                  GREEN FARM RESEARCH
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold bg-emerald-700/80 text-emerald-200 rounded-full border border-emerald-600">
                  NCKH 2026
                </span>
              </div>
              <p className="text-[11px] text-emerald-300/90 truncate max-w-[200px] sm:max-w-md">
                Quản lý Nghiên cứu Cam kết Xanh & Quản lý Chất thải
              </p>
            </div>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Online / Offline status */}
            <div
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                isOnline
                  ? 'bg-emerald-800/80 border-emerald-700 text-emerald-200'
                  : 'bg-red-900/80 border-red-700 text-red-200 animate-pulse'
              }`}
              title={isOnline ? 'Đã kết nối Internet' : 'Mất kết nối mạng - Dữ liệu đang được lưu tạm cục bộ'}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden md:inline">Trực tuyến</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-red-400" />
                  <span>Ngoại tuyến</span>
                </>
              )}
            </div>

            {/* Google Sheets Sync Indicator */}
            {currentUser?.role !== 'HOUSEHOLD' && (
              <button
                onClick={onSyncSheets}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  syncStatus === 'SYNCED'
                    ? 'bg-emerald-800/60 border-emerald-600 text-emerald-200 hover:bg-emerald-700'
                    : syncStatus === 'SYNCING'
                    ? 'bg-blue-800/60 border-blue-500 text-blue-200 animate-pulse'
                    : 'bg-amber-800/60 border-amber-600 text-amber-200 hover:bg-amber-700'
                }`}
                title="Bấm để đồng bộ 17 Sheets lên Google Sheets"
              >
                {syncStatus === 'SYNCING' ? (
                  <CloudUpload className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Cloud className="w-3.5 h-3.5 text-emerald-300" />
                )}
                <span className="hidden lg:inline">
                  {syncStatus === 'SYNCED'
                    ? 'Sheets: Đã đồng bộ'
                    : syncStatus === 'SYNCING'
                    ? 'Đang đồng bộ...'
                    : 'Sheets: Cần đồng bộ'}
                </span>
              </button>
            )}

            {/* Sổ tay CWM Button */}
            <button
              onClick={onOpenCwmGuide}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-800/80 hover:bg-emerald-700 border border-emerald-600/70 text-emerald-100 rounded-xl text-xs font-semibold shadow-xs transition-colors"
              title="Xem Sổ tay hướng dẫn tiêu chuẩn chấm điểm CWM 6 tiêu chí"
            >
              <BookOpen className="w-4 h-4 text-emerald-300" />
              <span className="hidden sm:inline">Sổ tay CWM</span>
            </button>

            {/* Hướng dẫn sử dụng chi tiết Button */}
            {onOpenUserGuide && (
              <button
                onClick={onOpenUserGuide}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-950/40 border border-emerald-500/60 transition-all"
                title="Mở Sổ tay hướng dẫn sử dụng toàn diện chi tiết nhất"
              >
                <BookOpen className="w-4 h-4 text-emerald-200" />
                <span className="hidden md:inline">Hướng dẫn sử dụng</span>
              </button>
            )}

            {/* User Profile & Role Badge */}
            {currentUser && (
              <div className="flex items-center space-x-2 pl-1 border-l border-emerald-800">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-white truncate max-w-[130px]">
                    {currentUser.fullName}
                  </p>
                  <div className="flex items-center justify-end space-x-1">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                        currentUser.role === 'ADMIN'
                          ? 'bg-purple-900/80 text-purple-200 border border-purple-700'
                          : currentUser.role === 'SUPERVISOR'
                          ? 'bg-amber-900/80 text-amber-200 border border-amber-700'
                          : currentUser.role === 'RESEARCHER'
                          ? 'bg-blue-900/80 text-blue-200 border border-blue-700'
                          : 'bg-emerald-900/80 text-emerald-200 border border-emerald-700'
                      }`}
                    >
                      {currentUser.role === 'ADMIN'
                        ? 'ADMIN'
                        : currentUser.role === 'SUPERVISOR'
                        ? 'HƯỚNG DẪN'
                        : currentUser.role === 'RESEARCHER'
                        ? 'NC VIÊN'
                        : `HỘ ${currentUser.householdId}`}
                    </span>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={onLogout}
                  className="p-1.5 rounded-xl bg-emerald-800/80 hover:bg-red-700 text-emerald-200 hover:text-white transition-colors"
                  title="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
