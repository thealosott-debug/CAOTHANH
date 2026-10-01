import React, { useState } from 'react';
import { FileText, Save, Edit, CheckCircle, Lock, Unlock, AlertCircle } from 'lucide-react';
import { BC01Record, Household, User } from '../types';
import { StorageService } from '../services/storage';
import { UnlockModal } from '../components/UnlockModal';

interface ModuleBC01Props {
  currentUser: User;
  onRefreshData?: () => void;
}

export const ModuleBC01: React.FC<ModuleBC01Props> = ({ currentUser, onRefreshData }) => {
  const households = StorageService.getHouseholds();
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string>('H01');

  const bc01List = StorageService.getBC01List();
  const currentRecord = bc01List.find((b) => b.householdId === selectedHouseholdId);
  const household = households.find((h) => h.id === selectedHouseholdId);

  const [formData, setFormData] = useState({
    representativeName: currentRecord?.representativeName || household?.representativeName || '',
    phone: currentRecord?.phone || household?.phone || '',
    address: currentRecord?.address || household?.address || '',
    livestockType: currentRecord?.livestockType || household?.livestockType || 'Lợn thịt',
    herdSize: currentRecord?.herdSize || household?.herdSize || 50,
    farmingYears: currentRecord?.farmingYears || household?.farmingYears || 5,
    farmingType: currentRecord?.farmingType || household?.farmingType || 'Gia trại chuồng hở',
    currentWasteMethod: currentRecord?.currentWasteMethod || household?.currentWasteMethod || 'Biogas composite',
    notes: currentRecord?.notes || household?.notes || '',
  });

  const [isLocked, setIsLocked] = useState(currentRecord?.isLocked || false);
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [message, setMessage] = useState('');

  const handleSelectHousehold = (hId: string) => {
    setSelectedHouseholdId(hId);
    const rec = bc01List.find((b) => b.householdId === hId);
    const h = households.find((item) => item.id === hId);

    if (rec) {
      setFormData({
        representativeName: rec.representativeName,
        phone: rec.phone,
        address: rec.address,
        livestockType: rec.livestockType,
        herdSize: rec.herdSize,
        farmingYears: rec.farmingYears,
        farmingType: rec.farmingType,
        currentWasteMethod: rec.currentWasteMethod,
        notes: rec.notes || '',
      });
      setIsLocked(rec.isLocked);
    } else if (h) {
      setFormData({
        representativeName: h.representativeName,
        phone: h.phone,
        address: h.address,
        livestockType: h.livestockType,
        herdSize: h.herdSize,
        farmingYears: h.farmingYears,
        farmingType: h.farmingType,
        currentWasteMethod: h.currentWasteMethod,
        notes: h.notes || '',
      });
      setIsLocked(false);
    }
    setMessage('');
  };

  const handleSave = (lockAfter: boolean = false) => {
    const list = StorageService.getBC01List();
    const existingIndex = list.findIndex((b) => b.householdId === selectedHouseholdId);

    const record: BC01Record = {
      id: currentRecord?.id || `BC01_${selectedHouseholdId}`,
      householdId: selectedHouseholdId,
      representativeName: formData.representativeName.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      livestockType: formData.livestockType,
      herdSize: Number(formData.herdSize),
      farmingYears: Number(formData.farmingYears),
      farmingType: formData.farmingType,
      currentWasteMethod: formData.currentWasteMethod,
      notes: formData.notes.trim() || undefined,
      isLocked: lockAfter ? true : isLocked,
      createdAt: currentRecord?.createdAt || new Date().toISOString(),
      createdBy: currentRecord?.createdBy || currentUser.username,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.username,
    };

    if (existingIndex >= 0) {
      list[existingIndex] = record;
    } else {
      list.push(record);
    }
    StorageService.saveBC01List(list);
    setIsLocked(lockAfter ? true : isLocked);

    // Đồng bộ ngược lại vào bảng Households để thông tin thống nhất
    const hList = StorageService.getHouseholds();
    const hIndex = hList.findIndex((h) => h.id === selectedHouseholdId);
    if (hIndex >= 0) {
      hList[hIndex].representativeName = record.representativeName;
      hList[hIndex].phone = record.phone;
      hList[hIndex].address = record.address;
      hList[hIndex].livestockType = record.livestockType;
      hList[hIndex].herdSize = record.herdSize;
      hList[hIndex].farmingYears = record.farmingYears;
      hList[hIndex].farmingType = record.farmingType;
      hList[hIndex].currentWasteMethod = record.currentWasteMethod;
      hList[hIndex].notes = record.notes;
      hList[hIndex].updatedAt = new Date().toISOString();
      hList[hIndex].updatedBy = currentUser.username;
      StorageService.saveHouseholds(hList);
    }

    StorageService.addAuditLog({
      userId: currentUser.id,
      username: currentUser.username,
      userRole: currentUser.role,
      action: existingIndex >= 0 ? 'UPDATE' : 'CREATE',
      targetModule: 'BC01_HO_THONG_TIN',
      householdId: selectedHouseholdId,
      reason: `Cập nhật phiếu BC-01 thông tin hộ ${selectedHouseholdId}${lockAfter ? ' (Đã xác nhận & Khóa)' : ''}.`,
    });

    setMessage(`Đã lưu thành công phiếu BC-01 cho hộ ${selectedHouseholdId}!`);
    setTimeout(() => {
      setMessage('');
      if (onRefreshData) onRefreshData();
    }, 2000);
  };

  const handleUnlockConfirm = (reason: string) => {
    setIsLocked(false);
    setUnlockModalOpen(false);

    const list = StorageService.getBC01List();
    const existingIndex = list.findIndex((b) => b.householdId === selectedHouseholdId);
    if (existingIndex >= 0) {
      list[existingIndex].isLocked = false;
      list[existingIndex].updatedAt = new Date().toISOString();
      list[existingIndex].updatedBy = currentUser.username;
      StorageService.saveBC01List(list);
    }

    StorageService.addAuditLog({
      userId: currentUser.id,
      username: currentUser.username,
      userRole: currentUser.role,
      action: 'UNLOCK',
      targetModule: 'BC01_HO_THONG_TIN',
      householdId: selectedHouseholdId,
      reason: `Mở khóa phiếu BC-01: ${reason}`,
    });

    alert('Đã mở khóa phiếu BC-01. Bạn có thể chỉnh sửa và Lưu.');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <FileText className="w-6 h-6 text-emerald-600" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              MODULE BC-01: THÔNG TIN HỘ CHĂN NUÔI
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Biểu mẫu điện tử thu thập thông tin cơ bản ban đầu của hộ tham gia nghiên cứu
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-xs font-bold text-slate-700">CHỌN HỘ:</label>
          <select
            value={selectedHouseholdId}
            onChange={(e) => handleSelectHousehold(e.target.value)}
            className="text-xs font-bold border border-slate-300 rounded-xl px-3 py-2 bg-white"
          >
            {households.map((h) => (
              <option key={h.id} value={h.id}>
                {h.id} - {h.representativeName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {message && (
        <div className="p-3.5 bg-emerald-600 text-white rounded-xl text-xs font-bold text-center animate-in fade-in">
          ✓ {message}
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1">MÃ HỘ</label>
            <input
              type="text"
              disabled
              value={selectedHouseholdId}
              className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-100 font-bold font-mono text-slate-800"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block font-bold text-slate-700 mb-1">TÊN NGƯỜI ĐẠI DIỆN *</label>
            <input
              type="text"
              disabled={isLocked}
              value={formData.representativeName}
              onChange={(e) => setFormData({ ...formData, representativeName: e.target.value })}
              className="w-full border border-slate-300 rounded-xl p-2.5 disabled:bg-slate-50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1">SỐ ĐIỆN THOẠI *</label>
            <input
              type="text"
              disabled={isLocked}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full border border-slate-300 rounded-xl p-2.5 font-mono disabled:bg-slate-50"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">ĐỊA CHỈ *</label>
            <input
              type="text"
              disabled={isLocked}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full border border-slate-300 rounded-xl p-2.5 disabled:bg-slate-50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1">LOẠI VẬT NUÔI</label>
            <input
              type="text"
              disabled={isLocked}
              value={formData.livestockType}
              onChange={(e) => setFormData({ ...formData, livestockType: e.target.value })}
              className="w-full border border-slate-300 rounded-xl p-2.5 disabled:bg-slate-50"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">SỐ LƯỢNG VẬT NUÔI (CON)</label>
            <input
              type="number"
              disabled={isLocked}
              value={formData.herdSize}
              onChange={(e) => setFormData({ ...formData, herdSize: Number(e.target.value) })}
              className="w-full border border-slate-300 rounded-xl p-2.5 disabled:bg-slate-50 font-bold"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">THỜI GIAN CHĂN NUÔI (NĂM)</label>
            <input
              type="number"
              disabled={isLocked}
              value={formData.farmingYears}
              onChange={(e) => setFormData({ ...formData, farmingYears: Number(e.target.value) })}
              className="w-full border border-slate-300 rounded-xl p-2.5 disabled:bg-slate-50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1">HÌNH THỨC CHĂN NUÔI</label>
            <input
              type="text"
              disabled={isLocked}
              value={formData.farmingType}
              onChange={(e) => setFormData({ ...formData, farmingType: e.target.value })}
              className="w-full border border-slate-300 rounded-xl p-2.5 disabled:bg-slate-50"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">PHƯƠNG THỨC XỬ LÝ HIỆN TẠI</label>
            <input
              type="text"
              disabled={isLocked}
              value={formData.currentWasteMethod}
              onChange={(e) => setFormData({ ...formData, currentWasteMethod: e.target.value })}
              className="w-full border border-slate-300 rounded-xl p-2.5 disabled:bg-slate-50"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">GHI CHÚ THỰC TẾ</label>
          <textarea
            rows={2}
            disabled={isLocked}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full border border-slate-300 rounded-xl p-2.5 disabled:bg-slate-50"
          />
        </div>

        {/* Buttons */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-slate-500">
            {currentRecord && (
              <span>
                Cập nhật lần cuối: {new Date(currentRecord.updatedAt).toLocaleString('vi-VN')} bởi{' '}
                <strong>{currentRecord.updatedBy}</strong>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {isLocked ? (
              <button
                type="button"
                onClick={() => setUnlockModalOpen(true)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold flex items-center space-x-1.5 transition-colors shadow-xs"
              >
                <Unlock className="w-4 h-4" />
                <span>Mở khóa để sửa</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleSave(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold flex items-center space-x-1.5 transition-colors shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>[LƯU]</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSave(true)}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold flex items-center space-x-1.5 transition-colors shadow-xs"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>[XÁC NHẬN & KHÓA]</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <UnlockModal
        isOpen={unlockModalOpen}
        title={`Phiếu BC-01 Hộ ${selectedHouseholdId}`}
        onClose={() => setUnlockModalOpen(false)}
        onConfirm={handleUnlockConfirm}
      />
    </div>
  );
};
