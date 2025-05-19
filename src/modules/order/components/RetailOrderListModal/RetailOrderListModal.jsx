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
import PrintComponent from "./PrintComponent/PrintComponent";
import "./RetailOrderListModal.css";

const RetailOrderListModal = ({ isOpen, onClose }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
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
  const roleWeb = claims?.RoleWeb;
  const fullName = claims?.FullName;

  const fetchListOrderData = async (filterParams) => {
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
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchListOrderData({});
    }
  }, [isOpen]);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = allData.slice(startIndex, endIndex);

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
        <div style={{ width: 100 }}>
          Mã bàn{" "}
          {filters.ma_ban ? <Tag color="blue">{filters.ma_ban}</Tag> : null}
        </div>
      ),
      dataIndex: "ma_ban",
      key: "ma_ban",
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Tìm kiếm Mã bàn"
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() => {
              confirm();
              const newFilters = { ...filters, ma_ban: selectedKeys[0] };
              setFilters(newFilters);
              fetchListOrderData(newFilters);
            }}
            style={{ marginBottom: 8, display: "block" }}
          />
          <Button
            className="search_button"
            type="primary"
            onClick={() => {
              confirm();
              const newFilters = { ...filters, ma_ban: selectedKeys[0] };
              setFilters(newFilters);
              fetchListOrderData(newFilters);
            }}
            size="small"
          >
            Tìm kiếm
          </Button>
        </div>
      ),
    },
    {
      title: () => (
        <div style={{ width: 100 }}>
          Số chứng từ{" "}
          {filters.so_ct ? <Tag color="blue">{filters.so_ct}</Tag> : null}
        </div>
      ),
      dataIndex: "so_ct",
      key: "so_ct",
      width: 200,
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder={`Tìm kiếm Số CT`}
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() => {
              confirm();
              const newFilters = { ...filters, so_ct: selectedKeys[0] };
              setFilters(newFilters);
              fetchListOrderData(newFilters);
            }}
            style={{ marginBottom: 8, display: "block" }}
          />
          <Button
            className="search_button"
            type="primary"
            onClick={() => {
              confirm();
              const newFilters = { ...filters, so_ct: selectedKeys[0] };
              setFilters(newFilters);
              fetchListOrderData(newFilters);
            }}
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
        <div style={{ padding: 8 }}>
          <DatePicker
            inputReadOnly
            onChange={(date) => {
              if (date) {
                setSelectedKeys([date.format("DD/MM/YYYY")]);
              } else {
                setSelectedKeys([]);
              }
            }}
            style={{ marginBottom: 8, display: "block" }}
            format="DD/MM/YYYY"
            placeholder="Chọn ngày CT"
          />
          <Button
            className="search_button"
            type="primary"
            onClick={() => {
              confirm();
              const newFilters = { ...filters, ngay_ct: selectedKeys[0] };
              setFilters(newFilters);
              fetchListOrderData(newFilters);
            }}
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
      render: (value) => `${value.toLocaleString()} VND`,
    },
    {
      title: "Trạng thái",
      dataIndex: "statusName",
      key: "statusName",
      render: (text) => (
        <Tag color={text === "Hoàn thành" ? "green" : "yellow"}>{text}</Tag>
      ),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
        <div style={{ padding: 8 }}>
          <Select
            placeholder="Chọn trạng thái"
            value={selectedKeys[0]}
            onChange={(value) => {
              setSelectedKeys(value ? [value] : []);
            }}
            style={{ width: 200, marginBottom: 8, display: "block" }}
          >
            <Select.Option value="2">Hoàn thành</Select.Option>
            <Select.Option value="0">Chưa hoàn thành</Select.Option>
          </Select>
          <Button
            className="search_button"
            type="primary"
            onClick={() => {
              confirm();
              const newFilters = { ...filters, status: selectedKeys[0] };
              setFilters(newFilters);
              fetchListOrderData(newFilters);
            }}
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
        <div style={{ display: "flex", gap: "10px" }}>
          {/* {roleWeb !== "isPosMini" && ( */}
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            type="danger"
            size="small"
            className="edit_button"
            disabled={record.status === "2"}
            style={
              record.status === "2"
                ? { opacity: 0.5, pointerEvents: "none" }
                : {}
            }
          />
          {/* )} */}
          <Button
            icon={<PrinterOutlined />}
            onClick={() => handleReprint(record)}
            size="small"
            type="primary"
            style={{
              backgroundColor: "#faad14",
              borderColor: "#faad14",
              opacity: record.status !== "2" ? 0.5 : 1,
              pointerEvents: record.status !== "2" ? "none" : "auto",
            }}
          />
          <Button
            icon={<CheckOutlined />}
            onClick={() => handleApprove(record)}
            size="small"
            type="primary"
            style={{
              backgroundColor: "#52c41a",
              borderColor: "#52c41a",
              opacity: record.status !== "0" ? 0.5 : 1,
              pointerEvents: record.status !== "0" ? "none" : "auto",
            }}
          />
        </div>
      ),
    },
  ];

  const handleEdit = async (record) => {
    try {
      const existingTab = tabs.some(
        (tab) => tab.master.stt_rec === record.stt_rec
      );
      if (existingTab) {
        notification.error({
          message: "Tab đã tồn tại !!!",
          duration: 5,
        });
        return;
      }

      const res = await multipleTablePutApi({
        store: "api_get_data_detail_retail_order",
        param: {
          stt_rec: record.stt_rec,
        },
        data: {},
      });

      if (res?.responseModel?.isSucceded) {
        const masterData = res?.listObject[0]?.[0] || {};
        const flatDetailData = res?.listObject[1] || [];
        const groupedDetailData = [];

        flatDetailData.forEach((item) => {
          const { ma_vt_root, uniqueid } = item;
          if (!ma_vt_root) {
            groupedDetailData.push({ ...item, extras: [], uniqueid });
          }
        });

        flatDetailData.forEach((item) => {
          const { ma_vt_root, uniqueid } = item;
          if (ma_vt_root) {
            const parent = groupedDetailData.find(
              (p) => p.uniqueid === uniqueid
            );
            if (parent) {
              parent.extras = parent.extras || [];
              parent.extras.push(item);
            }
          }
        });

        const detailData = groupedDetailData;
        const tableData = {
          name: masterData.ma_ban,
          id: masterData.ma_ban,
        };

        const internalId = `${tableData.id}_${Date.now()}`;
        dispatch(
          addTab({
            tableName: tableData.name,
            tableId: tableData.id,
            isRealtime: false,
            internalId,
            master: masterData,
            detail: detailData,
          })
        );
        dispatch(switchTab(internalId));
        onClose();
      } else {
        console.error("API không thành công:", res?.responseModel?.message);
      }
    } catch (err) {
      console.error("Lỗi khi gọi API chi tiết đơn hàng:", err);
    }
  };

  const handleReprint = async (record) => {
    if (record.status !== "2") {
      notification.warning({
        message: "Chỉ có thể in lại hóa đơn đã hoàn thành!",
        duration: 4,
      });
      return;
    }

    try {
      const res = await multipleTablePutApi({
        store: "api_get_data_detail_retail_order",
        param: { stt_rec: record.stt_rec },
        data: {},
      });

      if (res?.responseModel?.isSucceded) {
        const masterData = res?.listObject[0]?.[0] || {};
        const flatDetailData = res?.listObject[1] || [];
        const groupedDetailData = [];

        flatDetailData.forEach((item) => {
          const { ma_vt_root } = item;
          if (ma_vt_root) {
            const parent = groupedDetailData.find(
              (p) => p.ma_vt === ma_vt_root
            );
            if (parent) {
              parent.extras = parent.extras || [];
              parent.extras.push(item);
            }
          } else {
            groupedDetailData.push({ ...item, extras: [] });
          }
        });

        setPrintMaster(masterData);
        setPrintDetail(groupedDetailData);

        setTimeout(() => {
          handlePrint();
        }, 300);
      }
    } catch (error) {
      console.error("Lỗi khi in lại hóa đơn:", error);
    }
  };

  const handleApprove = async (record) => {
    showConfirm({
      title: `Bạn có chắc chắn muốn duyệt đơn hàng có số chứng từ : ${record.so_ct}?`,
      onOk: async () => {
        try {
          const res = await multipleTablePutApi({
            store: "Api_approve_retail_combine_order",
            param: {
              stt_rec: record.stt_rec,
              userId: id,
            },
            data: {},
          });

          if (res?.responseModel?.isSucceded) {
            notification.success({
              message: `Đơn hàng ${record.so_ct} đã được duyệt thành công!`,
              duration: 4,
            });
            fetchListOrderData(filters);
          } else {
            notification.error({
              message: res?.responseModel?.message || "Duyệt đơn thất bại!",
              duration: 4,
            });
          }
        } catch (err) {
          console.error("Lỗi khi duyệt đơn hàng:", err);
          notification.error({
            message: "Lỗi khi duyệt đơn!",
            duration: 4,
          });
        }
      },
      onCancel: () => {},
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
        width={"95%"}
        title="Danh sách đơn hàng"
        destroyOnClose={true}
        onCancel={onClose}
        cancelText="Đóng"
        centered
        okButtonProps={{ style: { display: "none" } }}
        cancelButtonProps={{ style: { display: "none" } }}
      >
        <div className="retail__modal__Container">
          {isLoading ? (
            <Spin size="large" />
          ) : (
            <Table
              dataSource={currentData}
              columns={columns}
              rowKey="id"
              className="retail-order-table"
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: totalRecords,
                showSizeChanger: false,
                onChange: (page) => {
                  setCurrentPage(page);
                },
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
