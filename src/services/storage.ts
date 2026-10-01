/**
 * Kho lưu trữ dữ liệu nghiên cứu trung tâm (Local-First + Google Sheets Synchronized)
 * Đảm bảo hoạt động ngoại tuyến (Offline-first), lưu trữ an toàn, toàn vẹn dữ liệu
 */

import {
  AuditLog,
  BC01Record,
  BC02Record,
  BC03Record,
  BC04Record,
  BC05Record,
  BC06Record,
  BC07Record,
  BC08Record,
  Household,
  ResearchConfig,
  SyncStatus,
  User,
  WeekNumber,
} from '../types';
import {
  CWM_CRITERIA_GUIDE,
  DEFAULT_CONFIG,
  DEFAULT_USERS,
  PERMANENT_APPS_SCRIPT_URL,
  generateInitialHouseholds,
  KNOWLEDGE_QUESTIONS,
} from '../config/initialData';
import { hashPassword } from '../utils/crypto';

const STORAGE_KEYS = {
  CONFIG: 'gfr_research_config_v1',
  USERS: 'gfr_research_users_v1',
  HOUSEHOLDS: 'gfr_research_households_v1',
  BC01: 'gfr_research_bc01_v1',
  BC02: 'gfr_research_bc02_v1',
  BC03: 'gfr_research_bc03_v1',
  BC04: 'gfr_research_bc04_v1',
  BC05: 'gfr_research_bc05_v1',
  BC06: 'gfr_research_bc06_v1',
  BC07: 'gfr_research_bc07_v1',
  AUDIT_LOGS: 'gfr_research_audit_logs_v1',
  CURRENT_USER: 'gfr_research_current_user_v1',
  SYNC_STATUS: 'gfr_research_sync_status_v1',
  OFFLINE_QUEUE: 'gfr_research_offline_queue_v1',
};

