/**
 * ==============================================================================
 * HỆ THỐNG TỰ ĐỘNG HÓA GIÁO DỤC 4.0 - GOOGLE APPS SCRIPT (THAY THẾ N8N 100% 0Đ)
 * Ban Giám Hiệu & Quản Trị Hệ Thống Trường Học
 * ==============================================================================
 * Mục tiêu: 
 * 1. Nhận Webhook SePAY/Casso để tự động gạch nợ học phí sau 3 giây.
 * 2. Cung cấp REST API (doGet) để Web App Vercel / GitHub đồng bộ dữ liệu.
 * 3. Gửi thông báo tức thì qua Telegram Bot khi có học sinh nộp học phí.
 * 4. Điểm danh và ghi nhận đơn xin nghỉ phép trực tuyến.
 * Chi phí duy trì: 0 VNĐ (Chạy trên hạ tầng Google Cloud miễn phí vĩnh viễn, KHÔNG CẦN VPS).
 */

// CẤU HÌNH HỆ THỐNG (TÙY CHỈNH)
var CONFIG = {
  TELEGRAM_BOT_TOKEN: "YOUR_TELEGRAM_BOT_TOKEN_HERE", // Điền token từ @BotFather nếu muốn nhận tin nhắn
  TELEGRAM_CHAT_ID: "YOUR_TELEGRAM_CHAT_ID_HERE",     // ID nhóm BGH / Kế toán
  SHEET_INVOICE: "Hoc_Phi_Invoices",
  SHEET_ATTENDANCE: "Diem_Danh",
  SHEET_STUDENT: "Hoc_Sinh",
  SHEET_GRADES: "Bang_Diem",
  SHEET_SCHEDULE: "TKB_NhaTruong",
  SHEET_EXAM: "LichThi_Master",
  SHEET_USERS: "Nguoi_Dung" // Sheet ẩn lưu thông tin đăng nhập theo yêu cầu
};

/**
 * HÀM KHỞI TẠO VÀ ẨN SHEET NGƯỜI DÙNG NẾU CHƯA CÓ
 */
function getOrCreateUserSheet(ss) {
  var sheet = ss.getSheetByName(CONFIG.SHEET_USERS);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_USERS);
    sheet.appendRow([
      "Ten_Nguoi_Dung", "Chuc_Vu", "So_Dien_Thoai", "Zalo", "Email", "Pin", "Trang_Thai", "Ngay_Tao"
    ]);
    sheet.appendRow(["Thầy Hiệu Trưởng", "Admin", "0912345678", "0912345678", "admin@tanphu.edu.vn", "123456", "HOAT_DONG", new Date().toLocaleString("vi-VN")]);
    sheet.appendRow(["Cô Phạm Hồng Hạnh", "GiaoVien", "0987654321", "0987654321", "giaovien@tanphu.edu.vn", "123456", "HOAT_DONG", new Date().toLocaleString("vi-VN")]);
    sheet.appendRow(["Nguyễn Văn Tuấn (PH)", "PhuHuynh", "0903112233", "0903112233", "phuhuynh@tanphu.edu.vn", "123456", "HOAT_DONG", new Date().toLocaleString("vi-VN")]);
    sheet.appendRow(["Nguyễn Minh An", "HocSinh", "0944556677", "0944556677", "hocsinh@tanphu.edu.vn", "123456", "HOAT_DONG", new Date().toLocaleString("vi-VN")]);
    try {
      sheet.hideSheet(); // Ẩn sheet người dùng theo yêu cầu bảo mật
    } catch (e) {
      Logger.log("hideSheet error: " + e.toString());
    }
  }
  return sheet;
}

/**
 * 1. WEBHOOK POST (TIẾP NHẬN BIẾN ĐỘNG SỐ DƯ TỪ SEPAY / CASSO & ĐĂNG KÝ/ĐỔI PIN)
 */
