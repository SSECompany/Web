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
  handleSelectChange,
  maKhoList,
  loadingMaKho,
  fetchMaKhoListDebounced,
  fetchMaKhoList,
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
      dataIndex: "maHang",
      key: "maHang",
      align: "center",
      render: (value) => value,
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
            classNames={{ popup: { root: "vat-tu-dropdown" } }}
            popupMatchSelectWidth={false}
            loading={loadingDvt[record.key]}
            onOpenChange={async (visible) => {
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
                    const updatedRecord = { ...record, donViTinhList };
                    const updatedDataSource = dataSource.map((item) =>
                      item.key === record.key ? updatedRecord : item
                    );
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

              val = val.replace(/[^0-9.,]/g, "");

              val = val.replace(/,/g, ".");

              const parts = val.split(".");
              if (parts.length > 2) {
                val = parts[0] + "." + parts.slice(1).join("");
              }

              const finalParts = val.split(".");
              if (finalParts.length === 2 && finalParts[1].length > 3) {
                val = finalParts[0] + "." + finalParts[1].substring(0, 3);
              }

              if (val.endsWith(".")) {
                handleQuantityChange(val, record, "so_luong");
              } else {
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
              val = val.replace(/[^0-9.,]/g, "");
              val = val.replace(/,/g, ".");
              const parts = val.split(".");
              if (parts.length > 2) {
                val = parts[0] + "." + parts.slice(1).join("");
              }

              const finalParts = val.split(".");
              if (finalParts.length === 2 && finalParts[1].length > 3) {
                val = finalParts[0] + "." + finalParts[1].substring(0, 3);
              }

              if (val.endsWith(".")) {
                handleQuantityChange(val, record, "sl_td3");
              } else {
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
            onOpenChange={(open) => {
              if (open && fetchMaKhoList) {
                fetchMaKhoList("");
              }
            }}
            options={maKhoList}
            style={{ width: "100%" }}
            size="small"
            className="vat-tu-table-select"
            classNames={{ popup: { root: "vat-tu-dropdown" } }}
            popupMatchSelectWidth={false}
          />
        ) : (
          value
        ),
    },
  ];

  const getScrollConfig = () => {
    const baseWidth = 60 + 120 + 200 + 80 + 130 + 120 + 180 + 80;
    const minWidth = Math.max(baseWidth, window.innerWidth - 100);

    const rowHeight = 40;
    const headerHeight = 50;
    const maxRows = 25;
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
