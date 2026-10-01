import React, { useState } from 'react';
import {
  Eye,
  CheckCircle,
  XCircle,
  BookOpen,
  Camera,
  Lock,
  Unlock,
  Save,
  AlertTriangle,
  Calendar,
  UserCheck,
  Check,
  X,
  FileCheck,
} from 'lucide-react';
import { BC04Record, CwmCriteria, Household, User } from '../types';
import { StorageService } from '../services/storage';
import { UnlockModal } from '../components/UnlockModal';

interface ModuleBC04Props {
  currentUser: User;
  onOpenCwmGuide: () => void;
  onRefreshData?: () => void;
}

export const ModuleBC04: React.FC<ModuleBC04Props> = ({
  currentUser,
  onOpenCwmGuide,
  onRefreshData,
}) => {
  const households = StorageService.getHouseholds();
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string>('H01');
  const [stage, setStage] = useState<'PRE' | 'POST'>('PRE');

  const bc04List = StorageService.getBC04List();
  const currentRecord = bc04List.find(
    (b) => b.householdId === selectedHouseholdId && b.stage === stage
  );

  // Kiểm tra CWM trước đã có chưa khi chọn POST (Quy tắc chống dữ liệu giả: không được nhập POST trước khi có PRE)
  const preRecord = bc04List.find(
    (b) => b.householdId === selectedHouseholdId && b.stage === 'PRE'
  );

  // State tiêu chí CWM
  const [criteria, setCriteria] = useState<CwmCriteria>(
    currentRecord?.criteria || {
      b1_thuGom: 1,
      b2_phanLoai: 0,
      b3_luuChua: 1,
      b4_khongXaThang: 1,
      b5_xuLyTaiSuDung: 0,
      b6_veSinh: 1,
    }
  );

  const [observationNotes, setObservationNotes] = useState(
    currentRecord?.observationNotes || ''
  );
  const [evidenceDescription, setEvidenceDescription] = useState(
    currentRecord?.evidenceDescription || ''
  );
  const [failureReasons, setFailureReasons] = useState(
    currentRecord?.failureReasons || ''
  );
  const [photoUrl, setPhotoUrl] = useState(currentRecord?.photoUrl || '');
  const [isLocked, setIsLocked] = useState(currentRecord?.isLocked || false);

  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Tự động tính điểm CWM = B1 + B2 + B3 + B4 + B5 + B6 (0 - 6)
  const scoreCWM =
    criteria.b1_thuGom +
    criteria.b2_phanLoai +
    criteria.b3_luuChua +
    criteria.b4_khongXaThang +
    criteria.b5_xuLyTaiSuDung +
    criteria.b6_veSinh;

  // Khi đổi hộ hoặc stage, load lại dữ liệu
  const handleSelectHousehold = (hId: string, newStage?: 'PRE' | 'POST') => {
    setSelectedHouseholdId(hId);
    const targetStage = newStage || stage;
    const rec = bc04List.find(
      (b) => b.householdId === hId && b.stage === targetStage
    );

    if (rec) {
      setCriteria(rec.criteria);
      setObservationNotes(rec.observationNotes);
      setEvidenceDescription(rec.evidenceDescription || '');
      setFailureReasons(rec.failureReasons || '');
      setPhotoUrl(rec.photoUrl || '');
      setIsLocked(rec.isLocked);
    } else {
      setCriteria({
        b1_thuGom: 1,
        b2_phanLoai: 0,
        b3_luuChua: 0,
        b4_khongXaThang: 1,
        b5_xuLyTaiSuDung: 0,
        b6_veSinh: 1,
      });
      setObservationNotes('');
      setEvidenceDescription('');
      setFailureReasons('');
      setPhotoUrl('');
      setIsLocked(false);
    }
    setErrorMessage('');
  };

  const handleToggleCriterion = (key: keyof CwmCriteria, val: number) => {
    if (isLocked) return;
    setCriteria((prev) => ({ ...prev, [key]: val }));
  };

  // Lưu bản ghi CWM
  const handleSave = (lockAfterSave: boolean = false) => {
    // Kiểm tra quy tắc khoa học: Không được nhập POST nếu chưa có PRE
    if (stage === 'POST' && !preRecord) {
      setErrorMessage(
        'QUY TẮC NGHIÊN CỨU: Không thể đánh giá CWM Sau can thiệp khi chưa hoàn thành CWM Trước can thiệp cho hộ này!'
      );
      return;
    }

    if (!observationNotes.trim()) {
      setErrorMessage('Bắt buộc phải nhập Mô tả quan sát thực tế tại chuồng nuôi.');
      return;
    }

    const currentList = StorageService.getBC04List();
    const existingIndex = currentList.findIndex(
      (b) => b.householdId === selectedHouseholdId && b.stage === stage
    );

    const recordId =
      currentRecord?.id || `BC04_${stage}_${selectedHouseholdId}`;

    const newRecord: BC04Record = {
      id: recordId,
      householdId: selectedHouseholdId,
      stage,
      criteria,
      scoreCWM,
      observationNotes: observationNotes.trim(),
      evidenceDescription: evidenceDescription.trim() || undefined,
      failureReasons: failureReasons.trim() || undefined,
      photoUrl: photoUrl.trim() || undefined,
      observedBy: currentUser.fullName,
      observedAt: currentRecord?.observedAt || new Date().toISOString(),
      isLocked: lockAfterSave ? true : isLocked,
      createdAt: currentRecord?.createdAt || new Date().toISOString(),
      createdBy: currentRecord?.createdBy || currentUser.username,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.username,
    };

    if (existingIndex >= 0) {
      currentList[existingIndex] = newRecord;
    } else {
      currentList.push(newRecord);
    }

    StorageService.saveBC04List(currentList);
    setIsLocked(lockAfterSave ? true : isLocked);

    StorageService.addAuditLog({
      userId: currentUser.id,
      username: currentUser.username,
      userRole: currentUser.role,
      action: existingIndex >= 0 ? 'UPDATE' : 'CREATE',
      targetModule: `BC04_CWM_${stage}`,
      householdId: selectedHouseholdId,
      reason: `Chấm điểm quan sát thực tế CWM ${stage === 'PRE' ? 'Trước' : 'Sau'}: ${scoreCWM}/6 điểm${
        lockAfterSave ? ' (Đã xác nhận & Khóa dữ liệu)' : ''
      }.`,
    });

    setSaveSuccessMsg(
      `Đã lưu thành công phiếu quan sát CWM (${scoreCWM}/6 điểm)${
        lockAfterSave ? ' và Khóa an toàn.' : '.'
      }`
    );
    setTimeout(() => {
      setSaveSuccessMsg('');
      if (onRefreshData) onRefreshData();
    }, 2500);
  };

  // Mở khóa dữ liệu có lý do
  const handleConfirmUnlock = (reason: string) => {
    setIsLocked(false);
    setUnlockModalOpen(false);

    const currentList = StorageService.getBC04List();
    const existingIndex = currentList.findIndex(
      (b) => b.householdId === selectedHouseholdId && b.stage === stage
    );

    if (existingIndex >= 0) {
      currentList[existingIndex].isLocked = false;
      currentList[existingIndex].updatedAt = new Date().toISOString();
      currentList[existingIndex].updatedBy = currentUser.username;
      StorageService.saveBC04List(currentList);
    }

    StorageService.addAuditLog({
      userId: currentUser.id,
      username: currentUser.username,
      userRole: currentUser.role,
      action: 'UNLOCK',
      targetModule: `BC04_CWM_${stage}`,
      householdId: selectedHouseholdId,
      reason: `Mở khóa phiếu quan sát CWM: ${reason}`,
    });

    alert('Đã mở khóa phiếu quan sát. Bạn có thể điều chỉnh dữ liệu và bấm Lưu.');
  };

  const selectedH = households.find((h) => h.id === selectedHouseholdId);

  const criteriaList = [
    {
      code: 'b1_thuGom' as keyof CwmCriteria,
      title: 'B1 – Thu gom chất thải đúng cách',
      desc: 'Chất thải thu dọn vào khu vực/thiết bị chứa phù hợp, không phát tán ra lối đi.',
    },
    {
      code: 'b2_phanLoai' as keyof CwmCriteria,
      title: 'B2 – Phân loại chất thải tại nguồn',
      desc: 'Có bao bì riêng cho rác thải thú y (vỏ thuốc, kim tiêm); tách phân rắn và nước rửa.',
    },
    {
      code: 'b3_luuChua' as keyof CwmCriteria,
      title: 'B3 – Có nơi lưu chứa phù hợp',
      desc: 'Hố ủ, nhà chứa phân có mái che hoặc bạt phủ chống mưa, không rò rỉ ngấm đất.',
    },
    {
      code: 'b4_khongXaThang' as keyof CwmCriteria,
      title: 'B4 – Không xả trực tiếp ra môi trường',
      desc: 'Tuyệt đối không xả phân tươi hoặc nước thải chuồng nuôi chưa qua xử lý ra mương/kênh rạch.',
    },
    {
      code: 'b5_xuLyTaiSuDung' as keyof CwmCriteria,
      title: 'B5 – Có xử lý / tái sử dụng phù hợp',
      desc: 'Áp dụng ít nhất 1 biện pháp: Hầm biogas sinh khí, ủ phân vi sinh compost, đệm lót sinh học.',
    },
    {
      code: 'b6_veSinh' as keyof CwmCriteria,
      title: 'B6 – Duy trì vệ sinh khu vực chăn nuôi',
      desc: 'Vệ sinh chuồng trại sạch sẽ, rải vôi hoặc phun sát trùng định kỳ, ít ruồi nhặng và mùi hôi.',
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <Eye className="w-6 h-6 text-emerald-600" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              MODULE BC-04: QUAN SÁT HÀNH VI THỰC TẾ (CWM)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Đánh giá khách quan thực địa 6 tiêu chí vàng • Thang đo 0 đến 6 điểm • Chỉ dành cho Nghiên cứu viên / Admin
          </p>
        </div>

        <button
          onClick={onOpenCwmGuide}
          className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center space-x-2 transition-colors shadow-xs"
        >
          <BookOpen className="w-4 h-4 text-emerald-300" />
          <span>SỔ TAY HƯỚNG DẪN CHẤM CWM</span>
        </button>
      </div>

      {/* Household Selector & Stage Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-auto flex items-center space-x-3">
          <label className="text-xs font-bold text-slate-700 shrink-0">CHỌN HỘ:</label>
          <select
            value={selectedHouseholdId}
            onChange={(e) => handleSelectHousehold(e.target.value)}
            className="w-full md:w-64 text-xs font-bold border border-slate-300 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-emerald-500"
          >
            {households.map((h) => (
              <option key={h.id} value={h.id}>
                {h.id} - {h.representativeName} ({h.group === 'TN' ? 'Can thiệp' : 'Đối chứng'})
              </option>
            ))}
          </select>
        </div>

        {/* Stage Toggle: PRE vs POST */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto text-xs font-extrabold">
          <button
            onClick={() => {
              setStage('PRE');
              handleSelectHousehold(selectedHouseholdId, 'PRE');
            }}
            className={`flex-1 md:flex-none px-6 py-2 rounded-lg transition-all ${
              stage === 'PRE'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            GIAI ĐOẠN: TRƯỚC CAN THIỆP
          </button>
          <button
            onClick={() => {
              setStage('POST');
              handleSelectHousehold(selectedHouseholdId, 'POST');
            }}
            className={`flex-1 md:flex-none px-6 py-2 rounded-lg transition-all ${
              stage === 'POST'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            GIAI ĐOẠN: SAU CAN THIỆP
          </button>
        </div>
      </div>

      {/* Household Profile summary ribbon */}
      {selectedH && (
        <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl flex flex-wrap items-center justify-between text-xs gap-3">
          <div>
            <span className="font-bold text-slate-900 text-sm">
              Hộ {selectedH.id}: {selectedH.representativeName}
            </span>
            <span className="text-slate-600 ml-2">({selectedH.phone})</span>
            <div className="text-[11px] text-slate-500 mt-0.5">{selectedH.address}</div>
          </div>
          <div className="flex items-center space-x-2">
            <span
              className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                selectedH.group === 'TN'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-teal-600 text-white'
              }`}
            >
              {selectedH.group === 'TN' ? 'Nhóm Can thiệp (TN)' : 'Nhóm Đối chứng (ĐC)'}
            </span>
            <span className="bg-white border border-emerald-300 text-emerald-900 px-2 py-0.5 rounded-md font-semibold text-[10px]">
              {selectedH.livestockType} ({selectedH.herdSize} con)
            </span>
          </div>
        </div>
      )}

      {/* Messages */}
      {errorMessage && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start space-x-2 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {saveSuccessMsg && (
        <div className="p-3.5 bg-emerald-600 text-white rounded-xl text-xs font-bold text-center animate-in fade-in">
          ✓ {saveSuccessMsg}
        </div>
      )}

      {/* 6 CWM Criteria Scoring Form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 uppercase">
              BẢNG ĐÁNH GIÁ 6 TIÊU CHÍ CWM THỰC TẾ ({stage === 'PRE' ? 'TRƯỚC CAN THIỆP' : 'SAU CAN THIỆP'})
            </h2>
            <p className="text-xs text-slate-500">Mỗi tiêu chí: Đạt = 1 điểm • Không đạt = 0 điểm</p>
          </div>

          <div className="flex items-center space-x-3 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200">
            <span className="text-xs font-bold text-emerald-950 uppercase">TỔNG ĐIỂM CWM:</span>
            <span className="text-2xl font-black text-emerald-800">{scoreCWM} / 6</span>
          </div>
        </div>

        {/* 6 Criteria Items */}
        <div className="space-y-3">
          {criteriaList.map((item) => {
            const val = criteria[item.code];
            return (
              <div
                key={item.code}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  val === 1
                    ? 'bg-emerald-50/50 border-emerald-300'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`w-6 h-6 rounded-md font-bold text-xs flex items-center justify-center ${
                        val === 1 ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                      }`}
                    >
                      {item.code.substring(0, 2).toUpperCase()}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm">{item.title}</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 pl-8">{item.desc}</p>
                </div>

                <div className="flex items-center space-x-2 pl-8 sm:pl-0 shrink-0">
                  <button
                    type="button"
                    disabled={isLocked}
                    onClick={() => handleToggleCriterion(item.code, 1)}
                    className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all ${
                      val === 1
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'
                    } ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>ĐẠT (1)</span>
                  </button>

                  <button
                    type="button"
                    disabled={isLocked}
                    onClick={() => handleToggleCriterion(item.code, 0)}
                    className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all ${
                      val === 0
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'
                    } ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>KHÔNG ĐẠT (0)</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Observation Notes & Evidence */}
        <div className="space-y-4 pt-4 border-t border-slate-100 text-xs">
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              MÔ TẢ THỰC TẾ TẠI CHUỒNG NUÔI (BẮT BUỘC) *:
            </label>
            <textarea
              rows={3}
              disabled={isLocked}
              value={observationNotes}
              onChange={(e) => setObservationNotes(e.target.value)}
              placeholder="Ghi nhận hiện trạng sàn chuồng, rãnh thoát nước, vị trí hố ủ, mức độ phát tán mùi hôi..."
              className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                BẰNG CHỨNG QUAN SÁT CỤ THỂ:
              </label>
              <textarea
                rows={2}
                disabled={isLocked}
                value={evidenceDescription}
                onChange={(e) => setEvidenceDescription(e.target.value)}
                placeholder="Ví dụ: Đã thấy men vi sinh Trichoderma tại góc chuồng; hố ủ có nhiệt độ 55°C..."
                className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                NGUYÊN NHÂN KHÔNG ĐẠT (NẾU CÓ):
              </label>
              <textarea
                rows={2}
                disabled={isLocked}
                value={failureReasons}
                onChange={(e) => setFailureReasons(e.target.value)}
                placeholder="Ví dụ: Chưa có thùng chứa rác thú y; hố phân bị dột nước mưa khi bão..."
                className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1 flex items-center space-x-1.5">
              <Camera className="w-4 h-4 text-slate-600" />
              <span>ĐƯỜNG DẪN ẢNH MINH CHỨNG THỰC ĐỊA (NẾU HỘ ĐỒNG Ý):</span>
            </label>
            <input
              type="text"
              disabled={isLocked}
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://... hoặc mã ảnh lưu trữ hồ sơ"
              className="w-full border border-slate-300 rounded-xl p-2.5 disabled:bg-slate-100"
            />
          </div>
        </div>

        {/* Lock status & Actions */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-xs">
            {isLocked ? (
              <div className="flex items-center space-x-1.5 text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 font-bold">
                <Lock className="w-4 h-4" />
                <span>Phiếu đã được Xác nhận & Khóa an toàn</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl font-medium">
                <Unlock className="w-4 h-4 text-slate-400" />
                <span>Đang ở chế độ chỉnh sửa (Chưa khóa)</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {isLocked ? (
              <button
                type="button"
                onClick={() => setUnlockModalOpen(true)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-xs"
              >
                <Unlock className="w-4 h-4" />
                <span>Mở khóa để sửa (Audit Log)</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleSave(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu tạm</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSave(true)}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-xs"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>XÁC NHẬN DỮ LIỆU & KHÓA</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Unlock Reason Modal */}
      <UnlockModal
        isOpen={unlockModalOpen}
        title={`Phiếu quan sát CWM ${stage === 'PRE' ? 'Trước' : 'Sau'} của Hộ ${selectedHouseholdId}`}
        onClose={() => setUnlockModalOpen(false)}
        onConfirm={handleConfirmUnlock}
      />
    </div>
  );
};
