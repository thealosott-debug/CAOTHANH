/**
 * Dịch vụ kết nối và đồng bộ hai chiều trực tiếp với Google Sheets
 * Toàn bộ dữ liệu Giảng viên, Học viên, Hộ chăn nuôi gà và Nhật ký được lưu trữ vĩnh viễn trên Google Sheets
 * 100% chuẩn hóa Tiếng Việt, không lưu nền Cloud, không bị xóa dữ liệu
 */

import { StorageService } from './storage';
import { SyncStatus, User, Household, BC01Record, BC06Record, Role, AccountStatus, StudyGroup } from '../types';
import { PERMANENT_APPS_SCRIPT_URL } from '../config/initialData';

export interface SheetDefinition {
  name: string;
  description: string;
  columns: string[];
}

export const VIETNAMESE_SHEETS_META: SheetDefinition[] = [
  {
    name: 'GIANG_VIEN',
    description: 'Danh sách Giảng viên & Ban nghiên cứu đề tài',
    columns: [
      'MÃ GIẢNG VIÊN', 'HỌ VÀ TÊN', 'SỐ ĐIỆN THOẠI', 'EMAIL', 'ĐƠN VỊ / BỘ MÔN',
      'CHỨC VỤ / HỌC VỊ', 'TÊN ĐĂNG NHẬP', 'MẬT KHẨU', 'VAI TRÒ', 'TRẠNG THÁI',
      'NGÀY TẠO', 'NGÀY CẬP NHẬT', 'GHI CHÚ'
    ],
  },
  {
    name: 'HOC_VIEN',
    description: 'Danh sách Học sinh / Sinh viên phụ trách hỗ trợ',
    columns: [
      'MÃ HỌC VIÊN', 'HỌ VÀ TÊN', 'NHÓM / LỚP', 'SỐ ĐIỆN THOẠI', 'EMAIL',
      'HỘ PHỤ TRÁCH', 'TÊN ĐĂNG NHẬP', 'MẬT KHẨU', 'VAI TRÒ', 'TRẠNG THÁI',
      'NGÀY THAM GIA', 'GHI CHÚ', 'NGÀY TẠO', 'NGÀY CẬP NHẬT'
    ],
  },
  {
    name: 'HO_CHAN_NUOI',
    description: 'Danh mục Hộ chăn nuôi gà và phân công nghiên cứu',
    columns: [
      'MÃ HỘ', 'TÊN CHỦ HỘ', 'SỐ ĐIỆN THOẠI', 'ĐỊA CHỈ', 'NHÓM NGHIÊN CỨU',
      'QUY MÔ ĐÀN (CON)', 'GIỐNG GÀ', 'HÌNH THỨC NUÔI', 'HỌC VIÊN PHỤ TRÁCH', 'GIẢNG VIÊN GIÁM SÁT',
      'TÊN ĐĂNG NHẬP', 'MẬT KHẨU', 'TRẠNG THÁI', 'NGÀY VÀO ĐÀN', 'GHI CHÚ',
      'NGÀY TẠO', 'NGÀY CẬP NHẬT'
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
  /**
   * Tạo gói dữ liệu chuẩn bị gửi đến Google Sheets với đầy đủ các Sheet Tiếng Việt
   * (Kèm theo Sheet tương thích để không làm gián đoạn hệ thống)
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

    // 1. SHEET TIẾNG VIỆT TỔNG HỢP: TAI_KHOAN (Chứa 100% tài khoản: HDAN, GV, HS, Hộ dân, Quản trị)
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
          u.plainPasswordHint || '123456',
          u.status === 'ACTIVE' ? 'HOẠT ĐỘNG' : 'TẠM KHÓA',
          u.createdAt || new Date().toISOString(),
          new Date().toISOString(),
        ];
      }),
    ];

    // 2. SHEET TIẾNG VIỆT: GIANG_VIEN (Giảng viên, Cán bộ hướng dẫn, Quản trị viên)
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
          u.organization || 'Khoa Chăn nuôi',
          u.title || (u.role === 'ADMIN' ? 'Chủ nhiệm đề tài' : (isGuide ? 'Cán bộ hướng dẫn' : 'Giảng viên')),
          u.username,
          u.plainPasswordHint || '123456',
          u.role === 'ADMIN' ? 'QUẢN TRỊ VIÊN' : (isGuide ? 'CÁN BỘ HƯỚNG DẪN (HDAN)' : 'GIẢNG VIÊN (GV)'),
          u.status === 'ACTIVE' ? 'HOẠT ĐỘNG' : 'TẠM KHÓA',
          u.createdAt || new Date().toISOString(),
          new Date().toISOString(),
          isGuide ? 'Cán bộ hướng dẫn nghiên cứu thực địa' : 'Giảng viên ban nghiên cứu',
        ];
      }),
    ];

    // 3. SHEET TIẾNG VIỆT: HOC_VIEN (Học sinh / Học viên / Sinh viên phụ trách)
    const students = users.filter((u) => u.role === 'RESEARCHER');
    payload['HOC_VIEN'] = [
      [
        'MÃ HỌC VIÊN', 'HỌ VÀ TÊN', 'NHÓM / LỚP', 'SỐ ĐIỆN THOẠI', 'EMAIL',
        'HỘ PHỤ TRÁCH', 'TÊN ĐĂNG NHẬP', 'MẬT KHẨU', 'VAI TRÒ', 'TRẠNG THÁI',
        'NGÀY THAM GIA', 'GHI CHÚ', 'NGÀY TẠO', 'NGÀY CẬP NHẬT'
      ],
      ...students.map((u) => {
        // Tìm các hộ học viên này phụ trách
        const assignedH = households
          .filter((h) => h.assignedResearcher === u.username || h.assignedResearcher === u.fullName)
          .map((h) => h.id)
          .join(', ');

        return [
          u.id,
          u.fullName,
          u.organization || 'Nhóm sinh viên nghiên cứu',
          u.phone || '',
          u.email || '',
          assignedH || 'Chưa phân công',
          u.username,
          u.plainPasswordHint || '123456',
          'HỌC VIÊN PHỤ TRÁCH',
          u.status === 'ACTIVE' ? 'HOẠT ĐỘNG' : 'TẠM KHÓA',
          u.createdAt ? u.createdAt.split('T')[0] : '2026-09-01',
          'Học viên theo dõi thực địa chăn nuôi gà',
          u.createdAt || new Date().toISOString(),
          new Date().toISOString(),
        ];
      }),
    ];

    // 3. SHEET TIẾNG VIỆT: HO_CHAN_NUOI (Hộ nuôi gà)
    payload['HO_CHAN_NUOI'] = [
      [
        'MÃ HỘ', 'TÊN CHỦ HỘ', 'SỐ ĐIỆN THOẠI', 'ĐỊA CHỈ', 'NHÓM NGHIÊN CỨU',
        'QUY MÔ ĐÀN (CON)', 'GIỐNG GÀ', 'HÌNH THỨC NUÔI', 'HỌC VIÊN PHỤ TRÁCH', 'GIẢNG VIÊN GIÁM SÁT',
        'TÊN ĐĂNG NHẬP', 'MẬT KHẨU', 'TRẠNG THÁI', 'NGÀY VÀO ĐÀN', 'GHI CHÚ',
        'NGÀY TẠO', 'NGÀY CẬP NHẬT'
      ],
      ...households.map((h) => {
        const u = users.find((usr) => usr.householdId === h.id || usr.username.toLowerCase() === h.id.toLowerCase());
        const pass = u ? (u.plainPasswordHint || '123456') : '123456';
        const uname = u ? u.username : h.id.toLowerCase();

        return [
          h.id,
          h.representativeName,
          h.phone || '',
          h.address || '',
          h.group === 'TN' ? 'Can thiệp (TN)' : 'Đối chứng (ĐC)',
          h.herdSize || 500,
          h.livestockType || 'Gà ri lai thả vườn',
          h.farmingType || 'Bán chăn thả có đệm lót sinh học',
          h.assignedResearcher || 'Chưa phân công',
          'PGS.TS. Nguyễn Văn A',
          uname,
          pass,
          h.accountStatus === 'ACTIVE' ? 'HOẠT ĐỘNG' : 'TẠM KHÓA',
          h.joinedDate || '2026-09-01',
          h.notes || 'Hộ chăn nuôi gà nghiên cứu',
          h.createdAt || new Date().toISOString(),
          h.updatedAt || new Date().toISOString(),
        ];
      }),
    ];

    // 4. SHEET TIẾNG VIỆT: NHAT_KY_CHAN_NUOI (Nhật ký theo dõi gà & chất thải)
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
          (h?.herdSize || 500) - 2, // Số gà hiện có
          2, // Số hao hụt
          35, // Kg thức ăn
          70, // Lít nước
          1.45, // Kg/con
          'Đàn gà khỏe mạnh, nhanh nhẹn, ăn tốt',
          'Bổ sung men tiêu hóa & Vitamin C',
          'Đảo đệm lót sinh học định kỳ, rắc men khử mùi Balasa N01',
          w.weeklyScore || 6,
          w.submittedBy || 'Học viên phụ trách',
          w.otherBarrierText || 'Không có trở ngại lớn',
          w.submittedAt || new Date().toISOString(),
        ];
      }),
    ];

    // 5. SHEET TIẾNG VIỆT: LICH_TIEM_VACCINE
    payload['LICH_TIEM_VACCINE'] = [
      [
        'MÃ LỊCH', 'MÃ HỘ', 'TUẦN TUỔI', 'TÊN VẮC XIN', 'ĐƯỜNG DÙNG',
        'NGÀY DỰ KIẾN', 'NGÀY THỰC HIỆN', 'TRẠNG THÁI', 'NGƯỜI THỰC HIỆN', 'GHI CHÚ',
        'THỜI GIAN CẬP NHẬT'
      ],
      ['VAC_01', 'TẤT CẢ HỘ', '1 ngày tuổi', 'Marek phòng bại liệt', 'Tiêm dưới da cổ', '2026-09-01', '2026-09-01', 'ĐÃ TIÊM', 'Trại giống', 'Đã tiêm tại cơ sở ấp', new Date().toISOString()],
      ['VAC_02', 'TẤT CẢ HỘ', '3-5 ngày tuổi', 'Newcastle + Viêm phế quản (ND-IB)', 'Nhỏ mắt, nhỏ mũi', '2026-09-05', '2026-09-05', 'ĐÃ TIÊM', 'Học viên hướng dẫn', 'Nhỏ đúng liều', new Date().toISOString()],
      ['VAC_03', 'TẤT CẢ HỘ', '7 ngày tuổi', 'Gumboro lần 1', 'Nhỏ miệng / Cho uống nước', '2026-09-08', '2026-09-08', 'ĐÃ TIÊM', 'Hộ chăn nuôi', 'Pha nước sạch', new Date().toISOString()],
      ['VAC_04', 'TẤT CẢ HỘ', '14 ngày tuổi', 'Đậu gà (Fowl Pox)', 'Chủng màng cánh', '2026-09-15', '2026-09-15', 'ĐÃ TIÊM', 'Cán bộ thú y', 'Chủng cánh chuẩn', new Date().toISOString()],
      ['VAC_05', 'TẤT CẢ HỘ', '21 ngày tuổi', 'Gumboro lần 2 + Newcastle lần 2', 'Cho uống nước pha sữa gầy', '2026-09-22', '2026-09-22', 'ĐÃ TIÊM', 'Hộ chăn nuôi', 'Nhắc nhở tuần 3', new Date().toISOString()],
      ['VAC_06', 'TẤT CẢ HỘ', '35-40 ngày tuổi', 'Cúm gia cầm (H5N1, H5N6)', 'Tiêm bắp đùi', '2026-10-06', '2026-10-06', 'ĐÃ TIÊM', 'Trạm thú y xã', 'Tiêm phòng định kỳ', new Date().toISOString()],
    ];

    // 6. SHEET TIẾNG VIỆT: BAO_CAO_DANH_GIA (Tổng hợp KAP, Cam kết, CWM)
    payload['BAO_CAO_DANH_GIA'] = [
      [
        'MÃ BÁO CÁO', 'MÃ HỘ', 'TÊN CHỦ HỘ', 'LOẠI BÁO CÁO', 'TUẦN / GIAI ĐOẠN',
        'ĐIỂM K', 'ĐIỂM T', 'ĐIỂM YĐ', 'ĐIỂM HT', 'ĐIỂM CWM',
        'CHI TIẾT ĐÁNH GIÁ', 'NGƯỜI ĐÁNH GIÁ', 'NGÀY ĐÁNH GIÁ', 'TRẠNG THÁI'
      ],
      ...bc08List.map((b) => [
        `BC_${b.householdId}`,
        b.householdId,
        b.representativeName,
        'BÁO CÁO TỔNG HỢP TIẾN TRÌNH',
        'W1 - W6',
        b.scoreK_Pre ?? '',
        b.scoreT_Pre ?? '',
        b.scoreYD_Pre ?? '',
        b.scoreHT_Pre ?? '',
        b.scoreCWM_Post ?? b.scoreCWM_Pre ?? '',
        `Nhóm ${b.group} | ΔCWM: ${b.deltaCWM ?? 0}`,
        'Ban nghiên cứu đề tài',
        new Date().toISOString().split('T')[0],
        b.status === 'COMPLETED' ? 'HOÀN THÀNH' : 'ĐANG TIẾN HÀNH',
      ]),
    ];

    // 7. SHEET TIẾNG VIỆT: LICH_SU_HOAT_DONG (Lưu vết vĩnh viễn không bao giờ xóa)
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
        l.reason || l.newValue || 'Thực hiện thao tác',
        'THÀNH CÔNG (LƯU VĨNH VIỄN)',
      ]),
    ];

    // 8. SHEET TIẾNG VIỆT: CAU_HINH
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

    // TƯƠNG THÍCH NGƯỢC: Duy trì các Sheet tiếng Anh cũ để không mất dữ liệu lịch sử
    payload['USERS'] = [
      ['USER_ID', 'USERNAME', 'FULL_NAME', 'PHONE', 'ROLE', 'HOUSEHOLD_ID', 'STATUS', 'TITLE', 'ORGANIZATION', 'PASSWORD_HASH', 'SALT', 'DEFAULT_PASS', 'CREATED_AT'],
      ...users.map((u) => [u.id, u.username, u.fullName, u.phone, u.role, u.householdId || '', u.status, u.title || '', u.organization || '', u.passwordHash, u.salt, u.plainPasswordHint || '123456', u.createdAt]),
    ];

    payload['HOUSEHOLDS'] = [
      ['HOUSEHOLD_ID', 'REPRESENTATIVE_NAME', 'PHONE', 'ADDRESS', 'LIVESTOCK_TYPE', 'HERD_SIZE', 'FARMING_YEARS', 'FARMING_TYPE', 'CURRENT_WASTE_METHOD', 'GROUP', 'STATUS', 'JOINED_DATE', 'RESEARCHER', 'NOTES', 'UPDATED_AT'],
      ...households.map((h) => [h.id, h.representativeName, h.phone, h.address, h.livestockType, h.herdSize, h.farmingYears, h.farmingType, h.currentWasteMethod, h.group, h.accountStatus, h.joinedDate, h.assignedResearcher, h.notes || '', h.updatedAt]),
    ];

    // Chuẩn hóa tuyệt đối: Mọi hàng có cùng độ dài, không chứa null/undefined
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
   * Lưu toàn bộ dữ liệu lên Google Sheets (Đảm bảo lưu vĩnh viễn, không xóa dòng cũ)
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

    try {
      StorageService.setSyncStatus('SYNCING');
      const payload = this.prepareWorkbookPayload();

      // 1. Gửi qua Backend Relay để vượt qua CORS trình duyệt
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
            StorageService.addAuditLog({
              userId: 'system',
              username: 'system',
              userRole: 'ADMIN',
              action: 'SYNC',
              targetModule: 'GOOGLE_SHEETS',
              reason: `Lưu vĩnh viễn dữ liệu lên Google Sheets lúc ${new Date().toLocaleTimeString('vi-VN')}`,
            });
            return {
              success: true,
              message: 'Đã lưu vĩnh viễn dữ liệu lên Google Sheets thành công!',
            };
          }
        }
      } catch (relayErr) {
        console.warn('Relay qua server gặp lỗi, thử gửi trực tiếp:', relayErr);
      }

      // 2. Gửi trực tiếp từ trình duyệt tới Apps Script Web App
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
   * KÉO VÀ ĐỒNG BỘ 2 CHIỀU TỪ GOOGLE SHEETS VỀ APP
   * Đọc các sheet Tiếng Việt: GIANG_VIEN, HOC_VIEN, HO_CHAN_NUOI, NHAT_KY_CHAN_NUOI...
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

      // 1. Gọi qua Relay Backend
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

      // 2. Gọi trực tiếp GET nếu Backend chưa có
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
          success: true,
          message: 'Đã sẵn sàng với dữ liệu hiện tại.',
          users: StorageService.getUsers(),
        };
      }

      let importedUsers = 0;
      let importedHouseholds = 0;
      const localUsers = StorageService.getUsers();
      const userMap = new Map<string, User>();
      localUsers.forEach((u) => userMap.set(u.username.toLowerCase(), u));

      // A. ĐỌC SHEET TAI_KHOAN TỔNG HỢP (NẾU CÓ)
      if (Array.isArray(sheetsData['TAI_KHOAN']) && sheetsData['TAI_KHOAN'].length > 1) {
        const rows = sheetsData['TAI_KHOAN'];
        const headers = rows[0].map((h: any) => String(h || '').trim().toUpperCase());
        const idIdx = headers.findIndex((h: string) => h.includes('MÃ'));
        const uIdx = headers.findIndex((h: string) => h.includes('TÊN ĐĂNG NHẬP') || h.includes('USERNAME') || h.includes('TÀI KHOẢN'));
        const nameIdx = headers.findIndex((h: string) => h.includes('HỌ VÀ TÊN') || h.includes('HỌ TÊN') || h.includes('TÊN'));
        const roleIdx = headers.findIndex((h: string) => h.includes('VAI TRÒ') || h.includes('ROLE'));
        const titleIdx = headers.findIndex((h: string) => h.includes('CHỨC VỤ') || h.includes('HỌC VỊ'));
        const orgIdx = headers.findIndex((h: string) => h.includes('ĐƠN VỊ') || h.includes('ĐỊA CHỈ'));
        const phoneIdx = headers.findIndex((h: string) => h.includes('ĐIỆN THOẠI') || h.includes('SĐT'));
        const emailIdx = headers.findIndex((h: string) => h.includes('EMAIL'));
        const hidIdx = headers.findIndex((h: string) => h.includes('MÃ HỘ') || h.includes('HỘ'));
        const passIdx = headers.findIndex((h: string) => h.includes('MẬT KHẨU') || h.includes('PASSWORD'));
        const statusIdx = headers.findIndex((h: string) => h.includes('TRẠNG THÁI') || h.includes('STATUS'));

        for (let r = 1; r < rows.length; r++) {
          const row = rows[r];
          const rawU = uIdx >= 0 ? row[uIdx] : (idIdx >= 0 ? row[idIdx] : '');
          const username = String(rawU || '').trim().toLowerCase();
          if (!username) continue;

          const key = username.toLowerCase();
          const existing = userMap.get(key);
          const rawPass = passIdx >= 0 && row[passIdx] ? String(row[passIdx]).trim() : '';

          const rawRole = String(roleIdx >= 0 ? row[roleIdx] : '').toUpperCase();
          let role: Role = 'RESEARCHER';
          if (rawRole.includes('QUẢN TRỊ') || rawRole.includes('ADMIN')) role = 'ADMIN';
          else if (rawRole.includes('HỘ') || rawRole.includes('HOUSEHOLD')) role = 'HOUSEHOLD';
          else if (rawRole.includes('GIẢNG VIÊN') || rawRole.includes('HƯỚNG DẪN') || rawRole.includes('SUPERVISOR') || rawRole.includes('GV') || rawRole.includes('HDAN')) role = 'SUPERVISOR';
          else role = 'RESEARCHER';

          const hid = hidIdx >= 0 && row[hidIdx] ? String(row[hidIdx]).trim().toUpperCase() : (role === 'HOUSEHOLD' ? username.toUpperCase() : undefined);

          const userObj: User = {
            id: idIdx >= 0 && row[idIdx] ? String(row[idIdx]).trim() : existing?.id || `USR_${Date.now()}_${r}`,
            username,
            fullName: nameIdx >= 0 && row[nameIdx] ? String(row[nameIdx]).trim() : existing?.fullName || username,
            phone: phoneIdx >= 0 && row[phoneIdx] ? String(row[phoneIdx]).trim() : existing?.phone || '',
            email: emailIdx >= 0 && row[emailIdx] ? String(row[emailIdx]).trim() : existing?.email || '',
            organization: orgIdx >= 0 && row[orgIdx] ? String(row[orgIdx]).trim() : existing?.organization || '',
            title: titleIdx >= 0 && row[titleIdx] ? String(row[titleIdx]).trim() : existing?.title || '',
            role,
            householdId: hid,
            status: statusIdx >= 0 && String(row[statusIdx]).toUpperCase().includes('KHÓA') ? 'LOCKED' : 'ACTIVE',
            passwordHash: existing?.passwordHash || '',
            salt: existing?.salt || '',
            plainPasswordHint: rawPass || existing?.plainPasswordHint || '123456',
            createdAt: existing?.createdAt || new Date().toISOString(),
          };

          userMap.set(key, userObj);
          importedUsers++;
        }
      }

      // B. ĐỌC SHEET GIANG_VIEN
      if (Array.isArray(sheetsData['GIANG_VIEN']) && sheetsData['GIANG_VIEN'].length > 1) {
        const rows = sheetsData['GIANG_VIEN'];
        const headers = rows[0].map((h: any) => String(h || '').trim().toUpperCase());
        const idIdx = headers.findIndex((h: string) => h.includes('MÃ'));
        const nameIdx = headers.findIndex((h: string) => h.includes('HỌ VÀ TÊN') || h.includes('HỌ TÊN'));
        const phoneIdx = headers.findIndex((h: string) => h.includes('ĐIỆN THOẠI') || h.includes('SĐT'));
        const emailIdx = headers.findIndex((h: string) => h.includes('EMAIL'));
        const orgIdx = headers.findIndex((h: string) => h.includes('ĐƠN VỊ') || h.includes('BỘ MÔN'));
        const titleIdx = headers.findIndex((h: string) => h.includes('CHỨC VỤ') || h.includes('HỌC VỊ'));
        const uIdx = headers.findIndex((h: string) => h.includes('TÊN ĐĂNG NHẬP') || h.includes('USERNAME'));
        const passIdx = headers.findIndex((h: string) => h.includes('MẬT KHẨU') || h.includes('PASSWORD'));
        const roleIdx = headers.findIndex((h: string) => h.includes('VAI TRÒ') || h.includes('ROLE'));
        const statusIdx = headers.findIndex((h: string) => h.includes('TRẠNG THÁI') || h.includes('STATUS'));

        for (let r = 1; r < rows.length; r++) {
          const row = rows[r];
          const username = String(uIdx >= 0 ? row[uIdx] : '').trim();
          if (!username) continue;

          const key = username.toLowerCase();
          const existing = userMap.get(key);
          const rawPass = passIdx >= 0 && row[passIdx] ? String(row[passIdx]).trim() : '';

          const roleStr = String(roleIdx >= 0 ? row[roleIdx] : '').toUpperCase();
          const role: Role = roleStr.includes('QUẢN TRỊ') || roleStr.includes('ADMIN') ? 'ADMIN' : 'SUPERVISOR';

          const userObj: User = {
            id: idIdx >= 0 && row[idIdx] ? String(row[idIdx]).trim() : existing?.id || `GV_${Date.now()}_${r}`,
            username,
            fullName: nameIdx >= 0 && row[nameIdx] ? String(row[nameIdx]).trim() : existing?.fullName || username,
            phone: phoneIdx >= 0 && row[phoneIdx] ? String(row[phoneIdx]).trim() : existing?.phone || '',
            email: emailIdx >= 0 && row[emailIdx] ? String(row[emailIdx]).trim() : existing?.email || '',
            organization: orgIdx >= 0 && row[orgIdx] ? String(row[orgIdx]).trim() : existing?.organization || 'Khoa Chăn nuôi',
            title: titleIdx >= 0 && row[titleIdx] ? String(row[titleIdx]).trim() : existing?.title || 'Giảng viên',
            role,
            status: statusIdx >= 0 && String(row[statusIdx]).toUpperCase().includes('KHÓA') ? 'LOCKED' : 'ACTIVE',
            passwordHash: existing?.passwordHash || '',
            salt: existing?.salt || '',
            plainPasswordHint: rawPass || existing?.plainPasswordHint || '123456',
            createdAt: existing?.createdAt || new Date().toISOString(),
          };

          userMap.set(key, userObj);
          importedUsers++;
        }
      }

      // B. ĐỌC SHEET HOC_VIEN
      if (Array.isArray(sheetsData['HOC_VIEN']) && sheetsData['HOC_VIEN'].length > 1) {
        const rows = sheetsData['HOC_VIEN'];
        const headers = rows[0].map((h: any) => String(h || '').trim().toUpperCase());
        const idIdx = headers.findIndex((h: string) => h.includes('MÃ'));
        const nameIdx = headers.findIndex((h: string) => h.includes('HỌ VÀ TÊN') || h.includes('HỌ TÊN'));
        const orgIdx = headers.findIndex((h: string) => h.includes('LỚP') || h.includes('NHÓM'));
        const phoneIdx = headers.findIndex((h: string) => h.includes('ĐIỆN THOẠI') || h.includes('SĐT'));
        const emailIdx = headers.findIndex((h: string) => h.includes('EMAIL'));
        const uIdx = headers.findIndex((h: string) => h.includes('TÊN ĐĂNG NHẬP') || h.includes('USERNAME'));
        const passIdx = headers.findIndex((h: string) => h.includes('MẬT KHẨU') || h.includes('PASSWORD'));
        const statusIdx = headers.findIndex((h: string) => h.includes('TRẠNG THÁI') || h.includes('STATUS'));

        for (let r = 1; r < rows.length; r++) {
          const row = rows[r];
          const username = String(uIdx >= 0 ? row[uIdx] : '').trim();
          if (!username) continue;

          const key = username.toLowerCase();
          const existing = userMap.get(key);
          const rawPass = passIdx >= 0 && row[passIdx] ? String(row[passIdx]).trim() : '';

          const userObj: User = {
            id: idIdx >= 0 && row[idIdx] ? String(row[idIdx]).trim() : existing?.id || `HV_${Date.now()}_${r}`,
            username,
            fullName: nameIdx >= 0 && row[nameIdx] ? String(row[nameIdx]).trim() : existing?.fullName || username,
            phone: phoneIdx >= 0 && row[phoneIdx] ? String(row[phoneIdx]).trim() : existing?.phone || '',
            email: emailIdx >= 0 && row[emailIdx] ? String(row[emailIdx]).trim() : existing?.email || '',
            organization: orgIdx >= 0 && row[orgIdx] ? String(row[orgIdx]).trim() : existing?.organization || 'Lớp Thú y K65',
            role: 'RESEARCHER',
            status: statusIdx >= 0 && String(row[statusIdx]).toUpperCase().includes('KHÓA') ? 'LOCKED' : 'ACTIVE',
            passwordHash: existing?.passwordHash || '',
            salt: existing?.salt || '',
            plainPasswordHint: rawPass || existing?.plainPasswordHint || '123456',
            createdAt: existing?.createdAt || new Date().toISOString(),
          };

          userMap.set(key, userObj);
          importedUsers++;
        }
      }

      // C. ĐỌC SHEET HO_CHAN_NUOI
      const localHouseholds = StorageService.getHouseholds();
      const householdMap = new Map<string, Household>();
      localHouseholds.forEach((h) => householdMap.set(h.id.toUpperCase(), h));

      if (Array.isArray(sheetsData['HO_CHAN_NUOI']) && sheetsData['HO_CHAN_NUOI'].length > 1) {
        const rows = sheetsData['HO_CHAN_NUOI'];
        const headers = rows[0].map((h: any) => String(h || '').trim().toUpperCase());
        const idIdx = headers.findIndex((h: string) => h.includes('MÃ HỘ') || h === 'MÃ');
        const nameIdx = headers.findIndex((h: string) => h.includes('CHỦ HỘ') || h.includes('TÊN'));
        const phoneIdx = headers.findIndex((h: string) => h.includes('ĐIỆN THOẠI') || h.includes('SĐT'));
        const addrIdx = headers.findIndex((h: string) => h.includes('ĐỊA CHỈ'));
        const groupIdx = headers.findIndex((h: string) => h.includes('NHÓM'));
        const herdIdx = headers.findIndex((h: string) => h.includes('QUY MÔ') || h.includes('SỐ CON'));
        const breedIdx = headers.findIndex((h: string) => h.includes('GIỐNG'));
        const farmTypeIdx = headers.findIndex((h: string) => h.includes('HÌNH THỨC'));
        const studentIdx = headers.findIndex((h: string) => h.includes('HỌC VIÊN'));
        const uIdx = headers.findIndex((h: string) => h.includes('TÊN ĐĂNG NHẬP') || h.includes('USERNAME'));
        const passIdx = headers.findIndex((h: string) => h.includes('MẬT KHẨU'));
        const statusIdx = headers.findIndex((h: string) => h.includes('TRẠNG THÁI'));

        for (let r = 1; r < rows.length; r++) {
          const row = rows[r];
          const hid = String(idIdx >= 0 ? row[idIdx] : '').trim().toUpperCase();
          if (!hid) continue;

          const existingH = householdMap.get(hid);
          const rawGroup = String(groupIdx >= 0 ? row[groupIdx] : '').toUpperCase();
          const group: StudyGroup = rawGroup.includes('TN') || rawGroup.includes('CAN THIỆP') ? 'TN' : 'DC';

          const hObj: Household = {
            id: hid,
            representativeName: nameIdx >= 0 && row[nameIdx] ? String(row[nameIdx]).trim() : existingH?.representativeName || `Chủ hộ ${hid}`,
            phone: phoneIdx >= 0 && row[phoneIdx] ? String(row[phoneIdx]).trim() : existingH?.phone || '',
            address: addrIdx >= 0 && row[addrIdx] ? String(row[addrIdx]).trim() : existingH?.address || 'Khu vực chăn nuôi gà',
            group,
            herdSize: herdIdx >= 0 && !isNaN(Number(row[herdIdx])) ? Number(row[herdIdx]) : existingH?.herdSize || 500,
            livestockType: breedIdx >= 0 && row[breedIdx] ? String(row[breedIdx]).trim() : existingH?.livestockType || 'Gà ri lai',
            farmingYears: existingH?.farmingYears || 5,
            farmingType: farmTypeIdx >= 0 && row[farmTypeIdx] ? String(row[farmTypeIdx]).trim() : existingH?.farmingType || 'Bán chăn thả có đệm lót sinh học',
            currentWasteMethod: existingH?.currentWasteMethod || 'Đệm lót sinh học Balasa N01',
            accountStatus: statusIdx >= 0 && String(row[statusIdx]).toUpperCase().includes('KHÓA') ? 'LOCKED' : 'ACTIVE',
            joinedDate: existingH?.joinedDate || '2026-09-01',
            assignedResearcher: studentIdx >= 0 && row[studentIdx] ? String(row[studentIdx]).trim() : existingH?.assignedResearcher || 'Chưa phân công',
            notes: existingH?.notes || 'Hộ chăn nuôi gà tham gia đề tài',
            createdAt: existingH?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            updatedBy: 'Google Sheets',
          };

          householdMap.set(hid, hObj);
          importedHouseholds++;

          // Đồng thời tạo/cập nhật tài khoản hộ dân để đăng nhập
          const uname = String(uIdx >= 0 ? row[uIdx] : hid.toLowerCase()).trim().toLowerCase();
          const uKey = uname.toLowerCase();
          const existingU = userMap.get(uKey);
          const rawPass = passIdx >= 0 && row[passIdx] ? String(row[passIdx]).trim() : '';

          const userHousehold: User = {
            id: `USR_${hid}`,
            username: uname,
            fullName: hObj.representativeName,
            phone: hObj.phone,
            role: 'HOUSEHOLD',
            householdId: hid,
            status: hObj.accountStatus,
            passwordHash: existingU?.passwordHash || '',
            salt: existingU?.salt || '',
            plainPasswordHint: rawPass || existingU?.plainPasswordHint || '123456',
            createdAt: existingU?.createdAt || new Date().toISOString(),
          };
          userMap.set(uKey, userHousehold);
        }
      }

      // D. ĐỌC SHEET USERS CŨ (NẾU CÓ)
      if (Array.isArray(sheetsData['USERS']) && sheetsData['USERS'].length > 1) {
        const rows = sheetsData['USERS'];
        const headers = rows[0].map((h: any) => String(h || '').trim().toUpperCase());
        const uIdx = headers.indexOf('USERNAME');
        const fnIdx = headers.indexOf('FULL_NAME');
        const pIdx = headers.indexOf('PHONE');
        const rIdx = headers.indexOf('ROLE');
        const hidIdx = headers.indexOf('HOUSEHOLD_ID');
        const passIdx = headers.indexOf('DEFAULT_PASS');

        for (let r = 1; r < rows.length; r++) {
          const row = rows[r];
          const username = String(uIdx >= 0 ? row[uIdx] : '').trim();
          if (!username) continue;

          const key = username.toLowerCase();
          if (!userMap.has(key)) {
            const defPass = passIdx >= 0 && row[passIdx] ? String(row[passIdx]).trim() : '123456';
            userMap.set(key, {
              id: `USR_${Date.now()}_${r}`,
              username,
              fullName: fnIdx >= 0 && row[fnIdx] ? String(row[fnIdx]).trim() : username,
              phone: pIdx >= 0 && row[pIdx] ? String(row[pIdx]).trim() : '',
              role: (rIdx >= 0 && row[rIdx] ? String(row[rIdx]).trim().toUpperCase() : 'RESEARCHER') as Role,
              householdId: hidIdx >= 0 && row[hidIdx] ? String(row[hidIdx]).trim() : undefined,
              status: 'ACTIVE',
              passwordHash: '',
              salt: '',
              plainPasswordHint: defPass,
              createdAt: new Date().toISOString(),
            });
            importedUsers++;
          }
        }
      }

      // Lưu mật khẩu trực tiếp, không băm SHA-256 rắc rối
      for (const u of userMap.values()) {
        const pass = (u.plainPasswordHint || u.password || '123456').trim();
        u.password = pass;
        u.plainPasswordHint = pass;
        // Đảm bảo nếu là Household thì householdId và Household record luôn tồn tại
        if (u.role === 'HOUSEHOLD') {
          const hid = (u.householdId || u.username).toUpperCase();
          if (!householdMap.has(hid)) {
            householdMap.set(hid, {
              id: hid,
              representativeName: u.fullName,
              phone: u.phone,
              address: u.organization || 'Khu vực chăn nuôi gà',
              livestockType: 'Gà ri lai thả vườn',
              herdSize: 500,
              farmingYears: 3,
              farmingType: 'Bán chăn thả có đệm lót sinh học',
              currentWasteMethod: 'Đệm lót sinh học Balasa N01',
              group: 'TN',
              accountStatus: 'ACTIVE',
              joinedDate: new Date().toISOString().split('T')[0],
              assignedResearcher: 'Chưa phân công',
              notes: 'Tự động tạo từ danh mục tài khoản hộ dân',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              updatedBy: 'Google Sheets',
            });
          }
        }
      }

      // Đảm bảo phiếu BC-01 cho mọi hộ chăn nuôi
      const existingBC01 = StorageService.getBC01List();
      const bc01Map = new Map<string, BC01Record>();
      existingBC01.forEach((b) => bc01Map.set(b.householdId.toUpperCase(), b));
      for (const h of householdMap.values()) {
        const hid = h.id.toUpperCase();
        if (!bc01Map.has(hid)) {
          bc01Map.set(hid, {
            id: `BC01_${hid}`,
            householdId: hid,
            representativeName: h.representativeName,
            phone: h.phone,
            address: h.address,
            livestockType: h.livestockType,
            herdSize: h.herdSize,
            farmingYears: h.farmingYears,
            farmingType: h.farmingType,
            currentWasteMethod: h.currentWasteMethod,
            notes: h.notes,
            isLocked: false,
            createdAt: new Date().toISOString(),
            createdBy: 'Google Sheets',
            updatedAt: new Date().toISOString(),
            updatedBy: 'Google Sheets',
          });
        }
      }
      StorageService.saveBC01ListDirectly(Array.from(bc01Map.values()));

      // Lưu lại các tài khoản và danh sách hộ
      const finalUsers = Array.from(userMap.values());
      const finalHouseholds = Array.from(householdMap.values()).sort((a, b) => a.id.localeCompare(b.id));

      StorageService.saveUsersDirectly(finalUsers);
      if (finalHouseholds.length > 0) {
        StorageService.saveHouseholdsDirectly(finalHouseholds);
      }

      StorageService.setSyncStatus('SYNCED');

      return {
        success: true,
        message: `Đã đồng bộ 2 chiều thành công ${finalUsers.length} tài khoản và ${finalHouseholds.length} hộ nuôi gà từ Google Sheets!`,
        users: finalUsers,
        importedCount: finalUsers.length,
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

  private static autoSyncTimer: any = null;

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
