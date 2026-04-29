import jwt from './jwt';

/*\

 * iMin Printer Service - Wrapper cho iMin SDK V1.0 & V2.0
 * 
 * QUAN TRỌNG:
 * - Android 11 và thấp hơn: Dùng SDK V1.0 (USB/Bluetooth "BluetoothPrinter")
 * - Android 13 trở lên: Dùng SDK V2.0 (AIDL/Bluetooth "InnerPrinter")
 * 
 * Máy POS D4-504 (Android 11): SỬ DỤNG SDK V1.0
 * 
 * Documentation: https://oss-sg.imin.sg/docs/en/Printer.html
 * SDK V1.0: https://imin-sg-resources.oss-ap-southeast-1.aliyuncs.com/docs/demo/iMinPrinterSDK-v1.3.1.zip
 * SDK V2.0: https://github.com/iminsoftware/IminPrinterLibrary
 * 
 * Hỗ trợ:
 * - In text, hình ảnh, QR code, barcode
 * - In nhiều liên liên tục
 * - Cắt giấy tự động (partialCut/fullCut)
 * - Kiểm soát căn chỉnh, font, kích thước
 */

class IminPrinterService {
  constructor() {
    this.isInitialized = false;
    this.printerInstance = null;
    this.isSimulationMode = false;
    this.sdkVersion = null; // 'v1.0' hoặc 'v2.0'
  }

  /**
   * Khởi tạo kết nối với máy in
   * Tự động detect SDK V1.0 hoặc V2.0
   */
  async initPrinter() {
    try {
      // Kiểm tra các cách khác nhau để truy cập iMin SDK
      // 1. Thử JavaScript SDK (iMin Printer v1.4.0) - TỐT NHẤT cho D4-504
      if (window.IminPrinter && typeof window.IminPrinter === 'function') {
        // SDK cần URL/address: mặc định 127.0.0.1:8081 (print service trên máy POS)
        this.printerInstance = new window.IminPrinter();
        this.sdkVersion = 'v1.0-js';
        
        // JS SDK cần: 1) connect() WebSocket trước, 2) initPrinter(connectType)
        try {
          // Bước 1: Kết nối WebSocket tới print service (chạy trên D4-504, ws://127.0.0.1:8081/websocket)
          await this.printerInstance.connect();
          // Bước 2: Khởi tạo máy in - D4-504 dùng USB
          this.printerInstance.initPrinter('USB');
          this.isInitialized = true;
          this.isSimulationMode = false;
        } catch (initError) {
          // Trên PC / browser không có print service → WebSocket fail → fallback simulation
          console.warn('⚠️ Không kết nối được print service:', initError?.message || initError);
          console.warn('💡 Chạy ở chế độ simulation. Trên D4-504 sẽ kết nối thật (ws://127.0.0.1:8081/websocket)');
          this.printerInstance = null;
          this.isSimulationMode = true;
          this.isInitialized = true;
          this.sdkVersion = 'simulation';
        }
      }
      // 2. Thử SDK V2.0 (Android 13+)
      else if (window.iMinPrinter) {
        this.printerInstance = window.iMinPrinter;
        this.sdkVersion = 'v2.0';
        await this.printerInstance.initPrinter();
        this.isInitialized = true;
        this.isSimulationMode = false;
      }
      // 3. Thử SDK V1.0 Native (Android 11 và thấp hơn)
      else if (window.IminPrintHelper || window.InnerPrinterManager) {
        this.printerInstance = window.IminPrintHelper || window.InnerPrinterManager;
        this.sdkVersion = 'v1.0-native';
        
        if (this.printerInstance.initPrinter) {
          await this.printerInstance.initPrinter();
        } else if (this.printerInstance.init) {
          await this.printerInstance.init();
        }
        
        this.isInitialized = true;
        this.isSimulationMode = false;
      }
      // 4. Thử qua Android WebView Interface
      else if (window.Android && window.Android.initPrinter) {
        this.printerInstance = window.Android;
        this.sdkVersion = 'v1.0-webview';
        
        if (this.printerInstance.initPrinter) {
          await this.printerInstance.initPrinter();
        }
        
        this.isInitialized = true;
        this.isSimulationMode = false;
      }
      // 5. Chế độ simulation
      else {
        console.warn('⚠️ iMin SDK không tìm thấy. Chạy ở chế độ simulation.');
        console.warn('💡 Cần import imin-printer (src/utils/imin-printer.js) trong entry.');
        this.isSimulationMode = true;
        this.isInitialized = true;
        this.sdkVersion = 'simulation';
      }
      
      return { 
        success: true, 
        mode: this.isSimulationMode ? 'simulation' : 'real',
        sdkVersion: this.sdkVersion,
        message: this.isSimulationMode 
          ? 'Chế độ simulation - iMin SDK chưa sẵn sàng' 
          : `Đã kết nối ${this.sdkVersion === 'v1.0-js' ? 'iMin JavaScript SDK v1.4.0' : 'SDK ' + this.sdkVersion}`
      };
    } catch (error) {
      console.error('❌ Lỗi khởi tạo máy in:', error);
      throw new Error(`Không thể khởi tạo máy in: ${error.message}`);
    }
  }

