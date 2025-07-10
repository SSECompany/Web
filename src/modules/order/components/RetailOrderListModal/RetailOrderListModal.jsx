import {
  CheckOutlined,
  EditOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import {
  Button,
  DatePicker,
  Input,
  Modal,
  notification,
  Select,
  Spin,
  Table,
  Tag,
} from "antd";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useReactToPrint } from "react-to-print";
import { multipleTablePutApi } from "../../../../api";
import showConfirm from "../../../../components/common/Modal/ModalConfirm";
import jwt from "../../../../utils/jwt";
import { addTab, setListOrderInfo, switchTab } from "../../store/order";
import "../OrderSummary/PaymentModal/PaymentModal.css";
import PrintComponent from "./PrintComponent/PrintComponent";
import "./RetailOrderListModal.css";

const RetailOrderListModal = ({ isOpen, onClose }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalRecords, setTotalRecords] = useState(0);
  const [allData, setAllData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({});
  const dispatch = useDispatch();

  const { id, storeId, unitId } = useSelector(
    (state) => state.claimsReducer.userInfo || {}
  );
  const tabs = useSelector((state) => state.orders.orders);
  const [printMaster, setPrintMaster] = useState({});
  const [printDetail, setPrintDetail] = useState([]);
  const printContent = useRef();

  const rawToken = localStorage.getItem("access_token");
  const claims =
    rawToken && rawToken.split(".").length === 3 ? jwt.getClaims?.() || {} : {};
  const fullName = claims?.FullName;

  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [pendingApproveRecord, setPendingApproveRecord] = useState(null);

  const fetchListOrderData = async (filterParams = {}) => {
    setIsLoading(true);
    try {
      const res = await multipleTablePutApi({
        store: "api_get_retail_order",
        param: {
          so_ct: filterParams.so_ct || "",
          ngay_ct: filterParams.ngay_ct || "",
          ma_kh: filterParams.ma_kh || "",
          status: filterParams.status || "",
          ma_ban: filterParams.ma_ban || "",
          s3: filterParams.s3 || "",
          pageIndex: 1,
          pageSize: 1000,
          userId: id,
          unitId: unitId,
          storeId: storeId,
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
  };

  useEffect(() => {
    if (isOpen) {
      fetchListOrderData();
    }
  }, [isOpen]);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = allData.slice(startIndex, endIndex);

  // Helper function để xử lý filter
  const handleFilter = (key, value, confirm) => {
    confirm();
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchListOrderData(newFilters);
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
      render: (_, __, index) => startIndex + index + 1,
    },
    {
      title: "Nhân viên",
      dataIndex: "username",
      key: "username",
    },
    {
      title: () => (
        <div className="column-title-with-tag">
          Mã bàn {filters.ma_ban && <Tag color="blue">{filters.ma_ban}</Tag>}
        </div>
      ),
      dataIndex: "ma_ban",
      key: "ma_ban",
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
        <div className="filter-dropdown">
          <Input
            placeholder="Tìm kiếm Mã bàn"
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() =>
              handleFilter("ma_ban", selectedKeys[0], confirm)
            }
          />
          <Button
            className="search_button"
            type="primary"
            onClick={() => handleFilter("ma_ban", selectedKeys[0], confirm)}
            size="small"
          >
            Tìm kiếm
          </Button>
        </div>
      ),
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
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
        <div className="filter-dropdown">
          <Input
            placeholder="Tìm kiếm Số CT"
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() => handleFilter("so_ct", selectedKeys[0], confirm)}
          />
          <Button
            className="search_button"
            type="primary"
            onClick={() => handleFilter("so_ct", selectedKeys[0], confirm)}
            size="small"
          >
            Tìm kiếm
          </Button>
        </div>
      ),
    },
    {
      title: "Ngày CT",
      dataIndex: "ngay_ct",
      key: "ngay_ct",
      width: 200,
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
        <div className="filter-dropdown">
          <DatePicker
            inputReadOnly
            onChange={(date) => {
              setSelectedKeys(date ? [date.format("DD/MM/YYYY")] : []);
            }}
            format="DD/MM/YYYY"
            placeholder="Chọn ngày CT"
          />
          <Button
            className="search_button"
            type="primary"
            onClick={() => handleFilter("ngay_ct", selectedKeys[0], confirm)}
            size="small"
          >
            Tìm kiếm
          </Button>
        </div>
      ),
    },
    {
      title: "Tổng tiền",
      dataIndex: "t_tt",
      key: "t_tt",
      render: (value) => `${value?.toLocaleString() || 0} VND`,
    },
    {
      title: "Đồng bộ",
      dataIndex: "s3",
      key: "s3",
      render: (value) => (
        <Tag color={value === true ? "green" : "red"}>
          {value === true ? "Đồng bộ" : "Chưa đồng bộ"}
        </Tag>
      ),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
        <div className="filter-dropdown">
          <Select
            placeholder="Chọn"
            value={selectedKeys[0]}
            onChange={(value) => setSelectedKeys(value ? [value] : [])}
          >
            <Select.Option value="1">Đồng bộ</Select.Option>
            <Select.Option value="0">Chưa đồng bộ</Select.Option>
          </Select>
          <Button
            className="search_button"
            type="primary"
            onClick={() => handleFilter("s3", selectedKeys[0], confirm)}
            size="small"
          >
            Tìm kiếm
          </Button>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "statusName",
      key: "statusName",
      render: (text) => (
        <Tag color={text === "Hoàn thành" ? "green" : "yellow"}>{text}</Tag>
      ),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
        <div className="filter-dropdown">
          <Select
            placeholder="Chọn trạng thái"
            value={selectedKeys[0]}
            onChange={(value) => setSelectedKeys(value ? [value] : [])}
          >
            <Select.Option value="2">Hoàn thành</Select.Option>
            <Select.Option value="0">Chưa hoàn thành</Select.Option>
          </Select>
          <Button
            className="search_button"
            type="primary"
            onClick={() => handleFilter("status", selectedKeys[0], confirm)}
            size="small"
          >
            Tìm kiếm
          </Button>
        </div>
      ),
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
            disabled={
              isEditingOrder || (record.status === "2" && record.s3 === true)
            }
          />
          <Button
            icon={<PrinterOutlined />}
            onClick={() => handleReprint(record)}
            size="small"
            type="primary"
            className="print_button"
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
    try {
      const { masterData, flatDetailData } = await fetchOrderDetail(
        record.stt_rec
      );
      const groupedDetailData = groupDetailData(flatDetailData, true);

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
      };

      setPrintMaster(mergedMasterData);
      setPrintDetail(groupedDetailData);

      setTimeout(() => {
        handlePrint();
      }, 300);
    } catch (error) {
      console.error("Lỗi khi in lại hóa đơn:", error);
      notification.error({
        message: "Lỗi khi in lại hóa đơn",
        duration: 4,
      });
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
                onChange: setCurrentPage,
              }}
            />
          )}
        </div>
      </Modal>
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
