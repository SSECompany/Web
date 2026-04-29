import { CalendarOutlined, TagOutlined } from "@ant-design/icons";
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
} from "antd";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
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
          </Col>
        </Row>

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
                  {version.milestones.map((milestone) => (
                    <Timeline.Item
                      key={milestone.id}
                      color={milestone.completed ? "green" : "blue"}
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
                  ))}
                </Timeline>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );
};

export default RoadmapView;