function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      return ContentService.createTextOutput(JSON.stringify({ error: "Không tìm thấy bảng tính Google Sheets" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var contents = e.postData ? e.postData.contents : "{}";
    var payload = JSON.parse(contents);

    // 1.1 XỬ LÝ ĐĂNG KÝ TÀI KHOẢN MỚI TỪ WEB APP
    if (payload.action === "register_user" || payload.action === "register") {
      var sheetUser = getOrCreateUserSheet(ss);
      var name = payload.name || payload.Ten_Nguoi_Dung || "";
      var role = payload.role || payload.Chuc_Vu || "HocSinh";
      var phone = payload.phone || payload.So_Dien_Thoai || "";
      var zalo = payload.zalo || payload.Zalo || phone;
      var email = (payload.email || payload.Email || "").trim().toLowerCase();
      var pin = payload.pin || payload.Pin || "123456";

      var data = sheetUser.getDataRange().getValues();
      var exists = false;
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][4]).trim().toLowerCase() === email) {
          exists = true;
          break;
        }
      }
      if (exists) {
        return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Email này đã được đăng ký!" }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      sheetUser.appendRow([name, role, phone, zalo, email, pin, "HOAT_DONG", new Date().toLocaleString("vi-VN")]);
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Đăng ký thành công!", user: { name: name, role: role, email: email } }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 1.2 XỬ LÝ ĐỔI / QUÊN MÃ PIN TỪ WEB APP
    if (payload.action === "forgot_pin") {
      var sheetUser = getOrCreateUserSheet(ss);
      var email = (payload.email || "").trim().toLowerCase();
      var phone = (payload.phone || "").trim();
      var newPin = (payload.newPin || payload.pin || "").trim();

      var data = sheetUser.getDataRange().getValues();
      var updated = false;
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][4]).trim().toLowerCase() === email && String(data[i][2]).trim() === phone) {
          sheetUser.getRange(i + 1, 6).setValue(newPin);
          updated = true;
          break;
        }
      }
      return ContentService.createTextOutput(JSON.stringify(updated ? { success: true, message: "Đặt lại mã PIN thành công!" } : { success: false, message: "Không tìm thấy Email hoặc Số điện thoại khớp!" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Bóc tách nội dung chuyển khoản ngân hàng
    var rawContent = (payload.content || payload.description || "").toUpperCase();
    var amountIn = Number(payload.transferAmount || payload.amount || 0);

    // Tìm mã học sinh (dạng HSxxxx) hoặc mã hóa đơn (INVxxxx)
    var studentId = "";
    var invoiceId = "";

    var matchHS = rawContent.match(/HS[0-9]{4}/);
    if (matchHS) studentId = matchHS[0];

    var matchINV = rawContent.match(/INV[0-9]{4}/);
    if (matchINV) invoiceId = matchINV[0];

    var sheetInv = ss.getSheetByName(CONFIG.SHEET_INVOICE);
    if (!sheetInv) {
      return ContentService.createTextOutput(JSON.stringify({ error: "Thiếu sheet " + CONFIG.SHEET_INVOICE }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var data = sheetInv.getDataRange().getValues();
    var headers = data[0];
    var colStatus = headers.indexOf("Trang_Thai") + 1;
    var colDate = headers.indexOf("Ngay_Thanh_Toan") + 1;
    var colId = headers.indexOf("Ma_HS");
    var colInv = headers.indexOf("Ma_Hoa_Don");
    var colName = headers.indexOf("Ho_Ten");

    var matched = false;
    var studentName = "";

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if ((studentId && row[colId] == studentId) || (invoiceId && row[colInv] == invoiceId)) {
        sheetInv.getRange(i + 1, colStatus).setValue("DA_THANH_TOAN");
        sheetInv.getRange(i + 1, colDate).setValue(new Date().toLocaleString("vi-VN"));
        matched = true;
        studentName = row[colName];
        break;
      }
    }

    // Gửi thông báo Telegram nếu cấu hình
    if (matched && CONFIG.TELEGRAM_BOT_TOKEN && CONFIG.TELEGRAM_BOT_TOKEN !== "YOUR_TELEGRAM_BOT_TOKEN_HERE") {
      var msg = "🎉 *XÁC NHẬN THANH TOÁN HỌC PHÍ THÀNH CÔNG!*\n\n"
              + "• *Học sinh:* " + studentName + " (" + studentId + ")\n"
              + "• *Số tiền:* " + amountIn.toLocaleString("vi-VN") + " VNĐ\n"
              + "• *Nội dung:* " + rawContent + "\n"
              + "• *Thời gian:* " + new Date().toLocaleString("vi-VN") + "\n\n"
              + "✅ Đã gạch nợ tự động trên Google Sheets!";
      sendTelegramMessage(msg);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      matched: matched,
      studentId: studentId,
      amount: amountIn,
      message: matched ? "Đã gạch nợ học phí thành công sau 3 giây!" : "Không tìm thấy mã HS khớp trong nội dung"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  var action = e.parameter ? e.parameter.action : "";
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Đảm bảo Sheet Người dùng tồn tại và được ẩn
  getOrCreateUserSheet(ss);

  // 2.1 API XÁC THỰC ĐĂNG NHẬP
  if (action === "auth_login" || action === "login") {
    var sheetUser = getOrCreateUserSheet(ss);
    var email = (e.parameter.email || "").trim().toLowerCase();
    var pin = (e.parameter.pin || "").trim();
    var data = sheetUser.getDataRange().getValues();
    var found = null;
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][4]).trim().toLowerCase() === email && String(data[i][5]).trim() === pin) {
        found = {
          name: data[i][0],
          role: data[i][1],
          phone: data[i][2],
          zalo: data[i][3],
          email: data[i][4],
          status: data[i][6]
        };
        break;
      }
    }
    return ContentService.createTextOutput(JSON.stringify(found ? { success: true, user: found } : { success: false, message: "Sai Email hoặc mã PIN!" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // 2.2 API ĐĂNG KÝ TÀI KHOẢN (HỖ TRỢ GET ĐỂ TRÁNH CORS)
  if (action === "auth_register" || action === "register") {
    var sheetUser = getOrCreateUserSheet(ss);
    var name = e.parameter.name || "";
    var role = e.parameter.role || "HocSinh";
    var phone = e.parameter.phone || "";
    var zalo = e.parameter.zalo || phone;
    var email = (e.parameter.email || "").trim().toLowerCase();
    var pin = e.parameter.pin || "123456";

    var data = sheetUser.getDataRange().getValues();
    var exists = false;
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][4]).trim().toLowerCase() === email) {
        exists = true;
        break;
      }
    }
    if (exists) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Email này đã được đăng ký!" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    sheetUser.appendRow([name, role, phone, zalo, email, pin, "HOAT_DONG", new Date().toLocaleString("vi-VN")]);
    return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Đăng ký thành công!", user: { name: name, role: role, email: email } }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // 2.3 API QUÊN MÃ PIN
  if (action === "auth_forgot" || action === "forgot_pin") {
    var sheetUser = getOrCreateUserSheet(ss);
    var email = (e.parameter.email || "").trim().toLowerCase();
    var phone = (e.parameter.phone || "").trim();
    var newPin = (e.parameter.newPin || e.parameter.pin || "").trim();

    var data = sheetUser.getDataRange().getValues();
    var updated = false;
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][4]).trim().toLowerCase() === email && String(data[i][2]).trim() === phone) {
        sheetUser.getRange(i + 1, 6).setValue(newPin);
        updated = true;
        break;
      }
    }
    return ContentService.createTextOutput(JSON.stringify(updated ? { success: true, message: "Đặt lại mã PIN thành công!" } : { success: false, message: "Không tìm thấy Email hoặc Số điện thoại khớp!" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // 2.4 API LẤY TOÀN BỘ DỮ LIỆU CSDL ĐỂ WEB APP HIỂN THỊ
  if (action === "getData" || action === "data") {
    var result = {};
    var sheets = ss.getSheets();
    for (var s = 0; s < sheets.length; s++) {
      var sheet = sheets[s];
      var name = sheet.getName();
      var data = sheet.getDataRange().getValues();
      if (data.length > 1) {
        var headers = data[0];
        var rows = [];
        for (var i = 1; i < data.length; i++) {
          var obj = {};
          for (var j = 0; j < headers.length; j++) {
            obj[headers[j]] = data[i][j];
          }
          rows.push(obj);
        }
        result[name] = rows;
      } else {
        result[name] = [];
      }
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // 2.5 API ĐƠN XIN NGHỈ PHÉP
  if (action === "leave") {
    var studentId = e.parameter.studentId || "";
    var studentName = e.parameter.studentName || "";
    var className = e.parameter.className || "";
    var reason = e.parameter.reason || "";
    var date = e.parameter.date || new Date().toISOString().split("T")[0];

    var sheetAtt = ss.getSheetByName(CONFIG.SHEET_ATTENDANCE);
    if (sheetAtt) {
      sheetAtt.appendRow([
        "LV" + Date.now().toString().slice(-6),
        date,
        studentId,
        studentName,
        className,
        "NGHI_CO_PHEP",
        "[Đơn phép trực tuyến]: " + reason
      ]);
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Đã ghi nhận đơn nghỉ phép!" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  // NẾU TRUY CẬP TRỰC TIẾP QUA TRÌNH DUYỆT
  return ContentService.createTextOutput(JSON.stringify({
    status: "ONLINE",
    message: "Cổng Google Apps Script Giáo Dục THPT Tân Phú đang hoạt động 100%!",
    endpoints: {
      post_webhook_vietqr: "POST [URL_HIEN_TAI]",
      get_database_data: "GET [URL_HIEN_TAI]?action=getData",
      auth_login: "GET/POST ?action=auth_login",
      auth_register: "GET/POST ?action=auth_register",
      auth_forgot: "GET/POST ?action=auth_forgot"
    }
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * 3. HÀM GỬI THÔNG BÁO TELEGRAM
 */
function sendTelegramMessage(text) {
  try {
    var url = "https://api.telegram.org/bot" + CONFIG.TELEGRAM_BOT_TOKEN + "/sendMessage";
    var payload = {
      chat_id: CONFIG.TELEGRAM_CHAT_ID,
      text: text,
      parse_mode: "Markdown"
    };
    UrlFetchApp.fetch(url, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload)
    });
  } catch (e) {
    Logger.log("Lỗi gửi Telegram: " + e.toString());
  }
}
