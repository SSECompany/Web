import {
  AppstoreOutlined,
  BellOutlined,
  BugOutlined,
  CheckSquareOutlined,
  DeleteOutlined,
  DeploymentUnitOutlined,
  EditOutlined,
  EyeOutlined,
  LayoutOutlined,
  PlusOutlined,
  SwapOutlined,
  TableOutlined,
  ThunderboltOutlined,
  UserAddOutlined,
  UserOutlined,
  UnorderedListOutlined,
  UserSwitchOutlined,
  EyeInvisibleOutlined,
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
  InputNumber,
  List,
  Modal,
  Progress,
  Row,
  Segmented,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  Upload,
  notification,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import TableLocale from "../../../../Context/TableLocale";
import { getUserInfo } from "../../../../store/selectors/Selectors";
import checkPermission from "../../../../utils/permission";
import DepartmentSelector from "../../../ReuseComponents/DepartmentSelector";
import {
  apiDeleteTask,
  apiExportTasks,
  apiGetTasks,
  apiUpdateTaskStatus,
} from "../../API";
import {
  getWorkflowTasksList,
  getWorkflowTasksByProject,
  getWorkflowProjectTasks,
  deleteWorkflowTask,
  updateWorkflowTaskStatus,
  updateWorkflowTask,
  getWorkflowDropdownProjects,
  getWorkflowProjectUsers,
  createWorkflowTask,
} from "../../../WorkflowApp/API/workflowApi";
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
  TESTING: { label: "Đang test", tagColor: "purple", laneColor: "#722ed1" },
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
  "TESTING",
  "COMPLETED",
  "CANCELLED",
];

const TASK_MODE_OPTIONS = [
  { 
    label: "Tất cả", 
    value: "all",
    icon: <UnorderedListOutlined />,
  },
  { 
    label: "Công việc của tôi", 
    value: "my",
    icon: <UserOutlined />,
  },
  { 
    label: "Công việc tôi giao", 
    value: "assigned",
    icon: <UserSwitchOutlined />,
  },
  { 
    label: "Công việc theo dõi", 
    value: "follow",
    icon: <EyeInvisibleOutlined />,
  },
];

