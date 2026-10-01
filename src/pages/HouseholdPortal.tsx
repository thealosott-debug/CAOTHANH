import React, { useState } from 'react';
import {
  Leaf,
  CheckCircle,
  Clock,
  AlertCircle,
  HelpCircle,
  FileCheck,
  Send,
  Calendar,
  Lock,
  ChevronRight,
  ShieldCheck,
  Check,
  Smile,
} from 'lucide-react';
import { BC05Record, BC06Record, Household, User, WeekNumber } from '../types';
import { StorageService } from '../services/storage';
import { COMMON_BARRIERS } from '../config/initialData';

interface HouseholdPortalProps {
  user: User;
  onRefreshData?: () => void;
}

export const HouseholdPortal: React.FC<HouseholdPortalProps> = ({ user, onRefreshData }) => {
  const householdId = user.householdId || 'H01';
  const households = StorageService.getHouseholds();
  const household = households.find((h) => h.id === householdId);

  const bc05List = StorageService.getBC05List();
  const commitment = bc05List.find((b) => b.householdId === householdId);

  const bc06List = StorageService.getBC06List();
  const weeklyReports = bc06List.filter((b) => b.householdId === householdId);

  // Nhóm can thiệp (TN) hay đối chứng (ĐC)
  const isTN = household?.group === 'TN';

  // State cho nộp cam kết xanh
  const [commitmentChecked, setCommitmentChecked] = useState<{ [key: string]: boolean }>({
    b1: true,
    b2: true,
    b3: true,
    b4: true,
    b5: true,
    b6: true,
    b7: true,
  });
  const [commitmentSuccess, setCommitmentSuccess] = useState(false);

  // State cho báo cáo tuần
  const [selectedWeek, setSelectedWeek] = useState<WeekNumber>('W1');
  const [weeklyBehaviors, setWeeklyBehaviors] = useState<{ [key: string]: boolean }>({
    b1_thuGom: true,
    b2_phanLoai: true,
    b3_luuChua: true,
    b4_khongXaThang: true,
    b5_xuLyTaiSuDung: true,
    b6_veSinh: true,
  });
  const [selectedBarriers, setSelectedBarriers] = useState<string[]>([]);
  const [otherBarrier, setOtherBarrier] = useState('');
  const [reportSuccessMsg, setReportSuccessMsg] = useState('');

  // Tab active trong mobile view: 'COMMITMENT' | 'WEEKLY' | 'HISTORY' | 'PROFILE'
  const [activeTab, setActiveTab] = useState<'COMMITMENT' | 'WEEKLY' | 'HISTORY' | 'PROFILE'>(
    isTN && !commitment?.confirmed ? 'COMMITMENT' : 'WEEKLY'
  );

  // Xử lý xác nhận cam kết xanh
  const handleConfirmCommitment = () => {
    const newRecord: BC05Record = {
      id: `BC05_${householdId}`,
      householdId,
      commitments: {
        b1_thuGom: commitmentChecked.b1,
        b2_phanLoai: commitmentChecked.b2,
        b3_luuChua: commitmentChecked.b3,
        b4_khongXaThang: commitmentChecked.b4,
        b5_xuLyTaiSuDung: commitmentChecked.b5,
        b6_veSinh: commitmentChecked.b6,
        b7_baoCaoHangTuan: commitmentChecked.b7,
      },
      confirmed: true,
      confirmedAt: new Date().toISOString(),
      confirmedBy: household?.representativeName || user.fullName,
      version: '1.0-CHÍNH THỨC',
      createdAt: new Date().toISOString(),
    };

    const currentList = StorageService.getBC05List().filter((b) => b.householdId !== householdId);
    currentList.push(newRecord);
    StorageService.saveBC05List(currentList);

    StorageService.addAuditLog({
      userId: user.id,
      username: user.username,
      userRole: 'HOUSEHOLD',
      action: 'UPDATE',
      targetModule: 'BC05_CAM_KET',
      householdId,
      reason: `Hộ ${householdId} đã bấm ký xác nhận Cam kết xanh trực tuyến trên điện thoại.`,
    });

    setCommitmentSuccess(true);
    setTimeout(() => {
      setCommitmentSuccess(false);
      setActiveTab('WEEKLY');
      if (onRefreshData) onRefreshData();
    }, 1500);
  };

  // Xử lý nộp báo cáo tuần
  const handleSubmitWeekly = (e: React.FormEvent) => {
    e.preventDefault();

    const score = Object.values(weeklyBehaviors).filter(Boolean).length;
    const existingIndex = bc06List.findIndex(
      (b) => b.householdId === householdId && b.week === selectedWeek
    );

    const record: BC06Record = {
      id: `BC06_${householdId}_${selectedWeek}`,
      householdId,
      week: selectedWeek,
      behaviors: {
        b1_thuGom: weeklyBehaviors.b1_thuGom,
        b2_phanLoai: weeklyBehaviors.b2_phanLoai,
        b3_luuChua: weeklyBehaviors.b3_luuChua,
        b4_khongXaThang: weeklyBehaviors.b4_khongXaThang,
        b5_xuLyTaiSuDung: weeklyBehaviors.b5_xuLyTaiSuDung,
        b6_veSinh: weeklyBehaviors.b6_veSinh,
      },
      weeklyScore: score,
      barriers: selectedBarriers,
      otherBarrierText: otherBarrier.trim() || undefined,
      isLocked: true,
      submittedAt: new Date().toISOString(),
      submittedBy: household?.representativeName || user.fullName,
      updatedAt: new Date().toISOString(),
      updatedBy: household?.representativeName || user.fullName,
    };

    const updatedList = [...bc06List];
    if (existingIndex >= 0) {
      updatedList[existingIndex] = record;
    } else {
      updatedList.push(record);
    }
    StorageService.saveBC06List(updatedList);

    StorageService.addAuditLog({
      userId: user.id,
      username: user.username,
      userRole: 'HOUSEHOLD',
      action: existingIndex >= 0 ? 'UPDATE' : 'CREATE',
      targetModule: 'BC06_WEEKLY',
      householdId,
      reason: `Hộ ${householdId} nộp báo cáo tuần ${selectedWeek} (Điểm hành vi: ${score}/6).`,
    });

    setReportSuccessMsg(`Báo cáo tuần ${selectedWeek} đã được gửi thành công!`);
    setTimeout(() => {
      setReportSuccessMsg('');
      if (onRefreshData) onRefreshData();
    }, 2500);
  };

  const toggleBarrier = (label: string) => {
    if (selectedBarriers.includes(label)) {
      setSelectedBarriers(selectedBarriers.filter((b) => b !== label));
    } else {
      setSelectedBarriers([...selectedBarriers, label]);
    }
  };

  // Kiểm tra trạng thái nộp các tuần W1-W6
  const weeks: WeekNumber[] = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'];

  return (
    <div className="max-w-2xl mx-auto pb-24 px-4 pt-4">
      {/* Welcome Card */}
      <div className="bg-linear-to-r from-emerald-800 to-teal-700 text-white rounded-3xl p-5 shadow-lg mb-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider bg-emerald-900/60 px-2.5 py-1 rounded-full border border-emerald-500/40">
              MÃ HỘ: {householdId}
            </span>
            <h1 className="text-xl font-extrabold mt-2">
              Xin chào, {household?.representativeName || user.fullName}!
            </h1>
            <p className="text-xs text-emerald-100/90 mt-0.5">
              {household?.livestockType} ({household?.herdSize} con) • {household?.address}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20">
            <Leaf className="w-7 h-7 text-emerald-300" />
          </div>
        </div>

        {/* Status bar */}
        <div className="mt-4 pt-3 border-t border-emerald-600/60 flex items-center justify-between text-xs">
          <span>Tiến trình nghiên cứu:</span>
          <span className="font-bold bg-emerald-600 px-2 py-0.5 rounded-lg">
            {isTN
              ? commitment?.confirmed
                ? `Đã nộp ${weeklyReports.length}/6 tuần`
                : 'Chưa ký Cam kết'
              : 'Đã hoàn thành khảo sát'}
          </span>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex bg-slate-200/80 p-1 rounded-2xl mb-4 text-xs font-bold text-slate-600">
        {isTN && (
          <button
            onClick={() => setActiveTab('COMMITMENT')}
            className={`flex-1 py-2.5 rounded-xl transition-all ${
              activeTab === 'COMMITMENT'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            Cam kết xanh
          </button>
        )}
        <button
          onClick={() => setActiveTab('WEEKLY')}
          className={`flex-1 py-2.5 rounded-xl transition-all ${
            activeTab === 'WEEKLY' ? 'bg-emerald-700 text-white shadow-xs' : 'hover:text-slate-900'
          }`}
        >
          {isTN ? 'Báo cáo tuần' : 'Nhiệm vụ'}
        </button>
        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`flex-1 py-2.5 rounded-xl transition-all ${
            activeTab === 'HISTORY' ? 'bg-emerald-700 text-white shadow-xs' : 'hover:text-slate-900'
          }`}
        >
          Lịch sử
        </button>
        <button
          onClick={() => setActiveTab('PROFILE')}
          className={`flex-1 py-2.5 rounded-xl transition-all ${
            activeTab === 'PROFILE' ? 'bg-emerald-700 text-white shadow-xs' : 'hover:text-slate-900'
          }`}
        >
          Hồ sơ
        </button>
      </div>

      {/* TAB 1: CAM KẾT XANH (CHỈ CHO NHÓM TN) */}
      {isTN && activeTab === 'COMMITMENT' && (
        <div className="bg-white rounded-3xl p-6 shadow-md border border-emerald-100 space-y-5 animate-in fade-in duration-150">
          <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">PHIẾU "CAM KẾT XANH"</h2>
              <p className="text-xs text-slate-500">Chương trình nghiên cứu quản lý chất thải tại nguồn</p>
            </div>
          </div>

          {commitment?.confirmed ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                <Check className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-emerald-900 text-base">ĐÃ XÁC NHẬN CAM KẾT</h3>
              <p className="text-xs text-emerald-700">
                Gia đình đã ký cam kết trực tuyến vào ngày{' '}
                <strong>{new Date(commitment.confirmedAt || '').toLocaleDateString('vi-VN')}</strong>.
              </p>
              <div className="text-left bg-white p-3.5 rounded-xl border border-emerald-100 text-xs text-slate-700 space-y-2 mt-3">
                <p className="font-semibold text-emerald-800">Nội dung 7 cam kết vàng đã ký:</p>
                <ul className="space-y-1.5 list-disc list-inside text-slate-600">
                  <li>Thu gom chất thải hàng ngày đúng cách</li>
                  <li>Phân loại riêng chất thải thú y nguy hại</li>
                  <li>Duy trì nơi lưu chứa phân có mái che/bạt phủ</li>
                  <li>Tuyệt đối không xả phân tươi chưa xử lý ra kênh rạch</li>
                  <li>Xử lý phân bằng hầm biogas hoặc ủ men vi sinh</li>
                  <li>Duy trì vệ sinh, rắc vôi khử trùng chuồng nuôi</li>
                  <li>Báo cáo kết quả trung thực hằng tuần qua ứng dụng</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
                "Tôi cam kết thực hiện các hành vi quản lý chất thải phù hợp trong suốt thời gian 6 tuần tham gia nghiên cứu nhằm bảo vệ sức khỏe gia đình và môi trường thôn xóm."
              </p>

              <div className="space-y-2.5">
                {[
                  { key: 'b1', label: '1. Thu gom chất thải đúng cách định kỳ mỗi ngày' },
                  { key: 'b2', label: '2. Phân loại chất thải nguy hại (vỏ thuốc thú y, kim tiêm)' },
                  { key: 'b3', label: '3. Duy trì nơi lưu chứa/hố ủ phù hợp có che chắn' },
                  { key: 'b4', label: '4. Tuyệt đối không xả trực tiếp phân thải ra môi trường' },
                  { key: 'b5', label: '5. Thực hiện ủ phân vi sinh hoặc vận hành hầm biogas' },
                  { key: 'b6', label: '6. Duy trì vệ sinh, khử trùng chuồng nuôi sạch sẽ' },
                  { key: 'b7', label: '7. Báo cáo tình hình thực hiện hằng tuần đầy đủ' },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-start space-x-3 p-3 bg-slate-50 hover:bg-emerald-50 rounded-xl border border-slate-200 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={commitmentChecked[item.key]}
                      onChange={(e) =>
                        setCommitmentChecked({
                          ...commitmentChecked,
                          [item.key]: e.target.checked,
                        })
                      }
                      className="w-5 h-5 rounded-md text-emerald-600 focus:ring-emerald-500 mt-0.5"
                    />
                    <span className="text-xs font-medium text-slate-800">{item.label}</span>
                  </label>
                ))}
              </div>

              {commitmentSuccess && (
                <div className="p-3 bg-emerald-600 text-white text-xs rounded-xl text-center font-bold">
                  ✓ Cam kết xanh đã được ký thành công! Đang chuyển trang...
                </div>
              )}

              <button
                type="button"
                onClick={handleConfirmCommitment}
                className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2"
              >
                <CheckCircle className="w-5 h-5" />
                <span>XÁC NHẬN CAM KẾT XANH</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BÁO CÁO TUẦN (W1 - W6) CHO NHÓM TN HOẶC NHIỆM VỤ CHO ĐC */}
      {activeTab === 'WEEKLY' && (
        <div className="space-y-4">
          {!isTN ? (
            /* Dành cho nhóm Đối chứng (ĐC) */
            <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-200 space-y-4 text-center">
              <div className="w-14 h-14 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center mx-auto">
                <Smile className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">NHIỆM VỤ CỦA HỘ CHĂN NUÔI</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Cảm ơn gia đình đã tham gia đề tài nghiên cứu. Gia đình duy trì quy trình chăm sóc và vệ sinh chuồng trại như thường ngày. Nghiên cứu viên sẽ đến thăm định kỳ để hướng dẫn kỹ thuật an toàn sinh học.
              </p>
              <div className="bg-teal-50 border border-teal-100 p-4 rounded-2xl text-left text-xs text-teal-900 space-y-1.5">
                <p className="font-bold">Lịch trình khảo sát:</p>
                <p>• Khảo sát ban đầu: <strong>Đã hoàn thành</strong></p>
                <p>• Khảo sát & quan sát đánh giá sau: <strong>Dự kiến tuần 6</strong></p>
              </div>
            </div>
          ) : (
            /* Dành cho nhóm Can thiệp (TN): Báo cáo tuần W1-W6 */
            <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-md border border-slate-100 space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">BÁO CÁO HÀNH VI HẰNG TUẦN</h2>
                  <p className="text-xs text-slate-500">6 tuần theo dõi (Mỗi tuần nộp 1 lần vào cuối tuần)</p>
                </div>
                <Calendar className="w-6 h-6 text-emerald-600" />
              </div>

              {/* Selector 6 tuần */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">CHỌN TUẦN BÁO CÁO:</label>
                <div className="grid grid-cols-6 gap-1.5">
                  {weeks.map((w) => {
                    const isReported = weeklyReports.some((r) => r.week === w);
                    const isSelected = selectedWeek === w;
                    return (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setSelectedWeek(w)}
                        className={`py-2 rounded-xl text-xs font-bold transition-all relative ${
                          isSelected
                            ? 'bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-500'
                            : isReported
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {w}
                        {isReported && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[8px]">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form Báo cáo hành vi 6 tiêu chí Có/Không */}
              <form onSubmit={handleSubmitWeekly} className="space-y-4">
                <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 space-y-3">
                  <p className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                    Trong tuần {selectedWeek}, gia đình có thực hiện các việc sau không?
                  </p>

                  {[
                    { key: 'b1_thuGom', title: 'B1. Thu gom phân định kỳ mỗi ngày' },
                    { key: 'b2_phanLoai', title: 'B2. Phân loại riêng vỏ chai lọ thuốc/kim tiêm' },
                    { key: 'b3_luuChua', title: 'B3. Lưu chứa phân trong hố/nhà có mái che, bạt phủ' },
                    { key: 'b4_khongXaThang', title: 'B4. Không xả phân và nước thải tươi ra ngoài' },
                    { key: 'b5_xuLyTaiSuDung', title: 'B5. Có ủ phân hữu cơ hoặc đưa vào biogas' },
                    { key: 'b6_veSinh', title: 'B6. Quét dọn, rắc vôi/phun sát trùng chuồng' },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200"
                    >
                      <span className="text-xs font-semibold text-slate-800">{item.title}</span>
                      <div className="flex space-x-1">
                        <button
                          type="button"
                          onClick={() =>
                            setWeeklyBehaviors({ ...weeklyBehaviors, [item.key]: true })
                          }
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            weeklyBehaviors[item.key]
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          CÓ
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setWeeklyBehaviors({ ...weeklyBehaviors, [item.key]: false })
                          }
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                            !weeklyBehaviors[item.key]
                              ? 'bg-red-500 text-white'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          KHÔNG
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bảng chọn rào cản / khó khăn */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-2">
                    TUẦN NÀY GIA ĐÌNH CÓ GẶP KHÓ KHĂN / RÀO CẢN NÀO DƯỚI ĐÂY KHÔNG? (Có thể chọn nhiều):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {COMMON_BARRIERS.map((barrier) => {
                      const isSelected = selectedBarriers.includes(barrier.label);
                      return (
                        <button
                          type="button"
                          key={barrier.id}
                          onClick={() => toggleBarrier(barrier.label)}
                          className={`text-left p-2.5 rounded-xl border text-xs font-medium transition-all ${
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Khó khăn khác nếu có (mô tả ngắn):
                  </label>
                  <input
                    type="text"
                    value={otherBarrier}
                    onChange={(e) => setOtherBarrier(e.target.value)}
                    placeholder="Ví dụ: Trời mưa to liên tục 3 ngày làm tràn nước..."
                    className="w-full text-xs border border-slate-300 rounded-xl p-3 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {reportSuccessMsg && (
                  <div className="p-3 bg-emerald-600 text-white text-xs rounded-xl text-center font-bold animate-in fade-in">
                    ✓ {reportSuccessMsg}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2"
                >
                  <Send className="w-5 h-5" />
                  <span>GỬI BÁO CÁO TUẦN {selectedWeek}</span>
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: LỊCH SỬ BÁO CÁO */}
      {activeTab === 'HISTORY' && (
        <div className="bg-white rounded-3xl p-5 shadow-md border border-slate-100 space-y-4 animate-in fade-in duration-150">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
            LỊCH SỬ BÁO CÁO CỦA HỘ {householdId}
          </h2>

          {weeklyReports.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">
              Chưa có báo cáo tuần nào được ghi nhận.
            </p>
          ) : (
            <div className="space-y-3">
              {weeklyReports.map((report) => (
                <div
                  key={report.id}
                  className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-emerald-800 text-sm">
                      Tuần {report.week}
                    </span>
                    <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">
                      Điểm: {report.weeklyScore}/6
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Nộp lúc: {new Date(report.submittedAt).toLocaleString('vi-VN')}
                  </div>
                  {report.barriers.length > 0 && (
                    <div className="bg-amber-50 p-2 rounded-lg text-amber-900 border border-amber-200 text-[11px]">
                      <strong>Khó khăn đã ghi nhận:</strong> {report.barriers.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: HỒ SƠ CỦA HỘ */}
      {activeTab === 'PROFILE' && (
        <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-100 space-y-4 animate-in fade-in duration-150 text-xs">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
            THÔNG TIN HỒ SƠ HỘ CHĂN NUÔI
          </h2>
          <div className="space-y-2.5">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Mã định danh:</span>
              <span className="font-bold text-slate-900">{household?.id}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Chủ hộ đại diện:</span>
              <span className="font-bold text-slate-900">{household?.representativeName}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Số điện thoại:</span>
              <span className="font-medium text-slate-900">{household?.phone}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Địa chỉ:</span>
              <span className="font-medium text-slate-900 text-right">{household?.address}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Loại vật nuôi:</span>
              <span className="font-medium text-slate-900">{household?.livestockType}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Quy mô đàn:</span>
              <span className="font-bold text-emerald-700">{household?.herdSize} con</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Hình thức chăn nuôi:</span>
              <span className="font-medium text-slate-900">{household?.farmingType}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Phương thức xử lý:</span>
              <span className="font-medium text-slate-900">{household?.currentWasteMethod}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Nghiên cứu viên phụ trách:</span>
              <span className="font-semibold text-emerald-800">{household?.assignedResearcher}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
