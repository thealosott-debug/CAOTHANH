import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  AlertTriangle,
  Layers,
  ArrowRight,
  Sparkles,
  Calculator,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import { StorageService } from '../services/storage';
import {
  compareInterventionAndControl,
  getDescriptiveStats,
} from '../utils/statistics';
import { ExportService } from '../services/exportService';

export const AnalysisPage: React.FC = () => {
  const summary = StorageService.generateBC08Summary();
  const comparison = compareInterventionAndControl(summary);

  // Thống kê chi tiết cho nhóm TN
  const tnKList = summary.filter((s) => s.group === 'TN' && s.scoreK_Pre !== null).map((s) => s.scoreK_Pre as number);
  const tnTList = summary.filter((s) => s.group === 'TN' && s.scoreT_Pre !== null).map((s) => s.scoreT_Pre as number);
  const tnYDList = summary.filter((s) => s.group === 'TN' && s.scoreYD_Pre !== null).map((s) => s.scoreYD_Pre as number);
  const tnCwmPreList = summary.filter((s) => s.group === 'TN' && s.scoreCWM_Pre !== null).map((s) => s.scoreCWM_Pre as number);
  const tnCwmPostList = summary.filter((s) => s.group === 'TN' && s.scoreCWM_Post !== null).map((s) => s.scoreCWM_Post as number);

  // Thống kê chi tiết cho nhóm ĐC
  const dcKList = summary.filter((s) => s.group === 'DC' && s.scoreK_Pre !== null).map((s) => s.scoreK_Pre as number);
  const dcTList = summary.filter((s) => s.group === 'DC' && s.scoreT_Pre !== null).map((s) => s.scoreT_Pre as number);
  const dcYDList = summary.filter((s) => s.group === 'DC' && s.scoreYD_Pre !== null).map((s) => s.scoreYD_Pre as number);
  const dcCwmPreList = summary.filter((s) => s.group === 'DC' && s.scoreCWM_Pre !== null).map((s) => s.scoreCWM_Pre as number);
  const dcCwmPostList = summary.filter((s) => s.group === 'DC' && s.scoreCWM_Post !== null).map((s) => s.scoreCWM_Post as number);

  const statsTnK = getDescriptiveStats(tnKList);
  const statsDcK = getDescriptiveStats(dcKList);

  const statsTnT = getDescriptiveStats(tnTList);
  const statsDcT = getDescriptiveStats(dcTList);

  const statsTnYD = getDescriptiveStats(tnYDList);
  const statsDcYD = getDescriptiveStats(dcYDList);

  const statsTnCwmPre = getDescriptiveStats(tnCwmPreList);
  const statsDcCwmPre = getDescriptiveStats(dcCwmPreList);

  const statsTnCwmPost = getDescriptiveStats(tnCwmPostList);
  const statsDcCwmPost = getDescriptiveStats(dcCwmPostList);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <Calculator className="w-6 h-6 text-emerald-600" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              PHÂN TÍCH THỐNG KÊ SO SÁNH TN – ĐC
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Trắc lượng học hành vi • Thống kê mô tả (Mean, Median, SD, Min, Max) • Đo lường hiệu ứng can thiệp
          </p>
        </div>

        <button
          onClick={() => ExportService.exportBC08('ALL')}
          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center space-x-2 transition-colors shadow-xs"
        >
          <Download className="w-4 h-4" />
          <span>XUẤT DỮ LIỆU SẠCH (SPSS / R)</span>
        </button>
      </div>

      {/* Scientific Integrity Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start space-x-3 text-xs text-amber-900">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Lưu ý phương pháp luận nghiên cứu thực nghiệm:</p>
          <p>
            Các giá trị trung bình và độ biến thiên (ΔCWM) phản ánh mức độ thay đổi hành vi ghi nhận tại thực địa. Để công bố bài báo khoa học hoặc bảo vệ trước hội đồng khoa học kỹ thuật, dữ liệu xuất ra cần được thực hiện thêm các phép kiểm định ý nghĩa thống kê (Independent samples t-test hoặc Mann-Whitney U test cho 2 nhóm độc lập; Paired samples t-test hoặc Wilcoxon signed-rank test cho trước - sau). Hệ thống không tự ý đưa ra kết luận nhân quả chủ quan.
          </p>
        </div>
      </div>

      {/* Central Comparison Metrics Box */}
      <div className="bg-linear-to-r from-emerald-900 to-teal-900 text-white rounded-3xl p-6 shadow-xl">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <span className="text-[11px] font-extrabold tracking-widest text-emerald-300 uppercase bg-emerald-800/80 px-3 py-1 rounded-full border border-emerald-700">
            CHỈ SỐ TÁC ĐỘNG CAN THIỆP CHÍNH
          </span>
          <h2 className="text-xl sm:text-2xl font-black mt-2">
            CHÊNH LỆCH BIẾN THIÊN HÀNH VI (ΔCWM)
          </h2>
          <p className="text-xs text-emerald-200">
            Hiệu số giữa Mức thay đổi nhóm Can thiệp và Mức thay đổi nhóm Đối chứng
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-emerald-800/80">
          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-4 text-center border border-white/10">
            <div className="text-xs text-emerald-200 font-bold uppercase">
              MEAN ΔCWM NHÓM CAN THIỆP (TN)
            </div>
            <div className="text-3xl font-black text-amber-300 mt-1">
              +{comparison.tnStats.mean}
            </div>
            <div className="text-[11px] text-emerald-300 mt-1">
              Độ lệch chuẩn SD: ±{comparison.tnStats.standardDeviation} (n=20)
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-4 text-center border border-white/10">
            <div className="text-xs text-emerald-200 font-bold uppercase">
              MEAN ΔCWM NHÓM ĐỐI CHỨNG (ĐC)
            </div>
            <div className="text-3xl font-black text-slate-200 mt-1">
              {comparison.dcStats.mean > 0 ? `+${comparison.dcStats.mean}` : comparison.dcStats.mean}
            </div>
            <div className="text-[11px] text-slate-300 mt-1">
              Độ lệch chuẩn SD: ±{comparison.dcStats.standardDeviation} (n=20)
            </div>
          </div>

          <div className="bg-white/15 backdrop-blur-xs rounded-2xl p-4 text-center border border-amber-400/30">
            <div className="text-xs text-amber-200 font-bold uppercase">
              HIỆU SỐ CAN THIỆP THUẦN
            </div>
            <div className="text-3xl font-black text-emerald-300 mt-1">
              +{comparison.differenceMeanDelta}
            </div>
            <div className="text-[11px] text-amber-200 mt-1">
              Mean(ΔCWM_TN) - Mean(ΔCWM_ĐC)
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Descriptive Statistics Master Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 uppercase">
              BẢNG THỐNG KÊ MÔ TẢ ĐẦY ĐỦ CÁC BIẾN SỐ NGHIÊN CỨU
            </h2>
            <p className="text-xs text-slate-500">So sánh chỉ số giữa Nhóm Can thiệp (TN) và Nhóm Đối chứng (ĐC)</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-700 uppercase font-extrabold text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Biến số nghiên cứu</th>
                <th className="py-3 px-3">Thang đo</th>
                <th className="py-3 px-3 text-center bg-emerald-50 text-emerald-900">TN: Trung bình (Mean)</th>
                <th className="py-3 px-3 text-center bg-emerald-50 text-emerald-900">TN: Trung vị (Median)</th>
                <th className="py-3 px-3 text-center bg-emerald-50 text-emerald-900">TN: Độ lệch chuẩn (SD)</th>
                <th className="py-3 px-3 text-center bg-teal-50 text-teal-900">ĐC: Trung bình (Mean)</th>
                <th className="py-3 px-3 text-center bg-teal-50 text-teal-900">ĐC: Trung vị (Median)</th>
                <th className="py-3 px-3 text-center bg-teal-50 text-teal-900">ĐC: Độ lệch chuẩn (SD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              <tr>
                <td className="py-3 px-3 font-bold text-slate-900">Kiến thức trước can thiệp (K trước)</td>
                <td className="py-3 px-3 text-slate-500">0 – 10 điểm</td>
                <td className="py-3 px-3 text-center font-bold">{statsTnK.mean}</td>
                <td className="py-3 px-3 text-center">{statsTnK.median}</td>
                <td className="py-3 px-3 text-center">±{statsTnK.standardDeviation}</td>
                <td className="py-3 px-3 text-center font-bold">{statsDcK.mean}</td>
                <td className="py-3 px-3 text-center">{statsDcK.median}</td>
                <td className="py-3 px-3 text-center">±{statsDcK.standardDeviation}</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-bold text-slate-900">Thái độ trước can thiệp (T trước)</td>
                <td className="py-3 px-3 text-slate-500">Likert 1 – 5</td>
                <td className="py-3 px-3 text-center font-bold">{statsTnT.mean}</td>
                <td className="py-3 px-3 text-center">{statsTnT.median}</td>
                <td className="py-3 px-3 text-center">±{statsTnT.standardDeviation}</td>
                <td className="py-3 px-3 text-center font-bold">{statsDcT.mean}</td>
                <td className="py-3 px-3 text-center">{statsDcT.median}</td>
                <td className="py-3 px-3 text-center">±{statsDcT.standardDeviation}</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-bold text-slate-900">Ý định thay đổi trước can thiệp (YĐ trước)</td>
                <td className="py-3 px-3 text-slate-500">Likert 1 – 5</td>
                <td className="py-3 px-3 text-center font-bold">{statsTnYD.mean}</td>
                <td className="py-3 px-3 text-center">{statsTnYD.median}</td>
                <td className="py-3 px-3 text-center">±{statsTnYD.standardDeviation}</td>
                <td className="py-3 px-3 text-center font-bold">{statsDcYD.mean}</td>
                <td className="py-3 px-3 text-center">{statsDcYD.median}</td>
                <td className="py-3 px-3 text-center">±{statsDcYD.standardDeviation}</td>
              </tr>
              <tr className="bg-slate-50/50">
                <td className="py-3 px-3 font-bold text-emerald-900">Quan sát thực tế CWM trước (CWM trước)</td>
                <td className="py-3 px-3 text-slate-500">0 – 6 điểm</td>
                <td className="py-3 px-3 text-center font-bold">{statsTnCwmPre.mean}</td>
                <td className="py-3 px-3 text-center">{statsTnCwmPre.median}</td>
                <td className="py-3 px-3 text-center">±{statsTnCwmPre.standardDeviation}</td>
                <td className="py-3 px-3 text-center font-bold">{statsDcCwmPre.mean}</td>
                <td className="py-3 px-3 text-center">{statsDcCwmPre.median}</td>
                <td className="py-3 px-3 text-center">±{statsDcCwmPre.standardDeviation}</td>
              </tr>
              <tr className="bg-slate-50/50">
                <td className="py-3 px-3 font-bold text-emerald-900">Quan sát thực tế CWM sau (CWM sau)</td>
                <td className="py-3 px-3 text-slate-500">0 – 6 điểm</td>
                <td className="py-3 px-3 text-center font-black text-emerald-700">{statsTnCwmPost.mean}</td>
                <td className="py-3 px-3 text-center font-bold">{statsTnCwmPost.median}</td>
                <td className="py-3 px-3 text-center">±{statsTnCwmPost.standardDeviation}</td>
                <td className="py-3 px-3 text-center font-black text-teal-700">{statsDcCwmPost.mean}</td>
                <td className="py-3 px-3 text-center font-bold">{statsDcCwmPost.median}</td>
                <td className="py-3 px-3 text-center">±{statsDcCwmPost.standardDeviation}</td>
              </tr>
              <tr className="bg-emerald-100/60 font-bold">
                <td className="py-3 px-3 text-emerald-950 font-black">Biến thiên hành vi ΔCWM (CWM sau - trước)</td>
                <td className="py-3 px-3 text-emerald-800">-6 đến +6</td>
                <td className="py-3 px-3 text-center font-black text-emerald-800">+{comparison.tnStats.mean}</td>
                <td className="py-3 px-3 text-center font-bold text-emerald-800">+{comparison.tnStats.median}</td>
                <td className="py-3 px-3 text-center text-emerald-800">±{comparison.tnStats.standardDeviation}</td>
                <td className="py-3 px-3 text-center font-black text-teal-800">
                  {comparison.dcStats.mean > 0 ? `+${comparison.dcStats.mean}` : comparison.dcStats.mean}
                </td>
                <td className="py-3 px-3 text-center font-bold text-teal-800">{comparison.dcStats.median}</td>
                <td className="py-3 px-3 text-center text-teal-800">±{comparison.dcStats.standardDeviation}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
