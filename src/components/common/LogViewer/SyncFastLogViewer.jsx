import * as signalR from "@microsoft/signalr";
import { DatePicker, Input, Select } from "antd";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  api_countPrintStatus_ByDate,
  getPrinterList,
  getPrintJobTracking,
  printOrderRetry,
  updatePrinter,
} from "../../../api";

const SyncFastLogViewer = ({ isOpen, onClose, onPrintResultChange }) => {
  const userId = useSelector((state) => state.claimsReducer?.userInfo?.id);
  const [activeTab, setActiveTab] = useState("monitor");
  const [printOrders, setPrintOrders] = useState([]);
  const [printOrdersLoading, setPrintOrdersLoading] = useState(false);
  const [filter, setFilter] = useState({
    status: "",
    ngay: new Date().toISOString().split("T")[0],
    pageIndex: 1,
    pageSize: 20,
    totalPage: 1,
    totalRecord: 0,
  });
  const [retryingId, setRetryingId] = useState(null);
  const [retryMessage, setRetryMessage] = useState("");
  const [isAnyRetrying, setIsAnyRetrying] = useState(false);
  const [printers, setPrinters] = useState([]);
  const [printerLoading, setPrinterLoading] = useState(false);
  const [printerError, setPrinterError] = useState("");
  const [editPrinter, setEditPrinter] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [printerFilter, setPrinterFilter] = useState({
    tenMay: "",
    pageIndex: 1,
    pageSize: 10,
    totalPage: 1,
    totalRecord: 0,
  });
  const [printerEditLoading, setPrinterEditLoading] = useState(false);
  const [printerEditError, setPrinterEditError] = useState("");
  // Thêm state để lưu connection signalR
  const [printSignalConnection, setPrintSignalConnection] = useState(null);
  const [printerList, setPrinterList] = useState([]);
  // Thêm state để lưu total từ api_countPrintStatus_ByDate
  const [totalFailed, setTotalFailed] = useState(0);
  const [totalPending, setTotalPending] = useState(0);

  useEffect(() => {
    if (isOpen) {
      loadPrintOrders(filter.pageIndex);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && activeTab === "printer") {
      fetchPrinters(printerFilter.pageIndex);
    }
    // eslint-disable-next-line
  }, [isOpen, activeTab]);

  // Lắng nghe signalR print result
  useEffect(() => {
    if (!isOpen || !userId) return;
    let connection;
    let isUnmounted = false;

    const handlePrintResult = (printData) => {
      // Kiểm tra nhiều trường hợp khác nhau
      const isSuccess =
        printData.isSucceded === true ||
        printData.isSucceded === "true" ||
        printData.isSucceded === 1 ||
        printData.isSucceded === "1" ||
        (typeof printData.isSucceded === "boolean" && printData.isSucceded) ||
        (typeof printData.isSucceded === "string" &&
          printData.isSucceded.toLowerCase() === "true");

      if (isSuccess) {
        try {
          setRetryMessage(
            `In thành công trên máy ${printData.ip || printData.ten_may || ""}`
          );
        } catch (error) {}
      } else {
        try {
          setRetryMessage(
            printData.message ||
              `In thất bại tại máy ${printData.ip || printData.ten_may || ""}`
          );
        } catch (error) {}
      }
      // Làm tươi lại data khi có signal trả về
      loadPrintOrders(filter.pageIndex);
      setRetryingId(null);
      setIsAnyRetrying(false);

      // Gọi callback để cập nhật countPrintStatus
      if (typeof onPrintResultChange === "function") {
        onPrintResultChange();
      }

      // Cập nhật total thực tế từ api_countPrintStatus_ByDate
      fetchPrintStatusCount();
    };

    connection = new signalR.HubConnectionBuilder()
      .withUrl(`${process.env.REACT_APP_ROOT_API}Hub/orderHub`)
      .withAutomaticReconnect()
      .build();

    connection.on("ReceivePrintResult", handlePrintResult);

    const startConnection = async () => {
      try {
        await connection.start();
        await connection.invoke("AddToGroup", `printResult_${userId}`);
        setPrintSignalConnection(connection);
      } catch (err) {
        setTimeout(startConnection, 5000);
      }
    };
    startConnection();

    return () => {
      isUnmounted = true;
      if (connection) {
        connection.off("ReceivePrintResult", handlePrintResult);
        connection.stop();
      }
      setPrintSignalConnection(null);
    };
    // eslint-disable-next-line
  }, [isOpen, userId]);

  // Lấy danh sách máy in khi mở modal hoặc chuyển tab monitor
  useEffect(() => {
    if (isOpen && activeTab === "monitor") {
      (async () => {
        try {
          const res = await getPrinterList({
            tenMay: "",
            pageIndex: 1,
            pageSize: 100,
          });
          setPrinterList(res?.listObject?.[0] || []);
        } catch (e) {
          setPrinterList([]);
        }
      })();
    }
  }, [isOpen, activeTab]);

  // Hàm gọi api_countPrintStatus_ByDate để lấy total thực tế
  const fetchPrintStatusCount = async () => {
    try {
      if (!api_countPrintStatus_ByDate) {
        console.error(
          "api_countPrintStatus_ByDate is not imported or undefined!"
        );
      }
      const today = dayjs().format("YYYY-MM-DD");
      const res = await api_countPrintStatus_ByDate(today);
      let failed = 0,
        pending = 0;
      if (
        res &&
        res.listObject &&
        Array.isArray(res.listObject) &&
        res.listObject[0]?.[0]
      ) {
        failed = res.listObject[0][0].total_failed || 0;
        pending = res.listObject[0][0].total_pending || 0;
      }
      setTotalFailed(failed);
      setTotalPending(pending);
    } catch (e) {
      setTotalFailed(0);
      setTotalPending(0);
      console.error("Error in fetchPrintStatusCount:", e);
    }
  };

  // Gọi api_countPrintStatus_ByDate khi mở modal
  useEffect(() => {
    if (isOpen && activeTab === "monitor") {
      fetchPrintStatusCount();
    }
  }, [isOpen, activeTab]);

  const loadPrintOrders = async (page = 1) => {
    setPrintOrdersLoading(true);
    try {
      const payload = {
        status: filter.status,
        ngay: filter.ngay || null,
        pageIndex: page,
        pageSize: filter.pageSize,
        tenMay: filter.maMay || "",
      };
      const response = await getPrintJobTracking(payload);
      const printOrdersData = response?.listObject?.[0] || [];
      setPrintOrders(
        printOrdersData.filter(
          (order, idx, arr) => arr.findIndex((o) => o.id === order.id) === idx
        )
      );
      // Lấy thông tin phân trang
      const pageInfo = response?.listObject?.[1]?.[0] || {};
      setFilter((prev) => ({
        ...prev,
        pageIndex: pageInfo.pageNumber || page,
        pageSize: pageInfo.pageSize || prev.pageSize,
        totalPage: pageInfo.totalPage || 1,
        totalRecord: pageInfo.totalRecord || printOrdersData.length,
      }));
    } catch (error) {
      setPrintOrders([]);
      setFilter((prev) => ({
        ...prev,
        pageIndex: 1,
        totalPage: 1,
        totalRecord: 0,
      }));
    }
    setPrintOrdersLoading(false);
  };

  const fetchPrinters = async (page = 1) => {
    setPrinterLoading(true);
    setPrinterError("");
    try {
      const res = await getPrinterList({
        tenMay: printerFilter.tenMay,
        pageIndex: page,
        pageSize: printerFilter.pageSize,
      });
      const data = res?.listObject?.[0] || [];
      const pageInfo = res?.listObject?.[1]?.[0] || {};
      setPrinters(data);
      setPrinterFilter((prev) => ({
        ...prev,
        pageIndex: pageInfo.pageNumber || page,
        pageSize: pageInfo.pageSize || prev.pageSize,
        totalPage: pageInfo.totalPage || 1,
        totalRecord: pageInfo.totalRecord || data.length,
      }));
    } catch (err) {
      setPrinterError("Không thể tải danh sách máy in");
      setPrinters([]);
      setPrinterFilter((prev) => ({
        ...prev,
        pageIndex: 1,
        totalPage: 1,
        totalRecord: 0,
      }));
    }
    setPrinterLoading(false);
  };

  const handleFilterChange = (field, value) => {
    setFilter((prev) => {
      if (field === "status") {
        return { ...prev, status: value === "ALL" ? "" : value, pageIndex: 1 };
      }
      if (field === "ngay") {
        return { ...prev, ngay: value, pageIndex: 1 };
      }
      if (field === "maMay") {
        return { ...prev, maMay: value, pageIndex: 1 };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleSearch = () => {
    loadPrintOrders(1);
  };

  const handlePageChange = (newPage) => {
    setFilter((prev) => ({ ...prev, pageIndex: newPage }));
    loadPrintOrders(newPage);
  };

  // Sửa lại handleRetry: KHÔNG gọi loadPrintOrders ở đây nữa, chỉ reset state, chờ signal trả về mới load lại
  const handleRetry = async (order) => {
    if (retryingId === order.id || isAnyRetrying) return;
    setRetryingId(order.id);
    setIsAnyRetrying(true);
    setRetryMessage("");
    const timeoutId = setTimeout(() => {
      setRetryingId(null);
      setIsAnyRetrying(false);
      setRetryMessage("In lại thất bại - Hết thời gian chờ");
    }, 30000);
    try {
      await printOrderRetry({
        stt_rec: order.stt_rec,
        ipPrint: order.ip_print,
        action: "",
        userId: userId,
      });
      clearTimeout(timeoutId);
      // KHÔNG gọi loadPrintOrders ở đây, chờ signal trả về

      // Gọi callback để cập nhật countPrintStatus
      if (typeof onPrintResultChange === "function") {
        onPrintResultChange();
      }

      // Cập nhật total thực tế từ api_countPrintStatus_ByDate
      fetchPrintStatusCount();
    } catch (err) {
      clearTimeout(timeoutId);
      setRetryMessage("In lại thất bại cho đơn " + order.stt_rec);
      setRetryingId(null);
      setIsAnyRetrying(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    const d = new Date(timestamp);
    return (
      d.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }) +
      " " +
      d.toLocaleDateString("vi-VN")
    );
  };

  // Hàm mở modal sửa máy in
  const handleEditPrinter = (printer) => {
    setEditPrinter({ ...printer });
    setEditModalOpen(true);
  };

  // Hàm lưu máy in sau khi sửa
  const handleSavePrinter = async () => {
    setPrinterEditLoading(true);
    setPrinterEditError("");
    try {
      await updatePrinter({
        ma_may: editPrinter.ma_may,
        ten_may: editPrinter.ten_may,
        IpAddress: editPrinter.IpAddress,
        status: editPrinter.status,
      });
      setEditModalOpen(false);
      fetchPrinters(printerFilter.pageIndex);
    } catch (err) {
      setPrinterEditError("Cập nhật máy in thất bại!");
    }
    setPrinterEditLoading(false);
  };

  const handlePrinterPageChange = (newPage) => {
    setPrinterFilter((prev) => ({ ...prev, pageIndex: newPage }));
    fetchPrinters(newPage);
  };

  // Tính tổng số đơn in lỗi và đang chờ - LUÔN LUÔN từ api_countPrintStatus_ByDate
  // const total_failed = printOrders.filter(
  //   (order) => order.status === "FAILED"
  // ).length;
  // const total_pending = printOrders.filter(
  //   (order) => order.status === "PENDING"
  // ).length;

  // Gửi số lượng lỗi ra ngoài qua callback mỗi khi thay đổi
  // React.useEffect(() => {
  //   if (typeof onTotalFailedChange === "function") {
  //     onTotalFailedChange(totalFailed);
  //   }
  // }, [totalFailed, onTotalFailedChange]);

  if (!isOpen) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={headerStyle}>
          <h2>🖨️ Trung tâm quản lý in</h2>
          <button style={closeButtonStyle} onClick={onClose}>
            ✕
          </button>
        </div>
        {/* Tabs */}
        <div style={{ display: "flex", marginLeft: 10, marginTop: 10 }}>
          <button
            onClick={() => setActiveTab("monitor")}
            style={{
              padding: "10px 12px",
              borderRadius: 20,
              border: activeTab === "monitor" ? "none" : "2px solid #007bff",
              background: activeTab === "monitor" ? "#007bff" : "#fff",
              color: activeTab === "monitor" ? "#fff" : "#007bff",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              boxShadow:
                activeTab === "monitor"
                  ? "0 2px 8px rgba(0,123,255,0.08)"
                  : "none",
              transition: "all 0.2s",
              outline: "none",
              marginRight: 4,
            }}
            onMouseOver={(e) => {
              if (activeTab !== "monitor")
                e.currentTarget.style.background = "#e6f0ff";
            }}
            onMouseOut={(e) => {
              if (activeTab !== "monitor")
                e.currentTarget.style.background = "#fff";
            }}
          >
            Lịch sử in đơn
          </button>
          <button
            onClick={() => setActiveTab("printer")}
            style={{
              padding: "10px 12px",
              borderRadius: 20,
              border: activeTab === "printer" ? "none" : "2px solid #007bff",
              background: activeTab === "printer" ? "#007bff" : "#fff",
              color: activeTab === "printer" ? "#fff" : "#007bff",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              boxShadow:
                activeTab === "printer"
                  ? "0 2px 8px rgba(0,123,255,0.08)"
                  : "none",
              transition: "all 0.2s",
              outline: "none",
            }}
            onMouseOver={(e) => {
              if (activeTab !== "printer")
                e.currentTarget.style.background = "#e6f0ff";
            }}
            onMouseOut={(e) => {
              if (activeTab !== "printer")
                e.currentTarget.style.background = "#fff";
            }}
          >
            Quản lý máy in
          </button>
        </div>
        {/* Tab content */}
        {activeTab === "monitor" ? (
          <>
            <div style={controlsStyle}>
              <Select
                value={filter.status || "ALL"}
                onChange={(value) => handleFilterChange("status", value)}
                style={{ minWidth: 120, textAlign: "left" }}
                dropdownStyle={{ textAlign: "left" }}
              >
                <Select.Option value="ALL">Tất cả</Select.Option>
                <Select.Option value="FAILED">Lỗi</Select.Option>
                <Select.Option value="SUCCESS">Thành công</Select.Option>
                <Select.Option value="PENDING">Đang chờ</Select.Option>
              </Select>
              {/* Select máy in */}
              <Select
                showSearch
                allowClear
                value={filter.maMay || undefined}
                onChange={(value) => handleFilterChange("maMay", value || "")}
                placeholder="Tất cả máy in"
                style={{ minWidth: 180, textAlign: "left" }}
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.children || "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                dropdownStyle={{ textAlign: "left" }}
              >
                <Select.Option value="">Tất cả máy in</Select.Option>
                {printerList.map((printer) => (
                  <Select.Option
                    key={printer.ma_may}
                    value={printer.ma_may.trim()}
                  >
                    {printer.ten_may}
                  </Select.Option>
                ))}
              </Select>
              <DatePicker
                value={filter.ngay ? dayjs(filter.ngay) : null}
                onChange={(date) =>
                  handleFilterChange(
                    "ngay",
                    date ? date.format("YYYY-MM-DD") : ""
                  )
                }
                format="DD/MM/YYYY"
                style={{ minWidth: 150, textAlign: "left" }}
                placeholder="Chọn ngày"
                allowClear
              />
              <button onClick={handleSearch} style={exportButtonStyle}>
                🔍 Tìm kiếm
              </button>
            </div>
            {retryMessage && (
              <div
                style={{
                  color: retryMessage.includes("thành công")
                    ? "#28a745"
                    : "#dc3545",
                  margin: 8,
                  fontWeight: 500,
                }}
              >
                {retryMessage}
              </div>
            )}
            {isAnyRetrying && (
              <div
                style={{
                  color: "#007bff",
                  margin: 8,
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span>⏳</span>
                Đang xử lý yêu cầu in lại...
              </div>
            )}
            <div style={{ ...logsContainerStyle, minHeight: 300 }}>
              {/* Tổng số đơn in lỗi và đang chờ */}
              <div
                style={{
                  display: "flex",
                  gap: 24,
                  marginBottom: 8,
                  fontWeight: 600,
                  fontSize: 15,
                }}
              >
                <span>
                  Tổng lỗi (total_failed):{" "}
                  <span style={{ color: "#dc3545" }}>{totalFailed}</span>
                </span>
                <span>
                  Đang chờ (total_pending):{" "}
                  <span style={{ color: "#ffc107" }}>{totalPending}</span>
                </span>
              </div>
              {printOrdersLoading ? (
                <div style={loadingStyle}>Đang tải dữ liệu in đơn...</div>
              ) : printOrders.length === 0 ? (
                <div style={emptyStyle}>Không có in đơn nào</div>
              ) : (
                <>
                  {printOrders.map((order) => (
                    <div
                      key={order.id}
                      style={{
                        ...logItemStyle,
                        borderLeftColor:
                          order.status === "FAILED"
                            ? "#dc3545"
                            : order.status === "SUCCESS"
                            ? "#28a745"
                            : "#ffc107",
                      }}
                    >
                      <div style={logHeaderStyle}>
                        <span style={logTypeStyle}>
                          🖨️ {order.status || ""}
                        </span>
                        {order.status && (
                          <span
                            style={{
                              ...logStatusStyle,
                              backgroundColor:
                                order.status === "FAILED"
                                  ? "#f8d7da"
                                  : order.status === "SUCCESS"
                                  ? "#d4edda"
                                  : "#fff3cd",
                              color:
                                order.status === "FAILED"
                                  ? "#721c24"
                                  : order.status === "SUCCESS"
                                  ? "#155724"
                                  : "#856404",
                            }}
                          >
                            {order.status}
                          </span>
                        )}
                        <span style={logTimeStyle}>
                          {order.datetime2
                            ? formatTimestamp(order.datetime2)
                            : ""}
                        </span>
                        {order.status === "FAILED" && (
                          <button
                            onClick={() => handleRetry(order)}
                            disabled={retryingId === order.id || isAnyRetrying}
                            style={{
                              marginLeft: 16,
                              padding: "6px 16px",
                              borderRadius: 6,
                              border: "none",
                              background:
                                retryingId === order.id || isAnyRetrying
                                  ? "#ccc"
                                  : "#007bff",
                              color: "white",
                              fontWeight: 500,
                              cursor:
                                retryingId === order.id || isAnyRetrying
                                  ? "not-allowed"
                                  : "pointer",
                              fontSize: 14,
                              transition: "all 0.2s ease",
                              opacity:
                                retryingId === order.id || isAnyRetrying
                                  ? 0.7
                                  : 1,
                            }}
                          >
                            {retryingId === order.id ? (
                              <>
                                <span style={{ marginRight: "4px" }}>⏳</span>
                                Đang in lại...
                              </>
                            ) : (
                              "In lại"
                            )}
                          </button>
                        )}
                      </div>
                      <div style={logDetailStyle}>
                        <div style={{ textAlign: "left" }}>
                          <strong>Mã in:</strong> {order.id || ""}
                        </div>
                        <div style={{ textAlign: "left" }}>
                          <strong>STT REC:</strong> {order.stt_rec || ""}
                        </div>
                        <div style={{ textAlign: "left" }}>
                          <strong>Số chứng từ:</strong>{" "}
                          {order.so_ct ? order.so_ct.trim() : ""}
                        </div>
                        <div style={{ textAlign: "left" }}>
                          <strong>Tên máy:</strong> {order.ten_may || ""}
                        </div>
                        <div style={{ textAlign: "left" }}>
                          <strong>IP máy in:</strong> {order.ip_print || ""}
                        </div>

                        <div style={{ textAlign: "left" }}>
                          <strong>Lỗi in:</strong> {order.error_message || ""}
                        </div>

                        <div style={{ textAlign: "left" }}>
                          <strong>Tạo lúc:</strong>{" "}
                          {order.datetime0
                            ? formatTimestamp(order.datetime0)
                            : ""}
                        </div>
                        <div style={{ textAlign: "left" }}>
                          <strong>Cập nhật lúc:</strong>{" "}
                          {order.datetime2
                            ? formatTimestamp(order.datetime2)
                            : ""}
                        </div>
                        <div style={{ textAlign: "left" }}>
                          <strong>Người tạo:</strong> {order.user_id0 ?? ""}
                        </div>
                        <div style={{ textAlign: "left" }}>
                          <strong>Người cập nhật:</strong>{" "}
                          {order.user_id2 ?? ""}
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Pagination */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      marginTop: 16,
                      gap: 16,
                    }}
                  >
                    <button
                      onClick={() =>
                        handlePageChange(Math.max(1, filter.pageIndex - 1))
                      }
                      disabled={filter.pageIndex === 1}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 6,
                        border: "1px solid #ccc",
                        background: filter.pageIndex === 1 ? "#eee" : "#fff",
                        cursor:
                          filter.pageIndex === 1 ? "not-allowed" : "pointer",
                      }}
                    >
                      Trang trước
                    </button>
                    <span>
                      Trang <b>{filter.pageIndex}</b> /{" "}
                      <b>{filter.totalPage}</b> (Tổng:{" "}
                      <b>{filter.totalRecord}</b> bản ghi)
                    </span>
                    <button
                      onClick={() =>
                        handlePageChange(
                          Math.min(filter.totalPage, filter.pageIndex + 1)
                        )
                      }
                      disabled={filter.pageIndex === filter.totalPage}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 6,
                        border: "1px solid #ccc",
                        background:
                          filter.pageIndex === filter.totalPage
                            ? "#eee"
                            : "#fff",
                        cursor:
                          filter.pageIndex === filter.totalPage
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      Trang sau
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          // Tab cài đặt máy in
          <div style={{ padding: 16 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8f9fa" }}>
                  <th style={{ border: "1px solid #e1e5e9", padding: 8 }}>
                    Mã máy
                  </th>
                  <th style={{ border: "1px solid #e1e5e9", padding: 8 }}>
                    Tên máy
                  </th>
                  <th style={{ border: "1px solid #e1e5e9", padding: 8 }}>
                    IP Address
                  </th>
                  <th style={{ border: "1px solid #e1e5e9", padding: 8 }}>
                    Trạng thái
                  </th>
                  <th style={{ border: "1px solid #e1e5e9", padding: 8 }}>
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {printerLoading ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{ textAlign: "center", padding: 24 }}
                    >
                      Đang tải...
                    </td>
                  </tr>
                ) : printerError ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        textAlign: "center",
                        color: "#dc3545",
                        padding: 24,
                      }}
                    >
                      {printerError}
                    </td>
                  </tr>
                ) : printers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{ textAlign: "center", padding: 24 }}
                    >
                      Không có máy in nào
                    </td>
                  </tr>
                ) : (
                  printers.map((printer, idx) => (
                    <tr key={printer.id}>
                      <td style={{ border: "1px solid #e1e5e9", padding: 8 }}>
                        {printer.ma_may}
                      </td>
                      <td style={{ border: "1px solid #e1e5e9", padding: 8 }}>
                        {printer.ten_may}
                      </td>
                      <td style={{ border: "1px solid #e1e5e9", padding: 8 }}>
                        {printer.IpAddress}
                      </td>
                      <td
                        style={{
                          padding: "10px 8px",
                          borderBottom: "1px solid #e1e5e9",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            padding: "4px 12px",
                            borderRadius: 12,
                            background:
                              printer.status === "1"
                                ? "#e6f4ea"
                                : printer.status === "2"
                                ? "#fff3cd"
                                : "#f1f1f1",
                            color:
                              printer.status === "1"
                                ? "#28a745"
                                : printer.status === "2"
                                ? "#856404"
                                : "#888",
                            fontWeight: 600,
                            fontSize: 13,
                          }}
                        >
                          {printer.status === "1"
                            ? "Đang sử dụng"
                            : printer.status === "2"
                            ? "Ngưng sử dụng"
                            : ""}
                        </span>
                      </td>
                      <td style={{ border: "1px solid #e1e5e9", padding: 8 }}>
                        <button
                          onClick={() => handleEditPrinter(printer)}
                          style={{
                            padding: "4px 12px",
                            borderRadius: 6,
                            border: "none",
                            background: "#ffc107",
                            color: "#333",
                            fontWeight: 500,
                            cursor: "pointer",
                          }}
                        >
                          Sửa
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {/* Modal sửa máy in */}
            {editModalOpen && (
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: "rgba(0,0,0,0.18)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 2000,
                }}
              >
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 16,
                    padding: 32,
                    minWidth: 350,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                    maxWidth: 400,
                  }}
                >
                  <div style={{ textAlign: "center", marginBottom: 24 }}>
                    <span
                      style={{
                        fontSize: 22,
                        fontWeight: 700,
                        color: "#007bff",
                        letterSpacing: 0.5,
                      }}
                    >
                      Cập nhật máy in
                    </span>
                  </div>
                  <div style={{ marginBottom: 16, textAlign: "left" }}>
                    <label
                      style={{
                        fontWeight: 500,
                        display: "block",
                        marginBottom: 6,
                      }}
                    >
                      Tên máy:
                    </label>
                    <Input
                      value={editPrinter.ten_may}
                      onChange={(e) =>
                        setEditPrinter({
                          ...editPrinter,
                          ten_may: e.target.value,
                        })
                      }
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div style={{ marginBottom: 16, textAlign: "left" }}>
                    <label
                      style={{
                        fontWeight: 500,
                        display: "block",
                        marginBottom: 6,
                      }}
                    >
                      IP Address:
                    </label>
                    <Input
                      value={editPrinter.IpAddress}
                      onChange={(e) =>
                        setEditPrinter({
                          ...editPrinter,
                          IpAddress: e.target.value,
                        })
                      }
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div style={{ marginBottom: 24, textAlign: "left" }}>
                    <label
                      style={{
                        fontWeight: 500,
                        display: "block",
                        marginBottom: 6,
                      }}
                    >
                      Trạng thái:
                    </label>
                    <Select
                      value={editPrinter.status}
                      onChange={(value) =>
                        setEditPrinter({ ...editPrinter, status: value })
                      }
                      style={{ width: "100%" }}
                      options={[
                        { value: "1", label: "Đang sử dụng" },
                        { value: "2", label: "Ngưng sử dụng" },
                      ]}
                    />
                  </div>
                  {printerEditError && (
                    <div
                      style={{
                        color: "#dc3545",
                        marginBottom: 10,
                        textAlign: "center",
                      }}
                    >
                      {printerEditError}
                    </div>
                  )}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: 10,
                    }}
                  >
                    <button
                      onClick={() => setEditModalOpen(false)}
                      style={{
                        padding: "10px 24px",
                        borderRadius: 8,
                        border: "none",
                        background: "#eee",
                        color: "#333",
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleSavePrinter}
                      disabled={printerEditLoading}
                      style={{
                        padding: "10px 24px",
                        borderRadius: 8,
                        border: "none",
                        background: printerEditLoading ? "#ccc" : "#007bff",
                        color: "#fff",
                        fontWeight: 600,
                        cursor: printerEditLoading ? "not-allowed" : "pointer",
                      }}
                    >
                      {printerEditLoading ? "Đang lưu..." : "Lưu"}
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                marginTop: 16,
                gap: 16,
              }}
            >
              <button
                onClick={() =>
                  handlePrinterPageChange(
                    Math.max(1, printerFilter.pageIndex - 1)
                  )
                }
                disabled={printerFilter.pageIndex === 1}
                style={{
                  padding: "8px 16px",
                  borderRadius: 6,
                  border: "1px solid #ccc",
                  background: printerFilter.pageIndex === 1 ? "#eee" : "#fff",
                  cursor:
                    printerFilter.pageIndex === 1 ? "not-allowed" : "pointer",
                }}
              >
                Trang trước
              </button>
              <span>
                Trang <b>{printerFilter.pageIndex}</b> /{" "}
                <b>{printerFilter.totalPage}</b> (Tổng:{" "}
                <b>{printerFilter.totalRecord}</b> máy in)
              </span>
              <button
                onClick={() =>
                  handlePrinterPageChange(
                    Math.min(
                      printerFilter.totalPage,
                      printerFilter.pageIndex + 1
                    )
                  )
                }
                disabled={printerFilter.pageIndex === printerFilter.totalPage}
                style={{
                  padding: "8px 16px",
                  borderRadius: 6,
                  border: "1px solid #ccc",
                  background:
                    printerFilter.pageIndex === printerFilter.totalPage
                      ? "#eee"
                      : "#fff",
                  cursor:
                    printerFilter.pageIndex === printerFilter.totalPage
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                Trang sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Inline styles
const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.6)",
  zIndex: 1000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backdropFilter: "blur(2px)",
};

const modalStyle = {
  backgroundColor: "white",
  borderRadius: "12px",
  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
  width: "80vw",
  height: "80vh",
  maxWidth: "1000px",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  border: "1px solid #e1e5e9",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "1rem",
  borderBottom: "1px solid #e1e5e9",
  backgroundColor: "#f8f9fa",
  borderRadius: "12px 12px 0 0",
};

const closeButtonStyle = {
  background: "#ff4757",
  color: "white",
  border: "none",
  borderRadius: "50%",
  width: "32px",
  height: "32px",
  cursor: "pointer",
  fontSize: "16px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.2s ease",
};

const controlsStyle = {
  display: "flex",
  gap: "1rem",
  padding: "1.5rem",
  borderBottom: "1px solid #e1e5e9",
  alignItems: "center",
  flexWrap: "wrap",
  justifyContent: "flex-start", // Thêm dòng này để căn trái
};

const selectStyle = {
  padding: "0.75rem",
  border: "1px solid #dee2e6",
  borderRadius: "8px",
  fontSize: "0.875rem",
  minWidth: "120px",
  backgroundColor: "white",
  transition: "all 0.2s ease",
};

const exportButtonStyle = {
  padding: "0.75rem 1.5rem",
  backgroundColor: "#007bff",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "0.875rem",
  fontWeight: "500",
  transition: "all 0.2s ease",
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
};

const logsContainerStyle = {
  flex: 1,
  overflow: "auto",
  padding: "1.5rem",
  backgroundColor: "#f8f9fa",
};

const loadingStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100%",
  fontSize: "1.125rem",
  color: "#6c757d",
};

const emptyStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100%",
  fontSize: "1.125rem",
  color: "#adb5bd",
  fontStyle: "italic",
};

const logItemStyle = {
  border: "1px solid #e1e5e9",
  borderLeft: "4px solid #007bff",
  borderRadius: "8px",
  padding: "1.5rem",
  marginBottom: "1rem",
  backgroundColor: "white",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
  transition: "all 0.2s ease",
};

const logHeaderStyle = {
  display: "flex",
  alignItems: "center",
  gap: "1rem",
  marginBottom: "1rem",
  flexWrap: "wrap",
};

const logTypeStyle = {
  fontWeight: "600",
  fontSize: "0.875rem",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const logStatusStyle = {
  padding: "0.375rem 0.75rem",
  borderRadius: "20px",
  fontSize: "0.75rem",
  fontWeight: "600",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const logTimeStyle = {
  color: "#6c757d",
  fontSize: "0.875rem",
  marginLeft: "auto",
  fontWeight: "500",
};

const logDetailStyle = {
  fontSize: "0.875rem",
  lineHeight: "1.6",
  textAlign: "left",
};

export default SyncFastLogViewer;
