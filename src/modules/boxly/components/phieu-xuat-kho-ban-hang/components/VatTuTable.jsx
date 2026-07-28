import { CheckSquareOutlined, DeleteOutlined } from "@ant-design/icons";
import { Button, Checkbox, Empty, Input, Select, Table } from "antd";
import { useState } from "react";
import { formatQuantityDisplay } from "../../../../../utils/numberUtils";

const VatTuTable = ({
  dataSource,
  isEditMode,
  handleQuantityChange,
  handleDeleteItem,
  handleDvtChange,
  handleMaVuViecChange,
  handleInYnChange,
  handleMaVcChange,
  handleViTriLookupUpdate,
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
      fixed: "left",
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
      width: 280,
      align: "center",
      ellipsis: {
        showTitle: true,
      },
      render: (value) => (
        <span title={value} style={{ display: "inline-block", maxWidth: "100%" }}>
          {value}
        </span>
      ),
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
            loading={loadingDvt[record.key]}
            onDropdownVisibleChange={async (visible) => {
              if (visible && record.maHang) {
                if (
                  record.donViTinhList &&
                  Array.isArray(record.donViTinhList) &&
                  record.donViTinhList.length > 0
                ) {
                  return;
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
      title: "Vị trí lưu kho",
      dataIndex: "ma_vi_tri_lookup",
      key: "ma_vi_tri_lookup",
      width: 160,
      align: "center",
      ellipsis: true,
      render: (value, record) => {
        const maVT = record.ma_vi_tri || record.ma_vi_tri_lookup || value || "";
        const tenVT = record.ten_vi_tri || record.ten_vi_tri_lookup || "";
        if (!maVT && !tenVT) {
          return <span style={{ color: "#999", fontStyle: "italic" }}>-</span>;
        }
        return <span title={tenVT}>{maVT}{tenVT ? ` - ${tenVT}` : ""}</span>;
      },
    },
    {
      title: "Mã vụ việc",
      dataIndex: "ma_vv",
      key: "ma_vv",
      width: 120,
      align: "center",
      ellipsis: true,
      render: (value, record) => {
        if (!isEditMode) {
          return value || "";
        }
        return (
          <Input
            type="text"
            value={value || ""}
            placeholder="Nhập mã vụ việc"
            onChange={(e) =>
              handleMaVuViecChange && handleMaVuViecChange(e.target.value, record)
            }
            style={{
              width: "100%",
              textAlign: "center",
            }}
            size="small"
            className="vat-tu-table-input"
            tabIndex={-1}
            autoComplete="off"
            spellCheck={false}
          />
        );
      },
    },
    {
      title: "Theo dõi mã vạch",
      dataIndex: "in_yn",
      key: "in_yn",
      width: 100,
      align: "center",
      render: (value, record) => (
        <Checkbox
          checked={Boolean(value)}
          disabled={!isEditMode}
          onChange={(e) =>
            handleInYnChange && handleInYnChange(e.target.checked, record)
          }
        />
      ),
    },
    {
      title: "Mã vạch",
      dataIndex: "ma_vc",
      key: "ma_vc",
      width: 160,
      align: "center",
      ellipsis: true,
      render: (value, record) => {
        if (!isEditMode) {
          return value ? <span style={{ fontWeight: 600 }}>{value}</span> : "";
        }
        const inYn = Boolean(record.in_yn);
        const placeholder = inYn ? "Nhập mã vạch" : "Vật tư không theo dõi mã vạch";
        return (
          <Input
            type="text"
            value={value || ""}
            disabled={!inYn}
            placeholder={placeholder}
            onChange={(e) =>
              handleMaVcChange && handleMaVcChange(e.target.value, record)
            }
            style={{
              width: "100%",
              textAlign: "center",
              backgroundColor: inYn ? "#fffbe6" : "#f5f5f5",
            }}
            size="small"
            className="vat-tu-table-input"
            tabIndex={-1}
            autoComplete="off"
            spellCheck={false}
          />
        );
      },
    },
    {
      title: "Thao tác",
      key: "action",
      width: 80,
      fixed: "right",
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
      scroll={{ x: 1400, y: 400 }}
    />
  );
};

export default VatTuTable;
