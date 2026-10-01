/**
 * Dịch vụ xuất dữ liệu nghiên cứu (CSV UTF-8 BOM và Excel thân thiện)
 * Đảm bảo hiển thị tiếng Việt có dấu chuẩn xác 100% trong Microsoft Excel
 */

import { StorageService } from './storage';
import { StudyGroup } from '../types';

export class ExportService {
  /**
   * Tải tệp CSV với UTF-8 BOM xuống máy
   */
  private static downloadCsv(filename: string, rows: (string | number | boolean | null | undefined)[][]): void {
    const csvContent = rows
      .map(row =>
        row
          .map(cell => {
            if (cell === null || cell === undefined) return '""';
            const str = String(cell).replace(/"/g, '""');
            return `"${str}"`;
          })
          .join(',')
      )
      .join('\r\n');

    // Thêm UTF-8 BOM (\uFEFF) để Excel nhận diện chuẩn tiếng Việt
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * 1. Xuất BC-08 Tổng hợp
   */
  static exportBC08(filterGroup?: StudyGroup | 'ALL'): void {
    const summary = StorageService.generateBC08Summary();
    const filtered = filterGroup && filterGroup !== 'ALL'
      ? summary.filter(s => s.group === filterGroup)
      : summary;

    const rows: any[][] = [
      ['MÃ HỘ', 'HỌ VÀ TÊN ĐẠI DIỆN', 'NHÓM', 'K TRƯỚC (0-10)', 'T TRƯỚC (1-5)', 'YĐ TRƯỚC (1-5)', 'HT TRƯỚC (0-6)', 'CWM TRƯỚC (0-6)', 'HT SAU (0-6)', 'CWM SAU (0-6)', 'ΔCWM', 'W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'TRẠNG THÁI'],
      ...filtered.map(s => [
        s.householdId,
        s.representativeName,
        s.group === 'TN' ? 'Can thiệp (TN)' : 'Đối chứng (ĐC)',
        s.scoreK_Pre ?? 'N/A',
        s.scoreT_Pre ?? 'N/A',
        s.scoreYD_Pre ?? 'N/A',
        s.scoreHT_Pre ?? 'N/A',
        s.scoreCWM_Pre ?? 'N/A',
        s.scoreHT_Post ?? 'N/A',
        s.scoreCWM_Post ?? 'N/A',
        s.deltaCWM !== null ? (s.deltaCWM > 0 ? `+${s.deltaCWM}` : s.deltaCWM) : 'N/A',
        s.w1_score ?? '',
        s.w2_score ?? '',
        s.w3_score ?? '',
        s.w4_score ?? '',
        s.w5_score ?? '',
        s.w6_score ?? '',
        s.status === 'COMPLETED' ? 'Hoàn thành' : 'Đang tiến hành'
      ])
    ];

    const timestamp = new Date().toISOString().slice(0, 10);
    this.downloadCsv(`BC08_TONG_HOP_NGHIEN_CUU_${filterGroup || 'ALL'}_${timestamp}.csv`, rows);
  }

  /**
   * 2. Xuất Dữ liệu Khảo sát (BC-02 & BC-07)
   */
  static exportSurveys(): void {
    const bc02 = StorageService.getBC02List();
    const bc07 = StorageService.getBC07List();
    const households = StorageService.getHouseholds();

    const rows: any[][] = [
      [
        'MÃ HỘ', 'HỌ TÊN', 'NHÓM',
        'K TRƯỚC', 'T TRƯỚC', 'HT TRƯỚC',
        'B1_THU_GOM_PRE', 'B2_PHAN_LOAI_PRE', 'B3_LUU_CHUA_PRE', 'B4_KHONG_XA_PRE', 'B5_XU_LY_PRE', 'B6_VE_SINH_PRE',
        'HT SAU', 'B1_POST', 'B2_POST', 'B3_POST', 'B4_POST', 'B5_POST', 'B6_POST',
        'MỨC SẴN SÀNG DUY TRÌ (1-5)', 'CẢM NHẬN', 'RÀO CẢN TỒN TẠI'
      ]
    ];

    households.forEach(h => {
      const pre = bc02.find(b => b.householdId === h.id);
      const post = bc07.find(b => b.householdId === h.id);

      rows.push([
        h.id, h.representativeName, h.group,
        pre?.scoreK ?? '', pre?.scoreT ?? '', pre?.scoreHT ?? '',
        pre?.behaviorReport.b1_thuGom ? 1 : 0,
        pre?.behaviorReport.b2_phanLoai ? 1 : 0,
        pre?.behaviorReport.b3_luuChua ? 1 : 0,
        pre?.behaviorReport.b4_khongXaThang ? 1 : 0,
        pre?.behaviorReport.b5_xuLyTaiSuDung ? 1 : 0,
        pre?.behaviorReport.b6_veSinh ? 1 : 0,
        post?.scoreHT_Post ?? '',
        post?.behaviorReport.b1_thuGom ? 1 : 0,
        post?.behaviorReport.b2_phanLoai ? 1 : 0,
        post?.behaviorReport.b3_luuChua ? 1 : 0,
        post?.behaviorReport.b4_khongXaThang ? 1 : 0,
        post?.behaviorReport.b5_xuLyTaiSuDung ? 1 : 0,
        post?.behaviorReport.b6_veSinh ? 1 : 0,
        post?.maintenanceWillingness ?? '',
        post?.feedbackProcess ?? '',
        post?.mainBarriers.join('; ') ?? ''
      ]);
    });

    const timestamp = new Date().toISOString().slice(0, 10);
    this.downloadCsv(`DU_LIEU_KHAO_SAT_KAP_PRE_POST_${timestamp}.csv`, rows);
  }

  /**
   * 3. Xuất Dữ liệu Quan sát CWM thực tế (BC-04)
   */
  static exportCWM(): void {
    const bc04 = StorageService.getBC04List();
    const households = StorageService.getHouseholds();

    const rows: any[][] = [
      ['MÃ HỘ', 'HỌ TÊN', 'NHÓM', 'GIAI ĐOẠN', 'ĐIỂM CWM (0-6)', 'B1_THU_GOM', 'B2_PHAN_LOAI', 'B3_LUU_CHUA', 'B4_KHONG_XA', 'B5_XU_LY', 'B6_VE_SINH', 'GHI CHÚ MÔ TẢ', 'BẰNG CHỨNG', 'NGUYÊN NHÂN KHÔNG ĐẠT', 'NGƯỜI QUAN SÁT', 'THỜI ĐIỂM']
    ];

    bc04.forEach(b => {
      const h = households.find(item => item.id === b.householdId);
      rows.push([
        b.householdId,
        h?.representativeName || '',
        h?.group || '',
        b.stage === 'PRE' ? 'TRƯỚC CAN THIỆP' : 'SAU CAN THIỆP',
        b.scoreCWM,
        b.criteria.b1_thuGom,
        b.criteria.b2_phanLoai,
        b.criteria.b3_luuChua,
        b.criteria.b4_khongXaThang,
        b.criteria.b5_xuLyTaiSuDung,
        b.criteria.b6_veSinh,
        b.observationNotes,
        b.evidenceDescription || '',
        b.failureReasons || '',
        b.observedBy,
        b.observedAt
      ]);
    });

    const timestamp = new Date().toISOString().slice(0, 10);
    this.downloadCsv(`DU_LIEU_QUAN_SAT_THUC_TE_CWM_${timestamp}.csv`, rows);
  }

  /**
   * 4. Xuất Báo cáo theo dõi 6 tuần (BC-06)
   */
  static exportWeeklyReports(): void {
    const weekly = StorageService.getBC06List();
    const households = StorageService.getHouseholds();

    const rows: any[][] = [
      ['MÃ HỘ', 'HỌ TÊN', 'NHÓM', 'TUẦN', 'ĐIỂM TUẦN (0-6)', 'B1_THU_GOM', 'B2_PHAN_LOAI', 'B3_LUU_CHUA', 'B4_KHONG_XA', 'B5_XU_LY', 'B6_VE_SINH', 'RÀO CẢN GẶP PHẢI', 'KHÓ KHĂN KHÁC', 'NGÀY NỘP']
    ];

    weekly.forEach(w => {
      const h = households.find(item => item.id === w.householdId);
      rows.push([
        w.householdId,
        h?.representativeName || '',
        h?.group || '',
        w.week,
        w.weeklyScore,
        w.behaviors.b1_thuGom ? 1 : 0,
        w.behaviors.b2_phanLoai ? 1 : 0,
        w.behaviors.b3_luuChua ? 1 : 0,
        w.behaviors.b4_khongXaThang ? 1 : 0,
        w.behaviors.b5_xuLyTaiSuDung ? 1 : 0,
        w.behaviors.b6_veSinh ? 1 : 0,
        w.barriers.join('; '),
        w.otherBarrierText || '',
        w.submittedAt
      ]);
    });

    const timestamp = new Date().toISOString().slice(0, 10);
    this.downloadCsv(`THEO_DOI_6_TUAN_BC06_${timestamp}.csv`, rows);
  }

  /**
   * 5. Xuất Audit Log
   */
  static exportAuditLogs(): void {
    const logs = StorageService.getAuditLogs();
    const rows: any[][] = [
      ['ID', 'THỜI GIAN', 'USER ID', 'TÊN ĐĂNG NHẬP', 'VAI TRÒ', 'HÀNH ĐỘNG', 'MODULE', 'MÃ HỘ', 'DỮ LIỆU CŨ', 'DỮ LIỆU MỚI', 'LÝ DO']
    ];

    logs.forEach(l => {
      rows.push([
        l.id,
        l.timestamp,
        l.userId,
        l.username,
        l.userRole,
        l.action,
        l.targetModule,
        l.householdId || '',
        l.oldValue || '',
        l.newValue || '',
        l.reason || ''
      ]);
    });

    const timestamp = new Date().toISOString().slice(0, 10);
    this.downloadCsv(`NHAT_KY_THAO_TAC_AUDIT_LOG_${timestamp}.csv`, rows);
  }
}
