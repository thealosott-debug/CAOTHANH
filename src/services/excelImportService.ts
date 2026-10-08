/**
 * Dịch vụ xuất nhập dữ liệu Excel (XLSX, XLS, CSV) cho Hệ thống Quản lý Chăn nuôi Gà
 * Hỗ trợ nhận diện và nạp đầy đủ:
 * 1. Cán bộ Hướng dẫn (hdan)
 * 2. Giảng viên (gv) / Cán bộ nghiên cứu
 * 3. Học sinh / Học viên / Sinh viên (hs) phụ trách
 * 4. Hộ chăn nuôi gà (Hộ dân / hdan)
 * 5. Toàn bộ danh sách tài khoản tổng hợp đa bảng tính (Multi-sheets)
 * 
 * Tự động phân tích thông minh:
 * - Hỗ trợ tệp 1 sheet hoặc nhiều sheet (GIANG_VIEN, HOC_VIEN, HO_CHAN_NUOI, TAI_KHOAN...)
 * - Tự động nhận diện dòng tiêu đề kể cả khi có dòng banner ở đầu
 * - Tự động nhận diện dấu phân cách CSV (, hoặc ; hoặc tab)
 * - Tự động đồng bộ 2 chiều: tạo User, tạo Household, tạo BC-01 và đẩy lên Google Sheets
 */

import * as XLSX from 'xlsx';
import { BC01Record, Household, Role, StudyGroup, User } from '../types';
import { StorageService } from './storage';
import { GoogleSheetsService } from './googleSheets';

export type AccountCategory = 'SUPERVISOR' | 'RESEARCHER' | 'HOUSEHOLD' | 'ADMIN';

