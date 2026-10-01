import React from 'react';
import { X, BookOpen, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { CWM_CRITERIA_GUIDE } from '../config/initialData';

interface CwmGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CwmGuideModal: React.FC<CwmGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-emerald-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BookOpen className="w-6 h-6 text-emerald-300" />
            <div>
              <h2 className="text-xl font-bold">SỔ TAY HƯỚNG DẪN CHẤM ĐIỂM CWM</h2>
              <p className="text-xs text-emerald-200">
                Thang đo Quản lý Chất thải Chăn nuôi Sạch (Clean Waste Management - Thang 0 đến 6 điểm)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-emerald-700 transition-colors text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">Quy tắc đạo đức và tính khách quan nghiên cứu:</p>
              <p className="text-amber-800 text-xs mt-1">
                Điểm CWM là chỉ số quan sát thực địa khách quan do Nghiên cứu viên hoặc Admin trực tiếp đánh giá tại chuồng nuôi. Tuyệt đối không cho hộ chăn nuôi tự chấm. Mỗi tiêu chí chỉ cho điểm 1 (Đạt) hoặc 0 (Không đạt).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CWM_CRITERIA_GUIDE.map((item) => (
              <div
                key={item.code}
                className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 hover:bg-white hover:border-emerald-500 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 mb-3">
                    <span className="w-8 h-8 rounded-lg bg-emerald-700 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                      {item.code}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base">{item.title}</h3>
                  </div>

                  <p className="text-slate-600 mb-3 italic text-xs leading-relaxed">
                    <strong className="text-slate-700 not-italic">Định nghĩa:</strong> {item.definition}
                  </p>

                  <div className="space-y-2 mb-3">
                    <div className="bg-emerald-50 rounded-lg p-2.5 border border-emerald-100 flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-emerald-800 text-xs">Đạt (1 điểm): </span>
                        <span className="text-emerald-950 text-xs">{item.passCriteria}</span>
                      </div>
                    </div>

                    <div className="bg-red-50 rounded-lg p-2.5 border border-red-100 flex items-start space-x-2">
                      <X className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-red-800 text-xs">Không đạt (0 điểm): </span>
                        <span className="text-red-950 text-xs">{item.failCriteria}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-100 rounded-lg p-2 text-xs text-slate-600 flex items-start space-x-1.5 mt-2">
                  <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Mẹo quan sát:</strong> {item.notes}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-6 py-3.5 flex justify-end border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-700 text-white font-medium rounded-xl hover:bg-emerald-800 transition-colors shadow-xs"
          >
            Đã hiểu hướng dẫn
          </button>
        </div>
      </div>
    </div>
  );
};
