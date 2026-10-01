import React, { useState } from 'react';
import { Leaf, Lock, User as UserIcon, ArrowRight, ShieldCheck, KeyRound, AlertCircle, Sparkles } from 'lucide-react';
import { StorageService } from '../services/storage';
import { verifyPassword } from '../utils/crypto';
import { Role, User } from '../types';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
  onOpenCwmGuide: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, onOpenCwmGuide }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    setIsLoading(true);

    try {
      const users = StorageService.getUsers();
      const user = users.find(
        (u) =>
          u.username.toLowerCase() === username.trim().toLowerCase() ||
          u.phone === username.trim() ||
          (u.householdId && u.householdId.toLowerCase() === username.trim().toLowerCase())
      );

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

  // Nút đăng nhập nhanh cho các vai trò kiểm thử
  const handleQuickLogin = (role: Role, hId?: string) => {
    const users = StorageService.getUsers();
    let targetUser: User | undefined;

    if (role === 'ADMIN') {
      targetUser = users.find((u) => u.role === 'ADMIN');
    } else if (role === 'RESEARCHER') {
      targetUser = users.find((u) => u.role === 'RESEARCHER');
    } else if (role === 'HOUSEHOLD') {
      targetUser = users.find((u) => u.householdId === (hId || 'H01'));
    }

    if (targetUser) {
      StorageService.setCurrentUser(targetUser);
      onLoginSuccess(targetUser);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background soft glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-xl shadow-emerald-900/40 ring-4 ring-emerald-500/20">
            <Leaf className="w-9 h-9" />
          </div>
        </div>

        {/* Header Title */}
        <div className="text-center space-y-1.5">
          <span className="text-[11px] font-extrabold tracking-widest text-emerald-400 uppercase bg-emerald-950/80 border border-emerald-800/80 px-3 py-1 rounded-full">
            ĐỀ TÀI NGHIÊN CỨU KHOA HỌC KỸ THUẬT
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase mt-2">
            GREEN FARM RESEARCH
          </h1>
          <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
            Hệ thống Quản lý Dữ liệu Nghiên cứu Thực nghiệm: Tác động của 'Cam kết xanh' đến quản lý chất thải tại nguồn
          </p>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-slate-800/90 backdrop-blur-md border border-slate-700/80 py-8 px-6 shadow-2xl rounded-3xl sm:px-10">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-950/80 border border-red-700 text-red-200 text-xs p-3.5 rounded-xl flex items-start space-x-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                TÊN ĐĂNG NHẬP / MÃ HỘ / SỐ ĐT
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin / nghiencuu01 / h01..."
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
              <span className="text-slate-400">Bảo mật mật mã băm SHA-256</span>
              <button
                type="button"
                onClick={() => setShowForgot(!showForgot)}
                className="text-emerald-400 hover:text-emerald-300 font-medium"
              >
                Quên mật khẩu?
              </button>
            </div>

            {showForgot && (
              <div className="p-3 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-slate-300">
                Vui lòng liên hệ Chủ nhiệm đề tài hoặc Quản trị viên (Admin) để được cấp lại mật khẩu an toàn.
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center space-x-2 py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all disabled:opacity-50"
            >
              <span>{isLoading ? 'Đang xác thực...' : 'ĐĂNG NHẬP'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Switcher Section */}
          <div className="mt-6 pt-5 border-t border-slate-700/80">
            <p className="text-[11px] font-bold text-slate-400 text-center uppercase tracking-wider mb-2 flex items-center justify-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>ĐĂNG NHẬP NHANH ĐỂ NGHIỆM THU</span>
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('ADMIN')}
                className="p-2 bg-slate-900 hover:bg-emerald-950 border border-slate-700 hover:border-emerald-500 rounded-xl text-left text-slate-300 hover:text-white transition-all"
              >
                <div className="font-bold text-purple-400">1. Admin</div>
                <div className="text-[10px] text-slate-400 truncate">Toàn quyền hệ thống</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('RESEARCHER')}
                className="p-2 bg-slate-900 hover:bg-emerald-950 border border-slate-700 hover:border-emerald-500 rounded-xl text-left text-slate-300 hover:text-white transition-all"
              >
                <div className="font-bold text-blue-400">2. Nghiên cứu viên</div>
                <div className="text-[10px] text-slate-400 truncate">Nhập KAP, CWM thực tế</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('HOUSEHOLD', 'H01')}
                className="p-2 bg-slate-900 hover:bg-emerald-950 border border-slate-700 hover:border-emerald-500 rounded-xl text-left text-slate-300 hover:text-white transition-all"
              >
                <div className="font-bold text-emerald-400">3. Hộ TN (H01)</div>
                <div className="text-[10px] text-slate-400 truncate">Cam kết & nộp W1-W6</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('HOUSEHOLD', 'H21')}
                className="p-2 bg-slate-900 hover:bg-emerald-950 border border-slate-700 hover:border-emerald-500 rounded-xl text-left text-slate-300 hover:text-white transition-all"
              >
                <div className="font-bold text-teal-400">4. Hộ ĐC (H21)</div>
                <div className="text-[10px] text-slate-400 truncate">Nhóm đối chứng</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="mt-4 text-center text-xs text-slate-500">
          Chỉ dành cho cán bộ nghiên cứu và các hộ tham gia đề tài tại Thanh Hóa • 2026
        </p>
      </div>
    </div>
  );
};
