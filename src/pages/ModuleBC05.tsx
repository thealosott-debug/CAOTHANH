import React, { useState } from 'react';
import { Sparkles, CheckCircle, ShieldCheck, Clock, Users, Check, AlertCircle } from 'lucide-react';
import { BC05Record, User } from '../types';
import { StorageService } from '../services/storage';

interface ModuleBC05Props {
  currentUser: User;
  onRefreshData?: () => void;
}

export const ModuleBC05: React.FC<ModuleBC05Props> = ({ currentUser, onRefreshData }) => {
  const households = StorageService.getHouseholds();
  const tnHouseholds = households.filter((h) => h.group === 'TN');
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string>(tnHouseholds[0]?.id || 'H01');

  const bc05List = StorageService.getBC05List();
  const currentRecord = bc05List.find((b) => b.householdId === selectedHouseholdId);
  const selectedH = households.find((h) => h.id === selectedHouseholdId);

  const [message, setMessage] = useState('');

  const handleConfirmForHousehold = () => {
    const list = StorageService.getBC05List().filter((b) => b.householdId !== selectedHouseholdId);
    const newRecord: BC05Record = {
      id: `BC05_${selectedHouseholdId}`,
      householdId: selectedHouseholdId,
      commitments: {
        b1_thuGom: true,
        b2_phanLoai: true,
        b3_luuChua: true,
        b4_khongXaThang: true,
        b5_xuLyTaiSuDung: true,
        b6_veSinh: true,
        b7_baoCaoHangTuan: true,
      },
      confirmed: true,
      confirmedAt: new Date().toISOString(),
      confirmedBy: selectedH?.representativeName || currentUser.fullName,
      version: '1.0-CHÍNH THỨC',
      createdAt: new Date().toISOString(),
    };

    list.push(newRecord);
    StorageService.saveBC05List(list);

    StorageService.addAuditLog({
      userId: currentUser.id,
      username: currentUser.username,
      userRole: currentUser.role,
      action: 'UPDATE',
      targetModule: 'BC05_CAM_KET',
      householdId: selectedHouseholdId,
      reason: `Nghiên cứu viên / Admin xác nhận Cam kết xanh cho hộ ${selectedHouseholdId}.`,
    });

    setMessage(`Đã xác nhận Cam kết xanh cho hộ ${selectedHouseholdId}!`);
    setTimeout(() => {
      setMessage('');
      if (onRefreshData) onRefreshData();
    }, 2000);
  };

  const confirmedCount = tnHouseholds.filter((h) =>
    bc05List.some((b) => b.householdId === h.id && b.confirmed)
  ).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-6 h-6 text-amber-500" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              MODULE BC-05: QUẢN LÝ PHIẾU "CAM KẾT XANH"
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Chỉ áp dụng cho 20 hộ Nhóm Can thiệp (TN) • Cốt lõi của mô hình can thiệp tâm lý - xã hội học
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-amber-50 px-4 py-2 rounded-xl border border-amber-200">
          <ShieldCheck className="w-5 h-5 text-amber-600" />
          <div className="text-xs">
            <span className="text-slate-500">Đã ký cam kết: </span>
            <strong className="text-amber-900 text-sm font-black">
              {confirmedCount} / {tnHouseholds.length} hộ
            </strong>
          </div>
        </div>
      </div>

      {message && (
        <div className="p-3.5 bg-emerald-600 text-white rounded-xl text-xs font-bold text-center animate-in fade-in">
          ✓ {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Danh sách 20 hộ nhóm TN */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
          <h2 className="text-xs font-extrabold uppercase text-slate-700 tracking-wider">
            DANH SÁCH 20 HỘ NHÓM TN
          </h2>
          <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
            {tnHouseholds.map((h) => {
              const isSigned = bc05List.some(
                (b) => b.householdId === h.id && b.confirmed
              );
              const isSelected = selectedHouseholdId === h.id;

              return (
                <button
                  key={h.id}
                  onClick={() => setSelectedHouseholdId(h.id)}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between text-xs ${
                    isSelected
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <div>
                    <span className="font-extrabold mr-1.5">{h.id}:</span>
                    <span className="font-semibold">{h.representativeName}</span>
                  </div>
                  {isSigned ? (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        isSelected ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      ✓ Đã ký
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded-md">
                      Chưa ký
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Chi tiết phiếu cam kết của hộ đang chọn */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900">
                PHIẾU CAM KẾT XANH: HỘ {selectedHouseholdId}
              </h2>
              <p className="text-xs text-slate-500">
                Chủ hộ: <strong>{selectedH?.representativeName}</strong> • {selectedH?.phone} • {selectedH?.address}
              </p>
            </div>

            {currentRecord?.confirmed ? (
              <span className="bg-emerald-100 text-emerald-800 font-bold text-xs px-3 py-1 rounded-full border border-emerald-300">
                ĐÃ XÁC NHẬN
              </span>
            ) : (
              <span className="bg-amber-100 text-amber-800 font-bold text-xs px-3 py-1 rounded-full border border-amber-300">
                CHƯA XÁC NHẬN
              </span>
            )}
          </div>

          {/* Nội dung bản cam kết chuẩn */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 text-xs text-slate-700">
            <p className="font-serif italic text-slate-800 text-sm leading-relaxed border-l-4 border-emerald-600 pl-3">
              “Tôi cam kết thực hiện đầy đủ các hành vi quản lý chất thải chăn nuôi tại nguồn phù hợp trong suốt thời gian tham gia chương trình nghiên cứu vì môi trường sống trong lành và sự phát triển bền vững của địa phương.”
            </p>

            <div className="space-y-2 pt-2">
              {[
                { title: '1. Thu gom chất thải đúng cách', desc: 'Dọn sạch phân định kỳ hàng ngày, không để tràn ra ngoài chuồng.' },
                { title: '2. Phân loại chất thải tại nguồn', desc: 'Có xô/thùng riêng cho rác thải thuốc thú y nguy hại (vỏ chai, kim tiêm).' },
                { title: '3. Duy trì nơi lưu chứa phù hợp', desc: 'Hố ủ, nhà chứa phân có mái che hoặc bạt phủ chống ngấm nước mưa.' },
                { title: '4. Không xả trực tiếp ra môi trường', desc: 'Tuyệt đối không xả phân tươi và nước rửa chuồng chưa xử lý ra kênh mương.' },
                { title: '5. Thực hiện xử lý / tái sử dụng phù hợp', desc: 'Ứng dụng hầm biogas sinh khí đun nấu hoặc ủ men vi sinh bón cây.' },
                { title: '6. Duy trì vệ sinh khu vực chăn nuôi', desc: 'Rắc vôi khử trùng, phun thuốc sát khuẩn định kỳ, kiểm soát mùi hôi.' },
                { title: '7. Thực hiện báo cáo hằng tuần', desc: 'Cập nhật tình hình và ghi nhận khó khăn qua ứng dụng điện thoại mỗi tuần.' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white rounded-xl border border-slate-200 flex items-start space-x-2.5"
                >
                  <div className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 font-bold text-xs">
                    ✓
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">{item.title}: </span>
                    <span className="text-slate-600">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>

            {currentRecord?.confirmed && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs">
                <div>
                  <strong>Thời điểm ký xác nhận:</strong>{' '}
                  {new Date(currentRecord.confirmedAt || '').toLocaleString('vi-VN')}
                </div>
                <div>
                  <strong>Người xác nhận:</strong> {currentRecord.confirmedBy} (Phiên bản {currentRecord.version})
                </div>
              </div>
            )}
          </div>

          {/* Action button */}
          {!currentRecord?.confirmed && (
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleConfirmForHousehold}
                className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center space-x-2 transition-all shadow-md"
              >
                <CheckCircle className="w-4 h-4" />
                <span>XÁC NHẬN CAM KẾT CHO HỘ NÀY</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
