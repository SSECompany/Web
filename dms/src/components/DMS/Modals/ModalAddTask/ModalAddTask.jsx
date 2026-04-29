import {
  Button,
  DatePicker,
  Form,
  Input,
  message,
  Modal,
  notification,
  Select,
  Space,
  TimePicker,
} from "antd";
import dayjs from "dayjs";
import _ from "lodash";
import React, { useEffect, useState } from "react";
import {
  getAllRowKeys,
  getAllValueByRow,
} from "../../../../app/Functions/getTableValue";
import { GetUniqueArray } from "../../../../app/Options/GetUniqueArray";
import send_icon from "../../../../Icons/send_icon.svg";
import { formStatus } from "../../../../utils/constants";
import LoadingComponents from "../../../Loading/LoadingComponents";
import FormSelect from "../../../ReuseComponents/FormSelect";
import { multipleTablePutApi } from "../../../SaleOrder/API";
import { ApiGetTaskDetail, ApiGetTaskMaster } from "../../API";
import { setTaskDetail } from "../../Store/Sagas/Sagas";
import TableDetail from "./Detail/TableDetail";
import "./ModalAddTask.css";

const ModalAddTask = ({
  handleCloseModal,
  openModalState,
  currentRecord,
  openModalType,
  refreshData,
}) => {
  const [detailForm] = Form.useForm();
  const [inputForm] = Form.useForm();
  const [isOpenModal, setOpenModal] = useState();
  const [initialValues, setInitialValues] = useState({});
  const [customerSelectData, setCustomerSelectData] = useState([]);
  const [dataSource, setDataSource] = useState([]);
  const [columns, setColumns] = useState([]);
  const [disableFields, setDisableFields] = useState(false);

  const [loading, setLoading] = useState(false);

  const handleCancelModal = () => {
    setOpenModal(false);
    handleCloseModal();
    inputForm.resetFields();
    setInitialValues({});
    setDataSource([]);
    setColumns([]);
    setTaskDetail([]);
  };

  const checkValidDate = () => {
    const dateStart = inputForm.getFieldValue("startDate");
    const dateEnd = inputForm.getFieldValue("endDate");
    if (!dateStart || !dateEnd) return true;
    return dateStart <= dateEnd;
  };

  const handleChangeValues = () => {
    inputForm.validateFields(["startDate", "endDate"]);
  };

  const onSubmitForm = async () => {
    const masterData = inputForm.getFieldsValue();
    const rawDetailData = detailForm.getFieldsValue();
    const detailData = await getAllRowKeys(rawDetailData).map((item) => {
      return getAllValueByRow(item, rawDetailData);
    });

    const master = { ...masterData };
    const detail = [
      ...GetUniqueArray(await detailDataProcess(detailData), "ma_kh"),
    ];

    multipleTablePutApi({
      store: "api_create_task",
      param: {
        action: openModalType,
        ten_cv: master.taskName,
        id: currentRecord ? currentRecord : null,
        ghi_chu: "",
        status: 1,
        userid: 1,
        event_yn: master.taskType,
        assigned_name: master.assignedName,
        muc_do: master.priority,
        end_date: dayjs(master.endDate).format("MM/DD/YYYY"),
        start_date: dayjs(master.startDate).format("MM/DD/YYYY"),
        ma_dvcs: master.unitCode,
        ma_bp: master.deptName,
        ma_tuyen: master.tourName,
      },
      data: { temp: _.isEmpty(detail) ? undefined : detail },
    }).then((res) => {
      if (res?.responseModel?.isSucceded) {
        notification.success({
          message: `Thực hiện thành công`,
        });

        handleCancelModal();
        refreshData();
      } else {
        notification.warning({
          message: res?.responseModel?.message,
        });
      }
    });
  };

  const onSubmitFormFail = () => {};

  const detailDataProcess = async (data) => {
    const newData = data.map((record) => {
      return {
        ma_kh: record.ma_kh,
        ten_kh: record.ten_kh,
      };
    });
    return newData;
  };

  const getDataEdit = (id) => {
    ApiGetTaskDetail({ id: id, orderby: "id" }).then((res) => {
      const layout = res.reportLayoutModel.map((item) => {
        item.editable = true;
        if (item.field === "ma_kh") {
          return {
            title: item.name,
            dataIndex: item.field,
            type: item.type,
            editable: true,
            key: item.field,
            reference: "ten_kh",
            required: true,
            controller: "dmkh_lookup",
          };
        }

        return {
          title: item.name,
          dataIndex: item.field,
          type: item.type,
          editable: true,
          key: item.field,
        };
      });
      setColumns(layout);

      const data = res.data.map((item, index) => {
        item.key = index;
        return item;
      });

      setDataSource(data);
      setLoading(false);
    });

    ApiGetTaskMaster({ id: id, orderby: "id" }).then((res) => {
      inputForm.setFieldValue(`taskName`, res.data[0]?.text);
      inputForm.setFieldValue(`taskType`, res.data[0]?.loai_cv);
      inputForm.setFieldValue(`priority`, res.data[0]?.muc_do);
      inputForm.setFieldValue(`startTime`, dayjs(res.data[0]?.start_date));
      inputForm.setFieldValue(`startDate`, dayjs(res.data[0]?.start_date));
      inputForm.setFieldValue(`endTime`, dayjs(res.data[0]?.end_date));
      inputForm.setFieldValue(`endDate`, dayjs(res.data[0]?.end_date));
      inputForm.setFieldValue(`assignedName`, res.data[0]?.assigned_name);
      inputForm.setFieldValue(`deptName`, res.data[0]?.ma_bp);
      inputForm.setFieldValue(`tourName`, res.data[0]?.ma_tuyen);
      inputForm.setFieldValue(`unit`, res.data[0]?.ma_tuyen);
      inputForm.setFieldValue(`unitCode`, res.data[0]?.ma_dvcs);
    });
  };

  const scrollToField = (field, fieldName) => {
    const allFields = detailForm.getFieldsValue(true);
    if (!fieldName) {
      const itemFocusName = Object.keys(allFields)
        .filter((item) => item.includes(field))
        .pop();
      document.getElementById(itemFocusName).focus();
      document.getElementById(itemFocusName).scrollIntoView();
    } else {
      document.getElementById(fieldName).focus();
      document.getElementById(fieldName).scrollIntoView();
    }
  };

  const handleDetailValidate = async () => {
    try {
      await detailForm.validateFields();

      if (_.isEmpty(detailForm.getFieldsValue())) {
        message.warning("Vui lòng thêm khách hàng vào công việc !");
        return false;
      }

      return true;
    } catch (error) {
      scrollToField("", error?.errorFields[0]?.name[0]);
      return false;
    }
  };

  const checkingData = async () => {
    console.log("checking");
    await inputForm.validateFields();
    const detailValid = await handleDetailValidate();
    if (detailValid) onSubmitForm();
  };

  ///////////////////////effects/////////////////////////

  useEffect(() => {
    setOpenModal(openModalState);
    if (openModalState) {
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
        } công việc`}</span>
      </div>

      <div className="default_modal_container">
        <Form
          form={inputForm}
          component={false}
          onFinishFailed={onSubmitFormFail}
          onValuesChange={handleChangeValues}
        >
          <LoadingComponents text={"Đang tải..."} size={50} loading={loading} />
          <div className="default_modal_group_items">
            <Space direction="vertical">
              <span className="default_bold_label">Tên công việc</span>
              <Form.Item
                name="taskName"
                rules={[
                  { required: true, message: "Vui lòng điền tên công việc" },
                ]}
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
                placeHolderCode={`Chọn loại công việc`}
                required={true}
              />
              <Space direction="vertical" style={{ width: "100%" }}>
                <span className="default_bold_label">Mức độ ưu tiên</span>
                <Form.Item
                  name="priority"
                  rules={[
                    { required: true, message: "Vui lòng mức độ ưu tiên" },
                  ]}
                >
                  <Select
                    placeholder="Chọn mức độ"
                    style={{ width: "100%" }}
                    options={[
                      { value: 1, label: "Thấp" },
                      { value: 2, label: "Trung bình" },
                      { value: 3, label: "Cao" },
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
                        message: "Vui lòng chọn giờ bắt đầu",
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
                        message: "Vui lòng chọn ngày bắt đầu",
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
                        message: "Vui lòng chọn ngày kết thúc",
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
                        message: "Vui lòng chọn ngày kết thúc",
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
              required={true}
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

          <div className="default_modal_group_items">
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
        </Form>

        <div style={{ height: 270 }}>
          <TableDetail
            detailForm={detailForm}
            columns={columns}
            data={dataSource}
            action={openModalType}
          />
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
              onClick={checkingData}
              className="default_primary_button"
              icon={<img src={send_icon} alt="" />}
            >
              Lưu
            </Button>
          </Form.Item>
        </Space>
      </div>
    </Modal>
  );
};

export default ModalAddTask;
