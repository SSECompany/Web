import { Button, Space, Table } from "antd";
import React, { useState } from "react";
import send_icon from "../../../../Icons/send_icon.svg";
import "./Maps.css";

const Maps = () => {
  const [selectedLatlong1, setSelectedLatlong1] = useState(
    "20.996257312359095, 105.80254243742307"
  );
  const [selectedLatlong2, setSelectedLatlong2] = useState(
    "20.996257312359095, 105.80254243742307"
  );
  const [selectedCustomer, setSelectedCustomer] = useState(
    "Công ty giải pháp phần mềm doanh nghiệp SSE"
  );
  const columns = [
    {
      title: "Mã khách",
      dataIndex: "Customer",
    },
    {
      title: "Tên khách",
      dataIndex: "CustomerName",
    },
    {
      title: "latlong 1",
      dataIndex: "Latlong1",
    },
    {
      title: "latlong 2",
      dataIndex: "Latlong2",
    },
  ];

  const data = [
    {
      key: "1",
      Customer: "1",
      CustomerName: "Nguyễn Văn A",
      Latlong1: "20.860175213385094,106.71715939176144",
      Latlong2: "21.00743596296013,105.80767237878683",
    },
    {
      key: "2",
      Customer: "2",
      CustomerName: "Nguyễn Văn B",
      Latlong1: "21.00816279058528,105.80772438244556",
      Latlong2: "21.0136857,105.7995227",
    },
    {
      key: "3",
      Customer: "3",
      CustomerName: "Nguyễn Văn C",
      Latlong1: "21.0274954,105.7729537",
      Latlong2: "21.0324386,105.7700469",
    },
    {
      key: "4",
      Customer: "4",
      CustomerName: "Nguyễn Văn D",
      Latlong1: "21.0323722,105.7719977",
      Latlong2: "21.0181842,105.7915226",
    },
  ];

  return (
    <div className="abnormal__location__container page_default">
      <div className="abnormal__location__customers">
        <Table
          columns={columns}
          rowSelection={{
            type: "radio",
            onChange: (selectedRowKeys, selectedRows) => {
              setSelectedLatlong1(selectedRows[0].Latlong1);
              setSelectedLatlong2(selectedRows[0].Latlong2);
              setSelectedCustomer(selectedRows[0].CustomerName);
            },
          }}
          rowKey={(record) => record.key}
          dataSource={data}
          rowClassName={"default_table_row"}
          className="default_table_none_pagination"
          pagination={{
            position: ["none"],
            showSizeChanger: false,
            className: "default_pagination_bar",
          }}
        />
      </div>
      <div className="abnormal__location__title">
        <span className="default_header_label">
          Khách hàng:{" "}
          <span className="default_header_label sub_text_color">
            {selectedCustomer}
          </span>
        </span>
      </div>
      <div className="abnormal__location__maps ">
        <iframe
          src={`https://maps.google.com/maps?q=${selectedLatlong1}&z=15&output=embed`}
          title="google map projection 1"
          className="gg__map__embed"
        ></iframe>

        <iframe
          src={`https://maps.google.com/maps?q=${selectedLatlong2}&z=15&output=embed`}
          title="google map projection 1"
          className="gg__map__embed"
        ></iframe>
      </div>
      <div className="abnormal__location__tools">
        <Space
          style={{
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
          }}
        >
          <Button className="default_subsidiary_button">Huỷ</Button>

          <Button
            className="default_primary_button"
            icon={<img src={send_icon} alt="" />}
          >
            Chấp thuận
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default Maps;
