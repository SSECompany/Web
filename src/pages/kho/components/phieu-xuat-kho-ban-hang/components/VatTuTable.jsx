import { DeleteOutlined } from "@ant-design/icons";
import { Button, Empty, Input, Select, Table } from "antd";
import { useState } from "react";
import { formatQuantityDisplay } from "../../../../../utils/numberUtils";

const VatTuTable = ({
  dataSource,
  isEditMode,
  handleQuantityChange,
  handleDeleteItem,
  handleDvtChange,
  fetchDonViTinh,
  onDataSourceUpdate,
}) => {
  const [loadingDvt, setLoadingDvt] = useState({});
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
            loading={loadingDvt[record.key]}
            onDropdownVisibleChange={async (visible) => {
              if (visible && record.maHang) {
                // Kiểm tra xem đã có cache trong record chưa
                if (
                  record.donViTinhList &&
                  Array.isArray(record.donViTinhList) &&
                  record.donViTinhList.length > 0
                ) {
                  return; // Đã có data, không cần gọi API
                }

                setLoadingDvt((prev) => ({ ...prev, [record.key]: true }));
                try {
                  const donViTinhList = await fetchDonViTinh(record.maHang);
                  if (Array.isArray(donViTinhList)) {
                    // Cập nhật donViTinhList cho record này
                    const updatedRecord = { ...record, donViTinhList };
                    // Tìm và cập nhật record trong dataSource
                    const updatedDataSource = dataSource.map((item) =>
                      item.key === record.key ? updatedRecord : item
                    );
                    // Gọi callback để cập nhật dataSource
                    if (onDataSourceUpdate) {
                      onDataSourceUpdate(updatedDataSource);
                    }
                  }
                } catch (error) {
                  console.error("Error fetching don vi tinh:", error);
                } finally {
                  setLoadingDvt((prev) => ({ ...prev, [record.key]: false }));
                }
              }
            }}
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
