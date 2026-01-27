import {
  CheckOutlined,
  EditOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import {
  Button,
  Input,
  Modal,
  Select,
  Spin,
  Table,
  Tag,
  notification,
} from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useReactToPrint } from "react-to-print";
import {
  apiGetRetailOrderPatientIsFamily,
  multipleTablePutApi,
} from "../../../../api";
import showConfirm from "../../../../components/common/Modal/ModalConfirm";
import jwt from "../../../../utils/jwt";
import { addTab, setListOrderInfo, switchTab } from "../../store/order";
import "../OrderSummary/PaymentModal/PaymentModal.css";
import PrintComponent from "../RetailOrderListModal/PrintComponent/PrintComponent";
import "./FamilyMealListModal.css";

const FamilyMealListModal = ({ isOpen, onClose }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20; // Cố định pageSize = 20
  const [totalRecords, setTotalRecords] = useState(0);
  const [allData, setAllData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  // Define stable empty object to prevent unnecessary re-renders
  const EMPTY_FILTERS = {};
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  // Create stable filters object to prevent unnecessary API calls
  const stableFilters = useMemo(() => filters, [JSON.stringify(filters)]);
  const dispatch = useDispatch();

  const { id, storeId, unitId } = useSelector(
    (state) => state.claimsReducer.userInfo || {}
  );
  const tabs = useSelector((state) => state.orders.orders);
  const [printMaster, setPrintMaster] = useState({});
  const [printDetail, setPrintDetail] = useState([]);
  const printContent = useRef();

  // Tính chiều cao scroll động - tối đa 10 dòng
  const getScrollY = useMemo(() => {
    const rowCount = allData.length;
    if (rowCount === 0) return 100;
    // Tối đa 10 dòng, mỗi dòng 55px
    const maxRows = 10;
    const actualRows = Math.min(rowCount, maxRows);
    return actualRows * 55;
  }, [allData.length]);
  const lastApiCall = useRef({ pageIndex: 0, filters: {} });

  const rawToken = localStorage.getItem("access_token");
  const claims =
    rawToken && rawToken.split(".").length === 3 ? jwt.getClaims?.() || {} : {};
  const fullName = claims?.FullName;

  const [isEditingOrder, setIsEditingOrder] = useState(false);

  const fetchFamilyMealData = useCallback(
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
        const res = await apiGetRetailOrderPatientIsFamily({
          so_ct: filtersToUse.so_ct || "",
          ma_kh: filtersToUse.ma_kh || "",
          status: filtersToUse.status || "",
          ma_ban: filtersToUse.ma_ban || "",
          s2: filtersToUse.s2 || "",
          s3: filtersToUse.s3 || "",
          ten_bp: filtersToUse.ten_bp || "",
          so_giuong: filtersToUse.so_giuong || "",
          so_phong: filtersToUse.so_phong || "",
          ca_an: filtersToUse.ca_an || "",
          thutien_yn: filtersToUse.thutien_yn || "",
          pageIndex: pageIndex.toString(),
          pageSize: pageSize.toString(),
          userId: id,
          unitId: unitId,
          storeId: storeId,
          ma_gd: "3", // 3 = đơn Người nhà Người bệnh
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
      } catch (err) {
        console.error("Lỗi khi lấy danh sách suất ăn Người nhà:", err);
        notification.error({
          message: "Lỗi khi tải danh sách suất ăn Người nhà Người bệnh",
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
      fetchFamilyMealData(1, filters);
    } else {
      // Reset state khi đóng modal
      setCurrentPage(1);
      setFilters(EMPTY_FILTERS);
      setAllData([]);
      setTotalRecords(0);
      lastApiCall.current = { pageIndex: 0, filters: {} };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Sử dụng data trực tiếp từ API (backend pagination)
  const currentData = allData;

  // Helper function để xử lý filter
  const handleFilter = (key, value, confirm) => {
    confirm();
    let filterValue = value;

    // Xử lý đặc biệt cho trường s2
    if (key === "s2") {
      if (value === "Synchronize     ") {
        filterValue = "Synchronize     "; // Lọc thành công
      } else if (value === "*") {
        filterValue = "*"; // Lọc thất bại
      } else {
        filterValue = ""; // Lấy tất cả data (khi không chọn gì)
      }
    }

    const newFilters = { ...filters, [key]: filterValue };
    setFilters(newFilters);
    setCurrentPage(1); // Reset về trang 1 khi filter
    // Gọi API ngay lập tức khi filter thay đổi với pageIndex = 1 và truyền filters mới
    fetchFamilyMealData(1, newFilters);
  };

  // Helper function để xóa tất cả filter
  const handleClearAllFilters = () => {
    setFilters(EMPTY_FILTERS);
    setCurrentPage(1);
    fetchFamilyMealData(1, EMPTY_FILTERS);
  };

  // Helper function để xóa một filter cụ thể
  const handleRemoveFilter = (key) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    setFilters(newFilters);
    setCurrentPage(1);
    fetchFamilyMealData(1, newFilters);
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
            case "so_ct":
              displayText = `Số CT: ${value}`;
              tagColor = "blue";
              break;
            case "ten_bp":
              displayText = `Bộ phận: ${value}`;
              tagColor = "green";
              break;
            case "so_giuong":
              displayText = `Số giường: ${value}`;
              tagColor = "lime";
              break;
            case "so_phong":
              displayText = `Số phòng: ${value}`;
              tagColor = "cyan";
              break;
            case "ca_an":
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
            case "thutien_yn":
              const thuMap = {
                0: "Chưa thu",
                1: "Đã thu",
                N: "Chưa thu",
                Y: "Đã thu",
              };
              displayText = `Thu hộ: ${thuMap[value] || value}`;
              tagColor = value === "1" || value === "Y" ? "green" : "red";
              break;
            case "s2":
              const syncMap = {
                "Synchronize     ": "Thành công",
                "*": "Thất bại",
              };
              displayText = `Đồng bộ: ${syncMap[value] || value}`;
              tagColor = value === "Synchronize     " ? "green" : "red";
              break;
            case "status":
              const statusMap = {
                2: "Hoàn thành",
                0: "Chưa hoàn thành",
              };
              displayText = `Trạng thái: ${statusMap[value] || value}`;
              tagColor = value === "2" ? "green" : "yellow";
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
    fetchFamilyMealData(page, filters);
  };

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

  const columns = [
    {
      title: "STT",
      dataIndex: "stt",
      key: "stt",
      width: 80,
      align: "center",
      render: (_, __, index) => (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: "Nhân viên",
      dataIndex: "username",
      key: "username",
      width: 150,
      align: "center",
    },
    {
      title: "Số chứng từ",
      dataIndex: "so_ct",
      key: "so_ct",
      width: 180,
      align: "center",
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
        <div className="filter-dropdown">
          <Input
            placeholder="Tìm kiếm Số CT"
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() => handleFilter("so_ct", selectedKeys[0], confirm)}
          />
          <Button
            className="search_button"
            type="primary"
            onClick={() => handleFilter("so_ct", selectedKeys[0], confirm)}
            size="small"
          >
            Tìm kiếm
          </Button>
        </div>
      ),
    },
    {
      title: "Ngày CT",
      dataIndex: "ngay_ct",
      key: "ngay_ct",
      width: 120,
      align: "center",
    },
    {
      title: "Tên bộ phận",
      dataIndex: "ten_bp",
      key: "ten_bp",
      width: 200,
      align: "center",
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
    {
      title: "Số giường",
      dataIndex: "so_giuong",
      key: "so_giuong",
      align: "center",
      width: 120,
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
        <div className="filter-dropdown">
          <Input
            placeholder="Tìm số giường"
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() =>
              handleFilter("so_giuong", selectedKeys[0], confirm)
            }
            style={{ marginBottom: 8, display: "block" }}
          />
          <Button
            className="search_button"
            type="primary"
            onClick={() => handleFilter("so_giuong", selectedKeys[0], confirm)}
            size="small"
          >
            Tìm kiếm
          </Button>
        </div>
      ),
    },
    {
      title: "Số phòng",
      dataIndex: "so_phong",
      key: "so_phong",
      align: "center",
      width: 120,
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
        <div className="filter-dropdown">
          <Input
            placeholder="Tìm số phòng"
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() =>
              handleFilter("so_phong", selectedKeys[0], confirm)
            }
            style={{ marginBottom: 8, display: "block" }}
          />
          <Button
            className="search_button"
            type="primary"
            onClick={() => handleFilter("so_phong", selectedKeys[0], confirm)}
            size="small"
          >
            Tìm kiếm
          </Button>
        </div>
      ),
    },
    {
      title: "Ca ăn",
      dataIndex: "ca_an",
      key: "ca_an",
      align: "center",
      width: 100,
      render: (text) => {
        // Xử lý cả số và string, hiển thị trực tiếp CA1, CA2, CA3
        const normalizedText = String(text).toUpperCase();
        const caAnMap = {
          1: { color: "blue", text: "CA1" },
          2: { color: "green", text: "CA2" },
          3: { color: "orange", text: "CA3" },
          CA1: { color: "blue", text: "CA1" },
          CA2: { color: "green", text: "CA2" },
          CA3: { color: "orange", text: "CA3" },
          SANG: { color: "blue", text: "CA1" },
          TRUA: { color: "green", text: "CA2" },
          TOI: { color: "orange", text: "CA3" },
        };
        const caAnInfo = caAnMap[normalizedText] || {
          color: "gray",
          text: text || "N/A",
        };
        return <Tag color={caAnInfo.color}>{caAnInfo.text}</Tag>;
      },
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
            onClick={() => handleFilter("ca_an", selectedKeys[0], confirm)}
            size="small"
          >
            Tìm kiếm
          </Button>
        </div>
      ),
    },
    {
      title: "Thu hộ",
      dataIndex: "thutien_yn",
      key: "thutien_yn",
      align: "center",
      width: 120,
      render: (text) => {
        // Xử lý nhiều định dạng dữ liệu có thể có
        const normalizedText = String(text).toUpperCase().trim();
        const thuTienMap = {
          0: { color: "red", text: "Chưa thu" },
          1: { color: "green", text: "Đã thu" },
          N: { color: "red", text: "Chưa thu" },
          Y: { color: "green", text: "Đã thu" },
          FALSE: { color: "red", text: "Chưa thu" },
          TRUE: { color: "green", text: "Đã thu" },
          NO: { color: "red", text: "Chưa thu" },
          YES: { color: "green", text: "Đã thu" },
        };
        const thuTienInfo = thuTienMap[normalizedText] || {
          color: "gray",
          text: text || "N/A",
        };
        return <Tag color={thuTienInfo.color}>{thuTienInfo.text}</Tag>;
      },
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
        <div className="filter-dropdown">
          <Select
            placeholder="Chọn trạng thái thu hộ"
            value={selectedKeys[0]}
            onChange={(value) => setSelectedKeys(value ? [value] : [])}
            style={{ width: "100%", marginBottom: 8 }}
          >
            <Select.Option value="0">Chưa thu</Select.Option>
            <Select.Option value="1">Đã thu</Select.Option>
          </Select>
          <Button
            className="search_button"
            type="primary"
            onClick={() => handleFilter("thutien_yn", selectedKeys[0], confirm)}
            size="small"
          >
            Tìm kiếm
          </Button>
        </div>
      ),
    },
    {
      title: "Tổng tiền",
      dataIndex: "t_tt",
      key: "t_tt",
      width: 150,
      align: "center",
      render: (value) => (
        <span style={{ color: "#1890ff", fontWeight: "600" }}>
          {Number(value || 0).toLocaleString()} VNĐ
        </span>
      ),
    },
    {
      title: "Đồng bộ",
      dataIndex: "s2",
      key: "s2",
      align: "center",
      width: 120,
      render: (value) => {
        // Một số bản ghi không có s2 => cần chuẩn hóa để tránh lỗi undefined.trim
        const normalizedS2 = String(value || "").trim();
        const isSynchronized = normalizedS2 === "Synchronize";
        return (
          <Tag color={isSynchronized ? "green" : "red"}>
            {isSynchronized ? "Thành công" : "Thất bại"}
          </Tag>
        );
      },
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
        <div className="filter-dropdown">
          <Select
            placeholder="Chọn"
            value={selectedKeys[0]}
            onChange={(value) => setSelectedKeys(value ? [value] : [])}
          >
            <Select.Option value="Synchronize     ">Thành công</Select.Option>
            <Select.Option value="*">Thất bại</Select.Option>
          </Select>
          <Button
            className="search_button"
            type="primary"
            onClick={() => handleFilter("s2", selectedKeys[0], confirm)}
            size="small"
          >
            Tìm kiếm
          </Button>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "statusName",
      key: "statusName",
      align: "center",
      width: 150,
      render: (text) => (
        <Tag color={text === "Hoàn thành" ? "green" : "yellow"}>{text}</Tag>
      ),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
        <div className="filter-dropdown">
          <Select
            placeholder="Chọn trạng thái"
            value={selectedKeys[0]}
            onChange={(value) => setSelectedKeys(value ? [value] : [])}
          >
            <Select.Option value="2">Hoàn thành</Select.Option>
            <Select.Option value="0">Chưa hoàn thành</Select.Option>
          </Select>
          <Button
            className="search_button"
            type="primary"
            onClick={() => handleFilter("status", selectedKeys[0], confirm)}
            size="small"
          >
            Tìm kiếm
          </Button>
        </div>
      ),
    },
    {
      title: "Chức năng",
      key: "action",
      width: 180,
      align: "center",
      fixed: "right",
      render: (_, record) => {
        // Kiểm tra trạng thái "Hủy" (status khác 0 và 2, tức là status = 3)
        const isCancelled =
          record.status !== "0" &&
          record.status !== "2" &&
          record.status !== 0 &&
          record.status !== 2;

        return (
          <div className="action-buttons">
            <Button
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              type="danger"
              size="small"
              className="edit_button"
              disabled={
                isCancelled ||
                isEditingOrder ||
                (record.status === "2" && record.s3 === true)
              }
            />
            <Button
              icon={<PrinterOutlined />}
              onClick={() => handleReprint(record)}
              size="small"
              type="primary"
              className="print_button"
              disabled={isCancelled}
            />
            <Button
              icon={<CheckOutlined />}
              onClick={() => handleApprove(record)}
              size="small"
              type="primary"
              className="approve_button"
              disabled={isCancelled || record.status !== "0"}
            />
          </div>
        );
      },
    },
  ];

  const handleEdit = async (record) => {
    if (isEditingOrder) return;
    setIsEditingOrder(true);
    try {
      const existingTab = tabs.some(
        (tab) => tab.master.stt_rec === record.stt_rec
      );
      if (existingTab) {
        notification.error({
          message: "Tab đã tồn tại!",
          duration: 3,
        });
        setIsEditingOrder(false);
        return;
      }

      const { masterData, flatDetailData } = await fetchOrderDetail(
        record.stt_rec
      );
      const detailData = groupDetailData(flatDetailData, true);

      // Merge masterData với record để đảm bảo có đủ thông tin khách hàng
      const mergedMasterData = {
        ...masterData,
        // Fallback từ record nếu masterData không có
        ten_kh: masterData.ten_kh || record.ten_kh,
        ong_ba: masterData.ong_ba || record.ong_ba,
        ma_kh: masterData.ma_kh || record.ma_kh,
        cccd: masterData.cccd || record.cccd,
        so_dt: masterData.so_dt || record.so_dt,
        dia_chi: masterData.dia_chi || record.dia_chi,
        email: masterData.email || record.email,
        ma_so_thue_kh: masterData.ma_so_thue_kh || record.ma_so_thue_kh,
        ten_dv_kh: masterData.ten_dv_kh || record.ten_dv_kh,
        so_giuong: masterData.so_giuong || record.so_giuong || "",
        so_phong: masterData.so_phong || record.so_phong || "",
        ca_an: masterData.ca_an || record.ca_an || "",
        StoreID: masterData.StoreID || record.StoreID || "",
        ten_bp: masterData.ten_bp || record.ten_bp || "",
      };

      const tableData = {
        name: mergedMasterData.ma_ban,
        id: mergedMasterData.ma_ban,
      };

      const internalId = `${tableData.id}_${Date.now()}`;
      dispatch(
        addTab({
          tableName: tableData.name,
          tableId: tableData.id,
          isRealtime: false,
          internalId,
          master: mergedMasterData,
          detail: detailData,
        })
      );

      dispatch(switchTab(internalId));
      onClose();
      notification.success({
        message: "Đã tải đơn hàng Người nhà Người bệnh thành công!",
        duration: 3,
      });
    } catch (err) {
      notification.error({
        message: "Lỗi khi tải đơn hàng",
        description: err.message,
        duration: 4,
      });
    } finally {
      setIsEditingOrder(false);
    }
  };

  const handleReprint = async (record) => {
    try {
      const { masterData, flatDetailData } = await fetchOrderDetail(
        record.stt_rec
      );
      const detailData = groupDetailData(flatDetailData, true);

      setPrintMaster(masterData);
      setPrintDetail(detailData);

      // Delay để đảm bảo component được render trước khi print
      setTimeout(() => {
        handlePrint();
      }, 100);

      notification.success({
        message: "In lại hóa đơn",
        description: `Đang in lại hóa đơn ${record.so_ct}`,
        duration: 3,
      });
    } catch (err) {
      notification.error({
        message: "Lỗi khi in lại hóa đơn",
        description: err.message,
        duration: 4,
      });
    }
  };

  const handlePrint = useReactToPrint({
    content: () => printContent.current,
    documentTitle: "Print Family Meal",
    copyStyles: false,
  });

  const handleApprove = async (record) => {
    showConfirm({
      title: `Bạn có chắc chắn muốn thanh toán đơn hàng có số chứng từ: ${record.so_ct}?`,
      onOk: async () => {
        if (isEditingOrder) return;
        setIsEditingOrder(true);
        try {
          const existingTab = tabs.some(
            (tab) => tab.master.stt_rec === record.stt_rec
          );
          if (existingTab) {
            notification.error({
              message: "Tab đã tồn tại!",
              duration: 3,
            });
            setIsEditingOrder(false);
            return;
          }
          const { masterData, flatDetailData } = await fetchOrderDetail(
            record.stt_rec
          );
          const detailData = groupDetailData(flatDetailData, true);

          // Merge masterData với record để đảm bảo có đủ thông tin khách hàng
          const mergedMasterData = {
            ...masterData,
            // Fallback từ record nếu masterData không có
            ten_kh: masterData.ten_kh || record.ten_kh,
            ong_ba: masterData.ong_ba || record.ong_ba,
            ma_kh: masterData.ma_kh || record.ma_kh,
            cccd: masterData.cccd || record.cccd,
            so_dt: masterData.so_dt || record.so_dt,
            dia_chi: masterData.dia_chi || record.dia_chi,
            email: masterData.email || record.email,
            ma_so_thue_kh: masterData.ma_so_thue_kh || record.ma_so_thue_kh,
            ten_dv_kh: masterData.ten_dv_kh || record.ten_dv_kh,
            so_giuong: masterData.so_giuong || record.so_giuong || "",
            so_phong: masterData.so_phong || record.so_phong || "",
            ca_an: masterData.ca_an || record.ca_an || "",
            StoreID: masterData.StoreID || record.StoreID || "",
          };

          const tableData = {
            name: mergedMasterData.ma_ban,
            id: mergedMasterData.ma_ban,
          };
          const internalId = `${tableData.id}_${Date.now()}`;
          dispatch(
            addTab({
              tableName: tableData.name,
              tableId: tableData.id,
              isRealtime: false,
              internalId,
              master: mergedMasterData,
              detail: detailData,
              autoOpenPayment: true,
            })
          );
          dispatch(switchTab(internalId));
          onClose();
        } catch (err) {
          notification.error({
            message: "Lỗi khi tải chi tiết đơn hàng hoặc mở tab mới",
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
        title="Danh sách suất ăn Người nhà Người bệnh"
        destroyOnClose
        onCancel={onClose}
        footer={null}
        centered
      >
        <div className="family-meal-modal-container">
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
              rowKey={(record) =>
                record.stt_rec || record.so_ct || Math.random()
              }
              className="family-meal-table"
              scroll={{ x: "max-content", y: getScrollY }}
              size="middle"
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: totalRecords,
                showSizeChanger: false,
                showQuickJumper: false,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} của ${total} suất ăn Người nhà Người bệnh`,
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

export default FamilyMealListModal;
