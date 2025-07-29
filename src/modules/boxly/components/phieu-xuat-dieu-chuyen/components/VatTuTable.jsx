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
        if (!isEditMode) {
          return value;
        }

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
      width: 130,
      align: "center",
      ellipsis: true,
      render: (value, record) =>
        isEditMode ? (
          <Input
            type="text"
            value={value}
            onChange={(e) => {
              let val = e.target.value;

              // Chỉ cho phép số, dấu chấm và dấu phẩy
              val = val.replace(/[^0-9.,]/g, "");

              // Thay thế dấu phẩy bằng dấu chấm
              val = val.replace(/,/g, ".");

              // Đảm bảo chỉ có một dấu chấm thập phân
              const parts = val.split(".");
              if (parts.length > 2) {
                val = parts[0] + "." + parts.slice(1).join("");
              }

              // Giới hạn số chữ số thập phân tối đa là 3
              const finalParts = val.split(".");
              if (finalParts.length === 2 && finalParts[1].length > 3) {
                val = finalParts[0] + "." + finalParts[1].substring(0, 3);
              }

              // Cho phép dấu chấm ở cuối (ví dụ: "12.")
              // Chỉ chuyển đổi thành số khi không có dấu chấm ở cuối
              if (val.endsWith(".")) {
                // Nếu kết thúc bằng dấu chấm, giữ nguyên chuỗi
                handleQuantityChange(val, record, "so_luong");
              } else {
                // Nếu không kết thúc bằng dấu chấm, xử lý bình thường
                handleQuantityChange(val, record, "so_luong");
              }
            }}
            style={{
              width: "100%",
              textAlign: "center",
              fontWeight: "bold",
            }}
            className="vat-tu-table-input"
            tabIndex={-1}
            autoComplete="off"
            spellCheck={false}
          />
        ) : value ? (
          <span
            style={{
              fontWeight: "bold",
              display: "block",
              textAlign: "center",
              color: value && value > 0 ? "#1890ff" : "#999",
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
              color: "#999",
            }}
          >
            0
          </span>
        ),
    },
    {
      title: "Số lượng cheat",
      dataIndex: "sl_td3",
      key: "sl_td3",
      width: 120,
      align: "center",
      ellipsis: true,
      render: (value, record) =>
        isEditMode ? (
          <Input
            type="text"
            value={value}
            onChange={(e) => {
              let val = e.target.value;

              // Chỉ cho phép số, dấu chấm và dấu phẩy
              val = val.replace(/[^0-9.,]/g, "");

              // Thay thế dấu phẩy bằng dấu chấm
              val = val.replace(/,/g, ".");

              // Đảm bảo chỉ có một dấu chấm thập phân
              const parts = val.split(".");
              if (parts.length > 2) {
                val = parts[0] + "." + parts.slice(1).join("");
              }

              // Giới hạn số chữ số thập phân tối đa là 3
              const finalParts = val.split(".");
              if (finalParts.length === 2 && finalParts[1].length > 3) {
                val = finalParts[0] + "." + finalParts[1].substring(0, 3);
              }

              // Cho phép dấu chấm ở cuối (ví dụ: "12.")
              // Chỉ chuyển đổi thành số khi không có dấu chấm ở cuối
              if (val.endsWith(".")) {
                // Nếu kết thúc bằng dấu chấm, giữ nguyên chuỗi
                handleQuantityChange(val, record, "sl_td3");
              } else {
                // Nếu không kết thúc bằng dấu chấm, xử lý bình thường
                handleQuantityChange(val, record, "sl_td3");
              }
            }}
            style={{
              width: "100%",
              textAlign: "center",
              fontWeight: "bold",
            }}
            className="vat-tu-table-input"
            tabIndex={-1}
            autoComplete="off"
            spellCheck={false}
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

  const getScrollConfig = () => {
    // Tính toán chiều rộng dựa trên số cột và nội dung
    const baseWidth = 60 + 120 + 200 + 80 + 130 + 120 + 80; // Tổng width các cột
    const minWidth = Math.max(baseWidth, window.innerWidth - 100); // Đảm bảo không nhỏ hơn màn hình

    // Chiều cao mỗi dòng khoảng 40px, 10 dòng là 400px, thêm header ~50px
    const rowHeight = 40;
    const headerHeight = 50;
    const maxRows = 10;
    const y = headerHeight + rowHeight * maxRows;

    return {
      x: minWidth,
      y,
    };
  };

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
      scroll={getScrollConfig()}
      size="small"
      tableLayout="auto"
    />
  );
};

export default VatTuTable;
