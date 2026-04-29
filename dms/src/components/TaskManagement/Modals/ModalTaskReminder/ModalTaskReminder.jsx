import {
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  notification,
  Select,
  Space,
  Switch,
} from "antd";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import send_icon from "../../../../Icons/send_icon.svg";
import LoadingComponents from "../../../Loading/LoadingComponents";
import { apiCreateTaskReminder, TaskManagementGetApi } from "../../API";
import { addTaskReminder } from "../../Store/Slices/TaskSlice";

const { Option } = Select;
const { TextArea } = Input;

const ModalTaskReminder = (props) => {
  const [inputForm] = Form.useForm();
  const [isOpenModal, setOpenModal] = useState();
  const [loading, setLoading] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const dispatch = useDispatch();

  // Reminder type options
  const reminderTypes = [
    { value: "EMAIL", label: "Email" },
    { value: "SMS", label: "SMS" },
    { value: "NOTIFICATION", label: "Thông báo hệ thống" },
  ];

  // Frequency options
  const frequencyOptions = [
    { value: "ONCE", label: "Một lần" },
    { value: "DAILY", label: "Hàng ngày" },
    { value: "WEEKLY", label: "Hàng tuần" },
    { value: "MONTHLY", label: "Hàng tháng" },
  ];

  const handleCancelModal = () => {
    setOpenModal(false);
    props.handleCloseModal();
    inputForm.resetFields();
  };

  const onSubmitForm = async () => {
    try {
      setLoading(true);
      const formData = inputForm.getFieldsValue();

      const reminderData = {
        taskId: props.currentRecord?.id,
        recipientId: formData.recipientId,
        reminderTime: formData.reminderTime
          ? formData.reminderTime.format("YYYY-MM-DD HH:mm:ss")
          : null,
        reminderType: formData.reminderType,
        frequency: formData.frequency,
        message: formData.message,
        isActive: formData.isActive !== false,
        userid: 0,
      };

      const response = await apiCreateTaskReminder(reminderData);

      if (response.status === 200 && response.data === true) {
        notification.success({
          message: "Thành công",
          description: "Tạo nhắc việc thành công",
        });

        // Update Redux store
        dispatch(addTaskReminder(reminderData));

        props.refreshData();
        handleCancelModal();
      } else {
        notification.warning({
          message: "Cảnh báo",
          description: "Có lỗi xảy ra khi tạo nhắc việc",
        });
      }
    } catch (error) {
      console.error("Error creating task reminder:", error);
      notification.error({
        message: "Lỗi",
        description: "Có lỗi xảy ra khi tạo nhắc việc",
      });
    } finally {
      setLoading(false);
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
    setOpenModal(props.openModalReminderState);
  }, [props.openModalReminderState]);

  useEffect(() => {
    if (isOpenModal) {
      loadUsers();
      inputForm.setFieldsValue({
        isActive: true,
        frequency: "ONCE",
        reminderType: "NOTIFICATION",
      });
    }
  }, [isOpenModal]);

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "18px", fontWeight: "600" }}>
            Tạo nhắc việc: {props.currentRecord?.taskName}
          </span>
        </div>
      }
      open={isOpenModal}
      onCancel={handleCancelModal}
      width={600}
      footer={null}
      className="modal-task-reminder"
    >
      <div style={{ padding: "20px 0" }}>
        <Form
          form={inputForm}
          layout="vertical"
          onFinish={onSubmitForm}
          autoComplete="off"
        >
          <Form.Item
            label="Người nhận nhắc việc"
            name="recipientId"
            rules={[{ required: true, message: "Vui lòng chọn người nhận" }]}
          >
            <Select
              placeholder="Chọn người nhận"
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
            label="Thời gian nhắc việc"
            name="reminderTime"
            rules={[
              { required: true, message: "Vui lòng chọn thời gian nhắc việc" },
            ]}
          >
            <DatePicker
              showTime
              style={{ width: "100%" }}
              placeholder="Chọn thời gian nhắc việc"
              format="DD/MM/YYYY HH:mm"
            />
          </Form.Item>

          <div style={{ display: "flex", gap: "16px" }}>
            <Form.Item
              label="Loại nhắc việc"
              name="reminderType"
              style={{ flex: 1 }}
              rules={[
                { required: true, message: "Vui lòng chọn loại nhắc việc" },
              ]}
            >
              <Select placeholder="Chọn loại nhắc việc">
                {reminderTypes.map((type) => (
                  <Option key={type.value} value={type.value}>
                    {type.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Tần suất"
              name="frequency"
              style={{ flex: 1 }}
              rules={[{ required: true, message: "Vui lòng chọn tần suất" }]}
            >
              <Select placeholder="Chọn tần suất">
                {frequencyOptions.map((freq) => (
                  <Option key={freq.value} value={freq.value}>
                    {freq.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <Form.Item
            label="Nội dung nhắc việc"
            name="message"
            rules={[
              { required: true, message: "Vui lòng nhập nội dung nhắc việc" },
              { max: 500, message: "Nội dung không được quá 500 ký tự" },
            ]}
          >
            <TextArea rows={4} placeholder="Nhập nội dung nhắc việc..." />
          </Form.Item>

          <Form.Item label="Trạng thái" name="isActive" valuePropName="checked">
            <Switch
              checkedChildren="Hoạt động"
              unCheckedChildren="Tắt"
              defaultChecked
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
                Tạo nhắc việc
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

      {loading && <LoadingComponents />}
    </Modal>
  );
};

export default ModalTaskReminder;









