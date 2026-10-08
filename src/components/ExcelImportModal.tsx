import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle,
  AlertTriangle,
  XCircle,
  X,
  FileCheck,
  Users,
  GraduationCap,
  Layers,
  RefreshCw,
  Info,
  Shield,
  Home,
  Check,
} from 'lucide-react';
import { User } from '../types';
import {
  ExcelImportService,
  ParsedHouseholdRow,
  ParsedUserRow,
  UnifiedParseResult,
} from '../services/excelImportService';

export type ImportTab = 'ALL' | 'SUPERVISORS' | 'RESEARCHERS' | 'HOUSEHOLDS';

interface ExcelImportModalProps {
  isOpen: boolean;
  initialTab?: 'HOUSEHOLDS' | 'RESEARCH_TEAM' | string;
  currentUser: User;
  onClose: () => void;
  onSuccess: () => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  initialTab = 'ALL',
  currentUser,
  onClose,
  onSuccess,
}) => {
  const [activeFilter, setActiveFilter] = useState<ImportTab>('ALL');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);

  // Kết quả phân tích tổng hợp đa bảng tính
  const [parseResult, setParseResult] = useState<UnifiedParseResult | null>(null);

  // Chế độ nhập (Gộp hoặc Thay thế)
  const [importMode, setImportMode] = useState<'MERGE' | 'REPLACE'>('MERGE');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Xử lý khi chọn file
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const processFile = async (file: File) => {
    setSelectedFile(file);
    setIsParsing(true);
    setParseError(null);
    setImportSuccessMsg(null);
    setParseResult(null);

    try {
      const result = await ExcelImportService.parseUniversalFile(file);
      setParseResult(result);
      if (result.totalRows === 0) {
        setParseError('Tệp không chứa dòng dữ liệu nào sau dòng tiêu đề.');
      }
    } catch (err: any) {
      setParseError(err.message || 'Không thể đọc tệp Excel. Vui lòng kiểm tra định dạng.');
    } finally {
      setIsParsing(false);
    }
  };

  // Kéo thả file
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  // Xác nhận nhập dữ liệu vào hệ thống
  const handleConfirmImport = async () => {
    if (!parseResult) return;
    setIsSaving(true);
    setParseError(null);

    try {
      const res = await ExcelImportService.saveUniversalImport(
        parseResult,
        importMode,
        currentUser
      );

      setImportSuccessMsg(
        `✓ ĐÃ NHẬP THÀNH CÔNG VÀO HỆ THỐNG:\n` +
        `• ${res.usersCount} tài khoản đăng nhập (mật khẩu mặc định: 123456)\n` +
        `  - ${res.supervisorsCount} Giảng viên (GV) & Cán bộ hướng dẫn (HDAN)\n` +
        `  - ${res.researchersCount} Học sinh / Học viên (HS)\n` +
        `  - ${res.householdsAccountCount} Tài khoản Hộ chăn nuôi gà\n` +
        `• ${res.householdsCount} Hồ sơ Hộ chăn nuôi gà & Phiếu BC-01 liên thông\n` +
        `• Đã kích hoạt đồng bộ lưu trữ vĩnh viễn lên Google Sheets!`
      );

      onSuccess();
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (err: any) {
      setParseError(`Lỗi khi lưu dữ liệu: ${err.message || 'Có lỗi xảy ra'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Lọc danh sách hiển thị
  const displayedUsers = parseResult
    ? parseResult.users.filter((u) => {
        if (activeFilter === 'ALL') return true;
        if (activeFilter === 'SUPERVISORS') return u.role === 'SUPERVISOR';
        if (activeFilter === 'RESEARCHERS') return u.role === 'RESEARCHER';
        if (activeFilter === 'HOUSEHOLDS') return u.role === 'HOUSEHOLD';
        return true;
      })
    : [];

  const validCount = parseResult?.counts.validCount || 0;
  const errorCount = parseResult?.counts.errorCount || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full p-4 sm:p-6 space-y-4 my-6 max-h-[92vh] flex flex-col border border-slate-100 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                TẢI TỆP DỮ LIỆU TÀI KHOẢN (HDAN, GV, HS, HỘ CHĂN NUÔI)
              </h2>
              <p className="text-xs text-slate-500">
                Tự động nhận diện đa bảng tính (.xlsx, .xls, .csv), kiểm tra hợp lệ và liên thông trực tiếp với Google Sheets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nút tải tệp mẫu chuẩn */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 shrink-0">
          <span className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
            <Download className="w-4 h-4 text-emerald-600" />
            <span>TẢI TỆP MẪU EXCEL CHUẨN:</span>
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={ExcelImportService.downloadCombinedTemplate}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-2xs"
              title="File mẫu chuẩn chứa đầy đủ Giảng viên, Học viên, Hướng dẫn và Hộ chăn nuôi"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Mẫu Tổng Hợp Đầy Đủ (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={ExcelImportService.downloadHouseholdTemplate}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-2xs"
              title="Tải mẫu bảng tính riêng cho Hộ chăn nuôi gà"
            >
              <Home className="w-3.5 h-3.5 text-emerald-600" />
              <span>Mẫu Hộ chăn nuôi</span>
            </button>

            <button
              type="button"
              onClick={ExcelImportService.downloadResearchTeamTemplate}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-2xs"
              title="Tải mẫu cán bộ hướng dẫn, giảng viên và học viên"
            >
              <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
              <span>Mẫu GV &amp; HS &amp; HDAN</span>
            </button>
          </div>
        </div>

        {/* Banner thông báo thành công */}
        {importSuccessMsg && (
          <div className="p-4 bg-emerald-50 border-2 border-emerald-400 rounded-2xl text-xs font-bold text-emerald-900 space-y-1 animate-in fade-in">
            <div className="flex items-center space-x-2 text-emerald-700 font-extrabold text-sm">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span>NHẬP DỮ LIỆU THÀNH CÔNG!</span>
            </div>
            <pre className="font-sans whitespace-pre-wrap leading-relaxed text-emerald-800">
              {importSuccessMsg}
            </pre>
          </div>
        )}

        {/* Vùng kéo thả tệp */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/70 rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2 group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 mx-auto rounded-2xl bg-white shadow-xs border border-emerald-200 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              {isParsing ? (
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
              ) : (
                <Upload className="w-6 h-6" />
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                {selectedFile ? selectedFile.name : 'Bấm để chọn file hoặc kéo thả tệp Excel/CSV vào đây'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Hỗ trợ tệp <strong>.xlsx, .xls, .csv</strong>. Tự động nhận diện tất cả các vai trò: <strong>HDAN, GV, HS, Hộ chăn nuôi</strong> và đọc nhiều bảng tính cùng lúc.
              </p>
            </div>
          </div>

          {/* Thông báo lỗi */}
          {parseError && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-start space-x-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="font-medium whitespace-pre-line">{parseError}</div>
            </div>
          )}

          {/* Kết quả đọc dữ liệu */}
          {parseResult && parseResult.totalRows > 0 && (
            <div className="space-y-3 animate-in fade-in">
              {/* Thống kê các nhóm đối tượng tìm thấy */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl">
                  <div className="text-[11px] font-bold text-amber-800 uppercase">Cán bộ / Giảng viên</div>
                  <div className="text-lg font-black text-amber-900 mt-0.5">
                    {parseResult.counts.supervisors}{' '}
                    <span className="text-xs font-normal text-amber-700">(HDAN, GV)</span>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-3 rounded-2xl">
                  <div className="text-[11px] font-bold text-blue-800 uppercase">Học sinh / Học viên</div>
                  <div className="text-lg font-black text-blue-900 mt-0.5">
                    {parseResult.counts.researchers}{' '}
                    <span className="text-xs font-normal text-blue-700">(HS, SV)</span>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl">
                  <div className="text-[11px] font-bold text-emerald-800 uppercase">Hộ chăn nuôi gà</div>
                  <div className="text-lg font-black text-emerald-900 mt-0.5">
                    {parseResult.counts.households}{' '}
                    <span className="text-xs font-normal text-emerald-700">(Hộ dân)</span>
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 p-3 rounded-2xl">
                  <div className="text-[11px] font-bold text-purple-800 uppercase">Quản trị viên / Khác</div>
                  <div className="text-lg font-black text-purple-900 mt-0.5">
                    {parseResult.counts.admins}{' '}
                    <span className="text-xs font-normal text-purple-700">(Admin)</span>
                  </div>
                </div>
              </div>

              {/* Bộ lọc xem nhanh */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <div className="flex p-1 bg-slate-100 rounded-xl space-x-1 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setActiveFilter('ALL')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      activeFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Tất cả ({parseResult.totalRows})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFilter('SUPERVISORS')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      activeFilter === 'SUPERVISORS' ? 'bg-white text-amber-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    HDAN &amp; GV ({parseResult.counts.supervisors})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFilter('RESEARCHERS')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      activeFilter === 'RESEARCHERS' ? 'bg-white text-blue-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Học sinh (HS) ({parseResult.counts.researchers})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFilter('HOUSEHOLDS')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      activeFilter === 'HOUSEHOLDS' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Hộ chăn nuôi ({parseResult.counts.households})
                  </button>
                </div>

                <div className="text-xs text-slate-500">
                  Các sheet nhận diện: <strong>{parseResult.sheetNames.join(', ')}</strong>
                </div>
              </div>

              {/* Bảng xem trước dữ liệu */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-900 text-slate-200 uppercase font-extrabold text-[11px] sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">STT</th>
                      <th className="py-2.5 px-3">Tên đăng nhập</th>
                      <th className="py-2.5 px-3">Họ và tên</th>
                      <th className="py-2.5 px-3">Vai trò nhận diện</th>
                      <th className="py-2.5 px-3">Đơn vị / Địa chỉ</th>
                      <th className="py-2.5 px-3">Số ĐT</th>
                      <th className="py-2.5 px-3">Mật khẩu</th>
                      <th className="py-2.5 px-3">Hợp lệ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedUsers.map((r, idx) => (
                      <tr
                        key={idx}
                        className={r.isValid ? 'hover:bg-slate-50' : 'bg-red-50/70'}
                      >
                        <td className="py-2 px-3 font-mono text-slate-400">{r.rowNumber}</td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">{r.username}</td>
                        <td className="py-2 px-3 font-semibold">{r.fullName}</td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                              r.role === 'ADMIN'
                                ? 'bg-purple-100 text-purple-800'
                                : r.role === 'SUPERVISOR'
                                ? 'bg-amber-100 text-amber-800'
                                : r.role === 'RESEARCHER'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {r.roleTitle || r.role}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-600">{r.organization || r.address || '-'}</td>
                        <td className="py-2 px-3 font-mono">{r.phone || '-'}</td>
                        <td className="py-2 px-3 font-mono text-slate-600">{r.password || '123456'}</td>
                        <td className="py-2 px-3">
                          {r.isValid ? (
                            <span className="inline-flex items-center text-emerald-700 font-bold text-[11px]">
                              <CheckCircle className="w-3.5 h-3.5 mr-1" /> Hợp lệ
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center text-red-600 font-bold text-[11px]"
                              title={r.errors.join('; ')}
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" /> {r.errors[0]}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Tùy chọn Gộp hoặc Thay thế */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
                <span className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px] block">
                  CẤU HÌNH ĐỒNG BỘ VÀO HỆ THỐNG
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-start space-x-2.5 p-2.5 rounded-xl border border-slate-200 bg-white cursor-pointer hover:border-emerald-400">
                    <input
                      type="radio"
                      name="importMode"
                      value="MERGE"
                      checked={importMode === 'MERGE'}
                      onChange={() => setImportMode('MERGE')}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <div className="font-bold text-slate-900">Gộp dữ liệu thông minh (Khuyên dùng)</div>
                      <div className="text-[11px] text-slate-500">
                        Thêm mới và cập nhật các dòng theo mã, bảo toàn toàn bộ tài khoản và phiếu khảo sát cũ.
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start space-x-2.5 p-2.5 rounded-xl border border-slate-200 bg-white cursor-pointer hover:border-red-400">
                    <input
                      type="radio"
                      name="importMode"
                      value="REPLACE"
                      checked={importMode === 'REPLACE'}
                      onChange={() => setImportMode('REPLACE')}
                      className="mt-0.5 text-red-600 focus:ring-red-500"
                    />
                    <div>
                      <div className="font-bold text-red-700">Thay thế toàn bộ danh sách</div>
                      <div className="text-[11px] text-slate-500">
                        Thay thế toàn bộ danh sách bằng dữ liệu mới từ tệp (chỉ giữ lại tài khoản Admin tối cao).
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
          >
            Đóng
          </button>

          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={!parseResult || validCount === 0 || isSaving}
            className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white font-bold rounded-xl text-xs flex items-center space-x-2 shadow-md transition-all"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Đang lưu và đồng bộ lên Google Sheets...</span>
              </>
            ) : (
              <>
                <FileCheck className="w-4 h-4" />
                <span>
                  XÁC NHẬN NHẬP TẤT CẢ {validCount} TÀI KHOẢN VÀO HỆ THỐNG
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
