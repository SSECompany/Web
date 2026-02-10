import { DownOutlined, UpOutlined } from "@ant-design/icons";
import { Button, Checkbox, Input, InputNumber, Modal, Select, message } from "antd";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { num2words } from "../../../../../app/Options/DataFomater";
import {
  formatCurrency,
  formatNumber,
  parserNumber,
} from "../../../../../app/hook/dataFormatHelper";
import VietQR from "../../../../../components/common/GenerateQR/VietQR";
import { apiGetCustomerByTaxCode } from "../../../../../api";
import "./PaymentModal.css";

const PaymentModal = ({
  visible,
  onClose,
  onConfirm,
  total,
  isCreatingOrder,
  initialPaymentMethod,
  initialPaymentAmounts,
  initialCustomerInfo,
  initialSync,
  salesStaff = [],
  initialOrderStatus,
  initialSelectedStaff,
}) => {
  const [selectedPayments, setSelectedPayments] = useState(["chuyen_khoan"]);
  const [paymentAmounts, setPaymentAmounts] = useState({
    tien_mat: 0,
    chuyen_khoan: 0,
    cong_no: 0,
  });
  const [change, setChange] = useState(0);
  const [customerInfo, setCustomerInfo] = useState({
    ong_ba: "",
    cccd: "",
    dia_chi: "",
    so_dt: "",
    email: "",
    ma_so_thue_kh: "",
    ten_dv_kh: "",
    so_the: "",
  });
  const [errors, setErrors] = useState({
    cccd: "",
    so_dt: "",
    ma_so_thue_kh: "",
    staff: "",
  });
  const [showCustomerInfo, setShowCustomerInfo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sync, setSync] = useState(true);
  const [isLoadingTaxInfo, setIsLoadingTaxInfo] = useState(false);
  const taxCodeTimeoutRef = useRef(null);
  const maSoThueRef = useRef(null);
  const staffSelectRef = useRef(null);
  const cccdRef = useRef(null);
  const soDtRef = useRef(null);
  const [orderStatus, setOrderStatus] = useState({
    xuat_hoa_don: false,
    khach_tra_sau: false,
  });
  const [selectedStaff, setSelectedStaff] = useState(null);

  const handleToggleCustomerInfo = useCallback(
    () => setShowCustomerInfo((prev) => !prev),
    []
  );

  const showQRCode = useMemo(
    () =>
      selectedPayments.length === 1 &&
      selectedPayments.includes("chuyen_khoan"),
    [selectedPayments]
  );

  // Memoize account info
  const account = useMemo(() => process.env.REACT_APP_VIETQR_ACCOUNT, []);
  const accountName = useMemo(
    () => process.env.REACT_APP_VIETQR_ACCOUNT_NAME,
    []
  );

  // Reset lựa chọn nhân viên mỗi khi mở modal (logic auto-select được xử lý trong useEffect khởi tạo)
  useEffect(() => {
    if (visible && !initialSelectedStaff) {
      // Chỉ reset nếu không có initialSelectedStaff
      // Nếu có SalesManDefault (salesStaff.length === 1), sẽ được auto-select trong useEffect khởi tạo
      if (salesStaff.length !== 1) {
        setSelectedStaff(null);
      }
    }
  }, [visible, salesStaff.length, initialSelectedStaff]);

  const handlePaymentSelection = (method) => {
    const numTotal = Number(total) || 0;
    
    if (method === "cong_no") {
      // Chọn công nợ - tự động tick xuất hóa đơn
      setSelectedPayments(["cong_no"]);
      setPaymentAmounts({ tien_mat: 0, chuyen_khoan: 0, cong_no: numTotal });
      setChange(0);
      setOrderStatus((prev) => ({
        xuat_hoa_don: true,
        khach_tra_sau: false,
      }));
    } else if (method === "ca_hai") {
      // Chọn cả hai - để input 0 nhưng tính đúng tiền trả lại
      setSelectedPayments(["tien_mat", "chuyen_khoan"]);
      setPaymentAmounts({ tien_mat: 0, chuyen_khoan: 0, cong_no: 0 });
      setChange(-numTotal);
      // Bỏ tick công nợ nếu có
      setOrderStatus((prev) => ({
        xuat_hoa_don: false,
        khach_tra_sau: false,
      }));
    } else {
      // Chọn một phương thức duy nhất
      setSelectedPayments([method]);
      setPaymentAmounts((amounts) => {
        const updatedAmounts = { tien_mat: 0, chuyen_khoan: 0, cong_no: 0 };
        updatedAmounts[method] = numTotal;
        return updatedAmounts;
      });
      setChange(0);
      // Bỏ tick công nợ nếu có
      setOrderStatus((prev) => ({
        xuat_hoa_don: false,
        khach_tra_sau: false,
      }));
    }
  };

  const handleOrderStatusChange = (statusType, checked) => {
    const numTotal = Number(total) || 0;
    
    if (statusType === "xuat_hoa_don") {
      setOrderStatus((prev) => ({
        xuat_hoa_don: checked,
        khach_tra_sau: checked ? false : prev.khach_tra_sau,
      }));
      // Nếu tick xuất hóa đơn => tự động chọn công nợ
      if (checked) {
        setSelectedPayments(["cong_no"]);
        setPaymentAmounts({ tien_mat: 0, chuyen_khoan: 0, cong_no: numTotal });
        setChange(0);
      } else {
        // Nếu bỏ tick => reset về chuyển khoản mặc định
        setSelectedPayments(["chuyen_khoan"]);
        setPaymentAmounts({ tien_mat: 0, chuyen_khoan: numTotal, cong_no: 0 });
        setChange(0);
      }
    } else if (statusType === "khach_tra_sau") {
      setOrderStatus((prev) => ({
        xuat_hoa_don: checked ? false : prev.xuat_hoa_don,
        khach_tra_sau: checked,
      }));
      // Nếu tick khách trả sau => tự động chọn công nợ
      if (checked) {
        setSelectedPayments(["cong_no"]);
        setPaymentAmounts({ tien_mat: 0, chuyen_khoan: 0, cong_no: numTotal });
        setChange(0);
      } else {
        // Nếu bỏ tick => reset về chuyển khoản mặc định
        setSelectedPayments(["chuyen_khoan"]);
        setPaymentAmounts({ tien_mat: 0, chuyen_khoan: numTotal, cong_no: 0 });
        setChange(0);
      }
    }
  };

  const handleAmountChange = (method, value) => {
    // Đảm bảo value là số hợp lệ
    const numValue = Number(value) || 0;
    const newAmounts = { ...paymentAmounts, [method]: numValue };
    setPaymentAmounts(newAmounts);

    const totalAmount = Object.values(newAmounts).reduce(
      (sum, val) => {
        const numVal = Number(val) || 0;
        return sum + numVal;
      },
      0
    );
    const numTotal = Number(total) || 0;
    const calculatedChange = totalAmount - numTotal;
    setChange(isNaN(calculatedChange) ? 0 : calculatedChange);
  };

  const validateCCCD = (value) => {
    if (!value) return "";
    if (!/^\d{9}$|^\d{12}$/.test(value)) {
      return "CCCD phải có 9 hoặc 12 số";
    }
    return "";
  };

  const validatePhoneNumber = (value) => {
    if (!value) return "";
    if (!/^(0|\+84)[3|5|7|8|9][0-9]{8}$/.test(value)) {
      return "Số điện thoại phải có 10 số và bắt đầu bằng 0";
    }
    return "";
  };

  const validateMaSoThue = (value) => {
    if (!value) return "";
    if (!/^\d{10}(-\d{3})?$/.test(value)) {
      return "Mã số thuế phải có 10 số hoặc 10-3 số";
    }
    return "";
  };

  // Gọi API tra cứu mã số thuế và fill thông tin khách hàng
  const fetchCustomerByTaxCode = useCallback(async (maSoThue) => {
    if (!maSoThue || maSoThue.length < 10) {
      return;
    }

    setIsLoadingTaxInfo(true);
    try {
      const data = await apiGetCustomerByTaxCode(maSoThue);
      if (!data) {
        return;
      }

      setCustomerInfo((prev) => ({
        ...prev,
        ma_so_thue_kh: data.ma_so_thue_kh || maSoThue,
        ten_dv_kh: data.ten_dv_kh || prev.ten_dv_kh,
        dia_chi: data.dia_chi || prev.dia_chi,
      }));
    } catch (error) {
      console.error("Error fetching customer by tax code:", error);
    } finally {
      setIsLoadingTaxInfo(false);
    }
  }, []);

  const handleInputChange = (field, value) => {
    // Chỉ cho phép nhập số cho các trường cần validate
    if (field === "cccd" || field === "so_dt" || field === "so_the") {
      // Chỉ cho phép nhập số (số thẻ / mã bàn chỉ được nhập số)
      if (value !== "" && !/^\d*$/.test(value)) {
        return;
      }
    } else if (field === "ma_so_thue_kh") {
      // Cho phép số và dấu gạch ngang cho mã số thuế
      if (value !== "" && !/^[\d-]*$/.test(value)) {
        return;
      }
    }

    setCustomerInfo((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (field === "cccd") {
      setErrors((prev) => ({
        ...prev,
        cccd: validateCCCD(value),
      }));
    } else if (field === "so_dt") {
      setErrors((prev) => ({
        ...prev,
        so_dt: validatePhoneNumber(value),
      }));
    } else if (field === "ma_so_thue_kh") {
      setErrors((prev) => ({
        ...prev,
        ma_so_thue_kh: validateMaSoThue(value),
      }));

      // Debounce gọi API tra cứu mã số thuế
      if (taxCodeTimeoutRef.current) {
        clearTimeout(taxCodeTimeoutRef.current);
      }

      if (value && /^\d{10}(-\d{3})?$/.test(value)) {
        taxCodeTimeoutRef.current = setTimeout(() => {
          fetchCustomerByTaxCode(value);
        }, 800);
      }
    }
  };

  const handleClose = () => {
    // Clear timeout khi đóng modal
    if (taxCodeTimeoutRef.current) {
      clearTimeout(taxCodeTimeoutRef.current);
      taxCodeTimeoutRef.current = null;
    }
    setIsLoadingTaxInfo(false);
    // Truyền thông tin form hiện tại ra parent để lưu cache (chỉ xoá khi thanh toán xong)
    onClose({
      fromPaymentModal: true,
      customerInfo,
      paymentAmounts,
      selectedPayments,
      change,
      sync,
      orderStatus,
      selectedStaff: selectedStaff
        ? {
            ma_nvbh: selectedStaff.ma_nvbh || selectedStaff.value || selectedStaff.id,
            ten_nvbh: selectedStaff.ten_nvbh || selectedStaff.label || selectedStaff.name,
          }
        : null,
      showCustomerInfo,
    });
  };

  useEffect(() => {
    if (visible) {
      // Khởi tạo orderStatus từ props trước
      const initialStatus = initialOrderStatus || {
        xuat_hoa_don: false,
        khach_tra_sau: false,
      };
      
      // Nếu có xuat_hoa_don_yn hoặc kh_ts_yn từ API, ép payment method = "cong_no"
      const isCreditFromApi = initialStatus.xuat_hoa_don || initialStatus.khach_tra_sau;
      
      // Parse initialPaymentMethod - có thể là "chuyen_khoan" hoặc "tien_mat,chuyen_khoan"
      let defaultPayments = ["chuyen_khoan"];
      if (isCreditFromApi) {
        // Nếu là công nợ từ API, ép payment method = "cong_no"
        defaultPayments = ["cong_no"];
      } else if (initialPaymentMethod) {
        // Nếu httt từ API là "cong_no", cũng set payment method = "cong_no"
        const methods = initialPaymentMethod.split(",").map((method) => method.trim());
        if (methods.includes("cong_no")) {
          defaultPayments = ["cong_no"];
        } else {
          defaultPayments = methods;
        }
      }
      setSelectedPayments(defaultPayments);

      // Tính toán payment amounts dựa trên phương thức thanh toán
      const newPaymentAmounts = { tien_mat: 0, chuyen_khoan: 0, cong_no: 0 };

      // Nếu có initialPaymentAmounts từ order đã lưu, sử dụng nó
      if (
        initialPaymentAmounts &&
        (initialPaymentAmounts.tien_mat > 0 ||
          initialPaymentAmounts.chuyen_khoan > 0 ||
          initialPaymentAmounts.cong_no > 0)
      ) {
        newPaymentAmounts.tien_mat = Number(
          initialPaymentAmounts.tien_mat || 0
        );
        newPaymentAmounts.chuyen_khoan = Number(
          initialPaymentAmounts.chuyen_khoan || 0
        );
        newPaymentAmounts.cong_no = Number(
          initialPaymentAmounts.cong_no || 0
        );
      } else {
        // Nếu không, tính toán dựa trên phương thức thanh toán
        const numTotal = Number(total) || 0;
        if (defaultPayments.length === 1) {
          if (defaultPayments[0] === "tien_mat") {
            newPaymentAmounts.tien_mat = numTotal;
          } else if (defaultPayments[0] === "cong_no") {
            newPaymentAmounts.cong_no = numTotal;
          } else {
            newPaymentAmounts.chuyen_khoan = numTotal;
          }
        } else if (defaultPayments.length === 2) {
          // Nếu có 2 phương thức thanh toán, để input 0 và tính đúng tiền trả lại
          newPaymentAmounts.tien_mat = 0;
          newPaymentAmounts.chuyen_khoan = 0;
        }
      }

      setPaymentAmounts(newPaymentAmounts);

      // Tính toán change amount
      const tienMat = Number(newPaymentAmounts.tien_mat) || 0;
      const chuyenKhoan = Number(newPaymentAmounts.chuyen_khoan) || 0;
      const congNo = Number(newPaymentAmounts.cong_no) || 0;
      const totalPaid = tienMat + chuyenKhoan + congNo;
      const numTotal = Number(total) || 0;

      // Nếu có 2 phương thức thanh toán và không có dữ liệu đã lưu, tính tiền trả lại âm
      if (
        defaultPayments.length === 2 &&
        (!initialPaymentAmounts ||
          (initialPaymentAmounts.tien_mat === 0 &&
            initialPaymentAmounts.chuyen_khoan === 0))
      ) {
        setChange(-numTotal);
      } else {
        const calculatedChange = totalPaid - numTotal;
        setChange(isNaN(calculatedChange) ? 0 : calculatedChange);
      }

      setCustomerInfo({
        ong_ba: initialCustomerInfo?.ong_ba || "",
        cccd: initialCustomerInfo?.cccd || "",
        dia_chi: initialCustomerInfo?.dia_chi || "",
        so_dt: initialCustomerInfo?.so_dt || "",
        email: initialCustomerInfo?.email || "",
        ma_so_thue_kh: initialCustomerInfo?.ma_so_thue_kh || "",
        ten_dv_kh: initialCustomerInfo?.ten_dv_kh || "",
        so_the: initialCustomerInfo?.so_the || "",
      });
      setErrors({
        cccd: "",
        so_dt: "",
        ma_so_thue_kh: "",
      });
      setShowCustomerInfo(false);
      setIsSubmitting(false);
      setSync(initialSync !== undefined ? initialSync : true);
      setOrderStatus(
        initialOrderStatus || {
          xuat_hoa_don: false,
          khach_tra_sau: false,
        }
      );
      // Khởi tạo selectedStaff từ initialSelectedStaff nếu có
      if (initialSelectedStaff && salesStaff.length > 0) {
        const staff = salesStaff.find(
          (x) =>
            x.ma_nvbh === initialSelectedStaff ||
            x.value === initialSelectedStaff ||
            x.id === initialSelectedStaff
        );
        setSelectedStaff(staff || null);
      } else if (salesStaff.length === 1) {
        // Nếu không có initialSelectedStaff nhưng có SalesManDefault (chỉ 1 nhân viên), auto-select
        setSelectedStaff(salesStaff[0]);
      } else {
        setSelectedStaff(null);
      }
    }
  }, [
    visible,
    total,
    initialPaymentMethod,
    initialPaymentAmounts,
    initialCustomerInfo,
    initialSync,
    initialOrderStatus,
    initialSelectedStaff,
    salesStaff,
  ]);

  // Cleanup timeout khi component unmount
  useEffect(() => {
    return () => {
      if (taxCodeTimeoutRef.current) {
        clearTimeout(taxCodeTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Modal
      title={<p className="payment-title">Phiếu thanh toán</p>}
      open={visible}
      onCancel={handleClose}
      footer={null}
      className="payment-modal"
      width={600}
    >
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        {salesStaff && salesStaff.length > 0 && (
          <div style={{ flex: 1 }} id="staff-select-wrapper">
            <p className="payment-text">
              <strong>Nhân viên:</strong>
              <span style={{ color: "red" }}> *</span>
            </p>
            <Select
              ref={staffSelectRef}
              style={{ width: "100%" }}
              placeholder="Chọn nhân viên"
              id="staff-select"
              value={
                selectedStaff
                  ? selectedStaff.ma_nvbh ||
                    selectedStaff.value ||
                    selectedStaff.id
                  : undefined
              }
              onChange={(value) => {
                const staff =
                  salesStaff.find(
                    (x) =>
                      x.ma_nvbh === value ||
                      x.value === value ||
                      x.id === value
                  ) || null;
                setSelectedStaff(staff);
                // Xóa lỗi khi đã chọn
                if (staff) {
                  setErrors((prev) => ({ ...prev, staff: "" }));
                }
              }}
              options={salesStaff.map((item) => ({
                value: item.ma_nvbh || item.value || item.id,
                label: item.ten_nvbh || item.label || item.name,
              }))}
              allowClear
              status={errors.staff ? "error" : ""}
            />
            {errors.staff && (
              <div style={{ color: "red", fontSize: 12, marginTop: 4 }}>
                {errors.staff}
              </div>
            )}
          </div>
        )}
        <div style={{ flex: 1 }}>
          <p className="payment-text">
            <strong>Mã bàn:</strong>
          </p>
          <Input
            style={{ width: "100%" }}
            value={customerInfo.so_the}
            placeholder="Nhập số thẻ (chỉ số)"
            onChange={(e) => handleInputChange("so_the", e.target.value)}
            maxLength={50}
            inputMode="numeric"
            pattern="[0-9]*"
          />
        </div>
      </div>
      <p
        className="payment-text"
        onClick={handleToggleCustomerInfo}
        style={{ cursor: "pointer", userSelect: "none" }}
      >
        <strong>
          Thông tin khách hàng{" "}
          {showCustomerInfo ? <UpOutlined /> : <DownOutlined />}
        </strong>
      </p>
      {showCustomerInfo && (
        <div className="customer-info-section" style={{ margin: "16px 0" }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: 500 }}>Tên khách:</label>
                <Input
                  style={{ width: "100%", marginTop: 4 }}
                  value={customerInfo.ong_ba}
                  placeholder="Nhập tên khách"
                  onChange={(e) => handleInputChange("ong_ba", e.target.value)}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: 500 }}>CCCD:</label>
                <Input
                  ref={cccdRef}
                  style={{ width: "100%", marginTop: 4 }}
                  value={customerInfo.cccd}
                  placeholder="Nhập số CCCD"
                  onChange={(e) => {
                    handleInputChange("cccd", e.target.value);
                    // Xóa lỗi khi đã nhập
                    if (e.target.value.trim()) {
                      setErrors((prev) => ({ ...prev, cccd: "" }));
                    }
                  }}
                  status={errors.cccd ? "error" : ""}
                  maxLength={12}
                  onKeyPress={(e) => {
                    if (!/\d/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                />
                {errors.cccd && (
                  <div style={{ color: "red", fontSize: 12 }}>
                    {errors.cccd}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: 500 }}>Số điện thoại:</label>
                <Input
                  ref={soDtRef}
                  style={{ width: "100%", marginTop: 4 }}
                  value={customerInfo.so_dt}
                  placeholder="Nhập số điện thoại"
                  onChange={(e) => {
                    handleInputChange("so_dt", e.target.value);
                    // Xóa lỗi khi đã nhập
                    if (e.target.value.trim()) {
                      setErrors((prev) => ({ ...prev, so_dt: "" }));
                    }
                  }}
                  status={errors.so_dt ? "error" : ""}
                  maxLength={12}
                  onKeyPress={(e) => {
                    if (!/[\d+]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                />
                {errors.so_dt && (
                  <div style={{ color: "red", fontSize: 12 }}>
                    {errors.so_dt}
                  </div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: 500 }}>Email:</label>
                <Input
                  style={{ width: "100%", marginTop: 4 }}
                  value={customerInfo.email}
                  placeholder="Nhập email"
                  type="email"
                  onChange={(e) => handleInputChange("email", e.target.value)}
                />
              </div>
            </div>
            {/* Mã số thuế - full width */}
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontWeight: 500 }}>
                Mã số thuế:
                {orderStatus.xuat_hoa_don && (
                  <span style={{ color: "red" }}> *</span>
                )}
              </label>
              <Input
                ref={maSoThueRef}
                style={{ width: "100%", marginTop: 4 }}
                value={customerInfo.ma_so_thue_kh}
                placeholder="Nhập mã số thuế"
                onChange={(e) => {
                  handleInputChange("ma_so_thue_kh", e.target.value);
                  // Xóa lỗi khi đã nhập
                  if (e.target.value.trim()) {
                    setErrors((prev) => ({ ...prev, ma_so_thue_kh: "" }));
                  }
                }}
                status={errors.ma_so_thue_kh ? "error" : ""}
                maxLength={14}
                onKeyPress={(e) => {
                  if (!/[\d-]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
              />
              {errors.ma_so_thue_kh && (
                <div style={{ color: "red", fontSize: 12 }}>
                  {errors.ma_so_thue_kh}
                </div>
              )}
            </div>

            {/* Tên công ty - full width, chỉ hiển thị khi có mã số thuế */}
            {customerInfo.ma_so_thue_kh && (
              <div style={{ marginBottom: 8 }}>
                <label style={{ fontWeight: 500 }}>Tên công ty:</label>
                <Input
                  style={{ width: "100%", marginTop: 4 }}
                  value={customerInfo.ten_dv_kh}
                  placeholder="Nhập tên công ty"
                  onChange={(e) =>
                    handleInputChange("ten_dv_kh", e.target.value)
                  }
                />
              </div>
            )}

            {/* Địa chỉ - full width, luôn hiển thị */}
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontWeight: 500 }}>Địa chỉ:</label>
              <Input
                style={{ width: "100%", marginTop: 4 }}
                value={customerInfo.dia_chi}
                placeholder="Nhập địa chỉ"
                onChange={(e) => handleInputChange("dia_chi", e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
      <div style={{ borderBottom: "1px solid #ccc", margin: "16px 0" }}></div>

      <p className="payment-text">
        <strong>Trạng thái đơn hàng:</strong>
      </p>
      <div className="order-status-options">
        <Checkbox
          checked={orderStatus.xuat_hoa_don}
          onChange={(e) =>
            handleOrderStatusChange("xuat_hoa_don", e.target.checked)
          }
          className="order-status-checkbox"
        >
          Xuất hóa đơn
        </Checkbox>
        <Checkbox
          checked={orderStatus.khach_tra_sau}
          onChange={(e) =>
            handleOrderStatusChange("khach_tra_sau", e.target.checked)
          }
          className="order-status-checkbox"
        >
          Khách trả sau
        </Checkbox>
      </div>

      <div style={{ borderBottom: "1px solid #ccc", margin: "16px 0" }}></div>

      <p className="payment-text">
        <strong>Hình thức thanh toán:</strong>
      </p>
      <div className="payment-methods">
        {/* Nếu đã tick xuất hóa đơn hoặc khách trả sau => chỉ hiển thị button Công nợ */}
        {(orderStatus.xuat_hoa_don || orderStatus.khach_tra_sau) ? (
          <div
            className="payment-option selected"
            onClick={() => handlePaymentSelection("cong_no")}
            style={{ flex: "0 0 auto", width: "auto", minWidth: "100px" }}
          >
            Công nợ
          </div>
        ) : (
          <>
            {/* Khi chưa tick => chỉ hiển thị 3 button thanh toán bình thường (không có Công nợ) */}
            {["chuyen_khoan", "tien_mat", "ca_hai"].map((method) => (
              <div
                key={method}
                className={`payment-option ${
                  (method === "ca_hai" && selectedPayments.length === 2) ||
                  (method !== "ca_hai" &&
                    selectedPayments.includes(method) &&
                    selectedPayments.length === 1)
                    ? "selected"
                    : ""
                }`}
                onClick={() => handlePaymentSelection(method)}
              >
                {method === "tien_mat"
                  ? "Tiền mặt"
                  : method === "chuyen_khoan"
                  ? "Chuyển khoản"
                  : "Đa phương thức"}
              </div>
            ))}
          </>
        )}
      </div>

      {selectedPayments.length > 0 && (
        <>
          {showQRCode && (
            <div className="qr-code-container">
              <p className="payment-text">
                <strong>Quét mã QR để thanh toán:</strong>
              </p>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <VietQR amount={Math.max(0, total)} soChungTu={""} size={200} />
                <div className="qr-info">
                  {accountName?.split(" - ").map((line, index) => (
                    <div key={index} className="qr-info-line">
                      {line.trim()}
                    </div>
                  ))}
                  <div className="qr-info-line">{account}</div>
                  <div className="qr-info-line">
                    Số tiền: {formatCurrency(Math.max(0, total))}đ
                  </div>
                </div>
              </div>
            </div>
          )}

          {!showQRCode && (
            <>
              <p className="payment-text">
                <strong>Nhập số tiền:</strong>
              </p>
              {selectedPayments.length === 1 ? (
                // Chỉ hiển thị input cho phương thức được chọn
                <div className="payment-amount-container">
                  <span>
                    {selectedPayments[0] === "tien_mat"
                      ? "Tiền mặt"
                      : selectedPayments[0] === "cong_no"
                      ? "Công nợ"
                      : "Chuyển khoản"}
                  </span>
                  <InputNumber
                    value={paymentAmounts[selectedPayments[0]] || 0}
                    onChange={(value) =>
                      handleAmountChange(selectedPayments[0], value)
                    }
                    className="payment-input"
                    style={{ width: 120 }}
                    controls={false}
                    min="0"
                    formatter={(value) => (value ? formatNumber(value) : "")}
                    parser={(value) => (value ? parserNumber(value) : 0)}
                    onKeyDownCapture={(event) => {
                      if (
                        !/[0-9]/.test(event.key) &&
                        ![8, 46, 37, 38, 39, 40].includes(event.keyCode)
                      ) {
                        event.preventDefault();
                      }
                    }}
                  />
                </div>
              ) : (
                // Hiển thị cả hai input khi chọn "Cả hai"
                selectedPayments.map((method) => (
                  <div key={method} className="payment-amount-container">
                    <span>
                      {method === "tien_mat" ? "Tiền mặt" : "Chuyển khoản"}
                    </span>
                    <InputNumber
                      value={paymentAmounts[method] || 0}
                      onChange={(value) => handleAmountChange(method, value)}
                      className="payment-input"
                      style={{ width: 120 }}
                      controls={false}
                      min="0"
                      formatter={(value) => (value ? formatNumber(value) : "")}
                      parser={(value) => (value ? parserNumber(value) : 0)}
                      onKeyDownCapture={(event) => {
                        if (
                          !/[0-9]/.test(event.key) &&
                          ![8, 46, 37, 38, 39, 40].includes(event.keyCode)
                        ) {
                          event.preventDefault();
                        }
                      }}
                    />
                  </div>
                ))
              )}
            </>
          )}
        </>
      )}

      <div className="payment-divider"></div>

      <div className="payment-summary">
        <span>Trả lại:</span>
        <strong style={{ color: (isNaN(change) ? 0 : change) < 0 ? "red" : "black" }}>
          {formatCurrency(isNaN(change) ? 0 : change)}
        </strong>
      </div>

      <div className="w-full text-right">
        <p>{num2words(isNaN(change) ? 0 : change)}</p>
      </div>

      <div className="payment-footer">
        <Button
          key="cancel"
          onClick={handleClose}
          className="payment-button secondary"
          disabled={isCreatingOrder || isSubmitting}
        >
          Huỷ
        </Button>
        <Button
          key="pay"
          type="primary"
          onClick={() => {
            // Kiểm tra lỗi trước khi thanh toán
            const hasErrors = Object.values(errors).some((error) => error);
            if (hasErrors) {
              message.error("Vui lòng kiểm tra lại thông tin khách hàng");
              // Mở phần thông tin khách hàng nếu có lỗi
              setShowCustomerInfo(true);
              // Focus vào trường có lỗi đầu tiên
              setTimeout(() => {
                if (errors.cccd && cccdRef.current) {
                  cccdRef.current.focus();
                } else if (errors.so_dt && soDtRef.current) {
                  soDtRef.current.focus();
                } else if (errors.ma_so_thue_kh && maSoThueRef.current) {
                  maSoThueRef.current.focus();
                }
              }, 100);
              return;
            }

            // Bắt buộc chọn nhân viên
            if (salesStaff.length > 0 && !selectedStaff) {
              setErrors((prev) => ({
                ...prev,
                staff: "Vui lòng chọn nhân viên bán hàng",
              }));
              message.error("Vui lòng chọn nhân viên bán hàng");
              // Scroll và highlight Select nhân viên
              setTimeout(() => {
                const wrapper = document.getElementById('staff-select-wrapper');
                if (wrapper) {
                  wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  const selectElement = wrapper.querySelector('.ant-select-selector');
                  if (selectElement) {
                    selectElement.focus();
                  }
                }
              }, 100);
              return;
            }

            // Bắt buộc nhập mã số thuế nếu chọn xuất hóa đơn (không bắt buộc với khách trả sau)
            if (
              orderStatus.xuat_hoa_don &&
              (!customerInfo.ma_so_thue_kh || !customerInfo.ma_so_thue_kh.trim())
            ) {
              setErrors((prev) => ({
                ...prev,
                ma_so_thue_kh: "Mã số thuế là bắt buộc khi chọn xuất hóa đơn",
              }));
              message.error("Vui lòng nhập mã số thuế khi chọn xuất hóa đơn");
              // Mở phần thông tin khách hàng và focus vào mã số thuế
              setShowCustomerInfo(true);
              setTimeout(() => {
                if (maSoThueRef.current) {
                  maSoThueRef.current.focus();
                }
              }, 100);
              return;
            }

            setIsSubmitting(true);

            const finalCustomerInfo = {
              ...customerInfo,
              ong_ba: customerInfo.ong_ba?.trim() || "",
            };

            // Nếu là công nợ thì sử dụng số tiền đã nhập
            if (orderStatus.xuat_hoa_don || orderStatus.khach_tra_sau || selectedPayments.includes("cong_no")) {
              onConfirm(
                ["cong_no"],
                { tien_mat: 0, chuyen_khoan: 0, cong_no: paymentAmounts.cong_no || total },
                finalCustomerInfo,
                sync,
                orderStatus,
                selectedStaff
              );
              return;
            }

            const adjustedPaymentAmounts = { ...paymentAmounts };
            if (selectedPayments.includes("tien_mat")) {
              if (selectedPayments.length === 1) {
                adjustedPaymentAmounts.tien_mat = total;
              } else {
                adjustedPaymentAmounts.tien_mat =
                  total - (adjustedPaymentAmounts.chuyen_khoan || 0);
              }
            }

            onConfirm(
              selectedPayments,
              adjustedPaymentAmounts,
              finalCustomerInfo,
              sync,
              orderStatus,
              selectedStaff
            );
          }}
          className="payment-button primary"
          disabled={
            isCreatingOrder ||
            isSubmitting ||
            // Nếu là công nợ thì không cần kiểm tra tiền
            (!(orderStatus.xuat_hoa_don || orderStatus.khach_tra_sau) &&
              (selectedPayments.length === 0 ||
                (selectedPayments.length === 2
                  ? Object.values(paymentAmounts).reduce(
                      (sum, val) => sum + val,
                      0
                    ) !== total
                  : Object.values(paymentAmounts).reduce(
                      (sum, val) => sum + val,
                      0
                    ) < total)))
          }
          loading={isCreatingOrder || isSubmitting}
        >
          Thanh toán
        </Button>
      </div>
    </Modal>
  );
};

export default PaymentModal;
