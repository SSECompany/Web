import dayjs from "dayjs";

let cachedData = null;

const PRIORITY_TO_EVENT = {
  URGENT: "high",
  HIGH: "high",
  MEDIUM: "medium",
  NORMAL: "normal",
  LOW: "low",
};

const buildProjects = (startOfMonth) =>
  [
    {
      id: "1",
      projectCode: "PRJ-001",
      projectName: "Website thương mại",
      status: "IN_PROGRESS",
      priority: "HIGH",
      projectManager: "Nguyễn Văn A",
      departmentName: "Khối CNTT",
      clientName: "Golden Fruits Group",
      healthStatus: "GOOD",
      totalTasks: 72,
      completedTasks: 48,
      overdueTasks: 4,
      openIssues: 3,
      startOffset: 1,
      endOffset: 24,
      lastUpdatedOffset: 20,
      progress: 68,
      budget: 520000000,
      budgetUsed: 410000000,
      teamMembers: [
        { name: "Nguyễn Văn A", initials: "NA" },
        { name: "Trần Thị B", initials: "TB" },
        { name: "Đỗ Văn E", initials: "DE" },
        { name: "Phạm Thị D", initials: "DD" },
      ],
    },
    {
      id: "2",
      projectCode: "PRJ-002",
      projectName: "Ứng dụng Mobile CRM",
      status: "PLANNING",
      priority: "MEDIUM",
      projectManager: "Trần Thị B",
      departmentName: "Khối Sản phẩm",
      clientName: "Sun Travel",
      healthStatus: "WATCH",
      totalTasks: 54,
      completedTasks: 18,
      overdueTasks: 6,
      openIssues: 5,
      startOffset: 5,
      endOffset: 32,
      lastUpdatedOffset: 12,
      progress: 25,
      budget: 350000000,
      budgetUsed: 120000000,
      teamMembers: [
        { name: "Trần Thị B", initials: "TB" },
        { name: "Nguyễn Văn C", initials: "NC" },
        { name: "Phạm Thị D", initials: "DD" },
      ],
    },
    {
      id: "3",
      projectCode: "PRJ-003",
      projectName: "Hệ thống báo cáo BI",
      status: "ON_HOLD",
      priority: "URGENT",
      projectManager: "Lê Văn C",
      departmentName: "Khối Dữ liệu",
      clientName: "AgriBank",
      healthStatus: "RISK",
      totalTasks: 63,
      completedTasks: 22,
      overdueTasks: 11,
      openIssues: 8,
      startOffset: 3,
      endOffset: 15,
      lastUpdatedOffset: 8,
      progress: 55,
      budget: 610000000,
      budgetUsed: 472000000,
      teamMembers: [
        { name: "Lê Văn C", initials: "LC" },
        { name: "Nguyễn Văn F", initials: "NF" },
        { name: "Đỗ Văn G", initials: "DG" },
      ],
    },
  ].map((project) => {
    const lastUpdated = project.lastUpdatedOffset ?? project.endOffset;
    return {
      ...project,
      startDate: startOfMonth.add(project.startOffset, "day").format("YYYY-MM-DD"),
      endDate: startOfMonth.add(project.endOffset, "day").format("YYYY-MM-DD"),
      lastUpdated: startOfMonth.add(lastUpdated, "day").format("YYYY-MM-DD"),
    };
  });

