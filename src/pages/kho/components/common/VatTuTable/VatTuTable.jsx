import { DeleteOutlined } from "@ant-design/icons";
import { Button, Empty, Input, Select, Table } from "antd";
import { useCallback, useMemo, useState } from "react";
import { formatQuantityDisplay } from "../../../../../utils/numberUtils";
import { validateQuantityInput } from "./utils/validation";

/**
 * Component VatTuTable chung cho tất cả các loại phiếu
 * @param {Object} props
 * @param {Array} props.dataSource - Dữ liệu bảng
 * @param {boolean} props.isEditMode - Chế độ chỉnh sửa
 * @param {Function} props.onQuantityChange - Xử lý thay đổi số lượng
 * @param {Function} props.onDeleteItem - Xử lý xóa item
 * @param {Function} props.onDvtChange - Xử lý thay đổi đơn vị tính
 * @param {Function} props.onSelectChange - Xử lý thay đổi select (mã kho, etc)
 * @param {Function} props.onDataSourceUpdate - Callback cập nhật dataSource
 * @param {Object} props.columnConfig - Cấu hình cột động
 * @param {Object} props.apiHandlers - Các hàm xử lý API
 * @param {Object} props.selectData - Dữ liệu cho các select (maKhoList, etc)
 * @param {Object} props.loadingStates - Trạng thái loading
 */
