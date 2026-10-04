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
  CheckCircle2,
  Calendar,
  FileText,
  Shield,
  Clock,
  Wifi,
  Database,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { StorageService } from '../services/storage';
import { CloudService } from '../services/cloudService';
import { GoogleSheetsService } from '../services/googleSheets';
import { generateSalt, hashPassword, verifyPassword } from '../utils/crypto';
import { Role, User } from '../types';
import { UserGuideModal } from '../components/UserGuideModal';

function normalizeStr(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/\s+/g, '');
}

function findUserFlexibly(users: User[], cleanInput: string, rawInput: string): User | undefined {
  const noSpaceInput = cleanInput.replace(/\s+/g, '');
  const digitsOnlyInput = rawInput.replace(/\D/g, '');
  const normInput = normalizeStr(rawInput);

  // 1. Khớp chính xác username (chữ thường)
  let found = users.find((u) => u.username && u.username.toLowerCase() === cleanInput);
  if (found) return found;

  // 2. Khớp username bỏ khoảng trắng (vd: "hs 01" -> "hs01", "ct thanh" -> "ctthanh")
  found = users.find((u) => u.username && u.username.toLowerCase().replace(/\s+/g, '') === noSpaceInput);
  if (found) return found;

  // 3. Khớp số điện thoại (chỉ lấy số, vd: "0988 111 222" -> "0988111222")
  if (digitsOnlyInput.length >= 9) {
    found = users.find((u) => u.phone && u.phone.replace(/\D/g, '') === digitsOnlyInput);
    if (found) return found;
  }

  // 4. Khớp mã hộ (householdId, vd: "h01", "H01", "H-01")
  found = users.find(
    (u) =>
      u.householdId &&
      u.householdId.toLowerCase().replace(/[^a-z0-9]/g, '') === noSpaceInput.replace(/[^a-z0-9]/g, '')
  );
  if (found) return found;

  // 5. Khớp Email
  found = users.find((u) => u.email && u.email.toLowerCase().trim() === cleanInput);
  if (found) return found;

  // 6. Khớp Họ và tên (chính xác hoặc không dấu, vd: "Cao Thị Thanh", "cao thi thanh", "Học viên 01")
  found = users.find(
    (u) =>
      u.fullName &&
      (u.fullName.toLowerCase().trim() === cleanInput ||
        normalizeStr(u.fullName) === normInput ||
        (normInput.length >= 4 && normalizeStr(u.fullName).includes(normInput)))
  );
  if (found) return found;

  // 7. Hỗ trợ alias phổ biến
  if (noSpaceInput === 'ctthanh' || noSpaceInput === 'caothanh' || normInput === 'caothithanh') {
    found = users.find(
      (u) => u.username.toLowerCase() === 'ctthanh' || u.username.toLowerCase() === 'caothanh'
    );
    if (found) return found;
  }

  return undefined;
}

interface LoginProps {
  onLoginSuccess: (user: User) => void;
  onOpenCwmGuide: () => void;
  onOpenUserGuide?: () => void;
}

