import {
  AppstoreOutlined,
  BellOutlined,
  BugOutlined,
  CheckSquareOutlined,
  DeleteOutlined,
  DeploymentUnitOutlined,
  EditOutlined,
  EyeOutlined,
  FileTextOutlined,
  LayoutOutlined,
  PlusOutlined,
  SwapOutlined,
  TableOutlined,
  ThunderboltOutlined,
  UserAddOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Drawer,
  Empty,
  Form,
  Input,
  List,
  Progress,
  Row,
  Segmented,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
  Upload,
  notification,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "../../../../Context/ConfirmDialog";
import TableLocale from "../../../../Context/TableLocale";
import { getUserInfo } from "../../../../store/selectors/Selectors";
import checkPermission from "../../../../utils/permission";
import DepartmentSelector from "../../../ReuseComponents/DepartmentSelector";
import HeaderTableBar from "../../../ReuseComponents/HeaderTableBar";
import { getSampleTasks } from "../../../WorkflowApp/utils/workflowSampleData";
import {
  TaskManagementGetApi,
  apiDeleteTask,
  apiExportTasks,
  apiGetTasks,
  apiUpdateTaskStatus,
} from "../../API";
import AdvancedFilters from "../../Components/AdvancedFilters/AdvancedFilters";
import ModalAddTask from "../../Modals/ModalAddTask/ModalAddTask";
import ModalAssignTask from "../../Modals/ModalAssignTask/ModalAssignTask";
import ModalBulkOperations from "../../Modals/ModalBulkOperations/ModalBulkOperations";
import ModalTaskHistory from "../../Modals/ModalTaskHistory/ModalTaskHistory";
import ModalTaskReminder from "../../Modals/ModalTaskReminder/ModalTaskReminder";
import ModalTaskTemplate from "../../Modals/ModalTaskTemplate/ModalTaskTemplate";
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
const { Dragger } = Upload;
const { Text } = Typography;

const TASK_VIEW_OPTIONS = [
  { label: "Bảng", value: "table", icon: <TableOutlined /> },
  { label: "Kanban", value: "kanban", icon: <AppstoreOutlined /> },
  { label: "Gantt", value: "gantt", icon: <DeploymentUnitOutlined /> },
  { label: "Split", value: "split", icon: <LayoutOutlined /> },
];

const STATUS_META = {
  PENDING: {
    label: "Chờ thực hiện",
    tagColor: "default",
    laneColor: "#d9d9d9",
  },
  IN_PROGRESS: {
    label: "Đang thực hiện",
    tagColor: "processing",
    laneColor: "#1890ff",
  },
  REVIEW: { label: "Đang xem xét", tagColor: "warning", laneColor: "#fa8c16" },
  COMPLETED: { label: "Hoàn thành", tagColor: "success", laneColor: "#52c41a" },
  CANCELLED: { label: "Đã hủy", tagColor: "error", laneColor: "#ff4d4f" },
};

const PRIORITY_META = {
  LOW: { label: "Thấp", tagColor: "default", color: "#73d13d" },
  MEDIUM: { label: "Trung bình", tagColor: "blue", color: "#40a9ff" },
  HIGH: { label: "Cao", tagColor: "orange", color: "#ffa940" },
  URGENT: { label: "Khẩn cấp", tagColor: "red", color: "#ff7875" },
};

const TASK_TYPE_META = {
  TASK: { label: "Công việc", icon: <CheckSquareOutlined />, color: "blue" },
  BUG: { label: "Lỗi", icon: <BugOutlined />, color: "red" },
  FEATURE: {
    label: "Tính năng",
    icon: <ThunderboltOutlined />,
    color: "green",
  },
  SUPPORT: { label: "Hỗ trợ", icon: <UserOutlined />, color: "purple" },
};

// Dynamic status order based on task type
const getStatusOrder = (taskType = "TASK") => {
  if (taskType === "BUG") {
    return [
      "PENDING",
      "IN_PROGRESS",
      "TESTING",
      "RESOLVED",
      "CLOSED",
      "CANCELLED",
    ];
  }
  if (taskType === "FEATURE") {
    return ["PENDING", "IN_PROGRESS", "REVIEW", "DONE", "CANCELLED"];
  }
  if (taskType === "SUPPORT") {
    return [
      "PENDING",
      "IN_PROGRESS",
      "WAITING_FEEDBACK",
      "RESOLVED",
      "CANCELLED",
    ];
  }
  return ["PENDING", "IN_PROGRESS", "REVIEW", "COMPLETED", "CANCELLED"];
};

const STATUS_ORDER = [
  "PENDING",
  "IN_PROGRESS",
  "REVIEW",
  "COMPLETED",
  "CANCELLED",
];

const SAMPLE_TASKS = getSampleTasks();

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
  const [activeView, setActiveView] = useState("table");
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [localTasks, setLocalTasks] = useState([]);
  const [mobileAddVisible, setMobileAddVisible] = useState(false);
  const [importing, setImporting] = useState(false);
  const [quickAddForm] = Form.useForm();
  const [mobileAddForm] = Form.useForm();
  const [autoReminderEnabled, setAutoReminderEnabled] = useState(true);
  const [reminderThresholdHours, setReminderThresholdHours] = useState(24);
  const reminderNotifiedRef = useRef(new Set());
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [bulkModalVisible, setBulkModalVisible] = useState(false);
  const [bulkOperationType, setBulkOperationType] = useState("edit");
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedTaskForHistory, setSelectedTaskForHistory] = useState(null);

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

  // Task type options
  const typeOptions = [
    { value: "", label: "Tất cả" },
    { value: "TASK", label: "Công việc" },
    { value: "BUG", label: "Lỗi" },
    { value: "FEATURE", label: "Tính năng" },
    { value: "SUPPORT", label: "Hỗ trợ" },
  ];

  const reminderThresholdOptions = [
    { value: 6, label: "6 giờ" },
    { value: 12, label: "12 giờ" },
    { value: 24, label: "24 giờ" },
    { value: 48, label: "48 giờ" },
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
        title: "Loại",
        dataIndex: "type",
        key: "type",
        width: 120,
        render: (type) => {
          const meta = TASK_TYPE_META[type] || TASK_TYPE_META.TASK;
          return (
            <Tag color={meta.color} icon={meta.icon}>
              {meta.label}
            </Tag>
          );
        },
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        width: 120,
        render: (status) => {
          const meta = STATUS_META[status] || STATUS_META.PENDING;
          return <Tag color={meta.tagColor}>{meta.label}</Tag>;
        },
      },
      {
        title: "Độ ưu tiên",
        dataIndex: "priority",
        key: "priority",
        width: 100,
        render: (priority) => {
          const meta = PRIORITY_META[priority] || PRIORITY_META.MEDIUM;
          return <Tag color={meta.tagColor}>{meta.label}</Tag>;
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
        render: (text, record) => (
          <Button
            type="link"
            style={{ padding: 0, height: "auto" }}
            onClick={() => {
              setSelectedTaskForHistory(record);
              setHistoryModalVisible(true);
            }}
          >
            {text || "—"}
          </Button>
        ),
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

  const handleUseTemplate = (template) => {
    // Create a task record from template data
    const templateTask = {
      taskName: template.taskName || "",
      type: template.type || "TASK",
      priority: template.priority || "MEDIUM",
      estimatedHours: template.estimatedHours || null,
      description: template.descriptionTemplate || template.description || "",
    };

    setCurrentRecord(templateTask);
    setOpenModalAddTaskState(true);
    setOpenModalType("Add");

    notification.success({
      message: "Đã tải template",
      description: `Template "${template.name}" đã được tải vào form tạo công việc`,
    });
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

  const handleTypeChange = (value) => {
    const newFilters = { ...filters, type: value };
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

  const hasRemoteTasks = Array.isArray(tasksList) && tasksList.length > 0;
  useEffect(() => {
    if (!hasRemoteTasks && localTasks.length === 0) {
      setLocalTasks(SAMPLE_TASKS.map((task) => ({ ...task })));
    }
  }, [hasRemoteTasks, localTasks.length]);
  const tableData = useMemo(() => {
    if (hasRemoteTasks) {
      return tasksList;
    }
    if (localTasks.length) {
      return localTasks;
    }
    return SAMPLE_TASKS;
  }, [hasRemoteTasks, tasksList, localTasks]);
  const totalDisplay = hasRemoteTasks
    ? totalResults
    : localTasks.length || SAMPLE_TASKS.length;

  useEffect(() => {
    const hasSelection = tableData.some((task) => task.id === selectedTaskId);
    if (
      (!selectedTaskId && tableData.length) ||
      (!hasSelection && tableData.length)
    ) {
      setSelectedTaskId(tableData[0].id);
    }
    if (!tableData.length) {
      setSelectedTaskId(null);
    }
  }, [selectedTaskId, tableData]);

  const projectOptions = useMemo(() => {
    const source = hasRemoteTasks
      ? tasksList
      : localTasks.length
      ? localTasks
      : SAMPLE_TASKS;
    const options = Array.from(
      new Set(source.map((task) => task.projectName).filter(Boolean))
    );
    return options.map((name) => ({ label: name, value: name }));
  }, [hasRemoteTasks, tasksList, localTasks]);

  const reminderCandidates = useMemo(() => {
    const now = dayjs();
    const dueSoon = [];
    const overdue = [];
    tableData.forEach((task) => {
      if (!task?.dueDate || task.status === "COMPLETED") {
        return;
      }
      const due = dayjs(task.dueDate);
      const diffHours = due.diff(now, "hour");
      if (diffHours < 0) {
        overdue.push({ task, hours: Math.abs(diffHours) });
      } else if (diffHours <= reminderThresholdHours) {
        dueSoon.push({ task, hours: diffHours });
      }
    });
    return { dueSoon, overdue };
  }, [tableData, reminderThresholdHours]);

  const selectedTask = useMemo(
    () => tableData.find((task) => task.id === selectedTaskId) || null,
    [selectedTaskId, tableData]
  );

  const kanbanGroupedTasks = useMemo(() => {
    const grouped = STATUS_ORDER.reduce((acc, status) => {
      acc[status] = [];
      return acc;
    }, {});
    grouped.OTHER = [];

    tableData.forEach((task) => {
      const groupKey = STATUS_ORDER.includes(task.status)
        ? task.status
        : "OTHER";
      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      grouped[groupKey].push(task);
    });

    return grouped;
  }, [tableData]);

  const timelineData = useMemo(() => {
    const today = dayjs();
    return tableData.map((task) => {
      const due = task.dueDate ? dayjs(task.dueDate) : today.add(7, "day");
      let start = task.startDate
        ? dayjs(task.startDate)
        : due.subtract(
            Math.max(Math.ceil((task.estimatedHours || 8) / 8), 1),
            "day"
          );

      if (start.isAfter(due)) {
        start = due.subtract(1, "day");
      }

      return {
        ...task,
        timeline: {
          start,
          end: due,
        },
      };
    });
  }, [tableData]);

  const ganttRange = useMemo(() => {
    if (!timelineData.length) return null;

    let minStart = timelineData[0].timeline.start;
    let maxEnd = timelineData[0].timeline.end;

    timelineData.forEach(({ timeline }) => {
      if (timeline.start.isBefore(minStart)) {
        minStart = timeline.start;
      }
      if (timeline.end.isAfter(maxEnd)) {
        maxEnd = timeline.end;
      }
    });

    return {
      minStart,
      maxEnd,
      totalDays: Math.max(maxEnd.diff(minStart, "day") + 1, 1),
    };
  }, [timelineData]);

  const formatDate = (value) =>
    value ? dayjs(value).format("DD/MM/YYYY") : "Không xác định";

  const handleInlineReminder = (task, type = "dueSoon") => {
    const dueText = task.dueDate
      ? dayjs(task.dueDate).format("DD/MM/YYYY HH:mm")
      : "chưa xác định";
    if (type === "overdue") {
      notification.error({
        message: `Quá hạn: ${task.taskName}`,
        description: `Công việc đã trễ hạn từ ${dueText}. Hãy xử lý ngay!`,
        duration: 5,
      });
    } else {
      notification.warning({
        message: `Sắp đến hạn: ${task.taskName}`,
        description: `Hạn chót ${dueText}. Đã nhắc ${
          task.assignedToName || "team"
        }.`,
        duration: 4,
      });
    }
  };

  useEffect(() => {
    if (!autoReminderEnabled) {
      reminderNotifiedRef.current.clear();
      return;
    }
    const overdueIds = new Set(
      reminderCandidates.overdue.map(({ task }) => task.id)
    );
    [...reminderCandidates.dueSoon, ...reminderCandidates.overdue].forEach(
      ({ task }) => {
        if (reminderNotifiedRef.current.has(task.id)) {
          return;
        }
        reminderNotifiedRef.current.add(task.id);
        handleInlineReminder(
          task,
          overdueIds.has(task.id) ? "overdue" : "dueSoon"
        );
      }
    );
  }, [autoReminderEnabled, reminderCandidates]);

  const appendTasks = (items) => {
    const newItems = Array.isArray(items) ? items : [items];
    if (!newItems.length) return;
    if (hasRemoteTasks) {
      dispatch(setTasksList([...(newItems || []), ...(tasksList || [])]));
      setTotalResults((prev) => (prev || 0) + newItems.length);
    } else {
      setLocalTasks((prev) => [...newItems, ...prev]);
    }
  };

  const buildLocalTask = (values) => {
    const ensureDate = (date, fallback) =>
      (date || fallback).format ? date.format("YYYY-MM-DD") : date;
    const due = values.dueDate ? values.dueDate : dayjs().add(3, "day");
    const start =
      values.startDate && values.startDate.isBefore(due)
        ? values.startDate
        : dayjs(due).subtract(2, "day");
    return {
      id: values.id || `QT-${Date.now()}`,
      taskCode:
        values.taskCode ||
        `QT-${Math.floor(Math.random() * 900 + 100).toString()}`,
      taskName: values.taskName?.trim(),
      projectName: values.projectName || "Không xác định",
      status: values.status || "PENDING",
      priority: values.priority || "MEDIUM",
      assignedToName:
        values.assignedToName || userInfo?.fullName || "Chưa giao",
      createdByName: userInfo?.fullName || "Bạn",
      dueDate: ensureDate(due, dayjs().add(3, "day")),
      startDate: ensureDate(start, dayjs()),
      progress: 0,
      estimatedHours: values.estimatedHours || null,
      departmentName: values.departmentName || userInfo?.unitName || "Workflow",
    };
  };

  const handleQuickAddSubmit = (values) => {
    if (!values.taskName) {
      notification.warning({
        message: "Thiếu thông tin",
        description: "Vui lòng nhập tên công việc",
      });
      return;
    }
    const newTask = buildLocalTask(values);
    appendTasks(newTask);
    quickAddForm.resetFields();
    notification.success({
      message: "Đã thêm nhanh",
      description: "Công việc mới đã xuất hiện trong danh sách.",
    });
  };

  const handleMobileAddSubmit = (values) => {
    const newTask = buildLocalTask(values);
    appendTasks(newTask);
    mobileAddForm.resetFields();
    setMobileAddVisible(false);
    notification.success({
      message: "Đã thêm từ mobile view",
      description: "Công việc đã được đồng bộ vào bảng.",
    });
  };

  const handleExportTasks = async () => {
    try {
      const response = await apiExportTasks({
        filters: filters,
        format: "excel",
      });

      if (response?.status === 200 && response?.data) {
        // Create download link
        const blob = new Blob([response.data], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `tasks_${dayjs().format("YYYY-MM-DD")}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        notification.success({
          message: "Thành công",
          description: "Đã xuất file Excel",
        });
      } else {
        // Fallback: export using table data
        const csvContent = convertToCSV(tableData);
        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `tasks_${dayjs().format("YYYY-MM-DD")}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        notification.success({
          message: "Thành công",
          description: "Đã xuất file CSV",
        });
      }
    } catch (error) {
      console.error("Error exporting tasks:", error);
      notification.error({
        message: "Lỗi",
        description: "Không thể xuất file",
      });
    }
  };

  const convertToCSV = (data) => {
    if (!data || data.length === 0) return "";

    const headers = [
      "Mã công việc",
      "Tên công việc",
      "Dự án",
      "Loại",
      "Trạng thái",
      "Độ ưu tiên",
      "Người thực hiện",
      "Ngày bắt đầu",
      "Ngày hết hạn",
      "Tiến độ (%)",
      "Số giờ ước tính",
    ];

    const rows = data.map((task) => [
      task.taskCode || "",
      task.taskName || "",
      task.projectName || "",
      task.type || "",
      task.status || "",
      task.priority || "",
      task.assignedToName || "",
      task.startDate || "",
      task.dueDate || "",
      task.progress || 0,
      task.estimatedHours || "",
    ]);

    const csvRows = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ];

    return csvRows.join("\n");
  };

  const handleImportTasks = (file) => {
    setImporting(true);
    const baseName = file.name.replace(/\.[^/.]+$/, "");
    setTimeout(() => {
      const generatedTasks = Array.from({ length: 3 }).map((_, index) =>
        buildLocalTask({
          taskName: `${baseName} - Item ${index + 1}`,
          projectName:
            projectOptions.length > 0
              ? projectOptions[index % projectOptions.length].label
              : "Dự án import",
          priority: index % 2 === 0 ? "HIGH" : "MEDIUM",
          status: "PENDING",
          dueDate: dayjs().add(5 + index, "day"),
        })
      );
      appendTasks(generatedTasks);
      setImporting(false);
      notification.success({
        message: "Nhập Excel thành công",
        description: `${generatedTasks.length} công việc mẫu đã được thêm.`,
      });
    }, 1000);
    return false;
  };

  // Drag & Drop handlers
  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", task.id);
    // Add visual feedback
    e.currentTarget.classList.add("drag-start");
    setTimeout(() => {
      e.currentTarget.classList.remove("drag-start");
    }, 200);
  };

  const handleDragOver = (e, status) => {
    e.preventDefault();

    // Check if transition is valid
    if (draggedTask && isValidTransition(draggedTask.status, status)) {
      e.dataTransfer.dropEffect = "move";
      setDragOverColumn(status);
    } else {
      e.dataTransfer.dropEffect = "none";
      setDragOverColumn(null);
    }
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  // Validate workflow transitions (theo quy trình BA → Dev → Test → Close)
  const isValidTransition = (fromStatus, toStatus) => {
    const validTransitions = {
      PENDING: ["IN_PROGRESS", "CANCELLED"],
      IN_PROGRESS: ["REVIEW", "CANCELLED"],
      REVIEW: ["TESTING", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
      TESTING: ["COMPLETED", "REVIEW", "CANCELLED"],
      COMPLETED: [], // Không thể chuyển từ COMPLETED
      CANCELLED: ["PENDING"], // Có thể khôi phục
    };

    return validTransitions[fromStatus]?.includes(toStatus) || false;
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (!draggedTask || draggedTask.status === targetStatus) {
      setDraggedTask(null);
      return;
    }

    // Validate workflow transition
    if (!isValidTransition(draggedTask.status, targetStatus)) {
      notification.warning({
        message: "Chuyển đổi không hợp lệ",
        description: `Không thể chuyển từ "${
          STATUS_META[draggedTask.status]?.label
        }" sang "${
          STATUS_META[targetStatus]?.label
        }". Vui lòng làm theo đúng quy trình.`,
        duration: 4,
      });
      setDraggedTask(null);
      return;
    }

    // Nếu đang dùng dữ liệu sample (không có API thật) => chỉ cập nhật local để demo
    if (!hasRemoteTasks) {
      setLocalTasks((prev) =>
        prev.map((task) =>
          task.id === draggedTask.id ? { ...task, status: targetStatus } : task
        )
      );

      notification.success({
        message: "Đã cập nhật trạng thái",
        description: `Demo: chuyển "${draggedTask.taskName}" sang "${STATUS_META[targetStatus]?.label}"`,
      });

      setDraggedTask(null);
      return;
    }

    try {
      // Update task status via API
      const response = await apiUpdateTaskStatus({
        taskId: draggedTask.id,
        status: targetStatus,
        reason: `Kéo thả từ "${STATUS_META[draggedTask.status]?.label}" sang "${
          STATUS_META[targetStatus]?.label
        }"`,
      });

      if (response?.status === 200) {
        // Update local state
        if (hasRemoteTasks) {
          const updatedTasks = tasksList.map((task) =>
            task.id === draggedTask.id
              ? { ...task, status: targetStatus }
              : task
          );
          dispatch(setTasksList(updatedTasks));
        } else {
          setLocalTasks((prev) =>
            prev.map((task) =>
              task.id === draggedTask.id
                ? { ...task, status: targetStatus }
                : task
            )
          );
        }

        // Auto-log to history (tự động ghi log vào history)
        try {
          await TaskManagementGetApi({
            store: "Api_Log_Task_History",
            data: {
              taskId: draggedTask.id,
              type: "STATUS_CHANGED",
              fromStatus: draggedTask.status,
              toStatus: targetStatus,
              reason: `Kéo thả trong Kanban board`,
              userId: userInfo?.id,
            },
          });
        } catch (historyError) {
          console.log("History logging failed (non-critical):", historyError);
        }

        notification.success({
          message: "Thành công",
          description: `Đã chuyển công việc từ "${
            STATUS_META[draggedTask.status]?.label
          }" sang "${STATUS_META[targetStatus]?.label}"`,
        });
      } else {
        // Fallback: update locally
        if (hasRemoteTasks) {
          const updatedTasks = tasksList.map((task) =>
            task.id === draggedTask.id
              ? { ...task, status: targetStatus }
              : task
          );
          dispatch(setTasksList(updatedTasks));
        } else {
          setLocalTasks((prev) =>
            prev.map((task) =>
              task.id === draggedTask.id
                ? { ...task, status: targetStatus }
                : task
            )
          );
        }
        notification.success({
          message: "Thành công",
          description: `Đã chuyển công việc sang "${STATUS_META[targetStatus]?.label}"`,
        });
      }
    } catch (error) {
      console.error("Error updating task status:", error);
      notification.error({
        message: "Lỗi",
        description: "Không thể cập nhật trạng thái công việc",
      });
    } finally {
      setDraggedTask(null);
    }
  };

  const renderReminderList = (items, type) => (
    <List
      size="small"
      className="task-reminder-list"
      header={
        <Text strong>
          {type === "overdue"
            ? `Đã quá hạn (${items.length})`
            : `Sắp đến hạn (${items.length})`}
        </Text>
      }
      locale={{ emptyText: "Không có công việc" }}
      dataSource={items}
      renderItem={({ task, hours }) => (
        <List.Item
          actions={[
            <Tooltip
              key="notify"
              title={type === "overdue" ? "Cảnh báo ngay" : "Nhắc nhanh"}
            >
              <Button
                size="small"
                icon={<BellOutlined />}
                onClick={() => handleInlineReminder(task, type)}
              />
            </Tooltip>,
            <Tooltip key="modal" title="Tạo nhắc việc chi tiết">
              <Button
                size="small"
                type="link"
                onClick={() => handleCreateReminder(task)}
              >
                Lịch
              </Button>
            </Tooltip>,
          ]}
        >
          <Space direction="vertical" size={0}>
            <Text strong>{task.taskName}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {type === "overdue"
                ? `Trễ ${Math.max(1, Math.ceil(hours))} giờ`
                : `Còn khoảng ${Math.max(1, Math.ceil(hours))} giờ · Hạn ${
                    task.dueDate
                      ? dayjs(task.dueDate).format("DD/MM HH:mm")
                      : "—"
                  }`}
            </Text>
          </Space>
        </List.Item>
      )}
    />
  );

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
        extraButtons={[
          <Button
            key="template"
            icon={<FileTextOutlined />}
            onClick={() => setTemplateModalVisible(true)}
          >
            Templates
          </Button>,
          selectedRowKeys.length > 0 && (
            <Space key="bulk" split={<span>|</span>}>
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => {
                  setBulkOperationType("edit");
                  setBulkModalVisible(true);
                }}
              >
                Sửa ({selectedRowKeys.length})
              </Button>
              <Button
                size="small"
                icon={<UserAddOutlined />}
                onClick={() => {
                  setBulkOperationType("assign");
                  setBulkModalVisible(true);
                }}
              >
                Giao ({selectedRowKeys.length})
              </Button>
              <Button
                size="small"
                icon={<SwapOutlined />}
                onClick={() => {
                  setBulkOperationType("status");
                  setBulkModalVisible(true);
                }}
              >
                Đổi trạng thái ({selectedRowKeys.length})
              </Button>
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => {
                  setBulkOperationType("delete");
                  setBulkModalVisible(true);
                }}
              >
                Xóa ({selectedRowKeys.length})
              </Button>
            </Space>
          ),
        ].filter(Boolean)}
      />

      {/* Advanced Filters */}
      <AdvancedFilters
        filters={filters}
        onFiltersChange={(newFilters) => {
          dispatch(setFilters(newFilters));
          fetchTasks(pagination, newFilters);
        }}
        onApplyFilter={(savedFilters) => {
          dispatch(setFilters({ ...filters, ...savedFilters }));
          fetchTasks(pagination, { ...filters, ...savedFilters });
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
          <Select
            placeholder="Loại"
            style={{ width: 130 }}
            value={filters.type}
            onChange={handleTypeChange}
          >
            {typeOptions.map((option) => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </Space>
      </div>

      <div className="task-quick-actions">
        <Card
          className="task-quick-card"
          title="Thêm nhanh"
          extra={
            <Button type="link" onClick={() => quickAddForm.resetFields()}>
              Làm mới
            </Button>
          }
        >
          <Form
            layout="vertical"
            form={quickAddForm}
            onFinish={handleQuickAddSubmit}
          >
            <Row gutter={12}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Tên công việc"
                  name="taskName"
                  rules={[{ required: true, message: "Nhập tên công việc" }]}
                >
                  <Input placeholder="VD: Chuẩn hóa dữ liệu" />
                </Form.Item>
              </Col>
              <Col xs={24} md={6}>
                <Form.Item label="Dự án" name="projectName">
                  <Select
                    placeholder="Chọn dự án"
                    allowClear
                    options={projectOptions}
                    dropdownRender={(menu) => (
                      <>
                        {menu}
                        <Button
                          type="link"
                          block
                          onClick={() =>
                            quickAddForm.setFieldsValue({
                              projectName: "Dự án mới",
                            })
                          }
                        >
                          + Dự án mới
                        </Button>
                      </>
                    )}
                  />
                </Form.Item>
              </Col>
              <Col xs={12} md={3}>
                <Form.Item
                  label="Ưu tiên"
                  name="priority"
                  initialValue="MEDIUM"
                >
                  <Select
                    options={priorityOptions
                      .filter((item) => item.value)
                      .map((option) => ({
                        label: option.label,
                        value: option.value,
                      }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={12} md={3}>
                <Form.Item
                  label="Trạng thái"
                  name="status"
                  initialValue="PENDING"
                >
                  <Select
                    options={taskStatusOptions
                      .filter((item) => item.value)
                      .map((option) => ({
                        label: option.label,
                        value: option.value,
                      }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={12} md={4}>
                <Form.Item label="Ngày bắt đầu" name="startDate">
                  <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
                </Form.Item>
              </Col>
              <Col xs={12} md={4}>
                <Form.Item label="Hạn chót" name="dueDate">
                  <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
                </Form.Item>
              </Col>
              <Col xs={24} md={6}>
                <Form.Item label="Người thực hiện" name="assignedToName">
                  <Input placeholder="Tên người thực hiện" />
                </Form.Item>
              </Col>
              <Col xs={24} md={4}>
                <Form.Item label="Giờ ước tính" name="estimatedHours">
                  <Input type="number" min={0} placeholder="Số giờ" />
                </Form.Item>
              </Col>
              <Col
                xs={24}
                md={6}
                style={{ display: "flex", alignItems: "flex-end" }}
              >
                <Space>
                  <Button type="primary" htmlType="submit">
                    Thêm nhanh
                  </Button>
                  <Button onClick={() => quickAddForm.resetFields()}>
                    Xóa
                  </Button>
                </Space>
              </Col>
            </Row>
          </Form>
        </Card>

        <Card className="task-import-card" title="Nhập từ Excel/CSV">
          <Dragger
            beforeUpload={handleImportTasks}
            showUploadList={false}
            disabled={importing}
          >
            <p className="ant-upload-drag-icon">
              <DeploymentUnitOutlined />
            </p>
            <p className="ant-upload-text">
              Kéo thả file Excel hoặc CSV để tạo công việc hàng loạt
            </p>
            <p className="ant-upload-hint">
              {importing
                ? "Đang xử lý dữ liệu..."
                : "File sẽ chỉ được xử lý nội bộ (mock)."}
            </p>
          </Dragger>
        </Card>

        <Card className="task-mobile-card" title="Thêm kiểu mobile">
          <Space direction="vertical">
            <Text style={{ display: "block", maxWidth: 260 }}>
              Mô phỏng thao tác thêm nhanh trên thiết bị di động /现场 check-in.
            </Text>
            <Button type="primary" onClick={() => setMobileAddVisible(true)}>
              Mở giao diện mobile
            </Button>
          </Space>
        </Card>

        <Card
          className="task-reminder-card"
          title="Nhắc việc & thông báo"
          extra={
            <Switch
              checked={autoReminderEnabled}
              onChange={setAutoReminderEnabled}
              checkedChildren="Auto"
              unCheckedChildren="Tắt"
            />
          }
        >
          <Space direction="vertical" style={{ width: "100%" }} size="small">
            <Text type="secondary">Tự động cảnh báo trước hạn trong vòng</Text>
            <Select
              value={reminderThresholdHours}
              onChange={setReminderThresholdHours}
              options={reminderThresholdOptions}
            />
            <Alert
              type="info"
              showIcon
              message={`Có ${reminderCandidates.dueSoon.length} việc sắp đến hạn và ${reminderCandidates.overdue.length} việc đã trễ.`}
            />
            {renderReminderList(reminderCandidates.dueSoon, "dueSoon")}
            {renderReminderList(reminderCandidates.overdue, "overdue")}
          </Space>
        </Card>
      </div>

      <div className="task-view-toggle">
        <Segmented
          value={activeView}
          size="large"
          onChange={(value) => setActiveView(value)}
          options={TASK_VIEW_OPTIONS.map((option) => ({
            label: (
              <Space size={4}>
                {option.icon}
                <span>{option.label}</span>
              </Space>
            ),
            value: option.value,
          }))}
        />
      </div>

      {activeView === "table" && (
        <Table
          columns={tableColumns}
          dataSource={tableData}
          rowKey="id"
          loading={loading && hasRemoteTasks}
          pagination={{
            current: pagination.pageindex,
            pageSize: pagination.pageSize,
            total: totalDisplay,
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
      )}

      {activeView === "kanban" && (
        <div className="task-kanban-board">
          {STATUS_ORDER.map((status) => {
            const columnTasks = kanbanGroupedTasks[status] || [];
            const meta = STATUS_META[status];
            const isDragOver = dragOverColumn === status;
            return (
              <Card
                key={status}
                className={`task-kanban-column ${
                  isDragOver ? "drag-over" : ""
                }`}
                title={
                  <Space>
                    <span
                      className="task-kanban-column-dot"
                      style={{ backgroundColor: meta.laneColor }}
                    />
                    <span>{meta.label}</span>
                    <Tag color={meta.tagColor}>{columnTasks.length}</Tag>
                  </Space>
                }
                onDragOver={(e) => handleDragOver(e, status)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, status)}
                style={{
                  minHeight: "500px",
                  transition: "all 0.3s ease",
                }}
              >
                {columnTasks.length ? (
                  columnTasks.map((task) => {
                    const priorityMeta =
                      PRIORITY_META[task.priority] || PRIORITY_META.MEDIUM;
                    const isDragging = draggedTask?.id === task.id;
                    return (
                      <Card
                        key={task.id}
                        className={`task-kanban-card ${
                          isDragging ? "dragging" : ""
                        }`}
                        size="small"
                        draggable
                        onDragStart={(e) => handleDragStart(e, task)}
                        style={{
                          cursor: "move",
                          opacity: isDragging ? 0.5 : 1,
                        }}
                      >
                        <div className="task-kanban-card-header">
                          <span className="task-code">{task.taskCode}</span>
                          <Tag color={priorityMeta.tagColor}>
                            {priorityMeta.label}
                          </Tag>
                        </div>
                        <div className="task-kanban-card-title">
                          {task.taskName}
                        </div>
                        <Space size={8} className="task-kanban-card-assignee">
                          <Avatar size="small">
                            {(task.assignedToName || "N")[0]}
                          </Avatar>
                          <span>{task.assignedToName || "Chưa giao"}</span>
                        </Space>
                        <div className="task-kanban-card-footer">
                          <span>
                            Hạn:{" "}
                            {task.dueDate
                              ? dayjs(task.dueDate).format("DD/MM")
                              : "—"}
                          </span>
                          <span>{task.progress || 0}%</span>
                        </div>
                        <div className="task-kanban-card-actions">
                          <Button
                            type="link"
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => handleViewDetail(task)}
                          >
                            Chi tiết
                          </Button>
                          <Button
                            type="link"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(task)}
                          >
                            Sửa
                          </Button>
                        </div>
                      </Card>
                    );
                  })
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Không có công việc"
                  />
                )}
              </Card>
            );
          })}
          {kanbanGroupedTasks.OTHER?.length > 0 && (
            <Card
              key="OTHER"
              className="task-kanban-column"
              title={
                <Space>
                  <span
                    className="task-kanban-column-dot"
                    style={{ backgroundColor: "#8c8c8c" }}
                  />
                  <span>Khác</span>
                  <Tag>{kanbanGroupedTasks.OTHER.length}</Tag>
                </Space>
              }
            >
              {kanbanGroupedTasks.OTHER.map((task) => (
                <Card key={task.id} className="task-kanban-card" size="small">
                  <div className="task-kanban-card-title">{task.taskName}</div>
                  <div className="task-kanban-card-footer">
                    <span>{task.status || "—"}</span>
                    <span>{task.progress || 0}%</span>
                  </div>
                </Card>
              ))}
            </Card>
          )}
        </div>
      )}

      {activeView === "gantt" && (
        <Card className="task-gantt-card">
          {timelineData.length && ganttRange ? (
            <div className="task-gantt-view">
              {timelineData.map((task) => {
                const { start, end } = task.timeline;
                const duration = Math.max(end.diff(start, "day") + 1, 1);
                const offset = start.diff(ganttRange.minStart, "day");
                const widthPercent = (duration / ganttRange.totalDays) * 100;
                const offsetPercent = (offset / ganttRange.totalDays) * 100;
                const priorityMeta =
                  PRIORITY_META[task.priority] || PRIORITY_META.MEDIUM;
                return (
                  <div className="task-gantt-row" key={task.id}>
                    <div className="task-gantt-row-info">
                      <div className="task-name">{task.taskName}</div>
                      <small>
                        {start.format("DD/MM")} - {end.format("DD/MM")}
                      </small>
                    </div>
                    <div className="task-gantt-bar-wrapper">
                      <div
                        className="task-gantt-bar"
                        style={{
                          width: `${widthPercent}%`,
                          marginLeft: `${offsetPercent}%`,
                          backgroundColor: priorityMeta.color,
                        }}
                      >
                        <span>{task.assignedToName || "—"}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Chưa có dữ liệu để dựng Gantt"
            />
          )}
        </Card>
      )}

      {activeView === "split" && (
        <div className="task-split-view">
          <Card title="Danh sách" className="task-split-list-card">
            <List
              dataSource={tableData}
              locale={{ emptyText: "Không có công việc" }}
              renderItem={(task) => {
                const isSelected = selectedTaskId === task.id;
                const statusMeta =
                  STATUS_META[task.status] || STATUS_META.PENDING;
                return (
                  <List.Item
                    key={task.id}
                    className={`task-split-list-item ${
                      isSelected ? "selected" : ""
                    }`}
                    onClick={() => setSelectedTaskId(task.id)}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          <span>{task.taskName}</span>
                          <Tag color={statusMeta.tagColor}>
                            {statusMeta.label}
                          </Tag>
                        </Space>
                      }
                      description={
                        <div className="task-split-list-description">
                          <span>{task.taskCode}</span>
                          <span>
                            Hạn:{" "}
                            {task.dueDate
                              ? dayjs(task.dueDate).format("DD/MM")
                              : "—"}
                          </span>
                        </div>
                      }
                    />
                    <Progress
                      type="circle"
                      percent={task.progress || 0}
                      width={48}
                      strokeColor={PRIORITY_META[task.priority]?.color}
                    />
                  </List.Item>
                );
              }}
            />
          </Card>
          <Card
            title="Chi tiết nhanh"
            className="task-split-detail-card"
            extra={
              selectedTask && (
                <Space size={8}>
                  <Button
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => handleViewDetail(selectedTask)}
                  >
                    Xem
                  </Button>
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(selectedTask)}
                  >
                    Sửa
                  </Button>
                </Space>
              )
            }
          >
            {selectedTask ? (
              <>
                <Space size={8} style={{ marginBottom: 16 }}>
                  <Tag
                    color={
                      (STATUS_META[selectedTask.status] || STATUS_META.PENDING)
                        .tagColor
                    }
                  >
                    {
                      (STATUS_META[selectedTask.status] || STATUS_META.PENDING)
                        .label
                    }
                  </Tag>
                  <Tag
                    color={
                      (
                        PRIORITY_META[selectedTask.priority] ||
                        PRIORITY_META.MEDIUM
                      ).tagColor
                    }
                  >
                    {
                      (
                        PRIORITY_META[selectedTask.priority] ||
                        PRIORITY_META.MEDIUM
                      ).label
                    }
                  </Tag>
                </Space>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Mã công việc">
                    {selectedTask.taskCode}
                  </Descriptions.Item>
                  <Descriptions.Item label="Dự án">
                    {selectedTask.projectName || "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Người thực hiện">
                    {selectedTask.assignedToName || "Chưa giao"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Người tạo">
                    {selectedTask.createdByName || "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Bắt đầu">
                    {formatDate(selectedTask.startDate)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Hạn">
                    {formatDate(selectedTask.dueDate)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Số giờ ước tính">
                    {selectedTask.estimatedHours
                      ? `${selectedTask.estimatedHours}h`
                      : "—"}
                  </Descriptions.Item>
                </Descriptions>
                <div className="task-split-detail-progress">
                  <span>Tiến độ</span>
                  <Progress percent={selectedTask.progress || 0} />
                </div>
              </>
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Chọn công việc để xem chi tiết"
              />
            )}
          </Card>
        </div>
      )}

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

      <Drawer
        title="Thêm nhanh (Mobile view)"
        placement="right"
        width={360}
        onClose={() => setMobileAddVisible(false)}
        open={mobileAddVisible}
      >
        <Form
          layout="vertical"
          form={mobileAddForm}
          onFinish={handleMobileAddSubmit}
        >
          <Form.Item
            label="Tên công việc"
            name="taskName"
            rules={[{ required: true, message: "Nhập tên công việc" }]}
          >
            <Input placeholder="Nhập nhanh..." />
          </Form.Item>
          <Form.Item label="Dự án" name="projectName">
            <Select
              placeholder="Chọn dự án"
              options={projectOptions}
              allowClear
            />
          </Form.Item>
          <Form.Item label="Hạn chót" name="dueDate">
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item label="Ưu tiên" name="priority" initialValue="MEDIUM">
            <Select
              options={priorityOptions
                .filter((item) => item.value)
                .map((option) => ({
                  label: option.label,
                  value: option.value,
                }))}
            />
          </Form.Item>
          <Form.Item label="Người thực hiện" name="assignedToName">
            <Input placeholder="Tên thành viên" />
          </Form.Item>
          <Space style={{ marginTop: 16 }}>
            <Button onClick={() => setMobileAddVisible(false)}>Huỷ</Button>
            <Button type="primary" htmlType="submit">
              Thêm
            </Button>
          </Space>
        </Form>
      </Drawer>

      {/* Task Template Modal */}
      <ModalTaskTemplate
        visible={templateModalVisible}
        onCancel={() => setTemplateModalVisible(false)}
        onUseTemplate={handleUseTemplate}
      />

      {/* Bulk Operations Modal */}
      <ModalBulkOperations
        visible={bulkModalVisible}
        onCancel={() => {
          setBulkModalVisible(false);
          setSelectedRowKeys([]);
        }}
        selectedTasks={tableData.filter((task) =>
          selectedRowKeys.includes(task.id)
        )}
        operationType={bulkOperationType}
        onSuccess={() => {
          fetchTasks(pagination, filters);
          setSelectedRowKeys([]);
        }}
      />

      {/* Task History Modal */}
      <ModalTaskHistory
        visible={historyModalVisible}
        onClose={() => {
          setHistoryModalVisible(false);
          setSelectedTaskForHistory(null);
        }}
        taskId={selectedTaskForHistory?.id}
        taskData={selectedTaskForHistory}
      />
    </div>
  );
};

export default TaskList;
