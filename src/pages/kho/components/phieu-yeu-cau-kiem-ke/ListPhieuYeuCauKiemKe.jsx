import { AuditOutlined, ReloadOutlined } from "@ant-design/icons";
import { Button, DatePicker, Input, message, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import https from "../../../../utils/https";
import "../common-phieu.css";
import CommonPhieuList from "../CommonPhieuList";
import { useSelector } from "react-redux";

const { RangePicker } = DatePicker;

const { Title } = Typography;

const ListPhieuYeuCauKiemKe = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("access_token");

  // Lấy thông tin user từ Redux (tương tự ListPhieuNhatHang)
  const userInfo = useSelector((state) => state?.claimsReducer?.userInfo || {});

  // Get unitsResponse from localStorage as fallback cho unitId, giống ở ListPhieuNhatHang
  const unitsResponseStr = localStorage.getItem("unitsResponse");
  const unitsResponse = unitsResponseStr ? JSON.parse(unitsResponseStr) : {};

  const currentStoreId = userInfo?.storeId || unitsResponse?.id || "";
  const currentUnitId = userInfo?.unitId || userInfo?.unitCode || unitsResponse?.unitCode || "";
  const currentUserId = userInfo?.id || userInfo?.userId || 1;

  const [allData, setAllData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [screenSize, setScreenSize] = useState("desktop");
  const [filters, setFilters] = useState({
    so_ct: "",
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

  const fetchPhieuYeuCauKiemKe = async (filterParams = filters) => {
    const body = {
      store: "api_list_phieu_yeu_cau_kiem_ke",
      param: {
        so_ct: filterParams.so_ct || "",
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
        StoreId: currentStoreId,
        UnitId: currentUnitId,
        Status: "",
        Userid: currentUserId,
      },
      data: {},
      resultSetNames: ["data", "pagination"],
    };
    try {
      const res = await https.post("User/AddData", body, {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      });

      // Xử lý response - API trả về listObject là mảng lồng mảng
      const listObj = res.data?.listObject;
      let responseData = [];
      let paginationData = {};

      if (listObj?.dataLists) {
        // Cấu trúc cũ: listObject.dataLists.data
        responseData = listObj.dataLists.data || [];
        paginationData = listObj.dataLists.pagination?.[0] || {};
      } else if (Array.isArray(listObj)) {
        // Cấu trúc mới: listObject[0] = data, listObject[1] = pagination
        responseData = Array.isArray(listObj[0]) ? listObj[0] : [];
        paginationData = Array.isArray(listObj[1]) ? listObj[1]?.[0] || {} : {};
      }

      const filteredData = responseData.filter(
        (item) => item.status !== "*" && item.status !== null
      );

      setAllData(filteredData);
      setTotalRecords(paginationData.totalRecord || filteredData.length);
    } catch (err) {
      console.error("Lỗi gọi API danh sách phiếu yêu cầu kiểm kê:", err);
    }
  };

  useEffect(() => {
    fetchPhieuYeuCauKiemKe();
  }, [currentPage]); // re-fetch when page changes

  // Làm tươi mềm: gọi lại API lấy data mới nhất (không reload trang)
  useEffect(() => {
    const handler = () => {
      fetchPhieuYeuCauKiemKe(filters);
    };
    window.addEventListener("appRefreshRequested", handler);
    return () => window.removeEventListener("appRefreshRequested", handler);
  }, [currentPage, filters]);

  const handleRefreshClick = () => {
    fetchPhieuYeuCauKiemKe(filters);
  };

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
                fetchPhieuYeuCauKiemKe(newFilters);
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
          text ? dayjs(text).format(screenSize === "mobile" ? "DD/MM" : "DD/MM/YYYY") : "",
      },

      {
        title: "Diễn giải",
        dataIndex: "dien_giai",
        key: "dien_giai",
        width: 200,
        align: "left",
        ellipsis: true,
        render: (text) => (text ? text.trim() : ""),
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
                fetchPhieuYeuCauKiemKe(newFilters);
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
                fetchPhieuYeuCauKiemKe(newFilters);
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

        const getStatusText = (status) => {
          const statusMap = {
            0: screenSize === "mobile" ? "Lập CT" : "Lập chứng từ",
            2: screenSize === "mobile" ? "Đã duyệt" : "Đã duyệt",
            3: screenSize === "mobile" ? "Đã KT" : "Đã kiểm kê",
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
      width: 80,
      align: "center",
      fixed: "right",
      render: (_, record) => (
        <div className="phieu-action-group">
          <button
            className="phieu-action-btn phieu-action-btn--edit"
            title="Kiểm kê"
            onClick={() =>
              navigate(`/kho/yeu-cau-kiem-ke/chi-tiet/${record.stt_rec}`, {
                state: {
                  sctRec: record.stt_rec,
                  ngay_ct: record.ngay_ct,
                  so_ct: record.so_ct,
                  ma_kho: record.ma_kho,
                },
              })
            }
          >
            <AuditOutlined />
          </button>
        </div>
      ),
    });

    return baseColumns;
  };

  return (
    <CommonPhieuList
      title={
        screenSize === "mobile" ? "YÊU CẦU KIỂM KÊ" : "DANH SÁCH YÊU CẦU KIỂM KÊ"
      }
      columns={getColumns()}
      data={paginatedData}
      onBack={() => navigate("/kho")}
      extraButtons={
        <span style={{ marginRight: 8 }}>
          <button
            type="button"
            className="navbar_fullscreen_btn"
            onClick={handleRefreshClick}
            title="Làm tươi"
            aria-label="Làm tươi"
          >
            <ReloadOutlined />
          </button>
        </span>
      }
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

export default ListPhieuYeuCauKiemKe;