type GuideTabKey = 'OVERVIEW' | 'ROLES' | 'MODULES' | 'CWM' | 'EXCEL_SHEETS' | 'FAQ';

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, onOpenCwmGuide }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showAccountList, setShowAccountList] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [guideTab, setGuideTab] = useState<GuideTabKey>('OVERVIEW');
  const [outsideActiveTab, setOutsideActiveTab] = useState<GuideTabKey>('OVERVIEW');

  // Tự động đồng bộ các tài khoản từ Google Sheets ngay khi mở trang đăng nhập
  React.useEffect(() => {
    GoogleSheetsService.pullFromGoogleSheets().catch(() => {});
  }, []);

  const openGuideWithTab = (tab: GuideTabKey) => {
    setGuideTab(tab);
    setOutsideActiveTab(tab);
    setIsGuideOpen(true);
  };

  const handleSyncFromSheets = async () => {
    setIsSyncing(true);
    setSyncNotice(null);
    setError('');
    try {
      const res = await GoogleSheetsService.pullFromGoogleSheets();
      if (res.success) {
        setSyncNotice({
          type: 'success',
          message: res.message || 'Đã đồng bộ thành công tài khoản từ Google Sheets!',
        });
      } else {
        setSyncNotice({
          type: 'error',
          message: res.message || 'Chưa thể đồng bộ từ Google Sheets.',
        });
      }
    } catch (err: any) {
      setSyncNotice({
        type: 'error',
        message: `Lỗi kết nối: ${err.message}`,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSyncNotice(null);

    if (!username.trim() || !password) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    setIsLoading(true);

    try {
      const cleanInput = username.trim().toLowerCase();
      const cleanPass = password.trim();

      // 1. Luôn nạp dữ liệu mới nhất từ Cloud Server để nhận ngay tài khoản vừa được Admin tạo
      await CloudService.loadFromCloud();
      let users = StorageService.getUsers();

      // 2. Tra cứu tài khoản thông minh & linh hoạt (Username, Họ tên, SĐT, Mã hộ, Email)
      let user = findUserFlexibly(users, cleanInput, username.trim());

      // 3. NẾU CHƯA TÌM THẤY: Tự động kéo trực tiếp dữ liệu từ Google Sheets về ngay lập tức
      if (!user) {
        try {
          const sheetPullRes = await GoogleSheetsService.pullFromGoogleSheets();
          if (sheetPullRes.success && sheetPullRes.users) {
            users = StorageService.getUsers();
            user = findUserFlexibly(users, cleanInput, username.trim());
          }
        } catch (sheetErr) {
          console.warn('Auto-pull from Google Sheets on login warning:', sheetErr);
        }
      }

      if (!user) {
        setError(
          `Tài khoản "${username}" chưa tìm thấy trong hệ thống. Vui lòng bấm nút "Đồng bộ từ Google Sheets" bên dưới hoặc xem danh sách tài khoản đã cấp.`
        );
        setIsLoading(false);
        return;
      }

      if (user.status === 'LOCKED') {
        setError('Tài khoản này hiện đang bị khóa. Vui lòng liên hệ Admin để mở khóa.');
        setIsLoading(false);
        return;
      }

      let isValid = false;

      // 1. Kiểm tra xác thực băm SHA-256 + Salt
      if (user.passwordHash && user.salt) {
        isValid = await verifyPassword(cleanPass, user.salt, user.passwordHash);
      }

      // 2. Kiểm tra nếu khớp với plainPasswordHint (hoặc mật khẩu trên Sheet)
      if (!isValid && user.plainPasswordHint && user.plainPasswordHint.trim() === cleanPass) {
        isValid = true;
      }

      // 3. CHÍNH SÁCH MẬT KHẨU MẶC ĐỊNH 123456:
      // Mọi tài khoản mới được cấp (học viên hs01, hs02, người hướng dẫn ctthanh, hộ dân)
      // đều đăng nhập thành công với mật khẩu mặc định 123456
      if (!isValid && cleanPass === '123456') {
        isValid = true;
      }

      // 4. Riêng tài khoản admin ban đầu có thể dùng cả admin123
      if (!isValid && user.username.toLowerCase() === 'admin' && (cleanPass === 'admin123' || cleanPass === '123456')) {
        isValid = true;
      }

      if (!isValid) {
        setError('Mật khẩu không chính xác. Mật khẩu mặc định hệ thống là: 123456.');
        setIsLoading(false);
        return;
      }

      // Tự động chuẩn hóa và lưu lại hash chuẩn cho tài khoản này nếu chưa có
      if (!user.passwordHash || !user.salt || cleanPass === '123456') {
        const salt = user.salt || generateSalt(16);
        const hash = await hashPassword(cleanPass, salt);
        user.passwordHash = hash;
        user.salt = salt;
        user.plainPasswordHint = cleanPass;
        const allUsers = StorageService.getUsers().map((u) => (u.id === user.id ? user : u));
        StorageService.saveUsers(allUsers);
        CloudService.triggerAutoSave(50);
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
    <div className="min-h-screen bg-slate-900 flex flex-col justify-between py-5 px-4 sm:px-6 lg:px-8 relative overflow-x-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar bên ngoài giao diện */}
      <header className="w-full max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 z-10 bg-slate-800/85 backdrop-blur-md border border-slate-700/80 p-3 sm:px-6 sm:py-3.5 rounded-2xl shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-900/30">
            <Leaf className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-black text-white text-base tracking-wide">
                GREEN FARM RESEARCH
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-extrabold bg-emerald-900/90 text-emerald-300 rounded-full border border-emerald-700/60 uppercase">
                NCKH 2026
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium">
              Đề tài NCKH Quản lý chất thải chăn nuôi tại nguồn & Cam kết Xanh
            </p>
          </div>
        </div>

        {/* Quick Menu Trực quan ngoài giao diện */}
        <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={onOpenCwmGuide}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-950 border border-amber-500/40 text-amber-300 hover:text-amber-200 text-xs font-semibold transition-all shadow-xs"
            title="Mở Sổ tay Thang điểm CWM 6 tiêu chí thực địa (0-6 điểm)"
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Sổ tay CWM (0-6đ)</span>
          </button>

          <button
            type="button"
            onClick={() => openGuideWithTab('OVERVIEW')}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950/50 border border-emerald-400/40"
            title="Mở toàn văn Sổ tay hướng dẫn sử dụng chi tiết nhất"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-100" />
            <span>HƯỚNG DẪN SỬ DỤNG CHI TIẾT</span>
          </button>
        </div>
      </header>

      {/* Main Content: 2-Column Responsive Layout */}
      <main className="my-auto py-6 max-w-7xl mx-auto w-full z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* CỘT 1 (lg:col-span-5): KHUNG ĐĂNG NHẬP CHÍNH QUY (KHÔNG ĐĂNG NHẬP NHANH) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Header Title */}
            <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/80 p-5 rounded-3xl shadow-xl text-center space-y-2">
              <div className="inline-flex p-3 bg-emerald-900/60 border border-emerald-600/40 rounded-2xl text-emerald-400 mb-1">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <span className="block text-[10px] font-extrabold tracking-widest text-emerald-400 uppercase bg-emerald-950/90 border border-emerald-800/80 px-3 py-1 rounded-full w-max mx-auto">
                CỔNG ĐĂNG NHẬP BẢO MẬT
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
                HỆ THỐNG QUẢN LÝ DỮ LIỆU
              </h1>
              <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
                Đăng nhập tài khoản định danh để thực hiện khảo sát, cập nhật nhật ký hoặc quản trị đề tài
              </p>
            </div>

            {/* Form Đăng nhập */}
            <div className="bg-slate-800/90 backdrop-blur-md border border-slate-700/80 py-6 px-6 sm:px-7 shadow-2xl rounded-3xl">
              <form className="space-y-4" onSubmit={handleSubmit}>
                {syncNotice && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center space-x-2 animate-in fade-in ${
                      syncNotice.type === 'success'
                        ? 'bg-emerald-950/90 border border-emerald-600 text-emerald-200'
                        : 'bg-amber-950/90 border border-amber-600 text-amber-200'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>{syncNotice.message}</span>
                  </div>
                )}

                {error && (
                  <div className="bg-red-950/90 border border-red-700 text-red-200 text-xs p-3.5 rounded-xl flex items-start space-x-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    TÊN ĐĂNG NHẬP / HỌ TÊN / MÃ HỘ / SỐ ĐIỆN THOẠI
                  </label>
                  <div className="relative rounded-xl shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="admin / hs01 / ctthanh / h01 / 0988111222..."
                      required
                      autoComplete="username"
                      className="block w-full pl-10 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
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
                      placeholder="•••••••• (Mặc định: 123456)"
                      required
                      autoComplete="current-password"
                      className="block w-full pl-10 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-0.5">
                  <span className="text-slate-400 text-[11px] flex items-center space-x-1">
                    <Shield className="w-3 h-3 text-emerald-400" />
                    <span>Mã hóa SHA-256 + Salt</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowForgot(!showForgot)}
                    className="text-emerald-400 hover:text-emerald-300 font-medium"
                  >
                    Quên mật khẩu?
                  </button>
                </div>

                {showForgot && (
                  <div className="p-3.5 bg-slate-900/95 border border-slate-700 rounded-xl text-xs text-slate-300 space-y-1.5 animate-in fade-in">
                    <p className="font-bold text-emerald-400">Hướng dẫn khôi phục mật khẩu:</p>
                    <p>• <strong>Mật khẩu mặc định hệ thống:</strong> <code className="bg-slate-800 text-amber-300 px-1 py-0.5 rounded font-bold">123456</code> (áp dụng cho mọi tài khoản mới từ Google Sheets hoặc vừa được cấp).</p>
                    <p>• <strong>Quên mật khẩu đã đổi:</strong> Vui lòng liên hệ Chủ nhiệm đề tài (Admin) để đặt lại mật khẩu trong trang Quản lý Tài khoản.</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center space-x-2 py-3 px-4 rounded-xl shadow-lg text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <span>{isLoading ? 'Đang xác thực hệ thống...' : 'ĐĂNG NHẬP VÀO HỆ THỐNG'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Nút bấm Đồng bộ tài khoản từ Google Sheets */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleSyncFromSheets}
                    disabled={isSyncing}
                    className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-600/50 hover:border-emerald-500 text-emerald-300 hover:text-emerald-100 text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-300' : ''}`} />
                    <span>{isSyncing ? 'Đang đồng bộ tài khoản từ Google Sheets...' : 'ĐỒNG BỘ TÀI KHOẢN TỪ GOOGLE SHEETS'}</span>
                  </button>
                </div>

                {/* Danh sách tài khoản đã cấp - Hỗ trợ điền nhanh */}
                <div className="pt-0.5">
                  <button
                    type="button"
                    onClick={() => setShowAccountList(!showAccountList)}
                    className="w-full flex items-center justify-between py-1.5 px-3 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-700/60 text-[11px] text-slate-300 font-medium transition-all"
                  >
                    <span className="flex items-center space-x-1.5">
                      <Users className="w-3.5 h-3.5 text-teal-400" />
                      <span>📋 Xem danh sách tài khoản đã cấp (Điền nhanh)</span>
                    </span>
                    <span className="text-emerald-400 font-bold">{showAccountList ? '▲ Ẩn' : '▼ Mở'}</span>
                  </button>

                  {showAccountList && (
                    <div className="mt-2 p-3 bg-slate-900/95 border border-slate-700 rounded-2xl space-y-2 text-xs max-h-60 overflow-y-auto">
                      <div className="text-[11px] text-emerald-300 font-semibold border-b border-slate-700 pb-1 flex justify-between">
                        <span>Tài khoản hiện có (Mật khẩu mặc định: 123456)</span>
                        <span className="text-slate-400">{StorageService.getUsers().length} tài khoản</span>
                      </div>
                      <div className="space-y-1.5">
                        {StorageService.getUsers().map((u) => (
                          <div
                            key={u.id}
                            onClick={() => {
                              setUsername(u.username);
                              setPassword(u.plainPasswordHint || '123456');
                            }}
                            className="p-2 rounded-xl bg-slate-800/80 hover:bg-emerald-950/60 border border-slate-700/60 hover:border-emerald-600/60 flex items-center justify-between cursor-pointer transition-all"
                          >
                            <div className="space-y-0.5">
                              <div className="font-bold text-white flex items-center space-x-1.5">
                                <span className="text-emerald-400 font-mono">{u.username}</span>
                                <span className="text-slate-300 text-[11px]">({u.fullName})</span>
                              </div>
                              <div className="text-[10px] text-slate-400 flex items-center space-x-2">
                                <span>
                                  Vai trò:{' '}
                                  <strong className="text-teal-300 font-semibold">
                                    {u.role === 'ADMIN'
                                      ? 'Admin'
                                      : u.role === 'SUPERVISOR'
                                      ? 'Người hướng dẫn'
                                      : u.role === 'RESEARCHER'
                                      ? 'Học viên'
                                      : 'Hộ chăn nuôi'}
                                  </strong>
                                </span>
                                {u.phone && <span>• SĐT: {u.phone}</span>}
                              </div>
                            </div>
                            <button
                              type="button"
                              className="px-2.5 py-1 bg-emerald-600/40 hover:bg-emerald-600 text-emerald-200 hover:text-white rounded-lg text-[10px] font-bold border border-emerald-500/40 shrink-0"
                            >
                              Chọn
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </form>

              {/* Thông tin hỗ trợ đăng nhập */}
              <div className="mt-4 pt-3.5 border-t border-slate-700/70 text-[11px] text-slate-400 space-y-1 text-center">
                <p>Hệ thống tự động phân loại quyền hạn theo tài khoản được cấp phát.</p>
                <div className="flex items-center justify-center space-x-3 text-emerald-400 font-medium pt-1">
                  <span className="flex items-center space-x-1">
                    <Database className="w-3 h-3" />
                    <span>Lưu trữ Cloud</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center space-x-1">
                    <Wifi className="w-3 h-3" />
                    <span>Dùng tốt khi Offline</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* CỘT 2 (lg:col-span-7): MENU HƯỚNG DẪN SỬ DỤNG CHI TIẾT NHẤT BÊN NGOÀI GIAO DIỆN */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-slate-800/90 backdrop-blur-md border border-emerald-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
              {/* Header của Menu */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-500/50 text-emerald-300 flex items-center justify-center shadow-inner shrink-0">
                    <BookOpen className="w-5 h-5 text-emerald-300" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-black text-white tracking-wide uppercase flex items-center space-x-2">
                      <span>MENU HƯỚNG DẪN SỬ DỤNG CHI TIẾT NHẤT</span>
                    </h2>
                    <p className="text-xs text-emerald-300">
                      Sổ tay hướng dẫn toàn diện dành cho Ban Giám khảo, Nghiên cứu viên & Hộ dân
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openGuideWithTab(outsideActiveTab)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-400/50 text-emerald-200 hover:text-white text-xs font-bold transition-all self-start sm:self-auto shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Mở Popup Chi tiết</span>
                </button>
              </div>

              {/* Grid 6 Thẻ Danh mục Menu Hướng Dẫn */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setOutsideActiveTab('OVERVIEW')}
                  className={`p-2.5 rounded-xl text-left border transition-all ${
                    outsideActiveTab === 'OVERVIEW'
                      ? 'bg-emerald-950/80 border-emerald-400 text-white shadow-md'
                      : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700/80 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 font-bold text-xs text-emerald-400">
                    <Layers className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">1. Quy trình RCT</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">6 bước triển khai đề tài</p>
                </button>

                <button
                  type="button"
                  onClick={() => setOutsideActiveTab('ROLES')}
                  className={`p-2.5 rounded-xl text-left border transition-all ${
                    outsideActiveTab === 'ROLES'
                      ? 'bg-purple-950/80 border-purple-400 text-white shadow-md'
                      : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700/80 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 font-bold text-xs text-purple-400">
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">2. 4 Vai trò</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">Admin, NCV, Giám sát, Hộ</p>
                </button>

                <button
                  type="button"
                  onClick={() => setOutsideActiveTab('MODULES')}
                  className={`p-2.5 rounded-xl text-left border transition-all ${
                    outsideActiveTab === 'MODULES'
                      ? 'bg-blue-950/80 border-blue-400 text-white shadow-md'
                      : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700/80 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 font-bold text-xs text-blue-400">
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">3. Biểu mẫu BC01-08</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">KAP, Cam kết, W1-W6</p>
                </button>

                <button
                  type="button"
                  onClick={() => setOutsideActiveTab('CWM')}
                  className={`p-2.5 rounded-xl text-left border transition-all ${
                    outsideActiveTab === 'CWM'
                      ? 'bg-amber-950/80 border-amber-400 text-white shadow-md'
                      : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700/80 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 font-bold text-xs text-amber-400">
                    <Award className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">4. Thang điểm CWM</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">6 tiêu chí thực địa (0-6đ)</p>
                </button>

                <button
                  type="button"
                  onClick={() => setOutsideActiveTab('EXCEL_SHEETS')}
                  className={`p-2.5 rounded-xl text-left border transition-all ${
                    outsideActiveTab === 'EXCEL_SHEETS'
                      ? 'bg-teal-950/80 border-teal-400 text-white shadow-md'
                      : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700/80 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 font-bold text-xs text-teal-400">
                    <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">5. Excel & Sheets</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">Đồng bộ tự động 17 Sheet</p>
                </button>

                <button
                  type="button"
                  onClick={() => setOutsideActiveTab('FAQ')}
                  className={`p-2.5 rounded-xl text-left border transition-all ${
                    outsideActiveTab === 'FAQ'
                      ? 'bg-rose-950/80 border-rose-400 text-white shadow-md'
                      : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700/80 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 font-bold text-xs text-rose-400">
                    <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">6. Sự cố & FAQ</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">Mật khẩu & dùng Offline</p>
                </button>
              </div>

              {/* Nội dung Chi Tiết Trực Tiếp Theo Tab Được Chọn (Bên ngoài giao diện) */}
              <div className="bg-slate-900/90 border border-slate-700/90 rounded-2xl p-4 sm:p-5 text-xs text-slate-200 space-y-3.5 min-h-[220px]">
                {outsideActiveTab === 'OVERVIEW' && (
                  <div className="space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <h3 className="font-extrabold text-emerald-400 text-sm flex items-center space-x-1.5">
                        <Layers className="w-4 h-4" />
                        <span>QUY TRÌNH 6 BƯỚC THỰC HIỆN ĐỀ TÀI NGHIÊN CỨU RCT</span>
                      </h3>
                      <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-800">
                        Phương pháp luận chuẩn hóa
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/70">
                        <span className="font-bold text-emerald-300">Bước 1: Khởi tạo 40 Hộ dân</span>
                        <p className="text-slate-400 mt-0.5">Phân ngẫu nhiên 20 hộ Nhóm Can thiệp (TN - Cam kết xanh) và 20 hộ Nhóm Đối chứng (ĐC).</p>
                      </div>

                      <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/70">
                        <span className="font-bold text-emerald-300">Bước 2: Khảo sát Ban đầu T0</span>
                        <p className="text-slate-400 mt-0.5">Thu thập BC01 (Nhân khẩu học) & BC02 (Kiến thức - Thái độ - Thực hành KAP ban đầu).</p>
                      </div>

                      <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/70">
                        <span className="font-bold text-emerald-300">Bước 3: Tập huấn & Ký Cam kết</span>
                        <p className="text-slate-400 mt-0.5">20 hộ nhóm TN ký Bản cam kết xanh BC05 và nhận hướng dẫn quy trình quản lý chất thải.</p>
                      </div>

                      <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/70">
                        <span className="font-bold text-emerald-300">Bước 4: Giám sát 6 Tuần W1-W6</span>
                        <p className="text-slate-400 mt-0.5">Hộ dân nộp BC06 hàng tuần, cán bộ giám sát kiểm tra thực địa độc lập tránh sai lệch báo cáo.</p>
                      </div>

                      <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/70">
                        <span className="font-bold text-emerald-300">Bước 5: Đánh giá Cuối kỳ T1</span>
                        <p className="text-slate-400 mt-0.5">Khảo sát hậu can thiệp BC03 & chấm điểm thực tế chuồng trại BC04 theo thang CWM (0-6đ).</p>
                      </div>

                      <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/70">
                        <span className="font-bold text-emerald-300">Bước 6: Phân tích DiD & Xuất BC08</span>
                        <p className="text-slate-400 mt-0.5">Kiểm định khác biệt kép DiD, Paired t-test, biểu đồ so sánh và trích xuất báo cáo khoa học.</p>
                      </div>
                    </div>
                  </div>
                )}

                {outsideActiveTab === 'ROLES' && (
                  <div className="space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <h3 className="font-extrabold text-purple-400 text-sm flex items-center space-x-1.5">
                        <Users className="w-4 h-4" />
                        <span>HƯỚNG DẪN 4 VAI TRÒ NGƯỜI DÙNG TRONG HỆ THỐNG</span>
                      </h3>
                      <span className="text-[10px] bg-purple-950 text-purple-300 px-2 py-0.5 rounded-md border border-purple-800">
                        Phân quyền RBAC
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2.5 bg-slate-800/80 rounded-xl border border-purple-900/40">
                        <div className="flex items-center space-x-1.5 text-purple-300 font-bold">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>1. Admin (Chủ nhiệm đề tài)</span>
                        </div>
                        <p className="text-slate-300 mt-1">Toàn quyền hệ thống: Cấp tài khoản, nạp Excel, cấu hình Google Sheets/Cloud, khóa/mở dữ liệu và xem Audit Log kiểm toán.</p>
                      </div>

                      <div className="p-2.5 bg-slate-800/80 rounded-xl border border-blue-900/40">
                        <div className="flex items-center space-x-1.5 text-blue-300 font-bold">
                          <FileText className="w-3.5 h-3.5" />
                          <span>2. Nghiên cứu viên (NCV)</span>
                        </div>
                        <p className="text-slate-300 mt-1">Trực tiếp phỏng vấn 40 hộ, nhập phiếu BC01, BC02, BC03, chấm BC04 và theo dõi tiến độ nộp nhật ký của các hộ.</p>
                      </div>

                      <div className="p-2.5 bg-slate-800/80 rounded-xl border border-amber-900/40">
                        <div className="flex items-center space-x-1.5 text-amber-300 font-bold">
                          <Award className="w-3.5 h-3.5" />
                          <span>3. Cán bộ Giám sát (Supervisor)</span>
                        </div>
                        <p className="text-slate-300 mt-1">Kiểm tra thực địa khách quan, đối chiếu điểm tự đánh giá BC06 của hộ với quan sát thực tế chuồng trại.</p>
                      </div>

                      <div className="p-2.5 bg-slate-800/80 rounded-xl border border-emerald-900/40">
                        <div className="flex items-center space-x-1.5 text-emerald-300 font-bold">
                          <Leaf className="w-3.5 h-3.5" />
                          <span>4. Hộ chăn nuôi (Household)</span>
                        </div>
                        <p className="text-slate-300 mt-1">Giao diện di động tinh gọn: Xem cam kết xanh (BC05), nộp nhật ký tuần (BC06), phản ánh trở ngại thu gom/phân loại.</p>
                      </div>
                    </div>
                  </div>
                )}

                {outsideActiveTab === 'MODULES' && (
                  <div className="space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <h3 className="font-extrabold text-blue-400 text-sm flex items-center space-x-1.5">
                        <FileText className="w-4 h-4" />
                        <span>HỆ THỐNG BIỂU MẪU NGHIÊN CỨU TỪ BC01 ĐẾN BC08</span>
                      </h3>
                      <span className="text-[10px] bg-blue-950 text-blue-300 px-2 py-0.5 rounded-md border border-blue-800">
                        Bộ công cụ khảo sát
                      </span>
                    </div>

                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between p-2 bg-slate-800/70 rounded-lg">
                        <span className="font-bold text-blue-300">BC01 - Nhân khẩu học:</span>
                        <span className="text-slate-300">40 hộ • Quy mô đàn, diện tích chuồng, học vấn, kinh nghiệm</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-slate-800/70 rounded-lg">
                        <span className="font-bold text-blue-300">BC02 & BC03 - KAP T0 & T1:</span>
                        <span className="text-slate-300">Khảo sát Kiến thức - Thái độ - Thực hành trước & sau can thiệp</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-slate-800/70 rounded-lg">
                        <span className="font-bold text-blue-300">BC04 - Thang điểm CWM:</span>
                        <span className="text-slate-300">Chấm điểm thực địa 6 tiêu chí quản lý chất thải tại nguồn (0-6đ)</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-slate-800/70 rounded-lg">
                        <span className="font-bold text-blue-300">BC05 & BC06 - Cam kết & Nhật ký:</span>
                        <span className="text-slate-300">Ký cam kết xanh 7 nội dung & Báo cáo hành vi hàng tuần (W1-W6)</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-slate-800/70 rounded-lg">
                        <span className="font-bold text-blue-300">BC07 & BC08 - Phân tích & Báo cáo:</span>
                        <span className="text-slate-300">Tổng hợp so sánh Nhóm Can thiệp vs Đối chứng & Toàn văn đề tài</span>
                      </div>
                    </div>
                  </div>
                )}

                {outsideActiveTab === 'CWM' && (
                  <div className="space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <h3 className="font-extrabold text-amber-400 text-sm flex items-center space-x-1.5">
                        <Award className="w-4 h-4" />
                        <span>SỔ TAY THANG ĐIỂM CWM 6 TIÊU CHÍ THỰC ĐỊA (0 - 6 ĐIỂM)</span>
                      </h3>
                      <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded-md border border-amber-800">
                        Thang đo khách quan
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 bg-slate-800/80 rounded-xl border border-slate-700">
                        <span className="font-bold text-amber-300">TC1: Thu gom hàng ngày (1đ)</span>
                        <p className="text-slate-400 mt-0.5">Thu gom phân và chất thải rắn tối thiểu 1 lần/ngày vào khu vực quy định.</p>
                      </div>
                      <div className="p-2 bg-slate-800/80 rounded-xl border border-slate-700">
                        <span className="font-bold text-amber-300">TC2: Phân loại riêng biệt (1đ)</span>
                        <p className="text-slate-400 mt-0.5">Tách phân khô khỏi nước rửa chuồng trước khi xối nước dọn dẹp.</p>
                      </div>
                      <div className="p-2 bg-slate-800/80 rounded-xl border border-slate-700">
                        <span className="font-bold text-amber-300">TC3: Lưu chứa kín (1đ)</span>
                        <p className="text-slate-400 mt-0.5">Có hố chứa có nắp che hoặc dẫn kín vào hầm ủ Biogas, không bốc mùi nặng.</p>
                      </div>
                      <div className="p-2 bg-slate-800/80 rounded-xl border border-slate-700">
                        <span className="font-bold text-amber-300">TC4: Không xả thẳng ra môi trường (1đ)</span>
                        <p className="text-slate-400 mt-0.5">Không xả phân tươi ra cống rãnh công cộng, ao hồ, sông mương thủy lợi.</p>
                      </div>
                      <div className="p-2 bg-slate-800/80 rounded-xl border border-slate-700">
                        <span className="font-bold text-amber-300">TC5: Tái sử dụng hợp vệ sinh (1đ)</span>
                        <p className="text-slate-400 mt-0.5">Ủ phân compost có men vi sinh, trùn quế hoặc dùng khí sinh học Biogas.</p>
                      </div>
                      <div className="p-2 bg-slate-800/80 rounded-xl border border-slate-700">
                        <span className="font-bold text-amber-300">TC6: Vệ sinh tiêu độc khử trùng (1đ)</span>
                        <p className="text-slate-400 mt-0.5">Khử trùng chuồng trại định kỳ tối thiểu 1 lần/tuần bằng vôi bột hoặc hóa chất.</p>
                      </div>
                    </div>
                  </div>
                )}

                {outsideActiveTab === 'EXCEL_SHEETS' && (
                  <div className="space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <h3 className="font-extrabold text-teal-400 text-sm flex items-center space-x-1.5">
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>QUẢN LÝ DỮ LIỆU FILE EXCEL & 17 GOOGLE SHEETS TỰ ĐỘNG</span>
                      </h3>
                      <span className="text-[10px] bg-teal-950 text-teal-300 px-2 py-0.5 rounded-md border border-teal-800">
                        Đồng bộ thời gian thực
                      </span>
                    </div>

                    <div className="space-y-2 text-[11px] text-slate-300">
                      <p>• <strong>Nạp File Excel 40 hộ:</strong> Cho phép import danh sách hộ từ tệp Excel chuẩn (.xlsx) có sẵn đầy đủ thông tin đại diện, thôn xóm, quy mô đàn và nhóm nghiên cứu (TN/ĐC).</p>
                      <p>• <strong>Tự động cấp tài khoản:</strong> Sau khi nạp hộ, hệ thống tự động tạo mã đăng nhập tương ứng với mật khẩu mặc định là <code>123456</code>.</p>
                      <p>• <strong>17 Sheets Google Sheets:</strong> Tự động đồng bộ các bảng cấu trúc bao gồm CONFIG, HOUSEHOLDS, USERS, BC01_INFO, BC02_KAP_T0, BC03_KAP_T1, BC04_CWM, BC05_COMMITMENT, BC06_WEEKLY (W1 đến W6), BC07_REPORT, AUDIT_LOGS.</p>
                      <p>• <strong>Bảo toàn dữ liệu Cloud:</strong> Mọi thay đổi đều được ghi vào Cloud Server JSON và đẩy lên Google Sheets qua Apps Script độc lập.</p>
                    </div>
                  </div>
                )}

                {outsideActiveTab === 'FAQ' && (
                  <div className="space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <h3 className="font-extrabold text-rose-400 text-sm flex items-center space-x-1.5">
                        <HelpCircle className="w-4 h-4" />
                        <span>CÂU HỎI THƯỜNG GẶP & KHẮC PHỤC SỰ CỐ ĐĂNG NHẬP</span>
                      </h3>
                      <span className="text-[10px] bg-rose-950 text-rose-300 px-2 py-0.5 rounded-md border border-rose-800">
                        Hỗ trợ kỹ thuật 24/7
                      </span>
                    </div>

                    <div className="space-y-2 text-[11px] text-slate-300">
                      <p>• <strong>Không có mạng Internet ở thực địa:</strong> Hệ thống hoạt động hoàn hảo ở chế độ Ngoại tuyến (Offline-First). Bạn thoải mái nhập phiếu; khi bắt được Wifi hoặc 4G, dữ liệu tự động đẩy lên Cloud và Google Sheets.</p>
                      <p>• <strong>Quên mật khẩu tài khoản:</strong> Đối với Hộ dân, liên hệ Nghiên cứu viên để reset về mật khẩu mặc định <code>123456</code>. Đối với Nghiên cứu viên, liên hệ Chủ nhiệm đề tài (Admin) trong mục Quản lý Tài khoản.</p>
                      <p>• <strong>Không tìm thấy dữ liệu hộ vừa tạo:</strong> Nhấn nút "Tải lại từ Cloud" hoặc liên hệ Admin kiểm tra trạng thái kích hoạt tài khoản.</p>
                    </div>
                  </div>
                )}

                {/* Nút Kêu Gọi Mở Sổ Tay Chi Tiết Đầy Đủ */}
                <button
                  type="button"
                  onClick={() => openGuideWithTab(outsideActiveTab)}
                  className="w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-2 border border-emerald-500/40 cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-emerald-200" />
                  <span>MỞ TOÀN VĂN SỔ TAY HƯỚNG DẪN CHI TIẾT ĐẦY ĐỦ (POPUP)</span>
                  <ChevronRight className="w-4 h-4 text-emerald-300" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer bản quyền */}
      <footer className="text-center text-xs text-slate-400 py-3 z-10 border-t border-slate-800/80 mt-4 max-w-7xl mx-auto w-full">
        Hệ thống Quản lý Dữ liệu Nghiên cứu Khoa học Nông nghiệp • Bản quyền đề tài NCKH Kỹ thuật 2026
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
