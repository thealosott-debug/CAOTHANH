/**
 * Định nghĩa cấu trúc dữ liệu cho Hệ thống Quản lý Nghiên cứu Cam kết Xanh
 * Đề tài: Tác động của 'Cam kết xanh' kết hợp ứng dụng quản lý chăn nuôi đến hành vi quản lý chất thải tại nguồn
 */

export type Role = 'ADMIN' | 'SUPERVISOR' | 'RESEARCHER' | 'HOUSEHOLD';

export type StudyGroup = 'TN' | 'DC'; // TN: Can thiệp, DC: Đối chứng

export type AccountStatus = 'ACTIVE' | 'LOCKED' | 'PENDING';

export type SyncStatus = 'SYNCED' | 'PENDING' | 'SYNCING' | 'ERROR';

export interface User {
  id: string;
  username: string; // Mã hộ hoặc email hoặc username
  fullName: string;
  email?: string;
  phone: string;
  role: Role;
  title?: string; // Học hàm, học vị (PGS.TS, TS, ThS, KS...) hoặc chức danh
  organization?: string; // Đơn vị công tác, cơ quan
  householdId?: string; // Nếu là hộ chăn nuôi thì liên kết với mã hộ (H01..H40)
  status: AccountStatus;
  passwordHash: string;
  salt: string;
  createdAt: string;
  lastLogin?: string;
}

export interface Household {
  id: string; // H01, H02, ..., H40
  representativeName: string;
  phone: string;
  address: string;
  livestockType: string; // Heo/Lợn, Bò thịt, Bò sữa, Gà, Vịt, Khác
  herdSize: number; // Số lượng con
  farmingYears: number; // Số năm kinh nghiệm
  farmingType: string; // Chuồng hở, Chuồng kín, Bán chăn thả, Gia trại, Trang trại
  currentWasteMethod: string; // Biogas, Ủ phân compost, Đệm lót sinh học, Xả thẳng, Bán tươi
  group: StudyGroup; // TN hoặc DC
  accountStatus: AccountStatus;
  joinedDate: string;
  assignedResearcher: string;
  randomizedAt?: string;
  randomizedBy?: string;
  groupChangeReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
  isLocked?: boolean;
}

// Module BC-01: Thông tin hộ
export interface BC01Record {
  id: string;
  householdId: string;
  representativeName: string;
  phone: string;
  address: string;
  livestockType: string;
  herdSize: number;
  farmingYears: number;
  farmingType: string;
  currentWasteMethod: string;
  notes?: string;
  isLocked: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

// Module BC-02: Khảo sát KAP trước can thiệp
export interface KnowledgeAnswer {
  questionId: string;
  selectedAnswer: number;
  isCorrect: boolean;
  score: number;
}

export interface BC02Record {
  id: string;
  householdId: string;
  // Phần A: Kiến thức (K trước)
  knowledgeAnswers: KnowledgeAnswer[];
  scoreK: number; // Tổng điểm kiến thức (0 - 10)
  
  // Phần B: Thái độ (T trước) - Thang Likert 1-5
  attitudeAnswers: { questionId: string; score: number }[];
  scoreT: number; // Điểm trung bình thái độ (1.0 - 5.0)

  // Phần C: Hành vi tự báo cáo (HT trước) - 6 hành vi chuẩn
  behaviorReport: {
    b1_thuGom: boolean;
    b2_phanLoai: boolean;
    b3_luuChua: boolean;
    b4_khongXaThang: boolean;
    b5_xuLyTaiSuDung: boolean;
    b6_veSinh: boolean;
  };
  scoreHT: number; // Tổng hành vi tự báo cáo (0 - 6)

