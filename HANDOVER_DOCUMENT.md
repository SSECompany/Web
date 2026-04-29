# TÀI LIỆU BÀN GIAO DỰ ÁN (PROJECT HANDOVER)

Tài liệu này cung cấp cái nhìn tổng quan và chi tiết về cấu trúc mã nguồn của dự án (mã nội bộ: **Phenika / VIKOSAN**), đặc biệt tập trung vào cách tổ chức các **Components** và **Modules**. Tài liệu được thiết kế nhằm giúp các lập trình viên mới tiếp nhận dự án có thể dễ dàng nắm bắt, bảo trì và phát triển tiếp.

---

## 1. TỔNG QUAN DỰ ÁN

- **Mục đích**: Hệ thống quản lý kho, cung cấp các tính năng quản lý danh mục vật tư, phiếu nhập kho, phiếu xuất kho, phiếu xuất điều chuyển và phiếu xuất bán hàng.
- **Công nghệ cốt lõi**:
  - **Framework**: React.js (v18)
  - **Quản lý State**: Redux Toolkit, React-Redux
  - **Định tuyến (Routing)**: React Router DOM (v6)
  - **UI Components**: Ant Design (antd), PrimeReact
  - **Biểu đồ (Charts)**: Ant Design Charts, ApexCharts, ECharts, Chart.js
  - **Mạng (Network)**: Axios, Microsoft SignalR
  - **Khác**: Hook Form (Quản lý Form), Dayjs/Moment (Xử lý thời gian)

---

## 2. CẤU TRÚC THƯ MỤC CƠ BẢN

Dự án được tổ chức theo kiến trúc phân chia rõ ràng giữa các thành phần dùng chung (Global Components) và các thành phần theo nghiệp vụ cụ thể (Modules). 

```text
src/
 ├── components/     # Các UI component dùng chung toàn dự án
 ├── modules/        # Các module nghiệp vụ (domain-specific), vd: quản lý kho (boxly)
 ├── pages/          # Các trang (views) kết nối giữa router và module
 ├── api/            # Cấu hình Axios và định nghĩa API endpoints
 ├── store/          # Cấu hình Redux store trung tâm
 ├── router/         # Khai báo các Route của hệ thống
 ├── hooks/          # Custom hooks dùng chung
 └── utils/          # Các hàm tiện ích dùng chung
```

---

## 3. CHI TIẾT: `src/components`

Thư mục này chứa các components mang tính tái sử dụng cao trong toàn bộ dự án, không phụ thuộc vào một nghiệp vụ cụ thể nào.

### 3.1. `layout` (Thành phần bố cục)
- **`Navbar/`**: Chứa thanh điều hướng trên cùng (Header/Navbar), quản lý hiển thị logo, menu điều hướng và thông tin tài khoản người dùng đang đăng nhập.

### 3.2. `common` (Thành phần dùng chung)
- **`ErrorPage/`**: Giao diện hiển thị khi ứng dụng gặp lỗi (ví dụ: 404 Not Found, 500 Internal Server Error).
- **`Loading/`**: Component hiển thị biểu tượng tải (spinner/skeleton) trong quá trình call API hoặc load dữ liệu.
- **`Modal/`**: Chứa `ModalConfirm.jsx`, là một popup xác nhận hành động dùng chung (Ví dụ: "Bạn có chắc chắn muốn xóa?").
- **`QRScanner/`**: Giao diện và logic tích hợp quét mã QR, có thể được dùng trong việc quét vật tư, mã vạch sản phẩm.
- **`TokenTimer/`**: Component chạy ngầm hoặc hiển thị thời gian để kiểm tra/quản lý thời gian sống của phiên đăng nhập (Token expiration).
- **`VatTuSelectFull/`**: Component dropdown thông minh cho phép tìm kiếm và chọn Vật tư một cách đầy đủ (tích hợp API tìm kiếm, phân trang/lazy load nếu có).
- **`VersionIndicator/`**: Hiển thị phiên bản hiện tại của ứng dụng, thường nằm ở góc màn hình hoặc dưới footer.

---

## 4. CHI TIẾT: `src/modules`

Modules là nơi chứa toàn bộ logic và UI của một nghiệp vụ cụ thể. Dự án hiện tại quản lý nghiệp vụ kho thông qua module **`boxly`**.

### 4.1. Module `boxly` (Nghiệp vụ Kho)

#### 4.1.1. `store/boxly.js`
Nơi chứa Redux Slice để quản lý state (trạng thái) tập trung của riêng nghiệp vụ kho, bao gồm dữ liệu danh sách phiếu, vật tư đang được chọn, hoặc các cờ trạng thái (loading, success, error).

