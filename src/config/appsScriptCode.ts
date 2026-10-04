/**
 * Toàn bộ mã nguồn Google Apps Script sẵn sàng copy-paste vào Google Sheets
 */
export const APPS_SCRIPT_SOURCE_CODE = `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT CHO HỆ THỐNG QUẢN LÝ NGHIÊN CỨU "CAM KẾT XANH"
 * Tác động của ‘Cam kết xanh’ kết hợp ứng dụng quản lý chăn nuôi đến hành vi quản lý chất thải tại nguồn của các hộ chăn nuôi
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

// 1. Xử lý yêu cầu GET (Kiểm tra kết nối và Đọc dữ liệu 2 chiều từ Google Sheets)
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'PING';
  var spreadsheetId = (e && e.parameter && e.parameter.spreadsheetId) ? e.parameter.spreadsheetId : '';

  // Đọc toàn bộ dữ liệu từ Google Sheets về Web App
  if (action === 'GET_ALL_SHEETS' || action === 'PULL_ALL_SHEETS' || action === 'GET_USERS' || action === 'READ_ALL') {
    var spreadsheet;
    if (spreadsheetId && spreadsheetId.trim() !== '') {
      try {
        spreadsheet = SpreadsheetApp.openById(spreadsheetId.trim());
      } catch (err) {
        spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      }
    } else {
      spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    }

    if (!spreadsheet) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'Không tìm thấy Google Spreadsheet.'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return exportSpreadsheetData(spreadsheet);
  }
  
  var responseData = {
    status: 'success',
    message: 'Kết nối Google Apps Script thành công! Máy chủ cơ sở dữ liệu nghiên cứu sẵn sàng hoạt động.',
    timestamp: new Date().toISOString()
  };

  return ContentService.createTextOutput(JSON.stringify(responseData))
    .setMimeType(ContentService.MimeType.JSON);
}

// 2. Xử lý yêu cầu POST (Ghi đồng bộ & Đọc 2 chiều)
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

    // ĐỌC DỮ LIỆU TỪ GOOGLE SHEETS VỀ APP (2-WAY SYNC)
    if (action === 'PULL_ALL_SHEETS' || action === 'GET_ALL_SHEETS' || action === 'GET_USERS' || action === 'READ_ALL') {
      return exportSpreadsheetData(spreadsheet);
    }

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
          }

          var numRows = rows.length;
          var numCols = rows[0].length;

          // Chuẩn hóa đảm bảo tất cả hàng có đúng numCols phần tử và không có giá trị undefined/null
          var sanitizedRows = [];
          for (var r = 0; r < numRows; r++) {
            var row = rows[r] || [];
            var newRow = [];
            for (var c = 0; c < numCols; c++) {
              var val = row[c];
              if (val === undefined || val === null) {
                newRow.push('');
              } else {
                newRow.push(val);
              }
            }
            sanitizedRows.push(newRow);
          }

          // Bảo toàn dữ liệu: Nếu sheet có sẵn dữ liệu và sheetName là USERS hoặc HOUSEHOLDS,
          // tiến hành hợp nhất thông minh theo cột khóa chính (USERNAME / HOUSEHOLD_ID)
          // để KHÔNG BAO GIỜ xóa nhầm các tài khoản hoặc hộ mà người dùng đã tạo trên Google Sheet
          if (sheet.getLastRow() > 1 && (sheetName === 'USERS' || sheetName === 'HOUSEHOLDS')) {
            try {
              var existingValues = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).getValues();
              var keyColIdx = (sheetName === 'USERS') ? 1 : 0; // USERNAME là cột 2 (idx 1), HOUSEHOLD_ID là cột 1 (idx 0)
              
              var incomingKeyMap = {};
              for (var ir = 1; ir < sanitizedRows.length; ir++) {
                var kVal = String(sanitizedRows[ir][keyColIdx] || '').toLowerCase().trim();
                if (kVal) incomingKeyMap[kVal] = true;
              }

              // Giữ lại mọi tài khoản hoặc hộ đang có trên Google Sheets
              for (var er = 1; er < existingValues.length; er++) {
                var eKey = String(existingValues[er][keyColIdx] || '').toLowerCase().trim();
                if (eKey && !incomingKeyMap[eKey]) {
                  var preservedRow = [];
                  for (var pc = 0; pc < numCols; pc++) {
                    preservedRow.push(existingValues[er][pc] !== undefined ? existingValues[er][pc] : '');
                  }
                  sanitizedRows.push(preservedRow);
                }
              }
            } catch (mergeErr) {
              // Bỏ qua nếu sheet chưa đủ cấu trúc
            }
          }

          sheet.clear();
          var finalNumRows = sanitizedRows.length;
          var range = sheet.getRange(1, 1, finalNumRows, numCols);
          range.setValues(sanitizedRows);

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

// 3. Hàm tiện ích xuất toàn bộ dữ liệu bảng tính thành JSON
function exportSpreadsheetData(spreadsheet) {
  var allSheets = spreadsheet.getSheets();
  var sheetsData = {};
  for (var i = 0; i < allSheets.length; i++) {
    var sheet = allSheets[i];
    var sheetName = sheet.getName();
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    if (lastRow > 0 && lastCol > 0) {
      var values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
      sheetsData[sheetName] = values;
    } else {
      sheetsData[sheetName] = [];
    }
  }

  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    spreadsheetName: spreadsheet.getName(),
    spreadsheetId: spreadsheet.getId(),
    sheets: sheetsData,
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}
`;
