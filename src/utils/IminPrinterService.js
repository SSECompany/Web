import IminPrinter from "./imin-printer";

// Fallback QR payload nếu Redux chưa có data
const FALLBACK_QR_PAYLOAD = "";

// Helper function để lấy QR payload từ Redux store
const getQRPayloadFromStore = () => {
  try {
    const store = require("../store").default;
    const state = store.getState();
    return state.qrCode?.qrPayload || FALLBACK_QR_PAYLOAD;
  } catch (error) {
    console.warn("⚠️ Không thể lấy QR payload từ Redux, dùng fallback:", error);
    return FALLBACK_QR_PAYLOAD;
  }
};

// Helper function để lấy QR info từ Redux store
const getQRInfoFromStore = () => {
  try {
    const store = require("../store").default;
    const state = store.getState();
    const qrCodeData = state.qrCode?.qrCodeData;
    return Array.isArray(qrCodeData) ? qrCodeData[0] || {} : qrCodeData || {};
  } catch (error) {
    console.warn("⚠️ Không thể lấy QR info từ Redux:", error);
    return {};
  }
};

const PRINT_FOOTER_BRAND = process.env.REACT_APP_PRINT_FOOTER_BRAND || "PHX SMART SCHOOL";
const PRINT_FOOTER_WEBSITE = process.env.REACT_APP_PRINT_FOOTER_WEBSITE || "https://phx-smartschool.com";
const PRINT_FOOTER_HOTLINE = process.env.REACT_APP_PRINT_FOOTER_HOTLINE || "";
const PRINT_FOOTER_EMAIL = process.env.REACT_APP_PRINT_FOOTER_EMAIL || "";

class IminPrinterService {
  constructor() {
    this.printerInstance = null;
    this.isInitialized = false;
  }

  /**
   * Detect if paper size is K58 (58mm) or K80 (80mm)
   * iPOS mini / iMin Swift / iMin M2 are handheld devices with 58mm paper.
   * They usually have small screen widths (portrait) or specific User Agent strings.
   */
  isK58() {
    try {
      // Tăng ngưỡng chiều rộng lên 600px và thêm check UA rộng hơn để nhận diện đúng Iposmini/iMin
      const isMobile = window.innerWidth <= 600;
      const userAgent = navigator.userAgent || "";
      const isIminHandheld = userAgent.includes("iMin") || userAgent.includes("M2-203") || userAgent.includes("Iposmini") || userAgent.includes("M2-202");
      return isMobile || isIminHandheld;
    } catch (e) {
      return false;
    }
  }

  /**
   * Khởi tạo máy in (Logic theo SDK chuẩn)
   */
  async initPrinter() {
    // Nếu đã init và socket vẫn đang mở (nếu thư viện có cơ chế check), ta có thể skip
    // Nhưng để chắc chắn "tuần tự", ta có thể reset lại printerInstance nếu cần
    try {
      if (!this.printerInstance) {
        this.printerInstance = new IminPrinter();
      }

      console.log("⏳ Đang kết nối máy in tuần tự...");
      const connected = await this.printerInstance.connect();
      
      if (!connected) {
        throw new Error("Không thể thiết lập kết nối tuần tự với máy in");
      }

      // Đợi thêm một chút để đảm bảo luồng tin nhắn WebSocket đã ổn định
      await new Promise(resolve => setTimeout(resolve, 800));

      this.printerInstance.initPrinter("SPI");
      
      // Thêm thời gian đợi sau khi khởi tạo (chống mất lệnh in ở hóa đơn đầu tiên)
      await new Promise(resolve => setTimeout(resolve, 1200));

      this.isInitialized = true;
      console.log("✅ Máy in đã sẵn sàng (Tuần tự)");
      return { success: true };
    } catch (error) {
      this.isInitialized = false;
      this.printerInstance = null;
      console.error("❌ Lỗi khởi tạo máy in tuần tự:", error);
      throw error;
    }
  }

  /**
   * Khởi động máy in và in dòng chữ test
   */
  async printTest() {
    try {
      if (!this.isInitialized) {
        await this.initPrinter(); // Gọi khởi tạo và kết nối
      }

      if (!this.printerInstance) return { success: false };

      // In dòng chữ thông báo
      await this.printText('MÁY IN ĐÃ SẴN SÀNG', {
        fontSize: 24,
        fontStyle: 'bold',
        align: 'center',
      });

      // In thêm ngày giờ hiện tại
      const now = new Date();
      await this.printText(`Thời gian: ${now.toLocaleTimeString()} ${now.toLocaleDateString()}`, {
        fontSize: 20,
        align: 'center',
      });

      // In ra thêm 1 chút giấy và cắt
      await this.printerInstance.printAndFeedPaper(60);
      await this.printerInstance.partialCut();

      return { success: true };
    } catch (error) {
      console.error("❌ Lỗi in test:", error);
      throw error;
    }
  }

