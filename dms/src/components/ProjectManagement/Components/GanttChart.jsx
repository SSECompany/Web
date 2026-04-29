import {
  CalendarOutlined,
  ReloadOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from "@ant-design/icons";
import { Button, Card, DatePicker, Select, Space, Tag, Tooltip } from "antd";
import dayjs from "dayjs";
import { useRef, useState } from "react";

const { Option } = Select;
const { RangePicker } = DatePicker;

const GanttChart = ({ projectId, tasks = [], onTaskClick }) => {
  const [viewMode, setViewMode] = useState("month"); // day, week, month, quarter
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(1, "month"),
    dayjs().add(2, "months"),
  ]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const chartRef = useRef(null);

  // Sample Gantt data
  const sampleTasks = [
    {
      id: 1,
      name: "Phân tích yêu cầu",
      startDate: "2024-01-01",
      endDate: "2024-01-15",
      progress: 100,
      assignee: "Nguyễn Văn A",
      type: "analysis",
      priority: "high",
      dependencies: [],
      milestone: false,
    },
    {
      id: 2,
      name: "Thiết kế hệ thống",
      startDate: "2024-01-10",
      endDate: "2024-01-25",
      progress: 85,
      assignee: "Trần Thị B",
      type: "design",
      priority: "high",
      dependencies: [1],
      milestone: false,
    },
    {
      id: 3,
      name: "Phát triển Backend API",
      startDate: "2024-01-20",
      endDate: "2024-02-20",
      progress: 45,
      assignee: "Lê Văn C",
      type: "development",
      priority: "high",
      dependencies: [2],
      milestone: false,
    },
    {
      id: 4,
      name: "Phát triển Frontend",
      startDate: "2024-01-25",
      endDate: "2024-02-25",
      progress: 30,
      assignee: "Phạm Thị D",
      type: "development",
      priority: "medium",
      dependencies: [2],
      milestone: false,
    },
    {
      id: 5,
      name: "Testing & QA",
      startDate: "2024-02-20",
      endDate: "2024-03-10",
      progress: 0,
      assignee: "Hoàng Văn E",
      type: "testing",
      priority: "medium",
      dependencies: [3, 4],
      milestone: false,
    },
    {
      id: 6,
      name: "Release v1.0",
      startDate: "2024-03-15",
      endDate: "2024-03-15",
      progress: 0,
      assignee: "Project Manager",
      type: "milestone",
      priority: "critical",
      dependencies: [5],
      milestone: true,
    },
  ];

  const [ganttTasks, setGanttTasks] = useState(sampleTasks);

  // Generate time scale based on view mode
  const generateTimeScale = () => {
    const [start, end] = dateRange;
    const timeUnits = [];
    let current = start.clone();

    while (current.isBefore(end)) {
      let label, next;

      switch (viewMode) {
        case "day":
          label = current.format("DD/MM");
          next = current.add(1, "day");
          break;
        case "week":
          label = `W${current.week()}`;
          next = current.add(1, "week");
          break;
        case "month":
          label = current.format("MMM YYYY");
          next = current.add(1, "month");
          break;
        case "quarter":
          label = `Q${current.quarter()} ${current.format("YYYY")}`;
          next = current.add(1, "quarter");
          break;
        default:
          next = current.add(1, "day");
      }

      timeUnits.push({
        label,
        start: current.clone(),
        end: next.clone(),
        width: 100 * zoomLevel,
      });

      current = next;
    }

    return timeUnits;
  };

  const timeScale = generateTimeScale();
  const totalWidth = timeScale.reduce((sum, unit) => sum + unit.width, 0);

  // Calculate task bar position and width
  const getTaskBarStyle = (task) => {
    const taskStart = dayjs(task.startDate);
    const taskEnd = dayjs(task.endDate);
    const [rangeStart] = dateRange;

    // Calculate position
    const daysFromStart = taskStart.diff(rangeStart, "day");
    const taskDuration = taskEnd.diff(taskStart, "day") + 1;

    const dayWidth = totalWidth / dateRange[1].diff(dateRange[0], "day");
    const left = Math.max(0, daysFromStart * dayWidth);
    const width = Math.max(20, taskDuration * dayWidth);

    return {
      left: `${left}px`,
      width: `${width}px`,
      position: "absolute",
      height: "24px",
      borderRadius: "4px",
      display: "flex",
      alignItems: "center",
      fontSize: "11px",
      color: "white",
      fontWeight: "500",
      cursor: "pointer",
      zIndex: 2,
    };
  };

  // Get task color based on type and status
  const getTaskColor = (task) => {
    if (task.milestone) return "#ff4d4f";

    const colors = {
      analysis: "#722ed1",
      design: "#1890ff",
      development: "#52c41a",
      testing: "#fa8c16",
      deployment: "#13c2c2",
    };

    return colors[task.type] || "#595959";
  };

  // Check if task is overdue
  const isOverdue = (task) => {
    return dayjs().isAfter(dayjs(task.endDate)) && task.progress < 100;
  };

  // Render dependency lines
  const renderDependencies = () => {
    // This would be more complex in real implementation
    return null;
  };

  const handleTaskClick = (task) => {
    if (onTaskClick) {
      onTaskClick(task);
    }
  };

  const exportGantt = () => {
    // TODO: Export to PDF/PNG
    console.log("Exporting Gantt chart...");
  };

  return (
    <Card
      title="📊 Gantt Chart - Biểu đồ tiến độ dự án"
      extra={
        <Space>
          <Select
            value={viewMode}
            onChange={setViewMode}
            style={{ width: 100 }}
          >
            <Option value="day">Ngày</Option>
            <Option value="week">Tuần</Option>
            <Option value="month">Tháng</Option>
            <Option value="quarter">Quý</Option>
          </Select>

          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            format="DD/MM/YYYY"
          />

          <Button.Group>
            <Button
              icon={<ZoomOutOutlined />}
              onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))}
            />
            <Button
              icon={<ZoomInOutlined />}
              onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.25))}
            />
          </Button.Group>

          <Button
            icon={<ReloadOutlined />}
            onClick={() => setGanttTasks([...sampleTasks])}
          >
            Refresh
          </Button>

          <Button onClick={exportGantt}>Export</Button>
        </Space>
      }
    >
      <div style={{ overflow: "auto", maxHeight: "600px" }}>
        <div style={{ display: "flex", minWidth: `${totalWidth + 200}px` }}>
          {/* Task Names Column */}
          <div
            style={{
              width: "200px",
              flexShrink: 0,
              borderRight: "1px solid #f0f0f0",
            }}
          >
            {/* Header */}
            <div
              style={{
                height: "40px",
                display: "flex",
                alignItems: "center",
                padding: "0 8px",
                background: "#fafafa",
                borderBottom: "1px solid #f0f0f0",
                fontWeight: "600",
              }}
            >
              Tên công việc
            </div>

            {/* Task rows */}
            {ganttTasks.map((task) => (
              <div
                key={task.id}
                style={{
                  height: "40px",
                  display: "flex",
                  alignItems: "center",
                  padding: "0 8px",
                  borderBottom: "1px solid #f0f0f0",
                  background: task.milestone ? "#fff7e6" : "white",
                }}
              >
                <Space>
                  {task.milestone && (
                    <CalendarOutlined style={{ color: "#fa8c16" }} />
                  )}
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: task.milestone ? "600" : "normal",
                    }}
                  >
                    {task.name}
                  </span>
                  {isOverdue(task) && (
                    <Tag color="red" size="small">
                      Trễ hạn
                    </Tag>
                  )}
                </Space>
              </div>
            ))}
          </div>

          {/* Timeline Column */}
          <div style={{ flex: 1, position: "relative" }}>
            {/* Time scale header */}
            <div
              style={{
                height: "40px",
                display: "flex",
                background: "#fafafa",
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              {timeScale.map((unit, index) => (
                <div
                  key={index}
                  style={{
                    width: `${unit.width}px`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRight: "1px solid #f0f0f0",
                    fontSize: "11px",
                    fontWeight: "600",
                  }}
                >
                  {unit.label}
                </div>
              ))}
            </div>

            {/* Task bars */}
            {ganttTasks.map((task, rowIndex) => (
              <div
                key={task.id}
                style={{
                  height: "40px",
                  position: "relative",
                  borderBottom: "1px solid #f0f0f0",
                  background: rowIndex % 2 === 0 ? "#fafafa" : "white",
                }}
              >
                {/* Grid lines */}
                {timeScale.map((unit, colIndex) => (
                  <div
                    key={colIndex}
                    style={{
                      position: "absolute",
                      left: `${timeScale
                        .slice(0, colIndex + 1)
                        .reduce((sum, u) => sum + u.width, 0)}px`,
                      top: 0,
                      width: "1px",
                      height: "100%",
                      background: "#f0f0f0",
                    }}
                  />
                ))}

                {/* Task bar */}
                {!task.milestone ? (
                  <Tooltip
                    title={
                      <div>
                        <div>
                          <strong>{task.name}</strong>
                        </div>
                        <div>Người thực hiện: {task.assignee}</div>
                        <div>Tiến độ: {task.progress}%</div>
                        <div>
                          Từ {task.startDate} đến {task.endDate}
                        </div>
                      </div>
                    }
                  >
                    <div
                      style={{
                        ...getTaskBarStyle(task),
                        background: `linear-gradient(90deg, ${getTaskColor(
                          task
                        )} ${task.progress}%, rgba(0,0,0,0.1) ${
                          task.progress
                        }%)`,
                        border: isOverdue(task) ? "2px solid #ff4d4f" : "none",
                      }}
                      onClick={() => handleTaskClick(task)}
                    >
                      <div
                        style={{
                          padding: "0 4px",
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {task.progress}%
                      </div>
                    </div>
                  </Tooltip>
                ) : (
                  // Milestone diamond
                  <Tooltip
                    title={`Milestone: ${task.name} - ${task.startDate}`}
                  >
                    <div
                      style={{
                        ...getTaskBarStyle(task),
                        width: "16px",
                        height: "16px",
                        background: getTaskColor(task),
                        transform: "rotate(45deg)",
                        top: "12px",
                      }}
                      onClick={() => handleTaskClick(task)}
                    />
                  </Tooltip>
                )}
              </div>
            ))}

            {/* Dependency lines would go here */}
            {renderDependencies()}

            {/* Today line */}
            {(() => {
              const today = dayjs();
              const [rangeStart] = dateRange;
              const daysFromStart = today.diff(rangeStart, "day");
              const dayWidth =
                totalWidth / dateRange[1].diff(dateRange[0], "day");
              const todayPosition = daysFromStart * dayWidth;

              if (todayPosition >= 0 && todayPosition <= totalWidth) {
                return (
                  <div
                    style={{
                      position: "absolute",
                      left: `${todayPosition}px`,
                      top: "40px",
                      bottom: 0,
                      width: "2px",
                      background: "#ff4d4f",
                      zIndex: 10,
                      pointerEvents: "none",
                    }}
                  />
                );
              }
              return null;
            })()}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div
        style={{
          marginTop: "16px",
          padding: "12px",
          background: "#fafafa",
          borderRadius: "6px",
        }}
      >
        <Space wrap>
          <Space size="small">
            <div
              style={{
                width: "12px",
                height: "12px",
                background: "#722ed1",
                borderRadius: "2px",
              }}
            />
            <span style={{ fontSize: "12px" }}>Phân tích</span>
          </Space>
          <Space size="small">
            <div
              style={{
                width: "12px",
                height: "12px",
                background: "#1890ff",
                borderRadius: "2px",
              }}
            />
            <span style={{ fontSize: "12px" }}>Thiết kế</span>
          </Space>
          <Space size="small">
            <div
              style={{
                width: "12px",
                height: "12px",
                background: "#52c41a",
                borderRadius: "2px",
              }}
            />
            <span style={{ fontSize: "12px" }}>Phát triển</span>
          </Space>
          <Space size="small">
            <div
              style={{
                width: "12px",
                height: "12px",
                background: "#fa8c16",
                borderRadius: "2px",
              }}
            />
            <span style={{ fontSize: "12px" }}>Testing</span>
          </Space>
          <Space size="small">
            <div
              style={{
                width: "12px",
                height: "12px",
                background: "#ff4d4f",
                transform: "rotate(45deg)",
              }}
            />
            <span style={{ fontSize: "12px" }}>Milestone</span>
          </Space>
          <Space size="small">
            <div
              style={{ width: "2px", height: "12px", background: "#ff4d4f" }}
            />
            <span style={{ fontSize: "12px" }}>Hôm nay</span>
          </Space>
        </Space>
      </div>
    </Card>
  );
};

export default GanttChart;

