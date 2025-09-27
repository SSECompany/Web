/**
 * Workflow Permission Constants
 * Các quyền cần thiết cho hệ thống workflow multi-department
 */

export const WORKFLOW_PERMISSIONS = {
  // View permissions
  VIEW_ALL_DEPARTMENTS: "WORKFLOW_VIEW_ALL_DEPARTMENTS",
  VIEW_OWN_DEPARTMENT: "WORKFLOW_VIEW_OWN_DEPARTMENT",

  // Management permissions
  MANAGE_ALL_DEPARTMENTS: "WORKFLOW_MANAGE_ALL_DEPARTMENTS",
  MANAGE_OWN_DEPARTMENT: "WORKFLOW_MANAGE_OWN_DEPARTMENT",

  // Project permissions
  CREATE_PROJECTS: "WORKFLOW_CREATE_PROJECTS",
  EDIT_PROJECTS: "WORKFLOW_EDIT_PROJECTS",
  DELETE_PROJECTS: "WORKFLOW_DELETE_PROJECTS",
  ASSIGN_PROJECT_RESOURCES: "WORKFLOW_ASSIGN_PROJECT_RESOURCES",

  // Task permissions
  CREATE_TASKS: "WORKFLOW_CREATE_TASKS",
  EDIT_TASKS: "WORKFLOW_EDIT_TASKS",
  DELETE_TASKS: "WORKFLOW_DELETE_TASKS",
  ASSIGN_TASKS: "WORKFLOW_ASSIGN_TASKS",
  ASSIGN_CROSS_DEPARTMENT: "WORKFLOW_ASSIGN_CROSS_DEPARTMENT",

  // Admin permissions
  DEPARTMENT_ADMIN: "WORKFLOW_DEPARTMENT_ADMIN",
  SYSTEM_ADMIN: "WORKFLOW_SYSTEM_ADMIN",

  // Reporting permissions
  VIEW_DEPARTMENT_REPORTS: "WORKFLOW_VIEW_DEPARTMENT_REPORTS",
  VIEW_SYSTEM_REPORTS: "WORKFLOW_VIEW_SYSTEM_REPORTS",

  // Approval permissions
  APPROVE_PROJECTS: "WORKFLOW_APPROVE_PROJECTS",
  APPROVE_BUDGETS: "WORKFLOW_APPROVE_BUDGETS",
};

/**
 * Role-based permission mapping
 * Định nghĩa quyền cho từng vai trò
 */
export const WORKFLOW_ROLE_PERMISSIONS = {
  // System Administrator - Full access
  SYSTEM_ADMIN: [
    WORKFLOW_PERMISSIONS.VIEW_ALL_DEPARTMENTS,
    WORKFLOW_PERMISSIONS.MANAGE_ALL_DEPARTMENTS,
    WORKFLOW_PERMISSIONS.CREATE_PROJECTS,
    WORKFLOW_PERMISSIONS.EDIT_PROJECTS,
    WORKFLOW_PERMISSIONS.DELETE_PROJECTS,
    WORKFLOW_PERMISSIONS.ASSIGN_PROJECT_RESOURCES,
    WORKFLOW_PERMISSIONS.CREATE_TASKS,
    WORKFLOW_PERMISSIONS.EDIT_TASKS,
    WORKFLOW_PERMISSIONS.DELETE_TASKS,
    WORKFLOW_PERMISSIONS.ASSIGN_TASKS,
    WORKFLOW_PERMISSIONS.ASSIGN_CROSS_DEPARTMENT,
    WORKFLOW_PERMISSIONS.SYSTEM_ADMIN,
    WORKFLOW_PERMISSIONS.VIEW_SYSTEM_REPORTS,
    WORKFLOW_PERMISSIONS.APPROVE_PROJECTS,
    WORKFLOW_PERMISSIONS.APPROVE_BUDGETS,
  ],

  // Department Manager - Department level access
  DEPARTMENT_MANAGER: [
    WORKFLOW_PERMISSIONS.VIEW_OWN_DEPARTMENT,
    WORKFLOW_PERMISSIONS.MANAGE_OWN_DEPARTMENT,
    WORKFLOW_PERMISSIONS.CREATE_PROJECTS,
    WORKFLOW_PERMISSIONS.EDIT_PROJECTS,
    WORKFLOW_PERMISSIONS.ASSIGN_PROJECT_RESOURCES,
    WORKFLOW_PERMISSIONS.CREATE_TASKS,
    WORKFLOW_PERMISSIONS.EDIT_TASKS,
    WORKFLOW_PERMISSIONS.ASSIGN_TASKS,
    WORKFLOW_PERMISSIONS.DEPARTMENT_ADMIN,
    WORKFLOW_PERMISSIONS.VIEW_DEPARTMENT_REPORTS,
    WORKFLOW_PERMISSIONS.APPROVE_PROJECTS,
  ],

  // Project Manager - Project level access
  PROJECT_MANAGER: [
    WORKFLOW_PERMISSIONS.VIEW_OWN_DEPARTMENT,
    WORKFLOW_PERMISSIONS.CREATE_PROJECTS,
    WORKFLOW_PERMISSIONS.EDIT_PROJECTS,
    WORKFLOW_PERMISSIONS.ASSIGN_PROJECT_RESOURCES,
    WORKFLOW_PERMISSIONS.CREATE_TASKS,
    WORKFLOW_PERMISSIONS.EDIT_TASKS,
    WORKFLOW_PERMISSIONS.ASSIGN_TASKS,
    WORKFLOW_PERMISSIONS.VIEW_DEPARTMENT_REPORTS,
  ],

  // Team Lead - Task level access
  TEAM_LEAD: [
    WORKFLOW_PERMISSIONS.VIEW_OWN_DEPARTMENT,
    WORKFLOW_PERMISSIONS.CREATE_TASKS,
    WORKFLOW_PERMISSIONS.EDIT_TASKS,
    WORKFLOW_PERMISSIONS.ASSIGN_TASKS,
    WORKFLOW_PERMISSIONS.VIEW_DEPARTMENT_REPORTS,
  ],

  // Employee - Basic access
  EMPLOYEE: [WORKFLOW_PERMISSIONS.VIEW_OWN_DEPARTMENT],
};

