import { Modal, Pagination, Table } from "antd";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import "./RetailOrderListModal.css";

const RetailOrderListModal = ({ isOpen, onClose }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(5); // Số lượng bản ghi trên mỗi trang
  const data = useSelector((state) => state.orders?.listOrderInfo) || [];

  // Cột cho bảng
  const columns = [
    {
      title: "STT",
      dataIndex: "stt",
      key: "stt",
      render: (_, __, index) => (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: "Mã KH",
      dataIndex: "ma_kh",
      key: "ma_kh",
    },
    {
      title: "Số chứng từ",
      dataIndex: "so_ct",
      key: "so_ct",
    },
    {
      title: "Ngày chứng từ",
      dataIndex: "ngay_ct",
      key: "ngay_ct",
    },
    {
      title: "Thành tiền",
      dataIndex: "t_tt",
      key: "t_tt",
      render: (value) => `${value.toLocaleString()} VND`,
    },
    {
      title: "Trạng thái",
      dataIndex: "statusName",
      key: "statusName",
    },
  ];

  // Xử lý khi chuyển trang
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

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
        <div className="h-full w-full flex flex-column gap-3">
          <div className="h-full min-h-0">
            <Table
              dataSource={data.slice(
                (currentPage - 1) * pageSize,
                currentPage * pageSize
              )}
              columns={columns}
              rowKey="id"
              pagination={false}
            />
          </div>
          <div className="align-self-end">
            <Pagination
              className="w-fit"
              total={data.length}
              pageSize={pageSize}
              current={currentPage}
              onChange={handlePageChange}
              showSizeChanger={false}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default RetailOrderListModal;