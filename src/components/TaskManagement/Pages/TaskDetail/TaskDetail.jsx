import React from "react";
import { useParams } from "react-router-dom";
import { Card, Descriptions, Tag, Progress, Timeline, Button, Space } from "antd";
import { EditOutlined, UserAddOutlined } from "@ant-design/icons";

const TaskDetail = () => {
  const { id } = useParams();

  return (
    <div style={{ padding: 24 }}>
      <Card 
        title={`Chi tiết công việc #${id}`}
        extra={
          <Space>
            <Button icon={<EditOutlined />}>Chỉnh sửa</Button>
            <Button type="primary" icon={<UserAddOutlined />}>Giao việc</Button>
          </Space>
        }
      >
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Mã công việc">TASK001</Descriptions.Item>
          <Descriptions.Item label="Tên công việc">Phát triển tính năng đăng nhập</Descriptions.Item>
          <Descriptions.Item label="Dự án">Dự án A</Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Tag color="processing">Đang thực hiện</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Độ ưu tiên">
            <Tag color="orange">Cao</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Người thực hiện">Nguyễn Văn A</Descriptions.Item>
          <Descriptions.Item label="Ngày tạo">15/01/2024</Descriptions.Item>
          <Descriptions.Item label="Ngày hết hạn">25/01/2024</Descriptions.Item>
          <Descriptions.Item label="Tiến độ" span={2}>
            <Progress percent={75} />
          </Descriptions.Item>
          <Descriptions.Item label="Mô tả" span={2}>
            Phát triển tính năng đăng nhập cho hệ thống, bao gồm authentication và authorization
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Lịch sử thay đổi" style={{ marginTop: 16 }}>
        <Timeline>
          <Timeline.Item color="green">
            <p><strong>25/01/2024 14:30</strong> - Cập nhật tiến độ 75%</p>
            <p>Đã hoàn thành phần authentication</p>
          </Timeline.Item>
          <Timeline.Item color="blue">
            <p><strong>20/01/2024 09:15</strong> - Giao việc cho Nguyễn Văn A</p>
          </Timeline.Item>
          <Timeline.Item>
            <p><strong>15/01/2024 10:00</strong> - Tạo công việc</p>
          </Timeline.Item>
        </Timeline>
      </Card>
    </div>
  );
};

export default TaskDetail;









