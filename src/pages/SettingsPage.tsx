import React, { useState } from 'react';
import {
  Settings,
  Database,
  Save,
  RotateCcw,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import { ResearchConfig, User } from '../types';
import { StorageService } from '../services/storage';

interface SettingsPageProps {
  currentUser: User;
  onRefreshData?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ currentUser, onRefreshData }) => {
  const [config, setConfig] = useState<ResearchConfig>(StorageService.getConfig());
  const [saveMsg, setSaveMsg] = useState('');

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveConfig(config);
    StorageService.addAuditLog({
      userId: currentUser.id,
      username: currentUser.username,
      userRole: currentUser.role,
      action: 'UPDATE',
      targetModule: 'CONFIG',
      reason: 'Cập nhật tham số cấu hình hệ thống nghiên cứu.',
    });
    setSaveMsg('Đã lưu cấu hình nghiên cứu thành công!');
    setTimeout(() => {
      setSaveMsg('');
      if (onRefreshData) onRefreshData();
    }, 2000);
  };

  const handleResetDemoData = async () => {
    const confirmReset = window.confirm(
      'BẠN CÓ CHẮC CHẮN MUỐN NẠP LẠI BỘ DỮ LIỆU DEMO 40 HỘ?\n\n- Toàn bộ hồ sơ 40 hộ chuẩn (20 TN, 20 ĐC) cùng khảo sát KAP, quan sát CWM và 6 tuần theo dõi mẫu sẽ được tái lập.\n- Thao tác này rất thuận tiện cho việc trình diễn và nghiệm thu đề tài.'
    );
    if (!confirmReset) return;

    await StorageService.resetToDemoData();
    alert('Đã nạp lại bộ dữ liệu DEMO 40 hộ chuẩn thành công!');
    if (onRefreshData) onRefreshData();
  };

  const handleClearResearchData = () => {
    const confirmClear = window.confirm(
      'CẢNH BÁO QUAN TRỌNG!\n\nBạn sắp xóa sạch toàn bộ dữ liệu khảo sát (BC01-BC07) để chuẩn bị thu thập dữ liệu thực địa mới.\nDanh sách 40 hộ và tài khoản vẫn được giữ nguyên.\n\nBạn có chắc chắn muốn thực hiện?'
    );
    if (!confirmClear) return;

    StorageService.clearResearchData();
    alert('Đã xóa sạch dữ liệu nghiên cứu để bắt đầu khảo sát mới!');
    if (onRefreshData) onRefreshData();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-2">
          <Settings className="w-6 h-6 text-emerald-600" />
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            CÀI ĐẶT THAM SỐ NGHIÊN CỨU & DỮ LIỆU
          </h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Cấu hình tham số nghiên cứu theo đề cương • Quản lý bộ dữ liệu mẫu (DEMO) và dữ liệu thực địa
        </p>
      </div>

      {saveMsg && (
        <div className="p-3.5 bg-emerald-600 text-white rounded-xl text-xs font-bold text-center animate-in fade-in">
          ✓ {saveMsg}
        </div>
      )}

      {/* Form Cấu hình */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h2 className="text-base font-extrabold text-slate-900 uppercase border-b border-slate-100 pb-3">
          1. THAM SỐ ĐỀ TÀI NGHIÊN CỨU
        </h2>

        <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">TÊN ĐỀ TÀI NGHIÊN CỨU *</label>
            <input
              type="text"
              value={config.researchTitle}
              onChange={(e) => setConfig({ ...config, researchTitle: e.target.value })}
              className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 font-bold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">NGÀY BẮT ĐẦU NGHIÊN CỨU</label>
              <input
                type="date"
                value={config.startDate}
                onChange={(e) => setConfig({ ...config, startDate: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2.5"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">NGÀY KẾT THÚC DỰ KIẾN</label>
              <input
                type="date"
                value={config.endDate}
                onChange={(e) => setConfig({ ...config, endDate: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">TỔNG SỐ HỘ</label>
              <input
                type="number"
                value={config.totalHouseholds}
                onChange={(e) => setConfig({ ...config, totalHouseholds: Number(e.target.value) })}
                className="w-full border border-slate-300 rounded-xl p-2.5 font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">SỐ HỘ TN</label>
              <input
                type="number"
                value={config.tnTarget}
                onChange={(e) => setConfig({ ...config, tnTarget: Number(e.target.value) })}
                className="w-full border border-slate-300 rounded-xl p-2.5 font-bold text-emerald-700"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">SỐ HỘ ĐC</label>
              <input
                type="number"
                value={config.dcTarget}
                onChange={(e) => setConfig({ ...config, dcTarget: Number(e.target.value) })}
                className="w-full border border-slate-300 rounded-xl p-2.5 font-bold text-teal-700"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">SỐ TUẦN THEO DÕI</label>
              <input
                type="number"
                value={config.totalWeeks}
                onChange={(e) => setConfig({ ...config, totalWeeks: Number(e.target.value) })}
                className="w-full border border-slate-300 rounded-xl p-2.5 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">NGÀY GỬI NHẮC NHỞ TUẦN</label>
              <input
                type="text"
                value={config.reminderDay}
                onChange={(e) => setConfig({ ...config, reminderDay: e.target.value })}
                placeholder="Chủ nhật"
                className="w-full border border-slate-300 rounded-xl p-2.5"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">GIỜ GỬI THÔNG BÁO</label>
              <input
                type="text"
                value={config.reminderTime}
                onChange={(e) => setConfig({ ...config, reminderTime: e.target.value })}
                placeholder="19:00"
                className="w-full border border-slate-300 rounded-xl p-2.5"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold flex items-center space-x-1.5 shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>LƯU CẤU HÌNH</span>
            </button>
          </div>
        </form>
      </div>

      {/* Quản lý Dữ liệu Mẫu (Demo Data) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h2 className="text-base font-extrabold text-slate-900 uppercase border-b border-slate-100 pb-3 flex items-center space-x-2">
          <Database className="w-5 h-5 text-emerald-700" />
          <span>2. QUẢN LÝ DỮ LIỆU MẪU (DEMO DATA)</span>
        </h2>

        <p className="text-xs text-slate-600">
          Hệ thống cung cấp sẵn bộ dữ liệu giả lập 40 hộ chuẩn (H01-H40, 20 TN, 20 ĐC) được tính toán theo quy luật thực nghiệm để kiểm tra toàn bộ dashboard, biểu đồ và bảng tổng hợp BC-08.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
            <div className="font-extrabold text-xs text-emerald-950 flex items-center space-x-1.5">
              <RotateCcw className="w-4 h-4 text-emerald-700" />
              <span>TẢI LẠI TOÀN BỘ DỮ LIỆU DEMO 40 HỘ</span>
            </div>
            <p className="text-xs text-slate-600">
              Khôi phục lại dữ liệu mẫu đầy đủ cho 40 hộ, bao gồm kết quả khảo sát KAP, CWM trước/sau và 6 tuần theo dõi.
            </p>
            <button
              type="button"
              onClick={handleResetDemoData}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
            >
              Nạp lại dữ liệu DEMO
            </button>
          </div>

          <div className="p-4 bg-red-50/70 border border-red-200 rounded-2xl space-y-3">
            <div className="font-extrabold text-xs text-red-950 flex items-center space-x-1.5">
              <Trash2 className="w-4 h-4 text-red-700" />
              <span>LÀM SẠCH DỮ LIỆU ĐỂ THU THẬP THỰC TẾ</span>
            </div>
            <p className="text-xs text-slate-600">
              Xóa sạch các bản ghi khảo sát và quan sát để chuẩn bị bắt đầu thu thập dữ liệu thật tại địa bàn nghiên cứu.
            </p>
            <button
              type="button"
              onClick={handleClearResearchData}
              className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
            >
              Làm sạch dữ liệu khảo sát
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
