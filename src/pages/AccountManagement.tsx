import React, { useState } from 'react';
import {
  UserCheck,
  UserPlus,
  KeyRound,
  Lock,
  Unlock,
  Shield,
  Search,
  CheckCircle,
  AlertTriangle,
  X,
  Copy,
  Check,
  FileSpreadsheet,
  Download,
  GraduationCap,
  RefreshCw,
} from 'lucide-react';
import { AccountStatus, Role, StudyGroup, User } from '../types';
import { StorageService } from '../services/storage';
import { CloudService } from '../services/cloudService';
import { GoogleSheetsService } from '../services/googleSheets';
import { generateSalt, hashPassword } from '../utils/crypto';
import { ExcelImportModal } from '../components/ExcelImportModal';
import { ExcelImportService } from '../services/excelImportService';

interface AccountManagementProps {
  currentUser: User;
  onRefreshData?: () => void;
}

export const AccountManagement: React.FC<AccountManagementProps> = ({
  currentUser,
  onRefreshData,
}) => {
  const [users, setUsers] = useState<User[]>(StorageService.getUsers());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');

  // Modal Excel
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);

  // Modal tạo tài khoản
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAccountData, setNewAccountData] = useState({
    username: '',
    fullName: '',
    phone: '',
    email: '',
    title: '',
    organization: '',
    role: 'RESEARCHER' as Role,
    householdId: 'H01',
    password: '',
  });

  // Modal bàn giao thông tin tài khoản vừa tạo
  const [handedOverAccount, setHandedOverAccount] = useState<{
    username: string;
    fullName: string;
    householdId?: string;
    tempPassword: string;
  } | null>(null);
  const [copiedHandover, setCopiedHandover] = useState(false);

  // Modal đổi mật khẩu
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');

  const [formError, setFormError] = useState('');
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSyncFromSheets = async () => {
    setIsSyncingSheets(true);
    setSyncStatusMsg(null);
    try {
      const res = await GoogleSheetsService.pullFromGoogleSheets();
      const updated = StorageService.getUsers();
      setUsers(updated);
      if (res.success) {
        setSyncStatusMsg({
          type: 'success',
          text: res.message || `Đã nạp thành công ${updated.length} tài khoản từ Google Sheets!`,
        });
      } else {
        setSyncStatusMsg({
          type: 'error',
          text: res.message || 'Lỗi khi đồng bộ từ Google Sheets.',
        });
      }
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setSyncStatusMsg({
        type: 'error',
        text: `Lỗi kết nối: ${err.message}`,
      });
    } finally {
      setIsSyncingSheets(false);
    }
  };

  // Lọc
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone.includes(searchTerm) ||
      (u.householdId && u.householdId.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole = filterRole === 'ALL' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  // Mở modal tạo mới
  const handleOpenAddModal = () => {
    setNewAccountData({
      username: '',
      fullName: '',
      phone: '',
      email: '',
      title: '',
      organization: '',
      role: 'RESEARCHER',
      householdId: 'H01',
      password: '123456',
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  // Tạo tài khoản an toàn
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newAccountData.username.trim() || !newAccountData.fullName.trim() || !newAccountData.password) {
      setFormError('Vui lòng điền đầy đủ Tên đăng nhập, Họ tên và Mật khẩu.');
      return;
    }

    if (users.some((u) => u.username.toLowerCase() === newAccountData.username.trim().toLowerCase())) {
      setFormError(`Tên đăng nhập "${newAccountData.username}" đã tồn tại!`);
      return;
    }

    const salt = generateSalt(16);
    const passwordHash = await hashPassword(newAccountData.password.trim(), salt);

    const newUser: User = {
      id: `USR_${Date.now()}`,
      username: newAccountData.username.trim().toLowerCase(),
      fullName: newAccountData.fullName.trim(),
      phone: newAccountData.phone.trim(),
      email: newAccountData.email.trim() || undefined,
      title: newAccountData.title.trim() || undefined,
      organization: newAccountData.organization.trim() || undefined,
      role: newAccountData.role,
      householdId: newAccountData.role === 'HOUSEHOLD' ? newAccountData.householdId : undefined,
      status: 'ACTIVE',
      passwordHash,
      salt,
      plainPasswordHint: newAccountData.password.trim(),
      createdAt: new Date().toISOString(),
    };

    const currentList = [...users, newUser];
    StorageService.saveUsers(currentList);
    setUsers(currentList);
    CloudService.triggerAutoSave(50);

    StorageService.addAuditLog({
      userId: currentUser.id,
      username: currentUser.username,
      userRole: currentUser.role,
      action: 'CREATE',
      targetModule: 'USERS',
      householdId: newUser.householdId,
      reason: `Tạo tài khoản mới ${newUser.username} (${newUser.fullName}, vai trò ${newUser.role}).`,
    });

    setIsAddModalOpen(false);

    // Bàn giao thông tin tài khoản cho Admin in hoặc gửi cho hộ
    setHandedOverAccount({
      username: newUser.username,
      fullName: newUser.fullName,
      householdId: newUser.householdId,
      tempPassword: newAccountData.password,
    });

    if (onRefreshData) onRefreshData();
  };

  // Khóa / Mở khóa tài khoản
  const handleToggleStatus = (u: User) => {
    const newStatus: AccountStatus = u.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    const currentList = users.map((item) =>
      item.id === u.id ? { ...item, status: newStatus } : item
    );

    StorageService.saveUsers(currentList);
    setUsers(currentList);
    CloudService.triggerAutoSave(50);

    StorageService.addAuditLog({
      userId: currentUser.id,
      username: currentUser.username,
      userRole: currentUser.role,
      action: newStatus === 'LOCKED' ? 'LOCK' : 'UNLOCK',
      targetModule: 'USERS',
      householdId: u.householdId,
      reason: `${newStatus === 'LOCKED' ? 'Khóa' : 'Mở khóa'} tài khoản ${u.username}.`,
    });

    if (onRefreshData) onRefreshData();
  };

  // Đổi / Đặt lại mật khẩu an toàn
  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUser || !newPasswordInput.trim()) return;

    const salt = generateSalt(16);
    const hash = await hashPassword(newPasswordInput.trim(), salt);

    const currentList = users.map((item) =>
      item.id === resetUser.id
        ? {
            ...item,
            passwordHash: hash,
            salt,
            plainPasswordHint: newPasswordInput.trim(),
          }
        : item
    );

    StorageService.saveUsers(currentList);
    setUsers(currentList);
    CloudService.triggerAutoSave(50);

    if (currentUser.id === resetUser.id) {
      const updatedSelf = currentList.find((u) => u.id === currentUser.id);
      if (updatedSelf) StorageService.setCurrentUser(updatedSelf);
    }

    StorageService.addAuditLog({
      userId: currentUser.id,
      username: currentUser.username,
      userRole: currentUser.role,
      action: 'UPDATE',
      targetModule: 'USERS_PASSWORD',
      householdId: resetUser.householdId,
      reason: `Đặt lại mật khẩu mới an toàn cho tài khoản ${resetUser.username}.`,
    });

    setResetUser(null);
    setNewPasswordInput('');
    if (onRefreshData) onRefreshData();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <UserCheck className="w-6 h-6 text-emerald-600" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              QUẢN LÝ TÀI KHOẢN VÀ XÁC THỰC
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Cấp phát tài khoản an toàn • Mã hóa Salted SHA-256 • Phân quyền Admin, Nghiên cứu viên, Hộ chăn nuôi
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSyncFromSheets}
            disabled={isSyncingSheets}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-xs"
            title="Đồng bộ 2 chiều: Tải danh sách tài khoản từ Google Sheets về hệ thống"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-white ${isSyncingSheets ? 'animate-spin' : ''}`} />
            <span>{isSyncingSheets ? 'Đang đồng bộ...' : 'Đồng bộ từ Google Sheets'}</span>
          </button>
          <button
            onClick={() => setIsExcelModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-xs"
            title="Nhập danh sách Người hướng dẫn & Nghiên cứu viên bằng tệp Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>Nhập cán bộ từ Excel</span>
          </button>
          <button
            onClick={ExcelImportService.downloadResearchTeamTemplate}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-2xs"
            title="Tải tệp mẫu Excel danh sách cán bộ nghiên cứu & người hướng dẫn"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tải mẫu Excel</span>
          </button>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center space-x-2 transition-colors shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tạo tài khoản mới</span>
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncStatusMsg && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in ${
            syncStatusMsg.type === 'success'
              ? 'bg-emerald-100 border border-emerald-300 text-emerald-900'
              : 'bg-amber-100 border border-amber-300 text-amber-900'
          }`}
        >
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-700" />
            <span>{syncStatusMsg.text}</span>
          </div>
          <button
            onClick={() => setSyncStatusMsg(null)}
            className="p-1 rounded text-slate-500 hover:text-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Handover Modal Card if newly created */}
      {handedOverAccount && (
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-5 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-emerald-900 font-extrabold text-sm">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span>THÔNG TIN BÀN GIAO TÀI KHOẢN CHO HỘ CHĂN NUÔI</span>
            </div>
            <button
              onClick={() => setHandedOverAccount(null)}
              className="p-1 rounded-lg text-emerald-700 hover:bg-emerald-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-emerald-800">
            Hãy sao chép thông tin này để bàn giao cho hộ chăn nuôi đăng nhập trên điện thoại:
          </p>

          <div className="bg-white p-3.5 rounded-xl border border-emerald-200 font-mono text-xs text-slate-800 space-y-1">
            <div>
              <strong>Họ và tên:</strong> {handedOverAccount.fullName}
            </div>
            <div>
              <strong>Mã hộ:</strong> {handedOverAccount.householdId || 'N/A'}
            </div>
            <div>
              <strong>Tên đăng nhập:</strong> {handedOverAccount.username}
            </div>
            <div>
              <strong>Mật khẩu ban đầu:</strong>{' '}
              <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md font-bold">
                {handedOverAccount.tempPassword}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              const text = `TÀI KHOẢN GREEN FARM RESEARCH:\nHọ tên: ${handedOverAccount.fullName}\nTên đăng nhập: ${handedOverAccount.username}\nMật khẩu: ${handedOverAccount.tempPassword}`;
              navigator.clipboard.writeText(text);
              setCopiedHandover(true);
              setTimeout(() => setCopiedHandover(false), 2000);
            }}
            className="px-4 py-1.5 bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs"
          >
            {copiedHandover ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedHandover ? 'Đã sao chép!' : 'Sao chép thông tin'}</span>
          </button>
        </div>
      )}

      {/* Filter and Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo username, họ tên, mã hộ, số điện thoại..."
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-700">VAI TRÒ:</span>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white font-bold"
          >
            <option value="ALL">Tất cả ({users.length})</option>
            <option value="ADMIN">Quản trị viên (Admin)</option>
            <option value="SUPERVISOR">Người hướng dẫn</option>
            <option value="RESEARCHER">Nghiên cứu viên</option>
            <option value="HOUSEHOLD">Hộ chăn nuôi</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-900 text-slate-200 uppercase font-extrabold text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">Tên đăng nhập</th>
                <th className="py-3 px-3">Họ và tên</th>
                <th className="py-3 px-3">Vai trò</th>
                <th className="py-3 px-3">Mã Hộ</th>
                <th className="py-3 px-3">Số điện thoại</th>
                <th className="py-3 px-3">Trạng thái</th>
                <th className="py-3 px-3 text-center">Mật khẩu</th>
                <th className="py-3 px-3 text-center">Thao tác an toàn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredUsers.map((u) => {
                const isHousehold = u.role === 'HOUSEHOLD';
                return (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      {u.username}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">{u.fullName}</div>
                      {u.title && <div className="text-[10px] text-slate-400">{u.title}</div>}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : u.role === 'SUPERVISOR'
                            ? 'bg-amber-100 text-amber-800'
                            : u.role === 'RESEARCHER'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {u.role === 'ADMIN'
                          ? 'ADMIN'
                          : u.role === 'SUPERVISOR'
                          ? 'NGƯỜI HƯỚNG DẪN'
                          : u.role === 'RESEARCHER'
                          ? 'NGHIÊN CỨU VIÊN'
                          : 'HỘ DÂN'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {u.householdId || '-'}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">{u.phone || '-'}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {u.status === 'ACTIVE' ? 'Hoạt động' : 'Đang khóa'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex items-center space-x-1.5 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-xl">
                        <span className="font-mono font-bold text-slate-800 text-xs">
                          {u.plainPasswordHint || '123456'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setResetUser(u);
                            setNewPasswordInput(u.plainPasswordHint || '123456');
                          }}
                          className="p-1 hover:bg-emerald-100 rounded-lg text-emerald-700 hover:text-emerald-800 transition-colors"
                          title="Đổi mật khẩu cho tài khoản này"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        {/* Đổi mật khẩu */}
                        <button
                          onClick={() => {
                            setResetUser(u);
                            setNewPasswordInput(u.plainPasswordHint || '123456');
                          }}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-emerald-700 transition-colors"
                          title="Đặt lại mật khẩu an toàn"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>

                        {/* Khóa / Mở khóa */}
                        {u.role !== 'ADMIN' && (
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              u.status === 'ACTIVE'
                                ? 'text-amber-600 hover:bg-amber-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={u.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                          >
                            {u.status === 'ACTIVE' ? (
                              <Lock className="w-4 h-4" />
                            ) : (
                              <Unlock className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tạo Tài Khoản Mới */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-base font-bold text-slate-900">
                TẠO TÀI KHOẢN MỚI
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAccount} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">VAI TRÒ TÀI KHOẢN</label>
                <select
                  value={newAccountData.role}
                  onChange={(e) =>
                    setNewAccountData({ ...newAccountData, role: e.target.value as Role })
                  }
                  className="w-full border border-slate-300 rounded-xl p-2.5 bg-white font-bold"
                >
                  <option value="SUPERVISOR">Người hướng dẫn / Cố vấn đề tài</option>
                  <option value="RESEARCHER">Nghiên cứu viên (Nhập liệu KAP, CWM thực địa)</option>
                  <option value="ADMIN">Quản trị viên (Toàn quyền)</option>
                  <option value="HOUSEHOLD">Hộ chăn nuôi (Xem dữ liệu của chính mình)</option>
                </select>
              </div>

              {newAccountData.role === 'HOUSEHOLD' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">MÃ HỘ LIÊN KẾT</label>
                  <input
                    type="text"
                    value={newAccountData.householdId}
                    onChange={(e) =>
                      setNewAccountData({ ...newAccountData, householdId: e.target.value.toUpperCase() })
                    }
                    placeholder="H01"
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-mono uppercase font-bold"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">TÊN ĐĂNG NHẬP *</label>
                <input
                  type="text"
                  value={newAccountData.username}
                  onChange={(e) => setNewAccountData({ ...newAccountData, username: e.target.value })}
                  placeholder="huongdan_01, ncv_mai, hoặc mã hộ..."
                  className="w-full border border-slate-300 rounded-xl p-2.5 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">HỌ VÀ TÊN ĐẦY ĐỦ *</label>
                <input
                  type="text"
                  value={newAccountData.fullName}
                  onChange={(e) => setNewAccountData({ ...newAccountData, fullName: e.target.value })}
                  placeholder="PGS.TS. Nguyễn Văn Tuấn"
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              {newAccountData.role !== 'HOUSEHOLD' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">HỌC HÀM / HỌC VỊ</label>
                    <input
                      type="text"
                      value={newAccountData.title}
                      onChange={(e) => setNewAccountData({ ...newAccountData, title: e.target.value })}
                      placeholder="PGS.TS, TS, ThS..."
                      className="w-full border border-slate-300 rounded-xl p-2.5"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">ĐƠN VỊ CÔNG TÁC</label>
                    <input
                      type="text"
                      value={newAccountData.organization}
                      onChange={(e) => setNewAccountData({ ...newAccountData, organization: e.target.value })}
                      placeholder="Đại học, Viện, Chi cục..."
                      className="w-full border border-slate-300 rounded-xl p-2.5"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">SỐ ĐIỆN THOẠI</label>
                  <input
                    type="text"
                    value={newAccountData.phone}
                    onChange={(e) => setNewAccountData({ ...newAccountData, phone: e.target.value })}
                    placeholder="0912..."
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">MẬT KHẨU BAN ĐẦU *</label>
                  <input
                    type="text"
                    value={newAccountData.password}
                    onChange={(e) => setNewAccountData({ ...newAccountData, password: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-xs"
                >
                  Tạo tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Đặt Lại Mật Khẩu */}
      {resetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center space-x-2 text-amber-600">
              <KeyRound className="w-5 h-5" />
              <h3 className="font-bold text-slate-900 text-base">
                ĐẶT LẠI MẬT KHẨU: {resetUser.username}
              </h3>
            </div>

            <p className="text-xs text-slate-600">
              Cấp mật khẩu mới cho <strong>{resetUser.fullName}</strong>. Mật khẩu sẽ được băm bằng SHA-256 + Salt mới.
            </p>

            <form onSubmit={handleConfirmResetPassword} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  MẬT KHẨU MỚI:
                </label>
                <input
                  type="text"
                  required
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 font-mono font-bold"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResetUser(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-xs"
                >
                  Xác nhận & Cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Nhập Excel */}
      <ExcelImportModal
        isOpen={isExcelModalOpen}
        initialTab="RESEARCH_TEAM"
        currentUser={currentUser}
        onClose={() => setIsExcelModalOpen(false)}
        onSuccess={() => {
          setUsers(StorageService.getUsers());
          if (onRefreshData) onRefreshData();
        }}
      />
    </div>
  );
};
