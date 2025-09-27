import { useSelector } from "react-redux";
import { getUserInfo } from "../../store/selectors/Selectors";
import checkPermission from "../../utils/permission";

/**
 * Custom hook for department-based permissions in workflow
 * @returns {Object} Permission object with various department access checks
 */
const useDepartmentPermissions = () => {
  const userInfo = useSelector(getUserInfo);

  const permissions = {
    // Can view all departments' data
    canViewAllDepartments: checkPermission("WORKFLOW_VIEW_ALL_DEPARTMENTS"),

    // Can manage (create/edit/delete) in all departments
    canManageAllDepartments: checkPermission("WORKFLOW_MANAGE_ALL_DEPARTMENTS"),

    // Can create projects/tasks
    canCreateProjects: checkPermission("WORKFLOW_CREATE_PROJECTS"),
    canCreateTasks: checkPermission("WORKFLOW_CREATE_TASKS"),

    // Can assign tasks to other departments
    canAssignCrossDepartment: checkPermission(
      "WORKFLOW_ASSIGN_CROSS_DEPARTMENT"
    ),

    // Department admin permissions
    isDepartmentAdmin: checkPermission("WORKFLOW_DEPARTMENT_ADMIN"),

    // System admin permissions
    isSystemAdmin: checkPermission("WORKFLOW_SYSTEM_ADMIN"),

    // Current user department info
    currentDepartment: {
      id: userInfo.unitId,
      name: userInfo.unitName,
      code: userInfo.unitId, // Assuming unitId contains department code
    },

    // Helper functions
    canViewDepartment: (departmentId) => {
      // System admin can view all
      if (checkPermission("WORKFLOW_SYSTEM_ADMIN")) return true;

      // Can view all departments permission
      if (checkPermission("WORKFLOW_VIEW_ALL_DEPARTMENTS")) return true;

      // Can view own department
      if (departmentId === userInfo.unitId) return true;

      return false;
    },

    canManageDepartment: (departmentId) => {
      // System admin can manage all
      if (checkPermission("WORKFLOW_SYSTEM_ADMIN")) return true;

      // Can manage all departments permission
      if (checkPermission("WORKFLOW_MANAGE_ALL_DEPARTMENTS")) return true;

      // Department admin can manage own department
      if (
        checkPermission("WORKFLOW_DEPARTMENT_ADMIN") &&
        departmentId === userInfo.unitId
      ) {
        return true;
      }

      return false;
    },

    getVisibleDepartments: () => {
      // If can view all departments, return all (this would come from API)
      if (
        checkPermission("WORKFLOW_VIEW_ALL_DEPARTMENTS") ||
        checkPermission("WORKFLOW_SYSTEM_ADMIN")
      ) {
        return "ALL";
      }

      // Otherwise, only current department
      return [userInfo.unitId];
    },

    // Check if user can assign task to specific department
    canAssignToDepartment: (departmentId) => {
      // System admin can assign anywhere
      if (checkPermission("WORKFLOW_SYSTEM_ADMIN")) return true;

      // Cross department assignment permission
      if (checkPermission("WORKFLOW_ASSIGN_CROSS_DEPARTMENT")) return true;

      // Can assign within own department
      if (departmentId === userInfo.unitId) return true;

      return false;
    },

    // Get default department filter for queries
    getDefaultDepartmentFilter: () => {
      if (
        checkPermission("WORKFLOW_VIEW_ALL_DEPARTMENTS") ||
        checkPermission("WORKFLOW_SYSTEM_ADMIN")
      ) {
        return null; // No filter - show all
      }

      return userInfo.unitId; // Filter by user's department
    },
  };

  return permissions;
};

export default useDepartmentPermissions;

