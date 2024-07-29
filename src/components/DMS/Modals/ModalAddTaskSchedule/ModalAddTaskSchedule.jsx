import {
  Button,
  Checkbox,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  notification,
  Select,
  Space,
  TimePicker,
} from "antd";
import dayjs from "dayjs";
import React, { memo, useEffect, useState } from "react";
import send_icon from "../../../../Icons/send_icon.svg";
import { formStatus } from "../../../../utils/constants";
import LoadingComponents from "../../../Loading/LoadingComponents";
import FormSelect from "../../../ReuseComponents/FormSelect";
import { ApiGetTaskSchedule, SoFuckingUltimateApi } from "../../API";
import "./ModalAddTaskSchedule.css";

const ModalAddTaskSchedule = ({
  openModalState,
  openModalType,
  currentRecord,
  handleCloseModal,
  refreshData,
}) => {
  const [inputForm] = Form.useForm();
  const [isOpenModal, setOpenModal] = useState();
  const [initialValues, setInitialValues] = useState({});
  const [selectOptions, setSelectOptions] = useState([]);
  const [selectLoading, setSelectLoading] = useState(false);
  const [currentItem, setCurrentItem] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCancelModal = () => {
    setOpenModal(false);
    handleCloseModal();
    inputForm.resetFields();
  };

  const checkValidDate = async () => {
    const dateStart = inputForm.getFieldValue("startDate");
    const dateEnd = inputForm.getFieldValue("endDate");
    if (!dateStart || !dateEnd) return true;
    return dateStart <= dateEnd;
  };

  const handleChangeValues = () => {
    inputForm.validateFields(["startDate", "endDate"]);
  };

  const onSubmitForm = () => {
    const inputValues = { ...inputForm.getFieldsValue() };
    SoFuckingUltimateApi({
      store: "Api_create_tasksSchedule",
      data: {
        action:
          openModalType === formStatus.EDIT ? openModalType : formStatus.ADD,
        id: currentItem ? currentItem : null,
        type: inputValues.scheduleType,
        ngay: inputValues.DayInMonth,
        ngay_th: inputValues.startDate,
        gio_th: dayjs(inputValues.timeActive).format("hh:mm"),
        ngay_cuoi_thang: inputValues.lastDayInMonth,
        t1: inputValues.t1,
        t2: inputValues.t2,
        t3: inputValues.t3,
        t4: inputValues.t4,
        t5: inputValues.t5,
        t6: inputValues.t6,
        t7: inputValues.t7,
        ghi_chu: "",
        status: 1,
        ten_cv: inputValues.taskName,
        assigned_name: inputValues.assignedName,
        userid: 1,
        event_yn: inputValues.taskType,
        muc_do: inputValues.priority,
        full_day: 0,
        end_date: inputValues.endDate,
        start_date: inputValues.startDate,
        ma_dvcs: inputValues.unitCode,
        ma_tuyen: inputValues.tourName,
      },
    })
      .then((res) => {
        if (res.status === 200 && res.data === true) {
          notification.success({
            message: `Thành công`,
          });
          handleCancelModal();
          refreshData();
        } else {
          notification.warning({
            message: `Có lỗi xảy ra khi thực hiện`,
          });
        }
      })
      .catch((err) => {
        console.error(err);
      });
  };

  const onSubmitFormFail = () => {};

  const getDataEdit = (id) => {
    ApiGetTaskSchedule({
      keywords: "",
      id: id,
      orderby: "id",
      pageindex: 1,
      pageSize: 10,
    }).then((res) => {
      inputForm.setFieldValue(`taskName`, res.data.data[0]?.ten_cv);
      inputForm.setFieldValue(`taskType`, res.data.data[0]?.event_yn);
      inputForm.setFieldValue(`priority`, String(res.data.data[0]?.muc_do));
      inputForm.setFieldValue(
        `startTime`,
        dayjs(res.data.data[0]?.start_date).isValid()
          ? dayjs(res.data.data[0]?.start_date)
          : undefined
      );

      inputForm.setFieldValue(
        `startDate`,
        dayjs(res.data.data[0]?.start_date).isValid()
          ? dayjs(res.data.data[0]?.start_date)
          : undefined
      );
      inputForm.setFieldValue(
        `endTime`,
        dayjs(res.data.data[0]?.end_date).isValid()
          ? dayjs(res.data.data[0]?.end_date)
          : null
      );

      inputForm.setFieldValue(
        `endDate`,
        dayjs(res.data.data[0]?.end_date).isValid()
          ? dayjs(res.data.data[0]?.end_date)
          : null
      );
      inputForm.setFieldValue(`assignedName`, res.data.data[0]?.assigned_name);
      inputForm.setFieldValue(`deptName`, res.data.data[0]?.ma_bp);
      inputForm.setFieldValue(`tourName`, res.data.data[0]?.ma_tuyen);
      inputForm.setFieldValue(`unitCode`, res.data.data[0]?.ma_dvcs);
      inputForm.setFieldValue(`scheduleType`, String(res.data.data[0]?.type));
      inputForm.setFieldValue(
        `periodicalDay`,
        dayjs(res.data.data[0]?.ngay_th).isValid()
          ? dayjs(res.data.data[0]?.ngay_th)
          : null
      );
      inputForm.setFieldValue(`DayInMonth`, res.data.data[0]?.ngay);
      inputForm.setFieldValue(
        `lastDayInMonth`,
        res.data.data[0]?.ngay_cuoi_thang
      );
      inputForm.setFieldValue(`t1`, res.data.data[0]?.t1);
      inputForm.setFieldValue(`t2`, res.data.data[0]?.t2);
      inputForm.setFieldValue(`t3`, res.data.data[0]?.t3);
      inputForm.setFieldValue(`t4`, res.data.data[0]?.t4);
      inputForm.setFieldValue(`t5`, res.data.data[0]?.t5);
      inputForm.setFieldValue(`t6`, res.data.data[0]?.t6);
      inputForm.setFieldValue(`t7`, res.data.data[0]?.t7);
      setCurrentItem(res.data.data[0]?.id);
      setLoading(false);
    });
  };

  useEffect(() => {
    setOpenModal(openModalState);
    if (openModalState && openModalType === formStatus.EDIT) {
      setInitialValues({});
      setLoading(true);
      getDataEdit(currentRecord || 0);
    }
  }, [JSON.stringify(openModalState)]);

  return (
    <Modal
      className="default_modal"
      open={isOpenModal}
      onCancel={handleCancelModal}
      closable={false}
      centered
      okButtonProps={{ style: { display: "none" } }}
      cancelButtonProps={{ style: { display: "none" } }}
      width={1000}
    >
      <div className="default_modal_header">
        <span className="default_header_label">{`${
          openModalType == formStatus.EDIT ? "Sửa" : "Thêm mới"
        } lịch công việc`}</span>
      </div>
      <Form
        form={inputForm}
        className="default_modal_container"
        onFinishFailed={onSubmitFormFail}
        onFinish={onSubmitForm}
        onValuesChange={handleChangeValues}
      >
        <LoadingComponents text={"Đang tải..."} size={50} loading={loading} />
        <div className="default_modal_group_items">
          <Space direction="vertical">
            <span className="default_bold_label">Tên công việc</span>
            <Form.Item
              name="taskName"
              rules={[{ required: true, message: " điền tên công việc" }]}
            >
              <Input placeholder="Nhập tên công việc" />
            </Form.Item>
          </Space>
        </div>

        <div className="default_modal_group_items">
          <Space direction="horizontal">
            <FormSelect
              direction={"COLUMN"}
              disable={openModalState == formStatus.VIEW ? true : false}
              controller={"dmloaicv_lookup"}
              form={inputForm}
              keyCode="taskType"
              label="Loại công việc"
              placeHolderCode={`Nhập loại công việc`}
              required={true}
            />

            <Space direction="vertical" style={{ width: "100%" }}>
              <span className="default_bold_label">Mức độ ưu tiên</span>
              <Form.Item
                name="priority"
                rules={[{ required: true, message: " mức độ ưu tiên" }]}
                initialValue={"0"}
              >
                <Select
                  placeholder="Chọn mức độ"
                  style={{ width: "100%" }}
                  options={[
                    { value: "0", label: "Thấp" },
                    { value: "1", label: "Trung bình" },
                    { value: "2", label: "Cao" },
                  ]}
                />
              </Form.Item>
            </Space>
            <Space direction="vertical">
              <span className="default_bold_label">Bắt đầu</span>
              <Space className="modal__time__picker">
                <Form.Item
                  name="startTime"
                  rules={[
                    {
                      required: true,
                      message: " chọn giờ bắt đầu",
                    },
                  ]}
                >
                  <TimePicker placeholder="Giờ" format={"HH:mm"} />
                </Form.Item>
                <Form.Item
                  name="startDate"
                  rules={[
                    {
                      required: true,
                      message: "Hãy chọn ngày bắt đầu",
                    },
                    {
                      validator: async (_, value) => {
                        return (await checkValidDate(value)) == true
                          ? Promise.resolve()
                          : Promise.reject(new Error("Lỗi định dạng ngày"));
                      },
                    },
                  ]}
                >
                  <DatePicker
                    format={"DD/MM/YYYY"}
                    style={{ width: "100%" }}
                    placeholder="Chọn ngày"
                  />
                </Form.Item>
              </Space>
            </Space>
            <Space direction="vertical">
              <span className="default_bold_label">Kết thúc</span>
              <Space className="modal__time__picker">
                <Form.Item
                  name="endTime"
                  rules={[
                    {
                      required: true,
                      message: " chọn ngày kết thúc",
                    },
                  ]}
                >
                  <TimePicker placeholder="Giờ" format={"HH:mm"} />
                </Form.Item>
                <Form.Item
                  name="endDate"
                  rules={[
                    {
                      required: true,
                      message: "Hãy chọn ngày kết thúc",
                    },

                    {
                      validator: async (_, value) => {
                        return (await checkValidDate(value)) == true
                          ? Promise.resolve()
                          : Promise.reject(new Error("Lỗi định dạng ngày"));
                      },
                    },
                  ]}
                >
                  <DatePicker
                    format={"DD/MM/YYYY"}
                    style={{ width: "100%" }}
                    placeholder="Chọn ngày"
                  />
                </Form.Item>
              </Space>
            </Space>
          </Space>
        </div>

        <div className="default_modal_group_items">
          <FormSelect
            direction={"COLUMN"}
            disable={openModalState == formStatus.VIEW ? true : false}
            controller={"user_lookup"}
            form={inputForm}
            keyCode="assignedName"
            label="Người nhận việc"
            placeHolderCode={`Nhập người nhận việc`}
            required={true}
          />

          <FormSelect
            direction={"COLUMN"}
            disable={openModalState == formStatus.VIEW ? true : false}
            controller={"dmbp_lookup"}
            form={inputForm}
            keyCode="deptName"
            label="Bộ phận"
            placeHolderCode={`Nhập bộ phận`}
            required={false}
          />

          <FormSelect
            direction={"COLUMN"}
            disable={openModalState == formStatus.VIEW ? true : false}
            controller={"dmtuyen_lookup"}
            form={inputForm}
            keyCode="tourName"
            label="Tuyến"
            placeHolderCode={`Nhập tuyến`}
            required={true}
          />
        </div>

        <div className="default_modal_group_items group__item__justify__start">
          <FormSelect
            direction={"COLUMN"}
            disable={openModalState == formStatus.VIEW ? true : false}
            codeWidth={315}
            controller={"dmdvcs_lookup"}
            form={inputForm}
            keyCode="unitCode"
            label="Đơn vị"
            placeHolderCode={`Chọn đơn vị`}
            required={true}
          />
        </div>

        <div
          className="default_modal_group_items default_modal_details"
          style={{ flexDirection: "column", gap: "10px" }}
        >
          <div className="default_table_header">
            <span className="default_bold_label">Lịch</span>
          </div>
          <div className="default_modal_group_items">
            <Space direction="vertical" style={{ flex: "none" }}>
              <span className="default_bold_label">Loại lịch</span>
              <Form.Item
                style={{ flex: "none" }}
                name="scheduleType"
                rules={[{ required: true, message: "Chọn loại" }]}
                initialValue={"0"}
              >
                <Select
                  placeholder="Chọn loại"
                  style={{ width: "210px" }}
                  options={[
                    { value: "0", label: "Một lần" },
                    { value: "1", label: "Hàng ngày" },
                    { value: "2", label: "Hàng tuần" },
                    { value: "3", label: "Hàng tháng" },
                  ]}
                />
              </Form.Item>
            </Space>
            <Space direction="vertical">
              <span className="default_bold_label">Ngày định kỳ</span>

              <Form.Item name="DayInMonth">
                <InputNumber
                  controls={false}
                  min="0"
                  style={{ width: "100%" }}
                  min={1}
                  max={31}
                  placeholder="Ngày"
                ></InputNumber>
              </Form.Item>
            </Space>
            <Space direction="vertical">
              <span className="default_bold_label">Ngày trong tháng</span>
              <Form.Item name="periodicalDay">
                <DatePicker
                  style={{ width: "100%" }}
                  format={"DD/MM/YYYY"}
                  placeholder="Chọn ngày"
                />
              </Form.Item>
            </Space>
            <Space direction="vertical">
              <span className="default_bold_label">Ngày cuối tháng</span>
              <Form.Item
                initialValue={false}
                valuePropName="checked"
                name="lastDayInMonth"
              >
                <Checkbox></Checkbox>
              </Form.Item>
            </Space>

            <Space direction="vertical">
              <span className="default_bold_label">Thời gian</span>
              <Form.Item name="timeActive">
                <TimePicker
                  style={{ width: "100%" }}
                  placeholder="Giờ"
                  format={"HH:mm"}
                />
              </Form.Item>
            </Space>
          </div>

          <div
            className="default_modal_group_items"
            style={{
              textAlign: "center",
              background: "#fff",
              borderRadius: "4px",
              padding: "7px",
              fontWeight: "bold",
            }}
          >
            <span>Thứ 2</span>
            <span>Thứ 3</span>
            <span>Thứ 4</span>
            <span>Thứ 5</span>
            <span>Thứ 6</span>
            <span>Thứ 7</span>
            <span>Chủ nhật</span>
          </div>

          <div
            className="default_modal_group_items"
            style={{ textAlign: "center", padding: "0px 7px" }}
          >
            <Form.Item name="t2" initialValue={false} valuePropName="checked">
              <Checkbox></Checkbox>
            </Form.Item>
            <Form.Item name="t3" initialValue={false} valuePropName="checked">
              <Checkbox></Checkbox>
            </Form.Item>
            <Form.Item name="t4" initialValue={false} valuePropName="checked">
              <Checkbox></Checkbox>
            </Form.Item>
            <Form.Item name="t5" initialValue={false} valuePropName="checked">
              <Checkbox></Checkbox>
            </Form.Item>
            <Form.Item name="t6" initialValue={false} valuePropName="checked">
              <Checkbox></Checkbox>
            </Form.Item>
            <Form.Item name="t7" initialValue={false} valuePropName="checked">
              <Checkbox></Checkbox>
            </Form.Item>
            <Form.Item name="t1" initialValue={false} valuePropName="checked">
              <Checkbox></Checkbox>
            </Form.Item>
          </div>
        </div>

        <Space style={{ justifyContent: "center", alignItems: "center" }}>
          <Button
            className="default_subsidiary_button"
            onClick={handleCancelModal}
          >
            Huỷ
          </Button>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="default_primary_button"
              icon={<img src={send_icon} alt="" />}
            >
              Lưu
            </Button>
          </Form.Item>
        </Space>
      </Form>
    </Modal>
  );
};

export default memo(ModalAddTaskSchedule);
