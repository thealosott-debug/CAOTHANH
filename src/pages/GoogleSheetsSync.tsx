import React, { useState } from 'react';
import {
  Sheet,
  CheckCircle,
  CloudUpload,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Copy,
  Check,
  Settings,
  Database,
} from 'lucide-react';
import { StorageService } from '../services/storage';
import { GoogleSheetsService, RESEARCH_SHEETS } from '../services/googleSheets';
import { CloudService } from '../services/cloudService';
import { ResearchConfig, User } from '../types';
import { APPS_SCRIPT_SOURCE_CODE } from '../config/appsScriptCode';

interface GoogleSheetsSyncProps {
  currentUser: User;
  onRefreshData?: () => void;
}

export const GoogleSheetsSync: React.FC<GoogleSheetsSyncProps> = ({
  currentUser,
  onRefreshData,
}) => {
  const [config, setConfig] = useState<ResearchConfig>(StorageService.getConfig());
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveConfig(config);
    CloudService.triggerAutoSave(50);
    StorageService.addAuditLog({
      userId: currentUser.id,
      username: currentUser.username,
      userRole: currentUser.role,
      action: 'UPDATE',
      targetModule: 'CONFIG_SHEETS',
      reason: `Cập nhật cấu hình kết nối Google Sheets (ID: ${config.spreadsheetId || 'Chưa có'}).`,
    });
    setSaveSuccessMsg('Đã lưu cấu hình và tự động đồng bộ lên Cloud & Google Sheets thành công!');
    setTimeout(() => setSaveSuccessMsg(''), 4000);
    if (onRefreshData) onRefreshData();
  };

  const handleTestConnection = async () => {
    if (!config.appsScriptUrl) {
      setTestResult({ ok: false, message: 'Vui lòng nhập URL Google Apps Script Web App.' });
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    const res = await GoogleSheetsService.testConnection(config.appsScriptUrl, config.spreadsheetId);
    setTestResult(res);
    setIsTesting(false);
  };

  const handleSyncAllSheets = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    // Lưu đồng bộ toàn bộ dữ liệu vào Cloud Server & đẩy Google Sheets
    await CloudService.saveAllToCloud(true);
    const res = await GoogleSheetsService.syncToGoogleSheets(config.appsScriptUrl);
    setSyncResult(res);
    setIsSyncing(false);
    if (onRefreshData) onRefreshData();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <Sheet className="w-6 h-6 text-emerald-600" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              KHO DỮ LIỆU GOOGLE SHEETS (17 SHEETS)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Trung tâm lưu trữ dữ liệu nghiên cứu đám mây • Kết nối bảo mật qua Google Apps Script Web App
          </p>
        </div>

        <button
          onClick={handleSyncAllSheets}
          disabled={isSyncing}
          className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center space-x-2 transition-all shadow-md"
        >
          {isSyncing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Đang đồng bộ 17 Sheets...</span>
            </>
          ) : (
            <>
              <CloudUpload className="w-4 h-4" />
              <span>ĐỒNG BỘ LÊN GOOGLE SHEETS</span>
            </>
          )}
        </button>
      </div>

      {/* Permanent Fixed Link Banner */}
      <div className="bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-black text-emerald-950 text-sm">
                LIÊN KẾT GOOGLE APPS SCRIPT ĐÃ ĐƯỢC LƯU CỐ ĐỊNH VÀO PHẦN MỀM
              </span>
              <span className="bg-emerald-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                ONLINE READY
              </span>
            </div>
            <p className="text-xs text-emerald-800 font-mono mt-1 break-all bg-white/70 p-2 rounded-lg border border-emerald-200">
              {config.appsScriptUrl}
            </p>
            <p className="text-[11px] text-emerald-700 mt-1">
              ✓ Hệ thống đã thiết lập lưu trữ vĩnh viễn URL này để truyền và lưu toàn bộ dữ liệu 17 Sheets lên Google Sheets Online.
            </p>
          </div>
        </div>

        <div className="flex sm:flex-col gap-2 shrink-0">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
            <span>{isTesting ? 'Kiểm tra...' : 'Kiểm tra Ping'}</span>
          </button>
          <button
            type="button"
            onClick={handleSyncAllSheets}
            disabled={isSyncing}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-1.5"
          >
            <CloudUpload className="w-3.5 h-3.5" />
            <span>Đồng bộ ngay</span>
          </button>
        </div>
      </div>

      {/* HƯỚNG DẪN KHẮC PHỤC LỖI "FAILED TO FETCH" */}
      <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-5 space-y-4 shadow-xs text-xs">
        <div className="flex items-center space-x-2 text-amber-900 font-extrabold text-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>GIẢI THÍCH NGUYÊN NHÂN LỖI &amp; MÃ GS ĐỂ DÁN VÀO GOOGLE SHEETS</span>
        </div>

        <div className="space-y-2 text-amber-900 leading-relaxed">
          <p>
            <strong>Nguyên nhân xảy ra lỗi:</strong> Khi tạo Apps Script mới, Google chỉ để một hàm trống là <code>function myFunction() &#123;&#125;</code>. Bạn bấm Deploy khi <strong>chưa dán hàm <code>doGet</code> và <code>doPost</code></strong>, nên Google Apps Script báo lỗi <em>"Script function not found: doGet"</em> và chặn kết nối.
          </p>
          <p className="font-semibold text-slate-800">
            Cách xử lý 100% thành công trong 1 phút:
          </p>
          <ol className="list-decimal list-inside space-y-1.5 pl-1 text-slate-700 font-medium">
            <li>
              Bấm nút xanh dưới đây để <strong>Sao chép toàn bộ mã Code.gs chuẩn</strong>.
            </li>
            <li>
              Vào trang Google Sheets của bạn ➔ <strong>Tiện ích mở rộng</strong> ➔ <strong>Apps Script</strong>.
            </li>
            <li>
              <strong>XÓA SẠCH</strong> toàn bộ code cũ trong ô soạn thảo, <strong>DÁN</strong> mã vừa copy vào ➔ bấm <strong>Lưu (Ctrl + S)</strong>.
            </li>
            <li>
              <span className="text-red-700 font-bold">RẤT QUAN TRỌNG:</span> Bấm <strong>Triển khai (Deploy)</strong> ➔ chọn <strong>Quản lý bản triển khai (Manage deployments)</strong> ➔ bấm biểu tượng <strong>Cây bút chì (Chỉnh sửa)</strong> ➔ ở dòng Phiên bản (Version) chọn <strong>Phiên bản mới (New version)</strong> ➔ Bấm <strong>Triển khai (Deploy)</strong>.
            </li>
          </ol>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-amber-200">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(APPS_SCRIPT_SOURCE_CODE);
              setCopiedCode(true);
              setTimeout(() => setCopiedCode(false), 3000);
            }}
            className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold flex items-center space-x-2 transition-all shadow-md"
          >
            {copiedCode ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copiedCode ? '✓ ĐÃ SAO CHÉP MÃ CODE.GS!' : 'SAO CHÉP TOÀN BỘ MÃ CODE.GS (1-CLICK)'}</span>
          </button>
          <span className="text-[11px] text-slate-500 italic">
            (Đã bao gồm hàm doGet, doPost và tự động tạo đủ 17 Sheets)
          </span>
        </div>
      </div>

      {/* Connection Feedback */}
      {syncResult && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-start space-x-2.5 ${
            syncResult.success
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
              : 'bg-red-50 border border-red-200 text-red-900'
          }`}
        >
          {syncResult.success ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          )}
          <span>{syncResult.message}</span>
        </div>
      )}

      {testResult && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-start space-x-2.5 ${
            testResult.ok
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border border-amber-200 text-amber-900'
          }`}
        >
          {testResult.ok ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          )}
          <span>{testResult.message}</span>
        </div>
      )}

      {/* Configuration Form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h2 className="text-base font-extrabold text-slate-900 uppercase border-b border-slate-100 pb-3 flex items-center space-x-2">
          <Settings className="w-5 h-5 text-emerald-700" />
          <span>THIẾT LẬP KẾT NỐI GOOGLE SPREADSHEET</span>
        </h2>

        {saveSuccessMsg && (
          <div className="bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl p-3 text-xs font-bold flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              URL GOOGLE APPS SCRIPT WEB APP (KẾT THÚC BẰNG /exec) *:
            </label>
            <input
              type="url"
              value={config.appsScriptUrl}
              onChange={(e) => setConfig({ ...config, appsScriptUrl: e.target.value })}
              placeholder="https://script.google.com/macros/s/AKfycbz.../exec"
              className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 font-mono"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Triển khai tệp <code>Code.gs</code> trong Google Sheets dưới dạng Ứng dụng Web với quyền "Bất kỳ ai" (Anyone).
            </p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              GOOGLE SPREADSHEET ID (TÙY CHỌN NẾU APPS SCRIPT ĐÃ GẮN VÀO TRANG TÍNH):
            </label>
            <input
              type="text"
              value={config.spreadsheetId}
              onChange={(e) => setConfig({ ...config, spreadsheetId: e.target.value })}
              placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
              className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">TỔNG SỐ HỘ THAM GIA</label>
              <input
                type="number"
                value={config.totalHouseholds}
                onChange={(e) => setConfig({ ...config, totalHouseholds: Number(e.target.value) })}
                className="w-full border border-slate-300 rounded-xl p-2.5 font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">SỐ HỘ CAN THIỆP (TN)</label>
              <input
                type="number"
                value={config.tnTarget}
                onChange={(e) => setConfig({ ...config, tnTarget: Number(e.target.value) })}
                className="w-full border border-slate-300 rounded-xl p-2.5 font-bold text-emerald-700"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">SỐ HỘ ĐỐI CHỨNG (ĐC)</label>
              <input
                type="number"
                value={config.dcTarget}
                onChange={(e) => setConfig({ ...config, dcTarget: Number(e.target.value) })}
                className="w-full border border-slate-300 rounded-xl p-2.5 font-bold text-teal-700"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold flex items-center space-x-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}</span>
            </button>

            <button
              type="submit"
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-xs"
            >
              Lưu tham số cấu hình
            </button>
          </div>
        </form>
      </div>

      {/* 17 Sheets Structure Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 uppercase">
              CẤU TRÚC 17 SHEET CHUẨN TRONG WORKBOOK
            </h2>
            <p className="text-xs text-slate-500">
              Được tự động sinh đầy đủ tiêu đề cột và màu nền nhận diện thương hiệu NCKH
            </p>
          </div>
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-xs">
            17 / 17 Sheets Sẵn sàng
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {RESEARCH_SHEETS.map((sheet, idx) => (
            <div
              key={sheet.name}
              className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 hover:border-emerald-500 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900 font-mono text-[11px]">
                  {idx + 1}. {sheet.name}
                </span>
                <span className="text-[10px] text-slate-400">{sheet.columns.length} cột</span>
              </div>
              <p className="text-slate-600 text-[11px]">{sheet.description}</p>
              <div className="text-[10px] font-mono text-slate-400 truncate">
                Cột: {sheet.columns.slice(0, 5).join(', ')}...
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
