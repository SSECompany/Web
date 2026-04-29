import { Button, DatePicker, Drawer, Form, Input, Space } from "antd";
import dayjs from "dayjs";
import React, { memo } from "react";
import { deleteObjectItems } from "../../../../../app/hooks/dataFormatHelper";
import FormSelectDetail from "../../../../ReuseComponents/FormSelectDetail";

const Filter = ({ openState, closeCallback, filterCallback }) => {
  const [filterForm] = Form.useForm();

  const handleFilter = (item) => {
    const filterData = deleteObjectItems(item, [
      "ten_hinh_thuc",
      "ten_kh",
      "ten_nvbh",
      "ten_phan_loai",
    ]);

    filterCallback(filterData);
    closeCallback();
  };

  const handleCloseFilter = () => {
    closeCallback();
    filterForm.resetFields();
  };

  return (
    <Drawer
      title={`Tìm kiếm`}
      placement="right"
      size={250}
      open={openState}
      onClose={handleCloseFilter}
    >
      <Form
        form={filterForm}
        scrollToFirstError={true}
        onFinish={handleFilter}
        className="default_filter_form"
        initialValues={{
          DateFrom: dayjs(),
          DateTo: dayjs(),
          ma_kh: "",
          ten_kh: "",
          dia_chi: "",
          dien_thoai: "",
          phan_loai: "",
          hinh_thuc: "",
          ma_nvbh: "",
        }}
      >
        <div
          className="default_modal_container h-full m-h-0"
          style={{ padding: "0" }}
        >
          <div
            className="default_modal_group_items"
            style={{ flexDirection: "column", gap: "8px" }}
          >
            <span className="default_bold_label">Ngày bắt đầu - kết thúc</span>
            <div className="default_modal_group_items">
              <Form.Item
                name="DateFrom"
                rules={[
                  {
                    required: true,
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
                name="DateTo"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng chọn ngày kết thúc",
                  },
                ]}
              >
                <DatePicker
                  format={"DD/MM/YYYY"}
                  style={{ width: "100%" }}
                  placeholder="Đến ngày"
                />
              </Form.Item>
            </div>
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
            <Space direction="vertical">
              <span className="default_bold_label">Địa chỉ</span>
              <div className="default_modal_group_items">
                <Form.Item name="dia_chi">
                  <Input placeholder="Địa chỉ" />
                </Form.Item>
              </div>
            </Space>
          </div>

          <div className="default_modal_group_items">
            <Space direction="vertical">
              <span className="default_bold_label">Điện thoại</span>
              <div className="default_modal_group_items">
                <Form.Item name="dien_thoai">
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

          <div className="default_modal_group_items">
            <FormSelectDetail
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
          <Button className="default_subsidiary_button" onClick={closeCallback}>
            Huỷ
          </Button>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<i className="pi pi-send"></i>}
              className="default_primary_button"
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
