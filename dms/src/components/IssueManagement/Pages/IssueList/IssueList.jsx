import {
  BugOutlined,
  CheckSquareOutlined,
  FileTextOutlined,
  FilterOutlined,
  PlusOutlined,
  SearchOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Input,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ISSUE_PRIORITIES,
  ISSUE_STATUSES,
  ISSUE_TYPES,
} from "../../../TaskManagement/Types/IssueTypes";
import { getSampleIssues } from "../../../WorkflowApp/utils/workflowSampleData";
import AdvancedFilters from "../../Components/AdvancedFilters/AdvancedFilters";
import "./IssueList.css";

const { Title } = Typography;
const { Option } = Select;

const IssueList = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    search: "",
    type: "",
    status: "",
    priority: "",
    assignee: "",
    project: "",
  });
  const [advancedFiltersVisible, setAdvancedFiltersVisible] = useState(false);

  // Sample data - replace with API call
  const [issues] = useState(() => getSampleIssues());

  const getIssueTypeIcon = (type) => {
    const icons = {
      BUG: <BugOutlined />,
      FEATURE: <ThunderboltOutlined />,
      TASK: <CheckSquareOutlined />,
      SUPPORT: <UserOutlined />,
      IMPROVEMENT: <ThunderboltOutlined />,
      DOCUMENTATION: <FileTextOutlined />,
    };
    return icons[type] || <FileTextOutlined />;
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 100,
      fixed: "left",
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      width: 120,
      render: (type) => {
        const issueType = ISSUE_TYPES[type];
        if (!issueType) return null;
        return (
          <Tag color={issueType.color} icon={getIssueTypeIcon(type)}>
            {issueType.namVn}
          </Tag>
        );
      },
    },
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
      render: (text, record) => (
        <Button
          type="link"
          style={{ padding: 0, height: "auto" }}
          onClick={() =>
            navigate(`/workflow/issue-management/issue/${record.key}`)
          }
        >
          {text}
        </Button>
      ),
    },
    {
      title: "Dự án",
      dataIndex: "project",
      key: "project",
      width: 150,
    },
    {
      title: "Ưu tiên",
      dataIndex: "priority",
      key: "priority",
      width: 120,
      render: (priority) => {
        const priorityObj = ISSUE_PRIORITIES[priority];
        if (!priorityObj) return null;
        return <Tag color={priorityObj.color}>{priorityObj.nameVn}</Tag>;
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status) => {
        const statusObj = ISSUE_STATUSES[status];
        if (!statusObj) return null;
        return <Tag color={statusObj.color}>{statusObj.nameVn}</Tag>;
      },
    },
    {
      title: "Người phụ trách",
      dataIndex: "assignee",
      key: "assignee",
      width: 150,
    },
    {
      title: "Hạn hoàn thành",
      dataIndex: "dueDate",
      key: "dueDate",
      width: 130,
      render: (date) =>
        date ? new Date(date).toLocaleDateString("vi-VN") : "-",
    },
    {
      title: "Tiến độ",
      dataIndex: "progress",
      key: "progress",
      width: 100,
      render: (progress) => `${progress}%`,
    },
  ];

  return (
    <div className="issue-list">
      <Card>
        <Row
          justify="space-between"
          align="middle"
          style={{ marginBottom: 16 }}
        >
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              📋 Quản lý Issues
            </Title>
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate("/workflow/issue-management/issue/new")}
              >
                Tạo Issue mới
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Filters */}
        <Card size="small" style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Input
                placeholder="Tìm kiếm..."
                prefix={<SearchOutlined />}
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
              />
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Select
                placeholder="Loại"
                style={{ width: "100%" }}
                allowClear
                value={filters.type}
                onChange={(value) => setFilters({ ...filters, type: value })}
              >
                {Object.values(ISSUE_TYPES).map((type) => (
                  <Option key={type.id} value={type.id.toUpperCase()}>
                    {type.namVn}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Select
                placeholder="Trạng thái"
                style={{ width: "100%" }}
                allowClear
                value={filters.status}
                onChange={(value) => setFilters({ ...filters, status: value })}
              >
                {Object.values(ISSUE_STATUSES).map((status) => (
                  <Option key={status.id} value={status.id.toUpperCase()}>
                    {status.nameVn}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Select
                placeholder="Ưu tiên"
                style={{ width: "100%" }}
                allowClear
                value={filters.priority}
                onChange={(value) =>
                  setFilters({ ...filters, priority: value })
                }
              >
                {Object.values(ISSUE_PRIORITIES).map((priority) => (
                  <Option key={priority.id} value={priority.id.toUpperCase()}>
                    {priority.nameVn}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Space>
                <Button
                  icon={<FilterOutlined />}
                  onClick={() => setAdvancedFiltersVisible(true)}
                >
                  Lọc nâng cao
                </Button>
                <Button onClick={() => setFilters({})}>Xóa bộ lọc</Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Issues Table */}
        <Table
          columns={columns}
          dataSource={issues}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} issues`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <AdvancedFilters
        visible={advancedFiltersVisible}
        onCancel={() => setAdvancedFiltersVisible(false)}
        onApply={(newFilters) => setFilters({ ...filters, ...newFilters })}
        filters={filters}
      />
    </div>
  );
};

export default IssueList;
