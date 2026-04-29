# Tapmed Project - Handover Documentation

Tài liệu này cung cấp cái nhìn tổng quan và chi tiết về cấu trúc thư mục, các module chính, và các component cốt lõi của dự án **Tapmed**. Giúp các lập trình viên mới dễ dàng tiếp cận và tiếp quản dự án.

## 1. Cấu trúc thư mục tổng quan

Dự án sử dụng React.js (tạo bằng Create React App hoặc Vite, có file `App.jsx`, `index.js`). Các thư mục chính nằm trong `src`:

- `src/api/`: Chứa các hàm gọi API (services) giao tiếp với backend.
- `src/app/`: Cấu hình ứng dụng, store.
- `src/components/`: Chứa các UI component dùng chung (Global components).
- `src/hooks/`: Các custom React Hooks tái sử dụng ở nhiều nơi.
- `src/pages/`: Các trang (pages) hoặc module chính của ứng dụng.
- `src/store/`: Quản lý state toàn cục (Redux hoặc Zustand).
- `src/utils/` & `src/pharmacy-utils/`: Các hàm tiện ích (format tiền, thời gian, tính toán...).

## 2. Chi tiết các Module chính (trong `src/pages`)

Dự án Tapmed được chia thành các phân hệ (module) nghiệp vụ riêng biệt:

### 2.1. Module Kho (`src/pages/kho`)
Phân hệ quản lý kho hàng, nhập xuất, điều chuyển.

- **`Kho.jsx` & `Kho.css`**: Component chính bọc (layout/wrapper) cho phân hệ kho.
- **`components/`**: Các nghiệp vụ chứng từ kho.
  - `CommonPhieuList.jsx` / `common-phieu.css`: Component hiển thị danh sách dạng bảng chung cho các loại phiếu.
  - `phieu-giao-hang/`: Xử lý phiếu giao hàng cho đơn vị vận chuyển.
  - `phieu-nhap-hang/` / `phieu-nhap-kho/`: Nhập hàng từ nhà cung cấp / vào kho.
  - `phieu-xuat-kho/` / `phieu-xuat-kho-ban-hang/`: Xuất kho nội bộ hoặc xuất bán.
  - `phieu-nhap-dieu-chuyen/` / `phieu-xuat-dieu-chuyen/`: Điều chuyển hàng hóa giữa các kho.
  - `phieu-nhat-hang/`: Quy trình nhặt hàng (pick hàng).
  - `phieu-yeu-cau-kiem-ke/`: Quy trình kiểm kê kho.
- **`store/` & `hooks/`**: Chứa state logic đặc thù riêng cho module kho.

### 2.2. Module Pharmacy / POS Quầy Thuốc (`src/pages/pharmacy`)
Phân hệ bán hàng tại quầy (Point of Sale).

- **`POS.jsx`**: Màn hình bán hàng chính tại quầy.
- **`ReturnPOS.jsx`**: Màn hình xử lý trả hàng POS.
- **`components/`**:
  - `CartTable.jsx`: Bảng hiển thị danh sách sản phẩm trong giỏ hàng đang bán.
  - `CustomerInfo.jsx`: Quản lý thông tin khách hàng hiện tại (tìm kiếm, thêm mới).
  - `PaymentSummary.jsx`: Khu vực thanh toán (tổng tiền, tính toán chiết khấu, nút chốt đơn).
  - `PrescriptionModal.jsx`: Modal xử lý đơn thuốc (nếu có bán thuốc kê đơn).
  - `DiscountModal.jsx`: Modal áp dụng mã giảm giá, chiết khấu.
  - `ReturnOrderModal.jsx`: Modal xác nhận và chọn sản phẩm trả lại.

### 2.3. Các module khác
- **`Login`**: Trang đăng nhập và xử lý xác thực.
- **`kinh-doanh`**: Phân hệ quản lý kinh doanh, doanh thu, đơn hàng online.
- **`reports`**: Phân hệ báo cáo thống kê.

## 3. Các Global Component (`src/components`)

Chứa các UI component có thể dùng ở mọi module:

### 3.1. `common/` (Các UI dùng chung)
- **`Modal` / `PageTemplates`**: Khung layout popup và giao diện chuẩn của page.
- **`QRScanner` / `GenerateQR`**: Quét mã vạch/QR code và tạo mã QR (dùng nhiều ở POS và Kho).
- **`PaymentModal`**: Popup thanh toán mở rộng.
- **`ProductSelectFull`**: Component tìm kiếm và chọn sản phẩm (dùng chung cho cả POS và tạo phiếu nhập/xuất).
- **`Loading` / `ErrorPage`**: Hiển thị trạng thái tải dữ liệu và màn hình lỗi.
- **`VersionIndicator` / `ReportModal` / `RetailOrderListModal`**: Các tiện ích con khác.

### 3.2. `layout/`
- **`Navbar`**: Thanh điều hướng chính của ứng dụng.

## 4. Hướng dẫn tiếp quản và bảo trì
- **Tạo một loại phiếu kho mới**: Sao chép một thư mục phiếu hiện tại (vd: `phieu-nhap-hang`), cập nhật các hàm API và field định nghĩa, kết nối vào `CommonPhieuList` là có thể chạy được.
- **Xử lý luồng POS**: Các logic tính toán tổng tiền, chiết khấu nằm chủ yếu ở `PaymentSummary.jsx` và store/hooks đi kèm của thư mục `pharmacy`.
- **CSS**: Project sử dụng cả CSS modules (file `.css` riêng) và một vài class global ở `index.css` (Tailwind/Bootstrap tuỳ cấu hình). Cần tránh viết đè class name bằng cách thêm prefix cho file css component.
