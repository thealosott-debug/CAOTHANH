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
  FileSpreadsheet,
  Download,
  Users,
  GraduationCap,
  Layers,
  Info,
} from 'lucide-react';
import { ResearchConfig, User } from '../types';
import { StorageService } from '../services/storage';
import { ExcelImportModal, ImportTab } from '../components/ExcelImportModal';
import { ExcelImportService } from '../services/excelImportService';

interface SettingsPageProps {
  currentUser: User;
  onRefreshData?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ currentUser, onRefreshData }) => {
  const [config, setConfig] = useState<ResearchConfig>(StorageService.getConfig());
  const [saveMsg, setSaveMsg] = useState('');
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<ImportTab>('HOUSEHOLDS');

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
      'CẢNH BÁO QUAN TRỌNG!\n\nBạn sắp xóa sạch toàn bộ dữ liệu khảo sát (BC01-BC07) để chuẩn bị thu thập dữ liệu thực địa mới.\nDanh sách các hộ và tài khoản vẫn được giữ nguyên.\n\nBạn có chắc chắn muốn thực hiện?'
    );
    if (!confirmClear) return;

    StorageService.clearResearchData();
    alert('Đã xóa sạch dữ liệu nghiên cứu để bắt đầu khảo sát mới!');
    if (onRefreshData) onRefreshData();
  };

  const handleResetCleanAll = async () => {
    const confirmClean = window.confirm(
      'XÁC NHẬN XÓA TOÀN BỘ DỮ LIỆU NỀN MẪU:\n\n' +
      '• Xóa sạch danh sách hộ kinh doanh, người nghiên cứu, các phiếu khảo sát.\n' +
      '• Đưa toàn bộ hệ thống về trạng thái sạch 100% để bạn tự nhập dữ liệu thực tế.\n' +
      '• Chỉ giữ lại tài khoản Quản trị viên (admin / admin123) để đăng nhập.\n\n' +
      'Bạn có chắc chắn muốn thực hiện?'
    );
    if (!confirmClean) return;

    await StorageService.resetToCleanState();
    alert('Đã xóa toàn bộ dữ liệu nền mẫu thành công! Ứng dụng đã sẵn sàng nhận dữ liệu thực tế.');
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

      {/* 2. Khởi tạo & Nhập dữ liệu từ Excel */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
            <h2 className="text-base font-extrabold text-slate-900 uppercase">
              2. KHỞI TẠO & NHẬP DỮ LIỆU TỪ EXCEL (THỰC ĐỊA & CÁN BỘ)
            </h2>
          </div>
          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 w-fit">
            Hỗ trợ .xlsx, .xls, .csv
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Nạp danh sách <strong>Hộ chăn nuôi</strong> và <strong>Người hướng dẫn / Nghiên cứu viên</strong> từ tệp Excel chuẩn hóa. Hệ thống tự động phân tích cú pháp tiếng Việt có dấu/không dấu, kiểm tra hợp lệ dữ liệu và tạo tài khoản an toàn cho từng đối tượng.
        </p>

        {/* 3 Import Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Card 1: Hộ chăn nuôi */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 hover:border-emerald-300 transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 uppercase">
                  40 Hộ
                </span>
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">Danh sách Hộ chăn nuôi</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Nạp danh sách hộ, phân nhóm TN &amp; ĐC, quy mô đàn, loại vật nuôi và cán bộ phụ trách.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-200/80">
              <button
                type="button"
                onClick={() => {
                  setModalTab('HOUSEHOLDS');
                  setIsExcelModalOpen(true);
                }}
                className="w-full py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors shadow-xs"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                <span>Nhập Hộ chăn nuôi (.xlsx)</span>
              </button>
              <button
                type="button"
                onClick={ExcelImportService.downloadHouseholdTemplate}
                className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-[11px] font-semibold flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Tải file mẫu Hộ (.xlsx)</span>
              </button>
            </div>
          </div>

          {/* Card 2: Người hướng dẫn & Nghiên cứu viên */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 hover:border-slate-400 transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-800 uppercase">
                  Đội ngũ NCKH
                </span>
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">Cán bộ &amp; Hướng dẫn</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Nạp danh sách Người hướng dẫn khoa học, Nghiên cứu viên, học hàm và tự động cấp tài khoản.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-200/80">
              <button
                type="button"
                onClick={() => {
                  setModalTab('SUPERVISORS');
                  setIsExcelModalOpen(true);
                }}
                className="w-full py-2.5 px-3 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors shadow-xs"
              >
                <Users className="w-4 h-4 text-slate-300" />
                <span>Nhập Cán bộ / Hướng dẫn</span>
              </button>
              <button
                type="button"
                onClick={ExcelImportService.downloadResearchTeamTemplate}
                className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-[11px] font-semibold flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Tải mẫu Cán bộ (.xlsx)</span>
              </button>
            </div>
          </div>

          {/* Card 3: File mẫu tổng hợp 2 Sheets */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 hover:border-amber-300 transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 uppercase">
                  2 Sheets
                </span>
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">File mẫu Tổng hợp (2 Sheets)</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tệp Excel tích hợp đầy đủ cả 2 Sheet (Hộ chăn nuôi và Cán bộ) giúp chuẩn bị dữ liệu ngoại tuyến tiện lợi.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-200/80">
              <button
                type="button"
                onClick={ExcelImportService.downloadCombinedTemplate}
                className="w-full py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors shadow-xs"
              >
                <Download className="w-4 h-4 text-amber-100" />
                <span>Tải mẫu Tổng hợp (2 Sheets)</span>
              </button>
              <div className="text-[11px] text-slate-500 text-center py-1 font-medium">
                ✓ Đầy đủ cột chuẩn &amp; mẫu sẵn
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Quản lý Dữ liệu Mẫu (Demo Data) & Làm sạch */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h2 className="text-base font-extrabold text-slate-900 uppercase border-b border-slate-100 pb-3 flex items-center space-x-2">
          <Database className="w-5 h-5 text-emerald-700" />
          <span>3. QUẢN LÝ BỘ DỮ LIỆU MẪU &amp; LÀM SẠCH CƠ SỞ DỮ LIỆU</span>
        </h2>

        <p className="text-xs text-slate-600">
          Hệ thống cung cấp sẵn bộ dữ liệu giả lập 40 hộ chuẩn (H01-H40, 20 TN, 20 ĐC) được tính toán theo quy luật thực nghiệm để kiểm tra toàn bộ dashboard, biểu đồ và bảng tổng hợp BC-08.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3 flex flex-col justify-between">
            <div>
              <div className="font-extrabold text-xs text-emerald-950 flex items-center space-x-1.5">
                <RotateCcw className="w-4 h-4 text-emerald-700" />
                <span>NẠP LẠI DỮ LIỆU DEMO 40 HỘ</span>
              </div>
              <p className="text-xs text-slate-600 mt-2">
                Khôi phục lại dữ liệu mẫu đầy đủ để chạy thử nghiệm các tính năng.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetDemoData}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs w-full"
            >
              Nạp lại dữ liệu DEMO
            </button>
          </div>

          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3 flex flex-col justify-between">
            <div>
              <div className="font-extrabold text-xs text-amber-950 flex items-center space-x-1.5">
                <Trash2 className="w-4 h-4 text-amber-700" />
                <span>LÀM SẠCH PHIẾU KHẢO SÁT</span>
              </div>
              <p className="text-xs text-slate-600 mt-2">
                Xóa sạch các bản ghi khảo sát BC01-BC07, vẫn giữ lại danh sách hộ và tài khoản.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClearResearchData}
              className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs w-full"
            >
              Làm sạch khảo sát
            </button>
          </div>

          <div className="p-4 bg-red-50/80 border-2 border-red-300 rounded-2xl space-y-3 flex flex-col justify-between">
            <div>
              <div className="font-extrabold text-xs text-red-950 flex items-center space-x-1.5">
                <Trash2 className="w-4 h-4 text-red-700" />
                <span>XÓA SẠCH TOÀN BỘ (NHẬP MỚI 100%)</span>
              </div>
              <p className="text-xs text-slate-600 mt-2">
                Xóa toàn bộ hộ kinh doanh, người nghiên cứu và khảo sát. Chỉ giữ tài khoản Admin để nhập dữ liệu thực tế.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetCleanAll}
              className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs w-full"
            >
              Xóa sạch dữ liệu nền
            </button>
          </div>
        </div>
      </div>

      {/* Modal Nhập dữ liệu Excel */}
      <ExcelImportModal
        isOpen={isExcelModalOpen}
        initialTab={modalTab}
        currentUser={currentUser}
        onClose={() => setIsExcelModalOpen(false)}
        onSuccess={() => {
          if (onRefreshData) onRefreshData();
        }}
      />
    </div>
  );
};
