# Tài Liệu Bàn Giao Dự Án (Handover Document)

Dự án: **Phenika**
Phiên bản hiện tại: `2.0.60`
Nền tảng: Frontend Web (ReactJS)

Tài liệu này cung cấp các thông tin cần thiết để người mới có thể nhanh chóng tiếp nhận, cài đặt và tiếp tục phát triển dự án Phenika một cách dễ dàng.

---

## 1. Tổng Quan Dự Án (Project Overview)

Phenika là một ứng dụng Web Frontend được xây dựng bằng hệ sinh thái **ReactJS**. Dự án sử dụng `create-react-app` (react-scripts) làm nền tảng build và đóng gói.

### Các Công Nghệ & Thư Viện Chính:

- **Framework/Core:** `React 18.2.0`, `react-router-dom` (routing)
- **State Management:** `Redux Toolkit` (`@reduxjs/toolkit`), `react-redux`
- **UI Component Library:** `Ant Design` (antd), `PrimeReact`, `PrimeFlex`
- **Biểu đồ (Charts):** `ApexCharts`, `Echarts`, `@ant-design/charts`, `Chart.js`, `D3`
- **Forms & Validation:** `react-hook-form`, `yup`, `@hookform/resolvers`
- **Xử lý thời gian:** `dayjs`, `moment`
- **HTTP Client:** `axios`
- **Bảo mật / Mã hoá:** `jsencrypt`, `encrypt-rsa`, `crypto-browserify`

---

## 2. Hướng Dẫn Cài Đặt (Setup Instructions)

### Yêu Cầu Môi Trường (Prerequisites)

- **Node.js**: Phiên bản `18.x` hoặc `20.x` (LTS).
- **Package Manager**: `npm` hoặc `yarn`.

### Các Bước Cài Đặt:

1. **Clone repository về máy:**

   ```bash
   git clone <đường-dẫn-repo-của-dự-án>
   cd Phenika
   ```

2. **Cài đặt dependencies:**

   ```bash
   npm install
   # hoặc
   yarn install
   ```

3. **Cấu hình môi trường (.env):**

   - Copy tệp `.env.example` thành `.env` (nếu có).
   - Kiểm tra file `.env` ở thư mục gốc và đảm bảo các biến môi trường (API Endpoint, Google Maps Key...) được cấu hình chính xác.

4. **Chạy dự án:**
   ```bash
   npm start
   ```
   Dự án sẽ chạy tại: `http://localhost:3000`

---

## 3. Chi Tiết Cấu Trúc & Các Thành Phần (Detailed Structure)

### 3.1. Thư mục `src/components` (Dùng chung)

Các component tại đây được thiết kế để có thể tái sử dụng ở nhiều nơi trong dự án.

- **`common/`**: Chứa các UI cơ bản.
  - `Loading/`: Xử lý hiệu ứng chờ khi tải trang hoặc dữ liệu.
  - `Modal/`: Các popup xác nhận (`ModalConfirm`) hoặc chọn dữ liệu.
  - `GenerateQR/`: Hỗ trợ tạo mã QR thanh toán (VietQR).
  - `ErrorPage/`: Trang hiển thị khi có lỗi hệ thống.
  - `VersionIndicator/`: Hiển thị phiên bản hiện tại của ứng dụng.
- **`layout/`**: Các thành phần giao diện chính.
  - `Navbar/`: Thanh điều hướng phía trên, bao gồm cả hệ thống thông báo (`Notify`).

### 3.2. Thư mục `src/modules` (Chức năng nghiệp vụ)

Dự án được chia theo kiến trúc module để dễ quản lý logic riêng biệt.

- **Module `meal` (Quản lý suất ăn)**:

  - `components/`:
    - `RoomSelectionForm/`: Giao diện chọn phòng và khu vực.
    - `MealDetailsForm/`: Nhập thông tin chi tiết suất ăn, có tích hợp validator riêng.
    - `MealInputBlock/`: Khối nhập liệu nhanh suất ăn.
  - `store/`: Chứa `meal.js` quản lý state (Redux) riêng cho module này.

- **Module `order` (Hệ thống bán hàng - POS)**:
  - `components/`:
    - `Menu/`, `Category/`: Hiển thị danh sách thực đơn và phân loại sản phẩm.
    - `OrderList/`, `OrderItem/`: Quản lý giỏ hàng và các thao tác trên từng món (ghi chú, giảm giá).
    - `OrderSummary/`: Tổng hợp đơn hàng, xử lý thanh toán (`PaymentModal`) và in ấn (`PrintComponent`).
    - `ReceiptPreviewModal/`: Xem trước hóa đơn nhiệt trước khi in.
    - `RetailOrderListModal/`, `FamilyMealListModal/`: Các modal danh sách đơn lẻ và đơn cơm gia đình.
  - `store/`: Chứa `order.js` xử lý logic tính toán giá, khuyến mãi và thanh toán.

### 3.3. Các thư mục quan trọng khác

- **`src/api/`**: Quản lý API tập trung bằng Axios.
- **`src/store/`**: Cấu hình store tổng và các selectors.
- **`src/utils/`**: Các hàm bổ trợ (xử lý in ấn Imin, format tiền tệ, ngày tháng).
- **`src/router/`**: Định nghĩa danh sách các trang và quyền truy cập.

---

## 4. Các Thành Phần Kỹ Thuật (Technical Details)

### 4.1. Biến Môi Trường (.env)

- `REACT_APP_ROOT_API`: Endpoint chính của Backend API.
- `REACT_APP_ROOT`: URL của ứng dụng.
- `REACT_APP_API_GOOGLE_KEY`: API Key cho Google Maps.
- `REACT_APP_VIETQR_ACCOUNT`: Tài khoản nhận thanh toán VietQR.

### 4.2. Quản Lý API (`src/api`)

- Logic gọi API được tập trung trong `src/api/index.js`.
- Sử dụng **Axios Interceptors** để tự động xử lý Token và bắt lỗi global (401, 500...).

### 4.3. Quản Lý State (`src/store`)

- Sử dụng **Redux Toolkit**. State được chia nhỏ theo module (Slices) nằm trong `src/store/reducers`.
- Luôn ưu tiên sử dụng **Selectors** để lấy dữ liệu từ Store.

### 4.4. Module Quan Trọng: `meal` & `order`

- **Module `meal`**: Xử lý luồng đặt suất ăn theo phòng. Bao gồm `RoomSelectionForm` để chọn vị trí và `MealDetailsForm` để nhập chi tiết.
- **Module `order`**: Xử lý logic bán hàng (POS), giỏ hàng, tính toán khuyến mãi và thanh toán.

---

## 5. Quy Chuẩn & Ghi Chú Bảo Trì

- **Coding Style:** ES6+, Functional Components, Hooks.
- **Styling:** Kết hợp `Ant Design` cho component phức tạp và `PrimeFlex` cho layout nhanh.
- **Deployment:**
  - Chạy `npm run build` để đóng gói.
  - Hệ thống có script tự động tăng version (`scripts/`) khi build.
- **Lưu ý:** Đảm bảo cấu hình đúng `REACT_APP_ROOT_API` cho từng môi trường (test/production).
