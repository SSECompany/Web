import React from "react";
import { useParams } from "react-router-dom";
import { Card, Timeline, Button, Input } from "antd";
import { MessageOutlined } from "@ant-design/icons";

const { TextArea } = Input;

const ProjectCommunications = () => {
  const { id } = useParams();

  return (
    <div style={{ padding: 24 }}>
      <Card title={`Trao đổi dự án #${id}`}>
        <Timeline>
          <Timeline.Item>
            <p><strong>Nguyễn Văn A</strong> - 2024-01-15 10:30</p>
            <p>Dự án đang tiến triển tốt, cần tăng cường nhân lực.</p>
          </Timeline.Item>
          <Timeline.Item>
            <p><strong>Trần Thị B</strong> - 2024-01-14 14:20</p>
            <p>Đã hoàn thành phase 1, chuẩn bị chuyển sang phase 2.</p>
          </Timeline.Item>
        </Timeline>
        
        <div style={{ marginTop: 24, border: "1px solid #d9d9d9", padding: 16, borderRadius: 8 }}>
          <TextArea rows={3} placeholder="Nhập tin nhắn..." />
          <div style={{ marginTop: 8, textAlign: "right" }}>
            <Button type="primary" icon={<MessageOutlined />}>
              Gửi
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProjectCommunications;