const buildTasks = (startOfMonth) => [
  {
    id: "TASK-001",
    taskCode: "TASK-001",
    taskName: "Thiết kế giao diện dashboard",
    projectId: "1",
    type: "TASK",
    status: "IN_PROGRESS",
    priority: "HIGH",
    assignedToName: "Trần Thị B",
    createdByName: "Nguyễn Văn A",
    startOffset: 1,
    dueOffset: 8,
    progress: 45,
    estimatedHours: 18,
    departmentName: "Frontend",
    description: "Thiết kế giao diện dashboard với các widget thống kê và biểu đồ tương tác",
  },
  {
    id: "TASK-002",
    taskCode: "TASK-002",
    taskName: "Tích hợp cổng thanh toán",
    projectId: "1",
    type: "FEATURE",
    status: "REVIEW",
    priority: "URGENT",
    assignedToName: "Nguyễn Văn C",
    createdByName: "Nguyễn Văn A",
    startOffset: 4,
    dueOffset: 12,
    progress: 70,
    estimatedHours: 24,
    departmentName: "Backend",
    description: "Tích hợp cổng thanh toán VNPay và MoMo vào hệ thống",
  },
  {
    id: "TASK-003",
    taskCode: "TASK-003",
    taskName: "Xây dựng API báo cáo",
    projectId: "3",
    type: "TASK",
    status: "PENDING",
    priority: "MEDIUM",
    assignedToName: "Lê Văn C",
    createdByName: "Trần Thị B",
    startOffset: 6,
    dueOffset: 15,
    progress: 10,
    estimatedHours: 32,
    departmentName: "Data",
    description: "Xây dựng API RESTful cho các báo cáo BI và analytics",
  },
  {
    id: "TASK-004",
    taskCode: "TASK-004",
    taskName: "Chuẩn hóa dữ liệu khách hàng",
    projectId: "2",
    type: "TASK",
    status: "IN_PROGRESS",
    priority: "LOW",
    assignedToName: "Phạm Thị D",
    createdByName: "Nguyễn Văn A",
    startOffset: 8,
    dueOffset: 20,
    progress: 35,
    estimatedHours: 20,
    departmentName: "Data",
    description: "Chuẩn hóa và làm sạch dữ liệu khách hàng từ nhiều nguồn",
  },
  {
    id: "TASK-005",
    taskCode: "TASK-005",
    taskName: "Kiểm thử tính năng thanh toán",
    projectId: "1",
    type: "BUG",
    status: "REVIEW",
    priority: "HIGH",
    assignedToName: "Đỗ Văn E",
    createdByName: "Trần Thị B",
    startOffset: 10,
    dueOffset: 22,
    progress: 80,
    estimatedHours: 12,
    departmentName: "QA",
    description: "Kiểm thử toàn diện tính năng thanh toán, bao gồm test case và edge cases",
  },
  {
    id: "TASK-006",
    taskCode: "TASK-006",
    taskName: "Triển khai môi trường staging",
    projectId: "3",
    type: "TASK",
    status: "IN_PROGRESS",
    priority: "MEDIUM",
    assignedToName: "Nguyễn Văn F",
    createdByName: "Nguyễn Văn A",
    startOffset: 12,
    dueOffset: 25,
    progress: 20,
    estimatedHours: 16,
    departmentName: "DevOps",
    description: "Setup và cấu hình môi trường staging với CI/CD pipeline",
  },
  {
    id: "TASK-007",
    taskCode: "TASK-007",
    taskName: "Lỗi đăng nhập không hoạt động",
    projectId: "1",
    type: "BUG",
    status: "IN_PROGRESS",
    priority: "URGENT",
    assignedToName: "Nguyễn Văn A",
    createdByName: "Trần Thị B",
    startOffset: 2,
    dueOffset: 7,
    progress: 60,
    estimatedHours: 8,
    departmentName: "Backend",
    description: "Người dùng không thể đăng nhập dù nhập đúng thông tin",
  },
  {
    id: "TASK-008",
    taskCode: "TASK-008",
    taskName: "Hỗ trợ khách hàng VIP",
    projectId: "2",
    type: "SUPPORT",
    status: "IN_PROGRESS",
    priority: "HIGH",
    assignedToName: "Phạm Thị D",
    createdByName: "Nguyễn Văn A",
    startOffset: 9,
    dueOffset: 18,
    progress: 45,
    estimatedHours: 16,
    departmentName: "Support",
    description: "Hỗ trợ khách hàng VIP về vấn đề tích hợp API",
  },
  // Sample tasks for all Kanban columns
  {
    id: "TASK-009",
    taskCode: "TASK-009",
    taskName: "Hoàn tất tài liệu hướng dẫn người dùng",
    projectId: "1",
    type: "TASK",
    status: "COMPLETED",
    priority: "MEDIUM",
    assignedToName: "Nguyễn Văn A",
    createdByName: "Nguyễn Văn A",
    startOffset: 1,
    dueOffset: 5,
    progress: 100,
    estimatedHours: 6,
    departmentName: "BA",
    description: "Viết và rà soát tài liệu hướng dẫn sử dụng hệ thống cho end-user",
  },
  {
    id: "TASK-010",
    taskCode: "TASK-010",
    taskName: "Thử nghiệm A/B giao diện landing page",
    projectId: "1",
    type: "FEATURE",
    status: "CANCELLED",
    priority: "LOW",
    assignedToName: "Trần Thị B",
    createdByName: "Nguyễn Văn A",
    startOffset: 3,
    dueOffset: 10,
    progress: 0,
    estimatedHours: 10,
    departmentName: "Marketing",
    description: "Kế hoạch A/B test tạm dừng do thay đổi ưu tiên chiến dịch",
  },
].map((task) => ({
  ...task,
  startDate: startOfMonth
    .add(
      typeof task.startOffset === "number"
        ? task.startOffset
        : Math.max((task.dueOffset || 1) - 5, 0),
      "day"
    )
    .format("YYYY-MM-DD"),
  dueDate: startOfMonth.add(task.dueOffset, "day").format("YYYY-MM-DD"),
}));

