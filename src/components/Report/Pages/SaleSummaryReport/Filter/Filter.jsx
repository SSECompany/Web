import { Button, DatePicker, Drawer, Form, Space } from "antd";
import dayjs from "dayjs";
import React, { memo } from "react";
import { deleteObjectItems } from "../../../../../app/hooks/dataFormatHelper";
import FormSelectDetail from "../../../../ReuseComponents/FormSelectDetail";

const Filter = ({ openState, closeCallback, filterCallback }) => {
  const [filterForm] = Form.useForm();

  const handleFilter = (item) => {
    const filterData = deleteObjectItems(item, [
      "itemName",
      "customerName",
      "stockName",
    ]);

    const prepareData = {
      ...filterData,
      DateFrom: dayjs(filterData.DateFrom).add(1, "day"),
      DateTo: dayjs(filterData.DateTo).add(1, "day"),
    };

    filterCallback(prepareData);
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
          DateFrom: null,
          DateTo: null,
          stockCode: "",
          customerCode: "",
          itemCode: "",
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
              controller={"dmvt_lookup"}
              keyCode="itemCode"
              keyName="itemName"
              label="Vật tư"
              placeHolderCode="Vật tư"
              placeHolderName="Tên vật tư"
              form={filterForm}
              direction="column"
            />
          </div>

          <div className="default_modal_group_items">
            <FormSelectDetail
              width={100}
              codeWidth={120}
              controller={"dmkh_lookup"}
              keyCode="customerCode"
              keyName="customerName"
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
              controller={"dmkho_lookup"}
              keyCode="stockCode"
              keyName="stockName"
              label="Mã kho"
              placeHolderCode="Kho"
              placeHolderName="Tên kho"
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
