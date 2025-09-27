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
import {
  apiCreateProject,
  apiUpdateProject,
  ProjectManagementGetApi,
} from "../../API";
import { addProject, updateProject } from "../../Store/Slices/ProjectSlice";
import "./ModalAddProject.css";

const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const ModalAddProject = (props) => {
  const [inputForm] = Form.useForm();
  const [isOpenModal, setOpenModal] = useState();
  const [initialValues, setInitialValues] = useState({});
  const [disableFields, setDisableFields] = useState(false);
  const [loading, setLoading] = useState(false);
  const [managersList, setManagersList] = useState([]);
  const [customersList, setCustomersList] = useState([]);
  const dispatch = useDispatch();

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

  const onSubmitForm = async () => {
    try {
      setLoading(true);
      const formData = inputForm.getFieldsValue();

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
      console.error("Error saving project:", error);
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
      const response = await ProjectManagementGetApi({
        store: "Api_Get_Project_Detail",
        data: { id: id },
      });

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
    } catch (error) {
      console.error("Error fetching project data:", error);
      notification.error({
        message: "Lỗi",
        description: "Có lỗi xảy ra khi tải thông tin dự án",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadManagers = async () => {
    try {
      const response = await ProjectManagementGetApi({
        store: "Api_Get_Project_Managers",
        data: { active: true },
      });

      if (response.status === 200 && response.data) {
        setManagersList(response.data);
      }
    } catch (error) {
      console.error("Error loading managers:", error);
    }
  };

  const loadCustomers = async () => {
    try {
      const response = await ProjectManagementGetApi({
        store: "Api_Get_Customers",
        data: { active: true },
      });

      if (response.status === 200 && response.data) {
        setCustomersList(response.data);
      }
    } catch (error) {
      console.error("Error loading customers:", error);
    }
  };

  // Effects
  useEffect(() => {
    setOpenModal(props.openModalAddProjectState);
  }, [props.openModalAddProjectState]);

  useEffect(() => {
    if (isOpenModal) {
      loadManagers();
      loadCustomers();

      if (props.openModalType === "EDIT" && props.currentRecord) {
        getDataEdit(props.currentRecord.id);
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
              ? "Chỉnh sửa dự án"
              : "Thêm dự án mới"}
          </span>
        </div>
      }
      open={isOpenModal}
      onCancel={handleCancelModal}
      width={800}
      footer={null}
      className="modal-add-project"
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
                label="Mã dự án"
                name="projectCode"
                rules={[
                  { required: true, message: "Vui lòng nhập mã dự án" },
                  { max: 50, message: "Mã dự án không được quá 50 ký tự" },
                ]}
              >
                <Input
                  placeholder="Nhập mã dự án"
                  disabled={disableFields}
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
            rules={[{ max: 1000, message: "Mô tả không được quá 1000 ký tự" }]}
          >
            <TextArea
              rows={3}
              placeholder="Nhập mô tả dự án"
              disabled={disableFields}
            />
          </Form.Item>

          <Row gutter={[16, 0]}>
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
              <Form.Item label="Khách hàng" name="customerId">
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
            rules={[
              { required: true, message: "Vui lòng chọn thời gian thực hiện" },
            ]}
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
                rules={[
                  {
                    type: "number",
                    min: 0,
                    message: "Ngân sách phải lớn hơn 0",
                  },
                ]}
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
            <Col xs={24} sm={8}>
              <Form.Item
                label="Số giờ thực tế"
                name="actualHours"
                rules={[
                  { type: "number", min: 0, message: "Số giờ phải lớn hơn 0" },
                ]}
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

export default ModalAddProject;
