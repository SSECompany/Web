import {
  ClockCircleOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  StopOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Progress,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { getUserInfo } from "../../../store/selectors/Selectors";

const { TextArea } = Input;
const { Option } = Select;
const { Text, Title } = Typography;

const TimeTracking = ({
  taskId,
  estimatedHours = 0,
  spentHours = 0,
  allowTracking = true,
}) => {
  const userInfo = useSelector(getUserInfo);
  const [isTracking, setIsTracking] = useState(false);
  const [currentSession, setCurrentSession] = useState({
    startTime: null,
    elapsedTime: 0,
  });
  const [timeEntries, setTimeEntries] = useState([]);
  const [isLogTimeModalOpen, setIsLogTimeModalOpen] = useState(false);
  const [logTimeForm] = Form.useForm();

  // Sample time entries data
  const sampleEntries = [
    {
      id: 1,
      user: "Nguyễn Văn A",
      hours: 2.5,
      activity: "Development",
      date: "2024-01-15",
      comment: "Implement user authentication feature",
    },
    {
      id: 2,
      user: "Trần Thị B",
      hours: 1.0,
      activity: "Testing",
      date: "2024-01-14",
      comment: "Test login functionality",
    },
    {
      id: 3,
      user: "Lê Văn C",
      hours: 0.5,
      activity: "Code Review",
      date: "2024-01-13",
      comment: "Review authentication code",
    },
  ];

  useEffect(() => {
    setTimeEntries(sampleEntries);
  }, [taskId]);

  // Timer effect
  useEffect(() => {
    let interval;
    if (isTracking) {
      interval = setInterval(() => {
        setCurrentSession((prev) => ({
          ...prev,
          elapsedTime: prev.elapsedTime + 1,
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking]);

  const startTracking = () => {
    setIsTracking(true);
    setCurrentSession({
      startTime: new Date(),
      elapsedTime: 0,
    });
  };

  const pauseTracking = () => {
    setIsTracking(false);
  };

  const stopTracking = () => {
    if (currentSession.elapsedTime > 0) {
      setIsLogTimeModalOpen(true);
      logTimeForm.setFieldsValue({
        hours: (currentSession.elapsedTime / 3600).toFixed(2),
        date: dayjs(),
        activity: "Development",
      });
    }
    setIsTracking(false);
    setCurrentSession({ startTime: null, elapsedTime: 0 });
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleLogTime = async (values) => {
    try {
      const newEntry = {
        id: Date.now(),
        user: userInfo.fullName || userInfo.userName,
        hours: parseFloat(values.hours),
        activity: values.activity,
        date: values.date.format("YYYY-MM-DD"),
        comment: values.comment || "",
      };

      setTimeEntries([newEntry, ...timeEntries]);
      setIsLogTimeModalOpen(false);
      logTimeForm.resetFields();

      // TODO: API call to save time entry
      console.log("Saving time entry:", newEntry);
    } catch (error) {
      console.error("Error logging time:", error);
    }
  };

  const columns = [
    {
      title: "Người dùng",
      dataIndex: "user",
      key: "user",
      width: 150,
    },
    {
      title: "Thời gian (h)",
      dataIndex: "hours",
      key: "hours",
      width: 100,
      render: (hours) => <Text strong>{hours}h</Text>,
    },
    {
      title: "Hoạt động",
      dataIndex: "activity",
      key: "activity",
      width: 120,
      render: (activity) => {
        const colors = {
          Development: "blue",
          Testing: "green",
          "Code Review": "purple",
          Documentation: "orange",
          Meeting: "cyan",
        };
        return <Tag color={colors[activity] || "default"}>{activity}</Tag>;
      },
    },
    {
      title: "Ngày",
      dataIndex: "date",
      key: "date",
      width: 100,
    },
    {
      title: "Ghi chú",
      dataIndex: "comment",
      key: "comment",
      ellipsis: true,
    },
  ];

  const activities = [
    "Development",
    "Testing",
    "Code Review",
    "Documentation",
    "Meeting",
    "Planning",
    "Bug Fixing",
    "Research",
  ];

  const totalSpent = timeEntries.reduce((sum, entry) => sum + entry.hours, 0);
  const progressPercent =
    estimatedHours > 0 ? (totalSpent / estimatedHours) * 100 : 0;

  return (
    <div>
      {/* Time Summary */}
      <Card title="⏱️ Theo dõi thời gian" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="Ước tính"
              value={estimatedHours}
              suffix="h"
              valueStyle={{ color: "#1890ff" }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Đã dùng"
              value={totalSpent}
              suffix="h"
              valueStyle={{
                color: progressPercent > 100 ? "#ff4d4f" : "#52c41a",
              }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Còn lại"
              value={Math.max(0, estimatedHours - totalSpent)}
              suffix="h"
              valueStyle={{ color: "#722ed1" }}
            />
          </Col>
          <Col span={6}>
            <div>
              <Text strong>Tiến độ</Text>
              <Progress
                percent={Math.min(100, progressPercent)}
                status={progressPercent > 100 ? "exception" : "active"}
                size="small"
              />
            </div>
          </Col>
        </Row>

        {allowTracking && (
          <div style={{ marginTop: 16 }}>
            <Space>
              {!isTracking ? (
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  onClick={startTracking}
                >
                  Bắt đầu
                </Button>
              ) : (
                <>
                  <Button
                    icon={<PauseCircleOutlined />}
                    onClick={pauseTracking}
                  >
                    Tạm dừng
                  </Button>
                  <Button danger icon={<StopOutlined />} onClick={stopTracking}>
                    Dừng & Ghi lại
                  </Button>
                </>
              )}

              <Button
                icon={<ClockCircleOutlined />}
                onClick={() => setIsLogTimeModalOpen(true)}
              >
                Ghi thời gian thủ công
              </Button>

              {isTracking && (
                <Text strong style={{ marginLeft: 16 }}>
                  ⏱️ {formatTime(currentSession.elapsedTime)}
                </Text>
              )}
            </Space>
          </div>
        )}
      </Card>

      {/* Time Entries Table */}
      <Card title="📊 Lịch sử thời gian">
        <Table
          columns={columns}
          dataSource={timeEntries}
          rowKey="id"
          size="small"
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total) => `Tổng ${total} entries`,
          }}
        />
      </Card>

      {/* Log Time Modal */}
      <Modal
        title="⏰ Ghi nhận thời gian"
        open={isLogTimeModalOpen}
        onCancel={() => {
          setIsLogTimeModalOpen(false);
          logTimeForm.resetFields();
        }}
        onOk={() => logTimeForm.submit()}
        width={500}
      >
        <Form form={logTimeForm} layout="vertical" onFinish={handleLogTime}>
          <Form.Item
            label="Thời gian (giờ)"
            name="hours"
            rules={[
              { required: true, message: "Vui lòng nhập thời gian" },
              {
                type: "number",
                min: 0.1,
                max: 24,
                message: "Thời gian từ 0.1 đến 24 giờ",
              },
            ]}
          >
            <InputNumber
              style={{ width: "100%" }}
              step={0.5}
              placeholder="Ví dụ: 2.5"
            />
          </Form.Item>

          <Form.Item
            label="Ngày"
            name="date"
            rules={[{ required: true, message: "Vui lòng chọn ngày" }]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            label="Hoạt động"
            name="activity"
            rules={[{ required: true, message: "Vui lòng chọn hoạt động" }]}
          >
            <Select placeholder="Chọn hoạt động">
              {activities.map((activity) => (
                <Option key={activity} value={activity}>
                  {activity}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Ghi chú" name="comment">
            <TextArea rows={3} placeholder="Mô tả công việc đã thực hiện..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TimeTracking;

