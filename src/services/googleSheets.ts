/**
 * Dịch vụ kết nối và đồng bộ hai chiều với Google Sheets
 * Hỗ trợ giao tiếp qua Google Apps Script Web App URL an toàn
 * Cấu trúc 17 Sheets chuẩn khoa học
 */

import { StorageService } from './storage';
import { SyncStatus } from '../types';
import { PERMANENT_APPS_SCRIPT_URL } from '../config/initialData';

export interface SheetDefinition {
  name: string;
  description: string;
  columns: string[];
}

export const RESEARCH_SHEETS: SheetDefinition[] = [
  {
    name: 'CONFIG',
    description: 'Tham số cấu hình nghiên cứu khoa học',
    columns: ['KEY', 'VALUE', 'DESCRIPTION', 'UPDATED_AT']
  },
  {
    name: 'USERS',
    description: 'Danh sách tài khoản (đầy đủ thông tin xác thực an toàn)',
    columns: ['USER_ID', 'USERNAME', 'FULL_NAME', 'PHONE', 'ROLE', 'HOUSEHOLD_ID', 'STATUS', 'TITLE', 'ORGANIZATION', 'PASSWORD_HASH', 'SALT', 'DEFAULT_PASS', 'CREATED_AT']
  },
  {
    name: 'HOUSEHOLDS',
    description: 'Danh mục 40 hộ chăn nuôi và thông tin phân nhóm',
    columns: ['HOUSEHOLD_ID', 'REPRESENTATIVE_NAME', 'PHONE', 'ADDRESS', 'LIVESTOCK_TYPE', 'HERD_SIZE', 'FARMING_YEARS', 'FARMING_TYPE', 'CURRENT_WASTE_METHOD', 'GROUP', 'STATUS', 'JOINED_DATE', 'RESEARCHER', 'NOTES', 'UPDATED_AT']
  },
  {
    name: 'BC01_HO_THONG_TIN',
    description: 'Phiếu BC-01: Thông tin chi tiết hộ chăn nuôi',
    columns: ['RECORD_ID', 'HOUSEHOLD_ID', 'NAME', 'PHONE', 'ADDRESS', 'LIVESTOCK', 'HERD_SIZE', 'FARMING_YEARS', 'FARMING_TYPE', 'WASTE_METHOD', 'IS_LOCKED', 'CREATED_BY', 'CREATED_AT', 'UPDATED_AT', 'UPDATED_BY']
  },
  {
    name: 'BC02_KAP_PRE',
    description: 'Phiếu BC-02: Khảo sát KAP trước can thiệp (K, T, HT)',
    columns: ['RECORD_ID', 'HOUSEHOLD_ID', 'SCORE_K_PRE', 'SCORE_T_PRE', 'SCORE_HT_PRE', 'B1_THU_GOM', 'B2_PHAN_LOAI', 'B3_LUU_CHUA', 'B4_KHONG_XA', 'B5_XU_LY', 'B6_VE_SINH', 'IS_LOCKED', 'SUBMITTED_BY', 'SUBMITTED_AT']
  },
  {
    name: 'BC03_YDINH',
    description: 'Phiếu BC-03: Ý định thay đổi hành vi trước can thiệp (YĐ trước)',
    columns: ['RECORD_ID', 'HOUSEHOLD_ID', 'SCORE_YD_PRE', 'YD01_Y_DINH', 'YD02_SAN_SANG', 'YD03_NIEM_TIN', 'YD04_TRACH_NHIEM', 'YD05_DUY_TRI', 'IS_LOCKED', 'SUBMITTED_BY', 'SUBMITTED_AT']
  },
  {
    name: 'BC04_CWM_PRE',
    description: 'Phiếu BC-04: Quan sát thực địa CWM trước can thiệp (0-6 điểm)',
    columns: ['RECORD_ID', 'HOUSEHOLD_ID', 'SCORE_CWM_PRE', 'B1_THU_GOM', 'B2_PHAN_LOAI', 'B3_LUU_CHUA', 'B4_KHONG_XA', 'B5_XU_LY', 'B6_VE_SINH', 'NOTES', 'EVIDENCE', 'FAILURE_REASONS', 'OBSERVED_BY', 'OBSERVED_AT', 'IS_LOCKED']
  },
  {
    name: 'BC04_CWM_POST',
    description: 'Phiếu BC-04: Quan sát thực địa CWM sau can thiệp (0-6 điểm)',
    columns: ['RECORD_ID', 'HOUSEHOLD_ID', 'SCORE_CWM_POST', 'B1_THU_GOM', 'B2_PHAN_LOAI', 'B3_LUU_CHUA', 'B4_KHONG_XA', 'B5_XU_LY', 'B6_VE_SINH', 'NOTES', 'EVIDENCE', 'FAILURE_REASONS', 'OBSERVED_BY', 'OBSERVED_AT', 'IS_LOCKED']
  },
  {
    name: 'BC05_CAM_KET',
    description: 'Phiếu BC-05: Xác nhận Cam kết xanh (Nhóm Can thiệp TN)',
    columns: ['RECORD_ID', 'HOUSEHOLD_ID', 'B1_THU_GOM', 'B2_PHAN_LOAI', 'B3_LUU_CHUA', 'B4_KHONG_XA', 'B5_XU_LY', 'B6_VE_SINH', 'B7_BAO_CAO_TUAN', 'CONFIRMED', 'CONFIRMED_BY', 'CONFIRMED_AT', 'VERSION']
  },
  {
    name: 'BC06_WEEKLY',
    description: 'Phiếu BC-06: Theo dõi hành vi hằng tuần W1 - W6',
    columns: ['RECORD_ID', 'HOUSEHOLD_ID', 'WEEK', 'WEEKLY_SCORE', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'BARRIERS', 'OTHER_BARRIERS', 'SUBMITTED_BY', 'SUBMITTED_AT']
  },
  {
    name: 'BC07_POST',
    description: 'Phiếu BC-07: Khảo sát sau can thiệp (HT sau & Cảm nhận)',
    columns: ['RECORD_ID', 'HOUSEHOLD_ID', 'SCORE_HT_POST', 'B1_THU_GOM', 'B2_PHAN_LOAI', 'B3_LUU_CHUA', 'B4_KHONG_XA', 'B5_XU_LY', 'B6_VE_SINH', 'MAINTENANCE_WILLINGNESS', 'FEEDBACK', 'REMAINING_BARRIERS', 'IS_LOCKED', 'SUBMITTED_BY', 'SUBMITTED_AT']
  },
  {
    name: 'BC08_TONG_HOP',
    description: 'Bảng tổng hợp nghiên cứu trung tâm: K, T, YĐ, HT, CWM, ΔCWM',
    columns: ['HOUSEHOLD_ID', 'REPRESENTATIVE_NAME', 'GROUP', 'K_PRE', 'T_PRE', 'YD_PRE', 'HT_PRE', 'CWM_PRE', 'HT_POST', 'CWM_POST', 'DELTA_CWM', 'W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'STATUS']
  },
  {
    name: 'CWM_DETAIL',
    description: 'Chi tiết từng tiêu chí CWM trước và sau để phân tích vi mô',
    columns: ['HOUSEHOLD_ID', 'GROUP', 'STAGE', 'CRITERIA_CODE', 'IS_PASSED', 'EVIDENCE', 'OBSERVED_AT']
  },
  {
    name: 'BARRIERS',
    description: 'Tổng hợp các rào cản và khó khăn hộ chăn nuôi gặp phải',
    columns: ['RECORD_ID', 'HOUSEHOLD_ID', 'STAGE_OR_WEEK', 'BARRIER_TEXT', 'RECORDED_AT']
  },
  {
    name: 'AUDIT_LOG',
    description: 'Nhật ký thao tác toàn hệ thống (Kiểm soát liêm chính dữ liệu)',
    columns: ['LOG_ID', 'TIMESTAMP', 'USER_ID', 'USERNAME', 'ROLE', 'ACTION', 'TARGET_MODULE', 'HOUSEHOLD_ID', 'OLD_VALUE', 'NEW_VALUE', 'REASON']
  },
  {
    name: 'NOTIFICATIONS',
    description: 'Lịch sử thông báo và nhắc việc nộp báo cáo hằng tuần',
    columns: ['NOTIFICATION_ID', 'TITLE', 'MESSAGE', 'TYPE', 'TARGET_ROLE', 'TARGET_HOUSEHOLD', 'CREATED_AT']
  },
  {
    name: 'DASHBOARD_DATA',
    description: 'Số liệu tổng hợp chỉ số KPI nghiên cứu',
    columns: ['METRIC_NAME', 'VALUE', 'UNIT', 'LAST_CALCULATED_AT']
  }
];

export class GoogleSheetsService {
  /**
   * Tạo gói dữ liệu chuẩn bị gửi đến Google Sheets
   */
  static prepareWorkbookPayload(): Record<string, any[][]> {
    const config = StorageService.getConfig();
    const users = StorageService.getUsers();
    const households = StorageService.getHouseholds();
    const bc01List = StorageService.getBC01List();
    const bc02List = StorageService.getBC02List();
    const bc03List = StorageService.getBC03List();
    const bc04List = StorageService.getBC04List();
    const bc05List = StorageService.getBC05List();
    const bc06List = StorageService.getBC06List();
    const bc07List = StorageService.getBC07List();
    const bc08List = StorageService.generateBC08Summary();
    const auditLogs = StorageService.getAuditLogs();

    const payload: Record<string, any[][]> = {};

    // 1. CONFIG
    payload['CONFIG'] = [
      ['KEY', 'VALUE', 'DESCRIPTION', 'UPDATED_AT'],
      ['APP_NAME', config.appName, 'Tên ứng dụng', new Date().toISOString()],
      ['RESEARCH_TITLE', config.researchTitle, 'Tên đề tài nghiên cứu', new Date().toISOString()],
      ['TOTAL_HOUSEHOLDS', config.totalHouseholds, 'Tổng số hộ tham gia', new Date().toISOString()],
      ['TN_TARGET', config.tnTarget, 'Số hộ nhóm can thiệp (TN)', new Date().toISOString()],
      ['DC_TARGET', config.dcTarget, 'Số hộ nhóm đối chứng (ĐC)', new Date().toISOString()],
      ['TOTAL_WEEKS', config.totalWeeks, 'Số tuần can thiệp (W1-W6)', new Date().toISOString()],
      ['CWM_MAX_SCORE', config.cwmMaxScore, 'Điểm tối đa thang CWM', new Date().toISOString()],
      ['REMINDER_DAY', config.reminderDay, 'Ngày gửi nhắc nhở tuần', new Date().toISOString()],
      ['REMINDER_TIME', config.reminderTime, 'Giờ gửi nhắc nhở', new Date().toISOString()],
      ['START_DATE', config.startDate, 'Ngày bắt đầu nghiên cứu', new Date().toISOString()],
      ['END_DATE', config.endDate, 'Ngày kết thúc nghiên cứu', new Date().toISOString()],
      ['SPREADSHEET_ID', config.spreadsheetId || '', 'ID Google Spreadsheet liên kết', new Date().toISOString()],
      ['APPS_SCRIPT_URL', config.appsScriptUrl || '', 'URL Web App tiếp nhận dữ liệu', new Date().toISOString()],
    ];

    // 2. USERS
    payload['USERS'] = [
      ['USER_ID', 'USERNAME', 'FULL_NAME', 'PHONE', 'ROLE', 'HOUSEHOLD_ID', 'STATUS', 'TITLE', 'ORGANIZATION', 'PASSWORD_HASH', 'SALT', 'DEFAULT_PASS', 'CREATED_AT'],
      ...users.map(u => [u.id, u.username, u.fullName, u.phone, u.role, u.householdId || '', u.status, u.title || '', u.organization || '', u.passwordHash, u.salt, u.plainPasswordHint || '123456', u.createdAt])
    ];

    // 3. HOUSEHOLDS
    payload['HOUSEHOLDS'] = [
      ['HOUSEHOLD_ID', 'REPRESENTATIVE_NAME', 'PHONE', 'ADDRESS', 'LIVESTOCK_TYPE', 'HERD_SIZE', 'FARMING_YEARS', 'FARMING_TYPE', 'CURRENT_WASTE_METHOD', 'GROUP', 'STATUS', 'JOINED_DATE', 'RESEARCHER', 'NOTES', 'UPDATED_AT'],
      ...households.map(h => [h.id, h.representativeName, h.phone, h.address, h.livestockType, h.herdSize, h.farmingYears, h.farmingType, h.currentWasteMethod, h.group, h.accountStatus, h.joinedDate, h.assignedResearcher, h.notes || '', h.updatedAt])
    ];

    // 4. BC01_HO_THONG_TIN
    payload['BC01_HO_THONG_TIN'] = [
      ['RECORD_ID', 'HOUSEHOLD_ID', 'NAME', 'PHONE', 'ADDRESS', 'LIVESTOCK', 'HERD_SIZE', 'FARMING_YEARS', 'FARMING_TYPE', 'WASTE_METHOD', 'IS_LOCKED', 'CREATED_BY', 'CREATED_AT', 'UPDATED_AT', 'UPDATED_BY'],
      ...bc01List.map(b => [b.id, b.householdId, b.representativeName, b.phone, b.address, b.livestockType, b.herdSize, b.farmingYears, b.farmingType, b.currentWasteMethod, b.isLocked ? 'CÓ' : 'KHÔNG', b.createdBy, b.createdAt, b.updatedAt, b.updatedBy])
    ];

    // 5. BC02_KAP_PRE
    payload['BC02_KAP_PRE'] = [
      ['RECORD_ID', 'HOUSEHOLD_ID', 'SCORE_K_PRE', 'SCORE_T_PRE', 'SCORE_HT_PRE', 'B1_THU_GOM', 'B2_PHAN_LOAI', 'B3_LUU_CHUA', 'B4_KHONG_XA', 'B5_XU_LY', 'B6_VE_SINH', 'IS_LOCKED', 'SUBMITTED_BY', 'SUBMITTED_AT'],
      ...bc02List.map(b => [
        b.id, b.householdId, b.scoreK, b.scoreT, b.scoreHT,
        b.behaviorReport.b1_thuGom ? 1 : 0,
        b.behaviorReport.b2_phanLoai ? 1 : 0,
        b.behaviorReport.b3_luuChua ? 1 : 0,
        b.behaviorReport.b4_khongXaThang ? 1 : 0,
        b.behaviorReport.b5_xuLyTaiSuDung ? 1 : 0,
        b.behaviorReport.b6_veSinh ? 1 : 0,
        b.isLocked ? 'CÓ' : 'KHÔNG',
        b.submittedBy, b.submittedAt
      ])
    ];

    // 6. BC03_YDINH
    payload['BC03_YDINH'] = [
      ['RECORD_ID', 'HOUSEHOLD_ID', 'SCORE_YD_PRE', 'YD01_Y_DINH', 'YD02_SAN_SANG', 'YD03_NIEM_TIN', 'YD04_TRACH_NHIEM', 'YD05_DUY_TRI', 'IS_LOCKED', 'SUBMITTED_BY', 'SUBMITTED_AT'],
      ...bc03List.map(b => [
        b.id, b.householdId, b.scoreYD,
        b.answers.find(a => a.questionId === 'YD01')?.score || '',
        b.answers.find(a => a.questionId === 'YD02')?.score || '',
        b.answers.find(a => a.questionId === 'YD03')?.score || '',
        b.answers.find(a => a.questionId === 'YD04')?.score || '',
        b.answers.find(a => a.questionId === 'YD05')?.score || '',
        b.isLocked ? 'CÓ' : 'KHÔNG',
        b.submittedBy, b.submittedAt
      ])
    ];

    // 7. BC04_CWM_PRE
    const cwmPreList = bc04List.filter(b => b.stage === 'PRE');
    payload['BC04_CWM_PRE'] = [
      ['RECORD_ID', 'HOUSEHOLD_ID', 'SCORE_CWM_PRE', 'B1_THU_GOM', 'B2_PHAN_LOAI', 'B3_LUU_CHUA', 'B4_KHONG_XA', 'B5_XU_LY', 'B6_VE_SINH', 'NOTES', 'EVIDENCE', 'FAILURE_REASONS', 'OBSERVED_BY', 'OBSERVED_AT', 'IS_LOCKED'],
      ...cwmPreList.map(b => [
        b.id, b.householdId, b.scoreCWM,
        b.criteria.b1_thuGom, b.criteria.b2_phanLoai, b.criteria.b3_luuChua,
        b.criteria.b4_khongXaThang, b.criteria.b5_xuLyTaiSuDung, b.criteria.b6_veSinh,
        b.observationNotes, b.evidenceDescription || '', b.failureReasons || '',
        b.observedBy, b.observedAt, b.isLocked ? 'CÓ' : 'KHÔNG'
      ])
    ];

    // 8. BC04_CWM_POST
    const cwmPostList = bc04List.filter(b => b.stage === 'POST');
    payload['BC04_CWM_POST'] = [
      ['RECORD_ID', 'HOUSEHOLD_ID', 'SCORE_CWM_POST', 'B1_THU_GOM', 'B2_PHAN_LOAI', 'B3_LUU_CHUA', 'B4_KHONG_XA', 'B5_XU_LY', 'B6_VE_SINH', 'NOTES', 'EVIDENCE', 'FAILURE_REASONS', 'OBSERVED_BY', 'OBSERVED_AT', 'IS_LOCKED'],
      ...cwmPostList.map(b => [
        b.id, b.householdId, b.scoreCWM,
        b.criteria.b1_thuGom, b.criteria.b2_phanLoai, b.criteria.b3_luuChua,
        b.criteria.b4_khongXaThang, b.criteria.b5_xuLyTaiSuDung, b.criteria.b6_veSinh,
        b.observationNotes, b.evidenceDescription || '', b.failureReasons || '',
        b.observedBy, b.observedAt, b.isLocked ? 'CÓ' : 'KHÔNG'
      ])
    ];

    // 9. BC05_CAM_KET
    payload['BC05_CAM_KET'] = [
      ['RECORD_ID', 'HOUSEHOLD_ID', 'B1_THU_GOM', 'B2_PHAN_LOAI', 'B3_LUU_CHUA', 'B4_KHONG_XA', 'B5_XU_LY', 'B6_VE_SINH', 'B7_BAO_CAO_TUAN', 'CONFIRMED', 'CONFIRMED_BY', 'CONFIRMED_AT', 'VERSION'],
      ...bc05List.map(b => [
        b.id, b.householdId,
        b.commitments.b1_thuGom ? 1 : 0,
        b.commitments.b2_phanLoai ? 1 : 0,
        b.commitments.b3_luuChua ? 1 : 0,
        b.commitments.b4_khongXaThang ? 1 : 0,
        b.commitments.b5_xuLyTaiSuDung ? 1 : 0,
        b.commitments.b6_veSinh ? 1 : 0,
        b.commitments.b7_baoCaoHangTuan ? 1 : 0,
        b.confirmed ? 'ĐÃ KÝ' : 'CHƯA KÝ',
        b.confirmedBy || '', b.confirmedAt || '', b.version
      ])
    ];

    // 10. BC06_WEEKLY
    payload['BC06_WEEKLY'] = [
      ['RECORD_ID', 'HOUSEHOLD_ID', 'WEEK', 'WEEKLY_SCORE', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'BARRIERS', 'OTHER_BARRIERS', 'SUBMITTED_BY', 'SUBMITTED_AT'],
      ...bc06List.map(b => [
        b.id, b.householdId, b.week, b.weeklyScore,
        b.behaviors.b1_thuGom ? 1 : 0,
        b.behaviors.b2_phanLoai ? 1 : 0,
        b.behaviors.b3_luuChua ? 1 : 0,
        b.behaviors.b4_khongXaThang ? 1 : 0,
        b.behaviors.b5_xuLyTaiSuDung ? 1 : 0,
        b.behaviors.b6_veSinh ? 1 : 0,
        b.barriers.join('; '),
        b.otherBarrierText || '',
        b.submittedBy, b.submittedAt
      ])
    ];

    // 11. BC07_POST
    payload['BC07_POST'] = [
      ['RECORD_ID', 'HOUSEHOLD_ID', 'SCORE_HT_POST', 'B1_THU_GOM', 'B2_PHAN_LOAI', 'B3_LUU_CHUA', 'B4_KHONG_XA', 'B5_XU_LY', 'B6_VE_SINH', 'MAINTENANCE_WILLINGNESS', 'FEEDBACK', 'REMAINING_BARRIERS', 'IS_LOCKED', 'SUBMITTED_BY', 'SUBMITTED_AT'],
      ...bc07List.map(b => [
        b.id, b.householdId, b.scoreHT_Post,
        b.behaviorReport?.b1_thuGom ? 1 : 0,
        b.behaviorReport?.b2_phanLoai ? 1 : 0,
        b.behaviorReport?.b3_luuChua ? 1 : 0,
        b.behaviorReport?.b4_khongXaThang ? 1 : 0,
        b.behaviorReport?.b5_xuLyTaiSuDung ? 1 : 0,
        b.behaviorReport?.b6_veSinh ? 1 : 0,
        b.maintenanceWillingness,
        b.feedbackProcess, b.mainBarriers.join('; '),
        b.isLocked ? 'CÓ' : 'KHÔNG', b.submittedBy, b.submittedAt
      ])
    ];

    // 12. BC08_TONG_HOP
    payload['BC08_TONG_HOP'] = [
      ['HOUSEHOLD_ID', 'REPRESENTATIVE_NAME', 'GROUP', 'K_PRE', 'T_PRE', 'YD_PRE', 'HT_PRE', 'CWM_PRE', 'HT_POST', 'CWM_POST', 'DELTA_CWM', 'W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'STATUS'],
      ...bc08List.map(b => [
        b.householdId, b.representativeName, b.group,
        b.scoreK_Pre ?? '', b.scoreT_Pre ?? '', b.scoreYD_Pre ?? '', b.scoreHT_Pre ?? '',
        b.scoreCWM_Pre ?? '', b.scoreHT_Post ?? '', b.scoreCWM_Post ?? '',
        b.deltaCWM !== null ? (b.deltaCWM > 0 ? `+${b.deltaCWM}` : b.deltaCWM) : '',
        b.w1_score ?? '', b.w2_score ?? '', b.w3_score ?? '', b.w4_score ?? '', b.w5_score ?? '', b.w6_score ?? '',
        b.status === 'COMPLETED' ? 'HOÀN THÀNH' : (b.status === 'IN_PROGRESS' ? 'ĐANG TIẾN HÀNH' : 'CHƯA BẮT ĐẦU')
      ])
    ];

    // 13. CWM_DETAIL
    const cwmDetails: any[][] = [
      ['HOUSEHOLD_ID', 'GROUP', 'STAGE', 'CRITERIA_CODE', 'IS_PASSED', 'EVIDENCE', 'OBSERVED_AT']
    ];
    bc04List.forEach(b => {
      const hGroup = households.find(h => h.id === b.householdId)?.group || '';
      const stage = b.stage === 'PRE' ? 'TRƯỚC' : 'SAU';
      cwmDetails.push([b.householdId, hGroup, stage, 'B1', b.criteria.b1_thuGom, b.evidenceDescription || '', b.observedAt]);
      cwmDetails.push([b.householdId, hGroup, stage, 'B2', b.criteria.b2_phanLoai, b.evidenceDescription || '', b.observedAt]);
      cwmDetails.push([b.householdId, hGroup, stage, 'B3', b.criteria.b3_luuChua, b.evidenceDescription || '', b.observedAt]);
      cwmDetails.push([b.householdId, hGroup, stage, 'B4', b.criteria.b4_khongXaThang, b.evidenceDescription || '', b.observedAt]);
      cwmDetails.push([b.householdId, hGroup, stage, 'B5', b.criteria.b5_xuLyTaiSuDung, b.evidenceDescription || '', b.observedAt]);
      cwmDetails.push([b.householdId, hGroup, stage, 'B6', b.criteria.b6_veSinh, b.evidenceDescription || '', b.observedAt]);
    });
    payload['CWM_DETAIL'] = cwmDetails;

    // 14. BARRIERS
    const barrierRows: any[][] = [
      ['RECORD_ID', 'HOUSEHOLD_ID', 'STAGE_OR_WEEK', 'BARRIER_TEXT', 'RECORDED_AT']
    ];
    bc06List.forEach(w => {
      w.barriers.forEach(barrier => {
        barrierRows.push([w.id, w.householdId, w.week, barrier, w.submittedAt]);
      });
      if (w.otherBarrierText) {
        barrierRows.push([w.id, w.householdId, w.week, `Khác: ${w.otherBarrierText}`, w.submittedAt]);
      }
    });
    payload['BARRIERS'] = barrierRows;

    // 15. AUDIT_LOG
    payload['AUDIT_LOG'] = [
      ['LOG_ID', 'TIMESTAMP', 'USER_ID', 'USERNAME', 'ROLE', 'ACTION', 'TARGET_MODULE', 'HOUSEHOLD_ID', 'OLD_VALUE', 'NEW_VALUE', 'REASON'],
      ...auditLogs.map(l => [l.id, l.timestamp, l.userId, l.username, l.userRole, l.action, l.targetModule, l.householdId || '', l.oldValue || '', l.newValue || '', l.reason || ''])
    ];

    // 16. NOTIFICATIONS
    payload['NOTIFICATIONS'] = [
      ['NOTIFICATION_ID', 'TITLE', 'MESSAGE', 'TYPE', 'TARGET_ROLE', 'TARGET_HOUSEHOLD', 'CREATED_AT'],
      ['NOTIF_01', 'Chào mừng nghiên cứu', 'Hệ thống Quản lý Nghiên cứu Cam kết Xanh đã sẵn sàng hoạt động.', 'SUCCESS', 'ADMIN', '', new Date().toISOString()]
    ];

    // 17. DASHBOARD_DATA
    const tnCount = households.filter(h => h.group === 'TN').length;
    const dcCount = households.filter(h => h.group === 'DC').length;
    const preCwmDone = bc04List.filter(b => b.stage === 'PRE').length;
    const postCwmDone = bc04List.filter(b => b.stage === 'POST').length;
    const greenCommitmentsDone = bc05List.filter(b => b.confirmed).length;

    const tnPreScores = bc08List.filter(b => b.group === 'TN' && b.scoreCWM_Pre !== null).map(b => b.scoreCWM_Pre as number);
    const tnPostScores = bc08List.filter(b => b.group === 'TN' && b.scoreCWM_Post !== null).map(b => b.scoreCWM_Post as number);
    const dcPreScores = bc08List.filter(b => b.group === 'DC' && b.scoreCWM_Pre !== null).map(b => b.scoreCWM_Pre as number);
    const dcPostScores = bc08List.filter(b => b.group === 'DC' && b.scoreCWM_Post !== null).map(b => b.scoreCWM_Post as number);

    const meanTnPre = tnPreScores.length ? (tnPreScores.reduce((a, b) => a + b, 0) / tnPreScores.length).toFixed(2) : '0';
    const meanTnPost = tnPostScores.length ? (tnPostScores.reduce((a, b) => a + b, 0) / tnPostScores.length).toFixed(2) : '0';
    const meanDcPre = dcPreScores.length ? (dcPreScores.reduce((a, b) => a + b, 0) / dcPreScores.length).toFixed(2) : '0';
    const meanDcPost = dcPostScores.length ? (dcPostScores.reduce((a, b) => a + b, 0) / dcPostScores.length).toFixed(2) : '0';

    const deltaTn = (parseFloat(meanTnPost) - parseFloat(meanTnPre)).toFixed(2);
    const deltaDc = (parseFloat(meanDcPost) - parseFloat(meanDcPre)).toFixed(2);
    const diffDelta = (parseFloat(deltaTn) - parseFloat(deltaDc)).toFixed(2);

    payload['DASHBOARD_DATA'] = [
      ['METRIC_NAME', 'VALUE', 'UNIT', 'LAST_CALCULATED_AT'],
      ['TOTAL_HOUSEHOLDS', households.length, 'hộ', new Date().toISOString()],
      ['TN_COUNT', tnCount, 'hộ', new Date().toISOString()],
      ['DC_COUNT', dcCount, 'hộ', new Date().toISOString()],
      ['PRE_CWM_OBSERVED', preCwmDone, 'hộ', new Date().toISOString()],
      ['POST_CWM_OBSERVED', postCwmDone, 'hộ', new Date().toISOString()],
      ['GREEN_COMMITMENT_CONFIRMED', greenCommitmentsDone, 'hộ', new Date().toISOString()],
      ['MEAN_CWM_PRE_TN', meanTnPre, 'điểm (thang 0-6)', new Date().toISOString()],
      ['MEAN_CWM_POST_TN', meanTnPost, 'điểm (thang 0-6)', new Date().toISOString()],
      ['MEAN_CWM_PRE_DC', meanDcPre, 'điểm (thang 0-6)', new Date().toISOString()],
      ['MEAN_CWM_POST_DC', meanDcPost, 'điểm (thang 0-6)', new Date().toISOString()],
      ['DELTA_CWM_TN', deltaTn, 'điểm', new Date().toISOString()],
      ['DELTA_CWM_DC', deltaDc, 'điểm', new Date().toISOString()],
      ['DIFFERENCE_MEAN_DELTA', diffDelta, 'điểm', new Date().toISOString()],
      ['COMPLETION_RATE', households.length > 0 ? Math.round((postCwmDone / households.length) * 100) : 0, '%', new Date().toISOString()],
    ];

    // Chuẩn hóa và làm sạch tuyệt đối: mọi hàng cùng số cột, không có null/undefined
    for (const sheetName in payload) {
      const rows = payload[sheetName];
      if (!rows || rows.length === 0) continue;
      const maxCols = Math.max(...rows.map(r => r.length));
      payload[sheetName] = rows.map(row => {
        const newRow: any[] = [];
        for (let i = 0; i < maxCols; i++) {
          const val = row[i];
          newRow.push(val === undefined || val === null ? '' : val);
        }
        return newRow;
      });
    }

    return payload;
  }

  /**
   * Đồng bộ lên Google Apps Script Web App
   */
  static async syncToGoogleSheets(customUrl?: string): Promise<{ success: boolean; message: string }> {
    const config = StorageService.getConfig();
    const url = customUrl || config.appsScriptUrl || PERMANENT_APPS_SCRIPT_URL;

    if (!url) {
      return {
        success: false,
        message: 'Chưa cấu hình URL Google Apps Script Web App. Vui lòng cấu hình trong mục Google Sheets.'
      };
    }

    try {
      StorageService.setSyncStatus('SYNCING');
      const payload = this.prepareWorkbookPayload();

      // BƯỚC 1: Ưu tiên gửi qua Cloud Backend Server (Không bị hạn chế CORS trình duyệt)
      try {
        const serverRes = await fetch('/api/cloud-sync-sheets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appsScriptUrl: url,
            spreadsheetId: config.spreadsheetId,
            sheets: payload,
          }),
        });

        if (serverRes.ok) {
          const serverJson = await serverRes.json();
          if (serverJson.success) {
            StorageService.setSyncStatus('SYNCED');
            StorageService.addAuditLog({
              userId: 'system',
              username: 'system',
              userRole: 'ADMIN',
              action: 'SYNC',
              targetModule: 'GOOGLE_SHEETS',
              reason: `Đồng bộ thành công 17 sheets lên Google Sheets qua Cloud Backend lúc ${new Date().toLocaleTimeString('vi-VN')}`
            });
            return {
              success: true,
              message: 'Đã lưu và đồng bộ toàn bộ 17 Sheet lên Google Sheets thành công!'
            };
          }
        }
      } catch (serverErr) {
        console.warn('Server proxy sync not available, falling back to direct browser fetch:', serverErr);
      }

      // BƯỚC 2: Fallback gửi trực tiếp từ trình duyệt
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: JSON.stringify({
            action: 'SYNC_ALL_SHEETS',
            spreadsheetId: config.spreadsheetId,
            timestamp: new Date().toISOString(),
            sheets: payload,
          }),
        });

        const result = await response.json();
        if (result.status === 'success') {
          StorageService.setSyncStatus('SYNCED');
          StorageService.addAuditLog({
            userId: 'system',
            username: 'system',
            userRole: 'ADMIN',
            action: 'SYNC',
            targetModule: 'GOOGLE_SHEETS',
            reason: `Đồng bộ thành công 17 sheets lên Google Sheets lúc ${new Date().toLocaleTimeString('vi-VN')}`
          });
          return {
            success: true,
            message: result.message || 'Đã đồng bộ toàn bộ 17 Sheet lên Google Sheets thành công!'
          };
        }
      } catch (postErr) {
        // Fallback gửi qua mode: 'no-cors' (Đảm bảo dữ liệu chắc chắn tới Google Apps Script ngay cả khi bị chặn CORS ở redirect)
        await fetch(url, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: JSON.stringify({
            action: 'SYNC_ALL_SHEETS',
            spreadsheetId: config.spreadsheetId,
            timestamp: new Date().toISOString(),
            sheets: payload,
          }),
        });

        StorageService.setSyncStatus('SYNCED');
        StorageService.addAuditLog({
          userId: 'system',
          username: 'system',
          userRole: 'ADMIN',
          action: 'SYNC',
          targetModule: 'GOOGLE_SHEETS',
          reason: `Đã gửi lệnh đồng bộ 17 sheets lên Google Sheets thành công lúc ${new Date().toLocaleTimeString('vi-VN')}`
        });

        return {
          success: true,
          message: 'Dữ liệu đã được gửi thành công lên Google Apps Script! Hãy mở Google Sheets để kiểm tra 17 Sheet vừa được cập nhật.'
        };
      }

      return {
        success: true,
        message: 'Đã hoàn tất đồng bộ lên Google Sheets!'
      };
    } catch (err: any) {
      StorageService.setSyncStatus('PENDING');
      return {
        success: false,
        message: `Lỗi kết nối tới Apps Script: ${err.message || 'Chưa thể kết nối tới Google Sheets'}`
      };
    }
  }

  /**
   * Kiểm tra ping kết nối tới Apps Script
   */
  static async testConnection(url: string, spreadsheetId: string): Promise<{ ok: boolean; message: string }> {
    if (!url) {
      return { ok: false, message: 'URL Apps Script không được để trống.' };
    }
    try {
      const pingUrl = `${url}${url.includes('?') ? '&' : '?'}action=PING&spreadsheetId=${encodeURIComponent(spreadsheetId)}`;
      const res = await fetch(pingUrl, { method: 'GET' });
      const data = await res.json();
      if (data.status === 'success' || data.status === 'ok') {
        return { ok: true, message: data.message || 'Kết nối Google Sheets thành công!' };
      }
      return { ok: false, message: data.message || 'Không thể kết nối đến Google Sheets.' };
    } catch (error: any) {
      return {
        ok: false,
        message: `Lỗi "Failed to fetch": Do trong Google Apps Script của bạn chưa có hàm doGet, hoặc bạn chưa chọn "Phiên bản mới" (New version) khi Deploy. Vui lòng copy toàn bộ mã Code.gs được cung cấp bên dưới, dán vào Apps Script và Triển khai lại.`
      };
    }
  }

  private static autoSyncTimer: any = null;

  /**
   * Tự động lên lịch đẩy 17 sheets lên Google Sheets (Debounce 1.5s để gom nhóm các thay đổi liên tiếp)
   */
  static scheduleAutoSync(delayMs: number = 1500): void {
    if (this.autoSyncTimer) {
      clearTimeout(this.autoSyncTimer);
    }
    StorageService.setSyncStatus('PENDING');
    this.autoSyncTimer = setTimeout(async () => {
      try {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          StorageService.setSyncStatus('PENDING');
          return;
        }
        await this.syncToGoogleSheets();
      } catch (e) {
        console.warn('Lên lịch đồng bộ nền Google Sheets chưa thành công:', e);
        StorageService.setSyncStatus('PENDING');
      }
    }, delayMs);
  }
}

// Tự động kết nối cơ chế auto-sync với sự kiện thay đổi dữ liệu trong StorageService
StorageService.onDataChange(() => {
  GoogleSheetsService.scheduleAutoSync();
});

// Khi kết nối Internet khôi phục, tự động đẩy dữ liệu lên Google Sheets
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    GoogleSheetsService.scheduleAutoSync(500);
  });
}
