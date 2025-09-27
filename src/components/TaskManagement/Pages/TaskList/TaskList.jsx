import {
  BellOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import {
  Button,
  Input,
  notification,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
} from "antd";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "../../../../Context/ConfirmDialog";
import TableLocale from "../../../../Context/TableLocale";
import { getUserInfo } from "../../../../store/selectors/Selectors";
import checkPermission from "../../../../utils/permission";
import DepartmentSelector from "../../../ReuseComponents/DepartmentSelector";
import HeaderTableBar from "../../../ReuseComponents/HeaderTableBar";
import { apiDeleteTask, apiGetTasks } from "../../API";
import ModalAddTask from "../../Modals/ModalAddTask/ModalAddTask";
import ModalAssignTask from "../../Modals/ModalAssignTask/ModalAssignTask";
import ModalTaskReminder from "../../Modals/ModalTaskReminder/ModalTaskReminder";
import {
  setDepartmentFilter,
  setError,
  setFilters,
  setLoading,
  setPagination,
  setTasksList,
} from "../../Store/Slices/TaskSlice";
import "./TaskList.css";

const { Search } = Input;
const { Option } = Select;

const TaskList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux state
  const { tasksList, loading, pagination, filters } = useSelector(
    (state) => state.tasks
  );
  const userInfo = useSelector(getUserInfo);

  // Local state
  const [tableColumns, setTableColumns] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [openModalType, setOpenModalType] = useState("Add");
  const [currentRecord, setCurrentRecord] = useState(null);
  const [openModalAddTaskState, setOpenModalAddTaskState] = useState(false);
  const [openModalAssignTaskState, setOpenModalAssignTaskState] =
    useState(false);
  const [openModalReminderState, setOpenModalReminderState] = useState(false);
  const [isOpenModalDeleteTask, setIsOpenModalDeleteTask] = useState(false);
  const [currentItemSelected, setCurrentItemSelected] = useState({});
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // Task status options
  const taskStatusOptions = [
    { value: "", label: "Tất cả" },
    { value: "PENDING", label: "Chờ thực hiện" },
    { value: "IN_PROGRESS", label: "Đang thực hiện" },
    { value: "REVIEW", label: "Đang xem xét" },
    { value: "COMPLETED", label: "Hoàn thành" },
    { value: "CANCELLED", label: "Đã hủy" },
  ];

  // Task priority options
  const priorityOptions = [
    { value: "", label: "Tất cả" },
    { value: "LOW", label: "Thấp" },
    { value: "MEDIUM", label: "Trung bình" },
    { value: "HIGH", label: "Cao" },
    { value: "URGENT", label: "Khẩn cấp" },
  ];

  // Table columns configuration
  const getTableColumns = () => {
    return [
      {
        title: "Mã công việc",
        dataIndex: "taskCode",
        key: "taskCode",
        width: 120,
        fixed: "left",
        sorter: true,
      },
      {
        title: "Tên công việc",
        dataIndex: "taskName",
        key: "taskName",
        width: 200,
        fixed: "left",
      },
      {
        title: "Dự án",
        dataIndex: "projectName",
        key: "projectName",
        width: 150,
        render: (text, record) => (
          <span style={{ color: "#1890ff", cursor: "pointer" }}>
            {text || "Không có"}
          </span>
        ),
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        width: 120,
        render: (status) => {
          const statusColors = {
            PENDING: "default",
            IN_PROGRESS: "processing",
            REVIEW: "warning",
            COMPLETED: "success",
            CANCELLED: "error",
          };
          const statusLabels = {
            PENDING: "Chờ thực hiện",
            IN_PROGRESS: "Đang thực hiện",
            REVIEW: "Đang xem xét",
            COMPLETED: "Hoàn thành",
            CANCELLED: "Đã hủy",
          };
          return <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>;
        },
      },
      {
        title: "Độ ưu tiên",
        dataIndex: "priority",
        key: "priority",
        width: 100,
        render: (priority) => {
          const priorityColors = {
            LOW: "default",
            MEDIUM: "blue",
            HIGH: "orange",
            URGENT: "red",
          };
          const priorityLabels = {
            LOW: "Thấp",
            MEDIUM: "Trung bình",
            HIGH: "Cao",
            URGENT: "Khẩn cấp",
          };
          return (
            <Tag color={priorityColors[priority]}>
              {priorityLabels[priority]}
            </Tag>
          );
        },
      },
      {
        title: "Người thực hiện",
        dataIndex: "assignedToName",
        key: "assignedToName",
        width: 150,
        render: (text) => text || "Chưa giao việc",
      },
      {
        title: "Người tạo",
        dataIndex: "createdByName",
        key: "createdByName",
        width: 120,
      },
      {
        title: "Ngày hết hạn",
        dataIndex: "dueDate",
        key: "dueDate",
        width: 120,
        render: (date) => {
          if (!date) return "";
          const dueDate = new Date(date);
          const today = new Date();
          const isOverdue = dueDate < today;

          return (
            <span style={{ color: isOverdue ? "#ff4d4f" : "#000" }}>
              {dueDate.toLocaleDateString("vi-VN")}
            </span>
          );
        },
      },
      {
        title: "Tiến độ (%)",
        dataIndex: "progress",
        key: "progress",
        width: 100,
        render: (progress) => `${progress || 0}%`,
      },
      {
        title: "Số giờ ước tính",
        dataIndex: "estimatedHours",
        key: "estimatedHours",
        width: 120,
        render: (hours) => (hours ? `${hours}h` : ""),
      },
      {
        title: "Thao tác",
        key: "action",
        width: 250,
        fixed: "right",
        render: (_, record) => (
          <Space size="small">
            <Tooltip title="Xem chi tiết">
              <Button
                type="link"
                icon={<EyeOutlined />}
                onClick={() => handleViewDetail(record)}
              />
            </Tooltip>
            <Tooltip title="Chỉnh sửa">
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              />
            </Tooltip>
            <Tooltip title="Giao việc">
              <Button
                type="link"
                icon={<UserAddOutlined />}
                onClick={() => handleAssignTask(record)}
              />
            </Tooltip>
            <Tooltip title="Tạo nhắc việc">
              <Button
                type="link"
                icon={<BellOutlined />}
                onClick={() => handleCreateReminder(record)}
              />
            </Tooltip>
            <Tooltip title="Xóa">
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleOpenDeleteDialog(record)}
              />
            </Tooltip>
          </Space>
        ),
      },
    ];
  };

  // Functions
  const refreshData = () => {
    const newPagination = { ...pagination, pageindex: 1, current: 1 };
    dispatch(setPagination(newPagination));
    fetchTasks(newPagination, filters);
  };

  const fetchTasks = async (
    paginationData = pagination,
    filterData = filters
  ) => {
    try {
      dispatch(setLoading(true));
      // Determine department filter
      let departmentFilter = filterData.departmentId;
      if (!filterData.showAllDepartments && !departmentFilter) {
        // If no department selected and not showing all, use user's department
        departmentFilter = userInfo.unitId;
      }

      const response = await apiGetTasks({
        pageindex: paginationData.pageindex,
        pageSize: paginationData.pageSize,
        searchKey: filterData.searchKey,
        status: filterData.status,
        priority: filterData.priority,
        assignedTo: filterData.assignedTo,
        dueDate: filterData.dueDate,
        projectId: filterData.projectId,
        departmentId: departmentFilter,
        showAllDepartments: filterData.showAllDepartments,
      });

      if (response.status === 200) {
        dispatch(setTasksList(response.data.items || []));
        setTotalResults(response.data.totalCount || 0);
        dispatch(
          setPagination({
            ...paginationData,
            total: response.data.totalCount || 0,
          })
        );
      } else {
        dispatch(setError("Có lỗi xảy ra khi tải dữ liệu"));
        notification.error({
          message: "Lỗi",
          description: "Có lỗi xảy ra khi tải dữ liệu công việc",
        });
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      dispatch(setError(error.message));
      notification.error({
        message: "Lỗi",
        description: "Có lỗi xảy ra khi tải dữ liệu công việc",
      });
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleEdit = (record) => {
    setCurrentRecord(record);
    setOpenModalAddTaskState(true);
    setOpenModalType("EDIT");
  };

  const handleViewDetail = (record) => {
    navigate(`/task-management/task/${record.id}`);
  };

  const handleAssignTask = (record) => {
    setCurrentRecord(record);
    setOpenModalAssignTaskState(true);
  };

  const handleCreateReminder = (record) => {
    setCurrentRecord(record);
    setOpenModalReminderState(true);
  };

  const handleOpenDeleteDialog = (record) => {
    setCurrentItemSelected(record);
    setIsOpenModalDeleteTask(true);
  };

  const handleDeleteTask = async () => {
    try {
      const response = await apiDeleteTask({
        id: currentItemSelected.id,
        action: "DELETE",
      });

      if (response.status === 200 && response.data === true) {
        notification.success({
          message: "Thành công",
          description: "Xóa công việc thành công",
        });
        refreshData();
      } else {
        notification.error({
          message: "Lỗi",
          description: "Có lỗi xảy ra khi xóa công việc",
        });
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      notification.error({
        message: "Lỗi",
        description: "Có lỗi xảy ra khi xóa công việc",
      });
    } finally {
      setIsOpenModalDeleteTask(false);
      setCurrentItemSelected({});
    }
  };

  const handleTableChange = (pagination, filters, sorter) => {
    const newPagination = {
      pageindex: pagination.current,
      pageSize: pagination.pageSize,
      total: pagination.total,
    };
    dispatch(setPagination(newPagination));
    fetchTasks(newPagination, filters);
  };

  const handleSearch = (value) => {
    const newFilters = { ...filters, searchKey: value };
    dispatch(setFilters(newFilters));
    const newPagination = { ...pagination, pageindex: 1, current: 1 };
    dispatch(setPagination(newPagination));
    fetchTasks(newPagination, newFilters);
  };

  const handleStatusChange = (value) => {
    const newFilters = { ...filters, status: value };
    dispatch(setFilters(newFilters));
    const newPagination = { ...pagination, pageindex: 1, current: 1 };
    dispatch(setPagination(newPagination));
    fetchTasks(newPagination, newFilters);
  };

  const handlePriorityChange = (value) => {
    const newFilters = { ...filters, priority: value };
    dispatch(setFilters(newFilters));
    const newPagination = { ...pagination, pageindex: 1, current: 1 };
    dispatch(setPagination(newPagination));
    fetchTasks(newPagination, newFilters);
  };

  // Effects
  useEffect(() => {
    setTableColumns(getTableColumns());
    fetchTasks();
  }, []);

  return (
    <div className="task-list-container">
      {/* Header */}
      <HeaderTableBar
        title="Danh sách công việc"
        buttonTitle="Thêm công việc mới"
        buttonIcon={<PlusOutlined />}
        onButtonClick={() => {
          setOpenModalAddTaskState(true);
          setOpenModalType("Add");
          setCurrentRecord(null);
        }}
      />

      {/* Filters */}
      <div className="task-filters" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Search
            placeholder="Tìm kiếm công việc..."
            allowClear
            style={{ width: 300 }}
            onSearch={handleSearch}
            value={filters.searchKey}
            onChange={(e) =>
              dispatch(setFilters({ ...filters, searchKey: e.target.value }))
            }
          />

          <DepartmentSelector
            value={filters.departmentId}
            onChange={(departmentId) => {
              dispatch(
                setDepartmentFilter({
                  departmentId,
                  showAllDepartments: departmentId === "ALL",
                })
              );
            }}
            allowAll={checkPermission("WORKFLOW_VIEW_ALL_DEPARTMENTS")}
            style={{ width: 250 }}
            placeholder="Chọn phòng ban"
          />
          <Select
            placeholder="Trạng thái"
            style={{ width: 150 }}
            value={filters.status}
            onChange={handleStatusChange}
          >
            {taskStatusOptions.map((option) => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="Độ ưu tiên"
            style={{ width: 120 }}
            value={filters.priority}
            onChange={handlePriorityChange}
          >
            {priorityOptions.map((option) => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </Space>
      </div>

      {/* Table */}
      <Table
        columns={tableColumns}
        dataSource={tasksList}
        rowKey="id"
        loading={loading}
        pagination={{
          current: pagination.pageindex,
          pageSize: pagination.pageSize,
          total: totalResults,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} của ${total} công việc`,
        }}
        onChange={handleTableChange}
        scroll={{ x: 1600, y: 600 }}
        locale={TableLocale}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
      />

      {/* Add/Edit Task Modal */}
      <ModalAddTask
        openModalAddTaskState={openModalAddTaskState}
        handleCloseModal={() => {
          setOpenModalAddTaskState(false);
          setCurrentRecord(null);
        }}
        openModalType={openModalType}
        currentRecord={currentRecord}
        refreshData={refreshData}
      />

      {/* Assign Task Modal */}
      <ModalAssignTask
        openModalAssignTaskState={openModalAssignTaskState}
        handleCloseModal={() => {
          setOpenModalAssignTaskState(false);
          setCurrentRecord(null);
        }}
        currentRecord={currentRecord}
        refreshData={refreshData}
      />

      {/* Task Reminder Modal */}
      <ModalTaskReminder
        openModalReminderState={openModalReminderState}
        handleCloseModal={() => {
          setOpenModalReminderState(false);
          setCurrentRecord(null);
        }}
        currentRecord={currentRecord}
        refreshData={refreshData}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isOpenModalDeleteTask}
        title="Xác nhận xóa công việc"
        message={`Bạn có chắc chắn muốn xóa công việc "${currentItemSelected.taskName}"?`}
        onConfirm={handleDeleteTask}
        onCancel={() => {
          setIsOpenModalDeleteTask(false);
          setCurrentItemSelected({});
        }}
      />
    </div>
  );
};

export default TaskList;
