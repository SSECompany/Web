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
    this.printerInstance.printText(textToPrint);
  }

  async printColumnsText(columns) {
    if (!this.printerInstance) return;
    const colTextArr = columns.map(c => (c.text || '').toString());
    const colWidthArr = columns.map(c => c.width || 1);
    const colAlignArr = columns.map(c => {
      return c.align === 'center' ? 1 : c.align === 'right' ? 2 : 0;
    });
    const size = columns.map(c => c.fontSize || 24);
    this.printerInstance.printColumnsText(colTextArr, colWidthArr, colAlignArr, size, 576);
  }

  async printQrCode(data, options = {}) {
    if (!this.printerInstance) return;
    const { size = 4, align = 'center' } = options;
    this.printerInstance.setQrCodeSize(size);
    const alignValue = align === 'center' ? 1 : align === 'right' ? 2 : 0;
    this.printerInstance.printQrCode(data, alignValue);
  }

  /**
   * In hóa đơn hoàn chỉnh (Mẫu in gốc)
   */
  async printReceipt(master, detail, numberOfCopies = 1, options = {}) {
    const isReprint = options.isReprint === true;
    try {
      if (!this.isInitialized) {
        await this.initPrinter();
      }

      const LINE_FULL_WIDTH = '─────────────────────────────────────────';

      for (let copy = 1; copy <= numberOfCopies; copy++) {
        await this.printerInstance.setTextLineSpacing(0);

        const now = new Date();
        const dateOnly = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
        const timeOnly = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

        const headerBlock = `ĐẠI HỌC PHENIKAA\nĐịa chỉ: Nguyễn Văn Trác, Dương Nội, Hà Nội`;
        await this.printText(headerBlock, {
          fontSize: 24,
          fontStyle: 'bold',
          align: 'center',
        });

        const paymentLabel = this.formatPaymentMethodShort(master?.httt || '');
        const copyLabel = isReprint ? 'IN LẠI' : (numberOfCopies > 1 ? `Liên: ${copy}/${numberOfCopies}` : '');
        const soTheRaw = (master?.so_the || master?.ma_ban || "").toString().trim().toUpperCase();
        const soThe = soTheRaw !== "POS" ? soTheRaw : "";

        await this.printerInstance.setTextStyle(1);
        if (soThe) {
            await this.printColumnsText([
                { text: `[${paymentLabel}]`, width: 3, align: 'left', fontSize: 30 },
                { text: soThe, width: 3, align: 'center', fontSize: 30 },
                { text: copyLabel, width: 2, align: 'right', fontSize: 30 },
            ]);
        } else {
            await this.printColumnsText([
                { text: `[${paymentLabel}]`, width: 6, align: 'left', fontSize: 22 },
                { text: copyLabel, width: 2, align: 'right', fontSize: 22 },
            ]);
        }
        await this.printerInstance.setTextStyle(0);
        await this.printText('', { fontSize: 0 });

        const tenKhach = (master?.ong_ba || master?.ten_kh || "Khách hàng").toString().trim();
        const soCt = String(master?.so_ct || 'Chưa có');
        const infoBlock = `Tên khách: ${tenKhach}\nSố CT: ${soCt}`;
        await this.printText(infoBlock, { fontSize: 22, fontStyle: 'bold', align: 'left' });

        await this.printerInstance.setTextStyle(1);
        await this.printColumnsText([
          { text: 'Tên món', width: 3, align: 'left', fontSize: 20 },
          { text: 'SL', width: 1, align: 'center', fontSize: 20 },
          { text: 'Giá', width: 2, align: 'center', fontSize: 20 },
          { text: 'Thành tiền', width: 2, align: 'right', fontSize: 20 },
        ]);
        await this.printerInstance.setTextStyle(0);
        await this.printText(LINE_FULL_WIDTH, { align: 'center', fontSize: 18 });

        const mainItems = detail.filter(d => !d.ma_vt_root);
        for (const item of mainItems) {
            const tenMon = item?.selected_meal?.label || item?.ten_vt || "Món ăn";
            const sl = String(item?.so_luong || 1);
            const gia = this.formatNumber(item?.don_gia || 0) + 'đ';
            const tt = this.formatNumber(item?.thanh_tien_print || item?.thanh_tien || (Number(sl) * Number(item?.don_gia || 0))) + 'đ';

            await this.printColumnsText([
                { text: tenMon, width: 3, align: 'left', fontSize: 22 },
                { text: sl, width: 1, align: 'center', fontSize: 22 },
                { text: gia, width: 2, align: 'center', fontSize: 22 },
                { text: tt, width: 2, align: 'right', fontSize: 22 },
            ]);

            const subItems = detail.filter(s => s.ma_vt_root === item.ma_vt && s.uniqueid === item.uniqueid);
            for (const sub of subItems) {
                const subTT = this.formatNumber(sub?.thanh_tien_print || sub?.thanh_tien || (Number(sub?.so_luong || 1) * Number(sub?.don_gia || 0))) + 'đ';
                await this.printColumnsText([
                    { text: `+ ${sub.ten_vt}`, width: 3, align: 'left', fontSize: 19 },
                    { text: String(sub.so_luong || 1), width: 1, align: 'center', fontSize: 19 },
                    { text: this.formatNumber(sub.don_gia || 0) + 'đ', width: 2, align: 'center', fontSize: 19 },
                    { text: subTT, width: 2, align: 'right', fontSize: 19 },
                ]);
            }

            if (item.ghi_chu && item.ghi_chu.trim()) {
                await this.printText(` - Ghi chú: ${item.ghi_chu}`, { fontSize: 19, align: 'left' });
            }
        }

        await this.printText(LINE_FULL_WIDTH, { align: 'center', fontSize: 18 });

        const totalDiscount = (detail || []).reduce((sum, d) => sum + parseFloat(d.chiet_khau_print || 0), 0);
        if (totalDiscount > 0) {
            await this.printText(`Chiết khấu: ${this.formatNumber(totalDiscount)}đ`, { fontSize: 22, align: 'right' });
        }

        const totalLine = `TỔNG TIỀN: ${this.formatNumber(master?.tong_tien || 0)}đ`;
        const paddedTotalLine = totalLine.length < 87 ? totalLine.padStart(87) : totalLine;
        await this.printText(paddedTotalLine, { fontSize: 22, fontStyle: 'bold', align: 'left' });

        await this.printText('', { fontSize: 10 });
        const tenNvbh = (master?.ten_nvbh || "").trim();
        const tenDvcs = (master?.ten_dvcs || master?.unitName || master?.DVCS || "").toString().trim();
        const qrInfo = getQRInfoFromStore();
        
        const footerLines = [];
        footerLines.push(`${dateOnly}   ${timeOnly}`);
        if (tenNvbh || tenDvcs) footerLines.push([tenNvbh, tenDvcs].filter(Boolean).join(" - "));
        
        const hotline = master?.HotlineBill || qrInfo?.HotlineBill || PRINT_FOOTER_HOTLINE;
        const email = master?.EmailBill || qrInfo?.EmailBill || PRINT_FOOTER_EMAIL;
        if (hotline) footerLines.push(`Hotline: ${hotline}`);
        if (email) footerLines.push(`Email: ${email}`);
        
        const brandWebsite = [PRINT_FOOTER_BRAND, PRINT_FOOTER_WEBSITE].filter(Boolean).join(' - ');
        if (brandWebsite) footerLines.push(brandWebsite.length < 25 ? brandWebsite.padStart(25) : brandWebsite);

        if (footerLines.length) {
            await this.printText(footerLines.join('\n'), { fontSize: 22, fontStyle: 'bold', align: 'left' });
        }

        const qrPayloadToPrint = options.qrPayload !== undefined ? options.qrPayload : getQRPayloadFromStore();
        if (qrPayloadToPrint) {
            await this.printQrCode(qrPayloadToPrint, { size: 3, align: 'center' });
        }

        await this.printText('CẢM ƠN QUÝ KHÁCH, HẸN GẶP LẠI!', { fontSize: 22, align: 'center' });

        await this.printerInstance.printAndFeedPaper(60);
        await this.printerInstance.partialCut();
      }
      return { success: true };
    } catch (error) {
      console.error("❌ Lỗi in hóa đơn:", error);
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
