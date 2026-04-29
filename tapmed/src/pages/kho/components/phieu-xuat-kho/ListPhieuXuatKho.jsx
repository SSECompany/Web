import {
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  FilterOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { Button, DatePicker, Input, message, Tag, Typography, Select } from "antd";
import dayjs from "dayjs";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import showConfirm from "../../../../components/common/Modal/ModalConfirm";
import https from "../../../../utils/https";
import "../common-phieu.css";
import ListTemplate from "../../../../components/common/PageTemplates/ListTemplate";

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
    status: [],
  });

  const pageSize = 20;

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

  const fetchPhieuXuatKho = useCallback(async (filterParams = filters) => {
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
        Status: filterParams.status && filterParams.status.length > 0 ? filterParams.status.join(",") : "",
      },
      data: {},
      resultSetNames: ["data", "pagination"],
    };
    try {
      const res = await https.post("User/AddData", body, {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      });

      // Xử lý response theo cấu trúc mới
      const responseData = res.data?.listObject?.dataLists?.data || [];
      const paginationData =
        res.data?.listObject?.dataLists?.pagination?.[0] || {};

      setAllData(responseData);
      setTotalRecords(paginationData.totalRecord || responseData.length);
    } catch (err) {
      console.error("Lỗi gọi API danh sách phiếu xuất kho:", err);
    }
  }, [currentPage, filters, pageSize, token]);

  useEffect(() => {
    fetchPhieuXuatKho();
  }, [fetchPhieuXuatKho]);

  const handleRefresh = () => {
    fetchPhieuXuatKho(filters);
  };

  const removeFilter = (key) => {
    const newFilters = { ...filters };
    if (key === "dateRange") {
      newFilters.dateRange = null;
    } else {
      newFilters[key] = "";
    }
    setFilters(newFilters);
    fetchPhieuXuatKho(newFilters);
  };

  const clearAllFilters = () => {
    const cleared = {
      so_ct: "",
      ma_kh: "",
      ten_kh: "",
      dateRange: null,
      status: [],
    };
    setFilters(cleared);
    fetchPhieuXuatKho(cleared);
  };

  const activeChips = useMemo(() => {
    const chips = [];
    if (filters.so_ct)
      chips.push({ key: "so_ct", label: "Số chứng từ", value: filters.so_ct });
    if (filters.ma_kh)
      chips.push({ key: "ma_kh", label: "Mã khách", value: filters.ma_kh });
    if (filters.ten_kh)
      chips.push({ key: "ten_kh", label: "Tên khách", value: filters.ten_kh });
    if (filters.dateRange && filters.dateRange.length === 2) {
      const display = `${filters.dateRange[0].format(
        "DD/MM/YYYY"
      )} - ${filters.dateRange[1].format("DD/MM/YYYY")}`;
      chips.push({ key: "dateRange", label: "Ngày", value: display });
    }
    if (filters.status && filters.status.length > 0) {
      const statusLabels = {
        "0": "Lập chứng từ",
        "1": "Xuất kho",
        "3": "Chuyển sổ cái",
        "5": "Đề nghị xuất kho"
      };
      const display = filters.status.map(s => statusLabels[s] || s).join(", ");
      chips.push({ key: "status", label: "Trạng thái", value: display });
    }
    return chips;
  }, [filters]);

  // chipsBar removed, handled by ListTemplate

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
          const response = await https.post("User/AddData", body, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          const hasResponseModel =
            response?.data &&
            typeof response.data.responseModel !== "undefined";
          const isSuccess = hasResponseModel
            ? response.data.responseModel.isSucceded === true
            : response?.data?.statusCode === 200;

          if (isSuccess) {
            message.success("Xóa phiếu xuất kho thành công");
            await fetchPhieuXuatKho();
          } else {
            message.error(
              response.data?.message || "Xóa phiếu xuất kho thất bại"
            );
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

        const displayText = (statusname ? statusname.replace(/^\d+\.\s*/, "") : "") || getStatusText(record.status);
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
              navigate(`/kho/xuat-kho/chi-tiet/${record.stt_rec}`, {
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
              navigate(`/kho/xuat-kho/chi-tiet/${record.stt_rec}`, {
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


  return (
    <ListTemplate
      title={
        screenSize === "mobile" ? "PHIẾU XUẤT KHO" : "PHIẾU XUẤT KHO"
      }
      columns={getColumns()}
      data={allData}
      onAdd={() => navigate("them-moi")}
      onBack={() => navigate("/kho")}
      onRefresh={handleRefresh}
      activeChips={activeChips}
      onRemoveFilter={removeFilter}
      onClearAllFilters={clearAllFilters}
      rowKey="stt_rec"
      pagination={{
        current: currentPage,
        pageSize: pageSize,
        total: totalRecords,
        onChange: (page) => setCurrentPage(page),
      }}
    />
  );
};

export default ListPhieuXuatKho;
