# 🎓 EDU 3N V4.0 - HỆ SINH THÁI GIÁO DỤC SỐ (3 NHÀ: NHÀ TRƯỜNG - GIA ĐÌNH - HỌC SINH)
> **Giải pháp tối ưu cho trường học:** Triển khai tĩnh trên **Vercel** kết hợp **Google Apps Script (GAS)** với chi phí **0 VNĐ trọn đời, KHÔNG CẦN VPS**.

---

## 🚀 1. HƯỚNG DẪN ĐẨY LÊN GITHUB & DEPLOY VERCEL TRONG 2 PHÚT

### Cách A: Đẩy lên GitHub qua Git CLI
Mở PowerShell hoặc Terminal tại thư mục `Edu 3n v4.0`:
```bash
cd "N:\Antigravity 2.0\Edu 3n v4.0"
git init
git add .
git commit -m "Khoi tao he thong quan ly giao duc Edu 3n v4.0"
git branch -M main
git remote add origin https://github.com/nguyentvtk/Edu-3n-v4.0.git
git push -u origin main
```

### Cách B: Triển khai 1-Click lên Vercel
1. Truy cập [https://vercel.com](https://vercel.com) và đăng nhập bằng tài khoản GitHub.
2. Nhấn nút **"Add New..."** ➔ Chọn **"Project"**.
3. Chọn Repository `Edu-3n-v4.0` vừa push lên ➔ Bấm **Deploy**.
4. Sau 15 giây, bạn sẽ nhận được đường link Web App chính thức (Ví dụ: `https://edu-3n-v4-0.vercel.app`)!

---

## 👥 2. HỆ THỐNG PHÂN QUYỀN 4 VAI TRÒ (ROLE-BASED ACCESS CONTROL)

Hệ thống tích hợp bộ chuyển đổi vai trò linh hoạt ngay trên thanh điều hướng:
1. 🏛️ **Ban Giám Hiệu / Admin:**
   * Bảng điều khiển toàn trường (sĩ số, tỷ lệ chuyên cần hôm nay, tiến độ thu học phí).
   * **Import file Excel (.xlsx):** Nhập dữ liệu danh sách học sinh, điểm số, học phí chỉ trong 1 giây.
   * **Sao lưu dữ liệu hàng năm (.csv):** Đóng gói toàn bộ hồ sơ năm học thành các tệp CSV, lưu trữ lịch sử và xem lại bất kỳ lúc nào trên web.
   * Quản lý học phí và kiểm tra đối soát VietQR tự động.
2. 👨‍🏫 **Giáo Viên (Teacher):**
   * Điểm danh lớp phụ trách (Có mặt, Đi muộn, Nghỉ có phép) và bắn tin tự động về điện thoại phụ huynh.
   * Sổ điểm điện tử bộ môn: Tự động tính Điểm trung bình môn và xếp loại học lực theo **Thông tư 22/2021/TT-BGDĐT**.
   * Tiếp nhận và duyệt đơn xin nghỉ phép của học sinh.
3. 👨‍👩‍👧 **Cha Mẹ Học Sinh (Parent):**
   * Sổ liên lạc điện tử con em thời gian thực: Điểm số, nề nếp, chuyên cần.
   * **Đóng học phí qua VietQR động:** Xuất mã QR ngân hàng NAPAS 247 đúng số tiền, quét thanh toán trên bất kỳ App Ngân hàng nào và nhận xác nhận gạch nợ sau 3 giây.
   * Gửi đơn xin nghỉ phép trực tuyến kèm lý do đến GVCN với 1 chạm.
4. 👨‍🎓 **Học Sinh (Student):**
   * Tra cứu Thời khóa biểu cả tuần, phòng học, giáo viên phụ trách.
   * Xem lịch thi giữa kỳ, cuối kỳ và điểm số cá nhân.

---

## 📦 3. CƠ SỞ DỮ LIỆU MẪU (.XLSX) & QUY TRÌNH SAO LƯU HÀNG NĂM (.CSV)

* **Tải file CSDL mẫu:** Tệp `School_Master_Database.xlsx` đã được tích hợp sẵn trong thư mục `data/` của Web App. Người dùng có thể nhấn nút **"Tải File Mẫu Chuẩn"** ngay trên giao diện web để xem cấu trúc và chỉnh sửa trước khi import.
* **Quy trình sao lưu dữ liệu hàng năm:**
  1. Hàng năm vào cuối năm học (hoặc kết thúc học kỳ), Admin vào phân hệ BGH.
  2. Chọn Năm học (Ví dụ: `2026-2027`).
  3. Nhấn nút **"Tạo Bản Sao Lưu .CSV Ngay"**.
  4. Hệ thống tự động:
     - Tải tệp `Backup_School_2026_2027.csv` về máy tính của Admin.
     - Lưu trữ snapshot vào lịch sử hệ thống (LocalStorage / IndexedDB).
     - Cho phép Admin nhấn nút **"Xem Lại"** bất kỳ bản sao lưu cũ nào trong quá khứ ngay trên màn hình.

---

## ⚡ 4. GOOGLE APPS SCRIPT: THAY THẾ N8N HOÀN TOÀN 0Đ (KHÔNG CẦN VPS)
Để nhà trường không phải tốn ngân sách thuê VPS và không cần nhân sự kỹ thuật bảo trì máy chủ:
* Toàn bộ mã nguồn tự động hóa đã được viết bằng Google Apps Script tại:  
  `google-apps-script/Code.js`
* Hướng dẫn chi tiết copy-paste cài đặt chỉ mất 2 phút tại:  
  `google-apps-script/HUONG_DAN_TRIEN_KHAI_GAS.md`
* GAS tự động nhận Webhook ngân hàng từ SePAY/Casso, gạch nợ trên Google Sheets và gửi thông báo Telegram tức thì mà **không tốn 1 đồng chi phí nào**!
