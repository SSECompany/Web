/**
 * Workflow Search Configuration
 * Cấu hình search cho tất cả các modules trong Workflow System
 */

export const WORKFLOW_CORE_MODULES = [
  {
    id: "dashboard-workflow",
    title: "Dashboard",
    description: "Tổng quan về tình hình dự án và công việc",
    icon: "📊",
    route: "/workflow/dashboard",
    keywords: ["dashboard", "tổng quan", "overview", "stats", "thống kê"],
    priority: "HIGH",
    category: "core",
  },
  {
    id: "danh-sach-du-an",
    title: "Danh sách dự án",
    description: "Quản lý tất cả dự án trong hệ thống",
    icon: "📁",
    route: "/workflow/project-management/projects",
    keywords: ["dự án", "project", "quản lý", "list", "danh sách"],
    priority: "HIGH",
    category: "core",
  },
  {
    id: "danh-sach-cong-viec",
    title: "Danh sách công việc",
    description: "Quản lý tasks và công việc",
    icon: "✅",
    route: "/workflow/task-management/tasks",
    keywords: ["công việc", "task", "nhiệm vụ"],
    priority: "HIGH",
    category: "core",
  },
  {
    id: "lich",
    title: "Lịch",
    description: "Xem tasks/issues theo lịch",
    icon: "📅",
    route: "/workflow/calendar",
    keywords: ["calendar", "lịch", "schedule"],
    priority: "LOW",
    category: "core",
  },
  {
    id: "roadmap",
    title: "Roadmap",
    description: "Roadmap và timeline của projects",
    icon: "🗺️",
    route: "/workflow/roadmap",
    keywords: ["roadmap", "kế hoạch", "timeline"],
    priority: "LOW",
    category: "core",
  },
  {
    id: "trung-tam-de-xuat",
    title: "Trung tâm đề xuất",
    description: "Quản lý đề xuất, phê duyệt và ERP liên thông",
    icon: "📝",
    route: "/workflow/finance/proposals",
    keywords: ["đề xuất", "phê duyệt", "proposal", "approval"],
    priority: "HIGH",
    category: "finance",
  },
  {
    id: "so-thu-chi",
    title: "Sổ thu chi",
    description: "Theo dõi phiếu thu/chi và dòng tiền dự án",
    icon: "💰",
    route: "/workflow/finance/ledger",
    keywords: ["thu chi", "finance", "cash flow", "thu", "chi"],
    priority: "HIGH",
    category: "finance",
  },
];

/**
 * REMOVED MODULES - Không hiển thị nữa
 * Các modules đã bị loại bỏ khỏi system
 */
export const REMOVED_MODULES = [
  "chi-tiet-du-an", // Tích hợp vào project list
  "tai-lieu-du-an", // Dùng file attachments trong tasks
  "trao-doi-du-an", // Dùng comments system
  "nguon-luc-du-an", // Dùng assignment system
  "bao-cao-tien-do-du-an", // Tích hợp vào dashboard
  "bao-cao-kpi-du-an", // Tích hợp vào dashboard
  "chi-tiet-cong-viec", // Tích hợp vào task list (detail page)
  "nhac-viec", // Dùng task due dates
  "bao-cao-tien-do-cong-viec", // Tích hợp vào dashboard
  "bao-cao-kpi-cong-viec", // Tích hợp vào dashboard
];

/**
 * Get filtered workflow modules for search
 * Trả về tất cả modules có sẵn (có thể filter theo permissions nếu cần)
 */
export const getWorkflowSearchModules = (userPermissions = []) => {
  // Trả về tất cả modules - có thể thêm permission check sau nếu cần
  return WORKFLOW_CORE_MODULES;
  
  // Uncomment để enable permission-based filtering:
  // return WORKFLOW_CORE_MODULES.filter((module) => {
  //   if (module.priority === "HIGH") return true;
  //   if (module.priority === "MEDIUM")
  //     return userPermissions.includes("WORKFLOW_ASSIGN_TASKS");
  //   if (module.priority === "LOW")
  //     return userPermissions.includes("WORKFLOW_VIEW_REPORTS");
  //   return true;
  // });
};

/**
 * Search within workflow modules
 * Tìm kiếm trong các modules
 */
export const searchWorkflowModules = (searchTerm, userPermissions = []) => {
  const modules = getWorkflowSearchModules(userPermissions);

  if (!searchTerm) return modules;

  const term = searchTerm.toLowerCase();

  return modules.filter((module) => {
    return (
      module.title.toLowerCase().includes(term) ||
      module.description.toLowerCase().includes(term) ||
      module.keywords.some((keyword) => keyword.toLowerCase().includes(term))
    );
  });
};

/**
 * Get module by route
 */
export const getWorkflowModuleByRoute = (route) => {
  return WORKFLOW_CORE_MODULES.find((module) => module.route === route);
};

/**
 * Check if module exists (not removed)
 */
export const isModuleAvailable = (moduleId) => {
  return (
    !REMOVED_MODULES.includes(moduleId) &&
    WORKFLOW_CORE_MODULES.some((module) => module.id === moduleId)
  );
};

