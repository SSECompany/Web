import {
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  LeftOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  Button,
  DatePicker,
  Input,
  message,
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
import "./phieu-xuat-dieu-chuyen.css";

const { RangePicker } = DatePicker;

const { Title } = Typography;

const ListPhieuXuatDieuChuyen = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("access_token");
  const [allData, setAllData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [filters, setFilters] = useState({
    so_ct: "",
    ma_kh: "",
    ten_kh: "",
    dateRange: null,
    status: "",
  });

  const pageSize = isMobile ? 10 : 20;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = allData.slice(startIndex, endIndex);

  // Detect screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchPhieuXuatDieuChuyen = async (filterParams = filters) => {
    const body = {
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
      ...filterParams,
    };
    try {
      const res = await https.get(
        "v1/web/danh-sach-chung-tu-xuat-dieu-chuyen",
        body,
        {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        }
      );
      setAllData(res.data.data || []);
      setTotalRecords((res.data.data || []).length);
    } catch (err) {
      console.error("Lỗi gọi API danh sách phiếu xuất điều chuyển:", err);
    }
  };

  useEffect(() => {
    fetchPhieuXuatDieuChuyen();
  }, []);

  const handleDelete = async (stt_rec) => {
    showConfirm({
      title: "Xác nhận xóa phiếu",
      content: "Bạn có chắc chắn muốn xóa phiếu này không?",
      type: "warning",
      onOk: async () => {
        try {
          const response = await https.post(
            "v1/web/xoa-ct-xuat-dieu-chuyen",
            {},
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              params: {
                sctRec: stt_rec,
              },
            }
          );

          if (response.data && response.data.statusCode === 200) {
            setAllData(allData.filter((item) => item.stt_rec !== stt_rec));
            message.success("Xóa phiếu thành công");
          } else {
            message.error(
              response.data?.message || "Có lỗi xảy ra khi xóa phiếu"
            );
          }
        } catch (error) {
          console.error("Lỗi khi xóa phiếu:", error);
          message.error("Không thể xóa phiếu. Vui lòng thử lại sau.");
        }
      },
    });
  };

  const renderFilterDropdown =
    (placeholder, filterKey, onSearch) =>
    ({ setSelectedKeys, selectedKeys, confirm }) =>
      (
        <div style={{ padding: 8, minWidth: 200 }}>
          <Input
            placeholder={placeholder}
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() => onSearch(selectedKeys, confirm, filterKey)}
            style={{ marginBottom: 8, display: "block" }}
            size={isMobile ? "small" : "middle"}
          />
          <Button
            className="search_button"
            type="primary"
            onClick={() => onSearch(selectedKeys, confirm, filterKey)}
            size={isMobile ? "small" : "middle"}
          >
            Tìm kiếm
          </Button>
        </div>
      );

  const handleSearch = (selectedKeys, confirm, filterKey) => {
    confirm();
    const newFilters = { ...filters, [filterKey]: selectedKeys[0] || "" };
    setFilters(newFilters);
    fetchPhieuXuatDieuChuyen(newFilters);
  };

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

  const mobileColumns = [
    {
      title: "STT",
      key: "stt",
      render: (_, __, index) => startIndex + index + 1,
      width: 50,
      align: "center",
    },
    {
      title: "Ngày CT",
      dataIndex: "ngay_ct",
      key: "ngay_ct",
      width: 100,
      render: (text) => dayjs(text).format("DD/MM"),
    },
    {
      title: "Số CT",
      dataIndex: "so_ct",
      key: "so_ct",
      width: 120,
      render: (text) => (
        <div style={{ fontSize: "12px", lineHeight: "1.2" }}>
          {text ? text.trim() : ""}
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "statusname",
      key: "status",
      width: 100,
      render: (statusname, record) => (
        <Tag color={getStatusColor(record.status)} size="small">
          {statusname}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 100,
      align: "center",
      render: (_, record) => (
        <Space size="small" direction="vertical">
          <Button
            size="small"
            icon={<FileTextOutlined />}
            onClick={() => navigate(`${record.stt_rec}`)}
            className="phieu-action-btn phieu-view-btn"
            style={{ width: "100%" }}
          >
            Xem
          </Button>
          <Space size={4}>
            <Button
              size="small"
              type="primary"
              icon={<EditOutlined />}
              onClick={() => navigate(`edit/${record.stt_rec}`)}
              className="phieu-action-btn phieu-edit-btn"
            />
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.stt_rec)}
              className="phieu-action-btn phieu-delete-btn"
            />
          </Space>
        </Space>
      ),
    },
  ];

  const desktopColumns = [
    {
      title: "STT",
      key: "stt",
      render: (_, __, index) => startIndex + index + 1,
      width: 60,
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
              fetchPhieuXuatDieuChuyen(newFilters);
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
      render: (text) => dayjs(text).format("DD/MM/YYYY"),
    },
    {
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
      filterDropdown: renderFilterDropdown("Tìm Số CT", "so_ct", handleSearch),
      filteredValue: filters.so_ct ? [filters.so_ct] : null,
    },
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
      filterDropdown: renderFilterDropdown(
        "Tìm Mã khách",
        "ma_kh",
        handleSearch
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
      filterDropdown: renderFilterDropdown(
        "Tìm Tên khách",
        "ten_kh",
        handleSearch
      ),
      filteredValue: filters.ten_kh ? [filters.ten_kh] : null,
    },
    {
      title: "Trạng thái",
      dataIndex: "statusname",
      key: "status",
      width: 120,
      align: "center",
      render: (statusname, record) => (
        <Tag color={getStatusColor(record.status)}>{statusname}</Tag>
      ),
    },
    {
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
            onClick={() => navigate(`${record.stt_rec}`)}
            className="phieu-action-btn phieu-view-btn"
            title="Xem chi tiết"
          />
          <Button
            size="small"
            type="primary"
            icon={<EditOutlined />}
            onClick={() => navigate(`edit/${record.stt_rec}`)}
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
    },
  ];

  return (
    <div className="phieu-container">
      <div className="phieu-header">
        <Button
          type="text"
          icon={<LeftOutlined />}
          onClick={() => navigate("..")}
          className="phieu-back-button"
        >
          Trở về
        </Button>

        <Title level={isMobile ? 4 : 3} className="phieu-title">
          DANH SÁCH PHIẾU XUẤT ĐIỀU CHUYỂN
        </Title>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate("add")}
          className="phieu-add-button"
        >
          {isMobile ? "Thêm" : "Thêm mới"}
        </Button>
      </div>

      <div className="phieu-table-container">
        <Table
          columns={isMobile ? mobileColumns : desktopColumns}
          dataSource={paginatedData}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalRecords,
            onChange: (page) => setCurrentPage(page),
            showSizeChanger: false,
            showQuickJumper: false,
            size: isMobile ? "small" : "default",
          }}
          bordered={!isMobile}
          rowKey="stt_rec"
          scroll={isMobile ? { x: 600, y: 400 } : { x: 1200, y: 600 }}
          className="phieu-data-table hidden_scroll_bar"
          size={isMobile ? "small" : "middle"}
          loading={false}
        />
      </div>
    </div>
  );
};

export default ListPhieuXuatDieuChuyen;