  /**
   * Kiểm tra trạng thái máy in
   */
  async getPrinterStatus(connectType = 'USB') {
    if (this.isSimulationMode) {
      return { code: '0', msg: 'Printer ready (simulation mode)', value: '0' };
    }

    if (!this.isInitialized || !this.printerInstance) {
      throw new Error('Máy in chưa được khởi tạo. Gọi initPrinter() trước.');
    }

    try {
      const status = await this.printerInstance.getPrinterStatus(connectType);
      return status;
    } catch (error) {
      console.error('❌ [DEBUG] Lỗi kiểm tra trạng thái máy in:', error);
      // Không throw error, trả về status mặc định để tiếp tục in
      console.warn('⚠️ [DEBUG] Bỏ qua lỗi getPrinterStatus, giả định máy in OK');
      return { code: '0', msg: 'Assumed ready (status check failed)', value: '0' };
    }
  }

  /**
   * Set khoảng cách giữa các dòng text (line spacing)
   * @param {number} space - Khoảng cách (0-255, mặc định ~30)
   */
  async setTextLineSpacing(space = 0) {
    if (this.isSimulationMode) {
      return { success: true };
    }

    if (!this.isInitialized) {
      throw new Error('Máy in chưa được khởi tạo');
    }

    try {
      this.printerInstance.setTextLineSpacing(space);
      await new Promise(resolve => setTimeout(resolve, 10));
      return { success: true };
    } catch (error) {
      console.error('❌ Lỗi set line spacing:', error);
      throw error;
    }
  }

  /**
   * Set kiểu chữ (0=normal, 1=bold, 2=italic, 3=boldItalic) cho các lệnh in tiếp theo
   */
  async setTextStyle(styleValue) {
    if (this.isSimulationMode) return;
    if (!this.isInitialized) return;
    try {
      this.printerInstance.setTextStyle(styleValue);
      await new Promise(resolve => setTimeout(resolve, 10));
    } catch (e) {
      console.warn('setTextStyle:', e);
    }
  }

  /**
   * In văn bản với style tùy chỉnh
   * @param {string} text - Nội dung cần in
   * @param {object} options - Tùy chọn: { fontSize, fontStyle, align, wordWrap }
   */
  async printText(text, options = {}) {
    const {
      fontSize = 24,
      fontStyle = 'normal', // 'normal', 'bold', 'italic', 'boldItalic'
      align = 'left', // 'left', 'center', 'right'
      wordWrap = true,
    } = options;

    if (this.isSimulationMode) {
      return { success: true };
    }

    if (!this.isInitialized) {
      throw new Error('Máy in chưa được khởi tạo');
    }

    try {
      this.printerInstance.setTextSize(fontSize);
      const alignValue = align === 'center' ? 1 : align === 'right' ? 2 : 0;
      this.printerInstance.setAlignment(alignValue);
      const styleMap = { normal: 0, bold: 1, italic: 2, boldItalic: 3 };
      const styleValue = styleMap[fontStyle] ?? 0;
      this.printerInstance.setTextStyle(styleValue);
      const textToPrint = text.endsWith('\n') ? text : text + '\n';
      this.printerInstance.printText(textToPrint);
      // Delay để WebSocket gửi hết messages
      await new Promise(resolve => setTimeout(resolve, 150));
      
      return { success: true };
    } catch (error) {
      console.error('❌ [DEBUG] Lỗi in text:', error);
      throw error;
    }
  }

