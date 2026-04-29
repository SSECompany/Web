import dayjs from "dayjs";

/**
 * Calculate workload score for a user
 * Lower score = less workload = better candidate for new tasks
 */
export const calculateWorkloadScore = (userTasks, currentDate = dayjs()) => {
  const totalHours = userTasks.reduce(
    (sum, task) => sum + (task.estimatedHours || 0),
    0
  );
  
  const overdueCount = userTasks.filter((task) => {
    if (!task.dueDate) return false;
    return dayjs(task.dueDate).isBefore(currentDate, "day");
  }).length;
  
  const highPriorityCount = userTasks.filter((task) =>
    ["HIGH", "URGENT"].includes(task.priority)
  ).length;
  
  const inProgressCount = userTasks.filter((task) =>
    task.status === "IN_PROGRESS"
  ).length;
  
  // Weighted score calculation
  const workloadScore =
    totalHours * 0.4 +           // Hours weight
    overdueCount * 15 +          // Overdue penalty (high)
    highPriorityCount * 8 +       // High priority weight
    inProgressCount * 3 +        // Active tasks weight
    userTasks.length * 0.5;      // Task count weight

  return {
    totalHours,
    overdueCount,
    highPriorityCount,
    inProgressCount,
    totalTasks: userTasks.length,
    workloadScore: Math.round(workloadScore * 100) / 100,
  };
};

/**
 * Calculate KPI metrics for a user
 */
export const calculateUserKPI = (userTasks, currentDate = dayjs()) => {
  const totalTasks = userTasks.length;
  if (totalTasks === 0) {
    return {
      completionRate: 0,
      onTimeRate: 0,
      averageProgress: 0,
      efficiency: 0,
      points: 0,
    };
  }

  const completedTasks = userTasks.filter(
    (task) => task.status === "COMPLETED" || task.status === "REVIEW"
  );
  const completionRate = (completedTasks.length / totalTasks) * 100;

  // Calculate on-time completion rate
  const onTimeCompleted = completedTasks.filter((task) => {
    if (!task.dueDate) return false;
    const completedDate = task.completedDate || task.updatedDate;
    if (!completedDate) return true; // Assume on-time if no completion date
    return dayjs(completedDate).isBefore(dayjs(task.dueDate), "day") ||
           dayjs(completedDate).isSame(dayjs(task.dueDate), "day");
  }).length;
  const onTimeRate = completedTasks.length > 0
    ? (onTimeCompleted / completedTasks.length) * 100
    : 0;

  // Average progress
  const averageProgress = userTasks.reduce(
    (sum, task) => sum + (task.progress || 0),
    0
  ) / totalTasks;

  // Calculate points
  const PRIORITY_WEIGHT = {
    URGENT: 5,
    HIGH: 4,
    MEDIUM: 3,
    NORMAL: 2,
    LOW: 1,
  };
  const points = userTasks.reduce(
    (sum, task) => sum + (PRIORITY_WEIGHT[task.priority] || 1),
    0
  );

  // Efficiency = completion rate * on-time rate * (average progress / 100)
  const efficiency = (completionRate / 100) * (onTimeRate / 100) * (averageProgress / 100) * 100;

  return {
    completionRate: Math.round(completionRate * 100) / 100,
    onTimeRate: Math.round(onTimeRate * 100) / 100,
    averageProgress: Math.round(averageProgress * 100) / 100,
    efficiency: Math.round(efficiency * 100) / 100,
    points,
    completedTasks: completedTasks.length,
    totalTasks,
  };
};

/**
 * Suggest task redistribution for workload balancing
 */
export const suggestRedistribution = (resources, threshold = 32) => {
  const suggestions = [];
  
  // Find overloaded users
  const overloaded = resources.filter((r) => r.workloadHours > threshold || r.isOverloaded);
  
  // Find available users
  const available = resources
    .filter((r) => r.workloadHours < threshold && !r.isOverloaded)
    .sort((a, b) => a.workloadHours - b.workloadHours);

  overloaded.forEach((overloadedUser) => {
    const excessHours = overloadedUser.workloadHours - threshold;
    const tasksToRedistribute = overloadedUser.tasks
      .filter((task) => task.status === "PENDING" || task.status === "IN_PROGRESS")
      .sort((a, b) => {
        // Prioritize lower priority tasks for redistribution
        const priorityOrder = { LOW: 1, NORMAL: 2, MEDIUM: 3, HIGH: 4, URGENT: 5 };
        return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
      });

    let remainingExcess = excessHours;
    const redistributions = [];

    tasksToRedistribute.forEach((task) => {
      if (remainingExcess <= 0 || available.length === 0) return;

      const taskHours = task.estimatedHours || 0;
      if (taskHours > remainingExcess) return;

      // Find best recipient
      const bestRecipient = available.find((user) => {
        const newWorkload = user.workloadHours + taskHours;
        return newWorkload <= threshold;
      });

      if (bestRecipient) {
        redistributions.push({
          taskId: task.id,
          taskName: task.taskName,
          fromUser: overloadedUser.member,
          toUser: bestRecipient.member,
          hours: taskHours,
        });
        
        // Update recipient's workload for next iteration
        const recipientIndex = available.findIndex((u) => u.member === bestRecipient.member);
        if (recipientIndex >= 0) {
          available[recipientIndex].workloadHours += taskHours;
          available.sort((a, b) => a.workloadHours - b.workloadHours);
        }
        
        remainingExcess -= taskHours;
      }
    });

    if (redistributions.length > 0) {
      suggestions.push({
        overloadedUser: overloadedUser.member,
        currentWorkload: overloadedUser.workloadHours,
        suggestedRedistributions: redistributions,
        estimatedReduction: redistributions.reduce((sum, r) => sum + r.hours, 0),
      });
    }
  });

  return suggestions;
};

