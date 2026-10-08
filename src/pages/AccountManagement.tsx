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
  Home,
  User as UserIcon,
  Phone,
  MapPin,
} from 'lucide-react';
import { AccountStatus, BC01Record, Household, Role, StudyGroup, User } from '../types';
import { StorageService } from '../services/storage';
import { GoogleSheetsService } from '../services/googleSheets';
import { ExcelImportModal } from '../components/ExcelImportModal';
import { ExcelImportService } from '../services/excelImportService';

interface AccountManagementProps {
  currentUser: User;
  onRefreshData?: () => void;
}

type RoleOption = 'HDAN' | 'GV' | 'HS' | 'HOUSEHOLD' | 'ADMIN';

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
  const [selectedRoleType, setSelectedRoleType] = useState<RoleOption>('HS');

  const [newAccountData, setNewAccountData] = useState({
    username: '',
    fullName: '',
    phone: '',
    email: '',
    title: '',
    organization: '',
    password: '123456',
    // Dành cho Hộ chăn nuôi gà
    householdId: '',
    address: 'Xã Tân Lập, Huyện Yên Định',
    livestockType: 'Gà ri lai thả vườn',
    herdSize: 500,
    farmingYears: 3,
    farmingType: 'Bán chăn thả có đệm lót sinh học',
    currentWasteMethod: 'Đệm lót sinh học Balasa N01',
    group: 'TN' as StudyGroup,
  });

  // Modal bàn giao thông tin tài khoản vừa tạo
  const [handedOverAccount, setHandedOverAccount] = useState<{
    roleLabel: string;
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

  // Đồng bộ 2 chiều từ Google Sheets về App
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
          text: res.message || `Đã đồng bộ thành công ${updated.length} tài khoản từ Google Sheets!`,
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

  // Xác định nhãn hiển thị vai trò
  const getRoleDisplay = (u: User) => {
    if (u.role === 'ADMIN') {
      return { label: 'QUẢN TRỊ VIÊN', color: 'bg-purple-100 text-purple-800' };
    }
    if (u.role === 'HOUSEHOLD') {
      return { label: 'HỘ CHĂN NUÔI GÀ', color: 'bg-emerald-100 text-emerald-800' };
    }
    if (u.role === 'SUPERVISOR') {
      const titleNorm = (u.title || '').toLowerCase();
      if (titleNorm.includes('hướng dẫn') || titleNorm.includes('hdan') || titleNorm.includes('cố vấn')) {
        return { label: 'CÁN BỘ HƯỚNG DẪN (HDAN)', color: 'bg-amber-100 text-amber-800' };
      }
      return { label: 'GIẢNG VIÊN (GV)', color: 'bg-orange-100 text-orange-800' };
    }
    return { label: 'HỌC SINH / HỌC VIÊN (HS)', color: 'bg-blue-100 text-blue-800' };
  };

  // Lọc danh sách tài khoản
  const filteredUsers = users.filter((u) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      u.username.toLowerCase().includes(q) ||
      u.fullName.toLowerCase().includes(q) ||
      u.phone.includes(searchTerm) ||
      (u.householdId && u.householdId.toLowerCase().includes(q)) ||
      (u.organization && u.organization.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (filterRole === 'ALL') return true;
    if (filterRole === 'ADMIN') return u.role === 'ADMIN';
    if (filterRole === 'HOUSEHOLD') return u.role === 'HOUSEHOLD';
    if (filterRole === 'RESEARCHER') return u.role === 'RESEARCHER';
    if (filterRole === 'GV') {
      return u.role === 'SUPERVISOR' && !(u.title || '').toLowerCase().includes('hướng dẫn');
    }
    if (filterRole === 'HDAN') {
      return u.role === 'SUPERVISOR' && (u.title || '').toLowerCase().includes('hướng dẫn');
    }
    if (filterRole === 'SUPERVISOR') return u.role === 'SUPERVISOR';

    return true;
  });

  // Mở modal tạo mới với vai trò được chọn
  const handleOpenAddModal = (defaultRole: RoleOption = 'HS') => {
    setSelectedRoleType(defaultRole);
    const households = StorageService.getHouseholds();
    const nextHNum = households.length + 1;
    const nextHId = `H${nextHNum.toString().padStart(2, '0')}`;

    setNewAccountData({
      username: defaultRole === 'HOUSEHOLD' ? nextHId.toLowerCase() : '',
      fullName: '',
      phone: '',
      email: '',
      title:
        defaultRole === 'HDAN'
          ? 'Cán bộ hướng dẫn đề tài'
          : defaultRole === 'GV'
          ? 'Giảng viên'
          : defaultRole === 'HS'
          ? 'Học sinh / Học viên thực hiện'
          : defaultRole === 'HOUSEHOLD'
          ? 'Chủ hộ chăn nuôi'
          : 'Quản trị viên',
      organization:
        defaultRole === 'HDAN'
          ? 'Chi cục Thú y / Viện nghiên cứu'
          : defaultRole === 'GV'
          ? 'Khoa Chăn nuôi Thú y'
          : defaultRole === 'HS'
          ? 'Lớp Thú y K65'
          : 'Xã Tân Lập, Huyện Yên Định',
      password: '123456',
      householdId: nextHId,
      address: 'Xã Tân Lập, Huyện Yên Định',
      livestockType: 'Gà ri lai thả vườn',
      herdSize: 500,
      farmingYears: 3,
      farmingType: 'Bán chăn thả có đệm lót sinh học',
      currentWasteMethod: 'Đệm lót sinh học Balasa N01',
      group: nextHNum <= 20 ? 'TN' : 'DC',
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  // Tạo tài khoản an toàn & lưu vĩnh viễn
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newAccountData.username.trim() || !newAccountData.fullName.trim() || !newAccountData.password.trim()) {
      setFormError('Vui lòng điền đầy đủ Tên đăng nhập, Họ tên và Mật khẩu.');
      return;
    }

    const cleanUsername = newAccountData.username.trim().toLowerCase();

    if (users.some((u) => u.username.toLowerCase() === cleanUsername)) {
      setFormError(`Tên đăng nhập "${cleanUsername}" đã tồn tại! Vui lòng chọn tên khác.`);
      return;
    }

    // Xác định Role hệ thống và Title chuẩn
    let role: Role = 'RESEARCHER';
    let roleTitleLabel = 'Học sinh / Học viên (HS)';
    let actualTitle = newAccountData.title.trim();

    if (selectedRoleType === 'ADMIN') {
      role = 'ADMIN';
      roleTitleLabel = 'Quản trị viên';
      if (!actualTitle) actualTitle = 'Chủ nhiệm đề tài';
    } else if (selectedRoleType === 'HDAN') {
      role = 'SUPERVISOR';
      roleTitleLabel = 'Cán bộ hướng dẫn (HDAN)';
      if (!actualTitle) actualTitle = 'Cán bộ hướng dẫn';
    } else if (selectedRoleType === 'GV') {
      role = 'SUPERVISOR';
      roleTitleLabel = 'Giảng viên (GV)';
      if (!actualTitle) actualTitle = 'Giảng viên';
    } else if (selectedRoleType === 'HOUSEHOLD') {
      role = 'HOUSEHOLD';
      roleTitleLabel = 'Hộ chăn nuôi gà';
      if (!actualTitle) actualTitle = 'Chủ hộ';
    } else {
      role = 'RESEARCHER';
      roleTitleLabel = 'Học sinh / Học viên (HS)';
      if (!actualTitle) actualTitle = 'Học sinh / Học viên';
    }

    // Lưu mật khẩu trực tiếp, không băm SHA-256 phức tạp
    const cleanPassword = newAccountData.password.trim() || '123456';

    const hid = selectedRoleType === 'HOUSEHOLD'
      ? (newAccountData.householdId.trim().toUpperCase() || cleanUsername.toUpperCase())
      : undefined;

    const newUser: User = {
      id: `USR_${Date.now()}`,
      username: cleanUsername,
      fullName: newAccountData.fullName.trim(),
      phone: newAccountData.phone.trim(),
      email: newAccountData.email.trim() || undefined,
      title: actualTitle,
      organization: newAccountData.organization.trim() || undefined,
      role,
      householdId: hid,
      status: 'ACTIVE',
      password: cleanPassword,
      plainPasswordHint: cleanPassword,
      createdAt: new Date().toISOString(),
    };

    // 1. Lưu User vào danh sách
    const currentUsers = [...users, newUser];
    StorageService.saveUsers(currentUsers);
    setUsers(currentUsers);

    // 2. NẾU LÀ HỘ CHĂN NUÔI: Tự động tạo luôn bản ghi Hộ chăn nuôi & Phiếu BC-01 liên thông
    if (role === 'HOUSEHOLD' && hid) {
      const existingHouseholds = StorageService.getHouseholds();
      const existingH = existingHouseholds.find((h) => h.id === hid);

      const newHousehold: Household = {
        id: hid,
        representativeName: newUser.fullName,
        phone: newUser.phone,
        address: newAccountData.address.trim() || 'Khu vực chăn nuôi gà',
        livestockType: newAccountData.livestockType.trim() || 'Gà ri lai thả vườn',
        herdSize: Number(newAccountData.herdSize) || 500,
        farmingYears: Number(newAccountData.farmingYears) || 3,
        farmingType: newAccountData.farmingType || 'Bán chăn thả có đệm lót sinh học',
        currentWasteMethod: newAccountData.currentWasteMethod || 'Đệm lót sinh học Balasa N01',
        group: newAccountData.group,
        accountStatus: 'ACTIVE',
        joinedDate: existingH ? existingH.joinedDate : new Date().toISOString().split('T')[0],
        assignedResearcher: 'Chưa phân công',
        notes: 'Tạo tài khoản từ Quản lý cán bộ & hộ chăn nuôi',
        createdAt: existingH ? existingH.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.username,
        isLocked: false,
      };

      const updatedHouseholds = existingHouseholds.filter((h) => h.id !== hid);
      updatedHouseholds.push(newHousehold);
      updatedHouseholds.sort((a, b) => a.id.localeCompare(b.id));
      StorageService.saveHouseholds(updatedHouseholds);

      // Đồng bộ sang BC-01
      const existingBC01 = StorageService.getBC01List();
      const prevBc = existingBC01.find((b) => b.householdId === hid);
      const newBc01: BC01Record = {
        id: prevBc?.id || `BC01_${hid}`,
        householdId: hid,
        representativeName: newHousehold.representativeName,
        phone: newHousehold.phone,
        address: newHousehold.address,
        livestockType: newHousehold.livestockType,
        herdSize: newHousehold.herdSize,
        farmingYears: newHousehold.farmingYears,
        farmingType: newHousehold.farmingType,
        currentWasteMethod: newHousehold.currentWasteMethod,
        notes: newHousehold.notes,
        isLocked: prevBc?.isLocked || false,
        createdAt: prevBc?.createdAt || new Date().toISOString(),
        createdBy: prevBc?.createdBy || currentUser.username,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.username,
      };
      const updatedBC01 = existingBC01.filter((b) => b.householdId !== hid);
      updatedBC01.push(newBc01);
      StorageService.saveBC01List(updatedBC01);
    }

    // 3. Đồng bộ lưu trữ vĩnh viễn lên Google Sheets ngay lập tức
    GoogleSheetsService.triggerAutoSave(50);

    // 4. Ghi Audit Log
    StorageService.addAuditLog({
      userId: currentUser.id,
      username: currentUser.username,
      userRole: currentUser.role,
      action: 'CREATE',
      targetModule: 'USERS',
      householdId: newUser.householdId,
      reason: `Tạo tài khoản mới ${newUser.username} (${newUser.fullName}, vai trò: ${roleTitleLabel}).`,
    });

    setIsAddModalOpen(false);

    // 5. Bàn giao thông tin tài khoản cho Admin in hoặc gửi cho người dùng
    setHandedOverAccount({
      roleLabel: roleTitleLabel,
      username: newUser.username,
      fullName: newUser.fullName,
      householdId: newUser.householdId,
      tempPassword: newAccountData.password.trim(),
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
    GoogleSheetsService.triggerAutoSave(50);

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

  // Đổi / Đặt lại mật khẩu trực tiếp, không băm phức tạp
  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUser || !newPasswordInput.trim()) return;

    const newPass = newPasswordInput.trim();
    const currentList = users.map((item) =>
      item.id === resetUser.id
        ? {
            ...item,
            password: newPass,
            plainPasswordHint: newPass,
          }
        : item
    );

    StorageService.saveUsers(currentList);
    setUsers(currentList);
    GoogleSheetsService.triggerAutoSave(50);

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
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              QUẢN LÝ CÁN BỘ &amp; TÀI KHOẢN HỆ THỐNG
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Cấp phát tài khoản: <strong>Cán bộ hướng dẫn (HDAN)</strong> • <strong>Giảng viên (GV)</strong> • <strong>Học sinh (HS)</strong> • <strong>Hộ chăn nuôi gà</strong> • Lưu vĩnh viễn trên Google Sheets
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSyncFromSheets}
            disabled={isSyncingSheets}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-xs"
            title="Đồng bộ 2 chiều: Tải toàn bộ tài khoản từ Google Sheets về hệ thống"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-white ${isSyncingSheets ? 'animate-spin' : ''}`} />
            <span>{isSyncingSheets ? 'Đang đồng bộ...' : 'Đồng bộ từ Google Sheets'}</span>
          </button>

          <button
            onClick={() => setIsExcelModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-xs"
            title="Tải tệp dữ liệu tài khoản (.xlsx, .xls, .csv) chứa HDAN, GV, HS hoặc Hộ chăn nuôi"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>Tải file dữ liệu tài khoản</span>
          </button>

          <button
            onClick={ExcelImportService.downloadCombinedTemplate}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-2xs"
            title="Tải tệp mẫu Excel đầy đủ các vai trò HDAN, GV, HS và Hộ chăn nuôi"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tải mẫu Excel</span>
          </button>

          <div className="relative inline-block">
            <button
              onClick={() => handleOpenAddModal('HS')}
              className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center space-x-2 transition-colors shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tạo tài khoản mới</span>
            </button>
          </div>
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

      {/* Bàn giao thông tin tài khoản vừa tạo */}
      {handedOverAccount && (
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-5 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-emerald-900 font-extrabold text-sm">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span>ĐÃ TẠO VÀ LƯU VĨNH VIỄN TÀI KHOẢN VÀO HỆ THỐNG</span>
            </div>
            <button
              onClick={() => setHandedOverAccount(null)}
              className="p-1 rounded-lg text-emerald-700 hover:bg-emerald-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-emerald-800">
            Thông tin bàn giao cho người dùng đăng nhập trên điện thoại / máy tính:
          </p>

          <div className="bg-white p-3.5 rounded-xl border border-emerald-200 font-mono text-xs text-slate-800 space-y-1">
            <div>
              <strong>Vai trò:</strong> {handedOverAccount.roleLabel}
            </div>
            <div>
              <strong>Họ và tên:</strong> {handedOverAccount.fullName}
            </div>
            {handedOverAccount.householdId && (
              <div>
                <strong>Mã hộ liên kết:</strong> {handedOverAccount.householdId}
              </div>
            )}
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
              const text = `TÀI KHOẢN GREEN FARM RESEARCH:\nVai trò: ${handedOverAccount.roleLabel}\nHọ tên: ${handedOverAccount.fullName}\nTên đăng nhập: ${handedOverAccount.username}\nMật khẩu: ${handedOverAccount.tempPassword}${handedOverAccount.householdId ? `\nMã hộ: ${handedOverAccount.householdId}` : ''}`;
              navigator.clipboard.writeText(text);
              setCopiedHandover(true);
              setTimeout(() => setCopiedHandover(false), 2000);
            }}
            className="px-4 py-1.5 bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs"
          >
            {copiedHandover ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedHandover ? 'Đã sao chép!' : 'Sao chép thông tin bàn giao'}</span>
          </button>
        </div>
      )}

      {/* Thanh lọc & tìm kiếm */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo username, họ tên, mã hộ, số điện thoại, đơn vị..."
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-700">LỌC VAI TRÒ:</span>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white font-bold"
          >
            <option value="ALL">Tất cả tài khoản ({users.length})</option>
            <option value="HDAN">Cán bộ Hướng dẫn (HDAN)</option>
            <option value="GV">Giảng viên (GV)</option>
            <option value="RESEARCHER">Học sinh / Học viên (HS)</option>
            <option value="HOUSEHOLD">Hộ chăn nuôi gà (Hộ dân)</option>
            <option value="ADMIN">Quản trị viên (Chủ nhiệm đề tài)</option>
          </select>
        </div>
      </div>

      {/* Bảng danh sách tài khoản */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-900 text-slate-200 uppercase font-extrabold text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">Tên đăng nhập</th>
                <th className="py-3 px-3">Họ và tên</th>
                <th className="py-3 px-3">Vai trò nhận diện</th>
                <th className="py-3 px-3">Đơn vị / Địa chỉ</th>
                <th className="py-3 px-3">Mã Hộ</th>
                <th className="py-3 px-3">Số điện thoại</th>
                <th className="py-3 px-3">Trạng thái</th>
                <th className="py-3 px-3 text-center">Mật khẩu</th>
                <th className="py-3 px-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Không tìm thấy tài khoản nào phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const roleBadge = getRoleDisplay(u);
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
                        <span className={`px-2.5 py-0.5 rounded-md font-bold text-[10px] ${roleBadge.color}`}>
                          {roleBadge.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {u.organization || '-'}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900 font-mono">
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
                            {u.plainPasswordHint || u.password || '123456'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setResetUser(u);
                              setNewPasswordInput(u.plainPasswordHint || u.password || '123456');
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
                          <button
                            onClick={() => {
                              setResetUser(u);
                              setNewPasswordInput(u.plainPasswordHint || u.password || '123456');
                            }}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-emerald-700 transition-colors"
                            title="Đặt lại mật khẩu an toàn"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

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
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL TẠO TÀI KHOẢN MỚI (Hỗ trợ đầy đủ HDAN, GV, HS, Hộ chăn nuôi) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 space-y-4 my-6 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-black text-slate-900 tracking-tight">
                  TẠO TÀI KHOẢN MỚI THỦ CÔNG
                </h2>
                <p className="text-xs text-slate-500">
                  Cấp tài khoản an toàn • Lưu vĩnh viễn trên Google Sheets
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center space-x-2 border border-red-200">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAccount} className="space-y-4 text-xs">
              {/* Chọn vai trò chuẩn xác */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">
                  VAI TRÒ TÀI KHOẢN CẦN CẤP:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRoleType('HDAN');
                      setNewAccountData(prev => ({
                        ...prev,
                        title: 'Cán bộ hướng dẫn đề tài',
                        organization: 'Chi cục Thú y / Viện nghiên cứu',
                      }));
                    }}
                    className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                      selectedRoleType === 'HDAN'
                        ? 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-400/40'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="text-[11px] font-black">1. Cán bộ Hướng dẫn</div>
                    <div className="text-[10px] font-normal text-slate-500">Ký hiệu: HDAN</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRoleType('GV');
                      setNewAccountData(prev => ({
                        ...prev,
                        title: 'Giảng viên',
                        organization: 'Khoa Chăn nuôi Thú y',
                      }));
                    }}
                    className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                      selectedRoleType === 'GV'
                        ? 'border-orange-500 bg-orange-50 text-orange-900 ring-2 ring-orange-400/40'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="text-[11px] font-black">2. Giảng viên</div>
                    <div className="text-[10px] font-normal text-slate-500">Ký hiệu: GV</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRoleType('HS');
                      setNewAccountData(prev => ({
                        ...prev,
                        title: 'Học sinh / Học viên thực hiện',
                        organization: 'Lớp Thú y K65',
                      }));
                    }}
                    className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                      selectedRoleType === 'HS'
                        ? 'border-blue-500 bg-blue-50 text-blue-900 ring-2 ring-blue-400/40'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="text-[11px] font-black">3. Học sinh / Học viên</div>
                    <div className="text-[10px] font-normal text-slate-500">Ký hiệu: HS</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRoleType('HOUSEHOLD');
                      const households = StorageService.getHouseholds();
                      const nextHid = `H${(households.length + 1).toString().padStart(2, '0')}`;
                      setNewAccountData(prev => ({
                        ...prev,
                        username: nextHid.toLowerCase(),
                        householdId: nextHid,
                        title: 'Chủ hộ',
                        organization: 'Xã Tân Lập, Huyện Yên Định',
                      }));
                    }}
                    className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                      selectedRoleType === 'HOUSEHOLD'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-400/40'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="text-[11px] font-black">4. Hộ chăn nuôi gà</div>
                    <div className="text-[10px] font-normal text-slate-500">Hộ dân nuôi gà</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRoleType('ADMIN');
                      setNewAccountData(prev => ({
                        ...prev,
                        title: 'Chủ nhiệm đề tài',
                        organization: 'Trường Đại học / Viện',
                      }));
                    }}
                    className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                      selectedRoleType === 'ADMIN'
                        ? 'border-purple-500 bg-purple-50 text-purple-900 ring-2 ring-purple-400/40'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="text-[11px] font-black">5. Quản trị viên</div>
                    <div className="text-[10px] font-normal text-slate-500">Toàn quyền Admin</div>
                  </button>
                </div>
              </div>

              {/* Nếu là Hộ chăn nuôi gà: Nhập các thông tin nông trại liên thông */}
              {selectedRoleType === 'HOUSEHOLD' && (
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
                  <div className="font-bold text-emerald-900 flex items-center space-x-1.5 text-xs">
                    <Home className="w-4 h-4 text-emerald-700" />
                    <span>THÔNG TIN HỘ CHĂN NUÔI LIÊN THÔNG (TỰ ĐỘNG TẠO HỒ SƠ &amp; BC-01)</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">MÃ HỘ (*)</label>
                      <input
                        type="text"
                        required
                        value={newAccountData.householdId}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase();
                          setNewAccountData({
                            ...newAccountData,
                            householdId: val,
                            username: val.toLowerCase(),
                          });
                        }}
                        placeholder="H01, H02..."
                        className="w-full border border-slate-300 rounded-xl p-2.5 font-mono uppercase font-bold bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">NHÓM NGHIÊN CỨU</label>
                      <select
                        value={newAccountData.group}
                        onChange={(e) =>
                          setNewAccountData({ ...newAccountData, group: e.target.value as StudyGroup })
                        }
                        className="w-full border border-slate-300 rounded-xl p-2.5 font-bold bg-white"
                      >
                        <option value="TN">Can thiệp (TN)</option>
                        <option value="DC">Đối chứng (ĐC)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">GIỐNG GÀ NUÔI</label>
                      <input
                        type="text"
                        value={newAccountData.livestockType}
                        onChange={(e) =>
                          setNewAccountData({ ...newAccountData, livestockType: e.target.value })
                        }
                        placeholder="Gà ri lai thả vườn..."
                        className="w-full border border-slate-300 rounded-xl p-2.5 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">QUY MÔ ĐÀN (CON)</label>
                      <input
                        type="number"
                        value={newAccountData.herdSize}
                        onChange={(e) =>
                          setNewAccountData({ ...newAccountData, herdSize: Number(e.target.value) })
                        }
                        className="w-full border border-slate-300 rounded-xl p-2.5 bg-white font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">ĐỊA CHỈ TRANG TRẠI</label>
                    <input
                      type="text"
                      value={newAccountData.address}
                      onChange={(e) =>
                        setNewAccountData({ ...newAccountData, address: e.target.value })
                      }
                      placeholder="Thôn 1, Xã Tân Lập, Huyện Yên Định..."
                      className="w-full border border-slate-300 rounded-xl p-2.5 bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Thông tin đăng nhập cơ bản */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">TÊN ĐĂNG NHẬP (*)</label>
                  <input
                    type="text"
                    required
                    value={newAccountData.username}
                    onChange={(e) => setNewAccountData({ ...newAccountData, username: e.target.value })}
                    placeholder={
                      selectedRoleType === 'HDAN'
                        ? 'hd_mai'
                        : selectedRoleType === 'GV'
                        ? 'gv_tuan'
                        : selectedRoleType === 'HS'
                        ? 'hs01'
                        : selectedRoleType === 'HOUSEHOLD'
                        ? 'h01'
                        : 'admin'
                    }
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {selectedRoleType === 'HOUSEHOLD' ? 'HỌ TÊN CHỦ HỘ (*)' : 'HỌ VÀ TÊN ĐẦY ĐỦ (*)'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newAccountData.fullName}
                    onChange={(e) => setNewAccountData({ ...newAccountData, fullName: e.target.value })}
                    placeholder="Nguyễn Văn A"
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-medium"
                  />
                </div>
              </div>

              {selectedRoleType !== 'HOUSEHOLD' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">HỌC HÀM / HỌC VỊ / CHỨC VỤ</label>
                    <input
                      type="text"
                      value={newAccountData.title}
                      onChange={(e) => setNewAccountData({ ...newAccountData, title: e.target.value })}
                      placeholder="PGS.TS, ThS, Kỹ sư, Cán bộ hướng dẫn..."
                      className="w-full border border-slate-300 rounded-xl p-2.5"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">ĐƠN VỊ CÔNG TÁC / LỚP</label>
                    <input
                      type="text"
                      value={newAccountData.organization}
                      onChange={(e) => setNewAccountData({ ...newAccountData, organization: e.target.value })}
                      placeholder="Khoa Chăn nuôi, Chi cục Thú y, Lớp Thú y K65..."
                      className="w-full border border-slate-300 rounded-xl p-2.5"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  <label className="block font-bold text-slate-700 mb-1">MẬT KHẨU BAN ĐẦU (*)</label>
                  <input
                    type="text"
                    required
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
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-xs flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Tạo tài khoản &amp; Đồng bộ</span>
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
              Cấp mật khẩu mới cho <strong>{resetUser.fullName}</strong>. Mật khẩu được cập nhật trực tiếp và lưu đồng bộ vĩnh viễn trên Google Sheets (người dùng đăng nhập được ngay lập tức).
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
                  Xác nhận &amp; Cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tải tệp Excel tổng hợp */}
      <ExcelImportModal
        isOpen={isExcelModalOpen}
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
