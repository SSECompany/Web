import { Button, Drawer, Form, Input, Space } from "antd";
import React, { memo, useState } from "react";
import { deleteObjectItems } from "../../../../../app/hooks/dataFormatHelper";
import send_icon from "../../../../../Icons/send_icon.svg";
import FormSelectDetail from "../../../../ReuseComponents/FormSelectDetail";
const Filter = (props) => {
  const [filterForm] = Form.useForm();
  const [selectOptions, setSelectOptions] = useState([]);
  const [selectLoading, setSelectLoading] = useState(false);
  const [openState, setOpenState] = useState(false);

  const closeAdvanceFilter = () => {
    props.setIsOpenAdvanceFilter(false);
    filterForm.resetFields();
  };

  const onSubmitForm = () => {
    const filterData = {
      ...deleteObjectItems(filterForm.getFieldsValue(), [
        "ten_kh",
        "ten_phan_loai",
        "ten_hinh_thuc",
      ]),
    };

    props.onFilter(filterData);
    closeAdvanceFilter();
  };

  const onSubmitFormFail = () => {};

  return (
    <Drawer
      title={`Tìm kiếm`}
      placement="right"
      size={250}
      open={props.isOpenAdvanceFilter}
      onClose={closeAdvanceFilter}
    >
      <Form
        form={filterForm}
        onFinishFailed={onSubmitFormFail}
        scrollToFirstError={true}
        onFinish={onSubmitForm}
        className="default_filter_form"
      >
        <div className="default_modal_container" style={{ overflowY: "auto" }}>
          <div className="default_modal_group_items">
            <FormSelectDetail
              width={100}
              codeWidth={120}
              controller={"dmkhDMS_lookup"}
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
            <Space direction="vertical">
              <span className="default_bold_label">Địa chỉ</span>
              <div className="default_modal_group_items">
                <Form.Item name="dia_chi" initialValue={""}>
                  <Input placeholder="Địa chỉ" />
                </Form.Item>
              </div>
            </Space>
          </div>

          <div className="default_modal_group_items">
            <Space direction="vertical">
              <span className="default_bold_label">Điện thoại</span>
              <div className="default_modal_group_items">
                <Form.Item name="dien_thoai" initialValue={""}>
                  <Input placeholder="Điện thoại" />
                </Form.Item>
              </div>
            </Space>
          </div>

          <div className="default_modal_group_items">
            <FormSelectDetail
              width={100}
              codeWidth={120}
              controller={"dmphanloai_lookup"}
              keyCode="phan_loai"
              keyName="ten_phan_loai"
              label="Phân loại"
              placeHolderCode="Phân loại"
              placeHolderName="Tên phân loại"
              form={filterForm}
              direction="column"
            />
          </div>

          <div className="default_modal_group_items">
            <FormSelectDetail
              width={100}
              codeWidth={120}
              controller={"dmhinhthuc_lookup"}
              keyCode="hinh_thuc"
              keyName="ten_hinh_thuc"
              label="Hình thức"
              placeHolderCode="Hình thức"
              placeHolderName="Tên Hình thức"
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