  /**
   * In bảng nhiều cột
   * @param {array} columns - Mảng các cột: [{ text, width, align }]
   */
  async printColumnsText(columns) {
    if (this.isSimulationMode) {
      return { success: true };
    }

    if (!this.isInitialized) {
      throw new Error('Máy in chưa được khởi tạo');
    }

    try {
      const colTextArr = columns.map(c => c.text || '');
      const colWidthArr = columns.map(c => c.width || 1);
      const colAlignArr = columns.map(c => {
        const a = c.align || 'left';
        return a === 'center' ? 1 : a === 'right' ? 2 : 0;
      });
      const size = columns.map(c => c.fontSize || 24);
      const width = 576;
      this.printerInstance.printColumnsText(colTextArr, colWidthArr, colAlignArr, size, width);
      // Delay nhỏ để đảm bảo WebSocket gửi
      await new Promise(resolve => setTimeout(resolve, 50));
      
      return { success: true };
    } catch (error) {
      console.error('❌ Lỗi in bảng:', error);
      throw error;
    }
  }

  /**
   * In QR code
   * @param {string} data - Dữ liệu QR code
   * @param {object} options - { qrSize, align, errorCorrectionLevel }
   */
  async printQrCode(data, options = {}) {
    const {
      qrSize = 6,
      align = 'center',
      errorCorrectionLevel = 'levelM', // levelL, levelM, levelQ, levelH
    } = options;

    if (this.isSimulationMode) {
      return { success: true };
    }

    if (!this.isInitialized) {
      throw new Error('Máy in chưa được khởi tạo');
    }

    try {
      // iMin SDK: SET trước → PRINT
      
      // 1. Set QR code size (1-9)
      this.printerInstance.setQrCodeSize(qrSize);
      
      // 2. Set error correction level (48=L, 49=M, 50=Q, 51=H)
      const levelMap = { levelL: 48, levelM: 49, levelQ: 50, levelH: 51 };
      this.printerInstance.setQrCodeErrorCorrectionLev(levelMap[errorCorrectionLevel] ?? 49);
      
      // 3. Print QR code (qrStr, alignmentMode)
      const alignValue = align === 'center' ? 1 : align === 'right' ? 2 : 0;
      this.printerInstance.printQrCode(data, alignValue);
      // Delay để WebSocket gửi
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return { success: true };
    } catch (error) {
      console.error('❌ Lỗi in QR code:', error);
      throw error;
    }
  }

  /**
   * In barcode
   * @param {string} data - Dữ liệu barcode
   * @param {object} options - { barcodeType, width, height, align }
   */
  async printBarCode(data, options = {}) {
    const {
      barcodeType = 'CODE128',
      width = 2,
      height = 100,
      align = 'center',
    } = options;

    if (this.isSimulationMode) {
      return { success: true };
    }

    if (!this.isInitialized) {
      throw new Error('Máy in chưa được khởi tạo');
    }

    try {
      // 1. Set barcode width (1-6)
      this.printerInstance.setBarCodeWidth(width);
      
      // 2. Set barcode height (1-255)
      this.printerInstance.setBarCodeHeight(height);
      
      // 3. Map barcode type string sang number
      const typeMap = {
        'UPC_A': 0,
        'UPC_E': 1,
        'EAN13': 2,
        'EAN8': 3,
        'CODE39': 4,
        'ITF': 5,
        'CODABAR': 6,
        'CODE128': 8,
      };
      const barCodeTypeNum = typeMap[barcodeType] ?? 8;
      
      // 4. Print barcode (type, content, alignment)
      const alignValue = align === 'center' ? 1 : align === 'right' ? 2 : 0;
      this.printerInstance.printBarCode(barCodeTypeNum, data, alignValue);
      // Delay để WebSocket gửi
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return { success: true };
    } catch (error) {
      console.error('❌ Lỗi in barcode:', error);
      throw error;
    }
  }

