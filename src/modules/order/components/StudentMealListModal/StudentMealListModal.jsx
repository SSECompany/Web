import {
  CheckOutlined,
  EditOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import {
  Button,
  DatePicker,
  Input,
  Modal,
  notification,
  Select,
  Spin,
  Table,
  Tag,
} from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useReactToPrint } from "react-to-print";
import { multipleTablePutApi } from "../../../../api";
import jwt from "../../../../utils/jwt";
import PrintComponent from "../RetailOrderListModal/PrintComponent/PrintComponent";
import "./StudentMealListModal.css";

const StudentMealListModal = ({ isOpen, onClose }) => {
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
  const [printMaster, setPrintMaster] = useState({});
  const [printDetail, setPrintDetail] = useState([]);
  const printContent = useRef();
  const lastApiCall = useRef({ pageIndex: 0, filters: {} });

  const rawToken = localStorage.getItem("access_token");
  const claims =
    rawToken && rawToken.split(".").length === 3 ? jwt.getClaims?.() || {} : {};
  const fullName = claims?.FullName;

  const [isEditingOrder, setIsEditingOrder] = useState(false);

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
        // TODO: Thay thế bằng API thực tế cho student meal
        const res = await multipleTablePutApi({
          store: "api_get_student_meal_list", // Thay thế bằng store thực tế
          param: {
            studentName: filtersToUse.studentName || "",
            studentId: filtersToUse.studentId || "",
            mealType: filtersToUse.mealType || "",
            date: filtersToUse.date || "",
            status: filtersToUse.status || "",
            pageIndex: pageIndex,
            pageSize: pageSize,
            userId: id,
            unitId: unitId,
            storeId: storeId,
          },
          data: {},
        });

        const updatedData = Array.isArray(res?.listObject[0])
          ? res.listObject[0]
          : [];
        const paginationInfo = res?.listObject[2]?.[0] || {};
        const totalRecords = paginationInfo.totalRecord || updatedData.length;

        setAllData(updatedData);
        setTotalRecords(totalRecords);
      } catch (err) {
        console.error("Lỗi khi lấy danh sách suất ăn sinh viên:", err);
        notification.error({
          message: "Lỗi khi tải danh sách suất ăn sinh viên",
          duration: 4,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [stableFilters, id, unitId, storeId, isOpen, isLoading]
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
      lastApiCall.current = { pageIndex: 0, filters: {} };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Sử dụng data trực tiếp từ API (backend pagination)
  const currentData = allData;

  // Helper function để xử lý filter
  const handleFilter = (key, value, confirm) => {
    confirm();
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    setCurrentPage(1); // Reset về trang 1 khi filter
    // Gọi API ngay lập tức khi filter thay đổi với pageIndex = 1 và truyền filters mới
    fetchStudentMealData(1, newFilters);
  };

  // Helper function để xử lý thay đổi trang
  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Gọi API ngay lập tức khi thay đổi trang với pageIndex mới và filters hiện tại
    fetchStudentMealData(page, filters);
  };

  const columns = [
    {
      title: "Tên sinh viên",
      dataIndex: "studentName",
      key: "studentName",
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
        <div className="filter-dropdown">
          <Input
            placeholder="Tìm tên sinh viên"
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() =>
              handleFilter("studentName", selectedKeys[0], confirm)
            }
            style={{ marginBottom: 8, display: "block" }}
          />
          <Button
            className="search_button"
            type="primary"
            onClick={() =>
              handleFilter("studentName", selectedKeys[0], confirm)
            }
            size="small"
          >
            Tìm kiếm
          </Button>
        </div>
      ),
    },
    {
      title: "Mã sinh viên",
      dataIndex: "studentId",
      key: "studentId",
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
        <div className="filter-dropdown">
          <Input
            placeholder="Tìm mã sinh viên"
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() =>
              handleFilter("studentId", selectedKeys[0], confirm)
            }
            style={{ marginBottom: 8, display: "block" }}
          />
          <Button
            className="search_button"
            type="primary"
            onClick={() => handleFilter("studentId", selectedKeys[0], confirm)}
            size="small"
          >
            Tìm kiếm
          </Button>
        </div>
      ),
    },
    {
      title: "Loại suất ăn",
      dataIndex: "mealType",
      key: "mealType",
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
        <div className="filter-dropdown">
          <Select
            placeholder="Chọn loại suất ăn"
            value={selectedKeys[0]}
            onChange={(value) => setSelectedKeys(value ? [value] : [])}
            style={{ width: "100%", marginBottom: 8 }}
          >
            <Select.Option value="Bữa sáng">Bữa sáng</Select.Option>
            <Select.Option value="Bữa trưa">Bữa trưa</Select.Option>
            <Select.Option value="Bữa tối">Bữa tối</Select.Option>
          </Select>
          <Button
            className="search_button"
            type="primary"
            onClick={() => handleFilter("mealType", selectedKeys[0], confirm)}
            size="small"
          >
            Tìm kiếm
          </Button>
        </div>
      ),
    },
    {
      title: "Ngày",
      dataIndex: "date",
      key: "date",
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
        <div className="filter-dropdown">
          <DatePicker
            placeholder="Chọn ngày"
            value={selectedKeys[0]}
            onChange={(date) => setSelectedKeys(date ? [date] : [])}
            style={{ width: "100%", marginBottom: 8 }}
          />
          <Button
            className="search_button"
            type="primary"
            onClick={() => handleFilter("date", selectedKeys[0], confirm)}
            size="small"
          >
            Tìm kiếm
          </Button>
        </div>
      ),
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
      render: (amount) => (
        <span style={{ color: "#1890ff", fontWeight: "600" }}>
          {amount?.toLocaleString() || 0} VNĐ
        </span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      align: "center",
      render: (text) => (
        <Tag color={text === "Đã thanh toán" ? "green" : "orange"}>{text}</Tag>
      ),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
        <div className="filter-dropdown">
          <Select
            placeholder="Chọn trạng thái"
            value={selectedKeys[0]}
            onChange={(value) => setSelectedKeys(value ? [value] : [])}
            style={{ width: "100%", marginBottom: 8 }}
          >
            <Select.Option value="Đã thanh toán">Đã thanh toán</Select.Option>
            <Select.Option value="Chưa thanh toán">
              Chưa thanh toán
            </Select.Option>
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
      render: (_, record) => (
        <div className="action-buttons">
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            type="danger"
            size="small"
            className="edit_button"
            disabled={isEditingOrder}
          />
          <Button
            icon={<PrinterOutlined />}
            onClick={() => handlePrint(record)}
            size="small"
            type="primary"
            className="print_button"
          />
          <Button
            icon={<CheckOutlined />}
            onClick={() => handleApprove(record)}
            size="small"
            type="primary"
            className="approve_button"
            disabled={record.status === "Đã thanh toán"}
          />
        </div>
      ),
    },
  ];

  const handleEdit = async (record) => {
    if (isEditingOrder) return;
    setIsEditingOrder(true);

    try {
      // TODO: Implement edit functionality
      notification.success({
        message: "Chỉnh sửa suất ăn sinh viên",
        description: `Đang chỉnh sửa suất ăn cho ${record.studentName}`,
        duration: 4,
      });
    } catch (err) {
      notification.error({
        message: "Lỗi khi chỉnh sửa suất ăn",
        duration: 4,
      });
    } finally {
      setIsEditingOrder(false);
    }
  };

  const handlePrint = useReactToPrint({
    content: () => printContent.current,
    documentTitle: "Print Student Meal",
    copyStyles: false,
  });

  const handleApprove = async (record) => {
    try {
      // TODO: Implement approve functionality
      notification.success({
        message: "Xác nhận thanh toán",
        description: `Đã xác nhận thanh toán cho ${record.studentName}`,
        duration: 4,
      });
    } catch (err) {
      notification.error({
        message: "Lỗi khi xác nhận thanh toán",
        duration: 4,
      });
    }
  };

  return (
    <>
      <Modal
        open={isOpen}
        width="95%"
        title="Danh sách suất ăn sinh viên"
        destroyOnClose
        onCancel={onClose}
        footer={null}
        centered
      >
        <div className="student-meal-modal-container">
          {isLoading ? (
            <Spin size="large" />
          ) : (
            <Table
              dataSource={currentData}
              columns={columns}
              rowKey="id"
              className="student-meal-table"
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: totalRecords,
                showSizeChanger: false,
                showQuickJumper: false,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} của ${total} suất ăn`,
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