export interface ParsedHouseholdRow {
  rowNumber: number;
  sourceSheet?: string;
  id: string;
  representativeName: string;
  phone: string;
  address: string;
  livestockType: string;
  herdSize: number;
  farmingYears: number;
  farmingType: string;
  currentWasteMethod: string;
  group: StudyGroup;
  assignedResearcher: string;
  notes: string;
  password?: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ParsedUserRow {
  rowNumber: number;
  sourceSheet?: string;
  id?: string;
  username: string;
  fullName: string;
  role: Role;
  roleTitle: string; // "Cán bộ hướng dẫn (HDAN)", "Giảng viên (GV)", "Học sinh / Học viên (HS)", "Hộ chăn nuôi gà", "Quản trị viên"
  title: string;
  organization: string;
  phone: string;
  email: string;
  householdId?: string;
  password?: string;
  // Các trường bổ sung nếu dòng này là Hộ chăn nuôi
  address?: string;
  livestockType?: string;
  herdSize?: number;
  farmingType?: string;
  currentWasteMethod?: string;
  group?: StudyGroup;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface UnifiedParseResult {
  sheetNames: string[];
  totalRows: number;
  users: ParsedUserRow[];
  households: ParsedHouseholdRow[];
  counts: {
    supervisors: number; // GV + HDAN
    researchers: number; // HS + Sinh viên
    households: number;  // Hộ chăn nuôi gà
    admins: number;
    validCount: number;
    errorCount: number;
  };
}

/**
 * Chuẩn hóa chuỗi so khớp cột: không dấu, chữ thường, bỏ khoảng trắng và ký tự đặc biệt
 */
export function normalizeHeader(str: any): string {
  if (str === undefined || str === null) return '';
  return String(str)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Nhận diện vai trò linh hoạt & thông minh từ chuỗi tiếng Việt và ngữ cảnh dòng
 */
export function parseRoleString(
  rawRole: string,
  context?: {
    username?: string;
    fullName?: string;
    hasFarmFields?: boolean;
    hasAcademicFields?: boolean;
    sheetName?: string;
  }
): { role: Role; roleTitle: string } {
  const normRole = normalizeHeader(rawRole);
  const normSheet = normalizeHeader(context?.sheetName || '');
  const normUser = normalizeHeader(context?.username || '');

  // 1. Dựa trên tên Sheet nếu Sheet chỉ rõ
  if (normSheet.includes('giangvien') || normSheet === 'gv') {
    return { role: 'SUPERVISOR', roleTitle: 'Giảng viên (GV)' };
  }
  if (normSheet.includes('huongdan') || normSheet === 'hdan') {
    return { role: 'SUPERVISOR', roleTitle: 'Cán bộ hướng dẫn (HDAN)' };
  }
  if (normSheet.includes('hocvien') || normSheet.includes('hocsinh') || normSheet === 'hs' || normSheet === 'hv') {
    return { role: 'RESEARCHER', roleTitle: 'Học sinh / Học viên (HS)' };
  }
  if (normSheet.includes('hochannuoi') || normSheet.includes('channuoi') || normSheet === 'ho') {
    return { role: 'HOUSEHOLD', roleTitle: 'Hộ chăn nuôi gà' };
  }

  // 2. Dựa trên mã đăng nhập nếu có tiền tố rõ ràng
  if (normUser.startsWith('gv') || normUser.startsWith('magv')) {
    return { role: 'SUPERVISOR', roleTitle: 'Giảng viên (GV)' };
  }
  if (normUser.startsWith('hd') || normUser.startsWith('cbhd')) {
    return { role: 'SUPERVISOR', roleTitle: 'Cán bộ hướng dẫn (HDAN)' };
  }
  if (normUser.startsWith('hs') || normUser.startsWith('hv') || normUser.startsWith('sv')) {
    return { role: 'RESEARCHER', roleTitle: 'Học sinh / Học viên (HS)' };
  }
  if (/^h\d+$/.test(normUser)) {
    return { role: 'HOUSEHOLD', roleTitle: 'Hộ chăn nuôi gà' };
  }

  // 3. Quản trị viên
  if (
    normRole === 'admin' ||
    normRole.includes('quantri') ||
    normRole.includes('chunhiem') ||
    normRole.includes('truongnhom')
  ) {
    return { role: 'ADMIN', roleTitle: 'Quản trị viên (Chủ nhiệm đề tài)' };
  }

  // 4. Cán bộ Hướng dẫn (hdan)
  if (
    normRole === 'hdan' ||
    normRole === 'cbhd' ||
    normRole === 'gvhd' ||
    normRole === 'hd' ||
    normRole.includes('huongdan') ||
    normRole.includes('covan') ||
    normRole.includes('canbohuongdan') ||
    normRole.includes('nguoihuongdan')
  ) {
    // Nếu dòng có các trường chăn nuôi đặc trưng (đàn gà, giống gà, địa chỉ thôn xã) thì có thể là Hộ dân viết tắt 'hdan'
    if (context?.hasFarmFields && !context?.hasAcademicFields) {
      return { role: 'HOUSEHOLD', roleTitle: 'Hộ chăn nuôi gà' };
    }
    return { role: 'SUPERVISOR', roleTitle: 'Cán bộ hướng dẫn (HDAN)' };
  }

  // 5. Giảng viên (gv)
  if (
    normRole === 'gv' ||
    normRole.includes('giangvien') ||
    normRole.includes('giaovien') ||
    normRole.includes('thayco') ||
    normRole.includes('supervisor')
  ) {
    return { role: 'SUPERVISOR', roleTitle: 'Giảng viên (GV)' };
  }

  // 6. Hộ chăn nuôi gà / Hộ dân
  if (
    normRole === 'ho' ||
    normRole.includes('hodan') ||
    normRole.includes('hochannuoi') ||
    normRole.includes('channuoi') ||
    normRole.includes('chuho') ||
    normRole.includes('nongdan') ||
    normRole.includes('household') ||
    context?.hasFarmFields
  ) {
    return { role: 'HOUSEHOLD', roleTitle: 'Hộ chăn nuôi gà' };
  }

  // 7. Học sinh / Học viên / Sinh viên (hs)
  if (
    normRole === 'hs' ||
    normRole === 'hv' ||
    normRole === 'sv' ||
    normRole === 'ncv' ||
    normRole.includes('hocvien') ||
    normRole.includes('hocsinh') ||
    normRole.includes('sinhvien') ||
    normRole.includes('nghiencuuvien') ||
    normRole.includes('researcher')
  ) {
    return { role: 'RESEARCHER', roleTitle: 'Học sinh / Học viên (HS)' };
  }

  // Mặc định: Nếu có ngữ cảnh học hàm học vị -> Giảng viên; nếu không -> Học viên
  if (context?.hasAcademicFields) {
    return { role: 'SUPERVISOR', roleTitle: 'Giảng viên (GV)' };
  }
  return { role: 'RESEARCHER', roleTitle: 'Học sinh / Học viên (HS)' };
}

/**
 * Tìm dòng tiêu đề tốt nhất trong 15 dòng đầu
 */
function findBestHeaderRow(rawData: any[][], expectedKeywordsList: string[][]): { headerRowIndex: number; headerRow: string[] } {
  let bestRowIdx = 0;
  let maxScore = -1;

  for (let i = 0; i < Math.min(rawData.length, 15); i++) {
    const row = rawData[i];
    if (!row || !Array.isArray(row)) continue;
    const normalizedCells = row.map(normalizeHeader);

    let score = 0;
    for (const keywords of expectedKeywordsList) {
      const matched = normalizedCells.some((cell) =>
        keywords.some((k) => cell === k || (k.length >= 3 && cell.includes(k)))
      );
      if (matched) score++;
    }

    if (score > maxScore) {
      maxScore = score;
      bestRowIdx = i;
    }
  }

  const bestRow = (rawData[bestRowIdx] || []).map(normalizeHeader);
  return { headerRowIndex: bestRowIdx, headerRow: bestRow };
}

/**
 * Tìm vị trí cột dựa trên danh sách từ khóa ưu tiên
 */
function findColIdx(headerRow: string[], keywords: string[]): number {
  return headerRow.findIndex((h) =>
    keywords.some((k) => {
      if (!h) return false;
      if (h === k) return true;
      // Tránh việc từ ngắn khớp bừa bãi (như 'ma' khớp với 'channuoi' nếu không cẩn thận)
      if (k.length >= 3 && h.includes(k)) return true;
      if (k.length < 3 && (h === k || h.startsWith(k + '_') || h.startsWith(k + 'so') || h.endsWith('_' + k))) return true;
      return false;
    })
  );
}

/**
 * Tách dòng CSV hỗ trợ cả dấu phẩy, chấm phẩy, tab
 */
function parseCsvToMatrix(csvText: string): any[][] {
  // Xác định dấu phân cách phổ biến nhất ở dòng đầu tiên
  const firstLine = csvText.split('\n')[0] || '';
  let delimiter = ',';
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;

  if (semiCount > commaCount && semiCount > tabCount) delimiter = ';';
  else if (tabCount > commaCount && tabCount > semiCount) delimiter = '\t';

  const rows: any[][] = [];
  const lines = csvText.split(/\r?\n/);
  for (const line of lines) {
    if (!line.trim()) continue;
    // Tách cột đơn giản có hỗ trợ trích xuất ngoặc kép
    const parts = line.split(delimiter).map(cell => cell.replace(/^"(.*)"$/, '$1').trim());
    rows.push(parts);
  }
  return rows;
}

export class ExcelImportService {
  /**
   * Tải tệp mẫu Excel cho Hộ chăn nuôi gà (hdan)
   */
  static downloadHouseholdTemplate(): void {
    const wb = XLSX.utils.book_new();

    const headers = [
      'Mã hộ (*)',
      'Họ và tên chủ hộ (*)',
      'Số điện thoại',
      'Địa chỉ (Thôn/Xã/Huyện)',
      'Giống gà nuôi',
      'Quy mô đàn (con)',
      'Số năm chăn nuôi',
      'Hình thức nuôi',
      'Xử lý chất thải hiện tại',
      'Nhóm nghiên cứu (TN hoặc ĐC)',
      'Học viên phụ trách',
      'Mật khẩu đăng nhập',
      'Ghi chú'
    ];

    const sampleData = [
      headers,
      [
        'H01',
        'Nguyễn Văn A',
        '0912345678',
        'Thôn 1, Xã Tân Lập, Huyện Yên Định',
        'Gà ri lai thả vườn',
        500,
        4,
        'Bán chăn thả có đệm lót sinh học',
        'Đệm lót sinh học Balasa N01',
        'TN',
        'Lê Văn C',
        '123456',
        'Hộ chăn nuôi gà tiêu biểu xã Tân Lập'
      ],
      [
        'H02',
        'Trần Thị B',
        '0987654321',
        'Thôn 2, Xã Tân Lập, Huyện Yên Định',
        'Gà Mía thả vườn',
        300,
        3,
        'Bán chăn thả có đệm lót sinh học',
        'Ủ phân compost hoai mục',
        'TN',
        'Lê Văn C',
        '123456',
        'Đang vào đàn tuần thứ 2'
      ],
      [
        'H03',
        'Lê Văn C',
        '0905123456',
        'Thôn 3, Xã Định Long, Huyện Yên Định',
        'Gà Lạc Thủy',
        400,
        5,
        'Bán chăn thả chuồng hở',
        'Đệm lót sinh học Balasa N01',
        'ĐC',
        'Phạm Thị D',
        '123456',
        'Hộ thuộc nhóm đối chứng'
      ]
    ];

    const ws = XLSX.utils.aoa_to_sheet(sampleData);
    ws['!cols'] = [
      { wch: 12 }, { wch: 24 }, { wch: 16 }, { wch: 38 },
      { wch: 22 }, { wch: 18 }, { wch: 16 }, { wch: 30 },
      { wch: 28 }, { wch: 28 }, { wch: 22 }, { wch: 20 }, { wch: 30 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'HO_CHAN_NUOI');
    XLSX.writeFile(wb, 'Mau_Nhap_Ho_Chan_Nuoi_Ga.xlsx');
  }

  /**
   * Tải tệp mẫu Excel cho Giảng viên (gv) & Cán bộ Hướng dẫn (hdan) & Học sinh (hs)
   */
  static downloadResearchTeamTemplate(): void {
    const wb = XLSX.utils.book_new();

    const headers = [
      'Tên đăng nhập (*)',
      'Họ và tên (*)',
      'Vai trò (HDAN / GV / HS) (*)',
      'Học hàm / Học vị / Chức vụ',
      'Đơn vị công tác / Lớp',
      'Số điện thoại',
      'Email',
      'Mật khẩu đăng nhập'
    ];

    const sampleData = [
      headers,
      [
        'hd_mai',
        'TS. Hoàng Thị Mai',
        'Cán bộ hướng dẫn (HDAN)',
        'Cố vấn khoa học thực địa',
        'Chi cục Chăn nuôi & Thú y',
        '0912333444',
        'htmai@chicucthuy.gov.vn',
        '123456'
      ],
      [
        'gv_tuan',
        'PGS.TS. Nguyễn Văn Tuấn',
        'Giảng viên (GV)',
        'Giảng viên cao cấp',
        'Khoa Chăn nuôi Thú y',
        '0912111222',
        'nvtuan@univ.edu.vn',
        '123456'
      ],
      [
        'hs01',
        'Lê Văn C',
        'Học sinh / Học viên (HS)',
        'Sinh viên thực tập tốt nghiệp',
        'Lớp Thú y K65',
        '0988222333',
        'hs01@univ.edu.vn',
        '123456'
      ],
      [
        'hs02',
        'Phạm Thị D',
        'Học sinh / Học viên (HS)',
        'Sinh viên thực tập tốt nghiệp',
        'Lớp Chăn nuôi K66',
        '0977333444',
        'hs02@univ.edu.vn',
        '123456'
      ]
    ];

    const ws = XLSX.utils.aoa_to_sheet(sampleData);
    ws['!cols'] = [
      { wch: 18 }, { wch: 26 }, { wch: 28 }, { wch: 32 },
      { wch: 28 }, { wch: 16 }, { wch: 26 }, { wch: 20 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'CAN_BO_VA_HOC_VIEN');
    XLSX.writeFile(wb, 'Mau_Nhap_Can_Bo_Va_Hoc_Vien.xlsx');
  }

  /**
   * Tải tệp mẫu Excel tổng hợp toàn bộ tài khoản (HDAN, GV, HS, Hộ chăn nuôi, Quản trị)
   */
  static downloadCombinedTemplate(): void {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Hộ chăn nuôi gà
    const ws1 = XLSX.utils.aoa_to_sheet([
      [
        'Mã hộ (*)', 'Tên chủ hộ (*)', 'Số điện thoại', 'Địa chỉ', 'Giống gà',
        'Quy mô (con)', 'Hình thức nuôi', 'Xử lý chất thải', 'Nhóm (TN/ĐC)', 'Học viên phụ trách', 'Mật khẩu'
      ],
      ['H01', 'Nguyễn Văn A', '0912345678', 'Xã Tân Lập, Huyện Yên Định', 'Gà ri thả vườn', 500, 'Bán chăn thả có đệm lót', 'Đệm lót Balasa N01', 'TN', 'hs01', '123456'],
      ['H02', 'Trần Thị B', '0987654321', 'Xã Tân Lập, Huyện Yên Định', 'Gà Mía', 400, 'Bán chăn thả có đệm lót', 'Đệm lót Balasa N01', 'TN', 'hs01', '123456'],
      ['H03', 'Lê Văn C', '0905123456', 'Xã Định Long, Huyện Yên Định', 'Gà Lạc Thủy', 350, 'Chuồng hở', 'Ủ phân compost', 'ĐC', 'hs02', '123456'],
    ]);
    XLSX.utils.book_append_sheet(wb, ws1, 'HO_CHAN_NUOI');

    // Sheet 2: Danh sách tài khoản đầy đủ
    const ws2 = XLSX.utils.aoa_to_sheet([
      ['Tên đăng nhập (*)', 'Họ và tên (*)', 'Vai trò (HDAN / GV / HS / Hộ chăn nuôi / Quản trị) (*)', 'Mã hộ (nếu là hộ)', 'SĐT', 'Email', 'Đơn vị / Địa chỉ', 'Mật khẩu'],
      ['admin', 'Quản trị viên (Chủ nhiệm đề tài)', 'Quản trị viên', '', '0912345678', 'admin@univ.edu.vn', 'Khoa Chăn nuôi', '123456'],
      ['hd_mai', 'TS. Hoàng Thị Mai', 'Cán bộ hướng dẫn (HDAN)', '', '0912333444', 'htmai@gov.vn', 'Chi cục Thú y', '123456'],
      ['gv_tuan', 'PGS.TS. Nguyễn Văn Tuấn', 'Giảng viên (GV)', '', '0912111222', 'tuan@univ.edu.vn', 'Khoa Chăn nuôi', '123456'],
      ['hs01', 'Lê Văn C', 'Học sinh / Học viên (HS)', '', '0988222333', 'hs01@univ.edu.vn', 'Lớp Thú y K65', '123456'],
      ['hs02', 'Phạm Thị D', 'Học sinh / Học viên (HS)', '', '0977333444', 'hs02@univ.edu.vn', 'Lớp Chăn nuôi K66', '123456'],
      ['h01', 'Nguyễn Văn A', 'Hộ chăn nuôi gà', 'H01', '0912345678', '', 'Thôn 1, Xã Tân Lập', '123456'],
      ['h02', 'Trần Thị B', 'Hộ chăn nuôi gà', 'H02', '0987654321', '', 'Thôn 2, Xã Tân Lập', '123456'],
      ['h03', 'Lê Văn C', 'Hộ chăn nuôi gà', 'H03', '0905123456', '', 'Thôn 3, Xã Định Long', '123456'],
    ]);
    XLSX.utils.book_append_sheet(wb, ws2, 'TAI_KHOAN');

    XLSX.writeFile(wb, 'Mau_Tong_Hop_Tai_Khoan_GreenFarm.xlsx');
  }

  /**
   * Phân tích tệp thông minh: Quét TẤT CẢ các bảng tính (Sheets) trong tệp Excel hoặc CSV
   * Tự động gom nhóm toàn bộ: Cán bộ hướng dẫn (hdan), Giảng viên (gv), Học sinh (hs), Hộ chăn nuôi
   */
  static async parseUniversalFile(file: File): Promise<UnifiedParseResult> {
    const buffer = await file.arrayBuffer();
    let wb: XLSX.WorkBook;

    try {
      wb = XLSX.read(buffer, { type: 'array' });
    } catch {
      // Thử đọc dạng chuỗi văn bản nếu là CSV
      const textDecoder = new TextDecoder('utf-8');
      const csvStr = textDecoder.decode(buffer);
      const matrix = parseCsvToMatrix(csvStr);
      const ws = XLSX.utils.aoa_to_sheet(matrix);
      wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'CSV_DATA');
    }

    if (!wb.SheetNames || wb.SheetNames.length === 0) {
      throw new Error('Tệp không chứa bất kỳ bảng dữ liệu nào.');
    }

    const allUsers: ParsedUserRow[] = [];
    const allHouseholds: ParsedHouseholdRow[] = [];
    const seenUsernames = new Set<string>();
    const seenHouseholdIds = new Set<string>();

    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName];
      if (!ws) continue;

      let rawData: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      if (!rawData || rawData.length === 0) continue;

      // Làm sạch các dòng rỗng
      rawData = rawData.filter(r => Array.isArray(r) && r.some(c => String(c).trim() !== ''));
      if (rawData.length < 2) continue;

      const normSheet = normalizeHeader(sheetName);

      // Quyết định hướng phân tích chính của sheet:
      // A. Sheet chuyên về Hộ chăn nuôi
      const isPureHouseholdSheet =
        normSheet.includes('hochannuoi') ||
        normSheet === 'ho' ||
        normSheet.includes('channuoi') ||
        normSheet.includes('danhmucho');

      // B. Sheet chuyên về Cán bộ / Giảng viên / Học viên
      const isPureTeamSheet =
        normSheet.includes('giangvien') ||
        normSheet.includes('hocvien') ||
        normSheet.includes('canbo') ||
        normSheet === 'gv' ||
        normSheet === 'hs';

      // Định vị dòng tiêu đề
      const expectedKeywords = [
        ['tendangnhap', 'username', 'taikhoan', 'user', 'ma', 'magv', 'mahv', 'maho', 'id'],
        ['hovaten', 'hoten', 'ten', 'fullname', 'daidien', 'tenchuho', 'chuho'],
        ['vaitro', 'role', 'chucdanh', 'loaitaikhoan', 'doituong'],
        ['sodienthoai', 'dienthoai', 'sdt', 'phone', 'tel'],
        ['diachi', 'donvi', 'bomon', 'khoa', 'lop', 'organization', 'address']
      ];

      const { headerRowIndex, headerRow } = findBestHeaderRow(rawData, expectedKeywords);

      // Xác định chỉ số cột cực kỳ mềm dẻo
      const colUsername = findColIdx(headerRow, [
        'tendangnhap', 'username', 'taikhoan', 'user', 'mataikhoan',
        'magv', 'mahv', 'masv', 'mahs', 'maho', 'id', 'madinhdanh', 'ma'
      ]);
      const colName = findColIdx(headerRow, [
        'hovaten', 'hoten', 'ten', 'fullname', 'daidien', 'tenchuho', 'chuho',
        'nguoidaidien', 'chuhonongdan', 'tengv', 'tenhv', 'tenhs'
      ]);
      const colRole = findColIdx(headerRow, [
        'vaitro', 'role', 'chucdanh', 'chucvu', 'loaitaikhoan', 'loai', 'nhom', 'doituong', 'phanloai'
      ]);
      const colTitle = findColIdx(headerRow, ['hocham', 'hocvi', 'chucdanh', 'chucvu', 'title']);
      const colOrg = findColIdx(headerRow, ['donvi', 'bomon', 'khoa', 'lop', 'coquan', 'truong', 'organization']);
      const colPhone = findColIdx(headerRow, ['sodienthoai', 'dienthoai', 'sdt', 'phone', 'tel', 'didong']);
      const colEmail = findColIdx(headerRow, ['email', 'mail', 'thu']);
      const colHouseholdId = findColIdx(headerRow, ['maho', 'householdid', 'ho', 'mahochan nuoi', 'soho']);
      const colAddress = findColIdx(headerRow, ['diachi', 'thon', 'xa', 'huyen', 'address']);
      const colLivestock = findColIdx(headerRow, ['giongga', 'giong', 'loaivatnuoi', 'vatnuoi', 'loai']);
      const colHerdSize = findColIdx(headerRow, ['quymodan', 'quymo', 'soluong', 'dan', 'con', 'soga']);
      const colFarmingYears = findColIdx(headerRow, ['sonamchannuoi', 'sonam', 'kinhnghiem', 'nam']);
      const colFarmingType = findColIdx(headerRow, ['hinhthuc', 'chuong', 'hinhthucnuoi']);
      const colWasteMethod = findColIdx(headerRow, ['xulychatthai', 'chatthai', 'demlot', 'biogas', 'phuongphap']);
      const colGroup = findColIdx(headerRow, ['nhomnghiencuu', 'nhom', 'group']);
      const colResearcher = findColIdx(headerRow, ['hocvien', 'nguoinghiencuu', 'nghiencuuvien', 'phutrach', 'canbo', 'sinhvien']);
      const colPassword = findColIdx(headerRow, ['matkhau', 'password', 'pass', 'mk']);
      const colNotes = findColIdx(headerRow, ['ghichu', 'note', 'notes']);

      for (let i = headerRowIndex + 1; i < rawData.length; i++) {
        const r = rawData[i];
        if (!r || r.every((cell: any) => String(cell).trim() === '')) continue;

        const errors: string[] = [];
        const warnings: string[] = [];

        // 1. Họ và tên
        let fullName = colName >= 0 ? String(r[colName] || '').trim() : '';
        if (!fullName && colUsername >= 0 && colRole >= 0) {
          fullName = String(r[colUsername] || '').trim();
        }
        if (!fullName) {
          errors.push('Thiếu họ và tên.');
        }

        // 2. Kiểm tra xem dòng này có các trường nông trại không
        const rawLivestock = colLivestock >= 0 ? String(r[colLivestock] || '').trim() : '';
        const rawHerd = colHerdSize >= 0 ? Number(r[colHerdSize]) : NaN;
        const hasFarmFields = isPureHouseholdSheet || Boolean(rawLivestock) || !isNaN(rawHerd) || colAddress >= 0;
        const hasAcademicFields = Boolean(colTitle >= 0 && r[colTitle]) || Boolean(colOrg >= 0 && r[colOrg]);

        // 3. Nhận diện vai trò
        const rawRole = colRole >= 0 ? String(r[colRole] || '').trim() : '';
        const rawUserCandidate = colUsername >= 0 ? String(r[colUsername] || '').trim() : '';
        const { role, roleTitle } = parseRoleString(rawRole, {
          username: rawUserCandidate,
          fullName,
          hasFarmFields,
          hasAcademicFields,
          sheetName,
        });

        // 4. Tên đăng nhập
        let username = rawUserCandidate.toLowerCase();
        if (!username) {
          if (role === 'HOUSEHOLD') {
            const rawHid = colHouseholdId >= 0 ? String(r[colHouseholdId] || '').trim().toLowerCase() : '';
            if (rawHid) {
              username = rawHid;
            } else {
              const nextHNum = allHouseholds.length + 1;
              username = `h${nextHNum.toString().padStart(2, '0')}`;
              warnings.push(`Chưa có mã hộ, tự sinh tên đăng nhập: ${username}`);
            }
          } else if (fullName) {
            const cleanName = normalizeHeader(fullName);
            const prefix = role === 'SUPERVISOR' ? 'gv_' : 'hs_';
            username = `${prefix}${cleanName.slice(0, 10)}${allUsers.length + 1}`;
            warnings.push(`Chưa có tên đăng nhập, tự tạo: ${username}`);
          } else {
            username = `usr_${Date.now()}_${allUsers.length + 1}`;
            errors.push('Thiếu tên đăng nhập.');
          }
        }

        // Kiểm tra trùng username trong cùng tệp
        if (seenUsernames.has(username)) {
          // Tự thêm hậu tố số để không bị chặn
          const altUsername = `${username}_${allUsers.length + 1}`;
          warnings.push(`Tên đăng nhập "${username}" bị trùng lặp trong tệp, đã đổi thành: ${altUsername}`);
          username = altUsername;
        }
        seenUsernames.add(username);

        // 5. Số điện thoại & Email
        const phone = colPhone >= 0 ? String(r[colPhone] || '').trim().replace(/[^0-9+]/g, '') : '';
        const email = colEmail >= 0 ? String(r[colEmail] || '').trim() : '';

        // 6. Địa chỉ / Đơn vị
        const address = colAddress >= 0 && r[colAddress]
          ? String(r[colAddress]).trim()
          : (colOrg >= 0 && r[colOrg] ? String(r[colOrg]).trim() : 'Khu vực chăn nuôi gà');
        const organization = colOrg >= 0 && r[colOrg]
          ? String(r[colOrg]).trim()
          : (role === 'SUPERVISOR' ? 'Khoa Chăn nuôi Thú y' : (role === 'RESEARCHER' ? 'Lớp Thú y K65' : address));

        // 7. Học hàm / chức vụ
        const title = colTitle >= 0 && r[colTitle]
          ? String(r[colTitle]).trim()
          : (role === 'SUPERVISOR' ? 'Cán bộ hướng dẫn / Giảng viên' : (role === 'RESEARCHER' ? 'Học viên phụ trách' : 'Chủ hộ'));

        // 8. Mật khẩu ban đầu
        const password = colPassword >= 0 && String(r[colPassword] || '').trim()
          ? String(r[colPassword] || '').trim()
          : '123456';

        // 9. Mã hộ liên kết
        let householdId: string | undefined = undefined;
        if (role === 'HOUSEHOLD') {
          const rawHid = colHouseholdId >= 0 ? String(r[colHouseholdId] || '').trim().toUpperCase() : '';
          householdId = rawHid || username.toUpperCase();
        }

        const isValid = errors.length === 0;

        // Lưu vào danh sách User
        const parsedUser: ParsedUserRow = {
          rowNumber: i + 1,
          sourceSheet: sheetName,
          username,
          fullName,
          role,
          roleTitle,
          title,
          organization,
          phone,
          email,
          householdId,
          password,
          address,
          livestockType: rawLivestock || 'Gà ri lai thả vườn',
          herdSize: !isNaN(rawHerd) && rawHerd > 0 ? rawHerd : 500,
          farmingType: colFarmingType >= 0 && r[colFarmingType] ? String(r[colFarmingType]).trim() : 'Bán chăn thả có đệm lót sinh học',
          currentWasteMethod: colWasteMethod >= 0 && r[colWasteMethod] ? String(r[colWasteMethod]).trim() : 'Đệm lót sinh học Balasa N01',
          group: (colGroup >= 0 && normalizeHeader(r[colGroup]).includes('dc')) ? 'DC' : 'TN',
          isValid,
          errors,
          warnings,
        };
        allUsers.push(parsedUser);

        // Nếu dòng này là Hộ chăn nuôi (hoặc nằm trong sheet hộ chăn nuôi), tạo đồng thời bản ghi Hộ chăn nuôi
        if (role === 'HOUSEHOLD' || isPureHouseholdSheet) {
          const hid = householdId || username.toUpperCase();
          if (!seenHouseholdIds.has(hid)) {
            seenHouseholdIds.add(hid);

            let group: StudyGroup = 'TN';
            if (colGroup >= 0) {
              const normG = normalizeHeader(r[colGroup]);
              if (normG.includes('dc') || normG.includes('doi') || normG.includes('control')) {
                group = 'DC';
              }
            } else if (allHouseholds.length >= 20) {
              group = 'DC';
            }

            const rawYears = colFarmingYears >= 0 ? Number(r[colFarmingYears]) : 3;

            allHouseholds.push({
              rowNumber: i + 1,
              sourceSheet: sheetName,
              id: hid,
              representativeName: fullName,
              phone,
              address,
              livestockType: parsedUser.livestockType || 'Gà ri lai thả vườn',
              herdSize: parsedUser.herdSize || 500,
              farmingYears: !isNaN(rawYears) && rawYears >= 0 ? rawYears : 3,
              farmingType: parsedUser.farmingType || 'Bán chăn thả có đệm lót sinh học',
              currentWasteMethod: parsedUser.currentWasteMethod || 'Đệm lót sinh học Balasa N01',
              group,
              assignedResearcher: colResearcher >= 0 && r[colResearcher] ? String(r[colResearcher]).trim() : 'Chưa phân công',
              notes: colNotes >= 0 && r[colNotes] ? String(r[colNotes]).trim() : 'Nhập từ tệp dữ liệu',
              password,
              isValid,
              errors,
              warnings,
            });
          }
        }
      }
    }

    const validUsersCount = allUsers.filter(u => u.isValid).length;
    const errorUsersCount = allUsers.length - validUsersCount;

    return {
      sheetNames: wb.SheetNames,
      totalRows: allUsers.length,
      users: allUsers,
      households: allHouseholds,
      counts: {
        supervisors: allUsers.filter(u => u.role === 'SUPERVISOR').length,
        researchers: allUsers.filter(u => u.role === 'RESEARCHER').length,
        households: allUsers.filter(u => u.role === 'HOUSEHOLD').length,
        admins: allUsers.filter(u => u.role === 'ADMIN').length,
        validCount: validUsersCount,
        errorCount: errorUsersCount,
      }
    };
  }

  /**
   * Tương thích ngược: Đọc và phân tích file Hộ chăn nuôi
   */
  static async parseHouseholdsFile(file: File): Promise<{
    sheetName: string;
    rows: ParsedHouseholdRow[];
    validCount: number;
    errorCount: number;
  }> {
    const res = await this.parseUniversalFile(file);
    return {
      sheetName: res.sheetNames.join(', '),
      rows: res.households,
      validCount: res.households.filter(h => h.isValid).length,
      errorCount: res.households.filter(h => !h.isValid).length,
    };
  }

  /**
   * Tương thích ngược: Đọc và phân tích file Cán bộ & Học viên
   */
  static async parseResearchTeamFile(file: File): Promise<{
    sheetName: string;
    rows: ParsedUserRow[];
    validCount: number;
    errorCount: number;
  }> {
    const res = await this.parseUniversalFile(file);
    return {
      sheetName: res.sheetNames.join(', '),
      rows: res.users,
      validCount: res.counts.validCount,
      errorCount: res.counts.errorCount,
    };
  }

  /**
   * LƯU TOÀN DIỆN VÀ AN TOÀN TẤT CẢ DỮ LIỆU ĐÃ NHẬP
   * Đảm bảo:
   * 1. Users được lưu và cấp mật khẩu trực tiếp, không băm SHA-256 (đăng nhập được ngay)
   * 2. Households được lưu tương ứng
   * 3. Phiếu BC-01 được tự động tạo và liên thông
   * 4. Kích hoạt đồng bộ vĩnh viễn lên Google Sheets
   */
  static async saveUniversalImport(
    result: UnifiedParseResult,
    mode: 'MERGE' | 'REPLACE',
    currentUser: User
  ): Promise<{
    usersCount: number;
    householdsCount: number;
    supervisorsCount: number;
    researchersCount: number;
    householdsAccountCount: number;
  }> {
    const validUsers = result.users.filter(u => u.isValid);
    if (validUsers.length === 0) {
      throw new Error('Không có dòng tài khoản nào hợp lệ để lưu.');
    }

    const existingUsers = StorageService.getUsers();
    const existingHouseholds = StorageService.getHouseholds();
    const existingBC01 = StorageService.getBC01List();

    const userMap = new Map<string, User>();
    const householdMap = new Map<string, Household>();
    const bc01Map = new Map<string, BC01Record>();

    if (mode === 'REPLACE') {
      // Giữ lại Admin hiện tại
      const currentAdmin = existingUsers.find(u => u.username === 'admin') || currentUser;
      userMap.set(currentAdmin.username.toLowerCase(), currentAdmin);
    } else {
      existingUsers.forEach(u => userMap.set(u.username.toLowerCase(), u));
      existingHouseholds.forEach(h => householdMap.set(h.id.toUpperCase(), h));
      existingBC01.forEach(b => bc01Map.set(b.householdId.toUpperCase(), b));
    }

    // 1. Xử lý lưu Hộ chăn nuôi từ danh sách households
    for (const h of result.households.filter(h => h.isValid)) {
      const hid = h.id.toUpperCase();
      const prevH = householdMap.get(hid);
      const newH: Household = {
        id: hid,
        representativeName: h.representativeName,
        phone: h.phone,
        address: h.address,
        livestockType: h.livestockType,
        herdSize: h.herdSize,
        farmingYears: h.farmingYears,
        farmingType: h.farmingType,
        currentWasteMethod: h.currentWasteMethod,
        group: h.group,
        accountStatus: prevH ? prevH.accountStatus : 'ACTIVE',
        joinedDate: prevH ? prevH.joinedDate : new Date().toISOString().split('T')[0],
        assignedResearcher: h.assignedResearcher,
        notes: h.notes,
        createdAt: prevH ? prevH.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.username,
        isLocked: false,
      };
      householdMap.set(hid, newH);

      // Đồng bộ sang BC-01
      const prevBc = bc01Map.get(hid);
      bc01Map.set(hid, {
        id: prevBc?.id || `BC01_${hid}`,
        householdId: hid,
        representativeName: newH.representativeName,
        phone: newH.phone,
        address: newH.address,
        livestockType: newH.livestockType,
        herdSize: newH.herdSize,
        farmingYears: newH.farmingYears,
        farmingType: newH.farmingType,
        currentWasteMethod: newH.currentWasteMethod,
        notes: newH.notes,
        isLocked: prevBc?.isLocked || false,
        createdAt: prevBc?.createdAt || new Date().toISOString(),
        createdBy: prevBc?.createdBy || currentUser.username,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.username,
      });
    }

    // 2. Xử lý lưu danh sách Tài khoản Users (Mật khẩu lưu trực tiếp, không băm SHA-256 phức tạp)
    let supervisorsCount = 0;
    let researchersCount = 0;
    let householdsAccountCount = 0;

    for (const u of validUsers) {
      const key = u.username.toLowerCase();
      const existing = userMap.get(key);

      const pass = u.password || existing?.plainPasswordHint || existing?.password || '123456';

      const userObj: User = {
        id: existing?.id || `USR_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        username: u.username.toLowerCase(),
        fullName: u.fullName,
        role: u.role,
        title: u.title || (u.role === 'SUPERVISOR' ? 'Giảng viên' : (u.role === 'ADMIN' ? 'Quản trị viên' : (u.role === 'HOUSEHOLD' ? 'Chủ hộ' : 'Học viên'))),
        organization: u.organization,
        phone: u.phone,
        email: u.email,
        householdId: u.householdId,
        status: existing?.status || 'ACTIVE',
        password: pass,
        plainPasswordHint: pass,
        createdAt: existing?.createdAt || new Date().toISOString(),
      };

      userMap.set(key, userObj);

      if (u.role === 'SUPERVISOR') supervisorsCount++;
      else if (u.role === 'RESEARCHER') researchersCount++;
      else if (u.role === 'HOUSEHOLD') {
        householdsAccountCount++;
        // Đảm bảo Hộ chăn nuôi cũng tồn tại trong danh mục Household nếu chưa có
        const hid = (u.householdId || u.username).toUpperCase();
        if (!householdMap.has(hid)) {
          const newH: Household = {
            id: hid,
            representativeName: u.fullName,
            phone: u.phone,
            address: u.address || 'Khu vực chăn nuôi gà',
            livestockType: u.livestockType || 'Gà ri lai thả vườn',
            herdSize: u.herdSize || 500,
            farmingYears: 3,
            farmingType: u.farmingType || 'Bán chăn thả có đệm lót sinh học',
            currentWasteMethod: u.currentWasteMethod || 'Đệm lót sinh học Balasa N01',
            group: u.group || 'TN',
            accountStatus: 'ACTIVE',
            joinedDate: new Date().toISOString().split('T')[0],
            assignedResearcher: 'Chưa phân công',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            updatedBy: currentUser.username,
          };
          householdMap.set(hid, newH);

          // Tạo BC-01
          bc01Map.set(hid, {
            id: `BC01_${hid}`,
            householdId: hid,
            representativeName: newH.representativeName,
            phone: newH.phone,
            address: newH.address,
            livestockType: newH.livestockType,
            herdSize: newH.herdSize,
            farmingYears: newH.farmingYears,
            farmingType: newH.farmingType,
            currentWasteMethod: newH.currentWasteMethod,
            notes: 'Tự động tạo từ danh sách tài khoản hộ chăn nuôi',
            isLocked: false,
            createdAt: new Date().toISOString(),
            createdBy: currentUser.username,
            updatedAt: new Date().toISOString(),
            updatedBy: currentUser.username,
          });
        }
      }
    }

    // 3. Lưu vào StorageService
    const finalUsers = Array.from(userMap.values());
    const finalHouseholds = Array.from(householdMap.values()).sort((a, b) => a.id.localeCompare(b.id));
    const finalBC01 = Array.from(bc01Map.values()).sort((a, b) => a.householdId.localeCompare(b.householdId));

    StorageService.saveUsers(finalUsers);
    StorageService.saveHouseholds(finalHouseholds);
    StorageService.saveBC01List(finalBC01);

    // 4. Ghi Audit Log
    StorageService.addAuditLog({
      userId: currentUser.id,
      username: currentUser.username,
      userRole: currentUser.role,
      action: 'IMPORT_EXCEL',
      targetModule: 'ALL_ACCOUNTS',
      reason: `Nhập dữ liệu tệp: ${validUsers.length} tài khoản (${supervisorsCount} GV/HDAN, ${researchersCount} HS, ${householdsAccountCount} hộ), ${finalHouseholds.length} hồ sơ hộ chăn nuôi.`,
    });

    // 5. Kích hoạt đồng bộ lưu trữ vĩnh viễn lên Google Sheets ngay lập tức
    GoogleSheetsService.triggerAutoSave(50);

    return {
      usersCount: validUsers.length,
      householdsCount: finalHouseholds.length,
      supervisorsCount,
      researchersCount,
      householdsAccountCount,
    };
  }

  /**
   * Lưu các Hộ chăn nuôi gà vào hệ thống (tương thích các lời gọi cũ)
   */
  static async saveImportedHouseholds(
    parsedRows: ParsedHouseholdRow[],
    mode: 'MERGE' | 'REPLACE',
    createAccounts: boolean,
    currentUser: User
  ): Promise<{ savedCount: number; accountsCreated: number }> {
    const res = await this.saveUniversalImport(
      {
        sheetNames: ['HO_CHAN_NUOI'],
        totalRows: parsedRows.length,
        users: parsedRows.map(h => ({
          rowNumber: h.rowNumber,
          username: h.id.toLowerCase(),
          fullName: h.representativeName,
          role: 'HOUSEHOLD' as Role,
          roleTitle: 'Hộ chăn nuôi gà',
          title: 'Chủ hộ',
          organization: h.address,
          phone: h.phone,
          email: '',
          householdId: h.id,
          password: h.password || '123456',
          address: h.address,
          livestockType: h.livestockType,
          herdSize: h.herdSize,
          farmingType: h.farmingType,
          currentWasteMethod: h.currentWasteMethod,
          group: h.group,
          isValid: h.isValid,
          errors: h.errors,
          warnings: h.warnings,
        })),
        households: parsedRows,
        counts: {
          supervisors: 0,
          researchers: 0,
          households: parsedRows.length,
          admins: 0,
          validCount: parsedRows.filter(r => r.isValid).length,
          errorCount: parsedRows.filter(r => !r.isValid).length,
        }
      },
      mode,
      currentUser
    );

    return {
      savedCount: res.householdsCount,
      accountsCreated: res.householdsAccountCount,
    };
  }

  /**
   * Lưu danh sách Giảng viên, Học viên, Hướng dẫn (tương thích các lời gọi cũ)
   */
  static async saveImportedResearchTeam(
    parsedRows: ParsedUserRow[],
    mode: 'MERGE' | 'REPLACE',
    currentUser: User
  ): Promise<{ savedCount: number; householdsCreated: number }> {
    const res = await this.saveUniversalImport(
      {
        sheetNames: ['CAN_BO_VA_HOC_VIEN'],
        totalRows: parsedRows.length,
        users: parsedRows,
        households: [],
        counts: {
          supervisors: parsedRows.filter(r => r.role === 'SUPERVISOR').length,
          researchers: parsedRows.filter(r => r.role === 'RESEARCHER').length,
          households: parsedRows.filter(r => r.role === 'HOUSEHOLD').length,
          admins: parsedRows.filter(r => r.role === 'ADMIN').length,
          validCount: parsedRows.filter(r => r.isValid).length,
          errorCount: parsedRows.filter(r => !r.isValid).length,
        }
      },
      mode,
      currentUser
    );

    return {
      savedCount: res.usersCount,
      householdsCreated: res.householdsAccountCount,
    };
  }
}
