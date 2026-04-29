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

## 3. Cấu Trúc Thư Mục (Folder Structure)

Dưới đây là sơ đồ cấu trúc thư mục chính của dự án:

```text
Phenika/
├── public/                 # Các file public tĩnh (index.html, favicon,...)
├── scripts/                # Các script hỗ trợ build, tự động cập nhật version
├── src/                    # Chứa mã nguồn chính
│   ├── components/         # Các UI components dùng chung (Shared Components)
│   ├── modules/            # Chứa các module chức năng chính (hiện có: meal, order)
│   │   ├── meal/           # Module quản lý suất ăn (RoomSelectionForm, MealDetailsForm,...)
│   │   └── order/          # Module quản lý đơn hàng
│   ├── redux/              # Cấu hình Redux store, slices
│   ├── routes/             # Cấu hình React Router (Public & Private routes)
│   ├── services/           # Chứa các API calls (cấu hình Axios instance)
│   ├── utils/              # Các hàm tiện ích dùng chung (format number,...)
│   ├── App.js              # File Component gốc
│   └── index.js            # File Entry point của React
├── .env                    # Biến môi trường
├── package.json            # Chứa thông tin thư viện và scripts
└── README.md
```

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
