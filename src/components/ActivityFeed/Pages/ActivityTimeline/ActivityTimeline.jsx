import {
  BugOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CommentOutlined,
  EditOutlined,
  FileTextOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Avatar, Card, Col, Row, Select, Space, Timeline, Typography } from "antd";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getSampleActivities,
  getSampleProjects,
} from "../../../WorkflowApp/utils/workflowSampleData";
import "./ActivityTimeline.css";

const { Title, Text } = Typography;
const { Option } = Select;

const ActivityTimeline = () => {
  const { projectId, issueId } = useParams();
  const [filterType, setFilterType] = useState("all");
  const [projectFilter, setProjectFilter] = useState(projectId || "all");
  const projectOptions = useMemo(() => getSampleProjects(), []);
  const [activities] = useState(() => getSampleActivities());

  const getActivityTypeLabel = (type) => {
    const labels = {
      issue_created: "Tạo issue",
      issue_updated: "Cập nhật issue",
      issue_completed: "Hoàn thành issue",
      comment_added: "Thêm bình luận",
      wiki_updated: "Cập nhật wiki",
      time_entry_added: "Thêm thời gian",
      task_assigned: "Giao công việc",
      version_released: "Phát hành phiên bản",
      version_planned: "Kế hoạch phiên bản",
    };
    return labels[type] || type;
  };

  const getActivityIcon = (type) => {
    const icons = {
      issue_created: <BugOutlined />,
      issue_updated: <EditOutlined />,
      issue_completed: <CheckCircleOutlined />,
      comment_added: <CommentOutlined />,
      wiki_updated: <FileTextOutlined />,
      time_entry_added: <ClockCircleOutlined />,
      task_assigned: <UserOutlined />,
      version_released: <CheckCircleOutlined />,
      version_planned: <FileTextOutlined />,
    };
    return icons[type] || <UserOutlined />;
  };

  const getActivityColor = (type) => {
    const colors = {
      issue_created: "#1677ff",
      issue_updated: "#fa8c16",
      issue_completed: "#52c41a",
      comment_added: "#13c2c2",
      wiki_updated: "#722ed1",
      time_entry_added: "#1890ff",
      task_assigned: "#2f54eb",
      version_released: "#52c41a",
      version_planned: "#8c8c8c",
    };
    return colors[type] || "#8c8c8c";
  };

  const filteredActivities = activities
    .filter((activity) =>
      filterType === "all" ? true : activity.type === filterType
    )
    .filter((activity) =>
      projectFilter === "all" ? true : activity.projectId === projectFilter
    )
    .filter((activity) => (issueId ? activity.issueId === issueId : true));

  return (
    <div className="activity-timeline">
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              📊 Dòng thời gian hoạt động
            </Title>
          </Col>
          <Col>
            <Space>
              <Select
                value={projectFilter}
                onChange={setProjectFilter}
                style={{ width: 220 }}
              >
                <Option value="all">Tất cả dự án</Option>
                {projectOptions.map((project) => (
                  <Option key={project.id} value={project.id}>
                    {project.projectName}
                  </Option>
                ))}
              </Select>
              <Select
                value={filterType}
                onChange={setFilterType}
                style={{ width: 200 }}
              >
                <Option value="all">Tất cả</Option>
                <Option value="issue_created">Tạo issue</Option>
                <Option value="issue_updated">Cập nhật issue</Option>
                <Option value="issue_completed">Hoàn thành issue</Option>
                <Option value="comment_added">Bình luận</Option>
                <Option value="wiki_updated">Wiki</Option>
                <Option value="time_entry_added">Thời gian</Option>
                <Option value="task_assigned">Giao việc</Option>
                <Option value="version_released">Phát hành phiên bản</Option>
                <Option value="version_planned">Kế hoạch phiên bản</Option>
              </Select>
            </Space>
          </Col>
        </Row>

        <Timeline mode="left">
          {filteredActivities.map((activity) => (
            <Timeline.Item
              key={activity.id}
              dot={
                <Avatar
                  style={{
                    backgroundColor: getActivityColor(activity.type),
                    border: "2px solid #fff",
                  }}
                  icon={getActivityIcon(activity.type)}
                  size="small"
                />
              }
            >
              <div className="activity-item">
                <div>
                  <Text strong>{activity.user}</Text>
                  <Text> {activity.action}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {activity.timestamp}
                  </Text>
                </div>
                <div style={{ marginTop: 8 }}>
                  <Text>{activity.target}</Text>
                  {activity.details && (
                    <>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {activity.details}
                      </Text>
                    </>
                  )}
                </div>
              </div>
            </Timeline.Item>
          ))}
        </Timeline>
      </Card>
    </div>
  );
};

export default ActivityTimeline;


