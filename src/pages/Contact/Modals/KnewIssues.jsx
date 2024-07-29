import { List, Modal } from "antd";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import emitter from "../../../utils/emitter";

const KnewIssues = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [listIssues, setListIssues] = useState([]);

  const handleCloseModal = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    emitter.on("OPEN_KNEW_ISSUES_MODAL", () => {
      setIsOpen(true);
    });

    setListIssues([
      {
        title: "Đơn hàng bán",
        description: "lorem 1231231212312312",
        statusName: "Hoàn thành",
        statusCode: 2,
        createDate: dayjs().format("DD/MM/YYYY hh:mm:ss"),
        updateDate: dayjs().format("DD/MM/YYYY hh:mm:ss"),
      },
      {
        title: "Hoá đơn bán hàng",
        description: "lorem 1231231212312312",
        statusName: "Tiếp nhận",
        statusCode: 0,
        createDate: dayjs().format("DD/MM/YYYY hh:mm:ss"),
        updateDate: dayjs().format("DD/MM/YYYY hh:mm:ss"),
      },
      {
        title: "Lệnh sản xuất",
        description: "lorem 1231231212312312",
        statusName: "Chờ xử lý",
        statusCode: 1,
        createDate: dayjs().format("DD/MM/YYYY hh:mm:ss"),
        updateDate: dayjs().format("DD/MM/YYYY hh:mm:ss"),
      },
      {
        title: "Sale out",
        description: "lorem 1231231212312312",
        statusName: "Chờ xử lý",
        statusCode: 1,
        createDate: dayjs().format("DD/MM/YYYY hh:mm:ss"),
        updateDate: dayjs().format("DD/MM/YYYY hh:mm:ss"),
      },
      {
        title: "Sale out",
        description: "lorem 1231231212312312",
        statusName: "Chờ xử lý",
        statusCode: 1,
        createDate: dayjs().format("DD/MM/YYYY hh:mm:ss"),
        updateDate: dayjs().format("DD/MM/YYYY hh:mm:ss"),
      },
      {
        title: "Sale out",
        description: "lorem 1231231212312312",
        statusName: "Chờ xử lý",
        statusCode: 1,
        createDate: dayjs().format("DD/MM/YYYY hh:mm:ss"),
        updateDate: dayjs().format("DD/MM/YYYY hh:mm:ss"),
      },
      {
        title: "Sale out",
        description: "lorem 1231231212312312",
        statusName: "Chờ xử lý",
        statusCode: 1,
        createDate: dayjs().format("DD/MM/YYYY hh:mm:ss"),
        updateDate: dayjs().format("DD/MM/YYYY hh:mm:ss"),
      },
      {
        title: "Sale out",
        description: "lorem 1231231212312312",
        statusName: "Chờ xử lý",
        statusCode: 1,
        createDate: dayjs().format("DD/MM/YYYY hh:mm:ss"),
        updateDate: dayjs().format("DD/MM/YYYY hh:mm:ss"),
      },
      {
        title: "Sale out",
        description: "lorem 1231231212312312",
        statusName: "Chờ xử lý",
        statusCode: 1,
        createDate: dayjs().format("DD/MM/YYYY hh:mm:ss"),
        updateDate: dayjs().format("DD/MM/YYYY hh:mm:ss"),
      },
      {
        title: "Sale out",
        description: "lorem 1231231212312312",
        statusName: "Chờ xử lý",
        statusCode: 1,
        createDate: dayjs().format("DD/MM/YYYY hh:mm:ss"),
        updateDate: dayjs().format("DD/MM/YYYY hh:mm:ss"),
      },
    ]);
  }, []);

  return (
    <div>
      <Modal
        open={isOpen}
        width={"50%"}
        title="Vấn đề đã biết"
        destroyOnClose={true}
        onCancel={handleCloseModal}
        cancelText="Đóng"
        centered
        okButtonProps={{ style: { display: "none" } }}
      >
        <div className="list__knew__issues">
          <List
            itemLayout="horizontal"
            dataSource={listIssues}
            renderItem={(item, index) => (
              <List.Item
                actions={[
                  <span
                    className={
                      item.statusCode === 0
                        ? "warnning_text_color"
                        : item.statusCode === 1
                        ? "warnning_text_color"
                        : "success_text_color"
                    }
                  >
                    {item.statusName} - {item.updateDate}
                  </span>,
                ]}
              >
                <List.Item.Meta
                  title={<p>{`#${index + 1} ${item.title}`}</p>}
                  description={
                    <div>
                      <p>{item.description}</p>
                      <p>Ngày tạo: {item.createDate}</p>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </div>
      </Modal>
    </div>
  );
};

export default KnewIssues;
