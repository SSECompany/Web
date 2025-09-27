/**
 * Simplified Workflow Routes - Only 5 Core Modules
 * Chỉ giữ lại 5 modules cốt lõi đã được user confirm
 */

// Lazy loading components for better performance
import { lazy } from "react";

// Core workflow components
const WorkflowDashboard = lazy(() =>
  import("../pages/Workflow/Dashboard/WorkflowDashboard")
);
const ProjectList = lazy(() =>
  import("../components/ProjectManagement/Pages/ProjectList/ProjectList")
);
const ProjectDetail = lazy(() =>
  import("../components/ProjectManagement/Pages/ProjectDetail/ProjectDetail")
);
const TaskList = lazy(() =>
  import("../components/TaskManagement/Pages/TaskList/TaskList")
);
const EnhancedTaskDetail = lazy(() =>
  import("../components/TaskManagement/Pages/TaskDetail/EnhancedTaskDetail")
);
const AssignmentDashboard = lazy(() =>
  import("../components/TaskManagement/Pages/Assignment/AssignmentDashboard")
);
const WorkflowOverview = lazy(() =>
  import("../components/TaskManagement/Components/WorkflowOverview")
);

/**
 * Simplified Workflow Routes Configuration
 * Chỉ 5 modules cốt lõi: Dashboard, Projects, Tasks, Task Detail, Assignment
 */
const workflowRoutes = [
  // Main workflow overview
  {
    path: "workflow",
    element: "WorkflowApp", // Use WorkflowApp as layout
    children: [
      {
        index: true,
        element: WorkflowOverview,
        label: "Workflow Overview",
        description: "Tổng quan 5 modules cốt lõi",
      },

      // 1. Dashboard
      {
        path: "dashboard",
        element: WorkflowDashboard,
        label: "Dashboard",
        description: "Tổng quan dự án & công việc",
        icon: "📊",
        priority: "HIGH",
      },

      // 2. Danh sách dự án
      {
        path: "projects",
        element: ProjectList,
        label: "Danh sách dự án",
        description: "Quản lý tất cả dự án",
        icon: "📁",
        priority: "HIGH",
      },
      {
        path: "projects/:id",
        element: ProjectDetail,
        label: "Chi tiết dự án",
        description: "Xem chi tiết dự án",
        hidden: true, // Hide from navigation
      },

      // 3. Danh sách công việc
      {
        path: "tasks",
        element: TaskList,
        label: "Danh sách công việc",
        description: "Quản lý tasks như Redmine",
        icon: "✅",
        priority: "HIGH",
      },

      // 4. Chi tiết công việc
      {
        path: "tasks/:id",
        element: EnhancedTaskDetail,
        label: "Chi tiết công việc",
        description: "Xem chi tiết task",
        hidden: true, // Hide from navigation
      },

      // 5. Giao việc
      {
        path: "assignment",
        element: AssignmentDashboard,
        label: "Giao việc",
        description: "Phân công công việc",
        icon: "👥",
        priority: "MEDIUM",
      },
    ],
  },
];

/**
 * Generate navigation items from routes
 * Tạo navigation items từ routes config
 */
export const getWorkflowNavigation = () => {
  const mainRoute = workflowRoutes[0];
  const navItems = [];

  mainRoute.children.forEach((route) => {
    if (!route.hidden && route.label && route.path) {
      navItems.push({
        key: route.path,
        label: route.label,
        icon: route.icon || "📋",
        path: `/workflow/${route.path}`,
        description: route.description,
        priority: route.priority || "LOW",
      });
    }
  });

  // Sort by priority: HIGH -> MEDIUM -> LOW
  const priorityOrder = { HIGH: 1, MEDIUM: 2, LOW: 3 };
  navItems.sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  return navItems;
};

/**
 * Get breadcrumb items for current route
 */
export const getWorkflowBreadcrumb = (pathname) => {
  const breadcrumbs = [
    { title: "Home", path: "/" },
    { title: "Workflow", path: "/workflow" },
  ];

  // Parse current path
  const pathSegments = pathname.split("/").filter(Boolean);

  if (pathSegments.length > 1) {
    const module = pathSegments[1];
    const navItems = getWorkflowNavigation();
    const currentItem = navItems.find((item) => item.key === module);

    if (currentItem) {
      breadcrumbs.push({
        title: currentItem.label,
        path: currentItem.path,
      });
    }

    // Add detail page breadcrumb if exists
    if (pathSegments.length > 2) {
      const id = pathSegments[2];
      if (module === "projects") {
        breadcrumbs.push({ title: `Dự án #${id}` });
      } else if (module === "tasks") {
        breadcrumbs.push({ title: `Công việc #${id}` });
      }
    }
  }

  return breadcrumbs;
};

/**
 * Check if user has permission to access route
 */
export const canAccessWorkflowRoute = (routePath, userPermissions) => {
  // Basic permission mapping
  const routePermissions = {
    dashboard: ["WORKFLOW_VIEW_DASHBOARD"],
    projects: ["WORKFLOW_VIEW_PROJECTS"],
    tasks: ["WORKFLOW_VIEW_TASKS"],
    assignment: ["WORKFLOW_ASSIGN_TASKS"],
  };

  const requiredPermissions = routePermissions[routePath] || [];

  if (requiredPermissions.length === 0) return true;

  return requiredPermissions.some((permission) =>
    userPermissions.includes(permission)
  );
};

/**
 * Export routes for router configuration
 */
export default workflowRoutes;

/**
 * Export module statistics for dashboard
 */
export const getWorkflowModuleStats = () => {
  return {
    totalModules: 5,
    implementedModules: 5,
    coreModules: ["dashboard", "projects", "tasks", "assignment"],
    optionalModules: ["reports"],
    removedModules: [
      "documents",
      "communications",
      "progress-reports",
      "kpi-reports",
      "resources",
      "reminders",
    ],
    implementationStatus: {
      dashboard: { status: "completed", progress: 100 },
      projects: { status: "in-progress", progress: 70 },
      tasks: { status: "completed", progress: 95 },
      taskDetail: { status: "completed", progress: 90 },
      assignment: { status: "planned", progress: 20 },
    },
  };
};
