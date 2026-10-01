# HƯỚNG DẪN THIẾT LẬP VÀ VẬN HÀNH HỆ THỐNG NGHIÊN CỨU
## Đề tài: "TÁC ĐỘNG CỦA ‘CAM KẾT XANH’ KẾT HỢP ỨNG DỤNG QUẢN LÝ CHĂN NUÔI ĐẾN HÀNH VI QUẢN LÝ CHẤT THẢI TẠI NGUỒN CỦA CÁC HỘ CHĂN NUÔI"

Tài liệu này được thiết kế dành cho Chủ nhiệm đề tài, Giáo viên hướng dẫn, Nghiên cứu viên và Người quản trị không chuyên về lập trình.

---

### MỤC LỤC
1. Tổng quan kiến trúc hệ thống
2. Các bước thiết lập Google Sheets làm cơ sở dữ liệu
3. Triển khai Google Apps Script Web App (chỉ mất 2 phút)
4. Cấu hình ứng dụng Web Green Farm Research
5. Cấu trúc 17 Sheets trong Workbook
6. Hướng dẫn phân quyền & Tài khoản (Admin, Nghiên cứu viên, Hộ chăn nuôi)
7. Quy trình 6 tuần thu thập dữ liệu thực địa
8. Hướng dẫn khóa dữ liệu, mở khóa và Audit Log
9. Hướng dẫn xuất dữ liệu phân tích thống kê (SPSS/Excel/R)
10. Xử lý sự cố thường gặp

---

### 1. TỔNG QUAN KIẾN TRÚC HỆ THỐNG

- **Giao diện Người dùng (Frontend)**: React + Tailwind CSS + PWA Mobile First, tối ưu hiển thị trên điện thoại thông minh cho hộ chăn nuôi và máy tính cho nghiên cứu viên.
- **Lưu trữ Cục bộ (Local Database)**: Tự động lưu trên trình duyệt (LocalStorage/IndexedDB), hoạt động trơn tru 100% kể cả khi mất kết nối Internet.
- **Cơ sở dữ liệu đám mây (Cloud Database)**: Google Sheets được liên kết qua Google Apps Script Web App an toàn, tự động đồng bộ 17 Sheets có hàng tiêu đề chuẩn.
- **Bảo mật**: Mật khẩu được băm (SHA-256 + Salt ngẫu nhiên), tuyệt đối KHÔNG lưu mật khẩu dạng chữ thô (plaintext) vào Google Sheets hay gửi qua đường link URL.

---

### 2. CÁC BƯỚC THIẾT LẬP GOOGLE SHEETS

