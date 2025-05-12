import {
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  LeftOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { Button, Col, Row, Space, Table, Typography, message } from "antd";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./phieu-nhap-kho.css";

const { Title } = Typography;

const ListPhieuNhapKho = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([
    { id: 1, date: "01-Thg1", so: "1a", maKhach: "1a", tenKhach: "a" },
    { id: 2, date: "02-Thg2", so: "2a", maKhach: "2a", tenKhach: "b" },
    { id: 3, date: "03-Thg3", so: "3a", maKhach: "3a", tenKhach: "c" },
    { id: 4, date: "04-Thg4", so: "4a", maKhach: "4a", tenKhach: "d" },
  ]);

  const handleDelete = (id) => {
    // Xử lý xóa phiếu
    setData(data.filter((item) => item.id !== id));
    message.success("Xóa phiếu thành công");
  };

  const columns = [
    {
      title: "STT",
      key: "stt",
      render: (_, __, index) => index + 1,
      width: 60,
      align: "center",
    },
    {
      title: "Ngày",
      dataIndex: "date",
      key: "date",
      align: "center",
    },
    {
      title: "Số",
      dataIndex: "so",
      key: "so",
      align: "center",
    },
    {
      title: "Mã khách",
      dataIndex: "maKhach",
      key: "maKhach",
      align: "center",
    },
    {
      title: "Tên khách",
      dataIndex: "tenKhach",
      key: "tenKhach",
      align: "center",
    },
    {
      title: "Hành động",
      key: "action",
      align: "center",
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            icon={<FileTextOutlined />}
            onClick={() => navigate(`${record.id}`)} // Điều hướng đến trang chi tiết
            className="phieu-action-btn phieu-view-btn"
          />
          <Button
            size="small"
            type="primary"
            icon={<EditOutlined />}
            onClick={() => navigate(`edit/${record.id}`)} // Điều hướng đến trang sửa
            className="phieu-action-btn phieu-edit-btn"
          />
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)} // Xử lý xóa
            className="phieu-action-btn phieu-delete-btn"
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="phieu-container">
      <Row justify="space-between" align="middle" className="phieu-header">
        <Col>
          <Button
            type="text"
            icon={<LeftOutlined />}
            onClick={() => navigate("..")}
            className="phieu-back-button"
          >
            Trở về
          </Button>
        </Col>
        <Col>
          <Title level={3} className="phieu-title">
            DANH SÁCH PHIẾU NHẬP KHO
          </Title>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("add")}
            className="phieu-add-button"
          >
            Thêm mới
          </Button>
        </Col>
      </Row>

      <div className="phieu-table-container">
        <Table
          columns={columns}
          dataSource={data}
          pagination={false}
          bordered
          rowKey="id"
          size="middle"
          scroll={{ x: true }}
          className="phieu-data-table"
        />
      </div>
    </div>
  );
};

export default ListPhieuNhapKho;
