import dayjs from "dayjs";

/**
 * Generate task code automatically based on project and date
 */
export const generateTaskCode = (projectCode, date) => {
  const dateStr = date.format("YYYYMMDD");
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `${projectCode || "TASK"}-${dateStr}-${random}`;
};

/**
 * Check for time conflicts with existing tasks
 */
export const checkTimeConflict = (newTask, existingTasks) => {
  if (!newTask.startDate || !newTask.dueDate || !newTask.timeRange) {
    return { hasConflict: false, conflicts: [] };
  }

  const newStart = dayjs(newTask.startDate).set(
    "hour",
    newTask.timeRange[0].hour()
  ).set("minute", newTask.timeRange[0].minute());
  const newEnd = dayjs(newTask.dueDate).set(
    "hour",
    newTask.timeRange[1].hour()
  ).set("minute", newTask.timeRange[1].minute());

  const conflicts = existingTasks.filter((task) => {
    if (!task.time || !task.date) return false;
    
    const taskDate = dayjs(task.date);
    if (!taskDate.isSame(newStart, "day")) return false;

    // Parse task time if available
    if (task.time && typeof task.time === "string") {
      const [startStr, endStr] = task.time.split(" - ");
      if (startStr && endStr) {
        const [startHour, startMin] = startStr.split(":").map(Number);
        const [endHour, endMin] = endStr.split(":").map(Number);
        
        const taskStart = taskDate.hour(startHour).minute(startMin);
        const taskEnd = taskDate.hour(endHour).minute(endMin);

        // Check overlap
        return (
          (newStart.isBefore(taskEnd) && newEnd.isAfter(taskStart)) ||
          (taskStart.isBefore(newEnd) && taskEnd.isAfter(newStart))
        );
      }
    }
    return false;
  });

  return {
    hasConflict: conflicts.length > 0,
    conflicts: conflicts.map((c) => ({
      id: c.id,
      title: c.title,
      time: c.time,
    })),
  };
};

/**
 * Auto-assign task based on workload balancing
 */
export const suggestAssignee = (users, tasks, projectId, priority) => {
  if (!users || users.length === 0) return null;

  // Calculate workload for each user
  const userWorkloads = users.map((user) => {
    const userTasks = tasks.filter(
      (task) => task.assignedToId === user.id && task.projectId === projectId
    );
    
    const totalHours = userTasks.reduce(
      (sum, task) => sum + (task.estimatedHours || 0),
      0
    );
    const overdueCount = userTasks.filter((task) => {
      if (!task.dueDate) return false;
      return dayjs(task.dueDate).isBefore(dayjs(), "day");
    }).length;
    
    const highPriorityCount = userTasks.filter((task) =>
      ["HIGH", "URGENT"].includes(task.priority)
    ).length;

    // Calculate workload score (lower is better)
    const workloadScore =
      totalHours * 0.4 + overdueCount * 10 + highPriorityCount * 5;

    return {
      user,
      totalTasks: userTasks.length,
      totalHours,
      overdueCount,
      highPriorityCount,
      workloadScore,
    };
  });

  // Sort by workload score (ascending)
  userWorkloads.sort((a, b) => a.workloadScore - b.workloadScore);

  // For high priority tasks, prefer users with fewer high-priority tasks
  if (["HIGH", "URGENT"].includes(priority)) {
    const sortedByHighPriority = [...userWorkloads].sort(
      (a, b) => a.highPriorityCount - b.highPriorityCount
    );
    return sortedByHighPriority[0]?.user || userWorkloads[0]?.user;
  }

  return userWorkloads[0]?.user || null;
};

/**
 * Validate task data before submission
 */