const buildIssues = (startOfMonth) => [
  {
    key: "1",
    id: "ISSUE-001",
    type: "BUG",
    title: "Lỗi đăng nhập không hoạt động",
    priority: "HIGH",
    status: "IN_PROGRESS",
    assignee: "Nguyễn Văn A",
    projectId: "1",
    createdOffset: 2,
    dueOffset: 7,
    progress: 60,
  },
  {
    key: "2",
    id: "ISSUE-002",
    type: "FEATURE",
    title: "Thêm tính năng thanh toán online",
    priority: "NORMAL",
    status: "NEW",
    assignee: "Trần Thị B",
    projectId: "1",
    createdOffset: 4,
    dueOffset: 14,
    progress: 0,
  },
  {
    key: "3",
    id: "ISSUE-003",
    type: "TASK",
    title: "Cập nhật tài liệu API",
    priority: "LOW",
    status: "ASSIGNED",
    assignee: "Lê Văn C",
    projectId: "3",
    createdOffset: 6,
    dueOffset: 10,
    progress: 30,
  },
  {
    key: "4",
    id: "ISSUE-004",
    type: "SUPPORT",
    title: "Hỗ trợ khách hàng VIP",
    priority: "HIGH",
    status: "REVIEW",
    assignee: "Phạm Thị D",
    projectId: "2",
    createdOffset: 9,
    dueOffset: 18,
    progress: 45,
  },
].map((issue) => ({
  ...issue,
  createdDate: startOfMonth.add(issue.createdOffset, "day").format("YYYY-MM-DD"),
  dueDate: startOfMonth.add(issue.dueOffset, "day").format("YYYY-MM-DD"),
}));