/**
 * Department structure example
 * Cấu trúc phòng ban mẫu
 */
export const DEPARTMENT_STRUCTURE = {
  IT: {
    id: "IT",
    name: "Phòng Công nghệ thông tin",
    code: "IT",
    manager: "Nguyễn Văn A",
    teams: ["Development", "Infrastructure", "Support"],
  },
  HR: {
    id: "HR",
    name: "Phòng Nhân sự",
    code: "HR",
    manager: "Trần Thị B",
    teams: ["Recruitment", "Training", "Benefits"],
  },
  SALE: {
    id: "SALE",
    name: "Phòng Kinh doanh",
    code: "SALE",
    manager: "Lê Văn C",
    teams: ["Sales North", "Sales South", "Sales Online"],
  },
  MARKETING: {
    id: "MARKETING",
    name: "Phòng Marketing",
    code: "MKT",
    manager: "Phạm Thị D",
    teams: ["Digital Marketing", "Content", "Events"],
  },
  FINANCE: {
    id: "FINANCE",
    name: "Phòng Tài chính",
    code: "FIN",
    manager: "Hoàng Văn E",
    teams: ["Accounting", "Budget", "Audit"],
  },
};

/**
 * Helper function to check if user has specific workflow permission
 * @param {string} permission - Permission to check
 * @param {object} userInfo - User information object
 * @returns {boolean} - Whether user has permission
 */
export const hasWorkflowPermission = (permission, userInfo) => {
  // Get user's role permissions
  const rolePermissions = WORKFLOW_ROLE_PERMISSIONS[userInfo.role] || [];

  // Check if user has the specific permission
  return rolePermissions.includes(permission);
};

/**
 * Get all permissions for a user role
 * @param {string} role - User role
 * @returns {array} - Array of permissions
 */
export const getUserRolePermissions = (role) => {
  return WORKFLOW_ROLE_PERMISSIONS[role] || [];
};

/**
 * Check if user can access department data
 * @param {string} departmentId - Department to check access for
 * @param {object} userInfo - User information object
 * @returns {boolean} - Whether user can access department
 */
export const canAccessDepartment = (departmentId, userInfo) => {
  // System admin can access all
  if (hasWorkflowPermission(WORKFLOW_PERMISSIONS.SYSTEM_ADMIN, userInfo)) {
    return true;
  }

  // Can view all departments permission
  if (
    hasWorkflowPermission(WORKFLOW_PERMISSIONS.VIEW_ALL_DEPARTMENTS, userInfo)
  ) {
    return true;
  }

  // Can access own department
  if (departmentId === userInfo.unitId) {
    return true;
  }

  return false;
};

