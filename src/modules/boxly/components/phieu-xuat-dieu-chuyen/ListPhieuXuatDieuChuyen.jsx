import {
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { Button, DatePicker, Input, message, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import showConfirm from "../../../../components/common/Modal/ModalConfirm";
import https from "../../../../utils/https";
import "../common-phieu.css";
import CommonPhieuList from "../CommonPhieuList";
import { fetchPhieuXuatDieuChuyenList } from "./utils/phieuXuatDieuChuyenApi";

const { RangePicker } = DatePicker;

const { Title } = Typography;

const ListPhieuXuatDieuChuyen = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("access_token");
  const [allData, setAllData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [screenSize, setScreenSize] = useState("desktop");
  const [filters, setFilters] = useState({
    so_ct: "",
    ma_kho: "",
    ma_khon: "",
    dateRange: null,
  });

  const pageSize = 20;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = allData.slice(startIndex, endIndex);

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

  const fetchPhieuXuatDieuChuyen = async (filterParams = filters) => {
    const params = {
      so_ct: filterParams.so_ct || "",
      ma_kho: filterParams.ma_kho || "",
      ma_khon: filterParams.ma_khon || "",
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
    };

    const result = await fetchPhieuXuatDieuChuyenList(params);

    if (result.success) {
      setAllData(result.data);
      setTotalRecords(result.pagination.totalRecord || result.data.length);
    } else {
      console.error(
        "Lỗi gọi API danh sách phiếu xuất điều chuyển:",
        result.error
      );
    }
  };

  useEffect(() => {
    fetchPhieuXuatDieuChuyen();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "0":
        return "orange";
      case "2":
        return "blue";
      case "3":
        return "green";
      case "4":
        return "cyan";
      case "5":
        return "purple";
      case "6":
        return "gold";
      default:
        return "default";
    }
  };

  const handleDelete = async (sttRec) => {
    showConfirm({
      title: "Xác nhận xóa phiếu xuất điều chuyển",
      content: "Bạn có chắc chắn muốn xóa phiếu xuất điều chuyển này không?",
      type: "warning",
      onOk: async () => {
        try {
          if (!sttRec) {
            message.error("Không tìm thấy mã phiếu để xóa");
            return;
          }

          const body = {
            store: "api_delete_xuat_dieu_chuyen_voucher",
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

          const hasResponseModel =
            response?.data &&
            typeof response.data.responseModel !== "undefined";
          const isSuccess = hasResponseModel
            ? response.data.responseModel.isSucceded === true
            : response?.data?.statusCode === 200;

          if (isSuccess) {
            message.success("Xóa phiếu xuất điều chuyển thành công");
            await fetchPhieuXuatDieuChuyen();
          } else {
            message.error(
              response.data?.message || "Xóa phiếu xuất điều chuyển thất bại"
            );
          }
        } catch (error) {
          console.error("Lỗi khi xóa phiếu xuất điều chuyển:", error);
          if (error.response?.data?.message) {
            message.error(error.response.data.message);
          } else {
            message.error("Có lỗi xảy ra khi xóa phiếu xuất điều chuyển");
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
                fetchPhieuXuatDieuChuyen(newFilters);
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
                fetchPhieuXuatDieuChuyen(newFilters);
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
              Mã kho{" "}
              {filters.ma_kho ? (
                <Tag color="blue" size="small">
                  {filters.ma_kho}
                </Tag>
              ) : null}
            </div>
          ),
          dataIndex: "ma_kho",
          key: "ma_kho",
          width: 150,
          align: "center",
          render: (text) => (text ? text.trim() : ""),
          filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
            <div style={{ padding: 8 }}>
              <Input
                placeholder="Tìm Mã kho"
                value={selectedKeys[0]}
                onChange={(e) =>
                  setSelectedKeys(e.target.value ? [e.target.value] : [])
                }
                onPressEnter={() => {
                  confirm();
                  const newFilters = {
                    ...filters,
                    ma_kho: selectedKeys[0] || "",
                  };
                  setFilters(newFilters);
                  fetchPhieuXuatDieuChuyen(newFilters);
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
                    ma_kho: selectedKeys[0] || "",
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
          filteredValue: filters.ma_kho ? [filters.ma_kho] : null,
        },
        {
          title: () => (
            <div className="filter-column-header-wide">
              Mã kho nhập
              {filters.ma_khon ? (
                <Tag color="blue" size="small">
                  {filters.ma_khon}
                </Tag>
              ) : null}
            </div>
          ),
          dataIndex: "ma_khon",
          key: "ma_khon",
          width: 250,
          align: "center",
          render: (text) => (text ? text.trim() : ""),
          filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
            <div style={{ padding: 8 }}>
              <Input
                placeholder="Tìm Mã kho nhập"
                value={selectedKeys[0]}
                onChange={(e) =>
                  setSelectedKeys(e.target.value ? [e.target.value] : [])
                }
                onPressEnter={() => {
                  confirm();
                  const newFilters = {
                    ...filters,
                    ma_khon: selectedKeys[0] || "",
                  };
                  setFilters(newFilters);
                  fetchPhieuXuatDieuChuyen(newFilters);
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
                    ma_khon: selectedKeys[0] || "",
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
          filteredValue: filters.ma_khon ? [filters.ma_khon] : null,
        }
      );
    }

    baseColumns.push({
      title: "Trạng thái",
      dataIndex: "statusname",
      key: "status",
      width: 180, // tăng width cho cột trạng thái
      align: "center",
      render: (statusname, record) => {
        if (record.status === "*" || record.status === null) {
          return "";
        }
        const getStatusText = (status) => {
          const statusMap = {
            0: screenSize === "mobile" ? "Lập CT" : "Lập chứng từ",
            2: screenSize === "mobile" ? "Xuất" : "Xuất kho",
            3: screenSize === "mobile" ? "Chuyển" : "Chuyển số cài",
            4: screenSize === "mobile" ? "Hoàn tất" : "Hoàn tất",
            5: screenSize === "mobile" ? "Đề nghị" : "Đề nghị xuất kho",
            6: screenSize === "mobile" ? "Đang xử lý" : "Đang xử lý",
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
      scroll: { x: 1800, y: 600 },
    };
    if (screenSize === "mobile") {
      baseProps.scroll = { x: 600 };
      baseProps.size = "small";
    } else if (screenSize === "mobileLandscape") {
      baseProps.scroll = { x: 800, y: 400 };
      baseProps.size = "small";
    } else if (screenSize === "tablet") {
      baseProps.scroll = { x: 1400, y: 500 };
    } else {
      baseProps.scroll = { x: 1800, y: 600 };
    }
    return baseProps;
  };

  return (
    <CommonPhieuList
      title="DANH SÁCH PHIẾU XUẤT ĐIỀU CHUYỂN"
      columns={getColumns()}
      data={paginatedData}
      onAdd={() => navigate("add")}
      onBack={() => navigate("/boxly")}
      addLabel="Thêm mới"
      rowKey="stt_rec"
      pagination={{
        current: currentPage,
        pageSize: pageSize,
        total: totalRecords,
        onChange: (page) => setCurrentPage(page),
        showSizeChanger: false,
        showQuickJumper: false,
      }}
    />
  );
};

export default ListPhieuXuatDieuChuyen;
