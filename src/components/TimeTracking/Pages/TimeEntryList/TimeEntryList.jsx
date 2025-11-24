import { ClockCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Card, Col, DatePicker, Row, Space, Table, Tag, Typography } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import "./TimeEntryList.css";

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

const TimeEntryList = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState([
    dayjs().startOf("week"),
    dayjs().endOf("week"),
  ]);

  // Sample data
  const [timeEntries, setTimeEntries] = useState([
    {
      key: "1",
      id: "TE-001",
      issue: "ISSUE-001",
      issueTitle: "Lỗi đăng nhập không hoạt động",
      project: "Website mới",
      activity: "Development",
      hours: 2.5,
      date: "2024-02-10",
      user: "Nguyễn Văn A",
      comment: "Đã sửa lỗi authentication",
    },
    {
      key: "2",
      id: "TE-002",
      issue: "ISSUE-002",
      issueTitle: "Thêm tính năng thanh toán",
      project: "Website mới",
      activity: "Development",
      hours: 4.0,
      date: "2024-02-11",
      user: "Trần Thị B",
      comment: "Implement payment gateway",
    },
    {
      key: "3",
      id: "TE-003",
      issue: "ISSUE-003",
      issueTitle: "Cập nhật tài liệu API",
      project: "API Documentation",
      activity: "Documentation",
      hours: 1.5,
      date: "2024-02-12",
      user: "Lê Văn C",
      comment: "Update API docs",
    },
  ]);

  const columns = [
    {
      title: "Ngày",
      dataIndex: "date",
      key: "date",
      width: 120,
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Dự án",
      dataIndex: "project",
      key: "project",
      width: 150,
    },
    {
      title: "Issue",
      dataIndex: "issue",
      key: "issue",
      width: 100,
      render: (issue, record) => (
        <a onClick={() => navigate(`/workflow/issue-management/issue/${record.key}`)}>
          {issue}
        </a>
      ),
    },
    {
      title: "Tiêu đề",
      dataIndex: "issueTitle",
      key: "issueTitle",
      ellipsis: true,
    },
    {
      title: "Hoạt động",
      dataIndex: "activity",
      key: "activity",
      width: 120,
      render: (activity) => <Tag color="blue">{activity}</Tag>,
    },
    {
      title: "Giờ",
      dataIndex: "hours",
      key: "hours",
      width: 80,
      render: (hours) => (
        <Tag color="green" icon={<ClockCircleOutlined />}>
          {hours}h
        </Tag>
      ),
    },
    {
      title: "Người thực hiện",
      dataIndex: "user",
      key: "user",
      width: 150,
    },
    {
      title: "Ghi chú",
      dataIndex: "comment",
      key: "comment",
      ellipsis: true,
    },
  ];

  const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0);

  return (
    <div className="time-entry-list">
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              ⏱️ Theo dõi thời gian
            </Title>
          </Col>
          <Col>
            <Space>
              <RangePicker
                value={dateRange}
                onChange={setDateRange}
                format="DD/MM/YYYY"
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate("/workflow/time-tracking/entry/new")}
              >
                Thêm thời gian
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Summary */}
        <Card size="small" style={{ marginBottom: 16, background: "#f0f2f5" }}>
          <Row gutter={16}>
            <Col span={8}>
              <div>
                <Text type="secondary">Tổng giờ: </Text>
                <Text strong style={{ fontSize: 18 }}>
                  {totalHours.toFixed(1)}h
                </Text>
              </div>
            </Col>
            <Col span={8}>
              <div>
                <Text type="secondary">Số entry: </Text>
                <Text strong>{timeEntries.length}</Text>
              </div>
            </Col>
            <Col span={8}>
              <div>
                <Text type="secondary">Trung bình/ngày: </Text>
                <Text strong>
                  {(totalHours / (dateRange[1].diff(dateRange[0], "day") + 1)).toFixed(1)}h
                </Text>
              </div>
            </Col>
          </Row>
        </Card>

        {/* Time Entries Table */}
        <Table
          columns={columns}
          dataSource={timeEntries}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} entries`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
};

export default TimeEntryList;

