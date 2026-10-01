import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, CheckCircle, Filter, ShieldCheck, Database } from 'lucide-react';
import { ExportService } from '../services/exportService';
import { StudyGroup } from '../types';

export const ExportPage: React.FC = () => {
  const [filterGroup, setFilterGroup] = useState<StudyGroup | 'ALL'>('ALL');
  const [lastExport, setLastExport] = useState<string>('');

  const handleExport = (type: string, fn: () => void) => {
    fn();
    setLastExport(`Đã xuất thành công: ${type} lúc ${new Date().toLocaleTimeString('vi-VN')}`);
    setTimeout(() => setLastExport(''), 4000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <Download className="w-6 h-6 text-emerald-600" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              TRUNG TÂM XUẤT BÁO CÁO & DỮ LIỆU NGHIÊN CỨU
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Định dạng CSV có UTF-8 BOM hiển thị chuẩn 100% tiếng Việt trên Microsoft Excel, SPSS, R, Python
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-700">LỌC NHÓM XUẤT:</span>
          <select
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value as any)}
            className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white font-bold"
          >
            <option value="ALL">Tất cả (40 hộ)</option>
            <option value="TN">Nhóm Can thiệp (TN)</option>
            <option value="DC">Nhóm Đối chứng (ĐC)</option>
          </select>
        </div>
      </div>

      {lastExport && (
        <div className="p-3.5 bg-emerald-600 text-white rounded-xl text-xs font-bold text-center animate-in fade-in">
          ✓ {lastExport}
        </div>
      )}

      {/* 5 Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Export 1: BC-08 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between space-y-4 hover:border-emerald-500 transition-colors">
          <div>
            <div className="flex items-center space-x-2 text-emerald-800 font-extrabold text-sm mb-1">
              <FileSpreadsheet className="w-5 h-5" />
              <span>1. BẢNG TỔNG HỢP BC-08 CỐT LÕI</span>
            </div>
            <p className="text-xs text-slate-600">
              Xuất danh sách 40 hộ với đầy đủ K, T, YĐ, HT_pre, CWM_pre, HT_post, CWM_post, ΔCWM và 6 tuần theo dõi. Sẵn sàng nhập vào SPSS để chạy t-test.
            </p>
          </div>
          <button
            onClick={() => handleExport('BC-08 Tổng hợp', () => ExportService.exportBC08(filterGroup))}
            className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>[XUẤT BC-08 TỔNG HỢP]</span>
          </button>
        </div>

        {/* Export 2: Khảo sát KAP */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between space-y-4 hover:border-emerald-500 transition-colors">
          <div>
            <div className="flex items-center space-x-2 text-blue-800 font-extrabold text-sm mb-1">
              <FileText className="w-5 h-5" />
              <span>2. DỮ LIỆU KHẢO SÁT (BC-02 & BC-07)</span>
            </div>
            <p className="text-xs text-slate-600">
              Bảng chi tiết điểm kiến thức từng câu, điểm thái độ Likert, hành vi tự báo cáo trước và sau can thiệp, mức độ sẵn sàng duy trì và cảm nhận.
            </p>
          </div>
          <button
            onClick={() => handleExport('Khảo sát KAP', () => ExportService.exportSurveys())}
            className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>[XUẤT DỮ LIỆU KHẢO SÁT]</span>
          </button>
        </div>

        {/* Export 3: Quan sát thực tế CWM */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between space-y-4 hover:border-emerald-500 transition-colors">
          <div>
            <div className="flex items-center space-x-2 text-purple-800 font-extrabold text-sm mb-1">
              <FileSpreadsheet className="w-5 h-5" />
              <span>3. DỮ LIỆU QUAN SÁT THỰC ĐỊA CWM (BC-04)</span>
            </div>
            <p className="text-xs text-slate-600">
              Chi tiết 6 tiêu chí B1-B6 thực tế tại chuồng nuôi trước và sau can thiệp, mô tả thực địa, bằng chứng cụ thể và nguyên nhân không đạt.
            </p>
          </div>
          <button
            onClick={() => handleExport('Quan sát CWM', () => ExportService.exportCWM())}
            className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>[XUẤT DỮ LIỆU CWM]</span>
          </button>
        </div>

        {/* Export 4: Báo cáo 6 tuần */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between space-y-4 hover:border-emerald-500 transition-colors">
          <div>
            <div className="flex items-center space-x-2 text-teal-800 font-extrabold text-sm mb-1">
              <FileText className="w-5 h-5" />
              <span>4. DỮ LIỆU THEO DÕI 6 TUẦN (BC-06)</span>
            </div>
            <p className="text-xs text-slate-600">
              Dữ liệu chuỗi thời gian 6 tuần (W1 - W6) của nhóm TN, điểm hành vi hằng tuần và bảng thống kê các khó khăn/rào cản phát sinh.
            </p>
          </div>
          <button
            onClick={() => handleExport('Theo dõi 6 tuần', () => ExportService.exportWeeklyReports())}
            className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>[XUẤT THEO DÕI 6 TUẦN]</span>
          </button>
        </div>

        {/* Export 5: Audit Log */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between space-y-4 hover:border-emerald-500 transition-colors md:col-span-2">
          <div>
            <div className="flex items-center space-x-2 text-amber-800 font-extrabold text-sm mb-1">
              <ShieldCheck className="w-5 h-5 text-amber-600" />
              <span>5. BÁO CÁO KIỂM SOÁT LIÊM CHÍNH (AUDIT LOG)</span>
            </div>
            <p className="text-xs text-slate-600">
              Xuất toàn bộ nhật ký thao tác người dùng, thời gian sửa đổi, lý do mở khóa và thay đổi nhóm để nộp kèm hồ sơ nghiệm thu đề tài NCKH.
            </p>
          </div>
          <button
            onClick={() => handleExport('Audit Log', () => ExportService.exportAuditLogs())}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>[XUẤT NHẬT KÝ AUDIT LOG]</span>
          </button>
        </div>
      </div>
    </div>
  );
};