  /**
   * Feed giấy (đẩy giấy ra)
   * @param {number} units - Số đơn vị đẩy giấy (0-255)
   */
  async printAndFeedPaper(units = 50) {
    if (this.isSimulationMode) {
      return { success: true };
    }

    if (!this.isInitialized) {
      throw new Error('Máy in chưa được khởi tạo');
    }

    try {
      this.printerInstance.printAndFeedPaper(units);
      // Delay để WebSocket gửi
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return { success: true };
    } catch (error) {
      console.error('❌ Lỗi feed giấy:', error);
      throw error;
    }
  }

  /**
   * Cắt giấy một phần (giữ giấy không rơi hẳn)
   */
  async partialCut() {
    if (this.isSimulationMode) {
      return { success: true };
    }

    if (!this.isInitialized) {
      throw new Error('Máy in chưa được khởi tạo');
    }

    try {
      this.printerInstance.partialCut();
      // Delay để WebSocket gửi
      await new Promise(resolve => setTimeout(resolve, 150));
      
      return { success: true };
    } catch (error) {
      console.error('❌ Lỗi cắt giấy:', error);
      throw error;
    }
  }

  /**
   * Cắt giấy hoàn toàn
   */
  async fullCut() {
    if (this.isSimulationMode) {
      return { success: true };
    }

    if (!this.isInitialized) {
      throw new Error('Máy in chưa được khởi tạo');
    }

    try {
      if (this.printerInstance.fullCut) {
        this.printerInstance.fullCut();
      } else {
        this.printerInstance.partialCut();
      }
      // Delay để WebSocket gửi
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return { success: true };
    } catch (error) {
      console.error('❌ Lỗi cắt giấy:', error);
      throw error;
    }
  }

