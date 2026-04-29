import {
  DeleteOutlined,
  EditOutlined,
  ExportOutlined,
  FileTextOutlined,
  LeftOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  Button,
  Checkbox,
  Col,
  DatePicker,
  Input,
  message,
  Modal,
  Row,
  Select,
  Table,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import showConfirm from "../../../../components/common/Modal/ModalConfirm";
import https from "../../../../utils/https";
import "../common-phieu.css";
import { getUserInfo } from "./utils/phieuXuatKhoBanHangUtils";

const { RangePicker } = DatePicker;
const { Title } = Typography;

const ListPhieuXuatKhoBanHang = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("access_token");
  const [allData, setAllData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [screenSize, setScreenSize] = useState("desktop");
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState([]);

  // Key để lưu filters riêng cho phiếu xuất kho bán hàng
  const FILTER_STORAGE_KEY = "phieu_xuat_kho_ban_hang_filters";

  // Khôi phục filters từ localStorage
  const getSavedFilters = () => {
    try {
      const saved = localStorage.getItem(FILTER_STORAGE_KEY);
      if (saved) {
        const parsedFilters = JSON.parse(saved);
        // Chuyển đổi dateRange từ string array về dayjs objects nếu có
        if (parsedFilters.dateRange && Array.isArray(parsedFilters.dateRange)) {
          parsedFilters.dateRange = parsedFilters.dateRange.map((date) =>
            date ? dayjs(date) : null
          );
        }
        return parsedFilters;
      }
    } catch (error) {
      console.error("Error loading saved filters:", error);
    }
    return {
      so_ct: "",
      ma_kh: "",
      ten_kh: "",
      xe_vc: "",
      tai_xe: "",
      dateRange: null,
      status: "",
    };
  };

  const [filters, setFilters] = useState(getSavedFilters());

  // Hàm lấy text trạng thái
  const getStatusText = (status) => {
    const statusMap = {
      0: "Lập chứng từ",
      2: "Chuyển SC",
      4: "Đề nghị xuất kho",
      5: "Xuất kho",
      6: "Hoàn thành",
    };
    return statusMap[status] || "Không xác định";
  };

  // Lưu filters vào localStorage
  const saveFilters = (filtersToSave) => {
    try {
      // Chuyển đổi dateRange từ dayjs objects về strings để lưu
      const filtersForStorage = { ...filtersToSave };
      if (
        filtersForStorage.dateRange &&
        Array.isArray(filtersForStorage.dateRange)
      ) {
        filtersForStorage.dateRange = filtersForStorage.dateRange.map((date) =>
          date ? date.format("YYYY-MM-DD") : null
        );
      }
      localStorage.setItem(
        FILTER_STORAGE_KEY,
        JSON.stringify(filtersForStorage)
      );
    } catch (error) {
      console.error("Error saving filters:", error);
    }
  };

  const pageSize = 20;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = allData.slice(startIndex, endIndex);

  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      if (width < 480) {
        setScreenSize("mobile");
      } else if (width < 768) {
        setScreenSize("mobileLandscape");
      } else if (width < 1024) {
        setScreenSize("tablet");
      } else {
        setScreenSize("desktop");
      }
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Tự động lưu filters khi thay đổi
  useEffect(() => {
    saveFilters(filters);
  }, [filters]);

  // Load data với saved filters khi component mount
  useEffect(() => {
    fetchPhieuXuatKhoBanHang();
  }, []);

  const fetchPhieuXuatKhoBanHang = async (filterParams = filters) => {
    const body = {
      store: "api_list_phieu_xuat_kho_ban_hang_voucher",
      param: {
        so_ct: filterParams.so_ct || "",
        ma_kh: filterParams.ma_kh || "",
        ten_kh: filterParams.ten_kh || "",
        xe_vc: filterParams.xe_vc || "",
        tai_xe: filterParams.tai_xe || "",
        ngay_ct: "",
        DateFrom:
          filterParams.dateRange && filterParams.dateRange[0]
            ? filterParams.dateRange[0].format("YYYY-MM-DD")
            : dayjs().startOf("month").format("YYYY-MM-DD"),
        DateTo:
          filterParams.dateRange && filterParams.dateRange[1]
            ? filterParams.dateRange[1].format("YYYY-MM-DD")
            : dayjs().endOf("month").format("YYYY-MM-DD"),
        PageIndex: 1,
        PageSize: 50,
        Status: filterParams.status || "",
      },
      data: {},
      resultSetNames: ["data", "pagination"],
    };
    try {
      const res = await https.post("v1/dynamicApi/call-dynamic-api", body, {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      });
      const responseData = res.data?.listObject?.dataLists?.data || [];
      setAllData(responseData);
      setTotalRecords(responseData.length);
    } catch (err) {
      console.error("Lỗi gọi API danh sách phiếu xuất kho bán hàng:", err);
    }
  };

  useEffect(() => {
    fetchPhieuXuatKhoBanHang();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "0":
        return "orange";
      case "4":
        return "green";
      case "5":
        return "blue";
      case "6":
        return "purple";
      case "2":
        return "cyan";
      default:
        return "default";
    }
  };

  // Hàm lấy chi tiết dữ liệu vật tư
  const fetchDetailData = async () => {
    try {
      const listSttRec = selectedRowKeys.join(",");
      const userInfo = getUserInfo();

      const body = {
        store: "api_get_data_list_detail_phieu_xuat_kho_ban_hang_voucher",
        param: {
          list_stt_rec: listSttRec,
          UserId: userInfo.userId.toString(),
          Lang: "V",
          Admin: "1",
          UnitId: userInfo.unitId,
          StoreId: null,
        },
        data: {},
      };

      const response = await https.post(
        "v1/dynamicApi/call-dynamic-api",
        body,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.listObject?.dataLists) {
        // Lấy dữ liệu từ tất cả các dataList (có thể có nhiều phiếu)
        let allVatTuData = [];
        const dataLists = response.data.listObject.dataLists;

        // Duyệt qua từng key trong dataLists (mỗi key là một phiếu)
        Object.keys(dataLists).forEach((key) => {
          if (Array.isArray(dataLists[key])) {
            allVatTuData = allVatTuData.concat(dataLists[key]);
          }
        });

        setModalData(allVatTuData);
        setModalVisible(true);
      }
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu chi tiết:", error);
      message.error("Không thể lấy dữ liệu chi tiết");
    }
  };

  const handleExportSelected = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Vui lòng chọn ít nhất một phiếu để xuất kho");
      return;
    }

    // Lấy thông tin các phiếu đã chọn
    const selectedRecords = allData.filter((record) =>
      selectedRowKeys.includes(record.stt_rec)
    );

    // Kiểm tra xe vận chuyển khác nhau (chỉ áp dụng khi chọn nhiều dòng)
    const uniqueXeVC = [
      ...new Set(selectedRecords.map((record) => record.xe_vc)),
    ];
    const hasDifferentXeVC =
      selectedRowKeys.length > 1 && uniqueXeVC.length > 1;

    // Kiểm tra trạng thái không phải 0, 1, 4
    const hasInvalidStatus = selectedRecords.some(
      (record) => !["0", "1", "4"].includes(record.status)
    );

    // Luôn hiển thị modal chi tiết khi có bất kỳ vấn đề nào hoặc chỉ chọn 1 dòng
    if (selectedRowKeys.length === 1 || hasDifferentXeVC || hasInvalidStatus) {
      let warningMessages = [];
      if (hasDifferentXeVC) {
        warningMessages.push("Có xe vận chuyển khác nhau");
      }
      if (hasInvalidStatus) {
        warningMessages.push("Có đơn đã duyệt rồi");
      }

      // Nếu chỉ chọn 1 dòng và không có vấn đề gì, trực tiếp hiển thị modal
      if (
        selectedRowKeys.length === 1 &&
        !hasDifferentXeVC &&
        !hasInvalidStatus
      ) {
        await fetchDetailData();
        return;
      }

      // Hiển thị popup xác nhận với tùy chọn xác nhận hoặc hủy khi có vấn đề
      showConfirm({
        title: "Cảnh báo",
        content: (
          <div>
            <div style={{ marginBottom: "16px" }}>
              {warningMessages.map((msg, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    marginBottom: "4px",
                  }}
                >
                  <span style={{ marginRight: "8px", minWidth: "8px" }}>•</span>
                  <span>{msg}</span>
                </div>
              ))}
            </div>
            <div>Bạn có muốn tiếp tục xem chi tiết và xuất kho không?</div>
          </div>
        ),
        type: "info",
        onOk: async () => {
          await fetchDetailData();
        },
        onCancel: () => {},
      });
      return;
    }

    // Nếu không có vấn đề, vẫn hiển thị modal chi tiết trước khi xuất kho
    showConfirm({
      title: "Xác nhận xuất kho",
      content: `Bạn có chắc chắn muốn xuất kho ${selectedRowKeys.length} phiếu đã chọn?`,
      type: "info",
      onOk: async () => {
        await fetchDetailData();
      },
    });
  };

  const handleDelete = async (stt_rec) => {
    showConfirm({
      title: "Xác nhận xóa phiếu",
      content: "Bạn có chắc chắn muốn xóa phiếu này không?",
      type: "warning",
      onOk: async () => {
        try {
          const body = {
            store: "api_delete_phieu_xuat_kho_ban_hang_voucher",
            param: {
              stt_rec: stt_rec,
            },
            data: {},
          };

          const response = await https.post(
            "v1/dynamicApi/call-dynamic-api",
            body,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );

          // Check new response structure with responseModel
          if (response.data?.responseModel?.isSucceded === true) {
            setAllData(allData.filter((item) => item.stt_rec !== stt_rec));
            message.success(
              response.data.responseModel.message ||
                "Xóa phiếu xuất kho bán hàng thành công"
            );
          } else {
            message.error(
              response.data?.responseModel?.message ||
                "Xóa phiếu xuất kho bán hàng thất bại"
            );
          }
        } catch (error) {
          console.error("Lỗi khi xóa phiếu xuất kho bán hàng:", error);
          if (error.response?.data?.responseModel?.message) {
            message.error(error.response.data.responseModel.message);
          } else if (error.response?.data?.message) {
            message.error(error.response.data.message);
          } else {
            message.error("Có lỗi xảy ra khi xóa phiếu xuất kho bán hàng");
          }
        }
      },
    });
  };

  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
    hideSelectAll: true, // Ẩn checkbox chọn tất cả mặc định
    columnTitle:
      selectedRowKeys.length > 0 ? (
        <Checkbox
          checked={true}
          onChange={(e) => {
            if (!e.target.checked) {
              setSelectedRowKeys([]);
            }
          }}
          style={{
            transform: "scale(0.9)",
          }}
        />
      ) : null,
  };

  const getColumns = () => {
    const baseColumns = [
      {
        title: "STT",
        key: "stt",
        render: (_, __, index) => index + 1,
        width: 60,
        align: "center",
      },
      {
        title: "Trạng thái",
        dataIndex: "statusname",
        key: "status",
        width: screenSize === "mobile" ? 80 : 120,
        align: "center",
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
          <div style={{ padding: 8 }}>
            <Select
              placeholder="Chọn trạng thái"
              value={selectedKeys[0]}
              onChange={(value) => setSelectedKeys(value ? [value] : [])}
              style={{ width: "100%", marginBottom: 8 }}
              allowClear
            >
              <Select.Option value="0">Lập chứng từ</Select.Option>
              <Select.Option value="2">Chuyển SC</Select.Option>
              <Select.Option value="4">Đề nghị xuất kho</Select.Option>
              <Select.Option value="5">Xuất kho</Select.Option>
              <Select.Option value="6">Hoàn thành</Select.Option>
            </Select>
            <Button
              className="search_button"
              type="primary"
              onClick={() => {
                confirm();
                const newFilters = {
                  ...filters,
                  status: selectedKeys[0] || "",
                };
                setFilters(newFilters);
                fetchPhieuXuatKhoBanHang(newFilters);
              }}
              size="small"
            >
              Tìm kiếm
            </Button>
          </div>
        ),
        filteredValue: filters.status ? [filters.status] : null,
        render: (statusname, record) => {
          if (record.status === "*" || record.status === null) {
            return "";
          }
          // Fallback cho statusname nếu API không trả về
          const getStatusText = (status) => {
            const statusMap = {
              0: screenSize === "mobile" ? "Lập CT" : "Lập chứng từ",
              2: screenSize === "mobile" ? "Chuyển SC" : "Chuyển SC",
              4: screenSize === "mobile" ? "Đã duyệt" : "Đã duyệt",
              5: screenSize === "mobile" ? "Đề nghị" : "Đề nghị xuất kho",
              6: screenSize === "mobile" ? "Hoàn thành" : "Hoàn thành",
            };
            return statusMap[status] || "Không xác định";
          };
          const displayText = statusname || getStatusText(record.status);
          const statusColor = getStatusColor(record.status);
          return <Tag color={statusColor}>{displayText}</Tag>;
        },
      },
      {
        title: "Ngày CT",
        dataIndex: "ngay_ct",
        key: "ngay_ct",
        width: 150,
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
          <div style={{ padding: 8 }}>
            <RangePicker
              inputReadOnly
              value={
                selectedKeys[0] && selectedKeys[1]
                  ? [
                      dayjs(selectedKeys[0], "DD/MM/YYYY"),
                      dayjs(selectedKeys[1], "DD/MM/YYYY"),
                    ]
                  : null
              }
              onChange={(dates) => {
                if (dates && dates.length === 2) {
                  setSelectedKeys([
                    dates[0].format("DD/MM/YYYY"),
                    dates[1].format("DD/MM/YYYY"),
                  ]);
                } else {
                  setSelectedKeys([]);
                }
              }}
              style={{ marginBottom: 8 }}
              format="DD/MM/YYYY"
              placeholder={["Từ ngày", "Đến ngày"]}
            />
            <Button
              className="search_button"
              type="primary"
              onClick={() => {
                confirm();
                const newFilters = {
                  ...filters,
                  dateRange:
                    selectedKeys.length === 2
                      ? [
                          dayjs(selectedKeys[0], "DD/MM/YYYY"),
                          dayjs(selectedKeys[1], "DD/MM/YYYY"),
                        ]
                      : null,
                };
                setFilters(newFilters);
                fetchPhieuXuatKhoBanHang(newFilters);
              }}
              size="small"
            >
              Tìm kiếm
            </Button>
          </div>
        ),
        filteredValue:
          filters.dateRange && filters.dateRange.length === 2
            ? [
                filters.dateRange[0].format("DD/MM/YYYY"),
                filters.dateRange[1].format("DD/MM/YYYY"),
              ]
            : null,
        render: (text) =>
          dayjs(text).format(screenSize === "mobile" ? "DD/MM" : "DD/MM/YYYY"),
      },
    ];

    if (screenSize !== "mobile") {
      baseColumns.push({
        title: () => (
          <div className="filter-column-header">
            Số chứng từ{" "}
            {filters.so_ct ? (
              <Tag color="blue" size="small">
                {filters.so_ct}
              </Tag>
            ) : null}
          </div>
        ),
        dataIndex: "so_ct",
        key: "so_ct",
        width: 150,
        align: "center",
        render: (text) => (text ? text.trim() : ""),
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
          <div style={{ padding: 8 }}>
            <Input
              placeholder="Tìm Số CT"
              value={selectedKeys[0]}
              onChange={(e) =>
                setSelectedKeys(e.target.value ? [e.target.value] : [])
              }
              onPressEnter={() => {
                confirm();
                const newFilters = { ...filters, so_ct: selectedKeys[0] || "" };
                setFilters(newFilters);
                fetchPhieuXuatKhoBanHang(newFilters);
              }}
              style={{ marginBottom: 8, display: "block" }}
            />
            <Button
              className="search_button"
              type="primary"
              onClick={() => {
                confirm();
                const newFilters = { ...filters, so_ct: selectedKeys[0] || "" };
                setFilters(newFilters);
                fetchPhieuXuatKhoBanHang(newFilters);
              }}
              size="small"
            >
              Tìm kiếm
            </Button>
          </div>
        ),
        filteredValue: filters.so_ct ? [filters.so_ct] : null,
      });
    }

    if (screenSize !== "mobile") {
      baseColumns.push(
        {
          title: () => (
            <div className="filter-column-header">
              Mã khách{" "}
              {filters.ma_kh ? (
                <Tag color="blue" size="small">
                  {filters.ma_kh}
                </Tag>
              ) : null}
            </div>
          ),
          dataIndex: "ma_kh",
          key: "ma_kh",
          width: 150,
          align: "center",
          render: (text) => (text ? text.trim() : ""),
          filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
            <div style={{ padding: 8 }}>
              <Input
                placeholder="Tìm Mã khách"
                value={selectedKeys[0]}
                onChange={(e) =>
                  setSelectedKeys(e.target.value ? [e.target.value] : [])
                }
                onPressEnter={() => {
                  confirm();
                  const newFilters = {
                    ...filters,
                    ma_kh: selectedKeys[0] || "",
                  };
                  setFilters(newFilters);
                  fetchPhieuXuatKhoBanHang(newFilters);
                }}
                style={{ marginBottom: 8, display: "block" }}
              />
              <Button
                className="search_button"
                type="primary"
                onClick={() => {
                  confirm();
                  const newFilters = {
                    ...filters,
                    ma_kh: selectedKeys[0] || "",
                  };
                  setFilters(newFilters);
                  fetchPhieuXuatKhoBanHang(newFilters);
                }}
                size="small"
              >
                Tìm kiếm
              </Button>
            </div>
          ),
          filteredValue: filters.ma_kh ? [filters.ma_kh] : null,
        },
        {
          title: () => (
            <div className="filter-column-header-wide">
              Tên khách
              {filters.ten_kh ? (
                <Tag color="blue" size="small">
                  {filters.ten_kh}
                </Tag>
              ) : null}
            </div>
          ),
          dataIndex: "ten_kh",
          key: "ten_kh",
          width: 250,
          align: "center",
          render: (text) => (text ? text.trim() : ""),
          filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
            <div style={{ padding: 8 }}>
              <Input
                placeholder="Tìm Tên khách"
                value={selectedKeys[0]}
                onChange={(e) =>
                  setSelectedKeys(e.target.value ? [e.target.value] : [])
                }
                onPressEnter={() => {
                  confirm();
                  const newFilters = {
                    ...filters,
                    ten_kh: selectedKeys[0] || "",
                  };
                  setFilters(newFilters);
                  fetchPhieuXuatKhoBanHang(newFilters);
                }}
                style={{ marginBottom: 8, display: "block" }}
              />
              <Button
                className="search_button"
                type="primary"
                onClick={() => {
                  confirm();
                  const newFilters = {
                    ...filters,
                    ten_kh: selectedKeys[0] || "",
                  };
                  setFilters(newFilters);
                  fetchPhieuXuatKhoBanHang(newFilters);
                }}
                size="small"
              >
                Tìm kiếm
              </Button>
            </div>
          ),
          filteredValue: filters.ten_kh ? [filters.ten_kh] : null,
        }
      );
    }

    // Thêm cột xe vận chuyển
    if (screenSize !== "mobile") {
      baseColumns.push({
        title: () => (
          <div className="filter-column-header">
            Xe vận chuyển
            {filters.xe_vc ? (
              <Tag color="blue" size="small">
                {filters.xe_vc}
              </Tag>
            ) : null}
          </div>
        ),
        dataIndex: "xe_vc",
        key: "xe_vc",
        width: 150,
        align: "center",
        render: (text) => (text ? text.trim() : ""),
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
          <div style={{ padding: 8 }}>
            <Input
              placeholder="Tìm Xe vận chuyển"
              value={selectedKeys[0]}
              onChange={(e) =>
                setSelectedKeys(e.target.value ? [e.target.value] : [])
              }
              onPressEnter={() => {
                confirm();
                const newFilters = {
                  ...filters,
                  xe_vc: selectedKeys[0] || "",
                };
                setFilters(newFilters);
                fetchPhieuXuatKhoBanHang(newFilters);
              }}
              style={{ marginBottom: 8, display: "block" }}
            />
            <Button
              className="search_button"
              type="primary"
              onClick={() => {
                confirm();
                const newFilters = {
                  ...filters,
                  xe_vc: selectedKeys[0] || "",
                };
                setFilters(newFilters);
                fetchPhieuXuatKhoBanHang(newFilters);
              }}
              size="small"
            >
              Tìm kiếm
            </Button>
          </div>
        ),
        filteredValue: filters.xe_vc ? [filters.xe_vc] : null,
      });

      // Thêm cột tài xế
      baseColumns.push({
        title: () => (
          <div className="filter-column-header">
            Tài xế
            {filters.tai_xe ? (
              <Tag color="blue" size="small">
                {filters.tai_xe}
              </Tag>
            ) : null}
          </div>
        ),
        dataIndex: "tai_xe",
        key: "tai_xe",
        width: 200,
        align: "center",
        render: (text) => (text ? text.trim() : ""),
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
          <div style={{ padding: 8 }}>
            <Input
              placeholder="Tìm Tài xế"
              value={selectedKeys[0]}
              onChange={(e) =>
                setSelectedKeys(e.target.value ? [e.target.value] : [])
              }
              onPressEnter={() => {
                confirm();
                const newFilters = {
                  ...filters,
                  tai_xe: selectedKeys[0] || "",
                };
                setFilters(newFilters);
                fetchPhieuXuatKhoBanHang(newFilters);
              }}
              style={{ marginBottom: 8, display: "block" }}
            />
            <Button
              className="search_button"
              type="primary"
              onClick={() => {
                confirm();
                const newFilters = {
                  ...filters,
                  tai_xe: selectedKeys[0] || "",
                };
                setFilters(newFilters);
                fetchPhieuXuatKhoBanHang(newFilters);
              }}
              size="small"
            >
              Tìm kiếm
            </Button>
          </div>
        ),
        filteredValue: filters.tai_xe ? [filters.tai_xe] : null,
      });
    }

    baseColumns.push({
      title: "Hành động",
      key: "action",
      width: 150,
      align: "center",
      fixed: "right",
      render: (_, record) => (
        <div className="phieu-action-group">
          <button
            className="phieu-action-btn phieu-action-btn--view"
            title="Xem chi tiết"
            onClick={() =>
              navigate(`${record.stt_rec}`, {
                state: { sctRec: record.stt_rec },
              })
            }
          >
            <FileTextOutlined />
          </button>
          <button
            className="phieu-action-btn phieu-action-btn--edit"
            title="Chỉnh sửa"
            onClick={() =>
              navigate(`edit/${record.stt_rec}`, {
                state: { sctRec: record.stt_rec },
              })
            }
          >
            <EditOutlined />
          </button>
          <button
            className="phieu-action-btn phieu-action-btn--delete"
            title="Xóa"
            onClick={() => handleDelete(record.stt_rec)}
          >
            <DeleteOutlined />
          </button>
        </div>
      ),
    });

    return baseColumns;
  };

  const getTableProps = () => {
    const baseProps = {
      columns: getColumns(),
      dataSource: paginatedData,
      pagination: {
        current: currentPage,
        pageSize: pageSize,
        total: totalRecords,
        onChange: (page) => setCurrentPage(page),
        showSizeChanger: false,
        showQuickJumper: false,
      },
      bordered: true,
      rowKey: "stt_rec",
      className: "phieu-data-table hidden_scroll_bar",
      scroll: { x: 1800 },
    };
    if (screenSize === "mobile") {
      baseProps.scroll = { x: 600 };
      baseProps.size = "small";
    } else if (screenSize === "mobileLandscape") {
      baseProps.scroll = { x: 800, y: 400 };
      baseProps.size = "small";
    } else if (screenSize === "tablet") {
      baseProps.scroll = { x: 1350, y: 500 };
    } else {
      baseProps.scroll = { x: 1800, y: 600 };
    }
    return baseProps;
  };

  // Cột cho bảng vật tư trong modal
  const vatTuColumns = [
    {
      title: "STT",
      key: "stt",
      width: 60,
      align: "center",
      render: (_, __, index) => index + 1,
    },
    {
      title: "Mã hàng",
      dataIndex: "ma_vt",
      key: "ma_vt",
      width: screenSize === "mobile" ? 120 : 200,
      align: "center",
      render: (value) => (value ? value.trim() : ""),
    },
    {
      title: "Tên mặt hàng",
      dataIndex: "ten_vt",
      key: "ten_vt",
      width: screenSize === "mobile" ? 200 : 350,
      align: "left",
      render: (value) => (value ? value.trim() : ""),
    },
    {
      title: "Đvt",
      dataIndex: "dvt",
      key: "dvt",
      width: screenSize === "mobile" ? 80 : 100,
      align: "center",
      render: (value) => (value ? value.trim() : ""),
    },
    {
      title: "Số lượng đề nghị",
      dataIndex: "so_luong",
      key: "so_luong",
      width: screenSize === "mobile" ? 120 : 150,
      align: "center",
      render: (value) => (value || 0).toLocaleString("vi-VN"),
    },
    {
      title: "Số lượng xuất",
      dataIndex: "sl_td3",
      key: "sl_td3",
      width: screenSize === "mobile" ? 120 : 150,
      align: "center",
      render: (value) => (value || 1).toLocaleString("vi-VN"),
    },
  ];

  return (
    <>
      <div className="phieu-container">
        <Row justify="space-between" align="middle" className="phieu-header">
          <Col>
            <Button
              type="text"
              icon={<LeftOutlined />}
              onClick={() => navigate("/boxly")}
              className="phieu-back-button"
            >
              Trở về
            </Button>
          </Col>
          <Col flex="auto" style={{ textAlign: "center" }}>
            <Title level={5} className="phieu-title">
              DANH SÁCH PHIẾU XUẤT KHO BÁN HÀNG
            </Title>
          </Col>
          <Col>
            {selectedRowKeys.length > 0 ? (
              <Button
                type="primary"
                icon={<ExportOutlined />}
                onClick={handleExportSelected}
                className="phieu-add-button"
              >
                Xuất kho ({selectedRowKeys.length})
              </Button>
            ) : (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate("add")}
                className="phieu-add-button"
              >
                Thêm mới
              </Button>
            )}
          </Col>
        </Row>
        <div className="phieu-table-container">
          <Table
            rowSelection={rowSelection}
            columns={getColumns()}
            dataSource={paginatedData}
            rowKey="stt_rec"
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: totalRecords,
              onChange: (page) => {
                setCurrentPage(page);
                setSelectedRowKeys([]); // Reset selected rows when changing page
              },
              showSizeChanger: false,
              showQuickJumper: false,
            }}
            bordered
            className="phieu-data-table hidden_scroll_bar"
            scroll={{ x: 1800, y: 600 }}
          />
        </div>
      </div>

      {/* Modal hiển thị bảng vật tư */}
      <Modal
        title="Chi tiết vật tư xuất kho"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setModalData([]);
        }}
        width={
          screenSize === "mobile"
            ? "95%"
            : screenSize === "tablet"
            ? 1200
            : 1400
        }
        footer={
          <div
            style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}
          >
            <Button
              key="cancel"
              onClick={() => {
                setModalVisible(false);
                setModalData([]);
              }}
            >
              Hủy
            </Button>
            <Button
              key="submit"
              type="primary"
              onClick={async () => {
                try {
                  const listSttRec = selectedRowKeys.join(",");
                  const userInfo = getUserInfo();

                  const body = {
                    store:
                      "api_browse_data_list_detail_phieu_xuat_kho_ban_hang_voucher",
                    param: {
                      list_stt_rec: listSttRec,
                      status: "5",
                      UserId: userInfo.userId.toString(),
                      Lang: "V",
                      Admin: "1",
                      UnitId: userInfo.unitId,
                      StoreId: null,
                    },
                    data: {},
                  };

                  const response = await https.post(
                    "v1/dynamicApi/call-dynamic-api",
                    body,
                    {
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                    }
                  );

                  if (response.data?.responseModel?.isSucceded === true) {
                    message.success(
                      `Đã xuất kho ${selectedRowKeys.length} phiếu thành công`
                    );
                    setSelectedRowKeys([]);
                    setModalVisible(false);
                    setModalData([]);
                    fetchPhieuXuatKhoBanHang();
                  } else {
                    message.error(
                      response.data?.responseModel?.message ||
                        "Xuất kho thất bại"
                    );
                  }
                } catch (error) {
                  console.error("Lỗi khi xuất kho:", error);
                  if (error.response?.data?.responseModel?.message) {
                    message.error(error.response.data.responseModel.message);
                  } else if (error.response?.data?.message) {
                    message.error(error.response.data.message);
                  } else {
                    message.error("Có lỗi xảy ra khi xuất kho");
                  }
                }
              }}
            >
              Xác nhận xuất kho
            </Button>
          </div>
        }
      >
        <Table
          columns={vatTuColumns}
          dataSource={modalData}
          rowKey={(record, index) => index}
          pagination={false}
          scroll={{
            x:
              screenSize === "mobile"
                ? 700
                : screenSize === "tablet"
                ? 1000
                : 1200,
            y: 400,
          }}
          bordered
          className="phieu-data-table hidden_scroll_bar"
          size={screenSize === "mobile" ? "small" : "middle"}
        />
      </Modal>
    </>
  );
};

export default ListPhieuXuatKhoBanHang;
