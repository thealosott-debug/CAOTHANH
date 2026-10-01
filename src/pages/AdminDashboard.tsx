import React, { useState } from 'react';
import {
  Users,
  CheckCircle,
  Clock,
  Sparkles,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Award,
  Layers,
  ArrowRight,
  Filter,
  Eye,
  CalendarCheck,
} from 'lucide-react';
import { StorageService } from '../services/storage';
import { compareInterventionAndControl } from '../utils/statistics';
import { COMMON_BARRIERS } from '../config/initialData';

export const AdminDashboard: React.FC = () => {
  const households = StorageService.getHouseholds();
  const bc02List = StorageService.getBC02List();
  const bc03List = StorageService.getBC03List();
  const bc04List = StorageService.getBC04List();
  const bc05List = StorageService.getBC05List();
  const bc06List = StorageService.getBC06List();
  const bc07List = StorageService.getBC07List();
  const bc08List = StorageService.generateBC08Summary();

  const totalHouseholds = households.length;
  const tnCount = households.filter((h) => h.group === 'TN').length;
  const dcCount = households.filter((h) => h.group === 'DC').length;

  const preSurveyDone = bc02List.length;
  const preCwmDone = bc04List.filter((b) => b.stage === 'PRE').length;
  const greenCommitmentsDone = bc05List.filter((b) => b.confirmed).length;
  const postCwmDone = bc04List.filter((b) => b.stage === 'POST').length;
  const postSurveyDone = bc07List.length;

  // Tính số hộ TN hoàn thành đủ 6 tuần
  const tnCompletedW6 = households
    .filter((h) => h.group === 'TN')
    .filter((h) => {
      const reports = bc06List.filter((b) => b.householdId === h.id);
      return reports.length === 6;
    }).length;

  // Tỷ lệ hoàn thành tổng thể
  const completionRate = totalHouseholds > 0 ? Math.round((postCwmDone / totalHouseholds) * 100) : 0;

  // Thống kê so sánh TN vs ĐC
  const comparison = compareInterventionAndControl(bc08List);

  // Thống kê tiến độ nộp tuần W1-W6 của nhóm TN
  const weekProgress = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'].map((week) => {
    const count = bc06List.filter((b) => b.week === week).length;
    const rate = tnCount > 0 ? Math.round((count / tnCount) * 100) : 0;
    return { week, count, rate };
  });

  // Điểm trung bình tuần W1-W6 của nhóm TN
  const weekAvgScores = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'].map((week) => {
    const scores = bc06List.filter((b) => b.week === week).map((b) => b.weeklyScore);
    const avg = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : '0';
    return { week, avg: parseFloat(avg) };
  });

  // Thống kê rào cản phổ biến từ BC06
  const barrierCounts: Record<string, number> = {};
  bc06List.forEach((w) => {
    w.barriers.forEach((b) => {
      barrierCounts[b] = (barrierCounts[b] || 0) + 1;
    });
  });
  const sortedBarriers = Object.entries(barrierCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  // Điểm CWM trung bình Trước và Sau theo nhóm
  const tnPreCwmList = bc08List.filter((b) => b.group === 'TN' && b.scoreCWM_Pre !== null).map((b) => b.scoreCWM_Pre as number);
  const tnPostCwmList = bc08List.filter((b) => b.group === 'TN' && b.scoreCWM_Post !== null).map((b) => b.scoreCWM_Post as number);
  const dcPreCwmList = bc08List.filter((b) => b.group === 'DC' && b.scoreCWM_Pre !== null).map((b) => b.scoreCWM_Pre as number);
  const dcPostCwmList = bc08List.filter((b) => b.group === 'DC' && b.scoreCWM_Post !== null).map((b) => b.scoreCWM_Post as number);

  const meanTnPre = tnPreCwmList.length ? (tnPreCwmList.reduce((a, b) => a + b, 0) / tnPreCwmList.length).toFixed(2) : '0.0';
  const meanTnPost = tnPostCwmList.length ? (tnPostCwmList.reduce((a, b) => a + b, 0) / tnPostCwmList.length).toFixed(2) : '0.0';
  const meanDcPre = dcPreCwmList.length ? (dcPreCwmList.reduce((a, b) => a + b, 0) / dcPreCwmList.length).toFixed(2) : '0.0';
  const meanDcPost = dcPostCwmList.length ? (dcPostCwmList.reduce((a, b) => a + b, 0) / dcPostCwmList.length).toFixed(2) : '0.0';

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title & Research Topic Info */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                DASHBOARD NGHIÊN CỨU THỰC NGHIỆM
              </span>
              <span className="text-xs text-slate-400">• Cập nhật thời gian thực</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              Đề tài: "Tác động của Cam kết xanh đến hành vi quản lý chất thải tại nguồn"
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Thiết kế nghiên cứu: Can thiệp bán thực nghiệm có đối chứng (Quasi-experimental Pretest-Posttest Control Group Design)
            </p>
          </div>
          <div className="flex items-center space-x-3 shrink-0">
            <div className="text-right">
              <div className="text-xs text-slate-500">Tiến độ thu thập dữ liệu</div>
              <div className="text-lg font-extrabold text-emerald-700">{completionRate}%</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* 8 KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold">TỔNG SỐ HỘ</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalHouseholds}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex space-x-2">
            <span className="font-semibold text-emerald-700">TN: {tnCount}</span>
            <span>•</span>
            <span className="font-semibold text-teal-700">ĐC: {dcCount}</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold">KHẢO SÁT TRƯỚC (BC02)</span>
            <CheckCircle className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {preSurveyDone}/{totalHouseholds}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">
            {Math.round((preSurveyDone / (totalHouseholds || 1)) * 100)}% đã hoàn thành
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold">QUAN SÁT CWM TRƯỚC</span>
            <Eye className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {preCwmDone}/{totalHouseholds}
          </div>
          <div className="text-[11px] text-purple-600 font-semibold mt-1">
            Đánh giá khách quan 0-6 điểm
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold">CAM KẾT XANH (TN)</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {greenCommitmentsDone}/{tnCount}
          </div>
          <div className="text-[11px] text-amber-600 font-semibold mt-1">
            {Math.round((greenCommitmentsDone / (tnCount || 1)) * 100)}% hộ TN đã xác nhận
          </div>
        </div>

        {/* Card 5 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold">HOÀN THÀNH W1-W6</span>
            <CalendarCheck className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {tnCompletedW6}/{tnCount}
          </div>
          <div className="text-[11px] text-teal-700 font-semibold mt-1">
            Hộ TN nộp đủ 6 tuần
          </div>
        </div>

        {/* Card 6 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold">QUAN SÁT CWM SAU</span>
            <Eye className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {postCwmDone}/{totalHouseholds}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">
            Đánh giá sau 6 tuần
          </div>
        </div>

        {/* Card 7 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold">KHẢO SÁT SAU (BC07)</span>
            <CheckCircle className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {postSurveyDone}/{totalHouseholds}
          </div>
          <div className="text-[11px] text-indigo-600 font-semibold mt-1">
            Đo lường HT sau can thiệp
          </div>
        </div>

        {/* Card 8 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold">HIỆU SỐ TÁC ĐỘNG</span>
            <Award className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600">
            {comparison.differenceMeanDelta > 0 ? `+${comparison.differenceMeanDelta}` : comparison.differenceMeanDelta}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Mean ΔCWM(TN) - Mean ΔCWM(ĐC)
          </div>
        </div>
      </div>

      {/* Scientific Principle Reminder */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-start space-x-3 text-xs text-slate-600">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p>
          <strong>Nguyên tắc khách quan khoa học:</strong> Dashboard hiển thị số liệu thống kê mô tả trung thực thu thập từ thực địa. Không tự ý suy diễn hoặc kết luận quan hệ nhân quả tuyệt đối khi chưa tiến hành kiểm định ý nghĩa thống kê (t-test / ANOVA) trên phần mềm chuyên dụng.
        </p>
      </div>

      {/* Comparative Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: So sánh CWM Trước và Sau giữa TN và ĐC */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                1. SO SÁNH ĐIỂM CWM TRUNG BÌNH TRƯỚC VÀ SAU CAN THIỆP
              </h2>
              <p className="text-xs text-slate-500">Thang đo CWM (0 đến 6 điểm)</p>
            </div>
            <BarChart3 className="w-5 h-5 text-emerald-600" />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            {/* Group TN */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
              <span className="font-extrabold text-xs text-emerald-900 uppercase">
                NHÓM CAN THIỆP (TN - n=20)
              </span>
              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between text-slate-600 mb-1">
                    <span>Trước can thiệp:</span>
                    <strong className="text-slate-900">{meanTnPre} / 6.0</strong>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div
                      className="bg-slate-500 h-3 rounded-full transition-all"
                      style={{ width: `${(parseFloat(meanTnPre) / 6) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-emerald-800 mb-1">
                    <span className="font-bold">Sau can thiệp:</span>
                    <strong className="text-emerald-900 font-extrabold">{meanTnPost} / 6.0</strong>
                  </div>
                  <div className="w-full bg-emerald-200 rounded-full h-3">
                    <div
                      className="bg-emerald-600 h-3 rounded-full transition-all"
                      style={{ width: `${(parseFloat(meanTnPost) / 6) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-emerald-200 flex justify-between text-xs font-bold text-emerald-800">
                  <span>Mức tăng trung bình (Mean ΔCWM):</span>
                  <span>+{comparison.tnStats.mean}</span>
                </div>
              </div>
            </div>

            {/* Group ĐC */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <span className="font-extrabold text-xs text-slate-700 uppercase">
                NHÓM ĐỐI CHỨNG (ĐC - n=20)
              </span>
              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between text-slate-600 mb-1">
                    <span>Trước can thiệp:</span>
                    <strong className="text-slate-900">{meanDcPre} / 6.0</strong>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div
                      className="bg-slate-500 h-3 rounded-full transition-all"
                      style={{ width: `${(parseFloat(meanDcPre) / 6) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-700 mb-1">
                    <span>Sau can thiệp:</span>
                    <strong className="text-slate-900">{meanDcPost} / 6.0</strong>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div
                      className="bg-teal-600 h-3 rounded-full transition-all"
                      style={{ width: `${(parseFloat(meanDcPost) / 6) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between text-xs font-bold text-slate-700">
                  <span>Mức biến thiên trung bình (Mean ΔCWM):</span>
                  <span>{comparison.dcStats.mean > 0 ? `+${comparison.dcStats.mean}` : comparison.dcStats.mean}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-900 flex justify-between items-center">
            <span>Chênh lệch tác động (Mean ΔCWM_TN - Mean ΔCWM_ĐC):</span>
            <span className="font-extrabold text-sm text-emerald-800">
              +{comparison.differenceMeanDelta} điểm
            </span>
          </div>
        </div>

        {/* Chart 2: Diễn biến 6 tuần (W1 - W6) của nhóm Can thiệp */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                2. DIỄN BIẾN ĐIỂM HÀNH VI 6 TUẦN (W1 - W6)
              </h2>
              <p className="text-xs text-slate-500">Đánh giá quá trình nhóm TN duy trì Cam kết xanh</p>
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>

          <div className="space-y-3 pt-2">
            {weekAvgScores.map((item) => (
              <div key={item.week} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-700">Tuần {item.week}</span>
                  <span className="font-bold text-emerald-700">{item.avg} / 6.0 điểm</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-3 rounded-full transition-all"
                    style={{ width: `${(item.avg / 6) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Tiến độ nộp bài */}
          <div className="pt-2 border-t border-slate-100">
            <div className="text-xs font-bold text-slate-700 mb-2">Tỷ lệ hoàn thành nộp báo cáo tuần của nhóm TN:</div>
            <div className="grid grid-cols-6 gap-1 text-center">
              {weekProgress.map((w) => (
                <div key={w.week} className="bg-slate-50 border border-slate-200 p-1.5 rounded-xl">
                  <div className="text-[10px] text-slate-500 font-bold">{w.week}</div>
                  <div className="text-xs font-extrabold text-emerald-700">{w.rate}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Các rào cản phổ biến & Tỷ lệ thay đổi hành vi */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rào cản chất thải */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                3. CÁC RÀO CẢN & KHÓ KHĂN PHỔ BIẾN
              </h2>
              <p className="text-xs text-slate-500">Ghi nhận từ báo cáo tuần và khảo sát sau</p>
            </div>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>

          <div className="space-y-3">
            {sortedBarriers.map(([barrier, count], index) => {
              const maxCount = sortedBarriers[0][1] || 1;
              return (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-800 truncate max-w-[280px]">
                      {index + 1}. {barrier}
                    </span>
                    <span className="font-bold text-slate-600">{count} lượt</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div
                      className="bg-amber-500 h-2.5 rounded-full transition-all"
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tỷ lệ cải thiện, không đổi, giảm */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                4. PHÂN BỐ THAY ĐỔI HÀNH VI (ΔCWM)
              </h2>
              <p className="text-xs text-slate-500">So sánh cơ cấu thay đổi giữa TN và ĐC</p>
            </div>
            <Layers className="w-5 h-5 text-blue-600" />
          </div>

          <div className="space-y-4 pt-1">
            {/* TN Distribution */}
            <div>
              <div className="flex justify-between text-xs font-bold text-emerald-900 mb-1.5">
                <span>Nhóm Can thiệp (TN):</span>
                <span>
                  {comparison.tnImprovementRate}% Cải thiện • {comparison.tnNoChangeRate}% Giữ nguyên
                </span>
              </div>
              <div className="h-5 w-full bg-slate-100 rounded-xl overflow-hidden flex">
                <div
                  style={{ width: `${comparison.tnImprovementRate}%` }}
                  className="bg-emerald-600 h-full flex items-center justify-center text-[10px] text-white font-bold"
                  title="Cải thiện (>0)"
                >
                  {comparison.tnImprovementRate > 15 ? `${comparison.tnImprovementRate}% Cải thiện` : ''}
                </div>
                <div
                  style={{ width: `${comparison.tnNoChangeRate}%` }}
                  className="bg-slate-400 h-full flex items-center justify-center text-[10px] text-white font-bold"
                  title="Không đổi (=0)"
                >
                  {comparison.tnNoChangeRate > 10 ? `${comparison.tnNoChangeRate}%` : ''}
                </div>
                <div
                  style={{ width: `${comparison.tnDecreaseRate}%` }}
                  className="bg-red-500 h-full flex items-center justify-center text-[10px] text-white font-bold"
                  title="Giảm (<0)"
                >
                  {comparison.tnDecreaseRate > 10 ? `${comparison.tnDecreaseRate}%` : ''}
                </div>
              </div>
            </div>

            {/* DC Distribution */}
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
                <span>Nhóm Đối chứng (ĐC):</span>
                <span>
                  {comparison.dcImprovementRate}% Cải thiện • {comparison.dcNoChangeRate}% Giữ nguyên
                </span>
              </div>
              <div className="h-5 w-full bg-slate-100 rounded-xl overflow-hidden flex">
                <div
                  style={{ width: `${comparison.dcImprovementRate}%` }}
                  className="bg-teal-600 h-full flex items-center justify-center text-[10px] text-white font-bold"
                  title="Cải thiện (>0)"
                >
                  {comparison.dcImprovementRate > 15 ? `${comparison.dcImprovementRate}%` : ''}
                </div>
                <div
                  style={{ width: `${comparison.dcNoChangeRate}%` }}
                  className="bg-slate-400 h-full flex items-center justify-center text-[10px] text-white font-bold"
                  title="Không đổi (=0)"
                >
                  {comparison.dcNoChangeRate > 10 ? `${comparison.dcNoChangeRate}% Không đổi` : ''}
                </div>
                <div
                  style={{ width: `${comparison.dcDecreaseRate}%` }}
                  className="bg-red-500 h-full flex items-center justify-center text-[10px] text-white font-bold"
                  title="Giảm (<0)"
                >
                  {comparison.dcDecreaseRate > 10 ? `${comparison.dcDecreaseRate}% Giảm` : ''}
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center space-x-4 text-[11px] text-slate-600 pt-2 border-t border-slate-100">
              <div className="flex items-center space-x-1.5">
                <div className="w-3 h-3 bg-emerald-600 rounded-xs" />
                <span>Cải thiện (ΔCWM &gt; 0)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <div className="w-3 h-3 bg-slate-400 rounded-xs" />
                <span>Không đổi (ΔCWM = 0)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <div className="w-3 h-3 bg-red-500 rounded-xs" />
                <span>Giảm (ΔCWM &lt; 0)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
