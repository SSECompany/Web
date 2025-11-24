import dayjs from "dayjs";

/**
 * Calculate critical path for tasks based on dependencies
 * @param {Array} tasks - Array of tasks
 * @param {Array} dependencies - Array of dependencies
 * @returns {Object} - Critical path data
 */
export const calculateCriticalPath = (tasks, dependencies) => {
  if (!tasks || !dependencies || dependencies.length === 0) {
    return { criticalPath: [], totalDuration: 0 };
  }

  // Build dependency graph
  const graph = {};
  const inDegree = {};
  const taskMap = {};

  tasks.forEach((task) => {
    taskMap[task.id] = task;
    graph[task.id] = [];
    inDegree[task.id] = 0;
  });

  dependencies.forEach((dep) => {
    if (dep.type === "blocks" || dep.type === "depends_on") {
      const fromTask = dep.task?.id || dep.fromTaskId;
      const toTask = dep.dependentTask?.id || dep.toTaskId || dep.taskId;
      
      if (graph[fromTask] && taskMap[toTask]) {
        graph[fromTask].push({
          to: toTask,
          type: dep.type,
        });
        inDegree[toTask] = (inDegree[toTask] || 0) + 1;
      }
    }
  });

  // Topological sort with longest path (critical path)
  const queue = [];
  const earliestStart = {};
  const latestStart = {};
  const predecessors = {};

  // Initialize
  tasks.forEach((task) => {
    if (inDegree[task.id] === 0) {
      queue.push(task.id);
      earliestStart[task.id] = task.startDate
        ? dayjs(task.startDate)
        : dayjs();
    } else {
      earliestStart[task.id] = dayjs(0);
    }
    latestStart[task.id] = dayjs(0);
    predecessors[task.id] = null;
  });

  // Calculate earliest start times
  const processed = new Set();
  while (queue.length > 0) {
    const currentId = queue.shift();
    processed.add(currentId);
    const currentTask = taskMap[currentId];
    const currentStart = earliestStart[currentId];
    const duration = currentTask.estimatedHours
      ? Math.ceil(currentTask.estimatedHours / 8)
      : 1;
    const currentEnd = currentStart.add(duration, "day");

    graph[currentId].forEach((edge) => {
      const nextId = edge.to;
      if (!processed.has(nextId)) {
        const nextStart = earliestStart[nextId];
        if (currentEnd.isAfter(nextStart) || nextStart.isSame(dayjs(0))) {
          earliestStart[nextId] = currentEnd;
          predecessors[nextId] = currentId;
        }
        inDegree[nextId]--;
        if (inDegree[nextId] === 0) {
          queue.push(nextId);
        }
      }
    });
  }

  // Find tasks with no outgoing edges (end tasks)
  const endTasks = tasks.filter(
    (task) => graph[task.id].length === 0 || processed.has(task.id)
  );

  // Calculate latest start times (backward pass)
  const latestEnd = {};
  endTasks.forEach((task) => {
    const duration = task.estimatedHours
      ? Math.ceil(task.estimatedHours / 8)
      : 1;
    const endTime = earliestStart[task.id].add(duration, "day");
    latestEnd[task.id] = endTime;
    latestStart[task.id] = earliestStart[task.id];
  });

  // Backward pass
  const reverseQueue = [...endTasks.map((t) => t.id)];
  const reverseProcessed = new Set();

  while (reverseQueue.length > 0) {
    const currentId = reverseQueue.shift();
    reverseProcessed.add(currentId);
    const currentTask = taskMap[currentId];
    const currentLatestEnd = latestEnd[currentId];

    // Find tasks that depend on this task
    dependencies.forEach((dep) => {
      const fromTask = dep.task?.id || dep.fromTaskId;
      const toTask = dep.dependentTask?.id || dep.toTaskId || dep.taskId;

      if (toTask === currentId && graph[fromTask]) {
        const duration = currentTask.estimatedHours
          ? Math.ceil(currentTask.estimatedHours / 8)
          : 1;
        const requiredStart = currentLatestEnd.subtract(duration, "day");

        if (
          !latestEnd[fromTask] ||
          requiredStart.isBefore(latestEnd[fromTask].subtract(duration, "day"))
        ) {
          latestEnd[fromTask] = requiredStart.add(duration, "day");
          latestStart[fromTask] = requiredStart;
        }

        if (!reverseProcessed.has(fromTask)) {
          reverseQueue.push(fromTask);
        }
      }
    });
  }

  // Identify critical path (tasks where earliestStart === latestStart)
  const criticalPath = [];
  tasks.forEach((task) => {
    const es = earliestStart[task.id];
    const ls = latestStart[task.id];
    if (es && ls && es.isSame(ls)) {
      criticalPath.push({
        taskId: task.id,
        taskName: task.taskName,
        startDate: es.format("YYYY-MM-DD"),
        endDate: es
          .add(
            task.estimatedHours ? Math.ceil(task.estimatedHours / 8) : 1,
            "day"
          )
          .format("YYYY-MM-DD"),
        duration: task.estimatedHours
          ? Math.ceil(task.estimatedHours / 8)
          : 1,
      });
    }
  });

  // Calculate total duration
  const totalDuration = criticalPath.reduce(
    (sum, task) => sum + task.duration,
    0
  );

  return {
    criticalPath: criticalPath.sort((a, b) =>
      dayjs(a.startDate).diff(dayjs(b.startDate))
    ),
    totalDuration,
    earliestStart,
    latestStart,
    predecessors,
  };
};

