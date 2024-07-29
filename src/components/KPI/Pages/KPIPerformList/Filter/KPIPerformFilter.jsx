import { Button, DatePicker, Drawer, Form, Space } from "antd";
import React, { memo, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { datetimeFormat } from "../../../../../app/Options/DataFomater";
import FormSelectDetailv2 from "../../../../ReuseComponents/FormSelectDetailv2";
import { setIsOpenKPIPerformFilterModal } from "../../../Store/Actions/KPIPerforms";
import { getKPIPerformState } from "../../../Store/Selectors/Selectors";

const KPIPerformFilter = ({ onFilter }) => {
  const [filterForm] = Form.useForm();
  const [initial, setInitial] = useState({});
  const [validations, setValidations] = useState(false);
  const { isOpenFilterModal } = useSelector(getKPIPerformState);

  const resetForm = () => {
    setInitial({
      ngay_bd: null,
      ngay_kt: null,
      ma_nvbh: "",
      ma_kpi: "",
    });
  };

  const handleCancelFilter = () => {
    handleCloseFilter();
  };

  const handleFilter = async () => {
    const data = { ...filterForm.getFieldsValue() };
    await onFilter(data);
    handleCloseFilter();
  };

  const handleCloseFilter = () => {
    setIsOpenKPIPerformFilterModal(false);
    setValidations(false);
  };

  const handleChangeValues = (items, allValues) => {
    const object = _.first(Object.keys(items));
    if ((object === "ngay_bd" || object === "ngay_kt") && items[object]) {
      setValidations(true);
    } else setValidations(false);
  };

  useEffect(() => {
    if (isOpenFilterModal) {
      resetForm();
    }
    return () => {};
  }, [isOpenFilterModal]);

  useEffect(() => {
    return () => {
      handleCloseFilter();
      resetForm();
      setValidations(false);
    };
  }, []);

  useEffect(() => {
    if (isOpenFilterModal) {
      filterForm.resetFields();
    }
    return () => {};
  }, [initial]);

  return (
    <Drawer
      title={`Tìm kiếm`}
      placement="right"
      size={250}
      open={isOpenFilterModal}
      onClose={handleCloseFilter}
      destroyOnClose={true}
    >
      <Form
        initialValues={initial}
        form={filterForm}
        scrollToFirstError={true}
        className="default_filter_form"
        onValuesChange={handleChangeValues}
        onFinish={handleFilter}
      >
        <div className="default_modal_container" style={{ overflowY: "auto" }}>
          <div
            className="default_modal_group_items"
            style={{ flexDirection: "column", gap: "8px" }}
          >
            <span className="default_bold_label">Ngày bắt đầu - kết thúc</span>
            <div className="default_modal_group_items">
              <Form.Item
                name="ngay_bd"
                rules={[
                  {
                    required: validations,
                    message: "Vui lòng chọn ngày bắt đầu",
                  },
                ]}
              >
                <DatePicker
                  format={"DD/MM/YYYY"}
                  style={{ width: "100%" }}
                  placeholder="Từ ngày"
                />
              </Form.Item>
              <Form.Item
                name="ngay_kt"
                rules={[
                  {
                    required: validations,
                    message: "Vui lòng chọn ngày kết thúc",
                  },
                ]}
              >
                <DatePicker
                  format={datetimeFormat}
                  style={{ width: "100%" }}
                  placeholder="Đến ngày"
                />
              </Form.Item>
            </div>
          </div>

          <div className="default_modal_group_items">
            <FormSelectDetailv2
              width={100}
              codeWidth={120}
              controller={"dmkpi_lookup"}
              keyCode="ma_kpi"
              keyName="ten_kpi"
              label="KPI"
              placeHolderCode="KPI"
              placeHolderName="Tên KPI"
              form={filterForm}
              direction="column"
            />
          </div>

          <div className="default_modal_group_items">
            <FormSelectDetailv2
              width={100}
              codeWidth={120}
              controller={"dmnvbh_lookup"}
              keyCode="ma_nvbh"
              keyName="ten_nvbh"
              label="Nhân viên"
              placeHolderCode="Nhân viên"
              placeHolderName="Tên nhân viên"
              form={filterForm}
              direction="column"
            />
          </div>
        </div>

        <Space
          align="center"
          style={{ width: "100%", justifyContent: "center" }}
        >
          <Button
            className="default_subsidiary_button"
            onClick={handleCancelFilter}
          >
            Huỷ
          </Button>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              Tìm kiếm
            </Button>
          </Form.Item>
        </Space>
      </Form>
    </Drawer>
  );
};

export default memo(KPIPerformFilter);
