import { Divider, List, Modal } from "antd";
import React, { memo } from "react";
import { FILE_EXTENSION } from "../../utils/constants";

const PrintList = ({ callBackClick, layouts, openState, onCancel }) => {
  return (
    <Modal
      open={openState}
      title={
        <div>
          <span>Danh sách mẫu in</span>
          <Divider style={{ margin: "12px 0px" }} />
        </div>
      }
      okButtonProps={{ style: { display: "none" } }}
      onCancel={onCancel}
      okText="Nhận"
      cancelText="Huỷ"
    >
      <List
        itemLayout="horizontal"
        dataSource={layouts}
        renderItem={(item, index) => (
          <List.Item
            className="item_in_list"
            style={{ cursor: "pointer" }}
            onClick={() => {
              callBackClick(item);
              onCancel();
            }}
          >
            <List.Item.Meta
              avatar={
                item.type === FILE_EXTENSION.PDF ? (
                  <i
                    className="pi pi-file-pdf"
                    style={{ fontSize: "2rem", color: " #F40F02" }}
                  ></i>
                ) : (
                  <i
                    className="pi  pi-file-excel"
                    style={{ fontSize: "2rem", color: "#1D6F42" }}
                  ></i>
                )
              }
              title={item.title}
            />
          </List.Item>
        )}
      />
    </Modal>
  );
};

export default memo(PrintList);
