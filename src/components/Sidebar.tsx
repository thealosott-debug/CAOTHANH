import React from 'react';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  FileText,
  Eye,
  CheckSquare,
  CalendarDays,
  FileCheck2,
  TableProperties,
  BarChart3,
  Download,
  Sheet,
  ShieldAlert,
  Settings,
  X,
  Sparkles,
} from 'lucide-react';
import { Role } from '../types';

export type ActiveTab =
  | 'DASHBOARD'
  | 'HOUSEHOLDS'
  | 'ACCOUNTS'
  | 'BC01'
  | 'BC02'
  | 'BC03'
  | 'BC04'
  | 'BC05'
  | 'BC06'
  | 'BC07'
  | 'BC08'
  | 'ANALYSIS'
  | 'EXPORT'
  | 'GOOGLE_SHEETS'
  | 'AUDIT_LOG'
  | 'SETTINGS';

interface SidebarProps {
  role: Role;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  role,
  activeTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
}) => {
  const isAdmin = role === 'ADMIN';
  const isSupervisorOrAdmin = role === 'ADMIN' || role === 'SUPERVISOR';

  const menuItems = [
    { id: 'DASHBOARD' as ActiveTab, label: 'Dashboard Nghiên cứu', icon: LayoutDashboard },
    { id: 'HOUSEHOLDS' as ActiveTab, label: 'Quản lý Hộ chăn nuôi', icon: Users },
    ...(isSupervisorOrAdmin ? [{ id: 'ACCOUNTS' as ActiveTab, label: 'Quản lý Cán bộ & Tài khoản', icon: UserCheck }] : []),
    { id: 'BC01' as ActiveTab, label: 'BC-01: Thông tin hộ', icon: FileText },
    { id: 'BC02' as ActiveTab, label: 'BC-02: Khảo sát KAP trước', icon: FileCheck2 },
    { id: 'BC03' as ActiveTab, label: 'BC-03: Ý định thay đổi', icon: CheckSquare },
    { id: 'BC04' as ActiveTab, label: 'BC-04: Quan sát CWM', icon: Eye, highlight: true },
    { id: 'BC05' as ActiveTab, label: 'BC-05: Cam kết xanh', icon: Sparkles },
    { id: 'BC06' as ActiveTab, label: 'BC-06: Theo dõi 6 tuần', icon: CalendarDays },
    { id: 'BC07' as ActiveTab, label: 'BC-07: Khảo sát sau CT', icon: FileCheck2 },
    { id: 'BC08' as ActiveTab, label: 'BC-08: Bảng tổng hợp', icon: TableProperties, highlight: true },
    { id: 'ANALYSIS' as ActiveTab, label: 'Phân tích TN – ĐC', icon: BarChart3 },
    { id: 'EXPORT' as ActiveTab, label: 'Báo cáo & Xuất Excel', icon: Download },
    { id: 'GOOGLE_SHEETS' as ActiveTab, label: 'Google Sheets (17 Sheet)', icon: Sheet },
    { id: 'AUDIT_LOG' as ActiveTab, label: 'Nhật ký Audit Log', icon: ShieldAlert },
    ...(isAdmin ? [{ id: 'SETTINGS' as ActiveTab, label: 'Cài đặt hệ thống', icon: Settings }] : []),
  ];

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Mobile Header in sidebar */}
        <div className="p-4 flex items-center justify-between border-b border-slate-800 md:hidden">
          <span className="font-bold text-white text-base">Menu Điều hướng</span>
          <button
            onClick={onCloseMobile}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role badge top bar */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Hệ thống Quản lý
          </div>
          <div className="text-sm font-bold text-emerald-400 flex items-center space-x-1.5 mt-0.5">
            <span>{isAdmin ? 'Quản trị viên (Admin)' : 'Nghiên cứu viên'}</span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                } ${item.highlight && !isActive ? 'border border-emerald-800/60 bg-emerald-950/20 text-emerald-300' : ''}`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : item.highlight ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span className="truncate text-left">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Version footer */}
        <div className="p-3 border-t border-slate-800 text-[10px] text-slate-500 text-center">
          Green Farm Research v1.0 • NCKH
        </div>
      </aside>
    </>
  );
};
