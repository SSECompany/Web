import { CaretRightOutlined } from "@ant-design/icons";
import { Collapse, Modal } from "antd";
import React, { useEffect, useState } from "react";
import emitter from "../../../utils/emitter";

const text = `
  A dog is a type of domesticated animal.
  Known for its loyalty and faithfulness,
  it can be found as a welcome guest in many households across the world.
`;

const panelStyle = {
  marginBottom: 6,
  border: "none",
};

const FAQs = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [listFAQs, setListFAQs] = useState([]);

  const handleCloseModal = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    emitter.on("OPEN_FAQS_MODAL", () => {
      setIsOpen(true);
    });

    setListFAQs([
      {
        key: 1,
        label: "Đơn hàng bán",
        children: text,
        style: panelStyle,
      },
      {
        key: 2,
        label: "Hoá đơn bán hàng",
        children: text,
        style: panelStyle,
      },
      {
        key: 3,
        label: "Lệnh sản xuất",
        children: text,
        style: panelStyle,
      },
      {
        key: 4,
        label: "Sale out",
        children: text,
        style: panelStyle,
      },
      {
        key: 5,
        label: "Sale out",
        children: text,
        style: panelStyle,
      },
    ]);

    return () => {
      emitter.removeAllListeners();
    };
  }, []);

  return (
    <Modal
      open={isOpen}
      width={"50%"}
      title="Câu hỏi thường gặp"
      destroyOnClose={true}
      onCancel={handleCloseModal}
      cancelText="Đóng"
      centered
      okButtonProps={{ style: { display: "none" } }}
    >
      <Collapse
        bordered={false}
        expandIcon={({ isActive }) => (
          <CaretRightOutlined rotate={isActive ? 90 : 0} />
        )}
        items={listFAQs}
      />
    </Modal>
  );
};

export default FAQs;
