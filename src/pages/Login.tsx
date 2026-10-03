import React, { useState } from 'react';
import {
  Leaf,
  Lock,
  User as UserIcon,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  AlertCircle,
  BookOpen,
  HelpCircle,
  Layers,
  Users,
  Award,
  FileSpreadsheet,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { StorageService } from '../services/storage';
import { CloudService } from '../services/cloudService';
import { verifyPassword } from '../utils/crypto';
import { Role, User } from '../types';
import { UserGuideModal } from '../components/UserGuideModal';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
  onOpenCwmGuide: () => void;
  onOpenUserGuide?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, onOpenCwmGuide }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [guideTab, setGuideTab] = useState<'OVERVIEW' | 'ROLES' | 'MODULES' | 'CWM' | 'EXCEL_SHEETS' | 'FAQ'>('OVERVIEW');

  const openGuideWithTab = (tab: 'OVERVIEW' | 'ROLES' | 'MODULES' | 'CWM' | 'EXCEL_SHEETS' | 'FAQ') => {
    setGuideTab(tab);
    setIsGuideOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    setIsLoading(true);

    try {
      let users = StorageService.getUsers();
      let user = users.find(
        (u) =>
          u.username.toLowerCase() === username.trim().toLowerCase() ||
          u.phone === username.trim() ||
          (u.householdId && u.householdId.toLowerCase() === username.trim().toLowerCase())
      );

      // Nếu không tìm thấy trong bộ nhớ cục bộ, tự động tải phiên bản mới nhất từ Cloud Server
      if (!user) {
        await CloudService.loadFromCloud();
        users = StorageService.getUsers();
        user = users.find(
          (u) =>
            u.username.toLowerCase() === username.trim().toLowerCase() ||
            u.phone === username.trim() ||
            (u.householdId && u.householdId.toLowerCase() === username.trim().toLowerCase())
        );
      }

      if (!user) {
        setError('Tên đăng nhập hoặc mật khẩu không chính xác.');
        setIsLoading(false);
        return;
      }

      if (user.status === 'LOCKED') {
        setError('Tài khoản này hiện đang bị khóa. Vui lòng liên hệ Admin để mở khóa.');
        setIsLoading(false);
        return;
      }

      const isValid = await verifyPassword(password, user.salt, user.passwordHash);
      if (!isValid) {
        setError('Tên đăng nhập hoặc mật khẩu không chính xác.');
        setIsLoading(false);
        return;
      }

      // Đăng nhập thành công
      StorageService.setCurrentUser(user);
      StorageService.addAuditLog({
        userId: user.id,
        username: user.username,
        userRole: user.role,
        action: 'UPDATE',
        targetModule: 'AUTH',
        householdId: user.householdId,
        reason: `Đăng nhập thành công vào hệ thống lúc ${new Date().toLocaleTimeString('vi-VN')}`,
      });

      onLoginSuccess(user);
    } catch (err: any) {
      setError('Có lỗi xảy ra trong quá trình xác thực. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background soft glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar bên ngoài giao diện */}
      <header className="w-full max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 z-10 bg-slate-800/80 backdrop-blur-md border border-slate-700/80 p-3 sm:px-5 sm:py-3 rounded-2xl shadow-lg">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs">
            <Leaf className="w-5 h-5" />
          </div>
          <div>
            <span className="font-black text-white text-sm tracking-wide block sm:inline">
              GREEN FARM RESEARCH
            </span>
            <span className="text-[11px] text-emerald-400 font-medium sm:ml-2">
              • Đề tài NCKH Quản lý chất thải tại nguồn 2026
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={onOpenCwmGuide}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-950 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all shadow-xs"
            title="Mở Sổ tay hướng dẫn tiêu chuẩn chấm điểm CWM 6 tiêu chí"
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xs:inline">Sổ tay CWM</span>
          </button>

          <button
            type="button"
            onClick={() => openGuideWithTab('OVERVIEW')}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-md shadow-emerald-900/40 border border-emerald-500/50"
            title="Mở tài liệu hướng dẫn sử dụng chi tiết nhất"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-200" />
            <span>HƯỚNG DẪN SỬ DỤNG CHI TIẾT</span>
          </button>
        </div>
      </header>

      {/* Main Login Area */}
      <main className="my-auto py-6 sm:mx-auto sm:w-full sm:max-w-md z-10">
        {/* Header Title */}
        <div className="text-center space-y-1.5 mb-6">
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-xl shadow-emerald-900/40 ring-4 ring-emerald-500/20">
              <Leaf className="w-8 h-8" />
            </div>
          </div>
          <span className="text-[10px] font-extrabold tracking-widest text-emerald-400 uppercase bg-emerald-950/90 border border-emerald-800 px-3 py-1 rounded-full">
            ĐỀ TÀI NGHIÊN CỨU KHOA HỌC KỸ THUẬT
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase mt-2">
            ĐĂNG NHẬP HỆ THỐNG
          </h1>
          <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
            Tác động của ‘Cam kết xanh’ kết hợp ứng dụng quản lý chăn nuôi đến hành vi quản lý chất thải tại nguồn của các hộ chăn nuôi
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-slate-800/90 backdrop-blur-md border border-slate-700/80 py-7 px-6 shadow-2xl rounded-3xl sm:px-9">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-950/80 border border-red-700 text-red-200 text-xs p-3.5 rounded-xl flex items-start space-x-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                TÊN ĐĂNG NHẬP / MÃ HỘ / SỐ ĐIỆN THOẠI
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin / h01 / 0912345678..."
                  required
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                MẬT KHẨU
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">Bảo mật mã hóa SHA-256</span>
              <button
                type="button"
                onClick={() => setShowForgot(!showForgot)}
                className="text-emerald-400 hover:text-emerald-300 font-medium"
              >
                Quên mật khẩu?
              </button>
            </div>

            {showForgot && (
              <div className="p-3 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-slate-300 space-y-1 animate-in fade-in">
                <p>• <strong>Hộ chăn nuôi:</strong> Mật khẩu mặc định là <code>123456</code>. Nếu đã đổi mật khẩu và quên, vui lòng liên hệ Nghiên cứu viên hoặc Admin để được cấp lại.</p>
                <p>• <strong>Cán bộ nghiên cứu:</strong> Liên hệ Chủ nhiệm đề tài (Admin) để đặt lại mật khẩu trong hệ thống.</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center space-x-2 py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all disabled:opacity-50"
            >
              <span>{isLoading ? 'Đang xác thực...' : 'ĐĂNG NHẬP HỆ THỐNG'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* MENU HƯỚNG DẪN SỬ DỤNG CHI TIẾT NHẤT BÊN NGOÀI GIAO DIỆN */}
        <section className="mt-5 bg-slate-800/85 backdrop-blur-md border border-emerald-500/40 rounded-3xl p-5 shadow-xl space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-2.5">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center shadow-xs">
                <BookOpen className="w-4 h-4 text-emerald-200" />
              </div>
              <div>
                <h2 className="text-xs font-black text-white tracking-wide uppercase">
                  MENU HƯỚNG DẪN SỬ DỤNG CHI TIẾT
                </h2>
                <p className="text-[10px] text-emerald-300">
                  Dành cho Chủ nhiệm đề tài, Cán bộ nghiên cứu & Hộ chăn nuôi
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => openGuideWithTab('OVERVIEW')}
              className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
            >
              <span>Xem tất cả</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => openGuideWithTab('OVERVIEW')}
              className="p-2.5 bg-slate-900/90 hover:bg-emerald-950/70 border border-slate-700 hover:border-emerald-500/60 rounded-xl text-left transition-all group"
            >
              <div className="flex items-center space-x-1.5 text-emerald-400 font-bold text-[11px] group-hover:text-emerald-300">
                <Layers className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">1. Quy trình 6 bước</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">Từ khởi tạo đến kiểm định RCT</p>
            </button>

            <button
              type="button"
              onClick={() => openGuideWithTab('ROLES')}
              className="p-2.5 bg-slate-900/90 hover:bg-emerald-950/70 border border-slate-700 hover:border-emerald-500/60 rounded-xl text-left transition-all group"
            >
              <div className="flex items-center space-x-1.5 text-purple-400 font-bold text-[11px] group-hover:text-purple-300">
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">2. Theo 4 Vai trò</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">Admin, NCV, Giám sát, Hộ</p>
            </button>

            <button
              type="button"
              onClick={() => openGuideWithTab('MODULES')}
              className="p-2.5 bg-slate-900/90 hover:bg-emerald-950/70 border border-slate-700 hover:border-emerald-500/60 rounded-xl text-left transition-all group"
            >
              <div className="flex items-center space-x-1.5 text-blue-400 font-bold text-[11px] group-hover:text-blue-300">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">3. Phiếu BC01–BC08</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">KAP, Cam kết, W1-W6</p>
            </button>

            <button
              type="button"
              onClick={() => openGuideWithTab('CWM')}
              className="p-2.5 bg-slate-900/90 hover:bg-emerald-950/70 border border-slate-700 hover:border-emerald-500/60 rounded-xl text-left transition-all group"
            >
              <div className="flex items-center space-x-1.5 text-amber-400 font-bold text-[11px] group-hover:text-amber-300">
                <Award className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">4. Thang điểm CWM</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">6 tiêu chí thực địa (0-6đ)</p>
            </button>

            <button
              type="button"
              onClick={() => openGuideWithTab('EXCEL_SHEETS')}
              className="p-2.5 bg-slate-900/90 hover:bg-emerald-950/70 border border-slate-700 hover:border-emerald-500/60 rounded-xl text-left transition-all group"
            >
              <div className="flex items-center space-x-1.5 text-teal-400 font-bold text-[11px] group-hover:text-teal-300">
                <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">5. Excel & Sheets</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">Nạp file mẫu & đồng bộ 17 sheet</p>
            </button>

            <button
              type="button"
              onClick={() => openGuideWithTab('FAQ')}
              className="p-2.5 bg-slate-900/90 hover:bg-emerald-950/70 border border-slate-700 hover:border-emerald-500/60 rounded-xl text-left transition-all group"
            >
              <div className="flex items-center space-x-1.5 text-rose-400 font-bold text-[11px] group-hover:text-rose-300">
                <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">6. Hỏi đáp & Sự cố</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">Tài khoản & dùng Offline</p>
            </button>
          </div>

          <button
            type="button"
            onClick={() => openGuideWithTab('OVERVIEW')}
            className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-2"
          >
            <BookOpen className="w-4 h-4 text-emerald-200" />
            <span>MỞ SỔ TAY HƯỚNG DẪN SỬ DỤNG CHI TIẾT NHẤT</span>
          </button>
        </section>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-500 py-3 z-10">
        Hệ thống Quản lý Dữ liệu Nghiên cứu Khoa học Nông nghiệp • Bản quyền đề tài NCKH 2026
      </footer>

      {/* Modal Hướng dẫn sử dụng chi tiết nhất */}
      <UserGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        defaultTab={guideTab}
      />
    </div>
  );
};

