import {
  Button,
  Form,
  Input,
  Modal,
  notification,
  Select,
  Space,
  DatePicker,
} from "antd";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import send_icon from "../../../../Icons/send_icon.svg";
import LoadingComponents from "../../../Loading/LoadingComponents";
import { apiAssignTask } from "../../API";
import { assignTask } from "../../Store/Slices/TaskSlice";
import { getWorkflowProjectUsers, updateWorkflowTask } from "../../../WorkflowApp/API/workflowApi";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { getUserInfo } from "../../../../store/selectors/Selectors";
import dayjs from "dayjs";

const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const ModalAssignTask = (props) => {
  const [inputForm] = Form.useForm();
  const [isOpenModal, setOpenModal] = useState();
  const [loading, setLoading] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const dispatch = useDispatch();
  const location = useLocation();
  const userInfo = useSelector(getUserInfo);
  
  // Detect if we're in workflow context
  const isInWorkflow = location.pathname.includes("/workflow");

  const handleCancelModal = () => {
    setOpenModal(false);
    props.handleCloseModal();
    inputForm.resetFields();
  };

  const onSubmitForm = async () => {
    try {
      setLoading(true);
      const formData = inputForm.getFieldsValue();

      if (isInWorkflow) {
        // Workflow API: sử dụng updateWorkflowTask (full update)
        const currentRecord = props.currentRecord;
        
        // Tự động set thời gian giao việc = thời gian hiện tại
        const assignedDate = new Date();
        const assignedDateString = assignedDate.toISOString().slice(0, 19).replace('T', ' ');
        
        // Lấy yyyymm từ task
        const taskYyyymm = currentRecord?.yyyymm || (() => {
          const now = new Date();
          return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
        })();
        
        // Xây dựng payload đầy đủ cho updateWorkflowTask
        const updatePayload = {
          companyCode: "DVCS01",
          yyyymm: taskYyyymm,
          taskId: currentRecord?.id || currentRecord?.taskId,
          taskName: currentRecord?.taskName || "",
          projectId: currentRecord?.projectId || null,
          parentTaskId: currentRecord?.parentTaskId || null,
          level: currentRecord?.level || 1,
          status: currentRecord?.status || "PENDING",
          priority: currentRecord?.priority || "MEDIUM",
          mode: currentRecord?.mode || "PRIVATE",
          category: currentRecord?.category || currentRecord?.type || "TASK",
          formTemplate: currentRecord?.formTemplate || "1",
          progress: currentRecord?.progress !== undefined ? currentRecord.progress : 0,
          estimatedHours: currentRecord?.estimatedHours !== undefined ? currentRecord.estimatedHours : 0,
          actualHours: currentRecord?.actualHours !== undefined ? currentRecord.actualHours : 0,
          startDate: formData.dateRange && formData.dateRange[0] ? dayjs(formData.dateRange[0]).startOf('day').toISOString() : (currentRecord?.startDate ? new Date(currentRecord.startDate).toISOString() : new Date().toISOString()),
          endDate: formData.dateRange && formData.dateRange[1] ? dayjs(formData.dateRange[1]).endOf('day').toISOString() : (currentRecord?.endDate ? new Date(currentRecord.endDate).toISOString() : (currentRecord?.dueDate ? new Date(currentRecord.dueDate).toISOString() : new Date().toISOString())),
          dueDate: currentRecord?.dueDate ? new Date(currentRecord.dueDate).toISOString() : null,
          assignedBy: 1, // Fix cứng assignedBy = 1
          assignedTo: formData.assignedToId || null, // Người được giao việc
          reviewerId: currentRecord?.reviewerId || null,
          description: currentRecord?.description || "",
          createdBy: currentRecord?.createdById || currentRecord?.createdBy || 1,
          updatedBy: 1, // Fix cứng updatedBy = 1
        };

        const response = await updateWorkflowTask(updatePayload);

        if (response) {
          notification.success({
            message: "Thành công",
            description: "Giao việc thành công",
          });

          // Update Redux store với thời gian giao việc tự động
          dispatch(
            assignTask({
              taskId: currentRecord.id,
              assignedTo: formData.assignedToId,
              assignedDate: assignedDateString, // Tự động set = thời gian hiện tại
            })
          );

          props.refreshData();
          handleCancelModal();
        } else {
          notification.warning({
            message: "Cảnh báo",
            description: "Có lỗi xảy ra khi giao việc",
          });
        }
      } else {
        // API cũ
        // Tự động set thời gian giao việc = thời gian hiện tại
        const assignedDate = new Date();
        const assignedDateString = assignedDate.toISOString().slice(0, 19).replace('T', ' ');
        
        const assignData = {
          taskId: props.currentRecord?.id,
          assignedToId: formData.assignedToId,
          assignedDate: assignedDateString, // Tự động set = thời gian hiện tại
          notes: formData.notes,
          userid: 0,
        };

        const response = await apiAssignTask(assignData);

        if (response.status === 200 && response.data === true) {
          notification.success({
            message: "Thành công",
            description: "Giao việc thành công",
          });

          // Update Redux store với thời gian giao việc tự động
          dispatch(
            assignTask({
              taskId: props.currentRecord.id,
              assignedTo: formData.assignedToId,
              assignedDate: assignedDateString, // Tự động set = thời gian hiện tại
            })
          );

          props.refreshData();
          handleCancelModal();
        } else {
          notification.warning({
            message: "Cảnh báo",
            description: "Có lỗi xảy ra khi giao việc",
          });
        }
      }
    } catch (error) {
      console.error("Error assigning task:", error);
      notification.error({
        message: "Lỗi",
        description: "Có lỗi xảy ra khi giao việc",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      if (!isInWorkflow) {
        setUsersList([]);
        return;
      }

      // Get projectId from currentRecord
      const projectId = props.currentRecord?.projectId;
      
      if (!projectId) {
        setUsersList([]);
        return;
      }

      const response = await getWorkflowProjectUsers({ 
        companyCode: "DVCS01",
        projectId: projectId
      });

      if (Array.isArray(response)) {
        const mappedUsers = response.map((user) => ({
          id: user.Id || user.id || user.UserId || user.userId,
          fullName: user.FullName || user.fullName || "",
          email: user.Email || user.email || "",
          position: user.Title || user.title || "",
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
    setOpenModal(props.openModalAssignTaskState);
  }, [props.openModalAssignTaskState]);

  useEffect(() => {
    if (isOpenModal) {
      loadUsers();
      inputForm.resetFields();
      // Set giá trị mặc định cho ngày nếu task đã có
      const currentRecord = props.currentRecord;
      if (currentRecord) {
        const initialValues = {};
        if (currentRecord.startDate && currentRecord.endDate) {
          initialValues.dateRange = [dayjs(currentRecord.startDate), dayjs(currentRecord.endDate)];
        } else if (currentRecord.startDate && currentRecord.dueDate) {
          initialValues.dateRange = [dayjs(currentRecord.startDate), dayjs(currentRecord.dueDate)];
        }
        if (initialValues.dateRange) {
          inputForm.setFieldsValue(initialValues);
        }
      }
    }
  }, [isOpenModal]);

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "18px", fontWeight: "600" }}>
            Giao việc: {props.currentRecord?.taskName}
          </span>
        </div>
      }
      open={isOpenModal}
      onCancel={handleCancelModal}
      width={600}
      footer={null}
      className="modal-assign-task"
    >
      <div style={{ padding: "20px 0" }}>
        <Form
          form={inputForm}
          layout="vertical"
          onFinish={onSubmitForm}
          autoComplete="off"
        >
          <Form.Item
            label="Người thực hiện"
            name="assignedToId"
            rules={[
              { required: true, message: "Vui lòng chọn người thực hiện" },
            ]}
          >
            <Select
              placeholder="Chọn người thực hiện"
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {usersList.map((user) => (
                <Option key={user.id} value={user.id}>
                  {user.fullName} - {user.position}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Thời gian thực hiện"
            name="dateRange"
            rules={[
              { required: true, message: "Vui lòng chọn thời gian thực hiện" },
              {
                validator: (_, value) => {
                  if (!value || !value[0] || !value[1]) {
                    return Promise.reject(new Error("Vui lòng chọn đầy đủ từ ngày và tới ngày"));
                  }
                  if (dayjs(value[1]).isBefore(dayjs(value[0]))) {
                    return Promise.reject(new Error("Tới ngày phải sau hoặc bằng Từ ngày"));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <RangePicker
              style={{ width: "100%" }}
              placeholder={["Từ ngày", "Tới ngày"]}
              format="DD/MM/YYYY"
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
          </Form.Item>

          <Form.Item
            label="Ghi chú giao việc"
            name="notes"
            rules={[{ max: 500, message: "Ghi chú không được quá 500 ký tự" }]}
          >
            <TextArea
              rows={4}
              placeholder="Nhập ghi chú về công việc được giao..."
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
                Giao việc
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

      {loading && <LoadingComponents />}
    </Modal>
  );
};

export default ModalAssignTask;









