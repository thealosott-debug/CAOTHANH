import React, { useState } from 'react';
import { CheckSquare, Save, Lock, Unlock, AlertTriangle } from 'lucide-react';
import { BC03Record, User } from '../types';
import { StorageService } from '../services/storage';
import { INTENTION_QUESTIONS } from '../config/initialData';
import { UnlockModal } from '../components/UnlockModal';

interface ModuleBC03Props {
  currentUser: User;
  onRefreshData?: () => void;
}

export const ModuleBC03: React.FC<ModuleBC03Props> = ({ currentUser, onRefreshData }) => {
  const households = StorageService.getHouseholds();
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string>('H01');

  const bc03List = StorageService.getBC03List();
  const currentRecord = bc03List.find((b) => b.householdId === selectedHouseholdId);

  const [answers, setAnswers] = useState<{ [qId: string]: number }>(
    currentRecord
      ? currentRecord.answers.reduce((acc, curr) => ({ ...acc, [curr.questionId]: curr.score }), {})
      : { YD01: 4, YD02: 4, YD03: 4, YD04: 4, YD05: 4 }
  );

  const [isLocked, setIsLocked] = useState(currentRecord?.isLocked || false);
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [message, setMessage] = useState('');

  // Tự động tính YĐ trước = trung bình cộng 5 câu (1.0 - 5.0)
  const vals = Object.values(answers);
  const calculatedScoreYD =
    vals.length > 0
      ? Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2))
      : 0;

  const handleSelectHousehold = (hId: string) => {
    setSelectedHouseholdId(hId);
    const rec = bc03List.find((b) => b.householdId === hId);
    if (rec) {
      setAnswers(rec.answers.reduce((acc, curr) => ({ ...acc, [curr.questionId]: curr.score }), {}));
      setIsLocked(rec.isLocked);
    } else {
      setAnswers({ YD01: 4, YD02: 4, YD03: 4, YD04: 4, YD05: 4 });
      setIsLocked(false);
    }
    setMessage('');
  };

  const handleSave = (lockAfter: boolean = false) => {
    const list = StorageService.getBC03List();
    const existingIndex = list.findIndex((b) => b.householdId === selectedHouseholdId);

    const record: BC03Record = {
      id: currentRecord?.id || `BC03_${selectedHouseholdId}`,
      householdId: selectedHouseholdId,
      answers: INTENTION_QUESTIONS.map((q) => ({
        questionId: q.id,
        score: answers[q.id] || 3,
      })),
      scoreYD: calculatedScoreYD,
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
    StorageService.saveBC03List(list);
    setIsLocked(lockAfter ? true : isLocked);

    StorageService.addAuditLog({
      userId: currentUser.id,
      username: currentUser.username,
      userRole: currentUser.role,
      action: existingIndex >= 0 ? 'UPDATE' : 'CREATE',
      targetModule: 'BC03_YDINH',
      householdId: selectedHouseholdId,
      reason: `Cập nhật khảo sát Ý định thay đổi YĐ trước: ${calculatedScoreYD}/5.0${
        lockAfter ? ' [Đã khóa]' : ''
      }.`,
    });

    setMessage(`Đã lưu thành công phiếu BC-03 Hộ ${selectedHouseholdId}!`);
    setTimeout(() => {
      setMessage('');
      if (onRefreshData) onRefreshData();
    }, 2000);
  };

  const handleUnlockConfirm = (reason: string) => {
    setIsLocked(false);
    setUnlockModalOpen(false);

    const list = StorageService.getBC03List();
    const existingIndex = list.findIndex((b) => b.householdId === selectedHouseholdId);
    if (existingIndex >= 0) {
      list[existingIndex].isLocked = false;
      list[existingIndex].updatedAt = new Date().toISOString();
      list[existingIndex].updatedBy = currentUser.username;
      StorageService.saveBC03List(list);
    }

    StorageService.addAuditLog({
      userId: currentUser.id,
      username: currentUser.username,
      userRole: currentUser.role,
      action: 'UNLOCK',
      targetModule: 'BC03_YDINH',
      householdId: selectedHouseholdId,
      reason: `Mở khóa phiếu BC-03: ${reason}`,
    });

    alert('Đã mở khóa phiếu BC-03.');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <CheckSquare className="w-6 h-6 text-emerald-600" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              MODULE BC-03: Ý ĐỊNH THAY ĐỔI TRƯỚC CAN THIỆP
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Đo lường mức độ sẵn sàng, niềm tin và ý định hành vi quản lý chất thải xanh (Thang Likert 1-5)
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
            ĐIỂM TRUNG BÌNH Ý ĐỊNH THAY ĐỔI (YĐ TRƯỚC)
          </span>
          <div className="text-2xl font-black mt-0.5">{calculatedScoreYD} / 5.0</div>
        </div>
        <div className="text-right text-xs text-emerald-200">
          <div>Thang đo Likert 5 mức độ</div>
          <div className="font-semibold text-white">
            {calculatedScoreYD >= 4.0
              ? 'Ý định rất tích cực'
              : calculatedScoreYD >= 3.0
              ? 'Ý định trung bình'
              : 'Ý định chưa cao'}
          </div>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-emerald-600 text-white text-xs rounded-xl text-center font-bold">
          ✓ {message}
        </div>
      )}

      {/* Likert Questionnaire */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="space-y-3 text-xs">
          {INTENTION_QUESTIONS.map((q, idx) => (
            <div
              key={q.id}
              className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3"
            >
              <div className="font-semibold text-slate-800">
                Câu {idx + 1}: {q.text}
              </div>

              <div className="flex items-center space-x-1 shrink-0">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    disabled={isLocked}
                    onClick={() => setAnswers({ ...answers, [q.id]: val })}
                    className={`w-8 h-8 rounded-lg font-bold text-xs transition-all ${
                      answers[q.id] === val
                        ? 'bg-emerald-700 text-white shadow-xs scale-105'
                        : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {isLocked ? (
              <span className="text-amber-700 font-bold flex items-center space-x-1">
                <Lock className="w-3.5 h-3.5" />
                <span>Phiếu BC-03 đã khóa</span>
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
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold"
              >
                Mở khóa để sửa (Audit Log)
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleSave(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold"
                >
                  Lưu tạm
                </button>
                <button
                  type="button"
                  onClick={() => handleSave(true)}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs"
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
        title={`Phiếu BC-03 Ý định Hộ ${selectedHouseholdId}`}
        onClose={() => setUnlockModalOpen(false)}
        onConfirm={handleUnlockConfirm}
      />
    </div>
  );
};