const buildProposals = (startOfMonth, projectMap) => [
  {
    id: "PR-2024-001",
    code: "DX-0001",
    title: "Mua server cho môi trường staging",
    projectId: "1",
    requester: "Nguyễn Văn A",
    department: "Engineering",
    category: "Procurement",
    type: "expense",
    amount: 45000000,
    currency: "VND",
    status: "PENDING",
    priority: "HIGH",
    createdOffset: 4,
    dueOffset: 8,
    attachments: 2,
    approvalSteps: [
      { role: "Project Manager", approver: "Nguyễn Văn A", status: "APPROVED", dateOffset: 4 },
      { role: "PMO", approver: "Trần Thị B", status: "PENDING" },
      { role: "CFO", approver: "Phạm Thị D", status: "WAITING" },
    ],
  },
  {
    id: "PR-2024-002",
    code: "DX-0002",
    title: "Tuyển dụng UI/UX freelancer",
    projectId: "1",
    requester: "Trần Thị B",
    department: "Design",
    category: "Human Resource",
    type: "expense",
    amount: 18000000,
    currency: "VND",
    status: "APPROVED",
    priority: "MEDIUM",
    createdOffset: 2,
    dueOffset: 6,
    attachments: 1,
    approvalSteps: [
      { role: "Project Manager", approver: "Nguyễn Văn A", status: "APPROVED", dateOffset: 2 },
      { role: "PMO", approver: "Vũ Văn F", status: "APPROVED", dateOffset: 3 },
      { role: "CFO", approver: "Phạm Thị D", status: "APPROVED", dateOffset: 4 },
    ],
  },
  {
    id: "PR-2024-003",
    code: "DX-0003",
    title: "Triển khai chiến dịch marketing",
    projectId: "2",
    requester: "Phạm Thị D",
    department: "Marketing",
    category: "Marketing",
    type: "expense",
    amount: 32000000,
    currency: "VND",
    status: "RETURNED",
    priority: "HIGH",
    createdOffset: 7,
    dueOffset: 11,
    attachments: 3,
    approvalSteps: [
      { role: "PMO", approver: "Vũ Văn F", status: "APPROVED", dateOffset: 8 },
      { role: "Finance", approver: "Đỗ Văn G", status: "RETURNED", dateOffset: 9 },
      { role: "Requester", approver: "Phạm Thị D", status: "UPDATING" },
    ],
  },
  {
    id: "PR-2024-004",
    code: "DX-0004",
    title: "Đầu tư license BI",
    projectId: "3",
    requester: "Lê Văn C",
    department: "Data",
    category: "Software",
    type: "expense",
    amount: 75000000,
    currency: "VND",
    status: "APPROVED",
    priority: "URGENT",
    createdOffset: 1,
    dueOffset: 4,
    attachments: 4,
    approvalSteps: [
      { role: "Project Manager", approver: "Lê Văn C", status: "APPROVED", dateOffset: 1 },
      { role: "CTO", approver: "Nguyễn Văn H", status: "APPROVED", dateOffset: 2 },
      { role: "CFO", approver: "Phạm Thị D", status: "APPROVED", dateOffset: 3 },
    ],
  },
].map((proposal) => ({
  ...proposal,
  projectName: projectMap[proposal.projectId]?.projectName ?? "Không xác định",
  createdDate: startOfMonth.add(proposal.createdOffset, "day").format("YYYY-MM-DD"),
  dueDate: startOfMonth.add(proposal.dueOffset, "day").format("YYYY-MM-DD"),
}));

