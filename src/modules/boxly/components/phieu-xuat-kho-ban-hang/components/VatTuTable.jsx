import { DeleteOutlined } from "@ant-design/icons";
import { Button, Empty, Input, Select, Table } from "antd";
import { formatQuantityDisplay } from "../../../../../utils/numberUtils";

const VatTuTable = ({
  dataSource,
  isEditMode,
  handleQuantityChange,
  handleDeleteItem,
  handleDvtChange,
}) => {
  const columns = [
    {
      title: "STT",
      dataIndex: "key",
      key: "key",
      width: 60,
      align: "center",
    },
    {
      title: "Mã hàng",
      dataIndex: "maHang",
      key: "maHang",
      align: "center",
    },
    {
      title: "Tên mặt hàng",
      dataIndex: "ten_mat_hang",
      key: "ten_mat_hang",
      align: "center",
    },
    {
      title: "Đvt",
      dataIndex: "dvt",
      key: "dvt",
      width: 80,
      align: "center",
      render: (value, record) => {
        // Nếu không phải edit mode, chỉ hiển thị text
        if (!isEditMode) {
          return value;
        }

        // Lấy danh sách đơn vị tính từ record
        const dvtOptions = record.donViTinhList || [];

        return (
          <Select
            value={value}
            onChange={(newValue) => handleDvtChange(newValue, record)}
            className="vat-tu-table-select"
            style={{ width: "100%" }}
            size="small"
            dropdownClassName="vat-tu-dropdown"
            popupMatchSelectWidth={false}
          >
            {dvtOptions.length > 0 ? (
              dvtOptions.map((dvt) => (
                <Select.Option key={dvt.dvt} value={dvt.dvt}>
                  {dvt.dvt}
                </Select.Option>
              ))
            ) : (
              <Select.Option value={value}>{value}</Select.Option>
            )}
          </Select>
        );
      },
    },
    {
      title: "Số lượng đề nghị",
      dataIndex: "so_luong",
      key: "so_luong",
      width: 150,
      align: "center",
      render: (value) => {
        return (
          <span
            style={{
              fontWeight: "bold",
              display: "block",
              textAlign: "center",
            }}
          >
            {formatQuantityDisplay(value)}
          </span>
        );
      },
    },
    {
      title: "Số lượng xuất",
      dataIndex: "sl_td3",
      key: "sl_td3",
      width: 150,
      align: "center",
      render: (value, record) =>
        isEditMode ? (
          <Input
            type="text"
            value={value}
            className="vat-tu-table-input"
            onChange={(e) => {
              // Cho phép nhập số và dấu chấm thập phân
              const val = e.target.value.replace(/[^0-9.]/g, "");
              // Đảm bảo chỉ có 1 dấu chấm
              const parts = val.split(".");
              const formattedVal =
                parts.length > 2
                  ? parts[0] + "." + parts.slice(1).join("")
                  : val;
              handleQuantityChange(formattedVal, record, "sl_td3");
            }}
            style={{
              width: "100%",
              textAlign: "center",
              fontWeight: "bold",
            }}
          />
        ) : value ? (
          <span
            style={{
              fontWeight: "bold",
              display: "block",
              textAlign: "center",
            }}
          >
            {formatQuantityDisplay(value)}
          </span>
        ) : (
          <span
            style={{
              fontWeight: "bold",
              display: "block",
              textAlign: "center",
            }}
          >
            0
          </span>
        ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 80,
      align: "center",
      render: (_, record, index) => (
        <Button
          type="text"
          danger
          size="small"
          className="vat-tu-delete-btn"
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteItem(index, isEditMode)}
          title="Xóa dòng"
          disabled={!isEditMode}
        />
      ),
    },
  ];

  return (
    <Table
      bordered
      className="vat-tu-table hidden_scroll_bar"
      dataSource={dataSource}
      columns={columns}
      locale={{
        emptyText: (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Trống" />
        ),
      }}
      pagination={false}
      scroll={{ x: 1200 }}
    />
  );
};

export default VatTuTable;
