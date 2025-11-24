import { CalendarOutlined } from "@ant-design/icons";
import {
  Badge,
  Card,
  Col,
  Row,
  Select,
  Space,
  Typography,
  Calendar as AntCalendar,
  List,
} from "antd";
import { useMemo, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import weekday from "dayjs/plugin/weekday";
import localeData from "dayjs/plugin/localeData";
import { getSampleCalendarEvents, getSampleProjects } from "../../../WorkflowApp/utils/workflowSampleData";
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
  const [events] = useState(() => getSampleCalendarEvents());

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
    return (
      <div style={{ minHeight: 60 }}>
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
            >
              {event.title}
            </div>
          );
        })}
      </div>
    );
  };

  const selectedDateEvents = getDateEvents(selectedDate);

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
            <Space>
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
                }
              }}
            />
          </Col>
          <Col xs={24} lg={8}>
            <Card
              title={`Sự kiện ngày ${selectedDate.format("DD/MM/YYYY")}`}
              size="small"
            >
              {selectedDateEvents.length > 0 ? (
                <List
                  dataSource={selectedDateEvents}
                  renderItem={(event) => {
                    const priorityColors = {
                      high: "#ff4d4f",
                      normal: "#1890ff",
                      medium: "#faad14",
                      low: "#52c41a",
                    };
                    return (
                      <List.Item>
                        <div>
                          <Text strong>{event.title}</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {event.project}
                          </Text>
                        </div>
                      </List.Item>
                    );
                  }}
                />
              ) : (
                <Text type="secondary">Không có sự kiện</Text>
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
    </div>
  );
};

export default CalendarView;

