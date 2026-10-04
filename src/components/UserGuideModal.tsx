import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  CheckCircle,
  HelpCircle,
  Users,
  Shield,
  FileText,
  FileSpreadsheet,
  Cloud,
  ChevronRight,
  Sparkles,
  Info,
  Layers,
  Award,
  Calendar,
  CheckSquare,
  Eye,
  GraduationCap,
  Key,
  Wifi,
  Database,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { CWM_CRITERIA_GUIDE } from '../config/initialData';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: string;
}

type GuideTab = 'OVERVIEW' | 'ROLES' | 'MODULES' | 'CWM' | 'EXCEL_SHEETS' | 'FAQ';

export const UserGuideModal: React.FC<UserGuideModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'OVERVIEW',
}) => {
  const [activeTab, setActiveTab] = useState<GuideTab>(defaultTab as GuideTab);

  useEffect(() => {
    if (isOpen && defaultTab) {
      setActiveTab(defaultTab as GuideTab);
    }
  }, [isOpen, defaultTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-5 sm:p-6 shrink-0 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-300 shadow-inner shrink-0">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="bg-emerald-400/20 text-emerald-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-emerald-400/30">
                    Sổ tay Hướng dẫn Toàn diện
                  </span>
                  <span className="text-[11px] text-emerald-200/80 hidden sm:inline">
                    Đề tài NCKH 2026
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-white mt-1">
                  HƯỚNG DẪN SỬ DỤNG HỆ THỐNG QUẢN LÝ NGHIÊN CỨU
                </h2>
                <p className="text-xs text-emerald-200/90 line-clamp-1 max-w-2xl mt-0.5">
                  Tác động của ‘Cam kết xanh’ kết hợp ứng dụng quản lý chăn nuôi đến hành vi quản lý chất thải tại nguồn của các hộ chăn nuôi
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors shrink-0 ml-2"
              title="Đóng cửa sổ hướng dẫn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-1 sm:space-x-2 mt-5 overflow-x-auto no-scrollbar border-t border-emerald-700/60 pt-3 text-xs">
            <button
              onClick={() => setActiveTab('OVERVIEW')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                activeTab === 'OVERVIEW'
                  ? 'bg-white text-emerald-950 shadow-md scale-102'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-800/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>1. Quy trình Nghiên cứu</span>
            </button>

            <button
              onClick={() => setActiveTab('ROLES')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                activeTab === 'ROLES'
                  ? 'bg-white text-emerald-950 shadow-md scale-102'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-800/60'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>2. Theo từng Vai trò</span>
            </button>

            <button
              onClick={() => setActiveTab('MODULES')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                activeTab === 'MODULES'
                  ? 'bg-white text-emerald-950 shadow-md scale-102'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-800/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>3. Các Phiếu BC01–BC08</span>
            </button>

            <button
              onClick={() => setActiveTab('CWM')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                activeTab === 'CWM'
                  ? 'bg-white text-emerald-950 shadow-md scale-102'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-800/60'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-amber-300" />
              <span>4. Tiêu chí CWM (0-6đ)</span>
            </button>

            <button
              onClick={() => setActiveTab('EXCEL_SHEETS')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                activeTab === 'EXCEL_SHEETS'
                  ? 'bg-white text-emerald-950 shadow-md scale-102'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-800/60'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>5. Nhập Excel & Google Sheets</span>
            </button>

            <button
              onClick={() => setActiveTab('FAQ')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                activeTab === 'FAQ'
                  ? 'bg-white text-emerald-950 shadow-md scale-102'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-800/60'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-300" />
              <span>6. Hỏi đáp & Sự cố (FAQ)</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-7 overflow-y-auto space-y-6 text-sm text-slate-700 bg-slate-50/50 flex-1">
          {/* TAB 1: OVERVIEW & RESEARCH PIPELINE */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-5">
                <div className="flex items-start space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-emerald-950">
                      Mục tiêu & Thiết kế Thực nghiệm Nghiên cứu
                    </h3>
                    <p className="text-xs text-emerald-900 mt-1 leading-relaxed">
                      Nghiên cứu áp dụng phương pháp <strong>Thực nghiệm ngẫu nhiên có đối chứng (Randomized Controlled Trial - RCT)</strong> trên 40 hộ chăn nuôi quy mô nông hộ tại địa bàn, chia ngẫu nhiên thành 2 nhóm:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                      <div className="bg-white p-3.5 rounded-xl border border-emerald-300 shadow-2xs">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 bg-emerald-700 text-white font-extrabold text-[10px] rounded-md">
                            NHÓM THỰC NGHIỆM (TN)
                          </span>
                          <span className="text-xs font-bold text-emerald-900">20 hộ chăn nuôi</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                          Áp dụng đồng thời <strong>Cam kết xanh tại nguồn (BC-05)</strong> kết hợp <strong>ứng dụng di động quản lý chăn nuôi</strong>: nhận nhắc nhở hằng tuần, báo cáo W1-W6, phản hồi rào cản và nâng cao ý định duy trì.
                        </p>
                      </div>

                      <div className="bg-white p-3.5 rounded-xl border border-teal-300 shadow-2xs">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 bg-teal-700 text-white font-extrabold text-[10px] rounded-md">
                            NHÓM ĐỐI CHỨNG (ĐC)
                          </span>
                          <span className="text-xs font-bold text-teal-900">20 hộ chăn nuôi</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                          Chăn nuôi theo tập quán thông thường, chỉ tham gia khảo sát tiền can thiệp và hậu can thiệp để làm cơ sở so sánh mức độ tác động thuần túy của giải pháp can thiệp.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 6 Bước quy trình */}
              <div className="space-y-3">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <span>SƠ ĐỒ 6 BƯỚC THU THẬP DỮ LIỆU & QUẢN LÝ ĐỀ TÀI</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center space-x-2.5">
                      <span className="w-7 h-7 rounded-xl bg-emerald-700 text-white font-black text-xs flex items-center justify-center">
                        1
                      </span>
                      <h5 className="font-bold text-slate-900">Bước 1: Khởi tạo danh mục & cấp tài khoản</h5>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed pl-9">
                      Admin khởi tạo danh sách 40 hộ (h01–h40) hoặc nạp từ file Excel mẫu. Hệ thống tự động cấp tài khoản đăng nhập cho 40 hộ (mật khẩu mặc định: <code>123456</code>) và tài khoản cho các Nghiên cứu viên.
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center space-x-2.5">
                      <span className="w-7 h-7 rounded-xl bg-emerald-700 text-white font-black text-xs flex items-center justify-center">
                        2
                      </span>
                      <h5 className="font-bold text-slate-900">Bước 2: Khảo sát Tiền can thiệp (Baseline)</h5>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed pl-9">
                      Nghiên cứu viên tới thực địa hoàn thành: <strong>BC-01</strong> (Hồ sơ hộ), <strong>BC-02</strong> (Đo lường Kiến thức K, Thái độ T, Thực hành HT trước), <strong>BC-03</strong> (Ý định thay đổi YĐ), và <strong>BC-04</strong> (Quan sát thực địa CWM trước 0-6đ).
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center space-x-2.5">
                      <span className="w-7 h-7 rounded-xl bg-emerald-700 text-white font-black text-xs flex items-center justify-center">
                        3
                      </span>
                      <h5 className="font-bold text-slate-900">Bước 3: Xác nhận Cam kết xanh (Nhóm TN)</h5>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed pl-9">
                      20 hộ nhóm Thực nghiệm (TN) đăng nhập vào ứng dụng trên điện thoại/máy tính, đọc kỹ 7 điều khoản và xác nhận điện tử <strong>Phiếu BC-05 Cam kết xanh</strong> có chữ ký điện tử và mốc thời gian lưu trên hệ thống.
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center space-x-2.5">
                      <span className="w-7 h-7 rounded-xl bg-emerald-700 text-white font-black text-xs flex items-center justify-center">
                        4
                      </span>
                      <h5 className="font-bold text-slate-900">Bước 4: Theo dõi 6 tuần can thiệp (W1 – W6)</h5>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed pl-9">
                      Định kỳ Chủ nhật lúc 19:00, ứng dụng tự động gửi thông báo nhắc hộ nộp <strong>Phiếu BC-06</strong>. Hộ chấm điểm 6 hành vi tuần, báo cáo rào cản gặp phải. Nghiên cứu viên theo dõi tiến độ trên hệ thống.
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center space-x-2.5">
                      <span className="w-7 h-7 rounded-xl bg-emerald-700 text-white font-black text-xs flex items-center justify-center">
                        5
                      </span>
                      <h5 className="font-bold text-slate-900">Bước 5: Khảo sát Hậu can thiệp (Endline)</h5>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed pl-9">
                      Sau khi kết thúc 6 tuần, NCV thực hiện đánh giá cuối kỳ: nộp <strong>BC-07</strong> (Đánh giá sau can thiệp, mức độ sẵn sàng duy trì) và <strong>BC-04 Sau</strong> (Quan sát thực địa CWM sau can thiệp độc lập).
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center space-x-2.5">
                      <span className="w-7 h-7 rounded-xl bg-emerald-700 text-white font-black text-xs flex items-center justify-center">
                        6
                      </span>
                      <h5 className="font-bold text-slate-900">Bước 6: Tổng hợp số liệu BC-08 & Kiểm định</h5>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed pl-9">
                      Hệ thống tự động liên thông tính toán <strong>ΔCWM = CWM Sau – CWM Trước</strong>, thực hiện kiểm định Paired t-test, Cohen's d, tự động đồng bộ 17 Sheets lên Google Sheets và xuất báo cáo nghiệm thu khoa học.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ROLES GUIDE */}
          {activeTab === 'ROLES' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. ADMIN */}
                <div className="bg-white p-5 rounded-2xl border-2 border-purple-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-purple-100 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-700 text-white flex items-center justify-center font-bold text-sm">
                        👑
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-sm">1. Quản trị viên (Chủ nhiệm đề tài)</h4>
                        <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-full">
                          Quyền hạn cao nhất
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs text-slate-600">
                    <p><strong>Tài khoản mặc định:</strong> <code>admin</code> / Mật khẩu: <code>admin123</code></p>
                    <ul className="list-disc list-inside space-y-1 text-slate-700">
                      <li>Xem toàn cảnh <strong>Dashboard Nghiên cứu</strong> (Tiến độ 40 hộ, Biểu đồ CWM, Phân tích rào cản).</li>
                      <li>Vào mục <strong>Cài đặt hệ thống</strong> để tải file mẫu Excel và nạp danh sách Hộ / Cán bộ nghiên cứu.</li>
                      <li>Phân quyền, khóa/mở khóa tài khoản, cấp lại mật khẩu cho thành viên.</li>
                      <li>Mở khóa phiếu khảo sát (BC01-BC07) khi NCV cần chỉnh sửa sai sót có lý do hợp lệ.</li>
                      <li>Kết nối và giám sát đồng bộ 17 Sheets lên Google Sheets đám mây.</li>
                    </ul>
                  </div>
                </div>

                {/* 2. SUPERVISOR */}
                <div className="bg-white p-5 rounded-2xl border-2 border-indigo-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-indigo-100 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-700 text-white flex items-center justify-center font-bold text-sm">
                        🎓
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-sm">2. Người hướng dẫn khoa học</h4>
                        <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-full">
                          Giám sát & Đánh giá
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs text-slate-600">
                    <p><strong>Tài khoản:</strong> Do Admin tạo trong Quản lý tài khoản hoặc nạp từ Sheet Cán bộ.</p>
                    <ul className="list-disc list-inside space-y-1 text-slate-700">
                      <li>Truy cập Dashboard để theo dõi tỷ lệ hoàn thành khảo sát theo thời gian thực.</li>
                      <li>Xem chi tiết từng phiếu khảo sát của 40 hộ nhưng không trực tiếp sửa đổi để giữ tính khách quan.</li>
                      <li>Xem phân tích thống kê so sánh hiệu quả giữa nhóm Can thiệp (TN) và nhóm Đối chứng (ĐC).</li>
                      <li>Kiểm tra nhật ký hệ thống (Audit Log) để đảm bảo tính minh bạch và liêm chính dữ liệu.</li>
                    </ul>
                  </div>
                </div>

                {/* 3. RESEARCHER */}
                <div className="bg-white p-5 rounded-2xl border-2 border-blue-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-blue-100 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold text-sm">
                        🔬
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-sm">3. Nghiên cứu viên thực địa</h4>
                        <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-full">
                          Thu thập dữ liệu
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs text-slate-600">
                    <p><strong>Tài khoản:</strong> Do Admin cấp, mật khẩu ban đầu: <code>123456</code>.</p>
                    <ul className="list-disc list-inside space-y-1 text-slate-700">
                      <li>Đi thực địa từng hộ, phỏng vấn và nhập liệu phiếu BC-01, BC-02, BC-03.</li>
                      <li>Trực tiếp quan sát chuồng trại và chấm điểm <strong>BC-04 Quan sát CWM</strong> (tuyệt đối không cho hộ tự chấm).</li>
                      <li>Hướng dẫn hộ nhóm TN đăng nhập ứng dụng và ký Cam kết xanh BC-05.</li>
                      <li>Hỗ trợ, đôn đốc các hộ nộp báo cáo tuần W1-W6 qua ứng dụng.</li>
                      <li>Tiến hành khảo sát hậu can thiệp BC-07 và BC-04 Sau khi kết thúc 6 tuần.</li>
                    </ul>
                  </div>
                </div>

                {/* 4. HOUSEHOLD */}
                <div className="bg-white p-5 rounded-2xl border-2 border-emerald-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-100 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-sm">
                        🏡
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-sm">4. Hộ chăn nuôi (Nhóm TN & ĐC)</h4>
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                          Cổng thông tin Hộ
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs text-slate-600">
                    <p><strong>Tên đăng nhập:</strong> Nhập mã hộ viết thường (ví dụ: <code>h01</code>, <code>h02</code>...) hoặc Số ĐT / <strong>Mật khẩu:</strong> <code>123456</code>.</p>
                    <ul className="list-disc list-inside space-y-1 text-slate-700">
                      <li>Sau khi đăng nhập, hệ thống hiển thị <strong>Cổng thông tin dành riêng cho Hộ</strong>.</li>
                      <li><strong>Đối với nhóm TN:</strong> Ký xác nhận Cam kết xanh (BC-05), hàng tuần vào nộp báo cáo thực hiện 6 hành vi (W1-W6), ghi nhận khó khăn / rào cản.</li>
                      <li>Xem sổ tay kỹ thuật xử lý phân chuồng (ủ compost, vận hành biogas).</li>
                      <li>Nhận thông báo nhắc nhở từ Ban nghiên cứu và có thể tự đổi mật khẩu tài khoản.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MODULES BC01-BC08 */}
          {activeTab === 'MODULES' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 flex items-start space-x-2.5">
                <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <span>
                  Hệ thống chuẩn hóa 8 biểu mẫu nghiên cứu khoa học liên thông dữ liệu hoàn toàn. Khi nhập dữ liệu ở bất kỳ phiếu nào, bảng tổng hợp <strong>BC-08</strong> và biểu đồ trên <strong>Dashboard</strong> sẽ tự động cập nhật ngay lập tức.
                </span>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">BC-01: Hồ sơ Thông tin Hộ chăn nuôi</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Thu thập 10 chỉ tiêu nhân khẩu, loại vật nuôi, quy mô đàn, số năm chăn nuôi, phương thức xả thải hiện tại.</p>
                  </div>
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-lg shrink-0 w-fit">Bước tiền can thiệp</span>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">BC-02: Khảo sát KAP trước can thiệp (Kiến thức - Thái độ - Thực hành)</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">10 câu trắc nghiệm Kiến thức (thang 0-10đ), 5 câu Thái độ Likert 1-5 (thang 5-25đ) và 6 hành vi Thực hành tự báo cáo (0-6đ).</p>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-lg shrink-0 w-fit">Baseline KAP</span>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">BC-03: Ý định thay đổi hành vi trước can thiệp</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">5 câu hỏi thang đo Likert 1-5 đo lường mức độ sẵn sàng, cam kết trách nhiệm và ý định duy trì hành vi xử lý phân chuồng sạch.</p>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-lg shrink-0 w-fit">Ý định trước can thiệp</span>
                </div>

                <div className="p-3.5 bg-white rounded-xl border-2 border-emerald-400 bg-emerald-50/30 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-emerald-950 text-xs sm:text-sm">BC-04: Quan sát thực địa hành vi CWM (Trước & Sau can thiệp)</span>
                    <p className="text-[11px] text-emerald-900 mt-0.5">Thang đo khách quan 0 đến 6 điểm đo lường 6 hành vi thực tế tại chuồng trại. Có chụp ảnh bằng chứng và lý do không đạt.</p>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-700 text-white text-[10px] font-extrabold rounded-lg shrink-0 w-fit">TRỌNG TÂM ĐỀ TÀI</span>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">BC-05: Xác nhận "Cam kết xanh" tại nguồn</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Dành riêng cho 20 hộ nhóm Thực nghiệm (TN). Cam kết thực hiện 6 hành vi xử lý chất thải sạch và nộp báo cáo tuần đúng hạn.</p>
                  </div>
                  <span className="px-2.5 py-1 bg-purple-100 text-purple-800 text-[10px] font-bold rounded-lg shrink-0 w-fit">Dành riêng Nhóm TN</span>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">BC-06: Theo dõi hành vi hằng tuần (W1 – W6)</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Thu thập điểm tuần (0-6đ) qua 6 tuần can thiệp, thống kê các rào cản và khó khăn thực tế hộ chăn nuôi gặp phải.</p>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-lg shrink-0 w-fit">Giám sát 6 tuần</span>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">BC-07: Khảo sát sau can thiệp (Endline KAP & Cảm nhận)</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Đo lường hành vi thực hành sau can thiệp, tỷ lệ sẵn sàng duy trì hành vi lâu dài và thu nhận ý kiến đóng góp của hộ.</p>
                  </div>
                  <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded-lg shrink-0 w-fit">Đánh giá kết quả</span>
                </div>

                <div className="p-3.5 bg-white rounded-xl border-2 border-teal-500 bg-teal-50/40 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-teal-950 text-xs sm:text-sm">BC-08: Bảng tổng hợp nghiên cứu & Phân tích ΔCWM</span>
                    <p className="text-[11px] text-teal-900 mt-0.5">Tổng hợp trọn vẹn mọi chỉ số (K, T, YĐ, CWM Trước, CWM Sau, ΔCWM, W1–W6), sẵn sàng kiểm định thống kê và nghiệm thu.</p>
                  </div>
                  <span className="px-2.5 py-1 bg-teal-800 text-white text-[10px] font-extrabold rounded-lg shrink-0 w-fit">BẢNG TỔNG HỢP TRUNG TÂM</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CWM CRITERIA (0-6 POINTS) */}
          {activeTab === 'CWM' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-xs text-amber-900">
                <div className="flex items-center space-x-2 font-bold mb-1">
                  <Award className="w-4 h-4 text-amber-700" />
                  <span>NGUYÊN TẮC CHẤM ĐIỂM CHUẨN KHOA HỌC THANG ĐO CWM (0 – 6 ĐIỂM):</span>
                </div>
                <p className="text-amber-800 leading-relaxed">
                  • <strong>Quan sát thực địa độc lập:</strong> Điểm CWM do Nghiên cứu viên hoặc Admin trực tiếp đến quan sát tại khuôn viên chuồng nuôi của từng hộ.<br/>
                  • <strong>Quy chuẩn nhị phân (Binary Scoring):</strong> Mỗi tiêu chí chỉ cho 1 điểm (Đạt chuẩn) hoặc 0 điểm (Không đạt chuẩn). Tuyệt đối không cho điểm lẻ (0.5).<br/>
                  • <strong>Bằng chứng thực tế:</strong> Tiêu chí đạt phải có ảnh chụp hoặc mô tả kiểm chứng. Tiêu chí không đạt phải nêu rõ rào cản nguyên nhân.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {CWM_CRITERIA_GUIDE.map((c) => (
                  <div key={c.code} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
                    <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
                      <span className="w-7 h-7 rounded-lg bg-emerald-700 text-white font-black text-xs flex items-center justify-center shrink-0">
                        {c.code}
                      </span>
                      <h5 className="font-bold text-slate-900 text-xs sm:text-sm">{c.title}</h5>
                    </div>
                    <div className="text-xs space-y-1.5">
                      <p><strong className="text-slate-700">Định nghĩa:</strong> <span className="text-slate-600">{c.definition}</span></p>
                      <p className="text-emerald-800 bg-emerald-50/80 p-2 rounded-lg border border-emerald-200">
                        <strong>✓ Đạt (1 điểm):</strong> {c.passCriteria}
                      </p>
                      <p className="text-red-800 bg-red-50/80 p-2 rounded-lg border border-red-200">
                        <strong>✗ Không đạt (0 điểm):</strong> {c.failCriteria}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: EXCEL & GOOGLE SHEETS */}
          {activeTab === 'EXCEL_SHEETS' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <h4 className="font-black text-slate-900 text-sm flex items-center space-x-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                  <span>1. Khởi tạo & Nhập liệu từ file Excel chuẩn</span>
                </h4>
                <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                  <p>
                    Toàn bộ tính năng nhập liệu Excel đã được di chuyển vào menu <strong>Cài đặt hệ thống</strong> để giữ giao diện Dashboard tinh gọn chuẩn khoa học.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-900 block">File mẫu Hộ chăn nuôi (.xlsx)</span>
                      <span className="text-[11px] text-slate-500">Gồm mã hộ (H01-H40), tên đại diện, SĐT, quy mô đàn, nhóm (TN hoặc ĐC).</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-900 block">File mẫu Cán bộ & Nghiên cứu (.xlsx)</span>
                      <span className="text-[11px] text-slate-500">Gồm danh sách Người hướng dẫn, Nghiên cứu viên và phân quyền đăng nhập.</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                    💡 Khi nhập file Excel, hệ thống có cửa sổ <strong>Xem trước (Preview)</strong> và tự động kiểm tra tính hợp lệ của từng dòng dữ liệu trước khi nạp vào cơ sở dữ liệu.
                  </p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <h4 className="font-black text-slate-900 text-sm flex items-center space-x-2">
                  <Cloud className="w-4 h-4 text-emerald-700" />
                  <span>2. Cơ chế Tự động lưu Đám mây & Đồng bộ Google Sheets</span>
                </h4>
                <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                  <p>
                    • <strong>Tự động lưu vĩnh viễn trên Cloud Server:</strong> Ứng dụng tích hợp máy chủ đám mây. Mỗi khi tạo tài khoản, thêm hộ chăn nuôi, hay nộp phiếu khảo sát, hệ thống sẽ <strong>tự động lưu ngay lập tức</strong> mà không cần người dùng phải bấm nút hay yêu cầu thủ công.
                  </p>
                  <p>
                    • <strong>Đồng bộ ngầm lên Google Sheets (17 Sheet chuẩn):</strong> Sau mỗi thao tác cập nhật dữ liệu, ứng dụng sẽ tự động kích hoạt đẩy sang Google Sheets qua Google Apps Script Web App.
                  </p>
                  <p>
                    • <strong>Không lo mất tài khoản khi đổi thiết bị:</strong> Khi bạn đăng nhập từ máy tính mới, điện thoại mới hoặc sau khi xóa cache trình duyệt, ứng dụng sẽ <strong>tự động tải lại 100% tài khoản và dữ liệu từ máy chủ đám mây</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: FAQ & TROUBLESHOOTING */}
          {activeTab === 'FAQ' && (
            <div className="space-y-3.5 animate-in fade-in">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                <h5 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center space-x-2">
                  <Key className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Tài khoản và mật khẩu mặc định của các đối tượng là gì?</span>
                </h5>
                <div className="text-xs text-slate-600 pl-6 space-y-1">
                  <p>• <strong>Quản trị viên (Admin):</strong> Tên đăng nhập <code>admin</code> / Mật khẩu: <code>admin123</code></p>
                  <p>• <strong>Hộ chăn nuôi:</strong> Tên đăng nhập là mã hộ viết thường (ví dụ: <code>h01</code>, <code>h02</code>...) hoặc Số điện thoại của hộ / Mật khẩu mặc định: <code>123456</code></p>
                  <p>• <strong>Nghiên cứu viên:</strong> Do Admin tạo trong mục Quản lý tài khoản hoặc nạp từ file Excel / Mật khẩu mặc định: <code>123456</code></p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                <h5 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center space-x-2">
                  <Wifi className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Khi đi thực địa ở khu vực chuồng trại không có mạng Internet có dùng được không?</span>
                </h5>
                <p className="text-xs text-slate-600 pl-6 leading-relaxed">
                  <strong>Hoàn toàn dùng được bình thường!</strong> Ứng dụng được thiết kế theo kiến trúc <em>Offline-First (Cục bộ ưu tiên)</em>. Nghiên cứu viên vẫn mở app, nhập phiếu khảo sát, chụp ảnh bình thường. Khi thiết bị kết nối lại Wifi/4G, hệ thống sẽ tự động đồng bộ toàn bộ dữ liệu vừa nhập lên Cloud Server và Google Sheets.
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                <h5 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center space-x-2">
                  <Database className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Dữ liệu tạo tài khoản mới có bị mất khi tắt máy hoặc tải lại trang không?</span>
                </h5>
                <p className="text-xs text-slate-600 pl-6 leading-relaxed">
                  <strong>Không bao giờ bị mất!</strong> Mọi tài khoản và hồ sơ tạo mới đều được lưu đồng thời vào bộ nhớ trình duyệt, cơ sở dữ liệu Cloud Server và truyền tới Google Sheets. Khi bạn tải lại trang hoặc mở trên thiết bị khác, hệ thống sẽ tự động khôi phục toàn bộ danh sách tài khoản từ máy chủ.
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                <h5 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center space-x-2">
                  <HelpCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Hộ chăn nuôi quên mật khẩu thì xử lý như thế nào?</span>
                </h5>
                <p className="text-xs text-slate-600 pl-6 leading-relaxed">
                  Quản trị viên (Admin) chỉ cần đăng nhập tài khoản Admin, vào menu <strong>Quản lý Cán bộ & Tài khoản</strong>, tìm tên hộ chăn nuôi và bấm nút <strong>Đặt lại mật khẩu</strong>. Mật khẩu mới sẽ được mã hóa an toàn và có hiệu lực ngay lập tức.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-slate-200 px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-500">
            Hệ thống Quản lý Nghiên cứu Khoa học • NCKH 2026 • Phiên bản v2.6 Chuẩn hóa
          </div>
          <div className="flex items-center space-x-2 justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              Đã hiểu & Đóng hướng dẫn
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
