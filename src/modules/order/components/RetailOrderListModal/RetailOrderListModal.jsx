import {
  CheckOutlined,
  EditOutlined,
  LoadingOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import {
  Button,
  DatePicker,
  Input,
  Modal,
  notification,
  Select,
  Space,
  Spin,
  Table,
  Tag,
} from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useReactToPrint } from "react-to-print";
import { multipleTablePutApi } from "../../../../api";
import showConfirm from "../../../../components/common/Modal/ModalConfirm";
import IminPrinterService from "../../../../utils/IminPrinterService";
import jwt from "../../../../utils/jwt";
import { addTab, setListOrderInfo, switchTab } from "../../store/order";
import "../OrderSummary/PaymentModal/PaymentModal.css";
import ReceiptPreviewModal from "../OrderSummary/ReceiptPreviewModal/ReceiptPreviewModal";
import PrintComponent from "./PrintComponent/PrintComponent";
import "./RetailOrderListModal.css";

const RetailOrderListModal = ({ isOpen, onClose }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20; // Cố định pageSize = 20
  const [totalRecords, setTotalRecords] = useState(0);
  const [allData, setAllData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  // Define stable empty object to prevent unnecessary re-renders
  const EMPTY_FILTERS = {};
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  // Create stable filters object to prevent unnecessary API calls
  const stableFilters = useMemo(() => filters, [JSON.stringify(filters)]);
  const dispatch = useDispatch();

  const { id, storeId, unitId, unitName } = useSelector(
    (state) => state.claimsReducer.userInfo || {}
  );
  const tabs = useSelector((state) => state.orders.orders);
  const [printMaster, setPrintMaster] = useState({});
  const [printDetail, setPrintDetail] = useState([]);
  const printContent = useRef();
  const lastApiCall = useRef({ pageIndex: 0, filters: {} });

  const rawToken = localStorage.getItem("access_token");
  const claims =
    rawToken && rawToken.split(".").length === 3 ? jwt.getClaims?.() || {} : {};
  const fullName = claims?.FullName;

  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [reprintingSttRec, setReprintingSttRec] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewMaster, setPreviewMaster] = useState({});
  const [previewDetailFlat, setPreviewDetailFlat] = useState([]);
  const [previewDetailGrouped, setPreviewDetailGrouped] = useState([]);
  const [previewOrderNumber, setPreviewOrderNumber] = useState("");
  const [confirmPrintLoading, setConfirmPrintLoading] = useState(false);

  const fetchListOrderData = useCallback(
    async (pageIndex = currentPage, customFilters = null) => {
      if (!isOpen || isLoading) return; // Chỉ gọi API khi modal đang mở và không đang loading

      // Sử dụng customFilters nếu được truyền vào, ngược lại sử dụng stableFilters
      const filtersToUse = customFilters || stableFilters;

      // Kiểm tra xem có phải duplicate call không
      const currentCall = { pageIndex, filters: filtersToUse };
      if (
        lastApiCall.current.pageIndex === pageIndex &&
        JSON.stringify(lastApiCall.current.filters) ===
          JSON.stringify(filtersToUse)
      ) {
        return; // Bỏ qua nếu là duplicate call
      }
      lastApiCall.current = currentCall;

      setIsLoading(true);
      try {
        const res = await multipleTablePutApi({
          store: "api_get_retail_order",
          param: {
            so_ct: filtersToUse.so_ct || "",
            ngay_ct: filtersToUse.ngay_ct || "",
            ma_kh: filtersToUse.ma_kh || "",
            status: filtersToUse.status || "",
            ma_ban: filtersToUse.ma_ban || "",
            s2: filtersToUse.s2 || "",
            s3: filtersToUse.s3 || "",
            pageIndex: pageIndex,
            pageSize: pageSize,
            userId: id,
            unitId: unitId,
            storeId: storeId,
            ma_gd: "2", // 2 = đơn POS
          },
          data: {},
        });

        const updatedData = Array.isArray(res?.listObject[0])
          ? res.listObject[0]
          : [];
        const paginationInfo = res?.listObject[2]?.[0] || {};
        const totalRecords = paginationInfo.totalRecord || updatedData.length;

        setAllData(updatedData);
        setTotalRecords(totalRecords);
        dispatch(setListOrderInfo(updatedData));
      } catch (err) {
        console.error("Lỗi khi lấy danh sách đơn hàng:", err);
        notification.error({
          message: "Lỗi khi tải danh sách đơn hàng",
          duration: 4,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [stableFilters, id, unitId, storeId, dispatch, isOpen, isLoading]
  );

  useEffect(() => {
    if (isOpen) {
      fetchListOrderData(1, filters);
    } else {
      // Reset state khi đóng modal
      setCurrentPage(1);
      setFilters(EMPTY_FILTERS);
      setAllData([]);
      setTotalRecords(0);
      lastApiCall.current = { pageIndex: 0, filters: {} };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Sử dụng data trực tiếp từ API (backend pagination)
  const currentData = allData;

  // Helper function để xử lý filter
  const handleFilter = (key, value, confirm) => {
    confirm();
    let filterValue = value;

    // Xử lý đặc biệt cho trường s2
    if (key === "s2") {
      if (value === "Synchronize     ") {
        filterValue = "Synchronize     "; // Lọc thành công
      } else if (value === "*") {
        filterValue = "*"; // Lọc thất bại
      } else {
        filterValue = ""; // Lấy tất cả data (khi không chọn gì)
      }
    }

    const newFilters = { ...filters, [key]: filterValue };
    setFilters(newFilters);
    setCurrentPage(1); // Reset về trang 1 khi filter
    // Gọi API ngay lập tức khi filter thay đổi với pageIndex = 1 và truyền filters mới
    fetchListOrderData(1, newFilters);
  };

  // Helper function để xử lý thay đổi trang
  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Gọi API ngay lập tức khi thay đổi trang với pageIndex mới và filters hiện tại
    fetchListOrderData(page, filters);
  };

  // Helper function để group detail data
  const groupDetailData = (flatDetailData, useUniqueId = true) => {
    const groupedDetailData = [];

    // Add parent items first
    flatDetailData.forEach((item) => {
      const { ma_vt_root } = item;
      if (!ma_vt_root) {
        groupedDetailData.push({ ...item, extras: [] });
      }
    });

    // Add child items to their parents
    flatDetailData.forEach((item) => {
      const { ma_vt_root, uniqueid, ma_vt } = item;
      if (ma_vt_root) {
        const parent = groupedDetailData.find((p) =>
          useUniqueId ? p.uniqueid === uniqueid : p.ma_vt === ma_vt_root
        );
        if (parent) {
          parent.extras = parent.extras || [];
          parent.extras.push(item);
        }
      }
    });

    return groupedDetailData;
  };

  // Helper function để fetch order detail
  const fetchOrderDetail = async (stt_rec) => {
    const res = await multipleTablePutApi({
      store: "api_get_data_detail_retail_order",
      param: { stt_rec },
      data: {},
    });

    if (res?.responseModel?.isSucceded) {
      const masterData = res?.listObject[0]?.[0] || {};
      const flatDetailData = res?.listObject[1] || [];
      return { masterData, flatDetailData };
    }
    throw new Error(
      res?.responseModel?.message || "Lỗi khi tải chi tiết đơn hàng"
    );
  };

  const columns = [
    {
      title: "STT",
      dataIndex: "stt",
      key: "stt",
      render: (_, __, index) => (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: "Nhân viên",
      dataIndex: "username",
      key: "username",
    },
    {
      title: () => (
        <div className="column-title-with-tag">
          Số chứng từ {filters.so_ct && <Tag color="blue">{filters.so_ct}</Tag>}
        </div>
      ),
      dataIndex: "so_ct",
      key: "so_ct",
      width: 200,
      filterDropdown: ({ setSelectedKeys, selectedKeys = [], confirm }) => {
        const currentValue = selectedKeys?.[0] || "";
        return (
          <div className="retail-order_filterDropdown">
            <Space direction="vertical" size={8} style={{ width: "100%" }}>
              <Input
                allowClear
                placeholder="Tìm kiếm Số CT"
                value={currentValue}
                onChange={(e) => {
                  const { value } = e.target;
                  setSelectedKeys(value ? [value] : []);
                }}
                onPressEnter={() =>
                  handleFilter("so_ct", currentValue, confirm)
                }
              />
              <div className="retail-order_filterActions">
                <Button
                  type="primary"
                  size="small"
                  onClick={() =>
                    handleFilter("so_ct", currentValue, confirm)
                  }
                >
                  Tìm kiếm
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    setSelectedKeys([]);
                    handleFilter("so_ct", "", confirm);
                  }}
                >
                  Làm mới
                </Button>
              </div>
            </Space>
          </div>
        );
      },
    },
    {
      title: "Ngày CT",
      dataIndex: "ngay_ct",
      key: "ngay_ct",
      width: 200,
      filterDropdown: ({ setSelectedKeys, selectedKeys = [], confirm }) => {
        const currentValue = selectedKeys?.[0] || "";
        return (
          <div className="retail-order_filterDropdown">
            <Space direction="vertical" size={8} style={{ width: "100%" }}>
              <DatePicker
                inputReadOnly
                format="DD/MM/YYYY"
                placeholder="Chọn ngày CT"
                style={{ width: "100%" }}
                onChange={(date) => {
                  const formatted = date ? date.format("DD/MM/YYYY") : "";
                  setSelectedKeys(formatted ? [formatted] : []);
                }}
              />
              <div className="retail-order_filterActions">
                <Button
                  type="primary"
                  size="small"
                  onClick={() =>
                    handleFilter("ngay_ct", currentValue, confirm)
                  }
                >
                  Tìm kiếm
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    setSelectedKeys([]);
                    handleFilter("ngay_ct", "", confirm);
                  }}
                >
                  Làm mới
                </Button>
              </div>
            </Space>
          </div>
        );
      },
    },
    {
      title: "Tổng tiền",
      dataIndex: "t_tt",
      key: "t_tt",
      render: (value) => `${value?.toLocaleString() || 0} VND`,
    },
    {
      title: "Trạng thái",
      dataIndex: "statusName",
      key: "statusName",
      align: "center",
      render: (text) => (
        <Tag color={text === "Hoàn thành" ? "green" : "yellow"}>{text}</Tag>
      ),
      filterDropdown: ({ setSelectedKeys, selectedKeys = [], confirm }) => {
        const currentValue = selectedKeys?.[0] || undefined;
        return (
          <div className="retail-order_filterDropdown">
            <Space direction="vertical" size={8} style={{ width: "100%" }}>
              <Select
                allowClear
                placeholder="Chọn trạng thái"
                value={currentValue}
                onChange={(value) => setSelectedKeys(value ? [value] : [])}
              >
                <Select.Option value="2">Hoàn thành</Select.Option>
                <Select.Option value="0">Chưa hoàn thành</Select.Option>
              </Select>
              <div className="retail-order_filterActions">
                <Button
                  type="primary"
                  size="small"
                  onClick={() =>
                    handleFilter("status", currentValue || "", confirm)
                  }
                >
                  Tìm kiếm
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    setSelectedKeys([]);
                    handleFilter("status", "", confirm);
                  }}
                >
                  Làm mới
                </Button>
              </div>
            </Space>
          </div>
        );
      },
    },
    {
      title: "Chức năng",
      key: "action",
      render: (_, record) => (
        <div className="action-buttons">
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            type="danger"
            size="small"
            className="edit_button"
            disabled={isEditingOrder || record.status === "2"}
          />
          <Button
            icon={reprintingSttRec === record.stt_rec ? <LoadingOutlined spin /> : <PrinterOutlined />}
            onClick={() => handleReprint(record)}
            size="small"
            type="primary"
            className="print_button"
            disabled={
              reprintingSttRec != null ||
              (record.status !== "2" && record.status !== 2)
            }
            title={
              record.status !== "2" && record.status !== 2
                ? "Chỉ in lại đơn đã hoàn thành"
                : "In lại"
            }
          />
          <Button
            icon={<CheckOutlined />}
            onClick={() => handleApprove(record)}
            size="small"
            type="primary"
            className="approve_button"
            disabled={record.status !== "0"}
          />
        </div>
      ),
    },
  ];

  const handleEdit = async (record) => {
    if (isEditingOrder) return;
    setIsEditingOrder(true);
    try {
      const existingTab = tabs.some(
        (tab) => tab.master.stt_rec === record.stt_rec
      );
      if (existingTab) {
        notification.error({
          message: "Tab đã tồn tại!",
          duration: 3,
        });
        setIsEditingOrder(false);
        return;
      }

      const { masterData, flatDetailData } = await fetchOrderDetail(
        record.stt_rec
      );
      const detailData = groupDetailData(flatDetailData, true);

      // Merge masterData với record để đảm bảo có đủ thông tin khách hàng
      const mergedMasterData = {
        ...masterData,
        // Fallback từ record nếu masterData không có
        ten_kh: masterData.ten_kh || record.ten_kh,
        ong_ba: masterData.ong_ba || record.ong_ba,
        ma_kh: masterData.ma_kh || record.ma_kh,
        cccd: masterData.cccd || record.cccd,
        so_dt: masterData.so_dt || record.so_dt,
        dia_chi: masterData.dia_chi || record.dia_chi,
        email: masterData.email || record.email,
        ma_so_thue_kh: masterData.ma_so_thue_kh || record.ma_so_thue_kh,
        ten_dv_kh: masterData.ten_dv_kh || record.ten_dv_kh,
        so_giuong: masterData.so_giuong || record.so_giuong || "",
        so_phong: masterData.so_phong || record.so_phong || "",
        ca_an: masterData.ca_an || record.ca_an || "",
        thutien_yn: masterData.thutien_yn || record.thutien_yn || "",
        // Các trường mới từ API
        cookie_voucher: masterData.cookie_voucher || "",
        kh_ts_yn: masterData.kh_ts_yn || "0",
        xuat_hoa_don_yn: masterData.xuat_hoa_don_yn || "0",
        cong_no: masterData.cong_no || "0",
        ma_nvbh: masterData.ma_nvbh || "",
      };

      const tableData = {
        name: mergedMasterData.ma_ban,
        id: mergedMasterData.ma_ban,
      };

      const internalId = `${tableData.id}_${Date.now()}`;
      dispatch(
        addTab({
          tableName: tableData.name,
          tableId: tableData.id,
          isRealtime: false,
          internalId,
          master: mergedMasterData,
          detail: detailData,
        })
      );
      dispatch(switchTab(internalId));
      onClose();
    } catch (err) {
      console.error("Lỗi khi gọi API chi tiết đơn hàng:", err);
      notification.error({
        message: "Lỗi khi tải chi tiết đơn hàng",
        duration: 4,
      });
    } finally {
      setIsEditingOrder(false);
    }
  };

  const handleReprint = async (record) => {
    if (record.status !== "2" && record.status !== 2) {
      notification.warning({
        message: "Không thể in lại",
        description: "Chỉ in lại đơn đã hoàn thành.",
        duration: 3,
      });
      return;
    }
    try {
      const { masterData, flatDetailData } = await fetchOrderDetail(
        record.stt_rec
      );
      const groupedDetailData = groupDetailData(flatDetailData, true);

      const mergedMasterData = {
        ...masterData,
        ten_kh: masterData.ten_kh || record.ten_kh || "",
        ong_ba: masterData.ong_ba || record.ong_ba || "",
        ma_kh: masterData.ma_kh || record.ma_kh || "",
        cccd: masterData.cccd || record.cccd || "",
        so_dt: masterData.so_dt || record.so_dt || "",
        dia_chi: masterData.dia_chi || record.dia_chi || "",
        email: masterData.email || record.email || "",
        ma_so_thue_kh: masterData.ma_so_thue_kh || record.ma_so_thue_kh || "",
        ten_dv_kh: masterData.ten_dv_kh || record.ten_dv_kh || "",
        so_the: masterData.so_the || record.so_the || "",
        so_giuong: masterData.so_giuong || record.so_giuong || "",
        so_phong: masterData.so_phong || record.so_phong || "",
        ca_an: masterData.ca_an || record.ca_an || "",
        thutien_yn: masterData.thutien_yn !== undefined ? masterData.thutien_yn : (record.thutien_yn || false),
        cookie_voucher: masterData.cookie_voucher || "",
        kh_ts_yn: masterData.kh_ts_yn !== undefined ? masterData.kh_ts_yn : false,
        xuat_hoa_don_yn: masterData.xuat_hoa_don_yn !== undefined ? masterData.xuat_hoa_don_yn : false,
        cong_no: masterData.cong_no || 0,
        ma_nvbh: masterData.ma_nvbh ? masterData.ma_nvbh.trim() : "",
        ten_nvbh: masterData.ten_nvbh ? masterData.ten_nvbh.trim() : "",
        so_ct: masterData.so_ct ? masterData.so_ct.trim() : (record.so_ct || ""),
        username: masterData.username ? masterData.username.trim() : (record.username ? record.username.trim() : ""),
        ma_ban: masterData.ma_ban || record.ma_ban || "",
        httt: masterData.httt || record.httt || "tien_mat",
        tong_tien: masterData.tong_tien || masterData.tong_tt || 0,
        tong_tt: masterData.tong_tt || masterData.tong_tien || 0,
        tien_mat: masterData.tien_mat || 0,
        chuyen_khoan: masterData.chuyen_khoan || 0,
        tong_sl: masterData.tong_sl || 0,
        datetime2: masterData.datetime2 || masterData.datetime2 || new Date().toISOString(),
        ngay_ct: masterData.ngay_ct || record.ngay_ct || "",
        status: masterData.status || record.status || "",
        ten_dvcs: masterData.ten_dvcs || record.ten_dvcs || unitName || "",
      };

      setPreviewMaster(mergedMasterData);
      setPreviewDetailFlat(flatDetailData);
      setPreviewDetailGrouped(groupedDetailData);
      setPreviewOrderNumber(mergedMasterData.so_ct || record.so_ct || "");
      setPreviewVisible(true);
    } catch (error) {
      console.error("Lỗi khi tải đơn hàng để in lại:", error);
      notification.error({
        message: "Lỗi khi tải đơn hàng",
        description: error?.message || "Vui lòng thử lại.",
        duration: 4,
      });
    }
  };

  const handleConfirmPreviewPrint = async () => {
    setConfirmPrintLoading(true);
    let usedSimulation = false;
    try {
      const printerService = new IminPrinterService();
      await printerService.initPrinter();

      if (!printerService.isSimulationMode) {
        await printerService.printReceipt(
          previewMaster,
          previewDetailFlat,
          1,
          { isReprint: true }
        );
        notification.success({
          message: "In lại hóa đơn",
          description: `Đã in lại hóa đơn ${previewOrderNumber} bằng máy in nhiệt.`,
          duration: 3,
        });
        setPreviewVisible(false);
      } else {
        usedSimulation = true;
        setPrintMaster(previewMaster);
        setPrintDetail(previewDetailGrouped);
        setPreviewVisible(false);
        setTimeout(() => handlePrint(), 300);
        notification.info({
          message: "In lại hóa đơn",
          description: "Chế độ simulation - in qua trình duyệt.",
          duration: 3,
        });
      }
    } catch (error) {
      console.error("Lỗi khi in lại hóa đơn:", error);
      notification.error({
        message: "Lỗi khi in lại hóa đơn",
        description: error?.message || "Vui lòng kiểm tra máy in.",
        duration: 4,
      });
    } finally {
      setConfirmPrintLoading(false);
      if (usedSimulation) {
        setReprintingSttRec(null);
      }
    }
  };

  const handleApprove = async (record) => {
    showConfirm({
      title: `Bạn có chắc chắn muốn thanh toán đơn hàng có số chứng từ: ${record.so_ct}?`,
      onOk: async () => {
        if (isEditingOrder) return;
        setIsEditingOrder(true);
        try {
          const existingTab = tabs.some(
            (tab) => tab.master.stt_rec === record.stt_rec
          );
          if (existingTab) {
            notification.error({
              message: "Tab đã tồn tại!",
              duration: 3,
            });
            setIsEditingOrder(false);
            return;
          }
          const { masterData, flatDetailData } = await fetchOrderDetail(
            record.stt_rec
          );
          const detailData = groupDetailData(flatDetailData, true);

          // Merge masterData với record để đảm bảo có đủ thông tin khách hàng
          const mergedMasterData = {
            ...masterData,
            // Fallback từ record nếu masterData không có
            ten_kh: masterData.ten_kh || record.ten_kh,
            ong_ba: masterData.ong_ba || record.ong_ba,
            ma_kh: masterData.ma_kh || record.ma_kh,
            cccd: masterData.cccd || record.cccd,
            so_dt: masterData.so_dt || record.so_dt,
            dia_chi: masterData.dia_chi || record.dia_chi,
            email: masterData.email || record.email,
            ma_so_thue_kh: masterData.ma_so_thue_kh || record.ma_so_thue_kh,
            ten_dv_kh: masterData.ten_dv_kh || record.ten_dv_kh,
            so_giuong: masterData.so_giuong || record.so_giuong || "",
            so_phong: masterData.so_phong || record.so_phong || "",
            ca_an: masterData.ca_an || record.ca_an || "",
            thutien_yn: masterData.thutien_yn || record.thutien_yn || "",
            // Các trường mới từ API
            cookie_voucher: masterData.cookie_voucher || "",
            kh_ts_yn: masterData.kh_ts_yn || "0",
            xuat_hoa_don_yn: masterData.xuat_hoa_don_yn || "0",
            cong_no: masterData.cong_no || "0",
            ma_nvbh: masterData.ma_nvbh || "",
          };

          const tableData = {
            name: mergedMasterData.ma_ban,
            id: mergedMasterData.ma_ban,
          };
          const internalId = `${tableData.id}_${Date.now()}`;
          dispatch(
            addTab({
              tableName: tableData.name,
              tableId: tableData.id,
              isRealtime: false,
              internalId,
              master: mergedMasterData,
              detail: detailData,
              autoOpenPayment: true,
            })
          );
          dispatch(switchTab(internalId));
          onClose();
        } catch (err) {
          notification.error({
            message: "Lỗi khi tải chi tiết đơn hàng hoặc mở tab mới",
            duration: 4,
          });
        } finally {
          setIsEditingOrder(false);
        }
      },
    });
  };

  const handlePrint = useReactToPrint({
    content: () => printContent.current,
    documentTitle: "Print This Document",
    copyStyles: false,
    onAfterPrint: () => setReprintingSttRec(null),
  });

  return (
    <>
      <Modal
        open={isOpen}
        width="95%"
        title="Danh sách đơn hàng"
        destroyOnClose
        onCancel={onClose}
        footer={null}
        centered
      >
        <div className="retail__modal__Container">
          {isLoading ? (
            <Spin size="large" />
          ) : (
            <Table
              dataSource={currentData}
              columns={columns}
              rowKey="stt_rec"
              className="retail-order-table"
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: totalRecords,
                showSizeChanger: false,
                showQuickJumper: false,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} của ${total} đơn hàng`,
                onChange: handlePageChange,
              }}
            />
          )}
        </div>
      </Modal>
      <ReceiptPreviewModal
        visible={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        onConfirm={handleConfirmPreviewPrint}
        master={previewMaster}
        detail={previewDetailFlat}
        orderNumber={previewOrderNumber}
        isReprint={true}
        confirmLoading={confirmPrintLoading}
      />
      <div style={{ display: "none" }}>
        <PrintComponent
          ref={printContent}
          master={printMaster}
          detail={printDetail}
          fullName={fullName}
        />
      </div>
    </>
  );
};

export default RetailOrderListModal;
