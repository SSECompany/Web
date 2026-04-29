import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Descriptions,
  Input,
  Row,
  Select,
  Space,
  Statistic,
  Steps,
  Table,
  Tag,
  Timeline,
  Typography,
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  DownloadOutlined,
  FilterOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { getSampleProposals } from "../../../WorkflowApp/utils/workflowSampleData";
import "./ProposalCenter.css";

const { Option } = Select;
const { Search } = Input;
const { Title, Text } = Typography;

const STATUS_META = {
  PENDING: { color: "processing", text: "Đang duyệt" },
  APPROVED: { color: "success", text: "Đã duyệt" },
  REJECTED: { color: "error", text: "Từ chối" },
  RETURNED: { color: "warning", text: "Yêu cầu bổ sung" },
};

const PRIORITY_META = {
  HIGH: { color: "red", text: "Cao" },
  MEDIUM: { color: "blue", text: "Trung bình" },
  URGENT: { color: "magenta", text: "Khẩn cấp" },
  LOW: { color: "default", text: "Thấp" },
};

const ProposalCenter = () => {
  const [data] = useState(getSampleProposals());
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [searchValue, setSearchValue] = useState("");
  const [selectedProposalId, setSelectedProposalId] = useState(data[0]?.id || null);

  const filteredProposals = useMemo(() => {
    return data.filter((proposal) => {
      const matchStatus =
        statusFilter === "ALL" || proposal.status === statusFilter;
      const matchCategory =
        categoryFilter === "ALL" || proposal.category === categoryFilter;
      const matchSearch =
        !searchValue ||
        proposal.title.toLowerCase().includes(searchValue.toLowerCase()) ||
        proposal.code.toLowerCase().includes(searchValue.toLowerCase()) ||
        proposal.requester.toLowerCase().includes(searchValue.toLowerCase());
      return matchStatus && matchCategory && matchSearch;
    });
  }, [data, statusFilter, categoryFilter, searchValue]);

  useEffect(() => {
    if (!filteredProposals.some((proposal) => proposal.id === selectedProposalId)) {
      setSelectedProposalId(filteredProposals[0]?.id || null);
    }
  }, [filteredProposals, selectedProposalId]);

  const selectedProposal = useMemo(
    () => filteredProposals.find((proposal) => proposal.id === selectedProposalId) || null,
    [filteredProposals, selectedProposalId]
  );

  const stats = useMemo(() => {
    const totalAmount = filteredProposals.reduce(
      (sum, proposal) => sum + (proposal.amount || 0),
      0
    );
    const pending = filteredProposals.filter((proposal) => proposal.status === "PENDING")
      .length;
    const approved = filteredProposals.filter((proposal) => proposal.status === "APPROVED")
      .length;
    const avgSteps = filteredProposals.length
      ? (
          filteredProposals.reduce(
            (sum, proposal) => sum + (proposal.approvalSteps?.length || 0),
            0
          ) / filteredProposals.length
        ).toFixed(1)
      : 0;

    return { totalAmount, pending, approved, avgSteps };
  }, [filteredProposals]);

  const columns = [
    {
      title: "Mã",
      dataIndex: "code",
      key: "code",
      width: 110,
    },
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.projectName}
          </Text>
        </Space>
      ),
    },
    {
      title: "Danh mục",
      dataIndex: "category",
      key: "category",
      width: 140,
    },
    {
      title: "Người đề xuất",
      dataIndex: "requester",
      key: "requester",
      width: 150,
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
      width: 140,
      render: (value) => `${value.toLocaleString("vi-VN")} ₫`,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status) => {
        const meta = STATUS_META[status] || STATUS_META.PENDING;
        return <Tag color={meta.color}>{meta.text}</Tag>;
      },
    },
    {
      title: "Hạn duyệt",
      dataIndex: "dueDate",
      key: "dueDate",
      width: 140,
      render: (value) => (value ? dayjs(value).format("DD/MM/YYYY") : "—"),
    },
  ];

  return (
    <div className="proposal-center">
      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card>
            <Statistic
              title="Tổng ngân sách đề xuất"
              value={stats.totalAmount}
              suffix="₫"
              valueStyle={{ fontSize: 22 }}
              precision={0}
            />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="Đang chờ duyệt" value={stats.pending} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="Đã duyệt" value={stats.approved} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="Số bước trung bình" value={stats.avgSteps} />
          </Card>
        </Col>
      </Row>

      <Card
        className="proposal-center-card"
        title="Danh sách đề xuất"
        extra={
          <Space>
            <Button icon={<DownloadOutlined />}>Xuất Excel</Button>
            <Button type="primary" icon={<PlusOutlined />}>
              Tạo đề xuất
            </Button>
          </Space>
        }
      >
        <Space
          className="proposal-center-filters"
          size="middle"
          wrap
        >
          <Search
            placeholder="Tìm mã/tiêu đề/ người đề xuất"
            onSearch={setSearchValue}
            allowClear
            style={{ width: 280 }}
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 200 }}
            suffixIcon={<FilterOutlined />}
          >
            <Option value="ALL">Tất cả trạng thái</Option>
            {Object.entries(STATUS_META).map(([value, meta]) => (
              <Option key={value} value={value}>
                {meta.text}
              </Option>
            ))}
          </Select>
          <Select
            value={categoryFilter}
            onChange={setCategoryFilter}
            style={{ width: 200 }}
            suffixIcon={<FilterOutlined />}
          >
            <Option value="ALL">Tất cả danh mục</Option>
            {Array.from(new Set(data.map((proposal) => proposal.category))).map(
              (category) => (
                <Option key={category} value={category}>
                  {category}
                </Option>
              )
            )}
          </Select>
          <Badge
            count={filteredProposals.length}
            color="#1677ff"
            showZero
            offset={[10, 0]}
          >
            <Tag color="blue">Đề xuất</Tag>
          </Badge>
        </Space>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredProposals}
          pagination={{ pageSize: 6, showSizeChanger: false }}
          onRow={(record) => ({
            onClick: () => setSelectedProposalId(record.id),
            className:
              record.id === selectedProposalId ? "proposal-selected-row" : "",
          })}
        />
      </Card>

      {selectedProposal && (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={14}>
            <Card title="Chi tiết đề xuất">
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="Mã">{selectedProposal.code}</Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  <Tag color={STATUS_META[selectedProposal.status]?.color}>
                    {STATUS_META[selectedProposal.status]?.text}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Dự án">
                  {selectedProposal.projectName}
                </Descriptions.Item>
                <Descriptions.Item label="Phòng ban">
                  {selectedProposal.department}
                </Descriptions.Item>
                <Descriptions.Item label="Người đề xuất">
                  {selectedProposal.requester}
                </Descriptions.Item>
                <Descriptions.Item label="Ưu tiên">
                  <Tag color={PRIORITY_META[selectedProposal.priority]?.color}>
                    {PRIORITY_META[selectedProposal.priority]?.text}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Ngày tạo">
                  {dayjs(selectedProposal.createdDate).format("DD/MM/YYYY")}
                </Descriptions.Item>
                <Descriptions.Item label="Hạn duyệt">
                  {dayjs(selectedProposal.dueDate).format("DD/MM/YYYY")}
                </Descriptions.Item>
                <Descriptions.Item label="Số tiền">
                  {selectedProposal.amount.toLocaleString("vi-VN")} ₫
                </Descriptions.Item>
                <Descriptions.Item label="Đính kèm">
                  {selectedProposal.attachments} tài liệu
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          <Col xs={24} lg={10}>
            <Card title="Tiến trình phê duyệt">
              <Steps direction="vertical" size="small">
                {(selectedProposal.approvalSteps || []).map((step, index) => {
                  const statusIcon = {
                    APPROVED: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
                    PENDING: <ClockCircleOutlined style={{ color: "#faad14" }} />,
                    WAITING: <ClockCircleOutlined style={{ color: "#faad14" }} />,
                    RETURNED: <CloseCircleOutlined style={{ color: "#ff4d4f" }} />,
                    REJECTED: <CloseCircleOutlined style={{ color: "#ff4d4f" }} />,
                    UPDATING: <ClockCircleOutlined style={{ color: "#faad14" }} />,
                  };
                  return (
                    <Steps.Step
                      key={index.toString()}
                      title={
                        <Space>
                          <Text>{step.role}</Text>
                          <Tag color="default">{step.approver}</Tag>
                        </Space>
                      }
                      description={
                        step.dateOffset
                          ? `Duyệt ngày ${dayjs(selectedProposal.createdDate)
                              .add(step.dateOffset - selectedProposal.createdOffset, "day")
                              .format("DD/MM")}`
                          : "Đang xử lý"
                      }
                      status={
                        ["APPROVED", "FINISHED"].includes(step.status)
                          ? "finish"
                          : ["RETURNED", "REJECTED"].includes(step.status)
                          ? "error"
                          : "process"
                      }
                      icon={statusIcon[step.status] || <ClockCircleOutlined />}
                    />
                  );
                })}
              </Steps>
            </Card>

            <Card title="Nhật ký hoạt động" style={{ marginTop: 16 }}>
              {selectedProposal.approvalSteps?.length ? (
                <Timeline className="proposal-center-timeline">
                  {selectedProposal.approvalSteps.map((step, index) => (
                    <Timeline.Item
                      key={`timeline-${index}`}
                      color={
                        step.status === "APPROVED"
                          ? "green"
                          : step.status === "REJECTED" || step.status === "RETURNED"
                          ? "red"
                          : "blue"
                      }
                    >
                      <Space direction="vertical" size={0}>
                        <Text strong>{step.approver}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Trạng thái: {step.status}
                        </Text>
                      </Space>
                    </Timeline.Item>
                  ))}
                </Timeline>
              ) : (
                <Alert
                  message="Chưa có hoạt động nào"
                  type="info"
                  showIcon
                />
              )}
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default ProposalCenter;






