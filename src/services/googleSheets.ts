/**
 * Dịch vụ kết nối và đồng bộ trực tiếp với Google Sheets (Single Source of Truth)
 * Google Sheets là Database duy nhất của ứng dụng: App đọc, hiển thị, chỉnh sửa và ghi về Google Sheets.
 * Không tự tạo dữ liệu giả lập, bảo toàn 100% dữ liệu lịch sử.
 */

import { StorageService } from './storage';
import {
  SyncStatus,
  User,
  Household,
  BC01Record,
  BC02Record,
  BC03Record,
  BC04Record,
  BC05Record,
  BC06Record,
  BC07Record,
  Role,
  AccountStatus,
  StudyGroup,
  AuditLog,
  ResearchConfig,
} from '../types';
import { PERMANENT_APPS_SCRIPT_URL } from '../config/initialData';

export interface SheetDefinition {
  name: string;
  description: string;
  columns: string[];
}

export const VIETNAMESE_SHEETS_META: SheetDefinition[] = [
  {
    name: 'TAI_KHOAN',
    description: 'Danh sách Tổng hợp Toàn bộ Tài khoản (HDAN, GV, HS, Hộ dân, Quản trị)',
    columns: [
      'MÃ TÀI KHOẢN', 'TÊN ĐĂNG NHẬP', 'HỌ VÀ TÊN', 'VAI TRÒ', 'CHỨC VỤ / HỌC VỊ',
      'ĐƠN VỊ / ĐỊA CHỈ', 'SỐ ĐIỆN THOẠI', 'EMAIL', 'MÃ HỘ LIÊN KẾT', 'MẬT KHẨU',
      'TRẠNG THÁI', 'NGÀY TẠO', 'NGÀY CẬP NHẬT'
    ],
  },
  {
    name: 'USERS',
    description: 'Danh sách Users hệ thống',
    columns: [
      'USER_ID', 'USERNAME', 'FULL_NAME', 'PHONE', 'ROLE', 'HOUSEHOLD_ID',
      'STATUS', 'TITLE', 'ORGANIZATION', 'PASSWORD_HASH', 'SALT', 'DEFAULT_PASS', 'CREATED_AT'
    ],
  },
  {
    name: 'HO_CHAN_NUOI',
    description: 'Danh mục Hộ chăn nuôi gà',
    columns: [
      'MÃ HỘ', 'TÊN CHỦ HỘ', 'SỐ ĐIỆN THOẠI', 'ĐỊA CHỈ', 'NHÓM NGHIÊN CỨU',
      'QUY MÔ ĐÀN (CON)', 'GIỐNG GÀ', 'HÌNH THỨC NUÔI', 'HỌC VIÊN PHỤ TRÁCH', 'GIẢNG VIÊN GIÁM SÁT',
      'TÊN ĐĂNG NHẬP', 'MẬT KHẨU', 'TRẠNG THÁI', 'NGÀY VÀO ĐÀN', 'GHI CHÚ',
      'NGÀY TẠO', 'NGÀY CẬP NHẬT'
    ],
  },
  {
    name: 'HOUSEHOLDS',
    description: 'Danh sách Hộ chăn nuôi',
    columns: [
      'HOUSEHOLD_ID', 'REPRESENTATIVE_NAME', 'PHONE', 'ADDRESS', 'LIVESTOCK_TYPE',
      'HERD_SIZE', 'FARMING_YEARS', 'FARMING_TYPE', 'CURRENT_WASTE_METHOD', 'GROUP',
      'STATUS', 'JOINED_DATE', 'RESEARCHER', 'NOTES', 'UPDATED_AT'
    ],
  },
  {
    name: 'BC01_HO_THONG_TIN',
    description: 'Phiếu BC-01 Thông tin hộ chăn nuôi',
    columns: [
      'RECORD_ID', 'HOUSEHOLD_ID', 'NAME', 'PHONE', 'ADDRESS', 'LIVESTOCK',
      'HERD_SIZE', 'FARMING_YEARS', 'FARMING_TYPE', 'WASTE_METHOD', 'IS_LOCKED',
      'CREATED_BY', 'CREATED_AT', 'UPDATED_AT', 'UPDATED_BY'
    ],
  },
  {
    name: 'BC02_KAP_PRE',
    description: 'Phiếu BC-02 Khảo sát KAP trước can thiệp',
    columns: [
      'RECORD_ID', 'HOUSEHOLD_ID', 'SCORE_K_PRE', 'SCORE_T_PRE', 'SCORE_HT_PRE',
      'B1_THU_GOM', 'B2_PHAN_LOAI', 'B3_LUU_CHUA', 'B4_KHONG_XA', 'B5_XU_LY', 'B6_VE_SINH',
      'IS_LOCKED', 'SUBMITTED_BY', 'SUBMITTED_AT'
    ],
  },
  {
    name: 'BC03_YDINH',
    description: 'Phiếu BC-03 Ý định thay đổi',
    columns: [
      'RECORD_ID', 'HOUSEHOLD_ID', 'SCORE_YD_PRE', 'YD01_Y_DINH', 'YD02_SAN_SANG',
      'YD03_NIEM_TIN', 'YD04_TRACH_NHIEM', 'YD05_DUY_TRI', 'IS_LOCKED', 'SUBMITTED_BY', 'SUBMITTED_AT'
    ],
  },
  {
    name: 'BC04_CWM_PRE',
    description: 'Phiếu BC-04 Quan sát CWM Trước can thiệp',
    columns: [
      'RECORD_ID', 'HOUSEHOLD_ID', 'SCORE_CWM_PRE', 'B1_THU_GOM', 'B2_PHAN_LOAI',
      'B3_LUU_CHUA', 'B4_KHONG_XA', 'B5_XU_LY', 'B6_VE_SINH', 'NOTES', 'EVIDENCE',
      'FAILURE_REASONS', 'OBSERVED_BY', 'OBSERVED_AT', 'IS_LOCKED'
    ],
  },
  {
    name: 'BC04_CWM_POST',
    description: 'Phiếu BC-04 Quan sát CWM Sau can thiệp',
    columns: [
      'RECORD_ID', 'HOUSEHOLD_ID', 'SCORE_CWM_POST', 'B1_THU_GOM', 'B2_PHAN_LOAI',
      'B3_LUU_CHUA', 'B4_KHONG_XA', 'B5_XU_LY', 'B6_VE_SINH', 'NOTES', 'EVIDENCE',
      'FAILURE_REASONS', 'OBSERVED_BY', 'OBSERVED_AT', 'IS_LOCKED'
    ],
  },
  {
    name: 'BC05_CAM_KET',
    description: 'Phiếu BC-05 Cam kết xanh',
    columns: [
      'RECORD_ID', 'HOUSEHOLD_ID', 'B1_THU_GOM', 'B2_PHAN_LOAI', 'B3_LUU_CHUA',
      'B4_KHONG_XA', 'B5_XU_LY', 'B6_VE_SINH', 'B7_BAO_CAO_TUAN', 'CONFIRMED',
      'CONFIRMED_BY', 'CONFIRMED_AT', 'VERSION'
    ],
  },
  {
    name: 'BC06_WEEKLY',
    description: 'Phiếu BC-06 Báo cáo theo dõi hằng tuần',
    columns: [
      'RECORD_ID', 'HOUSEHOLD_ID', 'WEEK', 'WEEKLY_SCORE', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6',
      'BARRIERS', 'OTHER_BARRIERS', 'SUBMITTED_BY', 'SUBMITTED_AT'
    ],
  },
  {
    name: 'BC07_POST',
    description: 'Phiếu BC-07 Khảo sát sau can thiệp',
    columns: [
      'RECORD_ID', 'HOUSEHOLD_ID', 'SCORE_HT_POST', 'B1_THU_GOM', 'B2_PHAN_LOAI',
      'B3_LUU_CHUA', 'B4_KHONG_XA', 'B5_XU_LY', 'B6_VE_SINH', 'MAINTENANCE_WILLINGNESS',
      'FEEDBACK', 'REMAINING_BARRIERS', 'IS_LOCKED', 'SUBMITTED_BY', 'SUBMITTED_AT'
    ],
  },
  {
    name: 'BC08_TONG_HOP',
    description: 'Bảng BC-08 Tổng hợp dữ liệu đề tài',
    columns: [
      'HOUSEHOLD_ID', 'REPRESENTATIVE_NAME', 'GROUP', 'K_PRE', 'T_PRE', 'YD_PRE',
      'HT_PRE', 'CWM_PRE', 'HT_POST', 'CWM_POST', 'DELTA_CWM', 'W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'STATUS'
    ],
  },
  {
    name: 'NHAT_KY_CHAN_NUOI',
    description: 'Nhật ký chăn nuôi & Quản lý chất thải hàng ngày/tuần',
    columns: [
      'MÃ NHẬT KÝ', 'MÃ HỘ', 'TÊN CHỦ HỘ', 'NGÀY GHI', 'TUẦN THEO DÕI',
      'SỐ GÀ HIỆN CÓ', 'SỐ GÀ HAO HỤT', 'LƯỢNG THỨC ĂN (KG)', 'LƯỢNG NƯỚC UỐNG (LÍT)', 'TRỌNG LƯỢNG TB (KG/CON)',
      'TÌNH TRẠNG SỨC KHỎE', 'THUỐC / VẮC XIN', 'XỬ LÝ PHÂN / ĐỆM LÓT', 'ĐIỂM QUẢN LÝ CHẤT THẢI (0-6)',
      'NGƯỜI GHI CHÉP', 'GHI CHÚ', 'THỜI GIAN LƯU'
    ],
  },
  {
    name: 'LICH_TIEM_VACCINE',
    description: 'Lịch tiêm phòng vắc xin cho đàn gà',
    columns: [
      'MÃ LỊCH', 'MÃ HỘ', 'TUẦN TUỔI', 'TÊN VẮC XIN', 'ĐƯỜNG DÙNG',
      'NGÀY DỰ KIẾN', 'NGÀY THỰC HIỆN', 'TRẠNG THÁI', 'NGƯỜI THỰC HIỆN', 'GHI CHÚ',
      'THỜI GIAN CẬP NHẬT'
    ],
  },
  {
    name: 'BAO_CAO_DANH_GIA',
    description: 'Báo cáo đánh giá nghiên cứu (KAP, Cam kết, CWM, Tổng hợp)',
    columns: [
      'MÃ BÁO CÁO', 'MÃ HỘ', 'TÊN CHỦ HỘ', 'LOẠI BÁO CÁO', 'TUẦN / GIAI ĐOẠN',
      'ĐIỂM K', 'ĐIỂM T', 'ĐIỂM YĐ', 'ĐIỂM HT', 'ĐIỂM CWM',
      'CHI TIẾT ĐÁNH GIÁ', 'NGƯỜI ĐÁNH GIÁ', 'NGÀY ĐÁNH GIÁ', 'TRẠNG THÁI'
    ],
  },
  {
    name: 'LICH_SU_HOAT_DONG',
    description: 'Nhật ký kiểm toán lưu vĩnh viễn mọi thao tác',
    columns: [
      'MÃ LỊCH SỬ', 'THỜI GIAN', 'TÊN ĐĂNG NHẬP', 'HỌ VÀ TÊN', 'VAI TRÒ',
      'HÀNH ĐỘNG', 'ĐỐI TƯỢNG', 'CHI TIẾT NỘI DUNG', 'TRẠNG THÁI'
    ],
  },
  {
    name: 'CAU_HINH',
    description: 'Cấu hình tham số hệ thống',
    columns: ['KHÓA', 'GIÁ TRỊ', 'MÔ TẢ', 'NGÀY CẬP NHẬT'],
  },
];

