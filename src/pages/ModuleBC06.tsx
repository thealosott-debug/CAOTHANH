import React, { useState } from 'react';
import {
  CalendarDays,
  CheckCircle,
  AlertTriangle,
  Clock,
  Send,
  Users,
  Search,
  Filter,
  BarChart,
  Edit,
  Save,
  Check,
  X,
} from 'lucide-react';
import { BC06Record, Household, User, WeekNumber } from '../types';
import { StorageService } from '../services/storage';
import { COMMON_BARRIERS } from '../config/initialData';

interface ModuleBC06Props {
  currentUser: User;
  onRefreshData?: () => void;
}

export const ModuleBC06: React.FC<ModuleBC06Props> = ({ currentUser, onRefreshData }) => {
  const households = StorageService.getHouseholds();
  const tnHouseholds = households.filter((h) => h.group === 'TN');

  const [selectedWeek, setSelectedWeek] = useState<WeekNumber>('W1');
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string>(tnHouseholds[0]?.id || 'H01');
  const [searchTerm, setSearchTerm] = useState('');

  const bc06List = StorageService.getBC06List();
  const currentRecord = bc06List.find(
    (b) => b.householdId === selectedHouseholdId && b.week === selectedWeek
  );

  // Form states
  const [behaviors, setBehaviors] = useState<{ [key: string]: boolean }>({
    b1_thuGom: true,
    b2_phanLoai: true,
    b3_luuChua: true,
    b4_khongXaThang: true,
    b5_xuLyTaiSuDung: true,
    b6_veSinh: true,
  });
  const [selectedBarriers, setSelectedBarriers] = useState<string[]>([]);
  const [otherBarrier, setOtherBarrier] = useState('');
  const [message, setMessage] = useState('');

  // Tự động tính điểm tuần (0 - 6)
  const calculatedWeeklyScore = Object.values(behaviors).filter(Boolean).length;

  const handleSelectHousehold = (hId: string, week?: WeekNumber) => {
    setSelectedHouseholdId(hId);
    const targetWeek = week || selectedWeek;
    const rec = bc06List.find((b) => b.householdId === hId && b.week === targetWeek);

    if (rec) {
      setBehaviors(rec.behaviors);
      setSelectedBarriers(rec.barriers);
      setOtherBarrier(rec.otherBarrierText || '');
    } else {
      setBehaviors({
        b1_thuGom: true,
        b2_phanLoai: false,
        b3_luuChua: false,
        b4_khongXaThang: true,
        b5_xuLyTaiSuDung: false,
        b6_veSinh: true,
      });
      setSelectedBarriers([]);
      setOtherBarrier('');
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

  const handleSaveReport = (e: React.FormEvent) => {
    e.preventDefault();

    const list = StorageService.getBC06List();
    const existingIndex = list.findIndex(
      (b) => b.householdId === selectedHouseholdId && b.week === selectedWeek
    );

    const record: BC06Record = {
      id: currentRecord?.id || `BC06_${selectedHouseholdId}_${selectedWeek}`,
      householdId: selectedHouseholdId,
      week: selectedWeek,
      behaviors: {
        b1_thuGom: !!behaviors.b1_thuGom,
        b2_phanLoai: !!behaviors.b2_phanLoai,
        b3_luuChua: !!behaviors.b3_luuChua,
        b4_khongXaThang: !!behaviors.b4_khongXaThang,
        b5_xuLyTaiSuDung: !!behaviors.b5_xuLyTaiSuDung,
        b6_veSinh: !!behaviors.b6_veSinh,
      },
      weeklyScore: calculatedWeeklyScore,
      barriers: selectedBarriers,
      otherBarrierText: otherBarrier.trim() || undefined,
      isLocked: true,
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

    StorageService.saveBC06List(list);

    StorageService.addAuditLog({
      userId: currentUser.id,
      username: currentUser.username,
      userRole: currentUser.role,
      action: existingIndex >= 0 ? 'UPDATE' : 'CREATE',
      targetModule: 'BC06_WEEKLY',
      householdId: selectedHouseholdId,
      reason: `Nộp/cập nhật báo cáo tuần ${selectedWeek} của hộ ${selectedHouseholdId} (Điểm: ${calculatedWeeklyScore}/6).`,
    });

    setMessage(`Đã lưu thành công báo cáo tuần ${selectedWeek} cho hộ ${selectedHouseholdId}!`);
    setTimeout(() => {
      setMessage('');
      if (onRefreshData) onRefreshData();
    }, 2000);
  };

  const weeks: WeekNumber[] = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'];

  // Thống kê nộp tuần cho tuần đang chọn
  const reportsInSelectedWeek = bc06List.filter((b) => b.week === selectedWeek);
  const submittedCount = tnHouseholds.filter((h) =>
    reportsInSelectedWeek.some((r) => r.householdId === h.id)
  ).length;
  const submissionRate = tnHouseholds.length > 0 ? Math.round((submittedCount / tnHouseholds.length) * 100) : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <CalendarDays className="w-6 h-6 text-emerald-600" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              MODULE BC-06: THEO DÕI HÀNH VI 6 TUẦN (W1 - W6)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi tự báo cáo hành vi hàng tuần và giám sát các rào cản chất thải phát sinh
          </p>
        </div>

        {/* 6-Week Selector */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl space-x-1">
          {weeks.map((w) => {
            const isSelected = selectedWeek === w;
            const wCount = bc06List.filter((b) => b.week === w).length;
            const wRate = Math.round((wCount / (tnHouseholds.length || 1)) * 100);

            return (
              <button
                key={w}
                type="button"
                onClick={() => {
                  setSelectedWeek(w);
                  handleSelectHousehold(selectedHouseholdId, w);
                }}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all text-center ${
                  isSelected
                    ? 'bg-emerald-700 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                <div>{w}</div>
                <div className={`text-[10px] ${isSelected ? 'text-emerald-200' : 'text-slate-400'}`}>
                  {wRate}%
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats Summary for Selected Week */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            {selectedWeek}
          </div>
          <div>
            <div className="font-extrabold text-slate-900 text-sm">
              TIẾN ĐỘ NỘP BÁO CÁO TUẦN {selectedWeek} (NHÓM TN)
            </div>
            <div className="text-slate-500 text-xs">
              Đã nộp: <strong className="text-emerald-700">{submittedCount}</strong> / {tnHouseholds.length} hộ ({submissionRate}%)
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="w-48 bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className="bg-emerald-600 h-3 rounded-full transition-all"
              style={{ width: `${submissionRate}%` }}
            />
          </div>
          <span className="font-bold text-emerald-800">{submissionRate}%</span>
        </div>
      </div>

      {message && (
        <div className="p-3.5 bg-emerald-600 text-white rounded-xl text-xs font-bold text-center animate-in fade-in">
          ✓ {message}
        </div>
      )}

      {/* Main Grid: Left = Households status in selected week; Right = Entry Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: 20 TN Households status */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
          <h2 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
            TRẠNG THÁI NỘP BÀI TUẦN {selectedWeek}
          </h2>

          <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1 text-xs">
            {tnHouseholds.map((h) => {
              const rec = reportsInSelectedWeek.find((r) => r.householdId === h.id);
              const isSelected = selectedHouseholdId === h.id;

              return (
                <button
                  key={h.id}
                  onClick={() => handleSelectHousehold(h.id)}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <div>
                    <span className="font-extrabold mr-1.5">{h.id}:</span>
                    <span className="font-semibold">{h.representativeName}</span>
                  </div>

                  {rec ? (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        isSelected ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {rec.weeklyScore}/6 điểm
                    </span>
                  ) : (
                    <span className="text-[10px] text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded-md">
                      Chưa nộp
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Weekly Entry Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-black text-slate-900">
                PHIẾU BÁO CÁO TUẦN {selectedWeek}: HỘ {selectedHouseholdId}
              </h2>
              <p className="text-xs text-slate-500">
                Chủ hộ: {tnHouseholds.find((h) => h.id === selectedHouseholdId)?.representativeName}
              </p>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-900">
              Điểm tuần: {calculatedWeeklyScore} / 6
            </div>
          </div>

          <form onSubmit={handleSaveReport} className="space-y-4 text-xs">
            {/* 6 hành vi Có/Không */}
            <div className="space-y-2">
              <label className="block font-extrabold text-slate-800">
                6 HÀNH VI QUẢN LÝ CHẤT THẢI TRONG TUẦN {selectedWeek}:
              </label>

              {[
                { key: 'b1_thuGom', title: 'B1. Thu gom chất thải đúng cách mỗi ngày' },
                { key: 'b2_phanLoai', title: 'B2. Phân loại riêng vỏ thuốc thú y, kim tiêm nguy hại' },
                { key: 'b3_luuChua', title: 'B3. Nơi lưu chứa phân có mái che/bạt phủ chống mưa' },
                { key: 'b4_khongXaThang', title: 'B4. Không xả phân và nước thải tươi ra ngoài tự nhiên' },
                { key: 'b5_xuLyTaiSuDung', title: 'B5. Có ủ phân hữu cơ hoặc đưa vào hầm biogas' },
                { key: 'b6_veSinh', title: 'B6. Quét dọn, rải vôi/phun sát trùng chuồng nuôi' },
              ].map((item) => (
                <div
                  key={item.key}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between"
                >
                  <span className="font-semibold text-slate-800">{item.title}</span>
                  <div className="flex space-x-1">
                    <button
                      type="button"
                      onClick={() => setBehaviors({ ...behaviors, [item.key]: true })}
                      className={`px-3 py-1 rounded-lg font-bold ${
                        behaviors[item.key]
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white border border-slate-300 text-slate-600'
                      }`}
                    >
                      CÓ
                    </button>
                    <button
                      type="button"
                      onClick={() => setBehaviors({ ...behaviors, [item.key]: false })}
                      className={`px-2.5 py-1 rounded-lg font-bold ${
                        !behaviors[item.key]
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

            {/* Bảng chọn rào cản */}
            <div className="pt-2">
              <label className="block font-extrabold text-slate-800 mb-2">
                KHÓ KHĂN / RÀO CẢN HỘ GẶP PHẢI TRONG TUẦN NÀY (Chọn nhiều):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {COMMON_BARRIERS.map((barrier) => {
                  const isSelected = selectedBarriers.includes(barrier.label);
                  return (
                    <button
                      key={barrier.id}
                      type="button"
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

            {/* Khó khăn khác */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Mô tả khó khăn khác (nếu có):
              </label>
              <input
                type="text"
                value={otherBarrier}
                onChange={(e) => setOtherBarrier(e.target.value)}
                placeholder="Ví dụ: Trời mưa ẩm ướt khó thu gom phân..."
                className="w-full border border-slate-300 rounded-xl p-2.5"
              />
            </div>

            {/* Submit button */}
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold flex items-center space-x-2 transition-all shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>LƯU BÁO CÁO TUẦN {selectedWeek}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
