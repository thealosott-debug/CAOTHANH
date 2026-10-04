import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit,
  Shuffle,
  ShieldAlert,
  Lock,
  Unlock,
  CheckCircle,
  FileSpreadsheet,
  AlertCircle,
  X,
  Save,
  Trash2,
  Download,
} from 'lucide-react';
import { BC01Record, Household, Role, StudyGroup, User } from '../types';
import { StorageService } from '../services/storage';
import { UnlockModal } from '../components/UnlockModal';
import { ExcelImportModal } from '../components/ExcelImportModal';
import { ExcelImportService } from '../services/excelImportService';
import { generateSalt, hashPassword } from '../utils/crypto';

interface HouseholdManagementProps {
  currentUser: User;
  onRefreshData?: () => void;
}

export const HouseholdManagement: React.FC<HouseholdManagementProps> = ({
  currentUser,
  onRefreshData,
}) => {
  const isAdmin = currentUser.role === 'ADMIN';
  const [households, setHouseholds] = useState<Household[]>(StorageService.getHouseholds());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroup, setFilterGroup] = useState<StudyGroup | 'ALL'>('ALL');
  const [filterLivestock, setFilterLivestock] = useState<string>('ALL');

  // Modal Excel
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);

  // Modal thêm / sửa hộ
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHousehold, setEditingHousehold] = useState<Household | null>(null);

  // Modal đổi nhóm cần lý do Audit Log
  const [isChangeGroupModalOpen, setIsChangeGroupModalOpen] = useState(false);
  const [targetHouseholdForGroup, setTargetHouseholdForGroup] = useState<Household | null>(null);
  const [newGroupSelected, setNewGroupSelected] = useState<StudyGroup>('TN');
  const [groupChangeReason, setGroupChangeReason] = useState('');

  const availableResearchers = StorageService.getUsers().filter(
    (u) => u.role === 'RESEARCHER' || u.role === 'ADMIN'
  );

  // Form state
  const [formData, setFormData] = useState({
    id: '',
    representativeName: '',
    phone: '',
    address: '',
    livestockType: 'Lợn thịt',
    herdSize: 50,
    farmingYears: 3,
    farmingType: 'Gia trại chuồng hở',
    currentWasteMethod: 'Biogas composite',
    group: 'TN' as StudyGroup,
    assignedResearcher: '',
    notes: '',
  });

  const [formError, setFormError] = useState('');

  // Lọc danh sách hộ
  const filteredHouseholds = households.filter((h) => {
    const matchesSearch =
      h.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.representativeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.phone.includes(searchTerm);

    const matchesGroup = filterGroup === 'ALL' || h.group === filterGroup;
    const matchesLivestock = filterLivestock === 'ALL' || h.livestockType.includes(filterLivestock);

    return matchesSearch && matchesGroup && matchesLivestock;
  });

  // Mở modal thêm mới
  const handleOpenAdd = () => {
    setEditingHousehold(null);
    // Tự sinh mã hộ tiếp theo
    const nextNum = households.length + 1;
    const nextId = `H${nextNum.toString().padStart(2, '0')}`;
    setFormData({
      id: nextId,
      representativeName: '',
      phone: '',
      address: '',
      livestockType: 'Lợn thịt',
      herdSize: 50,
      farmingYears: 3,
      farmingType: 'Gia trại chuồng hở',
      currentWasteMethod: 'Biogas composite',
      group: nextNum <= 20 ? 'TN' : 'DC',
      assignedResearcher: availableResearchers[0]?.fullName || '',
      notes: '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Xóa sạch toàn bộ dữ liệu nền mẫu để người dùng tự nhập dữ liệu thực
  const handleResetToClean = async () => {
    const confirmClean = window.confirm(
      'BẠN CÓ CHẮC CHẮN MUỐN XÓA TOÀN BỘ DỮ LIỆU NỀN MẪU?\n\n' +
      '• Toàn bộ danh sách hộ kinh doanh, người nghiên cứu, các phiếu khảo sát và báo cáo mẫu sẽ được xóa sạch.\n' +
      '• Hệ thống chỉ giữ lại duy nhất tài khoản Quản trị viên (admin / admin123) để bạn tự nhập dữ liệu thực tế.\n\n' +
      'Bấm OK để thực hiện ngay.'
    );
    if (!confirmClean) return;

    await StorageService.resetToCleanState();
    setHouseholds([]);
    alert('Đã xóa sạch toàn bộ dữ liệu mẫu! Giờ bạn có thể bắt đầu nhập dữ liệu thực tế của mình.');
    if (onRefreshData) onRefreshData();
  };

  // Mở modal sửa hộ
  const handleOpenEdit = (h: Household) => {
    setEditingHousehold(h);
    setFormData({
      id: h.id,
      representativeName: h.representativeName,
      phone: h.phone,
      address: h.address,
      livestockType: h.livestockType,
      herdSize: h.herdSize,
      farmingYears: h.farmingYears,
      farmingType: h.farmingType,
      currentWasteMethod: h.currentWasteMethod,
      group: h.group,
      assignedResearcher: h.assignedResearcher,
      notes: h.notes || '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Lưu hộ chăn nuôi
  const handleSaveHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id.trim() || !formData.representativeName.trim() || !formData.phone.trim()) {
      setFormError('Vui lòng điền đầy đủ Mã hộ, Họ tên đại diện và Số điện thoại.');
      return;
    }

    // Kiểm tra trùng mã hộ khi tạo mới
    if (!editingHousehold && households.some((h) => h.id.toUpperCase() === formData.id.trim().toUpperCase())) {
      setFormError(`Mã hộ "${formData.id}" đã tồn tại trong danh mục! Mã hộ phải là duy nhất.`);
      return;
    }

    const currentList = StorageService.getHouseholds();

    if (editingHousehold) {
      // Cập nhật
      const index = currentList.findIndex((h) => h.id === editingHousehold.id);
      if (index >= 0) {
        const oldH = currentList[index];
        const updated: Household = {
          ...oldH,
          representativeName: formData.representativeName.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          livestockType: formData.livestockType,
          herdSize: Number(formData.herdSize),
          farmingYears: Number(formData.farmingYears),
          farmingType: formData.farmingType,
          currentWasteMethod: formData.currentWasteMethod,
          assignedResearcher: formData.assignedResearcher,
          notes: formData.notes.trim(),
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser.username,
        };

        currentList[index] = updated;
        StorageService.saveHouseholds(currentList);
        setHouseholds(currentList);

        // Đồng bộ tức thì sang phiếu BC-01 nếu đã tồn tại
        const bc01List = StorageService.getBC01List();
        const bc01Index = bc01List.findIndex((b) => b.householdId === updated.id);
        if (bc01Index >= 0) {
          bc01List[bc01Index] = {
            ...bc01List[bc01Index],
            representativeName: updated.representativeName,
            phone: updated.phone,
            address: updated.address,
            livestockType: updated.livestockType,
            herdSize: updated.herdSize,
            farmingYears: updated.farmingYears,
            farmingType: updated.farmingType,
            currentWasteMethod: updated.currentWasteMethod,
            notes: updated.notes,
            updatedAt: new Date().toISOString(),
            updatedBy: currentUser.username,
          };
          StorageService.saveBC01List(bc01List);
        }

        // Cập nhật tên và SĐT vào tài khoản người dùng tương ứng
        const userList = StorageService.getUsers();
        const uIndex = userList.findIndex((u) => u.householdId === updated.id);
        if (uIndex >= 0) {
          userList[uIndex].fullName = updated.representativeName;
          userList[uIndex].phone = updated.phone;
          StorageService.saveUsers(userList);
        }

        StorageService.addAuditLog({
          userId: currentUser.id,
          username: currentUser.username,
          userRole: currentUser.role,
          action: 'UPDATE',
          targetModule: 'HOUSEHOLDS',
          householdId: updated.id,
          oldValue: JSON.stringify({ name: oldH.representativeName, phone: oldH.phone }),
          newValue: JSON.stringify({ name: updated.representativeName, phone: updated.phone }),
          reason: `Admin/NCV cập nhật thông tin hộ ${updated.id}.`,
        });
      }
    } else {
      // Tạo mới
      const newH: Household = {
        id: formData.id.trim().toUpperCase(),
        representativeName: formData.representativeName.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        livestockType: formData.livestockType,
        herdSize: Number(formData.herdSize),
        farmingYears: Number(formData.farmingYears),
        farmingType: formData.farmingType,
        currentWasteMethod: formData.currentWasteMethod,
        group: formData.group,
        accountStatus: 'ACTIVE',
        joinedDate: new Date().toISOString().slice(0, 10),
        assignedResearcher: formData.assignedResearcher,
        notes: formData.notes.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.username,
      };

      currentList.push(newH);
      StorageService.saveHouseholds(currentList);
      setHouseholds(currentList);

      // Khởi tạo ngay phiếu BC-01 tương ứng cho hộ để dữ liệu liên thông hoàn toàn
      const bc01List = StorageService.getBC01List();
      const newBc01: BC01Record = {
        id: `BC01_${newH.id}`,
        householdId: newH.id,
        representativeName: newH.representativeName,
        phone: newH.phone,
        address: newH.address,
        livestockType: newH.livestockType,
        herdSize: newH.herdSize,
        farmingYears: newH.farmingYears,
        farmingType: newH.farmingType,
        currentWasteMethod: newH.currentWasteMethod,
        notes: newH.notes,
        isLocked: false,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.username,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.username,
      };
      bc01List.push(newBc01);
      StorageService.saveBC01List(bc01List);

      // Tự động cấp tài khoản đăng nhập cho hộ chăn nuôi nếu chưa có (Mật khẩu mặc định: 123456)
      const userList = StorageService.getUsers();
      if (!userList.some((u) => u.householdId === newH.id || u.username === newH.id.toLowerCase())) {
        const hSalt = generateSalt(16);
        const hHash = await hashPassword('123456', hSalt);
        userList.push({
          id: `USR_${newH.id}`,
          username: newH.id.toLowerCase(),
          fullName: newH.representativeName,
          phone: newH.phone,
          role: 'HOUSEHOLD',
          householdId: newH.id,
          status: 'ACTIVE',
          passwordHash: hHash,
          salt: hSalt,
          plainPasswordHint: '123456',
          createdAt: new Date().toISOString(),
        });
        StorageService.saveUsers(userList);
      }

      StorageService.addAuditLog({
        userId: currentUser.id,
        username: currentUser.username,
        userRole: currentUser.role,
        action: 'CREATE',
        targetModule: 'HOUSEHOLDS',
        householdId: newH.id,
        reason: `Tạo mới hồ sơ hộ ${newH.id} (${newH.representativeName}) thuộc nhóm ${newH.group}.`,
      });
    }

    setIsModalOpen(false);
    if (onRefreshData) onRefreshData();
  };

  // Xóa một hộ chăn nuôi
  const handleDeleteHousehold = (h: Household) => {
    if (!isAdmin) return;
    const confirmDelete = window.confirm(
      `BẠN CÓ CHẮC CHẮN MUỐN XÓA HỘ "${h.id} - ${h.representativeName}"?\n\n- Toàn bộ hồ sơ khảo sát và tài khoản liên kết với hộ này sẽ được gỡ bỏ khỏi hệ thống.`
    );
    if (!confirmDelete) return;

    // 1. Xóa khỏi danh sách hộ
    const currentList = StorageService.getHouseholds().filter((item) => item.id !== h.id);
    StorageService.saveHouseholds(currentList);
    setHouseholds(currentList);

    // 2. Xóa khỏi BC01
    const bc01List = StorageService.getBC01List().filter((b) => b.householdId !== h.id);
    StorageService.saveBC01List(bc01List);

    // 3. Xóa tài khoản người dùng
    const userList = StorageService.getUsers().filter((u) => u.householdId !== h.id);
    StorageService.saveUsers(userList);

    // 4. Xóa phiếu khảo sát liên quan
    StorageService.saveBC02List(StorageService.getBC02List().filter((b) => b.householdId !== h.id));
    StorageService.saveBC03List(StorageService.getBC03List().filter((b) => b.householdId !== h.id));
    StorageService.saveBC04List(StorageService.getBC04List().filter((b) => b.householdId !== h.id));
    StorageService.saveBC05List(StorageService.getBC05List().filter((b) => b.householdId !== h.id));
    StorageService.saveBC06List(StorageService.getBC06List().filter((b) => b.householdId !== h.id));
    StorageService.saveBC07List(StorageService.getBC07List().filter((b) => b.householdId !== h.id));

    StorageService.addAuditLog({
      userId: currentUser.id,
      username: currentUser.username,
      userRole: currentUser.role,
      action: 'DELETE',
      targetModule: 'HOUSEHOLDS',
      householdId: h.id,
      reason: `Admin xóa hộ ${h.id} (${h.representativeName}) khỏi hệ thống nghiên cứu.`,
    });

    if (onRefreshData) onRefreshData();
  };

  // Mở modal đổi nhóm
  const handleRequestChangeGroup = (h: Household) => {
    setTargetHouseholdForGroup(h);
    setNewGroupSelected(h.group === 'TN' ? 'DC' : 'TN');
    setGroupChangeReason('');
    setIsChangeGroupModalOpen(true);
  };

  // Xác nhận đổi nhóm với lý do Audit Log
  const handleConfirmChangeGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetHouseholdForGroup || !groupChangeReason.trim()) return;

    const currentList = StorageService.getHouseholds();
    const index = currentList.findIndex((h) => h.id === targetHouseholdForGroup.id);
    if (index >= 0) {
      const oldGroup = currentList[index].group;
      currentList[index].group = newGroupSelected;
      currentList[index].groupChangeReason = groupChangeReason.trim();
      currentList[index].updatedAt = new Date().toISOString();
      currentList[index].updatedBy = currentUser.username;

      StorageService.saveHouseholds(currentList);
      setHouseholds(currentList);

      StorageService.addAuditLog({
        userId: currentUser.id,
        username: currentUser.username,
        userRole: currentUser.role,
        action: 'UPDATE',
        targetModule: 'HOUSEHOLDS_GROUP',
        householdId: targetHouseholdForGroup.id,
        oldValue: `Nhóm = ${oldGroup}`,
        newValue: `Nhóm = ${newGroupSelected}`,
        reason: `Điều chỉnh phân nhóm: ${groupChangeReason.trim()}`,
      });
    }

    setIsChangeGroupModalOpen(false);
    setTargetHouseholdForGroup(null);
    if (onRefreshData) onRefreshData();
  };

  // Phân nhóm ngẫu nhiên (Stratified Random Assignment)
  const handleRandomizeGroups = () => {
    if (!isAdmin) return;
    const confirmRand = window.confirm(
      'BẠN CÓ CHẮC CHẮN MUỐN PHÂN NHÓM NGẪU NHIÊN 40 HỘ?\n\n- Hệ thống sẽ chia ngẫu nhiên 20 hộ vào nhóm Can thiệp (TN) và 20 hộ vào nhóm Đối chứng (ĐC).\n- Thao tác này sẽ được ghi vào AUDIT_LOG theo phương pháp nghiên cứu thực nghiệm.'
    );
    if (!confirmRand) return;

    const currentList = [...StorageService.getHouseholds()];
    // Thuật toán Fisher-Yates xáo trộn
    for (let i = currentList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [currentList[i], currentList[j]] = [currentList[j], currentList[i]];
    }

    const half = Math.floor(currentList.length / 2);
    const randomizedList = currentList.map((h, idx) => ({
      ...h,
      group: (idx < half ? 'TN' : 'DC') as StudyGroup,
      randomizedAt: new Date().toISOString(),
      randomizedBy: currentUser.username,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.username,
    }));

    // Sắp xếp lại theo mã H01..H40
    randomizedList.sort((a, b) => a.id.localeCompare(b.id));

    StorageService.saveHouseholds(randomizedList);
    setHouseholds(randomizedList);

    StorageService.addAuditLog({
      userId: currentUser.id,
      username: currentUser.username,
      userRole: currentUser.role,
      action: 'RANDOMIZE',
      targetModule: 'HOUSEHOLDS',
      reason: `Thực hiện phân ngẫu nhiên chuẩn hóa: ${half} hộ nhóm TN và ${currentList.length - half} hộ nhóm ĐC.`,
    });

    alert('Đã hoàn tất phân nhóm ngẫu nhiên 40 hộ nghiên cứu!');
    if (onRefreshData) onRefreshData();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-6 h-6 text-emerald-600" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              QUẢN LÝ 40 HỘ CHĂN NUÔI THAM GIA NGHIÊN CỨU
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Mã hộ định danh duy nhất H01 - H40 • 20 Hộ Can thiệp (TN) & 20 Hộ Đối chứng (ĐC)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <>
              <button
                onClick={() => setIsExcelModalOpen(true)}
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-xs"
                title="Nhập danh sách hộ chăn nuôi nhanh chóng từ file Excel (.xlsx, .xls, .csv)"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                <span>Nhập từ Excel</span>
              </button>
              <button
                onClick={ExcelImportService.downloadHouseholdTemplate}
                className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-2xs"
                title="Tải tệp mẫu Excel chuẩn để điền dữ liệu"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tải mẫu Excel</span>
              </button>
              <button
                onClick={handleResetToClean}
                className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-xs"
                title="Xóa toàn bộ hộ kinh doanh, người nghiên cứu và dữ liệu nền mẫu để nhập dữ liệu thực"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
                <span>Xóa sạch dữ liệu mẫu</span>
              </button>
              <button
                onClick={handleRandomizeGroups}
                disabled={households.length === 0}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-xs"
                title="Phân ngẫu nhiên 20 TN và 20 ĐC theo chuẩn phương pháp nghiên cứu"
              >
                <Shuffle className="w-4 h-4 text-amber-400" />
                <span>Phân nhóm ngẫu nhiên</span>
              </button>
              <button
                onClick={handleOpenAdd}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm hộ thủ công</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã hộ (H01..), tên chủ hộ, hoặc số điện thoại..."
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          {/* Lọc Nhóm */}
          <select
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value as any)}
            className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
          >
            <option value="ALL">Tất cả nhóm (40 hộ)</option>
            <option value="TN">Nhóm Can thiệp (TN)</option>
            <option value="DC">Nhóm Đối chứng (ĐC)</option>
          </select>

          {/* Lọc Vật nuôi */}
          <select
            value={filterLivestock}
            onChange={(e) => setFilterLivestock(e.target.value)}
            className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
          >
            <option value="ALL">Tất cả vật nuôi</option>
            <option value="Lợn">Lợn (Heo)</option>
            <option value="Bò">Bò</option>
            <option value="Gà">Gà / Gia cầm</option>
            <option value="Vịt">Vịt</option>
          </select>
        </div>
      </div>

      {/* Household Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-extrabold text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Mã Hộ</th>
                <th className="py-3 px-4">Đại diện hộ</th>
                <th className="py-3 px-4">Số điện thoại</th>
                <th className="py-3 px-4">Nhóm</th>
                <th className="py-3 px-4">Vật nuôi & Quy mô</th>
                <th className="py-3 px-4">Hình thức & Xử lý</th>
                <th className="py-3 px-4">Người phụ trách</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredHouseholds.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 px-4 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                        <FileSpreadsheet className="w-6 h-6" />
                      </div>
                      <div className="font-extrabold text-slate-800 text-sm">
                        {households.length === 0
                          ? 'Chưa có hộ chăn nuôi nào trong hệ thống'
                          : 'Không tìm thấy hộ nào phù hợp với bộ lọc'}
                      </div>
                      <p className="text-xs text-slate-500">
                        {households.length === 0
                          ? 'Bạn có thể nhập toàn bộ danh sách 40 hộ nhanh chóng bằng tệp Excel (.xlsx) chuẩn hoặc nhập thủ công từng hộ.'
                          : 'Thử tìm kiếm với từ khóa khác hoặc bỏ chọn bộ lọc nhóm/vật nuôi.'}
                      </p>
                      {households.length === 0 && isAdmin && (
                        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setIsExcelModalOpen(true)}
                            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm"
                          >
                            <FileSpreadsheet className="w-4 h-4" />
                            <span>Nhập danh sách bằng file Excel (.xlsx)</span>
                          </button>
                          <button
                            type="button"
                            onClick={ExcelImportService.downloadHouseholdTemplate}
                            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1"
                          >
                            <Download className="w-3.5 h-3.5 text-slate-500" />
                            <span>Tải file mẫu Excel</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredHouseholds.map((h) => {
                  const isTN = h.group === 'TN';
                  return (
                    <tr key={h.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-extrabold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                          {h.id}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{h.representativeName}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[180px]">{h.address}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">{h.phone}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => isAdmin && handleRequestChangeGroup(h)}
                          disabled={!isAdmin}
                          className={`px-2.5 py-1 rounded-full font-extrabold text-[11px] transition-transform active:scale-95 ${
                            isTN
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-teal-100 text-teal-800 border border-teal-300'
                          } ${isAdmin ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                          title={isAdmin ? 'Bấm để đổi nhóm (yêu cầu ghi lý do vào Audit Log)' : ''}
                        >
                          {isTN ? 'TN (Can thiệp)' : 'ĐC (Đối chứng)'}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-900">{h.livestockType}</div>
                        <div className="text-[10px] text-emerald-700 font-bold">{h.herdSize} con</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-700">{h.farmingType}</div>
                        <div className="text-[10px] text-slate-500">{h.currentWasteMethod}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{h.assignedResearcher}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleOpenEdit(h)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-emerald-700 transition-colors"
                            title="Sửa thông tin hộ"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteHousehold(h)}
                              className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                              title="Xóa hộ chăn nuôi này"
                            >
                              <Trash2 className="w-4 h-4" />
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

      {/* Modal Thêm / Sửa Hộ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-lg font-bold text-slate-900">
                {editingHousehold ? `CHỈNH SỬA THÔNG TIN HỘ ${formData.id}` : 'THÊM HỘ CHĂN NUÔI MỚI'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveHousehold} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">MÃ HỘ (DUY NHẤT) *</label>
                  <input
                    type="text"
                    value={formData.id}
                    disabled={!!editingHousehold}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50 uppercase font-mono font-bold"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">HỌ VÀ TÊN ĐẠI DIỆN *</label>
                  <input
                    type="text"
                    value={formData.representativeName}
                    onChange={(e) => setFormData({ ...formData, representativeName: e.target.value })}
                    placeholder="Nguyễn Văn An"
                    className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">SỐ ĐIỆN THOẠI *</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0912345678"
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NHÓM NGHIÊN CỨU</label>
                  <select
                    value={formData.group}
                    onChange={(e) => setFormData({ ...formData, group: e.target.value as StudyGroup })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 bg-white font-bold"
                  >
                    <option value="TN">Nhóm Can thiệp (TN)</option>
                    <option value="DC">Nhóm Đối chứng (ĐC)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ĐỊA CHỈ / KHU VỰC</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">LOẠI VẬT NUÔI</label>
                  <input
                    type="text"
                    value={formData.livestockType}
                    onChange={(e) => setFormData({ ...formData, livestockType: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">QUY MÔ ĐÀN (CON)</label>
                  <input
                    type="number"
                    value={formData.herdSize}
                    onChange={(e) => setFormData({ ...formData, herdSize: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">SỐ NĂM CHĂN NUÔI</label>
                  <input
                    type="number"
                    value={formData.farmingYears}
                    onChange={(e) => setFormData({ ...formData, farmingYears: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">HÌNH THỨC CHĂN NUÔI</label>
                  <input
                    type="text"
                    value={formData.farmingType}
                    onChange={(e) => setFormData({ ...formData, farmingType: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">XỬ LÝ CHẤT THẢI HIỆN TẠI</label>
                  <input
                    type="text"
                    value={formData.currentWasteMethod}
                    onChange={(e) => setFormData({ ...formData, currentWasteMethod: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">NGHIÊN CỨU VIÊN PHỤ TRÁCH</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={formData.assignedResearcher}
                    onChange={(e) => setFormData({ ...formData, assignedResearcher: e.target.value })}
                    placeholder="Nhập họ tên cán bộ / nghiên cứu viên phụ trách..."
                    className="flex-1 border border-slate-300 rounded-xl p-2.5 bg-white font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                  {availableResearchers.length > 0 && (
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          setFormData({ ...formData, assignedResearcher: e.target.value });
                        }
                      }}
                      className="border border-slate-300 rounded-xl p-2.5 bg-slate-50 text-xs font-semibold"
                    >
                      <option value="">-- Chọn từ danh sách --</option>
                      {availableResearchers.map((r) => (
                        <option key={r.id} value={r.fullName}>
                          {r.fullName} ({r.role === 'ADMIN' ? 'Chủ nhiệm' : 'NCV'})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs"
                >
                  Lưu thông tin hộ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Đổi nhóm bắt buộc nhập lý do Audit Log */}
      {isChangeGroupModalOpen && targetHouseholdForGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center space-x-2 text-amber-600">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="font-bold text-slate-900 text-base">
                ĐIỀU CHỈNH NHÓM NGHIÊN CỨU: {targetHouseholdForGroup.id}
              </h3>
            </div>

            <p className="text-xs text-slate-600">
              Đổi nhóm cho hộ <strong>{targetHouseholdForGroup.representativeName}</strong> từ{' '}
              <span className="font-bold text-emerald-700">{targetHouseholdForGroup.group}</span> sang{' '}
              <span className="font-bold text-teal-700">{newGroupSelected}</span>.
            </p>

            <form onSubmit={handleConfirmChangeGroup} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  CHỌN NHÓM MỚI:
                </label>
                <select
                  value={newGroupSelected}
                  onChange={(e) => setNewGroupSelected(e.target.value as StudyGroup)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 font-bold"
                >
                  <option value="TN">Nhóm Can thiệp (TN)</option>
                  <option value="DC">Nhóm Đối chứng (ĐC)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  LÝ DO ĐIỀU CHỈNH (BẮT BUỘC LƯU AUDIT LOG) *:
                </label>
                <textarea
                  rows={3}
                  required
                  value={groupChangeReason}
                  onChange={(e) => setGroupChangeReason(e.target.value)}
                  placeholder="Ví dụ: Điều chỉnh theo hồ sơ thực nghiệm ngày 02/10 do hộ thay đổi quy mô đàn..."
                  className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsChangeGroupModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!groupChangeReason.trim()}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-xs disabled:opacity-50"
                >
                  Xác nhận đổi nhóm & Ghi Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Nhập dữ liệu Excel */}
      <ExcelImportModal
        isOpen={isExcelModalOpen}
        initialTab="HOUSEHOLDS"
        currentUser={currentUser}
        onClose={() => setIsExcelModalOpen(false)}
        onSuccess={() => {
          setHouseholds(StorageService.getHouseholds());
          if (onRefreshData) onRefreshData();
        }}
      />
    </div>
  );
};
