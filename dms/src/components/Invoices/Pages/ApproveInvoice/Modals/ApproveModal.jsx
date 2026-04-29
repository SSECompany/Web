import { List, Modal, Select, Space } from "antd";
import React, { memo } from "react";

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

const ApproveModal = ({
  showConfirm,
  handleConfirm,
  handleClose,
  vouchersInfo = [],
}) => {
  return (
    <Modal
      open={showConfirm}
      width={"500px"}
      centered
      title="Xác nhận duyệt"
      onCancel={handleClose}
      onOk={handleConfirm}
      okButtonProps={{
        style: {},
      }}
      cancelButtonProps={{ style: { display: "none" } }}
    >
      <List
        itemLayout="horizontal"
        dataSource={vouchersInfo}
        renderItem={(item, index) => (
          <List.Item>
            <List.Item.Meta
              description={
                <span>
                  {`Phiếu: ${item.key} - Trạng thái: ${
                    vouchersInfo.length > 1 ? 0 : item.status
                  }`}
                </span>
              }
            />
          </List.Item>
        )}
      />

      {vouchersInfo.length > 1 && (
        <Select
          suffixIcon={false}
          className="default_select w-full"
          placeholder="Trạng thái"
        >
          {statusOptions.map((option, i) => {
            return (
              <Select.Option
                key={option.value}
                value={option.value}
                label={option.label}
              >
                <Space>
                  <span
                    role="img"
                    className="font-bold"
                    color="red"
                    aria-label={option.label}
                  >
                    {option.value}
                  </span>

                  <span>{option.label}</span>
                </Space>
              </Select.Option>
            );
          })}
        </Select>
      )}
    </Modal>
  );
};

export default memo(ApproveModal);
