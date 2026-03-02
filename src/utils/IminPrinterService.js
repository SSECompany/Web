/**
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

    // Mặc định theo iMin JS SDK demo: gửi lệnh trực tiếp, không delay thủ công.
    this.delays = {
      text: 0,
      columns: 0,
      style: 0,
      qr: 0,
      barcode: 0,
      feed: 0,
      cut: 0,
      betweenCopies: 0,
    };
  }

  sleep(ms = 0) {
    if (!ms || ms <= 0) return Promise.resolve();
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  isLikelyAndroidPos() {
    try {
      const ua = navigator?.userAgent || "";
      return /Android/i.test(ua) || !!window.Android;
    } catch (e) {
      return false;
    }
  }

  hasAnyIminSdk() {
    try {
      return (
        (window.IminPrinter && typeof window.IminPrinter === "function") ||
        !!window.iMinPrinter ||
        !!window.IminPrintHelper ||
        !!window.InnerPrinterManager ||
        (window.Android && window.Android.initPrinter)
      );
    } catch (e) {
      return false;
    }
  }

  /**
   * Chờ SDK iMin inject vào WebView (thường xảy ra ngay sau khi mở app/đầu ca).
   * Trên Android POS: chờ lâu hơn (10s) để đảm bảo SDK kịp inject.
   * @returns {Promise<boolean>} true nếu SDK xuất hiện trong thời gian chờ
   */
  async waitForIminSdk({ timeoutMs = null, intervalMs = 100 } = {}) {
    // Trên Android POS: chờ lâu hơn (10s) để SDK kịp inject
    // PC/dev: chờ ngắn hơn (2.5s) vì không có SDK thật
    const defaultTimeout = this.isLikelyAndroidPos() ? 10000 : 2500;
    const finalTimeout = timeoutMs !== null ? timeoutMs : defaultTimeout;
    
    const start = Date.now();
    while (Date.now() - start < finalTimeout) {
      if (this.hasAnyIminSdk()) return true;
      await this.sleep(intervalMs);
    }
    return this.hasAnyIminSdk();
  }

  /**
   * Override delays runtime.
   * @param {object} partial - ví dụ { text: 0, cut: 20 }
   */
  setDelays(partial = {}) {
    this.delays = { ...this.delays, ...(partial || {}) };
  }

  /**
   * Giữ mặc định theo iMin JS SDK demo: không chèn delay thủ công theo môi trường.
   */
  applyAutoDelays() {
    this.setDelays({
      text: 0,
      columns: 0,
      style: 0,
      qr: 0,
      barcode: 0,
      feed: 0,
      cut: 0,
      betweenCopies: 0,
    });
  }

  /**
   * Khởi tạo kết nối với máy in
   * Tự động detect SDK V1.0 hoặc V2.0
   */
  async initPrinter(options = {}) {
    const { allowWaitForSdk = true } = options || {};
    try {
      // Kiểm tra các cách khác nhau để truy cập iMin SDK
      // 1. Thử JavaScript SDK (iMin Printer v1.4.0) - TỐT NHẤT cho D4-504
      if (window.IminPrinter && typeof window.IminPrinter === 'function') {
        // SDK cần URL/address: mặc định 127.0.0.1:8081 (print service trên máy POS)
        this.printerInstance = new window.IminPrinter();
        this.sdkVersion = 'v1.0-js';

        // JS SDK cần: 1) connect() WebSocket trước, 2) initPrinter(connectType)
        // Trường hợp POS vừa khởi động, service có thể lên chậm → thử lại vài lần
        const maxAttempts = 3;
        let lastError = null;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            // Bước 1: Kết nối WebSocket tới print service (chạy trên D4-504, ws://127.0.0.1:8081/websocket)
            await this.printerInstance.connect();
            // Bước 2: Khởi tạo máy in - D4-504 dùng USB
            this.printerInstance.initPrinter('USB');
            this.isInitialized = true;
            this.isSimulationMode = false;
            this.applyAutoDelays();
            if (typeof window !== "undefined") {
              window.__IMIN_PRINTER_STATUS__ = {
                mode: "real",
                sdkVersion: this.sdkVersion,
                isSimulation: false,
                timestamp: Date.now(),
              };
            }
            lastError = null;
            break;
          } catch (initError) {
            lastError = initError;
            console.warn(
              `⚠️ Không kết nối được print service (lần ${attempt}/${maxAttempts}):`,
              initError?.message || initError
            );

            // Nếu chưa hết số lần thử thì chờ một chút rồi kết nối lại
            if (attempt < maxAttempts) {
              // Backoff nhẹ: 500ms, 1000ms...
              await this.sleep(500 * attempt);
            }
          }
        }

        // Sau khi thử nhiều lần mà vẫn không được → fallback simulation như cũ
        if (!this.isInitialized) {
          console.warn(
            '⚠️ Không thể kết nối print service sau nhiều lần thử:',
            lastError?.message || lastError
          );
          console.warn(
            '💡 Chạy ở chế độ simulation. Trên D4-504 khi print service sẵn sàng, lần in sau sẽ tự kết nối lại.'
          );
          this.printerInstance = null;
          this.isSimulationMode = true;
          this.isInitialized = true;
          this.sdkVersion = 'simulation';
          if (typeof window !== "undefined") {
            window.__IMIN_PRINTER_STATUS__ = {
              mode: "simulation",
              sdkVersion: this.sdkVersion,
              isSimulation: true,
              timestamp: Date.now(),
            };
          }
        }
      }
      // 2. Thử SDK V2.0 (Android 13+)
      else if (window.iMinPrinter) {
        this.printerInstance = window.iMinPrinter;
        this.sdkVersion = 'v2.0';
        await this.printerInstance.initPrinter();
        this.isInitialized = true;
        this.isSimulationMode = false;
        this.applyAutoDelays();
        if (typeof window !== "undefined") {
          window.__IMIN_PRINTER_STATUS__ = {
            mode: "real",
            sdkVersion: this.sdkVersion,
            isSimulation: false,
            timestamp: Date.now(),
          };
        }
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
        this.applyAutoDelays();
        if (typeof window !== "undefined") {
          window.__IMIN_PRINTER_STATUS__ = {
            mode: "real",
            sdkVersion: this.sdkVersion,
            isSimulation: false,
            timestamp: Date.now(),
          };
        }
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
        this.applyAutoDelays();
        if (typeof window !== "undefined") {
          window.__IMIN_PRINTER_STATUS__ = {
            mode: "real",
            sdkVersion: this.sdkVersion,
            isSimulation: false,
            timestamp: Date.now(),
          };
        }
      }
      // 5. Chế độ simulation hoặc pending (Android POS chưa có SDK)
      else {
        const isAndroidPos = this.isLikelyAndroidPos();
        // POS Android: SDK có thể inject chậm sau khi vừa mở app/đầu ca → chờ lâu hơn (10s)
        // Nếu đang retry (allowWaitForSdk = true nhưng đã gọi lần 2) → dùng timeout ngắn hơn (3s)
        if (allowWaitForSdk && isAndroidPos) {
          // Kiểm tra xem có phải retry không (dựa vào status hiện tại)
          const isRetry = typeof window !== "undefined" && 
            window.__IMIN_PRINTER_STATUS__?.mode === "pending";
          const timeoutMs = isRetry ? 3000 : 10000; // Retry: 3s, lần đầu: 10s
          
          const appeared = await this.waitForIminSdk({
            timeoutMs,
            intervalMs: 100,
          });
          if (appeared) {
            // gọi lại init, nhưng không wait lần nữa để tránh loop
            return await this.initPrinter({ allowWaitForSdk: false });
          }
        }

        // Nếu đang chạy trên POS Android mà không có SDK sau khi chờ → set pending, KHÔNG throw lỗi
        // Khi nào cần in sẽ retry lại với timeout ngắn hơn
        if (isAndroidPos) {
          this.isSimulationMode = false;
          this.isInitialized = false;
          this.sdkVersion = null;
          if (typeof window !== "undefined") {
            window.__IMIN_PRINTER_STATUS__ = {
              mode: "pending",
              sdkVersion: null,
              isSimulation: false,
              timestamp: Date.now(),
              message: "iMin SDK chưa sẵn sàng trên POS Android. Sẽ retry khi cần in.",
            };
          }
          // KHÔNG throw lỗi - chỉ log warning và return pending state
          console.warn(
            "⚠️ iMin SDK chưa sẵn sàng trên POS Android. Sẽ retry khi cần in."
          );
          return {
            success: false,
            mode: "pending",
            sdkVersion: null,
            message: "iMin SDK chưa sẵn sàng. Sẽ retry khi cần in.",
          };
        }

        // PC/dev: cho phép chạy simulation để test in qua trình duyệt
        console.warn('⚠️ iMin SDK không tìm thấy. Chạy ở chế độ simulation (PC/dev).');
        console.warn('💡 Cần import imin-printer (src/utils/imin-printer.js) trong entry.');
        this.isSimulationMode = true;
        this.isInitialized = true;
        this.sdkVersion = 'simulation';
        if (typeof window !== "undefined") {
          window.__IMIN_PRINTER_STATUS__ = {
            mode: "simulation",
            sdkVersion: this.sdkVersion,
            isSimulation: true,
            timestamp: Date.now(),
          };
        }
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
      await this.sleep(this.delays.style);
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
      await this.sleep(this.delays.style);
    } catch (e) {
      console.warn('setTextStyle:', e);
    }
  }

  /**
   * In văn bản với style tùy chỉnh
   * @param {string} text - Nội dung cần in
   * @param {object} options - Tùy chọn: { fontSize, fontStyle, align }
   */
  async printText(text, options = {}) {
    const {
      fontSize = 24,
      fontStyle = 'normal', // 'normal', 'bold', 'italic', 'boldItalic'
      align = 'left', // 'left', 'center', 'right'
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
      // Delay rất nhỏ (hoặc 0) để tránh mất lệnh trên WebSocket
      await this.sleep(this.delays.text);
      
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
      await this.sleep(this.delays.columns);
      
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
      await this.sleep(this.delays.qr);
      
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
      await this.sleep(this.delays.barcode);
      
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
      // Tối ưu: nếu units = 0 thì bỏ qua hẳn (tránh tốn thời gian/overhead gọi xuống SDK)
      if (!units || Number(units) <= 0) {
        return { success: true };
      }
      this.printerInstance.printAndFeedPaper(units);
      await this.sleep(this.delays.feed);
      
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
      await this.sleep(this.delays.cut);
      
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
      await this.sleep(this.delays.cut);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Lỗi cắt giấy:', error);
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
      await this.sleep(this.delays.feed);
      
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

      // NOTE: getPrinterStatus() có thể làm chậm (timeout) và hiện không dùng kết quả.
      // Nếu cần kiểm tra trạng thái thật, hãy bật lại theo nhu cầu.
      // const status = await this.getPrinterStatus('USB');

      // Dòng phân cách full width (80mm ~ 48 ký tự)
      const LINE_FULL_WIDTH = '────────────────────────────────';

      // In nhiều liên - mẫu in giống PrintComponent (OrderSummary)
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
        // Header gộp 4 dòng: tên trường, địa chỉ, tiêu đề hóa đơn, ngày giờ
        const headerBlock = `ĐẠI HỌC PHENIKAA\nĐịa chỉ: Nguyễn Văn Trác, Dương Nội, Hà Nội\n${hoaDonTitle}\n${dateStr}`;
        await this.printText(headerBlock, {
          fontSize: 24,
          fontStyle: 'bold',
          align: 'center',
        });

        // Số thẻ: chỉ hiển thị khi có nhập (ẩn nếu rỗng hoặc placeholder "POS")
        const soThe = (master?.so_the && master.so_the.trim()) || (master?.ma_ban && master.ma_ban.trim()) || '';
        const soTheHienThi = soThe && soThe.toUpperCase() !== 'POS' ? soThe : '';
        if (soTheHienThi) {
          await this.printText(`Số thẻ: ${soTheHienThi}`, {
            fontSize: 29,
            fontStyle: 'bold',
            align: 'center',
          });
        }

        await this.setTextLineSpacing(0);
        await this.printText('', { fontSize: 0 });

        // Thông tin hóa đơn: gộp nhiều dòng vào 1 lệnh in để thu hẹp khoảng cách
        const infoLines = [];
        const tenKhach = (master?.ong_ba || master?.ten_kh || '').toString().trim();
        infoLines.push(`Tên khách: ${tenKhach || 'Khách hàng căng tin'}`);
        if (master?.ma_so_thue_kh && master.ma_so_thue_kh.trim()) {
          infoLines.push(`Mã số thuế: ${master.ma_so_thue_kh}`);
        }
        const isXuatHoaDonOrKhachTraSau = master?.xuat_hoa_don_yn === '1' || master?.kh_ts_yn === '1';
        if (!isXuatHoaDonOrKhachTraSau) {
          const chuyenKhoan = Number(master?.chuyen_khoan || 0);
          const tienMat = Number(master?.tien_mat || 0);
          const isDaPhuongThuc = chuyenKhoan > 0 && tienMat > 0;
          if (isDaPhuongThuc) {
            if (chuyenKhoan > 0) infoLines.push(`  • Chuyển khoản: ${this.formatNumber(chuyenKhoan)}đ`);
            if (tienMat > 0) infoLines.push(`  • Tiền mặt: ${this.formatNumber(tienMat)}đ`);
          }
        }
        infoLines.push(`Số CT: ${master?.so_ct || 'Chưa có'}`);
        const tenDvcs = (master?.ten_dvcs || master?.unitName || master?.DVCS || '').toString().trim();
        if (tenDvcs) {
          infoLines.push(`Tên DVCS: ${tenDvcs}`);
        }
        if (infoLines.length > 0) {
          await this.printText(infoLines.join('\n'), { fontSize: 22, fontStyle: 'bold' });
        }

        await this.printText('', { fontSize: 0 });

        // Bảng: Tên món | SL | Giá | Thành tiền — tên cột in đậm
        await this.setTextStyle(1); // bold
        await this.printColumnsText([
          { text: 'Tên món', width: 3, align: 'left' },
          { text: 'SL', width: 1, align: 'center' },
          { text: 'Giá', width: 2, align: 'center' },
          { text: 'Thành tiền', width: 2, align: 'right' },
        ]);
        await this.setTextStyle(0); // normal
        await this.printText(LINE_FULL_WIDTH, { align: 'center' });

        // Chi tiết món (chỉ parent, có sub-items và ghi chú giống PrintComponent)
        const mainItems = detail.filter((d) => !d?.ma_vt_root);
        for (const item of mainItems) {
          const displayName = item?.selected_meal?.label || item?.ten_vt || '';
          const thanhTien = item?.thanh_tien_print ?? item?.thanh_tien ?? (Number(item?.don_gia || 0) * Number(item?.so_luong || 1));
          await this.printColumnsText([
            { text: displayName, width: 3, align: 'left' },
            { text: String(item?.so_luong || 1), width: 1, align: 'center' },
            { text: this.formatNumber(item?.don_gia || 0) + 'đ', width: 2, align: 'right' },
            { text: this.formatNumber(thanhTien) + 'đ', width: 2, align: 'right' },
          ]);

          // Sub-items (ma_vt_root === item.ma_vt, uniqueid === item.uniqueid)
          const subItems = detail.filter(
            (sub) => sub?.ma_vt_root === item?.ma_vt && sub?.uniqueid === item?.uniqueid
          );
          for (const sub of subItems) {
            const subThanhTien = sub?.thanh_tien_print ?? sub?.thanh_tien ?? (Number(sub?.don_gia || 0) * Number(sub?.so_luong || 1));
            await this.printColumnsText([
              { text: '+ ' + (sub?.ten_vt || ''), width: 3, align: 'left' },
              { text: String(sub?.so_luong || 1), width: 1, align: 'center' },
              { text: this.formatNumber(sub?.don_gia || 0) + 'đ', width: 2, align: 'right' },
              { text: this.formatNumber(subThanhTien) + 'đ', width: 2, align: 'right' },
            ]);
          }

          if (item?.ghi_chu) {
            await this.printText(`  Ghi chú: ${item.ghi_chu}`, { fontSize: 0, fontStyle: 'italic' });
          }
          // TỐI ƯU TỐC ĐỘ: giảm feed giữa từng món (feed vật lý thường chậm).
          // Có thể tăng lên 2-6 nếu bạn muốn tách dòng rõ hơn.
          await this.printAndFeedPaper(0);
        }

        await this.printText(LINE_FULL_WIDTH, { align: 'center' });

        // Chiết khấu (tổng từ detail chiet_khau_print)
        const totalDiscount = (detail || []).reduce((sum, d) => {
          const val = parseFloat(d?.chiet_khau_print || 0);
          return sum + (isNaN(val) ? 0 : val);
        }, 0);
        if (totalDiscount > 0) {
          await this.printText(`Chiết khấu: ${this.formatNumber(totalDiscount)}đ`, {
            fontSize: 22,
            align: 'right',
          });
        }

        // Tổng tiền
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

        await this.printAndFeedPaper(60);
        await this.partialCut();

        if (copy < numberOfCopies) {
          await this.sleep(this.delays.betweenCopies);
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
      if (m === 'chuyen_khoan') return 'Chuyển khoản';
      if (m === 'tien_mat') return 'Tiền mặt';
      return 'Tiền mặt';
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
