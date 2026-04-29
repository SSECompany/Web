import { CalendarOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Badge,
  Button,
  Card,
  Col,
  Row,
  Select,
  Space,
  Typography,
  Calendar as AntCalendar,
  List,
  Modal,
  Form,
  Input,
  TimePicker,
  DatePicker,
  InputNumber,
  message,
  Alert,
} from "antd";
import { useMemo, useState, useEffect } from "react";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import weekday from "dayjs/plugin/weekday";
import localeData from "dayjs/plugin/localeData";
import { getSampleCalendarEvents, getSampleProjects } from "../../../WorkflowApp/utils/workflowSampleData";
import { TaskManagementGetApi, apiCreateTask, apiGetTasks } from "../../../TaskManagement/API";
import {
  generateTaskCode,
  checkTimeConflict,
  suggestAssignee,
  validateTaskData,
  calculateTaskDuration,
  suggestEstimatedHours,
  formatTaskForAPI,
} from "../../utils/calendarLogic";
import "./CalendarView.css";

// Extend dayjs with required plugins
dayjs.extend(weekday);
dayjs.extend(localeData);
dayjs.locale("vi");

const { Title, Text } = Typography;
const { Option } = Select;

const CalendarView = () => {
  const [view, setView] = useState("month");
  const [selectedProject, setSelectedProject] = useState("all");
  const sampleProjects = useMemo(() => getSampleProjects(), []);
  const [selectedDate, setSelectedDate] = useState(() => dayjs());
  const [events, setEvents] = useState(() => getSampleCalendarEvents());
  const [isQuickCreateOpen, setQuickCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [usersList, setUsersList] = useState([]);
  const [clickedDate, setClickedDate] = useState(null);
  const [projectsList, setProjectsList] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [conflictWarning, setConflictWarning] = useState(null);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Load users and projects
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load users
        const usersResponse = await TaskManagementGetApi({
          store: "Api_Get_Users_For_Tasks",
          data: { active: true },
        });
        if (usersResponse.status === 200 && usersResponse.data) {
          setUsersList(usersResponse.data);
        }

        // Load projects
        const projectsResponse = await TaskManagementGetApi({
          store: "Api_Get_Projects_For_Tasks",
          data: { active: true },
        });
        if (projectsResponse.status === 200 && projectsResponse.data) {
          setProjectsList(projectsResponse.data);
        }

        // Load tasks for conflict detection
        const tasksResponse = await apiGetTasks({});
        if (tasksResponse.status === 200 && tasksResponse.data) {
          setAllTasks(tasksResponse.data || []);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        // Fallback to sample data
        setUsersList([
          { id: 1, fullName: "Nguyễn Văn A" },
          { id: 2, fullName: "Trần Thị B" },
          { id: 3, fullName: "Lê Văn C" },
        ]);
        setProjectsList(sampleProjects);
      }
    };
    loadData();
  }, []);

  const filterByProject = (eventList) => {
    if (selectedProject === "all") return eventList;
    return eventList.filter((event) => event.projectId === selectedProject);
  };

  const getDateEvents = (date) => {
    const dateStr = date.format("YYYY-MM-DD");
    return filterByProject(events).filter((event) => event.date === dateStr);
  };

  const dateCellRender = (value) => {
    if (!value || !value.format) return null;
    const dateEvents = getDateEvents(value);
    const isToday = value.isSame(dayjs(), "day");
    const isEmpty = dateEvents.length === 0;
    
    return (
      <div 
        style={{ 
          minHeight: 60,
          position: "relative",
          cursor: "pointer",
        }}
        onClick={(e) => {
          // Only open quick create if clicking on empty area, not on existing events
          if (e.target === e.currentTarget || isEmpty) {
            handleOpenQuickCreate(value);
          }
        }}
        onDoubleClick={() => handleOpenQuickCreate(value)}
      >
        {dateEvents.map((event) => {
          const priorityColors = {
            high: "#ff4d4f",
            normal: "#1890ff",
            medium: "#faad14",
            low: "#52c41a",
          };
          const color = priorityColors[event.priority] || "#1890ff";
          return (
            <div
              key={event.id}
              style={{
                backgroundColor: color,
                color: "#fff",
                padding: "2px 4px",
                borderRadius: "2px",
                marginBottom: "2px",
                fontSize: "11px",
                cursor: "pointer",
              }}
              title={event.title}
              onClick={(e) => {
                e.stopPropagation();
                console.log("View event:", event);
              }}
            >
              {event.title}
            </div>
          );
        })}
        {isEmpty && (
          <div
            style={{
              position: "absolute",
              bottom: 2,
              right: 2,
              opacity: 0.3,
              fontSize: "16px",
            }}
          >
            <PlusOutlined />
          </div>
        )}
      </div>
    );
  };

  const selectedDateEvents = getDateEvents(selectedDate);

  // Statistics for selected date
  const dateStats = useMemo(() => {
    const stats = {
      total: selectedDateEvents.length,
      high: selectedDateEvents.filter((e) => e.priority === "high").length,
      medium: selectedDateEvents.filter((e) => e.priority === "medium").length,
      normal: selectedDateEvents.filter((e) => e.priority === "normal").length,
      low: selectedDateEvents.filter((e) => e.priority === "low").length,
    };
    return stats;
  }, [selectedDateEvents]);

  const handleOpenQuickCreate = (date = dayjs()) => {
    const normalizedDate = date && date.format ? date : dayjs();
    setSelectedDate(normalizedDate);
    setClickedDate(normalizedDate);
    setConflictWarning(null);
    
    const selectedProjId = selectedProject === "all" 
      ? (projectsList.length > 0 ? projectsList[0]?.id : sampleProjects[0]?.id)
      : selectedProject;
    
    // Auto-suggest assignee based on workload
    const suggestedUser = suggestAssignee(
      usersList,
      allTasks,
      selectedProjId,
      "NORMAL"
    );

    const initialData = {
      date: normalizedDate,
      startDate: normalizedDate,
      dueDate: normalizedDate.add(1, "day"),
      title: "",
      taskName: "",
      projectId: selectedProjId,
      priority: "NORMAL",
      type: "TASK",
      status: "PENDING",
      mode: "INTERNAL",
      assignedToId: suggestedUser?.id,
      estimatedHours: undefined,
      points: undefined,
      category: undefined,
      formTemplate: undefined,
      description: "",
    };

    // Auto-suggest estimated hours
    const suggestedHours = suggestEstimatedHours(initialData);
    initialData.estimatedHours = suggestedHours;

    setQuickCreateOpen(true);
    form.setFieldsValue(initialData);
  };

  const handleCreateEvent = async () => {
    try {
      setIsSubmitting(true);
      setConflictWarning(null);
      
      const values = await form.validateFields();
      
      // Get project info
      const project = projectsList.find((p) => p.id === values.projectId) 
        || sampleProjects.find((p) => p.id === values.projectId);
      const assignedUser = usersList.find((u) => u.id === values.assignedToId);

      // Validate task data
      const validation = validateTaskData(
        values,
        projectsList.length > 0 ? projectsList : sampleProjects,
        usersList
      );

      if (!validation.isValid) {
        message.error(validation.errors.join(", "));
        return;
      }

      // Show warnings if any
      if (validation.warnings.length > 0) {
        validation.warnings.forEach((warning) => {
          message.warning(warning);
        });
      }

      // Check for time conflicts
      if (values.timeRange && values.timeRange.length === 2) {
        const conflictCheck = checkTimeConflict(
          {
            startDate: values.startDate,
            dueDate: values.dueDate,
            timeRange: values.timeRange,
          },
          allTasks
        );

        if (conflictCheck.hasConflict) {
          setConflictWarning({
            hasConflict: true,
            conflicts: conflictCheck.conflicts,
          });
          message.warning(
            `Phát hiện ${conflictCheck.conflicts.length} công việc trùng thời gian. Vui lòng kiểm tra lại.`
          );
          // Still allow creation but warn user
        }
      }

      // Auto-calculate estimated hours if not provided
      if (!values.estimatedHours) {
        values.estimatedHours = suggestEstimatedHours(values);
      }

      // Format data for API
      const taskData = formatTaskForAPI(values, project?.projectCode);

      // Call API to create task
      try {
        const response = await apiCreateTask(taskData);

        if (response.status === 200 && response.data === true) {
          // Create calendar event for display
          const timeText =
            values.timeRange && values.timeRange.length === 2
              ? `${values.timeRange[0].format("HH:mm")} - ${values.timeRange[1].format("HH:mm")}`
              : undefined;

          const priorityMap = {
            LOW: "low",
            MEDIUM: "medium",
            NORMAL: "normal",
            HIGH: "high",
            URGENT: "high",
          };
          const priority = priorityMap[values.priority] || "normal";

          const newEvent = {
            id: `TASK-${Date.now()}`,
            title: values.taskName,
            date: values.startDate?.format("YYYY-MM-DD") || clickedDate?.format("YYYY-MM-DD"),
            dueDate: values.dueDate?.format("YYYY-MM-DD"),
            priority: priority,
            projectId: values.projectId,
            project: project?.projectName || "Không xác định",
            type: values.type || "TASK",
            time: timeText,
            note: values.description,
            assignedTo: assignedUser?.fullName,
            category: values.category,
            points: values.points,
            estimatedHours: values.estimatedHours,
            isLocal: false,
          };

          setEvents((prev) => [...prev, newEvent]);
          setAllTasks((prev) => [...prev, taskData]);
          
          message.success("Đã tạo công việc vào lịch thành công!");
          setQuickCreateOpen(false);
          form.resetFields();
          setClickedDate(null);
          setConflictWarning(null);
        } else {
          throw new Error("API returned false");
        }
      } catch (apiError) {
        console.error("API Error:", apiError);
        // Fallback to local creation if API fails
        const timeText =
          values.timeRange && values.timeRange.length === 2
            ? `${values.timeRange[0].format("HH:mm")} - ${values.timeRange[1].format("HH:mm")}`
            : undefined;

        const priorityMap = {
          LOW: "low",
          MEDIUM: "medium",
          NORMAL: "normal",
          HIGH: "high",
          URGENT: "high",
        };
        const priority = priorityMap[values.priority] || "normal";

        const newEvent = {
          id: `LOCAL-${Date.now()}`,
          title: values.taskName,
          date: values.startDate?.format("YYYY-MM-DD") || clickedDate?.format("YYYY-MM-DD"),
          dueDate: values.dueDate?.format("YYYY-MM-DD"),
          priority: priority,
          projectId: values.projectId,
          project: project?.projectName || "Không xác định",
          type: values.type || "TASK",
          time: timeText,
          note: values.description,
          assignedTo: assignedUser?.fullName,
          category: values.category,
          points: values.points,
          estimatedHours: values.estimatedHours,
          isLocal: true,
        };

        setEvents((prev) => [...prev, newEvent]);
        message.warning("Đã tạo công việc tạm thời (chưa lưu vào server)");
        setQuickCreateOpen(false);
        form.resetFields();
        setClickedDate(null);
      }
    } catch (error) {
      if (error?.errorFields) {
        message.warning("Vui lòng kiểm tra lại thông tin công việc");
      } else {
        console.error(error);
        message.error("Không thể tạo công việc, hãy thử lại");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="calendar-view">
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              📅 Lịch
            </Title>
          </Col>
          <Col>
            <Space wrap>
              <Select
                value={selectedProject}
                onChange={setSelectedProject}
                style={{ width: 220 }}
              >
                <Option value="all">Tất cả dự án</Option>
                {sampleProjects.map((project) => (
                  <Option key={project.id} value={project.id}>
                    {project.projectName}
                  </Option>
                ))}
              </Select>
              <Select
                value={view}
                onChange={setView}
                style={{ width: 120 }}
              >
                <Option value="month">Tháng</Option>
                <Option value="week">Tuần</Option>
                <Option value="day">Ngày</Option>
                <Option value="agenda">Agenda</Option>
              </Select>
            </Space>
          </Col>
        </Row>

        {/* Quick Stats */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: "bold", color: "#1890ff" }}>
                {events.length}
              </div>
              <div style={{ fontSize: 12, color: "#8c8c8c" }}>Tổng sự kiện</div>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: "bold", color: "#ff4d4f" }}>
                {events.filter((e) => e.priority === "high").length}
              </div>
              <div style={{ fontSize: 12, color: "#8c8c8c" }}>Ưu tiên cao</div>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: "bold", color: "#52c41a" }}>
                {new Set(events.map((e) => e.projectId)).size}
              </div>
              <div style={{ fontSize: 12, color: "#8c8c8c" }}>Dự án</div>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: "bold", color: "#fa8c16" }}>
                {dateStats.total}
              </div>
              <div style={{ fontSize: 12, color: "#8c8c8c" }}>
                Sự kiện hôm nay
              </div>
            </Card>
          </Col>
        </Row>
        <Row justify="end" style={{ marginBottom: 12 }}>
          <Col>
            <Button type="primary" icon={<CalendarOutlined />} onClick={() => handleOpenQuickCreate(selectedDate)}>
              Thêm công việc trong ngày
            </Button>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} lg={16}>
            <AntCalendar
              value={selectedDate}
              onChange={(date) => {
                if (date && date.format) {
                  setSelectedDate(date);
                }
              }}
              dateCellRender={dateCellRender}
              onSelect={(date) => {
                if (date && date.format) {
                  setSelectedDate(date);
                  // Double click or click on empty cell will open quick create
                  // Single click just selects the date
                }
              }}
            />
          </Col>
          <Col xs={24} lg={8}>
            <Card
              title={`Sự kiện ngày ${selectedDate.format("DD/MM/YYYY")}`}
              size="small"
              extra={
                selectedDateEvents.length > 0 && (
                  <Badge count={selectedDateEvents.length} showZero />
                )
              }
            >
              {selectedDateEvents.length > 0 ? (
                <>
                  {/* Priority breakdown */}
                  <div style={{ marginBottom: 16 }}>
                    <Row gutter={8}>
                      {dateStats.high > 0 && (
                        <Col span={6}>
                          <div style={{ textAlign: "center" }}>
                            <Badge color="#ff4d4f" count={dateStats.high} />
                            <div style={{ fontSize: 10, marginTop: 4 }}>Cao</div>
                          </div>
                        </Col>
                      )}
                      {dateStats.medium > 0 && (
                        <Col span={6}>
                          <div style={{ textAlign: "center" }}>
                            <Badge color="#faad14" count={dateStats.medium} />
                            <div style={{ fontSize: 10, marginTop: 4 }}>TB</div>
                          </div>
                        </Col>
                      )}
                      {dateStats.normal > 0 && (
                        <Col span={6}>
                          <div style={{ textAlign: "center" }}>
                            <Badge color="#1890ff" count={dateStats.normal} />
                            <div style={{ fontSize: 10, marginTop: 4 }}>BT</div>
                          </div>
                        </Col>
                      )}
                      {dateStats.low > 0 && (
                        <Col span={6}>
                          <div style={{ textAlign: "center" }}>
                            <Badge color="#52c41a" count={dateStats.low} />
                            <div style={{ fontSize: 10, marginTop: 4 }}>Thấp</div>
                          </div>
                        </Col>
                      )}
                    </Row>
                  </div>

                  <List
                    dataSource={selectedDateEvents}
                    renderItem={(event) => {
                      const priorityColors = {
                        high: "#ff4d4f",
                        normal: "#1890ff",
                        medium: "#faad14",
                        low: "#52c41a",
                      };
                      const color = priorityColors[event.priority] || "#1890ff";
                      return (
                        <List.Item
                          style={{
                            borderLeft: `3px solid ${color}`,
                            paddingLeft: 12,
                            cursor: "pointer",
                            marginBottom: 8,
                            borderRadius: 4,
                            backgroundColor: "#fafafa",
                          }}
                          onClick={() => {
                            // Navigate to task/project detail
                            console.log("View event:", event);
                            message.info(`Xem chi tiết: ${event.title}`);
                          }}
                        >
                          <div style={{ width: "100%" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                              <div style={{ flex: 1 }}>
                                <Text strong style={{ fontSize: 14 }}>{event.title}</Text>
                                <br />
                                <Space size="small" style={{ marginTop: 4 }}>
                                  <Text type="secondary" style={{ fontSize: 12 }}>
                                    📁 {event.project}
                                  </Text>
                                  {event.assignedTo && (
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                      👤 {event.assignedTo}
                                    </Text>
                                  )}
                                </Space>
                                {(event.time || event.points || event.estimatedHours) && (
                                  <div style={{ marginTop: 4 }}>
                                    <Space size="small" split="|">
                                      {event.time && (
                                        <Text type="secondary" style={{ fontSize: 11 }}>
                                          ⏰ {event.time}
                                        </Text>
                                      )}
                                      {event.points && (
                                        <Text type="secondary" style={{ fontSize: 11 }}>
                                          ⭐ {event.points} điểm
                                        </Text>
                                      )}
                                      {event.estimatedHours && (
                                        <Text type="secondary" style={{ fontSize: 11 }}>
                                          🕐 {event.estimatedHours}h
                                        </Text>
                                      )}
                                    </Space>
                                  </div>
                                )}
                              </div>
                              <Badge color={color} />
                            </div>
                          </div>
                        </List.Item>
                      );
                    }}
                  />
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <Text type="secondary">Không có sự kiện</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Chọn ngày khác để xem sự kiện
                  </Text>
                  <br />
                  <Button type="link" onClick={() => handleOpenQuickCreate(selectedDate)}>
                    + Thêm công việc cho ngày này
                  </Button>
                </div>
              )}
            </Card>
          </Col>
        </Row>

        {/* Legend */}
        <Row style={{ marginTop: 16 }} gutter={16}>
          <Col>
            <Badge color="#ff4d4f" text="Ưu tiên cao" />
          </Col>
          <Col>
            <Badge color="#faad14" text="Ưu tiên trung bình" />
          </Col>
          <Col>
            <Badge color="#1890ff" text="Ưu tiên bình thường" />
          </Col>
          <Col>
            <Badge color="#52c41a" text="Ưu tiên thấp" />
          </Col>
        </Row>
      </Card>
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <CalendarOutlined />
            <span>Tạo công việc mới - {clickedDate?.format("DD/MM/YYYY")}</span>
          </div>
        }
        open={isQuickCreateOpen}
        okText="Tạo công việc"
        cancelText="Hủy"
        confirmLoading={isSubmitting}
        onCancel={() => {
          setQuickCreateOpen(false);
          form.resetFields();
          setClickedDate(null);
        }}
        onOk={handleCreateEvent}
        destroyOnClose
        width={700}
      >
        <Form layout="vertical" form={form} preserve={false}>
          {conflictWarning && conflictWarning.hasConflict && (
            <Alert
              message="Cảnh báo: Trùng thời gian"
              description={
                <div>
                  <div style={{ marginBottom: 8 }}>
                    Phát hiện {conflictWarning.conflicts.length} công việc trùng thời gian:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {conflictWarning.conflicts.map((conflict, idx) => (
                      <li key={idx}>
                        {conflict.title} ({conflict.time})
                      </li>
                    ))}
                  </ul>
                </div>
              }
              type="warning"
              showIcon
              closable
              onClose={() => setConflictWarning(null)}
              style={{ marginBottom: 16 }}
            />
          )}
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item 
                label="Tên công việc" 
                name="taskName" 
                rules={[{ required: true, message: "Vui lòng nhập tên công việc" }]}
              >
                <Input placeholder="Nhập tên công việc" maxLength={200} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Ngày bắt đầu" name="startDate" rules={[{ required: true }]}>
                <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Ngày kết thúc" name="dueDate" rules={[{ required: true }]}>
                <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Loại công việc" name="type" rules={[{ required: true }]} initialValue="TASK">
                <Select>
                  <Option value="TASK">Công việc</Option>
                  <Option value="BUG">Lỗi</Option>
                  <Option value="FEATURE">Tính năng</Option>
                  <Option value="SUPPORT">Hỗ trợ</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Độ ưu tiên" name="priority" rules={[{ required: true }]} initialValue="NORMAL">
                <Select
                  onChange={(priority) => {
                    const formValues = form.getFieldsValue();
                    // Re-suggest assignee based on new priority
                    if (formValues.projectId) {
                      const suggested = suggestAssignee(
                        usersList,
                        allTasks,
                        formValues.projectId,
                        priority
                      );
                      if (suggested && !formValues.assignedToId) {
                        form.setFieldsValue({ assignedToId: suggested.id });
                      }
                    }
                    // Re-calculate estimated hours
                    const suggestedHours = suggestEstimatedHours({
                      ...formValues,
                      priority,
                    });
                    if (!formValues.estimatedHours) {
                      form.setFieldsValue({ estimatedHours: suggestedHours });
                    }
                  }}
                >
                  <Option value="LOW">Thấp</Option>
                  <Option value="MEDIUM">Trung bình</Option>
                  <Option value="HIGH">Cao</Option>
                  <Option value="URGENT">Khẩn cấp</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Trạng thái" name="status" rules={[{ required: true }]} initialValue="PENDING">
                <Select>
                  <Option value="PENDING">Chờ thực hiện</Option>
                  <Option value="IN_PROGRESS">Đang thực hiện</Option>
                  <Option value="REVIEW">Đang xem xét</Option>
                  <Option value="COMPLETED">Hoàn thành</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Dự án / Quy trình" name="projectId">
                <Select 
                  placeholder="Chọn dự án" 
                  allowClear 
                  showSearch
                  onChange={(projectId) => {
                    const formValues = form.getFieldsValue();
                    const suggested = suggestAssignee(
                      usersList,
                      allTasks,
                      projectId,
                      formValues.priority || "NORMAL"
                    );
                    if (suggested && !formValues.assignedToId) {
                      form.setFieldsValue({ assignedToId: suggested.id });
                    }
                  }}
                >
                  {(projectsList.length > 0 ? projectsList : sampleProjects).map((project) => (
                    <Option key={project.id} value={project.id}>
                      {project.projectName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                label="Người thực hiện" 
                name="assignedToId"
                tooltip="Tự động gợi ý dựa trên tải công việc hiện tại"
              >
                <Select 
                  placeholder="Chọn người thực hiện (tự động gợi ý)" 
                  allowClear 
                  showSearch
                >
                  {usersList.map((user) => (
                    <Option key={user.id} value={user.id}>
                      {user.fullName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Hạng mục" name="category">
                <Select placeholder="Chọn hạng mục" allowClear>
                  <Option value="DEVELOPMENT">Phát triển</Option>
                  <Option value="DESIGN">Thiết kế</Option>
                  <Option value="TESTING">Kiểm thử</Option>
                  <Option value="DOCUMENTATION">Tài liệu</Option>
                  <Option value="MEETING">Họp</Option>
                  <Option value="OTHER">Khác</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Biểu mẫu" name="formTemplate">
                <Select placeholder="Chọn biểu mẫu" allowClear>
                  <Option value="STANDARD">Chuẩn</Option>
                  <Option value="BUG_TEMPLATE">Mẫu Bug</Option>
                  <Option value="FEATURE_TEMPLATE">Mẫu Feature</Option>
                  <Option value="CHECKLIST">Checklist</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Điểm" name="points">
                <InputNumber min={0} max={100} placeholder="0" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                label="Số giờ ước tính" 
                name="estimatedHours"
                tooltip="Tự động tính toán dựa trên loại, ưu tiên và thời gian"
              >
                <InputNumber 
                  min={0} 
                  placeholder="Tự động tính" 
                  style={{ width: "100%" }}
                  onChange={(value) => {
                    // Allow manual override
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                label="Khung giờ thực hiện" 
                name="timeRange"
                tooltip="Chọn thời gian cụ thể trong ngày"
              >
                <TimePicker.RangePicker 
                  format="HH:mm" 
                  style={{ width: "100%" }} 
                  minuteStep={15}
                  onChange={(timeRange) => {
                    if (timeRange && timeRange.length === 2) {
                      const formValues = form.getFieldsValue();
                      const suggested = suggestEstimatedHours({
                        ...formValues,
                        timeRange,
                      });
                      form.setFieldsValue({ estimatedHours: suggested });
                    }
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Mô tả" name="description">
            <Input.TextArea rows={3} placeholder="Nhập mô tả công việc..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CalendarView;

