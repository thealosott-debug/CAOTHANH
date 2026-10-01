import React, { useState } from 'react';
import {
  TableProperties,
  Download,
  Filter,
  Search,
  CheckCircle,
  Clock,
  Sparkles,
  TrendingUp,
  ArrowUpDown,
} from 'lucide-react';
import { StorageService } from '../services/storage';
import { ExportService } from '../services/exportService';
import { BC08Record, StudyGroup } from '../types';

export const ModuleBC08: React.FC = () => {
  const [filterGroup, setFilterGroup] = useState<StudyGroup | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof BC08Record>('householdId');
  const [sortAsc, setSortAsc] = useState(true);

  const summaryData = StorageService.generateBC08Summary();

  const filtered = summaryData.filter((item) => {
    const matchesGroup = filterGroup === 'ALL' || item.group === filterGroup;
    const matchesSearch =
      item.householdId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.representativeName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  // Sắp xếp
  const sorted = [...filtered].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (aVal === null || aVal === undefined) aVal = -999;
    if (bVal === null || bVal === undefined) bVal = -999;

    if (aVal < bVal) return sortAsc ? -1 : 1;
    if (aVal > bVal) return sortAsc ? 1 : -1;
    return 0;
  });

  const handleSort = (field: keyof BC08Record) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <TableProperties className="w-6 h-6 text-emerald-600" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              MODULE BC-08: BẢNG TỔNG HỢP DỮ LIỆU NGHIÊN CỨU
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Mỗi hộ một dòng • Tự động tính toán K, T, YĐ, HT, CWM trước/sau và ΔCWM = CWM sau – CWM trước
          </p>
        </div>

        <button
          onClick={() => ExportService.exportBC08(filterGroup)}
          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center space-x-2 transition-colors shadow-xs"
        >
          <Download className="w-4 h-4" />
          <span>XUẤT FILE EXCEL / CSV</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã hộ (H01..) hoặc họ tên..."
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-700">LỌC THEO NHÓM:</span>
          <select
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value as any)}
            className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white font-bold"
          >
            <option value="ALL">Tất cả (40 hộ)</option>
            <option value="TN">Nhóm Can thiệp (TN - 20 hộ)</option>
            <option value="DC">Nhóm Đối chứng (ĐC - 20 hộ)</option>
          </select>
        </div>
      </div>

      {/* The Central Master Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-900 text-slate-200 uppercase font-extrabold text-[11px] border-b border-slate-800">
              <tr>
                <th
                  onClick={() => handleSort('householdId')}
                  className="py-3 px-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center space-x-1">
                    <span>Mã hộ</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3">Họ và tên</th>
                <th
                  onClick={() => handleSort('group')}
                  className="py-3 px-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center space-x-1">
                    <span>Nhóm</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('scoreK_Pre')}
                  className="py-3 px-3 text-center cursor-pointer hover:text-white"
                  title="Điểm kiến thức trước (0-10)"
                >
                  K trước
                </th>
                <th
                  onClick={() => handleSort('scoreT_Pre')}
                  className="py-3 px-3 text-center cursor-pointer hover:text-white"
                  title="Điểm thái độ trước (Likert 1-5)"
                >
                  T trước
                </th>
                <th
                  onClick={() => handleSort('scoreYD_Pre')}
                  className="py-3 px-3 text-center cursor-pointer hover:text-white"
                  title="Điểm ý định trước (Likert 1-5)"
                >
                  YĐ trước
                </th>
                <th
                  onClick={() => handleSort('scoreHT_Pre')}
                  className="py-3 px-3 text-center cursor-pointer hover:text-white"
                  title="Hành vi tự báo cáo trước (0-6)"
                >
                  HT trước
                </th>
                <th
                  onClick={() => handleSort('scoreCWM_Pre')}
                  className="py-3 px-3 text-center bg-slate-800 text-emerald-300 font-extrabold cursor-pointer hover:text-white"
                  title="Quan sát thực tế CWM trước (0-6)"
                >
                  CWM trước
                </th>
                <th
                  onClick={() => handleSort('scoreHT_Post')}
                  className="py-3 px-3 text-center cursor-pointer hover:text-white"
                  title="Hành vi tự báo cáo sau (0-6)"
                >
                  HT sau
                </th>
                <th
                  onClick={() => handleSort('scoreCWM_Post')}
                  className="py-3 px-3 text-center bg-slate-800 text-emerald-300 font-extrabold cursor-pointer hover:text-white"
                  title="Quan sát thực tế CWM sau (0-6)"
                >
                  CWM sau
                </th>
                <th
                  onClick={() => handleSort('deltaCWM')}
                  className="py-3 px-4 text-center bg-emerald-900 text-amber-300 font-black cursor-pointer hover:text-white"
                  title="Biến thiên hành vi ΔCWM = CWM sau - CWM trước"
                >
                  ΔCWM
                </th>
                <th className="py-3 px-2 text-center text-[10px]">W1</th>
                <th className="py-3 px-2 text-center text-[10px]">W2</th>
                <th className="py-3 px-2 text-center text-[10px]">W3</th>
                <th className="py-3 px-2 text-center text-[10px]">W4</th>
                <th className="py-3 px-2 text-center text-[10px]">W5</th>
                <th className="py-3 px-2 text-center text-[10px]">W6</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={17} className="text-center py-8 text-slate-400">
                    Không có dữ liệu phù hợp.
                  </td>
                </tr>
              ) : (
                sorted.map((item) => {
                  const isTN = item.group === 'TN';
                  const delta = item.deltaCWM;

                  return (
                    <tr
                      key={item.householdId}
                      className="hover:bg-emerald-50/40 transition-colors"
                    >
                      <td className="py-2.5 px-3 font-extrabold text-slate-900">
                        {item.householdId}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800 truncate max-w-[130px]">
                        {item.representativeName}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            isTN
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-teal-100 text-teal-800'
                          }`}
                        >
                          {item.group}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">{item.scoreK_Pre ?? '-'}</td>
                      <td className="py-2.5 px-3 text-center">{item.scoreT_Pre ?? '-'}</td>
                      <td className="py-2.5 px-3 text-center">{item.scoreYD_Pre ?? '-'}</td>
                      <td className="py-2.5 px-3 text-center">{item.scoreHT_Pre ?? '-'}</td>
                      <td className="py-2.5 px-3 text-center font-bold bg-slate-50 text-slate-900">
                        {item.scoreCWM_Pre ?? '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center">{item.scoreHT_Post ?? '-'}</td>
                      <td className="py-2.5 px-3 text-center font-bold bg-slate-50 text-emerald-800">
                        {item.scoreCWM_Post ?? '-'}
                      </td>
                      <td
                        className={`py-2.5 px-4 text-center font-black text-sm ${
                          delta === null
                            ? 'text-slate-400'
                            : delta > 0
                            ? 'bg-emerald-50 text-emerald-700'
                            : delta === 0
                            ? 'text-slate-600'
                            : 'bg-red-50 text-red-600'
                        }`}
                      >
                        {delta !== null ? (delta > 0 ? `+${delta}` : delta) : '-'}
                      </td>
                      {/* 6 tuần W1-W6 */}
                      <td className="py-2.5 px-2 text-center text-[11px] text-slate-600">
                        {item.w1_score ?? '-'}
                      </td>
                      <td className="py-2.5 px-2 text-center text-[11px] text-slate-600">
                        {item.w2_score ?? '-'}
                      </td>
                      <td className="py-2.5 px-2 text-center text-[11px] text-slate-600">
                        {item.w3_score ?? '-'}
                      </td>
                      <td className="py-2.5 px-2 text-center text-[11px] text-slate-600">
                        {item.w4_score ?? '-'}
                      </td>
                      <td className="py-2.5 px-2 text-center text-[11px] text-slate-600">
                        {item.w5_score ?? '-'}
                      </td>
                      <td className="py-2.5 px-2 text-center text-[11px] text-slate-600">
                        {item.w6_score ?? '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
