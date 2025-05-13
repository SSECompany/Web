import { Button, Input, Modal, Table, Tag } from "antd";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { multipleTablePutApi } from "../../../../../api";
import "./MergeOrder.css";

const MergeOrder = ({ visible, onClose }) => {
  const [orders, setOrders] = useState([]);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [allData, setAllData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({});

  const { id, storeId, unitId } = useSelector(
    (state) => state.claimsReducer.userInfo || {}
  );

  const fetchListOrderData = async () => {
    setIsLoading(true);
    try {
      const res = await multipleTablePutApi({
        store: "api_get_retail_order",
        param: {
          status: "0",
          pageIndex: currentPage,
          pageSize: 10,
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

      const filtered = updatedData.filter((order) => order.status === "0");
      setOrders(filtered);
      setAllData(updatedData);
      setTotalRecords(totalRecords);
    } catch (err) {
      console.error("Lỗi khi lấy danh sách đơn hàng:", err);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (visible) {
      fetchListOrderData();
    }
  }, [visible, currentPage]);

  const handleToggleOrder = (stt_rec) => {
    setSelectedOrderIds((prev) =>
      prev.includes(stt_rec)
        ? prev.filter((item) => item !== stt_rec)
        : [...prev, stt_rec]
    );
  };

  const handleClose = () => {
    setSelectedOrderIds([]);
    onClose();
  };

  const handleMerge = async () => {
    console.log("Gộp các đơn:", selectedOrderIds);
    setSelectedOrderIds([]);
    onClose();
  };

  return (
    <Modal
      title="Gộp đơn"
      width={"70%"}
      open={visible}
      onCancel={handleClose}
      className="merge-order-modal-container"
      footer={[
        <Button key="cancel" onClick={handleClose}>
          Hủy
        </Button>,
        <Button
          key="merge"
          type="primary"
          disabled={selectedOrderIds.length < 2}
          onClick={handleMerge}
        >
          Gộp đơn
        </Button>,
      ]}
    >
      {orders.length === 0 ? (
        <div style={{ textAlign: "center", color: "#888" }}>
          Không có đơn hàng nào để gộp.
        </div>
      ) : (
        <Table
          className="merge-order_table"
          rowKey="stt_rec"
          dataSource={orders}
          loading={isLoading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalRecords,
            showSizeChanger: false,
            onChange: (page) => {
              setCurrentPage(page);
            },
          }}
          scroll={{ y: 400 }}
          rowSelection={{
            selectedRowKeys: selectedOrderIds,
            onChange: (selectedRowKeys) => setSelectedOrderIds(selectedRowKeys),
            hideSelectAll: true,
          }}
          columns={[
            {
              title: "Mã bàn",
              dataIndex: "ma_ban",
              key: "ma_ban",
              align: "center",
            },
            {
              title: "Số chứng từ",
              dataIndex: "so_ct",
              key: "so_ct",
              align: "center",
              className: "so-chung-tu-col",
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
              onFilter: (value, record) => record.so_ct.includes(value),
            },
            {
              title: "Ngày chứng từ",
              dataIndex: "ngay_ct",
              key: "ngay_ct",
              align: "center",
            },
            {
              title: "Tổng tiền",
              dataIndex: "tien",
              key: "tien",
              align: "center",
              render: (value) => `${Number(value || 0).toLocaleString()} đ`,
            },
            {
              title: "Trạng thái",
              dataIndex: "status",
              key: "status",
              align: "center",
              render: (status) =>
                status === "0" ? (
                  <Tag color="warning">Chưa hoàn thành</Tag>
                ) : null,
            },
          ]}
        />
      )}
    </Modal>
  );
};

export default MergeOrder;
