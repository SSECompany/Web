import React, { useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  DatePicker,
  Input,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tabs,
  Timeline,
  Typography,
} from "antd";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DollarCircleOutlined,
  DownloadOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getSampleFinanceTransactions,
  getSampleProjects,
} from "../../../WorkflowApp/utils/workflowSampleData";
import "./FinanceLedger.css";

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Search } = Input;
const { Text } = Typography;

const STATUS_META = {
  CLEARED: { color: "green", text: "Đã ghi sổ" },
  APPROVED: { color: "blue", text: "Đã duyệt" },
  PENDING: { color: "gold", text: "Chờ xử lý" },
  RETURNED: { color: "red", text: "Bị trả về" },
};

const FinanceLedger = () => {
  const [transactions] = useState(getSampleFinanceTransactions());
  const [projects] = useState(getSampleProjects());
  const [activeTab, setActiveTab] = useState("income");
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [projectFilter, setProjectFilter] = useState("ALL");
  const [dateRange, setDateRange] = useState(null);

  const projectOptions = useMemo(
    () =>
      projects.map((project) => ({
        label: project.projectName,
        value: project.projectName,
      })),
    [projects]
  );

  const filteredTransactions = useMemo(() => {
    return transactions.filter((txn) => {
      const matchType = txn.type === activeTab;
      const matchSearch =
        !searchValue ||
        txn.voucherNo.toLowerCase().includes(searchValue.toLowerCase()) ||
        txn.description.toLowerCase().includes(searchValue.toLowerCase());
      const matchStatus =
        statusFilter === "ALL" || txn.status === statusFilter;
      const matchProject =
        projectFilter === "ALL" || txn.projectName === projectFilter;
      const matchDate =
        !dateRange ||
        (txn.issuedDate &&
          dayjs(txn.issuedDate).isBetween(dateRange[0], dateRange[1], "day", "[]"));
      return matchType && matchSearch && matchStatus && matchProject && matchDate;
    });
  }, [transactions, activeTab, searchValue, statusFilter, projectFilter, dateRange]);

  const stats = useMemo(() => {
    const income = transactions
      .filter((txn) => txn.type === "income")
      .reduce((sum, txn) => sum + txn.amount, 0);
    const expense = transactions
      .filter((txn) => txn.type === "expense")
      .reduce((sum, txn) => sum + txn.amount, 0);
    return {
      income,
      expense,
      net: income - expense,
    };
  }, [transactions]);

  const columns = [
    {
      title: "Số phiếu",
      dataIndex: "voucherNo",
      key: "voucherNo",
      width: 150,
      render: (value) => <Text strong>{value}</Text>,
    },
    {
      title: "Dự án",
      dataIndex: "projectName",
      key: "projectName",
      width: 180,
    },
    {
      title: "Danh mục",
      dataIndex: "category",
      key: "category",
      width: 180,
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
      width: 140,
      render: (value) => `${value.toLocaleString("vi-VN")} ₫`,
    },
    {
      title: "Phương thức",
      dataIndex: "method",
      key: "method",
      width: 150,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status) => (
        <Tag color={STATUS_META[status]?.color}>{STATUS_META[status]?.text}</Tag>
      ),
    },
    {
      title: "Ngày phát hành",
      dataIndex: "issuedDate",
      key: "issuedDate",
      width: 150,
      render: (value) => dayjs(value).format("DD/MM/YYYY"),
    },
  ];

  return (
    <div className="finance-ledger">
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Tổng thu"
              value={stats.income}
              suffix="₫"
              prefix={<ArrowDownOutlined style={{ color: "#52c41a" }} />}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Tổng chi"
              value={stats.expense}
              suffix="₫"
              prefix={<ArrowUpOutlined style={{ color: "#ff4d4f" }} />}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Dòng tiền ròng"
              value={stats.net}
              suffix="₫"
              valueStyle={{ color: stats.net >= 0 ? "#52c41a" : "#ff4d4f" }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        className="finance-ledger-card"
        title="Sổ thu chi"
        extra={
          <Space>
            <Button icon={<DownloadOutlined />}>Xuất báo cáo</Button>
            <Button type="primary" icon={<DollarCircleOutlined />}>
              Tạo phiếu mới
            </Button>
          </Space>
        }
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: "income", label: "Phiếu thu" },
            { key: "expense", label: "Phiếu chi" },
          ]}
        />

        <Space className="finance-ledger-filters" size="middle" wrap>
          <Search
            placeholder="Tìm mã phiếu hoặc nội dung"
            onSearch={setSearchValue}
            allowClear
            style={{ width: 260 }}
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 180 }}
            suffixIcon={<FilterOutlined />}
          >
            <Option value="ALL">Tất cả trạng thái</Option>
            {Object.entries(STATUS_META).map(([key, meta]) => (
              <Option key={key} value={key}>
                {meta.text}
              </Option>
            ))}
          </Select>
          <Select
            value={projectFilter}
            onChange={setProjectFilter}
            style={{ width: 200 }}
            placeholder="Theo dự án"
            allowClear
          >
            <Option value="ALL">Tất cả dự án</Option>
            {projectOptions.map((project) => (
              <Option key={project.value} value={project.value}>
                {project.label}
              </Option>
            ))}
          </Select>
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            format="DD/MM/YYYY"
            allowEmpty
          />
          <Badge
            count={filteredTransactions.length}
            color="#722ed1"
            showZero
            offset={[12, 0]}
          >
            <Tag color="purple">Giao dịch</Tag>
          </Badge>
        </Space>

        <Table
          rowKey="id"
          dataSource={filteredTransactions}
          columns={columns}
          pagination={{ pageSize: 6, showSizeChanger: false }}
        />
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Lịch sử dòng tiền">
            <Timeline className="finance-ledger-timeline">
              {transactions.map((txn) => (
                <Timeline.Item
                  key={txn.id}
                  color={txn.type === "income" ? "green" : "red"}
                >
                  <Space direction="vertical" size={0}>
                    <Text strong>
                      {txn.voucherNo} · {txn.projectName}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs(txn.issuedDate).format("DD/MM/YYYY")} ·{" "}
                      {txn.amount.toLocaleString("vi-VN")} ₫
                    </Text>
                  </Space>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Cảnh báo & ghi chú">
            <Alert
              type="warning"
              showIcon
              message="Có 2 phiếu chi bị trả về, cần bổ sung chứng từ."
              style={{ marginBottom: 12 }}
            />
            <Alert
              type="info"
              showIcon
              message="Doanh thu CRM chưa ghi sổ (đang chờ khách đối soát)."
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default FinanceLedger;