  /**
   * Vẽ logo lên canvas nền trắng, căn giữa chắc chắn — width theo % khổ giấy
   * @param {string} imageUrl - URL ảnh hoặc data URI
   * @param {number} paperWidthPx - chiều rộng khổ giấy (80mm ~ 576 để khớp máy in)
   * @param {number} logoWidthRatio - tỷ lệ (0.6 = logo rộng 60% khổ giấy, vừa không vỡ ảnh)
   */
  async resizeImageToDataUrl(imageUrl, paperWidthPx = 576, logoWidthRatio = 0.6) {
    const targetWidth = Math.round(paperWidthPx * logoWidthRatio);
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const w = img.naturalWidth;
          const h = img.naturalHeight;
          const nw = targetWidth;
          const nh = Math.round((h * targetWidth) / w);
          const paddingTop = 4;
          const paddingBottom = 4;
          const canvasW = paperWidthPx;
          const canvasH = nh + paddingTop + paddingBottom;
          const canvas = document.createElement('canvas');
          canvas.width = canvasW;
          canvas.height = canvasH;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvasW, canvasH);
          const x = Math.floor((canvasW - nw) / 2);
          const y = paddingTop;
          ctx.drawImage(img, 0, 0, w, h, x, y, nw, nh);
          resolve(canvas.toDataURL('image/png'));
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = () => reject(new Error('Không tải được ảnh'));
      img.src = imageUrl;
    });
  }

  /**
   * In ảnh logo — width theo % khổ giấy, căn giữa (align center)
   * @param {string} bitmap - URL ảnh (cùng origin) hoặc data URI base64
   * @param {object} options - { align, logoWidthRatio, paperWidthPx }
   */
  async printBitmap(bitmap, options = {}) {
    const align = options.align || 'center';
    const paperWidthPx = options.paperWidthPx ?? 576;
    const logoWidthRatio = options.logoWidthRatio ?? 0.6;
    if (this.isSimulationMode) {
      return { success: true };
    }
    if (!this.isInitialized) {
      throw new Error('Máy in chưa được khởi tạo');
    }
    try {
      const toPrint = await this.resizeImageToDataUrl(bitmap, paperWidthPx, logoWidthRatio);
      const alignValue = align === 'center' ? 1 : align === 'right' ? 2 : 0;
      await this.printerInstance.printSingleBitmap(toPrint, alignValue);
      await new Promise(resolve => setTimeout(resolve, 200));
      return { success: true };
    } catch (error) {
      console.error('❌ Lỗi in ảnh:', error);
      throw error;
    }
  }

  /**
   * Mở ngăn kéo tiền (nếu có)
   */
  async openCashBox() {
    if (this.isSimulationMode) {
      return { success: true };
    }

    if (!this.isInitialized) {
      throw new Error('Máy in chưa được khởi tạo');
    }

    try {
      this.printerInstance.openCashBox();
      // Delay để WebSocket gửi
      await new Promise(resolve => setTimeout(resolve, 50));
      
      return { success: true };
    } catch (error) {
      console.error('❌ Lỗi mở ngăn kéo:', error);
      throw error;
    }
  }

  /**
   * In hóa đơn hoàn chỉnh
   * @param {object} master - Thông tin master đơn hàng
   * @param {array} detail - Chi tiết đơn hàng
   * @param {number} numberOfCopies - Số liên cần in
   * @param {object} options - { isReprint: boolean } - true thì header hiển thị "(in lại)"
   */
  async printReceipt(master, detail, numberOfCopies = 1, options = {}) {
    const isReprint = options.isReprint === true;
    try {
      if (!this.isInitialized) {
        await this.initPrinter();
      }

      const status = await this.getPrinterStatus('USB');

      // Dòng phân cách full width (80mm ~ 48 ký tự)
      const LINE_FULL_WIDTH = '────────────────────────────────';

      // In nhiều liên - mẫu in y hệt hóa đơn thermal PHENIKAAMEC (logo + PHENIKAAMEC, BỆNH VIỆN ĐẠI HỌC PHENIKAA, Thành viên..., HÓA ĐƠN, ngày giờ)
      for (let copy = 1; copy <= numberOfCopies; copy++) {

        await this.setTextLineSpacing(0);

        const now = new Date();
        const dateStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

        let hoaDonTitle = 'HÓA ĐƠN';
        if (isReprint) {
          hoaDonTitle = numberOfCopies > 1 ? `HÓA ĐƠN (IN LẠI) (${copy}/${numberOfCopies})` : 'HÓA ĐƠN (IN LẠI)';
        } else if (numberOfCopies > 1) {
          hoaDonTitle = `HÓA ĐƠN(${copy}/${numberOfCopies})`;
        }

        // Header: in ảnh logo/header (PHENIKAAMEC + BỆNH VIỆN ĐẠI HỌC PHENIKAA + Thành viên...) — ảnh đặt tại public, mặc định /logo.jpeg
        const headerImagePath = (typeof process !== 'undefined' && process.env?.REACT_APP_RECEIPT_HEADER_IMAGE) || '/logo.jpeg';
        const headerImageUrl = headerImagePath.startsWith('http') ? headerImagePath : (typeof window !== 'undefined' ? window.location.origin : '') + (typeof process !== 'undefined' && process.env?.PUBLIC_URL ? process.env.PUBLIC_URL : '') + headerImagePath;
        try {
          await this.printBitmap(headerImageUrl, { align: 'center', logoWidthRatio: 0.6, paperWidthPx: 576 });
        } catch (imgErr) {
          console.warn('⚠️ Không in được ảnh header, bỏ qua:', imgErr?.message || imgErr);
        }
        await this.setTextLineSpacing(0);
        await this.printText(`${hoaDonTitle}\n${dateStr}`, {
          fontSize: 24,
          fontStyle: 'bold',
          align: 'center',
        });

        await this.setTextLineSpacing(0);

        // Gộp hết thông tin hóa đơn vào một block để không bị khoảng cách quá xa
        const infoLines = [];
        const tenKhach = (master?.ong_ba && master.ong_ba.trim()) || (master?.ten_kh && master.ten_kh.trim()) || 'Khách hàng căng tin';
        infoLines.push(`Tên khách: ${tenKhach}`);
        infoLines.push(`Bàn: ${master?.ma_ban || 'POS'}`);
        infoLines.push(`Hình thức: ${this.formatPaymentMethod(master?.httt)}`);
        const countPaymentMethods = [
          Number(master?.benhnhan_tratruoc || 0) > 0,
          Number(master?.sinhvien_tratruoc || 0) > 0,
          Number(master?.chuyen_khoan || 0) > 0,
          Number(master?.tien_mat || 0) > 0,
          Number(master?.tra_sau || 0) > 0,
        ].filter(Boolean).length;
        const isDaPhuongThuc = countPaymentMethods >= 2;
        if (isDaPhuongThuc) {
          if (Number(master?.benhnhan_tratruoc || 0) > 0) {
            infoLines.push(`• Người bệnh trả trước: ${this.formatNumber(master.benhnhan_tratruoc)}đ`);
          }
          if (Number(master?.sinhvien_tratruoc || 0) > 0) {
            infoLines.push(`• Sinh viên trả trước: ${this.formatNumber(master.sinhvien_tratruoc)}đ`);
          }
          if (Number(master?.chuyen_khoan || 0) > 0) {
            infoLines.push(`• Chuyển khoản: ${this.formatNumber(master.chuyen_khoan)}đ`);
          }
          if (Number(master?.tien_mat || 0) > 0) {
            infoLines.push(`• Tiền mặt: ${this.formatNumber(master.tien_mat)}đ`);
          }
          if (Number(master?.tra_sau || 0) > 0) {
            infoLines.push(`• Trả sau: ${this.formatNumber(master.tra_sau)}đ`);
          }
        }
        infoLines.push(`Số CT: ${master?.so_ct || 'Chưa có'}`);
        // Tên nhân viên lấy từ JWT (FullName) giống mẫu in cũ (PrintComponent)
        let staffName = (master?.ten_nvbh && master.ten_nvbh.trim()) ? master.ten_nvbh : '';
        try {
          const rawToken = typeof window !== 'undefined' && window.localStorage && window.localStorage.getItem('access_token');
          const claims = rawToken && rawToken.split('.').length === 3 ? (jwt.getClaims && jwt.getClaims()) || {} : {};
          if (claims && claims.FullName) staffName = String(claims.FullName).trim();
        } catch (_) {}
        infoLines.push(`Nhân viên: ${staffName}`);

        await this.printText(infoLines.join('\n'), { fontSize: 24 });
        await this.printText('', { fontSize: 0 });

        // Bảng: Tên món | SL | Giá | Thành tiền (giống PrintComponent)
        await this.setTextStyle(1); // bold
        await this.printColumnsText([
          { text: 'Tên món', width: 3, align: 'left' },
          { text: 'SL', width: 1, align: 'center' },
          { text: 'Giá', width: 2, align: 'center' },
          { text: 'Thành tiền', width: 2, align: 'right' },
        ]);
        await this.setTextStyle(0); // normal
        await this.printText(LINE_FULL_WIDTH, { align: 'center' });

        // Chi tiết món: thành tiền = don_gia * so_luong - ck_nt (giống PrintComponent)
        const mainItems = detail.filter((d) => !d?.ma_vt_root);
        for (const item of mainItems) {
          const displayName = item?.selected_meal?.label || item?.ten_vt || '';
          const originalPrice = Number(item?.don_gia || 0) * Number(item?.so_luong || 1);
          const discountAmount = parseFloat(item?.ck_nt || 0);
          const thanhTien = originalPrice - discountAmount;
          await this.printColumnsText([
            { text: displayName, width: 3, align: 'left' },
            { text: String(item?.so_luong || 1), width: 1, align: 'center' },
            { text: this.formatNumber(item?.don_gia || 0) + 'đ', width: 2, align: 'right' },
            { text: this.formatNumber(thanhTien) + 'đ', width: 2, align: 'right' },
          ]);

          const subItems = detail.filter(
            (sub) => sub?.ma_vt_root === item?.ma_vt && sub?.uniqueid === item?.uniqueid
          );
          for (const sub of subItems) {
            const subOriginal = Number(sub?.don_gia || 0) * Number(sub?.so_luong || 1);
            const subDiscount = parseFloat(sub?.ck_nt || 0);
            const subThanhTien = subOriginal - subDiscount;
            await this.printColumnsText([
              { text: '+ ' + (sub?.ten_vt || ''), width: 3, align: 'left' },
              { text: String(sub?.so_luong || 1), width: 1, align: 'center' },
              { text: this.formatNumber(sub?.don_gia || 0) + 'đ', width: 2, align: 'right' },
              { text: this.formatNumber(subThanhTien) + 'đ', width: 2, align: 'right' },
            ]);
          }

          if (item?.ghi_chu) {
            await this.printText(`  Ghi chú: ${item.ghi_chu}`, { fontSize: 22, fontStyle: 'italic' });
          }
          await this.printAndFeedPaper(6);
        }

        await this.printText(LINE_FULL_WIDTH, { align: 'center' });

        // Chiết khấu: tổng từ detail ck_nt (giống PrintComponent)
        const totalDiscount = (detail || []).reduce((sum, d) => {
          const val = parseFloat(d?.ck_nt || 0);
          return sum + (isNaN(val) ? 0 : val);
        }, 0);
        if (totalDiscount > 0) {
          await this.printText(`Chiết khấu: ${this.formatNumber(totalDiscount)}đ`, {
            fontSize: 22,
            align: 'right',
          });
        }

        await this.printText(`Tổng tiền: ${this.formatNumber(master?.tong_tien || 0)}đ`, {
          fontSize: 26,
          fontStyle: 'bold',
          align: 'right',
        });

        await this.printText('CẢM ƠN QUÝ KHÁCH, HẸN GẶP LẠI!', {
          fontSize: 22,
          align: 'center',
          fontStyle: 'italic',
        });

        // QR code tra cứu hóa đơn (giống mẫu in cũ)
        const soCt = master?.so_ct || '';
        const qrContent = soCt ? `https://einvoice.phenikaamec.com/?code=${encodeURIComponent(soCt)}` : 'https://einvoice.phenikaamec.com/';
        await this.printQrCode(qrContent, { align: 'center', qrSize: 6 });

        await this.printText('Tra cứu hóa đơn điện tử tại Website: https://einvoice.phenikaamec.com/', {
          fontSize: 20,
          align: 'center',
        });
        await this.printText(`Mã số tra cứu: ${soCt}`, {
          fontSize: 20,
          align: 'center',
        });

        await this.printAndFeedPaper(60);
        await this.partialCut();

        if (copy < numberOfCopies) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      return { success: true, copies: numberOfCopies };
    } catch (error) {
      console.error('❌ [DEBUG] Lỗi in hóa đơn:', error);
      console.error('❌ [DEBUG] Error stack:', error.stack);
      throw error;
    }
  }

  /**
   * Format số thành định dạng tiền tệ
   */
  formatNumber(value) {
    if (!value) return '0';
    return new Intl.NumberFormat('vi-VN').format(value);
  }

  /**
   * Format hình thức thanh toán (giống PrintComponent)
   */
  formatPaymentMethod(method) {
    if (!method) return 'Tiền mặt';
    const methods = String(method).split(',').map((m) => m.trim());
    const formatted = methods.map((m) => {
      switch (m) {
        case 'chuyen_khoan': return 'Chuyển khoản';
        case 'tien_mat': return 'Tiền mặt';
        case 'tra_sau': return 'Trả sau';
        case 'benhnhan_tratruoc': return 'Người bệnh trả trước';
        case 'sinhvien_tratruoc': return 'Sinh viên trả trước';
        default: return 'Tiền mặt';
      }
    });
    return formatted.join(' + ');
  }

  /**
   * Reset và đóng kết nối máy in
   */
  async disconnect() {
    if (this.isSimulationMode) {
      this.isInitialized = false;
      return { success: true };
    }

    if (this.printerInstance) {
      try {
        if (this.printerInstance.resetDevice) {
          await this.printerInstance.resetDevice();
        }
        this.isInitialized = false;
        return { success: true };
      } catch (error) {
        console.error('❌ Lỗi ngắt kết nối:', error);
        throw error;
      }
    }
  }
}

export default IminPrinterService;
