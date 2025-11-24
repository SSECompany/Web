import { LinkOutlined } from "@ant-design/icons";
import { Button, Form, Input, Modal, Select, Space, Table } from "antd";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiAddIssueRelation, apiGetIssueRelations, apiRemoveIssueRelation } from "../../API";

const { Option } = Select;

const RELATION_TYPES = [
  { value: "relates", label: "Liên quan", color: "blue" },
  { value: "duplicates", label: "Trùng lặp", color: "orange" },
  { value: "duplicated_by", label: "Bị trùng lặp bởi", color: "orange" },
  { value: "blocks", label: "Chặn", color: "red" },
  { value: "blocked_by", label: "Bị chặn bởi", color: "red" },
  { value: "precedes", label: "Đứng trước", color: "purple" },
  { value: "follows", label: "Theo sau", color: "purple" },
  { value: "copied_to", label: "Sao chép đến", color: "cyan" },
  { value: "copied_from", label: "Sao chép từ", color: "cyan" },
];

const ModalAddRelation = ({ visible, onCancel, issueId, currentIssueTitle }) => {
  const [form] = Form.useForm();
  const [relations, setRelations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (visible && issueId) {
      loadRelations();
    }
  }, [visible, issueId]);

  const loadRelations = async () => {
    try {
      const response = await apiGetIssueRelations({ issueId });
      setRelations(response?.data || []);
    } catch (error) {
      console.error("Error loading relations:", error);
    }
  };

  const handleAddRelation = async (values) => {
    setLoading(true);
    try {
      await apiAddIssueRelation({
        issueId,
        relatedIssueId: values.relatedIssueId,
        relationType: values.relationType,
      });
      form.resetFields();
      await loadRelations();
    } catch (error) {
      console.error("Error adding relation:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveRelation = async (relationId) => {
    setLoading(true);
    try {
      await apiRemoveIssueRelation({ issueId, relationId });
      await loadRelations();
    } catch (error) {
      console.error("Error removing relation:", error);
    } finally {
      setLoading(false);
    }
  };

  // Sample issues for search
  const [availableIssues] = useState([
    { id: "ISSUE-002", title: "Thêm tính năng thanh toán", project: "Website mới" },
    { id: "ISSUE-003", title: "Cập nhật tài liệu API", project: "API Documentation" },
    { id: "ISSUE-004", title: "Tối ưu hiệu suất database", project: "Website mới" },
  ]);

  const filteredIssues = availableIssues.filter(
    (issue) =>
      issue.id.toLowerCase().includes(searchText.toLowerCase()) ||
      issue.title.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: "Loại",
      dataIndex: "relationType",
      key: "relationType",
      width: 150,
      render: (type) => {
        const relation = RELATION_TYPES.find((r) => r.value === type);
        return relation ? (
          <span style={{ color: relation.color }}>{relation.label}</span>
        ) : type;
      },
    },
    {
      title: "Issue",
      dataIndex: "relatedIssue",
      key: "relatedIssue",
      render: (issue) => (
        <a
          onClick={() => {
            navigate(`/workflow/issue-management/issue/${issue.id}`);
            onCancel();
          }}
        >
          {issue.id} - {issue.title}
        </a>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          danger
          size="small"
          onClick={() => handleRemoveRelation(record.id)}
          loading={loading}
        >
          Xóa
        </Button>
      ),
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <LinkOutlined />
          <span>Quản lý liên kết Issue</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={700}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        {/* Add Relation Form */}
        <Form form={form} layout="vertical" onFinish={handleAddRelation}>
          <Form.Item
            name="relationType"
            label="Loại liên kết"
            rules={[{ required: true, message: "Vui lòng chọn loại liên kết" }]}
          >
            <Select placeholder="Chọn loại liên kết">
              {RELATION_TYPES.map((type) => (
                <Option key={type.value} value={type.value}>
                  {type.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="relatedIssueId"
            label="Issue liên quan"
            rules={[{ required: true, message: "Vui lòng chọn issue" }]}
          >
            <Select
              showSearch
              placeholder="Tìm kiếm issue..."
              filterOption={false}
              onSearch={setSearchText}
              notFoundContent={null}
            >
              {filteredIssues.map((issue) => (
                <Option key={issue.id} value={issue.id}>
                  {issue.id} - {issue.title} ({issue.project})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Thêm liên kết
            </Button>
          </Form.Item>
        </Form>

        {/* Relations List */}
        <div>
          <Table
            columns={columns}
            dataSource={relations}
            rowKey="id"
            pagination={false}
            size="small"
          />
        </div>
      </Space>
    </Modal>
  );
};

export default ModalAddRelation;

