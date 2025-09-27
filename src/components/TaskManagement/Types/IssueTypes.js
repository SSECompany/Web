/**
 * Issue Types Configuration - Similar to Redmine
 * Định nghĩa các loại công việc như Redmine
 */

export const ISSUE_TYPES = {
  BUG: {
    id: "bug",
    name: "Bug",
    namVn: "Lỗi",
    color: "#ff4d4f",
    icon: "🐛",
    description: "Báo cáo lỗi trong hệ thống",
    defaultPriority: "HIGH",
    allowTimeTracking: true,
    workflow: ["NEW", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"],
  },
  FEATURE: {
    id: "feature",
    name: "Feature",
    namVn: "Tính năng",
    color: "#52c41a",
    icon: "✨",
    description: "Yêu cầu tính năng mới",
    defaultPriority: "MEDIUM",
    allowTimeTracking: true,
    workflow: ["NEW", "ASSIGNED", "IN_PROGRESS", "TESTING", "DONE"],
  },
  TASK: {
    id: "task",
    name: "Task",
    namVn: "Nhiệm vụ",
    color: "#1890ff",
    icon: "📋",
    description: "Công việc thông thường",
    defaultPriority: "MEDIUM",
    allowTimeTracking: true,
    workflow: ["NEW", "ASSIGNED", "IN_PROGRESS", "REVIEW", "DONE"],
  },
  SUPPORT: {
    id: "support",
    name: "Support",
    namVn: "Hỗ trợ",
    color: "#722ed1",
    icon: "🎧",
    description: "Yêu cầu hỗ trợ khách hàng",
    defaultPriority: "HIGH",
    allowTimeTracking: true,
    workflow: [
      "NEW",
      "ASSIGNED",
      "IN_PROGRESS",
      "WAITING_FEEDBACK",
      "RESOLVED",
    ],
  },
  IMPROVEMENT: {
    id: "improvement",
    name: "Improvement",
    namVn: "Cải tiến",
    color: "#fa8c16",
    icon: "⚡",
    description: "Cải tiến chức năng hiện có",
    defaultPriority: "LOW",
    allowTimeTracking: true,
    workflow: ["NEW", "ASSIGNED", "IN_PROGRESS", "TESTING", "DONE"],
  },
  DOCUMENTATION: {
    id: "documentation",
    name: "Documentation",
    namVn: "Tài liệu",
    color: "#13c2c2",
    icon: "📝",
    description: "Viết/cập nhật tài liệu",
    defaultPriority: "LOW",
    allowTimeTracking: false,
    workflow: ["NEW", "ASSIGNED", "IN_PROGRESS", "REVIEW", "PUBLISHED"],
  },
};

export const ISSUE_PRIORITIES = {
  IMMEDIATE: {
    id: "immediate",
    name: "Immediate",
    nameVn: "Khẩn cấp",
    color: "#ff1744",
    weight: 5,
    description: "Phải xử lý ngay lập tức",
  },
  URGENT: {
    id: "urgent",
    name: "Urgent",
    nameVn: "Gấp",
    color: "#ff5722",
    weight: 4,
    description: "Cần xử lý trong 24h",
  },
  HIGH: {
    id: "high",
    name: "High",
    nameVn: "Cao",
    color: "#ff9800",
    weight: 3,
    description: "Ưu tiên cao",
  },
  NORMAL: {
    id: "normal",
    name: "Normal",
    nameVn: "Bình thường",
    color: "#4caf50",
    weight: 2,
    description: "Ưu tiên bình thường",
  },
  LOW: {
    id: "low",
    name: "Low",
    nameVn: "Thấp",
    color: "#9e9e9e",
    weight: 1,
    description: "Ưu tiên thấp",
  },
};

export const ISSUE_STATUSES = {
  NEW: {
    id: "new",
    name: "New",
    nameVn: "Mới",
    color: "#f0f0f0",
    category: "open",
    isDefault: true,
    isClosed: false,
  },
  ASSIGNED: {
    id: "assigned",
    name: "Assigned",
    nameVn: "Đã giao",
    color: "#1890ff",
    category: "open",
    isClosed: false,
  },
  IN_PROGRESS: {
    id: "in_progress",
    name: "In Progress",
    nameVn: "Đang thực hiện",
    color: "#faad14",
    category: "open",
    isClosed: false,
  },
  TESTING: {
    id: "testing",
    name: "Testing",
    nameVn: "Đang test",
    color: "#722ed1",
    category: "open",
    isClosed: false,
  },
  REVIEW: {
    id: "review",
    name: "Review",
    nameVn: "Đang review",
    color: "#13c2c2",
    category: "open",
    isClosed: false,
  },
  RESOLVED: {
    id: "resolved",
    name: "Resolved",
    nameVn: "Đã giải quyết",
    color: "#52c41a",
    category: "closed",
    isClosed: true,
  },
  CLOSED: {
    id: "closed",
    name: "Closed",
    nameVn: "Đã đóng",
    color: "#595959",
    category: "closed",
    isClosed: true,
  },
  REJECTED: {
    id: "rejected",
    name: "Rejected",
    nameVn: "Từ chối",
    color: "#ff4d4f",
    category: "closed",
    isClosed: true,
  },
  WAITING_FEEDBACK: {
    id: "waiting_feedback",
    name: "Waiting for Feedback",
    nameVn: "Chờ phản hồi",
    color: "#fa541c",
    category: "open",
    isClosed: false,
  },
};

/**
 * Get available statuses for issue type
 */
export const getAvailableStatuses = (issueType) => {
  const workflow = ISSUE_TYPES[issueType.toUpperCase()]?.workflow || [];
  return workflow.map((statusId) => ISSUE_STATUSES[statusId]).filter(Boolean);
};

/**
 * Get next possible statuses from current status
 */
export const getNextStatuses = (currentStatus, issueType) => {
  const workflow = ISSUE_TYPES[issueType.toUpperCase()]?.workflow || [];
  const currentIndex = workflow.indexOf(currentStatus.toUpperCase());

  if (currentIndex === -1) return [];

  // Can move to next status or stay in current
  const possibleNext = [];
  if (currentIndex < workflow.length - 1) {
    possibleNext.push(workflow[currentIndex + 1]);
  }

  // Special transitions
  if (currentStatus === "IN_PROGRESS") {
    possibleNext.push("WAITING_FEEDBACK", "RESOLVED", "REJECTED");
  }

  return possibleNext
    .map((statusId) => ISSUE_STATUSES[statusId])
    .filter(Boolean);
};

/**
 * Check if status transition is allowed
 */
export const isStatusTransitionAllowed = (
  fromStatus,
  toStatus,
  issueType,
  userRole
) => {
  const availableStatuses = getAvailableStatuses(issueType);
  const nextStatuses = getNextStatuses(fromStatus, issueType);

  // Check if target status exists in workflow
  if (!availableStatuses.find((s) => s.id === toStatus)) {
    return false;
  }

  // Admin can change to any status
  if (userRole === "ADMIN" || userRole === "PROJECT_MANAGER") {
    return true;
  }

  // Regular users can only move to next statuses
  return nextStatuses.some((s) => s.id === toStatus);
};

