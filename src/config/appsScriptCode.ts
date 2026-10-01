/**
 * Toàn bộ mã nguồn Google Apps Script sẵn sàng copy-paste vào Google Sheets
 */
export const APPS_SCRIPT_SOURCE_CODE = `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT CHO HỆ THỐNG QUẢN LÝ NGHIÊN CỨU "CAM KẾT XANH"
 * Tác động của 'Cam kết xanh' kết hợp ứng dụng chăn nuôi đến quản lý chất thải tại nguồn
 * =========================================================================
 * HƯỚNG DẪN 3 BƯỚC:
 * 1. Mở trang Google Sheets của bạn -> Vào menu "Tiện ích mở rộng" (Extensions) -> "Apps Script"
 * 2. XÓA SẠCH toàn bộ nội dung cũ trong tệp Code.gs, DÁN TOÀN BỘ MÃ NÀY VÀO và bấm biểu tượng LƯU (Ctrl+S).
 * 3. Bấm nút màu xanh "Triển khai" (Deploy) ở góc trên bên phải:
 *    - Chọn "Quản lý bản triển khai" (Manage deployments) -> Bấm icon CÂY BÚT CHÌ (Chỉnh sửa)
 *    - Mục "Phiên bản" (Version): Chọn "Phiên bản mới" (New version)
 *    - Mục "Ai có quyền truy cập" (Who has access): Chọn "Bất kỳ ai" (Anyone)
 *    - Bấm "Triển khai" (Deploy).
 */

// 1. Xử lý kiểm tra kết nối (GET Request)
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'PING';
  
  var responseData = {
    status: 'success',
    message: 'Kết nối Google Apps Script thành công! Máy chủ cơ sở dữ liệu nghiên cứu sẵn sàng hoạt động.',
    timestamp: new Date().toISOString()
  };

  return ContentService.createTextOutput(JSON.stringify(responseData))
    .setMimeType(ContentService.MimeType.JSON);
}

// 2. Xử lý ghi toàn bộ 17 Sheets vào Google Sheets (POST Request)
function doPost(e) {
  try {
    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);
    var spreadsheet;

    // Mở trang tính hiện tại
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
        message: 'Không tìm thấy Google Spreadsheet. Hãy chắc chắn Apps Script được mở từ trang tính Google Sheets của bạn.'
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
            sheet.clear(); // Xóa sạch dữ liệu cũ để cập nhật mới
          }

          var numRows = rows.length;
          var numCols = rows[0].length;

          var range = sheet.getRange(1, 1, numRows, numCols);
          range.setValues(rows);

          // Định dạng tiêu đề màu xanh ngọc bảo NCKH
          var headerRange = sheet.getRange(1, 1, 1, numCols);
          headerRange.setBackground('#065f46');
          headerRange.setFontColor('#ffffff');
          headerRange.setFontWeight('bold');
          headerRange.setHorizontalAlignment('center');
          
          sheet.setFrozenRows(1);
          sheet.autoResizeColumns(1, Math.min(numCols, 15));

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
      message: 'Lỗi xử lý Apps Script: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
`;
