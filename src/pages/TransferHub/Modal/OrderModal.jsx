import { Modal, Table } from "antd";
import { useEffect, useState } from "react";
import { formatCurrency } from "../../../app/hook/dataFormatHelper";
import "./OrderModal.css";

const CTDH_COLUMNS = [
  {
    title: "STT",
    dataIndex: "stt",
    key: "stt",
    width: 50,
    align: "center",
  },
  {
    title: "Tên hàng",
    dataIndex: "ten_vt",
    key: "ten_vt",
    width: 150,
    render: (text, record) => (
      <span style={{ paddingLeft: record.ma_vt_root ? 20 : 0 }}>
        {record.ma_vt_root ? `+ ${text}` : text}
      </span>
    ),
  },
  {
    title: "SL",
    dataIndex: "so_luong",
    key: "so_luong",
    width: 80,
    align: "center",
    render: (text) => <span>{text ? text.toLocaleString() : "0"}</span>,
  },
  {
    title: "Giá",
    dataIndex: "don_gia",
    key: "don_gia",
    width: 120,
    align: "right",
    render: (text) => <span>{text ? formatCurrency(text) + " đ" : "0 đ"}</span>,
  },
  {
    title: "Thành tiền",
    dataIndex: "thanh_tien",
    key: "thanh_tien",
    width: 150,
    align: "right",
    render: (text) => <strong>{text ? formatCurrency(text) + " đ" : "0 đ"}</strong>,
  },
];

const OrderModal = ({ children }) => {
  const [preparedData, setPreparedData] = useState([]);

  useEffect(() => {
    const handleStorageChange = () => {
      const activeTabId = localStorage.getItem("pos_activeTabId");
      const localStorageData = JSON.parse(localStorage.getItem("pos_orders") || "[]");

      if (localStorageData && activeTabId) {
        const activeTabData = localStorageData.find((tab) => tab.tableId === activeTabId);
        if (activeTabData && activeTabData.detail) {
          const flatData = activeTabData.detail.flatMap((item, index) => {
            const mainItem = {
              ...item,
              stt: index + 1,
            };
            const extras = (item.extras || []).map((extra) => ({
              ...extra,
              stt: null,
              ma_vt_root: extra.ma_vt_more,
              ten_vt: extra.ten_vt,
              don_gia: extra.gia,
              so_luong: extra.quantity,
              thanh_tien: extra.gia * extra.quantity,
            }));

            return [mainItem, ...extras]
              ;

          });

          setPreparedData(flatData);
        } else {
          setPreparedData([]);
        }
      }
    };

    handleStorageChange();
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  return (
    <Modal
      zIndex={100}
      width={"100vw"}
      height={"100vh"}
      forceRender
      closable={false}
      footer={null}
      centered
      className="custom_table"
      open={true}
    >
      <div style={{ width: "100%", height: "72vh", overflow: "auto" }}>
        <Table
          columns={CTDH_COLUMNS}
          dataSource={preparedData}
          pagination={false}
          rowKey={(record) => record.ma_vt_more}
          bordered
        />
      </div>
      <div
        className="line-height-4 mt-2 flex px-2 border-round-lg"
        style={{
          width: "100%",
          height: "15vh",
          color: "white",
          fontWeight: "bold",
        }}
      >
        <div className="border-round-sm" style={{ width: "100%" }}>
          <div className="w-100 mt-2 flex justify-content-between px-2">
            <span className="text-left">Thành tiền:</span>
            <span className="text-right">
              {formatCurrency(
                preparedData.reduce(
                  (total, item) =>
                    total + (item.thanh_tien ? parseFloat(item.thanh_tien) : 0),
                  0
                )
              )}
              đ
            </span>
          </div>
        </div>
      </div>
      {children}
    </Modal>
  );
};

export default OrderModal;