import {
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  notification,
  Row,
  Select,
  Space,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import send_icon from "../../../../Icons/send_icon.svg";
import LoadingComponents from "../../../Loading/LoadingComponents";
import { apiCreateTask, apiUpdateTask, TaskManagementGetApi } from "../../API";
import { addTask, updateTask } from "../../Store/Slices/TaskSlice";
import "./ModalAddTask.css";

const { Option } = Select;
const { TextArea } = Input;

const ModalAddTask = (props) => {
  const [inputForm] = Form.useForm();
  const [isOpenModal, setOpenModal] = useState();
  const [initialValues, setInitialValues] = useState({});
  const [disableFields, setDisableFields] = useState(false);
  const [loading, setLoading] = useState(false);
  const [projectsList, setProjectsList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const dispatch = useDispatch();

  // Task status options - dynamic based on type
  const getStatusOptions = (taskType = "TASK") => {
    const baseStatuses = [
      { value: "PENDING", label: "Chờ thực hiện" },
      { value: "IN_PROGRESS", label: "Đang thực hiện" },
      { value: "REVIEW", label: "Đang xem xét" },
      { value: "COMPLETED", label: "Hoàn thành" },
      { value: "CANCELLED", label: "Đã hủy" },
    ];

    // BUG workflow: PENDING -> IN_PROGRESS -> TESTING -> RESOLVED -> CLOSED
    if (taskType === "BUG") {
      return [
        { value: "PENDING", label: "Chờ thực hiện" },
        { value: "IN_PROGRESS", label: "Đang thực hiện" },
        { value: "TESTING", label: "Đang test" },
        { value: "RESOLVED", label: "Đã giải quyết" },
        { value: "CLOSED", label: "Đã đóng" },
        { value: "CANCELLED", label: "Đã hủy" },
      ];
    }

    // FEATURE workflow: PENDING -> IN_PROGRESS -> REVIEW -> DONE
    if (taskType === "FEATURE") {
      return [
        { value: "PENDING", label: "Chờ thực hiện" },
        { value: "IN_PROGRESS", label: "Đang thực hiện" },
        { value: "REVIEW", label: "Đang xem xét" },
        { value: "DONE", label: "Hoàn thành" },
        { value: "CANCELLED", label: "Đã hủy" },
      ];
    }

    // SUPPORT workflow: PENDING -> IN_PROGRESS -> WAITING_FEEDBACK -> RESOLVED
    if (taskType === "SUPPORT") {
      return [
        { value: "PENDING", label: "Chờ thực hiện" },
        { value: "IN_PROGRESS", label: "Đang thực hiện" },
        { value: "WAITING_FEEDBACK", label: "Chờ phản hồi" },
        { value: "RESOLVED", label: "Đã giải quyết" },
        { value: "CANCELLED", label: "Đã hủy" },
      ];
    }

    // Default TASK workflow
    return baseStatuses;
  };

  const [statusOptions, setStatusOptions] = useState(getStatusOptions());

  // Priority options
  const priorityOptions = [
    { value: "LOW", label: "Thấp" },
    { value: "MEDIUM", label: "Trung bình" },
    { value: "HIGH", label: "Cao" },
    { value: "URGENT", label: "Khẩn cấp" },
  ];

  // Task type options
  const typeOptions = [
    { value: "TASK", label: "Công việc" },
    { value: "BUG", label: "Lỗi" },
    { value: "FEATURE", label: "Tính năng" },
    { value: "SUPPORT", label: "Hỗ trợ" },
  ];

  const handleCancelModal = () => {
    setOpenModal(false);
    props.handleCloseModal();
    inputForm.resetFields();
    setDisableFields(false);
    setInitialValues({});
  };

  const onSubmitForm = async () => {
    try {
      setLoading(true);
      const formData = inputForm.getFieldsValue();

      const taskData = {
        action: props.openModalType === "EDIT" ? "EDIT" : "ADD",
        id:
          props.openModalType === "EDIT" ? props.currentRecord?.id : undefined,
        taskCode: formData.taskCode,
        taskName: formData.taskName,
        description: formData.description,
        type: formData.type || "TASK",
        status: formData.status,
        priority: formData.priority,
        projectId: formData.projectId,
        assignedToId: formData.assignedToId,
        dueDate: formData.dueDate
          ? formData.dueDate.format("YYYY-MM-DD")
          : null,
        estimatedHours: formData.estimatedHours,
        actualHours: formData.actualHours || 0,
        progress: formData.progress || 0,
        notes: formData.notes,
        userid: 0,
      };

      const apiCall =
        props.openModalType === "EDIT" ? apiUpdateTask : apiCreateTask;
      const response = await apiCall(taskData);

      if (response.status === 200 && response.data === true) {
        notification.success({
          message: "Thành công",
          description:
            props.openModalType === "EDIT"
              ? "Cập nhật công việc thành công"
              : "Tạo công việc mới thành công",
        });

        // Update Redux store
        if (props.openModalType === "EDIT") {
          dispatch(updateTask({ ...taskData, id: props.currentRecord.id }));
        } else {
          dispatch(addTask(taskData));
        }

        props.refreshData();
        handleCancelModal();
      } else {
        notification.warning({
          message: "Cảnh báo",
          description: "Có lỗi xảy ra khi thực hiện thao tác",
        });
      }
    } catch (error) {
      console.error("Error saving task:", error);
      notification.error({
        message: "Lỗi",
        description: "Có lỗi xảy ra khi lưu công việc",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmitFormFail = () => {
    notification.error({
      message: "Lỗi",
      description: "Vui lòng kiểm tra lại thông tin đã nhập",
    });
  };

  const loadProjects = async () => {
    try {
      const response = await TaskManagementGetApi({
        store: "Api_Get_Projects_For_Tasks",
        data: { active: true },
      });

      if (response.status === 200 && response.data) {
        setProjectsList(response.data);
      }
    } catch (error) {
      console.error("Error loading projects:", error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await TaskManagementGetApi({
        store: "Api_Get_Users_For_Tasks",
        data: { active: true },
      });

      if (response.status === 200 && response.data) {
        setUsersList(response.data);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  // Effects
  useEffect(() => {
    setOpenModal(props.openModalAddTaskState);
  }, [props.openModalAddTaskState]);

  useEffect(() => {
    if (isOpenModal) {
      loadProjects();
      loadUsers();

      if (props.openModalType === "EDIT" && props.currentRecord) {
        inputForm.setFieldsValue({
          taskCode: props.currentRecord.taskCode,
          taskName: props.currentRecord.taskName,
          description: props.currentRecord.description,
          status: props.currentRecord.status,
          priority: props.currentRecord.priority,
          projectId: props.currentRecord.projectId,
          assignedToId: props.currentRecord.assignedToId,
          dueDate: props.currentRecord.dueDate
            ? dayjs(props.currentRecord.dueDate)
            : null,
          estimatedHours: props.currentRecord.estimatedHours,
          actualHours: props.currentRecord.actualHours,
          progress: props.currentRecord.progress,
          notes: props.currentRecord.notes,
        });
      } else {
        inputForm.resetFields();
        setInitialValues({});
      }
    }
  }, [isOpenModal, props.openModalType, props.currentRecord]);

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "18px", fontWeight: "600" }}>
            {props.openModalType === "EDIT"
              ? "Chỉnh sửa công việc"
              : "Thêm công việc mới"}
          </span>
        </div>
      }
      open={isOpenModal}
      onCancel={handleCancelModal}
      width={800}
      footer={null}
      className="modal-add-task"
    >
      <div style={{ maxHeight: "70vh", overflowY: "auto", padding: "20px 0" }}>
        <Form
          form={inputForm}
          layout="vertical"
          onFinish={onSubmitForm}
          onFinishFailed={onSubmitFormFail}
          autoComplete="off"
          initialValues={initialValues}
        >
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Mã công việc"
                name="taskCode"
                rules={[
                  { required: true, message: "Vui lòng nhập mã công việc" },
                  { max: 50, message: "Mã công việc không được quá 50 ký tự" },
                ]}
              >
                <Input
                  placeholder="Nhập mã công việc"
                  disabled={disableFields}
                  style={{ textTransform: "uppercase" }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Tên công việc"
                name="taskName"
                rules={[
                  { required: true, message: "Vui lòng nhập tên công việc" },
                  {
                    max: 200,
                    message: "Tên công việc không được quá 200 ký tự",
                  },
                ]}
              >
                <Input
                  placeholder="Nhập tên công việc"
                  disabled={disableFields}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Mô tả công việc"
            name="description"
            rules={[{ max: 1000, message: "Mô tả không được quá 1000 ký tự" }]}
          >
            <TextArea
              rows={3}
              placeholder="Nhập mô tả công việc"
              disabled={disableFields}
            />
          </Form.Item>

          <Row gutter={[16, 0]}>
            <Col xs={24} sm={8}>
              <Form.Item
                label="Loại"
                name="type"
                rules={[
                  { required: true, message: "Vui lòng chọn loại" },
                ]}
                initialValue="TASK"
              >
                <Select 
                  placeholder="Chọn loại" 
                  disabled={disableFields}
                  onChange={(value) => {
                    const newStatusOptions = getStatusOptions(value);
                    setStatusOptions(newStatusOptions);
                    // Reset status to first option of new workflow
                    inputForm.setFieldsValue({ status: newStatusOptions[0].value });
                  }}
                >
                  {typeOptions.map((option) => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                label="Trạng thái"
                name="status"
                rules={[
                  { required: true, message: "Vui lòng chọn trạng thái" },
                ]}
              >
                <Select placeholder="Chọn trạng thái" disabled={disableFields}>
                  {statusOptions.map((option) => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                label="Độ ưu tiên"
                name="priority"
                rules={[
                  { required: true, message: "Vui lòng chọn độ ưu tiên" },
                ]}
              >
                <Select placeholder="Chọn độ ưu tiên" disabled={disableFields}>
                  {priorityOptions.map((option) => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                label="Tiến độ (%)"
                name="progress"
                rules={[
                  {
                    type: "number",
                    min: 0,
                    max: 100,
                    message: "Tiến độ phải từ 0 đến 100%",
                  },
                ]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  placeholder="0"
                  min={0}
                  max={100}
                  disabled={disableFields}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <Form.Item label="Dự án" name="projectId">
                <Select
                  placeholder="Chọn dự án"
                  disabled={disableFields}
                  allowClear
                  showSearch
                  filterOption={(input, option) =>
                    option.children
                      .toLowerCase()
                      .indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {projectsList.map((project) => (
                    <Option key={project.id} value={project.id}>
                      {project.projectName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Người thực hiện" name="assignedToId">
                <Select
                  placeholder="Chọn người thực hiện"
                  disabled={disableFields}
                  allowClear
                  showSearch
                  filterOption={(input, option) =>
                    option.children
                      .toLowerCase()
                      .indexOf(input.toLowerCase()) >= 0
                  }
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

          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <Form.Item label="Ngày hết hạn" name="dueDate">
                <DatePicker
                  style={{ width: "100%" }}
                  placeholder="Chọn ngày hết hạn"
                  format="DD/MM/YYYY"
                  disabled={disableFields}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Số giờ ước tính"
                name="estimatedHours"
                rules={[
                  { type: "number", min: 0, message: "Số giờ phải lớn hơn 0" },
                ]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  placeholder="0"
                  min={0}
                  disabled={disableFields}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Ghi chú"
            name="notes"
            rules={[{ max: 500, message: "Ghi chú không được quá 500 ký tự" }]}
          >
            <TextArea
              rows={3}
              placeholder="Nhập ghi chú"
              disabled={disableFields}
            />
          </Form.Item>

          <Form.Item
            style={{ textAlign: "right", marginBottom: 0, marginTop: 24 }}
          >
            <Space>
              <Button onClick={handleCancelModal}>Hủy</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={
                  <img
                    src={send_icon}
                    alt="send"
                    style={{ width: 16, height: 16 }}
                  />
                }
              >
                {props.openModalType === "EDIT" ? "Cập nhật" : "Tạo mới"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

      {loading && <LoadingComponents />}
    </Modal>
  );
};

export default ModalAddTask;