  formatNumber(value) {
    if (!value) return "0";
    return new Intl.NumberFormat("vi-VN").format(value);
  }

  formatPaymentMethodShort(method) {
    if (!method) return 'TM';
    const methods = String(method).split(',').map((m) => m.trim().toLowerCase());
    const hasCash = methods.includes('tien_mat');
    const hasTransfer = methods.includes('chuyen_khoan');
    const hasDebt = methods.includes('cong_no');
    
    let label;
    if (hasDebt) label = 'CÔNG NỢ';
    else if (hasCash && hasTransfer) label = 'CK + TM';
    else if (hasTransfer) label = 'CK';
    else label = 'TM';
    
    return label.toUpperCase();
  }

  async printText(text, options = {}) {
    if (!this.printerInstance) return;
    const { fontSize = 24, fontStyle = 'normal', align = 'left' } = options;

    const alignValue = align === 'center' ? 1 : align === 'right' ? 2 : 0;
    this.printerInstance.setAlignment(alignValue);
    this.printerInstance.setTextSize(fontSize);
    
    const styleMap = { normal: 0, bold: 1, italic: 2, boldItalic: 3 };
    this.printerInstance.setTextStyle(styleMap[fontStyle] || 0);
    
    const textToPrint = text.endsWith('\n') ? text : text + '\n';
    this.printerInstance.printText(textToPrint, alignValue);
  }

  async printColumnsText(columns) {
    if (!this.printerInstance) return;
    const colTextArr = columns.map(c => (c.text || '').toString());
    const colWidthArr = columns.map(c => c.width || 1);
    const colAlignArr = columns.map(c => {
      return c.align === 'center' ? 1 : c.align === 'right' ? 2 : 0;
    });
    const size = columns.map(c => c.fontSize || 24);
    
    // Tự động điều chỉnh độ RỘNG tổng theo loại giấy (576 cho K80, 384 cho K58/Iposmini)
    const totalDots = this.isK58() ? 384 : 576;
    this.printerInstance.printColumnsText(colTextArr, colWidthArr, colAlignArr, size, totalDots);
  }

  async printQrCode(data, options = {}) {
    if (!this.printerInstance) return;
    const { size = 4, align = 'center' } = options;
    this.printerInstance.setQrCodeSize(size);
    const alignValue = align === 'center' ? 1 : align === 'right' ? 2 : 0;
    this.printerInstance.printQrCode(data, alignValue);
  }

