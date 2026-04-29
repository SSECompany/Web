import {
  CalendarOutlined,
  ClearOutlined,
  FilterOutlined,
  SaveOutlined,
  SearchOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Drawer,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Switch,
  Tag,
  Typography,
  Divider,
  Collapse,
  InputNumber,
  Checkbox
} from "antd";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { getUserInfo } from "../../../store/selectors/Selectors";
import { ISSUE_TYPES, ISSUE_STATUSES, ISSUE_PRIORITIES } from "../Types/IssueTypes";
import DepartmentSelector from "../../ReuseComponents/DepartmentSelector";

const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { Text, Title } = Typography;
const { Panel } = Collapse;

const AdvancedSearch = ({ 
  visible, 
  onClose, 
  onSearch, 
  savedFilters = [],
  onSaveFilter,
  initialFilters = {}
}) => {
  const userInfo = useSelector(getUserInfo);
  const [form] = Form.useForm();
  const [activeFilters, setActiveFilters] = useState(0);
  const [isSaveFilterModalOpen, setIsSaveFilterModalOpen] = useState(false);
  const [customFields, setCustomFields] = useState([]);

  // Sample users for assignment
  const sampleUsers = [
    { id: 1, name: "Nguyễn Văn A", department: "IT" },
    { id: 2, name: "Trần Thị B", department: "IT" },
    { id: 3, name: "Lê Văn C", department: "SALE" },
    { id: 4, name: "Phạm Thị D", department: "MARKETING" },
    { id: 5, name: "Hoàng Văn E", department: "HR" }
  ];

  // Sample projects
  const sampleProjects = [
    { id: 1, name: "E-commerce Platform", code: "ECOM" },
    { id: 2, name: "Mobile App", code: "MOBILE" },
    { id: 3, name: "Admin Dashboard", code: "ADMIN" },
    { id: 4, name: "API Gateway", code: "API" }
  ];

  // Sample versions
  const sampleVersions = [
    { id: 1, name: "Version 1.0", project: 1 },
    { id: 2, name: "Version 1.1", project: 1 },
    { id: 3, name: "Version 2.0", project: 1 },
    { id: 4, name: "Beta 1.0", project: 2 }
  ];

  // Sample categories
  const categories = [
    "Backend", "Frontend", "Database", "DevOps", "UI/UX", 
    "Testing", "Documentation", "Security", "Performance", "Integration"
  ];

  useEffect(() => {
    if (visible) {
      form.setFieldsValue(initialFilters);
      countActiveFilters(initialFilters);
    }
  }, [visible, initialFilters]);

  const countActiveFilters = (values) => {
    let count = 0;
    Object.keys(values || {}).forEach(key => {
      const value = values[key];
      if (value !== undefined && value !== null && value !== "" && 
          !(Array.isArray(value) && value.length === 0)) {
        count++;
      }
    });
    setActiveFilters(count);
  };

  const handleSearch = () => {
    form.validateFields().then(values => {
      // Process values
      const filters = { ...values };
      
      // Convert date ranges
      if (filters.createdDateRange) {
        filters.createdFrom = filters.createdDateRange[0].format('YYYY-MM-DD');
        filters.createdTo = filters.createdDateRange[1].format('YYYY-MM-DD');
        delete filters.createdDateRange;
      }
      
      if (filters.dueDateRange) {
        filters.dueFrom = filters.dueDateRange[0].format('YYYY-MM-DD');
        filters.dueTo = filters.dueDateRange[1].format('YYYY-MM-DD');
        delete filters.dueDateRange;
      }

      if (filters.updatedDateRange) {
        filters.updatedFrom = filters.updatedDateRange[0].format('YYYY-MM-DD');
        filters.updatedTo = filters.updatedDateRange[1].format('YYYY-MM-DD');
        delete filters.updatedDateRange;
      }

      countActiveFilters(filters);
      onSearch(filters);
    });
  };

  const handleClear = () => {
    form.resetFields();
    setActiveFilters(0);
    onSearch({});
  };

  const handleSaveFilter = (filterName, isPublic = false) => {
    const values = form.getFieldsValue();
    const filter = {
      id: Date.now(),
      name: filterName,
      filters: values,
      isPublic,
      createdBy: userInfo.userName,
      createdAt: new Date().toISOString()
    };
    
    if (onSaveFilter) {
      onSaveFilter(filter);
    }
    setIsSaveFilterModalOpen(false);
  };

  const loadSavedFilter = (filter) => {
    form.setFieldsValue(filter.filters);
    countActiveFilters(filter.filters);
  };

  return (
    <>
      <Drawer
        title={
          <Space>
            <FilterOutlined />
            <span>Tìm kiếm nâng cao</span>
            {activeFilters > 0 && (
              <Tag color="blue">{activeFilters} bộ lọc đang áp dụng</Tag>
            )}
          </Space>
        }
        width={600}
        open={visible}
        onClose={onClose}
        extra={
          <Space>
            <Button onClick={handleClear} icon={<ClearOutlined />}>
              Xóa tất cả
            </Button>
            <Button 
              type="primary" 
              onClick={handleSearch}
              icon={<SearchOutlined />}
            >
              Tìm kiếm
            </Button>
          </Space>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onValuesChange={(_, allValues) => countActiveFilters(allValues)}
        >
          <Collapse defaultActiveKey={["basic", "status"]} ghost>
            {/* Basic Search */}
            <Panel header="🔍 Tìm kiếm cơ bản" key="basic">
              <Form.Item label="Từ khóa" name="keywords">
                <Input.Search placeholder="Tìm trong tiêu đề, mô tả, bình luận..." />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="ID" name="issueId">
                    <Input placeholder="VD: 123, 456-789" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Phòng ban" name="departmentId">
                    <DepartmentSelector allowAll={true} />
                  </Form.Item>
                </Col>
              </Row>
            </Panel>

            {/* Status & Type */}
            <Panel header="📊 Trạng thái & Loại" key="status">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Loại" name="types">
                    <Select mode="multiple" placeholder="Chọn loại công việc">
                      {Object.values(ISSUE_TYPES).map(type => (
                        <Option key={type.id} value={type.id}>
                          <Space>
                            <span>{type.icon}</span>
                            <span>{type.namVn}</span>
                          </Space>
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Trạng thái" name="statuses">
                    <Select mode="multiple" placeholder="Chọn trạng thái">
                      {Object.values(ISSUE_STATUSES).map(status => (
                        <Option key={status.id} value={status.id}>
                          <Tag color={status.color}>{status.nameVn}</Tag>
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Độ ưu tiên" name="priorities">
                    <Select mode="multiple" placeholder="Chọn độ ưu tiên">
                      {Object.values(ISSUE_PRIORITIES).map(priority => (
                        <Option key={priority.id} value={priority.id}>
                          <Tag color={priority.color}>{priority.nameVn}</Tag>
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Danh mục" name="categories">
                    <Select mode="multiple" placeholder="Chọn danh mục">
                      {categories.map(category => (
                        <Option key={category} value={category}>
                          {category}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Panel>

            {/* Assignment */}
            <Panel header="👥 Phân công" key="assignment">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Người thực hiện" name="assignees">
                    <Select 
                      mode="multiple" 
                      placeholder="Chọn người thực hiện"
                      showSearch
                      filterOption={(input, option) =>
                        option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                      }
                    >
                      <Option value="unassigned">
                        <Text type="secondary">Chưa phân công</Text>
                      </Option>
                      <Option value="me">
                        <Text strong>Tôi</Text>
                      </Option>
                      {sampleUsers.map(user => (
                        <Option key={user.id} value={user.id}>
                          {user.name} ({user.department})
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Người báo cáo" name="reporters">
                    <Select mode="multiple" placeholder="Chọn người báo cáo">
                      {sampleUsers.map(user => (
                        <Option key={user.id} value={user.id}>
                          {user.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="Người theo dõi" name="watchers">
                <Select mode="multiple" placeholder="Chọn người theo dõi">
                  {sampleUsers.map(user => (
                    <Option key={user.id} value={user.id}>
                      {user.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Panel>

            {/* Project & Version */}
            <Panel header="📁 Dự án & Phiên bản" key="project">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Dự án" name="projects">
                    <Select mode="multiple" placeholder="Chọn dự án">
                      {sampleProjects.map(project => (
                        <Option key={project.id} value={project.id}>
                          <Space>
                            <Text code>{project.code}</Text>
                            <span>{project.name}</span>
                          </Space>
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Phiên bản" name="versions">
                    <Select mode="multiple" placeholder="Chọn phiên bản">
                      {sampleVersions.map(version => (
                        <Option key={version.id} value={version.id}>
                          {version.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Panel>

            {/* Dates */}
            <Panel header="📅 Ngày tháng" key="dates">
              <Form.Item label="Ngày tạo" name="createdDateRange">
                <RangePicker style={{ width: "100%" }} />
              </Form.Item>

              <Form.Item label="Ngày cập nhật" name="updatedDateRange">
                <RangePicker style={{ width: "100%" }} />
              </Form.Item>

              <Form.Item label="Ngày hết hạn" name="dueDateRange">
                <RangePicker style={{ width: "100%" }} />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Quá hạn" name="isOverdue" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Hết hạn trong (ngày)" name="dueSoon">
                    <InputNumber min={1} max={365} placeholder="VD: 7" />
                  </Form.Item>
                </Col>
              </Row>
            </Panel>

            {/* Time Tracking */}
            <Panel header="⏱️ Thời gian" key="time">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Thời gian ước tính (h)" name="estimatedHours">
                    <InputNumber.Group compact>
                      <Select defaultValue="=" style={{ width: "30%" }}>
                        <Option value="=">=</Option>
                        <Option value=">">></Option>
                        <Option value="<"><</Option>
                        <Option value=">=">>=</Option>
                        <Option value="<="><=</Option>
                      </Select>
                      <InputNumber style={{ width: "70%" }} placeholder="Giờ" />
                    </InputNumber.Group>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Thời gian đã dùng (h)" name="spentHours">
                    <InputNumber.Group compact>
                      <Select defaultValue="=" style={{ width: "30%" }}>
                        <Option value="=">=</Option>
                        <Option value=">">></Option>
                        <Option value="<"><</Option>
                        <Option value=">=">>=</Option>
                        <Option value="<="><=</Option>
                      </Select>
                      <InputNumber style={{ width: "70%" }} placeholder="Giờ" />
                    </InputNumber.Group>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="Tiến độ (%)" name="progress">
                <InputNumber.Group compact>
                  <Select defaultValue="=" style={{ width: "30%" }}>
                    <Option value="=">=</Option>
                    <Option value=">">></Option>
                    <Option value="<"><</Option>
                    <Option value=">=">>=</Option>
                    <Option value="<="><=</Option>
                  </Select>
                  <InputNumber style={{ width: "70%" }} min={0} max={100} placeholder="%" />
                </InputNumber.Group>
              </Form.Item>
            </Panel>

            {/* Custom Fields */}
            <Panel header="🔧 Trường tùy chỉnh" key="custom">
              <Form.Item label="Trình duyệt" name="browser">
                <Select mode="multiple" placeholder="Chọn trình duyệt">
                  <Option value="chrome">Chrome</Option>
                  <Option value="firefox">Firefox</Option>
                  <Option value="safari">Safari</Option>
                  <Option value="edge">Edge</Option>
                </Select>
              </Form.Item>

              <Form.Item label="Hệ điều hành" name="os">
                <Select mode="multiple" placeholder="Chọn hệ điều hành">
                  <Option value="windows">Windows</Option>
                  <Option value="macos">macOS</Option>
                  <Option value="linux">Linux</Option>
                  <Option value="ios">iOS</Option>
                  <Option value="android">Android</Option>
                </Select>
              </Form.Item>

              <Form.Item label="Môi trường" name="environment">
                <Select mode="multiple" placeholder="Chọn môi trường">
                  <Option value="development">Development</Option>
                  <Option value="staging">Staging</Option>
                  <Option value="production">Production</Option>
                </Select>
              </Form.Item>
            </Panel>
          </Collapse>

          <Divider />

          {/* Saved Filters */}
          {savedFilters.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <Title level={5}>📌 Bộ lọc đã lưu</Title>
              <Space wrap>
                {savedFilters.map(filter => (
                  <Button
                    key={filter.id}
                    size="small"
                    onClick={() => loadSavedFilter(filter)}
                  >
                    {filter.name}
                  </Button>
                ))}
              </Space>
            </div>
          )}

          <Space>
            <Button 
              icon={<SaveOutlined />}
              onClick={() => setIsSaveFilterModalOpen(true)}
            >
              Lưu bộ lọc
            </Button>
          </Space>
        </Form>
      </Drawer>

      {/* Save Filter Modal */}
      <Modal
        title="💾 Lưu bộ lọc"
        open={isSaveFilterModalOpen}
        onCancel={() => setIsSaveFilterModalOpen(false)}
        onOk={() => {
          const filterName = document.getElementById('filterName').value;
          const isPublic = document.getElementById('isPublic').checked;
          if (filterName) {
            handleSaveFilter(filterName, isPublic);
          }
        }}
      >
        <Form layout="vertical">
          <Form.Item label="Tên bộ lọc" required>
            <Input id="filterName" placeholder="VD: Bugs cần sửa gấp" />
          </Form.Item>
          <Form.Item>
            <Checkbox id="isPublic">
              Chia sẻ cho mọi người trong dự án
            </Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default AdvancedSearch;

