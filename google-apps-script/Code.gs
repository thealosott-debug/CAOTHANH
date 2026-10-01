/**
 * =========================================================================
 * GOOGLE APPS SCRIPT CHO HỆ THỐNG QUẢN LÝ NGHIÊN CỨU "CAM KẾT XANH"
 * Tác động của 'Cam kết xanh' kết hợp ứng dụng chăn nuôi đến quản lý chất thải tại nguồn
 * =========================================================================
 * Hướng dẫn:
 * 1. Mở Google Sheets mới -> Đổi tên thành "GREEN FARM RESEARCH DATABASE"
 * 2. Vào Tiện ích mở rộng (Extensions) -> Apps Script
 * 3. Dán toàn bộ mã nguồn này vào tệp Code.gs
 * 4. Bấm "Triển khai" (Deploy) -> "Tùy chọn triển khai mới" (New deployment)
 * 5. Chọn loại: "Ứng dụng web" (Web App)
 *    - Mô tả: Green Farm Research Backend API v1
 *    - Thực thi dưới dạng (Execute as): "Tôi" (Me)
 *    - Ai có quyền truy cập (Who has access): "Bất kỳ ai" (Anyone)
 * 6. Bấm Triển khai -> Sao chép URL ứng dụng Web và dán vào phần cấu hình Web App của ứng dụng!
 */

// Xử lý kiểm tra kết nối (GET Request)
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'PING';
  
  if (action === 'PING') {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Kết nối Google Apps Script thành công! Máy chủ cơ sở dữ liệu nghiên cứu sẵn sàng hoạt động.',
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    message: 'Green Farm Research Google Sheets Web App Endpoint is running.'
  })).setMimeType(ContentService.MimeType.JSON);
}

// Xử lý ghi dữ liệu vào Google Sheets (POST Request)
function doPost(e) {
  try {
    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);
    var spreadsheet;

    // Lấy spreadsheet hiện tại hoặc theo ID nếu cung cấp
    if (data.spreadsheetId && data.spreadsheetId.trim() !== '') {
      try {
        spreadsheet = SpreadsheetApp.openById(data.spreadsheetId.trim());
      } catch (err) {
        spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      }
    } else {
      spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    }

    if (!spreadsheet) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'Không tìm thấy Google Spreadsheet. Vui lòng mở Apps Script từ trang tính hoặc kiểm tra lại Spreadsheet ID.'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var action = data.action || 'SYNC_ALL_SHEETS';

    if (action === 'SYNC_ALL_SHEETS') {
      var sheetsData = data.sheets;
      var updatedCount = 0;

      for (var sheetName in sheetsData) {
        if (sheetsData.hasOwnProperty(sheetName)) {
          var rows = sheetsData[sheetName];
          if (!rows || rows.length === 0) continue;

          var sheet = spreadsheet.getSheetByName(sheetName);
          if (!sheet) {
            sheet = spreadsheet.insertSheet(sheetName);
          } else {
            sheet.clear(); // Xóa sạch dữ liệu cũ để ghi dữ liệu mới cập nhật
          }

          var numRows = rows.length;
          var numCols = rows[0].length;

          // Chuyển đổi dữ liệu chuẩn hóa dạng text/number
          var range = sheet.getRange(1, 1, numRows, numCols);
          range.setValues(rows);

          // Định dạng tiêu đề chuyên nghiệp
          var headerRange = sheet.getRange(1, 1, 1, numCols);
          headerRange.setBackground('#065f46'); // Màu xanh lá ngọc bảo (Emerald 800)
          headerRange.setFontColor('#ffffff');
          headerRange.setFontWeight('bold');
          headerRange.setHorizontalAlignment('center');
          
          sheet.setFrozenRows(1); // Cố định dòng tiêu đề
          sheet.autoResizeColumns(1, Math.min(numCols, 15)); // Giãn cột tự động

          updatedCount++;
        }
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Đã đồng bộ thành công ' + updatedCount + ' Sheets vào cơ sở dữ liệu nghiên cứu!',
        spreadsheetName: spreadsheet.getName(),
        updatedAt: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Hành động không hợp lệ: ' + action
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Lỗi xử lý máy chủ Apps Script: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Hàm khởi tạo 17 Sheets bằng tay trong Apps Script nếu cần
function initAll17SheetsManually() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetNames = [
    'CONFIG', 'USERS', 'HOUSEHOLDS', 'BC01_HO_THONG_TIN', 'BC02_KAP_PRE',
    'BC03_YDINH', 'BC04_CWM_PRE', 'BC04_CWM_POST', 'BC05_CAM_KET',
    'BC06_WEEKLY', 'BC07_POST', 'BC08_TONG_HOP', 'CWM_DETAIL',
    'BARRIERS', 'AUDIT_LOG', 'NOTIFICATIONS', 'DASHBOARD_DATA'
  ];

  for (var i = 0; i < sheetNames.length; i++) {
    var name = sheetNames[i];
    var s = ss.getSheetByName(name);
    if (!s) {
      ss.insertSheet(name);
    }
  }
  Logger.log('Đã tạo đủ 17 sheets nghiên cứu!');
}
