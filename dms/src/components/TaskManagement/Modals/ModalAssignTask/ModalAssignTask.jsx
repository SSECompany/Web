import {
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  notification,
  Select,
  Space,
} from "antd";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import send_icon from "../../../../Icons/send_icon.svg";
import LoadingComponents from "../../../Loading/LoadingComponents";
import { apiAssignTask, TaskManagementGetApi } from "../../API";
import { assignTask } from "../../Store/Slices/TaskSlice";

const { Option } = Select;
const { TextArea } = Input;

const ModalAssignTask = (props) => {
  const [inputForm] = Form.useForm();
  const [isOpenModal, setOpenModal] = useState();
  const [loading, setLoading] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const dispatch = useDispatch();

  const handleCancelModal = () => {
    setOpenModal(false);
    props.handleCloseModal();
    inputForm.resetFields();
  };

  const onSubmitForm = async () => {
    try {
      setLoading(true);
      const formData = inputForm.getFieldsValue();

      const assignData = {
        taskId: props.currentRecord?.id,
        assignedToId: formData.assignedToId,
        assignedDate: formData.assignedDate
          ? formData.assignedDate.format("YYYY-MM-DD HH:mm:ss")
          : null,
        notes: formData.notes,
        userid: 0,
      };

      const response = await apiAssignTask(assignData);

      if (response.status === 200 && response.data === true) {
        notification.success({
          message: "Thành công",
          description: "Giao việc thành công",
        });

        // Update Redux store
        dispatch(
          assignTask({
            taskId: props.currentRecord.id,
            assignedTo: formData.assignedToId,
            assignedDate: assignData.assignedDate,
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
    setOpenModal(props.openModalAssignTaskState);
  }, [props.openModalAssignTaskState]);

  useEffect(() => {
    if (isOpenModal) {
      loadUsers();
      inputForm.resetFields();
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
            label="Thời gian giao việc"
            name="assignedDate"
            rules={[
              { required: true, message: "Vui lòng chọn thời gian giao việc" },
            ]}
          >
            <DatePicker
              showTime
              style={{ width: "100%" }}
              placeholder="Chọn thời gian giao việc"
              format="DD/MM/YYYY HH:mm"
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









