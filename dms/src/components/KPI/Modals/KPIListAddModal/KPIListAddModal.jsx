import { Button, Form, Input, Modal, notification, Select, Space } from "antd";
import _ from "lodash";
import React, { memo, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { KeyFormatter } from "../../../../app/Options/KeyFormatter";
import { formStatus } from "../../../../utils/constants";
import LoadingComponents from "../../../Loading/LoadingComponents";
import FormSelect from "../../../ReuseComponents/FormSelect";
import { multipleTablePutApi } from "../../../SaleOrder/API";
import {
  fetchKPIListData,
  putKpilist,
  setKPIListCurrentItem,
  setKPIListOpenModal,
} from "../../Store/Actions/KPIList";
import { getKPIListState } from "../../Store/Selectors/Selectors";

const KPIListAddModal = ({ refreshFunction }) => {
  const [form] = Form.useForm();
  const { isOpenModal, currentItem } = useSelector(getKPIListState);
  const [initial, setInitial] = useState({
    ma_kpi: "",
    ten_kpi: "",
    ghi_chu: "",
    chuc_nang: null,
    loai_kpi: null,
    ma_vt: null,
    ten_vt: "",
  });
  const [optionsFunction, setOptionsFunction] = useState([]);
  const [optionsTypeKPI, setOptionsTypeKPI] = useState([]);
  const [mavtRequire, setMavtRequire] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCloseModal = () => {
    setKPIListOpenModal(false);
    setKPIListCurrentItem({});
    setInitial({
      ma_kpi: "",
      ten_kpi: "",
      ghi_chu: "",
      chuc_nang: null,
      loai_kpi: null,
      ma_vt: null,
      ten_vt: "",
    });
  };

  const scrollToField = (fieldName) => {
    document.getElementById(fieldName).focus();
    document.getElementById(fieldName).scrollIntoView();
  };

  const onSubmitForm = async () => {
    try {
      await form.validateFields();
      const result = await putKpilist({
        action: _.isEmpty(currentItem) ? formStatus.ADD : formStatus.EDIT,
        ...form.getFieldsValue(),
      });
      if (result?.isSucceded) {
        form.resetFields();
        handleCloseModal();
        notification.success({
          message: `Thực hiện thành công`,
        });
        refreshFunction();
      } else {
        notification.warning({
          message: result.message,
        });
      }
    } catch (error) {
      console.log(error);
      scrollToField(error?.errorFields[0]?.name[0]);
    }
  };

  const fetchSelectData = async (table_id = "") => {
    await multipleTablePutApi({
      store: "api_get_KPI_Select_Options",
      param: {
        table_id: table_id,
      },
      data: {},
    }).then((res) => {
      if (res?.responseModel?.isSucceded) {
        if (table_id) {
          setOptionsTypeKPI(_.first(res?.listObject || []));
        }
        if (!table_id) {
          setOptionsFunction(_.first(res?.listObject || []));
        }
      }
    });
    setLoading(false);
  };

  const fetchDetailData = async () => {
    await fetchKPIListData({ id: currentItem?.ma_kpi || "" }).then((res) => {
      var init = _.first(res.data);
      if (init?.ma_vt) setMavtRequire(true);
      else setMavtRequire(false);
      setInitial(init);
      fetchSelectData(init.chuc_nang);
    });
  };

  const handleFormChange = (changes) => {
    if (_.first(Object.keys(changes)) === "chuc_nang") {
      form.setFieldValue("loai_kpi", null);
      form.setFieldValue("ma_vt", null);
      fetchSelectData(changes?.chuc_nang);
    }

    if (_.first(Object.keys(changes)) === "loai_kpi") {
      form.setFieldValue("ma_vt", null);

      const item_column = _.first(
        optionsTypeKPI.filter((item) => item.value === changes?.loai_kpi) || {}
      )?.item_column;
      if (item_column.trim() !== "") setMavtRequire(true);
      else setMavtRequire(false);
    }
  };

  useEffect(() => {
    form.resetFields();
    return () => {};
  }, [initial]);

  useEffect(() => {
    if (!_.isEmpty(currentItem) && isOpenModal) {
      fetchDetailData();
      setLoading(true);
    }
    return () => {};
  }, [currentItem]);

  useEffect(() => {
    fetchSelectData();
    return () => {
      setKPIListCurrentItem({});
    };
  }, []);

  return (
    <Form
      form={form}
      className="default_modal_container"
      initialValues={initial}
      component={false}
      onValuesChange={handleFormChange}
      scrollToFirstError={true}
    >
      <Modal
        className="default_modal"
        closable={false}
        open={isOpenModal}
        onCancel={handleCloseModal}
        okText="Hoàn thành"
        centered
        width={600}
        destroyOnClose
        footer={[
          <div key="submit" className="pr-3 pb-3">
            <Button onClick={onSubmitForm} htmlType="submit" type="primary">
              Hoàn thành
            </Button>
          </div>,
        ]}
      >
        <div className="default_modal_header">
          <span className="default_header_label">
            {_.isEmpty(currentItem) ? "Thêm" : "Sửa"} KPI
          </span>
        </div>
        <LoadingComponents loading={loading} text={"Đang tải"} />
        <Space direction="vertical" className="w-full pt-2 pl-3 pr-3 relative">
          <div className="default_modal_group_items">
            <Space size={2} direction="vertical" className="flex-1">
              <span className="default_bold_label">Mã KPI</span>
              <Form.Item
                name="ma_kpi"
                rules={[{ required: true, message: "Mã KPI trống" }]}
                className="w-full"
              >
                <Input
                  onInput={(e) =>
                    (e.target.value = KeyFormatter(e.target.value))
                  }
                  maxLength="32"
                  placeholder="Nhập mã KPI"
                ></Input>
              </Form.Item>
            </Space>
          </div>

          <div className="default_modal_group_items">
            <Space size={2} direction="vertical" className="flex-1">
              <span className="default_bold_label">Tên KPI</span>
              <Form.Item
                name="ten_kpi"
                rules={[{ required: true, message: "Tên kpi trống" }]}
                className="w-full"
              >
                <Input maxLength={128} placeholder="Nhập tên KPI"></Input>
              </Form.Item>
            </Space>
          </div>

          <div className="default_modal_group_items">
            <Space size={2} direction="vertical" className="flex-1">
              <span className="default_bold_label">Ghi chú</span>
              <Form.Item name="ghi_chu">
                <Input.TextArea
                  autoSize={{
                    minRows: 2,
                    maxRows: 4,
                  }}
                  placeholder="Ghi chú"
                />
              </Form.Item>
            </Space>
          </div>

          <div className="default_modal_group_items">
            <Space size={2} direction="vertical" className="flex-1">
              <span className="default_bold_label">Chức năng</span>
              <Form.Item
                name="chuc_nang"
                rules={[{ required: true, message: "Chọn chức năng" }]}
                className="w-full"
              >
                <Select
                  placeholder="Chọn chức năng"
                  style={{ width: "100%" }}
                  options={optionsFunction}
                />
              </Form.Item>
            </Space>

            <Space size={2} direction="vertical" className="flex-1">
              <span className="default_bold_label">Loại KPI</span>
              <Form.Item
                name="loai_kpi"
                rules={[{ required: true, message: "Chọn loại" }]}
                className="w-full"
              >
                <Select
                  placeholder="Chọn loại"
                  style={{ width: "100%" }}
                  options={optionsTypeKPI}
                />
              </Form.Item>
            </Space>

            <FormSelect
              direction={"COLUMN"}
              disable={!mavtRequire}
              controller={"dmvt_lookup"}
              form={form}
              keyCode="ma_vt"
              label="Vật tư"
              placeHolderCode="Chọn vật tư"
              required={mavtRequire}
              defaultOptions={[
                {
                  value: initial?.ma_vt || null,
                  label: initial?.ten_vt || null,
                },
              ]}
            />
          </div>
        </Space>
      </Modal>
    </Form>
  );
};

export default memo(KPIListAddModal);
