/**
 * Workflow Search Configuration - ONLY 5 Core Modules
 * Cấu hình search chỉ hiển thị 5 modules cốt lõi
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
    route: "/workflow/projects",
    keywords: ["dự án", "project", "quản lý", "list", "danh sách"],
    priority: "HIGH",
    category: "core",
  },
  {
    id: "danh-sach-cong-viec",
    title: "Danh sách công việc",
    description: "Quản lý tasks và issues như Redmine",
    icon: "✅",
    route: "/workflow/tasks",
    keywords: ["công việc", "task", "issue", "redmine", "bug", "feature"],
    priority: "HIGH",
    category: "core",
  },
  {
    id: "giao-viec",
    title: "Giao việc",
    description: "Phân công công việc cho thành viên",
    icon: "👥",
    route: "/workflow/assignment",
    keywords: ["giao việc", "assign", "phân công", "assignment"],
    priority: "MEDIUM",
    category: "core",
  },
  {
    id: "bao-cao-tong-hop",
    title: "Báo cáo tổng hợp",
    description: "Reports và analytics",
    icon: "📈",
    route: "/workflow/reports",
    keywords: ["báo cáo", "report", "analytics", "thống kê"],
    priority: "LOW",
    category: "core",
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
 * Chỉ trả về 5 modules cốt lõi
 */
export const getWorkflowSearchModules = (userPermissions = []) => {
  return WORKFLOW_CORE_MODULES.filter((module) => {
    // Basic permission check
    if (module.priority === "HIGH") return true;
    if (module.priority === "MEDIUM")
      return userPermissions.includes("WORKFLOW_ASSIGN_TASKS");
    if (module.priority === "LOW")
      return userPermissions.includes("WORKFLOW_VIEW_REPORTS");
    return true;
  });
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

