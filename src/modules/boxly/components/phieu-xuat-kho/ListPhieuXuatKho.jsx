import {
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  LeftOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  Button,
  Col,
  DatePicker,
  Input,
  message,
  Row,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import showConfirm from "../../../../components/common/Modal/ModalConfirm";
import https from "../../../../utils/https";
import "./phieu-xuat-kho.css";

const { RangePicker } = DatePicker;

const { Title } = Typography;

const ListPhieuXuatKho = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("access_token");
  const [allData, setAllData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [screenSize, setScreenSize] = useState("desktop");
  const [filters, setFilters] = useState({
    so_ct: "",
    ma_kh: "",
    ten_kh: "",
    dateRange: null,
  });

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

  const fetchPhieuXuatKho = async (filterParams = filters) => {
    const body = {
      store: "api_list_phieu_xuat_kho_voucher",
      param: {
        so_ct: filterParams.so_ct || "",
        ma_kh: filterParams.ma_kh || "",
        ten_kh: filterParams.ten_kh || "",
        ngay_ct: "",
        DateFrom:
          filterParams.dateRange && filterParams.dateRange[0]
            ? filterParams.dateRange[0].format("YYYY-MM-DD")
            : dayjs().startOf("month").format("YYYY-MM-DD"),
        DateTo:
          filterParams.dateRange && filterParams.dateRange[1]
            ? filterParams.dateRange[1].format("YYYY-MM-DD")
            : dayjs().endOf("month").format("YYYY-MM-DD"),
        PageIndex: currentPage,
        PageSize: pageSize,
        Status: "",
      },
      data: {},
      resultSetNames: ["data", "pagination"],
    };
    try {
      const res = await https.post("v1/dynamicApi/call-dynamic-api", body, {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      });

      // Xử lý response theo cấu trúc mới
      const responseData = res.data?.listObject?.dataLists?.data || [];
      const paginationData =
        res.data?.listObject?.dataLists?.pagination?.[0] || {};

      const filteredData = responseData.filter(
        (item) => item.status !== "*" && item.status !== null
      );

      setAllData(filteredData);
      setTotalRecords(paginationData.totalRecord || filteredData.length);
    } catch (err) {
      console.error("Lỗi gọi API danh sách phiếu xuất kho:", err);
    }
  };

  useEffect(() => {
    fetchPhieuXuatKho();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "0":
        return "orange";
      case "2":
        return "blue";
      case "3":
        return "green";
      case "5":
        return "purple";
      default:
        return "default";
    }
  };

  const handleDelete = async (sttRec) => {
    showConfirm({
      title: "Xác nhận xóa phiếu xuất kho",
      content: "Bạn có chắc chắn muốn xóa phiếu xuất kho này không?",
      type: "warning",
      onOk: async () => {
        try {
          if (!sttRec) {
            message.error("Không tìm thấy mã phiếu để xóa");
            return;
          }

          const body = {
            store: "api_delete_phieu_xuat_kho_voucher",
            param: { stt_rec: sttRec },
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

          if (response.data && (response.data.statusCode === 200 || response.data.responseModel?.isSucceded || (response.data?.responseModel?.message && response.data.responseModel.message.includes("thành công")))) {
            message.success("Xóa phiếu xuất kho thành công");
            await fetchPhieuXuatKho();
          } else {
            message.error(response.data?.message || "Xóa phiếu xuất kho thất bại");
          }
        } catch (error) {
          console.error("Lỗi khi xóa phiếu xuất kho:", error);
          if (error.response?.data?.message) {
            message.error(error.response.data.message);
          } else {
            message.error("Có lỗi xảy ra khi xóa phiếu xuất kho");
          }
        }
      },
    });
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
        title: "Mã phiếu",
        dataIndex: "stt_rec",
        key: "stt_rec",
        width: 150,
        align: "center",
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
              style={{ marginBottom: 8, display: "block" }}
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
                fetchPhieuXuatKho(newFilters);
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
                fetchPhieuXuatKho(newFilters);
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
                fetchPhieuXuatKho(newFilters);
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
                  fetchPhieuXuatKho(newFilters);
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
                  fetchPhieuXuatKho(newFilters);
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
                  fetchPhieuXuatKho(newFilters);
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
                  fetchPhieuXuatKho(newFilters);
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

    baseColumns.push({
      title: "Trạng thái",
      dataIndex: "statusname",
      key: "status",
      width: screenSize === "mobile" ? 80 : 120,
      align: "center",
      render: (statusname, record) => {
        if (record.status === "*" || record.status === null) {
          return "";
        }

        // Fallback cho statusname nếu API không trả về
        const getStatusText = (status) => {
          const statusMap = {
            0: screenSize === "mobile" ? "Lập CT" : "Lập chứng từ",
            2: screenSize === "mobile" ? "Nhập" : "Nhập kho",
            3: screenSize === "mobile" ? "Chuyển" : "Chuyển số cái",
            5: screenSize === "mobile" ? "Đề nghị" : "Đề nghị xuất kho",
          };
          return statusMap[status] || "Không xác định";
        };

        const displayText = statusname || getStatusText(record.status);
        const statusColor = getStatusColor(record.status);

        return <Tag color={statusColor}>{displayText}</Tag>;
      },
    });

    baseColumns.push({
      title: "Hành động",
      key: "action",
      width: 150,
      align: "center",
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            icon={<FileTextOutlined />}
            onClick={() =>
              navigate(`${record.stt_rec}`, {
                state: { sctRec: record.stt_rec },
              })
            }
            className="phieu-action-btn phieu-view-btn"
            title="Xem chi tiết"
          />
          <Button
            size="small"
            type="primary"
            icon={<EditOutlined />}
            onClick={() =>
              navigate(`edit/${record.stt_rec}`, {
                state: { sctRec: record.stt_rec },
              })
            }
            className="phieu-action-btn phieu-edit-btn"
            title="Chỉnh sửa"
          />
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.stt_rec)}
            className="phieu-action-btn phieu-delete-btn"
            title="Xóa"
          />
        </Space>
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
      scroll: { x: 1200 },
    };

    if (screenSize === "mobile") {
      baseProps.scroll = { x: 400 };
      baseProps.size = "small";
    } else if (screenSize === "mobileLandscape") {
      baseProps.scroll = { x: 600, y: 400 };
      baseProps.size = "small";
    } else if (screenSize === "tablet") {
      baseProps.scroll = { x: 800, y: 500 };
    } else {
      baseProps.scroll = { x: 1200, y: 600 };
    }

    return baseProps;
  };

  return (
    <div className="phieu-xuat-container">
      <Row justify="space-between" align="middle" className="phieu-xuat-header">
        <Col>
          <Button
            type="text"
            icon={<LeftOutlined />}
            onClick={() => navigate("/boxly")}
            className="phieu-xuat-back-button"
          >
            {screenSize === "mobile" ? "" : "Trở về"}
          </Button>
        </Col>
        <Col>
          <Title level={5} className="phieu-xuat-title">
            {screenSize === "mobile"
              ? "PHIẾU XUẤT KHO"
              : "DANH SÁCH PHIẾU XUẤT KHO"}
          </Title>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("add")}
            className="phieu-xuat-add-button"
          >
            {screenSize === "mobile" ? "Thêm" : "Thêm mới"}
          </Button>
        </Col>
      </Row>

      <div className="phieu-xuat-table-container">
        <Table {...getTableProps()} />
      </div>
    </div>
  );
};

export default ListPhieuXuatKho;
