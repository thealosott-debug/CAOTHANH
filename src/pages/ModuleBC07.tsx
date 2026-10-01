import React, { useState } from 'react';
import {
  FileCheck,
  Save,
  Lock,
  Unlock,
  AlertTriangle,
  Award,
  CheckCircle,
} from 'lucide-react';
import { BC07Record, User } from '../types';
import { StorageService } from '../services/storage';
import { COMMON_BARRIERS } from '../config/initialData';
import { UnlockModal } from '../components/UnlockModal';

interface ModuleBC07Props {
  currentUser: User;
  onRefreshData?: () => void;
}

export const ModuleBC07: React.FC<ModuleBC07Props> = ({ currentUser, onRefreshData }) => {
  const households = StorageService.getHouseholds();
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string>('H01');

  const bc07List = StorageService.getBC07List();
  const currentRecord = bc07List.find((b) => b.householdId === selectedHouseholdId);

  const [behaviorReport, setBehaviorReport] = useState<{ [key: string]: boolean }>(
    currentRecord?.behaviorReport || {
      b1_thuGom: true,
      b2_phanLoai: true,
      b3_luuChua: true,
      b4_khongXaThang: true,
      b5_xuLyTaiSuDung: true,
      b6_veSinh: true,
    }
  );

  const [maintenanceWillingness, setMaintenanceWillingness] = useState<number>(
    currentRecord?.maintenanceWillingness || 5
  );
  const [feedbackProcess, setFeedbackProcess] = useState<string>(
    currentRecord?.feedbackProcess ||
      'Nhờ tham gia chương trình, gia đình tôi đã có thói quen dọn phân sạch sẽ và ủ men vi sinh bón cây ăn quả, không còn mùi hôi thối.'
  );
  const [selectedBarriers, setSelectedBarriers] = useState<string[]>(
    currentRecord?.mainBarriers || []
  );

  const [isLocked, setIsLocked] = useState(currentRecord?.isLocked || false);
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [message, setMessage] = useState('');

  // Tự động tính điểm HT sau (0 - 6)
  const scoreHT_Post = Object.values(behaviorReport).filter(Boolean).length;

  const handleSelectHousehold = (hId: string) => {
    setSelectedHouseholdId(hId);
    const rec = bc07List.find((b) => b.householdId === hId);
    if (rec) {
      setBehaviorReport(rec.behaviorReport);
      setMaintenanceWillingness(rec.maintenanceWillingness);
      setFeedbackProcess(rec.feedbackProcess);
      setSelectedBarriers(rec.mainBarriers);
      setIsLocked(rec.isLocked);
    } else {
      setBehaviorReport({
        b1_thuGom: true,
        b2_phanLoai: true,
        b3_luuChua: true,
        b4_khongXaThang: true,
        b5_xuLyTaiSuDung: true,
        b6_veSinh: true,
      });
      setMaintenanceWillingness(5);
      setFeedbackProcess('');
      setSelectedBarriers([]);
      setIsLocked(false);
    }
    setMessage('');
  };

  const handleToggleBarrier = (label: string) => {
    if (selectedBarriers.includes(label)) {
      setSelectedBarriers(selectedBarriers.filter((b) => b !== label));
    } else {
      setSelectedBarriers([...selectedBarriers, label]);
    }
  };

  const handleSave = (lockAfter: boolean = false) => {
    const list = StorageService.getBC07List();
    const existingIndex = list.findIndex((b) => b.householdId === selectedHouseholdId);

    const record: BC07Record = {
      id: currentRecord?.id || `BC07_${selectedHouseholdId}`,
      householdId: selectedHouseholdId,
      behaviorReport: {
        b1_thuGom: !!behaviorReport.b1_thuGom,
        b2_phanLoai: !!behaviorReport.b2_phanLoai,
        b3_luuChua: !!behaviorReport.b3_luuChua,
        b4_khongXaThang: !!behaviorReport.b4_khongXaThang,
        b5_xuLyTaiSuDung: !!behaviorReport.b5_xuLyTaiSuDung,
        b6_veSinh: !!behaviorReport.b6_veSinh,
      },
      scoreHT_Post,
      maintenanceWillingness,
      feedbackProcess: feedbackProcess.trim(),
      mainBarriers: selectedBarriers,
      isLocked: lockAfter ? true : isLocked,
      submittedAt: currentRecord?.submittedAt || new Date().toISOString(),
      submittedBy: currentUser.fullName,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.username,
    };

    if (existingIndex >= 0) {
      list[existingIndex] = record;
    } else {
      list.push(record);
    }

    StorageService.saveBC07List(list);
    setIsLocked(lockAfter ? true : isLocked);

    StorageService.addAuditLog({
      userId: currentUser.id,
      username: currentUser.username,
      userRole: currentUser.role,
      action: existingIndex >= 0 ? 'UPDATE' : 'CREATE',
      targetModule: 'BC07_POST',
      householdId: selectedHouseholdId,
      reason: `Cập nhật khảo sát sau can thiệp BC-07: HT sau = ${scoreHT_Post}/6${
        lockAfter ? ' [Đã khóa]' : ''
      }.`,
    });

    setMessage(`Đã lưu thành công khảo sát sau can thiệp Hộ ${selectedHouseholdId}!`);
    setTimeout(() => {
      setMessage('');
      if (onRefreshData) onRefreshData();
    }, 2000);
  };

  const handleUnlockConfirm = (reason: string) => {
    setIsLocked(false);
    setUnlockModalOpen(false);

    const list = StorageService.getBC07List();
    const existingIndex = list.findIndex((b) => b.householdId === selectedHouseholdId);
    if (existingIndex >= 0) {
      list[existingIndex].isLocked = false;
      list[existingIndex].updatedAt = new Date().toISOString();
      list[existingIndex].updatedBy = currentUser.username;
      StorageService.saveBC07List(list);
    }

    StorageService.addAuditLog({
      userId: currentUser.id,
      username: currentUser.username,
      userRole: currentUser.role,
      action: 'UNLOCK',
      targetModule: 'BC07_POST',
      householdId: selectedHouseholdId,
      reason: `Mở khóa phiếu BC-07: ${reason}`,
    });

    alert('Đã mở khóa phiếu BC-07.');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <FileCheck className="w-6 h-6 text-emerald-600" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              MODULE BC-07: KHẢO SÁT SAU CAN THIỆP
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Đo lường hành vi tự báo cáo sau can thiệp (HT sau), mức độ sẵn sàng duy trì và phản hồi
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

      {/* Score Banner */}
      <div className="bg-emerald-900 text-white p-4 rounded-2xl flex items-center justify-between shadow-xs">
        <div>
          <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">
            ĐIỂM HÀNH VI TỰ BÁO CÁO SAU CAN THIỆP (HT SAU)
          </span>
          <div className="text-2xl font-black mt-0.5">{scoreHT_Post} / 6 tiêu chí</div>
        </div>
        <div className="text-right text-xs text-emerald-200">
          <div>Mức độ sẵn sàng tiếp tục duy trì:</div>
          <div className="font-bold text-white text-base">{maintenanceWillingness} / 5 điểm</div>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-emerald-600 text-white text-xs rounded-xl text-center font-bold">
          ✓ {message}
        </div>
      )}

      {/* 6 Hành vi tự báo cáo sau can thiệp */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5 text-xs">
        <h2 className="text-base font-bold text-slate-900 uppercase border-b border-slate-100 pb-3">
          1. ĐÁNH GIÁ 6 HÀNH VI THỰC HIỆN SAU CAN THIỆP (HT SAU)
        </h2>

        <div className="space-y-2.5">
          {[
            { key: 'b1_thuGom', label: 'B1. Gia đình duy trì thu gom chất thải đúng cách mỗi ngày' },
            { key: 'b2_phanLoai', label: 'B2. Gia đình có phân loại riêng rác thải thú y nguy hại' },
            { key: 'b3_luuChua', label: 'B3. Nơi lưu chứa phân có mái che hoặc bạt phủ chống ngấm' },
            { key: 'b4_khongXaThang', label: 'B4. Gia đình tuyệt đối không xả phân tươi chưa xử lý ra ngoài' },
            { key: 'b5_xuLyTaiSuDung', label: 'B5. Gia đình áp dụng ủ phân compost hoặc xử lý bằng biogas' },
            { key: 'b6_veSinh', label: 'B6. Chuồng nuôi được vệ sinh, rải vôi hoặc phun sát trùng' },
          ].map((item) => (
            <div
              key={item.key}
              className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between"
            >
              <span className="font-semibold text-slate-800">{item.label}</span>
              <div className="flex space-x-1">
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={() =>
                    setBehaviorReport({ ...behaviorReport, [item.key]: true })
                  }
                  className={`px-3 py-1 rounded-lg font-bold ${
                    behaviorReport[item.key]
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white border border-slate-300 text-slate-600'
                  }`}
                >
                  CÓ
                </button>
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={() =>
                    setBehaviorReport({ ...behaviorReport, [item.key]: false })
                  }
                  className={`px-2.5 py-1 rounded-lg font-bold ${
                    !behaviorReport[item.key]
                      ? 'bg-red-500 text-white'
                      : 'bg-white border border-slate-300 text-slate-600'
                  }`}
                >
                  KHÔNG
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 2. Mức độ sẵn sàng tiếp tục duy trì */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <label className="block font-bold text-slate-800">
            2. MỨC ĐỘ SẴN SÀNG TIẾP TỤC DUY TRÌ HÀNH VI SAU KHI DỰ ÁN KẾT THÚC (Thang Likert 1-5):
          </label>
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5].map((val) => (
              <button
                key={val}
                type="button"
                disabled={isLocked}
                onClick={() => setMaintenanceWillingness(val)}
                className={`w-10 h-10 rounded-xl font-bold transition-all ${
                  maintenanceWillingness === val
                    ? 'bg-emerald-700 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {val}
              </button>
            ))}
            <span className="text-slate-500 ml-2">
              (1: Hoàn toàn không tiếp tục • 5: Chắc chắn duy trì lâu dài)
            </span>
          </div>
        </div>

        {/* 3. Cảm nhận về quá trình tham gia */}
        <div className="pt-2">
          <label className="block font-bold text-slate-800 mb-1">
            3. CẢM NHẬN VÀ Ý KIẾN ĐÓNG GÓP CỦA HỘ CHĂN NUÔI:
          </label>
          <textarea
            rows={3}
            disabled={isLocked}
            value={feedbackProcess}
            onChange={(e) => setFeedbackProcess(e.target.value)}
            placeholder="Chia sẻ về sự thay đổi của chuồng trại, mùi hôi, sức khỏe vật nuôi..."
            className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
          />
        </div>

        {/* 4. Rào cản còn tồn tại */}
        <div className="pt-2">
          <label className="block font-bold text-slate-800 mb-2">
            4. NHỮNG RÀO CẢN VẪN CÒN TỒN TẠI (NẾU CÓ):
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {COMMON_BARRIERS.map((barrier) => {
              const isSelected = selectedBarriers.includes(barrier.label);
              return (
                <button
                  key={barrier.id}
                  type="button"
                  disabled={isLocked}
                  onClick={() => handleToggleBarrier(barrier.label)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-amber-50 border-amber-500 text-amber-950 font-bold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {isSelected ? '☑ ' : '☐ '} {barrier.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="text-slate-500">
            {isLocked ? (
              <span className="text-amber-700 font-bold flex items-center space-x-1">
                <Lock className="w-3.5 h-3.5" />
                <span>Phiếu BC-07 đã khóa</span>
              </span>
            ) : (
              <span>Chưa khóa</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {isLocked ? (
              <button
                type="button"
                onClick={() => setUnlockModalOpen(true)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold"
              >
                Mở khóa để sửa (Audit Log)
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleSave(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold"
                >
                  Lưu tạm
                </button>
                <button
                  type="button"
                  onClick={() => handleSave(true)}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-xs"
                >
                  Xác nhận & Khóa
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <UnlockModal
        isOpen={unlockModalOpen}
        title={`Phiếu BC-07 Sau can thiệp Hộ ${selectedHouseholdId}`}
        onClose={() => setUnlockModalOpen(false)}
        onConfirm={handleUnlockConfirm}
      />
    </div>
  );
};
