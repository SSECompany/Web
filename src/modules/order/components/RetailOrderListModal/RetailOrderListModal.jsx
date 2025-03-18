import { Modal, Spin, Table } from "antd";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { multipleTablePutApi } from "../../../../api";
import { setListOrderInfo } from "../../../../store/reducers/order";
import "./RetailOrderListModal.css";

const RetailOrderListModal = ({ isOpen, onClose }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(7);
  const [totalRecords, setTotalRecords] = useState(0);
  const [allData, setAllData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();

  const { id, storeId, unitId } = useSelector((state) => state.claimsReducer.userInfo || {});

  const fetchListOrderData = async () => {
    setIsLoading(true);
    try {
      const res = await multipleTablePutApi({
        store: "api_get_retail_order",
        param: {
          so_ct: "",
          ngay_ct: "",
          ma_kh: "",
          ten_kh: "",
          dien_thoai: "",
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
      fetchListOrderData();
    }
  }, [isOpen]);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = allData.slice(startIndex, endIndex);

  const columns = [
    { title: "STT", dataIndex: "stt", key: "stt", render: (_, __, index) => startIndex + index + 1 },
    { title: "Mã KH", dataIndex: "ma_kh", key: "ma_kh" },
    { title: "Số chứng từ", dataIndex: "so_ct", key: "so_ct" },
    { title: "Ngày chứng từ", dataIndex: "ngay_ct", key: "ngay_ct" },
    { title: "Thành tiền", dataIndex: "t_tt", key: "t_tt", render: (value) => `${value.toLocaleString()} VND` },
    { title: "Trạng thái", dataIndex: "statusName", key: "statusName" },
  ];

  return (
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
  );
};

export default RetailOrderListModal;