const TaskList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Detect if we're in workflow context (giữ điều hướng trong module Workflow giống màn danh sách dự án)
  const isInWorkflow = location.pathname.includes("/workflow");

  // Redux state
  const { tasksList, loading, pagination, filters } = useSelector(
    (state) => state.tasks
  );
  const userInfo = useSelector(getUserInfo);

  // Local state
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
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [quickAddProjectsList, setQuickAddProjectsList] = useState([]);
  const [quickAddUsersList, setQuickAddUsersList] = useState([]);
  const [importProjectId, setImportProjectId] = useState(null);
  
  // Task mode from URL
  const taskMode = searchParams.get("mode") || "all";

  // Task status options
  const taskStatusOptions = [
    { value: "", label: "Tất cả" },
    { value: "PENDING", label: "Chờ thực hiện" },
    { value: "IN_PROGRESS", label: "Đang thực hiện" },
    { value: "REVIEW", label: "Đang xem xét" },
    { value: "TESTING", label: "Đang test" },
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

  // Define handlers before useMemo
  const handleViewDetail = useCallback((record) => {
    const basePath = isInWorkflow
      ? `/workflow/task-management/task/${record.id}`
      : `/task-management/task/${record.id}`;
    navigate(basePath);
  }, [isInWorkflow, navigate]);

  const handleOpenDeleteDialog = useCallback((record) => {
    setCurrentItemSelected(record);
    setIsOpenModalDeleteTask(true);
  }, []);

  // Table columns configuration
  const tableColumns = useMemo(() => {
    return [
      {
        title: "STT",
        key: "stt",
        width: 60,
        fixed: "left",
        align: "center",
        render: (_, __, index) => {
          const currentPage = pagination.pageindex || pagination.current || 1;
          const pageSize = pagination.pageSize || 20;
          return (currentPage - 1) * pageSize + index + 1;
        },
      },
      {
        title: "Mã công việc",
        dataIndex: "taskCode",
        key: "taskCode",
        width: 150,
        fixed: "left",
        sorter: true,
        ellipsis: true,
        render: (text, record) => (
          <button
            type="button"
            onClick={() => handleViewDetail(record)}
            style={{ 
              color: "#1890ff", 
              cursor: "pointer", 
              whiteSpace: "nowrap",
              background: "none",
              border: "none",
              padding: 0,
              textDecoration: "underline"
            }}
          >
            {text}
          </button>
        ),
      },
      {
        title: "Tên công việc",
        dataIndex: "taskName",
        key: "taskName",
        width: 250,
        fixed: "left",
        ellipsis: true,
        render: (text) => <span style={{ whiteSpace: "nowrap" }}>{text}</span>,
      },
      {
        title: "Dự án",
        dataIndex: "projectName",
        key: "projectName",
        width: 180,
        ellipsis: true,
        render: (text, record) => (
          <span style={{ color: "#1890ff", cursor: "pointer", whiteSpace: "nowrap" }}>
            {text || "Không có"}
          </span>
        ),
      },
      {
        title: "Loại",
        dataIndex: "type",
        key: "type",
        width: 150,
        ellipsis: false,
        render: (type) => {
          const meta = TASK_TYPE_META[type] || TASK_TYPE_META.TASK;
          return (
            <Tag 
              color={meta.color} 
              icon={meta.icon} 
              style={{ 
                whiteSpace: "nowrap",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              {meta.label}
            </Tag>
          );
        },
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        width: 140,
        ellipsis: true,
        render: (status) => {
          const meta = STATUS_META[status] || STATUS_META.PENDING;
          return <Tag color={meta.tagColor} style={{ whiteSpace: "nowrap" }}>{meta.label}</Tag>;
        },
      },
      {
        title: "Độ ưu tiên",
        dataIndex: "priority",
        key: "priority",
        width: 130,
        ellipsis: true,
        render: (priority) => {
          const meta = PRIORITY_META[priority] || PRIORITY_META.MEDIUM;
          return <Tag color={meta.tagColor} style={{ whiteSpace: "nowrap" }}>{meta.label}</Tag>;
        },
      },
      {
        title: "Người thực hiện",
        dataIndex: "assignedToName",
        key: "assignedToName",
        width: 170,
        ellipsis: true,
        render: (text) => <span style={{ whiteSpace: "nowrap" }}>{text || "Chưa giao việc"}</span>,
      },
      {
        title: "Người tạo",
        dataIndex: "createdByName",
        key: "createdByName",
        width: 140,
        ellipsis: true,
        render: (text, record) => (
          <Button
            type="link"
            style={{ padding: 0, height: "auto", whiteSpace: "nowrap" }}
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
        width: 130,
        ellipsis: true,
        render: (date) => {
          if (!date) return "";
          const dueDate = new Date(date);
          const today = new Date();
          const isOverdue = dueDate < today;

          return (
            <span style={{ color: isOverdue ? "#ff4d4f" : "#000", whiteSpace: "nowrap" }}>
              {dueDate.toLocaleDateString("vi-VN")}
            </span>
          );
        },
      },
      {
        title: "Tiến độ (%)",
        dataIndex: "progress",
        key: "progress",
        width: 120,
        ellipsis: true,
        render: (progress) => <span style={{ whiteSpace: "nowrap" }}>{`${progress || 0}%`}</span>,
      },
      {
        title: "Số giờ ước tính",
        dataIndex: "estimatedHours",
        key: "estimatedHours",
        width: 140,
        ellipsis: true,
        render: (hours) => <span style={{ whiteSpace: "nowrap" }}>{hours ? `${hours}h` : ""}</span>,
      },
      {
        title: "Thao tác",
        key: "action",
        width: 200,
        align: "center",
        render: (_, record) => (
          <Space size="small">
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
  }, [pagination, handleViewDetail, handleOpenDeleteDialog]);

  // Functions
  const refreshData = () => {
    const newPagination = { ...pagination, pageindex: 1, current: 1 };
    dispatch(setPagination(newPagination));
    fetchTasks(newPagination, filters);
  };

  const fetchTasks = async (
    paginationData = pagination,
    filterData = filters,
    mode = taskMode
  ) => {
    try {
      dispatch(setLoading(true));

      if (isInWorkflow) {
        // Workflow API: sử dụng getWorkflowTasksList hoặc getWorkflowTasksByProject
        const now = new Date();
        const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
        
        console.log("=== FETCH WORKFLOW TASKS ===");
        console.log("yyyymm:", yyyymm);
        
        const workflowParams = {
          companyCode: "DVCS01",
          yyyymm: yyyymm,
          pageIndex: paginationData.pageindex || 1,
          pageSize: paginationData.pageSize || 20,
        };

        // Thêm các filter nếu có
        if (filterData.status) {
          workflowParams.status = filterData.status;
        }
        if (filterData.projectId) {
          workflowParams.projectId = filterData.projectId;
        }
        if (filterData.searchKey) {
          workflowParams.searchKey = filterData.searchKey;
        }
        if (mode === "my") {
          workflowParams.userId = 1;
        }

        let response;
        // Nếu có projectId, dùng getWorkflowProjectTasks (không filter theo userId)
        // Để hiển thị TẤT CẢ tasks của project, không chỉ tasks của user hiện tại
        if (filterData.projectId) {
          // Sử dụng getWorkflowProjectTasks thay vì getWorkflowUserProjectTasks hoặc getWorkflowTasksByProject
          response = await getWorkflowProjectTasks({
            companyCode: "DVCS01",
            yyyymm: yyyymm,
            projectId: filterData.projectId,
            pageIndex: paginationData.pageindex || 1,
            pageSize: paginationData.pageSize || 20,
            ...(filterData.status && { status: filterData.status }),
            ...(filterData.searchKey && { searchKey: filterData.searchKey }),
            // Nếu mode === "my", có thể filter theo AssignedTo ở frontend sau khi load
            ...(mode === "my" && { assignedTo: 1 }), // Filter ở frontend nếu cần
          });
        } else {
          // Nếu không có projectId, dùng getWorkflowTasksList
          response = await getWorkflowTasksList(workflowParams);
        }

        console.log("=== API RESPONSE ===");
        console.log("Response type:", typeof response);
        console.log("Is array?:", Array.isArray(response));
        console.log("Length:", Array.isArray(response) ? response.length : 'N/A');
        if (Array.isArray(response) && response.length > 0) {
          console.log("First item:", response[0]);
          console.log("First item keys:", Object.keys(response[0]));
          console.log("First item TaskId:", response[0].TaskId);
          console.log("First item Id:", response[0].Id);
        }

        // Map dữ liệu từ PascalCase sang camelCase
        const mappedTasks = Array.isArray(response) ? response.map((task, index) => {
          // Extract ID từ nhiều nguồn có thể
          let taskId = task.TaskId || task.Id || task.id || task.taskId || task.ID;
          
          // Fallback 1: Nếu không có ID, sử dụng TaskCode làm unique identifier
          if (!taskId && task.TaskCode) {
            // Sử dụng TaskCode làm ID tạm thời (phải unique)
            taskId = task.TaskCode;
          }
          
          // Fallback 2: Sử dụng index (không khuyến nghị nhưng tránh crash)
          if (!taskId) {
            console.warn("Task không có ID, sử dụng index:", task);
            taskId = `temp_${index}_${Date.now()}`;
          }
          
          const mapped = {
          id: taskId,
          _rawTask: task, // Lưu raw data để debug
          taskCode: task.TaskCode || task.taskCode || "",
          taskName: task.TaskName || task.taskName || "",
          projectId: task.ProjectId || task.projectId,
          projectName: task.ProjectName || task.projectName || "",
          projectCode: task.ProjectCode || task.projectCode,
          status: task.Status || task.status || "PENDING",
          priority: task.Priority || task.priority || "MEDIUM",
          type: task.Category || task.category || "TASK",
          mode: task.Mode || task.mode || "INTERNAL",
          progress: task.Progress || task.progress || 0,
          assignedToId: task.AssignedTo || task.assignedTo,
          assignedToName: task.AssignedToName || task.assignedToName || "",
          assignedTo: task.AssignedToName || task.assignedToName || "",
          assignedById: task.AssignedBy || task.assignedBy,
          assignedByName: task.AssignedByName || task.assignedByName || "",
          reviewerId: task.ReviewerId || task.reviewerId,
          reviewerName: task.ReviewerName || task.reviewerName,
          createdById: task.CreatedBy || task.createdBy,
          createdByName: task.CreatedByName || task.createdByName || "",
          createdBy: task.CreatedByName || task.createdByName || "",
          createdDate: task.CreatedDate || task.createdDate || task.datetime0,
          updatedDate: task.UpdatedDate || task.updatedDate || task.datetime2,
          completedDate: task.CompletedDate || task.completedDate,
          dueDate: task.DueDate || task.dueDate,
          startDate: task.StartDate || task.startDate,
          endDate: task.EndDate || task.endDate,
          estimatedHours: task.EstimatedHours || task.estimatedHours,
          actualHours: task.ActualHours || task.actualHours,
          description: task.Description || task.description || "",
          // QUAN TRỌNG: Lưu yyyymm để sử dụng khi update task
          yyyymm: task.TaskMonth || task.taskMonth || task.yyyymm || yyyymm,
          parentTaskId: task.ParentTaskId || task.parentTaskId,
          level: task.Level || task.level || 1,
          category: task.Category || task.category || "TASK",
          formTemplate: task.FormTemplate || task.formTemplate,
          };
          
          // Debug first task
          if (index === 0) {
            console.log("=== MAPPED TASK (first) ===");
            console.log("Original task:", task);
            console.log("Mapped task:", mapped);
            console.log("ID value:", mapped.id);
            console.log("ID type:", typeof mapped.id);
          }
          
          return mapped;
        }) : [];

        console.log("=== MAPPED TASKS SUMMARY ===");
        console.log("Total mapped tasks:", mappedTasks.length);
        console.log("Tasks with valid numeric ID:", mappedTasks.filter(t => typeof t.id === 'number').length);
        console.log("Tasks with string ID:", mappedTasks.filter(t => typeof t.id === 'string').length);

        dispatch(setTasksList(mappedTasks));
        setTotalResults(mappedTasks.length);
        dispatch(
          setPagination({
            ...paginationData,
            total: mappedTasks.length,
          })
        );
      } else {
        // API cũ cho task management thông thường
        let departmentFilter = filterData.departmentId;
        if (!filterData.showAllDepartments && !departmentFilter) {
          departmentFilter = userInfo.unitId;
        }

        const apiParams = {
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
        };

        if (mode && mode !== "all") {
          apiParams.mode = mode;
          if (mode === "my" && userInfo?.id) {
            apiParams.assignedTo = userInfo.id;
          }
          if (mode === "assigned" && userInfo?.id) {
            apiParams.createdBy = userInfo.id;
          }
        }

        const response = await apiGetTasks(apiParams);

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
      }
    } catch (error) {
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
    console.log("=== HANDLE EDIT ===");
    console.log("Record passed to edit:", record);
    console.log("Record.id:", record.id);
    console.log("Record keys:", Object.keys(record));
    
    setCurrentRecord(record);
    setOpenModalAddTaskState(true);
    setOpenModalType("EDIT");
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

  const handleDeleteTask = async () => {
    try {
      const taskToDelete = currentItemSelected;
      
      if (!taskToDelete || !taskToDelete.id) {
        notification.error({
          message: "Lỗi",
          description: "Không tìm thấy công việc cần xóa",
        });
        return;
      }

      if (isInWorkflow) {
        // Workflow API: sử dụng deleteWorkflowTask
        // Sử dụng yyyymm gốc của task để tìm đúng bảng trong database
        const taskYyyymm = taskToDelete.yyyymm || (() => {
          const now = new Date();
          return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
        })();
        
        await deleteWorkflowTask({
          yyyymm: taskYyyymm,
          taskId: taskToDelete.id,
          companyCode: "DVCS01",
          deletedBy: 1,
        });

        notification.success({
          message: "Thành công",
          description: "Xóa công việc thành công",
        });
        refreshData();
      } else {
        // API cũ
        const response = await apiDeleteTask({
          id: taskToDelete.id,
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
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      
      // Kiểm tra response error từ API
      const errorResponse = error?.response?.data;
      if (Array.isArray(errorResponse) && errorResponse.length > 0) {
        const errorItem = errorResponse[0];
        notification.warning({
          message: "Thông báo",
          description: errorItem.message || "Không thể xóa công việc",
        });
      } else {
        notification.error({
          message: "Lỗi",
          description: error?.response?.data?.message || "Có lỗi xảy ra khi xóa công việc",
        });
      }
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
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch when mode changes
  useEffect(() => {
    if (taskMode) {
      const newPagination = { ...pagination, pageindex: 1, current: 1 };
      dispatch(setPagination(newPagination));
      fetchTasks(newPagination, filters, taskMode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskMode]);

  const hasRemoteTasks = Array.isArray(tasksList) && tasksList.length > 0;
  // Filter tasks based on mode
  const filterTasksByMode = (tasks) => {
    if (taskMode === "all") {
      return tasks;
    }
    
    const currentUserId = userInfo?.id;
    const currentUserName = userInfo?.fullName;
    
    return tasks.filter((task) => {
      switch (taskMode) {
        case "my":
          // Công việc của tôi: assignedToName hoặc assignedToId phải là user hiện tại
          return (
            task.assignedToName === currentUserName ||
            task.assignedToId === currentUserId ||
            task.assignedTo === currentUserName
          );
        case "assigned":
          // Công việc tôi giao: createdByName hoặc createdById phải là user hiện tại
          return (
            task.createdByName === currentUserName ||
            task.createdById === currentUserId ||
            task.createdBy === currentUserName
          );
        case "follow":
          // Công việc theo dõi: tạm thời coi là các task do tôi tạo nhưng giao cho người khác
          return (
            (task.createdByName === currentUserName ||
              task.createdById === currentUserId) &&
            task.assignedToName !== currentUserName &&
            task.assignedToId !== currentUserId &&
            task.assignedToName &&
            task.assignedToName !== "Chưa giao"
          );
        default:
          return true;
      }
    });
  };

  const tableData = useMemo(() => {
    const rawData = tasksList || [];
    // Apply mode filter
    return filterTasksByMode(rawData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasksList, taskMode, userInfo]);
  const totalDisplay = useMemo(() => {
    if (hasRemoteTasks) {
      // For remote tasks, API should return filtered count
      // But we also filter client-side for consistency
      return tableData.length;
    }
    // For local tasks, use filtered count
    return tableData.length;
  }, [hasRemoteTasks, tableData.length]);

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
    const source = tasksList || [];
    const options = Array.from(
      new Set(source.map((task) => task.projectName).filter(Boolean))
    );
    return options.map((name) => ({ label: name, value: name }));
  }, [tasksList]);

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

  // Load projects when quick add modal opens
  useEffect(() => {
    if (showQuickModal && isInWorkflow) {
      loadQuickAddProjects();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showQuickModal, isInWorkflow]);

  // Watch projectId in quick add form to load users
  const quickAddProjectId = Form.useWatch("projectId", quickAddForm);
  
  useEffect(() => {
    if (showQuickModal && isInWorkflow && quickAddProjectId) {
      loadQuickAddUsers(quickAddProjectId);
    } else if (showQuickModal && isInWorkflow && !quickAddProjectId) {
      setQuickAddUsersList([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quickAddProjectId, showQuickModal, isInWorkflow]);

  // Reset import projectId when modal closes
  useEffect(() => {
    if (!showQuickModal) {
      setImportProjectId(null);
    }
  }, [showQuickModal]);

  // Validate importProjectId exists in the projects list
  useEffect(() => {
    if (showQuickModal && importProjectId && quickAddProjectsList.length > 0) {
      const projectExists = quickAddProjectsList.some(
        (project) => String(project.id) === String(importProjectId)
      );
      if (!projectExists) {
        // Reset if the project doesn't exist in the list
        setImportProjectId(null);
      }
    }
  }, [showQuickModal, importProjectId, quickAddProjectsList]);

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
    dispatch(setTasksList([...(newItems || []), ...(tasksList || [])]));
    setTotalResults((prev) => (prev || 0) + newItems.length);
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

  const loadQuickAddProjects = async () => {
    try {
      if (!isInWorkflow) {
        setQuickAddProjectsList([]);
        return;
      }

      const response = await getWorkflowDropdownProjects({ 
        companyCode: "DVCS01" 
      });

      if (Array.isArray(response)) {
        const mappedProjects = response.map((project) => {
          // API trả về value field là ID của project
          const projectId = project.value || project.Id || project.id || project.Value;
          // Lưu label để hiển thị
          const label = project.label || "";
          // Sử dụng label nếu có, nếu không thì dùng ProjectName hoặc ProjectCode
          const displayName = project.label || project.ProjectName || project.projectName || project.ProjectCode || project.projectCode || "";
          
          return {
            id: String(projectId),
            label: label,
            projectName: displayName,
            projectCode: project.ProjectCode || project.projectCode || "",
          };
        });
        setQuickAddProjectsList(mappedProjects);
      } else {
        setQuickAddProjectsList([]);
      }
    } catch (error) {
      console.error("Error loading projects for quick add:", error);
      setQuickAddProjectsList([]);
    }
  };

  const loadQuickAddUsers = async (projectId) => {
    try {
      if (!isInWorkflow) {
        setQuickAddUsersList([]);
        return;
      }

      if (!projectId) {
        setQuickAddUsersList([]);
        return;
      }

      // Đảm bảo projectId là số (API có thể yêu cầu number)
      const numericProjectId = typeof projectId === 'string' ? parseInt(projectId, 10) : projectId;
      if (isNaN(numericProjectId)) {
        console.error("Invalid projectId:", projectId);
        setQuickAddUsersList([]);
        return;
      }

      const response = await getWorkflowProjectUsers({ 
        companyCode: "DVCS01",
        projectId: numericProjectId
      });

      if (Array.isArray(response)) {
        const mappedUsers = response.map((user) => ({
          id: user.Id || user.id || user.UserId || user.userId,
          fullName: user.FullName || user.fullName || "",
          email: user.Email || user.email || "",
        }));
        setQuickAddUsersList(mappedUsers);
      } else {
        setQuickAddUsersList([]);
      }
    } catch (error) {
      console.error("Error loading users for quick add:", error);
      setQuickAddUsersList([]);
    }
  };

  const handleQuickAddSubmit = async (values) => {
    if (!values.taskName) {
      notification.warning({
        message: "Thiếu thông tin",
        description: "Vui lòng nhập tên công việc",
      });
      return;
    }

    try {
      if (isInWorkflow) {
        // Gọi API để tạo task mới trong workflow
        const now = new Date();
        const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
        
        // Tìm assignedToId từ assignedToName
        let assignedToId = null;
        if (values.assignedToName && quickAddUsersList.length > 0) {
          const user = quickAddUsersList.find(u => u.fullName === values.assignedToName);
          if (user) {
            assignedToId = user.id;
          }
        }

        // Chuyển đổi projectId sang số, mặc định là 0 nếu không có
        let projectId = 0;
        if (values.projectId) {
          projectId = typeof values.projectId === 'string' ? parseInt(values.projectId, 10) : values.projectId;
          if (isNaN(projectId)) {
            projectId = 0;
          }
        }

        // Chuyển đổi assignedToId sang số, mặc định là 0 nếu không có
        let assignedTo = 0;
        if (assignedToId) {
          assignedTo = typeof assignedToId === 'string' ? parseInt(assignedToId, 10) : assignedToId;
          if (isNaN(assignedTo)) {
            assignedTo = 0;
          }
        }

        // Fix cứng assignedBy và createdBy = 1
        const assignedBy = 1;
        const createdBy = 1;

        // Xử lý dates - đảm bảo là ISO string hoặc null
        const startDate = values.startDate 
          ? (values.startDate.toISOString ? values.startDate.toISOString() : dayjs(values.startDate).toDate().toISOString())
          : new Date().toISOString();
        // Fix endDate không được null - ưu tiên endDate, nếu không có thì dùng dueDate, nếu không có thì dùng startDate
        const endDate = values.endDate 
          ? (values.endDate.toISOString ? values.endDate.toISOString() : dayjs(values.endDate).toDate().toISOString())
          : (values.dueDate 
            ? (values.dueDate.toISOString ? values.dueDate.toISOString() : dayjs(values.dueDate).toDate().toISOString())
            : startDate);
        const dueDate = values.dueDate 
          ? (values.dueDate.toISOString ? values.dueDate.toISOString() : dayjs(values.dueDate).toDate().toISOString())
          : null;

        // Xử lý estimatedHours - đảm bảo là number
        let estimatedHours = values.estimatedHours 
          ? (typeof values.estimatedHours === 'string' ? parseInt(values.estimatedHours, 10) : values.estimatedHours)
          : 0;
        if (isNaN(estimatedHours)) {
          estimatedHours = 0;
        }

        const workflowTaskData = {
          companyCode: "DVCS01",
          yyyymm: yyyymm,
          taskName: values.taskName || "",
          projectId: projectId,
          parentTaskId: 0,
          level: 0,
          status: values.status || "PENDING",
          priority: values.priority || "MEDIUM",
          mode: "INTERNAL",
          category: "TASK",
          formTemplate: "1",
          estimatedHours: estimatedHours,
          startDate: startDate,
          endDate: endDate,
          dueDate: dueDate,
          assignedBy: 1, // Fix cứng assignedBy = 1
          assignedTo: assignedTo,
          reviewerId: 0,
          description: values.description || "",
          createdBy: 1, // Fix cứng createdBy = 1
        };

        dispatch(setLoading(true));
        const response = await createWorkflowTask(workflowTaskData);
        
        notification.success({
          message: "Thành công",
          description: "Tạo công việc mới thành công",
        });

        // Refresh danh sách tasks
        refreshData();
        quickAddForm.resetFields();
        setShowQuickModal(false);
      } else {
        // API cũ - giữ nguyên logic cũ
        const newTask = buildLocalTask(values);
        appendTasks(newTask);
        quickAddForm.resetFields();
        setShowQuickModal(false);
        notification.success({
          message: "Đã thêm nhanh",
          description: "Công việc mới đã xuất hiện trong danh sách.",
        });
      }
    } catch (error) {
      console.error("Error creating task:", error);
      notification.error({
        message: "Lỗi",
        description: error.message || "Có lỗi xảy ra khi tạo công việc mới",
      });
    } finally {
      dispatch(setLoading(false));
    }
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
    
    // Get project name from selected projectId
    let projectName = "Dự án import";
    if (importProjectId && isInWorkflow) {
      const project = quickAddProjectsList.find(p => p.id === importProjectId);
      if (project) {
        projectName = project.projectName || project.projectCode;
      }
    } else if (projectOptions.length > 0) {
      projectName = projectOptions[0].label;
    }
    
    setTimeout(() => {
      const generatedTasks = Array.from({ length: 3 }).map((_, index) =>
        buildLocalTask({
          taskName: `${baseName} - Item ${index + 1}`,
          projectId: importProjectId || null,
          projectName: projectName,
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

  // Validate workflow transitions (theo quy trình BA → Dev → Review → Test → Close)
  const isValidTransition = (fromStatus, toStatus) => {
    const validTransitions = {
      PENDING: ["IN_PROGRESS", "CANCELLED"],
      IN_PROGRESS: ["REVIEW", "TESTING", "CANCELLED"],
      REVIEW: ["TESTING", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
      TESTING: ["COMPLETED", "REVIEW", "IN_PROGRESS", "CANCELLED"],
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
      const updatedTasks = (tasksList || []).map((task) =>
        task.id === draggedTask.id ? { ...task, status: targetStatus } : task
      );
      dispatch(setTasksList(updatedTasks));

      notification.success({
        message: "Đã cập nhật trạng thái",
        description: `Demo: chuyển "${draggedTask.taskName}" sang "${STATUS_META[targetStatus]?.label}"`,
      });

      setDraggedTask(null);
      return;
    }

    try {
      let response;
      let errorStatus = null;
      
      if (isInWorkflow) {
        // Workflow API: sử dụng updateWorkflowTaskStatus (chuyên dụng cho update status)
        // Sử dụng yyyymm gốc của task để tìm đúng bảng trong database
        const taskYyyymm = draggedTask.yyyymm || (() => {
          const now = new Date();
          return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
        })();
        
        // Payload cho updateWorkflowTaskStatus - sử dụng newStatus thay vì status
        const statusUpdatePayload = {
          companyCode: draggedTask.companyCode || "DVCS01",
          yyyymm: taskYyyymm,
          taskId: draggedTask.id,
          newStatus: targetStatus, // API yêu cầu newStatus thay vì status
          updatedBy: 1, // Set cứng updatedBy = 1
        };
        
        try {
          // Gọi API update status
          response = await updateWorkflowTaskStatus(statusUpdatePayload);
        } catch (apiError) {
          // Kiểm tra status code từ error response
          if (apiError?.response?.status === 400 || apiError?.response?.status === 500) {
            errorStatus = apiError.response.status;
            throw apiError;
          }
          // Nếu không phải 400/500, vẫn coi như thành công
          response = null;
        }
        
        // Chỉ báo lỗi nếu có status 400 hoặc 500
        // Nếu không có response nhưng không phải 400/500, vẫn báo thành công
        if (errorStatus && (errorStatus === 400 || errorStatus === 500)) {
          throw new Error(`API trả về lỗi ${errorStatus}`);
        }
        
        // Không có response hoặc có response đều báo thành công (trừ khi đã throw ở trên)
        // Refresh lại danh sách tasks để lấy dữ liệu mới nhất
        await fetchTasks(pagination, filters, taskMode);
        
        notification.success({
          message: "Cập nhật trạng thái thành công",
          description: `Đã chuyển "${draggedTask.taskName || draggedTask.taskCode}" từ "${
            STATUS_META[draggedTask.status]?.label
          }" sang "${STATUS_META[targetStatus]?.label}"`,
          duration: 3,
        });
      } else {
        // API cũ
        try {
          response = await apiUpdateTaskStatus({
            taskId: draggedTask.id,
            status: targetStatus,
            reason: `Kéo thả từ "${STATUS_META[draggedTask.status]?.label}" sang "${
              STATUS_META[targetStatus]?.label
            }"`,
          });
        } catch (apiError) {
          // Kiểm tra status code từ error response
          if (apiError?.response?.status === 400 || apiError?.response?.status === 500) {
            errorStatus = apiError.response.status;
            throw apiError;
          }
          // Nếu không phải 400/500, vẫn coi như thành công
          response = null;
        }

        // Chỉ báo lỗi nếu có status 400 hoặc 500
        if (errorStatus && (errorStatus === 400 || errorStatus === 500)) {
          throw new Error(`API trả về lỗi ${errorStatus}`);
        }

        // Nếu response có status 400 hoặc 500, báo lỗi
        if (response?.status === 400 || response?.status === 500) {
          throw new Error(response?.message || `API trả về lỗi ${response.status}`);
        }

        // Không có response hoặc response thành công đều refresh danh sách
        await fetchTasks(pagination, filters, taskMode);

        notification.success({
          message: "Cập nhật trạng thái thành công",
          description: `Đã chuyển "${draggedTask.taskName || draggedTask.taskCode}" từ "${
            STATUS_META[draggedTask.status]?.label
          }" sang "${STATUS_META[targetStatus]?.label}"`,
          duration: 3,
        });
      }
    } catch (error) {
      console.error("Error updating task status:", error);
      
      notification.error({
        message: "Lỗi cập nhật trạng thái",
        description: error?.message || "Không thể cập nhật trạng thái công việc. Vui lòng thử lại.",
        duration: 4,
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
      <div className="task-header-grid">
        <div className="task-header-card">
          <div className="task-header-card__title">
            <div>
              <h2>
                {taskMode === "all"
                  ? "Danh sách công việc"
                  : TASK_MODE_OPTIONS.find((opt) => opt.value === taskMode)
                      ?.label || "Danh sách công việc"}
              </h2>
              <span className="task-header-card__subtitle">
                {totalResults} công việc đang theo dõi
              </span>
            </div>
          </div>

          <div className="task-status-chips">
            {STATUS_ORDER.map((statusKey) => {
              const meta = STATUS_META[statusKey];
              const count = tasksList.filter(
                (task) => task.status === statusKey
              ).length;
              return (
                <Tag
                  key={statusKey}
                  className={`status-chip ${
                    filters.status === statusKey ? "active" : ""
                  }`}
                  color={
                    filters.status === statusKey ? meta.tagColor : undefined
                  }
                  onClick={() =>
                    handleStatusChange(
                      filters.status === statusKey ? "" : statusKey
                    )
                  }
                >
                  <div className="status-chip__content">
                    <span className="status-chip__label">{meta.label}</span>
                    <span className="status-chip__value">{count}</span>
                  </div>
                </Tag>
              );
            })}
          </div>
        </div>

        <div className="task-action-card">
          <div>
            <p className="task-action-card__label">Tạo công việc mới</p>
            <p className="task-action-card__desc">
              Lên kế hoạch, phân công và theo dõi tiến độ nhanh chóng.
            </p>
          </div>
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            <Button
              type="primary"
              size="middle"
              icon={<PlusOutlined />}
              onClick={() => {
                setShowQuickModal(true);
                setOpenModalType("Add");
                setCurrentRecord(null);
              }}
              block
              className="task-primary-add-btn"
            >
              Thêm công việc mới
            </Button>
            {selectedRowKeys.length > 0 && (
              <Space
                size={4}
                split={<span>|</span>}
                className="task-action-card__bulk"
              >
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
            )}
          </Space>
        </div>
      </div>

      {/* Task Mode Selector */}
      <div className="task-mode-selector">
        <Segmented
          value={taskMode}
          onChange={(value) => {
            const newSearchParams = new URLSearchParams(searchParams);
            if (value === "all") {
              newSearchParams.delete("mode");
            } else {
              newSearchParams.set("mode", value);
            }
            setSearchParams(newSearchParams);
            // Reset pagination when mode changes
            const newPagination = { ...pagination, pageindex: 1, current: 1 };
            dispatch(setPagination(newPagination));
            fetchTasks(newPagination, filters, value);
          }}
          options={TASK_MODE_OPTIONS.map((option) => ({
            label: (
              <Space size={6} className={`task-mode-option task-mode-${option.value}`}>
                {option.icon}
                <span>{option.label}</span>
              </Space>
            ),
            value: option.value,
          }))}
          size="default"
          block
          className="task-mode-segmented"
        />
      </div>

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

      {/* Filters + Thêm nhanh toggle */}
      <div
        className="task-filters"
        style={{
          marginBottom: 16,
          display: "flex",
          gap: 16,
          alignItems: "flex-start",
        }}
      >
        <Space wrap style={{ flex: 1 }}>
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
            title="Chọn trạng thái công việc"
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
            title="Chọn mức độ ưu tiên công việc"
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

        {/* Nút thêm nhanh đã chuyển lên header chính để tránh trùng lặp */}
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
        <div className="task-table-wrapper">
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
            scroll={{ x: 'max-content', y: 400 }}
            locale={TableLocale}
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
            }}
          />
        </div>
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
      <Modal
        title="Xác nhận xóa công việc"
        open={isOpenModalDeleteTask}
        onOk={handleDeleteTask}
        onCancel={() => {
          setIsOpenModalDeleteTask(false);
          setCurrentItemSelected({});
        }}
        okText="Xóa"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
      >
        <p>Bạn có chắc chắn muốn xóa công việc <strong>{currentItemSelected.taskName || currentItemSelected.taskCode || currentItemSelected.id}</strong> không?</p>
        <p style={{ color: "#ff4d4f" }}>Hành động này không thể hoàn tác.</p>
      </Modal>

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

      {/* Quick Add Modal */}
      <Modal
        title="Thêm công việc"
        open={showQuickModal}
        onCancel={() => {
          setShowQuickModal(false);
          quickAddForm.resetFields();
        }}
        footer={null}
        width="90%"
        style={{ maxWidth: "1400px" }}
        centered
        className="task-add-modal"
      >
        <Tabs
          defaultActiveKey="quick"
          items={[
            {
              key: "quick",
              label: "Thêm nhanh",
              children: (
                <Form
                  layout="vertical"
                  form={quickAddForm}
                  onFinish={handleQuickAddSubmit}
                >
                  <Row gutter={[12, 0]}>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        label="Tên công việc"
                        name="taskName"
                        rules={[{ required: true, message: "Nhập tên công việc" }]}
                      >
                        <Input placeholder="VD: Chuẩn hóa dữ liệu" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item label="Dự án" name="projectId">
                        <Select
                          placeholder="Chọn dự án"
                          allowClear
                          showSearch
                          optionFilterProp="children"
                          filterOption={(input, option) => {
                            const label = option?.children || "";
                            return label.toString().toLowerCase().indexOf(input.toLowerCase()) >= 0;
                          }}
                          onChange={(value) => {
                            // Reset assignedToName when project changes
                            quickAddForm.setFieldsValue({ assignedToName: undefined });
                            // Load users for selected project
                            if (value && isInWorkflow) {
                              loadQuickAddUsers(value);
                            } else {
                              setQuickAddUsersList([]);
                            }
                          }}
                          notFoundContent="Không tìm thấy dự án"
                        >
                          {quickAddProjectsList.map((project) => {
                            // Hiển thị label - ProjectCode, nếu label rỗng thì chỉ hiển thị ProjectCode
                            const displayText = project.label && project.projectCode
                              ? `${project.label} - ${project.projectCode}`
                              : project.label
                              ? project.label
                              : project.projectCode
                              ? project.projectCode
                              : project.projectName || `Dự án ${project.id}`;
                            return (
                              <Option 
                                key={String(project.id)} 
                                value={String(project.id)}
                              >
                                {displayText}
                              </Option>
                            );
                          })}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
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
                    <Col xs={24} sm={8}>
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
                    <Col xs={24} sm={8}>
                      <Form.Item label="Ngày bắt đầu" name="startDate">
                        <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                      <Form.Item label="Hạn chót" name="dueDate">
                        <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                      <Form.Item label="Người thực hiện" name="assignedToName">
                        <Select
                          placeholder={quickAddProjectId ? "Chọn người thực hiện" : "Chọn dự án trước"}
                          allowClear
                          showSearch
                          filterOption={(input, option) =>
                            option.children
                              .toLowerCase()
                              .indexOf(input.toLowerCase()) >= 0
                          }
                          disabled={!quickAddProjectId}
                        >
                          {quickAddUsersList.map((user) => (
                            <Option key={user.id} value={user.fullName}>
                              {user.fullName}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                      <Form.Item label="Giờ ước tính" name="estimatedHours">
                        <InputNumber
                          style={{ width: "100%" }}
                          min={0}
                          placeholder="Số giờ"
                          controls={false}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item style={{ textAlign: "right", marginTop: 24, marginBottom: 0 }}>
                    <Space>
                      <Button
                        onClick={() => {
                          setShowQuickModal(false);
                          quickAddForm.resetFields();
                        }}
                      >
                        Hủy
                      </Button>
                      <Button onClick={() => quickAddForm.resetFields()}>
                        Làm mới
                      </Button>
                      <Button type="primary" htmlType="submit">
                        Thêm nhanh
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: "import",
              label: "Nhập từ Excel/CSV",
              children: (
                <div>
                  <Form.Item label="Dự án" style={{ marginBottom: 16 }}>
                    <Select
                      placeholder="Chọn dự án"
                      allowClear
                      showSearch
                      value={importProjectId ? String(importProjectId) : undefined}
                      onChange={(value) => {
                        setImportProjectId(value ? String(value) : null);
                      }}
                      filterOption={(input, option) => {
                        const label = option?.children || option?.label || "";
                        return label.toString().toLowerCase().indexOf(input.toLowerCase()) >= 0;
                      }}
                      optionFilterProp="children"
                      notFoundContent="Không tìm thấy dự án"
                    >
                      {quickAddProjectsList.map((project) => {
                        // Hiển thị label - ProjectCode, nếu label rỗng thì chỉ hiển thị ProjectCode
                        const displayText = project.label && project.projectCode
                          ? `${project.label} - ${project.projectCode}`
                          : project.label
                          ? project.label
                          : project.projectCode
                          ? project.projectCode
                          : project.projectName || `Dự án ${project.id}`;
                        return (
                          <Option 
                            key={String(project.id)} 
                            value={String(project.id)}
                          >
                            {displayText}
                          </Option>
                        );
                      })}
                    </Select>
                  </Form.Item>
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
                  <div style={{ textAlign: "right", marginTop: 16 }}>
                    <Button
                      onClick={() => {
                        setShowQuickModal(false);
                        setImportProjectId(null);
                      }}
                    >
                      Đóng
                    </Button>
                  </div>
                </div>
              ),
            },
          ]}
        />
      </Modal>
    </div>
  );
};

export default TaskList;
