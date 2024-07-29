import { Button, DatePicker, Select } from "antd";
import React from "react";
import TableData from "./Table/TableData";
const { RangePicker } = DatePicker;

const filterContainerStyle = {
  padding: "0px 10px",
  borderRadius: "4px",
  overflow: "hidden",
};

const Options = [
  {
    value: "DXA",
    label: "Đơn hàng bán",
  },
  {
    value: "DMS",
    label: "Sale out",
  },
  {
    value: "PXA",
    label: "Phiếu xuất kho",
  },
];

const statusOptions = [
  {
    value: "0",
    label: "Lập chứng từ",
  },
  {
    value: "1",
    label: "Duyệt",
  },
  {
    value: "2",
    label: "Chờ duyệt",
  },
];

const voucherTypeOptions = [
  {
    value: "0",
    label: "Chưa duyệt",
  },
  {
    value: "1",
    label: "Đã duyệt",
  },
];

const ApproveInvoice = () => {
  return (
    <div className="default_list_layout page_default">
      {/* <HeaderTableBar name={"Albums"} title={"Duyệt chứng từ"} /> */}

      <div className="flex h-full min-h-0 w-full">
        <div
          className="h-full min-h-0 w-full flex flex-column gap-6 hidden_scroll_bar"
          style={{ overflow: "scroll", flex: "75%", order: "1" }}
        >
          <TableData />
          <TableData />
        </div>
        <div
          style={{
            flex: "25%",
            order: "2",
          }}
        >
          <span
            className="default_header_label line-height-4"
            style={{ padding: "10px" }}
          >
            Tìm kiếm
          </span>

          <div
            className="flex flex-column gap-4 h-full"
            style={filterContainerStyle}
          >
            <div
              className="default_rectangle flex flex-column gap-4"
              style={{ background: "var(--light_gray)" }}
            >
              <div
                className="default_modal_group_items"
                style={{ flexDirection: "column", gap: "6px" }}
              >
                <span>Ngày bắt đầu - kết thúc</span>
                <div className="default_modal_group_items">
                  <RangePicker
                    format={"DD/MM/YYYY"}
                    style={{ width: "100%" }}
                    placeholder={["Từ ngày", "Đến ngày"]}
                  />
                </div>
              </div>

              <div
                className="default_modal_group_items"
                style={{ flexDirection: "column", gap: "6px" }}
              >
                <span>Loại chứng từ</span>
                <div className="default_modal_group_items">
                  <Select
                    allowClear={true}
                    className="default_select w-full"
                    suffixIcon={false}
                    filterOption={false}
                    showSearch
                    options={Options}
                    placeholder="Chọn loại chứng từ"
                  />
                </div>
              </div>

              <div
                className="default_modal_group_items"
                style={{ flexDirection: "column", gap: "6px" }}
              >
                <span>Trạng thái</span>
                <div className="default_modal_group_items">
                  <Select
                    allowClear={true}
                    className="default_select w-full"
                    suffixIcon={false}
                    filterOption={false}
                    showSearch
                    options={statusOptions}
                    placeholder="Chọn trạng thái"
                  />
                </div>
              </div>

              <div
                className="default_modal_group_items"
                style={{ flexDirection: "column", gap: "6px" }}
              >
                <span>Kiểu đơn</span>
                <div className="default_modal_group_items">
                  <Select
                    allowClear={true}
                    className="default_select w-full"
                    suffixIcon={false}
                    filterOption={false}
                    showSearch
                    options={voucherTypeOptions}
                    placeholder="Chọn kiểu đơn"
                  />
                </div>
              </div>
              <div>
                <Button className="default_primary_button">Tìm kiếm</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApproveInvoice;
