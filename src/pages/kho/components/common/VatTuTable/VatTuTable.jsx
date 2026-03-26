import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Empty, Input, Select, Table, Spin } from "antd";
import { useCallback, useMemo, useState, useRef, useEffect } from "react";
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
  const [loadingLo, setLoadingLo] = useState({});
  const [loadingViTri, setLoadingViTri] = useState({});
  const [openLo, setOpenLo] = useState({});
  const [openViTri, setOpenViTri] = useState({});
  const [viTriOptions, setViTriOptions] = useState({});
  
  // Use ref to track latest dataSource to avoid stale closure in async callbacks
  const dataSourceRef = useRef(dataSource);
  useEffect(() => {
    dataSourceRef.current = dataSource;
  }, [dataSource]);

  // Prefetch danh sách mã lô cho một dòng cụ thể, luôn dùng dataSource mới nhất
  const loadLoOptions = useCallback(
    async (keyword = "", record, openAfter = false) => {
      if (!apiHandlers.fetchLoList || !record?.key) return;

      setLoadingLo((prev) => ({ ...prev, [record.key]: true }));
      try {
        const currentDataSource = dataSourceRef.current;
        const currentRecord =
          currentDataSource.find((item) => item.key === record.key) || record;

        const options = await apiHandlers.fetchLoList(
          keyword,
          currentRecord,
          1
        );

        const latestDataSource = dataSourceRef.current;
        const latestRecord =
          latestDataSource.find((item) => item.key === record.key) ||
          currentRecord;

        const updatedRecord = { ...latestRecord, loOptions: options };
        const updatedDataSource = latestDataSource.map((item) =>
          item.key === record.key ? updatedRecord : item
        );

        if (onDataSourceUpdate) onDataSourceUpdate(updatedDataSource);
      // Mở dropdown sau khi tải xong options (phù hợp yêu cầu auto show)
      if (openAfter) {
        setOpenLo((prev) => ({ ...prev, [record.key]: true }));
      }
      } catch (error) {
        console.error("Error loading lot options:", error);
      } finally {
        setLoadingLo((prev) => ({ ...prev, [record.key]: false }));
      }
    },
    [apiHandlers.fetchLoList, onDataSourceUpdate]
  );

  // Prefetch danh sách vị trí cho một dòng cụ thể, quản lý state riêng như POS số lô
  const loadViTriOptions = useCallback(
    async (keyword = "", record, openAfter = false) => {
      if (!apiHandlers.fetchViTriList || !record?.key) return;

      setLoadingViTri((prev) => ({ ...prev, [record.key]: true }));
      try {
        const currentDataSource = dataSourceRef.current;
        const currentRecord =
          currentDataSource.find((item) => item.key === record.key) || record;

        const options = await apiHandlers.fetchViTriList(
          keyword,
          currentRecord,
          1
        );

        setViTriOptions((prev) => ({ ...prev, [record.key]: options }));

        // Giữ nguyên dataSource nhưng vẫn cập nhật viTriOptions nếu đã lưu trên record (để các nơi khác dùng)
        const latestDataSource = dataSourceRef.current;
        const latestRecord =
          latestDataSource.find((item) => item.key === record.key) ||
          currentRecord;
        const updatedRecord = { ...latestRecord, viTriOptions: options };
        const updatedDataSource = latestDataSource.map((item) =>
          item.key === record.key ? updatedRecord : item
        );
        if (onDataSourceUpdate) onDataSourceUpdate(updatedDataSource);

        if (openAfter) {
          setOpenViTri((prev) => ({ ...prev, [record.key]: true }));
        }
      } catch (error) {
        console.error("Error loading vi tri options:", error);
      } finally {
        setLoadingViTri((prev) => ({ ...prev, [record.key]: false }));
      }
    },
    [apiHandlers.fetchViTriList, onDataSourceUpdate]
  );

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
            borderColor:
              (field === (columnConfig.tongNhatField || "tong_nhat") && record.groupExceeded)
                ? "#ff4d4f"
                : undefined,
            boxShadow:
              (field === (columnConfig.tongNhatField || "tong_nhat") && record.groupExceeded)
                ? "0 0 0 2px rgba(255,77,79,0.2)"
                : undefined,
          }}
          className="vat-tu-table-input"
          title={
            field === (columnConfig.tongNhatField || "tong_nhat") && record.groupExceeded
              ? "Tổng nhặt nhóm vượt Số lượng đơn"
              : undefined
          }
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
      // Nếu cấu hình khóa ĐVT (ví dụ: nhặt hàng), luôn hiển thị dạng text
      if (columnConfig && columnConfig.dvtEditable === false) {
        return value;
      }

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
          onOpenChange={async (visible) => {
            if (visible && record.maHang && apiHandlers.fetchDonViTinh) {
              if (
                record.donViTinhList &&
                Array.isArray(record.donViTinhList) &&
                record.donViTinhList.length > 0
              ) {
                return;
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
      columnConfig,
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
          classNames={{ popup: { root: "vat-tu-dropdown" } }}
          popupMatchSelectWidth={false}
          onOpenChange={(visible) => {
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
        render: (value, record, index) => {
          if (record.isChild) return "";
          // Đếm số dòng cha trước dòng hiện tại (không tính dòng con)
          let parentCount = 0;
          for (let i = 0; i < index; i++) {
            if (!dataSource[i]?.isChild) {
              parentCount++;
            }
          }
          return parentCount + 1;
        },
      },
      {
        title: "Mặt hàng",
        key: "mat_hang",
        width: 260,
        align: "left",
        ellipsis: false,
        render: (_, record) => {
          if (record.isChild) return "";
          const maHang = record.maHang || "";
          const tenMatHang = record[columnConfig.tenMatHangField || "ten_mat_hang"] || "";
          // Lấy mã vị trí từ record
          const currentRecord = dataSource.find((item) => item.key === record.key) || record;
          const maViTri = currentRecord[columnConfig.maViTriField || "ma_vi_tri"] || "";
          return (
            <div
              style={{
                fontSize: "13px",
                lineHeight: "1.4",
                fontWeight: 400,
                color: "#333",
                padding: "4px 0",
                textAlign: "center",
              }}
            >
              <div style={{ fontWeight: 400 }}>{`${maHang}${maHang && tenMatHang ? " - " : ""}${tenMatHang}`}</div>
              {maViTri && (
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#1890ff",
                    marginTop: "6px",
                    letterSpacing: "0.5px",
                  }}
                >
                  {maViTri}
                </div>
              )}
            </div>
          );
        },
      },
      {
        title: "Đvt",
        dataIndex: "dvt",
        key: "dvt",
        width: 70,
        align: "center",
        ellipsis: true,
        render: renderDvtSelect,
      },
    ];

    // Cột gộp Mã lô / Mã vị trí hoặc hai cột riêng
    if (columnConfig.combineMaLoViTri) {
      baseColumns.push({
        title: "Mã lô",
        key: "ma_lo_ma_vi_tri",
        width: 160,
        align: "center",
        ellipsis: true,
        render: (_, record) => {
          // Get current record from dataSource to avoid stale data
          const currentRecord = dataSource.find((item) => item.key === record.key) || record;
          const maLo = currentRecord[columnConfig.maLoField || "ma_lo"]; 
          const maViTri = currentRecord[columnConfig.maViTriField || "ma_vi_tri"]; 
          if (!isEditMode) {
            // Chỉ hiển thị mã lô; mã vị trí đã hiển thị ở cột Mặt hàng
            let maLoDisplay = maLo || "";
            if (maLo && currentRecord.loOptions && currentRecord.loOptions.length > 0) {
              const matchedOption = currentRecord.loOptions.find((opt) => opt.value === maLo);
              if (matchedOption?.label) {
                maLoDisplay = matchedOption.label;
              }
            }
            return maLoDisplay || "";
          }
          const loOpts = currentRecord.loOptions || [];
          const viTriOpts =
            viTriOptions[currentRecord.key] || currentRecord.viTriOptions || [];

          const isLoLoading = !!loadingLo[record.key];
          const isViTriLoading = !!loadingViTri[record.key];

          return (
            <div
              style={{
                display: "flex",
                gap: 8,
                width: "100%",
                justifyContent: "center",
              }}
            >
              <Select
                key={`ma-lo-${record.key}`}
                value={maLo || undefined}
                showSearch
                allowClear
                placeholder="Mã lô"
                size="small"
                style={{ width: 140 }}
                loading={isLoLoading}
                filterOption={false}
                onFocus={() => {
                  const currentDataSource = dataSourceRef.current;
                  const currentRecord =
                    currentDataSource.find((item) => item.key === record.key) ||
                    record;
                  const hasOptions =
                    currentRecord?.loOptions && currentRecord.loOptions.length > 0;
                  if (!hasOptions) {
                    loadLoOptions("", currentRecord, true);
                  }
                }}
                onSearch={(keyword) => loadLoOptions(keyword, record, false)}
                onOpenChange={(visible) => {
                  setOpenLo((prev) => {
                    if (visible) {
                      return { ...prev, [record.key]: true };
                    }
                    const next = { ...prev };
                    delete next[record.key];
                    return next;
                  });
                  if (!visible) return;
                  const currentDataSource = dataSourceRef.current;
                  const currentRecord =
                    currentDataSource.find((item) => item.key === record.key) ||
                    record;
                  const hasOptions =
                    currentRecord?.loOptions && currentRecord.loOptions.length > 0;
                  if (!hasOptions) {
                    loadLoOptions("", currentRecord, true);
                  }
                }}
                onChange={(val) => {
                  // Find the latest record from dataSource using ref to avoid stale reference
                  // Match POS behavior: ensure value is string (val || "")
                  const currentDataSource = dataSourceRef.current;
                  const currentRecord = currentDataSource.find((item) => item.key === record.key);
                  if (currentRecord) {
                    // Preserve loOptions when updating ma_lo - important to keep options after selection
                    const recordWithOptions = {
                      ...currentRecord,
                      loOptions: currentRecord.loOptions || record.loOptions,
                    };
                    onSelectChange(val || "", recordWithOptions, "ma_lo");
                  } else {
                    // Fallback to original record if not found
                    onSelectChange(val || "", record, "ma_lo");
                  }
                  // Đóng dropdown sau khi chọn (trả về uncontrolled)
                  setOpenLo((prev) => {
                    const next = { ...prev };
                    delete next[record.key];
                    return next;
                  });
                }}
                // Cho phép antd tự điều khiển nếu chưa set state; nếu đã có state thì control
                open={openLo[record.key]}
                options={loOpts}
                classNames={{ popup: { root: "vat-tu-dropdown" } }}
                popupMatchSelectWidth={false}
                notFoundContent={
                  isLoLoading ? (
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <Spin size="small" />
                    </div>
                  ) : null
                }
              />
            </div>
          );
        },
      });
    } else {
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
                onChange={(e) =>
                  onSelectChange(e.target.value, record, "ma_vi_tri")
                }
                style={{ width: "100%", textAlign: "center" }}
                className="vat-tu-table-input"
                placeholder="Nhập mã vị trí"
                size="small"
              />
            );
          },
        });
      }
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
          record.isChild
            ? ""
            : renderQuantityInput(
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

    // Thêm cột ghi chú: mặc định, hoặc hoãn tới cuối nếu cấu hình yêu cầu
    let ghiChuColumn = null;
    if (columnConfig.showGhiChu) {
      ghiChuColumn = {
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
      };
      if (!columnConfig.placeGhiChuAtEnd) {
        baseColumns.push(ghiChuColumn);
        ghiChuColumn = null;
      }
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
        render: (value, record) =>
          record.isChild ? (
            ""
          ) : (
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
        render: (value, record) => {
          if (columnConfig.tongNhatEditable) {
            return renderQuantityInput(
              value,
              record,
              columnConfig.tongNhatField || "tong_nhat"
            );
          }
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
        },
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

    // Nếu cần, thêm cột ghi chú ở cuối trước khi thêm thao tác
    if (ghiChuColumn) {
      baseColumns.push(ghiChuColumn);
    }

    // Thêm cột thao tác
    baseColumns.push({
      title: "Thao tác",
      key: "action",
      width: columnConfig.useAddButtonInsteadOfDelete ? 120 : 80, // Tăng width nếu có cả nút xóa và nút thêm
      align: "center",
      fixed: "right",
      render: (_, record, index) => {
        if (columnConfig.useAddButtonInsteadOfDelete) {
          // Dòng cha: hiển thị cả nút xóa và nút thêm dòng con
          if (!record.isChild) {
            return (
              <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => onDeleteItem(index, isEditMode)}
                  title="Xóa dòng"
                  disabled={true}
                  className="vat-tu-delete-btn"
                  style={{ opacity: 0.3, cursor: "not-allowed" }}
                />
                <Button
                  type="text"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() =>
                    otherProps.onAddItem ? otherProps.onAddItem(index, record) : null
                  }
                  title="Thêm dòng con"
                  disabled={!isEditMode}
                  className="vat-tu-add-btn"
                  style={{ color: "#52c41a" }}
                />
              </div>
            );
          }
          // Dòng con: nút xóa dòng con
          return (
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
          );
        }
        // Trường hợp không dùng useAddButtonInsteadOfDelete: cả dòng cha và dòng con đều có nút xóa
        // Disable nút xóa cho dòng chính (không phải dòng con)
        return (
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => onDeleteItem(index, isEditMode)}
            title={record.isChild ? "Xóa dòng" : "Không thể xóa dòng chính"}
            disabled={!isEditMode || !record.isChild}
            className="vat-tu-delete-btn"
            style={!record.isChild ? { opacity: 0.3, cursor: "not-allowed" } : {}}
          />
        );
      },
    });

    return baseColumns;
  }, [
    columnConfig,
    renderDvtSelect,
    renderQuantityInput,
    renderMaKhoSelect,
    onDeleteItem,
    isEditMode,
    otherProps,
    dataSource, // Thêm dataSource để STT được tính lại khi có thay đổi
    viTriOptions,
  ]);

  // Cấu hình scroll
  const getScrollConfig = useCallback(() => {
    const columnWidths = columns.reduce(
      (sum, col) => sum + (col.width || 100),
      0
    );
    const minWidth = Math.max(columnWidths, window.innerWidth - 100);

    // Tăng rowHeight để hiển thị ảnh tốt hơn (ảnh 120px + padding + text)
    const rowHeight = 160;
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