/**
 * Calculate team performance metrics
 */
export const calculateTeamMetrics = (resources) => {
  if (resources.length === 0) {
    return {
      totalMembers: 0,
      totalTasks: 0,
      totalPoints: 0,
      averageWorkload: 0,
      averageCompletionRate: 0,
      averageEfficiency: 0,
      overloadedCount: 0,
      totalOverdue: 0,
    };
  }

  const totalTasks = resources.reduce((sum, r) => sum + r.totalTasks, 0);
  const totalPoints = resources.reduce((sum, r) => sum + r.points, 0);
  const totalWorkload = resources.reduce((sum, r) => sum + r.workloadHours, 0);
  const totalOverdue = resources.reduce((sum, r) => sum + r.overdueTasks, 0);
  const overloadedCount = resources.filter((r) => r.isOverloaded).length;

  // Calculate averages from KPI data
  const kpis = resources.map((r) => r.kpi || {});
  const avgCompletionRate = kpis.length > 0
    ? kpis.reduce((sum, k) => sum + (k.completionRate || 0), 0) / kpis.length
    : 0;
  const avgEfficiency = kpis.length > 0
    ? kpis.reduce((sum, k) => sum + (k.efficiency || 0), 0) / kpis.length
    : 0;

  return {
    totalMembers: resources.length,
    totalTasks,
    totalPoints,
    averageWorkload: Math.round((totalWorkload / resources.length) * 100) / 100,
    averageCompletionRate: Math.round(avgCompletionRate * 100) / 100,
    averageEfficiency: Math.round(avgEfficiency * 100) / 100,
    overloadedCount,
    totalOverdue,
  };
};

/**
 * Filter resources by advanced criteria
 */
export const filterResources = (resources, filters) => {
  let filtered = [...resources];

  // Filter by workload range
  if (filters.minWorkload !== undefined) {
    filtered = filtered.filter((r) => r.workloadHours >= filters.minWorkload);
  }
  if (filters.maxWorkload !== undefined) {
    filtered = filtered.filter((r) => r.workloadHours <= filters.maxWorkload);
  }

  // Filter by overdue tasks
  if (filters.hasOverdue !== undefined) {
    if (filters.hasOverdue) {
      filtered = filtered.filter((r) => r.overdueTasks > 0);
    } else {
      filtered = filtered.filter((r) => r.overdueTasks === 0);
    }
  }

  // Filter by overloaded status
  if (filters.isOverloaded !== undefined) {
    filtered = filtered.filter((r) => r.isOverloaded === filters.isOverloaded);
  }

  // Filter by department
  if (filters.department) {
    filtered = filtered.filter((r) => r.department === filters.department);
  }

  // Filter by minimum completion rate
  if (filters.minCompletionRate !== undefined) {
    filtered = filtered.filter(
      (r) => (r.kpi?.completionRate || 0) >= filters.minCompletionRate
    );
  }

  return filtered;
};

/**
 * Sort resources by various criteria
 */
export const sortResources = (resources, sortBy, order = "asc") => {
  const sorted = [...resources];

  sorted.sort((a, b) => {
    let aValue, bValue;

    switch (sortBy) {
      case "workload":
        aValue = a.workloadHours;
        bValue = b.workloadHours;
        break;
      case "tasks":
        aValue = a.totalTasks;
        bValue = b.totalTasks;
        break;
      case "points":
        aValue = a.points;
        bValue = b.points;
        break;
      case "overdue":
        aValue = a.overdueTasks;
        bValue = b.overdueTasks;
        break;
      case "completion":
        aValue = a.kpi?.completionRate || 0;
        bValue = b.kpi?.completionRate || 0;
        break;
      case "efficiency":
        aValue = a.kpi?.efficiency || 0;
        bValue = b.kpi?.efficiency || 0;
        break;
      case "name":
        aValue = a.member.toLowerCase();
        bValue = b.member.toLowerCase();
        break;
      default:
        return 0;
    }

    if (order === "asc") {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    } else {
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
    }
  });

  return sorted;
};

/**
 * Export resource data to CSV format
 */
export const exportToCSV = (resources, teamMetrics) => {
  const headers = [
    "Nhân sự",
    "Phòng ban",
    "Tổng công việc",
    "Tổng điểm",
    "Khối lượng (giờ)",
    "Chưa bắt đầu",
    "Đang làm",
    "Quá hạn",
    "Hoàn thành",
    "Tạm hoãn",
    "Hôm nay",
    "Tiến độ TB (%)",
    "Tỷ lệ hoàn thành (%)",
    "Hiệu quả (%)",
  ];

  const rows = resources.map((r) => [
    r.member,
    r.department,
    r.totalTasks,
    r.points,
    r.workloadHours,
    r.notStarted,
    r.inProgress,
    r.overdueTasks,
    r.completed,
    r.paused,
    r.todayTasks,
    r.progressAverage,
    r.kpi?.completionRate || 0,
    r.kpi?.efficiency || 0,
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  return csvContent;
};
































