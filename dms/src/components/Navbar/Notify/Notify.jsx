import { Avatar, Button, List, Popover, Skeleton } from "antd";
import dayjs from "dayjs";
import React from "react";
import { useSelector } from "react-redux";
import { getUserInfo } from "../../../store/selectors/Selectors";

const Notify = () => {
  const { userName } = useSelector(getUserInfo);

  const popoverContent = (item) => {
    return (
      <div
        className="flex flex-column"
        style={{ width: "40rem", maxHeight: "30rem" }}
      >
        <p className="font-bold">
          <span
            className="sub_text_color font-bold"
            style={{ fontSize: "20pt" }}
          >
            Hi
          </span>{" "}
          <span
            className="primary_color font-bold"
            style={{ fontSize: "20pt" }}
          >
            {userName},
          </span>
        </p>
        <p>Đây là các thông báo gần đây của bạn</p>

        <div className="h-full w-full overflow-y-auto m-h-0">
          <List
            className="mt-3 h-full"
            itemLayout="horizontal"
            dataSource={[
              {
                title:
                  "Đơn hàng mới của khách hàng Mạch Hải Hưng ngày 23/11/2001, cần giao trước 7h30",
                time: dayjs().format("DD/MM/YYYY"),
              },
              {
                title:
                  "Đơn hàng mới của khách hàng Mạch Hải Hưng ngày 23/11/2001, cần giao trước 7h30",
                time: dayjs().format("DD/MM/YYYY"),
              },
              {
                title:
                  "Đơn hàng mới của khách hàng Mạch Hải Hưng ngày 23/11/2001, cần giao trước 7h30",
                time: dayjs().format("DD/MM/YYYY"),
              },
              {
                title:
                  "Đơn hàng mới của khách hàng Mạch Hải Hưng ngày 23/11/2001, cần giao trước 7h30",
                time: dayjs().format("DD/MM/YYYY"),
              },
              {
                title:
                  "Đơn hàng mới của khách hàng Mạch Hải Hưng ngày 23/11/2001, cần giao trước 7h30",
                time: dayjs().format("DD/MM/YYYY"),
              },
              {
                title:
                  "Đơn hàng mới của khách hàng Mạch Hải Hưng ngày 23/11/2001, cần giao trước 7h30",
                time: dayjs().format("DD/MM/YYYY"),
              },
              {
                title:
                  "Đơn hàng mới của khách hàng Mạch Hải Hưng ngày 23/11/2001, cần giao trước 7h30",
                time: dayjs().format("DD/MM/YYYY"),
              },
              {
                title:
                  "Đơn hàng mới của khách hàng Mạch Hải Hưng ngày 23/11/2001, cần giao trước 7h30",
                time: dayjs().format("DD/MM/YYYY"),
              },
              {
                title:
                  "Đơn hàng mới của khách hàng Mạch Hải Hưng ngày 23/11/2001, cần giao trước 7h30",
                time: dayjs().format("DD/MM/YYYY"),
              },
              {
                title:
                  "Đơn hàng mới của khách hàng Mạch Hải Hưng ngày 23/11/2001, cần giao trước 7h30",
                time: dayjs().format("DD/MM/YYYY"),
              },
              {
                title:
                  "Đơn hàng mới của khách hàng Mạch Hải Hưng ngày 23/11/2001, cần giao trước 7h30",
                time: dayjs().format("DD/MM/YYYY"),
              },
              {
                title:
                  "Đơn hàng mới của khách hàng Mạch Hải Hưng ngày 23/11/2001, cần giao trước 7h30",
                time: dayjs().format("DD/MM/YYYY"),
              },
              {
                title:
                  "Đơn hàng mới của khách hàng Mạch Hải Hưng ngày 23/11/2001, cần giao trước 7h30",
                time: dayjs().format("DD/MM/YYYY"),
              },
              {
                title:
                  "Đơn hàng mới của khách hàng Mạch Hải Hưng ngày 23/11/2001, cần giao trước 7h30",
                time: dayjs().format("DD/MM/YYYY"),
              },
              {
                title:
                  "Đơn hàng mới của khách hàng Mạch Hải Hưng ngày 23/11/2001, cần giao trước 7h30",
                time: dayjs().format("DD/MM/YYYY"),
              },
              {
                title:
                  "Đơn hàng mới của khách hàng Mạch Hải Hưng ngày 23/11/2001, cần giao trước 7h30",
                time: dayjs().format("DD/MM/YYYY"),
              },
              {
                title:
                  "Đơn hàng mới của khách hàng Mạch Hải Hưng ngày 23/11/2001, cần giao trước 7h30",
                time: dayjs().format("DD/MM/YYYY"),
              },
              {
                title:
                  "Đơn hàng mới của khách hàng Mạch Hải Hưng ngày 23/11/2001, cần giao trước 7h30",
                time: dayjs().format("DD/MM/YYYY"),
              },
              {
                title:
                  "Đơn hàng mới của khách hàng Mạch Hải Hưng ngày 23/11/2001, cần giao trước 7h30",
                time: dayjs().format("DD/MM/YYYY"),
              },
              {
                title:
                  "Đơn hàng mới của khách hàng Mạch Hải Hưng ngày 23/11/2001, cần giao trước 7h30",
                time: dayjs().format("DD/MM/YYYY"),
              },
              {
                title:
                  "Đơn hàng mới của khách hàng Mạch Hải Hưng ngày 23/11/2001, cần giao trước 7h30",
                time: dayjs().format("DD/MM/YYYY"),
              },
            ]}
            renderItem={(item, index) => (
              <List.Item className="item_in_list p-2">
                <Skeleton avatar title={false} loading={false} active>
                  <List.Item.Meta
                    className="align-items-center"
                    avatar={
                      <Avatar
                        src={`https://api.dicebear.com/7.x/miniavs/svg?seed=${Math.floor(
                          Math.random() * 12
                        )}`}
                      />
                    }
                    title={<span>{item.title}</span>}
                    description={item.time}
                  />
                </Skeleton>
              </List.Item>
            )}
          />
        </div>
      </div>
    );
  };

  return (
    <Popover
      destroyTooltipOnHide={true}
      placement="bottomLeft"
      content={popoverContent()}
      trigger="click"
    >
      <Button shape="circle" className="default_button">
        <i
          className="pi pi-bell primary_color"
          style={{ fontSize: "22px" }}
        ></i>
      </Button>
    </Popover>
  );
};

export default Notify;
