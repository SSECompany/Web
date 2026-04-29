import {
  Button,
  DatePicker,
  Form,
  Modal,
  notification,
  Select,
  Space,
} from "antd";
import dayjs from "dayjs";
import React, { memo, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { formStatus } from "../../../../utils/constants";
import { SoFuckingUltimateGetApi, UltimatePutDataApi } from "../../../DMS/API";
import LoadingComponents from "../../../Loading/LoadingComponents";
import FormSelectDetail from "../../../ReuseComponents/FormSelectDetail";
import { getApproveItemDetail } from "../../Store/Selectors/Selectors";
import TableDetail from "./Details/TableDetail";

const ModalApproveItems = ({
  handleCloseModal,
  openModalState,
  currentRecord,
  openModalType,
  refreshData,
}) => {
  const [inputForm] = Form.useForm();
  const [isOpenModal, setOpenModal] = useState();
  const [initialValues, setInitialValues] = useState({});
  const [selectLoading, setSelectLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const [detailData, setDetailData] = useState([]);
  const [detaiLayout, setDetaiLayout] = useState([]);
  const detailTable = useRef();
  const detailTableData = useSelector(getApproveItemDetail);

  const handleCancelModal = () => {
    setOpenModal(false);
    setDetailData([]);
    handleCloseModal();
    inputForm.resetFields();
  };

  const checkValidDate = () => {
    const dateStart = inputForm.getFieldValue("date_from");
    const dateEnd = inputForm.getFieldValue("date_to");
    if (!dateStart || !dateEnd) return true;
    return dateStart <= dateEnd;
  };

  const handleChangeValues = () => {
    inputForm.validateFields(["date_from", "date_to"]);
  };

  const onSubmitForm = async () => {
    const master = {
      id: currentRecord ? currentRecord : null,
      action:
        openModalType === formStatus.EDIT ? openModalType : formStatus.ADD,
      UserId: 0,
      ...inputForm.getFieldsValue(),
    };
    delete master.ten_nvbh;

    UltimatePutDataApi({
      store: "api_create_item_approve",
      data: master,
      listData: detailTableData,
    })
      .then((res) => {
        if (res.status != "Failed") {
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
      store: "api_get_items_approve",
      data: {
        id: id,
        pageIndex: 1,
        pageSize: 10,
      },
    }).then((res) => {
      const keys = Object.keys(inputForm.getFieldsValue());
      if (res.data.length > 0)
        keys.map((item) => {
          const field = res?.reportLayoutModel?.find(
            (layout) => layout?.field == item
          );
          return field?.type == "Datetime"
            ? inputForm.setFieldValue(item, dayjs(res?.data[0][item]))
            : inputForm.setFieldValue(item, res?.data[0][item]);
        });
    });

    SoFuckingUltimateGetApi({
      store: "api_get_approve_item_detail",
      data: {
        id: id,
      },
    }).then((res) => {
      setDetailData(res?.data);
      setDetaiLayout(res?.reportLayoutModel);
      setLoading(false);
    });
  };

  const checkingData = async () => {
    try {
      await inputForm.validateFields();
      detailTable.current.getData();
    } catch (error) {
      console.log(error);
      return;
    }
  };

  //////////////////////////effects/////////////////////////////////////////////

  useEffect(() => {
    setOpenModal(openModalState);
    if (openModalState) {
      setLoading(true);
      getDataEdit(currentRecord ? currentRecord : 0);
    }
  }, [JSON.stringify(openModalState)]);

  useEffect(() => {
    if (detailTableData && detailTableData.length > 0) {
      onSubmitForm();
    }
  }, [detailTableData]);

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
        } phân quyền sản phẩm`}</span>
      </div>
      <Form
        form={inputForm}
        className="default_modal_container"
        onFinishFailed={onSubmitFormFail}
        onFinish={onSubmitForm}
        onValuesChange={handleChangeValues}
      >
        <LoadingComponents text={"Đang tải..."} size={50} loading={loading} />

        <FormSelectDetail
          disable={openModalType == formStatus.VIEW ? true : false}
          label="Nhân viên"
          keyCode="ma_nvbh"
          keyName="ten_nvbh"
          controller="dmnvbh_lookup"
          form={inputForm}
          placeHolderCode="Nhân viên"
          placeHolderName="Tên nhân viên"
          required={true}
        />

        <div className="default_modal_group_items">
          <div className="split__view__detail__primary__item">
            <span className="default_bold_label" style={{ width: "100px" }}>
              Ngày bắt đầu
            </span>

            <Form.Item
              initialValue={dayjs()}
              className="flex-1"
              name="date_from"
              rules={[
                { required: true, message: "Điền ngày bắt đầu" },
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
                disabled={openModalType === "VIEW" ? true : false}
                format={"DD/MM/YYYY"}
                style={{ width: "100%" }}
                placeholder="Chọn ngày"
              />
            </Form.Item>
          </div>

          <div className="split__view__detail__primary__item">
            <span className="default_bold_label" style={{ width: "100px" }}>
              Ngày kết thúc
            </span>

            <Form.Item
              initialValue={dayjs()}
              className="flex-1"
              name="date_to"
              rules={[
                { required: true, message: "Điền ngày kết thúc" },
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
                disabled={openModalType === "VIEW" ? true : false}
                format={"DD/MM/YYYY"}
                style={{ width: "100%" }}
                placeholder="Chọn ngày"
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
              rules={[{ required: true, message: "Điền tên trạng thái" }]}
              initialValue={"1"}
            >
              <Select
                options={[
                  { value: "1", label: "Hoạt động" },
                  { value: "0", label: "Huỷ" },
                ]}
              />
            </Form.Item>
          </div>
        </div>

        <TableDetail
          Tablecolumns={detaiLayout}
          data={detailData}
          masterForm={inputForm}
          Action={openModalType}
          ref={detailTable}
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
              onClick={checkingData}
              className="default_primary_button"
              icon={<i className="pi pi-send"></i>}
            >
              Lưu
            </Button>
          </Form.Item>
        </Space>
      </Form>
    </Modal>
  );
};

export default memo(ModalApproveItems);
