import { Button, Form, Input, Modal, notification, Select, Space } from "antd";
import React, { useEffect, useState } from "react";
import "./ModalAddTicket.css";

import { Upload } from "antd";
import ImgCrop from "antd-img-crop";
import { memo } from "react";
import { useSelector } from "react-redux";
import send_icon from "../../../../Icons/send_icon.svg";
import { getUserInfo } from "../../../../store/selectors/Selectors";
import { formStatus } from "../../../../utils/constants";
import LoadingComponents from "../../../Loading/LoadingComponents";
import FormSelectDetail from "../../../ReuseComponents/FormSelectDetail";
import PremiumLock from "../../../ReuseComponents/PremiumLock";
import { SoFuckingUltimateApi, SoFuckingUltimateGetApi } from "../../API";

// bắt buộc khai báo bên ngoài

const ModalAddTicket = ({
  handleCloseModal,
  openModalState,
  currentRecord,
  openModalType,
  refreshData,
}) => {
  const [inputForm] = Form.useForm();
  const [isOpenModal, setOpenModal] = useState();
  const [initialValues, setInitialValues] = useState({});
  const [selectOptions, setSelectOptions] = useState([]);
  const [selectLoading, setSelectLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const isPremium = useSelector(getUserInfo).isPremium;
  const [loading, setLoading] = useState(false);

  const onChange = ({ fileList }) => {
    setFileList(fileList);
  };
  const onPreview = async (file) => {
    let src = file.url;
    if (!src) {
      src = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file.originFileObj);
        reader.onload = () => resolve(reader.result);
      });
    }
    const image = new Image();
    image.src = src;
    const imgWindow = window.open(src);
    imgWindow?.document.write(image.outerHTML);
  };

  const handleCancelModal = () => {
    setOpenModal(false);
    handleCloseModal();
    inputForm.resetFields();
    setFileList([]);
  };

  const onSubmitForm = () => {
    const a = { ...inputForm.getFieldsValue() };
    SoFuckingUltimateApi({
      store: "api_create_ticket",
      data: {
        action:
          openModalType === formStatus.EDIT ? openModalType : formStatus.ADD,
        id_ticket: String(currentRecord).trim(),
        ma_kh: a.customerCode,
        ma_nv: a.employeeCode,
        dien_giai: a.description,
        loai_tk: a.ticketTypeCode,
        taskid: a.taskCode,
        status: a.status,
      },
    })
      .then((res) => {
        if (res.status === 200 && res.data === true) {
          notification.success({
            message: `Thành công`,
          });
          refreshData();
          handleCancelModal();
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
    SoFuckingUltimateGetApi({
      store: "Get_ticket_detail",
      data: {
        id: id.trim(),
        pageIndex: 1,
        pageSize: 10,
        SearchKey: "",
        status: "",
      },
    }).then((res) => {
      inputForm.setFieldValue(`customerCode`, res.data[0]?.ma_kh?.trim());
      inputForm.setFieldValue(`customerName`, res.data[0]?.ten_kh?.trim());
      inputForm.setFieldValue(`employeeCode`, res.data[0]?.ma_nvbh?.trim());
      inputForm.setFieldValue(`employeeName`, res.data[0]?.ten_nvbh?.trim());
      inputForm.setFieldValue(`ticketTypeCode`, res.data[0]?.type);
      inputForm.setFieldValue(`ticketTypeName`, res.data[0]?.ten_loai?.trim());
      inputForm.setFieldValue(`taskCode`, res.data[0]?.taskId);
      inputForm.setFieldValue(`taskName`, res.data[0]?.ten_cv?.trim());
      inputForm.setFieldValue(`description`, res.data[0]?.dien_giai?.trim());
      inputForm.setFieldValue(`status`, String(res.data[0]?.status));
      setLoading(false);
    });
  };

  useEffect(() => {
    setOpenModal(openModalState);
    if (openModalState && openModalType === formStatus.EDIT) {
      setLoading(true);
      getDataEdit(currentRecord || "0");
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
      width={600}
    >
      <div className="default_modal_header">
        <span className="default_header_label">{`${
          openModalType == formStatus.EDIT ? "Sửa" : "Thêm mới"
        } ticket`}</span>
      </div>
      <Form
        form={inputForm}
        className="default_modal_container"
        onFinishFailed={onSubmitFormFail}
        onFinish={onSubmitForm}
      >
        <LoadingComponents text={"Đang tải..."} size={50} loading={loading} />
        <div className="default_modal_group_items">
          <FormSelectDetail
            disable={openModalState == formStatus.VIEW ? true : false}
            label="Khách hàng"
            keyCode="customerCode"
            keyName="customerName"
            controller="dmkh_lookup"
            form={inputForm}
            placeHolderCode="Điền khách hàng"
            placeHolderName="Tên khách hàng"
            required={true}
          />
        </div>

        <div className="default_modal_group_items">
          <FormSelectDetail
            disable={openModalState == formStatus.VIEW ? true : false}
            label="Nhân viên"
            keyCode="employeeCode"
            keyName="employeeName"
            controller="dmnvbh_lookup"
            form={inputForm}
            placeHolderCode="Điền nhân viên"
            placeHolderName="Tên nhân viên"
            required={true}
          />
        </div>

        <div className="default_modal_group_items">
          <FormSelectDetail
            disable={openModalState == formStatus.VIEW ? true : false}
            label="Loại ticket"
            keyCode="ticketTypeCode"
            placeHolderCode="Điền loại ticket"
            keyName="ticketTypeName"
            placeHolderName="Tên loại ticket"
            controller="dmloaitk_lookup"
            form={inputForm}
            required={false}
          />
        </div>

        <div className="default_modal_group_items">
          <FormSelectDetail
            disable={openModalState == formStatus.VIEW ? true : false}
            label="Công việc"
            keyCode="taskCode"
            placeHolderCode="Điền tên công việc"
            keyName="taskName"
            placeHolderName="Tên công việc"
            controller="sysevents_lookup"
            form={inputForm}
            required={true}
          />
        </div>

        <div className="default_modal_group_items">
          <div className="default_modal_1_row_items">
            <span className="default_bold_label" style={{ width: "100px" }}>
              Nội dung
            </span>
            <Form.Item name="description">
              <Input.TextArea
                autoSize={{
                  minRows: 1,
                  maxRows: 4,
                }}
                placeholder="Nhập nội dung"
              />
            </Form.Item>
          </div>
        </div>

        <div className="default_modal_group_items">
          <div className="default_modal_1_row_items">
            <span className="default_bold_label" style={{ width: "100px" }}>
              Trạng thái
            </span>
            <Form.Item
              name="status"
              initialValue={"1"}
              rules={[{ required: true, message: "Điền tên trạng thái" }]}
            >
              <Select
                options={[
                  { value: "1", label: "Đã xử lý" },
                  { value: "0", label: "Chưa xử lý" },
                ]}
              />
            </Form.Item>
          </div>
        </div>

        <div className="default_modal_group_items relative">
          <PremiumLock isPremium={isPremium ? isPremium : false}>
            <ImgCrop
              rotationSlider
              modalTitle={"Chỉnh sửa"}
              showReset
              resetText={"Khôi phục"}
              aspect={0.5625}
            >
              <Upload
                disabled={!isPremium}
                listType="picture-card"
                fileList={fileList}
                onChange={onChange}
                onPreview={onPreview}
                action="localhost:3000"
                multiple
                beforeUpload={(file) => {
                  console.log(file);
                }}
              >
                {fileList.length < 5 && "+ Upload"}
              </Upload>
            </ImgCrop>
          </PremiumLock>
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

export default memo(ModalAddTicket);
