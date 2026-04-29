import { Button, Drawer, Form, Space } from "antd";
import PropTypes from "prop-types";
import React, { memo, useEffect, useState } from "react";
import send_icon from "../../../../../Icons/send_icon.svg";
import FormSelectDetail from "../../../../ReuseComponents/FormSelectDetail";
const Filter = ({ isOpenAdvanceFilter, setIsOpenAdvanceFilter, onFilter }) => {
  const [filterForm] = Form.useForm();
  const [selectOptions, setSelectOptions] = useState([]);
  const [selectLoading, setSelectLoading] = useState(false);
  const [openState, setOpenState] = useState(false);

  const closeAdvanceFilter = () => {
    setIsOpenAdvanceFilter(false);
    filterForm.resetFields();
  };

  const onSubmitForm = () => {
    const a = { ...filterForm.getFieldsValue() };

    onFilter(a);
  };

  const onSubmitFormFail = () => {};

  useEffect(() => {
    if (isOpenAdvanceFilter) {
    }
  }, [JSON.stringify(isOpenAdvanceFilter)]);

  return (
    <Drawer
      title={`Tìm kiếm`}
      placement="right"
      size={250}
      open={isOpenAdvanceFilter}
      onClose={closeAdvanceFilter}
    >
      <Form
        form={filterForm}
        onFinishFailed={onSubmitFormFail}
        scrollToFirstError={true}
        onFinish={onSubmitForm}
        className="default_filter_form"
      >
        <div className="default_modal_container" style={{ padding: "0" }}>
          <div className="default_modal_group_items">
            <Space direction="vertical"></Space>
          </div>

          <div className="default_modal_group_items">
            <FormSelectDetail
              width={100}
              codeWidth={120}
              controller={"dmkh_lookup"}
              keyCode="ma_kh"
              keyName="ten_kh"
              label="Khách hàng"
              placeHolderCode="Khách hàng"
              placeHolderName="Tên khách"
              form={filterForm}
              direction="column"
            />
          </div>

          <div className="default_modal_group_items">
            <FormSelectDetail
              width={100}
              codeWidth={120}
              controller={"dmdvcs_lookup"}
              keyCode="ma_dvcs"
              keyName="ten_dvcs"
              label="Đơn vị cơ sở"
              placeHolderCode="Đơn vị"
              placeHolderName="Tên đơn vị"
              form={filterForm}
              direction="column"
            />
          </div>

          <div className="default_modal_group_items">
            <FormSelectDetail
              width={100}
              codeWidth={120}
              controller={"dmalbum_lookup"}
              keyCode="ma_album"
              keyName="ten_album"
              label="Album"
              placeHolderCode="Album"
              placeHolderName="Tên album"
              form={filterForm}
              direction="column"
            />
          </div>

          <div className="default_modal_group_items">
            <FormSelectDetail
              width={100}
              codeWidth={120}
              controller={"dmkh_lookup"}
              keyCode="ma_kh"
              keyName="ten_kh"
              label="Khách hàng"
              placeHolderCode="Khách hàng"
              placeHolderName="Tên khách"
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
            onClick={closeAdvanceFilter}
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
              Tìm kiếm
            </Button>
          </Form.Item>
        </Space>
      </Form>
    </Drawer>
  );
};

export default memo(Filter);

Filter.prototype = {
  isOpenAdvanceFilter: PropTypes.bool.isRequired,
  setIsOpenAdvanceFilter: PropTypes.func,
  onFilter: PropTypes.func,
};
