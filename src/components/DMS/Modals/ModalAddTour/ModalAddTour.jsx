import { Button, Form, Input, message, Modal, notification, Space } from "antd";
import _ from "lodash";
import React, { useEffect, useState } from "react";
import {
  getAllRowKeys,
  getAllValueByRow,
} from "../../../../app/Functions/getTableValue";
import { KeyFormatter } from "../../../../app/Options/KeyFormatter";
import send_icon from "../../../../Icons/send_icon.svg";
import { formStatus } from "../../../../utils/constants";
import LoadingComponents from "../../../Loading/LoadingComponents";
import FormSelectDetail from "../../../ReuseComponents/FormSelectDetail";
import { multipleTablePutApi } from "../../../SaleOrder/API";
import { ApiGetTourDetail, ApiGetTourList } from "../../API";
import { setTourDetail } from "../../Store/Sagas/Sagas";
import TableDetail from "./Detail/TableDetail";
import "./ModalAddTour.css";

const ModalAddTour = (props) => {
  const [detailForm] = Form.useForm();
  const [inputForm] = Form.useForm();
  const [isOpenModal, setOpenModal] = useState();
  const [dataSource, setDataSource] = useState([]);
  const [columns, setColumns] = useState([]);
  const [tableParams, setTableParams] = useState({
    keywords: "",
    orderby: "ma_tuyen",
    ma_nv: "",
    mo_ta: "",
    ten_nv: "",
    ma_tuyen: "",
    ten_tuyen: "",
    pageindex: 1,
    pagesize: 10,
  });
  const [disableFields, setDisableFields] = useState(false);
  const [loading, setLoading] = useState(false);

  //Functions//////////////////////////////

  const handleCancelModal = () => {
    setOpenModal(false);
    props.handleCloseModal();
    inputForm.resetFields();
    setDataSource([]);
    setColumns([]);
    setDisableFields(false);
    setTourDetail([]);
  };

  const onSubmitForm = async () => {
    const masterData = inputForm.getFieldsValue();
    const rawDetailData = detailForm.getFieldsValue();
    const detailData = await getAllRowKeys(rawDetailData).map((item) => {
      return getAllValueByRow(item, rawDetailData);
    });

    const master = { ...masterData };
    const detail = [...(await detailDataProcess(detailData))];

    multipleTablePutApi({
      store: "api_create_dmtuyen",
      param: {
        action: props.openModalType === "EDIT" ? props.openModalType : "ADD",
        ma_tuyen: master.tourCode,
        ten_tuyen: master.tourName,
        mo_ta: master.description,
        UserId: 1,
        dvcs: master.unitCode,
        ma_nv: master.saleEmployeeCode,
        status: 1,
      },
      data: { temp: _.isEmpty(detail) ? undefined : detail },
    }).then((res) => {
      if (res?.responseModel?.isSucceded) {
        notification.success({
          message: `Thực hiện thành công`,
        });

        props.refreshData();
        handleCancelModal();
      } else {
        notification.warning({
          message: res?.responseModel?.message,
        });
      }
    });
  };

  const onSubmitFormFail = () => {};

  ///////////////////////////////////////////////////////////////////////

  const handleDetailValidate = async () => {
    try {
      await detailForm.validateFields();

      if (_.isEmpty(detailForm.getFieldsValue())) {
        message.warning("Vui lòng thêm khách hàng vào tuyến !");
        return false;
      }

      return true;
    } catch (error) {
      scrollToField("", error?.errorFields[0]?.name[0]);
      return false;
    }
  };

  const checkingData = async () => {
    try {
      await inputForm.validateFields();
      const detailValid = await handleDetailValidate();
      if (detailValid) onSubmitForm();
    } catch (error) {
      return;
    }
  };

  const detailDataProcess = async (data) => {
    const newData = data.map((record) => {
      return {
        ...record,
        ma_tuyen: inputForm.getFieldValue(`tourCode`).trim(),
        status: true,
      };
    });
    return newData;
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

  const getDataEdit = async (id) => {
    ApiGetTourDetail({ ma_tuyen: id }).then((res) => {
      const layout = res?.detail.map((item) => {
        if (item.Field === "ma_kh") {
          return {
            title: item.Name,
            dataIndex: item.Field,
            type: item.Type,
            editable: true,
            key: item.Field,
            reference: "ten_kh",
            controller: "dmkh_lookup",
            required: true,
          };
        }

        return {
          title: item.Name,
          dataIndex: item.Field,
          type: item.Type,
          editable: true,
          key: item.Field,
        };
      });

      setColumns(layout);

      const data = res.master.map((item, index) => {
        item.key = index;
        return item;
      });

      setLoading(false);
      setDataSource(data);
      setDisableFields(true);
    });

    ApiGetTourList({ ...tableParams, ma_tuyen: id, orderby: "ma_tuyen" }).then(
      (res) => {
        inputForm.setFieldValue(`tourCode`, res.data[0]?.ma_tuyen || "");
        inputForm.setFieldValue(`tourName`, res.data[0]?.ten_tuyen || "");
        inputForm.setFieldValue(`saleEmployeeCode`, res.data[0]?.ma_nv || "");
        inputForm.setFieldValue(
          `saleEmployeeName`,
          res.data[0]?.ten_nvbh || ""
        );
        inputForm.setFieldValue(`description`, res.data[0]?.mo_ta || "");
        inputForm.setFieldValue(`unitCode`, res.data[0]?.dvcs || "");
        inputForm.setFieldValue(`unitName`, res.data[0]?.ten_dvcs || "");
      }
    );
  };

  //effectively////////////////////////////////////////////////////////////////////////////
  useEffect(() => {
    setOpenModal(props.openModalState);

    if (props.openModalState) {
      setLoading(true);
      getDataEdit(props.currentRecord || "null");
    }
  }, [JSON.stringify(props)]);

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
          props.openModalType == "EDIT" ? "Sửa" : "Thêm mới"
        } tuyến khách hàng`}</span>
      </div>
      <div className="default_modal_container">
        <Form
          form={inputForm}
          component={false}
          onFinishFailed={onSubmitFormFail}
        >
          <LoadingComponents text={"Đang tải..."} size={50} loading={loading} />
          <div className="default_modal_group_items">
            <div className="default_modal_1_row_items">
              <span className="default_bold_label" style={{ width: "100px" }}>
                Mã tuyến
              </span>
              <Form.Item
                name="tourCode"
                disabled={disableFields}
                onInput={(e) => (e.target.value = KeyFormatter(e.target.value))}
                rules={[{ required: true, message: "Điền mã tuyến" }]}
              >
                <Input placeholder="Nhập mã tuyến" />
              </Form.Item>
            </div>
          </div>
          <div className="default_modal_group_items">
            <div className="default_modal_1_row_items">
              <span className="default_bold_label" style={{ width: "100px" }}>
                Tên tuyến
              </span>
              <Form.Item
                name="tourName"
                rules={[{ required: true, message: "Điền tên tuyến" }]}
              >
                <Input placeholder="Nhập tên tuyến" />
              </Form.Item>
            </div>
          </div>
          <div className="default_modal_group_items">
            <FormSelectDetail
              disable={props.openModalState == formStatus.VIEW ? true : false}
              label="NV phụ trách"
              keyCode="saleEmployeeCode"
              keyName="saleEmployeeName"
              controller="dmnvbh_lookup"
              form={inputForm}
              placeHolderCode="Nhân viên"
              placeHolderName="Tên nhân viên"
              required={true}
            />
          </div>
          <div className="default_modal_group_items">
            <FormSelectDetail
              disable={props.openModalState == formStatus.VIEW ? true : false}
              label="Đơn vị"
              keyCode="unitCode"
              keyName="unitName"
              controller="dmdvcs_lookup"
              form={inputForm}
              placeHolderCode="Đơn vị"
              placeHolderName="Tên đơn vị"
              required={true}
            />
          </div>
          <div className="default_modal_group_items">
            <div className="default_modal_1_row_items">
              <span className="default_bold_label" style={{ width: "100px" }}>
                Người tạo
              </span>
              <Form.Item name="createdUser">
                <Input placeholder="Nhập người tạo" />
              </Form.Item>
            </div>
          </div>
          <div className="default_modal_group_items">
            <div className="default_modal_1_row_items">
              <span className="default_bold_label" style={{ width: "100px" }}>
                Mô tả
              </span>
              <Form.Item name="description">
                <Input placeholder="Nhập mô tả" />
              </Form.Item>
            </div>
          </div>
        </Form>
        <TableDetail
          detailForm={detailForm}
          columns={columns}
          data={dataSource}
          action={props.openModalType}
        />

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

export default ModalAddTour;
