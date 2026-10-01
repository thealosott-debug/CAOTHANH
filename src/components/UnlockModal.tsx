import React, { useState } from 'react';
import { X, Lock, Unlock, AlertTriangle } from 'lucide-react';

interface UnlockModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export const UnlockModal: React.FC<UnlockModalProps> = ({
  isOpen,
  title,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Bắt buộc phải nhập lý do mở khóa để lưu vào Nhật ký thao tác (Audit Log).');
      return;
    }
    if (reason.trim().length < 8) {
      setError('Vui lòng mô tả lý do rõ ràng (tối thiểu 8 ký tự).');
      return;
    }
    setError('');
    onConfirm(reason.trim());
    setReason('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-150">
        <div className="bg-amber-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Lock className="w-5 h-5" />
            <h3 className="font-bold text-lg">Yêu cầu Mở khóa Dữ liệu</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-amber-700 rounded-lg text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start space-x-2 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Bảo toàn liêm chính dữ liệu nghiên cứu:</p>
              <p>
                Dữ liệu sau khi xác nhận đã được khóa. Việc mở khóa để chỉnh sửa sẽ được ghi nhận vào <strong>AUDIT_LOG</strong> với đầy đủ thông tin: Người mở khóa, thời gian, và lý do điều chỉnh.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ĐỐI TƯỢNG MỞ KHÓA:
            </label>
            <p className="text-sm font-medium text-slate-900 bg-slate-100 px-3 py-2 rounded-lg">
              {title}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              LÝ DO MỞ KHÓA / ĐIỀU CHỈNH <span className="text-red-500">*</span>:
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              placeholder="Ví dụ: Đính chính lại điểm tiêu chí B2 do có ảnh minh chứng bổ sung từ thực địa..."
              className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
            {error && <p className="text-red-600 text-xs mt-1 font-medium">{error}</p>}
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-medium bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors flex items-center space-x-2 shadow-xs"
            >
              <Unlock className="w-4 h-4" />
              <span>Xác nhận Mở khóa</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
