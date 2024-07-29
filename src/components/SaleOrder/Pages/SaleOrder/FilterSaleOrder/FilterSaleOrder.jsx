import { Button, Drawer, Form, Input, Space } from "antd";
import React, { memo, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import FormSelectDetailv2 from "../../../../ReuseComponents/FormSelectDetailv2";
import { setOpenSaleOrderFilter } from "../../../Store/Sagas/SaleOrderActions";
import { getSaleOrderInfo } from "../../../Store/Selector/Selector";

const FilterSaleOrder = ({ onFilter }) => {
  const [filterForm] = Form.useForm();
  const [isOpen, setIsOpen] = useState(false);

  const { isOpenFilter, filterInfo } = useSelector(getSaleOrderInfo);

  const handleCloseFilter = () => {
    setOpenSaleOrderFilter(false);
  };

  const handleCancelFilter = async () => {
    const data = { ...filterInfo };
    data.ma_kh = data.ma_kh_search;
    delete data["ma_kh_search"];

    filterForm.resetFields();
    handleCloseFilter();
    await onFilter(data);
  };

  const handleFilter = async () => {
    const data = { ...(await filterForm.getFieldsValue()) };
    data.ma_kh = data.ma_kh_search;
    delete data["ma_kh_search"];
    await onFilter(data);
    handleCloseFilter();
  };

  useEffect(() => {
    setIsOpen(isOpenFilter);
    return () => {
      setIsOpen(false);
    };
  }, [isOpenFilter]);

  useEffect(() => {
    if (isOpen) {
      document.getElementById("ma_kh_search").focus();
      document.getElementById("ma_kh_search").scrollIntoView();
    }
  }, [isOpen]);

  return (
    <Drawer
      title={`Tìm kiếm`}
      placement="right"
      size={250}
      open={isOpenFilter}
      onClose={handleCloseFilter}
      destroyOnClose={true}
    >
      <Form
        initialValues={filterInfo}
        form={filterForm}
        scrollToFirstError={true}
        className="default_filter_form"
      >
        <div className="default_modal_container" style={{ overflowY: "auto" }}>
          <div className="default_modal_group_items">
            <FormSelectDetailv2
              width={100}
              codeWidth={120}
              controller={"dmkh_lookup"}
              keyCode="ma_kh_search"
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
            <Space direction="vertical">
              <span className="default_bold_label">Số chứ từ</span>
              <div className="default_modal_group_items">
                <Form.Item name="so_tu">
                  <Input placeholder="Từ" />
                </Form.Item>

                <Form.Item name="so_den">
                  <Input placeholder="Đến" />
                </Form.Item>
              </div>
            </Space>
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
            <Button onClick={handleFilter} className="default_primary_button">
              Tìm kiếm
            </Button>
          </Form.Item>
        </Space>
      </Form>
    </Drawer>
  );
};

export default memo(FilterSaleOrder);
