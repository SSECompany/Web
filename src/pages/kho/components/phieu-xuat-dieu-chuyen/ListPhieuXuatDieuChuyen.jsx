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
    status: [],
  });

  const pageSize = 20;

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

  const fetchPhieuXuatDieuChuyen = useCallback(async (filterParams = filters) => {
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
      Status: filterParams.status && filterParams.status.length > 0 ? filterParams.status.join(",") : "",
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
  }, [currentPage, filters, pageSize]);

  useEffect(() => {
    fetchPhieuXuatDieuChuyen();
  }, [fetchPhieuXuatDieuChuyen]);

  const handleRefresh = () => {
    fetchPhieuXuatDieuChuyen(filters);
  };

  const removeFilter = (key) => {
    const newFilters = { ...filters };
    if (key === "dateRange") {
      newFilters.dateRange = null;
    } else {
      newFilters[key] = "";
    }
    setFilters(newFilters);
    fetchPhieuXuatDieuChuyen(newFilters);
  };

  const clearAllFilters = () => {
    const cleared = {
      so_ct: "",
      ma_kho: "",
      ma_khon: "",
      dateRange: null,
      status: [],
    };
    setFilters(cleared);
    fetchPhieuXuatDieuChuyen(cleared);
  };

  const activeChips = useMemo(() => {
    const chips = [];
    if (filters.so_ct)
      chips.push({ key: "so_ct", label: "Số chứng từ", value: filters.so_ct });
    if (filters.ma_kho)
      chips.push({ key: "ma_kho", label: "Mã kho", value: filters.ma_kho });
    if (filters.ma_khon)
      chips.push({ key: "ma_khon", label: "Mã kho nhập", value: filters.ma_khon });
    if (filters.dateRange && filters.dateRange.length === 2) {
      const display = `${filters.dateRange[0].format(
        "DD/MM/YYYY"
      )} - ${filters.dateRange[1].format("DD/MM/YYYY")}`;
      chips.push({ key: "dateRange", label: "Ngày", value: display });
    }
    if (filters.status && filters.status.length > 0) {
      const statusLabels = {
        "0": "Lập chứng từ",
        "2": "Xuất kho",
        "3": "Chuyển số cái",
        "4": "Hoàn tất",
        "5": "Đề nghị xuất kho",
        "6": "Đang xử lý"
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
        title: "Số chứng từ",
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
          title: "Mã kho",
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
          title: "Mã kho nhập",
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
        const displayText = (statusname ? statusname.replace(/^\d+\.\s*/, "") : "") || getStatusText(record.status);
        const statusColor = getStatusColor(record.status);
        return <Tag color={statusColor}>{displayText}</Tag>;
      },
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
        <div style={{ padding: 8 }}>
          <Select
            mode="multiple"
            placeholder="Chọn trạng thái"
            value={selectedKeys}
            onChange={setSelectedKeys}
            style={{ width: 180, marginBottom: 8, display: 'block' }}
            allowClear
          >
            <Select.Option value="0">Lập chứng từ</Select.Option>
            <Select.Option value="5">Đề nghị xuất kho</Select.Option>
            <Select.Option value="2">Xuất kho</Select.Option>
            <Select.Option value="3">Chuyển số cài</Select.Option>
            <Select.Option value="4">Hoàn tất</Select.Option>
            <Select.Option value="6">Đang xử lý</Select.Option>
          </Select>
          <Button
            type="primary"
            onClick={() => {
              confirm();
              const newFilters = { ...filters, status: selectedKeys };
              setFilters(newFilters);
              fetchPhieuXuatDieuChuyen(newFilters);
            }}
            size="small"
            style={{ width: '100%' }}
          >
            Tìm kiếm
          </Button>
        </div>
      ),
      filteredValue: filters.status && filters.status.length > 0 ? filters.status : null,
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
              navigate(`/kho/xuat-dieu-chuyen/chi-tiet/${record.stt_rec}`, {
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
              navigate(`/kho/xuat-dieu-chuyen/chi-tiet/${record.stt_rec}`, {
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
      title="PHIẾU XUẤT ĐIỀU CHUYỂN"
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

export default ListPhieuXuatDieuChuyen;
