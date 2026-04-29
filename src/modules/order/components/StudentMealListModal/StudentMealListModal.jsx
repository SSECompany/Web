import { CheckOutlined } from "@ant-design/icons";
import {
  Button,
  Input,
  Modal,
  notification,
  Select,
  Spin,
  Table,
  Tag,
} from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useReactToPrint } from "react-to-print";
import {
  apiConfirmStudentOrder,
  apiGetRetailOrderPostpaidStudentOrders,
  multipleTablePutApi,
} from "../../../../api";
import showConfirm from "../../../../components/common/Modal/ModalConfirm";
import jwt from "../../../../utils/jwt";
import { addTab, setListOrderInfo, switchTab } from "../../store/order";
import "../PrepaidStudentMealListModal/PrepaidStudentMealListModal.css";
import PrintComponent from "../RetailOrderListModal/PrintComponent/PrintComponent";

const StudentMealListModal = ({ isOpen, onClose }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20; // Cố định pageSize = 20
  const [totalRecords, setTotalRecords] = useState(0);
  const [allData, setAllData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  // Define stable empty object to prevent unnecessary re-renders
  const EMPTY_FILTERS = {};
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  // State để quản lý giá trị input cho từng record
  const [inputValues, setInputValues] = useState({});

  // Tối ưu hóa handler cho input change
  const handleInputChange = useCallback((recordKey, value, maxValue) => {
    const parsedValue = parseInt(value) || 0;

    setInputValues((prev) => {
      // Chỉ update nếu giá trị thực sự thay đổi
      const currentValue = prev[recordKey] || 0;
      let newValue = parsedValue;

      if (parsedValue > maxValue) {
        newValue = maxValue;
        notification.warning({
          message: `Số lượng không được vượt quá ${maxValue} (số lượng còn lại)`,
          duration: 2,
        });
      } else if (parsedValue < 0) {
        newValue = 0;
      }

      // Chỉ update state nếu giá trị thực sự thay đổi
      if (currentValue === newValue) {
        return prev;
      }

      return {
        ...prev,
        [recordKey]: newValue,
      };
    });
  }, []);

  // Create stable filters object to prevent unnecessary API calls
  const stableFilters = useMemo(() => filters, [JSON.stringify(filters)]);
  const dispatch = useDispatch();

  const { id, storeId, unitId } = useSelector(
    (state) => state.claimsReducer.userInfo || {}
  );
  const [printMaster, setPrintMaster] = useState({});
  const [printDetail, setPrintDetail] = useState([]);
  const printContent = useRef();
  const lastApiCall = useRef({ pageIndex: 0, filters: {} });

  // Tính chiều cao scroll động - tối đa 10 dòng
  const getScrollY = useMemo(() => {
    const rowCount = allData.length;
    if (rowCount === 0) return 100;
    // Tối đa 10 dòng, mỗi dòng 55px
    const maxRows = 10;
    const actualRows = Math.min(rowCount, maxRows);
    return actualRows * 55;
  }, [allData.length]);

  const rawToken = localStorage.getItem("access_token");
  const claims =
    rawToken && rawToken.split(".").length === 3 ? jwt.getClaims?.() || {} : {};
  const fullName = claims?.FullName;

  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const tabs = useSelector((state) => state.orders.orders);

  const fetchStudentMealData = useCallback(
    async (pageIndex = currentPage, customFilters = null) => {
      if (!isOpen || isLoading) return; // Chỉ gọi API khi modal đang mở và không đang loading

      // Sử dụng customFilters nếu được truyền vào, ngược lại sử dụng stableFilters
      const filtersToUse = customFilters || stableFilters;

      // Kiểm tra xem có phải duplicate call không
      const currentCall = { pageIndex, filters: filtersToUse };
      if (
        lastApiCall.current.pageIndex === pageIndex &&
        JSON.stringify(lastApiCall.current.filters) ===
          JSON.stringify(filtersToUse)
      ) {
        return; // Bỏ qua nếu là duplicate call
      }
      lastApiCall.current = currentCall;

      setIsLoading(true);
      try {
        // Sử dụng API mới cho sinh viên trả sau
        const today = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
        const res = await apiGetRetailOrderPostpaidStudentOrders({
          storeId: storeId || "",
          ts_yn: 1, // 1 = sinh viên trả sau
          unitId: unitId || "PHENIKAA",
          dateFrom: filtersToUse.dateFrom || today,
          dateTo: filtersToUse.dateTo || today,
          pageIndex: pageIndex,
          pageSize: pageSize,
          // Thêm các tham số filter
          ten_bp: filtersToUse.ten_bp || "",
          ten_kh: filtersToUse.ten_kh || "",
          ma_ca: filtersToUse.ma_ca || "",
          ten_vt: filtersToUse.ten_vt || "",
        });

        const updatedData = Array.isArray(res?.listObject[0])
          ? res.listObject[0]
          : [];
        // Robustly detect pagination info regardless of index/shape
        const listObject = Array.isArray(res?.listObject) ? res.listObject : [];
        let paginationInfo = {};
        for (let i = 0; i < listObject.length; i++) {
          const candidate = Array.isArray(listObject[i]) ? listObject[i][0] : null;
          if (
            candidate &&
            (candidate.totalRecord !== undefined ||
              candidate.totalrecord !== undefined ||
              candidate.totalpage !== undefined ||
              candidate.pagesize !== undefined)
          ) {
            paginationInfo = candidate;
            break;
          }
        }
        const totalRecords = Number(
          paginationInfo.totalRecord ?? paginationInfo.totalrecord ?? 0
        ) || updatedData.length;

        setAllData(updatedData);
        setTotalRecords(totalRecords);
        dispatch(setListOrderInfo(updatedData));

        // Reset input values khi load dữ liệu mới - luôn bắt đầu từ 0
        const newInputValues = {};
        updatedData.forEach((record) => {
          const recordKey = `${record.ma_kh}_${record.ma_ca}_${record.ma_vt}_${record.ngay_ct}_${record.ma_bp}`;
          newInputValues[recordKey] = 0; // Luôn bắt đầu từ 0
        });
        setInputValues(newInputValues);
      } catch (err) {
        console.error("Lỗi khi lấy danh sách suất ăn sinh viên trả sau:", err);
        notification.error({
          message: "Lỗi khi tải danh sách suất ăn sinh viên trả sau",
          duration: 4,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [stableFilters, id, unitId, storeId, dispatch, isOpen, isLoading]
  );

  useEffect(() => {
    if (isOpen) {
      fetchStudentMealData(1, filters);
    } else {
      // Reset state khi đóng modal
      setCurrentPage(1);
      setFilters(EMPTY_FILTERS);
      setAllData([]);
      setTotalRecords(0);
      setInputValues({});
      lastApiCall.current = { pageIndex: 0, filters: {} };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Sử dụng data trực tiếp từ API (backend pagination)
  const currentData = allData;

  // Helper function để group detail data
  const groupDetailData = (flatDetailData, useUniqueId = true) => {
    const groupedDetailData = [];

    // Add parent items first
    flatDetailData.forEach((item) => {
      const { ma_vt_root } = item;
      if (!ma_vt_root) {
        groupedDetailData.push({ ...item, extras: [] });
      }
    });

    // Add child items to their parents
    flatDetailData.forEach((item) => {
      const { ma_vt_root, uniqueid, ma_vt } = item;
      if (ma_vt_root) {
        const parent = groupedDetailData.find((p) =>
          useUniqueId ? p.uniqueid === uniqueid : p.ma_vt === ma_vt_root
        );
        if (parent) {
          parent.extras = parent.extras || [];
          parent.extras.push(item);
        }
      }
    });

    return groupedDetailData;
  };

  // Helper function để fetch order detail
  const fetchOrderDetail = async (stt_rec) => {
    const res = await multipleTablePutApi({
      store: "api_get_data_detail_retail_order",
      param: { stt_rec },
      data: {},
    });

    if (res?.responseModel?.isSucceded) {
      const masterData = res?.listObject[0]?.[0] || {};
      const flatDetailData = res?.listObject[1] || [];
      return { masterData, flatDetailData };
    }
    throw new Error(
      res?.responseModel?.message || "Lỗi khi tải chi tiết đơn hàng"
    );
  };

  // Helper function để xử lý filter
  const handleFilter = (key, value, confirm) => {
    confirm();
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    setCurrentPage(1); // Reset về trang 1 khi filter
    // Gọi API ngay lập tức khi filter thay đổi với pageIndex = 1 và truyền filters mới
    fetchStudentMealData(1, newFilters);
  };

  // Helper function để xóa tất cả filter
  const handleClearAllFilters = () => {
    setFilters(EMPTY_FILTERS);
    setCurrentPage(1);
    fetchStudentMealData(1, EMPTY_FILTERS);
  };

  // Helper function để xóa một filter cụ thể
  const handleRemoveFilter = (key) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    setFilters(newFilters);
    setCurrentPage(1);
    fetchStudentMealData(1, newFilters);
  };

  // Helper function để render filter tags
  const renderFilterTags = () => {
    const activeFilters = Object.keys(filters).filter((key) => filters[key]);

    if (activeFilters.length === 0) return null;

    return (
      <div className="filter-tags-inline">
        {activeFilters.map((key) => {
          const value = filters[key];
          let displayText = value;
          let tagColor = "blue";

          // Customize display text based on filter type
          switch (key) {
            case "ten_bp":
              displayText = `Bộ phận: ${value}`;
              tagColor = "green";
              break;
            case "ten_kh":
              displayText = `Khách hàng: ${value}`;
              tagColor = "orange";
              break;
            case "ma_ca":
              const caMap = {
                1: "CA1",
                2: "CA2",
                3: "CA3",
                CA1: "CA1",
                CA2: "CA2",
                CA3: "CA3",
              };
              displayText = `Ca ăn: ${caMap[value] || value}`;
              tagColor = "purple";
              break;
            case "ten_vt":
              displayText = `Vật tư: ${value}`;
              tagColor = "cyan";
              break;
            default:
              displayText = `${key}: ${value}`;
          }

          return (
            <Tag
              key={key}
              closable
              color={tagColor}
              onClose={() => handleRemoveFilter(key)}
              className="filter-tag-inline"
            >
              {displayText}
            </Tag>
          );
        })}
      </div>
    );
  };

  // Helper function để xử lý thay đổi trang
  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Gọi API ngay lập tức khi thay đổi trang với pageIndex mới và filters hiện tại
    fetchStudentMealData(page, filters);
  };

  const columns = [
    {
      title: "STT",
      key: "stt",
      width: 60,
      align: "center",
      render: (_, __, index) => {
        return (currentPage - 1) * pageSize + index + 1;
      },
    },
    {
      title: "Ngày chứng từ",
      dataIndex: "ngay_ct",
      key: "ngay_ct",
      width: 120,
      align: "center",
      render: (date) => {
        if (!date) return "-";
        return dayjs(date).format("DD/MM/YYYY");
      },
    },
    // {
    //   title: "Mã bộ phận",
    //   dataIndex: "ma_bp",
    //   key: "ma_bp",
    //   width: 150,
    //   align: "center",
    //   filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
    //     <div className="filter-dropdown">
    //       <Input
    //         placeholder="Tìm mã bộ phận"
    //         value={selectedKeys[0]}
    //         onChange={(e) =>
    //           setSelectedKeys(e.target.value ? [e.target.value] : [])
    //         }
    //         onPressEnter={() => handleFilter("ma_bp", selectedKeys[0], confirm)}
    //         style={{ marginBottom: 8, display: "block" }}
    //       />
    //       <Button
    //         className="search_button"
    //         type="primary"
    //         onClick={() => handleFilter("ma_bp", selectedKeys[0], confirm)}
    //         size="small"
    //       >
    //         Tìm kiếm
    //       </Button>
    //     </div>
    //   ),
    // },
    {
      title: "Tên bộ phận",
      dataIndex: "ten_bp",
      key: "ten_bp",
      width: 200,
      align: "left",
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
        <div className="filter-dropdown">
          <Input
            placeholder="Tìm tên bộ phận"
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() =>
              handleFilter("ten_bp", selectedKeys[0], confirm)
            }
            style={{ marginBottom: 8, display: "block" }}
          />
          <Button
            className="search_button"
            type="primary"
            onClick={() => handleFilter("ten_bp", selectedKeys[0], confirm)}
            size="small"
          >
            Tìm kiếm
          </Button>
        </div>
      ),
    },
    // {
    //   title: "Mã khách hàng",
    //   dataIndex: "ma_kh",
    //   key: "ma_kh",
    //   width: 150,
    //   align: "center",
    //   filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
    //     <div className="filter-dropdown">
    //       <Input
    //         placeholder="Tìm mã khách hàng"
    //         value={selectedKeys[0]}
    //         onChange={(e) =>
    //           setSelectedKeys(e.target.value ? [e.target.value] : [])
    //         }
    //         onPressEnter={() => handleFilter("ma_kh", selectedKeys[0], confirm)}
    //         style={{ marginBottom: 8, display: "block" }}
    //       />
    //       <Button
    //         className="search_button"
    //         type="primary"
    //         onClick={() => handleFilter("ma_kh", selectedKeys[0], confirm)}
    //         size="small"
    //       >
    //         Tìm kiếm
    //       </Button>
    //     </div>
    //   ),
    // },
    {
      title: "Tên khách hàng",
      dataIndex: "ten_kh",
      key: "ten_kh",
      width: 220,
      align: "left",
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
        <div className="filter-dropdown">
          <Input
            placeholder="Tìm tên khách hàng"
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() =>
              handleFilter("ten_kh", selectedKeys[0], confirm)
            }
            style={{ marginBottom: 8, display: "block" }}
          />
          <Button
            className="search_button"
            type="primary"
            onClick={() => handleFilter("ten_kh", selectedKeys[0], confirm)}
            size="small"
          >
            Tìm kiếm
          </Button>
        </div>
      ),
    },
    {
      title: "Ca ăn",
      dataIndex: "ma_ca",
      key: "ma_ca",
      width: 120,
      align: "center",
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
        <div className="filter-dropdown">
          <Select
            placeholder="Chọn ca ăn"
            value={selectedKeys[0]}
            onChange={(value) => setSelectedKeys(value ? [value] : [])}
            style={{ width: "100%", marginBottom: 8 }}
          >
            <Select.Option value="CA1">CA1</Select.Option>
            <Select.Option value="CA2">CA2</Select.Option>
            <Select.Option value="CA3">CA3</Select.Option>
          </Select>
          <Button
            className="search_button"
            type="primary"
            onClick={() => handleFilter("ma_ca", selectedKeys[0], confirm)}
            size="small"
          >
            Tìm kiếm
          </Button>
        </div>
      ),
    },
    // {
    //   title: "Mã vật tư",
    //   dataIndex: "ma_vt",
    //   key: "ma_vt",
    //   width: 150,
    //   align: "center",
    //   filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
    //     <div className="filter-dropdown">
    //       <Input
    //         placeholder="Tìm mã vật tư"
    //         value={selectedKeys[0]}
    //         onChange={(e) =>
    //           setSelectedKeys(e.target.value ? [e.target.value] : [])
    //         }
    //         onPressEnter={() => handleFilter("ma_vt", selectedKeys[0], confirm)}
    //         style={{ marginBottom: 8, display: "block" }}
    //       />
    //       <Button
    //         className="search_button"
    //         type="primary"
    //         onClick={() => handleFilter("ma_vt", selectedKeys[0], confirm)}
    //         size="small"
    //       >
    //         Tìm kiếm
    //       </Button>
    //     </div>
    //   ),
    // },
    {
      title: "Tên vật tư",
      dataIndex: "ten_vt",
      key: "ten_vt",
      width: 220,
      align: "left",
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
        <div className="filter-dropdown">
          <Input
            placeholder="Tìm tên vật tư"
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() =>
              handleFilter("ten_vt", selectedKeys[0], confirm)
            }
            style={{ marginBottom: 8, display: "block" }}
          />
          <Button
            className="search_button"
            type="primary"
            onClick={() => handleFilter("ten_vt", selectedKeys[0], confirm)}
            size="small"
          >
            Tìm kiếm
          </Button>
        </div>
      ),
    },
    {
      title: "Số lượng",
      dataIndex: "so_luong",
      key: "so_luong",
      width: 100,
      align: "center",
      onHeaderCell: () => ({
        onClick: (e) => e.stopPropagation(),
      }),
      render: (amount) => (
        <span style={{ color: "#1890ff", fontWeight: "600" }}>
          {Number(amount || 0).toLocaleString()}
        </span>
      ),
    },
    {
      title: "Đã nhận",
      dataIndex: "so_luong_da_nhan",
      key: "so_luong_da_nhan",
      width: 100,
      align: "center",
      onHeaderCell: () => ({
        onClick: (e) => e.stopPropagation(),
      }),
      render: (amount) => (
        <span style={{ color: "#52c41a", fontWeight: "600" }}>
          {Number(amount || 0).toLocaleString()}
        </span>
      ),
    },
    {
      title: "Nhập số lượng",
      key: "input_quantity",
      width: 120,
      align: "center",
      render: (_, record) => {
        // Tạo unique key cho record - bao gồm ma_bp để tránh trùng lặp
        const recordKey = `${record.ma_kh}_${record.ma_ca}_${record.ma_vt}_${record.ngay_ct}_${record.ma_bp}`;
        const currentValue =
          inputValues[recordKey] !== undefined ? inputValues[recordKey] : 0; // Luôn bắt đầu từ 0

        const handleInputChangeLocal = (inputValue) => {
          // Số lượng tối đa có thể nhập = số lượng - đã nhận
          const maxValue = record.so_luong - (record.so_luong_da_nhan || 0);
          handleInputChange(recordKey, inputValue, maxValue);
        };

        return (
          <Input
            type="number"
            min="0"
            max={record.so_luong - (record.so_luong_da_nhan || 0)}
            value={currentValue}
            style={{ width: "80px", textAlign: "center" }}
            className="hide-number-input-spinners"
            onChange={(e) => handleInputChangeLocal(e.target.value)}
            onBlur={(e) => handleInputChangeLocal(e.target.value)}
            onKeyDown={(e) => {
              // Chặn phím mũi tên lên/xuống và các phím không mong muốn
              if (
                e.key === "ArrowUp" ||
                e.key === "ArrowDown" ||
                e.key === "e" ||
                e.key === "E" ||
                e.key === "+" ||
                e.key === "-"
              ) {
                e.preventDefault();
              }
            }}
            onPaste={(e) => {
              e.preventDefault();
              const pastedText = e.clipboardData.getData("text");
              handleInputChangeLocal(pastedText);
            }}
          />
        );
      },
    },
    {
      title: "Chức năng",
      key: "action",
      width: 80,
      fixed: "right",
      align: "center",
      render: (_, record) => (
        <Button
          icon={<CheckOutlined />}
          onClick={() => handleApprove(record)}
          type="primary"
          size="small"
          className="approve_button"
          disabled={
            isEditingOrder ||
            record.so_luong_da_nhan >= record.so_luong ||
            record.so_luong - (record.so_luong_da_nhan || 0) <= 0
          }
          title="Xác nhận"
        />
      ),
    },
  ];

  const handleEdit = async (record) => {
    if (isEditingOrder) return;
    setIsEditingOrder(true);
    try {
      // Tạo unique key từ các field của record - bao gồm ma_bp để tránh trùng lặp
      const recordKey = `${record.ma_kh}_${record.ma_ca}_${record.ma_vt}_${record.ngay_ct}_${record.ma_bp}`;
      const existingTab = tabs.some(
        (tab) => tab.master.recordKey === recordKey
      );
      if (existingTab) {
        notification.error({
          message: "Tab đã tồn tại!",
          duration: 3,
        });
        setIsEditingOrder(false);
        return;
      }

      // Tạo masterData từ record hiện tại
      const masterData = {
        ...record,
        recordKey: recordKey,
        ma_ban: record.ma_kh, // Sử dụng ma_kh làm ma_ban
        ten_kh: record.ten_kh,
        ma_kh: record.ma_kh,
        ca_an: record.ma_ca,
        ma_vt: record.ma_vt,
        ten_vt: record.ten_vt,
        so_luong: record.so_luong,
        ngay_ct: record.ngay_ct,
        ma_bp: record.ma_bp,
        ten_bp: record.ten_bp,
        StoreID: record.ma_bp,
      };

      // Tạo detailData từ record
      const detailData = [
        {
          ...record,
          uniqueid: recordKey,
          ma_vt_root: null,
          extras: [],
        },
      ];

      const tableData = {
        name: record.ma_kh,
        id: record.ma_kh,
      };

      const internalId = `${tableData.id}_${Date.now()}`;
      dispatch(
        addTab({
          tableName: tableData.name,
          tableId: tableData.id,
          isRealtime: false,
          internalId,
          master: masterData,
          detail: detailData,
          metadata: {
            isPostpaidStudent: true,
            typeStudent: "postpaid_student",
          },
        })
      );
      dispatch(switchTab(internalId));
      onClose();
    } catch (err) {
      console.error("Lỗi khi tạo tab mới:", err);
      notification.error({
        message: "Lỗi khi tạo tab mới",
        duration: 4,
      });
    } finally {
      setIsEditingOrder(false);
    }
  };

  const handlePrint = useReactToPrint({
    content: () => printContent.current,
    documentTitle: "Print Postpaid Student Meal",
    copyStyles: false,
  });

  const handleApprove = async (record) => {
    showConfirm({
      title: `Bạn có chắc chắn muốn xác nhận suất ăn cho ${record.ten_kh} - ${record.ma_ca}?`,
      onOk: async () => {
        if (isEditingOrder) return;
        setIsEditingOrder(true);
        try {
          // Tạo unique key từ các field của record - bao gồm ma_bp để tránh trùng lặp
          const recordKey = `${record.ma_kh}_${record.ma_ca}_${record.ma_vt}_${record.ngay_ct}_${record.ma_bp}`;
          const inputQuantity =
            inputValues[recordKey] || record.so_luong_da_nhan || 0;

          // Kiểm tra số lượng nhập không được để 0
          if (!inputQuantity || inputQuantity <= 0) {
            notification.error({
              message: "Vui lòng nhập số lượng lớn hơn 0 trước khi xác nhận!",
              duration: 3,
            });
            setIsEditingOrder(false);
            return;
          }

          // Gọi API xác nhận suất ăn sinh viên trả sau
          const confirmResult = await apiConfirmStudentOrder({
            ngay_ct: record.ngay_ct,
            ma_kh: record.ma_kh,
            storeId: record.ma_bp,
            ca_an: record.ma_ca,
            ma_vt: record.ma_vt,
            so_luong: inputQuantity,
            ts_yn: 1, // 1 = trả sau
            unitId: unitId || "PHENIKAA",
            userId: id,
          });

          if (confirmResult?.responseModel?.isSucceded) {
            notification.success({
              message: "Xác nhận suất ăn thành công!",
              duration: 3,
            });

            // Lấy data từ response để tạo tab mới
            const masterData = confirmResult?.listObject[0]?.[0] || {};
            const detailData = confirmResult?.listObject[1] || [];

            if (masterData && Object.keys(masterData).length > 0) {
              // Tạo unique key cho tab
              const tabKey = `${masterData.ma_kh}_${
                masterData.ca_an
              }_${Date.now()}`;

              // Kiểm tra xem tab đã tồn tại chưa
              const existingTab = tabs.some(
                (tab) =>
                  tab.master.ma_kh === masterData.ma_kh &&
                  tab.master.ca_an === masterData.ca_an &&
                  tab.master.ngay_ct === masterData.ngay_ct
              );

              if (!existingTab) {
                // Tạo tableData
                const tableData = {
                  name: masterData.ma_kh || record.ma_kh,
                  id: masterData.ma_kh || record.ma_kh,
                };

                const internalId = `${tableData.id}_${Date.now()}`;

                // Dispatch để tạo tab mới với metadata đánh dấu đã xác nhận
                dispatch(
                  addTab({
                    tableName: tableData.name,
                    tableId: tableData.id,
                    isRealtime: false,
                    internalId,
                    master: masterData,
                    detail: detailData,
                    metadata: {
                      isPostpaidStudent: true,
                      isReadOnly: true,
                      isConfirmed: true,
                      typeStudent: "postpaid_student",
                    },
                  })
                );

                // Chuyển sang tab mới
                dispatch(switchTab(internalId));

                // Đóng modal
                onClose();
              } else {
                notification.warning({
                  message: "Tab đã tồn tại cho khách hàng này!",
                  duration: 3,
                });
              }
            }

            // Refresh data sau khi xác nhận thành công
            fetchStudentMealData(currentPage, filters);
          } else {
            notification.error({
              message:
                confirmResult?.responseModel?.message ||
                "Lỗi khi xác nhận suất ăn",
              duration: 4,
            });
          }
        } catch (err) {
          console.error("Lỗi khi xác nhận suất ăn:", err);
          notification.error({
            message: "Lỗi khi xác nhận suất ăn",
            duration: 4,
          });
        } finally {
          setIsEditingOrder(false);
        }
      },
    });
  };

  return (
    <>
      <Modal
        open={isOpen}
        width="95%"
        title="Danh sách suất ăn sinh viên trả sau"
        destroyOnClose
        onCancel={onClose}
        footer={null}
        centered
      >
        <div className="prepaid-student-meal-modal-container">
          {/* Nút xóa tất cả filter */}
          {Object.keys(filters).some((key) => filters[key]) && (
            <div className="clear-filters-container">
              <div className="clear-filters-info">
                <i
                  className="pi pi-filter"
                  style={{ fontSize: "16px", color: "#1890ff" }}
                ></i>
                <span>
                  Đang áp dụng{" "}
                  {Object.keys(filters).filter((key) => filters[key]).length} bộ
                  lọc
                </span>
                {/* Hiển thị filter tags ngay trong container */}
                {renderFilterTags()}
              </div>
              <Button
                type="default"
                onClick={handleClearAllFilters}
                className="clear-filters-button"
                icon={
                  <i className="pi pi-times" style={{ fontSize: "12px" }}></i>
                }
              >
                Xóa tất cả
              </Button>
            </div>
          )}

          {isLoading ? (
            <Spin size="large" />
          ) : (
            <Table
              dataSource={currentData}
              columns={columns}
              rowKey={(record) => {
                // Tạo unique key ổn định từ các field của record - bao gồm ma_bp để tránh trùng lặp
                return `${record.ma_kh}_${record.ma_ca}_${record.ma_vt}_${record.ngay_ct}_${record.ma_bp}`;
              }}
              className="prepaid-student-meal-table"
              scroll={{ x: "max-content", y: getScrollY }}
              size="middle"
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: totalRecords,
                showSizeChanger: false,
                showQuickJumper: false,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} của ${total} bản ghi`,
                onChange: handlePageChange,
              }}
            />
          )}
        </div>
      </Modal>
      <div style={{ display: "none" }}>
        <PrintComponent
          ref={printContent}
          master={printMaster}
          detail={printDetail}
          fullName={fullName}
        />
      </div>
    </>
  );
};

export default StudentMealListModal;
