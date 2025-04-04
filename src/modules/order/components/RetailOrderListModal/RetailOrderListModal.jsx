import { EditOutlined, PrinterOutlined } from '@ant-design/icons';
import { Button, DatePicker, Input, Modal, notification, Select, Spin, Table, Tag } from "antd";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useReactToPrint } from "react-to-print";
import { multipleTablePutApi } from "../../../../api";
import { addTab, setListOrderInfo, switchTab } from '../../store/order';
import PrintComponent from '../OrderSummary/PrintComponent/PrintComponent';
import "./RetailOrderListModal.css";

const RetailOrderListModal = ({ isOpen, onClose }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [totalRecords, setTotalRecords] = useState(0);
  const [allData, setAllData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({});
  const dispatch = useDispatch();

  const { id, storeId, unitId } = useSelector((state) => state.claimsReducer.userInfo || {});
  const tabs = useSelector((state) => state.orders.orders);
  const [printMaster, setPrintMaster] = useState({});
  const [printDetail, setPrintDetail] = useState([]);
  const printContent = useRef();

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

      const updatedData = Array.isArray(res?.listObject[0]) ? res.listObject[0] : [];
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
      render: (_, __, index) => startIndex + index + 1
    },
    {
      title: "Nhân viên",
      dataIndex: "username",
      key: "username",
    },
    {
      title: "Mã bàn",
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
      onFilter: (value, record) => record.ma_ban.includes(value),
    },
    {
      title: "Số chứng từ",
      dataIndex: "so_ct",
      key: "so_ct",
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder={`Tìm kiếm Số CT`}
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => {
              confirm();
              const newFilters = { ...filters, so_ct: selectedKeys[0] };
              setFilters(newFilters);
              fetchListOrderData(newFilters);
            }}
            style={{ marginBottom: 8, display: 'block' }}
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
      onFilter: (value, record) => record.so_ct.includes(value),
    },
    {
      title: "Ngày chứng từ",
      dataIndex: "ngay_ct",
      key: "ngay_ct",
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
        <div style={{ padding: 8 }}>
          <DatePicker
            onChange={(date) => {
              if (date) {
                setSelectedKeys([date.format('DD/MM/YYYY')]);
              } else {
                setSelectedKeys([]);
              }
            }}
            style={{ marginBottom: 8, display: 'block' }}
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
      onFilter: (value, record) => record.ngay_ct.includes(value),
    },
    {
      title: "Tổng tiền",
      dataIndex: "t_tt",
      key: "t_tt",
      render: (value) => `${value.toLocaleString()} VND`
    },
    {
      title: "Trạng thái",
      dataIndex: "statusName",
      key: "statusName",
      render: (text) => (
        <Tag color={text === "Hoàn thành" ? "green" : "yellow"}>
          {text}
        </Tag>
      ),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
        <div style={{ padding: 8 }}>
          <Select
            placeholder="Chọn trạng thái"
            value={selectedKeys[0]}
            onChange={(value) => {
              setSelectedKeys(value ? [value] : []);
            }}
            style={{ width: 200, marginBottom: 8, display: 'block' }}
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
      onFilter: (value, record) => record.statusName.includes(value),
    },
    {
      title: "Chức năng",
      key: "action",
      render: (_, record) => (
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            type="danger"
            size="small"
            className="edit_button"
            disabled={record.status === "2"}
            style={record.status === "2" ? { opacity: 0.5, pointerEvents: 'none' } : {}}
          />
          <Button
            icon={<PrinterOutlined />}
            onClick={() => handleReprint(record)}
            size="small"
            type="primary"
            style={{
              backgroundColor: "#faad14",
              borderColor: "#faad14",
              opacity: record.status !== "2" ? 0.5 : 1,
              pointerEvents: record.status !== "2" ? "none" : "auto"
            }}
          />
        </div>
      ),
    }
  ];

  const handleEdit = async (record) => {
    try {
      const existingTab = tabs.some((tab) => tab.master.stt_rec === record.stt_rec);
      if (existingTab) {
        notification.error({
          message: 'Tab đã tồn tại !!!',
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

        flatDetailData.forEach(item => {
          const { ma_vt_root } = item;
          if (ma_vt_root) {
            const parent = groupedDetailData.find(p => p.ma_vt === ma_vt_root);
            if (parent) {
              parent.extras = parent.extras || [];
              parent.extras.push(item);
            }
          } else {
            groupedDetailData.push({ ...item, extras: [] });
          }
        });

        const detailData = groupedDetailData;
        const tableData = {
          name: masterData.ma_ban,
          id: masterData.ma_ban,
        };

        const internalId = `${tableData.id}_${Date.now()}`;
        dispatch(addTab({
          tableName: tableData.name,
          tableId: tableData.id,
          isRealtime: false,
          internalId,
          master: masterData,
          detail: detailData,
        }));
        dispatch(switchTab(internalId));
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
        message: 'Chỉ có thể in lại hóa đơn đã hoàn thành!',
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

        flatDetailData.forEach(item => {
          const { ma_vt_root } = item;
          if (ma_vt_root) {
            const parent = groupedDetailData.find(p => p.ma_vt === ma_vt_root);
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

  const handlePrint = useReactToPrint({
    content: () => printContent.current,
    documentTitle: "Print This Document",
    copyStyles: false,
  });

  return (
    <>
      <Modal
        open={isOpen}
        width={"80%"}
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
        <PrintComponent ref={printContent} master={printMaster} detail={printDetail} />
      </div>
    </>
  );
};

export default RetailOrderListModal;
