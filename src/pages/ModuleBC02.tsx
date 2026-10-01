import React, { useState } from 'react';
import {
  FileCheck2,
  CheckCircle,
  HelpCircle,
  Save,
  Lock,
  Unlock,
  AlertTriangle,
  Award,
} from 'lucide-react';
import { BC02Record, KnowledgeAnswer, User } from '../types';
import { StorageService } from '../services/storage';
import {
  ATTITUDE_STATEMENTS,
  KNOWLEDGE_QUESTIONS,
} from '../config/initialData';
import { UnlockModal } from '../components/UnlockModal';

interface ModuleBC02Props {
  currentUser: User;
  onRefreshData?: () => void;
}

export const ModuleBC02: React.FC<ModuleBC02Props> = ({ currentUser, onRefreshData }) => {
  const households = StorageService.getHouseholds();
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string>('H01');

  const bc02List = StorageService.getBC02List();
  const currentRecord = bc02List.find((b) => b.householdId === selectedHouseholdId);

  // State phần A: Kiến thức
  const [knowledgeAnswers, setKnowledgeAnswers] = useState<{ [qId: string]: number }>(
    currentRecord
      ? currentRecord.knowledgeAnswers.reduce((acc, curr) => ({ ...acc, [curr.questionId]: curr.selectedAnswer }), {})
      : {}
  );

  // State phần B: Thái độ (Likert 1-5)
  const [attitudeAnswers, setAttitudeAnswers] = useState<{ [qId: string]: number }>(
    currentRecord
      ? currentRecord.attitudeAnswers.reduce((acc, curr) => ({ ...acc, [curr.questionId]: curr.score }), {})
      : { T01: 4, T02: 4, T03: 4, T04: 4, T05: 4 }
  );

  // State phần C: Hành vi tự báo cáo
  const [behaviorReport, setBehaviorReport] = useState<{ [key: string]: boolean }>(
    currentRecord?.behaviorReport || {
      b1_thuGom: true,
      b2_phanLoai: false,
      b3_luuChua: true,
      b4_khongXaThang: true,
      b5_xuLyTaiSuDung: false,
      b6_veSinh: true,
    }
  );

  const [isLocked, setIsLocked] = useState(currentRecord?.isLocked || false);
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Tự động tính điểm K trước (0 - 10)
  let calculatedScoreK = 0;
  KNOWLEDGE_QUESTIONS.forEach((q) => {
    if (knowledgeAnswers[q.id] === q.correctAnswer) {
      calculatedScoreK += 1;
    }
  });

  // Tự động tính điểm T trước (Trung bình 1.0 - 5.0)
  const attitudeVals = Object.values(attitudeAnswers);
  const calculatedScoreT =
    attitudeVals.length > 0
      ? Number((attitudeVals.reduce((a, b) => a + b, 0) / attitudeVals.length).toFixed(2))
      : 0;

  // Tự động tính điểm HT trước (0 - 6)
  const calculatedScoreHT = Object.values(behaviorReport).filter(Boolean).length;

  const handleSelectHousehold = (hId: string) => {
    setSelectedHouseholdId(hId);
    const rec = bc02List.find((b) => b.householdId === hId);
    if (rec) {
      setKnowledgeAnswers(
        rec.knowledgeAnswers.reduce((acc, curr) => ({ ...acc, [curr.questionId]: curr.selectedAnswer }), {})
      );
      setAttitudeAnswers(
        rec.attitudeAnswers.reduce((acc, curr) => ({ ...acc, [curr.questionId]: curr.score }), {})
      );
      setBehaviorReport(rec.behaviorReport);
      setIsLocked(rec.isLocked);
    } else {
      setKnowledgeAnswers({});
      setAttitudeAnswers({ T01: 4, T02: 4, T03: 4, T04: 4, T05: 4 });
      setBehaviorReport({
        b1_thuGom: true,
        b2_phanLoai: false,
        b3_luuChua: false,
        b4_khongXaThang: true,
        b5_xuLyTaiSuDung: false,
        b6_veSinh: true,
      });
      setIsLocked(false);
    }
    setSuccessMsg('');
  };

  const handleSave = (lockAfter: boolean = false) => {
    const list = StorageService.getBC02List();
    const existingIndex = list.findIndex((b) => b.householdId === selectedHouseholdId);

    const kAnswers: KnowledgeAnswer[] = KNOWLEDGE_QUESTIONS.map((q) => {
      const selected = knowledgeAnswers[q.id] ?? -1;
      const isCorrect = selected === q.correctAnswer;
      return {
        questionId: q.id,
        selectedAnswer: selected,
        isCorrect,
        score: isCorrect ? 1 : 0,
      };
    });

    const record: BC02Record = {
      id: currentRecord?.id || `BC02_${selectedHouseholdId}`,
      householdId: selectedHouseholdId,
      knowledgeAnswers: kAnswers,
      scoreK: calculatedScoreK,
      attitudeAnswers: ATTITUDE_STATEMENTS.map((t) => ({
        questionId: t.id,
        score: attitudeAnswers[t.id] || 3,
      })),
      scoreT: calculatedScoreT,
      behaviorReport: {
        b1_thuGom: !!behaviorReport.b1_thuGom,
        b2_phanLoai: !!behaviorReport.b2_phanLoai,
        b3_luuChua: !!behaviorReport.b3_luuChua,
        b4_khongXaThang: !!behaviorReport.b4_khongXaThang,
        b5_xuLyTaiSuDung: !!behaviorReport.b5_xuLyTaiSuDung,
        b6_veSinh: !!behaviorReport.b6_veSinh,
      },
      scoreHT: calculatedScoreHT,
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

    StorageService.saveBC02List(list);
    setIsLocked(lockAfter ? true : isLocked);

    StorageService.addAuditLog({
      userId: currentUser.id,
      username: currentUser.username,
      userRole: currentUser.role,
      action: existingIndex >= 0 ? 'UPDATE' : 'CREATE',
      targetModule: 'BC02_KAP_PRE',
      householdId: selectedHouseholdId,
      reason: `Cập nhật khảo sát KAP trước (K: ${calculatedScoreK}/10, T: ${calculatedScoreT}, HT: ${calculatedScoreHT}/6)${
        lockAfter ? ' [Đã khóa]' : ''
      }.`,
    });

    setSuccessMsg(`Đã lưu khảo sát BC-02 Hộ ${selectedHouseholdId} thành công!`);
    setTimeout(() => {
      setSuccessMsg('');
      if (onRefreshData) onRefreshData();
    }, 2000);
  };

  const handleUnlockConfirm = (reason: string) => {
    setIsLocked(false);
    setUnlockModalOpen(false);

    const list = StorageService.getBC02List();
    const existingIndex = list.findIndex((b) => b.householdId === selectedHouseholdId);
    if (existingIndex >= 0) {
      list[existingIndex].isLocked = false;
      list[existingIndex].updatedAt = new Date().toISOString();
      list[existingIndex].updatedBy = currentUser.username;
      StorageService.saveBC02List(list);
    }

    StorageService.addAuditLog({
      userId: currentUser.id,
      username: currentUser.username,
      userRole: currentUser.role,
      action: 'UNLOCK',
      targetModule: 'BC02_KAP_PRE',
      householdId: selectedHouseholdId,
      reason: `Mở khóa phiếu BC-02 KAP: ${reason}`,
    });

    alert('Đã mở khóa phiếu BC-02.');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <FileCheck2 className="w-6 h-6 text-emerald-600" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              MODULE BC-02: BẢNG HỎI KAP TRƯỚC CAN THIỆP
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Đo lường Kiến thức (K), Thái độ (T), và Hành vi tự báo cáo (HT trước)
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

      {/* Auto Calculated Scores Ribbon */}
      <div className="grid grid-cols-3 gap-3 bg-emerald-900 text-white p-4 rounded-2xl shadow-xs">
        <div className="text-center border-r border-emerald-800">
          <div className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">
            K TRƯỚC (KIẾN THỨC)
          </div>
          <div className="text-xl sm:text-2xl font-black mt-0.5">{calculatedScoreK} / 10</div>
        </div>
        <div className="text-center border-r border-emerald-800">
          <div className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">
            T TRƯỚC (THÁI ĐỘ LIKERT)
          </div>
          <div className="text-xl sm:text-2xl font-black mt-0.5">{calculatedScoreT} / 5.0</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">
            HT TRƯỚC (TỰ BÁO CÁO)
          </div>
          <div className="text-xl sm:text-2xl font-black mt-0.5">{calculatedScoreHT} / 6</div>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-600 text-white text-xs rounded-xl text-center font-bold">
          ✓ {successMsg}
        </div>
      )}

      {/* PHẦN A: KIẾN THỨC (10 CÂU) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900 uppercase">
            PHẦN A. ĐO LƯỜNG KIẾN THỨC QUẢN LÝ CHẤT THẢI (10 CÂU HỎI TRẮC NGHIỆM)
          </h2>
          <p className="text-xs text-slate-500">Mỗi câu trả lời đúng được tính 1 điểm. Tổng điểm: 10.</p>
        </div>

        <div className="space-y-4">
          {KNOWLEDGE_QUESTIONS.map((q, idx) => (
            <div key={q.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
              <div className="font-bold text-slate-900">
                Câu {idx + 1}: {q.text}
              </div>

              <div className="space-y-1.5 pl-2">
                {q.options.map((opt, optIdx) => (
                  <label
                    key={optIdx}
                    className={`flex items-start space-x-2.5 p-2 rounded-xl border transition-colors cursor-pointer ${
                      knowledgeAnswers[q.id] === optIdx
                        ? optIdx === q.correctAnswer
                          ? 'bg-emerald-50 border-emerald-500 font-semibold text-emerald-950'
                          : 'bg-red-50 border-red-400 font-semibold text-red-950'
                        : 'bg-white border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="radio"
                      disabled={isLocked}
                      name={`k_${q.id}`}
                      checked={knowledgeAnswers[q.id] === optIdx}
                      onChange={() =>
                        setKnowledgeAnswers({ ...knowledgeAnswers, [q.id]: optIdx })
                      }
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>

              {knowledgeAnswers[q.id] !== undefined && (
                <div className="text-[11px] text-slate-500 italic pl-2 pt-1 border-t border-slate-200/60">
                  <strong>Giải thích chuẩn:</strong> {q.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* PHẦN B: THÁI ĐỘ (5 CÂU LIKERT 1-5) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900 uppercase">
            PHẦN B. THÁI ĐỘ ĐỐI VỚI QUẢN LÝ CHẤT THẢI (THANG LIKERT 1 ĐẾN 5)
          </h2>
          <p className="text-xs text-slate-500">
            1 = Hoàn toàn không đồng ý • 2 = Không đồng ý • 3 = Trung lập • 4 = Đồng ý • 5 = Hoàn toàn đồng ý
          </p>
        </div>

        <div className="space-y-3 text-xs">
          {ATTITUDE_STATEMENTS.map((item, idx) => (
            <div
              key={item.id}
              className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3"
            >
              <div className="font-semibold text-slate-800">
                {idx + 1}. {item.text}
              </div>

              <div className="flex items-center space-x-1 shrink-0">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    disabled={isLocked}
                    onClick={() =>
                      setAttitudeAnswers({ ...attitudeAnswers, [item.id]: val })
                    }
                    className={`w-8 h-8 rounded-lg font-bold text-xs transition-all ${
                      attitudeAnswers[item.id] === val
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
      </div>

      {/* PHẦN C: HÀNH VI TỰ BÁO CÁO (6 HÀNH VI) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900 uppercase">
            PHẦN C. HÀNH VI TỰ BÁO CÁO BAN ĐẦU (HT TRƯỚC - 6 TIÊU CHÍ)
          </h2>
          <p className="text-xs text-slate-500">Người chăn nuôi tự đánh giá thói quen thực hiện hiện tại.</p>
        </div>

        <div className="space-y-2.5 text-xs">
          {[
            { key: 'b1_thuGom', label: 'B1. Gia đình thường xuyên thu gom chất thải đúng cách mỗi ngày' },
            { key: 'b2_phanLoai', label: 'B2. Gia đình có phân loại riêng rác thải thú y (vỏ thuốc, kim tiêm)' },
            { key: 'b3_luuChua', label: 'B3. Nơi lưu chứa phân có mái che hoặc bạt phủ chống ngấm' },
            { key: 'b4_khongXaThang', label: 'B4. Gia đình tuyệt đối không xả phân tươi chưa xử lý ra kênh rạch' },
            { key: 'b5_xuLyTaiSuDung', label: 'B5. Gia đình có xử lý bằng biogas hoặc ủ men vi sinh hữu cơ' },
            { key: 'b6_veSinh', label: 'B6. Chuồng nuôi được vệ sinh, rải vôi sát trùng định kỳ' },
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
                  className={`px-3 py-1 rounded-lg font-bold text-xs ${
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
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs ${
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

        {/* Buttons */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="text-slate-500 text-xs">
            {isLocked ? (
              <span className="text-amber-700 font-bold flex items-center space-x-1">
                <Lock className="w-3.5 h-3.5 inline" />
                <span>Phiếu BC-02 đã khóa</span>
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
                  Xác nhận & Khóa phiếu
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <UnlockModal
        isOpen={unlockModalOpen}
        title={`Phiếu BC-02 KAP Hộ ${selectedHouseholdId}`}
        onClose={() => setUnlockModalOpen(false)}
        onConfirm={handleUnlockConfirm}
      />
    </div>
  );
};
