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
  SHEET_SCHEDULE: "TKB_NhaTruong"
};

/**
 * 1. WEBHOOK POST (TIẾP NHẬN BIẾN ĐỘNG SỐ DƯ TỪ SEPAY / CASSO)
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

/**
 * 2. REST API GET (TRẢ DỮ LIỆU ĐỂ WEB APP VERCEL / GITHUB GỌI ĐỒNG BỘ)
 */
function doGet(e) {
  var action = e.parameter ? e.parameter.action : "";
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // API LẤY TOÀN BỘ DỮ LIỆU CSDL ĐỂ WEB APP HIỂN THỊ
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

  // API ĐƠN XIN NGHỈ PHÉP
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
      get_database_data: "GET [URL_HIEN_TAI]?action=getData"
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
