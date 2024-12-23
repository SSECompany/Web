import {
  CheckCircleOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  SaveOutlined,
  SendOutlined,
} from "@ant-design/icons";
import { Avatar, Button, Input, Segmented, Space } from "antd";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { filterKeyHelper } from "../../../../../app/Functions/filterHelper";
import LoadingComponents from "../../../../Loading/LoadingComponents";
import { SoFuckingUltimateGetApi } from "../../../API";
import "./ReplyTicket.css";

const ReplyTicket = () => {
  // initialize #########################################################################
  const [data, setData] = useState();
  const [loading, setLoading] = useState(false);
  const [tableColumns, setTableColumns] = useState([]);
  const [tableParams, setTableParams] = useState({
    orderby: "ma_kh",
    ma_kh: "",
    ten_kh: "",
    ten_nvbh: "",
    ma_nv: "",
  });
  const [pagination, setPagination] = useState({
    pageindex: 1,
    pageSize: 10,
  });
  const [totalResults, setTotalResults] = useState(0);
  const [ticketData, setTicketData] = useState([]);
  const [selectedItem, setSelectedItem] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [replyContain, setReplyContain] = useState("");

  //functions #########################################################################

  const refreshData = () => {
    setPagination({ ...pagination, pageindex: 1, current: 1 });
    if (pagination.pageindex === 1) {
      setLoading(true);
    }
  };

  const getdata = () => {
    const params = { ...tableParams, oderby: tableParams.orderby };
    delete params.orderby;

    SoFuckingUltimateGetApi({
      store: "get_vticket",
      data: {
        ...{ ...params, oderby: tableParams.orderby },
        ...pagination,
      },
    }).then((res) => {
      setTicketData(res.data);
      setSelectedItem(res.data[0]);
      setLoading(false);
    });
  };

  const handleClickItem = (item) => {
    console.log(item);
    setSelectedItem(item);
  };

  const handleEditReply = () => {
    setIsEditing(true);
  };

  const handleEditReplyCancel = () => {
    setIsEditing(false);
  };

  const handleEditReplySave = () => {
    setSelectedItem({ ...selectedItem, phan_hoi: replyContain });
    setIsEditing(false);
  };

  const handleDeleteReply = () => {
    console.log("DELETE");
    refreshData();
    setIsEditing(false);
  };

  const handleSearch = useDebouncedCallback((e) => {
    const searchValue = filterKeyHelper(e.target.value);
    setTableParams({ ...tableParams, keywords: searchValue });
  }, 600);

  const handleChangeReply = useDebouncedCallback((e) => {
    setReplyContain(e.target.value);
  }, 600);

  // effectively #########################################################################
  useEffect(() => {
    console.log("Changed");
    setLoading(true);
    getdata();
  }, [JSON.stringify(tableParams), pagination]);

  return (
    <div className="page_2_side_default">
      <div
        className="page_2_side_default_left ticket__container relative"
        style={{ flex: "0.3" }}
      >
        <div className="ticket__tools_bar">
          <Input
            style={{
              width: "150px",
              height: "30px",
            }}
            size="middle"
            onChange={handleSearch}
            className="default_input"
            placeholder="Tìm kiếm..."
          />

          <Segmented
            options={[
              {
                value: "Checked",
                icon: <CheckCircleOutlined style={{ color: "#5cb85c" }} />,
              },
              {
                value: "UnChecked",
                icon: (
                  <ExclamationCircleOutlined style={{ color: "#ffcc00" }} />
                ),
              },
            ]}
          />
        </div>

        {loading ? (
          <LoadingComponents loading={loading} text="Đang tải" size={50} />
        ) : (
          <div className="ticket__container__detail">
            {ticketData.map((item, index) => (
              <div
                key={index}
                className={`ticket__card ${
                  item.id_ticket === selectedItem.id_ticket
                    ? "ticket__selected"
                    : ""
                }`}
                onClick={(e) => {
                  handleClickItem(item);
                }}
              >
                <div className="ticket__info__container">
                  <Avatar
                    size={50}
                    style={{
                      backgroundColor: "#fde3cf",
                      color: "#f56a00",
                      verticalAlign: "middle",
                      flexShrink: 0,
                    }}
                  >
                    {item?.ma_kh?.substr(0, 1)}
                  </Avatar>
                  <div className="ticket__detail__container">
                    <p style={{ fontWeight: "bold" }}>
                      {item?.ten_kh ? item?.ten_kh.trim() : "Không có dữ liệu"}
                    </p>

                    <p>{dayjs(item?.time).format("DD/MM/YYYY")}</p>

                    <span>{item?.dien_giai.trim()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        className="page_2_side_default_right  right__side__ticket__detail"
        style={{ flex: "0.7", background: "#fff" }}
      >
        <div className="detail__info__customer__container">
          <Space
            className="detail__info__customer"
            direction="horizontal"
            style={{
              justifyContent: "space-between",
              padding: "10px",
            }}
            align="start"
          >
            <Space className="detail__customer" align="start">
              <Avatar
                size={50}
                style={{
                  backgroundColor: "#fde3cf",
                  color: "#f56a00",
                  verticalAlign: "middle",
                  flexShrink: 0,
                }}
              >
                {selectedItem?.ma_kh ? selectedItem?.ma_kh.substr(0, 1) : ""}
              </Avatar>
              <Space direction="vertical">
                <span>
                  Mã khách:{" "}
                  <span
                    className="main_text_color"
                    style={{ fontWeight: "bold" }}
                  >
                    {selectedItem?.ma_kh}
                  </span>
                </span>
                <span>
                  Tên khách:{" "}
                  <span
                    className="main_text_color"
                    style={{ fontWeight: "bold" }}
                  >
                    {selectedItem?.ten_kh
                      ? selectedItem?.ten_kh
                      : "Không có dữ liệu"}
                  </span>
                </span>
              </Space>
            </Space>
            <Space direction="vertical">
              <span>
                Loại :{" "}
                <span
                  className="main_text_color"
                  style={{ fontWeight: "bold" }}
                >
                  {selectedItem?.ten_loai
                    ? selectedItem?.ten_loai
                    : "Không có dữ liệu"}
                </span>
              </span>
              <span>
                Ngày :{" "}
                <span
                  className="main_text_color"
                  style={{ fontWeight: "bold" }}
                >
                  {selectedItem?.time
                    ? dayjs(selectedItem?.time).format("DD/MM/YYYY")
                    : "Không có dữ liệu"}
                </span>
              </span>
              <span>
                Giờ :{" "}
                <span
                  className="main_text_color"
                  style={{ fontWeight: "bold" }}
                >
                  {selectedItem?.time
                    ? dayjs(selectedItem?.time).format("HH:mm:ss")
                    : "Không có dữ liệu"}
                </span>
              </span>
            </Space>
          </Space>

          <Space
            className="detail__description__container"
            direction="vertical"
          >
            <span className="default_header_label">Nội dung :</span>
            <span>{selectedItem?.dien_giai}</span>
          </Space>

          <Space
            direction="vertical"
            style={{ padding: "10px" }}
            className={`${selectedItem?.status == 0 ? "hidden" : ""}`}
          >
            <Space
              style={{
                justifyContent: "space-between",
                width: "100%",
                paddingBottom: "15px",
              }}
              align="start"
            >
              <span className="default_header_label">Phản hồi :</span>
              <Space direction="vertical">
                <span>
                  Nhân viên :{" "}
                  <span
                    className="main_text_color"
                    style={{ fontWeight: "bold" }}
                  >
                    {selectedItem?.ten_nvbh2
                      ? selectedItem?.ten_nvbh2
                      : "Không có dữ liệu"}
                  </span>
                </span>
                <span>
                  Ngày :{" "}
                  <span
                    className="main_text_color"
                    style={{ fontWeight: "bold" }}
                  >
                    {selectedItem?.time2
                      ? dayjs(selectedItem?.time2).format("DD/MM/YYYY HH:mm:ss")
                      : "Không có dữ liệu"}
                  </span>
                </span>
              </Space>
            </Space>
            <div
              className={`reply__contain ${isEditing ? "reply__editing" : ""}`}
            >
              {isEditing ? (
                <Input.TextArea
                  style={{ width: "100%" }}
                  autoSize={{
                    minRows: 1,
                    maxRows: 6,
                  }}
                  onChange={handleChangeReply}
                  defaultValue={selectedItem?.phan_hoi}
                  placeholder="Nội dung..."
                ></Input.TextArea>
              ) : (
                <span>{selectedItem?.phan_hoi}</span>
              )}

              {isEditing ? (
                <Space>
                  <Button
                    onClick={handleEditReplyCancel}
                    shape="circle"
                    icon={<CloseOutlined />}
                  />
                  <Button
                    onClick={handleEditReplySave}
                    danger={false}
                    type="primary"
                    shape="circle"
                    icon={<SaveOutlined />}
                  />
                </Space>
              ) : (
                <Space>
                  <Button
                    className="edit__reply__btn"
                    onClick={handleEditReply}
                    type="primary"
                    shape="circle"
                    icon={<EditOutlined />}
                  />
                  <Button
                    className="edit__reply__btn"
                    onClick={handleDeleteReply}
                    danger
                    shape="circle"
                    icon={<DeleteOutlined />}
                  />
                </Space>
              )}
            </div>
          </Space>
        </div>

        <div className="reply__ticket__container">
          <Input.TextArea
            style={{ width: "100%" }}
            autoSize={{
              minRows: 1,
              maxRows: 6,
            }}
            placeholder="Nội dung..."
          ></Input.TextArea>
          <Button type="primary" shape="circle" icon={<SendOutlined />} />
        </div>
      </div>
    </div>
  );
};

export default ReplyTicket;
