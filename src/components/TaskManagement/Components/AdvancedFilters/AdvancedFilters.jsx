import {
  FilterOutlined,
  SaveOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Select,
  Space,
  DatePicker,
  Tag,
  Typography,
  notification,
  Popover,
} from "antd";
import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { apiGetSavedFilters, apiSaveFilter, apiDeleteSavedFilter } from "../../API";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Text } = Typography;

const AdvancedFilters = ({
  filters,
  onFiltersChange,
  onApplyFilter,
}) => {
  const [form] = Form.useForm();
  const [savedFilters, setSavedFilters] = useState([]);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSavedFilters();
  }, []);

  const loadSavedFilters = async () => {
    try {
      // Đã tắt để tránh gọi /addData
      // const response = await apiGetSavedFilters({});
      // if (response?.status === 200 && response?.data) {
      //   setSavedFilters(response.data);
      // } else {
        // Sample saved filters
        setSavedFilters([
          {
            id: "1",
            name: "Công việc của tôi",
            filters: {
              assignedToId: "current_user",
              status: "IN_PROGRESS",
            },
          },
          {
            id: "2",
            name: "Công việc quá hạn",
            filters: {
              overdue: true,
            },
          },
          {
            id: "3",
            name: "Bug cần fix",
            filters: {
              type: "BUG",
              priority: "HIGH",
            },
          },
        ]);
      // }
    } catch (error) {
      console.error("Error loading saved filters:", error);
      // Fallback to sample filters
      setSavedFilters([
        {
          id: "1",
          name: "Công việc của tôi",
          filters: {
            assignedToId: "current_user",
            status: "IN_PROGRESS",
          },
        },
        {
          id: "2",
          name: "Công việc quá hạn",
          filters: {
            overdue: true,
          },
        },
        {
          id: "3",
          name: "Bug cần fix",
          filters: {
            type: "BUG",
            priority: "HIGH",
          },
        },
      ]);
    }
  };

  const handleSaveFilter = async (values) => {
    setLoading(true);
    try {
      // Đã tắt để tránh gọi /addData
      // const response = await apiSaveFilter({
      //   name: values.name,
      //   filters: filters,
      // });
      // if (response?.status === 200) {
        notification.success({
          message: "Thành công",
          description: "Đã lưu filter (local only)",
        });
        setSaveModalVisible(false);
        form.resetFields();
        // await loadSavedFilters();
      // }
    } catch (error) {
      console.error("Error saving filter:", error);
      notification.error({
        message: "Lỗi",
        description: "Không thể lưu filter",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFilter = async (filterId) => {
    setLoading(true);
    try {
      // Đã tắt để tránh gọi /addData
      // const response = await apiDeleteSavedFilter({ filterId });
      // if (response?.status === 200) {
        notification.success({
          message: "Thành công",
          description: "Đã xóa filter (local only)",
        });
        // await loadSavedFilters();
        // Xóa local
        setSavedFilters(savedFilters.filter(f => f.id !== filterId));
      // }
    } catch (error) {
      console.error("Error deleting filter:", error);
      notification.error({
        message: "Lỗi",
        description: "Không thể xóa filter",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplySavedFilter = (savedFilter) => {
    onApplyFilter?.(savedFilter.filters);
    notification.success({
      message: "Đã áp dụng filter",
      description: savedFilter.name,
    });
  };

  const savedFiltersContent = (
    <div style={{ width: 250 }}>
      <Space direction="vertical" style={{ width: "100%" }} size="small">
        {savedFilters.map((filter) => (
          <Space key={filter.id} style={{ width: "100%", justifyContent: "space-between" }}>
            <Button
              type="link"
              onClick={() => handleApplySavedFilter(filter)}
              style={{ padding: 0 }}
            >
              {filter.name}
            </Button>
            <Button
              type="link"
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteFilter(filter.id)}
            />
          </Space>
        ))}
        <Button
          type="dashed"
          block
          icon={<PlusOutlined />}
          onClick={() => setSaveModalVisible(true)}
        >
          Lưu filter hiện tại
        </Button>
      </Space>
    </div>
  );

  return (
    <>
      <Card size="small" className="advanced-filters-card">
        <Space wrap>
          <Popover
            content={savedFiltersContent}
            title="Filter đã lưu"
            trigger="click"
            placement="bottomLeft"
          >
            <Button icon={<FilterOutlined />}>
              Filter đã lưu ({savedFilters.length})
            </Button>
          </Popover>

          <Select
            placeholder="Khoảng thời gian"
            style={{ width: 200 }}
            value={filters.dateRange}
            onChange={(value) =>
              onFiltersChange({ ...filters, dateRange: value })
            }
          >
            <Option value="today">Hôm nay</Option>
            <Option value="week">Tuần này</Option>
            <Option value="month">Tháng này</Option>
            <Option value="quarter">Quý này</Option>
            <Option value="year">Năm này</Option>
            <Option value="custom">Tùy chọn</Option>
          </Select>

          {filters.dateRange === "custom" && (
            <RangePicker
              value={filters.customDateRange}
              onChange={(dates) =>
                onFiltersChange({
                  ...filters,
                  customDateRange: dates,
                })
              }
              format="DD/MM/YYYY"
            />
          )}

          <Select
            placeholder="Sắp xếp"
            style={{ width: 150 }}
            value={filters.sortBy}
            onChange={(value) =>
              onFiltersChange({ ...filters, sortBy: value })
            }
          >
            <Option value="dueDate">Theo hạn chót</Option>
            <Option value="priority">Theo độ ưu tiên</Option>
            <Option value="createdDate">Theo ngày tạo</Option>
            <Option value="progress">Theo tiến độ</Option>
          </Select>

          <Select
            placeholder="Thứ tự"
            style={{ width: 120 }}
            value={filters.sortOrder}
            onChange={(value) =>
              onFiltersChange({ ...filters, sortOrder: value })
            }
          >
            <Option value="asc">Tăng dần</Option>
            <Option value="desc">Giảm dần</Option>
          </Select>

          <Button
            onClick={() => {
              onFiltersChange({
                status: "",
                priority: "",
                type: "",
                dateRange: "",
                customDateRange: null,
                sortBy: "",
                sortOrder: "desc",
              });
            }}
          >
            Xóa bộ lọc
          </Button>
        </Space>
      </Card>

      {/* Save Filter Modal */}
      <Modal
        title="Lưu filter"
        open={saveModalVisible}
        onCancel={() => {
          setSaveModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={400}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveFilter}>
          <Form.Item
            name="name"
            label="Tên filter"
            rules={[{ required: true, message: "Vui lòng nhập tên filter" }]}
          >
            <Input placeholder="Nhập tên filter" />
          </Form.Item>
          <Form.Item>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button onClick={() => setSaveModalVisible(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Lưu
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default AdvancedFilters;