const VatTuTable = ({
  dataSource,
  isEditMode = true,
  onQuantityChange,
  onDeleteItem,
  onDvtChange,
  onSelectChange,
  onDataSourceUpdate,
  columnConfig = {},
  apiHandlers = {},
  selectData = {},
  loadingStates = {},
  tableClassName = "vat-tu-table hidden_scroll_bar",
  ...otherProps
}) => {
  const [loadingDvt, setLoadingDvt] = useState({});

  // Xử lý thay đổi số lượng với validation
  const handleQuantityChange = useCallback(
    (value, record, field) => {
      const validatedValue = validateQuantityInput(value);
      onQuantityChange(validatedValue, record, field);
    },
    [onQuantityChange]
  );

  // Render input số lượng
  const renderQuantityInput = useCallback(
    (value, record, field, editable = true) => {
      if (!isEditMode || !editable) {
        return (
          <span
            style={{
              fontWeight: "bold",
              display: "block",
              textAlign: "center",
              color: value && value > 0 ? "#1890ff" : "#999",
            }}
          >
            {formatQuantityDisplay(value || 0)}
          </span>
        );
      }

      return (
        <Input
          type="text"
          value={value}
          onChange={(e) => handleQuantityChange(e.target.value, record, field)}
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
      );
    },
    [isEditMode, handleQuantityChange]
  );

  // Render select đơn vị tính
  const renderDvtSelect = useCallback(
    (value, record) => {
      if (!isEditMode) {
        return value;
      }

      const dvtOptions = record.donViTinhList || [];

      return (
        <Select
          value={value}
          onChange={(newValue) => onDvtChange(newValue, record)}
          style={{ width: "100%" }}
          size="small"
          className="vat-tu-table-select"
          loading={loadingDvt[record.key]}
          onDropdownVisibleChange={async (visible) => {
            if (visible && record.maHang && apiHandlers.fetchDonViTinh) {
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
                const donViTinhList = await apiHandlers.fetchDonViTinh(
                  record.maHang
                );
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
    [
      isEditMode,
      onDvtChange,
      loadingDvt,
      apiHandlers,
      dataSource,
      onDataSourceUpdate,
    ]
  );

  // Render select mã kho
  const renderMaKhoSelect = useCallback(
    (value, record) => {
      if (!isEditMode) {
        return value;
      }

      return (
        <Select
          value={value}
          onChange={(newValue) => onSelectChange(newValue, record, "ma_kho")}
          placeholder="Chọn kho"
          showSearch
          loading={loadingStates.maKho}
          filterOption={false}
          onSearch={apiHandlers.fetchMaKhoListDebounced}
          options={selectData.maKhoList}
          style={{ width: "100%" }}
          size="small"
          className="vat-tu-table-select"
          dropdownClassName="vat-tu-dropdown"
          popupMatchSelectWidth={false}
          onDropdownVisibleChange={(visible) => {
            if (visible && apiHandlers.fetchMaKhoList) {
              apiHandlers.fetchMaKhoList();
            }
          }}
        />
      );
    },
    [
      isEditMode,
      onSelectChange,
      loadingStates.maKho,
      apiHandlers,
      selectData.maKhoList,
    ]
  );

  // Tạo columns động dựa trên config
  const columns = useMemo(() => {
    const baseColumns = [
      {
        title: "STT",
        dataIndex: "key",
        key: "key",
        width: 60,
        align: "center",
        ellipsis: true,
      },
      {
        title: "Mã hàng",
        dataIndex: "maHang",
        key: "maHang",
        width: 120,
        align: "center",
        ellipsis: true,
      },
      {
        title: "Tên mặt hàng",
        dataIndex: columnConfig.tenMatHangField || "ten_mat_hang",
        key: "ten_mat_hang",
        width: 200,
        align: "center",
        ellipsis: true,
      },
      {
        title: "Đvt",
        dataIndex: "dvt",
        key: "dvt",
        width: 80,
        align: "center",
        ellipsis: true,
        render: renderDvtSelect,
      },
    ];

    // Thêm cột mã lô
    if (columnConfig.showMaLo) {
      baseColumns.push({
        title: "Mã lô",
        dataIndex: columnConfig.maLoField || "ma_lo",
        key: "ma_lo",
        width: 100,
        align: "center",
        ellipsis: true,
        render: (value, record) => {
          if (!isEditMode) {
            return value;
          }
          return (
            <Input
              value={value}
              onChange={(e) => onSelectChange(e.target.value, record, "ma_lo")}
              style={{ width: "100%", textAlign: "center" }}
              className="vat-tu-table-input"
              placeholder="Nhập mã lô"
              size="small"
            />
          );
        },
      });
    }

    // Thêm cột mã vị trí
    if (columnConfig.showMaViTri) {
      baseColumns.push({
        title: "Mã vị trí",
        dataIndex: columnConfig.maViTriField || "ma_vi_tri",
        key: "ma_vi_tri",
        width: 100,
        align: "center",
        ellipsis: true,
        render: (value, record) => {
          if (!isEditMode) {
            return value;
          }
          return (
            <Input
              value={value}
              onChange={(e) => onSelectChange(e.target.value, record, "ma_vi_tri")}
              style={{ width: "100%", textAlign: "center" }}
              className="vat-tu-table-input"
              placeholder="Nhập mã vị trí"
              size="small"
            />
          );
        },
      });
    }

    // Thêm cột số lượng đề nghị
    if (columnConfig.showSoLuongDeNghi !== false) {
      baseColumns.push({
        title: columnConfig.soLuongDeNghiTitle || "Số lượng đề nghị",
        dataIndex: columnConfig.soLuongDeNghiField || "so_luong",
        key: "so_luong_de_nghi",
        width: 130,
        align: "center",
        ellipsis: true,
        render: (value, record) =>
          renderQuantityInput(
            value,
            record,
            columnConfig.soLuongDeNghiField || "so_luong",
            columnConfig.soLuongDeNghiEditable !== false
          ),
      });
    }

    // Thêm cột số lượng cheat/xuất
    if (columnConfig.showSoLuongCheat !== false) {
      baseColumns.push({
        title: columnConfig.soLuongCheatTitle || "Số lượng cheat",
        dataIndex: columnConfig.soLuongCheatField || "sl_td3",
        key: "so_luong_cheat",
        width: 120,
        align: "center",
        ellipsis: true,
        render: (value, record) =>
          renderQuantityInput(
            value,
            record,
            columnConfig.soLuongCheatField || "sl_td3"
          ),
      });
    }

    // Thêm cột ghi chú
    if (columnConfig.showGhiChu) {
      baseColumns.push({
        title: "Ghi chú",
        dataIndex: columnConfig.ghiChuField || "ghi_chu",
        key: "ghi_chu",
        width: 150,
        align: "center",
        ellipsis: true,
        render: (value, record) => {
          if (!isEditMode) {
            return value;
          }
          return (
            <Input
              value={value}
              onChange={(e) => onSelectChange(e.target.value, record, "ghi_chu")}
              style={{ width: "100%" }}
              className="vat-tu-table-input"
              placeholder="Nhập ghi chú"
              size="small"
            />
          );
        },
      });
    }

    // Thêm cột số lượng tồn
    if (columnConfig.showSoLuongTon) {
      baseColumns.push({
        title: "Số lượng tồn",
        dataIndex: columnConfig.soLuongTonField || "so_luong_ton",
        key: "so_luong_ton",
        width: 120,
        align: "center",
        ellipsis: true,
        render: (value, record) => (
          <span
            style={{
              fontWeight: "bold",
              display: "block",
              textAlign: "center",
              color: value && value > 0 ? "#52c41a" : "#999",
            }}
          >
            {formatQuantityDisplay(value || 0)}
          </span>
        ),
      });
    }

    // Thêm cột tổng nhặt
    if (columnConfig.showTongNhat) {
      baseColumns.push({
        title: "Tổng nhặt",
        dataIndex: columnConfig.tongNhatField || "tong_nhat",
        key: "tong_nhat",
        width: 120,
        align: "center",
        ellipsis: true,
        render: (value, record) => (
          <span
            style={{
              fontWeight: "bold",
              display: "block",
              textAlign: "center",
              color: value && value > 0 ? "#1890ff" : "#999",
            }}
          >
            {formatQuantityDisplay(value || 0)}
          </span>
        ),
      });
    }

    // Thêm cột mã kho nếu cần
    if (columnConfig.showMaKho) {
      baseColumns.push({
        title: (
          <span>
            Mã kho <span style={{ color: "red" }}>*</span>
          </span>
        ),
        dataIndex: "ma_kho",
        key: "ma_kho",
        width: 180,
        align: "center",
        ellipsis: true,
        render: renderMaKhoSelect,
      });
    }

    // Thêm cột thao tác
    baseColumns.push({
      title: "Thao tác",
      key: "action",
      width: 80,
      align: "center",
      fixed: "right",
      render: (_, record, index) => (
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => onDeleteItem(index, isEditMode)}
          title="Xóa dòng"
          disabled={!isEditMode}
          className="vat-tu-delete-btn"
        />
      ),
    });

    return baseColumns;
  }, [
    columnConfig,
    renderDvtSelect,
    renderQuantityInput,
    renderMaKhoSelect,
    onDeleteItem,
    isEditMode,
  ]);

  // Cấu hình scroll
  const getScrollConfig = useCallback(() => {
    const columnWidths = columns.reduce(
      (sum, col) => sum + (col.width || 100),
      0
    );
    const minWidth = Math.max(columnWidths, window.innerWidth - 100);

    const rowHeight = 40;
    const headerHeight = 50;
    const maxRows = 10;
    const y = headerHeight + rowHeight * maxRows;

    return { x: minWidth, y };
  }, [columns]);

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
      className={tableClassName}
      scroll={getScrollConfig()}
      size="small"
      tableLayout="auto"
      {...otherProps}
    />
  );
};

export default VatTuTable;