#### 4.1.2. `components/`
Thư mục chứa giao diện và logic phân theo từng loại chứng từ/phiếu trong kho:

**a. Các thành phần dùng chung trong Module Boxly (`components/common/`)**
Thay vì viết lại code cho mỗi loại phiếu, các thành phần này được dùng lại cho tất cả các loại phiếu:
- **`PhieuFormInputs/`**: Form nhập thông tin chung của một phiếu (Ngày lập, người lập, diễn giải...).
- **`VatTuTable/`**: Bảng hiển thị danh sách vật tư bên trong một phiếu. Kèm theo các tính năng như thêm, sửa, xóa dòng vật tư, kiểm tra số lượng hợp lệ (`validation.js`), và hook gọi API lấy thông tin vật tư (`useVatTuApi.js`).
- **`QuantityValidationUtils.js`**: Tiện ích kiểm tra tính hợp lệ của số lượng nhập/xuất (đảm bảo không xuất quá số lượng tồn kho).
- **`hooks/usePhieuFormApi.js`**: Hook chuẩn hóa việc gọi API tạo mới/cập nhật cho form phiếu.
- **`CommonPhieuList.jsx`**: Giao diện danh sách chuẩn (Table) dùng chung để hiển thị danh sách các phiếu.

**b. Phiếu Nhập Kho (`phieu-nhap-kho/`)**
- `ListPhieuNhapKho.jsx`: Màn hình danh sách các phiếu nhập.
- `AddPhieuNhapKho.jsx`: Màn hình thêm mới phiếu nhập kho.
- `DetailPhieuNhapKho.jsx`: Màn hình xem chi tiết một phiếu nhập kho.
- Có các hooks riêng biệt như `useVatTuManagerNhapKho.js` (quản lý state vật tư nhập) và các components giao diện form (`PhieuNhapKhoFormInputs.jsx`, `VatTuNhapKhoTable.jsx`).

**c. Phiếu Xuất Kho (`phieu-xuat-kho/`)**
- Các tệp tương tự như Phiếu nhập kho (`List...`, `Detail...`, `Add...`).
- Tích hợp `VatTuInputSection.jsx` (khu vực quét hoặc nhập liệu vật tư xuất kho).
- Hooks `useVatTuManager.js` xử lý logic phức tạp khi xuất kho (kiểm tra tồn).

**d. Phiếu Xuất Kho Bán Hàng (`phieu-xuat-kho-ban-hang/`)**
- Kế thừa cấu trúc của phiếu xuất kho thông thường nhưng có thêm các trường dữ liệu liên quan đến khách hàng, chiết khấu, giá bán.
- `SearchFilters.jsx`: Bộ lọc tìm kiếm chuyên sâu để tra cứu chứng từ bán hàng.

**e. Phiếu Xuất Điều Chuyển (`phieu-xuat-dieu-chuyen/`)**
- Nghiệp vụ luân chuyển hàng hóa giữa các kho (từ kho A sang kho B).
- Sử dụng các file logic riêng biệt (`phieuXuatDieuChuyenUtils.js`, `phieuXuatDieuChuyenApi.js`) để xử lý luồng đi và đến.

---

## 5. HƯỚNG DẪN DÀNH CHO LẬP TRÌNH VIÊN MỚI

1. **Hiểu luồng Dữ liệu (Data Flow):** 
   Dự án sử dụng **React Hooks** và **Redux**. Hầu hết logic nghiệp vụ phức tạp (như tính toán tổng tiền, kiểm tra tồn kho vật tư) được bóc tách vào các thư mục `hooks/` (ví dụ: `useVatTuManager.js`). Hãy đọc kỹ các Custom Hook này trước khi sửa đổi giao diện.

2. **Cách tái sử dụng mã:**
   Khi tạo một loại phiếu mới (ví dụ: Phiếu Kiểm Kê), KHÔNG NÊN code lại từ đầu. Hãy import và sử dụng lại các components trong `src/modules/boxly/components/common/` như `PhieuFormInputs`, `VatTuTable` và kế thừa `CommonPhieuList.jsx`.

3. **Routing và Pages:**
   Các thư mục ở `src/modules/boxly/components/` chỉ định nghĩa **Components**. Để hiển thị chúng lên ứng dụng, chúng sẽ được gắn vào một trang (View) nằm trong `src/pages/boxly/Boxly.jsx`, và cấu hình URL tại `src/router/routes.js`.

4. **Biến môi trường (Environment Variables):**
   Hãy đảm bảo đã cấu hình file `.env` (có API URL, keys,...) trước khi chạy lệnh khởi động (`npm start` hoặc `yarn start`).

Chúc bạn tiếp quản dự án thành công!
