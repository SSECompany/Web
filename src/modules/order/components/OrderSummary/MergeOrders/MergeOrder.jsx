import { Button, Input, Modal, Table, Tag, message } from "antd";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { multipleTablePutApi } from "../../../../../api";
import showConfirm from "../../../../../components/common/Modal/ModalConfirm";
import "./MergeOrder.css";

const MergeOrder = ({ visible, onClose, onSubmitCombineOrder }) => {
  const [orders, setOrders] = useState([]);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [selectedOrderIdsAll, setSelectedOrderIdsAll] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [allData, setAllData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({});
  const [searchText, setSearchText] = useState("");

  const { id, storeId, unitId } = useSelector(
    (state) => state.claimsReducer.userInfo || {}
  );

  const fetchListOrderData = async (customFilters = filters) => {
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
          so_ct: customFilters?.so_ct || "",
        },
        data: {},
      });

      const updatedData = Array.isArray(res?.listObject[0])
        ? res.listObject[0]
        : [];
      const paginationInfo = res?.listObject[2]?.[0] || {};
      const totalRecords = paginationInfo.totalRecord || updatedData.length;

      setOrders(updatedData);
      setAllData(updatedData);
      setTotalRecords(totalRecords);
    } catch (err) {
      console.error("Lỗi khi lấy danh sách đơn hàng:", err);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (visible) {
      fetchListOrderData({});
    }
  }, [visible, currentPage]);

  const handleToggleOrder = (stt_rec) => {
    setSelectedOrderIds((prev) =>
      prev.includes(stt_rec)
        ? prev.filter((item) => item !== stt_rec)
        : [...prev, stt_rec]
    );
  };

  useEffect(() => {
    const currentPageIds = orders.map((o) => o.stt_rec);
    let newAll = selectedOrderIdsAll.filter(
      (id) => !currentPageIds.includes(id)
    );
    newAll = [...newAll, ...selectedOrderIds];
    newAll = Array.from(new Set(newAll));
    setSelectedOrderIdsAll(newAll);
  }, [selectedOrderIds, orders]);

  useEffect(() => {
    const currentPageIds = orders.map((o) => o.stt_rec);
    const checkedOnPage = selectedOrderIdsAll.filter((id) =>
      currentPageIds.includes(id)
    );
    setSelectedOrderIds(checkedOnPage);
  }, [orders]);

  const handleClose = () => {
    setSelectedOrderIds([]);
    setSelectedOrderIdsAll([]);
    setFilters({ so_ct: "" });
    setCurrentPage(1);
    fetchListOrderData({ so_ct: "" }); 
    onClose();
  };

  const handleMerge = async () => {
    if (selectedOrderIdsAll.length < 2) return;


    const selectedOrders = orders.filter((order) =>
      selectedOrderIdsAll.includes(order.stt_rec)
    );
    const orderNumbers = selectedOrders.map((order) => order.so_ct).join(", ");

    showConfirm({
      title: `Bạn có chắc chắn muốn gộp các đơn có số chứng từ: ${orderNumbers}?`,
      onOk: async () => {
        try {
          const res = await multipleTablePutApi({
            store: "api_get_data_detail_retail_combine_order",
            param: {
              list_stt_rec: selectedOrderIdsAll.join(","),
            },
            data: {},
          });

          if (res?.listObject?.[0] && res?.listObject?.[1]) {
            const flatDetail = res.listObject[1];
            const mainItems = [];
            const mainMap = {};

            flatDetail.forEach((item) => {
              if (!item.ma_vt_root) {
                const main = { ...item, extras: [] };
                mainItems.push(main);
                mainMap[item.uniqueid] = main;
              }
            });

            flatDetail.forEach((item) => {
              if (item.ma_vt_root) {
                const main = mainMap[item.uniqueid];
                if (main) {
                  main.extras.push(item);
                }
              }
            });

            onSubmitCombineOrder(res.listObject[0], mainItems);
            message.success("Lấy dữ liệu đơn hàng gộp thành công!");
          } else {
            message.warning("Không tìm thấy dữ liệu để gộp!");
          }
        } catch (error) {
          console.error("Lỗi khi lấy dữ liệu gộp:", error);
          message.error("Lỗi khi lấy dữ liệu gộp!");
        }

        setSelectedOrderIds([]);
        setSelectedOrderIdsAll([]);
        onClose();
      },
    });
  };

  const columns = [
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
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder={`Tìm kiếm Số CT`}
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setSelectedKeys(e.target.value ? [e.target.value] : []);
            }}
            onPressEnter={() => {
              confirm();
              if (searchText.trim()) {
                const newFilters = { ...filters, so_ct: searchText };
                setFilters(newFilters);
                fetchListOrderData(newFilters);
              } else {
                setFilters({}); 
                fetchListOrderData({});
              }
              setSearchText(""); 
              setSelectedKeys([]); 
            }}
            style={{ marginBottom: 8, display: "block" }}
          />
          <Button
            className="search_button"
            type="primary"
            onClick={() => {
              confirm();
              if (searchText.trim()) {
                const newFilters = { ...filters, so_ct: searchText };
                setFilters(newFilters);
                fetchListOrderData(newFilters);
              } else {
                setFilters({}); 
                fetchListOrderData({}); 
              }
              setSearchText(""); 
              setSelectedKeys([]); 
            }}
            size="small"
          >
            Tìm kiếm
          </Button>
        </div>
      ),
    },
    {
      title: "Ngày chứng từ",
      dataIndex: "ngay_ct",
      key: "ngay_ct",
      align: "center",
    },
    {
      title: "Tổng tiền",
      dataIndex: "t_tt",
      key: "t_tt",
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
  ];

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
          disabled={selectedOrderIdsAll.length < 2}
          onClick={handleMerge}
        >
          Gộp đơn
        </Button>,
      ]}
    >
      <Table
        className="merge-order_table"
        rowKey="stt_rec"
        dataSource={orders}
        loading={isLoading}
        pagination={{
          current: currentPage,
          pageSize: 10,
          total: totalRecords,
          showSizeChanger: false,
          onChange: (page) => {
            setCurrentPage(page);
          },
        }}
        scroll={{ y: 400 }}
        rowSelection={{
          selectedRowKeys: selectedOrderIds,
          onChange: setSelectedOrderIds,
          hideSelectAll: true,
        }}
        columns={columns}
        locale={{
          emptyText: (
            <div style={{ textAlign: "center", color: "#888" }}>
              Không tìm thấy đơn hàng nào phù hợp.
            </div>
          ),
        }}
      />
    </Modal>
  );
};

export default MergeOrder;
