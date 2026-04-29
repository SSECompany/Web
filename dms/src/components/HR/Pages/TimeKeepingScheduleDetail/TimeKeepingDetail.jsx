import React from "react";
import {
  Input,
  AutoComplete,
  Badge,
  Calendar,
  Select,
  Space,
  Button,
} from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import {
  SearchOutlined,
  InfoCircleOutlined,
  HeartTwoTone,
  FileTextOutlined,
  SyncOutlined
} from "@ant-design/icons";
import "./TimeKeepingDetail.css";
import OTCreateModal from "../../Modals/OTCreateModal";

const TimeKeepingDetail = () => {

  const [isShowModal, setIsShowModal] = useState(false);


  const [paramsReport, setParamsReport] = useState({
    date: dayjs().month(),
    employee: "",
  });
  const onPanelChange = (value, mode) => {
    console.log(value.format("YYYY-MM-DD"), mode);
  };
  const onselect = (value) => {
    console.log(value);
  };

  const onchangeDatePicker = (value) => {
    setParamsReport({ ...paramsReport, date: value });
  };

  const onShowModal = () => {
    setIsShowModal(!isShowModal)
  };

  return (
    <div className="page_default">
      <div className="page_2_side_right_default">
        <div>
          <div style={{ marginBottom: "20px" }}>
            <div className="default_header_label title_schedule_detail">
              <span
                style={{ fontSize: "20px" }}
                className="default_header_label"
              >
                Chấm công
              </span>
              <div className="work_time_schedule_detail">
                <div>
                  <span
                    className="dark_grey_text_color"
                    style={{ fontSize: "12px" }}
                  >
                    Quy định giờ làm việc:{" "}
                    <span
                      className="main_text_color"
                      style={{ fontSize: "12px" }}
                    >
                      Sáng: 08:30 - 12:00; Chiều: 13:31 - 18:00
                    </span>
                  </span>
                </div>
                <InfoCircleOutlined
                  style={{ fontSize: "20px", color: "#1A4898" }}
                  spin
                />
              </div>
            </div>
          </div>

          <Calendar
            className="default_calendar hr_calender"
            headerRender={({ value, type, onChange, onTypeChange }) => {
              const start = 0;
              const end = 12;
              const monthOptions = [];
              let current = value.clone();
              const localeData = value.localeData();
              const months = [];
              for (let i = 0; i < 12; i++) {
                current = current.month(i);
                months.push(localeData.monthsShort(current));
              }
              for (let i = start; i < end; i++) {
                monthOptions.push(
                  <Select.Option key={i} value={i} className="month-item">
                    {`Tháng ${i + 1}`}
                  </Select.Option>
                );
              }

              return (
                <div className="default_header_table">
                  <h1 className="main-text-color default_header_label">
                    Mạch Hưng
                  </h1>
                  <Space direction="horizontal" className="default_space">
                    <span className="dark_grey_text_color">Mã nhân sự</span>
                    <AutoComplete dropdownMatchSelectWidth={252}>
                      <Input
                        style={{
                          width: "150px",
                          height: "30px",
                        }}
                        size="middle"
                        className="default_input"
                        placeholder="Mã nhân viên..."
                      />
                    </AutoComplete>
                    <span className="dark_grey_text_color">Kỳ lương</span>
                    <Select
                      style={{
                        width: "150px",
                        height: "30px",
                      }}
                      onChange={(newMonth) => {
                        const now = value.clone().month(newMonth);
                        onchangeDatePicker(newMonth);
                        onChange(now);
                      }}
                      defaultValue={paramsReport.date}
                    >
                      {monthOptions}
                    </Select>

                    <Button
                      className="default_primary_button"
                      icon={<SearchOutlined style={{fontSize:'16px'}} />}
                    >
                      Tìm kiếm
                    </Button>
                  </Space>
                </div>
              );
            }}
            mode={"month"}
            disabledDate={(date) => {
              if (date.month() !== parseInt(paramsReport.date)) {
                return true;
              }

              return false;
            }}
          />
        </div>
        <div className="page_2_side_right_default_right_side">
          <div className="page_2_side_right_default_right_side_tools_bar">
            <Button
              className="default_button"
              style={{ height: "35px", borderRadius: "8px" }}
              icon={<FileTextOutlined className="sub_text_color" />}
              onClick={onShowModal}
            >
              Đăng ký OT
            </Button>
            <Button
              className="default_button"
              style={{ height: "35px", borderRadius: "8px" }}
            >
              <SyncOutlined
                style={{ width: "20px" }}
                className="sub_text_color"
              />
            </Button>
          </div>
          <div className="default_rectangle" style={{ width: "306px" }}>
            <div className="default_header_rectangle">
              <h1 className=" default_header_label">Mạch Hưng</h1>
            </div>
            <Space
              direction="horizontal"
              className="default_container_rectangle"
            >
              <span>
                Mạch Hưng <SearchOutlined />
              </span>
              <span>
                Mạch Hưng <SearchOutlined />
              </span>
              <span>
                Mạch Hưng <SearchOutlined />
              </span>
              <span>
                Mạch Hưng <SearchOutlined />
              </span>
              <span>
                Mạch Hưng <SearchOutlined />
              </span>
              <span>
                Mạch Hưng <SearchOutlined />
              </span>
              <span>
                Mạch Hưng <SearchOutlined />
              </span>
            </Space>
          </div>
          <div className="default_rectangle" style={{ width: "306px" }}>
            <div className="default_header_rectangle">
              <h1 className=" default_header_label">Mạch Hưng</h1>
            </div>
            <Space
              direction="horizontal"
              className="default_container_rectangle"
            >
              <span>
                Mạch Hưng <SearchOutlined />
              </span>
              <span>
                Mạch Hưng <SearchOutlined />
              </span>
              <span>
                Mạch Hưng <SearchOutlined />
              </span>
              <span>
                Mạch Hưng <SearchOutlined />
              </span>
              <span>
                Mạch Hưng <SearchOutlined />
              </span>
              <span>
                Mạch Hưng <SearchOutlined />
              </span>
              <span>
                Mạch Hưng <SearchOutlined />
              </span>
              <span>
                Mạch Hưng <SearchOutlined />
              </span>
            </Space>
          </div>
        </div>
      </div>

      <OTCreateModal isOpenSearchModal={isShowModal} handleCloseModal={onShowModal}/>
    </div>
  );
};

export default TimeKeepingDetail;
