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
  ArrowRight,
  RefreshCw,
  Info,
} from 'lucide-react';
import { User } from '../types';
import {
  ExcelImportService,
  ParsedHouseholdRow,
  ParsedUserRow,
} from '../services/excelImportService';

export type ImportTab = 'HOUSEHOLDS' | 'RESEARCH_TEAM';

interface ExcelImportModalProps {
  isOpen: boolean;
  initialTab?: ImportTab;
  currentUser: User;
  onClose: () => void;
  onSuccess: () => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  initialTab = 'HOUSEHOLDS',
  currentUser,
  onClose,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<ImportTab>(initialTab);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Parsed results
  const [parsedHouseholds, setParsedHouseholds] = useState<ParsedHouseholdRow[]>([]);
  const [parsedTeam, setParsedTeam] = useState<ParsedUserRow[]>([]);
  const [sheetName, setSheetName] = useState<string>('');

  // Options
  const [importMode, setImportMode] = useState<'MERGE' | 'REPLACE'>('MERGE');
  const [createHouseholdAccounts, setCreateHouseholdAccounts] = useState(true);

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
    setParsedHouseholds([]);
    setParsedTeam([]);

    try {
      if (activeTab === 'HOUSEHOLDS') {
        const result = await ExcelImportService.parseHouseholdsFile(file);
        setParsedHouseholds(result.rows);
        setSheetName(result.sheetName);
      } else {
        const result = await ExcelImportService.parseResearchTeamFile(file);
        setParsedTeam(result.rows);
        setSheetName(result.sheetName);
      }
    } catch (err: any) {
      setParseError(err.message || 'Không thể đọc tệp Excel. Vui lòng kiểm tra định dạng.');
    } finally {
      setIsParsing(false);
    }
  };

  // Đổi tab
  const handleTabChange = (tab: ImportTab) => {
    setActiveTab(tab);
    setSelectedFile(null);
    setParsedHouseholds([]);
    setParsedTeam([]);
    setParseError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
    setIsSaving(true);
    try {
      if (activeTab === 'HOUSEHOLDS') {
        const res = await ExcelImportService.saveImportedHouseholds(
          parsedHouseholds,
          importMode,
          createHouseholdAccounts,
          currentUser
        );
        alert(
          `✓ Nhập thành công ${res.savedCount} hộ chăn nuôi vào hệ thống!\n` +
            (createHouseholdAccounts ? `✓ Đã tự động tạo ${res.accountsCreated} tài khoản đăng nhập cho các hộ (Mật khẩu mặc định: 123456).` : '')
        );
      } else {
        const res = await ExcelImportService.saveImportedResearchTeam(
          parsedTeam,
          importMode,
          currentUser
        );
        alert(
          `✓ Nhập thành công ${res.savedCount} cán bộ (Người hướng dẫn / Nghiên cứu viên) vào hệ thống!`
        );
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      alert(`Lỗi khi lưu dữ liệu: ${err.message || 'Có lỗi xảy ra'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const validHouseholdCount = parsedHouseholds.filter((r) => r.isValid).length;
  const invalidHouseholdCount = parsedHouseholds.length - validHouseholdCount;

  const validTeamCount = parsedTeam.filter((r) => r.isValid).length;
  const invalidTeamCount = parsedTeam.length - validTeamCount;

  const currentValidCount = activeTab === 'HOUSEHOLDS' ? validHouseholdCount : validTeamCount;
  const hasRows = activeTab === 'HOUSEHOLDS' ? parsedHouseholds.length > 0 : parsedTeam.length > 0;

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
                NHẬP DỮ LIỆU BẰNG TỆP EXCEL / CSV
              </h2>
              <p className="text-xs text-slate-500">
                Tự động đối soát, kiểm tra hợp lệ và nạp dữ liệu khoa học chuẩn
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

        {/* Tab Selection */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 shrink-0">
          <div className="flex p-1 bg-slate-100 rounded-xl space-x-1">
            <button
              onClick={() => handleTabChange('HOUSEHOLDS')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-2 transition-all ${
                activeTab === 'HOUSEHOLDS'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>1. Hộ chăn nuôi ({parsedHouseholds.length})</span>
            </button>
            <button
              onClick={() => handleTabChange('RESEARCH_TEAM')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-2 transition-all ${
                activeTab === 'RESEARCH_TEAM'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>2. Người hướng dẫn &amp; Nghiên cứu viên ({parsedTeam.length})</span>
            </button>
          </div>

          {/* Quick template download buttons */}
          <div className="flex items-center space-x-2">
            {activeTab === 'HOUSEHOLDS' ? (
              <button
                type="button"
                onClick={ExcelImportService.downloadHouseholdTemplate}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-2xs"
                title="Tải mẫu bảng tính Excel gồm các cột chuẩn bị sẵn"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tải file mẫu Hộ (.xlsx)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={ExcelImportService.downloadResearchTeamTemplate}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-2xs"
                title="Tải mẫu cán bộ nghiên cứu & người hướng dẫn"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tải file mẫu Cán bộ (.xlsx)</span>
              </button>
            )}

            <button
              type="button"
              onClick={ExcelImportService.downloadCombinedTemplate}
              className="hidden sm:flex px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold items-center space-x-1 transition-colors"
              title="File mẫu chứa cả 2 sheet Hộ và Cán bộ"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Mẫu tổng hợp (2 Sheets)</span>
            </button>
          </div>
        </div>

        {/* Scrollable Main Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* File Upload Zone */}
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
            <div className="w-12 h-12 rounded-2xl bg-white text-emerald-600 shadow-sm mx-auto flex items-center justify-center group-hover:scale-105 transition-transform">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                {selectedFile ? (
                  <span className="text-emerald-800 font-mono">Đã chọn: {selectedFile.name}</span>
                ) : (
                  <span>Kéo &amp; thả tệp Excel vào đây hoặc <span className="text-emerald-700 underline">bấm để chọn tệp</span></span>
                )}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Hỗ trợ định dạng: <strong>.XLSX</strong>, <strong>.XLS</strong>, hoặc <strong>.CSV</strong> • Dung lượng tối đa: 15MB
              </p>
            </div>
          </div>

          {/* Loading or Parse Error */}
          {isParsing && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs font-bold text-slate-600 flex items-center justify-center space-x-2">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Đang phân tích cấu trúc cột và đối soát dữ liệu tệp Excel...</span>
            </div>
          )}

          {parseError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Không thể đọc tệp Excel:</p>
                <p className="mt-1">{parseError}</p>
                <p className="mt-2 text-[11px] text-red-600">
                  Gợi ý: Hãy bấm nút <strong>"Tải file mẫu Excel"</strong> ở góc trên, điền dữ liệu của bạn vào đúng cột rồi tải lên lại.
                </p>
              </div>
            </div>
          )}

          {/* Preview: HOUSEHOLDS */}
          {activeTab === 'HOUSEHOLDS' && parsedHouseholds.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-900">Sheet: {sheetName}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-emerald-700 font-bold">
                    ✓ {validHouseholdCount} dòng hợp lệ
                  </span>
                  {invalidHouseholdCount > 0 && (
                    <>
                      <span className="text-slate-400">•</span>
                      <span className="text-red-600 font-bold">
                        ⚠ {invalidHouseholdCount} dòng lỗi
                      </span>
                    </>
                  )}
                </div>
                <span className="text-slate-500 text-[11px]">
                  Hiển thị trước tối đa 20 dòng để đối soát
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-2xl max-h-60">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-10">
                    <tr>
                      <th className="py-2.5 px-3 border-b border-slate-200 text-center w-12">#</th>
                      <th className="py-2.5 px-3 border-b border-slate-200">Trạng thái</th>
                      <th className="py-2.5 px-3 border-b border-slate-200">Mã hộ</th>
                      <th className="py-2.5 px-3 border-b border-slate-200">Tên chủ hộ</th>
                      <th className="py-2.5 px-3 border-b border-slate-200">Số ĐT</th>
                      <th className="py-2.5 px-3 border-b border-slate-200">Nhóm</th>
                      <th className="py-2.5 px-3 border-b border-slate-200">Vật nuôi</th>
                      <th className="py-2.5 px-3 border-b border-slate-200">Quy mô</th>
                      <th className="py-2.5 px-3 border-b border-slate-200">NCV phụ trách</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {parsedHouseholds.slice(0, 20).map((h, idx) => (
                      <tr key={idx} className={h.isValid ? 'hover:bg-slate-50' : 'bg-red-50/50'}>
                        <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                          {h.rowNumber}
                        </td>
                        <td className="py-2 px-3">
                          {h.isValid ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle className="w-3 h-3" />
                              <span>Hợp lệ</span>
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800"
                              title={h.errors.join('; ')}
                            >
                              <XCircle className="w-3 h-3" />
                              <span>Lỗi ({h.errors[0]})</span>
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">{h.id}</td>
                        <td className="py-2 px-3 font-semibold text-slate-800">{h.representativeName}</td>
                        <td className="py-2 px-3 font-mono text-slate-600">{h.phone || '-'}</td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                              h.group === 'TN'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-teal-100 text-teal-800'
                            }`}
                          >
                            {h.group === 'TN' ? 'TN (Can thiệp)' : 'ĐC (Đối chứng)'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-600">{h.livestockType}</td>
                        <td className="py-2 px-3 font-bold text-emerald-700">{h.herdSize} con</td>
                        <td className="py-2 px-3 text-slate-600">{h.assignedResearcher || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Preview: RESEARCH TEAM */}
          {activeTab === 'RESEARCH_TEAM' && parsedTeam.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-900">Sheet: {sheetName}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-emerald-700 font-bold">
                    ✓ {validTeamCount} cán bộ hợp lệ
                  </span>
                  {invalidTeamCount > 0 && (
                    <>
                      <span className="text-slate-400">•</span>
                      <span className="text-red-600 font-bold">
                        ⚠ {invalidTeamCount} dòng lỗi
                      </span>
                    </>
                  )}
                </div>
                <span className="text-slate-500 text-[11px]">
                  Danh sách Người hướng dẫn &amp; Nghiên cứu viên
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-2xl max-h-60">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-10">
                    <tr>
                      <th className="py-2.5 px-3 border-b border-slate-200 text-center w-12">#</th>
                      <th className="py-2.5 px-3 border-b border-slate-200">Trạng thái</th>
                      <th className="py-2.5 px-3 border-b border-slate-200">Username</th>
                      <th className="py-2.5 px-3 border-b border-slate-200">Họ và tên</th>
                      <th className="py-2.5 px-3 border-b border-slate-200">Vai trò</th>
                      <th className="py-2.5 px-3 border-b border-slate-200">Học hàm / Học vị</th>
                      <th className="py-2.5 px-3 border-b border-slate-200">Đơn vị</th>
                      <th className="py-2.5 px-3 border-b border-slate-200">Số ĐT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {parsedTeam.slice(0, 20).map((u, idx) => (
                      <tr key={idx} className={u.isValid ? 'hover:bg-slate-50' : 'bg-red-50/50'}>
                        <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                          {u.rowNumber}
                        </td>
                        <td className="py-2 px-3">
                          {u.isValid ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle className="w-3 h-3" />
                              <span>Hợp lệ</span>
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800"
                              title={u.errors.join('; ')}
                            >
                              <XCircle className="w-3 h-3" />
                              <span>Lỗi</span>
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">{u.username}</td>
                        <td className="py-2 px-3 font-semibold text-slate-800">{u.fullName}</td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                              u.role === 'SUPERVISOR'
                                ? 'bg-purple-100 text-purple-800'
                                : u.role === 'ADMIN'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {u.role === 'SUPERVISOR'
                              ? 'Người hướng dẫn'
                              : u.role === 'ADMIN'
                              ? 'Quản trị viên'
                              : 'Nghiên cứu viên'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-600">{u.title || '-'}</td>
                        <td className="py-2 px-3 text-slate-600">{u.organization || '-'}</td>
                        <td className="py-2 px-3 font-mono text-slate-600">{u.phone || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Import Settings */}
          {hasRows && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
              <span className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px] block">
                CẤU HÌNH NHẬP DỮ LIỆU
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
                    <div className="font-bold text-slate-900">Gộp dữ liệu (Khuyên dùng)</div>
                    <div className="text-[11px] text-slate-500">
                      Cập nhật các dòng có cùng mã, giữ nguyên các bản ghi cũ khác.
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
                    <div className="font-bold text-red-700">Thay thế toàn bộ</div>
                    <div className="text-[11px] text-slate-500">
                      Xóa toàn bộ danh sách hiện tại và thay thế bằng danh sách trong tệp Excel.
                    </div>
                  </div>
                </label>
              </div>

              {activeTab === 'HOUSEHOLDS' && (
                <label className="flex items-center space-x-2 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createHouseholdAccounts}
                    onChange={(e) => setCreateHouseholdAccounts(e.target.checked)}
                    className="rounded-sm text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span className="font-medium text-slate-700">
                    Tự động tạo tài khoản đăng nhập cho từng hộ chăn nuôi (Tên đăng nhập là mã hộ, ví dụ: <code>h01</code>, mật khẩu mặc định: <code>123456</code>).
                  </span>
                </label>
              )}
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
            disabled={!hasRows || currentValidCount === 0 || isSaving}
            className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white font-bold rounded-xl text-xs flex items-center space-x-2 shadow-md transition-all"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Đang lưu vào hệ thống...</span>
              </>
            ) : (
              <>
                <FileCheck className="w-4 h-4" />
                <span>
                  XÁC NHẬN NHẬP {currentValidCount}{' '}
                  {activeTab === 'HOUSEHOLDS' ? 'HỘ CHĂN NUÔI' : 'CÁN BỘ'} VÀO HỆ THỐNG
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
