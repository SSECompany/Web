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
import { useLocation } from "react-router-dom";
import send_icon from "../../../../Icons/send_icon.svg";
import LoadingComponents from "../../../Loading/LoadingComponents";
import {
  apiCreateProject,
  apiUpdateProject,
  apiGetProject,
} from "../../API";
import { addProject, updateProject } from "../../Store/Slices/ProjectSlice";
import { 
  createWorkflowProject,
  updateWorkflowProject,
  getWorkflowProjectDetail,
} from "../../../WorkflowApp/API/workflowApi";
import { getUserInfo } from "../../../../store/selectors/Selectors";
import { useSelector } from "react-redux";
import "./ModalAddProject.css";

const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const ModalAddProject = (props) => {
  const location = useLocation();
  const isInWorkflow = location.pathname.includes('/workflow');
  const [inputForm] = Form.useForm();
  const [isOpenModal, setOpenModal] = useState();
  const [initialValues, setInitialValues] = useState({});
  const [disableFields, setDisableFields] = useState(false);
  const [loading, setLoading] = useState(false);
  const [managersList, setManagersList] = useState([]);
  const [customersList, setCustomersList] = useState([]);
  const dispatch = useDispatch();
  const userInfo = useSelector(getUserInfo);

  // Project status options
  const statusOptions = [
    { value: "PLANNING", label: "Lập kế hoạch" },
    { value: "IN_PROGRESS", label: "Đang thực hiện" },
    { value: "ON_HOLD", label: "Tạm dừng" },
    { value: "COMPLETED", label: "Hoàn thành" },
    { value: "CANCELLED", label: "Đã hủy" },
  ];

  // Priority options
  const priorityOptions = [
    { value: "LOW", label: "Thấp" },
    { value: "MEDIUM", label: "Trung bình" },
    { value: "HIGH", label: "Cao" },
    { value: "URGENT", label: "Khẩn cấp" },
  ];

  const handleCancelModal = () => {
    setOpenModal(false);
    props.handleCloseModal();
    inputForm.resetFields();
    setDisableFields(false);
    setInitialValues({});
  };

  const handleUseTemplate = async (templateId) => {
    // TODO: Implement template API trong workflow
    notification.warning({
      message: "Thông báo",
      description: "Chức năng template chưa được hỗ trợ",
    });
  };

  const onSubmitForm = async () => {
    try {
      setLoading(true);
      const formData = inputForm.getFieldsValue();

      // Nếu đang ở trong workflow context, sử dụng workflow API
      if (isInWorkflow) {
        const workflowProjectData = {
          // Hardcode theo yêu cầu
          companyCode: "DVCS01",
          projectName: formData.projectName || "",
          status: formData.status || "",
          priority: formData.priority || "",
          projectManagerId: formData.projectManagerId || 1,
          orgUnitId: formData.orgUnitId || 1, // TODO: bind orgUnitId vào form khi có
          customerId: formData.customerId ?? null,
          clientName: formData.customerId 
            ? customersList.find(c => c.id === formData.customerId)?.customerName || ""
            : formData.clientName || "",
          healthStatus: formData.healthStatus || "",
          startDate: formData.dateRange?.[0]
            ? formData.dateRange[0].toISOString()
            : undefined,
          endDate: formData.dateRange?.[1]
            ? formData.dateRange[1].toISOString()
            : undefined,
          budget: formData.budget ?? null,
          budgetUsed: formData.budgetUsed ?? null,
          progress: formData.progress ?? 0,
          description: formData.description || "",
          // Thêm 3 trường mới
          estimatedHours: formData.estimatedHours ?? null,
          actualHours: formData.actualHours ?? null,
          notes: formData.notes || "",
        };

        try {
          if (props.openModalType === "EDIT") {
            // Cập nhật dự án
            const projectId = props.currentRecord?.id || props.currentRecord?.Id || props.currentRecord?.projectId;
            if (!projectId) {
              notification.error({
                message: "Lỗi",
                description: "Không tìm thấy ID dự án để cập nhật",
              });
              return;
            }

            workflowProjectData.projectId = parseInt(projectId);
            // Hardcode theo yêu cầu
            workflowProjectData.updatedBy = 1;
            
            // Đảm bảo có đầy đủ dữ liệu cần thiết
            if (!workflowProjectData.projectName) {
              notification.error({
                message: "Lỗi",
                description: "Vui lòng nhập tên dự án",
              });
              return;
            }
            
            console.log("Updating project with data:", workflowProjectData);
            const result = await updateWorkflowProject(workflowProjectData);
            console.log("Update result:", result);

            notification.success({
              message: "Thành công",
              description: "Cập nhật dự án thành công",
            });
          } else {
            // Tạo mới dự án
            workflowProjectData.createdBy = 1; // Hardcode theo yêu cầu
            
            console.log("Creating project with data:", workflowProjectData);
            await createWorkflowProject(workflowProjectData);

            notification.success({
              message: "Thành công",
              description: "Tạo dự án mới thành công",
            });
          }

          props.refreshData();
          handleCancelModal();
          return;
        } catch (workflowError) {
          console.error("Workflow API error:", workflowError);
          notification.error({
            message: "Lỗi",
            description: workflowError.response?.data?.message || workflowError.message || "Có lỗi xảy ra khi thao tác dự án",
          });
          return;
        }
      }

      // Code cũ cho edit hoặc fallback
      const projectData = {
        action: props.openModalType === "EDIT" ? "EDIT" : "ADD",
        id:
          props.openModalType === "EDIT" ? props.currentRecord?.id : undefined,
        projectCode: formData.projectCode,
        projectName: formData.projectName,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        projectManagerId: formData.projectManagerId,
        customerId: formData.customerId,
        startDate: formData.dateRange
          ? formData.dateRange[0].format("YYYY-MM-DD")
          : null,
        endDate: formData.dateRange
          ? formData.dateRange[1].format("YYYY-MM-DD")
          : null,
        budget: formData.budget,
        estimatedHours: formData.estimatedHours,
        actualHours: formData.actualHours || 0,
        progress: formData.progress || 0,
        notes: formData.notes,
        userid: 0,
      };

      const apiCall =
        props.openModalType === "EDIT" ? apiUpdateProject : apiCreateProject;
      const response = await apiCall(projectData);

      if (response.status === 200 && response.data === true) {
        notification.success({
          message: "Thành công",
          description:
            props.openModalType === "EDIT"
              ? "Cập nhật dự án thành công"
              : "Tạo dự án mới thành công",
        });

        // Update Redux store
        if (props.openModalType === "EDIT") {
          dispatch(
            updateProject({ ...projectData, id: props.currentRecord.id })
          );
        } else {
          dispatch(addProject(projectData));
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
      notification.error({
        message: "Lỗi",
        description: "Có lỗi xảy ra khi lưu dự án",
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

  const getDataEdit = async (id) => {
    try {
      setLoading(true);
      
      if (isInWorkflow) {
        // Sử dụng workflow API
        const workflowData = await getWorkflowProjectDetail({
          projectId: parseInt(id),
          companyCode: "DVCS01",
        });

        if (workflowData) {
          const projectData = {
            projectCode: workflowData.ProjectCode || workflowData.projectCode,
            projectName: workflowData.ProjectName || workflowData.projectName || "",
            description: workflowData.Description || workflowData.description || "",
            status: workflowData.Status || workflowData.status || "",
            priority: workflowData.Priority || workflowData.priority || "",
            projectManagerId: workflowData.ProjectManagerId || workflowData.projectManagerId,
            orgUnitId: workflowData.OrgUnitId || workflowData.orgUnitId,
            clientName: workflowData.ClientName || workflowData.clientName || "",
            startDate: workflowData.StartDate || workflowData.startDate,
            endDate: workflowData.EndDate || workflowData.endDate,
            budget: workflowData.Budget || workflowData.budget || 0,
            progress: workflowData.Progress || workflowData.progress || 0,
            customerId: workflowData.CustomerId || workflowData.customerId || null,
            estimatedHours: workflowData.EstimatedHours || workflowData.estimatedHours || 0,
            actualHours: workflowData.ActualHours || workflowData.actualHours || 0,
            notes: workflowData.Notes || workflowData.notes || "",
          };
          
          setInitialValues(projectData);

          inputForm.setFieldsValue({
            projectCode: projectData.projectCode,
            projectName: projectData.projectName,
            description: projectData.description,
            status: projectData.status || "PLANNING",
            priority: projectData.priority || "MEDIUM",
            projectManagerId: projectData.projectManagerId,
            customerId: projectData.customerId,
            dateRange:
              projectData.startDate && projectData.endDate
                ? [dayjs(projectData.startDate), dayjs(projectData.endDate)]
                : null,
            budget: projectData.budget,
            progress: projectData.progress,
            estimatedHours: projectData.estimatedHours,
            actualHours: projectData.actualHours,
            notes: projectData.notes,
          });
        }
      } else {
        // Sử dụng API cũ cho non-workflow context
        const response = await apiGetProject({ projectId: id });

        if (response.status === 200 && response.data) {
          const projectData = response.data;
          setInitialValues(projectData);

          inputForm.setFieldsValue({
            projectCode: projectData.projectCode,
            projectName: projectData.projectName,
            description: projectData.description,
            status: projectData.status,
            priority: projectData.priority,
            projectManagerId: projectData.projectManagerId,
            customerId: projectData.customerId,
            dateRange:
              projectData.startDate && projectData.endDate
                ? [dayjs(projectData.startDate), dayjs(projectData.endDate)]
                : null,
            budget: projectData.budget,
            estimatedHours: projectData.estimatedHours,
            actualHours: projectData.actualHours,
            progress: projectData.progress,
            notes: projectData.notes,
          });
        }
      }
    } catch (error) {
      notification.error({
        message: "Lỗi",
        description: "Có lỗi xảy ra khi tải thông tin dự án",
      });
    } finally {
      setLoading(false);
    }
  };

  const COMPANY_CODE = "dvcs01"; // TODO: lấy từ userInfo nếu cần dynamic

  const loadManagers = async () => {
    try {
      console.log("[ModalAddProject] Loading project managers...");

      const response = await fetch(
        `https://api-trinhtest.sse.net.vn/api/workflow/dropdowns/project-managers?companyCode=${COMPANY_CODE}`,
        {
          method: "POST",
          headers: {
            accept: "text/plain",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to load project managers: ${response.status}`);
      }

      const data = await response.json();
      console.log("[ModalAddProject] Project managers response:", data);

      const mappedManagers = (data || []).map((m) => ({
        id: m.value,
        fullName: m.label,
        email: m.Email,
        avatarUrl: m.AvatarUrl,
      }));

      setManagersList(mappedManagers);
    } catch (error) {
      console.error("[ModalAddProject] Error loading project managers:", error);
      setManagersList([]);
    }
  };

  const loadCustomers = async () => {
    try {
      console.log("[ModalAddProject] Loading customers...");

      const response = await fetch(
        `https://api-trinhtest.sse.net.vn/api/workflow/dropdowns/customers?companyCode=${COMPANY_CODE}`,
        {
          method: "POST",
          headers: {
            accept: "text/plain",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to load customers: ${response.status}`);
      }

      const data = await response.json();
      console.log("[ModalAddProject] Customers response:", data);

      const mappedCustomers = (data || []).map((c) => ({
        id: c.value,
        customerName: c.label,
        customerCode: c.CustomerCode,
        contactName: c.ContactName,
        email: c.Email,
        phone: c.Phone,
      }));

      setCustomersList(mappedCustomers);
    } catch (error) {
      console.error("[ModalAddProject] Error loading customers:", error);
      setCustomersList([]);
    }
  };

  // Effects
  useEffect(() => {
    setOpenModal(props.openModalAddProjectState);
  }, [props.openModalAddProjectState]);

  useEffect(() => {
    if (isOpenModal) {
      // Mỗi lần mở modal luôn load lại dropdown & clear form nếu không phải EDIT
      loadManagers();
      loadCustomers();

      if (props.openModalType === "EDIT" && props.currentRecord) {
        // Lấy dữ liệu chi tiết cho chế độ chỉnh sửa
        const recordId =
          props.currentRecord.id ||
          props.currentRecord.Id ||
          props.currentRecord.projectId;
        if (recordId) {
          getDataEdit(recordId);
        }
      } else {
        // Mở ở chế độ tạo mới: reset toàn bộ form & initialValues
        inputForm.resetFields();
        setInitialValues({});
      }
    } else {
      // Khi modal đóng, dọn sạch form để tránh dữ liệu cũ dính sang lần sau
      inputForm.resetFields();
      setInitialValues({});
    }
  }, [isOpenModal, props.openModalType, props.currentRecord, inputForm]);

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "18px", fontWeight: "600" }}>
            {props.openModalType === "EDIT"
              ? "Chỉnh sửa dự án"
              : "Thêm dự án mới"}
          </span>
        </div>
      }
      open={isOpenModal}
      onCancel={handleCancelModal}
      width={900}
      footer={null}
      className="modal-add-project"
      style={{ top: 20 }}
    >
      <div style={{ padding: "20px 0" }}>
        <Form
          form={inputForm}
          layout="vertical"
          onFinish={onSubmitForm}
          onFinishFailed={onSubmitFormFail}
          autoComplete="off"
        >
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Mã dự án"
                name="projectCode"
              >
                <Input
                  placeholder="Nhập mã dự án"
                  disabled={disableFields || isInWorkflow}
                  style={{ textTransform: "uppercase" }}
                  onChange={(e) => {
                    e.target.value = e.target.value.toUpperCase();
                  }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Tên dự án"
                name="projectName"
                rules={[
                  { required: true, message: "Vui lòng nhập tên dự án" },
                  { max: 200, message: "Tên dự án không được quá 200 ký tự" },
                ]}
              >
                <Input placeholder="Nhập tên dự án" disabled={disableFields} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Mô tả dự án"
            name="description"
            // Tạm thời ẩn validation
            // rules={[{ max: 1000, message: "Mô tả không được quá 1000 ký tự" }]}
          >
            <TextArea
              rows={2}
              placeholder="Nhập mô tả dự án"
              disabled={disableFields}
            />
          </Form.Item>

          <Row gutter={[16, 0]}>
            <Col xs={24} sm={8}>
              <Form.Item
                label="Trạng thái"
                name="status"
                // Tạm thời ẩn validation
                // rules={[
                //   { required: true, message: "Vui lòng chọn trạng thái" },
                // ]}
                tooltip="Chọn trạng thái hiện tại của dự án"
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
                // Tạm thời ẩn validation
                // rules={[
                //   { required: true, message: "Vui lòng chọn độ ưu tiên" },
                // ]}
                tooltip="Chọn mức độ ưu tiên của dự án"
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
              >
                <InputNumber
                  style={{ width: "100%" }}
                  placeholder="0"
                  min={0}
                  max={100}
                  disabled={disableFields || props.openModalType !== "EDIT"}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Quản lý dự án"
                name="projectManagerId"
                rules={[
                  { required: true, message: "Vui lòng chọn quản lý dự án" },
                ]}
              >
                <Select
                  placeholder="Chọn quản lý dự án"
                  disabled={disableFields}
                  showSearch
                  filterOption={(input, option) =>
                    option.children
                      .toLowerCase()
                      .indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {managersList.map((manager) => (
                    <Option key={manager.id} value={manager.id}>
                      {manager.fullName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Khách hàng"
                name="customerId"
                rules={[
                  { required: true, message: "Vui lòng chọn khách hàng" },
                ]}
              >
                <Select
                  placeholder="Chọn khách hàng"
                  disabled={disableFields}
                  showSearch
                  allowClear
                  filterOption={(input, option) =>
                    option.children
                      .toLowerCase()
                      .indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {customersList.map((customer) => (
                    <Option key={customer.id} value={customer.id}>
                      {customer.customerName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Thời gian thực hiện"
            name="dateRange"
            // Tạm thời ẩn validation
            // rules={[
            //   { required: true, message: "Vui lòng chọn thời gian thực hiện" },
            // ]}
          >
            <RangePicker
              style={{ width: "100%" }}
              placeholder={["Ngày bắt đầu", "Ngày kết thúc"]}
              format="DD/MM/YYYY"
              disabled={disableFields}
            />
          </Form.Item>

          <Row gutter={[16, 0]}>
            <Col xs={24} sm={8}>
              <Form.Item
                label="Ngân sách (VNĐ)"
                name="budget"
                // Tạm thời ẩn validation
                // rules={[
                //   {
                //     type: "number",
                //     min: 0,
                //     message: "Ngân sách phải lớn hơn 0",
                //   },
                // ]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  placeholder="0"
                  min={0}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                  disabled={disableFields}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                label="Số giờ ước tính"
                name="estimatedHours"
                // Tạm thời ẩn validation
                // rules={[
                //   { type: "number", min: 0, message: "Số giờ phải lớn hơn 0" },
                // ]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  placeholder="0"
                  min={0}
                  disabled={disableFields}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                label="Số giờ thực tế"
                name="actualHours"
                // Tạm thời ẩn validation
                // rules={[
                //   { type: "number", min: 0, message: "Số giờ phải lớn hơn 0" },
                // ]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  placeholder="0"
                  min={0}
                  disabled={props.openModalType === "Add"}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Ghi chú"
            name="notes"
            // Tạm thời ẩn validation
            // rules={[{ max: 500, message: "Ghi chú không được quá 500 ký tự" }]}
          >
            <TextArea
              rows={2}
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

export default ModalAddProject;
