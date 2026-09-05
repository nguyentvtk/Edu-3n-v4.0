@echo off
chcp 65001 >nul
title Edu 3n v4.0 - Chạy Thử Nghiệm Web App
echo ========================================================
echo   🎓 EDU 3N V4.0 - HỆ SINH THÁI GIÁO DỤC SỐ 3 NHÀ
echo ========================================================
echo Đang mở Web App trên trình duyệt mặc định...
start "" "%~dp0index.html"
echo.
echo ✅ Đã mở ứng dụng! Bạn có thể thử nghiệm:
echo   1. Chuyển đổi giữa 4 vai trò: Admin, Giáo viên, Phụ huynh, Học sinh.
echo   2. Import file Excel mẫu School_Master_Database.xlsx.
echo   3. Thử tạo bản sao lưu dữ liệu năm học thành file .CSV.
echo   4. Đóng học phí thử nghiệm qua VietQR động.
echo ========================================================
pause