const buildFinanceTransactions = (startOfMonth, projectMap) => [
  {
    id: "FIN-001",
    voucherNo: "PT-2024-0001",
    type: "income",
    projectId: "1",
    projectName: projectMap["1"]?.projectName,
    category: "Thanh toán khách hàng",
    description: "Thu dự án Website thương mại",
    amount: 82000000,
    currency: "VND",
    method: "Bank Transfer",
    status: "CLEARED",
    issuedOffset: 5,
    clearedOffset: 6,
  },
  {
    id: "FIN-002",
    voucherNo: "PC-2024-0004",
    type: "expense",
    projectId: "1",
    projectName: projectMap["1"]?.projectName,
    category: "Chi phí nhân sự",
    description: "Chi freelancer UI/UX",
    amount: 18000000,
    currency: "VND",
    method: "Bank Transfer",
    status: "APPROVED",
    issuedOffset: 7,
  },
  {
    id: "FIN-003",
    voucherNo: "PC-2024-0005",
    type: "expense",
    projectId: "3",
    projectName: projectMap["3"]?.projectName,
    category: "Bản quyền phần mềm",
    description: "License BI Enterprise",
    amount: 75000000,
    currency: "VND",
    method: "Wire",
    status: "PENDING",
    issuedOffset: 8,
  },
  {
    id: "FIN-004",
    voucherNo: "PT-2024-0002",
    type: "income",
    projectId: "2",
    projectName: projectMap["2"]?.projectName,
    category: "Thanh toán milestone",
    description: "Thu CRM sprint 2",
    amount: 56000000,
    currency: "VND",
    method: "Cash",
    status: "PENDING",
    issuedOffset: 10,
  },
  {
    id: "FIN-005",
    voucherNo: "PC-2024-0006",
    type: "expense",
    projectId: "2",
    projectName: projectMap["2"]?.projectName,
    category: "Marketing",
    description: "Chiến dịch digital",
    amount: 32000000,
    currency: "VND",
    method: "Card",
    status: "RETURNED",
    issuedOffset: 9,
  },
].map((txn) => ({
  ...txn,
  issuedDate: startOfMonth.add(txn.issuedOffset, "day").format("YYYY-MM-DD"),
  clearedDate: txn.clearedOffset
    ? startOfMonth.add(txn.clearedOffset, "day").format("YYYY-MM-DD")
    : null,
}));
const buildRoadmap = (startOfMonth, projectMap, issues, tasks) => {
  const issueMap = issues.reduce((acc, issue) => {
    acc[issue.id] = issue;
    return acc;
  }, {});

  const taskMap = tasks.reduce((acc, task) => {
    acc[task.id] = task;
    return acc;
  }, {});

  const versions = [
    {
      id: "WEB-1.0.0",
      projectId: "1",
      name: "Website v1.0.0",
      status: "released",
      releaseOffset: 14,
      milestones: [
        {
          id: "WEB-M1",
          name: "Hoàn thiện đăng nhập",
          dateOffset: 10,
          completed: true,
          issueIds: ["ISSUE-001"],
          taskIds: ["TASK-001"],
        },
      ],
    },
    {
      id: "WEB-1.1.0",
      projectId: "1",
      name: "Website v1.1.0",
      status: "in_progress",
      releaseOffset: 20,
      milestones: [
        {
          id: "WEB-M2",
          name: "Thanh toán online",
          dateOffset: 18,
          completed: false,
          issueIds: ["ISSUE-002"],
          taskIds: ["TASK-002", "TASK-005"],
        },
      ],
    },
    {
      id: "CRM-1.0.0",
      projectId: "2",
      name: "CRM Mobile v1.0.0",
      status: "in_progress",
      releaseOffset: 25,
      milestones: [
        {
          id: "CRM-M1",
          name: "Chuẩn hóa dữ liệu",
          dateOffset: 22,
          completed: false,
          issueIds: ["ISSUE-004"],
          taskIds: ["TASK-004"],
        },
      ],
    },
    {
      id: "BI-2.0.0",
      projectId: "3",
      name: "BI Platform v2.0.0",
      status: "planned",
      releaseOffset: 28,
      milestones: [
        {
          id: "BI-M1",
          name: "API Báo cáo mới",
          dateOffset: 24,
          completed: false,
          issueIds: ["ISSUE-003"],
          taskIds: ["TASK-003", "TASK-006"],
        },
      ],
    },
  ];

  const isIssueCompleted = (issue) => issue.progress >= 60 || issue.status === "REVIEW";
  const isTaskCompleted = (task) => task.status === "REVIEW" || task.progress >= 70;

  return versions.map((version) => ({
    ...version,
    releaseDate: startOfMonth
      .add(version.releaseOffset, "day")
      .format("YYYY-MM-DD"),
    projectName: projectMap[version.projectId]?.projectName ?? "Không xác định",
    milestones: version.milestones.map((milestone) => {
      const milestoneIssues = (milestone.issueIds || [])
        .map((id) => issueMap[id])
        .filter(Boolean);
      const milestoneTasks = (milestone.taskIds || [])
        .map((id) => taskMap[id])
        .filter(Boolean);

      return {
        ...milestone,
        date: startOfMonth.add(milestone.dateOffset, "day").format("YYYY-MM-DD"),
        issues: milestoneIssues.length,
        completedIssues: milestoneIssues.filter(isIssueCompleted).length,
        tasks: milestoneTasks.length,
        completedTasks: milestoneTasks.filter(isTaskCompleted).length,
        relatedIssues: milestoneIssues.map((issue) => ({
          id: issue.id,
          title: issue.title,
          progress: issue.progress,
        })),
        relatedTasks: milestoneTasks.map((task) => ({
          id: task.id,
          name: task.taskName,
          progress: task.progress,
        })),
      };
    }),
  }));
};

