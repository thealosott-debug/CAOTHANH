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

type SyncListener = () => void;

export class StorageService {
  private static syncListeners: SyncListener[] = [];

  static onDataChange(listener: SyncListener): () => void {
    this.syncListeners.push(listener);
    return () => {
      this.syncListeners = this.syncListeners.filter(l => l !== listener);
    };
  }

  static notifyDataChange(): void {
    localStorage.setItem(STORAGE_KEYS.SYNC_STATUS, 'PENDING');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gfr_data_change'));
    }
    this.syncListeners.forEach(listener => {
      try {
        listener();
      } catch (e) {
        console.error('Error in sync listener:', e);
      }
    });
  }

  // --- CONFIG ---
  static getConfig(): ResearchConfig {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONFIG);
      const parsed = data ? JSON.parse(data) : { ...DEFAULT_CONFIG };
      // Đảm bảo luôn sử dụng Apps Script URL cố định của người dùng
      if (!parsed.appsScriptUrl || parsed.appsScriptUrl.trim() === '') {
        parsed.appsScriptUrl = PERMANENT_APPS_SCRIPT_URL;
      }
      // Tự động đồng bộ chuẩn hóa tên đề tài mới nhất theo chỉ đạo
      if (!parsed.researchTitle || parsed.researchTitle !== DEFAULT_CONFIG.researchTitle) {
        parsed.researchTitle = DEFAULT_CONFIG.researchTitle;
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
    this.notifyDataChange();
  }

  static saveConfigDirectly(config: ResearchConfig): void {
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
    this.notifyDataChange();
  }

  static saveUsersDirectly(users: User[]): void {
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
    this.notifyDataChange();
  }

  static saveHouseholdsDirectly(households: Household[]): void {
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
    this.notifyDataChange();
  }

  static saveBC01ListDirectly(list: BC01Record[]): void {
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
    this.notifyDataChange();
  }

  static saveBC02ListDirectly(list: BC02Record[]): void {
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
    this.notifyDataChange();
  }

  static saveBC03ListDirectly(list: BC03Record[]): void {
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
    this.notifyDataChange();
  }

  static saveBC04ListDirectly(list: BC04Record[]): void {
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
    this.notifyDataChange();
  }

  static saveBC05ListDirectly(list: BC05Record[]): void {
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
    this.notifyDataChange();
  }

  static saveBC06ListDirectly(list: BC06Record[]): void {
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
    this.notifyDataChange();
  }

  static saveBC07ListDirectly(list: BC07Record[]): void {
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
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gfr_data_change'));
    }
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

  // --- KHỞI TẠO HỆ THỐNG AN TOÀN (BẢO TOÀN DỮ LIỆU ĐÃ TẠO) ---
  static async initializeDatabaseIfEmpty(): Promise<void> {
    const existingUsers = this.getUsers();
    const hasAdmin = existingUsers.some(u => u.role === 'ADMIN');

    // Chỉ bổ sung tài khoản Admin mặc định nếu hệ thống chưa từng có admin
    if (!hasAdmin) {
      const adminUser: User = {
        id: 'USR_ADMIN_01',
        username: 'admin',
        fullName: 'Quản trị viên (Chủ nhiệm đề tài)',
        email: 'admin@research.vn',
        phone: '',
        role: 'ADMIN',
        status: 'ACTIVE',
        password: '123456',
        plainPasswordHint: '123456',
        createdAt: new Date().toISOString(),
      };
      // Giữ nguyên toàn bộ tài khoản người dùng đã tạo trước đó
      const mergedUsers = [adminUser, ...existingUsers.filter(u => u.username !== 'admin')];
      this.saveUsersDirectly(mergedUsers);
    }
  }

  // --- XÓA TOÀN BỘ DỮ LIỆU NỀN MẪU, ĐỂ TRẮNG ĐÓN DỮ LIỆU THỰC TẾ ---
  static async resetToCleanState(): Promise<void> {
    const adminUser: User = {
      id: 'USR_ADMIN_01',
      username: 'admin',
      fullName: 'Quản trị viên (Chủ nhiệm đề tài)',
      email: 'admin@research.vn',
      phone: '',
      role: 'ADMIN',
      status: 'ACTIVE',
      password: '123456',
      plainPasswordHint: '123456',
      createdAt: new Date().toISOString(),
    };

    // Chỉ giữ lại tài khoản Admin để đăng nhập quản trị
    this.saveUsers([adminUser]);
    this.saveHouseholds([]);
    this.saveBC01List([]);
    this.saveBC02List([]);
    this.saveBC03List([]);
    this.saveBC04List([]);
    this.saveBC05List([]);
    this.saveBC06List([]);
    this.saveBC07List([]);
    this.setCurrentUser(adminUser);

    this.saveAuditLogs([
      {
        id: 'LOG_INIT_CLEAN',
        timestamp: new Date().toISOString(),
        userId: 'USR_ADMIN_01',
        username: 'admin',
        userRole: 'ADMIN',
        action: 'RESET',
        targetModule: 'SYSTEM',
        reason: 'Hệ thống đã xóa toàn bộ dữ liệu nền mẫu (hộ kinh doanh, người nghiên cứu, khảo sát cũ). Sẵn sàng tiếp nhận dữ liệu thực tế.',
      },
    ]);

    localStorage.setItem('gfr_real_data_clean_flag_v3', 'true');
  }

  // --- NẠP DỮ LIỆU DEMO ĐẦY ĐỦ (KHI CẦN THỬ NGHIỆM) ---
  static async resetToDemoData(): Promise<void> {
    await this.resetToCleanState();
  }

  // --- XÓA TOÀN BỘ DỮ LIỆU NGHIÊN CỨU (Chỉ Admin) ---
  static clearResearchData(): void {
    this.saveHouseholds([]);
    this.saveBC01List([]);
    this.saveBC02List([]);
    this.saveBC03List([]);
    this.saveBC04List([]);
    this.saveBC05List([]);
    this.saveBC06List([]);
    this.saveBC07List([]);
    this.addAuditLog({
      userId: 'admin',
      username: 'admin',
      userRole: 'ADMIN',
      action: 'RESET',
      targetModule: 'ALL_RESEARCH_DATA',
      reason: 'Admin đã làm sạch toàn bộ dữ liệu hộ chăn nuôi và khảo sát để nhập dữ liệu thực tế.',
    });
  }
}
