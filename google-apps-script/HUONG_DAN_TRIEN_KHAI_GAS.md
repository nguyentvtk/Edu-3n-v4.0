# HƯỚNG DẪN TRIỂN KHAI GOOGLE APPS SCRIPT (THAY THẾ N8N - 0Đ, KHÔNG CẦN VPS)
**Dự án:** Quản lý Giáo dục & Tự Động Gạch Nợ VietQR 3s  
**Tệp mã nguồn:** `N:\Antigravity 2.0\School\webapp\google-apps-script\Code.js`  

---

## 1. TẠI SAO NÊN ĐỔI TỪ N8N SANG GOOGLE APPS SCRIPT CHO TRƯỜNG HỌC?

| Tiêu chí | n8n Tự Động Hóa | Google Apps Script (GAS) |
| :--- | :--- | :--- |
| **Chi phí máy chủ** | Tốn tiền thuê VPS hàng tháng (~120k - 300k/tháng) | **0 VNĐ trọn đời** (Chạy trên mây của Google) |
| **Quản trị hệ thống** | Cần người biết Linux/Docker để duy trì máy chủ | **Zero-DevOps**: Không cần bảo trì server, Google tự lo 100% |
| **Độ ổn định** | Có thể bị sập nếu VPS hết RAM hoặc mạng lỗi | **SLA 99.9%** từ hạ tầng Google |
| **Tốc độ đọc/ghi dữ liệu** | Phải gọi API qua mạng vào Google Sheets | **Trực tiếp (Native):** Đọc/ghi các ô tính với độ trễ gần như 0 giây |

---

## 2. HƯỚNG DẪN 3 BƯỚC TRIỂN KHAI CHỈ MẤT 2 PHÚT

### Bước 1: Mở Trình soạn thảo Apps Script trên Google Sheets
1. Mở bảng tính Google Sheets `School_Master_Database` trên Google Drive cá nhân của bạn.
2. Trên thanh menu, chọn: **Tiện ích mở rộng (Extensions)** ➔ **Apps Script**.

### Bước 2: Dán mã nguồn `Code.js`
1. Xóa toàn bộ nội dung mặc định trong tệp `Mã.gs` (Code.gs).
2. Mở tệp `N:\Antigravity 2.0\School\webapp\google-apps-script\Code.js`, copy toàn bộ nội dung và dán vào.
3. Nhấn biểu tượng **Lưu (Save / Ctrl + S)**.

### Bước 3: Triển khai thành Web App (Deploy as Web App)
1. Ở góc trên bên phải, nhấn nút **Triển khai (Deploy)** ➔ Chọn **Tùy chọn triển khai mới (New deployment)**.
2. Nhấn biểu tượng bánh răng ⚙️ bên cạnh "Chọn loại", chọn **Ứng dụng web (Web app)**.
3. Cấu hình:
   * **Mô tả:** `Cổng Webhook SePAY VietQR & API Trường Học`
   * **Thực thi dưới dạng (Execute as):** `Tôi (Email của bạn)`
   * **Ai có quyền truy cập (Who has access):** Chọn **Bất kỳ ai (Anyone)** *(Bắt buộc chọn Anyone để SePAY hoặc Web App bên ngoài có thể gọi Webhook vào)*.
4. Nhấn nút **Triển khai (Deploy)**.
5. Cấp quyền truy cập Google (chỉ cần làm 1 lần duy nhất).
6. **Sao chép Đường liên kết ứng dụng web (URL Web App):**  
   Dạng: `https://script.google.com/macros/s/AKfycbx.../exec`.

---

## 3. KẾT NỐI VÀO CỔNG THANH TOÁN SEPAY / CASSO
1. Đăng nhập vào trang quản trị SePAY: [https://my.sepay.vn](https://my.sepay.vn)
2. Vào mục **Cấu hình Webhook** (Webhooks) ➔ Bấm **Thêm Webhook mới**.
3. **URL Webhook:** Dán URL Web App vừa sao chép ở Bước 3 vào.
4. Bấm **Lưu**.
5. **Hoàn tất:** Giờ đây, mỗi khi có phụ huynh chuyển khoản quét mã VietQR cú pháp `HP HS1001`, SePAY tự động bắn Webhook về Google Apps Script, Google Sheets tự động đổi trạng thái sang `DA_THANH_TOAN` trong 3 giây!