const buildActivities = (projects, issues, tasks, roadmap) => {
  const projectMap = projects.reduce((acc, project) => {
    acc[project.id] = project;
    return acc;
  }, {});

  const formatTimestamp = (dateString, hour = 10, minute = 0) =>
    dayjs(dateString).hour(hour).minute(minute).format("YYYY-MM-DD HH:mm");

  const activities = [];

  issues.forEach((issue) => {
    activities.push({
      id: `ACT-${issue.id}-create`,
      type: "issue_created",
      user: issue.assignee,
      action: "đã tạo issue",
      target: `${issue.id}: ${issue.title}`,
      projectId: issue.projectId,
      issueId: issue.id,
      timestamp: formatTimestamp(issue.createdDate, 9, 15),
      details: `Ưu tiên ${issue.priority}, dự án ${projectMap[issue.projectId]?.projectName}`,
    });

    activities.push({
      id: `ACT-${issue.id}-update`,
      type: "issue_updated",
      user: issue.assignee,
      action: "đã cập nhật tiến độ",
      target: `${issue.id}: ${issue.title}`,
      projectId: issue.projectId,
      issueId: issue.id,
      timestamp: formatTimestamp(issue.dueDate, 14, 0),
      details: `Tiến độ hiện tại ${issue.progress}%`,
    });
  });

  tasks.forEach((task) => {
    activities.push({
      id: `ACT-${task.id}-assign`,
      type: "task_assigned",
      user: task.createdByName,
      action: "đã giao công việc",
      target: `${task.taskCode}: ${task.taskName}`,
      projectId: task.projectId,
      taskId: task.id,
      timestamp: formatTimestamp(task.dueDate, 11, 30),
      details: `Giao cho ${task.assignedToName}`,
    });
  });

  roadmap.forEach((version) => {
    activities.push({
      id: `ACT-${version.id}-version`,
      type: version.status === "released" ? "version_released" : "version_planned",
      user: "Quản trị dự án",
      action:
        version.status === "released"
          ? "đã phát hành phiên bản"
          : "đã lên kế hoạch phiên bản",
      target: `${version.name} - ${version.projectName}`,
      projectId: version.projectId,
      timestamp: formatTimestamp(version.releaseDate, 16, 0),
      details: `${version.milestones.length} milestones liên kết`,
    });
  });

  return activities.sort(
    (a, b) => dayjs(b.timestamp).valueOf() - dayjs(a.timestamp).valueOf()
  );
};

const buildSampleData = () => {
  const startOfMonth = dayjs().startOf("month");
  const projects = buildProjects(startOfMonth);
  const projectMap = projects.reduce((acc, project) => {
    acc[project.id] = project;
    return acc;
  }, {});

  const tasks = buildTasks(startOfMonth).map((task) => ({
    ...task,
    projectName: projectMap[task.projectId]?.projectName || "Không xác định",
  }));

  const issues = buildIssues(startOfMonth).map((issue) => ({
    ...issue,
    project: projectMap[issue.projectId]?.projectName || "Không xác định",
  }));

  const events = [
    ...tasks.map((task) => ({
      id: `TASK-${task.id}`,
      title: `${task.taskName} (Task)`,
      date: task.dueDate,
      priority: PRIORITY_TO_EVENT[task.priority] || "normal",
      project: task.projectName,
      projectId: task.projectId,
      type: "task",
    })),
    ...issues.map((issue) => ({
      id: `ISSUE-${issue.id}`,
      title: `${issue.title} (Issue)`,
      date: issue.dueDate,
      priority: PRIORITY_TO_EVENT[issue.priority] || "normal",
      project: issue.project,
      projectId: issue.projectId,
      type: "issue",
    })),
  ];

  const roadmap = buildRoadmap(startOfMonth, projectMap, issues, tasks);
  const activities = buildActivities(projects, issues, tasks, roadmap);

  const proposals = buildProposals(startOfMonth, projectMap);
  const finance = buildFinanceTransactions(startOfMonth, projectMap);

  return {
    projects,
    tasks,
    issues,
    events,
    roadmap,
    activities,
    proposals,
    finance,
  };
};

const ensureSampleData = () => {
  if (!cachedData) {
    cachedData = buildSampleData();
  }
  return cachedData;
};

export const getSampleProjects = () => ensureSampleData().projects;
export const getSampleTasks = () => ensureSampleData().tasks;
export const getSampleIssues = () => ensureSampleData().issues;
export const getSampleCalendarEvents = () => ensureSampleData().events;
export const getSampleRoadmap = () => ensureSampleData().roadmap;
export const getSampleActivities = () => ensureSampleData().activities;
export const getSampleProposals = () => ensureSampleData().proposals;
export const getSampleFinanceTransactions = () => ensureSampleData().finance;
export const getWorkflowSampleData = () => ensureSampleData();

