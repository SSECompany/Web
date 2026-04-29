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
- **Maps & Location:** `@vis.gl/react-google-maps`, `google-map-react`
- **Forms & Validation:** `react-hook-form`, `yup`, `@hookform/resolvers`
- **Xử lý thời gian:** `dayjs`, `moment`
- **HTTP Client:** `axios`
- **Bảo mật / Mã hoá:** `jsencrypt`, `encrypt-rsa`, `crypto-browserify`

---

## 2. Hướng Dẫn Cài Đặt (Setup Instructions)

### Yêu Cầu Môi Trường (Prerequisites)
- **Node.js**: Khuyến nghị sử dụng phiên bản `18.x` hoặc `20.x` (LTS).
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
   - Kiểm tra file `.env` ở thư mục gốc và đảm bảo các biến môi trường (như API Endpoint, API Keys, Google Maps Key...) được cấu hình chính xác cho môi trường dev.

4. **Chạy dự án ở chế độ phát triển (Development mode):**
   ```bash
   npm start
   # hoặc
   yarn start
   ```
   Dự án sẽ tự động mở trên trình duyệt tại: `http://localhost:3000`

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
- **`src/redux/`**: Cấu hình store tổng và root reducer.
- **`src/services/`**: Quản lý API tập trung bằng Axios.
- **`src/utils/`**: Các hàm bổ trợ (xử lý in ấn Imin, format tiền tệ, ngày tháng).
- **`src/routes/`**: Định nghĩa danh sách các trang và quyền truy cập.

---

## 4. Các Lệnh Script (Available Scripts)

Trong quá trình phát triển và build, bạn có thể sử dụng các lệnh được cấu hình sẵn trong `package.json`:

- **Chạy dự án (Dev):** `npm start`
- **Chạy test:** `npm test`
- **Tự động cập nhật version và build:** 
  - `npm run build`
  - `npm run build:patch` / `build:minor` / `build:major` (tăng version và build)
- **Cập nhật Version (không build):** 
  - `npm run version:patch` / `npm run version:minor`

*(Hệ thống có tích hợp script tự động tăng version tại thư mục `scripts/`)*.

---

## 5. Quy Chuẩn Lập Trình (Coding Convention)

- **Ngôn ngữ:** Sử dụng ES6+ (Arrow function, destructuring, hooks).
- **Styling:** Sử dụng SCSS (`sass`) kết hợp cùng các class CSS của `Ant Design` / `PrimeFlex`.
- **Quản lý Form:** Dự án sử dụng `react-hook-form` kết hợp `yup` để tối ưu render.
- **Tên Component:** Sử dụng PascalCase (VD: `RoomSelectionForm.jsx`).
- **Tên hàm/biến:** Sử dụng camelCase (VD: `handleSubmit`, `userData`).

---

## 6. Ghi Chú Khi Bàn Giao & Bảo Trì

- **Các Module Chính:** Hệ thống hiện tại có 2 module chính là `meal` (quản lý suất ăn, chọn phòng - chứa `RoomSelectionForm`, `MealDetailsForm`) và `order` (quản lý đơn hàng).
- **Xử lý API:** Đảm bảo config base URL trong `axios` đúng với môi trường (dev/prod).
- **Routing:** Hệ thống dùng `react-router-dom` v6, lưu ý cách config các Route lồng nhau.
