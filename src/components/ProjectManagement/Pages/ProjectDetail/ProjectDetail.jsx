import React from "react";
import { useParams } from "react-router-dom";
import { Card, Descriptions, Tag, Space } from "antd";
import "./ProjectDetail.css";

const ProjectDetail = () => {
  const { id } = useParams();

  return (
    <div className="project-detail-container">
      <Card title={`Chi tiết dự án #${id}`}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Mã dự án">PRJ001</Descriptions.Item>
          <Descriptions.Item label="Tên dự án">Dự án mẫu</Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Tag color="processing">Đang thực hiện</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Độ ưu tiên">
            <Tag color="orange">Cao</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Quản lý dự án">Nguyễn Văn A</Descriptions.Item>
          <Descriptions.Item label="Tiến độ">75%</Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};

export default ProjectDetail;









