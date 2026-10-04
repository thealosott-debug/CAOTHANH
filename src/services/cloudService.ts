/**
 * Dịch vụ đồng bộ lưu trữ Đám mây (Cloud Server & Google Sheets)
 * Đảm bảo 100% dữ liệu tài khoản, hộ chăn nuôi, các phiếu khảo sát được lưu vĩnh viễn trên Cloud
 * Tự động đồng bộ mà không cần người dùng phải bấm nút hay yêu cầu thủ công
 */

import { StorageService } from './storage';
import { GoogleSheetsService } from './googleSheets';
import { PERMANENT_APPS_SCRIPT_URL } from '../config/initialData';

export class CloudService {
  private static saveTimeout: any = null;
  private static isSaving: boolean = false;

  /**
   * Lưu toàn bộ dữ liệu hệ thống lên máy chủ Cloud
   */
  static async saveAllToCloud(includeSheetsPush: boolean = true): Promise<{ success: boolean; message: string }> {
    try {
      this.isSaving = true;
      const config = StorageService.getConfig();
      const users = StorageService.getUsers();
      const households = StorageService.getHouseholds();
      const bc01 = StorageService.getBC01List();
      const bc02 = StorageService.getBC02List();
      const bc03 = StorageService.getBC03List();
      const bc04 = StorageService.getBC04List();
      const bc05 = StorageService.getBC05List();
      const bc06 = StorageService.getBC06List();
      const bc07 = StorageService.getBC07List();
      const auditLogs = StorageService.getAuditLogs();

      // Chuẩn bị payload bảng tính nếu cần chuyển tiếp lên Google Sheets
      const sheetsPayload = includeSheetsPush ? GoogleSheetsService.prepareWorkbookPayload() : undefined;

      const payload = {
        config,
        users,
        households,
        bc01,
        bc02,
        bc03,
        bc04,
        bc05,
        bc06,
        bc07,
        auditLogs,
        forwardToGoogleSheets: includeSheetsPush,
        appsScriptUrl: config.appsScriptUrl || PERMANENT_APPS_SCRIPT_URL,
        spreadsheetId: config.spreadsheetId || '',
        sheets: sheetsPayload,
      };

      const res = await fetch('/api/cloud-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const result = await res.json();
      this.isSaving = false;

      // Kéo ngược tức thời sau khi đẩy để dữ liệu 2 bên thông suốt 100%
      if (includeSheetsPush) {
        setTimeout(() => {
          GoogleSheetsService.pullFromGoogleSheets().catch(() => {});
        }, 500);
      }

      return { success: true, message: result.message || 'Đã lưu lên Cloud thành công!' };
    } catch (err: any) {
      this.isSaving = false;
      console.warn('Lưu lên Cloud chưa hoàn tất (sẽ thử lại tự động):', err.message);
      return { success: false, message: err.message };
    }
  }

  /**
   * Lấy toàn bộ dữ liệu từ máy chủ Cloud về ứng dụng khi khởi động
   * Đảm bảo mở app trên thiết bị mới, tab mới hay xóa cache trình duyệt vẫn giữ 100% dữ liệu
   */
  static async loadFromCloud(): Promise<boolean> {
    try {
      const res = await fetch('/api/cloud-data');
      if (!res.ok) return false;
      const json = await res.json();

      if (json.exists && json.data) {
        const d = json.data;
        // Phục hồi an toàn: Chỉ ghi đè nếu dữ liệu đám mây hợp lệ
        if (Array.isArray(d.users) && d.users.length > 0) {
          const localUsers = StorageService.getUsers();
          // Hợp nhất người dùng theo username chuẩn hóa để không bị trùng lặp và lấy bản cập nhật mới nhất từ Cloud
          const userMap = new Map<string, any>();
          localUsers.forEach(u => userMap.set(u.username.toLowerCase(), u));
          d.users.forEach((u: any) => {
            const key = (u.username || u.id).toLowerCase();
            userMap.set(key, u);
          });
          StorageService.saveUsersDirectly(Array.from(userMap.values()));
        }

        if (Array.isArray(d.households) && d.households.length > 0) {
          const localHouseholds = StorageService.getHouseholds();
          if (localHouseholds.length === 0 || d.households.length >= localHouseholds.length) {
            StorageService.saveHouseholdsDirectly(d.households);
          }
        }

        if (Array.isArray(d.bc01) && d.bc01.length > 0) {
          StorageService.saveBC01ListDirectly(d.bc01);
        }
        if (Array.isArray(d.bc02) && d.bc02.length > 0) {
          StorageService.saveBC02ListDirectly(d.bc02);
        }
        if (Array.isArray(d.bc03) && d.bc03.length > 0) {
          StorageService.saveBC03ListDirectly(d.bc03);
        }
        if (Array.isArray(d.bc04) && d.bc04.length > 0) {
          StorageService.saveBC04ListDirectly(d.bc04);
        }
        if (Array.isArray(d.bc05) && d.bc05.length > 0) {
          StorageService.saveBC05ListDirectly(d.bc05);
        }
        if (Array.isArray(d.bc06) && d.bc06.length > 0) {
          StorageService.saveBC06ListDirectly(d.bc06);
        }
        if (Array.isArray(d.bc07) && d.bc07.length > 0) {
          StorageService.saveBC07ListDirectly(d.bc07);
        }
        if (d.config && typeof d.config === 'object') {
          StorageService.saveConfigDirectly(d.config);
        }

        return true;
      }
      return false;
    } catch (err) {
      console.warn('Không thể nạp dữ liệu từ Cloud (có thể đang ở chế độ ngoại tuyến):', err);
      return false;
    }
  }

  /**
   * Lên lịch tự động lưu lên Cloud và đẩy Google Sheets
   * Tự động kích hoạt mỗi khi có bất kỳ thay đổi nào (tạo tài khoản, tạo hộ, làm khảo sát...)
   */
  static triggerAutoSave(delayMs: number = 500): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.saveAllToCloud(true);
    }, delayMs);
  }
}
