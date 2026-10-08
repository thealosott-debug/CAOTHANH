/**
 * Toàn bộ mã nguồn Google Apps Script chuẩn Tiếng Việt
 * Sẵn sàng copy-paste vào Google Sheets để lưu trữ vĩnh viễn và đồng bộ 2 chiều
 */

export const APPS_SCRIPT_SOURCE_CODE = `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT CHO HỆ THỐNG QUẢN LÝ CHĂN NUÔI GÀ & NGHIÊN CỨU KHOA HỌC
 * Lưu trữ vĩnh viễn dữ liệu trên Google Sheets - Đồng bộ tự động 2 chiều
 * Toàn bộ các bảng tính và tiêu đề được chuẩn hóa 100% bằng Tiếng Việt
 * =========================================================================
 * 
 * HƯỚNG DẪN TRIỂN KHAI NHANH TRONG 3 BƯỚC:
 * 1. Mở file Google Sheets của bạn -> Vào menu "Tiện ích mở rộng" (Extensions) -> "Apps Script"
 * 2. Xóa hết mã cũ trong file Code.gs, DÁN TOÀN BỘ MÃ NÀY VÀO rồi nhấn biểu tượng Lưu (Ctrl + S)
 * 3. Nhấn nút xanh "Triển khai" (Deploy) ở góc trên bên phải:
 *    - Chọn "Quản lý bản triển khai" (Manage deployments) -> Biểu tượng Bút chì (Chỉnh sửa)
 *    - Phiên bản (Version): Chọn "Phiên bản mới" (New version)
 *    - Ai có quyền truy cập (Who has access): Chọn "Bất kỳ ai" (Anyone)
 *    - Nhấn "Triển khai" (Deploy) -> Sao chép URL Ứng dụng web và lưu vào Cấu hình ứng dụng!
 * 
 * ĐẶC TÍNH NỔI BẬT:
 * - KHÔNG BAO GIỜ XÓA DỮ LIỆU CŨ: Cập nhật thông minh (Upsert), bảo toàn vĩnh viễn mọi dòng
 * - ĐỒNG BỘ 2 CHIỀU: Đọc và ghi trực tiếp giữa Google Sheets và App theo thời gian thực
 * - TỰ ĐỘNG TẠO ĐỦ CÁC SHEET TIẾNG VIỆT: GIANG_VIEN, HOC_VIEN, HO_CHAN_NUOI, NHAT_KY_CHAN_NUOI...
 */

var VIETNAMESE_SHEET_DEFS = {
  'TAI_KHOAN': {
    name: 'TAI_KHOAN',
    title: 'Danh sách Tổng hợp Toàn bộ Tài khoản (HDAN, GV, HS, Hộ dân, Quản trị)',
    keyColIdx: 1, // Cột 2: TÊN ĐĂNG NHẬP
    headers: [
      'MÃ TÀI KHOẢN', 'TÊN ĐĂNG NHẬP', 'HỌ VÀ TÊN', 'VAI TRÒ', 'CHỨC VỤ / HỌC VỊ',
      'ĐƠN VỊ / ĐỊA CHỈ', 'SỐ ĐIỆN THOẠI', 'EMAIL', 'MÃ HỘ LIÊN KẾT', 'MẬT KHẨU',
      'TRẠNG THÁI', 'NGÀY TẠO', 'NGÀY CẬP NHẬT'
    ]
  },
  'GIANG_VIEN': {
    name: 'GIANG_VIEN',
    title: 'Danh sách Giảng viên & Ban nghiên cứu',
    keyColIdx: 0,
    headers: [
      'MÃ GIẢNG VIÊN', 'HỌ VÀ TÊN', 'SỐ ĐIỆN THOẠI', 'EMAIL', 'ĐƠN VỊ / BỘ MÔN', 
      'CHỨC VỤ / HỌC VỊ', 'TÊN ĐĂNG NHẬP', 'MẬT KHẨU', 'VAI TRÒ', 'TRẠNG THÁI', 
      'NGÀY TẠO', 'NGÀY CẬP NHẬT', 'GHI CHÚ'
    ]
  },
  'HOC_VIEN': {
    name: 'HOC_VIEN',
    title: 'Danh sách Học sinh / Sinh viên phụ trách',
    keyColIdx: 0,
    headers: [
      'MÃ HỌC VIÊN', 'HỌ VÀ TÊN', 'NHÓM / LỚP', 'SỐ ĐIỆN THOẠI', 'EMAIL', 
      'HỘ PHỤ TRÁCH', 'TÊN ĐĂNG NHẬP', 'MẬT KHẨU', 'VAI TRÒ', 'TRẠNG THÁI', 
      'NGÀY THAM GIA', 'GHI CHÚ', 'NGÀY TẠO', 'NGÀY CẬP NHẬT'
    ]
  },
  'HO_CHAN_NUOI': {
    name: 'HO_CHAN_NUOI',
    title: 'Danh mục Hộ chăn nuôi gà',
    keyColIdx: 0,
    headers: [
      'MÃ HỘ', 'TÊN CHỦ HỘ', 'SỐ ĐIỆN THOẠI', 'ĐỊA CHỈ', 'NHÓM NGHIÊN CỨU', 
      'QUY MÔ ĐÀN (CON)', 'GIỐNG GÀ', 'HÌNH THỨC NUÔI', 'HỌC VIÊN PHỤ TRÁCH', 'GIẢNG VIÊN GIÁM SÁT', 
      'TÊN ĐĂNG NHẬP', 'MẬT KHẨU', 'TRẠNG THÁI', 'NGÀY VÀO ĐÀN', 'GHI CHÚ', 
      'NGÀY TẠO', 'NGÀY CẬP NHẬT'
    ]
  },
  'NHAT_KY_CHAN_NUOI': {
    name: 'NHAT_KY_CHAN_NUOI',
    title: 'Nhật ký chăn nuôi & Quản lý chất thải hàng ngày/tuần',
    keyColIdx: 0,
    headers: [
      'MÃ NHẬT KÝ', 'MÃ HỘ', 'TÊN CHỦ HỘ', 'NGÀY GHI', 'TUẦN THEO DÕI', 
      'SỐ GÀ HIỆN CÓ', 'SỐ GÀ HAO HỤT', 'LƯỢNG THỨC ĂN (KG)', 'LƯỢNG NƯỚC UỐNG (LÍT)', 'TRỌNG LƯỢNG TB (KG/CON)', 
      'TÌNH TRẠNG SỨC KHỎE', 'THUỐC / VẮC XIN', 'XỬ LÝ PHÂN / ĐỆM LÓT', 'ĐIỂM QUẢN LÝ CHẤT THẢI (0-6)', 
      'NGƯỜI GHI CHÉP', 'GHI CHÚ', 'THỜI GIAN LƯU'
    ]
  },
  'LICH_TIEM_VACCINE': {
    name: 'LICH_TIEM_VACCINE',
    title: 'Lịch tiêm phòng vắc xin cho đàn gà',
    keyColIdx: 0,
    headers: [
      'MÃ LỊCH', 'MÃ HỘ', 'TUẦN TUỔI', 'TÊN VẮC XIN', 'ĐƯỜNG DÙNG', 
      'NGÀY DỰ KIẾN', 'NGÀY THỰC HIỆN', 'TRẠNG THÁI', 'NGƯỜI THỰC HIỆN', 'GHI CHÚ', 
      'THỜI GIAN CẬP NHẬT'
    ]
  },
  'BAO_CAO_DANH_GIA': {
    name: 'BAO_CAO_DANH_GIA',
    title: 'Báo cáo đánh giá nghiên cứu (KAP, Cam kết, CWM, Tổng hợp)',
    keyColIdx: 0,
    headers: [
      'MÃ BÁO CÁO', 'MÃ HỘ', 'TÊN CHỦ HỘ', 'LOẠI BÁO CÁO', 'TUẦN / GIAI ĐOẠN', 
      'ĐIỂM K', 'ĐIỂM T', 'ĐIỂM YĐ', 'ĐIỂM HT', 'ĐIỂM CWM', 
      'CHI TIẾT ĐÁNH GIÁ', 'NGƯỜI ĐÁNH GIÁ', 'NGÀY ĐÁNH GIÁ', 'TRẠNG THÁI'
    ]
  },
  'LICH_SU_HOAT_DONG': {
    name: 'LICH_SU_HOAT_DONG',
    title: 'Nhật ký kiểm toán lưu vĩnh viễn mọi thao tác',
    keyColIdx: 0,
    headers: [
      'MÃ LỊCH SỬ', 'THỜI GIAN', 'TÊN ĐĂNG NHẬP', 'HỌ VÀ TÊN', 'VAI TRÒ', 
      'HÀNH ĐỘNG', 'ĐỐI TƯỢNG', 'CHI TIẾT NỘI DUNG', 'TRẠNG THÁI'
    ]
  },
  'CAU_HINH': {
    name: 'CAU_HINH',
    title: 'Cấu hình tham số hệ thống',
    keyColIdx: 0,
    headers: ['KHÓA', 'GIÁ TRỊ', 'MÔ TẢ', 'NGÀY CẬP NHẬT']
  }
};

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'PULL_ALL_SHEETS';
  var spreadsheetId = (e && e.parameter && e.parameter.spreadsheetId) ? e.parameter.spreadsheetId : '';

  var spreadsheet = getSpreadsheet(spreadsheetId);
  if (!spreadsheet) {
    return jsonResponse({
      status: 'error',
      message: 'Không tìm thấy Google Spreadsheet.'
    });
  }

  ensureVietnameseSheets(spreadsheet);

  if (action === 'PING') {
    return jsonResponse({
      status: 'success',
      message: 'Kết nối Google Apps Script thành công! Cơ sở dữ liệu Google Sheets sẵn sàng.',
      spreadsheetName: spreadsheet.getName(),
      timestamp: new Date().toISOString()
    });
  }

  return exportFullSpreadsheetData(spreadsheet);
}

function doPost(e) {
  try {
    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);
    var spreadsheet = getSpreadsheet(data.spreadsheetId);

    if (!spreadsheet) {
      return jsonResponse({
        status: 'error',
        message: 'Không tìm thấy Google Spreadsheet. Hãy kiểm tra Spreadsheet ID.'
      });
    }

    ensureVietnameseSheets(spreadsheet);

    var action = data.action || 'SYNC_UPSERT_SHEETS';

    if (action === 'PULL_ALL_SHEETS' || action === 'GET_ALL' || action === 'READ_ALL') {
      return exportFullSpreadsheetData(spreadsheet);
    }

    if (action === 'SYNC_UPSERT_SHEETS' || action === 'SYNC_ALL_SHEETS') {
      var sheetsData = data.sheets || {};
      var totalUpserted = 0;

      for (var sheetKey in sheetsData) {
        if (!sheetsData.hasOwnProperty(sheetKey)) continue;
        var incomingRows = sheetsData[sheetKey];
        if (!incomingRows || !Array.isArray(incomingRows) || incomingRows.length === 0) continue;

        var targetSheet = spreadsheet.getSheetByName(sheetKey);
        if (!targetSheet) {
          targetSheet = spreadsheet.insertSheet(sheetKey);
        }

        var sheetDef = VIETNAMESE_SHEET_DEFS[sheetKey];
        var keyColIdx = (sheetDef && sheetDef.keyColIdx !== undefined) ? sheetDef.keyColIdx : 0;

        upsertSheetDataPermanently(targetSheet, incomingRows, keyColIdx);
        totalUpserted++;
      }

      logAuditAction(spreadsheet, 'ĐỒNG BỘ APP -> GOOGLE SHEETS', 'Hệ thống đã lưu vĩnh viễn ' + totalUpserted + ' bảng tính.');

      return jsonResponse({
        status: 'success',
        message: 'Đã lưu vĩnh viễn dữ liệu lên Google Sheets thành công (Bảo toàn 100% dữ liệu lịch sử)!',
        spreadsheetName: spreadsheet.getName(),
        updatedAt: new Date().toISOString()
      });
    }

    if (action === 'INIT_SHEETS') {
      khoiTaoDuLieuMauTiengViet(spreadsheet);
      return jsonResponse({
        status: 'success',
        message: 'Đã khởi tạo thành công toàn bộ các bảng tính chăn nuôi Tiếng Việt chuẩn mực!'
      });
    }

    return jsonResponse({
      status: 'error',
      message: 'Hành động không hợp lệ: ' + action
    });

  } catch (err) {
    return jsonResponse({
      status: 'error',
      message: 'Lỗi máy chủ Google Apps Script: ' + err.toString()
    });
  }
}

function getSpreadsheet(spreadsheetId) {
  if (spreadsheetId && String(spreadsheetId).trim() !== '') {
    try {
      return SpreadsheetApp.openById(String(spreadsheetId).trim());
    } catch (e) {
      return SpreadsheetApp.getActiveSpreadsheet();
    }
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

function ensureVietnameseSheets(ss) {
  for (var key in VIETNAMESE_SHEET_DEFS) {
    var def = VIETNAMESE_SHEET_DEFS[key];
    var sheet = ss.getSheetByName(def.name);
    if (!sheet) {
      sheet = ss.insertSheet(def.name);
      var headerRow = [def.headers];
      sheet.getRange(1, 1, 1, def.headers.length).setValues(headerRow);
      formatHeader(sheet, def.headers.length);
    }
  }
}

function formatHeader(sheet, numCols) {
  try {
    var headerRange = sheet.getRange(1, 1, 1, numCols);
    headerRange.setBackground('#065f46');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, Math.min(numCols, 15));
  } catch (e) {
  }
}

function upsertSheetDataPermanently(sheet, incomingRows, keyColIdx) {
  if (!incomingRows || incomingRows.length === 0) return;

  var lastRow = sheet.getLastRow();
  var numIncomingCols = incomingRows[0].length;

  if (lastRow === 0) {
    sheet.getRange(1, 1, incomingRows.length, numIncomingCols).setValues(incomingRows);
    formatHeader(sheet, numIncomingCols);
    return;
  }

  var lastCol = Math.max(sheet.getLastColumn(), numIncomingCols);
  var existingData = sheet.getRange(1, 1, lastRow, lastCol).getValues();

  var existingKeyMap = {};
  for (var r = 1; r < existingData.length; r++) {
    var kVal = String(existingData[r][keyColIdx] || '').trim().toUpperCase();
    if (kVal) {
      existingKeyMap[kVal] = r + 1;
    }
  }

  var startIncomingIdx = (incomingRows.length > 1 && String(incomingRows[0][keyColIdx] || '').toUpperCase().includes('MÃ')) ? 1 : 0;
  var rowsToAppend = [];

  for (var i = startIncomingIdx; i < incomingRows.length; i++) {
    var inRow = incomingRows[i];
    var inKey = String(inRow[keyColIdx] || '').trim().toUpperCase();
    if (!inKey) continue;

    var cleanRow = [];
    for (var c = 0; c < lastCol; c++) {
      var cellVal = inRow[c];
      cleanRow.push(cellVal !== undefined && cellVal !== null ? cellVal : '');
    }

    if (existingKeyMap[inKey]) {
      var targetRowNumber = existingKeyMap[inKey];
      sheet.getRange(targetRowNumber, 1, 1, cleanRow.length).setValues([cleanRow]);
    } else {
      rowsToAppend.push(cleanRow);
      existingKeyMap[inKey] = lastRow + rowsToAppend.length;
    }
  }

  if (rowsToAppend.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rowsToAppend.length, rowsToAppend[0].length).setValues(rowsToAppend);
  }
}

function logAuditAction(ss, action, detail) {
  try {
    var logSheet = ss.getSheetByName('LICH_SU_HOAT_DONG');
    if (!logSheet) {
      ensureVietnameseSheets(ss);
      logSheet = ss.getSheetByName('LICH_SU_HOAT_DONG');
    }
    if (logSheet) {
      var logId = 'LOG_' + new Date().getTime();
      var now = Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd HH:mm:ss');
      logSheet.appendRow([logId, now, 'SYSTEM', 'Hệ thống Quản lý Gà', 'SYSTEM', action, 'TOÀN BỘ SHEET', detail, 'THÀNH CÔNG']);
    }
  } catch (e) {
  }
}

function exportFullSpreadsheetData(spreadsheet) {
  var allSheets = spreadsheet.getSheets();
  var sheetsData = {};

  for (var i = 0; i < allSheets.length; i++) {
    var sheet = allSheets[i];
    var sheetName = sheet.getName();
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    if (lastRow > 0 && lastCol > 0) {
      sheetsData[sheetName] = sheet.getRange(1, 1, lastRow, lastCol).getValues();
    } else {
      sheetsData[sheetName] = [];
    }
  }

  return jsonResponse({
    status: 'success',
    spreadsheetName: spreadsheet.getName(),
    spreadsheetId: spreadsheet.getId(),
    sheets: sheetsData,
    timestamp: new Date().toISOString()
  });
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function khoiTaoDuLieuMauTiengViet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureVietnameseSheets(ss);

  var gvSheet = ss.getSheetByName('GIANG_VIEN');
  if (gvSheet && gvSheet.getLastRow() <= 1) {
    gvSheet.appendRow([
      'GV01', 'PGS.TS. Nguyễn Văn A', '0912345678', 'admin@greenfarm.edu.vn', 'Khoa Chăn nuôi',
      'Chủ nhiệm đề tài', 'admin', '123456', 'QUẢN TRỊ VIÊN', 'HOẠT ĐỘNG',
      new Date().toISOString(), new Date().toISOString(), 'Tài khoản quản trị viên tối cao'
    ]);
    gvSheet.appendRow([
      'GV02', 'TS. Trần Thị B', '0987654321', 'giangvien@greenfarm.edu.vn', 'Bộ môn Thú y',
      'Cán bộ hướng dẫn', 'gv01', '123456', 'GIẢNG VIÊN', 'HOẠT ĐỘNG',
      new Date().toISOString(), new Date().toISOString(), 'Giảng viên hướng dẫn thực địa'
    ]);
  }

  var hvSheet = ss.getSheetByName('HOC_VIEN');
  if (hvSheet && hvSheet.getLastRow() <= 1) {
    hvSheet.appendRow([
      'HV01', 'Lê Văn C', 'Lớp Thú y K65', '0901112233', 'hs01@greenfarm.edu.vn',
      'H01, H02', 'hs01', '123456', 'HỌC VIÊN', 'HOẠT ĐỘNG',
      '2026-09-01', 'Phụ trách địa bàn Thôn 1', new Date().toISOString(), new Date().toISOString()
    ]);
    hvSheet.appendRow([
      'HV02', 'Phạm Thị D', 'Lớp Chăn nuôi K66', '0904445566', 'hs02@greenfarm.edu.vn',
      'H03, H04', 'hs02', '123456', 'HỌC VIÊN', 'HOẠT ĐỘNG',
      '2026-09-01', 'Phụ trách địa bàn Thôn 2', new Date().toISOString(), new Date().toISOString()
    ]);
  }

  Logger.log('Đã khởi tạo dữ liệu mẫu tiếng Việt thành công!');
}
`;
