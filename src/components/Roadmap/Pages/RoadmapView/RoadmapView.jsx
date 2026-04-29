import {
  CalendarOutlined,
  TagOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import {
  Card,
  Col,
  Progress,
  Row,
  Select,
  Space,
  Tag,
  Timeline,
  Typography,
  Segmented,
  Tooltip,
} from "antd";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import dayjs from "dayjs";
import {
  getSampleProjects,
  getSampleRoadmap,
} from "../../../WorkflowApp/utils/workflowSampleData";
import "./RoadmapView.css";

const { Title, Text } = Typography;
const { Option } = Select;

const RoadmapView = () => {
  const { projectId } = useParams();
  const [selectedProject, setSelectedProject] = useState(projectId || "all");
  const [viewMode, setViewMode] = useState("vertical"); // "vertical" | "horizontal"
  const sampleProjects = useMemo(() => getSampleProjects(), []);
  const roadmap = useMemo(() => getSampleRoadmap(), []);

  const filteredVersions =
    selectedProject === "all"
      ? roadmap
      : roadmap.filter((version) => version.projectId === selectedProject);

  const getStatusColor = (status) => {
    const colors = {
      released: "success",
      in_progress: "processing",
      planned: "default",
    };
    return colors[status] || "default";
  };

  // Color coding cho milestones dựa trên progress và status
  const getMilestoneColor = (milestone) => {
    const progress = (milestone.completedIssues / milestone.issues) * 100;
    
    if (milestone.completed) {
      return "#52c41a"; // Green - Hoàn thành
    } else if (progress >= 75) {
      return "#1890ff"; // Blue - Gần hoàn thành
    } else if (progress >= 50) {
      return "#faad14"; // Orange - Đang tiến triển
    } else if (progress >= 25) {
      return "#fa8c16"; // Orange - Bắt đầu
    } else {
      return "#d9d9d9"; // Gray - Chưa bắt đầu
    }
  };

  const getMilestonePriority = (milestone) => {
    const progress = (milestone.completedIssues / milestone.issues) * 100;
    if (milestone.completed) return "completed";
    if (progress >= 75) return "high";
    if (progress >= 50) return "medium";
    if (progress >= 25) return "low";
    return "pending";
  };

  // Tính toán date range cho horizontal view
  const getDateRange = () => {
    if (filteredVersions.length === 0) return { min: dayjs(), max: dayjs() };
    
    const allDates = filteredVersions.flatMap((version) =>
      version.milestones.map((m) => dayjs(m.date))
    );
    
    if (allDates.length === 0) return { min: dayjs(), max: dayjs() };
    
    // Tìm min và max bằng cách so sánh timestamps
    const timestamps = allDates.map((d) => d.valueOf());
    const minTimestamp = Math.min(...timestamps);
    const maxTimestamp = Math.max(...timestamps);
    
    const minDate = dayjs(minTimestamp);
    const maxDate = dayjs(maxTimestamp);
    
    // Thêm padding 5 ngày mỗi bên để dễ nhìn
    return { 
      min: minDate.subtract(5, "day"), 
      max: maxDate.add(5, "day") 
    };
  };

  const dateRange = getDateRange();
  const totalDays = dateRange.max.diff(dateRange.min, "day") || 1;

  return (
    <div className="roadmap-view">
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              🗺️ Roadmap
            </Title>
          </Col>
          <Col>
            <Space>
              <Segmented
                value={viewMode}
                onChange={setViewMode}
                options={[
                  {
                    label: "Dọc",
                    value: "vertical",
                    icon: <UnorderedListOutlined />,
                  },
                  {
                    label: "Ngang",
                    value: "horizontal",
                    icon: <AppstoreOutlined />,
                  },
                ]}
              />
              <Select
                value={selectedProject}
                onChange={setSelectedProject}
                style={{ width: 220 }}
              >
                <Option value="all">Tất cả dự án</Option>
                {sampleProjects.map((project) => (
                  <Option key={project.id} value={project.id}>
                    {project.projectName}
                  </Option>
                ))}
              </Select>
            </Space>
          </Col>
        </Row>

        {viewMode === "vertical" ? (
          <Row gutter={[16, 16]}>
            {filteredVersions.map((version) => (
              <Col xs={24} lg={8} key={version.id}>
                <Card
                  title={
                    <Space>
                      <TagOutlined />
                      <span>{version.name}</span>
                      <Tag color={getStatusColor(version.status)}>
                        {version.status === "released"
                          ? "Đã phát hành"
                          : version.status === "in_progress"
                          ? "Đang phát triển"
                          : "Đã lên kế hoạch"}
                      </Tag>
                    </Space>
                  }
                  extra={
                    <Space>
                      <CalendarOutlined />
                      <Text type="secondary">
                        {new Date(version.releaseDate).toLocaleDateString("vi-VN")}
                      </Text>
                    </Space>
                  }
                  style={{ height: "100%" }}
                >
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Dự án: {version.projectName}
                  </Text>
                  <div style={{ margin: "12px 0" }}>
                    <strong>{version.milestones.length}</strong> milestones liên
                    kết
                  </div>
                  <Timeline>
                    {version.milestones.map((milestone) => {
                      const milestoneColor = getMilestoneColor(milestone);
                      const priority = getMilestonePriority(milestone);
                      return (
                        <Timeline.Item
                          key={milestone.id}
                          color={milestoneColor}
                          className={`milestone-priority-${priority}`}
                        >
                          <div>
                            <Text strong>{milestone.name}</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {new Date(milestone.date).toLocaleDateString("vi-VN")}
                            </Text>
                            <div style={{ marginTop: 8 }}>
                              <Progress
                                percent={
                                  (milestone.completedIssues / milestone.issues) * 100
                                }
                                size="small"
                                strokeColor={milestoneColor}
                                status={milestone.completed ? "success" : "active"}
                              />
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {milestone.completedIssues}/{milestone.issues} issues
                              </Text>
                              {milestone.tasks > 0 && (
                                <Text
                                  type="secondary"
                                  style={{ display: "block", fontSize: 12 }}
                                >
                                  {milestone.completedTasks}/{milestone.tasks} tasks
                                </Text>
                              )}
                            </div>
                            {milestone.relatedIssues?.length > 0 && (
                              <div className="milestone-links">
                                {milestone.relatedIssues.map((issue) => (
                                  <Tag key={issue.id} color="blue">
                                    {issue.id}
                                  </Tag>
                                ))}
                              </div>
                            )}
                          </div>
                        </Timeline.Item>
                      );
                    })}
                  </Timeline>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <div className="roadmap-horizontal-view">
            {/* Timeline header */}
            <div className="timeline-header">
              <div className="timeline-labels">
                <div className="timeline-label-left">Dự án / Version</div>
                <div className="timeline-label-right">
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {dateRange.min.format("DD/MM/YYYY")} - {dateRange.max.format("DD/MM/YYYY")}
                  </Text>
                </div>
              </div>
              {/* Date scale */}
              <div className="timeline-scale">
                {Array.from({ length: Math.min(totalDays + 1, 20) }).map((_, i) => {
                  const date = dateRange.min.add(
                    Math.floor((totalDays / Math.min(totalDays, 19)) * i),
                    "day"
                  );
                  return (
                    <div
                      key={i}
                      className="timeline-scale-item"
                      style={{
                        left: `${(i / Math.min(totalDays, 19)) * 100}%`,
                      }}
                    >
                      <div className="scale-line" />
                      <Text style={{ fontSize: 11 }}>
                        {date.format("DD/MM")}
                      </Text>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Timeline content */}
            <div className="timeline-content">
              {filteredVersions.map((version) => (
                <div key={version.id} className="timeline-row">
                  <div className="timeline-row-label">
                    <Space direction="vertical" size={4}>
                      <Text strong>{version.name}</Text>
                      <Tag color={getStatusColor(version.status)} size="small">
                        {version.status === "released"
                          ? "Đã phát hành"
                          : version.status === "in_progress"
                          ? "Đang phát triển"
                          : "Đã lên kế hoạch"}
                      </Tag>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {version.projectName}
                      </Text>
                    </Space>
                  </div>
                  <div className="timeline-row-content">
                    {version.milestones.map((milestone) => {
                      const milestoneDate = dayjs(milestone.date);
                      const daysFromStart = milestoneDate.diff(dateRange.min, "day");
                      const leftPercent = (daysFromStart / totalDays) * 100;
                      const milestoneColor = getMilestoneColor(milestone);
                      const progress = (milestone.completedIssues / milestone.issues) * 100;
                      const priority = getMilestonePriority(milestone);

                      return (
                        <Tooltip
                          key={milestone.id}
                          title={
                            <div>
                              <div><strong>{milestone.name}</strong></div>
                              <div>Ngày: {milestoneDate.format("DD/MM/YYYY")}</div>
                              <div>Tiến độ: {progress.toFixed(0)}%</div>
                              <div>
                                Issues: {milestone.completedIssues}/{milestone.issues}
                              </div>
                            </div>
                          }
                        >
                          <div
                            className={`timeline-milestone milestone-priority-${priority}`}
                            style={{
                              left: `${Math.max(0, Math.min(100, leftPercent))}%`,
                              backgroundColor: milestoneColor,
                            }}
                          >
                            <div className="milestone-bar" />
                            <div className="milestone-label">
                              {milestone.name.length > 15
                                ? milestone.name.substring(0, 15) + "..."
                                : milestone.name}
                            </div>
                            <div
                              className="milestone-progress"
                              style={{
                                width: `${progress}%`,
                                backgroundColor:
                                  milestone.completed
                                    ? "rgba(255, 255, 255, 0.3)"
                                    : "rgba(0, 0, 0, 0.1)",
                              }}
                            />
                          </div>
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="timeline-legend">
              <Space>
                <Text strong style={{ fontSize: 12 }}>Chú thích:</Text>
                <div className="legend-item">
                  <div
                    className="legend-color"
                    style={{ backgroundColor: "#52c41a" }}
                  />
                  <Text style={{ fontSize: 12 }}>Hoàn thành</Text>
                </div>
                <div className="legend-item">
                  <div
                    className="legend-color"
                    style={{ backgroundColor: "#1890ff" }}
                  />
                  <Text style={{ fontSize: 12 }}>Gần hoàn thành (≥75%)</Text>
                </div>
                <div className="legend-item">
                  <div
                    className="legend-color"
                    style={{ backgroundColor: "#faad14" }}
                  />
                  <Text style={{ fontSize: 12 }}>Đang tiến triển (50-74%)</Text>
                </div>
                <div className="legend-item">
                  <div
                    className="legend-color"
                    style={{ backgroundColor: "#fa8c16" }}
                  />
                  <Text style={{ fontSize: 12 }}>Bắt đầu (25-49%)</Text>
                </div>
                <div className="legend-item">
                  <div
                    className="legend-color"
                    style={{ backgroundColor: "#d9d9d9" }}
                  />
                  <Text style={{ fontSize: 12 }}>Chưa bắt đầu (&lt;25%)</Text>
                </div>
              </Space>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default RoadmapView;