  /**
   * In hóa đơn hoàn chỉnh (Hỗ trợ Iposmini / K58)
   */
  async printReceipt(master, detail, numberOfCopies = 1, options = {}) {
    const isReprint = options.isReprint === true;
    const isK58 = this.isK58();
    
    // Giảm mạnh font size cho K58 để cực kỳ gọn
    const fsBase = isK58 ? 19 : 24;      
    const fsTableHead = isK58 ? 17 : 20; 
    const fsTableItem = isK58 ? 18 : 22; 
    const fsSubItem = isK58 ? 16 : 19;   
    const fsFooter = isK58 ? 17 : 22;    
    const fsTitle = isK58 ? 21 : 28; 
    const fsAddress = isK58 ? 16 : 20;
    
    // Đường kẻ cần giữ tỉ lệ độ dài theo khổ giấy để không bị rớt dòng
    const LINE_FULL_WIDTH = isK58 ? '──────────────────────────────────────────────────' : '─────────────────────────────────────────';

    try {
      if (!this.isInitialized) {
        await this.initPrinter();
      }

      for (let copy = 1; copy <= numberOfCopies; copy++) {
        // Thiết lập khoảng cách dòng cực nhỏ
        await this.printerInstance.setTextLineSpacing(1);

        const now = new Date();
        const rawDate = master?.ngay_ct || "";
        let formattedDate = rawDate;
        if (rawDate && rawDate.includes("-")) {
            const parts = rawDate.split('T')[0].split('-');
            if (parts.length === 3) formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
        }

        const dateOnly = formattedDate || `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
        const timeOnly = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

        // Header: Ghép khối để nén dòng tối đa giống K80 (bỏ tiền tố Địa chỉ)
        const headerBlock = `ĐẠI HỌC PHENIKAA\nNguyễn Văn Trác, Dương Nội, Hà Nội`;
        await this.printText(headerBlock, {
          fontSize: fsTitle,
          fontStyle: 'bold',
          align: 'center',
        });

        const paymentLabel = this.formatPaymentMethodShort(master?.httt || '');
        const copyLabel = isReprint ? 'IN LẠI' : (numberOfCopies > 1 ? `Liên: ${copy}/${numberOfCopies}` : '');
        const soTheRaw = (master?.so_the || master?.ma_ban || "").toString().trim().toUpperCase();
        const soThe = soTheRaw !== "POS" ? soTheRaw : "";

        await this.printerInstance.setTextStyle(1);
        // Cấu trúc 3 cột giống K80: [THANH TOÁN]   [SỐ]   LIÊN
        if (soThe) {
            await this.printColumnsText([
                { text: `[${paymentLabel}]`, width: 3, align: 'left', fontSize: 28 },
                { text: `[${soThe}]`, width: 2, align: 'center', fontSize: 36 }, // Số thẻ to và ở giữa
                { text: copyLabel, width: 3, align: 'right', fontSize: 20 },
            ]);
        } else {
            await this.printColumnsText([
                { text: `[${paymentLabel}]`, width: 5, align: 'left', fontSize: 28 },
                { text: copyLabel, width: 3, align: 'right', fontSize: 24 },
            ]);
        }
        await this.printerInstance.setTextStyle(0);

        const tenKhach = (master?.ong_ba || master?.ten_kh || "Khách hàng").toString().trim();
        const soCt = String(master?.so_ct || 'Chưa có');

        // Xuống hàng từng dòng - Gộp vào 1 khối để nén dòng giống K80
        await this.printText(`Tên khách: ${tenKhach}\nSố CT: ${soCt}`, { fontSize: fsBase, fontStyle: 'bold', align: 'left' });

        // Cột tiêu đề bảng - Giống K80 (đã bỏ kẻ trên, chỉ giữ kẻ dưới)
        await this.printerInstance.setTextStyle(1);
        await this.printColumnsText([
            { text: 'Tên món', width: 3, align: 'left', fontSize: fsTableHead },
            { text: 'SL', width: 1, align: 'center', fontSize: fsTableHead },
            { text: 'Giá', width: 2, align: 'center', fontSize: fsTableHead },
            { text: 'Thành tiền', width: 2, align: 'right', fontSize: fsTableHead },
        ]);
        await this.printColumnsText([{ text: LINE_FULL_WIDTH, width: 1, align: 'center', fontSize: 10 }]);
        await this.printerInstance.setTextStyle(0);

        const mainItems = detail.filter(d => !d.ma_vt_root);
        for (const item of mainItems) {
            const tenMon = item?.selected_meal?.label || item?.ten_vt || "Món ăn";
            const sl = String(item?.so_luong || 1);
            const giaVal = item?.don_gia || 0;
            const ttVal = item?.thanh_tien_print || item?.thanh_tien || (Number(sl) * Number(giaVal));
            
            const gia = this.formatNumber(giaVal) + 'đ';
            const tt = this.formatNumber(ttVal) + 'đ';

            await this.printColumnsText([
                { text: tenMon, width: 3, align: 'left', fontSize: fsTableItem },
                { text: sl, width: 1, align: 'center', fontSize: fsTableItem },
                { text: gia, width: 2, align: 'center', fontSize: fsTableItem },
                { text: tt, width: 2, align: 'right', fontSize: fsTableItem },
            ]);

            const subItems = detail.filter(s => s.ma_vt_root === item.ma_vt && s.uniqueid === item.uniqueid);
            for (const sub of subItems) {
                const subTT = this.formatNumber(sub?.thanh_tien_print || sub?.thanh_tien || (Number(sub?.so_luong || 1) * Number(sub?.don_gia || 0))) + 'đ';
                await this.printColumnsText([
                    { text: `+ ${sub.ten_vt}`, width: 3, align: 'left', fontSize: fsSubItem },
                    { text: String(sub.so_luong || 1), width: 1, align: 'center', fontSize: fsSubItem },
                    { text: this.formatNumber(sub.don_gia || 0) + 'đ', width: 2, align: 'center', fontSize: fsSubItem },
                    { text: subTT, width: 2, align: 'right', fontSize: fsSubItem },
                ]);
            }

            if (item.ghi_chu && item.ghi_chu.trim()) {
                await this.printText(` - Ghi chú: ${item.ghi_chu}`, { fontSize: fsSubItem, align: 'left' });
            }
        }

        // Kẽ đường sau bảng
        await this.printColumnsText([{ text: LINE_FULL_WIDTH, width: 1, align: 'center', fontSize: 10 }]);

        const totalDiscount = (detail || []).reduce((sum, d) => sum + parseFloat(d.chiet_khau_print || 0), 0);
        if (totalDiscount > 0) {
            await this.printText(`Chiết khấu: ${this.formatNumber(totalDiscount)}đ`, { fontSize: fsBase, align: 'right' });
        }

        await this.printerInstance.setTextStyle(1);
        const totalLineText = `Tổng tiền: ${this.formatNumber(master?.tong_tien || 0)}đ`;
        await this.printColumnsText([
            { text: "", width: 1, align: 'right', fontSize: fsBase },
            { text: totalLineText, width: 3, align: 'right', fontSize: fsBase },
        ]);
        await this.printerInstance.setTextStyle(0);

        const tenNvbh = (master?.ten_nvbh || "").trim();
        const tenDvcs = (master?.ten_dvcs || master?.unitName || master?.DVCS || "").toString().trim();
        const qrInfo = getQRInfoFromStore();
        
        const footerLines = [];
        // Trả lại cấu trúc footer từng dòng giống K80
        footerLines.push(`${dateOnly} ${timeOnly}`);
        if (tenNvbh || tenDvcs) footerLines.push([tenNvbh, tenDvcs].filter(Boolean).join(" - "));
        
        const hotline = master?.HotlineBill || qrInfo?.HotlineBill || PRINT_FOOTER_HOTLINE;
        const email = master?.EmailBill || qrInfo?.EmailBill || PRINT_FOOTER_EMAIL;
        
        if (hotline) footerLines.push(`Hotline: ${hotline}`);
        if (email) footerLines.push(`Email: ${email}`);

        // Brand và website - Cho vào chung mảng footer để nén dòng và căn trái giống K80
        const brand = PRINT_FOOTER_BRAND || "";
        const website = PRINT_FOOTER_WEBSITE || "";
        const brandWebsiteCombined = [brand, website].filter(Boolean).join(' - ');
        if (brandWebsiteCombined) footerLines.push(brandWebsiteCombined);

        const fsFooterSmall = isK58 ? 18 : 20;

        // In khối footer chính (Ngày giờ, NV, Hotline, Email, Brand) - Căn trái toàn bộ như K80
        if (footerLines.length) {
          await this.printText(footerLines.join('\n'), { fontSize: fsFooterSmall, align: 'left' });
        }

        const qrPayloadToPrint = options.qrPayload !== undefined ? options.qrPayload : getQRPayloadFromStore();
        if (qrPayloadToPrint) {
            await this.printQrCode(qrPayloadToPrint, { size: 3, align: 'center' });
        }

        await this.printText('CẢM ƠN QUÝ KHÁCH, HẸN GẶP LẠI!', { fontSize: fsFooterSmall, align: 'center' });


        await this.printerInstance.printAndFeedPaper(60);
        await this.printerInstance.partialCut();
      }
      return { success: true };
    } catch (error) {
      console.error("❌ Lỗi in hóa đơn:", error);
      throw error;
    }
  }

  /**
   * In báo cáo chốt ca (Hỗ trợ Iposmini / K58)
   */
  async printShiftReport(summaryData, itemData, openingBalance, selectedDate, printTimestamp, cashierName) {
    const isK58 = this.isK58();
    const fsBase = isK58 ? 18 : 24;
    const fsTableHead = isK58 ? 16 : 20;
    const fsTableItem = isK58 ? 17 : 22;
    const fsTitle = isK58 ? 20 : 24;
    const LINE_FULL_WIDTH = isK58 ? '──────────────────────────────────────────────────' : '─────────────────────────────────────────';

    try {
      if (!this.isInitialized) {
        await this.initPrinter();
      }

      await this.printerInstance.setTextLineSpacing(0);

      // Header
      await this.printText('BÁO CÁO CHỐT CA', {
        fontSize: fsTitle,
        fontStyle: 'bold',
        align: 'center',
      });
      await this.printText('Trường đại học Phenikaa', {
        fontSize: fsBase,
        align: 'center',
      });
      await this.printText('', { fontSize: 10 });

      // Info
      await this.printText(`Ngày: ${summaryData?.ngay_ct || selectedDate}`, { fontSize: fsBase });
      await this.printText(`Giờ in: ${printTimestamp}`, { fontSize: fsBase });
      await this.printText(`Thu ngân: ${summaryData?.user_thu_ngan || cashierName || '--'}`, { fontSize: fsBase });
      await this.printText(`Số dư đầu: ${this.formatNumber(openingBalance)}`, { fontSize: fsBase });

      const discount = Number(summaryData?.t_ck_nt) || 0;
      if (discount > 0) {
        await this.printText(`Tổng chiết khấu: ${this.formatNumber(discount)}`, { fontSize: fsBase });
      }

      const voucherCount = Number(summaryData?.t_ap_voucher) || 0;
      if (voucherCount > 0) {
        await this.printText(`Áp dụng voucher: ${voucherCount}`, { fontSize: fsBase });
      }

      // Công nợ
      const congNoKhTs = Number(summaryData?.cong_no_kh_ts) || 0;
      const congNoXuatHd = Number(summaryData?.cong_no_xuat_hd) || 0;
      if (congNoKhTs > 0 || congNoXuatHd > 0) {
        await this.printText('CÔNG NỢ', { fontSize: fsBase, fontStyle: 'bold' });
        if (congNoKhTs > 0) await this.printText(`- CN KH trả sau: ${this.formatNumber(congNoKhTs)}`, { fontSize: fsBase });
        if (congNoXuatHd > 0) await this.printText(`- CN xuất h.đơn: ${this.formatNumber(congNoXuatHd)}`, { fontSize: fsBase });
      }

      // Thanh toán
      await this.printText('PHƯƠNG THỨC THANH TOÁN', { fontSize: fsBase, fontStyle: 'bold' });
      await this.printText(`- Tiền mặt: ${this.formatNumber(Number(summaryData?.t_tien_mat) || 0)}`, { fontSize: fsBase });
      await this.printText(`- Chuyển khoản: ${this.formatNumber(Number(summaryData?.tien_ck) || 0)}`, { fontSize: fsBase });

      // Chi tiết món
      await this.printText('CHI TIẾT NHÓM MÓN', { fontSize: fsBase, fontStyle: 'bold' });
      await this.printerInstance.setTextStyle(1);
      const tableHead = isK58 
        ? [
            { text: 'Tên nhóm', width: 4, align: 'left', fontSize: fsTableHead },
            { text: 'SL', width: 2, align: 'center', fontSize: fsTableHead },
            { text: 'Thành tiền', width: 3, align: 'right', fontSize: fsTableHead },
          ]
        : [
            { text: 'Tên nhóm', width: 4, align: 'left', fontSize: fsTableHead },
            { text: 'Số lượng', width: 2, align: 'center', fontSize: fsTableHead },
            { text: 'Thành tiền', width: 3, align: 'right', fontSize: fsTableHead },
          ];
      await this.printColumnsText(tableHead);
      await this.printerInstance.setTextStyle(0);
      await this.printColumnsText([{ text: LINE_FULL_WIDTH, width: 1, align: 'center', fontSize: 18 }]);

      if (itemData.length === 0) {
        await this.printText('Không có dữ liệu', { fontSize: fsBase, align: 'center' });
      } else {
        for (const item of itemData) {
          const isTotalRow = item.systotal === 0;
          await this.printerInstance.setTextStyle(isTotalRow ? 1 : 0);
          await this.printColumnsText([
            { text: item.ten_nh?.trim() || item.nh_vt1?.trim() || "N/A", width: 4, align: 'left', fontSize: fsTableItem },
            { text: this.formatNumber(item.t_so_luong || 0), width: 2, align: 'center', fontSize: fsTableItem },
            { text: this.formatNumber(item.t_tt || 0), width: 3, align: 'right', fontSize: fsTableItem },
          ]);
        }
      }

      await this.printColumnsText([{ text: LINE_FULL_WIDTH, width: 1, align: 'center', fontSize: 18 }]);
      const net = Number(summaryData?.t_tt) || 0;
      await this.printText(`Tổng cộng: ${this.formatNumber(net)}`, { fontSize: fsBase, fontStyle: 'bold', align: 'right' });

      await this.printText('\nCẢM ƠN QUÝ KHÁCH, HẸN GẶP LẠI!', { fontSize: fsBase, align: 'center' });
      await this.printerInstance.printAndFeedPaper(60);
      await this.printerInstance.partialCut();

      return { success: true };
    } catch (error) {
      console.error("❌ Lỗi in báo cáo chốt ca:", error);
      throw error;
    }
  }

  async openCashBox() {
    if (this.printerInstance) {
        this.printerInstance.openCashBox();
    }
  }
}

export default IminPrinterService;
