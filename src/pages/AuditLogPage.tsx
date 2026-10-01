import React, { useState } from 'react';
import { ShieldAlert, Search, Filter, Download, Clock, User, FileText } from 'lucide-react';
import { StorageService } from '../services/storage';
import { ExportService } from '../services/exportService';

export const AuditLogPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('ALL');

  const logs = StorageService.getAuditLogs();

  const filtered = logs.filter((log) => {
    const matchesSearch =
      log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.householdId && log.householdId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      log.targetModule.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.reason && log.reason.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesAction = filterAction === 'ALL' || log.action === filterAction;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-6 h-6 text-emerald-600" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              NHẬT KÝ THAO TÁC HỆ THỐNG (AUDIT LOG)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Ghi vết toàn bộ hành động chỉnh sửa, mở khóa, đổi nhóm và đồng bộ để bảo toàn liêm chính dữ liệu NCKH
          </p>
        </div>

        <button
          onClick={() => ExportService.exportAuditLogs()}
          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center space-x-2 transition-colors shadow-xs"
        >
          <Download className="w-4 h-4" />
          <span>XUẤT NHẬT KÝ AUDIT LOG</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tài khoản, mã hộ, lý do..."
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-700">HÀNH ĐỘNG:</span>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white font-bold"
          >
            <option value="ALL">Tất cả hành động</option>
            <option value="CREATE">CREATE (Tạo mới)</option>
            <option value="UPDATE">UPDATE (Cập nhật)</option>
            <option value="UNLOCK">UNLOCK (Mở khóa)</option>
            <option value="RANDOMIZE">RANDOMIZE (Phân nhóm)</option>
            <option value="SYNC">SYNC (Đồng bộ Sheets)</option>
            <option value="RESET">RESET (Làm sạch)</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-900 text-slate-200 uppercase font-extrabold text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">Thời gian</th>
                <th className="py-3 px-3">Tài khoản</th>
                <th className="py-3 px-3">Vai trò</th>
                <th className="py-3 px-3 text-center">Hành động</th>
                <th className="py-3 px-3">Module</th>
                <th className="py-3 px-3">Mã Hộ</th>
                <th className="py-3 px-4">Lý do & Nội dung thay đổi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    Chưa có nhật ký nào phù hợp.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => {
                  const dateStr = new Date(log.timestamp).toLocaleString('vi-VN');
                  return (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {log.username}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            log.userRole === 'ADMIN'
                              ? 'bg-purple-100 text-purple-800'
                              : log.userRole === 'RESEARCHER'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {log.userRole}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] ${
                            log.action === 'CREATE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : log.action === 'UPDATE'
                              ? 'bg-blue-100 text-blue-800'
                              : log.action === 'UNLOCK'
                              ? 'bg-amber-100 text-amber-800'
                              : log.action === 'RANDOMIZE'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-slate-200 text-slate-800'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                        {log.targetModule}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {log.householdId || '-'}
                      </td>
                      <td className="py-2.5 px-4 text-slate-700">
                        <div>{log.reason || 'Cập nhật hệ thống'}</div>
                        {(log.oldValue || log.newValue) && (
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                            {log.oldValue && <span>Cũ: {log.oldValue} → </span>}
                            {log.newValue && <span>Mới: {log.newValue}</span>}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