export const validateTaskData = (taskData, projects, users) => {
  const errors = [];

  // Required fields
  if (!taskData.taskName || taskData.taskName.trim().length === 0) {
    errors.push("Tên công việc là bắt buộc");
  }

  if (!taskData.startDate) {
    errors.push("Ngày bắt đầu là bắt buộc");
  }

  if (!taskData.dueDate) {
    errors.push("Ngày kết thúc là bắt buộc");
  }

  // Date validation
  if (taskData.startDate && taskData.dueDate) {
    const start = dayjs(taskData.startDate);
    const end = dayjs(taskData.dueDate);

    if (end.isBefore(start, "day")) {
      errors.push("Ngày kết thúc phải sau ngày bắt đầu");
    }

    // Warn if task spans more than 30 days
    if (end.diff(start, "day") > 30) {
      errors.push("warning: Công việc kéo dài hơn 30 ngày, hãy xem xét chia nhỏ");
    }
  }

  // Time range validation
  if (taskData.timeRange && taskData.timeRange.length === 2) {
    const [startTime, endTime] = taskData.timeRange;
    if (endTime.isBefore(startTime) || endTime.isSame(startTime)) {
      errors.push("Thời gian kết thúc phải sau thời gian bắt đầu");
    }

    // Check if duration is reasonable (not more than 12 hours)
    const duration = endTime.diff(startTime, "hour", true);
    if (duration > 12) {
      errors.push("warning: Thời gian thực hiện quá dài (>12h), hãy kiểm tra lại");
    }
  }

  // Project validation
  if (taskData.projectId) {
    const project = projects.find((p) => p.id === taskData.projectId);
    if (!project) {
      errors.push("Dự án không hợp lệ");
    }
  }

  // Assignee validation
  if (taskData.assignedToId) {
    const user = users.find((u) => u.id === taskData.assignedToId);
    if (!user) {
      errors.push("Người thực hiện không hợp lệ");
    }
  }

  // Estimated hours validation
  if (taskData.estimatedHours !== undefined && taskData.estimatedHours < 0) {
    errors.push("Số giờ ước tính không được âm");
  }

  // Points validation
  if (taskData.points !== undefined && (taskData.points < 0 || taskData.points > 100)) {
    errors.push("Điểm phải từ 0 đến 100");
  }

  return {
    isValid: errors.filter((e) => !e.startsWith("warning:")).length === 0,
    errors: errors.filter((e) => !e.startsWith("warning:")),
    warnings: errors.filter((e) => e.startsWith("warning:")).map((e) => e.replace("warning: ", "")),
  };
};

/**
 * Calculate task duration in hours
 */
export const calculateTaskDuration = (startDate, dueDate, timeRange) => {
  if (!startDate || !dueDate) return null;

  const start = dayjs(startDate);
  const end = dayjs(dueDate);
  const days = end.diff(start, "day") + 1;

  if (timeRange && timeRange.length === 2) {
    const [startTime, endTime] = timeRange;
    const hoursPerDay = endTime.diff(startTime, "hour", true);
    return Math.round(days * hoursPerDay);
  }

  // Default 8 hours per day
  return days * 8;
};

/**
 * Suggest estimated hours based on task data
 */
export const suggestEstimatedHours = (taskData) => {
  const { type, priority, points, timeRange } = taskData;

  // Base hours by type
  const baseHours = {
    TASK: 4,
    BUG: 2,
    FEATURE: 8,
    SUPPORT: 1,
  };

  let suggested = baseHours[type] || 4;

  // Adjust by priority
  const priorityMultiplier = {
    LOW: 0.75,
    NORMAL: 1,
    MEDIUM: 1.25,
    HIGH: 1.5,
    URGENT: 2,
  };
  suggested *= priorityMultiplier[priority] || 1;

  // Adjust by points
  if (points) {
    suggested = Math.max(suggested, points * 0.5);
  }

  // Use time range if available
  if (timeRange && timeRange.length === 2) {
    const [startTime, endTime] = timeRange;
    const hours = endTime.diff(startTime, "hour", true);
    if (hours > 0) {
      suggested = Math.max(suggested, hours);
    }
  }

  return Math.round(suggested);
};

/**
 * Format task data for API submission
 */
export const formatTaskForAPI = (formData, projectCode) => {
  const taskCode = generateTaskCode(projectCode, formData.startDate || dayjs());
  
  return {
    action: "ADD",
    taskCode,
    taskName: formData.taskName?.trim(),
    description: formData.description?.trim() || "",
    type: formData.type || "TASK",
    status: formData.status || "PENDING",
    priority: formData.priority || "NORMAL",
    mode: formData.mode || "INTERNAL",
    projectId: formData.projectId,
    assignedToId: formData.assignedToId,
    startDate: formData.startDate?.format("YYYY-MM-DD"),
    dueDate: formData.dueDate?.format("YYYY-MM-DD"),
    estimatedHours: formData.estimatedHours || suggestEstimatedHours(formData),
    actualHours: 0,
    progress: 0,
    points: formData.points || null,
    category: formData.category || null,
    formTemplate: formData.formTemplate || null,
    notes: formData.description?.trim() || "",
    userid: 0,
  };
};
