/**
 * Check if task can be started (all dependencies resolved)
 * @param {Object} task - Task object
 * @param {Array} dependencies - Array of dependencies
 * @param {Array} allTasks - All tasks
 * @returns {Object} - { canStart: boolean, blockingTasks: Array }
 */
export const checkTaskDependencies = (task, dependencies, allTasks) => {
  if (!dependencies || dependencies.length === 0) {
    return { canStart: true, blockingTasks: [] };
  }

  const blockingTasks = [];
  const taskDeps = dependencies.filter(
    (dep) =>
      (dep.dependentTask?.id || dep.toTaskId || dep.taskId) === task.id &&
      (dep.type === "blocks" || dep.type === "depends_on")
  );

  taskDeps.forEach((dep) => {
    const blockingTaskId = dep.task?.id || dep.fromTaskId;
    const blockingTask = allTasks.find((t) => t.id === blockingTaskId);
    
    if (blockingTask) {
      const isCompleted =
        blockingTask.status === "COMPLETED" ||
        blockingTask.status === "DONE" ||
        blockingTask.status === "RESOLVED" ||
        blockingTask.status === "CLOSED";

      if (!isCompleted) {
        blockingTasks.push({
          id: blockingTask.id,
          name: blockingTask.taskName,
          status: blockingTask.status,
        });
      }
    }
  });

  return {
    canStart: blockingTasks.length === 0,
    blockingTasks,
  };
};

/**
 * Get dependency chain for a task
 * @param {String} taskId - Task ID
 * @param {Array} dependencies - Array of dependencies
 * @returns {Array} - Dependency chain
 */
export const getDependencyChain = (taskId, dependencies) => {
  const chain = [];
  const visited = new Set();

  const traverse = (currentId, path) => {
    if (visited.has(currentId)) return;
    visited.add(currentId);

    const deps = dependencies.filter(
      (dep) =>
        (dep.dependentTask?.id || dep.toTaskId || dep.taskId) === currentId
    );

    deps.forEach((dep) => {
      const fromId = dep.task?.id || dep.fromTaskId;
      if (fromId && !path.includes(fromId)) {
        const newPath = [...path, fromId];
        chain.push({
          from: fromId,
          to: currentId,
          type: dep.type,
          path: newPath,
        });
        traverse(fromId, newPath);
      }
    });
  };

  traverse(taskId, []);
  return chain;
};