1. Mở trình duyệt và truy cập: [https://sheets.new](https://sheets.new) để tạo một Google Sheets mới.
2. Đổi tên trang tính thành: **`GREEN FARM RESEARCH - DATABASE`**.
3. Lấy **Spreadsheet ID**:
   - Nhìn lên thanh địa chỉ của trình duyệt, bạn sẽ thấy đường dẫn có dạng:
     `https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit`
   - Phần nằm giữa `/d/` và `/edit` chính là **Spreadsheet ID**:
     `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`
   - Hãy sao chép chuỗi ký tự này.

---

### 3. TRIỂN KHAI GOOGLE APPS SCRIPT WEB APP

1. Trong trang Google Sheets vừa tạo, bấm vào thanh menu: **Tiện ích mở rộng (Extensions)** -> **Apps Script**.
2. Một tab mới sẽ mở ra. Xóa sạch nội dung cũ trong tệp `Code.gs`.
3. Mở tệp `google-apps-script/Code.gs` trong mã nguồn ứng dụng (hoặc copy từ tài liệu này), dán toàn bộ vào cửa sổ Apps Script.
4. Bấm biểu tượng **Lưu (Save)** (hình đĩa mềm) hoặc ấn phím tắt `Ctrl + S`.
5. Bấm vào nút màu xanh **Triển khai (Deploy)** ở góc trên bên phải -> chọn **Tùy chọn triển khai mới (New deployment)**.
6. Bấm vào biểu tượng Bánh răng (Cài đặt) bên cạnh "Chọn loại", chọn: **Ứng dụng web (Web App)**.
7. Điền các thông tin:
   - **Mô tả (Description)**: `Green Farm Research API v1`
   - **Thực thi dưới dạng (Execute as)**: `Tôi (Me)`
   - **Ai có quyền truy cập (Who has access)**: **`Bất kỳ ai (Anyone)`** *(Bắt buộc chọn Anyone để ứng dụng web có thể gửi dữ liệu vào Sheets)*.
8. Bấm **Triển khai (Deploy)**.
9. Lần đầu tiên, Google sẽ yêu cầu "Ủy quyền truy cập" (Authorize access):
   - Chọn tài khoản Google của bạn.
   - Bấm vào chữ nhỏ **Nâng cao (Advanced)** ở góc dưới.
   - Bấm vào **Đi tới Dự án không có tiêu đề (không an toàn) / Go to Untitled project (unsafe)**.
   - Bấm **Cho phép (Allow)**.
10. Google sẽ cung cấp cho bạn một **URL ứng dụng web (Web App URL)** có đuôi kết thúc bằng `/exec`.
    - Ví dụ: `https://script.google.com/macros/s/AKfycbz.../exec`
    - Hãy **Sao chép (Copy)** URL này!

---

### 4. CẤU HÌNH ỨNG DỤNG WEB GREEN FARM RESEARCH

> **LƯU Ý:** Hệ thống đã được lập trình **ghim cố định sẵn URL Google Apps Script của bạn:**
> `https://script.google.com/macros/s/AKfycby07SokU46mlK013-tGmlnu0GQFAg_zCpSuPE9l-Sb_geT340XMruiDPlAjVfCC0dQovg/exec`
> Bạn không cần phải dán lại thủ công nữa.

1. Trong ứng dụng Green Farm Research, đăng nhập bằng tài khoản **Admin**:
   - Tên đăng nhập: `admin`
   - Mật khẩu: `admin123`
2. Truy cập menu bên trái: **Google Sheets**.
3. Bạn sẽ thấy biểu tượng xác nhận màu xanh **ONLINE READY** cùng đường dẫn đã được lưu cố định.
4. Bấm nút **[Đồng bộ 17 Sheets lên Google Sheets]** (hoặc nút **[Đồng bộ ngay]**):
   - Hệ thống sẽ tự động khởi tạo và điền đầy đủ tiêu đề cùng toàn bộ dữ liệu 40 hộ vào Google Sheets của bạn ngay lập tức!

---

### 5. CẤU TRÚC 17 SHEETS TRONG WORKBOOK

1. **CONFIG**: Lưu tham số nghiên cứu (tên đề tài, 40 hộ, 20 TN, 20 ĐC, 6 tuần, thời gian nhắc nhở).
2. **USERS**: Danh sách tài khoản người dùng (Admin, Nghiên cứu viên, 40 Hộ). Không lưu mật khẩu.
3. **HOUSEHOLDS**: Hồ sơ 40 hộ chăn nuôi (mã H01-H40, đại diện, SĐT, loại vật nuôi, quy mô, phân nhóm TN/ĐC).
4. **BC01_HO_THONG_TIN**: Phiếu thông tin chi tiết hộ chăn nuôi.
5. **BC02_KAP_PRE**: Dữ liệu khảo sát Kiến thức (K), Thái độ (T), Hành vi tự báo cáo (HT trước).
6. **BC03_YDINH**: Điểm ý định thay đổi hành vi (YĐ trước).
7. **BC04_CWM_PRE**: Điểm quan sát thực địa khách quan 6 tiêu chí CWM trước can thiệp (0-6 điểm).
8. **BC04_CWM_POST**: Điểm quan sát thực địa khách quan 6 tiêu chí CWM sau can thiệp (0-6 điểm).
9. **BC05_CAM_KET**: Phiếu cam kết xanh của nhóm TN (7 tiêu chí cam kết, thời gian ký, phiên bản).
10. **BC06_WEEKLY**: Dữ liệu báo cáo hằng tuần 6 tuần (W1 - W6) và danh sách khó khăn/rào cản.
11. **BC07_POST**: Khảo sát hành vi tự báo cáo sau can thiệp (HT sau) và mức độ sẵn sàng duy trì.
12. **BC08_TONG_HOP**: Bảng tổng hợp nghiên cứu cốt lõi: Hộ, Nhóm, K, T, YĐ, HT_pre, CWM_pre, HT_post, CWM_post, ΔCWM.
13. **CWM_DETAIL**: Chi tiết từng tiêu chí B1-B6 để phân tích sâu.
14. **BARRIERS**: Thống kê các rào cản chất thải mà hộ dân gặp phải.
15. **AUDIT_LOG**: Nhật ký thay đổi dữ liệu (thời gian, người thực hiện, giá trị trước/sau, lý do).
16. **NOTIFICATIONS**: Lịch sử thông báo nhắc nhở nộp báo cáo.
17. **DASHBOARD_DATA**: Chỉ số KPI nghiên cứu tổng hợp.

---

### 6. HƯỚNG DẪN TÀI KHOẢN & PHÂN QUYỀN

#### A. Tài khoản Quản trị (Admin)
- Đăng nhập: `admin` | Mật khẩu: `admin123`
- Quyền hạn: Toàn quyền cấu hình, phân nhóm TN/ĐC, xem tất cả báo cáo, xuất dữ liệu, kiểm soát Audit Log, mở khóa dữ liệu.

#### B. Tài khoản Nghiên cứu viên (Researcher)
- Đăng nhập: `nghiencuu01` (ThS. Trần Thị Mai) | Mật khẩu: `researcher123`
- Đăng nhập: `nghiencuu02` (KS. Lê Hoàng Long) | Mật khẩu: `researcher123`
- Quyền hạn: Nhập BC-01, BC-02, BC-03, thực hiện chấm thực địa BC-04 (CWM), theo dõi tiến độ BC-06 tuần, nhập BC-07, xem BC-08. Không được xóa dữ liệu gốc hay đổi cấu hình hệ thống.

#### C. Tài khoản Hộ chăn nuôi (Household)
- Hộ thuộc nhóm TN: Đăng nhập `h01` đến `h20` | Mật khẩu: `farm123`
- Hộ thuộc nhóm ĐC: Đăng nhập `h21` đến `h40` | Mật khẩu: `farm123`
- Giao diện: Thiết kế Mobile-First lớn, rõ ràng.
- Quyền hạn: Hộ chỉ thấy dữ liệu của chính mình, xác nhận Cam kết xanh, nộp báo cáo tuần W1-W6, báo cáo rào cản. Tuyệt đối KHÔNG thấy dữ liệu hộ khác, điểm CWM hay dashboard so sánh.

---

### 7. QUY TRÌNH 6 TUẦN THỰC ĐỊA

1. **Tuần 0 (Chuẩn bị)**:
   - Nghiên cứu viên khảo sát BC-01, BC-02 (KAP), BC-03 (Ý định).
   - Nghiên cứu viên đến tận chuồng nuôi quan sát và chấm **BC-04 CWM Trước can thiệp** (thang điểm 0 - 6).
   - Admin phân nhóm ngẫu nhiên: 20 hộ TN và 20 hộ ĐC.
2. **Bắt đầu can thiệp (Nhóm TN)**:
   - 20 hộ nhóm TN đăng nhập ứng dụng trên điện thoại, đọc và bấm **[Xác nhận Cam kết xanh (BC-05)]**.
3. **Từ Tuần 1 đến Tuần 6 (Theo dõi)**:
   - Mỗi tuần (chủ nhật), hộ nhóm TN mở ứng dụng, đánh dấu 6 hành vi quản lý chất thải và chọn các khó khăn/rào cản gặp phải.
   - Nghiên cứu viên và Admin theo dõi tỷ lệ nộp bài theo thời gian thực trên Dashboard.
4. **Kết thúc 6 tuần (Đánh giá sau can thiệp)**:
   - Nghiên cứu viên đến trực tiếp chuồng nuôi để quan sát khách quan **BC-04 CWM Sau can thiệp** (thang điểm 0 - 6).
   - Thực hiện khảo sát **BC-07 Sau can thiệp** (HT sau).
   - Hệ thống tự động tính toán **ΔCWM = CWM sau - CWM trước** và cập nhật tức thì vào bảng **BC-08**.

---

### 8. KIỂM SOÁT LIÊM CHÍNH DỮ LIỆU & AUDIT LOG

- Mọi phiếu sau khi lưu sẽ được **Khóa dữ liệu (Lock)** để ngăn chặn việc sửa đổi tùy tiện.
- Khi cần điều chỉnh (ví dụ đính chính thông tin do nhầm lẫn thực địa), người dùng phải bấm **[Mở khóa]**, nhập **Lý do sửa đổi**.
- Toàn bộ lịch sử (Người sửa, thời gian, giá trị cũ, giá trị mới, lý do) được lưu tự động vào **AUDIT_LOG** và không ai có thể xóa.

---

### 9. XUẤT DỮ LIỆU PHÂN TÍCH

Tại trang **Báo cáo & Xuất dữ liệu** hoặc trang **BC-08 Tổng hợp**:
- Bấm **[Xuất BC-08]**: Tải về tệp CSV UTF-8 có dấu đầy đủ các cột phục vụ chạy mô hình thống kê Paired t-test, Independent t-test hoặc ANOVA trên SPSS, R, Python.
- Bấm **[Xuất Dữ liệu Khảo sát]**: Toàn bộ điểm KAP trước và sau.
- Bấm **[Xuất Quan sát CWM]**: Dữ liệu thực địa chi tiết 6 tiêu chí B1-B6.
- Bấm **[Xuất Nhật ký Audit Log]**: Báo cáo kiểm định tính liêm chính và trung thực của dữ liệu nghiên cứu khoa học.