  isLocked: boolean;
  submittedAt: string;
  submittedBy: string;
  updatedAt: string;
  updatedBy: string;
}

// Module BC-03: Ý định thay đổi trước can thiệp (YĐ trước)
export interface BC03Record {
  id: string;
  householdId: string;
  // 5 câu thang Likert 1-5
  answers: { questionId: string; score: number }[];
  scoreYD: number; // Điểm trung bình ý định (1.0 - 5.0)
  isLocked: boolean;
  submittedAt: string;
  submittedBy: string;
  updatedAt: string;
  updatedBy: string;
}

// Module BC-04: Quan sát hành vi thực tế CWM (Trước và Sau)
export interface CwmCriteria {
  b1_thuGom: number; // 0 hoặc 1
  b2_phanLoai: number; // 0 hoặc 1
  b3_luuChua: number; // 0 hoặc 1
  b4_khongXaThang: number; // 0 hoặc 1
  b5_xuLyTaiSuDung: number; // 0 hoặc 1
  b6_veSinh: number; // 0 hoặc 1
}

export interface BC04Record {
  id: string;
  householdId: string;
  stage: 'PRE' | 'POST'; // Trước hoặc Sau
  criteria: CwmCriteria;
  scoreCWM: number; // Tổng 0 - 6
  observationNotes: string; // Mô tả thực tế
  evidenceDescription?: string; // Bằng chứng cụ thể
  failureReasons?: string; // Nguyên nhân nếu có tiêu chí không đạt
  photoUrl?: string; // Ảnh minh chứng (nếu có)
  observedBy: string; // Tên/ID người quan sát (Nghiên cứu viên / Admin)
  observedAt: string; // Ngày giờ quan sát
  isLocked: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

// Module BC-05: Cam kết xanh (chỉ cho nhóm TN)
export interface BC05Record {
  id: string;
  householdId: string;
  commitments: {
    b1_thuGom: boolean;
    b2_phanLoai: boolean;
    b3_luuChua: boolean;
    b4_khongXaThang: boolean;
    b5_xuLyTaiSuDung: boolean;
    b6_veSinh: boolean;
    b7_baoCaoHangTuan: boolean;
  };
  confirmed: boolean;
  confirmedAt?: string;
  confirmedBy?: string;
  version: string;
  createdAt: string;
}

// Module BC-06: Báo cáo hành vi hằng tuần (W1 - W6)
export type WeekNumber = 'W1' | 'W2' | 'W3' | 'W4' | 'W5' | 'W6';

export interface BC06Record {
  id: string;
  householdId: string;
  week: WeekNumber;
  behaviors: {
    b1_thuGom: boolean;
    b2_phanLoai: boolean;
    b3_luuChua: boolean;
    b4_khongXaThang: boolean;
    b5_xuLyTaiSuDung: boolean;
    b6_veSinh: boolean;
  };
  weeklyScore: number; // Tổng điểm hành vi (0 - 6)
  barriers: string[]; // Danh sách khó khăn gặp phải
  otherBarrierText?: string;
  isLocked: boolean;
  submittedAt: string;
  submittedBy: string;
  updatedAt: string;
  updatedBy: string;
}

// Module BC-07: Khảo sát sau can thiệp
export interface BC07Record {
  id: string;
  householdId: string;
  behaviorReport: {
    b1_thuGom: boolean;
    b2_phanLoai: boolean;
    b3_luuChua: boolean;
    b4_khongXaThang: boolean;
    b5_xuLyTaiSuDung: boolean;
    b6_veSinh: boolean;
  };
  scoreHT_Post: number; // Điểm hành vi tự báo cáo sau can thiệp (0 - 6)
  maintenanceWillingness: number; // Mức độ sẵn sàng tiếp tục duy trì (1-5)
  feedbackProcess: string; // Cảm nhận về quá trình tham gia
  mainBarriers: string[]; // Khó khăn tồn đọng
  isLocked: boolean;
  submittedAt: string;
  submittedBy: string;
  updatedAt: string;
  updatedBy: string;
}

// Module BC-08: Tổng hợp dữ liệu nghiên cứu
export interface BC08Record {
  householdId: string;
  representativeName: string;
  group: StudyGroup;
  scoreK_Pre: number | null; // K trước
  scoreT_Pre: number | null; // T trước
  scoreYD_Pre: number | null; // YĐ trước
  scoreHT_Pre: number | null; // HT trước
  scoreCWM_Pre: number | null; // CWM trước (0-6)
  scoreHT_Post: number | null; // HT sau
  scoreCWM_Post: number | null; // CWM sau (0-6)
  deltaCWM: number | null; // ΔCWM = CWM sau - CWM trước
  w1_score: number | null;
  w2_score: number | null;
  w3_score: number | null;
  w4_score: number | null;
  w5_score: number | null;
  w6_score: number | null;
  status: 'INCOMPLETE' | 'IN_PROGRESS' | 'COMPLETED';
}

// Audit Log
export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  username: string;
  userRole: Role;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOCK' | 'UNLOCK' | 'RANDOMIZE' | 'SYNC' | 'RESET' | 'IMPORT_EXCEL';
  targetModule: string;
  householdId?: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
}

// Notification
export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'REMINDER';
  targetRole?: Role;
  targetHouseholdId?: string;
  isRead: boolean;
  createdAt: string;
}

// System Config
export interface ResearchConfig {
  appName: string;
  researchTitle: string;
  totalHouseholds: number;
  tnTarget: number;
  dcTarget: number;
  totalWeeks: number;
  cwmMaxScore: number;
  reminderDay: string; // 'Chủ nhật'
  reminderTime: string; // '19:00'
  startDate: string;
  endDate: string;
  spreadsheetId: string;
  appsScriptUrl: string;
  allowSelfRegistration: boolean;
  autoLockAfterDays: number;
}
