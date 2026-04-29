import { FilterOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
} from "antd";
import { useState } from "react";
import { ISSUE_PRIORITIES, ISSUE_STATUSES, ISSUE_TYPES } from "../../../TaskManagement/Types/IssueTypes";
import dayjs from "dayjs";

const { Option } = Select;
const { RangePicker } = DatePicker;

const AdvancedFilters = ({ visible, onCancel, onApply, filters = {} }) => {
  const [form] = Form.useForm();

  const handleApply = () => {
    const values = form.getFieldsValue();
    onApply(values);
    onCancel();
  };

  const handleReset = () => {
    form.resetFields();
    onApply({});
  };

  return (
    <Modal
      title={
        <Space>
          <FilterOutlined />
          <span>Bộ lọc nâng cao</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={[
        <Button key="reset" onClick={handleReset}>
          Đặt lại
        </Button>,
        <Button key="cancel" onClick={onCancel}>
          Hủy
        </Button>,
        <Button key="apply" type="primary" onClick={handleApply}>
          Áp dụng
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" initialValues={filters}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="search" label="Tìm kiếm">
              <Input placeholder="Tìm trong tiêu đề, mô tả..." />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="type" label="Loại">
              <Select placeholder="Chọn loại" allowClear>
                {Object.values(ISSUE_TYPES).map((type) => (
                  <Option key={type.id} value={type.id.toUpperCase()}>
                    {type.namVn}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="status" label="Trạng thái">
              <Select placeholder="Chọn trạng thái" allowClear>
                {Object.values(ISSUE_STATUSES).map((status) => (
                  <Option key={status.id} value={status.id.toUpperCase()}>
                    {status.nameVn}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="priority" label="Ưu tiên">
              <Select placeholder="Chọn ưu tiên" allowClear>
                {Object.values(ISSUE_PRIORITIES).map((priority) => (
                  <Option key={priority.id} value={priority.id.toUpperCase()}>
                    {priority.nameVn}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="assignee" label="Người phụ trách">
              <Select placeholder="Chọn người phụ trách" allowClear showSearch>
                <Option value="1">Nguyễn Văn A</Option>
                <Option value="2">Trần Thị B</Option>
                <Option value="3">Lê Văn C</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="reporter" label="Người tạo">
              <Select placeholder="Chọn người tạo" allowClear showSearch>
                <Option value="1">Nguyễn Văn A</Option>
                <Option value="2">Trần Thị B</Option>
                <Option value="3">Lê Văn C</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="project" label="Dự án">
              <Select placeholder="Chọn dự án" allowClear showSearch>
                <Option value="1">Website mới</Option>
                <Option value="2">API Documentation</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="version" label="Phiên bản">
              <Select placeholder="Chọn phiên bản" allowClear>
                <Option value="v1.0.0">v1.0.0</Option>
                <Option value="v1.1.0">v1.1.0</Option>
                <Option value="v2.0.0">v2.0.0</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="createdDate" label="Ngày tạo">
              <RangePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="dueDate" label="Hạn hoàn thành">
              <RangePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="watcher" label="Người theo dõi">
              <Select placeholder="Chọn người theo dõi" allowClear showSearch>
                <Option value="1">Nguyễn Văn A</Option>
                <Option value="2">Trần Thị B</Option>
                <Option value="3">Lê Văn C</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="hasAttachment" label="Có đính kèm">
              <Select placeholder="Chọn" allowClear>
                <Option value="true">Có</Option>
                <Option value="false">Không</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default AdvancedFilters;


