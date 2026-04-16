import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Empty, Input, Select, Table, Spin, Checkbox, message } from "antd";
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
  focusInvalidRowKey,
  onFocusInvalidRowHandled,
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

  // Scroll to invalid row and focus first editable input until validation is satisfied
  const tableWrapperRef = useRef(null);
  useEffect(() => {
    if (!focusInvalidRowKey) return;
    // Trên tablet/mobile DOM cập nhật chậm hơn, dùng delay dài hơn để đảm bảo bảng đã render và dòng đỏ đã hiển thị
    const isTouchDevice = typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);
    const delay = isTouchDevice ? 450 : 250;
    const timer = setTimeout(() => {
      const root = tableWrapperRef.current || document;
      const selector = `tr[data-row-key="${CSS.escape(String(focusInvalidRowKey))}"]`;
      const allRows = root.querySelectorAll?.(selector) || [];
      // Bảng có fixed cột thì có 2 dòng cùng key. Ưu tiên dòng trong .ant-table-body (vùng cuộn chính) để scroll + focus đúng trên cả tablet.
      const row =
        Array.from(allRows).find((r) => r.closest?.(".ant-table-body")) ||
        Array.from(allRows).find((r) => r.querySelector('input:not([type="hidden"]), select')) ||
        allRows[0];
      if (row) {
        // Tìm container scroll của bảng (ant-table-body) để cuộn đúng vùng
        let scrollParent = row.parentElement;
        while (scrollParent && scrollParent !== document.body) {
          const { overflowY } = getComputedStyle(scrollParent);
          const scrollHeight = scrollParent.scrollHeight;
          const clientHeight = scrollParent.clientHeight;
          const canScroll = scrollHeight > clientHeight && (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay");
          if (canScroll) {
            const rowRect = row.getBoundingClientRect();
            const containerRect = scrollParent.getBoundingClientRect();
            const rowOffsetInContent = scrollParent.scrollTop + (rowRect.top - containerRect.top);
            const viewHeight = scrollParent.clientHeight;
            const targetScroll = Math.max(0, rowOffsetInContent - Math.round(viewHeight / 3));
            const maxScroll = scrollParent.scrollHeight - viewHeight;
            scrollParent.scrollTop = Math.min(targetScroll, maxScroll);
            break;
          }
          scrollParent = scrollParent.parentElement;
        }
        // Luôn cuộn trang (viewport) để dòng lỗi nằm trong màn hình — bảng có thể nằm dưới fold
        row.scrollIntoView({ block: "center", behavior: "auto" });
        // Focus sau khi scroll đã áp dụng; trên tablet dùng thêm setTimeout để scroll kịp vẽ trước khi focus
        const focusInput = () => {
          const focusable = row.querySelector(
            'input:not([type="hidden"]), select, [tabindex]:not([tabindex="-1"])'
          );
          if (focusable) {
            focusable.focus({ preventScroll: true });
          }
          onFocusInvalidRowHandled?.();
        };
        if (isTouchDevice) {
          requestAnimationFrame(() => {
            setTimeout(focusInput, 80);
          });
        } else {
          requestAnimationFrame(() => {
            requestAnimationFrame(focusInput);
          });
        }
      } else {
        onFocusInvalidRowHandled?.();
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [focusInvalidRowKey, onFocusInvalidRowHandled]);

  // Prefetch danh sách mã lô cho một dòng cụ thể, luôn dùng dataSource mới nhất
  const loLoadingRef = useRef({});
  const loPageRef = useRef({});
  const loTotalPageRef = useRef({});

  const loadLoOptions = useCallback(
    async (keyword = "", record, openAfter = false, page = 1) => {
      if (!apiHandlers.fetchLoList || !record?.key || loLoadingRef.current[record.key]) return;

      loLoadingRef.current[record.key] = true;
      setLoadingLo((prev) => ({ ...prev, [record.key]: true }));
      try {
        const currentDataSource = dataSourceRef.current;
        const currentRecord =
          currentDataSource.find((item) => item.key === record.key) || record;

        const result = await apiHandlers.fetchLoList(
          keyword,
          currentRecord,
          page
        );

        // Hỗ trợ cả array (cũ) và object { options, totalPage } (mới)
        const fetchedOptions = Array.isArray(result) ? result : (result?.options || []);
        const totalPage = !Array.isArray(result) ? (result?.totalPage || 1) : 1;

        loPageRef.current[record.key] = page;
        loTotalPageRef.current[record.key] = totalPage;

        const latestDataSource = dataSourceRef.current;
        const latestRecord =
          latestDataSource.find((item) => item.key === record.key) ||
          currentRecord;

        const existingOptions = page === 1 ? [] : (latestRecord.loOptions || []);
        const mergedOptions = [...existingOptions, ...fetchedOptions];

        const updatedRecord = { ...latestRecord, loOptions: mergedOptions };
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
        loLoadingRef.current[record.key] = false;
        setLoadingLo((prev) => ({ ...prev, [record.key]: false }));
      }
    },
    [apiHandlers, onDataSourceUpdate]
  );

  // Prefetch danh sách vị trí cho một dòng cụ thể, quản lý state riêng như POS số lô
  const viTriLoadingRef = useRef({});
  const loadViTriOptions = useCallback(
    async (keyword = "", record, openAfter = false) => {
      if (!apiHandlers.fetchViTriList || !record?.key || viTriLoadingRef.current[record.key]) return;

      viTriLoadingRef.current[record.key] = true;
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
        viTriLoadingRef.current[record.key] = false;
        setLoadingViTri((prev) => ({ ...prev, [record.key]: false }));
      }
    },
    [apiHandlers, onDataSourceUpdate]
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
          inputMode="decimal"
          value={value}
          onChange={(e) => handleQuantityChange(e.target.value, record, field)}
          style={{
            width: "100%",
            textAlign: "center",
            fontWeight: "bold",
            borderColor:
              (field === (columnConfig.tongNhatField || "tong_nhat") &&
                (record.groupExceeded || record.rowExceededSlDon))
                ? "#ff4d4f"
                : undefined,
            boxShadow:
              (field === (columnConfig.tongNhatField || "tong_nhat") &&
                (record.groupExceeded || record.rowExceededSlDon))
                ? "0 0 0 2px rgba(255,77,79,0.2)"
                : undefined,
          }}
          className="vat-tu-table-input"
          title={
            field === (columnConfig.tongNhatField || "tong_nhat") &&
              record.rowExceededSlDon
              ? "SL nhặt vượt quá SL đơn của dòng"
              : field === (columnConfig.tongNhatField || "tong_nhat") &&
                record.groupExceeded
                ? "Tổng nhặt nhóm vượt Số lượng đơn"
                : undefined
          }
          tabIndex={-1}
          autoComplete="off"
          spellCheck={false}
        />
      );
    },
    [isEditMode, handleQuantityChange, columnConfig]
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
      ...(columnConfig.showStt !== false
        ? [
          {
            title: "STT",
            dataIndex: "key",
            key: "key",
            width: 60,
            align: "center",
            fixed: "left",
            ellipsis: true,
            render: (value, record, index) => {
              if (record.isChild) return "";
              let parentCount = 0;
              for (let i = 0; i < index; i++) {
                if (!dataSource[i]?.isChild) {
                  parentCount++;
                }
              }
              return parentCount + 1;
            },
          },
        ]
        : []),
      {
        title: "Ảnh",
        dataIndex: "image",
        key: "image",
        width: 150,
        align: "center",
        fixed: "left",
        ellipsis: false,
        render: (_, record) => {
          if (record.isChild) return "";
          const imageUrl = record.image || record.item?.image || "";
          if (!imageUrl) return null;
          const tenMatHang = record[columnConfig.tenMatHangField || "ten_mat_hang"] || record.maHang || "";
          return (
            <div style={{ display: "flex", justifyContent: "center", padding: "4px 0" }}>
              <img
                src={imageUrl}
                alt={tenMatHang}
                style={{
                  width: 120,
                  height: 120,
                  objectFit: "cover",
                  borderRadius: 6,
                  border: "1px solid #e8e8e8",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  cursor: "pointer",
                }}
                onError={(e) => {
                  // Ẩn ảnh nếu lỗi load
                  e.target.style.display = "none";
                }}
                onClick={() => {
                  if (imageUrl) {
                    window.open(imageUrl, "_blank");
                  }
                }}
                title="Click để xem ảnh lớn"
              />
            </div>
          );
        },
      },
      {
        title: "Mặt hàng",
        key: "mat_hang",
        width: 200,
        align: "center",
        ellipsis: false,
        render: (_, record) => {
          if (record.isChild) return "";
          const maHang = record.maHang || "";
          const tenMatHang = record[columnConfig.tenMatHangField || "ten_mat_hang"] || "";
          // Lấy mã vị trí và ĐVT từ record
          const currentRecord = dataSource.find((item) => item.key === record.key) || record;
          const maViTri = currentRecord[columnConfig.maViTriField || "ma_vi_tri"] || "";
          const dvt = currentRecord.dvt || "";

          // Tích hợp thông tin tồn vào cột Mặt hàng nếu config yêu cầu
          let stockInfo = null;
          if (columnConfig.integrateStockInfoInMatHang) {
            const soLuongTon = parseFloat(currentRecord[columnConfig.soLuongTonField || "so_luong_ton"] || 0);
            const tonKh = parseFloat(currentRecord[columnConfig.tonKhField || "ton_kh"] || 0);
            if (soLuongTon > 0 || tonKh > 0) {
              stockInfo = `Tồn: ${formatQuantityDisplay(soLuongTon)} / Tồn khả dụng: ${formatQuantityDisplay(tonKh)}`;
            }
          }

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
              {dvt && (
                <div
                  style={{
                    fontSize: "12px",
                    color: "#666",
                    marginTop: "2px",
                    fontWeight: 400,
                  }}
                >
                  {dvt}
                </div>
              )}
              {maViTri && (
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#ff4d4f",
                    marginTop: "6px",
                    letterSpacing: "0.5px",
                  }}
                >
                  {maViTri}
                </div>
              )}
              {stockInfo && (
                <div
                  style={{
                    fontSize: "12px",
                    color: "#237804",
                    marginTop: "4px",
                    fontWeight: 500,
                  }}
                >
                  {stockInfo}
                </div>
              )}
            </div>
          );
        },
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

          const isDuplicateMaLo = !!currentRecord._invalid_duplicate_ma_lo;
          const maLoValue = currentRecord.ma_lo ?? maLo ?? "";
          const clearVersion = currentRecord._ma_lo_clear_version ?? 0;
          return (
            <div
              style={{
                display: "flex",
                gap: 8,
                width: "100%",
                justifyContent: "center",
                ...(isDuplicateMaLo
                  ? { backgroundColor: "#ffccc7", border: "1px solid #ff4d4f", borderRadius: 4 }
                  : {}),
              }}
            >
              <Select
                key={`ma-lo-${record.key}-${String(maLoValue)}-${clearVersion}`}
                value={maLoValue || undefined}
                allowClear
                placeholder="Mã lô"
                size="small"
                style={{ width: 140 }}
                loading={isLoLoading}
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
                    loadLoOptions("", currentRecord, true, 1);
                  }
                }}
                listHeight={150} // Giới hạn chiều cao popup để luôn hiện scrollbar khi có 5 items
                onPopupScroll={(e) => {
                  const { scrollTop, scrollHeight, clientHeight } = e.target;
                  if (
                    scrollTop + clientHeight >= scrollHeight - 20
                  ) {
                    const currentPage = loPageRef.current[record.key] || 1;
                    const defaultTotalPage = record._loTotalPage || 1;
                    const totalPage = loTotalPageRef.current[record.key] || defaultTotalPage;
                    if (currentPage < totalPage && !isLoLoading) {
                      loadLoOptions("", record, false, currentPage + 1);
                    }
                  }
                }}
                onChange={(val) => {
                  const currentDataSource = dataSourceRef.current;
                  const currentRecord = currentDataSource.find((item) => item.key === record.key);
                  // Match POS behavior: ensure value is string (val || "") 
                  // Preserve loOptions when updating ma_lo
                  onSelectChange(val || "", currentRecord || record, "ma_lo");
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
          width: 90,
          align: "center",
          ellipsis: true,
          render: (value, record) => {
            if (!isEditMode) {
              return value;
            }
            const currentRecord = dataSource.find((item) => item.key === record.key) || record;
            const isDuplicateMaLo = !!currentRecord._invalid_duplicate_ma_lo;
            return (
              <Input
                value={value}
                onChange={(e) => onSelectChange(e.target.value, record, "ma_lo")}
                style={{
                  width: "100%",
                  textAlign: "center",
                  ...(isDuplicateMaLo
                    ? { backgroundColor: "#ffccc7", borderColor: "#ff4d4f" }
                    : {}),
                }}
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

    // Thêm cột số lượng đề nghị (SL đơn)
    // Dòng con: được phép sửa SL đơn; dòng mẹ tự trừ theo tổng - sum(con)
    if (columnConfig.showSoLuongDeNghi !== false) {
      const soLuongDeNghiField = columnConfig.soLuongDeNghiField || "so_luong";
      baseColumns.push({
        title: columnConfig.soLuongDeNghiTitle === "Số lượng đơn" ? "SL đơn" : (columnConfig.soLuongDeNghiTitle || "Số lượng đề nghị"),
        dataIndex: soLuongDeNghiField,
        key: "so_luong_de_nghi",
        width: 65,
        align: "center",
        ellipsis: true,
        render: (value, record) => {
          const isEditable = columnConfig.soLuongDeNghiEditable !== false;
          return renderQuantityInput(
            value,
            record,
            soLuongDeNghiField,
            isEditable
          );
        },
      });
    }

    // Thêm cột số lượng tồn (SL tồn) - đặt trước cột Nhặt
    if (columnConfig.showSoLuongTon) {
      baseColumns.push({
        title: "SL tồn",
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

    // Thêm cột tồn kho (Tồn KH)
    if (columnConfig.showTonKh) {
      baseColumns.push({
        title: "Tồn khả dụng",
        dataIndex: columnConfig.tonKhField || "ton_kh",
        key: "ton_kh",
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
                color: value && value > 0 ? "#1890ff" : "#999",
              }}
            >
              {value !== null && value !== undefined ? formatQuantityDisplay(value) : "-"}
            </span>
          ),
      });
    }

    // Thêm cột checkbox Nhặt (cho phiếu nhặt hàng)
    if (columnConfig.showNhatCheckbox) {
      baseColumns.push({
        title: "Nhặt",
        dataIndex: columnConfig.nhatCheckboxField || "nhat_checkbox",
        key: "nhat_checkbox",
        width: 40,
        align: "center",
        ellipsis: true,
        onCell: (record) => ({
          onClick: (e) => {
            // Stop propagation to prevent row click handlers from interfering
            e.stopPropagation();
          },
        }),
        render: (value, record, index) => {
          const currentRecord = dataSource.find(item => item.key === record.key) || record;
          const tongNhatField = columnConfig.tongNhatField || "tong_nhat";
          const soLuongDeNghiField = columnConfig.soLuongDeNghiField || "soLuongDeNghi";
          const soLuongDon = parseFloat(currentRecord[soLuongDeNghiField] ?? currentRecord.so_luong ?? 0);

          // Dòng con: chỉ hiển thị ô Nhặt sau khi đã nhập SL đơn > 0
          if (currentRecord.isChild && soLuongDon <= 0) {
            return "";
          }

          const tongNhat = parseFloat(currentRecord[tongNhatField] || 0);
          const isChecked = tongNhat > 0 && Math.abs(tongNhat - soLuongDon) < 0.001;

          if (!isEditMode) {
            return isChecked ? "✓" : "";
          }

          return (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}
            >
              <Checkbox
                key={`checkbox-${currentRecord.key}-${tongNhat}`}
                checked={isChecked}
                onChange={(e) => {
                  e.stopPropagation();
                  const checked = e.target.checked;
                  const latestRecord = dataSource.find(item => item.key === currentRecord.key) || currentRecord;
                  const latestSoLuongDon = parseFloat(latestRecord[soLuongDeNghiField] || latestRecord.so_luong || 0);
                  const newTongNhat = checked ? latestSoLuongDon : 0;
                  if (onQuantityChange) {
                    onQuantityChange(newTongNhat, latestRecord, tongNhatField);
                  }
                }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          );
        },
      });
    }

    // Thêm cột tổng nhặt (SL nhặt) - đặt sau cột Nhặt
    if (columnConfig.showTongNhat) {
      baseColumns.push({
        title: "SL nhặt",
        dataIndex: columnConfig.tongNhatField || "tong_nhat",
        key: "tong_nhat",
        width: 70,
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

    // Thêm cột Ghi chú KD (nếu có) - chỉ hiển thị, text xuống dòng khi dài
    let ghiChuKDColumn = null;
    if (columnConfig.showGhiChuKD) {
      ghiChuKDColumn = {
        title: "Ghi chú KD",
        dataIndex: columnConfig.ghiChuKDField || "ghi_chu_dh",
        key: "ghi_chu_dh",
        width: 100,
        align: "center",
        ellipsis: false,
        render: (value) => (
          <span className="vat-tu-table-cell-wrap">{value || ""}</span>
        ),
      };
    }

    // Thêm cột ghi chú: mặc định, text xuống dòng khi dài
    let ghiChuColumn = null;
    if (columnConfig.showGhiChu) {
      ghiChuColumn = {
        title: columnConfig.ghiChuTitle || "Ghi chú",
        dataIndex: columnConfig.ghiChuField || "ghi_chu",
        key: "ghi_chu",
        width: 120,
        align: "center",
        ellipsis: false,
        render: (value, record) => {
          if (!isEditMode) {
            return (
              <span className="vat-tu-table-cell-wrap">{value || ""}</span>
            );
          }
          return (
            <Input.TextArea
              value={value || ""}
              onChange={(e) => onSelectChange(e.target.value, record, columnConfig.ghiChuField || "ghi_chu")}
              style={{ width: "100%", minHeight: 32 }}
              className="vat-tu-table-input"
              placeholder="Nhập ghi chú"
              autoSize={{ minRows: 1, maxRows: 6 }}
              rows={1}
            />
          );
        },
      };
      if (!columnConfig.placeGhiChuAtEnd) {
        baseColumns.push(ghiChuColumn);
        ghiChuColumn = null;
      }
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

    // Nếu cần, thêm cột ghi chú KD và ghi chú ở cuối trước khi thêm thao tác
    if (ghiChuKDColumn) {
      baseColumns.push(ghiChuKDColumn);
    }
    if (ghiChuColumn) {
      baseColumns.push(ghiChuColumn);
    }

    // Thêm cột thao tác (chỉ khi không bị ẩn)
    if (columnConfig.showThaoTac !== false) {
      baseColumns.push({
        title: "Thao tác",
        key: "action",
        width: columnConfig.useAddButtonInsteadOfDelete ? 120 : 80, // Tăng width nếu có cả nút xóa và nút thêm
        align: "center",
        render: (_, record, index) => {
          if (columnConfig.useAddButtonInsteadOfDelete) {
            // Dòng cha: hiển thị cả nút xóa và nút thêm dòng con
            const groupKey = record.isChild ? record.parentKey : record.key;
            // Tìm xem đây có phải là dòng cuối cùng của nhóm vật tư này không để hiển thị nút +
            const isLastInGroup =
              index === dataSource.length - 1 ||
              (dataSource[index + 1].isChild
                ? dataSource[index + 1].parentKey !== groupKey
                : true);

            return (
              <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                {(!record.isChild &&
                columnConfig.preventDeleteMainRow &&
                !record.isNewlyAdded) ? null : (
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
                )}
                {isLastInGroup && (
                  <Button
                    type="text"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      if (!isEditMode) return;
                      const tongueNhatValue = parseFloat(record.tong_nhat || 0);
                      if (tongueNhatValue <= 0) {
                        message.warning("Vui lòng nhập số lượng nhặt trước khi cộng dòng.");
                        return;
                      }
                      if (otherProps.onAddItem) {
                        otherProps.onAddItem(index, record);
                      }
                    }}
                    title="Thêm dòng con"
                    disabled={
                      !isEditMode ||
                      parseFloat(record.so_luong || record.soLuongDeNghi || 0) <= 0 ||
                      parseFloat(record.tong_nhat || 0) >= parseFloat(record.so_luong || record.soLuongDeNghi || 0)
                    }
                    className="vat-tu-add-btn"
                    style={{ color: "#52c41a" }}
                  />
                )}
              </div>
            );
          }
          // Trường hợp không dùng useAddButtonInsteadOfDelete: cả dòng cha và dòng con đều có nút xóa
          // Disable nút xóa cho dòng chính (không phải dòng con)
          const isMainRowLocked = !record.isChild && columnConfig.preventDeleteMainRow && !record.isNewlyAdded;
          return (
            <Button
              type="text"
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => onDeleteItem(index, isEditMode)}
              title={record.isChild ? "Xóa dòng" : (isMainRowLocked ? "Không thể xóa dòng chính" : "Xóa dòng")}
              disabled={!isEditMode || isMainRowLocked}
              className="vat-tu-delete-btn"
            />
          );
        },
      });
    }

    return baseColumns;
  }, [
    columnConfig,
    renderQuantityInput,
    renderMaKhoSelect,
    onDeleteItem,
    isEditMode,
    otherProps,
    dataSource,
    viTriOptions,
    onQuantityChange,
    loadingLo,
    loadingViTri,
    loadLoOptions,
    onSelectChange,
    openLo,
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
    const maxRows = 25;
    const y = headerHeight + rowHeight * maxRows;

    return { x: minWidth, y };
  }, [columns]);

  return (
    <div ref={tableWrapperRef} style={{ width: "100%" }}>
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
    </div>
  );
};

export default VatTuTable;
