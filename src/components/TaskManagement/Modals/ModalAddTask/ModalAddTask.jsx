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
import "dayjs/locale/vi";
import weekday from "dayjs/plugin/weekday";
import localeData from "dayjs/plugin/localeData";
import { useEffect, useState } from "react";

// Extend dayjs with required plugins for DatePicker
dayjs.extend(weekday);
dayjs.extend(localeData);
dayjs.locale("vi");
import { useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";
import send_icon from "../../../../Icons/send_icon.svg";
import LoadingComponents from "../../../Loading/LoadingComponents";
import { apiCreateTask, apiUpdateTask } from "../../API";
import { 
  createWorkflowTask, 
  updateWorkflowTask,
  getWorkflowDropdownProjects,
  getWorkflowProjectUsers
} from "../../../WorkflowApp/API/workflowApi";
import { getUserInfo } from "../../../../store/selectors/Selectors";
import { useSelector } from "react-redux";
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
  const location = useLocation();
  const userInfo = useSelector(getUserInfo);
  
  // Detect if we're in workflow context
  const isInWorkflow = location.pathname.includes("/workflow");

  // Watch projectId in form
  const projectId = Form.useWatch("projectId", inputForm);

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

  // Task visibility / mode options
  const modeOptions = [
    { value: "INTERNAL", label: "Nội bộ" },
    { value: "PUBLIC", label: "Công khai" },
    { value: "PRIVATE", label: "Riêng tư" },
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

      if (isInWorkflow) {
        // Workflow API
        const now = new Date();
        // Khi EDIT: sử dụng yyyymm gốc của task (để tìm đúng bảng trong database)
        // Khi CREATE: sử dụng tháng hiện tại
        let yyyymm;
        if (props.openModalType === "EDIT") {
          // Ưu tiên: sử dụng yyyymm gốc từ currentRecord
          if (props.currentRecord?.yyyymm) {
            yyyymm = props.currentRecord.yyyymm;
          } 
          // Fallback 1: Tính từ startDate của task
          else if (props.currentRecord?.startDate) {
            const taskDate = new Date(props.currentRecord.startDate);
            yyyymm = `${taskDate.getFullYear()}${String(taskDate.getMonth() + 1).padStart(2, '0')}`;
          }
          // Fallback 2: Tính từ taskCode (format: TASK20260110001)
          else if (props.currentRecord?.taskCode && props.currentRecord.taskCode.match(/TASK(\d{8})/)) {
            const dateStr = props.currentRecord.taskCode.match(/TASK(\d{8})/)[1];
            yyyymm = dateStr.substring(0, 6); // Lấy 6 ký tự đầu: YYYYMM
          }
          // Fallback 3: Sử dụng tháng hiện tại (không khuyến nghị nhưng đỡ bị crash)
          else {
            yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
            console.warn("Không tìm thấy yyyymm gốc, sử dụng tháng hiện tại:", yyyymm);
          }
        } else {
          // Tạo mới: sử dụng tháng hiện tại
          yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
        }
        
        const workflowTaskData = {
          companyCode: formData.companyCode || "DVCS01",
          yyyymm: yyyymm,
          taskName: formData.taskName || "",
          projectId: formData.projectId || props.currentRecord?.projectId || null,
          parentTaskId: formData.parentTaskId || props.currentRecord?.parentTaskId || null,
          level: formData.level || props.currentRecord?.level || 1,
          status: formData.status || "PENDING",
          priority: formData.priority || "MEDIUM",
          mode: formData.mode || "INTERNAL",
          category: formData.type || props.currentRecord?.category || "TASK",
          formTemplate: formData.formTemplate || props.currentRecord?.formTemplate || "1",
          progress: formData.progress !== undefined && formData.progress !== null ? formData.progress : 0,
          estimatedHours: formData.estimatedHours !== undefined && formData.estimatedHours !== null ? formData.estimatedHours : 0,
          actualHours: formData.actualHours !== undefined && formData.actualHours !== null ? formData.actualHours : 0,
          startDate: formData.startDate ? formData.startDate.toISOString() : new Date().toISOString(),
          // Fix endDate không được null - ưu tiên endDate, nếu không có thì dùng dueDate, nếu không có thì dùng startDate
          endDate: formData.endDate 
            ? formData.endDate.toISOString() 
            : (formData.dueDate 
              ? formData.dueDate.toISOString() 
              : (formData.startDate ? formData.startDate.toISOString() : new Date().toISOString())),
          dueDate: formData.dueDate ? formData.dueDate.toISOString() : null,
          // Fix cứng assignedBy và createdBy = 1
          assignedBy: 1,
          assignedTo: formData.assignedToId || null,
          reviewerId: formData.reviewerId || props.currentRecord?.reviewerId || null,
          description: formData.description || "",
          createdBy: 1,
        };

        if (props.openModalType === "EDIT") {
          // Update task - cần taskId và yyyymm chính xác
          // Lấy ID từ nhiều nguồn có thể
          let recordId = props.currentRecord?.id || props.currentRecord?.taskId || props.currentRecord?.Id;
          
          // Fallback: Nếu có _rawTask, lấy từ đó
          if (!recordId && props.currentRecord?._rawTask) {
            recordId = props.currentRecord._rawTask.TaskId || 
                      props.currentRecord._rawTask.Id || 
                      props.currentRecord._rawTask.id;
          }
          
          // Fallback: Nếu ID là string (TaskCode), extract number
          if (recordId && typeof recordId === 'string' && recordId.startsWith('TASK')) {
            // Nếu là TaskCode (TASK20260110002), extract ID từ database
            console.warn("ID là TaskCode, không thể update. Cần reload data với đúng ID từ database.");
            throw new Error(`Không thể update: Task ID không hợp lệ (${recordId}). Vui lòng reload trang và thử lại.`);
          }
          
          workflowTaskData.taskId = recordId;
          // Fix cứng updatedBy = 1
          workflowTaskData.updatedBy = 1;
          
          console.log("=== UPDATE TASK - DEBUG ===");
          console.log("props.currentRecord:", props.currentRecord);
          console.log("_rawTask:", props.currentRecord?._rawTask);
          console.log("Extracted taskId:", recordId);
          console.log("yyyymm:", workflowTaskData.yyyymm);
          
          // Validation trước khi gọi API
          if (!workflowTaskData.taskId || typeof workflowTaskData.taskId !== 'number') {
            console.error("=== ERROR: Task ID không hợp lệ ===");
            console.error("currentRecord:", props.currentRecord);
            console.error("taskId:", workflowTaskData.taskId);
            console.error("Type:", typeof workflowTaskData.taskId);
            
            // Show detailed error
            const debugInfo = {
              currentRecordKeys: props.currentRecord ? Object.keys(props.currentRecord) : [],
              id: props.currentRecord?.id,
              taskId: props.currentRecord?.taskId,
              Id: props.currentRecord?.Id,
              taskCode: props.currentRecord?.taskCode,
              rawTaskKeys: props.currentRecord?._rawTask ? Object.keys(props.currentRecord._rawTask) : []
            };
            
            throw new Error(
              `Task ID không hợp lệ!\n\n` +
              `Debug info:\n${JSON.stringify(debugInfo, null, 2)}\n\n` +
              `Vui lòng:\n` +
              `1. Mở Console (F12)\n` +
              `2. Chụp màn hình logs\n` +
              `3. Reload trang và thử lại`
            );
          }
          if (!workflowTaskData.yyyymm) {
            throw new Error("Không tìm thấy tháng của công việc (yyyymm)");
          }
          
          console.log("✓ Validation passed");
          console.log("Updating task with data:", workflowTaskData);
          
          const response = await updateWorkflowTask(workflowTaskData);
          console.log("Update response:", response);
          
          notification.success({
            message: "Thành công",
            description: "Cập nhật công việc thành công",
          });
        } else {
          // Create task
          console.log("=== CREATE TASK ===");
          console.log("Creating task with data:", workflowTaskData);
          
          const response = await createWorkflowTask(workflowTaskData);
          console.log("Create response:", response);
          
          notification.success({
            message: "Thành công",
            description: "Tạo công việc mới thành công",
          });
        }

        props.refreshData();
        handleCancelModal();
      } else {
        // API cũ
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
          mode: formData.mode || "INTERNAL",
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
      }
    } catch (error) {
      console.error("=== ERROR IN onSubmitForm ===");
      console.error("Error:", error);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      
      notification.error({
        message: "Lỗi",
        description: error.message || "Có lỗi xảy ra khi lưu công việc",
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
      if (!isInWorkflow) {
        setProjectsList([]);
        return;
      }

      const response = await getWorkflowDropdownProjects({ 
        companyCode: "DVCS01" 
      });

      if (Array.isArray(response)) {
        const mappedProjects = response.map((project) => {
          // API có thể trả về value field là ID của project
          const projectId = project.value || project.Id || project.id || project.Value;
          return {
            id: projectId,
            projectName: project.ProjectName || project.projectName || project.label || "",
            projectCode: project.ProjectCode || project.projectCode || "",
          };
        });
        setProjectsList(mappedProjects);
      } else {
        setProjectsList([]);
      }
    } catch (error) {
      console.error("Error loading projects:", error);
      setProjectsList([]);
    }
  };

  const loadUsers = async (projectId) => {
    try {
      if (!isInWorkflow) {
        setUsersList([]);
        return;
      }

      if (!projectId) {
        setUsersList([]);
        return;
      }

      // Đảm bảo projectId là số (API có thể yêu cầu number)
      const numericProjectId = typeof projectId === 'string' ? parseInt(projectId, 10) : projectId;
      if (isNaN(numericProjectId)) {
        console.error("Invalid projectId:", projectId);
        setUsersList([]);
        return;
      }

      const response = await getWorkflowProjectUsers({ 
        companyCode: "DVCS01",
        projectId: numericProjectId
      });

      if (Array.isArray(response)) {
        const mappedUsers = response.map((user) => ({
          id: user.Id || user.id || user.UserId || user.userId,
          fullName: user.FullName || user.fullName || "",
          email: user.Email || user.email || "",
        }));
        setUsersList(mappedUsers);
      } else {
        setUsersList([]);
      }
    } catch (error) {
      console.error("Error loading users:", error);
      setUsersList([]);
    }
  };

  // Effects
  useEffect(() => {
    setOpenModal(props.openModalAddTaskState);
  }, [props.openModalAddTaskState]);

  useEffect(() => {
    if (isOpenModal) {
      loadProjects();

      if (props.openModalType === "EDIT" && props.currentRecord) {
        // Set status options based on task type
        const taskType = props.currentRecord.type || props.currentRecord.category || "TASK";
        setStatusOptions(getStatusOptions(taskType));
        
        // Đảm bảo projectId được convert sang number để match với Select value
        const editProjectId = props.currentRecord.projectId 
          ? (typeof props.currentRecord.projectId === 'string' 
              ? parseInt(props.currentRecord.projectId, 10) 
              : (isNaN(props.currentRecord.projectId) ? null : props.currentRecord.projectId))
          : null;
        
        // Helper function để parse date an toàn
        const parseDate = (dateValue) => {
          if (!dateValue) return null;
          try {
            const parsed = dayjs(dateValue);
            // Kiểm tra xem dayjs có parse được không (isValid)
            return parsed.isValid() ? parsed : null;
          } catch (error) {
            console.warn("Error parsing date:", dateValue, error);
            return null;
          }
        };

        inputForm.setFieldsValue({
          taskCode: props.currentRecord.taskCode,
          taskName: props.currentRecord.taskName,
          description: props.currentRecord.description,
          status: props.currentRecord.status,
          priority: props.currentRecord.priority,
          projectId: editProjectId,
          assignedToId: props.currentRecord.assignedToId,
          type: taskType,
          mode: props.currentRecord.mode || "INTERNAL",
          dueDate: parseDate(props.currentRecord.dueDate),
          startDate: parseDate(props.currentRecord.startDate),
          endDate: parseDate(props.currentRecord.endDate),
          estimatedHours: props.currentRecord.estimatedHours,
          actualHours: props.currentRecord.actualHours,
          progress: props.currentRecord.progress,
          notes: props.currentRecord.notes,
        });
        
        // Load users ngay sau khi set projectId trong EDIT mode
        if (editProjectId && isInWorkflow) {
          loadUsers(editProjectId);
        }
        
        console.log("Edit mode - currentRecord:", props.currentRecord);
        console.log("Edit mode - projectId:", editProjectId);
      } else {
        inputForm.resetFields();
        setInitialValues({});
        setStatusOptions(getStatusOptions("TASK"));
      }
    }
  }, [isOpenModal, props.openModalType, props.currentRecord]);

  // Watch projectId changes and load users accordingly (cho cả CREATE và EDIT khi user thay đổi project)
  useEffect(() => {
    if (isOpenModal && isInWorkflow && projectId) {
      loadUsers(projectId);
    } else if (isOpenModal && !projectId) {
      // Clear users list when no project is selected
      setUsersList([]);
    }
  }, [projectId, isOpenModal, isInWorkflow]);

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
      width={750}
      footer={null}
      className="modal-add-task"
      style={{ top: 20 }}
    >
      <div style={{ padding: "12px 0" }}>
        <Form
          form={inputForm}
          layout="vertical"
          onFinish={onSubmitForm}
          onFinishFailed={onSubmitFormFail}
          autoComplete="off"
          initialValues={initialValues}
          requiredMark={false}
        >
          <Row gutter={[12, 0]}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Mã công việc"
                name="taskCode"
                rules={[
                  // Chỉ bắt buộc nhập mã công việc khi không phải workflow mode
                  // Trong workflow mode, mã được tạo tự động bởi stored procedure
                  { required: !isInWorkflow && props.openModalType !== "EDIT", message: "Vui lòng nhập mã công việc" },
                  { max: 50, message: "Mã công việc không được quá 50 ký tự" },
                ]}
                tooltip={isInWorkflow ? "Mã công việc sẽ được tạo tự động" : props.openModalType === "EDIT" ? "Mã công việc không thể thay đổi" : undefined}
              >
                <Input
                  placeholder={isInWorkflow ? "Tự động tạo (TASK + ngày + số thứ tự)" : "Nhập mã công việc"}
                  disabled={disableFields || props.openModalType === "EDIT" || (isInWorkflow && props.openModalType !== "EDIT")}
                  style={{ textTransform: "uppercase" }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label={
                  <span>
                    Tên công việc <span style={{ color: "red" }}>*</span>
                  </span>
                }
                name="taskName"
                rules={[
                  { required: true, message: "Vui lòng nhập tên công việc" },
                  {
                    max: 255,
                    message: "Tên công việc không được quá 255 ký tự",
                  },
                  {
                    whitespace: true,
                    message: "Tên công việc không được để trống",
                  },
                ]}
              >
                <Input
                  placeholder="Nhập tên công việc"
                  disabled={disableFields}
                  showCount
                  maxLength={255}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Mô tả công việc"
            name="description"
            rules={[
              { max: 5000, message: "Mô tả không được quá 5000 ký tự" },
            ]}
          >
            <TextArea
              rows={2}
              placeholder="Nhập mô tả công việc"
              disabled={disableFields}
              showCount
              maxLength={5000}
            />
          </Form.Item>

          <Row gutter={[12, 0]}>
            <Col xs={24} sm={8}>
              <Form.Item
                label={
                  <span>
                    Loại <span style={{ color: "red" }}>*</span>
                  </span>
                }
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
                label={
                  <span>
                    Trạng thái <span style={{ color: "red" }}>*</span>
                  </span>
                }
                name="status"
                rules={[
                  { required: true, message: "Vui lòng chọn trạng thái" },
                ]}
                tooltip="Chọn trạng thái hiện tại của công việc"
              >
                <Select 
                  placeholder="Chọn trạng thái" 
                  disabled={disableFields}
                  onChange={(value) => {
                    // Tự động set tiến độ 100% khi status = COMPLETED
                    if (value === "COMPLETED") {
                      inputForm.setFieldsValue({ progress: 100 });
                    }
                  }}
                >
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
                label={
                  <span>
                    Độ ưu tiên <span style={{ color: "red" }}>*</span>
                  </span>
                }
                name="priority"
                rules={[
                  { required: true, message: "Vui lòng chọn độ ưu tiên" },
                ]}
                tooltip="Chọn mức độ ưu tiên của công việc"
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
                label={
                  <span>
                    Chế độ <span style={{ color: "red" }}>*</span>
                  </span>
                }
                name="mode"
                rules={[
                  { required: true, message: "Vui lòng chọn chế độ" },
                ]}
                initialValue="INTERNAL"
              >
                <Select placeholder="Chọn chế độ" disabled={disableFields}>
                  {modeOptions.map((option) => (
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
                tooltip="Tiến độ sẽ tự động đặt 100% khi trạng thái là 'Hoàn thành'"
              >
                <InputNumber
                  style={{ width: "100%" }}
                  placeholder="0"
                  min={0}
                  max={100}
                  disabled={disableFields}
                  controls={false}
                  formatter={(value) => `${value}%`}
                  parser={(value) => value.replace('%', '')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[12, 0]}>
            <Col xs={24} sm={12}>
              <Form.Item 
                label="Dự án" 
                name="projectId"
                tooltip={props.openModalType === "EDIT" ? "Không thể thay đổi dự án sau khi đã tạo công việc" : undefined}
              >
                <Select
                  placeholder="Chọn dự án"
                  disabled={disableFields || props.openModalType === "EDIT"}
                  allowClear={props.openModalType !== "EDIT"}
                  showSearch
                  filterOption={(input, option) =>
                    option.children
                      .toLowerCase()
                      .indexOf(input.toLowerCase()) >= 0
                  }
                  onChange={(value) => {
                    // Reset assignedToId when project changes
                    inputForm.setFieldsValue({ assignedToId: undefined });
                    // Load users for selected project
                    if (value && isInWorkflow) {
                      loadUsers(value);
                    } else {
                      setUsersList([]);
                    }
                  }}
                >
                  {projectsList.map((project) => {
                    // Đảm bảo value là number để match với API
                    const projectValue = typeof project.id === 'string' ? parseInt(project.id, 10) : project.id;
                    const displayText = project.projectCode 
                      ? `${project.projectName || ''} - ${project.projectCode}`.trim()
                      : project.projectName || project.projectCode || `Dự án ${project.id}`;
                    return (
                      <Option key={project.id} value={projectValue}>
                        {displayText}
                      </Option>
                    );
                  })}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Người thực hiện" name="assignedToId">
                <Select
                  placeholder={projectId ? "Chọn người thực hiện" : "Chọn dự án trước"}
                  disabled={disableFields || !projectId}
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

          <Row gutter={[12, 0]}>
            <Col xs={24} sm={12}>
              <Form.Item 
                label="Ngày hết hạn" 
                name="dueDate"
                rules={[
                  {
                    validator: (_, value) => {
                      if (!value) {
                        return Promise.resolve();
                      }
                      const selectedDate = dayjs(value);
                      const today = dayjs().startOf('day');
                      if (selectedDate.isBefore(today)) {
                        return Promise.reject(new Error("Ngày hết hạn không được là ngày trong quá khứ"));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  placeholder="Chọn ngày hết hạn"
                  format="DD/MM/YYYY"
                  disabled={disableFields}
                  disabledDate={(current) => {
                    // Disable past dates
                    return current && current < dayjs().startOf('day');
                  }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Số giờ ước tính"
                name="estimatedHours"
                rules={[
                  { 
                    type: "number", 
                    min: 0, 
                    message: "Số giờ phải lớn hơn hoặc bằng 0" 
                  },
                  {
                    validator: (_, value) => {
                      if (value !== null && value !== undefined) {
                        if (value < 0) {
                          return Promise.reject(new Error("Số giờ không được âm"));
                        }
                        if (value > 10000) {
                          return Promise.reject(new Error("Số giờ không được vượt quá 10,000 giờ"));
                        }
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
                tooltip="Số giờ ước tính để hoàn thành công việc"
              >
                <InputNumber
                  style={{ width: "100%" }}
                  placeholder="0"
                  min={0}
                  max={10000}
                  step={0.5}
                  precision={2}
                  disabled={disableFields}
                  controls={false}
                  formatter={(value) => value ? `${value} giờ` : ''}
                  parser={(value) => value.replace(' giờ', '')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Ghi chú"
            name="notes"
            rules={[
              { max: 2000, message: "Ghi chú không được quá 2000 ký tự" },
            ]}
            style={{ marginBottom: 24 }}
          >
            <TextArea
              rows={2}
              placeholder="Nhập ghi chú"
              disabled={disableFields}
              showCount
              maxLength={2000}
            />
          </Form.Item>

          <Form.Item
            style={{ textAlign: "right", marginBottom: 0, marginTop: 0 }}
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