export class StorageService {
  // --- CONFIG ---
  static getConfig(): ResearchConfig {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONFIG);
      const parsed = data ? JSON.parse(data) : { ...DEFAULT_CONFIG };
      // Đảm bảo luôn sử dụng Apps Script URL cố định của người dùng
      if (!parsed.appsScriptUrl || parsed.appsScriptUrl.trim() === '') {
        parsed.appsScriptUrl = PERMANENT_APPS_SCRIPT_URL;
        localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(parsed));
      }
      return parsed;
    } catch {
      return { ...DEFAULT_CONFIG, appsScriptUrl: PERMANENT_APPS_SCRIPT_URL };
    }
  }

  static saveConfig(config: ResearchConfig): void {
    // Luôn bảo đảm không bị mất URL nếu người dùng vô tình lưu rỗng
    if (!config.appsScriptUrl || config.appsScriptUrl.trim() === '') {
      config.appsScriptUrl = PERMANENT_APPS_SCRIPT_URL;
    }
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  }

  // --- USERS ---
  static getUsers(): User[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static saveUsers(users: User[]): void {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  // --- HOUSEHOLDS ---
  static getHouseholds(): Household[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HOUSEHOLDS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static saveHouseholds(households: Household[]): void {
    localStorage.setItem(STORAGE_KEYS.HOUSEHOLDS, JSON.stringify(households));
  }

  // --- BC01 ---
  static getBC01List(): BC01Record[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BC01);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static saveBC01List(list: BC01Record[]): void {
    localStorage.setItem(STORAGE_KEYS.BC01, JSON.stringify(list));
  }

  // --- BC02 ---
  static getBC02List(): BC02Record[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BC02);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static saveBC02List(list: BC02Record[]): void {
    localStorage.setItem(STORAGE_KEYS.BC02, JSON.stringify(list));
  }

  // --- BC03 ---
  static getBC03List(): BC03Record[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BC03);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static saveBC03List(list: BC03Record[]): void {
    localStorage.setItem(STORAGE_KEYS.BC03, JSON.stringify(list));
  }

  // --- BC04 ---
  static getBC04List(): BC04Record[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BC04);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static saveBC04List(list: BC04Record[]): void {
    localStorage.setItem(STORAGE_KEYS.BC04, JSON.stringify(list));
  }

  // --- BC05 ---
  static getBC05List(): BC05Record[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BC05);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static saveBC05List(list: BC05Record[]): void {
    localStorage.setItem(STORAGE_KEYS.BC05, JSON.stringify(list));
  }

  // --- BC06 ---
  static getBC06List(): BC06Record[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BC06);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static saveBC06List(list: BC06Record[]): void {
    localStorage.setItem(STORAGE_KEYS.BC06, JSON.stringify(list));
  }

  // --- BC07 ---
  static getBC07List(): BC07Record[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BC07);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static saveBC07List(list: BC07Record[]): void {
    localStorage.setItem(STORAGE_KEYS.BC07, JSON.stringify(list));
  }

  // --- AUDIT LOGS ---
  static getAuditLogs(): AuditLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static saveAuditLogs(logs: AuditLog[]): void {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
  }

  static addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      ...log,
      id: `LOG_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
    };
    logs.unshift(newLog); // Thêm vào đầu danh sách
    // Giữ tối đa 1000 logs
    if (logs.length > 1000) logs.pop();
    this.saveAuditLogs(logs);
  }

  // --- CURRENT USER AUTH SESSION ---
  static getCurrentUser(): User | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  static setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }

  // --- SYNC STATUS ---
  static getSyncStatus(): SyncStatus {
    try {
      return (localStorage.getItem(STORAGE_KEYS.SYNC_STATUS) as SyncStatus) || 'SYNCED';
    } catch {
      return 'SYNCED';
    }
  }

  static setSyncStatus(status: SyncStatus): void {
    localStorage.setItem(STORAGE_KEYS.SYNC_STATUS, status);
  }

  // --- TÍNH TOÁN VÀ TỔNG HỢP BC-08 TỰ ĐỘNG ---
  static generateBC08Summary(): BC08Record[] {
    const households = this.getHouseholds();
    const bc02List = this.getBC02List();
    const bc03List = this.getBC03List();
    const bc04List = this.getBC04List();
    const bc06List = this.getBC06List();
    const bc07List = this.getBC07List();

    return households.map(h => {
      const bc02 = bc02List.find(b => b.householdId === h.id);
      const bc03 = bc03List.find(b => b.householdId === h.id);
      const cwmPre = bc04List.find(b => b.householdId === h.id && b.stage === 'PRE');
      const cwmPost = bc04List.find(b => b.householdId === h.id && b.stage === 'POST');
      const bc07 = bc07List.find(b => b.householdId === h.id);

      const weeklyReports = bc06List.filter(b => b.householdId === h.id);
      const w1 = weeklyReports.find(w => w.week === 'W1')?.weeklyScore ?? null;
      const w2 = weeklyReports.find(w => w.week === 'W2')?.weeklyScore ?? null;
      const w3 = weeklyReports.find(w => w.week === 'W3')?.weeklyScore ?? null;
      const w4 = weeklyReports.find(w => w.week === 'W4')?.weeklyScore ?? null;
      const w5 = weeklyReports.find(w => w.week === 'W5')?.weeklyScore ?? null;
      const w6 = weeklyReports.find(w => w.week === 'W6')?.weeklyScore ?? null;

      const scoreK_Pre = bc02 ? bc02.scoreK : null;
      const scoreT_Pre = bc02 ? bc02.scoreT : null;
      const scoreYD_Pre = bc03 ? bc03.scoreYD : null;
      const scoreHT_Pre = bc02 ? bc02.scoreHT : null;
      const scoreCWM_Pre = cwmPre ? cwmPre.scoreCWM : null;
      const scoreHT_Post = bc07 ? bc07.scoreHT_Post : null;
      const scoreCWM_Post = cwmPost ? cwmPost.scoreCWM : null;

      let deltaCWM: number | null = null;
      if (scoreCWM_Pre !== null && scoreCWM_Post !== null) {
        deltaCWM = scoreCWM_Post - scoreCWM_Pre;
      }

      let status: 'INCOMPLETE' | 'IN_PROGRESS' | 'COMPLETED' = 'INCOMPLETE';
      if (scoreCWM_Post !== null && scoreHT_Post !== null) {
        status = 'COMPLETED';
      } else if (scoreCWM_Pre !== null || scoreK_Pre !== null) {
        status = 'IN_PROGRESS';
      }

      return {
        householdId: h.id,
        representativeName: h.representativeName,
        group: h.group,
        scoreK_Pre,
        scoreT_Pre,
        scoreYD_Pre,
        scoreHT_Pre,
        scoreCWM_Pre,
        scoreHT_Post,
        scoreCWM_Post,
        deltaCWM,
        w1_score: w1,
        w2_score: w2,
        w3_score: w3,
        w4_score: w4,
        w5_score: w5,
        w6_score: w6,
        status,
      };
    });
  }

  // --- KHỞI TẠO HỆ THỐNG LẦN ĐẦU (SEEDING) ---
  static async initializeDatabaseIfEmpty(): Promise<void> {
    const existingUsers = this.getUsers();
    if (existingUsers.length === 0) {
      await this.resetToDemoData();
    }
  }

  // --- NẠP DỮ LIỆU DEMO ĐẦY ĐỦ 40 HỘ VÀ TÀI KHOẢN ---
  static async resetToDemoData(): Promise<void> {
    const households = generateInitialHouseholds();
    const users: User[] = [];

    // Mật khẩu mặc định cho Admin & Nghiên cứu viên là 'admin123' và 'researcher123'
    for (const u of DEFAULT_USERS) {
      const defaultPass = u.role === 'ADMIN' ? 'admin123' : 'researcher123';
      const hash = await hashPassword(defaultPass, u.salt);
      users.push({
        ...u,
        passwordHash: hash,
      });
    }

    // Tạo tài khoản cho 40 hộ chăn nuôi: username = h01..h40, mật khẩu = 'farm123'
    for (const h of households) {
      const username = h.id.toLowerCase();
      const salt = `SALT_${h.id}`;
      const hash = await hashPassword('farm123', salt);
      users.push({
        id: `USR_${h.id}`,
        username,
        fullName: h.representativeName,
        phone: h.phone,
        role: 'HOUSEHOLD',
        householdId: h.id,
        status: 'ACTIVE',
        passwordHash: hash,
        salt,
        createdAt: h.createdAt,
      });
    }

    // Tạo dữ liệu nghiên cứu phong phú cho 40 hộ
    // Nhóm TN (H01-H20): Có cam kết xanh, làm báo cáo W1-W6, có cải thiện CWM rõ rệt
    // Nhóm ĐC (H21-H40): Không làm cam kết xanh, không làm báo cáo tuần, CWM ít biến động
    const bc01List: BC01Record[] = [];
    const bc02List: BC02Record[] = [];
    const bc03List: BC03Record[] = [];
    const bc04List: BC04Record[] = [];
    const bc05List: BC05Record[] = [];
    const bc06List: BC06Record[] = [];
    const bc07List: BC07Record[] = [];

    for (const h of households) {
      const isTN = h.group === 'TN';
      const index = parseInt(h.id.replace('H', ''), 10);

      // BC-01
      bc01List.push({
        id: `BC01_${h.id}`,
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
        isLocked: true,
        createdAt: '2026-09-02T08:00:00Z',
        createdBy: 'admin',
        updatedAt: '2026-09-02T08:00:00Z',
        updatedBy: 'admin',
      });

      // BC-02 (KAP Pre): K (4 - 9 điểm), T (3.2 - 4.8), HT (2 - 5 điểm)
      const scoreK = Math.min(10, Math.max(3, 5 + ((index * 3) % 5)));
      const scoreT = Number((3.2 + ((index * 7) % 17) / 10).toFixed(1));
      const bReport = {
        b1_thuGom: index % 2 === 0,
        b2_phanLoai: index % 3 === 0,
        b3_luuChua: index % 2 === 1,
        b4_khongXaThang: index % 4 !== 0,
        b5_xuLyTaiSuDung: index % 3 !== 1,
        b6_veSinh: index % 2 === 0,
      };
      const scoreHT = Object.values(bReport).filter(Boolean).length;

      bc02List.push({
        id: `BC02_${h.id}`,
        householdId: h.id,
        knowledgeAnswers: KNOWLEDGE_QUESTIONS.map((q, idx) => ({
          questionId: q.id,
          selectedAnswer: idx < scoreK ? q.correctAnswer : (q.correctAnswer + 1) % 4,
          isCorrect: idx < scoreK,
          score: idx < scoreK ? 1 : 0,
        })),
        scoreK,
        attitudeAnswers: [
          { questionId: 'T01', score: Math.round(scoreT) },
          { questionId: 'T02', score: 4 },
          { questionId: 'T03', score: Math.min(5, Math.round(scoreT) + 1) },
          { questionId: 'T04', score: 4 },
          { questionId: 'T05', score: 5 },
        ],
        scoreT,
        behaviorReport: bReport,
        scoreHT,
        isLocked: true,
        submittedAt: '2026-09-03T09:00:00Z',
        submittedBy: 'nghiencuu01',
        updatedAt: '2026-09-03T09:00:00Z',
        updatedBy: 'nghiencuu01',
      });

      // BC-03 (Ý định YĐ trước: 3.0 - 4.8)
      const scoreYD = Number((3.4 + ((index * 5) % 15) / 10).toFixed(1));
      bc03List.push({
        id: `BC03_${h.id}`,
        householdId: h.id,
        answers: [
          { questionId: 'YD01', score: 4 },
          { questionId: 'YD02', score: 3 },
          { questionId: 'YD03', score: 4 },
          { questionId: 'YD04', score: 4 },
          { questionId: 'YD05', score: 4 },
        ],
        scoreYD,
        isLocked: true,
        submittedAt: '2026-09-04T10:00:00Z',
        submittedBy: 'nghiencuu01',
        updatedAt: '2026-09-04T10:00:00Z',
        updatedBy: 'nghiencuu01',
      });

      // BC-04 Pre (CWM trước can thiệp: điểm ban đầu 1 - 4/6 cho cả 2 nhóm)
      const cwmPreScore = Math.min(4, Math.max(1, 1 + (index % 4)));
      const criteriaPre = {
        b1_thuGom: cwmPreScore >= 1 ? 1 : 0,
        b2_phanLoai: cwmPreScore >= 4 ? 1 : 0,
        b3_luuChua: cwmPreScore >= 2 ? 1 : 0,
        b4_khongXaThang: cwmPreScore >= 3 ? 1 : 0,
        b5_xuLyTaiSuDung: cwmPreScore >= 2 ? 1 : 0,
        b6_veSinh: cwmPreScore >= 3 ? 1 : 0,
      };

      bc04List.push({
        id: `BC04_PRE_${h.id}`,
        householdId: h.id,
        stage: 'PRE',
        criteria: criteriaPre,
        scoreCWM: cwmPreScore,
        observationNotes: `Quan sát thực địa trước can thiệp. Nền chuồng còn ứ đọng nước rửa; hố phân chưa phủ bạt kín; có nguy cơ rửa trôi khi mưa to.`,
        evidenceDescription: `Ghi nhận thực tế tại ô chuồng số 2, chưa có thùng gom chai lọ vắc-xin thú y riêng.`,
        failureReasons: cwmPreScore < 6 ? 'Chưa phân loại rác thải nguy hại và hố ủ chưa có mái che đạt chuẩn' : '',
        observedBy: 'ThS. Trần Thị Mai',
        observedAt: '2026-09-05T08:30:00Z',
        isLocked: true,
        createdAt: '2026-09-05T08:30:00Z',
        createdBy: 'nghiencuu01',
        updatedAt: '2026-09-05T08:30:00Z',
        updatedBy: 'nghiencuu01',
      });

      // Nếu là nhóm TN (Can thiệp): Ký Cam kết xanh (BC-05) & thực hiện báo cáo tuần W1-W6
      if (isTN) {
        bc05List.push({
          id: `BC05_${h.id}`,
          householdId: h.id,
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
          confirmedAt: '2026-09-08T14:20:00Z',
          confirmedBy: h.representativeName,
          version: '1.0-CHÍNH THỨC',
          createdAt: '2026-09-08T14:20:00Z',
        });

        // 6 tuần báo cáo W1-W6 tăng dần điểm
        const weeks: WeekNumber[] = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'];
        weeks.forEach((w, wIdx) => {
          const weeklyScore = Math.min(6, cwmPreScore + Math.min(3, Math.floor((wIdx + 2) / 2)));
          bc06List.push({
            id: `BC06_${h.id}_${w}`,
            householdId: h.id,
            week: w,
            behaviors: {
              b1_thuGom: true,
              b2_phanLoai: weeklyScore >= 4,
              b3_luuChua: weeklyScore >= 3,
              b4_khongXaThang: true,
              b5_xuLyTaiSuDung: weeklyScore >= 5,
              b6_veSinh: weeklyScore >= 2,
            },
            weeklyScore,
            barriers: wIdx < 2 ? ['Thiếu thời gian', 'Khó duy trì thói quen'] : (wIdx === 3 ? ['Chi phí mua chế phẩm'] : []),
            otherBarrierText: wIdx < 2 ? 'Tuần đầu còn quên phân loại vỏ thuốc' : undefined,
            isLocked: true,
            submittedAt: `2026-09-${14 + wIdx * 7}T19:30:00Z`,
            submittedBy: h.representativeName,
            updatedAt: `2026-09-${14 + wIdx * 7}T19:30:00Z`,
            updatedBy: h.representativeName,
          });
        });
      }

      // BC-04 Post (CWM sau can thiệp):
      // Nhóm TN cải thiện mạnh (4 - 6 điểm, ΔCWM từ +1 đến +4)
      // Nhóm ĐC hầu như không thay đổi hoặc chỉ tăng nhẹ ngẫu nhiên (1 - 4 điểm, ΔCWM từ -1 đến +1)
      let cwmPostScore = cwmPreScore;
      if (isTN) {
        cwmPostScore = Math.min(6, cwmPreScore + 1 + (index % 3)); // Tăng điểm thực nghiệm
      } else {
        cwmPostScore = Math.max(1, Math.min(5, cwmPreScore + ((index % 3) - 1))); // Dao động ngẫu nhiên
      }

      const criteriaPost = {
        b1_thuGom: cwmPostScore >= 1 ? 1 : 0,
        b2_phanLoai: cwmPostScore >= 5 ? 1 : 0,
        b3_luuChua: cwmPostScore >= 3 ? 1 : 0,
        b4_khongXaThang: cwmPostScore >= 2 ? 1 : 0,
        b5_xuLyTaiSuDung: cwmPostScore >= 4 ? 1 : 0,
        b6_veSinh: cwmPostScore >= 4 ? 1 : 0,
      };

      bc04List.push({
        id: `BC04_POST_${h.id}`,
        householdId: h.id,
        stage: 'POST',
        criteria: criteriaPost,
        scoreCWM: cwmPostScore,
        observationNotes: isTN
          ? `Hộ nhóm TN duy trì tốt Cam kết xanh: Chuồng trại sạch sẽ, đã làm hố ủ phân có mái tôn che mưa, vỏ thuốc thú y thu vào xô nhựa riêng biệt.`
          : `Hộ nhóm ĐC: Tình trạng chuồng trại duy trì như trước, chưa phân loại rác thải thú y, nước phân vẫn rỉ ra rãnh thoát chung.`,
        evidenceDescription: isTN ? `Đã bổ sung men ủ vi sinh Trichoderma, nhiệt độ đống ủ đạt 55°C, giảm 80% ruồi nhặng.` : `Chưa có hố ủ cải tiến.`,
        failureReasons: cwmPostScore < 6 ? 'Chưa che chắn hoàn toàn khi mưa to hoặc phân loại chưa triệt để' : '',
        observedBy: 'ThS. Trần Thị Mai & KS. Lê Hoàng Long',
        observedAt: '2026-10-28T09:00:00Z',
        isLocked: true,
        createdAt: '2026-10-28T09:00:00Z',
        createdBy: 'nghiencuu01',
        updatedAt: '2026-10-28T09:00:00Z',
        updatedBy: 'nghiencuu01',
      });

      // BC-07 (Khảo sát sau can thiệp)
      bc07List.push({
        id: `BC07_${h.id}`,
        householdId: h.id,
        behaviorReport: {
          b1_thuGom: true,
          b2_phanLoai: cwmPostScore >= 4,
          b3_luuChua: cwmPostScore >= 3,
          b4_khongXaThang: true,
          b5_xuLyTaiSuDung: cwmPostScore >= 4,
          b6_veSinh: cwmPostScore >= 3,
        },
        scoreHT_Post: Math.min(6, cwmPostScore + (isTN ? 0 : 1)),
        maintenanceWillingness: isTN ? 5 : 3,
        feedbackProcess: isTN
          ? 'Nhờ có Cam kết xanh và ứng dụng nhắc nhở hàng tuần, gia đình đã hình thành nề nếp thu gom phân và ủ vi sinh bón cây ăn quả rất hiệu quả.'
          : 'Gia đình vẫn làm theo kinh nghiệm cũ, chưa có điều kiện cải tạo nhiều.',
        mainBarriers: isTN ? ['Chi phí mua chế phẩm định kỳ'] : ['Thiếu thời gian', 'Thiếu dụng cụ', 'Chưa biết kỹ thuật ủ'],
        isLocked: true,
        submittedAt: '2026-10-29T10:00:00Z',
        submittedBy: 'nghiencuu01',
        updatedAt: '2026-10-29T10:00:00Z',
        updatedBy: 'nghiencuu01',
      });
    }

    // Lưu toàn bộ dữ liệu vào LocalStorage
    this.saveConfig(DEFAULT_CONFIG);
    this.saveUsers(users);
    this.saveHouseholds(households);
    this.saveBC01List(bc01List);
    this.saveBC02List(bc02List);
    this.saveBC03List(bc03List);
    this.saveBC04List(bc04List);
    this.saveBC05List(bc05List);
    this.saveBC06List(bc06List);
    this.saveBC07List(bc07List);

    // Ghi Audit log khởi tạo
    const initLogs: AuditLog[] = [
      {
        id: 'LOG_INIT_001',
        timestamp: '2026-09-01T08:00:00Z',
        userId: 'USR_ADMIN_01',
        username: 'admin',
        userRole: 'ADMIN',
        action: 'CREATE',
        targetModule: 'SYSTEM',
        reason: 'Khởi tạo hệ thống nghiên cứu Cam kết xanh với 40 hộ chuẩn (20 TN, 20 ĐC).',
      },
      {
        id: 'LOG_INIT_002',
        timestamp: '2026-09-02T10:00:00Z',
        userId: 'USR_ADMIN_01',
        username: 'admin',
        userRole: 'ADMIN',
        action: 'RANDOMIZE',
        targetModule: 'HOUSEHOLDS',
        reason: 'Thực hiện phân nhóm ngẫu nhiên H01-H20 (TN), H21-H40 (ĐC) theo đề cương nghiên cứu.',
      }
    ];
    this.saveAuditLogs(initLogs);
  }

  // --- XÓA TOÀN BỘ DỮ LIỆU NGHIÊN CỨU (Chỉ Admin) ---
  static clearResearchData(): void {
    localStorage.removeItem(STORAGE_KEYS.BC01);
    localStorage.removeItem(STORAGE_KEYS.BC02);
    localStorage.removeItem(STORAGE_KEYS.BC03);
    localStorage.removeItem(STORAGE_KEYS.BC04);
    localStorage.removeItem(STORAGE_KEYS.BC05);
    localStorage.removeItem(STORAGE_KEYS.BC06);
    localStorage.removeItem(STORAGE_KEYS.BC07);
    this.addAuditLog({
      userId: 'admin',
      username: 'admin',
      userRole: 'ADMIN',
      action: 'RESET',
      targetModule: 'ALL_RESEARCH_DATA',
      reason: 'Admin đã làm sạch dữ liệu nghiên cứu để bắt đầu khảo sát thực tế mới.',
    });
  }
}
