import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import {
  Avatar,
  Badge,
  Button,
  Card,
  DatePicker,
  Empty,
  Input,
  Modal,
  notification,
  Progress,
  Row,
  Col,
  Select,
  Segmented,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
} from "antd";
import {
  AppstoreOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileTextOutlined,
  PlusOutlined,
  TeamOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import TableLocale from "../../../../Context/TableLocale";
import { apiGetProjects, apiDeleteProject } from "../../API";
import {
  setProjectsList,
  setLoading,
  setError,
  setPagination,
  setFilters,
} from "../../Store/Slices/ProjectSlice";
import ModalAddProject from "../../Modals/ModalAddProject/ModalAddProject";
import "./ProjectList.css";
import { getWorkflowProjectsList, getWorkflowProjectSummary, searchWorkflowRelations, deleteWorkflowProject } from "../../../WorkflowApp/API/workflowApi";

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;
const TEAM_COLORS = ["#1890ff", "#13c2c2", "#52c41a", "#fa541c", "#722ed1", "#eb2f96"];

const STATUS_META = {
  PLANNING: { label: "Lập kế hoạch", tagColor: "geekblue" },
  IN_PROGRESS: { label: "Đang thực hiện", tagColor: "blue" },
  ON_HOLD: { label: "Tạm dừng", tagColor: "orange" },
  COMPLETED: { label: "Hoàn thành", tagColor: "green" },
  CANCELLED: { label: "Đã hủy", tagColor: "red" },
};

const PRIORITY_META = {
  LOW: { label: "Thấp", color: "default" },
  MEDIUM: { label: "Trung bình", color: "blue" },
  HIGH: { label: "Cao", color: "orange" },
  URGENT: { label: "Khẩn cấp", color: "red" },
};

const HEALTH_META = {
  GOOD: { label: "Ổn định", badge: "success" },
  WATCH: { label: "Cần theo dõi", badge: "warning" },
  RISK: { label: "Nguy cơ", badge: "error" },
};

const projectStatusOptions = [
  { value: "", label: "Trạng thái (tất cả)" },
  { value: "PLANNING", label: "Lập kế hoạch" },
  { value: "IN_PROGRESS", label: "Đang thực hiện" },
  { value: "ON_HOLD", label: "Tạm dừng" },
  { value: "COMPLETED", label: "Hoàn thành" },
  { value: "CANCELLED", label: "Đã hủy" },
];

const priorityOptions = [
  { value: "", label: "Độ ưu tiên (tất cả)" },
  { value: "LOW", label: "Thấp" },
  { value: "MEDIUM", label: "Trung bình" },
  { value: "HIGH", label: "Cao" },
  { value: "URGENT", label: "Khẩn cấp" },
];

const healthStatusOptions = [
  { value: "", label: "Sức khỏe (tất cả)" },
  { value: "GOOD", label: "Ổn định" },
  { value: "WATCH", label: "Cần theo dõi" },
  { value: "RISK", label: "Nguy cơ" },
];

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((chunk) => chunk.charAt(0).toUpperCase())
    .join("");

const normalizeTeamMembers = (members = [], fallbackColorSeed = 0) => {
  const normalized = members
    .map((member) => {
      if (typeof member === "string") {
        return { name: member, initials: getInitials(member) };
      }
      if (member?.name) {
        return {
          ...member,
          initials: member.initials || getInitials(member.name),
        };
      }
      if (member?.fullName) {
        return {
          name: member.fullName,
          initials: getInitials(member.fullName),
        };
      }
      return null;
    })
    .filter(Boolean);

  return normalized.map((member, index) => ({
    ...member,
    color: member.color || TEAM_COLORS[(fallbackColorSeed + index) % TEAM_COLORS.length],
  }));
};

const deriveHealthStatus = (project) => {
  if (project.healthStatus) return project.healthStatus;
  const progress = project.progress || 0;
  if (["CANCELLED", "ON_HOLD"].includes(project.status) && progress < 50) {
    return "RISK";
  }
  if (progress >= 70) return "GOOD";
  if (progress >= 40) return "WATCH";
  return "RISK";
};

const enhanceProjectData = (project, index = 0) => {
  const progress = typeof project.progress === "number" ? project.progress : 0;
  const totalTasks = project.totalTasks ?? Math.max(10, Math.round(progress * 0.8) + 10);
  const completedTasks =
    project.completedTasks ?? Math.min(totalTasks, Math.round((progress / 100) * totalTasks));
  const openIssues = project.openIssues ?? Math.max(0, Math.round((100 - progress) / 12));
  
  // Ưu tiên sử dụng members từ API, sau đó mới fallback về các nguồn khác
  let membersToUse = [];
  
  if (project.teamMembers && project.teamMembers.length) {
    // Nếu đã có teamMembers (từ nguồn khác)
    membersToUse = project.teamMembers;
  } else if (project.members && project.members.length) {
    // Nếu có members từ API workflow (đã map ở fetchProjects)
    // Members đã được xử lý ở fetchProjects, bao gồm cả projectManager chính
    membersToUse = project.members;
  } else if (project.projectManager) {
    // Fallback về projectManager nếu không có members
    membersToUse = [{ name: project.projectManager, role: "PRIMARY_MANAGER", isPrimary: true }];
  }
  
  const teamMembers = normalizeTeamMembers(membersToUse, index);

  return {
    ...project,
    progress,
    totalTasks,
    completedTasks,
    openIssues,
    overdueTasks: project.overdueTasks ?? Math.max(0, Math.round((100 - progress) / 20)),
    departmentName: project.departmentName || project.department || "Chưa cập nhật",
    clientName: project.clientName || project.customerName || "N/A",
    budgetUsed: project.budgetUsed || project.actualBudget || 0,
    lastUpdated: project.lastUpdated || project.updatedAt || project.endDate || project.startDate,
    healthStatus: deriveHealthStatus(project),
    teamMembers,
  };
};

const isProjectOverdue = (project) => {
  if (!project?.endDate) return false;
  const end = dayjs(project.endDate);
  return end.isBefore(dayjs(), "day") && !["COMPLETED", "CANCELLED"].includes(project.status);
};

const ProjectList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { projectsList, loading, pagination, filters } = useSelector((state) => state.projects);

  // Detect if we're in workflow context
  const isInWorkflow = location.pathname.includes('/workflow');

  const [totalResults, setTotalResults] = useState(0);
  const [openModalType, setOpenModalType] = useState("Add");
  const [currentRecord, setCurrentRecord] = useState(null);
  const [openModalAddProjectState, setOpenModalAddProjectState] = useState(false);
  const [isOpenModalDeleteProject, setIsOpenModalDeleteProject] = useState(false);
  const [currentItemSelected, setCurrentItemSelected] = useState({});
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [viewMode, setViewMode] = useState("table");
  const [summaryData, setSummaryData] = useState(null);
  const hasFetchedRef = useRef(false);

  const getProjectId = useCallback((record) => {
    if (!record) return null;
    return (
      record.id ||
      record.projectId ||
      record.projectID ||
      record.ProjectId ||
      record.ProjectID ||
      record.code ||
      record.projectCode ||
      null
    );
  }, []);

  const navigateToProject = useCallback(
    (projectId, tabKey) => {
      if (!projectId) {
        notification.warning({
          message: "Thiếu mã dự án",
          description: "Không xác định được dự án để điều hướng.",
        });
        return;
      }
      // If we're in workflow context, add /workflow prefix to keep navigation within workflow module
      const basePath = isInWorkflow 
        ? `/workflow/project-management/project/${projectId}`
        : `/project-management/project/${projectId}`;
      navigate(basePath, tabKey ? { state: { activeTab: tabKey } } : undefined);
    },
    [navigate, isInWorkflow]
  );

  const normalizedProjects = useMemo(() => {
    // Chỉ dùng dữ liệu từ API, không fallback về fake data
    const sourceProjects = Array.isArray(projectsList) ? projectsList : [];
    return sourceProjects.map((project, index) => enhanceProjectData(project, index));
  }, [projectsList]);

  // "Dự án đang theo dõi" phải là TỔNG TẤT CẢ projects (không phụ thuộc filter)
  // Nên dùng TotalProjects từ summary API thay vì totalResults từ list API (đã filter)
  const totalDisplay = (summaryData && isInWorkflow) 
    ? (summaryData.TotalProjects || summaryData.totalProjects || totalResults || normalizedProjects.length)
    : (totalResults || normalizedProjects.length);

  const projectManagersOptions = useMemo(() => {
    const managers = Array.from(
      new Set(normalizedProjects.map((project) => project.projectManager).filter(Boolean))
    );
    return managers.map((manager) => ({ value: manager, label: manager }));
  }, [normalizedProjects]);

  // Fetch summary data từ API
  const fetchSummary = useCallback(async () => {
    if (!isInWorkflow) return; // Chỉ fetch khi ở workflow context
    
    try {
      const summaryResponse = await getWorkflowProjectSummary({
        companyCode: "DVCS01",
      });
      
      console.log("[ProjectList] Summary API Response:", summaryResponse);
      
      // Xử lý response có thể là array hoặc object
      let summary = null;
      if (Array.isArray(summaryResponse) && summaryResponse.length > 0) {
        summary = summaryResponse[0];
      } else if (summaryResponse && typeof summaryResponse === 'object') {
        summary = summaryResponse;
      }
      
      if (summary) {
        setSummaryData(summary);
        
        // Debug: Kiểm tra xem tổng các status có khớp với TotalProjects không
        const sumStatus = (summary.PlanningProjects || 0) + 
                         (summary.ActiveProjects || 0) + 
                         (summary.InProgressProjects || 0) + 
                         (summary.CompletedProjects || 0) + 
                         (summary.OnHoldProjects || 0) + 
                         (summary.PausedProjects || 0) + 
                         (summary.CancelledProjects || 0) +
                         (summary.OtherStatusProjects || 0);
        const totalProjects = summary.TotalProjects || summary.totalProjects || 0;
        
        if (sumStatus !== totalProjects) {
          console.warn(`[ProjectList] Status sum mismatch! TotalProjects: ${totalProjects}, Sum of statuses: ${sumStatus}, Difference: ${totalProjects - sumStatus}`);
        }
        
        if (summary.OtherStatusProjects > 0) {
          console.warn(`[ProjectList] Found ${summary.OtherStatusProjects} projects with other/unknown status!`);
        }
      }
    } catch (error) {
      console.error("[ProjectList] Error fetching summary:", error);
      // Không hiển thị error notification để tránh spam, chỉ log
    }
  }, [isInWorkflow]);

  const statusChipData = useMemo(
    () => {
      // LUÔN sử dụng summary data từ API (tổng hợp tất cả projects) để không bị ảnh hưởng bởi filter
      if (summaryData && isInWorkflow) {
        // Map status từ API sang status trong component
        // API: PLANNING -> PLANNING, ACTIVE/IN_PROGRESS -> IN_PROGRESS, ON_HOLD/PAUSED -> PAUSED
        return Object.keys(STATUS_META).map((statusKey) => {
          let count = 0;
          let overdue = 0;
          
          switch (statusKey) {
            case 'PLANNING':
              // PlanningProjects từ API
              count = summaryData.PlanningProjects || summaryData.planningProjects || 0;
              // Overdue riêng cho Planning
              overdue = summaryData.OverduePlanningProjects || summaryData.overduePlanningProjects || 0;
              break;
            case 'IN_PROGRESS':
              // Map từ ActiveProjects hoặc InProgressProjects trong API
              count = (summaryData.ActiveProjects || summaryData.activeProjects || 0) + 
                      (summaryData.InProgressProjects || summaryData.inProgressProjects || 0);
              // Overdue riêng cho Active/InProgress
              overdue = (summaryData.OverdueActiveProjects || summaryData.overdueActiveProjects || 0) +
                        (summaryData.OverdueInProgressProjects || summaryData.overdueInProgressProjects || 0);
              break;
            case 'PAUSED':
              // Map từ OnHoldProjects hoặc PausedProjects trong API
              count = (summaryData.OnHoldProjects || summaryData.onHoldProjects || 0) +
                      (summaryData.PausedProjects || summaryData.pausedProjects || 0);
              overdue = 0; // Paused projects không tính overdue
              break;
            case 'COMPLETED':
              // Map từ CompletedProjects trong API
              count = summaryData.CompletedProjects || summaryData.completedProjects || 0;
              overdue = 0; // Completed projects không tính overdue
              break;
            case 'CANCELLED':
              // Map từ CancelledProjects trong API
              count = summaryData.CancelledProjects || summaryData.cancelledProjects || 0;
              overdue = 0; // Cancelled projects không tính overdue
              break;
            default:
              count = 0;
              overdue = 0;
          }
          
          return {
            key: statusKey,
            label: STATUS_META[statusKey].label,
            color: STATUS_META[statusKey].tagColor,
            count: count,
            overdue: overdue,
          };
        });
      }
      
      // Fallback: tính từ normalizedProjects nếu không có summary data (chỉ khi không ở workflow context)
      return Object.keys(STATUS_META).map((statusKey) => {
        const projects = normalizedProjects.filter((project) => project.status === statusKey);
        return {
          key: statusKey,
          label: STATUS_META[statusKey].label,
          color: STATUS_META[statusKey].tagColor,
          count: projects.length,
          overdue: projects.filter(isProjectOverdue).length,
        };
      });
    },
    [summaryData, isInWorkflow, normalizedProjects]  // normalizedProjects chỉ dùng khi fallback
  );

  const insights = useMemo(() => {
    // Nếu có summary data, sử dụng summary data
    if (summaryData && isInWorkflow) {
      const totalBudget = summaryData.TotalBudget || summaryData.totalBudget || 0;
      const utilizedBudget = summaryData.TotalBudgetUsed || summaryData.totalBudgetUsed || 0;
      const averageProgress = Math.round(summaryData.AvgProgress || summaryData.avgProgress || 0);
      // Tính tổng dự án đang chạy (ACTIVE + IN_PROGRESS)
      const activeProjects = (summaryData.ActiveProjects || summaryData.activeProjects || 0) + 
                            (summaryData.InProgressProjects || summaryData.inProgressProjects || 0);
      // Tính tổng overdue cho dự án đang chạy
      const overdueProjects = (summaryData.OverdueActiveProjects || summaryData.overdueActiveProjects || 0) +
                             (summaryData.OverdueInProgressProjects || summaryData.overdueInProgressProjects || 0);
      const riskProjects = (summaryData.CriticalHealthProjects || summaryData.criticalHealthProjects || 0) + 
                          (summaryData.WarningHealthProjects || summaryData.warningHealthProjects || 0);
      
      // Khách hàng phục vụ vẫn tính từ normalizedProjects vì API summary không có
      const uniqueClients = Array.from(new Set(normalizedProjects.map((project) => project.clientName).filter(Boolean))).length;
      
      return [
        {
          title: "Dự án đang chạy",
          value: activeProjects,
          suffix: "dự án",
          subtext: `${overdueProjects} quá hạn`,
        },
        {
          title: "Ngân sách đã cam kết",
          value: utilizedBudget,
          formatter: (value) => `${value.toLocaleString("vi-VN")}₫`,
          subtext: `Tổng kế hoạch ${totalBudget.toLocaleString("vi-VN")}₫`,
        },
        {
          title: "Tiến độ trung bình",
          value: averageProgress,
          suffix: "%",
          subtext: `${riskProjects} dự án rủi ro`,
        },
        {
          title: "Khách hàng phục vụ",
          value: uniqueClients,
          suffix: "khách hàng",
          subtext: "Top khách hàng vừa cập nhật",
        },
      ];
    }
    
    // Fallback: tính từ normalizedProjects nếu không có summary data
    const totalBudget = normalizedProjects.reduce(
      (sum, project) => sum + (project.budget || 0),
      0
    );
    const utilizedBudget = normalizedProjects.reduce(
      (sum, project) => sum + (project.budgetUsed || 0),
      0
    );
    const averageProgress =
      normalizedProjects.length > 0
        ? Math.round(
            normalizedProjects.reduce((sum, project) => sum + (project.progress || 0), 0) /
              normalizedProjects.length
          )
        : 0;

    return [
      {
        title: "Dự án đang chạy",
        value: normalizedProjects.filter((project) => project.status === "IN_PROGRESS").length,
        suffix: "dự án",
        subtext: `${statusChipData.find((item) => item.key === "IN_PROGRESS")?.overdue || 0} quá hạn`,
      },
      {
        title: "Ngân sách đã cam kết",
        value: utilizedBudget,
        formatter: (value) => `${value.toLocaleString("vi-VN")}₫`,
        subtext: `Tổng kế hoạch ${totalBudget.toLocaleString("vi-VN")}₫`,
      },
      {
        title: "Tiến độ trung bình",
        value: averageProgress,
        suffix: "%",
        subtext: `${normalizedProjects.filter((project) => project.healthStatus === "RISK").length} dự án rủi ro`,
      },
      {
        title: "Khách hàng phục vụ",
        value: Array.from(new Set(normalizedProjects.map((project) => project.clientName))).length,
        suffix: "khách hàng",
        subtext: "Top khách hàng vừa cập nhật",
      },
    ];
  }, [normalizedProjects, statusChipData, summaryData, isInWorkflow]);

  const boardColumns = useMemo(
    () => {
      // Tạo columns từ STATUS_META
      const columns = Object.keys(STATUS_META).map((statusKey) => ({
        key: statusKey,
        ...STATUS_META[statusKey],
        projects: normalizedProjects.filter((project) => {
          // Xử lý trường hợp status rỗng hoặc không khớp
          const projectStatus = project.status || "";
          return projectStatus === statusKey || (statusKey === "PLANNING" && !projectStatus);
        }),
      }));
      
      // Xử lý các dự án không có status - đưa vào PLANNING
      const projectsWithoutStatus = normalizedProjects.filter((project) => {
        const projectStatus = project.status || "";
        return !projectStatus || !STATUS_META[projectStatus];
      });
      
      if (projectsWithoutStatus.length > 0) {
        const planningColumn = columns.find(col => col.key === "PLANNING");
        if (planningColumn) {
          planningColumn.projects = [...planningColumn.projects, ...projectsWithoutStatus];
        }
      }
      
      return columns;
    },
    [normalizedProjects]
  );

  const dateRangeValue = useMemo(() => {
    const start = filters.startDate ? dayjs(filters.startDate) : null;
    const end = filters.endDate ? dayjs(filters.endDate) : null;
    if (!start && !end) return undefined;
    return [start, end];
  }, [filters.startDate, filters.endDate]);

  const fetchProjects = useCallback(
    async (paginationData, filterData) => {
      try {
        dispatch(setLoading(true));
        
        // Nếu đang ở trong workflow context, gọi API workflow
        if (isInWorkflow) {
          const workflowParams = {
            companyCode: "DVCS01",
            pageIndex: paginationData.pageindex || paginationData.current || 1,
            pageSize: paginationData.pageSize || 20,
          };

          // Thêm các filter nếu có
          if (filterData.searchKey) {
            workflowParams.searchKey = filterData.searchKey;
          }
          if (filterData.status) {
            workflowParams.status = filterData.status;
          }
          if (filterData.priority) {
            workflowParams.priority = filterData.priority;
          }
          if (filterData.orgUnitId) {
            workflowParams.orgUnitId = filterData.orgUnitId;
          }

          const workflowResponse = await getWorkflowProjectsList(workflowParams);
          
          console.log("[ProjectList] API Response:", workflowResponse);
          
          // Xử lý response có thể là array hoặc object với data và totalCount
          let projectsData = [];
          let totalCount = 0;
          
          if (Array.isArray(workflowResponse)) {
            // Nếu là array, có thể là result set đầu tiên (danh sách projects)
            projectsData = workflowResponse;
            // Nếu có result set thứ 2 (TotalCount), backend sẽ trả về trong response khác
            // Tạm thời dùng length, sẽ sửa sau khi backend trả về đúng format
            totalCount = workflowResponse.length;
          } else if (workflowResponse && typeof workflowResponse === 'object') {
            // Nếu là object, có thể có structure: { data: [...], totalCount: ... } hoặc { items: [...], totalCount: ... }
            projectsData = workflowResponse.data || workflowResponse.items || workflowResponse.list || [];
            totalCount = workflowResponse.totalCount || workflowResponse.total || projectsData.length;
          }
          
          // Map dữ liệu từ API workflow sang format component đang dùng
          const mappedItems = Array.isArray(projectsData) ? projectsData.map((item) => {
            const memberCount = item.MemberCount || item.memberCount || 0;
            const projectManager = item.ProjectManagerName || item.projectManagerName || "";
            
            // Tạo danh sách members từ các field có thể có trong API response
            let members = [];
            
            // Nếu API trả về danh sách members (Members, MembersList, MembersJson, etc.)
            if (item.Members && Array.isArray(item.Members)) {
              members = item.Members.map(m => ({
                name: m.UserName || m.userName || m.FullName || m.fullName || m.Name || m.name || "",
                role: m.Role || m.role || "",
                email: m.Email || m.email || "",
              }));
            } else if (item.MembersList && Array.isArray(item.MembersList)) {
              members = item.MembersList.map(m => ({
                name: m.UserName || m.userName || m.FullName || m.fullName || m.Name || m.name || "",
                role: m.Role || m.role || "",
                email: m.Email || m.email || "",
              }));
            } else if (item.MembersJson) {
              // Nếu là JSON string, parse nó
              try {
                const parsed = typeof item.MembersJson === 'string' 
                  ? JSON.parse(item.MembersJson) 
                  : item.MembersJson;
                if (Array.isArray(parsed)) {
                  members = parsed.map(m => ({
                    name: m.UserName || m.userName || m.FullName || m.fullName || m.Name || m.name || "",
                    role: m.Role || m.role || "",
                    email: m.Email || m.email || "",
                  }));
                }
              } catch (e) {
                console.warn("Failed to parse MembersJson:", e);
              }
            }
            
            // Nếu không có members từ API nhưng có memberCount > 0 và có projectManager
            // Thì ít nhất thêm projectManager vào danh sách (với role PRIMARY_MANAGER để phân biệt)
            if (members.length === 0 && memberCount > 0 && projectManager) {
              members = [{ name: projectManager, role: "PRIMARY_MANAGER" }];
            } else if (members.length > 0 && projectManager) {
              // Nếu đã có members từ API, kiểm tra xem projectManager chính đã có trong danh sách chưa
              const hasPrimaryManager = members.some(m => 
                (m.name || "").toLowerCase() === projectManager.toLowerCase() ||
                (m.UserName || "").toLowerCase() === projectManager.toLowerCase() ||
                (m.FullName || "").toLowerCase() === projectManager.toLowerCase()
              );
              
              // Nếu projectManager chính chưa có trong danh sách members, thêm vào đầu danh sách
              if (!hasPrimaryManager) {
                members.unshift({ name: projectManager, role: "PRIMARY_MANAGER" });
              } else {
                // Nếu đã có, đánh dấu là PRIMARY_MANAGER
                const managerIndex = members.findIndex(m => 
                  (m.name || "").toLowerCase() === projectManager.toLowerCase() ||
                  (m.UserName || "").toLowerCase() === projectManager.toLowerCase() ||
                  (m.FullName || "").toLowerCase() === projectManager.toLowerCase()
                );
                if (managerIndex >= 0) {
                  members[managerIndex].role = "PRIMARY_MANAGER";
                  members[managerIndex].isPrimary = true;
                }
              }
            }
            
            return {
              id: item.Id || item.id,
              projectCode: item.ProjectCode || item.projectCode,
              projectName: item.ProjectName || item.projectName || "",
              status: item.Status || item.status || "",
              priority: item.Priority || item.priority || "",
              healthStatus: item.HealthStatus || item.healthStatus || "",
              progress: item.Progress || item.progress || 0,
              startDate: item.StartDate || item.startDate,
              endDate: item.EndDate || item.endDate,
              budget: item.Budget || item.budget || 0,
              budgetUsed: item.BudgetUsed || item.budgetUsed || 0,
              clientName: item.ClientName || item.clientName || "",
              projectManagerId: item.ProjectManagerId || item.projectManagerId,
              projectManager: projectManager,
              projectManagerEmail: item.ProjectManagerEmail || item.projectManagerEmail || "",
              orgUnitId: item.OrgUnitId || item.orgUnitId,
              orgUnitName: item.OrgUnitName || item.orgUnitName || "",
              departmentName: item.OrgUnitName || item.orgUnitName || "Chưa cập nhật", // Map từ OrgUnitName
              createdDate: item.CreatedDate || item.createdDate,
              updatedDate: item.UpdatedDate || item.updatedDate,
              lastUpdated: item.UpdatedDate || item.CreatedDate || item.createdDate || item.startDate, // Map từ UpdatedDate hoặc CreatedDate
              memberCount: memberCount,
              members: members, // Thêm field members để enhanceProjectData có thể sử dụng
              taskCount: item.TaskCount || item.taskCount || 0,
              totalTasks: item.TaskCount || item.taskCount || 0, // Map cho kanban view
              completedTasks: 0, // API chưa trả về, để mặc định 0
              description: item.Description || item.description || "",
            };
          }) : [];

          // Chỉ hiển thị dữ liệu từ API, không fallback về fake data
          dispatch(setProjectsList(mappedItems));
          // Sử dụng TotalCount từ API thay vì mappedItems.length
          setTotalResults(totalCount);
          dispatch(
            setPagination({
              ...paginationData,
              total: totalCount,
            })
          );
          
          console.log("[ProjectList] Mapped items:", mappedItems.length, "Total count:", totalCount);
          
          // Fetch summary data sau khi load projects
          fetchSummary();
        } else {
          // Gọi API cũ nếu không ở trong workflow context
          const response = await apiGetProjects({
            pageindex: paginationData.pageindex,
            pageSize: paginationData.pageSize,
            searchKey: filterData.searchKey,
            status: filterData.status,
            priority: filterData.priority,
            healthStatus: filterData.healthStatus,
            startDate: filterData.startDate,
            endDate: filterData.endDate,
            projectManager: filterData.projectManager,
          });

          if (response.status === 200) {
            const items = response.data.items || [];
            // Chỉ hiển thị dữ liệu từ API, không fallback về fake data
            dispatch(setProjectsList(items));
            setTotalResults(response.data.totalCount || items.length);
            dispatch(
              setPagination({
                ...paginationData,
                total: response.data.totalCount || items.length,
              })
            );
          } else {
            dispatch(setError("Có lỗi xảy ra khi tải dữ liệu"));
            notification.error({
              message: "Lỗi",
              description: "Có lỗi xảy ra khi tải dữ liệu dự án",
            });
            // Set empty array khi có lỗi
            dispatch(setProjectsList([]));
            setTotalResults(0);
          }
        }
      } catch (error) {
        dispatch(setError(error.message));
        notification.error({
          message: "Lỗi",
          description: "Có lỗi xảy ra khi tải dữ liệu dự án",
        });
        // Set empty array khi có lỗi
        dispatch(setProjectsList([]));
        setTotalResults(0);
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch, isInWorkflow, fetchSummary]
  );

  const refreshData = useCallback(() => {
    const newPagination = { ...pagination, pageindex: 1, current: 1 };
    dispatch(setPagination(newPagination));
    fetchProjects(newPagination, filters);
  }, [dispatch, fetchProjects, filters, pagination]);

  const handleViewDetail = useCallback(
    (record) => {
      const projectId = getProjectId(record);
      navigateToProject(projectId);
    },
    [getProjectId, navigateToProject]
  );

  const handleViewDocuments = useCallback(
    (record) => {
      const projectId = getProjectId(record);
      navigateToProject(projectId, "documents");
    },
    [getProjectId, navigateToProject]
  );

  const handleViewResources = useCallback(
    (record) => {
      const projectId = getProjectId(record);
      navigateToProject(projectId, "resources");
    },
    [getProjectId, navigateToProject]
  );

  const handleOpenDeleteDialog = useCallback((record) => {
    setCurrentItemSelected(record);
    setIsOpenModalDeleteProject(true);
  }, []);

  const handleDeleteProject = useCallback(async () => {
    try {
      if (isInWorkflow) {
        // Sử dụng API workflow để xóa dự án
        await deleteWorkflowProject({
          projectId: currentItemSelected.id || currentItemSelected.projectId,
          companyCode: "DVCS01",
          deletedBy: 1, // TODO: Lấy từ userInfo
        });

        notification.success({
          message: "Thành công",
          description: "Xóa dự án thành công",
        });
        refreshData();
      } else {
        // Sử dụng API cũ
        const response = await apiDeleteProject({
          id: currentItemSelected.id,
          action: "DELETE",
        });

        if (response.status === 200 && response.data === true) {
          notification.success({
            message: "Thành công",
            description: "Xóa dự án thành công",
          });
          refreshData();
        } else {
          notification.error({
            message: "Lỗi",
            description: "Có lỗi xảy ra khi xóa dự án",
          });
        }
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      
      // Kiểm tra response error từ API
      const errorResponse = error?.response?.data;
      if (Array.isArray(errorResponse) && errorResponse.length > 0) {
        const errorItem = errorResponse[0];
        notification.warning({
          message: "Thông báo",
          description: errorItem.message || "Không thể xóa dự án",
        });
      } else {
        notification.error({
          message: "Lỗi",
          description: error?.response?.data?.message || "Có lỗi xảy ra khi xóa dự án",
        });
      }
    } finally {
      setIsOpenModalDeleteProject(false);
      setCurrentItemSelected({});
    }
  }, [currentItemSelected, refreshData, isInWorkflow]);

  const handleTableChange = useCallback(
    (tablePagination) => {
      const newPagination = {
        pageindex: tablePagination.current,
        pageSize: tablePagination.pageSize,
        total: tablePagination.total,
      };
      dispatch(setPagination(newPagination));
      fetchProjects(newPagination, filters);
    },
    [dispatch, fetchProjects, filters]
  );

  const handleSearch = useCallback(
    (value) => {
      const newFilters = { ...filters, searchKey: value };
      dispatch(setFilters(newFilters));
      const newPagination = { ...pagination, pageindex: 1, current: 1 };
      dispatch(setPagination(newPagination));
      fetchProjects(newPagination, newFilters);
    },
    [dispatch, fetchProjects, filters, pagination]
  );

  const handleStatusChange = useCallback(
    (value) => {
      const newFilters = { ...filters, status: value || "" };
      dispatch(setFilters(newFilters));
      const newPagination = { ...pagination, pageindex: 1, current: 1 };
      dispatch(setPagination(newPagination));
      fetchProjects(newPagination, newFilters);
    },
    [dispatch, fetchProjects, filters, pagination]
  );

  const handlePriorityChange = useCallback(
    (value) => {
      const newFilters = { ...filters, priority: value || "" };
      dispatch(setFilters(newFilters));
      const newPagination = { ...pagination, pageindex: 1, current: 1 };
      dispatch(setPagination(newPagination));
      fetchProjects(newPagination, newFilters);
    },
    [dispatch, fetchProjects, filters, pagination]
  );

  const handleHealthChange = useCallback(
    (value) => {
      const newFilters = { ...filters, healthStatus: value || "" };
      dispatch(setFilters(newFilters));
      const newPagination = { ...pagination, pageindex: 1, current: 1 };
      dispatch(setPagination(newPagination));
      fetchProjects(newPagination, newFilters);
    },
    [dispatch, fetchProjects, filters, pagination]
  );

  const handleManagerChange = useCallback(
    (value) => {
      const newFilters = { ...filters, projectManager: value || "" };
      dispatch(setFilters(newFilters));
      const newPagination = { ...pagination, pageindex: 1, current: 1 };
      dispatch(setPagination(newPagination));
      fetchProjects(newPagination, newFilters);
    },
    [dispatch, fetchProjects, filters, pagination]
  );

  const handleResetFilters = useCallback(() => {
    const reset = {
      searchKey: "",
      status: "",
      priority: "",
      healthStatus: "",
      startDate: null,
      endDate: null,
      projectManager: "",
    };
    dispatch(setFilters(reset));
    const newPagination = { ...pagination, pageindex: 1, current: 1 };
    dispatch(setPagination(newPagination));
    fetchProjects(newPagination, reset);
  }, [dispatch, fetchProjects, pagination]);

  const handleDateRangeChange = useCallback(
    (dates) => {
      const newFilters = {
        ...filters,
        startDate: dates ? dates[0].format("YYYY-MM-DD") : null,
        endDate: dates ? dates[1].format("YYYY-MM-DD") : null,
      };
      dispatch(setFilters(newFilters));
      const newPagination = { ...pagination, pageindex: 1, current: 1 };
      dispatch(setPagination(newPagination));
      fetchProjects(newPagination, newFilters);
    },
    [dispatch, fetchProjects, filters, pagination]
  );

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchProjects(pagination, filters);
    // Fetch summary khi component mount
    if (isInWorkflow) {
      fetchSummary();
    }
  }, [fetchProjects, fetchSummary, isInWorkflow, filters, pagination]);

  const viewModeOptions = useMemo(
    () => [
      {
        label: (
          <span className="segmented-option">
            <UnorderedListOutlined /> Bảng
          </span>
        ),
        value: "table",
      },
      {
        label: (
          <span className="segmented-option">
            <AppstoreOutlined /> Kanban
          </span>
        ),
        value: "board",
      },
    ],
    []
  );

  const tableColumns = useMemo(
    () => [
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
        title: "Mã dự án",
        dataIndex: "projectCode",
        key: "projectCode",
        width: 180,
        fixed: "left",
        sorter: true,
        ellipsis: true,
        render: (text, record) => (
          <a
            onClick={() => handleViewDetail(record)}
            style={{ color: "#1890ff", cursor: "pointer", whiteSpace: "nowrap" }}
          >
            {text}
          </a>
        ),
      },
      {
        title: "Tên dự án",
        dataIndex: "projectName",
        key: "projectName",
        width: 250,
        fixed: "left",
        ellipsis: true,
        render: (text) => <span style={{ whiteSpace: "nowrap" }}>{text}</span>,
      },
      {
        title: "Khách hàng",
        dataIndex: "clientName",
        key: "clientName",
        width: 180,
        ellipsis: true,
        render: (value) => <span style={{ whiteSpace: "nowrap" }}>{value || "N/A"}</span>,
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        width: 140,
        ellipsis: true,
        render: (status) => {
          const meta = STATUS_META[status] || {};
          return <Tag color={meta.tagColor || "default"} style={{ whiteSpace: "nowrap" }}>{meta.label || status}</Tag>;
        },
      },
      {
        title: "Độ ưu tiên",
        dataIndex: "priority",
        key: "priority",
        width: 130,
        ellipsis: true,
        render: (priority) => {
          const meta = PRIORITY_META[priority] || {};
          return <Tag color={meta.color || "default"} style={{ whiteSpace: "nowrap" }}>{meta.label || priority || "N/A"}</Tag>;
        },
      },
      {
        title: "Sức khỏe",
        dataIndex: "healthStatus",
        key: "healthStatus",
        width: 150,
        ellipsis: true,
        render: (health) => {
          const meta = HEALTH_META[health] || { label: "Chưa cập nhật", badge: "default" };
          return <Badge status={meta.badge} text={meta.label} />;
        },
      },
      {
        title: "Quản lý dự án",
        dataIndex: "projectManager",
        key: "projectManager",
        width: 180,
        ellipsis: true,
        render: (value) => <span style={{ whiteSpace: "nowrap" }}>{value || "--"}</span>,
      },
      {
        title: "Phòng ban",
        dataIndex: "departmentName",
        key: "departmentName",
        width: 170,
        ellipsis: true,
        render: (value) => <span style={{ whiteSpace: "nowrap" }}>{value || "Chưa cập nhật"}</span>,
      },
      {
        title: "Ngày bắt đầu",
        dataIndex: "startDate",
        key: "startDate",
        width: 130,
        ellipsis: true,
        render: (date) => <span style={{ whiteSpace: "nowrap" }}>{(date ? dayjs(date).format("DD/MM/YYYY") : "")}</span>,
      },
      {
        title: "Ngày kết thúc",
        dataIndex: "endDate",
        key: "endDate",
        width: 130,
        ellipsis: true,
        render: (date) => <span style={{ whiteSpace: "nowrap" }}>{(date ? dayjs(date).format("DD/MM/YYYY") : "")}</span>,
      },
      {
        title: "Tiến độ",
        dataIndex: "progress",
        key: "progress",
        width: 200,
        render: (progress, record) => (
          <div className="project-progress-cell">
            <Progress
              percent={Math.round(progress || 0)}
              size="small"
              status={
                record.healthStatus === "RISK"
                  ? "exception"
                  : record.healthStatus === "WATCH"
                  ? "active"
                  : "normal"
              }
            />
            <span className="project-progress-meta">
              {record.completedTasks || 0}/{record.totalTasks || 0} công việc
            </span>
          </div>
        ),
      },
      {
        title: "Ngân sách",
        dataIndex: "budget",
        key: "budget",
        width: 180,
        ellipsis: true,
        render: (budget, record) => (
          <span style={{ whiteSpace: "nowrap" }}>
            {budget
              ? `${budget.toLocaleString("vi-VN")}₫`
              : record.budgetUsed
              ? `${record.budgetUsed.toLocaleString("vi-VN")}₫`
              : "N/A"}
          </span>
        ),
      },
      {
        title: "Cập nhật",
        dataIndex: "lastUpdated",
        key: "lastUpdated",
        width: 130,
        ellipsis: true,
        render: (date) => <span style={{ whiteSpace: "nowrap" }}>{(date ? dayjs(date).format("DD/MM/YYYY") : "--")}</span>,
      },
      {
        title: "Nhóm dự án",
        dataIndex: "teamMembers",
        key: "teamMembers",
        width: 200,
        ellipsis: true,
        render: (teamMembers = [], record) => {
          const memberCount = record.memberCount || 0;
          const displayedCount = teamMembers.length;
          const remainingCount = memberCount > displayedCount ? memberCount - displayedCount : 0;
          
          if (teamMembers.length > 0) {
            return (
              <Space size="small" wrap>
                <Avatar.Group maxCount={4}>
                  {teamMembers.map((member, index) => {
                    const isPrimary = member.isPrimary || member.role === "PRIMARY_MANAGER";
                    const tooltipTitle = isPrimary 
                      ? `${member.name} (Quản lý chính)`
                      : `${member.name}${member.role ? ` - ${member.role}` : ""}`;
                    
                    return (
                      <Tooltip title={tooltipTitle} key={`${record.id}-${member.name}-${index}`}>
                        <Avatar 
                          style={{ 
                            backgroundColor: member.color || TEAM_COLORS[index % TEAM_COLORS.length],
                            border: isPrimary ? "2px solid #1890ff" : "none"
                          }}
                        >
                          {member.initials || getInitials(member.name)}
                        </Avatar>
                      </Tooltip>
                    );
                  })}
                </Avatar.Group>
                {remainingCount > 0 && (
                  <Tooltip title={`Còn ${remainingCount} thành viên khác`}>
                    <Tag color="default">+{remainingCount}</Tag>
                  </Tooltip>
                )}
              </Space>
            );
          } else if (record.projectManager) {
            return (
              <Space size="small">
                <Tooltip title="Quản lý chính">
                  <Tag color="blue">{record.projectManager}</Tag>
                </Tooltip>
                {memberCount > 1 && (
                  <Tooltip title={`Còn ${memberCount - 1} thành viên khác`}>
                    <Tag color="default">+{memberCount - 1}</Tag>
                  </Tooltip>
                )}
              </Space>
            );
          } else {
            return "--";
          }
        },
      },
      {
        title: "Thao tác",
        key: "action",
        width: 180,
        align: "center",
        ellipsis: true,
        render: (_, record) => (
          <Space size="small">
            <Tooltip title="Tài liệu">
              <Button type="link" icon={<FileTextOutlined />} onClick={() => handleViewDocuments(record)} />
            </Tooltip>
            <Tooltip title="Nguồn lực">
              <Button type="link" icon={<TeamOutlined />} onClick={() => handleViewResources(record)} />
            </Tooltip>
            <Tooltip title="Xóa">
              <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleOpenDeleteDialog(record)} />
            </Tooltip>
          </Space>
        ),
      },
    ],
    [handleOpenDeleteDialog, handleViewDetail, handleViewDocuments, handleViewResources, pagination]
  );

  const renderBoardCard = useCallback(
    (project) => {
      if (!project || !project.id) return null;
      
      return (
        <Card key={project.id} size="small" className="project-board-card">
          <div className="project-board-card__header">
            <Tag color="#e2e8f0">{project.projectCode || "N/A"}</Tag>
            <Tag color={PRIORITY_META[project.priority]?.color || "default"}>
              {PRIORITY_META[project.priority]?.label || project.priority || "N/A"}
            </Tag>
          </div>
          <div className="project-board-card__title">{project.projectName || "Chưa có tên"}</div>
          <div className="project-board-card__meta">
            <span>
              <TeamOutlined /> {project.projectManager || "Chưa phân công"}
            </span>
            <span>{project.departmentName || project.orgUnitName || "Chưa cập nhật"}</span>
          </div>
          <div className="project-board-card__progress">
            <Progress
              percent={Math.round(project.progress || 0)}
              size="small"
              status={
                project.healthStatus === "RISK" || project.healthStatus === ""
                  ? "exception"
                  : project.healthStatus === "WATCH"
                  ? "active"
                  : "normal"
              }
            />
            <div className="project-board-card__progress-meta">
              {project.completedTasks || 0}/{project.totalTasks || project.taskCount || 0} công việc · {project.openIssues || 0} issues
            </div>
          </div>
          <div className="project-board-card__footer">
            <Avatar.Group maxCount={4}>
              {(project.teamMembers || []).length > 0 ? (
                project.teamMembers.map((member, index) => (
                  <Tooltip title={member.name} key={`${project.id}-board-${index}`}>
                    <Avatar style={{ backgroundColor: member.color || TEAM_COLORS[index % TEAM_COLORS.length] }}>
                      {member.initials || getInitials(member.name)}
                    </Avatar>
                  </Tooltip>
                ))
              ) : (
                // Hiển thị avatar từ projectManager nếu không có teamMembers
                project.projectManager && (
                  <Tooltip title={project.projectManager}>
                    <Avatar style={{ backgroundColor: TEAM_COLORS[0] }}>
                      {getInitials(project.projectManager)}
                    </Avatar>
                  </Tooltip>
                )
              )}
            </Avatar.Group>
            <Space size="small">
              <Button type="link" size="small" onClick={() => handleViewDocuments(project)}>
                Tài liệu
              </Button>
            </Space>
          </div>
        </Card>
      );
    },
    [handleViewDetail, handleViewDocuments]
  );

  return (
    <div className="project-list-container">
      <div className="project-header-grid">
        <div className="project-header-card">
          <div className="project-header-card__title">
            <div>
              <h2>Danh sách dự án</h2>
              <span className="project-header-card__subtitle">
                {totalDisplay} dự án đang theo dõi
              </span>
            </div>
          </div>

          <div className="project-status-chips">
        {statusChipData.map((status) => (
          <Tag
            key={status.key}
            className={`status-chip ${filters.status === status.key ? "active" : ""}`}
            color={filters.status === status.key ? status.color : undefined}
            onClick={() => handleStatusChange(filters.status === status.key ? "" : status.key)}
          >
            <div className="status-chip__content">
              <span className="status-chip__label">{status.label}</span>
              <span className="status-chip__value">{status.count}</span>
            </div>
            {status.overdue > 0 && <span className="status-chip__badge">{status.overdue} quá hạn</span>}
          </Tag>
        ))}
      </div>
        </div>

        <div className="project-action-card">
          <div>
            <p className="project-action-card__label">Tạo dự án mới</p>
            <p className="project-action-card__desc">
              Lên kế hoạch, phân công và theo dõi ngay trong vài bước.
            </p>
          </div>
          <Button
            type="primary"
            size="middle"
            icon={<PlusOutlined />}
            className="project-primary-add-btn"
            onClick={() => {
              setOpenModalAddProjectState(true);
              setOpenModalType("Add");
              setCurrentRecord(null);
            }}
          >
            Thêm dự án mới
          </Button>
        </div>
      </div>

      <div className="project-overview-grid">
        <Row gutter={[16, 16]}>
          {insights.map((card) => (
            <Col xs={24} sm={12} xl={6} key={card.title}>
              <Card className="project-insight-card" bordered={false}>
                <Statistic
                  title={card.title}
                  value={card.value}
                  suffix={card.suffix}
                  valueRender={
                    card.formatter ? () => <span>{card.formatter(card.value)}</span> : undefined
                  }
                />
                <div className="project-insight-card__subtext">{card.subtext}</div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>


      <div className="project-filters">
        <div className="project-filters__fields">
          <Space wrap>
            <Search
              placeholder="Tìm kiếm dự án..."
              allowClear
              style={{ width: 240 }}
              onSearch={handleSearch}
              value={filters.searchKey}
              onChange={(e) => dispatch(setFilters({ ...filters, searchKey: e.target.value }))}
            />
            <Select
              placeholder="Trạng thái"
              style={{ width: 180 }}
              value={filters.status || undefined}
              onChange={handleStatusChange}
              allowClear
            >
              {projectStatusOptions.map((option) => (
                <Option key={option.value} value={option.value || undefined}>
                  {option.label}
                </Option>
              ))}
            </Select>
            <Select
              placeholder="Độ ưu tiên"
              style={{ width: 180 }}
              value={filters.priority || undefined}
              onChange={handlePriorityChange}
              allowClear
            >
              {priorityOptions.map((option) => (
                <Option key={option.value} value={option.value || undefined}>
                  {option.label}
                </Option>
              ))}
            </Select>
            <Select
              placeholder="Sức khỏe"
              style={{ width: 200 }}
              value={filters.healthStatus || undefined}
              onChange={handleHealthChange}
              allowClear
            >
              {healthStatusOptions.map((option) => (
                <Option key={option.value} value={option.value || undefined}>
                  {option.label}
                </Option>
              ))}
            </Select>
            <Select
              placeholder="Quản lý dự án"
              style={{ width: 200 }}
              value={filters.projectManager || undefined}
              onChange={handleManagerChange}
              allowClear
            >
              {projectManagersOptions.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
            <RangePicker
              placeholder={["Từ ngày", "Đến ngày"]}
              format="DD/MM/YYYY"
              value={dateRangeValue}
              onChange={handleDateRangeChange}
            />
            <Button type="link" onClick={handleResetFilters}>
              Bỏ lọc
            </Button>
          </Space>
        </div>
        <div className="project-filters__actions">
          <Segmented options={viewModeOptions} value={viewMode} onChange={setViewMode} />
        </div>
      </div>

      {viewMode === "table" ? (
        <div className="project-table-wrapper">
          <Table
            columns={tableColumns}
            dataSource={normalizedProjects}
            rowKey="id"
            loading={loading}
            pagination={{
              current: pagination.pageindex,
              pageSize: pagination.pageSize,
              total: totalDisplay,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} dự án`,
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
      ) : (
        <div className="project-board-view">
          {boardColumns.map((column) => (
            <div className="project-board-column" key={column.key}>
              <div className="project-board-column__header">
                <span>{column.label}</span>
                <Tag color={column.tagColor}>{column.projects.length}</Tag>
              </div>
              <div className="project-board-column__scrollable" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0, width: '100%', maxWidth: '100%' }}>
                <Space direction="vertical" size="middle" style={{ width: "100%", maxWidth: "100%" }}>
                  {column.projects.length === 0 ? (
                    <Empty description="Không có dự án" />
                  ) : (
                    column.projects.map((project) => renderBoardCard(project))
                  )}
                </Space>
              </div>
            </div>
          ))}
        </div>
      )}

      <ModalAddProject
        openModalAddProjectState={openModalAddProjectState}
        handleCloseModal={() => {
          setOpenModalAddProjectState(false);
          setCurrentRecord(null);
        }}
        openModalType={openModalType}
        currentRecord={currentRecord}
        refreshData={refreshData}
      />

      <Modal
        title="Xác nhận xóa dự án"
        open={isOpenModalDeleteProject}
        onOk={handleDeleteProject}
        onCancel={() => {
          setIsOpenModalDeleteProject(false);
          setCurrentItemSelected({});
        }}
        okText="Xóa"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
      >
        <p>Bạn có chắc chắn muốn xóa dự án <strong>{currentItemSelected.projectName || currentItemSelected.projectCode}</strong> không?</p>
        <p style={{ color: "#ff4d4f" }}>Hành động này không thể hoàn tác.</p>
      </Modal>
    </div>
  );
};

export default ProjectList;
