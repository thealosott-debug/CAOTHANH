/**
 * Dịch vụ xử lý xuất nhập dữ liệu Excel (XLSX, XLS, CSV)
 * Hỗ trợ: Hộ chăn nuôi, Người hướng dẫn, Người nghiên cứu
 */

import * as XLSX from 'xlsx';
import { BC01Record, Household, Role, StudyGroup, User } from '../types';
import { StorageService } from './storage';
import { generateSalt, hashPassword } from '../utils/crypto';

export interface ParsedHouseholdRow {
  rowNumber: number;
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
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ParsedUserRow {
  rowNumber: number;
  username: string;
  fullName: string;
  role: Role;
  title: string;
  organization: string;
  phone: string;
  email: string;
  password?: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Hàm chuẩn hóa chuỗi để so khớp cột không phân biệt dấu và hoa thường
function normalizeHeader(str: any): string {
  if (!str) return '';
  return String(str)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

export class ExcelImportService {
  /**
   * Tải tệp mẫu Excel cho Hộ chăn nuôi
   */
  static downloadHouseholdTemplate(): void {
    const wb = XLSX.utils.book_new();

    const headers = [
      'Mã hộ (*)',
      'Họ và tên chủ hộ (*)',
      'Số điện thoại (*)',
      'Địa chỉ (Thôn/Xã/Huyện) (*)',
      'Loại vật nuôi',
      'Quy mô đàn (con)',
      'Số năm chăn nuôi',
      'Hình thức chăn nuôi',
      'Xử lý chất thải hiện tại',
      'Nhóm nghiên cứu (TN hoặc ĐC) (*)',
      'Người nghiên cứu phụ trách',
      'Ghi chú'
    ];

    const sampleData = [
      headers,
      [
        'H01',
        'Nguyễn Văn A',
        '0912345678',
        'Thôn 1, Xã Tân Lập, Huyện Yên Định, Thanh Hóa',
        'Lợn thịt',
        60,
        5,
        'Gia trại chuồng hở',
        'Hầm Biogas composite',
        'TN',
        'ThS. Trần Thị Mai',
        'Hộ chăn nuôi tiêu biểu xã Tân Lập'
      ],
      [
        'H02',
        'Trần Thị B',
        '0987654321',
        'Thôn 2, Xã Tân Lập, Huyện Yên Định, Thanh Hóa',
        'Lợn thịt',
        45,
        4,
        'Gia trại chuồng hở',
        'Hầm Biogas',
        'TN',
        'ThS. Trần Thị Mai',
        ''
      ],
      [
        'H03',
        'Lê Văn C',
        '0905123456',
        'Thôn 3, Xã Định Long, Huyện Yên Định, Thanh Hóa',
        'Bò thịt',
        15,
        7,
        'Bán chăn thả',
        'Ủ phân compost',
        'ĐC',
        'KS. Lê Hoàng Long',
        'Hộ thuộc nhóm đối chứng'
      ]
    ];

    const ws = XLSX.utils.aoa_to_sheet(sampleData);

    // Căn chỉnh độ rộng cột
    ws['!cols'] = [
      { wch: 12 }, // Mã hộ
      { wch: 24 }, // Tên chủ hộ
      { wch: 16 }, // SĐT
      { wch: 42 }, // Địa chỉ
      { wch: 16 }, // Vật nuôi
      { wch: 18 }, // Quy mô
      { wch: 18 }, // Số năm
      { wch: 22 }, // Hình thức
      { wch: 24 }, // Xử lý chất thải
      { wch: 30 }, // Nhóm
      { wch: 26 }, // NCV phụ trách
      { wch: 30 }, // Ghi chú
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'HO_CHAN_NUOI');
    XLSX.writeFile(wb, 'Mau_Nhap_Ho_Chan_Nuoi_GreenFarm.xlsx');
  }

  /**
   * Tải tệp mẫu Excel cho Người hướng dẫn & Người nghiên cứu
   */
  static downloadResearchTeamTemplate(): void {
    const wb = XLSX.utils.book_new();

    const headers = [
      'Tên đăng nhập (*)',
      'Họ và tên (*)',
      'Vai trò (*)',
      'Học hàm / Học vị / Chức vụ',
      'Đơn vị công tác',
      'Số điện thoại',
      'Email',
      'Mật khẩu khởi tạo'
    ];

    const sampleData = [
      headers,
      [
        'huongdan_01',
        'PGS.TS. Nguyễn Văn Tuấn',
        'Người hướng dẫn',
        'Cố vấn khoa học cấp cao',
        'Trường Đại học Khoa học',
        '0912111222',
        'nvtuan@univ.edu.vn',
        '123456'
      ],
      [
        'nghiencuu_mai',
        'ThS. Trần Thị Mai',
        'Nghiên cứu viên',
        'Thạc sĩ Nông nghiệp - Cán bộ khảo sát thực địa',
        'Viện Nghiên cứu Môi trường',
        '0988222333',
        'ttmai@research.vn',
        '123456'
      ],
      [
        'nghiencuu_long',
        'KS. Lê Hoàng Long',
        'Nghiên cứu viên',
        'Kỹ sư Chăn nuôi Thú y',
        'Trung tâm Khuyến nông',
        '0977333444',
        'lhlong@research.vn',
        '123456'
      ]
    ];

    const ws = XLSX.utils.aoa_to_sheet(sampleData);

    ws['!cols'] = [
      { wch: 18 }, // Username
      { wch: 26 }, // Họ tên
      { wch: 20 }, // Vai trò
      { wch: 36 }, // Học hàm học vị
      { wch: 32 }, // Đơn vị công tác
      { wch: 16 }, // SĐT
      { wch: 26 }, // Email
      { wch: 20 }, // Mật khẩu
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'NGUOI_NGHIEN_CUU');
    XLSX.writeFile(wb, 'Mau_Nhap_Nguoi_Huong_Dan_Va_Nghien_Cuu.xlsx');
  }

  /**
   * Tải tệp mẫu tổng hợp cả 2 danh sách trong cùng 1 file Excel (2 Sheets)
   */
  static downloadCombinedTemplate(): void {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Hộ chăn nuôi
    const ws1 = XLSX.utils.aoa_to_sheet([
      [
        'Mã hộ (*)',
        'Họ và tên chủ hộ (*)',
        'Số điện thoại (*)',
        'Địa chỉ (Thôn/Xã/Huyện) (*)',
        'Loại vật nuôi',
        'Quy mô đàn (con)',
        'Số năm chăn nuôi',
        'Hình thức chăn nuôi',
        'Xử lý chất thải hiện tại',
        'Nhóm nghiên cứu (TN hoặc ĐC) (*)',
        'Người nghiên cứu phụ trách',
        'Ghi chú'
      ],
      ['H01', 'Nguyễn Văn A', '0912345678', 'Xã Tân Lập, Huyện Yên Định, Thanh Hóa', 'Lợn thịt', 50, 4, 'Gia trại chuồng hở', 'Hầm Biogas', 'TN', 'ThS. Trần Thị Mai', ''],
      ['H02', 'Trần Văn B', '0987654321', 'Xã Tân Lập, Huyện Yên Định, Thanh Hóa', 'Lợn thịt', 40, 5, 'Gia trại chuồng hở', 'Hầm Biogas', 'ĐC', 'KS. Lê Hoàng Long', '']
    ]);
    ws1['!cols'] = [{ wch: 12 }, { wch: 22 }, { wch: 15 }, { wch: 38 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 25 }, { wch: 24 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws1, 'HO_CHAN_NUOI');

    // Sheet 2: Cán bộ
    const ws2 = XLSX.utils.aoa_to_sheet([
      [
        'Tên đăng nhập (*)',
        'Họ và tên (*)',
        'Vai trò (*)',
        'Học hàm / Học vị / Chức vụ',
        'Đơn vị công tác',
        'Số điện thoại',
        'Email',
        'Mật khẩu khởi tạo'
      ],
      ['huongdan_01', 'PGS.TS. Nguyễn Văn Tuấn', 'Người hướng dẫn', 'Cố vấn chuyên môn', 'Đại học Quốc Gia', '0912345678', 'tuan@edu.vn', '123456'],
      ['nghiencuu_mai', 'ThS. Trần Thị Mai', 'Nghiên cứu viên', 'Khảo sát viên chính', 'Viện Môi trường', '0988776655', 'mai@research.vn', '123456']
    ]);
    ws2['!cols'] = [{ wch: 18 }, { wch: 25 }, { wch: 20 }, { wch: 30 }, { wch: 28 }, { wch: 15 }, { wch: 24 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'NGUOI_HUONG_DAN_VA_NCV');

    XLSX.writeFile(wb, 'Mau_Tong_Hop_Nghien_Cuu_GreenFarm.xlsx');
  }

  /**
   * Đọc và phân tích file Excel / CSV nhập Hộ chăn nuôi
   */
  static async parseHouseholdsFile(file: File): Promise<{
    sheetName: string;
    rows: ParsedHouseholdRow[];
    validCount: number;
    errorCount: number;
  }> {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array' });

    // Ưu tiên sheet có tên chứa "HO" hoặc sheet đầu tiên
    let sheetName = wb.SheetNames[0];
    const foundHoSheet = wb.SheetNames.find(s => normalizeHeader(s).includes('ho'));
    if (foundHoSheet) sheetName = foundHoSheet;

    const ws = wb.Sheets[sheetName];
    if (!ws) {
      throw new Error('Không tìm thấy dữ liệu trong tệp Excel.');
    }

    const rawData: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    if (rawData.length < 2) {
      throw new Error('Tệp Excel không có đủ dữ liệu (ít nhất cần 1 dòng tiêu đề và 1 dòng dữ liệu).');
    }

    // Tìm dòng tiêu đề (Header row)
    let headerRowIndex = 0;
    for (let i = 0; i < Math.min(rawData.length, 5); i++) {
      const rowStr = rawData[i].map(normalizeHeader).join(' ');
      if (rowStr.includes('ma') || rowStr.includes('ten') || rowStr.includes('ho')) {
        headerRowIndex = i;
        break;
      }
    }

    const headerRow = rawData[headerRowIndex].map(normalizeHeader);

    // Tìm vị trí các cột
    const findCol = (keywords: string[]) => {
      return headerRow.findIndex(h => keywords.some(k => h.includes(k)));
    };

    const colId = findCol(['maho', 'id', 'ma']);
    const colName = findCol(['tenchuho', 'hoten', 'chuho', 'daidien', 'ten']);
    const colPhone = findCol(['sodienthoai', 'dienthoai', 'sdt', 'phone']);
    const colAddress = findCol(['diachi', 'thon', 'xa', 'address']);
    const colLivestock = findCol(['loaivatnuoi', 'vatnuoi', 'loai', 'dan']);
    const colHerdSize = findCol(['quymodan', 'soluong', 'quymo', 'con']);
    const colFarmingYears = findCol(['sonamchannuoi', 'sonam', 'kinhnghiem', 'nam']);
    const colFarmingType = findCol(['hinhthuc', 'chuong', 'loaihinh']);
    const colWasteMethod = findCol(['xulychatthai', 'chatthai', 'phuongphap', 'biogas', 'hientai']);
    const colGroup = findCol(['nhomnghiencuu', 'nhom', 'group']);
    const colResearcher = findCol(['nguoinghiencuu', 'nghiencuuvien', 'phutrach', 'canbo']);
    const colNotes = findCol(['ghichu', 'note', 'notes']);

    const rows: ParsedHouseholdRow[] = [];
    const seenIds = new Set<string>();

    for (let i = headerRowIndex + 1; i < rawData.length; i++) {
      const r = rawData[i];
      // Bỏ qua dòng trống hoàn toàn
      if (!r || r.every((cell: any) => String(cell).trim() === '')) continue;

      const errors: string[] = [];
      const warnings: string[] = [];

      // 1. Mã hộ
      let id = colId >= 0 ? String(r[colId] || '').trim().toUpperCase() : '';
      if (!id) {
        // Tự sinh mã tạm thời nếu người dùng quên nhập mã
        const autoNum = rows.length + 1;
        id = `H${autoNum.toString().padStart(2, '0')}`;
        warnings.push(`Chưa có mã hộ, hệ thống tự gán mã: ${id}`);
      }

      if (seenIds.has(id)) {
        errors.push(`Mã hộ "${id}" bị trùng lặp trong tệp Excel.`);
      } else {
        seenIds.add(id);
      }

      // 2. Tên chủ hộ
      const representativeName = colName >= 0 ? String(r[colName] || '').trim() : '';
      if (!representativeName) {
        errors.push('Thiếu họ và tên chủ hộ.');
      }

      // 3. Số điện thoại
      const phone = colPhone >= 0 ? String(r[colPhone] || '').trim().replace(/[^0-9]/g, '') : '';
      if (!phone) {
        warnings.push('Chưa có số điện thoại.');
      }

      // 4. Địa chỉ
      const address = colAddress >= 0 ? String(r[colAddress] || '').trim() : '';

      // 5. Loại vật nuôi
      const livestockType = colLivestock >= 0 ? String(r[colLivestock] || '').trim() || 'Lợn thịt' : 'Lợn thịt';

      // 6. Quy mô đàn
      const rawHerd = colHerdSize >= 0 ? Number(r[colHerdSize]) : 50;
      const herdSize = !isNaN(rawHerd) && rawHerd > 0 ? rawHerd : 50;

      // 7. Số năm
      const rawYears = colFarmingYears >= 0 ? Number(r[colFarmingYears]) : 5;
      const farmingYears = !isNaN(rawYears) && rawYears >= 0 ? rawYears : 3;

      // 8. Hình thức
      const farmingType = colFarmingType >= 0 ? String(r[colFarmingType] || '').trim() || 'Gia trại chuồng hở' : 'Gia trại chuồng hở';

      // 9. Xử lý chất thải
      const currentWasteMethod = colWasteMethod >= 0 ? String(r[colWasteMethod] || '').trim() || 'Biogas composite' : 'Biogas composite';

      // 10. Nhóm nghiên cứu
      let group: StudyGroup = 'TN';
      const rawGroup = colGroup >= 0 ? normalizeHeader(r[colGroup]) : '';
      if (rawGroup.includes('dc') || rawGroup.includes('doi') || rawGroup.includes('control')) {
        group = 'DC';
      } else if (rawGroup.includes('tn') || rawGroup.includes('canthiep') || rawGroup.includes('treat')) {
        group = 'TN';
      } else {
        // Tự động phân nửa đầu TN, nửa sau ĐC nếu không ghi rõ
        group = rows.length < 20 ? 'TN' : 'DC';
        warnings.push(`Chưa chỉ định nhóm, tạm gán nhóm: ${group}`);
      }

      // 11. Cán bộ phụ trách
      const assignedResearcher = colResearcher >= 0 ? String(r[colResearcher] || '').trim() : '';

      // 12. Ghi chú
      const notes = colNotes >= 0 ? String(r[colNotes] || '').trim() : '';

      const isValid = errors.length === 0;

      rows.push({
        rowNumber: i + 1,
        id,
        representativeName,
        phone,
        address,
        livestockType,
        herdSize,
        farmingYears,
        farmingType,
        currentWasteMethod,
        group,
        assignedResearcher,
        notes,
        isValid,
        errors,
        warnings,
      });
    }

    const validCount = rows.filter(r => r.isValid).length;
    const errorCount = rows.length - validCount;

    return {
      sheetName,
      rows,
      validCount,
      errorCount,
    };
  }

  /**
   * Đọc và phân tích file Excel / CSV nhập Người hướng dẫn & Nghiên cứu viên
   */
  static async parseResearchTeamFile(file: File): Promise<{
    sheetName: string;
    rows: ParsedUserRow[];
    validCount: number;
    errorCount: number;
  }> {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array' });

    // Ưu tiên sheet có tên chứa "NGHIEN_CUU" hoặc "HUONG_DAN" hoặc sheet thứ 2 nếu có
    let sheetName = wb.SheetNames[0];
    const foundTeamSheet = wb.SheetNames.find(s => {
      const n = normalizeHeader(s);
      return n.includes('nghiencuu') || n.includes('huongdan') || n.includes('team') || n.includes('canbo');
    });
    if (foundTeamSheet) {
      sheetName = foundTeamSheet;
    } else if (wb.SheetNames.length > 1 && normalizeHeader(wb.SheetNames[0]).includes('ho')) {
      sheetName = wb.SheetNames[1];
    }

    const ws = wb.Sheets[sheetName];
    if (!ws) {
      throw new Error('Không tìm thấy dữ liệu nhóm nghiên cứu trong tệp Excel.');
    }

    const rawData: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    if (rawData.length < 2) {
      throw new Error('Tệp Excel không có đủ dữ liệu (ít nhất cần 1 dòng tiêu đề và 1 dòng dữ liệu).');
    }

    let headerRowIndex = 0;
    for (let i = 0; i < Math.min(rawData.length, 5); i++) {
      const rowStr = rawData[i].map(normalizeHeader).join(' ');
      if (rowStr.includes('ten') || rowStr.includes('vaitro') || rowStr.includes('username') || rowStr.includes('role')) {
        headerRowIndex = i;
        break;
      }
    }

    const headerRow = rawData[headerRowIndex].map(normalizeHeader);

    const findCol = (keywords: string[]) => {
      return headerRow.findIndex(h => keywords.some(k => h.includes(k)));
    };

    const colUsername = findCol(['tendangnhap', 'username', 'taikhoan', 'user']);
    const colName = findCol(['hovaten', 'hoten', 'ten', 'fullname']);
    const colRole = findCol(['vaitro', 'role', 'chucdanh', 'loaitaikhoan']);
    const colTitle = findCol(['hocham', 'hocvi', 'chucvu', 'title']);
    const colOrg = findCol(['donvi', 'coquan', 'truong', 'vien', 'organization']);
    const colPhone = findCol(['sodienthoai', 'dienthoai', 'sdt', 'phone']);
    const colEmail = findCol(['email', 'mail']);
    const colPassword = findCol(['matkhau', 'password', 'pass']);

    const rows: ParsedUserRow[] = [];
    const seenUsernames = new Set<string>();

    for (let i = headerRowIndex + 1; i < rawData.length; i++) {
      const r = rawData[i];
      if (!r || r.every((cell: any) => String(cell).trim() === '')) continue;

      const errors: string[] = [];
      const warnings: string[] = [];

      // 1. Họ và tên
      const fullName = colName >= 0 ? String(r[colName] || '').trim() : '';
      if (!fullName) {
        errors.push('Thiếu họ và tên cán bộ/người hướng dẫn.');
      }

      // 2. Tên đăng nhập
      let username = colUsername >= 0 ? String(r[colUsername] || '').trim().toLowerCase() : '';
      if (!username) {
        // Tự sinh username từ tên không dấu
        if (fullName) {
          const cleanName = normalizeHeader(fullName);
          username = cleanName.substring(0, 15) + (rows.length + 1);
          warnings.push(`Chưa có tên đăng nhập, tự động tạo: ${username}`);
        } else {
          username = `user_${Date.now()}_${rows.length + 1}`;
          errors.push('Thiếu tên đăng nhập.');
        }
      }

      if (seenUsernames.has(username)) {
        errors.push(`Tên đăng nhập "${username}" bị trùng lặp.`);
      } else {
        seenUsernames.add(username);
      }

      // 3. Vai trò
      let role: Role = 'RESEARCHER';
      const rawRole = colRole >= 0 ? normalizeHeader(r[colRole]) : '';
      if (rawRole.includes('huongdan') || rawRole.includes('supervisor') || rawRole.includes('covan') || rawRole.includes('giangvien')) {
        role = 'SUPERVISOR';
      } else if (rawRole.includes('admin') || rawRole.includes('quantri') || rawRole.includes('chunhiem')) {
        role = 'ADMIN';
      } else if (rawRole.includes('ho') || rawRole.includes('household')) {
        role = 'HOUSEHOLD';
      } else {
        role = 'RESEARCHER';
      }

      // 4. Học hàm/học vị
      const title = colTitle >= 0 ? String(r[colTitle] || '').trim() : '';

      // 5. Đơn vị công tác
      const organization = colOrg >= 0 ? String(r[colOrg] || '').trim() : '';

      // 6. Số điện thoại
      const phone = colPhone >= 0 ? String(r[colPhone] || '').trim().replace(/[^0-9]/g, '') : '';

      // 7. Email
      const email = colEmail >= 0 ? String(r[colEmail] || '').trim() : '';

      // 8. Mật khẩu
      const password = colPassword >= 0 && String(r[colPassword] || '').trim()
        ? String(r[colPassword] || '').trim()
        : '123456';

      const isValid = errors.length === 0;

      rows.push({
        rowNumber: i + 1,
        username,
        fullName,
        role,
        title,
        organization,
        phone,
        email,
        password,
        isValid,
        errors,
        warnings,
      });
    }

    const validCount = rows.filter(r => r.isValid).length;
    const errorCount = rows.length - validCount;

    return {
      sheetName,
      rows,
      validCount,
      errorCount,
    };
  }

  /**
   * Lưu các hộ chăn nuôi đã phân tích vào hệ thống
   */
  static async saveImportedHouseholds(
    parsedRows: ParsedHouseholdRow[],
    mode: 'MERGE' | 'REPLACE',
    createAccounts: boolean,
    currentUser: User
  ): Promise<{ savedCount: number; accountsCreated: number }> {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      throw new Error('Không có dòng dữ liệu nào hợp lệ để lưu.');
    }

    const existingHouseholds = StorageService.getHouseholds();
    const existingUsers = StorageService.getUsers();

    const newHouseholds: Household[] = validRows.map(r => {
      const existing = existingHouseholds.find(h => h.id === r.id);
      return {
        id: r.id,
        representativeName: r.representativeName,
        phone: r.phone,
        address: r.address,
        livestockType: r.livestockType,
        herdSize: r.herdSize,
        farmingYears: r.farmingYears,
        farmingType: r.farmingType,
        currentWasteMethod: r.currentWasteMethod,
        group: r.group,
        accountStatus: existing ? existing.accountStatus : 'ACTIVE',
        joinedDate: existing ? existing.joinedDate : new Date().toISOString().split('T')[0],
        assignedResearcher: r.assignedResearcher,
        notes: r.notes,
        createdAt: existing ? existing.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.username,
        isLocked: false,
      };
    });

    let finalList: Household[] = [];
    if (mode === 'REPLACE') {
      finalList = newHouseholds;
    } else {
      // MERGE: Thay thế hộ có cùng id, thêm mới hộ chưa có
      const map = new Map<string, Household>();
      existingHouseholds.forEach(h => map.set(h.id, h));
      newHouseholds.forEach(h => map.set(h.id, h));
      finalList = Array.from(map.values());
    }

    // Sắp xếp theo mã hộ H01, H02...
    finalList.sort((a, b) => a.id.localeCompare(b.id));
    StorageService.saveHouseholds(finalList);

    // Đồng bộ tức thì vào phiếu BC-01 để tất cả các module khảo sát liên kết thông suốt
    const existingBC01 = StorageService.getBC01List();
    const bc01Map = new Map<string, BC01Record>();
    if (mode === 'MERGE') {
      existingBC01.forEach((b) => bc01Map.set(b.householdId, b));
    }
    for (const h of finalList) {
      const prev = bc01Map.get(h.id);
      bc01Map.set(h.id, {
        id: prev?.id || `BC01_${h.id}`,
        householdId: h.id,
        representativeName: h.representativeName,
        phone: h.phone,
        address: h.address,
        livestockType: h.livestockType,
        herdSize: h.herdSize,
        farmingYears: h.farmingYears,
        farmingType: h.farmingType,
        currentWasteMethod: h.currentWasteMethod,
        notes: h.notes,
        isLocked: prev?.isLocked || false,
        createdAt: prev?.createdAt || new Date().toISOString(),
        createdBy: prev?.createdBy || currentUser.username,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.username,
      });
    }
    StorageService.saveBC01List(Array.from(bc01Map.values()));

    // Tạo tài khoản cho hộ chăn nuôi nếu tùy chọn được bật
    let accountsCreated = 0;
    if (createAccounts) {
      const userMap = new Map<string, User>();
      existingUsers.forEach(u => userMap.set(u.username.toLowerCase(), u));

      for (const h of newHouseholds) {
        const username = h.id.toLowerCase();
        if (!userMap.has(username)) {
          const salt = generateSalt(16);
          const passwordHash = await hashPassword('123456', salt);
          const newUser: User = {
            id: `USR_${h.id}_${Date.now()}`,
            username,
            fullName: h.representativeName,
            phone: h.phone,
            role: 'HOUSEHOLD',
            householdId: h.id,
            status: 'ACTIVE',
            passwordHash,
            salt,
            plainPasswordHint: '123456',
            createdAt: new Date().toISOString(),
          };
          userMap.set(username, newUser);
          accountsCreated++;
        }
      }

      StorageService.saveUsers(Array.from(userMap.values()));
    }

    StorageService.addAuditLog({
      userId: currentUser.id,
      username: currentUser.username,
      userRole: currentUser.role,
      action: 'IMPORT_EXCEL',
      targetModule: 'HOUSEHOLDS',
      reason: `Nhập ${validRows.length} hộ chăn nuôi từ tệp Excel (${mode === 'REPLACE' ? 'Thay thế toàn bộ' : 'Gộp dữ liệu'}), tạo ${accountsCreated} tài khoản mới.`,
    });

    return {
      savedCount: validRows.length,
      accountsCreated,
    };
  }

  /**
   * Lưu danh sách Người hướng dẫn & Nghiên cứu viên đã phân tích vào hệ thống
   */
  static async saveImportedResearchTeam(
    parsedRows: ParsedUserRow[],
    mode: 'MERGE' | 'REPLACE',
    currentUser: User
  ): Promise<{ savedCount: number }> {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      throw new Error('Không có dòng cán bộ nào hợp lệ để lưu.');
    }

    const existingUsers = StorageService.getUsers();
    const userMap = new Map<string, User>();

    // Nếu mode là REPLACE: Giữ lại Admin hiện tại, xóa các tài khoản khác
    if (mode === 'REPLACE') {
      const currentAdmin = existingUsers.find(u => u.username === 'admin') || currentUser;
      userMap.set(currentAdmin.username.toLowerCase(), currentAdmin);
    } else {
      existingUsers.forEach(u => userMap.set(u.username.toLowerCase(), u));
    }

    for (const r of validRows) {
      const key = r.username.toLowerCase();
      const existing = userMap.get(key);

      const salt = existing ? existing.salt : generateSalt(16);
      const passwordHash = r.password
        ? await hashPassword(r.password, salt)
        : existing
        ? existing.passwordHash
        : await hashPassword('123456', salt);

      const userObj: User = {
        id: existing ? existing.id : `USR_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        username: r.username,
        fullName: r.fullName,
        role: r.role,
        title: r.title || (r.role === 'SUPERVISOR' ? 'Người hướng dẫn' : 'Nghiên cứu viên'),
        organization: r.organization,
        phone: r.phone,
        email: r.email,
        status: existing ? existing.status : 'ACTIVE',
        passwordHash,
        salt,
        plainPasswordHint: r.password || (existing ? existing.plainPasswordHint : '123456'),
        createdAt: existing ? existing.createdAt : new Date().toISOString(),
      };

      userMap.set(key, userObj);
    }

    const finalList = Array.from(userMap.values());
    StorageService.saveUsers(finalList);

    StorageService.addAuditLog({
      userId: currentUser.id,
      username: currentUser.username,
      userRole: currentUser.role,
      action: 'IMPORT_EXCEL',
      targetModule: 'USERS',
      reason: `Nhập ${validRows.length} cán bộ (Người hướng dẫn / Nghiên cứu viên) từ tệp Excel.`,
    });

    return {
      savedCount: validRows.length,
    };
  }
}