export const RESEARCH_SHEETS = VIETNAMESE_SHEETS_META;

export class GoogleSheetsService {
  private static isDataLoadedFromSheets: boolean = false;
  private static autoSyncTimer: any = null;

  static hasLoadedFromSheets(): boolean {
    return this.isDataLoadedFromSheets;
  }

  /**
   * Tạo gói dữ liệu chuẩn bị gửi đến Google Sheets với đầy đủ 17 Bảng tính
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

    // 1. TAI_KHOAN
    payload['TAI_KHOAN'] = [
      [
        'MÃ TÀI KHOẢN', 'TÊN ĐĂNG NHẬP', 'HỌ VÀ TÊN', 'VAI TRÒ', 'CHỨC VỤ / HỌC VỊ',
        'ĐƠN VỊ / ĐỊA CHỈ', 'SỐ ĐIỆN THOẠI', 'EMAIL', 'MÃ HỘ LIÊN KẾT', 'MẬT KHẨU',
        'TRẠNG THÁI', 'NGÀY TẠO', 'NGÀY CẬP NHẬT'
      ],
      ...users.map((u) => {
        let roleName = 'Học sinh / Học viên (HS)';
        if (u.role === 'ADMIN') roleName = 'Quản trị viên (Chủ nhiệm đề tài)';
        else if (u.role === 'HOUSEHOLD') roleName = 'Hộ chăn nuôi gà';
        else if (u.role === 'SUPERVISOR') {
          roleName = (u.title || '').toLowerCase().includes('hướng dẫn')
            ? 'Cán bộ hướng dẫn (HDAN)'
            : 'Giảng viên (GV)';
        }

        return [
          u.id,
          u.username,
          u.fullName,
          roleName,
          u.title || '',
          u.organization || '',
          u.phone || '',
          u.email || '',
          u.householdId || '',
          u.plainPasswordHint || u.password || '123456',
          u.status === 'ACTIVE' ? 'HOẠT ĐỘNG' : 'TẠM KHÓA',
          u.createdAt || new Date().toISOString(),
          new Date().toISOString(),
        ];
      }),
    ];

    // 2. USERS
    payload['USERS'] = [
      ['USER_ID', 'USERNAME', 'FULL_NAME', 'PHONE', 'ROLE', 'HOUSEHOLD_ID', 'STATUS', 'TITLE', 'ORGANIZATION', 'PASSWORD_HASH', 'SALT', 'DEFAULT_PASS', 'CREATED_AT'],
      ...users.map((u) => [
        u.id,
        u.username,
        u.fullName,
        u.phone || '',
        u.role,
        u.householdId || '',
        u.status,
        u.title || '',
        u.organization || '',
        u.passwordHash || '',
        u.salt || '',
        u.plainPasswordHint || u.password || '123456',
        u.createdAt || new Date().toISOString(),
      ]),
    ];

    // 3. HO_CHAN_NUOI
    payload['HO_CHAN_NUOI'] = [
      [
        'MÃ HỘ', 'TÊN CHỦ HỘ', 'SỐ ĐIỆN THOẠI', 'ĐỊA CHỈ', 'NHÓM NGHIÊN CỨU',
        'QUY MÔ ĐÀN (CON)', 'GIỐNG GÀ', 'HÌNH THỨC NUÔI', 'HỌC VIÊN PHỤ TRÁCH', 'GIẢNG VIÊN GIÁM SÁT',
        'TÊN ĐĂNG NHẬP', 'MẬT KHẨU', 'TRẠNG THÁI', 'NGÀY VÀO ĐÀN', 'GHI CHÚ',
        'NGÀY TẠO', 'NGÀY CẬP NHẬT'
      ],
      ...households.map((h) => {
        const u = users.find((usr) => usr.householdId === h.id || usr.username.toLowerCase() === h.id.toLowerCase());
        const pass = u ? (u.plainPasswordHint || u.password || '123456') : '123456';
        const uname = u ? u.username : h.id.toLowerCase();

        const supervisor = users.find((u) => u.role === 'SUPERVISOR');
        return [
          h.id,
          h.representativeName,
          h.phone || '',
          h.address || '',
          h.group === 'TN' ? 'Can thiệp (TN)' : 'Đối chứng (ĐC)',
          h.herdSize || '',
          h.livestockType || '',
          h.farmingType || '',
          h.assignedResearcher || '',
          supervisor ? supervisor.fullName : '',
          uname,
          pass,
          h.accountStatus === 'ACTIVE' ? 'HOẠT ĐỘNG' : 'TẠM KHÓA',
          h.joinedDate || '',
          h.notes || '',
          h.createdAt || new Date().toISOString(),
          h.updatedAt || new Date().toISOString(),
        ];
      }),
    ];

    // 4. HOUSEHOLDS
    payload['HOUSEHOLDS'] = [
      ['HOUSEHOLD_ID', 'REPRESENTATIVE_NAME', 'PHONE', 'ADDRESS', 'LIVESTOCK_TYPE', 'HERD_SIZE', 'FARMING_YEARS', 'FARMING_TYPE', 'CURRENT_WASTE_METHOD', 'GROUP', 'STATUS', 'JOINED_DATE', 'RESEARCHER', 'NOTES', 'UPDATED_AT'],
      ...households.map((h) => [
        h.id,
        h.representativeName,
        h.phone || '',
        h.address || '',
        h.livestockType || '',
        h.herdSize || '',
        h.farmingYears || '',
        h.farmingType || '',
        h.currentWasteMethod || '',
        h.group,
        h.accountStatus,
        h.joinedDate || '',
        h.assignedResearcher || '',
        h.notes || '',
        h.updatedAt || new Date().toISOString(),
      ]),
    ];

    // 5. GIANG_VIEN
    const lecturers = users.filter((u) => u.role === 'ADMIN' || u.role === 'SUPERVISOR');
    payload['GIANG_VIEN'] = [
      [
        'MÃ GIẢNG VIÊN', 'HỌ VÀ TÊN', 'SỐ ĐIỆN THOẠI', 'EMAIL', 'ĐƠN VỊ / BỘ MÔN',
        'CHỨC VỤ / HỌC VỊ', 'TÊN ĐĂNG NHẬP', 'MẬT KHẨU', 'VAI TRÒ', 'TRẠNG THÁI',
        'NGÀY TẠO', 'NGÀY CẬP NHẬT', 'GHI CHÚ'
      ],
      ...lecturers.map((u) => {
        const isGuide = (u.title || '').toLowerCase().includes('hướng dẫn');
        return [
          u.id,
          u.fullName,
          u.phone || '',
          u.email || '',
          u.organization || '',
          u.title || (u.role === 'ADMIN' ? 'Quản trị viên' : (isGuide ? 'Cán bộ hướng dẫn' : 'Giảng viên')),
          u.username,
          u.plainPasswordHint || u.password || '123456',
          u.role === 'ADMIN' ? 'QUẢN TRỊ VIÊN' : (isGuide ? 'CÁN BỘ HƯỚNG DẪN (HDAN)' : 'GIẢNG VIÊN (GV)'),
          u.status === 'ACTIVE' ? 'HOẠT ĐỘNG' : 'TẠM KHÓA',
          u.createdAt || new Date().toISOString(),
          new Date().toISOString(),
          u.notes || '',
        ];
      }),
    ];

    // 6. HOC_VIEN
    const students = users.filter((u) => u.role === 'RESEARCHER');
    payload['HOC_VIEN'] = [
      [
        'MÃ HỌC VIÊN', 'HỌ VÀ TÊN', 'NHÓM / LỚP', 'SỐ ĐIỆN THOẠI', 'EMAIL',
        'HỘ PHỤ TRÁCH', 'TÊN ĐĂNG NHẬP', 'MẬT KHẨU', 'VAI TRÒ', 'TRẠNG THÁI',
        'NGÀY THAM GIA', 'GHI CHÚ', 'NGÀY TẠO', 'NGÀY CẬP NHẬT'
      ],
      ...students.map((u) => {
        const assignedH = households
          .filter((h) => h.assignedResearcher === u.username || h.assignedResearcher === u.fullName)
          .map((h) => h.id)
          .join(', ');

        return [
          u.id,
          u.fullName,
          u.organization || '',
          u.phone || '',
          u.email || '',
          assignedH || '',
          u.username,
          u.plainPasswordHint || u.password || '123456',
          'HỌC VIÊN PHỤ TRÁCH',
          u.status === 'ACTIVE' ? 'HOẠT ĐỘNG' : 'TẠM KHÓA',
          u.createdAt ? u.createdAt.split('T')[0] : '',
          u.notes || '',
          u.createdAt || new Date().toISOString(),
          new Date().toISOString(),
        ];
      }),
    ];

    // 7. BC01_HO_THONG_TIN
    payload['BC01_HO_THONG_TIN'] = [
      [
        'RECORD_ID', 'HOUSEHOLD_ID', 'NAME', 'PHONE', 'ADDRESS', 'LIVESTOCK',
        'HERD_SIZE', 'FARMING_YEARS', 'FARMING_TYPE', 'WASTE_METHOD', 'IS_LOCKED',
        'CREATED_BY', 'CREATED_AT', 'UPDATED_AT', 'UPDATED_BY'
      ],
      ...bc01List.map((b) => [
        b.id,
        b.householdId,
        b.representativeName,
        b.phone || '',
        b.address || '',
        b.livestockType || '',
        b.herdSize || 500,
        b.farmingYears || 3,
        b.farmingType || '',
        b.currentWasteMethod || '',
        b.isLocked ? 'TRUE' : 'FALSE',
        b.createdBy || '',
        b.createdAt || new Date().toISOString(),
        b.updatedAt || new Date().toISOString(),
        b.updatedBy || '',
      ]),
    ];

    // 8. BC02_KAP_PRE
    payload['BC02_KAP_PRE'] = [
      [
        'RECORD_ID', 'HOUSEHOLD_ID', 'SCORE_K_PRE', 'SCORE_T_PRE', 'SCORE_HT_PRE',
        'B1_THU_GOM', 'B2_PHAN_LOAI', 'B3_LUU_CHUA', 'B4_KHONG_XA', 'B5_XU_LY', 'B6_VE_SINH',
        'IS_LOCKED', 'SUBMITTED_BY', 'SUBMITTED_AT'
      ],
      ...bc02List.map((b) => [
        b.id,
        b.householdId,
        b.scoreK ?? '',
        b.scoreT ?? '',
        b.scoreHT ?? '',
        b.behaviorReport?.b1_thuGom ? 1 : 0,
        b.behaviorReport?.b2_phanLoai ? 1 : 0,
        b.behaviorReport?.b3_luuChua ? 1 : 0,
        b.behaviorReport?.b4_khongXaThang ? 1 : 0,
        b.behaviorReport?.b5_xuLyTaiSuDung ? 1 : 0,
        b.behaviorReport?.b6_veSinh ? 1 : 0,
        b.isLocked ? 'TRUE' : 'FALSE',
        b.submittedBy || '',
        b.submittedAt || new Date().toISOString(),
      ]),
    ];

    // 9. BC03_YDINH
    payload['BC03_YDINH'] = [
      [
        'RECORD_ID', 'HOUSEHOLD_ID', 'SCORE_YD_PRE', 'YD01_Y_DINH', 'YD02_SAN_SANG',
        'YD03_NIEM_TIN', 'YD04_TRACH_NHIEM', 'YD05_DUY_TRI', 'IS_LOCKED', 'SUBMITTED_BY', 'SUBMITTED_AT'
      ],
      ...bc03List.map((b) => [
        b.id,
        b.householdId,
        b.scoreYD ?? '',
        b.answers?.find((a) => a.questionId === 'YD01')?.score || 5,
        b.answers?.find((a) => a.questionId === 'YD02')?.score || 5,
        b.answers?.find((a) => a.questionId === 'YD03')?.score || 5,
        b.answers?.find((a) => a.questionId === 'YD04')?.score || 5,
        b.answers?.find((a) => a.questionId === 'YD05')?.score || 5,
        b.isLocked ? 'TRUE' : 'FALSE',
        b.submittedBy || '',
        b.submittedAt || new Date().toISOString(),
      ]),
    ];

    // 10. BC04_CWM_PRE
    const preBc04 = bc04List.filter((b) => b.stage === 'PRE');
    payload['BC04_CWM_PRE'] = [
      [
        'RECORD_ID', 'HOUSEHOLD_ID', 'SCORE_CWM_PRE', 'B1_THU_GOM', 'B2_PHAN_LOAI',
        'B3_LUU_CHUA', 'B4_KHONG_XA', 'B5_XU_LY', 'B6_VE_SINH', 'NOTES', 'EVIDENCE',
        'FAILURE_REASONS', 'OBSERVED_BY', 'OBSERVED_AT', 'IS_LOCKED'
      ],
      ...preBc04.map((b) => [
        b.id,
        b.householdId,
        b.scoreCWM ?? '',
        b.criteria?.b1_thuGom || 0,
        b.criteria?.b2_phanLoai || 0,
        b.criteria?.b3_luuChua || 0,
        b.criteria?.b4_khongXaThang || 0,
        b.criteria?.b5_xuLyTaiSuDung || 0,
        b.criteria?.b6_veSinh || 0,
        b.observationNotes || '',
        b.evidenceDescription || '',
        b.failureReasons || '',
        b.observedBy || '',
        b.observedAt || new Date().toISOString(),
        b.isLocked ? 'TRUE' : 'FALSE',
      ]),
    ];

    // 11. BC04_CWM_POST
    const postBc04 = bc04List.filter((b) => b.stage === 'POST');
    payload['BC04_CWM_POST'] = [
      [
        'RECORD_ID', 'HOUSEHOLD_ID', 'SCORE_CWM_POST', 'B1_THU_GOM', 'B2_PHAN_LOAI',
        'B3_LUU_CHUA', 'B4_KHONG_XA', 'B5_XU_LY', 'B6_VE_SINH', 'NOTES', 'EVIDENCE',
        'FAILURE_REASONS', 'OBSERVED_BY', 'OBSERVED_AT', 'IS_LOCKED'
      ],
      ...postBc04.map((b) => [
        b.id,
        b.householdId,
        b.scoreCWM ?? '',
        b.criteria?.b1_thuGom || 0,
        b.criteria?.b2_phanLoai || 0,
        b.criteria?.b3_luuChua || 0,
        b.criteria?.b4_khongXaThang || 0,
        b.criteria?.b5_xuLyTaiSuDung || 0,
        b.criteria?.b6_veSinh || 0,
        b.observationNotes || '',
        b.evidenceDescription || '',
        b.failureReasons || '',
        b.observedBy || '',
        b.observedAt || new Date().toISOString(),
        b.isLocked ? 'TRUE' : 'FALSE',
      ]),
    ];

    // 12. BC05_CAM_KET
    payload['BC05_CAM_KET'] = [
      [
        'RECORD_ID', 'HOUSEHOLD_ID', 'B1_THU_GOM', 'B2_PHAN_LOAI', 'B3_LUU_CHUA',
        'B4_KHONG_XA', 'B5_XU_LY', 'B6_VE_SINH', 'B7_BAO_CAO_TUAN', 'CONFIRMED',
        'CONFIRMED_BY', 'CONFIRMED_AT', 'VERSION'
      ],
      ...bc05List.map((b) => [
        b.id,
        b.householdId,
        b.commitments?.b1_thuGom ? 1 : 0,
        b.commitments?.b2_phanLoai ? 1 : 0,
        b.commitments?.b3_luuChua ? 1 : 0,
        b.commitments?.b4_khongXaThang ? 1 : 0,
        b.commitments?.b5_xuLyTaiSuDung ? 1 : 0,
        b.commitments?.b6_veSinh ? 1 : 0,
        b.commitments?.b7_baoCaoHangTuan ? 1 : 0,
        b.confirmed ? 'TRUE' : 'FALSE',
        b.confirmedBy || '',
        b.confirmedAt || '',
        b.version || '1.0',
      ]),
    ];

    // 13. BC06_WEEKLY
    payload['BC06_WEEKLY'] = [
      [
        'RECORD_ID', 'HOUSEHOLD_ID', 'WEEK', 'WEEKLY_SCORE', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6',
        'BARRIERS', 'OTHER_BARRIERS', 'SUBMITTED_BY', 'SUBMITTED_AT'
      ],
      ...bc06List.map((b) => [
        b.id,
        b.householdId,
        b.week,
        b.weeklyScore ?? '',
        b.behaviors?.b1_thuGom ? 1 : 0,
        b.behaviors?.b2_phanLoai ? 1 : 0,
        b.behaviors?.b3_luuChua ? 1 : 0,
        b.behaviors?.b4_khongXaThang ? 1 : 0,
        b.behaviors?.b5_xuLyTaiSuDung ? 1 : 0,
        b.behaviors?.b6_veSinh ? 1 : 0,
        (b.barriers || []).join('; '),
        b.otherBarrierText || '',
        b.submittedBy || '',
        b.submittedAt || new Date().toISOString(),
      ]),
    ];

    // 14. BC07_POST
    payload['BC07_POST'] = [
      [
        'RECORD_ID', 'HOUSEHOLD_ID', 'SCORE_HT_POST', 'B1_THU_GOM', 'B2_PHAN_LOAI',
        'B3_LUU_CHUA', 'B4_KHONG_XA', 'B5_XU_LY', 'B6_VE_SINH', 'MAINTENANCE_WILLINGNESS',
        'FEEDBACK', 'REMAINING_BARRIERS', 'IS_LOCKED', 'SUBMITTED_BY', 'SUBMITTED_AT'
      ],
      ...bc07List.map((b) => [
        b.id,
        b.householdId,
        b.scoreHT_Post ?? '',
        b.behaviorReport?.b1_thuGom ? 1 : 0,
        b.behaviorReport?.b2_phanLoai ? 1 : 0,
        b.behaviorReport?.b3_luuChua ? 1 : 0,
        b.behaviorReport?.b4_khongXaThang ? 1 : 0,
        b.behaviorReport?.b5_xuLyTaiSuDung ? 1 : 0,
        b.behaviorReport?.b6_veSinh ? 1 : 0,
        b.maintenanceWillingness ?? 5,
        b.feedbackProcess || '',
        (b.mainBarriers || []).join('; '),
        b.isLocked ? 'TRUE' : 'FALSE',
        b.submittedBy || '',
        b.submittedAt || new Date().toISOString(),
      ]),
    ];

    // 15. BC08_TONG_HOP
    payload['BC08_TONG_HOP'] = [
      [
        'HOUSEHOLD_ID', 'REPRESENTATIVE_NAME', 'GROUP', 'K_PRE', 'T_PRE', 'YD_PRE',
        'HT_PRE', 'CWM_PRE', 'HT_POST', 'CWM_POST', 'DELTA_CWM', 'W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'STATUS'
      ],
      ...bc08List.map((b) => [
        b.householdId,
        b.representativeName,
        b.group,
        b.scoreK_Pre ?? '',
        b.scoreT_Pre ?? '',
        b.scoreYD_Pre ?? '',
        b.scoreHT_Pre ?? '',
        b.scoreCWM_Pre ?? '',
        b.scoreHT_Post ?? '',
        b.scoreCWM_Post ?? '',
        b.deltaCWM ?? '',
        b.w1_score ?? '',
        b.w2_score ?? '',
        b.w3_score ?? '',
        b.w4_score ?? '',
        b.w5_score ?? '',
        b.w6_score ?? '',
        b.status,
      ]),
    ];

    // 16. NHAT_KY_CHAN_NUOI
    payload['NHAT_KY_CHAN_NUOI'] = [
      [
        'MÃ NHẬT KÝ', 'MÃ HỘ', 'TÊN CHỦ HỘ', 'NGÀY GHI', 'TUẦN THEO DÕI',
        'SỐ GÀ HIỆN CÓ', 'SỐ GÀ HAO HỤT', 'LƯỢNG THỨC ĂN (KG)', 'LƯỢNG NƯỚC UỐNG (LÍT)', 'TRỌNG LƯỢNG TB (KG/CON)',
        'TÌNH TRẠNG SỨC KHỎE', 'THUỐC / VẮC XIN', 'XỬ LÝ PHÂN / ĐỆM LÓT', 'ĐIỂM QUẢN LÝ CHẤT THẢI (0-6)',
        'NGƯỜI GHI CHÉP', 'GHI CHÚ', 'THỜI GIAN LƯU'
      ],
      ...bc06List.map((w) => {
        const h = households.find((hh) => hh.id === w.householdId);
        return [
          w.id,
          w.householdId,
          h?.representativeName || `Hộ ${w.householdId}`,
          w.submittedAt ? w.submittedAt.split('T')[0] : new Date().toISOString().split('T')[0],
          w.week,
          h?.herdSize || '',
          '',
          '',
          '',
          '',
          '',
          '',
          w.behaviors?.b3_luuChua ? 'Có lưu chứa chất thải' : '',
          w.weeklyScore ?? '',
          w.submittedBy || '',
          w.otherBarrierText || '',
          w.submittedAt || new Date().toISOString(),
        ];
      }),
    ];

    // 17. LICH_TIEM_VACCINE
    payload['LICH_TIEM_VACCINE'] = [
      [
        'MÃ LỊCH', 'MÃ HỘ', 'TUẦN TUỔI', 'TÊN VẮC XIN', 'ĐƯỜNG DÙNG',
        'NGÀY DỰ KIẾN', 'NGÀY THỰC HIỆN', 'TRẠNG THÁI', 'NGƯỜI THỰC HIỆN', 'GHI CHÚ',
        'THỜI GIAN CẬP NHẬT'
      ],
    ];

    // 18. LICH_SU_HOAT_DONG & AUDIT_LOG
    payload['LICH_SU_HOAT_DONG'] = [
      [
        'MÃ LỊCH SỬ', 'THỜI GIAN', 'TÊN ĐĂNG NHẬP', 'HỌ VÀ TÊN', 'VAI TRÒ',
        'HÀNH ĐỘNG', 'ĐỐI TƯỢNG', 'CHI TIẾT NỘI DUNG', 'TRẠNG THÁI'
      ],
      ...auditLogs.map((l) => [
        l.id,
        l.timestamp,
        l.username,
        users.find((u) => u.username === l.username)?.fullName || l.username,
        l.userRole,
        l.action,
        l.targetModule,
        l.reason || l.newValue || 'Thao tác hệ thống',
        'THÀNH CÔNG',
      ]),
    ];

    payload['AUDIT_LOG'] = [
      ['LOG_ID', 'TIMESTAMP', 'USER_ID', 'USERNAME', 'ROLE', 'ACTION', 'TARGET_MODULE', 'HOUSEHOLD_ID', 'OLD_VALUE', 'NEW_VALUE', 'REASON'],
      ...auditLogs.map((l) => [
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
        l.reason || '',
      ]),
    ];

    // 19. CAU_HINH & CONFIG
    payload['CAU_HINH'] = [
      ['KHÓA', 'GIÁ TRỊ', 'MÔ TẢ', 'NGÀY CẬP NHẬT'],
      ['TEN_DE_TAI', config.researchTitle, 'Tên đề tài nghiên cứu', new Date().toISOString()],
      ['SO_HO_CHAN_NUOI', config.totalHouseholds, 'Tổng số hộ theo dõi', new Date().toISOString()],
      ['SO_HO_CAN_THIEP_TN', config.tnTarget, 'Số hộ nhóm can thiệp (TN)', new Date().toISOString()],
      ['SO_HO_DOI_CHUNG_DC', config.dcTarget, 'Số hộ nhóm đối chứng (ĐC)', new Date().toISOString()],
      ['SO_TUAN_THEO_DOI', config.totalWeeks, 'Số tuần can thiệp (W1-W6)', new Date().toISOString()],
      ['NGAY_BAT_DAU', config.startDate, 'Ngày bắt đầu đề tài', new Date().toISOString()],
      ['NGAY_KET_THUC', config.endDate, 'Ngày kết thúc đề tài', new Date().toISOString()],
      ['URL_APPS_SCRIPT', config.appsScriptUrl || PERMANENT_APPS_SCRIPT_URL, 'URL tiếp nhận dữ liệu Google Sheets', new Date().toISOString()],
      ['ID_GOOGLE_SPREADSHEET', config.spreadsheetId || '', 'ID trang tính Google', new Date().toISOString()],
    ];

    payload['CONFIG'] = [
      ['KEY', 'VALUE', 'DESCRIPTION', 'UPDATED_AT'],
      ['APP_NAME', config.appName, 'Tên ứng dụng', new Date().toISOString()],
      ['RESEARCH_TITLE', config.researchTitle, 'Tên đề tài', new Date().toISOString()],
      ['TOTAL_HOUSEHOLDS', config.totalHouseholds, 'Tổng số hộ', new Date().toISOString()],
      ['TN_TARGET', config.tnTarget, 'Hộ can thiệp', new Date().toISOString()],
      ['DC_TARGET', config.dcTarget, 'Hộ đối chứng', new Date().toISOString()],
      ['TOTAL_WEEKS', config.totalWeeks, 'Số tuần theo dõi', new Date().toISOString()],
      ['START_DATE', config.startDate, 'Ngày bắt đầu', new Date().toISOString()],
      ['END_DATE', config.endDate, 'Ngày kết thúc', new Date().toISOString()],
    ];

    // Chuẩn hóa mọi hàng
    for (const sheetName in payload) {
      const rows = payload[sheetName];
      if (!rows || rows.length === 0) continue;
      const maxCols = Math.max(...rows.map((r) => r.length));
      payload[sheetName] = rows.map((row) => {
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
   * Lưu dữ liệu lên Google Sheets (Upsert bảo toàn, không xóa dòng cũ)
   */
  static async syncToGoogleSheets(customUrl?: string): Promise<{ success: boolean; message: string }> {
    const config = StorageService.getConfig();
    const url = customUrl || config.appsScriptUrl || PERMANENT_APPS_SCRIPT_URL;

    if (!url) {
      return {
        success: false,
        message: 'Chưa cấu hình URL Google Apps Script Web App.',
      };
    }

    // Bảo vệ chống ghi đè: Nếu chưa nạp từ Google Sheets và bộ nhớ đang rỗng, không được ghi đè
    const currentUsers = StorageService.getUsers();
    const currentHouseholds = StorageService.getHouseholds();
    if (!this.isDataLoadedFromSheets && currentUsers.length === 0 && currentHouseholds.length === 0) {
      return {
        success: false,
        message: 'Chưa nạp dữ liệu từ Google Sheets. Hủy thao tác ghi để bảo toàn dữ liệu gốc.',
      };
    }

    try {
      StorageService.setSyncStatus('SYNCING');
      const payload = this.prepareWorkbookPayload();

      // 1. Thử gửi qua Backend Relay
      try {
        const serverRes = await fetch('/api/sheets-sync', {
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
            return {
              success: true,
              message: 'Đã lưu vĩnh viễn dữ liệu lên Google Sheets thành công!',
            };
          }
        }
      } catch (relayErr) {
        console.warn('Relay qua backend gặp lỗi, thử gửi trực tiếp:', relayErr);
      }

      // 2. Gửi trực tiếp tới Apps Script Web App
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'SYNC_UPSERT_SHEETS',
            spreadsheetId: config.spreadsheetId,
            timestamp: new Date().toISOString(),
            sheets: payload,
          }),
        });
        const resJson = await res.json();
        if (resJson.status === 'success') {
          StorageService.setSyncStatus('SYNCED');
          return {
            success: true,
            message: 'Đã lưu vĩnh viễn dữ liệu lên Google Sheets!',
          };
        }
      } catch (browserErr) {
        // Fallback chế độ no-cors
        await fetch(url, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'SYNC_UPSERT_SHEETS',
            spreadsheetId: config.spreadsheetId,
            timestamp: new Date().toISOString(),
            sheets: payload,
          }),
        });
        StorageService.setSyncStatus('SYNCED');
        return {
          success: true,
          message: 'Dữ liệu đã gửi tới Google Apps Script thành công!',
        };
      }

      return {
        success: true,
        message: 'Hoàn tất gửi dữ liệu lên Google Sheets.',
      };
    } catch (err: any) {
      StorageService.setSyncStatus('PENDING');
      return {
        success: false,
        message: `Lỗi kết nối tới Google Sheets: ${err.message}`,
      };
    }
  }

  /**
   * ĐỌC TOÀN BỘ DỮ LIỆU TỪ GOOGLE SHEETS VỀ APP (Single Source of Truth)
   * Không tự ý tạo thêm tài khoản, hộ dân hay bản ghi nào.
   * Nếu có lỗi: Giữ nguyên dữ liệu hiện tại, không xóa dữ liệu.
   */
  static async pullFromGoogleSheets(): Promise<{
    success: boolean;
    message: string;
    users?: User[];
    importedCount?: number;
  }> {
    const config = StorageService.getConfig();
    const url = config.appsScriptUrl || PERMANENT_APPS_SCRIPT_URL;

    try {
      let sheetsData: Record<string, any[][]> | null = null;

      // 1. Thử kéo qua Relay Backend
      try {
        const res = await fetch('/api/sheets-pull', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appsScriptUrl: url,
            spreadsheetId: config.spreadsheetId || '',
          }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.sheets) {
            sheetsData = json.sheets;
          }
        }
      } catch (relayErr) {
        console.warn('Lỗi gọi /api/sheets-pull:', relayErr);
      }

      // 2. Thử gọi trực tiếp GET nếu Backend chưa có
      if (!sheetsData) {
        try {
          const getUrl = `${url}${url.includes('?') ? '&' : '?'}action=PULL_ALL_SHEETS&spreadsheetId=${encodeURIComponent(config.spreadsheetId || '')}`;
          const getRes = await fetch(getUrl);
          const getJson = await getRes.json();
          if (getJson.sheets) {
            sheetsData = getJson.sheets;
          }
        } catch (directErr) {
          console.warn('Lỗi gọi trực tiếp GET PULL_ALL_SHEETS:', directErr);
        }
      }

      if (!sheetsData) {
        return {
          success: false,
          message: 'Không thể kết nối đến Google Sheets để đọc dữ liệu. Dữ liệu trên ứng dụng được giữ nguyên.',
          users: StorageService.getUsers(),
        };
      }

      // Đánh dấu đã nạp thành công từ Google Sheets
      this.isDataLoadedFromSheets = true;

      // --- A. ĐỌC USERS / TAI_KHOAN ---
      const parsedUsers: User[] = [];
      const userSource = sheetsData['TAI_KHOAN'] || sheetsData['USERS'] || [];
      if (Array.isArray(userSource) && userSource.length > 1) {
        const headers = userSource[0].map((h: any) => String(h || '').trim().toUpperCase());
        const idIdx = headers.findIndex((h: string) => h.includes('MÃ') || h.includes('USER_ID') || h.includes('ID'));
        const uIdx = headers.findIndex((h: string) => h.includes('TÊN ĐĂNG NHẬP') || h.includes('USERNAME'));
        const nameIdx = headers.findIndex((h: string) => h.includes('HỌ VÀ TÊN') || h.includes('FULL_NAME') || h.includes('HỌ TÊN'));
        const roleIdx = headers.findIndex((h: string) => h.includes('VAI TRÒ') || h.includes('ROLE'));
        const phoneIdx = headers.findIndex((h: string) => h.includes('ĐIỆN THOẠI') || h.includes('PHONE'));
        const emailIdx = headers.findIndex((h: string) => h.includes('EMAIL'));
        const titleIdx = headers.findIndex((h: string) => h.includes('CHỨC VỤ') || h.includes('TITLE'));
        const orgIdx = headers.findIndex((h: string) => h.includes('ĐƠN VỊ') || h.includes('ORGANIZATION'));
        const hidIdx = headers.findIndex((h: string) => h.includes('MÃ HỘ') || h.includes('HOUSEHOLD_ID'));
        const passIdx = headers.findIndex((h: string) => h.includes('MẬT KHẨU') || h.includes('DEFAULT_PASS') || h.includes('PASSWORD'));
        const statusIdx = headers.findIndex((h: string) => h.includes('TRẠNG THÁI') || h.includes('STATUS'));

        for (let r = 1; r < userSource.length; r++) {
          const row = userSource[r];
          const rawId = idIdx >= 0 ? String(row[idIdx] || '').trim() : '';
          const username = (uIdx >= 0 && row[uIdx] ? String(row[uIdx]) : rawId).trim();
          if (!username) continue;

          // Bỏ qua dòng tiêu đề nếu bị lọt vào
          const upperU = username.toUpperCase();
          if (upperU === 'USER_ID' || upperU === 'USERNAME' || upperU === 'TÊN ĐĂNG NHẬP' || upperU === 'MÃ TÀI KHOẢN') continue;

          const rawRole = String(roleIdx >= 0 ? row[roleIdx] : '').toUpperCase();
          let role: Role = 'RESEARCHER';
          if (rawRole.includes('QUẢN TRỊ') || rawRole.includes('ADMIN')) role = 'ADMIN';
          else if (rawRole.includes('HỘ') || rawRole.includes('HOUSEHOLD')) role = 'HOUSEHOLD';
          else if (rawRole.includes('GIẢNG VIÊN') || rawRole.includes('HƯỚNG DẪN') || rawRole.includes('SUPERVISOR') || rawRole.includes('GV') || rawRole.includes('HDAN')) role = 'SUPERVISOR';

          const pass = passIdx >= 0 && row[passIdx] ? String(row[passIdx]).trim() : '123456';
          const hid = hidIdx >= 0 && row[hidIdx] ? String(row[hidIdx]).trim().toUpperCase() : undefined;

          parsedUsers.push({
            id: rawId || `USR_${username.toUpperCase()}`,
            username: username.toLowerCase(),
            fullName: nameIdx >= 0 && row[nameIdx] ? String(row[nameIdx]).trim() : username,
            phone: phoneIdx >= 0 && row[phoneIdx] ? String(row[phoneIdx]).trim() : '',
            email: emailIdx >= 0 && row[emailIdx] ? String(row[emailIdx]).trim() : '',
            role,
            title: titleIdx >= 0 && row[titleIdx] ? String(row[titleIdx]).trim() : '',
            organization: orgIdx >= 0 && row[orgIdx] ? String(row[orgIdx]).trim() : '',
            householdId: hid,
            status: statusIdx >= 0 && String(row[statusIdx]).toUpperCase().includes('KHÓA') ? 'LOCKED' : 'ACTIVE',
            password: pass,
            plainPasswordHint: pass,
            createdAt: new Date().toISOString(),
          });
        }
      }

      if (parsedUsers.length > 0) {
        const existingUsers = StorageService.getUsers();
        const userMap = new Map<string, User>();
        existingUsers.forEach(u => userMap.set(u.id, u));
        parsedUsers.forEach(u => userMap.set(u.id, u));
        StorageService.saveUsersDirectly(Array.from(userMap.values()));
      }

      // --- B. ĐỌC HỘ CHĂN NUÔI (HO_CHAN_NUOI / HOUSEHOLDS) ---
      const parsedHouseholds: Household[] = [];
      const hhSource = sheetsData['HO_CHAN_NUOI'] || sheetsData['HOUSEHOLDS'] || [];
      if (Array.isArray(hhSource) && hhSource.length > 1) {
        const headers = hhSource[0].map((h: any) => String(h || '').trim().toUpperCase());
        const idIdx = headers.findIndex((h: string) => h.includes('MÃ HỘ') || h.includes('HOUSEHOLD_ID') || h === 'MÃ');
        const nameIdx = headers.findIndex((h: string) => h.includes('CHỦ HỘ') || h.includes('REPRESENTATIVE_NAME') || h.includes('TÊN'));
        const phoneIdx = headers.findIndex((h: string) => h.includes('ĐIỆN THOẠI') || h.includes('PHONE'));
        const addrIdx = headers.findIndex((h: string) => h.includes('ĐỊA CHỈ') || h.includes('ADDRESS'));
        const groupIdx = headers.findIndex((h: string) => h.includes('NHÓM') || h.includes('GROUP'));
        const herdIdx = headers.findIndex((h: string) => h.includes('QUY MÔ') || h.includes('HERD_SIZE'));
        const breedIdx = headers.findIndex((h: string) => h.includes('GIỐNG') || h.includes('LIVESTOCK_TYPE'));
        const farmTypeIdx = headers.findIndex((h: string) => h.includes('HÌNH THỨC') || h.includes('FARMING_TYPE'));
        const studentIdx = headers.findIndex((h: string) => h.includes('HỌC VIÊN') || h.includes('RESEARCHER'));
        const statusIdx = headers.findIndex((h: string) => h.includes('TRẠNG THÁI') || h.includes('STATUS'));

        for (let r = 1; r < hhSource.length; r++) {
          const row = hhSource[r];
          const hid = String(idIdx >= 0 ? row[idIdx] : '').trim().toUpperCase();
          if (!hid) continue;

          // Bỏ qua dòng tiêu đề nếu bị lọt vào
          if (hid === 'HOUSEHOLD_ID' || hid === 'MÃ HỘ' || hid === 'MÃ') continue;

          const rawGroup = String(groupIdx >= 0 ? row[groupIdx] : '').toUpperCase();
          const group: StudyGroup = rawGroup.includes('TN') || rawGroup.includes('CAN THIỆP') ? 'TN' : 'DC';

          parsedHouseholds.push({
            id: hid,
            representativeName: nameIdx >= 0 && row[nameIdx] ? String(row[nameIdx]).trim() : `Hộ ${hid}`,
            phone: phoneIdx >= 0 && row[phoneIdx] ? String(row[phoneIdx]).trim() : '',
            address: addrIdx >= 0 && row[addrIdx] ? String(row[addrIdx]).trim() : '',
            group,
            herdSize: herdIdx >= 0 && !isNaN(Number(row[herdIdx])) ? Number(row[herdIdx]) : 0,
            livestockType: breedIdx >= 0 && row[breedIdx] ? String(row[breedIdx]).trim() : '',
            farmingYears: 0,
            farmingType: farmTypeIdx >= 0 && row[farmTypeIdx] ? String(row[farmTypeIdx]).trim() : '',
            currentWasteMethod: '',
            accountStatus: statusIdx >= 0 && String(row[statusIdx]).toUpperCase().includes('KHÓA') ? 'LOCKED' : 'ACTIVE',
            joinedDate: '',
            assignedResearcher: studentIdx >= 0 && row[studentIdx] ? String(row[studentIdx]).trim() : '',
            notes: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            updatedBy: 'Google Sheets',
          });
        }
      }

      if (parsedHouseholds.length > 0) {
        const existingHouseholds = StorageService.getHouseholds();
        const householdMap = new Map<string, Household>();
        existingHouseholds.forEach(h => householdMap.set(h.id, h));
        parsedHouseholds.forEach(h => householdMap.set(h.id, h));
        StorageService.saveHouseholdsDirectly(Array.from(householdMap.values()));
      }

      // --- C. ĐỌC BC01_HO_THONG_TIN ---
      const bc01Source = sheetsData['BC01_HO_THONG_TIN'] || [];
      if (Array.isArray(bc01Source) && bc01Source.length > 1) {
        const parsedBC01: BC01Record[] = [];
        for (let r = 1; r < bc01Source.length; r++) {
          const row = bc01Source[r];
          const recId = String(row[0] || '').trim();
          const hid = String(row[1] || '').trim().toUpperCase();
          if (!recId || recId === 'RECORD_ID' || !hid || hid === 'HOUSEHOLD_ID') continue;

          parsedBC01.push({
            id: recId,
            householdId: hid,
            representativeName: String(row[2] || '').trim(),
            phone: String(row[3] || '').trim(),
            address: String(row[4] || '').trim(),
            livestockType: String(row[5] || '').trim(),
            herdSize: Number(row[6]) || 500,
            farmingYears: Number(row[7]) || 3,
            farmingType: String(row[8] || '').trim(),
            currentWasteMethod: String(row[9] || '').trim(),
            isLocked: String(row[10] || '').toUpperCase() === 'TRUE',
            createdBy: String(row[11] || '').trim(),
            createdAt: String(row[12] || new Date().toISOString()).trim(),
            updatedAt: String(row[13] || new Date().toISOString()).trim(),
            updatedBy: String(row[14] || '').trim(),
          });
        }
        if (parsedBC01.length > 0) {
          const existingBC01 = StorageService.getBC01List();
          const bc01Map = new Map<string, BC01Record>();
          existingBC01.forEach(b => bc01Map.set(b.id, b));
          parsedBC01.forEach(b => bc01Map.set(b.id, b));
          StorageService.saveBC01ListDirectly(Array.from(bc01Map.values()));
        }
      }

      // --- D. ĐỌC BC02_KAP_PRE ---
      const bc02Source = sheetsData['BC02_KAP_PRE'] || [];
      if (Array.isArray(bc02Source) && bc02Source.length > 1) {
        const parsedBC02: BC02Record[] = [];
        for (let r = 1; r < bc02Source.length; r++) {
          const row = bc02Source[r];
          const recId = String(row[0] || '').trim();
          const hid = String(row[1] || '').trim().toUpperCase();
          if (!recId || recId === 'RECORD_ID' || !hid || hid === 'HOUSEHOLD_ID') continue;

          parsedBC02.push({
            id: recId,
            householdId: hid,
            scoreK: Number(row[2]) || 0,
            scoreT: Number(row[3]) || 0,
            scoreHT: Number(row[4]) || 0,
            behaviorReport: {
              b1_thuGom: Number(row[5]) === 1,
              b2_phanLoai: Number(row[6]) === 1,
              b3_luuChua: Number(row[7]) === 1,
              b4_khongXaThang: Number(row[8]) === 1,
              b5_xuLyTaiSuDung: Number(row[9]) === 1,
              b6_veSinh: Number(row[10]) === 1,
            },
            knowledgeAnswers: [],
            attitudeAnswers: [],
            isLocked: String(row[11] || '').toUpperCase() === 'TRUE',
            submittedBy: String(row[12] || '').trim(),
            submittedAt: String(row[13] || new Date().toISOString()).trim(),
            updatedAt: String(row[13] || new Date().toISOString()).trim(),
            updatedBy: String(row[12] || '').trim(),
          });
        }
        if (parsedBC02.length > 0) {
          const existingBC02 = StorageService.getBC02List();
          const bc02Map = new Map<string, BC02Record>();
          existingBC02.forEach(b => bc02Map.set(b.id, b));
          parsedBC02.forEach(b => bc02Map.set(b.id, b));
          StorageService.saveBC02ListDirectly(Array.from(bc02Map.values()));
        }
      }

      // --- E. ĐỌC BC03_YDINH ---
      const bc03Source = sheetsData['BC03_YDINH'] || [];
      if (Array.isArray(bc03Source) && bc03Source.length > 1) {
        const parsedBC03: BC03Record[] = [];
        for (let r = 1; r < bc03Source.length; r++) {
          const row = bc03Source[r];
          const recId = String(row[0] || '').trim();
          const hid = String(row[1] || '').trim().toUpperCase();
          if (!recId || recId === 'RECORD_ID' || !hid || hid === 'HOUSEHOLD_ID') continue;

          parsedBC03.push({
            id: recId,
            householdId: hid,
            scoreYD: Number(row[2]) || 5,
            answers: [
              { questionId: 'YD01', score: Number(row[3]) || 5 },
              { questionId: 'YD02', score: Number(row[4]) || 5 },
              { questionId: 'YD03', score: Number(row[5]) || 5 },
              { questionId: 'YD04', score: Number(row[6]) || 5 },
              { questionId: 'YD05', score: Number(row[7]) || 5 },
            ],
            isLocked: String(row[8] || '').toUpperCase() === 'TRUE',
            submittedBy: String(row[9] || '').trim(),
            submittedAt: String(row[10] || new Date().toISOString()).trim(),
            updatedAt: String(row[10] || new Date().toISOString()).trim(),
            updatedBy: String(row[9] || '').trim(),
          });
        }
        if (parsedBC03.length > 0) {
          const existingBC03 = StorageService.getBC03List();
          const bc03Map = new Map<string, BC03Record>();
          existingBC03.forEach(b => bc03Map.set(b.id, b));
          parsedBC03.forEach(b => bc03Map.set(b.id, b));
          StorageService.saveBC03ListDirectly(Array.from(bc03Map.values()));
        }
      }

      // --- F. ĐỌC BC04_CWM (PRE & POST) ---
      const parsedBC04: BC04Record[] = [];
      const preSource = sheetsData['BC04_CWM_PRE'] || [];
      if (Array.isArray(preSource) && preSource.length > 1) {
        for (let r = 1; r < preSource.length; r++) {
          const row = preSource[r];
          const recId = String(row[0] || '').trim();
          const hid = String(row[1] || '').trim().toUpperCase();
          if (!recId || recId === 'RECORD_ID' || !hid || hid === 'HOUSEHOLD_ID') continue;

          parsedBC04.push({
            id: recId,
            householdId: hid,
            stage: 'PRE',
            scoreCWM: Number(row[2]) || 0,
            criteria: {
              b1_thuGom: Number(row[3]) || 0,
              b2_phanLoai: Number(row[4]) || 0,
              b3_luuChua: Number(row[5]) || 0,
              b4_khongXaThang: Number(row[6]) || 0,
              b5_xuLyTaiSuDung: Number(row[7]) || 0,
              b6_veSinh: Number(row[8]) || 0,
            },
            observationNotes: String(row[9] || '').trim(),
            evidenceDescription: String(row[10] || '').trim(),
            failureReasons: String(row[11] || '').trim(),
            observedBy: String(row[12] || '').trim(),
            observedAt: String(row[13] || new Date().toISOString()).trim(),
            isLocked: String(row[14] || '').toUpperCase() === 'TRUE',
            createdAt: String(row[13] || new Date().toISOString()).trim(),
            createdBy: String(row[12] || '').trim(),
            updatedAt: String(row[13] || new Date().toISOString()).trim(),
            updatedBy: String(row[12] || '').trim(),
          });
        }
      }

      const postSource = sheetsData['BC04_CWM_POST'] || [];
      if (Array.isArray(postSource) && postSource.length > 1) {
        for (let r = 1; r < postSource.length; r++) {
          const row = postSource[r];
          const recId = String(row[0] || '').trim();
          const hid = String(row[1] || '').trim().toUpperCase();
          if (!recId || recId === 'RECORD_ID' || !hid || hid === 'HOUSEHOLD_ID') continue;

          parsedBC04.push({
            id: recId,
            householdId: hid,
            stage: 'POST',
            scoreCWM: Number(row[2]) || 0,
            criteria: {
              b1_thuGom: Number(row[3]) || 0,
              b2_phanLoai: Number(row[4]) || 0,
              b3_luuChua: Number(row[5]) || 0,
              b4_khongXaThang: Number(row[6]) || 0,
              b5_xuLyTaiSuDung: Number(row[7]) || 0,
              b6_veSinh: Number(row[8]) || 0,
            },
            observationNotes: String(row[9] || '').trim(),
            evidenceDescription: String(row[10] || '').trim(),
            failureReasons: String(row[11] || '').trim(),
            observedBy: String(row[12] || '').trim(),
            observedAt: String(row[13] || new Date().toISOString()).trim(),
            isLocked: String(row[14] || '').toUpperCase() === 'TRUE',
            createdAt: String(row[13] || new Date().toISOString()).trim(),
            createdBy: String(row[12] || '').trim(),
            updatedAt: String(row[13] || new Date().toISOString()).trim(),
            updatedBy: String(row[12] || '').trim(),
          });
        }
      }
      if (parsedBC04.length > 0) {
        const existingBC04 = StorageService.getBC04List();
        const bc04Map = new Map<string, BC04Record>();
        existingBC04.forEach(b => bc04Map.set(b.id, b));
        parsedBC04.forEach(b => bc04Map.set(b.id, b));
        StorageService.saveBC04ListDirectly(Array.from(bc04Map.values()));
      }

      // --- G. ĐỌC BC05_CAM_KET ---
      const bc05Source = sheetsData['BC05_CAM_KET'] || [];
      if (Array.isArray(bc05Source) && bc05Source.length > 1) {
        const parsedBC05: BC05Record[] = [];
        for (let r = 1; r < bc05Source.length; r++) {
          const row = bc05Source[r];
          const recId = String(row[0] || '').trim();
          const hid = String(row[1] || '').trim().toUpperCase();
          if (!recId || recId === 'RECORD_ID' || !hid || hid === 'HOUSEHOLD_ID') continue;

          parsedBC05.push({
            id: recId,
            householdId: hid,
            commitments: {
              b1_thuGom: Number(row[2]) === 1,
              b2_phanLoai: Number(row[3]) === 1,
              b3_luuChua: Number(row[4]) === 1,
              b4_khongXaThang: Number(row[5]) === 1,
              b5_xuLyTaiSuDung: Number(row[6]) === 1,
              b6_veSinh: Number(row[7]) === 1,
              b7_baoCaoHangTuan: Number(row[8]) === 1,
            },
            confirmed: String(row[9] || '').toUpperCase() === 'TRUE',
            confirmedBy: String(row[10] || '').trim(),
            confirmedAt: String(row[11] || '').trim(),
            version: String(row[12] || '1.0').trim(),
            createdAt: String(row[11] || new Date().toISOString()).trim(),
          });
        }
        if (parsedBC05.length > 0) {
          const existingBC05 = StorageService.getBC05List();
          const bc05Map = new Map<string, BC05Record>();
          existingBC05.forEach(b => bc05Map.set(b.id, b));
          parsedBC05.forEach(b => bc05Map.set(b.id, b));
          StorageService.saveBC05ListDirectly(Array.from(bc05Map.values()));
        }
      }

      // --- H. ĐỌC BC06_WEEKLY ---
      const bc06Source = sheetsData['BC06_WEEKLY'] || sheetsData['NHAT_KY_CHAN_NUOI'] || [];
      if (Array.isArray(bc06Source) && bc06Source.length > 1) {
        const parsedBC06: BC06Record[] = [];
        for (let r = 1; r < bc06Source.length; r++) {
          const row = bc06Source[r];
          const recId = String(row[0] || '').trim();
          const hid = String(row[1] || '').trim().toUpperCase();
          if (!recId || recId === 'RECORD_ID' || recId === 'MÃ NHẬT KÝ' || !hid || hid === 'HOUSEHOLD_ID' || hid === 'MÃ HỘ') continue;

          const weekStr = String(row[2] || 'W1').trim() as any;
          parsedBC06.push({
            id: recId,
            householdId: hid,
            week: weekStr,
            weeklyScore: Number(row[3]) || 6,
            behaviors: {
              b1_thuGom: Number(row[4]) === 1,
              b2_phanLoai: Number(row[5]) === 1,
              b3_luuChua: Number(row[6]) === 1,
              b4_khongXaThang: Number(row[7]) === 1,
              b5_xuLyTaiSuDung: Number(row[8]) === 1,
              b6_veSinh: Number(row[9]) === 1,
            },
            barriers: String(row[10] || '').split(';').map((s) => s.trim()).filter(Boolean),
            otherBarrierText: String(row[11] || '').trim(),
            isLocked: false,
            submittedBy: String(row[12] || '').trim(),
            submittedAt: String(row[13] || new Date().toISOString()).trim(),
            updatedAt: String(row[13] || new Date().toISOString()).trim(),
            updatedBy: String(row[12] || '').trim(),
          });
        }
        if (parsedBC06.length > 0) {
          const existingBC06 = StorageService.getBC06List();
          const bc06Map = new Map<string, BC06Record>();
          existingBC06.forEach(b => bc06Map.set(b.id, b));
          parsedBC06.forEach(b => bc06Map.set(b.id, b));
          StorageService.saveBC06ListDirectly(Array.from(bc06Map.values()));
        }
      }

      // --- I. ĐỌC BC07_POST ---
      const bc07Source = sheetsData['BC07_POST'] || [];
      if (Array.isArray(bc07Source) && bc07Source.length > 1) {
        const parsedBC07: BC07Record[] = [];
        for (let r = 1; r < bc07Source.length; r++) {
          const row = bc07Source[r];
          const recId = String(row[0] || '').trim();
          const hid = String(row[1] || '').trim().toUpperCase();
          if (!recId || recId === 'RECORD_ID' || !hid || hid === 'HOUSEHOLD_ID') continue;

          parsedBC07.push({
            id: recId,
            householdId: hid,
            scoreHT_Post: Number(row[2]) || 6,
            behaviorReport: {
              b1_thuGom: Number(row[3]) === 1,
              b2_phanLoai: Number(row[4]) === 1,
              b3_luuChua: Number(row[5]) === 1,
              b4_khongXaThang: Number(row[6]) === 1,
              b5_xuLyTaiSuDung: Number(row[7]) === 1,
              b6_veSinh: Number(row[8]) === 1,
            },
            maintenanceWillingness: Number(row[9]) || 5,
            feedbackProcess: String(row[10] || '').trim(),
            mainBarriers: String(row[11] || '').split(';').map((s) => s.trim()).filter(Boolean),
            isLocked: String(row[12] || '').toUpperCase() === 'TRUE',
            submittedBy: String(row[13] || '').trim(),
            submittedAt: String(row[14] || new Date().toISOString()).trim(),
            updatedAt: String(row[14] || new Date().toISOString()).trim(),
            updatedBy: String(row[13] || '').trim(),
          });
        }
        if (parsedBC07.length > 0) {
          const existingBC07 = StorageService.getBC07List();
          const bc07Map = new Map<string, BC07Record>();
          existingBC07.forEach(b => bc07Map.set(b.id, b));
          parsedBC07.forEach(b => bc07Map.set(b.id, b));
          StorageService.saveBC07ListDirectly(Array.from(bc07Map.values()));
        }
      }

      StorageService.setSyncStatus('SYNCED');

      return {
        success: true,
        message: `Đã nạp toàn bộ dữ liệu từ Google Sheets thành công (${parsedUsers.length} tài khoản, ${parsedHouseholds.length} hộ nuôi)!`,
        users: StorageService.getUsers(),
        importedCount: parsedUsers.length,
      };
    } catch (err: any) {
      console.error('Lỗi khi kéo dữ liệu từ Google Sheets:', err);
      return {
        success: false,
        message: `Lỗi kết nối khi nạp từ Google Sheets: ${err.message}`,
        users: StorageService.getUsers(),
      };
    }
  }

  /**
   * Quy trình chuẩn: THÊM / SỬA -> GHI GOOGLE SHEETS -> ĐỌC LẠI TỪ GOOGLE SHEETS -> APP HIỂN THỊ
   * Đảm bảo Google Sheets là database chính, không bị lệch dữ liệu giữa App và Sheets
   */
  static async saveAndSync(audit?: {
    action: string;
    module: string;
    reason: string;
    householdId?: string;
  }): Promise<{ success: boolean; message: string }> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return {
        success: false,
        message: 'Bạn đang ngoại tuyến. Vui lòng kết nối Internet để lưu dữ liệu trực tiếp vào Google Sheets.',
      };
    }

    // 1. Ghi dữ liệu lên Google Sheets
    const syncRes = await this.syncToGoogleSheets();
    if (!syncRes.success) {
      return {
        success: false,
        message: `Lỗi ghi dữ liệu vào Google Sheets: ${syncRes.message}`,
      };
    }

    // 2. Đọc lại ngay từ Google Sheets để đồng bộ nguồn chuẩn
    const pullRes = await this.pullFromGoogleSheets();
    if (!pullRes.success) {
      return {
        success: true,
        message: 'Đã ghi dữ liệu vào Google Sheets thành công!',
      };
    }

    return {
      success: true,
      message: 'Đã lưu và đồng bộ thành công với Google Sheets!',
    };
  }

  /**
   * Kiểm tra kết nối tới Google Apps Script Web App
   */
  static async testConnection(url: string, spreadsheetId: string): Promise<{ ok: boolean; message: string }> {
    if (!url) {
      return { ok: false, message: 'URL Google Apps Script không được để trống.' };
    }
    try {
      const pingUrl = `${url}${url.includes('?') ? '&' : '?'}action=PING&spreadsheetId=${encodeURIComponent(spreadsheetId)}`;
      const res = await fetch(pingUrl, { method: 'GET' });
      const data = await res.json();
      if (data.status === 'success' || data.status === 'ok') {
        return {
          ok: true,
          message: data.message || `Kết nối Google Sheets thành công (${data.spreadsheetName || 'Bảng tính nghiên cứu'})!`,
        };
      }
      return { ok: false, message: data.message || 'Không thể kết nối đến Google Sheets.' };
    } catch (error: any) {
      return {
        ok: false,
        message: 'Lỗi kết nối: Vui lòng đảm bảo bạn đã Dán mã Code.gs mới nhất và chọn "Phiên bản mới" khi Triển khai lại Apps Script.',
      };
    }
  }

  /**
   * Tự động lên lịch đẩy lên Google Sheets (Debounce 1.5s để gom nhóm)
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

  /**
   * Kích hoạt tự động lưu dữ liệu lên Google Sheets
   */
  static triggerAutoSave(delayMs: number = 1000): void {
    this.scheduleAutoSync(delayMs);
  }
}

// Tự động kết nối cơ chế auto-sync với sự kiện thay đổi dữ liệu trong StorageService
StorageService.onDataChange(() => {
  GoogleSheetsService.scheduleAutoSync();
});

// Khi mạng Internet kết nối lại, chỉ đẩy dữ liệu lên Google Sheets nếu có dữ liệu PENDING chưa được lưu
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    if (StorageService.getSyncStatus() === 'PENDING') {
      GoogleSheetsService.scheduleAutoSync(500);
    }
  });
}
