import { DeleteOutlined } from "@ant-design/icons";
import { Button, Empty, Input, Select, Table } from "antd";
import { formatQuantityDisplay } from "../../../../../utils/numberUtils";

const VatTuNhapKhoTable = ({
  dataSource,
  isEditMode = true,
  handleQuantityChange,
  handleSelectChange,
  handleDeleteItem,
  handleDvtChange,
  maKhoList,
  loadingMaKho,
  fetchMaKhoListDebounced,
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
            style={{ width: "100%" }}
            size="small"
            className="vat-tu-table-select"
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
      dataIndex: "soLuongDeNghi",
      key: "soLuongDeNghi",
      width: 130,
      align: "center",
      render: (value, record) => (
        <span
          style={{
            color: value && value > 0 ? "#1890ff" : "#999",
            display: "block",
            textAlign: "center",
            fontWeight: "500",
          }}
        >
          {value && value > 0 ? formatQuantityDisplay(value) : "0"}
        </span>
      ),
    },
    {
      title: "Số lượng",
      dataIndex: "soLuong",
      key: "soLuong",
      width: 120,
      align: "center",
      render: (value, record) =>
        isEditMode ? (
          <Input
            type="text"
            value={value}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9.]/g, "");
              const parts = val.split(".");
              const formattedVal =
                parts.length > 2
                  ? parts[0] + "." + parts.slice(1).join("")
                  : val;
              handleQuantityChange(formattedVal, record, "soLuong");
            }}
            style={{
              width: "100%",
              textAlign: "center",
              fontWeight: "bold",
            }}
            className="vat-tu-table-input"
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
      title: (
        <span>
          Mã kho <span style={{ color: "red" }}>*</span>
        </span>
      ),
      dataIndex: "ma_kho",
      key: "ma_kho",
      width: 180,
      align: "center",
      render: (value, record) =>
        isEditMode ? (
          <Select
            value={value}
            onChange={(newValue) =>
              handleSelectChange(newValue, record, "ma_kho")
            }
            placeholder="Chọn kho"
            showSearch
            loading={loadingMaKho}
            filterOption={false}
            onSearch={fetchMaKhoListDebounced}
            options={maKhoList}
            style={{ width: "100%" }}
            size="small"
            className="vat-tu-table-select"
            dropdownClassName="vat-tu-dropdown"
            popupMatchSelectWidth={false}
          />
        ) : (
          value
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
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteItem(index, isEditMode)}
          title="Xóa dòng"
          disabled={!isEditMode}
          className="vat-tu-delete-btn"
        />
      ),
    },
  ];

  return (
    <Table
      bordered
      dataSource={dataSource}
      columns={columns}
      locale={{
        emptyText: (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Trống" />
        ),
      }}
      pagination={false}
      className="vat-tu-table hidden_scroll_bar"
    />
  );
};

export default VatTuNhapKhoTable;
